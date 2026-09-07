#!/usr/bin/env bash
# Boot the production build for Playwright E2E tests.
# Requires `npm run build` first (`npm run test:e2e` does this via the
# pretest hook). Served on port 5173 to match the Vite dev port.
set -euo pipefail

cd "$(dirname "$0")/.."

export PORT=5173
export HOST=0.0.0.0

exec node .output/server/index.mjs