"""Gemini-powered AI coach.

Generates a real coach report for a scope (daily / weekly / monthly / yearly)
from the trades actually stored in the database. The qualitative analysis
(summary, weaknesses, strengths, highlights, action plan) is written by Google
Gemini via the REST API; the numeric stats (net, win rate, profit factor,
scores) are always computed server-side so the numbers stay truthful.

The API key is read from the ``GEMINI_API_KEY`` environment variable, or from
``backend/.env`` (a plain ``KEY=VALUE`` file) when the env var is not set.
"""

from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any

import jdatetime

from . import jutils

DEFAULT_MODEL = "gemini-3.6-flash"

# Gemini models offered in the coach model selector when a key is set.
GEMINI_MODELS = [
    {"id": "gemini-3.6-flash", "name": "Gemini 3.6 Flash", "desc": "پیش‌فرض — سریع و قدرتمند"},
    {"id": "gemini-3.5-flash", "name": "Gemini 3.5 Flash", "desc": "تحلیل سریع و مقرون‌به‌صرفه"},
    {"id": "gemini-3.1-flash-lite", "name": "Gemini 3.1 Flash Lite", "desc": "سبک و سریع — مناسب گزارشهای کوتاه"},
]

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Sent as `User-Agent` on every call to Google.
#
# urllib would otherwise advertise itself as `Python-urllib/3.x`, and Cloudflare's
# edge in front of a `*.workers.dev` relay answers that signature with
# `403 error code: 1010` *before* the worker ever runs. That reads like a broken
# relay, or a bad key, while the relay is in fact healthy — so name the client.
GEMINI_USER_AGENT = "dlea-coach/1.0"

# How long the whole call may take, across *every* configured route together.
#
# This is deliberately one budget and not one timeout per attempt. nginx sits in
# front of gunicorn (`proxy_read_timeout` in deploy/nginx-dlea.conf) and answers
# 504 the moment it expires, so waiting 120s on relay 1 and 120s more on relay 2
# guarantees a gateway timeout: the user never sees the error message that says
# which route failed, and the relay that would have answered is never reached.
#
# Keep this comfortably below nginx's read timeout (120s) and gunicorn's
# `--timeout` (120s) so the app is always the one that answers.
GEMINI_CALL_BUDGET_SECONDS = 75.0

SEVERITIES = ("بحرانی", "مهم", "قابل بهبود")

WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]


# ---------------------------------------------------------------------------
# Key handling
# ---------------------------------------------------------------------------

