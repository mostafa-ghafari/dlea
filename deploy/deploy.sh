#!/bin/bash
set -e

echo "=== Dlea Deployment ==="

DEPLOY_DIR="$HOME/dlea"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_DIR/current"
RUNNING_DIR="/var/www/dlea.piqagram.ir"
SITE_HOST="dlea.piqagram.ir"
# Releases are ~80 MB each (code + offline wheels + .output) on a disk shared
# with other sites, so a successful deploy keeps only the newest ones. Override
# with e.g. KEEP_RELEASES=20 bash /tmp/deploy.sh; 0 disables pruning.
KEEP_RELEASES="${KEEP_RELEASES:-10}"

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

# nginx answers 504 the moment its `proxy_read_timeout` expires, and it only ever
# points at the app: the app reports its own failures as 4xx/502 with a Persian
# detail. So a gateway that gives up *before* the app's Gemini budget does is not
# a slow report, it is a broken coach, and from inside the app it looks like a
# Gemini or relay problem. That is why it went unnoticed for weeks: nginx's own
# error log was the only place that said `upstream timed out` on
# POST /api/coach/generate/.
#
# This script never wrote the vhost, so `deploy/nginx-dlea.conf` could carry the
# fix while the server kept nginx's 60s default. Read the effective value back
# out of the live config instead of trusting the copy in the repo.
nginx_api_read_timeout() {
    local conf block value
    for conf in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
        [ -f "$conf" ] || continue
        block=$(grep -A 20 "location /api/" "$conf" 2>/dev/null || true)
        [ -n "$block" ] || continue
        value=$(printf '%s\n' "$block" \
            | grep -oE "proxy_read_timeout[[:space:]]+[0-9]+" \
            | grep -oE "[0-9]+" | head -1) || true
        # A block without the directive falls through to nginx's own default,
        # which is the value that caused the 504s — not an unknown.
        echo "${value:-60}"
        return
    done
}

# The budget the app gives a whole Gemini call: same default and same
# GEMINI_TIMEOUT override as api/gemini.py. Read from the running .env, because
# that is the file the app process itself loads.
app_gemini_budget() {
    local raw
    raw=$(grep -E "^GEMINI_TIMEOUT=" "$RUNNING_DIR/backend/.env" 2>/dev/null \
        | tail -1 | cut -d= -f2- | tr -d "\"' \r") || true
    printf '%s\n' "$raw" | awk '
        /^[0-9]+([.][0-9]+)?$/ && $1 + 0 > 0 { printf "%s\n", $1; next }
        { printf "%s\n", 75 }
    '
}

NGINX_BACKEND_PORT=$(detect_nginx_backend_port) || true

# What the gateway will wait for a report, and what the app may spend making it.
# Empty means no `location /api/` block was found at all, so nothing can be said.
GATEWAY_READ_TIMEOUT=$(nginx_api_read_timeout) || true
GEMINI_BUDGET=$(app_gemini_budget) || true
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
# PM2 reports `online` before a Node process has necessarily finished loading the
# SSR bundle and opened its socket. Retry local checks instead of turning that
# short startup window into a failed deployment. Keep curl's single status code
# too: appending `|| echo 000` to curl's output produced confusing values such as
# `000000` when the connection was refused.
http_status() {
    local url="$1" host="${2:-}"
    if [ -n "$host" ]; then
        curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 10 \
            -H "Host: $host" "$url" 2>/dev/null || true
    else
        curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 10 "$url" 2>/dev/null || true
    fi
}
wait_for_http_200() {
    local url="$1" host="${2:-}" status="000"
    for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
        status=$(http_status "$url" "$host")
        if [ "$status" = "200" ]; then
            echo "$status"
            return 0
        fi
        sleep 2
    done
    echo "$status"
    return 1
}
# The Host header is not optional here. Django rejects a host outside
# ALLOWED_HOSTS with 400, and a loopback curl sends `Host: 127.0.0.1:8002`, so
# this probe answered 400 on a perfectly healthy backend — which turned into
# "The backend did not answer 200 on port 8002" and marked every deploy failed,
# including the ones that worked.
BACKEND_OK=$(wait_for_http_200 "http://127.0.0.1:$BACKEND_PORT/api/plans/" "$SITE_HOST") || true
FRONTEND_OK=$(wait_for_http_200 "http://127.0.0.1:3000/") || true
# 127.0.0.1:$BACKEND_PORT can be perfectly healthy while the public API is dead
# (wrong port, dead proxy target), so also walk the path a browser walks:
# through nginx with the real Host header. Probing https://$SITE_HOST against
# 127.0.0.1 is NOT that path — this vhost only listens on :80 (TLS is terminated
# upstream), so the loopback TLS probe lands on whatever vhost owns :443 and
# reports a bogus 404.
# A 301/302 from the loopback probe is certbot's :80 → :443 redirect doing its
# job, not a dead API: on this host the app's own vhost carries
# `listen 443 ssl` and :80 only redirects, so a plain-HTTP probe is *expected*
# to be redirected. Reading that as a failure would fail every deploy.
PROXIED_OK=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $SITE_HOST" \
    "http://127.0.0.1/api/plans/" 2>/dev/null || echo "000")
