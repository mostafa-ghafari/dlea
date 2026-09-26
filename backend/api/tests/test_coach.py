"""Tests for the AI coach: insights, generation (Gemini mocked), periods."""

import io
import json
import os
import time
import urllib.error
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

from rest_framework import status

from api import gemini
from api.models import (
    AiApiCall,
    ArchivedReport,
    CoachInsights,
    CoachPeriod,
    Trade,
)
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


class CoachContextTests(BaseTestCase):
    """The prompt must carry the trader's own risk rules, journal and history.

    These are the parts of the request the numbers cannot express: the caps the
    coach is judged against, what the trader wrote about the period, and what
    the previous report already told them.
    """

    GEMINI_JSON = json.dumps(
        {
            "summary": "خلاصه",
            "scores": [],
            "weaknesses": [],
            "strengths": [],
            "highlights": [],
            "actionPlan": [],
        }
    )

    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user, initial=1000)
        # Two losing trades on one day: worst loss 50$ = 5% of the 1000$ balance,
        # which the 1% default per-trade cap cannot accept.
        self.make_trade(self.portfolio, pnl=-50, rr=1.0)
        self.make_trade(self.portfolio, pnl=-30, rr=1.0)

    def _generate(self, payload=None):
        """POST /coach/generate/ with the real prompt assembly, capturing the prompt."""
        with patch("api.views.gemini.get_api_key", return_value="k"), patch(
            "api.gemini.call_gemini", return_value=self.GEMINI_JSON
        ) as call:
            response = self.client.post(
                "/api/coach/generate/",
                {"scope": "weekly", "portfolio": self.portfolio.pk, **(payload or {})},
                format="json",
            )
        return response, (call.call_args[0][0] if call.called else "")

    def test_risk_rules_from_the_request_reach_the_prompt(self):
        response, prompt = self._generate({"risk": {"maxDailyTrades": 1}})
        self.assertEqual(response.status_code, 201)
        self.assertIn("قوانین مدیریت ریسک", prompt)
        self.assertIn("حداکثر تعداد معاملات روزانه: سقف 1", prompt)
        self.assertIn("نقض شده", prompt)
        # 50$ of a 1000$ account against the default 1% per-trade cap.
        self.assertIn("بدترین معاملهٔ این بازه 5%", prompt)

    def test_without_a_risk_payload_the_section_is_skipped(self):
        response, prompt = self._generate()
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("قوانین مدیریت ریسک", prompt)

    def test_journal_notes_of_the_period_are_summarised(self):
        self.make_journal_entry(
            user=self.user,
            title="معامله عجولانه",
            mistakes="ورود بی‌صبرانه",
            lesson="منتظر تأییدیه بمان",
            plan=False,
        )
        _, prompt = self._generate()
        self.assertIn("ژورنال این بازه", prompt)
        self.assertIn("ورود بی‌صبرانه", prompt)
        self.assertIn("منتظر تأییدیه بمان", prompt)
        self.assertIn("خارج از پلن", prompt)

    def test_previous_report_is_fed_back_as_context(self):
        CoachPeriod.objects.create(
            id="ai-old-week",
            user=self.user,
            portfolio=self.portfolio,
            scope="weekly",
            label="هفته پیش",
            range="۱ تا ۷",
            summary="خلاصهٔ قبلی",
            net="+10",
            win_rate="50%",
            scores=[],
            stats=[],
            weaknesses=[{"title": "ورود زودهنگام", "severity": "مهم"}],
            strengths=[],
            highlights=[],
            action_plan=["منتظر کندل بسته بمان"],
            generated=True,
            sort_key=10,
        )
        _, prompt = self._generate()
        self.assertIn("گزارش‌های گذشته", prompt)
        self.assertIn("ورود زودهنگام", prompt)
        self.assertIn("منتظر کندل بسته بمان", prompt)

    def test_the_report_being_regenerated_is_not_its_own_context(self):
        key = gemini.period_key("weekly", list(Trade.objects.all()))
        CoachPeriod.objects.create(
            id=f"{key}-u{self.user.pk}-p{self.portfolio.pk}",
            user=self.user,
            portfolio=self.portfolio,
            scope="weekly",
            label="برچسب-تکراری",
            range="x",
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
            sort_key=99,
        )
        _, prompt = self._generate()
        # The section is skipped entirely: the coach must not be told what it
        # said about this very bucket a moment ago.
        self.assertNotIn("## گزارش‌های گذشته", prompt)
        self.assertNotIn("برچسب-تکراری", prompt)

    def test_another_accounts_report_stays_out_of_the_context(self):
        other = self.make_portfolio(user=self.make_user(username="other"), name="دیگری")
        CoachPeriod.objects.create(
            id="ai-other",
            user=other.user,
            portfolio=other,
            scope="weekly",
            label="حساب دیگران",
            range="x",
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
            sort_key=99,
        )
        _, prompt = self._generate()
        self.assertNotIn("حساب دیگران", prompt)


