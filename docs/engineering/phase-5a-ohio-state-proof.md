# Phase 5A — The Ohio State proof

**Date:** 2026-09-18 · **Platform tip:** `3edf7fa` (Phase 4C merged) · **Branch:** `lnd/phase-5a-ohio-state-proof`

## What was done

`teams/ohio-state.js` was written with the same four sections as `teams/notre-dame.js` and values verified against the feeds that morning (ESPN team `194`, home field spelled "Ohio Stadium", Kalshi markets `KXNCAAF-27-OSU` / `KXNCAAFPLAYOFF-26-OSU` named "Ohio St."). In a local working tree, the one `<script>` tag in `index.html` was pointed at it instead of the Notre Dame file. **Nothing else changed** — not `app.js`, not `teamos/`, not the service worker, not a stylesheet. The test browser's service worker and caches were cleared first so no Notre Dame shell or data was served from cache. Every tab was then driven and recorded.

The swap was not committed. This document and the config file are the deliverables; the roadmap's purpose for Phase 5 is to *learn* what a second team exposes, not to ship one.

## What rendered correctly — from configuration alone

| Surface | Observed for Ohio State | Driven by |
|---|---|---|
| Header chips | `#6`, `1-1` | `TeamStatus` via `sources.espn.teamId` |
| Hero | "Next up · home game — **vs Kent State** — Saturday, September 19 at 12:00 PM EDT on **FOX** — Ohio Stadium, Columbus — OSU −52.5 / O/U 59.5" | `Game[]`, `gameOdds()` |
| Kickoff forecast | "75°F, clear, 1% chance of rain, wind 5 mph" at Ohio Stadium | `team.venue.lat/lon` |
| Schedule | 12 rows; Ball State **W 56–3**, at #4 Texas **L 23–24**, Kent State, Illinois "Playing for Illibuck Trophy"; HOME/AWAY tags correct; no false neutral sites | `Game[]`, `series` |
| Odds strip + board | 12% title / 71% playoff (▼1, ▼2); board row #4 "Ohio St." highlighted | `sources.kalshi` |
| Game Center (pre-game) | Kent State at **OSU** Ohio State Buckeyes; status; matchup preview KENT vs OSU (6 rows); season leaders; team toggle defaults to OSU | `GameDetail`, `SeasonStat`, `Side.mine` |
| Expanded final (Texas) | OSU 23 – Texas 24, lead marking, 19 box tables, 8 stat rows with winners, scoring 5 ours / 4 theirs | `GameDetail` |
| Top 25 | 22 ranked games; "Kent State at #6 Ohio State" highlighted as ours; AP #6 / Coaches #6 pills; Ohio State highlighted in both polls | `LeagueGame.mine`, `Poll.ranks[].mine` |
| Roster | 100 players (Brandon Inniss…), Offense 47 / Defense 46 / Special 7, official link to ohiostatebuckeyes.com | `RosterGroup[]`, `links.roster` |
| News (ESPN half) | Heading "Latest Ohio State stories"; 30 ESPN stories about Ohio State ("What does Ohio State need to do differently?", "No. 6 Ohio State shifts focus to Kent State…") | `NewsItem[]` via `newsUrl(config)` |
| Console | zero errors | — |

That is every ESPN-fed surface. The Phase 1A–4C boundary held: **changing the team required zero application code.**

## What rendered wrongly — Notre Dame leaking through

Ordered by severity. The first three are worse than a blank, because they show *another team's data under Ohio State's name* with nothing to tell a fan.

