"""Tests for the dashboard aggregate: equity curve, win rate, profit factor."""

from datetime import datetime, timezone as dt_timezone
from unittest.mock import patch

from api.tests.common import BaseTestCase


def _dt(y, m, d, hh=12):
    return datetime(y, m, d, hh, 0, tzinfo=dt_timezone.utc)


class DashboardEmptyTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.make_portfolio(user=self.user, initial=1000)

    @patch("api.views.DashboardView._get_live_events", return_value=[])
    def test_empty_account_returns_zeroed_payload(self, _):
        r = self.client.get("/api/dashboard/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(data["tradeCount"], 0)
        self.assertEqual(data["totalPnl"], 0.0)
        self.assertEqual(data["winRate"], 0.0)
        self.assertEqual(data["profitFactor"], 0.0)
        self.assertEqual(data["maxDrawdown"], 0.0)
        self.assertEqual(data["equityCurve"], [])
        self.assertEqual(data["monthlyPerformance"], [])
        self.assertIsNone(data["bestTrade"])
        self.assertIsNone(data["worstTrade"])
        # win/loss split is 0/100 for no trades
        self.assertEqual(data["winLossData"][0]["value"], 0)


class DashboardMathTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user, initial=1000)

    def _get(self):
        with patch("api.views.DashboardView._get_live_events", return_value=[]):
            return self.client.get("/api/dashboard/")

    def test_equity_curve_starts_at_initial_balance(self):
        self.make_trade(self.portfolio, pnl=100, close_time=_dt(2026, 8, 20))
        self.make_trade(self.portfolio, pnl=-50, close_time=_dt(2026, 8, 21))
        data = self._get().data
        curve = data["equityCurve"]
        self.assertEqual(curve[0]["equity"], 1000.0)
        # Two distinct days → initial point + one point per day
        self.assertEqual(len(curve), 3)
        self.assertEqual(curve[-1]["equity"], 1050.0)

    def test_win_rate_and_split(self):
        self.make_trade(self.portfolio, pnl=100, close_time=_dt(2026, 8, 20))
        self.make_trade(self.portfolio, pnl=50, close_time=_dt(2026, 8, 21))
        self.make_trade(self.portfolio, pnl=-50, close_time=_dt(2026, 8, 22))
        data = self._get().data
        self.assertEqual(data["tradeCount"], 3)
        self.assertEqual(data["totalPnl"], 100.0)
        self.assertEqual(data["winRate"], 66.7)
        split = {w["name"]: w["value"] for w in data["winLossData"]}
        self.assertEqual(split["برنده"], 67)
        self.assertEqual(split["بازنده"], 33)

    def test_profit_factor_with_losses(self):
        self.make_trade(self.portfolio, pnl=200, close_time=_dt(2026, 8, 20))
        self.make_trade(self.portfolio, pnl=-100, close_time=_dt(2026, 8, 21))
        data = self._get().data
        self.assertEqual(data["profitFactor"], 2.0)

    def test_profit_factor_no_losses_returns_999(self):
        self.make_trade(self.portfolio, pnl=50, close_time=_dt(2026, 8, 20))
        data = self._get().data
        self.assertEqual(data["profitFactor"], 999.0)

    def test_max_drawdown(self):
        # Peak 1000 → then drop 100 → drawdown 10% (stored as negative)
        self.make_trade(self.portfolio, pnl=-100, close_time=_dt(2026, 8, 20))
        data = self._get().data
        self.assertEqual(data["maxDrawdown"], -10.0)

    def test_monthly_performance_buckets(self):
        self.make_trade(self.portfolio, pnl=10, close_time=_dt(2026, 8, 20))
        self.make_trade(self.portfolio, pnl=20, close_time=_dt(2026, 8, 21))
        data = self._get().data
        months = data["monthlyPerformance"]
        self.assertEqual(len(months), 1)
        # Aug 20-21 2026 falls in مرداد 1405 (شهریور starts on 23 Aug)
        self.assertEqual(months[0]["month"], "مرداد ۱۴۰۵")
        self.assertEqual(months[0]["pnl"], 30.0)

    def test_best_and_worst_trade(self):
        self.make_trade(self.portfolio, pnl=200, rr=3.0, close_time=_dt(2026, 8, 20))
        self.make_trade(self.portfolio, pnl=-80, rr=1.5, close_time=_dt(2026, 8, 21))
        data = self._get().data
        self.assertEqual(data["bestTrade"]["pnl"], 200.0)
        self.assertEqual(data["worstTrade"]["pnl"], -80.0)
        self.assertEqual(data["bestTrade"]["symbol"], "XAUUSD")

    def test_portfolio_filter(self):
        p2 = self.make_portfolio(user=self.user, name="دوم", is_active=False)
        self.make_trade(self.portfolio, pnl=100, close_time=_dt(2026, 8, 20))
        self.make_trade(p2, pnl=500, close_time=_dt(2026, 8, 20))
        data = self._get().data
        self.assertEqual(data["totalPnl"], 600.0)
        with patch("api.views.DashboardView._get_live_events", return_value=[]):
            r = self.client.get(f"/api/dashboard/?portfolio={self.portfolio.pk}")
        self.assertEqual(r.data["totalPnl"], 100.0)

    def test_anonymous_demo_scoping(self):
        self.client.force_authenticate(user=None)
        demo = self.make_portfolio(user=None, name="demo", initial=500)
        self.make_trade(demo, pnl=25, close_time=_dt(2026, 8, 20))
        data = self._get().data
        self.assertEqual(data["tradeCount"], 1)
        self.assertEqual(data["totalPnl"], 25.0)
        self.assertEqual(data["equityCurve"][0]["equity"], 500.0)