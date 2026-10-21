/* The model library: 3D models a game master places on a place's map (the user asked, 21 Oct 2026, for "a massive
   multi-genre 3D asset library" in the map editor: furniture, props and architecture for fantasy, medieval, sci-fi,
   cyberpunk, modern, military, horror, post-apocalyptic and historical settings, each previewable and placeable).
   This file is the core: the catalogue (metadata only, so the checker and the build can read it without a 3D engine),
   the materials and their surface textures, the conditions (new to ruined), the builder the models are made with,
   the top-down pictures the flat map shows, the thumbnails and the rotating preview the browser shows, and the room in
   3D. The models themselves are in atlas-models-lib.js; the browser and placing them in atlas-modelui.js.
   Geometry is never stored: a placed model is saved as its id, where it stands, its turn and size, and its options. */
(function (A) {
  "use strict";
  const M = A.models = A.models || {};
  const ENTRIES = [], BYID = {}, GENS = {}, KITS = [];

  /* ---- what the catalogue knows */
  M.GENRES = [["fantasy", "Fantasy"], ["medieval", "Medieval"], ["historical", "Historical"], ["modern", "Modern"], ["military", "Military"], ["horror", "Horror"], ["postapoc", "Post-apocalyptic"], ["cyberpunk", "Cyberpunk"], ["scifi", "Sci-fi"], ["futuristic", "Futuristic"]];
  M.CONDS = [["new", "New"], ["used", "Used"], ["dirty", "Dirty"], ["worn", "Worn"], ["damaged", "Damaged"], ["rusty", "Rusty"], ["ruined", "Ruined"], ["burned", "Burned"]];
  M.FAMILIES = [["wood", "Wood"], ["stone", "Stone"], ["metal", "Metal"], ["plastic", "Plastic"], ["glass", "Glass"], ["fabric", "Fabric"], ["leather", "Leather"], ["paper", "Paper"], ["ceramic", "Ceramic"], ["organic", "Organic"], ["glow", "Light"]];
  // the materials: family, colour, roughness, metalness, surface texture, glow, see-through
  const MATS = M.MATS = {
    oak: ["wood", 0x8a6438, .78, 0, "wood"], pine: ["wood", 0xc29a62, .8, 0, "wood"], walnut: ["wood", 0x5b3b22, .7, 0, "wood"], mahogany: ["wood", 0x6e2f1f, .6, 0, "wood"], ebony: ["wood", 0x2e2420, .55, 0, "wood"], birch: ["wood", 0xd8c3a0, .75, 0, "wood"], driftwood: ["wood", 0x8d877c, .9, 0, "wood"], plank: ["wood", 0x9c7650, .85, 0, "wood"], cherry: ["wood", 0x8e4a2c, .55, 0, "wood"], bamboo: ["wood", 0xc8b46c, .6, 0, "wood"],
    granite: ["stone", 0x8a8783, .9, 0, "stone"], limestone: ["stone", 0xc9bfa8, .92, 0, "stone"], marble: ["stone", 0xe9e6df, .35, 0, "marble"], slate: ["stone", 0x4f555a, .8, 0, "stone"], sandstone: ["stone", 0xc8a272, .95, 0, "stone"], obsidian: ["stone", 0x1d1b22, .2, .1, "stone"], concrete: ["stone", 0x9b9b95, .95, 0, "concrete"], brick: ["stone", 0x9a5240, .9, 0, "brick"], darkstone: ["stone", 0x55524e, .9, 0, "stone"], mossstone: ["stone", 0x6f7660, .95, 0, "stone"],
    iron: ["metal", 0x3e3d3b, .6, .7, "metal"], steel: ["metal", 0x9aa1a6, .38, .85, "metal"], brass: ["metal", 0xc09a48, .35, .75, "metal"], bronze: ["metal", 0x9c7040, .45, .75, "metal"], copper: ["metal", 0xc0703e, .4, .75, "metal"], gold: ["metal", 0xe8c050, .3, .7, "metal"], silver: ["metal", 0xc9cdd1, .25, 1, "metal"], chrome: ["metal", 0xdfe4e8, .12, 1, "metal"], gunmetal: ["metal", 0x4a5058, .45, .8, "metal"], rust: ["metal", 0x8a4b2a, .95, .3, "rust"], aluminium: ["metal", 0xbfc5c9, .45, .8, "metal"], olive: ["metal", 0x5b6239, .7, .4, "metal"], hullwhite: ["metal", 0xd6dade, .5, .5, "metal"], hullgrey: ["metal", 0x6b737b, .55, .6, "metal"], blackmetal: ["metal", 0x23262a, .5, .7, "metal"],
    pwhite: ["plastic", 0xeeeeea, .5, 0, ""], pgrey: ["plastic", 0x8a8f94, .55, 0, ""], pblack: ["plastic", 0x262829, .5, 0, ""], pred: ["plastic", 0xc23b2e, .45, 0, ""], pblue: ["plastic", 0x2f69b3, .45, 0, ""], pyellow: ["plastic", 0xe8b726, .45, 0, ""], pgreen: ["plastic", 0x3c8a4c, .45, 0, ""], porange: ["plastic", 0xe36a1f, .45, 0, ""], pteal: ["plastic", 0x2a9a95, .45, 0, ""], ppink: ["plastic", 0xd85a8c, .45, 0, ""], rubber: ["plastic", 0x1f1f1f, .95, 0, ""],
    glass: ["glass", 0xcfe6ee, .05, 0, "", 0, .35], glassgreen: ["glass", 0x4f8a52, .05, 0, "", 0, .6], glassamber: ["glass", 0xa8641c, .05, 0, "", 0, .6], glassblue: ["glass", 0x3d6fa8, .05, 0, "", 0, .6], frosted: ["glass", 0xe6eef0, .4, 0, "", 0, .55], glasspurple: ["glass", 0x7b4aa8, .05, 0, "", 0, .6],
    red: ["fabric", 0x8a2a2a, .95, 0, "fabric"], green: ["fabric", 0x3a5a3a, .95, 0, "fabric"], blue: ["fabric", 0x30476e, .95, 0, "fabric"], grey: ["fabric", 0x6c6c6a, .95, 0, "fabric"], brown: ["fabric", 0x6b4e33, .95, 0, "fabric"], purple: ["fabric", 0x5a2e6a, .9, 0, "fabric"], cream: ["fabric", 0xe3d8c0, .95, 0, "fabric"], linen: ["fabric", 0xd9d1bd, .95, 0, "fabric"], burlap: ["fabric", 0xa88a5c, 1, 0, "burlap"], canvas: ["fabric", 0xb3a986, .95, 0, "fabric"], camo: ["fabric", 0x5a6040, .95, 0, "camo"], black: ["fabric", 0x232323, .95, 0, "fabric"], teal: ["fabric", 0x2f6f6c, .95, 0, "fabric"], mustard: ["fabric", 0xb8902e, .95, 0, "fabric"], white: ["fabric", 0xf0eee8, .95, 0, "fabric"], orangecloth: ["fabric", 0xc4622d, .95, 0, "fabric"],
    leather: ["leather", 0x5e3b22, .6, 0, "leather"], leatherblack: ["leather", 0x1f1b19, .55, 0, "leather"], leatherred: ["leather", 0x6e2420, .6, 0, "leather"], vinyl: ["leather", 0x2a3540, .4, 0, ""],
    paper: ["paper", 0xeee6d2, .95, 0, "paper"], parchment: ["paper", 0xd9c39a, .95, 0, "paper"], cardboard: ["paper", 0xa8835a, .95, 0, "paper"], bookred: ["paper", 0x7a2424, .8, 0, ""], bookgreen: ["paper", 0x2f4a32, .8, 0, ""], bookblue: ["paper", 0x2a3a5c, .8, 0, ""], bookbrown: ["paper", 0x5a3d22, .8, 0, ""],
    porcelain: ["ceramic", 0xf2f0ea, .25, 0, ""], terracotta: ["ceramic", 0xb35c3a, .85, 0, ""], ceramicblue: ["ceramic", 0x3e5f8c, .3, 0, ""], tile: ["ceramic", 0xe8e8e2, .3, 0, "tiles"], wax: ["ceramic", 0xefe6cf, .6, 0, ""],
    bone: ["organic", 0xe2d8bf, .7, 0, ""], flesh: ["organic", 0xb06a5c, .6, 0, ""], slime: ["organic", 0x6f8a2c, .25, 0, "", 0x223300], alien: ["organic", 0x5a3a6e, .4, 0, "", 0x200a30], moss: ["organic", 0x4f6b2c, 1, 0, "fabric"], leaf: ["organic", 0x3f6b2f, .9, 0, ""], leafdark: ["organic", 0x2a4a26, .9, 0, ""], leafautumn: ["organic", 0xa8582a, .9, 0, ""], bark: ["organic", 0x4e3a28, 1, 0, "bark"], mushroom: ["organic", 0xb33a2a, .6, 0, ""], straw: ["organic", 0xd2b46a, 1, 0, "burlap"], bread: ["organic", 0xc58a44, .8, 0, ""], fruitred: ["organic", 0xb52a2a, .4, 0, ""], fruitgreen: ["organic", 0x7aa83a, .4, 0, ""], fruityellow: ["organic", 0xe2c23a, .4, 0, ""], meat: ["organic", 0x8a3a30, .6, 0, ""], cheese: ["organic", 0xe2b84a, .7, 0, ""], dirt: ["organic", 0x6a5038, 1, 0, "stone"], sand: ["organic", 0xd8c08a, 1, 0, "stone"], snow: ["organic", 0xf2f5f7, .8, 0, ""], water: ["glass", 0x3a6a7a, .05, 0, "", 0, .7], ice: ["glass", 0xcfe8f2, .1, 0, "", 0, .75], tarmac: ["stone", 0x3c3d3f, .95, 0, "concrete"],
    glowcyan: ["glow", 0x6ff0ff, .3, 0, "", 0x34d8ef], glowmagenta: ["glow", 0xff5adc, .3, 0, "", 0xe03ac0], glowgreen: ["glow", 0x7dff8a, .3, 0, "", 0x3ad84c], glowred: ["glow", 0xff5a4a, .3, 0, "", 0xe0302a], glowamber: ["glow", 0xffbf5a, .3, 0, "", 0xe8901c], glowwhite: ["glow", 0xfffbe8, .3, 0, "", 0xf2e8c8], glowviolet: ["glow", 0xb98aff, .3, 0, "", 0x7a4ae0], fire: ["glow", 0xffa040, .5, 0, "", 0xff6a10], screen: ["glow", 0x6fd8ff, .2, 0, "screen", 0x1f6a8a], screengreen: ["glow", 0x7dff9a, .2, 0, "screen", 0x1a6a2a], screenred: ["glow", 0xff7a6a, .2, 0, "screen", 0x7a1a12], screenoff: ["glass", 0x1a1d22, .15, .2, ""],
    ruby: ["glass", 0xc2183a, .1, 0, "", 0x400010, .85], emerald: ["glass", 0x1aa85a, .1, 0, "", 0x003a14, .85], sapphire: ["glass", 0x2050c8, .1, 0, "", 0x061a40, .85], amethyst: ["glass", 0x9a4ad8, .1, 0, "", 0x2a0a4a, .85], crystal: ["glass", 0x7fc8e0, .05, 0, "", 0x0e3446, .75]
  };
  const famOf = k => (MATS[k] || [])[0] || "";
  M.famOf = famOf;
  // which other materials a slot may take, by family
  M.alts = k => { const f = famOf(k); return Object.keys(MATS).filter(x => MATS[x][0] === f && !/^(screen|glow|fire|book)/.test(x) || x === k); };

  /* ---- the catalogue */
  // a generator: builds a model from its options. ctl lists the options the game master may change besides its size:
  // [option, label, least, most, step]
  M.gen = (name, fn, ctl) => { GENS[name] = fn; fn.ctl = ctl || []; return M; };
  M.ctl = e => (e && GENS[e.f] && GENS[e.f].ctl) || [];
  M.add = (cat, sub, genres, list) => {
    for (const row of list) {
      const [id, n, f, p = {}, t = {}] = row;
      if (BYID[id]) continue;
      const e = { id, n, c: cat, s: sub, f, p, g: t.g || genres, k: t.k || ["new", "used", "dirty", "worn", "damaged", "ruined", "burned"], e: t.e || "in", mount: t.mount || "floor", tags: t.tags || [], src: t.src || "Campaign Atlas, built in code", lic: t.lic || "CC0 (free to use)" };
      e.mats = Object.values(p.m || {}); e.fams = [...new Set(e.mats.map(famOf).filter(Boolean))];
      if (e.fams.includes("metal") && !e.k.includes("rusty")) e.k = e.k.concat("rusty");
      ENTRIES.push(e); BYID[id] = e;
    }
    return M;
  };
  M.kit = def => { KITS.push(def); return M; };
  M.get = id => BYID[id] || null;
  M.all = () => ENTRIES;
  M.kits = () => KITS;
  M.cats = () => { const out = {}; for (const e of ENTRIES) (out[e.c] = out[e.c] || new Set()).add(e.s); return Object.entries(out).map(([c, s]) => [c, [...s]]); };
  // the size of a model, in metres: width (x), depth (z), height (y)
  M.dims = (e, sp) => { const p = Object.assign({}, (e && e.p) || {}, (sp && sp.p) || {}); return [p.w || 1, p.d || 1, p.h || 1]; };
  // one square of the map, in metres
  M.sq = () => { const g = (A.config && A.config.grid) || { unit: 5, name: "ft" }, n = String(g.name || "ft").toLowerCase(), u = +g.unit || 5; return /^m/.test(n) ? u : /^(yd|yard)/.test(n) ? u * .9144 : /^(in|inch)/.test(n) ? u * .0254 : u * .3048; };
  // what the search understands: words for families, conditions and genres
  const SYN = { wooden: "wood", timber: "wood", stone: "stone", metal: "metal", metallic: "metal", iron: "metal", steel: "metal", plastic: "plastic", glass: "glass", fabric: "fabric", cloth: "fabric", leather: "leather", paper: "paper", organic: "organic", glowing: "glow", lit: "glow", neon: "glow", scifi: "scifi", "sci-fi": "scifi", space: "scifi", futuristic: "futuristic", cyber: "cyberpunk", cyberpunk: "cyberpunk", medieval: "medieval", fantasy: "fantasy", modern: "modern", military: "military", army: "military", horror: "horror", creepy: "horror", apocalyptic: "postapoc", "post-apocalyptic": "postapoc", wasteland: "postapoc", historical: "historical", victorian: "historical", old: "worn", broken: "damaged", damaged: "damaged", rusty: "rusty", rusted: "rusty", dirty: "dirty", worn: "worn", ruined: "ruined", burned: "burned", burnt: "burned", new: "new", used: "used" };
  const words = s => String(s || "").toLowerCase().replace(/sci-fi/g, "scifi").match(/[a-z0-9]+/g) || [];
  // the catalogue searched and filtered: returns entries with the condition the query asks for (a search for "damaged
  // barrel" shows the barrels as damaged)
  M.find = (q, f) => {
    f = f || {};
    const qs = words(q), want = { fam: [], cond: null, genre: [] }, rest = [];
    for (const w of qs) { const s = SYN[w] || SYN[w.replace(/s$/, "")]; if (s && M.FAMILIES.some(x => x[0] === s)) want.fam.push(s); else if (s && M.CONDS.some(x => x[0] === s)) want.cond = s; else if (s && M.GENRES.some(x => x[0] === s)) want.genre.push(s); else rest.push(w.replace(/(ies)$/, "y").replace(/([^s])s$/, "$1")); }
    const out = [];
    for (const e of ENTRIES.concat(M.custom || [])) {
      if (e.hidden) continue;
      if (f.cat && e.c !== f.cat) continue;
      if (f.sub && e.s !== f.sub) continue;
      if (f.genre && f.genre.length && !f.genre.some(g => e.g.includes(g))) continue;
      if (f.fam && f.fam.length && !f.fam.some(x => e.fams.includes(x))) continue;
      if (f.cond && !e.k.includes(f.cond)) continue;
      if (f.env && e.e !== "both" && e.e !== f.env) continue;
      if (f.ids && !f.ids.includes(e.id)) continue;
      if (want.cond && !e.k.includes(want.cond)) continue;
      if (want.fam.length && !want.fam.some(x => e.fams.includes(x))) continue;
      if (want.genre.length && !want.genre.some(g => e.g.includes(g))) continue;
      let score = 0;
      if (rest.length) {
        const name = words(e.n).map(w => w.replace(/([^s])s$/, "$1")), hay = words([e.s, e.c, e.tags.join(" "), e.f].join(" ")).map(w => w.replace(/([^s])s$/, "$1"));
        for (const w of rest) { if (name.includes(w)) score += 6; else if (name.some(x => x.startsWith(w))) score += 4; else if (hay.includes(w)) score += 2; else if (hay.some(x => x.startsWith(w))) score += 1; else { score = -1; break; } }
        if (score < 0) continue;
      }
      out.push({ e, score, cond: want.cond || f.cond || null });
    }
    const sort = f.sort || "best";
    out.sort((a, b) => sort === "name" ? a.e.n.localeCompare(b.e.n) : sort === "size" ? M.dims(b.e).reduce((x, y) => x * y, 1) - M.dims(a.e).reduce((x, y) => x * y, 1) : (b.score - a.score) || a.e.n.localeCompare(b.e.n));
    return out;
  };

  /* ---- models the game master brought in (a .glb file): kept with the campaign (models/<id>.js, its file riding in
          the page as M.blobs[id]), in the page's asset store (its url), or only in this browser (IndexedDB) */
  M.custom = M.custom || []; M.blobs = M.blobs || {};
  M.entry = id => BYID[id] || M.custom.find(x => x.id === id) || null;
  M.addCustom = meta => {
    const e = Object.assign({ c: "Your own models", s: "Brought in", g: [], k: ["new"], e: "in", mount: "floor", tags: [], src: "Brought in by you", lic: "Yours", f: "" }, meta, { custom: true, mats: [], fams: [] });
    e.p = Object.assign({ w: 1, d: 1, h: 1 }, meta.p || {}); e.measured = !!(meta.p && meta.p.w && meta.p.d);
    e.load = () => e._loading || (e._loading = loadCustom(e).catch(err => { e._loading = null; e.broken = String(err.message || err); throw err; }));
    const i = M.custom.findIndex(x => x.id === e.id); if (i >= 0) M.custom[i] = e; else M.custom.push(e);
    return e;
  };
  M.dropCustom = id => { M.custom = M.custom.filter(x => x.id !== id); };
  // models brought in on this page (the database's "assetlib"), on every window of the campaign as they arrive
  M.watchLibrary = st => {
    if (M._watching) return; M._watching = true;
    st.watch("assetlib", d => {
      for (const [id, meta] of Object.entries(d || {})) { if (!meta || meta.off) { M.dropCustom(id); continue; } const was = M.entry(id); if (was && was.custom && was.t === meta.t) continue; M.addCustom(Object.assign({}, meta, { id })); for (const k of [...icons.keys()]) if (k.startsWith(id + "|")) icons.delete(k); }
      if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("atlas-models", { detail: { library: true } }));
    });
  };
  async function loadCustom(e) {
    let buf = null;
    if (M.blobs[e.id]) { const bin = atob(M.blobs[e.id]); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); buf = u.buffer; }
    else if (e.url) { const r = await fetch(e.url); if (!r.ok) throw new Error("its file could not be fetched"); buf = await r.arrayBuffer(); }
    else if (e.local) buf = await M.idb.get("models", e.id);
    if (!buf) throw new Error("its file is not in this browser");
    const scene = await M.parseModel(buf);
    e.gltf = M.normalise(THREE, scene, e);
    // one brought in without its width and depth takes them from what was drawn
    if (!e.measured) { const s = new THREE.Box3().setFromObject(e.gltf).getSize(new THREE.Vector3()); e.p.w = Math.round(s.x * 100) / 100 || 1; e.p.d = Math.round(s.z * 100) / 100 || 1; e.measured = true; }
    return e;
  }
  M.parseModel = async buf => { const loader = await M.gltfLoader(); const g = await new Promise((ok, no) => loader.parse(buf, "", ok, err => no(new Error((err && err.message) || "not a model Atlas can read")))); return g.scene || (g.scenes && g.scenes[0]); };
  // a brought-in model made to stand like the library's: turned as asked, its height as given, centred, on the floor
  M.normalise = (T, scene, e) => {
    const g = new T.Group(), inner = scene; g.add(inner);
    inner.rotation.y = (e.ry || 0) * Math.PI / 180;
    let box = new T.Box3().setFromObject(inner); const size = box.getSize(new T.Vector3());
    const k = e.scale || (e.p.h && size.y ? e.p.h / size.y : 1); inner.scale.multiplyScalar(k);
    box = new T.Box3().setFromObject(inner); const c = box.getCenter(new T.Vector3());
    inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= box.min.y;
    inner.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    return g;
  };
  // what a model file holds: its size as drawn, how many triangles, whether it has anything to show
  M.measure = (T, scene) => { const box = new T.Box3().setFromObject(scene), s = box.getSize(new T.Vector3()); let tris = 0, meshes = 0; scene.traverse(o => { if (o.isMesh && o.geometry) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : (g.attributes.position || { count: 0 }).count) / 3; } }); return { w: s.x, d: s.z, h: s.y, tris: Math.round(tris), meshes }; };
  // a small key-value store in this browser, for brought-in models and the library's thumbnails
  M.idb = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((ok, no) => { try { const r = indexedDB.open("atlas-models", 1); r.onupgradeneeded = () => { r.result.createObjectStore("models"); r.result.createObjectStore("thumbs"); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } }));
    const tx = (store, mode, fn) => open().then(db => new Promise((ok, no) => { const t = db.transaction(store, mode), q = fn(t.objectStore(store)); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); }));
    return { get: (s, k) => tx(s, "readonly", st => st.get(k)).catch(() => null), put: (s, k, v) => tx(s, "readwrite", st => st.put(v, k)).catch(() => null), del: (s, k) => tx(s, "readwrite", st => st.delete(k)).catch(() => null) };
  })();

  /* ---- three.js, loaded only when a model is first needed (pages with a city map have it already) */
  const SRC = { three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", orbit: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js", gltf: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js" };
  const loading = {};
  function script(src) { return loading[src] || (loading[src] = new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => { delete loading[src]; no(new Error("could not load " + src)); }; document.head.appendChild(s); })); }
  M.three = async () => { if (!window.THREE) await script(SRC.three); if (!THREE.OrbitControls) await script(SRC.orbit); return THREE; };
  M.gltfLoader = async () => { await M.three(); if (!THREE.GLTFLoader) await script(SRC.gltf); return new THREE.GLTFLoader(); };

  /* ---- surface textures, drawn once each on a canvas in the material's colour */
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hex = n => "#" + n.toString(16).padStart(6, "0");
  const shade = (n, k) => { const r = Math.min(255, Math.max(0, ((n >> 16) & 255) * k)), g = Math.min(255, Math.max(0, ((n >> 8) & 255) * k)), b = Math.min(255, Math.max(0, (n & 255) * k)); return `rgb(${r | 0},${g | 0},${b | 0})`; };
  const mix = (a, b, t) => { const ch = (x, s) => (x >> s) & 255; return ((ch(a, 16) * (1 - t) + ch(b, 16) * t) << 16) | ((ch(a, 8) * (1 - t) + ch(b, 8) * t) << 8) | (ch(a, 0) * (1 - t) + ch(b, 0) * t); };
  function texCanvas(kind, col, cond) {
    const S = 256, cv = document.createElement("canvas"); cv.width = cv.height = S; const g = cv.getContext("2d"); seed = 7 + kind.length * 31 + (col & 255);
    g.fillStyle = hex(col); g.fillRect(0, 0, S, S);
    if (kind === "wood") {
      for (let i = 0; i < 70; i++) { const y = rnd() * S, a = .05 + rnd() * .12; g.strokeStyle = shade(col, rnd() < .5 ? .72 : 1.18); g.globalAlpha = a; g.lineWidth = .6 + rnd() * 2.2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= S; x += 16) g.lineTo(x, y + Math.sin(x / 40 + i) * 3 + (rnd() - .5) * 1.5); g.stroke(); }
      for (let k = 0; k < 3; k++) { const x = rnd() * S, y = rnd() * S; g.globalAlpha = .25; g.fillStyle = shade(col, .55); g.beginPath(); g.ellipse(x, y, 6 + rnd() * 6, 2.5 + rnd() * 2, 0, 0, 7); g.fill(); }
    } else if (kind === "stone" || kind === "concrete") {
      const n = kind === "stone" ? 2600 : 4200; for (let i = 0; i < n; i++) { g.globalAlpha = .08 + rnd() * .16; g.fillStyle = shade(col, .6 + rnd() * .8); const s = kind === "stone" ? 1 + rnd() * 3 : .8 + rnd() * 1.4; g.fillRect(rnd() * S, rnd() * S, s, s); }
      if (kind === "stone") for (let i = 0; i < 4; i++) { g.globalAlpha = .18; g.strokeStyle = shade(col, .5); g.lineWidth = .8; g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (rnd() - .5) * 40; y += (rnd() - .5) * 40; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === "marble") {
      for (let i = 0; i < 9; i++) { g.globalAlpha = .12 + rnd() * .15; g.strokeStyle = shade(col, .62); g.lineWidth = .6 + rnd() * 1.6; g.beginPath(); g.moveTo(rnd() * S, 0); g.bezierCurveTo(rnd() * S, S * .3, rnd() * S, S * .7, rnd() * S, S); g.stroke(); }
    } else if (kind === "metal" || kind === "rust") {
      for (let i = 0; i < 260; i++) { g.globalAlpha = .05 + rnd() * .07; g.strokeStyle = shade(col, rnd() < .5 ? .8 : 1.25); g.lineWidth = .5 + rnd(); const y = rnd() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (rnd() - .5) * 2); g.stroke(); }
      if (kind === "rust") for (let i = 0; i < 90; i++) { g.globalAlpha = .12 + rnd() * .22; g.fillStyle = rnd() < .5 ? "#5a2c14" : "#b0602a"; g.beginPath(); g.arc(rnd() * S, rnd() * S, 2 + rnd() * 12, 0, 7); g.fill(); }
    } else if (kind === "fabric" || kind === "burlap" || kind === "camo") {
      const st = kind === "burlap" ? 6 : 3; for (let i = 0; i < S; i += st) { g.globalAlpha = .1; g.fillStyle = shade(col, .75); g.fillRect(i, 0, 1, S); g.fillRect(0, i, S, 1); }
      if (kind === "camo") for (let i = 0; i < 40; i++) { g.globalAlpha = .85; g.fillStyle = ["#3d4228", "#7a7650", "#2a2c1e", "#6b6a40"][i % 4]; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 10 + rnd() * 24, 6 + rnd() * 14, rnd() * 3, 0, 7); g.fill(); }
    } else if (kind === "leather") {
      for (let i = 0; i < 1600; i++) { g.globalAlpha = .1; g.fillStyle = shade(col, .7 + rnd() * .6); g.fillRect(rnd() * S, rnd() * S, 2, 2); }
    } else if (kind === "brick") {
      g.fillStyle = "#b9b0a2"; g.fillRect(0, 0, S, S);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) { g.globalAlpha = 1; g.fillStyle = shade(col, .85 + rnd() * .3); g.fillRect(c * 52 + (r % 2) * 26 - 26 + 2, r * 32 + 2, 48, 28); }
    } else if (kind === "tiles") {
      g.strokeStyle = shade(col, .7); g.globalAlpha = .6; g.lineWidth = 2; for (let i = 0; i <= S; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.moveTo(0, i); g.lineTo(S, i); g.stroke(); }
    } else if (kind === "paper") {
      for (let i = 0; i < 800; i++) { g.globalAlpha = .05; g.fillStyle = shade(col, .8); g.fillRect(rnd() * S, rnd() * S, 2, 2); }
    } else if (kind === "bark") {
      for (let i = 0; i < 50; i++) { g.globalAlpha = .4; g.strokeStyle = shade(col, rnd() < .5 ? .6 : 1.3); g.lineWidth = 2 + rnd() * 4; const x = rnd() * S; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rnd() - .5) * 20, S); g.stroke(); }
    } else if (kind === "screen") {
      for (let y = 0; y < S; y += 4) { g.globalAlpha = .18; g.fillStyle = "#000"; g.fillRect(0, y, S, 2); }
      g.globalAlpha = .55; g.fillStyle = shade(col, 1.6); for (let i = 0; i < 14; i++) g.fillRect(20, 24 + i * 16, 40 + rnd() * 170, 5);
    }
    // what time has done to it
    if (cond === "dirty" || cond === "worn" || cond === "used" || cond === "damaged" || cond === "ruined" || cond === "burned" || cond === "rusty") {
      const n = { used: 10, worn: 22, dirty: 40, damaged: 34, ruined: 60, burned: 70, rusty: 30 }[cond];
      for (let i = 0; i < n; i++) { g.globalAlpha = cond === "used" ? .05 : .08 + rnd() * .14; g.fillStyle = cond === "burned" ? "#120d09" : cond === "rusty" ? (rnd() < .5 ? "#6a3418" : "#a2582a") : "#3a2e22"; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 6 + rnd() * 30, 4 + rnd() * 18, rnd() * 3, 0, 7); g.fill(); }
      if (cond === "damaged" || cond === "ruined") for (let i = 0; i < (cond === "ruined" ? 14 : 7); i++) { g.globalAlpha = .45; g.strokeStyle = "#1c150f"; g.lineWidth = 1 + rnd() * 1.5; g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rnd() - .5) * 50; y += (rnd() - .5) * 50; g.lineTo(x, y); } g.stroke(); }
    }
    g.globalAlpha = 1;
    return cv;
  }

  /* ---- the builder the models are made with. Everything is in metres; y is up; a model stands on y = 0 and is
          centred on x and z. Geometry and materials are shared between every model that uses them. */
  const geoCache = new Map(), matCache = new Map(), texCache = new Map();
  function material(T, key, cond, tint) {
    const ck = key + "|" + (cond || "") + "|" + (tint || ""); if (matCache.has(ck)) return matCache.get(ck);
    const d = MATS[key] || MATS.oak; let [fam, col, rough, metal, tex, emis, opac] = d;
    if (tint) col = mix(col, parseInt(String(tint).replace("#", ""), 16) || col, .75);
    if (cond === "rusty" && fam === "metal") { col = mix(col, 0x8a4b2a, .55); rough = .9; metal = .35; tex = "rust"; }
    if (cond === "burned") { col = mix(col, 0x1a1410, .7); rough = 1; }
    if (cond === "ruined") { col = mix(col, 0x4a4036, .35); rough = Math.min(1, rough + .2); }
    if (cond === "dirty") col = mix(col, 0x4a3c2c, .22);
    if (cond === "worn") col = mix(col, 0x8a8070, .14);
    // the room's reflection lights metal and glass fully, everything else a little
    const opts = { color: col, roughness: rough, metalness: metal, envMapIntensity: fam === "metal" || fam === "glass" ? 1 : .45 };
    const tk = tex || (cond && cond !== "new" && fam !== "glow" && fam !== "glass" ? "plain" : "");
    if (tk) { const k2 = tk + "|" + col + "|" + (cond || ""); let t = texCache.get(k2); if (!t) { t = new T.CanvasTexture(texCanvas(tk, col, cond)); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; texCache.set(k2, t); } opts.map = t; opts.color = 0xffffff; }
    // a light keeps its colour: a dim body, glowing in its own hue (lit fully, it would wash out to white)
    if (fam === "glow") { opts.emissive = col; opts.emissiveIntensity = .9; opts.color = mix(col, 0x000000, .7); opts.envMapIntensity = .2; }
    else if (emis) { opts.emissive = emis; opts.emissiveIntensity = .5; }
    if (opac != null) { opts.transparent = true; opts.opacity = opac; opts.depthWrite = opac > .7; }
    // both faces drawn: a bowl, a bucket or a lampshade is seen from inside too
    opts.side = T.DoubleSide;
    const m = new T.MeshStandardMaterial(opts); matCache.set(ck, m); return m;
  }
  function builder(T, entry, o) {
    const p = Object.assign({}, entry.p, o.p || {}), cond = o.c || p.cond || "new", slots = Object.assign({}, p.m || {}, o.m || {});
    // a material by slot name (body, top, cushion...) or by material name
    const main = Object.keys(slots)[0] || "body";
    const mat = k => material(T, slots[k] || (MATS[k] ? k : slots[main] || "oak"), cond, k === main || (!slots[k] && !MATS[k]) ? o.col : null);
    const root = new T.Group(); let cur = root;
    let s = 0; for (const ch of entry.id) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; let rs = s || 1;
    const r = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
    const g = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
    const q = n => Math.round(n * 1000) / 1000;
    const add = (geo, m, x, y, z, rx, ry, rz) => { const me = new T.Mesh(geo, typeof m === "string" ? mat(m) : m); me.position.set(x || 0, y || 0, z || 0); if (rx || ry || rz) me.rotation.set(rx || 0, ry || 0, rz || 0); me.castShadow = me.receiveShadow = true; cur.add(me); return me; };
    const b = {
      T, p, cond, r, mat,
      broken: cond === "damaged" || cond === "ruined",
      // a box standing on y (its bottom), centred on x and z
      box: (w, h, d, m, x, y, z, rx, ry, rz) => add(g(`b${q(w)},${q(h)},${q(d)}`, () => new T.BoxGeometry(w, h, d)), m, x, (y || 0) + h / 2, z, rx, ry, rz),
      // a box with rounded edges
      rbox: (w, h, d, rad, m, x, y, z, ry) => {
        rad = Math.min(rad, w / 2 - .001, d / 2 - .001, h / 2 - .001);
        const geo = g(`rb${q(w)},${q(h)},${q(d)},${q(rad)}`, () => { const sh = new T.Shape(), x0 = -w / 2 + rad, x1 = w / 2 - rad, z0 = -d / 2 + rad, z1 = d / 2 - rad; sh.moveTo(x0, -d / 2); sh.lineTo(x1, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, z0); sh.lineTo(w / 2, z1); sh.quadraticCurveTo(w / 2, d / 2, x1, d / 2); sh.lineTo(x0, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, z1); sh.lineTo(-w / 2, z0); sh.quadraticCurveTo(-w / 2, -d / 2, x0, -d / 2); const e = new T.ExtrudeGeometry(sh, { depth: Math.max(.001, h - rad * 2), bevelEnabled: true, bevelThickness: rad, bevelSize: rad * .6, bevelSegments: 3, curveSegments: 6 }); e.rotateX(-Math.PI / 2); e.translate(0, rad, 0); return e; });
        return add(geo, m, x, y || 0, z, 0, ry || 0, 0);
      },
      // a cylinder standing on y; rt and rb the radii at top and bottom
      cyl: (rt, rb, h, m, x, y, z, seg, rx, rz, ry) => add(g(`c${q(rt)},${q(rb)},${q(h)},${seg || 20}`, () => new T.CylinderGeometry(rt, rb, h, seg || 20)), m, x, (y || 0) + (rx || rz ? 0 : h / 2), z, rx, ry, rz),
      // a rod along x (or z, or y), centred on its middle
      rod: (r0, len, m, x, y, z, axis, seg) => add(g(`r${q(r0)},${q(len)},${seg || 12}`, () => new T.CylinderGeometry(r0, r0, len, seg || 12)), m, x, y, z, axis === "z" ? Math.PI / 2 : 0, 0, !axis || axis === "x" ? Math.PI / 2 : 0),
      // something painted flat on the floor (or on a wall, facing +z, when up is set): draw(ctx, W, H) on a canvas
      decal: (key, draw, w, d, y, m, up) => {
        const k = "dc" + key + q(w) + q(d); let tex = texCache.get(k);
        if (!tex) { const cv = document.createElement("canvas"), sc = 512 / Math.max(w, d); cv.width = Math.max(16, Math.round(w * sc)); cv.height = Math.max(16, Math.round(d * sc)); draw(cv.getContext("2d"), cv.width, cv.height); tex = new T.CanvasTexture(cv); texCache.set(k, tex); }
        const mk = "dm" + k + cond; let mt = matCache.get(mk); if (!mt) { mt = new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: (m && m.rough) || .85, metalness: 0, depthWrite: false, emissive: m && m.glow ? 0xffffff : 0, emissiveMap: m && m.glow ? tex : null, emissiveIntensity: m && m.glow ? .8 : 0, polygonOffset: true, polygonOffsetFactor: -2 }); matCache.set(mk, mt); }
        const me = add(g(`p${q(w)},${q(d)}`, () => new T.PlaneGeometry(w, d)), mt, 0, y || .004, 0, up ? 0 : -Math.PI / 2, 0, 0); me.castShadow = false; return me;
      },
      sph: (rad, m, x, y, z, sy, seg) => { const me = add(g(`s${q(rad)},${seg || 18}`, () => new T.SphereGeometry(rad, seg || 18, Math.max(8, (seg || 18) * .66 | 0))), m, x, y, z); if (sy) me.scale.y = sy; return me; },
      cone: (rad, h, m, x, y, z, seg) => add(g(`k${q(rad)},${q(h)},${seg || 16}`, () => new T.ConeGeometry(rad, h, seg || 16)), m, x, (y || 0) + h / 2, z),
      tor: (rad, tube, m, x, y, z, rx, ry, arc) => add(g(`t${q(rad)},${q(tube)},${q(arc || 6.2832)}`, () => new T.TorusGeometry(rad, tube, 8, 28, arc || Math.PI * 2)), m, x, y, z, rx == null ? Math.PI / 2 : rx, ry || 0, 0),
      // a turned shape: [[radius, height], ...] from the bottom up
      lathe: (pts, m, x, y, z, seg) => add(g("l" + pts.map(v => q(v[0]) + ":" + q(v[1])).join(";") + "," + (seg || 24), () => new T.LatheGeometry(pts.map(v => new T.Vector2(Math.max(0, v[0]), v[1])), seg || 24)), m, x, y || 0, z),
      // a tube along points [[x,y,z],...]
      tube: (pts, rad, m, seg) => add(g("u" + pts.map(v => v.map(q).join(":")).join(";") + "," + q(rad), () => new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v => new T.Vector3(v[0], v[1], v[2]))), Math.max(8, pts.length * 8), rad, 10, false)), m),
      // a flat outline [[x,y],...] given depth along z, standing on y, its outline's x to the model's x
      ext: (pts, depth, m, x, y, z, ry, bevel) => add(g("e" + pts.map(v => q(v[0]) + ":" + q(v[1])).join(";") + "," + q(depth) + "," + (bevel || 0), () => { const sh = new T.Shape(pts.map(v => new T.Vector2(v[0], v[1]))); const e = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 2 }); e.translate(0, 0, -depth / 2); return e; }), m, x, y || 0, z, 0, ry || 0, 0),
      // a flat outline lying on the ground (an outline in x and z), extruded up by h
      slab: (pts, h, m, x, y, z) => add(g("f" + pts.map(v => q(v[0]) + ":" + q(v[1])).join(";") + "," + q(h), () => { const sh = new T.Shape(pts.map(v => new T.Vector2(v[0], -v[1]))); const e = new T.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); e.rotateX(-Math.PI / 2); return e; }), m, x, y || 0, z),
      // any geometry the model makes itself (a rock's lumpy shape), placed as given
      mesh: (geo, m, x, y, z, rx, ry, rz) => add(geo, m, x, y, z, rx, ry, rz),
      // a sub-assembly: built with fn, then moved and turned as one
      part: (fn, x, y, z, rx, ry, rz, s) => { const grp = new T.Group(), was = cur; cur = grp; fn(); cur = was; grp.position.set(x || 0, y || 0, z || 0); grp.rotation.set(rx || 0, ry || 0, rz || 0); if (s) grp.scale.setScalar(s); cur.add(grp); return grp; },
      // a label or sign painted on a panel (front, facing +z)
      sign: (text, w, h, bg, fg, x, y, z, ry, glow) => {
        const k = "sg" + text + w + h + bg + fg + (glow ? 1 : 0); let tex = texCache.get(k);
        if (!tex) { const cv = document.createElement("canvas"); cv.width = 512; cv.height = Math.max(64, Math.round(512 * h / w)); const c = cv.getContext("2d"); c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = fg; c.font = `bold ${Math.round(cv.height * .62)}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; if (glow) { c.shadowColor = fg; c.shadowBlur = 18; } let fs = Math.round(cv.height * .62); while (c.measureText(text).width > cv.width * .9 && fs > 10) { fs -= 2; c.font = `bold ${fs}px Arial, sans-serif`; } c.fillText(text, cv.width / 2, cv.height / 2); tex = new T.CanvasTexture(cv); texCache.set(k, tex); }
        const mk = "sm" + k; let m = matCache.get(mk); if (!m) { m = new T.MeshStandardMaterial({ map: tex, roughness: .6, transparent: /^rgba\(.*,\s*0\)$/.test(bg), emissive: glow ? 0xffffff : 0, emissiveMap: glow ? tex : null, emissiveIntensity: glow ? .9 : 0 }); matCache.set(mk, m); }
        return add(g(`p${q(w)},${q(h)}`, () => new T.PlaneGeometry(w, h)), m, x, y, z, 0, ry || 0, 0);
      }
    };
    return { b, root };
  }
  // a model, built: a Group standing on the floor, centred, its size fitted to the entry's w, d and h when it asks
  M.build = (T, spec) => {
    const e = typeof spec === "string" ? M.entry(spec) : M.entry(spec.a);
    if (!e) return null;
    if (e.custom) return e.gltf ? e.gltf.clone(true) : null;
    const fn = GENS[e.f]; if (!fn) return null;
    const main = Object.keys(e.p.m || {})[0] || "body";
    const { b, root } = builder(T, e, spec.a ? { c: spec.c, m: spec.m ? { [main]: spec.m } : null, col: spec.col, p: spec.p } : {});
    try { fn(b, b.p); } catch (err) { console.warn("model", e.id, err); }
    return root;
  };

  /* ---- pictures: the top-down picture the flat map shows, and the thumbnail the browser shows. One renderer, off the
          page, does them all, a few at a time; each is kept for the visit. */
  let R = null; const icons = new Map(), wanted = new Map(), thumbs = new Map();
  // a soft room for metal and glass to reflect (without one, metal looks black): a warm sky, a dark floor, one window
  // of light. Made for each renderer, as its textures belong to it.
  M.env = (T, r) => {
    const pm = new T.PMREMGenerator(r), sc = new T.Scene(), geo = new T.SphereGeometry(10, 32, 16), pos = geo.attributes.position, cols = [];
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10, c = new T.Color(); if (y >= 0) c.setHSL(.09, .2, .42 + .4 * y); else c.setHSL(.08, .12, .2 + .12 * (1 + y)); cols.push(c.r, c.g, c.b); }
    geo.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
    sc.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const win = new T.Mesh(new T.PlaneGeometry(7, 4), new T.MeshBasicMaterial({ color: 0xffffff })); win.position.set(3, 7, 5); win.lookAt(0, 0, 0); sc.add(win);
    const tex = pm.fromScene(sc, .03).texture; pm.dispose(); geo.dispose();
    return tex;
  };
  const specKey = s => [s.a, s.m || "", s.c || "", s.col || "", s.p ? JSON.stringify(s.p) : ""].join("|");
  M.specKey = specKey;
  function renderer(T) {
    if (R) return R;
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setClearColor(0x000000, 0);
    R = { r, scene: new T.Scene() };
    R.scene.environment = M.env(T, r);
    R.scene.add(new T.HemisphereLight(0xfff8ec, 0x6a5a48, .4));
    // the sun from the top left, as maps are lit; for a thumbnail it comes round to the front
    R.sun = new T.DirectionalLight(0xffffff, .75); R.scene.add(R.sun);
    R.fill = new T.DirectionalLight(0xffeedd, .2); R.scene.add(R.fill);
    return R;
  }
  const fmt = (() => { try { const c = document.createElement("canvas"); c.width = c.height = 1; return c.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/png"; } catch (e) { return "image/png"; } })();
  function shot(T, obj, view, px) {
    const { r, scene, sun, fill } = renderer(T);
    if (view === "top") { sun.position.set(-3, 6, -2); fill.position.set(4, 3, 5); } else { sun.position.set(3, 6, 5); fill.position.set(-5, 2, 2); }
    const box = new T.Box3().setFromObject(obj), size = box.getSize(new T.Vector3()), mid = box.getCenter(new T.Vector3());
    let cam, W, H;
    if (view === "top") {
      // straight down; the picture is the footprint (x across, z down), with a margin for its shadow
      const pad = .06, w = Math.max(size.x, .05) + pad * 2, d = Math.max(size.z, .05) + pad * 2;
      W = Math.max(8, Math.round(w * px)); H = Math.max(8, Math.round(d * px));
      cam = new T.OrthographicCamera(-w / 2, w / 2, d / 2, -d / 2, .01, 100);
      cam.position.set(mid.x, box.max.y + 5, mid.z); cam.up.set(0, 0, -1); cam.lookAt(mid.x, 0, mid.z);
    } else {
      W = H = px; const rad = Math.max(size.length() / 2, .1);
      cam = new T.OrthographicCamera(-rad * 1.05, rad * 1.05, rad * 1.05, -rad * 1.05, .01, 200);
      cam.position.set(mid.x + rad * 3, mid.y + rad * 2.6, mid.z + rad * 3.4); cam.lookAt(mid);
    }
    r.setSize(W, H, false);
    scene.add(obj); r.render(scene, cam); scene.remove(obj);
    // the picture, with a soft shadow under it
    const out = document.createElement("canvas"); out.width = W; out.height = H; const c = out.getContext("2d");
    c.shadowColor = "rgba(20,14,8,.42)"; c.shadowBlur = Math.max(2, W / 40); c.shadowOffsetX = view === "top" ? Math.max(1, W / 70) : 0; c.shadowOffsetY = view === "top" ? Math.max(1, W / 70) : Math.max(1, H / 50);
    c.drawImage(r.domElement, 0, 0, W, H);
    return { url: out.toDataURL(fmt, .9), w: view === "top" ? (size.x + .12) : 0, d: view === "top" ? (size.z + .12) : 0, cx: mid.x, cz: mid.z };
  }
  // the top-down picture of a placed model: ready, or asked for (the map is drawn again when it comes)
  M.icon = spec => icons.get(specKey(spec)) || null;
  M.want = spec => { const k = specKey(spec); if (icons.has(k) || wanted.has(k)) return; wanted.set(k, spec); clearTimeout(M.want.t); M.want.t = setTimeout(drawWanted, 30); };
  async function drawWanted() {
    if (typeof document === "undefined") return;
    let T; try { T = await M.three(); } catch (e) { console.warn("models: 3D engine not reachable", e); return; }
    const list = [...wanted.values()]; wanted.clear();
    for (const sp of list) await M.drawIcon(sp, T);
    document.dispatchEvent(new CustomEvent("atlas-models", { detail: { icons: list.length } }));
  }
  // one model's top-down picture, drawn now
  M.drawIcon = async (sp, T) => {
    const k = specKey(sp); if (icons.has(k)) return icons.get(k);
    T = T || await M.three();
    const e = M.entry(sp.a);
    if (e && e.load && !e.gltf) { try { await e.load(); } catch (x) { icons.set(k, { missing: true }); return icons.get(k); } }
    const obj = M.build(T, sp); if (!obj) { icons.set(k, { missing: true }); return icons.get(k); }
    // about 160 pixels to the metre (a map zoomed in stays sharp), never more than 400 pixels across
    const [w, d] = M.dims(e, sp), px = Math.min(160, 400 / Math.max(w, d, .05));
    try { icons.set(k, shot(T, obj, "top", px)); } catch (x) { icons.set(k, { missing: true }); }
    return icons.get(k);
  };
  // the browser's thumbnail, at three-quarters; kept in this browser between visits (the library's own, by its version)
  M.VERSION = "2026-10-21c";   // change it when the models change, so browsers draw their thumbnails again
  M.thumb = async spec => {
    const k = specKey(spec); if (thumbs.has(k)) return thumbs.get(k);
    const e = M.entry(spec.a), dk = M.VERSION + "|" + k, kept = e && !e.custom ? await M.idb.get("thumbs", dk) : null;
    if (kept) { thumbs.set(k, kept); return kept; }
    const T = await M.three();
    if (e && e.load && !e.gltf) await e.load();
    const obj = M.build(T, spec); if (!obj) throw new Error("no model");
    const t = shot(T, obj, "three", 128).url; thumbs.set(k, t); if (e && !e.custom) M.idb.put("thumbs", dk, t); return t;
  };

  /* ---- the rotating preview: a little 3D view of one model, turned with the mouse and zoomed with the wheel */
  M.preview = async (host, spec) => {
    const T = await M.three();
    const r = new T.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    host.innerHTML = ""; host.appendChild(r.domElement);
    const scene = new T.Scene(); scene.environment = M.env(T, r); scene.add(new T.HemisphereLight(0xfff8ec, 0x5a4a3a, .5));
    const sun = new T.DirectionalLight(0xffffff, .8); sun.position.set(3, 6, 4); scene.add(sun);
    const ground = new T.Mesh(new T.CircleGeometry(3, 40), new T.MeshStandardMaterial({ color: 0x8a8274, roughness: 1, transparent: true, opacity: .35 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const cam = new T.PerspectiveCamera(35, 1, .01, 200), ctl = new T.OrbitControls(cam, r.domElement);
    ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 1.6; ctl.enablePan = false;
    let obj = null, raf = 0, gone = false;
    const size = () => { const w = host.clientWidth || 240, h = host.clientHeight || 200; r.setSize(w, h, false); r.domElement.style.width = "100%"; r.domElement.style.height = "100%"; cam.aspect = w / h; cam.updateProjectionMatrix(); };
    function set(sp) {
      if (obj) scene.remove(obj);
      obj = M.build(T, sp); if (!obj) return;
      scene.add(obj);
      const box = new T.Box3().setFromObject(obj), s = box.getSize(new T.Vector3()), mid = box.getCenter(new T.Vector3()), rad = Math.max(s.length() / 2, .15);
      ground.scale.setScalar(Math.max(.4, rad * .9));
      ctl.target.copy(mid); cam.position.set(mid.x + rad * 2.6, mid.y + rad * 1.9, mid.z + rad * 3.2); ctl.minDistance = rad * 1.2; ctl.maxDistance = rad * 9; ctl.update();
    }
    const loop = () => { if (gone) return; raf = requestAnimationFrame(loop); ctl.update(); r.render(scene, cam); };
    size(); set(spec); loop();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null; if (ro) ro.observe(host);
    r.domElement.addEventListener("pointerdown", () => { ctl.autoRotate = false; });
    return { set, dispose() { gone = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); ctl.dispose(); r.dispose(); host.innerHTML = ""; } };
  };

  /* ---- on the flat map: each placed model as its top-down picture, turned and sized as placed. Models on the floor
          are drawn under the walls, those on a wall or a ceiling over them. Before a picture is ready (and where there
          is no 3D engine, as when the checker writes maps) a model is its outline with its name. */
  A.propsSVG = (F, gm, pre, layer, inHidden) => {
    const P = F.P || []; if (!P.length) return "";
    const C = A.C, sq = M.sq(), defs = {}, items = [];
    const list = P.map((p, i) => [p, i]).filter(([p]) => gm || (!p.h && !(inHidden && inHidden(p.x, p.y)))).filter(([p]) => { const e = BYID[p.a] || (M.custom || []).find(x => x.id === p.a); const mt = (e && e.mount) || "floor"; return layer === "over" ? mt === "wall" || mt === "ceiling" : mt !== "wall" && mt !== "ceiling"; });
    list.sort((a, b) => ((a[0].z || 0) - (b[0].z || 0)) || a[1] - b[1]);
    for (const [p, i] of list) {
      const e = BYID[p.a] || (M.custom || []).find(x => x.id === p.a), s = p.s || 1, [w, d] = e ? M.dims(e, p) : [1, 1];
      const ic = typeof document !== "undefined" && e ? M.icon(p) : null;
      if (!ic && typeof document !== "undefined" && e) M.want(p);
      const tr = `translate(${(p.x * C).toFixed(1)} ${(p.y * C).toFixed(1)}) rotate(${p.r || 0}) scale(${s})`, op = e && e.mount === "ceiling" ? ` opacity=".55"` : "";
      if (ic && !ic.missing) {
        const id = pre + "pm" + specKey(p).replace(/[^a-z0-9]/gi, "_");
        if (!defs[id]) defs[id] = `<image id="${id}" href="${ic.url}" x="${(-ic.w / 2 + (ic.cx || 0)) / sq * C}" y="${(-ic.d / 2 + (ic.cz || 0)) / sq * C}" width="${ic.w / sq * C}" height="${ic.d / sq * C}" preserveAspectRatio="none"/>`;
        items.push(`<use href="#${id}" transform="${tr}"${op} class="lm-prop" data-prop="${i}"/>`);
      } else {
        // not drawn yet, or not to be had: its outline and its name (a model whose file is missing says so)
        const gone = !e || !!(ic && ic.missing), ww = w / sq * C, dd = d / sq * C, full = e ? e.n + (gone ? " (its file is missing)" : "") : "Missing model: " + p.a, nm = gone ? "Missing" : e.n;
        items.push(`<g transform="${tr}" class="lm-prop${gone ? " lm-prop-x" : ""}" data-prop="${i}"${op}><title>${A.esc(full)}</title><rect x="${-ww / 2}" y="${-dd / 2}" width="${ww}" height="${dd}" rx="3" fill="${gone ? "#d98a8a" : "#b9a888"}" fill-opacity=".55" stroke="${gone ? "#8a2a2a" : "#4a3c2c"}" stroke-width="1"${gone ? ` stroke-dasharray="3 2"` : ""}/><text x="0" y="3" text-anchor="middle" font-size="${Math.max(5, Math.min(9, ww / Math.max(4, nm.length) * 1.6))}" fill="#2b2219">${A.esc(nm.length > 22 ? nm.slice(0, 20) + "…" : nm)}</text></g>`);
      }
    }
    const dk = Object.values(defs).join("");
    return (dk ? `<defs>${dk}</defs>` : "") + `<g class="lm-props">${items.join("")}</g>`;
  };

  // a floor of a place in 3D is drawn by atlas-room3d.js, from one fixed angle
})(ATLAS);