| # | Surface | Observed | Cause | Belongs to |
|---|---|---|---|---|
| 1 | **Depth tab** | Notre Dame's two-deep (WR Jordan Faison…), Notre Dame's injury report, copy "Notre Dame publishes a new two-deep most Tuesdays" | `depth.json` / `depth-history.json` are written by the Action from UHND, a Notre Dame-only source, and the tab reads them regardless of team | Capability decision: a team either has a depth-chart source or it does not, and the Suite needs to know which |
| 2 | **Odds sparklines** | "Season range 13 to 13 percent since 2026-09-16" drawn under Ohio State's **12%**; "86 to 87" under its **71%** | `odds-history.json` is Notre Dame's price series, unkeyed by team; `loadSparklines()` draws it for whoever is configured | Team-keyed or team-gated history |
| 3 | **News (beat half)** | 60 Notre Dame beat-writer stories (One Foot Down 10, Slap the Sign 35, UHND 10, NDNation 5) merged under "Latest Ohio State stories" — "2026 NOTRE DAME FOOTBALL: Irish VS Michigan State Spartans" | `news.json` is written by the Action from six Notre Dame RSS feeds; the tab merges it unconditionally | Beat feeds are team content sources; the snapshot needs to declare whose it is, or the config which it wants |
| 4 | **Branding and copy** | `<title>` "Irish Watch — Notre Dame football", kicker "NOTRE DAME FOOTBALL", h1 "Irish Watch", motto "Leave No Doubt", sr-only "Next Notre Dame game" and "Notre Dame and national football data", manifest name/description/icons, `theme-color`, navy/gold palette, `.nd` class | `index.html`, `manifest.json`, `app.css`, the icon PNGs/SVG carry Notre Dame identity directly | **Phase 6** (identity/theme) — expected, not a Phase 5 defect |
| 5 | Service worker shell list | `SHELL_FILES` precaches `teams/notre-dame.js`; a second config file is not in it. Observed directly: after the swap was reverted, the test browser kept serving the Ohio State page for two loads — the shell cache (stale-while-revalidate) and the browser's HTTP cache both pinned the `index.html` that named the team file, and only clearing them brought Notre Dame back | `sw.js` and `index.html` name the team file; the shell strategy is built for a single fixed shell | Whatever mechanism Phase 7 chooses for selecting a team must also decide how the worker precaches and invalidates per-team shells — switching teams cannot be a plain script-tag change |
| 6 | "Playing for the …" copy | Correct for "Illibuck Trophy"; the Michigan game has no trophy and "the The Game" would be wrong, so it was left out of `series` | The schedule copy assumes every series name is a trophy | Small: the config could carry the phrase, or the copy could stop assuming. Deferred; noted |
| 7 | Kalshi routes and help copy | Correct, but the help text links Notre Dame fans and Ohio State fans to the same league championship page — fine, because it is a league market | League-level; no action | — |

Nothing else surfaced. In particular the neutral-site rule, the `won`/lead logic, the `mine` flags, the roster search, the pill/fold state, keyboard tabs and the 25-second poll path needed no attention.

## What the proof says about the architecture

- **The domain boundary is real.** Eight domain objects and one adapter carried a second team with no code change. The thing the roadmap most wanted to know is answered.
- **The remaining coupling is in data, not code.** Three files the Action commits — `depth.json`, `odds-history.json`, `news.json` — are *Notre Dame team data* stored as if they were application data, and one Action (`odds.yml`) produces all three. `app.js` cannot tell whose data they are. This is the first concrete case for the "capabilities / content sources" idea that has been deferred since Phase 2: it is no longer speculative.
- **Nothing was over-abstracted.** No adapter, object or config field existed that Ohio State did not use, except the empty `broadcastFallback` (which is the right value) and the one-entry `series`.
- **Identity is the next wall**, exactly where the roadmap put it (Phase 6). An Ohio State page that says "Irish Watch" is the honest state of a platform without an identity layer.

## Recommended Phase 5B (needs product decisions)

*Decided and implemented 2026-09-18 — see `docs/engineering/phase-5b-data-ownership.md` and `docs/decisions/0008-snapshots-are-owned-by-declaration.md`. Findings 1–3 are closed; 4–6 stand as written.*

Make the three data files honest for a second team, without touching the Action yet:

1. **Depth chart as a declared capability.** The Depth tab shows depth data only when the team's config says it has a source; otherwise a defined empty state. *Decision needed: what the empty state says or whether the tab hides.*
2. **Odds history keyed or gated.** `loadSparklines()` draws only when the history file is for this team. *Decision needed: key the file by team id (Action change later) or gate on team id in the client now.*
3. **Beat feeds as a declared content source.** `news.json` merges only when the config declares beat feeds and the snapshot belongs to this team. *Decision needed: same shape as above.*

All three are small client changes plus a config field each; the Action parametrization that would make them *produce* Ohio State data is later (Phase 5+ / ingestion), and the product decision on whether Ohio State even gets a depth chart comes first.

## Values used

```js
team:    { id:"ohio-state", name:"Ohio State", abbreviation:"OSU", sport:"football", league:"college-football",
           venue:{ name:"Ohio Stadium", lat:40.0017, lon:-83.0197 } }
sources: { espn:{ teamId:"194", broadcastFallback:[] }, kalshi:{ tickerSuffix:"-OSU", namePattern:/ohio st|buckeyes/i } }
series:  [ [/illinois/i, "Illibuck Trophy"] ]
links:   { roster:{ url:"https://ohiostatebuckeyes.com/sports/football/roster", label:"ohiostatebuckeyes.com" } }
```
