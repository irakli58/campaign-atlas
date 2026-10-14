/* ================================================================
   CAMPAIGN ATLAS: THE CITY MAP
   A town generated from a seed, standing as small 3D buildings on a printed street plan, with the campaign's
   places numbered on it. The campaign supplies the skeleton (main roads, water, parks, districts, where each place
   stands) with ATLAS.city({...}); the streets between, the houses, lamps and trees are grown from it, the same on
   every visit. Two looks: "old" (pitched roofs, chimneys, an aged paper plan) and "modern" (flat roofs, taller
   blocks, a clean plan). The data format is in references/data-format.md.

   Rules this file keeps, each learned the hard way (references/standards.md, "The overview map"):
   - nothing on the ground moves with the camera or changes with zoom: the plan is printed once, in sharp tiles;
   - the table under the sheet is drawn first and never written to the depth buffer; the near plane follows the view;
   - the plan's grain is soft and tied to the plan, never one random value per pixel;
   - things thinner than a pixel (lamp posts, chimneys, trunks) are hidden when the view is far;
   - streets and houses run to the edge of the sheet: no fade, no thinning, nothing standing off the sheet;
   - if 3D cannot start, or the graphics card gives up, a flat map takes its place.
   ================================================================ */
(function (A) {
  "use strict";
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const h01 = i => { let t = Math.imul(i + 1, 2654435761) >>> 0; t ^= t >>> 15; return ((Math.imul(t, 2246822519) >>> 0) % 1000) / 1000; };

  // names for the streets the generator grows (a campaign may give its own: names: { pool: [...], suffix: [[...], [...], [...]] })
  const NAMES = ["Swan", "Crown", "Anchor", "Mitre", "Bell", "Angel", "Hope", "Plough", "Black Horse", "Red Lion", "White Hart", "Pump", "Well", "Tenter", "Gun", "Dyer", "Tanner", "Cooper", "Chandler", "Weaver", "Salter", "Fuller", "Wheeler", "Turner", "Sun", "Moon", "Harrow", "Blue Anchor", "Three Colts", "Three Cups", "Seven Stars", "Magpie", "Cock", "Hand", "Feathers", "Ship", "Coach", "Wool", "Shovel", "Rope", "Sugar", "Tallow", "Candle", "Lamb", "Hog", "Pear Tree", "Elder", "Ivy", "Vine", "Cherry", "Fig Tree", "Cinnamon", "Pepper", "Hawser", "Tackle", "Capstan", "Tar", "Pitch", "Gravel", "Paradise", "Mulberry", "Old Castle", "Raven", "Rook", "Fair", "Cold", "Bucket", "Kettle", "Ladle", "Thimble", "Needle", "Bobbin", "Spindle", "Shuttle", "Loom", "Mill", "Chapel", "Market", "Bridge", "Water", "Friar", "Abbey", "Mint", "Garden", "Orchard", "Meadow", "Quarry", "Forge", "Tannery", "Brewer", "Baker", "Butcher", "Glover", "Mason", "Sawyer", "Carter", "Fisher", "Shepherd", "Falcon", "Stag", "Hart", "Boar", "Bear", "Lion", "Unicorn", "Griffin", "Star", "Compass", "Lantern", "Beacon", "Harbour", "Quay", "Ferry", "Lock", "Weir", "Ford", "Spring", "Brook", "Marsh", "Heath", "Holly", "Ash", "Elm", "Oak", "Willow", "Hazel", "Rowan", "Thorn"];
  const SUFFIX = [["Street", "Street", "Street", "Road", "Row", "Place", "Street"], ["Lane", "Street", "Row", "Walk", "Place", "Passage", "Street", "Lane"], ["Alley", "Court", "Yard", "Passage", "Rents", "Court", "Yard", "Buildings", "Place"]];

  // The two looks. A campaign may also pass its own object, laid over "old".
  const LOOKS = {
    old: {
      age: true, chimneys: true, crooked: .6, table: 0xe9dfc6, night: 0x121513, landmark: 0xf3e9cf, pub: "#5a4636", flat: "#4c4741",
      tall: () => 1, pitched: () => true,
      brick: ["#a5826a", "#9a7a63", "#ad8b70", "#a08068", "#b29176", "#9c7c66", "#a88770"], stone: ["#cbbb9c", "#d3c4a6", "#c2b293", "#cfbf9f", "#c6b697"],
      ware: ["#8e6e58", "#86684f", "#957560", "#8a6c58"], slate: ["#7d776d", "#857e73", "#75706a", "#8a8276", "#6f6b64"], tile: ["#9c6c52", "#916450", "#a5745a"],
      plan: { INK: "#2e241b", PAPER: "#efe5cc", BLOCK: "#ddcba4", ROADF: "#f4ecd7", MAJORF: "#f1dfb5", WATERC: "#b4c1b4", PARKC: "#cfd1a6", FOOT: "#cdb88f", LOT: "#e8dcbf", WHARF: "#cbb791", RAILC: "#c9b48c", HATCH: "rgba(96,66,36,.13)", FORTC: "#e3d6b8" },
      abbr: { pubs: "P.H.", churches: "Ch.", chapels: "Chap.", schools: "Sch.", gas: "Gas Works" }
    },
    modern: {
      age: false, chimneys: false, crooked: .15, table: 0xe3e6e4, night: 0x101417, landmark: 0xf3f4f2, pub: "#6b5a4a", flat: "#6a7077",
      // most blocks are a few storeys, about one in twenty is a tower; churches keep their height
      tall: (i, b) => (b.type === "church" || b.type === "chapel") ? 1 : b.type === "back" ? 1.3 : h01(i) < .05 ? 4.2 + h01(i + 7) * 3 : 1.5 + h01(i + 3) * 1.4,
      pitched: (i, b) => b.type === "church" || b.type === "chapel" || h01(i + 11) < .12,
      brick: ["#c6cacd", "#b6bcc2", "#d2d4d3", "#9fb0bf", "#bfc6cb", "#cbc5b8", "#d6d1c6"], stone: ["#e1e4e6", "#d5dadd", "#e9ebeb", "#dedad0", "#c9d6e0"],
      ware: ["#8d949b", "#7e868e", "#959ca3", "#878e95"], slate: ["#6c7178", "#5f656c", "#777c83", "#666b72", "#7d8288"], tile: ["#8a6f62", "#7d665b", "#93786a"],
      plan: { INK: "#2b3138", PAPER: "#eef0ee", BLOCK: "#dfe2e0", ROADF: "#ffffff", MAJORF: "#fbe9b7", WATERC: "#aecbe0", PARKC: "#cfe3c2", FOOT: "#c9cdd0", LOT: "#e9ece9", WHARF: "#c3c8cc", RAILC: "#c9ccd0", HATCH: "rgba(60,70,80,.07)", FORTC: "#d9dcd8" },
      flats: ["#b5b9bd", "#a4a9ae", "#c3c5c4", "#9aa0a6", "#bcb7ac", "#8f969d"],
      abbr: { pubs: "", churches: "Ch.", chapels: "", schools: "Sch.", gas: "" }
    }
  };
  // The looks by the name of their age. "old" is the industrial age: brick terraces, slate, chimney pots, gas lamps.
  LOOKS.industrial = LOOKS.old;
  // Before it: plaster and timber, thatch and tile, steep roofs, no street lamps, no factory stacks.
  LOOKS.medieval = Object.assign({}, LOOKS.old, {
    chimneys: false, lamps: false, stacks: false, crooked: .9, roofK: .62, roofMax: 2, table: 0xe6d9b8, landmark: 0xece2ca, lmRoof: 0xa5825a, flat: "#8f7a52", pub: "#6a4a32",
    tall: (i, b) => b.type === "church" || b.type === "chapel" ? 1.15 : .8 + h01(i + 5) * .35,
    brick: ["#d9cdb0", "#cfc09c", "#e3d8bd", "#b89a74", "#c8b48e", "#8a6a4c", "#ddd0b2"], stone: ["#bdb6a6", "#c9c2b1", "#b0a998", "#d2cbba", "#a8a191"],
    ware: ["#8a6e52", "#7c6248", "#96785a", "#84684e"], slate: ["#b39a5c", "#a88e52", "#bea568", "#8f6a48", "#9c8250"], tile: ["#a5573a", "#99503a", "#b06244"],
    plan: Object.assign({}, LOOKS.old.plan, { PAPER: "#eadfbe", BLOCK: "#dccb9f", ROADF: "#efe4c6", MAJORF: "#ecdcb4", WATERC: "#a9bcae", PARKC: "#c9cf9c" }),
    abbr: { pubs: "Inn", churches: "Ch.", chapels: "", schools: "", gas: "" }
  });
  // The modern look, where the city says how tall each quarter stands (b.zone, from its `heights`), builds to that
  // instead of scattering towers at random.
  {
    const scatter = LOOKS.modern.tall;
    Object.assign(LOOKS.modern, {
      stacks: false, glass: 0xcfdeea, lmRoof: 0xa7aeb5,
      tall: (i, b) => b.zone == null || b.type === "church" || b.type === "chapel" ? scatter(i, b) : b.zone ? Math.max(1, b.zone * (.5 + h01(i) * .55) / b.h) : b.type === "back" ? 1.1 : 1.2 + h01(i + 3) * .9
    });
  }
  // Where in the world, laid over the look of the age: region: "mediterranean" | "desert" | "eastasia".
  // Anything else is the temperate north the looks were first drawn for. A modern city takes only the `modern` part.
  const REGIONS = {
    mediterranean: {
      brick: ["#dcbf92", "#e3cb9f", "#d2ab7c", "#e8d6ac", "#d6b382", "#cba274", "#dfc496"], stone: ["#e6d7b6", "#eadcbd", "#dccba6", "#efe2c4", "#d8c8a4"],
      slate: ["#b0603f", "#a8573a", "#b96a45", "#9f5236", "#c0714c"], tile: ["#b5653f", "#a95a3a", "#c27449"], pub: "#8a5a3c", flat: "#b98a62", lmRoof: 0xc9966a,
      modern: { brick: ["#d9d2c2", "#cfc8b6", "#e2dccd", "#c4b9a2", "#d6cdb9", "#e6dfd0", "#cbbfa8"], tile: ["#b5653f", "#a95a3a", "#c27449"] }
    },
    desert: {
      pitched: (i, b) => b.type === "church", flat: "#cdbb96", lmRoof: 0xdccba6, table: 0xe8dcc0,
      brick: ["#e2d2b0", "#d8c59e", "#ecdfc2", "#cfb98f", "#e8d8b6", "#dccaa4", "#f0e6cf"], stone: ["#f1e9d6", "#ece2cb", "#f5eedd", "#e6dbc2", "#efe6d0"],
      ware: ["#c4ad86", "#b9a27a", "#cdb690", "#bfa880"], slate: ["#cdbb96", "#c4b18a", "#d6c5a2"], tile: ["#c9b58e", "#bfa982", "#d2bf9a"],
      plan: { PAPER: "#f1e7cf", BLOCK: "#e6d7b4", PARKC: "#d3d6a6", LOT: "#efe4c8" },
      modern: { table: 0xeae0c8, flat: "#b9b3a6", brick: ["#e4dccb", "#d9d0bd", "#ece6d8", "#c9bfa9", "#dfd6c3", "#f0ebdf", "#cfc6b2"], plan: { PAPER: "#f3ecd9", BLOCK: "#e9dfc6", PARKC: "#d2ddb4", LOT: "#f1ead8" } }
    },
    eastasia: {
      brick: ["#e8e4da", "#d9d4c8", "#5a4a3c", "#cfc8b8", "#6b5848", "#e2ddd0", "#bdb5a4"], stone: ["#dcd8ce", "#e6e2d8", "#cfcabd", "#ebe7de", "#c6c0b2"],
      slate: ["#4d5054", "#5a5e62", "#44474b", "#63676b", "#3f4245"], tile: ["#53565a", "#474a4e", "#5f6367"], pub: "#5b4638",
      modern: {}
    }
  };
  // what a place can be on the map (place meta: model: "church" or ["church", 3]); the number is the ground it claims
  const MODEL_SIZE = { house: 3, town: 3, cottage: 2.4, pub: 2.4, church: 2.4, tinchapel: 2.4, tinhall: 2.4, hall: 4, museum: 2.4, infirmary: 2.4, orphanage: 2.6, asylum: 7.5, home: 4.5, warehouse: 2.4, baths: 2.4, morgue: 2.4, annex: 2.4, arch: 2.4, shaft: 2.4, crooked: 2.4, cone: 5, quay: 3, coalyard: 2.4, slum: 2.4, alley: 1, cart: 1 };
  const MODELS = Object.keys(MODEL_SIZE);

  // landmarks: what each kind is when the city gives no footprint or height: [width, depth, height] in plan units
  const LM_SIZE = { tower: [5, 5, 24], hall: [7, 5, 3.2], church: [4.5, 9, 9], mosque: [7, 7, 7], dome: [7, 7, 5], castle: [13, 11, 2.2], stadium: [16, 12, 3.2], spire: [3.4, 3.4, 22], monument: [1.6, 1.6, 3.6], pyramid: [7, 7, 5], pagoda: [4, 4, 8], wheel: [8, 2, 14], bridge: [16, 2.6, 6], watchtower: [1.6, 1.6, 3.6], tent: [5, 3.2, 1.6], hangar: [9, 7, 3.2], bunker: [5, 4, 1.1], gate: [5, 1.4, 2.6], tank: [3, 3, 2.6], pad: [5, 5, .08], park: [0, 0, 0], square: [0, 0, 0] };
  // what lies between the buildings of a site that is not a city (ground: "grass" | "sand" | "dirt" | "snow" | "concrete")
  const GROUNDS = {
    grass: { BLOCK: "#cbd3a4", PAPER: "#dfe3c2", HATCH: "rgba(70,90,40,.06)", LOT: "#d9dfb8" },
    sand: { BLOCK: "#e6d6ae", PAPER: "#efe3c4", HATCH: "rgba(120,90,40,.05)", LOT: "#eadcb8" },
    dirt: { BLOCK: "#d2c2a0", PAPER: "#e2d6b8", HATCH: "rgba(90,70,40,.07)", LOT: "#dccdae" },
    snow: { BLOCK: "#eef1f2", PAPER: "#f6f8f8", HATCH: "rgba(80,100,120,.05)", LOT: "#f2f4f4", PARKC: "#dfe7e2" },
    concrete: { BLOCK: "#d9d9d4", PAPER: "#e6e6e2", HATCH: "rgba(60,60,60,.05)", LOT: "#dedede" }
  };
  const LM_KINDS = Object.keys(LM_SIZE);

  let PLAN = null, CD = null, LOOK = null;
  // fill in everything the campaign left out, and make this city the current one
  function prepare(raw) {
    // a campaign's own changes to a city that was fetched or generated for it: ATLAS.cityEdit(c => { ... }), applied once
    if (raw && A.cityEdits && !raw.__edited) { Object.defineProperty(raw, "__edited", { value: true }); for (const f of A.cityEdits) f(raw); }
    const D = Object.assign({ seed: 1888, look: "old", title: "", subtitle: "", scaleLabel: "", roads: [], rivers: [], basins: [], parks: [], squares: [], rails: [], forts: [], towers: [], gasworks: [], signs: [], districts: {}, roofs: {}, roof: "#7a2e3a", plazas: [], open: [], walls: [], landmarks: [], rows: [], footprints: [], ruin: 0, credit: "", real: false }, raw || {});
    D.sheet = Object.assign({ w: 320, h: 200, margin: 30 }, (raw && raw.sheet) || {});
    // a landmark given only its outline (pts) stands at the outline's centre (without this it was skipped, and a place
    // that said it was that landmark stood somewhere else entirely: Birkenau's Crematorium III, 14 Oct 2026)
    for (const l of D.landmarks) if (l && !l.at && Array.isArray(l.pts) && l.pts.length > 2) { let x = 0, y = 0; for (const p of l.pts) { x += p[0]; y += p[1]; } l.at = [x / l.pts.length, y / l.pts.length]; }
    // A real city's streets are surveyed, not a skeleton: nothing is grown between them, wobbled, or moved aside.
    for (const k of ["grow", "wobble", "clear"]) if (D[k] == null) D[k] = !D.real;
    {
      let L = LOOKS[typeof D.look === "object" ? D.look.base || "old" : D.look] || LOOKS.old;
      const rg = REGIONS[D.region], o = rg ? (L.age ? rg : rg.modern || {}) : null;
      if (o) L = Object.assign({}, L, o, { plan: Object.assign({}, L.plan, o.plan || {}) });
      if (D.look && typeof D.look === "object") L = Object.assign({}, L, D.look, { plan: Object.assign({}, L.plan, D.look.plan || {}) });
      if (GROUNDS[D.ground]) L = Object.assign({}, L, { plan: Object.assign({}, L.plan, GROUNDS[D.ground]) });
      LOOK = L;
    }
    // how tall each quarter stands, where the city knows: heights: { cell, cols, rows, x0, y0, v: [...] } in plan units
    D.zone = null;
    if (D.heights && D.heights.v) { const h = D.heights; D.zone = (x, y) => { const i = Math.floor((x - (h.x0 || 0)) / h.cell), j = Math.floor((y - (h.y0 || 0)) / h.cell); return i < 0 || j < 0 || i >= h.cols || j >= h.rows ? 0 : h.v[j * h.cols + i] || 0; }; }
    const nm = (raw && raw.names) || {};
    D.names = { pool: typeof nm.pool === "function" ? nm.pool : Array.isArray(nm.pool) ? () => nm.pool : () => NAMES, suffix: nm.suffix || SUFFIX, format: nm.format || "" };
    const cfg = A.config || {};
    D.fonts = Object.assign({ text: (cfg.ui && cfg.ui.body) || "'Spectral', Georgia, serif", caps: (cfg.fonts && cfg.fonts.label) || "'Spectral SC', Georgia, serif" }, (raw && raw.fonts) || {});
    D.abbr = Object.assign({}, LOOK.abbr, (raw && raw.abbr) || {});
    for (const [k, v] of [["grand", () => false], ["crooked", () => LOOK.crooked], ["rich", () => .3], ["wharf", D.real ? () => false : () => true], ["height", () => 1]]) if (typeof D[k] !== "function") D[k] = v;
    if (D.boats == null) D.boats = D.rivers.length ? 40 : 0;
    const m = D.sheet.margin; PLAN = { X0: -m, Y0: -m, X1: D.sheet.w + m, Y1: D.sheet.h + m };
    ({ INK, PAPER, BLOCK, ROADF, MAJORF, WATERC, PARKC, FOOT, LOT, WHARF, RAILC, HATCH, FORTC } = LOOK.plan);
    CD = D; return D;
  }
  // where each place stands: its own `at: [x, y]`, or a spiral round the centre of its district
  function cityPlaces(D) {
    const out = [], byD = {};
    A.order.forEach((id, i) => {
      const m = A.meta[id]; if (!m || m.offmap) return;
      const mdl = Array.isArray(m.model) ? m.model : [m.model || "house"], kind = MODEL_SIZE[mdl[0]] ? mdl[0] : "house";
      const e = { id, kind, lr: mdl[1] || MODEL_SIZE[kind], x: null, y: null, p: { id, n: i + 1, name: m.name || id, dist: m.district || m.region || "", cat: m.category || "", badge: m.badge || "" } };
      // a place that IS one of the city's landmarks (landmark: "its name") stands where the landmark does, and wears it
      const lm = m.landmark ? D.landmarks.find(l => l.at && String(l.name).toLowerCase() === String(m.landmark).toLowerCase()) : null;
      // On a surveyed map (a real city or site) a place set down by position stands IN one of the map's own buildings,
      // the one at or nearest its spot, and wears that building's true outline: never a model of its own dropped among
      // the real ones. The user caught this on Birkenau (14 Oct 2026): "the locations are out of place; you are not
      // using the ones that are native to the map". native: false keeps the old model; native: true asks for it on an
      // invented map too.
      e.native = !lm && (m.native === true || (m.native !== false && !!D.real));
      if (lm) { e.x = lm.at[0]; e.y = lm.at[1]; e.kind = "landmark"; e.lm = lm; e.lr = 2.4; }
      else if (Array.isArray(m.at)) { e.x = m.at[0]; e.y = m.at[1]; } else (byD[e.p.dist] = byD[e.p.dist] || []).push(e);
      out.push(e);
    });
    for (const [d, list] of Object.entries(byD)) { const c = D.districts[d]; if (c) list.forEach((e, i) => { const r = i === 0 ? 0 : 8 * Math.sqrt(i), a = i * 2.39996; e.x = c[0] + r * Math.cos(a); e.y = c[1] + r * Math.sin(a); }); }
    return out;
  }

function buildCity(D, PL) {
  const rndMain = mulberry32(D.seed); let rndNow = rndMain;
  const rnd = () => rndNow();          // the outskirts pass swaps in its own generator, then puts this one back
  const R = (a, b) => a + (b - a) * rnd();
  const { X0, Y0, X1, Y1 } = PLAN, SW = D.sheet.w, SH = D.sheet.h;
  const LMS = PL.map(p => ({ id: p.id, p: p.p, x: p.x, y: p.y, kind: p.kind, lr: p.lr, ang: 0, lm: p.lm, native: p.native, at0: [p.x, p.y] }));

  // ---- geometry helpers
  function segD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = ax + t * dx, qy = ay + t * dy; return [Math.hypot(px - qx, py - qy), qx, qy]; }
  function segX(ax, ay, bx, by, cx, cy, dx, dy) { const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy, den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return -1; const t = ((cx - ax) * sy - (cy - ay) * sx) / den, u = ((cx - ax) * ry - (cy - ay) * rx) / den; return (t > 1e-6 && t <= 1 && u >= -1e-6 && u <= 1 + 1e-6) ? t : -1; }
  // an angle is in radians; one above a full turn (6.3) can only be degrees, and is read so (Birkenau's hut rows were
  // written "ang: 90" and stood askew at 117°, 14 Oct 2026)
  const angOf = a => (a == null ? 0 : Math.abs(a) > 6.3 ? a * Math.PI / 180 : a);
  function pip(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function resample(pts, step) {
    const out = [pts[0].slice()];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay);
      let s = step - carry;
      while (s < L) { out.push([ax + (bx - ax) * s / L, ay + (by - ay) * s / L]); s += step; }
      carry = L - (s - step);
    }
    const last = pts[pts.length - 1], pl = out[out.length - 1];
    if (Math.hypot(last[0] - pl[0], last[1] - pl[1]) > step * .35) out.push(last.slice()); else out[out.length - 1] = last.slice();
    return out;
  }
  function chaikin(pts) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; o.push([ax * .75 + bx * .25, ay * .75 + by * .25], [ax * .25 + bx * .75, ay * .25 + by * .75]); } o.push(pts[pts.length - 1]); return o; }
  function plen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }

  // ---- occupancy grid: 1 road, 2 water, 4 park, 8 lot, 16 building, 32 railway
  const CS = 0.4, NX = Math.ceil((X1 - X0) / CS), NY = Math.ceil((Y1 - Y0) / CS), G = new Uint8Array(NX * NY);
  const gk = (x, y) => { const i = Math.floor((x - X0) / CS), j = Math.floor((y - Y0) / CS); return (i < 0 || j < 0 || i >= NX || j >= NY) ? -1 : j * NX + i; };
  const gat = (x, y) => { const k = gk(x, y); return k < 0 ? 0 : G[k]; };
  function rasterCapsule(ax, ay, bx, by, r, bit) {
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - r - X0) / CS)), i1 = Math.min(NX - 1, Math.floor((Math.max(ax, bx) + r - X0) / CS));
    const j0 = Math.max(0, Math.floor((Math.min(ay, by) - r - Y0) / CS)), j1 = Math.min(NY - 1, Math.floor((Math.max(ay, by) + r - Y0) / CS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (segD(X0 + (i + .5) * CS, Y0 + (j + .5) * CS, ax, ay, bx, by)[0] <= r) G[j * NX + i] |= bit; }
  }
  function rasterPoly(poly, bit, onlyFree) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const i0 = Math.max(0, Math.floor((x0 - X0) / CS)), i1 = Math.min(NX - 1, Math.floor((x1 - X0) / CS)), j0 = Math.max(0, Math.floor((y0 - Y0) / CS)), j1 = Math.min(NY - 1, Math.floor((y1 - Y0) / CS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * NX + i; if (onlyFree && G[k]) continue; if (pip(X0 + (i + .5) * CS, Y0 + (j + .5) * CS, poly)) G[k] |= bit; }
  }
  // the same for a shape of several rings (water with islands in it), filled even-odd, a row at a time
  function rasterRings(rings, bit) {
    let y0 = 1e9, y1 = -1e9; for (const r of rings) for (const p of r) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const j0 = Math.max(0, Math.floor((y0 - Y0) / CS)), j1 = Math.min(NY - 1, Math.floor((y1 - Y0) / CS));
    for (let j = j0; j <= j1; j++) {
      const y = Y0 + (j + .5) * CS, xs = [];
      for (const r of rings) for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, yi] = r[i], [xk, yk] = r[k]; if ((yi > y) !== (yk > y)) xs.push((xk - xi) * (y - yi) / (yk - yi) + xi); }
      xs.sort((a, b) => a - b);
      for (let q = 0; q + 1 < xs.length; q += 2) { const i0 = Math.max(0, Math.ceil((xs[q] - X0) / CS - .5)), i1 = Math.min(NX - 1, Math.floor((xs[q + 1] - X0) / CS - .5)); for (let i = i0; i <= i1; i++) G[j * NX + i] |= bit; }
    }
  }
  const circlePoly = (cx, cy, r, n = 14) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * 6.2832), cy + r * Math.sin(i / n * 6.2832)]);

  // ---- water, parks, railways
  const smooth = (pts, n) => { for (let i = 0; i < (n || 0); i++) pts = chaikin(pts); return pts; };
  const waterLines = D.rivers.map(r => ({ pts: smooth(r.pts, r.smooth), hw: r.hw, name: r.name || "", label: r.label || "", big: !!r.big, repeat: r.repeat || 0, wharves: r.wharves || null, ghost: !!r.ghost }));
  const thames = waterLines.length ? waterLines[0].pts : [];   // the main river: boats ride on it
  // (a ghost is a river whose water is drawn by a basin: the line only carries its name and its boats)
  for (const w of waterLines) if (!w.ghost) for (let i = 1; i < w.pts.length; i++) rasterCapsule(w.pts[i - 1][0], w.pts[i - 1][1], w.pts[i][0], w.pts[i][1], w.hw, 2);
  for (const b of D.basins) if (b.holes && b.holes.length || b.pts.length > 60) rasterRings([b.pts, ...(b.holes || [])], 2); else rasterPoly(b.pts, 2);
  const forts = D.forts;
  for (const tower of forts) rasterPoly([[tower.x - tower.hw, tower.y - tower.hh], [tower.x + tower.hw, tower.y - tower.hh], [tower.x + tower.hw, tower.y + tower.hh], [tower.x - tower.hw, tower.y + tower.hh]], 4);
  const parks = D.parks.map(p => p.trees == null ? { name: p.name, pts: p.pts } : { name: p.name, pts: p.pts, trees: p.trees });
  // open ground that is not green (sand, yards, paving), paved squares, and town walls: nothing is built on any of them
  const open = D.open.map(o => ({ kind: o.kind || "paved", pts: o.pts })), plazas = D.plazas.map(p => ({ name: p.name || "", pts: p.pts }));
  for (const o of [...open, ...plazas]) rasterRings([o.pts], 4);
  const walls = D.walls.map(w => ({ name: w.name || "", kind: w.kind || "wall", pts: resample(w.pts, 2), src: w }));   // kind: "wall" | "fence" | "hesco"
  for (const w of walls) for (let i = 1; i < w.pts.length; i++) rasterCapsule(w.pts[i - 1][0], w.pts[i - 1][1], w.pts[i][0], w.pts[i][1], w.kind === "fence" ? .3 : .75, 4);
  // A survey often keeps a building that is now a ruin as a closed wall round its foundations (Birkenau's barracks and
  // crematoria are all like this). Such a ring is a building's true outline: a place or a landmark may stand on it.
  const polyArea = pts => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
  const centre = pts => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
  const rings = !D.real ? [] : walls.filter(w => {
    if (w.kind !== "wall") return false;
    const p = w.src.pts, a = p[0], b = p[p.length - 1];
    return p.length >= 4 && Math.hypot(a[0] - b[0], a[1] - b[1]) < .3;
  }).map(w => { const pts = w.src.pts.slice(0, -1); return { w, pts, area: polyArea(pts), c: centre(pts) }; }).filter(r => r.area > 1 && r.area < 150);
  const dropRing = r => { const i = walls.indexOf(r.w); if (i >= 0) walls.splice(i, 1); const j = rings.indexOf(r); if (j >= 0) rings.splice(j, 1); };
  const squares = D.squares.map(([name, x, y, r]) => ({ name, x, y, r, pts: circlePoly(x, y, r, 12) }));
  for (const p of parks) rasterPoly(p.pts, 4);
  for (const s of squares) rasterPoly(s.pts, 4);
  const rails = D.rails.map(r => ({ name: r.name, pts: resample(chaikin(r.pts), 2) }));
  for (const r of rails) for (let i = 1; i < r.pts.length; i++) rasterCapsule(r.pts[i - 1][0], r.pts[i - 1][1], r.pts[i][0], r.pts[i][1], 1.25, 32);
  const isWater = (x, y) => (gat(x, y) & 2) !== 0;

  // ---- roads + segment index
  const W = [2.8, 1.7, 1.1, 0.7];
  const roads = [], segs = [];
  const SGC = 8, SGX = Math.ceil((X1 - X0 + 120) / SGC), SGY = Math.ceil((Y1 - Y0 + 120) / SGC), SG = new Map();
  const sgKey = (i, j) => j * SGX + i;
  const sgI = x => Math.floor((x - X0 + 60) / SGC), sgJ = y => Math.floor((y - Y0 + 60) / SGC);
  function sgAdd(si) { const s = segs[si]; const i0 = sgI(Math.min(s.ax, s.bx) - 2), i1 = sgI(Math.max(s.ax, s.bx) + 2), j0 = sgJ(Math.min(s.ay, s.by) - 2), j1 = sgJ(Math.max(s.ay, s.by) + 2); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = sgKey(i, j); let a = SG.get(k); if (!a) SG.set(k, a = []); a.push(si); } }
  function sgQuery(x0, y0, x1, y1) { const out = new Set(); for (let j = sgJ(y0); j <= sgJ(y1); j++) for (let i = sgI(x0); i <= sgI(x1); i++) { const a = SG.get(sgKey(i, j)); if (a) for (const s of a) out.add(s); } return out; }
  function nearestRoad(x, y, rad, skip) {
    let best = null;
    for (const si of sgQuery(x - rad, y - rad, x + rad, y + rad)) { const s = segs[si]; if (skip && skip(s)) continue; const [d, qx, qy] = segD(x, y, s.ax, s.ay, s.bx, s.by); if (d <= rad && (!best || d - s.hw < best.e)) best = { d, e: d - s.hw, qx, qy, s }; }
    return best;
  }
  function addRoad(pts, cls, name, opt = {}) {
    const r = { id: roads.length, pts, cls, w: W[cls], name: name || "", parent: opt.parent ?? -1, ign: opt.ign || null, label: opt.label !== false };
    roads.push(r);
    for (let i = 1; i < pts.length; i++) {
      const si = segs.length;
      segs.push({ ax: pts[i - 1][0], ay: pts[i - 1][1], bx: pts[i][0], by: pts[i][1], hw: r.w / 2, rid: r.id, cls });
      sgAdd(si);
      rasterCapsule(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], r.w / 2 + 0.05, 1);
    }
    return r;
  }
  function pushFromPlaces(pts, w, ign, fixEnds) {
    for (let it = 0; it < 6; it++) {
      for (let k = 0; k < pts.length; k++) {
        if (fixEnds && (k === 0 || k === pts.length - 1)) continue;
        const p = pts[k];
        for (const L of LMS) {
          if (L.id === ign) continue;
          const need = L.lr + w / 2 + 0.3, dx = p[0] - L.x, dy = p[1] - L.y, d = Math.hypot(dx, dy);
          if (d < need) { if (d < 1e-3) { p[1] += need; continue; } p[0] = L.x + dx / d * need; p[1] = L.y + dy / d * need; }
        }
      }
      for (let k = 1; k < pts.length - 1; k++) { const a = pts[k - 1], b = pts[k], c = pts[k + 1]; b[0] = b[0] * .7 + (a[0] + c[0]) * .15; b[1] = b[1] * .7 + (a[1] + c[1]) * .15; }
    }
    return pts;
  }
  const near = (x, y, w) => LMS.find(L => Math.hypot(x - L.x, y - L.y) < L.lr + w / 2 + 0.3);

  // hand-laid roads: smooth, wobble a little (nothing in 1888 was ruled straight), keep clear of the campaign buildings
  for (const [name, cls, raw, ign, ro] of D.roads) {
    if (!D.wobble) { let pts = raw.map(p => p.slice()); if (D.clear) pts = pushFromPlaces(resample(pts, 1.5), W[cls], ign, !!ign); addRoad(resample(pts, 2), cls, name, { ign, label: !(ro && ro.label === false) }); continue; }
    let pts = resample(chaikin(chaikin(raw)), 1.5);
    const ph1 = R(0, 6.28), ph2 = R(0, 6.28), amp = cls === 0 ? .35 : cls === 3 ? .12 : .45;
    let s = 0;
    pts = pts.map((p, i) => {
      if (i === 0 || i === pts.length - 1 || ign) return p;
      s += 1.5;
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      const o = amp * (Math.sin(s * .09 + ph1) + .6 * Math.sin(s * .23 + ph2));
      return [p[0] - ty / tl * o, p[1] + tx / tl * o];
    });
    pushFromPlaces(pts, W[cls], ign, !!ign);
    addRoad(resample(pts, 2), cls, name, { ign });
  }

  // ---- organic growth of the secondary network
  const used = new Set(D.roads.map(h => h[0]));
  function nameFor(cls, x) {
    if (D.real) return "";      // a real city's streets have their own names; nothing is invented for it
    const pool = D.names.pool(x), suf = D.names.suffix[Math.min(cls, 3) - 1], fmt = D.names.format;
    for (let t = 0; t < 30; t++) { const a = pool[(rnd() * pool.length) | 0], b = suf[(rnd() * suf.length) | 0], n = fmt ? fmt.replace("{n}", a).replace("{s}", b).trim() : a + " " + b; if (!used.has(n)) { used.add(n); return n; } }
    return "";
  }
  const queue = [];
  function seedFrom(r) {
    const pts = r.pts, L = plen(pts);
    if (r.cls >= 3 || L < 6) return;
    const gap = [[8, 12], [9, 13], [7, 11]][r.cls];
    let s = R(2, gap[0]), acc = 0, i = 1;
    while (s < L - 2) {
      while (i < pts.length - 1 && acc + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) < s) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); i++; }
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], sl = Math.hypot(bx - ax, by - ay) || 1, t = Math.min(1, (s - acc) / sl);
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, nx = -(by - ay) / sl, ny = (bx - ax) / sl;
      for (const side of [-1, 1]) {
        if (rnd() < .2) continue;
        let cls;
        const west = D.grand(x, y), u = rnd();
        if (r.cls === 0) cls = u < .72 ? 1 : 2;
        else if (r.cls === 1) cls = u < .42 ? 1 : u < .9 ? 2 : 3;
        else cls = u < (west ? .25 : .55) ? 3 : u < .75 ? 2 : -1;
        if (cls < 0) continue;
        const a = Math.atan2(ny * side, nx * side) + R(-.3, .3);
        queue.push({ x, y, a, cls, parent: r.id, phw: r.w / 2 });
      }
      s += R(gap[0], gap[1]);
    }
  }
  if (D.grow) roads.slice().forEach(seedFrom);

  const inPlay = (x, y, m) => x > X0 - m && x < X1 + m && y > Y0 - m && y < Y1 + m;
  let guard = 0;
  while (queue.length && guard++ < 9000) {
    const qi = Math.floor(rnd() * Math.min(queue.length, 40));
    const sd = queue.splice(qi, 1)[0];
    const w = W[sd.cls], hw = w / 2;
    const east = D.crooked(sd.x, sd.y);
    let ang = sd.a, av = 0;
    const px = sd.x + Math.cos(ang) * (sd.phw + 2.4), py = sd.y + Math.sin(ang) * (sd.phw + 2.4);
    if (!inPlay(px, py, -2) || (gat(px, py) & 6)) continue;
    const nb = nearestRoad(px, py, 3.2, s => s.rid === sd.parent);
    if (nb && nb.e < 2.2 + hw) continue;
    if (near(px, py, w + 1.4)) continue;
    const pts = [[sd.x, sd.y]];
    let len = 0, done = false;
    const maxLen = sd.cls === 1 ? R(30, 95) : sd.cls === 2 ? R(14, 46) : R(4, 15);
    const wig = (sd.cls === 1 ? .05 : sd.cls === 2 ? .085 : .14) * (0.55 + east);
    let steps = 0;
    while (!done && steps++ < 80) {
      av = av * .72 + R(-wig, wig); ang += av;
      const step = 2.2;
      let tries = 0, nx, ny;
      for (; tries < 5; tries++) {
        const ta = ang + [0, .45, -.45, .9, -.9][tries];
        nx = pts[pts.length - 1][0] + Math.cos(ta) * step; ny = pts[pts.length - 1][1] + Math.sin(ta) * step;
        if (!near(nx, ny, w)) { ang = ta; break; }
      }
      if (tries === 5) break;
      const [cx, cy] = pts[pts.length - 1];
      if (!inPlay(nx, ny, 50)) { pts.push([nx, ny]); break; }
      if (gat(nx, ny) & 6) break;
      // crossing an existing road → make a junction and stop
      let hitT = 2, hit = null;
      for (const si of sgQuery(Math.min(cx, nx) - 1, Math.min(cy, ny) - 1, Math.max(cx, nx) + 1, Math.max(cy, ny) + 1)) {
        const s = segs[si];
        if (s.rid === sd.parent && len < 4) continue;
        const t = segX(cx, cy, nx, ny, s.ax, s.ay, s.bx, s.by);
        if (t >= 0 && t < hitT) { hitT = t; hit = s; }
      }
      if (hit) { pts.push([cx + (nx - cx) * hitT, cy + (ny - cy) * hitT]); done = true; break; }
      // close to another road → join it
      if (len > 3) {
        const nr = nearestRoad(nx, ny, hw + 1.4 + 2.2, s => (s.rid === sd.parent && len < 7));
        if (nr && nr.d < hw + nr.s.hw + 1.6) { pts.push([nx, ny], [nr.qx, nr.qy]); done = true; break; }
      }
      pts.push([nx, ny]); len += step;
      if (len >= maxLen && (sd.cls === 3 || rnd() < .35 || len > maxLen * 1.7)) break;
    }
    if (pts.length < 2 || plen(pts) < 3) continue;
    const L = plen(pts);
    const r = addRoad(pts, sd.cls, (sd.cls < 3 ? L > 16 : L > 7) ? nameFor(sd.cls, pts[0][0]) : "", { parent: sd.parent });
    seedFrom(r);
  }

  // ---- buildings given outright: surveyed footprints, and rows of huts or tents
  //      rows: [{ at: [x, y], ang, n, cols, w, d, h, gap, colGap, roof: "pitched" | "flat" | "barrel" | "tent", color }]
  //      the huts stand side by side along the direction ang, each with its long side (w) across it
  const footprints = D.footprints.filter(q => q && q.pts && q.pts.length > 2);
  for (const q of footprints) rasterRings([q.pts], 16);
  const huts = [];
  for (const r of D.rows) {
    const cnt = r.n || 1, cols = r.cols || 1, w = r.w || 6, d = r.d || 2, gap = r.gap == null ? 1.2 : r.gap, cg = r.colGap == null ? 2.5 : r.colGap, a = angOf(r.ang), c = Math.cos(a), sn = Math.sin(a);
    for (let q = 0; q < cols; q++) for (let i = 0; i < cnt; i++) { const u = i * (d + gap), v = q * (w + cg), x = r.at[0] + u * c - v * sn, y = r.at[1] + u * sn + v * c; huts.push({ x, y, w, d, a: a + Math.PI / 2, h: r.h || 1.1, roof: r.roof || "pitched", c: r.color || "" }); rectMark(x, y, w, d, a + Math.PI / 2); }
  }

  // ---- the city's landmarks: each on its true footprint where the city gives one, otherwise on a plot of the usual
  //      size for its kind, turned to the nearest street. Parks and squares are names only.
  const landmarks = [];
  for (const m of D.landmarks) {
    const kind = LM_SIZE[m.kind] ? m.kind : "hall", sz = LM_SIZE[kind];
    if (!m.at) continue;
    const [x, y] = m.at, L = { name: m.name || "", kind, x, y, top: m.top || "", label: m.label !== false, major: !!m.major, flat: !sz[0], place: null, src: m };
    landmarks.push(L);
    if (L.flat) continue;
    let pts = m.pts && m.pts.length > 2 ? m.pts : null;
    // on a surveyed map, a landmark set down by hand stands on the surveyed outline beneath it, if there is one of about
    // its size (a crematorium drawn as a rectangle takes the true foundations it was meant to be), and that outline is
    // not drawn a second time
    if (D.real && kind !== "bridge" && kind !== "gate" && kind !== "watchtower") {
      const want = pts ? polyArea(pts) : sz[0] * sz[1] * (m.size || 1) * (m.size || 1);
      const own = rings.filter(r => (pip(x, y, r.pts) || Math.hypot(r.c[0] - x, r.c[1] - y) < 3.5) && r.area > want * .35 && r.area < want * 3).sort((a, b) => Math.hypot(a.c[0] - x, a.c[1] - y) - Math.hypot(b.c[0] - x, b.c[1] - y))[0];
      if (own) { pts = own.pts; dropRing(own); L.surveyed = true; }
    }
    if (!pts) {
      const nr = nearestRoad(x, y, 30), a = m.ang != null ? angOf(m.ang) : (nr ? Math.atan2(nr.s.by - nr.s.ay, nr.s.bx - nr.s.ax) : 0) + (kind === "gate" ? Math.PI / 2 : 0), k = m.size || 1, c = Math.cos(a), sn = Math.sin(a), hw = sz[0] * k / 2, hd = sz[1] * k / 2;
      pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => [x + u * c - v * sn, y + u * sn + v * c]);
    }
    // the long axis of the footprint, and the box that holds it
    let mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0;
    for (const p of pts) { mx += p[0]; my += p[1]; } mx /= pts.length; my /= pts.length;
    for (const p of pts) { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const ang = m.ang != null && !L.surveyed ? angOf(m.ang) : .5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(ang), sn = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of pts) { const u = (p[0] - mx) * c + (p[1] - my) * sn, v = -(p[0] - mx) * sn + (p[1] - my) * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    Object.assign(L, { pts, holes: m.pts ? m.holes || [] : [], ang, w: u1 - u0, d: v1 - v0, cx: mx + (u0 + u1) / 2 * c - (v0 + v1) / 2 * sn, cy: my + (u0 + u1) / 2 * sn + (v0 + v1) / 2 * c, h: m.h || sz[2] * (m.size || 1), body: m.body || 0 });
    if (kind !== "bridge") rasterRings([pts], 24);
  }
  for (const P of LMS) if (P.lm) { const L = landmarks.find(l => l.src === P.lm); if (L) { L.place = P.id; P.fp = L; if (!L.flat) P.lr = Math.max(2, Math.min(6, Math.hypot(L.w, L.d) / 2)); } }

  // ---- every campaign building fronts a street: lay a court or lane where needed
  for (const L of LMS) {
    if (L.kind === "alley" || L.kind === "cart" || L.fp || L.native) continue;   // (a place in one of the map's own buildings has its street already)
    const nr = nearestRoad(L.x, L.y, 40);
    if (!nr) continue;
    if (nr.e > L.lr + 0.9) {
      const dx = nr.qx - L.x, dy = nr.qy - L.y, d = Math.hypot(dx, dy);
      const start = [L.x + dx / d * (L.lr * .8), L.y + dy / d * (L.lr * .8)];
      const pts = pushFromPlaces(resample([start, [nr.qx, nr.qy]], 1.5), W[3], L.id, true);
      const len = plen(pts);
      addRoad(resample(pts, 2), len < 9 ? 3 : 2, len > 7 ? nameFor(len < 9 ? 3 : 2, L.x) : "", {});
    }
  }
  // face each place toward its street
  for (const L of LMS) {
    const nr = nearestRoad(L.x, L.y, 40, s => L.kind === "alley" || L.kind === "cart" ? false : false);
    if (nr) {
      const s = nr.s; L.ang = Math.atan2(s.by - s.ay, s.bx - s.ax);
      const fx = nr.qx - L.x, fy = nr.qy - L.y;
      L.face = Math.atan2(fx, fy); // rotation about the vertical axis that turns local +z toward the street
      // align the façade with the street direction instead of pointing a corner at it
      const nxv = -Math.sin(L.ang), nyv = Math.cos(L.ang), sgn = (fx * nxv + fy * nyv) >= 0 ? 1 : -1;
      L.face = Math.atan2(nxv * sgn, nyv * sgn);
    } else L.face = 0;
  }

  // ---- property lots around campaign buildings
  const lots = [];
  for (const L of LMS) {
    if (L.kind === "alley" || L.kind === "cart" || L.native) continue;   // (a place in one of the map's own buildings: its ground is laid when it is found, below)
    if (L.fp) { if (!L.fp.flat) lots.push({ id: L.id, pts: L.fp.pts }); continue; }   // a landmark's own ground is its lot
    const h = L.lr * .92, c = Math.cos(L.face), s = Math.sin(L.face);
    // local (x along façade, z toward street) → plan; rotation θ maps local (x,z) to (x cosθ + z sinθ, -x sinθ + z cosθ)
    const corner = (lx, lz) => [L.x + lx * c + lz * s, L.y - lx * s + lz * c];
    const poly = [corner(-h, -h), corner(h, -h), corner(h, h), corner(-h, h)];
    lots.push({ id: L.id, pts: poly });
    rasterPoly(poly, 8, true);
    rasterPoly(circlePoly(L.x, L.y, L.lr, 16), 8, false);
  }

  // ---- ordinary buildings: terraces along every street, back-houses behind them
  const buildings = [];
  const westOf = x => D.rich(x);
  function rectFree(cx, cy, w, d, a) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let u = -w / 2 + .1; u <= w / 2 - .1 + 1e-6; u += .35) for (let v = -d / 2 + .1; v <= d / 2 - .1 + 1e-6; v += .35) {
      const x = cx + u * c - v * s, y = cy + u * s + v * c, k = gk(x, y);
      if (k < 0 || G[k]) return false;
    }
    return true;
  }
  function rectMark(cx, cy, w, d, a) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let u = -w / 2; u <= w / 2 + 1e-6; u += .3) for (let v = -d / 2; v <= d / 2 + 1e-6; v += .3) { const k = gk(cx + u * c - v * s, cy + u * s + v * c); if (k >= 0) G[k] |= 16; }
  }
  const fade = (x, y) => { const m = Math.max(0 - x, x - SW, 0 - y, y - SH, 0); return m <= 0 ? 1 : Math.max(0, 1 - m / 42); };
  function place(r, side, fill) {
    const out = fill ? extra : buildings;
    const pts = r.pts, L = plen(pts);
    let acc = 0, i = 1, t = R(0, 1.5);
    const posAt = s => { while (i < pts.length - 1 && acc + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) < s) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); i++; } const [ax, ay] = pts[i - 1], [bx, by] = pts[i], sl = Math.hypot(bx - ax, by - ay) || 1, u = Math.min(1, Math.max(0, (s - acc) / sl)); return [ax + (bx - ax) * u, ay + (by - ay) * u, Math.atan2(by - ay, bx - ax)]; };
    while (t < L - .5) {
      const west = westOf(posAt(t)[0]);
      let w = r.cls === 3 ? R(1.6, 3) : R(2.6, 6.2 - west * 1.4);
      if (t + w > L + .5) w = Math.max(1.4, L - t + .3);
      const [x, y, a] = posAt(Math.min(L, t + w / 2));
      const f = fade(x, y);
      if (fill ? f >= 1 : rnd() > f) { t += w; continue; }   // the outskirts pass builds only beyond the neat line
      const nx = -Math.sin(a) * side, ny = Math.cos(a) * side;
      const nearWater = (gat(x + nx * 7, y + ny * 7) & 2) || (gat(x + nx * 11, y + ny * 11) & 2);
      const ware = nearWater && D.wharf(x, y) && rnd() < .7;
      let d = ware ? R(4.2, 6.5) : [R(3.6, 5.2), R(3.2, 4.6), R(2.4, 3.6), R(1.6, 2.6)][r.cls];
      let ok = false;
      for (const k of [1, .7, .45]) {
        const ww = w * k, off = r.w / 2 + .2 + d / 2, cx = x + nx * off, cy = y + ny * off;
        if (rectFree(cx, cy, ww, d, a)) {
          const east = 1 - west;
          let h = [2.1, 1.8, 1.5, 1.2][r.cls] + R(-.3, .6) + west * .6 + (ware ? R(1, 1.8) : 0);
          h *= D.height(x, y);   // 1 everywhere, unless the campaign names a low quarter
          const type = ware ? "ware" : (r.cls <= 1 && rnd() < .12 ? "shop" : "terrace");
          out.push({ x: cx, y: cy, w: ww, d, a, h, type, west, east, roof: ware ? (rnd() < .5 ? 0 : 1) : (rnd() < .8 ? 1 : 0), cls: r.cls, rid: r.id });
          rectMark(cx, cy, ww, d, a);
          // a back-house or workshop in the yard behind
          if (!ware && rnd() < .72) {
            const d2 = R(1.4, 2.6), w2 = Math.min(ww * .8, R(1.4, 3)), off2 = off + d / 2 + R(.6, 1.6) + d2 / 2;
            const bx = x + nx * off2, by = y + ny * off2;
            if (rectFree(bx, by, w2, d2, a)) { out.push({ x: bx, y: by, w: w2, d: d2, a, h: h * R(.45, .7), type: "back", west, east, roof: rnd() < .5 ? 1 : 0, cls: 3, rid: r.id }); rectMark(bx, by, w2, d2, a); }
          }
          ok = true; t += ww + (rnd() < .18 ? R(.35, .9) : 0);
          break;
        }
      }
      if (!ok) t += .6;
    }
  }
  const order = roads.slice().sort((a, b) => a.cls - b.cls);
  // fill: false is a site that is not a city: no houses are grown, only what the site gives (rows, footprints, landmarks)
  const FILL = D.fill !== false;
  if (FILL) for (const r of order) { place(r, 1); place(r, -1); }
  // yards and workshops filling the middle of the blocks, leaving courts open between them
  if (FILL) for (let y = Y0 + 1; y < Y1 - 1; y += 1.7) for (let x = X0 + 1; x < X1 - 1; x += 1.7) {
    const jx = x + R(-.5, .5), jy = y + R(-.5, .5);
    if (gat(jx, jy) || rnd() < .38 || rnd() > fade(jx, jy)) continue;
    const nr = nearestRoad(jx, jy, 14);
    if (!nr || nr.e < 2.4) continue;
    const a = Math.atan2(nr.s.by - nr.s.ay, nr.s.bx - nr.s.ax), w = R(1.5, 3.4), d = R(1.4, 2.6);
    if (rectFree(jx, jy, w + .5, d + .5, a)) { const west = westOf(jx); buildings.push({ x: jx, y: jy, w, d, a, h: R(.7, 1.3) + west * .4, type: "back", west, east: 1 - west, roof: rnd() < .55 ? 1 : 0, cls: 3, rid: nr.s.rid }); rectMark(jx, jy, w, d, a); }
  }

  // ---- the outskirts: the same streets and yards again, but only beyond the neat line, wherever there is still room
  const extra = [];
  rndNow = mulberry32(D.seed + 26);
  if (FILL) for (const r of order) { place(r, 1, true); place(r, -1, true); }
  if (FILL) for (let y = Y0 + 1; y < Y1 - 1; y += 1.7) for (let x = X0 + 1; x < X1 - 1; x += 1.7) {
    const jx = x + R(-.5, .5), jy = y + R(-.5, .5);
    if (gat(jx, jy) || rnd() < .38) continue;
    const close = nearestRoad(jx, jy, 14);
    if (close && fade(jx, jy) >= 1) continue;      // inside the neat line, wherever a street is in reach, the first pass has had its say
    const nr = close || nearestRoad(jx, jy, 120);   // far from any street: line up with the nearest one anyway
    if (nr && nr.e < 2.4) continue;
    const a = nr ? Math.atan2(nr.s.by - nr.s.ay, nr.s.bx - nr.s.ax) : 0, w = R(1.5, 3.4), d = R(1.4, 2.6);
    if (rectFree(jx, jy, w + .5, d + .5, a)) { const west = westOf(jx); extra.push({ x: jx, y: jy, w, d, a, h: R(.7, 1.3) + west * .4, type: "back", west, east: 1 - west, roof: rnd() < .55 ? 1 : 0, cls: 3, rid: nr ? nr.s.rid : -1 }); rectMark(jx, jy, w, d, a); }
  }
  rndNow = rndMain;
  // built: [{ pts }] keeps the grown houses to those zones (a village beside a camp, a town at the edge of a base)
  if (D.built && D.built.length) for (const list of [buildings, extra]) { const keep = list.filter(b => D.built.some(z => pip(b.x, b.y, z.pts || z))); list.length = 0; for (const b of keep) list.push(b); }

  // ---- landmark establishments among the ordinary houses: churches, pubs on corners, chapels, chimneys, gasholders
  const specials = { churches: [], stacks: [], gas: [], pubs: [], chapels: [], schools: [] };
  const bigs = D.real ? [] : buildings.filter(b => b.type === "terrace" && b.w * b.d > 16 && b.x > -20 && b.x < SW + 20 && b.y > -20 && b.y < SH + 20);
  for (const b of bigs) {
    if (rnd() < .07 && specials.churches.every(c => Math.hypot(c.x - b.x, c.y - b.y) > 34)) { b.type = "church"; b.h = Math.max(b.h, 2.6); b.roof = 1; specials.churches.push(b); }
    else if (rnd() < .03 && specials.chapels.every(c => Math.hypot(c.x - b.x, c.y - b.y) > 28)) { b.type = "chapel"; b.roof = 1; specials.chapels.push(b); }
    else if (rnd() < .025 && specials.schools.every(c => Math.hypot(c.x - b.x, c.y - b.y) > 40)) { b.type = "school"; b.h += .8; specials.schools.push(b); }
  }
  if (!D.real) for (const b of buildings) if (b.type === "ware" && rnd() < .08 && specials.stacks.every(c => Math.hypot(c.x - b.x, c.y - b.y) > 16)) specials.stacks.push({ x: b.x, y: b.y, h: b.h + R(5, 9), b });
  // corner pubs: first building beside a junction on a street
  for (const b of D.real ? [] : buildings) {
    if (b.type !== "terrace" || b.cls > 2 || rnd() > .08) continue;
    const nr = nearestRoad(b.x, b.y, 8, s => s.rid === b.rid);
    if (nr && nr.e < 3.2 && specials.pubs.every(c => Math.hypot(c.x - b.x, c.y - b.y) > 14)) { b.type = "pub"; specials.pubs.push(b); }
  }
  for (const [x, y, r] of D.gasworks) {
    if (!near(x, y, r * 2) && !(gat(x, y) & 3)) { specials.gas.push({ x, y, r }); rasterPoly(circlePoly(x, y, r + .4), 16, false); }
  }

  // ---- gas lamps along main roads and streets
  const lamps = [];
  for (const r of roads) {
    if (r.cls > 1) continue;
    const pts = r.pts; let acc = 0, next = R(2, 8), side = 1;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], sl = Math.hypot(bx - ax, by - ay);
      while (next < acc + sl) {
        const u = (next - acc) / sl, x = ax + (bx - ax) * u, y = ay + (by - ay) * u, nx = -(by - ay) / sl, ny = (bx - ax) / sl;
        const lx = x + nx * side * (r.w / 2 - .12), ly = y + ny * side * (r.w / 2 - .12);
        if (!isWater(lx, ly) && inPlay(lx, ly, -1)) lamps.push([lx, ly]);
        side = -side; next += r.cls === 0 ? R(7, 10) : R(9, 13);
      }
      acc += sl;
    }
  }

  // ---- trees in parks and squares, lighters on the river
  const trees = [];
  const scatter = (poly, n) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } let c = 0, g = 0; while (c < n && g++ < n * 8) { const x = R(x0, x1), y = R(y0, y1); if (pip(x, y, poly) && !(gat(x, y) & 3) && fade(x, y) > .2) { trees.push([x, y, R(.8, 1.6)]); c++; } } };
  for (const p of parks) { let a = 0; for (let i = 0, j = p.pts.length - 1; i < p.pts.length; j = i++) a += (p.pts[j][0] + p.pts[i][0]) * (p.pts[j][1] - p.pts[i][1]); scatter(p.pts, p.trees != null ? Math.min(1400, Math.abs(a / 2) / 18 * p.trees) : Math.min(260, Math.abs(a / 2) / 18)); }
  for (const s of squares) scatter(s.pts, Math.max(3, s.r * s.r * .9));
  const boats = [];
  for (let k = 0; k < (thames.length > 8 ? D.boats : 0); k++) {
    const i = 3 + Math.floor(rnd() * (thames.length - 6)), [ax, ay] = thames[i], [bx, by] = thames[i + 1];
    const a = Math.atan2(by - ay, bx - ax), side = rnd() < .5 ? -1 : 1, off = side * (D.real ? R(.1, .7) * waterLines[0].hw : R(3.2, 6.2));
    const x = ax - Math.sin(a) * off, y = ay + Math.cos(a) * off;
    if (D.real && !isWater(x, y)) continue;
    if (boats.every(b => Math.hypot(b.x - x, b.y - y) > 3.2)) boats.push({ x, y, a: a + R(-.15, .15), l: R(2.4, 4.2), w: R(.9, 1.4) });
  }

  // ---- viaducts
  const viaduct = [];
  for (const r of rails) for (let i = 1; i < r.pts.length; i++) { const [ax, ay] = r.pts[i - 1], [bx, by] = r.pts[i]; const x = (ax + bx) / 2, y = (ay + by) / 2; if (inPlay(x, y, -1)) viaduct.push({ x, y, a: Math.atan2(by - ay, bx - ax), l: Math.hypot(bx - ax, by - ay) + .05 }); }

  for (const b of extra) buildings.push(b);   // last, so every earlier house keeps its place in the list (and its colour)

  // ---- a place on a surveyed map stands in one of the map's own buildings: the one it is set down in, or else the
  //      nearest (a surveyed outline, a hut of a row, a house along a street), within 12 squares. That building becomes
  //      the place's: drawn on its true outline, in the place's colours, with its pin. If none is near, the place keeps
  //      a model of its own, and `check` says so.
  const rectPts = b => { const c = Math.cos(b.a), s = Math.sin(b.a), hw = b.w / 2, hd = b.d / 2; return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => [b.x + u * c - v * s, b.y + u * s + v * c]); };
  const unhoused = [];
  for (const L of LMS) {
    if (!L.native || L.fp || L.x == null) continue;
    const cands = [
      ...rings.map(r => ({ pts: r.pts, h: 1, take: () => dropRing(r) })),
      ...footprints.map(q => ({ pts: q.pts, h: q.h || 1, take: () => footprints.splice(footprints.indexOf(q), 1) })),
      ...huts.map(b => ({ pts: rectPts(b), h: b.h || 1, take: () => huts.splice(huts.indexOf(b), 1) })),
      ...buildings.map(b => ({ pts: rectPts(b), h: b.h || 1, take: () => buildings.splice(buildings.indexOf(b), 1) }))
    ].map(k => Object.assign(k, { c: centre(k.pts), area: polyArea(k.pts) })).filter(k => k.area > .6);
    const inIt = cands.filter(k => pip(L.x, L.y, k.pts)).sort((a, b) => b.area - a.area)[0];
    const best = inIt || cands.map(k => Object.assign(k, { dist: Math.hypot(k.c[0] - L.x, k.c[1] - L.y) })).filter(k => k.dist < 12).sort((a, b) => a.dist - b.dist)[0];
    if (!best) { L.native = false; unhoused.push(L.id); continue; }
    best.take();
    // the outline's long axis and the box that holds it, as for a landmark
    const pts = best.pts; let mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0;
    for (const p of pts) { mx += p[0]; my += p[1]; } mx /= pts.length; my /= pts.length;
    for (const p of pts) { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const ang = .5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(ang), sn = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of pts) { const u = (p[0] - mx) * c + (p[1] - my) * sn, v = -(p[0] - mx) * sn + (p[1] - my) * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const fp = { name: "", kind: "hall", top: "", label: false, major: false, flat: false, place: L.id, src: null, native: true, pts, holes: [], ang, w: u1 - u0, d: v1 - v0, cx: mx + (u0 + u1) / 2 * c - (v0 + v1) / 2 * sn, cy: my + (u0 + u1) / 2 * sn + (v0 + v1) / 2 * c, h: Math.max(best.h, .9), body: 0 };
    fp.x = fp.cx; fp.y = fp.cy;
    landmarks.push(fp); lots.push({ id: L.id, pts });
    L.fp = fp; L.x = fp.cx; L.y = fp.cy; L.lr = Math.max(2, Math.min(6, Math.hypot(fp.w, fp.d) / 2));
  }
  if (D.zone) for (const b of buildings) b.zone = D.zone(b.x, b.y);
  // ---- nothing stands off the paper. The paper runs to the plan's edge (the sheet and its margin); beyond it is the
  //      table. Everything that stands up in 3D must lie wholly on the paper: trees (with their crowns), houses, huts,
  //      surveyed buildings, landmarks, walls and fences, viaducts, boats, lamps, chimneys. What would hang over the
  //      edge is left out; a wall or fence that crosses the edge is cut where the paper ends. The user saw trees
  //      standing out on the table (14 Oct 2026) and asked that nothing be generated out of bounds again.
  const ON = (x, y, pad) => x >= X0 + pad && x <= X1 - pad && y >= Y0 + pad && y <= Y1 - pad;
  const allOn = (pts, pad) => pts.every(p => ON(p[0], p[1], pad));
  const keepOnly = (list, ok) => { const kept = list.filter(ok); list.length = 0; for (const v of kept) list.push(v); };
  keepOnly(trees, ([x, y, s]) => ON(x, y, s * .8 + .2));
  keepOnly(lamps, ([x, y]) => ON(x, y, .3));
  keepOnly(boats, b => ON(b.x, b.y, b.l / 2 + .3));
  keepOnly(buildings, b => allOn(rectPts(b), .05));
  keepOnly(huts, b => allOn(rectPts(b), .05));
  keepOnly(footprints, q => allOn(q.pts, .05));
  keepOnly(viaduct, v => { const dx = Math.cos(v.a) * v.l / 2, dy = Math.sin(v.a) * v.l / 2; return ON(v.x - dx, v.y - dy, 1) && ON(v.x + dx, v.y + dy, 1); });
  keepOnly(landmarks, L => L.place || (L.flat ? ON(L.x, L.y, 1) : allOn(L.pts || [[L.x, L.y]], .05)));
  for (const k of ["stacks", "gas"]) keepOnly(specials[k], s => ON(s.x, s.y, (s.r || .5) + .2));
  for (const k of ["churches", "chapels", "schools", "pubs"]) keepOnly(specials[k], s => buildings.includes(s));
  { const cut = []; for (const w of walls) { let run = []; for (const p of w.pts) { if (ON(p[0], p[1], .4)) run.push(p); else { if (run.length > 1) cut.push(Object.assign({}, w, { pts: run })); run = []; } } if (run.length > 1) cut.push(Object.assign({}, w, { pts: run })); } walls.length = 0; for (const w of cut) walls.push(w); }
  return { LMS, roads, segs, lots, buildings, specials, lamps, trees, boats, viaduct, rails, parks, squares, waterLines, basins: D.basins, forts, thames, gat, nearestRoad, open, plazas, walls, landmarks, footprints, huts, unhoused };
}

