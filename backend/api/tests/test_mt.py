"""Tests for the MetaTrader integration: connect, status, and EA webhook."""

import json
from pathlib import Path

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

    def test_connect_without_portfolio_follows_the_active_one(self):
        user = self.auth(self.make_user(username="trader"))
        portfolio = self.make_portfolio(user=user, name="فعال‌من")

        r = self.client.post("/api/mt/connect/", {"account": "1"}, format="json")

        self.assertIsNone(r.data["portfolioId"])
        self.assertTrue(r.data["followActivePortfolio"])
        self.assertEqual(r.data["destination"], portfolio.name)

    def test_connect_can_switch_back_to_following_the_active_one(self):
        user = self.auth(self.make_user(username="trader"))
        portfolio = self.make_portfolio(user=user)
        self.client.post(
            "/api/mt/connect/",
            {"account": "1", "portfolioId": portfolio.pk},
            format="json",
        )
        self.assertIsNotNone(MTConnection.objects.get(user=user).portfolio_id)

        r = self.client.post(
            "/api/mt/connect/",
            {"account": "1", "portfolioId": "active"},
            format="json",
        )

        self.assertIsNone(r.data["portfolioId"])
        self.assertIsNone(MTConnection.objects.get(user=user).portfolio_id)

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


class PortfolioSwitchDisconnectTests(BaseTestCase):
    """Switching the active portfolio must cut the EA link.

    One token covers every portfolio of a user, so leaving the link live would
    let a running EA keep importing the previous account's trades into the
    portfolio that just became active. The link is severed instead, and only an
    explicit reconnect revives it — on the active portfolio.
    """

    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))
        self.first = self.make_portfolio(user=self.user, name="اول")
        self.second = self.make_portfolio(user=self.user, name="دوم", is_active=False)
        self.client.post("/api/mt/connect/", {"account": "123"}, format="json")

    def _conn(self):
        return MTConnection.objects.get(user=self.user)

    def test_activating_another_portfolio_cuts_the_link(self):
        r = self.client.post(f"/api/portfolios/{self.second.pk}/activate/", format="json")

        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["mtDisconnected"])
        conn = self._conn()
        self.assertTrue(conn.disconnected)
        self.assertEqual(conn.disconnect_reason, "portfolio_switch")
        self.assertIsNone(conn.portfolio)
        status = self.client.get("/api/mt/status/").data
        self.assertFalse(status["connected"])
        self.assertEqual(status["disconnectReason"], "portfolio_switch")

    def test_a_disconnected_link_rejects_ea_pushes(self):
        self.client.post(f"/api/portfolios/{self.second.pk}/activate/", format="json")

        r = self.client.post(
            "/api/trades/webhook/",
            {"token": self._conn().token, "trades": [{"ticket": "1"}]},
            format="json",
        )

        self.assertEqual(r.status_code, 401)
        self.assertIn("قطع شده", r.json()["error"])

    def test_reactivating_the_same_portfolio_keeps_the_link(self):
        r = self.client.post(f"/api/portfolios/{self.first.pk}/activate/", format="json")

        self.assertFalse(r.data["mtDisconnected"])
        self.assertFalse(self._conn().disconnected)

    def test_reconnecting_revives_the_link_on_the_active_portfolio(self):
        self.client.post(f"/api/portfolios/{self.second.pk}/activate/", format="json")

        r = self.client.post("/api/mt/connect/", {"account": "123"}, format="json")

        self.assertTrue(r.data["connected"])
        self.assertEqual(r.data["destination"], self.second.name)
        self.assertFalse(self._conn().disconnected)
        push = self.client.post(
            "/api/trades/webhook/",
            {
                "token": self._conn().token,
                "trades": [
                    {
                        "ticket": "777",
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
                ],
            },
            format="json",
        )
        self.assertEqual(push.json()["created"], 1)
        self.assertEqual(Trade.objects.get(ticket="777").portfolio_id, self.second.pk)

    def test_creating_an_active_portfolio_also_cuts_the_link(self):
        r = self.client.post(
            "/api/portfolios/",
            self.portfolio_payload(name="سوم", is_active=True),
            format="json",
        )

        self.assertEqual(r.status_code, 201)
        self.assertTrue(self._conn().disconnected)

    def test_manual_disconnect_stops_the_ea(self):
        r = self.client.post("/api/mt/disconnect/", {}, format="json")

        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data["connected"])
        conn = self._conn()
        self.assertEqual(conn.disconnect_reason, "manual")
        push = self.client.post(
            "/api/trades/webhook/",
            {"token": conn.token, "trades": [{"ticket": "1"}]},
            format="json",
        )
        self.assertEqual(push.status_code, 401)

    def test_disconnect_requires_authentication(self):
        self.client.force_authenticate(None)
        r = self.client.post("/api/mt/disconnect/", {}, format="json")
        self.assertEqual(r.status_code, 401)


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

    def test_no_destination_returns_400(self):
        """Neither pinned nor active: nothing to import into."""
        self.portfolio.is_active = False
        self.portfolio.save(update_fields=["is_active"])
        MTConnection.objects.create(user=self.user, account="x", token="tok-no-pf")
        r = self._post({"token": "tok-no-pf", "trades": [{"ticket": "1"}]})
        self.assertEqual(r.status_code, 400)
        self.assertIn("پرتفولیوی", r.json()["error"])

    def test_missing_portfolio_is_recorded_server_side(self):
        """A dropped batch must leave a trace, or the loss is unexplainable."""
        self.portfolio.is_active = False
        self.portfolio.save(update_fields=["is_active"])
        MTConnection.objects.create(user=self.user, account="x", token="tok-log")
        log_path = Path("webhook_debug.log")
        before = log_path.read_text(encoding="utf-8") if log_path.exists() else ""
        try:
            r = self._post({"token": "tok-log", "trades": [{"ticket": "1"}]})
            self.assertEqual(r.status_code, 400)
            written = log_path.read_text(encoding="utf-8") if log_path.exists() else ""
            self.assertGreater(len(written), len(before))
            self.assertIn("no destination portfolio", written)
        finally:
            if before:
                log_path.write_text(before, encoding="utf-8")
            elif log_path.exists():
                log_path.unlink()

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

    def test_re_push_fills_stop_loss_added_after_entry(self):
        """A stop added to a live position must land on the stored trade.

        A trade that is pushed without SL/TP (or with the stop added after
        entry) has sl=0 in the first payload, so only a later push can
        deliver the value.
        """
        r1 = self._post({"token": "tok123", "trades": [self._trade_item()]})
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(float(Trade.objects.get(ticket="999").sl), 0)

        later = dict(self._trade_item(), sl="1.16225", comment="[sl 1.16225]")
        r2 = self._post({"token": "tok123", "trades": [later]})
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["updated"], 1)
        self.assertEqual(r2.json()["created"], 0)
        trade = Trade.objects.get(ticket="999")
        self.assertEqual(float(trade.sl), 1.16225)
        self.assertEqual(Trade.objects.filter(ticket="999").count(), 1)

    def test_re_push_never_overwrites_stored_stops(self):
        """A stale repeat push must not wipe or rewrite existing SL/TP."""
        first = dict(self._trade_item(), sl="1.1111", tp="1.2222")
        self.assertEqual(
            self._post({"token": "tok123", "trades": [first]}).status_code, 201
        )

        stale = dict(self._trade_item(), sl="9.9999", tp="0")
        r = self._post({"token": "tok123", "trades": [stale]})
        self.assertEqual(r.json()["skipped"], 1)
        self.assertEqual(r.json()["updated"], 0)
        trade = Trade.objects.get(ticket="999")
        self.assertEqual(float(trade.sl), 1.1111)
        self.assertEqual(float(trade.tp), 1.2222)

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

    def test_unpinned_connection_follows_the_active_portfolio(self):
        """One token, many portfolios: the server routes by what is active."""
        second = self.make_portfolio(user=self.user, name="دوم", is_active=False)
        self.portfolio.is_active = False
        self.portfolio.save(update_fields=["is_active"])
        second.is_active = True
        second.save(update_fields=["is_active"])
        conn = MTConnection.objects.get(token="tok123")
        conn.portfolio = None
        conn.save(update_fields=["portfolio"])

        r = self._post({"token": "tok123", "trades": [self._trade_item()]})

        self.assertEqual(r.json()["created"], 1)
        self.assertEqual(Trade.objects.get(ticket="999").portfolio_id, second.pk)

    def test_switching_the_active_portfolio_redirects_later_pushes(self):
        """The EA is never reconfigured when the trader switches portfolio."""
        second = self.make_portfolio(user=self.user, name="دوم", is_active=False)
        conn = MTConnection.objects.get(token="tok123")
        conn.portfolio = None
        conn.save(update_fields=["portfolio"])

        self._post({"token": "tok123", "trades": [self._trade_item()]})
        self.portfolio.is_active = False
        self.portfolio.save(update_fields=["is_active"])
        second.is_active = True
        second.save(update_fields=["is_active"])
        r = self._post(
            {"token": "tok123", "trades": [dict(self._trade_item(), ticket="1000")]}
        )

        self.assertEqual(r.json()["created"], 1)
        self.assertEqual(Trade.objects.get(ticket="999").portfolio_id, self.portfolio.pk)
        self.assertEqual(Trade.objects.get(ticket="1000").portfolio_id, second.pk)

    def test_pinned_connection_ignores_the_active_portfolio(self):
        second = self.make_portfolio(user=self.user, name="دوم", is_active=False)
        second.is_active = True
        second.save(update_fields=["is_active"])

        r = self._post({"token": "tok123", "trades": [self._trade_item()]})

        self.assertEqual(r.json()["created"], 1)
        # token "tok123" is pinned to self.portfolio in setUp
        self.assertEqual(Trade.objects.get(ticket="999").portfolio_id, self.portfolio.pk)

    def test_payload_can_override_the_destination(self):
        second = self.make_portfolio(user=self.user, name="دوم", is_active=False)

        r = self._post(
            {
                "token": "tok123",
                "portfolio_id": second.pk,
                "trades": [self._trade_item()],
            }
        )

        self.assertEqual(r.json()["created"], 1)
        self.assertEqual(Trade.objects.get(ticket="999").portfolio_id, second.pk)

    def test_payload_cannot_target_a_foreign_portfolio(self):
        foreign = self.make_portfolio(user=self.make_user(username="other"), name="بیگانه")

        r = self._post(
            {
                "token": "tok123",
                "portfolio_id": foreign.pk,
                "trades": [self._trade_item()],
            }
        )

        self.assertEqual(r.json()["created"], 1)
        self.assertEqual(Trade.objects.get(ticket="999").portfolio_id, self.portfolio.pk)

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