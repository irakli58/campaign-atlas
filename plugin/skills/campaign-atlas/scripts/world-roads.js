/* Campaign Atlas: the roads of a world map, grown over the ages as real roads grew (the user, 3 Nov 2026: "extremely
   detailed, geographically accurate, and historically realistic road and trade route networks ... based on actual
   historical geography, transportation economics, and terrain constraints"). ON TRIAL: atlas.js roads <campaign> writes
   world-roads.js beside world-terrain.js and changes nothing else; the page draws it only when the game master turns on
   "Road network (trial)" on the world map, until the user has seen it and decided (they asked that the generator that
   draws routes now is not replaced before then).
   The research behind every rule is in the app's docs/research/2026-11-03-road-networks.md; each rule below names its
   finding in brackets. In short:
   1. the land's cost for the age's travellers: time on foot from slope (Tobler), switchbacks over the age's grade
      (8% for carts), high and cold ground, forest and swamp, fed land cheaper, deserts dearer far from water;
   2. rivers cost by their size to cross (ford, ferry; bridges where trade and the age pay for one), navigable rivers
      and the sea carry trade far more cheaply than land (about 1 : 5 : 40), loading a ship costs a day (ORBIS);
   3. settlements by central-place spacing at the map's own scale, more where the land feeds more; each makes
      something of its land (Christaller, Bracton's market day, caravanserais a day apart);
   4. the network grown over four ages, the biggest flows first, every road already used cheaper for the next (the
      sequential road network model, alpha about 0.4 to 0.5; the active walker), flows by gravity and complementarity;
      roads that lose their trade stay as old roads, places on busy junctions grow (Fulminante; Levinson and Yerra);
   5. states grown from the capitals by travel cost, a toll at every border, friends trading and enemies hardly. */
"use strict";

const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const r1 = v => Math.round(v * 10) / 10;

// what each age could build (a grade a laden cart can climb, where bridges stood, whether ships left the coast)
// [the Practical Action cart grades; Roman engineering; medieval fords, ferries and town bridges; ORBIS's open sea]
const TECH = {
  ancient: { name: "the ancient world's engineered roads", grade: .08, bridges: "major", open: 1.25, steep: 2.2 },
  medieval: { name: "medieval carts and packhorses", grade: .1, bridges: "towns", open: 1.4, steep: 2.6 },
  modern: { name: "graded turnpikes and iron bridges", grade: .06, bridges: "any", open: 1, steep: 1.6 },
  // (the user, 3 Nov 2026: "dont forget scifi too": a planet's colonies, joined by graded highways and maglev lines that
  // take any grade a machine can be built for, bridge any river and cross any sea; named as colonies are)
  future: { name: "the colonists' highways and maglev lines", grade: .07, bridges: "any", open: 1, steep: 1.3, scifi: true }
};
const ERA_TECH = { fantasy: "medieval", medieval: "medieval", ancient: "ancient", roman: "ancient", classical: "ancient", industrial: "modern", victorian: "modern", modern: "modern", "early-modern": "modern", scifi: "future", "sci-fi": "future", science: "future", space: "future", colony: "future" };
// how developed the land's roads are (the user, 3 Nov 2026: "add the slider to change the advancement of the
// civilization", "there should be a default though"): what is built and how, never the land or the settlements. Level 3
// is the network as first approved. [the Gough Map's medieval main roads, almost 5,000 km over England and Wales, about
// 0.03 km per km²; the Roman roads known today 0.075; England's turnpikes of the 1830s, about 20,000 miles, a fifth of
// every road there was, about 0.2; a modern country 1 to 2 km per km² and more; docs/research 2026-11-03-road-networks.md]
// grade: the steepest a laden vehicle climbs (0: on foot, no wheels); bridges: where they are built; open: whether ships
// leave the coast (0: they keep to it); links: how many a village, a town, a city trades with [neighbours, markets or
// cities]; cap: the highest rank of road built; vill: the rank of a village's way to market; up: how readily a busy way
// is raised a rank; nav: the narrowest river boats use
const LEVELS = {
  1: { name: "Tribal", say: "footpaths and natural trails between neighbours; the rivers carry what the paths cannot", grade: 0, bridges: "none", open: 0, steep: 1, links: { village: [1, 0], town: [1, 1], city: [1, 1] }, cap: 2, vill: 1, up: 0, nav: 1.5, boats: true },
  2: { name: "Early civilisation", say: "packhorse roads between the chief places, a trail from each village to its market, few bridges", grade: .14, bridges: "cities", open: 0, steep: 2.8, links: { village: [0, 1], town: [2, 1], city: [2, 3] }, cap: 3, vill: 1, up: 0, nav: 1.6, boats: true },
  3: { name: "Medieval", say: "carts and packhorses: trade roads between the towns, tracks to market, fords and ferries, bridges at the towns", grade: .1, bridges: "towns", open: 1.4, steep: 2.6, links: { village: [2, 1], town: [3, 2], city: [3, 99] }, cap: 4, vill: 2, up: 1, nav: 1.9 },
  4: { name: "Industrialising", say: "graded turnpikes and iron bridges, a regional network round the towns", grade: .06, bridges: "any", open: 1, steep: 1.6, links: { village: [3, 2], town: [5, 3], city: [5, 99] }, cap: 4, vill: 2, up: 2, nav: 1.9 },
  5: { name: "Modern", say: "highways and main roads to nearly everywhere, bridges and tunnels where they are needed", grade: .05, bridges: "all", open: 1, steep: 1.3, tunnel: true, links: { village: [5, 2], town: [7, 4], city: [7, 99] }, cap: 4, vill: 2, up: 4, nav: 1.9 }
};
// (the default is level 3, the network as it was first approved, for every world: "what ever the current one is it should
// be the default", the user, 3 Nov 2026. So level 3 keeps the engineering of the world's own age, TECH above, and comes
// out exactly as the network did before there was a slider)
const DEFAULT_LEVEL = 3;
const levelOf = (n, era) => { const lv = LEVELS[n] || LEVELS[DEFAULT_LEVEL]; if (+n !== 3 && LEVELS[n]) return lv; const t = TECH[era] || TECH.medieval; return Object.assign({}, lv, { grade: t.grade, bridges: t.bridges, open: t.open, steep: t.steep }); };
// the orders of central places, km between them [Christaller's 7, 12, 21, 36, 62, 108, 186 km], and the fewest cells
// between them that a map at its scale can show apart
const ORDERS = { city: [108, 13], town: [36, 5.5], village: [15, 3] };
// how much a road already there cheapens the way [the sequential road network model: alpha 0.4 to 0.5]
const ALPHA = [1, .72, .58, .48, .4];
const LEVEL = ["", "path", "local", "regional", "major"];
// the cost of a ship's way per km against a cart's on the flat, and of a river boat down and up stream [Duncan-Jones,
// via ORBIS: sea about 1/40 of land; rivers between]; a day to load or unload [ORBIS's transfer cost]
const SEA_K = 1 / 40, RIVER_DOWN = 1 / 6, RIVER_UP = 1 / 3, TRANSFER = 4;
// the gravity of trade: size by size, over cost squared [gravity models: exponents 1.5 to 2.5]; a day's travel the unit
const DAY = 8, BETA = 2;

