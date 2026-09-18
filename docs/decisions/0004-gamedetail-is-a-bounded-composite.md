# Decision: GameDetail is a bounded composite of the Game Center's sections

## Status

Accepted

## Date

2026-09-18

## Decision

The Game Center consumes one domain object, `GameDetail`, produced by `TeamOS.espn.gameDetail(summary, team, config)`. It is a composite of small, independently optional sections — sides, last play, win probability, linescore, team stats, leaders, box score, scoring — each of which mirrors exactly one block the Game Center renders today. **Every field on it has a current Suite consumer.** It is not a normalized copy of ESPN's summary, it carries no `id`, and it is a third object alongside `Game` and `LeagueGame`, not a merge of them.

Two small behavior corrections ride with it, both documented below rather than hidden.

## Context

After Phases 3A–4A the Game Center was the last large provider-coupled surface: `renderGame`, `patchGame`, `gameShape`, `boxTables`, `schedulePoll` and the matchup preview read 61 ESPN keys directly, and the live path patches the DOM in place every 25 seconds. Phase 4's governing statement — remove provider-schema coupling from Suite without changing the Irish Watch experience — meant the shape of the data had to change while the rendering, the patching and the polling did not.

The risk on one side was a giant `GameSummary` mirroring ESPN "for flexibility"; on the other, seven separate adapter calls for one payload, which `patchGame` would need all at once.

## Options Considered

### Option A: One flat `GameSummary` mirroring the payload

Easy to write, impossible to bound. Every future ESPN field would have a home before anyone needed it, and Suite would keep reading provider-shaped substructures under a domain name.

### Option B: Separate adapter functions per section

`lastPlay(summary)`, `linescore(summary)`, … Pure and small, but the consumers need several at once on every poll, the sections share the sides, and `gameShape` needs a view across them. Seven calls per poll for one payload is ceremony without a boundary gain.

### Option C: One composite, bounded by the render

`gameDetail()` returns the sections the Game Center has, each `null` when the feed has nothing, with a `Side` shared by every section that names a team. The bound is mechanical: a field exists only if `renderGame` or `patchGame` reads it. The fixture check asserts the exact key list of the object and of every sub-object.

## Rationale

Option C. It changes the *source* of the Game Center's data without changing its behavior: `renderGame` keeps its markup and section ordering, `patchGame` keeps its DOM targets and `put()` discipline, `gameShape` keeps its rebuild-vs-patch role, `summaryFor()` keeps its memory, Cache API store and URL. Rendered output for pre-game, live and final fixtures — tab and inline — is byte-identical to the pre-change capture, and the live patch sequence (no-op re-patch, a poll that moves score/clock/last play/down-distance/win probability/stats/linescore, a lead change) produces byte-identical DOM.

`Side.key` is an opaque correlation key (the provider's team id today), the same precedent as `Game.id`; its only consumer is the matchup preview asking for that side's season stats. The team-stat "which side is ahead" judgment (`better`) lives in the adapter because it is domain knowledge — fewer turnovers and penalties win, penalties compare by count, `5-13` is a rate and `28:24` is seconds — that the render and the patch were each computing separately.

## Behavior corrections carried with this decision

1. **Penalties with equal counts but different yards.** `renderGame` tested "equal?" on the yards *rate* before switching to the count, so `6-43` vs `6-41` awarded the home side a `win` mark until the first live patch, whose logic checked equality after the switch and awarded nobody. `GameDetail.better` uses the patch semantics; render and patch now agree. Observable only in that edge case, and only for the first paint.
2. **`gameShape` in the pre-game state** now reads `0|0|0|2|pre` where it read `0|0|2|2|pre`: the old fingerprint counted ESPN's two `boxscore.teams` entries even though, before kickoff, none of their per-game stat names match a Team-stats row and nothing renders. The fingerprint is an internal rebuild key, never displayed; every transition that changes what is rendered still changes it.

Two further nuances are recorded as equivalent, not changed: `patchGame` now updates the last play from the previous drive's final play when the situation and current drive are both absent (the render already did), and `Side.abbreviation` falls back to the short display name everywhere where two of nine read sites previously did not (ESPN always sends the abbreviation).

## Consequences

- `docs/03_DOMAIN_MODEL.md` documents `GameDetail`, `Side` and `SeasonStat`.
- `app.js` no longer reads `header.competitions`, `competitors`, `homeAway`, `status.type.*`, `situation`, `drives`, `winprobability`, `linescores`, `boxscore.teams/players`, `leaders`, `scoringPlays`, `athlete`, `splits.categories` or `rankDisplayValue`; `pick`, `statVal`, `cmpVal`, `flattenStats`, `statPick`, `PREVIEW_ROWS` and the `CORE` URL are gone from it.
- `app.js` still owns `summaryFor()` (memory, Cache API, in-flight sharing), the 25-second poll, `gameToShow`/`justFinished`, `G` state and all markup.
- `TeamOS.espn` exports `summaryUrl`, `gameDetail`, `seasonStatsUrl`, `seasonStats`; `tools/adaptercheck.js` asserts the export list, the exact shapes, and the absence of ESPN keys against three summary fixtures (pre, live, final) and a season-stats fixture.
- The ESPN base URL and `TEAM_ID` remained in `app.js` for one reader each — the news path — until Phase 4C removed both.

## Owner

David (decision) / Claude Code (proposal and implementation)

## Related Documents

- `docs/03_DOMAIN_MODEL.md` — GameDetail, Side, SeasonStat
- `docs/07_DATA_ARCHITECTURE.md` — the Game Center path
- `docs/decisions/0002-adapters-are-pure.md`, `docs/decisions/0003-game-and-leaguegame-are-distinct.md`
- `teamos/espn.js`, `tools/adaptercheck.js`, `tools/fixtures/espn-summary-{pre,live,post}.json`, `tools/fixtures/espn-season-stats.json`
