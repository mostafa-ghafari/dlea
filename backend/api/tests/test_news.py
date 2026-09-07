"""Tests for news: CRUD + broadcast notifications to all active users."""

from django.utils import timezone
from rest_framework import status

from api.models import NewsItem, Notification
from api.tests.common import BaseTestCase


class NewsTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))

    def _payload(self, **extra):
        payload = {
            "title": "نسخه جدید منتشر شد",
            "summary": "خلاصه خبر",
            "body": "متن کامل خبر",
            "category": "آپدیت",
            "pinned": False,
        }
        payload.update(extra)
        return payload

    def test_crud_roundtrip(self):
        r = self.client.post("/api/news/", self._payload(), format="json")
        self.assertEqual(r.status_code, 201)
        nid = r.data["id"]
        self.assertEqual(r.data["title"], "نسخه جدید منتشر شد")

        self.assertEqual(len(self.get_list("/api/news/")), 1)

        r = self.client.patch(f"/api/news/{nid}/", {"pinned": True}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["pinned"])

        r = self.client.delete(f"/api/news/{nid}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(NewsItem.objects.filter(pk=nid).exists())

    def test_entry_date_write_field(self):
        r = self.client.post(
            "/api/news/", self._payload(entryDate="2026-08-19"), format="json"
        )
        self.assertEqual(r.status_code, 201)
        item = NewsItem.objects.get(pk=r.data["id"])
        self.assertEqual(str(item.date), "2026-08-19")
        # Output is Jalali
        self.assertTrue(r.data["date"].startswith("۱۴۰۵"))

    def test_create_notifies_all_active_users(self):
        active1 = self.make_user(username="active1")
        active2 = self.make_user(username="active2")
        inactive = self.make_user(username="inactive", is_active=False)
        r = self.client.post("/api/news/", self._payload(), format="json")
        self.assertEqual(r.status_code, 201)
        notified = set(
            Notification.objects.filter(kind="news").values_list("user_id", flat=True)
        )
        # All active users (including the author) are notified; inactive are not
        expected = {active1.pk, active2.pk, self.user.pk}
        self.assertEqual(notified, expected)
        self.assertNotIn(inactive.pk, notified)

    def test_news_visible_to_anonymous(self):
        self.client.force_authenticate(user=None)
        self.client.post("/api/news/", self._payload(), format="json")
        self.assertEqual(len(self.get_list("/api/news/")), 1)