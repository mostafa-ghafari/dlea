"""Tests for the AI coach: insights, generation (Gemini mocked), periods."""

import io
import json
import os
import time
import urllib.error
from unittest.mock import patch

from rest_framework import status

from api import gemini
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


class GeminiRelayTests(BaseTestCase):
    """The Iran workaround: GEMINI_PROXY may prefix the Google URL, never rewrite it."""

    PATH = "models/gemini-3.5-flash:generateContent"
    PLAIN = f"https://generativelanguage.googleapis.com/v1beta/{PATH}"

    def test_without_proxy_asks_google_directly(self):
        with patch.dict(os.environ, {"GEMINI_PROXY": ""}):
            self.assertEqual(gemini.gemini_url(self.PATH), self.PLAIN)

    def test_proxy_prefixes_the_whole_google_url(self):
        with patch.dict(os.environ, {"GEMINI_PROXY": "https://proxy.example:9090/"}):
            self.assertEqual(gemini.gemini_url(self.PATH), f"https://proxy.example:9090/{self.PLAIN}")

    def test_call_gemini_posts_to_the_relay(self):
        captured = {}

        def fake_urlopen(request, timeout=None):
            captured["url"] = request.full_url
            return self._answer()

        env = {"GEMINI_PROXY": "https://proxy.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", fake_urlopen):
            self.assertEqual(gemini.call_gemini("hi", "gemini-3.5-flash"), "{}")
        self.assertEqual(captured["url"], f"https://proxy.example/{self.PLAIN}?key=k")

    @staticmethod
    def _answer():
        class FakeResponse:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def read(self):
                body = {"candidates": [{"content": {"parts": [{"text": "{}"}]}}]}
                return json.dumps(body).encode("utf-8")

        return FakeResponse()

    @staticmethod
    def _blocked(request, timeout=None):
        """Google's generic HTML 403 page: the geo block, not a key problem."""
        page = b"<!DOCTYPE html><html><title>Error 403 (Forbidden)!!1</title></html>"
        raise urllib.error.HTTPError(request.full_url, 403, "Forbidden", {}, io.BytesIO(page))

    def test_html_403_names_the_block_instead_of_dumping_html(self):
        env = {"GEMINI_PROXY": "https://proxy.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", self._blocked):
            with self.assertRaises(RuntimeError) as ctx:
                gemini.call_gemini("hi", "gemini-3.5-flash")
        message = str(ctx.exception)
        self.assertIn("403", message)
        self.assertIn("GEMINI_PROXY", message)
        self.assertNotIn("<!DOCTYPE", message)

    def test_blocked_relay_falls_back_to_the_next_one(self):
        seen = []

        def fake_urlopen(request, timeout=None):
            seen.append(request.full_url)
            if "blocked.example" in request.full_url:
                return self._blocked(request)
            return self._answer()

        env = {
            "GEMINI_PROXY": "https://blocked.example, https://good.example/",
            "GEMINI_API_KEY": "k",
        }
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", fake_urlopen):
            self.assertEqual(gemini.call_gemini("hi", "gemini-3.5-flash"), "{}")
        self.assertEqual(len(seen), 2)
        self.assertIn("good.example", seen[1])

    def test_key_error_does_not_try_the_next_relay(self):
        seen = []

        def fake_urlopen(request, timeout=None):
            seen.append(request.full_url)
            body = b'{"error": {"status": "INVALID_ARGUMENT", "message": "API key not valid"}}'
            raise urllib.error.HTTPError(request.full_url, 400, "Bad Request", {}, io.BytesIO(body))

        env = {"GEMINI_PROXY": "https://a.example https://b.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", fake_urlopen):
            with self.assertRaises(RuntimeError) as ctx:
                gemini.call_gemini("hi", "gemini-3.5-flash")
        self.assertEqual(len(seen), 1)  # a bad key is bad on every route
        self.assertIn("API key not valid", str(ctx.exception))


