/* Campaign Atlas: coasts shaped by what shapes the Earth's (the user, 28 Oct 2026: "coastlines whose shapes can be
   explained by geology, erosion, sediment transport, glaciation, sea-level history, and ocean conditions"; the request
   is the app's docs/requests/2026-10-28-coastlines.md, the research behind this its docs/research/2026-10-28-coastlines.md).
   On trial until the user approves it: `--coast geologic`. world-geology.js calls shape() once the land has risen and
   been cut by its rivers and the sea's level is chosen, then seafloor() for the ocean's floor, both before the climate;
   world-invent.js calls classify() after the ecology, for what each coast is made of and why. shape(), in order:
     1. the rock: hard crystalline shields, mountain belts folded into bands along the plates' borders, soft basins and
        coastal plains, limestone laid down in warm shallow seas, volcanic arcs and hotspots;
     2. the folded belts' ridges and valleys, the hard bands standing, the soft worn down (Dalmatian islands where they
        run along the coast and the sea floods between them; headlands and bays where they meet it across);
     3. the glacial maximum, some 6 °C colder (more toward the poles): where ice stood, the valleys it drained carved into
        troughs below the sea, deepest inland with a sill at the mouth (fjords), and low hard ground scoured into knobs
        and hollows streamlined along the ice's flow (skerries, and inland a land of lakes);
     4. the lowstand, the sea 120 m down: the rivers cut their valleys down to it; when the sea returns it floods them,
        and each fills back as far as its river's sediment allows: rias and estuaries stay open, the muddiest rivers'
        valleys fill and their deltas push out;
     5. the deltas, each as the river, the waves or the tides shape it (Galloway's three kinds);
     6. the waves wear the coast: soft rock where the sea is open retreats into bays, hard rock stands as headlands; a soft
        sandy coast the waves work hard is straightened. */
"use strict";
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const R = (a, b, v) => Math.max(a, Math.min(b, v)), smooth = (a, b, v) => { const t = R(0, 1, (v - a) / (b - a)); return t * t * (3 - 2 * t); };
function pct(a, p) { if (!a.length) return 0; const b = Float64Array.from(a).sort(); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; }
// the rock's kinds
const LITH = { shield: 1, belt: 2, volcanic: 3, sediment: 4, limestone: 5 };
const LITH_NAME = { 1: "granite and gneiss", 2: "folded rock", 3: "volcanic rock", 4: "soft sediment", 5: "limestone" };
// what the shaping left at a cell, for seafloor() and classify() to read
const MARK = { trough: 1, scour: 2, drowned: 3, deltaR: 4, deltaW: 5, deltaT: 6, bay: 7, straight: 8, shelfTrough: 9, canyon: 10, atoll: 11, seamount: 12, barrierReef: 13, band: 14 };
// the plates' meeting nearest a cell, as world-geology.js passes it
const MARGIN = { none: 0, collision: 1, active: 2, trenchSide: 3, arc: 4, rift: 5, transform: 6 };
// what a coast is, and so how it is drawn: [name, how rugged its shore is at a finer scale than the grid (0 a wave-
// straightened sand coast, 1 a fjord coast), its colour in the map's "Coasts" view]
const FORM = {
  1: ["Fjords", 1, "#2f62a3"], 2: ["Skerries", 1, "#5b8fd0"], 3: ["Rias", .75, "#2f8f86"], 4: ["Estuary", .4, "#68b0a6"],
  5: ["River-built delta", .35, "#6f8f2a"], 6: ["Wave-built delta", .12, "#b9a24a"], 7: ["Tide-built delta", .4, "#4f8a55"],
  8: ["Dalmatian islands", .7, "#8a5fb0"], 9: ["Headlands and bays", .5, "#b0623c"], 10: ["Cliffs", .45, "#6b4a35"],
  11: ["Volcanic coast", .12, "#3b3535"], 12: ["Karst coast", .75, "#a8975e"], 13: ["Barrier islands", .08, "#e0b85e"],
  14: ["Sandy plain coast", .06, "#ecd79c"], 15: ["Dune coast", .08, "#d39b4c"], 16: ["Tidal flats and salt marsh", .3, "#86a070"],
  17: ["Mangroves", .3, "#2f5a2c"], 18: ["Reef-fringed coast", .25, "#36b5a5"], 19: ["Atoll", .2, "#63d6c8"], 20: ["Rocky coast", .45, "#8a8478"],
  21: ["Eroding soft cliffs", .25, "#bf8f55"], 22: ["Low soft shore", .2, "#a8987a"]
};

