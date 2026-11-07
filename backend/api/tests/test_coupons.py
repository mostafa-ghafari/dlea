"""DEV-157: a discount code is minted for one plan, then announced.

Two things must never drift apart here:

* the code only prices the plan it was minted for, both in the preview the page
  shows and in the checkout that actually charges; and
* announcing it goes through one wording — the news feed (everyone) or a
  private notification (only the accounts already on that plan).
"""

from unittest.mock import patch

from django.contrib.auth import get_user_model

from api.models import Coupon, NewsItem, Notification, Payment
from api.tests.common import BaseTestCase


class CouponPlanScopeTests(BaseTestCase):
    """A code minted for Pro Max must never price Pro."""

    def setUp(self):
        self.pro = self.make_plan(
            slug="pro", name="Pro", price="۲۰۰,۰۰۰", unit="تومان / ماه", sellable=True
        )
        self.promax = self.make_plan(
            slug="promax", name="Pro Max", price="۵۰۰,۰۰۰", unit="تومان / ماه", sellable=True
        )
        self.user = self.make_user(username="buyer")
        self.auth(self.user)

    def _preview(self, code, plan):
        return self.client.post(
            "/api/billing/coupon/",
            {"plan": plan, "cycle": "monthly", "code": code},
            format="json",
        )

    def test_a_plan_specific_code_prices_its_own_plan(self):
        Coupon.objects.create(code="PROMAX30", percent=30, plan=self.promax)
        r = self._preview("promax30", "promax")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["discountToman"], 150_000)
        self.assertEqual(r.data["totalToman"], 350_000)

    def test_the_same_code_is_refused_for_another_plan(self):
        Coupon.objects.create(code="PROMAX30", percent=30, plan=self.promax)
        r = self._preview("PROMAX30", "pro")
        self.assertEqual(r.status_code, 400)
        self.assertIn("Pro Max", r.data["detail"])

    @patch("api.payments.request_payment")
    def test_checkout_refuses_a_code_for_another_plan(self, request_payment):
        Coupon.objects.create(code="PROMAX30", percent=30, plan=self.promax)
        r = self.client.post(
            "/api/billing/checkout/",
            {"plan": "pro", "coupon": "PROMAX30"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)
        request_payment.assert_not_called()
        self.assertFalse(Payment.objects.exists())

    def test_a_code_without_a_plan_still_covers_every_plan(self):
        Coupon.objects.create(code="ALL10", percent=10)
        self.assertEqual(self._preview("ALL10", "pro").status_code, 200)
        self.assertEqual(self._preview("ALL10", "promax").status_code, 200)


class CouponAdminApiTests(BaseTestCase):
    """The admin panel mints codes and announces them."""

    def setUp(self):
        self.pro = self.make_plan(
            slug="pro", name="Pro", price="۲۰۰,۰۰۰", unit="تومان / ماه", sellable=True
        )
        self.promax = self.make_plan(
            slug="promax", name="Pro Max", price="۵۰۰,۰۰۰", unit="تومان / ماه", sellable=True
        )
        self.staff = self.make_staff(username="boss")
        self.trader = self.make_user(username="trader")
        self.auth_staff()

    def test_a_trader_cannot_list_or_mint_codes(self):
        self.auth(self.trader)
        self.assertEqual(self.client.get("/api/admin/coupons/").status_code, 403)
        r = self.client.post(
            "/api/admin/coupons/", {"code": "X", "percent": 10}, format="json"
        )
        self.assertEqual(r.status_code, 403)

    def test_creating_a_code_scopes_it_to_its_plan(self):
        r = self.client.post(
            "/api/admin/coupons/",
            {"code": " promax30 ", "percent": 30, "planSlug": "promax", "maxUses": 50},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["code"], "PROMAX30")
        self.assertEqual(r.data["planName"], "Pro Max")
        coupon = Coupon.objects.get()
        self.assertEqual(coupon.plan_id, self.promax.pk)
        self.assertEqual(coupon.max_uses, 50)

    def test_a_code_without_a_discount_is_refused(self):
        r = self.client.post(
            "/api/admin/coupons/", {"code": "EMPTY", "planSlug": "pro"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_announcing_in_the_news_feed_reaches_everyone(self):
        coupon = Coupon.objects.create(code="PROMAX30", percent=30, plan=self.promax)
        r = self.client.post(
            f"/api/admin/coupons/{coupon.pk}/announce/", {"channel": "news"}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        news = NewsItem.objects.get()
        self.assertEqual(news.category, "تخفیف")
        self.assertIn("PROMAX30", news.body)
        self.assertIn("Pro Max", news.body)
        active = get_user_model().objects.filter(is_active=True).count()
        self.assertEqual(
            Notification.objects.filter(link=f"/app/news/{news.pk}").count(), active
        )
        self.assertEqual(r.data["sent"], active)

    def test_a_private_announcement_only_reaches_the_codes_plan(self):
        on_promax = self.make_user(username="promaxer")
        self.make_profile(on_promax, plan="Pro Max")
        self.make_profile(self.trader, plan="Pro")
        coupon = Coupon.objects.create(code="PROMAX30", percent=30, plan=self.promax)

        r = self.client.post(
            f"/api/admin/coupons/{coupon.pk}/announce/",
            {"channel": "private"},
            format="json",
        )

        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["sent"], 1)
        self.assertEqual(Notification.objects.filter(user=on_promax, kind="system").count(), 1)
        self.assertFalse(Notification.objects.filter(user=self.trader, kind="system").exists())
        # Private means private: nothing lands in the public feed.
        self.assertFalse(NewsItem.objects.exists())

    def test_an_unknown_channel_is_refused(self):
        coupon = Coupon.objects.create(code="PROMAX30", percent=30)
        r = self.client.post(
            f"/api/admin/coupons/{coupon.pk}/announce/", {"channel": "sms"}, format="json"
        )
        self.assertEqual(r.status_code, 400)