class GeminiTimeBudgetTests(BaseTestCase):
    """One budget for the whole call: extra relays must not add up to a 504.

    nginx answers 504 the moment its `proxy_read_timeout` expires, so a per
    attempt timeout would let two sleeping relays exceed it and hide the error
    message that names the route that failed.
    """

    def _spy(self, seen):
        """Google's HTML 403 page, recording the timeout each route was given."""

        def fake_urlopen(request, timeout=None):
            seen.append(timeout)
            raise urllib.error.HTTPError(
                request.full_url,
                403,
                "Forbidden",
                {},
                io.BytesIO(b"<!DOCTYPE html><html><title>Error 403</title></html>"),
            )

        return fake_urlopen

    def test_the_first_of_two_relays_may_not_take_more_than_its_share(self):
        seen = []
        env = {"GEMINI_PROXY": "https://a.example, https://b.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch(
            "api.gemini.urllib.request.urlopen", self._spy(seen)
        ):
            with self.assertRaises(RuntimeError):
                gemini.call_gemini("hi", "gemini-3.5-flash")

        budget = gemini.GEMINI_CALL_BUDGET_SECONDS
        self.assertEqual(len(seen), 2)
        # Half the budget each, so a dead first relay cannot spend the time the
        # second one needs. (Only the last route may use all that is left.)
        self.assertLessEqual(seen[0], budget / 2 + 0.5)
        for timeout in seen:
            self.assertLessEqual(timeout, budget)

    def test_a_sleeping_relay_cannot_starve_the_next_one(self):
        """A relay that burns its whole slice must still leave the next one time."""
        seen = []
        page = b"<!DOCTYPE html><html><title>Error 403</title></html>"

        def slow_then_blocked(request, timeout=None):
            seen.append(timeout)
            if len(seen) == 1:
                time.sleep(timeout)  # uses its entire slice, then dies
                raise urllib.error.URLError("timed out")
            raise urllib.error.HTTPError(request.full_url, 403, "Forbidden", {}, io.BytesIO(page))

        env = {
            "GEMINI_PROXY": "https://slow.example, https://good.example",
            "GEMINI_API_KEY": "k",
            "GEMINI_TIMEOUT": "4",
        }
        with patch.dict(os.environ, env), patch(
            "api.gemini.urllib.request.urlopen", slow_then_blocked
        ):
            with self.assertRaises(RuntimeError):
                gemini.call_gemini("hi", "gemini-3.5-flash")

        self.assertEqual(len(seen), 2)
        self.assertAlmostEqual(seen[0], 2.0, delta=0.2)  # half of the 4s budget
        self.assertAlmostEqual(seen[1], 2.0, delta=0.4)  # the other half survived

    def test_a_lone_route_still_gets_the_whole_budget(self):
        seen = []
        env = {"GEMINI_PROXY": "", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch(
            "api.gemini.urllib.request.urlopen", self._spy(seen)
        ):
            with self.assertRaises(RuntimeError):
                gemini.call_gemini("hi", "gemini-3.5-flash")

        self.assertEqual(len(seen), 1)
        self.assertAlmostEqual(seen[0], gemini.GEMINI_CALL_BUDGET_SECONDS, delta=0.5)

    def test_a_route_out_of_budget_is_named_not_silently_skipped(self):
        def slow(request, timeout=None):
            time.sleep(1.6)  # burns the whole (test-sized) budget
            raise urllib.error.URLError("timed out")

        env = {
            "GEMINI_PROXY": "https://slow.example, https://never-tried.example",
            "GEMINI_API_KEY": "k",
            "GEMINI_TIMEOUT": "1.5",
        }
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", slow):
            with self.assertRaises(RuntimeError) as ctx:
                gemini.call_gemini("hi", "gemini-3.5-flash")

        message = str(ctx.exception)
        self.assertIn("relay 2", message)
        self.assertIn("امتحان نشد", message)

    def test_timeout_env_var_overrides_the_budget(self):
        with patch.dict(os.environ, {"GEMINI_TIMEOUT": "12.5"}):
            self.assertEqual(gemini.gemini_call_budget(), 12.5)

    def test_unusable_timeout_env_var_falls_back_to_the_default(self):
        for value in ("", "soon", "0", "-3"):
            with patch.dict(os.environ, {"GEMINI_TIMEOUT": value}):
                self.assertEqual(
                    gemini.gemini_call_budget(), gemini.GEMINI_CALL_BUDGET_SECONDS
                )

    def test_a_dead_route_reports_a_timeout_in_plain_words(self):
        def dead(request, timeout=None):
            raise urllib.error.URLError("timed out")

        env = {"GEMINI_PROXY": "https://dead.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", dead):
            with self.assertRaises(RuntimeError) as ctx:
                gemini.call_gemini("hi", "gemini-3.5-flash")

        self.assertIn("مهلت", str(ctx.exception))

    def test_the_budget_stays_under_nginx_read_timeout(self):
        """A report must fail with our message, not the gateway's 504."""
        self.assertLess(gemini.GEMINI_CALL_BUDGET_SECONDS, 120)