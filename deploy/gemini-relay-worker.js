/**
 * Dlea Gemini relay — a URL-prefix forwarder, small enough to deploy as a
 * Cloudflare Worker in about two minutes.
 *
 * Why this exists: Google answers requests from Iranian IPs with a generic HTML
 * 403 page, which never reaches the Gemini API, so `api/gemini.py` sends its
 * calls through whatever `GEMINI_PROXY` names, in this exact shape:
 *
 *   https://<worker>/<RELAY_TOKEN>/https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=…
 *
 * This worker takes the path after its own host, checks it really points at the
 * Gemini host (so the worker is not an open proxy), and fetches it from
 * Cloudflare's network. The `?key=` stays in that forwarded URL, so the key in
 * the request is the caller's own — nothing secret lives in this file.
 *
 * Deploy: Cloudflare dashboard → Workers & Pages → Create → Worker → paste this
 * file → Deploy. Then on the server, in backend/.env:
 *
 *   GEMINI_PROXY=https://dlea-gemini.<account>.workers.dev/<RELAY_TOKEN>
 *
 * and restart the API (pm2 restart dlea-api). Verify with
 * `bash deploy/smoke-gemini.sh`.
 *
 * Note for the Iranian host: a relay on a *Hetzner* VPS cannot be used — the
 * whole Hetzner network is unreachable from Iran (hetzner.com itself times out),
 * so the connection is blackholed and nginx answers 504. Cloudflare's edge is
 * reachable, which is why this Worker is the better relay than a German box.
 */

/** Set this to your own value — `openssl rand -hex 32` — and keep the two in sync. */
const RELAY_TOKEN = "CHANGE_ME_TO_A_RANDOM_TOKEN";

const ALLOWED_ORIGIN = "https://generativelanguage.googleapis.com/";

/**
 * Hop-by-hop headers must not be forwarded, and `Host` belongs to Google: the
 * caller's Host names this worker, and passing it on makes Google answer with a
 * confusing 400/403 instead of the API's own JSON.
 */
const DROP_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "keep-alive",
  "proxy-connection",
  "proxy-authorization",
  "proxy-authenticate",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function notFound() {
  // Vague on purpose, like the Python relay: do not tell a scanner what this is.
  return new Response("Not Found\n", { status: 404 });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // /<token>/https://generativelanguage.googleapis.com/v1beta/…
    let path = url.pathname.replace(/^\//, "");
    if (!RELAY_TOKEN || !path.startsWith(RELAY_TOKEN + "/")) {
      return notFound();
    }
    path = path.slice(RELAY_TOKEN.length + 1);

    const target = path + url.search;
    if (!target.startsWith(ALLOWED_ORIGIN)) {
      return notFound();
    }

    const headers = new Headers(request.headers);
    for (const name of DROP_HEADERS) {
      headers.delete(name);
    }

    const relayed = new Request(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    });

    try {
      return await fetch(relayed);
    } catch (error) {
      return new Response(`relay could not reach Google: ${error}\n`, {
        status: 502,
      });
    }
  },
};
