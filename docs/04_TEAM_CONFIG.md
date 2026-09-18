# Team Configuration

## Principle

**Notre Dame is data, not code.**

Team configuration separates team identity and team-specific capabilities from generic Suite behavior.

## Current Shape (Phase 5B)

A team is one file in `teams/` that defines `TEAM_CONFIG`, loaded by `index.html` before `teamos/team.js` and `app.js`. It has five sections, each owned by a different layer:

```js
var TEAM_CONFIG = {
  // The Team domain object. Provider-neutral. TeamOS.createTeam() validates
  // and freezes it; app.js uses the result for every domain read.
  team: {
    id: "notre-dame",
    name: "Notre Dame",
    abbreviation: "ND",
    sport: "football",
    league: "college-football",
    venue: { name: "Notre Dame Stadium", lat: 41.6984, lon: -86.2339 }
  },

  // How each provider identifies this team, plus patches for feed gaps.
  // Read by app.js for now; moves inside the Phase 3 adapters.
  sources: {
    espn:   { teamId: "87", broadcastFallback: [ /* [opponent regex, network] */ ] },
    kalshi: { tickerSuffix: "-ND", namePattern: /notre dame|fighting irish/i }
  },

  // Trophy games by opponent. Schedule data, headed for Game in Phase 3.
  series: [ /* [opponent regex, trophy name] */ ],

  // The team's own pages.
  links: { roster: { url: "...", label: "..." } },

  // The team-data files the Action writes for this team, by kind. A kind
  // the team has no source for is left out, and the Suite shows that
  // surface as unavailable instead of reading another team's file.
  // Read through TeamOS.snapshots (Phase 5B, decision 0006).
  snapshots: {
    depth:       { file: "depth.json", history: "depth-history.json", label: "UHND" },
    oddsHistory: { file: "odds-history.json" },
    beatNews:    { file: "news.json" }
  }
};
```

The real files are `teams/notre-dame.js` and `teams/ohio-state.js` (which declares `snapshots: {}`). Values shown here are abbreviated.

## What Belongs in Configuration

- `team` — stable identity: id, name, abbreviation, sport, league, home venue
- `sources` — provider identifiers and provider-specific matching or fallback rules
- `series` — team-specific schedule data no public feed carries
- `links` — the team's official pages
- `snapshots` — which of the Action-written team-data files this team has (the depth chart is a capability; the beat feed is a content source; the odds history is team-scoped) and where they are

Not yet in configuration, pending a real need: branding/theme (Phase 6), history. The sources behind the snapshots — the RSS feed list and the depth-chart scrape — still live in `.github/workflows/odds.yml`; the config declares that the team has them, not yet how they are produced.

## What Does Not Belong in Configuration

Do not turn configuration into a dumping ground for arbitrary code or UI behavior.

Avoid fields such as:

- HTML templates
- Rendering functions
- Provider response objects
- Large conditional rule sets
- One-off hacks that should actually be fixed in TeamOS

## Ohio State Test

A second team should be addable by supplying a second configuration object and any required provider/source mappings.

The Suite should not need to be duplicated.

Run twice (Phase 5A, 5B — `docs/engineering/`): every ESPN-fed surface rendered Ohio State from configuration alone, and the three surfaces fed by the Action's Notre Dame files now show Ohio State an honest unavailable state because its config declares no snapshots.

## Exceptions

Real exceptions will exist. The preferred order is:

1. Generic domain behavior
2. Team configuration
3. TeamOS adapter/normalization rule
4. Explicit capability
5. Only then, a narrowly scoped exception

Avoid spreading one-off exceptions through rendering code.

## Keep the Initial Schema Small

Do not design a perfect universal sports schema before a second use case exists. Start with what Irish Watch needs, then validate the model against Ohio State and the next sport.
