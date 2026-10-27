/* Campaign Atlas: the land under a world map (atlas.js world). Writes the campaign's world-terrain.js:
     - the heights and the wetness of an invented land (a continent, islands, a coast or an inland country), or the
       nebulae of a star map;
     - its rivers, run down to the sea;
     - the names of its seas, mountain ranges and forests (world.js regions: first, then names made up for them);
     - where each location in world.js that has no at: [x, y] stands, chosen for what it is (a port on the coast, a
       city by a river, a mine in the mountains, a moon beside its planet);
     - while world.js has no routes of its own, the roads, passes and sea routes between its locations.
   The same seed makes the same land, so running it again after adding locations keeps the land and every location
   already placed. A campaign without world.js gets one to start from: a location for each of its cities. */
"use strict";
const fs = require("fs"), path = require("path");
const { mulberry32 } = require("./city-common.js");
const BIO = require("../engine/atlas-world-biomes.js");

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "place";
// (27 Oct 2026, the user: a world map is "really really really big" unless the story says otherwise: a new world is
// vast by default; a small land, a single coast or an island, is asked for by name)
const SIZES = { small: [800, 560], medium: [1000, 700], large: [1400, 980], huge: [1800, 1260], vast: [2600, 1820], world: [3600, 2520] };
const SEA_SHARE = { continent: .5, islands: .66, archipelago: .8, coast: .47, inland: .025 };

function noiseFn(seed) {
  const P = new Float32Array(4096), rnd = mulberry32(seed); for (let i = 0; i < 4096; i++) P[i] = rnd();
  const at = (i, j) => P[(Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) & 4095], sm = t => t * t * (3 - 2 * t);
  return (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = sm(x - i), v = sm(y - j), a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
}
const fbm = (n, x, y, oct) => { let s = 0, amp = 1, f = 1, tot = 0; for (let o = 0; o < oct; o++) { s += n(x * f + o * 17.3, y * f - o * 9.1) * amp; tot += amp; amp *= .5; f *= 2.03; } return s / tot; };
class Heap {
  constructor() { this.n = []; this.k = []; }
  get size() { return this.n.length; }
  push(n, k) { const N = this.n, K = this.k; N.push(n); K.push(k); let i = N.length - 1; while (i) { const q = (i - 1) >> 1; if (K[q] <= K[i]) break; [N[q], N[i]] = [N[i], N[q]]; [K[q], K[i]] = [K[i], K[q]]; i = q; } }
  pop() { const N = this.n, K = this.k, top = N[0], ln = N.pop(), lk = K.pop(); if (N.length) { N[0] = ln; K[0] = lk; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < N.length && K[l] < K[m]) m = l; if (r < N.length && K[r] < K[m]) m = r; if (m === i) break; [N[m], N[i]] = [N[i], N[m]]; [K[m], K[i]] = [K[i], K[m]]; i = m; } } return top; }
}

// ---- names for what the land has: the campaign's own first (world.js regions), then made-up ones in the same spirit
const ADJ = ["Grey", "Silver", "Sunken", "Amber", "Bitter", "Pale", "Whispering", "Shivering", "Drowned", "Iron", "Ashen", "Hollow", "Weeping", "Copper", "Black", "Last", "Long", "Thorn", "Raven", "Salt", "Frost", "Ember", "Gloam", "Starless"];
const SYL = [["Ash", "Bel", "Cor", "Dun", "El", "Fal", "Gar", "Hal", "Is", "Kel", "Lor", "Mor", "Nar", "Or", "Pel", "Ra", "Sar", "Tor", "Ul", "Var", "Wen", "Yr", "Bran", "Cael", "Dra", "Eth"], ["", "", "a", "e", "o", "an", "en", "ar", "or", "eth", "im", "ul"], ["dor", "mere", "wyn", "holt", "mar", "rin", "dell", "gard", "more", "vale", "thas", "lor", "mund", "ric"]];
function namer(rnd, own) {
  const used = new Set(), pick = a => a[Math.floor(rnd() * a.length)];
  const word = () => { for (let g = 0; g < 50; g++) { const w = pick(SYL[0]) + pick(SYL[1]) + pick(SYL[2]); if (!used.has(w) && w.length < 11) { used.add(w); return w; } } return pick(SYL[0]) + pick(SYL[2]); };
  const mine = {}; for (const r of own || []) if (r && r.name) (mine[r.kind || "region"] = mine[r.kind || "region"] || []).push(r);
  const KIND_SAYS = { sea: ["sea", "ocean", "bay", "gulf", "sound", "strait"], range: ["range", "mountains", "hills", "peaks"], forest: ["forest", "wood", "woods", "weald"], lake: ["lake", "mere"], nebula: ["nebula", "cloud"],
    desert: ["desert", "waste", "sands", "dunes", "badlands"], swamp: ["swamp", "marsh", "fen", "bog", "mire", "wetland"], glacier: ["glacier", "ice", "icefield"], volcano: ["volcano", "mount", "peak"], wood: ["wood", "grove", "enchanted"], blight: ["blight", "wasteland", "corruption"] };
  const own_ = kind => { for (const [k, list] of Object.entries(mine)) if ((KIND_SAYS[kind] || [kind]).includes(k) && list.length) return list.shift().name; return null; };
  return {
    sea: (big, auto) => own_("sea") || (auto ? `The ${pick(ADJ)} ${big ? pick(["Sea", "Sea", "Ocean", "Deep"]) : pick(["Bay", "Gulf", "Sound", "Sea"])}` : null),
    lake: auto => own_("lake") || (auto ? (rnd() < .5 ? `Lake ${word()}` : `${word()} Mere`) : null),
    range: auto => own_("range") || (auto ? (rnd() < .5 ? `The ${word()} ${pick(["Mountains", "Peaks", "Heights"])}` : `The ${pick(ADJ)} ${pick(["Spine", "Teeth", "Crags", "Mountains"])}`) : null),
    forest: auto => own_("forest") || (auto ? `The ${rnd() < .5 ? word() : pick(ADJ)} ${pick(["Wood", "Forest", "Weald", "Holt"])}` : null),
    nebula: auto => own_("nebula") || (auto ? `The ${pick(ADJ)} ${pick(["Nebula", "Cloud", "Drift", "Veil"])}` : null),
    desert: (auto, alien) => own_("desert") || (auto ? (alien ? `The ${pick(["Glass", "Rust", "Ash", "Violet", "Singing", "Burning"])} ${pick(["Flats", "Expanse", "Sands", "Barrens"])}` : rnd() < .5 ? `The ${word()} ${pick(["Waste", "Sands", "Desert"])}` : `The ${pick(ADJ)} ${pick(["Sands", "Waste", "Dunes", "Barrens"])}`) : null),
    swamp: auto => own_("swamp") || (auto ? `The ${rnd() < .5 ? word() : pick(ADJ)} ${pick(["Fens", "Mire", "Marshes", "Bog", "Wetlands"])}` : null),
    glacier: auto => own_("glacier") || (auto ? `The ${rnd() < .5 ? word() : pick(ADJ)} ${pick(["Ice", "Glacier", "Icefield"])}` : null),
    volcano: auto => own_("volcano") || (auto ? `Mount ${word()}` : null),
    wood: (auto, kind) => own_("wood") || (auto ? ({ enchanted: `The ${pick(["Witch", "Elder", "Silver", "Dream", "Faerie"])}wood`, glowforest: `The ${pick(["Lantern", "Ember", "Star", "Moon"])} Grove`, mushrooms: `The ${pick(["Spore", "Cap", "Gill"])}wood`, corrupted: `The ${pick(["Blighted", "Rotting", "Thorn", "Hollow"])} Wood`, floating: `The ${pick(["Drifting", "Hanging", "Sky"])} Isles` }[kind] || `The ${word()} Wood`) : null),
    blight: (auto, kind) => own_("blight") || (auto ? (kind === "vale" ? `The Vale of ${word()}` : `The ${pick(["Blight", "Scar", "Ruin", "Shatterlands", "Withering"])}`) : null),
    leftover: () => Object.values(mine).flat()
  };
}

// what a location's kind asks of the ground it stands on
const WANTS = {
  capital: "settle", city: "settle", town: "settle", port: "port", village: "village", hamlet: "village", farm: "village", manor: "village", inn: "village",
  castle: "hill", keep: "hill", fort: "hill", tower: "hill", base: "hill", camp: "any", monastery: "hill",
  mine: "high", cave: "high", lair: "high", dungeon: "high", ruin: "wild", grove: "wild", stones: "wild", temple: "wild", shrine: "wild", battlefield: "wild", landmark: "wild", bridge: "river", site: "wild",
  lighthouse: "coastal", wreck: "coastal", airport: "settle", station: "settle"
};
const SETTLED = new Set(["capital", "city", "town", "village", "hamlet", "port", "castle", "keep", "fort", "manor", "farm", "inn", "monastery", "camp", "base", "airport", "station"]);