class RiskRuleTests(BaseTestCase):
    """Risk caps arrive with the request; nothing about them may be guessed."""

    @staticmethod
    def _trade(pnl, rr=2.0, hour=10, day=0):
        return SimpleNamespace(
            pnl=pnl,
            rr=rr,
            close_time=datetime(2026, 9, 1, hour, tzinfo=timezone.utc)
            + timedelta(days=day),
        )

    def test_defaults_are_used_when_the_request_sends_nothing(self):
        self.assertEqual(gemini.normalize_risk(None), gemini.DEFAULT_RISK_RULES)
        self.assertEqual(gemini.normalize_risk({}), gemini.DEFAULT_RISK_RULES)

    def test_each_invalid_value_falls_back_on_its_own(self):
        rules = gemini.normalize_risk(
            {"maxRiskPct": "2.5", "maxDailyTrades": 0, "minRR": "soon", "junk": 1}
        )
        self.assertEqual(rules["maxRiskPct"], 2.5)
        self.assertEqual(rules["maxDailyTrades"], gemini.DEFAULT_RISK_RULES["maxDailyTrades"])
        self.assertEqual(rules["minRR"], gemini.DEFAULT_RISK_RULES["minRR"])
        self.assertNotIn("junk", rules)

    def test_percentage_rules_are_skipped_without_a_balance(self):
        lines = gemini.build_context(
            [self._trade(-20), self._trade(-20)],
            risk=gemini.DEFAULT_RISK_RULES,
            balance=0,
        )
        joined = "\n".join(lines)
        self.assertIn("موجودی حساب در دسترس نیست", joined)
        self.assertNotIn("بدترین معاملهٔ این بازه", joined)

    def test_daily_caps_are_measured_per_day_not_per_period(self):
        """Two quiet days must not read as one day that broke the daily cap."""
        lines = gemini.build_context(
            [self._trade(-20, day=0), self._trade(-20, day=1)],
            risk=gemini.DEFAULT_RISK_RULES,
            balance=1000,
        )
        joined = "\n".join(lines)
        # Worst day is 20$ = 2% against a 3% cap: respected, and the busiest day
        # holds a single trade.
        self.assertIn("بدترین روز این بازه 2%", joined)
        self.assertIn("پرترافیک‌ترین روز این بازه 1 معامله", joined)

    def test_a_broken_streak_is_reported_as_a_breach(self):
        lines = gemini.build_context(
            [self._trade(-10), self._trade(-10), self._trade(-10)],
            risk=gemini.DEFAULT_RISK_RULES,
            balance=1000,
        )
        joined = "\n".join(lines)
        self.assertIn("بلندترین زنجیرهٔ ضرر این بازه 3 (نقض شده)", joined)


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

    def test_the_relay_sees_a_named_user_agent(self):
        """Cloudflare bans `Python-urllib/3.x` at its edge, before the relay runs.

        urllib fills in that User-Agent whenever the request does not set one, so
        the default is a 403 from Cloudflare that looks like a broken relay.
        """
        captured = {}

        def fake_urlopen(request, timeout=None):
            # urllib stores header names capitalised ("User-Agent" -> "User-agent").
            captured["ua"] = request.get_header("User-agent")
            return self._answer()

        env = {"GEMINI_PROXY": "https://proxy.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", fake_urlopen):
            gemini.call_gemini("hi", "gemini-3.5-flash")
        self.assertEqual(captured["ua"], gemini.GEMINI_USER_AGENT)
        self.assertNotIn("urllib", captured["ua"].lower())

    @staticmethod
    def _ua_banned(request, timeout=None):
        """Cloudflare's browser-integrity ban: 403 before the relay's code runs."""
        raise urllib.error.HTTPError(
            request.full_url, 403, "Forbidden", {}, io.BytesIO(b"error code: 1010\n")
        )

    def test_a_cloudflare_user_agent_ban_names_its_cause(self):
        env = {"GEMINI_PROXY": "https://proxy.example", "GEMINI_API_KEY": "k"}
        with patch.dict(os.environ, env), patch(
            "api.gemini.urllib.request.urlopen", self._ua_banned
        ):
            with self.assertRaises(RuntimeError) as ctx:
                gemini.call_gemini("hi", "gemini-3.5-flash")
        message = str(ctx.exception)
        self.assertIn("User-Agent", message)
        self.assertNotIn("error code: 1010", message)  # name the cause, not the raw ban

    def test_a_user_agent_ban_does_not_burn_the_other_relays(self):
        """The User-Agent is ours, so every relay would be banned identically."""
        seen = []

        def fake_urlopen(request, timeout=None):
            seen.append(request.full_url)
            return self._ua_banned(request)

        env = {
            "GEMINI_PROXY": "https://a.example https://b.example https://c.example",
            "GEMINI_API_KEY": "k",
        }
        with patch.dict(os.environ, env), patch("api.gemini.urllib.request.urlopen", fake_urlopen):
            with self.assertRaises(RuntimeError):
                gemini.call_gemini("hi", "gemini-3.5-flash")
        self.assertEqual(len(seen), 1)


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