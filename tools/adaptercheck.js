#!/usr/bin/env node
/* Check the TeamOS ESPN adapter against a fixture.

   Loads the same three files the page loads - the team config, the Team
   model, the ESPN adapter - into a bare Node scope with no window, no
   document and no fetch, so the adapter cannot quietly depend on any of
   them. Then runs tools/fixtures/espn-schedule.json through it and checks
   the Games that come out: the shape, the team's point of view, neutral
   sites, broadcasts and the fallback, series, and that nothing ESPN-shaped
   leaks through.

   Usage:  node tools/adaptercheck.js
   Exit status is 1 if anything fails, so it can gate a push. */
"use strict";
var fs = require("fs"), path = require("path"), vm = require("vm");

var root = path.join(__dirname, "..");
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

// A context with nothing but the two globals the scripts define.
var ctx = vm.createContext({});
["teams/notre-dame.js", "teamos/team.js", "teamos/espn.js"].forEach(function (f) {
  vm.runInContext(read(f), ctx, { filename: f });
});
var TEAM_CONFIG = ctx.TEAM_CONFIG, TeamOS = ctx.TeamOS;
var fixture = JSON.parse(read("tools/fixtures/espn-schedule.json"));

var failures = 0;
function ok(cond, what) {
  if (cond) { console.log("  ok   " + what); return; }
  failures++; console.log("  FAIL " + what);
}
function eq(a, b, what) { ok(JSON.stringify(a) === JSON.stringify(b), what + " = " + JSON.stringify(b)); }

// ---- source hygiene ----
var src = read("teamos/espn.js");
console.log("teamos/espn.js");
ok(!/\bfetch\s*\(/.test(src),                          "does not call fetch()");
ok(!/\b(document|window|navigator|localStorage|caches)\b/.test(src), "does not touch the DOM or browser storage");
ok(!/\bTEAM_ID\b|\bS\.\w|\bTEAM\b(?!_CONFIG)/.test(src), "does not read application globals (TEAM, TEAM_ID, S)");
ok(typeof ctx.window === "undefined" && typeof ctx.fetch === "undefined", "ran with no window and no fetch");

// ---- URL ----
console.log("scheduleUrl");
eq(TeamOS.espn.scheduleUrl(TEAM_CONFIG),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/87/schedule",
   "matches the URL the page has always fetched (SW cache key)");

// ---- schedule ----
var team = TeamOS.createTeam(TEAM_CONFIG.team);
var games = TeamOS.espn.schedule(fixture, team, TEAM_CONFIG);
var byId = {}; games.forEach(function (g) { byId[g.id] = g; });
var SHAPE = ["id","date","timeSet","home","neutral","oppName","oppRank","venue","city","venueState","zip",
             "net","odds","series","state","detail","us","them","won"];
var LEAK = /competitions|competitors|curatedRank|pickcenter|neutralSite|geoBroadcasts|timeValid|shortDetail|displayValue|zipCode|homeAway|espn/i;

console.log("schedule()");
eq(games.length, 4, "one Game per event");
eq(games.map(function (g) { return g.id; }), ["401858438","401858453","401858460","401858471"], "sorted oldest first");
games.forEach(function (g) {
  eq(Object.keys(g), SHAPE, g.id + " has exactly the documented Game fields");
  ok(!LEAK.test(JSON.stringify(g)), g.id + " carries no ESPN keys or names");
  ok(!("state" in g) || ["pre","in","post"].indexOf(g.state) > -1, g.id + " state is a game status (" + g.state + ")");
});

var msu = byId["401858453"], wis = byId["401858438"], navy = byId["401858471"], pur = byId["401858460"];

console.log("home game, future (Michigan St)");
eq([msu.home, msu.neutral, msu.state, msu.timeSet], [true, false, "pre", true], "home, not neutral, pre, time set");
eq([msu.oppName, msu.oppRank], ["Michigan St", null], "opponent by short name; unranked -> null");
eq([msu.venue, msu.city, msu.venueState, msu.zip], ["Notre Dame Stadium","Notre Dame","IN","46556"], "venue fields; venueState is the U.S. state");
eq(msu.net, "NBC", "broadcast from competition.broadcasts");
eq(msu.series, "Megaphone Trophy", "series from config");
// won is `winner===true` whenever our side is present, so a future game reads false, not null - as it always has
eq([msu.us, msu.them, msu.won, msu.odds], [null, null, false, null], "no score, not won, no odds before kickoff");

console.log("final at a neutral pro venue, listed home (Wisconsin at Lambeau)");
eq([wis.home, wis.neutral, wis.state, wis.detail], [true, true, "post", "Final"], "listed home but neutral; post; detail");
eq([wis.us, wis.them, wis.won], ["41","13", true], "score from our side and theirs; won");
eq(wis.series, "Shamrock Series", "series from config");
eq(wis.venueState, "WI", "venueState");

console.log("away at a neutral venue (Navy at Gillette)");
eq([navy.home, navy.neutral, navy.oppName, navy.series], [false, true, "Navy", "Rip Miller Trophy"], "away, neutral, series");
eq(navy.net, "CBS", "broadcast found in geoBroadcasts only");

console.log("away, placeholder kickoff, no broadcast (Purdue)");
eq([pur.home, pur.neutral, pur.timeSet], [false, false, false], "away, real home field, time not set");
eq(pur.net, "Peacock", "broadcast fallback from config.sources.espn.broadcastFallback");
eq(pur.series, "Shillelagh Trophy", "series from config");

// ---- gameOdds ----
console.log("gameOdds()");
eq(TeamOS.espn.gameOdds({ pickcenter: [{ details: "ND -29.5", overUnder: 52.5 }] }), { line: "ND -29.5", total: 52.5 }, "line and total from pickcenter");
eq(TeamOS.espn.gameOdds({ pickcenter: [{ overUnder: 50 }] }), { line: null, total: 50 }, "missing line -> null, total kept");
eq(TeamOS.espn.gameOdds({}), null, "no pickcenter -> null");
eq(TeamOS.espn.gameOdds(null), null, "no summary -> null");

// ---- transitional helpers ----
console.log("transitional helpers (Top 25 path)");
eq(typeof TeamOS.espn.timeIsSet + typeof TeamOS.espn.broadcast + typeof TeamOS.espn.odds, "functionfunctionfunction", "timeIsSet, broadcast, odds exported");
eq(Object.keys(TeamOS.espn).sort(), ["broadcast","gameOdds","odds","schedule","scheduleUrl","timeIsSet"], "and nothing else");

console.log("\n" + (failures ? failures + " check(s) FAILED" : "all adapter checks passed"));
process.exit(failures ? 1 : 0);
