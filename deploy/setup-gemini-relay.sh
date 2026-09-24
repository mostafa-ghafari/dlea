#!/bin/bash
#
# One-time setup for the Gemini relay, run on a *foreign* VPS — the German box,
# not the Iranian server that runs Dlea.
#
# Why it exists: Google answers requests from Iranian IPs with a generic HTML 403
# page that never reaches the API, so the coach cannot reach Gemini from the
# Iranian host at all. No account, VPN or proxy protocol is involved — the relay
# simply takes the whole Google URL as its *path* and forwards it, which is the
# shape backend/api/gemini.py already speaks once GEMINI_PROXY is set:
#
#   https://<relay-host>:9090/https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=…
#
# Two things this box must never become, and a hand-copied version of the nginx
# block in DEPLOYMENT-RUNBOOK.md is both:
#   * an open proxy — here only the Gemini host is forwarded, everything else is
#     404, so a leaked address cannot be pointed at arbitrary sites;
#   * usable by strangers — by default only the Iranian server's IP may connect,
#     because otherwise anyone can borrow this box's clean egress.
#
# Safe to re-run: it creates only what is missing and will not overwrite an
# existing relay vhost unless you pass --force (and it backs it up first).
#
# Usage:
#   sudo bash deploy/setup-gemini-relay.sh --host relay.example.com --email you@example.com
#   sudo bash deploy/setup-gemini-relay.sh --host relay.example.com --allow 1.2.3.4
#   sudo bash deploy/setup-gemini-relay.sh --host relay.example.com --open   # no allowlist
#
# Requirements:
#   * a DNS A record for --host pointing at THIS machine. TLS is not optional:
#     the Gemini API key travels inside the forwarded URL, so plain HTTP would
#     leak it in transit.
#   * port 80 reachable from the internet the first time, so Let's Encrypt can
#     validate the domain.
set -euo pipefail

RELAY_HOST=""
RELAY_PORT="${RELAY_PORT:-9090}"
CERT_EMAIL=""
FORCE=0
OPEN=0
ALLOWS=()
# The Iranian server that runs the app; without an allowlist entry for it the
# relay answers 403 to the only caller that matters.
DEFAULT_ALLOW="${DEFAULT_ALLOW:-37.255.212.55}"

CONF_PATH="/etc/nginx/conf.d/dlea-gemini-relay.conf"
GEMINI_HOST="generativelanguage.googleapis.com"

say() { printf '\n=== %s ===\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }
die() {
    echo "ERROR: $*" >&2
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        --host) RELAY_HOST="${2:-}"; shift 2 ;;
        --port) RELAY_PORT="${2:-}"; shift 2 ;;
        --email) CERT_EMAIL="${2:-}"; shift 2 ;;
        --allow) ALLOWS+=("${2:-}"); shift 2 ;;
        --open) OPEN=1; shift ;;
        --force) FORCE=1; shift ;;
        -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
        *) die "unknown argument: $1 (try --help)" ;;
    esac
done

[ "$(id -u)" = "0" ] || die "run this with sudo: sudo bash $0 --host relay.example.com"
[ -n "$RELAY_HOST" ] || die "--host is required (a DNS name pointing at this machine)"
[ "${#ALLOWS[@]}" -gt 0 ] || ALLOWS=("$DEFAULT_ALLOW")

CERT_DIR="/etc/letsencrypt/live/$RELAY_HOST"
FULLCHAIN="$CERT_DIR/fullchain.pem"
PRIVKEY="$CERT_DIR/privkey.pem"

say "Relay: $RELAY_HOST:$RELAY_PORT"

# ── DNS ──────────────────────────────────────────────────────────────────────
if have getent; then
    resolved="$(getent ahostsv4 "$RELAY_HOST" | awk 'NR==1{print $1}')"
    if [ -z "$resolved" ]; then
        die "$RELAY_HOST does not resolve. Point a DNS A record at this machine first."
    fi
    own_ip="$(curl -sS --max-time 10 https://api.ipify.org 2>/dev/null || true)"
    if [ -n "$own_ip" ] && [ "$resolved" != "$own_ip" ]; then
        echo "WARNING: $RELAY_HOST resolves to $resolved, but this machine sees itself as $own_ip."
        echo "         Let's Encrypt will validate against $resolved, so the certificate"
        echo "         will fail unless that address really is this box (a proxy/NAT this"
        echo "         script cannot see through would explain the difference)."
    fi
fi

# ── Packages ─────────────────────────────────────────────────────────────────
say "Packages (only what is missing)"
if ! have nginx; then
    if have apt-get; then
        apt-get update -qq
        apt-get install -y nginx
    else
        die "nginx is not installed and apt-get is unavailable; install nginx first"
    fi
