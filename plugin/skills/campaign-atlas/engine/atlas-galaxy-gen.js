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
  const STARS = { O: ["#9bb0ff", 30000, 16], B: ["#aabfff", 800, 6], A: ["#cad7ff", 20, 2], F: ["#f8f7ff", 3, 1.3], G: ["#fff4ea", 1, 1], K: ["#ffd2a1", .3, .75], M: ["#ffad74", .04, .35], D: ["#e8eaff", .01, .6], N: ["#c7d2ff", .001, 1.4], X: ["#401a5a", 0, 10] };
  const STAR_NAME = { O: "a blue giant", B: "a blue-white star", A: "a white star", F: "a yellow-white star", G: "a yellow star like the sun", K: "an orange dwarf", M: "a red dwarf", D: "a white dwarf", N: "a neutron star", X: "a black hole" };

  /* ---- the galaxy: where every system stands, and what the lanes, sectors, regions and powers are */
  function grow(P) {
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
    // the lanes: each system to its nearest neighbours, and a tree through all of them so every system can be reached
    const ly = p.span / W, d2 = (a, b) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
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
    // the sectors: centres spread over the galaxy, each system in the nearest
    const nSec = Math.max(4, Math.min(24, Math.round(N / 45))), rs = rng(p.seed + "|sectors"), secs = [];
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
    const homeS = S.filter(s => s.f.colony && s.f.fuel).sort((a, b) => Math.hypot(a.x - 500, a.y - 500) - Math.hypot(b.x - 500, b.y - 500))[0] || S[0];
    homeS.f.colony = 1; homeS.f.station = 1; homeS.f.fuel = 1;
    const rr = rng(p.seed + "|regions"), regions = [{ kind: "explored", x: homeS.x, y: homeS.y, r: 120 + rr() * 60, name: "Charted space" }];
    for (let k = 0; k < Math.max(2, Math.round(N / 120)); k++) { const s = S[Math.floor(rr() * N)]; if (Math.hypot(s.x - homeS.x, s.y - homeS.y) < 90) continue; regions.push({ kind: "danger", x: s.x, y: s.y, r: 30 + rr() * 45, name: pick(rr, ["The %s Nebula", "The %s Maelstrom", "%s's Graveyard", "The %s Storm", "The Pirate %s"]).replace("%s", word(rr)) }); }
    for (let k = 0; k < Math.max(1, Math.round(N / 300)); k++) { const s = S.filter(t => (t.f.anomaly || t.f.research) && Math.hypot(t.x - homeS.x, t.y - homeS.y) > 110)[k] || S[Math.floor(rr() * N)]; if (Math.hypot(s.x - homeS.x, s.y - homeS.y) < 110) continue; regions.push({ kind: "restricted", x: s.x, y: s.y, r: 18 + rr() * 20, name: `The ${s.name} Exclusion` }); }
    // powers: a few polities grown out from their capitals along the lanes (the council may give its own factions instead)
    const adj = S.map(() => []); for (const [a, b] of lanes.values()) { adj[a].push(b); adj[b].push(a); }
    const rp = rng(p.seed + "|powers"), caps = [homeS].concat(S.filter(s => s.f.colony && s !== homeS).sort(() => rp() - .5).slice(0, Math.max(2, Math.min(7, Math.round(N / 90)))));
    const powers = caps.map((c, k) => ({ id: "p" + k, name: `${pick(rp, ["The", "The Free", "The United", "The", "The Old"])} ${/\d/.test(c.name) ? word(rp) : c.name} ${k === 0 ? "Compact" : pick(rp, ["Hegemony", "League", "Directorate", "Republic", "Combine", "Syndicate", "Dominion"])}`, capital: c.i }));
    const owner = new Array(N).fill(-1), q = []; caps.forEach((c, k) => { owner[c.i] = k; q.push([c.i, 0]); });
    const reach = Math.max(4, Math.round(N / caps.length / 6));
    while (q.length) { const [i, dd] = q.shift(); if (dd >= reach) continue; for (const j of adj[i]) if (owner[j] < 0 && rp() < .85) { owner[j] = owner[i]; q.push([j, dd + 1]); } }
    S.forEach((s, i) => { if (owner[i] >= 0) s.pw = owner[i]; });
    return { p, N, W, ly, systems: S, lanes: [...lanes.values()], sectors: secs, regions, powers, home: homeS.i, adj };
  }

  /* ---- a system opened: its planets, belts, moons and what orbits them, grown from the seed and the system */
  const KINDS = { lava: "Lava world", rocky: "Rocky world", desert: "Desert world", ocean: "Ocean world", garden: "Living world", ice: "Ice world", barren: "Barren world", toxic: "Toxic world", gas: "Gas giant", icegiant: "Ice giant", dwarf: "Dwarf planet" };
  function system(G, i) {
    const s = G.systems[i]; if (!s) return null;
    const r = rng(G.p.seed + "|sys|" + i), st = STARS[s.cls], L = st[1], frost = 2.7 * Math.sqrt(Math.max(L, .0005));
    const out = { star: { cls: s.cls, name: STAR_NAME[s.cls], color: st[0], lum: L, mass: st[2], binary: s.bin }, planets: [], belts: [], sites: [] };
    const n = s.cls === "X" ? Math.floor(r() * 2) : s.cls === "N" || s.cls === "D" ? Math.floor(r() * 3) : 1 + Math.floor(r() * (s.cls === "M" ? 5 : 8));
    let a = .08 + r() * .3 * Math.sqrt(Math.max(L, .01));
    for (let k = 0; k < n; k++) {
      a *= 1.45 + r() * .65;
      if (r() < .12) { out.belts.push({ a: round(a, 2), name: k ? "An asteroid belt" : "A dust belt", rich: r() < .4 }); continue; }
      const temp = Math.round(278 * Math.pow(Math.max(L, .0001), .25) / Math.sqrt(a)) - 273, beyond = a > frost;
      let kind = beyond ? (r() < .55 ? "gas" : r() < .5 ? "icegiant" : r() < .5 ? "ice" : "dwarf") : r() < .18 ? "gas" : temp > 400 ? "lava" : temp > 90 ? (r() < .5 ? "toxic" : "barren") : temp > 45 ? (r() < .6 ? "desert" : "toxic") : temp > -15 ? weighted(r, [["ocean", 3], ["garden", s.cls === "G" || s.cls === "K" ? 2.2 : .5], ["desert", 2], ["rocky", 2], ["toxic", 1]]) : temp > -90 ? weighted(r, [["ice", 3], ["rocky", 2], ["barren", 2]]) : (r() < .6 ? "ice" : "dwarf");
      const giant = kind === "gas" || kind === "icegiant";
      const size = giant ? round(kind === "gas" ? 6 + r() * 7 : 3.5 + r() * 1.5, 1) : kind === "dwarf" ? round(.1 + r() * .2, 2) : round(.3 + r() * 1.6, 2);
      const dens = giant ? .25 : kind === "ice" || kind === "dwarf" ? .55 : kind === "lava" ? 1.1 : 1, grav = round(size * dens * (giant ? 1.4 : 1), 2);
      const air = giant ? "Deep hydrogen and helium" : kind === "dwarf" || size < .35 ? "None" : kind === "toxic" ? pick(r, ["Thick carbon dioxide, sulphur clouds", "Ammonia and methane", "Chlorine haze"]) : kind === "garden" ? "Nitrogen and oxygen: breathable" : kind === "ocean" ? (r() < .35 ? "Nitrogen and oxygen: breathable" : "Nitrogen, too little oxygen to breathe") : kind === "lava" ? "Thin, sulphurous" : size < .6 ? "Thin carbon dioxide" : pick(r, ["Thin nitrogen", "Carbon dioxide", "Nitrogen and argon"]);
      const pres = giant ? null : air === "None" ? 0 : kind === "toxic" ? round(5 + r() * 85, 1) : round(Math.max(.01, size * (.3 + r() * 1.2)), 2);
      const breath = /breathable/.test(air);
      const water = giant ? "" : kind === "ocean" ? "A world ocean" : kind === "garden" ? "Seas, lakes and rivers" : kind === "ice" ? (r() < .4 ? "An ocean under the ice" : "Frozen water") : kind === "desert" ? (r() < .3 ? "Water deep underground" : "") : kind === "toxic" && temp < 100 ? "Seas of acid" : kind === "lava" ? "Seas of molten rock" : "";
      const life = kind === "garden" ? weighted(r, [["Complex life: forests, beasts", 6], ["Simple life: mats, reefs, lichens", 3], ["A people of its own", .5]]) : kind === "ocean" && r() < .45 ? "Simple life in the seas" : /under the ice/.test(water) && r() < .3 ? "Microbes under the ice" : kind === "desert" && water && r() < .3 ? "Hardy microbes, deep in the wet rock" : "";
      const hazards = [temp > 120 && "searing heat", temp < -120 && "killing cold", kind === "toxic" && "corrosive air", grav > 1.6 && "crushing gravity", kind === "lava" && "eruptions", pres > 10 && "crushing pressure", r() < .25 && pick(r, (giant ? ["radiation belts", "lightning storms"] : kind === "lava" ? ["quakes", "toxic fumes"] : kind === "ice" || kind === "dwarf" ? ["ice storms", "crevasses", "radiation"] : kind === "toxic" ? ["acid rain", "crushing storms"] : kind === "desert" ? ["dust storms", "radiation"] : ["quakes", "radiation", "storms"]).concat(/Complex life/.test(life) ? ["predators", "diseases"] : []))].filter(Boolean);
      const land = giant ? "Impossible: no surface" : pres > 60 || temp > 380 ? "Impossible with ordinary equipment" : kind === "toxic" || grav > 1.5 || temp > 110 || temp < -150 ? "Only with specialised equipment" : breath && temp > -30 && temp < 45 ? "Open air" : "Suits needed";
      const hab = breath && life && temp > -20 && temp < 40 && grav < 1.4 ? "Habitable" : land === "Suits needed" ? "Marginal: domes and suits" : land.startsWith("Impossible") ? "Uninhabitable" : "Hostile";
      const minerals = pick(r, ["iron and nickel", "rare earths", "water ice", "silicates", "heavy metals", "platinum group metals", "radioactives", "carbon and graphite", "helium-3"]);
      const moons = giant ? Math.floor(r() * 9) : r() < .4 ? 1 + Math.floor(r() * 2) : 0;
      const name = `${s.name} ${"bcdefghijk"[out.planets.length]}`;
      out.planets.push({ n: out.planets.length, name, kind, kname: KINDS[kind], a: round(a, 2), size, grav, temp, air, pres, water, life, hab, hazards, land, minerals, moons,
        geo: giant ? "Banded storms over no surface at all" : pick(r, { lava: ["Lava fields and fresh volcanoes", "Rivers of molten rock between black crusts"], ice: ["Ice plains and cliffs", "Frozen geysers and crevasse fields"], dwarf: ["Old craters under frost", "A cracked ice crust"], desert: ["Dune seas", "Canyons cut by old rivers", "Salt flats and mesas"], ocean: ["A world ocean, few islands", "Archipelagos and deep trenches"], garden: ["Mountains, forests and plains", "River valleys and old mountains", "Jungles and inland seas"], toxic: ["Volcanic plains under the clouds", "Melted highlands"] }[kind] || ["Old craters", "Great rift valleys", "Mountains and basins", "Glass plains from ancient impacts"]),
        climate: giant ? "Storms the size of worlds" : air === "None" ? "None: no air to carry weather" : temp > 60 ? "Scorching" : temp > 25 ? "Hot" : temp > 0 ? "Temperate" : temp > -60 ? "Cold" : "Frozen",
        chance: pick(r, ["Ruins no survey has explained", "A crashed ship on the night side", "Rich deposits nobody has claimed", "Signals from below the surface", "An abandoned survey camp", "Caves that go further than they should", "Nothing yet found", "Nothing yet found", "Nothing yet found"]) });
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
  const dist = (G, a, b) => { const s = G.systems[a], t = G.systems[b]; return Math.hypot(s.x - t.x, s.y - t.y) * G.ly; };
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

  A.galaxyGen = { hash, rng, grow, system, route, dist, inRegion, STARS, STAR_NAME, KINDS };
  // the campaign's galaxy: its settings (galaxy.js, written by atlas.js galaxy) and the council's own names and changes
  // over it (ATLAS.galaxyEdit in table.js): { systems: { S12: { name, desc, gm, flags, state } }, territories, home, ship, fuel }
  A.galaxy = p => { A.galaxyParams = Object.assign({}, A.galaxyParams || {}, p || {}); A._galaxy = null; return A; };
  A.galaxyEdit = o => { const cur = A.galaxyOver || {}; A.galaxyOver = Object.assign({}, cur, o || {}, { systems: Object.assign({}, cur.systems || {}, (o || {}).systems || {}), territories: Object.assign({}, cur.territories || {}, (o || {}).territories || {}) }); A._galaxy = null; return A; };
})(typeof ATLAS !== "undefined" ? ATLAS : (typeof module !== "undefined" ? module.exports : this));
