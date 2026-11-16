/* Campaign Atlas: the plates and the rocks of a world made by plate tectonics, and what lies in them (the user,
   16 Nov 2026: "a plate map layer" and "geology you can use in play: rock types by region, ore and gem deposits where
   real geology puts them", added to every world the plates make). It changes nothing of the land: it reads what
   world-geology.js made (each plate, its motion, its borders and what happens at each, the old mountain belts, the
   hotspots, the volcanoes, the heights, the rivers and the climate) and says:
     - the plates: each one's middle, its heading and speed, continental or oceanic; their borders, by kind:
       collision (two continents: the Himalaya), subduction (an ocean plate under a continent: the Andes), island arc
       (ocean under ocean: Japan, the Aleutians), spreading ridge (plates parting in the ocean: the Mid-Atlantic
       Ridge), rift (a continent tearing: East Africa), transform (sliding past: the San Andreas);
     - the rocks of each place: volcanic (arcs, hotspots, rifts), granite and metamorphic rock (the cores of great
       ranges and the roots of old ones), the ancient shield (the oldest crust, far from any border: the Canadian
       Shield), folded sedimentary rock (a young range's flanks), sedimentary basins (low ground where sand and mud
       piled up for ages), limestone (laid down in warm shallow seas; caves where it rains), alluvium (river plains
       and deltas);
     - what lies in them, placed by the processes that make it on the Earth: copper, gold and silver in the volcanic
       arcs above subducting plates (porphyry deposits: Chile, the Rockies), gold also in old shields (greenstone
       belts); iron in the ancient shields (banded iron: Western Australia); tin and gems in granite and old mountain
       roots; lead and zinc in limestone by the mountains; coal in basins that were once wet lowland forest; oil and
       gas in deep sedimentary basins and old deltas; salt in dry basins that cannot drain; hot springs by volcanoes
       and rifts; caves in wet limestone. Each deposit says why it is there. */
"use strict";
const gauss = v => Math.exp(-v * v), smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const BORDER = { collision: 1, subduction: 2, arc: 3, ridge: 4, rift: 5, transform: 6 };
const ROCK = { volcanic: 1, granite: 2, shield: 3, folded: 4, sedimentary: 5, limestone: 6, alluvium: 7 };
const hash = (x, y, s) => { let h = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(s | 0, 83492791)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// a smooth value noise from the hash, for patches that are not blocks
// (several scales of it together, so a patch has a ragged edge, not a single round bump's)
const fbm = (x, y, s) => .55 * vn(x, y, s) + .3 * vn(x * 2.3 + 5.1, y * 2.3, s + 1) + .15 * vn(x * 5.3, y * 5.3 + 2.7, s + 2);
const vn = (x, y, s) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sm = t => t * t * (3 - 2 * t); return a + (b - a) * sm(u) + (c - a) * sm(v) + (a - b - c + d) * sm(u) * sm(v); };

