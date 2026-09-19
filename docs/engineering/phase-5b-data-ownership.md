# Phase 5B — Second-team data ownership

**Date:** 2026-09-18 · **Branched from:** `66a77c6` (Phase 5A tip) · **Branch:** `lnd/phase-5b-data-ownership` · **Decision:** `docs/decisions/0008-snapshots-are-owned-by-declaration.md`

## What this resolves

Phase 5A findings 1–3: under an Ohio State config the page showed Notre Dame's depth chart, Notre Dame's odds sparklines and sixty Notre Dame beat stories, because `app.js` read `depth.json`, `depth-history.json`, `odds-history.json` and `news.json` by name for whichever team was configured.

## Ownership model

| Question | Who answers | How |
|---|---|---|
| Does this team have a depth chart / odds history / beat feed? | the team config's `snapshots` section | one entry per kind the team has; a team without a source leaves it out |
| Where is it? | the entry's `file` (and `history` for depth) | the Suite never names a file itself |
| Does the loaded file belong to this team? | `TeamOS.snapshots.owned(team, json)` | a `team` field, when present, must equal the Team's id; a file without one is trusted because the team declared it |

The Suite asks `TeamOS.snapshots.get(config, kind)` and behaves identically for every team:

- **no declaration** → nothing fetched; the surface shows its unavailable state
- **declared, loaded, owned** → rendered
- **declared but missing or not owned** → treated as missing

There is no team name anywhere in `app.js` or `teamos/snapshots.js` code (the adapter check asserts it).

## What changed

| File | Change |
|---|---|
| `teamos/snapshots.js` | **new** — `TeamOS.snapshots.get(config, kind)` and `.owned(team, json)`; pure, 30 lines of code |
| `teams/notre-dame.js` | `snapshots: { depth: { file, history, label: "UHND" }, oddsHistory: { file }, beatNews: { file } }` |
| `teams/ohio-state.js` | `snapshots: {}` |
| `app.js` | `loadSparklines`: return when no declaration; skip when not owned. `loadDepth`: no declaration → roster fold + "No depth chart." message, marked loaded; file from the declaration; `build` refuses an unowned file; the "Notre Dame …" and "UHND" copy now come from `TEAM.name` and the declaration's `label` (same output for Notre Dame). `loadHistory`: only when the declaration has a `history`; skip when not owned. `loadNews`: the beat file enters the cache keys, the fetch and the merge only when declared and owned; the "no stories" copy no longer mentions beat feeds for a team without them |
| `index.html` | one `<script>` tag for `teamos/snapshots.js` |
| `sw.js` | `teamos/snapshots.js` in `SHELL_FILES`; `VERSION` `iw-2026-09-18b` → `iw-2026-09-18c` |
| `tools/adaptercheck.js` | loads `snapshots.js` in the existing Notre Dame context and in a second Ohio State context; 26 new checks (233 total) |
| docs | 04, 05, 07, 08, the 5A report's status, decision 0008, this report |

Not changed: `.github/workflows/odds.yml`, `manifest.json`, `app.css`, the snapshot files, `teamos/espn.js`, `teamos/team.js`.

## Validation

All of it on the same code path for both teams; the only difference between the runs is which config file `index.html` loads (the Ohio State swap was made in the working tree, exercised, and reverted — not committed).

**Node harness** (`loadSparklines`, `loadDepth`, `loadHistory`, `loadNews` lifted from `app.js` into a vm context with the page stubbed, fed the committed snapshot files and the ESPN news fixture; run against `66a77c6` and against this branch):

| | Notre Dame before (66a77c6) | Notre Dame after | Ohio State before | Ohio State after |
|---|---|---|---|---|
| fetched | odds-history, depth, ESPN news, news.json, depth-history | **identical** | the same five ND files | ESPN news only |
| sparklines | 13→13 and 86→87 | **identical** | ND's 13→13 / 86→87 (leak) | none |
| depth HTML | 16,944 chars | **byte-identical** (cached paint too) | ND's two-deep (leak) | roster fold + "No depth chart. Ohio State has no depth chart source in this Suite yet." |
| news HTML | 28,147 chars, 64 items, 5 sources | **byte-identical**, same cache keys | 64 items incl. 60 ND beat (leak) | 4 items, ESPN only, cache key for the beat file `null` |

