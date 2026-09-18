# TeamOS

## Role

TeamOS is the domain intelligence layer of Project LND. It is the brains between external sports sources and Suite.

```text
External sources -> TeamOS -> Suite
```

## Responsibilities

TeamOS owns:

- Team configuration
- External provider IDs
- Provider adapters
- Data normalization
- Schedule and game data
- Roster/player data
- Rankings
- News and media normalization
- Historical data
- Team capabilities
- Source freshness/status
- Derived team context

## What TeamOS Does Not Own

TeamOS should not own:

- Page layout
- CSS
- Navigation presentation
- Cards and visual components
- Fan interaction design
- Raw provider schemas exposed to the UI

## Example

```text
ESPN response
    |
    v
ESPN adapter
    |
    v
Normalized Game
    |
    v
TeamOS
    |
    v
Suite game card / game page
```

The Suite should not care whether a game came from ESPN, another provider, or a local snapshot.

## Current Implementation

TeamOS is a logical/domain layer inside the existing repository: two plain-script files loaded by `index.html` before `app.js`, exposing one global, `TeamOS`. The GitHub Actions workflows and local snapshots remain in place unchanged.

| File | Provides | Since |
|---|---|---|
| `teamos/team.js` | `TeamOS.createTeam(config.team)` — validates and freezes the provider-neutral Team | Phase 2 |
| `teamos/espn.js` | `TeamOS.espn.scheduleUrl(config)`, `TeamOS.espn.schedule(json, team, config)` → `Game[]`, `TeamOS.espn.gameOdds(summary)` | Phase 3A |
| `teamos/espn.js` | `TeamOS.espn.rosterUrl(config)`, `TeamOS.espn.roster(json)` → `RosterGroup[]` of `Player`; `TeamOS.espn.teamUrl(config)`, `TeamOS.espn.teamStatus(json)` → `{ rank, record }` | Phase 3B |
| `teamos/espn.js` | `TeamOS.espn.scoreboardUrl()`, `TeamOS.espn.scoreboard(json, config)` → `LeagueGame[]`; `TeamOS.espn.rankingsUrl()`, `TeamOS.espn.rankings(json, config)` → `Poll[]` | Phase 4A |

### What TeamOS does now

- Defines what a Team is and rejects a malformed team config at startup.
- Turns ESPN's schedule payload into provider-neutral `Game` objects (`docs/03_DOMAIN_MODEL.md`), applying the team config's `series` table and `sources.espn.broadcastFallback` along the way.
- Turns ESPN's roster payload into `RosterGroup[]` of `Player`, and its team payload into `TeamStatus` (rank and record).
- Turns ESPN's league scoreboard into `LeagueGame[]` (neutral home/away, with the team's own game flagged) and its rankings into `Poll[]`, deciding which polls bear on an FBS team and in what order.
- Extracts the pregame line/total from ESPN's game summary.

### What TeamOS explicitly does not do yet

- **Fetch.** The adapter is a pure transformation; `app.js` owns `fetch`, the cache-first paint, the offline/stale flag, polling and prefetching.
- **Orchestrate.** Which game is "next", when a final rolls over, whether anything is live — all application logic.
- **Cache or snapshot.** The service worker, the Cache API store of final summaries and `.github/workflows/odds.yml` are untouched.
- **Normalize the Game Center, matchup preview or news yet** (Phase 4B/4C). Kalshi odds, weather and the depth chart are still consumed in their provider or snapshot shapes and are not part of Phase 4.
- **Know about a second team, a second provider, or the fan.**

TeamOS is not an application framework. It has no `load()`, no registry, no adapter interface; the next adapter, if one is justified, earns its own shape.

The goal is not to create a backend. The goal is to make ownership clear.

## Future Intelligence Layer

TeamOS can eventually provide structured context for AI experiences. For example, an AI preview should be able to consume:

- Upcoming game
- Recent results
- Injuries/availability
- Rankings
- Team trends
- Historical context
- Relevant news
- User's followed teams

That context should come from TeamOS rather than requiring the AI layer to understand every external provider independently.
