"""Health check for the payment path, shown in the admin panel.

`deploy/smoke_payment.py` proves the deployed path from outside the app (nginx,
routes, a real checkout). This module answers the same question from inside it —
what the running code can see — so an admin can look before calling support:

* is the gateway configured with a real merchant code, or in sandbox?
* which callback URL would the gateway send the buyer back to, and where does
  the buyer end up after that (a callback that works but redirects to
  `localhost` is a dead end an admin has to be able to see here)?
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

from django.conf import settings
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


def _callback_check(request) -> tuple[str, dict]:
    """Return the callback URL, and a check describing whether it is usable."""
    callback = billing_views._callback_url(request or _ConfiguredOnlyRequest())
    if not callback:
        return callback, _check(
            "callback",
            "آدرس بازگشت خریدار",
            "warn",
            "تعیین نشد — PUBLIC_BACKEND_URL را در .env ست کن تا درگاه بداند خریدار را کجا "
            "برگرداند",
        )
    if billing_views.is_loopback_url(callback):
        return callback, _check(
            "callback",
            "آدرس بازگشت خریدار",
            "fail",
            f"{callback} — آدرس محلی است و از اینترنت قابل دسترسی نیست؛ خریدار هرگز "
            "برنمی‌گردد. PUBLIC_BACKEND_URL را در .env ست کن",
        )
    if not callback.startswith(("http://", "https://")):
        # The gateway's own rule (کد ۱۰۶): `callbackUrl` must start with http or
        # https. Missing scheme is one character away in .env
        # (`PUBLIC_BACKEND_URL=dlea.piqagram.ir`) and makes *every* checkout
        # fail, so it is a failure here rather than a warning.
        return callback, _check(
            "callback",
            "آدرس بازگشت خریدار",
            "fail",
            f"{callback} — با http:// یا https:// شروع نمی‌شود؛ درگاه آن را با کد ۱۰۶ رد "
            "می‌کند. PUBLIC_BACKEND_URL را با پروتکل کامل ست کن",
        )
    if callback.startswith("https://"):
        status, detail = "pass", callback
    else:
        status, detail = (
            "warn",
            f"{callback} — روی https نیست (خریدار بعد از بانک یک hop به http می‌خورد): "
            "PUBLIC_BACKEND_URL را در .env ست کن",
        )
    return callback, _check("callback", "آدرس بازگشت خریدار", status, detail)


def _frontend_check(request) -> tuple[str, dict]:
    """Where the buyer's browser lands once we have settled the order.

    The callback URL can be perfect and this still sends the buyer to their own
    machine — `FRONTEND_URL` unset means the dev fallback, so it is checked
    explicitly rather than assumed.
    """
    target = billing_views._frontend_url(request)
    if not target:
        return target, _check(
            "frontend",
            "مقصد بازگشت خریدار",
            "info",
            "روی همان هاستی که خریدار با آن آمده می‌ماند (FRONTEND_URL ست نشده)",
        )
    if billing_views.is_loopback_url(target):
        if settings.DEBUG:
            # Aimed at a developer running both halves on this machine.
            return target, _check(
                "frontend", "مقصد بازگشت خریدار", "info", f"{target} — حالت توسعه"
            )
        # Only reachable by setting FRONTEND_URL to a local address by mistake;
        # that mistake sends every paying buyer to their own machine.
        return target, _check(
            "frontend",
            "مقصد بازگشت خریدار",
            "fail",
            f"{target} — خریدار بعد از پرداخت به سیستم خودش فرستاده می‌شود؛ "
            "FRONTEND_URL را در .env ست کن",
        )
    if not target.startswith("https://"):
        return target, _check(
            "frontend",
            "مقصد بازگشت خریدار",
            "warn",
            f"{target} — روی https نیست؛ FRONTEND_URL را در .env ست کن",
        )
    return target, _check("frontend", "مقصد بازگشت خریدار", "pass", target)


class _ConfiguredOnlyRequest:
    """Stands in for a request when there is none (management command, tests).

    Only the configured URL is real in that case, so the host is left empty:
    inventing one (`http://localhost/...`) would show up as a broken callback
    when the truth is that no one can tell without a request.
    """

    def build_absolute_uri(self, path: str) -> str:
        return ""


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
    frontend, frontend_check = _frontend_check(request)
    checks = [_merchant_check(), callback_check, frontend_check, _route_check()]
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
        "frontendUrl": frontend,
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
