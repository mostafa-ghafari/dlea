"""Tests for the stop/R:R repair path (`repair_stops` + the admin action)."""

from io import StringIO

from django.core.management import call_command

from api.models import MTConnection, Trade
from api.tests.common import BaseTestCase, User


class CommandRunner:
    """Mixin: run the management command and capture its output."""

    def run_command(self, *args):
        out = StringIO()
        call_command("repair_stops", *args, stdout=out)
        return out.getvalue()


class RepairStopsCommandTests(CommandRunner, BaseTestCase):
    def setUp(self):
        self.portfolio = self.make_portfolio(user=self.make_user(username="trader"))

    def test_dry_run_reports_without_writing(self):
        trade = self.make_trade(
            self.portfolio, ticket="3001", sl=0, tp=0, comment="[sl 1.16225]"
        )

        out = self.run_command()

        self.assertIn("Dry run", out)
        self.assertIn("1 of 1", out)
        trade.refresh_from_db()
        self.assertEqual(float(trade.sl), 0)

    def test_apply_fills_stop_loss_from_comment(self):
        trade = self.make_trade(
            self.portfolio, ticket="3002", sl=0, tp=0, comment="[sl 1.16225]"
        )

        out = self.run_command("--apply")

        self.assertIn("Repaired 1 of 1", out)
        self.assertIn("SL filled: 1", out)
        trade.refresh_from_db()
        self.assertEqual(float(trade.sl), 1.16225)
        self.assertEqual(float(trade.tp), 0)

    def test_apply_fills_take_profit_from_comment(self):
        trade = self.make_trade(
            self.portfolio, ticket="3003", sl=0, tp=0, comment="[tp 1.16204]"
        )

        self.run_command("--apply", "--show")

        trade.refresh_from_db()
        self.assertEqual(float(trade.tp), 1.16204)
        self.assertEqual(float(trade.sl), 0)

    def test_never_overwrites_existing_levels(self):
        trade = self.make_trade(
            self.portfolio,
            ticket="3004",
            sl=1.1,
            tp=0,
            comment="[sl 1.16225] [tp 1.16204]",
        )

        self.run_command("--apply")

        trade.refresh_from_db()
        self.assertEqual(float(trade.sl), 1.1)  # stored value wins
        self.assertEqual(float(trade.tp), 1.16204)  # missing one is filled

    def test_trade_without_markers_is_untouched(self):
        trade = self.make_trade(
            self.portfolio, ticket="3005", sl=0, tp=0, comment="[manual close]"
        )

        out = self.run_command("--apply")

        self.assertIn("Repaired 0 of 1", out)
        trade.refresh_from_db()
        self.assertEqual(float(trade.sl), 0)
        self.assertEqual(float(trade.tp), 0)

    def test_trades_with_complete_stops_are_skipped(self):
        self.make_trade(self.portfolio, ticket="3006", sl=1.1, tp=1.2, comment="[sl 9]")

        out = self.run_command("--apply")

        self.assertIn("Repaired 0 of 0", out)

    def test_portfolio_filter_limits_the_repair(self):
        other = self.make_portfolio(user=self.portfolio.user, name="دوم")
        mine = self.make_trade(
            self.portfolio, ticket="3007", sl=0, tp=0, comment="[sl 1.5]"
        )
        theirs = self.make_trade(
            other, ticket="3008", sl=0, tp=0, comment="[sl 2.5]", symbol="EURUSD"
        )

        self.run_command("--apply", "--portfolio", str(other.pk))

        mine.refresh_from_db()
        theirs.refresh_from_db()
        self.assertEqual(float(mine.sl), 0)
        self.assertEqual(float(theirs.sl), 2.5)

    def test_is_idempotent(self):
        trade = self.make_trade(
            self.portfolio, ticket="3009", sl=0, tp=0, comment="[sl 1.16225]"
        )

        self.run_command("--apply")
        out = self.run_command("--apply")

        # The second pass still scans the trade (tp is legitimately 0) but
        # has nothing left to fill.
        self.assertIn("Repaired 0 of 1", out)
        trade.refresh_from_db()
        self.assertEqual(float(trade.sl), 1.16225)


