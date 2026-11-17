/* Campaign Atlas: the coasts, shaped by sediment, waves and longshore drift (the user, 27 Oct 2026: "beaches should
   appear because the geographical conditions support their formation ... as if coastlines had been shaped by waves,
   erosion and sediment movement over thousands of years"; docs/requests/2026-10-27-beaches.md). Scientifically
   grounded approximations, worked on the generated world:
     - sediment is made on the land and brought to the sea: each cell's erosion grows with its rain and its slope (the
       stream power law, as the land itself was cut); it is carried down the rivers to their mouths. Steep, short
       and cold rivers carry gravel; gravel wears to sand the farther it travels (so long rivers bring sand, the
       torrents of a mountain coast shingle: Norway, New Zealand, against the Gulf of Mexico); cliffs worn by the waves
       give their rock, mostly coarse; warm, clear seas grow reefs that break into white carbonate sand (the Caribbean,
       the Maldives); near volcanoes the sand is black (Hawaii, Iceland);
     - waves come with the winds of each belt (westerly storms between 35° and 60°, the trade winds' swell in the
       tropics) and grow with the open water they cross (fetch); a coast facing them is exposed, a bay's shore
       sheltered (its openness to the sea); sea ice keeps them off;
     - waves striking a coast at an angle carry sand along it (longshore drift), as much as their energy and the
       angle allow (capacity ~ E^1.5 · sin 2θ, after the CERC formula); where the drift slows or meets drift from the
       other way (a bay, a bend, a convergence) the sand is laid down, and where it speeds up (headlands) taken away;
       sheltered bays keep what reaches them (pocket beaches);
     - so the coasts: wide beaches where sand is plentiful and the shore gentle, narrow ones on steep shores, gravel
       beaches where the sediment is coarse, rocky cliffs where waves meet high land with little sand; dunes behind wide
       beaches where the wind blows onshore (grassed where it rains); barrier islands with lagoons behind them where
       a gentle coastal plain meets a shallow shelf with plenty of sand and moderate waves (the Outer Banks, the
       Frisian Islands), cut by inlets at the rivers' mouths; spits where drift carries sand past the end of a coast
       (Spurn Head, Cape Cod); salt marsh on sheltered, muddy, low shores, mangroves where the sea is warm.
   Tides are not modelled; the ocean's currents (world-ocean.js) bear on the coasts through the sea's warmth (reefs,
   mangroves) and its ice, while the sand itself is moved by the waves, as on the Earth. */
"use strict";
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }, gauss = v => Math.exp(-v * v);
// the height grid's steps back to metres (world-geology.js landT, inverted)
const LT = [[0, 0], [200, .06], [500, .15], [1000, .28], [1500, .37], [2000, .45], [3000, .6], [4500, .78], [6000, .9], [8500, 1]];
const metres = b => { if (b <= 128) return 0; const t = (b - 129) / 126; for (let k = 1; k < LT.length; k++) if (t <= LT[k][1]) return LT[k - 1][0] + (t - LT[k - 1][1]) / (LT[k][1] - LT[k - 1][1]) * (LT[k][0] - LT[k - 1][0]); return 8500; };
// the classes of shore (T.shore), and the sand's makeup (T.sand)
const SHORE = { beach: 1, gravel: 2, cliff: 3, dune: 4, marsh: 5, mangrove: 6, barrier: 7, spit: 8, lagoon: 9 };
const SAND = { quartz: 0, carbonate: 1, volcanic: 2, gravel: 3 };

