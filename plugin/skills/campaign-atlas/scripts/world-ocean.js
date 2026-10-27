/* The ocean's currents (the user asked, 27 Oct 2026: "realistic ocean currents based on the world's geography, equator,
   latitude, winds, and planetary rotation", which "should influence the world's climate, coastal environments,
   beaches, and biomes"; docs/requests/2026-10-27-ocean-currents.md in the app). A simplified model, as the Earth's
   textbook circulation is built:
   - the winds' push: the zonal belts (easterly trades to about 30°, westerlies to about 60°, polar easterlies beyond)
     and the trades' and the subtropical highs' equatorward flow;
   - the gyres: the wind-driven circulation of each basin by Stommel's model (r ∇²ψ + β ∂ψ/∂x = curl τ), solved over the
     real basins on a coarse grid with the coasts as walls. The planet's turning (β, the change of the Coriolis force
     with latitude) makes every gyre run strong and narrow on its basin's western side (the Gulf Stream, the Kuroshio)
     and broad and slow in the east; a planet turning the other way mirrors it. Water never crosses land;
   - where the ocean runs round the whole planet in a band of latitude with no land in it, the westerlies drive it right
     round (the Antarctic Circumpolar Current): the same equation gives it, with nothing to stop it;
   - Ekman's drift: the wind moves the surface water at right angles to itself (to the right in the north, to the left in
     the south); where that carries it away from a coast, cold deep water rises in its place (upwelling: the
     California, Humboldt, Canary and Benguela coasts), and along the equator the trades pull it apart (the cold tongue);
   - the sea's surface warmth: the warmth the latitude gives, carried by the currents (warm water poleward along the
     western boundaries, cold water equatorward in the east), cooled where water wells up, mixed, and losing its
     difference to the air over a few thousand km; sea ice where it is colder than seawater can stay liquid.
   Plain code with no page in it: world-geology.js runs it when the climate is the Earth's and currents are asked for. */
"use strict";
const R = (a, b, v) => Math.max(a, Math.min(b, v));
const gauss = v => Math.exp(-v * v);

// the winds' push at a latitude (degrees, north positive): [toward the east, toward the north]
function wind(phi, spin) {
  const a = Math.abs(phi);
  let tx = a < 30 ? -.75 * Math.cos(a * Math.PI / 60) : a < 60 ? Math.sin((a - 30) * Math.PI / 30) : -.3 * Math.sin((a - 60) * Math.PI / 30);
  // (the trades and the highs' eastern flanks blow toward the equator too)
  const ty = -Math.sign(phi) * .45 * gauss((a - 22) / 11);
  // (a planet turning the other way turns its winds' belts the other way round)
  if (spin < 0) tx = -tx;
  return [tx, ty];
}

/* E: heights (sea below 0), cols × rows; o.lat: [north edge, south edge] in degrees; o.wrap: the map goes right round
   (a whole planet); o.spin: 1 as the Earth turns, -1 the other way; o.warmC: the world's warmth shifted.
   Returns the coarse grid's currents (u, v as fractions of the strongest, the sea's warmth, upwelling, ice), the sea's
   warmth and its difference from the latitude's on the full grid, and the streams and gyres to draw. */
