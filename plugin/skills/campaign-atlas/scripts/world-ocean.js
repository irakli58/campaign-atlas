/* Campaign Atlas: the oceans' currents and their warmth, from the world's own winds, basins and rotation (the user,
   27 Oct 2026: "realistic ocean currents based on the world's geography, equator, latitude, winds, and planetary
   rotation ... these currents should influence the world's climate, coastal environments, beaches, and biomes";
   docs/requests/2026-10-27-ocean-currents.md). A simplified, textbook model, worked on the generated map itself:
     - the winds: the planet's belts (trade winds, westerlies, polar easterlies, from the Hadley, Ferrel and polar
       cells), and round each ocean's subtropical high (the sea is cooler than the land in summer, so the highs sit over
       the oceans) the winds turn equatorward along the oceans' eastern sides;
     - the wind-driven circulation (Stommel 1948): r∇²ψ + β ∂ψ/∂x = curl τ, solved on each basin with the coasts as
       walls. Its answer is the gyres: clockwise in the northern subtropics, anticlockwise in the southern (for a planet
       turning as the Earth does), subpolar gyres the other way, a slow equatorward drift across each ocean (Sverdrup's
       balance) and a fast, narrow current up its western side, because the Coriolis force grows toward the poles
       (β = df/dy > 0): the Gulf Stream, the Kuroshio. A planet turning the other way mirrors all of it;
     - a current round the world where a band of latitude in the westerlies is open sea all the way round (the
       Antarctic Circumpolar Current): only on a whole planet, whose map wraps east to west;
     - Ekman transport (the surface water moves to the right of the wind in the north, to the left in the south): where
       it diverges, deep cold water wells up: along eastern boundaries under the equatorward winds (California, Peru,
       the Canary Islands, Namibia) and along the equator under the trades;
     - the sea's warmth: each latitude's own (the sun's), carried along by the currents, cooled where water wells up,
       and losing its difference to the air as it goes (so a current is warm where it brings water from lower latitudes,
       cold where it brings it from higher ones: the direction comes first, the warmth after); sea ice where it freezes;
     - nutrients for life in the sea: upwelling, cold water and river mouths.
   The deep, density-driven (thermohaline) circulation is not modelled as such; its main effect at the surface, warm
   water carried far poleward into an ocean open to the pole, follows from the western currents and the mixing.
   The answer goes to the climate (world-geology.js climateEarth: the sea's warmth sets the air's water, cold water
   steadies it into fog and drought, warm water warms the coasts), to the coasts and beaches (world-coast.js) and to
   the map (a layer of currents the referee can show or hide). */
"use strict";
const gauss = v => Math.exp(-v * v), smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// the zonal wind's stress by latitude (degrees, either hemisphere): calm at the equator, the trades from the east
// strongest near 15°, calm in the horse latitudes at 30°, the westerlies strongest near 45°, calm near 60°, the polar
// easterlies beyond. (rot: the planet's turning; a planet turning the other way has its belts mirrored)
function zonalStress(a) { return a < 60 ? .9 * Math.sin(Math.PI * (a - 30) / 30) : -.35 * Math.sin(Math.PI * (a - 60) / 30); }

