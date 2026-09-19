# Phase 6 — Team identity, and the Buckeye Watch proof

**Date:** 2026-09-18 · **Branched from:** `5f5baf4` (Phase 5B merged) · **Branch:** `lnd/phase-6-team-identity` · **Decision:** `docs/decisions/0007-identity-is-team-data.md`

## What this closes

Phase 5A finding 4: under an Ohio State config every ESPN-fed surface was correct, and the page still said "Irish Watch — Notre Dame football" in navy and gold, because identity was authored into `index.html`, `manifest.json`, the icon files and `app.css`.

## What changed

| File | Change |
|---|---|
| `teamos/identity.js` | **new.** `TeamOS.identity.create(config, team)` → frozen Identity; `contrast`, `luminance`, `MIN`. Validates every colour, enforces 4.5:1 on `accentText`, `accentSoft`, `accentInk` and a declared `text`, reports the accent's own ratio without enforcing it. Pure: no fetch, no DOM, no globals. |
| `teams/notre-dame.js` | `identity` section: Irish Watch, its head copy, the motto, eleven colours, three type stacks, five asset paths |
| `teams/ohio-state.js` | `identity` section: Buckeye Watch, BUX scarlet as a **fill**, BUX gray-light as accent **text**, charcoal surfaces, `BuckeyeSans`/`BuckeyeSerif` with fallbacks, `motto: null`, `assets: {}` |
| `app.js` | `paintIdentity()` — head, header lockup, motto, sr-only headings, `:root` tokens; a tag is set when the team has a value and **removed** when it does not. `isND`/`nd` → `mine` |
| `app.css` | one team-token block; **167 literals replaced**; the `--gold`/`--navy` alias layer dropped so no variable name names a team's colour; section label `content` now comes from the team |
| `index.html`, `sw.js` | one script tag, `id="dataHead"`, asset hrefs; `VERSION` → `iw-2026-09-18d`, shell list updated |
| `assets/notre-dame/` | the nine Notre Dame files, moved with `git mv`, product-neutral names |
| `assets/ohio-state/manifest.json` | **new**, `"icons": []` — no artwork, none referenced |
| `tools/adaptercheck.js` | 233 → **314 checks** |

## Notre Dame: unchanged

Captured before any edit, re-captured after, with a forced revalidating reload.

- **Document head** — 15 fields, **only the 7 intended asset-path changes**. Title, description, theme-color, application name, Apple title, OG and Twitter title/description byte-identical.
- **Copy** — kicker, `<h1>`, motto, both sr-only headings, the News section rule: **zero diffs**.
- **Computed styles** — 22 element and pseudo-element groups including all twenty `:root` variables, the body and `html` gradients, `.page::before`, the sparkline stroke, the tab bar, `.row.next`, `h2.sec`: **two diffs**, both from the ink unification below.
- **Panels** — Top 25: 72 rows before and after, 2 live both times; of the 70 non-live rows **69 byte-identical**, the one difference a betting line that moved (O/U 57.5 → 58.5). Hero identical but for the rain chance. Schedule, Depth, News, strip, odds board, tab bar, header identical.
- **Behaviour** — roster fold 100 players, depth history 3 reports, 6 folds, odds board 51 bars with Notre Dame marked and its name still `#FFE38A`, both sparklines, 89 stories from 5 sources with 60 beat items. 375 px: no horizontal scroll. Service worker rolled to `iw-2026-09-18d`. **Zero console errors** on every load.
- **After the proof was reverted**: head diffs **zero**, style diffs **zero**, depth 6 folds / 3 weeks, news 89 / 60 beat, 2 sparklines.

### The nine values that moved

Required to make the palette team-neutral; four near-identical darks became one ink token, three surface one-offs joined their family, two golds became one.

| Where | Before → After | |
|---|---|---|
| `.skip` ink | `#231A03` → `#07192F` | 6.48 → 6.65:1, measured |
| `.tag.h` ink | `#101A28` → `#07192F` | 6.59 → 6.65:1, measured |
| `.battle` ink | `#111A26` → `#07192F` | measured |
| segmented-control ink | `#101C2B` → `#07192F` | 6.47 → 6.65:1 |
| `.obar .track` background | `#081A30` → `#07192F` | measured |
| hero gradient stop | `#12345A` → `#143865` | measured |
| one scrim | `rgba(4,15,27,.96)` → `rgba(6,21,37,.96)` | |
| one hover | `rgba(18,52,90,.72)` → `rgba(20,56,101,.72)` | |
| `.trophy` | `#D9B94F` → `#D8B84F` | 1/255; overridden to the accent above 48rem anyway |

## Buckeye Watch: the proof

`index.html` pointed at `teams/ohio-state.js` in the working tree. **Nothing else changed** — not `app.js`, not `app.css`, not `teamos/`, not the service worker. Caches and the worker were cleared first. The swap was reverted afterwards and is not committed.

