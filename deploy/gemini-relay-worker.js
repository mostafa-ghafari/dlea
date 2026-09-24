/**
 * Dlea Gemini relay — a URL-prefix forwarder, small enough to deploy as a
 * Cloudflare Worker in about two minutes.
 *
 * Google answers requests from Iranian IPs with a generic HTML 403 page, which
 * never reaches the Gemini API, so `api/gemini.py` sends its calls through
 * whatever `GEMINI_PROXY` names, in this exact shape:
 *
 *   https://<worker>/https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=…
 *
 * This worker takes the path after its own host, checks it really points at the
 * Gemini host (so the worker is not an open proxy), and fetches it from
 * Cloudflare's network. The `?key=` stays in that forwarded URL, so the key in
 * the request is the caller's own — nothing secret lives in this file.
 *
 * Deploy: Cloudflare dashboard → Workers & Pages → Create → Worker → paste this
 * file → Deploy. Then on the server, in backend/.env:
 *
 *   GEMINI_PROXY=https://dlea-gemini.<account>.workers.dev
 *
 * and `pm2 restart dlea-api`. Verify with `bash deploy/smoke-gemini.sh`.
 */

const ALLOWED_ORIGIN = "https://generativelanguage.googleapis.com/";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // /https://generativelanguage.googleapis.com/v1beta/… → the target URL
    const target = url.pathname.slice(1) + url.search;

    if (!target.startsWith(ALLOWED_ORIGIN)) {
      return new Response(`only ${ALLOWED_ORIGIN} may be relayed\n`, {
        status: 400,
      });
    }

    const relayed = new Request(target, {
      method: request.method,
      headers: request.headers,
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
