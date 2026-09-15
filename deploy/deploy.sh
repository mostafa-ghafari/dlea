#!/bin/bash
set -e

echo "=== Dlea Deployment ==="

DEPLOY_DIR="$HOME/dlea"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_DIR/current"
RUNNING_DIR="/var/www/dlea.piqagram.ir"

mkdir -p "$DEPLOY_DIR/releases"

echo "Extracting..."
if [ ! -s /tmp/dlea-deploy.tar.gz ]; then
    echo "!!! /tmp/dlea-deploy.tar.gz is missing or empty — the upload did not arrive." >&2
    exit 1
fi
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"
tar xzf /tmp/dlea-deploy.tar.gz

echo "Setting up backend..."
cd backend
python3 -m venv .venv 2>/dev/null || true
.venv/bin/pip install --upgrade pip -q 2>/dev/null || true
if [ -d "../pip-wheels" ] && (ls ../pip-wheels/*.whl >/dev/null 2>&1 || ls ../pip-wheels/*.tar.gz >/dev/null 2>&1); then
  echo "Installing from local packages (offline)..."
  .venv/bin/pip install --no-index --find-links ../pip-wheels -r requirements.txt -q
else
  echo "No local packages found, falling back to PyPI..."
  .venv/bin/pip install -r requirements.txt -q
fi

echo "Running backend tests before deploy (abort on failure)..."
USE_SQLITE=1 .venv/bin/python manage.py test api --settings config.settings_test

echo "Running migrations..."
.venv/bin/python manage.py migrate --noinput

cd "$DEPLOY_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

# Sync the code gunicorn actually runs.
#
# This used to copy a hand-maintained list of files, which silently dropped
# every *new* module: the release had `api/plan_limits.py` while the running
# copy did not, so importing the URLconf raised and the entire API answered 500
# (for every path, including unknown ones) — a failure this script happily
# reported as "Deployment complete". Copy whole directories instead, and verify
# afterwards that nothing is missing.
echo "Syncing backend code to the running directory..."
if [ -d "$RUNNING_DIR/backend" ]; then
    # Mirror, don't merge: copying over the top only ever *added* files, so a
    # migration the repo had deleted (0013_alter_portfolio_strategy...) stayed
    # behind as an orphan leaf and made `migrate` refuse to run with
    # "multiple leaf nodes in the migration graph".
    if command -v rsync >/dev/null 2>&1; then
        rsync -a --delete --exclude='__pycache__' \
            "$RELEASE_DIR/backend/api/" "$RUNNING_DIR/backend/api/"
        rsync -a --delete --exclude='__pycache__' \
            "$RELEASE_DIR/backend/config/" "$RUNNING_DIR/backend/config/"
    else
        cp -r "$RELEASE_DIR/backend/api" "$RELEASE_DIR/backend/config" "$RUNNING_DIR/backend/"
        while IFS= read -r stale; do
            rel="${stale#$RUNNING_DIR/backend/}"
            if [ ! -f "$RELEASE_DIR/backend/$rel" ]; then
                echo "removing stale $rel"
                rm -f "$stale"
            fi
        done <<< "$(find "$RUNNING_DIR/backend/api" -name '*.py' -type f)"
    fi
    cp -f "$RELEASE_DIR/backend/manage.py" "$RUNNING_DIR/backend/manage.py"
    cp -f "$RELEASE_DIR/backend/requirements.txt" "$RUNNING_DIR/backend/requirements.txt"
    # Never clobber the running environment's own state (backend/.env, media/,
    # db.sqlite3) — only code paths are synced above — and drop stale bytecode so
    # it can never shadow the synced sources.
    find "$RUNNING_DIR/backend/api" "$RUNNING_DIR/backend/config" \
        -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true

    DRIFT=$(diff -rq --exclude=__pycache__ \
        "$RELEASE_DIR/backend/api" "$RUNNING_DIR/backend/api" 2>&1 || true)
    MISSING=$(printf '%s\n' "$DRIFT" | grep -E "^Files .* differ$|^Only in $RELEASE_DIR" || true)
    if [ -n "$MISSING" ]; then
        echo "" >&2
        echo "!!! backend/api did not sync cleanly — refusing to restart the backend:" >&2
        printf '%s\n' "$MISSING" | head -20 >&2
        exit 1
    fi
fi

# Migrate before stopping the old process, so a broken migration leaves the
# currently working backend up instead of taking the site down.
cd "$RUNNING_DIR/backend"
echo "Running migrations in the running directory..."
.venv/bin/python manage.py migrate --noinput

echo "Restarting backend (Gunicorn on port 8002)..."
# Kill any existing gunicorn processes
pkill -f "gunicorn.*config.wsgi" 2>/dev/null || true
sleep 2
# Start from the running directory
cd "$RUNNING_DIR/backend"
.venv/bin/python manage.py migrate --noinput 2>/dev/null || true
nohup .venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8002 --workers 3 --timeout 120 > /tmp/gunicorn.log 2>&1 &
sleep 3

echo "Restarting frontend (Node.js on port 3000)..."
kill $(pgrep -f "node.*index.mjs") 2>/dev/null || true
sleep 1
cd "$RELEASE_DIR"
nohup node .output/server/index.mjs > /tmp/frontend.log 2>&1 &
sleep 2

BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8002/api/auth/password-reset-request/ -X POST -H "Content-Type: application/json" -d '{"email":"test"}' 2>/dev/null || echo "000")
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")

rm -f /tmp/dlea-deploy.tar.gz /tmp/deploy.sh

echo "=== Deployment complete ==="
echo "Release: $RELEASE_DIR"
echo "Current: $CURRENT_LINK"
echo "Backend (port 8002): HTTP $BACKEND_OK"
echo "Frontend (port 3000): HTTP $FRONTEND_OK"
