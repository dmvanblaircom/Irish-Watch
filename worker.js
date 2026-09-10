// Kalshi read-only relay for Irish Watch.
//
// Kalshi's public market data needs no key, but their servers send no CORS
// header, so a browser page cannot read it. This forwards the request from the
// server side and adds the header.
//
// Only GET, only market-data paths — this is not an open proxy.

const HOSTS = [
  "https://api.elections.kalshi.com/trade-api/v2",
  "https://external-api.kalshi.com/trade-api/v2",
  "https://trading-api.kalshi.com/trade-api/v2"
];
const ALLOWED = [/^\/markets\b/, /^\/events\b/, /^\/series\b/];

// A bare server-to-server request with no browser-like headers gets filtered by
// a lot of bot protection. Present as an ordinary client.
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

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") return json({ error: "GET only" }, 405);

    const url = new URL(request.url);

    // /_debug reports exactly what each Kalshi host said, so a failure is
    // diagnosable instead of guessable.
    const debug = url.pathname === "/_debug";
    const path = debug
      ? "/markets?event_ticker=KXNCAAF-27&limit=2"
      : url.pathname + url.search;

    if (!debug && !ALLOWED.some((re) => re.test(url.pathname))) {
      return json({ error: "path not allowed", path: url.pathname }, 403);
    }

    const attempts = [];
    for (const base of HOSTS) {
      try {
        const upstream = await fetch(base + path, {
          headers: OUTBOUND,
          redirect: "follow"
        });
        const body = await upstream.text();

        if (upstream.ok && body.trim().startsWith("{")) {
          if (debug) {
            attempts.push({ host: base, status: upstream.status, ok: true,
                            bytes: body.length });
            return json({ working: base, attempts }, 200);
          }
          return new Response(body, {
            status: 200,
            headers: {
              ...CORS,
              "content-type": "application/json",
              "cache-control": "public, max-age=60"
            }
          });
        }

        attempts.push({
          host: base,
          status: upstream.status,
          contentType: upstream.headers.get("content-type"),
          cfRay: upstream.headers.get("cf-ray"),
          snippet: body.slice(0, 220)
        });
      } catch (e) {
        attempts.push({ host: base, threw: String(e).slice(0, 220) });
      }
    }

    return json({ error: "both Kalshi hosts failed", path, attempts }, 502);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...CORS, "content-type": "application/json" }
  });
}
