# ── Stage 1: build wheels ──────────────────────────────────────────
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runtime ───────────────────────────────────────────────
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

RUN useradd -m -r dlea
WORKDIR /app
COPY --chown=dlea:dlea . .

# `WORKDIR` creates /app as root, and COPY only chowns what it copies in, so
# the directory itself stays root-owned. `_cache/` is gitignored and therefore
# never in the build context, which left the process (uid 999) unable to create
# its file-based cache directory. That broke the OTP flows at runtime and made
# every `manage.py` command die on its system checks — including the `migrate`
# the deploy runs, so schema migrations silently stopped being applied.
RUN mkdir -p /app/_cache && chown -R dlea:dlea /app

USER dlea

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8002/api/ || exit 1

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8002", \
     "--workers", "3", \
     "--timeout", "120"]
