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

echo "Installing frontend dependencies..."
cd "$RELEASE_DIR"
npm install --production=false 2>&1 | tail -3

echo "Restarting backend (Gunicorn)..."
kill $(pgrep -f "gunicorn.*config.wsgi") 2>/dev/null || true
sleep 1
cd "$RELEASE_DIR/backend"
nohup .venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120 > /tmp/gunicorn.log 2>&1 &
sleep 2

echo "Restarting frontend (Node.js)..."
kill $(pgrep -f "node.*start") 2>/dev/null || true
kill $(pgrep -f "node.*index.mjs") 2>/dev/null || true
sleep 1
cd "$RELEASE_DIR"
nohup node .output/server/index.mjs > /tmp/frontend.log 2>&1 &
sleep 2

# Verify services
BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/auth/login/ -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")

rm -f /tmp/dlea-deploy.tar.gz /tmp/deploy.sh

echo "=== Deployment complete ==="
echo "Release: $RELEASE_DIR"
echo "Current: $CURRENT_LINK"
echo "Backend (port 8000): HTTP $BACKEND_OK"
echo "Frontend (port 3000): HTTP $FRONTEND_OK"