/* ---- shape: the land and the sea as the coast's history made them (H, the heights before metres, changed in place) */
function shape(o, U) {
  const { H, cols, rows, sea, cellKm } = o, N = cols * rows, rnd = U.mulberry32(o.seed + 901), crust = o.crust;
  const nA = U.noiseFn(o.seed + 911), nB = U.noiseFn(o.seed + 912), nC = U.noiseFn(o.seed + 913);
  const [la, lb] = o.lat, latOf = j => la + (lb - la) * (j + .5) / rows, I = n => n % cols, J = n => (n / cols) | 0;
  const at = (i, j) => { if (j < 0 || j >= rows) return -1; if (i < 0 || i >= cols) { if (!o.wrap) return -1; i = (i + cols) % cols; } return j * cols + i; };
  const cells = km => km / cellKm, af = cellKm * cellKm / 85;   // (af: a cell's area in units of a 9.2 km cell's, so sizes keep to km)
  const H0 = Float32Array.from(H);
  // the heights' own scale: how high the land typically stands above the sea, and how far under it a drowned cell lies
  const above = []; for (let n = 0; n < N; n++) if (H[n] > sea) above.push(H[n] - sea);
  const hs = Math.max(1e-3, pct(above, .5)), dip = hs * .03;
  // the heights in metres, rank for rank as world-geology.js will make them (the ice's cold is the height's)
  const metres = new Float32Array(N);
  { const idx = []; for (let n = 0; n < N; n++) if (H[n] > sea) idx.push(n); idx.sort((a, b) => H[a] - H[b]);
    const Q = [[0, 2], [.1, 60], [.25, 200], [.5, 460], [.75, 1000], [.88, 1800], [.94, 2700], [.98, 4000], [.995, 5300], [1, 6800]];
    const atQ = p => { for (let k = 1; k < Q.length; k++) if (p <= Q[k][0]) return Q[k - 1][1] + (p - Q[k - 1][0]) / (Q[k][0] - Q[k - 1][0]) * (Q[k][1] - Q[k - 1][1]); return 6800; };
    idx.forEach((n, k) => { metres[n] = atQ(k / Math.max(1, idx.length - 1)); }); }
  const mx = maxFilter(metres, cols, rows, Math.max(1, Math.round(cells(30))));
  const mark = new Uint8Array(N);

  /* 1. the rock */
  const hard = new Float32Array(N), lith = new Uint8Array(N), band = new Float32Array(N);
  let upRef; { const u = []; for (let n = 0; n < N; n++) if (crust[n] === 1) u.push(o.up[n]); upRef = Math.max(1e-6, pct(u, .92)); }
  const volcN = new Uint8Array(N);
  for (const v of o.volcanoes || []) { const r = Math.max(1, Math.ceil(cells(35))); for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const m = at(I(v) + di, J(v) + dj); if (m >= 0 && di * di + dj * dj <= r * r) volcN[m] = 1; } }
  // (the distance from the plates' border eased, so the bands follow it in curves, not in the grid's straight steps)
  const bd = Float32Array.from(o.bdist, v => Math.min(v, 1500)); boxBlur(bd, cols, rows, 2, 3);
  const lam0 = cells(22 + 10 * rnd());
  // (the way across the folds at each cell: the eased distance from the border rising; the folds run square to it)
  const gx = new Float32Array(N), gy = new Float32Array(N);
  for (let n = 0; n < N; n++) { const i = I(n), j = J(n), a = at(i + 1, j), b = at(i - 1, j), c = at(i, j + 1), d = at(i, j - 1); if (a < 0 || b < 0 || c < 0 || d < 0) continue; const x = bd[a] - bd[b], y = bd[c] - bd[d], l = Math.hypot(x, y); if (l > 1e-6) { gx[n] = x / l; gy[n] = y / l; } }
  for (let n = 0; n < N; n++) {
    const x = I(n) / rows, y = J(n) / rows, g = nA(x * 40, y * 40) - .5;
    if (crust[n] !== 1 || volcN[n]) { lith[n] = LITH.volcanic; hard[n] = .7 + .12 * g; continue; }
    const u = o.up[n] / upRef, w = o.warp[n], alat = Math.abs(latOf(J(n)));
    if (u > .3) {
      // (a belt's rock folded into bands along the plates' border, hard and soft in turn, some 15 to 40 km from crest to
      // crest: their spacing wandering, each fold dying out along its length and another taking over beside it, as folds
      // do (en échelon), never a washboard)
      const d = bd[n] / cellKm, ph = 2 * Math.PI * d / lam0 + 3.2 * (U.fbm(nC, x * 5, y * 5, 2) - .5) * 2, s = Math.sin(ph);
      const keep = smooth(.42, .68, U.fbm(nA, x * 4 + 9, y * 4 - 3, 2));
      band[n] = Math.sign(s) * Math.pow(Math.abs(s), .75) * keep * smooth(.3, .6, u); lith[n] = LITH.belt; hard[n] = R(.2, .95, .6 + .3 * band[n] + .1 * g);
    } else if (w > .55 || (w > .47 && u > .1)) { lith[n] = LITH.shield; hard[n] = .84 + .12 * g; }
    else if (alat < 36 && nB(x * 7 + 11, y * 7) > .6) { lith[n] = LITH.limestone; hard[n] = .58 + .1 * g; }
    else { lith[n] = LITH.sediment; hard[n] = .2 + .16 * g; }
  }

  // (a world drawn by hand keeps the coasts it was drawn with: only its rock is read)
  if (o.keepLand) return { lith, hard, gx, gy, ice: new Uint8Array(N), mark, mouths: [], deltas: [], troughMouths: [], hs, iceN: 0, stats: {} };

  /* 2. the folded belts' ridges and valleys: the hard bands stand, the soft were worn into valleys; strongest in the
        foothills and lowland belts (the Jura, the Appalachians' Valley and Ridge, the Dinarides by the Adriatic), the high
        mountains keeping their own form; under the sea near the coast too, so the drowned ridges stand as islands */
  for (let n = 0; n < N; n++) if (lith[n] === LITH.belt && Math.abs(band[n]) > .05 && H[n] > sea - hs * .6) { H[n] += band[n] * hs * .32 * (1 - smooth(350, 1500, metres[n])); mark[n] = MARK.band; }
  // (where the folds run along the coast, the coast has sunk a little (the Adriatic's did): the sea floods the soft
  // valleys into long sounds and the hard ridges are left standing as long islands parallel to the shore; where the
  // folds meet the coast across, nothing more is needed: their ends make the headlands)
  { const dS = U.distance(cols, rows, n => H[n] <= sea), dL = U.distance(cols, rows, n => H[n] > sea), sd = new Float32Array(N);
    for (let n = 0; n < N; n++) sd[n] = H[n] > sea ? dS[n] : -dL[n];
    for (let n = 0; n < N; n++) {
      if (lith[n] !== LITH.belt || Math.abs(band[n]) < .05 || sd[n] < 0) continue; const off = sd[n]; if (off > 5) continue;
      const i = I(n), j = J(n), a = at(i + 1, j), b = at(i - 1, j), c = at(i, j + 1), d = at(i, j - 1); if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      const nx = sd[a] - sd[b], ny = sd[c] - sd[d], nl = Math.hypot(nx, ny); if (nl < 1e-6) continue;
      const along = Math.abs((nx * gx[n] + ny * gy[n]) / nl); if (along < .6) continue;
      const wgt = smooth(.6, .85, along) * (1 - off / 6); H[n] += (band[n] * .6 - .45) * hs * wgt; mark[n] = MARK.band;
      // (the soft valleys near the shore, unless high, under the sea: long sounds between the ridges)
      if (band[n] < -.15 && off <= 4 && wgt > .25 && metres[n] < 900) H[n] = Math.min(H[n], sea - dip);
    } }

  /* 3. the glacial maximum */
  const T0 = lat => 27 * Math.pow(Math.cos(lat * Math.PI / 180), 1.6) - 3 - 12 * smooth(60, 85, Math.abs(lat));
  const tl = new Float32Array(N); for (let n = 0; n < N; n++) { const lat = latOf(J(n)); tl[n] = T0(lat) - 6.5 * metres[n] / 1000 - (6 + 5 * smooth(35, 70, Math.abs(lat))); }
  let RT = route(H, cols, rows, sea, at, o.wrap, U), F = flow(RT, cellKm);
  const wet = n => Math.min(2.2, Math.max(.2, o.rain[n]));
  // (the ice gathers where it is cold enough and snowy enough, a wet coast's glaciers forming in warmer air than a dry
  // one's, and flows down the valleys, a tongue reaching as far below the snow as its ice can feed it)
  const Qi = new Float32Array(N), ice = new Uint8Array(N);
  for (let n = 0; n < N; n++) if (H[n] > sea && tl[n] < -2 + 2.5 * (wet(n) - 1)) Qi[n] = wet(n) * af;
  for (let q = RT.k - 1; q >= 0; q--) { const n = RT.order[q], r = RT.rec[n]; if (r >= 0 && H[n] > sea && H[r] > sea) Qi[r] += Qi[n]; }
  let iceN = 0; for (let n = 0; n < N; n++) if (H[n] > sea && Qi[n] > 0 && (tl[n] < -2 + 2.5 * (wet(n) - 1) || (Qi[n] >= 3 && tl[n] < 1 + 1.1 * Math.log(Qi[n])))) { ice[n] = 1; iceN++; }
  // fjords: where the ice ran to the sea through high ground, its valleys cut below the sea, deepest some way inland
  const troughMouths = [];
  for (let n = 0; n < N; n++) {
    if (!ice[n] || H[n] <= sea || Qi[n] < 12) continue;
    const Lf = Math.min(240, 25 + 22 * Math.sqrt(Qi[n])), mo = F.mouth[n];
    if (F.dsea[n] > Lf || mx[n] < 350 || (mo >= 0 && mx[mo] < 220)) continue;
    // (how deep the ice cut its floor, m: the more ice, the deeper, most some way inland where it was thickest, less at
    // the mouth (the sill); a fjord only where the floor so cut lies below the sea)
    const cut = Math.min(1300, 95 * Math.sqrt(Qi[n])) * (.55 + .45 * smooth(0, .35, F.dsea[n] / Lf)) * (1 - .6 * smooth(.6, 1, F.dsea[n] / Lf));
    if (metres[n] >= cut) continue;
    H[n] = Math.min(H[n], sea - dip * (1 + 2.5 * smooth(.1, .5, F.dsea[n] / Lf))); mark[n] = MARK.trough;
    if (F.dsea[n] <= cellKm && Qi[n] >= 30) troughMouths.push(n);
  }
  // (one trough across the shelf for each great fjord, from the mouth with the most ice)
  { troughMouths.sort((a, b) => Qi[b] - Qi[a]); const kept = []; for (const n of troughMouths) if (kept.every(m => Math.hypot(I(m) - I(n), J(m) - J(n)) > cells(45))) kept.push(n); troughMouths.length = 0; troughMouths.push(...kept); }
  // the scoured lowland: knobs and hollows streamlined along the ice's way to the sea
  const dC0 = U.distance(cols, rows, n => H[n] <= sea), gC = Float32Array.from(dC0, v => Math.min(v, 60)); boxBlur(gC, cols, rows, 2, 2);
  for (let n = 0; n < N; n++) {
    if (!ice[n] || H[n] <= sea || mark[n] === MARK.trough || hard[n] < .55 || metres[n] > 320 || mx[n] > 700 || dC0[n] > cells(140)) continue;
    const i = I(n), j = J(n), gx0 = (gC[at(i + 1, j)] || 0) - (gC[at(i - 1, j)] || 0), gy0 = (gC[at(i, j + 1)] || 0) - (gC[at(i, j - 1)] || 0), gl = Math.hypot(gx0, gy0) || 1, gx = gx0 / gl, gy = gy0 / gl;
    const s = 1 / cells(9), u = (i * gx + j * gy) * s / 3.2, v = (-i * gy + j * gx) * s, z = (U.fbm(nC, u + 50, v - 20, 3) - .5) / .11;
    const low = hs * .42 * R(0, 1.6, (1 - z) / 2) * (1 - smooth(80, 320, metres[n])) * (1 - smooth(cells(60), cells(140), dC0[n]));
    if (low > 0) { H[n] -= low; mark[n] = MARK.scour; }
  }

  /* 4. the lowstand and the drowned valleys */
  RT = route(H, cols, rows, sea, at, o.wrap, U); F = flow(RT, cellKm);
  const A = new Float32Array(N), Sd = new Float32Array(N);
  for (let n = 0; n < N; n++) if (H[n] > sea) { A[n] = wet(n) * af; Sd[n] = A[n] * (.25 + (1 - hard[n])) * (.3 + Math.min(1.5, mx[n] / 1500)); }
  for (let q = RT.k - 1; q >= 0; q--) { const n = RT.order[q], r = RT.rec[n]; if (r >= 0 && H[n] > sea && H[r] > sea) { A[r] += A[n]; Sd[r] += Sd[n]; } }
  const mouths = []; for (let n = 0; n < N; n++) if (H[n] > sea && F.mouth[n] === n && A[n] >= 20) mouths.push(n);
  const Aref = Math.max(1, pct(mouths.map(n => A[n]), .9)), Sref = Math.max(1e-6, pct(mouths.map(n => Sd[n]), .85));
  const Ld = new Float32Array(N), MO = [];
  for (const m of mouths) {
    const fill = R(0, 1, Math.pow(Sd[m] / Sref, .7)), glacial = mark[m] === MARK.trough;
    Ld[m] = glacial ? 0 : Math.min(120, (6 + 22 * Math.sqrt(A[m] / Aref)) * Math.pow(1 - fill, 1.5));
    MO.push({ n: m, A: A[m], S: Sd[m], fill, Ld: Ld[m] });
  }
  for (let n = 0; n < N; n++) {
    if (H[n] <= sea || mark[n] === MARK.trough || A[n] < 10) continue; const m = F.mouth[n]; if (m < 0 || !(Ld[m] > 0) || F.dsea[n] > Ld[m]) continue;
    H[n] = Math.min(H[n], sea - dip); mark[n] = MARK.drowned;
  }
  // (in soft lowland the drowned valley widens toward its mouth into a funnel)
  for (let n = 0; n < N; n++) {
    if (mark[n] !== MARK.drowned) continue; const m = F.mouth[n];
    for (const [di, dj] of NB4) { const c = at(I(n) + di, J(n) + dj); if (c < 0 || H[c] <= sea || mark[c] || hard[c] > .5 || metres[c] > 45 || F.dsea[c] > Ld[m] * .55) continue; H[c] = sea - dip; mark[c] = MARK.drowned; }
  }

  /* 5. the deltas */
  const water = () => { const w = new Uint8Array(N); for (let n = 0; n < N; n++) if (H[n] <= sea) w[n] = 1; return w; };
  let W8 = water();
  const WV = waveTools(H, cols, rows, sea, cellKm, latOf, at, o.spin);
  let deltas = 0; const DL = [];
  for (const M of MO) {
    const m = M.n, x = M.S / Sref; if (x < 1.3 || M.A < 900 || H[m] <= sea || mark[m] === MARK.trough) continue;
    const wv = WV.at(m, W8); if (!wv) continue;
    const tide = WV.tide(m, wv.nx, wv.ny, W8, crust), wave = wv.E;
    // (which wins: the river's sediment, the waves or the tides)
    const sR = .2 + (x - 1.3) * .6, sW = wave * 2.8, sT = tide / 3, type = sT > sR && sT > sW ? MARK.deltaT : sW > sR ? MARK.deltaW : MARK.deltaR;
    const Nd = Math.min(300, Math.round(Math.min(2, x - .8) * M.A * .03 / af));
    if (Nd < 3) continue;
    const made = buildDelta(m, type, Nd, wv.nx, wv.ny);
    if (made > 2) { deltas++; DL.push({ n: m, type, cells: made, tide: Math.round(tide * 10) / 10, wave: Math.round(wave * 100) / 100 }); M.delta = type; }
  }
  function buildDelta(m, type, Nd, nx, ny) {
    // (grid: x east, y down; the way out to sea is (nx, -ny))
    const gx = nx, gy = -ny, ok = c => c >= 0 && H[c] <= sea && (crust[c] === 1 || dC0[c] <= 0 || nearLand(c)) && mark[c] !== MARK.trough;
    const nearLand = c => { for (const [di, dj] of NB8) { const d = at(I(c) + di, J(c) + dj); if (d >= 0 && H[d] > sea) return true; } return false; };
    let made = 0; const raise = c => { H[c] = sea + dip * (.5 + rnd() * .6); mark[c] = type; made++; };
    const x0 = I(m) + .5, y0 = J(m) + .5;
    if (type === MARK.deltaR) {
      // fingers: distributaries pushing out, branching, each lined by its levees
      const ch = [], k = 2 + Math.floor(rnd() * 3), L = Math.max(3, Math.min(Math.round(cells(60)), Math.round(Math.sqrt(Nd) * 1.7))), th0 = Math.atan2(gy, gx);
      for (let c = 0; c < k; c++) ch.push({ x: x0, y: y0, th: th0 + (c - (k - 1) / 2) * .5 + (rnd() - .5) * .25, L });
      while (ch.length && made < Nd) {
        const c = ch.pop();
        for (let s = 0; s < c.L && made < Nd; s++) {
          c.x += Math.cos(c.th); c.y += Math.sin(c.th); c.th += (nA(c.x * .3, c.y * .3) - .5) * .5;
          const cell = at(Math.floor(c.x), Math.floor(c.y)); if (cell < 0) break; if (H[cell] > sea) continue; if (!ok(cell)) break;
          raise(cell); if (rnd() < .45) { const [di, dj] = NB4[Math.floor(rnd() * 4)], e = at(Math.floor(c.x) + di, Math.floor(c.y) + dj); if (ok(e)) raise(e); }
          if (rnd() < .07 && c.L - s > 3) ch.push({ x: c.x, y: c.y, th: c.th + (rnd() < .5 ? -.4 : .4), L: Math.round((c.L - s) * .6) });
        }
      }
    } else {
      const r = type === MARK.deltaW ? Math.sqrt(Nd / 1.5) : Math.sqrt(Nd / 1.1), tx = -gy, ty = gx, Rr = Math.ceil(r * 2);
      const cand = [];
      for (let dj = -Rr; dj <= Rr; dj++) for (let di = -Rr; di <= Rr; di++) {
        const c = at(Math.floor(x0) + di, Math.floor(y0) + dj); if (!ok(c)) continue;
        const a = di * tx + dj * ty, b = di * gx + dj * gy;
        // a wave-built delta a smooth cuspate bulge; a tide-built one a funnel of long islands along the channels
        const inside = type === MARK.deltaW ? b > -.5 && b < r * Math.pow(Math.max(0, 1 - (a / (r * 1.7)) ** 2), .7)
          : b > 0 && b < r * 1.3 && Math.abs(a) < r * (.35 + .6 * b / (r * 1.3)) && Math.sin(2 * Math.PI * a / Math.max(1.5, r * .5) + b * .12) > .1;
        if (inside) cand.push([b, c]);
      }
      cand.sort((p, q) => p[0] - q[0]); for (const [, c] of cand) { if (made >= Nd) break; raise(c); }
    }
    return made;
  }

  /* 6. the waves wear the coast; a sandy coast they work hard is straightened */
  let bays = 0;
  { let landN = 0; for (let n = 0; n < N; n++) if (H[n] > sea) landN++;
    for (let round = 0; round < 4; round++) {
      W8 = water(); const oc = ocean(W8, cols, rows, at), P = [];
      for (let n = 0; n < N; n++) {
        if (H[n] <= sea || mark[n] === MARK.deltaR || mark[n] === MARK.deltaT) continue;
        let coast = false; for (const [di, dj] of NB4) { const c = at(I(n) + di, J(n) + dj); if (c >= 0 && oc[c]) { coast = true; break; } } if (!coast) continue;
        const wv = WV.at(n, oc); if (!wv) continue;
        const k = Math.pow(1 - hard[n], 1.6) / (1 + metres[n] / 400);
        P.push([wv.E * k, n]);
      }
      if (!P.length) break;
      const th = Math.max(.2, pct(P.map(p => p[0]), .9)), most = Math.ceil(landN * .004);
      P.sort((a, b) => b[0] - a[0]); let cut = 0;
      for (const [p, n] of P) { if (p < th || cut >= most) break; H[n] = sea - dip; mark[n] = MARK.bay; cut++; bays++; }
    }
    // (straightening: the waves fill a soft coast's small bays and cut off its stubs)
    for (let pass = 0; pass < 2; pass++) {
      W8 = water(); const oc = ocean(W8, cols, rows, at), flip = [];
      for (let n = 0; n < N; n++) {
        const i = I(n), j = J(n); let landC = 0, soft = 0, cnt = 0, marked = false;
        for (const [di, dj] of NB8) { const c = at(i + di, j + dj); if (c < 0) continue; cnt++; if (H[c] > sea) { landC++; if (lith[c] === LITH.sediment) soft++; } if (mark[c] >= MARK.trough && mark[c] <= MARK.deltaT) marked = true; }
        if (marked || mark[n] === MARK.trough || mark[n] === MARK.drowned) continue;
        if (oc[n] && landC >= 5 && soft >= 4 && nearOpen(n, oc)) flip.push([n, 1]);
        else if (H[n] > sea && lith[n] === LITH.sediment && landC <= 2) flip.push([n, 0]);
      }
      for (const [n, up] of flip) { H[n] = up ? sea + dip * .6 : sea - dip; mark[n] = MARK.straight; }
    }
  }
  function nearOpen(n, oc) { const wv = WV.at(n, oc, true); return wv && wv.E > .4; }

  /* what was drowned and is not joined to the sea lies in a hollow: land again, just above the water (a lake, if
     world-geology.js finds the hollow deep and wet enough) */
  { W8 = water(); const oc = ocean(W8, cols, rows, at); for (let n = 0; n < N; n++) if (H[n] <= sea && !oc[n] && H0[n] > sea) H[n] = sea + dip * .5; }

  const count = k => mark.reduce((s, v) => s + (v === k ? 1 : 0), 0);
  return { lith, hard, gx, gy, ice, mark, mouths: MO, deltas: DL, troughMouths, hs, iceN, stats: { fjord: count(MARK.trough), scour: count(MARK.scour), drowned: count(MARK.drowned), delta: deltas, bays, straight: count(MARK.straight), band: count(MARK.band) } };
}