/* ---- small tools */
function Heap(cap) {
  let ids = new Int32Array(cap), keys = new Float64Array(cap), n = 0;
  const grow = () => { const i2 = new Int32Array(ids.length * 2), k2 = new Float64Array(ids.length * 2); i2.set(ids); k2.set(keys); ids = i2; keys = k2; };
  return {
    get size() { return n; }, clear() { n = 0; }, topKey() { return keys[0]; },
    push(id, k) { if (n === ids.length) grow(); let i = n++; while (i) { const p = (i - 1) >> 1; if (keys[p] <= k) break; ids[i] = ids[p]; keys[i] = keys[p]; i = p; } ids[i] = id; keys[i] = k; },
    pop() { const top = ids[0], id = ids[--n], k = keys[n]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && keys[c + 1] < keys[c]) c++; if (keys[c] >= k) break; ids[i] = ids[c]; keys[i] = keys[c]; i = c; } ids[i] = id; keys[i] = k; return top; }
  };
}
function rdp(p, eps) {
  if (p.length < 3) return p.slice();
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = p[a], [bx, by] = p[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9; for (let i = a + 1; i < b; i++) { const d = Math.abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L; if (d > md) { md = d; mi = i; } } if (md > eps && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return p.filter((_, i) => keep[i]);
}
function chaikin(p, n) { for (let k = 0; k < n; k++) { if (p.length < 3) return p; const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } o.push(p[p.length - 1]); p = o; } return p; }
const unitKm = sc => !sc || !(sc.per > 0) ? 2.3 : sc.per * ({ mile: 1.609, miles: 1.609, league: 4.8, leagues: 4.8 }[String(sc.unit || "").toLowerCase()] || 1);
// heights above the sea in metres, from the map's 0..1 [world-geology.js landT, turned round]
const KM = [[0, 0], [200, .06], [500, .15], [1000, .28], [1500, .37], [2000, .45], [3000, .6], [4500, .78], [6000, .9], [8500, 1]];
const metres = t => { if (t <= 0) return 0; for (let k = 1; k < KM.length; k++) if (t <= KM[k][1]) return KM[k - 1][0] + (t - KM[k - 1][1]) / (KM[k][1] - KM[k - 1][1]) * (KM[k][0] - KM[k - 1][0]); return 8500; };

// names from where a place stands [a ford's town is named for the ford: Oxford, Hertford, Frankfurt]
const PRE = ["Ash", "Bar", "Bel", "Black", "Bram", "Brack", "Brid", "Cal", "Cold", "Corn", "Dal", "Dun", "Elm", "Fair", "Fen", "Gold", "Gran", "Green", "Hal", "Hart", "Hay", "Holm", "Ivy", "Kel", "Lang", "Lark", "Lin", "Long", "Mar", "Mill", "Nor", "Oak", "Ost", "Pen", "Red", "Ros", "Rush", "Sal", "Sand", "Shep", "Stan", "Stone", "Sut", "Thorn", "Tre", "Wal", "Wen", "Whit", "Wick", "Wil", "Win", "Wyn", "Yar", "Alder", "Bryn", "Cran", "Ebb", "Glen", "Haw", "Mor", "Quen", "Rav", "Tam", "Ulm", "Vel"];
const SUF = { ford: ["ford", "ford", "wade"], bridge: ["bridge", "brig", "bridge"], mouth: ["mouth", "haven", "port"], coast: ["haven", "wick", "sey", "strand", "port"], hill: ["don", "ley", "borough", "bury", "combe"], pass: ["gate", "hope", "pass"], river: ["ham", "ton", "by", "mere", "wick", "worth"], market: ["chester", "market", "ton", "stow"], oasis: ["well", "spring", "wells"], high: ["fell", "crag", "moor", "scar"], plain: ["ton", "ham", "field", "by", "stead", "worth", "ley"] };
// (a colony world's: named for explorers, stars and hopes, and for where they stand: Tycho Landing, Port Meridian)
const SF = ["Kepler", "Tycho", "Halley", "Vega", "Lyra", "Orion", "Draco", "Cygnus", "Ceres", "Juno", "Hesper", "Arden", "Meridian", "Zenith", "Horizon", "Aurora", "Solace", "Bastion", "Corvid", "Talos", "Icarus", "Daedalus", "Ariadne", "Hyperion", "Selene", "Helios", "Nadir", "Pallas", "Rhea", "Atlas", "Prospect", "Erebus", "Kessler", "Varga", "Okafor", "Nakamura", "Petrov", "Ibarra", "Lindqvist", "Mbeki", "Castellan", "Verity", "Endurance", "Tenacity"];
const SF_SITE = { ford: ["# Crossing"], bridge: ["# Bridge", "# Span"], mouth: ["Port #", "# Harbour"], coast: ["Port #", "# Bay", "# Shore"], hill: ["# Heights", "# Ridge"], pass: ["# Gap", "# Gate"], river: ["# Landing", "# Falls", "New #"], market: ["# Exchange", "# Junction", "# Hub"], oasis: ["# Wells", "# Spring"], high: ["# Ridge", "# Summit", "Camp #"], plain: ["New #", "# Colony", "# Station", "#", "Fort #", "# Field"] };
function namer(rnd, taken, scifi) {
  const used = new Set(taken), pick = a => a[Math.floor(rnd() * a.length)];
  if (scifi) return site => { for (let g = 0; g < 40; g++) { const nm = pick(SF_SITE[site] || SF_SITE.plain).replace("#", pick(SF)); if (!used.has(nm)) { used.add(nm); return nm; } } const nm = pick(SF) + " " + (2 + Math.floor(rnd() * 97)); used.add(nm); return nm; };
  return site => { for (let g = 0; g < 40; g++) { const w = pick(PRE) + pick(SUF[site] || SUF.plain); const nm = w[0] + w.slice(1).toLowerCase(); if (!used.has(nm)) { used.add(nm); return nm; } } const nm = pick(PRE) + pick(SUF.plain) + " " + pick(["Magna", "Parva", "Cross", "End"]); used.add(nm); return nm; };
}

/* ---- 1. the land, cell by cell */
function landOf(WD, BIO) {
  const G = WD.G, f = G.cols * G.rows > 150000 ? 2 : 1, cols = Math.ceil(G.cols / f), rows = Math.ceil(G.rows / f), N = cols * rows, size = G.cell * f;
  const kmU = unitKm(WD.scale), ck = size * kmU, sea = G.sea;
  const hm = new Float32Array(N), land = new Uint8Array(N), moist = new Float32Array(N), temp = new Float32Array(N), biome = new Uint8Array(N), canopy = new Float32Array(N);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const n = j * cols + i; let L = 0, cnt = 0, hs = 0, ms = 0, ts = 0, cs = 0;
    for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) {
      const x = i * f + a, y = j * f + b; if (x >= G.cols || y >= G.rows) continue; const m = y * G.cols + x; cnt++;
      const h = G.Hf ? G.Hf[m] : G.H[m]; if (h > sea) { L++; hs += metres((h - sea) / (255 - sea)); }
      ms += G.M ? G.M[m] / 255 : .5; ts += G.Tc ? G.Tc[m] - 60 : 12; cs += G.Cn ? G.Cn[m] / 255 : 0;
    }
    land[n] = L * 2 > cnt ? 1 : 0; hm[n] = L ? hs / L : 0; moist[n] = ms / cnt; temp[n] = ts / cnt; canopy[n] = cs / cnt;
    const cx = Math.min(G.cols - 1, i * f + (f >> 1)), cy = Math.min(G.rows - 1, j * f + (f >> 1)); biome[n] = G.C && G.C[cy * G.cols + cx] ? G.C[cy * G.cols + cx] : G.B ? G.B[cy * G.cols + cx] : 0;
  }
  const at = n => [(n % cols + .5) * size, (((n / cols) | 0) + .5) * size], cellAt = (x, y) => clamp(Math.floor(y / size), 0, rows - 1) * cols + clamp(Math.floor(x / size), 0, cols - 1);
  const nb = (n, d) => { const i = n % cols + DIRS[d][0], j = ((n / cols) | 0) + DIRS[d][1]; return i < 0 || j < 0 || i >= cols || j >= rows ? -1 : j * cols + i; };
  // the kinds of land that matter to a traveller
  const idOf = c => { const b = BIO.byCode(c); return b ? b.id : ""; }, KIND = new Uint8Array(N);
  const DES = new Set(["dunes", "rockdesert", "badlands", "mesas", "saltflat", "drylake", "desert", "colddesert", "aliendesert"]), WET = new Set(["swampforest", "mangrove", "flooded", "marsh", "bog", "swamp"]), ICE = new Set(["icesheet", "glacier", "snow"]), ROCK = new Set(["rock", "highmtn", "stones", "volcanic", "volcano", "crater", "canyon", "mountains", "alpine", "oldmtn", "cursedmtn", "crystalmtn", "metalcliffs"]), FARM = new Set(["farmland", "orchard", "vineyard", "terraces"]), GRASS = new Set(["grass", "steppe", "savanna", "tundra", "plains", "scrub", "mediterranean"]);
  // KIND: 1 desert, 2 wet, 3 ice, 4 rock, 5 farm, 6 grass, 7 forest, 0 other
  for (let n = 0; n < N; n++) { if (!land[n]) continue; const id = idOf(biome[n]), b = BIO.BY[id]; KIND[n] = DES.has(id) ? 1 : WET.has(id) ? 2 : ICE.has(id) ? 3 : ROCK.has(id) ? 4 : FARM.has(id) ? 5 : GRASS.has(id) ? 6 : b && (b.group === "forest" || (b.group === "fantasy" && b.tree)) ? 7 : 0; if (!KIND[n] && moist[n] < .14 && temp[n] > 0) KIND[n] = 1; if (!KIND[n] && temp[n] < -8) KIND[n] = 3; }
  // the rivers, as cells joined edge to edge (so no road slips between two of their cells), each with its width, which
  // river it is and how far down it
  const riv = new Float32Array(N), rid = new Int32Array(N).fill(-1), rpos = new Float32Array(N);
  (WD.rivers || []).forEach((r, k) => {
    const p = r.pts || [], w = r.w || 1.4; let prev = -1, s = 0;
    const mark = (n, pos) => { if (n < 0 || !land[n]) return; if (w > riv[n]) { riv[n] = w; rid[n] = k; rpos[n] = pos; } };
    for (let q = 1; q < p.length; q++) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p[q][0] - p[q - 1][0], p[q][1] - p[q - 1][1]) / (size / 3)));
      for (let t = 0; t <= steps; t++) {
        const x = p[q - 1][0] + (p[q][0] - p[q - 1][0]) * t / steps, y = p[q - 1][1] + (p[q][1] - p[q - 1][1]) * t / steps, n = cellAt(x, y); s++;
        if (n === prev) continue;
        if (prev >= 0) { const pi = prev % cols, pj = (prev / cols) | 0, ni = n % cols, nj = (n / cols) | 0; if (pi !== ni && pj !== nj) { const c1 = pj * cols + ni, c2 = nj * cols + pi, [x1, y1] = at(c1), [x2, y2] = at(c2); mark(Math.hypot(x1 - x, y1 - y) < Math.hypot(x2 - x, y2 - y) ? c1 : c2, s); } }
        mark(n, s); prev = n;
      }
    }
  });
  // the sea: how far from land (open sea is far out), the lakes (fresh water, not touching the map's edge)
  const seaD = new Float32Array(N).fill(1e9), coastD = new Float32Array(N).fill(1e9), lake = new Uint8Array(N);
  { const q = []; for (let n = 0; n < N; n++) if (land[n]) { seaD[n] = 0; q.push(n); } for (let h = 0; h < q.length; h++) { const n = q[h]; for (let d = 0; d < 8; d += 2) { const m = nb(n, d); if (m >= 0 && seaD[m] > seaD[n] + 1) { seaD[m] = seaD[n] + 1; q.push(m); } } } }
  { const q = []; for (let n = 0; n < N; n++) if (!land[n]) { coastD[n] = 0; q.push(n); } for (let h = 0; h < q.length; h++) { const n = q[h]; for (let d = 0; d < 8; d += 2) { const m = nb(n, d); if (m >= 0 && coastD[m] > coastD[n] + 1) { coastD[m] = coastD[n] + 1; q.push(m); } } } }
  { const seen = new Uint8Array(N); for (let s0 = 0; s0 < N; s0++) { if (land[s0] || seen[s0]) continue; const cells = [s0]; seen[s0] = 1; let edge = false; for (let h = 0; h < cells.length; h++) { const n = cells[h], i = n % cols, j = (n / cols) | 0; if (!i || !j || i === cols - 1 || j === rows - 1) edge = true; for (let d = 0; d < 8; d += 2) { const m = nb(n, d); if (m >= 0 && !land[m] && !seen[m]) { seen[m] = 1; cells.push(m); } } } if (!edge && cells.length < N * .03) for (const c of cells) lake[c] = 1; } }
  // how rough the ground is within a cell's neighbours (a valley side is steeper than the mean over a whole cell)
  const rough = new Float32Array(N);
  for (let n = 0; n < N; n++) { if (!land[n]) continue; let lo = hm[n], hi = hm[n]; for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && land[m]) { lo = Math.min(lo, hm[m]); hi = Math.max(hi, hm[m]); } } rough[n] = (hi - lo) / (2 * ck * 1000); }
  // how far to fresh water, in km (rivers, lakes, wet ground) [water decided where caravanserais stood]
  const water = new Float32Array(N).fill(1e9);
  { const q = []; for (let n = 0; n < N; n++) { let w = riv[n] > 0 || (land[n] && moist[n] > .4); if (!w && land[n]) for (let d = 0; d < 8; d += 2) { const m = nb(n, d); if (m >= 0 && lake[m]) w = true; } if (w && land[n]) { water[n] = 0; q.push(n); } } for (let h = 0; h < q.length; h++) { const n = q[h]; for (let d = 0; d < 8; d++) { const m = nb(n, d); const dd = (d & 1 ? 1.414 : 1) * ck; if (m >= 0 && land[m] && water[m] > water[n] + dd) { water[m] = water[n] + dd; q.push(m); } } } }
  // how well the land feeds people: warm enough, wet enough, low enough, its soil [Tang-Tibet: productivity and
  // population together weigh 0.30]
  const fert = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    if (!land[n]) continue; const T = temp[n], m = moist[n];
    let fv = clamp(1 - Math.abs(T - 14) / 18, 0, 1) * (m < .1 ? .05 : .25 + .75 * clamp((m - .1) / .4, 0, 1));
    fv *= [1, .08, .35, 0, .35, 1.25, .8, .7][KIND[n]] || 1;
    fv *= clamp(1 - (hm[n] - 1400) / 2000, .05, 1);
    if (KIND[n] === 1 && water[n] < ck * 1.1) fv = Math.max(fv, .45);   // an oasis
    fert[n] = clamp(fv, 0, 1);
  }
  const fertS = Float32Array.from(fert);
  for (let pass = 0; pass < 2; pass++) { const t = Float32Array.from(fertS); for (let n = 0; n < N; n++) { if (!land[n]) continue; let s = t[n] * 2, c = 2; for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && land[m]) { s += t[m]; c++; } } fertS[n] = s / c; } }
  return { cols, rows, N, size, ck, f, hm, land, moist, temp, KIND, riv, rid, rpos, seaD, coastD, lake, rough, water, fert, fertS, at, cellAt, nb };
}