/* ---- the land */
function makeLand(o) {
  const { cols, rows, seed, land } = o, N = cols * rows, n1 = noiseFn(seed), n2 = noiseFn(seed + 1), n3 = noiseFn(seed + 2), n4 = noiseFn(seed + 3), rnd = mulberry32(seed + 9);
  const asp = cols / rows, raw = new Float32Array(N);
  const isles = []; if (land === "islands") { const k = 5 + Math.floor(rnd() * 4); for (let q = 0; q < k; q++) isles.push([.14 + rnd() * .72, .14 + rnd() * .72, .1 + rnd() * .13]); }
  // an archipelago: island chains, strung along two or three arcs, with a few strays
  if (land === "archipelago") { const arcs = 2 + Math.floor(rnd() * 2); for (let a = 0; a < arcs; a++) { let x = .12 + rnd() * .76, y = .12 + rnd() * .76, ang = rnd() * 6.283; const k = 7 + Math.floor(rnd() * 7); for (let q = 0; q < k; q++) { isles.push([x, y, .028 + rnd() * .05]); ang += (rnd() - .5) * .9; x = Math.min(.92, Math.max(.08, x + Math.cos(ang) * .07)); y = Math.min(.92, Math.max(.08, y + Math.sin(ang) * .07)); } } for (let q = 0; q < 5; q++) isles.push([.1 + rnd() * .8, .1 + rnd() * .8, .02 + rnd() * .03]); }
  const side = Math.floor(rnd() * 4);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + .5) / cols, y = (j + .5) / rows, e = fbm(n1, x * 3.2 * asp, y * 3.2, 6);
    const wx = (fbm(n2, x * 2.2 * asp + 5, y * 2.2, 3) - .5) * .5, wy = (fbm(n2, x * 2.2 * asp - 7, y * 2.2 + 3, 3) - .5) * .5;
    let m;
    if (land === "islands" || land === "archipelago") { m = 0; for (const [cx, cy, r] of isles) { const d = Math.hypot((x + wx * .6 - cx) * asp * .8, y + wy * .6 - cy) / r; m = Math.max(m, 1 - d * d); } m = Math.max(-.6, m); }
    else if (land === "coast") { const s = [x, 1 - x, y, 1 - y][side]; m = (s + wx * .7 - .45) * 2.2; }
    else if (land === "inland") m = .6;
    else { const dx = (x - .5) * 2 + wx, dy = (y - .5) * 2 + wy, d = Math.sqrt(dx * dx * .85 + dy * dy * 1.15); m = 1 - Math.pow(d, 1.7); }
    const r = 1 - Math.abs(fbm(n3, x * 4.6 * asp, y * 4.6, 4) * 2 - 1);
    raw[j * cols + i] = e * .55 + m * .55 + Math.pow(r, 2.6) * .3 * Math.max(0, Math.min(1, m + .35));
  }
  // the sea fills the lowest share of the sheet
  const sorted = Float32Array.from(raw).sort(), share = o.seaShare != null ? o.seaShare : SEA_SHARE[land] || .5;
  const q = sorted[Math.min(N - 1, Math.floor(N * share))], lo = sorted[0], hi = sorted[N - 1], H = new Uint8Array(N);
  for (let n = 0; n < N; n++) { const v = raw[n]; H[n] = v <= q ? Math.round((v - lo) / Math.max(1e-6, q - lo) * 127) : 129 + Math.round(Math.pow((v - q) / Math.max(1e-6, hi - q), 1.3) * 126); }
  // wetness: weather from the noise, and the sea's breath near the coast
  const coast = distance(cols, rows, n => H[n] <= 128), Mo = new Uint8Array(N);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const n = j * cols + i, x = (i + .5) / cols, y = (j + .5) / rows, w = fbm(n4, x * 2.6 * asp, y * 2.6, 5) * .85 + Math.exp(-coast[n] / 14) * .3 - (H[n] > 200 ? .12 : 0); Mo[n] = Math.max(0, Math.min(255, Math.round((w - .1) * 255))); }
  return { H, M: Mo, coast };
}
// cells away from the nearest cell that is(n) (8-way, in cells)
function distance(cols, rows, is) {
  const N = cols * rows, D = new Float32Array(N).fill(1e9), q = [];
  for (let n = 0; n < N; n++) if (is(n)) { D[n] = 0; q.push(n); }
  for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const I = i + di, J = j + dj; if (I < 0 || J < 0 || I >= cols || J >= rows) continue; const m = J * cols + I; if (D[m] > D[n] + 1) { D[m] = D[n] + 1; q.push(m); } } }
  return D;
}
// rivers: the land drains to the sea (or off the sheet) the way water would, filling hollows; where enough water has
// gathered, a river runs
function makeRivers(o, L) {
  const { cols, rows, cell } = o, N = cols * rows, H = L.H, parent = new Int32Array(N).fill(-1), seen = new Uint8Array(N), order = [], hp = new Heap(), filled = new Float32Array(N);
  // (a world made by its geology: its lakes fill and spill, so rivers run on out of them to the sea; only the sea, and the
  // map's edge, take the water in)
  let isSea = n => H[n] <= 128;
  if (o.lakesFlow) { const oc = new Uint8Array(N), st = []; for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (H[n] <= 128 && (!i || !j || i === cols - 1 || j === rows - 1)) { oc[n] = 1; st.push(n); } } while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && !oc[m] && H[m] <= 128) { oc[m] = 1; st.push(m); } } isSea = n => oc[n] === 1; }
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (isSea(n) || i === 0 || j === 0 || i === cols - 1 || j === rows - 1) { seen[n] = 1; filled[n] = H[n]; hp.push(n, H[n]); } }
  while (hp.size) {
    const c = hp.pop(); order.push(c); const i = c % cols, j = (c / cols) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const I = i + di, J = j + dj; if (I < 0 || J < 0 || I >= cols || J >= rows) continue; const m = J * cols + I; if (seen[m]) continue; seen[m] = 1; filled[m] = Math.max(H[m], filled[c] + .01); parent[m] = c; hp.push(m, filled[m]); }
  }
  const acc = new Float32Array(N), wf = o.wetf || 1; for (let n = 0; n < N; n++) acc[n] = H[n] > 128 ? .5 + L.M[n] / 255 * wf : 0;
  for (let k = order.length - 1; k >= 0; k--) { const c = order[k], p = parent[c]; if (p >= 0) acc[p] += acc[c]; }
  const T = Math.max(40, o.lakesFlow ? Math.min(N * .0038, 330) : N * .0065), river = n => H[n] > 128 && acc[n] >= T, fed = new Uint8Array(N);
  for (let n = 0; n < N; n++) if (river(n) && parent[n] >= 0) fed[parent[n]] = 1;
  const done = new Uint8Array(N), out = [], mask = new Uint8Array(N);
  const heads0 = []; for (let n = 0; n < N; n++) if (river(n) && !fed[n]) heads0.push(n);
  // every river rises in the mountains or the high hills, as rivers do (the user, 27 Oct 2026): from where enough water
  // has gathered, its course is followed up its catchment, cell by cell, toward the highest ground that drains into it,
  // to where it springs; a river whose catchment holds no high ground at all is not drawn
  const kids = new Int32Array(N).fill(-1), next = new Int32Array(N).fill(-1);
  for (let n = 0; n < N; n++) { const p = parent[n]; if (p >= 0) { next[n] = kids[p]; kids[p] = n; } }
  const maxUp = new Float32Array(N); for (let n = 0; n < N; n++) maxUp[n] = H[n];
  for (let k = order.length - 1; k >= 0; k--) { const c = order[k], p = parent[c]; if (p >= 0 && maxUp[c] > maxUp[p]) maxUp[p] = maxUp[c]; }
  const landH = []; for (let n = 0; n < N; n++) if (H[n] > 128) landH.push(H[n]); landH.sort((a, b) => a - b);
  const SRC = Math.min(198, landH.length ? landH[Math.floor(landH.length * .92)] : 198), HILLS = Math.min(175, landH.length ? landH[Math.floor(landH.length * .8)] : 175);
  const spring = h => {
    const up = []; let n = h;
    for (let g = 0; g < N && H[n] < SRC; g++) {
      let best = -1; for (let c = kids[n]; c >= 0; c = next[c]) if (H[c] > 128 && (best < 0 || maxUp[c] > maxUp[best] || (maxUp[c] === maxUp[best] && acc[c] > acc[best]))) best = c;
      if (best < 0) break; up.push(best); n = best;
    }
    return up.reverse();
  };
  const heads = heads0.filter(h => maxUp[h] >= HILLS);
  heads.sort((a, b) => acc[b] - acc[a]);
  for (const h of heads) {
    // (the stretch above where it gathers, from its spring down; then on down to the sea as before)
    const up = spring(h); for (const m of up) { mask[m] = 1; done[m] = 1; }
    const pts = up.slice(); let n = h, last = h;
    for (let g = 0; g < N; g++) {
      pts.push(n); mask[n] = 1; last = n;
      if (done[n] && n !== h) break; done[n] = 1;
      const p = parent[n]; if (p < 0) break;
      if (H[p] <= 128) { pts.push(p); break; }
      n = p;
    }
    if (pts.length < 10) continue;
    const xy = pts.map(m => [((m % cols) + .5) * cell, (((m / cols) | 0) + .5) * cell]);
    out.push({ pts: smooth(simplify(xy, cell * .6), 2).map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]), w: Math.round((.7 + .5 * Math.log2(acc[last] / T + 1)) * 10) / 10 });
  }
  return { rivers: out, mask };
}
function simplify(p, eps) {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let best = -1, bd = eps; const [x1, y1] = p[a], [x2, y2] = p[b], L = Math.hypot(x2 - x1, y2 - y1) || 1; for (let i = a + 1; i < b; i++) { const d = Math.abs((x2 - x1) * (y1 - p[i][1]) - (x1 - p[i][0]) * (y2 - y1)) / L; if (d > bd) { bd = d; best = i; } } if (best > 0) { keep[best] = 1; st.push([a, best], [best, b]); } }
  return p.filter((_, i) => keep[i]);
}
function smooth(p, n) { for (let k = 0; k < n; k++) { const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } o.push(p[p.length - 1]); p = o; } return p; }

