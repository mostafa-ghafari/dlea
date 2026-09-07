"""Tests for the notifications API: scoping, read-all, delete-all."""

from django.utils import timezone
from rest_framework import status

from api.models import Notification
from api.tests.common import BaseTestCase


class NotificationTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))

    def _create(self, user, title="اعلان", read=False):
        return Notification.objects.create(
            user=user, kind="system", title=title, desc="توضیح", time=timezone.localdate(), read=read
        )

    def test_list_scoped_to_current_user(self):
        self._create(self.user, title="مال من")
        self._create(self.make_user(username="other"), title="مال دیگری")
        titles = [n["title"] for n in self.get_list("/api/notifications/")]
        self.assertIn("مال من", titles)
        self.assertNotIn("مال دیگری", titles)

    def test_anonymous_list_empty(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.get_list("/api/notifications/"), [])

    def test_create_assigns_to_current_user(self):
        r = self.client.post(
            "/api/notifications/",
            {"kind": "system", "title": "جدید", "desc": "د", "link": "", "read": False},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        n = Notification.objects.get(pk=r.data["id"])
        self.assertEqual(n.user_id, self.user.pk)

    def test_read_all(self):
        n1 = self._create(self.user, read=False)
        n2 = self._create(self.user, read=False)
        r = self.client.post("/api/notifications/read_all/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["ok"])
        n1.refresh_from_db()
        n2.refresh_from_db()
        self.assertTrue(n1.read)
        self.assertTrue(n2.read)

    def test_delete_all(self):
        self._create(self.user)
        self._create(self.user)
        r = self.client.post("/api/notifications/delete_all/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 0)

    def test_read_all_does_not_touch_other_users(self):
        self._create(self.user)
        other_n = self._create(self.make_user(username="other"), read=False)
        self.client.post("/api/notifications/read_all/")
        other_n.refresh_from_db()
        self.assertFalse(other_n.read)