function tectonics(G) {
  const { cols, rows, f, cc, cr, ckm, cellKm, plate, plates, crust, bInfo, oldB, hotC, vols, E, isLand, lake, playa, eco, seed } = G, N = cols * rows, CN = cc * cr;
  const ci = n => n % cc, cj = n => (n / cc) | 0, I = n => n % cols, J = n => (n / cols) | 0;
  const toC = n => Math.min(cr - 1, (J(n) / f) | 0) * cc + Math.min(cc - 1, (I(n) / f) | 0);
  // the borders: each border cell's kind (on the plate whose number is lower, so each border is drawn once)
  const bk = new Uint8Array(CN), bkAll = new Uint8Array(CN), over = new Int8Array(CN);
  for (let n = 0; n < CN; n++) {
    const b = bInfo[n]; if (!b) continue;
    let k;
    if (b.conv > .1) k = b.ca && b.cb ? BORDER.collision : b.ca || b.cb ? BORDER.subduction : BORDER.arc;
    else if (b.conv < -.1) k = b.ca && b.cb ? BORDER.rift : BORDER.ridge;
    else k = BORDER.transform;
    bkAll[n] = k; if (b.pa < b.pb) bk[n] = k;
    // (at a subduction, which side rides over: the continent's)
    if (k === BORDER.subduction) over[n] = b.ca ? 1 : -1;
  }
  // (a scrap of border a few cells long, where a sliver of one plate pokes into another, is no real border: dropped)
  { const seen = new Uint8Array(CN), minLen = Math.max(4, Math.round(300 / ckm));
    for (let n0 = 0; n0 < CN; n0++) { if (!bkAll[n0] || seen[n0]) continue; const st2 = [n0], cells = []; seen[n0] = 1;
      while (st2.length) { const n = st2.pop(); cells.push(n); const i = ci(n), j = cj(n); for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a; if (bkAll[m] && !seen[m]) { seen[m] = 1; st2.push(m); } } }
      if (cells.length < minLen) for (const n of cells) { bkAll[n] = 0; bk[n] = 0; } } }
  // distance from each kind of border, in km (on the coarse grid)
  const distTo = test => { const D = new Float64Array(CN).fill(1e9), q = []; for (let n = 0; n < CN; n++) if (test(n)) { D[n] = 0; q.push(n); } for (let h = 0; h < q.length; h++) { const n = q[h], i = ci(n), j = cj(n); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a; if (D[m] > D[n] + ckm) { D[m] = D[n] + ckm; q.push(m); } } } return D; };
  const dAny = distTo(n => bkAll[n] > 0), dSub = distTo(n => bkAll[n] === BORDER.subduction && over[n] > 0), dCol = distTo(n => bkAll[n] === BORDER.collision), dRift = distTo(n => bkAll[n] === BORDER.rift), dArc = distTo(n => bkAll[n] === BORDER.arc || (bkAll[n] === BORDER.subduction && over[n] < 0));
  const hotSet = new Set(hotC);
  const dHot = distTo(n => hotSet.has(n)), volc = (vols || []).map(v => [I(v), J(v)]);
  // the plates: middle, heading, speed (the Earth's run from 1 to 10 cm a year), kind
  const PL = plates.map(() => ({ x: 0, y: 0, n: 0, cont: 0 }));
  for (let n = 0; n < CN; n++) { const p = PL[plate[n]]; if (!p) continue; p.x += ci(n); p.y += cj(n); p.n++; if (crust[n] === 1) p.cont++; }
  let vmax = 1e-9; for (const p of plates) vmax = Math.max(vmax, Math.hypot(p.vx, p.vy));
  const plateList = plates.map((p, k) => { const q = PL[k]; if (!q.n) return null; return { id: k, at: [Math.round((q.x / q.n + .5) * f * G.cell0 || 0), 0], cx: q.x / q.n, cy: q.y / q.n, dir: Math.round(Math.atan2(-p.vy, p.vx) * 180 / Math.PI), speed: Math.round(1 + 9 * Math.hypot(p.vx, p.vy) / vmax), kind: q.cont > q.n * .4 ? "continental" : "oceanic", share: Math.round(q.n / CN * 1000) / 10 }; }).filter(Boolean);
  // the rocks, cell by cell
  const rocks = new Uint8Array(N), acc = eco && eco.acc, P = eco && eco.P, T = eco && eco.T;
  const accBig = Math.max(30, N * .0025);
  const meanE = Float32Array.from(E, v => Math.max(0, v)); box(meanE, cols, rows, Math.max(4, Math.round(150 / cellKm)), 2);
  const slope = n => { const i = I(n), j = J(n); let s = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; s = Math.max(s, Math.abs(E[b * cols + a] - E[n])); } return s / (cellKm * 1000); };
  const why = new Uint8Array(N);   // 1 arc, 2 hotspot, 3 rift, 4 collision core, 5 old belt
  // (the patches sized to the world: a hundred or so km on a regional map, a thousand or more on a planet)
  const PS = Math.max(1, cols * cellKm / 3200);
  for (let n = 0; n < N; n++) {
    if (!isLand[n] || lake[n]) continue;
    const c = toC(n), e = E[n], i = I(n), j = J(n), x = i * cellKm, y = j * cellKm, pn = fbm(x / (140 * PS), y / (140 * PS), seed + 3);
    // (each distance wavered, so the rocks' edges wander as geological maps' do rather than run in straight lines)
    const wv = .7 + .6 * fbm(x / (90 * Math.sqrt(PS)), y / (90 * Math.sqrt(PS)), seed + 7), dS = dSub[c] * wv, dH = dHot[c] * wv, dR = dRift[c] * wv, dA = dArc[c] * wv, dC = dCol[c] * wv, dN = dAny[c] * wv;
    const nearVol = volc.some(([a, b]) => Math.hypot(a - i, b - j) * cellKm < 90);
    const arcSide = dS > 90 && dS < 260 && crust[c] === 1, islandArc = crust[c] === 2 || dA < 100;
    let r;
    if (nearVol || islandArc || (arcSide && pn > .45) || dH < 110 || (dR < 90 && pn > .45)) { r = ROCK.volcanic; why[n] = dH < 110 ? 2 : dR < 90 ? 3 : 1; }
    else if (e > 2400 || (dC < 200 && e > 1200)) { r = ROCK.granite; why[n] = 4; }
    else if (oldB[c] > .12 && e > 250) { r = ROCK.granite; why[n] = 5; }
    else if (e > 900 && dN < 600) r = ROCK.folded;
    else if (acc && acc[n] > accBig * 2.5 && slope(n) < .006 && e < 400) r = ROCK.alluvium;
    else if (crust[c] === 1 && dN > Math.min(700, Math.max(cols, rows) * cellKm * .12) && meanE[n] > 150 && pn > .3) r = ROCK.shield;
    else {
      // (in the warm, once-shallow seas by the coasts and on low plateaus, limestone; elsewhere sand and mud)
      const warm = T ? smooth(8, 18, T[n]) : .5, lp = fbm(x / (220 * PS), y / (220 * PS), seed + 11);
      r = lp * (.6 + .6 * warm) > .62 && e < 1200 ? ROCK.limestone : ROCK.sedimentary;
    }
    rocks[n] = r;
  }
  // (the rocks as a geological map shows them: in regions, not cell by cell: each cell takes the commonest rock about
  // it, the volcanoes' and the rivers' own kept)
  { const r2 = Uint8Array.from(rocks), R = 2;
    for (let n = 0; n < N; n++) { if (!rocks[n] || rocks[n] === ROCK.volcanic && why[n] !== 1 || rocks[n] === ROCK.alluvium) continue; const i = I(n), j = J(n), cnt = new Uint8Array(8); for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; cnt[rocks[b * cols + a]]++; } let best = rocks[n], bc = 0; for (let k = 1; k < 8; k++) if (cnt[k] > bc) { bc = cnt[k]; best = k; } r2[n] = best; }
    rocks.set(r2); }
  // what lies in the rocks: each kind scored where the Earth makes it, the best few kept, apart from each other
  const cand = { copper: [], gold: [], silver: [], iron: [], tin: [], gems: [], leadzinc: [], coal: [], oil: [], salt: [], hotspring: [], caves: [] };
  const playaSet = new Set(playa || []);
  for (let n = 0; n < N; n += 1) {
    if (!isLand[n] || lake[n]) continue; const r = rocks[n], c = toC(n), e = E[n], i = I(n), j = J(n), jit = hash(i, j, seed + 29) * .25, p = P ? P[n] : 700;
    if (r === ROCK.volcanic && why[n] === 1 && crust[c] === 1) cand.copper.push([n, 1 + jit, "copper in the roots of old volcanoes above a sinking ocean plate (porphyry copper, as in Chile)"]);
    if (r === ROCK.volcanic && why[n] === 1) cand.gold.push([n, .8 + jit, "gold carried up by hot fluids under the arc volcanoes (as in Nevada and Papua)"]);
    if (r === ROCK.shield) { cand.gold.push([n, .7 + jit, "gold in the ancient shield's greenstone belts (as at Kalgoorlie)"]); cand.iron.push([n, 1 + jit, "iron in banded rock laid down in the planet's first oceans (as in the Pilbara)"]); }
    if (r === ROCK.granite && why[n] === 4) { cand.tin.push([n, .8 + jit, "tin in granite cooled deep under the colliding mountains (as in Cornwall)"]); cand.gems.push([n, .7 + jit, "rubies and sapphires in rock baked by the collision of continents (as in Burma)"]); }
    if (r === ROCK.granite && why[n] === 5) cand.gems.push([n, .9 + jit, "gems in the worn roots of an old mountain range"]);
    if (r === ROCK.limestone && e > 300 && dAny[c] < 900) cand.leadzinc.push([n, .8 + jit, "lead, zinc and silver laid in limestone by brines from the mountains (as in the Ozarks)"]);
    if (r === ROCK.volcanic && why[n] === 1 && e > 1500) cand.silver.push([n, .7 + jit, "silver veins in the high volcanic ranges (as at Potosí)"]);
    if (r === ROCK.sedimentary && e < 800 && p > 700 && meanE[n] < 700) cand.coal.push([n, .6 + p / 3000 + jit, "coal from the swamp forests that once covered this wet lowland basin"]);
    if ((r === ROCK.sedimentary || r === ROCK.alluvium) && e < 300 && e - meanE[n] < 20) cand.oil.push([n, .7 + (acc && acc[n] > accBig * 4 ? .4 : 0) + jit, "oil and gas in the deep sand and mud of a sinking basin" + (acc && acc[n] > accBig * 4 ? " under an old delta (as in the Niger delta)" : "")]);
    if (playaSet.has(n) || (eco && eco.AI && eco.AI[n] < .2 && e - meanE[n] < -60)) cand.salt.push([n, 1 + jit, "salt from water that dried away in a basin with no outlet (as at the Great Salt Lake)"]);
    if ((r === ROCK.volcanic && (why[n] === 2 || why[n] === 3 || volc.some(([a, b]) => Math.hypot(a - i, b - j) * cellKm < 60)))) cand.hotspring.push([n, .8 + jit, why[n] === 3 ? "hot springs where the land is tearing apart (as in the Rift Valley)" : "hot springs and geysers over molten rock (as at Yellowstone and Iceland)"]);
    if (r === ROCK.limestone && p > 800 && e > 100) cand.caves.push([n, .6 + p / 4000 + jit, "caves dissolved in limestone by the rain (karst, as in Kentucky's Mammoth Cave)"]);
  }
  const NAMES = { copper: "Copper", gold: "Gold", silver: "Silver", iron: "Iron", tin: "Tin", gems: "Gems", leadzinc: "Lead and zinc", coal: "Coal", oil: "Oil and gas", salt: "Salt", hotspring: "Hot springs", caves: "Caves" };
  const deposits = [], cell = G.cell0 || 4, apart = Math.max(8, Math.round(Math.max(cols, rows) * .06));
  for (const [kind, list] of Object.entries(cand)) {
    list.sort((a, b) => b[1] - a[1]); const got = [];
    for (const [n, , reason] of list) { if (got.length >= 3) break; if (got.some(m => Math.hypot(I(m) - I(n), J(m) - J(n)) < apart)) continue; if (deposits.some(d => Math.hypot(d.i - I(n), d.j - J(n)) < apart * .25)) continue; got.push(n); deposits.push({ kind, name: NAMES[kind], i: I(n), j: J(n), at: [Math.round((I(n) + .5) * cell), Math.round((J(n) + .5) * cell)], why: reason }); }
  }
  // the plate layer, on a grid of at most 320 across
  const st = Math.max(1, Math.ceil(cc / 320)), gc = Math.ceil(cc / st), gr = Math.ceil(cr / st), PG = new Uint8Array(gc * gr), BG = new Uint8Array(gc * gr);
  for (let j = 0; j < gr; j++) for (let i = 0; i < gc; i++) { const n = Math.min(cr - 1, j * st) * cc + Math.min(cc - 1, i * st); PG[j * gc + i] = plate[n]; let b = 0; for (let dj = 0; dj < st && !b; dj++) for (let di = 0; di < st; di++) { const a = i * st + di, y = j * st + dj; if (a < cc && y < cr && bk[y * cc + a]) { b = bk[y * cc + a]; break; } } BG[j * gc + i] = b; }
  const unit = f * cell;
  for (const p of plateList) p.at = [Math.round((p.cx + .5) * unit), Math.round((p.cy + .5) * unit)];
  return { layer: { cols: gc, rows: gr, step: st * unit, plate: b64(PG), border: b64(BG), plates: plateList.map(({ cx, cy, ...p }) => p) }, rocks, deposits: deposits.map(({ i, j, ...d }) => d), BORDER, ROCK };
}
function b64(u) { return typeof Buffer !== "undefined" ? Buffer.from(u).toString("base64") : btoa(String.fromCharCode.apply(null, u)); }
function box(F, cols, rows, r, passes) {
  const t = new Float32Array(F.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) { let a = 0; const o = j * cols; for (let i = -r; i < cols + r; i++) { if (i + r < cols && i + r >= 0) a += F[o + i + r]; if (i - r - 1 >= 0 && i - r - 1 < cols) a -= F[o + i - r - 1]; if (i >= 0 && i < cols) t[o + i] = a / (2 * r + 1); } }
    for (let i = 0; i < cols; i++) { let a = 0; for (let j = -r; j < rows + r; j++) { if (j + r < rows && j + r >= 0) a += t[(j + r) * cols + i]; if (j - r - 1 >= 0 && j - r - 1 < rows) a -= t[(j - r - 1) * cols + i]; if (j >= 0 && j < rows) F[j * cols + i] = a / (2 * r + 1); } }
  }
}
module.exports = { tectonics, BORDER, ROCK };
