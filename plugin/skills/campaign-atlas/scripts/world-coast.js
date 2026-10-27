/* How the coasts formed (the user asked, 27 Oct 2026, for "scientifically accurate sandy beaches": beaches that "appear
   because the geographical conditions support their formation"; the request in full is the app's
   docs/requests/2026-10-27-beaches.md). On trial until the user approves it (`--coast natural`). A simplified model of
   what coastal geologists describe (the sediment budget of a littoral cell):
   - sand has to come from somewhere: the rivers bring most of it (in proportion to the water they drain, more from dry
     land's bare slopes), cliffs the waves wear down give some, warm reefs make white carbonate sand, volcanoes black
     sand, and cold glaciated coasts gravel;
   - the waves come from the winds: the storm waves of the westerlies, the trades' steadier waves, and the long swell
     the westerlies send toward the equator; a coast gets the waves it faces, the more the longer the open sea upwind
     of it (the fetch), and a bay sheltered from them gets little;
   - the waves move the sand along the shore (longshore drift), the more the more slantwise they strike it (the CERC
     relation: as sin 2θ), and drop it where they weaken or the drift slows or two drifts meet: in bays, behind
     headlands, at the end of a coast;
   - what stands there then follows: a beach as wide as the sand that stays and the shelf allows (wide on a gentle shelf,
     narrow before a steep one); bare rock and cliffs where the land is steep and little sand stays; salt marsh, or
     mangroves in the tropics, on sheltered low shores where rivers bring mud; dunes behind a wide beach where the wind
     blows onshore and the land is not too wet; barrier islands with lagoons behind them on very shallow shelves with
     sand to spare; spits where the drift runs off the end of a coast into shallow water.
   Plain code with no page in it: world-invent.js runs it after the rivers. */
"use strict";
const { wind } = require("./world-ocean.js");
const R = (a, b, v) => Math.max(a, Math.min(b, v));
const gauss = v => Math.exp(-v * v);
// what each coast cell became: the low four bits the kind, the high four how wide (0 to 15)
const KIND = { sand: 1, gravel: 2, cliff: 3, rock: 4, marsh: 5, mangrove: 6, barrier: 7, dunes: 8, black: 9, white: 10, lagoon: 11 };

