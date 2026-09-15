#!/bin/bash
#
# Payment smoke test: does the money path still work?
#
# Runs deploy/smoke_payment.py against a running backend. On the server it runs
# it right there; from a workstation it uploads the checker and runs it there,
# because the checks read the database the app actually uses.
#
#   bash deploy/smoke-payment.sh --dry-run     # config, routing and gateway only
#   bash deploy/smoke-payment.sh               # + a throwaway order, cleaned up after
#   bash deploy/smoke-payment.sh --keep        # leave the order/user for inspection
#   SITE=https://dlea.piqagram.ir bash deploy/smoke-payment.sh
#   SERVER=user@host APP_DIR=/var/www/site bash deploy/smoke-payment.sh
#
# A full run writes exactly two things on the target host — one pending order and
# one user, both recognisable as `smoke-payment@…` — and removes them again
# unless --keep is passed. No money moves: with the sandbox merchant code the
# gateway never charges anything, and even with a real merchant this script only
# opens a session and probes the return trip.
#
# Exit code 0 means every critical check passed.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKER="$SCRIPT_DIR/smoke_payment.py"
SERVER="${SERVER:-ghafari@37.255.212.55}"
APP_DIR="${APP_DIR:-/var/www/dlea.piqagram.ir}"
BACKEND_DIR="$APP_DIR/backend"
LOCAL_PY="$BACKEND_DIR/.venv/bin/python"

if [ ! -f "$CHECKER" ]; then
    echo "smoke_payment.py is missing next to this script." >&2
    exit 1
fi

ARGS=("$@")
if [ -n "${SITE:-}" ]; then
    ARGS+=(--site "$SITE")
fi

DRY_RUN=0
for arg in ${ARGS[@]+"${ARGS[@]}"}; do
    [ "$arg" = "--dry-run" ] && DRY_RUN=1
done

echo "=========================================="
echo "Dlea payment smoke test"
if [ "$DRY_RUN" = "1" ]; then
    echo "mode: dry-run — nothing is written anywhere"
else
    echo "mode: full — one test order + one test user, deleted at the end"
    echo "      (the sandbox merchant charges nothing; a real one is only asked"
    echo "       to open a session, which this script then abandons)"
fi
echo "=========================================="

if [ -x "$LOCAL_PY" ]; then
    echo "Running on this host: $BACKEND_DIR"
    cd "$BACKEND_DIR" || exit 1
    DLEA_BACKEND_DIR="$BACKEND_DIR" "$LOCAL_PY" "$CHECKER" ${ARGS[@]+"${ARGS[@]}"}
    exit $?
fi

REMOTE_CHECKER="/tmp/smoke_payment.py"
echo "Uploading the checker to $SERVER..."
scp -q "$CHECKER" "$SERVER:$REMOTE_CHECKER" || {
    echo "Uploading the checker failed." >&2
    exit 1
}

QUOTED_ARGS=""
for arg in ${ARGS[@]+"${ARGS[@]}"}; do
    QUOTED_ARGS="$QUOTED_ARGS $(printf '%q' "$arg")"
done

# sed strips CRLF: this script is edited on Windows. The checker also strips its
# own output encoding, and the temp copy is removed even when the run fails.
ssh "$SERVER" "cd '$BACKEND_DIR' && sed -i 's/\r\$//' '$REMOTE_CHECKER' && DLEA_BACKEND_DIR='$BACKEND_DIR' .venv/bin/python '$REMOTE_CHECKER'$QUOTED_ARGS; rc=\$?; rm -f '$REMOTE_CHECKER'; exit \$rc"
exit $?