/* ---- 2. the cost of the way, for the age's travellers */
// time per km on foot at a grade, both ways averaged (a road carries traffic both ways) [Tobler's hiking function]
const tob = g => 6 * Math.exp(-3.5 * Math.abs(g + .05));
const perKm = g => (1 / tob(g) + 1 / tob(-g)) / 2;
function baseCosts(L, tech) {
  const { N, ck, hm, land, KIND, rough, water, fertS, temp, nb } = L, base = new Float32Array(N * 8).fill(Infinity), steepE = new Uint8Array(N * 8), tunE = new Uint8Array(N * 8);
  // (a valley side is steeper than the mean over a cell of this size: the slope between cells, scaled to what a road
  // on it meets)
  const SUB = clamp(ck / 3, 1, 4);
  const terr = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    if (!land[n]) continue; let t = 1;
    t *= [1, 1, 2.8, 6, 1.35, .95, 1, 1.25][KIND[n]] || 1;                     // swamp, ice, bare rock, forest
    if (hm[n] > 2200) t *= 1 + (hm[n] - 2200) / 900 * .7;                       // high, cold, short summers [Tang-Tibet altitude]
    if (temp[n] < -4) t *= 1.35;
    t *= 1.12 - .3 * fertS[n];                                                   // fed, peopled land: food and shelter on the way
    if (KIND[n] === 1 || water[n] > 40) t *= 1 + clamp((water[n] - 32) / 32, 0, 5); // a day from water and more: the desert's cost
    terr[n] = t;
  }
  for (let n = 0; n < N; n++) {
    if (!land[n]) continue;
    for (let d = 0; d < 8; d++) {
      const m = nb(n, d); if (m < 0 || !land[m]) continue;
      const dk = ck * (d & 1 ? 1.414 : 1), g = Math.abs(hm[m] - hm[n]) / (dk * 1000) * SUB + .4 * (rough[n] + rough[m]) / 2;
      let c = perKm(Math.min(g, tech.grade));
      // a modern land tunnels where the climb would be three times its grade and more: dear to build, but level
      if (tech.tunnel && g > tech.grade * 3) { c *= 2.4; tunE[n * 8 + d] = 1; }
      // steeper than a cart can climb: the road winds up in switchbacks, slope over grade times as long [switchbacks]
      else if (tech.grade && g > tech.grade) { c *= g / tech.grade; steepE[n * 8 + d] = 1; if (g > tech.grade * 4.5) c *= tech.steep; }
      else if (!tech.grade) c = perKm(g);
      base[n * 8 + d] = c * dk * (terr[n] + terr[m]) / 2;
    }
  }
  return { base, steepE, tunE, terr };
}
// crossing a river: by its width, and whether the place has a bridge [fords at wide, shallow, gentle stretches; ferries
// on great lowland rivers; bridges at towns]
const fordable = (L, n) => L.riv[n] < 1.85 && L.rough[n] < .03;
const crossCost = (L, n, bridge) => bridge[n] ? .1 : fordable(L, n) ? (L.riv[n] < 1.5 ? .35 : .7) : 1.6 + Math.max(0, L.riv[n] - 1.85) * 1.2;

/* ---- 3. the settlements */
function settle(L, WD, opt, rnd, K) {
  const { N, ck, cols, size, land, hm, riv, rid, coastD, seaD, fertS, rough, KIND, water, at, cellAt, nb } = L;
  const landKm2 = land.reduce((s, v) => s + v, 0) * ck * ck;
  // where people would choose to live: fed land, a river, a meeting of rivers, a harbour, a river's mouth
  const score = new Float32Array(N), site = new Array(N);
  for (let n = 0; n < N; n++) {
    if (!land[n]) { score[n] = -1; continue; }
    let s = fertS[n] * 1.2, st = "plain"; const coast = coastD[n] <= 1;
    let rv = riv[n] > 0, near = rv; for (let d = 0; d < 8 && !near; d++) { const m = nb(n, d); if (m >= 0 && riv[m] > 0) near = true; }
    if (rv) { s += .28; st = "river"; } else if (near) { s += .2; st = "river"; }
    if (rv) { const ids = new Set([rid[n]]); for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && rid[m] >= 0) ids.add(rid[m]); } if (ids.size > 1) s += .3; }
    if (coast) { let w = 0, c = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const i = n % cols + dx, j = ((n / cols) | 0) + dy; if (i < 0 || j < 0 || i >= cols || j >= L.rows) continue; c++; if (!land[j * cols + i]) w++; } const sh = w / c; s += .15 + (sh > .2 && sh < .6 ? .18 : 0); st = rv ? "mouth" : "coast"; if (rv) s += .35; }
    if (hm[n] > 1600) { s -= .25; st = st === "plain" ? "high" : st; } else if (rough[n] > .02 && st === "plain") st = "hill";
    if (KIND[n] === 1) { if (water[n] < ck * 1.1) { s += .3; st = "oasis"; } else s -= .3; }
    if (KIND[n] === 3) s = -1;
    score[n] = s; site[n] = st;
  }
  const places = [], byCell = new Map(), TIER = { city: 0, town: 1, village: 2, site: 3 };
  const tierOf = k => /capital|city/.test(k) ? "city" : /port|town|base|station/.test(k) ? "town" : /village|hamlet|castle|keep|fort|manor|farm|inn|monastery|camp|mine|tower|temple/.test(k) ? "village" : "site";
  for (const l of WD.locs || []) {
    if (!Array.isArray(l.at)) continue; let c = cellAt(l.at[0], l.at[1]);
    if (!land[c]) { let best = -1, bd = 1e9; for (let d = 0; d < 8; d++) { const m = nb(c, d); if (m >= 0 && land[m]) { const [x, y] = at(m), dd = Math.hypot(x - l.at[0], y - l.at[1]); if (dd < bd) { bd = dd; best = m; } } } if (best < 0) continue; c = best; }
    const tier = tierOf(String(l.kind || "town")), base = { city: 40, town: 8, village: 1.5, site: .3 }[tier];
    const p = { id: l.id, name: l.name, at: l.at.slice(), cell: c, tier, story: true, kind: l.kind, capital: /capital/.test(l.kind || ""), port: /port/.test(l.kind || "") || (tier !== "site" && coastD[c] <= 1 && tier !== "village"), pop: base * (/capital/.test(l.kind || "") ? 1.6 : 1) * (.7 + Math.max(0, score[c])), site: site[c] };
    places.push(p); if (!byCell.has(c)) byCell.set(c, p);
  }
  // centres of each order, apart by central-place spacing at this map's scale, wider where the land feeds fewer
  // [Christaller; Bracton: a third of a day's walk to market]; no more than the map can show
  const caps = { city: clamp(Math.round(landKm2 / 70000), 4, 70), town: 0, village: 0 }; caps.town = caps.city * 5; caps.village = Math.min(1100, caps.town * 4);
  const minScore = { city: .62, town: .38, village: .16 };
  const cand = []; for (let n = 0; n < N; n++) if (score[n] > 0) cand.push(n);
  const jit = new Float32Array(N); for (let n = 0; n < N; n++) jit[n] = rnd() * .12;
  cand.sort((a, b) => score[b] + jit[b] - score[a] - jit[a]);
  for (const tier of ["city", "town", "village"]) {
    let spacing = Math.max(ORDERS[tier][0], ORDERS[tier][1] * ck), chosen = null;
    for (let tries = 0; tries < 5; tries++) {
      chosen = []; const B = new Map(), bs = spacing * 2.2 / ck, key = (i, j) => Math.floor(i / bs) * 100000 + Math.floor(j / bs);
      const add = (p, sp) => { const i = p.cell % cols, j = (p.cell / cols) | 0, k = key(i, j); if (!B.has(k)) B.set(k, []); B.get(k).push([i, j, sp]); };
      for (const p of places) if (TIER[p.tier] <= TIER[tier] || p.tier === "site" && tier === "village") add(p, spacing * (p.tier === "site" ? .45 : TIER[p.tier] < TIER[tier] ? .8 : 1));
      for (const n of cand) {
        if (score[n] < minScore[tier]) break;
        if (byCell.has(n)) continue;
        const sp = spacing / Math.sqrt(clamp(fertS[n] + .25, .3, 1)) / ck, i = n % cols, j = (n / cols) | 0;
        let ok = true; const bi = Math.floor(i / bs), bj = Math.floor(j / bs);
        for (let a = -1; a <= 1 && ok; a++) for (let b = -1; b <= 1 && ok; b++) for (const [x, y, s2] of B.get((bi + a) * 100000 + bj + b) || []) if (Math.hypot(x - i, y - j) < Math.max(sp, s2 / ck)) { ok = false; break; }
        if (!ok) continue;
        const p = { cell: n, tier, pop: 0 }; chosen.push(p); add(p, spacing);
        if (chosen.length > caps[tier] * 1.6) break;
      }
      if (chosen.length <= caps[tier]) break;
      spacing *= Math.sqrt(chosen.length / caps[tier]) * 1.04;
    }
    for (const p of chosen) { const n = p.cell; p.at = at(n).map(r1); p.site = site[n]; p.port = tier !== "village" && coastD[n] <= 1; p.pop = { city: 40, town: 8, village: 1.5 }[tier] * (.6 + score[n]) * (.85 + rnd() * .3); places.push(p); byCell.set(n, p); }
  }
  // what each makes of its land: grain, herds, timber, ore, fish and salt, or the caravans' trade [complementarity]
  for (const p of places) {
    const n = p.cell, cnt = [0, 0, 0, 0, 0, 0, 0, 0]; let hs = 0, c = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const i = n % cols + dx, j = ((n / cols) | 0) + dy; if (i < 0 || j < 0 || i >= cols || j >= L.rows) continue; const m = j * cols + i; if (!land[m]) continue; cnt[KIND[m]]++; hs += hm[m]; c++; }
    const share = k => cnt[k] / Math.max(1, c);
    p.makes = /mine|dungeon/.test(p.kind || "") || hs / Math.max(1, c) > 1300 || share(4) > .3 ? "ore" : share(1) > .4 ? "caravans" : coastD[n] <= 1 && (p.port || share(5) + share(6) < .3) ? "fish and salt" : share(7) > .5 ? "timber" : share(6) > .4 || rough[n] > .025 ? "herds" : "grain";
  }
  return { places, byCell, landKm2, score, site };
}

