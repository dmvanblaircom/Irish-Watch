/* TeamOS - snapshot ownership.

   Three files in this repository are team data, not application data: the
   depth chart (depth.json, depth-history.json), the odds price history
   (odds-history.json) and the beat-writer stories (news.json). The Action
   writes them for one team, and app.js used to read them by name for
   whichever team was configured - so a second team's page showed the first
   team's two-deep, sparklines and beat stories under its own name
   (docs/engineering/phase-5a-ohio-state-proof.md, findings 1-3).

   This module makes ownership explicit and gives the Suite one question to
   ask instead of a filename to assume:

     TeamOS.snapshots.get(config, kind)   ->  the team's declaration for that
                                              kind of snapshot, or null when
                                              the team has none
     TeamOS.snapshots.owned(team, json)   ->  whether a loaded snapshot
                                              belongs to this team

   A team declares the snapshots it has in its config's `snapshots` section:

     snapshots: {
       depth:       { file: "depth.json", history: "depth-history.json", label: "UHND" },
       oddsHistory: { file: "odds-history.json" },
       beatNews:    { file: "news.json" }
     }

   A team with no depth-chart source simply leaves `depth` out, and the
   Suite renders its unavailable state; it never borrows another team's
   file. Ownership is by declaration plus, where the file carries one, a
   `team` field matching the Team's id. The Action does not write that
   field today (Phase 5B left the Action alone), so a file without one is
   trusted on the strength of the declaration - the limitation is recorded
   in docs/decisions/0006-snapshots-are-owned-by-declaration.md. When the
   Action starts stamping files, a stamped file for another team is refused
   here without any change in app.js. */

var TeamOS = TeamOS || {};

TeamOS.snapshots = (function () {
  "use strict";

  var KINDS = { depth: 1, oddsHistory: 1, beatNews: 1 };

  function fail(what) { throw new Error("TeamOS.snapshots: " + what); }

  // The team's declaration for one kind of snapshot, or null. The kind is
  // checked so a typo in app.js fails loudly rather than reading as "none".
  function get(config, kind) {
    if (!KINDS[kind]) fail("unknown snapshot kind \"" + kind + "\"");
    var all = config && config.snapshots;
    var s = all && all[kind];
    if (s == null) return null;
    if (typeof s !== "object") fail(kind + " must be an object");
    if (typeof s.file !== "string" || !s.file.trim()) fail(kind + ".file must be a non-empty string");
    if (s.history != null && (typeof s.history !== "string" || !s.history.trim())) fail(kind + ".history must be a non-empty string");
    return s;
  }

  // Does a loaded snapshot belong to this team? A file that names a team
  // must name this one; a file that names none is trusted because the
  // team declared it (see the note above).
  function owned(team, json) {
    if (!json || typeof json !== "object") return false;
    if (json.team == null) return true;
    return json.team === team.id;
  }

  return { get: get, owned: owned };
})();
