# Decision: Provider adapters are pure transformations

## Status

Accepted

## Date

2026-09-17

## Decision

A TeamOS provider adapter transforms a provider's data into normalized domain objects and nothing else. It receives its inputs explicitly — the provider's JSON, the Team, the team config — and returns domain data. It does not fetch, cache, poll, orchestrate, render, or read application state. Transport and caching remain in the application layer.

The first adapter, `teamos/espn.js`, produces `Game[]` from ESPN's schedule payload. In defining the canonical Game shape, the venue's U.S. state moves to a new field, `venueState`, correcting a key collision in the old normalizer.

## Context

Phase 3 had to establish the first real data boundary between a provider and Suite without rewriting the application. The schedule path already had a normalizer in `app.js` whose output every consumer used without touching ESPN keys, so the question was not *what* to normalize but *how much the adapter should own*.

`app.js` has non-trivial transport behavior that works and that the product depends on: a single `get()` wrapper that reads the service worker's `X-IW-Cached` header for the offline footer, a cache-first paint keyed on the exact provider URL, live-game polling, staggered prefetching. Pulling any of that into the adapter would have coupled TeamOS to browser APIs and the service worker's cache keys.

Separately, the old `normalize()` wrote two different meanings to one `state` key — the venue's U.S. state, then the game status — so the second silently won and the geocoder's state filter never applied.

## Options Considered

### Option A: Adapter owns fetch + normalize

`TeamOS.espn.loadSchedule()` fetches and returns `Game[]`. One call site in `app.js`. But the adapter then needs `fetch`, must replicate the stale-header handling, must expose the URL anyway for the cache-first paint, and can no longer be exercised in Node without mocking the network.

### Option B: Adapter is pure; application keeps transport

`TeamOS.espn.scheduleUrl(config)` gives `app.js` the URL; `app.js` fetches it as before; `TeamOS.espn.schedule(json, team, config)` returns `Game[]`. Three lines change in `refreshSchedule()`. The adapter runs in a bare Node context against a fixture with no window and no fetch.

## Rationale

Option B. It moves exactly the provider knowledge and none of the working transport; it keeps the service worker's cache keys untouched by construction; and it makes the adapter checkable in CI as a plain function. Orchestration is Phase 4's question and is left there.

On the `state` collision: the adapter is where the Game shape becomes a documented contract, so carrying a known defect into it was not acceptable. `venueState` is the venue's state; `state` remains the game status. This is an intentional behavior change, limited to kickoff-forecast geocoding for away games when the zip lookup fails (the state filter now applies) and to the keys of the small localStorage geocode cache.

## Consequences

- `app.js` no longer contains the ESPN schedule URL shape, `normalize()`, or its helpers (`timeIsSet`, `network`, `oddsOf`, `isNeutral`, `NEUTRAL_VENUES`, `seriesFor`, `fallbackNetwork`).
- `app.js` still owns `get()`, `cachedJSON()`, `S.stale`, polling, `S.next` selection and rendering.
- `Game` has 19 fields, documented in `docs/03_DOMAIN_MODEL.md`; `venueState` replaces the shadowed venue state.
- The Top 25 tab, which still renders ESPN's scoreboard raw, calls `TeamOS.espn.timeIsSet/broadcast/odds` rather than keeping a copy. That export is transitional and is removed when the scoreboard gets its own object.
- `tools/adaptercheck.js` runs in CI against `tools/fixtures/espn-schedule.json` and asserts the URL, the Game shape, perspective, neutral sites, broadcasts, series, and the absence of ESPN keys.
- No generic adapter interface or registry exists. A second adapter, if one is justified, defines its own signature.

## Owner

David (decision) / Claude Code (proposal and implementation)

## Related Documents

- `docs/03_DOMAIN_MODEL.md` — Game
- `docs/05_TEAMOS.md` — current implementation
- `docs/07_DATA_ARCHITECTURE.md` — the schedule path
- `docs/decisions/0001-team-is-provider-neutral.md`
- `teamos/espn.js`, `tools/adaptercheck.js`