/* ---- the search over land and water: cells of land (layer 0) and of water (layer 1, the sea and the navigable rivers),
        joined at the ports, where loading costs a day [ORBIS] */
function searcher(L, W) {
  const { N, nb, land, riv, rpos } = L, M2 = N * 2;
  const dist = new Float64Array(M2), prev = new Int32Array(M2), stamp = new Int32Array(M2), done = new Int32Array(M2), heap = Heap(1 << 16);
  let cur = 0;
  // W: { base, lvl (Uint8 per land cell), near (Uint8), bridge, state (Int16), toll(a, b), water (Uint8: 1 sea, 2 river),
  //      open (cost factor of open sea, 0: closed), seaK, cur (current factor fn), ports: Map land -> [water cells],
  //      docks: Map water -> [land cells], noWater }
  function run(src, maxCost, stopAt) {
    cur++; heap.clear(); const S = Array.isArray(src) ? src : [src];
    for (const s of S) { stamp[s] = cur; dist[s] = 0; prev[s] = -1; heap.push(s, 0); }
    let found = 0; const want = stopAt ? stopAt.size : 0;
    while (heap.size) {
      const k = heap.topKey(), u = heap.pop();
      if (done[u] === cur) continue; done[u] = cur; if (k > maxCost) break;
      if (want && stopAt.has(u) && ++found >= want) break;
      if (u < N) {
        const lu = W.lvl[u];
        for (let d = 0; d < 8; d++) {
          const m = nb(u, d); if (m < 0 || !land[m]) continue;
          let c = W.base[u * 8 + d]; if (c === Infinity) continue;
          // (a road already there is the cheaper; the ground beside it is not, or a second road would run alongside)
          const lv = Math.min(lu, W.lvl[m]); if (lv) c *= ALPHA[lv];
          if (riv[m] > 0) c += riv[u] > 0 ? c * .3 : crossCost(L, m, W.bridge);
          if (W.toll && W.state[u] !== W.state[m] && W.state[u] >= 0 && W.state[m] >= 0) c += W.toll(W.state[u], W.state[m]);
          relax(u, m, k + c);
        }
        if (!W.noWater) { const ws = W.ports.get(u); if (ws) for (const w of ws) relax(u, N + w, k + TRANSFER); }
      } else {
        const a = u - N;
        for (let d = 0; d < 8; d++) {
          const m = nb(a, d); if (m < 0 || !W.water[m]) continue; let c;
          const dk = L.ck * (d & 1 ? 1.414 : 1);
          if (W.water[m] === 1 && W.water[a] === 1) { if (L.seaD[m] > W.coastal) { if (!W.open) continue; c = dk * SEA_K * .2 * W.open; } else c = dk * SEA_K * .2; c *= W.cur ? W.cur(a, d) : 1; if (W.wl[m]) c *= .6; }
          else if (W.water[m] === 2 && W.water[a] === 2) c = dk * .2 * (rpos[m] >= rpos[a] ? RIVER_DOWN : RIVER_UP);
          else c = dk * .2 * RIVER_DOWN;   // a river's mouth
          relax(u, N + m, k + c);
        }
        const ls = W.docks.get(a); if (ls) for (const l of ls) relax(u, l, k + TRANSFER);
      }
    }
    return cur;
  }
  function relax(u, m, v) { if (stamp[m] !== cur) { stamp[m] = cur; dist[m] = Infinity; } if (v < dist[m]) { dist[m] = v; prev[m] = u; heap.push(m, v); } }
  const reached = n => stamp[n] === cur && done[n] === cur;
  const cost = n => stamp[n] === cur ? dist[n] : Infinity;
  const path = t => { const out = []; for (let n = t; n >= 0; n = prev[n]) { out.push(n); if (out.length > M2) break; } return out.reverse(); };
  return { run, reached, cost, path };
}