// E: heights in m (sea <= 0) on cols x rows; o: { lat: [top, bottom] degrees, km (across), whole (wraps east-west),
// rotation (1 as the Earth, -1 the other way; its size scales β), lakes (1 where water is a lake) }
function ocean(E, cols, rows, o) {
  const N = cols * rows, [la, lb] = o.lat, rot = o.rotation == null ? 1 : Math.sign(o.rotation) || 1, spin = Math.abs(o.rotation || 1);
  // a coarser grid to solve on (about 240 across), padded with open sea round a regional map so its edges are no walls
  const f = Math.max(1, Math.round(cols / 240)), wrap = !!o.whole, pad = wrap ? 0 : Math.round(cols / f * .25);
  const ic = Math.ceil(cols / f), jc = Math.ceil(rows / f), C = ic + 2 * pad, R = jc + 2 * pad, M = C * R;
  const latOf = j => { const t = (j - pad + .5) / jc; return la + (lb - la) * t; };   // padded rows run on beyond the sheet
  const sea = new Uint8Array(M);
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    const n = j * C + i, I = i - pad, J = j - pad;
    if (I < 0 || J < 0 || I >= ic || J >= jc) { sea[n] = 1; continue; }
    let w = 0, c = 0; for (let dj = 0; dj < f; dj++) for (let di = 0; di < f; di++) { const x = I * f + di, y = J * f + dj; if (x < cols && y < rows) { c++; if (E[y * cols + x] <= 0 && !(o.lakes && o.lakes[y * cols + x])) w++; } }
    sea[n] = w > c * .5 ? 1 : 0;
  }
  // (only the sea joined to the open ocean circulates: lakes and land-locked puddles do not)
  { const reach = new Uint8Array(M), st = []; for (let n = 0; n < M; n++) { const i = n % C, j = (n / C) | 0; if (sea[n] && (!j || j === R - 1 || (!wrap && (!i || i === C - 1)))) { reach[n] = 1; st.push(n); } }
    if (!st.length) for (let n = 0; n < M; n++) if (sea[n]) { reach[n] = 1; st.push(n); break; }
    while (st.length) { const n = st.pop(), i = n % C, j = (n / C) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let a = i + di; const b = j + dj; if (wrap) a = (a + C) % C; if (a < 0 || b < 0 || a >= C || b >= R) continue; const m = b * C + a; if (sea[m] && !reach[m]) { reach[m] = 1; st.push(m); } } }
    for (let n = 0; n < M; n++) sea[n] = reach[n]; }
  const at = (i, j) => { if (wrap) i = (i + C) % C; return i < 0 || j < 0 || i >= C || j >= R ? -1 : j * C + i; };
  // the winds: the belts, and the turn of the winds round each ocean's high
  const cellKm = (o.km || 3200) / cols * f, oceanFrac = new Float32Array(M);
  for (let n = 0; n < M; n++) oceanFrac[n] = sea[n];
  blurW(oceanFrac, C, R, Math.max(3, Math.round(1600 / cellKm)), 2, wrap);
  const P = new Float32Array(M);
  for (let j = 0; j < R; j++) { const a = Math.abs(latOf(j)); for (let i = 0; i < C; i++) P[j * C + i] = gauss((a - 30) / 11) * (oceanFrac[j * C + i] - .5); }
  const tx = new Float32Array(M), ty = new Float32Array(M);
  for (let j = 0; j < R; j++) {
    const L = latOf(j), a = Math.abs(L), fc = rot * Math.sin(L * Math.PI / 180), fcl = Math.sign(fc || 1) * Math.max(Math.abs(fc), .25);
    for (let i = 0; i < C; i++) {
      const n = j * C + i, e = at(i + 1, j), w = at(i - 1, j), up = at(i, j - 1), dn = at(i, j + 1);
      const dPx = ((e >= 0 ? P[e] : P[n]) - (w >= 0 ? P[w] : P[n])) / 2, dPy = ((up >= 0 ? P[up] : P[n]) - (dn >= 0 ? P[dn] : P[n])) / 2;   // y north
      // (geostrophic: round a high clockwise in the north (for the Earth's turning), anticlockwise in the south)
      const gu = -dPy / fcl * 6, gv = dPx / fcl * 6;
      tx[n] = rot * zonalStress(a) + gu; ty[n] = gv;
    }
  }
  // the wind-driven circulation: Stommel's equation by successive over-relaxation, the β term upwinded toward the side
  // the boundary current forms on (west for the Earth's turning, east for the other)
  const psi = new Float64Array(M), F = new Float64Array(M), B = new Float64Array(R);
  for (let j = 0; j < R; j++) B[j] = rot * .45 * spin * Math.cos(latOf(j) * Math.PI / 180);
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    const n = j * C + i; if (!sea[n]) continue; const up = at(i, j - 1), dn = at(i, j + 1);
    // curl τ = ∂τy/∂x - ∂τx/∂y (y north: the row above is j - 1)
    const e = at(i + 1, j), w = at(i - 1, j);
    F[n] = ((e >= 0 ? ty[e] : ty[n]) - (w >= 0 ? ty[w] : ty[n])) / 2 - ((up >= 0 ? tx[up] : tx[n]) - (dn >= 0 ? tx[dn] : tx[n])) / 2;
  }
  const r = 1, om = 1.6;
  for (let it = 0; it < 900; it++) {
    for (let j = 1; j < R - 1; j++) for (let i = 0; i < C; i++) {
      const n = j * C + i; if (!sea[n]) continue;
      const v = k => k >= 0 && sea[k] ? psi[k] : 0, e = at(i + 1, j), w = at(i - 1, j), b = B[j];
      const nb = v(e) + v(w) + v(at(i, j - 1)) + v(at(i, j + 1));
      const val = b >= 0 ? (r * nb + b * v(e) - F[n]) / (4 * r + b) : (r * nb - b * v(w) - F[n]) / (4 * r - b);
      psi[n] += om * (val - psi[n]);
    }
  }
  // the currents: u east, v north
  const u = new Float32Array(M), v = new Float32Array(M), pv = k => k >= 0 && sea[k] ? psi[k] : 0;
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) { const n = j * C + i; if (!sea[n]) continue; u[n] = -(pv(at(i, j - 1)) - pv(at(i, j + 1))) / 2; v[n] = (pv(at(i + 1, j)) - pv(at(i - 1, j))) / 2; }
  // the current round the world, where the westerlies blow over a band of open sea all the way round
  const circum = [];
  if (wrap) for (let j = 0; j < R; j++) { const a = Math.abs(latOf(j)); if (a < 35 || a > 70) continue; let s = 0; for (let i = 0; i < C; i++) s += sea[j * C + i]; if (s >= C * .985) circum.push(j); }
  if (circum.length >= 2) { let mx = 0; for (let n = 0; n < M; n++) mx = Math.max(mx, Math.hypot(u[n], v[n])); for (const j of circum) { const a = Math.abs(latOf(j)), k = mx * .55 * Math.max(0, zonalStress(a)) * rot; for (let i = 0; i < C; i++) u[j * C + i] += k; } }
  // (a little of the wind's own drift on the surface)
  { let mx = 1e-9; for (let n = 0; n < M; n++) mx = Math.max(mx, Math.hypot(u[n], v[n])); for (let n = 0; n < M; n++) { if (!sea[n]) continue; u[n] = u[n] / mx + .06 * tx[n]; v[n] = v[n] / mx + .06 * ty[n]; } }
  // Ekman transport, and where it pulls apart, upwelling (the sea's edge lets no water through)
  const mx = new Float32Array(M), my = new Float32Array(M), upw = new Float32Array(M);
  for (let j = 0; j < R; j++) { const fc = rot * Math.sin(latOf(j) * Math.PI / 180), fcl = Math.sign(fc || 1) * Math.max(Math.abs(fc), .12); for (let i = 0; i < C; i++) { const n = j * C + i; if (!sea[n]) continue; mx[n] = ty[n] / fcl; my[n] = -tx[n] / fcl; } }
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    const n = j * C + i; if (!sea[n]) continue; const g = (k, A) => k >= 0 && sea[k] ? A[k] : 0;
    const div = (g(at(i + 1, j), mx) - g(at(i - 1, j), mx)) / 2 + (g(at(i, j - 1), my) - g(at(i, j + 1), my)) / 2;
    upw[n] = Math.max(0, div);
  }
  blurW(upw, C, R, 1, 1, wrap); { const s = Array.from(upw).filter(x => x > 0).sort((a, b) => a - b), ref = s[Math.floor(s.length * .97)] || 1; for (let n = 0; n < M; n++) upw[n] = Math.min(1, upw[n] / ref); }
  // the sea's warmth: each latitude's, carried by the currents (followed back along them), cooled by upwelling, and
  // giving its difference up to the air as it goes
  const Teq = j => 28 - .0058 * latOf(j) ** 2, sst = new Float32Array(M);
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) sst[j * C + i] = Teq(j);
  let umax = .2; for (let n = 0; n < M; n++) umax = Math.max(umax, Math.abs(u[n]));
  const sp = 2.2 / umax;
  for (let it = 0; it < 160; it++) {
    const nt = Float32Array.from(sst);
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const n = j * C + i; if (!sea[n]) continue;
      const x = i - u[n] * sp, y = j + v[n] * sp, x0 = Math.floor(x), y0 = Math.floor(y), tX = x - x0, tY = y - y0;
      const s = (a, b) => { const k = at(a, Math.max(0, Math.min(R - 1, b))); return k >= 0 && sea[k] ? sst[k] : sst[n]; };
      const back = (s(x0, y0) * (1 - tX) + s(x0 + 1, y0) * tX) * (1 - tY) + (s(x0, y0 + 1) * (1 - tX) + s(x0 + 1, y0 + 1) * tX) * tY;
      nt[n] = back + (Teq(j) - 7 * upw[n] - back) * .045;
    }
    sst.set(nt);
  }
  // back onto the map's own grid
  const sample = (A, x, y) => { const gi = x / f + pad - .5, gj = y / f + pad - .5, i0 = Math.floor(gi), j0 = Math.floor(gj), tX = gi - i0, tY = gj - j0; const g = (a, b) => { const k = at(a, Math.max(0, Math.min(R - 1, b))); return k >= 0 ? A[k] : 0; }; return (g(i0, j0) * (1 - tX) + g(i0 + 1, j0) * tX) * (1 - tY) + (g(i0, j0 + 1) * (1 - tX) + g(i0 + 1, j0 + 1) * tX) * tY; };
  const SST = new Float32Array(N), UP = new Float32Array(N), ANOM = new Float32Array(N), ICE = new Uint8Array(N), lat = j => la + (lb - la) * (j + .5) / rows;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = y * cols + x; SST[n] = sample(sst, x + .5, y + .5); UP[n] = sample(upw, x + .5, y + .5);
    ANOM[n] = SST[n] - (28 - .0058 * lat(y) ** 2); if (E[n] <= 0 && SST[n] < -1.2) ICE[n] = 1;
  }
  // the named currents and gyres, for the map: each gyre's middle (an extreme of ψ) and the strongest flows
  const out = { f, pad, C, R, u, v, sst, sea, upw, psi, latOf, SST, UP, ANOM, ICE, circum: circum.length >= 2 };
  out.layer = currentLayer(out, cols, rows, o);
  return out;
}

