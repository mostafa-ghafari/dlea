#!/usr/bin/env python
"""Smoke-test the Gemini path of a running Dlea backend.

Answers one question honestly: *can this host reach Gemini right now, and if not,
which link is broken?* Nothing is written anywhere and no report is saved; the
only side effect is a couple of tiny real requests, one of them a real
`call_gemini` generation.

What it checks, in order:

  1. configuration  the key/model the app actually loads, plus every proxy
                    variable in the environment that could silently reroute
                    traffic (they hit the payment path too)
  2. direct path    how Google answers without the relay: JSON location block,
                    TCP/TLS blackhole, or the generic HTML error page
  3. relay path     `GEMINI_PROXY` answers, and does it return Google's real
                    answer instead of faking one. Several bases may be
                    comma-separated; each is probed and reported separately
  4. generation     one real `api.gemini.call_gemini()` call — the exact function
                    the coach uses. **This is the verdict.**
  5. live API       optional (`--site`): POST /api/coach/generate/ on the
                    deployed server, which proves *the app process* can reach
                    Gemini, not just this shell

Steps 2 and 3 are deliberately advisory, because the cheap probes do not always
survive the trip: from an Iranian IP Google answers `GET /v1beta/models` with a
generic `403` *HTML* page ("Your client does not have permission to get URL
/v1beta/models") while `:generateContent` on the same key and IP works fine. So
only a real generation decides, and the failures that stay fatal here are the
ones that cannot be right by accident:

  * generation fails + no direct path + no relay → nothing can reach Gemini
  * a relay that answers 200 for an obviously invalid key → it fakes results
  * `GEMINI_API_KEY` missing or still the placeholder

Run it with the backend's own Python, from the backend directory:

    .venv/bin/python ../deploy/smoke_gemini.py

`deploy/smoke-gemini.sh` does that for you (and finds the backend itself, which
matters when this file is uploaded to /tmp to run on the server). Exit code is 0
only when nothing FAILED.

`--timeout` bounds the cheap probes only: step 4 calls `call_gemini`, which keeps
its own 120-second timeout, so a black-holed network can make that step slow.
"""

