/* Campaign Atlas: a world made the way the Earth makes one (the user, 27 Oct 2026: generation grounded in real geology,
   then "the worlds look extremely unnatural": the second version, below, rebuilt on what landscape-evolution research
   does, Braun & Willett's FastScape and Cordonnier et al. 2016). Noise is used only for detail; the land's form comes
   from processes that act on each other:
     1. the continents grow from their first cells out over the sheet, cheapest ground first, so each has a shape of its
        own (lobes, peninsulas, gulfs), never the shape of the map's frame; tectonic plates grow the same way, their
        borders winding;
     2. the plates' meeting says only where the land rises and how fast (uplift): collisions of continents (a great belt,
        a lower plateau behind), an ocean diving under a continent (a coastal belt, volcanoes inland), two oceans (an arc
        of volcanic islands), plates parting (a rift sinking between raised shoulders), old belts across the old
        continents, hotspots; and a slow broad warping of the continents into basins and swells;
     3. the land rises and the rivers cut it down, together, over many steps of time (the stream power law, solved
        implicitly; hillslopes creep): ridges, spurs, foothills, valleys and branching river networks are what this
        makes, not what is drawn. The rain the land's own ranges catch feeds the rivers that cut them;
     4. the sea stands a little above the lowest land: it floods the river mouths into bays and estuaries, and the coast
        is the eroded land's own edge; beyond it the shelf, the slope and the deep ocean, a ridge where plates part, a
        trench where one dives;
     5. lakes in the hollows erosion cannot empty (rifts above all), salt pans where a hollow is too dry to fill;
     6. the climate: warmth from latitude and height, the winds of each belt carrying the ocean's moisture inland and
        raining it out as they climb, the subtropics dry.
   Heights follow the Earth's hypsometric curve at the end (rank for rank: the form stays, the proportions are real).
   Realism: "realistic", "fantasy", "alien" (gravity, air, water, warmth). The same seed makes the same world. */
"use strict";
const gauss = v => Math.exp(-v * v), smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

