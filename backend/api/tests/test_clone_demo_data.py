"""Tests for the clone_demo_data command.

The command exists so a real account can open the app with the same dataset an
anonymous visitor sees. What matters is that the copy is complete, that it is
*independent* of the demo rows (mutating one must not touch the other), and that
the single-active-portfolio rule still holds afterwards.
"""

from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from api.models import JournalEntry, JournalGroup, Notification, Portfolio, Trade
from api.tests.common import BaseTestCase


class CloneDemoDataTests(BaseTestCase):
    def setUp(self):
        self.user = self.make_user(username="trader")
        # The shared demo: portfolios and trades owned by nobody.
        self.demo_portfolio = self.make_portfolio(user=None, name="نمونه اصلی")
        self.demo_other = self.make_portfolio(
            user=None, name="نمونه دوم", is_active=False
        )
        self.make_trade(self.demo_portfolio, symbol="EURUSD")
        self.make_trade(self.demo_portfolio, symbol="GBPUSD")
        self.make_trade(self.demo_other, symbol="XAUUSD")

    def clone(self, **options):
        out = StringIO()
        call_command(
            "clone_demo_data", email=self.user.email, stdout=out, **options
        )
        return out.getvalue()

    def test_copies_portfolios_and_their_trades(self):
        self.clone()

        owned = Portfolio.objects.filter(user=self.user)
        self.assertEqual(owned.count(), 2)
        self.assertEqual(Trade.objects.filter(portfolio__user=self.user).count(), 3)

        cloned = owned.get(name="نمونه اصلی")
        self.assertEqual(cloned.trade_set.count(), 2)
        # The demo rows are untouched, so the public demo keeps working.
        self.assertEqual(Portfolio.objects.filter(user__isnull=True).count(), 2)
        self.assertEqual(Trade.objects.filter(portfolio__user__isnull=True).count(), 3)

    def test_remaps_the_journal_group_an_entry_points_at(self):
        demo_group = self.make_journal_group(user=None, name="گروه نمونه")
        self.make_journal_entry(user=None, group=demo_group, title="یادداشت نمونه")

        self.clone()

        entry = JournalEntry.objects.get(user=self.user, title="یادداشت نمونه")
        self.assertIsNotNone(entry.group)
        self.assertNotEqual(entry.group.pk, demo_group.pk)
        self.assertEqual(entry.group.user, self.user)

    def test_remaps_the_portfolio_a_journal_entry_points_at(self):
        self.make_journal_entry(
            user=None, title="با پرتفولیو", portfolio=self.demo_portfolio
        )

        self.clone()

        entry = JournalEntry.objects.get(user=self.user, title="با پرتفولیو")
        self.assertEqual(entry.portfolio.user, self.user)
        self.assertEqual(entry.portfolio.name, "نمونه اصلی")

    def test_copies_ownerless_side_tables(self):
        Notification.objects.create(
            user=None, kind="news", title="خبر", desc="متن", time=timezone.localdate()
        )

        self.clone()

        self.assertEqual(Notification.objects.filter(user=self.user).count(), 1)
        self.assertEqual(Notification.objects.filter(user__isnull=True).count(), 1)

    def test_leaves_one_active_portfolio(self):
        self.make_portfolio(user=self.user, name="مال خودم", is_active=True)

        self.clone()

        active = Portfolio.objects.filter(user=self.user, is_active=True)
        self.assertEqual(active.count(), 1)

    def test_an_account_with_nothing_gets_an_active_portfolio(self):
        self.clone()

        active = Portfolio.objects.filter(user=self.user, is_active=True)
        self.assertEqual(active.count(), 1)

    def test_replace_drops_what_the_account_already_had(self):
        mine = self.make_portfolio(user=self.user, name="مال خودم")
        self.make_trade(mine, symbol="USDJPY")

        self.clone(replace=True)

        self.assertFalse(Portfolio.objects.filter(user=self.user, name="مال خودم").exists())
        self.assertFalse(Trade.objects.filter(portfolio__user=self.user, symbol="USDJPY").exists())
        self.assertEqual(Portfolio.objects.filter(user=self.user).count(), 2)

    def test_without_replace_the_existing_data_stays(self):
        mine = self.make_portfolio(user=self.user, name="مال خودم")
        self.make_trade(mine, symbol="USDJPY")

        self.clone()

        self.assertTrue(Portfolio.objects.filter(user=self.user, name="مال خودم").exists())
        self.assertEqual(Portfolio.objects.filter(user=self.user).count(), 3)

    def test_unknown_email_is_rejected(self):
        with self.assertRaises(CommandError):
            call_command("clone_demo_data", email="nobody@example.com", stdout=StringIO())

    def test_copying_twice_never_grows_the_shared_demo(self):
        self.clone()
        self.clone()

        # Without --replace the account ends up with a second copy; the shared
        # demo it was copied from is untouched either way.
        self.assertEqual(Portfolio.objects.filter(user=self.user).count(), 4)
        self.assertEqual(Portfolio.objects.filter(user__isnull=True).count(), 2)
        self.assertEqual(Trade.objects.filter(portfolio__user__isnull=True).count(), 3)
