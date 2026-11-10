/* The star system map (the galaxy plan of 5 Nov 2026, approved 10 Nov: section 6). A star clicked on the chart flies
   into it, and its system opens across the whole chart:
   - its star drawn by its kind, in pixel art: a red dwarf with its flares, a white dwarf small and hard, a giant
     swollen, a neutron star's beams, a black hole dark in the ring of light it bends, a brown dwarf dim and banded;
   - a second star where it has one, as the pair truly stand: a close pair circling each other with the worlds going
     round both, or a companion far out with the worlds keeping to the brighter star, each only where such orbits last
     [round both beyond about 3.5 times the pair's separation; round one within about a quarter of the distance between
     them: Holman & Wiegert 1999]. For a galaxy made before companions were worked out, the companion is worked out here
     from the system's own worlds, the same every time, so that every world it has keeps a lasting orbit;
   - each world in pixel art (atlas-pixelplanet.js), lit from its own star's side, on its true orbit (its distance and
     its stretch), where it stands on the campaign's date: worked out from its year [Kepler's equation], the same day
     always the same place; its large moons round it, its small ones as tumbling rocks when one comes close; its rings;
   - the belts, the stations, colonies, mines, wrecks and anomalies, the game master's own places, and the party's ship;
   - where water could be liquid [the habitable zone by the star's light: Kopparapu 2013] and the frost line.
   Two ways to look: exploration (the default: distances squeezed, worlds drawn large enough to know and click, marked
   "not to scale") and true scale (the real distances, a scale bar, the worlds specks with a ring to click). Motion if
   wished: the worlds go round at their real relative speeds and stop while the pointer is over one. Switches: orbits,
   names, stations and places, where water is liquid. Names never overlap. A world clicked opens its card in the side
   (atlas-galaxy.js), with its whole profile, its survey sheet and its surface to open. Esc or "← The galaxy" goes back
   to the chart as it was left. Everything is drawn from what the chart already has; nothing about a system changes. */
