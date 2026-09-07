"""Tests for the auth endpoints: OTP, register, login, password reset, Google."""

import base64
import json

from django.core import mail
from django.test import override_settings
from rest_framework import status

from api import auth_views
from api.models import UserProfile
from api.tests.common import BaseTestCase

from django.contrib.auth import get_user_model

User = get_user_model()

# The Django test runner forces settings.DEBUG=False; the OTP endpoints only
# return `debug_otp` when DEBUG is on, so these classes re-enable it.
OTP_DEBUG = override_settings(DEBUG=True)


def _google_credential(email, name="Jane Doe", sub="g123"):
    """Build an unsigned Google-identity JWT (payload only — dev decoding)."""
    payload = {"email": email, "name": name, "sub": sub, "picture": ""}
    seg = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"header.{seg}.signature"


@OTP_DEBUG
class SendOtpTests(BaseTestCase):
    def test_missing_email_returns_400(self):
        r = self.client.post("/api/auth/send-otp/", {}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_email_returns_debug_otp_and_sends_email(self):
        r = self.client.post("/api/auth/send-otp/", {"email": "  Test@Example.com "}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("debug_otp", r.json())
        self.assertEqual(len(r.json()["debug_otp"]), 6)
        # Locmem backend captured the email
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("کد تأیید", mail.outbox[0].subject)


@OTP_DEBUG
class RegisterTests(BaseTestCase):
    def _send_otp(self, email):
        r = self.client.post("/api/auth/send-otp/", {"email": email}, format="json")
        self.assertEqual(r.status_code, 200)
        return r.json()["debug_otp"]

    def _register(self, email, otp, **extra):
        payload = {
            "email": email,
            "otp": otp,
            "firstName": "علی",
            "lastName": "رضایی",
            "password": "secret123",
        }
        payload.update(extra)
        return self.client.post("/api/auth/verify-otp/", payload, format="json")

    def test_full_register_flow(self):
        otp = self._send_otp("ali@example.com")
        r = self._register("ali@example.com", otp)
        self.assertEqual(r.status_code, 201)
        data = r.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["email"], "ali@example.com")
        self.assertEqual(data["user"]["firstName"], "علی")
        user = User.objects.get(email="ali@example.com")
        self.assertEqual(user.username, "ali")

    def test_missing_fields_returns_400(self):
        r = self.client.post(
            "/api/auth/verify-otp/",
            {"email": "a@b.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_wrong_otp_returns_400(self):
        self._send_otp("wrong@example.com")
        r = self._register("wrong@example.com", "000000")
        self.assertEqual(r.status_code, 400)
        self.assertIn("نادرست", r.json()["error"])

    def test_duplicate_email_returns_400(self):
        self.make_user(username="existing", email="dup@example.com")
        otp = self._send_otp("dup@example.com")
        r = self._register("dup@example.com", otp)
        self.assertEqual(r.status_code, 400)
        self.assertIn("ثبت شده", r.json()["error"])

    def test_unique_username_when_prefix_taken(self):
        self.make_user(username="john", email="john@other.com")
        otp = self._send_otp("john@example.com")
        r = self._register("john@example.com", otp)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["user"]["email"], "john@example.com")
        self.assertTrue(User.objects.filter(username="john1").exists())


class LoginTests(BaseTestCase):
    def setUp(self):
        self.user = self.make_user(username="login", email="login@example.com")

    def test_missing_fields_returns_400(self):
        r = self.client.post("/api/auth/login/", {"email": "login@example.com"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_unknown_email_returns_401(self):
        r = self.client.post(
            "/api/auth/login/", {"email": "nobody@example.com", "password": "x"}, format="json"
        )
        self.assertEqual(r.status_code, 401)

    def test_wrong_password_returns_401(self):
        r = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(r.status_code, 401)

    def test_successful_login_returns_tokens_and_role(self):
        r = self.client.post(
            "/api/auth/login/",
            {"email": "LOGIN@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertIn("role", data)
        self.assertEqual(data["user"]["email"], "login@example.com")
        # A fresh trader with no trades gets the default auto role
        self.assertEqual(data["role"], "trader")


@OTP_DEBUG
class PasswordResetTests(BaseTestCase):
    def _request(self, email):
        return self.client.post("/api/auth/password-reset-request/", {"email": email}, format="json")

    def test_request_for_existing_user_returns_debug_otp(self):
        self.make_user(username="reset", email="reset@example.com")
        r = self._request("reset@example.com")
        self.assertEqual(r.status_code, 200)
        self.assertIn("debug_otp", r.json())

    def test_request_for_unknown_user_does_not_leak_existence(self):
        """Same success message, and crucially NO debug_otp → cannot enumerate."""
        r = self._request("ghost@example.com")
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("debug_otp", r.json())

    def test_full_reset_flow(self):
        user = self.make_user(username="reset2", email="reset2@example.com")
        otp = self._request("reset2@example.com").json()["debug_otp"]

        # Step 2: verify
        r = self.client.post(
            "/api/auth/password-reset-verify/",
            {"email": "reset2@example.com", "code": otp},
            format="json",
        )
        self.assertEqual(r.status_code, 200)

        # Step 3: set new password
        r = self.client.post(
            "/api/auth/password-reset-confirm/",
            {"email": "reset2@example.com", "code": otp, "password": "newpass123"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)

        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass123"))

        # Old login no longer works
        r = self.client.post(
            "/api/auth/login/",
            {"email": "reset2@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(r.status_code, 401)

    def test_verify_rejects_register_otp(self):
        """A registration OTP must not verify a password reset."""
        user = self.make_user(username="reset3", email="reset3@example.com")
        r = self.client.post("/api/auth/send-otp/", {"email": "reset3@example.com"}, format="json")
        reg_otp = r.json()["debug_otp"]
        r = self.client.post(
            "/api/auth/password-reset-verify/",
            {"email": "reset3@example.com", "code": reg_otp},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_confirm_rejects_short_password(self):
        user = self.make_user(username="reset4", email="reset4@example.com")
        otp = self._request("reset4@example.com").json()["debug_otp"]
        r = self.client.post(
            "/api/auth/password-reset-confirm/",
            {"email": "reset4@example.com", "code": otp, "password": "short"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)


class GoogleCallbackTests(BaseTestCase):
    def test_missing_credential_returns_400(self):
        r = self.client.post("/api/auth/google/", {}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_malformed_credential_returns_400(self):
        r = self.client.post("/api/auth/google/", {"credential": "not-a-jwt"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_new_user_created(self):
        r = self.client.post(
            "/api/auth/google/",
            {"credential": _google_credential("jane@example.com", "Jane Doe")},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("access", data)
        user = User.objects.get(email="jane@example.com")
        self.assertEqual(user.first_name, "Jane")
        self.assertEqual(user.last_name, "Doe")
        self.assertFalse(user.has_usable_password())
        # Profile row created
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    def test_existing_user_logged_in(self):
        user = self.make_user(username="jane", email="jane@example.com")
        r = self.client.post(
            "/api/auth/google/",
            {"credential": _google_credential("jane@example.com")},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["user"]["email"], user.email)
        self.assertEqual(User.objects.count(), 1)

    def test_username_collision_does_not_500(self):
        """Google email whose username prefix is already taken must not crash."""
        self.make_user(username="bob", email="bob@other.com")
        r = self.client.post(
            "/api/auth/google/",
            {"credential": _google_credential("bob@example.com", "Bob")},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(User.objects.filter(username="bob1").exists())

    def test_vip_profile_role_surfaces_in_login_response(self):
        user = self.make_user(username="vip", email="vip@example.com")
        self.make_profile(user, role="vip")
        r = self.client.post(
            "/api/auth/login/",
            {"email": "vip@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["role"], "vip")