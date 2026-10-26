/* The 2D library: top-down drawings a game master puts on a flat map, in the map's own hand (ink lines, flat colour),
   as the 3D library (atlas-models.js) has models. The user asked (21 Oct 2026) for a far larger library "for BOTH the
   2D and 3D map editors", with nothing made twice. So the map's own furniture drawings (the 131 kinds the engine
   draws: beds, tables, pews, consoles...), which until now only the campaign's files and the rooms' presets could put
   down, are here first, each once; the new drawings follow in atlas-sprites-*.js.
   A drawing is an entry of the model library with d2 set: placed, moved, turned, sized, copied and taken away as a
   model is, found by the same search, and saved the same way (P on a floor, by its id). On the flat map it is drawn as
   it is; in the 3D view it stands as the library's model of the same thing where there is one (a bed as a bed, a long
   shelf as a row of shelves), and is otherwise laid flat on the floor as a drawing (blood, chalk, a rug), never passed
   off as a 3D model. Drawings are never stored as pictures: each is a few lines of code. */
(function (A) {
  "use strict";
  const M = A.models; if (!M) return;
  const S = A.sprites = A.sprites || {};
  const LIST = S.__list = S.__list || [];
  const INK = "#2b2219";
  const n2 = v => Math.round(v * 100) / 100;

  /* ---- the drawing kit: what the drawings are made of. Every drawing is drawn in a box u wide and v deep (in the
          map's units), its back (the wall it stands against) at the top, its front at the bottom. */
  const st = (w = 1, c = INK) => `stroke="${c}" stroke-width="${w}"`;
  const K = S.kit = {
    INK,
    rect: (x, y, w, h, f, rx, more) => `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(Math.max(0, w))}" height="${n2(Math.max(0, h))}"${rx ? ` rx="${n2(rx)}"` : ""} fill="${f}" ${st()}${more ? " " + more : ""}/>`,
    box: (x, y, w, h, f, rx) => `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(Math.max(0, w))}" height="${n2(Math.max(0, h))}"${rx ? ` rx="${n2(rx)}"` : ""} fill="${f}"/>`,
    circ: (x, y, r, f, more) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(Math.max(0, r))}" fill="${f}" ${st()}${more ? " " + more : ""}/>`,
    dot: (x, y, r, f) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(Math.max(0, r))}" fill="${f}"/>`,
    ell: (x, y, rx, ry, f, more) => `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(Math.max(0, rx))}" ry="${n2(Math.max(0, ry))}" fill="${f}" ${st()}${more ? " " + more : ""}/>`,
    line: (x1, y1, x2, y2, w = 1, c = INK, more) => `<line x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}" stroke="${c}" stroke-width="${w}"${more ? " " + more : ""}/>`,
    poly: (pts, f, more) => `<polygon points="${pts.map(p => n2(p[0]) + "," + n2(p[1])).join(" ")}" fill="${f}" ${st()}${more ? " " + more : ""}/>`,
    pline: (pts, w = 1, c = INK, more) => `<polyline points="${pts.map(p => n2(p[0]) + "," + n2(p[1])).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${more ? " " + more : ""}/>`,
    path: (d, f, w = 1, c = INK, more) => `<path d="${d}" fill="${f}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"${more ? " " + more : ""}/>`,
    text: (x, y, s, size, f = INK, more) => `<text x="${n2(x)}" y="${n2(y)}" font-family="sans-serif" font-size="${n2(size)}" font-weight="700" text-anchor="middle" fill="${f}"${more ? " " + more : ""}>${String(s).replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;")}</text>`,
    g: (tr, inner) => `<g transform="${tr}">${inner}</g>`,
    // a ring of n things around a centre (chairs round a table, stones round a fire)
    ring: (cx, cy, r, n, fn, a0 = 0) => { let s = ""; for (let i = 0; i < n; i++) { const a = a0 + i * Math.PI * 2 / n; s += fn(cx + Math.cos(a) * r, cy + Math.sin(a) * r, a * 180 / Math.PI + 90, i); } return s; },
    // a row of n things along x (books, bottles, crates)
    row: (x0, x1, n, fn) => { let s = ""; const w = (x1 - x0) / n; for (let i = 0; i < n; i++) s += fn(x0 + w * i, w, i); return s; },
    // boards running the long way, a grain of lines
    planks: (x, y, w, h, n, c = "rgba(43,34,25,.35)") => { let s = ""; if (w >= h) for (let i = 1; i < n; i++) s += `<line x1="${n2(x)}" y1="${n2(y + h * i / n)}" x2="${n2(x + w)}" y2="${n2(y + h * i / n)}" stroke="${c}" stroke-width=".6"/>`; else for (let i = 1; i < n; i++) s += `<line x1="${n2(x + w * i / n)}" y1="${n2(y)}" x2="${n2(x + w * i / n)}" y2="${n2(y + h)}" stroke="${c}" stroke-width=".6"/>`; return s; },
    // a seeded number for a drawing's small irregularities, the same each time
    rnd: seed => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; s = s || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; },
    // a colour lighter or darker
    tone: (hex, k) => { const n = parseInt(String(hex).replace("#", ""), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  };
  // the colours the drawings share, so that each set looks like one set
  S.C = { wood: "#8a6240", dark: "#5a3d28", light: "#b98d5c", linen: "#f3eee0", white: "#fffdf6", iron: "#3b3a38", steel: "#9aa1a6", stone: "#b9b2a3", dstone: "#7d776c", brass: "#c09a48", gold: "#d9b24a", red: "#8a2a2a", green: "#3a5a3a", blue: "#30476e", glass: "#cfe0e6", screen: "#8fd0d8", plastic: "#e6e4dc", black: "#262829", leaf: "#4f7a3a", water: "#6f9fb3", blood: "#6a0f0f", fire: "#f08a2a", glow: "#7df0ff", neon: "#ff4adc", bone: "#e2d8bf", rust: "#8a4b2a", sand: "#d9c08a", hull: "#c9ced3", olive: "#5a5e3a" };

  /* ---- adding drawings. Each row: [id, name, draw(u, v, colour), wide (m), deep (m), more]. more: { tags, twin: [model,
          how it fills its drawing] for its 3D standing, flat (it lies on the floor), mount, h (how high, m), col (a
          colour it may be given), e (indoors, outdoors, both) }. An id already in the library is not added again. */
  S.add = (cat, sub, genres, rows) => {
    for (const row of rows) {
      const [id, n, draw, w, d, more = {}] = row;
      if (M.get(id)) continue;
      M.add(cat, sub, genres, [[id, n, "sprite", { w, d, h: more.h || (more.flat ? .01 : .02), sid: id }, { k: ["new"], tags: more.tags || [], e: more.e || "in", mount: more.mount || "floor", g: more.g, src: more.src || "Campaign Atlas, drawn in code", lic: more.lic || "Part of Campaign Atlas (MIT)" }]]);
      const e = M.get(id); if (!e) continue;
      Object.assign(e, { d2: true, draw, twin: more.twin || null, flat: !!more.flat, code: more.code || null, glow: !!more.glow, colour: more.col || null, style: more.style || "drawn" });
      e.fams = []; e.mats = [];
      LIST.push(e);
    }
    return S;
  };
  S.all = () => LIST;
  S.get = id => { const e = M.get(id); return e && e.d2 ? e : null; };
  // a model's own drawing (atlas-sprites-caves.js): rows of [model id, draw(u, v, colour)]. The flat map draws it in the
  // model's box, the 3D view stands the model; the model stays one entry of the library.
  S.plan = rows => { for (const [id, draw] of rows) { const e = M.get(id); if (e && !e.d2) e.plan = draw; } return S; };
  // what the flat map draws for a library entry, when it is a drawing and not a picture of a model: the drawing itself,
  // or the model's own drawing
  S.flat = e => !e ? null : e.d2 ? e : e.plan ? { draw: e.plan, colour: null } : null;
  // a drawing, drawn: its box u by v, in a placed model's colour
  S.draw = (e, sp, u, v) => { try { const s = e.draw(u, v, (sp && sp.col) || e.colour || undefined) || ""; return A.tidy ? A.tidy(s) : s; } catch (x) { return K.rect(1, 1, u - 2, v - 2, "none", 0, `stroke-dasharray="3 2"`); } };
  // the drawing as a picture of its own, for the library's cards and the 3D view's flat drawings
  S.svg = (e, sp, o) => {
    o = o || {};
    const C = A.C || 24, sq = M.sq(), [w, d] = M.dims(e, sp), u = Math.max(4, w / sq * C), v = Math.max(4, d / sq * C), pad = o.pad == null ? Math.max(u, v) * .12 + 4 : o.pad;
    const k = o.px ? o.px / (Math.max(u, v) + pad * 2) : 1;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(-pad)} ${n2(-pad)} ${n2(u + pad * 2)} ${n2(v + pad * 2)}" width="${n2((u + pad * 2) * k)}" height="${n2((v + pad * 2) * k)}">${S.draw(e, sp, u, v)}</svg>`;
  };
  S.url = (e, sp, o) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(S.svg(e, sp, o));
  // how high the 3D view stands it (for a marker standing on it): the tallest model it is raised as, or nothing
  S.height = (e, sp) => { const tw = S.twins(e, sp); return tw.length ? Math.max(...tw.map(t => M.dims(M.entry(t.a), t)[2] * (t.s || 1))) : 0; };
  // the models the 3D view stands for a drawing, in its own frame (metres, centred, its back to -z)
  S.twins = (e, sp) => {
    const R3 = A.room3d; if (!R3) return [];
    const sq = M.sq(), [w, d] = M.dims(e, sp), u = w / sq, v = d / sq, item = [e.code || e.id, -u / 2, -v / 2, u, v, 0, 0, sp && sp.col];
    const rr = e.code ? R3.raiseOf(e.code) : e.twin && M.entry(e.twin[0]) ? { id: e.twin[0], mode: e.twin[1] || "fit" } : null;
    return rr ? R3.raiseAs(rr, item, null) || [] : [];
  };

  /* ---- in 3D: the library's models of the same thing, or the drawing laid on the floor */
  const TEX = new Map();
  M.gen("sprite", (b, p) => {
    const e = M.get(p.sid); if (!e) return;
    const T = b.T, sq = M.sq(), sp = { a: e.id, p: { w: p.w, d: p.d }, col: p.col };
    if (!e.flat) {
      const tw = S.twins(e, sp);
      if (tw.length) { const grp = b.part(() => {}); for (const t of tw) { const o = M.build(T, t); if (!o) continue; o.scale.setScalar(t.s || 1); o.position.set(t.x * sq, 0, t.y * sq); o.rotation.y = -(t.r || 0) * Math.PI / 180; grp.add(o); } return; }
    }
    if (typeof document === "undefined") return;
    const key = e.id + "|" + (p.col || "") + "|" + n2(p.w) + "x" + n2(p.d);
    let tex = TEX.get(key);
    if (!tex) {
      const cv = document.createElement("canvas"), ar = p.d / p.w; cv.width = ar > 1 ? Math.max(16, Math.round(256 / ar)) : 256; cv.height = ar > 1 ? 256 : Math.max(16, Math.round(256 * ar));
      tex = new T.CanvasTexture(cv); tex.anisotropy = 4; TEX.set(key, tex);
      const img = new Image(); img.onload = () => { cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); tex.needsUpdate = true; document.dispatchEvent(new CustomEvent("atlas-sprite-drawn")); };
      img.src = S.url(e, sp, { pad: 0 });
    }
    const mat = new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: .9, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const me = b.mesh(new T.PlaneGeometry(p.w, p.d), mat, 0, .006, 0, -Math.PI / 2, 0, 0); me.castShadow = false;
  });
  // the library's cards: a drawing's picture is the drawing itself, at once
  const thumb3d = M.thumb;
  M.thumb = async spec => { const e = M.entry(spec.a); if (e && e.d2) return S.url(e, spec, { px: 128 }); return thumb3d(spec); };
  // what the 3D view stands for a drawing, as a picture (the model gallery shows both)
  S.thumb3d = spec => thumb3d(spec);

  /* ================================================================ the map's own furniture, each once */
  const F = "fantasy", MD = "medieval", HI = "historical", MO = "modern", MI = "military", HO = "horror", PA = "postapoc", CY = "cyberpunk", SF = "scifi", FU = "futuristic";
  const OLD = [F, MD, HI, HO], NOW = [MO, HO, PA], FUT = [SF, FU, CY], ALL = [F, MD, HI, MO, MI, HO, PA, CY, SF, FU];
  // [code, name, category, kind, genres, wide (m), deep (m), more]
  const DRAWN = [
    ["bed", "Bed", "Furniture & interiors", "Beds", ALL, 1, 2], ["dbed", "Double bed", "Furniture & interiors", "Beds", ALL, 1.5, 2.1], ["cot", "Cot", "Furniture & interiors", "Beds", ALL, .8, 1.9], ["bunk", "Bunk beds", "Furniture & interiors", "Beds", ALL, 1, 2],
    ["cradle", "Cradle", "Furniture & interiors", "Beds", OLD, .6, 1],
    ["ward", "Wardrobe", "Furniture & interiors", "Cupboards & storage", ALL, 1.2, .6], ["dresser", "Dresser", "Furniture & interiors", "Cupboards & storage", ALL, 1, .5], ["drawers", "Chest of drawers", "Furniture & interiors", "Cupboards & storage", ALL, 1, .5], ["cabinet", "Cabinet", "Furniture & interiors", "Cupboards & storage", ALL, 1, .5], ["book", "Bookcase", "Furniture & interiors", "Shelves & books", ALL, 1.4, .35], ["shelf", "Shelves", "Furniture & interiors", "Shelves & books", ALL, 1.2, .45], ["files", "Filing cabinets", "Furniture & interiors", "Office", [HI, MO, MI, HO, PA], 1.4, .6], ["jars", "Shelf of jars", "Furniture & interiors", "Shelves & books", OLD, 1.2, .4],
    ["tbl", "Table", "Furniture & interiors", "Tables", ALL, 1.5, .9], ["dine", "Dining table", "Furniture & interiors", "Tables", ALL, 2.2, 1], ["rtbl", "Round table", "Furniture & interiors", "Tables", ALL, 1.2, 1.2], ["clothtbl", "Table with a cloth", "Furniture & interiors", "Tables", OLD, 1.8, 1],
    ["chair", "Chair", "Furniture & interiors", "Seating", ALL, .5, .5], ["arm", "Armchair", "Furniture & interiors", "Seating", ALL, .9, .9], ["sofa", "Sofa", "Furniture & interiors", "Seating", ALL, 2, .9], ["bench", "Bench", "Furniture & interiors", "Seating", ALL, 1.8, .45], ["stool", "Stool", "Furniture & interiors", "Seating", ALL, .4, .4], ["throne", "Throne", "Furniture & interiors", "Seating", [F, MD], 1, .9], ["seats", "Rows of seats", "Furniture & interiors", "Seating", [HI, MO, HO], 3, 2.4],
    ["desk", "Desk", "Furniture & interiors", "Office", ALL, 1.5, .75], ["work", "Workbench", "Furniture & interiors", "Workshop", ALL, 1.8, .8], ["block", "Chopping block", "Furniture & interiors", "Kitchen", OLD, .6, .6], ["counter", "Counter", "Furniture & interiors", "Kitchen", ALL, 1.8, .65], ["till", "Till", "Furniture & interiors", "Shop", [HI, MO], .4, .4], ["disp", "Display case", "Furniture & interiors", "Shop", ALL, 1.4, .6],
    ["fp", "Fireplace", "Furniture & interiors", "Hearth & stove", OLD.concat(MO), 1.6, .6, { glow: true }], ["range", "Kitchen range", "Furniture & interiors", "Kitchen", [HI, HO], 1.2, .6], ["stove", "Stove", "Furniture & interiors", "Hearth & stove", ALL, .6, .6], ["copper", "Laundry copper", "Furniture & interiors", "Laundry & bath", [HI, HO], .8, .8], ["mangle", "Mangle", "Furniture & interiors", "Laundry & bath", [HI, HO], .9, .6], ["tub", "Washtub", "Furniture & interiors", "Laundry & bath", OLD, .8, .8], ["washing", "Washing line", "Furniture & interiors", "Laundry & bath", [HI, MO, PA], 3, .4, { e: "both" }],
    ["sink", "Sink", "Furniture & interiors", "Kitchen", ALL, .9, .55], ["bath", "Bath", "Furniture & interiors", "Laundry & bath", ALL, .8, 1.7], ["wash", "Washstand", "Furniture & interiors", "Laundry & bath", OLD, .8, .45], ["privy", "Privy", "Furniture & interiors", "Laundry & bath", ALL, .7, .9],
    ["piano", "Piano", "Furniture & interiors", "Music & leisure", [HI, MO, HO], 1.5, .65], ["organ", "Organ", "Furniture & interiors", "Music & leisure", OLD, 2.2, 1], ["clock", "Clock", "Furniture & interiors", "Decoration", ALL, .5, .3], ["rug", "Rug", "Furniture & interiors", "Rugs & curtains", ALL, 2.4, 1.7, { flat: false }], ["curtain", "Curtain", "Furniture & interiors", "Rugs & curtains", ALL, 2, .25], ["mirror", "Mirror", "Furniture & interiors", "Decoration", ALL, .8, .1], ["pic", "Picture on the wall", "Furniture & interiors", "Decoration", ALL, .8, .1], ["plant", "Potted plant", "Furniture & interiors", "Decoration", ALL, .5, .5], ["lamp", "Lamp", "Furniture & interiors", "Lights", ALL, .5, .5, { glow: true }], ["candle", "Candles", "Furniture & interiors", "Lights", OLD, .4, .4, { glow: true }],
    ["sm", "Sewing machine", "Furniture & interiors", "Workshop", [HI, MO, HO], .9, .5], ["dress", "Dressmaker's dummy", "Furniture & interiors", "Workshop", [HI, MO, HO], .6, .6], ["hooks", "Row of hooks", "Furniture & interiors", "Kitchen", OLD, 1.4, .3], ["safe", "Safe", "Furniture & interiors", "Office", [HI, MO, MI, HO, PA, CY], .7, .7],
    ["chest", "Chest", "Containers & small props", "Chests & boxes", ALL, .9, .55], ["barrel", "Barrel", "Containers & small props", "Barrels & casks", ALL, .7, .7], ["crate", "Crate", "Containers & small props", "Crates", ALL, .9, .9], ["sack", "Sack", "Containers & small props", "Sacks & bags", ALL, .6, .45], ["box", "Box", "Containers & small props", "Chests & boxes", ALL, .6, .6, { col: "#9a9488" }], ["disc", "Round thing", "Containers & small props", "Chests & boxes", ALL, .6, .6, { col: "#9a9488" }], ["bin", "Bin", "Containers & small props", "Rubbish", [MO, PA, CY, HO], .6, .6], ["heap", "Heap", "Containers & small props", "Heaps & piles", ALL, 1.4, 1, { col: "#8a7a62", flat: false }], ["salt", "Pile of salt", "Containers & small props", "Heaps & piles", OLD, 1, .8], ["coal", "Heap of coal", "Containers & small props", "Heaps & piles", [HI, MO, HO, PA], 1.4, 1], ["papers", "Scattered papers", "Containers & small props", "Books & papers", ALL, 1, .8, { flat: true }],
    ["pew", "Pew", "Medieval & fantasy", "Church & shrine", OLD, 2.4, .6], ["altar", "Altar", "Medieval & fantasy", "Church & shrine", OLD, 1.6, .8], ["font", "Font", "Medieval & fantasy", "Church & shrine", OLD, .9, .9], ["pulpit", "Pulpit", "Medieval & fantasy", "Church & shrine", OLD, 1.2, 1], ["lectern", "Lectern", "Medieval & fantasy", "Church & shrine", OLD, .6, .5], ["bell", "Bell", "Medieval & fantasy", "Church & shrine", OLD, .9, .9], ["brazier", "Brazier", "Medieval & fantasy", "Fire & light", OLD, .6, .6, { glow: true }], ["crystal", "Crystal", "Medieval & fantasy", "Magic", [F, SF, HO], 1, 1], ["portal", "Portal", "Medieval & fantasy", "Magic", [F, SF, HO], 2, 1.2, { flat: true }], ["statue", "Statue", "Medieval & fantasy", "Statues", OLD, .9, .9], ["plinth", "Plinth", "Medieval & fantasy", "Statues", OLD, .8, .8],
    ["body", "Body", "Horror", "The dead", ALL, .7, 1.8, { flat: true }], ["blood", "Blood", "Horror", "Stains & marks", ALL, 1, 1, { flat: true }], ["foot", "Footprints", "Horror", "Stains & marks", ALL, .6, 1.8, { flat: true }], ["sigil", "Sigil", "Horror", "Ritual", [F, HO], 1.4, 1.4, { flat: true }], ["chalk", "Chalk circle", "Horror", "Ritual", [F, HO, MO], 1.8, 1.8, { flat: true }], ["coffin", "Coffin", "Horror", "The dead", OLD, .7, 2], ["slab", "Slab", "Horror", "The dead", ALL, .9, 2.1], ["cage", "Cage", "Horror", "Captivity", ALL, 1.5, 1.5], ["grave", "Grave", "Horror", "Graveyard", OLD, .7, 1.9, { e: "out" }], ["cross", "Cross", "Horror", "Graveyard", OLD, .5, .2, { e: "out" }], ["fig", "A figure", "Horror", "The dead", ALL, .7, .6, { col: "#5a3a3a" }], ["puddle", "Puddle", "Nature", "Water & ground", ALL, 1.2, .9, { flat: true, e: "both" }],
    ["column", "Column", "Architecture", "Columns & arches", ALL, .7, .7], ["rail", "Railing", "Architecture", "Fences & rails", ALL, 3, .2], ["fence", "Fence", "Architecture", "Fences & rails", ALL, 3, .2, { e: "out" }], ["niche", "Niches in a wall", "Architecture", "Walls", OLD, 1.5, .4], ["hatch", "Hatch", "Architecture", "Floors & platforms", ALL, .9, .9, { flat: true }], ["ladder", "Ladder", "Architecture", "Stairs & ladders", ALL, .6, .3], ["grate", "Grate", "Architecture", "Floors & platforms", ALL, .7, .7], ["pipe", "Pipe", "Industrial", "Pipes & tanks", ALL, 3, .3], ["pipes", "Pipes on a wall", "Industrial", "Pipes & tanks", [HI, MO, HO, PA, SF, CY], 1.8, .3], ["bars", "Bars", "Architecture", "Walls", ALL, 2, .15], ["vault", "Vault door", "Architecture", "Doors", [HI, MO, CY, SF], 1.6, 1.6], ["stage", "Stage", "Architecture", "Floors & platforms", ALL, 4, 2.5], ["ring", "Boxing ring", "Architecture", "Floors & platforms", [HI, MO], 4, 4], ["sign", "Sign", "Architecture", "Signs", ALL, 1.2, .2], ["lampost", "Lamp-post", "Architecture", "Street", [HI, MO, HO], .5, .5, { e: "out", glow: true }],
    ["tree", "Tree", "Nature", "Trees", ALL, 3, 3, { e: "out" }], ["bush", "Bush", "Nature", "Plants", ALL, 1.2, 1.2, { e: "out" }], ["boulder", "Boulder", "Nature", "Rocks & crystals", ALL, 1.4, 1.2, { e: "out" }], ["roots", "Roots", "Nature", "Plants", ALL, 1.5, 1, { flat: true, e: "both" }], ["rubble", "Rubble", "Nature", "Water & ground", ALL, 2, 2, { e: "both" }], ["well", "Well", "Nature", "Water & ground", OLD, 1.4, 1.4, { e: "out" }], ["trough", "Trough", "Nature", "Farm", OLD, 1.6, .5, { e: "both" }], ["campfire", "Campfire", "Nature", "Camp", ALL, 1, 1, { e: "out", glow: true }], ["tent", "Tent", "Nature", "Camp", ALL, 2.2, 2.4, { e: "out" }], ["stall", "Market stall", "Modern", "Shop", ALL, 2, 1.2, { e: "both" }],
    ["furnace", "Furnace", "Industrial", "Machines", [HI, MO, HO, PA], 1.5, 1.2], ["generator", "Generator", "Industrial", "Machines", [MO, MI, PA, SF, CY], 1.8, 1], ["tank", "Tank", "Industrial", "Pipes & tanks", [MO, PA, SF, CY, HO], 1.2, 1.2], ["lathe", "Lathe", "Industrial", "Machines", [HI, MO, PA], 2, .8], ["rack", "Rack", "Military", "Armoury", ALL, 1.4, .35], ["locker", "Lockers", "Modern", "Office", [MO, MI, PA, SF, CY], 1.2, .5],
    ["console", "Console", "Sci-fi & space", "Consoles & computers", [MO, SF, CY, FU], 1.8, .8], ["screen", "Wall screen", "Sci-fi & space", "Consoles & computers", [MO, SF, CY, FU], 1.6, .15], ["pod", "Pod", "Sci-fi & space", "Medical & science", [SF, FU, CY], 1.1, 2.2],
    ["cart", "Cart", "Vehicles", "Carts & wagons", OLD.concat(PA), 1.4, 2.6, { e: "both" }], ["boat", "Boat", "Vehicles", "Boats", ALL, 1.4, 4, { e: "out" }], ["vehicle", "Vehicle", "Vehicles", "Cars & trucks", [MO, MI, PA, CY], 1.8, 4.4, { e: "both", col: "#5a6a78" }]
  ];
  const groups = {};
  for (const [code, n, cat, sub, g, w, d, more = {}] of DRAWN) {
    if (!A.ITEMS || !A.ITEMS[code]) continue;
    const key = cat + "|" + sub; (groups[key] = groups[key] || []).push(["d-" + code, n, (u, v, col) => A.ITEMS[code](u, v, col), w, d, Object.assign({ code, g, tags: ["drawn", "map furniture", code] }, more)]);
  }
  for (const [key, rows] of Object.entries(groups)) { const [cat, sub] = key.split("|"); S.add(cat, sub, ALL, rows); }
  // any drawing the engine has that the list above does not name is added too, so none is ever missing
  for (const code of Object.keys(A.ITEMS || {})) if (!M.get("d-" + code)) S.add("Containers & small props", "Other drawings", ALL, [["d-" + code, code[0].toUpperCase() + code.slice(1), (u, v, col) => A.ITEMS[code](u, v, col), .9, .9, { code, tags: ["drawn", code] }]]);
  S.GENRES = { F, MD, HI, MO, MI, HO, PA, CY, SF, FU, OLD, NOW, FUT, ALL };
})(ATLAS);