PUBLIC_OK=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 20 \
    "https://$SITE_HOST/api/plans/" 2>/dev/null || echo "000")

# The payment path is part of "deployed". A release that loads but cannot take
# money looks exactly like a good one otherwise, so the smoke test is a gate
# here: after the restart, before any old release is pruned. It writes one test
# order and one test user (both named smoke-payment@…) on the running database,
# deletes them again, and never moves money. SKIP_PAYMENT_SMOKE=1 bypasses the
# gate in an emergency; SMOKE_PAYMENT_ARGS="--dry-run" narrows it to the
# read-only checks.
PAYMENT_SMOKE="skipped (SKIP_PAYMENT_SMOKE=1)"
PAYMENT_SMOKE_FAILED=0
SMOKE_CHECKER="$RELEASE_DIR/deploy/smoke_payment.py"
APP_PYTHON="$RUNNING_DIR/backend/.venv/bin/python"
if [ "${SKIP_PAYMENT_SMOKE:-0}" = "1" ]; then
    echo "Skipping the payment smoke test (SKIP_PAYMENT_SMOKE=1)."
elif [ ! -f "$SMOKE_CHECKER" ]; then
    echo "!!! This release has no deploy/smoke_payment.py, so the payment path cannot" >&2
    echo "    be verified: the checkout this deploy came from is too old." >&2
    PAYMENT_SMOKE="NOT VERIFIED (checker missing from the release)"
    PAYMENT_SMOKE_FAILED=1
elif [ ! -x "$APP_PYTHON" ]; then
    echo "!!! $APP_PYTHON is missing, so the payment smoke test cannot run." >&2
    PAYMENT_SMOKE="NOT VERIFIED (no venv at $APP_PYTHON)"
    PAYMENT_SMOKE_FAILED=1
else
    echo "Checking the payment path (this takes a few seconds)..."
    if DLEA_BACKEND_DIR="$RUNNING_DIR/backend" "$APP_PYTHON" "$SMOKE_CHECKER" \
        --site "http://127.0.0.1" --host "$SITE_HOST" $SMOKE_PAYMENT_ARGS; then
        PAYMENT_SMOKE="OK"
    else
        PAYMENT_SMOKE="FAILED — see the checks above"
        PAYMENT_SMOKE_FAILED=1
    fi
fi

rm -f /tmp/dlea-deploy.tar.gz /tmp/deploy.sh

# ── Gateway budget: will the proxy wait for the report? ─────────────────────
#
# A report may take the app's whole Gemini budget. A proxy that waits less than
# that answers 504 while gunicorn is still working, so the user gets a bare
# gateway timeout instead of the app's own message — measured against the live
# config, never against the copy this release ships.
GATEWAY_BUDGET_NOTE="not checked (no 'location /api/' block found in nginx)"
GATEWAY_BUDGET_FAILED=0

evaluate_gateway_budget() {
    if [ -z "$GATEWAY_READ_TIMEOUT" ]; then
        GATEWAY_BUDGET_NOTE="not checked (no 'location /api/' block found in nginx)"
        GATEWAY_BUDGET_FAILED=0
    elif awk "BEGIN { exit !($GATEWAY_READ_TIMEOUT + 0 >= $GEMINI_BUDGET + 0) }"; then
        GATEWAY_BUDGET_NOTE="OK (nginx waits ${GATEWAY_READ_TIMEOUT}s, app may spend ${GEMINI_BUDGET}s)"
        GATEWAY_BUDGET_FAILED=0
    else
        GATEWAY_BUDGET_NOTE="TOO SHORT (nginx waits ${GATEWAY_READ_TIMEOUT}s, app may spend ${GEMINI_BUDGET}s)"
        GATEWAY_BUDGET_FAILED=1
    fi
}

evaluate_gateway_budget

