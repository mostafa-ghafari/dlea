#!/bin/bash
#
# One-time provisioning for the Dlea server (ghafari@37.255.212.55).
#
# Reality of this host, which this script must respect:
#   * it is shared with other sites (other vhosts on :443, one app on :8000);
#   * Dlea's processes are owned by PM2, not systemd — there are no systemd
#     units for Dlea and installing any would collide with the neighbouring
#     sites' ports;
#   * the code that runs is the "running directory" /var/www/dlea.piqagram.ir,
#     kept in sync with the newest release under ~/dlea/releases by
#     deploy/deploy.sh;
#   * nginx only has to proxy plain HTTP on :80 (ArvanCloud terminates TLS).
#
# Safe to re-run: it installs only what is missing, refuses to overwrite an
# existing vhost unless you pass --force (and backs it up first), and never
# touches another site's files.
#
# Usage:  sudo bash deploy/setup-server.sh [--force]
set -euo pipefail

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

DEPLOY_USER="${DEPLOY_USER:-ghafari}"
SITE_HOST="${SITE_HOST:-dlea.piqagram.ir}"
BACKEND_PORT="${BACKEND_PORT:-8002}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
RUNNING_DIR="${RUNNING_DIR:-/var/www/$SITE_HOST}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

say() { printf '\n=== %s ===\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

if [ "$(id -u)" != "0" ]; then
    echo "Run this with sudo: sudo bash $0" >&2
    exit 1
fi

DEPLOY_HOME="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
if [ -z "$DEPLOY_HOME" ]; then
    echo "No such user: $DEPLOY_USER" >&2
    exit 1
fi

say "Packages (only what is missing)"
if have apt-get; then
    missing=()
    have node    || missing+=(nodejs)
    have python3 || missing+=(python3 python3-venv python3-pip)
    have nginx   || missing+=(nginx)
    if [ "${#missing[@]}" -gt 0 ]; then
        apt-get update -qq
        apt-get install -y "${missing[@]}"
    else
        echo "node, python3 and nginx are already installed — nothing to do"
    fi
else
    echo "apt-get not found; install nodejs, python3 and nginx yourself"
fi
have node    && echo "node:    $(node -v)"
have nginx   && echo "nginx:   $(nginx -v 2>&1)"
have python3 && echo "python3: $(python3 -V)"

if have node; then
    node_major="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
    if [ "$node_major" -lt 22 ]; then
        echo "!! Node $node_major is older than the 22 this app is built for." >&2
    fi
fi

say "Directories"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_HOME/dlea/releases"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$RUNNING_DIR"
echo "releases: $DEPLOY_HOME/dlea/releases"
echo "running : $RUNNING_DIR (deploy keeps backend/, config/ and .output/ here)"

say "PM2"
if have pm2; then
    if ! systemctl is-enabled "pm2-$DEPLOY_USER" >/dev/null 2>&1; then
        pm2 startup systemd -u "$DEPLOY_USER" --hp "$DEPLOY_HOME" || true
    fi
    echo "boot service: $(systemctl is-enabled "pm2-$DEPLOY_USER" 2>/dev/null || echo 'NOT enabled')"
    echo "app definitions are created by starting the apps as $DEPLOY_USER, then: pm2 save"
    su - "$DEPLOY_USER" -c 'pm2 list' 2>/dev/null || true
else
    echo "!! pm2 is not installed. Install it as $DEPLOY_USER (npm i -g pm2) and re-run." >&2
fi

say "nginx vhost for $SITE_HOST"
# This host keeps the file directly in sites-enabled; writing to sites-available
# and symlinking it as well would load two server blocks for the same name.
LIVE_VHOST="/etc/nginx/sites-enabled/$SITE_HOST"
REPO_VHOST="$REPO_DIR/deploy/nginx-dlea.conf"

if [ ! -f "$REPO_VHOST" ]; then
    echo "!! $REPO_VHOST is missing" >&2
    exit 1
fi

if [ -e "$LIVE_VHOST" ]; then
    if diff -q "$REPO_VHOST" "$LIVE_VHOST" >/dev/null 2>&1; then
        echo "$LIVE_VHOST already matches deploy/nginx-dlea.conf — leaving it alone"
    elif [ "$FORCE" = "1" ]; then
        BACKUP_DIR="/etc/nginx/dlea-backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -p "$LIVE_VHOST" "$BACKUP_DIR/"
        echo "backed up the current vhost to $BACKUP_DIR/"
        cp "$REPO_VHOST" "$LIVE_VHOST"
        echo "installed deploy/nginx-dlea.conf"
    else
        echo "$LIVE_VHOST differs from the copy in the repo — NOT overwriting it."
        echo "Review the difference with:  diff $REPO_VHOST $LIVE_VHOST"
        echo "and re-run with --force only if the change is intended."
    fi
else
    cp "$REPO_VHOST" "$LIVE_VHOST"
    echo "installed $LIVE_VHOST"
fi

if have nginx; then
    if nginx -t; then
        systemctl reload nginx
        echo "nginx reloaded"
    else
        echo "!! nginx -t failed — NOT reloading, so the running config stays live." >&2
        exit 1
    fi
fi

say "Reality check"
echo "ports (expect gunicorn on $BACKEND_PORT, node on $FRONTEND_PORT, nginx on :80):"
(ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null) | grep -E "[:.]($BACKEND_PORT|$FRONTEND_PORT|80)[[:space:]]" || true

api_code="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SITE_HOST" "http://127.0.0.1/api/plans/" || echo 000)"
front_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$FRONTEND_PORT/" || echo 000)"
echo "API through nginx: HTTP $api_code (200 = healthy)"
echo "frontend direct  : HTTP $front_code (200 = healthy)"
if [ "$api_code" != "200" ] || [ "$front_code" != "200" ]; then
    echo "A service is not answering yet — deploy the app (deploy/local-deploy.bat or"
    echo "deploy/local-deploy.sh) and check 'pm2 list' / 'pm2 logs dlea-api'."
fi

say "Done"
echo "Next: deploy the code with deploy/local-deploy.bat (Windows) or deploy/local-deploy.sh,"
echo "then keep ~/.pm2/dump.pm2 current with 'pm2 save' after changing app definitions."
