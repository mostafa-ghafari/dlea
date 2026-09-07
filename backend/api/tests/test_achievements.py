"""Tests for achievements: earned-rule computation, read-only, role tiers."""

from rest_framework import status

from api.models import Achievement, RoleTier
from api.tests.common import BaseTestCase


class AchievementTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        # The seeded titles drive the earned rules
        self.make_achievement(title="اولین معامله ثبت‌شده")
        self.make_achievement(title="۱۰ معامله A+ متوالی")
        self.make_achievement(title="ماه سودده")

    def test_list_returns_all_with_earned_false_for_new_user(self):
        items = self.get_list("/api/achievements/")
        self.assertEqual(len(items), Achievement.objects.count())
        for a in items:
            self.assertFalse(a["earned"])

    def test_earned_computed_from_trades(self):
        p = self.make_portfolio(user=self.user)
        self.make_trade(p, pnl=100)
        by_title = {a["title"]: a["earned"] for a in self.get_list("/api/achievements/")}
        self.assertTrue(by_title["اولین معامله ثبت‌شده"])
        self.assertTrue(by_title["ماه سودده"])  # total_pnl > 0
        self.assertFalse(by_title["۱۰ معامله A+ متوالی"])  # needs 10 trades

    def test_anonymous_sees_all_unearned(self):
        self.client.force_authenticate(user=None)
        for a in self.get_list("/api/achievements/"):
            self.assertFalse(a["earned"])

    def test_read_only(self):
        r = self.client.post(
            "/api/achievements/", {"title": "x", "desc": "y", "rule": "z"}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_achievement_history_scoped(self):
        from api.models import AchievementHistory

        u2 = self.make_user(username="u2")
        AchievementHistory.objects.create(user=self.user, month="فروردین", earned=[1], count=1)
        AchievementHistory.objects.create(user=u2, month="اردیبهشت", earned=[2], count=1)
        items = self.get_list("/api/achievement-history/")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["month"], "فروردین")


class RoleTierTests(BaseTestCase):
    def test_list_ordered_by_level(self):
        self.make_role_tier(level=2, min_pct=20, max_pct=59, name="حرفه‌ای")
        self.make_role_tier(level=1, min_pct=0, max_pct=19, name="تریدر")
        items = self.get_list("/api/role-tiers/")
        levels = [t["level"] for t in items]
        self.assertEqual(levels, sorted(levels))
        self.assertEqual(items[0]["minPct"], 0)

    def test_read_only(self):
        r = self.client.post("/api/role-tiers/", {"level": 9}, format="json")
        self.assertEqual(r.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)