/* Campaign Atlas: the players' own maps, drawn by hand on parchment (the user, 16 Nov 2026: "crude, historically
   inspired, hand-drawn player maps ... as if drawn by a commoner, traveler, village elder or merchant ... incomplete,
   inaccurate in believable ways ... the DM should be able to draw, write and add information directly onto this map
   as the players learn more"; docs/requests/2026-11-16-player-parchment-maps.md).
   - A map is made from the world the referee has (the same places, roads, rivers, coasts and mountains), as one
     person would know it: around their home, as far as their life has taken them (a villager a day or two's walk, a
     merchant along the trade roads, a scout the forts and passes, a cartographer far and well). Beyond that, nothing;
     a great city far off only as a rumour. What they know they draw imperfectly: the farther from home, the more out
     of place; mountains too big, forests too round, roads too straight, distances squeezed. The same map comes out
     the same every time (its seed); the referee's world is never changed.
   - Hidden things stay hidden: a place the party does not know of that is not an ordinary settlement (a lair, a
     dungeon, a ruin, a cave...) is never drawn, nor a hidden road; and nothing reaches the players until the referee
     gives them the map.
   - The map is a list of separate drawn things (a coast, a river, a village, a word, a note, a sketch), each on its
     layer, each with how sure it is (confirmed, rumoured, uncertain, wrong), lockable, the referee's own or the
     players'; the referee draws, writes, stamps symbols, reveals places and corrects rumours on it as the game goes.
     Never flattened into a picture: an exported picture is a copy.
   It is kept among the world map's own changes (the "world" collection, docs "pm-<id>": undo and redo with them), and
   the players' copy gets each given map with the referee's own layer and everything marked hidden taken out. */
