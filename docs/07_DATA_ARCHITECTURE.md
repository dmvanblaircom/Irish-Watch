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

### The roster and team-status paths (Phase 3B)

Same pattern, same file, no new mechanism:

```text
ESPN roster JSON  ->  TeamOS.espn.roster(json)      ->  RosterGroup[] of Player  ->  Depth tab roster fold
ESPN team JSON    ->  TeamOS.espn.teamStatus(json)  ->  { rank, record }         ->  header chips
```

`app.js` fetches `TeamOS.espn.rosterUrl()` / `teamUrl()` — unchanged URLs — and keeps the lazy load on fold open, the group pills, the search box and sorting.

### The league paths (Phase 4A)

```text
ESPN scoreboard JSON  ->  TeamOS.espn.scoreboard(json, config)  ->  LeagueGame[]  ->  Top 25 games list; "is anything live" for the poller
ESPN rankings JSON    ->  TeamOS.espn.rankings(json, config)    ->  Poll[]        ->  Top 25 rankings pills and lists
```

Both payloads reach the Top 25 build raw — from the worker's cache on first paint and from the network after — and cross into TeamOS at the top of the build, so the two paths see identical input. The scoreboard fetch is shared: the same payload feeds the tab and the live-anywhere check, and the application keeps the `LeagueGame[]` beside it for the in-place row patcher. The transitional helper exports from Phase 3A are gone.

Everything else — game summaries, matchup preview, news, Kalshi odds, weather, depth chart — is unchanged and still provider-shaped in `app.js`.

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
