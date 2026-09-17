"""Tests for the payment gateway flow: checkout → callback → plan unlocked.

The gateway itself is never called: `api.payments.request_payment` and
`verify_payment` are patched, so the tests describe the money handling
(amounts in Rial, who is allowed to settle an order, what the buyer gets)
rather than Zibal's uptime.
"""

from datetime import timedelta
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone

from api import billing_views, payments
from api.models import (
    PAYMENT_FAILED,
    PAYMENT_PAID,
    PAYMENT_PENDING,
    Payment,
    Subscription,
)
from api.tests.common import BaseTestCase


def request_ok(track_id=15966442233311):
    return {"result": 100, "message": "success", "trackId": track_id}


def verify_ok(amount_rial, ref=778899, card="6104****1234"):
    return {
        "result": 100,
        "message": "success",
        "amount": amount_rial,
        "refNumber": ref,
        "cardNumber": card,
        "paidAt": "2026-09-15T10:20:30+03:30",
    }


class AmountParsingTests(BaseTestCase):
    """Panel prices are display strings; the gateway needs a real Rial int."""

    def test_persian_price_with_separators(self):
        self.assertEqual(payments.toman_amount("۵۰۰,۰۰۰"), 500000)
        self.assertEqual(payments.rial_amount("۵۰۰,۰۰۰"), 5_000_000)

    def test_price_with_unit_words(self):
        self.assertEqual(payments.toman_amount("2,000,000 تومان / ماه"), 2000000)

    def test_unpriced_plans_are_zero(self):
        for value in ("—", "۰", "", None, "غیرقابل فروش"):
            self.assertEqual(payments.toman_amount(value), 0, value)

    def test_unknown_code_keeps_the_gateway_message(self):
        self.assertEqual(payments.describe_result(999, "gateway says no"), "gateway says no")
        self.assertEqual(payments.describe_result(106, "invalid callback"), payments.RESULT_MESSAGES[106])

    def test_result_codes_we_meet_have_persian_text(self):
        # 140 is what the gateway answers when callbackUrl is missing entirely.
        for code in (102, 104, 105, 106, 113, 140, 201, 202, 203):
            self.assertTrue(payments.RESULT_MESSAGES.get(code), code)

    def test_amount_bounds_match_the_live_gateway(self):
        """Probed 2026-09-15: 1000 and 4,000,000,000 pass, 999 and +1 do not.

        These are the numbers the gateway itself enforces; a wider ceiling here
        means an order our own guard called valid is refused at the gateway.
        `deploy/smoke_payment.py` re-probes both bounds against the real gateway.
        """
        self.assertEqual(payments.MIN_AMOUNT_RIAL, 1000)
        self.assertEqual(payments.MAX_AMOUNT_RIAL, 4_000_000_000)