class RrRepairTests(CommandRunner, BaseTestCase):
    """R:R is |exit - entry| / |entry - sl| — and needs a stop to exist."""

    def setUp(self):
        self.user = self.make_user(username="trader")
        self.portfolio = self.make_portfolio(user=self.user)

    def test_command_recomputes_nonsense_rr(self):
        trade = self.make_trade(
            self.portfolio,
            ticket="5001",
            entry=1.16215,
            exit=1.16225,
            sl=1.16233,
            rr=617,
        )

        out = self.run_command("--apply", "--rr")

        self.assertIn("R:R recomputed: 1", out)
        trade.refresh_from_db()
        # |1.16225 - 1.16215| / |1.16215 - 1.16233|
        self.assertAlmostEqual(float(trade.rr), 0.56, places=2)

    def test_command_leaves_plausible_rr_alone(self):
        trade = self.make_trade(self.portfolio, ticket="5002", sl=1990, rr=2.5)

        out = self.run_command("--apply", "--rr")

        self.assertIn("R:R recomputed: 0", out)
        trade.refresh_from_db()
        self.assertEqual(float(trade.rr), 2.5)

    def test_command_cannot_compute_rr_without_a_stop(self):
        trade = self.make_trade(
            self.portfolio, ticket="5003", sl=0, tp=0, rr=0, comment="[manual close]"
        )

        out = self.run_command("--apply", "--rr")

        self.assertIn("R:R recomputed: 0", out)
        trade.refresh_from_db()
        self.assertEqual(float(trade.rr), 0)

    def test_dry_run_previews_rr_repairs(self):
        self.make_trade(self.portfolio, ticket="5004", rr=617)

        out = self.run_command("--rr")

        self.assertIn("R:R 617", out)
        self.assertIn("Dry run", out)
        self.assertEqual(float(Trade.objects.get(ticket="5004").rr), 617)

    def test_creation_fills_missing_rr_from_the_stop(self):
        self.auth(self.user)
        payload = dict(self.trade_payload(self.portfolio, ticket="5006"), sl=1990, rr=0)

        r = self.client.post("/api/trades/", payload, format="json")

        self.assertEqual(r.status_code, 201)
        # |2005 - 2000| / |2000 - 1990|
        self.assertEqual(float(r.data["rr"]), 0.5)

    def test_webhook_backfills_rr_once_the_stop_is_known(self):
        """A stop that arrives late also makes R:R computable at last."""
        first = dict(self.trade_payload(self.portfolio, ticket="5005"), sl=0, rr=0)
        self.client.post("/api/trades/import/", [first], format="json")
        self.assertEqual(float(Trade.objects.get(ticket="5005").rr), 0)

        MTConnection.objects.create(
            user=self.user,
            portfolio=self.portfolio,
            account="1",
            token="tok-rr",
        )
        later = dict(
            self.trade_payload(self.portfolio, ticket="5005"),
            sl=1990,
            rr=0,
            comment="[sl 1990]",
        )
        r = self.client.post(
            "/api/trades/webhook/",
            {"token": "tok-rr", "trades": [later]},
            format="json",
        )

        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["updated"], 1)
        trade = Trade.objects.get(ticket="5005")
        self.assertEqual(float(trade.sl), 1990)
        self.assertEqual(float(trade.rr), 0.5)


class RepairAdminActionTests(BaseTestCase):
    """The same repairs, exposed as Django admin actions."""

    STOP_ACTION = "repair_missing_stops"
    RR_ACTION = "recompute_rr"

    def setUp(self):
        self.portfolio = self.make_portfolio()
        self.staff = User.objects.create_superuser(
            username="root", email="root@example.com", password="pass12345"
        )
        self.client.force_login(self.staff)

    def run_action(self, action, *trades):
        return self.client.post(
            "/admin/api/trade/",
            {
                "action": action,
                "_selected_action": [str(t.pk) for t in trades],
            },
            follow=True,
        )

    def test_actions_are_registered_on_the_trade_admin(self):
        from django.contrib import admin

        self.assertIn(self.STOP_ACTION, admin.site._registry[Trade].actions)
        self.assertIn(self.RR_ACTION, admin.site._registry[Trade].actions)

    def test_stop_action_fills_only_the_selected_trades(self):
        selected = self.make_trade(
            self.portfolio, ticket="4001", sl=0, tp=0, comment="[sl 1.16225]"
        )
        untouched = self.make_trade(
            self.portfolio, ticket="4002", sl=0, tp=0, comment="[sl 1.5]"
        )

        response = self.run_action(self.STOP_ACTION, selected)

        self.assertEqual(response.status_code, 200)
        selected.refresh_from_db()
        untouched.refresh_from_db()
        self.assertEqual(float(selected.sl), 1.16225)
        self.assertEqual(float(untouched.sl), 0)

    def test_stop_action_reports_the_repair_count(self):
        trade = self.make_trade(
            self.portfolio, ticket="4003", sl=0, tp=0, comment="[sl 1.1] [tp 1.9]"
        )

        response = self.run_action(self.STOP_ACTION, trade)

        content = response.content.decode()
        self.assertIn("1 معامله ترمیم شد", content)
        self.assertIn("SL: 1", content)
        self.assertIn("TP: 1", content)

    def test_stop_action_warns_when_nothing_can_be_repaired(self):
        trade = self.make_trade(
            self.portfolio, ticket="4004", sl=0, tp=0, comment="[manual close]"
        )

        response = self.run_action(self.STOP_ACTION, trade)

        self.assertIn("قابل ترمیم نبود", response.content.decode())
        trade.refresh_from_db()
        self.assertEqual(float(trade.sl), 0)

    def test_stop_action_explains_what_it_left_alone(self):
        broken = self.make_trade(
            self.portfolio, ticket="4005", sl=0, tp=0, comment="[sl 1.2]"
        )
        complete = self.make_trade(
            self.portfolio, ticket="4006", sl=1.1, tp=1.2, comment="[sl 9.9]"
        )

        response = self.run_action(self.STOP_ACTION, broken, complete)

        content = response.content.decode()
        self.assertIn("1 معامله ترمیم شد", content)
        self.assertIn("دست‌نخورده ماند", content)
        complete.refresh_from_db()
        self.assertEqual(float(complete.sl), 1.1)  # stored value preserved

    def test_rr_action_recomputes_only_implausible_values(self):
        bogus = self.make_trade(
            self.portfolio, ticket="4007", entry=2000, exit=2005, sl=1990, rr=617
        )
        fine = self.make_trade(self.portfolio, ticket="4008", rr=2.5)

        response = self.run_action(self.RR_ACTION, bogus, fine)

        self.assertIn("R:R برای 1 معامله", response.content.decode())
        bogus.refresh_from_db()
        fine.refresh_from_db()
        self.assertEqual(float(bogus.rr), 0.5)
        self.assertEqual(float(fine.rr), 2.5)

    def test_rr_action_warns_when_everything_is_plausible(self):
        trade = self.make_trade(self.portfolio, ticket="4009", rr=1.5)

        response = self.run_action(self.RR_ACTION, trade)

        self.assertIn("نیاز به بازمحاسبه نداشت", response.content.decode())
        trade.refresh_from_db()
        self.assertEqual(float(trade.rr), 1.5)
