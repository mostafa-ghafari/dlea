"""Health check for the payment path, shown in the admin panel.

`deploy/smoke_payment.py` proves the deployed path from outside the app (nginx,
routes, a real checkout). This module answers the same question from inside it —
what the running code can see — so an admin can look before calling support:

* is the gateway configured with a real merchant code, or in sandbox?
* which callback URL would the gateway send the buyer back to?
* does the gateway accept the amount bounds we enforce, and reject a bad
  callback URL?
* can every plan actually be paid at its price (yearly is the one that runs
  into the gateway's ceiling first)?
* which orders are stuck or failed, and with which gateway result code?

Nothing here writes. The only side effect of a live check is that it opens
payment sessions at the gateway; those are abandoned (nobody has their URL) and
the sandbox merchant moves no money. Every gateway call is best-effort: an
unreachable gateway becomes a failed *check* rather than an exception, because
"the gateway is down" is exactly what an admin came here to find out.
"""

from datetime import timedelta

from django.urls import NoReverseMatch, reverse
from django.utils import timezone

from . import billing_views, payments
from .models import PAYMENT_FAILED, PAYMENT_PAID, PAYMENT_PENDING, Payment, Plan

GATEWAY_TIMEOUT = 12
RECENT_DAYS = 2  # window for "which codes did we get lately"
RECENT_FAILED_SHOWN = 8


def _check(check_id: str, title: str, status: str, detail: str = "") -> dict:
    return {"id": check_id, "title": title, "status": status, "detail": detail}


def _mask(merchant: str) -> str:
    return f"{merchant[:4]}{'*' * max(0, len(merchant) - 4)}"


# ---------------------------------------------------------------------------
# configuration
# ---------------------------------------------------------------------------


def _merchant_check() -> dict:
    if payments.is_sandbox():
        return _check(
            "merchant",
            "مرچنت‌کد درگاه",
            "warn",
            "ZIBAL_MERCHANT خالی یا `zibal` است: درگاه در حالت آزمایشی است و "
            "هیچ پرداخت واقعی انجام نمی‌شود",
        )
    return _check("merchant", "مرچنت‌کد درگاه", "pass", f"{_mask(payments.merchant_code())} (کد واقعی)")


def _callback_check(request) -> str:
    """Return the callback URL, and a check describing whether it is usable."""
    if request is None:
        # No request to derive the host from; only the configured URL is real.
        callback = billing_views._callback_url(_ConfiguredOnlyRequest())
    else:
        callback = billing_views._callback_url(request)
    if callback.startswith("https://"):
        status, detail = "pass", callback
    else:
        status, detail = (
            "warn",
            f"{callback} — روی https نیست (خریدار بعد از بانک یک hop به http می‌خورد): "
            "PUBLIC_BACKEND_URL را در .env ست کن",
        )
    return callback, _check("callback", "آدرس بازگشت خریدار", status, detail)


class _ConfiguredOnlyRequest:
    """Stands in for a request when there is none (management command, tests)."""

    def build_absolute_uri(self, path: str) -> str:
        return f"http://localhost{path}"


def _route_check() -> dict:
    """This release really routes the three billing endpoints."""
    missing = []
    for name in ("billing-checkout", "billing-callback"):
        try:
            reverse(name)
        except NoReverseMatch:
            missing.append(name)
    try:
        reverse("billing-order", kwargs={"pk": 1})
    except NoReverseMatch:
        missing.append("billing-order")
    if missing:
        return _check(
            "routes",
            "مسیرهای پرداخت",
            "fail",
            f"این مسیرها در کد اجراشده نیستند: {', '.join(missing)} — دیپلوی ناقص است",
        )
    return _check("routes", "مسیرهای پرداخت", "pass", "/api/billing/checkout/، callback/ و orders/<id>/")


# ---------------------------------------------------------------------------
# gateway (live)
# ---------------------------------------------------------------------------


def _probe(amount, callback_url: str, order_id: str, timeout: int) -> dict:
    return payments.request_payment(
        amount_rial=amount, callback_url=callback_url, order_id=order_id, description="health check"
    )


