"""Tests for support tickets: lifecycle, scoping, admin notifications."""

from rest_framework import status

from api.models import Notification, Ticket, TicketMessage
from api.tests.common import BaseTestCase


class TicketTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader", email="trader@example.com"))

    def _payload(self, **extra):
        payload = {
            "subject": "مشکل در پرداخت",
            "topic": "پرداخت",
            "status": "باز",
            "user": "Trader",
            "email": "trader@example.com",
        }
        payload.update(extra)
        return payload

    def test_create_ticket(self):
        r = self.client.post("/api/tickets/", self._payload(), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["subject"], "مشکل در پرداخت")
        self.assertEqual(r.data["status"], "باز")
        self.assertEqual(r.data["messages"], [])

    def test_create_notifies_admins(self):
        admin = self.make_staff(username="admin1")
        self.client.post("/api/tickets/", self._payload(), format="json")
        n = Notification.objects.filter(kind="ticket", user=admin).first()
        self.assertIsNotNone(n)
        self.assertIn("تیکت جدید", n.title)

    def test_user_sees_only_own_tickets(self):
        self.client.post("/api/tickets/", self._payload(), format="json")
        other = self.make_user(username="other", email="other@example.com")
        self.auth(other)
        self.client.post(
            "/api/tickets/",
            {"subject": "تیکت دیگر", "topic": "فنی", "user": "Other", "email": "other@example.com"},
            format="json",
        )
        # Back to the original user
        self.auth(self.user)
        subjects = [t["subject"] for t in self.get_list("/api/tickets/")]
        self.assertIn("مشکل در پرداخت", subjects)
        self.assertNotIn("تیکت دیگر", subjects)

    def test_vip_role_is_not_admin_and_gets_no_ticket_notifications(self):
        """DEV-148 + DEV-141: VIP is a perk, not an admin grant.

        A `vip`-role user used to pass `_is_admin_user`, so admin notifications
        about other users' tickets landed in their bell. Only the explicit
        "admin" role (or Django staff) gets admin notifications now.
        """
        from django.contrib.auth import get_user_model
        vuser = self.make_user(username="vip", email="vip@example.com")
        self.make_profile(vuser, role="vip")
        self.auth(vuser)
        # The vip user can create a ticket (their own)…
        self.client.post(
            "/api/tickets/", self._payload(email="vip@example.com"), format="json"
        )
        # …but is NOT notified about other users' tickets like an admin,
        # and cannot list other users' tickets.
        self.auth(self.make_user(username="other", email="other@example.com"))
        self.client.post(
            "/api/tickets/",
            {"subject": "تیکت دیگر", "topic": "فنی", "user": "Other", "email": "other@example.com"},
            format="json",
        )
        self.assertFalse(
            Notification.objects.filter(kind="ticket", user=vuser).exists(),
            "vip must not receive admin ticket notifications",
        )
        self.auth(vuser)
        subjects = [t["subject"] for t in self.get_list("/api/tickets/")]
        self.assertEqual(subjects, ["مشکل در پرداخت"])

    def test_admin_sees_all_tickets(self):
        self.client.post("/api/tickets/", self._payload(), format="json")
        self.auth_staff()
        self.assertEqual(len(self.get_list("/api/tickets/")), 1)

    def test_anonymous_list_is_empty(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.get_list("/api/tickets/"), [])

    def test_user_reply(self):
        r = self.client.post("/api/tickets/", self._payload(), format="json")
        tid = r.data["id"]
        r = self.client.post(
            f"/api/tickets/{tid}/reply/",
            {"author": "user", "body": "جزئیات بیشتر", "authorName": "Trader"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["body"], "جزئیات بیشتر")
        ticket = Ticket.objects.get(pk=tid)
        self.assertEqual(ticket.status, "باز")
        self.assertEqual(ticket.messages.count(), 1)

    def test_user_reply_after_closed_reopens(self):
        r = self.client.post("/api/tickets/", self._payload(status="بسته"), format="json")
        tid = r.data["id"]
        self.client.post(
            f"/api/tickets/{tid}/reply/",
            {"author": "user", "body": "دوباره باز"},
            format="json",
        )
        self.assertEqual(Ticket.objects.get(pk=tid).status, "باز")

    def test_admin_reply_marks_answered_and_notifies_owner(self):
        owner = self.make_user(username="owner", email="owner@example.com")
        self.auth(owner)
        self.client.post(
            "/api/tickets/",
            {"subject": "سوال", "topic": "سایر", "user": "Owner", "email": "owner@example.com"},
            format="json",
        )
        admin = self.auth_staff()
        ticket = Ticket.objects.get(email="owner@example.com")
        r = self.client.post(
            f"/api/tickets/{ticket.pk}/reply/",
            {"author": "admin", "body": "پاسخ پشتیبانی", "authorName": "پشتیبانی"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, "پاسخ داده شد")
        n = Notification.objects.filter(kind="ticket", user=owner).first()
        self.assertIsNotNone(n)
        self.assertIn("پاسخ جدید", n.title)

    def test_reply_requires_body(self):
        r = self.client.post("/api/tickets/", self._payload(), format="json")
        r = self.client.post(
            f"/api/tickets/{r.data['id']}/reply/", {"author": "user"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_set_status(self):
        r = self.client.post("/api/tickets/", self._payload(), format="json")
        tid = r.data["id"]
        admin = self.auth_staff()
        r = self.client.post(
            f"/api/tickets/{tid}/set_status/", {"status": "در حال بررسی"}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "در حال بررسی")

    def test_set_status_invalid_returns_400(self):
        r = self.client.post("/api/tickets/", self._payload(), format="json")
        self.auth_staff()
        r = self.client.post(
            f"/api/tickets/{r.data['id']}/set_status/", {"status": "نامعتبر"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_ticket_ownership_comes_from_the_signed_in_user(self):
        """DEV-155: the client cannot file a ticket under another address.

        `email`/`user` are display copies of the account; trusting the body let
        a stale `dlea:user` in localStorage (or a crafted request) attach the
        ticket to somebody else, who then saw it in their list and got its
        notifications.
        """
        self.client.post(
            "/api/tickets/",
            self._payload(email="victim@example.com", user="Victim"),
            format="json",
        )
        ticket = Ticket.objects.latest("id")
        self.assertEqual(ticket.email, "trader@example.com")
        self.assertNotEqual(ticket.user, "Victim")

    def test_admin_reply_notifies_the_creator_not_a_spoofed_owner(self):
        """DEV-155: a spoofed owner email must not receive the reply notification."""
        victim = self.make_user(username="victim", email="victim@example.com")
        self.client.post(
            "/api/tickets/",
            self._payload(email="victim@example.com", user="Victim"),
            format="json",
        )
        ticket = Ticket.objects.latest("id")
        self.auth_staff()
        self.client.post(
            f"/api/tickets/{ticket.pk}/reply/",
            {"author": "admin", "body": "پاسخ پشتیبانی"},
            format="json",
        )
        self.assertFalse(Notification.objects.filter(kind="ticket", user=victim).exists())
        self.assertTrue(
            Notification.objects.filter(kind="ticket", user=self.user).exists()
        )

    def test_anonymous_ticket_keeps_no_address(self):
        """DEV-155: a guest cannot attach a ticket (and its replies) to an account."""
        victim = self.make_user(username="victim", email="victim@example.com")
        self.client.force_authenticate(user=None)
        self.client.post(
            "/api/tickets/",
            self._payload(email="victim@example.com", user="Victim"),
            format="json",
        )
        ticket = Ticket.objects.latest("id")
        self.assertEqual(ticket.email, "")
        self.auth_staff()
        self.client.post(
            f"/api/tickets/{ticket.pk}/reply/",
            {"author": "admin", "body": "پاسخ"},
            format="json",
        )
        self.assertFalse(Notification.objects.filter(kind="ticket", user=victim).exists())

    def test_message_time_is_jalali(self):
        r = self.client.post("/api/tickets/", self._payload(), format="json")
        tid = r.data["id"]
        r = self.client.post(
            f"/api/tickets/{tid}/reply/", {"author": "user", "body": "سلام"}, format="json"
        )
        self.assertIn("time", r.data)
        self.assertTrue(r.data["time"].startswith("۱۴۰۵"))