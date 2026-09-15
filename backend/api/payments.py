"""Zibal payment gateway (IPG) client.

Ported from the WooCommerce plugin that used to run on dlea.ir
(`zibal-payment-gateway-for-woocommerce`): same two calls, same Rial
amounts, same result codes — but as plain functions the Django views and
the tests can drive directly instead of a WordPress gateway class.

The contract, per https://help.zibal.ir/ipg/:

    POST /v1/request   {merchant, amount, callbackUrl, orderId, ...}
        -> {result, message, trackId}
           result 100 means "redirect the buyer to /start/<trackId>"

    POST /v1/verify    {merchant, trackId}
        -> {result, message, amount, cardNumber, refNumber, paidAt, status}

`amount` is always Rial. The admin panel stores prices in Toman, so every
amount is multiplied by ten on the way out and the verified amount is
compared against that same Rial figure.

Behaviour worth keeping in mind:

* `verify` is the only proof of payment — the browser callback alone is not.
  A second verify of the same session answers 201 (already confirmed), which
  is why the caller treats both 100 and 201 as settled.
* `merchant` defaults to the string `zibal`, the gateway's public test
  merchant. Real payments need `ZIBAL_MERCHANT` in the environment.
"""

import json
import os
import urllib.error
import urllib.request

REQUEST_URL = "https://gateway.zibal.ir/v1/request"
VERIFY_URL = "https://gateway.zibal.ir/v1/verify"
START_URL = "https://gateway.zibal.ir/start/%s"

RESULT_OK = 100
RESULT_ALREADY_VERIFIED = 201
SANDBOX_MERCHANT = "zibal"

# What the gateway accepts, in Rial. Probed against the live gateway on
# 2026-09-15: exactly `1000` and exactly `4_000_000_000` answer result 100,
# while `999` answers 105 and `4_000_000_001` answers 113. The ceiling used to
# be 5,000,000,000 here, so an order our own guard called valid was passed to
# the gateway only to come back as a refusal — `deploy/smoke_payment.py`
# re-probes these two bounds on every smoke run.
MIN_AMOUNT_RIAL = 1000
MAX_AMOUNT_RIAL = 4_000_000_000

# The gateway's own `message` is authoritative and always preferred; this map
# only exists so a failed payment reads like Persian prose in our UI when the
# gateway answers with a bare code.
RESULT_MESSAGES = {
    100: "با موفقیت انجام شد",
    101: "تراکنش قبلاً تأیید شده است",
    102: "مرچنت کد یافت نشد",
    103: "درگاه در حالت غیرفعال است",
    104: "مرچنت کد نامعتبر است",
    105: "مبلغ درخواستی کمتر از حد مجاز درگاه است",
    106: "آدرس بازگشت نامعتبر است",
    113: "مبلغ درخواستی بیشتر از حد مجاز درگاه است",
    201: "تراکنش قبلاً تأیید شده است",
    202: "تراکنش ناموفق بود یا پرداخت انجام نشد",
    203: "شناسه تراکنش یافت نشد",
    140: "آدرس بازگشت پرداخت ارسال نشده است",
    400: "پارامترهای ارسالی ناقص یا نامعتبر است",
}

_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


class GatewayError(Exception):
    """The gateway could not be reached or answered with something unusable."""


def merchant_code() -> str:
    """Merchant code from the environment, falling back to the test merchant."""
    return os.environ.get("ZIBAL_MERCHANT", "").strip() or SANDBOX_MERCHANT


def is_sandbox() -> bool:
    return merchant_code() == SANDBOX_MERCHANT


def toman_amount(price) -> int:
    """Parse a panel price ("۲۰۰,۰۰۰" / "2,000,000 تومان / ماه") into Toman.

    Prices are stored as display strings, so separators, Persian digits and
    trailing unit words all have to survive. Anything unparseable is 0, which
    the callers treat as "this plan cannot be sold".
    """
    if price is None:
        return 0
    digits = []
    for char in str(price).translate(_FA_DIGITS):
        if char.isdigit():
            digits.append(char)
        elif char in ",٬. ":  # grouping separators inside the number
            continue
        else:
            break  # unit words ("تومان / ماه") start here
    if not digits:
        return 0
    try:
        return int("".join(digits))
    except ValueError:
        return 0


def rial_amount(price) -> int:
    """Panel price (Toman) in Rial, the unit the gateway expects."""
    return toman_amount(price) * 10


def payment_url(track_id) -> str:
    return START_URL % track_id


def describe_result(result, message: str | None = None) -> str:
    """A Persian sentence for a gateway result code."""
    code = as_int(result, default=-1)
    text = (message or "").strip()
    # `message` is English boilerplate ("success", "merchant not found") on
    # most failures, so the local table wins when it knows the code.
    if code in RESULT_MESSAGES and RESULT_MESSAGES[code]:
        return RESULT_MESSAGES[code]
    if text:
        return text
    return f"خطای نامشخص درگاه (کد {code})"


def as_int(value, default=0) -> int:
    """Gateway answers sometimes carry codes as strings."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _post(url: str, payload: dict, timeout: int = 30) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:  # gateway answered 4xx/5xx
        detail = exc.read().decode("utf-8", errors="replace")
        raise GatewayError(f"پاسخ نامعتبر از درگاه ({exc.code}): {detail[:200]}") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise GatewayError(f"اتصال به درگاه پرداخت برقرار نشد: {exc}") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise GatewayError(f"پاسخ درگاه قابل خواندن نبود: {raw[:200]}") from exc
    if not isinstance(data, dict):
        raise GatewayError("پاسخ درگاه ساختار مورد انتظار را نداشت")
    return data


def request_payment(
    amount_rial: int,
    callback_url: str,
    order_id: str,
    description: str = "",
    mobile: str = "",
) -> dict:
    """Open a payment session and return the gateway's raw answer.

    The caller is responsible for checking `result` — a non-100 answer is a
    normal business outcome (bad merchant code, amount out of range), not an
    exception.
    """
    payload = {
        "merchant": merchant_code(),
        "amount": int(amount_rial),
        "callbackUrl": callback_url,
        "orderId": str(order_id),
        "description": description[:255],
    }
    if mobile:
        payload["mobile"] = mobile
    return _post(REQUEST_URL, payload)


def verify_payment(track_id) -> dict:
    """Confirm a payment session. `result` 100 or 201 means it is settled."""
    return _post(VERIFY_URL, {"merchant": merchant_code(), "trackId": as_int(track_id)})
