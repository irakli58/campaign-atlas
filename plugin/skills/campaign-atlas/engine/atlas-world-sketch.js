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

  // px: RGBA bytes, iw by ih; cols by rows: the grid it is read onto
  function read(px, iw, ih, cols, rows) {
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
    let sea = new Uint8Array(N), wall = null; const colour = nb > N * .08 && nb < N * .94;
    const lake = new Uint8Array(N), river = new Uint8Array(N);
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
        const r = R[n], g = Gc[n], b = B[n], l = L[n], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
        const brown = r > g && g >= b - 6 && sat > .18 && l < paper * .8, grey = sat < .12 && l < paper * .78, dark = l < paper * .45, snow = l > paper * .97 && sat < .06 && dS[n] > 3;
        if (brown || grey || dark || snow) mtn[n] = dark || snow ? 1 : .8;
      }
    }
    // (a mountain mark stands for the mountains about it: the marks spread and softened into ranges; specks dropped)
    specks(cols, rows, n => mtn[n] > 0, Math.max(2, N * .00008), n => { mtn[n] = 0; });
    blur(mtn, cols, rows, Math.max(1, Math.round(cols / 160)), 2);
    let mx = 0; for (let n = 0; n < N; n++) mx = Math.max(mx, mtn[n]); if (mx > 0) for (let n = 0; n < N; n++) mtn[n] = sea[n] ? 0 : Math.min(1, mtn[n] / mx * 1.4);
    const land = new Uint8Array(N); for (let n = 0; n < N; n++) { land[n] = sea[n] ? 0 : 1; if (sea[n]) lake[n] = river[n] = 0; }
    return { cols, rows, land, mtn, lake, river, how: colour ? "colour" : "lines" };
  }
  // the grid a sketch is read onto: at most 400 cells across, the picture's own shape (or the map's, if given)
  function gridFor(iw, ih, aspect) { const a = aspect || iw / ih, cols = Math.min(400, Math.max(40, Math.round(Math.sqrt(64000 * a)))); return [cols, Math.max(20, Math.round(cols / a))]; }

  // kept as text: the land as runs of sea and land, the mountains in sixteen steps, as runs
  function encode(sk) {
    const runs = (arr, q) => { const out = []; let v = q(arr[0]), n = 0; for (let i = 0; i < arr.length; i++) { const w = q(arr[i]); if (w === v && n < 65535) n++; else { out.push(v, n); v = w; n = 1; } } out.push(v, n); return out.join(","); };
    return { cols: sk.cols, rows: sk.rows, land: runs(sk.land, v => v ? 1 : 0), mtn: runs(sk.mtn, v => Math.round(v * 15)), lake: sk.lake ? runs(sk.lake, v => v ? 1 : 0) : undefined, river: sk.river ? runs(sk.river, v => v ? 1 : 0) : undefined };
  }
  function decode(e) {
    const N = e.cols * e.rows, land = new Uint8Array(N), mtn = new Float32Array(N), lake = new Uint8Array(N), river = new Uint8Array(N);
    const un = (s, into, f) => { const a = String(s).split(",").map(Number); let i = 0; for (let k = 0; k < a.length; k += 2) for (let r = 0; r < a[k + 1] && i < N; r++) into[i++] = f(a[k]); };
    un(e.land, land, v => v); un(e.mtn, mtn, v => v / 15); if (e.lake) un(e.lake, lake, v => v); if (e.river) un(e.river, river, v => v);
    return { cols: e.cols, rows: e.rows, land, mtn, lake, river };
  }
  // onto the map's own grid: smoothly enlarged, the coast given a natural raggedness at the finer grain (noise: a
  // function (x, y) to 0..1), the shape as drawn
  function fit(sk, cols, rows, noise) {
    const N = cols * rows, land = new Uint8Array(N), mtn = new Float32Array(N), lake = new Uint8Array(N), river = new Float32Array(N), F = Float32Array.from(sk.land);
    const LK = sk.lake ? Float32Array.from(sk.lake) : null, RV = sk.river ? Float32Array.from(sk.river) : null; if (RV) blur(RV, sk.cols, sk.rows, 1, 1);
    blur(F, sk.cols, sk.rows, 1, 1);
    const at = (A, x, y) => { const fx = x * sk.cols / cols - .5, fy = y * sk.rows / rows - .5, i = clamp(Math.floor(fx), 0, sk.cols - 1), j = clamp(Math.floor(fy), 0, sk.rows - 1), i1 = Math.min(sk.cols - 1, i + 1), j1 = Math.min(sk.rows - 1, j + 1), tx = clamp(fx - i, 0, 1), ty = clamp(fy - j, 0, 1); return (A[j * sk.cols + i] * (1 - tx) + A[j * sk.cols + i1] * tx) * (1 - ty) + (A[j1 * sk.cols + i] * (1 - tx) + A[j1 * sk.cols + i1] * tx) * ty; };
    const k = cols / sk.cols;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const n = j * cols + i, x = i + .5, y = j + .5, wob = noise ? (noise(x / (k * 1.6), y / (k * 1.6)) - .5) * .5 + (noise(x / (k * .6) + 7, y / (k * .6)) - .5) * .22 : 0;
      land[n] = at(F, x, y) + wob > .5 ? 1 : 0; mtn[n] = land[n] ? at(sk.mtn, x, y) : 0;
      if (land[n] && LK) lake[n] = at(LK, x, y) + wob * .6 > .5 ? 1 : 0; if (land[n] && RV) river[n] = Math.min(1, at(RV, x, y) * 2.5);
    }
    return { land, mtn, lake, river };
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
  return { read, gridFor, encode, decode, fit };
});