/* ---- the sea floor: the shelf as wide as the coast's margin makes it (broad on a passive margin, narrow where an
        ocean dives under the land, a volcano's shelf narrowest), its edge at about 130 m; the slope, cut by canyons off
        the great rivers' mouths; the deep floor, the ridges and the trenches; the glaciers' troughs across the shelf and
        the banks between them; hotspot chains dying into atolls in warm seas, seamounts in cold; reef platforms and
        barrier reefs on tropical shelves the rivers do not muddy. E: metres, the land's already set; sea cells set here */
function seafloor(E, o, SH, U) {
  const { cols, rows, cellKm } = o, N = cols * rows, mark = SH.mark, nB = U.noiseFn(o.seed + 921), nC = U.noiseFn(o.seed + 922);
  const [la, lb] = o.lat, latOf = j => la + (lb - la) * (j + .5) / rows, I = n => n % cols, J = n => (n / cols) | 0;
  const at = (i, j) => { if (j < 0 || j >= rows) return -1; if (i < 0 || i >= cols) { if (!o.wrap) return -1; i = (i + cols) % cols; } return j * cols + i; };
  // each sea cell's nearest coast, and how far (km)
  const near = new Int32Array(N).fill(-1), D = new Float32Array(N).fill(1e9), q = [];
  for (let n = 0; n < N; n++) if (E[n] > 0) { D[n] = 0; near[n] = n; q.push(n); }
  for (let h = 0; h < q.length; h++) { const n = q[h]; for (const [di, dj] of NB8) { const m = at(I(n) + di, J(n) + dj); if (m < 0 || E[m] > 0) continue; const d = D[n] + (di && dj ? 1.414 : 1) * cellKm; if (d < D[m]) { D[m] = d; near[m] = near[n]; q.push(m); } } }
  // (how far each cell lies from the continent's own crust, km: where a shelf sea lies over the continent, the slope
  // begins at the crust's edge, not at the coast, so the shelf does not end in a wall)
  const dCr = U.distance(cols, rows, n => o.crust[n] === 1); for (let n = 0; n < N; n++) dCr[n] *= cellKm;
  // the river mouths that feed the shelf, and how much (a big river widens its shelf and cuts a canyon)
  const feed = new Float32Array(N); for (const M of SH.mouths) feed[M.n] = Math.max(feed[M.n], M.S);
  const Sref = Math.max(1e-6, pct(SH.mouths.map(M => M.S), .85)), reefC = [];
  // each cell's coast's character, then eased across the sea: the shelf's width (km), whether the continent itself lies
  // under the sea there, how steep the slope beyond, whether a reef platform can grow. (Each taken from its nearest coast
  // alone, they would change at a stroke on the straight lines where one coast's reach meets the next.)
  const Wf = new Float32Array(N), SF = new Float32Array(N), SWf = new Float32Array(N), PF = new Float32Array(N), ISL = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const c = E[n] > 0 ? n : near[n], mg = c >= 0 ? o.margin[c] : 0, x = I(n) / rows, y = J(n) / rows, isl = c >= 0 && o.crust[c] !== 1;
    let W = isl ? 6 + 6 * nB(x * 9, y * 9) : mg === MARGIN.active || mg === MARGIN.trenchSide ? 18 + 14 * nB(x * 6, y * 6) : mg === MARGIN.arc ? 10 : mg === MARGIN.rift ? 28 + 15 * nB(x * 6, y * 6) : mg === MARGIN.collision || mg === MARGIN.transform ? 40 + 30 * nB(x * 5, y * 5) : 70 + 170 * nB(x * 3, y * 3);
    if (c >= 0 && SH.ice[c]) W = Math.max(W, 80 + 80 * nB(x * 4 + 3, y * 4));
    Wf[n] = W; ISL[n] = isl ? 1 : 0; SWf[n] = mg === MARGIN.active || mg === MARGIN.trenchSide || isl ? 22 : 55;
    SF[n] = o.crust[n] === 1 && mg !== MARGIN.active && mg !== MARGIN.trenchSide && !isl ? 1 : 0;
    PF[n] = Math.abs(latOf(J(n))) < 24 && !isl && W > 40 && feedNear(c) < .3 ? 1 : 0;
  }
  for (const F of [Wf, SF, SWf, PF, ISL]) boxBlur(F, cols, rows, 3, 2);
  for (let n = 0; n < N; n++) {
    if (E[n] > 0) continue;
    const d = D[n], x = I(n) / rows, y = J(n) / rows, W = Math.max(4, Wf[n]), sw = SWf[n];
    // the shelf; beyond it the slope and the deep floor, the slope beginning at the continent's own edge where a shelf
    // sea lies over it; and that shelf sea itself (the North Sea's kind), as much as the continent lies under the sea there
    const e = Math.max(0, Math.min(d - W, ISL[n] > .5 || o.crust[n] === 1 ? 1e9 : dCr[n])), zOut = e < sw ? -130 - e / sw * 3200 : -3330 - Math.min(1500, (e - sw) * 1.4);
    const sea = SF[n] * (1 - smooth(600, 900, d)), zSea = -(70 + 90 * nB(x * 5 + 7, y * 5)) - 40 * smooth(400, 900, d);
    let z = d <= W ? -(12 + 118 * Math.pow(d / W, 1.15)) : zOut * (1 - sea) + zSea * sea;
    z += (o.ridge[n] || 0) * 1800 * Math.min(1, d / 300) - (o.trench[n] || 0) * 2600;
    // (the deep floor's unevenness, growing with the depth rather than starting at one)
    z += (nC(x * 12, y * 12) - .5) * 300 * smooth(-400, -1500, z);
    // banks on a broad shelf: low swells of sand and gravel, the shallower for being on the shelf
    z *= 1 - .45 * smooth(.6, .8, nB(x * 14 + 1, y * 14)) * smooth(-25, -50, z) * (1 - smooth(-170, -230, z));
    // (tropical shelves the rivers do not muddy: reef platforms, a barrier reef along the edge; laid after the easing)
    if (PF[n] > .05 && d <= W) reefC.push([n, PF[n], d > W - cellKm * 1.2, x, y]);
    E[n] = Math.min(-4, z);
  }
  function feedNear(c) { if (c < 0) return 0; let s = 0; const r = Math.ceil(120 / cellKm); for (let dj = -r; dj <= r; dj += 2) for (let di = -r; di <= r; di += 2) { const m = at(I(c) + di, J(c) + dj); if (m >= 0) s = Math.max(s, feed[m]); } return s / Sref; }
  // the whole floor eased: the grid's cells and the noise's steps smoothed away, the deep ocean the most; the coast's own
  // shallows kept
  { const Z = new Float32Array(N); for (let n = 0; n < N; n++) Z[n] = E[n] > 0 ? -12 : E[n]; boxBlur(Z, cols, rows, 1, 2);
    const Zd = Float32Array.from(Z); boxBlur(Zd, cols, rows, 3, 2);
    for (let n = 0; n < N; n++) if (E[n] <= 0) { const deep = smooth(-600, -2500, E[n]) * smooth(cellKm * 2, cellKm * 5, D[n]); E[n] = Math.min(-4, D[n] <= cellKm * 1.5 ? (E[n] + Z[n]) / 2 : Z[n] * (1 - deep) + Zd[n] * deep); } }
  for (const [n, p, edge, x, y] of reefC) { E[n] += (Math.max(E[n], -45 - 10 * nB(x * 9, y * 9)) - E[n]) * p; if (edge && p > .5) { E[n] = -6; mark[n] = MARK.barrierReef; } }
  // the way out to sea from a coast cell
  const outward = n => { let sx = 0, sy = 0; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const m = at(I(n) + di, J(n) + dj); if (m >= 0 && E[m] <= 0) { sx += di; sy += dj; } } const l = Math.hypot(sx, sy); return l ? [sx / l, sy / l] : null; };
  // a line run out to sea, cut into the floor
  const cutLine = (n, depth, from, to, kind, wob) => {
    const dir = outward(n); if (!dir) return 0; let [dx, dy] = dir, xx = I(n) + .5, yy = J(n) + .5, made = 0;
    for (let s = 0; s < 400; s++) {
      xx += dx; yy += dy; const th = (nB(xx * .2, yy * .2) - .5) * wob, c2 = Math.cos(th), s2 = Math.sin(th); [dx, dy] = [dx * c2 - dy * s2, dx * s2 + dy * c2];
      const m = at(Math.floor(xx), Math.floor(yy)); if (m < 0) break; if (E[m] > 0) continue; const d = D[m]; if (d > to) break; if (d < from) continue;
      const t = (d - from) / Math.max(1, to - from), v = kind === MARK.canyon ? E[m] - depth * Math.sin(Math.PI * Math.min(1, t * 1.2)) : -depth * (1 - .5 * t);
      // (its sides sloping: the cells beside it cut half as deep)
      E[m] = Math.min(E[m], v); if (!mark[m]) mark[m] = kind; made++;
      for (const [di, dj] of NB4) { const e = at(Math.floor(xx) + di, Math.floor(yy) + dj); if (e >= 0 && E[e] <= 0) E[e] = Math.min(E[e], (E[e] + v) / 2); }
    }
    return made;
  };
  // the glaciers' troughs across the shelf
  for (const n of SH.troughMouths) cutLine(n, 380, 0, 200, MARK.shelfTrough, .25);
  // canyons off the big rivers' mouths, from the shelf's outer part down the slope (on an active margin close in)
  let canyons = 0;
  for (const M of SH.mouths) { if (!(M.A >= 400 && M.S >= Sref * .7) && !(o.margin[M.n] === MARGIN.active && M.A >= 150)) continue; if (cutLine(M.n, 700, o.margin[M.n] === MARGIN.active ? 5 : 40, 420, MARK.canyon, .35) > 2) canyons++; }
  // hotspot chains: the young islands high, then worn and sinking: atolls in warm seas (before the Darwin point, some
  // 28° from the equator), seamounts in cold
  let atolls = 0, seamounts = 0;
  for (const h of o.hotspots || []) {
    const n = h.n; if (n < 0 || E[n] > 0 || h.k < 2) continue;
    // (each a rounded rise from the floor, its top the shallower the younger; an atoll's ring of reef at the surface)
    const alat = Math.abs(latOf(J(n))), atoll = alat < 28 && h.k < 7, top = atoll ? -10 : -500 - h.k * 140, rr = Math.max(1.6, 30 / cellKm), Rm = Math.ceil(rr * 2.6);
    for (let dj = -Rm; dj <= Rm; dj++) for (let di = -Rm; di <= Rm; di++) { const m = at(I(n) + di, J(n) + dj); if (m < 0 || E[m] > 0) continue; const g = Math.exp(-((di * di + dj * dj) / (rr * rr))); E[m] = Math.max(E[m], top + (E[m] - top) * (1 - g)); if (atoll && di * di + dj * dj <= .6) mark[m] = MARK.atoll; else if (!atoll && g > .5 && !mark[m]) mark[m] = MARK.seamount; }
    if (atoll) atolls++; else seamounts++;
  }
  return { canyons, atolls, seamounts };
}