# Opt-in: put the gateway timeout back into the *live* vhost, surgically.
#
# Deliberately not a whole-file copy. `deploy/nginx-dlea.conf` is an excerpt of
# the vhost for reading — the live file also carries the certbot-managed
# `listen 443 ssl` block and a redirect server, added after this file was copied
# by hand. Overwriting it would delete TLS for this host. Insert the directives
# into the existing `location /api/` block, touch nothing else, and keep a
# backup that is restored if nginx refuses the result.
if [ "$GATEWAY_BUDGET_FAILED" = "1" ] && [ "${APPLY_NGINX_VHOST:-0}" = "1" ]; then
    echo "APPLY_NGINX_VHOST=1 — adding the gateway timeout to the live vhost..."
    LIVE_VHOST="/etc/nginx/sites-enabled/$SITE_HOST"
    # At or above gunicorn's --timeout (120), so gunicorn rather than nginx is
    # the layer that reports a failure.
    TIMEOUT_SECONDS=120
    if [ ! -f "$LIVE_VHOST" ]; then
        echo "!!! $LIVE_VHOST does not exist, so there is nothing to edit." >&2
    elif grep -A20 "location /api/" "$LIVE_VHOST" | grep -q "proxy_read_timeout"; then
        echo "$LIVE_VHOST already sets proxy_read_timeout; nothing to apply."
    else
        PATCHED=$(mktemp)
        awk -v timeout="$TIMEOUT_SECONDS" '
            /location[[:space:]]+\/api\/[[:space:]]*\{/ { in_api = 1 }
            in_api && !done && /^[[:space:]]*\}/ {
                printf "        proxy_read_timeout %ss;\n", timeout
                printf "        proxy_send_timeout %ss;\n", timeout
                done = 1
                in_api = 0
            }
            { print }
        ' "$LIVE_VHOST" > "$PATCHED"
        if ! grep -A20 "location /api/" "$PATCHED" | grep -q "proxy_read_timeout"; then
            echo "!!! could not find the end of the location /api/ block; leaving it alone." >&2
            rm -f "$PATCHED"
        elif ! sudo -n true 2>/dev/null; then
            echo "!!! nginx config needs a password, so it was not touched." >&2
            echo "    The patched file is at $PATCHED — install it with:" >&2
            echo "      sudo cp $PATCHED $LIVE_VHOST && sudo nginx -t && sudo systemctl reload nginx" >&2
        else
            VHOST_BACKUP="$LIVE_VHOST.bak.$(date +%Y%m%d-%H%M%S)"
            sudo cp "$LIVE_VHOST" "$VHOST_BACKUP"
            if sudo cp "$PATCHED" "$LIVE_VHOST" && sudo nginx -t >/dev/null 2>&1; then
                sudo systemctl reload nginx
                echo "Reloaded nginx with proxy_read_timeout ${TIMEOUT_SECONDS}s (backup: $VHOST_BACKUP)."
            else
                echo "!!! nginx rejected the patched vhost — restoring $VHOST_BACKUP." >&2
                sudo cp "$VHOST_BACKUP" "$LIVE_VHOST"
                sudo nginx -t >/dev/null 2>&1 \
                    || echo "!!! nginx -t is still failing; look at it by hand." >&2
            fi
            rm -f "$PATCHED"
            GATEWAY_READ_TIMEOUT=$(nginx_api_read_timeout) || true
            evaluate_gateway_budget
        fi
    fi
fi

if [ "$GATEWAY_BUDGET_FAILED" = "1" ]; then
    echo "" >&2
    echo "!!! The gateway will give up before the coach can answer: $GATEWAY_BUDGET_NOTE" >&2
    echo "    Any report slower than ${GATEWAY_READ_TIMEOUT}s comes back as a 504 with an HTML body," >&2
    echo "    which the app cannot turn into its own error message." >&2
    echo "    Fix it by adding these two lines inside the 'location /api/ {' block of" >&2
    echo "    /etc/nginx/sites-enabled/$SITE_HOST, then: sudo nginx -t && sudo systemctl reload nginx" >&2
    echo "        proxy_read_timeout 120s;" >&2
    echo "        proxy_send_timeout 120s;" >&2
    echo "    Do NOT copy $RELEASE_DIR/deploy/nginx-dlea.conf over it: that file is an" >&2
    echo "    excerpt of the vhost and the live one also carries the certbot-managed" >&2
    echo "    443 block, so a whole-file copy would strip TLS for this host." >&2
    echo "    Or re-run with APPLY_NGINX_VHOST=1 to insert it from here, or" >&2
    echo "    IGNORE_GATEWAY_BUDGET=1 to deploy anyway." >&2
