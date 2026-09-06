from django.contrib.auth import get_user_model
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Portfolio

User = get_user_model()


class PortfolioActiveTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="trader", password="pass")
        self.client.force_authenticate(self.user)

    def _create(self, name, **extra):
        payload = {
            "name": name,
            "broker": "IC Markets",
            "type": "استاندارد",
            "initial": 1000,
            "leverage": "1:100",
            "currency": "USD",
            "trades": 0,
            "status": "فعال",
            "strategy": "",
        }
        payload.update(extra)
        return self.client.post("/api/portfolios/", payload, format="json")

    def test_creating_second_portfolio_deactivates_first(self):
        r1 = self._create("اولین")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self._create("دومین")
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

        first = Portfolio.objects.get(pk=r1.data["id"])
        second = Portfolio.objects.get(pk=r2.data["id"])
        self.assertTrue(second.is_active)
        self.assertFalse(first.is_active)

    def test_creating_inactive_portfolio_keeps_others_active(self):
        r1 = self._create("اولین")
        r2 = self._create("کپی", is_active=False)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

        first = Portfolio.objects.get(pk=r1.data["id"])
        copy = Portfolio.objects.get(pk=r2.data["id"])
        self.assertTrue(first.is_active)
        self.assertFalse(copy.is_active)


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