# Dlea deployment guide

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
7. Use systemd or PM2 to keep `npm start` running after logout or restart.

The Vite development server is intentionally separate from the production server: use `npm run dev` only for development and `npm run build` plus `npm start` on Ubuntu.
