#!/usr/bin/env bash
# Boot the Django backend for Playwright E2E tests.
# Uses a dedicated SQLite file (e2e.sqlite3) so the local dev DB is untouched.
set -euo pipefail

cd "$(dirname "$0")/../backend"

export USE_SQLITE=1
export SQLITE_DB_NAME="${SQLITE_DB_NAME:-$PWD/e2e.sqlite3}"
export DJANGO_DEBUG=1

PY=".venv/Scripts/python.exe"
if [ ! -x "$PY" ]; then
  PY=".venv/bin/python"
fi
if [ ! -x "$PY" ]; then
  PY="python3"
fi

"$PY" manage.py migrate --noinput >/dev/null

# Seed reference data (plans, achievements, symbols, ...). Demo rows are
# optional for the E2E flows, so a partial failure is not fatal.
"$PY" manage.py seed_data >/dev/null 2>&1 || true

# Ensure an admin account exists for the admin journey spec.
"$PY" manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
if not U.objects.filter(username='e2eadmin').exists():
    U.objects.create_user(
        username='e2eadmin', email='admin@dlea.test',
        password='AdminPass123', is_staff=True, is_superuser=True,
    )
    print('admin created')
else:
    print('admin exists')
" >/dev/null

# Bind all interfaces so both 127.0.0.1 and localhost (::1) reach the server;
# on Windows `localhost` often resolves to ::1 only.
exec "$PY" manage.py runserver 0.0.0.0:8000 --noreload