/* Notre Dame - the team this Suite is built around.

   Everything the page knows about the team itself lives here, so that
   app.js contains no Notre Dame: it reads TEAM_CONFIG and renders whatever
   team it describes. A second team is a second file in this folder with the
   same shape, and index.html loading that one instead.

   Only what app.js actually uses today is here. Add a field when the
   application needs it, not before. */

var TEAM_CONFIG = {
  name:         "Notre Dame",
  abbreviation: "ND",

  // Ids the outside feeds use for this team. Kept as strings: ESPN's payloads
  // carry the id as either, and app.js compares with String().
  externalIds: {
    espn: "87"
  },

  // The home field, as ESPN spells it, with its coordinates. app.js matches
  // the name case-insensitively to decide when a listed home game is really a
  // neutral site, and uses the coordinates directly for the kickoff forecast
  // because Open-Meteo's geocoder does not know zip 46556.
  venue: {
    name: "Notre Dame Stadium",
    lat:  41.6984,
    lon: -86.2339
  },

  // Trophy and series names for the season's opponents, matched on the
  // opponent name because no public feed carries this. Sourced from the
  // team's own schedule release; the USC entry is dormant while that series
  // is paused.
  series: [
    [/wisconsin/i,                 "Shamrock Series"],
    [/michigan st/i,               "Megaphone Trophy"],
    [/purdue/i,                    "Shillelagh Trophy"],
    [/stanford/i,                  "Legends Trophy"],
    [/navy|midshipmen/i,           "Rip Miller Trophy"],
    [/boston college/i,            "Frank Leahy Memorial Bowl"],
    [/^usc$|southern cal|trojans/i,"Jeweled Shillelagh"],
    [/northwestern/i,              "Lost Shillelagh"]
  ],

  // Broadcasts ESPN has not published yet, by opponent. Consulted ONLY when
  // ESPN returns nothing for that game, so an entry can never contradict the
  // feed and disappears on its own once the feed catches up.
  networkFallback: [
    [/purdue/i, "Peacock"]          // 2026-09-26, announced 9/14, absent from ESPN
  ],

  // How to pick this team's market out of a Kalshi event: the ticker ends in
  // the team's code, or the market's name says the team.
  kalshi: {
    tickerSuffix: "-ND",
    namePattern:  /notre dame|fighting irish/i
  },

  // The team's own pages, where the app points readers for the official word.
  links: {
    roster: { url: "https://fightingirish.com/sports/football/roster", label: "fightingirish.com" }
  }
};
