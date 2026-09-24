#!/bin/bash
#
# Give nginx long enough to wait for a coach report.
#
# Why this exists: a coach report may spend the app's whole Gemini budget
# (GEMINI_CALL_BUDGET_SECONDS, 75s) before Django writes a byte of the response.
# nginx's `proxy_read_timeout` defaults to 60s, so on a vhost that never set it,
# nginx answers 504 with its own HTML page long before gunicorn or the app can
# say anything — and the browser sees `API 504: coach/generate/` instead of the
# app's Persian error. That is the whole bug this repairs.
#
# `deploy/nginx-dlea.conf` cannot be copied over the live vhost to fix it: it is
# an excerpt (no certbot-managed `listen 443 ssl` block), so a whole-file copy
# strips TLS from the host. This script edits only the directives inside the
# existing `location /api/` block and leaves every other line alone:
#
#   * idempotent — a vhost that already sets proxy_read_timeout is left as is
#   * dry-run by default; --apply writes (backup, `nginx -t`, reload, rollback)
#   * refuses to touch a file where it cannot find the end of the /api/ block
#
# Usage:
#   sudo bash deploy/fix-coach-gateway-timeout.sh              # show what it would do
#   sudo bash deploy/fix-coach-gateway-timeout.sh --apply      # do it
#   sudo bash deploy/fix-coach-gateway-timeout.sh --apply --timeout 150
#
# deploy.sh checks this same number on every deploy (`Gateway budget (coach)` in
# its summary) and fails the deploy when a gateway would give up too early.
set -euo pipefail

SITE_HOST="${SITE_HOST:-dlea.piqagram.ir}"
VHOST="${VHOST:-/etc/nginx/sites-enabled/$SITE_HOST}"
# At or above gunicorn's --timeout (120) so gunicorn, not nginx, is the layer
# that reports a failure.
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
APPLY=0

die() {
    echo "ERROR: $*" >&2
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        --apply) APPLY=1; shift ;;
        --host) SITE_HOST="${2:-}"; VHOST="/etc/nginx/sites-enabled/$SITE_HOST"; shift 2 ;;
        --vhost) VHOST="${2:-}"; shift 2 ;;
        --timeout) TIMEOUT_SECONDS="${2:-}"; shift 2 ;;
        -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
        *) die "unknown argument: $1 (try --help)" ;;
    esac
done

[ -f "$VHOST" ] || die "$VHOST does not exist; is the site served from another file?"
grep -q 'location /api/' "$VHOST" || die "$VHOST has no 'location /api/' block to patch."
case "$TIMEOUT_SECONDS" in
    ''|*[!0-9]*) die "--timeout must be a whole number of seconds, got '$TIMEOUT_SECONDS'" ;;
esac
[ "$TIMEOUT_SECONDS" -ge 120 ] || \
    echo "WARNING: ${TIMEOUT_SECONDS}s is below gunicorn's --timeout (120s), so gunicorn may report failures nginx cannot." >&2

# Already patched? Then there is nothing to do — re-running must be safe.
if grep -A20 'location /api/' "$VHOST" | grep -q 'proxy_read_timeout'; then
    echo "$VHOST already sets proxy_read_timeout:"
    grep -A20 'location /api/' "$VHOST" | grep -E 'proxy_read_timeout|proxy_send_timeout' | sed 's/^/  /'
    exit 0
fi

echo "Patching the 'location /api/' block in $VHOST with a ${TIMEOUT_SECONDS}s read timeout."

PATCHED="$(mktemp)"
trap 'rm -f "$PATCHED"' EXIT

# Insert both directives immediately before the closing brace of the /api/
# block. `in_api` only matches the block itself, so the closing braces of
# `location /media/`, `location /` and `server` are never touched.
awk -v timeout="$TIMEOUT_SECONDS" '
    /location[[:space:]]+\/api\/[[:space:]]*\{/ { in_api = 1 }
    in_api && !done && /^[[:space:]]*\}/ {
        printf "        proxy_read_timeout %ss;\n", timeout
        printf "        proxy_send_timeout %ss;\n", timeout
        done = 1
        in_api = 0
    }
    { print }
' "$VHOST" > "$PATCHED"

# Prove the edit landed in the right block before anything is installed: an
# unmatched closing brace upstream would otherwise corrupt the vhost silently.
if ! grep -A20 'location /api/' "$PATCHED" | grep -q "proxy_read_timeout ${TIMEOUT_SECONDS}s;"; then
    die "could not place the directives inside the 'location /api/' block — $VHOST is unchanged."
fi
ORIG_LINES=$(grep -c '' "$VHOST")
PATCHED_LINES=$(grep -c '' "$PATCHED")
if [ "$PATCHED_LINES" -ne $((ORIG_LINES + 2)) ]; then
    die "expected exactly two added lines, got $((PATCHED_LINES - ORIG_LINES)) — $VHOST is unchanged."
fi
# Stronger than a line count: strip the two directives back out and the result
# must be the original file, so nothing else can have moved. (The original may
# lack a final newline; `echo` normalises that on both sides.)
if ! diff <(cat "$VHOST"; echo) \
    <(sed -e '/^[[:space:]]*proxy_read_timeout /d' \
            -e '/^[[:space:]]*proxy_send_timeout /d' "$PATCHED") >/dev/null; then
    die "the patch touched lines outside 'location /api/' — $VHOST is unchanged."
fi

if [ "$APPLY" != "1" ]; then
    echo
    echo "--- what would change (dry run; pass --apply to write it) ---"
    diff -u "$VHOST" "$PATCHED" || true
    echo "--- end of diff ---"
    echo
    echo "The certbot-managed 443 block and every other line are left untouched."
    exit 0
fi

[ "$(id -u)" = "0" ] || die "run this with --apply as root: sudo bash $0 --apply"

BACKUP="$VHOST.bak.$(date +%Y%m%d-%H%M%S)"
cp "$VHOST" "$BACKUP"
cp "$PATCHED" "$VHOST"

if nginx -t; then
    systemctl reload nginx
    echo
    echo "Done. nginx now waits ${TIMEOUT_SECONDS}s for /api/ (backup: $BACKUP)."
    grep -A20 'location /api/' "$VHOST" | grep -E 'proxy_read_timeout|proxy_send_timeout' | sed 's/^/  /'
else
    cp "$BACKUP" "$VHOST"
    die "the patched vhost did not pass 'nginx -t' — restored $BACKUP"
fi
