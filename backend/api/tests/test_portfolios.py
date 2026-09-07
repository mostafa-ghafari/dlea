"""Tests for the Portfolio API: CRUD, single-active rule, computed stats, scoping."""

from rest_framework import status

from api.models import Portfolio
from api.tests.common import BaseTestCase


class PortfolioCreateTests(BaseTestCase):
    def setUp(self):
        self.user = self.auth(self.make_user(username="trader"))

    def test_creating_second_portfolio_deactivates_first(self):
        r1 = self.client.post("/api/portfolios/", self.portfolio_payload(name="اولین"), format="json")
        self.assertEqual(r1.status_code, 201)
        r2 = self.client.post("/api/portfolios/", self.portfolio_payload(name="دومین"), format="json")
        self.assertEqual(r2.status_code, 201)

        first = Portfolio.objects.get(pk=r1.data["id"])
        second = Portfolio.objects.get(pk=r2.data["id"])
        self.assertTrue(second.is_active)
        self.assertFalse(first.is_active)

    def test_creating_inactive_portfolio_keeps_others_active(self):
        r1 = self.client.post("/api/portfolios/", self.portfolio_payload(name="اولین"), format="json")
        r2 = self.client.post(
            "/api/portfolios/", self.portfolio_payload(name="کپی", is_active=False), format="json"
        )
        self.assertEqual(r2.status_code, 201)

        first = Portfolio.objects.get(pk=r1.data["id"])
        copy = Portfolio.objects.get(pk=r2.data["id"])
        self.assertTrue(first.is_active)
        self.assertFalse(copy.is_active)

    def test_activate_action(self):
        p1 = self.client.post("/api/portfolios/", self.portfolio_payload(name="اول"), format="json")
        p2 = self.client.post("/api/portfolios/", self.portfolio_payload(name="دوم"), format="json")
        # Activate the first one again
        r = self.client.post(f"/api/portfolios/{p1.data['id']}/activate/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["is_active"])
        self.assertFalse(Portfolio.objects.get(pk=p2.data["id"]).is_active)

    def test_activate_missing_portfolio_returns_404(self):
        r = self.client.post("/api/portfolios/999999/activate/")
        self.assertEqual(r.status_code, 404)

    def test_computed_balance_pnl_win_rate(self):
        p = self.make_portfolio(user=self.user, initial=1000)
        self.make_trade(p, pnl=100, exit=2100)  # win
        self.make_trade(p, pnl=-50, exit=1950)  # loss
        r = self.client.get(f"/api/portfolios/{p.pk}/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(data["trades"], 2)
        self.assertEqual(data["pnl"], 50.0)
        self.assertEqual(data["balance"], 1050.0)
        self.assertEqual(data["winRate"], 50.0)


class PortfolioScopingTests(BaseTestCase):
    def test_users_only_see_their_own_portfolios(self):
        u1 = self.auth(self.make_user(username="u1"))
        u2 = self.make_user(username="u2")
        self.make_portfolio(user=u1, name="u1-portfolio")
        self.make_portfolio(user=u2, name="u2-portfolio")

        names = [p["name"] for p in self.get_list("/api/portfolios/")]
        self.assertIn("u1-portfolio", names)
        self.assertNotIn("u2-portfolio", names)

    def test_cannot_update_another_users_portfolio(self):
        u1 = self.auth(self.make_user(username="u1"))
        other = self.make_portfolio(user=self.make_user(username="u2"), name="دیگری")
        r = self.client.patch(
            f"/api/portfolios/{other.pk}/", {"name": "هک"}, format="json"
        )
        self.assertEqual(r.status_code, 404)
        other.refresh_from_db()
        self.assertEqual(other.name, "دیگری")

    def test_anonymous_sees_only_demo_portfolios(self):
        demo = self.make_portfolio(user=None, name="demo")
        owned = self.make_portfolio(user=self.make_user(username="u3"), name="owned")
        names = [p["name"] for p in self.get_list("/api/portfolios/")]
        self.assertIn("demo", names)
        self.assertNotIn("owned", names)

    def test_anonymous_create_assigns_demo_owner(self):
        r = self.client.post("/api/portfolios/", self.portfolio_payload(name="بدون کاربر"), format="json")
        self.assertEqual(r.status_code, 201)
        p = Portfolio.objects.get(pk=r.data["id"])
        self.assertIsNone(p.user)