/* ---- the waves (as world-coast.js has them: the westerlies' storm waves, the trades', the polar easterlies', the long
        swell the westerlies send toward the equator), what a coast cell faces, and how big its tides are likely to be */
function waveTools(H, cols, rows, sea, cellKm, latOf, at, spin) {
  const f = spin < 0 ? -1 : 1, gauss = v => Math.exp(-v * v), I = n => n % cols, J = n => (n / cols) | 0;
  const waves = phi => { const a = Math.abs(phi), s = Math.sign(phi) || 1; return [[f, 0, gauss((a - 50) / 13)], [-f, -s * .35, .6 * gauss((a - 15) / 10)], [-f, 0, .3 * gauss((a - 70) / 8)], [f * .7, -s * .7, .35 * (1 - .6 * gauss((a - 50) / 12))]].map(([x, y, w]) => { const l = Math.hypot(x, y); return [x / l, y / l, w]; }); };
  const step = (n, dx, dy, d) => at(Math.round(I(n) + dx * d), Math.round(J(n) - dy * d));
  const fetch = (n, wx, wy, W) => { let d = 0; for (let s = 1; s * cellKm < 1500; s++) { const m = step(n, -wx, -wy, s); if (m < 0) return 1500; if (!W[m]) break; d = s * cellKm; } return d; };
  return {
    // a coast cell's way out to sea (x east, y north) and the wave energy reaching it (about 1 for an exposed coast)
    at(n, W, quick) {
      let sx = 0, sy = 0; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const m = at(I(n) + di, J(n) + dj); if (m >= 0 && W[m]) { sx += di; sy -= dj; } }
      const l = Math.hypot(sx, sy); if (!l) return null; const nx = sx / l, ny = sy / l, phi = latOf(J(n)); let E = 0;
      for (const [wx, wy, s] of waves(phi)) { const e = Math.max(0, -(wx * nx + wy * ny)); if (e < .02 || s < .02) continue; E += s * e * Math.min(1, Math.sqrt(fetch(n, wx, wy, W) / 800)); }
      if (!quick) { let open = 0; for (const a of [-1, -.5, 0, .5, 1]) { const c = Math.cos(a), sn = Math.sin(a); open += Math.min(1, fetch(n, -(nx * c - ny * sn), -(nx * sn + ny * c), W) / 400); } E += .06 + .12 * open / 5; }
      return { nx, ny, E };
    },
    // tidal range (m): small in enclosed seas and off narrow shelves, raised over broad ones and in funnelled bays
    tide(n, nx, ny, W, crust) {
      let shelf = 0; for (let s = 1; s < 60; s++) { const m = step(n, nx, ny, s); if (m < 0 || !W[m]) break; if (crust && crust[m] !== 1 && H[m] < sea - 1e-6 && s > 1) break; shelf = s * cellKm; }
      let enc = 0; for (let a = 0; a < 12; a++) { const th = a / 12 * 2 * Math.PI, dx = Math.cos(th), dy = Math.sin(th); if (dx * nx + dy * ny < .2) continue; for (let s = 2; s * cellKm < 1500; s++) { const m = step(n, dx, dy, s); if (m < 0) break; if (!W[m]) { enc++; break; } } }
      let land = 0, all = 0; const r = 4; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const m = at(I(n) + di, J(n) + dj); if (m < 0) continue; all++; if (!W[m]) land++; }
      const e = enc / 7, funnel = R(0, 1, (land / Math.max(1, all) - .45) / .25);
      return (.4 + 3.6 * smooth(25, 280, shelf)) * (1 - .8 * e * e) * (1 + .7 * funnel);
    }
  };
}