fi

echo "=== Deployment summary ==="
echo "Release: $RELEASE_DIR"
echo "Current: $CURRENT_LINK"
echo "Backend (port $BACKEND_PORT): HTTP $BACKEND_OK"
echo "Frontend (port 3000): HTTP $FRONTEND_OK"
echo "API through nginx (loopback): HTTP $PROXIED_OK"
echo "Public API (https://$SITE_HOST): HTTP $PUBLIC_OK"
echo "Gateway budget (coach): $GATEWAY_BUDGET_NOTE"
echo "Payment path (smoke test): $PAYMENT_SMOKE"

FAILED=0
# A coach that cannot answer is not a working deploy. Leave the old releases in
# place until nginx is allowed to wait for the report, exactly like a failed
# health check, so the rollback material is still there.
if [ "$GATEWAY_BUDGET_FAILED" = "1" ] && [ "${IGNORE_GATEWAY_BUDGET:-0}" != "1" ]; then
    echo "!!! The gateway budget check did not pass ($GATEWAY_BUDGET_NOTE)." >&2
    FAILED=1
fi
if [ "$BACKEND_OK" != "200" ]; then
    echo "!!! The backend did not answer 200 on port $BACKEND_PORT." >&2
    FAILED=1
fi
# 000 for the public URL just means the server cannot reach its own public host
# (DNS/hairpin), which is why the loopback probe is accepted as a stand-in.
if [ "$PUBLIC_OK" = "200" ]; then
    :
elif [ "$PUBLIC_OK" = "000" ] && { [ "$PROXIED_OK" = "200" ] || [ "$PROXIED_OK" = "301" ]; }; then
    echo "(could not reach $SITE_HOST from this host; nginx answered $PROXIED_OK on loopback instead)"
else
    echo "!!! The API is not reachable through nginx: loopback HTTP $PROXIED_OK, public HTTP $PUBLIC_OK." >&2
    FAILED=1
fi
if [ "$FRONTEND_OK" != "200" ]; then
    echo "!!! The frontend did not answer 200 on port 3000." >&2
    FAILED=1
fi
# A deploy that ships a checkout will not be called successful if nobody can
# check out. Old releases are kept in that case, exactly like a failed health
# check, so the rollback material is still there.
if [ "$PAYMENT_SMOKE_FAILED" = "1" ]; then
    echo "!!! The payment path did not pass its smoke test ($PAYMENT_SMOKE)." >&2
    echo "    Run it alone with: bash deploy/smoke-payment.sh" >&2
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
    if [ "$FRONTEND_OK" != "200" ] && "$PM2_BIN" describe dlea >/dev/null 2>&1; then
        echo "--- pm2 logs dlea (last 30 lines) ---" >&2
        "$PM2_BIN" logs dlea --lines 30 --nostream >&2 || true
    fi
    if [ -f /tmp/frontend.log ]; then
        echo "--- last lines of /tmp/frontend.log ---" >&2
        tail -20 /tmp/frontend.log >&2 || true
    fi
    exit 1
fi

# Prune old releases only now, after a deploy that passed every health check, so
# a failed deploy never costs you rollback material. The release ~/dlea/current
# points at is always kept, whatever its age.
if [ "$KEEP_RELEASES" -gt 0 ]; then
    echo "Pruning old releases (keeping the newest $KEEP_RELEASES)..."
    CURRENT_TARGET=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)
    PRUNED=0
    # Only directories count: a stray file in releases/ must not use up a slot.
    while IFS= read -r old; do
        [ -n "$old" ] || continue
        old_path="$DEPLOY_DIR/releases/$old"
        if [ ! -d "$old_path" ]; then
            continue
        fi
        if [ "$(readlink -f "$old_path")" = "$CURRENT_TARGET" ]; then
            echo "  kept $old (current release)"
            continue
        fi
        rm -rf "$old_path"
        echo "  removed $old"
        PRUNED=$((PRUNED + 1))
    done <<< "$(ls -1t "$DEPLOY_DIR/releases" 2>/dev/null \
        | while IFS= read -r entry; do [ -d "$DEPLOY_DIR/releases/$entry" ] && echo "$entry"; done \
        | tail -n +$((KEEP_RELEASES + 1)))"
    echo "Pruned $PRUNED release(s)."
fi

echo "=== Deployment complete ==="
