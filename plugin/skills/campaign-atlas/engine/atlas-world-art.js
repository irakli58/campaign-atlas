/* The world map's art (the user asked, 27 Oct 2026, for world maps that look professionally drawn, in a style fitting
   the campaign: Fantasy, Modern and Sci-Fi, and the past, chosen from the setting and changeable by the game master).
   atlas-world.js keeps everything the map does (its places, roads, journeys, editing, the doors into the 3D cities);
   this file only draws the land under them, each look by its own hand:
   - parchment (fantasy): an inked coast with lines echoing it out to sea, ranges of hatched mountains, foothills, woods
     of broadleaf and pine, marsh, sand, waves and ships, a compass rose, a chequered frame and a title cartouche;
   - engraved (the past): an atlas plate of the 1800s: hachured slopes, water-lining, a graduated border, a north arrow;
   - atlas (the modern world): shaded relief in height colours, sea depths and depth lines, towns as built-up areas, a
     grid of coordinates;
   - holo (science fiction, a planet): a survey display: glowing contours, a lettered grid, a frame of readouts;
   - stars (a star chart): stars of many colours, nebulae, a grid, the same frame.
   The land is painted at up to 2400 pixels across (it was 500), and drawn things that would crowd the whole map come in
   only as it is brought closer (classes lod1 and lod2: atlas-world.js marks the zoom on the map, the page hides them). */