// U: the generator's tools (noiseFn, fbm, Heap, distance, mulberry32) from world-invent.js
function geology(o, U) {
  const { cols, rows, seed, land } = o, rnd = U.mulberry32(seed + 501), cellKm = (o.km || 3200) / cols;
  const PL = o.planet || {}, grav = PL.gravity || 1, air = PL.air || 1, water = PL.water;
  const share = water != null ? 1 - water : o.landShare;
  // the land is shaped on a coarser grid (each cell some 10 to 20 km), then refined on the map's own
  const f = Math.max(1, Math.round(Math.sqrt(cols * rows / (o.coarse || 60000)))), cc = Math.ceil(cols / f), cr = Math.ceil(rows / f), CN = cc * cr, ckm = cellKm * f;
  const nA = U.noiseFn(seed + 511), nB = U.noiseFn(seed + 512), nC = U.noiseFn(seed + 513), nD = U.noiseFn(seed + 514);
  // (zs: the noise sized to the land in km rather than to the sheet: 1 for a regional map, as it always was; a whole
  // planet's coasts and plate borders then wander at the scale the Earth's do, not in lines thousands of km long)
  const zs = o.noiseZoom || 1;
  const ci = n => n % cc, cj = n => (n / cc) | 0, X = n => (ci(n) + .5) / cr, Y = n => (cj(n) + .5) / cr, asp = cc / cr;
  const edgeD = n => Math.min(X(n) / asp, 1 - X(n) / asp, Y(n), 1 - Y(n));

  // growth from seed cells over a cost field, cheapest first: the shapes of plates and continents
  // (mul: each seed's own cost, so some grow far and some stay small)
  function grow(seeds, cost, limit, mul) {
    const lab = new Int16Array(CN).fill(-1), dist = new Float32Array(CN).fill(1e9), hp = new U.Heap(); let k = 0;
    seeds.forEach((s, q) => { dist[s] = 0; hp.push(s * 64 + q, 0); });
    while (hp.size && (!limit || k < limit)) {
      const v = hp.pop(), n = Math.floor(v / 64), q = v % 64; if (lab[n] >= 0) continue; lab[n] = q; k++;
      const i = ci(n), j = cj(n);
      for (const [di, dj] of NB8) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a; if (lab[m] >= 0) continue; const d = dist[n] + cost(m) * Math.hypot(di, dj) * (mul ? mul[q] : 1); if (d < dist[m]) { dist[m] = d; hp.push(m * 64 + q, d); } }
    }
    return lab;
  }
  const cell = (x, y) => Math.max(0, Math.min(cr - 1, Math.floor(y * cr))) * cc + Math.max(0, Math.min(cc - 1, Math.floor(x * cr)));

  /* 1. plates, and the continents */
  const nP = o.plates || Math.round(6 + rnd() * 3 + cols / 260), plates = [];
  for (let k = 0; k < nP; k++) { const a = rnd() * Math.PI * 2, s = .35 + rnd() * .65; plates.push({ vx: Math.cos(a) * s, vy: Math.sin(a) * s, seed: cell(rnd() * asp, rnd()) }); }
  // (a strongly varying cost bends the plates' borders into arcs, as real ones are, so the ranges along them curve)
  const plate = grow(plates.map(p => p.seed), m => .15 + 6 * Math.pow(U.fbm(nA, X(m) * 2.2 * zs + 11, Y(m) * 2.2 * zs, 4), 3) + (zs > 1 ? 2.5 * Math.pow(U.fbm(nC, X(m) * 7 * zs + 5, Y(m) * 7 * zs, 3), 2) : 0));
  const crust = new Uint8Array(CN);   // 1 continent, 2 an island arc or a hotspot's island
  const target = Math.round(CN * Math.min(.97, share * 1.1)), edgeCost = (m, sides) => { const d = sides ? Math.min(...sides.map(s => [X(m) / asp, 1 - X(m) / asp, Y(m), 1 - Y(m)][s])) : edgeD(m); return 30 * Math.max(0, 1 - d / (o.edgeMargin || .1)) ** 2; };
  // (the cost has strong contrasts at several scales, so a continent reaches out in lobes and peninsulas and leaves gulfs)
  const landCost = sides => m => .12 + 5 * Math.pow(U.fbm(nB, X(m) * 2.2 * zs, Y(m) * 2.2 * zs, 5), 3) + .6 * Math.pow(U.fbm(nA, X(m) * 5 * zs + 3, Y(m) * 5 * zs, 3), 2) + edgeCost(m, sides);
  const side = Math.floor(rnd() * 4), others = [0, 1, 2, 3].filter(s => s !== side);
  let seedsC;
  // (a world drawn by hand: its land is the sketch's, read onto this grid (atlas-world-sketch.js), not grown)
  const SK = o.sketch && o.sketch.land && o.sketch.land.length === cols * rows ? o.sketch : null;
  const blockAvg = A => { const out = new Float32Array(CN), cn = new Float32Array(CN); for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const m = Math.min(cr - 1, (j / f) | 0) * cc + Math.min(cc - 1, (i / f) | 0); out[m] += A[j * cols + i]; cn[m]++; } for (let m = 0; m < CN; m++) out[m] /= cn[m] || 1; return out; };
  if (SK) { const a = blockAvg(SK.land); for (let n = 0; n < CN; n++) crust[n] = a[n] >= .5 ? 1 : 0; }
  else if (land === "inland") crust.fill(1);
  else {
    if (land === "coast") { seedsC = []; for (let k = 0; k < 4; k++) { const t = .15 + k * .23; seedsC.push(side === 0 ? cell(.02, t) : side === 1 ? cell(asp - .02, t) : side === 2 ? cell(t * asp, .02) : cell(t * asp, .98)); } }
    else if (land === "islands") { seedsC = []; for (let k = 0; k < 5 + Math.floor(rnd() * 4); k++) seedsC.push(cell((.15 + rnd() * .7) * asp, .15 + rnd() * .7)); }
    // (a whole planet: several continents of every size spread over its oceans, some joined, as the Earth's are)
    // (as many landmasses as asked (the user, 27 Oct 2026: "how many landmasses does the person want"): their seeds
    // spread over the sheet, each the farthest of a few tries from those before, so they lie apart)
    else if (land === "masses") { seedsC = []; const nM = Math.max(1, Math.min(60, Math.round(o.landmasses || 1)));
      for (let k = 0; k < nM; k++) { let best = null, bd = -1; for (let t = 0; t < (k ? 24 : 1); t++) { const x = nM === 1 ? (.4 + rnd() * .2) * asp : (.07 + rnd() * .86) * asp, y = nM === 1 ? .4 + rnd() * .2 : .1 + rnd() * .8, d = Math.min(9, ...seedsC.map(c => Math.hypot(X(c) - x, Y(c) - y))) * (.85 + rnd() * .3); if (d > bd) { bd = d; best = cell(x, y); } } seedsC.push(best); } }
    else if (land === "continents") { seedsC = []; for (let k = 0; k < 6 + Math.floor(rnd() * 4); k++) seedsC.push(cell((.06 + rnd() * .88) * asp, .14 + rnd() * .72)); }
    else if (land === "archipelago") { seedsC = []; for (let k = 0; k < 14 + Math.floor(rnd() * 8); k++) seedsC.push(cell((.1 + rnd() * .8) * asp, .1 + rnd() * .8)); }
    else { seedsC = [cell((.42 + rnd() * .16) * asp, .42 + rnd() * .16)]; for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) seedsC.push(cell((.22 + rnd() * .56) * asp, .22 + rnd() * .56)); }
    // (many landmasses: sizes from great to small, a few big and more little, as the Earth's are; their coasts as lobed
    // as a continent's at their own scale)
    const MUL = land === "masses" && seedsC.length > 1 ? seedsC.map(() => Math.exp((rnd() + rnd() + rnd() - 1.5) * 1.3)) : null;
    const zm = land === "masses" ? Math.sqrt(seedsC.length) : 1, lc0 = landCost(land === "coast" ? others : null), lcM = m => .12 + 5 * Math.pow(U.fbm(nB, X(m) * 2.2 * zm * zs, Y(m) * 2.2 * zm * zs, 5), 3) + .9 * Math.pow(U.fbm(nA, X(m) * 6 * zm * zs + 3, Y(m) * 6 * zm * zs, 3), 2) + edgeCost(m);
    const lab = grow(seedsC, land === "masses" ? lcM : lc0, land === "archipelago" ? Math.round(target * .4) : land === "islands" ? Math.round(target * .7) : target, MUL);
    // (the growth stops on a ragged front: eased into a coastline's curves, the lobes and gulfs kept, the spikes gone)
    const F = new Float32Array(CN); for (let n = 0; n < CN; n++) F[n] = lab[n] >= 0 ? 1 : 0;
    // (separate landmasses stay separate: where two meet, a strait of sea between them)
    if (land === "masses" && seedsC.length > 1) { const r = Math.max(1, Math.round(cc * .008)); for (let n = 0; n < CN; n++) { if (lab[n] < 0) continue; const i = ci(n), j = cj(n); let other = false; for (let dj = -r; dj <= r && !other; dj++) for (let di = -r; di <= r; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a; if (lab[m] >= 0 && lab[m] !== lab[n]) { other = true; break; } } if (other) F[n] = 0; } }
    boxBlur(F, cc, cr, 3, 3); for (let n = 0; n < CN; n++) crust[n] = F[n] > .5 ? 1 : 0;
  }

  /* 2. where the land rises: the plates' borders, each cell's nearest one, and what kind it is */
  const near = new Int32Array(CN).fill(-1), dist = new Float32Array(CN).fill(1e9), q = [], bInfo = [];
  for (let n = 0; n < CN; n++) {
    const i = ci(n), j = cj(n); let other = -1, oc = 0, nx = 0, ny = 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a; if (plate[m] !== plate[n]) { other = plate[m]; oc = crust[m]; nx += di; ny += dj; } }
    if (other < 0) continue; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    const A = plates[plate[n]], B = plates[other], rvx = B.vx - A.vx, rvy = B.vy - A.vy;
    bInfo[n] = { pa: plate[n], pb: other, conv: -(rvx * nx + rvy * ny), shear: Math.abs(rvx * ny - rvy * nx), ca: crust[n], cb: oc };
    near[n] = n; dist[n] = 0; q.push(n);
  }
  for (let h = 0; h < q.length; h++) { const n = q[h], i = ci(n), j = cj(n); for (const [di, dj] of NB8) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a, d = dist[n] + Math.hypot(di, dj); if (d < dist[m] && d * ckm < (zs > 1 ? 900 : 450)) { dist[m] = d; near[m] = near[n]; q.push(m); } } }
  const up = new Float32Array(CN), ridge = new Float32Array(CN), trench = new Float32Array(CN), volc = [];
  const bump = (d, c, w) => gauss((d - c) / w);
  // (on a whole planet the belts are as broad as the Earth's great ones, the Andes and the Himalaya with their high
  // plateaus behind, rather than a regional map's narrower ridges, which at a planet's scale stand as thin walls)
  const BW = zs > 1 ? 2 : 1, BA = zs > 1 ? .8 : 1;
  for (let n = 0; n < CN; n++) {
    // a slow broad warping of every continent: basins and swells
    // (most of a continent is an old shield barely rising: its plains; here and there a slow swell of upland)
    if (crust[n]) up[n] += .015 + .22 * Math.max(0, U.fbm(nC, X(n) * 1.6 * zs, Y(n) * 1.6 * zs, 3) - .56);
    const b = near[n] >= 0 ? bInfo[near[n]] : null; if (!b) continue;
    const d = dist[n] * ckm, here = plate[n], mine = here === b.pa, cHere = !!crust[n], cOver = !!(mine ? b.cb : b.ca);
    // (a belt rises the whole length of its border, higher here and lower there along it)
    const along = .7 + .6 * U.fbm(nD, X(n) * 1.4 * zs, Y(n) * 1.4 * zs, 2);
    if (b.conv > .1) {
      const c = Math.min(1.5, b.conv) * along;
      if (cHere && cOver) up[n] += c * BA * (2.2 * bump(d, 40 * BW, 95 * BW) + .55 * bump(d, 190 * BW, 150 * BW));
      else if (cHere) { up[n] += c * BA * (1.8 * bump(d, 70 * BW, 60 * BW) + (zs > 1 ? .45 * bump(d, 280, 170) : 0)); if (Math.abs(d - 120) < ckm * .6 && rnd() < .05) volc.push(n); }
      else if (cOver) trench[n] += c * gauss(d / 60);
      else if (here > (mine ? b.pb : b.pa)) {
        // an island arc: a broken line of volcanic islands over the sinking plate
        if (zs > 1 ? d > 70 && d < 150 && U.fbm(nA, X(n) * 14 * zs, Y(n) * 14 * zs, 2) > .6 : d > 70 && d < 130 && U.fbm(nA, X(n) * 9 * zs, Y(n) * 9 * zs, 2) > .5) { crust[n] = 2; up[n] += c * 1.4; if (rnd() < .06) volc.push(n); }
      } else trench[n] += c * gauss(d / 60);
    } else if (b.conv < -.1) {
      const c = Math.min(1.4, -b.conv) * along;
      if (cHere) { up[n] += c * (zs > 1 ? .12 : 1) * (-.2 * gauss(d / 35 / BW) + .4 * bump(d, 70 * BW, 40 * BW)); if (d < ckm && rnd() < .02) volc.push(n); }
      else ridge[n] += c * gauss(d / 100);
    }
  }
  // (the mountains the sketch shows: raised where they were drawn, the plates' own belts kept faint beside them so the
  // drawing leads; with none drawn, the plates make the mountains as on any world)
  let drawnM = false;
  if (SK && SK.mtn) { const mC = blockAvg(SK.mtn); let s = 0, l = 0; for (let n = 0; n < CN; n++) if (crust[n]) { l++; s += mC[n] > .25 ? 1 : 0; } drawnM = s > l * .003; if (drawnM) for (let n = 0; n < CN; n++) up[n] = up[n] * .4 + (crust[n] ? 1.7 * mC[n] : 0); }
  // (a volcano painted red: a cone raised there, and a volcano marked)
  if (SK && SK.kind) { const seen = new Uint8Array(cols * rows);
    for (let n0 = 0; n0 < cols * rows; n0++) { if (seen[n0] || SK.kind[n0] !== 7) continue; const st = [n0]; seen[n0] = 1; let sx = 0, sy = 0, c = 0;
      while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; sx += i; sy += j; c++; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && !seen[m] && SK.kind[m] === 7) { seen[m] = 1; st.push(m); } }
      const ci0 = Math.min(cc - 1, ((sx / c) / f) | 0), cj0 = Math.min(cr - 1, ((sy / c) / f) | 0), R = Math.ceil(60 / ckm) + 1;
      for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) { const a = ci0 + di, b = cj0 + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; up[b * cc + a] += 1.3 * gauss(Math.hypot(di, dj) * ckm / 30); }
      volc.push(cj0 * cc + ci0); } }
  // old belts, worn low, across the old continents
  for (let k = 0; k < nP && !drawnM; k++) {
    if (rnd() < .45) continue; const s = plates[k].seed; if (!crust[s]) continue;
    const a = rnd() * Math.PI, ux = Math.cos(a), uy = Math.sin(a), L = (.2 + rnd() * .25) / (zs > 1 ? Math.sqrt(zs) : 1), cx = X(s), cy = Y(s), wd = zs > 1 ? 300 : 90, oa = zs > 1 ? .4 : .7;
    // (on a whole planet such a belt would run thousands of km dead straight: there it is shorter and bends along its
    // length, as the Appalachians and the Urals do)
    for (let n = 0; n < CN; n++) { if (plate[n] !== k || !crust[n]) continue; const dx = X(n) - cx, dy = Y(n) - cy, t = dx * ux + dy * uy; if (Math.abs(t) > L) continue; const bend = zs > 1 ? (U.fbm(nD, t / L * 1.5 + k * 3.1, k * 1.7, 2) - .5) * L * 1.2 : 0, off = Math.abs(-dx * uy + dy * ux - bend) * cr * ckm; up[n] += oa * gauss(off / wd) * (1 - (t / L) ** 2); }
  }
  // hotspots: a chain of volcanic islands over a moving ocean plate; on a continent a gentle swell
  for (let h = 0; h < Math.floor(rnd() * 2.6); h++) {
    const s = Math.floor(rnd() * CN), p = plates[plate[s]], sp = Math.hypot(p.vx, p.vy) || 1;
    for (let k = 0; k < 6; k++) {
      const x = X(s) - p.vx / sp * k * 60 / (cr * ckm), y = Y(s) - p.vy / sp * k * 60 / (cr * ckm); if (x < 0 || y < 0 || x > asp || y > 1) break;
      const m0 = cell(x, y), R = Math.ceil(80 / ckm);
      for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) { const a = ci(m0) + di, b = cj(m0) + dj; if (a < 0 || b < 0 || a >= cc || b >= cr) continue; const m = b * cc + a, d = Math.hypot(di, dj) * ckm, w = gauss(d / 28); if (crust[m] === 1) continue; else if (w > .35 && k < 4) { crust[m] = 2; up[m] += 1.2 * Math.pow(.8, k) * w; } }
      if (k < 2) volc.push(m0);
    }
  }
  // (island arcs and hotspot islands rounded into islands, not blocks)
  { const F = new Float32Array(CN); for (let n = 0; n < CN; n++) F[n] = crust[n] === 2 ? 1 : 0; boxBlur(F, cc, cr, zs > 1 ? 2 : 1, 2); for (let n = 0; n < CN; n++) if (crust[n] !== 1) crust[n] = F[n] > (zs > 1 ? .38 : .42) ? 2 : 0; }
  boxBlur(up, cc, cr, 1, 2);
  for (let n = 0; n < CN; n++) up[n] = Math.max(crust[n] ? .02 : 0, up[n]) / grav;

  /* 3. the land rises and the rivers cut it: uplift and erosion together, step by step (the stream power law, its
        implicit form: Braun & Willett 2013), the hillslopes creeping */
  const h = new Float32Array(CN);
  // (the first land is not quite flat: a gentle unevenness of a few cells' breadth, from which the drainage organises
  // itself into branching networks, rather than running in parallel lines down a smooth slope)
  for (let n = 0; n < CN; n++) h[n] = crust[n] ? 5 + U.fbm(nD, X(n) * 22 * zs, Y(n) * 22 * zs, 3) * 6 + rnd() * .5 : -1;
  let rain = new Float32Array(CN).fill(1);
  const K = .06 * Math.min(1.5, air), mExp = .45, kd = .05, steps = 220, dt = 1;
  const isBase = n => !crust[n];
  const rivC = SK && SK.river ? blockAvg(SK.river) : null;
  for (let it = 0; it < steps; it++) {
    for (let n = 0; n < CN; n++) if (crust[n]) h[n] += up[n] * dt;
    landscapeStep(h, cc, cr, isBase, rain, K, mExp, dt, U);
    // (a river the sketch shows keeps cutting its valley as the land rises, so the water gathers along it)
    if (rivC && it % 4 === 0) for (let n = 0; n < CN; n++) if (crust[n] && rivC[n] > .03 && h[n] > 3) h[n] *= 1 - .02 * Math.min(1, rivC[n] * 1.5);
    // creep: hilltops round, steep slopes ease
    if (it % 2 === 0) creep(h, cc, cr, isBase, kd * 2 * dt);
    // halfway, the rain the ranges catch begins to feed the rivers that cut them
    if (it === steps >> 1) { const tmp = Float32Array.from(h); let top = 1; for (let n = 0; n < CN; n++) top = Math.max(top, tmp[n]); for (let n = 0; n < CN; n++) tmp[n] = crust[n] ? Math.max(1, tmp[n] / top * 4000) : -3000; const C0 = climate(tmp, cc, cr, Object.assign({}, o, { km: (o.km || 3200) }), nD, U, air); rain = C0.rain.map(r => Math.max(.15, r)); let mean = 0; for (let n = 0; n < CN; n++) mean += rain[n]; mean /= CN; for (let n = 0; n < CN; n++) rain[n] /= mean; }
  }

  /* 4. onto the map's own grid: the coarse land laid smoothly, a fine grain of detail, and a few more steps of erosion
        to cut the small valleys into it */
  const N = cols * rows, Hf = new Float32Array(N), Cf = new Uint8Array(N), Rf = new Float32Array(N), Uf = new Float32Array(N), ridgeF = new Float32Array(N), trenchF = new Float32Array(N);
  const samp = (A, x, y) => { const fx = x / f - .5, fy = y / f - .5, i = Math.max(0, Math.min(cc - 1, Math.floor(fx))), j = Math.max(0, Math.min(cr - 1, Math.floor(fy))), i1 = Math.min(cc - 1, i + 1), j1 = Math.min(cr - 1, j + 1), tx = Math.max(0, Math.min(1, fx - i)), ty = Math.max(0, Math.min(1, fy - j)); return (A[j * cc + i] * (1 - tx) + A[j * cc + i1] * tx) * (1 - ty) + (A[j1 * cc + i] * (1 - tx) + A[j1 * cc + i1] * tx) * ty; };
  const crustF = Float32Array.from(crust, v => v ? 1 : 0);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const n = j * cols + i, x = i + .5, y = j + .5, c = samp(crustF, x, y);
    // (the crust's edge wanders a little at the finer grain)
    Cf[n] = c > .5 ? 1 : 0;
    Hf[n] = Cf[n] ? Math.max(.5, samp(h, x, y)) + rnd() * .4 : -1; Rf[n] = samp(rain, x, y); Uf[n] = samp(up, x, y); ridgeF[n] = samp(ridge, x, y); trenchF[n] = samp(trench, x, y);
  }
  if (f > 1) { const isB = n => !Cf[n]; for (let it = 0; it < 14; it++) { for (let n = 0; n < N; n++) if (Cf[n]) Hf[n] += Uf[n] * .25; landscapeStep(Hf, cols, rows, isB, Rf, K * Math.pow(f, mExp * 2 - 1), mExp, .25, U); } creep(Hf, cols, rows, n => !Cf[n], .03); }

  /* 5. the sea's level: a little above the lowest land, so the river mouths flood into bays and estuaries */
  const landVals = []; for (let n = 0; n < N; n++) if (Cf[n]) landVals.push(Hf[n]); landVals.sort((a, b) => a - b);
  const wantLand = Math.round(N * share), seaLvl = landVals.length > wantLand ? landVals[landVals.length - wantLand] : 0;
  const E = new Float32Array(N), isLand = new Uint8Array(N);
  for (let n = 0; n < N; n++) if (SK ? SK.land[n] : Cf[n] && Hf[n] > seaLvl) isLand[n] = 1;
  // the land's heights, rank for rank, on the Earth's hypsometric curve (weak gravity lets them stand higher)
  { const idx = []; for (let n = 0; n < N; n++) if (isLand[n]) idx.push(n); idx.sort((a, b) => Hf[a] - Hf[b]);
    const Q = [[0, 2], [.1, 60], [.25, 200], [.5, 460], [.75, 1000], [.88, 1800], [.94, 2700], [.98, 4000], [.995, 5300], [1, 6400 + rnd() * 1800]];
    const at = p => { for (let k = 1; k < Q.length; k++) if (p <= Q[k][0]) return Q[k - 1][1] + (p - Q[k - 1][0]) / (Q[k][0] - Q[k - 1][0]) * (Q[k][1] - Q[k - 1][1]); return Q[Q.length - 1][1]; };
    idx.forEach((n, k) => { E[n] = at(k / Math.max(1, idx.length - 1)) / grav; }); }
  // the sea floor: the shelf, the slope, the deep ocean; a ridge where plates part, a trench where one dives; the
  // drowned valleys shallow
  const dLand = U.distance(cols, rows, n => isLand[n] === 1);
  for (let n = 0; n < N; n++) {
    if (isLand[n]) continue; const d = dLand[n] * cellKm;
    let z = d < 80 ? -40 - d * 1.6 : d < 260 ? -170 - (d - 80) / 180 * 3300 : -3470 - Math.min(800, (d - 260) * 1.5);
    if (Cf[n]) z = Math.max(z, -(seaLvl - Hf[n]) * 30 - 15);
    E[n] = z + ridgeF[n] * 1800 * Math.min(1, d / 300) - trenchF[n] * 2600 + (U.fbm(nC, (n % cols) / cols * 12 * zs, ((n / cols) | 0) / cols * 12 * zs, 3) - .5) * 260;
    if (E[n] > -5) E[n] = -5;
  }

  // (the deep floor is smooth at this scale: what the coarse grid left in it is eased away)
  { const Z = new Float32Array(N); for (let n = 0; n < N; n++) Z[n] = isLand[n] ? -40 : E[n]; boxBlur(Z, cols, rows, 3, 2); for (let n = 0; n < N; n++) if (!isLand[n]) E[n] = Math.min(-5, dLand[n] < 3 ? E[n] : Z[n]); }

  // (a lake the sketch shows lies in a hollow: its floor below the lowest of its shore)
  if (SK && SK.lake) { const seen = new Uint8Array(N);
    for (let n = 0; n < N; n++) { if (seen[n] || !SK.lake[n] || !isLand[n]) continue; const cells = [n]; seen[n] = 1; let shore = 1e9;
      for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, j > 0 ? c - cols : -1, j < rows - 1 ? c + cols : -1]) { if (m < 0) continue; if (SK.lake[m] && isLand[m]) { if (!seen[m]) { seen[m] = 1; cells.push(m); } } else if (isLand[m]) shore = Math.min(shore, E[m]); } }
      if (shore < 1e9) for (const c of cells) E[c] = Math.max(1, Math.min(E[c], shore - 40)); } }

  /* 6. the climate on the land as it is */
  // (`--climate-model earth`: the Earth's own causes of wet and dry, worked out (climateEarth below); the classic model
  // stays the default until the user approves it. The land itself is the same either way: the erosion above always runs
  // on the classic rain)
  let C = o.climateModel === "earth" ? climateEarth(E, cols, rows, o, nD, U, air) : climate(E, cols, rows, o, nD, U, air);
  if (C.mm) C.mm = Float32Array.from(C.rain);
  if (process.env.ATLAS_DUMP && C.mm) require("fs").writeFileSync(process.env.ATLAS_DUMP, JSON.stringify({ cols, rows, la: (o.lat || LAT[o.climate] || LAT.temperate), E: Array.from(E, v => Math.round(v)), mm: Array.from(C.mm, Math.round), sst: Array.from(C.sst, v => Math.round(v * 10) / 10), fog: Array.from(C.fog, v => Math.round(v * 100) / 100) }));
  { const r = []; for (let n = 0; n < N; n++) if (E[n] > 0) r.push(C.rain[n]); r.sort((a, b) => a - b);
    const med = r[Math.floor(r.length / 2)] || 1, want = ({ temperate: .62, varied: .55, cold: .55, polar: .4, warm: .5, tropical: .72, arid: .26, wet: .82 }[o.climate] || .55) * air;
    for (let n = 0; n < N; n++) C.rain[n] *= want / med; }

  /* 7. lakes in the hollows the rivers cannot empty, salt pans where they cannot fill */
  const F = fill(E, cols, rows, U), lakeCells = new Uint8Array(N), playa = [], seen = new Uint8Array(N), I = n => n % cols, J = n => (n / cols) | 0;
  for (let n = 0; n < N; n++) {
    if (seen[n] || E[n] <= 0 || F[n] - E[n] < 10) continue;
    const cells = [n]; seen[n] = 1; let deep = 0, wet = 0;
    for (let k = 0; k < cells.length; k++) { const c = cells[k], i = I(c), j = J(c); deep = Math.max(deep, F[c] - E[c]); wet += C.rain[c]; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (!seen[m] && E[m] > 0 && F[m] - E[m] >= 10) { seen[m] = 1; cells.push(m); } } }
    if (cells.length < 10 || deep < 25) continue;
    if (wet / cells.length > .2 * air) for (const c of cells) lakeCells[c] = 1; else playa.push(...cells);
  }
  { let landN = 0; const lk = []; for (let n = 0; n < N; n++) { if (E[n] > 0) landN++; if (lakeCells[n]) lk.push(n); }
    const room = Math.round(landN * .03); if (lk.length > room) { lk.sort((a, b) => (F[b] - E[b]) - (F[a] - E[a])); for (let k = room; k < lk.length; k++) lakeCells[lk[k]] = 0; } }
  // (no lake of the hollows' own on a drawn river: its water runs on)
  if (SK && SK.river) for (let n = 0; n < N; n++) if (SK.river[n] > .3 && !(SK.lake && SK.lake[n])) lakeCells[n] = 0;
  // (the lakes the sketch shows are lakes, whatever the rain and however many there are)
  if (SK && SK.lake) { for (let n = 0; n < N; n++) if (SK.lake[n] && E[n] > 0) lakeCells[n] = 1;
    // (and only as big as drawn: water the hollows would add round a drawn lake is left as land)
    const st = [], seen = new Uint8Array(N); for (let n = 0; n < N; n++) if (SK.lake[n] && lakeCells[n]) { seen[n] = 1; st.push(n); }
    while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && !seen[m] && lakeCells[m]) { seen[m] = 1; st.push(m); if (!SK.lake[m]) lakeCells[m] = 0; } } }

  /* 8. what lives on it: climate classes, biomes and tree cover, from all of the above (world-ecology.js) */
  const want = ({ temperate: .62, varied: .55, cold: .55, polar: .4, warm: .5, tropical: .72, arid: .26, wet: .82 }[o.climate] || .55) * air;
  const eco = o.ecology === false ? null : require("./world-ecology.js").ecology({ E, lake: lakeCells, rain: C.rain, temp: C.temp, want, playa, mm: C.mm, fog: C.fog, paint: SK && SK.kind ? SK.kind : null }, { cols, rows, km: o.km, climate: o.climate, detailed: o.detailedBiomes, model: o.climateModel, lat: o.lat, warmC: o.warmC }, U);

  /* to the grid the maps are drawn from */
  // (and each height's fraction, kept apart: a shaded relief map needs the land's slopes finer than 255 steps)
  const Hb = new Uint8Array(N), Lo = new Uint8Array(N), M = new Uint8Array(N);
  let top = 0; for (let n = 0; n < N; n++) if (E[n] > top) top = E[n];
  for (let n = 0; n < N; n++) {
    const v = lakeCells[n] ? 121 : E[n] <= 0 ? Math.max(0, Math.min(127.99, 128 + depthT(E[n]))) : Math.min(255.99, 129 + 126 * landT(E[n]));
    Hb[n] = Math.floor(v); Lo[n] = Math.min(255, Math.round((v - Hb[n]) * 256));
    // (wetness: how much rain the land has against what the air would take from it, where the ecology knows it)
    M[n] = Math.max(0, Math.min(255, Math.round(eco ? Math.min(1, eco.AI[n] / 1.8) * 255 : C.rain[n] * 200)));
  }
  const coast = U.distance(cols, rows, n => Hb[n] <= 128);
  const full = m => Math.min(rows - 1, Math.floor((cj(m) + .5) * f)) * cols + Math.min(cols - 1, Math.floor((ci(m) + .5) * f));
  const vols = [], maxV = Math.max(2, Math.round(N / 22000)); for (const m of volc) { const n = full(m); if (vols.length < maxV && Hb[n] > 128 && !lakeCells[n] && vols.every(v => Math.hypot(I(v) - I(n), J(v) - J(n)) > 28)) vols.push(n); }
  return { H: Hb, Lo, M, coast, temp: C.temp, eco, info: { plates: nP, continental: plates.filter(p => crust[p.seed] === 1).length, volcanoes: vols, playa, lakes: lakeCells.reduce((s, v) => s + v, 0), peak: Math.round(top / 10) * 10 } };
}
// one step of the rivers' cutting: water routed down the land (through its hollows, which it fills and spills from:
// a priority flood from the sea), gathered from all the land above, and the stream power law solved implicitly from
// the sea up, so the step is stable however long: h = (h + F h_receiver) / (1 + F), F = K dt A^m / dx
function landscapeStep(h, cols, rows, isBase, rain, K, mExp, dt, U) {
  const N = cols * rows, rec = new Int32Array(N).fill(-1), order = new Int32Array(N), seen = new Uint8Array(N), lvl = new Float32Array(N), hp = new U.Heap(); let k = 0;
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (isBase(n) || !i || !j || i === cols - 1 || j === rows - 1) { seen[n] = 1; lvl[n] = isBase(n) ? 0 : h[n]; hp.push(n, lvl[n]); } }
  while (hp.size) {
    const c = hp.pop(); order[k++] = c; const i = c % cols, j = (c / cols) | 0;
    for (const [di, dj] of NB8) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (seen[m]) continue; seen[m] = 1; rec[m] = c; lvl[m] = Math.max(h[m], lvl[c] + 1e-4); hp.push(m, lvl[m]); }
  }
  const A = new Float32Array(N); for (let n = 0; n < N; n++) A[n] = isBase(n) ? 0 : rain[n];
  for (let q = k - 1; q >= 0; q--) { const n = order[q], r = rec[n]; if (r >= 0) A[r] += A[n]; }
  for (let q = 0; q < k; q++) {
    const n = order[q], r = rec[n]; if (r < 0 || isBase(n)) continue;
    const dx = (n % cols !== r % cols && ((n / cols) | 0) !== ((r / cols) | 0)) ? 1.414 : 1, hr = isBase(r) ? 0 : h[r];
    if (h[n] <= hr) continue;   // a hollow: it fills, it is not cut
    const F = K * dt * Math.pow(A[n], mExp) / dx;
    h[n] = (h[n] + F * hr) / (1 + F);
  }
}
// hillslope creep: each slope eases toward its neighbours
function creep(h, cols, rows, isBase, k) {
  const N = cols * rows, d = new Float32Array(N);
  for (let n = 0; n < N; n++) { if (isBase(n)) continue; const i = n % cols, j = (n / cols) | 0; let s = 0, c = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; s += isBase(m) ? 0 : h[m]; c++; } d[n] = (s / c - h[n]) * k * c; }
  for (let n = 0; n < N; n++) if (!isBase(n)) h[n] = Math.max(.01, h[n] + d[n]);
}
// heights above the sea to the map's scale: 0..1, as the Earth's land lies (200 m low, 1000 m upland, 2000 m the
// mountains begin, 6000 m and more the highest peaks)
function landT(e) { const K = [[0, 0], [200, .06], [500, .15], [1000, .28], [1500, .37], [2000, .45], [3000, .6], [4500, .78], [6000, .9], [8500, 1]]; for (let k = 1; k < K.length; k++) if (e <= K[k][0]) return K[k - 1][1] + (e - K[k - 1][0]) / (K[k][0] - K[k - 1][0]) * (K[k][1] - K[k - 1][1]); return 1; }
// depths below the sea: the shelf shallow, the deep ocean far below
function depthT(e) { const K = [[0, 0], [-200, -10], [-1000, -28], [-4000, -88], [-7000, -126]]; for (let k = 1; k < K.length; k++) if (e >= K[k][0]) return K[k - 1][1] + (e - K[k - 1][0]) / (K[k][0] - K[k - 1][0]) * (K[k][1] - K[k - 1][1]); return -126; }

