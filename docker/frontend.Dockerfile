# ── Stage 1: build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: runtime ───────────────────────────────────────────────
FROM node:22-alpine

# Deliberately no `apk add wget`: it fetched from dl-cdn.alpinelinux.org, which
# the deploy box cannot reliably reach (the connection resets mid-download), so
# every build that needed it was a coin flip. The healthcheck therefore runs on
# the node runtime that is already in the image instead of an extra package.
WORKDIR /app
COPY --from=builder /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