/* ---- 4. growing the network over the ages */
function grow(L, PL, opt, rnd, log) {
  const { N, nb, land, riv, coastD, seaD, ck, rpos, rid } = L, places = PL.places;
  // (the level says what is built: a tribal land has no wheels, so every age walks)
  const LV = levelOf(opt.level, opt.tech), walk = { grade: 0, steep: 1 }, tech = LV.grade ? LV : walk;
  const lvl = new Uint8Array(N), near = new Uint8Array(N), bridge = new Uint8Array(N), state = new Int16Array(N).fill(-1), oldLvl = new Uint8Array(N);
  // the water: the sea, and the rivers big enough and gentle enough for boats [ORBIS: 25 navigable rivers]; a land
  // without roads takes its canoes up smaller rivers
  const water = new Uint8Array(N);
  for (let n = 0; n < N; n++) if (!land[n]) water[n] = 1;
  for (let n = 0; n < N; n++) if (riv[n] >= LV.nav && L.rough[n] < .02 && L.hm[n] < 900) water[n] = 2;
  // (a navigable stretch reaches the sea or a lake, else it is no waterway)
  { const ok = new Uint8Array(N), q = []; for (let n = 0; n < N; n++) if (water[n] === 2) for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && water[m] === 1) { ok[n] = 1; q.push(n); break; } } for (let h = 0; h < q.length; h++) { const n = q[h]; for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && water[m] === 2 && !ok[m]) { ok[m] = 1; q.push(m); } } } for (let n = 0; n < N; n++) if (water[n] === 2 && !ok[n]) water[n] = 0; }
  // the ports: a coastal place of a town and more, a place on a navigable river; each loads at the water beside it
  const ports = new Map(), docks = new Map();
  const dock = (p) => { const n = p.cell, ws = []; if (water[n] === 2) ws.push(n); for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && water[m]) ws.push(m); } if (!ws.length) return; p.dock = true; if (water[n] === 2 || ws.some(w => water[w] === 2)) p.riverPort = true; ports.set(n, ws); for (const w of ws) { if (!docks.has(w)) docks.set(w, []); docks.get(w).push(n); } };
  for (const p of places) if (p.tier !== "site" && (p.port || (p.tier !== "village" && coastD[p.cell] <= 1) || p.tier !== "village" && riv[p.cell] >= 1.9)) dock(p);
  // the ocean's currents, where the world has them: a ship sails cheaper with them than against [ORBIS's winds]
  let curF = null;
  if (opt.currents) { const C = opt.currents; curF = (a, d) => { const i = a % L.cols, j = (a / L.cols) | 0, x = i * L.size, y = j * L.size, ci = clamp(Math.floor(x / C.cell), 0, C.cols - 1), cj = clamp(Math.floor(y / C.cell), 0, C.rows - 1), k = cj * C.cols + ci, u = C.u[k], v = C.v[k], s = Math.hypot(u, v) || 1e-9; const [dx, dy] = DIRS[d], dl = Math.hypot(dx, dy); return clamp(1 - .35 * (u * dx + v * dy) / (dl * Math.max(s, C.max * .25)) * Math.min(1, s / (C.max * .5)), .6, 1.4); }; }
  // (wl: the sea lanes ships have sailed: a known way is the cheaper, as a road is [the sequential model, at sea])
  const wl = new Uint8Array(N);
  const W = { lvl, near, bridge, state, toll: null, water, wl, open: 0, coastal: 3, cur: curF, ports, docks, noWater: true };
  const S = searcher(L, W);
  const edgeF = new Float64Array(N * 8), edgeO = new Uint8Array(N * 8), waterF = new Float64Array(N * 8), cellF = new Float64Array(N), cellO = new Uint8Array(N), crossF = new Float64Array(N), intl = new Uint8Array(N * 8), through = new Float64Array(places.length), borderF = new Float64Array(N * 8);
  const ek = (a, d) => { const b = nb(a, d); return b < a ? b * 8 + ((d + 4) & 7) : a * 8 + d; };
  const dirOf = (a, b) => { const dx = b % L.cols - a % L.cols, dy = ((b / L.cols) | 0) - ((a / L.cols) | 0); for (let d = 0; d < 8; d++) if (DIRS[d][0] === dx && DIRS[d][1] === dy) return d; return -1; };
  const placeAt = PL.byCell;
  // a flow laid along its way: every cell and edge of it carries it, and the rank of what it joins; a river it crosses
  // is crossed by it; a border too
  function lay(pathN, F, ord, from, to) {
    let prevL = -1, crossedBorder = false;
    for (let k = 0; k < pathN.length; k++) {
      const u = pathN[k];
      if (u < N) {
        cellF[u] += F; if (ord > cellO[u]) cellO[u] = ord;
        if (prevL >= 0 && pathN[k - 1] < N) { const d = dirOf(prevL, u); if (d >= 0) { const e = ek(prevL, d); edgeF[e] += F; if (ord > edgeO[e]) edgeO[e] = ord; if (W.toll && state[prevL] !== state[u] && state[prevL] >= 0 && state[u] >= 0) { borderF[e] += F; crossedBorder = true; } } if (riv[u] > 0 && !(riv[prevL] > 0)) crossF[u] += F; }
        const p = placeAt.get(u); if (p && p !== from && p !== to && k > 0 && k < pathN.length - 1) through[p.ix] += F;
        prevL = u;
      } else {
        const a = u - N, b = k + 1 < pathN.length && pathN[k + 1] >= N ? pathN[k + 1] - N : -1;
        if (b >= 0) { const d = dirOf(a, b); if (d >= 0) waterF[ek(a, d)] += F; }
        wl[a] = 1; prevL = -1;
      }
    }
    if (crossedBorder) for (let k = 1; k < pathN.length; k++) { const a = pathN[k - 1], b = pathN[k]; if (a < N && b < N) { const d = dirOf(a, b); if (d >= 0) intl[ek(a, d)] = 1; } }
  }
  // after each source: what has been used is now a way, of the rank of what it joins [the active walker; sequential model]
  const settleLevels = cells => { for (const u of cells) { const l = cellO[u]; if (l > lvl[u]) { lvl[u] = l; for (let d = 0; d < 8; d++) { const m = nb(u, d); if (m >= 0) near[m] = 1; } } } };
  places.forEach((p, i) => { p.ix = i; });
  const comp = (a, b) => 1 + (a.makes !== b.makes ? .6 : 0) + ((a.makes === "ore" && b.makes === "grain") || (b.makes === "ore" && a.makes === "grain") ? .5 : 0) + (a.dock && !b.dock || b.dock && !a.dock ? .25 : 0);
  const relF = (a, b) => { const sa = state[a.cell], sb = state[b.cell]; if (!W.toll || sa < 0 || sb < 0 || sa === sb) return 1; return { friendly: .75, wary: .4, hostile: .08 }[opt.rel(sa, sb)] || .4; };
  // what a road joins gives its rank [functional classification: arterials join cities, collectors towns, local roads
  // bring the villages to market]: 4 city to city, 3 town to town or city, 2 a village to its market, 1 village to village
  const ordOf = (a, b) => { const big = p => p.tier === "city" || p.tier === "town", low = p => p.tier === "village" || p.tier === "site"; return a.tier === "city" && b.tier === "city" ? 4 : big(a) && big(b) ? 3 : low(a) !== low(b) ? 2 : 1; };
  const AGES = [
    { name: "the first paths", tech: walk, water: false, open: 0, cityReach: 60, cities: Math.min(4, LV.links.city[1]) },
    { name: "the market roads", tech, water: true, open: 0, cityReach: 160, cities: LV.links.city[1] },
    { name: "long-distance trade", tech, water: true, open: LV.open, cityReach: Infinity, cities: LV.links.city[1], states: true },
    { name: "the present", tech, water: true, open: LV.open, cityReach: Infinity, cities: LV.links.city[1], final: true }
  ];
  const REACH = { village: 30, site: 30, town: 70 };
  let BC = null; const ageLog = [], rankE = new Uint8Array(N * 8), rankC = new Uint8Array(N);
  for (let ai = 0; ai < AGES.length; ai++) {
    const age = AGES[ai];
    BC = baseCosts(L, age.tech); W.base = BC.base; W.noWater = !age.water; W.open = age.open;
    if (age.states && !W.toll) { makeStates(L, PL, W, S, opt, rnd); W.toll = (a, b) => ({ friendly: 1.5, wary: 5, hostile: 26 })[opt.rel(a, b)] || 5; }
    cellF.fill(0); cellO.fill(0); edgeF.fill(0); edgeO.fill(0); waterF.fill(0); crossF.fill(0); through.fill(0); intl.fill(0); borderF.fill(0);
    // the biggest first [the sequential model: the order matters]. Each place trades with a few: a village with its
    // market and its two nearest neighbours, a town with its three nearest towns and two cities, a city with every city
    // it reaches; a port with the ports nearest by water
    const order = places.filter(p => p.tier !== "site" || ai < 2).slice().sort((a, b) => b.pop - a.pop), done = new Set();
    let pairs = 0;
    for (const a of order) {
      const reach = a.tier === "city" ? age.cityReach : REACH[a.tier];
      // (a village's trade goes by land to its neighbours and its market; ships carry the towns' and the cities'; where
      // there are hardly roads, the villages' boats too)
      W.noWater = !age.water || (a.tier === "village" || a.tier === "site") && !LV.boats;
      S.run(a.cell, reach);
      const got = []; for (const b of order) if (b !== a && S.reached(b.cell)) got.push([b, S.cost(b.cell)]);
      got.sort((x, y) => x[1] - y[1]);
      const take = (pred, k) => got.filter(([b]) => pred(b)).slice(0, k), big = b => b.tier === "town" || b.tier === "city", K = LV.links;
      const picks = a.tier === "village" ? [...take(b => b.tier === "village", K.village[0]), ...take(big, K.village[1])] : a.tier === "site" ? take(b => b.tier !== "site", 1)
        : a.tier === "town" ? [...take(b => b.tier === "town", K.town[0]), ...take(b => b.tier === "city", K.town[1]), ...(a.dock && age.water ? take(b => b.dock && big(b), 3) : [])]
        : [...take(b => b.tier === "town", K.city[0]), ...take(b => b.tier === "city", age.cities)];
      const flows = [];
      for (const [b, c] of picks) {
        const key = a.ix < b.ix ? a.ix + "," + b.ix : b.ix + "," + a.ix; if (done.has(key)) continue; done.add(key);
        flows.push([b, a.pop * b.pop * comp(a, b) * relF(a, b) / Math.pow(1 + c / DAY, BETA), ordOf(a, b)]);
      }
      // (a city's trade with a far, small city is a trickle on the roads the others made, not a great road of its own)
      const top = Math.max(0, ...flows.filter(f => f[2] === 4).map(f => f[1]));
      const used = [];
      for (const [b, F, o] of flows.sort((x, y) => y[1] - x[1])) {
        if (o === 4 && F < top * .01) continue;
        // (no higher than the land builds; a village's way to market a footpath where few roads are made)
        let ord = o === 4 && F < top * .08 ? 3 : o; if (ord === 2 && LV.vill === 1) ord = 1; ord = Math.min(ord, LV.cap);
        const pth = S.path(b.cell); lay(pth, F, ord, a, b); pairs++;
        for (const u of pth) if (u < N) used.push(u);
      }
      settleLevels(used);
    }
    // a place no flow reached walks to its nearest neighbour all the same
    W.noWater = true;
    for (const p of places) {
      if (cellF[p.cell] > 0) continue;
      const others = new Set(places.filter(q => q !== p && q.tier !== "site").map(q => q.cell));
      S.run(p.cell, 400, others); let best = -1, bc = Infinity; for (const c of others) if (S.reached(c) && S.cost(c) < bc) { bc = S.cost(c); best = c; }
      if (best >= 0) { const pth = S.path(best); lay(pth, .01, 1, p, null); settleLevels(pth.filter(u => u < N)); }
    }
    // a road busier than its rank's usual is raised one [Levinson and Yerra: the busy are improved]
    const med = o => { const v = []; for (let n = 0; n < N; n++) if (cellO[n] === o && cellF[n] > 0) v.push(cellF[n]); v.sort((x, y) => x - y); return v.length ? v[v.length >> 1] : Infinity; };
    // (a land that builds little raises nothing; a modern one raises its busy roads readily, LV.up)
    const M = [0, med(1), med(2), med(3), med(4)], u = LV.up, up = (o, f) => !u ? o : Math.min(LV.cap, o === 3 && f >= M[4] * .6 / u ? 4 : o === 2 && f >= M[3] / u ? 3 : o === 1 && f >= M[2] / u ? 2 : o);
    for (let n = 0; n < N; n++) rankC[n] = up(cellO[n], cellF[n]);
    for (let e = 0; e < N * 8; e++) rankE[e] = edgeO[e] ? up(edgeO[e], edgeF[e]) : 0;
    // bridges, where the trade over a crossing pays for one and the age can build it [bridges came later, at towns]
    // (none where nothing is built; at a city only in an early land; at every busy crossing in a modern one)
    if (ai >= 1 && LV.bridges !== "none") for (let n = 0; n < N; n++) {
      if (!(riv[n] > 0) || bridge[n] || !(crossF[n] > 0) || rankC[n] < 2) continue;
      let town = false, city = false; for (let d = -1; d < 8; d++) { const m = d < 0 ? n : nb(n, d); const p = m >= 0 && placeAt.get(m); if (p && p.tier !== "village" && p.tier !== "site") town = true; if (p && p.tier === "city") city = true; }
      const B = LV.bridges, build = B === "all" ? true : B === "cities" ? city && rankC[n] >= 3 : (B === "any" && rankC[n] >= 3) || (town && rankC[n] >= 3) || (B === "major" && rankC[n] >= 4);
      if (build) bridge[n] = ai;
    }
    // the levels of the age: what carried trade keeps or gains its rank; what lost it falls one, an old road [rise and fall]
    for (let n = 0; n < N; n++) { const l = rankC[n]; if (l < lvl[n]) { oldLvl[n] = Math.max(oldLvl[n], lvl[n]); lvl[n] = Math.max(l, lvl[n] - 1); } else lvl[n] = l; }
    // places on busy ways grow, those passed by shrink [Fulminante: centrality made central places]
    if (!age.final) {
      const tf = places.map(p => through[p.ix] / Math.max(1e-6, p.pop));
      const mean = tf.reduce((s, v) => s + v, 0) / Math.max(1, tf.length);
      places.forEach((p, i) => { if (p.tier === "site") return; p.pop *= clamp(1 + .35 * Math.log1p(tf[i] / Math.max(1e-6, mean)) - .1, .8, 1.6); });
    }
    ageLog.push(`${age.name}: ${pairs} flows`);
    if (log) log(`    ${age.name}: ${pairs} flows`);
  }
  // the ranks the places end with: a town grown past the cities' least becomes one, a village past the towns' (the
  // story's places keep theirs)
  const least = t => { const ps = places.filter(p => p.tier === t); return ps.length ? ps.map(p => p.pop).sort((a, b) => a - b)[Math.floor(ps.length * .2)] : Infinity; };
  // (at the other levels of development the settlements are those of the default level, so moving the slider changes the
  // roads and nothing else: opt.fixed)
  const cityLeast = least("city"), townLeast = least("town");
  if (!opt.fixed) for (const p of places) { if (p.story) continue; if (p.tier === "town" && p.pop > cityLeast * 1.15) { p.tier = "city"; p.grew = true; } else if (p.tier === "village" && p.pop > townLeast * 1.25) { p.tier = "town"; p.grew = true; } }
  return { lvl, oldLvl, bridge, state, edgeF, waterF, cellF, crossF, intl, borderF, through, water, ports, S, W, BC, ageLog, ek, dirOf, rankE, rankC };
}

