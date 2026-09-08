"""Tests for journal groups + entries, including Jalali date output and scoping."""

from datetime import date

from rest_framework import status

from api.models import JournalEntry, JournalGroup
from api.tests.common import BaseTestCase


class JournalGroupTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.p1 = self.make_portfolio(user=self.user, name="اصلی")
        self.p2 = self.make_portfolio(user=self.user, name="دوم", is_active=False)

    def test_create_assigns_active_portfolio(self):
        r = self.client.post(
            "/api/journal/groups/", {"name": "گروه فعال"}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        g = JournalGroup.objects.get(pk=r.data["id"])
        self.assertEqual(g.portfolio_id, self.p1.pk)

    def test_create_with_explicit_portfolio(self):
        r = self.client.post(
            "/api/journal/groups/",
            {"name": "گروه دوم", "portfolio_id": self.p2.pk},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        g = JournalGroup.objects.get(pk=r.data["id"])
        self.assertEqual(g.portfolio_id, self.p2.pk)

    def test_create_rejects_foreign_portfolio(self):
        foreign = self.make_portfolio(user=self.make_user(username="other"))
        r = self.client.post(
            "/api/journal/groups/",
            {"name": "x", "portfolio_id": foreign.pk},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_create_requires_portfolio(self):
        self.auth(self.make_user(username="noport"))
        r = self.client.post(
            "/api/journal/groups/", {"name": "x"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_portfolio_filter(self):
        self.make_journal_group(user=self.user, name="در پورت اول", portfolio=self.p1)
        self.make_journal_group(user=self.user, name="در پورت دوم", portfolio=self.p2)
        names = [
            g["name"]
            for g in self.get_list("/api/journal/groups/", portfolio=self.p1.pk)
        ]
        self.assertIn("در پورت اول", names)
        self.assertNotIn("در پورت دوم", names)

    def test_crud_roundtrip(self):
        r = self.client.post(
            "/api/journal/groups/", {"name": "روند", "color": "blue"}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        gid = r.data["id"]

        items = self.get_list("/api/journal/groups/")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "روند")

        r = self.client.patch(f"/api/journal/groups/{gid}/", {"name": "تغییر"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["name"], "تغییر")

        r = self.client.delete(f"/api/journal/groups/{gid}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(JournalGroup.objects.filter(pk=gid).exists())

    def test_scoping(self):
        self.make_journal_group(user=self.user, name="من")
        self.make_journal_group(user=self.make_user(username="other"), name="دیگری")
        names = [g["name"] for g in self.get_list("/api/journal/groups/")]
        self.assertIn("من", names)
        self.assertNotIn("دیگری", names)


class JournalEntryTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.p1 = self.make_portfolio(user=self.user, name="اصلی")
        self.p2 = self.make_portfolio(user=self.user, name="دوم", is_active=False)
        self.group = self.make_journal_group(user=self.user, portfolio=self.p1)

    def test_create_defaults_to_active_portfolio(self):
        r = self.client.post(
            "/api/journal/entries/", self._payload(), format="json"
        )
        self.assertEqual(r.status_code, 201)
        entry = JournalEntry.objects.get(pk=r.data["id"])
        self.assertEqual(entry.portfolio_id, self.p1.pk)

    def test_create_with_explicit_portfolio(self):
        r = self.client.post(
            "/api/journal/entries/",
            self._payload(portfolio_id=self.p2.pk),
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        entry = JournalEntry.objects.get(pk=r.data["id"])
        self.assertEqual(entry.portfolio_id, self.p2.pk)

    def test_create_rejects_foreign_portfolio(self):
        foreign = self.make_portfolio(user=self.make_user(username="other"))
        r = self.client.post(
            "/api/journal/entries/",
            self._payload(portfolio_id=foreign.pk),
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_create_rejects_group_from_another_portfolio(self):
        other_group = self.make_journal_group(
            user=self.user, name="گروه پورت دوم", portfolio=self.p2
        )
        r = self.client.post(
            "/api/journal/entries/",
            self._payload(
                group_id=other_group.pk, portfolio_id=self.p1.pk
            ),
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_portfolio_filter(self):
        self.make_journal_entry(
            user=self.user, title="در پورت اول", portfolio=self.p1
        )
        self.make_journal_entry(
            user=self.user, title="در پورت دوم", portfolio=self.p2
        )
        titles = [
            e["title"]
            for e in self.get_list(
                "/api/journal/entries/", portfolio=self.p1.pk
            )
        ]
        self.assertIn("در پورت اول", titles)
        self.assertNotIn("در پورت دوم", titles)

    def _payload(self, **extra):
        payload = {
            "group_id": None,
            "tradeId": "",
            "symbol": "XAUUSD",
            "title": "یادداشت معامله",
            "mistakes": "عجله کردم",
            "lesson": "صبور باش",
            "emotion": "آرام",
            "plan": True,
            "favorite": False,
            "html": "<p>متن</p>",
            "blocks": [],
            "images": [],
        }
        payload.update(extra)
        return payload

    def test_create_with_entry_date_and_group(self):
        r = self.client.post(
            "/api/journal/entries/",
            self._payload(group_id=self.group.pk, entryDate="2026-08-19"),
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        data = r.data
        self.assertEqual(data["title"], "یادداشت معامله")
        self.assertEqual(data["groupId"], str(self.group.pk))
        # Jalali date output for 2026-08-19 (2 شهریور ۱۴۰۵)
        self.assertTrue(data["date"].startswith("۱۴۰۵"))
        entry = JournalEntry.objects.get(pk=data["id"])
        self.assertEqual(entry.date, date(2026, 8, 19))
        self.assertEqual(entry.group_id, self.group.pk)

    def test_create_defaults_date_week_month(self):
        r = self.client.post(
            "/api/journal/entries/", self._payload(), format="json"
        )
        self.assertEqual(r.status_code, 201)
        entry = JournalEntry.objects.get(pk=r.data["id"])
        self.assertIsNotNone(entry.date)
        self.assertTrue(entry.week)
        self.assertTrue(entry.month)

    def test_update_entry(self):
        entry = self.make_journal_entry(user=self.user, group=self.group)
        r = self.client.patch(
            f"/api/journal/entries/{entry.pk}/",
            {"title": "ویرایش", "favorite": True},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        entry.refresh_from_db()
        self.assertEqual(entry.title, "ویرایش")
        self.assertTrue(entry.favorite)

    def test_delete_entry(self):
        entry = self.make_journal_entry(user=self.user)
        r = self.client.delete(f"/api/journal/entries/{entry.pk}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(JournalEntry.objects.filter(pk=entry.pk).exists())

    def test_scoping(self):
        self.make_journal_entry(user=self.user, title="مال من")
        self.make_journal_entry(user=self.make_user(username="other"), title="مال دیگری")
        titles = [e["title"] for e in self.get_list("/api/journal/entries/")]
        self.assertIn("مال من", titles)
        self.assertNotIn("مال دیگری", titles)

    def test_week_month_outputs_jalali_labels(self):
        self.make_journal_entry(user=self.user)
        items = self.get_list("/api/journal/entries/")
        self.assertIsNotNone(items[0]["week"])
        self.assertIsNotNone(items[0]["month"])