"""Migration tests (moved from the legacy api/tests.py)."""

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

from api.models import Portfolio

TARGET_0013 = ("api", "0013_coachinsights_portfolio_coachperiod_portfolio_and_more")


class PortfolioActiveMigrationTests(TransactionTestCase):
    """Migration 0014 repairs legacy data where several portfolios were active."""

    def test_0014_normalizes_single_active_portfolio(self):
        executor = MigrationExecutor(connection)
        # Move the test DB back to the pre-fix state.
        executor.migrate([TARGET_0013])

        old_apps = executor.loader.project_state([TARGET_0013]).apps
        OldPortfolio = old_apps.get_model("api", "Portfolio")
        OldUser = old_apps.get_model("auth", "User")

        u1 = OldUser.objects.create_user(username="u1", password="x")
        u2 = OldUser.objects.create_user(username="u2", password="x")

        def mk(name, user, active):
            return OldPortfolio.objects.create(
                name=name, broker="B", balance=100, initial=100,
                leverage="1:100", user=user, is_active=active,
            )

        # User 1: two active portfolios (legacy bug) -> keep lowest id
        mk("u1-a", u1, True)
        mk("u1-b", u1, True)
        mk("u1-c", u1, False)
        # User 2: none active -> activate the lowest id
        mk("u2-a", u2, False)
        mk("u2-b", u2, False)
        # Demo owner (user=None): both active -> keep lowest id
        mk("demo-a", None, True)
        mk("demo-b", None, True)

        # Apply the normalization migration.
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

        state = {(p.user_id, p.name): p.is_active for p in Portfolio.objects.all()}
        self.assertIs(state[(u1.id, "u1-a")], True)
        self.assertIs(state[(u1.id, "u1-b")], False)
        self.assertIs(state[(u1.id, "u1-c")], False)
        self.assertIs(state[(u2.id, "u2-a")], True)
        self.assertIs(state[(u2.id, "u2-b")], False)
        self.assertIs(state[(None, "demo-a")], True)
        self.assertIs(state[(None, "demo-b")], False)
        self.assertEqual(Portfolio.objects.filter(is_active=True).count(), 3)