else
    echo "nginx is already installed"
fi
if ! have curl; then
    have apt-get && apt-get install -y curl || die "curl is required"
fi

# ── Certificate ──────────────────────────────────────────────────────────────
# The API key rides in the forwarded URL, so the relay must be https. A bare IP
# cannot validate against a self-signed cert, which is why --host is mandatory.
if [ ! -f "$FULLCHAIN" ]; then
    say "TLS certificate for $RELAY_HOST"
    have certbot || {
        have apt-get && apt-get install -y certbot || die "certbot is required to obtain the certificate"
    }
    RESTART_NGINX=0
    if systemctl is-active --quiet nginx; then
        echo "Stopping nginx so certbot --standalone can use port 80..."
        systemctl stop nginx
        RESTART_NGINX=1
    fi

    CERTBOT_ARGS=(certonly --standalone --non-interactive --agree-tos --keep-until-expiring)
    if [ -n "$CERT_EMAIL" ]; then
        CERTBOT_ARGS+=(--email "$CERT_EMAIL")
    else
        CERTBOT_ARGS+=(--register-unsafely-without-email)
    fi
    CERTBOT_ARGS+=(-d "$RELAY_HOST")

    set +e
    certbot "${CERTBOT_ARGS[@]}"
    CERTBOT_RC=$?
    set -e

    if [ "$RESTART_NGINX" = "1" ]; then
        systemctl start nginx
    fi
    if [ "$CERTBOT_RC" != "0" ] || [ ! -f "$FULLCHAIN" ]; then
        die "certbot could not issue a certificate for $RELAY_HOST.
     Check that the A record points here and that port 80 is reachable from the
     internet, then run this script again."
    fi
else
    echo "Certificate already present: $FULLCHAIN"
fi

# ── Allowlist ────────────────────────────────────────────────────────────────
# Loopback stays allowed so this script's own self-test exercises the real path
# (TLS + forwarding) instead of being turned away at the door.
ALLOW_LINES="    allow 127.0.0.1;\n    allow ::1;"
if [ "$OPEN" = "1" ]; then
    ALLOW_LINES="    allow all;   # --open: anyone can borrow this egress"
    echo "WARNING: --open leaves the relay usable by any source IP."
else
    for ip in "${ALLOWS[@]}"; do
        ALLOW_LINES="$ALLOW_LINES\n    allow $ip;"
    done
fi

# ── Vhost ────────────────────────────────────────────────────────────────────
say "nginx vhost ($CONF_PATH)"

if [ -f "$CONF_PATH" ] && [ "$FORCE" != "1" ]; then
    if grep -qF "Managed by deploy/setup-gemini-relay.sh" "$CONF_PATH"; then
        echo "Replacing the relay vhost this script wrote earlier (config-only change)."
    else
        die "$CONF_PATH already exists and was not written by this script.
     Re-run with --force to replace it (a backup is taken first)."
    fi
fi

BACKUP=""
if [ -f "$CONF_PATH" ]; then
    BACKUP="$CONF_PATH.bak.$(date +%Y%m%d-%H%M%S)"
    cp "$CONF_PATH" "$BACKUP"
    echo "Backed up the previous vhost to $BACKUP"
fi

umask 022
{
    printf '# Managed by deploy/setup-gemini-relay.sh — edit that script, not this file.\n'
    printf '#\n'
    printf '# A URL-prefix forwarder for the Gemini API: the whole Google URL arrives as\n'
    printf '# the request *path* and is passed on unchanged.\n\n'
    printf 'server {\n'
    printf '    listen %s ssl;\n' "$RELAY_PORT"
    printf '    server_name %s;\n\n' "$RELAY_HOST"
    printf '    ssl_certificate     %s;\n' "$FULLCHAIN"
    printf '    ssl_certificate_key %s;\n' "$PRIVKEY"
    printf '    ssl_protocols TLSv1.2 TLSv1.3;\n\n'
    printf '    # The forwarded URL is the path, so its "//" must survive. Without this\n'
    printf '    # nginx collapses it to "/https:/…" and Google answers with the generic\n'
    printf '    # HTML 403 page — the exact symptom this relay exists to fix.\n'
    printf '    merge_slashes off;\n\n'
    printf '    # proxy_pass with a variable resolves the upstream per request.\n'
    printf '    resolver 1.1.1.1 8.8.8.8 valid=300s ipv6=off;\n'
    printf '    resolver_timeout 5s;\n\n'
    printf '    client_max_body_size 1m;\n\n'
    printf '    # Only the Iranian server may use this box as an egress.\n'
    printf '%b\n' "$ALLOW_LINES"
    printf '    deny all;\n\n'
    printf '    # Only the Gemini host is relayed: anything else is 404, so a leaked\n'
    printf '    # address cannot be turned into an open proxy.\n'
    printf '    location ~ ^/(?<gemini_target>https://%s/.*)$ {\n' "$(printf '%s' "$GEMINI_HOST" | sed 's/\./\\./g')"
    printf '        proxy_pass $gemini_target$is_args$args;\n'
    printf '        proxy_ssl_server_name on;\n'
    printf '        proxy_set_header Host %s;\n' "$GEMINI_HOST"
    printf '        proxy_http_version 1.1;\n'
    printf '        # Google can be slow on a long report; must match the app budget.\n'
    printf '        proxy_read_timeout 120s;\n'
    printf '        proxy_send_timeout 120s;\n'
    printf '        # The forwarded URL carries the API key: keep it out of the logs.\n'
    printf '        access_log off;\n'
    printf '    }\n\n'
    printf '    location / {\n'
    printf '        return 404;\n'
    printf '    }\n'
    printf '}\n'
} > "$CONF_PATH"

