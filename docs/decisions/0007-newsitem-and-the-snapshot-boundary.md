# Decision: NewsItem is the smallest content object; the project's own snapshots are not providers

## Status

Accepted

## Date

2026-09-18

## Decision

The News tab consumes `NewsItem[]` — `{ title, link, image, source, publishedAt }`, exactly the fields it shows. ESPN's team feed becomes `NewsItem[]` inside `teamos/espn.js` (`TeamOS.espn.news()`, with the URL from `TeamOS.espn.newsUrl()`). The beat-writer snapshot `news.json`, which this project's own GitHub Action writes from RSS, is treated as NewsItem-shaped data rather than as a provider: a three-line conversion in the application turns its ISO date into `publishedAt`, and it goes through no adapter.

Merging the two sources, dropping duplicate headlines, ordering newest-first and the fifteen-then-"show more" fold stay in the application as presentation.

This closes the Phase 4 boundary for ESPN: `app.js` no longer contains the ESPN base URL or the ESPN team id.

## Context

Phase 4A and 4B moved the league view and the Game Center behind the adapter; the News tab was the last Suite consumer reading ESPN keys (`articles[].headline`, `links.web.href`, `images[0].url`, `published`) and the last reader of the `ESPN` base URL and `TEAM_ID`. The same tab also reads `news.json`, whose items already carry `title`, `link`, `source` and `published` because the Action was written to produce something the page could render directly.

Two questions had to be settled: how small the content object should be, and whether the project's own snapshot should be pushed through TeamOS for symmetry.

## Options Considered

### A general content model

`id`, `summary`, `byline`, categories, team/league association, media type — the shape `docs/03` originally sketched. Nothing in the News tab reads any of it. A field with no consumer is a field nobody can tell is wrong.

### A snapshot adapter in TeamOS

`TeamOS.snapshot.news(json)` alongside `TeamOS.espn.news(json)`, so both halves "cross TeamOS". It would introduce a second adapter namespace to convert one date field of a format this repository controls. Provider adapters exist to isolate schemas we do not own; `news.json` is a schema we do own, and when it changes the Action and the page change together.

### The five-field object, snapshot converted in place (chosen)

`NewsItem` carries what is rendered. The ESPN half crosses the adapter; the snapshot half is documented as NewsItem-compatible and converted where it is read.

## Rationale

The Suite should know what a news item is, not what ESPN's News API looks like — and it does not need to pretend its own snapshot is a foreign feed to achieve that. Keeping the merge, dedupe and sort in the application is deliberate: ESPN does not deliver its feed in date order, and the ordering of stories from several outlets is a presentation choice, not a fact about any one provider.

## Consequences

- `docs/03_DOMAIN_MODEL.md` documents `NewsItem` and the snapshot's compatibility.
- `app.js` no longer reads `articles`, `headline`, `links.web`, `images[0]` or ESPN's `published`; the `ESPN` constant and `TEAM_ID` are deleted. The only provider configuration it still reads is `TEAM_CONFIG.sources.kalshi`, in `teamMarket()` — the deferred Phase 4D.
- `TeamOS.espn` exports `newsUrl` and `news`; `tools/adaptercheck.js` asserts the URL, the exact shape, the feed order being preserved, and the missing-image / missing-date / missing-link cases.
- `Game`, `LeagueGame`, `GameDetail` and `NewsItem` are four distinct objects.
- Behavior preserved byte-for-byte against the pre-change capture; one recorded nuance: an article whose date ESPN sends in an unparsable form now sorts last with no date shown, where before its `NaN` timestamp gave the sort an undefined position. ESPN has never sent one.

## Owner

David (decision) / Claude Code (proposal and implementation)

## Related Documents

- `docs/03_DOMAIN_MODEL.md` — NewsItem
- `docs/07_DATA_ARCHITECTURE.md` — the news path
- `docs/08_BUILD_PLAN.md` — Phase 4 status
- `docs/decisions/0004-adapters-are-pure.md`, `0005`, `0006`
- `teamos/espn.js`, `tools/adaptercheck.js`, `tools/fixtures/espn-news.json`