| Surface | Observed |
|---|---|
| Document | `<title>` **Buckeye Watch · Ohio State Football**; description, OG and Twitter title/description all Ohio State's; `theme-color` `#212325`; manifest `assets/ohio-state/manifest.json`; **zero icon tags, no `og:image`, no `twitter:image`, no `twitter:card`** — omitted, not broken |
| Header | kicker **OHIO STATE FOOTBALL**, `<h1>` **Buckeye Watch**, scarlet rank pill `#6`, record `1-1`; the motto element is **removed**, not blanked |
| Home | vs Kent State, Saturday 12:00 PM on FOX, Ohio Stadium Columbus, OSU −52.5 / O/U 59.5, forecast 73°F clear; title 12% ▼1, playoff 71% ▼2 — **and no sparklines**, because Ohio State declares no odds history (Phase 5B) |
| Top 25 | 72 rows, 22 ranked games, AP #6 / Coaches #6, Ohio State's row marked `mine` with a scarlet rule |
| Game Center | Kent State at **OSU Ohio State Buckeyes**, matchup preview KENT vs OSU, team toggle defaults to OSU |
| Depth | roster fold + "**No depth chart.** Ohio State has no depth chart source in this Suite yet." — then 100 Buckeyes (Brandon Inniss…), Offense 47 / Defense 46 / Special 7, link to ohiostatebuckeyes.com |
| News | rule **LATEST BUCKEYE NEWS**, 30 ESPN stories, **0 beat items**, source labels in BUX gray-light |
| Odds board | 51 bars, "Ohio St." marked, scarlet fill, its name in `#EFF1F2` |
| Responsive | 375 px, no horizontal scroll, maximum overflow 0 px |
| Console | zero errors on every load |

### Leakage sweep

Over the live page with every tab visited: **no Notre Dame text node, attribute, generated-content string or head tag**; `docHasNDref` false; no Notre Dame value in any resolved team token. The only occurrences of "Notre Dame" anywhere in the rendered page are three rows in the national Top 25 — Notre Dame as a *ranked opponent*, none marked `mine`, exactly as Ohio State appeared inside Irish Watch.

### Contrast audit, live

Every visible text element on all six surfaces, with the effective background composited through the ancestor stack and the large-text threshold applied: **846 elements checked, 0 failures.** Spot values: `<h1>` 19.8:1, kicker 8.3:1, story headline 16.0:1, source label 15.5:1, rank pill on scarlet 6.6:1.

## What the proof found

1. **`#panel-news:before{content:"LATEST FROM SOUTH BEND"}`** — a section rule naming Notre Dame's home town, in CSS, which rendered above Ohio State's stories. Caught by looking at a screenshot, not by a text query, because generated content is not in the DOM. Fixed: the rule is now `content:var(--t-news-label)` and the string is `identity.newsLabel` — "LATEST FROM SOUTH BEND" for Notre Dame, "LATEST BUCKEYE NEWS" for Ohio State. The leak gate now covers home towns and generated content.
2. **`--gold` holding `#BA0C2F`.** The first cut kept `--gold`, `--navy` and `--gold-line` as aliases so the 580-line sheet did not need rewriting. Under Ohio State a variable named `--gold` resolved to scarlet, which is a lie to the next reader. The alias layer was removed; every rule now names `--t-accent`, `--t-accent-text`, `--t-surface`, `--t-deep`, `--t-focus`. A check forbids `--gold`/`--navy` returning.
3. **The service worker precaches the wrong team.** Confirmed directly: on an Ohio State page the shell cache held `teams/notre-dame.js`, the five Notre Dame icons and its manifest, and the data cache held `depth.json`, `depth-history.json`, `odds-history.json` and `news.json` — none of which the page requested or rendered. `SHELL_FILES` and `DATA_FILES` name one team's files because a worker cannot read `TEAM_CONFIG`. **Not fixed, by instruction**: this is the Phase 7 team-selection question.

## Remaining findings

| Source | Finding | Status |
|---|---|---|
| 5A #4 | Branding and copy | **fixed** — identity is data |
| 5A #5 | Service worker shell list and cache pinning | **Phase 7**, reproduced with evidence above |
| 5A #6 | "Playing for the …" assumes every series name is a trophy | unchanged, deferred |
| 5B | `DATA_FILES` precaches the Notre Dame snapshots for any team | **Phase 7**, now observed under Ohio State |
| new | Static `index.html` head and `:root` defaults carry the deployed team, so a differently configured page shows the previous team for an instant and to non-executing crawlers | documented limitation; the static-manifest decision has the same shape |
| new | Ohio State has **no approved artwork**: no favicon, no app icon, no share image, no header mark. Buckeye Watch installs without a custom icon | by decision; a config-only change when artwork arrives |
| new | Ohio State's official webfonts are named but **not distributed** and no `@font-face` is declared, so Buckeye Watch currently renders in the Suite's Barlow | awaiting permission; a resource change, not an architectural one |
| new | The Suite's neutral greys are faintly blue (`#8093A8`, `#9AA9BA` and kin), tuned for a navy page. Ohio State overrides `text`/`textDim` with BUX white and gray, but the remaining one-off greys are still the Suite's | noted; promote further neutrals to tokens only if a third team needs it |

## Checks

`node --check` over `app.js`, `sw.js`, both team configs and all four `teamos/` modules · `python3 tools/csscheck.py app.css` → 352 rules, 0 shadowed, 0 dead · `node tools/adaptercheck.js` → **314 checks pass**, including that `app.js` carries no colour literal, no team name and no team-id branch, that `app.css` carries no team colour, variable name or home town outside the token block, and that both teams are legible.

## What this proves

Two teams, one Suite, one stylesheet, one `app.js`. The difference between Irish Watch and Buckeye Watch is a configuration file and a folder of artwork — and where Ohio State has no artwork and no depth chart, the product says so plainly instead of borrowing Notre Dame's. The one thing the architecture still cannot express is *which* team a deployment is for, which is Phase 7.
