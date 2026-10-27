/* The world map's art (the user asked, 27 Oct 2026, for world maps that look professionally drawn, in a style fitting
   the campaign: Fantasy, Modern and Sci-Fi, and the past, chosen from the setting and changeable by the game master).
   atlas-world.js keeps everything the map does (its places, roads, journeys, editing, the doors into the 3D cities);
   this file only draws the land under them, each look by its own hand:
   - painted (fantasy, the default since 27 Oct 2026): a map painted in colour, forests tree by tree, shaded ranges,
     farmland round the towns, a glowing coast, ships, an eight-pointed compass;
   - parchment (fantasy): an inked coast with lines echoing it out to sea, ranges of hatched mountains, foothills, woods
     of broadleaf and pine, marsh, sand, waves and ships, a compass rose, a chequered frame and a title cartouche;
   - engraved (the past): an atlas plate of the 1800s: hachured slopes, water-lining, a graduated border, a north arrow;
   - atlas (the modern world): shaded relief in height colours, sea depths and depth lines, towns as built-up areas, a
     grid of coordinates;
   - holo (science fiction, a planet): a survey display: glowing contours, a lettered grid, a frame of readouts;
   - stars (a star chart): stars of many colours, nebulae, a grid, the same frame.
   What stands on the land (forests of every kind, the marks of the ground, volcanoes, mesas, craters, floating
   mountains, the rivers' deltas and falls) and the colours of each kind of land come from atlas-world-nature.js and
   atlas-world-biomes.js (27 Oct 2026, the user's request for far more terrain); this file decides how each look uses them.
   The land is painted at up to 2400 pixels across (it was 500), and drawn things that would crowd the whole map come in
   only as it is brought closer (classes lod1 and lod2: atlas-world.js marks the zoom on the map, the page hides them). */
