#!/bin/bash
set -e

echo "=== Dlea Deployment ==="

DEPLOY_DIR="$HOME/dlea"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_DIR/current"
RUNNING_DIR="/var/www/dlea.piqagram.ir"
SITE_HOST="dlea.piqagram.ir"

# Gunicorn must listen on whatever port nginx proxies /api/ to. This used to be
# a hardcoded 8002 while deploy/nginx-dlea.conf says 8000, so the two could
# disagree without anyone noticing: the script reported success while nginx kept
# talking to a port nobody was listening on.
detect_nginx_backend_port() {
    local conf port
    for conf in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
        [ -f "$conf" ] || continue
        port=$(grep -A 6 "location /api/" "$conf" 2>/dev/null \
            | grep -oE "proxy_pass[[:space:]]+https?://[0-9.]+:[0-9]+" \
            | grep -oE "[0-9]+$" | head -1) || true
        if [ -n "$port" ]; then
            echo "$port"
            return
        fi
    done
}

NGINX_BACKEND_PORT=$(detect_nginx_backend_port) || true
if [ -n "$NGINX_BACKEND_PORT" ]; then
    BACKEND_PORT="$NGINX_BACKEND_PORT"
    echo "nginx proxies /api/ to port $BACKEND_PORT"
else
    BACKEND_PORT="${BACKEND_PORT:-8002}"
    echo "Could not read nginx's /api/ port, assuming $BACKEND_PORT"
fi

port_in_use() {
    if command -v ss >/dev/null 2>&1; then
        ss -ltn 2>/dev/null | grep -qE "[:.]$BACKEND_PORT[[:space:]]"
    else
        netstat -ltn 2>/dev/null | grep -qE "[:.]$BACKEND_PORT[[:space:]]"
    fi
}

port_holder_pid() {
    if command -v ss >/dev/null 2>&1; then
        ss -ltnp 2>/dev/null | grep -E "[:.]$BACKEND_PORT[[:space:]]" | grep -oE "pid=[0-9]+" | grep -oE "[0-9]+" | head -1
    else
        netstat -ltnp 2>/dev/null | grep -E "[:.]$BACKEND_PORT[[:space:]]" | grep -oE "[0-9]+/" | grep -oE "[0-9]+" | head -1
    fi
}

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
    REQS_CHANGED=0
    cmp -s "$RELEASE_DIR/backend/requirements.txt" "$RUNNING_DIR/backend/requirements.txt" || REQS_CHANGED=1
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

# The venv that imports the code is the running one, not the release's. If
# requirements.txt changed, install the same bundle here from the wheels that
# came with the release (the server has no PyPI), so a deploy cannot leave the
# app importing a dependency that only exists in the release. Still before the
# restart: if this fails, the old process keeps serving.
if [ "${REQS_CHANGED:-0}" = "1" ]; then
    echo "requirements.txt changed — installing into the running venv from the release wheels..."
    if [ -d "$RELEASE_DIR/pip-wheels" ]; then
        .venv/bin/pip install --no-index --find-links "$RELEASE_DIR/pip-wheels" -q -r requirements.txt
    else
        .venv/bin/pip install -q -r requirements.txt
    fi
fi

echo "Running migrations in the running directory..."
.venv/bin/python manage.py migrate --noinput

# Both processes are supervised by PM2 on this host (`pm2 list`: dlea-api is
# gunicorn on the API port with cwd backend/, dlea is `npm start` serving
# .output on 3000). Killing a PM2 app with pkill just makes PM2 respawn it, so
# the previous deploy's gunicorn died with "Address already in use" while an old
# process kept serving — and the script reported success anyway. Restart through
# PM2 when it owns the app, and fall back to the old way when it does not.
PM2_BIN=$(command -v pm2 || echo "$HOME/.bun/bin/pm2")
pm2_restart() {
    [ -x "$PM2_BIN" ] || return 1
    "$PM2_BIN" describe "$1" >/dev/null 2>&1 || return 1
    "$PM2_BIN" restart "$1" --update-env
}

# Publish the frontend build to the directory PM2 actually serves it from.
# `dlea` runs `npm start` (node .output/server/index.mjs) with cwd $RUNNING_DIR —
# not the release dir — so without this the site kept serving a build from weeks
# ago no matter how often it was deployed.
echo "Publishing the frontend build..."
rsync -a --delete --exclude='.cache' --exclude='cache' \
    "$RELEASE_DIR/.output/" "$RUNNING_DIR/.output/"
if ! cmp -s "$RELEASE_DIR/.output/server/index.mjs" "$RUNNING_DIR/.output/server/index.mjs"; then
    echo "!!! The served frontend build was not updated — stopping instead of reporting success." >&2
    exit 1
fi