class CheckoutTests(BaseTestCase):
    def setUp(self):
        self.plan = self.make_plan(
            slug="pro", name="Pro", price="۲۰۰,۰۰۰", unit="تومان / ماه", sellable=True
        )
        self.user = self.make_user(username="buyer")
        self.auth(self.user)

    def test_checkout_requires_a_signed_in_user(self):
        self.client.force_authenticate(None)
        r = self.client.post("/api/billing/checkout/", {"plan": "pro"}, format="json")
        self.assertIn(r.status_code, (401, 403))

    @patch("api.payments.request_payment")
    def test_checkout_creates_a_pending_order_and_returns_the_gateway_url(self, request_payment):
        request_payment.return_value = request_ok()
        r = self.client.post("/api/billing/checkout/", {"plan": "pro"}, format="json")

        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["paymentUrl"], "https://gateway.zibal.ir/start/15966442233311")
        self.assertEqual(r.data["amount"], 2_000_000)  # 200,000 Toman in Rial
        order = Payment.objects.get()
        self.assertEqual(order.status, PAYMENT_PENDING)
        self.assertEqual(order.account, self.user)
        self.assertEqual(order.plan_slug, "pro")
        self.assertEqual(order.amount_rial, 2_000_000)
        self.assertEqual(order.authority, "15966442233311")
        # The callback URL the gateway will use is ours, not the client's.
        self.assertIn("/api/billing/callback/", request_payment.call_args.kwargs["callback_url"])
        # What we sent is stored next to the gateway's answer, so an order can be
        # audited later (and the smoke test reads the callback URL back from it).
        sent = order.raw_response["sent"]
        self.assertEqual(sent["amount"], 2_000_000)
        self.assertEqual(sent["callbackUrl"], request_payment.call_args.kwargs["callback_url"])
        self.assertEqual(sent["orderId"], str(order.pk))

    @patch("api.payments.request_payment")
    def test_a_price_beyond_the_gateway_ceiling_is_refused(self, request_payment):
        self.make_plan(slug="vip", name="VIP", price="500,000,000")
        r = self.client.post("/api/billing/checkout/", {"plan": "vip"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("محدوده مجاز", r.data["detail"])
        request_payment.assert_not_called()
        self.assertFalse(Payment.objects.exists())

    @patch("api.payments.request_payment")
    def test_yearly_cycle_bills_ten_months(self, request_payment):
        request_payment.return_value = request_ok()
        r = self.client.post(
            "/api/billing/checkout/", {"plan": "pro", "cycle": "yearly"}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["amount"], 20_000_000)  # 10 × 200,000 Toman

    @patch("api.payments.request_payment")
    def test_gateway_refusal_is_reported_and_leaves_no_open_order(self, request_payment):
        request_payment.return_value = {"result": 106, "message": "invalid callback"}
        r = self.client.post("/api/billing/checkout/", {"plan": "pro"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("آدرس بازگشت", r.data["detail"])
        self.assertEqual(Payment.objects.get().status, PAYMENT_FAILED)
        self.assertFalse(Subscription.objects.exists())

    @patch("api.payments.request_payment", side_effect=payments.GatewayError("down"))
    def test_unreachable_gateway_is_a_bad_gateway(self, _request_payment):
        r = self.client.post("/api/billing/checkout/", {"plan": "pro"}, format="json")
        self.assertEqual(r.status_code, 502)
        self.assertEqual(Payment.objects.get().status, PAYMENT_FAILED)

    def test_a_free_plan_cannot_be_checked_out(self):
        self.make_plan(slug="free", name="رایگان", price="۰")
        r = self.client.post("/api/billing/checkout/", {"plan": "free"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Payment.objects.exists())


class CallbackTests(BaseTestCase):
    def setUp(self):
        self.plan = self.make_plan(
            slug="promax", name="Pro Max", price="۵۰۰,۰۰۰", unit="تومان / ماه", sellable=True
        )
        self.user = self.make_user(username="buyer")
        self.auth(self.user)

    def _order(self, cycle="monthly", rial=5_000_000):
        return Payment.objects.create(
            user="Buyer",
            account=self.user,
            plan=self.plan.name,
            plan_slug=self.plan.slug,
            cycle=cycle,
            amount="۵۰۰,۰۰۰ تومان",
            amount_rial=rial,
            date=timezone.localdate(),
            status=PAYMENT_PENDING,
            authority="15966442233311",
        )

    def _callback(self, order, **query):
        params = {"orderId": order.pk, "trackId": order.authority, "success": "1"}
        params.update(query)
        return self.client.get("/api/billing/callback/", params)

    @patch("api.payments.verify_payment")
    def test_successful_payment_unlocks_the_plan_and_keeps_the_code(self, verify):
        order = self._order()
        verify.return_value = verify_ok(order.amount_rial)

        r = self._callback(order)

        self.assertEqual(r.status_code, 302)
        self.assertIn("status=success", r.url)
        self.assertIn("ref=778899", r.url)
        order.refresh_from_db()
        self.assertEqual(order.status, PAYMENT_PAID)
        self.assertEqual(order.reference_id, "778899")
        self.assertEqual(order.card_number, "6104****1234")
        self.assertIsNotNone(order.paid_at)

        sub = Subscription.objects.get(user=self.user)
        self.assertEqual(sub.plan, "Pro Max")
        self.assertEqual(sub.total_days, 30)
        self.assertEqual(sub.days_left, 30)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.plan, "Pro Max")

    @patch("api.payments.verify_payment")
    def test_yearly_payment_grants_a_year(self, verify):
        order = self._order(cycle="yearly")
        verify.return_value = verify_ok(order.amount_rial)
        self._callback(order)
        self.assertEqual(Subscription.objects.get(user=self.user).total_days, 365)

    @patch("api.payments.verify_payment")
    def test_amount_mismatch_never_unlocks_anything(self, verify):
        order = self._order()
        verify.return_value = verify_ok(50_000)  # cheapest possible payment

        r = self._callback(order)

        self.assertIn("status=failed", r.url)
        order.refresh_from_db()
        self.assertEqual(order.status, PAYMENT_FAILED)
        self.assertFalse(Subscription.objects.exists())

    @patch("api.payments.verify_payment")
    def test_gateway_says_not_paid(self, verify):
        order = self._order()
        verify.return_value = {"result": 202, "message": "failed", "amount": order.amount_rial}
        r = self._callback(order)
        self.assertIn("status=failed", r.url)
        order.refresh_from_db()
        self.assertEqual(order.status, PAYMENT_FAILED)

    @patch("api.payments.verify_payment")
    def test_abandoned_payment_in_the_gateway(self, verify):
        order = self._order()
        r = self._callback(order, success="0")
        self.assertIn("status=failed", r.url)
        order.refresh_from_db()
        self.assertEqual(order.status, PAYMENT_FAILED)
        verify.assert_not_called()

    @patch("api.payments.verify_payment", side_effect=payments.GatewayError("timeout"))
    def test_unreachable_gateway_keeps_the_order_open_for_a_retry(self, _verify):
        order = self._order()
        r = self._callback(order)
        self.assertIn("status=pending", r.url)
        order.refresh_from_db()
        self.assertEqual(order.status, PAYMENT_PENDING)

    @patch("api.payments.verify_payment")
    def test_callback_is_idempotent(self, verify):
        order = self._order()
        verify.return_value = verify_ok(order.amount_rial)
        self._callback(order)
        verify.reset_mock()

        r = self._callback(order)  # e.g. the buyer refreshed the return page

        self.assertIn("status=success", r.url)
        verify.assert_not_called()  # already settled, gateway not asked again
        self.assertEqual(Subscription.objects.count(), 1)
        self.assertEqual(Subscription.objects.get(user=self.user).total_days, 30)

    def test_unknown_order_is_reported_not_crashed(self):
        r = self.client.get("/api/billing/callback/", {"orderId": 424242, "success": "1"})
        self.assertEqual(r.status_code, 302)
        self.assertIn("status=unknown", r.url)

    @patch("api.payments.verify_payment")
    def test_opening_the_callback_url_by_hand_changes_nothing(self, verify):
        order = self._order()
        r = self.client.get("/api/billing/callback/", {"orderId": order.pk})
        self.assertIn("status=pending", r.url)
        order.refresh_from_db()
        self.assertEqual(order.status, PAYMENT_PENDING)
        verify.assert_not_called()


class ReturnDestinationTests(BaseTestCase):
    """Where the buyer's browser ends up once the gateway is answered.

    Production had neither `FRONTEND_URL` nor a public `CORS_ALLOWED_ORIGINS`,
    so the fallback was the development origin and every settled payment sent
    the buyer to `http://localhost:5173` — their own machine. These tests pin
    the fix: a loopback destination is never chosen when we know the real host.
    """

    def setUp(self):
        self.plan = self.make_plan(slug="pro", name="Pro", price="۲۰۰,۰۰۰")
        self.user = self.make_user(username="buyer")
        self.order = Payment.objects.create(
            user="Buyer",
            account=self.user,
            plan=self.plan.name,
            plan_slug=self.plan.slug,
            cycle="monthly",
            amount="۲۰۰,۰۰۰ تومان",
            amount_rial=2_000_000,
            date=timezone.localdate(),
            status=PAYMENT_PENDING,
            authority="track-1",
        )

    def _callback(self):
        # `orderId` without `success` is the "someone opened the URL" path: it
        # settles nothing and still has to redirect somewhere reachable.
        return self.client.get(
            "/api/billing/callback/", {"orderId": self.order.pk}, HTTP_HOST="dlea.piqagram.ir"
        )

    def test_the_dev_origin_is_never_the_destination(self):
        with patch.dict("os.environ", {"FRONTEND_URL": ""}), override_settings(
            CORS_ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:8000"]
        ):
            r = self._callback()

        self.assertEqual(r.status_code, 302)
        self.assertNotIn("localhost", r.url)
        # The host the buyer arrived on is the only host we know they can reach.
        self.assertTrue(r.url.startswith("http://dlea.piqagram.ir/app/billing"), r.url)

    def test_the_configured_frontend_url_wins(self):
        with patch.dict("os.environ", {"FRONTEND_URL": "https://dlea.piqagram.ir"}):
            r = self._callback()
        self.assertTrue(r.url.startswith("https://dlea.piqagram.ir/app/billing"), r.url)

    def test_a_public_cors_origin_beats_the_request_host(self):
        with patch.dict("os.environ", {"FRONTEND_URL": ""}), override_settings(
            CORS_ALLOWED_ORIGINS=["http://localhost:5173", "https://app.example.com"]
        ):
            r = self._callback()
        self.assertTrue(r.url.startswith("https://app.example.com/app/billing"), r.url)

    def test_with_no_host_at_all_the_redirect_stays_relative(self):
        """A relative redirect lands on the host the request itself used, which
        is always reachable — better than any origin we would have to guess."""
        with patch.dict("os.environ", {"FRONTEND_URL": ""}), override_settings(
            CORS_ALLOWED_ORIGINS=["http://localhost:5173"]
        ):
            self.assertEqual(billing_views._frontend_url(None), "")


class RenewalTests(BaseTestCase):
    def setUp(self):
        self.plan = self.make_plan(slug="pro", name="Pro", price="۲۰۰,۰۰۰")
        self.user = self.make_user(username="buyer")
        self.auth(self.user)

    def _paid_order(self, cycle="monthly"):
        order = Payment.objects.create(
            user="Buyer",
            account=self.user,
            plan=self.plan.name,
            plan_slug=self.plan.slug,
            cycle=cycle,
            amount="۲۰۰,۰۰۰ تومان",
            amount_rial=2_000_000,
            date=timezone.localdate(),
            status=PAYMENT_PENDING,
            authority="track-1",
        )
        return order

    def test_renewal_extends_instead_of_resetting(self):
        order = self._paid_order()
        with patch("api.payments.verify_payment", return_value=verify_ok(order.amount_rial)):
            self.client.get(
                "/api/billing/callback/",
                {"orderId": order.pk, "trackId": order.authority, "success": "1"},
            )

        plan = self.client.post("/api/billing/checkout/", {"plan": "pro"}, format="json")
        self.assertEqual(plan.status_code, 200)
        second = Payment.objects.latest("id")
        second.authority = "track-2"
        second.save(update_fields=["authority"])
        with patch("api.payments.verify_payment", return_value=verify_ok(second.amount_rial)):
            self.client.get(
                "/api/billing/callback/",
                {"orderId": second.pk, "trackId": second.authority, "success": "1"},
            )

        sub = Subscription.objects.get(user=self.user)
        self.assertEqual(sub.total_days, 60)  # 30 + 30, not a fresh 30
        self.assertEqual(sub.days_left, 60)

    def test_switching_plans_starts_a_fresh_period(self):
        expensive = self.make_plan(slug="promax", name="Pro Max", price="۵۰۰,۰۰۰")
        first = self._paid_order()
        with patch("api.payments.verify_payment", return_value=verify_ok(first.amount_rial)):
            self.client.get(
                "/api/billing/callback/",
                {"orderId": first.pk, "trackId": first.authority, "success": "1"},
            )

        second = Payment.objects.create(
            user="Buyer",
            account=self.user,
            plan=expensive.name,
            plan_slug=expensive.slug,
            cycle="yearly",
            amount="۵,۰۰۰,۰۰۰ تومان",
            amount_rial=50_000_000,
            date=timezone.localdate(),
            status=PAYMENT_PENDING,
            authority="track-3",
        )
        with patch("api.payments.verify_payment", return_value=verify_ok(second.amount_rial)):
            self.client.get(
                "/api/billing/callback/",
                {"orderId": second.pk, "trackId": second.authority, "success": "1"},
            )

        sub = Subscription.objects.get(user=self.user)
        self.assertEqual(sub.plan, "Pro Max")
        self.assertEqual(sub.total_days, 365)
        self.assertEqual(sub.start_date, timezone.localdate())
        # One row per user: the billing page reads `subscription/`[0], so a
        # leftover older row would keep showing the previous plan.
        self.assertEqual(Subscription.objects.filter(user=self.user).count(), 1)


class OrderStatusTests(BaseTestCase):
    def setUp(self):
        self.user = self.make_user(username="buyer")
        self.auth(self.user)
        self.order = Payment.objects.create(
            user="Buyer",
            account=self.user,
            plan="Pro",
            plan_slug="pro",
            cycle="monthly",
            amount="۲۰۰,۰۰۰ تومان",
            amount_rial=2_000_000,
            date=timezone.localdate(),
            status=PAYMENT_PENDING,
            authority="15966442233311",
        )

    def test_owner_can_read_the_order(self):
        r = self.client.get(f"/api/billing/orders/{self.order.pk}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], PAYMENT_PENDING)

    def test_another_user_cannot_read_it(self):
        self.auth(self.make_user(username="stranger"))
        r = self.client.get(f"/api/billing/orders/{self.order.pk}/")
        self.assertEqual(r.status_code, 404)

    @patch("api.payments.verify_payment")
    def test_retry_settles_an_order_the_callback_never_finished(self, verify):
        # 201 is what the gateway answers when the session was already
        # confirmed — e.g. the buyer closed the tab before the callback.
        verify.return_value = {"result": 201, "message": "already verified", "amount": 2_000_000}
        r = self.client.post(f"/api/billing/orders/{self.order.pk}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], PAYMENT_PAID)
        self.assertEqual(Subscription.objects.get(user=self.user).plan, "Pro")

    @patch("api.payments.verify_payment")
    def test_retry_explains_why_it_still_is_not_paid(self, verify):
        verify.return_value = {"result": 202, "message": "failed", "amount": 0}
        r = self.client.post(f"/api/billing/orders/{self.order.pk}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], PAYMENT_FAILED)
        self.assertEqual(r.data["detail"], payments.RESULT_MESSAGES[202])
        self.assertFalse(Subscription.objects.exists())

    def test_retry_without_a_gateway_session_is_refused(self):
        self.order.authority = ""
        self.order.save(update_fields=["authority"])
        r = self.client.post(f"/api/billing/orders/{self.order.pk}/")
        self.assertEqual(r.status_code, 400)


class AdminPaymentListTests(BaseTestCase):
    def setUp(self):
        self.plan = self.make_plan(slug="pro", name="Pro", price="۲۰۰,۰۰۰")
        self.buyer = self.make_user(username="buyer")

    def test_tracking_code_and_card_are_visible_to_admins(self):
        Payment.objects.create(
            user="Buyer",
            account=self.buyer,
            plan="Pro",
            plan_slug="pro",
            amount="۲۰۰,۰۰۰ تومان",
            amount_rial=2_000_000,
            date=timezone.localdate(),
            status=PAYMENT_PAID,
            reference_id="778899",
            card_number="6104****1234",
            paid_at=timezone.now() - timedelta(minutes=5),
        )
        self.auth_staff()
        rows = self.get_list("/api/admin/payments/")
        row = rows[0]
        self.assertEqual(row["referenceId"], "778899")
        self.assertEqual(row["cardNumber"], "6104****1234")
        self.assertEqual(row["accountEmail"], self.buyer.email)
        self.assertEqual(row["amountRial"], 2_000_000)
        self.assertNotEqual(row["paidAt"], "")
