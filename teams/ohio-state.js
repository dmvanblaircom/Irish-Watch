/* Ohio State - the second team, and the architecture's proof.

   Same shape as teams/notre-dame.js, nothing else changed: index.html loads
   this file instead and app.js renders the Buckeyes. What comes out right
   and what comes out wrong is recorded in docs/engineering/ - that record,
   not this file, is the point of Phase 5A.

   Values verified against the feeds on 2026-09-18: ESPN team 194 spells the
   home field "Ohio Stadium"; Kalshi's championship and playoff markets are
   KXNCAAF-27-OSU and KXNCAAFPLAYOFF-26-OSU, named "Ohio St.". */

var TEAM_CONFIG = {

  team: {
    id:           "ohio-state",
    name:         "Ohio State",
    abbreviation: "OSU",
    sport:        "football",
    league:       "college-football",

    venue: {
      name: "Ohio Stadium",
      lat:  40.0017,
      lon: -83.0197
    }
  },

  sources: {
    espn: {
      teamId: "194",
      broadcastFallback: []
    },
    kalshi: {
      tickerSuffix: "-OSU",
      namePattern:  /ohio st|buckeyes/i
    }
  },

  // Only the trophy game whose name reads correctly after the page's
  // "Playing for the ..." - the Michigan game has no trophy and calling it
  // "the The Game" would be wrong. That copy is one of the proof's findings.
  series: [
    [/illinois/i, "Illibuck Trophy"]
  ],

  links: {
    roster: { url: "https://ohiostatebuckeyes.com/sports/football/roster", label: "ohiostatebuckeyes.com" }
  }
};
