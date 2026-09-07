"""Tests for the read-only catalog endpoints: symbols, strategies, columns."""

from rest_framework import status

from api.models import ForexSymbol, Strategy, TradeColumn
from api.tests.common import BaseTestCase


class CatalogTests(BaseTestCase):
    def setUp(self):
        ForexSymbol.objects.create(code="XAUUSD")
        ForexSymbol.objects.create(code="EURUSD")
        Strategy.objects.create(name="پرایس اکشن")
        TradeColumn.objects.create(
            key="symbol", label="نماد", default_visible=True, admin_enabled=True, numeric=False
        )
        TradeColumn.objects.create(
            key="pnl", label="سود", default_visible=True, admin_enabled=False, numeric=True
        )

    def test_forex_symbols(self):
        codes = [s["code"] for s in self.get_list("/api/forex-symbols/")]
        self.assertIn("XAUUSD", codes)
        self.assertIn("EURUSD", codes)

    def test_strategies(self):
        items = self.get_list("/api/strategies/")
        self.assertEqual(items[0]["name"], "پرایس اکشن")

    def test_trade_columns(self):
        by_key = {c["key"]: c for c in self.get_list("/api/trade-columns/")}
        self.assertEqual(by_key["symbol"]["label"], "نماد")
        self.assertFalse(by_key["pnl"]["adminEnabled"])
        self.assertTrue(by_key["pnl"]["numeric"])

    def test_catalog_read_only(self):
        r = self.client.post("/api/forex-symbols/", {"code": "BTCUSD"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)