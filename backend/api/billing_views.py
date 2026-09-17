"""Billing: send a buyer to the bank, confirm the payment, unlock the plan.

Three steps, mirroring how the old dlea.ir store did it with WooCommerce:

1. `checkout`  creates the order row *before* leaving for the gateway, then
   asks the gateway for a payment session and hands the browser its URL.
2. `callback`  is where the gateway sends the browser back. The browser's
   word is never trusted: the payment is only settled after `verify`.
3. `order`     lets the page show the outcome (کد رهگیری) and retry the
   confirmation when the callback never made it back.

Because the amount is decided by the server from the plan record — never by
the client — a tampered request cannot buy Pro Max for a Toman.
"""

import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse

from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import payments
from .models import (
    PAYMENT_FAILED,
    PAYMENT_PAID,
    PAYMENT_PENDING,
    Payment,
    Plan,
    Subscription,
    UserProfile,
    fa,
)
from .plan_limits import find_plan

# What a cycle buys. Yearly bills ten months and hands over twelve — the
# "۲ ماه هدیه" the pricing page advertises.
CYCLE_DAYS = {"monthly": 30, "yearly": 365}
CYCLE_MONTHS_CHARGED = {"monthly": 1, "yearly": 10}


class BillingCheckoutView(APIView):
    """POST {plan, cycle} -> where to send the browser to pay."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = find_plan(request.data.get("plan"))
        if plan is None:
            return Response({"detail": "پلن انتخاب‌شده پیدا نشد"}, status=status.HTTP_404_NOT_FOUND)
        if not plan.sellable:
            return Response(
                {"detail": "این پلن قابل خرید آنلاین نیست، با پشتیبانی تماس بگیرید"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle = "yearly" if str(request.data.get("cycle", "monthly")) == "yearly" else "monthly"
        toman = payments.toman_amount(plan.price) * CYCLE_MONTHS_CHARGED[cycle]
        rial = toman * 10
        if toman <= 0:
            return Response(
                {"detail": "مبلغ این پلن تعیین نشده است، با پشتیبانی تماس بگیرید"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (payments.MIN_AMOUNT_RIAL <= rial <= payments.MAX_AMOUNT_RIAL):
            return Response(
                {"detail": "مبلغ سفارش خارج از محدوده مجاز درگاه است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            user=_display_name(request.user),
            account=request.user,
            plan=plan.name,
            plan_slug=plan.slug,
            cycle=cycle,
            amount=f"{fa(f'{toman:,}')} تومان",
            amount_rial=rial,
            date=timezone.localdate(),
            status=PAYMENT_PENDING,
            gateway="zibal",
        )

        description = f"خرید {plan.name} ({'سالانه' if cycle == 'yearly' else 'ماهانه'}) — {request.user.email}"
        callback_url = _callback_url(request)
        # Stored alongside the gateway's answer so an order can be audited
        # afterwards: what we asked for (amount, callback URL) versus what the
        # gateway said. `deploy/smoke_payment.py` reads the callback URL back
        # from here and re-probes the gateway with it.
        sent = {
            "amount": rial,
            "callbackUrl": callback_url,
            "orderId": str(payment.pk),
            "mobile": bool(_phone(request.user)),
        }
        try:
            answer = payments.request_payment(
                amount_rial=rial,
                callback_url=callback_url,
                order_id=payment.pk,
                description=description,
                mobile=_phone(request.user),
            )
        except payments.GatewayError as exc:
            payment.status = PAYMENT_FAILED
            payment.raw_response = {"sent": sent, "detail": str(exc)}
            payment.save(update_fields=["status", "raw_response"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        result = payments.as_int(answer.get("result"), default=-1)
        track_id = answer.get("trackId")
        payment.raw_response = {"sent": sent, "request": answer}
        if result != payments.RESULT_OK or not track_id:
            payment.status = PAYMENT_FAILED
            payment.save(update_fields=["status", "raw_response"])
            return Response(
                {"detail": payments.describe_result(result, answer.get("message"))},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.authority = str(track_id)
        payment.save(update_fields=["authority", "raw_response"])
        return Response(
            {
                "paymentId": payment.pk,
                "paymentUrl": payments.payment_url(track_id),
                "trackId": str(track_id),
                "amount": rial,
                "amountToman": toman,
                "plan": plan.name,
                "cycle": cycle,
                "sandbox": payments.is_sandbox(),
            }
        )


class BillingCallbackView(APIView):
    """Where the gateway returns the buyer's browser.

    Always answers with a redirect to the billing page: the visitor is a
    human in a browser, not an API client.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        params = request.query_params
        payment = _find_order(params.get("orderId"), params.get("trackId"))
        if payment is None:
            return _to_billing(
                "unknown", reason="سفارش مربوط به این پرداخت پیدا نشد", request=request
            )

        if payment.status == PAYMENT_PAID:
            return _to_billing("success", payment, request=request)

        if str(params.get("success", "")) != "1":
            if not str(params.get("success", "")).strip():
                # Not a gateway return trip at all (someone opened the URL).
                return _to_billing("pending", payment, request=request)
            payment.status = PAYMENT_FAILED
            payment.save(update_fields=["status"])
            return _to_billing(
                "failed", payment, reason="پرداخت در درگاه انجام نشد", request=request
            )

        payment, message = _confirm(payment, params.get("trackId"))
        if payment.status == PAYMENT_PAID:
            return _to_billing("success", payment, request=request)
        if payment.status == PAYMENT_PENDING:
            # The gateway could not be reached; the order stays open so the
            # page's "بررسی مجدد" button can settle it once the gateway is up.
            return _to_billing("pending", payment, reason=message, request=request)
        return _to_billing("failed", payment, reason=message, request=request)