function boxBlur(F, cols, rows, r, passes) {
  const tmp = new Float32Array(F.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) { let acc = 0, cnt = 0; const o = j * cols; for (let i = -r; i < cols + r; i++) { if (i + r >= 0 && i + r < cols) { acc += F[o + i + r]; cnt++; } if (i - r - 1 >= 0 && i - r - 1 < cols) { acc -= F[o + i - r - 1]; cnt--; } if (i >= 0 && i < cols) tmp[o + i] = acc / cnt; } }
    for (let i = 0; i < cols; i++) { let acc = 0, cnt = 0; for (let j = -r; j < rows + r; j++) { if (j + r >= 0 && j + r < rows) { acc += tmp[(j + r) * cols + i]; cnt++; } if (j - r - 1 >= 0 && j - r - 1 < rows) { acc -= tmp[(j - r - 1) * cols + i]; cnt--; } if (j >= 0 && j < rows) F[j * cols + i] = acc / cnt; } }
  }
}
// the land with its hollows filled as water would fill them (priority flood from the sea and the map's edge)
function fill(E, cols, rows, U) {
  const N = cols * rows, F = new Float32Array(N), seen = new Uint8Array(N), hp = new U.Heap();
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (E[n] <= 0 || !i || !j || i === cols - 1 || j === rows - 1) { seen[n] = 1; F[n] = E[n]; hp.push(n, E[n]); } }
  while (hp.size) { const c = hp.pop(), i = c % cols, j = (c / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (seen[m]) continue; seen[m] = 1; F[m] = Math.max(E[m], F[c] + .01); hp.push(m, F[m]); } }
  return F;
}
// the climate: warmth by latitude and height; the winds of each latitude carrying the ocean's moisture inland and
// raining it out as they rise over the land
const LAT = { temperate: [52, 38], varied: [68, 4], cold: [70, 52], polar: [84, 66], warm: [36, 22], tropical: [16, -6], arid: [33, 17], wet: [56, 42] };
function climate(E, cols, rows, o, nz, U, air) {
  const N = cols * rows, [la, lb] = o.lat || LAT[o.climate] || LAT.temperate, cellKm = (o.km || 3200) / cols;
  const lat = j => la + (lb - la) * (j + .5) / rows, temp = new Float32Array(N), rain = new Float32Array(N);
  for (let n = 0; n < N; n++) { const j = (n / cols) | 0, L = Math.abs(lat(j)) * Math.PI / 180; temp[n] = -22 + 49 * Math.pow(Math.cos(L), 1.25) - Math.max(0, E[n]) * .0065 + (o.tempShift || 0) + (o.warmC || 0); }
  // the share of moisture the air sheds as it crosses a cell of land, and what it gives up climbing
  const sweep = (dirx, tilt, weight) => {
    for (let j0 = 0; j0 < rows; j0++) {
      const absLat = Math.abs(lat(j0)), band = absLat < 30 ? -1 : absLat < 60 ? 1 : -1, dx = band * dirx;
      // the subtropical highs are dry, the equator's rising air wet
      const belt = 1 + .5 * gauss(absLat / 9) - .5 * gauss((absLat - 26) / 9) - .35 * Math.max(0, Math.min(1, (absLat - 60) / 18));
      let q = .7, prev = 0, jj = j0;
      for (let s = 0; s < cols; s++) {
        const i = dx > 0 ? s : cols - 1 - s, j = Math.max(0, Math.min(rows - 1, Math.round(jj))); jj += tilt; const n = j * cols + i;
        const warm = Math.max(0, Math.min(1, (temp[n] + 10) / 40)), sat = (.25 + .9 * warm) * air;
        if (E[n] <= 0) { q += (sat - q) * .12; prev = 0; continue; }
        const climb = Math.max(0, E[n] - prev) / 1000 * (8 / cellKm), r = Math.min(q, q * (.028 * belt + climb * .55));
        rain[n] += r * 22 * weight; q -= r * .45; prev = E[n];
      }
    }
  };
  // (the winds of each belt, and a share from the other way: monsoons, sea breezes, storms off the other ocean)
  sweep(1, 0, .3); sweep(1, .12, .15); sweep(1, -.12, .15); sweep(1, .05, .1); sweep(1, -.05, .1); sweep(-1, .07, .1); sweep(-1, -.07, .1);
  const tmp = Float32Array.from(rain); U.box ? 0 : 0;
  // (rain falls over a region, not along the lines the winds were followed on)
  boxBlur(rain, cols, rows, 4, 2);
  for (let n = 0; n < N; n++) rain[n] = rain[n] * (.85 + nz((n % cols) / 18, ((n / cols) | 0) / 18) * .3);
  return { temp, rain };
}