def _load_dotenv() -> None:
    """Load backend/.env (KEY=VALUE lines) into os.environ if present."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


def get_api_key() -> str:
    _load_dotenv()
    return os.environ.get("GEMINI_API_KEY", "").strip()


def proxy_bases() -> list:
    """Every configured relay, in order of preference.

    `GEMINI_PROXY` takes one base or several separated by commas/whitespace: a
    sleeping or blocked relay should not take the whole coach down while a
    second one still answers.
    """
    raw = os.environ.get("GEMINI_PROXY", "").replace(",", " ")
    return [chunk.strip().rstrip("/") for chunk in raw.split() if chunk.strip()]


def gemini_url(path: str, base: str | None = None) -> str:
    """Absolute Google URL for ``path``, routed through ``GEMINI_PROXY`` if set.

    The relay is a URL-prefix forwarder — the whole Google URL travels as the
    path after the proxy base — not an HTTP CONNECT proxy. So ``GEMINI_PROXY``
    must be an ``http(s)://host:port`` base that accepts that shape; a plain
    forward proxy will answer 404/502 instead of relaying. (On nginx, put
    ``merge_slashes off;`` in the server block, otherwise the ``//`` inside the
    forwarded URL collapses and Google answers with an HTML 403 page.)
    """
    url = f"{GEMINI_API_BASE}/{path.lstrip('/')}"
    if base is not None:
        return f"{base.rstrip('/')}/{url}"
    bases = proxy_bases()
    return f"{bases[0]}/{url}" if bases else url


def gemini_candidates(path: str, api_key: str) -> list:
    """``[(label, url)]`` — every configured route to Google, tried in order."""
    tail = f"{GEMINI_API_BASE}/{path.lstrip('/')}"
    bases = proxy_bases()
    if not bases:
        return [("مستقیم", f"{tail}?key={api_key}")]
    single = len(bases) == 1
    return [
        (f"relay {i + 1}" if not single else "relay", f"{base}/{tail}?key={api_key}")
        for i, base in enumerate(bases)
    ]


def gemini_call_budget() -> float:
    """Total seconds ``call_gemini`` may spend across every route.

    Overridable with ``GEMINI_TIMEOUT`` so a deployment behind a slower gateway
    can loosen it without a code change; anything unparseable or non-positive
    falls back to the default rather than disabling the bound.
    """
    try:
        value = float(os.environ.get("GEMINI_TIMEOUT", "").strip())
    except ValueError:
        return GEMINI_CALL_BUDGET_SECONDS
    return value if value > 0 else GEMINI_CALL_BUDGET_SECONDS


def get_model(model: str | None) -> str:
    model = (model or "").strip()
    if not model or model.startswith("coach-"):
        return os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    return model


def _fa_num(raw: str) -> str:
    """`1234.5` → `۱,۲۳۴.۵` (grouped thousands, Persian digits)."""
    raw = raw.strip()
    sign = ""
    if raw.startswith("-"):
        sign, raw = "-", raw[1:]
    try:
        value = float(raw.replace(",", ""))
    except ValueError:
        return raw
    if value.is_integer():
        body = f"{int(value):,}"
    else:
        body = f"{value:,.2f}".rstrip("0").rstrip(".")
    return sign + jutils._fa(body)


# ---------------------------------------------------------------------------
# Period bucketing — derived from the REAL trades in the database
# ---------------------------------------------------------------------------

def _jdate(dt: datetime) -> jdatetime.date:
    return jdatetime.date.fromgregorian(date=dt.date())


def period_for_scope(scope: str, trades) -> dict[str, Any] | None:
    """Return the most recent non-empty bucket of `scope` plus its trades.

    Buckets are Jalali (Persian calendar) — matching how the rest of the app
    displays dates. Daily = one trading day, weekly = (year, month, week#),
    monthly = (year, month), yearly = (year).
    """
    scoped = [t for t in trades if t.close_time is not None]
    if not scoped:
        return None
    scoped.sort(key=lambda t: t.close_time, reverse=True)

    if scope == "daily":
        day = _jdate(scoped[0].close_time)
        picked = [t for t in scoped if _jdate(t.close_time) == day]
        label = jutils.to_jalali_date(day.togregorian())
        range_txt = f"{WEEKDAYS[day.weekday()]} {jutils._fa(str(day.day))} {jutils.month_name_fa(day.togregorian())} {jutils._fa(str(day.year))}"
        key = f"D-{label}"
    elif scope == "weekly":
        first = _jdate(scoped[0].close_time)
        week_no = (first.day - 1) // 7 + 1
        picked = [
            t for t in scoped
            if (lambda d: (d.year, d.month, (d.day - 1) // 7 + 1) == (first.year, first.month, week_no))(_jdate(t.close_time))
        ]
        days = sorted({_jdate(t.close_time) for t in picked})
        label = f"هفته {jutils._fa(str(week_no))} {jutils.month_name_fa(first.togregorian())}"
        range_txt = f"{jutils.to_jalali_date(days[0].togregorian())} تا {jutils.to_jalali_date(days[-1].togregorian())}"
        key = f"W-{jutils._fa(str(first.year))}-{jutils._fa(str(first.month))}-{jutils._fa(str(week_no))}"
    elif scope == "monthly":
        first = _jdate(scoped[0].close_time)
        picked = [t for t in scoped if (lambda d: (d.year, d.month) == (first.year, first.month))(_jdate(t.close_time))]
        label = jutils.month_label(first.togregorian())
        range_txt = f"{jutils._fa(f'{first.year:04d}/{first.month:02d}/01')} تا {jutils._fa(f'{first.year:04d}/{first.month:02d}/30')}"
        key = f"M-{jutils._fa(f'{first.year:04d}-{first.month:02d}')}"
    else:  # yearly
        first = _jdate(scoped[0].close_time)
        picked = [t for t in scoped if _jdate(t.close_time).year == first.year]
        label = f"سال {jutils._fa(str(first.year))}"
        months = {jutils.month_name_fa(_jdate(t.close_time).togregorian()) for t in picked}
        ordered = [m for m in (
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند") if m in months]
        range_txt = f"{ordered[0]} تا {ordered[-1]} {jutils._fa(str(first.year))}" if ordered else label
        key = f"Y-{jutils._fa(str(first.year))}"

    return {"scope": scope, "label": label, "range": range_txt, "key": key, "trades": picked}


# ---------------------------------------------------------------------------
# Real statistics
# ---------------------------------------------------------------------------

def compute_stats(trades) -> dict[str, Any]:
    count = len(trades)
    pnls = [float(t.pnl) for t in trades]
    net = sum(pnls)
    winners = [p for p in pnls if p > 0]
    losers = [p for p in pnls if p < 0]
    win_rate = round(len(winners) / count * 100, 1) if count else 0.0
    profit_factor = (
        round(sum(winners) / abs(sum(losers)), 2) if losers and sum(losers) != 0 else (round(sum(winners), 2) if winners else 0.0)
    )
    followed = [t for t in trades if t.followed_plan]
    avg_rr = round(sum(float(t.rr or 0) for t in trades) / count, 2) if count else 0.0

    # Simple equity curve from closes (sorted oldest → newest) for max drawdown.
    ordered = sorted(trades, key=lambda t: t.close_time)
    balance, peak, max_dd = 0.0, 0.0, 0.0
    for t in ordered:
        balance += float(t.pnl)
        peak = max(peak, balance)
        if peak:
            max_dd = max(max_dd, (peak - balance) / peak * 100)
    max_dd = round(max_dd, 1)

    by_symbol: dict[str, float] = {}
    for t in trades:
        by_symbol[t.symbol] = by_symbol.get(t.symbol, 0.0) + float(t.pnl)
    best_sym = max(by_symbol, key=by_symbol.get) if by_symbol else "—"
    worst_sym = min(by_symbol, key=by_symbol.get) if by_symbol else "—"

    emotions: dict[str, int] = {}
    for t in trades:
        e = (t.emotion or "").strip() or "آرام"
        emotions[e] = emotions.get(e, 0) + 1
    top_emotion = max(emotions, key=emotions.get) if emotions else "آرام"

    return {
        "count": count,
        "net": net,
        "winRate": win_rate,
        "profitFactor": profit_factor,
        "avgRr": avg_rr,
        "maxDrawdown": max_dd,
        "bestSymbol": best_sym,
        "worstSymbol": worst_sym,
        "planAdherence": round(len(followed) / count * 100, 1) if count else 0.0,
        "topEmotion": top_emotion,
    }


# ---------------------------------------------------------------------------
# Prompt + Gemini call
# ---------------------------------------------------------------------------

def build_prompt(scope: str, period: dict[str, Any], stats: dict[str, Any], trades) -> str:
    fa_scope = {"daily": "روزانه", "weekly": "هفتگی", "monthly": "ماهانه", "yearly": "سالانه"}[scope]
    trade_lines = []
    for t in trades[:40]:
        emo = (t.emotion or "آرام").strip()
        plan = "بله" if t.followed_plan else "خیر"
        trade_lines.append(
            f"- {t.symbol} | {'خرید' if t.side == 'buy' else 'فروش'} | حجم {float(t.volume):g} | "
            f"سود {float(t.pnl):+.2f}$ | R:R {float(t.rr):.2f} | پایبندی به پلن: {plan} | احساس: {emo}"
        )
    trades_txt = "\n".join(trade_lines) if trade_lines else "— (هیچ معامله‌ای ثبت نشده)"

    return f"""تو یک مربی حرفه‌ای معامله‌گری (تریدر کوچ) هستی. گزارش {fa_scope} یک معامله‌گر را از روی داده‌های واقعی او می‌نویسی.

بازه: {period['label']} ({period['range']})
تعداد معاملات: {stats['count']}
سود خالص: {stats['net']:+.2f} دلار
Win Rate: {stats['winRate']}٪
Profit Factor: {stats['profitFactor']}
میانگین R:R: {stats['avgRr']}
حداکثر دراودان: {stats['maxDrawdown']}٪
بهترین نماد: {stats['bestSymbol']} | بدترین نماد: {stats['worstSymbol']}
پایبندی به پلن: {stats['planAdherence']}٪
احساس غالب: {stats['topEmotion']}

معاملات این بازه:
{trades_txt}

خروجی را دقیقاً به شکل یک JSON معتبر (بدون متن اضافه، بدون markdown) بنویس با این ساختار:
{{
  "summary": "خلاصه ۳ تا ۵ جمله‌ای از عملکرد این بازه، صادقانه و بر اساس داده‌ها",
  "scores": [
    {{"label": "نظم معاملاتی", "value": عدد ۰ تا ۱۰۰}},
    {{"label": "مدیریت سرمایه", "value": عدد ۰ تا ۱۰۰}},
    {{"label": "روانشناسی", "value": عدد ۰ تا ۱۰۰}},
    {{"label": "پایبندی به پلن", "value": عدد ۰ تا ۱۰۰}}
  ],
  "weaknesses": [
    {{"title": "عنوان ضعف", "impact": "اثر آن روی حساب", "severity": "بحرانی یا مهم یا قابل بهبود", "solution": "راهکار عملی", "steps": ["قدم ۱", "قدم ۲", "قدم ۳"]}}
  ],
  "strengths": [
    {{"title": "عنوان نقطه قوت", "keepDoing": "چه چیزی را ادامه دهد"}}
  ],
  "highlights": ["نکته کلیدی ۱", "نکته کلیدی ۲", "نکته کلیدی ۳"],
  "actionPlan": ["اقدام ۱", "اقدام ۲", "اقدام ۳"]
}}

قوانین:
- همه متن‌ها فارسی، طبیعی و مستقیم (مثل یک مربی واقعی) باشند.
- ۲ تا ۳ ضعف با شدت‌بندی درست (بحرانی = ضرر مالی واقعی یا تکرارشونده، مهم = تأثیر محسوس، قابل بهبود = عادت‌های جزئی).
- هر ضعف دقیقاً ۳ قدم عملی و مشخص داشته باشد.
- هیچ عددی را جعل نکن؛ فقط از داده‌های همین بازه استفاده کن. اعداد را در summary به صورت فارسی بنویس (مثلاً «+۵۸۸ دلار»)."""


def _is_html(body: str) -> bool:
    text = (body or "").lstrip()
    return text.startswith("<") or "<html" in text.lower()


def _is_timeout(body: str) -> bool:
    lowered = (body or "").lower()
    return "timed out" in lowered or "timeout" in lowered


def _is_ua_block(body: str) -> bool:
    """Cloudflare refused the caller's *signature* before any relay logic ran.

    `error code: 1010` is Cloudflare's browser-integrity ban, and it is about the
    ``User-Agent`` the caller sent — not the relay, the key, or the model. Give it
    its own case: the generic 403 wording sends you hunting on the wrong server.
    """
    lowered = (body or "").lower()
    return "error code: 1010" in lowered or ("cloudflare" in lowered and "1010" in lowered)


def _explain_http_error(status: int, body: str) -> str:
    """Name the fix instead of dumping Google's HTML page at the user.

    A 403 that carries an HTML page means the request never reached the API: it
    is a network/geo block (or a relay forwarding through a blocked IP), not a
    key or model problem. Say so, because the raw page says nothing.
    """
    text = " ".join((body or "").split())
    if status == 0:
        if _is_timeout(text):
            return "مهلت انتظار تمام شد و پاسخی نرسید (relay در دسترس نبود یا آدرسش را فوروارد نمی‌کند)"
        return f"اتصال برقرار نشد — {text[:140] or 'بدون پاسخ'}"
    if _is_ua_block(text):
        return (
            f"HTTP {status} از لبهٔ گیتوی — امضای درخواست (User-Agent) رد شد، نه کلید و نه خود relay؛ "
            "هدر User-Agent درخواست‌های Gemini را عوض کن"
        )
    if _is_html(text) and status in (401, 403):
        return (
            f"HTTP {status} با صفحهٔ HTML گوگل — درخواست هرگز به API نرسید؛ این بلاک شبکه/موقعیت "
            "جغرافیایی است، نه مشکل کلید. روی سرور ایران GEMINI_PROXY را به relay ای بده که از "
            "IP مجاز بیرون برود"
        )
    return f"HTTP {status} — {(text or 'بدون بدنه')[:200]}"


def _worth_another_route(status: int, body: str) -> bool:
    """Whether a second relay could plausibly answer where this one did not."""
    if status == 0:
        return True
    return _is_html(body) and status in (401, 403, 502, 503, 504)


def _no_route_error(attempts: list) -> str:
    if len(attempts) == 1:
        label, detail = attempts[0]
        return f"Gemini ({label}) {detail}"
    joined = " | ".join(f"{label}: {detail}" for label, detail in attempts)
    return f"Gemini: هیچ‌کدام از {len(attempts)} مسیر جواب نداد — {joined}"


def _route_timeout(remaining: float, routes_left: int) -> float:
    """Seconds this route may take, given the budget left and routes still to try.

    Every route gets an equal share of what is left, so one blackholed relay can
    never spend the budget the next relay needs, and a lone route still gets the
    whole budget. ``routes_left`` counts the route being timed.
    """
    if routes_left <= 1:
        return remaining
    return remaining / routes_left


def _post_gemini(url: str, payload: bytes, timeout: float) -> tuple:
    """``(status, body)`` — status 0 means the request never got out."""
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": GEMINI_USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as exc:
        return 0, str(getattr(exc, "reason", exc))
    except (TimeoutError, OSError) as exc:
        # Not every timeout arrives wrapped in URLError, and a timeout that
        # escapes this function would reach the view as a 500 with no hint that
        # the route, not the key, was the problem.
        return 0, f"timed out after {timeout:.0f}s: {exc}"


def call_gemini(prompt: str, model: str) -> str:
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY")
    payload = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
            },
        }
    ).encode("utf-8")

    routes = gemini_candidates(f"models/{model}:generateContent", api_key)
    deadline = time.monotonic() + gemini_call_budget()

    attempts: list[tuple[str, str]] = []
    body: dict | None = None
    for index, (label, url) in enumerate(routes):
        routes_left = len(routes) - index
        remaining = deadline - time.monotonic()
        if remaining <= 1:
            # Out of budget: name the routes we never reached, rather than
            # reporting one failure as if it were the whole story.
            attempts.extend(
                (skipped, "امتحان نشد — مهلت کل درخواست تمام شد") for skipped, _ in routes[index:]
            )
            break
        status, raw = _post_gemini(url, payload, _route_timeout(remaining, routes_left))
        if status == 200:
            body = json.loads(raw)
            break
        attempts.append((label, _explain_http_error(status, raw)))
        if not _worth_another_route(status, raw):
            break
    if body is None:
        raise RuntimeError(_no_route_error(attempts))

    candidates = body.get("candidates") or []
    if not candidates:
        blocked = body.get("promptFeedback", {}).get("blockReason", "empty response")
        raise RuntimeError(f"Gemini returned no candidates ({blocked})")
    parts = candidates[0].get("content", {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
    if not text:
        raise RuntimeError("Gemini returned an empty response")
    return text


# ---------------------------------------------------------------------------
# Normalization + report generation
# ---------------------------------------------------------------------------

def _as_list(value: Any) -> list:
    return value if isinstance(value, list) else []


def normalize_report(raw: dict[str, Any], scope: str, period: dict[str, Any], stats: dict[str, Any]) -> dict[str, Any]:
    """Coerce Gemini's JSON into the CoachPeriod contract, keeping numbers real."""

    def clamp_scores(scores: Any) -> list[dict[str, Any]]:
        labels = ["نظم معاملاتی", "مدیریت سرمایه", "روانشناسی", "پایبندی به پلن"]
        out: list[dict[str, Any]] = []
        for item in _as_list(scores)[:4]:
            if not isinstance(item, dict):
                continue
            try:
                value = max(0, min(100, int(round(float(item.get("value", 0))))))
            except (TypeError, ValueError):
                value = 50
            out.append({"label": str(item.get("label") or labels[len(out)]), "value": value})
        while len(out) < 4:
            out.append({"label": labels[len(out)], "value": 50})
        return out

    def clean_weaknesses(items: Any) -> list[dict[str, Any]]:
        out = []
        for item in _as_list(items)[:3]:
            if not isinstance(item, dict):
                continue
            severity = str(item.get("severity") or "قابل بهبود")
            if severity not in SEVERITIES:
                severity = "قابل بهبود"
            steps = [str(s) for s in _as_list(item.get("steps")) if str(s).strip()][:3] or ["بازبینی قانون مربوطه", "ثبت در ژورنال", "بررسی هفتگی نتیجه"]
            out.append(
                {
                    "title": str(item.get("title") or "ضعف شناسایی‌شده").strip(),
                    "impact": str(item.get("impact") or "اثر روی حساب").strip(),
                    "severity": severity,
                    "solution": str(item.get("solution") or "راهکار عملی").strip(),
                    "steps": steps,
                }
            )
        return out

    def clean_strengths(items: Any) -> list[dict[str, Any]]:
        out = []
        for item in _as_list(items)[:3]:
            if not isinstance(item, dict):
                continue
            out.append(
                {
                    "title": str(item.get("title") or "نقطه قوت").strip(),
                    "keepDoing": str(item.get("keepDoing") or "ادامه بده").strip(),
                }
            )
        return out

    net_txt = f"{'+' if stats['net'] >= 0 else ''}{_fa_num(f'{stats['net']:,.0f}')}$"
    win_txt = f"{jutils._fa(f'{stats['winRate']:g}')}٪"

    stats_list = [
        {"label": "تعداد معامله", "value": jutils._fa(str(stats["count"]))},
        {"label": "سود خالص", "value": net_txt},
        {"label": "Win Rate", "value": win_txt},
        {"label": "Profit Factor", "value": jutils._fa(f"{stats['profitFactor']:g}")},
    ]
    if scope in ("weekly", "monthly", "yearly"):
        stats_list += [
            {"label": "بهترین نماد", "value": stats["bestSymbol"]},
            {"label": "بدترین نماد", "value": stats["worstSymbol"]},
        ]
    if scope in ("monthly", "yearly"):
        stats_list += [{"label": "Max Drawdown", "value": f"{jutils._fa(f'{stats['maxDrawdown']:g}')}٪"}]

    summary = str(raw.get("summary") or "").strip()
    if not summary:
        summary = (
            f"{jutils._fa(str(stats['count']))} معامله در این بازه ثبت شد؛ سود خالص {net_txt} "
            f"با Win Rate {win_txt}."
        )

    return {
        "summary": summary,
        "scores": clamp_scores(raw.get("scores")),
        "stats": stats_list,
        "weaknesses": clean_weaknesses(raw.get("weaknesses")),
        "strengths": clean_strengths(raw.get("strengths")),
        "highlights": [str(h).strip() for h in _as_list(raw.get("highlights")) if str(h).strip()][:6],
        "actionPlan": [str(a).strip() for a in _as_list(raw.get("actionPlan")) if str(a).strip()][:5],
    }


def generate_coach_report(scope: str, model: str | None, trades: list | None = None) -> dict[str, Any]:
    """Compute real stats for the newest `scope` bucket, ask Gemini, return the CoachPeriod dict."""
    from .models import Trade

    if trades is None:
        trades = list(Trade.objects.all())
    else:
        trades = list(trades)
    period = period_for_scope(scope, trades)
    if not period:
        raise LookupError(f"no trades in scope {scope}")
    stats = compute_stats(period["trades"])

    model = get_model(model)
    prompt = build_prompt(scope, period, stats, period["trades"])
    text = call_gemini(prompt, model)
    raw = json.loads(text) if isinstance(text, str) else text
    if not isinstance(raw, dict):
        raise RuntimeError("Gemini did not return a JSON object")

    report = normalize_report(raw, scope, period, stats)
    report.update(
        {
            "id": f"AI-{period['key']}",
            "scope": scope,
            "label": period["label"],
            "range": period["range"],
            "net": report["stats"][1]["value"] if len(report["stats"]) > 1 else f"{stats['net']:+.0f}$",
            "winRate": report["stats"][2]["value"] if len(report["stats"]) > 2 else f"{stats['winRate']:g}٪",
        }
    )
    return report


def gemini_models() -> list[dict[str, str]]:
    """Model list for the UI: real Gemini models when a key is set, else seeded."""
    if get_api_key():
        return GEMINI_MODELS
    return []