// the land's features as patches of cells: each sea, lake, range and forest, with where its name goes
function patches(cols, rows, is, eight) {
  const N = cols * rows, id = new Int32Array(N).fill(-1), out = [];
  for (let n = 0; n < N; n++) {
    if (id[n] >= 0 || !is(n)) continue;
    const cells = [n], k = out.length; id[n] = k; let edge = false;
    for (let h = 0; h < cells.length; h++) {
      const c = cells[h], i = c % cols, j = (c / cols) | 0; if (!i || !j || i === cols - 1 || j === rows - 1) edge = true;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!eight && di && dj) continue; const I = i + di, J = j + dj; if (I < 0 || J < 0 || I >= cols || J >= rows) continue; const m = J * cols + I; if (id[m] < 0 && is(m)) { id[m] = k; cells.push(m); } }
    }
    out.push({ cells, edge });
  }
  return out;
}
function labelOf(p, cols, cell, best) {
  let sx = 0, sy = 0; for (const c of p.cells) { sx += c % cols; sy += (c / cols) | 0; }
  const mx = sx / p.cells.length, my = sy / p.cells.length;
  let xx = 0, yy = 0, xy = 0; for (const c of p.cells) { const dx = c % cols - mx, dy = ((c / cols) | 0) - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
  let ang = .5 * Math.atan2(2 * xy, xx - yy) * 180 / Math.PI; ang = Math.max(-32, Math.min(32, ang));
  // the label stands on the patch: its deepest cell, or the cell nearest its middle
  let at = best != null ? best : p.cells.reduce((b, c) => { const d = (c % cols - mx) ** 2 + (((c / cols) | 0) - my) ** 2; return d < b[0] ? [d, c] : b; }, [1e18, p.cells[0]])[1];
  return { at: [Math.round(((at % cols) + .5) * cell), Math.round((((at / cols) | 0) + .5) * cell)], angle: Math.round(ang) };
}

/* ---- the climate's work on the land (27 Oct 2026, the user's request for far more terrain: engine/atlas-world-biomes.js
        says what each kind of land is) */
// the warmth of a cell (the page works it out the same way, from the world's climate)
const warmthAt = (o, L, n) => BIO.warmth(o.climate, (((n / o.cols) | 0) + .5) / o.rows, Math.max(0, (L.H[n] - 128) / 127));
// fjords: on a cold coast under mountains the sea runs far inland up narrow valleys the ice once carved
function carveFjords(o, L, rnd) {
  const { cols, rows } = o, N = cols * rows, H = L.H, high = distance(cols, rows, n => H[n] > 128 + 127 * .38), starts = [];
  for (let n = 0; n < N; n++) if (H[n] > 128 && L.coast[n] === 1 && high[n] < 9 && warmthAt(o, L, n) < .3 && rnd() < .06) starts.push(n);
  const kept = []; for (const n of starts.sort(() => rnd() - .5)) if (kept.every(m => Math.hypot(m % cols - n % cols, ((m / cols) | 0) - ((n / cols) | 0)) > 9) && kept.length < 18) kept.push(n);
  for (const s of kept) {
    let n = s, len = 8 + Math.floor(rnd() * 18), dir = null;
    for (let g = 0; g < len; g++) {
      H[n] = Math.min(H[n], 118); const i = n % cols, j = (n / cols) | 0;
      // up the valley: away from the sea, along the low ground, the way wandering a little
      let best = -1, bs = -1e9;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const I = i + di, J = j + dj; if (I < 1 || J < 1 || I >= cols - 1 || J >= rows - 1) continue; const m = J * cols + I; if (H[m] <= 128) continue;
        const sc = L.coast[m] * 2 - (H[m] - 128) / 40 + (dir && dir[0] === di && dir[1] === dj ? 1.5 : 0) + rnd() * 1.2; if (sc > bs) { bs = sc; best = m; dir = [di, dj]; }
      }
      if (best < 0) break; n = best;
    }
  }
  if (kept.length) L.coast = distance(cols, rows, n => H[n] <= 128);
  return kept.length;
}
// the regions a world gets by itself: glaciers on cold heights, volcanoes and their ash, mesas and badlands in the dry
// heat, canyons where rivers cut a dry plateau, salt flats in desert basins, floodplains, reefs on warm shallow coasts, a
// crater; in fantasy enchanted, corrupted and mushroom woods, floating mountains and a glowing lake; on an alien planet
// all of its land made strange. Each is a patch of cells with a ragged edge, never a scattered icon.
function makeCover(o, L, R, rnd, log) {
  const { cols, rows, setting } = o, N = cols * rows, H = L.H, C = new Uint8Array(N), B = BIO.CODE, made = {};
  const nz = noiseFn(o.seed + 31), nz2 = noiseFn(o.seed + 37), th = n => (H[n] - 128) / 127, land = n => H[n] > 128;
  const I = n => n % cols, J = n => (n / cols) | 0, T = new Float32Array(N), Wt = new Float32Array(N), NAT = new Uint8Array(N);
  // (with the ecology, each cell's warmth, wetness and biome are what it worked out; without it, the climate's guess)
  const eco = L.eco;
  for (let n = 0; n < N; n++) { T[n] = eco ? Math.max(0, Math.min(1, (eco.T[n] + 15) / 45)) : warmthAt(o, L, n); Wt[n] = o.rain ? L.M[n] / 255 : BIO.wetness(o.climate, L.M[n]); NAT[n] = land(n) ? (eco && eco.biome[n] ? eco.biome[n] : BIO.natural(T[n], Wt[n], Math.max(0, th(n)))) : 0; }
  const put = (n, id) => { C[n] = B[id]; made[id] = (made[id] || 0) + 1; };
  // a region grows from a cell over the land that suits it (ok), the way a wood or a lava field spreads: cheapest first,
  // the cost rising with the noise and with every climb or drop, so it follows valleys, slopes and the woods already
  // there, and its edge is ragged as a coast is, never a circle; size: about how many cells
  const grow = (c, size, id, ok, rough) => {
    const hp = new Heap(), dist = new Float32Array(N).fill(1e9), done = new Uint8Array(N); let k = 0; rough = rough == null ? 1 : rough;
    dist[c] = 0; hp.push(c, 0);
    while (hp.size && k < size) {
      const n = hp.pop(); if (done[n]) continue; done[n] = 1; put(n, id); k++;
      const i = I(n), j = J(n);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (done[m] || !ok(m)) continue;
        const d = dist[n] + Math.hypot(di, dj) * (1 + nz(a / 5 + id.length, b / 5) * 2.4 * rough + nz2(a / 1.7, b / 1.7) * .8 * rough) + Math.abs(H[m] - H[n]) / 5;
        if (d < dist[m]) { dist[m] = d; hp.push(m, d); }
      }
    }
    return k;
  };
  const blob = (c, r, id, ok) => grow(c, Math.round(Math.PI * r * r * .8), id, ok || land);
  const pick = (ok, far) => { const c = []; for (let n = 0; n < N; n += 1 + Math.floor(rnd() * 5)) if (ok(n)) c.push(n); if (!c.length) return -1; for (let g = 0; g < 40; g++) { const n = c[Math.floor(rnd() * c.length)]; if (!far || far(n)) return n; } return -1; };
  const awayFrom = (list, d) => n => list.every(m => Math.hypot(I(m) - I(n), J(m) - J(n)) > d);
  const forestish = n => [B.temperate, B.boreal, B.rainforest, B.cloud, B.swampforest].includes(NAT[n]);
  const alien = setting === "scifi", landN = H.reduce((s, v) => s + (v > 128 ? 1 : 0), 0);
  // glaciers: the coldest heights, and the ice running down from them into the valleys below (with the ecology: the
  // permanent ice it found on the mountains, where the warmest month stays near freezing)
  if (eco) { /* (the ecology's own snow and ice is the glacier: nothing laid over it) */ }
  else for (let n = 0; n < N; n++) if (land(n) && ((th(n) > .6 && T[n] < .13) || (th(n) > .36 && T[n] < .05))) put(n, "glacier");
  if (!eco) for (let n = 0; n < N; n++) if (C[n] === B.glacier) { let m = n; for (let g = 0; g < 10; g++) { let low = -1; const i = I(m), j = J(m); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const q = b * cols + a; if (land(q) && H[q] < H[m] && (low < 0 || H[q] < H[low])) low = q; } if (low < 0 || T[low] > .16 || th(low) < .4) break; if (!C[low]) put(low, "glacier"); m = low; } }
  // volcanoes: seldom; a peak near the sea or at the end of a range becomes a cone, its old lava and ash spread down
  // its slopes (the land round it a volcanic field, grown downhill)
  const peaks = []; for (let n = 0; n < N; n++) { if (!land(n) || th(n) < .5 || C[n]) continue; let top = true; const i = I(n), j = J(n); for (let dj = -3; dj <= 3 && top; dj++) for (let di = -3; di <= 3; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < cols && b < rows && H[b * cols + a] > H[n]) { top = false; break; } } if (top) peaks.push(n); }
  // (with geology the volcanoes are where the plates put them: arcs over sinking oceans, rifts, hotspots)
  const nV = o.geo ? o.geo.volcanoes.length : alien && o.planet === "volcanic" ? 6 : (rnd() < .38 ? 1 : 0) + (setting === "fantasy" && rnd() < .15 ? 1 : 0), vols = [];
  const vCands = o.geo ? o.geo.volcanoes.slice() : peaks.sort((a, b) => (L.coast[a] + rnd() * 30) - (L.coast[b] + rnd() * 30));
  for (const n of vCands) { if (vols.length >= nV) break; if (!awayFrom(vols, 40)(n)) continue; vols.push(n);
    const r = 4 + Math.floor(rnd() * 3), top = Math.min(255, H[n] + 12);
    for (let j = Math.max(0, J(n) - r * 3); j <= Math.min(rows - 1, J(n) + r * 3); j++) for (let i = Math.max(0, I(n) - r * 3); i <= Math.min(cols - 1, I(n) + r * 3); i++) { const m = j * cols + i, d = Math.hypot(i - I(n), j - J(n)) + (nz(i / 3, j / 3) - .5) * 2; if (d < r * 2.4 && land(m)) H[m] = Math.max(H[m], Math.round(top - d * (top - 150) / (r * 2.4))); }
    if (!eco) grow(n, Math.round(r * r * 7), "volcanic", m => land(m) && !C[m] && H[m] <= H[n] + 12, 1.3); grow(n, Math.round(r * r * 1.6), "volcano", land, .3); }
  // the dry heat: tablelands of mesas where the land is high, badlands broken round them; canyons only where a river
  // cuts through them (a desert needs room for all this: a small one keeps to its sand and stone)
  const dryHot = n => land(n) && T[n] > .55 && Wt[n] < .26 && th(n) > .06 && th(n) < .55 && !C[n];
  let dryN = 0; for (let n = 0; n < N; n++) if (dryHot(n)) dryN++;
  if (eco && false) {
    // with the ecology, each by what makes it: badlands where dry land is cut into steep slopes; mesas where a dry
    // upland is flat on top and falls away sharply on a side (a cap of hard rock over softer); canyons where a big river
    // cuts down through a dry upland
    const KOPB = n => require("./world-ecology.js").KOP[eco.kop[n]][0] === "B";
    const sl = n => { const i = I(n), j = J(n); let mx = 0, mn = 1e9; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const d = H[b * cols + a] - H[n]; mx = Math.max(mx, -d); mn = Math.min(mn, Math.abs(d)); } return [mx, mn]; };
    const accBig = Math.max(30, N * .0025);
    for (let n = 0; n < N; n++) {
      if (!land(n) || C[n] || !KOPB(n) || th(n) < .05 || th(n) > .5) continue;
      const [drop, flat] = sl(n);
      if (eco.acc[n] > accBig * 3 && th(n) > .12) put(n, "canyon");
      else if (drop >= 6 && flat <= 1 && th(n) > .15) put(n, "mesas");
      else if (drop >= 3) put(n, "badlands");
    }
  } else if (!eco && dryN > landN * .04) {
    for (let n = 0; n < N; n++) { if (!dryHot(n)) continue; const v = nz2(I(n) / 13, J(n) / 13); if (v > .72 && th(n) > .2) put(n, "mesas"); else if (v > .65) put(n, "badlands"); }
    for (let n = 0; n < N; n++) if (R.mask[n] && land(n) && (C[n] === B.mesas || C[n] === B.badlands || (dryHot(n) && th(n) > .2))) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = I(n) + di, b = J(n) + dj; if (a >= 0 && b >= 0 && a < cols && b < rows && land(b * cols + a) && (!di && !dj || nz(a / 2, b / 2) > .45)) put(b * cols + a, "canyon"); }
  }
  // the basins the geology found too dry to hold a lake: salt pans
  if (o.geo && !eco) for (const n of o.geo.playa) if (land(n) && !C[n]) put(n, T[n] > .5 ? "saltflat" : "drylake");
  // salt flats and dry lakebeds in the lowest basins of a real desert, far from the sea
  for (let n = 0; n < N; n++) if (!eco && land(n) && Wt[n] < .14 && th(n) < .16 && L.coast[n] > 12 && !C[n] && nz2(I(n) / 6 + 30, J(n) / 6) > .72) put(n, T[n] > .55 ? "saltflat" : "drylake");
  // floodplains along the great rivers of the wet lowland
  for (let n = 0; n < N; n++) if (!eco && R.mask[n] && land(n) && th(n) < .07 && Wt[n] > .4 && !alien) for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const a = I(n) + di, b = J(n) + dj, m = b * cols + a; if (a >= 0 && b >= 0 && a < cols && b < rows && land(m) && !C[m] && th(m) < .08 && nz(a / 3 + 9, b / 3) > .5) put(m, "floodplain"); }
  // reefs: only in tropical seas, on the shallow shelf off the coast
  for (let n = 0; n < N; n++) if (!land(n) && H[n] > 118 && L.coast[n] >= 2 && L.coast[n] <= 5 && T[n] > .74 && nz(I(n) / 4 + 50, J(n) / 4) > .58) put(n, "reef");
  // sinkholes now and then in the green hills, a crater seldom (many on a barren world)
  if (!alien && !eco && rnd() < .2) { const c = pick(n => land(n) && th(n) > .18 && th(n) < .45 && Wt[n] > .3 && Wt[n] < .65 && !C[n]); if (c >= 0) blob(c, 4 + Math.floor(rnd() * 3), "sinkholes", n => land(n) && !C[n] && th(n) > .12); }
  const nC = alien ? 2 + Math.floor(rnd() * (o.planet === "barren" ? 6 : 3)) : !eco && rnd() < .12 ? 1 : 0, craters = [];
  for (let k = 0; k < nC; k++) { const c = pick(n => land(n) && th(n) < .5 && !C[n] && L.coast[n] > 6, awayFrom(craters, 20)); if (c < 0) break; craters.push(c); const r = 3 + Math.floor(rnd() * (alien ? 7 : 5));
    for (let j = Math.max(0, J(c) - r - 2); j <= Math.min(rows - 1, J(c) + r + 2); j++) for (let i = Math.max(0, I(c) - r - 2); i <= Math.min(cols - 1, I(c) + r + 2); i++) { const m = j * cols + i, d = Math.hypot(i - I(c), j - J(c)) / r; if (!land(m) || d > 1.15) continue; if (d < 1) put(m, "crater"); H[m] = Math.max(129, Math.min(255, Math.round(H[m] + (d < .8 ? -10 * (1 - d / .8) : d < 1.1 ? 9 : 0)))); } }
  const lore = [];
  if (setting === "fantasy" && eco) {
    // (27 Oct 2026, the user: fantasy places "intentional and explainable through the world's lore or environmental
    // rules"): each where a rule puts it, and the rule kept with it (lore) for the game master
    const SB = eco.biome, at = n => [I(n), J(n)], inB = (n, k) => land(n) && SB[n] === B[k] && !C[n], placed = [];
    const depthIn = k => distance(cols, rows, n => !inB(n, k));
    // a spread from one cell that runs downhill and along rivers easily, uphill hardly at all
    const seep = (c, size, id, ok) => { const hp = new Heap(), dist = new Float32Array(N).fill(1e9), done = new Uint8Array(N); let k = 0; dist[c] = 0; hp.push(c, 0);
      while (hp.size && k < size) { const n = hp.pop(); if (done[n]) continue; done[n] = 1; put(n, id); k++; const i = I(n), j = J(n);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (done[m] || !ok(m)) continue; const d = dist[n] + Math.hypot(di, dj) * (1 + Math.max(0, H[m] - H[n]) * 1.5 - (R.mask[m] ? .6 : 0)); if (d < dist[m]) { dist[m] = d; hp.push(m, d); } } }
      return k; };
    // the enchanted wood: the deepest, wettest heart of the greatest forest (the cell farthest inside it, and wet)
    if (rnd() < .75) { const d = depthIn("forest"); let best = -1, bs = 0; for (let n = 0; n < N; n++) if (inB(n, "forest")) { const sc = d[n] + Wt[n] * 4; if (sc > bs) { bs = sc; best = n; } }
      if (best >= 0 && d[best] >= 4) { grow(best, 150 + d[best] * 22, "enchanted", m => inB(m, "forest"), .6); placed.push(best); lore.push({ kind: "enchanted", at: at(best), why: "the oldest, wettest heart of the greatest forest, farthest from its edges" });
        if (rnd() < .4) { grow(best, 45, "glowforest", m => C[m] === B.enchanted, .5); lore.push({ kind: "glowforest", at: at(best), why: "at the enchanted wood's very centre" }); } } }
    // the corruption: it seeps from a volcano (the world's wound) down its valleys and along its rivers; the woods it
    // reaches twist
    if (vols.length && rnd() < .45) { const src = vols[Math.floor(rnd() * vols.length)]; seep(src, 260 + Math.floor(rnd() * 260), "corruptland", m => land(m) && !C[m] && th(m) < .6); for (let n = 0; n < N; n++) if (C[n] === B.corruptland && SB[n] === B.forest) put(n, "corrupted"); placed.push(src); lore.push({ kind: "corruptland", at: at(src), why: "seeping from the volcano down its valleys and along its rivers" }); }
    // giant mushrooms: where a swamp meets the forest in the warm, wet lowland (dark, still and rotting)
    if (rnd() < .4) { let best = -1, bs = -1e9; for (let n = 0; n < N; n++) { if (!inB(n, "forest") || th(n) > .15) continue; let sw = 0; const i = I(n), j = J(n); for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < cols && b < rows && SB[b * cols + a] === B.swamp) sw++; } if (!sw) continue; const sc = sw + T[n] * 6 + Wt[n] * 3; if (sc > bs && placed.every(p => Math.hypot(I(p) - i, J(p) - j) > 25)) { bs = sc; best = n; } }
      if (best >= 0) { grow(best, 90 + Math.floor(rnd() * 90), "mushrooms", m => land(m) && (SB[m] === B.forest || SB[m] === B.swamp) && !C[m], .7); placed.push(best); lore.push({ kind: "mushrooms", at: at(best), why: "where the swamp meets the forest in the warm, wet lowland" }); } }
    // floating mountains: beside the world's highest peak, where the land strains most toward the sky
    if (rnd() < .3) { let top = -1; for (let n = 0; n < N; n++) if (land(n) && (top < 0 || H[n] > H[top])) top = n; if (top >= 0) { grow(top, 70 + Math.floor(rnd() * 60), "floating", m => land(m) && !C[m] && th(m) > .35, .8); placed.push(top); lore.push({ kind: "floating", at: at(top), why: "about the world's highest peak" }); } }
    // a hidden vale: the flat land most closely ringed by mountains
    if (rnd() < .3) { let best = -1, bs = 0; for (let n = 0; n < N; n += 2) { if (!inB(n, "plains")) continue; let ring = 0, c = 0; const i = I(n), j = J(n); for (let k = 0; k < 16; k++) { const a = Math.round(i + Math.cos(k / 16 * 6.283) * 9), b = Math.round(j + Math.sin(k / 16 * 6.283) * 9); if (a < 0 || b < 0 || a >= cols || b >= rows) continue; c++; if (th(b * cols + a) > th(n) + .15) ring++; } const sc = ring / Math.max(1, c); if (sc > bs && sc > .6 && placed.every(p => Math.hypot(I(p) - i, J(p) - j) > 25)) { bs = sc; best = n; } }
      if (best >= 0) { grow(best, 70 + Math.floor(rnd() * 60), "vale", m => inB(m, "plains"), .6); lore.push({ kind: "vale", at: at(best), why: "flat land closely ringed by mountains, hidden from the world" }); } }
  } else if (setting === "fantasy") {
    // fantasy's own places, each seldom and where it belongs: an enchanted wood grown inside an old forest (and, rarer,
    // glowing trees at its heart); a corruption spreading from one place over the land and its woods; giant mushrooms
    // in a wet, low forest; floating mountains off the end of a range; a wasteland in dry country; a hidden vale
    const places = [], inForest = n => land(n) && !C[n] && forestish(n) && th(n) < .5;
    if (rnd() < .6) { const c = pick(n => inForest(n) && L.coast[n] > 4); if (c >= 0) { places.push(c); grow(c, 260 + Math.floor(rnd() * 420), "enchanted", inForest); if (rnd() < .35) grow(c, 40 + Math.floor(rnd() * 60), "glowforest", n => C[n] === B.enchanted); } }
    if (rnd() < .3) { const c = pick(n => land(n) && th(n) < .4 && !C[n] && L.coast[n] > 6, awayFrom(places, 35)); if (c >= 0) { places.push(c); const k = grow(c, 220 + Math.floor(rnd() * 320), "corruptland", n => land(n) && !C[n] && th(n) < .55, 1.4); for (let n = 0; n < N; n++) if (C[n] === B.corruptland && forestish(n)) put(n, "corrupted"); if (!k) places.pop(); } }
    if (rnd() < .25) { const c = pick(n => inForest(n) && Wt[n] > .6 && th(n) < .2, awayFrom(places, 30)); if (c >= 0) { places.push(c); grow(c, 90 + Math.floor(rnd() * 140), "mushrooms", n => land(n) && !C[n] && Wt[n] > .5 && th(n) < .3); } }
    if (rnd() < .2) { const c = pick(n => land(n) && th(n) > .3 && th(n) < .48 && !C[n] && L.coast[n] < 30, awayFrom(places, 30)); if (c >= 0) { places.push(c); grow(c, 60 + Math.floor(rnd() * 70), "floating", n => land(n) && !C[n] && th(n) > .2); } }
    if (rnd() < .15) { const c = pick(n => land(n) && Wt[n] < .28 && th(n) < .45 && !C[n], awayFrom(places, 30)); if (c >= 0) { places.push(c); grow(c, 150 + Math.floor(rnd() * 200), "wasteland", n => land(n) && !C[n] && Wt[n] < .4, 1.4); } }
    if (rnd() < .2) { const c = pick(n => land(n) && NAT[n] === B.grass && th(n) > .08 && th(n) < .3 && !C[n], awayFrom(places, 30)); if (c >= 0) { places.push(c); grow(c, 70 + Math.floor(rnd() * 90), "vale", n => land(n) && !C[n] && th(n) < .35); } }
  }
  // lakes: frozen in the cold; in fantasy, seldom, one of them glows; on an alien world all water is the planet's own
  const lakes = patches(cols, rows, n => !land(n), false).filter(p => !p.edge && p.cells.length > 4);
  for (const p of lakes) { const t = p.cells.reduce((s, c) => s + T[c], 0) / p.cells.length; if (t < .14) for (const c of p.cells) put(c, "ice"); }
  if (setting === "fantasy" && lakes.length && rnd() < .25) {
    // (with the ecology: the highest lake, as a mountain tarn that catches the starlight; without it, any)
    const p = eco ? lakes.reduce((b, q) => Math.max(...q.cells.map(c => H[c])) > Math.max(...b.cells.map(c => H[c])) ? q : b, lakes[0]) : lakes[Math.floor(rnd() * lakes.length)];
    if (!C[p.cells[0]]) { for (const c of p.cells) put(c, "glowwater"); if (eco) lore.push({ kind: "glowwater", at: [I(p.cells[0]), J(p.cells[0])], why: "the highest lake, a tarn among the peaks" }); }
  }
  const P = alien ? BIO.PLANETS[o.planet] : null;
  if (P) {
    const liquid = P.liquid !== "water" ? P.liquid : null;
    for (let n = 0; n < N; n++) {
      if (!land(n)) { if (liquid && !C[n]) put(n, liquid); continue; }
      if (C[n] && ![B.glacier, B.floodplain].includes(C[n])) continue;
      const nat = BIO.byCode(NAT[n]), alt = nz2(I(n) / 9 + 70, J(n) / 9) > .62;
      const k = th(n) > .55 ? P.high : nat.group === "forest" ? (alt ? P.wet : P.forest) : [B.marsh, B.bog, B.mangrove, B.swampforest].includes(NAT[n]) ? P.wet : [B.tundra, B.icesheet].includes(NAT[n]) ? P.cold : alt ? P.forest : P.dry;
      put(n, k);
    }
  }
  return { C, made, lore: lore.map(l => Object.assign(l, { at: [Math.round((l.at[0] + .5) * o.cell), Math.round((l.at[1] + .5) * o.cell)] })), vols: vols.map(n => [I(n), J(n)]), liquid: P && P.liquid !== "water" ? P.liquid : null };
}

