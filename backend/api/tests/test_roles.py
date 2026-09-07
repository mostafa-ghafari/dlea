"""Tests for the role system: auto tiers, effective-role resolution, admin override."""

from api.models import Achievement
from api.tests.common import BaseTestCase
from api.views import _compute_auto_role, _effective_role


def _seed_achievements(cls):
    """Create the 16 achievement titles the auto-role rules match on."""
    for title in [
        "۷ روز پایبند به پلن",
        "کاهش دراودان ۵٪",
        "بدون Revenge Trade در یک ماه",
        "۱۰۰ معامله ثبت‌شده",
        "Profit Factor بالای ۲",
        "بدون ورود احساسی در ۳۰ روز",
        "اولین معامله ثبت‌شده",
        "۳۰ روز متوالی ژورنال‌نویسی",
        "ماه سودده",
        "Win Rate بالای ۷۰٪",
        "ریسک زیر ۱٪ در ۵۰ معامله",
        "بدون Overtrading در ۲ هفته",
        "دابل کردن سرمایه",
        "۱۰ معامله A+ متوالی",
        "اتصال موفق متاتریدر",
        "استاد چکلیست",
    ]:
        Achievement.objects.create(title=title, desc=title, rule="x")


class AutoRoleTests(BaseTestCase):
    @classmethod
    def setUpTestData(cls):
        _seed_achievements(cls)

    def test_new_user_is_trader(self):
        user = self.make_user(username="newbie")
        self.assertEqual(_compute_auto_role(user), "trader")

    def test_20_trades_makes_professional(self):
        user = self.make_user(username="mid")
        p = self.make_portfolio(user=user)
        for i in range(20):
            self.make_trade(p, pnl=10 if i % 2 == 0 else -5)
        self.assertEqual(_compute_auto_role(user), "professional")

    def test_100_profitable_trades_makes_master(self):
        user = self.make_user(username="pro")
        p = self.make_portfolio(user=user)
        for _ in range(100):
            self.make_trade(p, pnl=50)
        self.assertEqual(_compute_auto_role(user), "master")

    def test_achievements_needed_for_tiers(self):
        """Sanity: pct thresholds need enough seeded achievements to be meaningful."""
        self.assertEqual(Achievement.objects.count(), 16)


class EffectiveRoleTests(BaseTestCase):
    def test_admin_roles_always_win(self):
        self.assertEqual(_effective_role("trader", "admin"), "admin")
        self.assertEqual(_effective_role("master", "vip"), "vip")
        self.assertEqual(_effective_role("trader", "professional-vip"), "professional-vip")

    def test_explicit_professional_master_override_auto(self):
        self.assertEqual(_effective_role("master", "professional"), "professional")
        self.assertEqual(_effective_role("trader", "master"), "master")

    def test_default_trader_does_not_override_auto(self):
        self.assertEqual(_effective_role("professional", "trader"), "professional")


class RoleViewTests(BaseTestCase):
    def test_get_returns_auto_admin_and_effective(self):
        user = self.auth(self.make_user(username="trader"))
        self.make_profile(user, role="master")
        r = self.client.get("/api/role/")
        self.assertEqual(r.status_code, 200)
        data = r.data
        self.assertEqual(data["autoRole"], "trader")
        self.assertEqual(data["adminRole"], "master")
        self.assertEqual(data["effective"], "master")

    def test_anonymous_role_returns_401(self):
        r = self.client.get("/api/role/")
        self.assertEqual(r.status_code, 401)

    def test_non_staff_cannot_put_role(self):
        user = self.auth(self.make_user(username="trader"))
        r = self.client.put(
            "/api/role/", {"userId": user.pk, "role": "vip"}, format="json"
        )
        self.assertEqual(r.status_code, 403)

    def test_staff_can_assign_role(self):
        staff = self.auth_staff()
        target = self.make_user(username="target")
        r = self.client.put(
            "/api/role/", {"userId": target.pk, "role": "vip"}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        target.profile.refresh_from_db()
        self.assertEqual(target.profile.role, "vip")

    def test_staff_role_put_unknown_user_404(self):
        self.auth_staff()
        r = self.client.put(
            "/api/role/", {"userId": 999999, "role": "vip"}, format="json"
        )
        self.assertEqual(r.status_code, 404)