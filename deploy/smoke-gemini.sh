#!/bin/bash
#
# Gemini smoke test: can this server actually reach Gemini, and through which path?
#
# Runs deploy/smoke_gemini.py against the environment the app itself loads
# (backend/.env). On the server it runs it right there; from a workstation it
# uploads the checker and runs it there, because the answer depends on *that*
# host's IP and proxy settings, not yours.
#
#   bash deploy/smoke-gemini.sh                       # key, direct path, relay, one real report
#   bash deploy/smoke-gemini.sh --all-models          # + try every model in the UI list
#   bash deploy/smoke-gemini.sh --site https://dlea.piqagram.ir \
#        --email you@example.com --password '…'       # + the deployed app's own env
#   SERVER=user@host APP_DIR=/var/www/site bash deploy/smoke-gemini.sh
#
# Nothing is written anywhere: no report is saved and no database row is touched.
# The only side effect is a few small real requests to Google, one of them a real
# generation (step 5 also spends one request of that account's AI quota).
#
# Exit code 0 means every critical check passed.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKER="$SCRIPT_DIR/smoke_gemini.py"
SERVER="${SERVER:-ghafari@37.255.212.55}"
APP_DIR="${APP_DIR:-/var/www/dlea.piqagram.ir}"
BACKEND_DIR="$APP_DIR/backend"
LOCAL_PY="$BACKEND_DIR/.venv/bin/python"

if [ ! -f "$CHECKER" ]; then
    echo "smoke_gemini.py is missing next to this script." >&2
    exit 1
fi

ARGS=("$@")

echo "=========================================="
echo "Dlea Gemini smoke test"
echo "mode: live — real requests to Google, nothing written"
echo "=========================================="

if [ -x "$LOCAL_PY" ]; then
    echo "Running on this host: $BACKEND_DIR"
    cd "$BACKEND_DIR" || exit 1
    DLEA_BACKEND_DIR="$BACKEND_DIR" "$LOCAL_PY" "$CHECKER" ${ARGS[@]+"${ARGS[@]}"}
    exit $?
fi

REMOTE_CHECKER="/tmp/smoke_gemini.py"
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
