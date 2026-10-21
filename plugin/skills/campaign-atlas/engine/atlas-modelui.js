/* Furnishing a map with models from the library (atlas-models.js), inside the map editor (atlas-mapedit.js). The user
   asked (21 Oct 2026) for "a massive multi-genre 3D asset library" in the editor: the library to browse, search and
   filter, with its kits, favourites and what was used lately, and a rotating preview of each model in its variants;
   models brought in from .glb files; models put down, moved, turned, sized, raised, stacked, copied and taken away,
   with snapping and undo; and a floor seen in 3D, from the editor and from any place's maps. */
(function (A) {
  "use strict";
  if (!A.models || !A.mapEditor) return;
  const M = A.models, esc = A.esc, C = A.C;
  const $ = s => document.querySelector(s);
  const copy = o => JSON.parse(JSON.stringify(o));
  const store = (k, d) => { try { const v = localStorage.getItem(A.config.storageKey + "-ml-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const keep = (k, v) => { try { localStorage.setItem(A.config.storageKey + "-ml-" + k, JSON.stringify(v)); } catch (e) {} };
  // the library's state, remembered in this browser: what is searched and filtered, which model is open
  const L = Object.assign({ q: "", cat: "", sub: "", genre: [], fam: [], cond: "", env: "", sort: "best", view: "all", shown: 60 }, store("ui", {}));
  L.pick = null; L.imp = null;
  let favs = store("fav", []), recent = store("recent", []), api = null, preview = null, previewFor = "", observer = null;
  const saveUI = () => keep("ui", { q: L.q, cat: L.cat, sub: L.sub, genre: L.genre, fam: L.fam, cond: L.cond, env: L.env, sort: L.sort, view: L.view });
  const IC = {
    furnish: `<path d="M6 11V6.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V11"/><path d="M4 11.5h16v4H4zM6 15.5V20M18 15.5V20"/>`,
    lib: `<path d="M4 4.5h4v15H4zM10 4.5h4v15h-4z"/><path d="m16 5.2 3.8-1 3.2 14.8-3.8.9z"/>`,
    cube: `<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>`,
    star: `<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.8z"/>`,
    turn: `<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19 4.5v3.5h-3.5"/>`,
    snap: `<path d="M4 4.5h16v15H4z"/><path d="M9.3 4.5v15M14.7 4.5v15M4 9.5h16M4 14.5h16"/>`
  };
  const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ""}</svg>`;
  const E = () => api.E, F = () => api.cur();
  const P = () => { const f = F(); return f.P || (f.P = []); };

  /* ---- words for things */
  const CN = Object.fromEntries(M.CONDS), GN = Object.fromEntries(M.GENRES), FN = Object.fromEntries(M.FAMILIES);
  const COLOURS = { black: "Black", white: "White", grey: "Grey", red: "Red", blue: "Blue", green: "Green", yellow: "Yellow", orange: "Orange", teal: "Teal", pink: "Pink", cyan: "Cyan", magenta: "Magenta", amber: "Amber", violet: "Violet", purple: "Purple", brown: "Brown", amberx: "" };
  function matName(k) {
    const m = /^(p|glow|paint|glass|screen|book)(.*)$/.exec(k), c = m && (COLOURS[m[2]] || (m[2] ? m[2][0].toUpperCase() + m[2].slice(1) : ""));
    if (m && m[1] === "p" && COLOURS[m[2]]) return c + " plastic";
    if (m && m[1] === "glow") return (c || "White") + " light";
    if (m && m[1] === "paint") return c + " paint";
    if (m && m[1] === "glass") return c ? c + " glass" : "Glass";
    if (m && m[1] === "screen") return m[2] === "off" ? "Dark screen" : "Screen";
    const named = { hullwhite: "White hull plating", hullgrey: "Grey hull plating", blackmetal: "Black metal", gunmetal: "Gunmetal", leatherblack: "Black leather", leatherred: "Red leather", mossstone: "Mossy stone", darkstone: "Dark stone", leafdark: "Dark leaves", leafautumn: "Autumn leaves", fruitred: "Red fruit", glowcyan: "Cyan light", sandbag: "Sacking", khaki: "Khaki", olive: "Olive drab" };
    return named[k] || k[0].toUpperCase() + k.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  const MOUNTS = { floor: "On the floor", wall: "On a wall", ceiling: "From the ceiling" }, ENVS = { in: "Indoors", out: "Outdoors", both: "Indoors and out" };
  const metres = v => (Math.round(v * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " m";

  /* ---- a placed model: its size and footprint in squares */
  const sqm = () => M.sq();
  function foot(p) { const e = M.entry(p.a), [w, d] = e ? M.dims(e, p) : [1, 1], s = p.s || 1; return [Math.max(.12, w * s / sqm()), Math.max(.12, d * s / sqm())]; }
  function corners(p) { const [w, d] = foot(p), a = (p.r || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, y]) => [p.x + x * c - y * s, p.y + x * s + y * c]); }
  function hit(p, x, y) { const [w, d] = foot(p), a = -(p.r || 0) * Math.PI / 180, dx = x - p.x, dy = y - p.y, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); return Math.abs(lx) <= w / 2 + .05 && Math.abs(ly) <= d / 2 + .05; }
  function propAt(x, y) { const list = P(); let best = -1, bz = -1; list.forEach((p, i) => { if (!hit(p, x, y)) return; const e = M.entry(p.a), z = (p.z || 0) + (e && e.mount === "ceiling" ? 9 : e && e.mount === "wall" ? 5 : 0) + i * 1e-4; const [w, d] = foot(p), small = 1 / (w * d + .01) * 1e-3; if (z + small > bz) { bz = z + small; best = i; } }); return best; }
  const sel = () => { const n = P().length; return (E().psel || []).filter(i => i < n); };
  const setSel = l => { E().psel = l; };

  /* ---- where a model goes when put down: snapped to the grid, against a wall, on a table */
  const SURF = new Set(["table", "counter", "cabinet", "chest", "crate", "barrel", "altar", "pallet", "platform", "stove", "appliance", "smithy", "office"]);
  const snapOn = () => E().snap !== false;
  const snapXY = v => snapOn() ? Math.round(v * 4) / 4 : Math.round(v * 100) / 100;
  const snapR = r => { r = ((r % 360) + 360) % 360; return snapOn() ? Math.round(r / 15) * 15 % 360 : Math.round(r) % 360; };
  function roomRect(x, y) { const R = F().R || []; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4] && A.isIndoorKind(r[6])) return r; } return null; }
  // a model for a wall, put against the nearest wall of the room it is in, facing into the room
  function toWall(p, x, y) {
    const r = roomRect(x, y); if (!r) return false;
    const [, d] = foot(Object.assign({}, p, { r: 0 })), dist = [["n", y - r[2]], ["s", r[2] + r[4] - y], ["w", x - r[1]], ["e", r[1] + r[3] - x]].sort((a, b) => a[1] - b[1])[0][0], off = d / 2 + .02;
    if (dist === "n") { p.y = r[2] + off; p.x = snapXY(x); p.r = 0; } else if (dist === "s") { p.y = r[2] + r[4] - off; p.x = snapXY(x); p.r = 180; } else if (dist === "w") { p.x = r[1] + off; p.y = snapXY(y); p.r = 270; } else { p.x = r[1] + r[3] - off; p.y = snapXY(y); p.r = 90; }
    return true;
  }
  // a small thing put down on a table (or a chest, a counter, a crate) stands on it
  function onTop(p, skip) {
    const e = M.entry(p.a); if (!e || e.mount !== "floor") return;
    const small = (e.tags || []).includes("small"); if (!small) { delete p.z; return; }
    let top = 0; P().forEach((q, i) => { if (skip && skip.includes(i)) return; const f = M.entry(q.a); if (!f || !SURF.has(f.f) || (f.tags || []).includes("small") || !hit(q, p.x, p.y)) return; top = Math.max(top, (q.z || 0) + M.dims(f, q)[2] * (q.s || 1)); });
    if (top > 0) p.z = Math.round(top * 1000) / 1000; else delete p.z;
  }
  function settle(p, x, y, skip) {
    const e = M.entry(p.a);
    p.x = snapXY(x); p.y = snapXY(y);
    if (e && e.mount === "wall" && E().wallSnap !== false) toWall(p, x, y);
    const f = F(); p.x = Math.max(0, Math.min(f.w, p.x)); p.y = Math.max(0, Math.min(f.h, p.y));
    onTop(p, skip);
    return p;
  }
  const clean = p => { const o = { a: p.a, x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 }; if (p.r) o.r = p.r; if (p.s && p.s !== 1) o.s = Math.round(p.s * 1000) / 1000; if (p.z) o.z = Math.max(0, Math.round(p.z * 1000) / 1000); for (const k of ["c", "m", "col", "h"]) if (p[k]) o[k] = p[k]; if (p.p && Object.keys(p.p).length) o.p = p.p; return o; };
  const remember = id => { recent = [id].concat(recent.filter(x => x !== id)).slice(0, 30); keep("recent", recent); };

  // a kit's arrangement is laid out in five-foot squares; on a map with other squares it keeps its real distances
  const kitScale = () => 1.524 / sqm();
  /* ---- on the map: what is chosen, the model being put down, the box being drawn */
  function ghostInner(spec, r) {
    const one = (sp, dx, dy, rr) => {
      const e = M.entry(sp.a); if (!e) return "";
      const [w, d] = foot(sp), ic = M.icon(sp); if (!ic) M.want(sp);
      const t = `translate(${dx * C} ${dy * C}) rotate(${rr || 0}) scale(${sp.s || 1})`, k = sqm();
      return ic && !ic.missing ? `<image href="${ic.url}" x="${(-ic.w / 2 + (ic.cx || 0)) / k * C}" y="${(-ic.d / 2 + (ic.cz || 0)) / k * C}" width="${ic.w / k * C}" height="${ic.d / k * C}" transform="${t}" preserveAspectRatio="none"/>`
        : `<rect x="${-w * C / 2 / (sp.s || 1)}" y="${-d * C / 2 / (sp.s || 1)}" width="${w * C / (sp.s || 1)}" height="${d * C / (sp.s || 1)}" transform="${t}" rx="3" class="me-pg-box"/>`;
    };
    if (spec.set) { const k = kitScale(); return spec.set.map(([id, dx, dy, rr, o]) => { const a = (r || 0) * Math.PI / 180; dx *= k; dy *= k; return one(Object.assign({ a: id }, o || {}), dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a), (rr || 0) + (r || 0)); }).join(""); }
    return one(spec, 0, 0, r);
  }
  function overlay() {
    const e = E(); let s = "";
    if (e.tool === "furnish" || sel().length) {
      const l = sel();
      for (const i of l) { const p = P()[i]; if (!p) continue; s += `<polygon class="me-psel" points="${corners(p).map(([x, y]) => `${(x * C).toFixed(1)},${(y * C).toFixed(1)}`).join(" ")}"/>`; }
      if (l.length === 1) { const p = P()[l[0]], [, d] = foot(p), a = (p.r || 0) * Math.PI / 180, hx = p.x + Math.sin(a) * (d / 2 + .55), hy = p.y - Math.cos(a) * (d / 2 + .55); s += `<line class="me-prot-l" x1="${p.x * C}" y1="${p.y * C}" x2="${hx * C}" y2="${hy * C}"/><circle class="me-prot" cx="${hx * C}" cy="${hy * C}" r="7"><title>Drag to turn</title></circle>`; }
    }
    if (e.place) s += `<g class="me-pghost" visibility="hidden" transform="translate(0 0)">${ghostInner(e.place.spec, e.place.r)}</g>`;
    return s + `<rect class="me-pbox" x="0" y="0" width="0" height="0" visibility="hidden"/>`;
  }
  function moveGhost(x, y) {
    const g = $("#meCanvas .me-pghost"); if (!g) return;
    const pl = E().place; let px = snapXY(x), py = snapXY(y), r = pl.r || 0;
    if (!pl.spec.set) { const p = settle(Object.assign({}, pl.spec, { r }), x, y); px = p.x; py = p.y; if (p.r !== r) { r = p.r; g.innerHTML = ghostInner(pl.spec, r); } else if (g.dataset.r !== String(r)) g.innerHTML = ghostInner(pl.spec, r); g.dataset.r = r; }
    g.setAttribute("transform", `translate(${px * C} ${py * C})`); g.setAttribute("visibility", "visible");
  }

  /* ---- putting a model (or a kit) down */
  function startPlacing(spec, label) {
    const e = E(); closeLib();
    e.place = { spec: copy(spec), r: 0, label: label || ((M.entry(spec.a) || {}).n) || "" };
    if (e.tool !== "furnish") e.tool = "furnish";
    setSel([]); api.paint();
    api.tip(`Click the map to put ${e.place.label ? "the " + e.place.label.toLowerCase() : "it"} down; keep clicking for more. R turns it, Esc stops.`);
  }
  function stopPlacing() { const e = E(); if (!e.place) return; e.place = null; api.paint(); }
  function placeAt(x, y) {
    const pl = E().place; if (!pl) return;
    if (pl.spec.set) {
      const a = (pl.r || 0) * Math.PI / 180, cx = snapXY(x), cy = snapXY(y), add = [], k = kitScale();
      for (let [id, dx, dy, rr, o] of pl.spec.set) { dx *= k; dy *= k; if (!M.entry(id)) continue; const p = Object.assign({ a: id }, o || {}); p.x = cx + dx * Math.cos(a) - dy * Math.sin(a); p.y = cy + dx * Math.sin(a) + dy * Math.cos(a); p.r = snapR((rr || 0) + (pl.r || 0)); const f = F(); if (p.x < 0 || p.y < 0 || p.x > f.w || p.y > f.h) continue; add.push(p); }
      api.change(() => { const list = P(), n0 = list.length; for (const p of add) { onTop(p); list.push(clean(p)); } setSel(add.map((_, k) => n0 + k)); });
      E().place = null; api.paint(); api.tip(`The ${pl.label.toLowerCase()} is down: ${add.length} models. Move or remove any of them; Undo takes the lot away.`);
      return;
    }
    const p = settle(Object.assign({}, pl.spec, { r: pl.r || 0 }), x, y);
    api.change(() => { P().push(clean(p)); setSel([P().length - 1]); });
    remember(pl.spec.a);
  }

  /* ---- changing what is chosen */
  function edit(fn) { const l = sel(); if (!l.length) return; api.change(() => { for (const i of l) fn(P()[i], i); for (const i of l) P()[i] = clean(P()[i]); }); }
  function removeSel() { const l = sel(); if (!l.length) return; api.change(() => { const f = F(); f.P = P().filter((_, i) => !l.includes(i)); setSel([]); }); }
  function copySel(cut) {
    const l = sel(); if (!l.length) return;
    const ps = l.map(i => copy(P()[i])), cx = ps.reduce((a, p) => a + p.x, 0) / ps.length, cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    keep("clip", { props: ps.map(p => Object.assign(p, { x: p.x - cx, y: p.y - cy })), t: Date.now() });
    if (cut) removeSel(); api.tip(`${ps.length === 1 ? "One model" : ps.length + " models"} copied. Ctrl+V puts ${ps.length === 1 ? "it" : "them"} down where the pointer is, on any floor of any place.`);
  }
  function paste(at) {
    const clip = store("clip", null); if (!clip || !clip.props || !clip.props.length) return;
    const f = F(), c = at || E().lastPt || { x: f.w / 2, y: f.h / 2 };
    api.change(() => { const n0 = P().length; for (const q of clip.props) { const p = Object.assign({}, q, { x: Math.max(0, Math.min(f.w, snapXY(c.x + q.x))), y: Math.max(0, Math.min(f.h, snapXY(c.y + q.y))) }); P().push(clean(p)); } setSel(clip.props.map((_, k) => n0 + k)); });
  }
  function duplicate() { const l = sel(); if (!l.length) return; api.change(() => { const n0 = P().length; for (const i of l) { const p = copy(P()[i]); p.x = Math.min(F().w, p.x + .5); p.y = Math.min(F().h, p.y + .5); P().push(p); } setSel(l.map((_, k) => n0 + k)); }); }
  function turnSel(by) { const l = sel(); if (l.length > 1) { const ps = l.map(i => P()[i]), cx = ps.reduce((a, p) => a + p.x, 0) / ps.length, cy = ps.reduce((a, p) => a + p.y, 0) / ps.length, a = by * Math.PI / 180; edit(p => { const dx = p.x - cx, dy = p.y - cy; p.x = snapXY(cx + dx * Math.cos(a) - dy * Math.sin(a)); p.y = snapXY(cy + dx * Math.sin(a) + dy * Math.cos(a)); p.r = snapR((p.r || 0) + by); }); } else edit(p => { p.r = snapR((p.r || 0) + by); }); }

  /* ---- the panel beside the map */
  function side() {
    const e = E(); if (e.tool !== "furnish" && !sel().length) return "";
    if (e.place) {
      const sp = e.place.spec;
      return `<section class="me-fur"><h4>${icon("furnish")} Putting down</h4><div class="me-pl"><img class="me-plth" alt="" data-th='${esc(JSON.stringify(sp.set ? { a: sp.set[0][0] } : sp))}'><b>${esc(e.place.label)}</b></div>
        <p class="me-help">Click the map to put it down; keep clicking to put down more. <kbd>R</kbd> turns it (or the mouse wheel), <kbd>Esc</kbd> stops.${sp.set ? "" : " A small thing put down on a table stands on it; a thing for a wall goes against the nearest wall."}</p>
        <div class="me-row"><button type="button" data-pf="turnplace">${icon("turn")} Turn</button><button type="button" data-pf="stop">Stop</button><button type="button" data-pf="lib">${icon("lib")} Library</button></div></section>`;
    }
    const l = sel();
    if (l.length === 1) return propPanel(P()[l[0]]);
    if (l.length > 1) return `<section class="me-fur"><h4>${icon("furnish")} ${l.length} models chosen</h4>
      <div class="me-row"><button type="button" data-pf="turn-15">⟲ 15°</button><button type="button" data-pf="turn15">⟳ 15°</button><button type="button" data-pf="turn90">⟳ 90°</button></div>
      <label class="me-ck"><input type="checkbox" data-pv="h"${l.every(i => P()[i].h) ? " checked" : ""}> Hidden from the players</label>
      <div class="me-row"><button type="button" data-pf="dup">Duplicate</button><button type="button" data-pf="copy">Copy</button><button type="button" class="me-del" data-pf="del">Take them away</button></div>
      <p class="me-help">Drag any of them to move them all. Shift+click adds or takes one from the choice.</p></section>`;
    // nothing chosen: how it works, the library, what was used lately
    const rec = recent.filter(id => M.entry(id)).slice(0, 12);
    return `<section class="me-fur"><h4>${icon("furnish")} Furnish this floor</h4>
      <p class="me-help">Choose a model in the library and click the map to put it down. Click a model on the map to choose it: drag it to move it, drag its round handle to turn it. Drag across empty floor to choose several.</p>
      <button type="button" class="prim me-libbtn" data-pf="lib">${icon("lib")} Open the library</button>
      ${rec.length ? `<h5>Used lately</h5><div class="me-recent">${rec.map(id => `<button type="button" class="me-rc" data-qadd="${esc(id)}" title="${esc(M.entry(id).n)}"><img alt="${esc(M.entry(id).n)}" data-th='${esc(JSON.stringify({ a: id }))}'></button>`).join("")}</div>` : ""}
      <h5>Kits</h5><div class="me-kits">${M.kits().map(k => `<button type="button" data-kitset="${k.id}" title="${esc(k.d)}">${esc(k.n)}</button>`).join("")}</div>
      <p class="me-help">Keys: <kbd>R</kbd> turn, <kbd>[</kbd> <kbd>]</kbd> smaller and bigger, <kbd>PgUp</kbd> <kbd>PgDn</kbd> raise and lower, arrows nudge, <kbd>Ctrl+C</kbd> <kbd>Ctrl+V</kbd> copy and paste, <kbd>Ctrl+D</kbd> duplicate, <kbd>Del</kbd> take away.</p></section>`;
  }
  function propPanel(p) {
    const e = M.entry(p.a);
    if (!e) return `<section class="me-fur"><h4>Missing model</h4><p class="me-help">This map has a model called "${esc(p.a)}" that this page's library does not have. It is kept, and drawn as an outline.</p><button type="button" class="me-del" data-pf="del">Take it away</button></section>`;
    const pp = Object.assign({}, e.p, p.p || {}), main = Object.keys(e.p.m || {})[0], mat = p.m || (main ? e.p.m[main] : ""), alts = main ? M.alts(e.p.m[main]) : [];
    const ctl = M.ctl(e), [w, d, h] = M.dims(e, p), s = p.s || 1;
    const field = (k, label, v, step, min) => `<label class="me-num"><span>${label}</span><input type="number" data-pp="${k}" value="${Math.round(v * 100) / 100}" step="${step || .05}" min="${min == null ? .01 : min}"></label>`;
    const cols = ["c1", "c2", "c3", "col"].filter(k => k in e.p);
    return `<section class="me-fur"><h4>${icon("furnish")} ${esc(e.n)}</h4>
      <div class="me-pthumb"><img alt="" data-th='${esc(JSON.stringify(p))}'><div><span>${esc(e.c)} · ${esc(e.s)}</span><span>${esc(metres(w * s))} × ${esc(metres(d * s))}, ${esc(metres(h * s))} high</span>${e.custom ? `<span>Brought in by you</span>` : ""}</div></div>
      <div class="me-row"><button type="button" data-pf="turn-15" title="Turn left">⟲ 15°</button><button type="button" data-pf="turn15" title="Turn right">⟳ 15°</button><button type="button" data-pf="turn90">⟳ 90°</button></div>
      <div class="me-nums">${field("r", "Turned (°)", p.r || 0, 1, -360)}${field("s", "Size (×)", s, .05, .1)}${field("z", "Above the floor (m)", p.z || 0, .05, 0)}</div>
      ${e.k.length > 1 ? `<label class="me-f"><span>Condition</span><select data-pv="c">${e.k.map(k => `<option value="${k}"${(p.c || "new") === k ? " selected" : ""}>${esc(CN[k] || k)}</option>`).join("")}</select></label>` : ""}
      ${alts.length > 1 ? `<label class="me-f"><span>Made of</span><select data-pv="m">${alts.map(k => `<option value="${k}"${k === mat ? " selected" : ""}>${esc(matName(k))}</option>`).join("")}</select></label>` : ""}
      ${e.custom ? "" : `<label class="me-f me-colour"><span>Colour</span><span class="me-row"><input type="color" data-pv="col" value="${esc(p.col || "#a08060")}"${p.col ? "" : ` data-none="1"`}><button type="button" data-pf="nocol"${p.col ? "" : " disabled"}>As made</button></span></label>`}
      ${e.custom ? "" : `<details class="me-more"><summary>Its shape</summary><div class="me-nums">${field("w", "Wide (m)", pp.w)}${field("d", "Deep (m)", pp.d)}${field("h", "High (m)", pp.h)}</div>
        ${ctl.map(([k, label, , , , list]) => list ? `<label class="me-f"><span>${esc(label)}</span><select data-pq="${k}">${list.map(v => `<option value="${esc(v)}"${(pp[k] || "") === v ? " selected" : ""}>${esc(v ? v[0].toUpperCase() + v.slice(1) : "Nothing")}</option>`).join("")}</select></label>` : "").join("")}
        ${"text" in e.p ? `<label class="me-f"><span>Its words</span><input data-pq="text" value="${esc(pp.text || "")}" maxlength="40"></label>` : ""}
        ${cols.map(k => `<label class="me-f me-colour"><span>${k === "col" ? "Its light" : k === "c1" ? "Main colour" : k === "c2" ? "Second colour" : "Third colour"}</span><input type="color" data-pq="${k}" value="${esc(pp[k])}"></label>`).join("")}
        ${p.p ? `<button type="button" data-pf="reshape">As the library has it</button>` : ""}</details>`}
      <label class="me-ck"><input type="checkbox" data-pv="h"${p.h ? " checked" : ""}> Hidden from the players</label>
      <div class="me-row"><button type="button" data-pf="dup">Duplicate</button><button type="button" data-pf="copy">Copy</button><button type="button" data-pf="fav" aria-pressed="${favs.includes(p.a)}">${icon("star")}</button><button type="button" class="me-del" data-pf="del">Take it away</button></div></section>`;
  }

  /* ---- thumbnails, drawn as they come into view, a few at a time */
  const queue = []; let busy = false;
  function thumbs(root) {
    const imgs = [...(root || document).querySelectorAll("img[data-th]:not([src])")];
    if (!imgs.length) return;
    if (!observer && "IntersectionObserver" in window) observer = new IntersectionObserver(es => { for (const en of es) if (en.isIntersecting) { observer.unobserve(en.target); queue.push(en.target); } pump(); }, { rootMargin: "200px" });
    for (const im of imgs) { if (observer) observer.observe(im); else queue.push(im); }
    pump();
  }
  async function pump() {
    if (busy) return; busy = true;
    while (queue.length) {
      const im = queue.shift(); if (!im.isConnected || im.src) continue;
      let sp; try { sp = JSON.parse(im.dataset.th); } catch (e) { continue; }
      const box = im.closest(".ml-th"); if (box) box.classList.add("ml-busy");
      try { im.src = await M.thumb(sp); } catch (e) { const card = im.closest(".ml-card, .me-pthumb, .me-pl, .me-rc"); if (card) card.classList.add("ml-gone"); im.alt = "Not available"; im.removeAttribute("data-th"); }
      if (box) box.classList.remove("ml-busy");
      await new Promise(r => setTimeout(r, 0));
    }
    busy = false;
  }

  /* ---- the library */
  const filters = () => ({ cat: L.view === "all" ? L.cat : "", sub: L.view === "all" ? L.sub : "", genre: L.genre, fam: L.fam, cond: L.cond, env: L.env, sort: L.sort });
  function results() {
    const f = filters();
    if (L.view === "fav") f.ids = favs.slice(); else if (L.view === "recent") f.ids = recent.slice(); else if (L.view === "mine") f.ids = M.custom.filter(x => !x.hidden).map(x => x.id); else if (L.view.startsWith("kit:")) { const k = M.kits().find(x => "kit:" + x.id === L.view); f.ids = k ? k.ids : []; }
    let list = M.find(L.q, f);
    if (L.view === "recent" && !L.q) list.sort((a, b) => recent.indexOf(a.e.id) - recent.indexOf(b.e.id));
    return list;
  }
  function nav() {
    const base = M.find(L.q, Object.assign(filters(), { cat: "", sub: "" })), by = {}, subs = {};
    for (const r of base) { by[r.e.c] = (by[r.e.c] || 0) + 1; const k = r.e.c + "|" + r.e.s; subs[k] = (subs[k] || 0) + 1; }
    const item = (view, cat, sub, label, n, cls) => `<button type="button" class="ml-nv ${cls || ""}" data-nv="${esc(view)}" data-cat="${esc(cat || "")}" data-sub="${esc(sub || "")}" aria-pressed="${L.view === view && (L.cat || "") === (cat || "") && (L.sub || "") === (sub || "")}">${label}<i>${n}</i></button>`;
    const mine = M.custom.filter(x => !x.hidden).length;
    let h = item("all", "", "", "Everything", base.length) + item("fav", "", "", `${icon("star")} Favourites`, favs.filter(id => M.entry(id)).length) + item("recent", "", "", "Used lately", recent.filter(id => M.entry(id)).length) + item("kits", "", "", `${icon("cube")} Kits`, M.kits().length) + (mine ? item("mine", "", "", "Your own models", mine) : "");
    h += `<div class="ml-nvh">Categories</div>`;
    for (const [c, ss] of M.cats()) {
      h += item("all", c, "", esc(c), by[c] || 0, "ml-cat");
      if (L.view === "all" && L.cat === c) for (const s of ss) h += item("all", c, s, esc(s), subs[c + "|" + s] || 0, "ml-sub");
    }
    return h;
  }
  function card(r) {
    const e = r.e, sp = { a: e.id }; if (r.cond && e.k.includes(r.cond) && r.cond !== "new") sp.c = r.cond;
    return `<div class="ml-card" data-a="${esc(e.id)}" data-c="${esc(sp.c || "")}" tabindex="0" role="button" aria-label="${esc(e.n)}" aria-pressed="${L.pick && L.pick.a === e.id}">
      <div class="ml-th"><img alt="" data-th='${esc(JSON.stringify(sp))}'></div><b>${esc(e.n)}</b><span>${esc(e.s)}${e.mount !== "floor" ? " · " + (e.mount === "wall" ? "wall" : "ceiling") : ""}</span>
      <button type="button" class="ml-star" data-fav="${esc(e.id)}" aria-pressed="${favs.includes(e.id)}" title="Favourite">${icon("star")}</button><button type="button" class="ml-add" data-qadd="${esc(e.id)}" data-c="${esc(sp.c || "")}" title="Put it on the map">+</button></div>`;
  }
  function kitCard(k) {
    const ok = k.ids.filter(id => M.entry(id)).length;
    return `<div class="ml-kit"><div class="ml-kitth">${k.ids.slice(0, 4).map(id => `<img alt="" data-th='${esc(JSON.stringify({ a: id }))}'>`).join("")}</div><h4>${esc(k.n)}</h4><p>${esc(k.d)}</p><p class="ml-kitg">${k.g.map(g => esc(GN[g] || g)).join(" · ")} · ${ok} models</p>
      <div class="me-row"><button type="button" data-kitshow="${k.id}">See its models</button><button type="button" class="prim" data-kitset="${k.id}">Put the whole set down</button></div></div>`;
  }
  function paintList(more) {
    const box = $("#mlLib .ml-grid"), mbox = $("#mlLib .ml-more"); if (!box) return;
    if (L.view === "kits") { box.innerHTML = `<div class="ml-kits">${M.kits().map(kitCard).join("")}</div>`; mbox.innerHTML = ""; $("#mlLib .ml-count").textContent = `${M.kits().length} kits`; thumbs(box); return; }
    const list = results(), shown = Math.min(list.length, L.shown);
    if (!more) box.scrollTop = 0;
    const narrowed = L.q || L.genre.length || L.fam.length || L.cond || L.env;
    box.innerHTML = list.length ? list.slice(0, shown).map(card).join("") : `<p class="ml-none">${narrowed ? "Nothing matches. Try fewer words, or clear the filters." : L.view === "fav" ? "No favourites yet: the star on a model keeps it here." : L.view === "recent" ? "Nothing used yet." : L.view === "mine" ? "Nothing brought in yet: Bring in a model takes a .glb file." : "Nothing here."}</p>`;
    const kit = L.view.startsWith("kit:") ? M.kits().find(x => "kit:" + x.id === L.view) : null;
    mbox.innerHTML = (shown < list.length ? `<button type="button" data-ml="more">Show more (${list.length - shown} left)</button>` : "") + (kit ? `<button type="button" class="prim" data-kitset="${kit.id}">Put the whole ${esc(kit.n.toLowerCase())} set down</button>` : "");
    $("#mlLib .ml-count").textContent = `${list.length} model${list.length === 1 ? "" : "s"}${kit ? " in the " + kit.n.toLowerCase() + " kit" : ""}`;
    thumbs(box);
  }
  function paintNav() { const n = $("#mlLib .ml-nav"); if (n) n.innerHTML = nav(); }
  function paintFilters() {
    const f = $("#mlLib .ml-filters"); if (!f) return;
    f.innerHTML = `<div class="ml-chips"><span>Genre</span>${M.GENRES.map(([k, l]) => `<button type="button" data-chip="genre" data-v="${k}" aria-pressed="${L.genre.includes(k)}">${esc(l)}</button>`).join("")}</div>
      <div class="ml-chips"><span>Made of</span>${M.FAMILIES.map(([k, l]) => `<button type="button" data-chip="fam" data-v="${k}" aria-pressed="${L.fam.includes(k)}">${esc(l)}</button>`).join("")}</div>
      <div class="ml-row2"><label><span>Condition</span><select data-lf="cond"><option value="">Any</option>${M.CONDS.map(([k, l]) => `<option value="${k}"${L.cond === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
        <label><span>Where</span><select data-lf="env"><option value="">Anywhere</option><option value="in"${L.env === "in" ? " selected" : ""}>Indoors</option><option value="out"${L.env === "out" ? " selected" : ""}>Outdoors</option></select></label>
        <label><span>Order</span><select data-lf="sort"><option value="best"${L.sort === "best" ? " selected" : ""}>Best match</option><option value="name"${L.sort === "name" ? " selected" : ""}>By name</option><option value="size"${L.sort === "size" ? " selected" : ""}>Biggest first</option></select></label>
        <button type="button" data-ml="clear"${L.genre.length || L.fam.length || L.cond || L.env || L.q ? "" : " disabled"}>Clear all</button><span class="ml-count" aria-live="polite"></span></div>`;
  }
  // the model open on the right: a rotating preview, what it is, and its variants
  function paintDetail() {
    const box = $("#mlLib .ml-detail"); if (!box) return;
    if (L.imp) return paintImport(box);
    const sp = L.pick, e = sp && M.entry(sp.a);
    if (!e) { stopPreview(); box.innerHTML = `<div class="ml-empty">${icon("cube")}<p>Choose a model to see it turning, change how it is made, and put it on the map.</p><p class="me-help">Search with plain words: <i>rusty barrel</i>, <i>wooden chair</i>, <i>sci-fi crate</i>, <i>glowing</i>. The filters narrow it by genre, what it is made of, its condition, indoors or out.</p></div>`; return; }
    const main = Object.keys(e.p.m || {})[0], mat = sp.m || (main ? e.p.m[main] : ""), alts = main ? M.alts(e.p.m[main]) : [], [w, d, h] = M.dims(e, sp), sqs = A.config.grid || { unit: 5, name: "ft" };
    box.innerHTML = `<div class="ml-prev" aria-label="A turning preview of ${esc(e.n)}: drag to turn it, the wheel to come closer"><span class="ml-pl">Loading the model…</span></div>
      <h3>${esc(e.n)}</h3><p class="ml-where">${esc(e.c)} · ${esc(e.s)}</p>
      <dl class="ml-facts"><dt>Genres</dt><dd>${e.g.map(g => esc(GN[g] || g)).join(", ") || "Any"}</dd>
        ${e.mats.length ? `<dt>Made of</dt><dd>${[...new Set(e.mats)].map(k => esc(matName(k))).join(", ")}</dd>` : ""}
        <dt>Size</dt><dd>${esc(metres(w))} wide, ${esc(metres(d))} deep, ${esc(metres(h))} high (${(w / M.sq()).toFixed(1)} × ${(d / M.sq()).toFixed(1)} squares of ${esc(String(sqs.unit))} ${esc(sqs.name)})</dd>
        <dt>Goes</dt><dd>${esc(MOUNTS[e.mount] || e.mount)}, ${esc((ENVS[e.e] || "").toLowerCase())}</dd>
        <dt>Made by</dt><dd>${esc(e.src)}</dd><dt>Licence</dt><dd>${esc(e.lic)}</dd></dl>
      ${e.k.length > 1 ? `<label class="me-f"><span>Condition</span><select data-pk="c">${e.k.map(k => `<option value="${k}"${(sp.c || "new") === k ? " selected" : ""}>${esc(CN[k] || k)}</option>`).join("")}</select></label>` : ""}
      ${alts.length > 1 ? `<label class="me-f"><span>Made of</span><select data-pk="m">${alts.map(k => `<option value="${k}"${k === mat ? " selected" : ""}>${esc(matName(k))}</option>`).join("")}</select></label>` : ""}
      ${e.custom ? "" : `<label class="me-f me-colour"><span>Colour</span><span class="me-row"><input type="color" data-pk="col" value="${esc(sp.col || "#a08060")}"><button type="button" data-ml="nocol"${sp.col ? "" : " disabled"}>As made</button></span></label>
      <details class="me-more"><summary>Its shape</summary><div class="me-nums">${["w", "d", "h"].map(k => `<label class="me-num"><span>${{ w: "Wide", d: "Deep", h: "High" }[k]} (m)</span><input type="number" data-pk="${k}" value="${Math.round(Object.assign({}, e.p, sp.p || {})[k] * 100) / 100}" step=".05" min=".01"></label>`).join("")}</div>
        ${"text" in e.p ? `<label class="me-f"><span>Its words</span><input data-pk="text" value="${esc(Object.assign({}, e.p, sp.p || {}).text || "")}" maxlength="40"></label>` : ""}</details>`}
      <div class="me-row ml-go"><button type="button" class="prim" data-ml="place">Put it on the map</button><button type="button" data-fav="${esc(e.id)}" aria-pressed="${favs.includes(e.id)}" title="Favourite">${icon("star")}</button>${e.custom ? `<button type="button" class="me-del" data-ml="forget">Forget this model</button>` : ""}</div>`;
    startPreview(sp);
  }
  async function startPreview(sp) {
    const host = $("#mlLib .ml-prev"); if (!host) return;
    const e = M.entry(sp.a), key = JSON.stringify(sp);
    try {
      if (e && e.load && !e.gltf) await e.load();
      if (preview && preview.host === host) { preview.set(sp); previewFor = key; return; }
      stopPreview();
      preview = await M.preview(host, sp); preview.host = host; previewFor = key;
    } catch (err) { host.innerHTML = `<div class="ml-pl ml-bad">${e && e.custom ? "This model's file cannot be found or read here" : "The 3D preview cannot start in this browser"}${err && err.message ? ": " + esc(err.message) : ""}.</div>`; }
  }
  function stopPreview() { if (preview) { try { preview.dispose(); } catch (e) {} preview = null; previewFor = ""; } }
  function openLib(focus) {
    const lib = $("#mlLib"); if (!lib) return;
    lib.hidden = false; E().place = null;
    paintFilters(); paintNav(); paintList(); paintDetail();
    const q = lib.querySelector(".ml-q"); q.value = L.q; if (focus !== false) setTimeout(() => q.focus(), 30);
  }
  function closeLib() { const lib = $("#mlLib"); if (!lib || lib.hidden) return; lib.hidden = true; stopPreview(); }
  const pick = (id, c) => { L.pick = { a: id }; if (c) L.pick.c = c; L.imp = null; $("#mlLib .ml-grid").querySelectorAll(".ml-card").forEach(el => el.setAttribute("aria-pressed", el.dataset.a === id)); paintDetail(); };

  /* ---- a model brought in: a .glb (or a .gltf with everything inside it), checked, measured and named */
  async function importFile(file) {
    L.imp = { state: "reading", name: file.name }; L.pick = null; paintDetail();
    try {
      if (file.size > 15 * 1024 * 1024) throw new Error("it is bigger than 15 MB; a model for a map should be smaller (try exporting it with fewer polygons or smaller textures)");
      const buf = await file.arrayBuffer(), T = await M.three();
      const scene = await M.parseModel(/\.gltf$/i.test(file.name) ? new TextDecoder().decode(buf) : buf);
      if (!scene) throw new Error("it holds no scene");
      const m = M.measure(T, scene);
      if (!m.meshes) throw new Error("it has nothing in it to see");
      if (m.tris > 1500000) throw new Error(`it has ${m.tris.toLocaleString()} triangles, too many to draw on a map (at most 1,500,000)`);
      // models are usually made in metres; one taller than 20 is taken to be in centimetres
      const k = m.h > 20 ? .01 : 1, base = file.name.replace(/\.(glb|gltf)$/i, "").replace(/[_-]+/g, " ").trim();
      L.imp = { state: "form", name: file.name, buf, gltf: /\.gltf$/i.test(file.name), tris: m.tris, raw: m, meta: { n: base ? base[0].toUpperCase() + base.slice(1) : "My model", c: "Your own models", s: "Brought in", g: [], mount: "floor", e: "in", ry: 0, p: { h: Math.max(.05, Math.round(m.h * k * 100) / 100) } } };
      sizeImport();
    } catch (err) { L.imp = { state: "bad", name: file.name, why: String(err.message || err) }; }
    paintDetail();
  }
  function impEntry() { const I = L.imp; return Object.assign({ id: "my-preview" }, I.meta); }
  // its width and depth follow from its height, as it was drawn, turned as asked
  function sizeImport() { const I = L.imp, m = I.raw, k = m.h ? I.meta.p.h / m.h : 1, side = I.meta.ry === 90 || I.meta.ry === 270; I.meta.p.w = Math.max(.02, Math.round((side ? m.d : m.w) * k * 100) / 100); I.meta.p.d = Math.max(.02, Math.round((side ? m.w : m.d) * k * 100) / 100); }
  function paintImport(box) {
    const I = L.imp;
    if (I.state === "reading") { box.innerHTML = `<div class="ml-empty"><p>Reading ${esc(I.name)}…</p></div>`; return; }
    if (I.state === "bad") { box.innerHTML = `<div class="ml-empty ml-bad"><h3>This model cannot be used</h3><p>${esc(I.name)}: ${esc(I.why)}.</p><p class="me-help">Atlas reads .glb files, and .gltf files that carry everything inside them. Free models in that form: Kenney (kenney.nl), Quaternius, Poly Pizza, Sketchfab's downloadable models.</p><button type="button" data-ml="impx">Back to the library</button></div>`; return; }
    if (I.state === "saving") { box.innerHTML = `<div class="ml-empty"><p>Keeping ${esc(I.meta.n)}…</p></div>`; return; }
    const m = I.meta, cats = [...new Set(["Your own models"].concat(M.cats().map(c => c[0])))];
    box.innerHTML = `<div class="ml-prev"><span class="ml-pl">Loading the model…</span></div>
      <h3>Bring in ${esc(I.name)}</h3><p class="me-help">${I.tris.toLocaleString()} triangles. Say what it is, how tall it really is and which way it faces; it then joins the library and can be put on any map.</p>
      <label class="me-f"><span>Name</span><input data-im="n" value="${esc(m.n)}" maxlength="60"></label>
      <label class="me-f"><span>Category</span><select data-im="c">${cats.map(c => `<option${c === m.c ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="me-f"><span>What kind of thing</span><input data-im="s" value="${esc(m.s)}" maxlength="40" placeholder="Chairs, statues, machines…"></label>
      <div class="ml-chips"><span>Genre</span>${M.GENRES.map(([k, l]) => `<button type="button" data-imchip="${k}" aria-pressed="${m.g.includes(k)}">${esc(l)}</button>`).join("")}</div>
      <div class="me-nums"><label class="me-num"><span>How tall (m)</span><input type="number" data-im="h" value="${m.p.h}" step=".05" min=".02"></label>
        <label class="me-num"><span>Turned (°)</span><select data-im="ry">${[0, 90, 180, 270].map(a => `<option value="${a}"${m.ry === a ? " selected" : ""}>${a}</option>`).join("")}</select></label></div>
      <label class="me-f"><span>Where it goes</span><select data-im="mount">${Object.entries(MOUNTS).map(([k, l]) => `<option value="${k}"${m.mount === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <label class="me-f"><span>Indoors or out</span><select data-im="e">${Object.entries(ENVS).map(([k, l]) => `<option value="${k}"${m.e === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <p class="me-help">Its front should face you in the preview when it is turned right.</p>
      <div class="me-row ml-go"><button type="button" class="prim" data-ml="impkeep">Keep it in the library</button><button type="button" data-ml="impx">Never mind</button></div>`;
    impPreview();
  }
  async function impPreview() {
    const host = $("#mlLib .ml-prev"); if (!host || !L.imp || !L.imp.buf) return;
    try {
      // shown as it will stand, under a name of its own that the library does not list
      const T = await M.three(), scene = await M.parseModel(L.imp.gltf ? new TextDecoder().decode(L.imp.buf) : L.imp.buf);
      M.dropCustom("my-preview"); const e = M.addCustom(Object.assign(impEntry(), { hidden: true })); e.gltf = M.normalise(T, scene, e);
      stopPreview(); preview = await M.preview(host, { a: "my-preview" }); preview.host = host;
    } catch (err) { host.innerHTML = `<div class="ml-pl ml-bad">The preview could not start: ${esc(err.message || err)}</div>`; }
  }
  // a .glb made into one .gltf file with its binary inside, for the page's asset store (which keeps text, not models)
  function glbToGltf(buf) {
    const dv = new DataView(buf); if (dv.getUint32(0, true) !== 0x46546c67) return null;
    let off = 12, json = null, bin = null;
    while (off < dv.byteLength) { const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true), body = buf.slice(off + 8, off + 8 + len); if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(body)); else if (type === 0x004e4942) bin = body; off += 8 + len; }
    if (!json) return null;
    if (bin && json.buffers && json.buffers[0]) { let s = ""; const u = new Uint8Array(bin); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); json.buffers[0].uri = "data:application/octet-stream;base64," + btoa(s); }
    return JSON.stringify(json);
  }
  const b64 = buf => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  async function keepImport() {
    const I = L.imp, S = api.store(); if (!I || !I.buf) return;
    const slug = (I.meta.n || "model").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "model", id = "my-" + slug + "-" + Math.random().toString(36).slice(2, 6);
    const meta = Object.assign({}, I.meta, { id, t: Date.now(), src: "Brought in by you: " + I.name, lic: "Yours (as you brought it in)" });
    I.state = "saving"; paintDetail();
    let where = "";
    try {
      if (window.ATLAS_APP && window.ATLAS_APP.saveModel) {
        // the Atlas app keeps the file with the campaign: it rides in the page when it is built again
        const data = b64(I.buf), r = await window.ATLAS_APP.saveModel(id, meta, data, I.gltf ? "gltf" : "glb");
        meta.url = r.url; M.blobs[id] = data;
        where = "Kept with the campaign: it stays when the campaign is rebuilt.";
      } else {
        let assets = null; try { assets = window.claude && window.claude.use ? await window.claude.use("assets") : null; } catch (e) { assets = null; }
        const text = I.gltf ? new TextDecoder().decode(I.buf) : glbToGltf(I.buf);
        if (assets && text) { const r = await assets.upload(new Blob([text], { type: "application/json" })); meta.url = r.url; meta.asset = r.id; meta.gltf = true; where = "Kept in this page's own store: everyone who opens it has it."; }
        else { await M.idb.put("models", id, I.buf); meta.local = true; where = "Kept in this browser only: this page cannot store files, so other computers will show it as missing."; }
      }
      M.dropCustom("my-preview"); M.addCustom(meta);
      if (S) S.set("assetlib", id, Object.assign({}, meta));
      L.imp = null; L.view = "mine"; L.q = ""; L.pick = { a: id }; const qi = $("#mlLib .ml-q"); if (qi) qi.value = ""; saveUI(); paintFilters(); paintNav(); paintList(); paintDetail(); api.tip(where);
    } catch (err) { I.state = "form"; paintDetail(); api.tip("It could not be kept: " + (err.message || err)); }
  }
  function forget(id) {
    const e = M.entry(id), S = api.store(); if (!e || !e.custom) return;
    if (S) S.set("assetlib", id, { off: true, t: Date.now() });
    if (window.ATLAS_APP && window.ATLAS_APP.saveModel) window.ATLAS_APP.saveModel(id, null).catch(() => {});
    if (e.local) M.idb.del("models", id);
    M.dropCustom(id); L.pick = null; paintNav(); paintList(); paintDetail();
    api.tip("Forgotten. Maps that use it show an outline marked missing.");
  }

  /* ---- a floor in 3D */
  let three = null;
  async function show3D(host, id, fi, o) {
    if (three) { try { three.dispose(); } catch (e) {} three = null; }
    host.innerHTML = `<p class="m3-wait">Building the room…</p>`;
    try { three = await M.room3D(host, id, fi, o); }
    catch (err) { host.innerHTML = `<p class="m3-wait">The 3D view cannot start here: ${esc(err.message || err)}</p>`; }
  }
  function close3D() { if (three) { try { three.dispose(); } catch (e) {} three = null; } }
  function editor3D(low) {
    const box = $("#meThree"); if (!box) return; box.hidden = false;
    const e = E(), f = F(); box.querySelector(".m3-t").textContent = `${f.n || "This floor"} in 3D`;
    box.querySelector('[data-pf="walls"]').textContent = low ? "Tall walls" : "Low walls"; box.dataset.low = low ? "1" : "";
    show3D(box.querySelector(".m3-view"), e.id, e.fi, { map: { floors: e.draft.floors.map(api.finished) }, svg: (id, fi, view, pre) => api.draftSVG(fi, view, pre), low });
  }
  function page3D(id, fi, low) {
    let dlg = document.getElementById("m3Dlg");
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "m3Dlg"; dlg.className = "m3-dlg";
      dlg.innerHTML = `<div class="m3-bar"><b class="m3-t"></b><div class="lm-floors m3-fl"></div><span class="t-sp"></span><button type="button" data-m3="walls">Low walls</button><button type="button" data-m3="x">Close</button></div><div class="m3-view"></div><p class="m3-help">Drag to turn, the wheel to come closer, right-drag to slide.</p>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("close", close3D);
      dlg.addEventListener("click", ev => {
        const b = ev.target.closest("[data-m3], [data-m3f]"); if (!b) return;
        if (b.dataset.m3 === "x") dlg.close();
        else if (b.dataset.m3 === "walls") page3D(dlg.dataset.id, +dlg.dataset.fi, !dlg.dataset.low);
        else page3D(dlg.dataset.id, +b.dataset.m3f, !!dlg.dataset.low);
      });
    }
    const Mp = A.get(id), pv = document.getElementById("app") && document.getElementById("app").dataset.mode === "player";
    dlg.dataset.id = id; dlg.dataset.fi = fi; dlg.dataset.low = low ? "1" : "";
    dlg.querySelector(".m3-t").textContent = `${(A.meta[id] || {}).name || Mp.t}: ${Mp.floors[fi].n}`;
    dlg.querySelector('[data-m3="walls"]').textContent = low ? "Tall walls" : "Low walls";
    dlg.querySelector(".m3-fl").innerHTML = Mp.floors.map((G, i) => pv && A.isGmFloor(G) ? "" : `<button type="button" data-m3f="${i}" aria-pressed="${i === fi}">${esc(G.n)}</button>`).join("");
    if (!dlg.open) dlg.showModal();
    show3D(dlg.querySelector(".m3-view"), id, fi, { low, view: pv || A.state.v === "player" ? "player" : "gm" });
  }

  /* ---- the plug: the editor's Furnish tool */
  A.mapEditor.plug({
    tools: [["furnish", "Furnish", "Put models from the library on the map: furniture, props, machines, trees, walls and doors. Choose one in the library, then click the map."]],
    icons: { furnish: IC.furnish },
    topHTML: () => `<button type="button" data-pf="lib" title="The model library (L)">${icon("lib")}<span>Library</span></button><button type="button" data-pf="snap" class="me-snap" title="Snap models to quarter squares and 15° turns">${icon("snap")}<span>Snap</span></button><button type="button" data-pf="3d" title="See this floor in 3D">${icon("cube")}<span>3D</span></button>`,
    bodyHTML: () => `<div class="ml" id="mlLib" hidden role="dialog" aria-label="The model library">
        <div class="ml-head">${icon("lib")}<b>The model library</b><input type="search" class="ml-q" placeholder="Search: rusty barrel, wooden chair, sci-fi crate…" aria-label="Search the library">
          <label class="ml-imp" title="A .glb file (or a .gltf with everything inside it)">Bring in a model<input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" data-ml-import></label><button type="button" data-ml="close">Close</button></div>
        <div class="ml-filters"></div>
        <div class="ml-main"><nav class="ml-nav" aria-label="Categories"></nav><div class="ml-list"><div class="ml-grid"></div><div class="ml-more"></div></div><aside class="ml-detail"></aside></div></div>
      <div class="m3 me-three" id="meThree" hidden><div class="m3-bar"><b class="m3-t"></b><span class="t-sp"></span><button type="button" data-pf="walls">Low walls</button><button type="button" data-pf="x3d">Back to the map</button></div><div class="m3-view"></div><p class="m3-help">Drag to turn, the wheel to come closer, right-drag to slide. What you see is the map as it is now, before saving.</p></div>`,
    open(a) { api = a; const e = E(); e.psel = []; e.place = null; e.pdrag = null; if (e.snap == null) e.snap = store("snap", true); const box = $("#meThree"); if (box) { box.hidden = true; close3D(); } closeLib(); bindOnce(); },
    top(a, dlg) { const b = dlg.querySelector('[data-pf="snap"]'); if (b) b.setAttribute("aria-pressed", snapOn()); },
    // Esc closes what is open on top of the map first: the library, the 3D view; then stops putting down, then lets go
    cancel() {
      const lib = $("#mlLib"), t3 = $("#meThree"), ed = E();
      if (lib && !lib.hidden) { closeLib(); return true; }
      if (t3 && !t3.hidden) { t3.hidden = true; close3D(); return true; }
      if (ed.place) { stopPlacing(); return true; }
      if (sel().length) { setSel([]); api.paintCanvas(); api.paintSide(); return true; }
      return false;
    },
    side: () => side(),
    overlay: () => overlay(),
    down(e, p) {
      const ed = E(); ed.lastPt = p;
      if (ed.tool !== "furnish") return false;
      if (e.button === 2) { if (ed.place) { stopPlacing(); return true; } return false; }
      if (e.button && e.button !== 0) return false;
      if (ed.place) { placeAt(p.x, p.y); return true; }
      const l = sel();
      if (l.length === 1) { const q = P()[l[0]], [, d] = foot(q), a = (q.r || 0) * Math.PI / 180, hx = q.x + Math.sin(a) * (d / 2 + .55), hy = q.y - Math.cos(a) * (d / 2 + .55); if (Math.hypot(p.x - hx, p.y - hy) < .35) { ed.pdrag = { kind: "rot", i: l[0], r0: q.r || 0, a0: Math.atan2(p.y - q.y, p.x - q.x) }; return true; } }
      const i = propAt(p.x, p.y);
      if (i >= 0) {
        if (e.shiftKey) { setSel(l.includes(i) ? l.filter(x => x !== i) : l.concat(i)); api.paintCanvas(); api.paintSide(); return true; }
        if (!l.includes(i)) setSel([i]);
        ed.pdrag = { kind: "move", x0: p.x, y0: p.y, idx: sel(), at: sel().map(j => [P()[j].x, P()[j].y]) };
        api.paintCanvas(); api.paintSide(); return true;
      }
      ed.pdrag = { kind: "box", x0: p.x, y0: p.y, add: e.shiftKey ? l : [] };
      if (!e.shiftKey && l.length) { setSel([]); api.paintCanvas(); api.paintSide(); }
      return true;
    },
    move(e, p) {
      const ed = E(); ed.lastPt = p; if (ed.tool !== "furnish") return false;
      if (ed.place && !ed.pdrag) { moveGhost(p.x, p.y); return true; }
      const d = ed.pdrag; if (!d) return false;
      if (d.kind === "move") {
        let dx = p.x - d.x0, dy = p.y - d.y0; if (snapOn()) { dx = Math.round(dx * 4) / 4; dy = Math.round(dy * 4) / 4; }
        if (Math.abs(dx) + Math.abs(dy) > 0) d.moved = true; d.dx = dx; d.dy = dy;
        d.idx.forEach((j, k) => { const q = P()[j]; $(`#meCanvas`).querySelectorAll(`.lm-prop[data-prop="${j}"]`).forEach(el => el.setAttribute("transform", `translate(${((d.at[k][0] + dx) * C).toFixed(1)} ${((d.at[k][1] + dy) * C).toFixed(1)}) rotate(${q.r || 0}) scale(${q.s || 1})`)); });
        $("#meCanvas").classList.add("me-dragging");
        return true;
      }
      if (d.kind === "rot") { const q = P()[d.i], a = Math.atan2(p.y - q.y, p.x - q.x), r = snapR(d.r0 + (a - d.a0) * 180 / Math.PI); d.r = r; d.moved = true; $(`#meCanvas`).querySelectorAll(`.lm-prop[data-prop="${d.i}"]`).forEach(el => el.setAttribute("transform", `translate(${(q.x * C).toFixed(1)} ${(q.y * C).toFixed(1)}) rotate(${r}) scale(${q.s || 1})`)); $("#meCanvas").classList.add("me-dragging"); return true; }
      if (d.kind === "box") { const r = $("#meCanvas .me-pbox"); if (r) { const x = Math.min(p.x, d.x0), y = Math.min(p.y, d.y0); r.setAttribute("x", x * C); r.setAttribute("y", y * C); r.setAttribute("width", Math.abs(p.x - d.x0) * C); r.setAttribute("height", Math.abs(p.y - d.y0) * C); r.setAttribute("visibility", "visible"); } d.x1 = p.x; d.y1 = p.y; return true; }
      return false;
    },
    up(e, p) {
      const ed = E(), d = ed.pdrag; if (!d) return false; ed.pdrag = null; $("#meCanvas").classList.remove("me-dragging");
      if (d.kind === "move") { if (!d.moved) { api.paintCanvas(); return true; } api.change(() => d.idx.forEach((j, k) => { const q = P()[j]; q.x = Math.max(0, Math.min(F().w, d.at[k][0] + d.dx)); q.y = Math.max(0, Math.min(F().h, d.at[k][1] + d.dy)); const en = M.entry(q.a); if (d.idx.length === 1 && en && en.mount === "wall" && ed.wallSnap !== false) toWall(q, q.x, q.y); onTop(q, d.idx); P()[j] = clean(q); })); return true; }
      if (d.kind === "rot") { if (d.moved) api.change(() => { P()[d.i].r = d.r; P()[d.i] = clean(P()[d.i]); }); else api.paintCanvas(); return true; }
      if (d.kind === "box") {
        const x0 = Math.min(d.x0, d.x1 == null ? d.x0 : d.x1), x1 = Math.max(d.x0, d.x1 == null ? d.x0 : d.x1), y0 = Math.min(d.y0, d.y1 == null ? d.y0 : d.y1), y1 = Math.max(d.y0, d.y1 == null ? d.y0 : d.y1);
        if (x1 - x0 > .1 || y1 - y0 > .1) { const got = P().map((q, i) => [q, i]).filter(([q]) => q.x >= x0 && q.x <= x1 && q.y >= y0 && q.y <= y1).map(([, i]) => i); setSel([...new Set(d.add.concat(got))]); }
        api.paintCanvas(); api.paintSide(); return true;
      }
      return false;
    },
    click(e) {
      const t = e.target, ed = E();
      // choosing Furnish on a floor with nothing on it yet opens the library
      const tb = t.closest("[data-tool]"); if (tb) { ed.place = null; setSel([]); if (tb.dataset.tool === "furnish" && !P().length) setTimeout(() => openLib(), 0); return false; }
      if (t.closest("[data-mf]")) { setSel([]); ed.place = ed.place && ed.place.spec ? ed.place : null; return false; }
      const fav = t.closest("[data-fav]"); if (fav) { const id = fav.dataset.fav; favs = favs.includes(id) ? favs.filter(x => x !== id) : [id].concat(favs); keep("fav", favs); document.querySelectorAll(`#meDlg [data-fav="${CSS.escape(id)}"]`).forEach(b => b.setAttribute("aria-pressed", favs.includes(id))); if (L.view === "fav") paintList(); paintNav(); return true; }
      const qa = t.closest("[data-qadd]"); if (qa) { const sp = { a: qa.dataset.qadd }; if (qa.dataset.c) sp.c = qa.dataset.c; startPlacing(sp); return true; }
      const ks = t.closest("[data-kitset]"); if (ks) { const k = M.kits().find(x => x.id === ks.dataset.kitset); if (k) startPlacing({ set: k.set }, k.n + " set"); return true; }
      const kv = t.closest("[data-kitshow]"); if (kv) { L.view = "kit:" + kv.dataset.kitshow; L.cat = L.sub = ""; L.shown = 60; saveUI(); paintNav(); paintList(); return true; }
      const nv = t.closest("[data-nv]"); if (nv) { L.view = nv.dataset.nv; L.cat = nv.dataset.cat; L.sub = nv.dataset.sub; L.shown = 60; saveUI(); paintNav(); paintList(); return true; }
      const ch = t.closest("[data-chip]"); if (ch) { const arr = L[ch.dataset.chip], v = ch.dataset.v; L[ch.dataset.chip] = arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v); L.shown = 60; saveUI(); paintFilters(); paintNav(); paintList(); return true; }
      const ic = t.closest("[data-imchip]"); if (ic && L.imp && L.imp.meta) { const g = L.imp.meta.g, v = ic.dataset.imchip; L.imp.meta.g = g.includes(v) ? g.filter(x => x !== v) : g.concat(v); ic.setAttribute("aria-pressed", L.imp.meta.g.includes(v)); return true; }
      const cd = t.closest(".ml-card"); if (cd && !t.closest("button")) { pick(cd.dataset.a, cd.dataset.c); return true; }
      const ml = t.closest("[data-ml]"); if (ml) {
        switch (ml.dataset.ml) {
          case "close": closeLib(); break;
          case "more": L.shown += 60; paintList(true); break;
          case "clear": Object.assign(L, { q: "", genre: [], fam: [], cond: "", env: "", shown: 60 }); $("#mlLib .ml-q").value = ""; saveUI(); paintFilters(); paintNav(); paintList(); break;
          case "place": if (L.pick) { const sp = copy(L.pick); remember(sp.a); startPlacing(sp); } break;
          case "nocol": if (L.pick) { delete L.pick.col; paintDetail(); } break;
          case "impx": L.imp = null; stopPreview(); M.dropCustom("my-preview"); paintDetail(); break;
          case "impkeep": keepImport(); break;
          case "forget": if (ml.dataset.sure && L.pick) forget(L.pick.a); else { ml.dataset.sure = 1; ml.textContent = "Really forget it?"; } break;
        }
        return true;
      }
      const pf = t.closest("[data-pf]"); if (pf) {
        switch (pf.dataset.pf) {
          case "lib": openLib(); break;
          case "stop": stopPlacing(); break;
          case "turnplace": if (ed.place) { ed.place.r = snapR((ed.place.r || 0) + (snapOn() ? 15 : 5)); const g = $("#meCanvas .me-pghost"); if (g) g.innerHTML = ghostInner(ed.place.spec, ed.place.r); } break;
          case "turn15": turnSel(15); break;
          case "turn-15": turnSel(-15); break;
          case "turn90": turnSel(90); break;
          case "dup": duplicate(); break;
          case "copy": copySel(); break;
          case "del": removeSel(); break;
          case "nocol": edit(p => { delete p.col; }); break;
          case "reshape": edit(p => { delete p.p; }); break;
          case "fav": { const l = sel(); if (l.length === 1) { const id = P()[l[0]].a; favs = favs.includes(id) ? favs.filter(x => x !== id) : [id].concat(favs); keep("fav", favs); pf.setAttribute("aria-pressed", favs.includes(id)); } break; }
          case "snap": ed.snap = !snapOn(); keep("snap", ed.snap); pf.setAttribute("aria-pressed", snapOn()); api.tip(snapOn() ? "Snapping on: models go to quarter squares and turn by 15°." : "Snapping off: models go exactly where you put them."); break;
          case "3d": editor3D(false); break;
          case "walls": editor3D(!$("#meThree").dataset.low); break;
          case "x3d": { const b = $("#meThree"); b.hidden = true; close3D(); break; }
        }
        return true;
      }
      return false;
    },
    change(e) {
      const t = e.target;
      if (t.matches("[data-ml-import]")) { if (t.files && t.files[0]) importFile(t.files[0]); t.value = ""; return true; }
      if (t.dataset.lf) { L[t.dataset.lf] = t.value; L.shown = 60; saveUI(); paintNav(); paintList(); return true; }
      if (t.dataset.im && L.imp && L.imp.meta) { const m = L.imp.meta, k = t.dataset.im; if (k === "h") m.p.h = Math.max(.02, +t.value || 1); else if (k === "ry") m.ry = +t.value; else m[k] = t.value; if (k === "h" || k === "ry") { sizeImport(); impPreview(); } return true; }
      if (t.dataset.pk && L.pick) {
        const k = t.dataset.pk, sp = L.pick, e2 = M.entry(sp.a);
        if (k === "c") { if (t.value === "new") delete sp.c; else sp.c = t.value; }
        else if (k === "m") { const main = Object.keys(e2.p.m || {})[0]; if (main && t.value === e2.p.m[main]) delete sp.m; else sp.m = t.value; }
        else if (k === "col") sp.col = t.value;
        else { sp.p = Object.assign({}, sp.p || {}, { [k]: k === "text" ? t.value.slice(0, 40) : Math.max(.01, +t.value || e2.p[k]) }); }
        paintDetail(); return true;
      }
      if (t.dataset.pv) {
        const k = t.dataset.pv;
        if (k === "h") { edit(p => { if (t.checked) p.h = 1; else delete p.h; }); return true; }
        if (k === "c") { edit(p => { if (t.value === "new") delete p.c; else p.c = t.value; }); return true; }
        if (k === "m") { edit(p => { const en = M.entry(p.a), main = Object.keys(en.p.m || {})[0]; if (main && t.value === en.p.m[main]) delete p.m; else p.m = t.value; }); return true; }
        if (k === "col") { edit(p => { p.col = t.value; }); return true; }
      }
      if (t.dataset.pp) {
        const k = t.dataset.pp, v = +t.value;
        if (k === "r") edit(p => { p.r = snapR(v || 0); });
        else if (k === "s") edit(p => { p.s = Math.max(.1, Math.min(10, v || 1)); });
        else if (k === "z") edit(p => { p.z = Math.max(0, v || 0); });
        else edit(p => { const en = M.entry(p.a); p.p = Object.assign({}, p.p || {}, { [k]: Math.max(.01, v || en.p[k]) }); });
        return true;
      }
      if (t.dataset.pq) { const k = t.dataset.pq; edit(p => { p.p = Object.assign({}, p.p || {}, { [k]: t.type === "color" || k === "text" ? t.value.slice(0, 40) : t.value }); }); return true; }
      return false;
    },
    input(e) {
      const t = e.target;
      if (t.matches(".ml-q")) { clearTimeout(this.qt); this.qt = setTimeout(() => { L.q = t.value; L.shown = 60; if (L.view !== "all" && L.view !== "fav" && L.view !== "recent" && L.view !== "mine") L.view = "all"; saveUI(); paintNav(); paintList(); const b = $('#mlLib [data-ml="clear"]'); if (b) b.disabled = !(L.genre.length || L.fam.length || L.cond || L.env || L.q); }, 140); return true; }
      return false;
    },
    key(e) {
      const ed = E(), k = e.key, lk = k.toLowerCase(), ctrl = e.ctrlKey || e.metaKey, lib = $("#mlLib");
      if (lib && !lib.hidden) { if (k === "Escape") { e.preventDefault(); closeLib(); return true; } if (k === "Enter" && L.pick && !e.target.closest("button")) { e.preventDefault(); const sp = copy(L.pick); remember(sp.a); startPlacing(sp); return true; } return false; }
      const three3 = $("#meThree"); if (three3 && !three3.hidden) { if (k === "Escape") { e.preventDefault(); three3.hidden = true; close3D(); } return true; }
      if (!ctrl && lk === "f") { ed.tool = "furnish"; ed.sel = null; api.paint(); return true; }
      if (!ctrl && lk === "l") { if (ed.tool !== "furnish") { ed.tool = "furnish"; api.paint(); } openLib(); e.preventDefault(); return true; }
      if (ed.tool !== "furnish") return false;
      if (k === "Escape") { if (ed.place) stopPlacing(); else if (sel().length) { setSel([]); api.paintCanvas(); api.paintSide(); } return true; }
      if (ed.place && lk === "r") { ed.place.r = snapR((ed.place.r || 0) + (e.shiftKey ? -1 : 1) * (snapOn() ? 15 : 5)); const g = $("#meCanvas .me-pghost"); if (g) { g.innerHTML = ghostInner(ed.place.spec, ed.place.r); if (ed.lastPt) moveGhost(ed.lastPt.x, ed.lastPt.y); } return true; }
      if (ctrl && lk === "a") { e.preventDefault(); setSel(P().map((_, i) => i)); api.paintCanvas(); api.paintSide(); return true; }
      if (ctrl && lk === "v") { e.preventDefault(); paste(); return true; }
      const l = sel(); if (!l.length) return false;
      if (k === "Delete" || k === "Backspace") { e.preventDefault(); removeSel(); return true; }
      if (ctrl && lk === "c") { e.preventDefault(); copySel(); return true; }
      if (ctrl && lk === "x") { e.preventDefault(); copySel(true); return true; }
      if (ctrl && lk === "d") { e.preventDefault(); duplicate(); return true; }
      if (lk === "r" && !ctrl) { turnSel((e.shiftKey ? -1 : 1) * (snapOn() ? 15 : 5)); return true; }
      if (k === "[" || k === "]") { edit(p => { p.s = Math.max(.1, Math.min(10, Math.round((p.s || 1) * (k === "]" ? 1.1 : 1 / 1.1) * 100) / 100)); }); return true; }
      if (k === "PageUp" || k === "PageDown") { e.preventDefault(); edit(p => { p.z = Math.max(0, Math.round(((p.z || 0) + (k === "PageUp" ? .1 : -.1)) * 100) / 100); }); return true; }
      const ar = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
      if (ar) { e.preventDefault(); const st = e.shiftKey ? 1 : snapOn() ? .25 : .05; edit(p => { p.x = Math.max(0, Math.min(F().w, p.x + ar[0] * st)); p.y = Math.max(0, Math.min(F().h, p.y + ar[1] * st)); }); return true; }
      return false;
    }
  });

  // events the editor's own handlers do not see: the wheel turns a model being put down; leaving the map hides it
  let bound = false;
  function bindOnce() {
    if (bound) return; const cv = $("#meCanvas"); if (!cv) return; bound = true;
    cv.addEventListener("wheel", ev => { const ed = E(); if (ed.tool === "furnish" && ed.place) { ev.preventDefault(); ed.place.r = snapR((ed.place.r || 0) + Math.sign(ev.deltaY) * 15); const g = $("#meCanvas .me-pghost"); if (g) { g.innerHTML = ghostInner(ed.place.spec, ed.place.r); if (ed.lastPt) moveGhost(ed.lastPt.x, ed.lastPt.y); } } }, { passive: false });
    cv.addEventListener("pointerleave", () => { const g = $("#meCanvas .me-pghost"); if (g) g.setAttribute("visibility", "hidden"); });
    cv.addEventListener("contextmenu", ev => { if (E().tool === "furnish") ev.preventDefault(); });
    const lst = $("#mlLib .ml-list"); if (lst && "IntersectionObserver" in window) new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && !$("#mlLib").hidden && $('#mlLib [data-ml="more"]')) { L.shown += 60; paintList(true); } }, { root: lst, rootMargin: "300px" }).observe($("#mlLib .ml-more"));
    // the side panel's pictures, whenever it is drawn again
    new MutationObserver(() => thumbs($("#meSide"))).observe($("#meSide"), { childList: true });
  }

  /* ---- the pictures of models come as they are drawn: the maps on the page, and the editor, are drawn again */
  document.addEventListener("atlas-models", ev => {
    const dlg = $("#meDlg");
    if (dlg && dlg.open && api && !E().pdrag) { api.paintCanvas(); if (ev.detail && ev.detail.library && $("#mlLib") && !$("#mlLib").hidden) { paintNav(); paintList(true); } }
    document.querySelectorAll(".lmap-sec").forEach(sec => { if (sec.querySelector(".lm-stage .lm-prop") && (sec.querySelector(".lm-stage g.lm-prop") || (ev.detail && ev.detail.library))) A.rerender(sec.dataset.loc); });
  });
  // a place's floor in 3D, from its maps
  document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-m3d]"); if (!b) return; const id = b.dataset.m3d, M0 = A.get(id); let fi = A.state.f[A.keyOf(id)]; if (fi == null || fi >= M0.floors.length) fi = A.maps[id].start || 0; page3D(id, fi, false); });
  M.page3D = page3D;
})(ATLAS);
