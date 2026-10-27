/* Campaign Atlas: a world drawn by hand, read as the generator's guide (the user, 27 Oct 2026: "a good feature would be
   if they could upload a picture of how the map should look, like hand drawn, and it generates the map").
   The picture says where the land is and where the mountains are; plate tectonics, erosion, rivers and climate
   (world-geology.js, world-ecology.js) make the rest, so a sketch becomes a real-looking world of the same kind.
   - The sea: a coloured map's blue; on an ink drawing, the paper the sheet's edge reaches without crossing a line.
   - The mountains: on an ink drawing, the marks drawn inside the land away from its coast (peaks, hatching, ^^^);
     on a coloured one, the land painted brown, grey or dark.
   It works on plain pixels (RGBA), so the page (a canvas), the page's generator (a worker) and atlas.js world --sketch
   (a PNG read in Node) all read a sketch the same way. A sketch is kept small (at most 400 cells across) and as text, so
   the page can keep it among the referee's changes and make the same world again from it. Shared by the page and Node. */
(function (root, make) {
  if (typeof module === "object" && module.exports) module.exports = make();
  else root.ATLAS.worldSketch = make();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // the colour key of a painted map (the user, 27 Oct 2026: "I like the coloured map one better ... more consistent,
  // make it more fleshed out"): each kind of land, its colour in the page's painter, and how a colour on an uploaded
  // map is told to be it (by hue, strength and lightness). Blue is water: the sea where it reaches the open sea, a lake
  // or a river where it does not. 0 is plain land.
  const KINDS = [
    ["plains", "Plains and grassland", "#a6d27c"], ["forest", "Forest", "#2f6b35"], ["desert", "Desert", "#ecd88c"], ["swamp", "Swamp", "#6f8a5c"],
    ["snow", "Snow and ice", "#f4f6f8"], ["hills", "Hills", "#b08a5a"], ["mountains", "Mountains", "#7a5236"], ["volcano", "Volcano", "#d2402a"]
  ];
  const K = Object.fromEntries(KINDS.map((k, i) => [k[0], i])), KIND_MTN = [0, 0, 0, 0, .55, .26, 1, .95], WATER = "#4f8fcf";
  function kindOf(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0;
    let h = 0; if (mx > mn) { h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360; }
    if (s > .45 && v > .35 && (h < 18 || h > 340)) return K.volcano;
    if (s < .1 && v > .9) return K.snow;
    if (s < .14 && v < .78) return K.mountains;                       // grey rock
    if (h >= 8 && h < 50 && s > .25 && v < .6) return K.mountains;    // brown
    if (h >= 18 && h < 52 && s > .2 && v < .8) return K.hills;        // light brown, ochre
    if (h >= 36 && h < 66 && s > .2 && v >= .78) return K.desert;     // sand
    if (h >= 60 && h < 115 && s < .4 && v >= .38 && v < .66) return K.swamp;   // olive, grey-green
    if (h >= 70 && h < 175 && v < .55) return K.forest;               // dark green
    return K.plains;
  }

  // px: RGBA bytes, iw by ih; cols by rows: the grid it is read onto
  // (opts.colour: read as a painted map whatever its share of blue, as the page's painter makes)
  function read(px, iw, ih, cols, rows, opts) {
    const N = cols * rows, minL = new Float32Array(N).fill(255), sum = new Float32Array(N * 4), cnt = new Float32Array(N);
    for (let y = 0; y < ih; y++) {
      const j = Math.min(rows - 1, Math.floor(y * rows / ih));
      for (let x = 0; x < iw; x++) {
        const n = j * cols + Math.min(cols - 1, Math.floor(x * cols / iw)), o = (y * iw + x) * 4, a = px[o + 3] / 255;
        // (a transparent pixel is paper)
        const r = px[o] * a + 255 * (1 - a), g = px[o + 1] * a + 255 * (1 - a), b = px[o + 2] * a + 255 * (1 - a), l = .3 * r + .59 * g + .11 * b;
        sum[n * 4] += r; sum[n * 4 + 1] += g; sum[n * 4 + 2] += b; sum[n * 4 + 3] += l; cnt[n]++; if (l < minL[n]) minL[n] = l;
      }
    }
    const R = new Float32Array(N), Gc = new Float32Array(N), B = new Float32Array(N), L = new Float32Array(N), blue = new Uint8Array(N); let nb = 0;
    for (let n = 0; n < N; n++) { const c = cnt[n] || 1; R[n] = sum[n * 4] / c; Gc[n] = sum[n * 4 + 1] / c; B[n] = sum[n * 4 + 2] / c; L[n] = sum[n * 4 + 3] / c; if (B[n] - (R[n] + Gc[n]) / 2 > 14 && B[n] > 80) { blue[n] = 1; nb++; } }
    const paper = Float32Array.from(L).sort()[Math.floor(N * .75)] || 255;
    let sea = new Uint8Array(N), wall = null; const colour = opts && opts.colour || nb > N * .08 && nb < N * .94;
    const lake = new Uint8Array(N), river = new Uint8Array(N), kind = new Uint8Array(N);
    if (colour) {
      // the open sea is the blue with a body that reaches the sheet's edge; blue the sea does not reach is a lake, or a
      // river where it is only a line
      const body = new Uint8Array(N), nb = dilate(Uint8Array.from(blue, v => 1 - v), cols, rows, 2); for (let n = 0; n < N; n++) body[n] = blue[n] && !nb[n] ? 1 : 0;
      const open = new Uint8Array(N), q = []; const seed = n => { if (body[n] && !open[n]) { open[n] = 1; q.push(n); } };
      for (let i = 0; i < cols; i++) { seed(i); seed((rows - 1) * cols + i); } for (let j = 0; j < rows; j++) { seed(j * cols); seed(j * cols + cols - 1); }
      for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; if (i > 0) seed(n - 1); if (i < cols - 1) seed(n + 1); if (j > 0) seed(n - cols); if (j < rows - 1) seed(n + cols); }
      let on = 0; for (let n = 0; n < N; n++) on += open[n];
      if (on < N * .03) sea = blue;   // no open sea drawn: every blue is sea, as before
      else {
        const back = dilate(open, cols, rows, 3); for (let n = 0; n < N; n++) sea[n] = blue[n] && back[n] ? 1 : 0;
        const bodyL = dilate(body, cols, rows, 2);
        for (let n = 0; n < N; n++) if (blue[n] && !sea[n]) { if (body[n] || bodyL[n] && blue[n]) lake[n] = 1; else river[n] = 1; }
        // (a river's line runs on to the coast it meets)
      }
    }
    else {
      // ink: the lines are walls; the sea is the paper reached from the sheet's edge. A photo of a sketch is lit
      // unevenly, so ink is what is darker than the paper about it (the paper's brightness found nearby), not than one
      // level for the whole sheet; and a coast drawn by hand has gaps, so the walls are thickened while the sea is
      // found (a gap up to about 3% of the sheet is closed) and the sea then given back what the thickening took
      // (thin writing and a compass rose out at sea go with it)
      const bg = Float32Array.from(L); maxf(bg, cols, rows, Math.max(2, Math.round(cols / 60))); blur(bg, cols, rows, Math.max(2, Math.round(cols / 30)), 2);
      wall = new Uint8Array(N);
      for (let n = 0; n < N; n++) if (minL[n] < bg[n] * .74 || L[n] < bg[n] * .88) wall[n] = 1;
      // (the gaps closed only as far as needed: the thickening is tried small first, and grows until the coast holds a
      // land of its own, so a careful drawing keeps its smallest islands and a hasty one still closes)
      // (every thickening tried; the smallest that finds nearly all the land the largest finds is kept)
      const tries = [];
      for (const fr of [.006, .01, .014, .02, .028, .038]) {
        const r = Math.max(1, Math.round(cols * fr)), thick = dilate(wall, cols, rows, r), core = new Uint8Array(N), q = [];
        const seed = n => { if (!thick[n] && !core[n]) { core[n] = 1; q.push(n); } };
        for (let i = 0; i < cols; i++) { seed(i); seed((rows - 1) * cols + i); } for (let j = 0; j < rows; j++) { seed(j * cols); seed(j * cols + cols - 1); }
        for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; if (i > 0) seed(n - 1); if (i < cols - 1) seed(n + 1); if (j > 0) seed(n - cols); if (j < rows - 1) seed(n + cols); }
        const sv = dilate(core, cols, rows, r + 1); let ln = 0; for (let n = 0; n < N; n++) ln += sv[n] ? 0 : 1;
        tries.push([sv, ln]);
      }
      const most = Math.max(...tries.map(t => t[1])); sea = (tries.find(t => t[1] >= most * .85) || tries[tries.length - 1])[0];
      // (land that is only strokes, writing or a compass rose out at sea, is not land: real land, outlined or filled,
      // keeps a body when shaved by two cells)
      { const land0 = new Uint8Array(N); for (let n = 0; n < N; n++) land0[n] = sea[n] ? 0 : 1;
        const er = new Uint8Array(N), sd = dilate(Uint8Array.from(sea), cols, rows, 2); for (let n = 0; n < N; n++) er[n] = land0[n] && !sd[n] ? 1 : 0;
        const seen = new Uint8Array(N);
        for (let n = 0; n < N; n++) { if (seen[n] || !land0[n]) continue; const cells = [n]; seen[n] = 1; let body = 0;
          for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; if (er[c]) body++; for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, j > 0 ? c - cols : -1, j < rows - 1 ? c + cols : -1]) if (m >= 0 && !seen[m] && land0[m]) { seen[m] = 1; cells.push(m); } }
          if (body === 0) for (const c of cells) sea[c] = 1; } }
    }
    // little specks are noise: a word written in the sea is not an island, a blot on the land not a lake
    specks(cols, rows, n => !sea[n], Math.max(3, N * .0004), n => { sea[n] = 1; });
    specks(cols, rows, n => !!sea[n], Math.max(3, N * .0004), n => { sea[n] = 0; });
    let landN = 0; for (let n = 0; n < N; n++) if (!sea[n]) landN++;
    if (landN < N * .03) sea.fill(0);   // the coast never closed: all of it is land
    // the mountains drawn
    const mtn = new Float32Array(N), dS = dist(cols, rows, n => !!sea[n]);
    // (on an ink drawing, the strokes joined to the coast are the coast's own line, not mountains: a peak drawn in the
    // land stands apart from it)
    const coastInk = new Uint8Array(N);
    if (wall) { const q = []; for (let n = 0; n < N; n++) if (wall[n] && !sea[n] && dS[n] <= 2) { coastInk[n] = 1; q.push(n); }
      for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (wall[m] && !coastInk[m] && !sea[m]) { coastInk[m] = 1; q.push(m); } } } }
    // (a mark that closes round a little paper, a circle or a letter like o, is a tree or a word, not a mountain: the
    // peaks (^) and hatching drawn for mountains stay open)
    const looped = new Uint8Array(N);
    if (wall) { const seen = new Uint8Array(N);
      for (let n = 0; n < N; n++) {
        if (seen[n] || !wall[n] || coastInk[n] || sea[n]) continue;
        const cells = [n]; seen[n] = 1; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
        for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (wall[m] && !seen[m] && !coastInk[m] && !sea[m]) { seen[m] = 1; cells.push(m); } } }
        if (x1 - x0 < 2 || y1 - y0 < 2 || cells.length > N * .02) continue;
        // the paper inside the mark's box that cannot reach the box's edge is a hole
        const bw = x1 - x0 + 3, bh = y1 - y0 + 3, inMark = new Uint8Array(bw * bh), out = new Uint8Array(bw * bh), qq = [];
        for (const c of cells) inMark[((c / cols | 0) - y0 + 1) * bw + (c % cols) - x0 + 1] = 1;
        for (let a = 0; a < bw; a++) for (const b of [0, bh - 1]) { const k = b * bw + a; if (!out[k]) { out[k] = 1; qq.push(k); } }
        for (let b = 0; b < bh; b++) for (const a of [0, bw - 1]) { const k = b * bw + a; if (!out[k]) { out[k] = 1; qq.push(k); } }
        for (let h = 0; h < qq.length; h++) { const k = qq[h], a = k % bw, b = (k / bw) | 0; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const A2 = a + da, B2 = b + db; if (A2 < 0 || B2 < 0 || A2 >= bw || B2 >= bh) continue; const m = B2 * bw + A2; if (!out[m] && !inMark[m]) { out[m] = 1; qq.push(m); } } }
        let hole = 0, holes = 0, slivers = 0; const hs = new Uint8Array(bw * bh);
        for (let k = 0; k < bw * bh; k++) {
          if (out[k] || inMark[k]) continue; hole++; if (hs[k]) continue; holes++; const st = [k]; hs[k] = 1; let ha = 1e9, hb = -1, hc = 1e9, hd = -1, hn = 0;
          while (st.length) { const c = st.pop(), a = c % bw, b = (c / bw) | 0; hn++; ha = Math.min(ha, a); hb = Math.max(hb, a); hc = Math.min(hc, b); hd = Math.max(hd, b); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const A2 = a + da, B2 = b + db; if (A2 < 0 || B2 < 0 || A2 >= bw || B2 >= bh) continue; const m = B2 * bw + A2; if (!hs[m] && !out[m] && !inMark[m]) { hs[m] = 1; st.push(m); } } }
          // (a sliver: long and thin, as the paper between two strokes of hatching is; a letter's hole is round)
          const L2 = Math.hypot(hb - ha + 1, hd - hc + 1); if (L2 >= 3 && hn / L2 < 1.3) slivers++;
        }
        // (hatching: a broad mark whose pockets are mostly slivers between its strokes is mountains, not trees or writing)
        if (holes >= 3 && slivers >= holes * .6 && Math.max(x1 - x0, y1 - y0) >= cols * .03 && hole < cells.length) continue;
        if (hole > 0) for (const c of cells) looped[c] = 1;
        // a loop round much paper is a lake's shore (its paper the lake); a long line that wanders but little is a river
        if (hole > Math.max(12, N * .0012)) { for (let k = 0; k < bw * bh; k++) if (!out[k] && !inMark[k]) lake[((k / bw | 0) + y0 - 1) * cols + (k % bw) + x0 - 1] = 1; for (const c of cells) looped[c] = 2; }
        else if (!hole && Math.max(x1 - x0, y1 - y0) > cols * .05 && cells.length / Math.hypot(x1 - x0 + 1, y1 - y0 + 1) < 3.2) for (const c of cells) { river[c] = 1; looped[c] = 3; }
      } }
    for (let n = 0; n < N; n++) {
      if (sea[n]) continue;
      if (wall) { if (wall[n] && !coastInk[n] && !looped[n]) mtn[n] = 1; }
      else {
        // (the colour key, by hue: see KINDS; a colour none of them is plain land)
        const k = kindOf(R[n], Gc[n], B[n]); kind[n] = k; mtn[n] = KIND_MTN[k] || 0;
      }
    }
    // (a mountain mark stands for the mountains about it: the marks spread and softened into ranges; specks dropped)
    specks(cols, rows, n => mtn[n] > 0, Math.max(2, N * .00008), n => { mtn[n] = 0; });
    // (a painted kind smaller than a few cells is a slip of the brush)
    for (let k = 1; k < KINDS.length; k++) specks(cols, rows, n => kind[n] === k, k === K.volcano ? 1 : Math.max(3, N * .0002), n => { kind[n] = 0; });
    blur(mtn, cols, rows, Math.max(1, Math.round(cols / 160)), 2);
    let mx = 0; for (let n = 0; n < N; n++) mx = Math.max(mx, mtn[n]); if (mx > 0) for (let n = 0; n < N; n++) mtn[n] = sea[n] ? 0 : Math.min(1, mtn[n] / mx * 1.4);
    const land = new Uint8Array(N); for (let n = 0; n < N; n++) { land[n] = sea[n] ? 0 : 1; if (sea[n] || lake[n] || river[n]) kind[n] = 0; if (sea[n]) lake[n] = river[n] = 0; }
    return { cols, rows, land, mtn, lake, river, kind, how: colour ? "colour" : "lines" };
  }
  // the grid a sketch is read onto: at most 400 cells across, the picture's own shape (or the map's, if given)
  function gridFor(iw, ih, aspect) { const a = aspect || iw / ih, cols = Math.min(400, Math.max(40, Math.round(Math.sqrt(64000 * a)))); return [cols, Math.max(20, Math.round(cols / a))]; }

  // kept as text: the land as runs of sea and land, the mountains in sixteen steps, as runs
  function encode(sk) {
    const runs = (arr, q) => { const out = []; let v = q(arr[0]), n = 0; for (let i = 0; i < arr.length; i++) { const w = q(arr[i]); if (w === v && n < 65535) n++; else { out.push(v, n); v = w; n = 1; } } out.push(v, n); return out.join(","); };
    return { cols: sk.cols, rows: sk.rows, land: runs(sk.land, v => v ? 1 : 0), mtn: runs(sk.mtn, v => Math.round(v * 15)), lake: sk.lake ? runs(sk.lake, v => v ? 1 : 0) : undefined, river: sk.river ? runs(sk.river, v => v ? 1 : 0) : undefined, kind: sk.kind ? runs(sk.kind, v => v) : undefined };
  }
  function decode(e) {
    const N = e.cols * e.rows, land = new Uint8Array(N), mtn = new Float32Array(N), lake = new Uint8Array(N), river = new Uint8Array(N), kind = new Uint8Array(N);
    const un = (s, into, f) => { const a = String(s).split(",").map(Number); let i = 0; for (let k = 0; k < a.length; k += 2) for (let r = 0; r < a[k + 1] && i < N; r++) into[i++] = f(a[k]); };
    un(e.land, land, v => v); un(e.mtn, mtn, v => v / 15); if (e.lake) un(e.lake, lake, v => v); if (e.river) un(e.river, river, v => v); if (e.kind) un(e.kind, kind, v => v);
    return { cols: e.cols, rows: e.rows, land, mtn, lake, river, kind };
  }
  // onto the map's own grid: smoothly enlarged, the coast given a natural raggedness at the finer grain (noise: a
  // function (x, y) to 0..1), the shape as drawn
  // onto the map's own grid, and made natural (the user, 27 Oct 2026: "a human won't be able to make the mountains
  // natural ... slightly modify the shape after it's done so it's natural"). loose: how freely, 0 exactly as drawn
  // (only the coast's grain), .5 natural (the default), 1 loosely. noise: a function (x, y) to 0..1.
  //   - the coast: the brush's own shapes eased away, then bent in bays and headlands at several scales and given a
  //     ragged, fractal edge; the drawn shape stays, its outline is the land's;
  //   - mountains: a painted band becomes a range: bent a little, higher at its peaks and low at its passes along its
  //     length, spurs branching off its sides, its foothills spreading unevenly;
  //   - forests, deserts, swamps, snow: their edges wander (more than the coast's), so no brush outline shows;
  //   - lakes: a natural shore; rivers: as drawn (the water finds its own way down to them).
  function fit(sk, cols, rows, noise, loose) {
    const L = loose == null ? .5 : clamp(+loose, 0, 1), N = cols * rows, land = new Uint8Array(N), mtn = new Float32Array(N), lake = new Uint8Array(N), river = new Float32Array(N), kind = new Uint8Array(N);
    const k = cols / sk.cols, F = Float32Array.from(sk.land), MW = Float32Array.from(sk.mtn), MS = Float32Array.from(sk.mtn);
    const LK = sk.lake ? Float32Array.from(sk.lake) : null, RV = sk.river ? Float32Array.from(sk.river) : null; if (RV) blur(RV, sk.cols, sk.rows, 1, 1);
    // (the brush's shapes eased: more the looser)
    const eb = Math.max(1, Math.round(sk.cols * (.004 + .012 * L))); blur(F, sk.cols, sk.rows, eb, 2); if (LK) blur(LK, sk.cols, sk.rows, Math.max(1, eb - 1), 1);
    blur(MS, sk.cols, sk.rows, Math.max(2, Math.round(sk.cols * .02)), 2);   // a range's whole breadth, for its spurs and foothills
    const at = (A, x, y) => { const fx = x * sk.cols / cols - .5, fy = y * sk.rows / rows - .5, i = clamp(Math.floor(fx), 0, sk.cols - 1), j = clamp(Math.floor(fy), 0, sk.rows - 1), i1 = Math.min(sk.cols - 1, i + 1), j1 = Math.min(sk.rows - 1, j + 1), tx = clamp(fx - i, 0, 1), ty = clamp(fy - j, 0, 1); return (A[j * sk.cols + i] * (1 - tx) + A[j * sk.cols + i1] * tx) * (1 - ty) + (A[j1 * sk.cols + i] * (1 - tx) + A[j1 * sk.cols + i1] * tx) * ty; };
    const nz = noise || (() => .5), S = cols / 100;   // S: a hundredth of the map's width, in cells
    const fbm = (x, y, o, f) => { let v = 0, a = 1, t = 0; for (let q = 0; q < o; q++) { v += (nz(x * f + q * 17.3, y * f - q * 9.1) - .5) * a; t += a; a *= .5; f *= 2.03; } return v / t * 2; };
    const ridged = (x, y, f) => { let v = 0, a = 1, t = 0; for (let q = 0; q < 3; q++) { const r = 1 - Math.abs(nz(x * f + 50 + q * 7, y * f - q * 3) * 2 - 1); v += r * r * a; t += a; a *= .5; f *= 2.1; } return v / t; };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const n = j * cols + i, x = i + .5, y = j + .5;
      // the coast: warped at a broad scale (bays, headlands), then a fractal grain on the edge itself
      const wx = x + (fbm(x, y, 3, 1 / (S * 14)) * S * 9 + fbm(x - 5, y + 8, 2, 1 / (S * 4)) * S * 2.5) * L, wy = y + (fbm(x + 31, y - 17, 3, 1 / (S * 14)) * S * 9 + fbm(x + 12, y - 3, 2, 1 / (S * 4)) * S * 2.5) * L;
      const edge = fbm(x, y, 5, 1 / (S * 2.2)) * (.1 + .7 * L);
      land[n] = at(F, wx, wy) + edge > .5 ? 1 : 0; if (!land[n]) continue;
      // mountains: bent with the land, peaks and passes along the range, spurs off its sides
      const mx = wx + fbm(x - 9, y + 4, 2, 1 / (S * 5)) * S * 4 * L, my = wy + fbm(x + 6, y - 11, 2, 1 / (S * 5)) * S * 4 * L;
      const core = at(MW, mx, my), wide = at(MS, mx, my);
      if (core > .01 || wide > .01) {
        // (along the range: high massifs and low passes between them; off its sides, branching spurs)
        const a = fbm(x + 77, y, 3, 1 / (S * 4)), along = clamp(.1 + 1.6 * (a + .45), 0, 1.2), spur = ridged(x, y, 1 / (S * 1.6));
        mtn[n] = clamp(L ? core * (1 - Math.min(1, 1.6 * L) + Math.min(1, 1.6 * L) * along) + wide * Math.min(1, 1.6 * L) * (.1 + 1.3 * spur * spur * spur) : core, 0, 1);
      }
      if (LK) lake[n] = at(LK, wx, wy) + edge * .7 > .5 ? 1 : 0; if (RV) river[n] = Math.min(1, at(RV, x, y) * 2.5);
      // kinds of land: read from the nearest sketch cell at a place nudged further, so their edges wander
      if (sk.kind) { const d = S * (.6 + 2.4 * L), kx = wx + fbm(x + 3, y + 40, 4, 1 / (S * 3)) * d, ky = wy + fbm(x - 40, y + 3, 4, 1 / (S * 3)) * d, fx = clamp(Math.floor(kx * sk.cols / cols), 0, sk.cols - 1), fy = clamp(Math.floor(ky * sk.rows / rows), 0, sk.rows - 1); kind[n] = sk.kind[fy * sk.cols + fx]; }
    }
    return { land, mtn, lake, river, kind };
  }

  function specks(cols, rows, is, max, fix) {
    const N = cols * rows, seen = new Uint8Array(N);
    for (let n = 0; n < N; n++) {
      if (seen[n] || !is(n)) continue; const cells = [n]; seen[n] = 1;
      for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, j > 0 ? c - cols : -1, j < rows - 1 ? c + cols : -1]) if (m >= 0 && !seen[m] && is(m)) { seen[m] = 1; cells.push(m); } }
      if (cells.length <= max) for (const c of cells) fix(c);
    }
  }
  function dilate(M, cols, rows, r) {
    const t = new Uint8Array(M.length), o = new Uint8Array(M.length);
    for (let j = 0; j < rows; j++) { let last = -1e9; for (let i = 0; i < cols; i++) { if (M[j * cols + i]) last = i; if (i - last <= r) t[j * cols + i] = 1; } last = 1e9; for (let i = cols - 1; i >= 0; i--) { if (M[j * cols + i]) last = i; if (last - i <= r) t[j * cols + i] = 1; } }
    for (let i = 0; i < cols; i++) { let last = -1e9; for (let j = 0; j < rows; j++) { if (t[j * cols + i]) last = j; if (j - last <= r) o[j * cols + i] = 1; } last = 1e9; for (let j = rows - 1; j >= 0; j--) { if (t[j * cols + i]) last = j; if (last - j <= r) o[j * cols + i] = 1; } }
    return o;
  }
  function maxf(F, cols, rows, r) {
    const t = new Float32Array(F.length);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let m = 0; for (let k = -r; k <= r; k++) { const a = i + k; if (a >= 0 && a < cols) m = Math.max(m, F[j * cols + a]); } t[j * cols + i] = m; }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let m = 0; for (let k = -r; k <= r; k++) { const b = j + k; if (b >= 0 && b < rows) m = Math.max(m, t[b * cols + i]); } F[j * cols + i] = m; }
  }
  function dist(cols, rows, is) {
    const N = cols * rows, D = new Float32Array(N).fill(1e9), q = [];
    for (let n = 0; n < N; n++) if (is(n)) { D[n] = 0; q.push(n); }
    for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && D[m] > D[n] + 1) { D[m] = D[n] + 1; q.push(m); } }
    return D;
  }
  function blur(F, cols, rows, r, passes) {
    const t = new Float32Array(F.length);
    for (let p = 0; p < passes; p++) {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const a = i + k; if (a >= 0 && a < cols) { s += F[j * cols + a]; c++; } } t[j * cols + i] = s / c; }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const b = j + k; if (b >= 0 && b < rows) { s += t[b * cols + i]; c++; } } F[j * cols + i] = s / c; }
    }
  }
  // a picture turned into the painter's colours, cell by cell, as read would understand it
  function toKey(px, iw, ih, cols, rows) {
    const sk = read(px, iw, ih, cols, rows), out = new Uint8ClampedArray(cols * rows * 4), hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const W = hex(WATER), C = KINDS.map(k => hex(k[2]));
    for (let n = 0; n < cols * rows; n++) { const c = !sk.land[n] || sk.lake[n] || sk.river[n] ? W : sk.kind && sk.kind[n] ? C[sk.kind[n]] : sk.mtn[n] > .5 ? C[K.mountains] : sk.mtn[n] > .2 ? C[K.hills] : C[K.plains]; out[n * 4] = c[0]; out[n * 4 + 1] = c[1]; out[n * 4 + 2] = c[2]; out[n * 4 + 3] = 255; }
    return out;
  }
  return { read, toKey, gridFor, encode, decode, fit, KINDS, K, WATER, kindOf, blur };
});
