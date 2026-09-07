"""Tests for the AI coach: insights, generation (Gemini mocked), periods."""

from unittest.mock import patch

from rest_framework import status

from api.models import AiApiCall, ArchivedReport, CoachInsights, CoachPeriod
from api.tests.common import BaseTestCase

REPORT = {
    "id": "wk-2026-08-19",
    "label": "هفته ۳ — مرداد",
    "range": "17 Aug - 23 Aug",
    "summary": "خلاصه",
    "net": "+120",
    "winRate": "60%",
    "scores": [{"label": "انضباط", "value": 80}],
    "stats": [{"label": "معاملات", "value": "5"}],
    "weaknesses": [],
    "strengths": [],
    "highlights": [],
    "actionPlan": [],
}


class CoachInsightsTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)

    def test_empty_state_for_new_user(self):
        r = self.client.get("/api/coach/insights/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(data["scores"], [])
        self.assertEqual(data["strengths"], [])
        self.assertEqual(data["weaknesses"], [])
        self.assertEqual(data["dailyReport"], {})

    def test_returns_stored_payload(self):
        CoachInsights.objects.create(
            user=self.user,
            portfolio=self.portfolio,
            payload={
                "scores": [{"label": "x", "value": 1}],
                "strengths": ["صبر"],
                "weaknesses": [],
                "suggestions": [],
                "behaviors": [],
                "models": [],
                "dailyReport": {"net": "+10"},
                "weeklyReport": {},
            },
        )
        r = self.client.get("/api/coach/insights/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["scores"][0]["label"], "x")
        self.assertEqual(r.data["strengths"], ["صبر"])
        self.assertEqual(r.data["dailyReport"]["net"], "+10")

    def test_models_appended_when_gemini_configured(self):
        CoachInsights.objects.create(
            user=self.user, portfolio=self.portfolio, payload={"scores": []}
        )
        with patch("api.views.gemini.gemini_models", return_value=[{"id": "gemini-2.0-flash"}]):
            r = self.client.get("/api/coach/insights/")
        self.assertEqual(r.data["models"], [{"id": "gemini-2.0-flash"}])


class CoachGenerateTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)
        self.make_trade(self.portfolio)

    def test_invalid_scope_returns_400(self):
        r = self.client.post("/api/coach/generate/", {"scope": "hourly"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_no_api_key_returns_400(self):
        with patch("api.views.gemini.get_api_key", return_value=""):
            r = self.client.post("/api/coach/generate/", {"scope": "weekly"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("GEMINI_API_KEY", r.json()["detail"]) or self.assertIn("کلید", r.json()["detail"])

    def test_success_creates_period_and_logs_call(self):
        with patch("api.views.gemini.get_api_key", return_value="fake-key"), patch(
            "api.views.gemini.generate_coach_report", return_value=dict(REPORT)
        ), patch("api.views.gemini.get_model", return_value="gemini-2.0-flash"):
            r = self.client.post(
                "/api/coach/generate/",
                {"scope": "weekly", "model": "gemini-2.0-flash", "portfolio": self.portfolio.pk},
                format="json",
            )
        self.assertEqual(r.status_code, 201)
        data = r.data
        self.assertEqual(data["scope"], "weekly")
        self.assertEqual(data["winRate"], "60%")
        self.assertEqual(data["actionPlan"], [])
        self.assertTrue(data["generated"])
        self.assertTrue(CoachPeriod.objects.filter(id=data["id"]).exists())
        self.assertEqual(AiApiCall.objects.count(), 1)
        self.assertEqual(AiApiCall.objects.first().model_name, "gemini-2.0-flash")

    def test_generation_without_trades_returns_400(self):
        # Remove the trade so the bucket lookup fails
        self.portfolio.trade_set.all().delete()
        with patch("api.views.gemini.get_api_key", return_value="fake-key"), patch(
            "api.views.gemini.generate_coach_report", side_effect=LookupError("no data")
        ):
            r = self.client.post("/api/coach/generate/", {"scope": "weekly"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_gemini_bad_response_returns_502(self):
        with patch("api.views.gemini.get_api_key", return_value="fake-key"), patch(
            "api.views.gemini.generate_coach_report", side_effect=ValueError("bad json")
        ):
            r = self.client.post("/api/coach/generate/", {"scope": "weekly"}, format="json")
        self.assertEqual(r.status_code, 502)


class CoachPeriodTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)

    def _period(self, scope="weekly", user=None, portfolio=None):
        return CoachPeriod.objects.create(
            id=f"{scope}-{user.pk if user else 'demo'}",
            user=user,
            portfolio=portfolio,
            scope=scope,
            label="هفته",
            range="x - y",
            summary="s",
            net="+1",
            win_rate="50%",
            scores=[],
            stats=[],
            weaknesses=[],
            strengths=[],
            highlights=[],
            action_plan=[],
            generated=True,
            sort_key=1,
        )

    def test_list_scoped_with_scope_filter(self):
        self._period(scope="weekly", user=self.user, portfolio=self.portfolio)
        self._period(scope="daily", user=self.user, portfolio=self.portfolio)
        items = self.get_list("/api/coach/periods/", scope="daily")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["scope"], "daily")

    def test_scoping(self):
        self._period(scope="weekly", user=self.user, portfolio=self.portfolio)
        self._period(scope="weekly", user=self.make_user(username="other"))
        self.assertEqual(len(self.get_list("/api/coach/periods/")), 1)

    def test_archive_list(self):
        ArchivedReport.objects.create(
            id="ar-1",
            user=self.user,
            kind="monthly",
            year="1405",
            month="مرداد",
            title="گزارش مرداد",
            range="x",
            net="+100",
            win_rate="60%",
            lines=[],
            sort_key=1,
        )
        items = self.get_list("/api/coach/archive/")
        self.assertEqual(items[0]["title"], "گزارش مرداد")
        self.assertEqual(items[0]["winRate"], "60%")