def _gateway_checks(callback_url: str, timeout: int) -> list:
    """Ask the gateway about our bounds and about a bad callback URL."""
    checks = []
    try:
        answer = _probe(payments.MIN_AMOUNT_RIAL, callback_url, "health-min", timeout)
    except payments.GatewayError as exc:
        return [_check("gateway", "اتصال به درگاه", "fail", str(exc))]

    result = payments.as_int(answer.get("result"), -1)
    if result == payments.RESULT_OK:
        # This first probe is also the "the smallest amount we allow is payable"
        # check, so it is not repeated below.
        checks.append(
            _check(
                "gateway",
                "اتصال به درگاه",
                "pass",
                f"سشن آزمایشی {answer.get('trackId')} ساخته شد و حداقل مبلغ "
                f"({payments.MIN_AMOUNT_RIAL:,} ریال) پذیرفته شد (پرداخت‌نشده، بلااستفاده)",
            )
        )
    else:
        checks.append(
            _check(
                "gateway",
                "اتصال به درگاه",
                "fail",
                f"کد {result}: {payments.describe_result(result, answer.get('message'))}",
            )
        )

    def bounds(label, amount, expected, hint, callback=None):
        try:
            probe = _probe(amount, callback if callback is not None else callback_url, f"health-{label}", timeout)
        except payments.GatewayError as exc:
            checks.append(_check(f"bounds-{label}", hint, "fail", str(exc)))
            return
        code = payments.as_int(probe.get("result"), -1)
        if code == expected:
            checks.append(_check(f"bounds-{label}", hint, "pass", f"کد {code}"))
        else:
            checks.append(
                _check(
                    f"bounds-{label}",
                    hint,
                    "fail",
                    f"کد {code} (انتظار {expected}) — {payments.describe_result(code, probe.get('message'))}",
                )
            )

    minimum, maximum = payments.MIN_AMOUNT_RIAL, payments.MAX_AMOUNT_RIAL
    bounds("below-min", minimum - 1, 105, f"رد شدن مبلغ زیر حداقل ({minimum - 1:,} ریال)")
    bounds("max", maximum, payments.RESULT_OK, f"پذیرش حداکثر مبلغ ({maximum:,} ریال)")
    bounds("above-max", maximum + 1, 113, f"رد شدن مبلغ بالای حداکثر ({maximum + 1:,} ریال)")
    # Deliberately unusable: proves the gateway really validates the address we
    # send it, so a typo in PUBLIC_BACKEND_URL would show up here.
    bounds("bad-callback", 5_000_000, 106, "رد شدن آدرس بازگشت نامعتبر", callback="not a url")
    return checks


# ---------------------------------------------------------------------------
# plans and orders
# ---------------------------------------------------------------------------


def _plan_report() -> tuple:
    rows, checks = [], []
    for plan in Plan.objects.all().order_by("id"):
        monthly = payments.rial_amount(plan.price)
        yearly = monthly * billing_views.CYCLE_MONTHS_CHARGED["yearly"]
        row = {
            "slug": plan.slug,
            "name": plan.name,
            "price": plan.price,
            "sellable": plan.sellable,
            "monthlyRial": monthly,
            "yearlyRial": yearly,
        }
        if not plan.sellable:
            row["status"], row["detail"] = "info", "فروش آنلاین ندارد"
        elif monthly <= 0:
            row["status"], row["detail"] = "info", "قیمت صفر است (آنلاین فروخته نمی‌شود)"
        elif not (payments.MIN_AMOUNT_RIAL <= monthly <= payments.MAX_AMOUNT_RIAL):
            row["status"], row["detail"] = "fail", "مبلغ ماهانه خارج از محدودهٔ درگاه است"
            checks.append(
                _check(
                    f"plan-{plan.slug}",
                    f"مبلغ پلن {plan.name}",
                    "fail",
                    f"{monthly:,} ریال خارج از محدودهٔ درگاه است — خرید آنلاین این پلن خطا می‌دهد",
                )
            )
        elif yearly > payments.MAX_AMOUNT_RIAL:
            row["status"], row["detail"] = "fail", "مبلغ سالانه از سقف درگاه می‌گذرد"
            checks.append(
                _check(
                    f"plan-{plan.slug}",
                    f"مبلغ سالانهٔ پلن {plan.name}",
                    "fail",
                    f"{yearly:,} ریال از سقف {payments.MAX_AMOUNT_RIAL:,} ریالی درگاه بیشتر است — "
                    "خرید سالانه رد می‌شود",
                )
            )
        else:
            row["status"], row["detail"] = "pass", "قابل خرید آنلاین"
        rows.append(row)
    return rows, checks


def _gateway_code(payment: Payment) -> tuple:
    """(stage, code, Persian message) behind an order's stored gateway answer."""
    raw = payment.raw_response or {}
    for stage in ("verify", "request"):
        answer = raw.get(stage) or {}
        if answer.get("result") is not None:
            code = payments.as_int(answer.get("result"), -1)
            return stage, code, payments.describe_result(code, answer.get("message"))
    if raw.get("detail"):
        return "engine", None, str(raw["detail"])
    return None, None, ""


def _order_report() -> dict:
    today = timezone.localdate()
    pending = Payment.objects.filter(status=PAYMENT_PENDING)
    # Orders are dated when they are created, so anything still pending from an
    # earlier day never came back from the bank: the buyer walked away, the
    # callback was lost, or verify could not be reached at the time.
    stuck = pending.filter(date__lt=today)
    recent = Payment.objects.filter(
        status=PAYMENT_FAILED, date__gte=today - timedelta(days=RECENT_DAYS)
    ).order_by("-id")

    failed = []
    for payment in recent[:RECENT_FAILED_SHOWN]:
        stage, code, message = _gateway_code(payment)
        failed.append(
            {
                "id": payment.pk,
                "user": payment.user,
                "plan": payment.plan,
                "amount": payment.amount,
                "date": payment.date.isoformat() if payment.date else "",
                "stage": stage or "",
                "code": code,
                "message": message,
            }
        )

    last_paid = (
        Payment.objects.filter(status=PAYMENT_PAID).order_by("-id").first()
    )
    oldest_pending = stuck.order_by("id").first()
    return {
        "pending": pending.count(),
        "stuck": stuck.count(),
        "failedRecent": recent.count(),
        "failedWindowDays": RECENT_DAYS,
        "recentFailed": failed,
        "oldestStuck": (
            {
                "id": oldest_pending.pk,
                "user": oldest_pending.user,
                "plan": oldest_pending.plan,
                "amount": oldest_pending.amount,
                "date": oldest_pending.date.isoformat() if oldest_pending.date else "",
            }
            if oldest_pending
            else None
        ),
        "lastPaid": (
            {
                "id": last_paid.pk,
                "plan": last_paid.plan,
                "amount": last_paid.amount,
                "referenceId": last_paid.reference_id,
                "date": last_paid.date.isoformat() if last_paid.date else "",
            }
            if last_paid
            else None
        ),
    }


