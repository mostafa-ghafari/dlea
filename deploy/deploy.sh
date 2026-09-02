#!/bin/bash
set -e

echo "=== Dlea Deployment ==="

DEPLOY_DIR="$HOME/dlea"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_DIR/current"

mkdir -p "$DEPLOY_DIR/releases"

echo "Extracting..."
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"
tar xzf /tmp/dlea-deploy.tar.gz

echo "Setting up backend..."
cd backend
python3 -m venv .venv 2>/dev/null || true
.venv/bin/pip install --upgrade pip -q 2>/dev/null || true
.venv/bin/pip install -r requirements.txt -q

echo "Running migrations..."
.venv/bin/python manage.py migrate --noinput

cd "$DEPLOY_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

rm -f /tmp/dlea-deploy.tar.gz /tmp/deploy.sh

echo "=== Deployment complete ==="
echo "Release: $RELEASE_DIR"
echo "Current: $CURRENT_LINK"
