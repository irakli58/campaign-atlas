/* The world map's nature (the user's request of 27 Oct 2026: docs/requests/2026-10-27-world-map-terrain.md): the land
   cover of atlas-world-biomes.js drawn in each look, for atlas-world-art.js, which paints the land and calls on this for
   what stands on it:
   - the land's colour under each kind of cover (a forest floor, dunes, salt, ash, glacier ice, a canyon's strata...),
     blended at its edge into the land round it;
   - trees of thirty kinds (oak and beech, pine, spruce, fir under snow, birch, willow, swamp cypress, redwood and cedar,
     cypress and olive, palm, acacia, baobab, jungle and its vines, bamboo, mangrove on its roots, autumn maples, cherry
     in blossom, dead, fallen and burned trees; enchanted, glowing and twisted trees, giant mushrooms; alien bulbs,
     glowing bulbs, fronds, crystals, fungal towers, silicon spires), each forest as thick as its kind, thinning at its
     edge, its trees chosen by its climate;
   - what marks the ground: dunes, stones, gullies, lichen, cracks in ice and salt, fields, orchards, vineyards, terraces
     along the slope, lava flows, marsh, bog pools, channels and oxbows, meadow flowers, glacier crevasses, sinkholes,
     sparkles, corrupted veins, spores, rifts, toxic pools, hazard marks, reefs, ice floes, glowing water;
   - the relief that is not a mountain range: volcanoes, mesas and buttes, craters, stone pillars, floating mountains;
   - the rivers: their liquid (water, ice, lava, glowing, acid...), deltas fanning to the sea, waterfalls and rapids where
     they fall steeply, springs.
   Fantasy is illustrated, the modern atlas realistic and quiet, a survey of a planet futuristic (zones outlined and
   hatched, a key of what is where), parchment and the engraved plate in ink: each its own hand, not one recoloured. */