/* ---- the printed plan: parchment, ink, engraved water, street names ---- */
// the plan's inks, set from the campaign's look by prepare()
let INK, PAPER, BLOCK, ROADF, MAJORF, WATERC, PARKC, FOOT, LOT, WHARF, RAILC, HATCH, FORTC;
// view: an optional window { x0, y0, x1, y1 } in plan units. The same plan is drawn, but only that window of it,
// so a small canvas can hold a much sharper print of the streets under the camera.
function drawPlan(C, ppu, view) {
  const { X0, Y0, X1, Y1 } = PLAN, V = view || { x0: X0, y0: Y0, x1: X1, y1: Y1 };
  const D = CD, SW = D.sheet.w, SH = D.sheet.h, F1 = D.fonts.text, F2 = D.fonts.caps;
  const cv = document.createElement("canvas");
  cv.width = Math.round((V.x1 - V.x0) * ppu); cv.height = Math.round((V.y1 - V.y0) * ppu);
  const g = cv.getContext("2d");
  const U = () => g.setTransform(ppu, 0, 0, ppu, -V.x0 * ppu, -V.y0 * ppu);
  const PXT = () => g.setTransform(1, 0, 0, 1, 0, 0);
  const rnd = mulberry32(77);
  const tx = x => (x - V.x0) * ppu, ty = y => (y - V.y0) * ppu;
  const path = (pts, close) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); };

  // paper and the urban fill
  U();
  g.fillStyle = PAPER; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  g.fillStyle = BLOCK; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  // fine diagonal hatching over the built-up blocks
  g.strokeStyle = HATCH; g.lineWidth = .09;
  g.beginPath();
  for (let k = X0 - (Y1 - Y0); k < X1; k += 1.1) { g.moveTo(k, Y0); g.lineTo(k + (Y1 - Y0), Y1); }
  g.stroke();

  // a shape of several rings (water with islands, a building round a court)
  const bpath = b => { g.beginPath(); for (const r of [b.pts, ...(b.holes || [])]) { g.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) g.lineTo(r[i][0], r[i][1]); g.closePath(); } };
  // open ground that is not green: sand, fields, yards
  for (const o of C.open) { g.fillStyle = o.kind === "sand" ? "#eadfb8" : o.kind === "field" ? PARKC : LOT; g.globalAlpha = o.kind === "field" ? .45 : 1; path(o.pts, true); g.fill(); g.globalAlpha = 1; }
  // parks and squares
  const tree = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); };
  for (const p of [...C.parks, ...C.squares]) {
    g.fillStyle = PARKC; path(p.pts, true); g.fill();
    g.strokeStyle = INK; g.lineWidth = .22; g.stroke();
    g.save(); path(p.pts, true); g.clip();
    g.fillStyle = "rgba(92,104,60,.45)";
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of p.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = y0; y < y1; y += 1.6) for (let x = x0 + ((y * 7) % 1.6); x < x1; x += 1.6) if (rnd() < (p.trees == null ? .5 : Math.min(.6, p.trees * .5))) tree(x + rnd() * .8, y + rnd() * .8, .22 + rnd() * .2);
    // walks (a real park's paths are its own: none are drawn across it)
    if (!D.real) { g.strokeStyle = "rgba(244,236,215,.9)"; g.lineWidth = .45;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.moveTo(x1, y0); g.lineTo(x0, y1); g.stroke(); }
    g.restore();
  }

  // water: engraved lines that follow the banks
  g.lineCap = "round"; g.lineJoin = "round";
  const WL = C.waterLines.filter(w => !w.ghost);
  for (const w of WL) { g.strokeStyle = INK; g.lineWidth = w.hw * 2 + .36; path(w.pts); g.stroke(); }
  for (const b of C.basins) { g.strokeStyle = INK; g.lineWidth = .36; g.fillStyle = INK; bpath(b); g.fill("evenodd"); g.stroke(); }
  for (const w of WL) { g.strokeStyle = WATERC; g.lineWidth = w.hw * 2; path(w.pts); g.stroke(); }
  for (const b of C.basins) { g.fillStyle = WATERC; bpath(b); g.fill("evenodd"); }
  for (const w of WL) {
    const n = Math.min(7, Math.floor(w.hw / .55));
    for (let k = 1; k <= n; k++) {
      const wd = w.hw * 2 - k * 1.05;
      if (wd <= .3) break;
      g.strokeStyle = `rgba(52,74,72,${.42 - k * .05})`; g.lineWidth = wd; path(w.pts); g.stroke();
      g.strokeStyle = WATERC; g.lineWidth = wd - .14; g.stroke();
    }
  }
  for (const b of C.basins) {
    g.save(); bpath(b); g.clip("evenodd");
    if (D.real) {
      // Surveyed water comes in pieces that meet edge to edge. Lines following each piece's bank would draw a seam
      // wherever two meet, so it is ruled instead: the same level lines across every piece.
      if (LOOK.age) { let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; for (const [x, y] of b.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } g.strokeStyle = "rgba(52,74,72,.2)"; g.lineWidth = .09; g.beginPath(); for (let y = Math.ceil(y0 / .8) * .8; y < y1; y += .8) { g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke(); }
    } else for (let k = 1; k <= 4; k++) { g.strokeStyle = `rgba(52,74,72,${.38 - k * .07})`; g.lineWidth = k * 2.1; path(b.pts, true); g.stroke(); g.strokeStyle = WATERC; g.lineWidth = k * 2.1 - .28; g.stroke(); }
    g.restore();
  }
  // the Tower and its moat
  for (const t of C.forts) {
    g.fillStyle = WATERC; g.strokeStyle = INK; g.lineWidth = .3;
    g.fillRect(t.x - t.hw, t.y - t.hh, t.hw * 2, t.hh * 2); g.strokeRect(t.x - t.hw, t.y - t.hh, t.hw * 2, t.hh * 2);
    g.fillStyle = FORTC; g.fillRect(t.x - t.hw + 1.6, t.y - t.hh + 1.6, t.hw * 2 - 3.2, t.hh * 2 - 3.2); g.strokeRect(t.x - t.hw + 1.6, t.y - t.hh + 1.6, t.hw * 2 - 3.2, t.hh * 2 - 3.2);
  }
  // wharves and stairs along the north bank
  const wharfs = [];
  for (const wtr of C.waterLines) {
    if (!wtr.wharves) continue;
    const th = wtr.pts;
    for (let i = 4; i < th.length - 4; i += 2) {
      const [ax, ay] = th[i], [bx, by] = th[i + 1];
      if (ax < wtr.wharves[0] || ax > wtr.wharves[1] || rnd() < .35) continue;
      const a = Math.atan2(by - ay, bx - ax), nx = Math.sin(a), ny = -Math.cos(a);
      const x = ax + nx * wtr.hw, y = ay + ny * wtr.hw;
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = WHARF; g.strokeStyle = INK; g.lineWidth = .14;
      const wl = 2 + rnd() * 3, wd = 1 + rnd() * 1.6;
      g.fillRect(-wl / 2, 0, wl, wd); g.strokeRect(-wl / 2, 0, wl, wd);
      g.restore();
      wharfs.push([x, y, a]);
    }
  }

  // paved squares, and the town walls (the streets drawn after them cut the gates)
  for (const p of C.plazas) { g.fillStyle = ROADF; g.strokeStyle = INK; g.lineWidth = .16; path(p.pts, true); g.fill(); g.stroke(); }
  g.lineCap = "butt";
  for (const w of C.walls) {
    if (w.kind === "fence") { g.strokeStyle = INK; g.lineWidth = .2; path(w.pts); g.stroke(); g.lineWidth = .13; g.beginPath(); for (const [x, y] of w.pts) { g.moveTo(x - .32, y - .32); g.lineTo(x + .32, y + .32); g.moveTo(x - .32, y + .32); g.lineTo(x + .32, y - .32); } g.stroke(); continue; }
    g.strokeStyle = INK; g.lineWidth = 1.5; path(w.pts); g.stroke(); g.strokeStyle = FORTC; g.lineWidth = 1.05; g.stroke();
  }
  g.lineCap = "round";
  // railways under everything else, viaduct walls either side
  for (const r of C.rails) {
    g.strokeStyle = INK; g.lineWidth = 2.5; path(r.pts); g.stroke();
    g.strokeStyle = RAILC; g.lineWidth = 2.1; g.stroke();
  }

  // streets: ink casings first, then the paper fill, so junctions merge cleanly
  const rs = C.roads.slice().sort((a, b) => b.cls - a.cls);
  for (const r of rs) { g.strokeStyle = INK; g.lineWidth = r.w + (r.cls === 0 ? .34 : .26); path(r.pts); g.stroke(); }
  for (const r of rs) { g.strokeStyle = r.cls === 0 ? MAJORF : ROADF; g.lineWidth = r.w; path(r.pts); g.stroke(); }
  // bridges: parapets where a road runs over water
  g.lineCap = "butt";
  for (const r of C.roads) {
    if (r.cls > 1) continue;
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, ay] = r.pts[i - 1], [bx, by] = r.pts[i], mx = (ax + bx) / 2, my = (ay + by) / 2;
      if (!(C.gat(mx, my) & 2)) continue;
      const l = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / l, ny = (bx - ax) / l, o = r.w / 2 + .3;
      g.strokeStyle = INK; g.lineWidth = .2;
      g.beginPath(); g.moveTo(ax + nx * o, ay + ny * o); g.lineTo(bx + nx * o, by + ny * o); g.moveTo(ax - nx * o, ay - ny * o); g.lineTo(bx - nx * o, by - ny * o); g.stroke();
      g.fillStyle = r.cls === 0 ? MAJORF : ROADF; g.beginPath(); g.moveTo(ax + nx * (o - .1), ay + ny * (o - .1)); g.lineTo(bx + nx * (o - .1), by + ny * (o - .1)); g.lineTo(bx - nx * (o - .1), by - ny * (o - .1)); g.lineTo(ax - nx * (o - .1), ay - ny * (o - .1)); g.closePath(); g.fill();
    }
  }
  g.lineCap = "round";
  // railway line on top: the classic black-and-white ladder
  for (const r of C.rails) {
    g.strokeStyle = INK; g.lineWidth = .9; path(r.pts); g.stroke();
    g.strokeStyle = ROADF; g.lineWidth = .4; g.setLineDash([1.2, 1.2]); g.stroke(); g.setLineDash([]);
  }

  // property lots of the campaign places, fenced
  for (const l of C.lots) {
    g.fillStyle = LOT; path(l.pts, true); g.fill();
    g.strokeStyle = INK; g.lineWidth = .16; g.setLineDash([.5, .35]); g.stroke(); g.setLineDash([]);
  }
  // building footprints (the 3D blocks stand on these)
  g.lineWidth = .1; g.strokeStyle = INK; g.globalAlpha = .75; g.fillStyle = FOOT;
  for (const b of C.buildings) {
    g.save(); g.translate(b.x, b.y); g.rotate(b.a);
    g.fillRect(-b.w / 2 - .08, -b.d / 2 - .08, b.w + .16, b.d + .16); g.strokeRect(-b.w / 2 - .08, -b.d / 2 - .08, b.w + .16, b.d + .16);
    g.restore();
  }
  for (const b of C.huts) { g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.fillRect(-b.w / 2, -b.d / 2, b.w, b.d); g.strokeRect(-b.w / 2, -b.d / 2, b.w, b.d); g.restore(); }
  for (const q of C.footprints) { path(q.pts, true); g.fill(); g.stroke(); }
  g.globalAlpha = 1;
  // the landmarks' own ground
  for (const L of C.landmarks) { if (L.flat || L.kind === "bridge" || L.place) continue; g.fillStyle = LOT; g.strokeStyle = INK; g.lineWidth = .2; bpath(L); g.fill("evenodd"); g.stroke(); }
  // street lamps: tiny ink dots on the kerb
  g.fillStyle = INK;
  if (LOOK.lamps !== false) for (const [x, y] of C.lamps) { g.beginPath(); g.arc(x, y, .12, 0, 6.2832); g.fill(); }

  // ---- lettering
  PXT();
  // label collision index: 6-unit buckets
  const LB = new Map(), lbk = (i, j) => i * 4096 + j;
  const free = (pts, r) => pts.every(([x, y]) => {
    const i0 = Math.floor((x - 8) / 6), i1 = Math.floor((x + 8) / 6), j0 = Math.floor((y - 8) / 6), j1 = Math.floor((y + 8) / 6);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = LB.get(lbk(i + 200, j + 200)); if (a) for (const [px, py, rr] of a) if (Math.hypot(px - x, py - y) < r + rr) return false; }
    return true;
  });
  const mark = (pts, r) => pts.forEach(([x, y]) => { const k = lbk(Math.floor(x / 6) + 200, Math.floor(y / 6) + 200); let a = LB.get(k); if (!a) LB.set(k, a = []); a.push([x, y, r]); });
  for (const L of C.LMS) mark([[L.x, L.y]], L.lr + 1);
  function along(pts, text, size, font, color, opt = {}) {
    // pts in plan units; text follows the street
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    g.font = `${font} ${size * ppu}px ${opt.family || F1}`;
    const sp = (opt.spacing || 0) * ppu;
    const chars = [...text], ws = chars.map(c => g.measureText(c).width + sp), tot = ws.reduce((a, b) => a + b, 0) / ppu;
    if (tot + 2 > L) return false;
    const at = s => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; };
    const cands = opt.repeat ? [] : [.5, .33, .67, .2, .8];
    if (opt.repeat) for (let s = opt.repeat / 2; s < L; s += opt.repeat) cands.push(s / L);
    let any = false;
    for (const f of cands) {
      const c = f * L, s0 = c - tot / 2;
      if (s0 < .5 || s0 + tot > L - .5) continue;
      const a0 = at(s0)[2], a1 = at(s0 + tot)[2];
      let turn = 0, prev = a0; for (let s = s0; s <= s0 + tot; s += .8) { const a = at(s)[2]; let d = a - prev; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; turn += Math.abs(d); prev = a; }
      if (turn > (opt.maxTurn || .7)) continue;
      const samples = []; for (let s = s0; s <= s0 + tot; s += size) samples.push(at(s));
      if (!free(samples, size * .6)) continue;
      let mid = (at(c)[2] + 6.2832 * 2) % 6.2832, flip = mid > Math.PI / 2 && mid < Math.PI * 1.5;
      g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
      if (opt.halo) { g.strokeStyle = opt.halo; g.lineWidth = Math.max(2, size * ppu * .35); g.lineJoin = "round"; }
      if (turn < .14) {
        // nearly straight: letter the whole name in one pass
        const [x, y] = at(c), a0 = at(s0), a1 = at(s0 + tot), ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
        g.save(); g.translate(tx(x), ty(y)); g.rotate(flip ? ang + Math.PI : ang);
        if ("letterSpacing" in g) g.letterSpacing = sp + "px";
        if (opt.halo) g.strokeText(text, 0, 0);
        g.fillText(text, 0, 0);
        if ("letterSpacing" in g) g.letterSpacing = "0px";
        g.restore();
        mark(samples, size * .6); any = true;
        if (!opt.repeat) break; else continue;
      }
      let s = flip ? s0 + tot : s0;
      for (let k = 0; k < chars.length; k++) {
        const w = ws[k] / ppu, sm = flip ? s - w / 2 : s + w / 2, [x, y, a] = at(sm);
        g.save(); g.translate(tx(x), ty(y)); g.rotate(flip ? a + Math.PI : a);
        if (opt.halo) g.strokeText(chars[k], 0, 0);
        g.fillText(chars[k], 0, 0); g.restore();
        s += flip ? -w : w;
      }
      mark(samples, size * .6); any = true;
      if (!opt.repeat) break;
    }
    return any;
  }
  function label(x, y, text, size, font, color, opt = {}) {
    g.font = `${font} ${size * ppu}px ${opt.family || F1}`;
    if ("letterSpacing" in g) g.letterSpacing = (opt.spacing || 0) * ppu + "px";
    const w = g.measureText(text).width / ppu;
    const samples = []; for (let s = -w / 2; s <= w / 2; s += size) samples.push([x + s * Math.cos(opt.rot || 0), y + s * Math.sin(opt.rot || 0)]);
    if (!opt.force && !free(samples, size * .55)) { if ("letterSpacing" in g) g.letterSpacing = "0px"; return false; }
    g.save(); g.translate(tx(x), ty(y)); g.rotate(opt.rot || 0);
    g.textAlign = "center"; g.textBaseline = "middle";
    if (opt.halo) { g.strokeStyle = opt.halo; g.lineWidth = size * ppu * .4; g.lineJoin = "round"; g.strokeText(text, 0, 0); }
    g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
    if ("letterSpacing" in g) g.letterSpacing = "0px";
    mark(samples, size * .55); return true;
  }
  // water and open spaces first: they get the room they need
  for (const w of C.waterLines) {
    if (!w.label) continue;
    if (w.big) along(w.pts.slice(2, -2), w.label.toUpperCase().split("").join(" "), 4.2, "italic", "rgba(40,58,56,.85)", { repeat: 230, maxTurn: 1.2 });
    else along(w.pts, w.label, w.hw * 1.2 + .5, "italic", "rgba(40,58,56,.9)", { repeat: w.repeat, maxTurn: 1 });
  }
  const mid = pts => { let x = 0, y = 0; pts.forEach(p => { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; };
  const areaOf = pts => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
  // a real city: its landmarks are named before anything else, then its water, parks and squares, none of them forced
  if (D.real || C.landmarks.length) for (const L of C.landmarks) {
    if (!L.name || !L.label || L.place) continue;
    if (L.flat) continue;
    let yb = -1e9; for (const p of L.pts) yb = Math.max(yb, p[1]);
    label(L.cx, yb + (L.major ? 1.5 : 1.15), L.name, L.major ? 1.5 : 1.1, "", INK, { family: F2, spacing: .08, halo: BLOCK }) || label(L.cx, yb + 2.9, L.name, 1.05, "", INK, { family: F2, spacing: .08, halo: BLOCK });
  }
  if (D.real) {
    for (const b of C.basins) if (b.name) { const [x, y] = b.at || mid(b.pts); label(x, y, b.name, 1.5, "italic", "rgba(40,58,56,.9)", {}); }
    for (const p of C.parks) if (p.name) { const [x, y] = mid(p.pts), big = areaOf(p.pts) > 900; label(x, y, big ? p.name.toUpperCase() : p.name, big ? 1.8 : 1.15, big ? "" : "italic", "rgba(46,52,30,.9)", big ? { family: F2, spacing: .4, halo: PARKC } : { halo: PARKC }); }
  }
  for (const p of C.plazas) if (p.name) { const [x, y] = mid(p.pts); label(x, y, p.name, 1.05, "italic", INK, { halo: ROADF }); }
  if (!D.real) for (const b of C.basins) if (b.name) { let x = 0, y = 0; b.pts.forEach(p => { x += p[0]; y += p[1]; }); label(x / b.pts.length, y / b.pts.length, b.name.toUpperCase(), 1.25, "", "rgba(40,58,56,.9)", { family: F2, spacing: .25, force: true, rot: b.name.length > 14 ? 0 : -Math.PI / 2 * (b.pts[2][1] - b.pts[0][1] > 24 ? 1 : 0) }); }
  if (!D.real) for (const p of C.parks) if (p.name) { let x = 0, y = 0; p.pts.forEach(q => { x += q[0]; y += q[1]; }); label(x / p.pts.length, y / p.pts.length, p.name.toUpperCase(), 2, "", "rgba(46,52,30,.85)", { family: F2, spacing: .5, force: true, halo: PARKC }); }
  for (const s of C.squares) if (s.name) label(s.x, s.y, s.name, Math.min(1.2, s.r * .38), "italic", "rgba(46,52,30,.9)", { halo: PARKC });
  for (const t of C.forts) if (t.name) label(t.x, t.y, t.name.toUpperCase(), 1.5, "", INK, { family: F2, spacing: .2, force: true, halo: FORTC });
  for (const r of C.rails) along(r.pts, r.name, 1.25, "italic", INK, { halo: BLOCK, repeat: 190, maxTurn: .6 });
  const riverSigns = D.signs;
  for (const [x, y, t, rot] of riverSigns) label(x, y + 2.2, t, .95, "italic", "rgba(40,58,56,.95)", { halo: WATERC, rot: rot || 0, force: !!rot });

  // street names, most important first
  const named = C.roads.filter(r => r.name && r.label).sort((a, b) => a.cls - b.cls);
  for (const r of named) {
    if (r.cls === 0) along(r.pts, r.name.toUpperCase(), 1.55, "", INK, { family: F2, spacing: .12, repeat: 120 });
    else if (r.cls === 1) along(r.pts, r.name, 1.18, "italic", INK, {});
    else if (r.cls === 2) along(r.pts, r.name, .95, "italic", INK, { maxTurn: .9 });
    else along(r.pts, r.name, .8, "italic", INK, { maxTurn: 1 });
  }
  // abbreviations, as the Ordnance Survey printed them
  const abbr = (list, t) => { for (const b of list) { const off = b.d / 2 + .9, x = b.x - Math.sin(b.a) * off, y = b.y + Math.cos(b.a) * off; label(x, y, t, .85, "italic", INK, { halo: BLOCK }) || label(b.x + Math.sin(b.a) * off, b.y - Math.cos(b.a) * off, t, .85, "italic", INK, { halo: BLOCK }); } };
  for (const k of ["pubs", "churches", "chapels", "schools"]) if (D.abbr[k]) abbr(C.specials[k], D.abbr[k]);
  if (D.abbr.gas) for (const s of C.specials.gas) label(s.x, s.y + s.r + 1.4, D.abbr.gas, .9, "italic", INK, { halo: BLOCK });

  // ---- neat line and the city beyond it, fading out
  U();
  // The plan is printed right to the edge of the sheet. (It used to fade to bare paper outside the neat line, which
  // left the houses and trees of the outskirts standing on nothing.)
  // The frame runs round the very edge of the sheet. (It used to be drawn a margin in from the edge, from the days
  // when the plan faded out beyond it; once the plan was printed to the edge, that left a stray line across the map.)
  {
    const a0 = X0 + .5, b0 = Y0 + .5, a1 = X1 - .5, b1 = Y1 - .5, i0 = a0 + 1.3, j0 = b0 + 1.3, i1 = a1 - 1.3, j1 = b1 - 1.3;
    g.strokeStyle = INK; g.lineWidth = .5; g.strokeRect(a0, b0, a1 - a0, b1 - b0);
    g.lineWidth = .18; g.strokeRect(i0, j0, i1 - i0, j1 - j0);
    g.lineWidth = .14; g.beginPath();
    for (let x = Math.ceil(i0 / 10) * 10; x <= i1; x += 10) { const l = x % 50 ? .5 : 1; g.moveTo(x, j0); g.lineTo(x, j0 + l); g.moveTo(x, j1); g.lineTo(x, j1 - l); }
    for (let y = Math.ceil(j0 / 10) * 10; y <= j1; y += 10) { const l = y % 50 ? .5 : 1; g.moveTo(i0, y); g.lineTo(i0 + l, y); g.moveTo(i1, y); g.lineTo(i1 - l, y); }
    g.stroke();
  }
  PXT();
  // the title, in a cartouche at the head of the sheet; the credit for a surveyed city at its foot
  if (D.title || D.subtitle) {
    g.font = `${4.4 * ppu}px ${F2}`; let tw = D.title ? g.measureText(D.title.toUpperCase()).width / ppu + D.title.length * .5 : 0;
    g.font = `italic ${1.9 * ppu}px ${F1}`; if (D.subtitle) tw = Math.max(tw, g.measureText(D.subtitle).width / ppu);
    const bw = Math.min(X1 - X0 - 12, tw + 12), bh = D.title && D.subtitle ? 13 : 8.5, bx = SW / 2 - bw / 2, by = Y0 + 4.2;
    U(); g.fillStyle = PAPER; g.fillRect(bx, by, bw, bh); g.strokeStyle = INK; g.lineWidth = .3; g.strokeRect(bx, by, bw, bh); g.lineWidth = .12; g.strokeRect(bx + .7, by + .7, bw - 1.4, bh - 1.4); PXT();
    if (D.title) label(SW / 2, by + 4.6, D.title.toUpperCase(), 4.4, "", INK, { family: F2, spacing: .5, force: true });
    if (D.subtitle) label(SW / 2, by + (D.title ? 10 : 4.4), D.subtitle, 1.9, "italic", INK, { force: true });
  }
  if (D.credit) label(SW / 2, Y1 - 4.2, D.credit, 1.25, "italic", INK, { force: true, halo: PAPER });
  // scale bar and north point, on the south bank
  U();
  {
    const sx = 18, sy = SH - 8;
    if (D.scaleLabel) {
    g.fillStyle = PAPER; g.fillRect(sx - 3, sy - 5.6, 46, 9);
    g.strokeStyle = INK; g.lineWidth = .16; g.strokeRect(sx - 3, sy - 5.6, 46, 9);
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? PAPER : INK; g.fillRect(sx + k * 10, sy, 10, 1); }
    g.strokeRect(sx, sy, 40, 1);
    PXT(); label(sx + 20, sy - 2.6, D.scaleLabel, 1.2, "italic", INK, { force: true });
    [0, 1, 2, 3, 4].forEach(k => label(sx + k * 10, sy + 2.3, String((D.scaleTicks || [0, 1, 2, 3, 4])[k]), .9, "", INK, { force: true }));
    }
    U();
    const nx = SW - 14, ny = SH - 12;
    g.fillStyle = INK; g.beginPath(); g.moveTo(nx, ny - 7); g.lineTo(nx + 1.6, ny); g.lineTo(nx, ny - 1.2); g.closePath(); g.fill();
    g.fillStyle = PAPER; g.strokeStyle = INK; g.lineWidth = .14; g.beginPath(); g.moveTo(nx, ny - 7); g.lineTo(nx - 1.6, ny); g.lineTo(nx, ny - 1.2); g.closePath(); g.fill(); g.stroke();
    PXT(); label(nx, ny - 9, "N", 2, "", INK, { family: F2, force: true });
  }

  // ---- age: folds, stains, foxing, grain (an old sheet only)
  if (LOOK.age) {
  U();
  g.strokeStyle = "rgba(120,92,58,.18)"; g.lineWidth = .5;
  g.beginPath(); g.moveTo(X0, SH / 2); g.lineTo(X1, SH / 2 + 1); g.moveTo(SW / 3, Y0); g.lineTo(SW / 3 - 1, Y1); g.moveTo(SW * 2 / 3, Y0); g.lineTo(SW * 2 / 3 + 1, Y1); g.stroke();
  g.strokeStyle = "rgba(255,250,235,.35)"; g.lineWidth = .25;
  g.beginPath(); g.moveTo(X0, SH / 2 + .6); g.lineTo(X1, SH / 2 + 1.6); g.moveTo(SW / 3 + .5, Y0); g.lineTo(SW / 3 - .5, Y1); g.moveTo(SW * 2 / 3 + .5, Y0); g.lineTo(SW * 2 / 3 + 1.5, Y1); g.stroke();
  for (let k = 0; k < 26; k++) {
    const x = X0 + rnd() * (X1 - X0), y = Y0 + rnd() * (Y1 - Y0), r = 6 + rnd() * 34;
    const gr = g.createRadialGradient(x, y, r * .2, x, y, r);
    gr.addColorStop(0, `rgba(150,108,58,${.04 + rnd() * .06})`); gr.addColorStop(.85, `rgba(150,108,58,${.02 + rnd() * .03})`); gr.addColorStop(1, "rgba(150,108,58,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  }
  for (let k = 0; k < 260; k++) { g.fillStyle = `rgba(140,96,50,${.08 + rnd() * .16})`; g.beginPath(); g.arc(X0 + rnd() * (X1 - X0), Y0 + rnd() * (Y1 - Y0), .1 + rnd() * .45, 0, 6.2832); g.fill(); }
  PXT();
  const pcx = tx((X0 + X1) / 2), pcy = ty((Y0 + Y1) / 2);
  const vg = g.createRadialGradient(pcx, pcy, (Y1 - Y0) * ppu * .35, pcx, pcy, (X1 - X0) * ppu * .62);
  vg.addColorStop(0, "rgba(110,80,40,0)"); vg.addColorStop(1, "rgba(110,80,40,.22)");
  g.fillStyle = vg; g.fillRect(0, 0, cv.width, cv.height);
  // paper grain: a soft mottling tied to the plan, a little over half a plan unit to the cell and smoothed.
  // (It used to be one random value per pixel, which crawled like static whenever the map moved.)
  const nz = document.createElement("canvas"); nz.width = nz.height = 128;
  const nzg = nz.getContext("2d"), nzi = nzg.createImageData(128, 128);
  for (let i = 0; i < nzi.data.length; i += 4) { const v = 110 + rnd() * 50; nzi.data[i] = v; nzi.data[i + 1] = v * .92; nzi.data[i + 2] = v * .8; nzi.data[i + 3] = 10 + rnd() * 20; }
  nzg.putImageData(nzi, 0, 0);
  const cell = .6;
  g.setTransform(ppu * cell, 0, 0, ppu * cell, -V.x0 * ppu, -V.y0 * ppu);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.globalCompositeOperation = "multiply"; g.fillStyle = g.createPattern(nz, "repeat"); g.fillRect(V.x0 / cell, V.y0 / cell, (V.x1 - V.x0) / cell, (V.y1 - V.y0) / cell);
  g.globalCompositeOperation = "source-over"; PXT();
  }
  return cv;
}

function createMap3D(host, C, planCanvas, hooks) {
  const T = THREE;
  const SW = CD.sheet.w, SH = CD.sheet.h, wx = x => x - SW / 2, wz = y => y - SH / 2, SPAN = PLAN.X1 - PLAN.X0;
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "3D street plan" + (CD.title ? ": " + CD.title : "") + ", with the campaign's places numbered");
  host.insertBefore(renderer.domElement, host.firstChild);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 1, Math.max(4000, SPAN * 5.5));
  const fog = new T.Fog(LOOK.table, 300, 1200); scene.fog = fog;

  // light: low northwest sun, the engraver's convention
  const hemi = new T.HemisphereLight(0xfff6e6, 0x8a7a60, .66); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff0d6, .48);
  sun.position.set(-220, 300, -140); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -(SW / 2 + 80), right: SW / 2 + 80, top: SH / 2 + 110, bottom: -(SH / 2 + 110), near: 10, far: 900 });
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .25;
  scene.add(sun, sun.target);

  // ground: the printed plan
  const tex = new T.CanvasTexture(planCanvas);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); tex.minFilter = T.LinearMipmapLinearFilter;
  const groundMat = new T.MeshLambertMaterial({ map: tex });
  const ground = new T.Mesh(new T.PlaneGeometry(PLAN.X1 - PLAN.X0, PLAN.Y1 - PLAN.Y0), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(wx((PLAN.X0 + PLAN.X1) / 2), 0, wz((PLAN.Y0 + PLAN.Y1) / 2));
  ground.receiveShadow = true; scene.add(ground);
  // The table under the sheet. It used to lie .05 below the plan, and from a distance the two fought for the same
  // depth and flickered. Now it is drawn first and never written to the depth buffer, so the plan always wins.
  const tableMat = new T.MeshBasicMaterial({ color: LOOK.table, depthWrite: false });
  const table = new T.Mesh(new T.PlaneGeometry(6000, 6000), tableMat); table.rotation.x = -Math.PI / 2; table.position.y = -.6; table.renderOrder = -1; scene.add(table);

  // The sharp print. The plan first appears as the one modest texture above, so the map is there at once. Then,
  // while the browser is idle, the same plan is printed again in six tiles at a higher resolution, and when all six
  // are ready they replace the first print in a single step. After that nothing about the ground changes with the
  // view: no patch that follows the camera, nothing laid over anything, so nothing can pop or fight for depth.
  const groundMats = [groundMat];
  function sharpen(ppu) {
    if (!hooks.detail || !ppu) return;
    const NX = Math.max(1, Math.ceil(SPAN * ppu / 2700)), NY = Math.max(1, Math.ceil((PLAN.Y1 - PLAN.Y0) * ppu / 2700)), tw = SPAN / NX, th = (PLAN.Y1 - PLAN.Y0) / NY, pad = 16 / ppu, made = [];
    const jobs = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) jobs.push([i, j]);
    const idle = window.requestIdleCallback ? f => window.requestIdleCallback(f, { timeout: 1500 }) : f => setTimeout(f, 80);
    const step = () => {
      const job = jobs.shift();
      if (!job) {
        // every tile is printed and already on the graphics card: change over
        for (const m of made) scene.add(m);
        scene.remove(ground); ground.geometry.dispose(); tex.dispose(); groundMats.splice(groundMats.indexOf(groundMat), 1); groundMat.dispose();
        planCanvas.width = planCanvas.height = 0;
        request(); return;
      }
      const [i, j] = job, x0 = PLAN.X0 + i * tw, y0 = PLAN.Y0 + j * th;
      let cv = null;
      try { cv = hooks.detail({ x0: x0 - pad, y0: y0 - pad, x1: x0 + tw + pad, y1: y0 + th + pad }, ppu); } catch (err) { cv = null; }
      if (!cv || !cv.width) { for (const m of made) { m.material.map.dispose(); m.material.dispose(); } return; }   // not enough memory: keep the first print
      // each tile is printed a little larger than it is shown, so that its blurred small copies never reach its edge
      const t = new T.CanvasTexture(cv); t.anisotropy = tex.anisotropy; t.minFilter = T.LinearMipmapLinearFilter;
      t.repeat.set(tw / (tw + 2 * pad), th / (th + 2 * pad)); t.offset.set(pad / (tw + 2 * pad), pad / (th + 2 * pad));
      t.onUpdate = () => { cv.width = cv.height = 0; };          // once it is on the graphics card the canvas can go
      const mat = new T.MeshLambertMaterial({ map: t }); mat.color.copy(groundMat.color); groundMats.push(mat);
      const mesh = new T.Mesh(new T.PlaneGeometry(tw, th), mat);
      mesh.rotation.x = -Math.PI / 2; mesh.position.set(wx(x0 + tw / 2), 0, wz(y0 + th / 2)); mesh.receiveShadow = true;
      if (renderer.initTexture) renderer.initTexture(t);
      made.push(mesh);
      idle(step);
    };
    idle(step);
  }

  // ---- geometry helpers
  const boxG = new T.BoxGeometry(1, 1, 1); boxG.translate(0, .5, 0);
  const roofG = new T.BufferGeometry();
  {
    const A = [-.5, 0, -.5], B = [.5, 0, -.5], Cc = [.5, 0, .5], D = [-.5, 0, .5], E = [-.5, 1, 0], F = [.5, 1, 0];
    const tri = [A, E, F, A, F, B, D, Cc, F, D, F, E, A, D, E, Cc, B, F];
    roofG.setAttribute("position", new T.Float32BufferAttribute(tri.flat(), 3)); roofG.computeVertexNormals();
  }
  const coneG = new T.ConeGeometry(.5, 1, 8); coneG.translate(0, .5, 0);
  const cylG = new T.CylinderGeometry(.5, .5, 1, 14); cylG.translate(0, .5, 0);
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3(), col = new T.Color();
  function instanced(geo, list, mat, cast = true) {
    if (!list.length) return null;
    const mesh = new T.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => {
      e.set(0, it.ry || 0, 0); q.setFromEuler(e); v.set(it.x, it.y || 0, it.z); sc.set(it.sx, it.sy, it.sz);
      m4.compose(v, q, sc); mesh.setMatrixAt(i, m4); col.set(it.c); mesh.setColorAt(i, col);
    });
    mesh.castShadow = cast; mesh.receiveShadow = true;
    scene.add(mesh); return mesh;
  }
  const rnd = mulberry32(31);
  const pick = a => a[(rnd() * a.length) | 0];
  const BRICK = LOOK.brick, STONE = LOOK.stone, WARE = LOOK.ware, SLATE = LOOK.slate, TILE = LOOK.tile;
  let bi = 0;                              // counts ordinary buildings, for the look's own variety
  const mixHex = (a, b, t) => { const ca = new T.Color(a), cb = new T.Color(b); return "#" + ca.lerp(cb, t).getHexString(); };

  // lamp posts, chimneys and tree trunks are thinner than a pixel from far off, and anything that thin flickers as
  // the view moves: each is drawn only when the camera is within the distance given
  const lod = [];
  // ---- ordinary buildings
  const walls = [], roofs = [], chim = [], spires = [], stacks = [], lampPosts = [], lampHeads = [];
  for (const b of C.buildings) {
    const wall = b.type === "ware" ? pick(WARE) : b.type === "church" || b.type === "chapel" || b.type === "school" ? mixHex(pick(STONE), "#9a8f7c", .3) : mixHex(pick(BRICK), pick(STONE), b.west * .85);
    const ry = -b.a, x = wx(b.x), z = wz(b.y);
    // ruin: 0 to 1, the share of houses that stand roofless and broken (a town that has been fought over)
    const ruined = CD.ruin > 0 && h01(bi * 7 + 2) < CD.ruin, H = b.h * LOOK.tall(bi, b) * (ruined ? .25 + h01(bi + 9) * .35 : 1), pitched = !ruined && !!b.roof && LOOK.pitched(bi, b); bi++;
    const roofH = pitched ? Math.min(LOOK.roofMax || 1.1, b.d * (LOOK.roofK || .36)) : 0;
    walls.push({ x, z, sx: b.w, sy: H, sz: b.d, ry, c: ruined ? mixHex(wall, "#4a4540", .5) : b.type === "pub" ? LOOK.pub : wall });
    if (pitched) roofs.push({ x, y: H, z, sx: b.w + .12, sy: roofH, sz: b.d + .12, ry, c: b.type === "pub" ? "#3f3a35" : rnd() < .2 ? pick(TILE) : pick(SLATE) });
    else if (!ruined) walls.push({ x, y: H, z, sx: b.w + .1, sy: .12, sz: b.d + .1, ry, c: LOOK.flats ? LOOK.flats[bi % LOOK.flats.length] : LOOK.flat });
    if (b.type === "terrace" && pitched && LOOK.chimneys && rnd() < .55 && b.w > 2.4) {
      const ca = Math.cos(b.a), sa = Math.sin(b.a), u = b.w / 2 - .35;
      for (const s of [-1, 1]) chim.push({ x: x + ca * u * s, y: H + roofH * .4, z: z + sa * u * s, sx: .38, sy: roofH * .6 + .55, sz: .7, ry, c: "#6b4f40" });
    }
    if (b.type === "church") {
      const ca = Math.cos(b.a), sa = Math.sin(b.a), u = b.w / 2 + .7, tw = Math.min(1.9, b.d * .6);
      const tx = x + ca * u, tz = z + sa * u;
      walls.push({ x: tx, z: tz, sx: tw, sy: H * 2.1, sz: tw, ry, c: "#b5a98f" });
      spires.push({ x: tx, y: H * 2.1, z: tz, sx: tw * 1.15, sy: H * 1.9, sz: tw * 1.15, ry, c: "#5e5a52" });
    }
  }
  // rows of huts and tents the site gives outright
  const barrels = [];
  for (const b of C.huts) {
    const x = wx(b.x), z = wz(b.y), ry = -b.a;
    if (b.roof === "tent") roofs.push({ x, z, sx: b.w, sy: b.h, sz: b.d, ry, c: b.c || (LOOK.age ? "#b9ad8a" : "#8f9479") });
    else if (b.roof === "barrel") barrels.push({ x, z, sx: b.w, sy: b.h * 2, sz: b.d, ry, c: b.c || "#8d9297" });
    else { walls.push({ x, z, sx: b.w, sy: b.h, sz: b.d, ry, c: b.c || (LOOK.age ? "#8f7b62" : "#a7a99b") }); if (b.roof === "flat") walls.push({ x, y: b.h, z, sx: b.w + .1, sy: .1, sz: b.d + .1, ry, c: LOOK.flat }); else roofs.push({ x, y: b.h, z, sx: b.w + .12, sy: Math.min(.9, b.d * .3), sz: b.d + .12, ry, c: LOOK.age ? "#5c5148" : "#70757a" }); }
  }
  const barrelG = new T.CylinderGeometry(.5, .5, 1, 14, 1, false, 0, Math.PI); barrelG.rotateZ(Math.PI / 2);
  instanced(barrelG, barrels, new T.MeshLambertMaterial({ color: 0xffffff, side: T.DoubleSide }));
  if (LOOK.stacks !== false) for (const s of C.specials.stacks) stacks.push({ x: wx(s.x), z: wz(s.y), sx: .9, sy: s.h, sz: .9, c: "#6e4d3c" });
  for (const gsh of C.specials.gas) { stacks.push({ x: wx(gsh.x), z: wz(gsh.y), sx: gsh.r * 2, sy: 2.6, sz: gsh.r * 2, c: "#7d7a70" }); }
  const wallMat = new T.MeshLambertMaterial({ color: 0xffffff });
  instanced(boxG, walls, wallMat);
  instanced(roofG, roofs, new T.MeshLambertMaterial({ color: 0xffffff, side: T.DoubleSide }));
  lod.push([instanced(boxG, chim, wallMat), 380]);
  instanced(coneG, spires, new T.MeshLambertMaterial({ color: 0xffffff }));
  instanced(cylG, stacks, new T.MeshLambertMaterial({ color: 0xffffff }));
  // viaducts
  instanced(boxG, C.viaduct.map(s => ({ x: wx(s.x), z: wz(s.y), sx: s.l, sy: CD.railHeight || 1.1, sz: 1.9, ry: -s.a, c: LOOK.age ? "#957b66" : "#8e9297" })), wallMat);
  // gas lamps
  if (LOOK.lamps !== false) for (const [lx, ly] of C.lamps) { lampPosts.push({ x: wx(lx), z: wz(ly), sx: .09, sy: 1.15, sz: .09, c: "#2e2a25" }); lampHeads.push({ x: wx(lx), y: 1.1, z: wz(ly), sx: .26, sy: .3, sz: .26, c: "#ffffff" }); }
  lod.push([instanced(boxG, lampPosts, wallMat, false), 280]);
  const lampMat = new T.MeshBasicMaterial({ color: 0x3a342c });
  lod.push([instanced(boxG, lampHeads, lampMat, false), 280]);
  // trees, boats
  const trunks = [], crowns = [];
  for (const [x, y, s] of C.trees) { trunks.push({ x: wx(x), z: wz(y), sx: .18, sy: s * 1.1, sz: .18, c: "#4a3a2a" }); crowns.push({ x: wx(x), y: s * .9, z: wz(y), sx: s * 1.5, sy: s * 1.4, sz: s * 1.5, ry: rnd() * 6, c: pick(["#6f7550", "#66704a", "#7a7d55", "#5e6644"]) }); }
  lod.push([instanced(boxG, trunks, wallMat, false), 380]);
  const crownG = new T.IcosahedronGeometry(.5, 0); crownG.translate(0, .5, 0);
  instanced(crownG, crowns, new T.MeshLambertMaterial({ color: 0xffffff }));
  instanced(boxG, C.boats.map(b => ({ x: wx(b.x), y: -.1, z: wz(b.y), sx: b.l, sy: .55, sz: b.w, ry: -b.a, c: pick(["#4b3a2c", "#3e3226", "#5a4533"]) })), wallMat);
  // the Tower, and Tower Bridge rising in the river
  {
    const tw = [];
    for (const t of C.forts) {
    const tx = wx(t.x), tz = wz(t.y), iw = t.hw - 1.6, ih = t.hh - 1.6;
    tw.push({ x: tx, z: tz - ih, sx: iw * 2, sy: 1.6, sz: .7, c: "#b9ad93" }, { x: tx, z: tz + ih, sx: iw * 2, sy: 1.6, sz: .7, c: "#b9ad93" }, { x: tx - iw, z: tz, sx: .7, sy: 1.6, sz: ih * 2, c: "#b9ad93" }, { x: tx + iw, z: tz, sx: .7, sy: 1.6, sz: ih * 2, c: "#b9ad93" });
    tw.push({ x: tx, z: tz, sx: 4.4, sy: 4.6, sz: 3.8, c: "#cbbfa4" });
    for (const [dx, dz] of [[-1.9, -1.6], [1.9, -1.6], [-1.9, 1.6], [1.9, 1.6]]) tw.push({ x: tx + dx, z: tz + dz, sx: .9, sy: 5.6, sz: .9, c: "#c4b89c" });
    for (const [dx, dz] of [[-iw, -ih], [iw, -ih], [-iw, ih], [iw, ih]]) tw.push({ x: tx + dx, z: tz + dz, sx: 1.4, sy: 2.2, sz: 1.4, c: "#b2a68c" });
    }
    for (const [bx, by] of CD.towers) tw.push({ x: wx(bx), z: wz(by), sx: 2.6, sy: 6.5, sz: 2.2, c: "#a69b84" }, { x: wx(bx), y: 6.5, z: wz(by), sx: 1.6, sy: 1.5, sz: 1.4, c: "#8f8573" });
    // town walls: a curtain along the line, a tower at each turn of about a bowshot
    for (const w of C.walls) { let run = 99; if (w.kind === "fence" || w.kind === "hesco") { for (let i = 1; i < w.pts.length; i++) { const [ax, ay] = w.pts[i - 1], [bx, by] = w.pts[i], l = Math.hypot(bx - ax, by - ay), ry = -Math.atan2(by - ay, bx - ax); if (w.kind === "hesco") tw.push({ x: wx((ax + bx) / 2), z: wz((ay + by) / 2), sx: l + .1, sy: 1.15, sz: 1.2, ry, c: "#b9a57e" }); else tw.push({ x: wx((ax + bx) / 2), z: wz((ay + by) / 2), sx: l, sy: 1.2, sz: .05, ry, c: "#8a8a80" }, { x: wx(ax), z: wz(ay), sx: .12, sy: 1.4, sz: .12, ry, c: "#4d4a44" }); } continue; } for (let i = 1; i < w.pts.length; i++) { const [ax, ay] = w.pts[i - 1], [bx, by] = w.pts[i], l = Math.hypot(bx - ax, by - ay), ry = -Math.atan2(by - ay, bx - ax); tw.push({ x: wx((ax + bx) / 2), z: wz((ay + by) / 2), sx: l + .1, sy: 1.7, sz: .7, ry, c: "#b9ad93" }); run += l; if (run > 15) { run = 0; tw.push({ x: wx(ax), z: wz(ay), sx: 1.35, sy: 2.6, sz: 1.35, ry, c: "#b2a68c" }); } } }
    instanced(boxG, tw, wallMat);
  }

  // ---- landmarks: the true footprint raised to its height, and on it whatever its kind calls for.
  //      add(geometry, material, x, y, z, sx, sy, sz, ry, outline) places one piece about the centre of the landmark.
  const domeG = new T.SphereGeometry(.5, 20, 10, 0, 6.2832, 0, Math.PI / 2), ballG = new T.SphereGeometry(.5, 14, 10);
  const taper4G = new T.CylinderGeometry(.045, .5, 1, 4); taper4G.translate(0, .5, 0); taper4G.rotateY(Math.PI / 4);
  const obeliskG = new T.CylinderGeometry(.32, .5, 1, 4); obeliskG.translate(0, .5, 0); obeliskG.rotateY(Math.PI / 4);
  const frustG = new T.CylinderGeometry(.3, .5, 1, 14); frustG.translate(0, .5, 0);
  const pyrG = new T.ConeGeometry(.7071, 1, 4); pyrG.translate(0, .5, 0); pyrG.rotateY(Math.PI / 4);
  const wheelG = new T.TorusGeometry(.5, .016, 6, 48);
  const spokeG = new T.BoxGeometry(1, 1, 1);
  const fpGeo = (L, h, k = 1, kin = 0) => {
    const ring = (r, q) => r.map(([x, y]) => new T.Vector2((x - L.cx) * q, -(y - L.cy) * q));
    const sh = new T.Shape(ring(L.pts, k));
    if (kin) sh.holes.push(new T.Path(ring(L.pts, kin))); else for (const hl of L.holes || []) sh.holes.push(new T.Path(ring(hl, k)));
    const geo = new T.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); return geo;
  };
  // surveyed footprints: every one raised to its height, all in one mesh (walls one colour, tops another)
  if (C.footprints.length) {
    const pos = [], nor = [], colr = [], wc = new T.Color(), rc = new T.Color();
    C.footprints.forEach((q, i) => {
      let geo; try { geo = fpGeo({ pts: q.pts, holes: q.holes, cx: q.pts[0][0], cy: q.pts[0][1] }, q.h || 1.5); } catch (err) { return; }
      const P = geo.attributes.position.array, N = geo.attributes.normal.array, ox = wx(q.pts[0][0]), oz = wz(q.pts[0][1]);
      wc.set(q.c || (q.ruin ? "#7d766c" : mixHex(BRICK[i % BRICK.length], STONE[i % STONE.length], .4))); rc.set(q.ruin ? "#5a544c" : LOOK.age ? SLATE[i % SLATE.length] : (LOOK.flats || [LOOK.flat])[i % (LOOK.flats || [0]).length]);
      for (let k = 0; k < P.length; k += 3) { pos.push(P[k] + ox, P[k + 1], P[k + 2] + oz); nor.push(N[k], N[k + 1], N[k + 2]); const cc = N[k + 1] > .9 ? rc : wc; colr.push(cc.r, cc.g, cc.b); }
      geo.dispose();
    });
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); geo.setAttribute("color", new T.Float32BufferAttribute(colr, 3));
    const mesh = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true })); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  }
  function raise(L, add, M) {
    const c = Math.cos(L.ang), sn = Math.sin(L.ang), ry = -L.ang, at = (u, v) => [u * c - v * sn, u * sn + v * c];
    const H = L.h, short = Math.max(.6, Math.min(L.w, L.d)), long = Math.max(L.w, L.d), lw = L.w >= L.d;   // lw: the long axis is the first axis of the footprint
    const ax = (u, v) => lw ? at(u, v) : at(v, u), ryL = lw ? ry : ry + Math.PI / 2;                         // (along the long axis, across it)
    const body = (h, mat) => add(fpGeo(L, h), mat || M.wall, 0, 0, 0, 1, 1, 1), cap = (y, k = 1.02, t = .22) => add(fpGeo(L, t, k), M.roof, 0, y, 0, 1, 1, 1, 0, false);
    const dome = (u, v, r, y, k = 1) => { const [x, z] = ax(u, v); add(cylG, M.wall, x, y, z, r * 2, r * .35, r * 2, 0, false); add(domeG, M.roof, x, y + r * .35, z, r * 2, r * 2 * k, r * 2, 0, false); add(boxG, M.wall, x, y + r * .35 + r * k, z, r * .16, r * .4, r * .16, 0, false); };
    switch (L.kind) {
      case "tower": {
        // a masonry tower (a campanile, a keep, a clock tower) is stone with a cap; any other is glass where the age has it
        if (L.top === "stone") { body(H * .9); add(pyrG, M.roof, 0, H * .9, 0, L.w * 1.06, H * .1, L.d * 1.06, ry, false); break; }
        const mat = M.glasses ? M.glasses[Math.floor(Math.abs(L.x * 7.3 + L.y * 3.1)) % M.glasses.length] : M.glass || M.wall;
        if (L.top === "taper" || L.top === "needle") {
          for (const [y0, y1, k] of [[0, .5, 1], [.5, .76, .72], [.76, .92, .46]]) add(fpGeo(L, H * (y1 - y0), k), mat, 0, H * y0, 0, 1, 1, 1);
          add(boxG, M.dark, 0, H * .92, 0, short * .09, H * .08, short * .09, ry, false);
        } else { body(H, mat); cap(H, .9, .3); }
        break;
      }
      case "church": {
        const bh = L.body || Math.max(1.6, Math.min(H * .42, 4.4)), west = (lw ? c : -sn) >= 0 ? -1 : 1, tw = Math.max(1.1, Math.min(short * .42, 3.4));
        body(bh);
        { const [x, z] = ax(0, 0); add(roofG, M.roof, x, bh, z, long * .96, Math.min(2.4, short * .3), short * .62, ryL, false); }
        if (L.top === "dome") dome(-west * long * .2, 0, short * .34, bh, 1.15);
        else if (L.top === "twin") for (const v of [-1, 1]) { const [x, z] = ax(west * (long / 2 - tw / 2), v * (short / 2 - tw / 2)); add(boxG, M.wall, x, 0, z, tw, H * .72, tw, ryL); add(coneG, M.roof, x, H * .72, z, tw * 1.2, H * .28, tw * 1.2, ryL, false); }
        else if (L.top !== "flat") { const [x, z] = ax(west * (long / 2 - tw / 2), 0); add(boxG, M.wall, x, 0, z, tw, H * .6, tw, ryL); add(coneG, M.roof, x, H * .6, z, tw * 1.2, H * .4, tw * 1.2, ryL, false); }
        break;
      }
      case "mosque": {
        const bh = L.body || Math.max(1.4, Math.min(H * .35, 3.2)), r = short * .3;
        body(bh); cap(bh); dome(0, 0, r, bh);
        for (const [su, sv] of short > 6 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : [[-1, -1], [1, 1]]) { const [x, z] = ax(su * (long / 2 - .4), sv * (short / 2 - .4)); add(cylG, M.wall, x, 0, z, .62, H * .88, .62, 0, false); add(coneG, M.roof, x, H * .88, z, .85, H * .12, .85, 0, false); }
        break;
      }
      case "dome": { const r = short * .36, bh = L.body || Math.max(1.2, H - r * 1.3); body(bh); cap(bh); dome(0, 0, r, bh); break; }
      case "castle": {
        const wh = Math.min(H, 2.3);
        if (short < 5) { body(H); cap(H, 1.04, .3); for (const [su, sv] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [x, z] = ax(su * long / 2, sv * short / 2); add(cylG, M.wall, x, 0, z, 1.1, H * 1.25, 1.1, 0, false); } break; }
        add(fpGeo(L, wh, 1, Math.max(.6, 1 - 1.6 / short)), M.wall, 0, 0, 0, 1, 1, 1);
        add(fpGeo(L, Math.max(H, wh * 1.9), .36), M.wall, 0, 0, 0, 1, 1, 1); add(fpGeo(L, .25, .39), M.roof, 0, Math.max(H, wh * 1.9), 0, 1, 1, 1, 0, false);
        let last = null, count = 0;
        for (const p of L.pts) { if (count > 11 || (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 5.5)) continue; last = p; count++; add(cylG, M.wall, p[0] - L.cx, 0, p[1] - L.cy, 1.5, wh * 1.45, 1.5, 0, false); if (L.top === "spires") add(coneG, M.roof, p[0] - L.cx, wh * 1.45, p[1] - L.cy, 1.8, 1.5, 1.8, 0, false); }
        break;
      }
      case "stadium": add(fpGeo(L, H, 1, .6), M.wall, 0, 0, 0, 1, 1, 1); add(fpGeo(L, .1, .6), M.green, 0, .03, 0, 1, 1, 1, 0, false); break;
      case "spire": {
        const r = Math.max(short, H * .12);
        if (L.top === "needle") { add(cylG, M.wall, 0, 0, 0, Math.max(.5, H * .045), H * .8, Math.max(.5, H * .045), 0, false); add(ballG, M.glass || M.roof, 0, H * .6, 0, H * .12, H * .07, H * .12, 0, false); add(boxG, M.dark, 0, H * .8, 0, .16, H * .2, .16, 0, false); }
        else if (L.top === "obelisk") { add(obeliskG, M.wall, 0, 0, 0, short, H * .9, short, ry); add(pyrG, M.wall, 0, H * .9, 0, short * .64, H * .1, short * .64, ry, false); }
        else if (L.top === "column") { add(boxG, M.wall, 0, 0, 0, short, H * .12, short, ry); add(cylG, M.wall, 0, H * .12, 0, short * .45, H * .7, short * .45, 0, false); add(boxG, M.dark, 0, H * .82, 0, short * .3, H * .18, short * .3, ry, false); }
        else if (L.top === "light") { add(frustG, M.wall, 0, 0, 0, short, H * .84, short, 0, false); add(cylG, M.glow, 0, H * .84, 0, short * .5, H * .08, short * .5, 0, false); add(coneG, M.roof, 0, H * .92, 0, short * .7, H * .08, short * .7, 0, false); }
        else if (L.top === "stack") add(frustG, M.wall, 0, 0, 0, short, H, short, 0, false);
        else { add(taper4G, M.dark, 0, 0, 0, r * 1.4, H, r * 1.4, ry); for (const q of [.18, .38]) add(boxG, M.dark, 0, H * q, 0, r * 1.4 * (1 - q) * .72, H * .018, r * 1.4 * (1 - q) * .72, ry, false); }
        break;
      }
      case "monument":
        if (L.top === "fountain") { add(cylG, M.wall, 0, 0, 0, short * 1.6, .35, short * 1.6, 0, false); add(cylG, M.glass || M.roof, 0, .35, 0, short * 1.3, .06, short * 1.3, 0, false); add(cylG, M.wall, 0, 0, 0, .3, H * .5, .3, 0, false); }
        else { add(boxG, M.wall, 0, 0, 0, short, H * .3, short, ry); if (L.top === "statue") add(boxG, M.dark, 0, H * .3, 0, short * .35, H * .7, short * .35, ry, false); else add(obeliskG, M.wall, 0, H * .3, 0, short * .55, H * .7, short * .55, ry, false); }
        break;
      case "pyramid": add(pyrG, M.wall, 0, 0, 0, L.w, H, L.d, ry); break;
      case "watchtower": {
        for (const [su, sv] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [x, z] = at(su * short * .36, sv * short * .36); add(boxG, M.dark, x, 0, z, .14, H * .64, .14, ry, false); }
        add(boxG, M.wall, 0, H * .6, 0, short * .95, H * .26, short * .95, ry); add(pyrG, M.roof, 0, H * .86, 0, short * 1.25, H * .2, short * 1.25, ry, false);
        break;
      }
      case "tent": { const [x, z] = ax(0, 0); add(roofG, M.roof, x, 0, z, long, H, short, ryL); break; }
      case "hangar": { const [x, z] = ax(0, 0); add(barrelG, M.roof, x, 0, z, long, H * 2, short, ryL, false); add(boxG, M.dark, ...ax(long / 2, 0).slice(0, 1), 0, ax(long / 2, 0)[1], .12, H * .8, short * .7, ryL, false); void x; void z; break; }
      case "bunker": { body(H * .8); const [x, z] = ax(0, 0); add(domeG, M.green, x, H * .5, z, long * 1.2, H * 1.5, short * 1.2, ryL, false); break; }
      case "gate": {
        for (const su of [-1, 1]) { const [x, z] = ax(su * long / 2, 0); add(boxG, M.wall, x, 0, z, .6, H, .6, ryL); }
        { const [x, z] = ax(0, 0); add(boxG, M.dark, x, H * .86, z, long + .6, H * .14, .5, ryL, false); }
        { const [x, z] = ax(long / 2 + 1.4, .9); add(boxG, M.wall, x, 0, z, 1.6, 1.3, 1.4, ryL); add(boxG, M.roof, x, 1.3, z, 1.8, .15, 1.6, ryL, false); }
        break;
      }
      case "tank": add(cylG, M.wall, 0, 0, 0, short, H, short, 0, false); add(coneG, M.roof, 0, H, 0, short * 1.02, H * .18, short * 1.02, 0, false); break;
      case "pad": add(cylG, M.dark, 0, 0, 0, short, .08, short, 0, false); add(cylG, M.wall, 0, .08, 0, short * .55, .02, short * .55, 0, false); break;
      case "pagoda": {
        const tiers = Math.max(3, Math.min(7, Math.round(H / 2.2))), th = H * .86 / tiers;
        for (let i = 0; i < tiers; i++) { const sd = short * (1 - i * .1); add(boxG, M.wall, 0, i * th, 0, sd, th * .78, sd, ry, false); add(boxG, M.roof, 0, i * th + th * .78, 0, sd * 1.4, th * .22, sd * 1.4, ry, false); }
        add(coneG, M.roof, 0, H * .86, 0, short * .3, H * .14, short * .3, 0, false);
        break;
      }
      case "wheel": {
        const [x, z] = ax(0, 0), hub = H / 2 + .5;
        add(wheelG, M.dark, x, hub, z, H, H, H, ryL, false);
        for (const q of [0, 1, 2]) { const sp = add(spokeG, M.dark, x, hub, z, .1, H, .1, ryL, false); sp.rotation.set(0, ryL, q * Math.PI / 3, "YXZ"); }
        add(boxG, M.dark, x, 0, z, .45, hub, .7, ryL, false); add(cylG, M.wall, x, hub - .25, z, .9, .5, .9, 0, false);
        break;
      }
      case "bridge": {
        add(fpGeo(L, .3), M.wall, 0, .7, 0, 1, 1, 1, 0, false);
        if (L.top === "pylons") for (const q of [-.25, .25]) { for (const v of [-1, 1]) { const [x, z] = ax(q * long, v * (short / 2 + .1)); add(boxG, M.wall, x, 0, z, .7, H, .7, ryL); } const [x, z] = ax(q * long, 0); add(boxG, M.wall, x, H * .78, z, .6, .5, short + .9, ryL, false); }
        break;
      }
      default: body(H); if (L.top === "dome") { cap(H); dome(0, 0, short * .3, H); } else if (L.top === "spire") { cap(H); add(coneG, M.roof, 0, H, 0, short * .3, H * .6, short * .3, 0, false); } else cap(H);
    }
  }

  // ---- campaign buildings: individual meshes, outlined in ink, roof coloured by kind of place
  const pickables = [], LM = {};
  const inkMat = new T.LineBasicMaterial({ color: 0x2b2119, transparent: true, opacity: .7 });
  const selRingMat = new T.MeshBasicMaterial({ color: 0x8a2432, transparent: true, opacity: .95, depthWrite: false });
  const boneRingMat = new T.MeshBasicMaterial({ color: 0x8c7347, transparent: true, opacity: .9, depthWrite: false });
  const hitMat = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  for (const L of C.LMS) {
    const grp = new T.Group(), fp = L.fp && !L.fp.flat ? L.fp : null;
    if (fp) grp.position.set(wx(fp.cx), 0, wz(fp.cy)); else { grp.position.set(wx(L.x), 0, wz(L.y)); grp.rotation.y = L.face || 0; }
    const roofCol = CD.roofs[L.p.cat] || CD.roof;
    const mats = { wall: new T.MeshLambertMaterial({ color: LOOK.landmark, transparent: true }), roof: new T.MeshLambertMaterial({ color: new T.Color(roofCol), transparent: true, side: T.DoubleSide }), dark: new T.MeshLambertMaterial({ color: 0x3a312a, transparent: true }), glow: new T.MeshBasicMaterial({ color: 0xffb35a, transparent: true }) };
    let top = 0;
    const add = (geo, mat, x, y, z, sx, sy, sz, ry = 0, outline = true) => {
      const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry;
      m.castShadow = true; m.receiveShadow = true; m.userData.id = L.id; grp.add(m); pickables.push(m);
      if (outline) { const ln = new T.LineSegments(new T.EdgesGeometry(geo), inkMat); ln.position.copy(m.position); ln.scale.copy(m.scale); ln.rotation.y = ry; grp.add(ln); }
      top = Math.max(top, y + sy); return m;
    };
    const house = (w, d, h, rh, x = 0, z = 0) => { add(boxG, mats.wall, x, 0, z, w, h, d); add(roofG, mats.roof, x, h, z, w + .2, rh, d + .2); };
    if (fp) { mats.glass = mats.wall; mats.green = mats.dark; raise(fp, add, mats); }
    else switch (L.fp ? "post" : L.kind) {
      case "post": add(boxG, mats.dark, 0, 0, 0, .16, 3, .16); add(boxG, mats.roof, 0, 2.2, 0, 1.5, .7, .12); add(cylG, hitMat, 0, 0, 0, 2.6, 3, 2.6, 0, false); break;   // a place that is a park or a square: a signpost
      case "alley": {
        add(boxG, mats.dark, 0, 0, 0, .14, 2.3, .14);
        add(boxG, mats.glow, 0, 2.25, 0, .38, .42, .38, 0, false);
        const sig = new T.Mesh(new T.CircleGeometry(.9, 7), new T.MeshBasicMaterial({ color: 0xf4ecd6, transparent: true, opacity: .9, depthWrite: false }));
        sig.rotation.x = -Math.PI / 2; sig.position.set(.6, .04, .6); grp.add(sig);
        add(cylG, hitMat, 0, 0, 0, 2.4, 2.6, 2.4, 0, false); break;
      }
      case "cart":
        add(boxG, mats.wall, 0, .45, 0, 1.6, .7, .9); add(cylG, mats.dark, -.5, 0, .5, .6, .08, .6); add(boxG, mats.dark, 0, 1.15, 0, .6, .25, .6);
        add(boxG, mats.glow, 0, 1.4, 0, .45, .3, .45, 0, false); add(cylG, hitMat, 0, 0, 0, 2.4, 2.4, 2.4, 0, false); break;
      case "coalyard":
        for (const [x, z] of [[-1, -.6], [.8, -.2], [-.2, .9]]) add(coneG, mats.dark, x, 0, z, 1.7, 1.1, 1.7, 0, false);
        house(1.6, 1.4, 1.4, .6, 1.2, 1.2);
        for (const [x, z, sx, sz] of [[0, -2.1, 4.2, .12], [-2.1, 0, .12, 4.2], [2.1, 0, .12, 4.2]]) add(boxG, mats.dark, x, 0, z, sx, .7, sz, 0, false);
        break;
      case "quay":
        add(boxG, mats.wall, 0, 0, -.6, 4.6, .5, 3.2);
        add(boxG, mats.dark, -1.4, .5, -.6, .35, 4.2, .35); add(boxG, mats.dark, -.3, 4.4, -.6, 2.6, .25, .25);
        add(boxG, mats.roof, 1.2, .5, -.4, .9, .8, .9); add(boxG, mats.roof, .9, .5, .7, .8, .6, .8); break;
      case "slum":
        for (const [x, z, w, d, h, r] of [[-1.1, -1, 1.5, 1.4, 1.3, .2], [.9, -1.1, 1.6, 1.2, 1.1, -.25], [-1, 1, 1.4, 1.5, 1.2, .35], [1, .9, 1.3, 1.3, 1.5, -.1]]) { add(boxG, mats.wall, x, 0, z, w, h, d, r); add(roofG, mats.roof, x, h, z, w + .15, .5, d + .15, r); }
        break;
      case "asylum": {
        house(9, 4.6, 4.2, 1.6); add(boxG, mats.wall, 0, 0, -3, 3, 4.6, 2); add(roofG, mats.roof, 0, 4.6, -3, 3.2, 1.2, 2.2, Math.PI / 2);
        const R = 6.6; for (const [x, z, sx, sz] of [[0, -R + 1, R * 2, .3], [0, R - 1, R * 2, .3], [-R, 0, .3, R * 2 - 2], [R, 0, .3, R * 2 - 2]]) add(boxG, mats.dark, x, 0, z, sx, 1.4, sz, 0, false);
        break;
      }
      case "home": house(5.8, 3.6, 3.4, 1.4, 0, .4); for (const [x, z, sx, sz] of [[0, -3.1, 6.4, .22], [-3.2, -1.3, .22, 3.6], [3.2, -1.3, .22, 3.6]]) add(boxG, mats.dark, x, 0, z, sx, 1, sz, 0, false); break;
      case "cone": add(coneG, mats.roof, 0, 0, 0, 6, 8.5, 6); add(boxG, mats.wall, 0, 0, 3, 3.4, 2.4, 2.2); add(roofG, mats.roof, 0, 2.4, 3, 3.6, 1, 2.4); break;
      case "hall": house(6.4, 4.6, 4.2, 1.2); add(boxG, mats.wall, 0, 4.2, 2.1, 6.4, 1, .3); break;
      case "town": house(3.6, 3, 4.8, 1.1); break;
      case "museum": house(3.4, 2.8, 3.8, .9); for (const x of [-1.2, -.4, .4, 1.2]) add(boxG, mats.wall, x, 0, 1.55, .22, 3, .22, 0, false); break;
      case "tinchapel": add(boxG, mats.wall, 0, 0, 0, 2.4, 2.2, 3.6); add(roofG, mats.roof, 0, 2.2, 0, 2.6, 1.3, 3.8, Math.PI / 2); add(boxG, mats.dark, 0, 3.4, 1.4, .5, 1.2, .5); break;
      case "church": add(boxG, mats.wall, 0, 0, .4, 2.6, 3, 3.6); add(roofG, mats.roof, 0, 3, .4, 2.8, 1.5, 3.8, Math.PI / 2); add(boxG, mats.wall, 0, 0, -1.7, 1.5, 6.4, 1.5); add(coneG, mats.roof, 0, 6.4, -1.7, 1.8, 3.6, 1.8); break;
      case "tinhall": { add(boxG, mats.wall, 0, 0, 0, 3.6, 1.8, 2.6); const half = new T.CylinderGeometry(.5, .5, 1, 12, 1, false, 0, Math.PI); half.rotateZ(Math.PI / 2); add(half, mats.roof, 0, 1.8, 0, 3.8, 1.6, 2.8, Math.PI / 2); break; }
      case "infirmary": house(3.6, 2.8, 4.6, 1); break;
      case "warehouse": add(boxG, mats.wall, 0, 0, 0, 3.6, 4.2, 3); add(boxG, mats.roof, 0, 4.2, 0, 3.7, .25, 3.1); for (const y of [1.4, 2.8]) add(boxG, mats.dark, 0, y, 1.52, 1, .7, .05, 0, false); break;
      case "shaft": add(cylG, mats.wall, 0, 0, 0, 1.6, 2.4, 1.6); add(coneG, mats.roof, 0, 2.4, 0, 1.9, 1, 1.9); add(cylG, mats.dark, 1.6, 0, .6, 1.4, .06, 1.4, 0, false); break;
      case "annex": house(2.6, 2.2, 1.8, .8); add(boxG, mats.dark, 0, 0, 1.15, .8, 1.2, .06, 0, false); break;
      case "arch": add(boxG, mats.wall, 0, 0, 0, 3.2, 2.2, 2.6); add(boxG, mats.roof, 0, 2.2, 0, 3.3, .3, 2.7); add(boxG, mats.dark, 0, 0, 1.31, 1.2, 1.5, .05, 0, false); break;
      case "cottage": house(2.6, 2.2, 2, .9); break;
      case "pub": house(3.4, 2.8, 2.6, 1); add(boxG, mats.dark, 1.75, 1.6, 1, .1, .7, .7, 0, false); break;
      case "crooked": { const m = add(boxG, mats.wall, 0, 0, 0, 3.2, 2.8, 2.6); m.rotation.z = .06; add(roofG, mats.roof, 0, 2.8, 0, 3.5, 1.2, 2.8, .08); break; }
      case "orphanage": house(4, 3.2, 3.6, 1.2); add(boxG, mats.dark, 1.2, 0, -.2, 1.2, 2.4, 2.8, 0, false); break;
      case "baths": house(3.6, 2.9, 3, .9); add(cylG, mats.dark, 1.3, 3, -.8, .5, 2.4, .5); break;
      case "morgue": house(3.4, 2.8, 2.6, .8); break;
      default: house(3.4, 2.8, 3.3, 1.1);
    }
    // rings on the ground: selection (accent) and fingerbone site (bone)
    const rr = Math.min(L.lr, 4.2);
    const sel = new T.Mesh(new T.RingGeometry(rr + .5, rr + 1.05, 48), selRingMat); sel.rotation.x = -Math.PI / 2; sel.position.y = .08; sel.visible = false; grp.add(sel);
    const bone = new T.Mesh(new T.RingGeometry(rr + 1.3, rr + 1.7, 48), boneRingMat); bone.rotation.x = -Math.PI / 2; bone.position.y = .07; bone.visible = false; grp.add(bone);
    // campaign buildings stand a storey above their neighbours
    if (!fp) grp.scale.set(1, 1.35, 1);
    scene.add(grp);
    LM[L.id] = { L, grp, mats, sel, bone, top: Math.max(top, 2) * (fp ? 1 : 1.35), roofCol };
  }
  // the landmarks of the city itself, those that are not also one of the campaign places
  const marks = [];
  {
    const M = { wall: new T.MeshLambertMaterial({ color: LOOK.landmark }), roof: new T.MeshLambertMaterial({ color: LOOK.lmRoof || 0x9a8c78, side: T.DoubleSide }), dark: new T.MeshLambertMaterial({ color: 0x3a312a }), glow: new T.MeshBasicMaterial({ color: 0xffb35a }), green: new T.MeshLambertMaterial({ color: 0x7f9a5c }), glass: LOOK.glass ? new T.MeshLambertMaterial({ color: LOOK.glass }) : null };
    if (LOOK.glass) M.glasses = [LOOK.glass, 0xbccbd8, 0xdfe5e8, 0xc6ccd2, 0xb4c4d2, 0xd6d2c8].map(c => new T.MeshLambertMaterial({ color: c }));
    for (const L of C.landmarks) {
      if (L.place) continue;
      if (L.flat) { marks.push({ L, x: wx(L.x), y: 0, z: wz(L.y) }); continue; }
      const grp = new T.Group(); grp.position.set(wx(L.cx), 0, wz(L.cy));
      let top = 0;
      const add = (geo, mat, x, y, z, sx, sy, sz, ry = 0, outline = true) => {
        const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; grp.add(m);
        if (outline && L.label) { const ln = new T.LineSegments(new T.EdgesGeometry(geo, 20), inkMat); ln.position.copy(m.position); ln.scale.copy(m.scale); ln.rotation.y = ry; grp.add(ln); }
        if (!geo.boundingBox) geo.computeBoundingBox();
        top = Math.max(top, y + sy * geo.boundingBox.max.y); return m;
      };
      try { raise(L, add, M); } catch (err) { continue; }      // a footprint too broken to raise is left as its outline on the plan
      scene.add(grp); marks.push({ L, x: grp.position.x, y: top, z: grp.position.z });
    }
  }

  // ---- HTML overlay: numbered pins + district names
  const pinsEl = hooks.pinsEl;
  const DISTS = {};
  const pins = {};
  for (const L of C.LMS) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "pin"; b.dataset.go = L.id;
    b.setAttribute("aria-label", `${L.p.n}. ${L.p.name}, ${L.p.dist}`); b.title = `${L.p.n}. ${L.p.name}`;
    b.innerHTML = `<span class="pb"><span class="pn">${String(L.p.n).padStart(2, "0")}</span><span class="pl">${A.esc(L.p.name)}</span>${L.p.badge ? `<span class="pr gm-only">${A.esc(L.p.badge)}</span>` : ""}</span>`;
    pinsEl.appendChild(b); pins[L.id] = b;
    (DISTS[L.p.dist] = DISTS[L.p.dist] || []).push(L);
  }
  // the names of the landmarks, shown once the view is near enough to tell them apart
  const ll = [];
  for (const o of marks) { if (!o.L.label || !o.L.name) continue; const el = document.createElement("div"); el.className = "llab" + (o.L.major ? " major" : ""); el.textContent = o.L.name; pinsEl.appendChild(el); ll.push({ el, x: o.x, y: o.y + .6, z: o.z, far: o.L.major ? SPAN * 1.2 : 190 }); }
  const dl = [];
  for (const [d, at] of Object.entries(CD.districts)) {
    const list = DISTS[d] || [], [cx, cy] = at;
    const el = document.createElement("div"); el.className = "dlab"; el.textContent = d.toUpperCase(); pinsEl.appendChild(el);
    dl.push({ el, x: wx(cx), z: wz(cy - 14 - Math.sqrt(list.length) * 4) - 2 });
  }

  // ---- camera + controls
  const controls = new T.MapControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .12; controls.screenSpacePanning = false;
  controls.minDistance = 14; controls.maxDistance = Math.round(SPAN * 1.055); controls.maxPolarAngle = 1.28; controls.minPolarAngle = .05;
  controls.zoomSpeed = 1.1; controls.rotateSpeed = .6;
  const HOME = { target: new T.Vector3(0, 0, 4), dist: Math.round(SPAN * .75), polar: .6, az: 0 };
  function setView(target, dist, polar, az) {
    controls.target.copy(target);
    camera.position.set(target.x + dist * Math.sin(polar) * Math.sin(az), target.y + dist * Math.cos(polar), target.z + dist * Math.sin(polar) * Math.cos(az));
    camera.lookAt(target); controls.update();
  }
  setView(HOME.target, HOME.dist, HOME.polar, HOME.az);
  const clampTarget = () => { const t = controls.target; t.x = Math.max(-(SW / 2 + 20), Math.min(SW / 2 + 20, t.x)); t.z = Math.max(-(SH / 2 + 25), Math.min(SH / 2 + 25, t.z)); t.y = 0; };

  // ---- render on demand
  let pending = false, anim = null;
  const pv = new T.Vector3();
  function size() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); request(); }
  function request() { if (!pending) { pending = true; requestAnimationFrame(frame); } }
  function frame(now) {
    pending = false;
    if (anim) {
      const t = Math.min(1, (now - anim.t0) / anim.dur), k = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      controls.target.lerpVectors(anim.ft, anim.tt, k); camera.position.lerpVectors(anim.fp, anim.tp, k);
      if (t >= 1) anim = null;
      request();
    }
    if (controls.update()) request();
    clampTarget();
    const dist = camera.position.distanceTo(controls.target);
    // haze begins well beyond what is being looked at, so the far side of the sheet stays crisp
    fog.near = dist * 1.5; fog.far = dist * 4.2;
    // Depth precision is what stops surfaces shimmering, and it is set almost entirely by the near plane. Nothing in
    // view is ever nearer than about half the viewing distance, so the near plane can sit a quarter of the way out
    // (less a margin for the tallest spire). On a graphics card with a coarse depth buffer this is the difference
    // between roofs that flicker and roofs that do not.
    const near = Math.max(.5, dist * .25 - 6);
    if (Math.abs(camera.near - near) > near * .03) { camera.near = near; camera.updateProjectionMatrix(); }
    for (const [m, d] of lod) if (m) m.visible = dist < d;
    renderer.render(scene, camera);
    // overlay
    const W = host.clientWidth, H = host.clientHeight, named = dist < 150;
    for (const id in LM) {
      const o = LM[id], el = pins[id];
      pv.set(o.grp.position.x, o.top + .8, o.grp.position.z).project(camera);
      if (pv.z > 1 || pv.x < -1.1 || pv.x > 1.1 || pv.y < -1.1 || pv.y > 1.2) { el.classList.add("off"); continue; }
      el.classList.remove("off"); el.classList.toggle("named", named);
      el.style.transform = `translate(${((pv.x + 1) / 2 * W).toFixed(1)}px, ${((1 - pv.y) / 2 * H).toFixed(1)}px) translate(-50%, -100%)`;
    }
    for (const d of dl) {
      pv.set(d.x, 0, d.z).project(camera);
      const off = pv.z > 1 || dist < 45;
      d.el.classList.toggle("off", off);
      if (!off) d.el.style.transform = `translate(${((pv.x + 1) / 2 * W).toFixed(1)}px, ${((1 - pv.y) / 2 * H).toFixed(1)}px) translate(-50%, -50%)`;
    }
    for (const o of ll) {
      pv.set(o.x, o.y, o.z).project(camera);
      const off = pv.z > 1 || dist > o.far || pv.x < -1.05 || pv.x > 1.05 || pv.y < -1.05 || pv.y > 1.05;
      o.el.classList.toggle("off", off);
      if (!off) o.el.style.transform = `translate(${((pv.x + 1) / 2 * W).toFixed(1)}px, ${((1 - pv.y) / 2 * H).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }
  controls.addEventListener("change", request);
  new ResizeObserver(size).observe(host);

  // ---- picking
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const hit = ev => { const r = renderer.domElement.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(pickables, false)[0]; return h ? h.object.userData.id : null; };
  let down = null, hoverId = null, hoverRaf = 0;
  renderer.domElement.addEventListener("pointerdown", ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; anim = null; });
  renderer.domElement.addEventListener("pointerup", ev => {
    if (!down) return;
    const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved < 6 && dt < 600 && ev.button === 0) { const id = hit(ev); if (id) hooks.onPick(id); }
  });
  renderer.domElement.addEventListener("pointermove", ev => {
    if (ev.pointerType !== "mouse" || ev.buttons) return;
    cancelAnimationFrame(hoverRaf);
    hoverRaf = requestAnimationFrame(() => {
      const id = hit(ev);
      if (id !== hoverId) { hoverId = id; renderer.domElement.style.cursor = id ? "pointer" : ""; }
      hooks.onHover(id, ev);
    });
  });
  renderer.domElement.addEventListener("pointerleave", () => { hoverId = null; hooks.onHover(null); });

  // ---- public
  function flyTo(id) {
    const o = LM[id]; if (!o) return;
    const tt = new T.Vector3(o.grp.position.x, 0, o.grp.position.z);
    const off = camera.position.clone().sub(controls.target), d = off.length(), nd = Math.min(d, 120);
    off.setLength(nd);
    if (off.y < nd * .45) { off.y = nd * .6; off.setLength(nd); }
    const tp = tt.clone().add(off);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { controls.target.copy(tt); camera.position.copy(tp); controls.update(); request(); return; }
    anim = { t0: performance.now(), dur: 900, ft: controls.target.clone(), tt, fp: camera.position.clone(), tp };
    request();
  }
  function zoom(f) { const off = camera.position.clone().sub(controls.target); const l = Math.max(controls.minDistance, Math.min(controls.maxDistance, off.length() * f)); off.setLength(l); anim = { t0: performance.now(), dur: 280, ft: controls.target.clone(), tt: controls.target.clone(), fp: camera.position.clone(), tp: controls.target.clone().add(off) }; request(); }
  function home() { const off = new T.Vector3(0, HOME.dist * Math.cos(HOME.polar), HOME.dist * Math.sin(HOME.polar)); anim = { t0: performance.now(), dur: 800, ft: controls.target.clone(), tt: HOME.target.clone(), fp: camera.position.clone(), tp: HOME.target.clone().add(off) }; request(); }
  function sync(st) {
    for (const id in LM) {
      const o = LM[id], m = st.matches(o.L.p), sel = id === st.sel, op = m ? 1 : .22;
      for (const k in o.mats) o.mats[k].opacity = op;
      o.sel.visible = sel; o.bone.visible = !!o.L.p.badge && st.mode !== "player";
      o.mats.roof.emissive && o.mats.roof.emissive.set(sel ? 0x3a0a10 : 0x000000);
      pins[id].classList.toggle("sel", sel); pins[id].classList.toggle("dim", !m);
      if (sel) pins[id].setAttribute("aria-current", "true"); else pins[id].removeAttribute("aria-current");
    }
    request();
  }
  function setNight(on) {
    host.classList.toggle("night", on);
    const bg = on ? LOOK.night : LOOK.table;
    fog.color.set(bg); tableMat.color.set(bg); renderer.setClearColor(bg);
    for (const m of groundMats) m.color.set(on ? 0x8d97aa : 0xffffff); groundMat.color.set(on ? 0x8d97aa : 0xffffff);
    hemi.color.set(on ? 0xa8b8d8 : 0xfff6e6); hemi.groundColor.set(on ? 0x2a2e38 : 0x8a7a60); hemi.intensity = on ? .62 : .66;
    sun.color.set(on ? 0xb4c4e4 : 0xfff0d6); sun.intensity = on ? .34 : .48;
    lampMat.color.set(on ? 0xffcf73 : 0x3a342c);
    for (const id in LM) LM[id].mats.glow.color.set(on ? 0xffc06a : 0xd98a3a);
    renderer.shadowMap.needsUpdate = true; request();
  }
  renderer.domElement.addEventListener("webglcontextlost", ev => { ev.preventDefault(); if (hooks.onLost) hooks.onLost(); });
  renderer.shadowMap.needsUpdate = true;
  size();
  setTimeout(() => sharpen(hooks.sharp), 700);
  return { flyTo, zoom, home, sync, setNight, request, pins, dbg: { renderer, scene, camera, controls, frame, groundMats } };
}

  /* ---- the flat map: what a device without 3D gets instead. Places, water, main roads, district names. */
  function flatSVG(D, PL, st) {
    const P = LOOK.plan, w = D.sheet.w, h = D.sheet.h, line = pts => pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    let s = `<svg class="cityflat" viewBox="0 0 ${w} ${h}" role="img" aria-label="Map${D.title ? ": " + A.esc(D.title) : ""}"><rect width="${w}" height="${h}" fill="${P.PAPER}"/><rect width="${w}" height="${h}" fill="${P.BLOCK}" opacity=".6"/>`;
    for (const p of D.parks) s += `<polygon points="${line(p.pts)}" fill="${P.PARKC}"/>`;
    for (const b of D.basins) s += `<path d="${[b.pts, ...(b.holes || [])].map(r => "M" + line(r).split(" ").join("L") + "Z").join("")}" fill-rule="evenodd" fill="${P.WATERC}" stroke="${P.INK}" stroke-width=".3"/>`;
    for (const r of D.rivers) if (!r.ghost) s += `<polyline points="${line(r.pts)}" fill="none" stroke="${P.WATERC}" stroke-width="${r.hw * 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const [, cls, pts] of D.roads) if (cls <= 1) s += `<polyline points="${line(pts)}" fill="none" stroke="${cls ? P.ROADF : P.MAJORF}" stroke-width="${cls ? 1.6 : 2.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const l of D.landmarks) if (l.major && l.at && l.name) s += `<text x="${l.at[0]}" y="${l.at[1]}" text-anchor="middle" font-size="3.6" font-style="italic" fill="${P.INK}" opacity=".8">${A.esc(l.name)}</text>`;
    for (const [d, at] of Object.entries(D.districts)) s += `<text x="${at[0]}" y="${at[1] - 9}" text-anchor="middle" font-size="5.5" letter-spacing="1.2" fill="${P.INK}" opacity=".7">${A.esc(d.toUpperCase())}</text>`;
    for (const e of PL) {
      if (e.x == null) continue;
      const sel = st && st.sel === e.id, dim = st && st.matches && !st.matches(e.p);
      s += `<g class="fp" data-go="${A.esc(e.id)}" tabindex="0" role="button" aria-label="${e.p.n}. ${A.esc(e.p.name)}"${dim ? ' opacity=".3"' : ""}><circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="4.2" fill="${sel ? "#8a2432" : P.PAPER}" stroke="${P.INK}" stroke-width=".6"/><text x="${e.x.toFixed(1)}" y="${(e.y + 1.7).toFixed(1)}" text-anchor="middle" font-size="4.4" font-weight="600" fill="${sel ? "#fff" : P.INK}">${e.p.n}</text><title>${e.p.n}. ${A.esc(e.p.name)}</title></g>`;
    }
    return s + `</svg>`;
  }

  /* ---- putting the map on the page. box: an empty element. hooks.onPick(id) is called when a place is clicked.
          Returns { flyTo(id), sync({ sel, mode, matches(p) }) }; both are safe to call before the map is ready. */
  A.cityMount = function (box, hooks) {
    const D = prepare(A.cityData), PL = cityPlaces(D), placed = PL.filter(e => e.x != null), P = LOOK.plan;
    const hex = n => "#" + n.toString(16).padStart(6, "0");
    const sw = (fill, hgt) => `<svg width="26" height="10" aria-hidden="true"><rect x=".5" y="${(10 - hgt) / 2}" width="25" height="${hgt}" fill="${fill}" stroke="${P.INK}"/></svg>`;
    box.innerHTML = `<div class="map3d" style="background:${hex(LOOK.table)}"><div class="loading" style="background:${hex(LOOK.table)}">Surveying the streets, one by one…</div><div class="pins"></div><div class="tip" hidden></div>
      <div class="mctl" role="group" aria-label="Map controls"><button type="button" data-z="in" aria-label="Zoom in" title="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out" title="Zoom out">−</button><button type="button" data-z="home" aria-label="Reset view" title="Reset view">⌂</button><button type="button" data-z="full" aria-label="Full screen" title="Full screen">⤢</button></div></div>
      <div class="cityflatbox" hidden></div>
      <div class="maphint"><span class="lg">${sw(P.MAJORF, 7)}Main road</span><span class="lg">${sw(P.ROADF, 5)}Street</span><span class="lg"><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" stroke="${P.INK}" stroke-width="2"/></svg>Lane, alley, court</span>${D.rails.length ? `<span class="lg"><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" stroke="${P.INK}" stroke-width="3.4"/><line x1="0" y1="5" x2="26" y2="5" stroke="${P.ROADF}" stroke-width="1.2" stroke-dasharray="3 3"/></svg>Railway</span>` : ""}<span class="how">Drag to pan · scroll or pinch to zoom · right-drag or two fingers to turn. Click a numbered building to open it.</span>${D.credit ? `<span class="credit">${A.esc(D.credit)}${D.creditUrl ? ` (<a href="${A.esc(D.creditUrl)}" target="_blank" rel="noopener">terms</a>)` : ""}</span>` : ""}</div>`;
    const host = box.querySelector(".map3d"), loading = box.querySelector(".loading"), tip = box.querySelector(".tip"), flat = box.querySelector(".cityflatbox"), how = box.querySelector(".how");
    let last = { sel: null, mode: "gm", matches: () => true };
    const ctl = { map: null, flyTo(id) { if (ctl.map) ctl.map.flyTo(id); }, sync(st) { last = st; if (ctl.map) ctl.map.sync(st); else if (!flat.hidden) flat.innerHTML = flatSVG(D, placed, last); } };
    const fallback = msg => { host.hidden = true; flat.hidden = false; how.textContent = msg; ctl.map = null; flat.innerHTML = flatSVG(D, placed, last); };
    flat.addEventListener("click", e => { const t = e.target.closest("[data-go]"); if (t && hooks.onPick) hooks.onPick(t.dataset.go); });
    flat.addEventListener("keydown", e => { if (e.key !== "Enter" && e.key !== " ") return; const t = e.target.closest("[data-go]"); if (t && hooks.onPick) { e.preventDefault(); hooks.onPick(t.dataset.go); } });
    (async function start() {
      try {
        if (!window.THREE || !THREE.MapControls) throw new Error("three");
        const probe = document.createElement("canvas"), gl = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!gl) throw new Error("webgl");
        await new Promise(r => setTimeout(r, 30));                                   // let the page paint first
        try { await Promise.race([Promise.all([`20px ${D.fonts.text}`, `italic 20px ${D.fonts.text}`, `20px ${D.fonts.caps}`].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
        const city = buildCity(D, placed);
        const span = PLAN.X1 - PLAN.X0, area = span * (PLAN.Y1 - PLAN.Y0), maxTex = gl.getParameter(0x0D33) || 4096;
        const ppu = Math.max(3, Math.min(7, Math.floor(Math.min(maxTex, 5600) / span)));
        // how sharply to reprint the plan once the map is up: as fine as a fixed budget of pixels allows.
        // Phones and machines with little memory keep the first print.
        const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches, mem = navigator.deviceMemory || 8;
        const budget = coarse ? 0 : mem >= 8 ? 34e6 : mem >= 4 ? 22.5e6 : 0, sharp = budget ? Math.min(16, Math.floor(Math.sqrt(budget / area))) : 0;
        const plan = drawPlan(city, ppu);
        ctl.map = createMap3D(host, city, plan, {
          pinsEl: box.querySelector(".pins"),
          detail: (view, k) => drawPlan(city, k, view),
          sharp: sharp > ppu ? sharp : 0,
          onLost: () => fallback("A simple map, not to scale. Click a number to open that place. (The 3D street plan ran out of graphics memory on this device.)"),
          onPick: id => hooks.onPick && hooks.onPick(id),
          onHover: (id, ev) => {
            const e = id && placed.find(q => q.id === id);
            if (!e) { tip.hidden = true; return; }
            const r = host.getBoundingClientRect();
            tip.textContent = `${String(e.p.n).padStart(2, "0")} · ${e.p.name}${e.p.dist ? " — " + e.p.dist : ""}`;
            tip.hidden = false; tip.style.transform = `translate(${ev.clientX - r.left + 14}px, ${ev.clientY - r.top + 14}px)`;
          }
        });
        const dark = window.matchMedia("(prefers-color-scheme: dark)");
        const theme = () => { const t = document.documentElement.getAttribute("data-theme"); if (ctl.map) ctl.map.setNight(t === "dark" || (t !== "light" && dark.matches)); };
        theme(); if (dark.addEventListener) dark.addEventListener("change", theme);
        new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        box.querySelector(".mctl").addEventListener("click", e => {
          const b = e.target.closest("[data-z]"); if (!b || !ctl.map) return;
          if (b.dataset.z === "in") ctl.map.zoom(.62); else if (b.dataset.z === "out") ctl.map.zoom(1.6); else if (b.dataset.z === "home") ctl.map.home();
          else if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen().catch(() => {});
        });
        loading.remove();
        ctl.map.sync(last);
        if (hooks.onReady) hooks.onReady(ctl);
      } catch (err) {
        if (typeof console !== "undefined") console.warn("3D street plan unavailable:", err);
        loading.remove();
        fallback("A simple map, not to scale. Click a number to open that place. (This browser could not draw the 3D street plan.)");
      }
    })();
    return ctl;
  };

  A.city = data => { A.cityData = data; return A; };
  // a campaign's own changes to a city that was fetched or generated for it (city.js is rewritten whenever the city is
  // fetched again, so changes made there would be lost): ATLAS.cityEdit(c => { c.title = "..."; c.landmarks.push({...}); })
  A.cityEdit = fn => { (A.cityEdits = A.cityEdits || []).push(fn); return A; };
  A.cityKit = { prepare, cityPlaces, buildCity, MODELS, MODEL_SIZE, LOOKS, REGIONS, LM_KINDS, LM_SIZE, plan: () => PLAN };
})(ATLAS);
