"""Tests for the admin payment health check.

The gateway is never really called: `api.payments.request_payment` is patched
with a function that answers like Zibal does (105/106/113/100), so these tests
describe what the admin panel reports rather than the gateway's uptime. The one
behaviour that matters most is that an unreachable gateway is *reported* as a
failed check instead of raising a 500.
"""

from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from api import payments
from api.models import PAYMENT_FAILED, PAYMENT_PAID, PAYMENT_PENDING, Payment
from api.tests.common import BaseTestCase

URL = "/api/admin/payment-health/"

# What the real gateway enforces, probed on 2026-09-15. Deliberately hardcoded:
# the fake gateway must keep answering "the real ceiling" even when a test
# widens our own constant, because that mismatch is what it has to catch.
REAL_MIN, REAL_MAX = 1000, 4_000_000_000


def gateway_like(amount_rial, callback_url, order_id, description="", mobile=""):
    if amount_rial < REAL_MIN:
        return {"result": 105, "message": "amount<1000 IRR"}
    if amount_rial > REAL_MAX:
        return {"result": 113, "message": "amount>4000000000 IRR"}
    if not str(callback_url).startswith("http"):
        return {"result": 106, "message": "callbackUrl is not valid"}
    return {"result": 100, "message": "success", "trackId": 111222333}


class HealthAccessTests(BaseTestCase):
    def test_anonymous_and_normal_users_are_refused(self):
        self.assertEqual(self.client.get(URL).status_code, 401)

        self.auth(self.make_user(username="trader"))
        self.assertEqual(self.client.get(URL).status_code, 403)
        self.assertEqual(self.client.post(URL).status_code, 403)

    def test_staff_sees_the_report(self):
        self.auth_staff()
        r = self.client.get(URL)
        self.assertEqual(r.status_code, 200)
        self.assertIn("checks", r.data)
        self.assertIn("codes", r.data)


class OfflineReportTests(BaseTestCase):
    """GET must not touch the gateway — the page renders on load."""

    def setUp(self):
        self.auth_staff()

    @patch("api.payments.request_payment")
    def test_get_makes_no_gateway_calls(self, request_payment):
        r = self.client.get(URL)
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data["live"])
        request_payment.assert_not_called()
        statuses = {c["id"]: c["status"] for c in r.data["checks"]}
        self.assertEqual(statuses["gateway"], "skipped")

    def test_report_carries_the_reference_data_the_page_shows(self):
        self.make_plan(slug="pro", name="Pro", price="۲۰۰,۰۰۰")
        r = self.client.get(URL)
        codes = {c["code"]: c["message"] for c in r.data["codes"]}
        self.assertIn(100, codes)
        self.assertIn(106, codes)
        self.assertIn(140, codes)
        self.assertEqual(r.data["amounts"]["maxRial"], payments.MAX_AMOUNT_RIAL)
        self.assertEqual(
            [p["slug"] for p in r.data["plans"]], ["pro"]
        )
        self.assertEqual(r.data["plans"][0]["monthlyRial"], 2_000_000)

    @patch.dict("os.environ", {"ZIBAL_MERCHANT": "merchant123456"})
    def test_a_real_merchant_code_is_reported_as_such(self):
        r = self.client.get(URL)
        statuses = {c["id"]: c["status"] for c in r.data["checks"]}
        self.assertFalse(r.data["sandbox"])
        self.assertEqual(statuses["merchant"], "pass")
        self.assertEqual(r.data["merchant"], "merc" + "*" * len("hant123456"))

    @patch.dict("os.environ", {"ZIBAL_MERCHANT": ""})
    def test_sandbox_is_a_warning_not_a_failure(self):
        r = self.client.get(URL)
        statuses = {c["id"]: c["status"] for c in r.data["checks"]}
        self.assertTrue(r.data["sandbox"])
        self.assertEqual(statuses["merchant"], "warn")
        self.assertNotIn("fail", statuses.values())


class LiveReportTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()

    @patch("api.payments.request_payment", side_effect=gateway_like)
    def test_post_probes_the_gateway_and_passes(self, request_payment):
        r = self.client.post(URL)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["live"])
        statuses = {c["id"]: c["status"] for c in r.data["checks"]}
        self.assertEqual(statuses["gateway"], "pass")
        for check_id in ("bounds-below-min", "bounds-max", "bounds-above-max", "bounds-bad-callback"):
            self.assertEqual(statuses[check_id], "pass", check_id)
        self.assertEqual(r.data["summary"]["failed"], 0)
        # five probes: min (the connection check), min-1, max, max+1, bad callback
        self.assertEqual(request_payment.call_count, 5)
        self.assertIn("حداقل مبلغ", next(c for c in r.data["checks"] if c["id"] == "gateway")["detail"])

    @patch("api.payments.request_payment", side_effect=payments.GatewayError("down"))
    def test_an_unreachable_gateway_is_reported_not_crashed(self, _request_payment):
        r = self.client.post(URL)
        self.assertEqual(r.status_code, 200)
        check = next(c for c in r.data["checks"] if c["id"] == "gateway")
        self.assertEqual(check["status"], "fail")
        self.assertIn("down", check["detail"])
        self.assertGreaterEqual(r.data["summary"]["failed"], 1)

    @patch("api.payments.request_payment", side_effect=gateway_like)
    def test_a_ceiling_mismatch_shows_up_as_a_failed_check(self, _request_payment):
        # Our constant claims one Rial more is payable than the gateway accepts.
        with patch.object(payments, "MAX_AMOUNT_RIAL", REAL_MAX + 1):
            r = self.client.post(URL)
        check = next(c for c in r.data["checks"] if c["id"] == "bounds-max")
        self.assertEqual(check["status"], "fail")
        self.assertIn("113", check["detail"])
        self.assertGreaterEqual(r.data["summary"]["failed"], 1)


class PlanPriceTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()

    def test_a_price_beyond_the_gateway_ceiling_is_flagged(self):
        self.make_plan(slug="vip", name="VIP", price="500,000,000")  # 5,000,000,000 Rial
        r = self.client.get(URL)
        plan = r.data["plans"][0]
        self.assertEqual(plan["status"], "fail")
        self.assertIn("خارج از محدوده", plan["detail"])
        self.assertIn("plan-vip", [c["id"] for c in r.data["checks"]])

    def test_a_yearly_price_beyond_the_ceiling_is_flagged(self):
        # 400,000,000 Toman a year is fine monthly, over the ceiling yearly.
        self.make_plan(slug="big", name="Big", price="40,000,000")
        r = self.client.get(URL)
        plan = r.data["plans"][0]
        self.assertEqual(plan["yearlyRial"], 4_000_000_000)
        self.assertEqual(plan["status"], "pass")
        self.make_plan(slug="huge", name="Huge", price="45,000,000")
        r = self.client.get(URL)
        huge = next(p for p in r.data["plans"] if p["slug"] == "huge")
        self.assertEqual(huge["status"], "fail")
        self.assertIn("سالانه", huge["detail"])

    def test_an_unpriced_plan_is_not_a_failure(self):
        self.make_plan(slug="free", name="رایگان", price="۰")
        r = self.client.get(URL)
        self.assertEqual(r.data["plans"][0]["status"], "info")
        self.assertEqual(r.data["summary"]["failed"], 0)


class OrderReportTests(BaseTestCase):
    def setUp(self):
        self.auth_staff()

    def make_payment(self, **extra):
        defaults = {
            "user": "خریدار",
            "plan": "Pro",
            "amount": "۲۰۰,۰۰۰ تومان",
            "date": timezone.localdate(),
            "status": PAYMENT_PENDING,
            "amount_rial": 2_000_000,
            "plan_slug": "pro",
        }
        defaults.update(extra)
        return Payment.objects.create(**defaults)

    def test_a_failed_order_reports_the_gateway_code(self):
        self.make_payment(
            status=PAYMENT_FAILED,
            raw_response={"sent": {"amount": 2_000_000}, "verify": {"result": 202, "message": "failed"}},
        )
        r = self.client.get(URL)
        row = r.data["orders"]["recentFailed"][0]
        self.assertEqual(row["code"], 202)
        self.assertEqual(row["stage"], "verify")
        self.assertIn("پرداخت انجام نشد", row["message"])
        check = next(c for c in r.data["checks"] if c["id"] == "orders-failed")
        self.assertEqual(check["status"], "warn")
        self.assertIn("202", check["detail"])

    def test_an_order_the_gateway_never_answered_falls_back_to_our_message(self):
        self.make_payment(status=PAYMENT_FAILED, raw_response={"detail": "اتصال به درگاه برقرار نشد"})
        row = self.client.get(URL).data["orders"]["recentFailed"][0]
        self.assertEqual(row["stage"], "engine")
        self.assertIsNone(row["code"])
        self.assertIn("اتصال", row["message"])

    def test_pending_orders_from_earlier_days_are_called_stuck(self):
        self.make_payment(status=PAYMENT_PENDING)
        self.make_payment(status=PAYMENT_PENDING, date=timezone.localdate() - timedelta(days=1))
        r = self.client.get(URL)
        self.assertEqual(r.data["orders"]["pending"], 2)
        self.assertEqual(r.data["orders"]["stuck"], 1)
        self.assertEqual(r.data["orders"]["oldestStuck"]["user"], "خریدار")
        check = next(c for c in r.data["checks"] if c["id"] == "orders-stuck")
        self.assertEqual(check["status"], "warn")

    def test_the_last_successful_payment_is_shown_with_its_tracking_code(self):
        self.make_payment(status=PAYMENT_PAID, reference_id="778899", plan="Pro Max")
        r = self.client.get(URL)
        self.assertEqual(r.data["orders"]["lastPaid"]["referenceId"], "778899")
        check = next(c for c in r.data["checks"] if c["id"] == "orders-paid")
        self.assertIn("778899", check["detail"])
        self.assertEqual(check["status"], "info")

    def test_orders_only_show_bounded_recent_failures(self):
        for _ in range(12):
            self.make_payment(status=PAYMENT_FAILED)
        r = self.client.get(URL)
        self.assertEqual(r.data["orders"]["failedRecent"], 12)
        self.assertEqual(len(r.data["orders"]["recentFailed"]), 8)
