"""Tests for the admin API: stats, charts, users, payments, logs, audit."""

from datetime import date

from rest_framework import status

from api.models import AiApiCall, AuditEntry, LogEntry, Payment, Subscription, UserProfile
from api.tests.common import BaseTestCase


class AdminGatingTests(BaseTestCase):
    """Admin endpoints must reject anonymous and non-admin users."""

    ADMIN_URLS = [
        "/api/admin/stats/",
        "/api/admin/charts/",
        "/api/admin/ai-apis/",
        "/api/admin/users/",
        "/api/admin/payments/",
        "/api/admin/referrals/",
        "/api/admin/logs/",
    ]

    def test_anonymous_rejected(self):
        for url in self.ADMIN_URLS:
            with self.subTest(url=url):
                r = self.client.get(url)
                self.assertIn(r.status_code, (401, 403), url)

    def test_regular_user_rejected(self):
        self.auth(self.make_user(username="trader"))
        for url in self.ADMIN_URLS:
            with self.subTest(url=url):
                r = self.client.get(url)
                self.assertIn(r.status_code, (401, 403), url)

    def test_admin_roles_allowed(self):
        """A user with profile.role=admin (not staff) passes the gate."""
        user = self.auth(self.make_user(username="vip"))
        self.make_profile(user, role="admin")
        r = self.client.get("/api/admin/stats/")
        self.assertEqual(r.status_code, 200)


class AdminStatsTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()

    def test_stats_aggregate(self):
        self.make_user(username="u1")
        self.make_user(username="u2")
        Payment.objects.create(user="u1", plan="Pro", amount="1,000,000", date=date.today(), status="موفق")
        Payment.objects.create(user="u1", plan="Pro", amount="500", date=date.today(), status="ناموفق")
        p = self.make_portfolio(user=self.make_user(username="t"))
        self.make_trade(p)
        AiApiCall.objects.create(user_email="x@y.com", endpoint="/api/coach/generate/", model_name="gemini-2.0-flash")

        r = self.client.get("/api/admin/stats/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(data["total_users"], 4)  # u1, u2, t + staff
        self.assertEqual(data["active_subscriptions"], 1)
        self.assertEqual(data["monthly_revenue"], 1000000)
        self.assertEqual(data["total_trades"], 1)
        self.assertEqual(data["ai_calls"], 1)


class AdminChartsTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()
        self.user = self.make_user(username="c1")
        self.make_profile(self.user, plan="Pro")

    def test_charts_shape(self):
        Payment.objects.create(user="c1", plan="Pro", amount="2,000,000", date=date.today(), status="موفق")
        r = self.client.get("/api/admin/charts/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(len(data["user_growth"]), 7)
        self.assertEqual(len(data["revenue"]), 7)
        self.assertTrue(data["user_growth"][-1]["users"] >= 1)
        plan_names = [p["name"] for p in data["plan_distribution"]]
        self.assertIn("Pro", plan_names)


class AdminAiApisTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()

    def test_groups_calls_by_model(self):
        for _ in range(3):
            AiApiCall.objects.create(user_email="a@b.com", endpoint="/api/coach/generate/", model_name="gemini-2.0-flash", tokens_in=100, tokens_out=10)
        AiApiCall.objects.create(user_email="a@b.com", endpoint="/api/coach/generate/", model_name="gemini-1.5", tokens_in=50, tokens_out=5)
        r = self.client.get("/api/admin/ai-apis/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertIn("apis", data)
        self.assertIn("gemini_configured", data)
        by_name = {a["name"]: a for a in data["apis"]}
        self.assertEqual(by_name["gemini-2.0-flash"]["requests"], 3)
        self.assertEqual(by_name["gemini-2.0-flash"]["tokens_in"], 300)


class AdminUsersTests(BaseTestCase):
    def setUp(self):
        self.admin = self.auth_staff()

    def test_list_pagination_and_search(self):
        for i in range(25):
            self.make_user(username=f"user{i}", email=f"user{i}@example.com")
        r = self.client.get("/api/admin/users/?page=1&page_size=10")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 26)  # 25 + staff
        self.assertEqual(len(r.data["results"]), 10)

        r = self.client.get("/api/admin/users/?search=user3")
        self.assertTrue(all("user3" in u["email"] or "user3" in u["name"] for u in r.data["results"]))

    def test_update_plan_sets_subscription(self):
        target = self.make_user(username="target")
        r = self.client.patch(
            f"/api/admin/users/{target.pk}/", {"plan": "Pro"}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["plan"], "Pro")
        self.assertTrue(Subscription.objects.filter(user=target, plan="Pro").exists())
        # Audit entry recorded
        self.assertTrue(AuditEntry.objects.filter(action="ویرایش کاربر", target=target.email).exists())

    def test_update_plan_free_removes_subscription(self):
        target = self.make_user(username="target2")
        self.client.patch(f"/api/admin/users/{target.pk}/", {"plan": "Pro"}, format="json")
        r = self.client.patch(f"/api/admin/users/{target.pk}/", {"plan": "رایگان"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(Subscription.objects.filter(user=target).exists())

    def test_update_status_deactivates_user(self):
        target = self.make_user(username="target3")
        r = self.client.patch(f"/api/admin/users/{target.pk}/", {"status": "غیرفعال"}, format="json")
        self.assertEqual(r.status_code, 200)
        target.refresh_from_db()
        self.assertFalse(target.is_active)

    def test_update_role(self):
        target = self.make_user(username="target4")
        r = self.client.patch(f"/api/admin/users/{target.pk}/", {"role": "vip"}, format="json")
        self.assertEqual(r.status_code, 200)
        target.profile.refresh_from_db()
        self.assertEqual(target.profile.role, "vip")
        self.assertEqual(r.data["role"], "vip")

    def test_update_missing_user_404(self):
        r = self.client.patch("/api/admin/users/999999/", {"plan": "Pro"}, format="json")
        self.assertEqual(r.status_code, 404)

    def test_destroy_user_and_audit(self):
        target = self.make_user(username="doomed", email="doomed@example.com")
        r = self.client.delete(f"/api/admin/users/{target.pk}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(self._user_exists("doomed"))
        self.assertTrue(AuditEntry.objects.filter(action="حذف کاربر", target="doomed@example.com").exists())

    def _user_exists(self, username):
        from django.contrib.auth import get_user_model

        return get_user_model().objects.filter(username=username).exists()


class AdminReadOnlyTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()

    def test_payments_list(self):
        Payment.objects.create(user="u", plan="Pro", amount="100", date=date.today(), status="موفق")
        items = self.get_list("/api/admin/payments/")
        self.assertEqual(len(items), 1)
        # date serialized as Jalali
        self.assertIn("date", items[0])

    def test_referrals_list(self):
        from api.models import ReferralLink

        ReferralLink.objects.create(name="تلگرام", code="TG1", clicks=5, signups=2)
        items = self.get_list("/api/admin/referrals/")
        self.assertEqual(items[0]["clicks"], 5)

    def test_logs_list(self):
        LogEntry.objects.create(level="INFO", message="hello")
        items = self.get_list("/api/admin/logs/")
        self.assertEqual(items[0]["l"], "INFO")
        self.assertEqual(items[0]["m"], "hello")

    def test_audit_read_admin_only(self):
        AuditEntry.objects.create(actor="x", action="y", target="z")
        items = self.get_list("/api/audit/")
        self.assertEqual(items[0]["action"], "y")

    def test_audit_write_allowed_for_authenticated(self):
        self.auth(self.make_user(username="normal"))
        r = self.client.post(
            "/api/audit/",
            {"actor": "کاربر", "action": "ورود", "target": "سیستم", "details": ""},
            format="json",
        )
        self.assertEqual(r.status_code, 201)

    def test_audit_read_rejected_for_regular_user(self):
        self.auth(self.make_user(username="normal"))
        r = self.client.get("/api/audit/")
        self.assertIn(r.status_code, (401, 403))