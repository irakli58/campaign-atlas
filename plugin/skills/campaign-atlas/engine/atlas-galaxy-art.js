/* The galaxy drawn (the galaxy plan of 5 Nov 2026, approved 10 Nov: sections 5 and 7). From the model of the galaxy
   (atlas-galaxy-model.js):
   - its picture, made once for each galaxy and kept: the old stars of the discs, the bar and the bulge in warm light; the
     arms lit blue-white by their young stars, with the pink clouds where stars are being born; dark dust lanes on the
     arms' inner edges and along the bar's leading sides [where gas piles up as it falls into a density wave]; the halo
     faint; the black hole's crowded heart a small bright point, quiet (no great disc, no jets) unless the galaxy's nucleus
     is an active one. Painted in slices, a rough one first, so the page never stops;
   - the unresolved stars of whatever part is in view: a scatter of faint points as many as the galaxy has there, the
     same every time, behind the campaign's own systems, which are drawn over them and can be clicked;
   - a star's colour by its kind (its temperature: blue O to red M, the dim brown dwarfs, white dwarfs, red giants). */
(function (A) {
  "use strict";
  if (!A || typeof document === "undefined") return;
  const KPC = 3261.56, TAU = Math.PI * 2;
  const COL = { O: "#9bb0ff", B: "#aabfff", A: "#cad7ff", F: "#f8f7ff", G: "#fff4ea", K: "#ffd2a1", M: "#ffad74", D: "#e8eaff", N: "#c7d2ff", X: "#6b4a8a", L: "#d2693c", T: "#a3527a", Y: "#7a5a92", R: "#ffb26b" };
  // how big a star is drawn, in screen pixels, by how bright its kind is (never by the zoom)
  const RAD = { O: 3.6, B: 3.2, A: 2.9, F: 2.7, G: 2.6, K: 2.4, M: 2.1, D: 1.7, N: 1.7, X: 2.1, L: 1.7, T: 1.6, Y: 1.5, R: 3.3 };
  const NAME = { L: "a brown dwarf, warm", T: "a brown dwarf, cool", Y: "a brown dwarf, coldest of all", R: "a red giant" };
  const h32 = (a, b, c) => { let n = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  // smooth noise for the clouds and the dust's filaments
  const noise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, f = t => t * t * (3 - 2 * t), a = h32(xi, yi, s), b = h32(xi + 1, yi, s), c = h32(xi, yi + 1, s), d = h32(xi + 1, yi + 1, s); return a + (b - a) * f(u) + (c - a) * f(v) + (a - b - c + d) * f(u) * f(v); };
  const fbm = (x, y, s) => (noise(x, y, s) * .5 + noise(x * 2.1, y * 2.1, s + 1) * .3 + noise(x * 4.3, y * 4.3, s + 2) * .2);

  /* ---- the picture */
  const PIC = new Map();
  // the light of each pixel: [r, g, b] before the tone is set
  function light(GM, M, x, y, seed) {
    const T = M.T, col = GM.column(M, x, y), R = Math.hypot(x, y), th = Math.atan2(y, x), arm = T.arms ? (T.arms.clumps ? GM.parts(M, x, y, 0).arm : GM.armField(M, R, th)) : 0, A0 = T.arms || {};
    const Rk = R / KPC, nz = fbm(x / KPC * 1.3, y / KPC * 1.3, seed);
    const old = col.thin * (1 + (A0.old || 0) * arm) + col.thick, bul = col.bulge, halo = col.halo;
    const cl = fbm(x / KPC * 2.4, y / KPC * 2.4, seed + 3), young = col.thin * (A0.young ? (.06 + A0.young * arm) * (.25 + Math.pow(cl, 1.6) * 2.2) : .12);
    // where stars are being born: pink clouds on the arms, clumped
    const hii = arm > .35 && T.arms ? col.thin * Math.pow(Math.max(0, fbm(x / KPC * 6, y / KPC * 6, seed + 5) - .56), 1.4) * 160 * arm : 0;
    // the dust: just inside each arm, and along the bar's leading edges; thin filaments by the noise
    let dust = 0;
    if (T.dust && T.Rd) {
      const inner = T.arms ? GM.armField(M, R * 1.07, th) : 0;
      dust = Math.max(0, inner - arm * .6) * T.dust * .75 * (.3 + fbm(x / KPC * 3.4, y / KPC * 3.4, seed + 9) * 1.2);
      if (T.bar) { const a = -T.bar.angle * Math.PI / 180, u = (x * Math.cos(a) - y * Math.sin(a)) / KPC, v = (x * Math.sin(a) + y * Math.cos(a)) / KPC; const lead = Math.exp(-Math.pow((Math.abs(v) - .45) / .18, 2)) * Math.exp(-Math.pow(Math.max(0, Math.abs(u) - T.bar.a * .85) / .6, 2)) * (Math.sign(u) === Math.sign(v) ? 1 : .3); dust = Math.max(dust, lead * .5 * T.dust * (Rk > .4 ? 1 : Rk / .4)); }
      dust *= Math.exp(-Math.max(0, Rk - T.Rmax * .9) / 2);
    }
    const keep = 1 - Math.min(.85, dust);
    // warm old light, the bulge warmer, the young blue-white, the clouds pink
    const r = ((old * 1.35 + bul * .72 + halo) * 255 + young * 250 + hii * 460) * keep;
    const g = ((old * 1.18 + bul * .56 + halo * .9) * 255 + young * 300 + hii * 150) * keep;
    const b = ((old * .92 + bul * .40 + halo * .85) * 255 + young * 420 + hii * 230) * keep;
    return [r, g, b];
  }
  // the picture of a galaxy, n pixels across, covering 2.5 times its radius; the rough first, then the fine, in slices
  function picture(M, n, then) {
    const key = [M.type, M.arms.map(a => a.th0.toFixed(3)).join(","), M.bh ? M.bh.active : 0, n].join("|");
    let P = PIC.get(key); if (P) { if (P.done && then) then(P.cv); else if (then) P.wait.push(then); return P; }
    const GM = A.galaxyModel, L = M.Rmax * 1.25, cv = document.createElement("canvas"); cv.width = cv.height = n;
    P = { cv, L, done: false, wait: then ? [then] : [], key }; PIC.set(key, P);
    const ctx = cv.getContext("2d"), img = ctx.createImageData(n, n), seed = 17;
    // the tone: soft at the bright core, so the arms still show (an arcsinh stretch); scaled to the disc at 2 scale lengths
    const ref = (() => { const c = GM.column(M, (M.T.Rd || 3) * 2 * KPC, 0); return Math.max(1e-12, (c.thin + c.thick + c.bulge + c.halo) * 255); })();
    const tone = v => Math.min(255, 255 * Math.asinh(v / ref * 3.2) / Math.asinh(16));
    let row = 0;
    const slice = () => {
      const t0 = Date.now();
      while (row < n && Date.now() - t0 < 24) {
        for (let i = 0; i < n; i++) {
          const x = -L + (i + .5) / n * 2 * L, y = -L + (row + .5) / n * 2 * L, [r, g, b] = light(GM, M, x, y, seed), o = (row * n + i) * 4;
          img.data[o] = tone(r); img.data[o + 1] = tone(g); img.data[o + 2] = tone(b); img.data[o + 3] = 255;
        }
        row++;
      }
      if (row < n) { setTimeout(slice, 0); return; }
      ctx.putImageData(img, 0, 0);
      // the heart: the crowded stars round the black hole a small bright point; an active nucleus outshines them
      if (M.bh) { const c = n / 2, act = M.bh.active || 0, g = ctx.createRadialGradient(c, c, 0, c, c, n * (.012 + act * .03)); g.addColorStop(0, `rgba(255,${240 - act * 40},${215 - act * 60},${.9})`); g.addColorStop(1, "rgba(255,230,200,0)"); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, n, n); ctx.globalCompositeOperation = "source-over"; }
      P.done = true; for (const f of P.wait.splice(0)) { try { f(cv); } catch (e) { console.warn(e); } }
    };
    slice();
    return P;
  }

  /* ---- the galaxy edge-on: looked at from the side, across the line from its centre through our space (ux, uy: that
          line's direction); its light summed through it: the thin disc a bright line, the thick disc and the bulge
          swelling round it, the halo faint, and a spiral's dark lane of dust along the middle of its plane */
  const SIDE = new Map();
  function sidePicture(M, w, h, ux, uy, then) {
    const key = [M.type, M.arms.map(a => a.th0.toFixed(2)).join(","), w, h, ux.toFixed(3), uy.toFixed(3)].join("|");
    let P = SIDE.get(key); if (P) { if (P.done && then) then(P.cv); else if (then) P.wait.push(then); return P; }
    const GM = A.galaxyModel, L = M.Rmax * 1.25, Z = L * h / w, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    P = { cv, L, Z, done: false, wait: then ? [then] : [] }; SIDE.set(key, P);
    const ctx = cv.getContext("2d"), img = ctx.createImageData(w, h), T = M.T, NS = 26;
    const sum = (u, z) => { let o = 0, b = 0, hz = 0; for (let k = 0; k < NS; k++) { const t = -L + (k + .5) / NS * 2 * L, x = u * ux - t * uy, y = u * uy + t * ux, p = GM.parts(M, x, y, z); o += p.thin + p.thick; b += p.bulge; hz += p.halo; } return [o, b, hz]; };
    const [r0] = sum((T.Rd || 3) * 2 * KPC, 0), ref = Math.max(1e-12, r0 * 255);
    const tone = v => Math.min(255, 255 * Math.asinh(v / ref * 3.2) / Math.asinh(16));
    let row = 0;
    const slice = () => {
      const t0 = Date.now();
      while (row < h && Date.now() - t0 < 24) {
        const z = Z - (row + .5) / h * 2 * Z;
        for (let i = 0; i < w; i++) {
          const u = -L + (i + .5) / w * 2 * L, [o, b, hz] = sum(u, z), Ru = Math.abs(u) / KPC;
          // the dust lane: in the plane, across the disc where the gas is (thin, a few hundred light years)
          const dust = T.dust && T.Rd ? Math.min(.8, T.dust * .75 * Math.exp(-Math.pow(z / (.09 * KPC), 2)) * Math.exp(-Math.max(0, Ru - T.Rd * 3.2) / 2) * (Ru > .5 ? 1 : Ru / .5)) : 0, keep = 1 - dust, ix = (row * w + i) * 4;
          img.data[ix] = tone((o * 1.3 + b * .75 + hz) * 255 * keep); img.data[ix + 1] = tone((o * 1.15 + b * .58 + hz * .9) * 255 * keep); img.data[ix + 2] = tone((o * .95 + b * .42 + hz * .85) * 255 * keep); img.data[ix + 3] = 255;
        }
        row++;
      }
      if (row < h) { setTimeout(slice, 0); return; }
      ctx.putImageData(img, 0, 0); P.done = true; for (const f of P.wait.splice(0)) { try { f(cv); } catch (e) { console.warn(e); } }
    };
    slice();
    return P;
  }

  /* ---- the unresolved stars of what is in view: in tiles, so the same ones come back each time */
  const TILES = new Map();
  function tile(GM, M, size, ix, iy) {
    const key = size + ":" + ix + ":" + iy; let t = TILES.get(key); if (t) return t;
    const cx = (ix + .5) * size, cy = (iy + .5) * size, c = GM.column(M, cx, cy), arm = M.T.arms ? GM.armField(M, Math.hypot(cx, cy), Math.atan2(cy, cx)) : 0;
    const ref = GM.column(M, M.sun.x, M.sun.y), rel = (c.thin + c.thick + c.bulge + c.halo) / Math.max(1e-12, ref.thin + ref.thick + ref.bulge + ref.halo);
    const n = Math.min(520, Math.round(110 * Math.pow(rel, .55))), out = new Float32Array(n * 4), young = M.T.arms ? Math.min(.6, .08 + (M.T.arms.young || 0) * arm * .12) : .05, bulge = c.bulge / Math.max(1e-12, c.thin + c.thick + c.bulge + c.halo);
    for (let k = 0; k < n; k++) {
      const u = h32(ix, iy, k * 4 + size), v = h32(iy, ix, k * 4 + 1 + size), w = h32(ix + k, iy - k, 7 + size), q = h32(k, ix ^ iy, 11 + size);
      out[k * 4] = (ix + u) * size; out[k * 4 + 1] = (iy + v) * size;
      out[k * 4 + 2] = Math.pow(w, 3.2);                                           // brightness: most faint, a few bright
      out[k * 4 + 3] = q < young ? 0 : q < young + bulge * .9 ? 2 : 1;            // 0 blue-white, 1 white-yellow, 2 orange
    }
    t = { pts: out, n }; TILES.set(key, t); if (TILES.size > 900) TILES.delete(TILES.keys().next().value);
    return t;
  }
  // draw them: view = { x0, y0, x1, y1 } in ly, toScreen(x, y) -> [px, py]; the tile size follows the zoom
  function field(ctx, M, view, toScreen, alpha) {
    const GM = A.galaxyModel, w = view.x1 - view.x0, size = Math.pow(2, Math.round(Math.log2(Math.max(.5, w / 7))));
    const i0 = Math.floor(view.x0 / size), i1 = Math.floor(view.x1 / size), j0 = Math.floor(view.y0 / size), j1 = Math.floor(view.y1 / size);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 120) return;
    const C3 = ["rgba(190,210,255,", "rgba(255,244,228,", "rgba(255,206,160,"];
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const t = tile(GM, M, size, i, j);
      for (let k = 0; k < t.n; k++) {
        const b = t.pts[k * 4 + 2], [px, py] = toScreen(t.pts[k * 4], t.pts[k * 4 + 1]), a = (.18 + b * .75) * alpha;
        if (a < .04) continue;
        ctx.fillStyle = C3[t.pts[k * 4 + 3]] + a.toFixed(3) + ")";
        const s = b > .7 ? 1.6 : 1; ctx.fillRect(px, py, s, s);
      }
    }
  }

  A.galaxyArt = { COL, RAD, NAME, picture, sidePicture, field, colour: c => COL[c] || COL.G, radius: c => RAD[c] || 2.2 };
})(typeof ATLAS !== "undefined" ? ATLAS : null);
