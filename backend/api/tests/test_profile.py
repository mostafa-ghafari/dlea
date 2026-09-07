"""Tests for the profile endpoint: GET/PUT, avatar upload, role gating."""

import io

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from api.models import UserProfile
from api.tests.common import BaseTestCase


class ProfileTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="ali", email="ali@example.com"))

    def test_anonymous_profile_returns_401(self):
        self.client.force_authenticate(user=None)
        r = self.client.get("/api/profile/")
        self.assertEqual(r.status_code, 401)

    def test_get_returns_default_profile(self):
        r = self.client.get("/api/profile/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(data["email"], "ali@example.com")
        self.assertEqual(data["firstName"], "Ali")
        self.assertIsNone(data["avatar"])
        self.assertIn("role", data)
        self.assertEqual(data["phone"], "")

    def test_put_updates_name_and_phone(self):
        r = self.client.put(
            "/api/profile/",
            {"firstName": "علی", "lastName": "رضایی", "phone": "09121234567"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["firstName"], "علی")
        self.assertEqual(r.data["phone"], "09121234567")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "علی")
        self.assertEqual(self.user.profile.phone, "09121234567")

    def test_post_avatar_upload(self):
        avatar = SimpleUploadedFile(
            "face.png", io.BytesIO(b"fake-png-bytes").read(), content_type="image/png"
        )
        r = self.client.post("/api/profile/", {"avatar": avatar}, format="multipart")
        self.assertEqual(r.status_code, 200)
        self.user.profile.refresh_from_db()
        self.assertIsNotNone(self.user.profile.avatar)
        self.assertIn("/media/avatars/", r.data["avatar"])

    def test_non_staff_role_change_ignored(self):
        r = self.client.put("/api/profile/", {"role": "admin"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.role, "trader")

    def test_staff_can_change_role(self):
        staff = self.auth_staff()
        r = self.client.put("/api/profile/", {"role": "master"}, format="json")
        self.assertEqual(r.status_code, 200)
        staff.profile.refresh_from_db()
        self.assertEqual(staff.profile.role, "master")