class BillingOrderView(APIView):
    """The buyer's own view of one order (status + tracking code)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        payment = _own_order(request.user, pk)
        if payment is None:
            return Response({"detail": "سفارش پیدا نشد"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_order_payload(payment))

    def post(self, request, pk):
        """Re-run the gateway confirmation for an order still pending."""
        payment = _own_order(request.user, pk)
        if payment is None:
            return Response({"detail": "سفارش پیدا نشد"}, status=status.HTTP_404_NOT_FOUND)
        if payment.status == PAYMENT_PAID:
            return Response(_order_payload(payment))
        if not payment.authority:
            return Response(
                {"detail": "این سفارش به درگاه پرداخت نرفته است"}, status=status.HTTP_400_BAD_REQUEST
            )

        payment, message = _confirm(payment, payment.authority)
        payload = _order_payload(payment)
        if payment.status != PAYMENT_PAID:
            # `detail` is the key the API client surfaces to the user.
            payload["detail"] = message
        return Response(payload)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _display_name(user) -> str:
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.get_username() or user.email


def _phone(user) -> str:
    try:
        return (user.profile.phone or "").strip()
    except UserProfile.DoesNotExist:
        return ""


def _callback_url(request) -> str:
    """Public URL the gateway sends the browser back to.

    Behind the CDN the origin sees plain HTTP, so the scheme is taken from
    `PUBLIC_BACKEND_URL` when it is configured (recommended in production)
    and from the incoming request otherwise.
    """
    configured = os.environ.get("PUBLIC_BACKEND_URL", "").strip().rstrip("/")
    if configured:
        return f"{configured}{reverse('billing-callback')}"
    return request.build_absolute_uri(reverse("billing-callback"))


# Hosts that only reach the machine the visitor is already sitting at.
_LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"}


def is_loopback_url(url: str) -> bool:
    """True for a URL that points at the visitor's own machine.

    A relative URL is not loopback: it keeps the buyer on whatever host they
    are already on, which is always reachable.
    """
    host = (urlparse(url or "").hostname or "").lower()
    if not host:
        return False
    return host in _LOOPBACK_HOSTS or host.endswith(".localhost")


def _request_origin(request) -> str:
    """The public origin of an incoming request (`https://dlea.piqagram.ir`)."""
    if request is None:
        return ""
    try:
        return request.build_absolute_uri("/").rstrip("/")
    except Exception:  # a request without host info (or a stub in tests)
        return ""


def _frontend_url(request=None) -> str:
    """Where the buyer's browser is sent after the gateway answers.

    `FRONTEND_URL` is the explicit answer. Without it the first *public* CORS
    origin is used, then the host this request arrived on. Falling back to
    `http://localhost:5173` is deliberately last (and only in DEBUG): that is a
    development origin, so in production it sends every real buyer to their own
    machine — an empty string means a relative redirect, which stays on the
    host they are actually using.
    """
    configured = os.environ.get("FRONTEND_URL", "").strip().rstrip("/")
    if configured:
        return configured

    origins = [
        o.strip().rstrip("/") for o in getattr(settings, "CORS_ALLOWED_ORIGINS", []) if o.strip()
    ]
    public = [o for o in origins if not is_loopback_url(o)]
    if public:
        return public[0]
    if settings.DEBUG:
        return origins[0] if origins else "http://localhost:5173"

    origin = _request_origin(request)
    if origin and not is_loopback_url(origin):
        return origin
    return ""


def _to_billing(state: str, payment=None, reason: str = "", request=None):
    # urlencode, not f-strings: `reason` is Persian prose and a raw string in
    # a Location header is neither valid nor encodable.
    params = {"status": state}
    if payment is not None:
        params["order"] = payment.pk
        if payment.reference_id:
            params["ref"] = payment.reference_id
    if reason:
        params["reason"] = reason
    return redirect(f"{_frontend_url(request)}/app/billing?{urlencode(params)}")


def _find_order(order_id, track_id):
    """Locate the order by our own id first, then by the gateway session id."""
    pk = _int_or_none(order_id)
    if pk is not None:
        payment = Payment.objects.filter(pk=pk).first()
        if payment is not None:
            return payment
    if track_id:
        return Payment.objects.filter(authority=str(track_id)).first()
    return None


def _own_order(user, pk):
    return Payment.objects.filter(pk=pk, account=user).first()


def _int_or_none(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _confirm(payment: Payment, track_id) -> tuple[Payment, str]:
    """Ask the gateway whether this session was really paid.

    Returns the (possibly updated) order plus a Persian message for the
    failure case. Only a verified payment with the expected amount settles.
    """
    try:
        answer = payments.verify_payment(track_id or payment.authority)
    except payments.GatewayError as exc:
        return payment, str(exc)

    result = payments.as_int(answer.get("result"), default=-1)
    payment.raw_response = {**(payment.raw_response or {}), "verify": answer}
    settled = result in (payments.RESULT_OK, payments.RESULT_ALREADY_VERIFIED)

    if settled:
        verified_rial = payments.as_int(answer.get("amount"), default=0)
        if verified_rial and verified_rial != payment.amount_rial:
            payment.status = PAYMENT_FAILED
            payment.save(update_fields=["status", "raw_response"])
            return payment, "مبلغ تأییدشده در درگاه با مبلغ سفارش هم‌خوانی ندارد"

    if not settled:
        payment.status = PAYMENT_FAILED
        payment.save(update_fields=["status", "raw_response"])
        return payment, payments.describe_result(result, answer.get("message"))

    _settle(payment, answer)
    return payment, ""


def _settle(payment: Payment, answer: dict):
    """Mark the order paid, store the tracking code and unlock the plan."""
    payment.status = PAYMENT_PAID
    payment.reference_id = str(
        answer.get("refNumber") or answer.get("trackId") or payment.authority or payment.pk
    )
    payment.card_number = str(answer.get("cardNumber") or "")
    payment.paid_at = _parse_datetime(answer.get("paidAt")) or timezone.now()
    payment.save(
        update_fields=["status", "reference_id", "card_number", "paid_at", "raw_response"]
    )
    activate_subscription(payment)


def _parse_datetime(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def activate_subscription(payment: Payment):
    """Give the buyer what they paid for.

    One row per user, updated in place: the billing page reads
    `subscription/`[0], so leaving an older row behind would keep showing
    the previous plan. Renewing the same plan extends the running period
    (nobody loses days by paying early); a different plan starts now.
    """
    user = payment.account
    if user is None:
        return None

    days = CYCLE_DAYS.get(payment.cycle, CYCLE_DAYS["monthly"])
    today = timezone.localdate()
    plan = Plan.objects.filter(slug=payment.plan_slug).first() or find_plan(payment.plan)
    plan_name = plan.name if plan else payment.plan

    current = Subscription.objects.filter(user=user).order_by("id").first()
    renewing = (
        current is not None
        and current.plan == plan_name
        and current.end_date is not None
        and current.end_date >= today
    )
    if renewing:
        start = current.start_date or today
        total_days = (current.total_days or 0) + days
        end = current.end_date + timedelta(days=days)
    else:
        start = today
        total_days = days
        end = today + timedelta(days=days)

    subscription = current or Subscription(user=user)
    subscription.plan = plan_name
    subscription.start_date = start
    subscription.end_date = end
    subscription.total_days = total_days
    subscription.days_left = max(0, (end - today).days)
    subscription.price = f"{payment.amount} / {'سالانه' if payment.cycle == 'yearly' else 'ماهانه'}"
    subscription.save()

    # The profile mirrors the subscription so admin tables and any gate that
    # reads the profile agree with what was just bought.
    profile, _created = UserProfile.objects.get_or_create(user=user)
    profile.plan = plan_name
    profile.save(update_fields=["plan", "updated_at"])
    return subscription


def _order_payload(payment: Payment) -> dict:
    return {
        "id": payment.pk,
        "plan": payment.plan,
        "planSlug": payment.plan_slug,
        "cycle": payment.cycle,
        "amount": payment.amount,
        "amountRial": payment.amount_rial,
        "status": payment.status,
        "referenceId": payment.reference_id,
        "cardNumber": payment.card_number,
        "paidAt": payment.paid_at.isoformat() if payment.paid_at else None,
        "payUrl": payments.payment_url(payment.authority) if payment.authority and payment.status == PAYMENT_PENDING else None,
    }
