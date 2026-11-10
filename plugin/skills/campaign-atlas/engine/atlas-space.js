/* Things between the stars (the editing plan of 10 Nov 2026, stage 2; the user's request of that day: "space should be a
   fully editable adventure environment"): wrecks, derelicts, lost ships, distress beacons, signals, stations, outposts,
   hidden bases, pirate hideouts, jump gates, wormholes, anomalies, alien structures, refuelling points; and areas: nebulae,
   asteroid fields, debris fields. Each stands at its own place on the star chart (and its height), may drift, and has its
   card: what it is, its condition, who it belongs to, its crew and passengers, its cargo and equipment, whether it is
   hostile, friendly, abandoned or unknown, its signal (its message, its range, where it really comes from), the game
   master's notes, and its inside (a place of the campaign, built in the map editor).
   Each can be hidden until found. What finds it: the ship coming within its signal's range or its sensors' reach, a
   sweep of the sensors, a clue found, an event happening, or the game master. When one is met Atlas tells the game
   master, and shows it to the players by itself only if they chose that for it. The players' copy never has what they
   have not found. Plain code: the star chart (atlas-galaxy.js) draws them and keeps them, in its "~things" changes. */
(function (A) {
  "use strict";
  if (!A) return;
  // the kinds: [label, group, icon, an area]
  const KINDS = {
    wreck: ["A shipwreck", "Ships and wrecks", "derelict"], derelict: ["A derelict ship", "Ships and wrecks", "derelict"], lostship: ["A lost ship", "Ships and wrecks", "ship"], freighter: ["A damaged freighter", "Ships and wrecks", "ship"], ambush: ["A pirate ambush", "Ships and wrecks", "pirate"],
    beacon: ["A distress beacon", "Signals", "beacon"], signal: ["An unidentified signal", "Signals", "signal"], transmission: ["An emergency transmission", "Signals", "signal"],
    station: ["A space station", "Stations and bases", "station"], outpost: ["A mining outpost", "Stations and bases", "mining"], abandoned: ["An abandoned station", "Stations and bases", "station"], military: ["A military installation", "Stations and bases", "orbital"], hidden: ["A hidden base", "Stations and bases", "orbital"], hideout: ["A pirate hideout", "Stations and bases", "pirate"], refuel: ["A hidden refuelling point", "Stations and bases", "fuel"],
    gate: ["A jump gate", "Gates and strangeness", "gate"], wormhole: ["A wormhole", "Gates and strangeness", "wormhole"], anomaly: ["An anomaly", "Gates and strangeness", "anomaly"], alien: ["An ancient alien structure", "Gates and strangeness", "alien"],
    nebula: ["A nebula", "Areas", "", true], asteroids: ["An asteroid field", "Areas", "", true], debris: ["A debris field", "Areas", "", true],
    poi: ["Something else", "Something else", "other"]
  };
  const GROUPS = ["Ships and wrecks", "Signals", "Stations and bases", "Gates and strangeness", "Areas", "Something else"];
  const ATTITUDE = [["unknown", "Unknown"], ["abandoned", "Abandoned"], ["friendly", "Friendly"], ["neutral", "Neutral"], ["hostile", "Hostile"]];
  // how far a ship's sensors reach, in light years, by how good they are (the chart's own sensors setting)
  const REACH = { basic: 1, good: 2.5, military: 5 };
  // what can find a hidden thing
  const CONDS = [["range", "The ship comes within its signal's range, or its sensors' reach"], ["scan", "They sweep the space round the ship with its sensors"], ["clue", "A clue is found"], ["event", "An event happens"], ["told", "Someone tells them (you reveal it)"]];
  const label = k => (KINDS[k] || KINDS.poi)[0], isArea = k => !!(KINDS[k] || [])[3], icon = k => (KINDS[k] || KINDS.poi)[2];
  // a new one: what it starts as, by its kind (a beacon broadcasts; an area has a size; the rest wait to be filled in)
  function fresh(kind, at) {
    const t = Object.assign({ kind, name: label(kind).replace(/^An? /, "The "), attitude: /wreck|derelict|abandoned/.test(kind) ? "abandoned" : /ambush|hideout/.test(kind) ? "hostile" : "unknown", hidden: true, reveal: "tell", conds: /beacon|signal|transmission/.test(kind) ? ["range", "scan"] : ["scan"], found: false }, at || {});
    if (/beacon|transmission/.test(kind)) t.signal = { on: true, message: kind === "beacon" ? "Mayday, mayday: hull breach, life support failing. Anyone receiving..." : "This is an emergency transmission.", range: 3, source: "" };
    if (kind === "signal") t.signal = { on: true, message: "A repeating pattern no one can read.", range: 2, source: "" };
    if (isArea(kind)) { t.r = kind === "nebula" ? 3 : 1.2; t.hidden = false; t.conds = []; t.found = true; if (kind === "nebula") t.blinds = true; }
    if (/station|outpost|military|refuel/.test(kind)) { t.hidden = /hidden|refuel/.test(kind); }
    if (kind === "gate") t.hidden = false;
    if (!t.hidden) t.found = true;
    return t;
  }
  // where it is on a day (campaign minutes): its own place, or drifting from where it was put
  function where(t, now) { const d = t.drift; if (!d || !(+d.speed > 0)) return { x: t.x, y: t.y }; const days = Math.max(0, ((now || 0) - (+d.t0 || 0)) / 1440), a = (+d.dir || 0) * Math.PI / 180, k = d.perLy || 1; return { x: t.x + Math.cos(a) * d.speed * days / k, y: t.y + Math.sin(a) * d.speed * days / k }; }
  // which of its conditions are met now: o = { dist (ly from the ship), reach (its sensors'), swept, foundClue(ref), eventDone(id) }
  function met(t, o) {
    if (!t.hidden || t.found) return null;
    for (const c of t.conds || []) {
      if (c === "range" && o.dist != null) { const r = Math.max(t.signal && t.signal.on ? +t.signal.range || 0 : 0, o.reach || 0); if (o.dist <= r) return t.signal && t.signal.on && o.dist <= (+t.signal.range || 0) ? "its signal reached the ship" : "it came within the ship's sensors"; }
      if (c === "scan" && o.swept && o.dist != null && o.dist <= (o.reach || 0) * 1.5) return "the sensors' sweep found it";
      if (c === "clue" && t.clue && o.foundClue && o.foundClue(t.clue)) return "a clue led them to it";
      if (c === "event" && t.event && o.eventDone && o.eventDone(t.event)) return "an event revealed it";
    }
    return null;
  }
  // what the players may know of it: only once found; its signal's words only if it broadcasts
  function forPlayers(t, now) { if (t.hidden && !t.found) return null; const p = where(t, now); return { id: t.id, kind: t.kind, name: t.name, x: p.x, y: p.y, r: t.r || 0, desc: t.desc || "", signal: t.signal && t.signal.on ? t.signal.message || "" : "" }; }
  A.space = { KINDS, GROUPS, ATTITUDE, REACH, CONDS, label, isArea, icon, fresh, where, met, forPlayers };
})(typeof ATLAS !== "undefined" ? ATLAS : null);