(function (A) {
  "use strict";
  const K = A.worldDraw; if (!K) return;
  const { sampler, coastRings, chaikin, rdpRing, pathD, hash, ramp, mix, hex, clamp, vnoise } = K;
  const r1 = v => Math.round(v * 10) / 10;
  const LOOKS = [["parchment", "Fantasy: parchment"], ["engraved", "The past: an engraved atlas"], ["atlas", "Modern: an atlas"], ["holo", "Science fiction: a survey"], ["stars", "Science fiction: a star chart"]];
  // the looks a world may wear: a world with land may wear any but the star chart; a star chart only that
  const looksFor = WD => WD.G && !WD.stars && WD.look !== "stars" ? LOOKS.filter(l => l[0] !== "stars") : LOOKS.filter(l => l[0] === "stars");

  /* ---- painting the land and sea: heights on a grid as fine as the picture, light from the north-west */
  function raster(WD, colour, opts) {
    opts = opts || {};
    const [W, H] = WD.size, G = WD.G, S = sampler(G), sea = G.sea, k = Math.min(2, (opts.max || 2000) / Math.max(W, H));
    const cw = Math.round(W * k), ch = Math.round(H * k), N = cw * ch, hv = new Float32Array(N), mv = new Float32Array(N);
    const nz = vnoise(Math.floor(hash(W, H, 11) * 1e9)), detail = opts.detail == null ? 9 : opts.detail;
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      const x = (px + .5) / k, y = (py + .5) / k, h = S(x, y), i = py * cw + px;
      // fine relief the grid is too coarse to hold, on land only, more on the heights
      hv[i] = h > sea ? h + (nz(x * .09, y * .09) - .5) * detail * (.4 + (h - sea) / (256 - sea)) : h;
      mv[i] = G.M ? S(x, y, G.M) : 128;
    }
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    const cx = cv.getContext("2d"), img = cx.createImageData(cw, ch), d = img.data, z = (WD.T && WD.T.real ? .55 : 1) * k;
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      const i = py * cw + px, l = px > 0 ? hv[i - 1] : hv[i], r = px < cw - 1 ? hv[i + 1] : hv[i], u = py > 0 ? hv[i - cw] : hv[i], b = py < ch - 1 ? hv[i + cw] : hv[i];
      const gx = (r - l) * z, gy = (b - u) * z, x = (px + .5) / k, y = (py + .5) / k;
      const c = colour(hv[i], mv[i], gx, gy, x, y, nz), o = i * 4;
      d[o] = clamp(c[0], 0, 255); d[o + 1] = clamp(c[1], 0, 255); d[o + 2] = clamp(c[2], 0, 255); d[o + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return cv.toDataURL("image/jpeg", .9);
  }
  // light from the north-west: 1 is flat, above 1 lit, below shaded
  const shade = (gx, gy, s) => 1 - (gx + gy) * s;

  /* ---- shapes every look uses */
  const ringsAt = (G, level, eps) => coastRings(Object.assign({}, G, { sea: level })).map(r => chaikin(rdpRing(r, eps || .8), 2, true));
  const coastD = (G, eps) => ringsAt(G, G.sea, eps).map(r => pathD(r, true)).join("");
  // where a thing may stand: on land or at sea, and how high
  const probe = WD => { const S = sampler(WD.G), sea = WD.G.sea; return { S, sea, t: (x, y) => (S(x, y) - sea) / (255 - sea), M: (x, y) => WD.G.M ? S(x, y, WD.G.M) : 128 }; };
  // a jittered lattice: fn(x, y, r, row) at each point, about every dx by dy
  function lattice(W, H, dx, dy, seed, fn) { for (let y = dy * .5, row = 0; y < H; y += dy, row++) for (let x = dx * .5 + (row % 2) * dx * .5; x < W; x += dx) fn(x + (hash(x * 7, y * 3, seed) - .5) * dx * .8, y + (hash(x * 5, y * 11, seed + 1) - .5) * dy * .8, hash(x, y, seed + 2), row); }
  // the corner of the map most of sea, for the compass and the title
  // (most sea, and fewest places and names under it)
  // (anywhere on a lattice over the map: the disc of the compass all sea if it can be, the corners a little preferred)
  function seaCorner(WD, pr) {
    const [W, H] = WD.size, R = Math.min(W, H) * .1, c = [];
    for (const fy of [.13, .3, .5, .7, .87]) for (const fx of [.1, .25, .4, .6, .75, .9]) c.push([fx, fy]);
    const things = (WD.locs || []).filter(l => Array.isArray(l.at)).map(l => l.at).concat((WD.labels || []).filter(l => Array.isArray(l.at)).map(l => l.at));
    let best = c[0], bv = -1e9;
    for (const p of c) {
      const cx = W * p[0], cy = H * p[1]; let n = 0, all = 0;
      for (let a = 0; a < 16; a++) for (const k of [.35, .7, 1.05]) { all++; if (pr.S(cx + Math.cos(a / 16 * 6.283) * R * k, cy + Math.sin(a / 16 * 6.283) * R * k) <= pr.sea) n++; }
      if (pr.S(cx, cy) <= pr.sea) n++;
      let v = n / (all + 1) * 100 - (Math.abs(p[0] - .5) + Math.abs(p[1] - .5) > .6 ? 0 : 6);
      for (const [x, y] of things) if (Math.hypot(x - cx, y - cy) < R * 1.4) v -= 25;
      if (v > bv) { bv = v; best = p; }
    }
    return best;
  }
  // a river: wider as it runs to the sea, inked or not
  function rivers(WD, col, inkCol, wmul) {
    let s = "";
    for (const rv of WD.rivers || []) if (rv.pts && rv.pts.length > 1) {
      const p = chaikin(rv.pts, 1, false), n = p.length, wd = (rv.w || 1.2) * (wmul || 1);
      for (let q = 0; q < 4; q++) {
        const a = Math.floor(q * (n - 1) / 4), b = Math.min(n - 1, Math.ceil((q + 1) * (n - 1) / 4)); if (b <= a) continue;
        const d = pathD(p.slice(a, b + 1)), w = wd * (.45 + q * .28);
        if (inkCol) s += `<path d="${d}" fill="none" stroke="${inkCol}" stroke-width="${r1(w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
    return s;
  }

  /* ================================================================ fantasy: parchment */
  function parchment(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, ink = "#3b2a1a", pr = probe(WD), sea = G.sea;
    const P = hex("#ecdfbd"), stain = hex("#d9c18f"), seaC = [hex("#b9c4ae"), hex("#9fb1a1"), hex("#8ea595")], wet = hex("#cfd3a2"), dry = hex("#efd9a2"), high = hex("#e6d7b8");
    const img = raster(WD, (h, m, gx, gy, x, y, nz) => {
      const st = (nz(x * .006, y * .006) - .5) * 2, fib = (hash(x * 3 | 0, y * 3 | 0, 5) - .5) * .06, edge = Math.min(x, y, W - x, H - y) / Math.min(W, H);
      let c;
      if (h <= sea) { const dpt = clamp((sea - h) / Math.max(1, sea) * 2, 0, 1); c = ramp([[0, seaC[0]], [.5, seaC[1]], [1, seaC[2]]], dpt); }
      else { const t = (h - sea) / (255 - sea); c = mix(P, high, clamp((t - .55) * 2, 0, 1)); const wv = (m - 128) / 127; if (t < .6) c = wv > 0 ? mix(c, wet, wv * .55) : mix(c, dry, -wv * .5); const sh = shade(gx, gy, .02); c = [c[0] * sh, c[1] * sh, c[2] * sh]; }
      c = mix(c, stain, clamp(st * .35, 0, .3)); c = c.map(v => v * (1 + fib));
      const vig = clamp(1 - Math.max(0, .12 - edge) * 2.2, .72, 1); return c.map(v => v * vig);
    });
    const cd = coastD(G, .7), coarse = coastD(G, 1.6);
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // the coast echoed out to sea, line by line, fainter further out
    for (const [o2, op] of [[19, .16], [13.5, .22], [8.6, .3], [4.6, .42]]) s += `<path d="${coarse}" fill="none" stroke="${ink}" stroke-opacity="${op}" stroke-width="${o2 + .7}"/><path d="${coarse}" fill="none" stroke="url(#${uid}-b)" stroke-width="${o2 - .7}"/>`;
    s += `<path d="${cd}" fill="url(#${uid}-b)" fill-rule="evenodd" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += rivers(WD, "#7d9cab", ink, 1.15);
    s += parchmentSymbols(WD, pr, ink);
    s += seaMarks(WD, pr, ink, o);
    s += frame(WD, ink, "parchment", o);
    return s;
  }
  function parchmentSymbols(WD, pr, ink) {
    const [W, H] = WD.size, bands = new Map(), put = (y, kind, d) => { const b = Math.floor(y / 5); if (!bands.has(b)) bands.set(b, { f: "", sh: "", ol: "", hat: "", snow: "" }); bands.get(b)[kind] += d; };
    const taken = []; const near = (x, y, r) => taken.some(([a, b, rr]) => Math.abs(a - x) < (r + rr) * .62 && Math.abs(b - y) < (r + rr) * .35);
    // mountains: the higher, the bigger and the closer together; each lit on its left, hatched on its right
    lattice(W, H, 9, 7, 21, (x, y, r) => {
      const t = pr.t(x, y); if (t < .5) return;
      if (r > (t - .45) * 2.6) return;
      const w = 5.5 + (t - .5) * 26 + r * 3, h = w * (1.05 + hash(x, y, 9) * .45); if (near(x, y, w)) return; taken.push([x, y, w]);
      const px = x - w * .08, py = y - h, R0 = [x + w * .22, y], B = [x + w, y];
      put(y, "f", `M${r1(x - w)} ${r1(y)}L${r1(px)} ${r1(py)}L${r1(B[0])} ${r1(B[1])}Z`);
      put(y, "sh", `M${r1(px)} ${r1(py)}L${r1(B[0])} ${r1(B[1])}L${r1(R0[0])} ${r1(R0[1])}Z`);
      let hat = ""; for (const k of [.34, .56, .78]) { const a = [px + (R0[0] - px) * k, py + (R0[1] - py) * k], b = [px + (B[0] - px) * k, py + (B[1] - py) * k]; hat += `M${r1(a[0])} ${r1(a[1])}L${r1(a[0] + (b[0] - a[0]) * .82)} ${r1(a[1] + (b[1] - a[1]) * .82)}`; }
      put(y, "ol", `M${r1(x - w)} ${r1(y)}L${r1(px)} ${r1(py)}L${r1(B[0])} ${r1(B[1])}M${r1(px)} ${r1(py)}L${r1(px + w * .12)} ${r1(py + h * .42)}L${r1(R0[0])} ${r1(R0[1] - h * .1)}`); put(y, "hat", hat);
      if (t > .84) put(y, "snow", `M${r1(px - w * .26)} ${r1(py + h * .3)}L${r1(px)} ${r1(py)}L${r1(px + w * .3)} ${r1(py + h * .3)}L${r1(px + w * .12)} ${r1(py + h * .22)}L${r1(px)} ${r1(py + h * .34)}Z`);
    });
    let mtn = ""; for (const b of [...bands.keys()].sort((a, c) => a - c)) { const v = bands.get(b); mtn += `<path d="${v.f}" fill="#efe4c6"/><path d="${v.sh}" fill="${ink}" fill-opacity=".2"/>${v.snow ? `<path d="${v.snow}" fill="#fbf8ef" stroke="${ink}" stroke-width=".5"/>` : ""}<path d="${v.hat}" fill="none" stroke="${ink}" stroke-width=".45" stroke-opacity=".7" stroke-linecap="round"/><path d="${v.ol}" fill="none" stroke="${ink}" stroke-width=".85" stroke-linejoin="round" stroke-linecap="round"/>`; }
    // foothills, woods, marsh, sand, grass: each kind one path, the finer ones only closer up
    const D = { hill: "", hill1: "", broad: "", broad1: "", pine: "", pine1: "", trunk: "", marsh: "", marsh1: "", sand: "", sand1: "", grass1: "" };
    lattice(W, H, 8, 6, 31, (x, y, r, row) => {
      const t = pr.t(x, y); if (t < .38 || t >= .52 || near(x, y, 4)) return; if (r > .42) return;
      const w = 4.5 + r * 4, k = row % 3 ? "hill1" : "hill";
      D[k] += `M${r1(x - w)} ${r1(y)}Q${r1(x)} ${r1(y - w * 1.15)} ${r1(x + w)} ${r1(y)}M${r1(x + w * .25)} ${r1(y - w * .45)}l${r1(w * .35)} ${r1(w * .4)}`;
    });
    lattice(W, H, 5.4, 4.6, 41, (x, y, r, row) => {
      const t = pr.t(x, y), m = pr.M(x, y); if (t <= .015 || t > .55) return;
      if (m > 138 && r < (m - 138) / 117 * 1.7 && !near(x, y, 2)) {
        const lod = (row + Math.floor(x / 5.4)) % 2 ? "1" : "", conifer = t > .3 || hash(x, y, 77) < .25;
        if (conifer) D["pine" + lod] += `M${r1(x)} ${r1(y - 5.4)}L${r1(x + 2.7)} ${r1(y - .4)}L${r1(x - 2.7)} ${r1(y - .4)}Z`;
        else { const rr = 2.4 + hash(x, y, 78) * .9; D["broad" + lod] += `M${r1(x + rr)} ${r1(y - rr - .6)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-2 * rr)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(2 * rr)} 0`; }
        if (!lod) D.trunk += `M${r1(x)} ${r1(y - .6)}v1.4`;
        return;
      }
      if (m > 205 && t < .14 && r < .5) { D[row % 2 ? "marsh1" : "marsh"] += `M${r1(x - 2.6)} ${r1(y)}h5.2M${r1(x - 1.6)} ${r1(y)}v-2.4M${r1(x)} ${r1(y)}v-3.4M${r1(x + 1.6)} ${r1(y)}v-2.4`; return; }
      if (m < 78 && t < .45 && r < (78 - m) / 78 * 1.4) { for (let q = 0; q < 4; q++) { const sx = x + (hash(x, y, 90 + q) - .5) * 4.6, sy = y + (hash(x, y, 95 + q) - .5) * 4; D[q < 2 ? "sand" : "sand1"] += `M${r1(sx)} ${r1(sy)}h.45`; } return; }
      if (t < .32 && r < .07) D.grass1 += `M${r1(x - 1.6)} ${r1(y)}l.8-1.8l.8 1.8l.8-1.8l.8 1.8`;
    });
    const p = (d, a, cls) => d ? `<path${cls ? ` class="${cls}"` : ""} d="${d}" ${a}/>` : "";
    return p(D.sand, `stroke="${ink}" stroke-opacity=".45" stroke-width="1.05" stroke-linecap="round"`) + p(D.sand1, `stroke="${ink}" stroke-opacity=".38" stroke-width=".9" stroke-linecap="round"`, "lod1")
      + p(D.marsh, `fill="none" stroke="#4d5a3a" stroke-width=".6"`) + p(D.marsh1, `fill="none" stroke="#4d5a3a" stroke-width=".55"`, "lod1") + p(D.grass1, `fill="none" stroke="#6b6a3c" stroke-width=".45"`, "lod2")
      + p(D.hill, `fill="none" stroke="${ink}" stroke-width=".8" stroke-linecap="round"`) + p(D.hill1, `fill="none" stroke="${ink}" stroke-width=".7" stroke-linecap="round"`, "lod1")
      + p(D.trunk, `stroke="${ink}" stroke-width=".6"`) + p(D.broad, `fill="#bfc17f" stroke="${ink}" stroke-width=".55"`) + p(D.broad1, `fill="#c5c787" stroke="${ink}" stroke-width=".5"`, "lod1")
      + p(D.pine, `fill="#93a06a" stroke="${ink}" stroke-width=".55" stroke-linejoin="round"`) + p(D.pine1, `fill="#9aa672" stroke="${ink}" stroke-width=".5" stroke-linejoin="round"`, "lod1") + mtn;
  }
  // the open sea: waves, and a ship or two where it is widest
  function seaMarks(WD, pr, ink, o) {
    const [W, H] = WD.size; let w0 = "", w1 = ""; const deep = [];
    lattice(W, H, 34, 26, 51, (x, y, r, row) => {
      const h = pr.S(x, y); if (h > pr.sea - 14) return;
      if (h < pr.sea - 40) deep.push([x, y, h]);
      const d = `M${r1(x - 5)} ${r1(y)}q2.5-2.6 5 0t5 0`; if (r < .45) w0 += d; else if (r < .8) w1 += d;
    });
    let s = (w0 ? `<path d="${w0}" fill="none" stroke="${ink}" stroke-opacity=".42" stroke-width=".8" stroke-linecap="round"/>` : "") + (w1 ? `<path class="lod1" d="${w1}" fill="none" stroke="${ink}" stroke-opacity=".35" stroke-width=".7" stroke-linecap="round"/>` : "");
    deep.sort((a, b) => a[2] - b[2]);
    const ships = []; for (const p of deep) { if (ships.length >= 2) break; if (ships.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > W * .3) && Math.min(p[0], p[1], W - p[0], H - p[1]) > 60) ships.push(p); }
    for (const [x, y] of ships) s += `<g transform="translate(${r1(x)} ${r1(y)})" fill="#efe4c6" stroke="${ink}" stroke-width=".8" stroke-linejoin="round"><path d="M-11 2h22l-4 5h-14Z"/><path d="M-1 1V-14M-1-13l9 6-9 4M-1-12l-7 8h7" /><path d="M-14 9q3-2 6 0t6 0t6 0t6 0t6 0" fill="none" stroke-opacity=".6"/></g>`;
    return s;
  }

  /* ================================================================ the past: an engraved plate */
  function engraved(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, ink = "#262019", pr = probe(WD), sea = G.sea;
    const paper = hex("#f1e9d4"), wash = [hex("#e9e3c4"), hex("#e8d9b9"), hex("#e3cfb0")], seaP = hex("#e7e6d9");
    const img = raster(WD, (h, m, gx, gy, x, y, nz) => {
      const fib = (hash(x * 3 | 0, y * 3 | 0, 6) - .5) * .05, st = (nz(x * .005, y * .005) - .5) * .12;
      let c = h <= sea ? seaP : ramp([[0, wash[0]], [.5, wash[1]], [1, wash[2]]], (h - sea) / (255 - sea));
      if (h > sea) { const sh = clamp(shade(gx, gy, .03), .62, 1.12); c = c.map(v => v * sh); }
      return mix(c, paper, .25).map(v => v * (1 + fib + st));
    }, { detail: 6 });
    const cd = coastD(G, .7), coarse = coastD(G, 1.4);
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // water-lining: lines following the coast, closer together near it
    const offs = [2.2, 4.6, 7.2, 10, 13.2, 16.8, 21, 26]; for (let i = offs.length - 1; i >= 0; i--) s += `<path d="${coarse}" fill="none" stroke="${ink}" stroke-opacity="${r1(.55 - i * .05)}" stroke-width="${r1(offs[i] * 2 + .45)}"${i > 4 ? ` class="lod1"` : ""}/><path d="${coarse}" fill="none" stroke="url(#${uid}-b)" stroke-width="${r1(offs[i] * 2 - .45)}"${i > 4 ? ` class="lod1"` : ""}/>`;
    s += `<path d="${cd}" fill="url(#${uid}-b)" fill-rule="evenodd" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`;
    s += rivers(WD, ink, null, .8);
    // hachures: short strokes down each slope, closer and darker the steeper, darker still on the slopes away from the light
    const D = ["", "", ""], D1 = ["", "", ""];
    // (how steep is steep: this world's own slopes, so a gentle land is hachured as surely as a high one)
    const grad = (x, y) => { const gx = (pr.S(x + 2, y) - pr.S(x - 2, y)) / 4, gy = (pr.S(x, y + 2) - pr.S(x, y - 2)) / 4; return [gx, gy, Math.hypot(gx, gy)]; };
    const gs = []; lattice(W, H, 14, 12, 62, (x, y) => { if (pr.S(x, y) > sea + 1) gs.push(grad(x, y)[2]); }); gs.sort((a, b) => a - b);
    const g90 = Math.max(.2, gs[Math.floor(gs.length * .9)] || 1);
    lattice(W, H, 3.2, 2.8, 61, (x, y, r, row) => {
      const h = pr.S(x, y); if (h <= sea + 1) return;
      const [gx, gy, g0] = grad(x, y), g = g0 / g90 * 1.6; if (g < .45 || r > g * .7) return;
      const L = Math.min(6, 1.8 + g * 2.2), ux = gx / g0, uy = gy / g0, dark = (ux + uy) > 0 ? (g > 1.6 ? 2 : 1) : (g > 2.2 ? 1 : 0);
      const d = `M${r1(x)} ${r1(y)}l${r1(ux * L)} ${r1(uy * L)}`; if (row % 2 && g < 1.6) D1[dark] += d; else D[dark] += d;
    });
    for (let i = 0; i < 3; i++) { if (D[i]) s += `<path d="${D[i]}" stroke="${ink}" stroke-opacity="${[.5, .72, .9][i]}" stroke-width="${[.55, .7, .85][i]}" stroke-linecap="round"/>`; if (D1[i]) s += `<path class="lod1" d="${D1[i]}" stroke="${ink}" stroke-opacity="${[.32, .5, .7][i]}" stroke-width=".4" stroke-linecap="round"/>`; }
    // woods, as an engraver stipples them
    let wd = "", wd1 = "";
    lattice(W, H, 5, 4.4, 71, (x, y, r, row) => { const t = pr.t(x, y), m = pr.M(x, y); if (t <= .02 || t > .55 || m < 150 || r > (m - 150) / 105 * 1.5) return; const rr = 1.7 + hash(x, y, 72) * .7, d = `M${r1(x + rr)} ${r1(y)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-2 * rr)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(2 * rr)} 0M${r1(x + .4)} ${r1(y + .5)}h.45`; if (row % 2) wd1 += d; else wd += d; });
    if (wd) s += `<path d="${wd}" fill="none" stroke="${ink}" stroke-width=".45" stroke-opacity=".7"/>`; if (wd1) s += `<path class="lod1" d="${wd1}" fill="none" stroke="${ink}" stroke-width=".4" stroke-opacity=".6"/>`;
    s += frame(WD, ink, "engraved", o);
    return s;
  }

  /* ================================================================ modern: an atlas */
  function atlas(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, pr = probe(WD), sea = G.sea;
    const HYPS = [[0, hex("#a9cf8d")], [.12, hex("#c6dc9a")], [.28, hex("#e7e3a6")], [.45, hex("#e2c792")], [.62, hex("#c9a074")], [.8, hex("#a88a74")], [.92, hex("#e2ded8")], [1, hex("#fbfbfb")]];
    const DEEP = [[0, hex("#cfe6f3")], [.25, hex("#a9d1ea")], [.6, hex("#7fb2d8")], [1, hex("#5d93c2")]], forest = hex("#8fbf74");
    const img = raster(WD, (h, m, gx, gy) => {
      if (h <= sea) return ramp(DEEP, clamp((sea - h) / Math.max(1, sea) * 1.8, 0, 1));
      const t = (h - sea) / (255 - sea); let c = ramp(HYPS, t);
      if (m > 150 && t < .55) c = mix(c, forest, clamp((m - 150) / 105, 0, 1) * .55);
      const sh = clamp(shade(gx, gy, .045), .55, 1.25); return c.map(v => v * sh);
    }, { detail: 11 });
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // depth lines at sea
    for (const [lv, op, cls] of [[sea - 12, .5, ""], [sea - 32, .38, ""], [sea - 60, .3, "lod1"]]) if (lv > 2) { const d = ringsAt(G, lv, 1.4).map(r => pathD(r, true)).join(""); if (d) s += `<path${cls ? ` class="${cls}"` : ""} d="${d}" fill="none" stroke="#eaf5fb" stroke-opacity="${op}" stroke-width=".8"/>`; }
    const cd = coastD(G, .6);
    s += `<path d="${cd}" fill="url(#${uid}-b)" fill-rule="evenodd" stroke="#5f8db3" stroke-width=".8" stroke-linejoin="round"/>`;
    // height lines, faint, closer up
    for (let lv = sea + 40; lv < 250; lv += 40) { const d = ringsAt(G, lv, 1.2).map(r => pathD(r, true)).join(""); if (d) s += `<path class="lod1" d="${d}" fill="none" stroke="#7a5a3c" stroke-opacity=".28" stroke-width=".45"/>`; }
    s += rivers(WD, "#4f8fc6", null, 1);
    // built-up areas round the towns and cities the viewer may see
    let urb = "", urb1 = "";
    for (const L of WD.locs) {
      if (!Array.isArray(L.at) || (o.seen && !o.seen(L))) continue;
      const R = { capital: 17, city: 12.5, port: 9, town: 7.5, village: 3.6, base: 6, airport: 7, station: 5 }[L.kind]; if (!R) continue;
      const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, rr = R * (.72 + hash(i, L.at[0] | 0, L.at[1] | 0) * .5); pts.push([L.at[0] + Math.cos(a) * rr, L.at[1] + Math.sin(a) * rr * .85]); }
      urb += pathD(chaikin(pts, 2, true), true);
      if (R > 9) for (let q = 0; q < 3; q++) { const a = hash(q, L.at[0] | 0, 5) * Math.PI * 2, d = R * (1.2 + hash(q, 1, L.at[1] | 0) * .6), rr = R * .3; urb1 += `M${r1(L.at[0] + Math.cos(a) * d + rr)} ${r1(L.at[1] + Math.sin(a) * d)}a${r1(rr)} ${r1(rr * .8)} 0 1 0 ${r1(-2 * rr)} 0a${r1(rr)} ${r1(rr * .8)} 0 1 0 ${r1(2 * rr)} 0`; }
    }
    if (urb) s += `<path d="${urb}" fill="#ecd3c0" fill-opacity=".9" stroke="#c49a80" stroke-width=".6"/>`;
    if (urb1) s += `<path class="lod1" d="${urb1}" fill="#ecd3c0" fill-opacity=".8" stroke="#c49a80" stroke-width=".5"/>`;
    s += frame(WD, "#2b3440", "atlas", o);
    return s;
  }

  /* ================================================================ science fiction: a survey, and a star chart */
  function holo(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, sea = G.sea, alien = o.palette === "alien";
    const C = alien ? { bg: hex("#12061a"), lo: hex("#2a0f2e"), hi: hex("#7a2d5a"), line: "#ff9a5a", glow: "#ff6a3a", sea: hex("#0a0414") } : { bg: hex("#020d16"), lo: hex("#05242f"), hi: hex("#0f5a63"), line: "#5ae2f0", glow: "#2fd0e8", sea: hex("#010811") };
    const img = raster(WD, (h, m, gx, gy, x, y) => {
      if (h <= sea) { const scan = (Math.floor(y * 1.6) % 3 === 0) ? 1.25 : 1; return C.sea.map(v => v * scan); }
      const t = (h - sea) / (255 - sea), sh = clamp(shade(gx, gy, .03), .6, 1.4); return mix(C.lo, C.hi, Math.pow(t, .8)).map(v => v * sh);
    }, { detail: 8 });
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // contour lines, a brighter one every fourth
    let n = 0; for (let lv = sea + 14; lv < 252; lv += 14, n++) { const d = ringsAt(G, lv, 1.1).map(r => pathD(r, true)).join(""); if (!d) continue; const major = n % 4 === 3; s += `<path${major ? "" : ` class="lod1"`} d="${d}" fill="none" stroke="${C.line}" stroke-opacity="${major ? .55 : .26}" stroke-width="${major ? .7 : .45}"/>`; }
    const cd = coastD(G, .6);
    s += `<path d="${cd}" fill="none" stroke="${C.glow}" stroke-opacity=".22" stroke-width="5"/><path d="${cd}" fill="none" stroke="${C.line}" stroke-width="1.1"/>`;
    s += rivers(WD, C.line, null, .7).replace(/stroke="[^"]+"/g, `stroke="${C.line}" stroke-opacity=".7"`);
    s += grid(WD, C.line, true);
    s += frame(WD, C.line, "holo", o);
    return s;
  }
  function stars(WD, uid, o) {
    const [W, H] = WD.size, seed = WD.stars && WD.stars.seed || 7, n = Math.round(W * H / 700), COL = ["#dfe9ff", "#fff6dc", "#ffd9a8", "#b8d4ff", "#ffb3a0"];
    let s = `<rect width="${W}" height="${H}" fill="#04060c"/>`;
    if (WD.G) { const img = raster(WD, (h, m) => { const dens = clamp((m - 120) / 135, 0, 1), NEB = [hex("#3b1f5e"), hex("#123f4c"), hex("#4b1a33"), hex("#1d2f63")], hue = h / 256 * NEB.length, a = NEB[Math.floor(hue) % NEB.length], b = NEB[(Math.floor(hue) + 1) % NEB.length]; return mix([4, 6, 12], mix(a, b, hue % 1), dens * dens * .95); }, { max: 1400, detail: 0 }); s += `<image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/>`; }
    const by = COL.map(() => ""), by1 = COL.map(() => ""); let glow = "";
    for (let i = 0; i < n; i++) { const x = hash(i, 1, seed) * W, y = hash(i, 2, seed) * H, r = hash(i, 3, seed), c = Math.floor(hash(i, 4, seed) * COL.length); if (r > .985) glow += `<circle cx="${r1(x)}" cy="${r1(y)}" r="5" fill="url(#${uid}-g)"/><circle cx="${r1(x)}" cy="${r1(y)}" r="1.4" fill="${COL[c]}"/>`; else if (r > .5) by[c] += `M${r1(x)} ${r1(y)}h.45`; else by1[c] += `M${r1(x)} ${r1(y)}h.45`; }
    s += `<defs><radialGradient id="${uid}-g"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#9fd9ff" stop-opacity="0"/></radialGradient></defs>`;
    COL.forEach((c, i) => { if (by[i]) s += `<path d="${by[i]}" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-opacity=".9" vector-effect="non-scaling-stroke"/>`; if (by1[i]) s += `<path class="lod1" d="${by1[i]}" stroke="${c}" stroke-width="1.3" stroke-linecap="round" stroke-opacity=".75" vector-effect="non-scaling-stroke"/>`; });
    s += glow + grid(WD, "#5ad1e6", true) + frame(WD, "#5ad1e6", "holo", o);
    return s;
  }
  // a lettered grid (A1, B2...) with ticks along the edges
  function grid(WD, col, lettered) {
    const [W, H] = WD.size, step = Math.max(50, Math.round(Math.min(W, H) / 8 / 10) * 10); let d = "", t = "";
    for (let x = step, i = 0; x < W; x += step, i++) { d += `M${x} 0V${H}`; if (lettered) t += `<text x="${x - step / 2}" y="20" text-anchor="middle">${String.fromCharCode(65 + (i % 26))}</text>`; }
    for (let y = step, j = 1; y < H; y += step, j++) { d += `M0 ${y}H${W}`; if (lettered) t += `<text x="14" y="${y - step / 2 + 4}" text-anchor="middle">${j}</text>`; }
    let fine = ""; for (let x = step / 2; x < W; x += step) fine += `M${x} 0V${H}`; for (let y = step / 2; y < H; y += step) fine += `M0 ${y}H${W}`;
    return `<path d="${d}" stroke="${col}" stroke-opacity=".14" stroke-width=".8"/><path class="lod1" d="${fine}" stroke="${col}" stroke-opacity=".07" stroke-width=".6"/><g class="wm-gl" fill="${col}" fill-opacity=".55" font-size="11">${t}</g>`;
  }

  /* ---- frames, compasses and titles: each look its own */
  function frame(WD, ink, look, o) {
    const [W, H] = WD.size, title = WD.title || "", pr = WD.G ? probe(WD) : null;
    if (look === "parchment") {
      const c = pr ? seaCorner(WD, pr) : [.87, .83], cx = W * c[0], cy = H * c[1], R = Math.min(W, H) * .085;
      let s = `<g class="wm-deco">` + rose(cx, cy, R, ink, "#efe4c6", "#8a2432");
      if (title) { const w = Math.min(W * .34, 60 + title.length * 10.5), [x, y] = cartoucheAt(WD, pr, w, 30, [cx, cy, R * 1.2]); s += cartouche(x, y, w, title, ink); }
      return s + `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="${ink}" stroke-width="5" stroke-dasharray="24 24"/><rect x="2.5" y="2.5" width="${W - 5}" height="${H - 5}" fill="none" stroke="${ink}" stroke-width="1.4"/><rect x="8.5" y="8.5" width="${W - 17}" height="${H - 17}" fill="none" stroke="${ink}" stroke-width="1"/></g>`;
    }
    if (look === "engraved") {
      let ticks = ""; const step = 25; for (let x = 0; x < W; x += step) ticks += `<rect x="${x}" y="4" width="${step}" height="4" fill="${(x / step) % 2 ? "#f1e9d4" : ink}"/><rect x="${x}" y="${H - 8}" width="${step}" height="4" fill="${(x / step) % 2 ? "#f1e9d4" : ink}"/>`; for (let y = 0; y < H; y += step) ticks += `<rect x="4" y="${y}" width="4" height="${step}" fill="${(y / step) % 2 ? "#f1e9d4" : ink}"/><rect x="${W - 8}" y="${y}" width="4" height="${step}" fill="${(y / step) % 2 ? "#f1e9d4" : ink}"/>`;
      const c = pr ? seaCorner(WD, pr) : [.87, .83], cx = W * c[0], cy = H * c[1];
      return `<g class="wm-deco">${ticks}<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${ink}" stroke-width=".8"/><rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="${ink}" stroke-width="1.4"/>${northArrow(cx, cy, Math.min(W, H) * .06, ink)}${title ? `<text class="wm-ttl" x="${W / 2}" y="${36}" text-anchor="middle" fill="${ink}">${A.esc ? A.esc(title.toUpperCase()) : title}</text>` : ""}</g>`;
    }
    if (look === "atlas") {
      const c = pr ? seaCorner(WD, pr) : [.87, .83];
      return `<g class="wm-deco">${grid(WD, "#3d5a73", false)}<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${ink}" stroke-width="1.2"/>${northArrow(W * c[0], H * c[1], Math.min(W, H) * .045, ink, true)}</g>`;
    }
    // the survey's frame: corner brackets, ticks, and readouts
    const L = Math.min(W, H) * .06; let ticks = ""; for (let x = 0; x <= W; x += 20) ticks += `M${x} 0v${x % 100 ? 4 : 9}M${x} ${H}v${x % 100 ? -4 : -9}`; for (let y = 0; y <= H; y += 20) ticks += `M0 ${y}h${y % 100 ? 4 : 9}M${W} ${y}h${y % 100 ? -4 : -9}`;
    return `<g class="wm-deco wm-hud" fill="none" stroke="${ink}"><path d="${ticks}" stroke-opacity=".55" stroke-width=".8"/><path d="M6 ${6 + L}V6h${L}M${W - 6 - L} 6H${W - 6}v${L}M${W - 6} ${H - 6 - L}V${H - 6}h${-L}M${6 + L} ${H - 6}H6v${-L}" stroke-width="2"/><text x="${W - 14}" y="${H - 14}" text-anchor="end" fill="${ink}" stroke="none" font-size="11" fill-opacity=".7">${A.esc ? A.esc((title || "SURVEY").toUpperCase()) : title} · ${W}×${H}</text></g>`;
  }
  // a compass rose of sixteen points, its north marked
  function rose(cx, cy, R, ink, paper, red) {
    let s = `<g transform="translate(${r1(cx)} ${r1(cy)})"><circle r="${r1(R * 1.02)}" fill="none" stroke="${ink}" stroke-width=".9"/><circle r="${r1(R * .9)}" fill="none" stroke="${ink}" stroke-width=".5"/>`;
    let ticks = ""; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, l = i % 4 ? R * .05 : R * .1; ticks += `M${r1(Math.sin(a) * R * .9)} ${r1(-Math.cos(a) * R * .9)}L${r1(Math.sin(a) * (R * .9 + l))} ${r1(-Math.cos(a) * (R * .9 + l))}`; }
    s += `<path d="${ticks}" stroke="${ink}" stroke-width=".55"/>`;
    const pt = (a, len, w, first) => { const ca = Math.cos(a), sa = Math.sin(a), tip = [sa * len, -ca * len], l = [Math.sin(a - Math.PI / 2) * w, -Math.cos(a - Math.PI / 2) * w], r = [Math.sin(a + Math.PI / 2) * w, -Math.cos(a + Math.PI / 2) * w]; return `<path d="M0 0L${r1(l[0])} ${r1(l[1])}L${r1(tip[0])} ${r1(tip[1])}Z" fill="${first ? red : ink}" stroke="${ink}" stroke-width=".5"/><path d="M0 0L${r1(r[0])} ${r1(r[1])}L${r1(tip[0])} ${r1(tip[1])}Z" fill="${paper}" stroke="${ink}" stroke-width=".5"/>`; };
    for (let i = 0; i < 16; i += 2) if (i % 4 === 2) s += pt(i / 16 * Math.PI * 2, R * .62, R * .09);
    for (let i = 1; i < 16; i += 2) s += pt(i / 16 * Math.PI * 2, R * .42, R * .05);
    for (let i = 0; i < 16; i += 4) s += pt(i / 16 * Math.PI * 2, R * .98, R * .13, i === 0);
    s += `<circle r="${r1(R * .06)}" fill="${paper}" stroke="${ink}" stroke-width=".6"/><text y="${r1(-R * 1.1)}" text-anchor="middle" font-size="${r1(R * .3)}" fill="${ink}" class="wm-roseN">N</text></g>`;
    return s;
  }
  function northArrow(cx, cy, R, ink, plain) {
    return `<g transform="translate(${r1(cx)} ${r1(cy)})"><path d="M0 ${r1(-R)}L${r1(R * .32)} ${r1(R * .5)}L0 ${r1(R * .22)}Z" fill="${ink}"/><path d="M0 ${r1(-R)}L${r1(-R * .32)} ${r1(R * .5)}L0 ${r1(R * .22)}Z" fill="${plain ? "#fff" : "#f1e9d4"}" stroke="${ink}" stroke-width=".6"/><text y="${r1(-R * 1.15)}" text-anchor="middle" font-size="${r1(R * .45)}" fill="${ink}" class="wm-roseN">N</text></g>`;
  }
  // where the title goes: along the top or the foot, at a corner or the middle, over the most sea and none of the places,
  // names or the compass
  function cartoucheAt(WD, pr, w, h, avoid) {
    const [W, H] = WD.size, m = 22, xs = [m + 12, (W - w) / 2, W - m - 12 - w], ys = [m, H - m - h];
    const things = (WD.locs || []).filter(l => Array.isArray(l.at)).map(l => l.at).concat((WD.labels || []).filter(l => Array.isArray(l.at)).map(l => l.at));
    let best = [xs[0], ys[0]], bv = -1e9;
    for (const y of ys) for (const x of xs) {
      let n = 0; for (let i = 0; i <= 6; i++) for (let j = 0; j <= 2; j++) if (!pr || pr.S(x + w * i / 6, y + h * j / 2) <= pr.sea) n++;
      for (const [a, b] of things) if (a > x - 40 && a < x + w + 40 && b > y - 24 && b < y + h + 24) n -= 12;
      if (avoid && avoid[0] > x - avoid[2] && avoid[0] < x + w + avoid[2] && avoid[1] > y - avoid[2] && avoid[1] < y + h + avoid[2]) n -= 30;
      if (n > bv) { bv = n; best = [x, y]; }
    }
    return best;
  }
  // a title on a ribbon with curled ends
  function cartouche(x, y, w, title, ink) {
    const h = 30, c = 12;
    return `<g class="wm-cart"><path d="M${r1(x - c)} ${r1(y + 6)}l${c} -6v${h}l${-c} 6l${c * .45} ${-h / 2 - 3}Z" fill="#dcc99c" stroke="${ink}" stroke-width=".8" stroke-linejoin="round"/><path d="M${r1(x + w + c)} ${r1(y + 6)}l${-c} -6v${h}l${c} 6l${-c * .45} ${-h / 2 - 3}Z" fill="#dcc99c" stroke="${ink}" stroke-width=".8" stroke-linejoin="round"/><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${h}" fill="#efe4c6" stroke="${ink}" stroke-width="1"/><rect x="${r1(x + 3)}" y="${r1(y + 3)}" width="${r1(w - 6)}" height="${h - 6}" fill="none" stroke="${ink}" stroke-width=".5"/><text x="${r1(x + w / 2)}" y="${r1(y + h / 2 + 6)}" text-anchor="middle" class="wm-ttl" fill="${ink}">${A.esc ? A.esc(title) : title}</text></g>`;
  }

  // the land of a world in a look: an SVG fragment in the map's own units (o: { seen(L), palette })
  function draw(WD, look, uid, o) {
    o = o || {};
    if (look === "stars" || !WD.G) return stars(WD, uid, o);
    return ({ parchment, engraved, atlas, holo })[look](WD, uid, o);
  }
  A.worldArt = { LOOKS, looksFor, draw };
})(ATLAS);