import argparse
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def _find_backend():
    """The directory that holds `config/settings.py`.

    This file lives in the repo as `deploy/smoke_gemini.py` and is also copied to
    `/tmp` to run on the server, so its own location says nothing: the
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

try:
    from api import gemini  # noqa: E402
except ImportError as exc:  # a release from before the AI coach
    print(f"The Gemini module is missing from {BACKEND_DIR}/api ({exc}).", file=sys.stderr)
    print(
        "This host runs a backend from before the AI coach: deploy first, then\n"
        "run the smoke test.",
        file=sys.stderr,
    )
    sys.exit(2)

CONSIDERED = {"passed": 0, "failed": 0, "warned": 0, "skipped": 0}

# Filled in by the steps so a later step can explain an earlier one.
STATE = {"direct": "", "relay": "", "generate": False, "models": []}

# urllib applies these from the environment automatically — including inside
# `payments._post`, whose gateway calls would then leave from the proxy's IP.
ENV_PROXY_VARS = ("http_proxy", "https_proxy", "all_proxy")

# The relay and the direct probe must both be reached *without* picking up an
# environment proxy, otherwise the test measures the wrong route.
NO_ENV_PROXY = urllib.request.build_opener(urllib.request.ProxyHandler({}))

GOOGLE_HOST = "generativelanguage.googleapis.com"


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
# small helpers
# ---------------------------------------------------------------------------


def mask_secret(value: str) -> str:
    """Enough of a key to recognise it, not enough to use it."""
    raw = (value or "").strip()
    if len(raw) <= 10:
        return "*" * len(raw)
    return f"{raw[:6]}…{raw[-2:]} ({len(raw)} کاراکتر)"


def mask_url(url: str) -> str:
    """Hide `user:pass@` in a proxy URL before printing it."""
    parts = urllib.parse.urlsplit(url or "")
    if "@" not in parts.netloc:
        return url or ""
    host = parts.netloc.rsplit("@", 1)[1]
    return urllib.parse.urlunsplit((parts.scheme, f"***@{host}", parts.path, parts.query, ""))


def body_hint(body: str, limit: int = 160) -> str:
    text = " ".join((body or "").split())
    return text[:limit] + ("…" if len(text) > limit else "")


def _reason(exc) -> str:
    reason = getattr(exc, "reason", exc)
    text = str(reason)
    if "CERTIFICATE_VERIFY_FAILED" in text:
        return f"گواهی TLS پذیرفته نشد ({body_hint(text, 60)}) — relay باید گواهی معتبر داشته باشد"
    if isinstance(reason, socket.timeout) or "timed out" in text:
        return "timeout — پاسخی نرسید"
    return body_hint(text, 120)


def http(method: str, url: str, payload=None, token: str = "", host: str = "", timeout: int = 30):
    """(status, body) — status 0 means the request never got out."""
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
        with NO_ENV_PROXY.open(request, timeout=timeout) as response:
            return response.status, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")
    except urllib.error.URLError as exc:
        return 0, _reason(exc)
    except (TimeoutError, OSError) as exc:
        return 0, _reason(exc)


def google_says(body: str) -> str:
    """What this answer is, judged from the body itself.

    Only JSON is ever a real API answer; `html` is Google's generic error page
    (or a middlebox imitating it), which says nothing about the key or the model.
    """
    text = (body or "").strip()
    if not text:
        return "other"
    if text.startswith("<") or "<html" in text.lower():
        return "html"
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return "other"
    if not isinstance(payload, dict):
        return "other"
    error = payload.get("error") if isinstance(payload.get("error"), dict) else {}
    blobs = " ".join(str(v) for v in (payload.get("error"), payload.get("message")) if v).lower()
    status = str(error.get("status") or "").lower()
    blob = f"{blobs} {body_hint(text, 400)}".lower()
    if "location is not supported" in blob or "user location" in blob or status == "failed_precondition":
        return "blocked"
    if "api_key_invalid" in blob or "api key not valid" in blob or status == "unauthenticated":
        return "bad-key"
    if "resource_exhausted" in blob or status == "resource_exhausted":
        return "quota"
    if "not_found" in blob or status == "not_found" or "is not found" in blob:
        return "bad-model"
    if status == "permission_denied" or "permission_denied" in blob:
        return "permission"
    return "other"


def model_names(body: str) -> list:
    """`{"models": [{"name": "models/x"}]}` → `["x", …]`."""
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return []
    models = payload.get("models") if isinstance(payload, dict) else None
    names = []
    for item in models or []:
        if isinstance(item, dict):
            name = str(item.get("name") or "").split("/")[-1]
            if name:
                names.append(name)
    return names


# ---------------------------------------------------------------------------
# steps
# ---------------------------------------------------------------------------


def step_config() -> dict:
    """Report what the app loads and return the values the other steps need."""
    section("1. Configuration (backend/.env, i.e. what the app loads)")
    env_file = BACKEND_DIR / ".env"
    if env_file.is_file():
        info(".env", f"{env_file} خوانده می‌شود")
    else:
        info(".env", f"{env_file} نیست — فقط environment variable ها اثر دارند")

    gemini._load_dotenv()  # the same loader call_gemini goes through
    api_key = gemini.get_api_key()
    if api_key:
        if api_key.startswith(("your_", "<")):
            fail("GEMINI_API_KEY", f"{mask_secret(api_key)} — هنوز جای‌نگهدار قالب است، کلید واقعی نیست")
        else:
            ok("GEMINI_API_KEY", mask_secret(api_key))
    else:
        fail(
            "GEMINI_API_KEY",
            "ست نشده — POST /api/coach/generate/ با ۴۰۰ «کلید Gemini تنظیم نشده است» رد می‌شود",
        )

    model = gemini.get_model(None)
    source = "GEMINI_MODEL" if os.environ.get("GEMINI_MODEL", "").strip() else "پیش‌فرض کد"
    info("model", f"{model} ({source})")
    ui_ids = [m["id"] for m in gemini.GEMINI_MODELS]
    if model in ui_ids:
        ok("مدل پیش‌فرض در لیست UI", f"{len(ui_ids)} مدل انتخابی: {', '.join(ui_ids)}")
    else:
        warn(
            "مدل پیش‌فرض در لیست UI نیست",
            f"{model} بین {', '.join(ui_ids)} نیست — انتخابی‌های صفحه با گزارش‌های پیش‌فرض یکی نیستند",
        )

    proxies = gemini.proxy_bases()
    bad = [p for p in proxies if not p.startswith(("http://", "https://"))]
    if bad:
        fail(
            "GEMINI_PROXY",
            f"{mask_url(bad[0])} — باید با http:// یا https:// شروع شود، وگرنه آدرس ساخته‌شده "
            f"«{mask_url(bad[0])}/{gemini.GEMINI_API_BASE}/…» هیچ‌وقت باز نمی‌شود",
        )
    elif proxies:
        count = "" if len(proxies) == 1 else f" ({len(proxies)} مسیر، به ترتیب)"
        ok("GEMINI_PROXY" + count, " ، ".join(mask_url(p) for p in proxies))
    else:
        info(
            "GEMINI_PROXY",
            f"خالی است — ترافیک مستقیم به {GOOGLE_HOST} می‌رود؛ بخش ۴ می‌گوید بس است یا نه",
        )

    leaked = sorted({k for k in os.environ if k.lower() in ENV_PROXY_VARS})
    if leaked:
        shown = ", ".join(f"{k}={mask_url(os.environ[k]) or '(خالی)'}" for k in leaked)
        fail(
            "متغیرهای پروکسی محیط",
            f"{shown} — urllib اینها را خودکار اعمال می‌کند، پس درخواست‌های زیبال هم از همین مسیر "
            "بیرون می‌روند و درگاه IP دیگری می‌بیند. برای فیلتر گوگل فقط GEMINI_PROXY را ست کن و "
            "این‌ها را unset کن",
        )
    else:
        ok("متغیرهای پروکسی محیط", "تمیز — هیچ‌کدام از http_proxy / https_proxy / ALL_PROXY ست نیست")

    return {"key": api_key, "model": model, "proxy": proxies[0] if proxies else "", "proxies": proxies}


def _diagnose_probe(label: str, status: int, body: str, elapsed: float) -> None:
    """One line about a cheap probe — never fatal, only informative."""
    verdict = google_says(body)
    if status == 200:
        names = model_names(body)
        STATE["models"] = names or STATE["models"]
        ok(label, f"200 در {elapsed:.1f}s" + (f" — {len(names)} مدل" if names else ""))
    elif status == 0:
        info(label, f"به گوگل نرسید در {elapsed:.1f}s — {body}")
    elif verdict == "html":
        info(
            label,
            f"کد {status} در {elapsed:.1f}s — صفحهٔ خطای HTML گوگل (نه پاسخ API)؛ روی IP ایران رایج است "
            "و از آن نمی‌توان حکم گرفت",
        )
    elif verdict == "blocked":
        info(label, f"کد {status} در {elapsed:.1f}s — گوگل از این IP جواب نمی‌دهد (بلاک/تحریم)")
    elif verdict == "bad-key":
        warn(label, f"کد {status} — گوگل کلید را رد کرد؛ بخش ۴ قطعی می‌گوید: {body_hint(body)}")
    elif verdict == "quota":
        warn(label, f"کد {status} — سهمیهٔ کلید تمام شده: {body_hint(body)}")
    else:
        info(label, f"کد {status} در {elapsed:.1f}s — {body_hint(body)}")


def step_direct(api_key: str, timeout: int) -> None:
    section("2. Direct path (no relay, environment proxies bypassed)")
    try:
        infos = socket.getaddrinfo(GOOGLE_HOST, 443, proto=socket.IPPROTO_TCP)
        ips = sorted({entry[4][0] for entry in infos})
        info("DNS", ", ".join(ips))
        STATE["direct"] = "dns-ok"
    except OSError as exc:
        warn("DNS", f"{GOOGLE_HOST} حل نشد: {exc} — فیلتر در سطح DNS")
        STATE["direct"] = "dns"
        return

    started = time.time()
    status, body = http("GET", f"{gemini.GEMINI_API_BASE}/models?key={api_key}", timeout=timeout)
    elapsed = time.time() - started
    _diagnose_probe("GET /v1beta/models (بدون relay)", status, body, elapsed)
    verdict = google_says(body)
    if status == 200:
        STATE["direct"] = "ok"
    elif status == 0:
        STATE["direct"] = "network"
    else:
        STATE["direct"] = verdict


def step_relay(api_key: str, proxies: list, model: str, timeout: int) -> None:
    section("3. Relay path (GEMINI_PROXY = the Iran workaround)")
    if not proxies:
        info(
            "مسیر relay",
            "GEMINI_PROXY ست نشده — اگر بخش ۴ سبز باشد نیازی به آن نیست؛ روی سرور ایران معمولاً لازم است",
        )
        return

    working = []
    first_ok = ""
    for index, proxy in enumerate(proxies):
        label = f"relay {index + 1}" if len(proxies) > 1 else "relay"
        info(
            f"شکل {label}",
            f"{mask_url(proxy)}/{gemini.GEMINI_API_BASE}/… (آدرس کامل گوگل به‌عنوان مسیر)",
        )

        status, body = http("GET", f"{proxy}/", timeout=timeout)
        if status == 0:
            warn(f"ریشهٔ {label}", f"به {mask_url(proxy)} نرسید: {body} — پورت بسته یا سرویس خوابیده")
            STATE["relay"] = STATE["relay"] or "unreachable"
            continue
        info(f"ریشهٔ {label}", f"کد {status} — روی HTTP جواب می‌دهد")

        started = time.time()
        status, body = http(
            "GET", f"{gemini.gemini_url('models', proxy)}?key={api_key}", timeout=timeout
        )
        elapsed = time.time() - started
        _diagnose_probe(f"مدل‌های گوگل از راه {label}", status, body, elapsed)
        verdict = google_says(body)

        if status == 200:
            STATE["relay"] = "ok"
            working.append(label)
            first_ok = first_ok or proxy
            names = STATE["models"]
            if names and model in names:
                ok(f"مدل تنظیم‌شده در لیست گوگل ({label})", model)
            elif names:
                warn(
                    f"مدل تنظیم‌شده در لیست گوگل نیست ({label})",
                    f"{model} بین {len(names)} مدل گوگل نیست → اگر بخش ۴ با ۴۰۴ افتاد، "
                    "GEMINI_MODEL و GEMINI_MODELS را به‌روز کن",
                )
            flash = [n for n in names if "flash" in n]
            if flash:
                info(f"مدل‌های flash موجود ({label})", ", ".join(flash[:10]))
        elif status == 0:
            STATE["relay"] = STATE["relay"] or "unreachable"
        elif status in (404, 405, 502, 503):
            STATE["relay"] = STATE["relay"] or "shape"
            warn(
                f"شکل {label}",
                f"کد {status} — این درگاه «آدرس پیشوندی» را قبول نمی‌کند؛ relay باید مسیر "
                f"{gemini.GEMINI_API_BASE}/… را بگیرد و خودش فوروارد کند (پروکسی CONNECT معمولی کافی نیست): "
                f"{body_hint(body)}",
            )
        else:
            STATE["relay"] = STATE["relay"] or verdict

    if len(proxies) > 1:
        info("relay ها", f"جواب‌دهنده: {', '.join(working) if working else 'هیچ‌کدام'}")

    # A relay that answers *success* for a key that cannot work is not talking to
    # Google at all (cache, stub, or a happily serving middlebox). Silent wrong
    # answers are the one thing a smoke test must never accept.
    if not first_ok:
        return
    status, body = http(
        "GET", f"{gemini.gemini_url('models', first_ok)}?key=AIzaSySMOKE-INVALID", timeout=timeout
    )
    verdict = google_says(body)
    if status == 200:
        fail("پاسخ واقعی گوگل", "با کلید نامعتبر ۲۰۰ برگشت — این relay پاسخ خودش را می‌سازد (کش/جعل)")
    elif verdict == "bad-key":
        ok("پاسخ واقعی گوگل", "کلید نامعتبر → خطای API_KEY_INVALID — relay واقعاً فوروارد می‌کند")
    elif verdict == "blocked":
        info("پاسخ واقعی گوگل", "با کلید نامعتبر هم پیام بلاک آمد — از همین پروب حکمی گرفته نشد")
    else:
        info("پاسخ واقعی گوگل", f"کد {status} — انتظار خطای کلید نامعتبر بود: {body_hint(body)}")


def _try_generation(model: str, prompt: str):
    """(worked, detail) for one real call_gemini round trip."""
    started = time.time()
    try:
        text = gemini.call_gemini(prompt, model)
    except Exception as exc:  # noqa: BLE001 — report whatever the app would raise
        return False, f"{time.time() - started:.1f}s — {body_hint(str(exc), 200)}"

    elapsed = time.time() - started
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return False, f"{elapsed:.1f}s — پاسخ JSON نبود: {body_hint(text, 120)}"
    if not isinstance(payload, dict):
        return False, f"{elapsed:.1f}s — پاسخ JSON یک آبجکت نبود: {body_hint(text, 120)}"
    return True, f"{elapsed:.1f}s — {body_hint(text, 80)}"


def step_generate(model: str, all_models: bool) -> None:
    section("4. Real generation (the exact function the coach uses — the verdict)")
    prompt = 'تنها این JSON را برگردان و هیچ متن دیگری ننویس: {"ok": true, "note": "smoke"}'
    works, detail = _try_generation(model, prompt)
    STATE["generate"] = works
    if works:
        ok(f"call_gemini({model})", detail)
        return

    fail(f"call_gemini({model})", detail)

    lowered = detail.lower()
    others = [m["id"] for m in gemini.GEMINI_MODELS if m["id"] != model]
    model_problem = any(word in lowered for word in ("404", "not found", "not_found", "not supported"))
    if model_problem or all_models:
        info("مدل‌های جایگزین", "خطا مربوط به مدل است — بقیهٔ مدل‌های لیست امتحان می‌شوند")
        for other in others:
            other_ok, other_detail = _try_generation(other, prompt)
            (ok if other_ok else info)(f"call_gemini({other})", other_detail)
            if other_ok:
                break
    else:
        info(
            "مدل‌های جایگزین",
            "امتحان نشد — خطا مربوط به مدل نیست (شبکه، کلید، relay یا سهمیه)",
        )


def step_login(site: str, host: str, email: str, password: str, timeout: int) -> str:
    status, body = http(
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


def step_live(site: str, host: str, token: str, timeout: int) -> None:
    section("5. Live API (the deployed server's own environment)")
    if not site:
        skip(
            "POST /api/coach/generate/",
            "بدون --site — با آن، همین بررسی روی سرورِ واقعی و با env خودِ اپ اجرا می‌شود",
        )
        return

    status, body = http(
        "POST",
        f"{site}/api/coach/generate/",
        payload={"scope": "weekly"},
        token=token,
        host=host,
        timeout=timeout,
    )
    if status == 200:
        ok("POST /api/coach/generate/", "200 — کل مسیر روی سرور زنده کار می‌کند")
    elif status == 0:
        warn("POST /api/coach/generate/", f"به سایت نرسید: {body}")
    elif status == 404:
        fail("POST /api/coach/generate/", "404 — این مسیر روی سرور اجرا نشده (بک‌اند دیپلوی نشده است)")
    elif status == 400 and "کلید Gemini" in body:
        fail(
            "POST /api/coach/generate/",
            f"400 — پروسهٔ اپ کلید را نمی‌بیند، هرچند این شل می‌بیندش: env سوپروایزر با "
            f"backend/.env یکی نیست — {body_hint(body)}",
        )
    elif status in (401, 403):
        warn(
            "POST /api/coach/generate/",
            f"HTTP {status} — با --token یا --email/--password حساب واقعی تست کن: {body_hint(body)}",
        )
    elif status == 400:
        warn(
            "POST /api/coach/generate/",
            f"400 — سرور پاسخ داد ولی به Gemini نرسید (احتمالاً داده‌ای برای بازه نیست): {body_hint(body)}",
        )
    else:
        fail("POST /api/coach/generate/", f"HTTP {status} — {body_hint(body)}")


def step_advice(config: dict) -> None:
    """Turn the facts gathered above into one concrete next move."""
    if STATE["generate"]:
        return
    if not config["proxies"]:
        warn(
            "راه‌حل",
            "مسیر مستقیم جواب نداد و GEMINI_PROXY هم ست نشده — روی سرور ایران یک relay بیرون از "
            "ایران در backend/.env ست کن (نمونه: deploy/gemini-relay-worker.js) و pm2 restart dlea-api",
        )
    elif STATE["relay"] == "unreachable":
        warn(
            "راه‌حل",
            f"هیچ relay ای جواب نداد ({' ، '.join(mask_url(p) for p in config['proxies'])}) — "
            "پورت/فایروال/سرویس آن‌ها را چک کن",
        )
    elif STATE["relay"] == "shape":
        warn(
            "راه‌حل",
            "relay آدرس پیشوندی را فوروارد نمی‌کند — باید مسیر کامل URL گوگل را بگیرد و خودش فوروارد کند",
        )
    elif STATE["direct"] in ("bad-key", "unauthenticated"):
        warn("راه‌حل", "شواهد به GEMINI_API_KEY اشاره می‌کند — کلید را در backend/.env بازبینی کن")
    else:
        warn(
            "راه‌حل",
            "ترافیک جایی بین این سرور و گوگل قطع می‌شود؛ خروجی بخش‌های ۲ و ۳ و متن خطای بالا را بخوان",
        )


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Smoke-test the Dlea Gemini path.")
    parser.add_argument("--site", default="", help="base URL of the running backend (enables step 5)")
    parser.add_argument("--host", default="", help="Host header for nginx routing (needed for loopback sites)")
    parser.add_argument("--token", default="", help="JWT for step 5 (consumes the account's AI quota)")
    parser.add_argument("--email", default="", help="log in as an existing account for step 5")
    parser.add_argument("--password", default="", help="password for --email")
    parser.add_argument(
        "--timeout", type=int, default=30, help="per-probe timeout in seconds (step 4 keeps 120s)"
    )
    parser.add_argument(
        "--all-models",
        action="store_true",
        help="try every model in GEMINI_MODELS, not just the configured one",
    )
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv or sys.argv[1:])
    site = args.site.rstrip("/")
    host = args.host or urllib.parse.urlparse(site).hostname or ""

    print("=" * 70)
    print("Dlea Gemini smoke test")
    print(f"backend: {BACKEND_DIR}")
    print(f"site:    {site or '(بدون بررسی سرور زنده؛ --site بده)'}")
    print(f"probes:  {GOOGLE_HOST} — مستقیم، از راه relay، و یک گزارش واقعی")
    print("=" * 70)

    if host in ("127.0.0.1", "localhost", "::1") and not args.host:
        public = os.environ.get("PUBLIC_BACKEND_URL", "").strip() or "dlea.piqagram.ir"
        host = urllib.parse.urlparse(public).hostname or "dlea.piqagram.ir"
        info("Host header", f"{host} (سایت روی loopback است؛ nginx بر اساس Host مسیردهی می‌کند)")

    config = step_config()
    if not config["key"]:
        section("2-5. Network, relay and generation")
        skip("همه", "بدون کلید Gemini هیچ‌کدام معنا ندارد")
    else:
        step_direct(config["key"], args.timeout)
        step_relay(config["key"], config["proxies"], config["model"], args.timeout)
        step_generate(config["model"], args.all_models)
        step_advice(config)
        token = args.token
        if site and not token and args.email and args.password:
            token = step_login(site, host, args.email, args.password, args.timeout)
        if site and token:
            info("سهمیه", "این بررسی یک درخواست واقعی از سهمیهٔ هوش مصنوعی حساب مصرف می‌کند")
        step_live(site, host, token, args.timeout)

    print()
    print("=" * 70)
    print(
        f"summary: {CONSIDERED['passed']} PASS، {CONSIDERED['failed']} FAIL، "
        f"{CONSIDERED['warned']} WARN، {CONSIDERED['skipped']} SKIP"
    )
    if CONSIDERED["failed"]:
        print("!!! مسیر Gemini سالم نیست — بخش‌ها می‌گویند کدام حلقه پاره است.")
    else:
        print("مسیر Gemini سالم است: کلید، مدل و مسیر رسیدن به گوگل جواب دادند.")
    if STATE["generate"] and STATE["relay"] == "ok" and STATE["direct"] != "ok":
        print("یادآوری: ترافیک از راه GEMINI_PROXY می‌رود و کار می‌کند — این حالت درست است.")
    if STATE["direct"] in ("blocked", "html", "permission"):
        print("یادآوری: گوگل به لیست مدل‌ها (‎/v1beta/models) روی این IP پاسخ نمی‌دهد؛ این با کارکردن گزارش‌ها تناقضی ندارد.")
    print("=" * 70)
    return 1 if CONSIDERED["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