/* ---- 5. states round the capitals, by travel cost (so their borders fall on mountains, rivers and deserts) */
function makeStates(L, PL, W, S, opt, rnd) {
  const { N, ck, land } = L, places = PL.places;
  // (the other levels of development keep the default level's states, their borders and their friendships)
  if (opt.fixed) { const F = opt.fixed, R = F.relTable || {}; W.state.set(F.state); opt.states = F.states; opt.relTable = R; opt.rel = (a, b) => R[a < b ? a + "," + b : b + "," + a] || "wary"; F.states.forEach((s, k) => { places[s.capital].seat = k; }); return; }
  const want = clamp(Math.round(PL.landKm2 / 280000), 2, 10), gap = .55 * Math.sqrt(PL.landKm2 / want) / ck;
  const seeds = places.filter(p => p.capital);
  for (const p of places.filter(q => q.tier === "city" && !q.capital).sort((a, b) => b.pop - a.pop)) { if (seeds.length >= want) break; const i = p.cell % L.cols, j = (p.cell / L.cols) | 0; if (seeds.every(s => Math.hypot(s.cell % L.cols - i, ((s.cell / L.cols) | 0) - j) > gap)) seeds.push(p); }
  if (!seeds.length) return;
  // each state's reach from its capital, the bigger capital reaching further; islands go to who reaches them by sea
  const best = new Float64Array(N).fill(Infinity), keepNo = W.noWater, keepOpen = W.open; W.noWater = false; W.open = 0;
  seeds.forEach((s, k) => {
    S.run(s.cell, Infinity); const pull = Math.pow(s.pop, .25);
    for (let n = 0; n < N; n++) { if (!land[n]) continue; const c = Math.min(S.cost(n), S.cost(N + n) * 3) / pull; if (c < best[n]) { best[n] = c; W.state[n] = k; } }
  });
  W.noWater = keepNo; W.open = keepOpen;
  const sf = TECH[opt.tech].scifi, named = namer(rnd, places.map(p => p.name).filter(Boolean), sf), KINDS = sf ? ["Colonial Authority", "Free Settlements", "Compact", "Directorate", "Union", "Charter Company"] : ["Kingdom", "Kingdom", "Duchy", "Principality", "Realm", "March", "Free Cities", "Grand Duchy"];
  // (named for the capital: the Kingdom of Aurelhaven; a capital not yet named is named now, for where it stands)
  for (const s of seeds) if (!s.name) s.name = named(s.site);
  opt.states = seeds.map((s, k) => ({ id: "s" + k, name: `The ${KINDS[Math.floor(rnd() * KINDS.length)]} of ${s.name}`, capital: s.ix, seat: s.id || null }));
  seeds.forEach((s, k) => { s.seat = k; });
  // friends, the wary and enemies: the campaign's own word where its realms say, else the world's seed [security, tolls]
  const R = {}; opt.rel = (a, b) => R[a < b ? a + "," + b : b + "," + a] || "wary";
  for (let a = 0; a < seeds.length; a++) for (let b = a + 1; b < seeds.length; b++) { const x = rnd(); R[a + "," + b] = (opt.relations && opt.relations[a + "," + b]) || (x < .35 ? "friendly" : x < .8 ? "wary" : "hostile"); }
  opt.relTable = R;
}

/* ---- 6. the lines the map draws: chains of cells between junctions, each pulled straight wherever the straight way
        costs no more and crosses the same rivers (so a road bends only where the land bends it), then softened */