// what the map draws: the flow on a coarse grid (east and north, -127..127), its warmth against the latitude's
// (-127..127, tenths of a degree), the gyres, the equator and latitudes
function currentLayer(O, cols, rows, o) {
  const { f, pad, C, R, u, v, sst, sea, psi, latOf } = O, step = Math.max(1, Math.round(Math.max(C - 2 * pad, 1) / 120));
  const gc = Math.ceil((C - 2 * pad) / step), gr = Math.ceil((R - 2 * pad) / step), U = new Int8Array(gc * gr), V = new Int8Array(gc * gr), W = new Int8Array(gc * gr);
  let mx = 1e-9; for (let n = 0; n < u.length; n++) if (sea[n]) mx = Math.max(mx, Math.hypot(u[n], v[n]));
  for (let j = 0; j < gr; j++) for (let i = 0; i < gc; i++) {
    const a = pad + i * step, b = pad + j * step, n = b * C + a, k = j * gc + i; if (b >= R || a >= C || !sea[n]) continue;
    U[k] = Math.round(Math.max(-127, Math.min(127, u[n] / mx * 127))); V[k] = Math.round(Math.max(-127, Math.min(127, v[n] / mx * 127)));
    W[k] = Math.round(Math.max(-127, Math.min(127, (sst[n] - (28 - .0058 * latOf(b) ** 2)) * 10)));
  }
  // gyres: the strongest extremes of ψ, at least a fifth of the strongest, apart from each other
  const gy = [], cand = [];
  for (let j = pad; j < R - pad; j++) for (let i = pad; i < C - pad; i++) { const n = j * C + i; if (sea[n]) cand.push(n); }
  let pm = 1e-9; for (const n of cand) pm = Math.max(pm, Math.abs(psi[n]));
  cand.sort((a, b) => Math.abs(psi[b]) - Math.abs(psi[a]));
  for (const n of cand) { if (Math.abs(psi[n]) < pm * .2 || gy.length >= 10) break; const i = n % C, j = (n / C) | 0; if (gy.some(g => Math.hypot(g.i - i, g.j - j) < (C - 2 * pad) * .14)) continue; gy.push({ i, j, s: psi[n] }); }
  const gyres = gy.map(g => ({ at: [Math.round(((g.i - pad + .5) * f) * (o.cell || 4)), Math.round(((g.j - pad + .5) * f) * (o.cell || 4))], spin: g.s * (o.rotation == null ? 1 : Math.sign(o.rotation)) > 0 ? "clockwise" : "anticlockwise", strength: Math.round(Math.abs(g.s) / pm * 100) / 100, lat: Math.round(latOf(g.j)) }));
  // the great currents: where the flow is strongest, gathered into streams, each with its way, its warmth, its strength
  const sp = new Float32Array(gc * gr); for (let k = 0; k < sp.length; k++) sp[k] = Math.hypot(U[k], V[k]);
  const sorted = Array.from(sp).filter(x => x > 0).sort((a, b) => a - b), thr = Math.max(25, sorted[Math.floor(sorted.length * .9)] || 25), seen = new Uint8Array(gc * gr), cur = [];
  for (let k0 = 0; k0 < sp.length; k0++) {
    if (seen[k0] || sp[k0] < thr) continue; const st = [k0], cells = []; seen[k0] = 1;
    while (st.length) { const k = st.pop(); cells.push(k); const i = k % gc, j = (k / gc) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= gc || b >= gr) continue; const m = b * gc + a; if (!seen[m] && sp[m] >= thr && U[m] * U[k] + V[m] * V[k] > 0) { seen[m] = 1; st.push(m); } } }
    if (cells.length < 4) continue; let x = 0, y = 0, uu = 0, vv = 0, w = 0, s2 = 0; for (const k of cells) { x += k % gc; y += (k / gc) | 0; uu += U[k]; vv += V[k]; w += W[k]; s2 += sp[k]; }
    const n = cells.length, cell = o.cell || 4, mid = cells.reduce((b, k) => Math.hypot((k % gc) - x / n, ((k / gc) | 0) - y / n) < Math.hypot((b % gc) - x / n, ((b / gc) | 0) - y / n) ? k : b, cells[0]);
    cur.push({ at: [Math.round(((mid % gc) + .5) * step * f * cell), Math.round((((mid / gc) | 0) + .5) * step * f * cell)], dir: Math.round(Math.atan2(-vv, uu) * 180 / Math.PI), warm: Math.round(w / n) / 10, strength: Math.round(s2 / n / 127 * 100) / 100, size: n });
  }
  cur.sort((a, b) => b.size * b.strength - a.size * a.strength);
  const currents = cur.slice(0, 10).map(c => ({ at: c.at, dir: c.dir, warm: c.warm, strength: c.strength }));
  const b64 = A => Buffer.from(new Uint8Array(A.buffer)).toString("base64");
  return { cols: gc, rows: gr, step: step * f * (o.cell || 4), u: b64(U), v: b64(V), warm: b64(W), gyres, currents, lat: o.lat, circum: O.circum };
}

function blurW(F, cols, rows, r, passes, wrap) {
  const t = new Float32Array(F.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { let a = i + k; if (wrap) a = (a + cols) % cols; if (a >= 0 && a < cols) { s += F[j * cols + a]; c++; } } t[j * cols + i] = s / c; }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const b = j + k; if (b >= 0 && b < rows) { s += t[b * cols + i]; c++; } } F[j * cols + i] = s / c; }
  }
}

module.exports = { ocean, zonalStress };