/* ---- how natural a land is: measured against the rules a real land keeps (references/world.md, "The rules of a
        natural map"), with the Earth's own proportions beside each. Returned as lines for the command to print; a rule
        broken is marked "!" */
function naturalness(L, rivers, cols, rows, natOf, climate) {
  const N = cols * rows, H = L.H, B = BIO.CODE, land = []; for (let n = 0; n < N; n++) if (H[n] > 128) land.push(n);
  const nl = land.length || 1, t = n => (H[n] - 128) / 127, pc = v => Math.round(v / nl * 1000) / 10;
  let high = 0, hilly = 0, des = 0, wood = 0, ice = 0; const FOREST = new Set(["forest", "fantasy", "alien"]);
  for (const n of land) { const v = t(n); if (v > .45) high++; if (v > .3) hilly++; const k = natOf(n), b = BIO.byCode(k); if ([B.dunes, B.rockdesert, B.saltflat, B.drylake, B.aliendesert, B.badlands, B.mesas].includes(k)) des++; if ([B.glacier, B.icesheet].includes(k)) ice++; if (b && b.dens >= .5 && L.M[n] > 150) wood++; }
  // ranges, not heaps: how much of the high ground lies in long ranges (a range is at least twice as long as wide)
  let inRange = 0, highAll = 0; const seen = new Uint8Array(N);
  for (const s of land) { if (seen[s] || t(s) <= .42) continue; const cells = [s]; seen[s] = 1; for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (!seen[m] && H[m] > 128 && t(m) > .42) { seen[m] = 1; cells.push(m); } } }
    highAll += cells.length; if (cells.length < 25) { inRange += cells.length; continue; }
    let mx = 0, my = 0; for (const c of cells) { mx += c % cols; my += (c / cols) | 0; } mx /= cells.length; my /= cells.length;
    let xx = 0, yy = 0, xy = 0; for (const c of cells) { const dx = c % cols - mx, dy = ((c / cols) | 0) - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
    const tr = xx + yy, det = xx * yy - xy * xy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = Math.max(1e-6, tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det)));
    if (Math.sqrt(l1 / l2) >= 2 || cells.length > nl * .06) inRange += cells.length; }
  // lakes: water that does not reach the map's edge
  const oc = new Uint8Array(N), st = []; for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (H[n] <= 128 && (!i || !j || i === cols - 1 || j === rows - 1)) { oc[n] = 1; st.push(n); } }
  while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && !oc[m] && H[m] <= 128) { oc[m] = 1; st.push(m); } }
  let lake = 0; for (let n = 0; n < N; n++) if (H[n] <= 128 && !oc[n]) lake++;
  const dry = climate === "arid", R = [
    ["mountains (above about 2000 m)", pc(high), "about 11%", pc(high) >= 4 && pc(high) <= 20],
    ["hills and mountains together", pc(hilly), "about 25%", pc(hilly) >= 12 && pc(hilly) <= 45],
    ["high ground lying in ranges, not heaps", Math.round(inRange / Math.max(1, highAll) * 100), "most of it", inRange / Math.max(1, highAll) >= .55],
    ["lakes", pc(lake), "about 2 to 4%", pc(lake) >= .2 && pc(lake) <= 7],
    ["forest", pc(wood), "about 30%", dry || (pc(wood) >= 8 && pc(wood) <= 65)],
    ["desert and dry land", pc(des), dry ? "most of an arid land" : "about 20%", dry ? pc(des) >= 15 : pc(des) <= 45],
    ["ice", pc(ice), "little but near the poles", pc(ice) <= 25],
    ["rivers (each from high ground to the sea or a lake)", rivers.length, "a few dozen on a map this size", rivers.length >= 6]
  ];
  return R.map(([what, v, earth, ok]) => `   ${ok ? " " : "!"} ${what}: ${v}${typeof v === "number" && what !== "rivers (each from high ground to the sea or a lake)" ? "%" : ""} (Earth: ${earth})`);
}