echo "Restarting backend (Gunicorn on port $BACKEND_PORT)..."
if ! pm2_restart dlea-api; then
    echo "PM2 does not manage dlea-api here; restarting gunicorn directly."
    pkill -f "gunicorn.*config.wsgi" 2>/dev/null || true
    for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
        port_in_use || break
        sleep 1
    done
    HOLDER=$(port_holder_pid)
    if [ -n "$HOLDER" ]; then
        echo "Port $BACKEND_PORT is still held by pid $HOLDER; killing it."
        kill "$HOLDER" 2>/dev/null || true
        sleep 2
    fi
    if port_in_use; then
        echo "!!! Port $BACKEND_PORT is still in use, so a new backend would either fail to" >&2
        echo "    start or leave you being served by stale code. Refusing to continue." >&2
        (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep -E "[:.]$BACKEND_PORT[[:space:]]" >&2 || true
        exit 1
    fi
    nohup .venv/bin/gunicorn config.wsgi:application --bind "127.0.0.1:$BACKEND_PORT" --workers 3 --timeout 120 > /tmp/gunicorn.log 2>&1 &
fi

sleep 3
echo "Restarting frontend (Node.js on port 3000)..."
if ! pm2_restart dlea; then
    echo "PM2 does not manage dlea here; restarting it directly."
    kill $(pgrep -f "node.*index.mjs") 2>/dev/null || true
    sleep 1
    cd "$RUNNING_DIR"
    nohup node .output/server/index.mjs > /tmp/frontend.log 2>&1 &
fi
sleep 2

echo "Checking the API actually answers..."
BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/plans/" 2>/dev/null || echo "000")
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/" 2>/dev/null || echo "000")
# 127.0.0.1:$BACKEND_PORT can be perfectly healthy while the public API is dead
# (wrong port, dead proxy target), so also walk the path a browser walks:
# through nginx with the real Host header. Probing https://$SITE_HOST against
# 127.0.0.1 is NOT that path — this vhost only listens on :80 (TLS is terminated
# upstream), so the loopback TLS probe lands on whatever vhost owns :443 and
# reports a bogus 404.
PROXIED_OK=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $SITE_HOST" \
    "http://127.0.0.1/api/plans/" 2>/dev/null || echo "000")
PUBLIC_OK=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 20 \
    "https://$SITE_HOST/api/plans/" 2>/dev/null || echo "000")

rm -f /tmp/dlea-deploy.tar.gz /tmp/deploy.sh

echo "=== Deployment summary ==="
echo "Release: $RELEASE_DIR"
echo "Current: $CURRENT_LINK"
echo "Backend (port $BACKEND_PORT): HTTP $BACKEND_OK"
echo "Frontend (port 3000): HTTP $FRONTEND_OK"
echo "API through nginx (loopback): HTTP $PROXIED_OK"
echo "Public API (https://$SITE_HOST): HTTP $PUBLIC_OK"

FAILED=0
if [ "$BACKEND_OK" != "200" ]; then
    echo "!!! The backend did not answer 200 on port $BACKEND_PORT." >&2
    FAILED=1
fi
# 000 for the public URL just means the server cannot reach its own public host
# (DNS/hairpin), which is why the loopback probe is accepted as a stand-in.
if [ "$PUBLIC_OK" = "200" ]; then
    :
elif [ "$PUBLIC_OK" = "000" ] && [ "$PROXIED_OK" = "200" ]; then
    echo "(could not reach $SITE_HOST from this host; nginx answered 200 on loopback instead)"
else
    echo "!!! The API is not reachable through nginx: loopback HTTP $PROXIED_OK, public HTTP $PUBLIC_OK." >&2
    FAILED=1
fi
if [ "$FRONTEND_OK" != "200" ]; then
    echo "!!! The frontend did not answer 200 on port 3000." >&2
    FAILED=1
fi
if [ "$FAILED" = "1" ]; then
    echo "" >&2
    echo "!!! The deploy is NOT good — see DEPLOYMENT-RUNBOOK.md section 7." >&2
    # Show the log of whichever process actually owns the app: PM2 on this host,
    # a nohup'd gunicorn only in the fallback path.
    if "$PM2_BIN" describe dlea-api >/dev/null 2>&1; then
        echo "--- pm2 logs dlea-api (last 30 lines) ---" >&2
        "$PM2_BIN" logs dlea-api --lines 30 --nostream >&2 || true
    elif [ -f /tmp/gunicorn.log ]; then
        echo "--- last lines of /tmp/gunicorn.log ---" >&2
        tail -30 /tmp/gunicorn.log >&2 || true
    fi
    if [ -f /tmp/frontend.log ]; then
        echo "--- last lines of /tmp/frontend.log ---" >&2
        tail -20 /tmp/frontend.log >&2 || true
    fi
    exit 1
fi

echo "=== Deployment complete ==="
