# Team Configuration

## Principle

**Notre Dame is data, not code.**

Team configuration separates team identity and team-specific capabilities from generic Suite behavior.

## Current Shape (Phase 2)

A team is one file in `teams/` that defines `TEAM_CONFIG`, loaded by `index.html` before `teamos/team.js` and `app.js`. It has four sections, each owned by a different layer:

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
  links: { roster: { url: "...", label: "..." } }
};
```

The real file is `teams/notre-dame.js`. Values shown here are abbreviated.

## What Belongs in Configuration

- `team` — stable identity: id, name, abbreviation, sport, league, home venue
- `sources` — provider identifiers and provider-specific matching or fallback rules
- `series` — team-specific schedule data no public feed carries
- `links` — the team's official pages

Not yet in configuration, pending a real need or a second team: branding/theme, capabilities, content sources (the RSS feeds and depth-chart source still live in `.github/workflows/odds.yml`), history.

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
