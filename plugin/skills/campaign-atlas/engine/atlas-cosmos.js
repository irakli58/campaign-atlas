/* Campaign Atlas: dimensions and planes (the user's request of 3 Nov 2026, "Fantasy dimensions, planes of existence and
   lore-accurate planar world generation"; the plan approved with their answers in the workspace's
   reviews/2026-11-03-dimensions.md: where editions disagree, always ask the game master, no edition winning by itself;
   the Feywild and the Shadowfell as worlds of their own; all four extras: planar events, time across planes, the Blood
   War as a faction conflict, travel costs and dangers with a traveller's warning).
   - The campaign's cosmology is cosmos.js: ATLAS.cosmos({ model, dimensions: [...] }) (references/dimensions.md). Each
     dimension has its concept, where it came from (lore with its setting and edition, custom, random), its structure,
     its rules in three kinds kept apart (how it looks, what it is like, what it does in play, each with its source or
     marked the game master's own), its facts each tagged canon, variant or added with its source, where the sources
     disagree (each disagreement shown with its sources until the game master chooses), its layers, factions, events,
     portals, time and travel.
   - A layer's map is made in the page from its recipe (the world generator, as a planet's surface is: in the
     background the first time, kept in this browser, the same every time) and opened in the world map as one of the
     campaign's worlds; a land, a land without end, islands in a void, a city plane or a land underground, in the
     plane's own kinds of ground and liquid (atlas-world-biomes.js "The planes") and its own colours.
   - The Dimensions tab of At the table: the cosmology drawn, a dimension's card, its layers a step down each, the
     party's plane, the ways between (portals: a route whose two ends lie on different maps), time and travel; Add
     dimension from lore, from a description, or at random, shown before anything is kept.
   - Kept in the table's store, collection "cosmos": the game master's choices ("c:<dim>:<conflict>"), the party's
     plane ("party"), dimensions added on the page ("dim:<id>"), a layer's new seed ("seed:<dim>:<layer>"), a dimension
     hidden ("gone:<id>"); collection "dimworlds": the layers' maps made in this browser. */
