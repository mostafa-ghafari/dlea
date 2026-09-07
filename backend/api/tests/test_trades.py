"""Tests for the Trade API: CRUD, filters, bulk import, ownership scoping."""

from rest_framework import status

from api.models import Trade
from api.tests.common import BaseTestCase


class TradeCrudTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)

    def test_create_trade(self):
        r = self.client.post("/api/trades/", self.trade_payload(self.portfolio), format="json")
        self.assertEqual(r.status_code, 201)
        data = r.data
        self.assertEqual(data["symbol"], "XAUUSD")
        self.assertEqual(data["side"], "buy")
        self.assertEqual(data["pnl"], 50.0)
        self.assertIn("openTime", data)
        self.assertIn("closeTime", data)
        self.assertIn("duration", data)
        self.assertEqual(data["portfolio"], "اصلی")

    def test_create_trade_requires_portfolio(self):
        payload = self.trade_payload(self.portfolio)
        payload.pop("portfolio_id")
        r = self.client.post("/api/trades/", payload, format="json")
        self.assertEqual(r.status_code, 400)

    def test_create_trade_rejects_foreign_portfolio(self):
        other = self.make_portfolio(user=self.make_user(username="other"), name="مال دیگری")
        r = self.client.post("/api/trades/", self.trade_payload(other), format="json")
        self.assertEqual(r.status_code, 400)

    def test_list_and_retrieve(self):
        t = self.make_trade(self.portfolio)
        items = self.get_list("/api/trades/")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], str(t.pk))

    def test_update_trade(self):
        t = self.make_trade(self.portfolio, symbol="XAUUSD")
        r = self.client.patch(f"/api/trades/{t.pk}/", {"symbol": "EURUSD"}, format="json")
        self.assertEqual(r.status_code, 200)
        t.refresh_from_db()
        self.assertEqual(t.symbol, "EURUSD")

    def test_delete_trade(self):
        t = self.make_trade(self.portfolio)
        r = self.client.delete(f"/api/trades/{t.pk}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Trade.objects.filter(pk=t.pk).exists())


class TradeFilterTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.p1 = self.make_portfolio(user=self.user, name="A")
        self.p2 = self.make_portfolio(user=self.user, name="B", is_active=False)
        self.make_trade(self.p1, symbol="XAUUSD")
        self.make_trade(self.p1, symbol="eurusd")  # lowercase — iexact filter
        self.make_trade(self.p2, symbol="BTCUSD")

    def test_symbol_filter_is_case_insensitive(self):
        items = self.get_list("/api/trades/", symbol="EURUSD")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["symbol"], "eurusd")

    def test_portfolio_filter(self):
        items = self.get_list("/api/trades/", portfolio=self.p1.pk)
        self.assertEqual(len(items), 2)


class TradeScopingTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="u1"))
        self.p1 = self.make_portfolio(user=self.user)
        self.other = self.make_portfolio(user=self.make_user(username="u2"), name="دیگری")
        self.t1 = self.make_trade(self.p1, symbol="XAUUSD")
        self.t2 = self.make_trade(self.other, symbol="EURUSD")

    def test_users_only_see_own_trades(self):
        items = self.get_list("/api/trades/")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], str(self.t1.pk))

    def test_cannot_retrieve_foreign_trade(self):
        r = self.client.get(f"/api/trades/{self.t2.pk}/")
        self.assertEqual(r.status_code, 404)

    def test_anonymous_sees_only_demo_trades(self):
        self.client.force_authenticate(user=None)
        demo = self.make_portfolio(user=None, name="demo")
        self.make_trade(demo, symbol="XAUUSD")
        items = self.get_list("/api/trades/")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["symbol"], "XAUUSD")


class BulkImportTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.portfolio = self.make_portfolio(user=self.user)

    def test_valid_import_creates_all(self):
        items = [self.trade_payload(self.portfolio, ticket="1"), self.trade_payload(self.portfolio, ticket="2", symbol="EURUSD")]
        r = self.client.post("/api/trades/import/", items, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["created"], 2)
        self.assertEqual(Trade.objects.count(), 2)

    def test_partial_errors_reported(self):
        items = [
            self.trade_payload(self.portfolio, ticket="ok"),
            {"ticket": "bad", "symbol": "X"},  # missing required fields
        ]
        r = self.client.post("/api/trades/import/", items, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["created"], 1)
        self.assertIn("errors", r.data)

    def test_all_invalid_returns_400(self):
        r = self.client.post("/api/trades/import/", [{"ticket": "x"}], format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data["created"], 0)

    def test_non_list_body_returns_400(self):
        r = self.client.post("/api/trades/import/", {"trades": []}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_empty_list_returns_400(self):
        r = self.client.post("/api/trades/import/", [], format="json")
        self.assertEqual(r.status_code, 400)