def _order_checks(orders: dict) -> list:
    checks = []
    if orders["stuck"]:
        checks.append(
            _check(
                "orders-stuck",
                "سفارش‌های بلاتکلیف",
                "warn",
                f"{orders['stuck']} سفارش بیش از یک روز در انتظار مانده — یعنی خریدار به بانک رفت "
                "و برنگشت؛ اگر خودش می‌گوید پول داده، از صفحهٔ خرید «بررسی مجدد» را بزن",
            )
        )
    else:
        checks.append(_check("orders-stuck", "سفارش‌های بلاتکلیف", "pass", "سفارش بلاتکلیفی نیست"))

    if orders["failedRecent"]:
        codes = sorted({f["code"] for f in orders["recentFailed"] if f["code"] is not None})
        listed = "، ".join(str(c) for c in codes) if codes else "بدون کد درگاه"
        checks.append(
            _check(
                "orders-failed",
                "خطاهای اخیر درگاه",
                "warn",
                f"{orders['failedRecent']} پرداخت ناموفق در {orders['failedWindowDays']} روز گذشته "
                f"(کدها: {listed}) — جزئیات پایین‌تر",
            )
        )
    else:
        checks.append(
            _check("orders-failed", "خطاهای اخیر درگاه", "pass", "پرداخت ناموفقی ثبت نشده")
        )

    if orders["lastPaid"]:
        last = orders["lastPaid"]
        checks.append(
            _check(
                "orders-paid",
                "آخرین پرداخت موفق",
                "info",
                f"#{last['id']} — {last['plan']} — {last['amount']}"
                + (f" — کد رهگیری {last['referenceId']}" if last["referenceId"] else "")
                + (f" — {last['date']}" if last["date"] else ""),
            )
        )
    else:
        checks.append(
            _check(
                "orders-paid",
                "آخرین پرداخت موفق",
                "info",
                "هیچ پرداخت تأییدشده‌ای ثبت نشده — با مرچنت آزمایشی این طبیعی است",
            )
        )
    return checks


# ---------------------------------------------------------------------------
# report
# ---------------------------------------------------------------------------


def result_codes() -> list:
    """The gateway's result codes with the Persian text we show for them."""
    return [
        {"code": code, "message": message}
        for code, message in sorted(payments.RESULT_MESSAGES.items())
    ]


def build_report(request=None, live: bool = False, timeout: int = GATEWAY_TIMEOUT) -> dict:
    """Everything an admin needs to judge the payment path in one payload.

    `live=False` makes no outbound calls: the gateway checks are reported as
    skipped so the page has something to show before the button is pressed.
    """
    callback, callback_check = _callback_check(request)
    checks = [_merchant_check(), callback_check, _route_check()]
    if live:
        checks.extend(_gateway_checks(callback, timeout))
    else:
        checks.append(
            _check(
                "gateway",
                "قرارداد درگاه",
                "skipped",
                "برای آزمایش زنده (اتصال، مرزهای مبلغ، آدرس بازگشت) «اجرای بررسی» را بزن",
            )
        )

    plans, plan_checks = _plan_report()
    checks.extend(plan_checks)
    orders = _order_report()
    checks.extend(_order_checks(orders))

    summary = {"passed": 0, "failed": 0, "warned": 0, "skipped": 0}
    for check in checks:
        if check["status"] == "pass":
            summary["passed"] += 1
        elif check["status"] == "fail":
            summary["failed"] += 1
        elif check["status"] == "warn":
            summary["warned"] += 1
        elif check["status"] == "skipped":
            summary["skipped"] += 1

    return {
        "checkedAt": timezone.now().isoformat(),
        "live": live,
        "sandbox": payments.is_sandbox(),
        "merchant": _mask(payments.merchant_code()),
        "callbackUrl": callback,
        "amounts": {
            "minRial": payments.MIN_AMOUNT_RIAL,
            "maxRial": payments.MAX_AMOUNT_RIAL,
            "minToman": payments.MIN_AMOUNT_RIAL // 10,
            "maxToman": payments.MAX_AMOUNT_RIAL // 10,
        },
        "summary": summary,
        "checks": checks,
        "plans": plans,
        "orders": orders,
        "codes": result_codes(),
    }