(function (A) {
  "use strict";
  // (the campaign's own come from cosmos.js, ATLAS.cosmos in atlas-table.js; dimensions added on the page lie over them)
  const TU = A.tableUI; if (!TU) return;
  const api = TU.api, esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const S = () => api.store();
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  const STRUCT = { land: "A land", unbounded: "A land without end: no seas, no coasts", islands: "Islands in a void", ocean: "All ocean: no shore, almost no land", sky: "All sky: islands adrift over clouds", chart: "No surface: a chart of what drifts in it", mirror: "A mirror of the campaign's world, remade by its laws", layers: "A stack of layers", city: "A city that is the plane", underground: "A land underground" };
  const RING = { material: "The world", echo: "Echoes of the world", transitive: "The ways between", inner: "The Inner Planes", outer: "The Outer Planes", other: "Elsewhere" };
  const TAG = { canon: ["Canon", "From its source, as that edition has it"], variant: ["Another edition", "Another edition says otherwise"], added: ["Added by Atlas", "Invented to fill a gap in the sources"], homebrew: ["Yours", "The game master's own"] };
  const WAYS = { portal: "A portal", gate: "A gate", ritual: "A ritual", spell: "A spell", passage: "A hidden passage", crossroads: "A crossroads" };

  /* ---- the cosmology as it stands: the campaign's, the page's additions, less what is hidden */
  const docs = () => (S() && S().get("cosmos")) || {};
  function cosmos() {
    const C = A.cosmosData || { model: "great wheel", dimensions: [] }, D = docs(), out = C.dimensions.slice();
    for (const [k, v] of Object.entries(D)) if (k.startsWith("dim:") && v && v.def) { const i = out.findIndex(x => x.id === v.def.id); if (i >= 0) out[i] = v.def; else out.push(Object.assign({ own: true }, v.def)); }
    return { model: (D.model && D.model.v) || C.model || "great wheel", edition: C.edition || "", dimensions: out.filter(d => !(D["gone:" + d.id])) };
  }
  const dimOf = id => cosmos().dimensions.find(d => d.id === id) || null;
  const layersOf = d => d.layers && d.layers.length ? d.layers : [Object.assign({ id: "main", name: d.name, n: 1 }, { map: d.map, places: d.places, concept: d.concept })];
  const layerOf = (d, lid) => layersOf(d).find(l => l.id === lid) || null;
  // the game master's choice where the sources disagree, or null while it waits for them
  const chosen = (d, cid) => { const v = docs()["c:" + d.id + ":" + cid]; return v && v.value != null ? v.value : null; };
  // a value that may name a disagreement ("@avernus-ruler"): the chosen answer, or a note that it waits
  const said = (d, v) => { if (typeof v !== "string" || v[0] !== "@") return v; const c = (d.conflicts || []).find(x => x.id === v.slice(1)); const ch = chosen(d, v.slice(1)); return ch != null ? ch : `not chosen yet (${c ? c.about : v.slice(1)})`; };
  const waiting = d => (d.conflicts || []).filter(c => chosen(d, c.id) == null);

  /* ---- a layer's map from its recipe: the world generator's own flags, as Open its surface gives a planet's */
  const wid = (d, l) => ("dim-" + d.id + "-" + l.id).replace(/[^\w-]/g, "-").slice(0, 40);
  /* (the user's plan of 4 Nov 2026, reviews/2026-11-04-environments.md: a plane's map is made from what its lore says it
     is, not the fantasy generator's world in other colours. Its recipe's shape and laws become its environment, which the
     world generator follows as it follows a planet's: its shape (a land, a land without end, islands in a void, all
     ocean, all sky, a chart where it has no surface, a city, a mirror of the campaign's world), its liquid and how much,
     its weather or none, its warmth by its law and not by latitude (a plane has no poles), what lives there, its own
     landforms (an endless slope, chasms, ruined cities) and its named rivers that run because its lore says so) */
  const SHAPE_SEA = { unbounded: 0, city: 0, underground: 0, ocean: .997, islands: .78, sky: .8 };
  function envOf(d, l) {
    const m = Object.assign({}, d.map || {}, l.map || {}), laws = Object.assign({}, d.laws || {}, l.laws || {}, m.laws || {});
    const st = m.structure || l.structure || (d.structure !== "layers" ? d.structure : "") || "land";
    const liquid = m.liquid || (m.cover && m.cover.liquid) || "water";
    const share = liquid === "none" ? 0 : SHAPE_SEA[st] != null ? SHAPE_SEA[st] : m.landshare != null ? 1 - m.landshare : .38;
    const still = laws.weather === "none";
    const cover = Object.assign({}, m.cover || {}, st === "city" ? { dry: (m.cover || {}).dry || "ironstreets" } : {});
    return { v: 2, kind: "plane", frame: st, crust: m.crust || "plates", impacts: m.impacts || 0, basins: m.basins || 0, volcanism: m.volcanism || 0, volcStyle: m.volcStyle || "arcs",
      liquid: { kind: liquid, share, surface: share > 0 }, erosion: { fluvial: still || !share ? (m.fluvial || 0) : m.fluvial != null ? m.fluvial : 1, aeolian: m.aeolian != null ? m.aeolian : .3, glacial: m.glacial || 0 },
      climate: { model: "uniform", temp: laws.warmth != null ? laws.warmth : 14, even: 1 }, fall: still ? "none" : laws.fall || "rain", life: m.life || laws.life || "complex",
      cover: Object.keys(cover).length ? cover : null, shores: liquid === "water" ? "beach" : liquid === "lava" ? "lava" : share ? "smooth" : "none", names: null, landforms: m.landforms || [], rivers: m.rivers || [] };
  }
  function recipe(d, l) {
    const m = Object.assign({}, d.map || {}, l.map || {}), env = envOf(d, l), st = env.frame;
    const seed = +((docs()["seed:" + d.id + ":" + l.id] || {}).v) || m.seed || (hash(d.id + "|" + l.id) % 1e6);
    const w = env.climate.temp, climate = m.climate || (w > 40 ? "arid" : w > 22 ? "warm" : w < -15 ? "polar" : w < 2 ? "cold" : "temperate");
    return { size: m.size || "large", land: st === "islands" || st === "sky" ? "archipelago" : "masses", landmasses: m.landmasses || (st === "ocean" ? 6 : 2), climate, setting: "plane", realism: "fantasy", look: st === "chart" ? "stars" : "planet",
      seed, replace: true, regions: true, "climate-model": "earth", currents: "off", coast: "plain", env, palette: palette(d, l) };
  }
  const PAL0 = { ground: "#7a6a5a", sea: null, ice: null, plant: null, sky: "#2a2a3a" };
  // (its sea's colour from its liquid when the recipe gives none, so a plane with water or blood never looks dry; the
  // liquid kept beside it, so a still sea gets no pale shallows: atlas-world-art.js planetColours)
  const SEA_OF = { water: "#2f6f8f", bloodsea: "#5a1414", mistsea: "#8a9096", voidsea: "#0e0c18", astral: "#cfd0e0", lava: "#ff5a1f", ice: "#cfdde6", cursedwater: "#34403a", ichor: "#b08a2a", methane: "#2b2b2b", glowwater: "#4f9e98" };
  const palette = (d, l) => { const m = Object.assign({}, d.map || {}, l.map || {}), liq = m.liquid || (m.cover && m.cover.liquid) || "water", P = Object.assign({}, PAL0, d.palette || {}, (l.map || {}).palette || l.palette || {}); if (!P.sea && liq !== "none") P.sea = SEA_OF[liq] || null; P.liquid = liq; return P; };
  const placesOf = (d, l) => (l.places || []).map(p => ({ id: p.id, name: p.name, kind: p.kind || "landmark", desc: p.desc || "", gm: p.gm || "" }));
  function register(d, l, T) {
    const id = wid(d, l);
    A.world({ title: `${d.name}: ${l.name}`, look: envOf(d, l).frame === "chart" ? "stars" : "planet", kind: "plane", plane: { dim: d.id, layer: l.id }, locations: placesOf(d, l), routes: [], regions: (l.regions || []).map(r => typeof r === "string" ? { name: r, kind: "region" } : r) }, id);
    if (T) A.worldTerrain(Object.assign({}, T, { look: envOf(d, l).frame === "chart" ? "stars" : "planet", planetPalette: palette(d, l) }), id);
    return id;
  }
  // a mirror (the user, 4 Nov 2026: "if the dimension is a mirror of the fantasy world keep that in mind"): the campaign's
  // own world, its coasts, ranges and rivers, remade by the plane's laws: its heights raised or worn (map.relief), its
  // ground and liquid its own (map.cover), its rivers of its liquid, its colours, its names changed if its lore says how
  // (map.rename, "{name}" for the world's own), and its own places stood on its land
  function mirrorTerrain(d, l) {
    const W0 = A.worlds && A.worlds.main, T0 = W0 && W0.terrain; if (!T0 || !T0.height) throw new Error("the campaign's world map has no land to mirror");
    const BIO = A.worldBiomes, m = Object.assign({}, d.map || {}, l.map || {}), relief = m.relief != null ? m.relief : 1;
    const cov = Object.assign({ dry: "plains", forest: "forest", wet: "marsh", cold: "snow", high: "mountains", liquid: "water" }, m.cover || {});
    const dec = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)), enc = a => { let s = ""; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192)); return btoa(s); };
    const H = dec(T0.height), M = T0.moist ? dec(T0.moist) : new Uint8Array(H.length).fill(128), C = new Uint8Array(H.length), sea = T0.sea || 128, code = k => (BIO && BIO.CODE[k]) || 0;
    for (let n = 0; n < H.length; n++) {
      if (H[n] <= sea) { if (cov.liquid !== "water") C[n] = code(cov.liquid); continue; }
      const t = (H[n] - sea) / (255 - sea); H[n] = Math.max(sea + 1, Math.min(255, Math.round(sea + (H[n] - sea) * relief)));
      C[n] = code(t > .55 ? cov.high : M[n] > 175 ? cov.wet : M[n] > 105 ? cov.forest : cov.dry);
    }
    // its own places, each on its land
    const r = rng(hash(d.id + "|" + l.id + "|places")), spots = {}, cols = T0.cols, cell = T0.cell || 4;
    for (const p of placesOf(d, l)) for (let k = 0; k < 400; k++) { const n = Math.floor(r() * H.length); if (H[n] > sea + 2) { spots[p.id] = [Math.round(((n % cols) + .5) * cell), Math.round((((n / cols) | 0) + .5) * cell)]; break; } }
    const liq = cov.liquid !== "water" ? cov.liquid : undefined;
    return Object.assign({}, T0, { height: enc(H), Lo: undefined, cover: enc(C), liquid: liq, spots,
      rivers: (T0.rivers || []).map(rv => Object.assign({}, rv, liq ? { liquid: liq } : {})),
      labels: (T0.labels || []).map(L => Object.assign({}, L, { name: m.rename ? String(m.rename).replace("{name}", L.name) : L.name })),
      env: { v: 2, life: m.life || "complex", shores: !liq ? "beach" : liq === "lava" ? "lava" : "smooth", liquid: liq || "water", surface: true, mirror: "main" } });
  }
  // a dimension made a mirror: each of its layers the campaign's world remade by that layer's own ground, liquid and laws
  function asMirror(d) {
    const mk = m => Object.assign({}, m || {}, { structure: "mirror" });
    return Object.assign({}, d, { structure: (d.layers || []).length > 1 ? "layers" : "mirror", map: mk(d.map), layers: (d.layers || []).map(l => Object.assign({}, l, { map: mk(l.map) })),
      lore: (d.lore || []).concat({ fact: "Its land mirrors the campaign's world: the same coasts and ranges, remade by its laws.", tag: "homebrew" }) });
  }
  async function layerMap(dimId, lid, say) {
    const d = dimOf(dimId); if (!d) throw new Error("that dimension is not in the campaign"); const l = layerOf(d, lid); if (!l) throw new Error("that layer is not in the dimension");
    if (!A.worldGenerate) throw new Error("this page cannot make maps (build it again with atlas.js build)");
    // (a layer that is one of the campaign's own maps, the world itself for the Material Plane: l.world)
    if (l.world) { if (A.worlds && A.worlds[l.world] && A.worlds[l.world].data) return l.world; throw new Error(`the map ${l.world} is not in this campaign`); }
    const id = wid(d, l); if (A.worlds && A.worlds[id] && A.worlds[id].terrain && A.worlds[id].terrain.height) return id;
    if (envOf(d, l).frame === "mirror") { register(d, l, mirrorTerrain(d, l)); S().set("dimworlds", id, { dim: d.id, layer: l.id, key: "mirror", t: Date.now() }); return id; }
    const flags = recipe(d, l), key = "plane|" + JSON.stringify(flags) + "|" + placesOf(d, l).map(p => p.id + ":" + p.kind).join(",");
    let T = A.worldGenCache ? await A.worldGenCache(key) : null;
    if (!T) { if (say) say(`Making ${l.name}: about ${Math.max(1, Math.round(A.worldGenSecs(flags.size)))} seconds the first time, then it is kept.`); T = await A.worldGenerate(flags, { title: `${d.name}: ${l.name}`, setting: "plane", locations: placesOf(d, l) }); if (A.worldGenCache) await A.worldGenCache(key, T); }
    register(d, l, T);
    S().set("dimworlds", id, { dim: d.id, layer: l.id, key, t: Date.now() });
    return id;
  }
  A.planeMap = layerMap;

  /* ---- the party's plane: where they are, so the copilot and the narrator know which rules hold there */
  const party = () => docs().party || null;
  function partyHere() { const p = party(); if (!p || !p.dim) return null; const d = dimOf(p.dim); if (!d) return null; return { d, l: layerOf(d, p.layer) || layersOf(d)[0], since: p.since }; }
  // what the copilot is told (atlas-copilot.js lately)
  A.cosmosSay = () => {
    const h = partyHere(); if (!h) return "";
    const { d, l } = h, r = Object.assign({}, d.rules || {}, l.rules || {});
    return `The party is on ${d.name}${layersOf(d).length > 1 ? `, its layer ${l.name}` : ""}: ${l.concept || d.concept || ""} ${r.feel ? "What it is like: " + r.feel : ""} ${l.ruler ? "Its ruler: " + said(d, l.ruler) + "." : ""} Describe it as this plane is, never as the Material Plane.`.replace(/\s+/g, " ").trim();
  };

  /* ---- time across planes (the extra the user chose): a day there against days at home; the world's clock is home's */
  const ratioSay = t => !t ? "" : t.say || (t.here && t.home ? `${t.here} day${t.here === 1 ? "" : "s"} there pass in ${t.home} day${t.home === 1 ? "" : "s"} at home` : "");
  function leave(daysThere) {
    const h = partyHere(); if (!h) return null; const t = Object.assign({}, h.d.time || {}, h.l.time || {});
    const home = t.here && t.home ? daysThere * t.home / t.here : daysThere;
    if (A.worldTime && home > 0) A.worldTime.advance(Math.round(home * 1440));
    S().set("cosmos", "party", null);
    return home;
  }

  /* ---- the Blood War and the like: a dimension's factions join the campaign's (atlas-factions.js) */
  function joinFactions() { for (const d of cosmos().dimensions) if (d.factions && A.factions) A.factions(d.factions); }
  // a dimension's planar events join the world's (atlas-worldtime.js), marked with their plane
  function joinEvents() { const have = new Set((A.eventsData || []).map(e => e.id)); for (const d of cosmos().dimensions) for (const e of d.events || []) if (e.id && !have.has(e.id) && A.events) A.events([Object.assign({ plane: d.id }, e, { title: e.title || e.id })]); }

  /* ---- the cosmology drawn: the Great Wheel (the world at the hub, the inner planes round it, the ways between, the
          outer planes on the rim, the echoes beside the world), the World Axis (the Astral Sea above, the Elemental
          Chaos below, the echoes beside), or a ring for a cosmology of the campaign's own */
  function diagram(C, sel) {
    const W = 520, H = 360, cx = W / 2, cy = H / 2, ds = C.dimensions, axis = /axis/i.test(C.model), pos = {};
    const by = r => ds.filter(d => (d.ring || "other") === r);
    const ring = (list, rad, a0) => list.forEach((d, i) => { const a = a0 + i / Math.max(1, list.length) * Math.PI * 2; pos[d.id] = [cx + Math.cos(a) * rad * 1.35, cy + Math.sin(a) * rad]; });
    if (axis) {
      const col = (list, y) => list.forEach((d, i) => { pos[d.id] = [cx + (i - (list.length - 1) / 2) * 110, y]; });
      col(by("material"), cy); col(by("outer").concat(by("transitive").filter(d => /astral/i.test(d.name))), 50); col(by("inner"), H - 50);
      by("echo").forEach((d, i) => { pos[d.id] = [cx + (i ? 1 : -1) * 150, cy]; }); col(by("transitive").filter(d => !/astral/i.test(d.name)).concat(by("other")), cy + 70);
    } else {
      by("material").forEach(d => { pos[d.id] = [cx, cy]; }); by("echo").forEach((d, i) => { pos[d.id] = [cx + (i ? 1 : -1) * 62, cy + 26]; });
      ring(by("inner"), 62, -Math.PI / 2); ring(by("transitive"), 104, Math.PI / 4); ring(by("outer").concat(by("other")), 150, -Math.PI / 2);
    }
    const dot = d => { const [x, y] = pos[d.id] || [cx, cy], on = d.id === sel, wait = waiting(d).length; return `<g class="dm-node${on ? " on" : ""}" data-dm="pick" data-id="${esc(d.id)}" tabindex="0" role="button" aria-label="${esc(d.name)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(on ? 11 : 8)}" fill="${esc((d.palette || {}).ground || "#8a7a6a")}"/>${wait ? `<circle cx="${(x + 8).toFixed(1)}" cy="${(y - 8).toFixed(1)}" r="4" class="dm-wait"/>` : ""}<text x="${x.toFixed(1)}" y="${(y + 22).toFixed(1)}" text-anchor="middle">${esc(d.short || d.name)}</text></g>`; };
    const rims = axis ? `<line x1="${cx}" y1="30" x2="${cx}" y2="${H - 30}" class="dm-axis"/><text x="12" y="24" class="dm-cap">The Astral Sea</text><text x="12" y="${H - 12}" class="dm-cap">The Elemental Chaos</text>` : `<ellipse cx="${cx}" cy="${cy}" rx="${150 * 1.35}" ry="150" class="dm-rim"/><ellipse cx="${cx}" cy="${cy}" rx="${104 * 1.35}" ry="104" class="dm-rim dm-thin"/><ellipse cx="${cx}" cy="${cy}" rx="${62 * 1.35}" ry="62" class="dm-rim dm-thin"/>`;
    const links = (C.links || []).map(([a, b]) => pos[a] && pos[b] ? `<line x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}" class="dm-link"/>` : "").join("");
    return `<svg class="dm-wheel" viewBox="0 0 ${W} ${H}" role="group" aria-label="The cosmology">${rims}${links}${ds.map(dot).join("")}</svg>`;
  }

  /* ---- the tab */
  const UI = { sel: null, adding: null, draft: null, busy: false, msg: "", leaveDays: "" };
  function factsHTML(d) {
    const L = d.lore || []; if (!L.length) return "";
    return `<details class="dm-sec"><summary>What is known of it (${L.length})</summary><ul class="dm-facts">${L.map(f => { const t = TAG[f.tag] || TAG.added; return `<li><span class="dm-tag dm-${esc(f.tag || "added")}" title="${esc(t[1])}">${esc(t[0])}</span> ${esc(f.fact)}${f.source ? ` <span class="kn">${esc(f.source)}${f.edition ? ", " + esc(f.edition) : ""}</span>` : ""}</li>`; }).join("")}</ul></details>`;
  }
  function conflictsHTML(d) {
    const L = d.conflicts || []; if (!L.length) return "";
    return `<section class="dm-sec dm-conf"><h5>Where the sources disagree</h5><p class="t-small">No edition wins by itself: choose, and Atlas keeps your choice.</p>${L.map(c => { const ch = chosen(d, c.id); return `<div class="dm-cf${ch == null ? " wait" : ""}"><b>${esc(c.about)}</b>${ch == null ? ` <span class="dm-tag dm-wait-t">Choose</span>` : ""}<ul>${(c.options || []).map((o, k) => `<li><label><input type="radio" name="cf-${esc(d.id)}-${esc(c.id)}" data-dm="choose" data-id="${esc(d.id)}" data-c="${esc(c.id)}" data-k="${k}"${String(ch) === String(o.value) ? " checked" : ""}> ${esc(o.value)}</label> <span class="kn">${esc(o.source || "")}${o.edition ? ", " + esc(o.edition) : ""}</span>${o.note ? `<br><span class="t-small">${esc(o.note)}</span>` : ""}</li>`).join("")}<li><label><input type="radio" name="cf-${esc(d.id)}-${esc(c.id)}" data-dm="choose" data-id="${esc(d.id)}" data-c="${esc(c.id)}" data-k="own"${ch != null && !(c.options || []).some(o => String(o.value) === String(ch)) ? " checked" : ""}> My own:</label> <input class="t-in t-in-s" data-dm-own="${esc(d.id)}:${esc(c.id)}" value="${ch != null && !(c.options || []).some(o => String(o.value) === String(ch)) ? esc(ch) : ""}" placeholder="as your campaign has it"></li></ul></div>`; }).join("")}</section>`;
  }
  function rulesHTML(d, l) {
    const r = Object.assign({}, d.rules || {}, (l && l.rules) || {}), play = r.play || [];
    if (!r.look && !r.feel && !play.length) return "";
    return `<section class="dm-sec"><h5>Its rules</h5>${r.look ? `<p><span class="kn">How it looks</span> ${esc(r.look)}</p>` : ""}${r.feel ? `<p><span class="kn">What it is like</span> ${esc(r.feel)}</p>` : ""}${play.length ? `<p class="kn">What it does in play</p><ul class="dm-facts">${play.map(p => `<li>${esc(p.rule || p)}${p.source ? ` <span class="kn">${esc(p.source)}</span>` : ` <span class="dm-tag dm-homebrew">Yours</span>`}</li>`).join("")}</ul>` : `<p class="t-small kn">No rules of play from a source: add your own if you want them.</p>`}</section>`;
  }
  // a layer's laws in a few words: its weather, its warmth, its gravity
  function lawSay(d, l) { const L = Object.assign({}, d.laws || {}, l.laws || {}, (l.map || {}).laws || {}), out = []; if (L.weather === "none") out.push("no weather"); else if (L.weather === "storms") out.push("endless storms"); if (L.warmth != null) out.push(`always about ${L.warmth} °C`); if (L.gravity) out.push(`gravity ${L.gravity}`); return out.length ? " · " + out.join(", ") : ""; }
  function layersHTML(d) {
    const L = layersOf(d), many = L.length > 1;
    return `<section class="dm-sec"><h5>${many ? `Its layers (${L.length})` : "Its map"}</h5><ol class="dm-layers">${L.map(l => { const id = l.world || wid(d, l), made = !!(A.worlds && A.worlds[id] && A.worlds[id].data && (l.world || (A.worlds[id].terrain && A.worlds[id].terrain.height))), st = (l.map || {}).structure || l.structure || (d.structure !== "layers" ? d.structure : "") || "land"; return `<li><div><b>${esc(l.name)}</b>${l.ruler ? ` <span class="kn">ruled by</span> ${esc(said(d, l.ruler))}` : ""}</div>${l.concept ? `<div class="t-small">${esc(l.concept)}</div>` : ""}<div class="t-small kn">${esc(STRUCT[st] || st)}${esc(lawSay(d, l))}${(l.places || []).length ? " · " + l.places.map(p => p.name).join(", ") : ""}</div><div class="t-row"><button type="button" class="t-mini${made ? "" : " prim"}" data-dm="open" data-id="${esc(d.id)}" data-l="${esc(l.id)}">${made ? "Open its map" : "Make its map"}</button><button type="button" class="t-mini" data-dm="here" data-id="${esc(d.id)}" data-l="${esc(l.id)}">The party is here</button>${made ? `<button type="button" class="t-mini" data-dm="again" data-id="${esc(d.id)}" data-l="${esc(l.id)}" title="A new map from the same recipe; your places and changes on it stay">Make it again</button>` : ""}</div></li>`; }).join("")}</ol></section>`;
  }
  function waysHTML(d) {
    const P = (d.portals || []).concat(cosmos().dimensions.filter(x => x.id !== d.id).flatMap(x => (x.portals || []).filter(p => p.to && p.to.dim === d.id)));
    const t = d.travel || {}, tm = ratioSay(d.time);
    if (!P.length && !t.ways && !t.cost && !(t.dangers || []).length && !tm && !d.warning) return "";
    const end = e => { if (!e) return "?"; if (e.dim) { const x = dimOf(e.dim), l = x && layerOf(x, e.layer); return `${x ? x.name : e.dim}${l && layersOf(x).length > 1 ? ": " + l.name : ""}${e.loc ? ` (${e.loc})` : ""}`; } return `the world${e.loc ? ` (${e.loc})` : ""}`; };
    return `<section class="dm-sec"><h5>Getting there, and back</h5>${P.length ? `<ul class="dm-ways">${P.map(p => `<li><b>${esc(p.name || WAYS[p.kind] || "A way")}</b> <span class="kn">${esc(WAYS[p.kind] || p.kind || "")}</span>: ${esc(end(p.from))} → ${esc(end(p.to))}${p.who ? `<br><span class="t-small">Who can use it: ${esc(p.who)}</span>` : ""}${p.when ? `<br><span class="t-small">When: ${esc(p.when)}</span>` : ""}${p.price ? `<br><span class="t-small">Its price: ${esc(p.price)}</span>` : ""} <button type="button" class="t-mini" data-dm="through" data-id="${esc(d.id)}" data-p="${esc(p.id || "")}" data-to="${esc(JSON.stringify(p.to || {}))}">Go through</button></li>`).join("")}</ul>` : `<p class="t-small kn">No way there is drawn yet: nothing is reachable unless a way is drawn.</p>`}
      ${t.ways ? `<p><span class="kn">How people go</span> ${esc(t.ways)}</p>` : ""}${t.cost ? `<p><span class="kn">What it costs</span> ${esc(t.cost)}</p>` : ""}${(t.dangers || []).length ? `<p class="kn">Its dangers</p><ul class="dm-facts">${t.dangers.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${tm ? `<p><span class="kn">Time</span> ${esc(tm)}</p>` : ""}${d.warning ? `<div class="t-row"><button type="button" class="t-mini" data-dm="warn" data-id="${esc(d.id)}">Show them the traveller's warning</button></div>` : ""}</section>`;
  }
  function cardHTML(d) {
    const src = d.source || {}, wait = waiting(d);
    return `<section class="dm-card"><h4>${esc(d.name)}</h4><div class="t-small kn">${esc(RING[d.ring] || RING.other)} · ${esc(STRUCT[d.structure] || d.structure || "A land")} · ${esc(src.kind === "lore" ? `from the lore${src.setting ? " of " + src.setting : ""}${src.edition ? ", " + src.edition : ""}${src.strict === false ? ", freely" : ""}` : src.kind === "random" ? "drawn at random" : "the campaign's own")}</div>
      ${wait.length ? `<p class="dm-alert">${wait.length} disagreement${wait.length > 1 ? "s" : ""} between the sources wait${wait.length > 1 ? "" : "s"} for your choice (below).</p>` : ""}
      ${d.concept ? `<p>${esc(d.concept)}</p>` : ""}${rulesHTML(d)}${layersHTML(d)}${waysHTML(d)}${conflictsHTML(d)}${factsHTML(d)}
      ${(d.factions && Object.keys(d.factions).length) ? `<p class="t-small"><span class="kn">Its powers</span> ${Object.values(d.factions).map(f => esc(f.n)).join(", ")}: in Factions and people, with how they stand.</p>` : ""}
      ${(d.events || []).length ? `<p class="t-small"><span class="kn">Its events</span> ${d.events.map(e => esc(e.title || e.id)).join("; ")}: in the world's time.</p>` : ""}
      <div class="t-row"><button type="button" class="t-mini" data-dm="ask" data-id="${esc(d.id)}">Ask for a change</button>${d.own ? `<button type="button" class="t-mini t-danger" data-dm="remove" data-id="${esc(d.id)}">Take it away</button>` : `<button type="button" class="t-mini" data-dm="hide" data-id="${esc(d.id)}">Hide it</button>`}</div></section>`;
  }
  function partyHTML() {
    const h = partyHere(); if (!h) return `<p class="t-small">The party is in the world. On a plane, the copilot is told its rules.</p>`;
    const t = Object.assign({}, h.d.time || {}, h.l.time || {});
    return `<div class="dm-party"><b>The party is on ${esc(h.d.name)}${layersOf(h.d).length > 1 ? ": " + esc(h.l.name) : ""}.</b> ${ratioSay(t) ? esc(ratioSay(t)) + "." : ""}<div class="t-row"><label class="t-small">Days they spent there <input class="t-in t-n" type="number" min="0" step="any" data-dm-days value="${esc(UI.leaveDays)}"></label><button type="button" class="t-mini" data-dm="leave">They come home</button></div></div>`;
  }
  function addHTML() {
    if (!UI.adding) return `<div class="t-row"><button type="button" class="t-btn" data-dm="add" data-how="lore">Add a dimension from the lore</button><button type="button" class="t-btn" data-dm="add" data-how="custom">Describe one</button><button type="button" class="t-btn" data-dm="add" data-how="random">One at random</button></div>`;
    const how = UI.adding, dr = UI.draft;
    const form = how === "lore" ? `<label class="tw-l"><span>Which plane</span><input class="t-in" data-dm-f="name" placeholder="the Nine Hells of Baator; the Feywild; the Plane of Fire"></label><label class="tw-l"><span>Edition or setting</span><input class="t-in" data-dm-f="edition" placeholder="D&D 5th edition; Forgotten Realms; Planescape" value="${esc(cosmos().edition || "")}"></label><label class="tw-l"><span>How faithful</span><select class="t-in" data-dm-f="strict"><option value="strict">To the lore</option><option value="free">Free with it</option></select></label><label class="tw-l"><span>How much</span><select class="t-in" data-dm-f="scope"><option value="all">Every layer</option><option value="some">The main layers</option></select></label>`
      : how === "custom" ? `<label class="tw-l"><span>The dimension, in your words</span><textarea class="t-in" rows="3" data-dm-f="text" placeholder="a dimension where time flows backward and cities float above an endless ocean"></textarea></label>` : `<p class="t-small">A premise is drawn first; everything else follows from it.</p>`;
    // (its land: a world of its own, or a mirror of the campaign's world remade by its laws: the user's choice, 4 Nov 2026)
    const mirror = how === "random" ? "" : `<label class="tw-l"><span>Its land</span><select class="t-in" data-dm-f="mirror"><option value="">A world of its own</option><option value="mirror"${A.worlds && A.worlds.main && A.worlds.main.terrain ? "" : " disabled"}>A mirror of the campaign's world, remade by its laws</option></select></label>`;
    return `<section class="dm-add"><h5>${how === "lore" ? "A dimension from the lore" : how === "custom" ? "A dimension of your own" : "A dimension at random"}</h5>${dr ? "" : form + mirror}
      ${dr ? `<div class="ux-card ux-cardin">${A.ux ? A.ux.cardTop({ who: how === "random" ? "Atlas suggests" : "Claude suggests", title: "A new dimension: " + (dr.short || dr.name), made: how === "lore" ? ["the lore of the plane, as your edition has it"] : how === "custom" ? ["your words"] : ["a premise drawn at random, and what follows from it"], touches: ["the campaign's cosmos: one dimension more, with " + layersOf(dr).length + " layer" + (layersOf(dr).length === 1 ? "" : "s")], keeps: ["every dimension already here, and your choices among the editions"] }) : `<p class="t-small">What would be added: nothing is kept until you keep it.</p>`}${cardHTML(Object.assign({}, dr, { own: true }))}<div class="t-row ux-cact"><button type="button" class="t-btn prim" data-dm="keep">Keep it</button><button type="button" class="t-btn" data-dm="redo">${how === "random" ? "Another" : "Ask again"}</button><button type="button" class="t-btn" data-dm="cancel">Throw it away</button></div></div>` : `<div class="t-row"><button type="button" class="t-btn prim" data-dm="draft"${UI.busy ? " disabled" : ""}>${UI.busy ? "Working it out…" : how === "random" ? "Draw one" : "Work it out"}</button><button type="button" class="t-mini" data-dm="cancel">Cancel</button></div>`}${UI.msg ? `<p class="t-small">${esc(UI.msg)}</p>` : ""}</section>`;
  }
  function html() {
    const C = cosmos(); if (!UI.sel || !dimOf(UI.sel)) UI.sel = (C.dimensions.find(d => d.ring !== "material") || C.dimensions[0] || {}).id || null;
    const d = UI.sel && dimOf(UI.sel), wait = C.dimensions.reduce((n, x) => n + waiting(x).length, 0);
    return `<section class="t-card dm-wrap"><h3>Dimensions and planes</h3><p class="t-small">${esc(/axis/i.test(C.model) ? "The World Axis" : /wheel/i.test(C.model) ? "The Great Wheel" : "The campaign's own cosmology")}${C.edition ? ", " + esc(C.edition) : ""}: ${C.dimensions.length} dimension${C.dimensions.length === 1 ? "" : "s"}. Click one to see it; each layer opens its own map.${wait ? ` <b>${wait} choice${wait > 1 ? "s" : ""} wait${wait > 1 ? "" : "s"} for you</b> where the sources disagree.` : ""}</p>
      ${C.dimensions.length ? diagram(C, UI.sel) : `<p class="t-small kn">No dimensions yet.</p>`}${partyHTML()}${d ? cardHTML(d) : ""}${addHTML()}</section>`;
  }

  /* ---- a dimension at random: a premise drawn first, and everything else following from it */
  const PREMISES = [
    { p: "time runs backward", structure: "islands", liquid: "mistsea", cover: { dry: "bonefield", forest: "gloomwood", wet: "mistsea", high: "ironspires" }, ground: "#8a8478", feel: "Effects come before their causes; people remember tomorrow and forget yesterday.", places: [["Memory-city", "city"], ["The Last Beginning", "temple"], ["The Unbuilt Tower", "tower"]], people: "the Rememberers, who keep the future in ledgers" },
    { p: "every thought becomes weather", structure: "land", liquid: "ichor", cover: { dry: "feymeadow", forest: "wildwood", wet: "ichor", high: "ironspires" }, ground: "#6a8a5a", feel: "Moods gather as clouds; an angry crowd brings hail, grief brings fog.", places: [["The Calm", "city"], ["Stormherd Camp", "camp"], ["The Still Shrine", "shrine"]], people: "the Weatherwrights, who sell calm by the hour" },
    { p: "the land is the body of a sleeping god", structure: "land", liquid: "bloodsea", cover: { dry: "bonefield", forest: "thornwood", wet: "bloodsea", high: "ironspires" }, ground: "#9a7a6a", feel: "The ground breathes; quakes are dreams, and its rivers have a pulse.", places: [["The Heart-Well", "temple"], ["Ribtown", "town"], ["The Dreaming Pass", "landmark"]], people: "the Wardens of the Sleep, who keep it from waking" },
    { p: "light is a substance, mined and spent", structure: "underground", liquid: "voidsea", cover: { dry: "ashwaste", forest: "gloomwood", wet: "voidsea", high: "ironspires" }, ground: "#3a3a40", feel: "Darkness is the natural state; light is carried in jars and paid out in coins.", places: [["The Lumen Mine", "mine"], ["Lanternhold", "city"], ["The Unlit Gate", "ruin"]], people: "the Lamplighters' Guild, who own every flame" },
    { p: "it is the inside of a song still being sung", structure: "islands", liquid: "astral", cover: { dry: "feymeadow", forest: "wildwood", wet: "astral", high: "ironspires" }, ground: "#8a7aa0", feel: "Everything moves in time; silence is dangerous, and a wrong note tears the ground.", places: [["The Refrain", "city"], ["The Rest", "shrine"], ["The Coda", "tower"]], people: "the Choir, who must never stop" },
    { p: "it burns forever without being consumed", structure: "unbounded", liquid: "lava", cover: { dry: "cinders", forest: "brimstone", wet: "lava", high: "ironspires" }, ground: "#7a4a2a", feel: "Everything is aflame and nothing burns away; the fire is the air.", places: [["The Ember Court", "castle"], ["Ashmarket", "city"], ["The Cool Well", "landmark"]], people: "the Unburnt, salamander-lords of the flame" }
  ];
  function randomDim(seed) {
    const r = rng(seed), P = PREMISES[Math.floor(r() * PREMISES.length)], id = "realm-" + (seed % 100000).toString(36);
    const sylA = ["Vel", "Or", "Kae", "Myr", "Thal", "Ys", "Zan", "Quor"], sylB = ["athe", "on", "ess", "ith", "umbra", "aris", "ence"], name = sylA[Math.floor(r() * sylA.length)] + sylB[Math.floor(r() * sylB.length)];
    return { id, name: `${name}, where ${P.p}`, short: name, ring: "other", source: { kind: "random" }, structure: P.structure, concept: `A dimension where ${P.p}. ${P.feel} Its people follow from it: ${P.people}.`, palette: { ground: P.ground, sea: null, sky: "#2a2a3a" },
      rules: { look: `Its ground ${P.structure === "islands" ? "hangs in pieces over" : "runs down to"} ${({ mistsea: "a sea of mist", ichor: "lakes of golden ichor", bloodsea: "seas of blood", voidsea: "the dark", astral: "a silver void", lava: "lakes of fire" })[P.liquid] || "its waters"}.`, feel: P.feel, play: [] },
      lore: [{ fact: `Where ${P.p}, ${P.feel.charAt(0).toLowerCase() + P.feel.slice(1)}`, tag: "added" }, { fact: `Its people are ${P.people}.`, tag: "added" }],
      map: { structure: P.structure, liquid: P.liquid, cover: Object.assign({ liquid: P.liquid }, P.cover), seed: seed % 1e6 }, places: P.places.map(([n, k], i) => ({ id: "p" + i, name: n, kind: k })),
      time: r() < .4 ? { here: 1, home: [7, 30, .25][Math.floor(r() * 3)] } : null, travel: { ways: "By a door that opens only to someone thinking of " + P.p + ".", dangers: ["Staying too long: its premise begins to hold for the traveller too."] } };
  }
  // Claude's: a dimension from the lore or a description, as JSON in the campaign's shape, every fact tagged
  async function askDim(how, f) {
    const shape = `{"id":"short-id","name":"...","ring":"outer|inner|transitive|echo|other","source":{"kind":"${how === "lore" ? "lore" : "custom"}","setting":"...","edition":"...","strict":true},"structure":"land|unbounded|islands|layers|city|underground","concept":"two or three sentences","palette":{"ground":"#hex","sea":"#hex or null","sky":"#hex"},"rules":{"look":"...","feel":"...","play":[{"rule":"...","source":"book, edition (only if a source has it)"}]},"lore":[{"fact":"...","tag":"canon|variant|added","source":"book or SRD section","edition":"..."}],"conflicts":[{"id":"short-id","about":"what the sources disagree on","options":[{"value":"...","source":"...","edition":"..."}]}],"layers":[{"id":"short-id","name":"...","ruler":"name, or @conflict-id where the sources disagree","concept":"...","map":{"structure":"land|unbounded|islands|city|underground","climate":"temperate|cold|polar|arid|tropical","liquid":"water|lava|bloodsea|ichor|mistsea|voidsea|astral|ice|none","cover":{"dry":"kind","forest":"kind","wet":"kind","cold":"kind","high":"kind"},"palette":{"ground":"#hex"}},"places":[{"id":"short-id","name":"...","kind":"city|castle|fort|tower|ruin|temple|camp|landmark|cave"}]}],"factions":{},"time":{"here":1,"home":1,"say":"..."},"travel":{"ways":"...","cost":"...","dangers":["..."]},"warning":{"from":"who wrote it","text":"a traveller's warning, in their own voice, 80 to 150 words"}}`;
    const kinds = "ashwaste, ironspires, bonefield, brimstone, cinders, thornwood, wildwood, feymeadow, shadowland, gloomwood, ironstreets, icesheet, glacier, volcanic, dunes, rockdesert, marsh, bog, forest, plains, mountains, snow, corruptland, wasteland, enchanted";
    const prompt = how === "lore"
      ? `For the tabletop campaign "${(A.config || {}).title || ""}", describe the plane "${f.name}" as ${f.edition || "the campaign's edition"} has it (${f.strict === "free" ? "freely: keep its character, invent where useful" : "faithfully to the lore"}; ${f.scope === "some" ? "its main layers" : "every layer"}). Summarise in your own words, never copying a book's text. Tag every fact: canon (with its book and edition), variant (another edition says otherwise), or added (invented to fill a gap). Where editions disagree (a layer's ruler, its order, its nature), do not choose: list each answer with its source in conflicts, and use "@conflict-id" for that value. Give rules of play only where a source has them, citing it. Each layer is a different kind of place: give each its own map recipe (kinds of ground from: ${kinds}). Answer with JSON only, in this shape:\n${shape}`
      : `For the tabletop campaign "${(A.config || {}).title || ""}", expand this into a coherent dimension: "${f.text}". Its parts follow from its premise: its map, its places, its people, how one travels there, what it is like. Everything you invent is tagged "added". Kinds of ground from: ${kinds}. Answer with JSON only, in this shape:\n${shape}`;
    const raw = await api.askRaw(prompt, () => {}, null, { kind: "writing", what: how === "lore" ? "the plane " + f.name + " from the lore" : "a dimension from your words", uses: how === "lore" ? [f.edition || "the campaign's edition"] : ["your description"] });
    if (raw == null) return null;
    const m = String(raw).match(/\{[\s\S]*\}/); if (!m) throw new Error("Claude's answer was not a dimension");
    const d = JSON.parse(m[0]); if (!d.id || !d.name) throw new Error("Claude's answer had no name");
    d.id = String(d.id).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 24); return d;
  }

  /* ---- what the game master does */
  function refresh() { api.render(); }
  document.addEventListener("change", e => {
    const t = e.target; if (!t.closest || !t.closest(".dm-wrap")) return;
    if (t.dataset.dm === "choose") { const d = dimOf(t.dataset.id), c = d && (d.conflicts || []).find(x => x.id === t.dataset.c); if (!c) return; let v = t.dataset.k === "own" ? (document.querySelector(`[data-dm-own="${CSS.escape(t.dataset.id + ":" + t.dataset.c)}"]`) || {}).value : (c.options[+t.dataset.k] || {}).value; if (v == null || v === "") return; S().set("cosmos", "c:" + d.id + ":" + c.id, { value: v, t: Date.now() }); api.note(`Kept: ${c.about}: ${v}.`); refresh(); }
    else if (t.dataset.dmOwn) { const [id, cid] = t.dataset.dmOwn.split(":"); if (t.value.trim()) { S().set("cosmos", "c:" + id + ":" + cid, { value: t.value.trim(), own: true, t: Date.now() }); refresh(); } }
    else if (t.hasAttribute("data-dm-days")) UI.leaveDays = t.value;
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-dm]"); if (!b || !b.closest(".dm-wrap") || b.tagName === "INPUT") return;
    const k = b.dataset.dm, d = b.dataset.id ? dimOf(b.dataset.id) : null;
    switch (k) {
      case "pick": UI.sel = b.dataset.id; refresh(); break;
      case "open": case "again": {
        if (!d) return; const l = layerOf(d, b.dataset.l); if (!l) return;
        if (k === "again") { S().set("cosmos", "seed:" + d.id + ":" + l.id, { v: Math.floor(Math.random() * 1e6) }); const id = wid(d, l); if (A.worlds[id]) A.worlds[id].terrain = null; }
        b.disabled = true; const was = b.textContent;
        const w = A.ux ? A.ux.work({ what: "the map of " + l.name, uses: [d.name + "'s lore and laws"] }) : null, t0 = Date.now(), iv = w ? setInterval(() => w.progress(Math.min(.95, (Date.now() - t0) / 25000)), 700) : null;
        try { const id = await layerMap(d.id, l.id, t => { b.textContent = t; }); clearInterval(iv); b.disabled = false; b.textContent = was; const stay = api.tab() === "dims" && ((document.getElementById("app") || {}).dataset || {}).view === "table"; if (w) w.end(true, "its map is ready", () => { if (A.openWorld) A.openWorld(id); }); if (stay && A.openWorld) A.openWorld(id); } catch (x) { clearInterval(iv); if (w) w.end(false); b.disabled = false; b.textContent = was; api.note(x.message); }
        break;
      }
      case "here": if (!d) return; S().set("cosmos", "party", { dim: d.id, layer: b.dataset.l, since: A.worldTime ? A.worldTime.now() : 0 }); api.note(`The party is on ${d.name}. The copilot is told where.`); refresh(); break;
      case "leave": { const days = parseFloat(UI.leaveDays) || 0, home = leave(days); UI.leaveDays = ""; api.note(home != null ? `Home again: ${Math.round(home * 10) / 10} day${Math.round(home * 10) / 10 === 1 ? "" : "s"} passed at home.` : "Home again."); refresh(); break; }
      case "through": {
        let to = {}; try { to = JSON.parse(b.dataset.to || "{}"); } catch (x) {}
        if (to.dim) { const x = dimOf(to.dim), l = x && (layerOf(x, to.layer) || layersOf(x)[0]); if (!x || !l) return; S().set("cosmos", "party", { dim: x.id, layer: l.id, since: A.worldTime ? A.worldTime.now() : 0 }); try { const id = await layerMap(x.id, l.id, t => api.note(t)); if (A.openWorld) A.openWorld(id); } catch (y) { api.note(y.message); } }
        else { leave(0); if (A.openWorld && A.worlds && A.worlds[to.world || "main"]) A.openWorld(to.world || "main"); }
        break;
      }
      case "warn": { if (!d || !d.warning) return; const h = { kind: (A.table && A.table.ERA_KIND && A.table.ERA_KIND[A.table.era ? A.table.era() : ""]) || "scroll", title: d.warning.title || `A warning about ${d.name}`, text: d.warning.text, from: d.warning.from || "" }; api.show({ kind: "handout", id: "warn-" + d.id, h }); break; }
      case "hide": if (d && confirm(`Hide ${d.name}? Its maps and your choices are kept; it comes back from the campaign's cosmos.js if you take this away.`)) { S().set("cosmos", "gone:" + d.id, { t: Date.now() }); UI.sel = null; refresh(); } break;
      case "remove": if (d && d.own && confirm(`Take ${d.name} away? The maps made of its layers stay in this browser.`)) { S().set("cosmos", "dim:" + d.id, null); UI.sel = null; refresh(); } break;
      case "ask": if (d && A.askChange) A.askChange({ what: `the dimension ${d.name}`, text: JSON.stringify(d).slice(0, 4000) }); else api.note("Ask for a change needs Claude: from the app, or Claude's page."); break;
      case "add": UI.adding = b.dataset.how; UI.draft = null; UI.msg = ""; refresh(); break;
      case "cancel": UI.adding = null; UI.draft = null; UI.msg = ""; refresh(); break;
      case "redo": UI.draft = null; if (UI.adding === "random") UI.draft = randomDim(Math.floor(Math.random() * 1e9)); refresh(); break;
      case "draft": {
        const f = {}; document.querySelectorAll(".dm-add [data-dm-f]").forEach(x => { f[x.dataset.dmF] = x.value.trim(); });
        if (UI.adding === "random") { UI.draft = randomDim(Math.floor(Math.random() * 1e9)); refresh(); break; }
        if ((UI.adding === "lore" && !f.name) || (UI.adding === "custom" && !f.text)) { UI.msg = "Say which plane, or describe it, first."; refresh(); break; }
        UI.busy = true; UI.msg = ""; refresh();
        try { const dd = await askDim(UI.adding, f); if (!dd) UI.msg = "Working it out needs Claude, from the app or Claude's page. One at random works without."; else UI.draft = f.mirror ? asMirror(dd) : dd; } catch (x) { UI.msg = x.message; }
        UI.busy = false; refresh(); break;
      }
      case "keep": if (UI.draft) { let id = UI.draft.id; while (dimOf(id) && !(docs()["dim:" + id])) id += "-2"; UI.draft.id = id; S().set("cosmos", "dim:" + id, { def: UI.draft, t: Date.now() }); UI.sel = id; UI.adding = null; UI.draft = null; joinFactions(); api.note("Kept. Make each layer's map from its card."); refresh(); } break;
    }
  });

  // (the search: the dimensions and their layers; and the trail of a layer's map comes back to its dimension here)
  (A.searchers = A.searchers || []).push({ kind: "Planes", order: 20, mod: ["dimensions"], find: q => { const out = []; for (const d of cosmos().dimensions) { const x = A.nav && A.nav.hit(d.name, [d.kind, d.desc, d.summary].join(" "), q, "A dimension"); if (x) out.push(Object.assign(x, { go: () => { UI.sel = d.id; api.open("dims"); } })); for (const l of d.layers || []) { const y = A.nav && A.nav.hit(l.name, [l.desc, l.summary, l.concept].join(" "), q, "A layer of " + d.name); if (y) out.push(Object.assign(y, { go: () => { UI.sel = d.id; api.open("dims"); } })); } } return out.slice(0, 30); } });
  A.cosmosShow = id => { if (dimOf(id)) UI.sel = id; refresh(); };
  TU.addTab({ key: "dims", label: "Dimensions", icon: "board", group: "prep", after: "factions", desc: "The planes beyond the world: their layers, their maps, the ways between, and where the sources disagree",
    html, status: () => { const C = cosmos(); const w = C.dimensions.reduce((n, d) => n + waiting(d).length, 0); return w ? `${w} to choose` : C.dimensions.length ? `${C.dimensions.length}` : ""; },
    init(store) {
      joinFactions(); joinEvents();
      // the layers' maps made before come back with the page: named at once, their land from this browser's keeping
      store.watch("dimworlds", D => { for (const [id, x] of Object.entries(D || {})) { if (!x || !x.dim || (A.worlds && A.worlds[id] && A.worlds[id].data)) continue; const d = dimOf(x.dim), l = d && layerOf(d, x.layer); if (!l) continue; if (x.key === "mirror") { try { register(d, l, mirrorTerrain(d, l)); } catch (e) { register(d, l, null); } continue; } register(d, l, null); if (A.worldGenCache && x.key) A.worldGenCache(x.key).then(T => { if (T) register(d, l, T); }); } });
      store.watch("cosmos", () => { if (api.tab() === "dims") api.render(); });
    }
  });
  A.cosmosApi = { cosmos, dimOf, layersOf, recipe, envOf, layerMap, mirrorTerrain, asMirror, randomDim, waiting, chosen, said, partyHere, leave };
})(ATLAS);
