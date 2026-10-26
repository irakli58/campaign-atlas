/* Caves: generated, checked and drawn. The user asked on 21 Oct 2026 for "a complete cave-generation and cave-dungeon
   design system": caves of every size and kind made from settings or a seed (the same seed and settings give the same
   cave), layouts that genuinely differ, every way in joined to the rest, levels one below another, water, heights,
   secrets and ruins, and then every part of it editable in the map editor.
   A cave is an ordinary place's map. Its floors are its levels; its rooms are its chambers and passages, each a set of
   rectangles sharing the room's id (as an L-shaped room is); the rock is what no room covers; and F.cave = 1 has the
   page draw it as a cave (atlas-engine.js: rock walls that follow the stone, open passages between chambers, cliffs,
   water, lava and chasms) and raise it as one in 3D (atlas-room3d.js). A rectangle may say how high its floor stands
   (el, in metres), that it can be climbed (cl), that it is meant to be swum (sw) or is sealed on purpose (sl).
   This file holds the generator, the check that a cave can be crossed (and its repair), the outline the drawing
   follows, and the operations the editor's cave tools use. It needs no browser: atlas.js uses it too. The words for
   the guide are in atlas-cave-words.js, the riddles and traps in atlas-puzzles.js. */
(function (A) {
  "use strict";
  const CV = A.cave = A.cave || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---- randomness that comes back the same for the same seed */
  CV.hash = s => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function rng(seed) {
    let a = (typeof seed === "number" ? seed >>> 0 : CV.hash(seed)) || 1;
    const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    r.range = (lo, hi) => lo + r() * (hi - lo);
    r.int = (lo, hi) => Math.floor(lo + r() * (hi - lo + 1));
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.chance = p => r() < p;
    r.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
    r.weighted = list => { const t = list.reduce((s, x) => s + x[1], 0); let v = r() * t; for (const x of list) { v -= x[1]; if (v <= 0) return x[0]; } return list[list.length - 1][0]; };
    return r;
  }
  CV.rng = rng;
  // the cheapest first: a binary heap of [cost, square]
  function Heap() {
    const h = [];
    this.size = () => h.length;
    this.push = (c, v) => { h.push([v, c]); let i = h.length - 1; while (i) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; const t = h[p]; h[p] = h[i]; h[i] = t; i = p; } };
    this.pop = () => { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let s = i; if (l < h.length && h[l][0] < h[s][0]) s = l; if (r < h.length && h[r][0] < h[s][0]) s = r; if (s === i) break; const t = h[s]; h[s] = h[i]; h[i] = t; i = s; } } return top; };
  }
  CV.newSeed = () => { const w = ["ash", "bone", "cold", "deep", "dusk", "echo", "flint", "gloam", "hollow", "iron", "jet", "lantern", "moss", "night", "ochre", "pale", "quiet", "root", "salt", "tallow", "umber", "vault", "wyrm", "yew"]; const p = () => w[Math.floor(Math.random() * w.length)]; return p() + "-" + p() + "-" + Math.floor(Math.random() * 900 + 100); };

  /* ---- the settings: [key, label, [[value, label], ...]] */
  CV.SETTINGS = [
    ["size", "Size", [["tiny", "Tiny"], ["small", "Small"], ["medium", "Medium"], ["large", "Large"], ["enormous", "Enormous"], ["custom", "My own size"]]],
    ["complexity", "Complexity", [["simple", "Simple"], ["winding", "Winding"], ["labyrinth", "Labyrinthine"], ["extreme", "Extremely complex"]]],
    ["chambers", "Chambers", [["few", "A few great chambers"], ["many", "Many small chambers"], ["mixed", "A mixture"]]],
    ["tunnels", "Tunnels", [["narrow", "Narrow"], ["winding", "Winding"], ["branching", "Branching"], ["wide", "Wide"], ["irregular", "Irregular"], ["mixed", "Mixed"]]],
    ["vertical", "Height and depth", [["flat", "Mostly flat"], ["elevations", "Several heights"], ["pits", "Deep pits"], ["cliffs", "Cliffs and ledges"], ["levels", "Levels one below another"]]],
    ["water", "Water", [["dry", "Dry"], ["streams", "Underground streams"], ["lakes", "Lakes"], ["waterfalls", "Waterfalls"], ["flooded", "Flooded chambers"], ["submerged", "Submerged passages"]]],
    ["geology", "Rock", [["limestone", "Limestone"], ["volcanic", "Volcanic"], ["ice", "Ice"], ["crystal", "Crystal-filled"], ["sandstone", "Sandstone"], ["ancient", "Ancient black rock"]]],
    ["env", "What it is", [["natural", "A natural cave"], ["lair", "A monster's lair"], ["ruin", "An ancient ruin"], ["mine", "An abandoned mine"], ["temple", "An underground temple"], ["magic", "A magical cavern"], ["fungal", "A fungal cave"], ["crystal", "A crystal cave"], ["flooded", "A flooded cave"], ["volcanic", "A volcanic cave"], ["corrupted", "A corrupted cave"]]],
    ["danger", "Danger", [["safe", "Safe to explore"], ["moderate", "Some danger"], ["dangerous", "A dangerous dungeon"], ["deadly", "A deadly last cave"]]],
    ["explore", "Finding the way", [["plain", "Straightforward"], ["confusing", "Confusing"], ["maze", "A maze"], ["secrets", "Full of secrets"]]],
    ["light", "Light", [["dark", "Pitch black"], ["dim", "Dimly lit"], ["biolum", "Glowing life"], ["magic", "Magical light"], ["lava", "Lava-lit"], ["torch", "Torchlit"]]],
    ["encounters", "Encounters", [["none", "None: exploration only"], ["occasional", "Now and then"], ["dense", "Crowded"]]],
    ["traps", "Traps", [["none", "None"], ["sparse", "A few"], ["moderate", "Some"], ["high", "Many"], ["custom", "Exactly"]]],
    ["riddles", "Riddles and puzzles", [["none", "None"], ["occasional", "One or two"], ["moderate", "Some"], ["high", "Many"], ["custom", "Exactly"]]],
    ["secrets", "Secrets", [["none", "None"], ["few", "A few"], ["many", "Many hidden places"]]],
    ["ways", "Ways in and out", [["one", "One entrance"], ["several", "Several entrances"], ["hidden", "A hidden way out"], ["network", "Part of a larger network"]]]
  ];
  CV.DEFAULTS = { size: "medium", complexity: "winding", chambers: "mixed", tunnels: "mixed", vertical: "elevations", water: "streams", geology: "limestone", env: "natural", danger: "moderate", explore: "plain", light: "dark", encounters: "occasional", traps: "sparse", riddles: "occasional", secrets: "few", ways: "one", levels: 0, w: 0, h: 0, nTraps: 0, nRiddles: 0, trapsWhere: "guard", riddlesWhere: "doors", name: "" };
  const SIZES = { tiny: [30, 22], small: [42, 30], medium: [56, 40], large: [74, 52], enormous: [96, 68] };
  CV.SIZES = SIZES;
  // a cave whose parts agree with each other: what it is decides its rock, its water and its light
  CV.randomSettings = seed => {
    const R = rng("settings:" + seed), env = R.weighted([["natural", 4], ["lair", 2], ["ruin", 2], ["mine", 1.5], ["temple", 1.5], ["magic", 1], ["fungal", 1], ["crystal", 1], ["flooded", 1], ["volcanic", 1], ["corrupted", 1]]);
    const geo = { volcanic: "volcanic", crystal: "crystal", magic: R.pick(["crystal", "ancient", "limestone"]), temple: R.pick(["ancient", "limestone", "sandstone"]), ruin: R.pick(["ancient", "limestone", "sandstone"]), mine: R.pick(["sandstone", "limestone", "ancient"]), corrupted: R.pick(["ancient", "volcanic"]) }[env] || R.weighted([["limestone", 4], ["sandstone", 1.5], ["ice", 1], ["ancient", 1]]);
    const water = env === "flooded" ? R.pick(["flooded", "submerged", "lakes"]) : env === "volcanic" ? "dry" : R.weighted([["dry", 1.5], ["streams", 3], ["lakes", 2], ["waterfalls", 1.5], ["flooded", .7], ["submerged", .7]]);
    const light = { volcanic: "lava", fungal: "biolum", crystal: "magic", magic: "magic", temple: R.pick(["torch", "magic"]), mine: R.pick(["dark", "torch"]), lair: R.pick(["dark", "dim"]), corrupted: R.pick(["dark", "magic"]) }[env] || R.pick(["dark", "dark", "dim"]);
    const deep = env === "lair" || env === "corrupted" || env === "temple" ? R.pick(["dangerous", "deadly", "moderate"]) : R.pick(["safe", "moderate", "moderate", "dangerous"]);
    return Object.assign({}, CV.DEFAULTS, { size: R.weighted([["small", 2], ["medium", 3], ["large", 2], ["tiny", .7], ["enormous", .5]]), complexity: R.pick(["simple", "winding", "winding", "labyrinth", "extreme"]), chambers: R.pick(["few", "many", "mixed", "mixed"]), tunnels: R.pick(["narrow", "winding", "branching", "wide", "irregular", "mixed", "mixed"]), vertical: R.weighted([["flat", 1], ["elevations", 2.5], ["pits", 1.5], ["cliffs", 1.5], ["levels", 1.5]]), water, geology: geo, env, danger: deep, explore: R.pick(["plain", "confusing", "maze", "secrets"]), light, encounters: R.pick(["none", "occasional", "occasional", "dense"]), traps: deep === "safe" ? "sparse" : R.pick(["sparse", "moderate", "high"]), riddles: env === "temple" || env === "ruin" || env === "magic" ? R.pick(["moderate", "high"]) : R.pick(["none", "occasional", "occasional", "moderate"]), secrets: R.pick(["few", "few", "many", "none"]), ways: R.pick(["one", "one", "several", "hidden", "network"]), seed });
  };

  /* ---- what a floor kind is to someone crossing it */
  const SWIM = new Set(["water", "river"]);
  CV.pass = k => { if (!k) return "rock"; const d = A.kindOf ? A.kindOf(k) : null; if (!d) return "walk"; if (d.solid) return "rock"; if (d.block) return "block"; if (SWIM.has(k) || d.swim) return "swim"; return "walk"; };
  const isOut = k => !!(A.isOut && A.isOut(k));

  /* ---- a floor as squares: who owns each one, its kind, its height, whether it climbs, is hidden, is built; the
          doors on its edges. Rectangles drawn later win, as on the map. */
  const ekey = (o, x, y) => o + ":" + x + ":" + y;   // "h:x:y" the top edge of (x, y); "v:x:y" its left edge
  CV.cells = F => {
    const W = F.w, H = F.h, n = W * H;
    const m = { W, H, own: new Int32Array(n).fill(-1), kind: new Array(n).fill(null), el: new Float32Array(n), cl: new Uint8Array(n), hid: new Uint8Array(n), bt: new Array(n).fill(""), sw: new Uint8Array(n), sl: new Uint8Array(n), rooms: [], ix: {}, doors: new Map(), cave: !!F.cave };
    for (const r of F.R || []) {
      const [rid, x, y, w, h, name, kind, o = {}] = r, solid = A.isSolid && A.isSolid(kind);
      let q = -1;
      if (!solid) { q = m.ix[rid]; if (q == null) { q = m.ix[rid] = m.rooms.length; m.rooms.push({ id: rid, name: "", extra: {} }); } const R0 = m.rooms[q]; if (name && !R0.name) R0.name = name; for (const k of F.cave ? ["fx", "bk", "nw"] : ["fx", "bk", "nw", "l"]) if (o[k] != null && R0.extra[k] == null) R0.extra[k] = o[k]; }
      for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) {
        const c = j * W + i;
        if (solid) { m.own[c] = -1; m.kind[c] = null; m.el[c] = 0; m.cl[c] = m.hid[c] = m.sw[c] = m.sl[c] = 0; m.bt[c] = ""; continue; }
        m.own[c] = q; m.kind[c] = kind; m.el[c] = +o.el || 0; m.cl[c] = o.cl ? 1 : 0; m.hid[c] = o.h ? 1 : 0; m.bt[c] = o.b || ""; m.sw[c] = o.sw ? 1 : 0; m.sl[c] = o.sl ? 1 : 0;
      }
    }
    for (const d of F.D || []) { const [x, y, o, type = "d", len = 1] = d; for (let k = 0; k < len; k++) m.doors.set(o === "h" ? ekey("h", x + k, y) : ekey("v", x, y + k), type); }
    return m;
  };
  // and back: each room's squares as few rectangles as will cover them, the biggest first (its name and label ride on it)
  CV.rects = m => {
    const W = m.W, H = m.H, done = new Uint8Array(W * H), out = [];
    const key = c => [m.own[c], m.kind[c], m.el[c], m.cl[c], m.hid[c], m.bt[c], m.sw[c], m.sl[c]].join("|");
    const byRoom = new Map();
    for (let c = 0; c < W * H; c++) {
      if (done[c] || m.own[c] < 0) continue;
      const k = key(c), x0 = c % W, y0 = (c - x0) / W;
      let w = 1; while (x0 + w < W && !done[c + w] && m.own[c + w] >= 0 && key(c + w) === k) w++;
      let h = 1;
      grow: while (y0 + h < H) { for (let i = 0; i < w; i++) { const d = (y0 + h) * W + x0 + i; if (done[d] || m.own[d] < 0 || key(d) !== k) break grow; } h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) done[(y0 + j) * W + x0 + i] = 1;
      const q = m.own[c]; if (!byRoom.has(q)) byRoom.set(q, []);
      byRoom.get(q).push({ x: x0, y: y0, w, h, c });
    }
    for (const [q, list] of byRoom) {
      const R0 = m.rooms[q]; list.sort((a, b) => b.w * b.h - a.w * a.h || a.y - b.y || a.x - b.x);
      const lab = R0.label || labelPoint(m, q);
      list.forEach((r, k) => {
        const c = r.c, o = {};
        if (m.el[c]) o.el = +m.el[c].toFixed(2); if (m.cl[c]) o.cl = 1; if (m.hid[c]) o.h = 1; if (m.bt[c]) o.b = m.bt[c]; if (m.sw[c]) o.sw = 1; if (m.sl[c]) o.sl = 1;
        if (!k) { Object.assign(o, R0.extra || {}); if (lab && !(R0.extra || {}).l) o.l = lab; }
        const row = [R0.id, r.x, r.y, r.w, r.h, k ? "" : (R0.name || ""), m.kind[c]];
        if (Object.keys(o).length) row.push(o);
        out.push(row);
      });
    }
    return out;
  };
  // where a room's name sits: the square deepest inside it
  function labelPoint(m, q) {
    const W = m.W, H = m.H, d = new Int16Array(W * H).fill(-1), qu = [];
    for (let c = 0; c < W * H; c++) if (m.own[c] === q) { const x = c % W, y = (c - x) / W; if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || m.own[c - 1] !== q || m.own[c + 1] !== q || m.own[c - W] !== q || m.own[c + W] !== q) { d[c] = 0; qu.push(c); } }
    if (!qu.length) return null;
    for (let h = 0; h < qu.length; h++) { const c = qu[h], x = c % W; for (const e of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) if (e >= 0 && e < W * H && m.own[e] === q && d[e] < 0) { d[e] = d[c] + 1; qu.push(e); } }
    let best = qu[0], bd = -1, sx = 0, sy = 0, n = 0;
    for (const c of qu) { sx += c % W; sy += (c - c % W) / W; n++; }
    sx /= n; sy /= n;
    for (const c of qu) { const x = c % W, y = (c - x) / W, s = d[c] * 10 - Math.hypot(x - sx, y - sy); if (s > bd) { bd = s; best = c; } }
    const bx = best % W; return [bx + .5, (best - bx) / W + .5];
  }

  /* ---- crossing it: can one step from square a to its neighbour b? A wall stands between a built room and anything
          else, and between a hidden place and the rest, unless a door is there; on a map that is not a cave, between any
          two rooms. A step up or down of more than about a body's height needs a climb. */
  CV.CLIMB = 1.6;
  function canStep(m, a, b, ek, mode) {
    const kb = CV.pass(m.kind[b]); if (kb === "rock" || kb === "block") return false;
    if (kb === "swim" && !(mode.swim || (mode.swimSw && m.sw[b]))) return false;
    if (Math.abs(m.el[a] - m.el[b]) > CV.CLIMB && !m.cl[a] && !m.cl[b]) return false;
    if (m.own[a] !== m.own[b]) {
      const need = m.cave ? (m.hid[a] !== m.hid[b] || ((m.bt[a] || m.bt[b]) && true)) : !(isOut(m.kind[a]) && isOut(m.kind[b]));
      if (need) { const t = m.doors.get(ek); if (!t || t === "w") return false; if (t === "s" && !mode.secret) return false; }
    }
    return true;
  }
  CV.canStep = canStep;
  // every square reached from the given ones, on one floor
  function flood(m, starts, mode, seen) {
    const W = m.W, H = m.H; seen = seen || new Uint8Array(W * H); const qu = [];
    for (const c of starts) if (!seen[c] && m.own[c] >= 0 && CV.pass(m.kind[c]) !== "rock" && CV.pass(m.kind[c]) !== "block") { seen[c] = 1; qu.push(c); }
    for (let h = 0; h < qu.length; h++) {
      const c = qu[h], x = c % W, y = (c - x) / W;
      if (x > 0 && !seen[c - 1] && canStep(m, c, c - 1, ekey("v", x, y), mode)) { seen[c - 1] = 1; qu.push(c - 1); }
      if (x < W - 1 && !seen[c + 1] && canStep(m, c, c + 1, ekey("v", x + 1, y), mode)) { seen[c + 1] = 1; qu.push(c + 1); }
      if (y > 0 && !seen[c - W] && canStep(m, c, c - W, ekey("h", x, y), mode)) { seen[c - W] = 1; qu.push(c - W); }
      if (y < H - 1 && !seen[c + W] && canStep(m, c, c + W, ekey("h", x, y + 1), mode)) { seen[c + W] = 1; qu.push(c + W); }
    }
    return seen;
  }
  CV.flood = flood;

  /* ---- the check: can every room of a map be reached, and is everything that matters reachable? It says what is
          meant (a hidden place behind a secret door, a passage that must be swum, a passage sealed by a fall of rock)
          and what is a fault, room by room, floor by floor, across the stairs. */
  CV.check = (M, opt) => {
    opt = opt || {};
    const floors = M.floors.map(F => CV.cells(F)), out = { ok: true, errors: [], warnings: [], notes: [], rooms: {}, floors: [] };
    const name = (fi, q) => { const r = floors[fi].rooms[q]; return r ? `${r.id}${r.name ? " " + r.name : nameOfRoom(M, r.id)}` : "?"; };
    // where one starts: open ground at the edge of a floor, the rooms the map names as ways in, else the first room
    const starts = floors.map(() => []);
    floors.forEach((m, fi) => { for (let c = 0; c < m.W * m.H; c++) { if (m.own[c] < 0 || !isOut(m.kind[c])) continue; const x = c % m.W, y = (c - x) / m.W; if (x === 0 || y === 0 || x === m.W - 1 || y === m.H - 1) starts[fi].push(c); } });
    for (const rid of [].concat(M.entry || [])) floors.forEach((m, fi) => { const q = m.ix[rid]; if (q == null) return; for (let c = 0; c < m.W * m.H; c++) if (m.own[c] === q) starts[fi].push(c); });
    if (!starts.some(s => s.length)) { const m = floors[M.start || 0] || floors[0]; if (m) for (let c = 0; c < m.W * m.H; c++) if (m.own[c] >= 0 && /^R\d/.test(m.rooms[m.own[c]].id)) { const q = m.own[c]; for (let d = 0; d < m.W * m.H; d++) if (m.own[d] === q) starts[M.start || 0].push(d); break; } }
    // the stairs, each end's squares
    const stairs = [];
    M.floors.forEach((F, fi) => (F.ST || []).forEach(st => { const m = floors[fi], cells = []; for (let j = Math.floor(st[2]); j < st[2] + st[4]; j++) for (let i = Math.floor(st[1]); i < st[1] + st[3]; i++) if (i >= 0 && j >= 0 && i < m.W && j < m.H) cells.push(j * m.W + i); stairs.push({ id: st[0], fi, cells, st }); }));
    const run = mode => {
      const seen = floors.map(m => new Uint8Array(m.W * m.H));
      let todo = floors.map((m, fi) => starts[fi].slice());
      for (let pass = 0; pass < 20; pass++) {
        let more = false;
        floors.forEach((m, fi) => { if (todo[fi].length) { flood(m, todo[fi], mode, seen[fi]); todo[fi] = []; } });
        for (const s of stairs) {
          if (!s.cells.some(c => seen[s.fi][c])) continue;
          for (const t of stairs) if (t !== s && t.id === s.id && t.fi !== s.fi) for (const c of t.cells) if (!seen[t.fi][c] && floors[t.fi].own[c] >= 0) { todo[t.fi].push(c); more = true; }
        }
        if (!more) break;
      }
      return seen;
    };
    const walk = run({}), sec = run({ secret: true }), all = run({ swim: true, secret: true }), route = run({ swimSw: true, secret: true });
    // stairs that land in rock, or have no other end
    for (const s of stairs) {
      const m = floors[s.fi], rock = s.cells.filter(c => m.own[c] < 0 || CV.pass(m.kind[c]) === "rock" || CV.pass(m.kind[c]) === "block");
      if (rock.length) out.errors.push({ k: "stair", fi: s.fi, id: s.id, cells: rock, text: `${s.id} on ${M.floors[s.fi].n} stands on rock or over a drop: there is nothing to step onto.` });
      if (!stairs.some(t => t !== s && t.id === s.id && t.fi !== s.fi)) out.warnings.push({ k: "stair1", fi: s.fi, id: s.id, text: `${s.id} on ${M.floors[s.fi].n} goes nowhere yet: its other end is on no floor.` });
    }
    // the rooms
    const marked = {}; M.floors.forEach((F, fi) => (F.M || []).forEach(mk => { const m = floors[fi], x = Math.floor(mk[1]), y = Math.floor(mk[2]); if (x < 0 || y < 0 || x >= m.W || y >= m.H) return; const q = m.own[y * m.W + x]; if (q >= 0) (marked[fi + ":" + q] = marked[fi + ":" + q] || []).push(mk[0]); }));
    const roles = M.cave && M.cave.roles || {};
    floors.forEach((m, fi) => {
      const per = m.rooms.map(() => ({ n: 0, w: 0, s: 0, a: 0, r: 0, hid: 0, sw: 0, sl: 0, nw: 0, wr: 0 }));
      for (let c = 0; c < m.W * m.H; c++) { const q = m.own[c]; if (q < 0) continue; const p = per[q], pk = CV.pass(m.kind[c]); if (pk === "block") continue; p.n++; if (walk[fi][c]) p.w++; if (sec[fi][c]) p.s++; if (all[fi][c]) p.a++; if (route[fi][c]) p.r++; if (m.hid[c]) p.hid++; if (m.sw[c]) p.sw++; if (m.sl[c]) p.sl++; if (pk === "walk") { p.nw++; if (route[fi][c] || walk[fi][c]) p.wr++; } }
      const fl = { reached: 0, rooms: 0 };
      per.forEach((p, q) => {
        if (!p.n) return;
        const rid = m.rooms[q].id, isR = /^R\d/.test(rid); fl.rooms++;
        // walked to; through a secret door; by a passage meant to be swum; only by swimming where no one meant it
        const st = p.w ? "walk" : p.s ? "secret" : p.r ? "swim" : p.a ? "swimonly" : p.sl ? "sealed" : "none";
        out.rooms[rid] = { fi, state: st };
        if (p.w || p.r || p.a) fl.reached++;
        const important = marked[fi + ":" + q] || [], role = roles[rid];
        if (st === "none") {
          const what = important.length ? ` It holds ${important.join(", ")}: they cannot be reached.` : role ? ` It is the cave's ${role}.` : "";
          (isR || important.length ? out.errors : out.warnings).push({ k: "unreached", fi, rid, text: `${name(fi, q)} (${M.floors[fi].n}) cannot be reached from any way in.${what}`, fix: 1 });
        } else if (st === "sealed") out.notes.push({ k: "sealed", fi, rid, text: `${name(fi, q)} is sealed on purpose (a fall of rock): it opens only if the party digs or forces its way through.` });
        else if (st === "secret") { if (p.hid) out.notes.push({ k: "secret", fi, rid, text: `${name(fi, q)} is hidden, behind a secret door: meant to be found, not walked into.` }); else out.warnings.push({ k: "secretonly", fi, rid, text: `${name(fi, q)} can only be reached through a secret door, though it is not hidden itself.`, fix: 1 }); }
        else if (st === "swim") out.notes.push({ k: "swim", fi, rid, text: `${name(fi, q)} is reached by swimming (a submerged passage, meant so).` });
        else if (st === "swimonly") out.warnings.push({ k: "swimonly", fi, rid, text: `${name(fi, q)} can only be reached by swimming.`, fix: 1 });
        else if (!p.sw && !p.hid) {
          // part of a room cut off from the rest of it (a ledge with no way up, the far side of a chasm)
          const cut = p.nw - p.wr; if (cut >= 3 && cut / Math.max(1, p.nw) > .12) out.warnings.push({ k: "part", fi, rid, text: `Part of ${name(fi, q)} (${cut} squares) cannot be walked to: a ledge with no way up, or ground cut off by water, lava or a drop.`, fix: 1 });
        }
      });
      // squares touching only at a corner: no one can squeeze between
      let diag = 0; for (let y = 0; y < m.H - 1; y++) for (let x = 0; x < m.W - 1; x++) { const a = m.own[y * m.W + x] >= 0, b = m.own[y * m.W + x + 1] >= 0, c = m.own[(y + 1) * m.W + x] >= 0, d = m.own[(y + 1) * m.W + x + 1] >= 0; if ((a && d && !b && !c) || (b && c && !a && !d)) diag++; }
      if (diag && m.cave) out.warnings.push({ k: "diag", fi, text: `${diag} place${diag > 1 ? "s" : ""} on ${M.floors[fi].n} where two passages touch only at a corner: no one can squeeze through there.`, fix: 1 });
      // a bridge must reach ground at both ends
      const bseen = new Uint8Array(m.W * m.H);
      for (let c = 0; c < m.W * m.H; c++) {
        if (bseen[c] || m.kind[c] !== "bridge") continue;
        const comp = [c], qu = [c]; bseen[c] = 1; const ends = new Set();
        for (let h = 0; h < qu.length; h++) { const e = qu[h], x = e % m.W; for (const f of [x > 0 ? e - 1 : -1, x < m.W - 1 ? e + 1 : -1, e - m.W, e + m.W]) { if (f < 0 || f >= m.W * m.H) continue; if (m.kind[f] === "bridge") { if (!bseen[f]) { bseen[f] = 1; qu.push(f); comp.push(f); } } else if (CV.pass(m.kind[f]) === "walk") ends.add(f); } }
        if (ends.size < 2) out.warnings.push({ k: "bridge", fi, text: `A bridge on ${M.floors[fi].n} does not reach ground at both ends.` });
      }
      out.floors.push(fl);
    });
    out.ok = !out.errors.length;
    out.summary = out.errors.length ? `${out.errors.length} fault${out.errors.length > 1 ? "s" : ""} to mend` : out.warnings.length ? `It can be crossed; ${out.warnings.length} thing${out.warnings.length > 1 ? "s" : ""} to look at` : "Every room can be reached";
    void opt;
    return out;
  };
  function nameOfRoom(M, rid) { for (const F of M.floors) for (const r of F.R || []) if (r[0] === rid && r[5]) return " " + r[5]; return ""; }

  /* ---- mending: rooms no one can reach are joined to the rest by the cheapest way (a ford through water, a bridge
          over lava or a drop, a climb up a ledge, a passage dug through the rock); stairs on rock get ground under
          them; squares touching at a corner are opened. What was meant (secret, swum, sealed) is left alone. */
  CV.repair = (M, opt) => {
    opt = opt || {};
    const R = rng("repair:" + (opt.seed || "") + ":" + M.floors.length), changed = [];
    const floors = M.floors.map(F => Object.assign({}, F, { R: (F.R || []).map(r => r.slice()), D: (F.D || []).map(d => d.slice()), ST: (F.ST || []).slice(), M: (F.M || []).slice(), P: (F.P || []).slice(), I: (F.I || []).slice() }));
    for (let round = 0; round < 6; round++) {
      const rep = CV.check(Object.assign({}, M, { floors })), todo = rep.errors.concat(rep.warnings).filter(x => x.fix || x.k === "stair");
      if (!todo.length) break;
      let did = 0;
      floors.forEach((F, fi) => {
        if (!F.cave && !opt.any) return;
        const m = CV.cells(F), mine = todo.filter(x => x.fi === fi); if (!mine.length) return;
        for (const s of mine.filter(x => x.k === "stair")) for (const c of s.cells) { if (m.own[c] >= 0 && CV.pass(m.kind[c]) !== "rock") { m.kind[c] = baseKindNear(m, c); continue; } const q = nearestRoom(m, c); if (q < 0) continue; paintCell(m, c, q); did++; }
        if (mine.some(x => x.k === "diag")) did += fixDiagonals(m);
        const lost = mine.filter(x => x.k === "unreached" || x.k === "swimonly" || x.k === "part" || x.k === "secretonly");
        if (lost.length) {
          // the squares reached already (by walking, by a meant way, or down the stairs; through secret doors only
          // for a hidden place)
          const open = reachSet(M, floors, fi, false), all = reachSet(M, floors, fi, true);
          for (const x of lost) {
            const q = m.ix[x.rid]; if (q == null) continue;
            let hid = false; for (let c = 0; c < m.W * m.H; c++) if (m.own[c] === q && m.hid[c]) { hid = true; break; }
            const reached = hid ? all : open;
            if (x.k !== "part") { did += joinRoom(m, q, reached, R) ? 1 : 0; continue; }
            // the cut-off part of a room is joined to the rest of it
            const tmp = m.rooms.length; m.rooms.push({ id: "__tmp", name: "", extra: {} });
            for (let c = 0; c < m.W * m.H; c++) if (m.own[c] === q && !reached[c] && CV.pass(m.kind[c]) === "walk") m.own[c] = tmp;
            if (joinRoom(m, tmp, reached, R)) did++;
            for (let c = 0; c < m.W * m.H; c++) if (m.own[c] === tmp) m.own[c] = q;
            m.rooms.pop();
          }
        }
        if (did) { F.R = CV.rects(m); F.D = doorsOf(m); changed.push(fi); }
      });
      if (!did) break;
    }
    return { floors, changed: [...new Set(changed)] };
  };
  function reachSet(M, floors, fi, secret) {
    // reached by walking, swimming what is meant to be swum, and (if asked) through secret doors
    const m = CV.cells(floors[fi]);
    const seen = new Uint8Array(m.W * m.H);
    const starts = []; for (let c = 0; c < m.W * m.H; c++) { if (m.own[c] < 0) continue; const x = c % m.W, y = (c - x) / m.W; if (isOut(m.kind[c]) && (x === 0 || y === 0 || x === m.W - 1 || y === m.H - 1)) starts.push(c); }
    for (const st of floors[fi].ST || []) { const other = floors.some((G, gi) => gi !== fi && (G.ST || []).some(t => t[0] === st[0])); if (!other) continue; for (let j = Math.floor(st[2]); j < st[2] + st[4]; j++) for (let i = Math.floor(st[1]); i < st[1] + st[3]; i++) if (i >= 0 && j >= 0 && i < m.W && j < m.H) starts.push(j * m.W + i); }
    for (const rid of [].concat(M.entry || [])) { const q = m.ix[rid]; if (q != null) for (let c = 0; c < m.W * m.H; c++) if (m.own[c] === q) starts.push(c); }
    flood(m, starts, { swimSw: true, secret: !!secret }, seen);
    return seen;
  }
  function baseKindNear(m, c) { const x = c % m.W; for (const e of [c - 1, c + 1, c - m.W, c + m.W]) if (e >= 0 && e < m.W * m.H && Math.abs((e % m.W) - x) <= 1 && CV.pass(m.kind[e]) === "walk") return m.kind[e]; return m.cave ? "cave" : "stone"; }
  function nearestRoom(m, c) { const W = m.W; let best = -1, bd = 1e9; for (let d = 0; d < m.W * m.H; d++) { if (m.own[d] < 0 || !/^R\d/.test(m.rooms[m.own[d]].id) || CV.pass(m.kind[d]) !== "walk") continue; const dd = Math.abs((d % W) - (c % W)) + Math.abs(Math.floor(d / W) - Math.floor(c / W)); if (dd < bd) { bd = dd; best = m.own[d]; } } return best; }
  // a square of rock made floor of room q: its floor and height from the room beside it; dug out of the rock, it is
  // natural ground even when the room is a built one
  function paintCell(m, c, q) {
    const W = m.W, nat = k => k && CV.pass(k) === "walk" && !/^(marble|flag|boards|tile|tilew|lino|carpet)/.test(k);
    let k = null, el = 0, hid = 0;
    for (const e of [c - 1, c + 1, c - W, c + W]) if (e >= 0 && e < m.W * m.H && m.own[e] === q) { k = m.kind[e]; el = m.el[e]; hid = m.hid[e]; if (nat(k)) break; }
    if (!nat(k)) { const near = []; for (const e of [c - 1, c + 1, c - W, c + W]) if (e >= 0 && e < m.W * m.H && m.own[e] >= 0 && nat(m.kind[e])) near.push(m.kind[e]); k = near[0] || (m.cave ? "cave" : "stone"); }
    m.own[c] = q; m.kind[c] = k; m.el[c] = el; m.hid[c] = hid; m.bt[c] = ""; m.cl[c] = 0; m.sw[c] = 0; m.sl[c] = 0;
  }
  function fixDiagonals(m) {
    let n = 0;
    for (let y = 0; y < m.H - 1; y++) for (let x = 0; x < m.W - 1; x++) {
      const a = y * m.W + x, b = a + 1, c = a + m.W, d = c + 1, f = i => m.own[i] >= 0;
      if (f(a) && f(d) && !f(b) && !f(c)) { paintCell(m, b, m.own[a]); n++; }
      else if (f(b) && f(c) && !f(a) && !f(d)) { paintCell(m, a, m.own[b]); n++; }
    }
    return n;
  }
  // the cheapest way from a room to what is reached: walking is cheap, a ford, a bridge or a climb dearer, digging dearest
  function joinRoom(m, q, reached, R) {
    const W = m.W, H = m.H, N = W * H, cost = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), heap = new Heap();
    // from where one can stand in the room (or, in a room that is all lava or drop, from anywhere in it)
    const stand = []; for (let c = 0; c < N; c++) if (m.own[c] === q && (CV.pass(m.kind[c]) === "walk" || CV.pass(m.kind[c]) === "swim")) stand.push(c);
    if (!stand.length) for (let c = 0; c < N; c++) if (m.own[c] === q && CV.pass(m.kind[c]) !== "rock") stand.push(c);
    for (const c of stand) { cost[c] = 0; heap.push(c, 0); }
    if (!heap.size()) return false;
    const stepCost = (a, b) => {
      const pk = CV.pass(m.kind[b]); let v = pk === "rock" ? (b % W === 0 || b % W === W - 1 || b < W || b >= N - W ? 1e6 : 9) : pk === "swim" ? 4 : pk === "block" ? 6 : 1;
      if (pk !== "rock" && Math.abs(m.el[a] - m.el[b]) > CV.CLIMB && !m.cl[a] && !m.cl[b]) v += 5;
      if (m.own[b] >= 0 && m.own[a] >= 0 && m.own[a] !== m.own[b] && (m.hid[a] !== m.hid[b] || m.bt[a] || m.bt[b])) v += 40;   // never through a hidden place or a built wall
      return v + R() * .3;
    };
    let goal = -1;
    while (heap.size()) {
      const [v, c] = heap.pop(); if (v > cost[c]) continue;
      if (reached[c] && m.own[c] !== q) { goal = c; break; }
      const x = c % W;
      for (const e of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) { if (e < 0 || e >= N) continue; const nv = v + stepCost(c, e); if (nv < cost[e]) { cost[e] = nv; prev[e] = c; heap.push(e, nv); } }
    }
    if (goal < 0) return false;
    // walk it back, making each square crossable: rock dug, water forded, lava and drops bridged, ledges given a
    // climb, and a door where the way passes a built wall or into a hidden place
    let c = goal, last = -1;
    while (c >= 0) {
      const pk = CV.pass(m.kind[c]);
      if (m.own[c] < 0 || pk === "rock") paintCell(m, c, q);
      else if (pk === "swim" && !m.sw[c]) m.kind[c] = "shallows";
      else if (pk === "block") m.kind[c] = "bridge";
      if (last >= 0) {
        if (Math.abs(m.el[c] - m.el[last]) > CV.CLIMB && !m.cl[c] && !m.cl[last]) { m.cl[c] = 1; m.cl[last] = 1; }
        if (m.own[c] !== m.own[last] && (m.hid[c] !== m.hid[last] || m.bt[c] || m.bt[last])) { const k = Math.abs(c - last) === 1 ? ekey("v", Math.max(c % W, last % W), Math.floor(c / W)) : ekey("h", c % W, Math.max(Math.floor(c / W), Math.floor(last / W))); if (!m.doors.has(k)) m.doors.set(k, m.hid[c] !== m.hid[last] ? "s" : "d"); }
      }
      if (cost[c] === 0) break;
      last = c; c = prev[c];
    }
    return true;
  }
  function doorsOf(m) { const out = []; for (const [k, t] of m.doors) { const [o, x, y] = k.split(":"); out.push([+x, +y, o, t]); } return out; }
  CV.doorsOf = doorsOf;

  /* ---- the outline the drawing follows: the edge of the floor (and of each kind of floor) traced through the
          squares, smoothed and a little roughened, so a cave reads as rock and not as squares. The squares stay the
          truth of where one can stand; the line keeps within a third of a square of them. */
  const OUTC = new Map();
  CV.outline = (F, gm, show) => {
    // (show: hidden rooms the game master has shown the players, by the fog of war)
    const sig = (gm ? "g" : "p") + (show && show.size ? [...show].sort().join(",") : "") + F.w + "x" + F.h + ":" + (F.geo || "") + ":" + JSON.stringify(F.R);
    const hit = OUTC.get(sig); if (hit) return hit;
    const m = CV.cells(F), W = m.W, H = m.H, N = W * H, seed = CV.hash(F.n || "cave");
    const vis = c => m.own[c] >= 0 && (gm || !m.hid[c] || !!(show && show.has(m.rooms[m.own[c]].id)));
    const mask = new Uint8Array(N); for (let c = 0; c < N; c++) mask[c] = vis(c) ? 1 : 0;
    const floor = contours(mask, W, H, seed);
    // the special floors, each traced on its own over the plain one
    const counts = {}; for (let c = 0; c < N; c++) if (mask[c] && !m.bt[c]) counts[m.kind[c]] = (counts[m.kind[c]] || 0) + 1;
    const base = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || "cave";
    const ORDER = ["earth", "gravel", "sand", "moss", "blight", "fungus", "crystal", "ice", "shallows", "water", "river", "lava", "chasm"];
    const kinds = [];
    for (const k of Object.keys(counts).filter(k => k !== base && k !== "bridge").sort((a, b) => (ORDER.indexOf(a) + 1 || 50) - (ORDER.indexOf(b) + 1 || 50))) {
      const km = new Uint8Array(N); for (let c = 0; c < N; c++) km[c] = mask[c] && !m.bt[c] && (m.kind[c] === k || (k === "water" && m.kind[c] === "chasm" && false)) ? 1 : 0;
      kinds.push([k, contours(km, W, H, seed + CV.hash(k))]);
    }
    // cliffs: where two squares side by side stand at heights a step apart; the hachures fall towards the lower
    const cliffs = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = y * W + x; if (!mask[c]) continue;
      if (x < W - 1 && mask[c + 1] && Math.abs(m.el[c] - m.el[c + 1]) >= .9) cliffs.push({ o: "v", x: x + 1, y, low: m.el[c] > m.el[c + 1] ? 1 : -1, d: Math.abs(m.el[c] - m.el[c + 1]), cl: m.cl[c] || m.cl[c + 1] });
      if (y < H - 1 && mask[c + W] && Math.abs(m.el[c] - m.el[c + W]) >= .9) cliffs.push({ o: "h", x, y: y + 1, low: m.el[c] > m.el[c + W] ? 1 : -1, d: Math.abs(m.el[c] - m.el[c + W]), cl: m.cl[c] || m.cl[c + W] });
    }
    // heights, for shading: each square's height where it is not 0
    const heights = []; for (let c = 0; c < N; c++) if (mask[c] && m.el[c]) heights.push([c % W, (c - c % W) / W, m.el[c]]);
    const res = { floor, kinds, base, cliffs, heights, m };
    OUTC.set(sig, res); if (OUTC.size > 24) OUTC.delete(OUTC.keys().next().value);
    return res;
  };
  // marching squares over a finer, blurred, roughened copy of the mask; closed loops in squares
  function contours(mask, W, H, seed) {
    const S = 4, gw = W * S + 2, gh = H * S + 2, f = new Float32Array(gw * gh);
    for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) f[j * gw + i] = mask[Math.floor((j - 1) / S) * W + Math.floor((i - 1) / S)];
    // a box blur two sub-squares wide each way
    const tmp = new Float32Array(gw * gh), B = 2;
    for (let j = 0; j < gh; j++) { let s = 0; for (let i = -B; i <= B; i++) s += i >= 0 && i < gw ? f[j * gw + i] : 0; for (let i = 0; i < gw; i++) { tmp[j * gw + i] = s / (2 * B + 1); const a = i - B, b = i + B + 1; s += (b < gw ? f[j * gw + b] : 0) - (a >= 0 ? f[j * gw + a] : 0); } }
    for (let i = 0; i < gw; i++) { let s = 0; for (let j = -B; j <= B; j++) s += j >= 0 && j < gh ? tmp[j * gw + i] : 0; for (let j = 0; j < gh; j++) { f[j * gw + i] = s / (2 * B + 1); const a = j - B, b = j + B + 1; s += (b < gh ? tmp[b * gw + i] : 0) - (a >= 0 ? tmp[a * gw + i] : 0); } }
    // roughened near the edge only, so a passage one square wide never closes
    const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, h = (a, b) => (CV.hash(seed + ":" + a + ":" + b) % 1000) / 1000, s = t => t * t * (3 - 2 * t); const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1); return (a + (b - a) * s(fx)) + ((c + (d - c) * s(fx)) - (a + (b - a) * s(fx))) * s(fy); };
    for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) { const k = j * gw + i, v = f[k]; if (v <= .05 || v >= .95) continue; const w = 1 - Math.abs(2 * v - 1); f[k] = v + (vn((i - 1) / S / 1.3, (j - 1) / S / 1.3) - .5) * .3 * w; }
    for (let i = 0; i < gw; i++) { f[i] = 0; f[(gh - 1) * gw + i] = 0; } for (let j = 0; j < gh; j++) { f[j * gw] = 0; f[j * gw + gw - 1] = 0; }
    const T = .5, X = i => (i - 1 + .5) / S, Y = j => (j - 1 + .5) / S;
    // each crossing edge, by number: 2 * (j * gw + i) for the edge to the right of point (i, j), + 1 for the one below
    const pt = new Map();
    const P = (k) => { let p = pt.get(k); if (p) return p; const n = k >> 1, i = n % gw, j = (n - i) / gw; if (k & 1) { const a = f[n], b = f[n + gw], t = (T - a) / (b - a); p = [X(i), Y(j) + t / S]; } else { const a = f[n], b = f[n + 1], t = (T - a) / (b - a); p = [X(i) + t / S, Y(j)]; } pt.set(k, p); return p; };
    const segs = [], at = new Map();
    const add = (a, b) => { const s = segs.length; segs.push([a, b]); for (const k of [a, b]) { const l = at.get(k); if (l) l.push(s); else at.set(k, [s]); } };
    for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
      const n = j * gw + i, tl = f[n] > T, tr = f[n + 1] > T, br = f[n + gw + 1] > T, bl = f[n + gw] > T, cs = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      if (!cs || cs === 15) continue;
      const top = 2 * n, bottom = 2 * (n + gw), left = 2 * n + 1, right = 2 * (n + 1) + 1;
      const mid = () => (f[n] + f[n + 1] + f[n + gw] + f[n + gw + 1]) / 4 > T;
      switch (cs) {
        case 1: add(left, bottom); break; case 2: add(bottom, right); break; case 3: add(left, right); break; case 4: add(top, right); break;
        case 5: if (mid()) { add(top, left); add(bottom, right); } else { add(top, right); add(left, bottom); } break;
        case 6: add(top, bottom); break; case 7: add(top, left); break; case 8: add(top, left); break; case 9: add(top, bottom); break;
        case 10: if (mid()) { add(top, right); add(left, bottom); } else { add(top, left); add(bottom, right); } break;
        case 11: add(top, right); break; case 12: add(left, right); break; case 13: add(bottom, right); break; case 14: add(left, bottom); break;
      }
    }
    const used = new Uint8Array(segs.length), loops = [];
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue; used[s0] = 1;
      const start = segs[s0][0]; let k = segs[s0][1]; const keys = [start, k];
      for (let guard = 0; guard < segs.length; guard++) {
        const l = at.get(k) || []; const nx = l.find(s => !used[s]); if (nx == null) break;
        used[nx] = 1; k = segs[nx][0] === k ? segs[nx][1] : segs[nx][0];
        if (k === start) break; keys.push(k);
      }
      if (keys.length >= 4) loops.push(simplify(keys.map(P), .05));
    }
    return loops;
  }
  function simplify(pts, eps) {
    if (pts.length < 8) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = 1; keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); let bi = -1, bd = eps;
      const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > bd) { bd = d; bi = i; } }
      if (bi >= 0) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
    }
    return pts.filter((p, i) => keep[i]);
  }
  CV.path = (loops, C) => loops.map(l => "M" + l.map(p => (p[0] * C).toFixed(1) + " " + (p[1] * C).toFixed(1)).join("L") + "Z").join("");

  /* ================================================================ the generator */
  const CPLX = { simple: { loops: .06, wind: .14, dead: 0 }, winding: { loops: .16, wind: .32, dead: 1 }, labyrinth: { loops: .3, wind: .44, dead: 3 }, extreme: { loops: .45, wind: .55, dead: 5 } };
  const CHAMB = { few: { per: 230, r: [4.2, 8.2], big: 1 }, many: { per: 82, r: [2, 3.6], big: 0 }, mixed: { per: 128, r: [2.2, 6.8], big: 1 } };
  const OUTSIDE = { limestone: "grass", ice: "snow", volcanic: "sand", crystal: "grass", sandstone: "sand", ancient: "forest" };
  const BASE = { limestone: "cave", ice: "cave", volcanic: "basalt", crystal: "cave", sandstone: "earth", ancient: "cave" };
  CV.LIGHT = { dark: "dark", dim: "dim", biolum: "biolum", magic: "arcane", lava: "lava", torch: "torch" };

  function settingsOf(opt) {
    const s = Object.assign({}, CV.DEFAULTS, opt || {});
    if (!s.seed) s.seed = CV.newSeed();
    for (const [k, , list] of CV.SETTINGS) if (!list.some(x => x[0] === s[k])) s[k] = CV.DEFAULTS[k];
    s.levels = clamp(Math.round(+s.levels || 0), 0, 5);
    return s;
  }
  CV.settingsOf = settingsOf;

  // one level's grid while it is being made
  function grid(W, H) { const n = W * H; return { W, H, own: new Int32Array(n).fill(-1), kind: new Array(n).fill(null), el: new Float32Array(n), cl: new Uint8Array(n), hid: new Uint8Array(n), bt: new Array(n).fill(""), sw: new Uint8Array(n), sl: new Uint8Array(n), core: new Uint8Array(n), keep: new Uint8Array(n), rooms: [], ix: {}, doors: new Map(), cave: true, props: [], marks: [], stairs: [] }; }
  function room(g, o) { const r = Object.assign({ type: "chamber", kind: g.base, name: "", feats: [], extra: {}, notes: [] }, o); r.q = g.rooms.length; g.rooms.push(r); return r.q; }
  function set(g, c, q) { const r = g.rooms[q]; g.own[c] = q; g.kind[c] = r.kind; g.hid[c] = r.hidden ? 1 : 0; g.bt[c] = r.b || ""; g.sw[c] = r.sw ? 1 : 0; g.el[c] = 0; }
  const inb = (g, x, y, m) => x >= (m || 0) && y >= (m || 0) && x < g.W - (m || 0) && y < g.H - (m || 0);
  const N4 = (g, c) => { const x = c % g.W, out = []; if (x > 0) out.push(c - 1); if (x < g.W - 1) out.push(c + 1); if (c >= g.W) out.push(c - g.W); if (c < g.W * (g.H - 1)) out.push(c + g.W); return out; };
  const N8count = (g, c) => { const x = c % g.W, y = (c - x) / g.W; let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < g.W && Y < g.H && g.own[Y * g.W + X] >= 0) n++; } return n; };
  const cellsOf = (g, q) => { const out = []; for (let c = 0; c < g.W * g.H; c++) if (g.own[c] === q) out.push(c); return out; };

  // a chamber's shape: a blob whose edge wanders (a few waves round it), stretched and turned
  function blob(g, R, cx, cy, r0, q, opt) {
    opt = opt || {};
    const H = [2, 3, 4, 5, 6].map(k => [k, R.range(0, opt.rough || .3) / Math.pow(k, .75), R.range(0, Math.PI * 2)]);
    const st = opt.stretch || R.range(.7, 1.45), rot = R.range(0, Math.PI), ext = Math.ceil(r0 * 1.7 * Math.max(st, 1 / st)) + 1, out = [];
    for (let y = Math.floor(cy - ext); y <= cy + ext; y++) for (let x = Math.floor(cx - ext); x <= cx + ext; x++) {
      if (!inb(g, x, y, opt.margin == null ? 1 : opt.margin)) continue;
      const dx = x + .5 - cx, dy = y + .5 - cy, u = (dx * Math.cos(rot) + dy * Math.sin(rot)) / st, v = (-dx * Math.sin(rot) + dy * Math.cos(rot)) * st;
      const a = Math.atan2(v, u); let lim = r0; for (const [k, amp, ph] of H) lim *= 1 + amp * Math.sin(k * a + ph);
      if (Math.hypot(u, v) <= lim) { const c = y * g.W + x; if (opt.test ? opt.test(c) : g.own[c] < 0) { if (q != null) set(g, c, q); out.push(c); } }
    }
    return out;
  }
  // a passage along a wandering line from one point to another; width 1, 2, 3 or "irr" (it changes as it goes)
  function tunnel(g, R, a, b, q, width, wind, opt) {
    opt = opt || {};
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / d, ny = (b.x - a.x) / d, n = clamp(Math.round(d / 7 * (.6 + wind * 2)), 0, 7);
    const pts = [[a.x, a.y]];
    for (let i = 1; i <= n; i++) { const t = i / (n + 1), off = R.range(-1, 1) * d * wind * .42; pts.push([a.x + (b.x - a.x) * t + nx * off, a.y + (b.y - a.y) * t + ny * off]); }
    pts.push([b.x, b.y]);
    const P = i => pts[clamp(i, 0, pts.length - 1)], ph = R.range(0, 10);
    let prev = -1, s = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), steps = Math.max(2, Math.ceil(L / .3));
      for (let k = 0; k < steps; k++) {
        const t = k / steps, t2 = t * t, t3 = t2 * t;
        const x = .5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        const y = .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        s += .3;
        const cx = clamp(Math.floor(x), 1, g.W - 2), cy = clamp(Math.floor(y), 1, g.H - 2), c = cy * g.W + cx;
        const w = width === "irr" ? 1 + Math.max(0, Math.sin(s * .45 + ph) + Math.sin(s * .17 + ph * 2)) : width;
        const paint = e => { if (g.own[e] < 0 && !(opt.avoid && opt.avoid(e))) { set(g, e, q); if (opt.cells) opt.cells.push(e); } };
        if (prev >= 0 && prev !== c) { const px = prev % g.W, py = (prev - px) / g.W; if (px !== cx && py !== cy) { const e = py * g.W + cx; paint(e); g.core[e] = 1; } }
        paint(c); g.core[c] = 1;
        if (w > 1.3) { const rr = w / 2; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = cx + dx, Y = cy + dy; if (!inb(g, X, Y, 1)) continue; if (Math.hypot(X + .5 - x, Y + .5 - y) <= rr + .1) paint(Y * g.W + X); } }
        prev = c;
      }
    }
  }

  /* ---- one level's layout: chambers, the graph joining them, passages, dead ends, roughened walls */
  function layout(g, R, s, li, anchors) {
    const cp = Object.assign({}, CPLX[s.complexity]), ch = Object.assign({}, CHAMB[s.chambers]), W = g.W, H = g.H;
    if (s.explore === "confusing") { cp.loops += .08; cp.dead += 2; }
    if (s.explore === "maze") { cp.loops += .14; cp.dead += 4; ch.per *= .75; ch.r = [ch.r[0] * .8, ch.r[1] * .75]; }
    if (s.env === "mine") cp.wind *= .35;
    const wind = cp.wind * (s.tunnels === "winding" ? 1.6 : 1);
    const C = [];
    for (const a of anchors) C.push({ x: a.x + 1, y: a.y + 1, r: R.range(2.8, 3.8), anchor: a });
    if (ch.big && W * H > 1400) { const r = ch.r[1] * R.range(1.15, 1.4), x = W / 2 + R.range(-W * .14, W * .14), y = H / 2 + R.range(-H * .14, H * .14); if (C.every(c => Math.hypot(c.x - x, c.y - y) > c.r + r + 2)) C.push({ x, y, r, big: 1 }); }
    const want = clamp(Math.round(W * H / ch.per), 4, 46);
    for (let t = 0; C.length < want && t < want * 80; t++) {
      const u = R(), r = ch.r[0] + (ch.r[1] - ch.r[0]) * (s.chambers === "mixed" ? Math.pow(u, 1.7) : u);
      const x = R.range(r + 2, W - r - 3), y = R.range(r + 2, H - r - 3), gap = R.range(1.6, 2.2 + wind * 6);
      if (C.every(c => Math.hypot(c.x - x, c.y - y) >= c.r + r + gap)) C.push({ x, y, r });
    }
    // the graph: neighbours that see each other (Gabriel), the shortest tree through them, then loops
    const n = C.length, E = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const d2 = (C[i].x - C[j].x) ** 2 + (C[i].y - C[j].y) ** 2; let ok = true;
      for (let k = 0; k < n && ok; k++) if (k !== i && k !== j && (C[i].x - C[k].x) ** 2 + (C[i].y - C[k].y) ** 2 + (C[j].x - C[k].x) ** 2 + (C[j].y - C[k].y) ** 2 < d2) ok = false;
      if (ok) E.push([i, j, Math.sqrt(d2) - C[i].r - C[j].r]);
    }
    E.sort((a, b) => a[2] - b[2]);
    const par = C.map((_, i) => i), find = i => par[i] === i ? i : (par[i] = find(par[i]));
    const tree = [], rest = [];
    for (const e of E) { const a = find(e[0]), b = find(e[1]); if (a !== b) { par[a] = b; tree.push(e); } else rest.push(e); }
    const med = tree.length ? tree.map(e => e[2]).sort((a, b) => a - b)[Math.floor(tree.length / 2)] : 6;
    const loops = R.shuffle(rest.filter(e => e[2] < med * 2.6)).slice(0, Math.round(rest.length * cp.loops));
    // the chambers, the biggest first so a small one never bites into a great one
    const order = C.map((c, i) => i).sort((a, b) => (C[b].anchor ? 99 : 0) + C[b].r - (C[a].anchor ? 99 : 0) - C[a].r);
    const cq = [];
    for (const i of order) {
      const c = C[i], q = room(g, { type: "chamber", cx: c.x, cy: c.y, r: c.r, big: c.big, anchor: c.anchor });
      cq[i] = q; c.q = q;
      blob(g, R, c.x, c.y, c.r, q, { stretch: c.anchor ? 1 : R.range(.65, 1.5), rough: c.big ? .34 : .3 });
      if (c.r >= 3.6 && !c.anchor && R.chance(.45)) for (let k = R.int(1, 2); k > 0; k--) { const t = R.range(0, Math.PI * 2); blob(g, R, c.x + Math.cos(t) * c.r * .75, c.y + Math.sin(t) * c.r * .75, c.r * R.range(.4, .65), q, {}); }
      if (c.anchor) { const a = c.anchor; for (let y = a.y; y < a.y + 2; y++) for (let x = a.x; x < a.x + 2; x++) { const e = y * W + x; if (g.own[e] < 0 || g.own[e] === q) { set(g, e, q); g.keep[e] = 1; g.core[e] = 1; } } }
    }
    // the passages
    const tw = () => ({ narrow: 1, winding: 1, branching: R.pick([1, 1, 2]), wide: R.pick([2, 3, 2]), irregular: "irr", mixed: R.pick([1, 1, 2, "irr"]) })[s.tunnels] || 1;
    const edges = tree.concat(loops);
    for (const [i, j] of edges) {
      const q = room(g, { type: "tunnel", ends: [cq[i], cq[j]] }), w = s.env === "mine" ? R.pick([2, 2, 1]) : tw();
      tunnel(g, R, C[i], C[j], q, w, wind * R.range(.7, 1.3));
      if (s.tunnels === "branching" && R.chance(.5)) spur(g, R, q, wind);
    }
    for (let k = 0; k < cp.dead + Math.round(n / 8) * (cp.dead ? 1 : 0); k++) { const src = g.rooms[R.int(0, g.rooms.length - 1)]; spur(g, R, src.q, wind); }
    // pillars left standing in the great chambers
    for (const c of C) if (c.r >= 4.5 && !c.anchor && R.chance(.5)) for (let k = R.int(1, 3); k > 0; k--) {
      const t = R.range(0, Math.PI * 2), d = R.range(0, c.r * .5), px = c.x + Math.cos(t) * d, py = c.y + Math.sin(t) * d;
      blob(g, R, px, py, R.range(.55, 1.3), null, { test: e => g.own[e] === c.q && !g.core[e] && !g.keep[e] && N8count(g, e) === 8, margin: 2 }).forEach(e => { g.own[e] = -1; g.kind[e] = null; });
    }
    roughen(g, R, 2);
    alcoves(g, R);
    tidyRooms(g);
    return C;
  }
  // a dead end: a short, wandering passage into the rock that stops before it meets anything
  function spur(g, R, fromQ, wind) {
    const cells = cellsOf(g, fromQ); if (!cells.length) return;
    for (let t = 0; t < 12; t++) {
      const c0 = R.pick(cells), x0 = c0 % g.W, y0 = (c0 - x0) / g.W, a = R.range(0, Math.PI * 2), L = R.int(4, 11);
      const path = []; let x = x0 + .5, y = y0 + .5, ang = a, ok = true;
      for (let k = 0; k < L * 3 && ok; k++) {
        ang += R.range(-.5, .5) * (.4 + wind); x += Math.cos(ang) * .45; y += Math.sin(ang) * .45;
        const cx = Math.floor(x), cy = Math.floor(y); if (!inb(g, cx, cy, 2)) { ok = false; break; }
        const c = cy * g.W + cx; if (c === path[path.length - 1] || g.own[c] === fromQ) continue;
        if (g.own[c] >= 0) { ok = false; break; }
        // nothing else may be close: a dead end that touches another passage is no dead end
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) { const e = (cy + dy) * g.W + cx + dx; if (g.own[e] >= 0 && g.own[e] !== fromQ && !path.includes(e)) { ok = false; break; } }
        if (ok) { if (path.length) { const p = path[path.length - 1], px = p % g.W, py = (p - px) / g.W; if (px !== cx && py !== cy) { const e = py * g.W + cx; if (g.own[e] < 0) path.push(e); } } path.push(c); }
      }
      if (!ok || path.length < 4 || !N4(g, path[0]).some(e => g.own[e] === fromQ)) continue;
      const q = room(g, { type: "spur", deadEnd: 1 }); for (const c of path) { set(g, c, q); g.core[c] = 1; }
      const end = path[path.length - 1]; if (R.chance(.45)) blob(g, R, end % g.W + .5, Math.floor(end / g.W) + .5, R.range(1, 1.8), q, { test: e => g.own[e] < 0 && nearOnly(g, e, q), margin: 2 });
      return;
    }
  }
  const nearOnly = (g, e, q) => { const x = e % g.W, y = (e - x) / g.W; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= g.W || Y >= g.H) return false; const o = g.own[Y * g.W + X]; if (o >= 0 && o !== q) return false; } return true; };
  // the walls roughened: hollows filled in where rock is mostly surrounded, thin spurs of floor worn back
  function roughen(g, R, iters) {
    for (let it = 0; it < iters; it++) {
      const add = [], del = [];
      for (let c = 0; c < g.W * g.H; c++) {
        const x = c % g.W, y = (c - x) / g.W; if (!inb(g, x, y, 1)) continue;
        const n8 = N8count(g, c);
        if (g.own[c] < 0 && n8 >= 5 && R.chance(.6)) { const cnt = {}; for (const e of N4(g, c)) if (g.own[e] >= 0 && !g.hid[e] && !g.bt[e]) cnt[g.own[e]] = (cnt[g.own[e]] || 0) + 1; const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; if (best) add.push([c, +best[0]]); }
        else if (g.own[c] >= 0 && !g.core[c] && !g.keep[c] && n8 <= 2 && R.chance(.5)) del.push(c);
      }
      for (const [c, q] of add) set(g, c, q);
      for (const c of del) { g.own[c] = -1; g.kind[c] = null; }
    }
  }
  function alcoves(g, R) {
    for (const r of g.rooms) {
      if (r.type !== "chamber" || r.r < 2.8) continue;
      const cells = cellsOf(g, r.q).filter(c => N4(g, c).some(e => g.own[e] < 0));
      for (let k = R.int(0, 3); k > 0 && cells.length; k--) {
        const c = R.pick(cells), x = c % g.W + .5, y = Math.floor(c / g.W) + .5, a = Math.atan2(y - r.cy, x - r.cx);
        blob(g, R, x + Math.cos(a) * 1.2, y + Math.sin(a) * 1.2, R.range(.8, 1.6), r.q, { test: e => g.own[e] < 0 && nearOnly(g, e, r.q), margin: 2 });
      }
    }
  }
  // a room in pieces becomes one room per piece; crumbs join their neighbour
  function tidyRooms(g) {
    const W = g.W, N = W * g.H;
    for (let pass = 0; pass < 3; pass++) {
      const seen = new Uint8Array(N);
      const comps = new Map();
      for (let c = 0; c < N; c++) {
        if (seen[c] || g.own[c] < 0) continue;
        const q = g.own[c], qu = [c]; seen[c] = 1;
        for (let h = 0; h < qu.length; h++) for (const e of N4(g, qu[h])) if (!seen[e] && g.own[e] === q) { seen[e] = 1; qu.push(e); }
        if (!comps.has(q)) comps.set(q, []); comps.get(q).push(qu);
      }
      let changed = false;
      for (const [q, list] of comps) {
        list.sort((a, b) => b.length - a.length);
        list.forEach((cells, k) => {
          const r = g.rooms[q], small = cells.length < (r.type === "chamber" ? 4 : 3);
          if (!k && !small) return;
          if (small) {
            const cnt = {}; for (const c of cells) for (const e of N4(g, c)) if (g.own[e] >= 0 && g.own[e] !== q && !g.hid[e] && !g.bt[e]) cnt[g.own[e]] = (cnt[g.own[e]] || 0) + 1;
            const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
            if (best) { for (const c of cells) { const keepK = g.kind[c]; set(g, c, +best[0]); if (keepK && keepK !== g.rooms[q].kind) g.kind[c] = keepK; } changed = true; return; }
            if (!k) return;
            for (const c of cells) if (!g.keep[c]) { g.own[c] = -1; g.kind[c] = null; }
            changed = true; return;
          }
          const nq = room(g, Object.assign({}, r, { q: undefined, feats: r.feats.slice(), notes: [], split: 1 })); g.rooms[nq].q = nq;
          for (const c of cells) g.own[c] = nq; changed = true;
        });
      }
      if (!changed) break;
    }
  }
  // the room graph: which rooms open into which (and through which doors)
  function graph(g) {
    const adj = g.rooms.map(() => new Set()), W = g.W;
    for (let c = 0; c < W * g.H; c++) {
      const q = g.own[c]; if (q < 0) continue; const x = c % W;
      for (const [e, ek] of [[x < W - 1 ? c + 1 : -1, ekey("v", x + 1, (c - x) / W)], [c + W < W * g.H ? c + W : -1, ekey("h", x, (c - x) / W + 1)]]) {
        if (e < 0 || g.own[e] < 0 || g.own[e] === q) continue;
        if (canStep(g, c, e, ek, { swim: true, secret: true }) || canStep(g, e, c, ek, { swim: true, secret: true })) { adj[q].add(g.own[e]); adj[g.own[e]].add(q); }
      }
    }
    return adj;
  }
  // the squares one can reach from the ways in, and the rooms that are joined to nothing are joined or filled in
  function connect(g, R, starts) {
    for (let round = 0; round < 80; round++) {
      const seen = flood(g, starts, { swim: true, secret: true });
      const lost = []; const comp = new Uint8Array(g.W * g.H);
      for (let c = 0; c < g.W * g.H; c++) {
        if (g.own[c] < 0 || seen[c] || comp[c] || CV.pass(g.kind[c]) === "block") continue;
        const qu = [c]; comp[c] = 1; for (let h = 0; h < qu.length; h++) for (const e of N4(g, qu[h])) if (!comp[e] && !seen[e] && g.own[e] >= 0 && CV.pass(g.kind[e]) !== "block") { comp[e] = 1; qu.push(e); }
        lost.push(qu);
      }
      if (!lost.length) return;
      // crumbs go back to rock all at once; the rest are joined one at a time
      const crumbs = lost.filter(cells => cells.length < 9 && !cells.some(c => g.keep[c]));
      if (crumbs.length) { for (const cells of crumbs) for (const c of cells) { g.own[c] = -1; g.kind[c] = null; } continue; }
      const cells = lost[0];
      // a passage from the nearest square of it to the nearest reached square
      const dist = new Int32Array(g.W * g.H).fill(-1), from = new Int32Array(g.W * g.H).fill(-1), qu = [];
      for (let c = 0; c < g.W * g.H; c++) if (seen[c]) { dist[c] = 0; qu.push(c); }
      for (let h = 0; h < qu.length; h++) for (const e of N4(g, qu[h])) { const x = e % g.W, y = (e - x) / g.W; if (dist[e] < 0 && inb(g, x, y, 1)) { dist[e] = dist[qu[h]] + 1; from[e] = qu[h]; qu.push(e); } }
      let best = -1; for (const c of cells) if (dist[c] >= 0 && (best < 0 || dist[c] < dist[best])) best = c;
      if (best < 0) { for (const c of cells) if (!g.keep[c]) { g.own[c] = -1; g.kind[c] = null; } continue; }
      const q = room(g, { type: "tunnel", repaired: 1 });
      let c = from[best]; while (c >= 0 && !seen[c]) { if (g.own[c] < 0) { set(g, c, q); g.core[c] = 1; } c = from[c]; }
      if (!cellsOf(g, q).length) g.rooms[q].dead = 1;
      void R;
    }
  }

  /* ---- ways in: open ground at the map's edge and a cave mouth leading into the nearest chamber */
  function mouth(g, R, s, side, how) {
    const W = g.W, H = g.H, along = R.range(.22, .78);
    const [ex, ey] = side === "n" ? [W * along, 0] : side === "s" ? [W * along, H - 1] : side === "w" ? [0, H * along] : [W - 1, H * along];
    const target = g.rooms.filter(r => r.type === "chamber" && !r.anchor && r.cx != null).sort((a, b) => Math.hypot(a.cx - ex, a.cy - ey) - Math.hypot(b.cx - ex, b.cy - ey))[0];
    if (!target) return null;
    const hidden = how === "hidden", out = how === "onward" ? -1 : room(g, { type: "outside", kind: OUTSIDE[s.geology] || "grass", hidden, role: hidden ? "hidden exit" : "outside" });
    if (out >= 0) blob(g, R, ex + .5, ey + .5, R.range(2.6, 4), out, { margin: 0, stretch: side === "n" || side === "s" ? 1.6 : .62 });
    const q = room(g, { type: "tunnel", role: how === "onward" ? "onward" : hidden ? "hidden exit" : "entrance", hidden, exit: how === "onward" });
    const inner = { x: target.cx, y: target.cy }, edge = { x: clamp(ex, 1, W - 2), y: clamp(ey, 1, H - 2) };
    tunnel(g, R, edge, inner, q, how === "onward" ? 1 : 2, .2);
    if (how === "onward") { const c = Math.round(edge.y) * W + Math.round(edge.x); for (let k = 0; k < 2; k++) { const x = clamp(Math.round(ex), 0, W - 1), y = clamp(Math.round(ey), 0, H - 1); const e = y * W + x; if (g.own[e] < 0) set(g, e, q); } void c; }
    return { q, out, side, hidden, target: target.q };
  }

  /* ---- the features a level is given */
  // a patch of another floor inside a room
  function patch(g, R, q, kind, frac) {
    const cells = cellsOf(g, q).filter(c => !g.keep[c] && g.kind[c] === g.rooms[q].kind); if (cells.length < 4) return 0;
    let n = 0; const want = cells.length * frac;
    for (let t = 0; t < 6 && n < want; t++) { const c = R.pick(cells); n += blob(g, R, c % g.W + .5, Math.floor(c / g.W) + .5, R.range(1, 1 + Math.sqrt(want) * .6), null, { test: e => g.own[e] === q && g.kind[e] === g.rooms[q].kind && !g.keep[e], margin: 1 }).map(e => { g.kind[e] = kind; return e; }).length; }
    return n;
  }
  // where a room opens into another: the squares beside a neighbour's
  const mouths = (g, q) => cellsOf(g, q).filter(c => N4(g, c).some(e => g.own[e] >= 0 && g.own[e] !== q));
  function lake(g, R, q, kind, shore) {
    const r = g.rooms[q], ms = new Set(mouths(g, q)), n = blob(g, R, r.cx + R.range(-.3, .3) * r.r, r.cy + R.range(-.3, .3) * r.r, r.r * R.range(.45, .7), null, { test: e => g.own[e] === q && !g.keep[e] && !ms.has(e), margin: 1 });
    for (const e of n) g.kind[e] = kind;
    if (shore) for (const e of n) if (N4(g, e).some(f => g.own[f] === q && g.kind[f] !== kind && g.kind[f] !== shore)) g.kind[e] = shore;
    return n.length;
  }
  // a stream: from one side of the level to another, along the floor, meandering
  function stream(g, R, kind) {
    // (never through a way in or out, or the chamber of a stair)
    const shun = r => r.type === "outside" || /entrance|onward|exit|descent/.test(r.role || "") || r.anchor;
    const W = g.W, H = g.H, floor = []; for (let c = 0; c < W * H; c++) if (g.own[c] >= 0 && !g.hid[c] && !g.bt[c] && CV.pass(g.kind[c]) === "walk" && !g.keep[c] && !shun(g.rooms[g.own[c]])) floor.push(c);
    if (floor.length < 30) return [];
    const vert = R.chance(.5), key = c => vert ? Math.floor(c / W) : c % W;
    floor.sort((a, b) => key(a) - key(b) || a - b);
    const a = R.pick(floor.slice(0, Math.max(1, Math.floor(floor.length * .08)))), b = R.pick(floor.slice(-Math.max(1, Math.floor(floor.length * .08))));
    // the cheapest way through the floor, the cost wandering so the stream does
    const cost = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1), heap = new Heap(); cost[a] = 0; heap.push(a, 0);
    const ph = R.range(0, 1000), noise = c => .5 + .5 * Math.sin((c % W) * .7 + ph) * Math.cos(Math.floor(c / W) * .6 + ph * .7);
    while (heap.size()) {
      const [v, c] = heap.pop(); if (c === b) break; if (v > cost[c]) continue;
      for (const e of N4(g, c)) { if (g.own[e] < 0 || g.hid[e] || g.bt[e] || g.keep[e] || shun(g.rooms[g.own[e]]) || CV.pass(g.kind[e]) !== "walk" && CV.pass(g.kind[e]) !== "swim") continue; const nv = v + 1 + noise(e) * 2.5; if (nv < cost[e]) { cost[e] = nv; prev[e] = c; heap.push(e, nv); } }
    }
    if (!isFinite(cost[b])) return [];
    const path = []; for (let c = b; c >= 0; c = prev[c]) path.push(c);
    for (const c of path) if (CV.pass(g.kind[c]) === "walk") g.kind[c] = kind;
    return path;
  }
  // a ledge: part of a chamber raised, with a ramp or a place to climb
  function raise(g, R, q, h, how) {
    const r = g.rooms[q], t = R.range(0, Math.PI * 2), nx = Math.cos(t), ny = Math.sin(t), off = R.range(-.25, .3) * r.r;
    // the edge of the high ground wanders, as a ledge of rock does
    const p1 = R.range(0, 6.3), p2 = R.range(0, 6.3), wob = u => Math.sin(u * .55 + p1) * 1.1 + Math.sin(u * 1.4 + p2) * .45;
    const cells = cellsOf(g, q), hi = cells.filter(c => { if (g.keep[c]) return false; const dx = c % g.W + .5 - r.cx, dy = Math.floor(c / g.W) + .5 - r.cy; return dx * nx + dy * ny > off + wob(-dx * ny + dy * nx); });
    if (hi.length < 5 || hi.length > cells.length - 4) return 0;
    const hs = new Set(hi); for (const c of hi) g.el[c] = h;
    // the passages that open onto the high side slope down from it
    const seen = new Set(); let front = hi.slice(), d = 0;
    while (front.length && d < 14) { d++; const nf = []; for (const c of front) for (const e of N4(g, c)) { if (seen.has(e) || hs.has(e) || g.own[e] < 0 || g.own[e] === q) continue; const o = g.rooms[g.own[e]]; if (o.type !== "tunnel" && o.type !== "spur") continue; seen.add(e); g.el[e] = Math.max(g.el[e], +(h - d * .55).toFixed(2)); if (h - d * .55 > 0) nf.push(e); } front = nf; }
    const edge = hi.filter(c => N4(g, c).some(e => g.own[e] === q && !hs.has(e)));
    if (edge.length) {
      // a ramp: two squares of the edge halfway up, so each step is half the height; or a place to climb, with a rope
      const c = R.pick(edge), pair = [c].concat(N4(g, c).filter(e => edge.includes(e)).slice(0, 1)), low = pair.flatMap(p => N4(g, p).filter(e => g.own[e] === q && !hs.has(e)));
      if (how === "ramp" && h <= 3.2) { for (const p of pair) g.el[p] = +(h / 2).toFixed(2); r.feats.push("ramp"); }
      else { for (const p of pair.concat(low)) g.cl[p] = 1; r.feats.push("climb"); g.props.push({ a: "ladder-rope", c, wall: false, g: 1, what: "climb" }); }
    }
    r.feats.push(h >= 3.5 ? "cliff" : "ledge"); r.hi = h;
    return hi.length;
  }
  // a chasm inside a great chamber
  function chasm(g, R, q) { const r = g.rooms[q], ms = new Set(mouths(g, q)); const n = blob(g, R, r.cx + R.range(-.2, .2) * r.r, r.cy + R.range(-.2, .2) * r.r, r.r * R.range(.35, .5), null, { test: e => g.own[e] === q && !g.keep[e] && !ms.has(e) && N4(g, e).every(f => !ms.has(f)), margin: 2 }); for (const e of n) g.kind[e] = "chasm"; if (n.length) r.feats.push("chasm"); return n.length; }
  // a passage blocked by a fall of rock, only where another way round exists
  function collapse(g, R, adj) {
    const cands = g.rooms.filter(r => r.type === "tunnel" && !r.hidden && !r.role && cellsOf(g, r.q).length >= 6);
    for (const r of R.shuffle(cands)) {
      const nb = [...adj[r.q]]; if (nb.length !== 2) continue;
      // is there another way between its two ends?
      const seen = new Set([nb[0]]), qu = [nb[0]]; for (let h = 0; h < qu.length; h++) for (const x of adj[qu[h]]) if (x !== r.q && !seen.has(x)) { seen.add(x); qu.push(x); }
      if (!seen.has(nb[1])) continue;
      const cells = cellsOf(g, r.q), start = cells.find(c => N4(g, c).some(e => g.own[e] === nb[0])); if (start == null) continue;
      const d = new Map([[start, 0]]), qq = [start]; for (let h = 0; h < qq.length; h++) for (const e of N4(g, qq[h])) if (g.own[e] === r.q && !d.has(e)) { d.set(e, d.get(qq[h]) + 1); qq.push(e); }
      const max = Math.max(...d.values()), mid = Math.floor(max / 2), cut = [...d].filter(([, v]) => Math.abs(v - mid) <= 1).map(([c]) => c);
      if (cut.length > 8) continue;
      for (const c of cut) { g.own[c] = -1; g.kind[c] = null; }
      r.feats.push("collapse"); r.collapse = cut;
      for (const c of cut) for (const e of N4(g, c)) if (g.own[e] === r.q && R.chance(.6)) g.props.push({ a: R.pick(["rubble-stone", "cave-boulders"]), c: e, g: 1, what: "collapse" });
      return r.q;
    }
    return -1;
  }
  // a hidden place: a narrow way through the rock from a chamber's wall, closed by a secret door, into a small chamber
  function secretPlace(g, R, fromQ, kind) {
    const src = cellsOf(g, fromQ).filter(c => !g.hid[c] && !g.bt[c] && CV.pass(g.kind[c]) === "walk");
    for (let t = 0; t < 30; t++) {
      const c0 = R.pick(src); if (c0 == null) return null;
      const dirs = R.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      for (const [dx, dy] of dirs) {
        const x0 = c0 % g.W, y0 = (c0 - x0) / g.W, L = R.int(3, 6), path = [];
        let ok = true, x = x0, y = y0;
        // forward, now and then a step aside (each step square to the last, so the way can be walked)
        for (let k = 1; k <= L && ok; k++) {
          const moves = [[dx, dy]]; if (k > 1 && R.chance(.3)) moves.push(dx ? [0, R.pick([-1, 1])] : [R.pick([-1, 1]), 0]);
          for (const [mx, my] of moves) { x += mx; y += my; if (!inb(g, x, y, 3)) { ok = false; break; } const c = y * g.W + x; if (g.own[c] >= 0) { ok = false; break; } path.push(c); }
        }
        if (!ok) continue;
        // nothing else near the way or the room at its end, save the square of the chamber it leaves from
        let qt = -1, qc = -1;
        const clear = e => { const ex = e % g.W, ey = (e - ex) / g.W; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const f = (ey + yy) * g.W + ex + xx; if (f === c0 || path.includes(f) || g.own[f] < 0 || g.own[f] === qt || g.own[f] === qc) continue; return false; } return true; };
        if (!path.slice(1).every(clear)) continue;
        const p0 = path[0];
        qt = room(g, { type: "tunnel", hidden: 1, role: "secret way", kind: g.rooms[fromQ].kind });
        for (const c of path) { set(g, c, qt); g.core[c] = 1; g.el[c] = g.el[c0]; }
        const end = path[path.length - 1];
        qc = room(g, { type: "chamber", hidden: 1, role: kind || "hidden", cx: end % g.W + .5 + dx * 1.6, cy: Math.floor(end / g.W) + .5 + dy * 1.6, r: R.range(1.6, 2.6) });
        const got = blob(g, R, g.rooms[qc].cx, g.rooms[qc].cy, g.rooms[qc].r, qc, { test: e => g.own[e] < 0 && clear(e) && Math.hypot(e % g.W - c0 % g.W, Math.floor(e / g.W) - Math.floor(c0 / g.W)) > 2, margin: 2 });
        if (got.length < 5) { for (const c of got.concat(path)) { g.own[c] = -1; g.kind[c] = null; } g.rooms[qt].dead = g.rooms[qc].dead = 1; continue; }
        for (const c of got) g.el[c] = g.el[c0];
        // the door, on the edge between the chamber and the way
        const px = p0 % g.W, py = (p0 - px) / g.W, cx = c0 % g.W, cy = (c0 - cx) / g.W;
        const k = px !== cx ? ekey("v", Math.max(px, cx), py) : ekey("h", px, Math.max(py, cy));
        g.doors.set(k, "s");
        return { way: qt, room: qc, door: k, from: fromQ, at: c0 };
      }
    }
    return null;
  }
  // a built place inside a great chamber: a ruin, a shrine, a miner's hut, walled and doored
  function structure(g, R, q, what) {
    const W = g.W, all = cellsOf(g, q), el0 = all.length ? g.el[all[0]] : 0, cells = new Set(all.filter(c => CV.pass(g.kind[c]) === "walk" && !g.keep[c] && g.el[c] === el0));
    const ok = (x, y, w, h) => { for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) { const c = j * W + i; const inside = i >= x && i < x + w && j >= y && j < y + h; if (inside ? !cells.has(c) : (g.own[c] >= 0 && g.own[c] !== q)) return false; } return true; };
    const sizes = what === "hut" ? [[6, 5], [5, 4], [4, 4]] : [[11, 8], [10, 7], [9, 7], [8, 6], [7, 6], [6, 5]];
    for (const [w0, h0] of sizes) for (const [w, h] of R.chance(.5) ? [[w0, h0], [h0, w0]] : [[h0, w0], [w0, h0]]) {
      const spots = []; for (const c of cells) { const x = c % W, y = (c - x) / W; if (ok(x, y, w, h)) spots.push([x, y]); }
      if (!spots.length) continue;
      const [x, y] = R.pick(spots), tag = what, kind = { temple: "marble", ruin: "flag", hut: "boards", vault: "stone" }[what] || "flag";
      const el = g.el[y * W + x];
      // split into rooms: a long hall, and one or two rooms off it
      const parts = [];
      if (w >= 8 && h >= 6 && what !== "hut") { const cut = x + Math.floor(w * R.range(.55, .68)); parts.push([x, y, cut - x, h]); if (h >= 7 && R.chance(.6)) { const mid = y + Math.floor(h / 2); parts.push([cut, y, x + w - cut, mid - y], [cut, mid, x + w - cut, y + h - mid]); } else parts.push([cut, y, x + w - cut, h]); }
      else if (w >= 6 && R.chance(.6)) { const cut = x + Math.floor(w * .6); parts.push([x, y, cut - x, h], [cut, y, x + w - cut, h]); }
      else parts.push([x, y, w, h]);
      const qs = parts.map((p, i) => room(g, { type: "built", b: tag, kind, built: what, part: i, cx: p[0] + p[2] / 2, cy: p[1] + p[3] / 2, r: Math.min(p[2], p[3]) / 2 }));
      parts.forEach(([px, py, pw, ph], i) => { for (let j = py; j < py + ph; j++) for (let k = px; k < px + pw; k++) { const c = j * W + k; set(g, c, qs[i]); g.el[c] = el; } });
      // the way in: on the side that faces the most of the chamber (counted three squares out), as near its middle as
      // the chamber's floor outside it allows
      const band = (sd, along) => { let n = 0; for (let d = 1; d <= 3; d++) { const c = sd === "n" ? (y - d) * W + along : sd === "s" ? (y + h - 1 + d) * W + along : sd === "w" ? along * W + x - d : along * W + x + w - 1 + d; if (c >= 0 && c < W * g.H && g.own[c] === q && CV.pass(g.kind[c]) === "walk") n++; else break; } return n; };
      const opts = [];
      for (const sd of ["n", "s", "w", "e"]) {
        const span = sd === "n" || sd === "s" ? [x, x + w] : [y, y + h], mid = (span[0] + span[1] - 1) / 2;
        let tot = 0, best = null; for (let a = span[0]; a < span[1]; a++) { const b = band(sd, a); tot += b; if (b >= 2 && (!best || Math.abs(a - mid) < Math.abs(best - mid))) best = a; }
        if (best != null) opts.push([sd, best, tot]);
      }
      opts.sort((a, b) => b[2] - a[2]);
      const [sd, along] = opts.length ? opts[0] : ["s", x + Math.floor(w / 2)];
      const k = sd === "n" ? ekey("h", along, y) : sd === "s" ? ekey("h", along, y + h) : sd === "w" ? ekey("v", x, along) : ekey("v", x + w, along);
      const dt = what === "ruin" ? R.pick(["a", "a", "d"]) : what === "temple" ? R.pick(["dd", "d", "g"]) : "d";
      g.doors.set(k, dt === "dd" ? "d" : dt);
      // doors between its rooms
      for (let i = 1; i < parts.length; i++) {
        const [px, py, pw, ph] = parts[i], [ax, ay, aw, ah] = parts[i === 2 && parts.length === 3 ? 1 : 0];
        if (px === ax + aw) g.doors.set(ekey("v", px, py + Math.floor(Math.min(ph, ah - (py - ay)) / 2)), what === "ruin" ? "a" : "d");
        else if (py === ay + ah) g.doors.set(ekey("h", px + Math.floor(pw / 2), py), "d");
      }
      g.rooms[q].feats.push(what);
      return { qs, door: k, x, y, w, h };
    }
    return null;
  }

  /* ---- the whole cave */
  CV._graph = g => graph(g);
  CV.generate = opt => {
    const s = settingsOf(opt), seed = String(s.seed), W0 = s.size === "custom" ? clamp(+s.w || 56, 20, 160) : SIZES[s.size][0], H0 = s.size === "custom" ? clamp(+s.h || 40, 16, 120) : SIZES[s.size][1];
    const nLv = s.levels || (s.vertical === "levels" ? ({ tiny: 2, small: 2, medium: 3, large: 3, enormous: 4 }[s.size] || 3) : 1);
    const fork = (tag, ...keys) => rng(seed + "|" + tag + "|" + keys.map(k => s[k]).join(","));
    const levels = []; let anchors = [];
    // the layout of each level (nothing later can move it: traps, riddles or decoration chosen differently leave the
    // same chambers and passages)
    for (let li = 0; li < nLv; li++) {
      const R = fork("layout" + li, "size", "w", "h", "complexity", "chambers", "tunnels", "explore", "env", "vertical", "ways");
      const g = grid(W0, H0); g.seed = seed + li; g.li = li; g.base = s.env === "volcanic" ? "basalt" : BASE[s.geology] || "cave";
      const C = layout(g, R, s, li, anchors);
      g.mouths = [];
      if (li === 0) {
        const sides = R.shuffle(["n", "s", "w", "e"]);
        g.mouths.push(mouth(g, R, s, sides[0], "main"));
        if (s.ways === "several") for (let k = 0; k < R.int(1, 2); k++) g.mouths.push(mouth(g, R, s, sides[k + 1], "main"));
        if (s.ways === "hidden") g.mouths.push(mouth(g, R, s, sides[1], "hidden"));
        if (s.ways === "network") { g.mouths.push(mouth(g, R, s, sides[1], "onward")); g.mouths.push(mouth(g, R, s, sides[2], "onward")); }
      } else if (s.ways === "network" && R.chance(.6)) g.mouths.push(mouth(g, R, s, R.pick(["n", "s", "w", "e"]), "onward"));
      g.mouths = g.mouths.filter(Boolean);
      // the hidden exit opens on its chamber through a secret door
      for (const mo of g.mouths.filter(x => x.hidden)) {
        const tc = cellsOf(g, mo.q); let best = null;
        for (const c of tc) for (const e of N4(g, c)) if (g.own[e] >= 0 && !g.hid[e]) { best = [c, e]; break; }
        if (best) { const [c, e] = best, cx = c % W0, cy = (c - cx) / W0, ex = e % W0, ey = (e - ex) / W0; g.doors.set(cx !== ex ? ekey("v", Math.max(cx, ex), cy) : ekey("h", cx, Math.max(cy, ey)), "s"); }
      }
      const starts = []; for (let c = 0; c < W0 * H0; c++) if (g.own[c] >= 0 && (g.rooms[g.own[c]].type === "outside" && !g.hid[c] || g.keep[c])) starts.push(c);
      if (!starts.length) for (let c = 0; c < W0 * H0; c++) if (g.own[c] >= 0) { starts.push(c); break; }
      g.starts = starts;
      connect(g, R, starts);
      tidyRooms(g);
      // the way down: in a chamber far from where this level is entered
      if (li < nLv - 1) {
        const seen = flood(g, starts, { swim: true, secret: false }), dist = bfsDist(g, starts);
        const far = g.rooms.filter(r => r.type === "chamber" && !r.hidden && !r.anchor && cellsOf(g, r.q).length >= 9).map(r => { const cs = cellsOf(g, r.q).filter(c => seen[c]); return [r, cs.length ? Math.max(...cs.map(c => dist[c])) : -1, cs]; }).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
        const want = W0 * H0 > 3000 && R.chance(.5) ? 2 : 1, got = [];
        for (const [r, , cs] of far) {
          if (got.length >= want) break;
          const spot = cs.find(c => { const x = c % W0, y = (c - x) / W0; return x < W0 - 3 && y < H0 - 3 && [c, c + 1, c + W0, c + W0 + 1].every(e => g.own[e] === r.q) && Math.hypot(x + 1 - r.cx, y + 1 - r.cy) < r.r; }) ?? cs.find(c => { const x = c % W0, y = (c - x) / W0; return x < W0 - 3 && y < H0 - 3 && [c, c + 1, c + W0, c + W0 + 1].every(e => g.own[e] === r.q); });
          if (spot == null || got.some(a => Math.hypot(a.x - spot % W0, a.y - Math.floor(spot / W0)) < 10)) continue;
          const a = { x: spot % W0, y: Math.floor(spot / W0), from: r.q }; got.push(a);
          for (const e of [spot, spot + 1, spot + W0, spot + W0 + 1]) { g.keep[e] = 1; g.core[e] = 1; }
          r.role = r.role || "descent";
        }
        g.down = got; anchors = got;
      } else { g.down = []; anchors = []; }
      g.up = li ? levels[li - 1].down : [];
      levels.push(g);
    }
    // the features of each level
    levels.forEach((g, li) => {
      const R = fork("features" + li, "water", "geology", "env", "vertical", "secrets", "explore", "danger");
      const big = () => g.rooms.filter(r => r.type === "chamber" && !r.hidden && !r.anchor && !r.role && cellsOf(g, r.q).length >= 24).sort((a, b) => cellsOf(g, b.q).length - cellsOf(g, a.q).length);
      // a ruin, a shrine or a miner's hut, inside a great chamber
      const what = { ruin: "ruin", temple: "temple", mine: "hut" }[s.env] || (s.geology === "ancient" && R.chance(.35) ? "ruin" : null);
      g.built = [];
      if (what) { const n = s.env === "temple" ? R.int(1, 2) : 1; for (const r of big().slice(0, n + 1)) { if (g.built.length >= n) break; const st = structure(g, R, r.q, what); if (st) g.built.push(st); } }
      // heights
      const hv = s.vertical, level = () => big().filter(r => !r.feats.some(f => f === "ruin" || f === "temple" || f === "hut"));
      if (hv === "elevations" || hv === "levels" || hv === "cliffs" || (hv === "pits" && R.chance(.4))) {
        const n = hv === "cliffs" ? R.int(2, 3) : R.int(1, 3);
        for (const r of R.shuffle(level()).slice(0, n)) raise(g, R, r.q, hv === "cliffs" ? +R.range(3.8, 6).toFixed(1) : +R.pick([1.5, 2.5, 3]).toFixed(1), hv === "cliffs" ? (R.chance(.25) ? "ramp" : "climb") : (R.chance(.7) ? "ramp" : "climb"));
      }
      if (hv === "pits") for (const r of level().filter(r => !r.feats.includes("ledge") && !r.feats.includes("cliff")).slice(0, R.int(1, 3))) chasm(g, R, r.q);
      // water
      const w = s.env === "flooded" && s.water === "dry" ? "flooded" : s.water;
      if (w === "lakes" || w === "flooded" && R.chance(.5)) for (const r of R.shuffle(big()).slice(0, R.int(1, 2))) if (lake(g, R, r.q, "water", "shallows")) r.feats.push("lake");
      if (w === "streams" || w === "waterfalls" || (w === "lakes" && R.chance(.4))) { for (let k = 0; k < (g.W * g.H > 3000 ? 2 : 1); k++) { const p = stream(g, R, "shallows"); for (const c of p) { const r = g.rooms[g.own[c]]; if (!r.feats.includes("stream")) r.feats.push("stream"); } } }
      if (w === "waterfalls") {
        for (const r of R.shuffle(big()).slice(0, R.int(1, 2))) {
          const wall = cellsOf(g, r.q).filter(c => CV.pass(g.kind[c]) === "walk" && !g.keep[c] && N4(g, c).some(e => g.own[e] < 0));
          if (!wall.length) continue; const c = R.pick(wall), cx = c % g.W + .5, cy = Math.floor(c / g.W) + .5;
          blob(g, R, cx, cy, R.range(1.3, 2), null, { test: e => g.own[e] === r.q && !g.keep[e], margin: 1 }).forEach(e => { g.kind[e] = "water"; });
          g.props.push({ a: "waterfall", c, wall: true, g: 1, what: "falls" }); r.feats.push("falls");
        }
      }
      if (w === "flooded") for (const r of R.shuffle(big()).slice(0, R.int(1, 3))) { const ms = new Set(mouths(g, r.q)); for (const c of cellsOf(g, r.q)) if (!g.keep[c] && !ms.has(c)) g.kind[c] = N4(g, c).some(e => ms.has(e)) ? "shallows" : "water"; r.feats.push("flooded"); }
      if (w === "submerged") {
        const adj = graph(g);
        for (const r of R.shuffle(g.rooms.filter(r => r.type === "tunnel" && !r.role && !r.hidden && cellsOf(g, r.q).length >= 4)).slice(0, R.int(1, 2))) { if ([...adj[r.q]].some(x => g.rooms[x].anchor || g.rooms[x].type === "outside")) continue; r.sw = 1; for (const c of cellsOf(g, r.q)) { g.kind[c] = "water"; g.sw[c] = 1; } r.feats.push("submerged"); }
      }
      // what the rock is
      const terrain = { volcanic: [["gravel", .3], ["lava", .18]], ice: [["ice", .45]], crystal: [["crystal", .3]], sandstone: [["gravel", .2], ["sand", .15]], ancient: [["gravel", .15]], limestone: [["gravel", .12], ["moss", .1]] }[s.geology] || [];
      const envT = { fungal: [["fungus", .35], ["moss", .25]], crystal: [["crystal", .35]], corrupted: [["blight", .35]], volcanic: [["lava", .2], ["gravel", .2]], magic: [["crystal", .15]], lair: [["gravel", .2]], mine: [["gravel", .25]] }[s.env] || [];
      for (const r of g.rooms) {
        if ((r.type !== "chamber" && r.type !== "tunnel") || r.hidden) continue;
        for (const [k, p] of terrain.concat(envT)) if (R.chance(p * (r.type === "tunnel" ? .5 : 1))) { if (k === "lava") { if (r.type === "chamber" && cellsOf(g, r.q).length >= 20 && lake(g, R, r.q, "lava", null)) r.feats.push("lava"); } else if (patch(g, R, r.q, k, R.range(.15, .4))) r.feats.push(k); }
      }
      if ((s.geology === "volcanic" || s.env === "volcanic") && R.chance(.6)) { const p = stream(g, R, "lava"); for (const c of p) { const r = g.rooms[g.own[c]]; if (!r.feats.includes("lava")) r.feats.push("lava"); } }
      // a fall of rock across a passage there is another way round
      const adj = graph(g);
      if (s.complexity !== "simple" && R.chance(.65)) collapse(g, R, adj);
      // hidden places
      const nSec = { none: 0, few: R.int(1, 2), many: R.int(3, 4) }[s.secrets] + (s.explore === "secrets" ? 2 : 0);
      g.secret = [];
      const hosts = R.shuffle(g.rooms.filter(r => r.type === "chamber" && !r.hidden && !r.anchor && r.role !== "outside"));
      for (const r of hosts) { if (g.secret.length >= nSec) break; const sp = secretPlace(g, R, r.q, R.pick(["cache", "hidden", "shrine", "hideout", "ossuary"])); if (sp) g.secret.push(sp); }
      g.rooms.forEach(r => { if (r.dead) r.type = "gone"; });
      // and now nothing may be cut off that was not meant to be: fords, bridges and climbs where the way is barred
      fixRoutes(g, R);
    });
    // the stairs, shafts and ladders between levels
    const ST = levels.map(() => []); let sn = 0;
    levels.forEach((g, li) => (g.down || []).forEach(a => {
      const R = fork("stairs" + li + ":" + sn, "env", "water", "vertical");
      const id = "ST" + (++sn), how = s.env === "mine" ? "cage" : s.water === "waterfalls" && R.chance(.5) ? "falls" : s.vertical === "pits" || s.vertical === "cliffs" ? R.pick(["shaft", "shaft", "chimney"]) : R.pick(["steps", "slope", "shaft", "chimney"]);
      const name = { cage: "The cage shaft", falls: "The climb beside the falls", shaft: "Rope down the shaft", chimney: "A rock chimney", steps: "Rough-cut steps", slope: "A steep scree slope" }[how];
      a.how = how; a.id = id; a.name = name;
      ST[li].push([id, a.x, a.y, 2, 2, "down", "", "s", name]);
      ST[li + 1].push([id, a.x, a.y, 2, 2, "up", "", "n"]);
    }));
    // what each room is for
    roles(levels, s, fork("roles", "env", "danger", "explore", "water"));
    // names, then everything placed in them
    const words = A.caveWords;
    levels.forEach((g, li) => { g.n = words ? words.levelName(g, li, levels.length, s, fork("lvname" + li, "env", "water", "geology")) : (li ? "LEVEL " + (li + 1) : "THE CAVES"); });
    levels.forEach((g, li) => ST[li].forEach(st => { st[6] = st[5] === "down" ? levels[li + 1].n : levels[li - 1].n; }));
    const ids = assignIds(levels);
    levels.forEach((g, li) => decorate(g, s, fork("decor" + li, "env", "geology", "water", "light")));
    const extra = { enc: {}, secrets: {}, clues: {}, traps: {}, riddles: {} };
    if (words) words.name(levels, s, fork("names", "env", "geology", "water"));
    encounters(levels, s, fork("encounters", "encounters", "danger", "env"), extra);
    secretsOf(levels, s, fork("secrets", "secrets", "env"), extra);
    let maxR = Object.keys(ids).length;
    const help = {
      cellsOf, N4, pass: CV.pass, graph, depth: (g, q) => g.depth ? g.depth(q) : 0, newId: () => "R" + (++maxR),
      mark: (g, id, c) => { g.marks.push([id, +(c % g.W + .5).toFixed(2), +(Math.floor(c / g.W) + .5).toFixed(2)]); },
      // a thing the puzzle or the trap is made of: a model of the library, in its square (hidden from the players when
      // the trap is); a model this library lacks is left out
      prop: (g, a, c, o) => { const M = A.models; if (M && M.entry && !M.entry(a)) return; const p = { a, x: +(c % g.W + .5).toFixed(2), y: +(Math.floor(c / g.W) + .5).toFixed(2), g: 1 }; if (g.el[c]) p.z = +g.el[c].toFixed(2); if (o && o.h) p.h = 1; if (o && o.dev) p.dev = o.dev; g.props.push({ a, c, out: p }); },
      // a sealed door in a passage: a square of the passage one wide, walled and doored, the door on the side of the room
      gate: (g, tq, toQ) => {
        const W = g.W, cs = cellsOf(g, tq).filter(c => { const x = c % W; if (CV.pass(g.kind[c]) !== "walk" || g.keep[c]) return false; const l = x > 0 && g.own[c - 1] >= 0, r = x < W - 1 && g.own[c + 1] >= 0, u = g.own[c - W] >= 0, d = g.own[c + W] >= 0; return (l && r && !u && !d) || (u && d && !l && !r); });
        if (!cs.length) return null;
        const to = cellsOf(g, toQ), dist = c => Math.min(...to.map(e => Math.abs(e % W - c % W) + Math.abs(Math.floor(e / W) - Math.floor(c / W))));
        const c = cs.sort((a, b) => dist(a) - dist(b))[0], q = room(g, { type: "built", b: "gate", kind: "flag", built: "gate", role: "gate", name: "The sealed door", cx: c % W + .5, cy: Math.floor(c / W) + .5, r: .5 });
        const el = g.el[c]; set(g, c, q); g.el[c] = el; g.rooms[q].id = help.newId(); g.rooms[q].extra = {};
        const nb = N4(g, c).filter(e => g.own[e] >= 0 && g.own[e] !== q).sort((a, b) => dist(a) - dist(b)), key = e => Math.abs(e - c) === 1 ? ekey("v", Math.max(e % W, c % W), Math.floor(c / W)) : ekey("h", c % W, Math.max(Math.floor(e / W), Math.floor(c / W)));
        if (nb.length < 2) return null;
        const exit = key(nb[0]), entry = key(nb[nb.length - 1]); g.doors.set(entry, "a"); g.doors.set(exit, "d");
        return { q, cell: c, door: exit };
      }
    };
    const ctx = { s, levels, ids, extra, help };
    if (A.devices && A.devices.forCave) A.devices.forCave(ctx, fork("devices", "traps", "riddles", "danger", "env", "nTraps", "nRiddles", "trapsWhere", "riddlesWhere"));
    // the map
    const floors = levels.map((g, li) => {
      const F = { n: g.n, w: g.W, h: g.H, cave: 1, geo: s.geology, light: CV.LIGHT[s.light] || "dark", R: [], D: doorsOf(g), ST: ST[li], M: g.marks.slice(), P: g.props.filter(p => p.out).map(p => p.out), I: [] };
      g.rooms.forEach(r => { r.id = r.id || "x" + r.q; r.extra = r.extra || {}; });
      F.R = CV.rects(g);
      return F;
    });
    const map = { cave: { v: 1, seed, settings: Object.assign({}, s), roles: {} }, floors, rooms: {}, enc: extra.enc, secrets: extra.secrets, clues: extra.clues, traps: extra.traps, riddles: extra.riddles };
    if (nLv > 1) map.start = 0;
    levels.forEach(g => g.rooms.forEach(r => { if (r.role && /^R\d/.test(r.id)) map.cave.roles[r.id] = r.role; }));
    if (words) words.describe(map, levels, s, fork("words", "env", "geology", "water", "light", "danger"));
    // a riddle whose clue lies beyond its own door is made again as one that needs nothing (never left unfair)
    if (A.devices && A.devices.validateMap) for (const x of A.devices.validateMap(map).filter(x => /without solving/.test(x.text))) {
      const old = map.riddles[x.id]; if (!old) continue;
      const nw = A.devices.riddle({ type: "verse", diff: old.diff, allowNeeds: false, seed: seed + x.id }); if (!nw) continue;
      for (const cid of [].concat(old.needs || []).filter(k => map.clues[k] && map.clues[k].gen)) { delete map.clues[cid]; map.floors.forEach(F => { F.M = F.M.filter(m => m[0] !== cid); }); }
      map.riddles[x.id] = Object.assign(nw, { at: old.at, links: old.links, needs: [] });
    }
    // checked, and mended if anything was cut off by accident
    let rep = CV.check(map);
    if (!rep.ok || rep.warnings.some(x => x.fix)) { const fx = CV.repair(map, { seed }); map.floors = fx.floors; rep = CV.check(map); rep.repaired = fx.changed.length; }
    const count = t => levels.reduce((n, g) => n + g.rooms.filter(r => r.id && /^R\d/.test(r.id) && (Array.isArray(t) ? t.includes(r.type) : r.type === t)).length, 0);
    const report = { seed, levels: nLv, size: [W0, H0], chambers: count(["chamber"]), passages: count(["tunnel", "spur"]), built: count(["built"]), rooms: Object.keys(map.rooms).length, secrets: Object.keys(map.secrets).length, encounters: Object.keys(map.enc).length, traps: Object.keys(map.traps).length, riddles: Object.keys(map.riddles).length, check: rep, features: features(levels) };
    CV._last = levels;
    return { map, report };
  };
  function bfsDist(g, starts) { const d = new Int32Array(g.W * g.H).fill(-1), qu = []; for (const c of starts) if (d[c] < 0) { d[c] = 0; qu.push(c); } for (let h = 0; h < qu.length; h++) for (const e of N4(g, qu[h])) if (d[e] < 0 && g.own[e] >= 0 && CV.pass(g.kind[e]) !== "block") { d[e] = d[qu[h]] + 1; qu.push(e); } return d; }
  function features(levels) { const f = {}; for (const g of levels) for (const r of g.rooms) if (r.id && /^R\d/.test(r.id)) for (const x of r.feats) f[x] = (f[x] || 0) + 1; return f; }
  // no room may be cut off by water, lava, a drop or a ledge unless it was meant so
  function fixRoutes(g, R) {
    // a room in plain sight must be reached without a secret door; a hidden one may need one
    for (let round = 0; round < 40; round++) {
      const open = flood(g, g.starts, { swimSw: true }), all = flood(g, g.starts, { swimSw: true, secret: true });
      const stray = g.rooms.find(r => r.type !== "gone" && r.type !== "tmp" && !r.sl && cellsOf(g, r.q).some(c => CV.pass(g.kind[c]) !== "block") && !cellsOf(g, r.q).some(c => (r.hidden ? all : open)[c]));
      if (!stray) break;
      if (!joinRoom(g, stray.q, stray.hidden ? all : open, R)) { stray.sl = 1; stray.notes.push("cut off"); }
    }
    // squares a room cannot walk to inside itself (the far side of a lake, a ledge's top) get a way if they are big
    const reached = flood(g, g.starts, { swimSw: true, secret: true });
    for (const r of g.rooms) {
      if (r.type === "gone" || r.type === "tmp") continue;
      const cs = cellsOf(g, r.q).filter(c => CV.pass(g.kind[c]) === "walk"), cut = cs.filter(c => !reached[c]);
      if (cut.length >= 3 && cut.length / Math.max(1, cs.length) > .12) {
        const tmp = room(g, { type: "tmp" }); for (const c of cut) g.own[c] = tmp;
        joinRoom(g, tmp, reached, R);
        for (let c = 0; c < g.W * g.H; c++) if (g.own[c] === tmp) g.own[c] = r.q;
        g.rooms[tmp].type = "gone";
      }
    }
  }
  // the room ids: R1 the way in, then outwards, level after level
  function assignIds(levels) {
    let n = 0, gn = 0; const ids = {};
    levels.forEach(g => {
      const seen = new Uint8Array(g.W * g.H), order = [], start = g.starts.length ? g.starts : [0];
      const d = bfsDist(g, start.concat((g.up || []).map(a => a.y * g.W + a.x)));
      const firstAt = new Map(); for (let c = 0; c < g.W * g.H; c++) { const q = g.own[c]; if (q < 0) continue; const v = d[c] < 0 ? 1e6 + c : d[c]; if (!firstAt.has(q) || v < firstAt.get(q)) firstAt.set(q, v); }
      for (const [q, v] of [...firstAt].sort((a, b) => a[1] - b[1])) order.push(q);
      void seen;
      for (const q of order) { const r = g.rooms[q]; if (r.type === "gone" || r.type === "tmp") continue; if (r.type === "outside") { r.id = "out" + (++gn); continue; } r.id = "R" + (++n); ids[r.id] = { li: g.li, q }; }
    });
    return ids;
  }
  // the roles: the way in, the heart of the cave, the bottlenecks, the safe place, the treasure, the end of it
  function roles(levels, s, R) {
    const last = levels[levels.length - 1];
    levels.forEach(g => {
      const adj = graph(g), d = bfsDist(g, g.starts.concat((g.up || []).map(a => a.y * g.W + a.x)));
      g.depth = q => { let m = -1; for (const c of cellsOf(g, q)) if (d[c] > m) m = d[c]; return m; };
      // articulation points of the room graph: a passage the whole cave beyond depends on
      const ord = new Map(), low = new Map(); let t = 0; const art = new Set();
      const dfs = (u, p) => { ord.set(u, t); low.set(u, t); t++; let kids = 0; for (const v of adj[u]) { if (!ord.has(v)) { kids++; dfs(v, u); low.set(u, Math.min(low.get(u), low.get(v))); if (p >= 0 && low.get(v) >= ord.get(u)) art.add(u); } else if (v !== p) low.set(u, Math.min(low.get(u), ord.get(v))); } if (p < 0 && kids > 1) art.add(u); };
      const root = g.rooms.find(r => r.type === "outside") || g.rooms.find(r => r.anchor) || g.rooms[0]; if (root) dfs(root.q, -1);
      for (const q of art) { const r = g.rooms[q]; if (r.type === "tunnel" && !r.role && cellsOf(g, q).length <= 30) r.bottleneck = 1; }
      const live = g.rooms.filter(r => (r.type === "chamber" || r.type === "built") && !r.hidden && r.type !== "gone");
      const biggest = live.filter(r => r.type === "chamber").sort((a, b) => cellsOf(g, b.q).length - cellsOf(g, a.q).length)[0];
      if (biggest && !biggest.role) biggest.role = "heart";
      // a safe place to rest: small, off the main way, quiet
      const rest = live.filter(r => r.type === "chamber" && !r.role && adj[r.q].size === 1 && cellsOf(g, r.q).length <= 40).sort((a, b) => Math.abs(g.depth(a.q) - 30) - Math.abs(g.depth(b.q) - 30))[0];
      if (rest && R.chance(.8)) rest.role = "rest";
      for (const b of g.built || []) { const r = g.rooms[b.qs[0]]; r.role = r.role || ({ temple: "shrine", ruin: "ruin", hut: "camp" }[r.built] || "ruin"); }
      if (s.env === "lair" || s.env === "corrupted") { const lair = live.filter(r => r.type === "chamber" && !r.role).sort((a, b) => g.depth(b.q) - g.depth(a.q))[0]; if (lair) lair.role = "nest"; }
      if ((s.env === "temple" || s.env === "magic" || s.env === "ancient") && !g.built.length) { const sh = live.filter(r => r.type === "chamber" && !r.role).sort((a, b) => g.depth(b.q) - g.depth(a.q))[1]; if (sh) sh.role = "shrine"; }
    });
    // the end of the cave and its treasure, on the last level
    const g = last, live = g.rooms.filter(r => r.type === "chamber" && !r.anchor && r.type !== "gone");
    const deep = live.filter(r => !r.hidden && (!r.role || r.role === "heart")).sort((a, b) => g.depth(b.q) - g.depth(a.q)), third = deep.slice(0, Math.max(1, Math.ceil(deep.length / 3)));
    if (s.danger === "dangerous" || s.danger === "deadly" || s.env === "lair" || s.env === "temple" || s.env === "corrupted") { const boss = third.sort((a, b) => cellsOf(g, b.q).length - cellsOf(g, a.q).length)[0]; if (boss) boss.role = "boss"; }
    const hid = levels.flatMap(G => G.rooms.filter(r => r.hidden && r.type === "chamber" && r.role !== "hidden exit").map(r => [G, r]));
    const tre = hid.length && R.chance(.6) ? R.pick(hid)[1] : live.filter(r => !r.role && g.depth(r.q) > 0).sort((a, b) => g.depth(b.q) - g.depth(a.q))[0];
    if (tre) tre.role = "treasure";
    else { const any = live.find(r => !r.role); if (any) any.role = "treasure"; }
  }
  // the furnishings: the rock's own formations, and what has been left there; never in a doorway or on a stair
  function decorate(g, s, R) {
    const W = g.W, stairCells = new Set(); for (const a of (g.down || []).concat(g.up || [])) for (const e of [0, 1, W, W + 1]) stairCells.add(a.y * W + a.x + e);
    const busy = new Set();
    const freeCell = (c, want) => { if (busy.has(c) || stairCells.has(c) || g.keep[c] && want !== "any" || CV.pass(g.kind[c]) !== "walk" || g.kind[c] === "bridge") return false; const q = g.own[c]; if (N4(g, c).some(e => g.own[e] >= 0 && g.own[e] !== q)) return false; if (want === "wall") return N4(g, c).some(e => g.own[e] < 0); if (want === "open") return N4(g, c).every(e => g.own[e] === q); return true; };
    const put = (a, c, o) => { busy.add(c); for (const e of N4(g, c)) busy.add(e); g.props.push(Object.assign({ a, c, g: 1 }, o || {})); };
    const geo = { limestone: [["stalagmites", 3], ["flowstone", 2], ["stalactites", 3], ["cave-pillar", 1], ["rocks", 2]], volcanic: [["rocks", 3], ["rock", 2], ["cave-boulders", 2], ["vent-steam", 1]], ice: [["ice-spikes", 3], ["stalactites", 1], ["rocks", 1], ["ice-block", 2]], crystal: [["crystals", 3], ["crystals-amethyst", 2], ["crystals-red", 1], ["stalagmites", 1]], sandstone: [["rocks", 3], ["rock", 2], ["pebbles", 2], ["stalagmites", 1]], ancient: [["standing-stone", 1], ["rocks", 2], ["stalagmites", 2], ["cave-pillar", 1]] }[s.geology] || [["rocks", 1]];
    const env = { fungal: [["mushroom-giant", 2], ["mushrooms", 3], ["mushroom-glow", 3]], crystal: [["crystals", 3], ["crystals-amethyst", 2]], magic: [["crystals-amethyst", 2], ["glowworms", 1], ["circle-magic", .3]], lair: [["bones", 3], ["skulls", 1], ["egg-sacs", 1], ["cobwebs", 1.5]], corrupted: [["roots", 2], ["egg-sacs", 1], ["bones", 1], ["tentacles", .5]], mine: [["mine-props", 3], ["mine-cart", 1], ["ore-pile", 1.5], ["pickaxe", .7], ["crate-military", .5]], ruin: [["ruin-drums", 1], ["ruin-toppled", .6], ["rubble-stone", 1.5], ["ruin-arch", .5]], temple: [["statue-robed", .6], ["brazier-bowl", .8], ["column-broken", .8]], flooded: [["pool-cave", 1]], volcanic: [["pool-lava", .6], ["vent-steam", 1]] }[s.env] || [];
    const biolum = s.light === "biolum" ? [["glowworms", 2], ["mushroom-glow", 2]] : [];
    for (const r of g.rooms) {
      if (r.type === "gone" || r.type === "outside" || r.type === "tmp") continue;
      const cells = cellsOf(g, r.q), n = cells.length;
      if (r.type === "built") { builtDress(g, R, r, cells, put, freeCell); continue; }
      const count = r.type === "chamber" ? clamp(Math.round(n / 16), 1, 7) : (R.chance(.4) ? 1 : 0);
      const list = geo.concat(env, biolum);
      for (let k = 0; k < count; k++) {
        const a = R.weighted(list), wantWall = /stalag|flowstone|crystals|mine-props|bones|cobwebs|roots|ice-spikes|ruin|rubble|vent|pickaxe|ore|egg|statue|column/.test(a);
        const spots = cells.filter(c => freeCell(c, wantWall ? "wall" : "open")); if (!spots.length) continue;
        put(a, R.pick(spots), { r: R.int(0, 7) * 45, s: +R.range(.8, 1.2).toFixed(2) });
      }
      // what the room is for brings its own things
      const role = r.role, want = (a, how, o) => { const spots = cells.filter(c => freeCell(c, how || "open")); if (spots.length) put(a, R.pick(spots), Object.assign({ r: R.int(0, 3) * 90 }, o || {})); };
      if (role === "entrance" && r.type === "tunnel") want("cave-mouth", "any", { r: 0 });
      if (role === "rest") { want("campfire", "open"); if (R.chance(.6)) want("bedroll", "wall"); }
      if (role === "treasure") { want("chest-treasure", "wall"); if (R.chance(.7)) want(R.pick(["coins", "gems", "gold-bars"]), "open"); if (R.chance(.5)) want("skeleton", "wall"); }
      if (role === "boss") { want(s.env === "temple" || s.env === "corrupted" ? "altar-dark" : s.env === "lair" ? "bones" : "standing-stone", "open"); want("skulls", "wall"); }
      if (role === "nest") { want("bones", "open"); want("egg-sacs", "wall"); if (R.chance(.6)) want("cobwebs", "wall"); }
      if (role === "shrine") { want("altar-stone", "open"); want("statue-robed", "wall"); want("brazier-bowl", "open"); }
      if (role === "cache" || role === "hidden") { want(R.pick(["chest", "coffer", "sack"]), "wall"); }
      if (role === "hideout") { want("bedroll", "wall"); want("lantern", "open"); }
      if (role === "ossuary") { want("skulls", "wall"); want("bones", "open"); }
      if (r.feats.includes("lake") && R.chance(.5)) { const sh = cells.filter(c => g.kind[c] === "shallows" && !busy.has(c)); if (sh.length) put(R.pick(["rocks", "pebbles"]), R.pick(sh)); }
      if (r.type === "tunnel" && s.env === "mine" && n >= 6) { const step = 5; cells.filter((c, i) => i % step === 0 && freeCell(c, "any")).slice(0, 3).forEach(c => put("mine-props", c, { r: 0 })); }
    }
    // each prop as the map has it: a model at the centre of its square
    for (const p of g.props) {
      if (p.c == null) continue;
      const x = p.c % W, y = Math.floor(p.c / W), M = A.models, e = M && M.entry ? M.entry(p.a) : null;
      if (M && M.entry && !e) continue;   // a model this library does not have (yet): left out
      const o = { a: p.a, x: +(x + .5 + (p.wall ? 0 : R.range(-.15, .15))).toFixed(2), y: +(y + .5 + (p.wall ? 0 : R.range(-.15, .15))).toFixed(2), g: 1 };
      if (p.r) o.r = p.r; if (p.s && p.s !== 1) o.s = p.s; if (g.el[p.c]) o.z = +g.el[p.c].toFixed(2); if (g.hid[p.c]) o.h = 1;
      // turned to face out of the wall it stands against
      if (p.wall && e && e.mount === "wall") { const free = N4(g, p.c).find(f => g.own[f] < 0); if (free != null) { const fx = free % W - x, fy = Math.floor(free / W) - y; o.r = fx > 0 ? 270 : fx < 0 ? 90 : fy < 0 ? 0 : 180; } }
      p.out = o;
    }
  }
  function builtDress(g, R, r, cells, put, freeCell) {
    const k = r.built, inner = cells.filter(c => freeCell(c, "open")), wall = cells.filter(c => freeCell(c, "any") && N4(g, c).some(e => g.own[e] !== r.q));
    const one = (a, list) => { if (list.length) put(a, R.pick(list), { r: R.int(0, 3) * 90 }); };
    if (k === "temple") { if (r.part === 0) { one("altar-stone", inner); one("statue-robed", wall); one("brazier-bowl", inner); one("column-fluted", inner); } else { one(R.pick(["sarcophagus", "urn-shelf", "lectern"]), wall); one("candles-cluster", inner); } }
    else if (k === "ruin") { one(R.pick(["ruin-drums", "column-broken"]), inner); one("rubble-stone", inner); if (R.chance(.5)) one(R.pick(["ruin-head", "statue-knight", "ruin-toppled"]), wall); }
    else if (k === "hut") { one("table-trestle", inner); one(R.pick(["crate-military", "barrel"]), wall); one("lantern", inner); }
  }
  // the dangers that live here, by how crowded and how deadly the cave is (generated: the game master gives them stats)
  function encounters(levels, s, R, extra) {
    if (s.encounters === "none") return;
    const W = A.caveWords; let n = 0;
    levels.forEach(g => {
      const rooms = g.rooms.filter(r => (r.type === "chamber" || r.type === "built") && r.id && /^R\d/.test(r.id) && r.role !== "rest" && r.role !== "outside");
      const want = Math.round(rooms.length * (s.encounters === "dense" ? .38 : .16)) + (g === levels[levels.length - 1] && rooms.some(r => r.role === "boss") ? 1 : 0);
      const pick = rooms.filter(r => r.role === "boss" || r.role === "nest").concat(R.shuffle(rooms.filter(r => r.role !== "boss" && r.role !== "nest")));
      for (const r of pick.slice(0, want)) {
        const spot = cellsOf(g, r.q).filter(c => CV.pass(g.kind[c]) === "walk").sort((a, b) => Math.hypot(a % g.W + .5 - (r.cx || 0), Math.floor(a / g.W) + .5 - (r.cy || 0)) - Math.hypot(b % g.W + .5 - (r.cx || 0), Math.floor(b / g.W) + .5 - (r.cy || 0)))[0];
        if (spot == null) continue;
        const id = "E" + (++n), e = W ? W.encounter(r, s, R, g) : { t: "Something in the dark", d: "Something lives here." };
        extra.enc[id] = Object.assign({ at: r.id, gen: 1 }, e);
        g.marks.push([id, +(spot % g.W + .5).toFixed(2), +(Math.floor(spot / g.W) + .5).toFixed(2)]);
        r.enc = id;
      }
    });
  }
  // each secret door, in the secrets directory: how it opens, where it goes, why it is there
  function secretsOf(levels, s, R, extra) {
    const W = A.caveWords; let n = 0;
    // the marker stands by the door, on the side it is searched for from
    const doorMark = (g, key, q) => { const [o, x, y] = key.split(":"), c = +y * g.W + +x, p = o === "v" ? c - 1 : c - g.W, side = g.own[c] === q ? c : p, cx = side % g.W + .5, cy = Math.floor(side / g.W) + .5, ex = o === "v" ? +x : +x + .5, ey = o === "v" ? +y + .5 : +y; return [+(cx + (ex - cx) * .45).toFixed(2), +(cy + (ey - cy) * .45).toFixed(2)]; };
    levels.forEach(g => {
      for (const sp of g.secret || []) {
        const from = g.rooms[sp.from], to = g.rooms[sp.room]; if (!from.id || !to.id) continue;
        const id = "S" + (++n);
        extra.secrets[id] = Object.assign({ at: from.id, gen: 1 }, W ? W.secret(from, to, s, R) : { t: "A hidden way", acc: "A loose stone.", dest: to.id, why: "Someone wanted it hidden." });
        g.marks.push([id, ...doorMark(g, sp.door, sp.from)]);
      }
      for (const mo of (g.mouths || []).filter(x => x.hidden)) {
        const r = g.rooms[mo.q]; if (!r.id) continue; const id = "S" + (++n);
        const door = [...g.doors].find(([k, t]) => t === "s" && (() => { const [o, x, y] = k.split(":"); const c = +y * g.W + +x, p = o === "v" ? c - 1 : c - g.W; return g.own[c] === mo.q || g.own[p] === mo.q; })());
        const at = door ? (() => { const [o, x, y] = door[0].split(":"), c = +y * g.W + +x, p = o === "v" ? c - 1 : c - g.W; return g.rooms[g.own[c] === mo.q ? g.own[p] : g.own[c]]; })() : null;
        extra.secrets[id] = Object.assign({ at: at && at.id || r.id, gen: 1 }, W ? W.hiddenExit(r, s, R) : { t: "A hidden way out", acc: "", dest: "The surface", why: "" });
        if (door && at) g.marks.push([id, ...doorMark(g, door[0], at.q)]);
      }
    });
  }

  /* ================================================================ the editor's cave tools (atlas-caveui.js) */
  // squares painted into a room (or a new one), or back into rock; a floor that was not a cave becomes one
  CV.paint = (F, cells, rid, o) => {
    o = o || {}; const m = CV.cells(F); m.cave = true;
    let q = rid != null ? m.ix[rid] : null;
    if (rid != null && q == null) { q = m.ix[rid] = m.rooms.length; m.rooms.push({ id: rid, name: o.name || "", extra: {} }); }
    // a new square takes the room's own floor, or the floor's usual one
    const usual = (() => { const n = {}; for (let c = 0; c < m.W * m.H; c++) if (m.own[c] >= 0 && CV.pass(m.kind[c]) === "walk" && !m.bt[c] && (q == null || m.own[c] === q)) n[m.kind[c]] = (n[m.kind[c]] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0])[0]; })() || "cave";
    for (const [x, y] of cells) {
      if (x < 0 || y < 0 || x >= m.W || y >= m.H) continue; const c = y * m.W + x;
      if (o.rock) { m.own[c] = -1; m.kind[c] = null; m.el[c] = 0; m.cl[c] = m.hid[c] = m.sw[c] = m.sl[c] = 0; m.bt[c] = ""; continue; }
      if (o.kind && !o.claim) { if (m.own[c] >= 0) m.kind[c] = o.kind; continue; }
      if (o.el != null) { if (m.own[c] >= 0) m.el[c] = o.el; continue; }
      if (q == null) continue;
      const was = m.own[c] >= 0; if (was && m.own[c] === q && !o.kind) continue;
      if (!was) { m.kind[c] = o.kind || usual; m.el[c] = o.atEl || 0; m.hid[c] = o.hidden ? 1 : 0; m.bt[c] = ""; }
      else if (o.kind) m.kind[c] = o.kind;
      m.own[c] = q;
    }
    return Object.assign({}, F, { cave: 1, R: CV.rects(m) });
  };
  // a whole room moved by whole squares, with what stands in it; the squares it leaves become rock
  CV.moveRoom = (F, rid, dx, dy) => {
    const m = CV.cells(F), q = m.ix[rid]; if (q == null) return F;
    const mine = []; for (let c = 0; c < m.W * m.H; c++) if (m.own[c] === q) mine.push(c);
    const snap = mine.map(c => [c, m.kind[c], m.el[c], m.cl[c], m.hid[c], m.bt[c], m.sw[c], m.sl[c]]);
    for (const c of mine) { m.own[c] = -1; m.kind[c] = null; }
    for (const [c, k, el, cl, hid, bt, sw, sl] of snap) { const x = c % m.W + dx, y = Math.floor(c / m.W) + dy; if (x < 0 || y < 0 || x >= m.W || y >= m.H) continue; const e = y * m.W + x; m.own[e] = q; m.kind[e] = k; m.el[e] = el; m.cl[e] = cl; m.hid[e] = hid; m.bt[e] = bt; m.sw[e] = sw; m.sl[e] = sl; }
    const inR = new Set(mine), within = (x, y) => inR.has(Math.floor(y) * m.W + Math.floor(x));
    const mv = arr => (arr || []).map(a => a.slice());
    const out = Object.assign({}, F, { R: CV.rects(m), M: mv(F.M), ST: mv(F.ST), P: (F.P || []).map(p => Object.assign({}, p)), I: mv(F.I) });
    out.M.forEach(k => { if (within(k[1], k[2])) { k[1] += dx; k[2] += dy; } });
    out.ST.forEach(s => { if (within(s[1] + s[3] / 2, s[2] + s[4] / 2)) { s[1] += dx; s[2] += dy; } });
    out.P.forEach(p => { if (within(p.x, p.y)) { p.x += dx; p.y += dy; } });
    out.I.forEach(i => { if (within(i[1] + (i[3] || 1) / 2, i[2] + (i[4] || 1) / 2)) { i[1] += dx; i[2] += dy; } });
    return out;
  };
  // a room grown or shrunk by a square all round (never into another room)
  CV.growRoom = (F, rid, by) => {
    const m = CV.cells(F), q = m.ix[rid]; if (q == null) return F; const W = m.W, H = m.H;
    const mine = []; for (let c = 0; c < W * H; c++) if (m.own[c] === q) mine.push(c);
    const k0 = mine.length ? m.kind[mine[0]] : "cave", el0 = mine.length ? m.el[mine[0]] : 0, hid0 = mine.length ? m.hid[mine[0]] : 0;
    if (by > 0) { const add = new Set(); for (const c of mine) { const x = c % W; for (const e of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) if (e >= 0 && e < W * H && m.own[e] < 0) { const ex = e % W, ey = (e - ex) / W; if (ex > 0 && ey > 0 && ex < W - 1 && ey < H - 1) add.add(e); } } for (const e of add) { m.own[e] = q; m.kind[e] = k0; m.el[e] = el0; m.hid[e] = hid0; } }
    else { const del = mine.filter(c => { const x = c % W; return [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W].some(e => e < 0 || e >= W * H || m.own[e] < 0); }); if (del.length < mine.length - 2) for (const c of del) { m.own[c] = -1; m.kind[c] = null; } }
    return Object.assign({}, F, { R: CV.rects(m) });
  };
  // a room drawn again in a new shape, about the same size, keeping every way into it, every stair and every marker
  // in it, and the furnishings the game master put there (only the generated ones are placed afresh)
  CV.regenRoom = (F, rid, seed, opt) => {
    opt = opt || {}; const m = CV.cells(F), q = m.ix[rid]; if (q == null) return { F, ok: false };
    const W = m.W, H = m.H, R = rng("regen:" + rid + ":" + seed), mine = []; for (let c = 0; c < W * H; c++) if (m.own[c] === q) mine.push(c);
    if (!mine.length) return { F, ok: false };
    let sx = 0, sy = 0; for (const c of mine) { sx += c % W + .5; sy += Math.floor(c / W) + .5; } const cx = sx / mine.length, cy = sy / mine.length, r0 = Math.sqrt(mine.length / Math.PI);
    const must = new Set();
    for (const c of mine) { const x = c % W; if ([x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W].some(e => e >= 0 && e < W * H && m.own[e] >= 0 && m.own[e] !== q)) must.add(c); }
    for (const s of F.ST || []) for (let j = s[2]; j < s[2] + s[4]; j++) for (let i = s[1]; i < s[1] + s[3]; i++) { const c = j * W + i; if (m.own[c] === q) must.add(c); }
    for (const k of F.M || []) { const c = Math.floor(k[2]) * W + Math.floor(k[1]); if (m.own[c] === q) must.add(c); }
    for (const p of F.P || []) if (!p.g) { const c = Math.floor(p.y) * W + Math.floor(p.x); if (m.own[c] === q) must.add(c); }
    const kind0 = (() => { const n = {}; for (const c of mine) n[m.kind[c]] = (n[m.kind[c]] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1])[0][0]; })(), el0 = m.el[mine[0]], hid0 = m.hid[mine[0]];
    const keepKind = new Map(mine.map(c => [c, [m.kind[c], m.el[c], m.cl[c]]]));
    for (const c of mine) if (!must.has(c)) { m.own[c] = -1; m.kind[c] = null; }
    const g = { W, H, own: m.own, rooms: [], hid: m.hid, bt: m.bt, kind: m.kind, el: m.el, sw: m.sw };
    const ok = e => { const x = e % W, y = (e - x) / W; if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false; if (m.own[e] >= 0) return false; for (const f of [e - 1, e + 1, e - W, e + W]) if (m.own[f] >= 0 && m.own[f] !== q) return false; return true; };
    const shape = blob(g, R, cx, cy, r0 * R.range(.9, 1.1), null, { test: ok, stretch: R.range(.7, 1.4), rough: .32 });
    for (const c of shape) { m.own[c] = q; m.kind[c] = kind0; m.el[c] = el0; m.hid[c] = hid0; m.bt[c] = ""; }
    // every square that had to stay is joined to the new shape
    const inShape = () => { const s = new Set(); for (let c = 0; c < W * H; c++) if (m.own[c] === q) s.add(c); return s; };
    for (const c of must) { m.own[c] = q; const [k, el, cl] = keepKind.get(c); m.kind[c] = k; m.el[c] = el; m.cl[c] = cl; }
    for (const c of must) {
      const all = inShape(), seen = new Set([c]), qu = [c]; let hitShape = false;
      for (let h = 0; h < qu.length && !hitShape; h++) for (const e of [qu[h] - 1, qu[h] + 1, qu[h] - W, qu[h] + W]) if (all.has(e) && !seen.has(e)) { if (shape.includes(e)) { hitShape = true; break; } seen.add(e); qu.push(e); }
      if (hitShape || !shape.length) continue;
      let x = c % W, y = Math.floor(c / W); const tx = Math.floor(cx), ty = Math.floor(cy);
      for (let k = 0; k < W + H && !(x === tx && y === ty); k++) { if (x !== tx && (y === ty || R.chance(.5))) x += Math.sign(tx - x); else y += Math.sign(ty - y); const e = y * W + x; if (m.own[e] === q) { if (shape.includes(e)) break; continue; } if (m.own[e] >= 0) break; m.own[e] = q; m.kind[e] = kind0; m.el[e] = el0; m.hid[e] = hid0; }
    }
    const out = Object.assign({}, F, { R: CV.rects(m) });
    // the generated furnishings in it are placed afresh; the game master's stay
    const room = new Set(inShape());
    const P0 = (F.P || []).filter(p => !(p.g && mine.includes(Math.floor(p.y) * W + Math.floor(p.x))));
    const fresh = [], cells = [...room].filter(c => CV.pass(m.kind[c]) === "walk" && ![c - 1, c + 1, c - W, c + W].some(e => m.own[e] >= 0 && m.own[e] !== q));
    const geo = opt.props || ["stalagmites", "rocks", "flowstone", "stalactites"];
    for (let k = 0; k < clamp(Math.round(room.size / 16), 1, 6) && cells.length; k++) { const c = cells.splice(R.int(0, cells.length - 1), 1)[0], a = R.pick(geo); if (A.models && A.models.entry && !A.models.entry(a)) continue; fresh.push({ a, x: +(c % W + .5).toFixed(2), y: +(Math.floor(c / W) + .5).toFixed(2), r: R.int(0, 7) * 45, g: 1 }); }
    out.P = P0.concat(fresh);
    return { F: out, ok: true };
  };
  // the generated furnishings of a whole floor placed afresh, the game master's left as they are
  CV.redress = (F, seed, settings) => {
    const m = CV.cells(F), R = rng("redress:" + seed), s = Object.assign({}, CV.DEFAULTS, settings || {});
    const g = Object.assign(grid(m.W, m.H), { own: m.own, kind: m.kind, el: m.el, cl: m.cl, hid: m.hid, bt: m.bt, sw: m.sw, rooms: m.rooms.map((r, q) => ({ q, id: r.id, type: /^R\d/.test(r.id) ? "chamber" : "outside", feats: [], role: "" })), props: [] });
    for (const st of F.ST || []) for (let j = st[2]; j < st[2] + st[4]; j++) for (let i = st[1]; i < st[1] + st[3]; i++) g.keep[j * m.W + i] = 1;
    for (const p of F.P || []) if (!p.g) g.keep[Math.floor(p.y) * m.W + Math.floor(p.x)] = 1;
    decorate(g, s, R);
    return Object.assign({}, F, { P: (F.P || []).filter(p => !p.g).concat(g.props.filter(p => p.out).map(p => p.out)) });
  };
})(ATLAS);