/* ---- classify: what each coast is made of (world-coast.js's sand, cliffs, marsh, mangroves, dunes, barriers, given the
        rock, the tides and what the shaping left), what kind of coast it is and why */
function classify(Hb, cols, rows, o) {
  const N = cols * rows, sea = 128, SH = o.geo, cellKm = o.cellKm, [la, lb] = o.lat, latOf = j => la + (lb - la) * (j + .5) / rows, I = n => n % cols, J = n => (n / cols) | 0;
  const at = (i, j) => { if (j < 0 || j >= rows) return -1; if (i < 0 || i >= cols) { if (!o.wrap) return -1; i = (i + cols) % cols; } return j * cols + i; };
  const W = new Uint8Array(N); for (let n = 0; n < N; n++) if (Hb[n] <= sea) W[n] = 1;
  const oc = ocean(W, cols, rows, at), WV = waveTools(Hb, cols, rows, sea + .5, cellKm, latOf, at, o.spin);
  // the tides at each coast cell (the shelf read from the depths: a byte of 121 is about 140 m down)
  const shallow = new Uint8Array(N); for (let n = 0; n < N; n++) shallow[n] = Hb[n] >= 121 ? 1 : 0;
  const tide = new Float32Array(N), coastCells = [];
  for (let n = 0; n < N; n++) { if (Hb[n] <= sea) continue; let c = false; for (const [di, dj] of NB4) { const m = at(I(n) + di, J(n) + dj); if (m >= 0 && oc[m]) { c = true; break; } } if (!c) continue; coastCells.push(n); const wv = WV.at(n, oc, true); if (wv) tide[n] = WV.tide(n, wv.nx, wv.ny, oc, shallow); }
  // what it is made of (world-coast.js, told of the rock, the tides and the shaping)
  const CO = require("./world-coast.js").coasts(Hb, cols, rows, Object.assign({}, o, { geo: { hard: SH.hard, mark: SH.mark, tide } }));
  const K = require("./world-coast.js").KIND, code = CO.code, mk = SH.mark;
  // what kind of coast each cell is
  const form = new Uint8Array(N), near = (n, r, test) => { for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const m = at(I(n) + di, J(n) + dj); if (m >= 0 && test(m)) return true; } return false; };
  const sst = n => o.sst ? o.sst[n] : 28 - .0058 * latOf(J(n)) ** 2;
  // (where a river runs: the land's busiest few cells of flow)
  const riverAcc = o.acc ? (() => { const a = []; for (let n = 0; n < N; n++) if (Hb[n] > sea) a.push(o.acc[n]); return pct(a, .97); })() : Infinity;
  for (const n of coastCells) {
    const k = code[n] & 15, w = code[n] >> 4, h = SH.hard[n], l = SH.lith[n], warm = sst(n), T = o.T ? o.T[n] : 12;
    const byMark = r => near(n, r, m => mk[m] === MARK.trough) ? 1 : near(n, r, m => mk[m] === MARK.scour) && SH.ice[n] ? 2 : near(n, 1, m => mk[m] >= MARK.deltaR && mk[m] <= MARK.deltaT) ? (near(n, 1, m => mk[m] === MARK.deltaR) ? 5 : near(n, 1, m => mk[m] === MARK.deltaW) ? 6 : 7) : near(n, 1, m => mk[m] === MARK.drowned) ? (h > .5 || (o.T && Hb[n] > 140) ? 3 : 4) : 0;
    let f = byMark(1);
    if (!f) {
      if (k === K.mangrove) f = 17; else if (k === K.marsh) f = 16;
      else if (near(n, 2, m => (code[m] & 15) === K.barrier || (code[m] & 15) === K.lagoon)) f = 13;
      else if (near(n, 1, m => (code[m] & 15) === K.dunes)) f = 15;
      else if (l === LITH.volcanic && o.crust && o.crust[n] !== 1) f = 11;
      else if (warm >= 23 && near(n, 2, m => mk[m] === MARK.barrierReef) ) f = 18;
      else if (warm >= 25 && k !== K.sand && Math.abs(latOf(J(n))) < 30 && !near(n, 3, m => SH.mark[m] === MARK.drowned || (o.acc && o.acc[m] > riverAcc))) f = 18;
      else if (l === LITH.limestone) f = 12;
      else if (l === LITH.belt) {
        // (a folded belt's coast: along the folds' grain (concordant), with land across a channel of the sea, the drowned
        // ridges standing as long islands: Dalmatian; across the grain (discordant), the hard bands end at the sea as
        // headlands and the soft are cut into bays)
        const wv = WV.at(n, oc, true), along = wv && (SH.gx[n] || SH.gy[n]) ? Math.abs(wv.nx * SH.gx[n] - wv.ny * SH.gy[n]) : 0;
        let isle = false; if (wv) for (const sg of [1, -1]) { let wet = false; for (let d = 1; d <= 6 && !isle; d++) { const m = at(Math.round(I(n) + wv.nx * d * sg), Math.round(J(n) - wv.ny * d * sg)); if (m < 0) break; if (Hb[m] <= sea) wet = true; else if (wet && SH.lith[m] === LITH.belt) isle = true; else if (!wet && d > 1) break; } }
        f = along > .65 && isle ? 8 : along < .5 || w >= 1 ? 9 : 10;
      }
      else if (near(n, 1, m => mk[m] === MARK.bay)) f = w >= 1 ? 9 : 10;
      else if (w >= 1 && (mk[n] === MARK.straight || near(n, 1, m => mk[m] === MARK.straight) || h < .45)) f = 14;
      else if (k === K.cliff) f = h < .45 ? 21 : 10;
      else if (w >= 1) f = h < .45 ? 14 : 9;
      else f = h < .45 ? 22 : 20;
    }
    form[n] = f;
  }
  // the sea's own: barrier reefs, atolls, fringing reefs off reef-fringed coasts
  const reef = new Uint8Array(N);
  for (let n = 0; n < N; n++) { if (Hb[n] > sea) continue; if (mk[n] === MARK.barrierReef) reef[n] = 1; else if (mk[n] === MARK.atoll) reef[n] = 2; }
  for (const n of coastCells) if (form[n] === 18) for (const [di, dj] of NB4) { const m = at(I(n) + di, J(n) + dj); if (m >= 0 && oc[m] && !reef[m]) reef[m] = 3; }
  // a few explanations, the longest stretch of each kind first
  const notes = [], seen = new Uint8Array(N), byForm = {};
  for (const n0 of coastCells) {
    if (seen[n0] || !form[n0]) continue; const f = form[n0], run = [n0]; seen[n0] = 1;
    for (let h = 0; h < run.length; h++) { const n = run[h]; for (const [di, dj] of NB8) { const m = at(I(n) + di, J(n) + dj); if (m >= 0 && !seen[m] && form[m] === f) { seen[m] = 1; run.push(m); } } }
    (byForm[f] = byForm[f] || []).push(run);
  }
  for (const [f, runs] of Object.entries(byForm)) {
    runs.sort((a, b) => b.length - a.length);
    for (const [q, run] of runs.slice(0, 2).entries()) { if (run.length < (q ? 14 : 4)) continue; const mid = run[Math.floor(run.length / 2)], why = explain(+f, run, mid); if (why) notes.push({ at: [I(mid), J(mid)], form: +f, len: Math.round(run.length * cellKm), text: why }); }
  }
  function explain(f, run, n) {
    const lat = latOf(J(n)), L = `${Math.abs(Math.round(lat))}°${lat >= 0 ? "N" : "S"}`, km = Math.round(run.length * cellKm), avg = a => run.reduce((s, m) => s + a[m], 0) / run.length;
    const rock = LITH_NAME[SH.lith[n]] || "rock", td = Math.round(avg(tide) * 10) / 10, mg = o.margin ? o.margin[n] : 0;
    const margin = mg === MARGIN.active || mg === MARGIN.trenchSide ? "an active margin, where the ocean floor dives under the land and the shelf is narrow" : mg === MARGIN.arc ? "an island arc over a sinking ocean plate" : mg === MARGIN.rift ? "a young rift, the plates parting" : mg === MARGIN.collision ? "a belt where two continents met" : "a passive margin far from any plate's edge, the shelf broad";
    const T = {
      1: `glaciers carved these valleys below the sea at the last glacial maximum, when the ${L} coast was some ${Math.round(6 + 5 * smooth(35, 70, Math.abs(lat)))} °C colder and its heights fed ice to the sea; the deepest water lies inland, a sill at each mouth; the sea flooded them when it rose 120 m`,
      2: `the ice sheet ground over this low, hard ${rock} and left knobs and hollows streamlined along its flow; the rising sea flooded the hollows, leaving thousands of islets`,
      3: `river valleys cut down when the sea stood 120 m lower and drowned when it rose; their rivers bring too little sediment from the hard ${rock} to fill them, so the inlets branch far inland`,
      4: `a lowland river valley drowned by the rising sea and widened into a funnel; the river's mud has partly filled it, and the tides (about ${td} m) wash its flats`,
      5: `the river brings more sediment than the weak waves and small tides here can carry off, so its distributaries push out into the sea as fingers, each lined by its levees`,
      6: `the river brings sediment, but the waves are strong: they rework it into a smooth bulge of beaches and beach ridges around the mouth`,
      7: `the tides (about ${td} m) are strong enough to rule the river's mouth: a funnel of channels and long islands of mud`,
      8: `${rock} folded into ridges running along the coast; the rising sea flooded the soft valleys between them, leaving long islands parallel to the shore`,
      9: `bands of hard and soft rock meet the sea across the coast: the waves cut bays into the soft bands, while the hard ones stand as headlands`,
      10: `hard ${rock} stands high against the waves on ${margin}`,
      11: `the shore of volcanic islands rising straight from deep water on ${margin}: dark cliffs and black-sand coves, the waves unbroken by any shelf`,
      12: `limestone laid down in a warm shallow sea; rain and sea water dissolve it into a ragged shore of coves, caves and islets`,
      13: `sand to spare, a gentle shelf and small tides (about ${td} m): the waves have built long islands of sand offshore, a lagoon behind them, broken by tidal inlets`,
      14: `soft sediment on ${margin}; the waves sweep sand along it and straighten it into long sandy shores`,
      15: `a dry coast, with sand brought along it by the drift and blown inland by the onshore wind into dunes that reach the sea`,
      16: `sheltered from the open waves, with tides of about ${td} m and mud from the rivers: tidal flats and salt marsh`,
      17: `a warm (${Math.round(avg({ length: N, ...{} }) || 0) || Math.round(sst(n))} °C sea), sheltered shore with mud from the rivers, where mangroves root in the tidal mud`,
      18: `warm, clear water (about ${Math.round(sst(n))} °C) and no river mud: coral reefs fringe the shore`,
      19: `a sunken volcano's ring of coral: the volcano sank, the reef kept growing upward`,
      20: `a low rocky shore of ${rock}; little sand stays on it`,
      21: `soft ${rock} under open waves: the cliffs retreat year by year, feeding sand to the beaches downdrift`,
      22: `a low shore of ${rock}; the waves carry off what sand reaches it, and the sea slowly takes the land`
    };
    return T[f] ? `${FORM[f][0]} (${km} km at ${L}): ${T[f]}` : null;
  }
  for (const h of o.hotspots || []) if (reef[h.n] === 2) { notes.push({ at: [I(h.n), J(h.n)], form: 19, len: 0, text: `${FORM[19][0]} (${Math.abs(Math.round(latOf(J(h.n))))}°${latOf(J(h.n)) >= 0 ? "N" : "S"}): ${"an old volcano of a hotspot chain, worn down and sunk as its plate carried it away; the coral of a warm sea kept growing upward as it sank, leaving a ring of reef islets around a lagoon"}` }); break; }
  const stats = {}; for (const n of coastCells) stats[form[n]] = (stats[form[n]] || 0) + 1;
  return { code, form, reef, raise: CO.raise, notes: notes.sort((a, b) => b.len - a.len), stats, coastN: coastCells.length, matStats: CO.stats };
}

