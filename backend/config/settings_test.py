"""Test settings for the Dlea platform backend.

Run the suite with:

    python manage.py test --settings config.settings_test api

Key differences from the dev/prod settings:
- SQLite in-memory database (no Postgres server needed).
- DEBUG=1 so OTP endpoints return `debug_otp` for assertions.
- Locmem email backend so emails land in `django.core.mail.outbox`.
- Fast MD5 password hasher to keep the suite quick.
"""

from .settings import *  # noqa: F401,F403  (inherit everything, then override)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

DEBUG = True
ALLOWED_HOSTS = ["*"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Speed up user creation in tests (never used outside the test DB).
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Tests never talk to external services — endpoints that would fetch live
# data are patched per-test; this is a safety net for anything missed.
GEMINI_API_KEY = ""