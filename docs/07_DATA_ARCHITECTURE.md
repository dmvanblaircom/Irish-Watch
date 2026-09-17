# Data Architecture

## Current State

Irish Watch combines live provider data, local snapshots, and GitHub Actions workflows. As of Phase 3A, one data path — the team's schedule — runs through a TeamOS adapter; every other path is still consumed in its provider or snapshot shape by `app.js`.

### The schedule path (Phase 3A)

```text
ESPN schedule JSON
      |
      v
TeamOS ESPN adapter        teamos/espn.js  — pure: (json, team, config) -> Game[]
      |
      v
Game[]                     docs/03_DOMAIN_MODEL.md — provider-neutral, team-perspective
      |
      v
app.js / Suite             S.games, S.next, hero, schedule rows, Game tab selection, prefetch
```

Transport and caching stay in the application layer for now. `app.js` asks the adapter for the URL (`TeamOS.espn.scheduleUrl()`), fetches it with its own `get()`, paints first from the service worker's cached copy (`cachedJSON()`), records staleness from the `X-IW-Cached` header, and polls during live games. The adapter only ever sees the JSON. Because the URL is produced by the adapter but unchanged in shape, the service worker's data cache and the cache-first paint keep matching.

Everything else — scoreboard, rankings, game summaries, roster, news, Kalshi odds, weather, depth chart — is unchanged and still provider-shaped in `app.js`. The Top 25 tab borrows three ESPN parsing helpers from the adapter rather than keeping its own copy; that is transitional.

## Target Flow

```text
External Sources
      |
      v
Adapters / Ingestion
      |
      v
TeamOS normalized data
      |
      v
Suite
```

## Provider Isolation

Provider-specific schemas should stop at the adapter boundary.

For example:

```text
ESPN API -> ESPN adapter -> normalized Game
```

The Suite should consume the normalized Game.

This makes it possible to change providers or add providers without rewriting presentation logic.

## Local Snapshots

Local JSON snapshots are currently useful for resilience, caching, and offline behavior. They do not need to be eliminated immediately.

They should eventually represent normalized data rather than leaking provider-specific response shapes into the UI.

## GitHub Actions

The current GitHub Actions workflows perform significant Notre Dame-specific ingestion and processing. They can remain initially.

Over time, move toward configurable pipelines where the team and provider are inputs rather than assumptions embedded in workflow logic.

## Content Model

News and media should be normalized into stable concepts such as `NewsItem` and `MediaItem` with source metadata attached.

## Odds

Odds are optional and capability-driven. Not every sport, league, or team will expose the same betting/market information.

## Weather

Weather should be associated with a game/venue context rather than treated as a generic team property.

## Freshness

TeamOS should eventually expose source freshness/status so Suite can distinguish between:

- Live/current data
- Recently cached data
- Stale data
- Unavailable data

This is especially important for a sports product where timing matters.

## Backend Timing

A dedicated backend becomes justified when product requirements need things such as:

- User accounts
- Persistent preferences
- Community
- Notifications
- Server-side AI workloads
- Shared user-generated content
- Durable analytics or personalization

Until then, avoid infrastructure for infrastructure's sake.