say "nginx -t"
if ! nginx -t; then
    if [ -n "$BACKUP" ]; then
        cp "$BACKUP" "$CONF_PATH"
        echo "Restored the previous vhost after a failed test." >&2
    else
        rm -f "$CONF_PATH"
        echo "Removed the new vhost after a failed test." >&2
    fi
    die "the generated vhost did not pass 'nginx -t' — nothing was reloaded"
fi
systemctl reload nginx
echo "Reloaded nginx."

# ── Self-test ────────────────────────────────────────────────────────────────
# Proves the *shape* works: TLS validates, "//" survives, and Google (not nginx)
# answers. A 404 here means the path was not forwarded as-is.
say "Self-test (from this machine, over the real certificate)"
PROBE="https://$RELAY_HOST:$RELAY_PORT/https://$GEMINI_HOST/v1beta/models?key=AIzaSySMOKE-INVALID"
CODE="$(curl -sS -o /tmp/dlea-relay-probe.json -w '%{http_code}' \
    --max-time 25 --resolve "$RELAY_HOST:$RELAY_PORT:127.0.0.1" "$PROBE" || true)"
echo "HTTP $CODE"
head -c 300 /tmp/dlea-relay-probe.json 2>/dev/null || true
echo
rm -f /tmp/dlea-relay-probe.json

# Distinguish "the relay is broken" from "the request got through", because the
# two need completely different fixes. Google answers a bad key with JSON; nginx
# (or its allowlist) answers with HTML.
PROBE_BODY="$(cat /tmp/dlea-relay-probe.json 2>/dev/null || true)"
if [ "$CODE" = "404" ]; then
    die "the relay answered 404, so the forwarded URL did not survive as a path.
     Check that merge_slashes off is still present in $CONF_PATH."
elif [ "$CODE" = "000" ] || [ -z "$CODE" ]; then
    die "no answer over TLS. Check the firewall allows port $RELAY_PORT and that
     the certificate covers $RELAY_HOST."
elif printf '%s' "$PROBE_BODY" | grep -q '"error"'; then
    echo "OK — Google answered with JSON (an invalid key was sent on purpose),"
    echo "     so the path shape survived and this box can reach the API."
elif printf '%s' "$PROBE_BODY" | grep -qi 'forbidden'; then
    echo "HTTP $CODE with an HTML 'Forbidden' body: this box's own egress is blocked."
    echo "A relay on a blocked IP is worthless — a box outside the block is needed."
else
    echo "Google answered with $CODE; the path shape is being forwarded."
    echo "(Read the body above: nginx-level errors mean the allowlist turned us away.)"
fi

cat <<NEXT

=== Done. On the *Iranian* server (backend/.env) ===

    GEMINI_PROXY=https://$RELAY_HOST:$RELAY_PORT
    # a comma-separated second relay is tried if this one is blocked or asleep:
    # GEMINI_PROXY=https://$RELAY_HOST:$RELAY_PORT, https://<other-relay>

    pm2 restart dlea-api

=== Then verify from the Iranian server, not from here ===

    bash deploy/smoke-gemini.sh

The self-test above ran from this box, so it cannot prove that the Iranian
server's *outbound* IP is in the allowlist ($(printf '%s ' "${ALLOWS[@]}")).
If it is not, the relay answers 403 and the app still reports the HTML-403
block. Fix that by re-running this script with --allow <the server's real
outbound IP>, or --open if you accept that trade-off.
NEXT