function currents(E, cols, rows, o) {
  o = o || {};
  const [la, lb] = o.lat || [52, 38], spin = o.spin < 0 ? -1 : 1, wrap = !!o.wrap;
  const f = Math.max(1, Math.round(cols / 200)), cc = Math.ceil(cols / f), rc = Math.ceil(rows / f);
  // (a region's sea goes on past the map's edges: the land and sea at each edge carried on outward, so the currents that
  // close a gyre out there are not squeezed against the map's frame)
  const P = wrap ? 0 : Math.max(8, Math.round(Math.max(cc, rc) * .3)), W = cc + 2 * P, H = rc + 2 * P, NC = W * H;
  const seaC = new Uint8Array(cc * rc);
  for (let j = 0; j < rc; j++) for (let i = 0; i < cc; i++) {
    let s = 0, t = 0; for (let b = j * f; b < Math.min(rows, (j + 1) * f); b++) for (let a = i * f; a < Math.min(cols, (i + 1) * f); a++) { t++; if (E[b * cols + a] <= 0) s++; }
    seaC[j * cc + i] = s >= t * .6 ? 1 : 0;
  }
  const S = new Uint8Array(NC);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const ci = R(0, cc - 1, i - P), cj = R(0, rc - 1, j - P); S[j * W + i] = seaC[cj * cc + ci]; }
  // the latitude of each row of the grid (beyond the map, as it would go on)
  const latOf = j => R(-89.5, 89.5, la + (lb - la) * ((j - P) * f + f / 2) / rows);
  const PHI = new Float64Array(H); for (let j = 0; j < H; j++) PHI[j] = latOf(j);
  const BETA = new Float64Array(H), FC = new Float64Array(H), TX = new Float64Array(H), TY = new Float64Array(H);
  for (let j = 0; j < H; j++) { const [tx, ty] = wind(PHI[j], spin); TX[j] = tx; TY[j] = ty; BETA[j] = spin * Math.max(.06, Math.cos(PHI[j] * Math.PI / 180)); }
  // the wind's curl (it drives the gyres): -∂τx/∂y, y toward the north (the row above)
  for (let j = 0; j < H; j++) { const a = TX[Math.max(0, j - 1)], b = TX[Math.min(H - 1, j + 1)]; FC[j] = -(a - b) / 2; }
  const at = (i, j) => { if (j < 0 || j >= H) return -1; if (i < 0 || i >= W) { if (!wrap) return -1; i = (i + W) % W; } return j * W + i; };
  // Stommel's balance, relaxed: ψ = 0 on every coast and the grid's edge
  const psi = new Float64Array(NC), r = 1.6, om = 1.7, val = k => k < 0 || !S[k] ? 0 : psi[k];
  let big = 1e-9;
  for (let it = 0; it < 900; it++) {
    let ch = 0;
    for (let j = 0; j < H; j++) {
      const b = BETA[j], ab = Math.abs(b), up = b > 0 ? 1 : -1;
      for (let s = 0; s < W; s++) {
        const i = b > 0 ? W - 1 - s : s, n = j * W + i; if (!S[n]) continue;
        const e = val(at(i + 1, j)), w = val(at(i - 1, j)), no = val(at(i, j - 1)), so = val(at(i, j + 1));
        const nv = (r * (e + w + no + so) + ab * (up > 0 ? e : w) - FC[j]) / (4 * r + ab), d = nv - psi[n];
        psi[n] += om * d; if (Math.abs(d) > ch) ch = Math.abs(d);
      }
    }
    if (it % 50 === 49) { big = 1e-9; for (let n = 0; n < NC; n++) big = Math.max(big, Math.abs(psi[n])); if (ch < big * 2e-5) break; }
  }
  // the currents: u east, v north (ψ's slopes), as fractions of the strong currents (the 97th of every hundred)
  const u = new Float32Array(NC), v = new Float32Array(NC);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const n = j * W + i; if (!S[n]) continue; u[n] = (val(at(i, j + 1)) - val(at(i, j - 1))) / 2; v[n] = (val(at(i + 1, j)) - val(at(i - 1, j))) / 2; }
  const sp = []; for (let n = 0; n < NC; n++) if (S[n]) sp.push(Math.hypot(u[n], v[n])); sp.sort((a, b) => a - b);
  const s97 = sp[Math.floor(sp.length * .97)] || 1; for (let n = 0; n < NC; n++) { u[n] /= s97; v[n] /= s97; }
  // Ekman's drift and where water wells up: along the coasts it is carried away from, and along the equator
  const up = new Float32Array(NC);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const n = j * W + i; if (!S[n]) continue;
    let ox = 0, oy = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const m = at(i + di, j + dj); if (m >= 0 && !S[m]) { ox -= di; oy += dj; } }
    const north = PHI[j] >= 0 ? 1 : -1, right = north * spin, ex = right > 0 ? TY[j] : -TY[j], ey = right > 0 ? -TX[j] : TX[j];
    if (ox || oy) { const l = Math.hypot(ox, oy); up[n] = Math.max(0, (ex * ox + ey * oy) / l); }
    up[n] += .55 * gauss(PHI[j] / 3.5) * Math.max(0, -TX[j] * spin);
  }
  // (the cold water rises over a band some way off the coast, not in one row of cells)
  blurSea(up, S, W, H, wrap, 2);
  let upMax = 1e-9; for (let n = 0; n < NC; n++) upMax = Math.max(upMax, up[n]); for (let n = 0; n < NC; n++) up[n] = Math.min(1, up[n] / (upMax * .7));
  // the sea's warmth: the latitude's, carried by the currents and mixed, cooler where water wells up
  const Teq = j => Math.max(-1.8, 28 - .0058 * PHI[j] * PHI[j] + (o.warmC || 0) * .6);
  const T = new Float32Array(NC), T2 = new Float32Array(NC); for (let n = 0; n < NC; n++) T[n] = Teq((n / W) | 0) - 6 * up[n];
  for (let it = 0; it < 700; it++) {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const n = j * W + i; if (!S[n]) { T2[n] = T[n]; continue; }
      const nb = [at(i + 1, j), at(i - 1, j), at(i, j - 1), at(i, j + 1)].map(m => m >= 0 && S[m] ? T[m] : T[n]);
      // (each step carries the water at most most of a cell, so the warmth never overshoots: the step is kept stable)
      const uu = R(-.9, .9, u[n]), vv = R(-.9, .9, v[n]);
      // (upwind: the water comes from the cell the current runs out of)
      const dTx = uu > 0 ? T[n] - nb[1] : nb[0] - T[n], dTy = vv > 0 ? T[n] - nb[3] : nb[2] - T[n];
      const adv = -(uu * dTx + vv * dTy), dif = .07 * (nb[0] + nb[1] + nb[2] + nb[3] - 4 * T[n]), rel = .009 * (Teq(j) - 7 * up[n] - T[n]);
      // (the step: the current, the mixing and the air's pull together may not move more than the cell holds)
      T2[n] = T[n] + .4 * (adv + dif + rel);
    }
    T.set(T2);
  }
  // (the model's own sea is only as true as its differences along each latitude: each row is set to the latitude's
  // warmth on average, and keeps how much warmer or colder its water is than the rest of the row: so a world's
  // currents make its cold west coasts and warm east coasts without cooling or warming the whole sea)
  const zmT = new Float64Array(H), zcT = new Float64Array(H); for (let n = 0; n < NC; n++) if (S[n]) { const j = (n / W) | 0; zmT[j] += T[n]; zcT[j]++; }
  const Ta = new Float32Array(NC); for (let n = 0; n < NC; n++) { const j = (n / W) | 0; Ta[n] = zcT[j] ? (T[n] - zmT[j] / zcT[j]) * 1.3 : 0; }
  // the full grid: the sea's warmth, and how far it is from what its latitude alone would give it
  const lat = j => la + (lb - la) * (j + .5) / rows, sample = (A, x, y) => { const X = R(0, W - 1.001, x / f - .5 + P), Y = R(0, H - 1.001, y / f - .5 + P), i = Math.floor(X), j = Math.floor(Y), tx = X - i, ty = Y - j, g = (a, b) => A[b * W + a]; return (g(i, j) * (1 - tx) + g(i + 1, j) * tx) * (1 - ty) + (g(i, j + 1) * (1 - tx) + g(i + 1, j + 1) * tx) * ty; };
  const N = cols * rows, sst = new Float32Array(N), anom = new Float32Array(N), upF = new Float32Array(N);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = y * cols + x, a = lat(y), t0 = Math.max(-1.8, 28 - .0058 * a * a + (o.warmC || 0) * .6);
    const t = t0 + sample(Ta, x, y); sst[n] = Math.max(-1.8, t); anom[n] = sst[n] - t0; upF[n] = sample(up, x, y);
  }
  // the streams to draw: traced along the currents from the strongest water, each warm or cold by the water it carries
  // (each against the sea of its own latitude, as an oceanographer calls a current warm or cold)
  const zm = new Float64Array(H), zc = new Float64Array(H); for (let n = 0; n < NC; n++) if (S[n]) { const j = (n / W) | 0; zm[j] += T[n]; zc[j]++; }
  const Tq = new Float32Array(NC); for (let n = 0; n < NC; n++) { const j = (n / W) | 0; Tq[n] = T[n] - (zc[j] ? zm[j] / zc[j] : Teq(j)); }
  const vel = (x, y) => { const i = Math.floor(x), j = Math.floor(y), n = at(i, j); if (n < 0 || !S[n]) return null; return [u[n], v[n], Tq[n]]; };
  const taken = new Uint8Array(NC), seeds = [];
  for (let n = 0; n < NC; n++) if (S[n] && Math.hypot(u[n], v[n]) > .42) seeds.push(n);
  seeds.sort((a, b) => Math.hypot(u[b], v[b]) - Math.hypot(u[a], v[a]));
  const streams = [];
  for (const s0 of seeds) {
    if (taken[s0] || streams.length >= 22) continue;
    const trace = dir => { const pts = []; let x = s0 % W + .5, y = ((s0 / W) | 0) + .5; for (let k = 0; k < 160; k++) { const q = vel(x, y); if (!q) break; const s = Math.hypot(q[0], q[1]); if (s < .1) break; pts.push([x, y, s, q[2]]); x += dir * q[0] / s * .6; y -= dir * q[1] / s * .6; if (wrap) x = (x + W) % W; if (k > 12 && Math.hypot(x - pts[0][0], y - pts[0][1]) < .8) break; } return pts; };
    const back = trace(-1).reverse(), fwd = trace(1), line = back.slice(0, -1).concat(fwd);
    if (line.length < 22) { taken[s0] = 1; continue; }
    // (one stream for each current: the water beside it, some cells either way, is the same current)
    for (const [x, y] of line) for (let dj = -5; dj <= 5; dj++) for (let di = -5; di <= 5; di++) { const m = at(Math.floor(x) + di, Math.floor(y) + dj); if (m >= 0) taken[m] = 1; }
    // (in the map's own units, and only the part on the map; a stream running off a region's edge is cut there)
    const pts = [], segs = []; let cur = [];
    for (const [x, y, s, tq] of line) {
      const mx = (x - P) * f, my = (y - P) * f;
      if (mx < 0 || my < 0 || mx > cols || my > rows) { if (cur.length > 4) segs.push(cur); cur = []; continue; }
      // (on a planet a stream crossing the map's seam is cut there too)
      if (cur.length && Math.abs(mx - cur[cur.length - 1][0]) > cols / 2) { if (cur.length > 4) segs.push(cur); cur = []; }
      cur.push([mx, my, s, tq, PHI[Math.max(0, Math.min(H - 1, Math.floor(y)))]]);
    }
    if (cur.length > 4) segs.push(cur);
    for (const sg of segs) {
      const s = sg.reduce((a, p) => a + p[2], 0) / sg.length, tq = sg.reduce((a, p) => a + p[3], 0) / sg.length;
      // (warm or cold by the water it carries; where it carries the latitude's own warmth, by which way it runs: toward
      // the poles warm, toward the equator cold)
      const pole = Math.abs(sg[sg.length - 1][4]) - Math.abs(sg[0][4]), mlat = sg.reduce((a, p) => a + Math.abs(p[4]), 0) / sg.length;
      // (water warmer or colder than its latitude's sea is that; otherwise the tropics' water is warm, and elsewhere a current
      // running toward the poles carries warmth, one running toward the equator cold)
      const warm = Math.abs(tq) > .4 ? tq > 0 : mlat < 20 ? true : pole >= 0;
      streams.push({ pts: sg.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]), warm, s: Math.round(s * 100) / 100, dT: Math.round(tq * 10) / 10 });
    }
  }
  streams.sort((a, b) => b.s * b.pts.length - a.s * a.pts.length);
  // the gyres: where the circulation turns about a middle of its own, the strongest of each sense
  const gyres = [], seenG = new Uint8Array(NC);
  for (const sign of [1, -1]) {
    const cand = []; for (let n = 0; n < NC; n++) if (S[n] && sign * psi[n] > big * .22) cand.push(n);
    cand.sort((a, b) => sign * psi[b] - sign * psi[a]);
    for (const c of cand) {
      if (seenG[c]) continue; const st = [c]; seenG[c] = 1;
      for (let h = 0; h < st.length; h++) { const m0 = st[h], i = m0 % W, j = (m0 / W) | 0; for (const m of [at(i + 1, j), at(i - 1, j), at(i, j + 1), at(i, j - 1)]) if (m >= 0 && S[m] && !seenG[m] && sign * psi[m] > big * .12) { seenG[m] = 1; st.push(m); } }
      const x = (c % W - P + .5) * f, y = (((c / W) | 0) - P + .5) * f;
      if (st.length > 20 && x >= 0 && y >= 0 && x <= cols && y <= rows) gyres.push({ at: [Math.round(x), Math.round(y)], cw: sign > 0, s: Math.round(sign * psi[c] / big * 100) / 100, lat: Math.round(latOf((c / W) | 0)) });
    }
  }
  // the coarse grid as it lies on the map (no margin), kept for the map to draw and the coasts to use
  const pack = (A, k, off) => { const out = new Int8Array(cc * rc); for (let j = 0; j < rc; j++) for (let i = 0; i < cc; i++) out[j * cc + i] = R(-127, 127, Math.round(A[(j + P) * W + i + P] * k + (off || 0))); return out; };
  const pc = { f, cols: cc, rows: rc, u: pack(u, 100), v: pack(v, 100), up: pack(up, 120), sst: pack(T, 3) };
  let ice = 0, seaN = 0; for (let n = 0; n < N; n++) if (E[n] <= 0) { seaN++; if (sst[n] < -1.2) ice++; }
  return { sst, anom, up: upF, coarse: pc, streams, gyres, lat: [la, lb], spin, wrap, seaIce: seaN ? ice / seaN : 0 };
}
// a blur over the sea only (land neither gives nor takes)
function blurSea(A, S, W, H, wrap, passes) {
  const B = new Float32Array(A.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const n = j * W + i; if (!S[n]) { B[n] = 0; continue; }
      let s = 0, k = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { let a = i + di; const b = j + dj; if (b < 0 || b >= H) continue; if (a < 0 || a >= W) { if (!wrap) continue; a = (a + W) % W; } const m = b * W + a; if (S[m]) { s += A[m]; k++; } }
      B[n] = k ? s / k : 0;
    }
    A.set(B);
  }
}

module.exports = { currents, wind };
