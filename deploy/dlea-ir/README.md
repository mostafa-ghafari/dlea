# dlea.ir migration — Netafraz shared host → own VPS (37.255.212.62)

Goal: retire the Netafraz-hosted copy and serve everything from the own server,
using the stack already running there.

| host | before | target |
|---|---|---|
| `dlea.ir`, `www.dlea.ir` | Netafraz shared `195.28.10.31`, SPA built against `https://api.dlea.ir/api` (NXDOMAIN → login broken) | this VPS: frontend `:3000`, backend `:8002` |
| `dev.dlea.ir` | — | alias of the current `dlea.piqagram.ir` stack |
| `blog.dlea.ir` | WordPress on `195.28.10.31` | WordPress + MariaDB container on this VPS |
| `dlea.piqagram.ir` | the working stack | keep running |

## Status (as applied on 2026-09-30)

- ✅ **bind9 installed** on the VPS, `named` active, zone `dlea.ir` loaded (serial 2026093001).
- ✅ **nginx vhosts installed** for `dlea.ir`/`www`/`dev` and `blog.dlea.ir`.
- ✅ **verified over HTTP** (with `Host:` header against 127.0.0.1): `dlea.ir` → 200,
  `www`/`dev` → 200, `/api/plans/` → 200, `blog.dlea.ir` → 502 (WordPress not up yet).
- ⏳ **HTTPS**: blocked until DNS for the domains points here.
- ✅ **Blog**: restored from the Netafraz archive (`import/dlea.ir.zip` + `dleair1_uXobJspa_*.sql.gz`)
  by `blog/restore.sh`, served at `https://blog.dlea.ir` (container on `127.0.0.1:8090`,
  its own MariaDB container, certbot cert issued 2026-11-15).
- ⏳ **Frontend origin**: still bakes `https://dlea.piqagram.ir/api` (see step 4).

## Network reality on this box (important)

- The machine's real interface is **`192.168.0.200/24` on `enp0s25`** — a LAN address.
  **The public IP `37.255.212.62` is NAT'd** (by the upstream router/provider), so it
  is *not* an interface address. bind therefore listens on `192.168.0.200` + `127.0.0.1`.
- `systemd-resolved` owns `127.0.0.53:53` and `127.0.0.54:53`; bind must never try to
  bind those, which is why we restrict `listen-on` rather than disabling resolved.
- Testing port 53 **from an Iranian client is unreliable**: many Iranian ISPs
  transparently hijack all `:53` queries (UDP *and* TCP) to their own resolver, so an
  external query returns a recursive answer instead of ours. The meaningful check is
  the hairpin query from the box itself, which returns `flags: qr aa` (our zone).
- The registry (IRNIC) validates the nameservers when you delegate; if inbound 53
  were not forwarded, delegation would be rejected there.

## apt on this box

`apt-get update` was hanging on unreachable `archive.ubuntu.com` and failing on an
unsigned `webmin` repo. `apply.sh` avoids both by installing bind9 from the working
ArvanCloud mirror only:

```
-o Dir::Etc::sourceparts=/tmp/empty-aptparts -o Dir::Etc::sourcelist=/etc/apt/sources.list
```

State of `/etc/apt` after the fix (backups kept as `*.bak-dlea-*`):
- `sources.list` keeps only `mirror.arvancloud.ir/ubuntu noble*`
- `ubuntu.sources` renamed to `ubuntu.sources.disabled`
- a stale 9-day-old hung `apt-get update` was killed

## Docker / compose

No `docker compose` v2 plugin is installed, and **`docker-compose` v1 (1.29.2) is
broken** on this box (`KeyError: 'ContainerConfig'`). `apply.sh blog` therefore
falls back to plain `docker run` (WordPress + MariaDB on `127.0.0.1:8080`).

## Runnning it

Root SSH works directly with the `dlea-deploy` key:

```
ssh -i ~/.ssh/id_ed25519 root@37.255.212.62
sudo bash /home/ghafari/dlea-ir/apply.sh all
```

Stages: `bind` | `nginx` | `blog` | `cert` | `all`. All idempotent.

## Ordered runbook

### 0. (you) Renew `dlea.ir` at Netafraz — blocks DNS + certs
The panel says «این دامنه فعال نیست» because it is **expired** (سررسید ۱۴۰۴/۱۰/۰۶).
Nameservers cannot be changed until it is renewed. In `clients.netafraz.com` →
«دامنهها» → dlea.ir → renew (~89,900 تومان/سال).

> Hosting `407200` is a *separate*, still-active subscription (سررسید ۱۴۰۵/۰۹/۱۴).
> Don't cancel it until the blog data has been copied off `195.28.10.31`.

### 1. Delegate DNS to this server
After renewal, set the nameservers at Netafraz to `ns1.dlea.ir` / `ns2.dlea.ir`
(glue A = `37.255.212.62`). `.ir` needs two nameservers; both are on this box for now.
If IRNIC rejects identical IPs, point `ns2` at a second machine.

Zone (`bind/db.dlea.ir`): `A @ www dev api blog` → `37.255.212.62`.

### 2. HTTPS
Once DNS resolves here: `sudo bash /home/ghafari/dlea-ir/apply.sh cert`
(`certbot --nginx` adds the 443 blocks and redirects).

### 3. Frontend same-origin API
The bundle bakes its API URL at build time from `.env.production`
(`VITE_API_URL=https://dlea.piqagram.ir/api`). So one image serves `dlea.ir` **and**
`dev.dlea.ir`, set `VITE_API_URL=/api` and rebuild the frontend image. nginx already
proxies `/api/` on every vhost.

### 4. Backend env
In `/home/ghafari/dlea-git/docker/.env.docker`:

```
DJANGO_ALLOWED_HOSTS=dlea.ir,www.dlea.ir,dev.dlea.ir,dlea.piqagram.ir,localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=https://dlea.ir,https://www.dlea.ir,https://dev.dlea.ir,https://dlea.piqagram.ir,http://localhost:3000
```

(`dlea.ir`/`www.dlea.ir` are already present.)

### 5. Blog content (done — kept for a restore from scratch)
Source: the Netafraz archive kept outside the repo (`E:\dlea_ir old`).

| file | where it goes |
|---|---|
| `dlea.ir.zip` (178 MB, whole `public_html`) | `blog/import/dlea.ir.zip` |
| `dleair1_uXobJspa_1790677024.sql.gz` (the WordPress DB; `wp-config.php` points at it) | `blog/import/` |

```
cd /home/ghafari/dlea-ir/blog
cp .env.example .env      # WP_PORT=8090, because 8080 is meraat-prod-web-1
sudo bash restore.sh      # network, MariaDB, files, wp-config, import, container, host rewrite
```

Then point the vhost at the container and issue the certificate:

```
sudo sed -i 's#127.0.0.1:8080#127.0.0.1:8090#' /etc/nginx/sites-available/blog.dlea.ir
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d blog.dlea.ir --redirect --agree-tos -m admin@dlea.ir -n
```
