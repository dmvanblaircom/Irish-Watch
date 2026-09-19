# Decision: Game and LeagueGame are distinct domain objects

## Status

Accepted

## Date

2026-09-17

## Decision

TeamOS has two game-shaped objects and keeps them separate. `Game` is a game from the selected team's point of view (`home`, `us`/`them`, `won`, `series`). `LeagueGame` is a neutral game in the league (`home`/`away` sides, `mine` flag). Suite consumers pick the one that matches their question. They are not merged into one shape.

With `LeagueGame` in place, the transitional ESPN parsing helpers exported from `teamos/espn.js` since Phase 3A (`timeIsSet`, `broadcast`, `odds`) are retired: the Top 25 tab now reads `LeagueGame` fields instead.

## Context

Phase 3A normalized the team's schedule as `Game`, written from the team's perspective because that is what the hero and schedule rows render. The Top 25 tab renders a different thing — every ranked game in the league this week, home and away named on equal terms — and until Phase 4A it read ESPN's scoreboard raw, borrowing three parsing helpers from the adapter so the knowledge was not duplicated.

The question was whether the scoreboard should be normalized into `Game` (adding a "neutral mode") or into its own object.

## Options Considered

### Option A: One `Game` with both perspectives

Add `home`/`away` side objects to `Game` alongside `us`/`them`, or a `perspective` flag. Every consumer of `Game` — hero, schedule rows, Game tab selection, prefetch, weather — would have to know which mode it was holding, and `Game` would carry fields (`series`, `venueState`, `zip`) that mean nothing for a league row.

### Option B: Two objects, one adapter file

`LeagueGame` has exactly the fields the Top 25 rows and the live-anywhere check read, nothing from `Game`'s perspective, and a `mine` flag for the row highlight. Both are produced by `teamos/espn.js` from different payloads. The application filters to ranked games and derives "is anything live" from the list.

## Rationale

Option B. The two views ask different questions and the fields do not overlap enough to share a shape without conditionals in every consumer. Two small honest objects cost less than one general one. The same principle already separated `Player` from the Game Center's box-score rows.

The scoreboard fetch stays shared between the tab and the poller; the application keeps the payload it fetched (so the tab's build sees the same input from the worker's cache as from the network) and the `LeagueGame[]` beside it for the in-place row patcher.

## Consequences

- `docs/03_DOMAIN_MODEL.md` documents `LeagueGame` and `Poll`.
- `app.js` no longer reads `competitions`, `competitors`, `curatedRank`, `homeAway`, `situation`, `shortDetail`, `rankings`, `ranks`, `occurrence` or `recordSummary` for the Top 25 tab; `isFBS`, `pollOrder`, `pollLabel`, `pollSlug` are gone from it.
- `TeamOS.espn` no longer exports `timeIsSet`, `broadcast`, `odds`; `tools/adaptercheck.js` asserts the exact export list.
- `AUTO.liveElsewhere` is `LeagueGame[].some(state === "in")`.
- Which polls count as FBS, their order, and label dedupe are TeamOS decisions inside `rankings()`, not Suite logic.
- A "ranked game" is a `LeagueGame` with a side rank; the application applies that filter, since the same list also answers "is anything live" where unranked games matter.

## Owner

David (decision) / Claude Code (proposal and implementation)

## Related Documents

- `docs/03_DOMAIN_MODEL.md` — Game, LeagueGame, Poll
- `docs/07_DATA_ARCHITECTURE.md` — the league paths
- `docs/decisions/0004-adapters-are-pure.md`
- `teamos/espn.js`, `tools/adaptercheck.js`, `tools/fixtures/espn-scoreboard.json`, `tools/fixtures/espn-rankings.json`
