# Dlea deployment guide

> This file covers local development and the generic Node/nginx shape of the app.
> For the real production server (PM2 app names, nginx vhost, ports, directories,
> rollback and troubleshooting) read **`DEPLOYMENT-RUNBOOK.md`** — it is the source
> of truth, and it is the one to check before touching anything on the server.

## Local development on Windows

1. Install Node.js 22 LTS or newer.
2. Open a terminal in the project directory.
3. Run `npm install`.
4. Run `npm run dev` and open `http://localhost:5173`.

If PowerShell reports that `npm.ps1` cannot run because scripts are disabled, use `npm.cmd run dev` for the current session or run this once in a normal PowerShell window:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Ubuntu deployment

1. Install Node.js 22 LTS or newer.
2. Copy or clone the project without `node_modules`.
3. In the project directory, run `npm ci`.
4. Build the production server with `npm run build`.
5. Test it with `npm start`; it listens on the `PORT` environment variable or port `3000` by default.
6. Put Nginx in front of the app and proxy requests to `http://127.0.0.1:3000`.
   On the Dlea server the vhost is a copy of `deploy/nginx-dlea.conf` and it also
   proxies `/api/` to the Django backend.
7. Use systemd or PM2 to keep `npm start` running after logout or restart.
   The Dlea server uses **PM2** (`dlea` for the frontend, `dlea-api` for gunicorn)
   and deliberately has no systemd units for the app.

The Vite development server is intentionally separate from the production server: use `npm run dev` only for development and `npm run build` plus `npm start` on Ubuntu.