(function (A) {
  "use strict";
  const esc = A.esc || (s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]));
  const r1 = v => Math.round(v * 10) / 10, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (a, b, s) => { let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(s | 0, 83492791)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y, s) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sm = t => t * t * (3 - 2 * t); return a + (b - a) * sm(u) + (c - a) * sm(v) + (a - b - c + d) * sm(u) * sm(v); };
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---- who drew it: how far they know, how well they draw, what they care about (presets, not rules: the referee
          changes any of it) */
  const MAKERS = {
    commoner: { name: "A village commoner", km: 45, err: .2, roads: false, places: 5, labels: "few", rivers: .9, detail: .45, keep: ["village", "hamlet", "town", "farm", "inn", "manor", "temple", "shrine", "bridge", "mill"], say: "only the country about home: the village, the wood, the river, the road to the next town; mountains seen far off" },
    elder: { name: "A village elder", km: 70, err: .16, roads: false, places: 8, labels: "some", rivers: 1, detail: .55, keep: ["village", "hamlet", "town", "farm", "inn", "manor", "temple", "shrine", "monastery", "bridge", "ruin", "stones", "grove"], say: "the old country round about, with its old places and tales" },
    traveler: { name: "A traveler", km: 240, err: .12, roads: true, places: 14, labels: "most", rivers: 1, detail: .6, keep: ["capital", "city", "town", "village", "port", "inn", "castle", "temple", "monastery", "bridge"], say: "the roads walked and the towns along them, the distances roughly" },
    merchant: { name: "A merchant", km: 420, err: .09, roads: true, places: 16, labels: "most", rivers: 1, detail: .6, keep: ["capital", "city", "town", "port", "inn", "market", "bridge", "mine", "castle"], say: "the trade roads, the market towns and ports, the river crossings" },
    scout: { name: "A soldier or scout", km: 300, err: .07, roads: true, places: 16, labels: "most", rivers: 1, detail: .7, keep: ["capital", "city", "town", "castle", "keep", "fort", "tower", "camp", "bridge", "port", "village"], say: "roads, forts, bridges, passes and the high ground that matters" },
    cartographer: { name: "A cartographer", km: 1400, err: .025, roads: true, places: 40, labels: "all", rivers: 1, detail: .9, keep: ["capital", "city", "town", "village", "port", "castle", "keep", "fort", "temple", "monastery", "bridge", "inn", "tower"], say: "far and well: the coasts, the ranges, the rivers and most towns, to a fair scale" }
  };
  // the kinds a map may show without the party knowing of them: ordinary places anyone would; never a lair, a dungeon,
  // a cave, a ruin or anything secret (those only once the party knows them)
  const PUBLIC = new Set(["capital", "city", "town", "village", "hamlet", "port", "castle", "keep", "fort", "manor", "farm", "inn", "temple", "monastery", "bridge", "tower", "market", "mill", "shrine", "mine"]);
  const SYM_OF = { capital: "city", city: "city", town: "town", village: "village", hamlet: "village", farm: "village", manor: "village", port: "port", castle: "castle", keep: "castle", fort: "castle", tower: "tower", ruin: "ruin", temple: "temple", shrine: "temple", monastery: "temple", inn: "inn", bridge: "bridge", cave: "cave", dungeon: "cave", lair: "danger", mine: "cave", camp: "camp", stones: "landmark", grove: "forest", landmark: "landmark", battlefield: "danger", wreck: "danger" };

  /* ---- a map made from the world */
  // WD: the world as the page has it (atlas-world.js prepareWorld); o: { maker, home (a place's id), seed, name, accuracy (0 crude .. 1 careful, default the maker's) }
  function generate(WD, o) {
    o = o || {}; const M = Object.assign({}, MAKERS[o.maker] || MAKERS.commoner), seed = o.seed || 1 + Math.floor(Math.random() * 99999);
    if (o.accuracy != null) M.err = M.err * (1.6 - 1.4 * clamp(+o.accuracy, 0, 1));
    const [W, H] = WD.size, G = WD.G, D = A.worldDraw, kmU = WD.scale && WD.scale.per ? WD.scale.per * (/mile/.test(WD.scale.unit || "") ? 1.609 : /km/.test(WD.scale.unit || "") ? 1 : 1) : 3;
    const R = Math.min(Math.max(W, H) * .75, M.km / kmU);
    // home: the place asked; else where the party is; else the greatest known settlement; else the middle
    const locs = WD.locs.filter(l => Array.isArray(l.at));
    const home = WD.byId[o.home] || (WD.party && WD.byId[WD.party.at]) || locs.filter(l => l.state !== "unknown" && PUBLIC.has(l.kind)).sort((a, b) => (+["capital", "city", "town"].includes(b.kind)) - (+["capital", "city", "town"].includes(a.kind)))[0] || null;
    const Hc = home ? home.at.slice() : [W / 2, H / 2];
    // the mapmaker's error: the farther from home, the more out of place (always the same for this map)
    const warp = p => {
      const dx = p[0] - Hc[0], dy = p[1] - Hc[1], d = Math.hypot(dx, dy), f = d / R;
      // (distances squeezed far off, as one who has not walked them draws them)
      const sq = f > .6 ? 1 - .25 * M.err * 4 * smooth(.6, 2, f) : 1, k = (1 + (vn(p[0] / R * 1.7, p[1] / R * 1.7, seed) - .5) * M.err * 1.6) * sq;
      const ox = (vn(p[0] / R * 2.3 + 7, p[1] / R * 2.3, seed + 1) - .5) * 2, oy = (vn(p[0] / R * 2.3, p[1] / R * 2.3 + 9, seed + 2) - .5) * 2, wob = M.err * (R * .05 + d * .45);
      return [Hc[0] + dx * k + ox * wob, Hc[1] + dy * k + oy * wob];
    };
    const near = (p, m) => Math.hypot(p[0] - Hc[0], p[1] - Hc[1]) <= R * (m || 1);
    const els = [], add = e => { e.id = e.id || uid(); e.gen = 1; els.push(e); return e; };
    const simp = (pts, eps) => { if (pts.length < 3) return pts; const out = [pts[0]]; let last = pts[0]; for (let i = 1; i < pts.length - 1; i++) if (Math.hypot(pts[i][0] - last[0], pts[i][1] - last[1]) >= eps) { out.push(pts[i]); last = pts[i]; } out.push(pts[pts.length - 1]); return out; };
    const eps = R * (.035 + .2 * M.err);
    // the coast, as far as they know it: runs of the coastline near home, simplified and wandering
    if (G && D) {
      const coast = D.coastRings(G);
      for (const ring of coast) {
        let run = [];
        const flush = () => { if (run.length > 3) add({ k: "line", t: "coast", pts: simp(run, eps).map(warp), layer: "geo", st: "c" }); run = []; };
        for (const p of ring) { if (near(p, 1.05)) run.push(p); else flush(); }
        flush();
      }
      // mountains: high ground they know, and the great ranges seen far off (drawn bigger than they are)
      const S = D.sampler(G), sea = G.sea, step = R / (7 + 8 * M.detail), peaks = [], seeFar = M.km < 150 ? 4 : 1.9;
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
        const jx = x + (hash(x, y, seed) - .5) * step * .8, jy = y + (hash(y, x, seed + 3) - .5) * step * .8, h = S(jx, jy), t = (h - sea) / (255 - sea);
        if (t > .38 && near([jx, jy], 1) || t > .55 && near([jx, jy], seeFar)) peaks.push([jx, jy, t]);
      }
      // (far mountains, seen from home, drawn at the sheet's edge in their direction: a row on the horizon)
      for (const [x, y, t] of peaks) { const inside = near([x, y], 1), dx = x - Hc[0], dy = y - Hc[1], d = Math.hypot(dx, dy) || 1, p = inside ? [x, y] : [Hc[0] + dx / d * R * (1.05 + .15 * hash(x, y, seed + 8)), Hc[1] + dy / d * R * (1.05 + .15 * hash(y, x, seed + 8))]; if (!inside && hash(x, y, seed + 9) > .5) continue; add({ k: "sym", s: t > .5 ? "mountain" : "hill", at: warp(p), size: step * (.55 + .7 * t) * (1 + M.err * 2), layer: "geo", st: "c", far: inside ? undefined : 1 }); }
      // forests and fens: a few clumps where the trees are thick
      const B = G.B, C = G.Cn, CODE = A.worldBiomes ? A.worldBiomes.CODE : {}, fs = step * 1.6;
      // (the forest cells on a grid, gathered into woods; each wood drawn as a cluster of trees where it stands, more
      // trees the bigger it is, not an even scatter)
      const gx = Math.ceil(W / fs), gy = Math.ceil(H / fs), FK = new Uint8Array(gx * gy);
      for (let b = 0; b < gy; b++) for (let a = 0; a < gx; a++) {
        const x = (a + .5) * fs, y = (b + .5) * fs; if (!near([x, y], .95)) continue;
        const i = Math.min(G.cols - 1, Math.floor(x / G.cell)), j = Math.min(G.rows - 1, Math.floor(y / G.cell)), n = j * G.cols + i;
        if (S(x, y) <= sea) { if (hash(x, y, seed + 12) < .3) { let land = false; for (const [ox, oy] of [[fs, 0], [-fs, 0], [0, fs], [0, -fs]]) if (S(x + ox, y + oy) > sea) land = true; if (land) add({ k: "sym", s: "wave", at: warp([x, y]), size: fs * .35, layer: "geo", st: "c" }); } continue; }
        FK[b * gx + a] = C ? (C[n] > 120 ? 1 : 0) : B && B[n] === CODE.forest ? 1 : 0;
        if (B && B[n] === CODE.swamp) FK[b * gx + a] = 2;
      }
      const seenF = new Uint8Array(gx * gy);
      for (let q0 = 0; q0 < gx * gy; q0++) {
        if (!FK[q0] || seenF[q0]) continue; const kind = FK[q0], cells = [q0], stq = [q0]; seenF[q0] = 1;
        while (stq.length) { const q = stq.pop(), a = q % gx, b = (q / gx) | 0; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a2 = a + da, b2 = b + db; if (a2 < 0 || b2 < 0 || a2 >= gx || b2 >= gy) continue; const m = b2 * gx + a2; if (FK[m] === kind && !seenF[m]) { seenF[m] = 1; stq.push(m); cells.push(m); } } }
        const many = Math.min(cells.length, Math.max(1, Math.round(Math.sqrt(cells.length) * (1.6 + 2 * M.detail))));
        for (let t = 0; t < many; t++) { const q = cells[Math.floor(hash(q0, t, seed + 13) * cells.length)], x = (q % gx + .2 + .6 * hash(t, q, seed + 14)) * fs, y = (((q / gx) | 0) + .2 + .6 * hash(q, t, seed + 15)) * fs; add({ k: "sym", s: kind === 2 ? "swamp" : "forest", at: warp([x, y]), size: fs * (.42 + hash(y, x, seed + 6) * .3) * (1 + M.err), layer: "geo", st: "c" }); }
      }
    }
    // rivers: the ones near home (a commoner knows the big ones), wandering off their true courses
    for (const rv of WD.rivers || []) {
      if (!rv.pts || rv.pts.length < 2) continue; if ((rv.w || 1) < 1.3 && M.rivers < 1) continue;
      let run = [];
      const flush = () => { if (run.length > 2) add({ k: "line", t: "river", pts: simp(run, eps * .8).map(warp), layer: "geo", st: "c", w: rv.w || 1.2, label: M.labels !== "few" && rv.name ? rv.name : "" }); run = []; };
      for (const p of rv.pts) { if (near(p, 1)) run.push(p); else flush(); }
      flush();
    }
    // the places they know: ordinary places near home (or along their roads), and those the party knows of
    const dHome = l => Math.hypot(l.at[0] - Hc[0], l.at[1] - Hc[1]);
    const byRoad = new Map(); if (M.roads && home) { const q = [[home.id, 0]]; byRoad.set(home.id, 0); for (let h = 0; h < q.length; h++) { const [id, d] = q[h]; for (const r of WD.routes) { if (r.hidden || !(r.kind in { road: 1, trail: 1, pass: 1, river: 1 })) continue; const other = r.from === id ? r.to : r.to === id ? r.from : null; if (!other || !WD.byId[other]) continue; const a = WD.byId[id], b = WD.byId[other], nd = d + Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]); if (nd <= R * 1.1 && (!byRoad.has(other) || byRoad.get(other) > nd)) { byRoad.set(other, nd); q.push([other, nd]); } } } }
    const cand = locs.filter(l => {
      if (l.state === "unknown" && !PUBLIC.has(l.kind)) return false;   // never a secret place the party does not know
      if (l === home) return true;
      return (near(l.at, 1) || byRoad.has(l.id)) && (M.keep.includes(l.kind) || l.state === "visited" || l.state === "done");
    }).sort((a, b) => (a === home ? -1 : b === home ? 1 : 0) || dHome(a) - dHome(b));
    const placed = cand.slice(0, M.places + 1), have = new Set(placed.map(l => l.id));
    for (const l of placed) {
      const lab = M.labels === "all" || l === home || M.labels !== "few" && ["capital", "city", "town", "port"].includes(l.kind) || M.labels === "most" || M.labels === "some" && ["capital", "city", "town", "village"].includes(l.kind) ? l.name : "";
      add({ k: "sym", s: SYM_OF[l.kind] || "village", at: warp(l.at), size: R * (l.kind === "capital" || l.kind === "city" ? .07 : .05), label: lab, layer: "places", st: l.state === "rumoured" ? "r" : "c", loc: l.id, home: l === home ? 1 : undefined });
    }
    // a great city far off, known only by name and a rough way (a rumour, drawn at the map's edge)
    const far = locs.filter(l => (l.kind === "capital" || l.kind === "city") && !have.has(l.id) && !near(l.at, 1)).sort((a, b) => dHome(a) - dHome(b))[0];
    if (far && M.km < 800) { const dx = far.at[0] - Hc[0], dy = far.at[1] - Hc[1], d = Math.hypot(dx, dy) || 1, p = [Hc[0] + dx / d * R * 1.15, Hc[1] + dy / d * R * 1.15]; add({ k: "sym", s: "city", at: p, size: R * .06, label: far.name, layer: "places", st: "r", loc: far.id }); add({ k: "line", t: "path", pts: [[Hc[0] + dx / d * R * .85, Hc[1] + dy / d * R * .85], [Hc[0] + dx / d * R * 1.06, Hc[1] + dy / d * R * 1.06]], layer: "roads", st: "r", arrow: 1 }); }
    // roads between the places drawn (never a hidden one), straighter than they are
    for (const r of WD.routes) {
      if (r.hidden || !have.has(r.from) || !have.has(r.to) || !(r.kind in { road: 1, trail: 1, pass: 1 })) continue;
      const a = WD.byId[r.from], b = WD.byId[r.to], path = Array.isArray(r.path) && r.path.length > 1 ? r.path : [a.at, b.at];
      add({ k: "line", t: r.kind === "trail" ? "path" : "road", pts: simp([a.at, ...path.slice(1, -1), b.at], eps * 2.2).map(warp), layer: "roads", st: "c", route: r.id, label: M.labels === "all" && r.name ? r.name : "" });
    }
    // the names they use for the land about them
    if (M.labels !== "few") for (const lb of WD.labels || []) { if (!lb.name || !Array.isArray(lb.at) || !near(lb.at, .9) || /sea|ocean/.test(lb.kind || "") && M.labels !== "all") continue; add({ k: "text", at: warp(lb.at), label: lb.name, size: R * .035, layer: "text", st: "c" }); }
    // the sheet: what they drew, and a margin
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const grow = p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); };
    for (const e of els) (e.pts || [e.at]).forEach(grow); grow([Hc[0] - R * .5, Hc[1] - R * .4]); grow([Hc[0] + R * .5, Hc[1] + R * .4]);
    const m = Math.max(x1 - x0, y1 - y0) * .08; x0 -= m; y0 -= m; x1 += m; y1 += m;
    // (a sheet a little wider than tall)
    if ((x1 - x0) / (y1 - y0) < 1.3) { const w = (y1 - y0) * 1.3, c = (x0 + x1) / 2; x0 = c - w / 2; x1 = c + w / 2; }
    // (room at the top for the title, above what was drawn)
    y0 -= (y1 - y0) * .1;
    if (home && M.labels !== "all") add({ k: "text", at: [(x0 + x1) / 2, y0 + (y1 - y0) * .07], label: o.title || `${home.name} and thereabouts`, size: (y1 - y0) * .045, layer: "text", st: "c", title: 1 });
    const style = Object.assign({ paper: "aged", wear: .5, ink: "brown", width: 1, rough: clamp(.35 + M.err * 2.6, .2, 1), hand: M.err > .1 ? "scrawl" : M.err > .05 ? "hand" : "fair", detail: M.detail }, o.style || {});
    return { id: o.id || uid(), name: o.name || `${M.name}'s map`, maker: o.maker || "commoner", home: home ? home.id : null, seed, accuracy: o.accuracy, made: Date.now(), frame: [r1(x0), r1(y0), r1(x1 - x0), r1(y1 - y0)], style, given: false, layers: { geo: 1, places: 1, roads: 1, text: 1, notes: 1, dm: 1 }, els, R: r1(R), H: Hc.map(r1) };
  }
  function smooth(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // the land about one place, sketched onto a map at its mapmaker's skill (to reveal a region as the party learns it):
  // the new elements only, the places already on the map left out
  function sketchRegion(WD, map, locId, km) {
    const sub = generate(WD, { maker: "cartographer", home: locId, seed: map.seed + 101, accuracy: .3, style: map.style });
    const M = MAKERS[map.maker] || MAKERS.commoner, onMap = new Set(map.els.filter(e => e.loc).map(e => e.loc)), kmU = WD.scale && WD.scale.per ? WD.scale.per * (/mile/.test(WD.scale.unit || "") ? 1.609 : 1) : 3, rr = (km || Math.max(40, M.km * .6)) / kmU, L = WD.byId[locId];
    if (!L) return [];
    const inR = p => Math.hypot(p[0] - L.at[0], p[1] - L.at[1]) <= rr;
    return sub.els.filter(e => !e.title && !(e.loc && onMap.has(e.loc)) && (e.at ? inR(e.at) : (e.pts || []).some(inR))).map(e => Object.assign(e, { id: uid(), gen: undefined, at: e.at, pts: e.pts && e.pts.filter(inR).length > 1 ? e.pts.filter(inR) : e.pts }));
  }

  /* ---- drawing it, in ink on parchment */
  const PAPER = { aged: ["#e9d9b2", "#d8c08a"], pale: ["#f1e7cc", "#e0cfa4"], brown: ["#d9bf8c", "#b9975c"], grey: ["#e2ddd0", "#c8c1af"] };
  const INK = { brown: "#4a3220", black: "#211a14", sepia: "#6b4b2b", iron: "#2b2c3a" };
  const HANDS = { scrawl: "'Caveat', 'Comic Sans MS', cursive", hand: "'Homemade Apple', 'Caveat', cursive", fair: "'IM Fell English', 'Georgia', serif" };
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Homemade+Apple&family=IM+Fell+English:ital@0;1&display=swap";
  function loadFonts() { if (typeof document === "undefined" || document.getElementById("atlas-pmap-fonts")) return; const l = document.createElement("link"); l.id = "atlas-pmap-fonts"; l.rel = "stylesheet"; l.href = FONT_URL; document.head.appendChild(l); }
  // a line as a hand draws it: wavering about its course, never quite straight, the ink heavier and lighter
  function rough(pts, sc, rgh, seed) {
    if (!pts || pts.length < 2) return "";
    const out = [], step = sc * 2.2;
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step)), nx = -(by - ay) / (L || 1), ny = (bx - ax) / (L || 1); for (let k = 0; k < n; k++) { const t = k / n, w = (hash(i * 31 + k, seed, 7) - .5) * sc * .9 * rgh; out.push([ax + (bx - ax) * t + nx * w, ay + (by - ay) * t + ny * w]); } }
    out.push(pts[pts.length - 1]);
    let d = `M${r1(out[0][0])} ${r1(out[0][1])}`; for (let i = 1; i < out.length; i++) { const p = out[i - 1], q = out[i]; d += ` Q${r1(p[0])} ${r1(p[1])} ${r1((p[0] + q[0]) / 2)} ${r1((p[1] + q[1]) / 2)}`; }
    const l = out[out.length - 1]; return d + ` L${r1(l[0])} ${r1(l[1])}`;
  }
  // the symbols, as a hand with a pen makes them: each a few strokes about (0,0), size 1 (a quick sketch, not an icon)
  const SYM = {
    village: "M-.5 .3h.4v-.3l.2-.22l.2 .22v.3M.1 .3h.4v-.2l.2-.18l.2 .18v.2M-.65 .32h1.3",
    town: "M-.6 .35h1.2M-.5 .35v-.35l.25-.25l.25 .25v.35M0 .35v-.55l.3-.3l.3 .3v.55M-.15-.2h.1",
    city: "M-.7 .4h1.4M-.65 .4v-.5h.3v.5M-.2 .4v-.8l.2-.25l.2 .25v.8M.35 .4v-.55h.3v.55M-.65-.1h1.3",
    castle: "M-.45 .4v-.7h.9v.7M-.45-.3v-.15h.15v.1h.15v-.1h.15v.1h.15v-.1h.15v.15M-.12 .4v-.25a.12 .12 0 0 1 .24 0v.25",
    tower: "M-.18 .45v-.8h.36v.8M-.24-.35h.48M-.24-.35v-.1h.12v.06h.12v-.06h.12v.1M-.05-.15h.1",
    ruin: "M-.45 .4v-.4M-.45 0l.12-.1v.2M-.2 .4v-.25l.1 .08M.1 .4v-.5l.12-.06v.2M.35 .4v-.2M-.55 .42h1.1",
    temple: "M-.4 .4v-.45h.8v.45M-.5-.05l.5-.35l.5 .35M0-.4v-.25M-.1-.55h.2",
    inn: "M-.35 .4v-.45l.35-.3l.35 .3v.45M.35-.1h.25M.6-.1v.2h-.15v-.2",
    port: "M0-.45v.8M-.25-.3h.5M-.4 .1q.4 .45 .8 0M0-.55a.08 .08 0 1 0 .01 0",
    bridge: "M-.6-.15q.6-.25 1.2 0M-.6 .15q.6-.25 1.2 0M-.4-.18v.3M0-.25v.3M.4-.18v.3",
    mountain: "M-.6 .35l.45-.75l.2.3l.15-.12l.4.57M-.15-.4l-.12 .35M-.02-.05l-.1 .32M.17-.2l.1.3",
    hill: "M-.5 .25q.5-.6 1 0M-.1-.05q.1 .1 .2 .25",
    forest: "M-.34 .25v-.12M-.34-.38l-.14 .26h.28zM-.34-.22l-.17 .24h.34zM.02 .3v-.14M.02-.42l-.16 .3h.32zM.02-.24l-.2 .28h.4zM.36 .24v-.1M.36-.3l-.13 .22h.26zM.36-.16l-.16 .2h.32z",
    wave: "M-.5 0q.12-.15 .25 0t.25 0t.25 0t.25 0",
    tree: "M0 .35v-.18M0-.45l-.18 .32h.36zM0-.25l-.24 .32h.48z",
    lake: "M-.55 0q0-.3 .55-.3q.55 0 .55 .3q0 .3-.55 .3q-.55 0-.55-.3M-.3 0h.25M.05 .08h.2",
    swamp: "M-.5 .25h.35M.1 .25h.4M-.3 .25v-.25M-.36 .02l.06-.1l.06 .1M.25 .25v-.2M.19 .07l.06-.1l.06 .1M-.2 .4h.4",
    cave: "M-.45 .3q0-.65 .45-.65q.45 0 .45 .65M-.18 .3q0-.3 .18-.3q.18 0 .18 .3M-.55 .3h1.1",
    danger: "M-.3-.3l.6 .6M.3-.3l-.6 .6M0-.45a.06 .06 0 1 0 .01 0",
    unknown: "M-.18-.25q0-.2 .2-.2q.2 0 .2 .18q0 .14-.2 .22v.12M0 .3a.04 .04 0 1 0 .01 0",
    camp: "M-.4 .35l.4-.65l.4 .65M0-.3v.65M-.15 .35l.15-.25l.15 .25",
    landmark: "M-.12 .4v-.7q.12-.12 .24 0v.7M-.3 .42h.6",
    note: "M-.3-.35h.6v.7h-.6zM-.18-.18h.36M-.18-.05h.36M-.18 .08h.24",
    x: "M-.3-.3l.6 .6M.3-.3l-.6 .6"
  };
  const SYMBOLS = [["village", "Village"], ["town", "Town"], ["city", "City"], ["castle", "Castle"], ["tower", "Tower"], ["ruin", "Ruin"], ["temple", "Temple"], ["inn", "Inn"], ["port", "Port"], ["bridge", "Bridge"], ["mountain", "Mountain"], ["hill", "Hill"], ["forest", "Forest"], ["tree", "Tree"], ["lake", "Lake"], ["swamp", "Swamp"], ["cave", "Cave"], ["camp", "Camp"], ["landmark", "Standing stone"], ["danger", "Danger"], ["unknown", "Unknown"], ["x", "X marks the spot"]];
  // one drawn thing as SVG; sc: the sheet's ink unit
  function elSVG(e, sc, st, ink) {
    const op = e.st === "u" ? .55 : e.far ? .6 : 1, dash = e.st === "r" ? ` stroke-dasharray="${r1(sc * 2.2)} ${r1(sc * 1.6)}"` : "", rg = st.rough, seed = hash(e.id ? e.id.length * 977 + e.id.charCodeAt(0) : 1, e.id ? e.id.charCodeAt(e.id.length - 1) : 3, 5) * 9999 | 0, w = sc * .55 * st.width;
    const font = HANDS[st.hand] || HANDS.scrawl, lab = (txt, x, y, size, anchor) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(size)}" font-family="${font}" fill="${ink}" text-anchor="${anchor || "middle"}" transform="rotate(${r1((hash(seed, 3, 9) - .5) * 6)} ${r1(x)} ${r1(y)})"${e.st === "x" ? ' text-decoration="line-through"' : ""}>${esc(txt)}${e.st === "r" || e.st === "u" ? "?" : ""}</text>`;
    let s = "";
    if (e.k === "line") {
      const t = e.t, W = t === "river" ? w * (1.1 + .25 * (e.w || 1)) : t === "road" ? w * .9 : t === "coast" ? w * 1.25 : t === "border" ? w * .8 : w, d = rough(e.pts, sc, rg * (t === "coast" ? 1.3 : 1), seed);
      if (t === "coast") s += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${r1(W)}" stroke-linecap="round" stroke-linejoin="round"${dash}/><path d="${rough(e.pts.map(p => [p[0] + sc * .9, p[1] + sc * .9]), sc, rg * 1.6, seed + 1)}" fill="none" stroke="${ink}" stroke-opacity=".28" stroke-width="${r1(W * .45)}"/>`;
      else if (t === "river") s += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${r1(W)}" stroke-linecap="round"${dash}/>`;
      else if (t === "road") s += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${r1(W)}" stroke-linecap="round" stroke-dasharray="${r1(sc * 2.4)} ${r1(sc * 1.2)}"/>`;
      else if (t === "path") s += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${r1(W * .8)}" stroke-linecap="round" stroke-dasharray="${r1(sc * .4)} ${r1(sc * 1.3)}"/>`;
      else if (t === "border") s += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${r1(W)}" stroke-dasharray="${r1(sc * 3)} ${r1(sc)} ${r1(sc * .4)} ${r1(sc)}"/>`;
      else s += `<path d="${d}" fill="none" stroke="${e.c || ink}" stroke-width="${r1(W * (e.ww || 1))}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
      if (e.arrow) { const n = e.pts.length, [ax, ay] = e.pts[n - 1], [bx, by] = e.pts[n - 2], a = Math.atan2(ay - by, ax - bx), h = sc * 2.4; s += `<path d="M${r1(ax - Math.cos(a - .5) * h)} ${r1(ay - Math.sin(a - .5) * h)}L${r1(ax)} ${r1(ay)}L${r1(ax - Math.cos(a + .5) * h)} ${r1(ay - Math.sin(a + .5) * h)}" fill="none" stroke="${ink}" stroke-width="${r1(W)}"/>`; }
      if (e.label) { const p = e.pts[Math.floor(e.pts.length / 2)]; s += lab(e.label, p[0], p[1] - sc * 1.6, sc * 3.2); }
    } else if (e.k === "sym") {
      const [x, y] = e.at, z = e.size || sc * 8, d = SYM[e.s] || SYM.unknown, sw = r1(w / z * 1.25);
      s += `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(z)}) rotate(${r1((hash(seed, 1, 2) - .5) * 8)})"><path d="${d}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${e.st === "r" ? ` stroke-dasharray="${r1(.12)} ${r1(.08)}"` : ""}/>${e.s === "mountain" ? `<path d="M-.15-.4l.55 .75" stroke="${ink}" stroke-opacity=".35" stroke-width="${r1(+sw * 2.5)}"/>` : ""}${e.home ? `<circle r=".75" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-dasharray=".12 .1"/>` : ""}${e.st === "x" ? `<path d="${SYM.x}" transform="scale(1.4)" stroke="#8a2a1a" stroke-width="${sw}" fill="none"/>` : ""}</g>`;
      if (e.label) s += lab(e.label, x, y + z * .55 + sc * 3, sc * 3.3);
      else if ((e.st === "r" || e.st === "u") && e.layer !== "geo") s += lab("", x + z * .45, y - z * .3, sc * 3.6, "start");
    } else if (e.k === "text") {
      const [x, y] = e.at; s += lab(e.label || "", x, y, e.size || sc * 3.6);
    } else if (e.k === "note") {
      const [x, y] = e.at; s += `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(sc * 3)})"><path d="${SYM.note}" fill="none" stroke="${ink}" stroke-width="${r1(w / (sc * 3))}"/></g>` + (e.label ? lab(e.label, x + sc * 2.4, y + sc * 1.2, sc * 5, "start") : "");
    }
    return `<g class="pm-el${e.dm ? " pm-dm" : ""}" data-pm="${esc(e.id || "")}" opacity="${op}">${s}</g>`;
  }
  // the whole sheet. o: { player (leave out the referee's own), sel (the chosen element's id) }
  function render(map, o) {
    o = o || {}; const st = Object.assign({ paper: "aged", wear: .5, ink: "brown", width: 1, rough: .5, hand: "scrawl" }, map.style || {}), [fx, fy, fw, fh] = map.frame, sc = Math.max(fw, fh) / 320, ink = INK[st.ink] || st.ink || INK.brown, [p0, p1] = PAPER[st.paper] || PAPER.aged, seed = map.seed || 1, u = "pm" + (seed % 100000);
    const show = e => (!o.player || (!e.dm && e.layer !== "dm" && !e.hide)) && (map.layers || {})[e.layer || "notes"] !== 0;
    let s = `<defs><filter id="${u}-g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${r1(1.2 / sc) / 10}" numOctaves="4" seed="${seed % 97}"/><feColorMatrix values="0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .12 0 0 0 ${r1(.18 + .2 * st.wear)} 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`
      + `<radialGradient id="${u}-v" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="${p0}" stop-opacity="0"/><stop offset="1" stop-color="${p1}" stop-opacity="${r1(.55 + .4 * st.wear)}"/></radialGradient>`
      + `<filter id="${u}-i"><feTurbulence type="fractalNoise" baseFrequency="${r1(4 / sc) / 10}" numOctaves="2" seed="${(seed + 7) % 97}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${r1(sc * .5)}"/></filter></defs>`;
    // the sheet: its edge torn a little, its grain, its stains and darkened edges
    const ed = [], n = 60; for (let k = 0; k < n; k++) { const t = k / n, side = Math.floor(t * 4), f = t * 4 - side, j = (hash(k, seed, 11) - .5) * sc * 2.4 * (.5 + st.wear); const P = [[fx + fw * f, fy + j], [fx + fw + j, fy + fh * f], [fx + fw * (1 - f), fy + fh + j], [fx + j, fy + fh * (1 - f)]][side]; ed.push(P); }
    const edge = "M" + ed.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
    s += `<path d="${edge}" fill="${p0}"/><path d="${edge}" fill="${p0}" filter="url(#${u}-g)"/><path d="${edge}" fill="url(#${u}-v)"/>`;
    for (let k = 0; k < Math.round(1 + st.wear * 5); k++) { const cx = fx + fw * (.1 + .8 * hash(k, seed, 21)), cy = fy + fh * (.1 + .8 * hash(k, seed, 22)), rr = Math.min(fw, fh) * (.04 + .1 * hash(k, seed, 23)); const ring = []; for (let q = 0; q < 24; q++) { const a = q / 24 * 6.283, rq = rr * (.7 + .5 * vn(Math.cos(a) * 1.5 + k * 3, Math.sin(a) * 1.5, seed + 30)); ring.push([cx + Math.cos(a) * rq, cy + Math.sin(a) * rq * .75]); } const dR = "M" + ring.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z"; s += `<path d="${dR}" fill="${p1}" fill-opacity="${r1(.06 + .09 * st.wear)}" stroke="${p1}" stroke-opacity="${r1(.15 + .2 * st.wear)}" stroke-width="${r1(sc * 1.1)}"/>`; }
    s += `<path d="${edge}" fill="none" stroke="${p1}" stroke-width="${r1(sc * 1.2)}" stroke-opacity=".8"/>`;
    // the ink, faded here and there, in the layers' order
    const order = ["geo", "roads", "places", "text", "notes", "dm"];
    let ink$ = "";
    for (const L of order) for (const e of map.els || []) if ((e.layer || "notes") === L && show(e)) ink$ += elSVG(e, sc, st, ink) + (o.sel && o.sel === e.id ? selBox(e, sc) : "");
    s += `<g filter="url(#${u}-i)" opacity="${r1(.95 - .15 * st.wear)}">${ink$}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="pm-svg" viewBox="${r1(fx - sc * 4)} ${r1(fy - sc * 4)} ${r1(fw + sc * 8)} ${r1(fh + sc * 8)}" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
  }
  function bounds(e, sc) { if (e.pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of e.pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; } const z = e.k === "sym" ? (e.size || sc * 8) * .7 : (e.size || sc * 3.6) * Math.max(2, (e.label || "").length * .3); return [e.at[0] - z, e.at[1] - z * .7, e.at[0] + z, e.at[1] + z * .7]; }
  function selBox(e, sc) { const [a, b, c, d] = bounds(e, sc), m = sc * 1.5; return `<rect x="${r1(a - m)}" y="${r1(b - m)}" width="${r1(c - a + 2 * m)}" height="${r1(d - b + 2 * m)}" fill="none" stroke="#b03a20" stroke-width="${r1(sc * .5)}" stroke-dasharray="${r1(sc * 1.5)} ${r1(sc)}"/>`; }
  // what the players may have: the referee's own layer and anything hidden taken out
  function forPlayers(map) { return { id: map.id, name: map.name, frame: map.frame, style: map.style, seed: map.seed, layers: map.layers, els: (map.els || []).filter(e => !e.dm && e.layer !== "dm" && !e.hide).map(e => { const x = Object.assign({}, e); delete x.loc; delete x.route; delete x.lock; delete x.gen; delete x.note; return x; }) }; }


  /* ---- the referee's desk: the players' maps, made, drawn on, revealed, corrected, given
     ctx: { WD() the world now, maps() { id: doc }, setting() { mode: "real"|"parchment", map }, save(id, doc|null),
     saveSetting(doc), undo(), redo(), show(id) put it on the players' screen, gm() } */
  const TOOLS = [["select", "Choose and move"], ["pen", "Draw freely"], ["erase", "Rub out"], ["text", "Write"], ["road", "Road"], ["path", "Path"], ["river", "River"], ["coast", "Coast"], ["border", "Border"], ["stamp", "Symbol"], ["note", "Note"]];
  const STATUS = [["c", "Confirmed"], ["r", "Rumoured"], ["u", "Uncertain"], ["x", "Wrong"]];
  const LAYERS = [["geo", "Land, coasts, rivers"], ["roads", "Roads and paths"], ["places", "Places"], ["text", "Words"], ["notes", "Notes and sketches"], ["dm", "My own (never shown)"]];
  const LAYER_OF = { pen: "notes", road: "roads", path: "roads", river: "geo", coast: "geo", border: "notes", text: "text", note: "notes", stamp: "places" };
  function editor(host, ctx) {
    loadFonts();
    const E = { id: null, tool: "select", status: "c", forMe: false, sym: "village", sel: null, view: null, draft: null, drag: null, open: true };
    const maps = () => ctx.maps() || {}, cur = () => maps()[E.id] || null;
    const opt = (list, v) => list.map(([k, l]) => `<option value="${esc(k)}"${String(k) === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("");
    host.innerHTML = `<div class="pm-ed" role="dialog" aria-label="The players' maps">
      <header class="pm-hd"><h3>The players' maps</h3><span class="pm-mode"></span><button type="button" class="wm-btn" data-pm="close">Close</button></header>
      <div class="pm-body"><aside class="pm-left"></aside><div class="pm-mid"><div class="pm-tools"></div><div class="pm-stage" tabindex="0"></div><div class="pm-hint kn"></div></div><aside class="pm-right"></aside></div></div>`;
    const $ = q => host.querySelector(q), stage = $(".pm-stage");
    const save = doc => { ctx.save(doc.id, doc); };
    const mutate = fn => { const m = cur(); if (!m) return; const d = JSON.parse(JSON.stringify(m)); fn(d); save(d); };
    const elById = (m, id) => (m.els || []).find(e => e.id === id);
    function first() { const ids = Object.keys(maps()); if (!E.id || !maps()[E.id]) E.id = ids[0] || null; }
    // the left: which map, making one, copying, giving it to the players; and what the players see as their world map
    function left() {
      const ms = Object.values(maps()), set = ctx.setting() || {}, m = cur(), W = ctx.WD(), placesKnown = W.locs.filter(l => Array.isArray(l.at) && (l.state !== "unknown" || PUBLIC.has(l.kind))).sort((a, b) => a.name.localeCompare(b.name));
      $(".pm-left").innerHTML = `
        <fieldset class="pm-box"><legend>What the players see as their world map</legend>
          <label><input type="radio" name="pmmode" value="real"${set.mode !== "parchment" ? " checked" : ""}> The real map (the places they know)</label>
          <label><input type="radio" name="pmmode" value="parchment"${set.mode === "parchment" ? " checked" : ""}> Only a hand-drawn map: ${ms.length ? `<select data-pmv="showmap">${opt(ms.map(x => [x.id, x.name]), set.map || (ms[0] || {}).id)}</select>` : "make one first"}</label>
          <p class="kn">With a hand-drawn map, the real map never reaches the players: on their screen "the world map" is this map, with only what you have given them.</p></fieldset>
        <fieldset class="pm-box"><legend>Maps</legend>${ms.length ? `<select data-pmv="pick" size="${Math.min(6, Math.max(2, ms.length))}">${opt(ms.map(x => [x.id, x.name + (x.given ? " (given)" : "")]), E.id)}</select>` : `<p class="kn">No player maps yet.</p>`}
          <div class="pm-row"><button type="button" class="wm-btn" data-pm="new">New map…</button>${m ? `<button type="button" class="wm-btn" data-pm="copy" title="A copy to add to, the original kept as it is">Copy</button><button type="button" class="wm-btn" data-pm="rename">Rename</button><button type="button" class="wm-btn" data-pm="del">Delete</button>` : ""}</div></fieldset>
        <div class="pm-new" hidden><fieldset class="pm-box"><legend>A new map, as one person knows the land</legend>
          <label>Drawn by <select data-pmn="maker">${opt(Object.entries(MAKERS).map(([k, v]) => [k, v.name]), "commoner")}</select></label><p class="kn pm-mk"></p>
          <label>Who lives at <select data-pmn="home">${opt(placesKnown.map(l => [l.id, l.name]), (W.party && W.party.at) || (placesKnown[0] || {}).id)}</select></label>
          <label>How carefully drawn <input type="range" data-pmn="acc" min="0" max="1" step="0.05" value="0.5"></label>
          <label>Name <input type="text" data-pmn="name" placeholder="e.g. Old Marta's map"></label>
          <div class="pm-row"><button type="button" class="wm-btn prim" data-pm="make">Draw it</button><button type="button" class="wm-btn" data-pm="blank">A blank sheet</button><button type="button" class="wm-btn" data-pm="cancelnew">Cancel</button></div></fieldset></div>
        ${m ? `<fieldset class="pm-box"><legend>This map and the players</legend>
          <label><input type="checkbox" data-pmv="given"${m.given ? " checked" : ""}> Given to the players (they may be shown it)</label>
          <div class="pm-row"><button type="button" class="wm-btn" data-pm="show"${m.given ? "" : " disabled"} title="Put it on the players' screen now">Show on the players' screen</button></div>
          <div class="pm-row"><button type="button" class="wm-btn" data-pm="png">Save as a picture</button><button type="button" class="wm-btn" data-pm="print">Print</button></div>
          <p class="kn">The picture and the print are the players' version: nothing of your own layer or anything hidden.</p></fieldset>` : ""}`;
      const mk = $('[data-pmn="maker"]'); if (mk) { const say = () => { $(".pm-mk").textContent = "Knows " + MAKERS[mk.value].say + "."; }; say(); mk.addEventListener("change", say); }
    }
    // the tools over the sheet
    function tools() {
      $(".pm-tools").innerHTML = cur() ? `${TOOLS.map(([k, l]) => `<button type="button" class="wm-btn pm-t" data-pmt="${k}" aria-pressed="${E.tool === k}">${l}</button>`).join("")}
        <label class="pm-sym"${E.tool === "stamp" ? "" : " hidden"}>Symbol <select data-pmv="sym">${opt(SYMBOLS, E.sym)}</select></label>
        <label>How sure <select data-pmv="status">${opt(STATUS, E.status)}</select></label>
        <label><input type="checkbox" data-pmv="forme"${E.forMe ? " checked" : ""}> Only for me</label>
        <button type="button" class="wm-btn" data-pm="undo">Undo</button><button type="button" class="wm-btn" data-pm="redo">Redo</button>
        <button type="button" class="wm-btn" data-pm="zin" title="Closer">+</button><button type="button" class="wm-btn" data-pm="zout" title="Farther">−</button><button type="button" class="wm-btn" data-pm="zhome" title="The whole sheet">⌂</button>` : "";
      $(".pm-hint").textContent = !cur() ? "Make a map on the left: drawn by someone in the world, from what they know." : ({ select: "Click a drawn thing to choose it; drag to move it (not if locked). Drag the sheet to look about.", pen: "Draw with the pointer, as with a pen.", erase: "Click or drag over a drawn thing to rub it out (a locked one stays).", text: "Click where to write, then type and press Enter.", stamp: "Click to draw the symbol there.", note: "Click to pin a note, then type it.", road: "Drag along the road's way.", path: "Drag along the path.", river: "Drag down the river's course.", coast: "Drag along the coast.", border: "Drag along the border." })[E.tool] || "";
    }
    // the right: layers, the chosen thing, the look, and what the world has that this map has not
    function right() {
      const m = cur(); if (!m) { $(".pm-right").innerHTML = ""; return; }
      const e = E.sel && elById(m, E.sel), W = ctx.WD(), onMap = new Set(m.els.filter(x => x.loc).map(x => x.loc)), st = m.style || {};
      const learned = W.locs.filter(l => Array.isArray(l.at) && !onMap.has(l.id) && ["known", "visited", "done", "rumoured"].includes(l.state));
      const others = W.locs.filter(l => Array.isArray(l.at) && !onMap.has(l.id)).sort((a, b) => a.name.localeCompare(b.name));
      const routes = W.routes.filter(r => !m.els.some(x => x.route === r.id) && WD_name(W, r.from) && WD_name(W, r.to));
      $(".pm-right").innerHTML = `
        ${learned.length ? `<fieldset class="pm-box pm-sugg"><legend>The party has learned of</legend><p class="kn">Not on this map yet. Nothing is added until you say so.</p>${learned.slice(0, 8).map(l => `<div class="pm-row"><span>${esc(l.name)} <i class="kn">(${esc(l.state)})</i></span><button type="button" class="wm-btn" data-pm="addloc" data-loc="${esc(l.id)}" data-st="${l.state === "rumoured" ? "r" : "c"}">Add</button></div>`).join("")}</fieldset>` : ""}
        ${e ? `<fieldset class="pm-box"><legend>The chosen ${e.k === "sym" ? "symbol" : e.k === "line" ? e.t || "line" : e.k}</legend>
          ${e.k !== "line" || e.t === "river" || e.t === "road" ? `<label>Words <input type="text" data-pme="label" value="${esc(e.label || "")}"></label>` : ""}
          <label>How sure <select data-pme="st">${opt(STATUS, e.st || "c")}</select></label>
          <label><input type="checkbox" data-pme="dm"${e.dm || e.layer === "dm" ? " checked" : ""}> Only for me</label>
          <label><input type="checkbox" data-pme="hide"${e.hide ? " checked" : ""}> Hidden from the players for now</label>
          <label><input type="checkbox" data-pme="lock"${e.lock ? " checked" : ""}> Locked</label>
          ${e.k === "note" ? `<label>The note <textarea data-pme="label" rows="3">${esc(e.label || "")}</textarea></label>` : ""}
          <div class="pm-row"><button type="button" class="wm-btn" data-pm="delsel"${e.lock ? " disabled" : ""}>Rub it out</button></div></fieldset>` : ""}
        <fieldset class="pm-box"><legend>Layers</legend>${LAYERS.map(([k, l]) => `<label><input type="checkbox" data-pml="${k}"${(m.layers || {})[k] === 0 ? "" : " checked"}> ${l}</label>`).join("")}</fieldset>
        <fieldset class="pm-box"><legend>Reveal from the world</legend>
          <label>A place <select data-pmv="revloc">${opt(others.map(l => [l.id, l.name + (l.state === "unknown" ? " (unknown to the party)" : "")]), others[0] && others[0].id)}</select></label>
          <div class="pm-row"><button type="button" class="wm-btn" data-pm="revplace">Sketch it on</button><button type="button" class="wm-btn" data-pm="revrumour">As a rumour</button><button type="button" class="wm-btn" data-pm="revland">Sketch the land about it</button></div>
          ${routes.length ? `<label>A road <select data-pmv="revroute">${opt(routes.map(r => [r.id, (r.name ? r.name + ": " : "") + WD_name(W, r.from) + " to " + WD_name(W, r.to) + (r.hidden ? " (secret)" : "")]), routes[0].id)}</select></label><div class="pm-row"><button type="button" class="wm-btn" data-pm="revroad">Sketch it on</button></div>` : ""}
          <p class="kn">Sketched as the map's maker would: roughly, a little out of place.</p></fieldset>
        <fieldset class="pm-box"><legend>The look</legend>
          <label>Parchment <select data-pms="paper">${opt([["aged", "Aged"], ["pale", "Pale"], ["brown", "Brown, old"], ["grey", "Grey"]], st.paper)}</select></label>
          <label>Wear <input type="range" data-pms="wear" min="0" max="1" step="0.05" value="${st.wear == null ? .5 : st.wear}"></label>
          <label>Ink <select data-pms="ink">${opt([["brown", "Brown"], ["black", "Black"], ["sepia", "Faded sepia"], ["iron", "Iron-gall"]], st.ink)}</select></label>
          <label>Lines <input type="range" data-pms="width" min="0.5" max="2" step="0.1" value="${st.width || 1}"></label>
          <label>Roughness <input type="range" data-pms="rough" min="0" max="1.2" step="0.05" value="${st.rough == null ? .5 : st.rough}"></label>
          <label>Hand <select data-pms="hand">${opt([["scrawl", "A scrawl"], ["hand", "A flowing hand"], ["fair", "A fair hand"]], st.hand)}</select></label>
          <div class="pm-row"><button type="button" class="wm-btn" data-pm="regen" title="Draw what the maker knows again; your own additions are kept">Draw the maker's part again</button></div></fieldset>`;
    }
    const WD_name = (W, id) => W.byId[id] ? W.byId[id].name : "";
    // the sheet
    function draw() {
      const m = cur(); if (!m) { stage.innerHTML = `<p class="pm-empty">No map chosen.</p>`; return; }
      stage.innerHTML = render(m, { sel: E.sel });
      const svg = stage.querySelector("svg"); if (!E.view) { const vb = svg.getAttribute("viewBox").split(" ").map(Number); E.view = vb; }
      svg.setAttribute("viewBox", E.view.map(r1).join(" "));
      if (E.draft && E.draft.pts && E.draft.pts.length > 1) svg.insertAdjacentHTML("beforeend", `<path d="M${E.draft.pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L")}" fill="none" stroke="#b03a20" stroke-width="${r1(E.view[2] / 400)}" stroke-dasharray="${r1(E.view[2] / 200)} ${r1(E.view[2] / 300)}"/>`);
    }
    function all() { first(); const set = ctx.setting() || {}; $(".pm-mode").textContent = set.mode === "parchment" ? "The players see a hand-drawn map" : "The players see the real map"; left(); tools(); right(); draw(); }
    const pt = ev => { const svg = stage.querySelector("svg"); const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
    const scOf = m => Math.max(m.frame[2], m.frame[3]) / 320;
    const newEl = (m, e) => Object.assign({ id: uid(), st: E.status, layer: E.forMe ? "dm" : e.layer || "notes", dm: E.forMe ? 1 : undefined }, e);
    // a floating box to write in, where the pointer was
    function ask(ev, initial, done) {
      const box = document.createElement("input"); box.type = "text"; box.className = "pm-ask"; box.value = initial || ""; const r = stage.getBoundingClientRect();
      box.style.left = (ev.clientX - r.left) + "px"; box.style.top = (ev.clientY - r.top) + "px"; stage.appendChild(box); box.focus();
      let gone = false; const end = ok => { if (gone) return; gone = true; const v = box.value.trim(); box.remove(); if (ok && v) done(v); };
      box.addEventListener("keydown", k => { if (k.key === "Enter") end(true); else if (k.key === "Escape") end(false); }); box.addEventListener("blur", () => end(true));
    }
    stage.addEventListener("pointerdown", ev => {
      const m = cur(); if (!m || ev.button > 0 || ev.target.closest(".pm-ask")) return; const p = pt(ev), sc = scOf(m), hit = ev.target.closest("[data-pm]"), hitId = hit && hit.getAttribute("data-pm");
      if (E.tool === "select") {
        if (hitId && elById(m, hitId)) { E.sel = hitId; const e = elById(m, hitId); E.drag = e.lock ? null : { id: hitId, from: p, moved: false }; right(); draw(); }
        else { E.sel = null; E.drag = { pan: true, from: [ev.clientX, ev.clientY], view: E.view.slice() }; right(); draw(); }
      } else if (E.tool === "erase") { E.drag = { erase: true }; if (hitId) mutate(d => { const e = elById(d, hitId); if (e && !e.lock) d.els = d.els.filter(x => x.id !== hitId); }); }
      else if (E.tool === "text") ask(ev, "", v => mutate(d => d.els.push(newEl(d, { k: "text", at: p, label: v, size: sc * 7, layer: "text" }))));
      else if (E.tool === "note") ask(ev, "", v => mutate(d => d.els.push(newEl(d, { k: "note", at: p, label: v, layer: "notes" }))));
      else if (E.tool === "stamp") mutate(d => d.els.push(newEl(d, { k: "sym", s: E.sym, at: p, size: sc * (["mountain", "forest", "city"].includes(E.sym) ? 14 : 11), layer: ["mountain", "hill", "forest", "tree", "lake", "swamp"].includes(E.sym) ? "geo" : "places" })));
      else { E.draft = { pts: [p] }; stage.setPointerCapture(ev.pointerId); }
      ev.preventDefault();
    });
    stage.addEventListener("pointermove", ev => {
      const m = cur(); if (!m) return;
      if (E.draft) { const p = pt(ev), l = E.draft.pts[E.draft.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > scOf(m) * .8) { E.draft.pts.push(p); draw(); } return; }
      if (!E.drag) return;
      if (E.drag.pan) { const svg = stage.querySelector("svg"), k = E.view[2] / svg.clientWidth; E.view[0] = E.drag.view[0] - (ev.clientX - E.drag.from[0]) * k; E.view[1] = E.drag.view[1] - (ev.clientY - E.drag.from[1]) * k; draw(); return; }
      if (E.drag.erase) { const t = document.elementFromPoint(ev.clientX, ev.clientY), h = t && t.closest && t.closest("[data-pm]"); if (h) { const id = h.getAttribute("data-pm"); const e = elById(m, id); if (e && !e.lock) mutate(d => { d.els = d.els.filter(x => x.id !== id); }); } return; }
      if (E.drag.id) { const p = pt(ev); E.drag.moved = [p[0] - E.drag.from[0], p[1] - E.drag.from[1]]; const g = stage.querySelector(`[data-pm="${CSS.escape(E.drag.id)}"]`); if (g) g.setAttribute("transform", `translate(${r1(E.drag.moved[0])} ${r1(E.drag.moved[1])})`); }
    });
    const up = () => {
      const m = cur();
      if (E.draft && m) { const pts = E.draft.pts; E.draft = null; if (pts.length > 1) { const t = E.tool === "pen" ? "free" : E.tool; mutate(d => d.els.push(newEl(d, { k: "line", t, pts: pts.map(p => [r1(p[0]), r1(p[1])]), layer: LAYER_OF[E.tool] || "notes" }))); } else draw(); }
      if (E.drag && E.drag.id && E.drag.moved) { const [dx, dy] = E.drag.moved, id = E.drag.id; mutate(d => { const e = elById(d, id); if (!e) return; if (e.at) e.at = [r1(e.at[0] + dx), r1(e.at[1] + dy)]; if (e.pts) e.pts = e.pts.map(q => [r1(q[0] + dx), r1(q[1] + dy)]); }); }
      E.drag = null;
    };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    stage.addEventListener("wheel", ev => { if (!cur()) return; ev.preventDefault(); zoom(Math.exp(ev.deltaY * .0012), pt(ev)); }, { passive: false });
    function zoom(f, c) { const v = E.view; c = c || [v[0] + v[2] / 2, v[1] + v[3] / 2]; E.view = [c[0] - (c[0] - v[0]) * f, c[1] - (c[1] - v[1]) * f, v[2] * f, v[3] * f]; draw(); }
    host.addEventListener("input", ev => {
      const t = ev.target, m = cur();
      if (t.matches("[data-pms]") && m) { const k = t.dataset.pms, v = t.type === "range" ? +t.value : t.value; mutate(d => { d.style = Object.assign({}, d.style, { [k]: v }); }); }
      if (t.matches('[data-pme="label"]') && m && E.sel) { const v = t.value; clearTimeout(t._t); t._t = setTimeout(() => mutate(d => { const e = elById(d, E.sel); if (e) e.label = v; }), 400); }
    });
    host.addEventListener("change", ev => {
      const t = ev.target, m = cur();
      if (t.name === "pmmode") { const set = Object.assign({}, ctx.setting() || {}, { mode: t.value }); if (t.value === "parchment" && !set.map) set.map = E.id; ctx.saveSetting(set); return; }
      if (t.matches('[data-pmv="showmap"]')) { ctx.saveSetting(Object.assign({}, ctx.setting() || {}, { map: t.value })); return; }
      if (t.matches('[data-pmv="pick"]')) { E.id = t.value; E.sel = null; E.view = null; all(); return; }
      if (t.matches('[data-pmv="status"]')) { E.status = t.value; return; }
      if (t.matches('[data-pmv="forme"]')) { E.forMe = t.checked; return; }
      if (t.matches('[data-pmv="sym"]')) { E.sym = t.value; return; }
      if (t.matches('[data-pmv="given"]') && m) { mutate(d => { d.given = t.checked; }); return; }
      if (t.matches("[data-pml]") && m) { const k = t.dataset.pml; mutate(d => { d.layers = Object.assign({}, d.layers, { [k]: t.checked ? 1 : 0 }); }); return; }
      if (t.matches("[data-pme]") && m && E.sel) { const k = t.dataset.pme; if (k === "label") return; mutate(d => { const e = elById(d, E.sel); if (!e) return; if (k === "st") e.st = t.value; else if (k === "dm") { e.dm = t.checked ? 1 : undefined; if (!t.checked && e.layer === "dm") e.layer = "notes"; } else if (k === "hide") e.hide = t.checked ? 1 : undefined; else if (k === "lock") e.lock = t.checked ? 1 : undefined; }); }
    });
    host.addEventListener("click", ev => {
      const b = ev.target.closest("[data-pm],[data-pmt]"); if (!b || b.closest(".pm-stage")) return; const m = cur(), W = ctx.WD();
      if (b.dataset.pmt) { E.tool = b.dataset.pmt; E.sel = null; tools(); right(); draw(); return; }
      const a = b.dataset.pm, warpLike = (mm, at) => { const g = generate(W, { maker: mm.maker, home: mm.home, seed: mm.seed, accuracy: mm.accuracy }); return g; };
      switch (a) {
        case "close": E.open = false; ctx.close(); break;
        case "new": $(".pm-new").hidden = false; break;
        case "cancelnew": $(".pm-new").hidden = true; break;
        case "make": case "blank": {
          const maker = $('[data-pmn="maker"]').value, home = $('[data-pmn="home"]').value, acc = +$('[data-pmn="acc"]').value, name = $('[data-pmn="name"]').value.trim();
          let d = generate(W, { maker, home, accuracy: acc, name: name || undefined });
          if (a === "blank") { d.els = d.els.filter(e => e.title); d.name = name || "A blank sheet"; }
          E.id = d.id; E.sel = null; E.view = null; save(d); break;
        }
        case "copy": if (m) { const d = JSON.parse(JSON.stringify(m)); d.id = uid(); d.name = m.name + " (copy)"; d.given = false; E.id = d.id; E.view = null; save(d); } break;
        case "rename": if (m) ask({ clientX: b.getBoundingClientRect().left + 10, clientY: b.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.getBoundingClientRect().top }, m.name, v => mutate(d => { d.name = v; })); break;
        case "del": if (m && confirmDel(m)) { ctx.save(m.id, null); E.id = null; E.view = null; } break;
        case "show": if (m && m.given) ctx.show(m.id); break;
        case "undo": ctx.undo(); break;
        case "redo": ctx.redo(); break;
        case "zin": zoom(1 / 1.4); break;
        case "zout": zoom(1.4); break;
        case "zhome": E.view = null; draw(); break;
        case "delsel": if (m && E.sel) { const id = E.sel; E.sel = null; mutate(d => { const e = elById(d, id); if (e && !e.lock) d.els = d.els.filter(x => x.id !== id); }); } break;
        case "addloc": case "revplace": case "revrumour": {
          if (!m) break; const id = a === "addloc" ? b.dataset.loc : $('[data-pmv="revloc"]').value, L = W.byId[id]; if (!L) break;
          const g = warpLike(m), wp = warpFn(W, m), sc = scOf(m), st0 = a === "revrumour" ? "r" : a === "addloc" ? b.dataset.st : E.status;
          mutate(d => d.els.push({ id: uid(), k: "sym", s: SYM_OF[L.kind] || "village", at: wp(L.at), size: sc * (L.kind === "city" || L.kind === "capital" ? 14 : 11), label: L.name, layer: "places", st: st0, loc: L.id }));
          break;
        }
        case "revland": { if (!m) break; const id = $('[data-pmv="revloc"]').value, wp = warpFn(W, m), add = sketchRegion(W, m, id).map(e => Object.assign(e, { at: e.at && wp(e.at), pts: e.pts && e.pts.map(wp), st: e.st || "c" })); mutate(d => { d.els.push(...add); }); break; }
        case "revroad": { if (!m) break; const r = W.routes.find(x => x.id === $('[data-pmv="revroute"]').value); if (!r) break; const A0 = W.byId[r.from], B0 = W.byId[r.to], wp = warpFn(W, m), path = Array.isArray(r.path) && r.path.length > 1 ? r.path : [A0.at, B0.at]; mutate(d => d.els.push({ id: uid(), k: "line", t: r.kind === "trail" ? "path" : "road", pts: [A0.at, ...path.slice(1, -1), B0.at].map(wp), layer: "roads", st: E.status, route: r.id, label: r.name || "" })); break; }
        case "regen": if (m) { const g = generate(W, { maker: m.maker, home: m.home, seed: m.seed, accuracy: m.accuracy, name: m.name, style: m.style }); mutate(d => { d.els = g.els.concat(d.els.filter(e => !e.gen)); }); } break;
        case "png": case "print": if (m) exportMap(m, a); break;
      }
    });
    function confirmDel(m) { return typeof confirm === "function" ? confirm(`Delete "${m.name}"? (Undo brings it back.)`) : true; }
    return { refresh: () => { if (E.open) all(); }, open: () => { E.open = true; all(); } };
  }
  // the map's own error, for what is added to it later: the same as its maker's
  function warpFn(W, m) {
    const M = MAKERS[m.maker] || MAKERS.commoner, err = m.accuracy != null ? M.err * (1.6 - 1.4 * m.accuracy) : M.err, Hc = m.H || [W.size[0] / 2, W.size[1] / 2], R = m.R || 100, seed = m.seed;
    return p => { const dx = p[0] - Hc[0], dy = p[1] - Hc[1], d = Math.hypot(dx, dy), f = d / R, sq = f > .6 ? 1 - .25 * err * 4 * smooth(.6, 2, f) : 1, k = (1 + (vn(p[0] / R * 1.7, p[1] / R * 1.7, seed) - .5) * err * 1.6) * sq, ox = (vn(p[0] / R * 2.3 + 7, p[1] / R * 2.3, seed + 1) - .5) * 2, oy = (vn(p[0] / R * 2.3, p[1] / R * 2.3 + 9, seed + 2) - .5) * 2, wob = err * (R * .05 + d * .45); return [r1(Hc[0] + dx * k + ox * wob), r1(Hc[1] + dy * k + oy * wob)]; };
  }
  // a picture or a print of the players' version
  function exportMap(m, how) {
    const svg = render(forPlayers(m), {}), name = (m.name || "map").replace(/[^\w\- ]+/g, "").trim() || "map";
    if (how === "print") { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!doctype html><title>${esc(m.name)}</title><link rel="stylesheet" href="${FONT_URL}"><style>@page{size:landscape;margin:8mm}body{margin:0}svg{width:100%;height:96vh}</style>${svg}<script>setTimeout(()=>print(),900)<\/script>`); w.document.close(); return; }
    const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number), Wd = 2400, Hd = Math.round(Wd * vh / vw), img = new Image(), url = URL.createObjectURL(new Blob([svg.replace("<svg ", `<svg width="${Wd}" height="${Hd}" `)], { type: "image/svg+xml" }));
    img.onload = () => { const cv = document.createElement("canvas"); cv.width = Wd; cv.height = Hd; cv.getContext("2d").drawImage(img, 0, 0); URL.revokeObjectURL(url); cv.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name + ".png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, "image/png"); };
    img.src = url;
  }

  A.pmap = { MAKERS, SYMBOLS, SYM, generate, sketchRegion, render, forPlayers, loadFonts, uid, bounds, editor, warpFn };
})(ATLAS);
