#!/bin/bash
set -e

# ============================================
# Local Deploy Script for Dlea
# Run this from your local machine (MCI network)
# ============================================

SERVER="ghafari@37.255.212.55"
REMOTE_DIR="/opt/dlea"

echo "=========================================="
echo "Dlea Local Deployment"
echo "=========================================="

# Step 1: Build frontend locally
echo ""
echo "Step 1: Building frontend..."
npm ci 2>/dev/null || npm install
npm run build
echo "Frontend built successfully!"

# Step 2: Create deployment archive
echo ""
echo "Step 2: Building pip wheels for offline install..."
WHEELS_DIR="/tmp/pip-wheels"
rm -rf "$WHEELS_DIR"
mkdir -p "$WHEELS_DIR"
python3 -m venv /tmp/dlea-wheel-env 2>/dev/null || true
/tmp/dlea-wheel-env/bin/pip install --upgrade pip -q 2>/dev/null || true
/tmp/dlea-wheel-env/bin/pip wheel -r backend/requirements.txt -w "$WHEELS_DIR" -q
echo "Built $(ls "$WHEELS_DIR"/*.whl 2>/dev/null | wc -l) wheels"

echo ""
echo "Step 3: Creating deployment archive..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar czf /tmp/dlea-deploy-$TIMESTAMP.tar.gz \
  --exclude='node_modules' \
  --exclude='.output' \
  --exclude='.tanstack' \
  --exclude='backend/.venv' \
  --exclude='backend/__pycache__' \
  --exclude='*.pyc' \
  --exclude='backend/db.sqlite3' \
  --exclude='.git' \
  --exclude='.freebuff' \
  -C /tmp pip-wheels \
  .
echo "Archive created: /tmp/dlea-deploy-$TIMESTAMP.tar.gz"
rm -rf "$WHEELS_DIR" /tmp/dlea-wheel-env

# Step 3: Upload to server
echo ""
echo "Step 4: Uploading to server..."
scp /tmp/dlea-deploy-$TIMESTAMP.tar.gz $SERVER:/tmp/
echo "Upload complete!"

# Step 4: Deploy on server
echo ""
echo "Step 5: Deploying on server..."
ssh $SERVER << 'SERVEREOF'
set -e
DEPLOY_DIR="/opt/dlea"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_DIR/current"
SHARED_DIR="$DEPLOY_DIR/shared"

echo "Creating release directory..."
mkdir -p "$RELEASE_DIR" "$SHARED_DIR"

cd "$RELEASE_DIR"
echo "Extracting archive..."
tar xzf /tmp/dlea-deploy-*.tar.gz
rm -f /tmp/dlea-deploy-*.tar.gz

# Symlink shared env
if [ -f "$SHARED_DIR/backend/.env" ]; then
  ln -sf "$SHARED_DIR/backend/.env" "$RELEASE_DIR/backend/.env"
fi

# Backend setup
echo "Setting up backend..."
cd backend
python3 -m venv .venv 2>/dev/null || true
.venv/bin/pip install --upgrade pip -q 2>/dev/null || true
if [ -d "../pip-wheels" ] && ls ../pip-wheels/*.whl >/dev/null 2>&1; then
  echo "Installing from local wheels (offline)..."
  .venv/bin/pip install --no-index --find-links ../pip-wheels -r requirements.txt -q
else
  echo "No local wheels found, falling back to PyPI..."
  .venv/bin/pip install -r requirements.txt -q
fi

# Migrations
echo "Running migrations..."
.venv/bin/python manage.py migrate --noinput

# Symlink release
cd "$DEPLOY_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

# Restart services
echo "Restarting services..."
systemctl restart dlea-backend 2>/dev/null || true
systemctl restart dlea-frontend 2>/dev/null || true
systemctl reload nginx 2>/dev/null || true

echo "Deployment complete on server!"
SERVEREOF

# Cleanup
rm -f /tmp/dlea-deploy-$TIMESTAMP.tar.gz

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "https://dlea.piqagram.ir"
echo "=========================================="
