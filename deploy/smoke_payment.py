#!/usr/bin/env python
"""Smoke-test the payment path of a running Dlea backend.

This proves the money path works end to end *without* anyone paying: it stops
at "the gateway opened a session for the exact amount and callback URL our
server sent" and never pretends an order was settled.

What it checks, in order:

  1. configuration  which merchant code the app uses (the literal `zibal` means
                    sandbox: no real money), and the public URLs
  2. routing        the deployed code still exposes /api/billing/* — probed the
                    way a browser reaches it (through nginx)
  3. gateway        reachable, and our Rial bounds match the gateway's
  4. login          a real POST /api/auth/login/ yields a token
  5. checkout       POST /api/billing/checkout/ creates the order row and a
                    gateway session; the amount, plan and callback URL are then
                    read back from the database and re-probed against the
                    gateway
  6. return trip    the callback the bank would use: a session that was never
                    paid must not settle, and the browser must land on the
                    billing page with the right status
  7. cleanup        the rows this run created are removed again

Writes are announced before they happen and undone at the end (`--keep` leaves
the order visible in the admin panel instead). `--dry-run` skips every write:
only steps 1-3 run.

Run it with the backend's own Python, from the backend directory:

    .venv/bin/python ../deploy/smoke_payment.py --site http://127.0.0.1 --host dlea.piqagram.ir

`deploy/smoke-payment.sh` does that for you (and finds the backend itself, which
matters when this file is uploaded to /tmp to be run on the server). Exit code is
0 only when nothing FAILED.
"""

import argparse
import json
import os
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

def _find_backend():
    """The directory that holds `config/settings.py`.

    This file lives in the repo as `deploy/smoke_payment.py` and is also copied
    to `/tmp` to run on the server, so its own location says nothing: the
    environment variable the wrapper sets wins, then the repo layout, then the
    working directory.
    """
    here = Path(__file__).resolve().parent
    candidates = [
        os.environ.get("DLEA_BACKEND_DIR", "").strip(),
        here.parent / "backend",
        here / "backend",
        here.parent,
        Path.cwd(),
    ]
    for candidate in candidates:
        if candidate and (Path(candidate) / "config" / "settings.py").is_file():
            return Path(candidate).resolve()
    return None


REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = _find_backend()
if BACKEND_DIR is None:
    print(
        "Could not find the backend directory (config/settings.py). Run this from\n"
        "the backend directory or set DLEA_BACKEND_DIR=/path/to/backend.",
        file=sys.stderr,
    )
    sys.exit(2)
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

try:  # Persian text in a Windows console
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

import django  # noqa: E402  (must follow DJANGO_SETTINGS_MODULE)

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402

try:
    from api import billing_views, payments  # noqa: E402
except ImportError as exc:  # the payment code itself never reached this host
    print(f"The payment modules are missing from {BACKEND_DIR}/api ({exc}).", file=sys.stderr)
    print(
        "This host still runs the backend from before the billing feature: deploy\n"
        "first (deploy/local-deploy.sh or local-deploy.bat), then run the smoke test.",
        file=sys.stderr,
    )
    sys.exit(2)

from api.models import (  # noqa: E402
    PAYMENT_PAID,
    PAYMENT_PENDING,
    Payment,
    Plan,
    Subscription,
)

SMOKE_EMAIL = "smoke-payment@dlea.local"
CONSIDERED = {"passed": 0, "failed": 0, "warned": 0, "skipped": 0}


# ---------------------------------------------------------------------------
# reporting
# ---------------------------------------------------------------------------


def section(title: str) -> None:
    print()
    print(f"--- {title} " + "-" * max(0, 62 - len(title)))


def _line(mark: str, name: str, detail: str = "") -> None:
    print(f"  [{mark}] {name}" + (f": {detail}" if detail else ""))


def ok(name: str, detail: str = "") -> None:
    CONSIDERED["passed"] += 1
    _line("PASS", name, detail)


