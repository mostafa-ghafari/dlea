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

# Also sync to the running directory so gunicorn picks up changes
echo "Syncing to running directory..."
if [ -d "$RUNNING_DIR/backend" ]; then
    cp "$RELEASE_DIR/backend/api/models.py" "$RUNNING_DIR/backend/api/models.py"
    cp "$RELEASE_DIR/backend/api/views.py" "$RUNNING_DIR/backend/api/views.py"
    cp "$RELEASE_DIR/backend/api/serializers.py" "$RUNNING_DIR/backend/api/serializers.py"
    cp "$RELEASE_DIR/backend/api/gemini.py" "$RUNNING_DIR/backend/api/gemini.py"
    cp "$RELEASE_DIR/backend/api/jutils.py" "$RUNNING_DIR/backend/api/jutils.py"
    cp "$RELEASE_DIR/backend/api/auth_views.py" "$RUNNING_DIR/backend/api/auth_views.py"
    cp "$RELEASE_DIR/backend/api/mt_views.py" "$RUNNING_DIR/backend/api/mt_views.py"
    cp "$RELEASE_DIR/backend/config/settings.py" "$RUNNING_DIR/backend/config/settings.py"
    cp -r "$RELEASE_DIR/backend/api/management/commands/"*.py "$RUNNING_DIR/backend/api/management/commands/"
    cp -r "$RELEASE_DIR/backend/api/migrations/"*.py "$RUNNING_DIR/backend/api/migrations/"
fi

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