function lines(L, PL, NW, opt) {
  const { N, nb, size, land, riv, hm, at, ck, cols } = L, places = PL.places, BC = NW.BC;
  const ptOf = n => { const p = PL.byCell.get(n); return p ? p.at.slice() : at(n); };
  // each cell's cost per km on the flat way through it (the cheapest of its ways)
  const cc = new Float32Array(N); for (let n = 0; n < N; n++) { let m = Infinity; for (let d = 0; d < 8; d++) { const v = BC.base[n * 8 + d]; if (v < Infinity) m = Math.min(m, v / (ck * (d & 1 ? 1.414 : 1))); } cc[n] = m; }
  function pull(cells, wet) {
    if (cells.length < 3) return cells.slice();
    const cum = [0], crs = [0];
    for (let k = 1; k < cells.length; k++) { const a = cells[k - 1], b = cells[k], dk = ck * (a % cols !== b % cols && ((a / cols) | 0) !== ((b / cols) | 0) ? 1.414 : 1); cum.push(cum[k - 1] + (wet ? dk : (cc[a] + cc[b]) / 2 * dk)); crs.push(crs[k - 1] + (!wet && riv[b] > 0 && !(riv[a] > 0) ? 1 : 0)); }
    const ok = (ia, ib) => {
      const a = cells[ia], b = cells[ib], x0 = a % cols + .5, y0 = ((a / cols) | 0) + .5, x1 = b % cols + .5, y1 = ((b / cols) | 0) + .5, len = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(2, Math.ceil(len * 2.5));
      let cost = 0, cross = 0, prevR = riv[a] > 0;
      for (let s = 1; s <= steps; s++) {
        const n = Math.floor(y0 + (y1 - y0) * s / steps) * cols + Math.floor(x0 + (x1 - x0) * s / steps);
        if (wet) { if (!NW.water[n]) return false; continue; }
        if (!land[n] || cc[n] === Infinity) return false; cost += cc[n] * len * ck / steps; const r = riv[n] > 0; if (r && !prevR) cross++; prevR = r;
      }
      return wet || cost <= (cum[ib] - cum[ia]) * 1.04 + 1e-9 && cross === crs[ib] - crs[ia];
    };
    const keep = [cells[0]]; let a = 0;
    while (a < cells.length - 1) { let best = a + 1; for (let j = a + 2; j < cells.length; j++) { if (ok(a, j)) best = j; else if (j - best > 8) break; } keep.push(cells[best]); a = best; }
    return keep;
  }
  function chains(has, clsOf, stopAtPlaces) {
    const deg = new Uint8Array(N), out = [];
    for (let a = 0; a < N; a++) for (let d = 0; d < 4; d++) { const e = a * 8 + d; if (has(e)) { const b = nb(a, d); if (b >= 0) { deg[a]++; deg[b]++; } } }
    // (an edge is kept from its lower cell, in directions 0..3: east, south-east, south, south-west)
    const edgesOf = a => { const r = []; for (let d = 0; d < 8; d++) { const b = nb(a, d); if (b < 0) continue; const e = b < a ? b * 8 + ((d + 4) & 7) : a * 8 + d; if (has(e)) r.push([b, e]); } return r; };
    const seen = new Uint8Array(N * 8), stop = n => deg[n] !== 2 || (stopAtPlaces && PL.byCell.has(n));
    const walk = (a, b0, e0) => { const cls = clsOf(e0), cells = [a, b0]; let prevC = a, curC = b0, f = e0, cnt = 1; seen[e0] = 1; const fs = [e0];
      while (!stop(curC)) { const nx = edgesOf(curC).find(([b, e]) => !seen[e] && b !== prevC); if (!nx || clsOf(nx[1]) !== cls) break; seen[nx[1]] = 1; fs.push(nx[1]); cnt++; prevC = curC; curC = nx[0]; cells.push(curC); }
      out.push({ cells, cls, es: fs }); void f; };
    for (let a = 0; a < N; a++) { if (!deg[a] || !stop(a)) continue; for (const [b0, e0] of edgesOf(a)) if (!seen[e0]) walk(a, b0, e0); }
    // (where a rank changes along a way, and loops with no junction)
    for (let a = 0; a < N; a++) if (deg[a]) for (const [b0, e0] of edgesOf(a)) if (!seen[e0]) walk(a, b0, e0);
    return out;
  }
  const roads = [], marks = [], rankE = NW.rankE;
  for (const ch of chains(e => rankE[e] > 0, e => rankE[e], true)) {
    const arid = ch.cells.filter(n => L.KIND[n] === 1 || L.water[n] > 40).length / ch.cells.length, high = ch.cells.some(n => hm[n] > 1500);
    let c = LEVEL[ch.cls];
    if (ch.cls >= 2 && arid > .5) c = "caravan";
    if (ch.cls === 4 && ch.es.some(e => NW.intl[e])) c = "trade";
    const f = ch.es.reduce((s, e) => s + NW.edgeF[e], 0) / ch.es.length;
    const pts = chaikin(pull(ch.cells, false).map(ptOf), 2).map(p => [r1(p[0]), r1(p[1])]);
    roads.push(Object.assign({ c, pts, f: Math.round(f * 100) / 100 }, high && ch.cls >= 2 ? { mtn: 1 } : {}));
  }
  // the roads no longer used: kept faint, an old road [older roads survive alongside newer ones]
  const oldE = new Uint8Array(N * 8);
  for (let a = 0; a < N; a++) for (let d = 0; d < 4; d++) { const b = nb(a, d); if (b < 0 || !land[b]) continue; const e = a * 8 + d; if (rankE[e]) continue; if (NW.oldLvl[a] >= 2 && NW.oldLvl[b] >= 2 && !NW.lvl[a] && !NW.lvl[b]) oldE[e] = 1; }
  for (const ch of chains(e => oldE[e] > 0, () => 1, false)) if (ch.cells.length > 2) roads.push({ c: "old", pts: chaikin(pull(ch.cells, false).map(at), 2).map(p => [r1(p[0]), r1(p[1])]) });
  // the water: sea lanes by their trade, the rivers boats use
  const wf = []; for (let e = 0; e < N * 8; e++) if (NW.waterF[e] > 0) wf.push(NW.waterF[e]); wf.sort((x, y) => x - y);
  const wq = q => wf.length ? wf[Math.floor(wf.length * q)] : 0, wMain = wq(.6), wMin = wq(.15);
  const water = [];
  for (const ch of chains(e => NW.waterF[e] > wMin, e => NW.waterF[e] >= wMain ? 2 : 1, false)) {
    const onRiver = ch.cells.filter(n => NW.water[n] === 2).length > ch.cells.length / 2;
    const f = ch.es.reduce((s, e) => s + NW.waterF[e], 0) / ch.es.length;
    const pts = chaikin(pull(ch.cells, true).map(at), 3).map(p => [r1(p[0]), r1(p[1])]);
    water.push({ c: onRiver ? "river" : ch.cls === 2 ? "sea" : "coast", pts, f: Math.round(f * 100) / 100 });
  }
  // crossings: a bridge, a ford or a ferry where a road meets a river [fords, ferries, bridges]
  for (let n = 0; n < N; n++) {
    if (!(NW.crossF[n] > 0) || !(riv[n] > 0) || NW.rankC[n] < 2) continue;
    marks.push({ k: NW.bridge[n] ? "bridge" : fordable(L, n) ? "ford" : "ferry", at: at(n).map(r1), r: NW.rankC[n] });
  }
  // passes: where a road tops a ridge, well above its way on either side [the lowest saddle the age can engineer]
  const roadC = n => NW.rankC[n] >= 2;
  for (let n = 0; n < N; n++) {
    if (!roadC(n) || hm[n] < 900) continue; let top = true, cnt = 0;
    for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && roadC(m)) { cnt++; if (hm[m] > hm[n]) top = false; } }
    if (!top || cnt < 2) continue;
    let lo = hm[n]; const q = [[n, 0]], seen = new Set([n]); while (q.length) { const [u, dd] = q.shift(); lo = Math.min(lo, hm[u]); if (dd >= 5) continue; for (let d = 0; d < 8; d++) { const m = nb(u, d); if (m >= 0 && roadC(m) && !seen.has(m)) { seen.add(m); q.push([m, dd + 1]); } } }
    if (hm[n] - lo < 300) continue;
    marks.push({ k: "pass", at: at(n).map(r1), h: Math.round(hm[n] / 10) * 10, r: NW.rankC[n] });
  }
  // tunnels: where a modern main road goes through the mountain instead of over it
  const tun = new Set();
  for (let a = 0; a < N; a++) for (let d = 0; d < 4; d++) { const b = nb(a, d); if (b < 0) continue; const e = a * 8 + d; if (!(BC.tunE[e] || BC.tunE[b * 8 + ((d + 4) & 7)]) || rankE[e] < 3) continue; const key = Math.floor(a % cols / 3) + "," + Math.floor(((a / cols) | 0) / 3); if (tun.has(key)) continue; tun.add(key); const [x1, y1] = at(a), [x2, y2] = at(b); marks.push({ k: "tunnel", at: [r1((x1 + x2) / 2), r1((y1 + y2) / 2)], a: Math.round(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI), h: Math.round(Math.max(hm[a], hm[b]) / 10) * 10 }); }
  // switchbacks: where a road climbs steeper than the age's carts can go straight [switchbacks]
  const zig = new Set();
  for (let a = 0; a < N; a++) for (let d = 0; d < 4; d++) { const b = nb(a, d); if (b < 0) continue; const e = a * 8 + d; if (!(BC.steepE[e] || BC.steepE[b * 8 + ((d + 4) & 7)]) || rankE[e] < 2) continue; const key = Math.floor(a % cols / 2) + "," + Math.floor(((a / cols) | 0) / 2); if (zig.has(key)) continue; zig.add(key); const [x1, y1] = at(a), [x2, y2] = at(b); marks.push({ k: "zigzag", at: [r1((x1 + x2) / 2), r1((y1 + y2) / 2)], a: Math.round(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) }); }
  // customs: where trade crosses a border on a road of rank
  if (opt.states) { const cs = new Set(); for (let e = 0; e < N * 8; e++) { if (!(NW.borderF[e] > 0) || rankE[e] < 2) continue; const a = (e / 8) | 0, d = e & 7, b = nb(a, d); if (b < 0) continue; const key = Math.floor(a % cols / 3) + "," + Math.floor(((a / cols) | 0) / 3); if (cs.has(key)) continue; cs.add(key); const [x1, y1] = at(a), [x2, y2] = at(b); marks.push({ k: "customs", at: [r1((x1 + x2) / 2), r1((y1 + y2) / 2)], rel: opt.rel(NW.state[a], NW.state[b]), r: rankE[e] }); } }
  // wells: the caravans' stops across the desert
  for (const p of places) if (p.makes === "caravans" || p.site === "oasis") marks.push({ k: "well", at: p.at.slice() });
  // the borders: the edges between cells of two states, joined into lines
  const border = [];
  if (opt.states) {
    const segs = [], { rows } = L;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const n = j * cols + i; if (!land[n] || NW.state[n] < 0) continue; if (i + 1 < cols && land[n + 1] && NW.state[n + 1] >= 0 && NW.state[n + 1] !== NW.state[n]) segs.push([[i + 1, j], [i + 1, j + 1]]); if (j + 1 < rows && land[n + cols] && NW.state[n + cols] >= 0 && NW.state[n + cols] !== NW.state[n]) segs.push([[i, j + 1], [i + 1, j + 1]]); }
    const key = p => p[0] + "," + p[1], ends = new Map(); segs.forEach((s, k) => { for (const p of s) { const kk = key(p); if (!ends.has(kk)) ends.set(kk, []); ends.get(kk).push(k); } });
    const used = new Uint8Array(segs.length);
    for (let k = 0; k < segs.length; k++) {
      if (used[k]) continue; used[k] = 1; const line = [segs[k][0], segs[k][1]];
      for (const dir of [1, 0]) { for (;;) { const tip = dir ? line[line.length - 1] : line[0], nx = (ends.get(key(tip)) || []).find(q => !used[q]); if (nx == null) break; used[nx] = 1; const s = segs[nx], o = key(s[0]) === key(tip) ? s[1] : s[0]; if (dir) line.push(o); else line.unshift(o); } }
      if (line.length > 2) border.push(chaikin(rdp(line.map(p => [p[0] * size, p[1] * size]), size * .5), 3).map(p => [r1(p[0]), r1(p[1])]));
    }
  }
  return { roads, water, marks, border };
}

/* ---- 7. the story's own routes, along the network (a route the game master drew keeps its own way) */
function storyRoutes(L, PL, NW, WD) {
  const out = {}, S = NW.S, W = NW.W, keep = { lvl: W.lvl.slice() };
  for (const r of WD.routes || []) {
    if (Array.isArray(r.via) && r.via.length || r.edited || r.added) continue;
    const a = PL.places.find(p => p.id === r.from), b = PL.places.find(p => p.id === r.to); if (!a || !b) continue;
    const sea = /sea|ship/.test(r.kind || ""); W.noWater = !sea;
    S.run(a.cell, Infinity, new Set([sea ? b.cell : b.cell])); if (!S.reached(b.cell)) continue;
    const pth = S.path(b.cell), pts = [];
    for (const n of pth) pts.push(n < L.N ? (PL.byCell.get(n) === a ? a.at : PL.byCell.get(n) === b ? b.at : L.at(n)) : L.at(n - L.N));
    out[r.id] = chaikin(rdp(pts, L.size * .3), 2).map(p => [r1(p[0]), r1(p[1])]);
  }
  W.lvl.set(keep.lvl); W.noWater = false;
  return out;
}