def fail(name: str, detail: str = "") -> None:
    CONSIDERED["failed"] += 1
    _line("FAIL", name, detail)


def warn(name: str, detail: str = "") -> None:
    CONSIDERED["warned"] += 1
    _line("WARN", name, detail)


def skip(name: str, detail: str = "") -> None:
    CONSIDERED["skipped"] += 1
    _line("SKIP", name, detail)


def info(name: str, detail: str = "") -> None:
    _line("info", name, detail)


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """The callback answers with a redirect; its Location *is* the assertion."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(_NoRedirect)


def http(method: str, url: str, payload=None, token: str = "", host: str = "", timeout: int = 30):
    """(status, headers, body) — status 0 means the request never got out."""
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if host:
        # nginx routes on Host, so a loopback probe must carry the real one.
        headers["Host"] = host
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with OPENER.open(request, timeout=timeout) as response:
            return response.status, response.headers, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers, exc.read().decode("utf-8", "replace")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return 0, {}, str(exc)


def body_hint(body: str, limit: int = 160) -> str:
    text = " ".join((body or "").split())
    return text[:limit] + ("…" if len(text) > limit else "")


class _FakeRequest:
    """Stands in for gunicorn's request when the callback URL has to be derived.

    Behind the CDN the origin sees plain HTTP, which is exactly why
    `PUBLIC_BACKEND_URL` matters — this reproduces that view.
    """

    def __init__(self, host: str):
        self._host = host

    def build_absolute_uri(self, path: str) -> str:
        return f"http://{self._host}{path}"


# ---------------------------------------------------------------------------
# steps
# ---------------------------------------------------------------------------


def step_config(host: str) -> str:
    """Report the configuration the app actually loads; return its callback URL."""
    section("1. Configuration (backend/.env, i.e. what the app loads)")
    if payments.is_sandbox():
        warn(
            "merchant",
            f"sandbox ({payments.SANDBOX_MERCHANT}) — هیچ پرداخت واقعی انجام نمی‌شود؛ "
            "ZIBAL_MERCHANT را در .env بگذار و pm2 restart dlea-api",
        )
    else:
        merchant = payments.merchant_code()
        ok("merchant", f"{merchant[:4]}{'*' * max(0, len(merchant) - 4)} (درگاه واقعی)")

    public = os.environ.get("PUBLIC_BACKEND_URL", "").strip()
    frontend = os.environ.get("FRONTEND_URL", "").strip()

    if public:
        ok("PUBLIC_BACKEND_URL", public)
    else:
        warn(
            "PUBLIC_BACKEND_URL",
            "خالی است؛ آدرس بازگشت از هدر درخواست ساخته می‌شود و روی سرور http درمی‌آید",
        )
    if frontend:
        ok("FRONTEND_URL", frontend)
    else:
        warn("FRONTEND_URL", "خالی است؛ از CORS_ALLOWED_ORIGINS استفاده می‌شود")

    callback = billing_views._callback_url(_FakeRequest(host))
    label = "callback URL" + ("" if public else " (تخمینی، از هدر درخواست)")
    if not callback.startswith(("http://", "https://")):
        # استثنای زیبال: `callbackUrl` باید با http یا https شروع شود وگرنه کد ۱۰۶.
        fail(
            label,
            f"{callback} — با http:// یا https:// شروع نمی‌شود؛ درگاه آن را با کد ۱۰۶ رد "
            "می‌کند — PUBLIC_BACKEND_URL را با پروتکل کامل ست کن",
        )
    elif callback.startswith("https://"):
        ok(label, callback)
    else:
        warn(
            label,
            f"{callback} — بدون https خریدار بعد از بازگشت از بانک یک hop به http می‌خورد",
        )
    return callback


def step_routes(site: str, host: str, timeout: int) -> None:
    section("2. Routing (through nginx, the way a browser reaches it)")

    status, _headers, body = http("GET", f"{site}/api/plans/", host=host, timeout=timeout)
    if status == 200:
        ok("GET /api/plans/", "200")
    else:
        fail("GET /api/plans/", f"HTTP {status} — {body_hint(body)}")

    status, _headers, body = http(
        "GET", f"{site}/api/billing/orders/1/", host=host, timeout=timeout
    )
    if status == 401:
        ok("GET /api/billing/orders/ (نیازمند ورود)", "401 — مسیر در کد اجراشده هست")
    elif status == 404:
        fail(
            "GET /api/billing/orders/",
            "404 — این مسیر در کد اجراشده نیست؛ بک‌اند دیپلوی نشده است",
        )
    elif status == 400:
        fail("GET /api/billing/orders/", f"400 — Host رد شد (ALLOWED_HOSTS): {body_hint(body)}")
    else:
        fail("GET /api/billing/orders/", f"HTTP {status} — {body_hint(body)}")

    status, _headers, body = http(
        "POST", f"{site}/api/billing/checkout/", payload={}, host=host, timeout=timeout
    )
    if status == 401:
        ok("POST /api/billing/checkout/ بدون توکن", "401 — سفارش بدون ورود ساخته نمی‌شود")
    else:
        fail(
            "POST /api/billing/checkout/ بدون توکن",
            f"HTTP {status} — انتظار 401 بود: {body_hint(body)}",
        )


def _gateway_result(label: str, amount, callback: str, order_id: str, timeout: int):
    try:
        answer = payments.request_payment(
            amount_rial=amount, callback_url=callback, order_id=order_id, description="smoke test"
        )
    except payments.GatewayError as exc:
        fail(label, f"درگاه پاسخ نداد: {exc}")
        return None
    return answer


def step_gateway(callback: str, timeout: int) -> None:
    section("3. Gateway contract (real calls, no money)")

    minimum = payments.MIN_AMOUNT_RIAL
    maximum = payments.MAX_AMOUNT_RIAL

    answer = _gateway_result("حداقل مبلغ", minimum, callback, "smoke-min", timeout)
    if answer is not None:
        result = payments.as_int(answer.get("result"), -1)
        if result == payments.RESULT_OK:
            ok(
                f"amount={minimum} (حداقل پلن‌ها)",
                f"result 100، سشن {answer.get('trackId')} (پرداخت‌نشده، بلااستفاده)",
            )
        else:
            fail(f"amount={minimum}", f"result {result} — {answer.get('message')}")

    answer = _gateway_result("زیر حداقل", minimum - 1, callback, "smoke-below-min", timeout)
    if answer is not None:
        result = payments.as_int(answer.get("result"), -1)
        if result == 105:
            ok(f"amount={minimum - 1}", "result 105 — درگاه زیر حداقل را رد می‌کند")
        else:
            fail(f"amount={minimum - 1}", f"result {result} — انتظار 105 بود")

    answer = _gateway_result("حداکثر مبلغ", maximum, callback, "smoke-max", timeout)
    if answer is not None:
        result = payments.as_int(answer.get("result"), -1)
        if result == payments.RESULT_OK:
            ok(
                f"amount={maximum} (MAX_AMOUNT_RIAL)",
                f"result 100، سشن {answer.get('trackId')} (پرداخت‌نشده، بلااستفاده)",
            )
        else:
            fail(
                f"amount={maximum}",
                f"result {result} — MAX_AMOUNT_RIAL ما بالاتر از سقف درگاه است: {answer.get('message')}",
            )

    answer = _gateway_result("بالای حداکثر", maximum + 1, callback, "smoke-above-max", timeout)
    if answer is not None:
        result = payments.as_int(answer.get("result"), -1)
        if result == 113:
            ok(f"amount={maximum + 1}", "result 113 — سقف درگاه با MAX_AMOUNT_RIAL یکی است")
        elif result == payments.RESULT_OK:
            fail(
                f"amount={maximum + 1}",
                f"درگاه قبول کرد (result 100) — یعنی سقف واقعی بالاتر از {maximum} است",
            )
        else:
            fail(f"amount={maximum + 1}", f"result {result} — انتظار 113 بود")

    answer = _gateway_result(
        "آدرس بازگشت نامعتبر", 5_000_000, "not a url", "smoke-bad-callback", timeout
    )
    if answer is not None:
        result = payments.as_int(answer.get("result"), -1)
        if result == 106:
            ok("callbackUrl نامعتبر", "result 106 — درگاه آدرس بازگشت را واقعاً بررسی می‌کند")
        else:
            fail("callbackUrl نامعتبر", f"result {result} — انتظار 106 بود")


def prepare_account(email: str, password: str, dry_run: bool):
    """(email, password, created_here) for the account the checkout will use."""
    section("4. Login")
    if email and not password:
        # Never touch the password of an account we did not create.
        fail("account", f"برای {email} رمز عبور داده نشده (--password)")
        return "", "", False
    if email and password:
        info("account", f"{email} (از آرگومان‌ها، بدون هیچ نوشتنی)")
        return email, password, False
    if dry_run:
        skip("account", "--dry-run")
        return "", "", False

    email = email or SMOKE_EMAIL
    password = password or secrets.token_urlsafe(18)
    user_model = get_user_model()
    user, created = user_model.objects.get_or_create(
        username=email, defaults={"email": email}
    )
    user.email = email
    user.set_password(password)
    user.is_active = True
    user.save()
    info(
        "account",
        f"{email} ({'ساخته شد' if created else 'از قبل بود'}) — در پایان همین اجرا پاک می‌شود",
    )

    leftover = Payment.objects.filter(account=user).exclude(status=PAYMENT_PAID)
    if leftover.exists():
        info("leftover orders", f"{leftover.count()} سفارش بی‌نتیجه از اجراهای قبلی پاک شد")
        leftover.delete()
    return email, password, True


def step_login(site: str, host: str, email: str, password: str, timeout: int) -> str:
    status, _headers, body = http(
        "POST",
        f"{site}/api/auth/login/",
        payload={"email": email, "password": password},
        host=host,
        timeout=timeout,
    )
    if status != 200:
        fail("POST /api/auth/login/", f"HTTP {status} — {body_hint(body)}")
        return ""
    try:
        token = (json.loads(body) or {}).get("access", "")
    except json.JSONDecodeError:
        token = ""
    if token:
        ok("POST /api/auth/login/", f"200 — توکن گرفته شد برای {email}")
    else:
        fail("POST /api/auth/login/", f"200 ولی بدنه توکن نداشت: {body_hint(body)}")
    return token


def pick_plan(slug: str, cycle: str):
    """A sellable, priced plan plus the Rial amount the server should charge."""
    candidates = [p for p in Plan.objects.filter(sellable=True) if payments.toman_amount(p.price) > 0]
    if slug:
        candidates = [p for p in candidates if p.slug == slug]
    if not candidates:
        return None, 0
    plan = candidates[0]
    months = billing_views.CYCLE_MONTHS_CHARGED.get(cycle, 1)
    rial = payments.rial_amount(plan.price) * months
    return plan, rial


def step_checkout(site, host, token, plan, cycle, expected_rial, timeout, user_email):
    section("5. Checkout (creates one order row + one gateway session)")
    if not token:
        skip("POST /api/billing/checkout/", "بدون توکن")
        return None

    if not (payments.MIN_AMOUNT_RIAL <= expected_rial <= payments.MAX_AMOUNT_RIAL):
        fail(
            "مبلغ پلن در محدوده درگاه نیست",
            f"{expected_rial} ریال برای «{plan.name}» — این پلن آنلاین قابل فروش نیست",
        )
        return None
    info(
        "plan",
        f"{plan.slug} «{plan.name}» {plan.price} — انتظار {expected_rial:,} ریال ({cycle})",
    )

    status, _headers, body = http(
        "POST",
        f"{site}/api/billing/checkout/",
        payload={"plan": plan.slug, "cycle": cycle},
        token=token,
        host=host,
        timeout=timeout,
    )
    if status != 200:
        fail("POST /api/billing/checkout/", f"HTTP {status} — {body_hint(body)}")
        return None
    try:
        answer = json.loads(body)
    except json.JSONDecodeError:
        fail("POST /api/billing/checkout/", f"بدنه JSON نبود: {body_hint(body)}")
        return None

    payment = Payment.objects.filter(pk=answer.get("paymentId")).first()
    if payment is None:
        fail("سفارش در دیتابیس", f"paymentId={answer.get('paymentId')} پیدا نشد")
        return None
    ok("سفارش ساخته شد", f"#{payment.pk} برای {user_email}")

    if answer.get("amount") == expected_rial and payment.amount_rial == expected_rial:
        ok("مبلغ سرور", f"{expected_rial:,} ریال ({payment.amount}) — از روی رکورد پلن، نه کلاینت")
    else:
        fail(
            "مبلغ سرور",
            f"پاسخ {answer.get('amount')} / دیتابیس {payment.amount_rial} ≠ انتظار {expected_rial}",
        )

    track_id = str(answer.get("trackId") or "")
    if track_id and answer.get("paymentUrl") == payments.payment_url(track_id):
        ok("لینک پرداخت", answer["paymentUrl"])
    else:
        fail("لینک پرداخت", f"trackId {track_id!r} با {answer.get('paymentUrl')!r} جور نیست")

    if payment.authority == track_id and payment.status == PAYMENT_PENDING:
        ok("رکورد سفارش", f"status={payment.status}، trackId={payment.authority}، gateway={payment.gateway}")
    else:
        fail(
            "رکورد سفارش",
            f"status={payment.status}، authority={payment.authority!r} ≠ {track_id!r}",
        )

    if payment.plan_slug == plan.slug and payment.cycle == cycle and payment.account_id:
        ok("پلن و دورهٔ سفارش", f"{payment.plan_slug} / {payment.cycle}")
    else:
        fail("پلن و دورهٔ سفارش", f"{payment.plan_slug!r} / {payment.cycle!r}")

    if bool(answer.get("sandbox")) == payments.is_sandbox():
        info("sandbox flag", "درست — فرانت می‌داند پرداخت واقعی است یا آزمایشی")
    else:
        fail("sandbox flag", f"پاسخ {answer.get('sandbox')} ولی درگاه {payments.is_sandbox()}")

    sent = (payment.raw_response or {}).get("sent") or {}
    callback = sent.get("callbackUrl", "")
    if not callback:
        fail("callbackUrl ارسالی", "روی سفارش ثبت نشده است (کد قدیمی روی سرور؟)")
        return payment
    if callback.startswith("https://"):
        ok("callbackUrl ارسالی", callback)
    else:
        warn("callbackUrl ارسالی", f"{callback} — روی https نیست؛ PUBLIC_BACKEND_URL را ست کن")

    if sent.get("amount") == expected_rial:
        ok("مبلغ ارسالی به درگاه", f"{sent['amount']:,} ریال")
    else:
        fail("مبلغ ارسالی به درگاه", f"{sent.get('amount')!r} ≠ {expected_rial}")

    answer = _gateway_result(
        "درگاه با همان callbackUrl سرور", expected_rial, callback, f"smoke-cb-{payment.pk}", timeout
    )
    if answer is not None:
        result = payments.as_int(answer.get("result"), -1)
        if result == payments.RESULT_OK:
            ok("callbackUrl مورد قبول درگاه", "result 100 — درگاه همین آدرس را می‌پذیرد")
        else:
            fail(
                "callbackUrl مورد قبول درگاه",
                f"result {result} — {payments.describe_result(result, answer.get('message'))}",
            )
    return payment


def _location(headers) -> str:
    return headers.get("Location", "") if headers else ""


def step_return_trip(site, host, payment, token, frontend, timeout):
    section("6. Return trip (what the bank sends the buyer's browser)")
    if payment is None:
        skip("callback", "سفارشی ساخته نشد")
        return

    base = f"{site}/api/billing/callback/"
    params = {"orderId": payment.pk, "trackId": payment.authority}

    # a) The gateway says "paid" for a session nobody paid. This is the check
    #    that matters: nothing may be unlocked without a verified payment.
    query = urllib.parse.urlencode({**params, "success": "1"})
    status, headers, body = http("GET", f"{base}?{query}", host=host, timeout=timeout)
    payment.refresh_from_db()
    verify = (payment.raw_response or {}).get("verify") or {}
    outcome = payments.describe_result(verify.get("result", -1), verify.get("message")) if verify else "verify صدا زده نشد"
    if payment.status == PAYMENT_PAID or Subscription.objects.filter(user=payment.account).exists():
        fail(
            "پرداخت‌نشده تسویه نشد",
            f"!!! سفارش {payment.status} شد و اشتراک ساخته شد — verify قابل اعتماد نیست",
        )
    else:
        ok(
            "پرداخت‌نشده تسویه نشد",
            f"status={payment.status} و اشتراکی ساخته نشد ({outcome})",
        )
    if status in (301, 302):
        ok("callback → مرورگر", f"{status} به {_location(headers)}")
    else:
        fail("callback → مرورگر", f"HTTP {status} — انتظار ریدایرکت بود: {body_hint(body)}")

    # b) Plain open of the callback URL (no gateway parameters at all).
    status, headers, body = http("GET", f"{base}?{urllib.parse.urlencode(params)}", host=host, timeout=timeout)
    location = _location(headers)
    if status in (301, 302) and "status=pending" in location:
        ok("callback بدون پارامتر بانک", "302 با status=pending")
    else:
        fail("callback بدون پارامتر بانک", f"HTTP {status} → {location or body_hint(body)}")

    # c) The buyer cancelled at the bank: success=0.
    query = urllib.parse.urlencode({**params, "success": "0"})
    status, headers, body = http("GET", f"{base}?{query}", host=host, timeout=timeout)
    location = _location(headers)
    payment.refresh_from_db()
    if status in (301, 302) and "status=failed" in location and payment.status != PAYMENT_PAID:
        ok("انصراف در بانک", f"302 با status=failed، سفارش {payment.status}")
    else:
        fail(
            "انصراف در بانک",
            f"HTTP {status} → {location or body_hint(body)}، سفارش {payment.status}",
        )

    if frontend and location and not location.startswith(frontend.rstrip("/")):
        warn("مقصد بازگشت", f"{location} با FRONTEND_URL ({frontend}) هم‌خوان نیست")

    if not token:
        return
    status, _headers, body = http(
        "GET", f"{site}/api/billing/orders/{payment.pk}/", token=token, host=host, timeout=timeout
    )
    try:
        order = json.loads(body)
    except json.JSONDecodeError:
        order = {}
    if status == 200 and order.get("status") == payment.status:
        ok(
            "GET /api/billing/orders/<id>/",
            f"status={order.get('status')}، ref={order.get('referenceId') or '—'}",
        )
    else:
        fail("GET /api/billing/orders/<id>/", f"HTTP {status} — {body_hint(body)}")


def step_cleanup(payment, user_email, created_user, keep):
    section("7. Cleanup")
    if payment is not None and not keep:
        pk, reference = payment.pk, payment.reference_id
        payment.delete()
        ok("سفارش آزمایشی پاک شد", f"#{pk}" + (f" (کد رهگیری {reference})" if reference else ""))
    elif payment is not None:
        info("سفارش باقی ماند", f"#{payment.pk} — در پنل مدیر ← پرداخت‌ها ببین، بعد دستی پاک کن")

    if created_user and not keep:
        user_model = get_user_model()
        removed, _ = user_model.objects.filter(username=user_email).delete()
        ok("کاربر آزمایشی پاک شد", f"{user_email} ({removed} ردیف)")
    elif created_user:
        info("کاربر باقی ماند", user_email)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Smoke-test the Dlea payment path.")
    parser.add_argument("--site", default="http://127.0.0.1", help="base URL to probe (default: %(default)s)")
    parser.add_argument("--host", default="", help="Host header for nginx routing (needed for loopback sites)")
    parser.add_argument("--plan", default="", help="plan slug to buy (default: first sellable one)")
    parser.add_argument("--cycle", default="monthly", choices=["monthly", "yearly"])
    parser.add_argument("--email", default="", help="existing account instead of a throwaway one")
    parser.add_argument("--password", default="", help="password for --email")
    parser.add_argument("--timeout", type=int, default=30, help="per-request timeout in seconds")
    parser.add_argument("--dry-run", action="store_true", help="only configuration, routing and gateway")
    parser.add_argument("--keep", action="store_true", help="leave the test order and user in place")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv or sys.argv[1:])
    site = args.site.rstrip("/")
    host = args.host or urllib.parse.urlparse(site).hostname or ""
    loopback = host in ("127.0.0.1", "localhost", "::1")
    if loopback and not args.host:
        host = os.environ.get("PUBLIC_BACKEND_URL", "").strip() or ""
        host = urllib.parse.urlparse(host).hostname or "dlea.piqagram.ir"
        info("Host header", f"{host} (سایت روی loopback است؛ nginx بر اساس Host مسیردهی می‌کند)")
    elif not args.host:
        host = ""  # a real domain does not need the header repeated

    print("=" * 70)
    print("Dlea payment smoke test")
    print(f"site:  {site}")
    print(f"host:  {host or '(خودِ دامنه)'}")
    print(f"mode:  {'dry-run (بدون هیچ نوشتنی)' if args.dry_run else 'full (یک سفارش آزمایشی می‌سازد و پاک می‌کند)'}")
    print("=" * 70)

    callback = step_config(host)
    step_routes(site, host, args.timeout)
    step_gateway(callback, args.timeout)

    payment = None
    user_email = ""
    created_user = False
    if args.dry_run:
        section("4-7. Checkout / return trip / cleanup")
        skip("همه", "dry-run")
    else:
        user_email, password, created_user = prepare_account(args.email, args.password, args.dry_run)
        token = step_login(site, host, user_email, password, args.timeout) if user_email else ""
        plan, expected = pick_plan(args.plan, args.cycle)
        if plan is None:
            section("5. Checkout")
            fail("پلن قابل فروش", f"پلنی با قیمت پیدا نشد (slug={args.plan or 'هر'})")
        else:
            payment = step_checkout(
                site, host, token, plan, args.cycle, expected, args.timeout, user_email
            )
        frontend = os.environ.get("FRONTEND_URL", "").strip()
        step_return_trip(site, host, payment, token, frontend, args.timeout)
        step_cleanup(payment, user_email, created_user, args.keep)

    print()
    print("=" * 70)
    print(
        f"summary: {CONSIDERED['passed']} PASS، {CONSIDERED['failed']} FAIL، "
        f"{CONSIDERED['warned']} WARN، {CONSIDERED['skipped']} SKIP"
    )
    if CONSIDERED["failed"]:
        print("!!! مسیر پرداخت سالم نیست — جزئیات بالا را ببین.")
    else:
        print("همهٔ بررسی‌های حیاتی سبز است.")
    if payments.is_sandbox():
        print("یادآوری: مرچنت کد در حالت آزمایشی است، پس هیچ پرداخت واقعی انجام نشد.")
    print("=" * 70)
    return 1 if CONSIDERED["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
