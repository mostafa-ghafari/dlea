"""MetaTrader integration views.

Two pieces make the MT4/MT5 sync real:

1. POST /api/mt/connect/   (JWT auth) — saves the connection settings and
   issues a stable webhook token for the user. The token is what the EA
   embeds in its configuration, so it stays the same across reconnects.

2. POST /api/trades/webhook/  (token auth) — called by the MQL4/MQL5 EA
   when a position closes. It validates the trades with the regular
   TradeSerializer and stores them under the user + portfolio tied to the
   connection.
"""

import json
import secrets

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import MTConnection, Trade
from .serializers import TradeSerializer


def _json_body(request):
    try:
        body = request.body
        if isinstance(body, bytes):
            # MetaTrader's StringToCharArray appends a trailing '\0'; strip it
            # and any surrounding whitespace before parsing.
            body = body.rstrip(b"\x00 \t\r\n").decode("utf-8")
        return json.loads(body)
    except (json.JSONDecodeError, ValueError, UnicodeDecodeError):
        return None


def _webhook_url(request):
    """Absolute webhook URL, with localhost rewritten to 127.0.0.1.

    MetaTrader's WebRequest cannot resolve `localhost`, so the URL we show
    the user (and that the EA embeds) must use 127.0.0.1 for local setups.
    """
    host = request.get_host()
    if "localhost" in host:
        host = host.replace("localhost", "127.0.0.1", 1)
    scheme = "https" if request.is_secure() else "http"
    return f"{scheme}://{host}/api/trades/webhook/"


def _normalize_mt_datetime(value):
    """Convert MetaTrader '2026.08.19 19:28' to ISO '2026-08-19T19:28:00'."""
    if not isinstance(value, str) or not value.strip():
        return None
    v = value.strip()
    if "T" in v:  # already ISO-ish
        return v
    v = v.replace(".", "-").replace(" ", "T", 1)
    if len(v) == 16:  # YYYY-MM-DDTHH:MM -> add seconds
        v += ":00"
    return v


# ---------------------------------------------------------------------------
# Connect (frontend, JWT auth)
# ---------------------------------------------------------------------------
class MtConnectView(APIView):
    """Save MT connection settings and (re)issue the webhook token."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        body = request.data
        if not isinstance(body, dict):
            return Response({"error": "داده نامعتبر"}, status=400)

        account = str(body.get("account", "")).strip()
        if not account:
            return Response({"error": "شماره حساب الزامی است"}, status=400)

        conn, created = MTConnection.objects.get_or_create(
            user=request.user,
            defaults={"token": secrets.token_hex(24)},
        )
        conn.broker = str(body.get("broker", "")).strip()
        conn.server = str(body.get("server", "")).strip()
        conn.account = account
        platform = body.get("platform", "mt5")
        conn.platform = platform if platform in ("mt4", "mt5") else "mt5"

        portfolio_id = body.get("portfolioId")
        if portfolio_id:
            from .models import Portfolio

            pf = Portfolio.objects.filter(pk=portfolio_id, user=request.user).first()
            if pf:
                conn.portfolio = pf

        conn.save()

        webhook_url = _webhook_url(request)
        return Response({
            "connected": True,
            "token": conn.token,
            "webhookUrl": webhook_url,
            "account": conn.account,
            "server": conn.server,
            "broker": conn.broker,
            "platform": conn.platform,
            "portfolioId": str(conn.portfolio_id) if conn.portfolio_id else None,
        })


class MtStatusView(APIView):
    """Return the saved connection (for GET on the settings page)."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conn = MTConnection.objects.filter(user=request.user).first()
        if not conn:
            return Response({"connected": False})
        return Response({
            "connected": True,
            "token": conn.token,
            "webhookUrl": _webhook_url(request),
            "account": conn.account,
            "server": conn.server,
            "broker": conn.broker,
            "platform": conn.platform,
            "portfolioId": str(conn.portfolio_id) if conn.portfolio_id else None,
        })


# ---------------------------------------------------------------------------
# Webhook (EA, token auth)
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def trades_webhook(request):
    """Receive closed trades pushed by the MetaTrader EA.

    Body: {"token": "<webhook token>", "trades": [{...TradeInput...}]}
    The EA's WebRequest URL includes the token and the portfolio is taken
    from the saved connection.
    """
    body = _json_body(request)
    if not body or not isinstance(body, dict):
        return JsonResponse({"error": "داده نامعتبر"}, status=400)

    token = str(body.get("token", "")).strip()
    conn = MTConnection.objects.filter(token=token).select_related("user").first()
    if not conn:
        return JsonResponse({"error": "توکن نامعتبر است — از تنظیمات متاتریدر توکن جدید بگیرید"}, status=401)

    items = body.get("trades")
    if not isinstance(items, list) or not items:
        return JsonResponse({"error": "لیست معاملات خالی است"}, status=400)

    portfolio = conn.portfolio
    if not portfolio:
        return JsonResponse(
            {"error": "برای این اتصال پرتفولیوی مقصد مشخص نشده است — در تنظیمات انتخاب کنید"},
            status=400,
        )

    created = 0
    errors = []
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append({"index": idx, "detail": "trade must be an object"})
            continue
        item = dict(item)
        item["portfolio_id"] = portfolio.pk
        # MetaTrader EAs don't always provide SL/TP/pips — default them.
        item.setdefault("sl", 0)
        item.setdefault("tp", 0)
        item.setdefault("pips", 0)
        # Normalize MetaTrader datetime format to ISO 8601.
        for field in ("open_time", "close_time"):
            if item.get(field):
                item[field] = _normalize_mt_datetime(item[field])
        ser = TradeSerializer(data=item)
        if not ser.is_valid():
            errors.append({"index": idx, "detail": ser.errors})
            continue
        try:
            ser.save()
            created += 1
        except Exception as exc:
            errors.append({"index": idx, "detail": str(exc)})

    payload = {"created": created, "total": len(items)}
    if errors:
        payload["errors"] = errors[:10]
        # Debug: persist the exact validation errors so they can be diagnosed.
        try:
            with open("webhook_debug.log", "a", encoding="utf-8") as fh:
                fh.write(json.dumps({"errors": errors[:3], "sample": items[:1]}, ensure_ascii=False, default=str) + "\n")
        except OSError:
            pass
    return JsonResponse(payload, status=201 if created else 400)
