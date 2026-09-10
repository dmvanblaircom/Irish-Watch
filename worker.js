// Kalshi read-only relay for Irish Watch.
//
// Kalshi's public market data needs no key, but their servers don't send the
// CORS header a browser requires, so a page can't call them directly. This
// forwards the request server-side and adds the header. Deploy free on
// Cloudflare Workers.
//
// Only GET, only market-data paths — this is not an open proxy.

const UPSTREAM = "https://api.elections.kalshi.com/trade-api/v2";
const FALLBACK = "https://external-api.kalshi.com/trade-api/v2";
const ALLOWED = [/^\/markets\b/, /^\/events\b/, /^\/series\b/];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") {
      return json({ error: "GET only" }, 405);
    }

    const url = new URL(request.url);
    if (!ALLOWED.some((re) => re.test(url.pathname))) {
      return json({ error: "path not allowed" }, 403);
    }

    const suffix = url.pathname + url.search;

    for (const base of [UPSTREAM, FALLBACK]) {
      try {
        const upstream = await fetch(base + suffix, {
          headers: { accept: "application/json" }
        });
        if (!upstream.ok) continue;
        const body = await upstream.text();
        return new Response(body, {
          status: 200,
          headers: {
            ...CORS,
            "content-type": "application/json",
            // 60s of edge cache keeps you well inside the free tier
            "cache-control": "public, max-age=60"
          }
        });
      } catch (e) {
        // try the next host
      }
    }
    return json({ error: "both Kalshi hosts failed" }, 502);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "content-type": "application/json" }
  });
}
