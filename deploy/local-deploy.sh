#!/bin/bash
#
# Deploy Dlea from this machine to the production server.
#
# This is the *nix sibling of deploy/local-deploy.bat and does the same work in
# the same order, so the two cannot drift apart in the parts that matter:
#
#   1. npm run build              -> .output/ (the SSR server PM2 runs)
#   2. pip download               -> pip-wheels/ (offline wheels; the server has no PyPI)
#   3. tar the repo + those wheels, with a RELATIVE archive name
#   4. scp the archive and deploy/deploy.sh
#   5. ssh: run deploy.sh         -> extract, test, migrate, sync, restart, verify
#
# Every server-side step lives in deploy/deploy.sh, which is also what
# deploy/local-deploy.bat uploads — this script only builds and uploads.
#
# Keep the archive name relative: GNU tar (the tar in Git Bash) reads a
# drive-letter operand like C:\...\x.tar.gz as a "host:path" remote spec, fails
# with "Cannot connect to C: resolve failed" and produces no archive at all.
#
# Usage:  bash deploy/local-deploy.sh
set -euo pipefail

SERVER="${SERVER:-ghafari@37.255.212.55}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="${TMPDIR:-/tmp}"
ARCHIVE="$TMP/dlea-deploy.tar.gz"
WHEELS="$REPO_DIR/pip-wheels"

PYTHON="$(command -v python3 || command -v python || true)"
if [ -z "$PYTHON" ]; then
    echo "python3 is required to download the server's wheels" >&2
    exit 1
fi

cleanup() {
    rm -f "$ARCHIVE"
    rm -rf "$WHEELS"
    [ -n "${WHEEL_ENV_DIR:-}" ] && rm -rf "$WHEEL_ENV_DIR"
}
trap cleanup EXIT

echo "=========================================="
echo "Dlea deployment  ->  $SERVER"
echo "=========================================="

echo
echo "Step 1: Building frontend..."
cd "$REPO_DIR"
npm run build
echo "Frontend built."

echo
echo "Step 2: Downloading pip packages for Linux (Python 3.12)..."
WHEEL_ENV_DIR="$(mktemp -d)"
"$PYTHON" -m venv "$WHEEL_ENV_DIR/venv"
PIP="$WHEEL_ENV_DIR/venv/bin/pip"
[ -x "$PIP" ] || PIP="$WHEEL_ENV_DIR/venv/Scripts/pip.exe"   # Git Bash on Windows
rm -rf "$WHEELS"
mkdir -p "$WHEELS"
"$PIP" install --upgrade pip -q 2>/dev/null || true

download_wheels() {
    "$PIP" download -r "$REPO_DIR/backend/requirements.txt" typing-extensions -d "$WHEELS" "$@"
}
download_wheels --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 \
    --platform any --python-version 312 --only-binary=:all: ||
    download_wheels --python-version 312 ||
    download_wheels --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 \
        --platform any --python-version 312 --only-binary=:all: -i https://mirrors.aliyun.com/pypi/simple/

echo "Downloaded $(find "$WHEELS" -name '*.whl' | wc -l) packages"
"$PYTHON" "$REPO_DIR/deploy/check_wheels.py" "$WHEELS" "$REPO_DIR/backend/requirements.txt"

echo
echo "Step 3: Creating deployment archive..."
rm -f "$ARCHIVE"
(cd "$TMP" && tar czf dlea-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.tanstack \
    --exclude=.git \
    --exclude=.freebuff \
    --exclude='*.log' \
    --exclude=backend/.venv \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude=backend/db.sqlite3 \
    --exclude=test-results \
    --exclude=smoke-test \
    -C "$REPO_DIR" .)
if [ ! -s "$ARCHIVE" ]; then
    echo "Archive was not created — refusing to continue." >&2
    exit 1
fi
echo "Archive created: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

echo
echo "Step 4: Uploading to server..."
scp -q "$ARCHIVE" "$SERVER:/tmp/" || { echo "Uploading the archive failed." >&2; exit 1; }
scp -q "$REPO_DIR/deploy/deploy.sh" "$SERVER:/tmp/" || { echo "Uploading deploy.sh failed." >&2; exit 1; }
echo "Upload OK."

echo
echo "Step 5: Deploying on server..."
ssh "$SERVER" "sed -i 's/\r\$//' /tmp/deploy.sh && bash /tmp/deploy.sh"

echo
echo "=========================================="
echo "Done! https://dlea.piqagram.ir"
echo "=========================================="
