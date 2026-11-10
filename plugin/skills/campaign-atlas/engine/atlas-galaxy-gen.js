/* The galaxy, grown from its seed (the user's master plan, 26 Oct 2026, part 11: hundreds or thousands of star systems,
   made deterministically and lazily, never stored in bulk). A campaign keeps only its galaxy's settings (galaxy.js:
   ATLAS.galaxy({ seed, systems, shape, arms, span, name })); every page and the command line grow the same galaxy from
   them: where each system stands, its star, its sector, the lanes between, the regions charted, dangerous or restricted,
   the powers that hold it, and which systems have colonies, stations, fuel or something strange. A system's planets,
   moons, belts and what orbits them are grown only when it is opened, from the same seed, so they are the same every
   time: each planet with coherent properties (its kind from where it orbits, its warmth from its star, its air from its
   size and warmth, water and life only where they could be, and whether anyone could land). Plain code with no page in
   it: atlas.js runs it too (check, galaxy --list). The council's own names and changes lie over it (ATLAS.galaxyEdit). */
(function (A) {
  "use strict";
  // a seeded random stream, and a number from a string, so the same seed always grows the same galaxy
  const hash = s => { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const rng = seed => { let a = hash(seed) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pick = (r, l) => l[Math.floor(r() * l.length) % l.length];
  const weighted = (r, l) => { const t = l.reduce((a, x) => a + x[1], 0); let v = r() * t; for (const x of l) { if ((v -= x[1]) <= 0) return x[0]; } return l[l.length - 1][0]; };
  const round = (v, d) => Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  /* ---- names: made of syllables, or a catalogue number as charts give them */
  const SYL = { a: ["ka", "ve", "ra", "to", "mi", "sel", "dor", "an", "ix", "ul", "the", "cor", "ve", "ly", "zan", "or", "ae", "hal", "qui", "bre", "nos", "tar", "il", "ess"], b: ["", "", "", "n", "s", "r", "th", "x", "l"] };
  const CAT = ["HD", "Gliese", "Ross", "LHS", "Wolf", "Kruger", "Lacaille", "Struve", "Kepler", "TOI", "Luyten"];
  function nameOf(r) {
    if (r() < .38) return `${pick(r, CAT)} ${Math.floor(r() * 9000) + 100}`;
    const n = 2 + (r() < .35 ? 1 : 0); let s = "", last = ""; for (let i = 0; i < n; i++) { let x = pick(r, SYL.a); if (x === last) x = pick(r, SYL.a); s += x; last = x; } s += pick(r, SYL.b);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // a spoken name only, for sectors, regions and powers (never a catalogue number)
  function word(r) { const n = 2 + (r() < .3 ? 1 : 0); let s = ""; for (let i = 0; i < n; i++) s += pick(r, SYL.a); s += pick(r, SYL.b); return s.charAt(0).toUpperCase() + s.slice(1); }
  const SECTORS = ["Reach", "Expanse", "March", "Drift", "Verge", "Shoals", "Deep", "Marches", "Rim", "Hollows", "Narrows", "Cradle"];

  /* ---- stars: their class, colour, how bright and how heavy (the sun is 1) */
  // (model 2 adds the brown dwarfs, warm L, cool T and coldest Y, and the red giants R: after the ten model 1 has)
  const STARS = { O: ["#9bb0ff", 30000, 16], B: ["#aabfff", 800, 6], A: ["#cad7ff", 20, 2], F: ["#f8f7ff", 3, 1.3], G: ["#fff4ea", 1, 1], K: ["#ffd2a1", .3, .75], M: ["#ffad74", .04, .35], D: ["#e8eaff", .01, .6], N: ["#c7d2ff", .001, 1.4], X: ["#401a5a", 0, 10], L: ["#d2693c", .0001, .07], T: ["#a3527a", .00002, .045], Y: ["#7a5a92", .000002, .02], R: ["#ffb26b", 150, 1.1] };
  const STAR_NAME = { O: "a blue giant", B: "a blue-white star", A: "a white star", F: "a yellow-white star", G: "a yellow star like the sun", K: "an orange dwarf", M: "a red dwarf", D: "a white dwarf", N: "a neutron star", X: "a black hole", L: "a brown dwarf, warm", T: "a brown dwarf, cool", Y: "a brown dwarf, the coldest kind", R: "a red giant" };

  /* ---- the galaxy: where every system stands, and what the lanes, sectors, regions and powers are */
  function grow(P) {
    // (model 2, grown from the real galaxy, for new campaigns; every galaxy made before keeps model 1 below, untouched;
    // a single system, a small cluster or an empty canvas are model 2's: the editing plan of 10 Nov 2026)
    if (P && (+P.model === 2 || ["system", "cluster", "blank"].includes(P.kind)) && A.galaxyModel) return grow2(P);
    const p = Object.assign({ seed: "atlas", systems: 300, shape: "spiral", arms: 3, span: 100, name: "" }, P || {});
    const N = Math.max(20, Math.min(5000, +p.systems || 300)), r = rng(p.seed + "|stars"), W = 1000, R = 470;
    const S = [];
    for (let i = 0; i < N; i++) {
      let x, y;
      if (p.shape === "cluster") { const a = r() * Math.PI * 2, d = Math.pow(r(), .55) * R; x = Math.cos(a) * d; y = Math.sin(a) * d * .8; }
      else if (p.shape === "ring") { const a = r() * Math.PI * 2, d = R * (.62 + (r() - .5) * .4); x = Math.cos(a) * d; y = Math.sin(a) * d; }
      else if (p.shape === "elliptical") { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R; x = Math.cos(a) * d; y = Math.sin(a) * d * .62; }
      else { const arms = Math.max(1, Math.min(6, +p.arms || 3)), arm = Math.floor(r() * arms), d = Math.pow(r(), .7), a = arm * Math.PI * 2 / arms + d * 3.6 + (r() - .5) * .55 * (1.15 - d); x = Math.cos(a) * d * R + (r() - .5) * 22; y = Math.sin(a) * d * R + (r() - .5) * 22; }
      const cls = weighted(r, [["M", 55], ["K", 18], ["G", 11], ["F", 7], ["A", 4], ["B", 1.2], ["O", .1], ["D", 3], ["N", .4], ["X", .15]]);
      S.push({ i, id: "S" + i, x: round(x + W / 2, 1), y: round(y + W / 2, 1), cls, bin: r() < .22, name: nameOf(r), f: {} });
    }
    return settle(p, S, N, W, r, null);
  }
  // what follows the stars' places, for both models: the lanes, sectors, what is in each system, home, the regions and
  // the powers (zc: a system's height above the plane in chart units, model 2's; model 1's are all in the plane)
  function settle(p, S, N, W, r, zc) {
    // the lanes: each system to its nearest neighbours, and a tree through all of them so every system can be reached
    const ly = p.span / W, d2 = zc ? (a, b) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (zc(a) - zc(b)) * (zc(a) - zc(b)) : (a, b) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    const cell = 30, grid = new Map(), key = (cx, cy) => cx + "," + cy;
    for (const s of S) { const k = key(Math.floor(s.x / cell), Math.floor(s.y / cell)); (grid.get(k) || grid.set(k, []).get(k)).push(s); }
    const near = (s, rad) => { const out = [], c = Math.ceil(rad / cell), cx = Math.floor(s.x / cell), cy = Math.floor(s.y / cell); for (let a = -c; a <= c; a++) for (let b = -c; b <= c; b++) for (const t of grid.get(key(cx + a, cy + b)) || []) if (t !== s && d2(s, t) <= rad * rad) out.push(t); return out; };
    const lanes = new Map(), addLane = (a, b) => { const k = a.i < b.i ? a.i + "-" + b.i : b.i + "-" + a.i; if (!lanes.has(k)) lanes.set(k, [Math.min(a.i, b.i), Math.max(a.i, b.i)]); };
    for (const s of S) { const ns = near(s, 70).sort((a, b) => d2(s, a) - d2(s, b)).slice(0, 2 + (r() < .3 ? 1 : 0)); for (const t of ns) addLane(s, t); }
    // (joined: the parts the nearest lanes left apart are linked by their closest pair)
    const parent = S.map((s, i) => i), find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
    for (const [a, b] of lanes.values()) parent[find(a)] = find(b);
    for (let guard = 0; guard < 200; guard++) {
      const groups = new Map(); for (const s of S) { const g = find(s.i); (groups.get(g) || groups.set(g, []).get(g)).push(s); }
      if (groups.size <= 1) break;
      const list = [...groups.values()].sort((a, b) => a.length - b.length), small = list[0], rest = S.filter(s => find(s.i) !== find(small[0].i));
      let best = null; for (const a of small) for (const b of near(a, 160).filter(t => find(t.i) !== find(a.i))) { const d = d2(a, b); if (!best || d < best[2]) best = [a, b, d]; }
      if (!best) { for (const a of small) for (const b of rest) { const d = d2(a, b); if (!best || d < best[2]) best = [a, b, d]; } }
      addLane(best[0], best[1]); parent[find(best[0].i)] = find(best[1].i);
    }
    // the sectors: centres spread over the galaxy, each system in the nearest (a small cluster is one sector)
    const small = p.kind === "cluster", nSec = small ? 1 : Math.max(4, Math.min(24, Math.round(N / 45))), rs = rng(p.seed + "|sectors"), secs = [];
    for (let k = 0; k < nSec; k++) { const s = S[Math.floor(rs() * N)]; if (!secs.some(c => Math.hypot(c.x - s.x, c.y - s.y) < 90)) secs.push({ id: "sec" + k, x: s.x, y: s.y, name: `The ${word(rs)} ${pick(rs, SECTORS)}` }); }
    for (const s of S) { let b = 0, bd = Infinity; secs.forEach((c, k) => { const d = (c.x - s.x) ** 2 + (c.y - s.y) ** 2; if (d < bd) { bd = d; b = k; } }); s.sec = b; }
    // what is in each system: people, fuel, a station, something strange
    const rf = rng(p.seed + "|flags");
    for (const s of S) {
      const good = "GKF".includes(s.cls) ? 1 : s.cls === "M" ? .45 : .15;
      if (rf() < .16 * good) s.f.colony = 1;
      if (rf() < .1 + (s.f.colony ? .4 : 0)) s.f.station = 1;
      if (s.f.colony || s.f.station) s.f.fuel = rf() < .85 ? 1 : 0;
      if (rf() < .05 || s.cls === "X" || s.cls === "N") s.f.anomaly = 1;
      if (rf() < .04) s.f.derelict = 1;
      if (rf() < .03 + (s.f.colony ? .1 : 0)) s.f.mining = 1;
      if (rf() < .02) s.f.research = 1;
    }
    // home: the most settled place near the middle of a populated sector; the charted space round it
    // (model 2 grows real mixes of stars: its home is a Sun-like star where there is one near the middle)
    const pref = zc ? s => ("GKF".includes(s.cls) ? 0 : s.cls === "M" ? 150 : 400) : () => 0;
    const homeS = S.filter(s => s.f.colony && s.f.fuel).sort((a, b) => (Math.hypot(a.x - 500, a.y - 500) + pref(a)) - (Math.hypot(b.x - 500, b.y - 500) + pref(b)))[0] || S[0];
    homeS.f.colony = 1; homeS.f.station = 1; homeS.f.fuel = 1;
    const rr = rng(p.seed + "|regions"), regions = [{ kind: "explored", x: homeS.x, y: homeS.y, r: 120 + rr() * 60, name: "Charted space" }];
    // (a small cluster gets none: its dangers are the game master's to place)
    for (let k = 0; k < (small ? 0 : Math.max(2, Math.round(N / 120))); k++) { const s = S[Math.floor(rr() * N)]; if (Math.hypot(s.x - homeS.x, s.y - homeS.y) < 90) continue; regions.push({ kind: "danger", x: s.x, y: s.y, r: 30 + rr() * 45, name: pick(rr, ["The %s Nebula", "The %s Maelstrom", "%s's Graveyard", "The %s Storm", "The Pirate %s"]).replace("%s", word(rr)) }); }
    for (let k = 0; k < (small ? 0 : Math.max(1, Math.round(N / 300))); k++) { const s = S.filter(t => (t.f.anomaly || t.f.research) && Math.hypot(t.x - homeS.x, t.y - homeS.y) > 110)[k] || S[Math.floor(rr() * N)]; if (Math.hypot(s.x - homeS.x, s.y - homeS.y) < 110) continue; regions.push({ kind: "restricted", x: s.x, y: s.y, r: 18 + rr() * 20, name: `The ${s.name} Exclusion` }); }
    // powers: a few polities grown out from their capitals along the lanes (the council may give its own factions instead)
    const adj = S.map(() => []); for (const [a, b] of lanes.values()) { adj[a].push(b); adj[b].push(a); }
    const rp = rng(p.seed + "|powers"), caps = [homeS].concat(S.filter(s => s.f.colony && s !== homeS).sort(() => rp() - .5).slice(0, Math.max(2, Math.min(7, Math.round(N / 90)))));
    const powers = caps.map((c, k) => ({ id: "p" + k, name: `${pick(rp, ["The", "The Free", "The United", "The", "The Old"])} ${/\d/.test(c.name) ? word(rp) : c.name} ${k === 0 ? "Compact" : pick(rp, ["Hegemony", "League", "Directorate", "Republic", "Combine", "Syndicate", "Dominion"])}`, capital: c.i }));
    const owner = new Array(N).fill(-1), q = []; caps.forEach((c, k) => { owner[c.i] = k; q.push([c.i, 0]); });
    const reach = Math.max(4, Math.round(N / caps.length / 6));
    while (q.length) { const [i, dd] = q.shift(); if (dd >= reach) continue; for (const j of adj[i]) if (owner[j] < 0 && rp() < .85) { owner[j] = owner[i]; q.push([j, dd + 1]); } }
    S.forEach((s, i) => { if (owner[i] >= 0) s.pw = owner[i]; });
    return { p, N, W, ly, systems: S, lanes: [...lanes.values()], sectors: secs, regions, powers, home: homeS.i, adj, model: zc ? 2 : 1 };
  }

  /* ---- model 2 (the galaxy plan of 5 Nov 2026, approved 10 Nov: section 2): the campaign's systems grown from the real
          galaxy (atlas-galaxy-model.js). How far they spread is the campaign's: a neighbourhood (100 light years, the
          default), a sector (1,000), a stretch of an arm (10,000) or the whole galaxy. In a neighbourhood or a sector
          they are placed in a ball of space by the galaxy's own density there, each with its height above or below the
          plane; across an arm or the galaxy they trace its arms, bar and bulge (by the density to the power 0.6, so the
          crowded heart does not take them all). Each star from the real mix: its mass by the initial mass function
          (brown dwarfs too, unless left out), its age and metals by the part of the galaxy it is in, what it has become by
          now (a giant, a white dwarf, a neutron star, a black hole), and a real companion by the odds for its mass, with
          its own mass, distance and stretch; all of it passed to the planet maker, so the worlds follow their star. */
  const SCOPES = { neighbourhood: 100, sector: 1000, arm: 10000, galaxy: 0 };
  // a star's light, by its mass and what it has become (Suns): the main sequence's mass-luminosity law; the rest by kind
  const lumOf = (cls, m) => cls === "R" ? 150 : cls === "D" ? .003 : cls === "N" || cls === "X" ? 0 : cls === "L" ? 1e-4 : cls === "T" ? 2e-5 : cls === "Y" ? 2e-6 : m < .43 ? .23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : m < 55 ? 1.4 * Math.pow(m, 3.5) : 32000 * m;
  function grow2(P) {
    const GM = A.galaxyModel, KPC = GM.KPC;
    const p = Object.assign({ seed: "atlas", systems: 300, name: "", scope: "neighbourhood", galaxyType: "barred" }, P || {}, { model: 2 });
    const M = GM.galaxyOf({ type: p.galaxyType, seed: p.seed, milkyWay: !!p.milkyWay });
    p.scope = SCOPES[p.scope] != null ? p.scope : "neighbourhood"; p.galaxyType = M.type;
    // (the kinds of space map, the editing plan of 10 Nov 2026: a whole galaxy, a small cluster of a few systems, a
    // single system, or an empty canvas; a cluster spread as far as the real density of stars near the Sun puts that
    // many systems, about 0.004 a cubic light year counting every star and brown dwarf)
    const kind = ["system", "cluster", "blank"].includes(p.kind) ? p.kind : "galaxy"; if (kind !== "galaxy") p.scope = "neighbourhood";
    const nK = kind === "cluster" ? Math.max(2, Math.min(60, +p.systems || 5)) : 0;
    if (!(+p.span > 0)) p.span = kind === "cluster" ? Math.max(6, Math.ceil(Math.cbrt(nK / .0168)) * 2) : kind === "system" ? 20 : kind === "blank" ? 60 : p.scope === "galaxy" ? Math.round(M.Rmax * 2.1 / 1000) * 1000 : SCOPES[p.scope];
    const N = kind === "cluster" ? nK : kind === "system" ? 1 : kind === "blank" ? 0 : Math.max(20, Math.min(5000, +p.systems || 300)), W = 1000, span = +p.span, ly = span / W, R2 = span / 2, r = rng(p.seed + "|stars2");
    if (kind === "system" || kind === "blank") {
      const at0 = p.at && Number.isFinite(+p.at.x) ? { x: +p.at.x, y: +p.at.y, z: +p.at.z || 0 } : { x: M.sun.x, y: M.sun.y, z: M.sun.z }; p.at = at0;
      // one star at the middle, of the kind asked (like the Sun unless told), and nothing else until the game master adds it
      const S1 = kind === "blank" ? [] : (() => { const cls = STARS[p.star] ? p.star : "G", m = STARS[cls][2]; return [{ i: 0, id: "S0", x: 500, y: 500, z: 0, cls, bin: false, name: p.systemName || nameOf(r), f: {}, m2: { cls, mass: m, m0: m, age: 4600, feh: 0, pop: "thin" }, sec: 0 }]; })();
      return { p, N: S1.length, W, ly, systems: S1, lanes: [], sectors: S1.length ? [{ id: "sec0", x: 500, y: 500, name: `The ${word(r)} ${pick(r, SECTORS)}` }] : [], regions: [], powers: [], home: S1.length ? 0 : -1, adj: S1.map(() => []), model: 2, frame: { x: at0.x, y: at0.y, z: at0.z, k: ly } };
    }
    const at = p.scope === "galaxy" ? { x: 0, y: 0, z: 0 } : p.at && Number.isFinite(+p.at.x) ? { x: +p.at.x, y: +p.at.y, z: +p.at.z || 0 } : { x: M.sun.x, y: M.sun.y, z: M.sun.z };
    if (p.scope !== "galaxy") p.at = at;
    const big = p.scope === "arm" || p.scope === "galaxy", T = M.T;
    // (across an arm or the galaxy: the stars' column through the disc, on a grid, so each place is weighed quickly)
    let grid = null, gmax = 0; const GN = 72;
    if (big) { grid = new Float32Array(GN * GN); for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = at.x - R2 + (i + .5) / GN * span, y = at.y - R2 + (j + .5) / GN * span, c = GM.column(M, x, y), v = Math.pow(Math.max(0, c.thin + c.thick + c.bulge + c.halo), .6); grid[j * GN + i] = v; if (v > gmax) gmax = v; } }
    const gridAt = (x, y) => { const u = clampN((x - at.x + R2) / span * GN - .5, 0, GN - 1.001), v = clampN((y - at.y + R2) / span * GN - .5, 0, GN - 1.001), i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, g = (a, b) => grid[Math.min(GN - 1, b) * GN + Math.min(GN - 1, a)]; return g(i, j) * (1 - fu) * (1 - fv) + g(i + 1, j) * fu * (1 - fv) + g(i, j + 1) * (1 - fu) * fv + g(i + 1, j + 1) * fu * fv; };
    // (in a ball of space: the density there, against the most there is in it)
    let dmax = 0; if (!big) for (let k = 0; k < 96; k++) { const u = rng(p.seed + "|dmax" + k), x = at.x + (u() * 2 - 1) * R2, y = at.y + (u() * 2 - 1) * R2; dmax = Math.max(dmax, GM.density(M, x, y, 0), GM.density(M, x, y, at.z)); }
    dmax *= 1.25;
    const H = { young: .05, thin: T.hz || .3, thick: (T.thick || {}).hz || .9, bulge: T.bar ? T.bar.c * .6 : T.bulge ? T.bulge.a * .7 : .5, halo: 4 };
    const S = [];
    for (let i = 0, tries = 0; i < N && tries < Math.max(N, 20) * 4000; tries++) {
      let gx, gy, gz, pop;
      if (big) {
        gx = at.x + (r() * 2 - 1) * R2; gy = at.y + (r() * 2 - 1) * R2;
        if (r() * gmax > gridAt(gx, gy)) continue;
        pop = GM.populationAt(M, gx, gy, 0, r); gz = (r() < .5 ? -1 : 1) * -Math.log(1 - r() * .995) * H[pop.pop] * KPC;
      } else {
        const dx = (r() * 2 - 1) * R2, dy = (r() * 2 - 1) * R2, dz = (r() * 2 - 1) * R2; if (dx * dx + dy * dy + dz * dz > R2 * R2) continue;
        gx = at.x + dx; gy = at.y + dy; gz = at.z + dz;
        if (r() * dmax > GM.density(M, gx, gy, gz)) continue;
        pop = GM.populationAt(M, gx, gy, gz, r);
      }
      // its star: born by the initial mass function, become what its age makes it; a companion by the odds for its mass
      let m0 = GM.imfSample(r); if (p.browns === false) { let g = 0; while (m0 < .08 && g++ < 40) m0 = GM.imfSample(r); }
      const now = GM.become(m0, pop.age), c0 = GM.companionOf(m0, r), c = c0 ? GM.become(c0.mass, pop.age) : null;
      const s = { i, id: "S" + i, x: round(W / 2 + (gx - at.x) / ly, 1), y: round(W / 2 + (gy - at.y) / ly, 1), z: round(gz - at.z, 1), cls: now.cls, bin: !!c, name: nameOf(r), f: {}, m2: { cls: now.cls, mass: round(now.mass, 3), m0: round(m0, 3), age: Math.round(pop.age), feh: pop.feh, pop: pop.pop } };
      if (c) s.comp = { cls: c.cls, mass: round(c.mass, 3), a: c0.a, e: c0.e };
      S.push(s); i++;
    }
    const G = settle(p, S, S.length, W, r, s => (s.z || 0) / ly);
    G.model = 2; G.frame = { x: at.x, y: at.y, z: at.z, k: ly };
    return G;
  }
  const clampN = (v, a, b) => v < a ? a : v > b ? b : v;

  /* ---- a system opened: its planets, belts, moons and what orbits them, grown from the seed and the system */
  const KINDS = { lava: "Lava world", rocky: "Rocky world", desert: "Desert world", ocean: "Ocean world", garden: "Living world", ice: "Ice world", barren: "Barren world", toxic: "Hothouse world", gas: "Gas giant", icegiant: "Ice giant", dwarf: "Dwarf planet", hotjupiter: "Hot Jupiter", mini: "Mini-Neptune" };
  // a worked-out world (atlas-planet.js) with the star chart's own fields beside its profile: its kind's name, size,
  // gravity and warmth as the chart shows them, its dangers and its weather in a word (also for a world the game master
  // worked out again in the planet editor, atlas-galaxy.js)
  function chartPlanet(p) {
    const giant = p.env === "gas" || p.env === "ice" || p.env === "mini", tc = p.tempC;
    const hazards = [tc > 120 && "searing heat", tc < -120 && "killing cold", p.kind === "toxic" && "corrosive air", p.gravity > 1.6 && "crushing gravity", (p.kind === "lava" || p.tectonics === "tidal") && "eruptions", (p.pressure || 0) > 10 && "crushing pressure", /lethal|high/.test(p.radiation || "") && "radiation", p.winds && p.winds.extreme > 60 && (p.pressure || 0) > .05 && "violent storms", p.winds && /dust/.test(p.winds.storms || "") && "dust storms", p.locked && !giant && "a burning day side and a frozen night side"].filter(Boolean);
    return Object.assign({}, p, {
      kind: p.kind, kname: (p.super ? "Super-Earth: " : "") + (KINDS[p.kind] || p.kind), a: p.a, size: p.radius, grav: p.gravity, temp: tc,
      air: p.air + (p.breathable ? ": breathable" : ""), pres: p.pressure, water: p.water || "", life: p.life || "", hab: p.hab, hazards, land: p.land, moons: p.moons || 0,
      climate: giant ? "Storms the size of worlds" : (p.pressure || 0) < .001 ? "None: no air to carry weather" : tc > 60 ? "Scorching" : tc > 25 ? "Hot" : tc > 0 ? "Temperate" : tc > -60 ? "Cold" : "Frozen"
    });
  }
  // a world of a system worked out again with the game master's changes (ch: orbit, mass, water, iron; its crust, air
  // and life as they set them), its name and the chart's own notes kept; the same changes always give the same world
  function rework(G, info, p, ch) {
    const q = A.planets.rework(info.star, p, ch, rng(G.p.seed + "|edit|" + p.name + "|" + (ch.seed || 0)), { realism: G.p.realism || "balanced", tech: G.p.tech || "armoured" });
    return Object.assign(chartPlanet(q), { n: p.n, name: p.name, minerals: p.minerals, chance: p.chance });
  }
  function system(G, i) {
    const s = G.systems[i]; if (!s) return null;
    // (the planets worked out from their physics by the planetary layer, engine/atlas-planet.js: the user's approved
    // plan of 3 Nov 2026, "every galaxy upgraded"; the same seed always gives the same system; the star chart's own
    // fields kept as they were, the whole profile beside them)
    // (a system the game master added: its worlds from its own id, so taking back another added system never changes it)
    const r = rng(G.p.seed + "|sys|" + (s.added ? s.id : i)), P = A.planets;
    // (model 2: the planet maker given the star as it is, its mass, age and metals, and the light of a close companion;
    // model 1: the star drawn from its class, as always)
    // (a star the game master gave another kind is made as that kind, as in model 1; a companion the game master set is
    // used in either model; a copy of a system keeps its original's star exactly)
    const m2 = s.m2 && s.m2.cls === s.cls ? s.m2 : null, c = s.bin && s.comp && (m2 || s.compOwn) ? s.comp : null, close = c && (c.both != null ? c.both : c.a <= 2);
    const fixed = s.star0 && s.star0.cls === s.cls ? s.star0 : null;
    const SYS = P.system(s.cls, r, Object.assign({ realism: G.p.realism || "balanced", tech: G.p.tech || "armoured" }, fixed ? { starFixed: fixed } : m2 ? { star: { mass: m2.mass, age: m2.age / 1000, feh: m2.feh, lum: m2.lum, teff: m2.teff, radius: m2.radius, lum2: close ? lumOf(c.cls, c.mass || (STARS[c.cls] || STARS.M)[2]) : 0 } } : {}));
    // (built by hand or copied: no worlds grown, only the game master's own)
    if (s.noGen) { SYS.planets = []; SYS.belts = []; }
    // (what makes a star strange, from the library: a pulsar's beams, a black hole's disc or jets, a young star's dust)
    const S = SYS.star, out = { star: Object.assign({ cls: s.cls, name: (s.m2 && s.m2.name) || STAR_NAME[s.cls], color: S.color, lum: S.lum, mass: S.mass, teff: S.teff, age: S.age, flares: s.special === "flare" ? Math.max(1.2, S.flares || 0) : S.flares, metal: S.metal, binary: s.bin, frost: SYS.frost }, s.special ? { special: s.special } : {}, m2 && m2.radius ? { radius: m2.radius } : {}), planets: [], belts: SYS.belts, sites: [] };
    // (a real companion: only the worlds whose orbits last are kept; round both stars beyond about 3.5 times the pair's
    // separation, round one within about a quarter of its companion's nearest approach [Holman & Wiegert 1999])
    if (c) {
      const rc = rng(G.p.seed + "|comp|" + (s.added ? s.id : i)), cm = c.mass || (STARS[c.cls] || STARS.M)[2], ce = c.e != null ? c.e : c.ecc || 0;
      out.star.companion = { cls: c.cls, mass: cm, a: c.a, ecc: ce, both: close, P: Math.sqrt(Math.pow(c.a, 3) / Math.max(.02, S.mass + cm)) * 365.25, w: rc() * Math.PI * 2, M0: rc() * Math.PI * 2, color: (STARS[c.cls] || STARS.M)[0], name: STAR_NAME[c.cls] || "a star", own: !!s.compOwn };
      // (only the worlds whose orbits last are grown beside a real companion; the game master's own companion keeps every
      // world they have, and the system's card warns of those that would not last)
      const ok = a => close ? a > 3.5 * c.a : a < .25 * c.a * (1 - ce);
      if (!s.compOwn) { SYS.planets = SYS.planets.filter(p => ok(p.a * (close ? 1 - (p.ecc || 0) : 1 + (p.ecc || 0)))); SYS.belts = SYS.belts.filter(b => ok(b.a)); out.belts = SYS.belts; }
      // a third star, far out round the pair (the game master's)
      if (s.comp2 && s.comp2.cls) { const c2 = s.comp2, m2c = c2.mass || (STARS[c2.cls] || STARS.M)[2], e2 = c2.e || 0; out.star.companion2 = { cls: c2.cls, mass: m2c, a: c2.a, ecc: e2, both: false, P: Math.sqrt(Math.pow(c2.a, 3) / Math.max(.02, S.mass + cm + m2c)) * 365.25, w: rc() * Math.PI * 2, M0: rc() * Math.PI * 2, color: (STARS[c2.cls] || STARS.M)[0], name: STAR_NAME[c2.cls] || "a star", own: true }; }
    }
    const MINERALS = ["iron and nickel", "rare earths", "water ice", "silicates", "heavy metals", "platinum group metals", "radioactives", "carbon and graphite", "helium-3"];
    for (const p of SYS.planets) {
      const name = `${s.name} ${"bcdefghijk"[out.planets.length] || out.planets.length + 1}`;
      out.planets.push(Object.assign(chartPlanet(p), {
        n: out.planets.length, name, minerals: pick(r, MINERALS),
        chance: pick(r, ["Ruins no survey has explained", "A crashed ship on the night side", "Rich deposits nobody has claimed", "Signals from below the surface", "An abandoned survey camp", "Caves that go further than they should", "Nothing yet found", "Nothing yet found", "Nothing yet found"])
      }));
    }
    // what people put there, by the system's own marks, on the world that suits each best
    const best = out.planets.slice().sort((a, b) => ({ Habitable: 0, "Marginal: domes and suits": 1, Hostile: 2, Uninhabitable: 3 }[a.hab] - { Habitable: 0, "Marginal: domes and suits": 1, Hostile: 2, Uninhabitable: 3 }[b.hab]))[0];
    if (s.f.colony && best) out.sites.push({ kind: "colony", on: best.n, name: `${best.name} Colony` });
    if (s.f.station) out.sites.push({ kind: "station", on: null, name: `${s.name} ${pick(r, ["Station", "Highport", "Waypoint", "Ring"])}` });
    if (s.f.mining) out.sites.push({ kind: "mining", on: out.belts.length ? null : (out.planets[0] || {}).n, name: `${s.name} Mines` });
    if (s.f.research) out.sites.push({ kind: "research", on: (out.planets[out.planets.length - 1] || {}).n, name: `A research outpost` });
    if (s.f.derelict) out.sites.push({ kind: "derelict", on: null, name: `A derelict ${pick(r, ["freighter", "survey ship", "warship", "colony ship"])}` });
    if (s.f.anomaly) out.sites.push({ kind: "anomaly", on: null, name: pick(r, ["A gravitational anomaly", "A signal with no source", "A region where clocks run slow", "An object that is not on any chart", "A ring of debris too regular to be natural"]) });
    return out;
  }

  /* ---- distances and routes: light years, and the way from one system to another within a ship's reach */
  // (in model 2 the stars stand above and below the plane too: the distance is through space, z kept in light years)
  const dist = (G, a, b) => { const s = G.systems[a], t = G.systems[b]; if (!s.z && !t.z) return Math.hypot(s.x - t.x, s.y - t.y) * G.ly; return Math.hypot((s.x - t.x) * G.ly, (s.y - t.y) * G.ly, (s.z || 0) - (t.z || 0)); };
  // the shortest way, hop by hop, each hop no longer than the jump range; lanes are safer (they count a little less)
  function route(G, from, to, range, opt) {
    const o = opt || {}, N = G.N, best = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N), laneSet = G._laneSet || (G._laneSet = new Set(G.lanes.map(([a, b]) => a + "-" + b)));
    const cell = 40, grid = G._grid || (G._grid = (() => { const m = new Map(); for (const s of G.systems) { const k = Math.floor(s.x / cell) + "," + Math.floor(s.y / cell); (m.get(k) || m.set(k, []).get(k)).push(s.i); } return m; })());
    const rad = range / G.ly, c = Math.ceil(rad / cell);
    const ok = o.can || (() => true);
    // (a corridor the game master gave its own length, G.laneLy, is that long whatever the map says: a jump gate, a
    // fold in space; it is taken even when the stars at its ends stand further apart than the ship can jump)
    const lly = G.laneLy && G.laneLy.size ? G.laneLy : null;
    best[from] = 0; const open = [from];
    const relax = (i, j, d) => {
      if (d > range) return;
      const lane = laneSet.has(Math.min(i, j) + "-" + Math.max(i, j)), w = d * (lane ? 1 : 1.25) + (o.risk ? o.risk(i, j) : 0);
      if (best[i] + w < best[j]) { best[j] = best[i] + w; prev[j] = i; open.push(j); }
    };
    while (open.length) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (best[open[k]] < best[open[bi]]) bi = k;
      const i = open.splice(bi, 1)[0]; if (done[i]) continue; done[i] = 1; if (i === to) break;
      // (a schematic jump map: only its routes, each its own length; where the stars are drawn is only a layout)
      if (G.p && G.p.layout === "schematic") { for (const j of G.adj[i] || []) { if (done[j] || j === i || !ok(j)) continue; relax(i, j, (lly && lly.get(Math.min(i, j) + "-" + Math.max(i, j))) || dist(G, i, j)); } continue; }
      const s = G.systems[i], cx = Math.floor(s.x / cell), cy = Math.floor(s.y / cell);
      for (let a = -c; a <= c; a++) for (let b = -c; b <= c; b++) for (const j of grid.get((cx + a) + "," + (cy + b)) || []) {
        if (done[j] || j === i || !ok(j)) continue;
        relax(i, j, (lly && lly.get(Math.min(i, j) + "-" + Math.max(i, j))) || dist(G, i, j));
      }
      if (lly && G.adj) for (const j of G.adj[i] || []) { const d = lly.get(Math.min(i, j) + "-" + Math.max(i, j)); if (d && !done[j] && ok(j)) relax(i, j, d); }
    }
    if (!isFinite(best[to])) return null;
    const path = []; for (let k = to; k >= 0; k = prev[k]) { path.unshift(k); if (k === from) break; }
    return path[0] === from ? path : null;
  }
  const inRegion = (G, i, kind) => { const s = G.systems[i]; return G.regions.filter(g => (!kind || g.kind === kind) && Math.hypot(g.x - s.x, g.y - s.y) <= g.r); };

  A.galaxyGen = { hash, rng, grow, system, route, dist, inRegion, STARS, STAR_NAME, KINDS, chartPlanet, rework, nameOf, lumOf };
  // the campaign's galaxy: its settings (galaxy.js, written by atlas.js galaxy) and the council's own names and changes
  // over it (ATLAS.galaxyEdit in table.js): { systems: { S12: { name, desc, gm, flags, state } }, territories, home, ship, fuel }
  A.galaxy = p => { A.galaxyParams = Object.assign({}, A.galaxyParams || {}, p || {}); A._galaxy = null; return A; };
  A.galaxyEdit = o => { const cur = A.galaxyOver || {}; A.galaxyOver = Object.assign({}, cur, o || {}, { systems: Object.assign({}, cur.systems || {}, (o || {}).systems || {}), territories: Object.assign({}, cur.territories || {}, (o || {}).territories || {}) }); A._galaxy = null; return A; };
})(typeof ATLAS !== "undefined" ? ATLAS : (typeof module !== "undefined" ? module.exports : this));