(function (A) {
  "use strict";
  const K = A.worldDraw; if (!K) return;
  // the land's nature (atlas-world-nature.js): absent in an old page, in which case the land is drawn as it was
  const NT = A.worldNature, BIO = A.worldBiomes, nat = WD => NT && BIO && WD.G ? NT.prep(WD) : null;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // the land's colour with each laid-down kind near the point washed over it, as strongly as it shows there (water:
  // the kinds that lie on water, or those on land)
  const washed = (look, c, I, x, y, nz, t, water, k) => { if (!I.mix) return c; for (const [q, a] of I.mix) { const b = BIO.BY[BIO.LIST[q][0]]; if (!!b.water !== water) continue; const g = NT.ground(look, b, x, y, I.d, nz, t); if (g) c = mix(c, g, a * (look === "painted" ? (NT.TINT[b.id] == null ? .5 : NT.TINT[b.id]) : k)); } return c; };
  const { sampler, coastRings, chaikin, rdpRing, pathD, hash, ramp, mix, hex, clamp, vnoise } = K;
  const r1 = v => Math.round(v * 10) / 10;
  const LOOKS = [["relief", "Shaded relief"], ["painted", "Fantasy: a painted map"], ["parchment", "Fantasy: parchment"], ["engraved", "The past: an engraved atlas"], ["atlas", "Modern: an atlas"], ["holo", "Science fiction: a survey"], ["stars", "Science fiction: a star chart"]];
  // the looks a world may wear: a world with land may wear any but the star chart; a star chart only that
  const looksFor = WD => WD.G && !WD.stars && WD.look !== "stars" ? LOOKS.filter(l => l[0] !== "stars") : LOOKS.filter(l => l[0] === "stars");

  /* ---- painting the land and sea: heights on a grid as fine as the picture, light from the north-west */
  function raster(WD, colour, opts) {
    opts = opts || {};
    const [W, H] = WD.size, G = WD.G, S = sampler(G), sea = G.sea, k = Math.min(2, (opts.max || 2000) / Math.max(W, H));
    const cw = Math.round(W * k), ch = Math.round(H * k), N = cw * ch, hv = new Float32Array(N), mv = new Float32Array(N);
    const nz = vnoise(Math.floor(hash(W, H, 11) * 1e9)), detail = opts.detail == null ? 9 : opts.detail, wf = wetOf(WD);
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      const x = (px + .5) / k, y = (py + .5) / k, h = S(x, y), i = py * cw + px;
      // fine relief the grid is too coarse to hold, on land only, more on the heights
      hv[i] = h > sea ? h + (nz(x * .09, y * .09) - .5) * detail * (.4 + (h - sea) / (256 - sea)) : h;
      mv[i] = (G.M ? S(x, y, G.M) : 128) * wf;
    }
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    const cx = cv.getContext("2d"), img = cx.createImageData(cw, ch), d = img.data, z = (WD.T && WD.T.real ? .55 : 1) * k;
    // what the colour is told of the land at each point: its laid-down kind (b) and how deep inside it (d), how warm it
    // is (tm), whether it is a lake, and the kind of its mountains (mk)
    const NA = nat(WD), I = { b: null, d: 0, tm: .5, lake: false, mk: "rock", N: NA, mix: null };
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      const i = py * cw + px, l = px > 0 ? hv[i - 1] : hv[i], r = px < cw - 1 ? hv[i + 1] : hv[i], u = py > 0 ? hv[i - cw] : hv[i], b = py < ch - 1 ? hv[i + cw] : hv[i];
      const gx = (r - l) * z, gy = (b - u) * z, x = (px + .5) / k, y = (py + .5) / k;
      // (mix: each laid-down kind near the point and how strongly it shows there, its edge soft and broken; b: the one
      // that holds the point, if one does)
      if (NA) { const bl = NA.blend(x, y); let cc = 0, ca = .5; if (bl) for (const [q, a] of bl) if (a > ca) { ca = a; cc = q; } I.mix = bl; I.b = cc ? BIO.BY[BIO.LIST[cc][0]] : null; I.d = bl ? NA.depth(x, y) : 0; I.tm = NA.temp(x, y); I.lake = hv[i] <= sea && NA.lake(x, y); I.mk = hv[i] > sea + 40 ? NT.mtnKind(NA, x, y) : "rock"; }
      const c = colour(hv[i], mv[i], gx, gy, x, y, nz, I), o = i * 4;
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
  // (how wet the land is, as its climate makes it: an arid world's land is drier than its grid says, a wet one wetter;
  // a temperate world's exactly as it always was)
  const wetOf = WD => BIO && WD.G && !(WD.T && WD.T.rain) ? BIO.CLIMATES[BIO.climateOf((WD.W && WD.W.climate) || (WD.T && WD.T.climate))][2] : 1;
  const probe = WD => { const S = sampler(WD.G), sea = WD.G.sea, wf = wetOf(WD); return { S, sea, t: (x, y) => (S(x, y) - sea) / (255 - sea), M: (x, y) => (WD.G.M ? S(x, y, WD.G.M) : 128) * wf }; };
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

  /* ================================================================ shaded relief (the default since 27 Oct 2026)
     The user: "instead of the mountains and stuff do the shaded relief map, it looks way better; if a forest is more
     dense just make it more green". The land lit as if by a low sun from the north-west, in the colours of what covers
     it (Tom Patterson's natural-colour relief is the model): dense forest deep green, open woodland and grassland paler,
     dry land tan, tundra grey-green, bare rock brown-grey, snow and ice white; the sea lighter over the shelf and deep
     blue beyond; rivers and lakes in blue. No drawn mountains or trees: the relief and the colour say it all. */
  function relief(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, pr = probe(WD), sea = G.sea, N = nat(WD);
    const C = { dry: hex("#ddc99c"), dryCool: hex("#cfc6a2"), grass: hex("#bfcd91"), wood: hex("#86a965"), forest: hex("#5d8a4b"), dense: hex("#3f6f38"), jungle: hex("#356a33"),
      tundra: hex("#b8bca6"), rock: hex("#b3a690"), rockHi: hex("#d2c9ba"), snow: hex("#f7f8f8"), marsh: hex("#8fa486"), beach: hex("#e3d6b0"), shelf: hex("#a7cde0"), mid: hex("#6f9fc2"), deep: hex("#3d6b92"), lake: hex("#8db7d0") };
    // (light from the north-west, the slopes exaggerated a little as relief maps are, a soft fill from the north)
    const ex = 5.5 * Math.min(2, Math.max(.6, 1400 / Math.max(W, H)));
    // (the user, 27 Oct 2026, after a softer natural-colour try: "the ones before were better": colour by height, from
    // green lowland through pale upland to white peaks, under a strong light, as the plain relief previews were; and
    // where a forest is denser, the land greener)
    const NA = nat(WD), simB = NA && WD.G.B ? WD.G.B : null, DES = BIO ? BIO.CODE.desert : -1, SWP = BIO ? BIO.CODE.swamp : -1;
    // (where the ecology says desert, the land's own share of it, and of swamp, eased across the cells)
    const share = code => { if (!simB) return null; const G = WD.G, F = new Float32Array(G.cols * G.rows); for (let n = 0; n < F.length; n++) F[n] = simB[n] === code ? 1 : 0; const t = new Float32Array(F.length); for (let p = 0; p < 2; p++) { for (let j = 0; j < G.rows; j++) for (let i = 0; i < G.cols; i++) { let s = 0, c = 0; for (let k = -1; k <= 1; k++) { const a = i + k; if (a >= 0 && a < G.cols) { s += F[j * G.cols + a]; c++; } } t[j * G.cols + i] = s / c; } for (let j = 0; j < G.rows; j++) for (let i = 0; i < G.cols; i++) { let s = 0, c = 0; for (let k = -1; k <= 1; k++) { const b = j + k; if (b >= 0 && b < G.rows) { s += t[b * G.cols + i]; c++; } } F[j * G.cols + i] = s / c; } } return (x, y) => NA.S(x, y, F); };
    const desAt = share(DES), swpAt = share(SWP), snwAt = BIO ? share(BIO.CODE.snow) : null;
    const img = raster(WD, (h, m, gx, gy, x, y, nz, I) => {
      if (h <= sea) {
        const d = clamp((sea - h) / 128, 0, 1);
        let c = I.lake ? [40, 112, 178] : [30, 60 + 60 * (1 - d), 110 + 80 * (1 - d)];
        if (I.mix) c = washed("painted", c, I, x, y, nz, 0, true);
        return c;
      }
      const t = (h - sea) / (255 - sea), wet = m / 255, tm = I.tm;
      // the two rules (the user, 27 Oct 2026): the taller the land, the whiter, to white at the highest peaks; the denser
      // a forest, the greener (from the pale green of open land to the deep green of the thickest woods). A simulated
      // world's tree cover is its own (world-ecology.js); otherwise it is guessed from the wetness
      const fd = NA && NA.canopy ? NA.canopy(x, y) : clamp((wet - .38) / .4, 0, 1) * (1 - smooth(.4, .65, t)) * smooth(.1, .3, tm);
      let c = mix([150, 175, 108], [38, 98, 42], fd);
      // the third rule: the drier the land, the sandier: tan at a desert's edge to warm sand at its driest in the heat,
      // grey-beige steppe where the dry land is cold
      const dd = desAt ? desAt(x, y) * (1 - fd) : smooth(.34, .06, wet) * (1 - fd);
      if (dd > 0) c = mix(c, tm > .42 ? mix([214, 196, 146], [222, 168, 98], smooth(.4, .9, dd)) : [200, 192, 160], dd * .9);
      c = mix(c, [176, 168, 150], smooth(.2, .5, t) * .55);
      c = mix(c, [250, 250, 250], smooth(.42, .92, t));
      // snow and ice where it never melts
      if (snwAt) { const w = snwAt(x, y); if (w > .02) c = mix(c, [246, 248, 250], w * .9); }
      // swamp: a dark olive green, wet and low
      if (swpAt) { const w = swpAt(x, y); if (w > .02) c = mix(c, [88, 112, 76], w * .7); }
      if (I.mix) c = washed("painted", c, Object.assign({}, I, { mix: I.mix.filter(([q]) => !["glacier", "icesheet", "snowforest", "snow"].includes(BIO.LIST[q][0])) }), x, y, nz, t, false);
      if ((I.b && (I.b.id === "glacier" || I.b.id === "snow")) || (tm < .08 && t > .3)) c = mix(c, [245, 246, 248], .8);
      const sh = clamp(1 - (gx + gy) * .24, .35, 1.5);
      return c.map(v => v * sh);
    }, { detail: 0, max: 2600 });
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    const cd = coastD(G, .6);
    s += `<path d="${cd}" fill="none" stroke="#f4f8fa" stroke-opacity=".45" stroke-width="3"/><path d="${cd}" fill="url(#${uid}-b)" fill-rule="evenodd" stroke="#4f6f86" stroke-opacity=".75" stroke-width=".6" stroke-linejoin="round"/>`;
    s += N ? NT.rivers(WD, "relief", N, pr, "#2c5fc6", null, 1.25) : rivers(WD, "#2c5fc6", null, 1.25);
    const c = seaCorner(WD, pr);
    s += `<g class="wm-deco"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#2b2a24" stroke-width="1.4"/>${northArrow(W * c[0], H * c[1], Math.min(W, H) * .045, "#2b2a24", true)}${WD.title ? `<text class="wm-ttl" x="${W / 2}" y="34" text-anchor="middle" fill="#2b2a24">${A.esc ? A.esc(WD.title) : WD.title}</text>` : ""}</g>`;
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

  /* ================================================================ fantasy: a painted map */
  // (the user asked, 27 Oct 2026, for fantasy maps "way more detailed", showing maps painted in colour: green lowland,
  // ochre and orange dry land, forests drawn tree by tree, ranges of shaded brown mountains capped with snow, a deep
  // blue-green sea with a pale glow and ripples along every coast, farmland round the towns, ships at sea)
  function painted(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, pr = probe(WD), sea = G.sea, ink = "#2a2016";
    const SEA = [[0, hex("#5f8f99")], [.1, hex("#457383")], [.32, hex("#376172")], [.65, hex("#2e5468")], [1, hex("#27475b")]], GLOW = hex("#c9dedb");
    const C = { desert: hex("#d08a42"), dry: hex("#bba75e"), grass: hex("#98a350"), lush: hex("#76903f"), floor: hex("#4b682e"), swamp: hex("#5a6a42"), beach: hex("#cdb67d"), rock: hex("#8f7356"), high: hex("#a68d70"), snow: hex("#eef0ec"),
      tundra: hex("#a3a88e"), savanna: hex("#c9ad58"), jungle: hex("#3f6e26"), lake: hex("#4f8ea0"), ice: hex("#e4eef2") };
    // how far each stretch of sea is from land: the pale glow along the coasts
    const { cols, rows, cell } = G, N = cols * rows, dL = new Float32Array(N).fill(1e9), q = [];
    for (let n = 0; n < N; n++) if (G.H[n] > sea) { dL[n] = 0; q.push(n); }
    for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && dL[m] > dL[n] + 1) { dL[m] = dL[n] + 1; q.push(m); } }
    for (let n = 0; n < N; n++) dL[n] = Math.min(dL[n], 60);
    const S = sampler(G), nz2 = vnoise(Math.floor(hash(W, H, 29) * 1e9)), fz = vnoise(Math.floor(hash(W, H, 31) * 1e9));
    // where the woods are: the wetter lowland, gathered into clumps (the same in the paint and in the trees)
    const forest = (x, y, m, t) => t <= .012 || t > .52 ? 0 : clamp((m - 116) / 46 + (fz(x * .022, y * .022) - .5) * 1.5 - (t > .4 ? (t - .4) * 4 : 0), 0, 1);
    const img = raster(WD, (h, m, gx, gy, x, y, nz, I) => {
      const grain = (hash(x * 4 | 0, y * 4 | 0, 7) - .5) * .05, mot = (nz2(x * .03, y * .03) - .5) * .15 + (nz(x * .13, y * .13) - .5) * .08;
      if (h <= sea) {
        const dp = clamp((sea - h) / Math.max(1, sea) * 2.4, 0, 1), d = S(x, y, dL) * cell, glow = Math.exp(-d / 9) * .62 + Math.exp(-d / 26) * .16;
        let c = mix(ramp(SEA, dp), GLOW, glow);
        // a lake is lighter and greener than the sea; frozen water white; a laid-down water (a glowing lake, lava, a
        // methane sea) its own
        if (I.lake) c = mix(c, C.lake, .4);
        if (I.mix) c = washed("painted", c, I, x, y, nz, 0, true);
        if (!(I.b && I.b.water) && I.tm < .08) c = mix(c, C.ice, smooth(.08, .02, I.tm) * (.55 + nz(x * .08, y * .08) * .45));
        return c.map(v => v * (1 + mot * .6 + grain));
      }
      const t = (h - sea) / (255 - sea);
      let c = m < 48 ? mix(C.desert, C.dry, m / 48) : m < 92 ? mix(C.dry, C.grass, (m - 48) / 44) : mix(C.grass, C.lush, clamp((m - 92) / 80, 0, 1));
      if (m > 212 && t < .15) c = mix(c, C.swamp, clamp((m - 212) / 30, 0, 1));
      const fo = forest(x, y, m, t); if (fo > 0) c = mix(c, C.floor, Math.min(.8, fo * 1.1));
      // (the colour wanders a little, as a painter's would)
      const hv = nz2(x * .011 + 40, y * .011); c = mix(c, hv > .5 ? C.lush : C.dry, Math.abs(hv - .5) * .3);
      // the climate: the cold greys the land to tundra and snow, the dry heat yellows it to savanna, the wet heat
      // deepens it to jungle (a temperate world, as every world was before there were climates, is left as it was)
      if (I.tm < .3) c = mix(c, C.tundra, smooth(.3, .12, I.tm) * .7);
      if (I.tm < .12) c = mix(c, C.snow, smooth(.12, .03, I.tm) * .75);
      if (I.tm > .64) c = mix(c, m < 140 ? C.savanna : C.jungle, smooth(.64, .86, I.tm) * .5);
      if (t < .025 && m < 200) c = mix(c, C.beach, (1 - t / .025) * .55);
      // a laid-down kind of land, fading in across its edge
      if (I.mix) c = washed("painted", c, I, x, y, nz, t, false);
      const RK = NT ? NT.ROCK[I.mk] || NT.ROCK.rock : [C.rock, C.high], bare = I.b && ["canyon", "mesas", "badlands", "glacier", "volcano", "volcanic", "crater"].includes(I.b.id) ? .35 : 1;
      if (t > .42) c = mix(c, RK[0], clamp((t - .42) * 3, 0, 1) * bare);
      if (t > .7) c = mix(c, RK[1], clamp((t - .7) * 4, 0, 1) * bare);
      if (t > .9) c = mix(c, C.snow, clamp((t - .9) * 5, 0, .6));
      if (t > .4 && I.tm < .22) c = mix(c, C.snow, smooth(.22, .06, I.tm) * .6);
      const sh = clamp(shade(gx, gy, .04), .6, 1.3);
      return c.map(v => v * sh * (1 + mot + grain));
    }, { detail: 10 });
    const cd = coastD(G, .6), coarse = coastD(G, 1.3);
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // ripples along the coast, fainter further out
    for (const [w, op] of [[34, .16], [24, .24], [15, .34], [7.6, .48]]) s += `<path d="${coarse}" fill="none" stroke="#e2efec" stroke-opacity="${op}" stroke-width="${r1(w + .8)}"/><path d="${coarse}" fill="none" stroke="url(#${uid}-b)" stroke-width="${r1(w - .8)}"/>`;
    s += `<path d="${cd}" fill="url(#${uid}-b)" fill-rule="evenodd" stroke="#33281c" stroke-width="1.15" stroke-linejoin="round"/>`;
    s += NT ? NT.rivers(WD, "painted", nat(WD), pr, "#4d8098", "#2b3a33", 1.15) : rivers(WD, "#4d8098", "#2b3a33", 1.15);
    s += paintedSymbols(WD, pr, o, forest, uid);
    s += paintedSea(WD, pr);
    s += frame(WD, ink, "painted", o);
    return s;
  }
  function paintedSymbols(WD, pr, o, forest, uid) {
    const [W, H] = WD.size;
    // where a mountain or a hill stands, trees and fields keep off (a grid of 4 units)
    const occ = new Set(), mark = (x, y, w, h) => { for (let a = Math.floor((x - w) / 4); a <= Math.floor((x + w) / 4); a++) for (let b = Math.floor((y - h) / 4); b <= Math.floor(y / 4); b++) occ.add(a + "," + b); }, free = (x, y) => !occ.has(Math.floor(x / 4) + "," + Math.floor(y / 4));
    const taken = [], near = (x, y, r) => taken.some(([a, b, rr]) => Math.abs(a - x) < (r + rr) * .6 && Math.abs(b - y) < (r + rr) * .34);
    // mountains, drawn by hand (the user, 27 Oct 2026: "draw them instead of using geometric shapes"): a few mountains
    // drawn once as an illustrator would (a single peak with a shoulder, twin peaks, a broad massif, a spire), each with
    // its crags, its lit and shaded faces shaded from the summit down, the pen's strokes down the slopes, a spur, a
    // shadow at the foot, and a snowy version; set down across the ranges at many sizes, nearest last
    const MT = [
      { sil: [[-1, 0], [-.8, -.17], [-.64, -.34], [-.52, -.4], [-.4, -.58], [-.24, -.82], [-.07, -1.12], [.05, -1], [.17, -.88], [.29, -.71], [.42, -.6], [.57, -.43], [.76, -.22], [1, 0]], peak: 6,
        cr: [[[-.07, -1.12], [-.01, -.88], [-.06, -.68], [.04, -.46], [.01, -.24], [.12, 0]]], spur: [[-.52, -.4], [-.36, -.24], [-.34, 0]],
        dk: [[-.01, -.86, .12, -.76], [-.04, -.7, .16, -.58], [.03, -.5, .24, -.4], [.02, -.32, .3, -.22], [.06, -.16, .4, -.08], [.22, -.8, .28, -.7]], lt: [[-.22, -.78, -.3, -.64], [-.42, -.52, -.48, -.4], [-.66, -.28, -.72, -.18]],
        snow: [[[-.07, -1.12], [-.24, -.82], [-.17, -.84], [-.14, -.74], [-.08, -.8], [-.02, -.72], [-.01, -.88]], [[-.07, -1.12], [-.01, -.88], [.04, -.8], [.08, -.88], [.13, -.84], [.17, -.88], [.05, -1]]] },
      { sil: [[-1, 0], [-.74, -.28], [-.56, -.5], [-.4, -.7], [-.28, -.86], [-.17, -1.04], [-.08, -.9], [.02, -.76], [.12, -.8], [.22, -.9], [.31, -.95], [.4, -.82], [.52, -.66], [.66, -.46], [.82, -.24], [1, 0]], peak: 5, peak2: 10,
        cr: [[[-.17, -1.04], [-.12, -.82], [-.17, -.6], [-.09, -.38], [-.13, -.16], [-.06, 0]], [[.31, -.95], [.36, -.74], [.32, -.52], [.4, -.3], [.37, 0]]], spur: [[-.4, -.7], [-.3, -.46], [-.34, -.2]],
        dk: [[-.12, -.82, -.02, -.72], [-.15, -.6, 0, -.52], [-.09, -.4, .08, -.34], [-.12, -.2, .06, -.14], [.36, -.74, .5, -.62], [.33, -.54, .54, -.42], [.4, -.32, .64, -.22], [.38, -.12, .7, -.06]], lt: [[-.32, -.8, -.4, -.66], [-.5, -.56, -.58, -.44], [.18, -.84, .14, -.72], [-.7, -.26, -.76, -.16]],
        snow: [[[-.17, -1.04], [-.3, -.84], [-.24, -.86], [-.2, -.78], [-.15, -.84], [-.12, -.82]], [[-.17, -1.04], [-.12, -.82], [-.08, -.86], [-.04, -.82], [-.08, -.9]], [[.31, -.95], [.24, -.88], [.29, -.86], [.33, -.82], [.36, -.74]], [[.31, -.95], [.36, -.74], [.4, -.8], [.44, -.78], [.4, -.82]]] },
      { sil: [[-1, 0], [-.82, -.2], [-.66, -.42], [-.5, -.56], [-.36, -.66], [-.22, -.78], [-.1, -.86], [.02, -.84], [.12, -.88], [.22, -.8], [.36, -.66], [.52, -.5], [.7, -.32], [.86, -.16], [1, 0]], peak: 8,
        cr: [[[.12, -.88], [.1, -.66], [.18, -.46], [.12, -.26], [.2, 0]]], spur: [[-.36, -.66], [-.3, -.5], [-.38, -.36], [-.34, -.16]], spur2: [[-.1, -.86], [-.06, -.72], [-.14, -.6]],
        dk: [[.1, -.66, .28, -.58], [.16, -.48, .4, -.4], [.13, -.3, .48, -.2], [.18, -.12, .6, -.06], [.26, -.74, .34, -.64]], lt: [[-.5, -.5, -.58, -.36], [-.7, -.3, -.76, -.18], [-.2, -.7, -.26, -.58], [.0, -.78, -.04, -.66]],
        snow: [[[.12, -.88], [.02, -.84], [-.1, -.86], [-.14, -.78], [-.06, -.8], [0, -.74], [.06, -.8], [.1, -.66]], [[.12, -.88], [.1, -.66], [.16, -.74], [.2, -.7], [.22, -.8]]] },
      { sil: [[-.85, 0], [-.66, -.26], [-.5, -.5], [-.38, -.7], [-.28, -.92], [-.16, -1.16], [-.05, -1.34], [.04, -1.2], [.14, -1.02], [.24, -.84], [.34, -.66], [.5, -.44], [.66, -.22], [.85, 0]], peak: 6,
        cr: [[[-.05, -1.34], [0, -1.06], [-.04, -.78], [.04, -.52], [0, -.26], [.08, 0]]], spur: [[-.38, -.7], [-.24, -.46], [-.26, -.2]],
        dk: [[0, -1.06, .12, -.96], [-.02, -.82, .2, -.7], [.03, -.56, .3, -.44], [.01, -.32, .4, -.22], [.06, -.12, .56, -.06]], lt: [[-.2, -1, -.26, -.86], [-.36, -.66, -.42, -.52], [-.56, -.36, -.6, -.24]],
        snow: [[[-.05, -1.34], [-.2, -1.06], [-.13, -1.08], [-.1, -.98], [-.05, -1.04], [0, -1.06]], [[-.05, -1.34], [0, -1.06], [.05, -1], [.08, -1.08], [.12, -1.04], [.04, -1.2]]] }
    ];
    const pts = a => a.map(p => `${p[0]} ${p[1]}`).join("L"), poly = a => `M${pts(a)}Z`, line = a => `M${pts(a)}`;
    // a mountain's faces: lit from its left foot to its first crease, the middle between creases, shaded from the last crease to its right foot
    function faces(m) {
      const S = m.sil, c0 = m.cr[0], cl = m.cr[m.cr.length - 1], out = [];
      out.push(["l", [...S.slice(0, m.peak + 1), ...c0.slice(1)]]);
      if (m.cr.length > 1) out.push(["m", [...S.slice(m.peak, m.peak2 + 1), ...cl.slice(1), ...c0.slice(1).reverse()]]);
      const last = m.peak2 || m.peak; out.push(["d", [...S.slice(last), ...cl.slice(1).reverse()]]);
      return out;
    }
    // (27 Oct 2026: each kind of mountain in its own colours: brown rock, grey snowy peaks, red desert ranges, green old
    // mountains, black volcanic, blue ice, cursed purple, crystal, metal, alien; "rock" keeps the names it always had)
    const sfx = pal => pal === "rock" ? "" : "-" + pal;
    const mtnDefs = pal => {
      const c = (NT && NT.MTN[pal]) || ["#efdbb2", "#cfae80", "#a7835a", "#b89470", "#806040", "#8d6c4b", "#523a26"], hc = (NT && NT.HILL[pal]) || ["#c2b26c", "#8c8246"], x = sfx(pal);
      return `<linearGradient id="${uid}-ml${x}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient><linearGradient id="${uid}-mm${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[3]}"/><stop offset="1" stop-color="${c[4]}"/></linearGradient><linearGradient id="${uid}-mr${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[5]}"/><stop offset="1" stop-color="${c[6]}"/></linearGradient><linearGradient id="${uid}-hl${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hc[0]}"/><stop offset="1" stop-color="${hc[1]}"/></linearGradient>` + stampsOf(x);
    };
    // hills: soft mounds, one or two humps, shaded on the right, a stroke or two of the pen
    const HL = [{ f: "M-1 0C-.8-.5-.4-.8 0-.8C.4-.78.75-.5 1 0Z", d: "M0-.8C.4-.78.75-.5 1 0L.15 0C.25-.3.18-.6 0-.8Z", s: "M.32-.5q.12.1.2.3M.16-.3q.1.08.16.24" },
      { f: "M-1 0C-.85-.45-.55-.62-.3-.6C-.12-.72.15-.74.35-.62C.62-.5.85-.3 1 0Z", d: "M.05-.7C.2-.72.4-.66.5-.56C.7-.42.88-.24 1 0L.25 0C.32-.26.24-.5.05-.7Z", s: "M.5-.4q.1.1.16.26M-.32-.56q.06.12.04.26" },
      { f: "M-1 0C-.7-.35-.5-.9-.1-.92C.3-.92.6-.5 1 0Z", d: "M-.1-.92C.3-.92.6-.5 1 0L.1 0C.2-.4.1-.7-.1-.92Z", s: "M.3-.56q.1.12.16.3M.1-.2q.08.06.12.18" }];
    // (redrawn 27 Oct 2026, the user: cold mountains must have "proper snow-covered peaks rather than flat grey shapes")
    // a snowfield over the top half of a mountain, its lower edge ragged and running down the gullies: white on the lit
    // face, blue-grey on the shaded, each cut to its face; drawn by the same hand as the rest of the mountain
    const snowEdge = m => {
      const top = Math.min(...m.sil.map(p => p[1])), y0 = top * .5, pts = [[-1.3, top - .3]];
      const gul = m.cr.map(c => { let best = c[0]; for (const p of c) if (Math.abs(p[1] - y0) < Math.abs(best[1] - y0)) best = p; return best[0]; });
      for (let i = 0; i <= 30; i++) { const xx = -1.05 + i * .07; let yy = y0 + (i % 2 ? .045 : -.035) * -top + Math.sin(i * 1.7 + m.sil.length) * .03 * -top; for (const g of gul) yy += Math.max(0, .1 - Math.abs(xx - g)) * 1.6 * -top; pts.push([Math.round(xx * 1000) / 1000, Math.round(yy * 1000) / 1000]); }
      pts.push([1.3, top - .3]); return poly(pts);
    };
    let clips = "";
    MT.forEach((m, k) => { const F = faces(m); clips += `<clipPath id="${uid}-cl${k}"><path d="${poly(F[0][1])}"/></clipPath><clipPath id="${uid}-cr${k}"><path d="${F.slice(1).map(f => poly(f[1])).join("")}"/></clipPath>`; });
    // a volcano drawn as one of the range (by the same pen): a cone cut off at its crater, lit and shaded as the
    // mountains are, old lava in dark tongues down its sides, a red glow in the crater, smoke drifting east
    const VO = { sil: [[-1, 0], [-.82, -.16], [-.64, -.36], [-.48, -.56], [-.34, -.72], [-.22, -.84], [-.15, -.9], [-.06, -.87], [.03, -.86], [.11, -.89], [.17, -.9], [.28, -.78], [.42, -.6], [.6, -.4], [.8, -.18], [1, 0]], peak: 10,
      cr: [[[.17, -.9], [.21, -.66], [.16, -.44], [.24, -.2], [.2, 0]]], spur: [[-.48, -.56], [-.36, -.36], [-.4, -.12]],
      dk: [[.21, -.66, .34, -.58], [.18, -.48, .42, -.4], [.22, -.3, .52, -.22], [.2, -.14, .62, -.07], [.3, -.76, .38, -.66]], lt: [[-.3, -.7, -.38, -.56], [-.52, -.44, -.58, -.32], [-.72, -.22, -.78, -.12]] };
    // mesas and buttes: tables of banded rock, a flat cap lit from above, sheer sides, a skirt of scree; the same pen
    const ME = [
      { sil: [[-1, 0], [-.86, -.08], [-.72, -.2], [-.66, -.5], [-.6, -.62], [-.3, -.66], [0, -.63], [.3, -.67], [.56, -.62], [.62, -.5], [.7, -.2], [.86, -.08], [1, 0]], peak: 8, cr: [[[.56, -.62], [.6, -.42], [.58, -.2], [.66, 0]]],
        cap: [[-.6, -.62], [-.3, -.66], [0, -.63], [.3, -.67], [.56, -.62], [.3, -.57], [0, -.58], [-.3, -.57]], band: [[-.65, -.46, .58, -.47], [-.69, -.3, .58, -.31]],
        dk: [[-.4, -.56, -.42, -.4], [-.1, -.56, -.12, -.36], [.25, -.55, .22, -.38], [.62, -.4, .7, -.3], [.62, -.24, .74, -.16], [-.3, -.26, -.33, -.14]], lt: [[-.63, -.55, -.66, -.4], [-.7, -.24, -.76, -.14]] },
      { sil: [[-.6, 0], [-.48, -.1], [-.36, -.24], [-.32, -.78], [-.26, -.86], [0, -.88], [.24, -.85], [.3, -.78], [.36, -.24], [.48, -.1], [.6, 0]], peak: 7, cr: [[[.24, -.85], [.28, -.5], [.26, -.24], [.34, 0]]],
        cap: [[-.26, -.86], [0, -.88], [.24, -.85], [0, -.8]], band: [[-.33, -.62, .26, -.62], [-.34, -.44, .27, -.44]], dk: [[-.1, -.78, -.12, -.56], [.12, -.76, .1, -.5], [.3, -.6, .38, -.52], [.3, -.36, .4, -.28]], lt: [[-.31, -.72, -.33, -.5]] }];
    const stampsOf = x => { let stamps = "";
    const FILL = { l: `url(#${uid}-ml${x})`, m: `url(#${uid}-mm${x})`, d: `url(#${uid}-mr${x})` };
    MT.forEach((m, k) => {
      const body = `<ellipse cx=".18" cy=".03" rx="1.18" ry=".13" fill="#26240f" fill-opacity=".22"/>` + faces(m).map(([t, a]) => `<path d="${poly(a)}" fill="${FILL[t]}"/>`).join("");
      const ink = `<path d="${m.dk.map(s => `M${s[0]} ${s[1]}L${s[2]} ${s[3]}`).join("")}" fill="none" stroke="#3f2b1b" stroke-width=".038" stroke-linecap="round" stroke-opacity=".85"/><path d="${m.lt.map(s => `M${s[0]} ${s[1]}L${s[2]} ${s[3]}`).join("")}" fill="none" stroke="#f6e7c4" stroke-width=".045" stroke-linecap="round" stroke-opacity=".85"/>`
        + `<path d="${line(m.sil)}${m.cr.map(line).join("")}${m.spur ? line(m.spur) : ""}${m.spur2 ? line(m.spur2) : ""}" fill="none" stroke="#2c2015" stroke-width=".052" stroke-linejoin="round" stroke-linecap="round"/>`;
      const snow = m.snow.map((a, i) => `<path d="${poly(a)}" fill="${i % 2 ? "#c3cbd2" : "#f7f6f1"}"/>`).join("");
      const field = snowEdge(m), inkS = ink.replace(/#3f2b1b/g, "#6d7782").replace(/stroke-opacity=".85"/, `stroke-opacity=".6"`);
      stamps += `<g id="${uid}-m${k}${x}">${body}${ink}</g><g id="${uid}-m${k}s${x}">${body}${snow}${ink}</g><g id="${uid}-m${k}S${x}">${body}<path d="${field}" fill="#f6f6f2" clip-path="url(#${uid}-cl${k})"/><path d="${field}" fill="#c2cad2" clip-path="url(#${uid}-cr${k})"/>${inkS}</g>`;
    });
    // the volcano, the mesas and buttes (made only in the palettes they are drawn in)
    if (x === "-volcanic") {
      const m = VO, lavaD = "M-.04-.86q-.08.2-.2.34q-.1.14-.08.34M.04-.86q.04.24.02.4q0 .2.1.38M-.12-.87q-.16.16-.32.3";
      stamps += `<g id="${uid}-vo${x}"><ellipse cx=".2" cy=".03" rx="1.2" ry=".13" fill="#26240f" fill-opacity=".25"/>${faces(m).map(([t, a]) => `<path d="${poly(a)}" fill="${FILL[t]}"/>`).join("")}`
        + `<path d="${lavaD}" fill="none" stroke="#2a201c" stroke-width=".07" stroke-linecap="round" stroke-opacity=".75"/><path d="${lavaD}" fill="none" stroke="#a84a24" stroke-width=".028" stroke-linecap="round" stroke-opacity=".9"/>`
        + `<path d="${m.dk.map(q => `M${q[0]} ${q[1]}L${q[2]} ${q[3]}`).join("")}" fill="none" stroke="#2a201a" stroke-width=".038" stroke-linecap="round" stroke-opacity=".85"/><path d="${m.lt.map(q => `M${q[0]} ${q[1]}L${q[2]} ${q[3]}`).join("")}" fill="none" stroke="#e6d8c6" stroke-width=".04" stroke-linecap="round" stroke-opacity=".7"/>`
        + `<path d="${line(m.sil)}${m.cr.map(line).join("")}${line(m.spur)}" fill="none" stroke="#2c2015" stroke-width=".052" stroke-linejoin="round" stroke-linecap="round"/>`
        + `<path d="M-.15-.9Q0-.82.17-.9Q0-.95-.15-.9Z" fill="#2a1e18" stroke="#2c2015" stroke-width=".03"/><path d="M-.09-.895Q0-.86.1-.895" fill="none" stroke="#d0703a" stroke-width=".03" stroke-opacity=".85"/>`
        + `<g fill="#d8d2c8" stroke="#6a625a" stroke-width=".018" stroke-opacity=".5"><path d="M-.05-.95c-.12-.08-.04-.22.08-.2c0-.14.2-.16.24-.04c.12-.06.24.06.16.16c.1.06.04.2-.08.18c-.04.1-.2.1-.24 0c-.12.04-.2-.06-.16-.1Z" fill-opacity=".7"/><path d="M.22-1.28c-.06-.1.06-.2.16-.14c.06-.1.22-.06.2.06c.12 0 .14.16.02.18c-.02.1-.18.1-.2 0c-.1.02-.18-.06-.18-.1Z" fill-opacity=".5"/><path d="M.5-1.5c0-.08.1-.12.16-.06c.08-.06.18.02.12.1c.04.08-.06.14-.14.08c-.08.04-.16-.04-.14-.12Z" fill-opacity=".32"/></g></g>`;
    }
    if (x === "-desert") ME.forEach((m, k) => {
      stamps += `<g id="${uid}-me${k}${x}"><ellipse cx=".18" cy=".03" rx="1.15" ry=".11" fill="#26240f" fill-opacity=".2"/>${faces(m).map(([t, a]) => `<path d="${poly(a)}" fill="${FILL[t]}"/>`).join("")}`
        + `<path d="${m.band.map(q => `M${q[0]} ${q[1]}L${q[2]} ${q[3]}`).join("")}" fill="none" stroke="#f0cfa0" stroke-width=".035" stroke-opacity=".55"/><path d="${m.dk.map(q => `M${q[0]} ${q[1]}L${q[2]} ${q[3]}`).join("")}" fill="none" stroke="#3f2b1b" stroke-width=".035" stroke-linecap="round" stroke-opacity=".7"/><path d="${m.lt.map(q => `M${q[0]} ${q[1]}L${q[2]} ${q[3]}`).join("")}" fill="none" stroke="#f6e7c4" stroke-width=".04" stroke-linecap="round" stroke-opacity=".7"/>`
        + `<path d="${poly(m.cap)}" fill="#e8c898" stroke="#2c2015" stroke-width=".04" stroke-linejoin="round"/><path d="${line(m.sil)}${m.cr.map(line).join("")}" fill="none" stroke="#2c2015" stroke-width=".05" stroke-linejoin="round" stroke-linecap="round"/></g>`;
    });
    HL.forEach((h, k) => { stamps += `<g id="${uid}-h${k}${x}"><ellipse cx=".15" cy=".03" rx="1.1" ry=".12" fill="#26240f" fill-opacity=".16"/><path d="${h.f}" fill="url(#${uid}-hl${x})"/><path d="${h.d}" fill="#5f5730" fill-opacity=".45"/><path d="${h.s}" fill="none" stroke="#3a2e1e" stroke-width=".05" stroke-opacity=".7" stroke-linecap="round"/><path d="${h.f}" fill="none" stroke="#3a2e1e" stroke-width=".05" stroke-opacity=".8"/></g>`; });
    return stamps; };
    const N = nat(WD), used = new Set(["rock"]), palAt = (x, y) => N ? NT.mtnKind(N, x, y) : "rock";
    // where a volcano, a mesa, floating mountains, a crater or a canyon stands, no range is drawn over it
    const own = N ? new Set(["volcano", "mesas", "floating", "crater", "canyon", "stones"].map(k => BIO.CODE[k])) : null, ownAt = (x, y) => own && own.has(N.covAt(x, y));
    const placed = [];
    // (the user, 27 Oct 2026: scattered peaks "look out of place": a range stands shoulder to shoulder, the peaks
    // overlapping, the biggest along its spine and smaller ones at its edges)
    const crowd = (x, y, w) => taken.some(([a, b, rr]) => Math.abs(a - x) < (w + rr) * .36 && Math.abs(b - y) < (w + rr) * .16);
    lattice(W, H, 6.4, 4.4, 21, (x, y, r) => {
      const t = pr.t(x, y); if (t < .44 || r > (t - .38) * 4.2 || ownAt(x, y)) return;
      const w = 5.2 + (t - .44) * 38 + r * 3, h = w * (1.05 + hash(x, y, 9) * .45); if (crowd(x, y, w)) return; taken.push([x, y, w]); mark(x, y, w * .9, h * .8);
      const hk = hash(x, y, 15), k = t > .68 ? (hk < .4 ? 3 : hk < .75 ? 0 : 1) : t > .56 ? (hk < .4 ? 0 : hk < .75 ? 1 : hk < .9 ? 3 : 2) : (hk < .35 ? 2 : hk < .7 ? 0 : 1);
      // (snow where it is cold enough: the higher peaks of a temperate land, lower down in the north, only the very
      // highest in a hot land)
      const pal = palAt(x, y), tm = N ? N.temp(x, y) : .3, glac = N && N.covAt(x, y) === BIO.CODE.glacier, heavy = glac || (t > .46 && tm < .1), snowy = !heavy && (t > .66 && tm < .3 || t > .5 && tm < .2); used.add(pal);
      placed.push([y, `<use href="#${uid}-m${k}${heavy ? "S" : snowy ? "s" : ""}${sfx(pal)}" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(w * 100) / 100} ${r1(h / 1.1 * 100) / 100})"/>`]);
    });
    lattice(W, H, 7, 5, 31, (x, y, r) => {
      const t = pr.t(x, y); if (t < .37 || t >= .45 || r > .55 || near(x, y, 4) || ownAt(x, y)) return;
      const w = 4 + r * 5 + (t - .37) * 30, h = w * (.75 + hash(x, y, 33) * .3); taken.push([x, y, w * .7]); mark(x, y, w, h);
      const pal = palAt(x, y); used.add(pal);
      placed.push([y, `<use href="#${uid}-h${Math.floor(hash(x, y, 34) * HL.length)}${sfx(pal)}" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(w * 100) / 100} ${r1(h * 100) / 100})"/>`]);
    });
    // volcanoes, standing over the range round them; old lava flows down their slopes (drawn on the ground, below)
    let lava = "";
    if (N && N.present.has(BIO.CODE.volcano)) for (const p of NT.patchesOf(WD, N, BIO.CODE.volcano)) {
      const [x, y0] = p.top, w = clamp(p.r * 2.1, 22, 60), h = w * .95, y = y0 + h * .3; mark(x, y, w * .9, h); used.add("volcanic");
      placed.push([y + 4, `<use href="#${uid}-vo-volcanic" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(w * 100) / 100} ${r1(h * 100) / 100})"/>`]);
      for (let f = 0; f < 3; f++) {
        let px = x + (hash(f, x, 3) - .5) * w * .3, py = y - h * .75, d = `M${r1(px)} ${r1(py)}`, n = 0;
        for (let g = 0; g < 70; g++) { const gx = (pr.S(px + 2, py) - pr.S(px - 2, py)) / 4, gy = (pr.S(px, py + 2) - pr.S(px, py - 2)) / 4, L = Math.hypot(gx, gy) || 1, a = (hash(f, g, 7) - .5) * 1.1; let ux = -gx / L, uy = -gy / L; [ux, uy] = [ux * Math.cos(a) - uy * Math.sin(a), ux * Math.sin(a) + uy * Math.cos(a)]; px += ux * 2.4; py += uy * 2.4 + .4; if (pr.S(px, py) <= pr.sea + 3 || pr.t(px, py) < .05) break; d += `L${r1(px)} ${r1(py)}`; n++; }
        if (n > 4) lava += d;
      }
    }
    // mesas and buttes standing on their tableland, thickest in its heart; buttes at its broken edge
    if (N && N.present.has(BIO.CODE.mesas)) { used.add("desert"); const tk = [];
      lattice(W, H, 14, 9, 141, (x, y, r) => {
        const [c, a] = N.covW(x, y); if (c !== BIO.CODE.mesas || r > a * .75 || tk.some(([p, q, ww]) => Math.abs(p - x) < (ww + 6) * .9 && Math.abs(q - y) < 6)) return;
        const butte = a < .78 && r < .55, w = butte ? 4.5 + r * 3 : 7 + a * 5 + r * 3, h = w * (butte ? 1.1 : 1.05); tk.push([x, y, w]); mark(x, y, w, h);
        placed.push([y, `<use href="#${uid}-me${butte ? 1 : 0}-desert" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(w * 100) / 100} ${r1(h * 100) / 100})"/>`]);
      }); }
    // craters, stone pillars, floating mountains, among the mountains
    if (N) for (const it of NT.relief(WD, "painted", N, pr, uid, mark, { skip: new Set(["volcano", "mesas"]) })) placed.push(it);
    const defs = `<defs>${clips}${[...used].map(mtnDefs).join("")}</defs>`;
    placed.sort((a, b) => a[0] - b[0]);
    const mtn = placed.map(p => p[1]).join(""), hills = "";
    // farmland round the settlements the viewer may see: patches of fields in the colours of crops
    let fields = "";
    const FC = ["#d3c06c", "#b9b65c", "#a2b057", "#cba95c", "#aabb69", "#c4b876"], FR = { capital: 30, city: 24, town: 17, port: 15, village: 11, hamlet: 7, farm: 8, manor: 9, monastery: 7, inn: 5 };
    for (const L of WD.locs || []) {
      const R = FR[L.kind]; if (!R || !Array.isArray(L.at) || (o.seen && !o.seen(L))) continue;
      const n = Math.round(R * .7), byC = FC.map(() => "");
      for (let i = 0; i < n; i++) {
        const a = hash(i, L.at[0] | 0, 3) * Math.PI * 2, d = R * (.35 + hash(i, L.at[1] | 0, 4) * .75), x = L.at[0] + Math.cos(a) * d, y = L.at[1] + Math.sin(a) * d * .8;
        const t = pr.t(x, y), m = pr.M(x, y); if (t < .006 || t > .42 || forest(x, y, m, t) > .3 || m < 40 || !free(x, y)) continue;
        const fw = 3 + hash(i, 7, L.at[0] | 0) * 3.5, fh = 2.2 + hash(i, 8, L.at[1] | 0) * 2.5, rot = (hash(i, 9, 1) - .5) * .9, ca = Math.cos(rot), sa = Math.sin(rot);
        const P = [[-fw, -fh], [fw, -fh * .9], [fw * .95, fh], [-fw, fh * 1.05]].map(([u, v]) => [x + u * ca - v * sa, y + u * sa + v * ca]);
        byC[Math.floor(hash(i, 10, L.at[0] | 0) * FC.length)] += `M${P.map(p => r1(p[0]) + " " + r1(p[1])).join("L")}Z`;
      }
      byC.forEach((d, k) => { if (d) fields += `<path d="${d}" fill="${FC[k]}" stroke="#5a4d2c" stroke-opacity=".55" stroke-width=".35"/>`; });
    }
    // forests, tree by tree (atlas-world-nature.js): each kind of forest its own trees, the woods of the climate where
    // nothing was laid down; the core of a wood thick, its edge thinning out
    let trees = "";
    if (N) trees = NT.trees(WD, "painted", N, pr, o, uid, free, forest);
    else {
      // forests, tree by tree: broadleaf in the lowland, pines higher up; the core of a wood thick, its edge thinning out
      const TB = new Map(), tput = (y, k, d) => { const b = Math.floor(y / 4); if (!TB.has(b)) TB.set(b, { c0: "", c1: "", c2: "", hi: "", pine: "", pine2: "" }); TB.get(b)[k] += d; };
      lattice(W, H, 3.3, 2.8, 41, (x, y, r) => {
        const t = pr.t(x, y), m = pr.M(x, y); if (t <= .012 || t > .5 || !free(x, y)) return;
        const fo = forest(x, y, m, t), dens = fo > 0 ? Math.min(1, fo * 1.6) : m > 100 ? .02 : 0; if (r >= dens) return;
        if (t > .28 || hash(x, y, 77) < .18 || m > 225) { const hh = 4.6 + hash(x, y, 79) * 1.6, ww = 1.8 + hash(x, y, 80) * .5; tput(y, hash(x, y, 81) < .5 ? "pine" : "pine2", `M${r1(x)} ${r1(y - hh)}l${r1(ww)} ${r1(hh * .62)}h${r1(-ww * .45)}l${r1(ww * .7)} ${r1(hh * .38)}h${r1(-ww * 2.5)}l${r1(ww * .7)} ${r1(-hh * .38)}h${r1(-ww * .45)}Z`); return; }
        const rr = 1.85 + hash(x, y, 78) * .75, k = Math.floor(hash(x, y, 82) * 3);
        tput(y, "c" + k, `M${r1(x + rr)} ${r1(y - rr)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-2 * rr)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(2 * rr)} 0`);
        const hr = rr * .45; tput(y, "hi", `M${r1(x - rr * .3 + hr)} ${r1(y - rr * 1.35)}a${r1(hr)} ${r1(hr)} 0 1 0 ${r1(-2 * hr)} 0a${r1(hr)} ${r1(hr)} 0 1 0 ${r1(2 * hr)} 0`);
      });
      for (const b of [...TB.keys()].sort((a, c) => a - c)) { const v = TB.get(b); trees += (v.c0 ? `<path d="${v.c0}" fill="#5b8a34"/>` : "") + (v.c1 ? `<path d="${v.c1}" fill="#4c7a2c"/>` : "") + (v.c2 ? `<path d="${v.c2}" fill="#6b9a3b"/>` : "") + (v.hi ? `<path class="lod1" d="${v.hi}" fill="#8db956" fill-opacity=".8"/>` : "") + (v.pine ? `<path d="${v.pine}" fill="#3d6834"/>` : "") + (v.pine2 ? `<path d="${v.pine2}" fill="#335c2e"/>` : ""); }
      // (each wood is outlined once, round its trees: an ink edge on every crown would make it a smudge at this size)
      trees = `<g stroke="#1e2f16" stroke-width=".42" stroke-opacity=".85" stroke-linejoin="round">${trees}</g>`;
    }
    // dunes, marsh, tufts of grass
    let dune = "", duneHi = "", marsh = "", pools = "", grass = "", bush = "";
    lattice(W, H, 6.5, 5, 51, (x, y, r, row) => {
      const t = pr.t(x, y), m = pr.M(x, y); if (t <= .01 || t > .45 || !free(x, y) || (N && N.covAt(x, y))) return;
      if (m < 70 && r < Math.min(.32, (70 - m) / 70 * 1.3)) { const w = 2.8 + r * 2.5; dune += `M${r1(x - w)} ${r1(y)}q${r1(w)} ${r1(-w * .7)} ${r1(w * 2)} 0`; duneHi += `M${r1(x - w * .9)} ${r1(y - .5)}q${r1(w * .6)} ${r1(-w * .55)} ${r1(w)} ${r1(-w * .35)}`; return; }
      if (m > 212 && t < .14 && r < .55) { marsh += `M${r1(x - 1.8)} ${r1(y)}l.6-2.4M${r1(x)} ${r1(y)}v-3M${r1(x + 1.8)} ${r1(y)}l-.6-2.4`; if (r < .2) pools += `M${r1(x + 4)} ${r1(y + 1)}a2.2 .9 0 1 0 -4.4 0a2.2 .9 0 1 0 4.4 0`; return; }
      if (m > 75 && t < .4 && forest(x, y, m, t) < .2) {
        if (r < .16) grass += `M${r1(x - 1.4)} ${r1(y)}l.7-1.7l.7 1.7l.7-1.7l.7 1.7`;
        else if (r < .26) bush += `M${r1(x + 1.1)} ${r1(y)}a1.1 1 0 1 0 -2.2 0a1.1 1 0 1 0 2.2 0`;
      }
    });
    const p = (d, a, cls) => d ? `<path${cls ? ` class="${cls}"` : ""} d="${d}" ${a}/>` : "";
    // what marks the ground of each laid-down kind of land, the frozen seas and the cliffs of the coast
    const ground = (N ? NT.marks(WD, "painted", N, pr, o, free) : "") + (lava ? `<path d="${lava}" fill="none" stroke="#2c221e" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${lava}" fill="none" stroke="#9c4a28" stroke-opacity=".8" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/><path class="lod1" d="${lava}" fill="none" stroke="#e08a4a" stroke-opacity=".7" stroke-width=".35" stroke-linecap="round"/>` : "");
    return defs + fields + ground + p(pools, `fill="#4f7f88" stroke="#2e4a44" stroke-width=".4"`) + p(dune, `fill="none" stroke="#9a5a26" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"`) + p(duneHi, `fill="none" stroke="#f0c27a" stroke-opacity=".55" stroke-width=".6" stroke-linecap="round"`)
      + p(marsh, `fill="none" stroke="#33442a" stroke-width=".55" stroke-linecap="round"`) + p(grass, `fill="none" stroke="#5c6a2c" stroke-width=".5"`) + p(bush, `fill="#5d7f33" stroke="#2c3d1c" stroke-width=".35"`) + hills + trees + mtn;
  }
  // the open sea: a few waves, and ships under sail where it is widest
  function paintedSea(WD, pr) {
    const [W, H] = WD.size; let wv = "", wv1 = ""; const deep = [];
    lattice(W, H, 40, 30, 57, (x, y, r) => {
      const h = pr.S(x, y); if (h > pr.sea - 18) return;
      if (h < pr.sea - 38) deep.push([x, y, h]);
      const d = `M${r1(x - 4)} ${r1(y)}q2-2 4 0t4 0`; if (r < .35) wv += d; else if (r < .7) wv1 += d;
    });
    let s = (wv ? `<path d="${wv}" fill="none" stroke="#d6e6e6" stroke-opacity=".35" stroke-width=".7" stroke-linecap="round"/>` : "") + (wv1 ? `<path class="lod1" d="${wv1}" fill="none" stroke="#d6e6e6" stroke-opacity=".3" stroke-width=".6" stroke-linecap="round"/>` : "");
    deep.sort((a, b) => a[2] - b[2]);
    const ships = []; for (const p of deep) { if (ships.length >= 4) break; if (ships.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > W * .22) && Math.min(p[0], p[1], W - p[0], H - p[1]) > 50) ships.push(p); }
    for (const [x, y] of ships) { const f = hash(x, y, 3) < .5 ? -1 : 1; s += `<g transform="translate(${r1(x)} ${r1(y)}) scale(${f} 1)" stroke="#2a2016" stroke-width=".6" stroke-linejoin="round"><path d="M-9 4q8 3 17 0" fill="none" stroke="#e2efec" stroke-opacity=".6"/><path d="M-8 1h16l-3 3.4h-10.5Z" fill="#6b4a2e"/><path d="M-1 1V-10" fill="none"/><path d="M-1-9.5q5 2.5 0 9" fill="#efe6cf"/><path d="M-1.6-8q-5 3.5-.2 8" fill="#e6dcc2"/><path d="M-1-10l3 1-3 1" fill="#a33b2a" stroke-width=".4"/></g>`; }
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
    // (27 Oct 2026: the land's cover as an atlas shows it, realistic and quiet: deserts sand-coloured, tundra grey,
    // rainforest deep green, ice white, where the climate makes them (a temperate world stays as it always was), and
    // every laid-down kind in its own colour)
    const N = nat(WD), NG = N && N.climate !== "temperate" ? NT.natGrid(WD, N, "atlas") : null;
    const img = raster(WD, (h, m, gx, gy, x, y, nz, I) => {
      if (h <= sea) {
        let c = ramp(DEEP, clamp((sea - h) / Math.max(1, sea) * 1.8, 0, 1));
        if (I.lake) c = mix(c, hex("#b4dcf0"), .3);
        if (I.mix) c = washed("atlas", c, I, x, y, nz, 0, true, .85);
        if (!(I.b && I.b.water) && I.tm < .08) c = mix(c, [247, 250, 252], smooth(.08, .02, I.tm) * .9);
        return c;
      }
      const t = (h - sea) / (255 - sea); let c = ramp(HYPS, t);
      if (m > 150 && t < .55) c = mix(c, forest, clamp((m - 150) / 105, 0, 1) * .55);
      if (NG && t < .6) c = mix(c, NG(x, y), .5 * (1 - smooth(.4, .6, t)));
      if (I.mix) c = washed("atlas", c, I, x, y, nz, t, false, .75);
      if (N && t > .3 && I.tm < .12) c = mix(c, [251, 251, 251], smooth(.12, .03, I.tm) * .8);
      const sh = clamp(shade(gx, gy, .045), .55, 1.25); return c.map(v => v * sh);
    }, { detail: 11 });
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // depth lines at sea
    for (const [lv, op, cls] of [[sea - 12, .5, ""], [sea - 32, .38, ""], [sea - 60, .3, "lod1"]]) if (lv > 2) { const d = ringsAt(G, lv, 1.4).map(r => pathD(r, true)).join(""); if (d) s += `<path${cls ? ` class="${cls}"` : ""} d="${d}" fill="none" stroke="#eaf5fb" stroke-opacity="${op}" stroke-width=".8"/>`; }
    const cd = coastD(G, .6);
    s += `<path d="${cd}" fill="url(#${uid}-b)" fill-rule="evenodd" stroke="#5f8db3" stroke-width=".8" stroke-linejoin="round"/>`;
    // height lines, faint, closer up
    for (let lv = sea + 40; lv < 250; lv += 40) { const d = ringsAt(G, lv, 1.2).map(r => pathD(r, true)).join(""); if (d) s += `<path class="lod1" d="${d}" fill="none" stroke="#7a5a3c" stroke-opacity=".28" stroke-width=".45"/>`; }
    s += N ? NT.rivers(WD, "atlas", N, pr, "#4f8fc6", null, 1) : rivers(WD, "#4f8fc6", null, 1);
    let key = [];
    if (N) { const z = NT.zones(WD, "atlas", N, uid); key = z.key; s += z.svg + NT.marks(WD, "atlas", N, pr, { ink: "#2b3440" }, () => true); for (const it of NT.relief(WD, "atlas", N, pr, uid, () => {}, {}).sort((a, b) => a[0] - b[0])) s += it[1]; }
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
    if (key.length) s += NT.keyBox(WD, "atlas", key, seaCorner(WD, pr), "#2b3440");
    return s;
  }

  /* ================================================================ science fiction: a survey, and a star chart */
  function holo(WD, uid, o) {
    const [W, H] = WD.size, G = WD.G, sea = G.sea, alien = o.palette === "alien";
    const C = alien ? { bg: hex("#12061a"), lo: hex("#2a0f2e"), hi: hex("#7a2d5a"), line: "#ff9a5a", glow: "#ff6a3a", sea: hex("#0a0414") } : { bg: hex("#020d16"), lo: hex("#05242f"), hi: hex("#0f5a63"), line: "#5ae2f0", glow: "#2fd0e8", sea: hex("#010811") };
    const N = nat(WD), pr = probe(WD);
    const img = raster(WD, (h, m, gx, gy, x, y, nz, I) => {
      if (h <= sea) { const scan = (Math.floor(y * 1.6) % 3 === 0) ? 1.25 : 1; let c = C.sea; if (I.mix) c = washed("holo", c, I, x, y, nz, 0, true, .45); return c.map(v => v * scan); }
      const t = (h - sea) / (255 - sea), sh = clamp(shade(gx, gy, .03), .6, 1.4); let c = mix(C.lo, C.hi, Math.pow(t, .8));
      // (each zone of the survey tinted in its own colour, faintly: the hatching and the outline say the rest)
      if (I.mix) c = mix(c, washed("holo", c, I, x, y, nz, t, false, .55), .7);
      return c.map(v => v * sh);
    }, { detail: 8 });
    let s = `<defs><pattern id="${uid}-b" patternUnits="userSpaceOnUse" width="${W}" height="${H}"><image href="${img}" width="${W}" height="${H}" preserveAspectRatio="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${uid}-b)"/>`;
    // contour lines, a brighter one every fourth
    let n = 0; for (let lv = sea + 14; lv < 252; lv += 14, n++) { const d = ringsAt(G, lv, 1.1).map(r => pathD(r, true)).join(""); if (!d) continue; const major = n % 4 === 3; s += `<path${major ? "" : ` class="lod1"`} d="${d}" fill="none" stroke="${C.line}" stroke-opacity="${major ? .55 : .26}" stroke-width="${major ? .7 : .45}"/>`; }
    const cd = coastD(G, .6);
    s += `<path d="${cd}" fill="none" stroke="${C.glow}" stroke-opacity=".22" stroke-width="5"/><path d="${cd}" fill="none" stroke="${C.line}" stroke-width="1.1"/>`;
    s += N ? NT.rivers(WD, "holo", N, pr, C.line, null, .7) : rivers(WD, C.line, null, .7).replace(/stroke="[^"]+"/g, `stroke="${C.line}" stroke-opacity=".7"`);
    let key = [];
    if (N) { const z = NT.zones(WD, "holo", N, uid); key = z.key; s += z.svg + NT.marks(WD, "holo", N, pr, { ink: C.line }, () => true); for (const it of NT.relief(WD, "holo", N, pr, uid, () => {}, {}).sort((a, b) => a[0] - b[0])) s += it[1]; }
    s += grid(WD, C.line, true);
    s += frame(WD, C.line, "holo", o);
    if (key.length) s += NT.keyBox(WD, "holo", key, seaCorner(WD, pr), C.line);
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
    if (look === "painted") {
      const c = pr ? seaCorner(WD, pr) : [.87, .83], cx = W * c[0], cy = H * c[1], R = Math.min(W, H) * .1;
      let s = `<g class="wm-deco">` + star8(cx, cy, R, ink, "#ece4cf");
      if (title) { const w = Math.min(W * .36, 64 + title.length * 11), [x, y] = cartoucheAt(WD, pr, w, 30, [cx, cy, R * 1.2]); s += cartouche(x, y, w, title, ink); }
      // the realms, in a box away from the compass (as a painted map keeps its key)
      const RL = (o.realms || []).slice(0, 8);
      if (RL.length) {
        const lw = Math.min(W * .3, 46 + Math.max(...RL.map(g => g.name.length)) * 6.4), lh = 26 + RL.length * 15, lx = cx > W / 2 ? 18 : W - 18 - lw, ly = cy > H / 2 ? 18 : H - 18 - lh;
        s += `<g class="wm-legend"><rect x="${r1(lx)}" y="${r1(ly)}" width="${r1(lw)}" height="${lh}" fill="#e9dcc0" fill-opacity=".93" stroke="${ink}" stroke-width="1.2"/><rect x="${r1(lx + 3)}" y="${r1(ly + 3)}" width="${r1(lw - 6)}" height="${lh - 6}" fill="none" stroke="${ink}" stroke-width=".5"/><text x="${r1(lx + 10)}" y="${r1(ly + 17)}" class="wm-lgt" fill="${ink}">The realms</text>`
          + RL.map((g, i) => `<rect x="${r1(lx + 10)}" y="${r1(ly + 25 + i * 15)}" width="16" height="9" fill="${g.colour}" fill-opacity=".55" stroke="${g.colour}" stroke-width="1.4" stroke-dasharray="4 1.5"/><text x="${r1(lx + 32)}" y="${r1(ly + 33 + i * 15)}" class="wm-lgi" fill="${ink}">${A.esc ? A.esc(g.name) : g.name}</text>`).join("") + `</g>`;
      }
      return s + `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#1d160f" stroke-width="6"/><rect x="7.5" y="7.5" width="${W - 15}" height="${H - 15}" fill="none" stroke="#c9b98f" stroke-width="1.4"/></g>`;
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
  // the painted map's compass: an eight-pointed star over two rings, pale on the sea
  function star8(cx, cy, R, ink, pale) {
    let s = `<g transform="translate(${r1(cx)} ${r1(cy)})" stroke="${ink}" stroke-linejoin="round"><circle r="${r1(R * .5)}" fill="none" stroke="${pale}" stroke-width="${r1(R * .09)}" stroke-opacity=".9"/><circle r="${r1(R * .5)}" fill="none" stroke-width=".7"/><circle r="${r1(R * .38)}" fill="none" stroke="${pale}" stroke-width="1.4"/>`;
    const pt = (a, len, w) => { const tip = [Math.sin(a) * len, -Math.cos(a) * len], l = [Math.sin(a - Math.PI / 2) * w, -Math.cos(a - Math.PI / 2) * w], r = [Math.sin(a + Math.PI / 2) * w, -Math.cos(a + Math.PI / 2) * w]; return `<path d="M${r1(l[0])} ${r1(l[1])}L${r1(tip[0])} ${r1(tip[1])}L0 0Z" fill="${pale}" stroke-width=".7"/><path d="M${r1(r[0])} ${r1(r[1])}L${r1(tip[0])} ${r1(tip[1])}L0 0Z" fill="#b9ad8c" stroke-width=".7"/>`; };
    for (let i = 1; i < 8; i += 2) s += pt(i / 8 * Math.PI * 2, R * .62, R * .1);
    for (let i = 0; i < 8; i += 2) s += pt(i / 8 * Math.PI * 2, R, R * .14);
    s += `<circle r="${r1(R * .08)}" fill="${pale}" stroke-width=".7"/><text y="${r1(-R * 1.08)}" text-anchor="middle" font-size="${r1(R * .26)}" fill="${pale}" stroke="${ink}" stroke-width=".6" paint-order="stroke" class="wm-roseN">N</text></g>`;
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
    return ({ relief, painted, parchment, engraved, atlas, holo })[look](WD, uid, o);
  }
  A.worldArt = { LOOKS, looksFor, draw };
})(ATLAS);
