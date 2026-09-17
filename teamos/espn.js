/* TeamOS - the ESPN adapter.

   Everything the platform knows about how ESPN shapes a college football
   schedule lives here, and nowhere else. The adapter is a pure
   transformation: it is handed ESPN's JSON, the Team, and the team config,
   and it returns Game objects. It never fetches, never touches the page,
   never reads application state. app.js owns the network, the cache-first
   paint, staleness and polling; this file owns the meaning of ESPN's keys.

     raw ESPN JSON + Team + TEAM_CONFIG  ->  TeamOS.espn.schedule()  ->  Game[]

   Game is documented in docs/03_DOMAIN_MODEL.md. It is written from the
   team's point of view - us/them, home/away, won - because that is what a
   team's Suite renders. Nothing in it names ESPN.

   The three helpers at the foot of the exports (timeIsSet, broadcast, odds)
   are transitional: the Top 25 tab still renders ESPN's scoreboard raw and
   needs the same parsing. They are exported so the knowledge is not
   duplicated; they go private once the scoreboard has its own object. */

var TeamOS = TeamOS || {};

TeamOS.espn = (function () {
  "use strict";

  var SITE = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

  // ESPN flags a placeholder kickoff with timeValid:false and files it at
  // midnight Eastern, which is 04:00Z or 05:00Z - so a midnight-UTC check
  // misses it and would also misread a real 8pm ET kickoff. Trust the flag
  // when it is there; the heuristic is only a fallback for feeds that omit it.
  function timeIsSet(iso, comp){
    if(comp && typeof comp.timeValid==="boolean") return comp.timeValid;
    var d=new Date(iso); return !(d.getUTCHours()===0&&d.getUTCMinutes()===0);
  }

  // ESPN files broadcasts inconsistently: TV networks usually land in
  // competition.broadcasts, but streaming-only outlets such as Peacock often
  // appear only in geoBroadcasts, or as a bare `broadcast` string. Read every
  // shape and merge them, rather than treating geoBroadcasts as a fallback -
  // a Peacock-exclusive game has nothing in broadcasts at all.
  function broadcast(comp){
    var out=[];
    function add(v){
      if(!v) return;
      v=String(v).trim();
      if(v && out.indexOf(v)===-1) out.push(v);
    }
    function scan(x){
      if(!x) return;
      if(x.media){ add(x.media.shortName); add(x.media.callLetters); add(x.media.name); }
      if(Array.isArray(x.names)) x.names.forEach(add);
      add(x.shortName); add(x.callLetters); add(x.station); add(x.name);
    }
    (comp.broadcasts||[]).forEach(scan);
    (comp.geoBroadcasts||[]).forEach(scan);
    if(typeof comp.broadcast==="string") add(comp.broadcast);
    // a couple of feeds hang it off the event's status block instead
    if(comp.status && typeof comp.status.broadcast==="string") add(comp.status.broadcast);
    return out.join(", ");
  }

  // The line and total, from whichever block ESPN put them in.
  function odds(comp){
    var o=(comp.odds&&comp.odds[0])||(comp.pickcenter&&comp.pickcenter[0]);
    if(!o) return null;
    return { line:o.details||(o.spread!=null?String(o.spread):null),
             total:o.overUnder!=null?o.overUnder:null };
  }

  // ESPN does not always set neutralSite. A game where the team is the listed
  // home side but the venue is not its home field is a neutral site in
  // practice - Lambeau, Gillette, the Shamrock Series and so on.
  // Venues that are never a college team's home field.
  var NEUTRAL_VENUES = /lambeau|gillette|metlife|m&t bank|soldier field|yankee stadium|aviva|at&t stadium|allegiant|mercedes-benz|hard rock|raymond james|caesars superdome|camping world|alamodome/i;

  // Case-insensitive match on the home field's name, the way ESPN spells it.
  function isHomeField(team, venueName){
    return String(venueName||"").toLowerCase().indexOf(team.venue.name.toLowerCase())>-1;
  }
  function isNeutral(team, comp, us){
    if(comp.neutralSite===true) return true;
    var v = comp.venue && comp.venue.fullName ? comp.venue.fullName : "";
    if(v === "") return false;
    // A pro or event venue is neutral no matter which side is listed as home.
    if(NEUTRAL_VENUES.test(v)) return true;
    // Listed at home but not actually at the home field.
    var listedHome = us ? us.homeAway==="home" : false;
    return listedHome && !isHomeField(team, v);
  }

  // Trophy and series names, matched on the opponent's name against the
  // team config's `series` table. No public feed carries this.
  function seriesFor(series, name){
    for(var i=0;i<series.length;i++){ if(series[i][0].test(name||"")) return series[i][1]; }
    return null;
  }

  // ESPN publishes kickoff times and broadcasts separately, and is slow on
  // streaming-only games because Peacock is not a TV network in their data
  // model. The config's fallback is consulted ONLY when ESPN returns nothing
  // for that game, so it can never contradict the feed and disappears on its
  // own once the feed catches up.
  function fallbackBroadcast(fallback, oppName){
    for(var i=0;i<fallback.length;i++){
      if(fallback[i][0].test(oppName||"")) return fallback[i][1];
    }
    return "";
  }

  // One ESPN schedule event -> one Game, from the team's point of view.
  function game(ev, team, config){
    var teamId = config.sources.espn.teamId;
    var comp=(ev.competitions&&ev.competitions[0])||{}, cs=comp.competitors||[];
    var us=null,them=null;
    cs.forEach(function(c){ var id=c.id||(c.team&&c.team.id);
      if(String(id)===teamId) us=c; else them=c; });
    var st=(comp.status&&comp.status.type)||(ev.status&&ev.status.type)||{};
    var oppLong = them&&them.team ? (them.team.displayName||them.team.shortDisplayName) : "";
    return {
      id:ev.id, date:ev.date, timeSet:timeIsSet(ev.date, comp),
      home: us?us.homeAway==="home":true,
      neutral: isNeutral(team, comp, us),
      oppName: them&&them.team?(them.team.shortDisplayName||them.team.displayName):"opponent to be announced",
      oppRank: them&&them.curatedRank&&them.curatedRank.current<26?them.curatedRank.current:null,
      venue: comp.venue?(comp.venue.fullName||""):"",
      city: comp.venue&&comp.venue.address?comp.venue.address.city:"",
      venueState: comp.venue&&comp.venue.address?(comp.venue.address.state||""):"",
      zip: comp.venue&&comp.venue.address?(comp.venue.address.zipCode||""):"",
      net: broadcast(comp) || fallbackBroadcast(config.sources.espn.broadcastFallback, oppLong),
      odds: odds(comp),
      series: seriesFor(config.series, oppLong),
      state: st.state||"pre", detail: st.shortDetail||"",
      us: us&&us.score?(us.score.displayValue||us.score.value||us.score):null,
      them: them&&them.score?(them.score.displayValue||them.score.value||them.score):null,
      won: us?us.winner===true:null
    };
  }

  return {
    // The URL app.js fetches. Must not change shape: the service worker's
    // data cache and the page's cache-first paint are keyed on it.
    scheduleUrl: function(config){
      return SITE+"/teams/"+config.sources.espn.teamId+"/schedule";
    },

    // ESPN's schedule payload -> Game[], oldest first.
    schedule: function(json, team, config){
      return ((json&&json.events)||[]).map(function(ev){ return game(ev, team, config); })
        .sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
    },

    // The pregame line and total from ESPN's game summary, for a Game the
    // schedule payload gave no odds for. null when ESPN has none either.
    gameOdds: function(summary){
      var pc=summary&&summary.pickcenter&&summary.pickcenter[0];
      if(!pc) return null;
      return { line:pc.details||null, total:pc.overUnder!=null?pc.overUnder:null };
    },

    // Transitional: the Top 25 tab still renders ESPN's scoreboard raw.
    timeIsSet: timeIsSet,
    broadcast: broadcast,
    odds: odds
  };
})();
