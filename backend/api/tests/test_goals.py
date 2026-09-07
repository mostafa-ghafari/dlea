"""Tests for the Goals API: CRUD, validation, scoping."""

from rest_framework import status

from api.models import Goal
from api.tests.common import BaseTestCase


class GoalTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))

    def test_crud_roundtrip(self):
        r = self.client.post(
            "/api/goals/", {"title": "سود ۱۰٪", "progress": 40}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        gid = r.data["id"]

        items = self.get_list("/api/goals/")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "سود ۱۰٪")
        self.assertEqual(items[0]["progress"], 40)

        r = self.client.patch(f"/api/goals/{gid}/", {"progress": 80}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["progress"], 80)

        r = self.client.delete(f"/api/goals/{gid}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Goal.objects.filter(pk=gid).exists())

    def test_progress_must_be_non_negative(self):
        r = self.client.post("/api/goals/", {"title": "x", "progress": -5}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_title_required(self):
        r = self.client.post("/api/goals/", {"progress": 10}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_scoping(self):
        self.client.post("/api/goals/", {"title": "مال من"}, format="json")
        other = self.make_user(username="other")
        Goal.objects.create(user=other, title="مال دیگری")
        titles = [g["title"] for g in self.get_list("/api/goals/")]
        self.assertIn("مال من", titles)
        self.assertNotIn("مال دیگری", titles)