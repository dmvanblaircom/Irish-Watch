#!/usr/bin/env node
/* Check the TeamOS ESPN adapter against a fixture.

   Loads the same three files the page loads - the team config, the Team
   model, the ESPN adapter - into a bare Node scope with no window, no
   document and no fetch, so the adapter cannot quietly depend on any of
   them. Then runs the fixtures in tools/fixtures/ through it and checks what
   comes out: Games (shape, the team's point of view, neutral sites,
   broadcasts and the fallback, series), roster groups and Players, the
   team's rank and record - and that nothing ESPN-shaped leaks through.

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

// ---- roster ----
var rosterFixture = JSON.parse(read("tools/fixtures/espn-roster.json"));
var PLAYER = ["name","jersey","position","positionName","height","weight","classYear","hometown"];
var PLEAK = /displayName|fullName|displayHeight|displayWeight|experience|birthPlace|abbreviation|athletes|espn/i;

console.log("rosterUrl / teamUrl");
eq(TeamOS.espn.rosterUrl(TEAM_CONFIG),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/87/roster",
   "roster URL unchanged (SW cache key)");
eq(TeamOS.espn.teamUrl(TEAM_CONFIG),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/87",
   "team URL unchanged (SW cache key)");

console.log("roster()");
var groups = TeamOS.espn.roster(rosterFixture);
eq(groups.map(function (g) { return g.key + ":" + g.label + ":" + g.players.length; }),
   ["offense:Offense:2", "defense:Defense:1", "specialteam:Special:2"],
   "groups keyed on ESPN's unit key, labelled, empty units dropped");
groups.forEach(function (g) {
  eq(Object.keys(g), ["key","label","players"], g.key + " group has exactly key/label/players");
  g.players.forEach(function (p) {
    eq(Object.keys(p), PLAYER, p.name + " has exactly the documented Player fields");
    eq(Object.keys(p.hometown), ["city","state"], p.name + " hometown is {city, state}");
    ok(!PLEAK.test(JSON.stringify(p)), p.name + " carries no ESPN keys or names");
    ok(typeof p.jersey === "string", p.name + " jersey is a string (the sort parses it)");
  });
});
var absher = groups[0].players[0], scaife = groups[2].players[0], walkon = groups[2].players[1];
eq(absher, { name:"Sullivan Absher", jersey:"75", position:"OL", positionName:"Offensive Lineman",
             height:"6' 7\"", weight:"320 lbs", classYear:"SR", hometown:{ city:"Belmont", state:"NC" } },
   "full player: abbreviation shown, full position name kept for search, class abbreviation");
eq([scaife.hometown.city, scaife.hometown.state], ["West Perth", ""], "missing state -> empty string, not undefined");
eq(walkon, { name:"Walk On", jersey:"", position:"Long Snapper", positionName:"Long Snapper",
             height:"", weight:"", classYear:"", hometown:{ city:"", state:"" } },
   "sparse athlete: no jersey/height/weight/class/hometown -> empty strings; position falls back to name");
eq(TeamOS.espn.roster({ athletes: [absherRaw(), absherRaw()] }).map(function (g) { return g.key + ":" + g.label + ":" + g.players.length; }),
   ["all:Roster:2"], "a flat athletes array becomes one group called Roster");
eq(TeamOS.espn.roster({}).map(function (g) { return g.key + ":" + g.players.length; }), ["all:0"], "no athletes -> one empty group");
// the key is lowercased before the camelCase split, so an unknown unit gets a plain capital - as it always has
eq(TeamOS.espn.roster({ athletes: [{ position: "someNewUnit", items: [absherRaw()] }] })[0].label, "Somenewunit", "unknown unit key is capitalised, not in the label map");
function absherRaw() { return rosterFixture.athletes[0].items[0]; }

// ---- team status ----
var teamFixture = JSON.parse(read("tools/fixtures/espn-team.json"));
console.log("teamStatus()");
eq(TeamOS.espn.teamStatus(teamFixture), { rank: 3, record: "2-0" }, "rank and overall record");
eq(TeamOS.espn.teamStatus({ team: { rank: 40, record: { items: [{ summary: "1-1" }] } } }), { rank: null, record: "1-1" }, "rank outside the top 25 -> null");
eq(TeamOS.espn.teamStatus({ team: { rank: 3 } }), { rank: 3, record: null }, "no record -> null");
eq(TeamOS.espn.teamStatus({}), { rank: null, record: null }, "empty payload");
eq(Object.keys(TeamOS.espn.teamStatus(teamFixture)), ["rank","record"], "exactly rank and record");

// ---- scoreboard ----
var sbFixture = JSON.parse(read("tools/fixtures/espn-scoreboard.json"));
var LG = ["id","date","timeSet","state","detail","venue","net","odds","home","away","mine","live"];
var LGLEAK = /competitions|competitors|curatedRank|homeAway|shortDetail|situation|downDistanceText|geoBroadcasts|displayName|espn/i;

console.log("scoreboardUrl / rankingsUrl");
eq(TeamOS.espn.scoreboardUrl(),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=400",
   "scoreboard URL unchanged (SW cache key)");
eq(TeamOS.espn.rankingsUrl(),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings",
   "rankings URL unchanged (SW cache key)");

console.log("scoreboard()");
var lgs = TeamOS.espn.scoreboard(sbFixture, TEAM_CONFIG);
var lgById = {}; lgs.forEach(function (g) { lgById[g.id] = g; });
eq(lgs.length, 4, "one LeagueGame per event, including unranked ones");
eq(lgs.map(function (g) { return g.id; }), ["401858100","401858225","401858226","401858460"], "sorted oldest first");
lgs.forEach(function (g) {
  eq(Object.keys(g), LG, g.id + " has exactly the documented LeagueGame fields");
  eq(Object.keys(g.home), ["name","rank","score"], g.id + " home side is {name, rank, score}");
  eq(Object.keys(g.away), ["name","rank","score"], g.id + " away side is {name, rank, score}");
  // `net` is the broadcaster's own name and can legitimately be "ESPN"; test everything else
  ok(!LGLEAK.test(JSON.stringify(Object.assign({}, g, { net: "" }))), g.id + " carries no ESPN keys or names (outside the broadcaster's name)");
  ok(typeof g.id === "string", g.id + " id is a string (rows are keyed on it)");
});
var mia = lgById["401858226"], pitt = lgById["401858225"], uga = lgById["401858100"], pur = lgById["401858460"];
eq([mia.state, mia.timeSet, mia.detail, mia.venue], ["pre", true, "9/18 - 7:30 PM EDT", "Allegacy Federal Credit Union Stadium"], "future game: state, time, detail, venue");
eq([mia.away, mia.home], [{ name:"Miami", rank:5, score:"0" }, { name:"Wake Forest", rank:null, score:"0" }], "sides: ranked away, unranked home, scores as strings");
eq([mia.net, mia.odds, mia.mine, mia.live], ["ESPN", { line:"MIA -20.5", total:56.5 }, false, null], "broadcast from names[], odds, not ours, not live");
eq([pitt.state, pitt.live], ["in", { downDistance:"1st & 10 at PITT 20", lastPlay:"(03:28) #47 T.Woody kickoff 65 yards to the Pitt00 #24 T.Robinson return 20 yards to the Pitt20" }], "live game carries down/distance and last play");
eq([pitt.home.rank, pitt.away.rank], [null, null], "unranked on both sides (drives live-anywhere but not the ranked list)");
eq([uga.state, uga.home.score, uga.away.score, uga.home.rank, uga.away.rank], ["post", "31", "24", 2, 9], "final: scores and both ranks");
eq([pur.mine, pur.timeSet, pur.net, pur.away.rank], [true, false, "Peacock", 3], "the team's own game: mine, placeholder time, streaming-only broadcast");
eq(lgs.some(function (g) { return g.state === "in"; }), true, "live-anywhere is derivable from LeagueGame[]");
eq(lgs.filter(function (g) { return g.home.rank || g.away.rank; }).map(function (g) { return g.id; }),
   ["401858100","401858226","401858460"], "ranked games are the ones with a side rank");
eq(TeamOS.espn.scoreboard(null, TEAM_CONFIG), [], "no payload -> empty list");

// ---- rankings ----
var rkFixture = JSON.parse(read("tools/fixtures/espn-rankings.json"));
var POLL = ["key","label","name","asOf","ranks"], RANK = ["rank","team","record","previous","isNew","mine"];
var POLLLEAK = /rankings|occurrence|recordSummary|shortName|headline|nickname|location|current|espn/i;

console.log("rankings()");
var polls = TeamOS.espn.rankings(rkFixture, TEAM_CONFIG);
eq(polls.map(function (p) { return p.key + ":" + p.label + ":" + p.ranks.length; }), ["AP:AP:5", "Coaches:Coaches:2"],
   "AP before Coaches; FCS, the duplicate AP and the empty CFP dropped");
polls.forEach(function (p) {
  eq(Object.keys(p), POLL, p.key + " has exactly the documented Poll fields");
  p.ranks.forEach(function (r) { eq(Object.keys(r), RANK, p.key + " #" + r.rank + " has exactly the documented rank fields"); });
  ok(!POLLLEAK.test(JSON.stringify(p)), p.key + " carries no ESPN keys or names");
});
var ap = polls[0];
eq([ap.name, ap.asOf], ["AP Top 25", "Week 3"], "poll name and as-of");
eq(ap.ranks[0], { rank:1, team:"Texas", record:"2-0", previous:4, isNew:false, mine:false }, "moved up: previous kept");
eq(ap.ranks[2], { rank:3, team:"Notre Dame", record:"2-0", previous:1, isNew:false, mine:true }, "the team's own entry: mine");
eq([ap.ranks[3].previous, ap.ranks[3].isNew], [null, true], "previous 0 -> new to the poll");
eq([ap.ranks[4].previous, ap.ranks[4].isNew, ap.ranks[4].team], [null, false, "Volunteers"], "no previous -> null and not new; team name falls back through nickname/name/location");
eq(polls.some(function (p) { return p.label === "CFP"; }), false, "no CFP poll yet (the tab shows its note)");
eq(TeamOS.espn.rankings({}, TEAM_CONFIG), [], "no payload -> empty list");

// ---- game center ----
var GD = ["state","detail","home","away","lastPlay","winProb","linescore","teamStats","leaders","box","scoring"];
var SIDE = ["key","name","abbreviation","record","score","mine"];
var GDLEAK = /competitions|competitors|homeAway|shortDetail|situation|drives|winprobability|homeWinPercentage|linescores|boxscore|scoringPlays|athlete|displayValue|shortDisplayName|pickcenter|espn/i;
var sumPre = JSON.parse(read("tools/fixtures/espn-summary-pre.json"));
var sumLive = JSON.parse(read("tools/fixtures/espn-summary-live.json"));
var sumPost = JSON.parse(read("tools/fixtures/espn-summary-post.json"));

console.log("summaryUrl / seasonStatsUrl");
eq(TeamOS.espn.summaryUrl("401858438"),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=401858438",
   "summary URL unchanged (SW cache key and the final-summaries Cache API key)");
eq(TeamOS.espn.seasonStatsUrl("87", 2026),
   "https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2026/types/2/teams/87/statistics",
   "season-stats URL unchanged");

console.log("gameDetail() - shape");
var gdPre = TeamOS.espn.gameDetail(sumPre, team, TEAM_CONFIG), gdLive = TeamOS.espn.gameDetail(sumLive, team, TEAM_CONFIG), gdPost = TeamOS.espn.gameDetail(sumPost, team, TEAM_CONFIG);
[["pre", gdPre], ["live", gdLive], ["post", gdPost]].forEach(function (pair) {
  var g = pair[1], n = pair[0];
  eq(Object.keys(g), GD, n + " has exactly the documented GameDetail sections");
  eq(Object.keys(g.home), SIDE, n + " home side is a Side");
  eq(Object.keys(g.away), SIDE, n + " away side is a Side");
  ok(!GDLEAK.test(JSON.stringify(g)), n + " carries no ESPN keys or names");
  ok(["pre","in","post"].indexOf(g.state) > -1, n + " state is a game status (" + g.state + ")");
});

console.log("gameDetail() - pregame");
eq([gdPre.state, gdPre.detail], ["pre", "Sat, September 19th at 7:30 PM EDT"], "scheduled, long status text");
eq(gdPre.home, { key:"87", name:"Notre Dame Fighting Irish", abbreviation:"ND", record:"", score:null, mine:true }, "home side: name falls back to displayName, no record or score yet, mine");
eq(gdPre.away.mine, false, "away side is not ours");
eq([gdPre.lastPlay, gdPre.winProb, gdPre.linescore, gdPre.box, gdPre.scoring], [null, null, null, null, null], "no play, win prob, linescore, box or scoring before kickoff");
eq(gdPre.teamStats, null, "pregame per-game stat names match no Team-stats row -> null");
eq(gdPre.leaders.home[0], { category:"Passing", name:"C. Carr", line:"35/49, 492 YDS, 6 TD" }, "season leaders still render pregame");
eq(gdPre.leaders.away.length, 5, "five leader categories per side");

console.log("gameDetail() - live");
eq([gdLive.state, gdLive.detail, gdLive.home.score, gdLive.away.score], ["in", "3:23 - 2nd", "13", "10"], "in progress, clock, scores");
eq(gdLive.lastPlay, { text:"Timeout Notre Dame, clock 08:53", possession:"ND", downDistance:"2nd & 7 at WIS 34" }, "last play from the live situation, with possession and down/distance");
eq(gdLive.winProb, { homePct:0.78 }, "win probability is the latest point");
eq(gdLive.linescore, { away:["3","7"], home:["10","3"] }, "two periods of linescores");
eq(gdLive.teamStats.map(function (r) { return r.label; }), ["Total yards","Passing","Rushing","First downs","3rd down","Turnovers","Penalties","Possession"], "the eight Team-stats rows in order");
eq(gdLive.teamStats[0], { label:"Total yards", away:"148", home:"211", better:"home" }, "more yards is better");
eq(gdLive.teamStats[5], { label:"Turnovers", away:"0", home:"1", better:"away" }, "fewer turnovers is better");
eq(gdLive.teamStats[4].better, "away", "3rd down compares the rate: 5-13 beats 3-9");
eq(gdLive.teamStats[6].better, "home", "penalties compare the count: 4 beats 6");
eq(gdLive.teamStats[7].better, "home", "possession compares seconds: 31:36 beats 28:24");
eq(gdLive.scoring.length, 4, "four scoring plays so far");
eq(gdLive.scoring[1], { period:1, clock:"1:31", teamAbbr:"ND", mine:true, text:"Spencer Porath 52 Yd Field Goal  ", awayScore:3, homeScore:3 }, "a scoring play, ours");
eq(gdLive.scoring[0].mine, false, "a scoring play, theirs");

console.log("gameDetail() - final");
eq([gdPost.state, gdPost.detail, gdPost.home.score, gdPost.away.score], ["post", "Final", "41", "13"], "final score");
eq(gdPost.lastPlay, { text:"End of 4th quarter.", possession:"", downDistance:"" }, "last play falls back to the last drive when there is no live situation");
eq(gdPost.winProb, { homePct:1 }, "final win probability point kept (the view only shows it live)");
eq(gdPost.linescore, { away:["3","7","3","0"], home:["10","3","14","14"] }, "four periods");
eq(gdPost.box.home.map(function (t) { return t.title + ":" + t.labels.length + ":" + t.rows.length; }), ["Notre Dame Passing:6:1","Notre Dame Rushing:5:3","Notre Dame Receiving:5:3"], "box tables per side: title, column labels, rows");
eq(gdPost.box.home[0].rows[0], { name:"CJ Carr", jersey:"13", stats:["19/29","239","8.2","2","0","70.2"] }, "a box row");
eq(gdPost.leaders.away[4], { category:"Tackles", name:"M. Posa", line:"15" }, "leader category names are mapped, not ESPN's");
eq(TeamOS.espn.gameDetail({}, team, TEAM_CONFIG).state, "post", "an empty payload is treated as final (no polling)");
eq(TeamOS.espn.gameDetail({}, team, TEAM_CONFIG).home, { key:"", name:"TBA", abbreviation:"", record:"", score:null, mine:false }, "an empty side");

console.log("seasonStats()");
var stats = JSON.parse(read("tools/fixtures/espn-season-stats.json"));
var nd = TeamOS.espn.seasonStats(stats.teams["87"]);
eq(nd.map(function (r) { return r.label; }), ["Scoring offense","Total offense","Rushing offense","Passing offense","Scoring defense","Total defense","Turnover margin","Third down"], "the eight preview rows in order");
nd.forEach(function (r) { eq(Object.keys(r), ["label","value","rank","rankText"], r.label + " is a SeasonStat"); });
eq(nd[0], { label:"Scoring offense", value:"46.5", rank:21, rankText:"Tied-21st" }, "value, rank and ESPN's rank text from the first name it files the stat under");
eq(nd[4], { label:"Scoring defense", value:null, rank:null, rankText:null }, "a row the feed has no name for -> null value");
ok(!/splits|categories|rankDisplayValue|espn/i.test(JSON.stringify(nd)), "carries no ESPN keys or names");

// ---- news ----
var newsFixture = JSON.parse(read("tools/fixtures/espn-news.json"));
var NEWS = ["title","link","image","source","publishedAt"];
var NEWSLEAK = /articles|headline|links|href|images|published\b|categories|description|byline|espncdn|api\.espn/i;

console.log("newsUrl");
eq(TeamOS.espn.newsUrl(TEAM_CONFIG),
   "https://site.api.espn.com/apis/site/v2/sports/football/college-football/news?team=87&limit=30",
   "news URL unchanged (SW cache key)");

console.log("news()");
var items = TeamOS.espn.news(newsFixture);
eq(items.length, 4, "one NewsItem per article");
items.forEach(function (n, i) {
  eq(Object.keys(n), NEWS, "item " + i + " has exactly the documented NewsItem fields");
  // `link` and `image` are ESPN URLs and `source` is the outlet's name; test the keys and the rest
  ok(!NEWSLEAK.test(JSON.stringify({ title: n.title, source: n.source, publishedAt: n.publishedAt })), "item " + i + " carries no ESPN keys or names outside its URLs");
  ok(typeof n.publishedAt === "number", "item " + i + " publishedAt is epoch milliseconds");
});
eq(items.map(function (n) { return new Date(n.publishedAt).toISOString(); }),
   ["2026-09-15T10:40:51.000Z","2026-09-18T10:11:31.000Z","2026-09-07T04:18:07.000Z","2026-09-17T13:51:53.000Z"],
   "kept in the feed's own order - the view sorts, the adapter does not");
eq(items[1], { title:"College football Week 3 preview: Can Ole Miss take down LSU?",
               link:"https://www.espn.com/college-football/story/_/id/49965321/college-football-week-3-preview-ole-miss-revenge-lsu",
               image:"https://a.espncdn.com/photo/2026/0917/r1718150_608x342_16-9.jpg",
               source:"ESPN", publishedAt: Date.parse("2026-09-18T10:11:31Z") },
   "a full article: headline, web link, first image, source label, timestamp");
eq(TeamOS.espn.news({ articles: [{ headline:"No picture", published:"2026-09-01T00:00:00Z", links:{ web:{ href:"https://x/y" } } }] })[0].image, "", "no image -> empty string (the view skips the <img>)");
eq(TeamOS.espn.news({ articles: [{ headline:"No date", links:{ web:{ href:"https://x/y" } } }] })[0].publishedAt, null, "no date -> null (the view shows no date and sorts it last)");
eq(TeamOS.espn.news({ articles: [{ headline:"No link" }, { links:{ web:{ href:"https://x/y" } } }] }), [], "no web link or no headline -> dropped");
eq(TeamOS.espn.news(null), [], "no payload -> empty list");

// ---- exports ----
console.log("exports");
eq(Object.keys(TeamOS.espn).sort(),
   ["gameDetail","gameOdds","news","newsUrl","rankings","rankingsUrl","roster","rosterUrl","schedule","scheduleUrl","scoreboard","scoreboardUrl","seasonStats","seasonStatsUrl","summaryUrl","teamStatus","teamUrl"],
   "exactly the documented functions");

console.log("\n" + (failures ? failures + " check(s) FAILED" : "all adapter checks passed"));
process.exit(failures ? 1 : 0);