**Browser** (`http.server`, service worker and caches cleared before each team; `?fresh=` on the first load):

- *Notre Dame, first load, SW 18c installs:* Depth panel `innerHTML` byte-identical to the pre-change capture (18,991 chars; three week-by-week history reports); News byte-identical (89 stories, 60 beat, 5 sources); odds strip identical with both sparklines. Shell cache lists `teamos/snapshots.js`. Console: no errors.
- *Notre Dame, second load (SW-controlled):* same depth sections; roster fold loads 100 players; sparklines present; no errors. 375 px: no horizontal scroll.
- *Ohio State:* header/hero/odds numbers as in 5A (12 % / 71 %, Kent State at Ohio Stadium) with **no sparklines**; Depth tab = roster fold + the unavailable message, roster opens to Ohio State's 100 players (Brandon Inniss…), no Notre Dame, UHND or Faison anywhere in the panel; News = "Latest Ohio State stories", 30 ESPN stories, 0 beat items, none of the four beat outlets present; the page's network log shows **no** request for `odds-history.json`, `depth.json`, `depth-history.json` or `news.json`. Console: no errors.
- *After the revert:* caches cleared again; Notre Dame back with depth/news/strip byte-identical to the baseline.

**Checks:** `node --check app.js`, `node --check sw.js`, `node --check teamos/snapshots.js`, both team files, `python3 tools/csscheck.py app.css` (352 rules, 0 shadowed, 0 dead), `node tools/adaptercheck.js` (233 checks pass; `check.yml` already runs `node --check` over `teamos/**`, so the new file is covered).

## Remaining findings

| 5A # | Finding | 5B status |
|---|---|---|
| 1 | Depth tab shows Notre Dame's two-deep | **fixed** — declared capability with an unavailable state |
| 2 | Odds sparklines draw Notre Dame's history | **fixed** — declared, owned, otherwise the number alone |
| 3 | News merges Notre Dame's beat feeds | **fixed** — declared content source; ESPN alone otherwise |
| 4 | Branding and copy (`<title>`, kicker, h1, manifest, palette, sr-only "Next Notre Dame game") | **deferred to Phase 6**, unchanged |
| 5 | Service worker: shell list names the Notre Dame config; shell + HTTP cache pinned the swapped `index.html` across two loads until cleared | **deferred to Phase 7**, reproduced again this phase (caches had to be cleared to switch teams in both directions). Not fixed, by instruction |
| 6 | "Playing for the …" copy assumes every series name is a trophy | deferred, unchanged |
| new | `sw.js` `DATA_FILES` precaches the six Notre Dame data files for whichever team is loaded. Harmless today — a team that declares nothing never requests them — but it is the same Phase 7 question as #5 | **noted**, Phase 7 |
| new | The committed snapshot files carry no `team` field, so `owned()` rests on the declaration alone until the Action stamps them | **documented limitation**, decision 0008; Action work is out of 5B scope |
| new | The Phase 5A branch was never merged into `project-lnd-platform`; 5B branches from its tip, so merging 5B brings 5A (the Ohio State config and report) with it | for David |

## Recommendation

Phase 5 has now answered its question twice over: the ESPN-fed surfaces needed no code for a second team (5A), and the team-data surfaces needed one two-function TeamOS module and a config section to stop lying (5B). The next wall is the one the roadmap already names — **Phase 6, identity/theme** — since an Ohio State page that says "Irish Watch" in navy and gold is now the only thing on it that is Notre Dame's. The Action parametrization that would make the snapshots *exist* for a second team can follow the Phase 6/7 decisions about how a team is selected and deployed; it should not precede them.
