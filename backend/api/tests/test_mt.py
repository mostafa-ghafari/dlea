"""Tests for the MetaTrader integration: connect, status, and EA webhook."""

import json

from rest_framework import status

from api.models import MTConnection, Trade
from api.tests.common import BaseTestCase


class MtConnectTests(BaseTestCase):
    def test_requires_authentication(self):
        r = self.client.post("/api/mt/connect/", {"account": "12345"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_connect_saves_settings_and_returns_token(self):
        user = self.auth(self.make_user(username="trader"))
        portfolio = self.make_portfolio(user=user)
        r = self.client.post(
            "/api/mt/connect/",
            {
                "account": "12345",
                "broker": "IC Markets",
                "server": "ICMarkets-Demo",
                "platform": "mt4",
                "portfolioId": portfolio.pk,
            },
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertTrue(data["connected"])
        self.assertTrue(data["token"])
        self.assertEqual(data["account"], "12345")
        self.assertEqual(data["platform"], "mt4")
        self.assertIn("/api/trades/webhook/", data["webhookUrl"])
        self.assertEqual(str(data["portfolioId"]), str(portfolio.pk))

    def test_connect_is_idempotent_same_token(self):
        user = self.auth(self.make_user(username="trader"))
        r1 = self.client.post("/api/mt/connect/", {"account": "111"}, format="json")
        r2 = self.client.post("/api/mt/connect/", {"account": "222"}, format="json")
        self.assertEqual(r1.data["token"], r2.data["token"])
        self.assertEqual(MTConnection.objects.filter(user=user).count(), 1)

    def test_connect_requires_account(self):
        user = self.auth(self.make_user(username="trader"))
        r = self.client.post("/api/mt/connect/", {"broker": "X"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_connect_ignores_foreign_portfolio(self):
        user = self.auth(self.make_user(username="trader"))
        foreign = self.make_portfolio(user=self.make_user(username="other"), name="other")
        r = self.client.post(
            "/api/mt/connect/", {"account": "1", "portfolioId": foreign.pk}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.data["portfolioId"])

    def test_status_before_connect(self):
        user = self.auth(self.make_user(username="trader"))
        r = self.client.get("/api/mt/status/")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data["connected"])

    def test_status_after_connect(self):
        user = self.auth(self.make_user(username="trader"))
        self.client.post("/api/mt/connect/", {"account": "999"}, format="json")
        r = self.client.get("/api/mt/status/")
        self.assertTrue(r.data["connected"])
        self.assertEqual(r.data["account"], "999")


class WebhookTests(BaseTestCase):
    def setUp(self):
        self.user = self.make_user(username="trader")
        self.portfolio = self.make_portfolio(user=self.user)
        self.conn = MTConnection.objects.create(
            user=self.user, portfolio=self.portfolio, account="123", token="tok123"
        )

    def _post(self, payload):
        return self.client.post("/api/trades/webhook/", payload, format="json")

    def test_invalid_token_returns_401(self):
        r = self._post({"token": "nope", "trades": []})
        self.assertEqual(r.status_code, 401)

    def test_missing_token_returns_401(self):
        r = self._post({"trades": []})
        self.assertEqual(r.status_code, 401)

    def test_empty_trades_returns_400(self):
        r = self._post({"token": "tok123", "trades": []})
        self.assertEqual(r.status_code, 400)

    def test_missing_portfolio_returns_400(self):
        MTConnection.objects.create(user=self.user, account="x", token="tok-no-pf")
        r = self._post({"token": "tok-no-pf", "trades": [{"ticket": "1"}]})
        self.assertEqual(r.status_code, 400)
        self.assertIn("پرتفولیوی", r.json()["error"])

    def test_valid_trade_created_with_normalized_datetime(self):
        payload = {
            "token": "tok123",
            "trades": [
                {
                    "ticket": "78901",
                    "symbol": "XAUUSD",
                    "side": "sell",
                    "entry": "2000.00",
                    "exit": "1990.00",
                    "volume": "0.10",
                    "pnl": "100.00",
                    "rr": "2.50",
                    "open_time": "2026.08.19 10:30",
                    "close_time": "2026.08.19 11:45",
                    "comment": "EA sync",
                }
            ],
        }
        r = self._post(payload)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["created"], 1)
        trade = Trade.objects.get(ticket="78901")
        self.assertEqual(trade.symbol, "XAUUSD")
        self.assertEqual(trade.side, "sell")
        # MT datetime normalized to ISO with seconds
        self.assertEqual(trade.close_time.isoformat(), "2026-08-19T11:45:00+00:00")
        # SL/TP/pips defaulted when the EA omits them
        self.assertEqual(float(trade.sl), 0)
        self.assertEqual(float(trade.tp), 0)
        self.assertEqual(float(trade.pips), 0)

    def test_webhook_body_with_trailing_null_bytes(self):
        """MetaTrader's StringToCharArray appends \\0 — must still parse."""
        body = json.dumps({"token": "tok123", "trades": [self._trade_item()]}).encode() + b"\x00\x00"
        r = self.client.post("/api/trades/webhook/", body, content_type="application/json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["created"], 1)

    def test_invalid_trade_reports_error(self):
        payload = {"token": "tok123", "trades": [{"ticket": "x"}]}
        r = self._post(payload)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()["created"], 0)
        self.assertIn("errors", r.json())

    def test_duplicate_trade_ticket_is_skipped(self):
        """Sending the same ticket twice should not create duplicates."""
        payload = {"token": "tok123", "trades": [self._trade_item()]}
        r1 = self._post(payload)
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r1.json()["created"], 1)
        self.assertEqual(Trade.objects.filter(ticket="999").count(), 1)

        # Send the same trade again (simulates MT restart)
        r2 = self._post(payload)
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["created"], 0)
        self.assertEqual(r2.json()["skipped"], 1)
        # Still only one record
        self.assertEqual(Trade.objects.filter(ticket="999").count(), 1)

    def _trade_item(self):
        return {
            "ticket": "999",
            "symbol": "EURUSD",
            "side": "buy",
            "entry": "1.1000",
            "exit": "1.1050",
            "volume": "1.00",
            "pnl": "50.00",
            "rr": "1.00",
            "open_time": "2026.08.19 08:00",
            "close_time": "2026.08.19 09:00",
        }