# Project LND Domain Model

The domain model should describe sports concepts, not provider schemas.

## Core Entities

### Sport

Represents a sport such as football, basketball, baseball, hockey, or soccer.

### League

Represents a competition or league such as NCAA/FBS, NFL, NBA, MLB, NHL, MLS, or EPL.

### Team

Represents the core team identity. **Implemented in Phase 2** as `TeamOS.createTeam()` in `teamos/team.js`, which validates the `team` section of a team config and returns a frozen, provider-neutral object.

Fields (all required):

- `id` — stable domain id, e.g. `"notre-dame"`
- `name`
- `abbreviation`
- `sport`
- `league`
- `venue.name`, `venue.lat`, `venue.lon` — the home field

Team is provider-neutral: it carries no ESPN, Kalshi or other provider identifiers. Those live in the team config's `sources` section (see `docs/04_TEAM_CONFIG.md` and `docs/decisions/0001-team-is-provider-neutral.md`).

Not yet modelled, pending a real need or a second team: `shortName`, conference/division, identity/branding, capabilities, history.

### Team Identity

Represents presentation and branding data:

- Primary color
- Secondary color
- Accent color
- Logos
- Typography choices where supported
- Imagery
- Display terminology

### Venue

Represents a home or game venue and relevant location information.

### Game

A team-perspective representation of a scheduled, live or completed game. **Implemented in Phase 3A**, produced only by the TeamOS ESPN adapter (`TeamOS.espn.schedule()` in `teamos/espn.js`).

Game is provider-neutral: nothing in it names ESPN or carries an ESPN key. It is written from the team's point of view — `home`, `us`/`them`, `won` — because that is what a team's Suite renders. The neutral home/away form for league-wide views is `LeagueGame`, below; the two are kept distinct on purpose.

Fields, in order:

| Field | Meaning |
|---|---|
| `id` | the game's id (currently the provider's event id, used as an opaque key) |
| `date` | kickoff, ISO 8601 |
| `timeSet` | whether the kickoff time is real or a placeholder |
| `home` | the team is the listed home side |
| `neutral` | neutral site, whether flagged by the feed or inferred from the venue |
| `oppName` | opponent's short name |
| `oppRank` | opponent's rank if inside the top 25, else `null` |
| `venue` | venue name |
| `city` | venue city |
| `venueState` | venue's U.S. state code, e.g. `"IN"` |
| `zip` | venue zip |
| `net` | broadcast network(s), or `""`; includes the team config's broadcast fallback when the feed has none |
| `odds` | `{ line, total }` or `null`; may be filled after the fact by `TeamOS.espn.gameOdds()` |
| `series` | trophy/series name from the team config's `series` table, or `null` |
| `state` | **game status**: `"pre"`, `"in"` or `"post"` |
| `detail` | human-readable status text, e.g. `"Final"` or `"9/19 - 7:30 PM EDT"` |
| `us`, `them` | scores as displayed, or `null` before kickoff |
| `won` | `true` when the team won; `false` otherwise, including before kickoff |

`state` and `venueState` are distinct on purpose. Before Phase 3A both meanings were written to one `state` key and the game status won, so the venue's state was never available; `venueState` corrects that (see `docs/decisions/0002-adapters-are-pure.md`).

Games are plain objects and are not frozen; the application patches `odds` onto the next game once the pregame line arrives.

Not yet modelled: season, weather (computed by the application from `venue`/`city`/`zip`).

### LeagueGame

A game in the league, seen from nowhere in particular. **Implemented in Phase 4A**, produced only by `TeamOS.espn.scoreboard()`. It is deliberately distinct from `Game`: `Game` answers "what is my team doing", `LeagueGame` answers "what is happening in the league this week". The two are not merged because every consumer of one would need conditionals to read the other.

| Field | Meaning |
|---|---|
| `id` | the game's id (provider event id, opaque; rows are keyed on it) |
| `date`, `timeSet` | kickoff and whether the time is real |
| `state`, `detail` | `"pre"` / `"in"` / `"post"` and the status text |
| `venue` | venue name |
| `net` | broadcast network(s), or `""` |
| `odds` | `{ line, total }` or `null` |
| `home`, `away` | `{ name, rank, score }` — `rank` is `null` outside the top 25; `score` is the displayed string or `null` |
| `mine` | the team is one of the two sides |
| `live` | `{ downDistance, lastPlay }` while `state === "in"`, else `null` |

The adapter returns every game the feed lists, oldest first; "ranked games" are the ones where either side has a rank, and "is anything live" is `some(state === "in")` — both derived by the application from the list.

### Poll

One ranking. **Implemented in Phase 4A**, produced by `TeamOS.espn.rankings()`, which also decides which polls matter (CFP, AP, Coaches — FCS and lower divisions dropped), orders them (CFP first) and keeps one per label when the feed publishes a poll twice.

```
{ key, label, name, asOf, ranks: [ { rank, team, record, previous, isNew, mine } ] }
```

`key` is the label with non-alphanumerics stripped (used for element ids and remembered selection); `label` ∈ `"CFP" | "AP" | "Coaches"` or a short name; `asOf` e.g. `"Week 3"`. In a rank, `previous` is the prior rank or `null`, and `isNew` is true for a team new to the poll — kept separate because the feed distinguishes "was unranked" from "no history".

### Player

A roster entry. **Implemented in Phase 3B**, produced only by `TeamOS.espn.roster()`. Provider-neutral; exactly the fields the roster view shows and searches, all strings, empty when the feed has nothing:

| Field | Meaning |
|---|---|
| `name` | display name |
| `jersey` | number as printed, e.g. `"75"`; a string, sorted numerically by the view |
| `position` | abbreviation, e.g. `"OL"`, falling back to the full name |
| `positionName` | full position name, e.g. `"Offensive Lineman"` — kept so a search for "quarterback" matches |
| `height`, `weight` | as displayed, e.g. `"6' 7\""`, `"320 lbs"` |
| `classYear` | e.g. `"SR"` |
| `hometown` | `{ city, state }`; `state` is `""` for players from outside the U.S. |

### RosterGroup

`{ key, label, players: Player[] }` — a unit of the roster: `key` is the feed's unit key lowercased (`"offense"`, `"defense"`, `"specialteam"`), `label` is the display label. Empty units are dropped; a feed that sends a flat list yields one group `{ key: "all", label: "Roster" }`. Produced by `TeamOS.espn.roster()`.

### TeamStatus

`{ rank, record }` — the team's current poll rank (`null` outside the top 25) and overall record string (`"2-0"`, or `null`). **Implemented in Phase 3B**, produced by `TeamOS.espn.teamStatus()`; drives the two header chips.

### Depth

Depth chart, availability and sport-specific lineup concepts. Not yet modelled: the Depth tab consumes the Action-written `depth.json` snapshot directly.

### Ranking

See `Poll` above.

### News Item

A normalized article/content item:

- id
- title
- summary
- source
- url
- publishedAt
- image
- team association
- sport/league association

### Media Item

Represents podcasts, videos, social content, or other media sources.

### History

Represents historical seasons, records, results, rivalries, championships, and related context.

### User

Represents a fan once personalization/account functionality is introduced.

### My Teams

Represents the teams a user follows and the user's preferences around them.

### Event

A generic domain event that can support schedules, notifications, community activity, or future workflows.

## Domain Principles

1. Domain objects should be provider-neutral.
2. Provider-specific IDs can exist as external identifiers but should not become domain identity.
3. Optional fields are preferable to fake universal concepts.
4. Sport-specific concepts should be modeled intentionally.
5. Suite should consume domain objects rather than raw APIs.