// o: { cols, rows, cell, km, lat: [top, bottom], whole, rotation }; L: { H (bytes, sea <= 128; changed: barrier
// islands and spits become low land), eco: { T, P, AI }, ocean (world-ocean.js) }; R: { rivers, mask }; vols: volcano cells
function coasts(o, L, R, vols, log) {
  const { cols, rows } = o, N = cols * rows, H = L.H, cellKm = (o.km || 3200) / cols, [la, lb] = o.lat, wrap = !!o.whole;
  const I = n => n % cols, J = n => (n / cols) | 0, lat = j => la + (lb - la) * (j + .5) / rows, rot = o.rotation == null ? 1 : Math.sign(o.rotation) || 1;
  const nb4 = n => { const i = I(n), j = J(n), out = []; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let a = i + di; const b = j + dj; if (wrap) a = (a + cols) % cols; if (a >= 0 && b >= 0 && a < cols && b < rows) out.push(b * cols + a); } return out; };
  const nb8 = n => { const i = I(n), j = J(n), out = []; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; let a = i + di; const b = j + dj; if (wrap) a = (a + cols) % cols; if (a >= 0 && b >= 0 && a < cols && b < rows) out.push(b * cols + a); } return out; };
  // the open sea, and its distance from the land
  const oc = new Uint8Array(N), st = [];
  for (let n = 0; n < N; n++) { const i = I(n), j = J(n); if (H[n] <= 128 && (!j || j === rows - 1 || (!wrap && (!i || i === cols - 1)))) { oc[n] = 1; st.push(n); } }
  while (st.length) { const n = st.pop(); for (const m of nb4(n)) if (!oc[m] && H[m] <= 128) { oc[m] = 1; st.push(m); } }
  const land = n => H[n] > 128, coast = [], isC = new Int32Array(N).fill(-1);
  for (let n = 0; n < N; n++) if (land(n) && nb4(n).some(m => oc[m])) { isC[n] = coast.length; coast.push(n); }
  const K = coast.length; if (!K) return null;
  const Em = new Float32Array(N); for (let n = 0; n < N; n++) Em[n] = metres(H[n]);
  // the coast's facing (toward the sea), from the land eased over a few cells
  const LB = new Float32Array(N); for (let n = 0; n < N; n++) LB[n] = land(n) ? 1 : 0; box(LB, cols, rows, 2, 2, wrap);
  const nx = new Float32Array(K), ny = new Float32Array(K);   // ny: down the sheet
  coast.forEach((n, k) => { const i = I(n), j = J(n), g = (a, b) => { if (wrap) a = (a + cols) % cols; return a < 0 || b < 0 || a >= cols || b >= rows ? 0 : LB[b * cols + a]; }; let x = -(g(i + 1, j) - g(i - 1, j)), y = -(g(i, j + 1) - g(i, j - 1)); const l = Math.hypot(x, y) || 1; nx[k] = x / l; ny[k] = y / l; });
  // openness: how much of the sea round it is open sea, within a few hundred km
  const RL = Math.max(4, Math.min(40, Math.round(300 / cellKm))), open = new Float32Array(K);
  coast.forEach((n, k) => { let o2 = 0, t = 0; for (let a = 0; a < 16; a++) { const dx = Math.cos(a / 16 * 6.283), dy = Math.sin(a / 16 * 6.283); if (dx * nx[k] + dy * ny[k] < -.2) continue; t++; let ok = true; for (let s = 1; s <= RL; s++) { let x = Math.round(I(n) + dx * s); const y = Math.round(J(n) + dy * s); if (wrap) x = (x + cols) % cols; if (x < 0 || y < 0 || x >= cols || y >= rows) break; if (!oc[y * cols + x]) { ok = false; break; } } if (ok) o2++; } open[k] = t ? o2 / t : 0; });
  // the waves: their way (down the sheet: y), their energy at each coast
  const OC = L.ocean, ice = n => OC && OC.ICE ? nb8(n).some(m => OC.ICE[m]) : false;
  const waveDir = j => { const a = Math.abs(lat(j)), zon = rot * (a < 60 ? .9 * Math.sin(Math.PI * (a - 30) / 30) : -.35 * Math.sin(Math.PI * (a - 60) / 30)), eq = lat(j) > 0 ? 1 : -1; let x = Math.sign(zon) || 1, y = eq * .35; const l = Math.hypot(x, y); return [x / l, y / l]; };
  const storm = j => { const a = Math.abs(lat(j)); return .45 + 1.0 * gauss((a - 50) / 13) + .35 * gauss((a - 15) / 8); };
  const Ewave = new Float32Array(K), inc = new Float32Array(K), cap = new Float32Array(K), drift = new Int8Array(K), maxF = Math.round(2500 / cellKm);
  coast.forEach((n, k) => {
    const [dx, dy] = waveDir(J(n)), on = -(dx * nx[k] + dy * ny[k]);   // > 0: the waves come onshore
    let fetch = 0; for (let s = 1; s <= maxF; s += 2) { let x = Math.round(I(n) - dx * s); const y = Math.round(J(n) - dy * s); if (wrap) x = (x + cols) % cols; if (x < 0 || y < 0 || x >= cols || y >= rows) { fetch = maxF; break; } if (!oc[y * cols + x]) break; fetch = s; }
    const fF = 1 - Math.exp(-fetch * cellKm / 700);
    let e = storm(J(n)) * (.22 * open[k] + .78 * Math.max(0, on) * fF * (.4 + .6 * open[k]));
    if (ice(n)) e *= .1;
    Ewave[k] = e; inc[k] = on;
    // along the coast: the waves' share along it, which way, and how much they can carry
    const tx = -ny[k], ty = nx[k], al = dx * tx + dy * ty, th = Math.acos(Math.max(-1, Math.min(1, Math.max(0, on))));
    drift[k] = al > .05 ? 1 : al < -.05 ? -1 : 0;
    cap[k] = Math.pow(e, 1.5) * Math.abs(Math.sin(2 * th)) * (on > 0 ? 1 : .3) + .02;
  });
  // (the waves measured against this world's own: the stormiest coasts about 1, the calmest near 0)
  { const es = Array.from(Ewave).sort((a, b) => a - b), ep = es[Math.floor(K * .9)] || 1; for (let k = 0; k < K; k++) { Ewave[k] = Math.min(1.5, Ewave[k] / ep); } coast.forEach((n, k) => { const [dx, dy] = waveDir(J(n)), on = inc[k], th = Math.acos(Math.max(-1, Math.min(1, Math.max(0, on)))); cap[k] = Math.pow(Ewave[k], 1.5) * Math.abs(Math.sin(2 * th)) * (on > 0 ? 1 : .3) + .02; }); }
  // the sediment from the land: each cell's erosion (rain by slope), down the rivers to the sea; gravel from steep
  // and cold ground, worn to sand along the way
  const order = Array.from({ length: N }, (_, n) => n).filter(land).sort((a, b) => Em[b] - Em[a]), rec = new Int32Array(N).fill(-1), slope = new Float32Array(N);
  for (const n of order) { let best = -1, bd = 0; for (const m of nb8(n)) { const d = (Em[n] - (land(m) ? Em[m] : -1)) / (I(m) !== I(n) && J(m) !== J(n) ? 1.414 : 1); if (d > bd) { bd = d; best = m; } } rec[n] = best; slope[n] = bd / (cellKm * 1000); }
  const P = L.eco && L.eco.P, Tc = L.eco && L.eco.T, sand = new Float32Array(N), grav = new Float32Array(N), mouthS = new Float32Array(K), mouthG = new Float32Array(K), river = new Float32Array(K);
  const wear = Math.exp(-cellKm / 150);
  for (const n of order) {
    const rain = P ? P[n] / 1000 : .6, y = rain * Math.min(.08, slope[n]) * 40, gf = smooth(.012, .06, slope[n]) * (Tc && Tc[n] < 2 ? 1.3 : 1);
    sand[n] += y * (1 - Math.min(.9, gf)); grav[n] += y * Math.min(.9, gf);
    const r = rec[n]; if (r < 0) continue;
    const g2 = grav[n] * wear; sand[n] += grav[n] - g2; grav[n] = g2;
    if (land(r)) { sand[r] += sand[n]; grav[r] += grav[n]; }
    else { const k = isC[n] >= 0 ? isC[n] : -1; if (k >= 0) { mouthS[k] += sand[n]; mouthG[k] += grav[n]; river[k] += sand[n] + grav[n]; } }
  }
  // cliffs worn by the waves; reefs in warm, clear seas; the sand's makeup
  const relief = new Float32Array(K), comp = new Uint8Array(K), reef = new Float32Array(K), cliffS = new Float32Array(K), shelfS = new Float32Array(K);
  // (every source on one scale: a typical river mouth's yearly sand. Before, the rivers' sum over whole basins dwarfed
  // the rest, and every beach was the rivers'; the user then: "i told you to make the decisions", 17 Nov 2026)
  const U = Math.max(1e-6, mouthS.reduce((a, v) => a + v, 0) / Math.max(1, K));   // (the rivers' sand per km of coast, on average)
  const sst = n => OC && OC.SST ? Math.max(...nb8(n).filter(m => oc[m]).map(m => OC.SST[m]).concat([-9])) : (Tc ? Tc[n] + 2 : 15);
  const volc = (vols || []).map(v => [I(v), J(v)]), vr = Math.max(3, 60 / cellKm);
  coast.forEach((n, k) => {
    let r = 0; const i0 = I(n), j0 = J(n); for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { let a = i0 + di; const b = j0 + dj; if (wrap) a = (a + cols) % cols; if (a >= 0 && b >= 0 && a < cols && b < rows) r = Math.max(r, Em[b * cols + a]); }
    relief[k] = r; cliffS[k] = U * 1.6 * Ewave[k] * smooth(40, 400, r);
    // (the shelf: on low, open coasts the swell sweeps the old sand of the shallow sea floor ashore; much of the
    // Earth's great beaches are this, not the rivers')
    shelfS[k] = U * 7 * Math.min(1, Ewave[k]) * (1 - smooth(30, 250, r)) * (open ? open[k] : 1);
    // (reefs: warm, clear water, away from the mud of the rivers)
    const warm = sst(n); reef[k] = U * .5 * smooth(23, 27, warm) * (1 - smooth(.2, 1.5, river[k] / U));
    comp[k] = volc.some(([x, y]) => Math.hypot(x - i0, y - j0) < vr) ? SAND.volcanic : SAND.quartz;
  });
  // longshore drift: each coast cell hands its sand on to the next along the drift; laid down where it slows
  const down = new Int32Array(K).fill(-1);
  coast.forEach((n, k) => { if (!drift[k]) return; const tx = -ny[k] * drift[k], ty = nx[k] * drift[k]; let best = -1, bd = .3; for (const m of nb8(n)) { const q = isC[m]; if (q < 0) continue; let dx = I(m) - I(n); if (wrap && Math.abs(dx) > 1) dx = -Math.sign(dx); const dy = J(m) - J(n), d = (dx * tx + dy * ty) / Math.hypot(dx, dy); if (d > bd) { bd = d; best = q; } } down[k] = best; });
  const indeg = new Int32Array(K); for (let k = 0; k < K; k++) if (down[k] >= 0) indeg[down[k]]++;
  const conv = new Int32Array(K); for (let k = 0; k < K; k++) if (down[k] >= 0 && drift[down[k]] && drift[k] !== drift[down[k]]) conv[down[k]]++;
  const qs = new Float32Array(K), qg = new Float32Array(K), V = new Float32Array(K), G = new Float32Array(K), prov = new Float32Array(K * 4), qp = new Float32Array(K * 4);
  const q = []; for (let k = 0; k < K; k++) if (!indeg[k]) q.push(k);
  const done = new Uint8Array(K);
  const step = k => {
    done[k] = 1;
    const sIn = qs[k] + mouthS[k] + cliffS[k] * .4 + reef[k] + shelfS[k], gIn = qg[k] + mouthG[k] + cliffS[k] * .6;
    const pIn = [qp[k * 4] + mouthS[k], qp[k * 4 + 1] + cliffS[k] * .4, qp[k * 4 + 2] + reef[k], qp[k * 4 + 3] + shelfS[k]], pT = pIn[0] + pIn[1] + pIn[2] + pIn[3] || 1;
    // (what the waves can carry on goes on; a sheltered shore keeps a share of all that passes; where drift meets
    // drift from the other way, or the coast ends, all of it stays)
    const keep = .05 + .5 * (1 - open[k]) + (conv[k] ? .6 : 0), sOut = down[k] < 0 ? 0 : Math.min(sIn * (1 - Math.min(.95, keep)), cap[k]), gOut = down[k] < 0 ? 0 : Math.min(gIn * (1 - Math.min(.95, keep)), cap[k] * .25);
    V[k] += sIn - sOut; G[k] += gIn - gOut; for (let p = 0; p < 4; p++) prov[k * 4 + p] += (sIn - sOut) * pIn[p] / pT;
    const d = down[k]; if (d >= 0) { qs[d] += sOut + gOut * .03; qg[d] += gOut * .97; for (let p = 0; p < 4; p++) qp[d * 4 + p] += sOut * pIn[p] / pT; if (--indeg[d] === 0) q.push(d); }
  };
  for (let h = 0; h < q.length; h++) step(q[h]);
  for (let k = 0; k < K; k++) if (!done[k]) { let c = k; for (let g = 0; g < K && c >= 0 && !done[c]; g++) { step(c); c = down[c]; } }
  // (laid sand spreads a little along the shore)
  for (let p = 0; p < 2; p++) { const v2 = Float32Array.from(V); coast.forEach((n, k) => { let s = V[k] * 2, c = 2; for (const m of nb8(n)) { const j = isC[m]; if (j >= 0) { s += V[j]; c++; } } v2[k] = s / c; }); V.set(v2); }
  // the coasts: what each becomes
  const sorted = Array.from(V).sort((a, b) => a - b), vT = Math.max(.02, sorted[Math.floor(K * .66)] || .02), gT = vT * .7;   // (about a third of the Earth's ice-free coasts are sandy: Luijendijk et al. 2018)
  const shore = new Uint8Array(N), width = new Uint8Array(N), sandC = new Uint8Array(N), why = new Array(K);
  const AI = L.eco && L.eco.AI;
  coast.forEach((n, k) => {
    const steep = smooth(60, 350, relief[k]), warmAir = Tc ? Tc[n] : 15, lowE = Ewave[k] < .2, mouth = river[k] > vT * 2;
    // (white coral sand only where most of the sand laid here came from reefs)
    const pv = prov[k * 4] + prov[k * 4 + 1] + prov[k * 4 + 2] + prov[k * 4 + 3];
    let cls = 0, w = 0, c = comp[k] === SAND.quartz && pv > 0 && prov[k * 4 + 2] / pv > .5 ? SAND.carbonate : comp[k];
    if (lowE && relief[k] < 25 && (open[k] < .5 || mouth) && !ice(n)) cls = warmAir > 21 ? SHORE.mangrove : warmAir > -2 ? SHORE.marsh : 0;
    else if (G[k] > V[k] * 1.1 && G[k] > gT) { cls = SHORE.gravel; w = .35 + .4 * Math.min(1, G[k] / (gT * 4)); c = SAND.gravel; }
    else if (V[k] > vT) { cls = SHORE.beach; w = Math.min(2.4, (.35 + .7 * Math.sqrt(V[k] / vT - 1)) / (1 + 2.2 * steep)); }
    else if (steep > .45 && Ewave[k] > .3) cls = SHORE.cliff;
    shore[n] = cls; width[n] = Math.round(Math.min(255, w * 64)); sandC[n] = c;
    why[k] = { V: V[k], E: Ewave[k], open: open[k], conv: conv[k], river: prov[k * 4], cliff: prov[k * 4 + 1], reef: prov[k * 4 + 2], shelf: prov[k * 4 + 3], comp: c };
  });
  // dunes behind wide beaches, where the wind blows onshore
  const dist = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), dq = [];
  coast.forEach((n, k) => { if (shore[n] === SHORE.beach && width[n] > 70 && inc[k] > .25) { dist[n] = 0; from[n] = k; dq.push(n); } });
  for (let h = 0; h < dq.length; h++) { const n = dq[h], k = from[n], dw = 1 + 3 * Math.min(1, (width[coast[k]] / 64 - 1) * inc[k] * 1.4); for (const m of nb4(n)) if (land(m) && isC[m] < 0 && dist[m] > dist[n] + 1 && dist[n] + 1 <= dw && Em[m] < 120) { dist[m] = dist[n] + 1; from[m] = k; shore[m] = SHORE.dune; width[m] = Math.round(Math.min(255, (AI ? AI[m] : .8) * 100)); sandC[m] = sandC[coast[k]]; dq.push(m); } }
  // barrier islands, with lagoons behind them and inlets at the rivers' mouths
  const dLand = new Float32Array(N).fill(1e9), lq = [];
  for (let n = 0; n < N; n++) if (land(n)) { dLand[n] = 0; lq.push(n); }
  for (let h = 0; h < lq.length; h++) { const n = lq[h]; for (const m of nb4(n)) if (oc[m] && dLand[m] > dLand[n] + 1) { dLand[m] = dLand[n] + 1; lq.push(m); } }
  // (the sand to be had along a stretch of coast some hundred km either way: a barrier needs the shore's whole
  // supply, not only what one stretch keeps)
  const reg = Float32Array.from(V, (v, k) => Math.log1p(v + qs[k] + mouthS[k]));
  for (let p = 0; p < Math.round(60 / cellKm) + 4; p++) { const r2 = Float32Array.from(reg); coast.forEach((n, k) => { let s2 = reg[k], c2 = 1; for (const m of nb8(n)) { const j = isC[m]; if (j >= 0) { s2 += reg[j]; c2++; } } r2[k] = s2 / c2; }); reg.set(r2); }
  const regT = Array.from(reg).sort((a, b) => a - b)[Math.floor(K * .72)];   // (barrier islands line some 10 to 15% of the Earth's coasts: Stutz & Pilkey 2011)
  const bw = Math.max(3, Math.round(10 / cellKm + 2.5)), zone = new Uint8Array(N), bq = [];
  coast.forEach((n, k) => {
    // (a gentle coastal plain, a shallow shelf, sand to spare, waves neither too weak nor too fierce)
    let shelf = true; for (let s = 1; s <= bw + 1; s++) { let x = Math.round(I(n) + nx[k] * s); const y = Math.round(J(n) + ny[k] * s); if (wrap) x = (x + cols) % cols; if (x < 0 || y < 0 || x >= cols || y >= rows) { shelf = false; break; } const m = y * cols + x; if (!oc[m] || H[m] < 120) { shelf = false; break; } }
    if (shelf && relief[k] < 220 && reg[k] > regT && Ewave[k] > .2 && Ewave[k] < 1.3 && open[k] > .3) bq.push(n);
  });
  // (no more than about an eighth of the coast: the sandiest stretches first; Stutz & Pilkey 2011: 10 to 15% of the
  // Earth's coasts. Needed once the shelf's sand made the low open coasts the sandiest, 17 Nov 2026)
  bq.sort((a, b) => reg[isC[b]] - reg[isC[a]]); bq.length = Math.min(bq.length, Math.round(K * .13)); for (const n of bq) zone[n] = 1;
  const mouths = coast.filter((n, k) => river[k] > vT * 3);
  for (const n of bq) for (let dj = -bw - 1; dj <= bw + 1; dj++) for (let di = -bw - 1; di <= bw + 1; di++) {
    let a = I(n) + di; const b = J(n) + dj; if (wrap) a = (a + cols) % cols; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (!oc[m]) continue;
    const inlet = mouths.some(c => Math.hypot(I(c) - a, J(c) - b) < 2.5) || noiseAt(a * .35, b * .35, o.seed || 1) < .07;
    if (dLand[m] >= bw - 1 && dLand[m] < bw + 1 && !inlet) { shore[m] = SHORE.barrier; H[m] = 129; width[m] = 64; sandC[m] = SAND.quartz; }
    else if (dLand[m] < bw - 1 && shore[m] !== SHORE.barrier) shore[m] = SHORE.lagoon;
  }
  // spits: where the drift runs off the end of a coast with sand still moving, a tongue of sand carries on across the
  // water, its tip curving in (recurved) as the waves wrap round it
  let spits = 0;
  coast.forEach((n, k) => {
    if (down[k] >= 0 || !drift[k] || V[k] < vT * 1.6 || open[k] < .3 || Ewave[k] < .2) return;
    const tx = -ny[k] * drift[k], ty = nx[k] * drift[k]; let x = I(n) + .5, y = J(n) + .5, ang = Math.atan2(ty, tx); const len = Math.round(Math.min(18, 2 + (V[k] / vT - 1) * 2.5)), turn = Math.atan2(-ny[k], -nx[k]);
    let made = 0;
    for (let s = 0; s < len; s++) {
      if (s > len * .6) { let d = turn - ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; ang += d * .12; }
      x += Math.cos(ang); y += Math.sin(ang); let a = Math.floor(x); const b = Math.floor(y); if (wrap) a = (a + cols) % cols; if (a < 0 || b < 0 || a >= cols || b >= rows) break; const m = b * cols + a; if (!oc[m]) break;
      shore[m] = SHORE.spit; H[m] = 129; width[m] = 64; sandC[m] = comp[k]; made++;
    }
    if (made) spits++;
  });
  // the story of the coasts, for the command's report: the greatest beaches and why they are there
  const seen = new Uint8Array(K), groups = [];
  coast.forEach((n, k) => {
    if (seen[k] || shore[n] !== SHORE.beach) return; const g = [k]; seen[k] = 1;
    for (let h = 0; h < g.length; h++) for (const m of nb8(coast[g[h]])) { const j = isC[m]; if (j >= 0 && !seen[j] && shore[m] === SHORE.beach) { seen[j] = 1; g.push(j); } }
    let s = { n: g.length, V: 0, river: 0, cliff: 0, reef: 0, shelf: 0, conv: 0, open: 0, E: 0, comp: [0, 0, 0, 0], x: 0, y: 0 };
    for (const j of g) { const w = why[j]; s.V += w.V; s.river += w.river; s.cliff += w.cliff; s.reef += w.reef; s.shelf += w.shelf; s.conv += w.conv ? 1 : 0; s.open += w.open; s.E += w.E; s.comp[w.comp]++; s.x += I(coast[j]); s.y += J(coast[j]); }
    s.open /= g.length; s.E /= g.length; s.at = [Math.round(s.x / g.length * o.cell), Math.round(s.y / g.length * o.cell)]; groups.push(s);
  });
  groups.sort((a, b) => b.V - a.V);
  const said = groups.slice(0, 8).map(s => {
    const top = Math.max(s.river, s.cliff, s.reef, s.shelf), src = top === s.river ? "sand brought down by rivers" : top === s.shelf ? "sand swept ashore from the shallow sea floor" : top === s.reef ? "white sand from reefs in the warm sea" : "sand worn from the cliffs";
    const where = s.conv ? "where drift from both ways meets and drops its load" : s.open < .5 ? "in a sheltered bay that keeps what the drift brings" : s.E > .6 ? "on an open coast where strong waves pile it up" : "where the longshore drift slows along the coast";
    const kind = ["", " (white coral sand from reefs)", " (black volcanic sand)", " (shingle)"][s.comp.indexOf(Math.max(...s.comp))];
    return `Beach of ${Math.round(s.n * cellKm)} km at [${s.at}]: ${src}, ${where}${kind}`;
  });
  let cnt = {}; for (let n = 0; n < N; n++) if (shore[n]) cnt[shore[n]] = (cnt[shore[n]] || 0) + 1;
  const name = Object.fromEntries(Object.entries(SHORE).map(([k, v]) => [v, k]));
  if (log) log("  the coasts, as waves and sediment made them: " + Object.entries(cnt).map(([k, v]) => `${name[k]} ${Math.round(v * cellKm)} km`).join(", ") + (spits ? `; ${spits} spits` : "") + (() => { let t = [0, 0, 0, 0]; coast.forEach((n, k) => { if (shore[n] === SHORE.beach) for (let p = 0; p < 4; p++) t[p] += prov[k * 4 + p]; }); const T = t[0] + t[1] + t[2] + t[3] || 1; return `\n     barrier islands front ${Math.round(bq.length / Math.max(1, K) * 100)}% of the coast (Earth: 10 to 15%); the beaches' sand came from: rivers ${Math.round(t[0] / T * 100)}%, the shelf ${Math.round(t[3] / T * 100)}%, cliffs ${Math.round(t[1] / T * 100)}%, reefs ${Math.round(t[2] / T * 100)}%`; })() + "\n" + said.map(s => "     " + s).join("\n"));
  return { shore, width, sand: sandC, groups: groups.slice(0, 8), said, SHORE, SAND };
}
function noiseAt(x, y, seed) { let h = (Math.imul(Math.floor(x / 3), 73856093) ^ Math.imul(Math.floor(y / 3), 19349663) ^ seed) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h % 10000) / 10000; }
function box(F, cols, rows, r, passes, wrap) {
  const t = new Float32Array(F.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { let a = i + k; if (wrap) a = (a + cols) % cols; if (a >= 0 && a < cols) { s += F[j * cols + a]; c++; } } t[j * cols + i] = s / c; }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const b = j + k; if (b >= 0 && b < rows) { s += t[b * cols + i]; c++; } } F[j * cols + i] = s / c; }
  }
}
module.exports = { coasts, SHORE, SAND };