/* ---- 8. how it measures against real networks [docs/research 1.8] */
function measure(L, PL, NW, out) {
  const { N, nb, ck } = L, places = PL.places;
  const lenBy = {}; for (const r of out.roads) { let l = 0; for (let k = 1; k < r.pts.length; k++) l += Math.hypot(r.pts[k][0] - r.pts[k - 1][0], r.pts[k][1] - r.pts[k - 1][1]); lenBy[r.c] = (lenBy[r.c] || 0) + l * ck / L.size; }
  const live = Object.entries(lenBy).filter(([c]) => c !== "old"), total = live.reduce((s, [, v]) => s + v, 0), main = (lenBy.major || 0) + (lenBy.trade || 0) + (lenBy.regional || 0);
  // the junctions: cells where three ways and more meet, on the roads of local rank and above
  const road = n => NW.rankC[n] >= 2; let j3 = 0, j4 = 0, ends = 0, degSum = 0, nodes = 0;
  for (let n = 0; n < N; n++) { if (!road(n)) continue; let d0 = 0; for (let d = 0; d < 8; d++) { const m = nb(n, d); if (m >= 0 && road(m) && NW.rankE[NW.ek(n, d)] >= 2) d0++; } if (d0 !== 2) { nodes++; degSum += d0; if (d0 === 1) ends++; else if (d0 === 3) j3++; else if (d0 >= 4) j4++; } }
  // the detour: by road between a town or city and its three nearest, over the straight line, along the drawn lines
  const S = NW.S, W = NW.W; W.noWater = true;
  const big = places.filter(p => p.tier === "city" || p.tier === "town"), ratios = [];
  for (const a of big.slice(0, 200)) {
    const near = big.filter(b => b !== a).map(b => [b, Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1])]).sort((x, y) => x[1] - y[1]).slice(0, 3);
    S.run(a.cell, Infinity, new Set(near.map(([b]) => b.cell)));
    for (const [b, dd] of near) { if (!S.reached(b.cell)) continue; const pth = S.path(b.cell); if (pth.some(u => u >= N)) continue; let km = 0; const pts = rdp(pth.map(L.at), L.size * .5); for (let k = 1; k < pts.length; k++) km += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]) * ck / L.size; const st = dd * ck / L.size; if (st > ck * 2) ratios.push(km / st); }
  }
  ratios.sort((a, b) => a - b);
  // villages within a day's walk (about 30 km) of a market by road
  const towns = new Set(places.filter(p => p.tier === "town" || p.tier === "city").map(p => p.cell)), vill = places.filter(p => p.tier === "village");
  let inDay = 0; for (const v of vill) { S.run(v.cell, DAY * 1.2, towns); for (const t of towns) if (S.reached(t)) { inDay++; break; } }
  const cnt = k => out.marks.filter(m => m.k === k).length;
  const waterKm = out.water.reduce((s, w) => { let l = 0; for (let k = 1; k < w.pts.length; k++) l += Math.hypot(w.pts[k][0] - w.pts[k - 1][0], w.pts[k][1] - w.pts[k - 1][1]); return s + l * ck / L.size; }, 0);
  return {
    places: { cities: places.filter(p => p.tier === "city").length, towns: places.filter(p => p.tier === "town").length, villages: vill.length, story: places.filter(p => p.story).length, grew: places.filter(p => p.grew).length },
    km: Object.fromEntries(Object.entries(lenBy).map(([k, v]) => [k, Math.round(v)])), landKm2: Math.round(PL.landKm2),
    density: Math.round(total / PL.landKm2 * 10000) / 10000, mainShare: Math.round(main / Math.max(1, total) * 100) / 100,
    junctions: { three: j3, four: j4, ends, meanDegree: nodes ? Math.round(degSum / nodes * 100) / 100 : 0 },
    detour: ratios.length ? { median: Math.round(ratios[ratios.length >> 1] * 100) / 100, mean: Math.round(ratios.reduce((s, v) => s + v, 0) / ratios.length * 100) / 100, p90: Math.round(ratios[Math.floor(ratios.length * .9)] * 100) / 100, n: ratios.length } : null,
    villagesInDay: vill.length ? Math.round(inDay / vill.length * 100) / 100 : null,
    crossings: { bridge: cnt("bridge"), ford: cnt("ford"), ferry: cnt("ferry") }, passes: cnt("pass"), customs: cnt("customs"), waterKm: Math.round(waterKm)
  };
}

/* ---- one level of development: WD is the world as the page prepares it (A.worldKit.prepareWorld), BIO the biomes.
        opt.fixed: the default level's settlements, names and states, kept */
function oneLevel(WD, opt, BIO, log) {
  opt = Object.assign({ seed: 1, era: "medieval", level: DEFAULT_LEVEL }, opt || {});
  if (!WD.G) throw new Error("this world has no land to lay roads on (a star chart, or a drawing not yet traced)");
  opt.tech = TECH[opt.era] ? opt.era : ERA_TECH[String(opt.era).toLowerCase()] || "medieval";
  const rnd = mulberry32(opt.seed * 7 + 13), t0 = Date.now(), F = opt.fixed;
  const L = landOf(WD, BIO);
  if (log && !F) log(`  the land: ${L.cols} by ${L.rows} cells of ${Math.round(L.ck * 10) / 10} km; the age: ${TECH[opt.tech].name}`);
  const PL = settle(L, WD, opt, rnd);
  if (log && !F) log(`  settlements: ${PL.places.filter(p => p.tier === "city").length} cities, ${PL.places.filter(p => p.tier === "town").length} towns, ${PL.places.filter(p => p.tier === "village").length} villages (${PL.places.filter(p => p.story).length} of them the story's own)`);
  opt.rel = () => "wary";
  const NW = grow(L, PL, opt, rnd, F ? null : log);
  if (F) PL.places.forEach((p, i) => { p.name = F.names[i]; p.tier = F.tiers[i]; p.grew = F.grew[i]; });
  else {
    // names: the story's places keep theirs; the others are named for where they stand, a busy crossing for its ford or
    // its bridge, a pass town for its gate [Oxford: the town named after the ford]
    const name = namer(rnd, PL.places.map(p => p.name).filter(Boolean), TECH[opt.tech].scifi);
    for (const p of PL.places) {
      if (p.name) continue; let s = p.site;
      if (L.riv[p.cell] > 0 && NW.crossF[p.cell] > 1) s = NW.bridge[p.cell] ? "bridge" : fordable(L, p.cell) ? "ford" : s;
      if (p.tier !== "village" && s === "plain" && NW.through[p.ix] > 20) s = "market";
      if (L.hm[p.cell] > 900 && NW.through[p.ix] > 5) s = "pass";
      p.name = name(s);
    }
  }
  const out = lines(L, PL, NW, opt);
  out.routes = storyRoutes(L, PL, NW, WD);
  const stats = measure(L, PL, NW, out), LV = levelOf(opt.level, opt.tech);
  const states = (opt.states || []).map(s => ({ id: s.id, name: s.name, capital: PL.places[s.capital].id || PL.places[s.capital].name }));
  const rel = []; if (opt.relTable) for (const [k, v] of Object.entries(opt.relTable)) { const [a, b] = k.split(",").map(Number); rel.push(["s" + a, "s" + b, v]); }
  const placesOut = PL.places.map((p, i) => Object.assign({ id: p.id || "n" + i, name: p.name, at: p.at.map(r1), tier: p.tier, pop: Math.round(p.pop * 10) / 10, makes: p.makes, site: p.site }, p.story ? { story: 1 } : {}, p.dock ? { port: 1 } : {}, p.riverPort ? { river: 1 } : {}, p.grew ? { grew: 1 } : {}, NW.state[p.cell] >= 0 && opt.states ? { state: "s" + NW.state[p.cell] } : {}, p.seat != null ? { seat: 1 } : {}));
  const secs = Math.round((Date.now() - t0) / 100) / 10;
  return {
    common: { era: opt.tech, eraName: TECH[opt.tech].name, seed: opt.seed, cellKm: Math.round(L.ck * 100) / 100, places: placesOut, states, relations: rel, border: out.border },
    level: { name: LV.name, say: opt.level === DEFAULT_LEVEL ? TECH[opt.tech].name : LV.say, ages: NW.ageLog, roads: out.roads, water: out.water, marks: out.marks, routes: out.routes, stats, secs },
    fixed: F || { names: PL.places.map(p => p.name), tiers: PL.places.map(p => p.tier), grew: PL.places.map(p => !!p.grew), state: Int16Array.from(NW.state), states: opt.states || [], relTable: opt.relTable || {} }
  };
}
/* ---- the whole: the network at every level of development, the default first; the page's slider moves between them */
function roads(WD, opt, BIO, log) {
  const ref = oneLevel(WD, Object.assign({}, opt, { level: DEFAULT_LEVEL }), BIO, log), levels = { [DEFAULT_LEVEL]: ref.level };
  if (log) log(`    level ${DEFAULT_LEVEL} (${LEVELS[DEFAULT_LEVEL].name}, the default) in ${ref.level.secs} s`);
  for (const n of Object.keys(LEVELS).map(Number).filter(n => n !== DEFAULT_LEVEL && (!opt.levels || opt.levels.includes(n)))) {
    const r = oneLevel(WD, Object.assign({}, opt, { level: n, fixed: ref.fixed }), BIO, null); levels[n] = r.level;
    if (log) log(`    level ${n} (${LEVELS[n].name}) in ${r.level.secs} s`);
  }
  return Object.assign({ v: 2, level: DEFAULT_LEVEL }, ref.common, { levels });
}

module.exports = { roads, TECH, ORDERS, LEVELS, DEFAULT_LEVEL };
