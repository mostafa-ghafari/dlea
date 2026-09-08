"""Tests for the Jalali calendar grid: days-in-month, Saturday offset, PnL."""

from datetime import date, datetime, timezone as dt_timezone
from unittest.mock import patch

import jdatetime

from api.tests.common import BaseTestCase


def _expected_grid(j_year, j_month):
    """Re-implement the grid math independently for assertions."""
    first_greg = jdatetime.date(j_year, j_month, 1).togregorian()
    sat_based_offset = (first_greg.weekday() - 5) % 7
    if j_month <= 6:
        dim = 31
    elif j_month <= 11:
        dim = 30
    else:
        # Esfand: 30 days iff (year,12,30) exists in the Jalali calendar.
        try:
            jdatetime.date(j_year, 12, 30)
            dim = 30
        except ValueError:
            dim = 29
    total = ((sat_based_offset + dim + 6) // 7) * 7
    return sat_based_offset, dim, total


def _dt(y, m, d, hh=12, mm=0):
    return datetime(y, m, d, hh, mm, tzinfo=dt_timezone.utc)


class CalendarGridTests(BaseTestCase):
    """Verify the grid shape for a fixed month (1405/06 = شهریور, 31 days)."""

    JY, JM = 1405, 6

    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)

    def _get(self, **params):
        base = {"year": self.JY, "month": self.JM}
        base.update(params)
        return self.client.get("/api/calendar/", base)

    def test_grid_shape_and_saturday_offset(self):
        offset, dim, total = _expected_grid(self.JY, self.JM)
        r = self._get()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), total)
        days = [c["day"] for c in r.data]
        # Leading empties match the Saturday offset
        self.assertEqual([d for d in days if d is None][:offset], [None] * offset)
        # All month days present in order
        self.assertEqual([d for d in days if d is not None], list(range(1, dim + 1)))

    def test_pnl_and_trade_aggregation(self):
        # Build a few trades on known Gregorian dates, then map to Jalali days.
        from jdatetime import date as jdate

        p = self.portfolio
        # 2026-08-23 is a specific Jalali day in 1405/06 — compute it
        target = jdate.fromgregorian(date=date(2026, 8, 23))
        if target.month == self.JM and target.year == self.JY:
            self.make_trade(p, pnl=100, close_time=_dt(2026, 8, 23, 10))
            self.make_trade(p, pnl=-30, close_time=_dt(2026, 8, 23, 14))
            self.make_trade(p, pnl=50, close_time=_dt(2026, 8, 24, 9))
        else:
            self.skipTest("fixed sample date not in the tested month")

        r = self._get()
        by_day = {c["day"]: c for c in r.data}
        day = by_day[target.day]
        self.assertEqual(day["pnl"], 70.0)
        self.assertEqual(day["trades"], 2)
        self.assertEqual(by_day[target.day + 1]["pnl"], 50.0)
        self.assertEqual(by_day[target.day + 1]["trades"], 1)

    def test_leap_esfand_has_30_days(self):
        # 1403 is a leap year → Esfand 30 days
        r = self.client.get("/api/calendar/", {"year": 1403, "month": 12})
        _, dim, total = _expected_grid(1403, 12)
        self.assertEqual(dim, 30)
        days = [c["day"] for c in r.data if c["day"] is not None]
        self.assertEqual(len(days), 30)
        self.assertEqual(len(r.data), total)

    def test_non_leap_esfand_has_29_days(self):
        # 1409 is not a leap year → Esfand 29 days
        r = self.client.get("/api/calendar/", {"year": 1409, "month": 12})
        _, dim, total = _expected_grid(1409, 12)
        self.assertEqual(dim, 29)
        days = [c["day"] for c in r.data if c["day"] is not None]
        self.assertEqual(len(days), 29)
        self.assertEqual(len(r.data), total)

    def test_1405_esfand_has_29_days(self):
        # 1405 is NOT a leap year — the Larizan shortcut wrongly marks it leap.
        r = self.client.get("/api/calendar/", {"year": 1405, "month": 12})
        _, dim, total = _expected_grid(1405, 12)
        self.assertEqual(dim, 29)
        days = [c["day"] for c in r.data if c["day"] is not None]
        self.assertEqual(len(days), 29)
        self.assertEqual(len(r.data), total)

    def test_invalid_year_month_falls_back_to_defaults(self):
        r = self.client.get("/api/calendar/", {"year": "abc", "month": "xyz"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(len(r.data) > 0)

    def test_anonymous_sees_demo_trades_only(self):
        self.client.force_authenticate(user=None)
        demo = self.make_portfolio(user=None, name="demo")
        self.make_trade(demo, pnl=10, close_time=_dt(2026, 8, 23, 10))
        r = self.client.get("/api/calendar/", {"year": self.JY, "month": self.JM})
        self.assertEqual(r.status_code, 200)
        days_with_pnl = [c for c in r.data if c["pnl"] != 0]
        self.assertEqual(len(days_with_pnl), 1)


class CalendarLiveEventsTests(BaseTestCase):
    def test_list_falls_back_to_empty_when_fetch_fails(self):
        with patch(
            "api.views.DashboardView._get_live_events", return_value=[]
        ):
            r = self.client.get("/api/economic-events/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, [])