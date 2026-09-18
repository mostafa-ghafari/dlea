#!/usr/bin/env bash
# ── Dlea AI — Docker Deployment Script ─────────────────────────────
# Run on the server as the deploy user (ghafari).
# Usage: bash deploy/docker-deploy.sh
set -euo pipefail

SITE_HOST="${SITE_HOST:-dlea.piqagram.ir}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/ghafari/dlea}"
RELEASE_DIR="$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "  Dlea Docker Deployment"
echo "  $(date)"
echo "=========================================="

# ── 1. Stop old PM2 processes ──────────────────────────────────────
echo ""
echo "[1/6] Stopping old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 save --force 2>/dev/null || true
echo "  ✅ PM2 stopped"

# ── 2. Stop old Docker containers if any ──────────────────────────
echo ""
echo "[2/6] Stopping old Docker containers..."
cd "$DEPLOY_DIR"
docker compose down 2>/dev/null || true
echo "  ✅ Old containers stopped"

# ── 3. Build and start Docker stack ───────────────────────────────
echo ""
echo "[3/6] Building and starting Docker stack..."
docker compose up -d --build
echo "  ✅ Containers started"

# ── 4. Wait for PostgreSQL to be healthy ──────────────────────────
echo ""
echo "[4/6] Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U dlea -d dlea >/dev/null 2>&1; then
        echo "  ✅ PostgreSQL is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "  ❌ PostgreSQL failed to start"
        docker compose logs db
        exit 1
    fi
    sleep 1
done

# ── 5. Wait for backend to be healthy ─────────────────────────────
echo ""
echo "[5/6] Waiting for backend..."
for i in $(seq 1 30); do
    if docker compose exec -T backend curl -sf http://localhost:8002/api/ >/dev/null 2>&1; then
        echo "  ✅ Backend is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "  ❌ Backend failed to start"
        docker compose logs backend
        exit 1
    fi
    sleep 1
done

# ── 6. Run migrations ────────────────────────────────────────────
echo ""
echo "[6/6] Running migrations..."
docker compose exec -T backend python manage.py migrate --noinput
echo "  ✅ Migrations complete"

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  ✅ Deployment complete!"
echo ""
echo "  Site:   https://$SITE_HOST"
echo "  API:    https://$SITE_HOST/api/"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f          # tail all logs"
echo "    docker compose logs -f backend  # tail backend only"
echo "    docker compose ps               # container status"
echo "    docker compose restart          # restart all"
echo "=========================================="