/* ---- tools */
// the land's drainage: each cell's next one down toward the sea (hollows filled and spilled from, a priority flood)
function route(H, cols, rows, sea, at, wrap, U) {
  const N = cols * rows, rec = new Int32Array(N).fill(-1), order = new Int32Array(N), seen = new Uint8Array(N), lvl = new Float32Array(N), hp = new U.Heap(); let k = 0;
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (H[n] <= sea || (!wrap && (!i || i === cols - 1)) || !j || j === rows - 1) { seen[n] = 1; lvl[n] = Math.max(H[n], sea); hp.push(n, lvl[n]); } }
  while (hp.size) { const c = hp.pop(); order[k++] = c; const i = c % cols, j = (c / cols) | 0; for (const [di, dj] of NB8) { const m = at(i + di, j + dj); if (m < 0 || seen[m]) continue; seen[m] = 1; rec[m] = c; lvl[m] = Math.max(H[m], lvl[c] + 1e-5); hp.push(m, lvl[m]); } }
  return { rec, order, k, H, sea, cols };
}
// along the drainage: how far each land cell lies from the sea (km, as the water goes) and the cell where its water
// meets the sea
function flow(RT, cellKm) {
  const { rec, order, k, H, sea, cols } = RT, N = H.length, dsea = new Float32Array(N), mouth = new Int32Array(N).fill(-1), ck = cellKm || 1;
  for (let q = 0; q < k; q++) { const n = order[q]; if (H[n] <= sea) continue; const r = rec[n]; if (r < 0 || H[r] <= sea) { dsea[n] = .5 * ck; mouth[n] = n; } else { dsea[n] = dsea[r] + ck * ((n % cols) !== (r % cols) && ((n / cols) | 0) !== ((r / cols) | 0) ? 1.414 : 1); mouth[n] = mouth[r]; } }
  return { dsea, mouth, ck };
}
// the open sea: water joined to the sheet's edge
function ocean(W, cols, rows, at) {
  const N = cols * rows, oc = new Uint8Array(N), st = [];
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (W[n] && (!i || !j || i === cols - 1 || j === rows - 1)) { oc[n] = 1; st.push(n); } }
  while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; for (const [di, dj] of NB4) { const m = at(i + di, j + dj); if (m >= 0 && !oc[m] && W[m]) { oc[m] = 1; st.push(m); } } }
  return oc;
}
function maxFilter(A, cols, rows, r) {
  const t = new Float32Array(A.length), out = new Float32Array(A.length);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let m = -1e9; for (let d = -r; d <= r; d++) { const a = i + d; if (a >= 0 && a < cols) m = Math.max(m, A[j * cols + a]); } t[j * cols + i] = m; }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let m = -1e9; for (let d = -r; d <= r; d++) { const b = j + d; if (b >= 0 && b < rows) m = Math.max(m, t[b * cols + i]); } out[j * cols + i] = m; }
  return out;
}
function boxBlur(F, cols, rows, r, passes) {
  const tmp = new Float32Array(F.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) { let acc = 0, cnt = 0; const o = j * cols; for (let i = -r; i < cols + r; i++) { if (i + r >= 0 && i + r < cols) { acc += F[o + i + r]; cnt++; } if (i - r - 1 >= 0 && i - r - 1 < cols) { acc -= F[o + i - r - 1]; cnt--; } if (i >= 0 && i < cols) tmp[o + i] = acc / cnt; } }
    for (let i = 0; i < cols; i++) { let acc = 0, cnt = 0; for (let j = -r; j < rows + r; j++) { if (j + r >= 0 && j + r < rows) { acc += tmp[(j + r) * cols + i]; cnt++; } if (j - r - 1 >= 0 && j - r - 1 < rows) { acc -= tmp[(j - r - 1) * cols + i]; cnt--; } if (j >= 0 && j < rows) F[j * cols + i] = acc / cnt; } }
  }
}

module.exports = { shape, seafloor, classify, FORM, LITH, MARK, MARGIN };
