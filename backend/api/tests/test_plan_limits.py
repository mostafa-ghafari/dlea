"""Tests for admin plan editing, the AI quota and the per-plan image cap."""

from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.utils import timezone

from api.models import AiApiCall, JournalEntry, Plan, Trade
from api.tests.common import BaseTestCase

REPORT = {
    "id": "weekly-1",
    "label": "هفته",
    "range": "x - y",
    "summary": "s",
    "net": "+10",
    "winRate": "60%",
    "scores": [],
    "stats": [],
    "weaknesses": [],
    "strengths": [],
    "highlights": [],
    "actionPlan": [],
}


class PlanEditingTests(BaseTestCase):
    """The admin panel must actually persist plan changes."""

    def setUp(self):
        self.plan = self.make_plan(
            slug="free",
            name="رایگان",
            ai_requests_limit=1,
            ai_requests_period="month",
            max_images_per_entry=2,
        )
        self.user = self.make_user(username="trader")

    def test_admin_can_change_price_and_quotas(self):
        self.auth_staff()
        r = self.client.patch(
            "/api/plans/free/",
            {
                "price": "۹۹,۰۰۰",
                "maxTradesPerMonth": 10,
                "aiRequestsLimit": 3,
                "aiRequestsPeriod": "week",
                "maxImagesPerEntry": 5,
            },
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.plan.refresh_from_db()
        self.assertEqual(self.plan.price, "۹۹,۰۰۰")
        self.assertEqual(self.plan.max_trades_per_month, 10)
        self.assertEqual(self.plan.ai_requests_limit, 3)
        self.assertEqual(self.plan.ai_requests_period, "week")
        self.assertEqual(self.plan.max_images_per_entry, 5)

    def test_regular_user_cannot_change_plans(self):
        self.auth(self.user)
        r = self.client.patch("/api/plans/free/", {"price": "۰"}, format="json")
        self.assertIn(r.status_code, (401, 403))
        self.plan.refresh_from_db()
        self.assertNotEqual(self.plan.price, "۰")

    def test_anonymous_cannot_change_plans(self):
        r = self.client.patch("/api/plans/free/", {"price": "۰"}, format="json")
        self.assertIn(r.status_code, (401, 403))

    def test_plans_are_still_public_to_read(self):
        items = self.get_list("/api/plans/")
        self.assertEqual(items[0]["id"], "free")
        self.assertEqual(items[0]["aiRequestsLimit"], 1)
        self.assertEqual(items[0]["maxImagesPerEntry"], 2)

    def test_user_count_is_not_writable(self):
        self.auth_staff()
        self.plan.users = 42
        self.plan.save(update_fields=["users"])
        self.client.patch("/api/plans/free/", {"users": 9999}, format="json")
        self.plan.refresh_from_db()
        self.assertEqual(self.plan.users, 42)

    def test_limits_endpoint_exposes_name_and_quotas(self):
        """The client needs `name` to map Subscription.plan ("رایگان") to a slug."""
        items = self.get_list("/api/plans/limits/")
        self.assertEqual(items[0]["name"], "رایگان")
        self.assertEqual(items[0]["aiRequestsLimit"], 1)
        self.assertEqual(items[0]["aiRequestsPeriod"], "month")
        self.assertEqual(items[0]["maxImagesPerEntry"], 2)


class AiQuotaTests(BaseTestCase):
    """free 1/month, Pro 3/week, Pro Max 3/day."""

    def setUp(self):
        self.free = self.make_plan(
            slug="free",
            name="رایگان",
            ai_requests_limit=1,
            ai_requests_period="month",
            max_images_per_entry=2,
        )
        self.pro = self.make_plan(
            slug="pro",
            name="Pro",
            ai_requests_limit=3,
            ai_requests_period="week",
            max_images_per_entry=10,
        )
        self.promax = self.make_plan(
            slug="promax",
            name="Pro Max",
            ai_requests_limit=3,
            ai_requests_period="day",
            max_images_per_entry=-1,
        )
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)
        self.make_trade(self.portfolio)

    def _subscribe(self, plan_name):
        from api.models import Subscription

        Subscription.objects.create(
            user=self.user,
            plan=plan_name,
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=30),
            total_days=30,
            days_left=30,
            price="0",
        )

    def _generate(self):
        with patch("api.views.gemini.get_api_key", return_value="fake-key"), patch(
            "api.views.gemini.generate_coach_report", return_value=dict(REPORT)
        ), patch("api.views.gemini.get_model", return_value="gemini-2.0-flash"):
            return self.client.post("/api/coach/generate/", {"scope": "weekly"}, format="json")

    def _quota(self):
        return self.client.get("/api/ai/quota/").data

    def test_default_plan_is_free_with_one_monthly_request(self):
        quota = self._quota()
        self.assertEqual(quota["plan"], "free")
        self.assertEqual(quota["limit"], 1)
        self.assertEqual(quota["period"], "month")
        self.assertEqual(quota["remaining"], 1)
        self.assertTrue(quota["allowed"])

    def test_free_plan_blocks_the_second_request(self):
        self.assertEqual(self._generate().status_code, 201)

        blocked = self._generate()

        self.assertEqual(blocked.status_code, 403)
        self.assertIn("تمام شده", blocked.json()["detail"])
        self.assertEqual(blocked.json()["quota"]["remaining"], 0)
        self.assertFalse(self._quota()["allowed"])

    def test_pro_plan_allows_three_per_week(self):
        self._subscribe("Pro")
        for _ in range(3):
            # 201 the first time, 200 once the same report is overwritten.
            self.assertIn(self._generate().status_code, (200, 201))

        blocked = self._generate()

        self.assertEqual(blocked.status_code, 403)
        quota = self._quota()
        self.assertEqual(quota["plan"], "pro")
        self.assertEqual(quota["period"], "week")
        self.assertEqual(quota["used"], 3)

    def test_pro_max_plan_window_is_daily(self):
        self._subscribe("Pro Max")
        # Yesterday's call is outside the day window and must not count.
        call = AiApiCall.objects.create(
            user_email=self.user.email,
            endpoint="/api/coach/generate/",
            model_name="gemini-2.0-flash",
        )
        # `created_at` is auto_now_add, so age the row through an update.
        AiApiCall.objects.filter(pk=call.pk).update(
            created_at=timezone.now() - timedelta(days=1, hours=1)
        )
        quota = self._quota()
        self.assertEqual(quota["plan"], "promax")
        self.assertEqual(quota["period"], "day")
        self.assertEqual(quota["used"], 0)
        self.assertTrue(quota["allowed"])

    def test_quota_reports_when_it_resets(self):
        self._generate()
        quota = self._quota()
        self.assertIsNotNone(quota["resetsAt"])

    def test_anonymous_visitors_are_not_blocked(self):
        """The demo portfolio has no account to charge the quota to."""
        self.client.force_authenticate(None)
        self.assertEqual(self._generate().status_code, 201)