/* ---- the whole: land, rivers, names, places, routes */
function invent(A, flags, log) {
  const K = A.worldKit, W0 = A.worldData || {}, old = A.worldTerrainData || {};
  const lookWord = (flags.look && flags.look !== true ? flags.look : null) || W0.look || old.look || lookOfCity(A);
  const look = K.LOOK_OF[String(lookWord).toLowerCase()]; if (!look) throw new Error(`unknown look "${lookWord}": hydro (a hydrographic relief print), relief (shaded relief), painted or parchment (fantasy), engraved (the past), atlas (the modern world), holo (a planet surveyed) or stars (a star map)`);
  const sizeWord = flags.size && flags.size !== true ? String(flags.size) : old.sizeName || (old.height ? "medium" : "vast");
  const [w, h] = Array.isArray(W0.size) ? W0.size : SIZES[sizeWord] || SIZES.medium;
  const land = flags.land && flags.land !== true ? String(flags.land) : old.land || "continent";
  if (look !== "stars" && !SEA_SHARE[land]) throw new Error(`unknown land "${land}": continent, islands, archipelago, coast or inland`);
  const seed = flags.seed != null && flags.seed !== true ? parseInt(flags.seed, 10) : old.seed || 1000 + Math.floor(Math.random() * 9000);
  const cell = 4, cols = Math.round(w / cell), rows = Math.round(h / cell), N = cols * rows, rnd = mulberry32(seed + 77);
  const autoNames = flags.names !== "none", name = namer(mulberry32(seed + 5), W0.regions);
  // the climate and the setting (what the world gets by itself: fantasy's enchanted woods, an alien planet's strange land);
  // a land made before there were climates (the same seed, no cover) is made again exactly as it was, unless asked
  const setting = String(flags.setting && flags.setting !== true ? flags.setting : W0.setting || BIO.settingOf(look)).toLowerCase();
  const same = old.seed === seed && old.land === land && !flags.replace, before = same && old.height && !old.cover && !old.climate;
  const climateWord = flags.climate && flags.climate !== true ? String(flags.climate) : W0.climate || old.climate || (before ? "temperate" : "varied");
  if (!BIO.CLIMATES[String(climateWord).toLowerCase()]) throw new Error(`unknown climate "${climateWord}": ${Object.keys(BIO.CLIMATES).join(", ")}`);
  const climate = BIO.climateOf(climateWord);
  const planetWord = setting === "scifi" ? String(flags.planet && flags.planet !== true ? flags.planet : W0.planet || old.planet || Object.keys(BIO.PLANETS).filter(k => k !== "earthlike")[Math.floor(mulberry32(seed + 3)() * 8)]).toLowerCase() : null;
  if (planetWord && !(planetWord in BIO.PLANETS)) throw new Error(`unknown planet "${planetWord}": ${Object.keys(BIO.PLANETS).join(", ")}`);
  const regions = flags.regions === "none" ? false : flags.regions ? true : !before;
  // how real the world is (27 Oct 2026, the user's request for generation grounded in real geology): realistic (the
  // Earth's rules, nothing fantastic laid down), fantasy (the same land, with fantasy's places in it), alien (the same
  // rules on another planet). A new world is made by plate tectonics, erosion and climate (world-geology.js); a world
  // made before keeps the land it had, and --geology classic makes the older, simpler land
  const realism = String(flags.realism && flags.realism !== true ? flags.realism : W0.realism || old.realism || (setting === "fantasy" ? "fantasy" : setting === "scifi" ? "alien" : "realistic")).toLowerCase();
  if (!["realistic", "fantasy", "alien"].includes(realism)) throw new Error(`unknown realism "${realism}": realistic, fantasy or alien`);
  const geoWord = flags.geology && flags.geology !== true ? String(flags.geology) : old.geology || (before ? "classic" : "plates");
  if (!["plates", "classic"].includes(geoWord)) throw new Error(`unknown geology "${geoWord}": plates (tectonics, erosion and climate) or classic`);
  const T = { look, land, sizeName: SIZES[sizeWord] ? sizeWord : undefined, seed, w, h, cols, rows, cell, sea: 128, geology: geoWord === "plates" ? "plates" : undefined, realism: geoWord === "plates" ? realism : undefined, climate: before && climate === "temperate" && !flags.climate ? undefined : climate, planet: planetWord || undefined, spots: {}, labels: [], routes: [], rivers: [] };
  let CV = null;
  let L, riverMask = new Uint8Array(N);
  if (look === "stars") {
    const n1 = noiseFn(seed), n2 = noiseFn(seed + 1), Hh = new Uint8Array(N), M = new Uint8Array(N);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i / cols * (w / h), y = j / rows, n = j * cols + i; Hh[n] = Math.round(fbm(n1, x * 1.6, y * 1.6, 3) * 255); M[n] = Math.max(0, Math.min(255, Math.round((fbm(n2, x * 2.4 + 3, y * 2.4, 6) - .18) * 330))); }
    L = { H: Hh, M, coast: new Float32Array(N).fill(99) };
    T.stars = { seed };
    for (const p of patches(cols, rows, n => M[n] > 185, true).filter(p => p.cells.length > N * .02).sort((a, b) => b.cells.length - a.cells.length).slice(0, 4)) { const nm = name.nebula(autoNames); if (nm) T.labels.push(Object.assign({ name: nm, kind: "nebula", size: 18 }, labelOf(p, cols, cell))); }
  } else {
    const co = { cols, rows, cell, seed, climate, setting: realism === "realistic" && setting === "fantasy" ? "realistic" : realism === "alien" ? "scifi" : setting, planet: planetWord };
    let geo = null;
    if (geoWord === "plates") {
      // an alien planet's own conditions: its gravity (mountains stand taller where it is weak), its air (the rain it
      // can carry), its water (how much of it is sea), its warmth
      const num = (k, d) => flags[k] != null && flags[k] !== true ? +flags[k] : W0[k] != null ? +W0[k] : d;
      const planet = realism === "alien" ? { gravity: num("gravity", 1), air: num("air", 1), water: flags.water != null || W0.water != null ? num("water", .5) : undefined } : {};
      const G = require("./world-geology.js").geology({ cols, rows, seed, land, climate, landShare: 1 - (SEA_SHARE[land] || .5), planet, km: num("km", Math.round(w * 2.3)), tempShift: realism === "alien" ? num("warmth", 0) : 0, detailedBiomes: flags.biomes === "detailed", climateModel: flags["climate-model"] === "earth" ? "earth" : undefined }, { noiseFn, fbm, Heap, distance, mulberry32 });
      L = { H: G.H, M: G.M, coast: G.coast, Lo: G.Lo, eco: G.eco }; geo = G.info; T.rain = 1;
      // the ecology's layers, kept for the map to draw: each cell's biome, its tree cover (0 to 255), its yearly mean
      // temperature (°C + 60)
      if (G.eco && flags.biomes !== "classic") { T.biome = Buffer.from(G.eco.biome).toString("base64"); T.canopy = Buffer.from(G.eco.canopy).toString("base64"); T.tempC = Buffer.from(Uint8Array.from(G.eco.T, v => Math.max(0, Math.min(255, Math.round(v + 60))))).toString("base64"); if (G.eco.ground.some(v => v)) T.ground = Buffer.from(G.eco.ground).toString("base64"); }
      // (the land was made to a size, so the map knows its scale: miles for fantasy and the past, km otherwise)
      const kmAcross = num("km", Math.round(w * 2.3)), miles = ["hydro", "relief", "painted", "parchment", "engraved"].includes(look);
      T.scale = { unit: miles ? "mile" : "km", per: Math.round((miles ? kmAcross * .6214 : kmAcross) / w * 1000) / 1000 };
      if (realism === "alien") T.planetConditions = planet;
    } else L = makeLand({ cols, rows, seed, land });
    // (the classic land gets its fjords cut; the geology's own coasts have their drowned valleys already)
    const fj = regions && !geo ? carveFjords(co, L, mulberry32(seed + 41)) : 0;
    const R = makeRivers(Object.assign({ wetf: geo ? 1 : BIO.CLIMATES[climate][2], lakesFlow: !!geo }, co), L); T.rivers = R.rivers; riverMask = R.mask;
    if (regions) { CV = makeCover(Object.assign({ geo, rain: !!geo }, co), L, R, mulberry32(seed + 43), log); CV.fjords = fj; if (CV.liquid) T.liquid = CV.liquid; if (CV.lore && CV.lore.length) T.lore = CV.lore; }
    if (geo) CV = Object.assign(CV || { made: {}, vols: [] }, { geo });
    // seas and lakes, named at their deepest water
    const fromLand = distance(cols, rows, n => L.H[n] > 128);
    const waters = patches(cols, rows, n => L.H[n] <= 128, false).sort((a, b) => b.cells.length - a.cells.length);
    for (const p of waters) {
      const big = p.cells.length > N * .03, lake = !p.edge && p.cells.length > N * .002 && !big;
      if (!big && !lake) continue;
      const edge = c => Math.min(c % cols, cols - 1 - (c % cols), (c / cols) | 0, rows - 1 - ((c / cols) | 0)), room = c => Math.min(fromLand[c], edge(c) * .7 - 4);
      const deep = p.cells.reduce((b, c) => room(c) > room(b) ? c : b, p.cells[0]);
      const nm = lake ? name.lake(autoNames) : name.sea(p.cells.length > N * .2, autoNames);
      if (nm) T.labels.push(Object.assign({ name: nm, kind: lake ? "lake" : "sea", size: lake ? 13 : Math.round(16 + Math.min(14, p.cells.length / N * 40)) }, labelOf(p, cols, cell, deep), { angle: 0 }));
    }
    const tOf = n => (L.H[n] - 128) / 127;
    for (const p of patches(cols, rows, n => L.H[n] > 128 && tOf(n) > .58, true).filter(p => p.cells.length > N * .004).sort((a, b) => b.cells.length - a.cells.length).slice(0, 5)) { const nm = name.range(autoNames); if (nm) { const lb = labelOf(p, cols, cell); lb.at[1] += 16; T.labels.push(Object.assign({ name: nm, kind: "range", size: 14 }, lb)); } }
    const Cv = CV ? CV.C : new Uint8Array(N), BC = BIO.CODE;
    for (const p of patches(cols, rows, n => L.H[n] > 128 && tOf(n) < .55 && L.M[n] > 165 && !Cv[n], true).filter(p => p.cells.length > N * .006).sort((a, b) => b.cells.length - a.cells.length).slice(0, 4)) { const nm = name.forest(autoNames); if (nm) T.labels.push(Object.assign({ name: nm, kind: "forest", size: 13 }, labelOf(p, cols, cell))); }
    // the deserts, swamps and glaciers the climate made, and the regions laid down: each of the bigger ones named
    const natOf = n => Cv[n] || BIO.natural(warmthAt({ climate, cols, rows }, L, n), BIO.wetness(climate, L.M[n]), Math.max(0, tOf(n)));
    const nameAll = (is, min, most, nm, kind, size) => { for (const p of patches(cols, rows, n => L.H[n] > 128 && is(natOf(n)), true).filter(p => p.cells.length > N * min).sort((a, b) => b.cells.length - a.cells.length).slice(0, most)) { const s = nm(p); if (s) T.labels.push(Object.assign({ name: s, kind, size }, labelOf(p, cols, cell))); } };
    const alien = setting === "scifi";
    if (regions) nameAll(c => [BC.dunes, BC.rockdesert, BC.badlands, BC.mesas, BC.saltflat, BC.aliendesert].includes(c), .008, 3, () => name.desert(autoNames, alien), "desert", 14);
    if (regions) nameAll(c => [BC.marsh, BC.bog, BC.swampforest, BC.mangrove].includes(c), .004, 2, () => name.swamp(autoNames), "swamp", 12);
    if (regions) nameAll(c => c === BC.glacier || c === BC.icesheet, .004, 2, () => name.glacier(autoNames), "glacier", 12);
    if (regions && setting === "fantasy") for (const k of ["enchanted", "glowforest", "mushrooms", "corrupted", "floating", "wasteland", "corruptland", "vale"]) nameAll(c => c === BC[k], .0015, 1, () => ["wasteland", "corruptland", "vale"].includes(k) ? name.blight(autoNames, k) : name.wood(autoNames, k), k === "floating" ? "range" : k === "vale" ? "region" : "forest", 13);
    if (CV) for (const [i, j] of CV.vols) { const nm = name.volcano(autoNames); if (nm) T.labels.push({ name: nm, kind: "volcano", size: 12, at: [Math.round((i + .5) * cell), Math.round((j + 1.5) * cell + 18)], angle: 0 }); }
  }
  const unused = name.leftover(); if (unused.length) log(`  regions in world.js the land had no place for (no ${[...new Set(unused.map(r => r.kind || "region"))].join(", ")} big enough): ${unused.map(r => r.name).join(", ")}. Give them at: [x, y] in labels: to place them by hand.`);

  // ---- where the locations stand
  const near = distance(cols, rows, n => riverMask[n]), info = n => { const t = (L.H[n] - 128) / 127, w = L.H[n] > 128 ? warmthAt({ climate, cols, rows }, L, n) : 0, m = L.M[n] * (T.rain ? 1 : BIO.CLIMATES[climate][2]);
    // how well the land feeds people: mild and watered is best; a desert, tundra or a swamp feeds few
    const fert = Math.max(-1.5, 1 - Math.abs(w - .52) * 2.2 + Math.min(m, 170) / 170 * .7 - (m < 45 ? 1 : 0) - (m > 235 && t < .1 ? .5 : 0));
    return { land: L.H[n] > 128, t, coast: L.coast[n], river: near[n] <= 2, moist: L.M[n], fert }; };
  const SCORE = {
    settle: f => f.land && f.t < .4 ? 3 - f.t * 5 + (f.coast <= 2 ? 1.4 : 0) + (f.river ? 2 : 0) + f.fert * 1.3 : -Infinity,
    port: f => f.land && f.coast <= 1.5 && f.t < .35 ? 4 - f.t * 4 + (f.river ? 1.4 : 0) + f.fert * .6 : -Infinity,
    village: f => f.land && f.t < .5 ? 2 - f.t * 3 + (f.river ? 1 : 0) + (f.coast <= 3 ? .4 : 0) + f.fert : -Infinity,
    hill: f => f.land ? (f.t >= .28 && f.t < .62 ? 2.2 + f.t : .4) : -Infinity,
    high: f => f.land ? (f.t >= .48 ? 1.2 + f.t * 2 : .2) : -Infinity,
    wild: f => f.land ? 1 + (f.moist > 160 ? .8 : 0) + (f.t > .3 ? .3 : 0) : -Infinity,
    river: f => f.land && f.river ? 2.5 : f.land ? .2 : -Infinity,
    coastal: f => f.land && f.coast <= 1.5 ? 2 : -Infinity,
    any: f => f.land ? 1 : -Infinity,
    space: () => 1
  };
  const locs = (W0.locations || []).filter(l => l && l.id), placed = [], spacing = look === "stars" ? 46 : Math.max(26, Math.min(48, Math.sqrt(w * h / Math.max(1, locs.length)) * .42));
  for (const l of locs) if (Array.isArray(l.at)) placed.push({ id: l.id, at: l.at, kind: l.kind });
  const keepOld = !flags.replace && old.spots && old.seed === seed && old.land === land ? old.spots : {};
  for (const l of locs) if (!Array.isArray(l.at) && Array.isArray(keepOld[l.id])) { T.spots[l.id] = keepOld[l.id]; placed.push({ id: l.id, at: keepOld[l.id], kind: l.kind }); }
  const todo = locs.filter(l => !Array.isArray(l.at) && !T.spots[l.id]).map((l, i) => ({ l, i })).sort((a, b) => ((K.KINDS[a.l.kind] || [3])[0] - (K.KINDS[b.l.kind] || [3])[0]) || a.i - b.i).map(x => x.l);
  // in space, a moon keeps near a planet, a station near a planet or a star, a planet near a star
  const kindNear = { moon: ["planet"], station: ["planet", "star", "moon"], outpost: ["planet", "moon", "asteroid"], planet: ["star"], gate: [], ship: ["station", "planet"] };
  const ORBIT = { planet: [90, 260], moon: [26, 60], station: [26, 70], outpost: [30, 90], ship: [30, 90] };
  let placedN = 0;
  for (const l of todo) {
    const wants = look === "stars" ? "space" : WANTS[l.kind] || (l.city ? "settle" : "any"), score = SCORE[wants] || SCORE.any;
    let anchor = l.near ? placed.find(p => p.id === l.near) : null;
    if (!anchor && look === "stars" && kindNear[l.kind]) for (const k of kindNear[l.kind]) { const c = placed.filter(p => p.kind === k); if (c.length) { anchor = c[Math.floor(rnd() * c.length)]; break; } }
    const settledNow = placed.filter(p => SETTLED.has(p.kind));
    let best = null, bs = -Infinity;
    for (let n = 0; n < N; n++) {
      const i = n % cols, j = (n / cols) | 0, x = (i + .5) * cell, y = (j + .5) * cell;
      if (x < w * .04 || y < h * .05 || x > w * .96 || y > h * .95) continue;
      const f = info(n); let s = score(f); if (s === -Infinity) continue;
      let close = 1e9; for (const p of placed) close = Math.min(close, Math.hypot(p.at[0] - x, p.at[1] - y));
      const sp = anchor ? (look === "stars" ? 22 : spacing * .55) : spacing; if (close < sp) continue;
      // how far from what it keeps near: in space a planet stands well out from its star, a moon or a station close by its world
      if (anchor) { const d = Math.hypot(anchor.at[0] - x, anchor.at[1] - y), [lo, hi] = (look === "stars" && ORBIT[l.kind]) || [0, look === "stars" ? 90 : 120]; if (d < lo || d > hi) continue; s += 1.5 - Math.abs(d - (lo + hi) / 2) / (hi - lo); }
      if (wants === "wild" || wants === "high") { let far = 1e9; for (const p of settledNow) far = Math.min(far, Math.hypot(p.at[0] - x, p.at[1] - y)); s += Math.min(1.5, far / 160); }
      s += Math.min(.8, close / (spacing * 4)) + rnd() * .9;
      if (s > bs) { bs = s; best = [Math.round(x), Math.round(y)]; }
    }
    if (!best) { log(`  ! no room on the land for ${l.id} (${l.kind}): give it at: [x, y] in world.js`); continue; }
    T.spots[l.id] = best; placed.push({ id: l.id, at: best, kind: l.kind }); placedN++;
  }

  // ---- routes, while world.js has none of its own: neighbours joined by road, trail or pass over the land, by sea
  //      between coasts, by space lanes among the stars
  let routesN = 0;
  if (!(W0.routes && W0.routes.length) && placed.length > 1) {
    const P = placed, d = (a, b) => Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]), cellAt = p => Math.min(rows - 1, Math.max(0, Math.floor(p[1] / cell))) * cols + Math.min(cols - 1, Math.max(0, Math.floor(p[0] / cell)));
    const comp = new Int32Array(N).fill(-1); if (look !== "stars") patches(cols, rows, n => L.H[n] > 128, true).forEach((p, k) => { for (const c of p.cells) comp[c] = k; });
    const edges = [];
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const dab = d(P[a], P[b]); let ok = true;
      for (let c = 0; c < P.length && ok; c++) if (c !== a && c !== b && Math.max(d(P[a], P[c]), d(P[b], P[c])) < dab) ok = false;
      if (ok) edges.push([a, b, dab]);
    }
    const kindOf = (A_, B_) => {
      if (look === "stars") return "lane";
      const ca = comp[cellAt(A_.at)], cb = comp[cellAt(B_.at)];
      let wet = 0, top = 0; const steps = 40;
      for (let s = 0; s <= steps; s++) { const x = A_.at[0] + (B_.at[0] - A_.at[0]) * s / steps, y = A_.at[1] + (B_.at[1] - A_.at[1]) * s / steps, n = cellAt([x, y]); if (L.H[n] <= 128) wet++; top = Math.max(top, (L.H[n] - 128) / 127); }
      const coastal = p => L.coast[cellAt(p.at)] <= 3;
      if (ca !== cb || wet > steps * .3) return coastal(A_) && coastal(B_) ? "sea" : null;
      if (top > .66) return "pass";
      return SETTLED.has(A_.kind) && SETTLED.has(B_.kind) ? "road" : "trail";
    };
    const made = [], link = new Map(), root = i => { while (link.has(i) && link.get(i) !== i) i = link.get(i); return i; };
    for (const [a, b] of edges.sort((x, y) => x[2] - y[2])) { const k = kindOf(P[a], P[b]); if (!k) continue; made.push({ from: P[a].id, to: P[b].id, kind: k }); link.set(root(a), root(b)); }
    // islands left alone get the shortest sea crossing to the rest
    for (let g = 0; g < P.length; g++) {
      const groups = new Map(); P.forEach((p, i) => { const r = root(i); groups.set(r, (groups.get(r) || []).concat(i)); });
      if (groups.size < 2) break;
      const [first, ...rest] = [...groups.values()]; let best = null;
      for (const a of first) for (const g2 of rest) for (const b of g2) { const dd = d(P[a], P[b]); if ((!best || dd < best[2]) && (look === "stars" || (L.coast[cellAt(P[a].at)] <= 4 && L.coast[cellAt(P[b].at)] <= 4))) best = [a, b, dd]; }
      if (!best) break;
      made.push({ from: P[best[0]].id, to: P[best[1]].id, kind: look === "stars" ? "lane" : "sea" }); link.set(root(best[0]), root(best[1]));
    }
    T.routes = made; routesN = made.length;
  }
  // how natural the land came out, rule by rule (printed after the summary)
  let natural = [];
  if (look !== "stars" && L && L.H && T.rivers) { const Cv = CV ? CV.C : new Uint8Array(N), wf = T.rain ? 1 : BIO.CLIMATES[climate][2]; natural = naturalness(L, T.rivers, cols, rows, n => Cv[n] || BIO.natural(warmthAt({ climate, cols, rows }, L, n), Math.min(1, L.M[n] / 255 * wf), Math.max(0, (L.H[n] - 128) / 127)), climate); }
  T.height = Buffer.from(L.H).toString("base64"); T.moist = Buffer.from(L.M).toString("base64");
  if (CV && CV.C.some(v => v)) T.cover = Buffer.from(CV.C).toString("base64");
  // (the fraction of each height, for the shaded relief; the fjords and craters carved after it leave their cells whole)
  if (L.Lo) T.heightLo = Buffer.from(L.Lo).toString("base64");
  const sea = look === "stars" ? 0 : Math.round(L.H.reduce((s, v) => s + (v <= 128 ? 1 : 0), 0) / N * 100);
  const regionsSaid = CV ? Object.entries(CV.made).filter(([k]) => !["reef", "ice"].includes(k) || CV.made[k] > 20).map(([k, n]) => `${BIO.BY[k].name.toLowerCase().replace(/ \(.*\)$/, "")}`).slice(0, 12) : [];
  const gi = CV && CV.geo;
  if (natural.length) log("  how natural the land is, rule by rule:\n" + natural.join("\n"));
  if (T.lore) log("  fantasy's places, and why each stands where it does:\n" + T.lore.map(l => `     ${BIO.BY[l.kind].name} at [${l.at}]: ${l.why}`).join("\n"));
  return { T, summary: `${look === "stars" ? "a star map" : `the land: ${land}, ${sea}% sea,${gi ? ` ${gi.plates} tectonic plates (${gi.continental} continental), highest peak about ${gi.peak} m, ${gi.lakes ? "lakes, " : ""}${realism},` : ""} ${T.rivers.length} rivers, climate: ${BIO.CLIMATES[climate][3].toLowerCase()}${planetWord ? `, a ${planetWord} planet` : ""}${CV && CV.fjords ? `, ${CV.fjords} fjords` : ""}${regionsSaid.length ? `; regions: ${regionsSaid.join(", ")}` : ""}`}, ${w} by ${h} (seed ${seed}); ${T.labels.length} named features; ${placedN} location${placedN === 1 ? "" : "s"} placed${Object.keys(keepOld).length ? `, ${Object.keys(T.spots).length - placedN} kept where they stood` : ""}${routesN ? `; ${routesN} routes suggested (world.js has none of its own)` : ""}` };
}
// the look a campaign's world wears by itself (the game master may choose another on the page): a planet's surface a
// survey, space a star chart, the modern world an atlas, the past an engraved plate, fantasy a painted map (27 Oct
// 2026, as the user asked) and the middle ages parchment
function lookOfCity(A) {
  const c = A.cityData || {}, lk = typeof c.look === "string" ? c.look : c.look && c.look.base, setting = String((A.config || {}).setting || "") + " " + String((A.config || {}).system || "");
  const era = A.table && A.table.era ? A.table.era() : "";
  if (/colony|planet ?side|planet's surface|surface of|alien world|terraform/i.test(setting)) return "holo";
  if (lk === "scifi" || lk === "future" || era === "future" || /space|star|orbit|planet|mothership|traveller/i.test(setting)) return "stars";
  if (lk === "modern" || era === "modern") return "atlas";
  if (era === "victorian" || era === "1920s" || lk === "victorian" || lk === "industrial") return "engraved";
  // (fantasy has been shaded relief since 27 Oct 2026, as the user asked; painted and parchment remain choices)
  if (lk === "fantasy" || (A.config || {}).genre === "fantasy" || /fantas|sorcer|dragon|elv|elf|dwar|wizard|dungeons/i.test(setting)) return "hydro";
  return "parchment";
}
// ---- a map the game master drew (or painted, or photographed): the picture is kept beside the campaign as
//      world-drawing.<type> and laid under the world map, and the page traces its coasts to redraw it in Atlas's own
//      look. The map takes the picture's shape: 1000 units along its longer side. world.js says where each place on it
//      stands (read off the picture), and its mountains, forests, rivers and lakes (features:).
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.length > 10 && buf.toString("ascii", 0, 3) === "GIF") return { type: "gif", w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const f = buf.toString("ascii", 12, 16);
    if (f === "VP8X") return { type: "webp", w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (f === "VP8 ") return { type: "webp", w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (f === "VP8L") { const b = buf.readUInt32LE(21); return { type: "webp", w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }; }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    // a JPEG: its size from the frame header; a phone photo held sideways says so in its EXIF, and is shown turned
    let i = 2, orient = 1;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (m === 0xe1 && buf.toString("ascii", i + 4, i + 8) === "Exif") orient = exifOrientation(buf, i + 10);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { const h = buf.readUInt16BE(i + 5), w = buf.readUInt16BE(i + 7); return orient >= 5 && orient <= 8 ? { type: "jpeg", w: h, h: w } : { type: "jpeg", w, h }; }
      i += 2 + len;
    }
  }
  return null;
}
function exifOrientation(b, t) {
  try {
    const le = b.toString("ascii", t, t + 2) === "II", u16 = o => le ? b.readUInt16LE(o) : b.readUInt16BE(o), u32 = o => le ? b.readUInt32LE(o) : b.readUInt32BE(o);
    const ifd = t + u32(t + 4), n = u16(ifd);
    for (let k = 0; k < n; k++) { const e = ifd + 2 + k * 12; if (u16(e) === 0x0112) return u16(e + 8); }
  } catch (e) {}
  return 1;
}
function fromDrawing(dir, A, src, flags, log) {
  const K = A.worldKit, W0 = A.worldData || {}, old = A.worldTerrainData || {};
  const file = src && src !== true ? path.resolve(src) : old.drawing ? path.join(dir, old.drawing) : null;
  if (!file || !fs.existsSync(file)) throw new Error(`no picture at ${src && src !== true ? src : "(none given)"}: atlas.js world <dir> --drawing <the picture>`);
  const buf = fs.readFileSync(file), sz = imageSize(buf);
  if (!sz || !sz.w || !sz.h) throw new Error("the drawing must be a picture: PNG, JPEG, WebP or GIF");
  if (buf.length > 8e6) throw new Error(`the picture is ${Math.round(buf.length / 1e6)} MB: make it smaller than 8 MB (2000 pixels across is plenty)`);
  const name = "world-drawing." + (sz.type === "jpeg" ? "jpg" : sz.type), dest = path.join(dir, name);
  if (path.resolve(file) !== path.resolve(dest)) { for (const f of fs.readdirSync(dir)) if (/^world-drawing\./.test(f)) fs.unlinkSync(path.join(dir, f)); fs.copyFileSync(file, dest); }
  const w = sz.w >= sz.h ? 1000 : Math.round(1000 * sz.w / sz.h), h = sz.w >= sz.h ? Math.round(1000 * sz.h / sz.w) : 1000;
  const lookWord = (flags.look && flags.look !== true ? flags.look : null) || W0.look || old.look || lookOfCity(A), look = K.LOOK_OF[String(lookWord).toLowerCase()] || "parchment";
  const missing = (W0.locations || []).filter(l => l && l.id && !Array.isArray(l.at));
  if (missing.length) log(`  ${missing.length} location${missing.length > 1 ? "s have" : " has"} no at: [x, y] yet (${missing.map(l => l.id).join(", ")}): read where each stands on the drawing; the map is ${w} across and ${h} down`);
  if (buf.length > 3e6) log(`  the picture is ${(buf.length / 1e6).toFixed(1)} MB, and the page carries it: a copy about 2000 pixels across would make the page lighter`);
  return { T: { look, drawing: name, w, h, spots: {}, labels: [], routes: [], rivers: [] }, summary: `the game master's drawing, ${sz.w} by ${sz.h} pixels: a map ${w} by ${h}, laid under the world map; the page traces its coasts and can redraw it in Atlas's ${look} look`, size: [w, h] };
}
// the terrain file: written by the command, never by hand
function writeTerrain(dir, T, title) {
  const big = ["height", "heightLo", "moist", "cover", "biome", "canopy", "tempC", "ground"], lines = [];
  for (const [k, v] of Object.entries(T)) if (v !== undefined && !big.includes(k) && !["rivers", "labels", "routes", "spots"].includes(k)) lines.push(`  ${k}: ${JSON.stringify(v)}`);
  lines.push(`  spots: {\n${Object.entries(T.spots).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n")}\n  }`);
  for (const k of ["labels", "routes", "rivers"]) lines.push(`  ${k}: [\n${(T[k] || []).map(x => "    " + JSON.stringify(x)).join(",\n")}\n  ]`);
  for (const k of big) if (T[k]) lines.push(`  ${k}: "${T[k]}"`);
  const how = T.drawing ? `the game master's drawing (${T.drawing})` : T.real ? `the real world (${T.real.name})` : `atlas.js world (seed ${T.seed})`;
  fs.writeFileSync(path.join(dir, "world-terrain.js"), `// The land under the world map${title ? " of " + title : ""}, from ${how}. Not for editing by hand: run atlas.js world\n// again. To stand a location somewhere else give it at: [x, y] in world.js; to name a sea, a range or a forest, list it\n// in world.js regions: [{ name, kind: "sea" | "lake" | "range" | "forest" }]. spots: where the locations without at: stand.\nATLAS.worldTerrain({\n${lines.join(",\n")}\n});\n`);
}
// a world.js to start from: the campaign's cities as its first locations
function starter(dir, A, flags, size) {
  const look = (flags.look && flags.look !== true ? flags.look : lookOfCity(A)), K = A.worldKit, lk = K.LOOK_OF[String(look).toLowerCase()] || "parchment";
  const title = (A.config && A.config.title) || "The world";
  const locs = Object.entries(A.cities || {}).map(([id, c]) => ({ id: id === "main" ? slug((c && c.title) || title) : id, name: (c && c.title) || title, kind: lk === "stars" ? "station" : "city", city: id, desc: "" }));
  let scale = null, speeds = null;
  const m = flags.across && flags.across !== true ? /^([\d.]+)\s*([a-z-]+)?/i.exec(String(flags.across)) : null;
  const [w] = size || SIZES[flags.size] || SIZES.medium;
  if (m) {
    const unit = (m[2] || "mile").toLowerCase().replace(/(?<!s)s$/, "").replace(/^km$/, "km");
    scale = { unit, per: Math.round(+m[1] / w * 10000) / 10000 };
    if ((lk === "parchment" || lk === "painted" || lk === "relief" || lk === "hydro") && /mile|league|km/.test(unit)) { const k = unit === "league" ? 1 / 3 : unit === "km" ? 1.6 : 1; speeds = { road: Math.round(24 * k), trail: Math.round(16 * k), pass: Math.round(10 * k), river: Math.round(30 * k), sea: Math.round(72 * k) }; }
  }
  const L = locs.map(l => "    " + JSON.stringify(l).replace(/"(\w+)":/g, "$1: ")).join(",\n");
  const txt = `// The world map of ${title}: the places the story travels between, and the ways between them (references/world.md).
// Written by hand. atlas.js world <campaign> makes the land under it (world-terrain.js), stands every location that has
// no at: [x, y] where its kind belongs, and suggests routes while there are none here. Run it again after adding places.
ATLAS.world({
  title: ${JSON.stringify(title)},
  look: ${JSON.stringify(lk)},                       // hydro (hydrographic relief print) · relief (shaded relief) · painted · parchment (fantasy) · engraved (the past) · atlas (the modern world) · holo (a planet) · stars (a star map)
  ${scale ? `scale: ${JSON.stringify(scale).replace(/"(\w+)":/g, "$1: ")},` : `// scale: { unit: "mile", per: 0.6 },     // how far one unit of the map is (the map is ${w} units across); without it, no distances`}
  ${speeds ? `speeds: ${JSON.stringify(speeds).replace(/"(\w+)":/g, "$1: ")},` : `// speeds: { road: 24, trail: 16, pass: 10, river: 30, sea: 72 },   // a day's travel on each kind of route, in the scale's unit`}
  regions: [],                              // names for the seas, ranges and forests: { name: "The Grey Sea", kind: "sea" }
  locations: [
${L}
  ],
  routes: [],                               // { from, to, kind: "road", days, danger: "...", blocked: "...", hidden: true }
  party: ${locs.length ? `{ at: ${JSON.stringify(locs[0].id)} }` : "{}"}
});
`;
  fs.writeFileSync(path.join(dir, "world.js"), txt);
  return locs.length;
}

module.exports = { invent, fromDrawing, imageSize, writeTerrain, starter, lookOfCity, SIZES, tools: { noiseFn, fbm, Heap, distance, mulberry32 } };
