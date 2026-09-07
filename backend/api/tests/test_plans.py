"""Tests for plans, plan limits, and subscriptions."""

from datetime import date, timedelta

from rest_framework import status

from api.models import Subscription
from api.tests.common import BaseTestCase


class PlanTests(BaseTestCase):
    def setUp(self):
        self.make_plan(slug="free", name="رایگان", max_portfolios=1, plan_features=["journal"])
        self.make_plan(slug="pro", name="Pro", max_portfolios=3, plan_features=["journal", "coach"])

    def test_plans_list(self):
        items = self.get_list("/api/plans/")
        self.assertEqual(len(items), 2)
        by_slug = {p["id"]: p for p in items}
        self.assertEqual(by_slug["pro"]["maxPortfolios"], 3)
        self.assertIn("journal", by_slug["free"]["planFeatures"])

    def test_plans_read_only(self):
        r = self.client.post("/api/plans/", {"name": "x"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_plan_limits_public(self):
        r = self.client.get("/api/plans/limits/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 2)
        limits = {p["slug"]: p for p in r.data}
        self.assertEqual(limits["pro"]["maxPortfolios"], 3)


class SubscriptionTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))

    def _sub(self, user, plan="Pro"):
        return Subscription.objects.create(
            user=user,
            plan=plan,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31),
            total_days=30,
            days_left=15,
            price="1,000,000",
        )

    def test_list_scoped_and_serialized(self):
        self._sub(self.user)
        self._sub(self.make_user(username="other"), plan="VIP")
        items = self.get_list("/api/subscription/")
        self.assertEqual(len(items), 1)
        data = items[0]
        self.assertEqual(data["plan"], "Pro")
        self.assertEqual(data["totalDays"], 30)
        self.assertEqual(data["daysLeft"], 15)
        # Jalali dates
        self.assertTrue(data["startDate"].startswith("۱۴۰۵"))
        self.assertTrue(data["endDate"].startswith("۱۴۰۵"))

    def test_read_only(self):
        r = self.client.post("/api/subscription/", {"plan": "Pro"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)