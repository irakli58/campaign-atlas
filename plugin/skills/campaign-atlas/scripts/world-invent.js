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

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "place";
const SIZES = { small: [800, 560], medium: [1000, 700], large: [1400, 980], huge: [1800, 1260] };
const SEA_SHARE = { continent: .5, islands: .66, coast: .47, inland: .025 };

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
  const KIND_SAYS = { sea: ["sea", "ocean", "bay", "gulf", "sound", "strait"], range: ["range", "mountains", "hills", "peaks"], forest: ["forest", "wood", "woods", "weald"], lake: ["lake", "mere"], nebula: ["nebula", "cloud"] };
  const own_ = kind => { for (const [k, list] of Object.entries(mine)) if ((KIND_SAYS[kind] || [kind]).includes(k) && list.length) return list.shift().name; return null; };
  return {
    sea: (big, auto) => own_("sea") || (auto ? `The ${pick(ADJ)} ${big ? pick(["Sea", "Sea", "Ocean", "Deep"]) : pick(["Bay", "Gulf", "Sound", "Sea"])}` : null),
    lake: auto => own_("lake") || (auto ? (rnd() < .5 ? `Lake ${word()}` : `${word()} Mere`) : null),
    range: auto => own_("range") || (auto ? (rnd() < .5 ? `The ${word()} ${pick(["Mountains", "Peaks", "Heights"])}` : `The ${pick(ADJ)} ${pick(["Spine", "Teeth", "Crags", "Mountains"])}`) : null),
    forest: auto => own_("forest") || (auto ? `The ${rnd() < .5 ? word() : pick(ADJ)} ${pick(["Wood", "Forest", "Weald", "Holt"])}` : null),
    nebula: auto => own_("nebula") || (auto ? `The ${pick(ADJ)} ${pick(["Nebula", "Cloud", "Drift", "Veil"])}` : null),
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
  const side = Math.floor(rnd() * 4);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + .5) / cols, y = (j + .5) / rows, e = fbm(n1, x * 3.2 * asp, y * 3.2, 6);
    const wx = (fbm(n2, x * 2.2 * asp + 5, y * 2.2, 3) - .5) * .5, wy = (fbm(n2, x * 2.2 * asp - 7, y * 2.2 + 3, 3) - .5) * .5;
    let m;
    if (land === "islands") { m = 0; for (const [cx, cy, r] of isles) { const d = Math.hypot((x + wx * .6 - cx) * asp * .8, y + wy * .6 - cy) / r; m = Math.max(m, 1 - d * d); } m = Math.max(-.6, m); }
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
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (H[n] <= 128 || i === 0 || j === 0 || i === cols - 1 || j === rows - 1) { seen[n] = 1; filled[n] = H[n]; hp.push(n, H[n]); } }
  while (hp.size) {
    const c = hp.pop(); order.push(c); const i = c % cols, j = (c / cols) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const I = i + di, J = j + dj; if (I < 0 || J < 0 || I >= cols || J >= rows) continue; const m = J * cols + I; if (seen[m]) continue; seen[m] = 1; filled[m] = Math.max(H[m], filled[c] + .01); parent[m] = c; hp.push(m, filled[m]); }
  }
  const acc = new Float32Array(N); for (let n = 0; n < N; n++) acc[n] = H[n] > 128 ? .5 + L.M[n] / 255 : 0;
  for (let k = order.length - 1; k >= 0; k--) { const c = order[k], p = parent[c]; if (p >= 0) acc[p] += acc[c]; }
  const T = Math.max(40, N * .0065), river = n => H[n] > 128 && acc[n] >= T, fed = new Uint8Array(N);
  for (let n = 0; n < N; n++) if (river(n) && parent[n] >= 0) fed[parent[n]] = 1;
  const done = new Uint8Array(N), out = [], mask = new Uint8Array(N);
  const heads = []; for (let n = 0; n < N; n++) if (river(n) && !fed[n]) heads.push(n);
  heads.sort((a, b) => acc[b] - acc[a]);
  for (const h of heads) {
    const pts = []; let n = h, last = h;
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

/* ---- the whole: land, rivers, names, places, routes */
function invent(A, flags, log) {
  const K = A.worldKit, W0 = A.worldData || {}, old = A.worldTerrainData || {};
  const lookWord = (flags.look && flags.look !== true ? flags.look : null) || W0.look || old.look || lookOfCity(A);
  const look = K.LOOK_OF[String(lookWord).toLowerCase()]; if (!look) throw new Error(`unknown look "${lookWord}": parchment (fantasy), engraved (the past), atlas (the modern world), holo (a planet surveyed) or stars (a star map)`);
  const sizeWord = flags.size && flags.size !== true ? String(flags.size) : old.sizeName || "medium";
  const [w, h] = Array.isArray(W0.size) ? W0.size : SIZES[sizeWord] || SIZES.medium;
  const land = flags.land && flags.land !== true ? String(flags.land) : old.land || "continent";
  if (look !== "stars" && !SEA_SHARE[land]) throw new Error(`unknown land "${land}": continent, islands, coast or inland`);
  const seed = flags.seed != null && flags.seed !== true ? parseInt(flags.seed, 10) : old.seed || 1000 + Math.floor(Math.random() * 9000);
  const cell = 4, cols = Math.round(w / cell), rows = Math.round(h / cell), N = cols * rows, rnd = mulberry32(seed + 77);
  const autoNames = flags.names !== "none", name = namer(mulberry32(seed + 5), W0.regions);
  const T = { look, land, sizeName: SIZES[sizeWord] ? sizeWord : undefined, seed, w, h, cols, rows, cell, sea: 128, spots: {}, labels: [], routes: [], rivers: [] };
  let L, riverMask = new Uint8Array(N);
  if (look === "stars") {
    const n1 = noiseFn(seed), n2 = noiseFn(seed + 1), Hh = new Uint8Array(N), M = new Uint8Array(N);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i / cols * (w / h), y = j / rows, n = j * cols + i; Hh[n] = Math.round(fbm(n1, x * 1.6, y * 1.6, 3) * 255); M[n] = Math.max(0, Math.min(255, Math.round((fbm(n2, x * 2.4 + 3, y * 2.4, 6) - .18) * 330))); }
    L = { H: Hh, M, coast: new Float32Array(N).fill(99) };
    T.stars = { seed };
    for (const p of patches(cols, rows, n => M[n] > 185, true).filter(p => p.cells.length > N * .02).sort((a, b) => b.cells.length - a.cells.length).slice(0, 4)) { const nm = name.nebula(autoNames); if (nm) T.labels.push(Object.assign({ name: nm, kind: "nebula", size: 18 }, labelOf(p, cols, cell))); }
  } else {
    L = makeLand({ cols, rows, seed, land });
    const R = makeRivers({ cols, rows, cell }, L); T.rivers = R.rivers; riverMask = R.mask;
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
    for (const p of patches(cols, rows, n => L.H[n] > 128 && tOf(n) < .55 && L.M[n] > 165, true).filter(p => p.cells.length > N * .006).sort((a, b) => b.cells.length - a.cells.length).slice(0, 4)) { const nm = name.forest(autoNames); if (nm) T.labels.push(Object.assign({ name: nm, kind: "forest", size: 13 }, labelOf(p, cols, cell))); }
  }
  const unused = name.leftover(); if (unused.length) log(`  regions in world.js the land had no place for (no ${[...new Set(unused.map(r => r.kind || "region"))].join(", ")} big enough): ${unused.map(r => r.name).join(", ")}. Give them at: [x, y] in labels: to place them by hand.`);

  // ---- where the locations stand
  const near = distance(cols, rows, n => riverMask[n]), info = n => { const t = (L.H[n] - 128) / 127; return { land: L.H[n] > 128, t, coast: L.coast[n], river: near[n] <= 2, moist: L.M[n] }; };
  const SCORE = {
    settle: f => f.land && f.t < .4 ? 3 - f.t * 5 + (f.coast <= 2 ? 1.4 : 0) + (f.river ? 2 : 0) : -Infinity,
    port: f => f.land && f.coast <= 1.5 && f.t < .35 ? 4 - f.t * 4 + (f.river ? 1 : 0) : -Infinity,
    village: f => f.land && f.t < .5 ? 2 - f.t * 3 + (f.river ? 1 : 0) + (f.coast <= 3 ? .4 : 0) : -Infinity,
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
  T.height = Buffer.from(L.H).toString("base64"); T.moist = Buffer.from(L.M).toString("base64");
  const sea = look === "stars" ? 0 : Math.round(L.H.reduce((s, v) => s + (v <= 128 ? 1 : 0), 0) / N * 100);
  return { T, summary: `${look === "stars" ? "a star map" : `the land: ${land}, ${sea}% sea, ${T.rivers.length} rivers`}, ${w} by ${h} (seed ${seed}); ${T.labels.length} named features; ${placedN} location${placedN === 1 ? "" : "s"} placed${Object.keys(keepOld).length ? `, ${Object.keys(T.spots).length - placedN} kept where they stood` : ""}${routesN ? `; ${routesN} routes suggested (world.js has none of its own)` : ""}` };
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
  if (lk === "fantasy" || (A.config || {}).genre === "fantasy" || /fantas|sorcer|dragon|elv|elf|dwar|wizard|dungeons/i.test(setting)) return "painted";
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
  const big = ["height", "moist"], lines = [];
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
    if ((lk === "parchment" || lk === "painted") && /mile|league|km/.test(unit)) { const k = unit === "league" ? 1 / 3 : unit === "km" ? 1.6 : 1; speeds = { road: Math.round(24 * k), trail: Math.round(16 * k), pass: Math.round(10 * k), river: Math.round(30 * k), sea: Math.round(72 * k) }; }
  }
  const L = locs.map(l => "    " + JSON.stringify(l).replace(/"(\w+)":/g, "$1: ")).join(",\n");
  const txt = `// The world map of ${title}: the places the story travels between, and the ways between them (references/world.md).
// Written by hand. atlas.js world <campaign> makes the land under it (world-terrain.js), stands every location that has
// no at: [x, y] where its kind belongs, and suggests routes while there are none here. Run it again after adding places.
ATLAS.world({
  title: ${JSON.stringify(title)},
  look: ${JSON.stringify(lk)},                       // parchment (fantasy) · engraved (the past) · atlas (the modern world) · holo (a planet) · stars (a star map)
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

module.exports = { invent, fromDrawing, imageSize, writeTerrain, starter, lookOfCity, SIZES };
