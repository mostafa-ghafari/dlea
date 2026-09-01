#!/bin/bash
set -e

echo "🚀 Starting Dlea deployment..."

DEPLOY_DIR="/opt/dlea"
RELEASE_DIR="$DEPLOY_DIR/releases/$(date +%Y%m%d_%H%M%S)"
CURRENT_LINK="$DEPLOY_DIR/current"
SHARED_DIR="$DEPLOY_DIR/shared"

# Create directories
mkdir -p "$DEPLOY_DIR" "$SHARED_DIR"

# Extract release
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"
tar xzf /tmp/dlea-deploy/deploy.tar.gz
rm -f /tmp/dlea-deploy/deploy.tar.gz

# Symlink shared env files
ln -sf "$SHARED_DIR/.env" "$RELEASE_DIR/backend/.env" 2>/dev/null || true

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd "$RELEASE_DIR"
npm ci --production=false

echo "🔨 Building frontend..."
npm run build

# Backend setup
echo "🐍 Setting up backend..."
cd "$RELEASE_DIR/backend"
python3 -m venv .venv 2>/dev/null || true
.venv/bin/pip install --upgrade pip -q 2>/dev/null || true

if [ -f requirements.txt ]; then
  .venv/bin/pip install -r requirements.txt -q
else
  .venv/bin/pip install django djangorestframework django-cors-headers drf-spectacular djangorestframework-simplejwt python-dotenv psycopg2-binary gunicorn -q
fi

# Run migrations
echo "🗄️ Running database migrations..."
.venv/bin/python manage.py migrate --noinput

echo "✅ Release $RELEASE_DIR ready!"
