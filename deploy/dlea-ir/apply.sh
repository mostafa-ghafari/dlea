#!/usr/bin/env bash
# =============================================================================
# dlea-ir/apply.sh — put dlea.ir (app) + blog.dlea.ir (WordPress) on this VPS.
#
# Run ON 37.255.212.62, as root (or via sudo), AFTER:
#   1. dlea.ir is renewed at Netafraz (so NS can be changed), and
#   2. ns1.dlea.ir / ns2.dlea.ir are registered at IRNIC and the zone is
#      delegated to them.
#
# It is idempotent — safe to re-run. Each stage is separate:
#   ./apply.sh bind     # install + configure bind9, install the dlea.ir zone
#   ./apply.sh nginx    # install the nginx vhosts for dlea.ir + blog.dlea.ir
#   ./apply.sh blog     # bring up the WordPress + MariaDB containers
#   ./apply.sh cert     # run certbot for both hosts (needs DNS live)
#   ./apply.sh all      # bind + nginx (+ blog if its .env exists)
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_IP="37.255.212.62"
CERT_EMAIL="${CERT_EMAIL:-admin@dlea.ir}"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!!  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31mxx  %s\033[0m\n' "$*" >&2; exit 1; }

require_root() { [ "$(id -u)" = 0 ] || die "run as root: sudo $0 $*"; }

dns_points_here() {
  local host="$1"
  getent hosts "$host" 2>/dev/null | awk '{print $1}' | grep -qx "$PUBLIC_IP"
}

# ---------------------------------------------------------------- bind9 -----
do_bind() {
  require_root
  if command -v named >/dev/null 2>&1; then
    log "bind9 already installed — $(named -v | head -1)"
  else
    log "installing bind9"
    # This box's vendor apt repos are broken (webmin has an invalid DSA key,
    # archive.ubuntu.com is unreachable from Iran). Use the ArvanCloud mirror
    # only, via a throwaway sourceparts dir, so apt cannot hang or fail.
    mkdir -p /tmp/empty-aptparts
    local APT_OPTS=(
      -o Dir::Etc::sourceparts=/tmp/empty-aptparts
      -o Dir::Etc::sourcelist=/etc/apt/sources.list
      -o Acquire::http::Timeout=20 -o Acquire::Retries=1
      -o Acquire::ForceIPv4=true -o APT::Get::List-Cleanup=0
    )
    apt-get "${APT_OPTS[@]}" update -qq
    DEBIAN_FRONTEND=noninteractive apt-get "${APT_OPTS[@]}" install -y -qq \
      bind9 bind9-utils bind9-dnsutils
  fi

  log "installing global options (listens on $PUBLIC_IP only)"
  install -m 0644 "$HERE/bind/named.conf.options" /etc/bind/named.conf.options

  log "installing zone db.dlea.ir"
  install -d -m 0755 /etc/bind/zones
  install -m 0644 "$HERE/bind/db.dlea.ir" /etc/bind/zones/db.dlea.ir

  log "declaring the zone in named.conf.local (idempotent)"
  touch /etc/bind/named.conf.local
  if ! grep -q 'zone "dlea.ir"' /etc/bind/named.conf.local; then
    cat "$HERE/bind/named.conf.local.snippet" >> /etc/bind/named.conf.local
  else
    echo "   already declared, leaving as-is"
  fi

  log "validating configuration"
  named-checkconf
  named-checkzone dlea.ir /etc/bind/zones/db.dlea.ir

  log "opening the firewall for DNS"
  if ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow 53/tcp
    ufw allow 53/udp
  else
    warn "ufw not active — make sure port 53 is open in whatever firewall is in use"
  fi

  # NB: bind9.service is an alias of named.service on Ubuntu — enabling the
  # alias is refused, so always address the unit as `named`.
  log "starting/reloading named"
  systemctl enable --now named
  systemctl restart named
  systemctl --no-pager --quiet is-active named && echo "   named active"

  log "local query test"
  dig +short @127.0.0.1 dlea.ir A || true
  echo "   (public IP is NAT'd; a full external test needs the port forwarded)"
}

# ---------------------------------------------------------------- nginx -----
do_nginx() {
  require_root
  log "installing nginx vhosts"
  install -m 0644 "$HERE/nginx/dlea.ir.conf"      /etc/nginx/sites-available/dlea.ir
  install -m 0644 "$HERE/nginx/blog.dlea.ir.conf" /etc/nginx/sites-available/blog.dlea.ir
  ln -sfn /etc/nginx/sites-available/dlea.ir      /etc/nginx/sites-enabled/dlea.ir
  ln -sfn /etc/nginx/sites-available/blog.dlea.ir /etc/nginx/sites-enabled/blog.dlea.ir

  log "testing + reloading nginx"
  nginx -t
  systemctl reload nginx
  echo "   nginx reloaded"
}

# ----------------------------------------------------------------- blog -----
do_blog() {
  require_root
  [ -f "$HERE/blog/.env" ] || die "create $HERE/blog/.env first (copy blog/.env.example)"
  # The stack is `docker run` based: this box has no compose v2 and its
  # docker-compose v1 (1.29.2) fails with KeyError: 'ContainerConfig'.
  # restore.sh owns the whole sequence (network, MariaDB, files, wp-config,
  # dump import, container, host rewrite) and is idempotent.
  log "restoring WordPress + MariaDB via blog/restore.sh"
  ( cd "$HERE/blog" && bash restore.sh )
}

# ----------------------------------------------------------------- cert -----
do_cert() {
  require_root
  log "checking DNS before requesting certificates"
  local ok=1
  for h in dlea.ir www.dlea.ir dev.dlea.ir blog.dlea.ir; do
    if dns_points_here "$h"; then echo "   ok    $h -> $PUBLIC_IP"; else echo "   WAIT  $h does not point here yet"; ok=0; fi
  done
  [ "$ok" = 1 ] || { warn "DNS not ready — fix records, wait for TTL, then re-run: $0 cert"; return 1; }

  log "requesting certificates"
  certbot --nginx --redirect --agree-tos -n -m "$CERT_EMAIL" \
    -d dlea.ir -d www.dlea.ir -d dev.dlea.ir
  certbot --nginx --redirect --agree-tos -n -m "$CERT_EMAIL" \
    -d blog.dlea.ir
  nginx -t && systemctl reload nginx
  echo "   certificates issued"
}

case "${1:-all}" in
  bind)  do_bind ;;
  nginx) do_nginx ;;
  blog)  do_blog ;;
  cert)  do_cert ;;
  all)   do_bind; do_nginx; do_blog; warn "run '$0 cert' once DNS is live" ;;
  *)     die "unknown stage '$1' (use: bind | nginx | blog | cert | all)" ;;
esac
