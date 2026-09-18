/* Notre Dame - the team this Suite is built around.

   Everything the page knows about the team itself lives here, so that
   app.js contains no Notre Dame: it renders whatever team this file
   describes. A second team is a second file in this folder with the same
   shape, and index.html loading that one instead.

   Four sections, each owned by a different layer:

     team     the Team domain object. Provider-neutral: nothing in it names
              ESPN, Kalshi or anyone else. app.js gets it through
              TeamOS.createTeam(), which validates and freezes it.
     sources  how each outside feed identifies this team, and any patches
              for gaps in a feed. Read by app.js for now; in Phase 3 this
              moves inside the provider adapters.
     series   trophy games, matched by opponent name. Schedule data, headed
              for the normalized Game in Phase 3.
     links    the team's own pages, for the official word.

   Only what the application actually uses today is here. Add a field when
   the application needs it, not before. */

var TEAM_CONFIG = {

  team: {
    id:           "notre-dame",
    name:         "Notre Dame",
    abbreviation: "ND",
    sport:        "football",
    league:       "college-football",

    // The home field, as ESPN spells it, with its coordinates. app.js
    // matches the name case-insensitively to decide when a listed home game
    // is really a neutral site, and uses the coordinates directly for the
    // kickoff forecast because Open-Meteo's geocoder does not know zip 46556.
    venue: {
      name: "Notre Dame Stadium",
      lat:  41.6984,
      lon: -86.2339
    }
  },

  sources: {
    espn: {
      // ESPN's id for the team. Kept as a string: ESPN's payloads carry the
      // id as either, and app.js compares with String().
      teamId: "87",

      // Broadcasts ESPN has not published yet, by opponent. Consulted ONLY
      // when ESPN returns nothing for that game, so an entry can never
      // contradict the feed and disappears on its own once the feed
      // catches up.
      broadcastFallback: [
        [/purdue/i, "Peacock"]        // 2026-09-26, announced 9/14, absent from ESPN
      ]
    },

    // How to pick this team's market out of a Kalshi event: the ticker ends
    // in the team's code, or the market's name says the team.
    kalshi: {
      tickerSuffix: "-ND",
      namePattern:  /notre dame|fighting irish/i
    }
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

  // The team's own pages, where the app points readers for the official word.
  links: {
    roster: { url: "https://fightingirish.com/sports/football/roster", label: "fightingirish.com" }
  }
};