(function (A) {
  "use strict";
  if (!A || typeof document === "undefined") return;
  const TAU = Math.PI * 2, esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const hstr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const h01 = s => hstr(s) / 4294967296;
  const rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const hex = s => { s = String(s || "#888888"); if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]; return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]; };
  const rgb = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const AU_KM = 149.6e6, EARTH_AU = 1 / 23481, SUN_AU = .00465;
  const r2 = v => Math.round(v * 100) / 100, sig = (v, n) => +(+v).toPrecision(n || 3);

  /* ---- the stars by kind: colour, size drawn in the exploration view (px), radius (Suns) */
  const STAR = { O: ["#9bb0ff", 44, 10], B: ["#aabfff", 38, 4], A: ["#cad7ff", 32, 1.8], F: ["#f8f7ff", 29, 1.3], G: ["#fff4ea", 27, 1], K: ["#ffd2a1", 24, .75], M: ["#ffad74", 19, .35],
    R: ["#ffb26b", 72, 40], D: ["#e8eaff", 9, .012], N: ["#c7d2ff", 7, .000014], X: ["#2a1238", 18, .00003], L: ["#d2693c", 13, .1], T: ["#a3527a", 12, .1], Y: ["#7a5a92", 11, .1] };
  const NAMES = { L: "a brown dwarf, warm", T: "a brown dwarf, cool", Y: "a brown dwarf, the coldest kind", R: "a red giant" };
  const starName = c => ((A.galaxyGen && A.galaxyGen.STAR_NAME) || {})[c] || NAMES[c] || "a star";
  const byMass = m => m > 16 ? "O" : m > 2.1 ? "B" : m > 1.4 ? "A" : m > 1.04 ? "F" : m > .8 ? "G" : m > .45 ? "K" : m > .075 ? "M" : m > .06 ? "L" : m > .03 ? "T" : "Y";

  /* ---- a second star. A galaxy whose systems carry their companion (info.star.companion) is drawn as it says; one made
          before companions were worked out has only a mark that a companion is there, and it is worked out here from
          the system's own worlds: a close pair only if its innermost world lies far enough out to go round both; a far
          companion beyond four times its outermost orbit, so every world keeps the orbit it has */
  function companion(s, info) {
    const st = info.star || {}; if (st.companion) return st.companion; if (!st.binary) return null;
    const r = rng(hstr(s.id + "|companion")), P = info.planets || [], M1 = st.mass || 1, rem = /^[DNX]$/.test(st.cls);
    const peri = p => p.a * (1 - (p.ecc || 0)), apo = p => p.a * (1 + (p.ecc || 0));
    const aIn = P.length ? Math.min(...P.map(peri)) : .4, aOut = Math.max(P.length ? Math.max(...P.map(apo)) : .4, ...(info.belts || []).map(b => b.a * 1.12));
    const close = r() < .32 && aIn > .12;
    const M2 = rem ? .1 + r() * .6 : Math.max(.02, M1 * (close ? .08 + r() * .3 : .1 + r() * .75)), cls = byMass(M2);
    const e = close ? .02 + r() * .18 : .1 + r() * .5;
    const a = close ? Math.max(.008, aIn / (3.6 + r() * 2.4)) : Math.max(aOut * 4.2 / (1 - e), 8 + r() * 30) * (1 + r() * 1.5);
    return { cls, mass: r2(M2), color: STAR[cls][0], a: sig(a), ecc: r2(e), P: Math.sqrt(a ** 3 / (M1 + M2)) * 365.25, both: close, w: r() * TAU, M0: r() * TAU, name: starName(cls), worked: true };
  }
  const yrs = d => d >= 730 ? `${Math.round(d / 365.25).toLocaleString("en")} years` : d >= 2 ? `${Math.round(d)} days` : `${Math.round(d * 24)} hours`;
  function companionSay(c, main) {
    if (!c) return "";
    return c.both ? `A close pair: ${main || "its star"} and ${c.name} go round each other every ${yrs(c.P)}, ${c.a} AU apart; its worlds go round both, far enough out for their orbits to last.`
      : `A companion, ${c.name}, goes round it ${Math.round(c.a).toLocaleString("en")} AU out, once in ${yrs(c.P)}; its worlds keep to the brighter star, well inside the quarter of that distance where their orbits last.`;
  }

  /* ---- orbits: where a body stands on a day [Kepler's equation], from its distance, stretch and year; the turn of its
          long axis and where it was on the campaign's first day from its own name in the chart, so always the same */
  function kepler(M, e) { let E = e < .8 ? M : Math.PI; for (let i = 0; i < 14; i++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-8) break; } return E; }
  function orbit(key, a, e, P) { return { a, e: clamp(e || 0, 0, .95), w: h01(key + "|w") * TAU, M0: h01(key + "|m") * TAU, P: Math.max(.02, P || 1) }; }
  function along(o, E) { const x = o.a * (Math.cos(E) - o.e), y = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E), c = Math.cos(o.w), s = Math.sin(o.w); return [x * c - y * s, x * s + y * c]; }
  function posAt(o, t) { const M = ((o.M0 + TAU * t / o.P) % TAU + TAU) % TAU; return along(o, kepler(M, o.e)); }
  const today = () => A.worldTime ? A.worldTime.now() / 1440 : 0;
  // where water could be liquid on a world's surface (the conservative habitable zone: runaway greenhouse to maximum
  // greenhouse, Kopparapu 2013, by the star's light alone)
  const habZone = L => L > 0 ? [Math.sqrt(L / 1.107), Math.sqrt(L / .356)] : null;

  /* ---- pixel art: the star by its kind; a small moon's rock; the icons of what people put there */
  const STARPIX = new Map();
  function starSprite(cls, N, flares, phase) {
    const key = cls + "|" + N + "|" + (flares ? phase % 4 : 0); let cv = STARPIX.get(key); if (cv) return cv;
    const base = hex((STAR[cls] || STAR.G)[0]), M = N + 4, img = new ImageData(M, M), seed = hstr(cls), R = N / 2, c = M / 2;
    const n2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), f = t => t * t * (3 - 2 * t), u = f(x - xi), v = f(y - yi), h = (a, b) => hstr(a * 7919 + b * 104729 + seed) / 4294967296; return h(xi, yi) * (1 - u) * (1 - v) + h(xi + 1, yi) * u * (1 - v) + h(xi, yi + 1) * (1 - u) * v + h(xi + 1, yi + 1) * u * v; };
    const put = (i, j, col, a) => { if (i < 0 || j < 0 || i >= M || j >= M) return; const o = (j * M + i) * 4; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = a == null ? 255 : a; };
    const brown = cls === "L" || cls === "T" || cls === "Y", giant = cls === "R", hole = cls === "X";
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
      const x = (i + .5 - c) / R, y = (j + .5 - c) / R, d2 = x * x + y * y;
      if (hole) {
        // the black hole: dark, in the thin ring of light bent round it
        const d = Math.sqrt(d2);
        if (d < .62) put(i, j, [4, 2, 8]); else if (d < .86) put(i, j, [255, 214, 160], Math.round(255 * (1 - Math.abs(d - .74) / .12)));
        continue;
      }
      if (d2 > 1) continue;
      const mu = Math.sqrt(1 - d2), cells = giant ? n2(x * 3.2 + 9, y * 3.2) : brown ? .5 + .5 * Math.sin((y + n2(x * 2, y * 2) * .3) * 9) : n2(x * 6 + 3, y * 6);
      // the light falls off towards the edge [limb darkening]; the middle near white-hot; a giant's great cells, a brown
      // dwarf's bands of cloud
      const limb = (giant ? .45 : .62) + (giant ? .55 : .38) * mu, hot = brown ? .05 : clamp(mu * .55, 0, .5);
      let col = base.map(v => clamp((v + (255 - v) * hot) * limb * ((giant ? .78 : brown ? .82 : .92) + cells * (giant ? .35 : brown ? .3 : .12)), 0, 255));
      if (brown) col = col.map(v => v * .8);
      put(i, j, col);
    }
    // a red dwarf's flares: bright knots at its edge
    if (flares && cls === "M") { const r = rng(seed + phase); for (let k = 0; k < 3; k++) { const a = r() * TAU, rr = R + 1; put(Math.round(c + Math.cos(a) * rr - .5), Math.round(c + Math.sin(a) * rr - .5), [255, 240, 220]); if (r() < .6) put(Math.round(c + Math.cos(a) * (rr + 1) - .5), Math.round(c + Math.sin(a) * (rr + 1) - .5), [255, 200, 160], 200); } }
    cv = document.createElement("canvas"); cv.width = cv.height = M; cv.getContext("2d").putImageData(img, 0, 0);
    STARPIX.set(key, cv); if (STARPIX.size > 60) STARPIX.delete(STARPIX.keys().next().value);
    return cv;
  }
  const ROCKS = new Map();
  function rock(seed, N, lx, ly) {
    const key = seed + "|" + N + "|" + Math.round(Math.atan2(ly, lx) / (TAU / 12)); let cv = ROCKS.get(key); if (cv) return cv;
    const r = rng(seed), img = new ImageData(N, N), R = N / 2, lumps = [r(), r(), r(), r(), r()];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i + .5 - R) / R, y = (j + .5 - R) / R, a = Math.atan2(y, x), edge = .7 + .3 * lumps[Math.floor(((a + Math.PI) / TAU) * 5) % 5];
      if (Math.hypot(x, y) > edge) continue;
      const lit = clamp(.45 + (x * lx + y * ly) * .7, .2, 1.1), o = (j * N + i) * 4, g = 150 + r() * 20;
      img.data[o] = g * lit; img.data[o + 1] = g * .93 * lit; img.data[o + 2] = g * .85 * lit; img.data[o + 3] = 255;
    }
    cv = document.createElement("canvas"); cv.width = cv.height = N; cv.getContext("2d").putImageData(img, 0, 0);
    ROCKS.set(key, cv); if (ROCKS.size > 200) ROCKS.delete(ROCKS.keys().next().value);
    return cv;
  }
  // what people put there, as pixel icons (7 by 7, each pixel two of the screen's)
  const ICON = {
    station: ["..###..", ".#...#.", "#..#..#", "#.###.#", "#..#..#", ".#...#.", "..###.."],
    orbital: ["#.....#", "##...##", "..###..", "..#.#..", "..###..", "##...##", "#.....#"],
    colony: [".......", "..###..", ".#####.", "##.#.##", "#######", "#######", "......."],
    settlement: ["...#...", "..###..", ".#####.", ".#.#.#.", ".#####.", ".#####.", "......."],
    mining: ["...#...", "..###..", ".##.##.", "##...##", ".##.##.", "..###..", "...#..."],
    research: ["#.....#", ".#...#.", "..#.#..", "...#...", "...#...", "..###..", ".#####."],
    derelict: [".......", "##.....", ".###...", "..##.#.", "...#.##", ".....##", "......."],
    anomaly: ["..###..", ".#...#.", ".....#.", "...##..", "...#...", ".......", "...#..."],
    ruin: [".......", "#.#....", "#.#.#..", "###.#.#", "#.###.#", "#######", "......."],
    other: ["...#...", "...#...", ".#####.", "...#...", "...#...", ".......", "......."],
    place: ["..###..", ".#####.", ".##.##.", ".#####.", "..###..", "...#...", "...#..."],
    ship: ["...#...", "..###..", "..#.#..", ".#####.", "##.#.##", "#..#..#", "...#..."] };
  const ICOL = { station: "#9fd3ff", orbital: "#9fd3ff", colony: "#8fe39a", settlement: "#e8d48a", mining: "#e0b26a", research: "#c9a7ff", derelict: "#b8a894", anomaly: "#ff7ad9", ruin: "#c8b08a", other: "#dddddd", place: "#ffd166", ship: "#7fe0c0" };
  const IKIND = { station: "a station", orbital: "an orbital facility", colony: "a colony", settlement: "a settlement", mining: "a mining installation", research: "a research facility", derelict: "a derelict ship", anomaly: "an anomaly", ruin: "ruins", other: "something else", place: "one of your places", ship: "the party's ship" };
  const ICONS = new Map();
  function iconSprite(kind) {
    let cv = ICONS.get(kind); if (cv) return cv;
    const B = ICON[kind] || ICON.other, col = hex(ICOL[kind] || ICOL.other), N = 9, img = new ImageData(N, N);
    const on = (i, j) => j >= 0 && j < 7 && i >= 0 && i < 7 && B[j][i] === "#";
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const o = (j * N + i) * 4, x = i - 1, y = j - 1;
      if (on(x, y)) { img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; }
      else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { img.data[o + 3] = 190; }   // a dark edge, to read over anything
    }
    cv = document.createElement("canvas"); cv.width = cv.height = N; cv.getContext("2d").putImageData(img, 0, 0); ICONS.set(kind, cv); return cv;
  }
  // a world's picture, lit from its star's side (atlas-pixelplanet.js), kept for each side it is lit from
  const PIX = new Map();
  function worldSprite(p, N, star, ang) {
    const b = ((Math.round(ang / (TAU / 24)) % 24) + 24) % 24, key = [p.name, p.kind, p.n, p.pn, N, b, star, p.ocean, p.liquid, A.pixelPlanet.heightOf && A.pixelPlanet.heightOf(p) ? 1 : 0].join("|");
    let cv = PIX.get(key); if (cv) return cv;
    const a = b * TAU / 24, L = [Math.cos(a) * .9, Math.sin(a) * .9, .42];
    cv = A.pixelPlanet.canvasOf(p, N, .6 + (p.n || 0) * .9, star, L);
    PIX.set(key, cv); if (PIX.size > 260) PIX.delete(PIX.keys().next().value);
    return cv;
  }

  /* ---- the map's own state */
  const LAY0 = { orbits: true, names: true, sites: true, water: true };
  let LAY = Object.assign({}, LAY0); try { Object.assign(LAY, JSON.parse(localStorage.getItem("atlas-ss-layers") || "{}")); } catch (e) { /* the page works without it */ }
  const keepLay = () => { try { localStorage.setItem("atlas-ss-layers", JSON.stringify(LAY)); } catch (e) { /* kept only for this visit */ } };
  let M = null;   // the open map: { el, cv, ctx, s, info, api, scene, mode, z, px, py, motion, t, ... }

  /* ---- the scene: every body with its orbit, worked out once when the map opens */
  function sceneOf(s, info, api) {
    const st = info.star || {}, comp = companion(s, info), M1 = st.mass || 1, Mt = M1 + (comp && comp.both ? comp.mass : 0);
    const year = a => Math.sqrt(Math.max(1e-6, a) ** 3 / Mt) * 365.25;
    const B = [];
    const worlds = (info.planets || []).map(p => ({ k: "p" + p.n, type: "world", p, o: orbit(s.id + "|" + p.n, p.a, p.ecc, p.year ? p.year * 365.25 : year(p.a)), giant: /gas|ice|mini/.test(p.env || "") || ["gas", "icegiant", "hotjupiter", "mini"].includes(p.kind) }));
    for (const w of worlds) {
      B.push(w);
      w.moons = (w.p.moonList || []).map(m => ({ k: w.k + "m" + m.n, type: m.small ? "rock" : "moon", m, host: w, o: orbit(s.id + "|" + w.p.n + "|m" + m.n, (m.distance || m.a || 1e5) / AU_KM, 0, m.period || 10) }));
      for (const m of w.moons) B.push(m);
    }
    const belts = (info.belts || []).map((b, i) => ({ k: "b" + (b.k != null ? b.k : i), type: "belt", b, P: year(b.a) }));
    B.push(...belts);
    // the world that suits people best: where a station is put, the ship parked
    const rank = { Habitable: 0, "Marginal: domes and suits": 1, Hostile: 2, Uninhabitable: 3 };
    const host = worlds.find(w => (info.sites || []).some(t => t.on === w.p.n && /colony|settlement/.test(t.kind))) || worlds.slice().sort((a, b) => (rank[a.p.hab] == null ? 3 : rank[a.p.hab]) - (rank[b.p.hab] == null ? 3 : rank[b.p.hab]) || Math.abs(Math.log(a.p.a)) - Math.abs(Math.log(b.p.a)))[0] || null;
    const hz = habZone(st.lum), aIn = worlds.length ? Math.min(...worlds.map(w => w.o.a * (1 - w.o.e))) : hz ? hz[0] : .5;
    const aOut = Math.max(worlds.length ? Math.max(...worlds.map(w => w.o.a * (1 + w.o.e))) : hz ? hz[1] : 1, ...belts.map(b => b.b.a * 1.12));
    // what people put in open space: a station at the leading point 60 degrees ahead of the best world [its L4], a mine
    // in the belt, the rest on orbits of their own; on a world, beside it
    const own = [];
    let nOpen = 0;
    for (const t of info.sites || []) {
      const x = { k: "s" + t.k, type: "site", t, kind: ICON[t.kind] ? t.kind : "other" };
      if (t.on != null) x.on = worlds.find(w => w.p.n === t.on) || null;
      if (!x.on) {
        // (one the game master put at an orbit of its own, where they clicked: there, on the campaign's date)
        if (t.a > 0) { x.o = orbit(s.id + "|site" + t.k, +t.a, 0, year(+t.a)); if (t.ph != null) { x.o.w = 0; x.o.M0 = +t.ph - TAU * today() / x.o.P; } }
        else if (/station|orbital|settlement|colony/.test(t.kind) && host) x.o = Object.assign({}, host.o, { M0: host.o.M0 + Math.PI / 3 + nOpen++ * .12 });
        else if (t.kind === "mining" && belts.length) x.o = orbit(s.id + "|site" + t.k, belts[0].b.a, .02, belts[0].P);
        else { const a = aIn + h01(s.id + "|sa" + t.k) * (aOut * 1.15 - aIn); x.o = orbit(s.id + "|site" + t.k, a, .05, year(a)); }
      }
      own.push(x);
    }
    // (the game master's own places with no world of their own are in the system's station, listed beside it; with no
    // station, on the world that suits people best; the party's ship docked at the station, or beside that world)
    const st0 = own.find(x => x.type === "site" && /station|orbital/.test(x.kind) && !x.on);
    if (api && api.shipHere && api.shipHere(s.id)) { const x = { k: "ship", type: "ship", kind: "ship", name: api.shipName ? api.shipName() : "The ship" }; if (st0) x.near = st0; else if (host) x.on = host; else x.o = orbit(s.id + "|ship", aIn, 0, year(aIn)); own.push(x); }
    for (const pl of (api && api.places ? api.places(s.id) : [])) {
      // (a place that is a station's or a site's own inside: the site opens it, no second mark)
      if (pl.site != null) { const st = own.find(o => o.type === "site" && o.t.k === pl.site); if (st) { st.place = pl.id; continue; } }
      const x = { k: "g" + pl.id, type: "place", pl, kind: "place" };
      if (pl.planet != null) x.on = worlds.find(w => w.p.n === +pl.planet) || null;
      if (!x.on) { if (st0) x.near = st0; else if (host) x.on = host; else x.o = orbit(s.id + "|pl" + pl.id, (aIn + aOut) / 2, 0, year((aIn + aOut) / 2)); }
      own.push(x);
    }
    B.push(...own);
    const compO = comp && !comp.both ? { a: comp.a, e: clamp(comp.ecc || 0, 0, .95), w: comp.w || 0, M0: comp.M0 || 0, P: comp.P } : null;
    // (a third star the game master set, far out round the pair)
    const comp2 = st.companion2 || null, comp2O = comp2 ? { a: comp2.a, e: clamp(comp2.ecc || 0, 0, .95), w: comp2.w || 0, M0: comp2.M0 || 0, P: comp2.P } : null;
    return { s, info, st, comp, compO, comp2, comp2O, M1, Mt, worlds, belts, own, B, host, hz, aIn, aOut, frost: st.frost || 2.7 * Math.sqrt(Math.max(st.lum || 1, .0005)) };
  }

  /* ---- where things are drawn: the exploration view squeezes distance (a logarithm, so the inner worlds have room);
          true scale is the distance itself. Both radial, so an orbit keeps its shape about its star */
  function layout() {
    const S = M.scene, W = M.cv.clientWidth, H = M.cv.clientHeight, cls = S.st.cls || "G", D = (STAR[cls] || STAR.G)[1];
    const pair = S.comp && S.comp.both ? (STAR[S.comp.cls] || STAR.M)[1] : 0;
    const R0 = (pair ? D / 2 + pair + 10 : D / 2) + 14, room = Math.max(60, Math.min(W, H) / 2 - 34);
    let dmax = S.aOut; if (S.comp && !S.comp.both) dmax = Math.max(dmax, S.comp.a * (1 + (S.comp.ecc || 0))); if (S.comp2) dmax = Math.max(dmax, S.comp2.a * (1 + (S.comp2.ecc || 0)));
    const d0 = clamp(S.aIn * .45, .004, 6);
    M.L = { W, H, D, pair, R0, d0, Kx: (room - R0) / Math.log(1 + dmax / d0), Kt: room / Math.max(1e-4, S.aOut * 1.04) };
  }
  // a distance from the star (AU) to the map's radius in px, before the zoom
  const rad = d => M.mode === "true" ? d * M.L.Kt : M.L.R0 + M.L.Kx * Math.log(1 + Math.max(0, d) / M.L.d0);
  const toMap = (x, y) => { const d = Math.hypot(x, y); if (d < 1e-12) return [0, 0]; const r = rad(d); return [x / d * r, y / d * r]; };
  const toScr = (mx, my) => [M.L.W / 2 + (mx - M.px) * M.z, M.L.H / 2 + (my - M.py) * M.z];
  const at = (x, y) => { const [mx, my] = toMap(x, y); return toScr(mx, my); };
  // how big a world is drawn: by its size in the exploration view (a little larger the closer one comes); its true size,
  // or a speck, at true scale
  const grow = () => clamp(Math.pow(M.z, .35), 1, 3.2);
  function worldPx(p) {
    if (M.mode === "true") return Math.max(2.4, (p.radius || p.size || 1) * EARTH_AU * M.L.Kt * M.z * 2);
    return clamp(16 + 10 * Math.log2(1 + (p.radius || p.size || 1)), 15, 62) * grow();
  }
  function starPx(cls) {
    if (M.mode === "true") return Math.max(5, ((STAR[cls] || STAR.G)[2]) * SUN_AU * M.L.Kt * M.z * 2);
    return (STAR[cls] || STAR.G)[1] * clamp(Math.pow(M.z, .2), 1, 1.8);
  }

  /* ---- a frame */
  let raf = 0;
  const request = () => { if (!raf && M) raf = requestAnimationFrame(t => { raf = 0; frame(t); }); };
  function frame(now) {
    if (!M || !M.el.isConnected) return;
    const cv = M.cv, ctx = M.ctx, dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    if (M.L.W !== W || M.L.H !== H) layout();
    // (the time shown: the campaign's day, and the days run on while the worlds move)
    if (M.motion && !M.hold && M.last) M.t += (now - M.last) / 1000 * M.rate;
    M.last = M.motion ? now : 0;
    const t = today() + M.t, S = M.scene;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
    // the dark, and the far stars behind (the same each time)
    ctx.fillStyle = "#04060b"; ctx.fillRect(0, 0, W, H);
    { const r = rng(hstr(S.s.id + "|sky")); for (let k = 0; k < 260; k++) { const x = r() * W, y = r() * H, b = r(); ctx.fillStyle = `rgba(210,220,255,${(.08 + b * b * .5).toFixed(2)})`; ctx.fillRect(x, y, b > .93 ? 2 : 1, b > .93 ? 2 : 1); } }
    const [cx, cy] = toScr(0, 0), sel = M.api && M.api.sel ? M.api.sel() : {}, selK = sel.planet != null ? "p" + sel.planet : null;
    // where water could be liquid, and the frost line
    if (LAY.water && S.hz) {
      const r1 = rad(S.hz[0]) * M.z, r2_ = rad(S.hz[1]) * M.z;
      ctx.fillStyle = "rgba(80,200,120,.10)"; ctx.beginPath(); ctx.arc(cx, cy, r2_, 0, TAU); ctx.arc(cx, cy, r1, 0, TAU, true); ctx.fill();
      ctx.strokeStyle = "rgba(110,220,150,.32)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r1, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r2_, 0, TAU); ctx.stroke();
      const rf = rad(S.frost) * M.z; ctx.strokeStyle = "rgba(150,200,255,.28)"; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.arc(cx, cy, rf, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    // the orbits, their true shapes
    if (LAY.orbits) for (const w of S.worlds) {
      ctx.strokeStyle = w.k === selK ? "rgba(220,232,255,.75)" : "rgba(150,172,210,.26)"; ctx.lineWidth = w.k === selK ? 1.4 : 1; ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const [x, y] = along(w.o, i / 120 * TAU), [sx, sy] = at(x, y); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }
      ctx.stroke();
    }
    // the belts: a scatter of rocks, going round
    for (const b of S.belts) {
      const r = rng(hstr(S.s.id + "|belt" + b.k)), rot = TAU * t / b.P, icy = b.b.icy, n = 380;
      for (let k = 0; k < n; k++) {
        const a = r() * TAU + rot, d = b.b.a * (1 + (r() + r() + r() - 1.5) * .09), gold = b.b.rich && r() < .07, [sx, sy] = at(Math.cos(a) * d, Math.sin(a) * d), big = r() < .12;
        if (sx < -4 || sy < -4 || sx > W + 4 || sy > H + 4) continue;
        ctx.fillStyle = gold ? "rgba(236,196,106,.85)" : icy ? "rgba(200,214,236,.55)" : "rgba(168,150,128,.6)"; ctx.fillRect(sx, sy, big ? 2 : 1, big ? 2 : 1);
      }
    }
    const HIT = [], LBL = [];
    // the stars: alone, as a close pair round their middle, or with a companion far out
    const drawStar = (cls, x, y, flares, name, key) => {
      const D = starPx(cls), col = hex((STAR[cls] || STAR.G)[0]), hole = cls === "X";
      const gR = D * (cls === "D" || cls === "N" ? 3.4 : hole ? 2.2 : 1.7), g = ctx.createRadialGradient(x, y, D * .3, x, y, gR);
      g.addColorStop(0, rgb(hole ? [255, 190, 130] : col, hole ? .25 : .5)); g.addColorStop(1, rgb(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, gR, 0, TAU); ctx.fill();
      if (hole) {
        // the disc of what falls in, tilted; its far side bent up over the top by the hole's pull
        ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "rgba(255,200,140,.75)"; ctx.lineWidth = Math.max(1.5, D * .12); ctx.beginPath(); ctx.ellipse(0, 0, D * 1.25, D * .32, 0, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = "rgba(255,220,170,.55)"; ctx.beginPath(); ctx.ellipse(0, -D * .05, D * .78, D * .62, 0, Math.PI, TAU); ctx.stroke(); ctx.restore();
      }
      if (cls === "N") { const a = (M.motion ? t * 40 : .7); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = "rgba(190,210,255,.28)"; for (const sgn of [1, -1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sgn * D * 5, -D * .9); ctx.lineTo(sgn * D * 5, D * .9); ctx.fill(); } ctx.restore(); }
      if (cls === "D") { ctx.strokeStyle = "rgba(235,240,255,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - D * 1.8, y); ctx.lineTo(x + D * 1.8, y); ctx.moveTo(x, y - D * 1.8); ctx.lineTo(x, y + D * 1.8); ctx.stroke(); }
      const N = clamp(Math.round(D / 2.2), 5, 30), spr = starSprite(cls, N, flares, M.motion ? Math.floor(t * 3) : 0), sz = D * (N + 4) / N;
      ctx.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz);
      HIT.push({ k: key, x, y, r: Math.max(D / 2, 9), label: name, kind: "star", cls });
      LBL.push({ k: key, x, y, r: D / 2, text: name, pri: 0, cls: "star" });
    };
    const S1 = S.st.cls || "G";
    let starAt = [cx, cy];
    if (S.comp && S.comp.both) {
      const ph = TAU * t / S.comp.P + S.comp.M0, q = S.comp.mass / (S.M1 + S.comp.mass), sep = M.mode === "true" ? Math.max(starPx(S1) / 2 + starPx(S.comp.cls) / 2 + 3, S.comp.a * M.L.Kt * M.z) : (M.L.D / 2 + M.L.pair / 2 + 8) * grow();
      const ux = Math.cos(ph), uy = Math.sin(ph); starAt = [cx - ux * sep * q, cy - uy * sep * q];
      drawStar(S.comp.cls, cx + ux * sep * (1 - q), cy + uy * sep * (1 - q), false, "Its companion", "c");
      drawStar(S1, starAt[0], starAt[1], S.st.flares, M.s.name, "star");
    } else drawStar(S1, cx, cy, S.st.flares, M.s.name, "star");
    // a companion far out (or a third star round a close pair): its orbit, and itself, or an arrow to it beyond the edge
    const farStar = (O, cls, key, label) => {
      const [x, y] = posAt(O, t), [sx, sy] = at(x, y);
      if (LAY.orbits) { ctx.strokeStyle = "rgba(255,210,170,.22)"; ctx.setLineDash([3, 6]); ctx.beginPath(); for (let i = 0; i <= 120; i++) { const [ax, ay] = along(O, i / 120 * TAU), [px, py] = at(ax, ay); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); ctx.setLineDash([]); }
      if (sx > -20 && sy > -20 && sx < W + 20 && sy < H + 20) drawStar(cls, sx, sy, false, label, key);
      else {
        const a = Math.atan2(sy - cy, sx - cx), ex = clamp(cx + Math.cos(a) * W, 18, W - 18), ey = clamp(cy + Math.sin(a) * H, 40, H - 18);
        ctx.fillStyle = "rgba(255,210,170,.85)"; ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.fill(); ctx.restore();
        LBL.push({ k: key, x: ex, y: ey, r: 6, text: `${label}, ${Math.round(Math.hypot(x, y))} AU`, pri: 1, cls: "far" }); HIT.push({ k: key, x: ex, y: ey, r: 10, kind: "star", cls });
      }
    };
    if (S.comp && !S.comp.both) farStar(S.compO, S.comp.cls, "c", "Its companion");
    if (S.comp2) farStar(S.comp2O, S.comp2.cls, "c2", "Its third star");
    // the worlds, lit from their star's side, with their moons when one comes close or chooses the world
    const pos = {};
    for (const w of S.worlds) {
      const [x, y] = posAt(w.o, t), [sx, sy] = at(x, y), D = worldPx(w.p); pos[w.k] = [sx, sy, D, x, y];
      if (sx < -D * 2 || sy < -D * 2 || sx > W + D * 2 || sy > H + D * 2) continue;
      const ang = Math.atan2(starAt[1] - sy, starAt[0] - sx);
      if (M.mode === "true" && D < 7) {
        ctx.fillStyle = rgb(hex((w.p.palette || {}).ground || (w.p.palette || {}).bands && w.p.palette.bands[0] || "#b0b8c8")); ctx.beginPath(); ctx.arc(sx, sy, Math.max(1.2, D / 2), 0, TAU); ctx.fill();
        ctx.strokeStyle = w.k === selK ? "rgba(255,255,255,.9)" : "rgba(170,190,230,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, TAU); ctx.stroke();
      } else if (A.pixelPlanet) {
        const N = clamp(Math.round(D / 1.9), 8, 30), spr = worldSprite(w.p, N, S.st.color, ang), sz = D * spr.width / N;
        ctx.drawImage(spr, sx - sz / 2, sy - sz / 2, sz, sz);
      } else { ctx.fillStyle = "#8a9bb5"; ctx.beginPath(); ctx.arc(sx, sy, D / 2, 0, TAU); ctx.fill(); }
      if (w.k === selK) { ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sx, sy, Math.max(D / 2, 6) + 4, 0, TAU); ctx.stroke(); }
      HIT.push({ k: w.k, x: sx, y: sy, r: Math.max(D / 2, 8), kind: "world", w });
      LBL.push({ k: w.k, x: sx, y: sy, r: Math.max(D / 2, M.mode === "true" ? 7 : 3), text: w.p.name, pri: 1 + (w.giant ? 0 : 1), cls: "world" });
      // its moons: the large ones in their own pictures round it, the small as rocks when one comes closer still
      const near = w.k === selK || M.z >= 2.2;
      if (!near || !w.moons.length) continue;
      const big = w.moons.filter(m => m.type === "moon"), small = w.moons.filter(m => m.type === "rock");
      let ring = D / 2 + 9 * Math.sqrt(grow());
      big.forEach((m, i) => {
        const Dm = clamp(6 + 6 * Math.log2(1 + (m.m.radius || .2) * 4), 6, 16) * Math.sqrt(grow()), rr = M.mode === "true" ? Math.max(D / 2 + 5, m.o.a * M.L.Kt * M.z) : ring + Dm / 2;
        ring = rr + Dm / 2 + 4;
        const a = m.o.M0 + TAU * t / m.o.P, mx = sx + Math.cos(a) * rr, my = sy + Math.sin(a) * rr;
        const nm = M.api && M.api.moonName ? M.api.moonName(w.p, m.m) : w.p.name + " " + (m.m.n + 1);
        if (LAY.orbits) { ctx.strokeStyle = "rgba(150,172,210,.16)"; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.stroke(); }
        // (its picture painted from the same name as its card's, so the two look alike)
        if (A.pixelPlanet) { const N = clamp(Math.round(Dm / 1.7), 6, 12), spr = worldSprite(Object.assign({}, m.m, { name: nm }), N, S.st.color, ang), sz = Dm * spr.width / N; ctx.drawImage(spr, mx - sz / 2, my - sz / 2, sz, sz); }
        const on = sel.planet === w.p.n && sel.moon === m.m.n; if (on) { ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(mx, my, Dm / 2 + 3, 0, TAU); ctx.stroke(); }
        HIT.push({ k: m.k, x: mx, y: my, r: Math.max(Dm / 2, 7), kind: "moon", w, m });
        LBL.push({ k: m.k, x: mx, y: my, r: Dm / 2, text: nm, pri: 4, cls: "moon" });
      });
      if (M.z >= 3 || (w.k === selK && M.z >= 1.6)) small.forEach((m, i) => {
        const rr = M.mode === "true" ? m.o.a * M.L.Kt * M.z : ring + 3 + i * 4.5; if (rr < D / 2 + 3) return;
        const a = m.o.M0 + TAU * t / m.o.P, mx = sx + Math.cos(a) * rr, my = sy + Math.sin(a) * rr, sp = rock(hstr(m.k), 5, Math.cos(ang), Math.sin(ang));
        ctx.drawImage(sp, mx - 2.5 * 1.4, my - 2.5 * 1.4, 7, 7);
        HIT.push({ k: m.k, x: mx, y: my, r: 5, kind: "rock", w, m });
      });
    }
    // what people put there, and the party's ship
    if (LAY.sites) {
      const stack = {};
      for (const x of S.own) {
        let sx, sy;
        if (x.on && pos[x.on.k]) { const [px, py, D] = pos[x.on.k], i = stack[x.on.k] = (stack[x.on.k] || 0) + 1, a = -Math.PI / 4 + (i - 1) * .55; sx = px + Math.cos(a) * (D / 2 + 10); sy = py + Math.sin(a) * (D / 2 + 10); }
        else if (x.near && x.near.at) { const i = stack[x.near.k] = (stack[x.near.k] || 0) + 1; sx = x.near.at[0] + 6; sy = x.near.at[1] + i * 18; }
        else if (x.o) { const [ax, ay] = posAt(x.o, t); [sx, sy] = at(ax, ay); }
        else continue;
        x.at = [sx, sy];
        if (sx < -10 || sy < -10 || sx > W + 10 || sy > H + 10) continue;
        const spr = iconSprite(x.kind); ctx.drawImage(spr, sx - 9, sy - 9, 18, 18);
        const name = x.type === "site" ? x.t.name : x.type === "place" ? x.pl.name : x.name;
        HIT.push({ k: x.k, x: sx, y: sy, r: 10, kind: x.type, x0: x });
        LBL.push({ k: x.k, x: sx, y: sy, r: 9, text: name, pri: x.type === "ship" ? 1 : 3, cls: x.type });
      }
    }
    // (a world being dragged to another orbit: the orbit it would have)
    if (M.dragW && M.dragW.at) { const [x, y, a] = M.dragW.at; ctx.strokeStyle = "rgba(255,209,102,.8)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, rad(a) * M.z, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.stroke(); }
    // the names: the most important first, each where it fits, none over another or over a world
    labels(ctx, LBL, HIT, W, H, sel);
    M.hits = HIT; buttons(HIT);
    foot();
    if (M.motion && !M.hold) request();
  }
  function labels(ctx, L, HIT, W, H, sel) {
    const placed = [], font = M.font || (M.font = "600 11px " + (getComputedStyle(M.el).getPropertyValue("--f-mono").trim() || "monospace"));
    ctx.font = font; ctx.textBaseline = "middle"; M.names = [];
    const hov = M.hover, show = l => LAY.names || l.k === hov || l.k === "p" + sel.planet || l.cls === "star";
    // (nothing written under the lines at the top and the foot)
    for (const q of M.el.querySelectorAll(".ss-sub, .ss-foot > *")) { const r = q.getBoundingClientRect(), c = M.cv.getBoundingClientRect(); if (r.width) placed.push([r.left - c.left - 4, r.top - c.top - 2, r.right - c.left + 4, r.bottom - c.top + 2]); }
    const hitR = HIT.filter(h => h.kind === "world" || h.kind === "star").map(h => [h.x - h.r, h.y - h.r, h.x + h.r, h.y + h.r, h.k]);
    const free = (r, k) => r[0] >= 2 && r[1] >= 2 && r[2] <= W - 2 && r[3] <= H - 2 && !placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]) && !hitR.some(q => q[4] !== k && r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    for (const l of L.filter(show).sort((a, b) => (a.k === hov ? -1 : 0) - (b.k === hov ? -1 : 0) || a.pri - b.pri)) {
      const w = ctx.measureText(l.text).width + 6, h = 15, g = l.r + 4;
      const C = [[l.x + g, l.y - h / 2], [l.x - g - w, l.y - h / 2], [l.x - w / 2, l.y + g], [l.x - w / 2, l.y - g - h], [l.x + g * .7, l.y + g * .5], [l.x + g * .7, l.y - g * .5 - h], [l.x - g * .7 - w, l.y + g * .5], [l.x - g * .7 - w, l.y - g * .5 - h]];
      const c = C.map(([x, y]) => [x, y, x + w, y + h]).find(r => free(r, l.k)); if (!c) continue;
      placed.push(c); M.names.push({ k: l.k, text: l.text, r: c });
      ctx.fillStyle = "rgba(4,6,11,.72)"; ctx.fillRect(c[0], c[1], w, h);
      ctx.fillStyle = l.cls === "star" ? "#ffe9c8" : l.cls === "moon" ? "#aeb9cc" : l.cls === "place" ? "#ffd166" : l.cls === "ship" ? "#7fe0c0" : l.cls === "site" ? "#b9d6ee" : "#dfe8f8";
      ctx.textAlign = "left"; ctx.fillText(l.text, c[0] + 3, c[1] + h / 2 + .5);
    }
    // what the rings say, where there is room
    const S = M.scene;
    if (LAY.water && S.hz) { const [cx, cy] = toScr(0, 0), r = rad((S.hz[0] + S.hz[1]) / 2) * M.z, txt = "where water could be liquid", w = ctx.measureText(txt).width + 6, x = cx - w / 2, y = cy - r - 7, rr = [x, y, x + w, y + 14]; if (free(rr, "")) { placed.push(rr); ctx.fillStyle = "rgba(120,220,160,.8)"; ctx.fillText(txt, x + 3, y + 7); } }
    for (const b of S.belts) { const [cx, cy] = toScr(0, 0), r = rad(b.b.a) * M.z, txt = b.b.name || "A belt", w = ctx.measureText(txt).width + 6, x = cx - w / 2, y = cy + r + 4, rr = [x, y, x + w, y + 14]; if (LAY.names && free(rr, "")) { placed.push(rr); ctx.fillStyle = "rgba(200,190,170,.75)"; ctx.fillText(txt, x + 3, y + 7); } }
  }
  // the bodies as buttons over the picture: to click, to reach with Tab, to be read out
  function buttons(HIT) {
    const box = M.el.querySelector(".ss-hits"), have = new Map([...box.children].map(b => [b.dataset.k, b])), keep = new Set();
    for (const h of HIT) {
      let b = have.get(h.k);
      if (!b) { b = document.createElement("button"); b.type = "button"; b.className = "ss-body"; b.dataset.k = h.k; box.appendChild(b); }
      // (a place, or a site with its own inside: clicked, it opens)
      const go = h.kind === "place" ? h.x0.pl.id : h.kind === "site" && h.x0.place ? h.x0.place : null; if (go) b.dataset.go = go; else if (b.dataset.go) delete b.dataset.go;
      const sz = Math.max(26, h.r * 2 + 6); b.style.width = b.style.height = sz + "px"; b.style.transform = `translate(${(h.x - sz / 2).toFixed(1)}px,${(h.y - sz / 2).toFixed(1)}px)`;
      const said = sayOf(h); if (b.getAttribute("aria-label") !== said) b.setAttribute("aria-label", said);
      const se = M.api && M.api.sel ? M.api.sel() : {};
      b.classList.toggle("on", !!(h.w && se.planet === h.w.p.n && (h.kind === "world" ? se.moon == null : h.kind === "moon" && se.moon === h.m.m.n)));
      keep.add(h.k);
    }
    for (const [k, b] of have) if (!keep.has(k)) b.remove();
  }
  function sayOf(h) {
    const S = M.scene;
    if (h.kind === "star") return h.k === "c" ? `Its companion: ${S.comp ? S.comp.name : ""}` : h.k === "c2" ? `Its third star: ${S.comp2 ? S.comp2.name : ""}` : `${M.s.name}: ${starName(S.st.cls)}`;
    if (h.kind === "world") { const p = h.w.p; return `${p.name}: ${(p.kname || "a world").toLowerCase()}, ${p.a} AU from its star`; }
    if (h.kind === "moon") return `${M.api && M.api.moonName ? M.api.moonName(h.w.p, h.m.m) : "A moon"}: a moon of ${h.w.p.name}`;
    if (h.kind === "rock") return `A small moon of ${h.w.p.name}`;
    const x = h.x0; return `${x.type === "site" ? x.t.name : x.type === "place" ? x.pl.name : x.name}: ${IKIND[x.kind] || "something"}${x.on ? " on " + x.on.p.name : ""}`;
  }
  // the card under the pointer
  function tipOf(h) {
    const S = M.scene, row = (k, v) => v == null || v === "" ? "" : `<span><span class="kn">${esc(k)}</span> ${esc(v)}</span>`;
    if (h.kind === "star") { if (h.k === "c") return `<b>Its companion</b><span>${esc(S.comp.name)}, ${S.comp.mass} times the Sun's mass</span><span class="kn">${esc(companionSay(S.comp, M.s.name))}</span>`; if (h.k === "c2") return `<b>Its third star</b><span>${esc(S.comp2.name)}, ${S.comp2.mass} times the Sun's mass</span><span class="kn">It goes round the pair ${Math.round(S.comp2.a).toLocaleString("en")} AU out, once in ${yrs(S.comp2.P)}.</span>`; const st = S.st; return `<b>${esc(M.s.name)}</b><span>${esc(starName(st.cls))}</span>${row("Light", st.lum != null ? `${sig(st.lum, 2)} times the Sun's` : "")}${row("Age", st.age ? `${st.age} billion years` : "")}${st.flares ? `<span class="kn">It flares: bursts of light and radiation</span>` : ""}`; }
    if (h.kind === "world") { const p = h.w.p, o = h.w.o; return `<b>${esc(p.name)}</b><span>${esc(p.kname || "")}</span>${row("Orbit", `${p.a} AU${o.e > .05 ? `, stretched (${r2(o.e)})` : ""}, a year of ${yrs(o.P)}`)}${row("Warmth", p.temp != null ? p.temp + " °C" : "")}${row("For people", p.hab)}${p.moons ? row("Moons", p.moons) : ""}<span class="kn">Click to see it${h.w.moons.length ? "; double-click to come close" : ""}</span>`; }
    if (h.kind === "moon") { const m = h.m.m; return `<b>${esc(M.api && M.api.moonName ? M.api.moonName(h.w.p, m) : "A moon")}</b><span>${esc(((A.galaxyGen && A.galaxyGen.KINDS[m.kind]) || "a moon").toLowerCase())} moon of ${esc(h.w.p.name)}</span>${row("Out", m.distance ? m.distance.toLocaleString("en") + " km" : "")}${row("Round in", m.period ? yrs(m.period) : "")}${row("Warmth", m.tempC != null ? m.tempC + " °C" : "")}`; }
    if (h.kind === "rock") return `<b>A small moon</b><span>${esc(h.m.m.say || "a rock")}, of ${esc(h.w.p.name)}</span>${row("Round in", h.m.m.period ? yrs(h.m.m.period) : "")}`;
    const x = h.x0, nm = x.type === "site" ? x.t.name : x.type === "place" ? x.pl.name : x.name;
    return `<b>${esc(nm)}</b><span>${esc(IKIND[x.kind] || "")}${x.on ? " on " + esc(x.on.p.name) : x.type === "site" && /station|orbital/.test(x.kind) && S.host ? ", in orbit 60° ahead of " + esc(S.host.p.name) : ""}</span>${x.type === "place" || x.place ? `<span class="kn">Click to open it</span>` : ""}`;
  }
  function tip(h, b) {
    const t = M.el.querySelector(".ss-tip"); if (!h) { t.hidden = true; return; }
    t.innerHTML = tipOf(h); t.hidden = false;
    const W = M.L.W, x = Math.min(W - 250, h.x + h.r + 12), y = Math.max(48, Math.min(M.L.H - 110, h.y - 10)); t.style.left = Math.max(4, x) + "px"; t.style.top = y + "px";
  }
  // the line at the foot: the date the worlds stand on, the scale
  function foot() {
    const f = M.el.querySelector(".ss-foot"); if (!f) return;
    const date = M.api && M.api.date ? M.api.date(M.t) : "";
    let scale = "";
    if (M.mode === "true") {
      const pxAU = M.L.Kt * M.z, want = 120 / pxAU, steps = [.001, .002, .005, .01, .02, .05, .1, .2, .5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000], au = steps.find(v => v >= want * .5) || 5000, lm = au * 8.317;
      scale = `<span class="ss-scale"><i style="width:${Math.round(au * pxAU)}px"></i>${au} AU · light takes ${lm < 1 ? Math.round(lm * 60) + " seconds" : lm < 90 ? Math.round(lm) + " minutes" : Math.round(lm / 60 * 10) / 10 + " hours"}</span>`;
    } else scale = `<span class="kn">Not to scale: the distances are squeezed and the worlds drawn large, so each can be found and clicked.</span>`;
    const html = `${date ? `<span>${M.t ? "The worlds as they will stand on " : "Where the worlds stand on "}${esc(date)}</span>` : ""}${scale}`;
    if (f.dataset.h !== html) { f.innerHTML = html; f.dataset.h = html; }
  }

  /* ---- what the game master does on it */
  function bar() {
    const S = M.scene, st = S.st;
    return `<div class="ss-bar"><button type="button" class="gx-b" data-ss="back" title="Back to the star chart (Esc)">← The galaxy</button>
      <span class="ss-title"><b>The ${esc(M.s.name)} system</b></span>
      <span class="ss-sp"></span>
      <span class="ss-seg" role="group" aria-label="How it is drawn"><button type="button" class="gx-b" data-ss="mode" data-v="ex" aria-pressed="${M.mode !== "true"}" title="Distances squeezed, the worlds large enough to know">Exploration</button><button type="button" class="gx-b" data-ss="mode" data-v="true" aria-pressed="${M.mode === "true"}" title="The real distances">True scale</button></span>
      <button type="button" class="gx-b" data-ss="motion" aria-pressed="${!!M.motion}" title="The worlds going round at their real speeds; still while the pointer is over one">Motion</button>
      <details class="ss-lay"><summary class="gx-b">Layers</summary><div class="ss-layp">${[["orbits", "Orbits"], ["names", "Names"], ["sites", "Stations and places"], ["water", "Where water is liquid, and the frost line"]].map(([k, l]) => `<label><input type="checkbox" data-ssl="${k}"${LAY[k] ? " checked" : ""}> ${l}</label>`).join("")}</div></details>
      <button type="button" class="gx-b" data-ss="zin" aria-label="Closer" title="Closer (+)">+</button><button type="button" class="gx-b" data-ss="zout" aria-label="Further" title="Further (−)">−</button>
      ${M.api && M.api.show ? `<button type="button" class="gx-b" data-ss="show" title="The players' screen shows this system: only the worlds they have scanned, as far as they scanned them">Show the players</button>` : ""}</div>`;
  }
  function zoom(f, e) {
    const r = M.cv.getBoundingClientRect(), px = e ? e.clientX - r.left : M.L.W / 2, py = e ? e.clientY - r.top : M.L.H / 2;
    const mx = M.px + (px - M.L.W / 2) / M.z, my = M.py + (py - M.L.H / 2) / M.z, z = clamp(M.z * f, .6, M.mode === "true" ? 4000 : 40);
    M.px = mx - (px - M.L.W / 2) / z; M.py = my - (py - M.L.H / 2) / z; M.z = z; request();
  }
  // where the pointer is, as a distance from the star (AU) and an angle (the inverse of the view's squeezing)
  function auAt(e) {
    const r = M.cv.getBoundingClientRect(), mx = M.px + (e.clientX - r.left - M.L.W / 2) / M.z, my = M.py + (e.clientY - r.top - M.L.H / 2) / M.z, d = Math.hypot(mx, my);
    const au = M.mode === "true" ? d / M.L.Kt : d <= M.L.R0 ? 0 : M.L.d0 * (Math.exp((d - M.L.R0) / M.L.Kx) - 1);
    return { a: au < .001 ? 0 : +au.toPrecision(au < 1 ? 2 : 3), ph: Math.atan2(my, mx) };
  }
  // the game master's menu where they right-click or press long: an empty orbit offers a world, a belt or a station
  // there; a world, a moon, a site or the star what can be done with it (the chart says which: api.menu)
  function menuAt(e, key) {
    if (!M || !M.api.menu) return; e.preventDefault && e.preventDefault();
    const h = key ? (M.hits || []).find(x => x.k === key) : hitAt(e);
    const ctx = h ? { kind: h.kind, n: h.w ? h.w.p.n : null, m: h.m ? h.m.m.n : null, site: h.x0 && h.x0.t ? h.x0.t.k : null, place: h.x0 && h.x0.pl ? h.x0.pl.id : null, k: h.k } : Object.assign({ kind: "space" }, auAt(e));
    M.api.menu(ctx, e);
  }
  function hitAt(e) { const r = M.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let b = null, bd = Infinity; for (const h of M.hits || []) { const d = Math.hypot(h.x - x, h.y - y); if (d < h.r + 5 && d < bd) { bd = d; b = h; } } return b; }
  function choose(h) {
    if (!h) { if (M.api && M.api.pick) M.api.pick(null); M.pinned = null; tip(null); request(); return; }
    if (h.kind === "world") M.api.pick(h.w.p.n);
    else if (h.kind === "moon") M.api.pick(h.w.p.n, h.m.m.n);
    else if (h.kind === "rock") M.api.pick(h.w.p.n);
    else if (h.kind === "site" || h.kind === "ship") { if (h.x0.on) M.api.pick(h.x0.on.p.n); M.pinned = h.k; tip(h); }
    else if (h.kind === "star") { M.api.pick(null); M.pinned = h.k; tip(h); }
    request();
  }
  // come close to a world: it in the middle, near enough for its moons
  function closeTo(h) {
    if (!h || !h.w) return; const [x, y] = posAt(h.w.o, today() + M.t), [mx, my] = toMap(x, y);
    M.px = mx; M.py = my; M.z = M.mode === "true" ? Math.max(M.z * 8, 60) : Math.max(M.z, 4); M.api.pick(h.w.p.n); request();
  }
  function wire() {
    const el = M.el, cv = M.cv;
    let drag = null;
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-ss]"); if (!b) return; const k = b.dataset.ss;
      if (k === "back") { close(true); return; }
      if (k === "mode") { M.mode = b.dataset.v === "true" ? "true" : "ex"; M.z = 1; M.px = 0; M.py = 0; layout(); el.querySelectorAll('[data-ss="mode"]').forEach(x => x.setAttribute("aria-pressed", x.dataset.v === (M.mode === "true" ? "true" : "ex"))); request(); return; }
      if (k === "motion") { M.motion = !M.motion; if (!M.motion) M.t = 0; M.last = 0; b.setAttribute("aria-pressed", M.motion); request(); return; }
      if (k === "zin") { zoom(1.6); return; }
      if (k === "zout") { zoom(.62); return; }
      if (k === "show" && M.api.show) { M.api.show(M.s.id); return; }
    });
    el.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.ssl) { LAY[t.dataset.ssl] = t.checked; keepLay(); request(); } });
    // the bodies' buttons: clicked, double-clicked to come close, hovered (the worlds stop while one is under the pointer)
    const box = el.querySelector(".ss-hits");
    box.addEventListener("click", e => { const b = e.target.closest(".ss-body"); if (!b || b.dataset.go) return; if (M.dragged) { M.dragged = false; return; } const h = (M.hits || []).find(x => x.k === b.dataset.k); choose(h); });
    box.addEventListener("contextmenu", e => { const b = e.target.closest(".ss-body"); if (b) menuAt(e, b.dataset.k); });
    cv.addEventListener("contextmenu", e => menuAt(e));
    if (A.ux && A.ux.longPress) { A.ux.longPress(cv, e => menuAt(e)); A.ux.longPress(box, e => { const b = e.target && e.target.closest && e.target.closest(".ss-body"); menuAt(e, b ? b.dataset.k : null); }); }
    // a world dragged to another orbit, while the galaxy's tools are out (the chart then asks what follows from it)
    box.addEventListener("pointerdown", e => { const b = e.target.closest(".ss-body"); if (!b || !/^p\d+$/.test(b.dataset.k) || !(M.api.editing && M.api.editing()) || e.button) return; M.dragW = { k: b.dataset.k, x: e.clientX, y: e.clientY, moved: false }; b.setPointerCapture(e.pointerId); });
    box.addEventListener("pointermove", e => { const d = M.dragW; if (!d) return; if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 6) d.moved = true; if (!d.moved) return; const q = auAt(e), r = M.cv.getBoundingClientRect(); d.at = [e.clientX - r.left, e.clientY - r.top, q.a]; const t = M.el.querySelector(".ss-tip"); t.innerHTML = `<b>${q.a} AU from its star</b><span class="kn">Let go to move it there</span>`; t.hidden = false; t.style.left = Math.min(M.L.W - 220, d.at[0] + 14) + "px"; t.style.top = Math.max(48, d.at[1] - 10) + "px"; request(); });
    box.addEventListener("pointerup", e => { const d = M.dragW; M.dragW = null; if (!d || !d.moved) return; M.dragged = true; tip(null); const q = auAt(e); if (q.a > 0 && M.api.moveWorld) M.api.moveWorld(+d.k.slice(1), q.a, e); request(); });
    box.addEventListener("dblclick", e => { const b = e.target.closest(".ss-body"); if (!b) return; const h = (M.hits || []).find(x => x.k === b.dataset.k); closeTo(h); });
    box.addEventListener("pointerover", e => { const b = e.target.closest(".ss-body"); if (!b) return; const h = (M.hits || []).find(x => x.k === b.dataset.k); M.hold = true; M.hover = b.dataset.k; tip(h); request(); });
    box.addEventListener("pointerout", e => { const b = e.target.closest(".ss-body"); if (!b) return; M.hold = false; M.hover = null; M.last = 0; if (!M.pinned) tip(null); request(); });
    box.addEventListener("focusin", e => { const b = e.target.closest(".ss-body"); if (b) { const h = (M.hits || []).find(x => x.k === b.dataset.k); M.hover = b.dataset.k; tip(h); request(); } });
    box.addEventListener("focusout", () => { M.hover = null; if (!M.pinned) tip(null); });
    // the picture: dragged to move, the wheel to come closer, a click on nothing lets go of what was chosen
    const stop = e => e.stopPropagation();
    for (const ev of ["pointerdown", "pointermove", "pointerup", "dblclick", "contextmenu"]) el.addEventListener(ev, stop);
    el.addEventListener("wheel", e => { e.preventDefault(); e.stopPropagation(); const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; zoom(Math.exp(-dy * .0016), e); }, { passive: false });
    cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, px: M.px, py: M.py, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (!drag) { const h = hitAt(e); cv.style.cursor = h ? "pointer" : ""; return; } const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; M.px = drag.px - dx / M.z; M.py = drag.py - dy / M.z; request(); });
    cv.addEventListener("pointerup", e => { const d = drag; drag = null; if (d && !d.moved) choose(hitAt(e)); });
    cv.addEventListener("dblclick", e => { const h = hitAt(e); if (h && h.w) closeTo(h); else zoom(2.4, e); });
    el.addEventListener("keydown", e => {
      if (e.target.closest("input, select, textarea")) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (M.z > 1.01 || M.px || M.py) { M.z = 1; M.px = 0; M.py = 0; request(); } else close(true); return; }
      if ((e.key === "+" || e.key === "=") && !e.ctrlKey) { e.preventDefault(); e.stopPropagation(); zoom(1.6); return; }
      if (e.key === "-" && !e.ctrlKey) { e.preventDefault(); e.stopPropagation(); zoom(.62); return; }
      const st = 60 / M.z; if (/^Arrow/.test(e.key) && !e.target.closest(".ss-body")) { e.preventDefault(); e.stopPropagation(); if (e.key === "ArrowLeft") M.px -= st; if (e.key === "ArrowRight") M.px += st; if (e.key === "ArrowUp") M.py -= st; if (e.key === "ArrowDown") M.py += st; request(); }
    });
    if (typeof ResizeObserver === "function") { M.ro = new ResizeObserver(() => { place(); request(); }); M.ro.observe(M.under); }
  }
  // the map lies exactly over the chart's picture
  function place() { if (!M) return; const u = M.under; M.el.style.top = u.offsetTop + "px"; M.el.style.height = u.offsetHeight + "px"; }

  /* ---- open and close */
  // host: the star chart's view; o: { s: the system, info: its bodies (atlas-galaxy.js bodiesOf), api: what the chart
  // does for it: pick(n, moon), sel(), back(), places(id), shipHere(id), shipName(), moonName(p, m), date(days on), show(id) }
  function open(host, o) {
    close(false);
    const under = host.querySelector(".gx-canvas"), map = under && under.parentNode; if (!map) return null;
    const el = document.createElement("div"); el.className = "ss-map"; el.tabIndex = -1; el.setAttribute("role", "region");
    M = { el, under, s: o.s, info: o.info, api: o.api || {}, mode: "ex", z: 1, px: 0, py: 0, motion: false, t: 0, last: 0, hold: false };
    M.scene = sceneOf(o.s, o.info, M.api);
    el.setAttribute("aria-label", `The ${o.s.name} system`);
    // (with motion, the innermost world goes round in about ten seconds; the rest at their own true speeds)
    M.rate = Math.max(.02, Math.min(...M.scene.worlds.map(w => w.o.P).concat([365])) / 10);
    const S = M.scene, sub = `${starName(S.st.cls)}${S.comp ? (S.comp.both ? ", one of a close pair" : ", with a far companion") : ""} · ${S.worlds.length ? S.worlds.length + " world" + (S.worlds.length > 1 ? "s" : "") : "no worlds"}${S.belts.length ? ", " + S.belts.length + " belt" + (S.belts.length > 1 ? "s" : "") : ""}`;
    el.innerHTML = `${bar()}<div class="ss-stage"><div class="ss-sub">${esc(sub[0].toUpperCase() + sub.slice(1))}</div><canvas class="ss-cv" role="img" aria-label="The map of the ${esc(o.s.name)} system: its star, its worlds on their orbits and what people put there. Drag to move, scroll to come closer."></canvas><div class="ss-hits" aria-label="Its star, worlds, moons and sites"></div><div class="ss-tip" hidden></div><div class="ss-foot"></div></div>`;
    map.appendChild(el); M.cv = el.querySelector(".ss-cv"); M.ctx = M.cv.getContext("2d");
    // (the side beside it scrolls by itself while the map is open, so a world's card is seen with the map)
    M.wrap = host.querySelector(".gx-wrap"); if (M.wrap) M.wrap.classList.add("ss-open");
    place(); layout(); wire(); request();
    setTimeout(() => { if (M && M.el === el) { place(); request(); el.focus({ preventScroll: true }); } }, 0);
    return el;
  }
  function close(back) {
    if (!M) return; const m = M; M = null; if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (m.ro) m.ro.disconnect(); m.el.remove(); if (m.wrap) m.wrap.classList.remove("ss-open");
    if (back && m.api && m.api.back) m.api.back();
  }
  A.starSystem = {
    open, close: () => close(false), isOpen: () => !!M, current: () => M ? M.s.id : null,
    // (the system changed on the page: a world, a site or a belt added, changed or taken away; the system itself gone)
    refresh: () => { if (!M) return; const s2 = M.api.fresh ? M.api.fresh(M.s.id) : M.s; if (!s2) { close(true); return; } M.s = s2; M.info = M.api.info ? M.api.info(s2) : M.info; M.scene = sceneOf(M.s, M.info, M.api); layout(); request(); },
    redraw: () => request(), zoom: f => { if (M) zoom(f); }, companion, companionSay, habZone, orbitOf: orbit, posAt, today,
    // (for the tests and the players' copy: where each world of a system stands on a day, in AU from its star)
    positions: (s, info, t) => sceneOf(s, info, null).worlds.map(w => { const [x, y] = posAt(w.o, t == null ? today() : t); return { n: w.p.n, x: r2(x * 1000) / 1000, y: r2(y * 1000) / 1000, a: w.o.a, e: w.o.e, P: w.o.P }; }),
    debug: () => M ? { mode: M.mode, z: M.z, hits: (M.hits || []).length, bodies: (M.hits || []).map(h => h.k), at: Object.fromEntries((M.hits || []).map(h => [h.k, [Math.round(h.x), Math.round(h.y)]])), names: (M.names || []).map(n => ({ k: n.k, text: n.text, r: n.r.map(Math.round) })), motion: M.motion, hold: M.hold, t: M.t, scale: (M.el.querySelector(".ss-scale") || {}).textContent || "", foot: (M.el.querySelector(".ss-foot") || {}).textContent || "", comp: M.scene.comp, aIn: M.scene.aIn, aOut: M.scene.aOut } : null
  };
})(typeof ATLAS !== "undefined" ? ATLAS : null);
