/* The world map: a large 2D map of the whole world a campaign travels (a realm, a coast, a country, a star system), the
   level above its cities. Each location on it may be one of the campaign's 3D cities (location.city = that city's id),
   and "Enter" opens that city in the page's own 3D map (ATLAS.cityMount, the very view the Gazetteer shows: nothing here
   draws a city). Locations and routes come from world.js (ATLAS.world); the land, the rivers and where unplaced
   locations stand come from world-terrain.js (ATLAS.worldTerrain, written by atlas.js world). What the referee changes
   on the page (a location moved, added or deleted, a route, what the party knows, where the party is and where it is
   going) is kept in the page's database (collection "world"), or in this browser when there is none, and laid over the
   campaign's own world; "Copy as world.js" gives it back to the campaign. Drawn in SVG; it needs no three.js.
   The user asked for it on 20 Oct 2026 ("Interactive 2D World Map Connected to Existing 3D City Maps"). */
(function (A) {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const r1 = v => Math.round(v * 10) / 10;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (stops, t) => {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, (t - t0) / (t1 - t0)); }
    return stops[stops.length - 1][1];
  };
  const hash = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };

  /* ---- what a world can hold */
  // the look of the map: a parchment map (fantasy, and the past), an atlas (the modern world) or a star map (the future)
  // (27 Oct 2026: the past has its own look, an engraved atlas plate; a planet in science fiction a survey; the game
  // master may choose another, kept as the world's "style": atlas-world-art.js draws each)
  // (27 Oct 2026: fantasy is painted in colour by default, as the user asked; parchment stays one choice)
  const LOOK_OF = { hydro: "hydro", hydrographic: "hydro", print: "hydro", relief: "relief", shaded: "relief", natural: "relief", painted: "painted", fantasy: "hydro", colour: "painted", color: "painted", parchment: "parchment", medieval: "parchment",
    engraved: "engraved", old: "engraved", antique: "engraved", industrial: "engraved", historical: "engraved", victorian: "engraved", "1920s": "engraved",
    atlas: "atlas", modern: "atlas", political: "atlas", holo: "holo", survey: "holo", planet: "holo", alien: "holo",
    stars: "stars", star: "stars", scifi: "stars", future: "stars", space: "stars" };
  // what the party knows of a place. Unknown places are not shown on the players' map.
  const STATES = [["unknown", "Unknown to the party"], ["rumoured", "Rumoured"], ["known", "Known"], ["visited", "Visited"], ["done", "Done with"]];
  // kinds of location: [importance 1 to 3 (1 is always named on the map), name]
  const KINDS = {
    capital: [1, "Capital"], city: [1, "City"], town: [2, "Town"], village: [3, "Village"], hamlet: [3, "Hamlet"], port: [2, "Port"],
    castle: [2, "Castle"], keep: [2, "Keep"], fort: [2, "Fort"], manor: [3, "Manor"], farm: [3, "Farm"], inn: [3, "Inn"], tower: [3, "Tower"],
    ruin: [3, "Ruin"], dungeon: [3, "Dungeon"], cave: [3, "Cave"], lair: [3, "Lair"], temple: [3, "Temple"], shrine: [3, "Shrine"], monastery: [3, "Monastery"],
    camp: [3, "Camp"], mine: [3, "Mine"], landmark: [3, "Landmark"], stones: [3, "Standing stones"], battlefield: [3, "Battlefield"], bridge: [3, "Bridge"],
    lighthouse: [3, "Lighthouse"], grove: [3, "Grove"], wreck: [3, "Wreck"],
    base: [2, "Base"], airport: [2, "Airport"], station: [2, "Station"], site: [3, "Site"],
    star: [1, "Star"], planet: [1, "Planet"], moon: [2, "Moon"], outpost: [2, "Outpost"], asteroid: [3, "Asteroid"], belt: [3, "Belt"], gate: [2, "Gate"], ship: [3, "Ship"], anomaly: [3, "Anomaly"]
  };
  // the kinds of place a 3D city map is made for (the others are sites: their places are mapped floor by floor)
  const SETTLED = ["capital", "city", "town", "village", "hamlet", "port", "castle", "keep", "fort", "camp", "base", "station", "outpost", "planet", "moon", "monastery"];
  const ROUTES = { road: "Road", trail: "Trail", pass: "Mountain pass", river: "River", sea: "Sea route", rail: "Railway", air: "Air route", tunnel: "Tunnel", portal: "Portal", lane: "Space lane", jump: "Jump route" };
  const OVERLAND = { road: 1, trail: 1, pass: 1, river: 1, rail: 1, tunnel: 1 };

  // each look's colours, its route lines [colour, width, dashes] and its type
  const STYLE = {
    parchment: {
      ink: "#3b2a1a", paper: "#efe3c3", mk: "#f6ecd2", river: "#58788c", label: "#3b2a1a",
      sea: [[0, hex("#c9cdb6")], [.5, hex("#b6bea9")], [1, hex("#a3ad9c")]],
      land: [[0, hex("#f2e8ca")], [.35, hex("#ecdeb8")], [.6, hex("#e0cc9f")], [.84, hex("#d2b98c")], [.93, hex("#ece4d2")], [1, hex("#f6f1e4")]],
      wet: hex("#d6dbab"), dry: hex("#f3dfaa"), tree: "#c8c48c",
      routes: { road: ["#7a2e1d", 1.9, "7 3"], trail: ["#6e5233", 1.6, "1.6 3.4"], pass: ["#5a3a22", 1.7, "5 2 1.6 2"], river: ["#3e6a86", 1.9, "6 3"], sea: ["#2f4f6f", 1.7, "9 5"], rail: ["#2b2119", 2.2, "10 3"], air: ["#55504a", 1.3, "3 4"], tunnel: ["#5a5048", 1.7, "3 3"], portal: ["#6a3f9e", 1.9, "2 3"], lane: ["#2f4f6f", 1.7, "8 4"], jump: ["#6a3f9e", 1.7, "2 4"] }
    },
    // (27 Oct 2026, the user: "do the shaded relief map, it looks way better": the land lit as if by a low sun, its
    // colour that of what grows there; dark routes and labels over it)
    relief: {
      ink: "#2b2a24", paper: "#f3efe4", mk: "#fff8ec", river: "#4f7fa8", label: "#24211c",
      sea: [[0, hex("#9cc2d8")], [1, hex("#3f6e93")]], land: [[0, hex("#bccb8e")], [1, hex("#ffffff")]], wet: hex("#6f9a5a"), dry: hex("#dcc79a"), tree: "#5f8a4a",
      routes: { road: ["#7a2e1d", 2, "8 2.5"], trail: ["#4a3a26", 1.5, "2 3"], pass: ["#3a2a1a", 1.7, "5 2 1.6 2"], river: ["#2e5f86", 1.9, "6 3"], sea: ["#24506f", 1.6, "8 5"], rail: ["#2b2a24", 2.2, "10 3"], air: ["#4a4842", 1.3, "3 4"], tunnel: ["#4a4842", 1.7, "3 3"], portal: ["#6a3f9e", 1.9, "2 3"], lane: ["#24506f", 1.6, "8 4"], jump: ["#6a3f9e", 1.7, "2 4"] }
    },
    // (the hydrographic print: pale paper round the land, dark ink)
    hydro: {
      ink: "#2b2a24", paper: "#f1efea", mk: "#fff8ec", river: "#3f6f8c", label: "#24211c",
      sea: [[0, hex("#9cc2d8")], [1, hex("#3f6e93")]], land: [[0, hex("#bccb8e")], [1, hex("#ffffff")]], wet: hex("#6f9a5a"), dry: hex("#dcc79a"), tree: "#5f8a4a",
      routes: { road: ["#7a2e1d", 2, "8 2.5"], trail: ["#4a3a26", 1.5, "2 3"], pass: ["#3a2a1a", 1.7, "5 2 1.6 2"], river: ["#2e5f86", 1.9, "6 3"], sea: ["#24506f", 1.6, "8 5"], rail: ["#2b2a24", 2.2, "10 3"], air: ["#4a4842", 1.3, "3 4"], tunnel: ["#4a4842", 1.7, "3 3"], portal: ["#6a3f9e", 1.9, "2 3"], lane: ["#24506f", 1.6, "8 4"], jump: ["#6a3f9e", 1.7, "2 4"] }
    },
    // (the painted map's routes stand out on green land and dark sea)
    painted: {
      ink: "#2a2016", paper: "#e9dcc0", mk: "#efe4c9", river: "#4d8098", label: "#f6eedb",
      sea: [[0, hex("#5f8f99")], [.5, hex("#376172")], [1, hex("#27475b")]],
      land: [[0, hex("#98a350")], [.4, hex("#76903f")], [.6, hex("#8f7356")], [.85, hex("#a68d70")], [1, hex("#eef0ec")]],
      wet: hex("#5a6a42"), dry: hex("#bba75e"), tree: "#4c7a2c",
      routes: { road: ["#5b2e1c", 2.2, "9 2.5"], trail: ["#3d2c1a", 1.6, "2 3"], pass: ["#2a2016", 1.8, "5 2 1.6 2"], river: ["#24597a", 2, "6 3"], sea: ["#e6eef0", 1.7, "8 5"], rail: ["#2a2016", 2.2, "10 3"], air: ["#3d3a35", 1.3, "3 4"], tunnel: ["#3d3a35", 1.7, "3 3"], portal: ["#6a3f9e", 2, "2 3"], lane: ["#e6eef0", 1.7, "8 4"], jump: ["#c08aff", 1.7, "2 4"] }
    },
    atlas: {
      ink: "#2b3440", paper: "#f4f1e8", mk: "#ffffff", river: "#6f9fc8", label: "#26303a",
      sea: [[0, hex("#c7deee")], [1, hex("#98bcd9")]],
      land: [[0, hex("#d6e6bd")], [.3, hex("#e4e2b8")], [.55, hex("#dccfa2")], [.8, hex("#c8b18f")], [.93, hex("#eeeae2")], [1, hex("#fbfbf8")]],
      wet: hex("#bdd8a6"), dry: hex("#ede0b6"), tree: "#a9c98f",
      routes: { road: ["#c0392b", 2.2, ""], trail: ["#8a6d4a", 1.5, "4 3"], pass: ["#8a5a2a", 1.7, "5 2 1.5 2"], river: ["#3f7fb5", 1.9, "6 3"], sea: ["#2d6da3", 1.6, "8 5"], rail: ["#222", 2.2, "9 4"], air: ["#666", 1.3, "3 4"], tunnel: ["#666", 1.7, "3 3"], portal: ["#7b4fb5", 1.8, "2 3"], lane: ["#2d6da3", 1.6, "8 4"], jump: ["#7b4fb5", 1.6, "2 4"] }
    },
    engraved: {
      ink: "#262019", paper: "#f1e9d4", mk: "#f7f1e2", river: "#262019", label: "#1f1a14",
      routes: { road: ["#262019", 1.6, ""], trail: ["#262019", 1.2, "3 2"], pass: ["#262019", 1.3, "5 2 1.5 2"], river: ["#4c6a80", 1.6, "6 3"], sea: ["#4c6a80", 1.4, "8 5"], rail: ["#262019", 2.2, "8 2"], air: ["#55504a", 1.2, "3 4"], tunnel: ["#5a5048", 1.5, "3 3"], portal: ["#6a3f9e", 1.7, "2 3"], lane: ["#2f4f6f", 1.5, "8 4"], jump: ["#6a3f9e", 1.5, "2 4"] }
    },
    holo: {
      ink: "#5ae2f0", paper: "#020d16", mk: "#06202b", river: "#5ae2f0", label: "#d6fbff",
      routes: { road: ["#ffd166", 1.8, ""], trail: ["#5ae2f0", 1.3, "3 3"], pass: ["#5ae2f0", 1.4, "5 2 1.5 2"], river: ["#5ae2f0", 1.4, "6 3"], sea: ["#5ae2f0", 1.4, "8 5"], rail: ["#ffd166", 2, "10 3"], air: ["#9fb5c9", 1.2, "3 4"], tunnel: ["#9fb5c9", 1.4, "3 3"], portal: ["#c08aff", 1.8, "2 3"], lane: ["#5ad1e6", 1.6, "8 5"], jump: ["#e07ad8", 1.6, "2 4"] }
    },
    stars: {
      ink: "#9fd9ff", paper: "#05070d", mk: "#0b1424", river: "#4a7aa0", label: "#cfe6ff",
      routes: { lane: ["#5ad1e6", 1.6, "8 5"], jump: ["#e07ad8", 1.6, "2 4"], portal: ["#c08aff", 1.8, "2 3"], road: ["#7fa8c9", 1.5, "6 3"], trail: ["#7fa8c9", 1.2, "2 3"], pass: ["#7fa8c9", 1.4, "4 2"], river: ["#4a7aa0", 1.5, "6 3"], sea: ["#4a7aa0", 1.5, "8 5"], rail: ["#9fb5c9", 1.8, "9 3"], air: ["#9fb5c9", 1.2, "3 4"], tunnel: ["#9fb5c9", 1.4, "3 3"] }
    }
  };

  // icons, drawn in a 24-square box about the location's point. .k is filled with the ink.
  const CITY_ICON = '<path d="M-10 7V-5h5v4h2V-9l3-3 3 3v8h2v-4h5V7Z"/><path class="k" d="M-1.6 7V4.4a1.6 1.6 0 0 1 3.2 0V7Z"/>';
  const TEMPLE_ICON = '<path d="M-9-2L0-8l9 6Z"/><path d="M-8 7h16V5.6H-8Z"/><path d="M-6-2v7.5M-2-2v7.5M2-2v7.5M6-2v7.5" fill="none"/>';
  const CAVE_ICON = '<path d="M-10 7Q0-11 10 7Z"/><path class="k" d="M-3.6 7V3.5a3.6 3.6 0 0 1 7.2 0V7Z"/>';
  const CASTLE_ICON = '<path d="M-7 7V-6h2.3v2h2.3v-2h4.8v2h2.3v-2H7V7Z"/><path class="k" d="M-1.8 7V3.6a1.8 1.8 0 0 1 3.6 0V7Z"/>';
  const PORT_ICON = '<circle cx="0" cy="-8.5" r="2" fill="none"/><path d="M0-6.5V7M-6 1.5a6 6 0 0 0 12 0M-3.5-3.5h7" fill="none" stroke-width="1.6"/>';
  const ICONS = {
    parchment: {
      capital: CITY_ICON + '<path class="k" d="M0-12v-6.5l5.5 1.8L0-14.8Z"/>', city: CITY_ICON,
      town: '<path d="M-9 7V0l4-4.5L-1 0v7Z"/><path d="M-2 7V-2.5l5-5 5 5V7Z"/>', village: '<path d="M-6 7V0l6-5.5L6 0v7Z"/>', hamlet: '<path d="M-4.5 7V1.5l4.5-4 4.5 4V7Z"/>',
      manor: '<path d="M-9 7V-1h18v8Z"/><path d="M-10-1l3-5h14l3 5Z"/>', farm: '<path d="M-7 7V0l7-5 7 5v7Z"/><path d="M-3 7V3h6v4" fill="none"/>',
      castle: CASTLE_ICON, keep: CASTLE_ICON, fort: '<path d="M-10 7V-1h3v-2.5h3V-1h8v-2.5h3V-1h3v8Z"/><path class="k" d="M-1.8 7V4a1.8 1.8 0 0 1 3.6 0V7Z"/>',
      tower: '<path d="M-3 7V-4h6V7Z"/><path d="M-4.2-4L0-12l4.2 8Z"/>', ruin: '<path d="M-7 7V-4l1.5 1.2L-4-6l1.4 2.5L-1-3V7Z"/><path d="M2 7V1.5l1.6-1 1.2 1.6L6.5.6 7 7Z"/>',
      dungeon: CAVE_ICON, cave: CAVE_ICON, mine: '<path d="M-9 7Q0-6 9 7Z"/><path d="M-4 4L4-6M-1-8q5 0 8 6" fill="none" stroke-width="1.5"/>',
      lair: '<path d="M-6-2a6 6 0 1 1 12 0c0 3-1.6 4.2-2.6 4.8V6h-6.8V2.8C-4.4 2.2-6 1-6-2Z"/><circle class="k" cx="-2.4" cy="-1.6" r="1.6"/><circle class="k" cx="2.4" cy="-1.6" r="1.6"/>',
      temple: TEMPLE_ICON, monastery: TEMPLE_ICON, shrine: '<path d="M-6 0L0-6l6 6Z"/><path d="M-4 0v7M4 0v7M-6 7h12" fill="none"/>',
      port: PORT_ICON, lighthouse: '<path d="M-3 7l1.2-14h3.6L3 7Z"/><path class="k" d="M-2.4-7h4.8v-3h-4.8Z"/><path d="M-5-9.5h-3M5-9.5h3" fill="none"/>',
      camp: '<path d="M-8 7L0-7l8 14Z"/><path d="M0-7V7M0 7l-2.5-6" fill="none"/>', inn: '<path d="M-7 7V0l6-5 6 5v7Z"/><path d="M5-1h4M8-1v2" fill="none"/><path d="M6.4 1h3.2v3H6.4Z"/>',
      landmark: '<path d="M-2.4 7l.9-13.5L0-9.5l1.5 3L2.4 7Z"/><path d="M-5 7h10" fill="none"/>', site: '<path d="M-2.4 7l.9-13.5L0-9.5l1.5 3L2.4 7Z"/><path d="M-5 7h10" fill="none"/>',
      stones: '<path d="M-8 7V-1.5q1.5-2 3 0V7Z"/><path d="M-1.5 7V-4q1.5-2 3 0V7Z"/><path d="M5 7V-.5q1.5-2 3 0V7Z"/>',
      battlefield: '<path d="M-7-7L7 7M7-7L-7 7M-6-2.5l3.5-3.5M6-2.5L2.5-6" fill="none" stroke-width="1.7"/>',
      bridge: '<path d="M-10 0h20v2.2h-20Z"/><path d="M-8 2.2q8 7 16 0M-8 2.2V7M8 2.2V7" fill="none"/>',
      grove: '<circle cx="-3.5" cy="-1" r="4"/><circle cx="3.5" cy="-2" r="4.2"/><path d="M-3.5 3v4M3.5 2.2V7" fill="none"/>',
      wreck: '<path d="M-9 2h16l-3 5h-10Z"/><path d="M-1 2V-8l5 6h-5" fill="none"/>', base: CASTLE_ICON,
      _: '<circle r="4.6"/><circle class="k" r="1.7"/>'
    },
    atlas: {
      capital: '<circle r="6.5"/><circle class="k" r="3"/>', city: '<circle class="k" r="5.2"/><circle r="2"/>', town: '<circle r="4.2" stroke-width="1.7"/>',
      village: '<circle class="k" r="2.7"/>', hamlet: '<circle class="k" r="2.2"/>', port: PORT_ICON,
      airport: '<path class="k" d="M0-7l1.3 5 5.7 2.6v1.6l-5.7-1.2-.5 4.4 2 1.6v1.2L0 6.4l-2.8.8V6l2-1.6-.5-4.4L-7 1.2V-.4l5.7-2.6Z"/>',
      castle: '<rect x="-4.5" y="-4.5" width="9" height="9"/>', keep: '<rect x="-4.5" y="-4.5" width="9" height="9"/>', fort: '<rect x="-4.5" y="-4.5" width="9" height="9"/>',
      base: '<rect x="-4.5" y="-4.5" width="9" height="9"/><circle class="k" r="1.8"/>', station: '<rect x="-4" y="-4" width="8" height="8" transform="rotate(45)"/>',
      _: '<path d="M0-6L6 5H-6Z"/>'
    },
    stars: {
      star: '<circle class="g" r="10"/><circle class="k" r="4.6"/><path d="M0-11V-6.6M0 11V6.6M-11 0h4.4M11 0H6.6" fill="none"/>',
      planet: '<circle class="pf" r="6"/><ellipse rx="11" ry="3.4" transform="rotate(-18)" fill="none"/>', moon: '<circle class="pf" r="4.2"/>',
      station: '<path d="M0-8L7-4V4L0 8-7 4V-4Z" fill="none"/><circle class="k" r="2.6"/><path d="M0-8v5.4M0 8V2.6M-7-4l4.7 2.6M7 4L2.3 1.4M7-4L2.3-1.4M-7 4l4.7-2.6" fill="none"/>',
      outpost: '<rect x="-5" y="-3" width="10" height="7"/><path d="M0-3v-6M-2.5-9h5" fill="none"/>', base: '<rect x="-5" y="-3" width="10" height="7"/><path d="M0-3v-6M-2.5-9h5" fill="none"/>',
      gate: '<circle r="8" fill="none" stroke-width="2.2"/><circle r="4.5" fill="none" stroke-dasharray="2 2"/>',
      asteroid: '<path d="M-6-1l2-4 5-1 4 3 1 4-3 4h-6l-3-3Z"/>', belt: '<path d="M-6-1l2-4 5-1 4 3 1 4-3 4h-6l-3-3Z"/>',
      ship: '<path d="M8 0L-6-5-3 0-6 5Z"/>', wreck: '<path d="M8 0L-6-5-3 0-6 5Z" stroke-dasharray="2 1.5"/>',
      anomaly: '<circle r="7" fill="none" stroke-dasharray="1.5 2.5"/><circle class="k" r="2"/>',
      _: '<path d="M0-6L6 0 0 6-6 0Z"/>'
    },
    // a survey's settlements: shapes a machine would draw
    holo: {
      capital: '<path d="M0-8L7-4V4L0 8-7 4V-4Z"/><path class="k" d="M0-4L3.5-2V2L0 4-3.5 2V-2Z"/>', city: '<path d="M0-7L6-3.5V3.5L0 7-6 3.5V-3.5Z"/><circle class="k" r="2"/>',
      town: '<path d="M0-5.5L4.8-2.8V2.8L0 5.5-4.8 2.8V-2.8Z"/>', village: '<rect x="-3" y="-3" width="6" height="6"/>', hamlet: '<rect x="-2.4" y="-2.4" width="4.8" height="4.8"/>',
      port: '<path d="M-6 3L0-6 6 3Z"/><path class="k" d="M-2 3h4v2h-4Z"/>', base: '<rect x="-5" y="-5" width="10" height="10"/><path d="M-5 0H5M0-5V5" fill="none"/>', outpost: '<rect x="-4" y="-4" width="8" height="8" transform="rotate(45)"/>',
      station: '<circle r="5.5"/><circle class="k" r="2"/><path d="M-8 0h2.5M5.5 0H8M0-8v2.5M0 5.5V8" fill="none"/>', mine: '<path d="M-5 5L0-5 5 5Z"/><path d="M-2 5V2h4v3" fill="none"/>',
      ruin: '<path d="M-5 5V-1l2-2 2 2M1 5V-4l2 1 2-1V5" fill="none" stroke-dasharray="2 1"/>', site: '<circle r="4.5" fill="none"/><circle class="k" r="1.5"/>',
      _: '<path d="M0-6L6 0 0 6-6 0Z"/>'
    }
  };
  ICONS.engraved = ICONS.parchment;
  // the painted map's settlements: the parchment's shapes with red roofs (class r) and grey stone (class s)
  const ROOF = (d) => `<path class="r" d="${d}"/>`;
  ICONS.painted = Object.assign({}, ICONS.parchment, {
    capital: '<path class="s" d="M-10 7V-5h5v4h2V-9l3-3 3 3v8h2v-4h5V7Z"/>' + ROOF("M-11-5l3.5-3.5L-4-5ZM4-5l3.5-3.5L11-5ZM-3-9L0-13l3 4Z") + '<path class="k" d="M-1.6 7V4.4a1.6 1.6 0 0 1 3.2 0V7Z"/><path class="r" d="M0-13v-5.5l5.5 1.8L0-14.8Z"/>',
    city: '<path class="s" d="M-10 7V-5h5v4h2V-9l3-3 3 3v8h2v-4h5V7Z"/>' + ROOF("M-11-5l3.5-3.5L-4-5ZM4-5l3.5-3.5L11-5ZM-3-9L0-13l3 4Z") + '<path class="k" d="M-1.6 7V4.4a1.6 1.6 0 0 1 3.2 0V7Z"/>',
    town: '<path d="M-9 7V0h8v7Z"/><path d="M-2 7V-2.5h10V7Z"/>' + ROOF("M-10 .5L-5-4.5 0 .5ZM-3-2L3-8l6 6Z"),
    village: '<path d="M-5.5 7V0.5h11V7Z"/>' + ROOF("M-7 1L0-6l7 7Z") + '<path class="k" d="M-1.3 7V3.6h2.6V7Z"/>',
    hamlet: '<path d="M-4 7V2h8v5Z"/>' + ROOF("M-5.4 2.6L0-3l5.4 5.6Z"),
    farm: '<path d="M-7 7V1h14v6Z"/>' + ROOF("M-8.4 1.6L0-5l8.4 6.6Z") + '<path d="M-3 7V3.5h6V7" fill="none"/>',
    inn: '<path d="M-7 7V0.5h12V7Z"/>' + ROOF("M-8.4 1L-1-5.5 6.4 1Z") + '<path d="M5-1h4M8-1v2" fill="none"/><path class="r" d="M6.4 1h3.2v3H6.4Z"/>',
    manor: '<path d="M-9 7V-1h18v8Z"/>' + ROOF("M-10.4-1l3-5h14.8l3 5Z"),
    castle: '<path class="s" d="M-7 7V-6h2.3v2h2.3v-2h4.8v2h2.3v-2H7V7Z"/><path class="k" d="M-1.8 7V3.6a1.8 1.8 0 0 1 3.6 0V7Z"/><path class="r" d="M0-6v-5l4 1.4L0-8.4Z"/>',
    keep: '<path class="s" d="M-7 7V-6h2.3v2h2.3v-2h4.8v2h2.3v-2H7V7Z"/><path class="k" d="M-1.8 7V3.6a1.8 1.8 0 0 1 3.6 0V7Z"/>',
    fort: '<path class="s" d="M-10 7V-1h3v-2.5h3V-1h8v-2.5h3V-1h3v8Z"/><path class="k" d="M-1.8 7V4a1.8 1.8 0 0 1 3.6 0V7Z"/>',
    tower: '<path class="s" d="M-3 7V-4h6V7Z"/>' + ROOF("M-4.2-4L0-12l4.2 8Z"),
    ruin: '<path class="s" d="M-7 7V-4l1.5 1.2L-4-6l1.4 2.5L-1-3V7Z"/><path class="s" d="M2 7V1.5l1.6-1 1.2 1.6L6.5.6 7 7Z"/>',
    temple: '<path class="s" d="M-9-2L0-8l9 6Z"/><path class="s" d="M-8 7h16V5.6H-8Z"/><path d="M-6-2v7.5M-2-2v7.5M2-2v7.5M6-2v7.5" fill="none"/>',
    monastery: '<path class="s" d="M-8 7V0h16v7Z"/>' + ROOF("M-9.4.6L0-5l9.4 5.6Z") + '<path class="s" d="M3-5V-10h3v5"/>'
  });
  ICONS.relief = ICONS.painted; ICONS.hydro = ICONS.painted;
  const PLANETS = ["#c97b4a", "#5f8fc9", "#8fbf6a", "#c9b36a", "#9b6ac9", "#6ac9c0", "#d9d2c4", "#c96a7e"];
  const iconOf = (look, L) => {
    const set = ICONS[look] || ICONS.parchment, k = String(L.kind || "").toLowerCase();
    let s = set[k] || set._;
    if (look === "stars" && /class="pf"/.test(s)) s = s.replace(/class="pf"/g, `class="pf" style="fill:${PLANETS[Math.floor(strHash(L.id) * PLANETS.length)]}"`);
    return s;
  };
  const impOf = L => (KINDS[L.kind] || [3])[0];

  /* ---- registering a world, and laying the referee's changes over it */
  A.world = data => { A.worldData = data || {}; return A; };
  // what the map's art draws with (atlas-world-art.js)
  A.worldDraw = { sampler: G => sampler(G), coastRings: G => coastRings(G), chaikin: (p, n, c) => chaikin(p, n, c), rdpRing: (r, e) => rdpRing(r, e), pathD: (p, c) => pathD(p, c), hash, ramp, mix, hex, clamp, vnoise: s => vnoise(s) };
  // (the players' copy, atlas-share.js, works out from it which places the players know)
  A.worldPrepare = (W, T, OV) => prepareWorld(W, T, OV);
  A.worldTerrain = data => { A.worldTerrainData = data || {}; return A; };
  const unb64 = s => {
    if (!s) return null; if (typeof s !== "string") return Uint8Array.from(s);
    const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary"), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  };
  /* ---- the land as the game master reshaped it (27 Oct 2026, the master plan's world builder): strokes of a brush,
          each { m: mode, r: radius, p: [[x, y], ...] }, laid over the land in order (world.js shape:, then the page's
          own); a world with no land yet starts as all sea or all land (shape.base) */
  const BRUSH = { land: "Raise land", sea: "Sea or lake", mountains: "Mountains", hills: "Hills", flat: "Lowland", forest: "Forest", desert: "Desert", swamp: "Swamp", grass: "Grassland" };
  // (27 Oct 2026: the brush also lays any kind of land of atlas-world-biomes.js: a jungle, a glacier, a volcano, a
  // glowing lake... kept in the land's cover; "natural" clears what was laid, back to what the climate makes)
  const coverKind = m => !BRUSH[m] && A.worldBiomes && A.worldBiomes.BY[m] || null;
  const brushName = m => BRUSH[m] || (coverKind(m) ? coverKind(m).name : m);
  function stroke(G, s) {
    const { cols, rows, cell, sea } = G, r = Math.max(4, Math.min(240, +s.r || 30)), pts = (s.p || []).filter(q => Array.isArray(q));
    const bio = coverKind(s.m);
    if (!pts.length || (!BRUSH[s.m] && !bio)) return;
    if (bio && !G.C) G.C = new Uint8Array(cols * rows);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const i0 = clamp(Math.floor((x0 - r) / cell), 0, cols - 1), i1 = clamp(Math.ceil((x1 + r) / cell), 0, cols - 1), j0 = clamp(Math.floor((y0 - r) / cell), 0, rows - 1), j1 = clamp(Math.ceil((y1 + r) / cell), 0, rows - 1);
    const line = pts.length > 1 ? pts : [pts[0], pts[0]], Hh = G.H, M = G.M;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + .5) * cell, y = (j + .5) * cell, d = lineDist(x, y, line); if (d >= r) continue;
      // full strength over the brush's inner half, softening to nothing at its edge
      const t = Math.min(1, (1 - d / r) * 1.8), w = t * t * (3 - 2 * t), n = j * cols + i, h = Hh[n], land = h > sea, toward = (v, tg) => Math.round(v + (tg - v) * w);
      if (bio) { coverCell(G, bio, n, i, j, w, h, land, d / r, toward); continue; }
      switch (s.m) {
        case "land": if (h < sea + 16) Hh[n] = toward(h, sea + 18); break;
        case "sea": if (h > sea - 40) Hh[n] = toward(h, sea - 42); break;
        case "mountains": { const tg = sea + 78 + Math.round(hash(i, j, 7) * 46) + Math.round(w * 20); if (h < tg) Hh[n] = toward(Math.max(h, sea + 12), tg); break; }
        case "hills": { const tg = sea + 56 + Math.round(hash(i, j, 9) * 12); if (h < tg) Hh[n] = toward(Math.max(h, sea + 10), tg); break; }
        case "flat": if (land) Hh[n] = toward(h, sea + 20); break;
        case "forest": M[n] = toward(M[n], 232); break;
        case "desert": M[n] = toward(M[n], 16); break;
        case "swamp": M[n] = toward(M[n], 252); if (land && h > sea + 10) Hh[n] = toward(h, sea + 8); break;
        case "grass": M[n] = toward(M[n], 128); break;
      }
    }
  }
  // one cell under the brush of a kind of land: laid where the brush is strong (its edge ragged), the height changed as
  // the kind asks (mountains raised, a volcano's cone, lowland for a marsh, water for a lake of any liquid)
  function coverCell(G, bio, n, i, j, w, h, land, dr, toward) {
    const { sea } = G, Hh = G.H, C = G.C, lay = w > .3 + hash(i, j, 13) * .35;
    if (bio.id === "natural") { if (lay) C[n] = 0; return; }
    if (bio.water) { if (land) { if (lay) { Hh[n] = Math.min(h, bio.id === "reef" ? sea - 6 : sea - 26); C[n] = bio.code; } } else if (lay) C[n] = bio.code; return; }
    if (!land) return;
    if (lay) C[n] = bio.code;
    switch (bio.lift) {
      case "mtn": { const tg = sea + 80 + Math.round(hash(i, j, 7) * 44) + Math.round(w * 20); if (h < tg) Hh[n] = toward(Math.max(h, sea + 12), tg); break; }
      case "hill": { const tg = sea + 50 + Math.round(hash(i, j, 9) * 14); if (h < tg) Hh[n] = toward(Math.max(h, sea + 10), tg); break; }
      case "cone": { const tg = sea + 60 + Math.round((1 - dr) * 70); if (h < tg) Hh[n] = toward(Math.max(h, sea + 12), tg); break; }
      case "mesa": { const tg = sea + 46 + Math.round(hash(i, j, 11) * 6); if (h < tg) Hh[n] = toward(Math.max(h, sea + 10), tg); break; }
      case "low": if (h > sea + 10) Hh[n] = toward(h, sea + 6); break;
    }
  }
  const shapeOf = (W, OV) => { const a = W && W.shape || {}, b = OV && OV.shape || {}; return { base: b.base || a.base || null, strokes: [...(a.strokes || []), ...(b.strokes || [])] }; };
  const blankLand = (size, base) => { const cell = 4, cols = Math.ceil(size[0] / cell), rows = Math.ceil(size[1] / cell), N = cols * rows; return { cols, rows, cell, sea: 128, H: new Uint8Array(N).fill(base === "land" ? 146 : 86), M: new Uint8Array(N).fill(128), C: new Uint8Array(N) }; };
  // rivers, names on the map and realms: each with an id, so the page can change or remove the ones the land came with
  const withIds = (list, pre) => (Array.isArray(list) ? list : []).filter(f => f && typeof f === "object").map((f, i) => Object.assign({}, f, { id: f.id || pre + i }));
  function features(W, T, OV) {
    const hide = new Set([].concat(W.hide || []));
    const L = { river: W.final ? withIds(W.rivers, "w") : [...withIds(T.rivers, "t"), ...withIds(W.rivers, "w")], label: W.final ? withIds(W.labels, "wl") : [...withIds(T.labels, "tl"), ...withIds(W.labels, "wl")], realm: withIds(W.realms, "wr") };
    for (const k in L) L[k] = L[k].filter(f => !hide.has(f.id));
    for (const [id, d] of Object.entries(OV.feat || {})) {
      if (!d || typeof d !== "object") continue;
      let hit = null; for (const k in L) { const i = L[k].findIndex(f => f.id === id); if (i >= 0) { hit = [k, i]; break; } }
      if (hit) { if (d.gone) L[hit[0]].splice(hit[1], 1); else L[hit[0]][hit[1]] = Object.assign({}, L[hit[0]][hit[1]], d, { id, edited: true }); }
      else if (!d.gone && L[d.type]) L[d.type].push(Object.assign({}, d, { id, added: true }));
    }
    return L;
  }
  const centroid = P => { let a = 0, x = 0, y = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const c = P[j][0] * P[i][1] - P[i][0] * P[j][1]; a += c; x += (P[j][0] + P[i][0]) * c; y += (P[j][1] + P[i][1]) * c; } return Math.abs(a) > 1e-6 ? [x / (3 * a), y / (3 * a)] : [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]; };
  // the referee's changes as the page keeps them (docs of the collection "world"): l- a location, r- a route, f- a river,
  // name or realm, and the reshaped land, the party, the look
  function ovFrom(docs) {
    const OV = { loc: {}, route: {}, feat: {}, party: null, style: null, shape: null, gen: null };
    for (const [id, d] of docs) { if (id.startsWith("l-")) OV.loc[id.slice(2)] = d; else if (id.startsWith("r-")) OV.route[id.slice(2)] = d; else if (id.startsWith("f-")) OV.feat[id.slice(2)] = d; else if (id === "party") OV.party = d; else if (id === "style") OV.style = d; else if (id === "shape") OV.shape = d; else if (id === "gen") OV.gen = d && d.size ? d : null; }
    return OV;
  }
  A.worldOV = ovFrom;
  // the sizes a world can be made at (scripts/world-invent.js SIZES), how far across each is, and about how long the
  // page takes to make it
  const GEN_SIZES = { small: [800, 560], medium: [1000, 700], large: [1400, 980], huge: [1800, 1260], vast: [2600, 1820], world: [3600, 2520], supercontinent: [4800, 3300], hemisphere: [5200, 3400], planet: [6400, 3200] };
  const GEN_KM = { supercontinent: 13000, hemisphere: 20000 };
  const GEN_SECS = { small: 4, medium: 6, large: 12, huge: 18, vast: 30, world: 50, supercontinent: 150, hemisphere: 130, planet: 200 };
  // a made world kept in this browser (IndexedDB), by its recipe, so it is made only once
  function genCache(key, T) {
    return new Promise(done => {
      let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      const id = ((A.config && A.config.storageKey) || "atlas") + "-" + (h >>> 0).toString(36) + "-" + key.length;
      let rq; try { rq = indexedDB.open("atlas-worlds", 1); } catch (e) { done(null); return; }
      rq.onupgradeneeded = () => rq.result.createObjectStore("w");
      rq.onerror = () => done(null);
      rq.onsuccess = () => { try { const db = rq.result, tx = db.transaction("w", T ? "readwrite" : "readonly"), st = tx.objectStore("w"); if (T) { st.put({ key, T }, id); tx.oncomplete = () => done(T); tx.onerror = () => done(null); } else { const g = st.get(id); g.onsuccess = () => done(g.result && g.result.key === key ? g.result.T : null); g.onerror = () => done(null); } } catch (e) { done(null); } };
    });
  }
  // the world as the page draws it: the campaign's world.js, its terrain, and the referee's changes (OV) laid over them
  // (opt.noLand: the places and realms only, without working out the land)
  function prepareWorld(W, T, OV, opt) {
    W = W || {}; T = T || {}; OV = OV || {}; opt = opt || {};
    let look = LOOK_OF[String(W.look || T.look || "parchment").toLowerCase()] || "parchment";
    // the game master's choice (OV.style), where the world can wear it: a star chart stays one, a world with land any other
    const want = OV.style && LOOK_OF[String(OV.style.look || "").toLowerCase()], starry = !!T.stars || look === "stars";
    if (want && (want === "stars") === starry) look = want;
    const size = Array.isArray(W.size) && W.size[0] > 0 ? W.size.slice(0, 2) : T.w ? [T.w, T.h] : [1000, 700];
    const SH = shapeOf(W, OV);
    let G = opt.noLand ? null : T.height && T.cols ? { cols: T.cols, rows: T.rows, cell: T.cell, sea: T.sea == null ? 128 : T.sea, H: unb64(T.height), M: unb64(T.moist), C: unb64(T.cover), B: unb64(T.biome), Cn: unb64(T.canopy), Tc: unb64(T.tempC), Gr: unb64(T.ground) } : null;
    if (!opt.noLand && !G && SH.base && !T.stars && !T.drawing) G = blankLand(size, SH.base);
    if (G) {
      if (!G.M) G.M = new Uint8Array(G.cols * G.rows).fill(128); if (!G.C || G.C.length !== G.cols * G.rows) G.C = new Uint8Array(G.cols * G.rows);
      const H0 = T.heightLo ? Uint8Array.from(G.H) : null;
      for (const s of SH.strokes) stroke(G, s);
      // (the land's heights with their fractions, for the slopes of a shaded relief; where the brush changed a cell its
      // own height is used)
      if (H0) { const lo = unb64(T.heightLo); G.Hf = new Float32Array(G.H.length); for (let n = 0; n < G.H.length; n++) G.Hf[n] = G.H[n] === H0[n] && lo ? G.H[n] + lo[n] / 256 : G.H[n]; }
    }
    const F = features(W, T, OV);
    const spots = T.spots || {}, locs = [], byId = {};
    for (const l of W.locations || []) {
      if (!l || !l.id || byId[l.id]) continue;
      const o = Object.assign({ kind: "town", state: "known" }, l);
      o.at = Array.isArray(l.at) ? l.at.slice(0, 2) : Array.isArray(spots[l.id]) ? spots[l.id].slice(0, 2) : null;
      // a city made with the location's own id is its 3D map, whether or not world.js says so (the page made it)
      if (!o.city && A.cities && A.cities[o.id]) o.city = o.id;
      locs.push(o); byId[o.id] = o;
    }
    for (const [id, d] of Object.entries(OV.loc || {})) {
      if (!d || typeof d !== "object") continue;
      if (byId[id]) { if (d.gone) byId[id].gone = true; else Object.assign(byId[id], d, { edited: true }); }
      else if (!d.gone && d.name) { const o = Object.assign({ kind: "town", state: "known" }, d, { id, added: true }); locs.push(o); byId[id] = o; }
    }
    // a location with nowhere to stand (written by hand, the terrain not made again since) waits in a row at the foot
    let un = 0; for (const l of locs) if (!l.gone && !Array.isArray(l.at)) { l.at = [size[0] * (.08 + (un % 12) * .075), size[1] * (.93 - Math.floor(un / 12) * .05)]; l.unplaced = true; un++; }
    const routes = [], rById = {};
    const from = (W.routes && W.routes.length ? W.routes : T.routes || []);
    for (const r of from) { if (!r || !r.from || !r.to) continue; const id = r.id || r.from + "~" + r.to; if (rById[id]) continue; const o = Object.assign({ kind: "road" }, r, { id }); routes.push(o); rById[id] = o; }
    for (const [id, d] of Object.entries(OV.route || {})) {
      if (!d || typeof d !== "object") continue;
      if (rById[id]) { if (d.gone) rById[id].gone = true; else Object.assign(rById[id], d, { edited: true }); }
      else if (!d.gone && d.from && d.to) { const o = Object.assign({ kind: "road" }, d, { id, added: true }); routes.push(o); rById[id] = o; }
    }
    const live = locs.filter(l => !l.gone), ok = id => byId[id] && !byId[id].gone;
    const party = Object.assign({ at: null, plan: [], trail: [] }, W.party || {}, OV.party || {});
    party.plan = (party.plan || []).filter(ok); party.trail = (party.trail || []).filter(ok); if (!ok(party.at)) party.at = null;
    // a real map knows its own scale (the terrain says it); world.js may still give another
    const realms = F.realm.filter(g => Array.isArray(g.pts) && g.pts.length > 2).map(g => Object.assign(g, { mid: Array.isArray(g.at) ? g.at : centroid(g.pts) }));
    return { look, title: W.title || "", size, scale: W.scale && W.scale.per > 0 ? W.scale : T.scale && T.scale.per > 0 ? T.scale : null, speeds: W.speeds || null, G, rivers: F.river.filter(rv => Array.isArray(rv.pts) && rv.pts.length > 1), stars: T.stars || null,
      labels: F.label.filter(l => l.name && Array.isArray(l.at)), realms, shape: SH, locs: live, byId, routes: routes.filter(r => !r.gone && ok(r.from) && ok(r.to)), rById, party, W, T };
  }
  // the realm a point lies in (the smallest, where realms lie one in another)
  const realmAt = (WD, at) => { let best = null, ba = Infinity; for (const g of WD.realms || []) if (pip(at[0], at[1], g.pts)) { let a = 0; for (let i = 0, j = g.pts.length - 1; i < g.pts.length; j = i++) a += g.pts[j][0] * g.pts[i][1] - g.pts[i][0] * g.pts[j][1]; a = Math.abs(a); if (a < ba) { ba = a; best = g; } } return best; };
  // what a faction holds on the world map (the factions' tab shows it): realms and places whose owner it is
  A.worldHeld = (docs, fid) => {
    if (!A.worldData) return [];
    const WD = prepareWorld(A.worldData, A.worldTerrainData, ovFrom(docs || []), { noLand: true });
    return [...WD.realms.filter(g => g.owner === fid).map(g => g.name || "A realm"), ...WD.locs.filter(l => l.owner === fid).map(l => l.name)];
  };

  /* ---- the land: heights and wetness on a grid of cells (world-terrain.js) */
  function sampler(G) {
    const { cols, rows, cell } = G;
    return (x, y, arr) => {
      arr = arr || G.Hf || G.H; const fx = x / cell - .5, fy = y / cell - .5, i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
      const g = (a, b) => arr[clamp(b, 0, rows - 1) * cols + clamp(a, 0, cols - 1)];
      return (g(i, j) * (1 - tx) + g(i + 1, j) * tx) * (1 - ty) + (g(i, j + 1) * (1 - tx) + g(i + 1, j + 1) * tx) * ty;
    };
  }
  // the colours of the land and the sea, shaded as if lit from the north-west; a star map's nebulae
  function paintTerrain(WD) {
    const G = WD.G, k = 2, cw = G.cols * k, ch = G.rows * k, st = STYLE[WD.look], S = sampler(G), sea = G.sea;
    const NEB = [hex("#3b1f5e"), hex("#123f4c"), hex("#4b1a33"), hex("#1d2f63")], stars = WD.look === "stars";
    const paint = colour => {
      const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
      const cx = cv.getContext("2d"), img = cx.createImageData(cw, ch), d = img.data;
      for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
        const x = (px + .5) / k * G.cell, y = (py + .5) / k * G.cell, c = colour(x, y, S(x, y), G.M ? S(x, y, G.M) : 128), o = (py * cw + px) * 4;
        d[o] = clamp(c[0], 0, 255); d[o + 1] = clamp(c[1], 0, 255); d[o + 2] = clamp(c[2], 0, 255); d[o + 3] = 255;
      }
      cx.putImageData(img, 0, 0); return cv.toDataURL();
    };
    // nebulae: the wetness grid is their density, the height grid their colour
    if (stars) return { sea: paint((x, y, hv, mv) => { const dens = clamp((mv - 120) / 135, 0, 1), hue = hv / 256 * NEB.length, a = NEB[Math.floor(hue) % NEB.length], b = NEB[(Math.floor(hue) + 1) % NEB.length]; return mix([5, 7, 13], mix(a, b, hue % 1), dens * dens * .9); }) };
    return {
      sea: paint((x, y, hv) => ramp(st.sea, clamp((sea - hv) / Math.max(1, sea) * 2.2, 0, 1))),
      land: paint((x, y, hv, mv) => {
        const t = Math.max(0, (hv - sea) / (255 - sea)); let c = ramp(st.land, t);
        if (t < .62) { const wv = (mv - 128) / 127; c = wv > 0 ? mix(c, st.wet, wv * .8) : mix(c, st.dry, -wv * .7); }
        const dx = S(x + G.cell, y) - S(x - G.cell, y), dy = S(x, y + G.cell) - S(x, y - G.cell), sh = hv > sea ? clamp(1 - (dx + dy) * (WD.T && WD.T.real ? .006 : .011), .72, 1.16) : 1;
        return [c[0] * sh, c[1] * sh, c[2] * sh];
      })
    };
  }
  // the coast: where the land meets the sea, as closed rings (marching squares over the grid, the edge counted as sea)
  function coastRings(G) {
    const { cols, rows, cell, H, sea } = G, v = (i, j) => (i < 0 || j < 0 || i >= cols || j >= rows) ? -1 : H[j * cols + i];
    const pts = [], segs = [], key = new Map();
    const pid = (x, y) => { const k = Math.round(x * 64) + "," + Math.round(y * 64); let i = key.get(k); if (i == null) { i = pts.length; pts.push([(x + .5) * cell, (y + .5) * cell]); key.set(k, i); } return i; };
    const t = (p, q) => (sea + .5 - p) / (q - p);
    for (let j = -1; j < rows; j++) for (let i = -1; i < cols; i++) {
      const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1), L = sea + .5;
      const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
      if (!idx || idx === 15) continue;
      const T = () => pid(i + t(a, b), j), R = () => pid(i + 1, j + t(b, c)), B = () => pid(i + t(d, c), j + 1), Lf = () => pid(i, j + t(a, d));
      const add = (p, q) => segs.push([p, q]);
      switch (idx) {
        case 1: case 14: add(Lf(), B()); break;
        case 2: case 13: add(B(), R()); break;
        case 3: case 12: add(Lf(), R()); break;
        case 4: case 11: add(T(), R()); break;
        case 6: case 9: add(T(), B()); break;
        case 7: case 8: add(Lf(), T()); break;
        case 5: if ((a + b + c + d) / 4 > L) { add(Lf(), T()); add(B(), R()); } else { add(Lf(), B()); add(T(), R()); } break;
        case 10: if ((a + b + c + d) / 4 > L) { add(T(), R()); add(Lf(), B()); } else { add(Lf(), T()); add(B(), R()); } break;
      }
    }
    const at = pts.map(() => []); segs.forEach((s, n) => { at[s[0]].push(n); at[s[1]].push(n); });
    const used = new Uint8Array(segs.length), rings = [];
    for (let n = 0; n < segs.length; n++) {
      if (used[n]) continue; used[n] = 1;
      const ring = [segs[n][0], segs[n][1]];
      for (let guard = 0; guard < 200000; guard++) {
        const last = ring[ring.length - 1], next = at[last].find(m => !used[m]);
        if (next == null) break; used[next] = 1; const s = segs[next]; ring.push(s[0] === last ? s[1] : s[0]);
      }
      if (ring.length > 3) rings.push(ring.map(i => pts[i]));
    }
    return rings;
  }
  function chaikin(p, n, closed) {
    for (let k = 0; k < n; k++) {
      const out = closed ? [] : [p[0]], m = p.length;
      for (let i = 0; i < (closed ? m : m - 1); i++) { const a = p[i], b = p[(i + 1) % m]; out.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
      if (!closed) out.push(p[m - 1]); p = out;
    }
    return p;
  }
  function rdp(p, eps) {
    if (p.length < 3) return p;
    const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const stack = [[0, p.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); let best = -1, bd = eps;
      const [x1, y1] = p[a], [x2, y2] = p[b], L = Math.hypot(x2 - x1, y2 - y1) || 1;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((x2 - x1) * (y1 - p[i][1]) - (x1 - p[i][0]) * (y2 - y1)) / L; if (d > bd) { bd = d; best = i; } }
      if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
    }
    return p.filter((_, i) => keep[i]);
  }
  // a closed ring is simplified in two halves (from its first point to the point farthest from it, and back): as one
  // line its ends meet, and every point would seem to lie on it
  function rdpRing(r, eps) {
    if (r.length < 4) return r;
    let m = 1, far = -1; for (let i = 1; i < r.length; i++) { const d = (r[i][0] - r[0][0]) ** 2 + (r[i][1] - r[0][1]) ** 2; if (d > far) { far = d; m = i; } }
    const a = rdp(r.slice(0, m + 1), eps), b = rdp(r.slice(m), eps);
    return a.concat(b.slice(1, b.length - (b.length > 1 && b[b.length - 1][0] === r[0][0] && b[b.length - 1][1] === r[0][1] ? 1 : 0)));
  }
  const pathD = (p, closed) => "M" + p.map(q => r1(q[0]) + " " + r1(q[1])).join("L") + (closed ? "Z" : "");
  const plen = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
  const midOf = p => { const half = plen(p) / 2; let s = 0; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (s + l >= half) { const t = (half - s) / (l || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; } s += l; } return p[0]; };

  /* ---- a world the game master drew: the picture (ATLAS.worldDrawingSrc, put in the page by the build), its coasts
          traced so it can be redrawn in Atlas's look, and its features (world.js features:) raised as mountains,
          planted as forests, run as rivers. A coloured map's blue is its sea; on an ink drawing the sea is the paper
          the sheet's edge reaches without crossing a line. */
  function vnoise(seed) {
    const P = new Float32Array(1024); let s = seed >>> 0 || 1; for (let i = 0; i < 1024; i++) { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; P[i] = s / 4294967296; }
    const at = (i, j) => P[(Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) & 1023], sm = t => t * t * (3 - 2 * t);
    const n = (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = sm(x - i), v = sm(y - j), a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
    return (x, y) => (n(x, y) * 4 + n(x * 2.1, y * 2.1) * 2 + n(x * 4.3, y * 4.3)) / 7;
  }
  function bfs(cols, rows, is) {
    const N = cols * rows, D = new Float32Array(N).fill(1e9), q = [];
    for (let n = 0; n < N; n++) if (is(n)) { D[n] = 0; q.push(n); }
    for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && D[m] > D[n] + 1) { D[m] = D[n] + 1; q.push(m); } }
    return D;
  }
  // patches of like cells (4-way) no bigger than max, handed to fix: a word written in the sea is not an island
  function specks(cols, rows, is, max, fix) {
    const N = cols * rows, seen = new Uint8Array(N);
    for (let n = 0; n < N; n++) {
      if (seen[n] || !is(n)) continue;
      const cells = [n]; seen[n] = 1;
      for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, j > 0 ? c - cols : -1, j < rows - 1 ? c + cols : -1]) if (m >= 0 && !seen[m] && is(m)) { seen[m] = 1; cells.push(m); } }
      if (cells.length <= max) for (const c of cells) fix(c);
    }
  }
  const pip = (x, y, P) => { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  const lineDist = (x, y, L) => { let best = 1e9; for (let i = 1; i < L.length; i++) { const [ax, ay] = L[i - 1], [bx, by] = L[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return best; };
  function traceDrawing(img, W, H, feats) {
    const cell = 4, cols = Math.round(W / cell), rows = Math.round(H / cell), N = cols * rows;
    const iw = Math.max(cols * 2, Math.min(1800, img.naturalWidth || 1800)), ih = Math.max(rows * 2, Math.round(iw * (img.naturalHeight || H) / (img.naturalWidth || W)));
    const cv = document.createElement("canvas"); cv.width = iw; cv.height = ih;
    const cx = cv.getContext("2d", { willReadFrequently: true }); cx.fillStyle = "#fff"; cx.fillRect(0, 0, iw, ih); cx.drawImage(img, 0, 0, iw, ih);
    const px = cx.getImageData(0, 0, iw, ih).data, minL = new Float32Array(N).fill(255), sum = new Float32Array(N * 4), cnt = new Float32Array(N);
    for (let y = 0; y < ih; y++) { const j = Math.min(rows - 1, Math.floor(y * rows / ih)); for (let x = 0; x < iw; x++) { const n = j * cols + Math.min(cols - 1, Math.floor(x * cols / iw)), o = (y * iw + x) * 4, r = px[o], g = px[o + 1], b = px[o + 2], l = .3 * r + .59 * g + .11 * b; if (l < minL[n]) minL[n] = l; sum[n * 4] += r; sum[n * 4 + 1] += g; sum[n * 4 + 2] += b; sum[n * 4 + 3] += l; cnt[n]++; } }
    const avgL = new Float32Array(N), blue = new Uint8Array(N); let nb = 0;
    for (let n = 0; n < N; n++) { const c = cnt[n] || 1, r = sum[n * 4] / c, g = sum[n * 4 + 1] / c, b = sum[n * 4 + 2] / c; avgL[n] = sum[n * 4 + 3] / c; if (b - (r + g) / 2 > 14 && b > 80) { blue[n] = 1; nb++; } }
    const paper = Float32Array.from(avgL).sort()[Math.floor(N * .75)];
    let sea = new Uint8Array(N), how = "lines", wall = null;
    if (nb > N * .08 && nb < N * .94) { sea = blue; how = "colour"; }
    else {
      wall = new Uint8Array(N);
      for (let n = 0; n < N; n++) if (minL[n] < paper * .68 || avgL[n] < paper * .82) { const i = n % cols, j = (n / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const I = i + di, J = j + dj; if (I >= 0 && J >= 0 && I < cols && J < rows) wall[J * cols + I] = 1; } }
      const q = [], seed = n => { if (!wall[n] && !sea[n]) { sea[n] = 1; q.push(n); } };
      for (let i = 0; i < cols; i++) { seed(i); seed((rows - 1) * cols + i); } for (let j = 0; j < rows; j++) { seed(j * cols); seed(j * cols + cols - 1); }
      for (const f of feats) if (f && f.kind === "sea" && Array.isArray(f.at)) seed(clamp(Math.floor(f.at[1] / cell), 0, rows - 1) * cols + clamp(Math.floor(f.at[0] / cell), 0, cols - 1));
      for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; if (i > 0) seed(n - 1); if (i < cols - 1) seed(n + 1); if (j > 0) seed(n - cols); if (j < rows - 1) seed(n + cols); }
    }
    if (wall) {
      const seen = new Uint8Array(N);
      for (let n = 0; n < N; n++) {
        if (seen[n] || sea[n]) continue;
        const cells = [n]; seen[n] = 1; let paperIn = 0;
        for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; if (!wall[c]) paperIn++; for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, j > 0 ? c - cols : -1, j < rows - 1 ? c + cols : -1]) if (m >= 0 && !seen[m] && !sea[m]) { seen[m] = 1; cells.push(m); } }
        if (cells.length < N * .02 && paperIn < Math.max(3, cells.length * .12)) for (const c of cells) sea[c] = 1;
      }
    }
    specks(cols, rows, n => !sea[n], Math.max(3, N * .0004), n => { sea[n] = 1; });
    specks(cols, rows, n => !!sea[n], Math.max(3, N * .0006), n => { sea[n] = 0; });
    let land = 0; for (let n = 0; n < N; n++) if (!sea[n]) land++;
    const share = land / N, ok = share > .05 && share < .985;
    if (share <= .05) sea.fill(0);                      // the coast did not close, or there is none: all of it is land
    const dS = bfs(cols, rows, n => !!sea[n]), dL = bfs(cols, rows, n => !sea[n]), nz = vnoise(11), nm = vnoise(23);
    const Hh = new Uint8Array(N), M = new Uint8Array(N), Cv = new Uint8Array(N), KB = A.worldBiomes ? A.worldBiomes.BY : {};
    for (let n = 0; n < N; n++) {
      const i = n % cols, j = (n / cols) | 0, f = nz(i / 14, j / 14), g = nm(i / 18, j / 18);
      Hh[n] = sea[n] ? clamp(Math.round(128 - Math.min(118, dL[n] * 7)), 0, 128) : clamp(Math.round(132 + Math.min(26, dS[n] * 1.6) + f * 16), 129, 176);
      M[n] = clamp(Math.round(92 + g * 46 + (dS[n] < 4 ? 14 : 0)), 0, 148);
    }
    const rivers = [], labels = [];
    for (const f of feats) {
      if (!f || !f.kind) continue;
      const area = Array.isArray(f.pts) && f.pts.length > 2 ? f.pts : null, line = Array.isArray(f.line) && f.line.length > 1 ? f.line : null, w2 = (f.width || (f.kind === "river" ? 0 : 36)) / 2;
      if (f.kind === "river" && line) rivers.push({ pts: line, w: f.width || 1.8 });
      else if (area || (line && w2) || (Array.isArray(f.at) && f.r)) {
        const inF = (x, y) => area ? pip(x, y, area) : line ? lineDist(x, y, line) < w2 : Math.hypot(x - f.at[0], y - f.at[1]) < f.r;
        for (let n = 0; n < N; n++) {
          const i = n % cols, j = (n / cols) | 0, x = (i + .5) * cell, y = (j + .5) * cell; if (!inF(x, y)) continue;
          const t = nz(i / 6 + 40, j / 6);
          if (f.kind === "lake" || f.kind === "sea") { Hh[n] = f.kind === "lake" ? 112 : 70; continue; }
          if (sea[n]) continue;
          if (f.kind === "mountains") Hh[n] = Math.max(Hh[n], clamp(Math.round(204 + t * 50), 0, 255));
          else if (f.kind === "hills") Hh[n] = Math.max(Hh[n], clamp(Math.round(181 + t * 16), 0, 255));
          else if (f.kind === "forest") M[n] = 228;
          else if (f.kind === "swamp" || f.kind === "marsh") { M[n] = 250; Hh[n] = Math.min(Hh[n], 136); }
          else if (f.kind === "desert") M[n] = 18;
          // (any kind of land of atlas-world-biomes.js: a jungle, a glacier, a volcano...)
          if (KB[f.kind] && f.kind !== "natural") { if (KB[f.kind].water) Hh[n] = 112; Cv[n] = KB[f.kind].code; }
        }
      }
      if (f.name) {
        const at = Array.isArray(f.at) ? f.at : area ? [area.reduce((s, p) => s + p[0], 0) / area.length, area.reduce((s, p) => s + p[1], 0) / area.length] : line ? midOf(line) : null;
        const kind = { mountains: "range", hills: "range", forest: "forest", lake: "lake", sea: "sea", river: "river" }[f.kind] || "region";
        if (at) labels.push({ name: f.name, kind, at, angle: f.angle || 0, size: f.size });
      }
    }
    return { G: { cols, rows, cell, sea: 128, H: Hh, M, C: Cv }, rivers, labels, ok, how, share };
  }

  /* ---- routes: the way a route takes over the land (or the sea), worked out from the map so it follows the valleys
          and the coast; a route with via: [[x, y], ...] goes through those points instead */
  function pathGrid(WD) {
    const G = WD.G; if (!G) return null;
    const f = 2, nc = Math.ceil(G.cols / f), nr = Math.ceil(G.rows / f), S = sampler(G), H = new Float32Array(nc * nr), M = new Float32Array(nc * nr), R = new Uint8Array(nc * nr), size = G.cell * f;
    for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) { const x = (i + .5) * size, y = (j + .5) * size; H[j * nc + i] = S(x, y); M[j * nc + i] = G.M ? S(x, y, G.M) : 128; }
    for (const rv of WD.rivers) { const p = rv.pts || []; for (let n = 1; n < p.length; n++) { const steps = Math.ceil(Math.hypot(p[n][0] - p[n - 1][0], p[n][1] - p[n - 1][1]) / (size / 2)); for (let s = 0; s <= steps; s++) { const x = p[n - 1][0] + (p[n][0] - p[n - 1][0]) * s / steps, y = p[n - 1][1] + (p[n][1] - p[n - 1][1]) * s / steps, i = Math.floor(x / size), j = Math.floor(y / size); if (i >= 0 && j >= 0 && i < nc && j < nr) R[j * nc + i] = 1; } } }
    return { nc, nr, size, H, M, R, sea: G.sea };
  }
  function astar(P, cost, s, t) {
    const { nc, nr } = P, N = nc * nr, g = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const hp = [], hk = [], push = (n, k) => { hp.push(n); hk.push(k); let i = hp.length - 1; while (i) { const q = (i - 1) >> 1; if (hk[q] <= hk[i]) break; [hp[q], hp[i]] = [hp[i], hp[q]]; [hk[q], hk[i]] = [hk[i], hk[q]]; i = q; } };
    const pop = () => { const top = hp[0], ln = hp.pop(), lk = hk.pop(); if (hp.length) { hp[0] = ln; hk[0] = lk; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hp.length && hk[l] < hk[m]) m = l; if (r < hp.length && hk[r] < hk[m]) m = r; if (m === i) break; [hp[m], hp[i]] = [hp[i], hp[m]]; [hk[m], hk[i]] = [hk[i], hk[m]]; i = m; } } return top; };
    const tx = t % nc, ty = (t / nc) | 0, hdist = n => { const dx = Math.abs(n % nc - tx), dy = Math.abs(((n / nc) | 0) - ty); return Math.max(dx, dy) + .414 * Math.min(dx, dy); };
    g[s] = 0; push(s, hdist(s));
    for (let guard = 0; hp.length && guard < N * 3; guard++) {
      const n = pop(); if (done[n]) continue; done[n] = 1; if (n === t) break;
      const x = n % nc, y = (n / nc) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= nc || Y >= nr) continue;
        const m = Y * nc + X; if (done[m]) continue; const c = cost(m, m === t || m === s); if (c === Infinity) continue;
        const ng = g[n] + c * (dx && dy ? 1.414 : 1); if (ng < g[m]) { g[m] = ng; came[m] = n; push(m, ng + hdist(m)); }
      }
    }
    if (came[t] < 0 && s !== t) return null;
    const out = []; for (let n = t; n >= 0; n = came[n]) { out.push(n); if (n === s) break; }
    return out.reverse();
  }
  function wayOf(WD, P, r) {
    const a = WD.byId[r.from], b = WD.byId[r.to]; if (!a || !b) return null;
    const ends = [a.at, b.at];
    if (Array.isArray(r.via) && r.via.length) return chaikin([a.at, ...r.via.filter(v => Array.isArray(v)), b.at], 2, false);
    if (!P || !OVERLAND[r.kind] && r.kind !== "sea") {
      // over the void: a gentle curve, the same way every time
      const mx = (a.at[0] + b.at[0]) / 2, my = (a.at[1] + b.at[1]) / 2, dx = b.at[0] - a.at[0], dy = b.at[1] - a.at[1], bend = (strHash(r.id) - .5) * .25;
      return chaikin([a.at, [mx - dy * bend, my + dx * bend], b.at], 3, false);
    }
    const { nc, nr, size, H, M, R, sea } = P, cell = (x, y) => clamp(Math.floor(y / size), 0, nr - 1) * nc + clamp(Math.floor(x / size), 0, nc - 1);
    const land = n => H[n] > sea;
    let s = cell(...ends[0]), t = cell(...ends[1]), cost;
    if (r.kind === "sea") {
      // a ship leaves from the water nearest each end
      const wet = n0 => { if (!land(n0)) return n0; const x0 = n0 % nc, y0 = (n0 / nc) | 0; let best = -1, bd = 1e9; for (let y = y0 - 24; y <= y0 + 24; y++) for (let x = x0 - 24; x <= x0 + 24; x++) { if (x < 0 || y < 0 || x >= nc || y >= nr) continue; const n = y * nc + x; if (!land(n)) { const d = (x - x0) ** 2 + (y - y0) ** 2; if (d < bd) { bd = d; best = n; } } } return best; };
      const ws = wet(s), wt = wet(t); if (ws < 0 || wt < 0) return chaikin([a.at, b.at], 0, false);
      // the way to the water from an inland port (London to the Thames estuary) is drawn too
      const toWater = (n, end) => { const p = [(n % nc + .5) * size, (((n / nc) | 0) + .5) * size]; return Math.hypot(p[0] - end[0], p[1] - end[1]) > size * 1.5 ? [p] : []; };
      const path = astar(P, (n, end) => land(n) && !end ? Infinity : 1 + (land(n) ? 2 : 0) + (H[n] > sea - 18 ? .6 : 0), ws, wt);
      if (!path) return chaikin([a.at, b.at], 0, false);
      const pts = rdp(path.map(n => [(n % nc + .5) * size, (((n / nc) | 0) + .5) * size]), size * .7);
      return chaikin([a.at, ...toWater(ws, a.at), ...pts, ...toWater(wt, b.at), b.at], 2, false);
    }
    const pass = r.kind === "pass" || r.kind === "tunnel", river = r.kind === "river";
    cost = (n, end) => {
      if (!land(n)) return end ? 1 : Infinity;
      const tt = (H[n] - sea) / (255 - sea);
      let c = 1 + (tt > .62 ? (pass ? 1.4 : 7) : tt > .42 ? 1.1 : 0) + (r.kind === "road" && M[n] > 175 ? .5 : 0);
      if (river) c = R[n] ? .35 : c * 2.2;
      return c;
    };
    const path = astar(P, cost, s, t);
    if (!path) return chaikin([a.at, b.at], 0, false);
    const pts = rdp(path.map(n => [(n % nc + .5) * size, (((n / nc) | 0) + .5) * size]), size * .55);
    pts[0] = a.at; pts[pts.length - 1] = b.at;
    return chaikin(pts.length > 1 ? pts : [a.at, b.at], 2, false);
  }
  // how far, and how long: from the map's scale and the world's speeds only; a route that says days: N is taken at its word
  function travel(WD, r, way) {
    const out = { dist: null, days: null, basis: "" };
    if (WD.scale && way) out.dist = plen(way) * WD.scale.per;
    if (typeof r.days === "number" && r.days >= 0) { out.days = r.days; out.basis = "as the campaign gives it"; }
    else if (out.dist != null && WD.speeds && WD.speeds[r.kind] > 0) { out.days = out.dist / WD.speeds[r.kind]; out.basis = `at ${WD.speeds[r.kind]} ${plural(WD.scale.unit || "unit", WD.speeds[r.kind])} a day`; }
    return out;
  }
  // miles, leagues, light-years; but km, AU and million km as they are
  const plural = (u, n) => n >= 1.5 && /[a-z]{3,}$/.test(u) && !/s$/.test(u) ? u + "s" : u;
  const nice = n => { if (n >= 100) return String(Math.round(n / 10) * 10); if (n >= 10) return String(Math.round(n)); return String(Math.round(n * 10) / 10); };
  const daysText = d => d == null ? "" : d === 0 ? "at once" : d < .9 ? `about ${Math.max(1, Math.round(d * 24))} hours` : `about ${d < 3 ? Math.round(d * 2) / 2 : Math.round(d)} day${d >= 1.25 ? "s" : ""}`;
  const distText = (WD, d) => d == null ? "" : `about ${nice(d)} ${plural(WD.scale.unit || "unit", d)}`;

  /* ---- putting the world on the page. box: an empty element. ctx: what the page around it knows (see atlas-shell.js):
          mode(), placesAt(loc), peopleAt(loc, places), leadsInto(loc, places), hasCity(id), cityName(id), enter(cityId,
          locId), open(placeId), db (a promise of the page's database, or of null), store {get, set}, makeCity(loc) when
          the page can make a city itself (the Atlas app). Returns { wake(), select(id), sync(), search(q), dispose() }. */
  A.worldMount = function (box, ctx) {
    const uid = "w" + Math.floor(Math.random() * 1e6).toString(36);
    const OV = ovFrom([]);
    // a world made in the page (Make a new world): its recipe is kept among the referee's changes, the land itself made
    // from it in the background and kept in this browser; until it is ready, and without one, the campaign's own land
    const GEN = { key: null, T: null, busy: null, ver: 0 };
    const genKey = g => g ? JSON.stringify(g) : null;
    const terrainNow = () => OV.gen && GEN.T && GEN.key === genKey(OV.gen) ? GEN.T : A.worldTerrainData;
    let WD = prepareWorld(A.worldData, terrainNow(), OV);
    // the game master's own drawing, shown as drawn, or redrawn from its traced coasts (the choice is kept)
    const DRAW = WD.T.drawing && A.worldDrawingSrc ? { src: A.worldDrawingSrc, trace: null, mode: ctx.store.get("world-drawn") || "" } : null;
    const drawn = () => DRAW && (DRAW.mode === "drawn" || !DRAW.trace || WD.look === "stars");
    // (the traced land takes the game master's brush strokes too)
    const traced = () => { if (DRAW && DRAW.trace) { const g = DRAW.trace.G; WD.G = Object.assign({}, g, { H: Uint8Array.from(g.H), M: Uint8Array.from(g.M), C: g.C ? Uint8Array.from(g.C) : new Uint8Array(g.cols * g.rows) }); for (const s of WD.shape.strokes) stroke(WD.G, s); WD.rivers = [...DRAW.trace.rivers, ...WD.rivers]; WD.labels = [...DRAW.trace.labels, ...WD.labels]; } };
    let st = STYLE[WD.look] || STYLE.parchment; const gm = () => ctx.mode() === "gm";
    let [W, H] = WD.size;
    const filt = Object.assign({ kinds: {}, know: "all", only3d: false, routes: {} }, (() => { try { return JSON.parse(ctx.store.get("world-filter") || "{}"); } catch (e) { return {}; } })());
    // tool: loc, route (the places and their ways), brush (the land), river, realm, label; selFeat: a river, name or realm
    const S = { sel: null, selRoute: null, selFeat: null, hover: null, edit: false, tool: null, first: null, q: "", hits: null, journey: null, drag: null, note: "", brush: "land", size: 30, draft: null, cur: null, fdrag: null };
    const HIST = [], REDO = [];   // what the referee changed, to undo and do again (this visit to the page)
    const ways = new Map();      // route id -> its way, worked out once for where its ends stand
    let PG = null;               // the grid routes are found on
    box.innerHTML = `<div class="wm wm-${WD.look}">
      <div class="wm-bar">
        <span class="wm-title">${esc(WD.title || "The world")}</span>
        <select class="wm-look keeper" aria-label="How the map is drawn" title="How the map is drawn: the players see it the same way" hidden></select>
        <details class="wm-filt"><summary>Filters</summary><div class="wm-fbody"></div></details>
        <span class="wm-sp"></span>
        <span class="wm-editbar keeper"></span>
        ${DRAW ? `<button type="button" class="wm-btn" data-w="drawn" aria-pressed="false" title="Show the map as it was drawn, or redrawn in Atlas's look">Your drawing</button>` : ""}
        <button type="button" class="wm-btn" data-w="currents" aria-pressed="false" hidden title="The ocean's currents: warm and cold, the gyres, the equator and the lines of latitude">Ocean currents</button>
        <button type="button" class="wm-btn" data-w="coasts" aria-pressed="false" hidden title="What kind each coast is and why it formed there: fjords, rias, deltas, barrier islands, cliffs, reefs">Coasts</button>
        <button type="button" class="wm-btn keeper" data-w="edit" aria-pressed="false">Edit map</button>
      </div>
      <div class="wm-stage" tabindex="0" aria-label="World map. Arrow keys move the map, plus and minus zoom.">
        <svg class="wm-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(WD.title || "World map")}"><g class="wm-cam"><g class="wm-land"></g><g class="wm-cur"></g><g class="wm-coa"></g><g class="wm-routes"></g><g class="wm-jour"></g><g class="wm-fx"></g></g><g class="wm-over"></g><g class="wm-hdl"></g></svg>
        <div class="wm-grain"></div>
        <div class="wm-ctl" role="group" aria-label="Map controls"><button type="button" data-z="in" aria-label="Zoom in" title="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out" title="Zoom out">−</button><button type="button" data-z="home" aria-label="Whole world" title="Whole world">⌂</button><button type="button" data-z="full" aria-label="Full screen" title="Full screen">⤢</button></div>
        <div class="wm-scale" aria-hidden="true"></div>
        <div class="wm-tip" hidden></div>
        <div class="wm-results" hidden></div>
        <div class="wm-journey keeper" hidden></div>
        <aside class="wm-panel" hidden aria-live="polite"></aside>
        <div class="wm-note" hidden></div>
      </div>
      <div class="maphint wm-hint"></div>
      <dialog class="kedlg wm-dlg" aria-label="World map editor"></dialog>
    </div>`;
    const $ = s => box.querySelector(s), root = $(".wm"), stage = $(".wm-stage"), svg = $(".wm-svg"), cam = $(".wm-cam"), over = $(".wm-over"), panel = $(".wm-panel"), tip = $(".wm-tip"), dlg = $(".wm-dlg");
    const V = { k: 1, tx: 0, ty: 0, sw: 1, sh: 1, k0: 1 };
    let raf = 0, anim = null, gone = false, started = false;

    /* ---- the land, drawn once */
    function drawLand() {
      let s = `<rect width="${W}" height="${H}" fill="${WD.look === "stars" ? "#05070d" : WD.look === "holo" ? "#020d16" : WD.look === "atlas" ? "#c7deee" : "#d8cfb1"}"/>`;
      if (drawn()) { $(".wm-land").innerHTML = s + `<image href="${DRAW.src}" width="${W}" height="${H}" preserveAspectRatio="none"/><rect width="${W}" height="${H}" fill="none" stroke="${st.ink}" stroke-opacity=".55" stroke-width="2"/>`; return; }
      const G = WD.G;
      // the look's own art (atlas-world-art.js), with the region names over it
      if (A.worldArt) {
        try { s += A.worldArt.draw(WD, WD.look, uid, { seen: L => seen(L), palette: WD.W.palette || WD.T.palette, realms: WD.realms.filter(g => g.name && (gm() || !g.hidden)).map(g => ({ name: g.name, colour: realmCol(g) })) }); } catch (e) { console.warn("world map: the art could not be drawn", e); }
        s += realmsSVG();
        for (const L of WD.labels) if (L && L.name && Array.isArray(L.at)) {
          const water = /sea|ocean|lake|bay|gulf|strait|sound|river/.test(L.kind || ""), fs = (L.size || (L.kind === "river" ? 10 : water ? 20 : L.kind === "region" ? 24 : 15)) * 1.15;
          s += `<text class="wm-rl${water ? " w" : ""}" x="${r1(L.at[0])}" y="${r1(L.at[1])}" font-size="${fs}" text-anchor="middle"${L.angle ? ` transform="rotate(${r1(L.angle)} ${r1(L.at[0])} ${r1(L.at[1])})"` : ""}>${esc(L.name)}</text>`;
        }
        $(".wm-land").innerHTML = s; refine.at = null; clearTimeout(refine.t); refine.t = setTimeout(refine, 350); return;
      }
      if (G) {
        const img = paintTerrain(WD), pat = (id, src) => src ? `<pattern id="${uid}-${id}" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${src}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern>` : "";
        s += `<defs>${pat("s", img.sea)}${pat("l", img.land)}<clipPath id="${uid}-c"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#${uid}-c)">`;
        s += `<rect width="${W}" height="${H}" fill="url(#${uid}-s)"/>`;
        if (WD.look !== "stars") {
          const d = coastRings(G).map(r => pathD(chaikin(rdpRing(r, .7), 2, true), true)).join("");
          if (WD.look === "parchment") for (const [wd, op] of [[17, .22], [11, .3], [5.6, .42]]) s += `<path d="${d}" fill="none" stroke="${st.ink}" stroke-opacity="${op}" stroke-width="${wd}"/><path d="${d}" fill="none" stroke="url(#${uid}-s)" stroke-width="${wd - 2}"/>`;
          else s += `<path d="${d}" fill="none" stroke="#e3f0f8" stroke-opacity=".7" stroke-width="7"/>`;
          s += `<path d="${d}" fill="url(#${uid}-l)" fill-rule="evenodd" stroke="${WD.look === "atlas" ? "#6d93b3" : st.ink}" stroke-width="${WD.look === "atlas" ? .7 : 1.25}" stroke-linejoin="round"/>`;
          for (const rv of WD.rivers) if (rv.pts && rv.pts.length > 1) {
            const p = rv.pts, wd = rv.w || 1.2, n = p.length;
            // a river widens as it runs to the sea: drawn in three reaches
            for (let q = 0; q < 3; q++) { const a = Math.floor(q * (n - 1) / 3), b = Math.min(n - 1, Math.ceil((q + 1) * (n - 1) / 3)); if (b > a) s += `<path d="${pathD(p.slice(a, b + 1))}" fill="none" stroke="${st.river}" stroke-width="${r1(wd * (.55 + q * .3))}" stroke-linecap="round" stroke-linejoin="round"/>`; }
          }
          if (WD.look === "parchment") s += symbols(G);
        }
        s += `</g>`;
      }
      if (WD.look === "stars") s += starfield();
      s += realmsSVG();
      for (const L of WD.labels) if (L && L.name && Array.isArray(L.at)) {
        const water = /sea|ocean|lake|bay|gulf|strait|sound|river/.test(L.kind || ""), fs = (L.size || (L.kind === "river" ? 10 : water ? 20 : L.kind === "region" ? 24 : 15)) * 1.15;
        s += `<text class="wm-rl${water ? " w" : ""}" x="${r1(L.at[0])}" y="${r1(L.at[1])}" font-size="${fs}" text-anchor="middle"${L.angle ? ` transform="rotate(${r1(L.angle)} ${r1(L.at[0])} ${r1(L.at[1])})"` : ""}>${esc(L.name)}</text>`;
      }
      s += `<rect width="${W}" height="${H}" fill="none" stroke="${st.ink}" stroke-opacity=".55" stroke-width="2"/>`;
      $(".wm-land").innerHTML = s;
    }
    // the parchment's mountains, hills and woods, drawn as a cartographer would, nearest last
    function symbols(G) {
      const Sm = sampler(G), sea = G.sea, items = [], ink = st.ink;
      let trees = "";
      for (let y = 6, row = 0; y < H - 4; y += 9, row++) for (let x = 6 + (row % 2) * 6; x < W - 4; x += 12) {
        const jx = x + (hash(x, y, 1) - .5) * 6, jy = y + (hash(x, y, 2) - .5) * 5, hv = Sm(jx, jy); if (hv <= sea + 3) continue;
        const t = (hv - sea) / (255 - sea), mv = G.M ? Sm(jx, jy, G.M) : 128, r = hash(x, y, 3);
        if (t > .6) { if ((row % 2 && t < .75) || r < .22) continue; const w = 6 + (t - .6) * 14 + r * 2, h = w * 1.25; items.push([jy, `<path d="M${r1(jx - w)} ${r1(jy)}L${r1(jx - w * .08)} ${r1(jy - h)}L${r1(jx + w)} ${r1(jy)}Z" fill="${t > .88 ? "#f6f2e8" : "#eadcb6"}" stroke="none"/><path d="M${r1(jx - w * .08)} ${r1(jy - h)}L${r1(jx + w)} ${r1(jy)}L${r1(jx + w * .3)} ${r1(jy)}L${r1(jx + w * .02)} ${r1(jy - h * .55)}Z" fill="${ink}" fill-opacity=".28"/><path d="M${r1(jx - w)} ${r1(jy)}L${r1(jx - w * .08)} ${r1(jy - h)}L${r1(jx + w)} ${r1(jy)}" fill="none" stroke="${ink}" stroke-width="1" stroke-linejoin="round"/>`]); }
        else if (t > .42 && r < .3) { const w = 5 + r * 4; items.push([jy, `<path d="M${r1(jx - w)} ${r1(jy)}Q${r1(jx)} ${r1(jy - w * 1.2)} ${r1(jx + w)} ${r1(jy)}" fill="none" stroke="${ink}" stroke-width=".8"/>`]); }
        else if (mv > 150 && t > .02 && r < (mv - 150) / 105 * 1.6) { for (let q = 0; q < 2; q++) { const tx = jx + (q ? 3.2 : -2.4), ty = jy + (q ? 1.2 : 0), rr = 2.5 + hash(x, y, 5 + q) * .8; trees += `M${r1(tx + rr)} ${r1(ty - rr)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-2 * rr)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(2 * rr)} 0M${r1(tx)} ${r1(ty)}v${r1(rr * .9)}`; } }
      }
      items.sort((a, b) => a[0] - b[0]);
      return (trees ? `<path d="${trees}" fill="${st.tree}" stroke="${ink}" stroke-width=".55" stroke-opacity=".8"/>` : "") + items.map(i => i[1]).join("");
    }
    function starfield() {
      const n = Math.round(W * H / 900), seed = WD.stars && WD.stars.seed || 7; let s = "", big = "";
      for (let i = 0; i < n; i++) { const x = hash(i, 1, seed) * W, y = hash(i, 2, seed) * H, r = hash(i, 3, seed); if (r > .97) big += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.5"/>`; else s += `M${r1(x)} ${r1(y)}h.01`; }
      let grid = ""; for (let x = 100; x < W; x += 100) grid += `M${x} 0V${H}`; for (let y = 100; y < H; y += 100) grid += `M0 ${y}H${W}`;
      return `<path d="${s}" stroke="#dfe9ff" stroke-width="1.1" stroke-linecap="round" stroke-opacity=".75"/><g fill="#fff6dc">${big}</g><path d="${grid}" stroke="#5ad1e6" stroke-opacity=".09" stroke-width="1"/>`;
    }
    // the realms: kingdoms, provinces, territories, a tint inside a border, the name across them (a hidden one only for
    // the referee); the name is what is clicked
    const REALM_COLS = ["#8a2432", "#2f6b3a", "#2b5d8a", "#9a6a12", "#6b3a8a", "#2f7a7a", "#8a4b24", "#555f6b"];
    const realmCol = g => g.colour || (g.owner && A.lives && A.lives.fac(g.owner) ? A.lives.fac(g.owner).color : REALM_COLS[Math.floor(strHash(g.id) * REALM_COLS.length)]);
    function realmsSVG() {
      let s = "";
      const dark = WD.look === "stars" || WD.look === "holo";
      for (const g of WD.realms) {
        if (g.hidden && !gm()) continue;
        const col = realmCol(g), d = pathD(chaikin(g.pts, 1, true), true);
        let x0 = 1e9, x1 = -1e9; for (const p of g.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
        const fs = clamp((x1 - x0) / Math.max(6, (g.name || "").length + 2) * 1.5, 12, 34);
        s += `<g class="wm-realm${g.hidden ? " hid" : ""}"><path d="${d}" fill="${col}" fill-opacity="${dark ? .1 : .14}" stroke="none"/><path d="${d}" fill="none" stroke="${col}" stroke-opacity="${dark ? .9 : .7}" stroke-width="2.6" stroke-dasharray="10 4 2 4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
          + (g.name ? `<text class="wm-rl wm-rk" data-feat="${esc(g.id)}" x="${r1(g.mid[0])}" y="${r1(g.mid[1])}" font-size="${r1(fs)}" text-anchor="middle" style="fill:${col}">${esc(g.name)}${g.hidden ? " ·" : ""}</text>` : "") + `</g>`;
      }
      return s;
    }
    // what the editor draws over the map: the rivers, names and realm borders to pick up, a river or realm being drawn,
    // the brush; the handles of the chosen one stand over the camera at one size (drawHandles)
    const featOf = id => { for (const k of ["river", "label", "realm"]) { const f = (k === "river" ? WD.rivers : k === "label" ? WD.labels : WD.realms).find(x => x.id === id); if (f) return [k, f]; } return [null, null]; };
    function drawFx() {
      const fx = $(".wm-fx"); let s = "";
      if (S.edit && gm()) {
        const moving = S.fdrag && S.fdrag.f;
        for (const rv of WD.rivers) if (rv.id) { const p = moving && S.fdrag.id === rv.id ? moving.pts : rv.pts; s += `<path class="wf-hit${S.selFeat === rv.id ? " sel" : ""}" data-feat="${esc(rv.id)}" d="${pathD(p)}"/>`; }
        for (const g of WD.realms) { const p = moving && S.fdrag.id === g.id ? moving.pts : g.pts; s += `<path class="wf-hit wf-realm${S.selFeat === g.id ? " sel" : ""}" data-feat="${esc(g.id)}" d="${pathD(p, true)}"/>`; }
        for (const L of WD.labels) if (L.id) {
          const at = moving && S.fdrag.id === L.id ? moving.at : L.at, fs = (L.size || 18) * 1.15, w = L.name.length * fs * .9 + fs;
          s += `<rect class="wf-hit wf-lab${S.selFeat === L.id ? " sel" : ""}" data-feat="${esc(L.id)}" x="${r1(at[0] - w / 2)}" y="${r1(at[1] - fs)}" width="${r1(w)}" height="${r1(fs * 1.3)}"${L.angle ? ` transform="rotate(${r1(L.angle)} ${r1(at[0])} ${r1(at[1])})"` : ""}/>`;
        }
        if (S.draft && S.draft.pts.length) { const p = S.cur ? [...S.draft.pts, S.cur] : S.draft.pts; s += `<path class="wf-draft${S.draft.type === "realm" ? " realm" : ""}" d="${pathD(p, S.draft.type === "realm" && p.length > 2)}"/>`; }
        if (S.tool === "brush" && S.cur) s += `<circle class="wf-brush" cx="${r1(S.cur[0])}" cy="${r1(S.cur[1])}" r="${S.size}"/>`;
        if (S.stroke && S.stroke.p.length) s += `<path class="wf-stroke m-${S.stroke.m}" d="${pathD(S.stroke.p.length > 1 ? S.stroke.p : [S.stroke.p[0], [S.stroke.p[0][0] + .1, S.stroke.p[0][1]]])}" stroke-width="${S.size * 2}"/>`;
      }
      fx.innerHTML = s;
      drawHandles();
    }
    function drawHandles() {
      const hd = $(".wm-hdl"); let s = "";
      if (S.edit && gm() && S.selFeat && !S.tool) {
        const [k, f] = featOf(S.selFeat), m = S.fdrag && S.fdrag.f && S.fdrag.id === S.selFeat ? S.fdrag.f : f;
        if (m && (k === "river" || k === "realm")) m.pts.forEach((p, i) => { s += `<circle class="wf-vx" data-vx="${i}" r="6" cx="${r1(p[0] * V.k + V.tx)}" cy="${r1(p[1] * V.k + V.ty)}"/>`; });
      }
      if (S.draft) S.draft.pts.forEach((p, i) => { s += `<circle class="wf-vx dr${i === 0 && S.draft.type === "realm" && S.draft.pts.length > 2 ? " close" : ""}" data-dv="${i}" r="${i === 0 ? 7 : 4.5}" cx="${r1(p[0] * V.k + V.tx)}" cy="${r1(p[1] * V.k + V.ty)}"/>`; });
      hd.innerHTML = s;
    }

    /* ---- what the viewer may see */
    const seen = L => gm() || L.state !== "unknown";
    const routeSeen = r => gm() || (!r.hidden && seen(WD.byId[r.from]) && seen(WD.byId[r.to]));
    const kindsHere = () => [...new Set(WD.locs.filter(seen).map(l => l.kind))].sort((a, b) => impOf({ kind: a }) - impOf({ kind: b }) || a.localeCompare(b));
    const routeKindsHere = () => [...new Set(WD.routes.filter(routeSeen).map(r => r.kind))];
    function passes(L) {
      if (!seen(L)) return false;
      if (filt.kinds[L.kind] === false) return false;
      if (filt.only3d && !(L.city && ctx.hasCity(L.city))) return false;
      if (filt.know === "known" && !["known", "visited", "done"].includes(L.state)) return false;
      if (filt.know === "visited" && !["visited", "done"].includes(L.state)) return false;
      if (filt.know === "new" && ["visited", "done"].includes(L.state)) return false;
      return true;
    }
    const routeShown = r => routeSeen(r) && filt.routes[r.kind] !== false && passes(WD.byId[r.from]) && passes(WD.byId[r.to]);
    function wayFor(r) {
      const a = WD.byId[r.from], b = WD.byId[r.to], k = [r.kind, a.at, b.at, JSON.stringify(r.via || "")].join("|"), c = ways.get(r.id);
      if (c && c.k === k) return c.way;
      if (!PG && WD.G) PG = pathGrid(WD);
      const way = wayOf(WD, PG, r) || [a.at, b.at]; ways.set(r.id, { k, way }); return way;
    }

    /* ---- the routes, under the camera (their lines keep one width on the screen at any zoom) */
    /* ---- the ocean's currents, a layer the viewer turns on and off (28 Oct 2026, the user's request: warm currents in red
            or orange, cold in blue, arrows the way the water runs, the gyres, the equator and the lines of latitude,
            names and strengths if wanted; world-ocean.js works them out) */
    const CUR = { on: (() => { try { return ctx.store.get("world-currents") === "1"; } catch (e) { return false; } })(), names: (() => { try { return ctx.store.get("world-curnames") !== "0"; } catch (e) { return true; } })() };
    function along(p, t) { let s = 0; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (s + l >= t) { const q = (t - s) / (l || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * q, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * q, Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0]) * 180 / Math.PI]; } s += l; } const a = p[p.length - 2], b = p[p.length - 1]; return [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI]; }
    function drawCurrents() {
      const g = $(".wm-cur"), C = WD.T && WD.T.currents, btn = $('[data-w="currents"]');
      if (btn) { btn.hidden = !C; btn.setAttribute("aria-pressed", !!(C && CUR.on)); }
      if (!g) return; if (!C || !CUR.on) { g.innerHTML = ""; return; }
      // (arrows, names and rings keep their size on the screen: k is a screen pixel in the map's units, drawn again as the
      // map is brought closer or further)
      CUR.k = V.k || 1; const [la, lb] = C.lat, yOf = f => (la - f) / (la - lb) * H, k = 1 / CUR.k, word = v => v >= 1.3 ? "strong" : v >= .8 ? "moderate" : "gentle";
      let s = "";
      // the lines of latitude: every thirty degrees, the equator, the tropics and the polar circles
      const LINES = [[0, "The equator", "eq"], [23.44, "The northern tropic", "tr"], [-23.44, "The southern tropic", "tr"], [66.56, "The northern polar circle", "pc"], [-66.56, "The southern polar circle", "pc"], [30, "30° north", ""], [60, "60° north", ""], [-30, "30° south", ""], [-60, "60° south", ""]];
      for (const [f, nm, kind] of LINES) { if (f > Math.max(la, lb) || f < Math.min(la, lb)) continue; const y = yOf(f); s += `<line x1="0" x2="${W}" y1="${r1(y)}" y2="${r1(y)}" class="wc-lat ${kind}"/><text x="${r1(10 * k)}" y="${r1(y - 4 * k)}" class="wc-latl" style="font-size:${r1(11 * k)}px">${esc(nm)}</text>`; }
      // the streams: warm red, cold blue, wider the stronger, arrows the way the water runs
      let heads = "", names = "";
      for (const st of C.streams || []) {
        if (!st.pts || st.pts.length < 2) continue;
        const p = chaikin(st.pts, 2, false), wd = r1(.9 + Math.min(1.8, st.s * 1.1)), L = plen(p);
        s += `<path d="${pathD(p)}" class="wc-s ${st.warm ? "w" : "c"}" style="stroke-width:${wd}px"><title>${esc((st.name ? st.name + ": " : "") + (st.warm ? "a warm current" : "a cold current") + ", " + word(st.s))}</title></path>`;
        for (let t = 26 * k; t < L - 8 * k; t += 64 * k) { const [x, y, a] = along(p, t); heads += `<path d="M${r1(-4 * k)} ${r1(-3.2 * k)}L${r1(4.4 * k)} 0L${r1(-4 * k)} ${r1(3.2 * k)}Z" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(a)})" class="wc-a ${st.warm ? "w" : "c"}"/>`; }
        if (CUR.names && st.name) { const [x, y] = along(p, L / 2); names += `<text x="${r1(x)}" y="${r1(y - 6 * k)}" class="wc-n ${st.warm ? "w" : "c"}" style="font-size:${r1(10.5 * k)}px" text-anchor="middle">${esc(st.name)} · ${word(st.s)}</text>`; }
      }
      // the gyres: a ring about each, turning the way it turns
      for (const gy of C.gyres || []) {
        const R0 = Math.max(34 * k, Math.min(W, H) * .035), [cx, cy] = gy.at, dir = gy.cw ? 1 : -1, a0 = -60 * Math.PI / 180, a1 = a0 + dir * 290 * Math.PI / 180;
        const P0 = [cx + R0 * Math.cos(a0), cy + R0 * Math.sin(a0)], P1 = [cx + R0 * Math.cos(a1), cy + R0 * Math.sin(a1)], tang = (a1 + dir * Math.PI / 2) * 180 / Math.PI;
        s += `<path d="M${r1(P0[0])} ${r1(P0[1])}A${r1(R0)} ${r1(R0)} 0 1 ${gy.cw ? 1 : 0} ${r1(P1[0])} ${r1(P1[1])}" class="wc-g"/><path d="M${r1(-4.5 * k)} ${r1(-3.5 * k)}L${r1(4.5 * k)} 0L${r1(-4.5 * k)} ${r1(3.5 * k)}Z" transform="translate(${r1(P1[0])} ${r1(P1[1])}) rotate(${r1(tang)})" class="wc-ga"/>`;
        if (CUR.names) names += `<text x="${r1(cx)}" y="${r1(cy + 4 * k)}" class="wc-gn" style="font-size:${r1(11 * k)}px" text-anchor="middle">${esc(gy.name || "A gyre")}</text>`;
      }
      g.innerHTML = s + heads + names;
    }
    /* ---- the coasts' kinds, a layer the viewer turns on and off (28 Oct 2026, the user's request: "a diagnostic view
            showing why different coastline types formed where they did"): each stretch of coast in its kind's colour, a
            key, and a numbered pin at each stretch world-shore.js explained, the reason shown on pointing at it */
    const COA = { on: (() => { try { return ctx.store.get("world-coasts") === "1"; } catch (e) { return false; } })() };
    function coastLines() {
      const G = WD.G, T = WD.T, form = T._formU8 || (T._formU8 = unb64(T.coastForm)), { cols, rows, cell } = G; if (!form || form.length !== cols * rows) return "";
      // (the kind at a point of the coastline: the nearest coast cell that has one)
      const kindAt = (x, y) => { const i0 = Math.floor(x / cell), j0 = Math.floor(y / cell); let best = 0, bd = 9; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i0 + di, b = j0 + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const f = form[b * cols + a]; if (!f) continue; const d = Math.hypot((a + .5) * cell - x, (b + .5) * cell - y); if (d < bd) { bd = d; best = f; } } return best; };
      const by = {};
      for (const r0 of coastRings(G)) {
        if (r0.length < 6) continue; const ring = chaikin(rdpRing(r0, .6), 2, true), n = ring.length; let cur = null, pts = [];
        const flush = () => { if (cur && pts.length > 1) by[cur] = (by[cur] || "") + pathD(pts); pts = []; };
        for (let i = 0; i <= n; i++) { const p = ring[i % n], f = kindAt(p[0], p[1]); if (f !== cur) { if (cur && f) pts.push(p); flush(); cur = f; } if (f) pts.push(p); }
        flush();
      }
      return Object.entries(by).map(([f, d]) => T.coastKinds[f] ? `<path d="${d}" class="wco-l" style="stroke:${T.coastKinds[f][1]}"><title>${esc(T.coastKinds[f][0])}</title></path>` : "").join("");
    }
    function drawCoasts() {
      const g = $(".wm-coa"), T = WD.T, btn = $('[data-w="coasts"]'), has = !!(T && T.coastForm && T.coastKinds && WD.G);
      if (btn) { btn.hidden = !has; btn.setAttribute("aria-pressed", !!(has && COA.on)); }
      if (!g) return; if (!has || !COA.on) { g.innerHTML = ""; return; }
      if (COA.G !== WD.G) { COA.G = WD.G; COA.lines = coastLines(); }
      COA.k = V.k || 1; const k = 1 / COA.k;
      let pins = "";
      (T.coastNotes || []).forEach((nt, i) => { const kd = nt.form && T.coastKinds[nt.form]; if (!kd || !Array.isArray(nt.at)) return; pins += `<g class="wco-pin" transform="translate(${r1(nt.at[0])} ${r1(nt.at[1])}) scale(${r1(k * 100) / 100})" tabindex="0"><circle r="8" style="fill:${kd[1]}"/><text y="3.6" text-anchor="middle">${i + 1}</text><title>${esc(nt.text)}</title></g>`; });
      g.innerHTML = COA.lines + pins;
    }
    function drawRoutes() {
      let s = "";
      for (const r of WD.routes) {
        if (!routeShown(r)) continue;
        const way = wayFor(r), d = pathD(way), [col, wd, dash] = st.routes[r.kind] || st.routes.road, sel = S.selRoute === r.id;
        const blocked = !!r.blocked, hid = r.hidden ? " hid" : "";
        s += `<g class="wr${sel ? " sel" : ""}${hid}" data-route="${esc(r.id)}">${sel ? `<path d="${d}" class="wr-under"/>` : ""}${WD.look === "stars" ? `<path d="${d}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${wd + 5}" vector-effect="non-scaling-stroke"/>` : WD.look === "atlas" && r.kind === "road" ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="${wd + 2.2}" vector-effect="non-scaling-stroke"/>` : ""}<path d="${d}" fill="none" stroke="${blocked ? "#b3261e" : col}" stroke-width="${wd}" stroke-dasharray="${dash}" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="${d}" class="wr-hit"/></g>`;
      }
      $(".wm-routes").innerHTML = s;
      drawJourney();
    }
    // the party's journey: where it has been (a solid line) and where it is going (a moving dashed line)
    function legWay(a, b) {
      const r = WD.routes.find(x => (x.from === a && x.to === b) || (x.from === b && x.to === a));
      if (!r) return [WD.byId[a].at, WD.byId[b].at];
      const w = wayFor(r); return r.from === a ? w : w.slice().reverse();
    }
    function drawJourney() {
      const P = WD.party, el = $(".wm-jour"); let s = "";
      if (P.at) {
        const been = [...P.trail, P.at], ahead = [P.at, ...P.plan];
        for (let i = 1; i < been.length; i++) s += `<path d="${pathD(legWay(been[i - 1], been[i]))}" class="wj-been"/>`;
        for (let i = 1; i < ahead.length; i++) s += `<path d="${pathD(legWay(ahead[i - 1], ahead[i]))}" class="wj-plan"/>`;
      }
      if (S.journey && S.journey.legs) for (const [a, b] of S.journey.legs) s += `<path d="${pathD(legWay(a, b))}" class="wj-try"/>`;
      el.innerHTML = s;
      const J = $(".wm-journey");
      if (P.at && P.plan.length && gm()) {
        const legs = [P.at, ...P.plan], next = WD.byId[P.plan[0]];
        J.hidden = false;
        J.innerHTML = `<span class="kl">The party's journey</span><span>${legs.map(id => esc(WD.byId[id].name)).join(" → ")}</span><span class="wm-jb"><button type="button" data-w="arrive">Arrived at ${esc(next.name)}</button><button type="button" data-w="cancel">Call it off</button></span>`;
      } else J.hidden = true;
    }

    /* ---- the locations, over the camera: they keep their size on the screen, and the lesser ones are named only
            as the map comes closer */
    function drawMarkers() {
      let s = "";
      for (const L of WD.locs) {
        if (!passes(L)) continue;
        const imp = impOf(L), here = WD.party.at === L.id, has3d = L.city && ctx.hasCity(L.city);
        const cls = ["wl", "i" + imp, L.state === "rumoured" ? "rum" : "", L.state === "unknown" ? "unk" : "", L.state === "done" ? "dn" : "", S.sel === L.id ? "sel" : "", here ? "here" : "", S.hits ? (S.hits.has(L.id) ? "hit" : "dim") : "", L.unplaced ? "unp" : ""].filter(Boolean).join(" ");
        s += `<g class="${cls}" data-loc="${esc(L.id)}" tabindex="0" role="button" aria-label="${esc(L.name)}, ${esc((KINDS[L.kind] || [0, L.kind])[1])}${has3d ? ", has a 3D map" : ""}"><circle class="wl-ring" r="14"/><g class="wi">${iconOf(WD.look, L)}</g>${has3d ? `<g class="wl-3d" transform="translate(${imp === 1 ? 10 : 8} -17)"><rect width="15" height="10" rx="2"/><text x="7.5" y="7.6">3D</text></g>` : ""}${gm() && L.state !== "known" ? `<circle class="wl-st st-${esc(L.state)}" cx="-10" cy="-9" r="3"/>` : ""}${here ? `<g class="wl-party" transform="translate(-13 -9)"><path d="M0 10V-8"/><path d="M0-8h9l-2.5 3.5L9-1H0Z"/></g>` : ""}<text class="wl-t" x="${imp === 1 ? 14 : 12}" y="4.5">${esc(L.name)}${L.state === "rumoured" ? "?" : ""}</text></g>`;
      }
      for (const r of WD.routes) if (routeShown(r) && (r.blocked || r.danger)) s += `<g class="wr-warn${r.blocked ? " blk" : ""}" data-route="${esc(r.id)}"><circle r="7.5"/><text y="4">${r.blocked ? "✕" : "!"}</text></g>`;
      over.innerHTML = s;
      place();
    }
    // where each marker stands on the screen, which are named, and the scale bar
    function place() {
      const k = V.k, z = k / V.k0, boxes = [], crowd = over.querySelectorAll(".wl").length;
      // how close the map is: finer things are drawn as it comes closer (classes lod1, lod2 of the art)
      const zl = z < 1.5 ? "0" : z < 2.8 ? "1" : "2"; if (root.dataset.z !== zl) root.dataset.z = zl;
      const items = [];
      for (const g of over.querySelectorAll(".wl")) {
        const L = WD.byId[g.dataset.loc]; if (!L) continue;
        const x = L.at[0] * k + V.tx, y = L.at[1] * k + V.ty, imp = impOf(L), sc = imp === 1 ? 1.12 : imp === 2 ? 1 : z < 1.4 ? .78 : .92;
        g.setAttribute("transform", `translate(${r1(x)} ${r1(y)})`);
        const wi = g.firstElementChild.nextElementSibling; if (wi && wi.dataset.sc !== String(sc)) { wi.dataset.sc = sc; wi.setAttribute("transform", `scale(${sc})`); }
        const t = g.querySelector(".wl-t"), pri = (S.sel === L.id || S.hover === L.id ? 0 : WD.party.at === L.id ? .5 : (S.hits && S.hits.has(L.id)) ? .7 : imp) + (L.state === "rumoured" ? .3 : 0);
        // every name shows on a small world; on a crowded one the lesser places are named as the map comes closer
        const want = pri < 1 || imp === 1 || (imp === 2 && (z > .95 || crowd < 40)) || (imp === 3 && (z > 1.9 || crowd < 26));
        items.push({ t, x, y, pri, want, w: (L.name.length + 1) * (imp === 1 ? 8.6 : 7.2) * sc, sc });
      }
      items.sort((a, b) => a.pri - b.pri);
      for (const it of items) {
        let on = it.want;
        if (on) { const b = [it.x + 10 * it.sc, it.y - 9, it.w, 17]; if (it.pri >= 1 && boxes.some(o => b[0] < o[0] + o[2] && o[0] < b[0] + b[2] && b[1] < o[1] + o[3] && o[1] < b[1] + b[3])) on = false; else boxes.push(b); }
        it.t.style.display = on ? "" : "none";
      }
      for (const g of over.querySelectorAll(".wr-warn")) {
        const r = WD.rById[g.dataset.route]; if (!r) continue; const m = midOf(wayFor(r));
        g.setAttribute("transform", `translate(${r1(m[0] * k + V.tx)} ${r1(m[1] * k + V.ty)})`);
      }
      cam.setAttribute("transform", `matrix(${k} 0 0 ${k} ${r1(V.tx)} ${r1(V.ty)})`);
      if (CUR.on && CUR.k && (k / CUR.k > 1.3 || k / CUR.k < .77)) drawCurrents();
      if (COA.on && COA.k && (k / COA.k > 1.3 || k / COA.k < .77)) drawCoasts();
      if (S.draft || (S.edit && S.selFeat) || $(".wm-hdl").firstChild) drawHandles();
      for (const t of cam.querySelectorAll(".wm-rl")) t.style.opacity = z > 5 ? 0 : z > 3 ? (5 - z) / 2 : 1;
      const sc = $(".wm-scale");
      if (WD.scale) {
        const per = WD.scale.per / k, want = 110 * per, p10 = Math.pow(10, Math.floor(Math.log10(want))), step = [1, 2, 5, 10].map(m => m * p10).filter(v => v <= want).pop() || p10, px = step / per;
        sc.hidden = false; sc.innerHTML = `<span style="width:${Math.round(px)}px"></span>${nice(step)} ${esc(plural(WD.scale.unit || "unit", step))}`;
      } else sc.hidden = true;
      clearTimeout(refine.t); refine.t = setTimeout(refine, 350); refine.gen = (refine.gen || 0) + 1;
      clearTimeout(place.t); place.t = setTimeout(() => { try { ctx.store.set("world-view", JSON.stringify({ cx: (V.sw / 2 - V.tx) / V.k, cy: (V.sh / 2 - V.ty) / V.k, z: V.k / V.k0 })); } catch (e) {} }, 400);
    }
    const frame = () => { raf = 0; if (gone) return; if (anim) { const t = Math.min(1, (performance.now() - anim.t0) / anim.ms), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; V.k = Math.exp(Math.log(anim.k0) + (Math.log(anim.k1) - Math.log(anim.k0)) * e); const cx = anim.c0[0] + (anim.c1[0] - anim.c0[0]) * e, cy = anim.c0[1] + (anim.c1[1] - anim.c0[1]) * e; V.tx = V.sw / 2 - cx * V.k; V.ty = V.sh / 2 - cy * V.k; if (t < 1) request(); else anim = null; } place(); };
    const request = () => { if (!raf && !gone) raf = requestAnimationFrame(frame); };
    // the sharper land where the map is zoomed in (the shaded reliefs): once the camera rests, the window in view is
    // drawn again as fine as the screen shows it and laid over the land, so a continent of a whole planet holds its
    // valleys and streams up close; zoomed back out, the whole map's own picture is enough
    function refine() {
      const slot = cam.querySelector(".wm-detail"); if (!slot || !A.worldArt || !A.worldArt.detail || gone || anim) return;
      const base = A.worldArt.detailBase(WD, WD.look); if (!base || V.k < base * 1.4) { slot.innerHTML = ""; refine.at = null; return; }
      const k = Math.min(2.5, V.k), pad = .15, vx = -V.tx / V.k, vy = -V.ty / V.k, vw = V.sw / V.k, vh = V.sh / V.k;
      const x0 = Math.max(0, vx - vw * pad), y0 = Math.max(0, vy - vh * pad), x1 = Math.min(W, vx + vw * (1 + pad)), y1 = Math.min(H, vy + vh * (1 + pad));
      if (x1 <= x0 || y1 <= y0) return;
      const at = refine.at; if (at && at.k >= k * .85 && at.k <= k * 1.6 && vx >= at.r[0] && vy >= at.r[1] && vx + vw <= at.r[0] + at.r[2] && vy + vh <= at.r[1] + at.r[3]) return;
      // (drawn in small tiles from the middle of the view outward, the page free between them; moving the map again
      // stops the drawing, and what was drawn stays until a new set is whole. Each tile is drawn with a margin and
      // cropped, so the light and the valleys run on across the joins)
      const gen = refine.gen = (refine.gen || 0) + 1, tu = 256 / k, m = 16 / k, tiles = [], layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      for (let ty = y0; ty < y1; ty += tu) for (let tx = x0; tx < x1; tx += tu) tiles.push([tx, ty, Math.min(tu, x1 - tx), Math.min(tu, y1 - ty)]);
      const cx = vx + vw / 2, cy = vy + vh / 2; tiles.sort((a, b) => Math.hypot(a[0] + a[2] / 2 - cx, a[1] + a[3] / 2 - cy) - Math.hypot(b[0] + b[2] / 2 - cx, b[1] + b[3] / 2 - cy));
      slot.appendChild(layer); let q = 0;
      const step = () => {
        if (gone || refine.gen !== gen) return;
        if (q >= tiles.length) { for (const old of [...slot.children]) if (old !== layer) old.remove(); refine.at = { k, r: [x0, y0, x1 - x0, y1 - y0] }; return; }
        const [tx, ty, tw, th] = tiles[q++], R = [Math.max(0, tx - m), Math.max(0, ty - m)]; R.push(Math.min(W, tx + tw + m) - R[0], Math.min(H, ty + th + m) - R[1]);
        let href = null; try { href = A.worldArt.detail(WD, WD.look, R, k); } catch (e) { console.warn("world map: the closer picture could not be drawn", e); return; }
        if (href) layer.insertAdjacentHTML("beforeend", `<svg x="${r1(tx)}" y="${r1(ty)}" width="${r1(tw)}" height="${r1(th)}" viewBox="${r1(tx)} ${r1(ty)} ${r1(tw)} ${r1(th)}" preserveAspectRatio="none" overflow="hidden"><image href="${href}" x="${R[0]}" y="${R[1]}" width="${R[2]}" height="${R[3]}" preserveAspectRatio="none"/></svg>`);
        setTimeout(step, 0);
      };
      setTimeout(step, 0);
    }

    /* ---- the camera */
    function size() {
      const r = stage.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return false;
      const cx = (V.sw / 2 - V.tx) / V.k, cy = (V.sh / 2 - V.ty) / V.k, had = V.sw > 1;
      V.sw = r.width; V.sh = r.height; V.k0 = Math.min(V.sw / W, V.sh / H) * .96;
      svg.setAttribute("viewBox", `0 0 ${V.sw} ${V.sh}`);
      if (had) { V.tx = V.sw / 2 - cx * V.k; V.ty = V.sh / 2 - cy * V.k; }
      return true;
    }
    function bound() {
      V.k = clamp(V.k, V.k0 * .6, V.k0 * 16);
      const m = Math.min(V.sw, V.sh) * .3, w = W * V.k, h = H * V.k;
      V.tx = clamp(V.tx, m - w, V.sw - m); V.ty = clamp(V.ty, m - h, V.sh - m);
    }
    function home(now) { const k = V.k0; fly([W / 2, H / 2], k, now); }
    function fly(c, k, now) {
      k = clamp(k, V.k0 * .6, V.k0 * 16);
      if (now) { anim = null; V.k = k; V.tx = V.sw / 2 - c[0] * k; V.ty = V.sh / 2 - c[1] * k; bound(); request(); return; }
      anim = { t0: performance.now(), ms: 520, k0: V.k, k1: k, c0: [(V.sw / 2 - V.tx) / V.k, (V.sh / 2 - V.ty) / V.k], c1: c }; request();
    }
    function zoomAt(f, sx, sy) { anim = null; const wx = (sx - V.tx) / V.k, wy = (sy - V.ty) / V.k; V.k = clamp(V.k * f, V.k0 * .6, V.k0 * 16); V.tx = sx - wx * V.k; V.ty = sy - wy * V.k; bound(); request(); }

    /* ---- the panel: a location, a route, or the way to somewhere */
    function placesOf(L) { try { return ctx.placesAt ? ctx.placesAt(L) : []; } catch (e) { return []; } }
    function routeRow(r, fromId) {
      const other = WD.byId[r.from === fromId ? r.to : r.from], tv = travel(WD, r, wayFor(r));
      const facts = [ROUTES[r.kind] || r.kind, distText(WD, tv.dist), daysText(tv.days)].filter(Boolean).join(" · ");
      return `<li><button type="button" class="wm-rt" data-wroute="${esc(r.id)}"><span class="wm-rn">${esc(r.name ? r.name + " to " : "To ")}${esc(other.name)}</span><span class="wm-rf">${esc(facts)}${r.hidden ? " · hidden from the players" : ""}</span>${r.blocked ? `<span class="wm-bad">Blocked: ${esc(r.blocked === true ? "the way is shut" : r.blocked)}</span>` : ""}${r.danger ? `<span class="wm-dgr">Danger: ${esc(r.danger === true ? "a dangerous way" : r.danger)}</span>` : ""}</button></li>`;
    }
    function locPanel(L) {
      const places = placesOf(L), keeper = gm(), has3d = L.city && ctx.hasCity(L.city), settled = SETTLED.includes(L.kind);
      const people = keeper && ctx.peopleAt ? ctx.peopleAt(L, places) : [], leads = keeper && ctx.leadsInto ? ctx.leadsInto(L, places) : [];
      const routes = WD.routes.filter(r => (r.from === L.id || r.to === L.id) && routeSeen(r) && seen(WD.byId[r.from === L.id ? r.to : r.from]));
      const P = WD.party, here = P.at === L.id, acts = [...new Set(places.flatMap(p => p.acts || []))].sort((a, b) => a - b);
      const stName = (STATES.find(s => s[0] === L.state) || [0, L.state])[1], realm = realmAt(WD, L.at);
      let enter = "";
      if (has3d) enter = `<button type="button" class="prim wm-enter" data-w="enter">Enter ${esc(L.name)} · 3D map</button>`;
      else if (keeper && (settled || L.city)) {
        const flag = WD.look === "stars" ? `--kind ${/station|ship/.test(L.kind) ? "station" : "moonbase"}` : WD.look === "atlas" ? "--era modern" : (A.cityData && A.cityData.look === "fantasy") || (A.config && /fantas/i.test(String(A.config.setting || ""))) ? "--era fantasy" : "--era medieval";
        const cid = L.city || L.id, cmd = `node atlas.js city <campaign folder> --invent "${L.name}" --id ${cid} ${flag}`;
        enter = `<div class="wm-no3d"><p><strong>No 3D map of ${esc(L.name)} yet.</strong></p>${ctx.makeCity ? `<button type="button" class="prim" data-w="make">Make its 3D map now</button><p class="kn">It takes a few seconds; the page then opens on it. Its streets and landmarks are generated for its age and site, and can be changed afterwards.</p>` : `<p class="kn">Ask Claude to make it: “make the 3D map of ${esc(L.name)} for the world map”.</p><details class="wm-how"><summary>The command, for Claude Code</summary><code class="wm-cmd">${esc(cmd)}</code></details>`}</div>`;
      } else if (L.city && !has3d) enter = `<p class="kn">This place has no map to enter.</p>`;
      const ev = keeper ? (L.events || []).filter(e => e && (e.t || e.d)) : [];
      return `<button type="button" class="wm-x" data-w="close" aria-label="Close">×</button>
        <div class="eyebrow"><span>${esc((KINDS[L.kind] || [0, L.kind])[1])}</span>${L.region ? `<span>${esc(L.region)}</span>` : ""}${realm && (keeper || !realm.hidden) && realm.name !== L.region ? `<button type="button" class="wm-rlink" data-wfeat="${esc(realm.id)}">${esc(realm.name || "A realm")}</button>` : ""}${here ? `<span class="wm-here">The party is here</span>` : ""}</div>
        <h3>${esc(L.name)}</h3>
        ${L.owner && keeper ? `<p class="kn">Held by ${esc(facName(L.owner))}</p>` : ""}
        ${keeper ? `<div class="wm-stseg" role="group" aria-label="What the party knows">${STATES.map(([v, l]) => `<button type="button" data-wstate="${v}" aria-pressed="${L.state === v}" title="${esc(l)}"><span class="sd st-w-${v}"></span>${esc(l.split(" ")[0])}</button>`).join("")}</div>` : L.state !== "known" ? `<p class="kn">${esc(stName)}</p>` : ""}
        ${acts.length ? `<div class="meta">${acts.map(a => `<span class="tag">Act ${a}</span>`).join("")}</div>` : ""}
        ${L.desc ? `<p class="wm-desc">${esc(L.desc)}</p>` : ""}
        ${keeper && L.gm ? `<div class="sec secret"><p>${esc(L.gm)}</p></div>` : ""}
        ${L.unplaced && keeper ? `<p class="warn">This place has no position on the map yet: it waits at the foot of the map. Drag it where it belongs (Edit map).</p>` : ""}
        ${enter}
        ${places.length ? `<h4>Places here</h4><ul class="wm-pl">${places.map(p => `<li><button type="button" data-wopen="${esc(p.id)}">${p.st ? `<span class="sd st-${esc(p.st)}"></span>` : ""}<span class="n">${String(p.n).padStart(2, "0")}</span>${esc(p.name)}</button></li>`).join("")}</ul>` : ""}
        ${people.length ? `<h4 class="keeper">People met here</h4><ul class="wm-pp keeper">${people.slice(0, 40).map(p => `<li>${p.pid ? `<button type="button" data-wopen="${esc(p.pid)}">${esc(p.name)}</button>` : esc(p.name)}${p.role ? `<span class="kn"> — ${esc(p.role)}</span>` : ""}</li>`).join("")}</ul>` : ""}
        ${leads.length ? `<h4 class="keeper">What leads here</h4><ul class="wm-ld keeper">${leads.slice(0, 30).map(l => `<li><span class="kn">From</span> <button type="button" data-wopen="${esc(l.fromId)}">${esc(l.from)}</button>: ${esc(l.text)}</li>`).join("")}</ul>` : ""}
        ${ev.length ? `<h4 class="keeper">Scenes here</h4><ul class="hks keeper">${ev.map(e => `<li><details class="hk"><summary>${esc(e.t || "A scene")}</summary><p>${esc(e.d || "")}</p></details></li>`).join("")}</ul>` : ""}
        <h4>Routes from here</h4>${routes.length ? `<ul class="wm-rl2">${routes.map(r => routeRow(r, L.id)).join("")}</ul>` : `<p class="kn">No routes${keeper ? " yet (Edit map, then + Route)" : ""}.</p>`}
        ${keeper ? journeyBox(L) : ""}
        ${keeper && S.edit ? `<div class="wm-eb"><button type="button" data-w="editloc">Edit details</button><button type="button" data-w="duploc">Duplicate</button><button type="button" data-w="delloc">Delete</button>${L.edited && !L.added ? `<button type="button" data-w="resetloc">Undo my changes</button>` : ""}</div>` : ""}`;
    }
    function journeyBox(L) {
      const P = WD.party;
      if (!P.at) return `<div class="wm-jbox"><button type="button" data-w="partyhere">The party is here</button></div>`;
      if (P.at === L.id) return P.plan.length ? "" : `<p class="kn">Choose another place to plan the party's way there.</p>`;
      const J = S.journey && S.journey.to === L.id ? S.journey : null;
      let s = `<div class="wm-jbox"><button type="button" data-w="partyhere">The party is here</button><button type="button" data-w="plan">How do they get here?</button></div>`;
      if (J) {
        if (!J.legs) s += `<p class="warn">No way from ${esc(WD.byId[P.at].name)} to here by the routes on the map${J.blocked ? " (a blocked route stands in the way)" : ""}. Add a route, or open one.</p>`;
        else {
          const legs = J.legs.map(([a, b]) => { const r = WD.routes.find(x => (x.from === a && x.to === b) || (x.from === b && x.to === a)); const tv = travel(WD, r, wayFor(r)); return { a, b, r, tv }; });
          const allDays = legs.every(l => l.tv.days != null), allDist = legs.every(l => l.tv.dist != null);
          const tot = allDays ? daysText(legs.reduce((s, l) => s + l.tv.days, 0)) : allDist ? distText(WD, legs.reduce((s, l) => s + l.tv.dist, 0)) : `${legs.length} leg${legs.length > 1 ? "s" : ""}`;
          const risks = legs.filter(l => l.r.danger);
          s += `<div class="wm-way"><p><strong>The way:</strong> ${tot}${allDays ? "" : WD.scale ? " (travel times are not known for every leg: set days on the routes in Edit map)" : " (the map has no scale, so no distances; set days on the routes in Edit map for travel times)"}</p><ol>${legs.map(l => `<li>${esc(WD.byId[l.b].name)} <span class="kn">by ${esc((ROUTES[l.r.kind] || l.r.kind).toLowerCase())}${l.tv.days != null ? ", " + daysText(l.tv.days) : l.tv.dist != null ? ", " + distText(WD, l.tv.dist) : ""}</span>${l.r.danger ? ` <span class="wm-dgr">${esc(l.r.danger === true ? "danger" : l.r.danger)}</span>` : ""}</li>`).join("")}</ol>${risks.length ? `<p class="warn">${risks.length} dangerous leg${risks.length > 1 ? "s" : ""} on the way.</p>` : ""}<button type="button" class="prim" data-w="setoff">Set this as the party's journey</button></div>`;
        }
      }
      return s;
    }
    function routePanel(r) {
      const a = WD.byId[r.from], b = WD.byId[r.to], tv = travel(WD, r, wayFor(r)), keeper = gm();
      const enc = keeper ? (r.enc || []).filter(e => e && (e.t || e.d)) : [];
      return `<button type="button" class="wm-x" data-w="close" aria-label="Close">×</button>
        <div class="eyebrow"><span>${esc(ROUTES[r.kind] || r.kind)}</span>${r.hidden ? `<span>Hidden from the players</span>` : ""}</div>
        <h3>${r.name ? esc(r.name) : `${esc(a.name)} to ${esc(b.name)}`}</h3>
        ${r.name ? `<p class="kn">${esc(a.name)} to ${esc(b.name)}</p>` : ""}
        <dl class="wm-facts">
          <div><dt>Distance</dt><dd>${tv.dist != null ? esc(distText(WD, tv.dist)) : `<span class="kn">${WD.scale ? "—" : "The map has no scale."}</span>`}</dd></div>
          <div><dt>Travel</dt><dd>${tv.days != null ? `${esc(daysText(tv.days))} <span class="kn">(${esc(tv.basis)})</span>` : `<span class="kn">Not known${keeper ? ": set the days in Edit map" : ""}.</span>`}</dd></div>
          ${r.danger ? `<div><dt>Danger</dt><dd class="wm-dgr">${esc(r.danger === true ? "A dangerous way." : r.danger)}</dd></div>` : ""}
          ${r.blocked ? `<div><dt>Blocked</dt><dd class="wm-bad">${esc(r.blocked === true ? "The way is shut." : r.blocked)}</dd></div>` : ""}
        </dl>
        ${r.desc ? `<p class="wm-desc">${esc(r.desc)}</p>` : ""}
        ${keeper && r.gm ? `<div class="sec secret"><p>${esc(r.gm)}</p></div>` : ""}
        ${enc.length ? `<h4>On the way</h4><ul class="hks">${enc.map(e => `<li><details class="hk"><summary>${esc(e.t || "An encounter")}</summary><p>${esc(e.d || "")}</p></details></li>`).join("")}</ul>` : ""}
        <div class="wm-eb"><button type="button" data-wloc="${esc(a.id)}">${esc(a.name)}</button><button type="button" data-wloc="${esc(b.id)}">${esc(b.name)}</button></div>
        ${keeper && S.edit ? `<div class="wm-eb"><button type="button" data-w="editroute">Edit route</button><button type="button" data-w="delroute">Delete</button>${r.edited && !r.added ? `<button type="button" data-w="resetroute">Undo my changes</button>` : ""}</div>` : ""}`;
    }
    const REALM_KINDS = [["kingdom", "Kingdom"], ["empire", "Empire"], ["duchy", "Duchy or province"], ["republic", "Republic or city state"], ["territory", "Territory"], ["claim", "Contested claim"], ["wilds", "The wilds"], ["district", "District or zone"], ["sector", "Sector"]];
    const LABEL_KINDS = [["region", "A region"], ["range", "Mountains"], ["forest", "A forest"], ["desert", "A desert"], ["sea", "A sea or ocean"], ["lake", "A lake"], ["bay", "A bay"], ["river", "A river"]];
    const facName = id => { const f = id && A.lives && A.lives.fac(id); return f ? f.n || id : id || ""; };
    // a river, a name on the map, or a realm
    function featPanel(k, f) {
      const keeper = gm(), edit = keeper && S.edit;
      const inside = k === "realm" ? WD.locs.filter(L => pip(L.at[0], L.at[1], f.pts) && seen(L)) : [];
      const title = k === "realm" ? f.name || "A realm" : k === "river" ? f.name || "A river" : f.name;
      return `<button type="button" class="wm-x" data-w="close" aria-label="Close">×</button>
        <div class="eyebrow"><span>${esc(k === "realm" ? (REALM_KINDS.find(x => x[0] === f.kind) || [0, "Realm"])[1] : k === "river" ? "River" : "A name on the map")}</span>${f.hidden ? `<span>Hidden from the players</span>` : ""}</div>
        <h3>${esc(title)}</h3>
        ${k === "realm" && f.owner ? `<p><span class="kn">Held by</span> ${esc(facName(f.owner))}</p>` : ""}
        ${f.desc ? `<p class="wm-desc">${esc(f.desc)}</p>` : ""}
        ${keeper && f.gm ? `<div class="sec secret"><p>${esc(f.gm)}</p></div>` : ""}
        ${inside.length ? `<h4>Places in it</h4><ul class="wm-rl2">${inside.slice(0, 40).map(L => `<li><button type="button" class="wm-rt" data-wloc="${esc(L.id)}"><span class="wm-rn">${esc(L.name)}</span><span class="wm-rf">${esc((KINDS[L.kind] || [0, L.kind])[1])}</span></button></li>`).join("")}</ul>` : ""}
        ${edit ? `<div class="wm-eb"><button type="button" data-w="editfeat">Edit details</button>${k !== "label" ? `<button type="button" data-w="dupfeat">Duplicate</button>` : ""}<button type="button" data-w="delfeat">Delete</button>${f.edited && !f.added ? `<button type="button" data-w="resetfeat">Undo my changes</button>` : ""}</div><p class="kn">${k === "label" ? "Drag the name to move it." : "Drag it to move it; drag a corner to reshape it."}</p>` : ""}`;
    }
    function renderPanel() {
      const L = S.sel && WD.byId[S.sel], r = S.selRoute && WD.rById[S.selRoute], [fk, f] = S.selFeat ? featOf(S.selFeat) : [null, null];
      if (L && seen(L)) { panel.hidden = false; panel.innerHTML = locPanel(L); }
      else if (r && routeSeen(r)) { panel.hidden = false; panel.innerHTML = routePanel(r); }
      else if (f && (gm() || !f.hidden)) { panel.hidden = false; panel.innerHTML = featPanel(fk, f); }
      else { panel.hidden = true; panel.innerHTML = ""; }
    }

    /* ---- the bars: filters, the editing tools, the key */
    function renderBars() {
      const kinds = kindsHere(), rk = routeKindsHere();
      $(".wm-fbody").innerHTML = `
        <fieldset><legend>Places</legend>${kinds.map(k => `<label><input type="checkbox" data-fk="${esc(k)}"${filt.kinds[k] === false ? "" : " checked"}> ${esc((KINDS[k] || [0, k])[1])}</label>`).join("")}</fieldset>
        <fieldset><legend>The party knows</legend>${[["all", "Everything"], ["known", "What they know"], ["visited", "Where they have been"], ["new", "Where they have not been"]].map(([v, l]) => `<label><input type="radio" name="${uid}-k" value="${v}" data-fknow${filt.know === v ? " checked" : ""}> ${l}</label>`).join("")}</fieldset>
        ${rk.length ? `<fieldset><legend>Routes</legend>${rk.map(k => `<label><input type="checkbox" data-fr="${esc(k)}"${filt.routes[k] === false ? "" : " checked"}> ${esc(ROUTES[k] || k)}</label>`).join("")}</fieldset>` : ""}
        <label class="wm-f3"><input type="checkbox" data-f3${filt.only3d ? " checked" : ""}> Only places with a 3D map</label>`;
      const eb = $(".wm-editbar");
      root.dataset.tool = S.edit && gm() && S.tool || "";
      const tb = (w, l, on, title) => `<button type="button" class="wm-btn" data-w="${w}" aria-pressed="${!!on}"${title ? ` title="${esc(title)}"` : ""}>${l}</button>`, landy = WD.look !== "stars" && !drawn();
      eb.innerHTML = S.edit && gm() ? tb("addloc", "+ Place", S.tool === "loc") + tb("addroute", "+ Route", S.tool === "route")
        + (landy ? tb("brush", "Shape the land", S.tool === "brush", "Paint land, sea, mountains, forests, deserts and swamps") + tb("river", "+ River", S.tool === "river") : "")
        + tb("realm", WD.look === "stars" ? "+ Territory" : "+ Realm", S.tool === "realm", "Draw a kingdom, province or territory, and say who holds it") + tb("label", "+ Name", S.tool === "label", "Write a name on the map: a sea, a range, a forest")
        + `<button type="button" class="wm-btn" data-w="undo"${HIST.length ? "" : " disabled"} title="Undo (Ctrl+Z)">Undo</button><button type="button" class="wm-btn" data-w="redo"${REDO.length ? "" : " disabled"} title="Redo (Ctrl+Y)">Redo</button>`
        + (A.worldGenSrc && WD.look !== "stars" && !DRAW ? tb("newworld", "Make a new world", false, "Generate a whole new land: how big, its shape (from your own drawing if you like), its climate") : "")
        + tb("export", "Copy as world.js")
        + (S.tool === "brush" ? `<span class="wm-brushbar">${WD.G ? `<label><span class="kn">Paint</span> <select data-wb="m">${brushOptions()}</select></label><label class="wm-bsize"><span class="kn">Brush size</span> <input type="range" data-wb="r" min="4" max="200" step="2" value="${S.size}" aria-label="Brush size"> <span class="wm-bsz">${S.size}</span></label>` : `<span>This map has no land yet. Start with</span> <button type="button" class="wm-btn" data-w="base" data-base="sea">All sea</button> <button type="button" class="wm-btn" data-w="base" data-base="land">All land</button>`}</span>` : "") : "";
      $('[data-w="edit"]').setAttribute("aria-pressed", S.edit);
      const dw = $('[data-w="drawn"]'); if (dw) { dw.setAttribute("aria-pressed", !!drawn()); dw.hidden = WD.look === "stars" || !DRAW.trace; }
      // how the map is drawn: the game master chooses among the looks this world can wear
      const lk = $(".wm-look"), opts = A.worldArt ? A.worldArt.looksFor(WD) : [];
      if (lk) { lk.hidden = !gm() || opts.length < 2 || drawn(); lk.innerHTML = opts.map(([v, l]) => `<option value="${v}"${v === WD.look ? " selected" : ""}>${esc(l)}</option>`).join(""); }
      const sw = (k) => { const [c, w, d] = st.routes[k] || st.routes.road; return `<svg width="28" height="10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" stroke="${c}" stroke-width="${w}" stroke-dasharray="${d}" stroke-linecap="round"/></svg>`; };
      const how = S.tool === "loc" ? "Click the map where the new place stands." : S.tool === "route" ? (S.first ? `Now click where the route from ${esc(WD.byId[S.first] ? WD.byId[S.first].name : "")} goes.` : "Click the place the route starts from.")
        : S.tool === "brush" ? (WD.G ? `Drag over the map with the brush (${esc(brushName(S.brush))}). Scroll to zoom; press Shape the land again to stop.` : "Choose how the land begins.")
        : S.tool === "river" ? (S.draft && S.draft.pts.length > 1 ? `Click to go on, from its source to its mouth. <button type="button" class="wm-btn" data-w="finish">Finish the river</button> (or Enter) · Esc stops` : "Click where the river rises, then along its way to the sea or a lake.")
        : S.tool === "realm" ? (S.draft && S.draft.pts.length > 2 ? `Click round its border. <button type="button" class="wm-btn" data-w="finish">Close the border</button> (or click the first corner, or Enter) · Esc stops` : "Click round the border of the realm, corner by corner.")
        : S.tool === "label" ? "Click where the name goes."
        : S.edit ? "Drag a place, a river, a realm's border or a name to move it. Click one to change it." : `Drag to pan · scroll or pinch to zoom · click a place for what is there${Object.keys(A.cities || {}).length ? " and to enter its 3D map" : ""}.`;
      $(".wm-hint").innerHTML = rk.map(k => `<span class="lg">${sw(k)}${esc(ROUTES[k] || k)}</span>`).join("") + `<span class="lg"><svg width="17" height="11" aria-hidden="true"><rect x=".5" y=".5" width="16" height="10" rx="2" fill="#8a2432"/><text x="8.5" y="8.4" text-anchor="middle" font-size="7.5" font-weight="700" fill="#fff" font-family="monospace">3D</text></svg>has a 3D map: click it, then Enter</span>` + (WD.scale ? "" : `<span class="lg kn">No scale given: distances are not shown</span>`) + (WD.T.credit ? `<span class="credit">${esc(WD.T.credit)}</span>` : "") + `<span class="how">${how}</span>${S.edit && gm() ? `<span class="credit">${DB ? "Changes are saved in this page's database." : "Changes are saved in this browser only."}</span>` : ""}`;
      // (the coasts' key, while their layer is shown: the kinds this world has, the most common first)
      if (COA.on && WD.T && WD.T.coastKinds) { const F = WD.T._formU8 || (WD.T._formU8 = unb64(WD.T.coastForm)), cnt = {}; if (F) for (const v of F) if (v) cnt[v] = (cnt[v] || 0) + 1; $(".wm-hint").insertAdjacentHTML("afterbegin", Object.entries(WD.T.coastKinds).sort((a, b) => (cnt[b[0]] || 0) - (cnt[a[0]] || 0)).map(([f, [nm, col]]) => `<span class="lg"><svg width="22" height="10" aria-hidden="true"><line x1="1" y1="5" x2="21" y2="5" class="wco-l" style="stroke:${col};stroke-width:4px"/></svg>${esc(nm)}</span>`).join("") + `<span class="lg kn">Point at a numbered pin for why that coast formed</span>`); }
      // (the currents' key, while their layer is shown)
      if (CUR.on && WD.T && WD.T.currents) $(".wm-hint").insertAdjacentHTML("afterbegin", `<span class="lg"><svg width="28" height="10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" class="wc-s w" style="stroke-width:3px"/></svg>Warm current</span><span class="lg"><svg width="28" height="10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" class="wc-s c" style="stroke-width:3px"/></svg>Cold current</span><button type="button" class="wm-btn wc-nb" data-w="curnames">${CUR.names ? "Hide their names" : "Show their names"}</button>`);
    }
    // what the land is drawn from: when it changes (a stroke of the brush, a river, a realm, a name), it is drawn again
    const landKey = () => JSON.stringify([GEN.ver, WD.shape, WD.rivers.map(r => [r.id, r.name, r.w, r.liquid, r.pts.length, r.pts[0], r.pts[r.pts.length - 1], r.pts[r.pts.length >> 1]]), WD.labels, WD.realms.map(g => [g.id, g.name, g.pts, g.colour, g.owner, g.hidden, g.at]), gm()]);
    let lastLand = landKey();
    // the recipe changed: its land from this browser's keeping, or made afresh (the generator in a worker, so the page
    // stays free); no recipe: back to the campaign's own land
    function genCheck() {
      const key = genKey(OV.gen);
      if (!key) { if (GEN.T) { GEN.T = null; GEN.key = null; GEN.ver++; } GEN.busy = null; return; }
      if (GEN.key === key || GEN.busy === key) return;
      GEN.busy = key; const g = OV.gen, t0 = Date.now();
      const tick = () => { if (GEN.busy !== key || gone) return; const n = $(".wm-note"); clearTimeout(note.t); n.hidden = false; n.textContent = `Making the world${g.sketch ? " from your drawing" : ""}: ${Math.round((Date.now() - t0) / 1000)} s (about ${GEN_SECS[g.size] || 20} s in all). The map works meanwhile.`; tick.t = setTimeout(tick, 1000); };
      tick();
      (async () => {
        let T = await genCache(key); let err = null;
        if (!T) try { T = await genRun(g); if (T) genCache(key, T); } catch (e) { err = e; }
        clearTimeout(tick.t); if (GEN.busy !== key || gone) return; GEN.busy = null;
        if (!T) { console.warn("world map: the world could not be made", err); note("The world could not be made" + (err && err.message ? ": " + String(err.message).split("\n")[0] : "") + "."); return; }
        GEN.key = key; GEN.T = T; GEN.ver++; note("The new world is ready."); rebuild();
      })();
    }
    // Make a new world: how big, what shape (or the referee's own drawing), what climate, by which rules, the look
    function newWorldDlg() {
      const g = OV.gen || {}, SK = A.worldSketch, nk = v => Math.round(v / 100) * 100, fmt = v => v.toLocaleString("en"), km = k => k === "planet" ? "40,000 km around, 20,000 km from pole to pole" : `${fmt(nk(GEN_KM[k] || GEN_SIZES[k][0] * 2.3))} km by ${fmt(nk((GEN_KM[k] || GEN_SIZES[k][0] * 2.3) * GEN_SIZES[k][1] / GEN_SIZES[k][0]))} km`;
      const sizes = [["small", "Small"], ["medium", "Medium"], ["large", "Large"], ["huge", "Huge"], ["vast", "Vast"], ["world", "A great continent"], ["supercontinent", "A supercontinent"], ["hemisphere", "Half a planet"], ["planet", "A whole planet"]].map(([k, l]) => [k, `${l}: ${km(k)}${GEN_SECS[k] >= 60 ? ` (takes about ${Math.round(GEN_SECS[k] / 60)} min)` : ""}`]);
      const lands = [["masses", "Made for me: a preset, or how many landmasses"], ["coast", "A coast (the sea on one side)"], ["inland", "All land"], ["paint", "Paint it myself"], ["sketch", "From a picture of my own"]];
      // (the presets: how many landmasses, and how much of the world is land)
      const PRESETS = [["One big continent", 1, .4], ["A Pangaea: one vast land", 1, .62], ["Two continents", 2, .35], ["Several continents, like the Earth", 6, .29], ["Many islands", 15, .2], ["An archipelago", 35, .12]];
      const looks = (A.worldArt ? A.worldArt.looksFor(WD) : []).map(([v, l]) => [v, l]);
      const clim = Object.entries(A.worldBiomes ? A.worldBiomes.CLIMATES : { varied: [0, 0, 0, "Varied"] }).map(([k, v]) => [k, v[3]]);
      let pic = null;
      dlg.innerHTML = `<form method="dialog" class="ke wm-newworld"><h3>Make a new world</h3>
        <p class="kn">A whole new land, made the way the Earth makes one: plates raise its mountains, rivers carve them, the winds bring its rain. Your places are set on it again; Undo brings back the old land.</p>
        <label>How big <span class="wm-lsl"><span class="kn">Small</span><input type="range" name="sizeR" min="0" max="${sizes.length - 1}" step="1" value="${Math.max(0, sizes.findIndex(s2 => s2[0] === (g.size || "planet")))}" aria-label="How big the world is"><span class="kn">A whole planet</span></span><span class="kn wm-sval"></span><input type="hidden" name="size" value="${esc(g.size || "planet")}"></label>
        <label>Its shape <select name="land">${opt(lands, g.paint ? "paint" : g.sketch ? "sketch" : ["coast", "inland"].includes(g.land) ? g.land : "masses")}</select></label>
        <div class="wm-nw-pic" hidden><label>Your drawing <input type="file" name="pic" accept="image/*"></label><p class="kn">A drawing on paper or a coloured map: the land you outlined (or did not colour blue) becomes the land, and the mountains you drew (peaks, hatching, or brown and grey) become ranges. A photo of a sketch works.</p><p class="kn wm-nw-read"></p></div>
        <div class="wm-nw-masses" hidden>
          <div class="wm-pal">${PRESETS.map(([l, m, sh], i) => `<button type="button" class="wm-pc" data-preset="${i}">${esc(l)}</button>`).join("")}</div>
          <label>How many landmasses <span class="wm-lsl"><span class="kn">1</span><input type="range" name="masses" min="1" max="40" step="1" value="${g.masses || 1}"><span class="kn">40</span></span><span class="kn wm-mval"></span></label>
          <label>How much of the world is land <span class="wm-lsl"><span class="kn">10%</span><input type="range" name="share" min="0.1" max="0.9" step="0.01" value="${g.share || .4}"><span class="kn">90%</span></span><span class="kn wm-shval"></span></label>
        </div>
        <div class="wm-nw-paint" hidden>
          <div class="wm-pal" role="radiogroup" aria-label="What to paint">${[["water", "Sea, lakes, rivers", SK ? SK.WATER : "#4f8fcf"], ...(SK ? SK.KINDS.map(k => [k[0], k[1], k[2]]) : [])].map(([k, l, c], i) => `<button type="button" class="wm-pc" data-pc="${c}" aria-pressed="${i === 1}" title="${esc(l)}"><i style="background:${c}"></i>${esc(l)}</button>`).join("")}</div>
          <div class="wm-pbar"><label>Brush <input type="range" name="pbrush" min="2" max="60" value="14"></label><button type="button" class="wm-btn" data-nw="fromMap">Start from this map</button><button type="button" class="wm-btn" data-nw="blank">Start from the sea</button><label class="wm-btn wm-pload">Load a picture<input type="file" accept="image/*" hidden data-nw="load"></label><button type="button" class="wm-btn" data-nw="pundo">Undo stroke</button></div>
          <canvas class="wm-pcv" width="600" height="400"></canvas>
          <p class="kn">Paint the land on the sea, then forests, deserts, swamps, snow, hills, mountains and volcanoes where you want them; blue inside the land is a lake, a thin blue line a river. The plates, the rivers and the climate make the rest: the land you paint, as the Earth would make it.</p>
        </div>
        <label class="wm-nw-loose" hidden>How closely to follow my drawing <span class="wm-lsl"><span class="kn">Exactly as drawn</span><input type="range" name="loose" min="0" max="1" step="0.05" value="${g.loose != null ? g.loose : .5}" aria-label="How closely to follow my drawing: left exactly as drawn, right loosely"><span class="kn">Loosely</span></span><span class="kn wm-lval"></span></label>
        <label>Climate <select name="climate">${opt(clim, g.climate || "varied")}</select></label>
        <label>Where the deserts and rains fall <select name="rules">${opt([["earth", "As on the Earth: the winds, the seas, the mountains decide"], ["classic", "Atlas's older, simpler rules"]], g.rules || "earth")}</select></label>
        <label>The ocean's currents <select name="currents">${opt([["on", "Worked out: they warm and cool the coasts, bring fog and coastal deserts"], ["retro", "Worked out, on a world turning the other way"], ["", "Not worked out"]], g.currents != null ? g.currents : "on")}</select></label>
        <label>The coasts <select name="coast">${opt([["geologic", "Shaped by their history: rock, ice-age glaciers, the sea's rise, rivers and waves (fjords, rias, deltas, reefs)"], ["natural", "Formed by waves, drift and sand only: beaches, cliffs, marsh, dunes, barrier islands"], ["", "Simple: beaches where the shore is low and gentle"]], g.coast != null ? g.coast : "geologic")}</select></label>
        <label>Kind of world <select name="realism">${opt([["fantasy", "Fantasy: its own places (enchanted woods, ...)"], ["realistic", "Realistic: only what the Earth would make"]], g.realism || (WD.T && WD.T.realism) || "fantasy")}</select></label>
        <label>Look <select name="look">${opt(looks, g.look || (looks.some(l => l[0] === "hydro") ? "hydro" : WD.look))}</select></label>
        <label>Seed <input type="number" name="seed" min="1" max="999999" value="${g.seed || 1000 + Math.floor(Math.random() * 9000)}"> <button type="button" class="wm-btn" data-nw="roll">Roll</button></label>
        <p class="kn">The same seed and choices always make the same world.</p>
        <div class="ka">${OV.gen ? `<button type="button" data-nw="back">Back to the campaign's own land</button>` : ""}<button type="submit" value="cancel" formnovalidate>Cancel</button><button type="submit" value="make" class="prim">Make it</button></div></form>`;
      const f = dlg.querySelector("form"), picBox = f.querySelector(".wm-nw-pic"), readOut = f.querySelector(".wm-nw-read");
      // the painter: the colour key's brushes on a little canvas the map's shape
      const pBox = f.querySelector(".wm-nw-paint"), pcv = f.querySelector(".wm-pcv"), pg = pcv.getContext("2d", { willReadFrequently: true }), pUndo = [];
      let pInit = false, pCol = (SK && SK.KINDS[0][2]) || "#a6d27c";
      const pAspect = () => { const k = f.elements.size.value, [sw, sh] = GEN_SIZES[k]; return k === "planet" ? 2 : sw / sh; };
      const pSize = () => { const a = pAspect(), w = 600, h = Math.round(w / a); if (pcv.width !== w || pcv.height !== h) { const keep = pInit ? pg.getImageData(0, 0, pcv.width, pcv.height) : null, ow = pcv.width, oh = pcv.height; pcv.width = w; pcv.height = h; if (keep) { const t = document.createElement("canvas"); t.width = ow; t.height = oh; t.getContext("2d").putImageData(keep, 0, 0); pg.imageSmoothingEnabled = false; pg.drawImage(t, 0, 0, w, h); } } };
      const fromMap = () => {
        pSize(); const G = WD.G, w = pcv.width, h = pcv.height, img = pg.createImageData(w, h), hx = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
        const Wt = hx(SK.WATER), C = SK.KINDS.map(k => hx(k[2])), S2 = WD.G ? sampler(G) : null, B = G && G.B, BC = A.worldBiomes ? A.worldBiomes.CODE : {};
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          let c = Wt;
          if (S2) { const X = (x + .5) / w * W, Y = (y + .5) / h * H, v = S2(X, Y); if (v > G.sea) { const t = (v - G.sea) / (255 - G.sea), b = B ? B[Math.min(G.rows - 1, Math.floor(Y / G.cell)) * G.cols + Math.min(G.cols - 1, Math.floor(X / G.cell))] : -1;
            c = t > .45 ? C[SK.K.mountains] : t > .27 ? C[SK.K.hills] : b === BC.forest ? C[SK.K.forest] : b === BC.desert ? C[SK.K.desert] : b === BC.swamp ? C[SK.K.swamp] : b === BC.snow ? C[SK.K.snow] : C[SK.K.plains]; } }
          const o = (y * w + x) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
        }
        pg.putImageData(img, 0, 0); pInit = true; pUndo.length = 0;
      };
      const blank = () => { pSize(); pg.fillStyle = SK.WATER; pg.fillRect(0, 0, pcv.width, pcv.height); pInit = true; pUndo.length = 0; };
      const showPic = () => { const v = f.elements.land.value; picBox.hidden = v !== "sketch"; pBox.hidden = v !== "paint"; f.querySelector(".wm-nw-loose").hidden = v !== "sketch" && v !== "paint"; f.querySelector(".wm-nw-masses").hidden = v !== "masses";  if (v === "paint" && !pInit && SK) { if (g.paint) { const im = new Image(); im.onload = () => { pSize(); pg.drawImage(im, 0, 0, pcv.width, pcv.height); pInit = true; }; im.src = g.paint; } else fromMap(); } };
      showPic(); f.elements.land.addEventListener("change", showPic);
      // (the size slider: its step names the size, and how big and how long it is)
      const sv = () => { const k = sizes[+f.elements.sizeR.value]; f.elements.size.value = k[0]; f.querySelector(".wm-sval").textContent = k[1]; f.elements.size.dispatchEvent(new Event("change")); };
      sv(); f.elements.sizeR.addEventListener("input", sv);
      const lv = () => { const x = +f.elements.loose.value; f.querySelector(".wm-lval").textContent = x < .1 ? "Your drawing exactly: only the coast's grain added." : x < .35 ? "Close to your drawing, a little natural." : x < .7 ? "Natural: your shapes, with bays, headlands, peaks and passes as nature would make them (recommended)." : "Loosely: the coasts and ranges much freer, still where you drew them."; };
      lv(); f.elements.loose.addEventListener("input", lv);
      const mv = () => { const m = +f.elements.masses.value, sh = +f.elements.share.value; f.querySelector(".wm-mval").textContent = m === 1 ? "One landmass, with a few small islands off its coasts." : m <= 3 ? `${m} landmasses, great and small.` : m <= 10 ? `${m} landmasses, some great, more small.` : `${m} landmasses: islands of every size.`; f.querySelector(".wm-shval").textContent = `${Math.round(sh * 100)}% land, ${100 - Math.round(sh * 100)}% sea${Math.abs(sh - .29) < .03 ? " (as on the Earth)" : ""}.`;
        for (const b of f.querySelectorAll("[data-preset]")) { const P = PRESETS[+b.dataset.preset]; b.setAttribute("aria-pressed", P[1] === m && Math.abs(P[2] - sh) < .005); } };
      mv(); f.elements.masses.addEventListener("input", mv); f.elements.share.addEventListener("input", mv);
      for (const b of f.querySelectorAll("[data-preset]")) b.addEventListener("click", () => { const P = PRESETS[+b.dataset.preset]; f.elements.masses.value = P[1]; f.elements.share.value = P[2]; mv(); });
      f.elements.size.addEventListener("change", () => { if (pInit) pSize(); });
      for (const b of f.querySelectorAll(".wm-pc")) b.addEventListener("click", () => { pCol = b.dataset.pc; for (const o of f.querySelectorAll(".wm-pc")) o.setAttribute("aria-pressed", o === b); });
      f.querySelector('[data-nw="fromMap"]').addEventListener("click", fromMap);
      f.querySelector('[data-nw="blank"]').addEventListener("click", blank);
      f.querySelector('[data-nw="pundo"]').addEventListener("click", () => { const u = pUndo.pop(); if (u) pg.putImageData(u, 0, 0); });
      f.querySelector('[data-nw="load"]').addEventListener("change", e => {
        const file = e.target.files && e.target.files[0]; if (!file) return; const im = new Image(), url = URL.createObjectURL(file);
        im.onload = () => { pSize(); const t = document.createElement("canvas"), w = pcv.width, h = pcv.height; t.width = w * 2; t.height = h * 2; const tg = t.getContext("2d", { willReadFrequently: true }); tg.fillStyle = "#fff"; tg.fillRect(0, 0, t.width, t.height); tg.drawImage(im, 0, 0, t.width, t.height); URL.revokeObjectURL(url);
          const key = SK.toKey(tg.getImageData(0, 0, t.width, t.height).data, t.width, t.height, w, h); pUndo.push(pg.getImageData(0, 0, w, h)); pg.putImageData(new ImageData(key, w, h), 0, 0); pInit = true; };
        im.src = url;
      });
      // (strokes: round, with the chosen colour; held, they paint as the pointer moves)
      let pDown = null;
      const pPt = e => { const r = pcv.getBoundingClientRect(); return [(e.clientX - r.left) * pcv.width / r.width, (e.clientY - r.top) * pcv.height / r.height]; };
      pcv.addEventListener("pointerdown", e => { e.preventDefault(); pcv.setPointerCapture(e.pointerId); pUndo.push(pg.getImageData(0, 0, pcv.width, pcv.height)); if (pUndo.length > 30) pUndo.shift(); pDown = pPt(e); pg.fillStyle = pCol; pg.beginPath(); pg.arc(pDown[0], pDown[1], +f.elements.pbrush.value / 2, 0, 6.3); pg.fill(); });
      pcv.addEventListener("pointermove", e => { if (!pDown) return; const q = pPt(e); pg.strokeStyle = pCol; pg.lineCap = "round"; pg.lineWidth = +f.elements.pbrush.value; pg.beginPath(); pg.moveTo(pDown[0], pDown[1]); pg.lineTo(q[0], q[1]); pg.stroke(); pDown = q; });
      const pUp = () => { pDown = null; }; pcv.addEventListener("pointerup", pUp); pcv.addEventListener("pointercancel", pUp);
      f.querySelector('[data-nw="roll"]').addEventListener("click", () => { f.elements.seed.value = 1000 + Math.floor(Math.random() * 900000); });
      const back = f.querySelector('[data-nw="back"]'); if (back) back.addEventListener("click", () => { closeDlg(); save("gen", null); note("Back to the campaign's own land."); });
      // the picture, read as soon as it is chosen, so the referee sees what was understood
      f.elements.pic.addEventListener("change", () => {
        const file = f.elements.pic.files && f.elements.pic.files[0]; if (!file || !SK) return;
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = () => {
          const iw = Math.min(1600, img.naturalWidth), ih = Math.round(iw * img.naturalHeight / img.naturalWidth), cv = document.createElement("canvas"); cv.width = iw; cv.height = ih;
          const cx = cv.getContext("2d", { willReadFrequently: true }); cx.fillStyle = "#fff"; cx.fillRect(0, 0, iw, ih); cx.drawImage(img, 0, 0, iw, ih); URL.revokeObjectURL(url);
          pic = { px: cx.getImageData(0, 0, iw, ih).data, iw, ih };
          const sk = SK.read(pic.px, iw, ih, ...SK.gridFor(iw, ih)); let l = 0, m = 0; for (let n = 0; n < sk.land.length; n++) { l += sk.land[n]; m += sk.mtn[n] > .25 ? 1 : 0; }
          readOut.textContent = `Read as ${sk.how === "colour" ? "a coloured map (its blue is the sea)" : "a line drawing (the sea is the paper outside your coasts)"}: ${Math.round(l / sk.land.length * 100)}% land, ${m ? "mountains where you drew them" : "no mountains drawn (the plates will raise them)"}.`;
        };
        img.onerror = () => { readOut.textContent = "That picture could not be read."; };
        img.src = url;
      });
      f.addEventListener("submit", e => {
        if (!e.submitter || e.submitter.value !== "make") return; e.preventDefault();
        const v = { size: f.elements.size.value, climate: f.elements.climate.value, rules: f.elements.rules.value, currents: f.elements.currents ? f.elements.currents.value : "", coast: f.elements.coast ? f.elements.coast.value : "", realism: f.elements.realism.value, look: f.elements.look.value, seed: Math.max(1, parseInt(f.elements.seed.value, 10) || 1) };
        const whole = v.size === "planet";
        if (f.elements.land.value === "paint" || f.elements.land.value === "sketch") v.loose = +f.elements.loose.value;
        if (f.elements.land.value === "paint") {
          // (the painting, read exactly by its colours; kept small as text, and as a picture to paint on again)
          const [sw, sh] = GEN_SIZES[v.size], a = whole ? 2 : pcv.width / pcv.height, d = pg.getImageData(0, 0, pcv.width, pcv.height);
          v.land = whole ? "continents" : "continent"; v.dims = whole ? [sw, sh] : [Math.round(Math.sqrt(sw * sh * a)), Math.round(Math.sqrt(sw * sh / a))];
          v.sketch = SK.encode(SK.read(d.data, pcv.width, pcv.height, ...SK.gridFor(pcv.width, pcv.height, a), { colour: true }));
          // (the picture, made small so it keeps in the page's store)
          const t = document.createElement("canvas"); t.width = 300; t.height = Math.round(300 / a); t.getContext("2d").drawImage(pcv, 0, 0, t.width, t.height); v.paint = t.toDataURL("image/png");
        } else if (f.elements.land.value === "sketch") {
          if (!pic && !(g.sketch)) { readOut.textContent = "Choose the picture of your drawing first."; return; }
          const [sw, sh] = GEN_SIZES[v.size], a = whole ? 2 : pic ? Math.max(.4, Math.min(3, pic.iw / pic.ih)) : (g.dims ? g.dims[0] / g.dims[1] : sw / sh);
          v.land = whole ? "continents" : "continent"; v.dims = whole ? [sw, sh] : [Math.round(Math.sqrt(sw * sh * a)), Math.round(Math.sqrt(sw * sh / a))];
          v.sketch = pic ? SK.encode(SK.read(pic.px, pic.iw, pic.ih, ...SK.gridFor(pic.iw, pic.ih, a))) : g.sketch;
        } else { v.land = f.elements.land.value; if (v.land === "masses") { v.masses = +f.elements.masses.value; v.share = +f.elements.share.value; } }
        closeDlg();
        if (OV.shape && (OV.shape.strokes || []).length) save("shape", null);
        if (v.look !== WD.look) save("style", Object.assign({}, OV.style || {}, { look: v.look }));
        save("gen", v);
      });
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    }
    function genRun(g) {
      if (!A.worldGenSrc || typeof Worker === "undefined") return Promise.reject(new Error("this page cannot make worlds (build it again with atlas.js build)"));
      const W0 = JSON.parse(JSON.stringify(A.worldData || {})); delete W0.size;
      const flags = { size: g.size, land: g.land, climate: g.climate, realism: g.realism, look: g.look, seed: g.seed, replace: true, regions: true };
      flags["climate-model"] = g.rules === "classic" ? "classic" : "earth"; if (g.currents && g.rules !== "classic") { flags.currents = true; if (g.currents === "retro") flags.spin = "retrograde"; } else flags.currents = "off"; flags.coast = (g.coast === "natural" || g.coast === "geologic") && g.rules !== "classic" ? g.coast : "plain"; if (g.loose != null) flags.loose = g.loose; if (g.land === "masses") { flags.landmasses = g.masses; flags.landshare = g.share; } if (g.dims) flags.dims = g.dims; if (g.sketch) flags.sketch = g.sketch;
      const msg = { A: { worldKit: { KINDS: JSON.parse(JSON.stringify(KINDS)), LOOK_OF }, worldData: W0, worldTerrainData: {}, config: JSON.parse(JSON.stringify(A.config || {})) }, flags };
      return new Promise((ok, no) => {
        let w; try { w = new Worker(URL.createObjectURL(new Blob([A.worldGenSrc], { type: "text/javascript" }))); } catch (e) { no(e); return; }
        w.onmessage = e => { w.terminate(); if (e.data && e.data.ok) ok(e.data.T); else no(new Error(e.data && e.data.error || "the generator stopped")); };
        w.onerror = e => { w.terminate(); no(new Error(e.message || "the generator failed")); };
        w.postMessage(msg);
      });
    }
    function rebuild() {
      const keepSel = S.sel, keepR = S.selRoute, was = WD.look;
      const keepG = WD.G;
      genCheck();
      WD = prepareWorld(A.worldData, terrainNow(), OV); traced();
      // a new look: its colours, its icons, its land
      const lk = landKey();
      // (the land itself unchanged: the same grid kept, so what was worked out from it, the climate's colours and the
      // streams, need not be worked out again)
      if (lk === lastLand && keepG && WD.G && keepG.cols === WD.G.cols && keepG.rows === WD.G.rows) WD.G = keepG;
      if (WD.look !== was) { st = STYLE[WD.look] || STYLE.parchment; root.classList.remove("wm-" + was); root.classList.add("wm-" + WD.look); }
      // (a world made at another size: the frame and the camera follow it)
      if (WD.size[0] !== W || WD.size[1] !== H) { [W, H] = WD.size; size(); home(true); }
      if (WD.look !== was || lk !== lastLand) { lastLand = lk; PG = null; ways.clear(); drawLand(); }
      if (keepSel && !WD.byId[keepSel]) S.sel = null; if (keepR && !WD.rById[keepR]) S.selRoute = null; if (S.selFeat && !featOf(S.selFeat)[1]) S.selFeat = null;
      drawCurrents(); drawCoasts(); drawRoutes(); drawMarkers(); drawFx(); renderPanel(); renderBars();
    }
    function note(t) { const n = $(".wm-note"); n.textContent = t; n.hidden = !t; clearTimeout(note.t); if (t) note.t = setTimeout(() => { n.hidden = true; }, 5000); }

    /* ---- what the referee changes, kept in the page's database (or this browser), laid over the campaign's world */
    let DB = null;
    function fromDocs(docs) { Object.assign(OV, ovFrom(docs)); }
    const localAll = () => { try { return JSON.parse(ctx.store.get("world-edits") || "{}") || {}; } catch (e) { return {}; } };
    const docNow = doc => { const v = doc === "party" ? OV.party : doc === "style" ? OV.style : doc === "shape" ? OV.shape : doc === "gen" ? OV.gen : doc.startsWith("l-") ? OV.loc[doc.slice(2)] : doc.startsWith("r-") ? OV.route[doc.slice(2)] : doc.startsWith("f-") ? OV.feat[doc.slice(2)] : null; return v == null ? null : JSON.parse(JSON.stringify(v)); };
    // undo and redo: every change but where the party is (that is play, not the map) can be taken back, and done again
    function save(doc, data, how) {
      if (doc !== "party" && how !== "hist") { HIST.push({ doc, before: docNow(doc), after: data == null ? null : JSON.parse(JSON.stringify(data)) }); if (HIST.length > 200) HIST.shift(); REDO.length = 0; }
      // the change shows at once; the database follows
      const all = DB ? null : localAll();
      if (doc === "party") OV.party = data; else if (doc === "style") OV.style = data; else if (doc === "shape") OV.shape = data; else if (doc === "gen") OV.gen = data; else if (doc.startsWith("l-")) { if (data) OV.loc[doc.slice(2)] = data; else delete OV.loc[doc.slice(2)]; } else if (doc.startsWith("r-")) { if (data) OV.route[doc.slice(2)] = data; else delete OV.route[doc.slice(2)]; } else if (doc.startsWith("f-")) { if (data) OV.feat[doc.slice(2)] = data; else delete OV.feat[doc.slice(2)]; }
      rebuild();
      if (DB) { const ref = DB.collection("world").doc(doc); return Promise.resolve(data ? ref.set(data) : ref.delete()).catch(e => { console.warn("world map: not saved", e); note("That change could not be saved" + (e && e.code === "invalid_argument" ? ": you can look at this page but not change it." : ".")); }); }
      if (data) all[doc] = data; else delete all[doc];
      ctx.store.set("world-edits", JSON.stringify(all));
      return Promise.resolve();
    }
    function undo(back) {
      const from = back ? HIST : REDO, to = back ? REDO : HIST, h = from.pop(); if (!h) return;
      to.push(h); save(h.doc, back ? h.before : h.after, "hist");
      note(back ? "Undone." : "Done again.");
    }
    const ownOf = (kind, id) => Object.assign({}, (kind === "l" ? OV.loc : kind === "f" ? OV.feat : OV.route)[id] || {});
    // the land's strokes the page added: a stroke more
    function addStroke(s) { const sh = OV.shape || {}; save("shape", { base: sh.base || null, strokes: [...(sh.strokes || []), s] }); }
    (async function connect() {
      let db = null; try { db = ctx.db ? await ctx.db : null; } catch (e) { db = null; }
      if (gone) return;
      if (db) { DB = db; try { db.collection("world").onSnapshot(s => { if (gone) return; fromDocs(s.docs.map(d => [d.id, d.data() || {}])); rebuild(); }, e => console.warn("world map", e)); } catch (e) { console.warn("world map", e); } }
      else { fromDocs(Object.entries(localAll())); rebuild(); }
    })();

    /* ---- choosing */
    function select(id, flyTo) {
      S.sel = id && WD.byId[id] ? id : null; S.selRoute = null; S.selFeat = null; S.journey = null; if (S.edit) drawFx();
      try { ctx.store.set("world-sel", S.sel || ""); } catch (e) {}
      drawMarkers(); drawRoutes(); renderPanel();
      if (S.sel && flyTo) { const L = WD.byId[S.sel]; fly(L.at, Math.max(V.k, V.k0 * 2.2)); }
      else if (S.sel) reveal(WD.byId[S.sel].at);
    }
    // a chosen place (or route) the panel would hide slides into the open part of the map
    function reveal(at) {
      if (panel.hidden || !at) return;
      const x = at[0] * V.k + V.tx, y = at[1] * V.k + V.ty, pr = panel.getBoundingClientRect(), sr = stage.getBoundingClientRect(), left = pr.left - sr.left, top = pr.top - sr.top;
      let dx = 0, dy = 0;
      if (pr.width < V.sw * .75) { if (x > left - 36) dx = left / 2 - x; }
      else if (y > top - 36) dy = top / 2 - y;
      if (dx || dy) fly([(V.sw / 2 - V.tx - dx) / V.k, (V.sh / 2 - V.ty - dy) / V.k], V.k);
    }
    function selectRoute(id) { S.selRoute = WD.rById[id] ? id : null; S.sel = null; S.selFeat = null; S.journey = null; if (S.edit) drawFx(); drawMarkers(); drawRoutes(); renderPanel(); if (S.selRoute) reveal(midOf(wayFor(WD.rById[id]))); }
    // the shortest way by the routes (by days where every route has them, else by distance on the map), around blocked ones
    function plan(to) {
      const from = WD.party.at, R = WD.routes.filter(r => !r.blocked && routeSeen(r));
      const byDays = R.every(r => travel(WD, r, wayFor(r)).days != null), w = r => { const tv = travel(WD, r, wayFor(r)); return byDays ? tv.days : plen(wayFor(r)); };
      const dist = { [from]: 0 }, prev = {}, todo = new Set(WD.locs.map(l => l.id));
      while (todo.size) {
        let u = null; for (const v of todo) if (dist[v] != null && (u == null || dist[v] < dist[u])) u = v;
        if (u == null || u === to) break; todo.delete(u);
        for (const r of R) { const v = r.from === u ? r.to : r.to === u ? r.from : null; if (!v || !todo.has(v)) continue; const d = dist[u] + w(r); if (dist[v] == null || d < dist[v]) { dist[v] = d; prev[v] = u; } }
      }
      if (dist[to] == null) return { to, legs: null, blocked: WD.routes.some(r => r.blocked && (r.from === to || r.to === to)) };
      const seq = [to]; while (seq[0] !== from) seq.unshift(prev[seq[0]]);
      return { to, legs: seq.slice(1).map((b, i) => [seq[i], b]) };
    }

    /* ---- the editor's form */
    function openDlg(html, onSave) {
      dlg.innerHTML = `<form method="dialog" class="ke">${html}<div class="ka"><button type="submit" value="cancel" formnovalidate>Cancel</button><button type="submit" value="save" class="prim">Save</button></div></form>`;
      const f = dlg.querySelector("form");
      f.addEventListener("submit", e => { if (!e.submitter || e.submitter.value !== "save") return; e.preventDefault(); if (!f.reportValidity()) return; const v = {}; for (const el of f.elements) if (el.name) v[el.name] = el.type === "checkbox" ? el.checked : el.value.trim(); if (onSave(v) !== false) closeDlg(); });
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      setTimeout(() => { const i = dlg.querySelector("input,select,textarea"); if (i) i.focus(); }, 30);
    }
    const closeDlg = () => { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
    const opt = (list, cur) => list.map(([v, l]) => `<option value="${esc(v)}"${String(cur) === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("");
    // the brush's kinds: the shape of the land, then every kind of land the world's setting may hold, in their groups
    function brushOptions() {
      const K2 = A.worldBiomes, sh = [["land", BRUSH.land], ["sea", BRUSH.sea], ["mountains", BRUSH.mountains], ["hills", BRUSH.hills], ["flat", BRUSH.flat]], wet = [["forest", "Wetter (forest grows)"], ["swamp", "Wettest (swamp)"], ["grass", "Middling (grassland)"], ["desert", "Drier (desert)"]];
      let h = `<optgroup label="The shape of the land">${opt(sh, S.brush)}</optgroup><optgroup label="How wet the land is">${opt(wet, S.brush)}</optgroup>`;
      if (K2) { h += `<optgroup label="Clear">${opt([["natural", "As the climate makes it (erase what was painted)"]], S.brush)}</optgroup>`; for (const [label, list] of K2.brushKinds(K2.settingOf(WD.look))) h += `<optgroup label="${esc(label)}">${opt(list, S.brush)}</optgroup>`; }
      return h;
    }
    function locForm(L, at) {
      const cities = Object.entries(A.cities || {}).map(([id, c]) => [id, (c && c.title) || id]);
      const kinds = Object.entries(KINDS).filter(([k]) => WD.look === "stars" ? !["village", "hamlet", "farm", "manor", "inn", "grove", "stones"].includes(k) : !["star", "planet", "moon", "asteroid", "belt", "gate", "anomaly"].includes(k)).map(([k, v]) => [k, v[1]]);
      openDlg(`<h3>${L ? "Change " + esc(L.name) : "A new place"}</h3>
        <label><span>Name</span><input name="name" maxlength="80" required value="${esc(L ? L.name : "")}"></label>
        <label><span>Kind</span><select name="kind">${opt(kinds, L ? L.kind : WD.look === "stars" ? "station" : "town")}</select></label>
        <label><span>What the party knows</span><select name="state">${opt(STATES, L ? L.state : "known")}</select></label>
        <label><span>Region (optional)</span><input name="region" maxlength="60" value="${esc(L && L.region || "")}"></label>
        <label><span>What it is (the players may read this)</span><textarea name="desc" rows="3" maxlength="1200">${esc(L && L.desc || "")}</textarea></label>
        <label><span>For the referee only</span><textarea name="gm" rows="3" maxlength="2000">${esc(L && L.gm || "")}</textarea></label>
        <label><span>Its 3D map</span><select name="city">${opt([["", "None"], ...cities], L && L.city || "")}</select></label>
        ${facList().length ? `<label><span>Held by</span><select name="owner">${opt([["", "No one in particular"], ...facList()], L && L.owner || "")}</select></label>` : ""}`, v => {
        const body = { name: v.name.slice(0, 80), kind: v.kind, state: v.state, region: v.region, desc: v.desc, gm: v.gm, city: v.city || undefined };
        if (v.owner != null) body.owner = v.owner || null;
        if (L) save("l-" + L.id, Object.assign(ownOf("l", L.id), body, L.added ? { at: L.at } : {}));
        else {
          let id = String(v.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "place"; while (WD.byId[id] || OV.loc[id]) id += "-" + Math.floor(Math.random() * 90 + 10);
          S.sel = id; S.selRoute = null;
          save("l-" + id, Object.assign(body, { at: [r1(at[0]), r1(at[1])] }));
        }
      });
    }
    function routeForm(r, from, to) {
      const a = WD.byId[r ? r.from : from], b = WD.byId[r ? r.to : to];
      const kinds = Object.entries(ROUTES).filter(([k]) => WD.look === "stars" ? !["road", "trail", "pass", "river", "rail"].includes(k) : !["lane", "jump"].includes(k));
      openDlg(`<h3>${r ? "Change the route" : "A new route"}</h3><p class="kn">${esc(a.name)} to ${esc(b.name)}</p>
        <label><span>Kind</span><select name="kind">${opt(kinds, r ? r.kind : WD.look === "stars" ? "lane" : "road")}</select></label>
        <label><span>Name (optional)</span><input name="name" maxlength="80" value="${esc(r && r.name || "")}" placeholder="e.g. The King's Road"></label>
        <label><span>Days to travel (leave empty to work it out from the map)</span><input name="days" type="number" min="0" step="0.5" value="${r && typeof r.days === "number" ? r.days : ""}"></label>
        <label><span>Danger (leave empty if none)</span><input name="danger" maxlength="200" value="${esc(r && typeof r.danger === "string" ? r.danger : r && r.danger ? "A dangerous way" : "")}"></label>
        <label><span>Blocked: why (leave empty if open)</span><input name="blocked" maxlength="200" value="${esc(r && typeof r.blocked === "string" ? r.blocked : r && r.blocked ? "The way is shut" : "")}"></label>
        <label class="wm-ck"><input type="checkbox" name="hidden"${r && r.hidden ? " checked" : ""}> Hidden from the players (a secret way)</label>
        <label><span>For the referee only</span><textarea name="gm" rows="2" maxlength="1500">${esc(r && r.gm || "")}</textarea></label>`, v => {
        const body = { kind: v.kind, name: v.name || undefined, days: v.days === "" ? undefined : Math.max(0, +v.days), danger: v.danger || undefined, blocked: v.blocked || undefined, hidden: v.hidden || undefined, gm: v.gm || undefined };
        if (r) { const own = ownOf("r", r.id); for (const k of ["name", "days", "danger", "blocked", "hidden", "gm"]) if (body[k] === undefined) own[k] = null; save("r-" + r.id, Object.assign(own, JSON.parse(JSON.stringify(body)), r.added ? { from: r.from, to: r.to } : {})); }
        else { const id = "x" + Date.now().toString(36); S.selRoute = id; S.sel = null; save("r-" + id, Object.assign({ from, to }, JSON.parse(JSON.stringify(body)))); }
      });
    }
    // the factions a realm or a place may be held by (atlas-factions.js)
    const facList = () => A.lives ? A.lives.ids().map(id => [id, facName(id)]) : [];
    const newFid = pre => pre + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10);
    // a river: its name; a realm: its name, kind, who holds it, colour, secrecy; a name on the map: its words and look
    function featForm(k, f, pts, at) {
      const body0 = f || {};
      const common = `<label><span>What the players may read (optional)</span><textarea name="desc" rows="2" maxlength="1200">${esc(body0.desc || "")}</textarea></label><label><span>For the referee only</span><textarea name="gm" rows="2" maxlength="1500">${esc(body0.gm || "")}</textarea></label>`;
      const html = k === "river" ? `<h3>${f ? "Change the river" : "A new river"}</h3>
          <label><span>Name (optional)</span><input name="name" maxlength="80" value="${esc(body0.name || "")}" placeholder="e.g. The Mere"></label>
          <label><span>How wide</span><select name="w">${opt([[.8, "A brook or creek"], [1.2, "A stream"], [1.8, "A river"], [2.8, "A wide river"], [4, "A great river"]], body0.w || 1.8)}</select></label>
          <label><span>What flows in it</span><select name="liquid">${opt([["", "Water (ice where the land is frozen)"], ["frozen", "Frozen"], ["lava", "Lava"], ["glowing", "Glowing, magical water"], ["cursed", "Cursed, black water"], ["acid", "Acid"], ["methane", "Methane"], ["alien", "An alien liquid"]], body0.liquid || "")}</select></label>${common}`
        : k === "realm" ? `<h3>${f ? "Change " + esc(f.name || "the realm") : WD.look === "stars" ? "A new territory" : "A new realm"}</h3>
          <label><span>Name</span><input name="name" maxlength="80" required value="${esc(body0.name || "")}" placeholder="e.g. The Kingdom of Aldmere"></label>
          <label><span>Kind</span><select name="kind">${opt(REALM_KINDS, body0.kind || (WD.look === "stars" ? "territory" : "kingdom"))}</select></label>
          ${facList().length ? `<label><span>Held by</span><select name="owner">${opt([["", "No faction of the campaign"], ...facList()], body0.owner || "")}</select></label>` : ""}
          <label><span>Colour</span><select name="colour">${opt([["", "Its own (or its faction's)"], ["#8a2432", "Crimson"], ["#2f6b3a", "Green"], ["#2b5d8a", "Blue"], ["#9a6a12", "Gold"], ["#6b3a8a", "Purple"], ["#2f7a7a", "Teal"], ["#8a4b24", "Rust"], ["#555f6b", "Slate"]], body0.colour || "")}</select></label>
          <label class="wm-ck"><input type="checkbox" name="hidden"${body0.hidden ? " checked" : ""}> Hidden from the players (a secret claim, a hidden domain)</label>${common}`
        : `<h3>${f ? "Change the name" : "A name on the map"}</h3>
          <label><span>The words</span><input name="name" maxlength="60" required value="${esc(body0.name || "")}" placeholder="e.g. The Sundering Sea"></label>
          <label><span>What it names</span><select name="kind">${opt(LABEL_KINDS, body0.kind || "region")}</select></label>
          <label><span>Size</span><select name="size">${opt([[12, "Small"], [18, "Middling"], [26, "Large"], [36, "Very large"]], body0.size || 18)}</select></label>
          <label><span>Slant (degrees, optional)</span><input name="angle" type="number" min="-90" max="90" step="5" value="${body0.angle || ""}"></label>`;
      openDlg(html, v => {
        const body = k === "river" ? { name: v.name || null, w: +v.w || 1.8, liquid: v.liquid || null, desc: v.desc || null, gm: v.gm || null }
          : k === "realm" ? { name: v.name.slice(0, 80), kind: v.kind, owner: v.owner || null, colour: v.colour || null, hidden: !!v.hidden, desc: v.desc || null, gm: v.gm || null }
          : { name: v.name.slice(0, 60), kind: v.kind, size: +v.size || 18, angle: v.angle === "" ? 0 : clamp(+v.angle || 0, -90, 90) };
        if (f) { save("f-" + f.id, Object.assign(ownOf("f", f.id), body, f.added ? { type: k, pts: f.pts, at: f.at } : {})); return; }
        const id = newFid(k === "river" ? "v" : k === "realm" ? "g" : "n"); S.selFeat = id; S.sel = null; S.selRoute = null;
        save("f-" + id, JSON.parse(JSON.stringify(Object.assign({ type: k }, body, pts ? { pts } : {}, at ? { at } : {}))));
      });
    }
    // a river or realm drawn corner by corner: done
    function finishDraft() {
      const D = S.draft; if (!D) return;
      // (a double click gives the last corner twice)
      D.pts = D.pts.filter((q, i) => !i || Math.hypot(q[0] - D.pts[i - 1][0], q[1] - D.pts[i - 1][1]) > 1.5);
      const need = D.type === "realm" ? 3 : 2;
      if (D.pts.length < need) { note(D.type === "realm" ? "A realm needs three corners at least." : "A river needs two points at least."); return; }
      S.draft = null; S.cur = null; S.tool = null; renderBars(); drawFx();
      featForm(D.type, null, D.pts.map(p => [r1(p[0]), r1(p[1])]));
    }
    // the world as the referee has left it, written as world.js, to give back to the campaign
    function exportJS() {
      const W0 = A.worldData || {}, keep = (o, ks) => { const x = {}; for (const k of ks) if (o[k] != null && o[k] !== "") x[k] = o[k]; return x; };
      const out = Object.assign(keep(W0, ["title", "look", "size", "scale", "speeds"]), {
        locations: WD.locs.map(l => keep(Object.assign({}, l, { at: [r1(l.at[0]), r1(l.at[1])] }), ["id", "name", "kind", "at", "city", "state", "region", "owner", "desc", "gm", "people", "events", "tags"])),
        routes: WD.routes.map(r => keep(r, ["id", "from", "to", "kind", "name", "via", "days", "danger", "blocked", "hidden", "desc", "gm", "enc"])),
        party: WD.party
      });
      // the land as reshaped, and the rivers and names: those the land came with (world-terrain.js) stay there, so the
      // ones removed or changed on the page are named in hide: and the changed ones written here as the campaign's own
      const fromLand = f => /^t/.test(f.id) && !f.added, hide = [...new Set([].concat(W0.hide || []))];
      const T0 = A.worldTerrainData || {};
      for (const [k, list] of [["t", T0.rivers], ["tl", T0.labels]]) (list || []).forEach((f, i) => { const id = (f && f.id) || k + i, now = (k === "t" ? WD.rivers : WD.labels).find(x => x.id === id); if ((!now || now.edited) && !hide.includes(id)) hide.push(id); });
      const own = (list, ks) => list.filter(f => f.id && (!fromLand(f) || f.edited)).map(f => keep(Object.assign({}, f, fromLand(f) ? { id: "w-" + f.id } : {}), ks));
      const rivers = own(WD.rivers, ["id", "name", "pts", "w", "desc", "gm"]), labels = own(WD.labels, ["id", "name", "kind", "at", "angle", "size"]), realms = WD.realms.map(g => keep(g, ["id", "name", "kind", "pts", "owner", "colour", "hidden", "at", "desc", "gm"]));
      if (rivers.length) out.rivers = rivers; if (labels.length) out.labels = labels; if (realms.length) out.realms = realms; if (hide.length) out.hide = hide;
      if (WD.shape.base || WD.shape.strokes.length) out.shape = { base: WD.shape.base || undefined, strokes: WD.shape.strokes };
      const js = `// world.js, as the referee left it on the page on ${new Date().toISOString().slice(0, 10)}. Put it in the campaign folder in place of\n// the old one, then: node atlas.js world <campaign> (keeps the land), check and build.\nATLAS.world(${JSON.stringify(out, null, 2)});\n`;
      dlg.innerHTML = `<div class="ke"><h3>Copy as world.js</h3><p class="kn">Everything on this map, with your changes, as the campaign's world.js.</p><textarea rows="14" readonly class="wm-js">${esc(js)}</textarea><div class="ka"><button type="button" data-w="dlgclose">Close</button><button type="button" class="prim" data-w="copy">Copy</button></div></div>`;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      const ta = dlg.querySelector("textarea"); ta.focus(); ta.select();
    }
    let sure = null;
    function twice(btn, fn) {
      if (sure === btn) { sure = null; fn(); return; }
      sure = btn; btn.dataset.lbl = btn.textContent; btn.textContent = "Really?"; btn.classList.add("sure");
      setTimeout(() => { if (sure === btn) { btn.textContent = btn.dataset.lbl; btn.classList.remove("sure"); sure = null; } }, 4000);
    }
    const setParty = p => save("party", { at: p.at || null, plan: p.plan || [], trail: (p.trail || []).slice(-60) });

    /* ---- events */
    const ptr = new Map(); let gest = null, moved = false, downAt = null;
    const local = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const world = (sx, sy) => [(sx - V.tx) / V.k, (sy - V.ty) / V.k];
    function onDown(e) {
      if (e.button && e.button !== 0) return;
      if (e.target.closest(".wm-panel, .wm-ctl, .wm-results, .wm-journey")) return;
      stage.focus({ preventScroll: true });
      const p = local(e); ptr.set(e.pointerId, p); moved = false; if (ptr.size === 1) downAt = e.target;
      const m = e.target.closest(".wl");
      if (ptr.size === 1) {
        gest = { p0: p, t0: [V.tx, V.ty], loc: S.edit && gm() && !S.tool && m ? m.dataset.loc : null };
        // the brush paints from the first touch; a river, a realm or a name is picked up to be moved, or by a corner
        if (S.edit && gm() && S.tool === "brush" && WD.G) { S.stroke = { m: S.brush, r: S.size, p: [world(p[0], p[1]).map(Math.round)] }; gest.brush = true; drawFx(); }
        else if (S.edit && gm() && !S.tool && !m) {
          const vx = e.target.closest("[data-vx]"), fe = e.target.closest(".wm-fx [data-feat], .wm-rk");
          const id = vx ? S.selFeat : fe ? fe.dataset.feat : null, [k, f] = id ? featOf(id) : [null, null];
          if (f && f.id) gest.feat = { id, k, f, w0: world(p[0], p[1]), vx: vx ? +vx.dataset.vx : null };
        }
      } else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; gest = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), k: V.k, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], t0: [V.tx, V.ty] }; }
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function onMove(e) {
      const p = local(e);
      if (!ptr.has(e.pointerId)) { if (S.edit && (S.tool === "brush" || S.draft)) { S.cur = world(p[0], p[1]); drawFx(); } hover(e, p); return; }
      ptr.set(e.pointerId, p);
      if (!gest) return;
      if (gest.brush && S.stroke) {
        const w = world(p[0], p[1]), last = S.stroke.p[S.stroke.p.length - 1]; S.cur = w; moved = true;
        if (Math.hypot(w[0] - last[0], w[1] - last[1]) > S.size / 4) S.stroke.p.push([Math.round(w[0]), Math.round(w[1])]);
        drawFx(); return;
      }
      if (gest.pinch && ptr.size >= 2) {
        const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const k = clamp(gest.k * d / gest.pinch, V.k0 * .6, V.k0 * 16), wx = (gest.mid[0] - gest.t0[0]) / gest.k, wy = (gest.mid[1] - gest.t0[1]) / gest.k;
        V.k = k; V.tx = mid[0] - wx * k; V.ty = mid[1] - wy * k; bound(); anim = null; moved = true; request(); return;
      }
      const dx = p[0] - gest.p0[0], dy = p[1] - gest.p0[1];
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true; tip.hidden = true;
      if (gest.feat) {
        const G0 = gest.feat, w = world(p[0], p[1]), dx = w[0] - G0.w0[0], dy = w[1] - G0.w0[1], f = G0.f, mv = q => [r1(clamp(q[0] + dx, 0, W)), r1(clamp(q[1] + dy, 0, H))], n = {};
        if (G0.vx != null) n.pts = f.pts.map((q, i) => i === G0.vx ? mv(q) : q);
        else { if (f.pts) n.pts = f.pts.map(mv); if (f.at) n.at = mv(f.at); }
        S.fdrag = { id: G0.id, f: Object.assign({}, f, n), patch: n }; drawFx(); return;
      }
      if (gest.loc) { const L = WD.byId[gest.loc], w = world(p[0], p[1]); L.at = [clamp(w[0], 0, W), clamp(w[1], 0, H)]; S.drag = gest.loc; ways.clear(); drawRoutes(); place(); return; }
      anim = null; V.tx = gest.t0[0] + dx; V.ty = gest.t0[1] + dy; bound(); request();
    }
    function onUp(e) {
      const had = ptr.has(e.pointerId); ptr.delete(e.pointerId);
      if (!had) return;
      if (ptr.size === 1 && gest && gest.pinch) { const [q] = [...ptr.values()]; gest = { p0: q, t0: [V.tx, V.ty] }; return; }
      if (ptr.size) return;
      const g = gest; gest = null;
      if (g && g.brush) { const s = S.stroke; S.stroke = null; if (s && s.p.length) addStroke(s); else drawFx(); return; }
      if (g && g.feat && moved && S.fdrag) { const d = S.fdrag; S.fdrag = null; S.selFeat = d.id; save("f-" + d.id, Object.assign(ownOf("f", d.id), d.patch)); return; }
      if (g && g.loc && moved) { const L = WD.byId[g.loc]; S.drag = null; save("l-" + L.id, Object.assign(ownOf("l", L.id), { at: [r1(L.at[0]), r1(L.at[1])] }, L.added ? { name: L.name, kind: L.kind, state: L.state } : {})); return; }
      if (moved) return;
      click(downAt, local(e));
    }
    // a click: the element pressed (the stage holds the pointer while it is down, so the release cannot say)
    function click(target, p) {
      const m = target && target.closest ? target.closest(".wl") : null, r = target && target.closest ? target.closest("[data-route]") : null;
      if (S.tool === "loc") { S.tool = null; renderBars(); locForm(null, world(p[0], p[1])); return; }
      if (S.tool === "brush") return;
      if (S.tool === "label") { S.tool = null; renderBars(); featForm("label", null, null, world(p[0], p[1]).map(r1)); return; }
      if (S.tool === "river" || S.tool === "realm") {
        if (!S.draft || S.draft.type !== S.tool) S.draft = { type: S.tool, pts: [] };
        const dv = target && target.closest ? target.closest("[data-dv]") : null;
        if (dv && +dv.dataset.dv === 0 && S.tool === "realm" && S.draft.pts.length > 2) { finishDraft(); return; }
        S.draft.pts.push(world(p[0], p[1]).map(r1)); renderBars(); drawFx(); return;
      }
      if (S.tool === "route") {
        if (!m) return;
        if (!S.first) { S.first = m.dataset.loc; renderBars(); select(S.first); return; }
        if (m.dataset.loc === S.first) return;
        const a = S.first; S.first = null; S.tool = null; renderBars(); routeForm(null, a, m.dataset.loc); return;
      }
      if (m) { select(m.dataset.loc); return; }
      if (r) { selectRoute(r.dataset.route); return; }
      const fe = target && target.closest ? target.closest("[data-feat]") : null;
      if (fe) { selectFeat(fe.dataset.feat); return; }
      if (S.sel || S.selRoute || S.selFeat) { S.sel = null; S.selRoute = null; S.selFeat = null; S.journey = null; drawMarkers(); drawRoutes(); drawFx(); renderPanel(); }
    }
    function selectFeat(id) { S.selFeat = featOf(id)[1] ? id : null; S.sel = null; S.selRoute = null; S.journey = null; drawMarkers(); drawRoutes(); drawFx(); renderPanel(); }
    function hover(e, p) {
      const m = e.target.closest && e.target.closest(".wl"), r = !m && e.target.closest && e.target.closest("[data-route]");
      const id = m ? m.dataset.loc : null;
      if (id !== S.hover) { S.hover = id; place(); }
      if (m) {
        const L = WD.byId[id], pl = placesOf(L).length;
        tip.innerHTML = `<strong>${esc(L.name)}</strong> · ${esc((KINDS[L.kind] || [0, L.kind])[1])}${L.state !== "known" ? " · " + esc((STATES.find(s => s[0] === L.state) || [0, ""])[1]) : ""}${L.city && ctx.hasCity(L.city) ? " · 3D map" : ""}${pl ? ` · ${pl} place${pl > 1 ? "s" : ""}` : ""}${L.desc ? `<br><span>${esc(L.desc.length > 120 ? L.desc.slice(0, 117) + "…" : L.desc)}</span>` : ""}`;
      } else if (r) {
        const R = WD.rById[r.dataset.route]; if (!R) { tip.hidden = true; return; }
        const tv = travel(WD, R, wayFor(R));
        tip.innerHTML = `<strong>${esc(R.name || ROUTES[R.kind] || R.kind)}</strong> · ${esc(WD.byId[R.from].name)} to ${esc(WD.byId[R.to].name)}${tv.dist != null ? " · " + esc(distText(WD, tv.dist)) : ""}${tv.days != null ? " · " + esc(daysText(tv.days)) : ""}${R.blocked ? "<br><span>Blocked</span>" : R.danger ? "<br><span>Dangerous</span>" : ""}`;
      } else { tip.hidden = true; return; }
      tip.hidden = false;
      const x = Math.min(p[0] + 16, V.sw - tip.offsetWidth - 8), y = p[1] + 18 + tip.offsetHeight > V.sh ? p[1] - tip.offsetHeight - 10 : p[1] + 18;
      tip.style.transform = `translate(${Math.round(Math.max(4, x))}px, ${Math.round(y)}px)`;
    }
    function onWheel(e) { if (e.target.closest(".wm-panel, .wm-results, .wm-journey")) return; e.preventDefault(); const p = local(e); zoomAt(Math.exp(-(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * .0016), p[0], p[1]); }
    function onKey(e) {
      if (e.target.closest && e.target.closest("input, textarea, select, .wm-panel")) return;
      if ((e.ctrlKey || e.metaKey) && S.edit && gm() && /^[zy]$/i.test(e.key)) { e.preventDefault(); undo(!(e.key.toLowerCase() === "y" || e.shiftKey)); return; }
      if (S.draft && e.key === "Enter") { e.preventDefault(); finishDraft(); return; }
      if (S.draft && e.key === "Backspace") { e.preventDefault(); S.draft.pts.pop(); renderBars(); drawFx(); return; }
      const step = 60;
      if (e.key === "ArrowLeft") V.tx += step; else if (e.key === "ArrowRight") V.tx -= step; else if (e.key === "ArrowUp") V.ty += step; else if (e.key === "ArrowDown") V.ty -= step;
      else if (e.key === "+" || e.key === "=") { zoomAt(1.4, V.sw / 2, V.sh / 2); e.preventDefault(); return; }
      else if (e.key === "-") { zoomAt(1 / 1.4, V.sw / 2, V.sh / 2); e.preventDefault(); return; }
      else if (e.key === "Escape") { if (S.tool) { S.tool = null; S.first = null; S.draft = null; S.cur = null; renderBars(); drawFx(); } else { S.sel = null; S.selRoute = null; S.selFeat = null; drawMarkers(); drawRoutes(); drawFx(); renderPanel(); } return; }
      else if (e.key === "Enter" && e.target.closest && e.target.closest(".wl")) { select(e.target.closest(".wl").dataset.loc); return; }
      else return;
      e.preventDefault(); anim = null; bound(); request();
    }
    function onClick(e) {
      const t = e.target; if (!t.closest) return;
      // (the zoom buttons only: the map itself carries data-z, how close it is, for its art)
      const z = t.closest(".wm-ctl [data-z]");
      if (z) { const d = z.dataset.z; if (d === "in") zoomAt(1.6, V.sw / 2, V.sh / 2); else if (d === "out") zoomAt(1 / 1.6, V.sw / 2, V.sh / 2); else if (d === "home") home(); else if (document.fullscreenElement) document.exitFullscreen(); else if (root.requestFullscreen) root.requestFullscreen().catch(() => {}); return; }
      const o = t.closest("[data-wopen]"); if (o) { ctx.open(o.dataset.wopen); return; }
      const wl = t.closest("[data-wloc]"); if (wl) { select(wl.dataset.wloc, true); return; }
      const wf = t.closest("[data-wfeat]"); if (wf) { selectFeat(wf.dataset.wfeat); return; }
      const wr = t.closest("[data-wroute]"); if (wr) { selectRoute(wr.dataset.wroute); const m = midOf(wayFor(WD.rById[wr.dataset.wroute])); fly(m, V.k); return; }
      const ws = t.closest("[data-wstate]"); if (ws && S.sel) { const L = WD.byId[S.sel]; save("l-" + L.id, Object.assign(ownOf("l", L.id), { state: ws.dataset.wstate }, L.added ? { name: L.name, kind: L.kind, at: L.at } : {})); return; }
      const b = t.closest("[data-w]"); if (!b) return;
      const L = S.sel && WD.byId[S.sel], R = S.selRoute && WD.rById[S.selRoute], P = WD.party;
      switch (b.dataset.w) {
        case "close": S.sel = null; S.selRoute = null; S.selFeat = null; S.journey = null; drawMarkers(); drawRoutes(); drawFx(); renderPanel(); break;
        case "brush": case "river": case "realm": case "label": { const w = b.dataset.w; S.tool = S.tool === w ? null : w; S.first = null; S.draft = null; S.cur = null; if (S.tool) { S.sel = null; S.selRoute = null; S.selFeat = null; renderPanel(); } renderBars(); drawFx(); break; }
        case "base": save("shape", { base: b.dataset.base, strokes: (OV.shape && OV.shape.strokes) || [] }); break;
        case "finish": finishDraft(); break;
        case "undo": undo(true); break;
        case "redo": undo(false); break;
        case "editfeat": { const [k, f] = featOf(S.selFeat); if (f) featForm(k, f); break; }
        case "dupfeat": { const [k, f] = featOf(S.selFeat); if (!f) break; const id = newFid(k === "river" ? "v" : "g"), sh = q => [r1(clamp(q[0] + 24, 0, W)), r1(clamp(q[1] + 24, 0, H))]; const c = JSON.parse(JSON.stringify(Object.assign({}, f, { type: k, pts: f.pts.map(sh) }, f.at ? { at: sh(f.at) } : {}))); delete c.id; delete c.added; delete c.edited; delete c.mid; S.selFeat = id; save("f-" + id, c); break; }
        case "delfeat": { const [, f] = featOf(S.selFeat); if (f) twice(b, () => { S.selFeat = null; save("f-" + f.id, f.added ? null : { gone: true }); }); break; }
        case "resetfeat": if (S.selFeat) save("f-" + S.selFeat, null); break;
        case "duploc": if (L) { let id = L.id + "-2"; while (WD.byId[id] || OV.loc[id]) id = L.id + "-" + Math.floor(Math.random() * 900 + 100); const c = {}; for (const k of ["name", "kind", "state", "region", "owner", "desc", "gm"]) if (L[k] != null) c[k] = L[k]; c.name = L.name + " (copy)"; c.at = [r1(clamp(L.at[0] + 22, 0, W)), r1(clamp(L.at[1] + 16, 0, H))]; S.sel = id; save("l-" + id, c); } break;
        case "enter": if (L && L.city) ctx.enter(L.city, L.id); break;
        case "make": if (L && ctx.makeCity) { b.disabled = true; b.textContent = "Making the map…"; Promise.resolve(ctx.makeCity(L, WD)).catch(err => { b.disabled = false; b.textContent = "Make its 3D map now"; note("The map could not be made: " + ((err && err.message) || err)); }); } break;
        case "edit": S.edit = !S.edit; S.tool = null; S.first = null; S.draft = null; S.cur = null; root.classList.toggle("editing", S.edit); renderBars(); renderPanel(); drawFx(); break;
        case "addloc": S.tool = S.tool === "loc" ? null : "loc"; S.first = null; renderBars(); break;
        case "addroute": S.tool = S.tool === "route" ? null : "route"; S.first = null; renderBars(); break;
        case "export": exportJS(); break;
        case "newworld": newWorldDlg(); break;
        case "currents": CUR.on = !CUR.on; try { ctx.store.set("world-currents", CUR.on ? "1" : "0"); } catch (_) {} drawCurrents(); renderBars(); break;
        case "coasts": COA.on = !COA.on; try { ctx.store.set("world-coasts", COA.on ? "1" : "0"); } catch (_) {} drawCoasts(); renderBars(); break;
        case "curnames": CUR.names = !CUR.names; try { ctx.store.set("world-curnames", CUR.names ? "1" : "0"); } catch (_) {} drawCurrents(); renderBars(); break;
        case "drawn": DRAW.mode = drawn() ? "redrawn" : "drawn"; try { ctx.store.set("world-drawn", DRAW.mode); } catch (_) {} drawLand(); renderBars(); break;
        case "copy": { const ta = dlg.querySelector("textarea"); ta.select(); const done = () => { b.textContent = "Copied"; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => { try { document.execCommand("copy"); done(); } catch (_) {} }); else { try { document.execCommand("copy"); done(); } catch (_) {} } break; }
        case "dlgclose": closeDlg(); break;
        case "editloc": if (L) locForm(L); break;
        case "delloc": if (L) twice(b, () => { const id = L.id, own = WD.routes.filter(r => r.added && (r.from === id || r.to === id)).map(r => r.id); S.sel = null; for (const rid of own) save("r-" + rid, null); save("l-" + id, L.added ? null : { gone: true }); }); break;
        case "resetloc": if (L) save("l-" + L.id, null); break;
        case "editroute": if (R) routeForm(R); break;
        case "delroute": if (R) twice(b, () => { S.selRoute = null; save("r-" + R.id, R.added ? null : { gone: true }); }); break;
        case "resetroute": if (R) save("r-" + R.id, null); break;
        case "partyhere": if (L) setParty({ at: L.id, plan: [], trail: P.at && P.at !== L.id ? [...P.trail, P.at] : P.trail }); break;
        case "plan": if (L && P.at) { S.journey = plan(L.id); drawJourney(); renderPanel(); } break;
        case "setoff": if (S.journey && S.journey.legs) { const pl = S.journey.legs.map(l => l[1]); S.journey = null; setParty({ at: P.at, plan: pl, trail: P.trail }); } break;
        case "arrive": if (P.plan.length) setParty({ at: P.plan[0], plan: P.plan.slice(1), trail: [...P.trail, P.at] }); break;
        case "cancel": setParty({ at: P.at, plan: [], trail: P.trail }); break;
      }
    }
    function onChange(e) {
      const t = e.target;
      // the map drawn another way: kept with the world (the players' screen and copy follow)
      if (t.matches(".wm-look")) { if (gm()) save("style", { look: t.value }); return; }
      if (t.matches("[data-wb]")) { if (t.dataset.wb === "m") { S.brush = t.value; renderBars(); } else S.size = +t.value || 30; drawFx(); return; }
      if (t.matches("[data-fk]")) filt.kinds[t.dataset.fk] = t.checked;
      else if (t.matches("[data-fr]")) filt.routes[t.dataset.fr] = t.checked;
      else if (t.matches("[data-fknow]")) filt.know = t.value;
      else if (t.matches("[data-f3]")) filt.only3d = t.checked;
      else return;
      try { ctx.store.set("world-filter", JSON.stringify(filt)); } catch (_) {}
      drawRoutes(); drawMarkers();
    }
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.addEventListener("pointerleave", () => { if (!ptr.size) { tip.hidden = true; if (S.hover) { S.hover = null; place(); } } });
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("dblclick", e => { if (e.target.closest(".wm-panel, .wm-ctl")) return; if (S.draft) { finishDraft(); return; } if (S.tool === "brush") return; const p = local(e); zoomAt(1.8, p[0], p[1]); });
    stage.addEventListener("keydown", onKey);
    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    // (the brush's size follows the slider as it moves: the circle on the map grows and shrinks with it)
    root.addEventListener("input", e => { const t = e.target; if (!t.matches || !t.matches('[data-wb="r"]')) return; S.size = +t.value || 30; const o = box.querySelector(".wm-bsz"); if (o) o.textContent = S.size; drawFx(); });
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (!started) wake(); else if (size()) { bound(); request(); } }) : null;
    if (ro) ro.observe(stage);

    /* ---- search: the page's own search box drives it (ctl.search) */
    function search(q) {
      S.q = String(q || "").trim().toLowerCase();
      const res = $(".wm-results");
      if (!S.q) { S.hits = null; res.hidden = true; drawMarkers(); return; }
      const hits = [];
      for (const L of WD.locs) {
        if (!seen(L)) continue;
        const why = [];
        if ([L.name, L.region, (KINDS[L.kind] || [0, L.kind])[1], L.desc, ...(L.tags || [])].join(" ").toLowerCase().includes(S.q)) why.push("");
        for (const p of placesOf(L)) if (p.name.toLowerCase().includes(S.q)) why.push(p.name);
        if (gm() && ctx.peopleAt) for (const p of ctx.peopleAt(L, placesOf(L))) if (p.name.toLowerCase().includes(S.q)) why.push(p.name);
        if (why.length) hits.push([L, why.filter(Boolean)]);
      }
      S.hits = new Set(hits.map(h => h[0].id));
      res.hidden = false;
      res.innerHTML = hits.length ? `<ul>${hits.slice(0, 12).map(([L, why]) => `<li><button type="button" data-wloc="${esc(L.id)}"><strong>${esc(L.name)}</strong>${why.length ? `<span class="kn"> · ${esc(why.slice(0, 2).join(", "))}${why.length > 2 ? "…" : ""}</span>` : ""}</button></li>`).join("")}</ul>` : `<p class="kn">Nothing on the map matches.</p>`;
      drawMarkers();
    }

    /* ---- first paint */
    drawLand(); drawCurrents(); drawCoasts(); renderBars();
    if (DRAW) {
      // trace the picture once it has loaded; the map is drawn again from what was found
      const img = new Image();
      img.onload = () => {
        if (gone) return;
        try { DRAW.trace = traceDrawing(img, W, H, (WD.W && WD.W.features) || []); } catch (e) { console.warn("world map: the drawing could not be traced", e); return; }
        if (!DRAW.mode) DRAW.mode = DRAW.trace.ok ? "redrawn" : "drawn";
        traced(); PG = null; ways.clear(); drawLand(); drawRoutes(); drawMarkers(); renderBars();
      };
      img.src = DRAW.src;
    }
    function wake() {
      if (!size()) return;
      if (!started) {
        started = true;
        let v = null; try { v = JSON.parse(ctx.store.get("world-view") || "null"); } catch (e) {}
        if (v && v.z > 0) fly([v.cx, v.cy], v.z * V.k0, true); else home(true);
        const s = ctx.store.get("world-sel"); if (s && WD.byId[s]) S.sel = s;
        drawRoutes(); drawMarkers(); renderPanel();
      } else { bound(); request(); }
    }
    wake();
    return {
      wake, search,
      // choose a place from outside (the way back from a city): the world stays as it was left when that place is
      // already the chosen one; otherwise it is chosen and brought into view at the same zoom
      select(id) { wake(); if (!WD.byId[id] || S.sel === id) return; select(id); const L = WD.byId[id], x = L.at[0] * V.k + V.tx, y = L.at[1] * V.k + V.ty; if (x < 30 || y < 30 || x > V.sw - 30 || y > V.sh - 30) fly(L.at, V.k); else reveal(L.at); },
      // what the page changed (the referee/player switch, a place's status): draw again
      // (and the world laid out again: the players' copy gets a new world from the game master's page)
      sync() { if (!gm()) { S.edit = false; S.tool = null; S.draft = null; root.classList.remove("editing"); } rebuild(); },
      locationOf(cityId) { const L = WD.locs.find(l => l.city === cityId); return L ? L.id : null; },
      name(id) { return WD.byId[id] ? WD.byId[id].name : ""; },
      dispose() { gone = true; if (ro) ro.disconnect(); if (raf) cancelAnimationFrame(raf); box.innerHTML = ""; }
    };
  };

  // for the checker (atlas.js check) and the generator
  A.worldKit = { prepareWorld, KINDS, ROUTES, STATES, LOOK_OF, SETTLED, OVERLAND, travel, plen, unb64 };
})(ATLAS);