class ImageCapTests(BaseTestCase):
    """Image uploads follow the plan that owns them."""

    def setUp(self):
        self.free = self.make_plan(slug="free", name="رایگان", max_images_per_entry=2)
        self.pro = self.make_plan(slug="pro", name="Pro", max_images_per_entry=10)
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)

    def _trade_payload(self, count):
        return self.trade_payload(
            self.portfolio, screenshots=[f"data:image/jpeg;base64,{i}" for i in range(count)]
        )

    def test_free_plan_blocks_more_than_two_images(self):
        r = self.client.post("/api/trades/", self._trade_payload(3), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("حداکثر 2 تصویر", str(r.data))
        self.assertEqual(Trade.objects.count(), 0)

    def test_free_plan_allows_exactly_the_cap(self):
        r = self.client.post("/api/trades/", self._trade_payload(2), format="json")
        self.assertEqual(r.status_code, 201)

    def test_paid_plan_gets_more_images(self):
        from api.models import Subscription

        Subscription.objects.create(
            user=self.user,
            plan="Pro",
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=30),
            total_days=30,
            days_left=30,
            price="0",
        )
        r = self.client.post("/api/trades/", self._trade_payload(5), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(Trade.objects.get(ticket="123456").screenshots), 5)

    def test_unlimited_plan_has_no_cap(self):
        self.pro.max_images_per_entry = -1
        self.pro.save(update_fields=["max_images_per_entry"])
        from api.models import Subscription

        Subscription.objects.create(
            user=self.user,
            plan="Pro",
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=30),
            total_days=30,
            days_left=30,
            price="0",
        )
        r = self.client.post("/api/trades/", self._trade_payload(12), format="json")
        self.assertEqual(r.status_code, 201)

    def test_journal_images_follow_the_same_cap(self):
        r = self.client.post(
            "/api/journal/entries/",
            {
                "title": "یادداشت",
                "images": ["data:image/jpeg;base64,a"] * 4,
            },
            format="json",
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("حداکثر 2 تصویر", str(r.data))
        self.assertEqual(JournalEntry.objects.count(), 0)


class PlanFeatureBackfillTests(BaseTestCase):
    """A plan without a feature list locks every page, so it must not persist.

    Production answered `/api/plans/limits/` with `features: []` for every
    plan — migration 0015 added the column with an empty default and nothing
    backfilled it — and the first purchase, the step that puts a plan name on
    the subscription, turned the whole sidebar into padlocks.
    """

    def _sync(self, *args):
        out = StringIO()
        call_command("sync_plans", *args, stdout=out)
        return out.getvalue()

    def test_fills_an_empty_feature_list(self):
        plan = self.make_plan(slug="pro", name="Pro", plan_features=[], features=[])
        output = self._sync()
        plan.refresh_from_db()
        self.assertIn("portfolios", plan.plan_features)
        self.assertIn("mt-connection", plan.plan_features)
        self.assertTrue(plan.features)
        self.assertIn("pro", output)

    def test_keeps_a_list_an_admin_curated(self):
        plan = self.make_plan(slug="pro", name="Pro", plan_features=["journal"])
        self._sync()
        plan.refresh_from_db()
        self.assertEqual(plan.plan_features, ["journal"])

    def test_force_overwrites_a_curated_list(self):
        plan = self.make_plan(slug="pro", name="Pro", plan_features=["journal"])
        self._sync("--force")
        plan.refresh_from_db()
        self.assertIn("portfolios", plan.plan_features)

    def test_leaves_a_plan_it_has_no_defaults_for(self):
        plan = self.make_plan(slug="legacy", name="Legacy", plan_features=[])
        output = self._sync()
        plan.refresh_from_db()
        self.assertEqual(plan.plan_features, [])
        self.assertIn("legacy", output)

    def test_every_shipped_plan_keeps_the_basics(self):
        """No tier may be defined as "nothing allowed"."""
        from api.plan_defaults import PLAN_FEATURES

        for slug, features in PLAN_FEATURES.items():
            with self.subTest(slug=slug):
                for gate in ("portfolios", "trades", "journal", "settings"):
                    self.assertIn(gate, features)

    def test_admin_can_edit_the_gating_list(self):
        plan = self.make_plan(slug="pro", name="Pro", plan_features=["journal"])
        self.auth_staff()
        r = self.client.patch(
            "/api/plans/pro/", {"planFeatures": ["journal", "risk"]}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        plan.refresh_from_db()
        self.assertEqual(plan.plan_features, ["journal", "risk"])

    def test_limits_endpoint_reports_the_gating_list(self):
        self.make_plan(
            slug="pro", name="Pro", plan_features=["portfolios", "journal"]
        )
        items = self.get_list("/api/plans/limits/")
        pro = next(p for p in items if p["slug"] == "pro")
        self.assertEqual(pro["features"], ["portfolios", "journal"])