function coasts(H, cols, rows, o) {
  const N = cols * rows, sea = 128, cellKm = o.cellKm || 3, [la, lb] = o.lat || [52, 38], spin = o.spin < 0 ? -1 : 1, wrap = !!o.wrap;
  const latOf = j => la + (lb - la) * (j + .5) / rows;
  const at = (i, j) => { if (j < 0 || j >= rows) return -1; if (i < 0 || i >= cols) { if (!wrap) return -1; i = (i + cols) % cols; } return j * cols + i; };
  // the open sea: the water that reaches the sheet's edge (a lake's shore makes no beach of the sea's kind)
  const ocean = new Uint8Array(N), st = [];
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (H[n] <= sea && (i === 0 || j === 0 || i === cols - 1 || j === rows - 1)) { ocean[n] = 1; st.push(n); } }
  while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; for (const m of [at(i + 1, j), at(i - 1, j), at(i, j + 1), at(i, j - 1)]) if (m >= 0 && !ocean[m] && H[m] <= sea) { ocean[m] = 1; st.push(m); } }
  // the coast: land touching the open sea; its way out to sea (x east, y north) and along the shore
  const C = [], idx = new Int32Array(N).fill(-1);
  for (let n = 0; n < N; n++) { if (H[n] <= sea) continue; const i = n % cols, j = (n / cols) | 0; if ([at(i + 1, j), at(i - 1, j), at(i, j + 1), at(i, j - 1)].some(m => m >= 0 && ocean[m])) { idx[n] = C.length; C.push(n); } }
  const K = C.length, nx = new Float32Array(K), ny = new Float32Array(K);
  for (let k = 0; k < K; k++) { const n = C[k], i = n % cols, j = (n / cols) | 0; let sx = 0, sy = 0; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const m = at(i + di, j + dj); if (m >= 0 && ocean[m]) { sx += di; sy -= dj; } } const l = Math.hypot(sx, sy) || 1; nx[k] = sx / l; ny[k] = sy / l; }
  const step = (n, dx, dy, d) => at(Math.round(n % cols + dx * d), Math.round(((n / cols) | 0) - dy * d));
  // the shelf before it and the land behind it
  const shelf = new Float32Array(K), steep = new Float32Array(K);
  for (let k = 0; k < K; k++) {
    const n = C[k], off = [2, 4, 6].map(d => { const m = step(n, nx[k], ny[k], d); return m >= 0 ? H[m] : sea - 60; }), inl = [1, 2, 3].map(d => { const m = step(n, -nx[k], -ny[k], d); return m >= 0 ? H[m] : H[n]; });
    // (1 a broad shallow shelf, 0 deep water close in)
    shelf[k] = R(0, 1, ((off[0] + off[1] + off[2]) / 3 - (sea - 30)) / 28);
    // (how fast the land rises behind the shore, per km)
    steep[k] = R(0, 1, (Math.max(...inl) - H[n]) / (3 * cellKm) / .9 + (H[n] - 129) / 40);
  }
  // the waves: each wind's [toward the east, toward the north, how strong], at the coast's latitude
  const waves = phi => { const a = Math.abs(phi), s = Math.sign(phi) || 1, f = spin; const W = [[f, 0, gauss((a - 50) / 13)], [-f, -s * .35, .6 * gauss((a - 15) / 10)], [-f, 0, .3 * gauss((a - 70) / 8)], [f * .7, -s * .7, .35 * (1 - .6 * gauss((a - 50) / 12))]]; return W.map(([x, y, w]) => { const l = Math.hypot(x, y); return [x / l, y / l, w]; }); };
  // how much open sea lies upwind of a coast, in km (to 1500)
  const fetch = (n, wx, wy) => { let d = 0; for (let s = 1; s * cellKm < 1500; s++) { const m = step(n, -wx, -wy, s); if (m < 0) { d = 1500; break; } if (!ocean[m]) break; d = s * cellKm; } return d; };
  const E = new Float32Array(K), Q = new Float32Array(K), onshore = new Float32Array(K);
  for (let k = 0; k < K; k++) {
    const n = C[k], phi = latOf((n / cols) | 0), tx = -ny[k], ty = nx[k];
    for (const [wx, wy, s] of waves(phi)) {
      const e = Math.max(0, -(wx * nx[k] + wy * ny[k])); if (e < .02 || s < .02) continue;
      const fF = Math.min(1, Math.sqrt(fetch(n, wx, wy) / 800));
      E[k] += s * e * fF; Q[k] += s * fF * 2 * e * (wx * tx + wy * ty);
    }
    // (the sea is never still before an open coast: its own local waves, and swell bent round toward it, as much as open
    // sea lies before it)
    let open = 0; for (const a of [-1, -.5, 0, .5, 1]) { const c = Math.cos(a), sn = Math.sin(a), dx = nx[k] * c - ny[k] * sn, dy = nx[k] * sn + ny[k] * c; open += Math.min(1, fetch(n, -dx, -dy) / 400); }
    E[k] += .06 + .12 * open / 5;
    // (the wind that blows the sand inland: the belt's own wind, onto the coast or off it)
    const [ux, uy] = wind(phi, spin), ul = Math.hypot(ux, uy) || 1; onshore[k] = -(ux / ul * nx[k] + uy / ul * ny[k]);
  }
  // (wave energy measured against this world's own coasts: 1 a coast as exposed as the most exposed tenth)
  { const e90 = Math.max(.05, pct(Array.from(E), .9)); for (let k = 0; k < K; k++) E[k] /= e90; }
  // where the sand comes from
  const accRef = o.acc ? pct(C.map(n => o.acc[n]), .9) || 1 : 1, warmSea = n => o.sst ? o.sst[n] : 28 - .0058 * latOf((n / cols) | 0) ** 2;
  const supply = new Float32Array(K), kindOf = new Uint8Array(K), volc = new Set();
  for (const v of o.volcanoes || []) { const vi = v % cols, vj = (v / cols) | 0; for (let dj = -8; dj <= 8; dj++) for (let di = -8; di <= 8; di++) { const m = at(vi + di, vj + dj); if (m >= 0) volc.add(m); } }
  const src = { river: new Float32Array(K), cliff: new Float32Array(K), reef: new Float32Array(K) };
  for (let k = 0; k < K; k++) {
    const n = C[k], T = o.T ? o.T[n] : 12, ai = o.AI ? o.AI[n] : 1;
    const r = o.acc ? Math.pow(Math.max(0, o.acc[n]) / accRef, .8) * (ai < .5 ? 1.6 : 1) : 0;
    const c = .25 * E[k] * steep[k], reef = warmSea(n) >= 23 && shelf[k] > .5 ? .3 : 0;
    src.river[k] = r; src.cliff[k] = c; src.reef[k] = reef; supply[k] = r + c + reef;
    kindOf[k] = volc.has(n) ? KIND.black : reef > r + c ? KIND.white : T < 2 && steep[k] > .4 ? KIND.gravel : KIND.sand;
  }
  // which coast cell each one's drift runs into
  const down = new Int32Array(K).fill(-1);
  for (let k = 0; k < K; k++) {
    if (Math.abs(Q[k]) < .02) continue; const n = C[k], i = n % cols, j = (n / cols) | 0, s = Math.sign(Q[k]), dx = -ny[k] * s, dy = nx[k] * s;
    let best = -1, bv = .3; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const m = at(i + di, j + dj); if (m < 0 || idx[m] < 0) continue; const v = (di * dx - dj * dy) / Math.hypot(di, dj); if (v > bv) { bv = v; best = idx[m]; } }
    down[k] = best;
  }
  const feeds = new Uint8Array(K); for (let k = 0; k < K; k++) if (down[k] >= 0) feeds[down[k]]++;
  // the sand carried along the shore, round after round, and where it stays
  let sand = new Float32Array(K), next = new Float32Array(K); const D = new Float32Array(K);
  for (let round = 0; round < 140; round++) {
    next.fill(0);
    for (let k = 0; k < K; k++) {
      const s = sand[k] + supply[k] * .05; if (s <= 1e-6) continue;
      // (it stays where the waves are weak, where drifts meet, and where the drift slows on into the next cell)
      const slow = down[k] >= 0 ? Math.max(0, Math.abs(Q[k]) - Math.abs(Q[down[k]])) : .3;
      const dep = Math.min(.9, .05 + .28 * (1 - Math.min(1, E[k])) + (feeds[k] > 1 ? .2 : 0) + slow * .5 + (down[k] < 0 ? .25 : 0));
      const go = down[k] >= 0 ? Math.min(.85 - dep * .5, Math.abs(Q[k]) * .9) : 0;
      D[k] += s * dep; if (go > 0) next[down[k]] += s * go; next[k] += s * Math.max(0, 1 - dep - go);
    }
    const t = sand; sand = next; next = t;
  }
  for (let k = 0; k < K; k++) D[k] += sand[k];
  if (process.env.ATLAS_COAST_DEBUG) { const q = a => [.1, .25, .5, .75, .9].map(p => pct(Array.from(a), p).toFixed(3)).join(" "); console.log("E", q(E), "\nD", q(D), "\nshelf", q(shelf), "\nsteep", q(steep), "\nQ", q(Q.map(Math.abs)), "\nsupply", q(supply)); }
  // what each coast became
  const ref = pct(Array.from(D), .9) || 1, code = new Uint8Array(N), raise = [];
  const W = new Float32Array(K);
  for (let k = 0; k < K; k++) {
    // (a beach only where more sand stays than most of the coast keeps: about a third of the world's coasts are sandy,
    // the rest rock, cliff, gravel, marsh and mangrove, as the Earth's are)
    const n = C[k], T = o.T ? o.T[n] : 12, wn = D[k] / ref, w = wn < .55 || (steep[k] > .55 && E[k] > .8 && wn < .9) ? 0 : R(1, 15, Math.round((wn - .4) * 12 * (.5 + .5 * shelf[k]))); W[k] = w;
    let kind;
    if (w >= 1) kind = kindOf[k] === KIND.gravel || (E[k] > 1 && steep[k] > .55 && kindOf[k] === KIND.sand) ? KIND.gravel : kindOf[k];
    else if (E[k] < .22 && steep[k] < .3 && src.river[k] + (down[k] < 0 ? .2 : 0) > .05) kind = T > 20 ? KIND.mangrove : T > 2 ? KIND.marsh : KIND.rock;
    else kind = steep[k] > .45 ? KIND.cliff : KIND.rock;
    code[n] = kind | (w << 4);
  }
  // dunes behind wide beaches where the wind blows onshore and the land is not too wet
  for (let k = 0; k < K; k++) {
    const n = C[k], kind = code[n] & 15; if (![KIND.sand, KIND.white, KIND.black].includes(kind) || W[k] < 5 || onshore[k] < .2 || (o.AI && o.AI[n] > 1.4) || (o.T && o.T[n] < 0)) continue;
    for (let d = 1; d <= 1 + Math.floor(W[k] / 4); d++) { const m = step(n, -nx[k], -ny[k], d); if (m < 0 || H[m] <= sea || idx[m] >= 0 || H[m] > 150) break; code[m] = KIND.dunes | (Math.min(15, W[k]) << 4); }
  }
  // barrier islands, a lagoon behind each, on very shallow shelves with sand to spare; broken by inlets where rivers
  // come out and every so far along
  let barriers = 0, spits = 0;
  for (let k = 0; k < K; k++) {
    const n = C[k], kind = code[n] & 15; if (![KIND.sand, KIND.white].includes(kind) || W[k] < 7 || shelf[k] < .7 || E[k] < .2 || E[k] > 1.2) continue;
    if (src.river[k] > .5 || ((n * 2654435761) >>> 0) % 13 === 0) continue;
    const m1 = step(n, nx[k], ny[k], 1), m2 = step(n, nx[k], ny[k], 2), m3 = step(n, nx[k], ny[k], 3), m4 = step(n, nx[k], ny[k], 4);
    if ([m1, m2, m3, m4].some(m => m < 0 || !ocean[m]) || H[m3] < sea - 6) continue;
    raise.push(m3); code[m3] = KIND.barrier | (Math.min(15, W[k]) << 4); code[m1] = KIND.lagoon; code[m2] = KIND.lagoon; barriers++;
  }
  // spits: the drift running off the end of a coast carries its sand on into shallow water, curving landward
  for (let k = 0; k < K; k++) {
    if (down[k] >= 0 || Math.abs(Q[k]) < .2 || D[k] < ref * .6) continue;
    const n = C[k], s = Math.sign(Q[k]); let dx = -ny[k] * s, dy = nx[k] * s, x = n % cols, y = (n / cols) | 0; const len = Math.min(12, Math.round(D[k] / ref * 5));
    let made = 0;
    for (let d = 1; d <= len; d++) {
      x += dx; y -= dy; const m = at(Math.round(x), Math.round(y)); if (m < 0 || !ocean[m] || H[m] < sea - 8) break;
      raise.push(m); code[m] = KIND.barrier | (8 << 4); made++;
      // (the end hooks round toward the land, as the waves bend about it)
      const turn = .12; const ndx = dx * Math.cos(turn) - dy * Math.sin(turn) * s, ndy = dx * Math.sin(turn) * s + dy * Math.cos(turn); dx = ndx; dy = ndy;
    }
    if (made > 2) spits++;
  }
  // the beaches worth naming: the longest runs of sand, each with why it formed there
  const notes = [], seen = new Uint8Array(K);
  const isBeach = k => [KIND.sand, KIND.white, KIND.black, KIND.gravel].includes(code[C[k]] & 15) && W[k] >= 2;
  for (let k0 = 0; k0 < K; k0++) {
    if (seen[k0] || !isBeach(k0)) continue;
    const run = [k0]; seen[k0] = 1;
    for (let h = 0; h < run.length; h++) { const n = C[run[h]], i = n % cols, j = (n / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const m = at(i + di, j + dj); if (m < 0) continue; const q = idx[m]; if (q >= 0 && !seen[q] && isBeach(q)) { seen[q] = 1; run.push(q); } } }
    if (run.length < 8) continue;
    const sum = a => run.reduce((s, k) => s + a[k], 0), riv = sum(src.river), cl = sum(src.cliff), rf = sum(src.reef), q = sum(Q) / run.length, mid = run[Math.floor(run.length / 2)], n = C[mid];
    const facing = dir8(nx[mid], ny[mid]), driftTo = dir8(-ny[mid] * Math.sign(q), nx[mid] * Math.sign(q)), kinds = new Set(run.map(k => code[C[k]] & 15));
    const whiteRun = run.filter(k => (code[C[k]] & 15) === KIND.white).length > run.length / 2;
    const why = [whiteRun ? "white sand ground from the reefs of its warm, shallow sea" : riv >= cl ? "sand brought down by the rivers that reach the sea along it" : "sand the waves wear from the cliffs nearby"];
    if (Math.abs(q) > .15) why.push(`carried ${driftTo} along the shore by the waves striking it slantwise`);
    if (sum(E) / run.length < .3) why.push("laid down where the waves are weak, sheltered from the open sea"); else if (run.some(k => feeds[k] > 1 || down[k] < 0)) why.push("piled where the drift slows and stops");
    if (kinds.has(KIND.black)) why.push("black, from the volcano above it");
    const width = sum(W) / run.length, dunes = run.some(k => { const m = step(C[k], -nx[k], -ny[k], 1); return m >= 0 && (code[m] & 15) === KIND.dunes; });
    notes.push({ at: [n % cols, (n / cols) | 0], lat: Math.round(latOf((n / cols) | 0)), len: Math.round(run.length * cellKm), facing, width: Math.round(width), dunes, text: `a ${width > 8 ? "broad" : width > 4 ? "wide" : "narrow"} ${kinds.has(KIND.black) ? "black-sand" : whiteRun ? "white-sand" : kinds.has(KIND.gravel) && !kinds.has(KIND.sand) ? "gravel" : "sandy"} beach about ${Math.round(run.length * cellKm)} km long on a ${facing}-facing coast at ${Math.abs(Math.round(latOf((n / cols) | 0)))}°${latOf((n / cols) | 0) >= 0 ? "N" : "S"}: ${why.join("; ")}${dunes ? "; dunes behind it, the wind blowing onshore" : ""}` });
  }
  notes.sort((a, b) => b.len * b.width - a.len * a.width);
  const count = k => C.filter(n => (code[n] & 15) === k).length;
  return { code, raise, notes: notes.slice(0, 8), stats: { coast: K, sand: count(KIND.sand) + count(KIND.white) + count(KIND.black), gravel: count(KIND.gravel), cliff: count(KIND.cliff), rock: count(KIND.rock), marsh: count(KIND.marsh), mangrove: count(KIND.mangrove), barriers, spits } };
}
function pct(a, p) { if (!a.length) return 0; const b = Float64Array.from(a).sort(); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; }
const dir8 = (x, y) => ["east", "north-east", "north", "north-west", "west", "south-west", "south", "south-east"][Math.round(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360 / 45) % 8];

module.exports = { coasts, KIND };