// the climate as the Earth makes its deserts (the user, 27 Oct 2026: "deserts should appear naturally because of the
// world's climate and geography"). The winds of each belt cross the sea and the land as before, but now:
//   - the sea's warmth sets how much water the air takes up (about 7% more for each degree: Clausius–Clapeyron), so
//     cold seas and the polar air give little rain (the polar deserts);
//   - cold currents run along the subtropical west coasts (the eastern side of each ocean: the Canary, Benguela,
//     Humboldt and California currents), cooling the sea and steadying the air over it, so the coast beside them barely
//     rains though it is foggy (the Namib, the Atacama, Baja);
//   - warm currents run along the east coasts, making them wetter (Florida, south-east China, eastern Australia);
//   - the air sinks in the subtropical highs (about 20 to 35°), so it rains little there; it rises at the equator and
//     along the storm tracks of the westerlies (about 40 to 60°), so it rains much there (the Sahara, Arabia, Australia;
//     the Congo; western Europe);
//   - the air that climbs a range rains out on the windward side, and descending warms and dries (the foehn), so the
//     lee lies in a rain shadow (Patagonia behind the Andes, the Great Basin behind the Sierra Nevada);
//   - the moisture is used up as the air travels over land, so the deep interiors far from any sea are dry (the Gobi,
//     the Taklamakan, central Asia);
//   - in summer the heated land draws the sea's air in from the equator's side (the monsoon), so the rain fades
//     poleward from an equatorward coast into the desert (West Africa: forest, savanna, the Sahel, the Sahara).
// The rain comes out in mm a year, not scaled to the climate's median, so a dry world is dry because of where it lies.
function climateEarth(E, cols, rows, o, nz, U, air) {
  const N = cols * rows, [la, lb] = o.lat || LAT[o.climate] || LAT.temperate, cellKm = (o.km || 3200) / cols;
  const lat = j => la + (lb - la) * (j + .5) / rows, temp = new Float32Array(N), rain = new Float32Array(N), fog = new Float32Array(N);
  for (let n = 0; n < N; n++) { const j = (n / cols) | 0, L = Math.abs(lat(j)) * Math.PI / 180; temp[n] = -22 + 49 * Math.pow(Math.cos(L), 1.25) - Math.max(0, E[n]) * .0065 + (o.tempShift || 0) + (o.warmC || 0); }
  // the sea's surface warmth, and the currents along its coasts: for each sea cell, how far the coast lies to its east
  // (it is then on an ocean's eastern side, off a west coast) and to its west
  const dE = new Float32Array(N), dW = new Float32Array(N), wideE = new Float32Array(N), sst = new Float32Array(N), cold = new Float32Array(N);
  for (let j = 0; j < rows; j++) {
    // (and how broad that land is: an island or a thin peninsula turns no ocean current)
    let last = -1, run = 0, wide = 0; for (let i = cols - 1; i >= 0; i--) { const n = j * cols + i; if (E[n] > 0) { run++; last = i; wide = run * cellKm; } else run = 0; dE[n] = last < 0 ? 1e9 : (last - i) * cellKm; wideE[n] = wide; }
    last = -1; for (let i = 0; i < cols; i++) { const n = j * cols + i; if (E[n] > 0) last = i; dW[n] = last < 0 ? 1e9 : (i - last) * cellKm; }
  }
  const warmC = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    if (E[n] > 0) continue; const a = Math.abs(lat((n / cols) | 0));
    cold[n] = smooth(6, 14, a) * (1 - smooth(36, 46, a)) * Math.exp(-dE[n] / 350) * (dW[n] > 400 ? 1 : .5) * smooth(250, 900, wideE[n]);
    warmC[n] = smooth(4, 12, a) * (1 - smooth(38, 50, a)) * Math.exp(-dW[n] / 600);
  }
  // (a current is a broad stream, not a line along each row)
  boxBlur(cold, cols, rows, 5, 2); boxBlur(warmC, cols, rows, 5, 2);
  for (let n = 0; n < N; n++) { if (E[n] > 0) { cold[n] = 0; continue; } const a = Math.abs(lat((n / cols) | 0)); sst[n] = Math.max(-1.8, 28 - .0058 * a * a - 8 * cold[n] + 3 * warmC[n]); }
  const cap = t => air * Math.min(1.8, Math.exp(.065 * (t - 25)));
  const eff0 = cellKm / 1400, sub = a => gauss((a - 27) / 7.5), itcz = a => gauss(a / 8), storm = a => gauss((a - 50) / 14);
  const mon = a => smooth(4, 9, a) * (1 - smooth(14, 24, a));
  // one cell crossed by the air: st is the air's own state (its water q, the ground it last crossed, how steady the
  // cold sea left it, how far it has come down)
  const cross = (n, st, w, summer) => {
    if (E[n] <= 0) { st.q += (cap(sst[n]) - st.q) * .15; st.stab += (cold[n] - st.stab) * .3; st.prev = 0; st.lee *= .5; return; }
    const a = Math.abs(lat((n / cols) | 0)), d = (E[n] - st.prev) / 1000 * (8 / cellKm);
    st.lee = st.lee * Math.exp(-cellKm / 120) + Math.max(0, -d);
    // (the sinking air of the highs flows out toward the equator, taking its water with it; where the trades meet at
    // the equator, and along the storm tracks, the air draws water in from both sides, so their rain does not fade
    // inland; elsewhere the air slowly loses what it carries over a long road)
    st.q *= Math.exp(-cellKm * (1 / 3000 + sub(a) * (summer ? .3 : 1) / 700));
    // (inland, the rain falls mostly in the warm months, so the air's capacity there is the summer's: the year's mean
    // warmth and some of the seasons' swing, more toward the poles)
    const tL = temp[n] + 12 * smooth(20, 60, a), conv = .6 * itcz(a) + .9 * storm(a) + (summer ? .25 * mon(a) : 0); if (conv > .01) st.q += (cap(tL) * conv - st.q) * Math.min(1, conv * cellKm / 150) * (st.q < cap(tL) * conv ? 1 : 0);
    let eff = eff0 * Math.max(.08, 1 + 1.6 * itcz(a) + 3 * storm(a) - (summer ? .2 : .85) * sub(a));
    eff *= (1 - .9 * st.stab) / (1 + 3 * st.lee);
    let r = Math.min(st.q * .5, st.q * (eff + Math.max(0, d) * .55 * (1 - .6 * sub(a) * (1 - st.lee * 0))));
    // (cold air holds little: what it cannot hold falls as it cools inland and uphill)
    const c = cap(tL + 5); if (st.q - r > c) r += (st.q - r - c) * .15;
    rain[n] += r * w; fog[n] += st.stab * w; st.q -= r * .55; st.stab *= Math.exp(-cellKm / 200); st.prev = E[n];
  };
  const start = n => ({ q: E[n] > 0 ? cap(temp[n]) * .4 : cap(sst[n]), prev: 0, stab: E[n] > 0 ? 0 : cold[n], lee: 0 });
  // the belt winds: from the east in the trades and the polar easterlies, from the west in the westerlies
  const sweep = (dirx, tilt, w) => {
    for (let j0 = 0; j0 < rows; j0++) {
      // (the westerlies' share of the row, the rest the easterlies': they meet over several degrees, not on a line)
      const a0 = Math.abs(lat(j0)), ws = o.lat ? smooth(26, 34, a0) * (1 - smooth(58, 66, a0)) : (a0 < 30 || a0 > 62 ? 0 : 1);  // (a whole planet's belts blended; a region's as they always were)
      for (const [dir, share] of [[1, ws], [-1, 1 - ws]]) {
        if (share < .02) continue; const dx = dir * dirx; let jj = j0, st = null;
        for (let s = 0; s < cols; s++) { const i = dx > 0 ? s : cols - 1 - s, j = Math.max(0, Math.min(rows - 1, Math.round(jj))); jj += tilt; const n = j * cols + i; if (!st) st = start(n); cross(n, st, w * share, false); }
      }
    }
  };
  sweep(1, 0, .25); sweep(1, .12, .15); sweep(1, -.12, .15); sweep(1, .05, .1); sweep(1, -.05, .1); sweep(-1, .07, .08); sweep(-1, -.07, .08);
  // the summer monsoon: up each column from the equator's side, poleward (both ways where the map crosses the equator)
  for (let i = 0; i < cols; i++) for (const up of [true, false]) {
    let st = null;
    for (let s = 0; s < rows; s++) {
      const j = up ? rows - 1 - s : s, L = lat(j); if (up ? L < 0 : L > 0) { st = null; continue; }
      const n = j * cols + i; if (!st) st = start(n); cross(n, st, .5 * mon(Math.abs(L)) + .02, true);
    }
  }
  boxBlur(rain, cols, rows, 4, 2); boxBlur(fog, cols, rows, 3, 1);
  for (let n = 0; n < N; n++) { rain[n] = rain[n] * (.88 + nz((n % cols) / 18, ((n / cols) | 0) / 18) * .24) * EARTH_MM / cellKm; fog[n] = Math.min(1, fog[n]); }
  return { temp, rain, fog, sst, mm: true };
}
// (the scale to mm a year, set once so that the rainy tropics come to about 1500 mm and the subtropical deserts under
// about 150, as on the Earth; per km of the air's road, so a world drawn finer or coarser rains the same)
const EARTH_MM = 1600000;

module.exports = { geology, landT };