(function (A) {
  "use strict";
  const K = A.worldDraw, BIO = A.worldBiomes; if (!K || !BIO) return;
  const { sampler, coastRings, chaikin, rdpRing, pathD, hash, mix, hex, clamp, vnoise } = K;
  const r1 = v => Math.round(v * 10) / 10, B = BIO.BY, CODE = BIO.CODE;
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---- what the land holds, worked out once for a world's land (kept on its grid) */
  function prep(WD) {
    const G = WD.G; if (!G) return null;
    const climate = BIO.climateOf((WD.W && WD.W.climate) || (WD.T && WD.T.climate));
    if (G._nat && G._nat.climate === climate) return G._nat;
    // (a world made by its geology knows its rain already: its wetness is not the climate's guess)
    const rain = !!(WD.T && WD.T.rain);
    const { cols, rows, cell, sea } = G, N = cols * rows, C = G.C || new Uint8Array(N), H = G.H, M = G.M || new Uint8Array(N).fill(128);
    const nz = vnoise(Math.floor(hash(cols, rows, 61) * 1e9)), Tm = new Float32Array(N), NAT = new Uint8Array(N), D = new Float32Array(N);
    // (a world whose ecology was simulated (world-ecology.js) brings its biomes and its temperatures: they are used as
    // they are; otherwise the climate's guess, as before)
    for (let n = 0; n < N; n++) {
      const i = n % cols, j = (n / cols) | 0, th = (H[n] - sea) / (255 - sea);
      Tm[n] = G.Tc ? Math.max(0, Math.min(1, (G.Tc[n] - 60 + 15) / 45)) : BIO.warmth(climate, (j + .5) / rows, Math.max(0, th), (nz(i / 9, j / 9) - .5) * .08);
      if (H[n] > sea) NAT[n] = G.B && G.B[n] ? G.B[n] : BIO.natural(Tm[n], rain ? M[n] / 255 : BIO.wetness(climate, M[n]), Math.max(0, th));
    }
    // how deep inside its cover each cell lies (0 at the edge of a laid-down region, more inward): its edge thins
    const q = []; D.fill(1e9);
    for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0, c = C[n]; if (!c) { D[n] = 0; continue; } let edge = false; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m < 0 || C[m] !== c) { edge = true; break; } if (edge) { D[n] = .5; q.push(n); } }
    for (let h = 0; h < q.length; h++) { const n = q[h], i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && C[m] === C[n] && D[m] > D[n] + 1) { D[m] = D[n] + 1; q.push(m); } }
    for (let n = 0; n < N; n++) if (D[n] > 40) D[n] = 40;
    // lakes: water that does not reach the edge of the map
    const L = new Uint8Array(N), seen = new Uint8Array(N), st = [];
    for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (H[n] <= sea && (!i || !j || i === cols - 1 || j === rows - 1)) { seen[n] = 1; st.push(n); } }
    while (st.length) { const n = st.pop(), i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && !seen[m] && H[m] <= sea) { seen[m] = 1; st.push(m); } }
    for (let n = 0; n < N; n++) if (H[n] <= sea && !seen[n]) L[n] = 1;
    const S = sampler(G), jn = vnoise(Math.floor(hash(cols, rows, 67) * 1e9)), jm = vnoise(Math.floor(hash(cols, rows, 71) * 1e9));
    const idx = (x, y) => clamp(Math.floor(y / cell), 0, rows - 1) * cols + clamp(Math.floor(x / cell), 0, cols - 1);
    // (redrawn 27 Oct 2026, the user: the regions must blend into the land, not sit on it as patches) each laid-down
    // kind's share of the land round every cell, blurred over a few cells: a region fades out across a wide edge, and
    // the noise makes that edge wander, broken into fingers and outliers as a real wood or desert's edge is
    const present = new Set(); for (let n = 0; n < N; n++) if (C[n]) present.add(C[n]);
    const WF = {}, ANY = new Float32Array(N), tmp = new Float32Array(N);
    const blur = (F, r) => { for (let pass = 0; pass < 2; pass++) { for (let j = 0; j < rows; j++) { let acc = 0; const o = j * cols; for (let i = -r; i < cols + r; i++) { if (i + r < cols && i + r >= 0) acc += F[o + i + r]; if (i - r - 1 >= 0 && i - r - 1 < cols) acc -= F[o + i - r - 1]; if (i >= 0 && i < cols) tmp[o + i] = acc / (2 * r + 1); } } for (let i = 0; i < cols; i++) { let acc = 0; for (let j = -r; j < rows + r; j++) { if (j + r < rows && j + r >= 0) acc += tmp[(j + r) * cols + i]; if (j - r - 1 >= 0 && j - r - 1 < rows) acc -= tmp[(j - r - 1) * cols + i]; if (j >= 0 && j < rows) F[j * cols + i] = acc / (2 * r + 1); } } } };
    for (const c of present) { const F = new Float32Array(N); for (let n = 0; n < N; n++) F[n] = C[n] === c ? 1 : 0; blur(F, 2); WF[c] = F; for (let n = 0; n < N; n++) if (F[n] > ANY[n]) ANY[n] = F[n]; }
    const codes = [...present];
    // how strongly each kind shows at a point (0 to 1), its edge broken by the noise: [[code, share], ...]
    const blend = (x, y) => {
      if (!codes.length || S(x, y, ANY) < .015) return null;
      const n1 = (jn(x * .05, y * .05) - .5) * .55 + (jm(x * .17, y * .17) - .5) * .25, out = [];
      for (const c of codes) { const w = S(x, y, WF[c]); if (w < .015) continue; const a = clamp((w - .5 + n1 * (1 - Math.abs(w - .5))) * 2.2 + .5, 0, 1); if (a > .01) out.push([c, a * a * (3 - 2 * a)]); }
      return out.length ? out : null;
    };
    // the kind at a point (where its share is more than half), and that share
    const covW = (x, y) => { const b = blend(x, y); if (!b) return [0, 0]; let best = 0, bw = .5; for (const [c, a] of b) if (a > bw) { bw = a; best = c; } return [best, best ? bw : 0]; };
    const covAt = (x, y) => covW(x, y)[0];
    const nat = { climate, C, D, NAT, Tm, L, S, idx, covAt, covW, blend, present, cell,
      temp: (x, y) => S(x, y, Tm), canopy: G.Cn ? (x, y) => S(x, y, G.Cn) / 255 : null, base: (x, y) => BIO.warmth(climate, y / (rows * cell), 0), wet: (x, y) => rain ? S(x, y, M) / 255 : BIO.wetness(climate, S(x, y, M)), depth: (x, y) => S(x, y, D), lake: (x, y) => L[idx(x, y)] === 1,
      // the kind of land at a point: what was laid there, or what its climate makes it
      bio: (x, y) => { const c = covAt(x, y); if (c) return B[BIO.LIST[c][0]]; const k = NAT[idx(x, y)]; return k ? B[BIO.LIST[k][0]] : null; },
      explicit: (x, y) => covAt(x, y) !== 0 };
    G._nat = nat; return nat;
  }
  // a laid-down kind's outline, as rings (for the survey's zones and the atlas's)
  function coverRings(WD, N, code) {
    const G = WD.G, n = G.cols * G.rows, F = new Uint8Array(n); for (let i = 0; i < n; i++) F[i] = N.C[i] === code ? 200 : 0;
    return coastRings({ cols: G.cols, rows: G.rows, cell: G.cell, H: F, sea: 100 }).filter(r => r.length > 5).map(r => chaikin(rdpRing(r, .9), 2, true));
  }

  /* ---- the colour of the ground under each cover, in each family of looks: [painted, atlas, survey] */
  // each kind's ground in each family of looks [painted, atlas, survey] (the painted colours redrawn 27 Oct 2026 in the
  // map's own muted family: earth, moss, sand, slate; nothing brighter than the painted land round it), and how much it
  // tints the land it lies on in the painted look (the rest is the land's own colour, so a region never reads as a patch)
  const P = {}, TINT = {};
  const pal = (id, painted, atlas, holo) => { P[id] = [hex(painted), hex(atlas || painted), hex(holo || painted)]; };
  pal("temperate", "#4b682e", "#9cc47f", "#1f6b4a");
  pal("boreal", "#3f5d38", "#8ab486", "#1d5a52");
  pal("rainforest", "#34602a", "#6fae5f", "#1f7a3a");
  pal("jungle", "#386328", "#78b05e", "#2a7a2a");
  pal("bamboo", "#66873f", "#a8cf84", "#3a8a3a");
  pal("cloud", "#4e6c4a", "#94bc94", "#2a6a5a");
  pal("swampforest", "#55623e", "#9ab38a", "#2a5a3a");
  pal("mangrove", "#4c6540", "#8fb08a", "#2a6a4a");
  pal("flooded", "#56705a", "#9cc0a6", "#2a6a6a");
  pal("autumn", "#7a6a38", "#d7c08a", "#8a6a2a");
  pal("snowforest", "#d8dedb", "#e9efe9", "#5a7a8a");
  pal("deadforest", "#7c745e", "#c9c2a8", "#5a5a4a");
  pal("burned", "#4c4540", "#a59b94", "#5a3a2a");
  pal("birch", "#79954c", "#b9d494", "#3a7a4a");
  pal("giant", "#3c5930", "#86b07a", "#1f5a3a");
  pal("palms", "#a6a266", "#d9dfa0", "#4a8a4a");
  pal("blossom", "#8a9e5a", "#cfe0a6", "#6a8a5a");
  pal("woodland", "#789044", "#b7d290", "#3a7a3a");
  pal("grass", "#9aab52", "#cfe3a2", "#2a6a3a");
  pal("steppe", "#b2a86a", "#e6e0aa", "#5a6a3a");
  pal("savanna", "#bca65e", "#ead9a0", "#7a6a2a");
  pal("dunes", "#d2ad6c", "#f2dcaa", "#8a6a2a");
  pal("rockdesert", "#b49474", "#e6cfa6", "#7a5a3a");
  pal("badlands", "#b48660", "#e3b392", "#8a3a2a");
  pal("tundra", "#a2a690", "#d7ddcc", "#4a6a6a");
  pal("icesheet", "#e4eaec", "#f6f9fb", "#8ab0c8");
  pal("farmland", "#b4ae64", "#e8e4ae", "#6a7a3a");
  pal("orchard", "#8ea04f", "#c9dc98", "#4a7a3a");
  pal("vineyard", "#a2995a", "#ddd4a0", "#6a5a4a");
  pal("terraces", "#98a15a", "#d2daa0", "#5a7a3a");
  pal("volcanic", "#5c534c", "#b3aaa4", "#6a2a1a");
  pal("saltflat", "#e6e0d4", "#fbf8f4", "#aab0b8");
  pal("drylake", "#ccba98", "#efe3c8", "#8a7a5a");
  pal("marsh", "#6f7e52", "#b9cfa4", "#2a5a5a");
  pal("bog", "#6e6c4e", "#b9b896", "#3a4a3a");
  pal("floodplain", "#86a054", "#c6dca0", "#2a6a4a");
  pal("scrub", "#a2a068", "#dddcaa", "#5a6a3a");
  pal("glacier", "#e2eaee", "#f4f8fb", "#9ad0f0");
  pal("mesas", "#bd8a60", "#e9c2a2", "#a04a2a");
  pal("canyon", "#a87854", "#e3b896", "#a04a2a");
  pal("volcano", "#544a44", "#9a8f88", "#c03a1a");
  pal("crater", "#a8987c", "#ddd0b8", "#7a6a5a");
  pal("sinkholes", "#8c9862", "#cddaa8", "#4a6a4a");
  pal("stones", "#a69c82", "#ddd2bc", "#6a6a6a");
  pal("highmtn", "#8a8076", "#d8d2ca", "#6a7a8a");
  pal("oldmtn", "#80905c", "#cdd6a4", "#4a6a4a");
  pal("ice", "#dbe5e8", "#f0f6fa", "#8ad0f0");
  pal("reef", "#5e9898", "#a6dbe0", "#2ad0c0");
  pal("glowwater", "#4f9e98", "#7fe0e0", "#3ff0e0");
  pal("cursedwater", "#34403a", "#6a7a72", "#3a5a3a");
  pal("acid", "#9caf48", "#d8e88a", "#c8f03a");
  pal("methane", "#9c7040", "#d8aa7a", "#f0a03a");
  pal("lava", "#b8582e", "#f08a5a", "#ff6a2a");
  pal("alienliquid", "#94508c", "#d88ad0", "#ff4ae0");
  pal("enchanted", "#3e6a58", "#9ccfba", "#2ad0a0");
  pal("glowforest", "#3c6262", "#8ac0c2", "#3af0f0");
  pal("corrupted", "#504448", "#b09ab0", "#c03ad0");
  pal("mushrooms", "#6c5f50", "#c4b4a8", "#d07a3a");
  pal("wasteland", "#8a8584", "#cfc8d2", "#a03ad0");
  pal("corruptland", "#635659", "#c0a8bc", "#c03ab0");
  pal("vale", "#8ab25a", "#c4e8a0", "#5af07a");
  pal("floating", "#94a060", "#cfd8a6", "#5a8aa0");
  pal("cursedmtn", "#564c50", "#b0a2ac", "#c03a7a");
  pal("alienforest", "#7a3a6a", "#d4a0c8", "#e04ac0");
  pal("biolum", "#1f2a3c", "#8a9ab8", "#3af0ff");
  pal("crystalwood", "#6a8ab0", "#bcd0e8", "#7ad0ff");
  pal("fungal", "#8a5a3a", "#d4b49a", "#f08a3a");
  pal("spires", "#8a8a92", "#cfcfd6", "#a0b0c0");
  pal("aliendesert", "#b0603a", "#e8b8a0", "#f07a3a");
  pal("toxic", "#a5b03a", "#dce49a", "#c8f02a");
  pal("crystalplain", "#a8c0d8", "#dce8f4", "#9ae0ff");
  pal("irradiated", "#5c5a3a", "#c4c2a6", "#d0f03a");
  pal("crystalmtn", "#8ab0d0", "#d0e2f0", "#9ad8ff");
  pal("metalcliffs", "#7a8088", "#c8ccd2", "#b0c0d0");
  pal("monsoon", "#456f34", "#8fbf74", "#2a7a3a"); pal("subtropical", "#4a7236", "#94c27c", "#2a6a3a"); pal("mixed", "#436440", "#90b886", "#2a5a4a"); pal("mediterranean", "#a19e66", "#d9d8a6", "#6a6a3a");
  pal("gallery", "#5d8442", "#a8cc8a", "#2a6a3a"); pal("alpine", "#9ea67e", "#d6dcc0", "#5a7a6a"); pal("rock", "#98908a", "#d4d0ca", "#6a6a6a"); pal("colddesert", "#b3a68a", "#e2dac8", "#7a6a5a");
  pal("desert", "#d6b47a", "#ecd8aa", "#c08a3a"); pal("plains", "#a9b66a", "#d6e2a6", "#4a7a3a"); pal("forest", "#4b6e34", "#9cc47f", "#1f6b4a"); pal("mountains", "#9a8c7a", "#d2c8b8", "#7a6a6a"); pal("swamp", "#5f6e44", "#a9bf96", "#2a5a4a"); pal("snow", "#eef2f4", "#f8fafb", "#bfe0f0");
  Object.assign(TINT, {"desert": .7, "plains": .35, "forest": .5, "mountains": .35, "swamp": .55, "snow": .9, "monsoon": .55, "subtropical": .5, "mixed": .52, "mediterranean": .45, "gallery": .5, "alpine": .55, "rock": .6, "colddesert": .65, "temperate": 0.5, "boreal": 0.55, "rainforest": 0.6, "jungle": 0.6, "snowforest": 0.8, "burned": 0.6, "deadforest": 0.5, "autumn": 0.45, "palms": 0.35, "blossom": 0.35, "woodland": 0.35, "bamboo": 0.45, "cloud": 0.5, "grass": 0.45, "steppe": 0.55, "savanna": 0.55, "dunes": 0.75, "rockdesert": 0.6, "badlands": 0.6, "tundra": 0.7, "icesheet": 0.9, "farmland": 0.45, "orchard": 0.4, "vineyard": 0.45, "terraces": 0.45, "volcanic": 0.6, "saltflat": 0.85, "drylake": 0.7, "marsh": 0.5, "bog": 0.55, "floodplain": 0.4, "scrub": 0.45, "glacier": 0.92, "mesas": 0.55, "canyon": 0.7, "volcano": 0.65, "crater": 0.55, "sinkholes": 0.3, "stones": 0.35, "highmtn": 0.3, "oldmtn": 0.4, "ice": 0.88, "reef": 0.55, "glowwater": 0.7, "cursedwater": 0.7, "acid": 0.8, "methane": 0.85, "lava": 0.9, "alienliquid": 0.85, "enchanted": 0.45, "glowforest": 0.45, "corrupted": 0.5, "mushrooms": 0.45, "wasteland": 0.55, "corruptland": 0.5, "vale": 0.4, "floating": 0.15, "cursedmtn": 0.4});
  const fam = look => look === "atlas" ? 1 : look === "holo" ? 2 : 0;
  // the colour of a laid-down kind at a point, worked as a painter would wash it in: the colour wandering a little
  // across the region, dunes faintly rippled, strata faintly banded, a canyon darkening to its floor, a crater's bowl, a
  // glacier's blue-grey streaks, old lava dark under its ash; never a pattern louder than the land round it
  function ground(look, b, x, y, d, nz, h01) {
    let c = P[b.id] ? P[b.id][fam(look)] : null; if (!c) return null;
    const f = fam(look), id = b.id, soft = f === 1 ? .5 : 1;
    if (f === 0) c = c.map(q => q * (1 + (nz(x * .021 + 7, y * .021) - .5) * .12));
    if (id === "dunes" || id === "aliendesert") { const v = Math.sin(x * .55 + y * .25 + nz(x * .03, y * .03) * 14); c = c.map(q => q * (1 + v * .045 * soft)); }
    else if (id === "badlands" || id === "mesas") { const v = Math.sin(h01 * 60 + nz(x * .02, y * .02) * 5); c = mix(c, f === 2 ? hex("#c0603a") : hex("#d8b088"), (v * .5 + .5) * .2 * soft); }
    else if (id === "canyon") { const k = clamp(d / 3, 0, 1); c = mix(mix(c, hex("#d4a47c"), (1 - k) * .3), hex(f === 1 ? "#a08470" : "#5a3a28"), k * .5); }
    else if (id === "crater") { const k = clamp(d / 4, 0, 1); c = mix(hex(f === 1 ? "#efe4d0" : "#c8b898"), c, k); c = c.map(q => q * (1 - k * .1)); }
    else if (id === "glacier" || id === "icesheet") { const v = nz(x * .07, y * .02); if (v > .55) c = mix(c, hex(f === 2 ? "#3a8ac0" : "#b6c8d4"), (v - .55) * .9); }
    else if (id === "volcanic" || id === "volcano") { const v = nz(x * .05 + 3, y * .05); c = mix(c, hex(f === 0 ? "#3a302c" : "#9a8a80"), clamp((v - .45) * 1.2, 0, .4)); }
    else if (id === "saltflat" || id === "drylake") { const v = Math.abs(nz(x * .12, y * .12) - .5); if (v < .025) c = c.map(q => q * .95); }
    else if (id === "lava") { const v = nz(x * .06, y * .06); c = mix(hex("#3a2a22"), mix(c, hex("#e0904a"), clamp((v - .55) * 2, 0, .5)), clamp(d / 2.5, .3, 1)); }
    else if (id === "glowwater") c = mix(c, hex("#86c4bc"), clamp(d / 6, 0, .35));
    else if (id === "corrupted" || id === "corruptland" || id === "wasteland") { const v = Math.abs(nz(x * .05, y * .05) - .5); if (v < .035) c = mix(c, hex(f === 2 ? "#c03ad0" : "#3a2a34"), (.035 - v) * 8); }
    else if (id === "farmland" || id === "terraces") { const v = hash(Math.floor(x / 9), Math.floor(y / 7), 3); c = mix(c, [hex("#cbb86c"), hex("#a2b057"), hex("#c4a85e"), hex("#a8b86a")][Math.floor(v * 4)], .22); }
    else if (id === "toxic" || id === "acid") { const v = nz(x * .07, y * .07); if (v > .6) c = mix(c, hex("#e8ff6a"), (v - .6) * (f === 0 ? .6 : 1.2)); }
    return c;
  }
  // how strongly a laid-down kind shows at a point: full inside, fading out across its edge
  const edgeA = d => sm(0, 1.6, d);
  // the mountains' colours [lit face top, middle, foot; shaded face; the far side] for each kind of mountain
  const MTN = {
    // (redrawn 27 Oct 2026: every kind in the original mountains' family of warm stone, shifted, never a flat grey)
    rock: ["#efdbb2", "#cfae80", "#a7835a", "#b89470", "#806040", "#8d6c4b", "#523a26"],
    snow: ["#e8dccb", "#bfae98", "#8f7f6c", "#a69886", "#6e6252", "#786a5a", "#463c32"],
    alpine: ["#e4d8c6", "#b8a890", "#88786a", "#9e907e", "#665a4c", "#706354", "#3e352c"],
    desert: ["#efd2a8", "#d4a274", "#aa7a50", "#b8865c", "#875934", "#8f5e3a", "#583822"],
    green: ["#e2dcae", "#b8b07a", "#8a8454", "#9a9262", "#6a643e", "#726a44", "#443e26"],
    volcanic: ["#aa9e92", "#7c7066", "#564c44", "#60564e", "#3c342e", "#423830", "#231d19"],
    ice: ["#e8dccb", "#bfae98", "#8f7f6c", "#a69886", "#6e6252", "#786a5a", "#463c32"],
    cursed: ["#c4b4b2", "#8e7e80", "#625458", "#6c5c60", "#42363a", "#4a3c40", "#281f22"],
    crystal: ["#f0faff", "#b8dcf4", "#7aa8d0", "#9ac4e4", "#4a7aa8", "#5a8ab8", "#2a4a78"],
    metal: ["#e8ecf0", "#b0b8c0", "#7a828a", "#8a929a", "#4a525a", "#5a626a", "#2a3038"],
    alien: ["#f0b8d8", "#c0789a", "#8a4a6a", "#9a5a7a", "#5a2a44", "#6a3a54", "#3a1a2a"]
  };

  const mtnKind = (N, x, y) => { const c = N.covAt(x, y); if (c && B[BIO.LIST[c][0]].mtn) return B[BIO.LIST[c][0]].mtn; return BIO.mtnOf(N.base(x, y), N.wet(x, y)); };
  // the colours of bare rock and the high ground under each kind of mountain, for the painted land
  const ROCK = { rock: ["#8f7356", "#a68d70"], snow: ["#84786a", "#a2968a"], alpine: ["#7d7268", "#9e9286"], desert: ["#a2704a", "#bc8e64"], green: ["#727a4c", "#8c8a60"], volcanic: ["#4a4038", "#5e544a"], ice: ["#84786a", "#a2968a"], cursed: ["#54464a", "#6a5c5e"], crystal: ["#7aa0c8", "#b8d8f0"], metal: ["#6a7078", "#9aa0a8"], alien: ["#8a4a6a", "#a86a8a"] };
  for (const k in ROCK) ROCK[k] = ROCK[k].map(hex);
  // the hills' colours [top, foot] under each kind
  const HILL = { rock: ["#c2b26c", "#8c8246"], desert: ["#d2a466", "#9e7040"], snow: ["#b8b08a", "#847c5c"], ice: ["#b8b08a", "#847c5c"], alpine: ["#b4ac8c", "#7e765c"], green: ["#a8b26a", "#6a7a3a"], volcanic: ["#7a6e62", "#4a4038"], cursed: ["#8a7a7a", "#54484c"], crystal: ["#b8d8f0", "#6a90b8"], metal: ["#b0b8c0", "#6a727a"], alien: ["#c08aa8", "#7a4a62"] };
  // the natural land's colour for the quieter looks, cell by cell, laid smoothly between cells
  function natGrid(WD, N, look) {
    const key = "_g" + fam(look); if (N[key]) return N[key];
    const G = WD.G, n = G.cols * G.rows, R = new Float32Array(n), Gg = new Float32Array(n), Bb = new Float32Array(n), f = fam(look);
    for (let i = 0; i < n; i++) { const k = N.NAT[i], c = k && P[BIO.LIST[k][0]] ? P[BIO.LIST[k][0]][f] : [128, 128, 128]; R[i] = c[0]; Gg[i] = c[1]; Bb[i] = c[2]; }
    const S = N.S; return (N[key] = (x, y) => [S(x, y, R), S(x, y, Gg), S(x, y, Bb)]);
  }

  /* ---- trees: each kind a few strokes of the pen, in parts (each part one colour, drawn together across a band of the
          map so the nearer ones stand over the farther) */
  // (redrawn 27 Oct 2026, the user: the first trees were "clusters of identical circles". A broadleaf crown is now a
  // cauliflower of three lobes with its lit lobe and a highlight, a conifer a tiered spire; every tree throws a short
  // shadow to the south-east, so that a wood reads as one mass, as on the original map; sizes and tones vary across a
  // forest as the noise says, not tree by tree.) t: the forest's tone here (0, 1, 2), s: the tree's size (about 1)
  const crown = (x, y, R) => `M${r1(x - R)} ${r1(y - R * .42)}A${r1(R * .55)} ${r1(R * .55)} 0 0 1 ${r1(x - R * .3)} ${r1(y - R * 1.28)}A${r1(R * .62)} ${r1(R * .62)} 0 0 1 ${r1(x + R * .5)} ${r1(y - R * 1.12)}A${r1(R * .55)} ${r1(R * .55)} 0 0 1 ${r1(x + R)} ${r1(y - R * .4)}Q${r1(x)} ${r1(y + R * .12)} ${r1(x - R)} ${r1(y - R * .42)}Z`;
  const lit = (x, y, R) => circ(x - R * .36, y - R * 1.05, R * .42);
  const shade = (x, y, R) => `M${r1(x + R * 1.3)} ${r1(y + .15)}a${r1(R * .95)} ${r1(R * .3)} 0 1 0 ${r1(-R * 1.9)} 0a${r1(R * .95)} ${r1(R * .3)} 0 1 0 ${r1(R * 1.9)} 0`;
  const broadleaf = (pre, R0) => (x, y, r, t, s) => { const R = (R0 + r * .6) * s; return [["sh", shade(x, y, R)], [pre + t, crown(x, y, R)], [pre + "l", lit(x, y, R)], [pre + "h", circ(x - R * .42, y - R * 1.3, R * .16)]]; };
  const TREES = {
    broad: broadleaf("c", 1.9), oak: broadleaf("c", 2.4), autumn: broadleaf("a", 1.9), cherry: broadleaf("ch", 1.8), enchanted: broadleaf("e", 2), mossy: broadleaf("m", 2.1), olive: broadleaf("ol", 1.2), dwarf: broadleaf("dw", .8),
    jungle: (x, y, r, t, s) => { const R = (2.3 + r * 1) * s; return [["sh", shade(x, y, R)], ["j" + t, crown(x, y, R) + (r < .3 ? crown(x + R * .7, y - R * .5, R * .7) : "")], ["jl", lit(x, y, R)]]; },
    vine: (x, y, r, t, s) => { const R = (2.2 + r * .8) * s; return [["sh", shade(x, y, R)], ["j" + t, crown(x, y, R)], ["jl", lit(x, y, R)], ["vines", `M${r1(x - R * .5)} ${r1(y - R * .5)}q.3 1.2-.1 2M${r1(x + R * .4)} ${r1(y - R * .4)}q-.3 1 .1 1.8`]]; },
    birch: (x, y, r, t, s) => { const R = (1.3 + r * .5) * s; return [["sh", shade(x, y, R)], ["btrunk", `M${r1(x)} ${r1(y)}v${r1(-R * 1.1)}`], ["birch" + t, crown(x, y - R * .5, R)], ["birchl", lit(x, y - R * .5, R)]]; },
    glowtree: (x, y, r, t, s) => { const R = (2 + r * .6) * s; return [["halo", circ(x, y - R, R * 1.9)], ["sh", shade(x, y, R)], ["e" + t, crown(x, y, R)], ["gll", lit(x, y, R)]]; },
    pine: (x, y, r, t, s) => [["sh", shade(x, y, 1.4 * s)], ["p" + t, pineD(x, y, (4.6 + r * 1.8) * s, (1.8 + r * .5) * s)]],
    spruce: (x, y, r, t, s) => [["sh", shade(x, y, 1.2 * s)], ["p" + t, spruceD(x, y, (5.2 + r * 1.8) * s, 1.45 * s)]],
    snowpine: (x, y, r, t, s) => { const h = (5 + r * 1.6) * s, w = 1.55 * s; return [["sh", shade(x, y, 1.2 * s)], ["p" + t, spruceD(x, y, h, w)], ["snow", snowTiers(x, y, h, w)]]; },
    redwood: (x, y, r, t, s) => { const h = (8 + r * 3) * s, w = 2 * s; return [["sh", shade(x, y, 1.8 * s)], ["rtrunk", `M${r1(x - .45)} ${r1(y)}h.9v${r1(-h * .32)}h-.9Z`], ["p" + t, spruceD(x, y - h * .22, h * .82, w)]]; },
    cedar: (x, y, r, t, s) => { const w = (2.8 + r) * s, h = (5 + r * 1.2) * s; let d = ""; for (let k = 0; k < 3; k++) { const yy = y - h * (.35 + k * .25), ww = w * (1 - k * .25); d += `M${r1(x - ww)} ${r1(yy)}q${r1(ww)} -${r1(h * .2)} ${r1(ww * 2)} 0q${r1(-ww)} ${r1(h * .08)} ${r1(-ww * 2)} 0Z`; } return [["sh", shade(x, y, w * .6)], ["trunk", `M${r1(x - .35)} ${r1(y)}h.7v${r1(-h * .4)}h-.7Z`], ["p" + t, d]]; },
    cypress: (x, y, r, t, s) => { const h = (4.6 + r * 1.6) * s, w = .95 * s; return [["sh", shade(x, y, w)], ["p" + t, `M${r1(x)} ${r1(y - h)}C${r1(x + w * 1.4)} ${r1(y - h * .55)} ${r1(x + w)} ${r1(y)} ${r1(x)} ${r1(y)}C${r1(x - w)} ${r1(y)} ${r1(x - w * 1.4)} ${r1(y - h * .55)} ${r1(x)} ${r1(y - h)}Z`]]; },
    swampcypress: (x, y, r, t, s) => { const h = (4.4 + r * 1.4) * s, w = 1.3 * s; return [["sh", shade(x, y, w)], ["trunk", `M${r1(x - .9)} ${r1(y)}l.5-1h.8l.5 1Z`], ["sw" + t, `M${r1(x)} ${r1(y - h)}C${r1(x + w * 1.3)} ${r1(y - h * .6)} ${r1(x + w)} ${r1(y - 1)} ${r1(x)} ${r1(y - .9)}C${r1(x - w)} ${r1(y - 1)} ${r1(x - w * 1.3)} ${r1(y - h * .6)} ${r1(x)} ${r1(y - h)}Z`]]; },
    willow: (x, y, r, t, s) => { const R = (2.1 + r * .6) * s; return [["sh", shade(x, y, R)], ["sw" + t, `M${r1(x - R)} ${r1(y - .2)}C${r1(x - R * 1.2)} ${r1(y - R * 2.4)} ${r1(x + R * 1.2)} ${r1(y - R * 2.4)} ${r1(x + R)} ${r1(y - .2)}Q${r1(x)} ${r1(y - R * .5)} ${r1(x - R)} ${r1(y - .2)}Z`], ["strand", `M${r1(x - R * .5)} ${r1(y - R * 1.3)}v${r1(R * 1)}M${r1(x)} ${r1(y - R * 1.6)}v${r1(R * 1.3)}M${r1(x + R * .5)} ${r1(y - R * 1.3)}v${r1(R * 1)}`]]; },
    mangrove: (x, y, r, t, s) => { const R = (1.8 + r * .6) * s; return [["roots", `M${r1(x - R)} ${r1(y + .3)}q${r1(R * .5)} -${r1(R * .9)} ${r1(R)} -${r1(R * .8)}q${r1(R * .5)} -.1 ${r1(R)} ${r1(R * .8)}M${r1(x - R * .5)} ${r1(y + .3)}q${r1(R * .3)} -${r1(R * .6)} ${r1(R * .5)} -${r1(R * .8)}`], ["sw" + t, crown(x, y - R * .7, R)], ["jl", lit(x, y - R * .7, R)]]; },
    palm: (x, y, r, t, s) => { const h = (4.2 + r * 1.6) * s, tx = x + (hash(x, y, 86) - .5) * 1.6, ty = y - h; let f = ""; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .55, L = (2.4 + (k % 2) * .5) * s, ex = tx + Math.cos(a) * L * 1.2, ey = ty + Math.sin(a) * L * .7 + 1.4 * s; f += `M${r1(tx)} ${r1(ty)}Q${r1((tx + ex) / 2 + Math.sin(a) * .6)} ${r1((ty + ey) / 2 - 1.2 * s)} ${r1(ex)} ${r1(ey)}Q${r1((tx + ex) / 2)} ${r1((ty + ey) / 2 - .2)} ${r1(tx)} ${r1(ty)}Z`; } return [["sh", shade(x, y, 1.2 * s)], ["ptrunk", `M${r1(x)} ${r1(y)}Q${r1(x + (tx - x) * .2)} ${r1(y - h * .5)} ${r1(tx)} ${r1(ty)}`], ["palm", f]]; },
    acacia: (x, y, r, t, s) => { const w = (2.8 + r * 1.4) * s, h = (2.8 + r) * s; return [["sh", shade(x, y, w * .7)], ["ptrunk", `M${r1(x)} ${r1(y)}l.2-${r1(h * .6)}l-${r1(w * .3)} -${r1(h * .35)}M${r1(x + .2)} ${r1(y - h * .6)}l${r1(w * .3)} -${r1(h * .35)}`], ["acacia", `M${r1(x - w)} ${r1(y - h)}q${r1(w * .3)} -${r1(h * .5)} ${r1(w)} -${r1(h * .48)}q${r1(w * .7)} 0 ${r1(w)} ${r1(h * .48)}q${r1(-w)} ${r1(h * .26)} ${r1(-w * 2)} 0Z`]]; },
    baobab: (x, y, r, t, s) => { const w = (1.1 + r * .5) * s, h = (3.4 + r) * s; return [["sh", shade(x, y, w * 1.4)], ["baob", `M${r1(x - w)} ${r1(y)}q${r1(-w * .3)} -${r1(h * .6)} ${r1(w * .3)} -${r1(h)}h${r1(w * 1.4)}q${r1(w * .6)} ${r1(h * .4)} ${r1(w * .3)} ${r1(h)}Z`], ["acacia", crown(x, y - h + .4, w * 1.25)]]; },
    bamboo: (x, y, r, t, s) => { let st = "", l = ""; for (let k = 0; k < 4; k++) { const bx = x + (k - 1.5) * .9 + (hash(x, y, 87 + k) - .5) * .5, h = (4 + hash(x, y, 90 + k) * 3) * s; st += `M${r1(bx)} ${r1(y)}v${r1(-h)}`; l += `M${r1(bx)} ${r1(y - h * .7)}l1.1-.6M${r1(bx)} ${r1(y - h * .45)}l-1-.5M${r1(bx)} ${r1(y - h)}l.9-.8`; } return [["bamboo", st], ["bleaf", l]]; },
    dead: (x, y, r, t, s) => { const h = (3.6 + r * 1.6) * s; return [["dead", `M${r1(x)} ${r1(y)}q-.3-${r1(h * .5)} 0-${r1(h)}M${r1(x)} ${r1(y - h * .55)}q${r1(.8 + r)} -.5 ${r1(1.5 + r)} -${r1(1.4)}M${r1(x)} ${r1(y - h * .7)}q-.6-.3-1.4-1.2M${r1(x + .9)} ${r1(y - h * .6 - .8)}l.5-.9M${r1(x)} ${r1(y - h)}l-.6-.8`]]; },
    fallen: (x, y, r) => { const L = 2.4 + r * 1.6, a = hash(x, y, 88) * 2 - 1; return [["log", `M${r1(x - L)} ${r1(y - a)}L${r1(x + L)} ${r1(y + a)}`]]; },
    burned: (x, y, r, t, s) => { const h = (2.2 + r * 1.6) * s; return [["burnt", `M${r1(x)} ${r1(y)}v${r1(-h)}M${r1(x)} ${r1(y - h * .6)}l.9-.8M${r1(x)} ${r1(y - h * .4)}l-.8-.5`]]; },
    twisted: (x, y, r, t, s) => { const h = (4.2 + r * 1.6) * s, R = (1.5 + r * .5) * s, lean = (hash(x, y, 93) - .5) * 1.6; return [["sh", shade(x, y, R)], ["twist", `M${r1(x)} ${r1(y)}c-.9-${r1(h * .2)} .9-${r1(h * .35)} ${r1(lean)} -${r1(h * .6)}M${r1(x + lean * .5)} ${r1(y - h * .38)}q${r1(-R * .8)} -.4 ${r1(-R * 1.3)} -${r1(R * .9)}`], ["tw" + t, crown(x + lean, y - h * .5, R)]]; },
    mushroom: (x, y, r, t, s) => { const w = (2.4 + r * 1.6) * s, h = (3 + r * 2) * s; return [["sh", shade(x, y, w * .6)], ["stem", `M${r1(x - w * .2)} ${r1(y)}q.2-${r1(h * .5)} 0-${r1(h)}h${r1(w * .4)}q-.2 ${r1(h * .5)} 0 ${r1(h)}Z`], ["cap" + t, `M${r1(x - w)} ${r1(y - h + .4)}Q${r1(x - w * .9)} ${r1(y - h - w * 1.05)} ${r1(x)} ${r1(y - h - w * .9)}Q${r1(x + w * .9)} ${r1(y - h - w * 1.05)} ${r1(x + w)} ${r1(y - h + .4)}Q${r1(x)} ${r1(y - h - w * .1)} ${r1(x - w)} ${r1(y - h + .4)}Z`], ["capl", `M${r1(x - w * .75)} ${r1(y - h - w * .1)}Q${r1(x - w * .55)} ${r1(y - h - w * .8)} ${r1(x)} ${r1(y - h - w * .78)}Q${r1(x - w * .35)} ${r1(y - h - w * .45)} ${r1(x - w * .75)} ${r1(y - h - w * .1)}Z`], ["spots", circ(x + w * .35, y - h - w * .6, .3 * s) + circ(x + w * .05, y - h - w * .35, .25 * s)]]; },
    toadstool: (x, y, r, t, s) => { const w = (1.3 + r * .5) * s, h = (1.6 + r * .6) * s; return [["stem", `M${r1(x - .3)} ${r1(y)}v-${r1(h)}h.6v${r1(h)}Z`], ["cap" + t, `M${r1(x - w)} ${r1(y - h + .2)}q${r1(w)} -${r1(w * 1.5)} ${r1(w * 2)} 0Z`]]; },
    bulb: (x, y, r, t, s) => { const h = (3.6 + r * 2) * s, rr = (1.2 + r * .7) * s; return [["stalk", `M${r1(x)} ${r1(y)}q${r1(r - .5)} -${r1(h * .5)} 0 -${r1(h)}`], ["bulb" + (t % 2), circ(x, y - h - rr * .7, rr)], ["bhi", circ(x - rr * .35, y - h - rr, rr * .35)]]; },
    glowbulb: (x, y, r, t, s) => { const h = (3 + r * 2) * s, rr = (1 + r * .6) * s; return [["stalk", `M${r1(x)} ${r1(y)}v-${r1(h)}`], ["halo", circ(x, y - h - rr * .6, rr * 2.4)], ["gbulb", circ(x, y - h - rr * .6, rr)]]; },
    frond: (x, y, r) => { const h = 3 + r * 1.4; return [["frond", `M${r1(x)} ${r1(y)}c-.4-${r1(h * .5)} -2-${r1(h * .7)} -2.2-${r1(h)}c.8.2 1.2.8 1.2 1.4M${r1(x)} ${r1(y)}c.4-${r1(h * .5)} 2-${r1(h * .6)} 2.4-${r1(h * .9)}c-.8 0-1.2.6-1.3 1.2M${r1(x)} ${r1(y)}v-${r1(h * 1.1)}`]]; },
    crystal: (x, y, r, t, s) => { const h = (3.4 + r * 2.4) * s, w = (.9 + r * .4) * s; return [["cry" + (t % 2), `M${r1(x - w)} ${r1(y)}l${r1(w * .3)} -${r1(h * .8)}l${r1(w * .7)} -${r1(h * .2)}l${r1(w * .7)} ${r1(h * .25)}l${r1(w * .3)} ${r1(h * .75)}Z` + `M${r1(x + w * .8)} ${r1(y)}l${r1(w * .9)} -${r1(h * .5)}l${r1(w * .5)} ${r1(h * .1)}l-${r1(w * .3)} ${r1(h * .4)}Z`], ["cryhi", `M${r1(x - w * .7)} ${r1(y - .2)}l${r1(w * .3)} -${r1(h * .76)}l${r1(w * .4)} -${r1(h * .1)}l-${r1(w * .2)} ${r1(h * .86)}Z`]]; },
    fungal: (x, y, r, t, s) => { const h = (5 + r * 2.6) * s, w = (1.6 + r * .8) * s; return [["fstalk", `M${r1(x - .45)} ${r1(y)}q-.4-${r1(h * .5)} .1-${r1(h)}h.7q.4 ${r1(h * .5)} .1 ${r1(h)}Z`], ["fung", `M${r1(x - w)} ${r1(y - h + .2)}q${r1(w)} -${r1(w)} ${r1(w * 2)} 0Z` + `M${r1(x - w * .7)} ${r1(y - h * .55)}q${r1(w * .7)} -${r1(w * .7)} ${r1(w * 1.4)} 0Z`]]; },
    spire: (x, y, r, t, s) => { const h = (4 + r * 4) * s, w = (.7 + r * .4) * s; return [["spire", `M${r1(x - w)} ${r1(y)}L${r1(x)} ${r1(y - h)}L${r1(x + w)} ${r1(y)}Z`], ["spirehi", `M${r1(x - w * .6)} ${r1(y)}L${r1(x)} ${r1(y - h)}L${r1(x - w * .1)} ${r1(y)}Z`]]; }
  };
  function circ(x, y, r) { return r <= 0 ? "" : `M${r1(x + r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0`; }
  function pineD(x, y, hh, ww) { return `M${r1(x)} ${r1(y - hh)}l${r1(ww)} ${r1(hh * .62)}h${r1(-ww * .45)}l${r1(ww * .7)} ${r1(hh * .38)}h${r1(-ww * 2.5)}l${r1(ww * .7)} ${r1(-hh * .38)}h${r1(-ww * .45)}Z`; }
  function spruceD(x, y, h, w) { return `M${r1(x)} ${r1(y - h)}l${r1(w * .7)} ${r1(h * .34)}h${r1(-w * .3)}l${r1(w * .9)} ${r1(h * .33)}h${r1(-w * .35)}l${r1(w * 1.05)} ${r1(h * .33)}h${r1(-w * 2.7)}l${r1(w * 1.05)} ${r1(-h * .33)}h${r1(-w * .35)}l${r1(w * .9)} ${r1(-h * .33)}h${r1(-w * .3)}Z`; }
  // snow lying on the lit side of each tier of a fir
  function snowTiers(x, y, h, w) { let d = ""; for (const [k, ww] of [[0, .7], [.34, 1.2], [.67, 1.75]]) { const ty = y - h + h * k; d += `M${r1(x)} ${r1(ty)}l${r1(-ww * .95)} ${r1(h * .3)}l${r1(ww * .5)} ${r1(-h * .05)}l${r1(ww * .2)} ${r1(h * .03)}Z`; } return d; }
  // how each part is drawn in the painted map [fill, stroke ("" the wood's ink outline, "-" none, or a colour), class,
  // opacity, stroke width], in the order they are laid down (shadows first). The colours are the original map's greens,
  // and for the other kinds the same muted family: russet and ochre for autumn, dusty rose for blossom, a deep blue-green
  // for an enchanted wood, plum-grey for a corrupted one, rust and ochre for giant mushrooms
  const PAINT = {
    sh: ["#1d2a14", "-", "", .22], halo: ["url(#UID-glow)", "-"], strand: ["none", "#4f7032", "lod1", 1, .35], roots: ["none", "#4a3a2a", "", 1, .45], log: ["none", "#5a4a34", "", 1, .7], trunk: ["#4a3422", "-"], rtrunk: ["#6e3a26", "-"], btrunk: ["none", "#e8e4da", "", 1, .7], ptrunk: ["none", "#54402a", "", 1, .7], stalk: ["none", "#5a3a5a", "", 1, .5], fstalk: ["#c8b090"], stem: ["#e2d6bc"],
    c0: ["#5b8a34"], c1: ["#4c7a2c"], c2: ["#5f8d37"], cl: ["#6f9c40", "-", "", .9], ch: ["#9ac460", "-", "lod1", .85],
    p0: ["#3d6834"], p1: ["#335c2e"], p2: ["#2c5230"], snow: ["#f4f6f3", "-"],
    a0: ["#a5643a"], a1: ["#b08a42"], a2: ["#8e5634"], al: ["#c9a25a", "-"], ah: ["#e2c27a", "-", "lod1", .8],
    ch0: ["#c9a0a6"], ch1: ["#b98e98"], ch2: ["#d4b0b2"], chl: ["#e2c4c6", "-"], chh: ["#f2e0e2", "-", "lod1", .85],
    m0: ["#4f7046"], m1: ["#46663f"], m2: ["#577a4a"], ml: ["#6f8e5c", "-"], mh: ["#9ab884", "-", "lod1", .7],
    ol0: ["#76884e"], ol1: ["#6c7e48"], ol2: ["#7f9056"], oll: ["#8c9c62", "-"], olh: ["#a6b47c", "-", "lod1", .7],
    dw0: ["#6a7a4a"], dw1: ["#62704a"], dw2: ["#727f50"], dwl: ["#86925e", "-"], dwh: ["#a0aa76", "-", "lod1", .6],
    birch0: ["#88a656"], birch1: ["#7c9a4e"], birch2: ["#92ae5e"], birchl: ["#a8c274", "-"],
    j0: ["#2f5c24"], j1: ["#376628"], j2: ["#2a5220"], jl: ["#4c7c36", "-"], vines: ["none", "#22401a", "lod1", 1, .45],
    sw0: ["#4c6a3c"], sw1: ["#566f40"], sw2: ["#45603a"], palm: ["#4a7a32"], acacia: ["#6a7a3c"], baob: ["#8a7766"],
    bamboo: ["none", "#6f9a44", "", 1, .55], bleaf: ["none", "#56803a", "lod1", 1, .4],
    e0: ["#3a6c50"], e1: ["#38665a"], e2: ["#427456"], el: ["#5a8c6c", "-"], eh: ["#d2ead0", "-", "lod1", .75], gll: ["#a6c48c", "-"],
    dead: ["none", "#5a4c3c", "", 1, .5], burnt: ["none", "#262220", "", 1, .7],
    twist: ["none", "#3a2e2c", "", 1, .65], tw0: ["#4e4a40"], tw1: ["#4a4044"], tw2: ["#565046"],
    cap0: ["#8a5a42"], cap1: ["#94744c"], cap2: ["#76606a"], capl: ["#ae8a68", "-", "", .7], spots: ["#ece2cc", "-", "lod1", .9],
    bulb0: ["#c04aa0"], bulb1: ["#4ac0b0"], bhi: ["#ffd8f4", "-", "lod1", .8], gbulb: ["#6af0ff"], frond: ["none", "#8a3ab0", "", 1, .6],
    cry0: ["#a8d8f8"], cry1: ["#7aa8e8"], cryhi: ["#ffffff", "-", "", .7], fung: ["#d08a4a"], spire: ["#9aa0aa"], spirehi: ["#d8dce2", "-", "", .8]
  };
  const ORDER = Object.keys(PAINT);
  // the same parts in ink (the parchment: a pale wash in an inked outline; the engraved plate: the outline alone)
  const toHex = c => "#" + c.map(q => Math.round(clamp(q, 0, 255)).toString(16).padStart(2, "0")).join("");
  // (a stroke-only part keeps its stroke, in ink; a filled part is washed pale, or left as paper on the plate; shadows,
  // highlights and glows are left out: the pen does not draw them)
  const inkStyle = (look, ink, paper) => { const out = {}; for (const [k, v] of Object.entries(PAINT)) { const [f, s, cls, op, sw] = v; if (f.startsWith("url") || k === "sh" || s === "-" && !["snow"].includes(k)) { out[k] = null; continue; } const fill = f === "none" ? "none" : look === "engraved" ? paper : toHex(mix(hex(f), hex(paper), .62)); out[k] = [fill, f === "none" ? ink : "", cls, op, sw]; } return out; };

  /* ---- the vegetation of a world: every tree of every forest and grove, where the land and its cover say */
  // free(x, y): no mountain stands there; forestFn(x, y, m, t): how thick the climate's own woods stand (0 to 1);
  // o.special: only what the look's own woods do not already draw (the ink looks keep their oaks and pines). Returns the
  // trees as SVG, drawn band by band down the map.
  const PLAIN = new Set(["temperate", "boreal", "woodland", "grass", "steppe", "marsh", "bog", "tundra", "icesheet", "dunes", "rockdesert"]);
  function trees(WD, look, N, pr, o, uid, free, forestFn) {
    const [W, H] = WD.size, styles = look === "painted" ? PAINT : inkStyle(look, o.ink || "#3b2a1a", o.paper || "#ecdfbd");
    const TB = new Map(), put = (y, parts) => { const b = Math.floor(y / 4); let v = TB.get(b); if (!v) { v = {}; TB.set(b, v); } for (const [k, d] of parts) if (d) v[k] = (v[k] || "") + d; };
    const step = look === "painted" ? [3.4, 2.9] : [5.2, 4.4], seed = look === "painted" ? 41 : 43;
    const tone = vnoise(Math.floor(hash(W, H, 97) * 1e9)), glade = vnoise(Math.floor(hash(W, H, 98) * 1e9));
    lattice(W, H, step[0], step[1], seed, (x, y, r) => {
      const t = pr.t(x, y); if (t <= .012 || !free(x, y)) return;
      const [c, share] = N.covW(x, y), b = c ? B[BIO.LIST[c][0]] : null;
      let bio = b, dens = 0, pine = false;
      if (b) {
        if (b.water) return;
        // inside a laid-down forest: thick in its heart, thinning out across its edge (a few strays beyond it), with
        // glades; trees as tall as the ground allows
        if (!b.tree) return;
        dens = b.dens * (b.dens >= .5 ? .25 + share * .8 : 1) * (t > .62 ? .3 : 1);
        if (b.dens >= .5 && glade(x * .045, y * .045) < .22) dens *= .35;
      } else {
        if (t > .55) return;
        const m = pr.M(x, y); bio = N.bio(x, y); if (!bio || !bio.tree || (o.special && PLAIN.has(bio.id))) return;
        const fo = forestFn ? forestFn(x, y, m, t) : 0;
        dens = bio.dens >= .5 ? (fo > 0 ? Math.min(1, fo * 1.6) : m > 100 ? .02 : 0) : bio.dens;
        // (the temperate woods have their pines, more of them higher up and in the wettest ground, as they always had)
        pine = ["temperate", "woodland", "grass"].includes(bio.id) && (t > .28 || m > 225 || hash(x, y, 77) < .18);
        // (and next to a laid-down forest, the climate's woods give way to it)
        const bl = N.blend(x, y); if (bl) { let a = 0; for (const [, q] of bl) a = Math.max(a, q); dens *= 1 - a * .8; }
      }
      if (r >= dens) return;
      const tr = bio.tree, pick = hash(x, y, 77); let acc = 0, kind = tr[0][0]; for (const [k, s] of tr) { acc += s; if (pick < acc) { kind = k; break; } }
      if (pine) kind = "pine";
      const f = TREES[kind]; if (!f) return;
      // the tone wanders across the forest in patches, a tree here and there of another; a tree in a thick wood is
      // taller than one at its edge
      const tv = tone(x * .028, y * .028), tn = hash(x, y, 96) < .2 ? Math.floor(hash(x, y, 95) * 3) : tv < .4 ? 1 : tv < .62 ? 0 : 2;
      const sz = (.8 + Math.min(1, dens) * .28) * (.88 + hash(x, y, 94) * .26);
      put(y, f(x, y, hash(x, y, 79), tn, sz));
    });
    let s = "";
    for (const b of [...TB.keys()].sort((a, c) => a - c)) {
      const v = TB.get(b);
      for (const k of ORDER) { if (!v[k] || !styles[k]) continue; const [fill, stroke, cls, op, sw] = styles[k]; s += `<path${cls ? ` class="${cls}"` : ""} d="${v[k]}" fill="${fill.replace("UID", uid)}"${stroke === "-" ? ` stroke="none"` : stroke ? ` stroke="${stroke}"${sw ? ` stroke-width="${sw}"` : ""} stroke-linecap="round"` : ""}${op && op !== 1 ? ` opacity="${op}"` : ""}/>`; }
    }
    const outline = look === "painted" ? `stroke="#1e2f16" stroke-width=".42" stroke-opacity=".85"` : look === "engraved" ? `stroke="${o.ink}" stroke-width=".4" stroke-opacity=".8"` : `stroke="${o.ink}" stroke-width=".5" stroke-opacity=".85"`;
    return `<defs><radialGradient id="${uid}-glow"><stop offset="0" stop-color="#e8f0c8" stop-opacity=".22"/><stop offset="1" stop-color="#e8f0c8" stop-opacity="0"/></radialGradient></defs><g ${outline} stroke-linejoin="round">${s}</g>`;
  }
  function lattice(W, H, dx, dy, seed, fn) { for (let y = dy * .5, row = 0; y < H; y += dy, row++) for (let x = dx * .5 + (row % 2) * dx * .5; x < W; x += dx) fn(x + (hash(x * 7, y * 3, seed) - .5) * dx * .8, y + (hash(x * 5, y * 11, seed + 1) - .5) * dy * .8, hash(x, y, seed + 2), row); }

  /* ---- what marks the ground, kind by kind (look: painted, parchment, engraved, atlas, holo) */
  const MARK_STYLE = {
    // [painted, ink looks, atlas, holo]: attributes, and the level of detail it waits for
    dune: [`fill="none" stroke="#9a5a26" stroke-opacity=".6" stroke-width=".8"`, `fill="none" stroke="INK" stroke-opacity=".45" stroke-width=".7"`, `fill="none" stroke="#c49a5a" stroke-opacity=".7" stroke-width=".6"`, `fill="none" stroke="#ffb05a" stroke-opacity=".5" stroke-width=".5"`],
    dunehi: [`fill="none" stroke="#f0c27a" stroke-opacity=".55" stroke-width=".6"`, "", "", ""],
    stones: [`fill="#7a5a3a" fill-opacity=".55"`, `fill="INK" fill-opacity=".45"`, `fill="#9a7a5a" fill-opacity=".5"`, `fill="#ffb05a" fill-opacity=".4"`],
    gully: [`fill="none" stroke="#6a2a14" stroke-opacity=".55" stroke-width=".5"`, `fill="none" stroke="INK" stroke-opacity=".5" stroke-width=".45"`, `fill="none" stroke="#a0603a" stroke-opacity=".5" stroke-width=".4"`, `fill="none" stroke="#ff7a4a" stroke-opacity=".5" stroke-width=".45"`],
    lichen: [`fill="#c9c7a0" fill-opacity=".7"`, `fill="INK" fill-opacity=".3"`, `fill="#a8b49a" fill-opacity=".6"`, `fill="#7af0d0" fill-opacity=".35"`],
    crack: [`fill="none" stroke="#7a9ab0" stroke-opacity=".7" stroke-width=".45"`, `fill="none" stroke="INK" stroke-opacity=".4" stroke-width=".4"`, `fill="none" stroke="#8ab0c8" stroke-opacity=".7" stroke-width=".4"`, `fill="none" stroke="#9ad8ff" stroke-opacity=".6" stroke-width=".4"`],
    saltcrack: [`fill="none" stroke="#b8aa98" stroke-opacity=".8" stroke-width=".4"`, `fill="none" stroke="INK" stroke-opacity=".35" stroke-width=".35"`, `fill="none" stroke="#c8beb0" stroke-opacity=".8" stroke-width=".35"`, `fill="none" stroke="#c8d0d8" stroke-opacity=".5" stroke-width=".35"`],
    field: [`fill="#cdbb66" stroke="#5a4d2c" stroke-opacity=".5" stroke-width=".3"`, `fill="none" stroke="INK" stroke-opacity=".45" stroke-width=".35"`, `fill="#efe6b0" stroke="#bfae70" stroke-opacity=".7" stroke-width=".3"`, `fill="none" stroke="#c8f07a" stroke-opacity=".45" stroke-width=".35"`],
    field2: [`fill="#a6b358" stroke="#5a4d2c" stroke-opacity=".5" stroke-width=".3"`, `fill="none" stroke="INK" stroke-opacity=".3" stroke-width=".35"`, `fill="#dfe8b4" stroke="#bfae70" stroke-opacity=".7" stroke-width=".3"`, `fill="none" stroke="#c8f07a" stroke-opacity=".3" stroke-width=".35"`],
    rows: [`fill="none" stroke="#5a6a2a" stroke-opacity=".7" stroke-width=".55"`, `fill="none" stroke="INK" stroke-opacity=".45" stroke-width=".4"`, `fill="none" stroke="#7a9a4a" stroke-opacity=".7" stroke-width=".45"`, `fill="none" stroke="#7af07a" stroke-opacity=".5" stroke-width=".4"`],
    dots: [`fill="#4f7a2a"`, `fill="INK" fill-opacity=".55"`, `fill="#6a9a4a"`, `fill="#7af07a" fill-opacity=".6"`],
    terrace: [`fill="none" stroke="#6a7030" stroke-opacity=".6" stroke-width=".5"`, `fill="none" stroke="INK" stroke-opacity=".4" stroke-width=".4"`, `fill="none" stroke="#9aa060" stroke-opacity=".7" stroke-width=".4"`, `fill="none" stroke="#c8f07a" stroke-opacity=".45" stroke-width=".4"`],
    lavaflow: [`fill="none" stroke="#ff6a1a" stroke-opacity=".85" stroke-width=".9"`, `fill="none" stroke="INK" stroke-opacity=".6" stroke-width=".6" stroke-dasharray="2 1"`, `fill="none" stroke="#d0603a" stroke-opacity=".8" stroke-width=".6"`, `fill="none" stroke="#ff6a2a" stroke-opacity=".9" stroke-width=".7"`],
    lavaglow: [`fill="none" stroke="#ffb03a" stroke-opacity=".35" stroke-width="2.6"`, "", "", `fill="none" stroke="#ff6a2a" stroke-opacity=".25" stroke-width="2.4"`],
    marsh: [`fill="none" stroke="#33442a" stroke-width=".55"`, `fill="none" stroke="#4d5a3a" stroke-width=".55"`, `fill="none" stroke="#4a8ac0" stroke-width=".5"`, `fill="none" stroke="#5ae2f0" stroke-opacity=".6" stroke-width=".45"`],
    pool: [`fill="#4f7f88" stroke="#2e4a44" stroke-width=".4"`, `fill="#c9cdb6" stroke="INK" stroke-width=".4"`, `fill="#a9d1ea" stroke="#5f8db3" stroke-width=".3"`, `fill="none" stroke="#5ae2f0" stroke-opacity=".6" stroke-width=".4"`],
    bogpool: [`fill="#3a4a3a" stroke="#22301e" stroke-width=".35"`, `fill="#b6bea9" stroke="INK" stroke-width=".35"`, `fill="#9fc0c8" stroke="#5f8db3" stroke-width=".3"`, `fill="none" stroke="#5ae2f0" stroke-opacity=".5" stroke-width=".35"`],
    channel: [`fill="none" stroke="#4d8098" stroke-width=".7"`, `fill="none" stroke="INK" stroke-opacity=".6" stroke-width=".5"`, `fill="none" stroke="#4f8fc6" stroke-width=".6"`, `fill="none" stroke="#5ae2f0" stroke-opacity=".6" stroke-width=".5"`],
    tuft: [`fill="none" stroke="#5c6a2c" stroke-width=".5"`, `fill="none" stroke="#6b6a3c" stroke-width=".45"`, "", ""],
    flower: [`fill="#f0e070"`, `fill="INK" fill-opacity=".4"`, "", `fill="#ffe07a" fill-opacity=".6"`],
    flower2: [`fill="#e88ab8"`, "", "", ""],
    bush: [`fill="#5d7f33" stroke="#2c3d1c" stroke-width=".35"`, `fill="#c8c48c" stroke="INK" stroke-width=".4"`, "", ""],
    crevasse: [`fill="none" stroke="#7ab0d0" stroke-opacity=".8" stroke-width=".5"`, `fill="none" stroke="INK" stroke-opacity=".4" stroke-width=".4"`, `fill="none" stroke="#7ab0d0" stroke-opacity=".7" stroke-width=".4"`, `fill="none" stroke="#9ad8ff" stroke-opacity=".7" stroke-width=".4"`],
    flowline: [`fill="none" stroke="#b8d0e0" stroke-opacity=".9" stroke-width=".45"`, "", `fill="none" stroke="#c4dae8" stroke-width=".4"`, ""],
    pit: [`fill="#2a2a1c" fill-opacity=".75" stroke="#d8d0a0" stroke-opacity=".5" stroke-width=".4"`, `fill="INK" fill-opacity=".6"`, `fill="#8a7a5a" fill-opacity=".7"`, `fill="none" stroke="#ffb05a" stroke-opacity=".6" stroke-width=".4"`],
    spark: [`fill="#fffbe0"`, `fill="INK" fill-opacity=".35"`, "", `fill="#ffffff"`],
    vein: [`fill="none" stroke="#3a2a34" stroke-opacity=".45" stroke-width=".5"`, `fill="none" stroke="INK" stroke-opacity=".55" stroke-width=".5"`, `fill="none" stroke="#9a6aa0" stroke-opacity=".6" stroke-width=".45"`, `fill="none" stroke="#e04af0" stroke-opacity=".8" stroke-width=".5"`],
    veinglow: [`fill="none" stroke="#8a6a7a" stroke-opacity=".12" stroke-width="1.6"`, "", "", `fill="none" stroke="#e04af0" stroke-opacity=".2" stroke-width="2"`],
    spore: [`fill="#e8d8a0" fill-opacity=".8"`, `fill="INK" fill-opacity=".35"`, "", `fill="#f0a03a" fill-opacity=".7"`],
    rift: [`fill="none" stroke="#b07af0" stroke-opacity=".85" stroke-width=".7"`, `fill="none" stroke="INK" stroke-opacity=".6" stroke-width=".55"`, `fill="none" stroke="#8a6aa0" stroke-width=".5"`, `fill="none" stroke="#c07aff" stroke-width=".6"`],
    glowdot: [`fill="#7ff0ff"`, `fill="INK" fill-opacity=".35"`, `fill="#7ab0c8"`, `fill="#7ff0ff"`],
    shard: [`fill="#d8f0ff" stroke="#5a7aa8" stroke-width=".3"`, `fill="none" stroke="INK" stroke-width=".4"`, `fill="#d8e8f4" stroke="#7a9ab8" stroke-width=".3"`, `fill="none" stroke="#9ae0ff" stroke-width=".45"`],
    toxpool: [`fill="#d8f04a" fill-opacity=".8" stroke="#6a7a1a" stroke-width=".35"`, `fill="none" stroke="INK" stroke-width=".4"`, `fill="#e4f08a" stroke="#9aa03a" stroke-width=".3"`, `fill="none" stroke="#c8f02a" stroke-width=".5"`],
    hazard: [`fill="#2a2a1a" stroke="#e8f04a" stroke-width=".4"`, `fill="INK"`, `fill="#9a9a5a"`, `fill="none" stroke="#e8ff4a" stroke-width=".5"`],
    reef: [`fill="none" stroke="#d8f4ec" stroke-opacity=".45" stroke-width=".45"`, `fill="none" stroke="INK" stroke-opacity=".5" stroke-width=".45" stroke-dasharray="1 1.2"`, `fill="none" stroke="#5aaac8" stroke-width=".45" stroke-dasharray="1 1"`, `fill="none" stroke="#2af0d0" stroke-opacity=".7" stroke-width=".45" stroke-dasharray="1.2 1"`],
    coral: [`fill="#f0a08a" fill-opacity=".8"`, "", "", ""],
    floe: [`fill="#f6fafc" stroke="#9ab8cc" stroke-width=".35"`, `fill="#f4efe0" stroke="INK" stroke-width=".4"`, `fill="#ffffff" stroke="#9ab8cc" stroke-width=".3"`, `fill="none" stroke="#9ad8ff" stroke-width=".4"`],
    shimmer: [`fill="none" stroke="#d8fff8" stroke-opacity=".7" stroke-width=".5"`, `fill="none" stroke="INK" stroke-opacity=".4" stroke-width=".45"`, "", `fill="none" stroke="#bafff8" stroke-opacity=".7" stroke-width=".45"`],
    murk: [`fill="none" stroke="#9aa89a" stroke-opacity=".45" stroke-width=".9"`, `fill="none" stroke="INK" stroke-opacity=".35" stroke-width=".5"`, "", `fill="none" stroke="#7af07a" stroke-opacity=".35" stroke-width=".5"`],
    bubble: [`fill="none" stroke="#f4ffb0" stroke-opacity=".8" stroke-width=".35"`, `fill="none" stroke="INK" stroke-opacity=".4" stroke-width=".35"`, "", `fill="none" stroke="#e8ff6a" stroke-width=".4"`],
    ash: [`fill="#2a2420" fill-opacity=".5"`, `fill="INK" fill-opacity=".4"`, `fill="#8a8078" fill-opacity=".5"`, `fill="#ff6a2a" fill-opacity=".35"`],
    snowdot: [`fill="#ffffff" fill-opacity=".8"`, "", "", ""],
    mist: [`fill="none" stroke="#e8f0ee" stroke-opacity=".45" stroke-width="1.6"`, "", "", ""],
    fern: [`fill="none" stroke="#2a5a1a" stroke-opacity=".7" stroke-width=".45"`, "", "", ""],
    cliff: [`fill="none" stroke="#3a2a1a" stroke-opacity=".6" stroke-width=".55"`, `fill="none" stroke="INK" stroke-opacity=".65" stroke-width=".5"`, "", ""]
  };
  const LOD = { dunehi: "lod1", lichen: "lod1", crack: "lod1", saltcrack: "lod1", field2: "", rows: "lod1", dots: "lod1", terrace: "", flower: "lod2", flower2: "lod2", tuft: "lod1", crevasse: "", flowline: "lod1", spark: "lod2", spore: "lod1", glowdot: "lod1", bubble: "lod1", snowdot: "lod1", mist: "", fern: "lod1", coral: "lod1", cliff: "lod1", stones: "lod1", ash: "lod1" };
  const MARK_ORDER = Object.keys(MARK_STYLE);
  const famM = look => look === "painted" ? 0 : look === "atlas" ? 2 : look === "holo" ? 3 : 1;
  // the ground's marks, region by region: free(x, y) as for the trees
  function marks(WD, look, N, pr, o, free) {
    const [W, H] = WD.size, D = {}, add = (k, d) => { D[k] = (D[k] || "") + d; }, quiet = look === "atlas" || look === "holo";
    const sea = pr.sea, gx = (x, y) => [(pr.S(x + 2, y) - pr.S(x - 2, y)) / 4, (pr.S(x, y + 2) - pr.S(x, y - 2)) / 4];
    lattice(W, H, 6, 4.8, 53, (x, y, r, row) => {
      const h = pr.S(x, y), land = h > sea, c = N.covAt(x, y), b = c ? B[BIO.LIST[c][0]] : null, t = (h - sea) / (255 - sea);
      if (land && !free(x, y) && !(b && ["glacier", "volcanic", "volcano"].includes(b.id))) return;
      // the natural land: frozen seas, reefs on warm shallow coasts, coastal cliffs; and the marks of its own cover
      if (!b) {
        if (!land) { const tm = N.temp(x, y); if (tm < .07 && r < (.07 - tm) * 9) add("floe", floe(x, y, r)); return; }
        if (t > .28 && t < .7 && r < .5) { let near = false; for (const [a, bb] of [[5, 0], [-5, 0], [0, 5], [0, -5]]) if (pr.S(x + a, y + bb) <= sea) near = true; if (near) { const [ux, uy] = gx(x, y), L = Math.hypot(ux, uy) || 1; add("cliff", `M${r1(x)} ${r1(y)}l${r1(-ux / L * 2.4)} ${r1(-uy / L * 2.4)}`); } }
        return;
      }
      const d = N.depth(x, y), k = b.mark; if (!k) return;
      switch (k) {
        case "dune": if (r < .7) { const w = 2.6 + r * 2.8; add("dune", `M${r1(x - w)} ${r1(y)}q${r1(w)} ${r1(-w * .7)} ${r1(w * 2)} 0`); if (!quiet) add("dunehi", `M${r1(x - w * .9)} ${r1(y - .5)}q${r1(w * .6)} ${r1(-w * .55)} ${r1(w)} ${r1(-w * .35)}`); } break;
        case "stones": if (r < .45) add("stones", circ(x, y, .45 + r * .6) + (r < .2 ? circ(x + 2, y + 1, .4) : "")); break;
        case "gully": if (r < .55) { const L = 3 + r * 3; add("gully", `M${r1(x)} ${r1(y - L)}l.6 ${r1(L * .4)}l-.5 ${r1(L * .3)}l.4 ${r1(L * .3)}M${r1(x + .3)} ${r1(y - L * .5)}l1.2.8`); } break;
        case "lichen": if (r < .4) add("lichen", circ(x, y, .4 + r * .5)); if (r > .9) add("pool", ellipse(x, y, 1.6, .7)); break;
        case "ice": if (r < .35) add("crack", `M${r1(x - 2.5)} ${r1(y)}l1.6-.8l1.2.6l1.4-.9`); break;
        case "fields": if (r < .9) add(r < .45 ? "field" : "field2", quad(x, y, 2.6 + r * 1.6, 1.8 + r, (hash(x, y, 9) - .5) * .9)); break;
        case "orchard": add("dots", circ(x - 1.5, y, .7) + circ(x + 1.5, y, .7) + circ(x, y - 1.6, .7)); break;
        case "vines": add("rows", `M${r1(x - 2.6)} ${r1(y - 1)}h5.2M${r1(x - 2.6)} ${r1(y + .2)}h5.2M${r1(x - 2.6)} ${r1(y + 1.4)}h5.2`); break;
        case "terrace": { const [ux, uy] = gx(x, y), L = Math.hypot(ux, uy); if (L < .05) break; const px = -uy / L, py = ux / L; add("terrace", `M${r1(x - px * 2.8)} ${r1(y - py * 2.8)}Q${r1(x + ux / L * .6)} ${r1(y + uy / L * .6)} ${r1(x + px * 2.8)} ${r1(y + py * 2.8)}`); break; }
        case "lava": if (r < .07) { const [ux, uy] = gx(x, y), L = Math.hypot(ux, uy) || 1, dx = -ux / L, dy = -uy / L, seg = `M${r1(x)} ${r1(y)}q${r1(dx * 3 + dy)} ${r1(dy * 3 - dx)} ${r1(dx * 6)} ${r1(dy * 6)}`; add("lavaflow", seg); add("lavaglow", seg); } else if (r < .5) add("ash", circ(x, y, .5)); break;
        case "salt": case "cracks": if (r < .55) add("saltcrack", `M${r1(x - 2)} ${r1(y - 1)}l1.4 1.2l1.6-.5l1 1.4M${r1(x - .6)} ${r1(y + .2)}l-.4 1.6`); break;
        case "marsh": if (r < .55) add("marsh", `M${r1(x - 1.8)} ${r1(y)}l.6-2.4M${r1(x)} ${r1(y)}v-3M${r1(x + 1.8)} ${r1(y)}l-.6-2.4`); if (r < .2) add("pool", ellipse(x + 4, y + 1, 2.2, .9)); break;
        case "bog": if (r < .35) add("bogpool", ellipse(x, y, 1.6 + r * 2, .8 + r)); else if (r < .55) add("tuft", `M${r1(x - 1.2)} ${r1(y)}l.6-1.4l.6 1.4l.6-1.4`); break;
        case "channels": if (r < .12) add("channel", `M${r1(x - 3)} ${r1(y)}c1-2 3-2 3 0s2 2 3 0`); else if (r < .2) add("pool", `M${r1(x + 2.4)} ${r1(y)}a2.4 1.2 0 1 0 -4.8 0`); break;
        case "scrub": if (r < .25) add("bush", circ(x, y, .9)); break;
        case "meadow": if (r < .1) add("tuft", `M${r1(x - 1.4)} ${r1(y)}l.7-1.7l.7 1.7l.7-1.7l.7 1.7`); else if (r < .2) add(r < .15 ? "flower" : "flower2", circ(x, y, .35)); break;
        case "steppe": if (r < .2) add("tuft", `M${r1(x - 1)} ${r1(y)}l.5-1.4l.5 1.4l.5-1.4`); break;
        case "glacier": { if (r < .3) { const [ux, uy] = gx(x, y), L = Math.hypot(ux, uy) || 1, px = -uy / L, py = ux / L; add("crevasse", `M${r1(x - px * 2)} ${r1(y - py * 2)}q${r1(px * 2 + ux / L)} ${r1(py * 2 + uy / L)} ${r1(px * 4)} ${r1(py * 4)}`); } else if (r < .5) { const [ux, uy] = gx(x, y), L = Math.hypot(ux, uy) || 1; add("flowline", `M${r1(x)} ${r1(y)}l${r1(-ux / L * 4)} ${r1(-uy / L * 4)}`); } break; }
        case "strata": case "canyon": if (r < .2 && d > 1) add("gully", `M${r1(x - 2)} ${r1(y)}h1.4l.5.6h2`); break;
        case "crater": break;
        case "sinkhole": if (r < .12) add("pit", ellipse(x, y, 1.2 + r * 8, 1 + r * 6)); break;
        case "pillars": break;
        case "floes": if (r < .6) add("floe", floe(x, y, r)); break;
        case "reef": if (r < .3) { add("reef", `M${r1(x + 1.4)} ${r1(y)}a1.4 .8 0 1 0 -2.8 0a1.4 .8 0 1 0 2.8 0`); if (!quiet && r < .3) add("coral", circ(x + .8, y + .4, .45) + circ(x - 1, y - .3, .35)); } break;
        case "glow": if (r < .35) add("shimmer", `M${r1(x - 2)} ${r1(y)}q1-1 2 0t2 0`); break;
        case "murk": if (r < .3) add("murk", `M${r1(x - 3)} ${r1(y)}q1.5-1.2 3 0t3 0`); break;
        case "bubbles": if (r < .4) add("bubble", circ(x, y, .4 + r) + circ(x + 1.4, y - .8, .3)); break;
        case "slick": if (r < .3) add("shimmer", `M${r1(x - 2.5)} ${r1(y)}c1-1.4 2.4-1.4 2.5 0s1.5 1.4 2.5 0`); break;
        case "lavaglow": if (r < .45) { const d2 = `M${r1(x - 2.4)} ${r1(y)}l1.2-.9l1.3.7l1.4-.8l1.2.5`; add("lavaflow", d2); add("lavaglow", d2); } break;
        case "sparkle": if (r < .3) add("spark", star(x, y, .9)); break;
        case "veins": if (r < .3) { const d2 = `M${r1(x - 3)} ${r1(y)}l1.4-.8l1 .9l1.6-1.2l1.2.6`; add("vein", d2); if (!quiet) add("veinglow", d2); } break;
        case "spores": if (r < .4) add("spore", circ(x, y, .3 + r * .4)); break;
        case "rifts": if (r < .14) { const d2 = `M${r1(x - 4)} ${r1(y - 1)}l2 1l1.4-.4l1.2 1.2l2-.6`; add("rift", d2); add("veinglow", d2); } else if (r < .3) add("stones", circ(x, y, .6)); break;
        case "flowers": if (r < .5) add(r < .25 ? "flower" : "flower2", circ(x, y, .4)); else if (r < .6) add("spark", star(x, y, .7)); break;
        case "glowdots": if (r < .5) add("glowdot", circ(x, y, .35)); break;
        case "shards": if (r < .4) add("shard", `M${r1(x - .8)} ${r1(y)}l.5-2.6l.9-.4l.4 3Z`); break;
        case "toxic": if (r < .25) add("toxpool", ellipse(x, y, 1.4 + r * 3, .7 + r * 1.4)); else if (r < .4) add("bubble", circ(x, y, .5)); break;
        case "hazard": if (r < .05) add("hazard", trefoil(x, y, 1.6)); else if (r < .3) add("stones", circ(x, y, .5)); break;
        case "snow": if (r < .35) add("snowdot", circ(x, y, .45)); break;
        case "ash": if (r < .4) add("ash", circ(x, y, .45)); break;
        case "mist": if (r < .08 && !quiet) add("mist", `M${r1(x - 4)} ${r1(y)}q2-1.2 4 0t4 0`); break;
        case "fern": if (r < .2) add("fern", `M${r1(x)} ${r1(y)}q-1-1-2-1M${r1(x)} ${r1(y)}q1-1 2-1`); break;
        case "pool": if (r < .15) add("pool", ellipse(x, y, 1.8, .8)); break;
        case "flood": if (r < .25) add("pool", ellipse(x, y, 2.4, 1)); break;
      }
    });
    const f = famM(look); let s = "";
    for (const k of MARK_ORDER) { if (!D[k]) continue; const a = (MARK_STYLE[k][f] || "").replace(/INK/g, o.ink || "#3b2a1a"); if (!a) continue; s += `<path${LOD[k] ? ` class="${LOD[k]}"` : ""} d="${D[k]}" ${a} stroke-linecap="round" stroke-linejoin="round"/>`; }
    return s;
  }
  const ellipse = (x, y, a, b) => `M${r1(x + a)} ${r1(y)}a${r1(a)} ${r1(b)} 0 1 0 ${r1(-2 * a)} 0a${r1(a)} ${r1(b)} 0 1 0 ${r1(2 * a)} 0`;
  const quad = (x, y, w, h, rot) => { const ca = Math.cos(rot), sa = Math.sin(rot); return "M" + [[-w, -h], [w, -h * .9], [w * .95, h], [-w, h * 1.05]].map(([u, v]) => `${r1(x + u * ca - v * sa)} ${r1(y + u * sa + v * ca)}`).join("L") + "Z"; };
  const floe = (x, y, r) => { const w = 1.5 + r * 2.4; return `M${r1(x - w)} ${r1(y)}l${r1(w * .5)} ${r1(-w * .5)}l${r1(w)} ${r1(-w * .1)}l${r1(w * .5)} ${r1(w * .5)}l${r1(-w * .6)} ${r1(w * .4)}Z`; };
  const star = (x, y, s) => `M${r1(x)} ${r1(y - s)}L${r1(x + s * .25)} ${r1(y - s * .25)}L${r1(x + s)} ${r1(y)}L${r1(x + s * .25)} ${r1(y + s * .25)}L${r1(x)} ${r1(y + s)}L${r1(x - s * .25)} ${r1(y + s * .25)}L${r1(x - s)} ${r1(y)}L${r1(x - s * .25)} ${r1(y - s * .25)}Z`;
  const trefoil = (x, y, s) => { let d = circ(x, y, s * .25); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * 2.094, a0 = a - .45, a1 = a + .45; d += `M${r1(x + Math.cos(a0) * s * .4)} ${r1(y + Math.sin(a0) * s * .4)}L${r1(x + Math.cos(a0) * s)} ${r1(y + Math.sin(a0) * s)}A${r1(s)} ${r1(s)} 0 0 1 ${r1(x + Math.cos(a1) * s)} ${r1(y + Math.sin(a1) * s)}L${r1(x + Math.cos(a1) * s * .4)} ${r1(y + Math.sin(a1) * s * .4)}Z`; } return d; };

  /* ---- relief that is not a range: volcanoes, mesas and buttes, craters, stone pillars, floating mountains. Each is
          returned as [y, svg] to be drawn among the mountains, the nearer over the farther, and marks where it stands */
  function patchesOf(WD, N, code) {
    const G = WD.G, { cols, rows, cell } = G, out = [], seen = new Uint8Array(cols * rows);
    for (let n = 0; n < cols * rows; n++) {
      if (seen[n] || N.C[n] !== code) continue;
      const cells = [n]; seen[n] = 1;
      for (let h = 0; h < cells.length; h++) { const c = cells[h], i = c % cols, j = (c / cols) | 0; for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, j > 0 ? c - cols : -1, j < rows - 1 ? c + cols : -1]) if (m >= 0 && !seen[m] && N.C[m] === code) { seen[m] = 1; cells.push(m); } }
      let top = cells[0], sx = 0, sy = 0; for (const c of cells) { if (G.H[c] > G.H[top]) top = c; sx += c % cols; sy += (c / cols) | 0; }
      out.push({ cells, top: [((top % cols) + .5) * cell, (((top / cols) | 0) + .5) * cell], mid: [(sx / cells.length + .5) * cell, (sy / cells.length + .5) * cell], r: Math.sqrt(cells.length / Math.PI) * cell });
    }
    return out;
  }
  function relief(WD, look, N, pr, uid, mark, o) {
    const items = [], ink = look === "painted" ? "#2c2015" : o.ink || "#3b2a1a", painted = look === "painted", flat = look === "atlas" || look === "holo";
    const col = (pc, ic) => painted ? pc : ic;
    // volcanoes: a cone with its crater, lava down its sides, smoke above
    const skip = o.skip || new Set();
    for (const p of N.present.has(CODE.volcano) && !skip.has("volcano") ? patchesOf(WD, N, CODE.volcano) : []) {
      const [x, y0] = p.top, w = clamp(p.r * 1.25, 10, 46), h = w * .78, y = y0 + h * .35; mark(x, y, w, h);
      if (flat) { items.push([y, `<path d="M${r1(x)} ${r1(y - h * .6)}l${r1(w * .3)} ${r1(h * .55)}h${r1(-w * .6)}Z" fill="${look === "holo" ? "none" : "#c0392b"}" stroke="${look === "holo" ? "#ff6a2a" : "#7a2a1a"}" stroke-width=".8"/>`]); continue; }
      const cw = w * .2;
      let s = `<g class="wm-volc"><ellipse cx="${r1(x + w * .1)}" cy="${r1(y + 1)}" rx="${r1(w * 1.1)}" ry="${r1(h * .12)}" fill="#1a1410" fill-opacity=".25"/>`;
      s += `<path d="M${r1(x - w)} ${r1(y)}Q${r1(x - w * .45)} ${r1(y - h * .45)} ${r1(x - cw)} ${r1(y - h)}L${r1(x + cw)} ${r1(y - h)}Q${r1(x + w * .45)} ${r1(y - h * .45)} ${r1(x + w)} ${r1(y)}Z" fill="${col("#5a4c42", "#efe4c6")}" stroke="${ink}" stroke-width="${painted ? .7 : .8}"/>`;
      s += `<path d="M${r1(x + cw * .2)} ${r1(y - h)}L${r1(x + cw)} ${r1(y - h)}Q${r1(x + w * .45)} ${r1(y - h * .45)} ${r1(x + w)} ${r1(y)}L${r1(x + w * .2)} ${r1(y)}Q${r1(x + w * .1)} ${r1(y - h * .5)} ${r1(x + cw * .2)} ${r1(y - h)}Z" fill="${col("#2e2620", ink)}" fill-opacity="${painted ? .7 : .22}"/>`;
      s += `<ellipse cx="${r1(x)}" cy="${r1(y - h)}" rx="${r1(cw)}" ry="${r1(cw * .32)}" fill="${col("#ff7a2a", "#efe4c6")}" stroke="${ink}" stroke-width=".6"/>`;
      if (painted) s += `<path d="M${r1(x - cw * .5)} ${r1(y - h + 1)}q-1 ${r1(h * .25)} -3 ${r1(h * .4)}q-1 ${r1(h * .2)} -4 ${r1(h * .5)}M${r1(x + cw * .3)} ${r1(y - h + 1)}q2 ${r1(h * .3)} 1 ${r1(h * .55)}" fill="none" stroke="#ff8a2a" stroke-width="${r1(w * .05)}" stroke-linecap="round"/><path d="M${r1(x - cw * .5)} ${r1(y - h + 1)}q-1 ${r1(h * .25)} -3 ${r1(h * .4)}" fill="none" stroke="#ffd04a" stroke-width="${r1(w * .02)}" stroke-linecap="round"/>`;
      // the smoke, rising and drifting east
      const sw = w * .16; s += `<path d="M${r1(x)} ${r1(y - h - 1)}c${r1(-sw)} ${r1(-sw * 1.4)} ${r1(sw * 1.6)} ${r1(-sw * 2)} ${r1(sw * .6)} ${r1(-sw * 3.4)}c${r1(-sw)} ${r1(-sw * 1.2)} ${r1(sw * 2.4)} ${r1(-sw * 2)} ${r1(sw * 2)} ${r1(-sw * 3.4)}" fill="none" stroke="${col("#8a8480", ink)}" stroke-opacity="${painted ? .55 : .5}" stroke-width="${r1(painted ? sw * 1.1 : .8)}" stroke-linecap="round"/>`;
      items.push([y, s + `</g>`]);
    }
    // mesas and buttes: flat tops over banded cliffs, the broad ones mesas, the narrow buttes
    if (N.present.has(CODE.mesas) && !skip.has("mesas")) {
      const taken = [];
      lattice(WD.size[0], WD.size[1], 17, 12, 141, (x, y, r) => {
        if (N.covAt(x, y) !== CODE.mesas || r > .7 || taken.some(([a, b]) => Math.abs(a - x) < 16 && Math.abs(b - y) < 10)) return;
        taken.push([x, y]); const butte = r < .22, w = butte ? 3.5 + r * 8 : 8 + r * 10, h = butte ? 7 + r * 8 : 5 + r * 4; mark(x, y, w * 1.2, h);
        if (flat) { items.push([y, `<path d="M${r1(x - w)} ${r1(y)}l${r1(w * .25)} ${r1(-h)}h${r1(w * 1.5)}l${r1(w * .25)} ${r1(h)}" fill="none" stroke="${look === "holo" ? "#ffb05a" : "#a0603a"}" stroke-width=".6"/>`]); return; }
        // the table: a flat top a little uneven, sheer banded cliffs, a skirt of fallen rock at the foot
        const tw = w * .72, j = k => (hash(x, y, 140 + k) - .5) * w * .12, T0 = [x - tw + j(1), y - h], T1 = [x + tw + j(2), y - h + j(3) * .3];
        const sil = `M${r1(x - w * 1.25)} ${r1(y)}Q${r1(x - w * .95)} ${r1(y - h * .28)} ${r1(x - w * .88)} ${r1(y - h * .32)}L${r1(T0[0])} ${r1(T0[1])}L${r1(x - tw * .3)} ${r1(y - h - .4)}L${r1(x + tw * .4)} ${r1(y - h + .2)}L${r1(T1[0])} ${r1(T1[1])}L${r1(x + w * .9)} ${r1(y - h * .32)}Q${r1(x + w)} ${r1(y - h * .28)} ${r1(x + w * 1.25)} ${r1(y)}Z`;
        let s = `<ellipse cx="${r1(x + w * .2)}" cy="${r1(y + .6)}" rx="${r1(w * 1.3)}" ry="${r1(h * .14)}" fill="#26180f" fill-opacity=".2"/><path d="${sil}" fill="${col("#c46a3a", "#efe4c6")}" stroke="${ink}" stroke-width=".6" stroke-linejoin="round"/>`;
        s += `<path d="M${r1(x + tw * .35)} ${r1(y - h + .2)}L${r1(T1[0])} ${r1(T1[1])}L${r1(x + w * .9)} ${r1(y - h * .32)}Q${r1(x + w)} ${r1(y - h * .28)} ${r1(x + w * 1.25)} ${r1(y)}L${r1(x + w * .3)} ${r1(y)}Z" fill="${col("#6e2c14", ink)}" fill-opacity="${painted ? .5 : .18}"/>`;
        let bands = "", ribs = ""; for (let k = 1; k < 4; k++) { const yy = y - h * .32 - (h * .68) * k / 4; bands += `M${r1(x - w * .86 + k * .2)} ${r1(yy)}L${r1(x + w * .88)} ${r1(yy + j(k) * .2)}`; }
        for (let k = 0; k < 5; k++) { const xx = x - w * .7 + k * w * .35; ribs += `M${r1(xx)} ${r1(y - h + 1)}l${r1(j(k + 5) * .3)} ${r1(h * .6)}`; }
        s += `<path d="${bands}" fill="none" stroke="${col("#f2b27a", ink)}" stroke-opacity="${painted ? .55 : .35}" stroke-width=".5"/><path class="lod1" d="${ribs}" fill="none" stroke="${col("#5a2410", ink)}" stroke-opacity=".35" stroke-width=".4"/>`;
        s += `<path d="M${r1(T0[0])} ${r1(T0[1])}L${r1(x - tw * .3)} ${r1(y - h - .4)}L${r1(x + tw * .4)} ${r1(y - h + .2)}L${r1(T1[0])} ${r1(T1[1])}Q${r1(x)} ${r1(y - h + h * .16)} ${r1(T0[0])} ${r1(T0[1])}Z" fill="${col("#e0a868", "#f6eccf")}" stroke="${ink}" stroke-width=".45"/>`;
        items.push([y, s]);
      });
    }
    // craters: a rim lit on the far side, a shadowed bowl
    for (const p of N.present.has(CODE.crater) ? patchesOf(WD, N, CODE.crater) : []) {
      const [x, y] = p.mid, R = Math.max(5, p.r * .9);
      items.push([y - R, `<g class="wm-crater"><ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(R)}" ry="${r1(R * .78)}" fill="none" stroke="${flat ? (look === "holo" ? "#ffb05a" : "#8a7a5a") : col("#f0e2c0", ink)}" stroke-width="${r1(flat ? .8 : Math.max(1.2, R * .12))}" stroke-opacity="${flat ? .8 : .75}"/>${flat ? "" : `<path d="M${r1(x - R * .9)} ${r1(y - R * .1)}A${r1(R * .95)} ${r1(R * .74)} 0 0 1 ${r1(x + R * .9)} ${r1(y - R * .1)}" fill="none" stroke="${col("#3a2a1a", ink)}" stroke-opacity=".45" stroke-width="${r1(Math.max(.8, R * .08))}"/><ellipse cx="${r1(x)}" cy="${r1(y + R * .06)}" rx="${r1(R * .82)}" ry="${r1(R * .62)}" fill="none" stroke="${col("#5a4a32", ink)}" stroke-opacity=".5" stroke-width=".6"/>`}</g>`]);
    }
    // great stone formations: pillars and arches
    if (N.present.has(CODE.stones) && !flat) lattice(WD.size[0], WD.size[1], 9, 7, 151, (x, y, r) => {
      if (N.covAt(x, y) !== CODE.stones || r > .5) return; const h = 4 + r * 9, w = 1 + r * 1.4; mark(x, y, w * 2, h);
      const arch = r < .08; items.push([y, arch ? `<path d="M${r1(x - 5)} ${r1(y)}v-4q5-5 10 0v4h-2v-3q-3-3-6 0v3Z" fill="${col("#b89a72", "#efe4c6")}" stroke="${ink}" stroke-width=".5"/>` : `<path d="M${r1(x - w)} ${r1(y)}l${r1(w * .2)} ${r1(-h)}q${r1(w * .8)} -1 ${r1(w * 1.6)} 0l${r1(w * .2)} ${r1(h)}Z" fill="${col("#b89a72", "#efe4c6")}" stroke="${ink}" stroke-width=".5"/><path d="M${r1(x + w * .1)} ${r1(y - h)}q${r1(w * .7)} -.4 ${r1(w * .7)} 0l${r1(w * .2)} ${r1(h)}h${r1(-w * .9)}Z" fill="${col("#6a5034", ink)}" fill-opacity="${painted ? .5 : .2}"/>`]);
    });
    // floating mountains: rocks hanging in the air over their shadows, green on top, a waterfall falling from one
    if (N.present.has(CODE.floating) && !flat) lattice(WD.size[0], WD.size[1], 16, 12, 161, (x, y, r) => {
      if (N.covAt(x, y) !== CODE.floating || r > .6) return; const w = 4 + r * 7, hh = w * 1.1, lift = 6 + r * 6, cy = y - lift; mark(x, y, w, hh + lift);
      let s = `<ellipse cx="${r1(x + 2)}" cy="${r1(y + 1)}" rx="${r1(w * .9)}" ry="${r1(w * .22)}" fill="#1a1410" fill-opacity=".25"/>`;
      s += `<path d="M${r1(x - w)} ${r1(cy)}q${r1(w * .3)} ${r1(hh * .5)} ${r1(w * .8)} ${r1(hh)}q${r1(w * .3)} ${r1(-hh * .3)} ${r1(w * 1.2)} ${r1(-hh)}Z" fill="${col("#7a6248", "#efe4c6")}" stroke="${ink}" stroke-width=".55"/><path d="M${r1(x + w * .1)} ${r1(cy)}l${r1(-w * .3)} ${r1(hh)}q${r1(w * .3)} ${r1(-hh * .3)} ${r1(w * 1.2)} ${r1(-hh)}Z" fill="${col("#3a2a1a", ink)}" fill-opacity="${painted ? .5 : .2}"/>`;
      s += `<path d="M${r1(x - w * 1.05)} ${r1(cy)}q${r1(w * 1.05)} ${r1(-w * .5)} ${r1(w * 2.1)} 0q${r1(-w * 1.05)} ${r1(w * .3)} ${r1(-w * 2.1)} 0Z" fill="${col("#6f9a3a", "#f6eccf")}" stroke="${ink}" stroke-width=".5"/>`;
      if (painted) s += `<path d="${circ(x - w * .3, cy - w * .4, w * .22)}${circ(x + w * .3, cy - w * .35, w * .18)}" fill="#3d6834" stroke="#1e2f16" stroke-width=".3"/>`;
      if (r < .2) s += `<path d="M${r1(x + w * .6)} ${r1(cy + 1)}v${r1(lift)}" stroke="${col("#cfe8f0", ink)}" stroke-width=".8" stroke-opacity=".8"/>`;
      items.push([y, s]);
    });
    return items;
  }

  /* ---- rivers: what flows in them, deltas, waterfalls and rapids, springs */
  const LIQUID = { water: null, frozen: ["#d4e6ee", "#8aaabb", "#e8f2f6", "#9ad8ff"], lava: ["#ff6a1a", "#ffb03a", "#e0603a", "#ff6a2a"], glowing: ["#7ff0e0", "#c8fff6", "#5ad0d0", "#7ff0e0"], acid: ["#c8e040", "#eaff8a", "#b8d040", "#e8ff4a"], methane: ["#c07a30", "#f0b06a", "#c08a5a", "#f0a03a"], cursed: ["#2a3a30", "#7a8a7a", "#5a6a62", "#7af07a"], alien: ["#d050c0", "#ffa0f0", "#c070c0", "#ff4ae0"] };
  const liquidOfCover = { lava: "lava", acid: "acid", methane: "methane", alienliquid: "alien", glowwater: "glowing", cursedwater: "cursed", ice: "frozen" };
  function rivers(WD, look, N, pr, col, inkCol, wmul) {
    let s = "", deco = "", glow = "";
    const world = WD.T && WD.T.liquid ? (liquidOfCover[WD.T.liquid] || WD.T.liquid) : null, f = look === "painted" ? 0 : look === "atlas" ? 2 : look === "holo" ? 3 : 1;
    for (const rv of WD.rivers || []) if (rv.pts && rv.pts.length > 1) {
      const p = chaikin(rv.pts, 1, false), n = p.length, wd = (rv.w || 1.2) * (wmul || 1);
      // what flows in it: its own word, the world's, ice where most of it lies in the cold
      let liq = rv.liquid && rv.liquid !== "water" ? rv.liquid : world;
      if (!liq && N && !rv.liquid) { let cold = 0; for (let i = 0; i < n; i += 3) if (N.temp(p[i][0], p[i][1]) < .1) cold++; if (cold > n / 3 * .6) liq = "frozen"; }
      // (a small river through dry land runs only after rain: a dry bed, a wadi, drawn thin and broken; a great river fed
      // from wetter mountains flows on, as the Nile does)
      let eph = false; if (N && N.wet && !liq && wd * 1.29 < 2.6) { let dry = 0, k = 0; for (let i = 0; i < n; i += 3) { k++; if (N.wet(p[i][0], p[i][1]) < .17) dry++; } eph = dry > k * .6; }
      const L = liq && LIQUID[liq], c = L ? (f === 1 && look !== "parchment" && look !== "relief" ? inkCol || col : L[f === 1 ? 2 : f]) : col;
      for (let q = 0; q < 4; q++) {
        const a = Math.floor(q * (n - 1) / 4), b = Math.min(n - 1, Math.ceil((q + 1) * (n - 1) / 4)); if (b <= a) continue;
        const d = pathD(p.slice(a, b + 1)), w = wd * (.45 + q * .28);
        if (L && (liq === "lava" || liq === "glowing" || liq === "alien")) glow += `<path d="${d}" fill="none" stroke="${L[1]}" stroke-opacity=".35" stroke-width="${r1(w * 3.2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
        if (inkCol) s += `<path d="${d}" fill="none" stroke="${inkCol}" stroke-width="${r1(w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += eph ? `<path d="${d}" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="${r1(Math.max(.5, w * .6))}" stroke-dasharray="3 2" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="${d}" fill="none" stroke="${c}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      if (!pr) continue;
      // a delta, where a great river meets the sea over flat land: it breaks into arms fanning to the coast
      const last = p[n - 1], wEnd = wd * 1.29;
      if (wEnd >= 2.3 && n > 16 && pr.S(last[0], last[1]) <= pr.sea + 2) {
        const k = Math.max(0, n - 1 - Math.round(n * .08)), fork = p[k], ups = [p[Math.max(0, k - 4)]], flatLand = pr.t(fork[0], fork[1]) < .08 && pr.t(ups[0][0], ups[0][1]) < .12;
        if (flatLand) {
          const dx = last[0] - fork[0], dy = last[1] - fork[1], Lg = Math.hypot(dx, dy) || 1, ux = dx / Lg, uy = dy / Lg, spread = Math.max(8, Lg * .9);
          let arms = "", fan = "";
          for (const sgn of [-1, 1]) {
            let ex = last[0] + ux * 2 - uy * spread * sgn * .42, ey = last[1] + uy * 2 + ux * spread * sgn * .42;
            for (let g = 0; g < 6 && pr.S(ex, ey) > pr.sea; g++) { ex += ux * 2; ey += uy * 2; }
            const mx = (fork[0] + ex) / 2 + uy * sgn * spread * .12, my = (fork[1] + ey) / 2 - ux * sgn * spread * .12;
            arms += `M${r1(fork[0])} ${r1(fork[1])}C${r1(fork[0] + ux * spread * .3)} ${r1(fork[1] + uy * spread * .3)} ${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`;
          }
          fan = `M${r1(fork[0])} ${r1(fork[1])}L${r1(last[0] - uy * spread * .65 + ux * 4)} ${r1(last[1] + ux * spread * .65 + uy * 4)}L${r1(last[0] + uy * spread * .65 + ux * 4)} ${r1(last[1] - ux * spread * .65 + uy * 4)}Z`;
          if (look === "painted") deco += `<path d="${fan}" fill="#cdb67d" fill-opacity=".45" stroke="none"/>`;
          if (look === "atlas") deco += `<path d="${fan}" fill="#e7e3a6" fill-opacity=".5" stroke="none"/>`;
          if (inkCol) deco += `<path d="${arms}" fill="none" stroke="${inkCol}" stroke-width="${r1(wEnd * .45 + .7)}" stroke-linecap="round"/>`;
          deco += `<path d="${arms}" fill="none" stroke="${c}" stroke-width="${r1(wEnd * .45)}" stroke-linecap="round"/>`;
        }
      }
      // waterfalls and rapids: where the river drops steeply
      let lastFall = -1e9, dist = 0;
      for (let i = 2; i < n; i++) {
        const a = p[i - 2], b = p[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; dist += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        const drop = (pr.S(a[0], a[1]) - pr.S(b[0], b[1])) / seg; if (dist - lastFall < 26 || pr.S(b[0], b[1]) <= pr.sea + 2) continue;
        const ux = (b[0] - a[0]) / seg, uy = (b[1] - a[1]) / seg, w = wd * 1.2 + 1.5;
        if (drop > 2.2 && !liq) { lastFall = dist; deco += `<g class="wm-fall"><path d="M${r1(b[0] - uy * w)} ${r1(b[1] + ux * w)}L${r1(b[0] + uy * w)} ${r1(b[1] - ux * w)}" stroke="${f === 1 ? inkCol || "#3b2a1a" : "#2a2016"}" stroke-width=".7"/><path d="M${r1(b[0] - uy * w * .8 + ux)} ${r1(b[1] + ux * w * .8 + uy)}q${r1(ux * 2)} ${r1(uy * 2)} ${r1(ux * 3.5)} ${r1(uy * 3.5)}M${r1(b[0] + ux)} ${r1(b[1] + uy)}q${r1(ux * 2.2)} ${r1(uy * 2.2)} ${r1(ux * 4)} ${r1(uy * 4)}M${r1(b[0] + uy * w * .8 + ux)} ${r1(b[1] - ux * w * .8 + uy)}q${r1(ux * 2)} ${r1(uy * 2)} ${r1(ux * 3.5)} ${r1(uy * 3.5)}" fill="none" stroke="${f === 1 && look !== "relief" ? inkCol || "#3b2a1a" : "#f4fbff"}" stroke-width=".55" stroke-linecap="round"/></g>`; }
        else if (drop > 1.1 && !liq) { lastFall = dist - 12; deco += `<path class="lod1" d="M${r1(b[0] - uy * w * .7)} ${r1(b[1] + ux * w * .7)}l${r1(uy * w * 1.4)} ${r1(-ux * w * 1.4)}M${r1(b[0] + ux * 2 - uy * w * .6)} ${r1(b[1] + uy * 2 + ux * w * .6)}l${r1(uy * w * 1.2)} ${r1(-ux * w * 1.2)}" stroke="${f === 1 ? inkCol || "#3b2a1a" : "#eaf6fa"}" stroke-width=".45" stroke-linecap="round"/>`; }
      }
      // its spring
      if (f !== 3 && !eph) deco += `<circle class="lod2" cx="${r1(p[0][0])}" cy="${r1(p[0][1])}" r="${r1(wd * .7 + .4)}" fill="${c}" stroke="${inkCol || "none"}" stroke-width=".35"/>`;
    }
    return glow + s + deco;
  }

  /* ---- the survey's zones and the atlas's land cover: each kind outlined (and, on the survey, hatched in its colour),
          and a key of what is where */
  function zones(WD, look, N, uid) {
    if (!N.present.size) return { svg: "", key: [] };
    let defs = "", s = ""; const key = [];
    const HATCH = ["M0 4L4 0", "M0 0L4 4", "M2 0V4", "M0 2H4", "M1 1h.4M3 3h.4", "M0 4L4 0M0 0L4 4"];
    for (const code of [...N.present].sort((a, b) => a - b)) {
      const b = B[BIO.LIST[code][0]], c = P[b.id]; if (!c) continue;
      const rings = coverRings(WD, N, code); if (!rings.length) continue;
      const d = rings.map(r => pathD(r, true)).join(""), hc = "#" + c[2].map(q => Math.round(clamp(q, 0, 255)).toString(16).padStart(2, "0")).join("");
      if (look === "holo") {
        defs += `<pattern id="${uid}-z${code}" patternUnits="userSpaceOnUse" width="4" height="4"><path d="${HATCH[code % HATCH.length]}" stroke="${hc}" stroke-width=".45" stroke-opacity=".55"/></pattern>`;
        s += `<path class="lod1" d="${d}" fill="url(#${uid}-z${code})" stroke="none"/><path d="${d}" fill="none" stroke="${hc}" stroke-opacity=".75" stroke-width=".7" stroke-dasharray="3 1.5"/>`;
      } else if (look === "atlas" && ["glacier", "saltflat", "drylake", "reef", "marsh", "bog", "volcanic", "crater", "ice"].includes(b.id)) {
        s += `<path d="${d}" fill="none" stroke="${{ glacier: "#7ab0d0", ice: "#7ab0d0", reef: "#5aaac8", marsh: "#4a8ac0", bog: "#4a8ac0" }[b.id] || "#a08a6a"}" stroke-opacity=".7" stroke-width=".5" stroke-dasharray="${b.id === "glacier" || b.id === "ice" ? "" : "2 1.4"}"/>`;
      }
      key.push([b.name.replace(/ \(.*\)$/, ""), hc, "#" + c[1].map(q => Math.round(clamp(q, 0, 255)).toString(16).padStart(2, "0")).join("")]);
    }
    return { svg: (defs ? `<defs>${defs}</defs>` : "") + s, key };
  }
  function keyBox(WD, look, key, corner, ink) {
    if (!key.length) return "";
    const [W, H] = WD.size, rows = key.slice(0, 12), lw = Math.min(W * .3, 40 + Math.max(...rows.map(k => k[0].length)) * 5.6), lh = 22 + rows.length * 12.5;
    const x = corner[0] > W / 2 ? 14 : W - 14 - lw, y = corner[1] > H / 2 ? 14 : H - 14 - lh, holo = look === "holo";
    return `<g class="wm-legend wm-key"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(lw)}" height="${r1(lh)}" fill="${holo ? "#02131c" : "#ffffff"}" fill-opacity="${holo ? .85 : .9}" stroke="${ink}" stroke-width="${holo ? .8 : .6}"/>`
      + `<text x="${r1(x + 8)}" y="${r1(y + 14)}" class="wm-lgt" fill="${ink}" font-size="10">${holo ? "SURVEY ZONES" : "Land cover"}</text>`
      + rows.map(([n, hc, ac], i) => `<rect x="${r1(x + 8)}" y="${r1(y + 20 + i * 12.5)}" width="12" height="8" fill="${holo ? "none" : ac}" stroke="${holo ? hc : "#8a8a8a"}" stroke-width=".7"/><text x="${r1(x + 25)}" y="${r1(y + 27 + i * 12.5)}" class="wm-lgi" fill="${ink}" font-size="8.5">${A.esc ? A.esc(holo ? n.toUpperCase() : n) : n}</text>`).join("") + `</g>`;
  }

  A.worldNature = { patchesOf, prep, ground, TINT, edgeA, MTN, ROCK, HILL, natGrid, mtnKind, trees, marks, relief, rivers, zones, keyBox, coverRings, P, TREES };
})(ATLAS);
