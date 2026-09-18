/* TeamOS - the ESPN adapter.

   Everything the platform knows about how ESPN shapes a college football
   team's schedule, roster and record, and the league's scoreboard and
   rankings, lives here and nowhere else. The
   adapter is a pure transformation: it is handed ESPN's JSON (and, for the
   schedule, the Team and the team config) and it returns domain objects. It
   never fetches, never touches the page, never reads application state.
   app.js owns the network, the cache-first paint, staleness and polling;
   this file owns the meaning of ESPN's keys.

     schedule JSON + Team + TEAM_CONFIG  ->  TeamOS.espn.schedule()    ->  Game[]
     roster JSON                         ->  TeamOS.espn.roster()      ->  RosterGroup[] of Player
     team JSON                           ->  TeamOS.espn.teamStatus()  ->  { rank, record }
     scoreboard JSON + TEAM_CONFIG       ->  TeamOS.espn.scoreboard()  ->  LeagueGame[]
     rankings JSON + TEAM_CONFIG         ->  TeamOS.espn.rankings()    ->  Poll[]

   All of these are documented in docs/03_DOMAIN_MODEL.md. Game is written
   from the team's point of view - us/them, home/away, won - because that is
   what a team's Suite renders; LeagueGame is a neutral home/away game for
   league-wide views, and the two are deliberately distinct. Nothing in any
   of them names ESPN. */

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

  /* ---------- roster ---------- */
  // ESPN labels its groups with raw camelCase keys like "specialTeam". Map the
  // ones college football actually uses; title-case anything unexpected.
  var GROUP_LABEL={ offense:"Offense", defense:"Defense", specialteam:"Special",
                    specialteams:"Special", injuredreserve:"Injured",
                    practicesquad:"Practice", suspended:"Suspended" };
  function groupLabel(key, fallback){
    var k=String(key||"").toLowerCase();
    if(GROUP_LABEL[k]) return GROUP_LABEL[k];
    var s=String(fallback||key||"Squad").replace(/([a-z])([A-Z])/g,"$1 $2");
    return s.charAt(0).toUpperCase()+s.slice(1);
  }
  function str(v){ return v==null ? "" : String(v); }

  // One ESPN athlete -> one Player. Only what the roster view shows and
  // searches; position is the abbreviation with the full name as a fallback,
  // and positionName keeps the full name so a search for "quarterback" works.
  function player(p){
    var pos=p.position||{}, xp=p.experience||{}, bp=p.birthPlace||{};
    return {
      name:         str(p.displayName||p.fullName),
      jersey:       str(p.jersey),
      position:     str(pos.abbreviation||pos.name),
      positionName: str(pos.name),
      height:       str(p.displayHeight),
      weight:       str(p.displayWeight),
      classYear:    str(xp.abbreviation||xp.displayValue),
      hometown:     { city: str(bp.city), state: str(bp.state) }
    };
  }

  /* ---------- league: scoreboard and rankings ---------- */
  var TOP25 = 26;
  var LEAGUE_GROUP = 80;                 // ESPN's group id for FBS

  function rankOf(c){
    return c && c.curatedRank && c.curatedRank.current<TOP25 ? c.curatedRank.current : null;
  }
  function leagueSide(c){
    return {
      name:  c && c.team ? str(c.team.shortDisplayName||c.team.displayName) : "opponent to be announced",
      rank:  rankOf(c),
      score: c && c.score!=null ? str(c.score) : null
    };
  }

  // One ESPN scoreboard event -> one LeagueGame: neutral home/away, with a
  // flag for the team's own game. `live` carries what the scoreboard already
  // knows about the ball while the game is on.
  function leagueGame(ev, config){
    var teamId=config.sources.espn.teamId;
    var comp=(ev.competitions&&ev.competitions[0])||{}, cs=comp.competitors||[];
    var home=cs.filter(function(c){return c.homeAway==="home";})[0]||cs[0];
    var away=cs.filter(function(c){return c.homeAway==="away";})[0]||cs[1];
    var st=(comp.status&&comp.status.type)||{};
    var sit=comp.situation||{};
    var state=st.state||"pre";
    return {
      id:      str(ev.id),
      date:    ev.date,
      timeSet: timeIsSet(ev.date, comp),
      state:   state,
      detail:  str(st.shortDetail),
      venue:   comp.venue ? str(comp.venue.fullName) : "",
      net:     broadcast(comp),
      odds:    odds(comp),
      home:    leagueSide(home),
      away:    leagueSide(away),
      mine:    cs.some(function(c){ return String(c.id)===teamId; }),
      live:    state==="in"
                 ? { downDistance: str(sit.downDistanceText||sit.shortDownDistanceText),
                     lastPlay:     str(sit.lastPlay&&sit.lastPlay.text) }
                 : null
    };
  }

  // Which poll leads. Once the committee starts releasing CFP rankings those
  // are the only ones that decide anything, so they sort to the top.
  function pollOrder(r){
    var n=((r.shortName||"")+" "+(r.name||"")+" "+(r.type||"")).toLowerCase();
    if(/cfp|playoff/.test(n))               return 0;
    if(/\bap\b|associated press/.test(n))   return 1;
    if(/coach|afca|usa today/.test(n))      return 2;
    return 3;
  }
  // ESPN's rankings endpoint returns FCS, Division II and Division III polls
  // alongside the FBS ones. Keep only the three that bear on an FBS team.
  function isFBS(r){
    var n=((r.shortName||"")+" "+(r.name||"")+" "+(r.type||"")+" "+
           (r.headline||"")).toLowerCase();
    if(/\bfcs\b|division\s*(ii|iii|2|3)\b|\bd-?ii+\b|\bd-?[23]\b|naia|juco|junior college/.test(n))
      return false;
    return pollOrder(r)<3;          // CFP, AP or FBS coaches only
  }
  function pollLabel(r){
    var n=((r.shortName||"")+" "+(r.name||"")).toLowerCase();
    if(/cfp|playoff/.test(n))             return "CFP";
    if(/\bap\b|associated press/.test(n)) return "AP";
    if(/coach|afca|usa today/.test(n))    return "Coaches";
    return (r.shortName||r.name||"Poll").slice(0,10);
  }
  function poll(r, config){
    var teamId=config.sources.espn.teamId, label=pollLabel(r);
    return {
      key:   label.replace(/[^A-Za-z0-9]/g,""),
      label: label,
      name:  str(r.name||"Poll"),
      asOf:  r.occurrence ? str(r.occurrence.displayValue) : "",
      ranks: (r.ranks||[]).map(function(x){
        var t=x.team||{};
        return {
          rank:     x.current,
          team:     str(t.nickname||t.name||t.location||t.shortDisplayName),
          record:   str(x.recordSummary),
          // ESPN's `previous` is a rank, 0 for a team new to the poll, or absent
          previous: x.previous>0 ? x.previous : null,
          isNew:    x.previous===0,
          mine:     String(t.id)===teamId
        };
      })
    };
  }

  /* ---------- team ---------- */

  return {
    // The URLs app.js fetches. Must not change shape: the service worker's
    // data cache and the page's cache-first paint are keyed on them.
    scheduleUrl: function(config){
      return SITE+"/teams/"+config.sources.espn.teamId+"/schedule";
    },
    rosterUrl: function(config){
      return SITE+"/teams/"+config.sources.espn.teamId+"/roster";
    },
    teamUrl: function(config){
      return SITE+"/teams/"+config.sources.espn.teamId;
    },
    scoreboardUrl: function(){
      return SITE+"/scoreboard?groups="+LEAGUE_GROUP+"&limit=400";
    },
    rankingsUrl: function(){
      return SITE+"/rankings";
    },

    // ESPN's roster payload -> RosterGroup[]: { key, label, players }. Either a
    // flat athletes array or one grouped by unit; empty units (IR, practice
    // squad) are dropped, and a flat list becomes one group called "Roster".
    roster: function(json){
      var groups=[];
      var a=(json&&json.athletes)||[];
      if(a.length && a[0] && Array.isArray(a[0].items)){
        a.forEach(function(g){
          var items=g.items||[];
          if(!items.length) return;
          var key=String(g.position||g.name||"squad").toLowerCase();
          groups.push({ key:key, label:groupLabel(key, g.text||g.name), players:items.map(player) });
        });
      }
      if(!groups.length) groups.push({ key:"all", label:"Roster", players:a.map(player) });
      return groups;
    },

    // ESPN's team payload -> TeamStatus: { rank, record }. rank is null
    // outside the top 25; record is the overall summary ("2-0") or null when
    // ESPN sends none.
    teamStatus: function(json){
      var t=(json&&json.team)||{};
      var r=t.record&&t.record.items&&t.record.items[0];
      return {
        rank:   (t.rank && t.rank<TOP25) ? t.rank : null,
        record: r ? str(r.summary) : null
      };
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

    // ESPN's scoreboard payload (every game the league is showing this week) ->
    // LeagueGame[], oldest first. Ranked games are the ones with a side rank.
    scoreboard: function(json, config){
      return ((json&&json.events)||[]).map(function(ev){ return leagueGame(ev, config); })
        .sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
    },

    // ESPN's rankings payload -> Poll[]: only the polls that bear on an FBS
    // team, CFP first, one per label when ESPN publishes a poll twice.
    rankings: function(json, config){
      var seen={};
      return ((json&&json.rankings)||[])
        .filter(function(r){ return (r.ranks||[]).length && isFBS(r); })
        .sort(function(a,b){ return pollOrder(a)-pollOrder(b); })
        .filter(function(r){ var k=pollLabel(r); if(seen[k]) return false; seen[k]=1; return true; })
        .map(function(r){ return poll(r, config); });
    }
  };
})();
