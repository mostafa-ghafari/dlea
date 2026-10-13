# ── Stage 1: build wheels ──────────────────────────────────────────
# No build toolchain on purpose: every requirement resolves to a wheel
# (psycopg2-binary ships its own libpq), so nothing is ever compiled — and
# `apt-get` against deb.debian.org resets halfway through the package index on
# the deploy box, which failed whole builds before a line of the app was built.
FROM python:3.12-slim AS builder

WORKDIR /build
COPY . .

# Wheels sitting next to requirements.txt (backend/*.whl) are a pre-downloaded
# cache: the deploy box cannot reliably reach PyPI or files.pythonhosted.org
# (TLS resets halfway through a download), so there `pip` installs offline from
# those wheels and never opens a socket. A checkout without the cache falls
# back to PyPI rather than failing the build.
RUN if ls ./*.whl >/dev/null 2>&1; then \
        pip install --no-cache-dir --prefix=/install \
            --no-index --find-links=. -r requirements.txt; \
    else \
        pip install --no-cache-dir --prefix=/install \
            --retries 5 --timeout 60 -r requirements.txt; \
    fi

# ── Stage 2: runtime ───────────────────────────────────────────────
FROM python:3.12-slim

COPY --from=builder /install /usr/local

RUN useradd -m -r dlea
WORKDIR /app
COPY --chown=dlea:dlea . .

# `WORKDIR` creates /app as root and COPY only chowns what it copies in, so the
# directory itself stays root-owned. `_cache/` is gitignored and therefore never
# in the build context, which left the process (uid 999) unable to create its
# file-based cache directory. That broke the OTP flows at runtime and made every
# `manage.py` command die on its system checks — including the `migrate` the
# deploy runs, so schema migrations silently stopped being applied.
RUN mkdir -p /app/_cache && chown -R dlea:dlea /app

USER dlea

EXPOSE 8002

# `curl` was only ever installed for this probe; python is already in the
# image, so the health check no longer needs a package download to work.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8002/api/', timeout=5)"

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8002", \
     "--workers", "3", \
     "--timeout", "120"]
