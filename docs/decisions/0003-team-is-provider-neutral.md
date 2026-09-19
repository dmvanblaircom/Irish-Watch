# Decision: Team is provider-neutral

## Status

Accepted

## Date

2026-09-17

## Decision

The Team domain object produced by `TeamOS.createTeam()` carries no provider identifiers or provider matching rules. ESPN team ids, Kalshi ticker suffixes and name patterns, feed-gap patches and the like live in the team config's `sources` section, outside Team.

## Context

Phase 1A extracted Notre Dame into a single `TEAM_CONFIG` object that mixed identity (`name`, `abbreviation`, `venue`) with provider details (`externalIds.espn`, a Kalshi matcher, an ESPN broadcast fallback). Phase 2 introduces the Team model, and `docs/03_DOMAIN_MODEL.md` had listed `externalIds` as a suggested Team field. A decision was needed on which side of the domain boundary provider ids sit.

## Options Considered

### Option A: `externalIds` on Team

One object, one place to look. But every provider the platform ever adds would extend the domain object, and Suite code holding a Team would hold ESPN's and Kalshi's view of it too — the coupling Phase 3's adapters exist to remove.

### Option B: Team is provider-neutral; provider details in `TEAM_CONFIG.sources`

Team describes the team. `sources` describes how each feed refers to it. `app.js` reads `sources` today at the few sites that build ESPN URLs or match Kalshi markets; those sites are exactly what the Phase 3 adapters absorb, and the adapters will take a Team and look up their own ids.

## Rationale

Option B. It matches domain principle 2 in `docs/03_DOMAIN_MODEL.md` ("provider-specific IDs can exist as external identifiers but should not become domain identity"), keeps the Team object stable as providers change, and makes the Phase 3 migration a deletion rather than a redesign.

## Consequences

- `TEAM.*` in `app.js` is only ever a domain field: `id`, `name`, `abbreviation`, `sport`, `league`, `venue`.
- Provider ids are read from `TEAM_CONFIG.sources` in the top declaration block of `app.js` and in `teamMarket()`. Those reads are temporary and disappear in Phase 3.
- A second team's config supplies its own `sources`; nothing about Team changes.
- `docs/03_DOMAIN_MODEL.md` no longer lists `externalIds` on Team.

## Owner

David (decision) / Claude Code (proposal and implementation)

## Related Documents

- `docs/03_DOMAIN_MODEL.md`
- `docs/04_TEAM_CONFIG.md`
- `docs/08_BUILD_PLAN.md` — Phase 2
- `teamos/team.js`, `teams/notre-dame.js`
