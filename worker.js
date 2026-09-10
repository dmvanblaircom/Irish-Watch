// Kalshi read-only relay for Irish Watch.
//
// Two problems this solves:
//   1. Kalshi sends no CORS header, so a browser page cannot read it directly.
//   2. Kalshi rate-limits by source IP, and Cloudflare Workers share edge IPs
//      with everyone else's workers — so a naive pass-through gets 429'd.
//
// So this caches hard. One good fetch serves every page load for ten minutes,
// and if Kalshi is rate-limiting when the cache expires, the last good copy is
// served instead of an error. Title odds move by pennies a day; slightly stale
// beats blank.

const HOSTS = [
  "https://api.elections.kalshi.com/trade-api/v2",
  "https://external-api.kalshi.com/trade-api/v2"
];
const ALLOWED = [/^\/markets\b/, /^\/events\b/, /^\/series\b/];

const FRESH_FOR   = 600;    // seconds a cached copy is served without asking Kalshi
const STALE_LIMIT = 86400;  // how long a copy stays usable as a fallback
const TRIES       = 3;
const GAP_MS      = 600;

const OUTBOUND = {
  "accept": "application/json",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "GET") return json({ error: "GET only" }, 405);

    const url = new URL(request.url);
    const debug = url.pathname === "/_debug";
    const path = debug
      ? "/markets?event_ticker=KXNCAAF-27&limit=2"
      : url.pathname + url.search;

    if (!debug && !ALLOWED.some((re) => re.test(url.pathname)))
      return json({ error: "path not allowed", path: url.pathname }, 403);

    const cache = caches.default;
    const cacheKey = new Request("https://cache.local" + path, { method: "GET" });

    // 1. A recent copy short-circuits everything.
    const hit = await cache.match(cacheKey);
    let staleBody = null, staleAge = null;
    if (hit) {
      const age = Math.floor((Date.now() - Number(hit.headers.get("x-fetched-at") || 0)) / 1000);
      const body = await hit.text();
      if (age < FRESH_FOR && !debug)
        return serve(body, { "x-cache": "hit", "x-age": String(age) });
      if (age < STALE_LIMIT) { staleBody = body; staleAge = age; }
    }

    // 2. Otherwise ask Kalshi, retrying past a transient 429.
    const attempts = [];
    for (let t = 0; t < TRIES; t++) {
      for (const base of HOSTS) {
        try {
          const up = await fetch(base + path, { headers: OUTBOUND, redirect: "follow" });
          const body = await up.text();

          if (up.ok && body.trim().startsWith("{")) {
            const store = new Response(body, {
              headers: {
                "content-type": "application/json",
                "cache-control": `public, max-age=${STALE_LIMIT}`,
                "x-fetched-at": String(Date.now())
              }
            });
            ctx.waitUntil(cache.put(cacheKey, store));
            if (debug)
              return json({ working: base, try: t + 1, bytes: body.length, attempts }, 200);
            return serve(body, { "x-cache": "miss" });
          }
          attempts.push({ try: t + 1, host: base, status: up.status,
                          snippet: body.slice(0, 140) });
        } catch (e) {
          attempts.push({ try: t + 1, host: base, threw: String(e).slice(0, 140) });
        }
      }
      if (t < TRIES - 1) await sleep(GAP_MS * (t + 1));
    }

    // 3. Kalshi is not cooperating. An old number beats no number.
    if (staleBody)
      return serve(staleBody, { "x-cache": "stale", "x-age": String(staleAge) });

    return json({ error: "Kalshi unreachable and nothing cached yet",
                  path, attempts }, 502);
  }
};

function serve(body, extra) {
  return new Response(body, {
    status: 200,
    headers: { ...CORS, ...extra, "content-type": "application/json",
               "cache-control": "public, max-age=60" }
  });
}
function json(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status, headers: { ...CORS, "content-type": "application/json" }
  });
}
