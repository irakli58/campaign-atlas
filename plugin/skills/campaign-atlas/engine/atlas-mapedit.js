/* The map editor: a place's map redrawn by the referee, exactly as they want it. The user asked (21 Oct 2026) how a
   game master gets a huge mansion "or something very specific", and chose a way to change the map themselves and a
   way to give their own floor plan. From "Edit this map" on a place's maps: rooms drawn, moved and resized on the
   grid; doors, double doors, openings, gates, secret doors and windows; stairs that link two floors; floors added,
   renamed, made bigger or kept secret; a room's floor, furniture and words for the guide; a picture laid over the
   grid to trace a floor plan or a sketch, or read by Claude into rooms. Saved in the page's database (collection
   "mapedits") and, in the Atlas app, into the campaign's edits/<id>.js; A.mapEdit (atlas-table.js) lays it over the
   place everywhere: the dossier, the players' window, fog of war, the book, maps for online tables. */
(function (A) {
  "use strict";
  if (!A.table) return;
  const T = A.table, esc = A.esc, C = A.C;
  let S = null, X = null;
  const E = { zoom: 1 };                       // the edit under way
  const $ = s => document.querySelector(s);
  const copy = o => JSON.parse(JSON.stringify(o));
  const pref = { get(k) { try { return localStorage.getItem(A.config.storageKey + "-me-" + k); } catch (e) { return null; } }, set(k, v) { try { if (v == null) localStorage.removeItem(A.config.storageKey + "-me-" + k); else localStorage.setItem(A.config.storageKey + "-me-" + k, v); return true; } catch (e) { return false; } } };
  const KIND_NAMES = { boards: "Wooden boards", flag: "Flagstones", tile: "Tiles", tilew: "Chequered tiles", "carpet-r": "Red carpet", "carpet-g": "Green carpet", "carpet-b": "Blue carpet", cobble: "Cobbles", sawdust: "Sawdust", lino: "Linoleum", straw: "Straw", earth: "Earth", brick: "Brick", stone: "Stone", coal: "Coal", water: "Water", concrete: "Concrete", metal: "Metal plate", grating: "Grating", glass: "Glass", marble: "Marble", street: "Street (outdoors)", yard: "Yard (outdoors)", alley: "Alley (outdoors)", grass: "Grass (outdoors)", quay: "Quay (outdoors)", river: "River (outdoors)", deck: "Deck (outdoors)", sand: "Sand (outdoors)", snow: "Snow (outdoors)", mud: "Mud (outdoors)", tarmac: "Tarmac (outdoors)", forest: "Forest (outdoors)", space: "Open space (outdoors)", rock: "Solid rock", roof: "Roof (solid)", void: "Nothing (solid)" };
  const kinds = () => Object.keys(Object.assign({}, A.KINDS, A.config.kinds || {}));
  const fxs = () => Object.keys(A.FX || {});
  const DOORS = [["d", "Door"], ["dd", "Double door"], ["a", "Opening"], ["g", "Gate"], ["s", "Secret door"], ["w", "Window"]];
  const IC = {
    select: `<path d="M6 3.5 18 13l-5.5.9 3.2 6-2.4 1.2-3.2-6L6 19z"/>`,
    room: `<rect x="3.5" y="5" width="13" height="13" rx="1"/><path d="M19.5 3.5v6M16.5 6.5h6"/>`,
    door: `<path d="M6 21V4.5l9-1.5v18M3.5 21h17M12 12.5v.5"/>`,
    stairs: `<path d="M3.5 20h4v-4h4v-4h4V8h4V4"/>`,
    erase: `<path d="M15 4.5 20 9.5 10.5 19H6l-2.5-2.5z"/><path d="M10 9.5l5 5M10.5 19H20"/>`,
    picture: `<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17.5l5-4.5 3.5 3 3-2.5 4.5 4"/>`,
    undo: `<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12"/>`,
    redo: `<path d="M15 7l4.5 4.5L15 16"/><path d="M19 11.5H9.5a5 5 0 0 0 0 10H12"/>`,
    plus: `<circle cx="11" cy="11" r="6.5"/><path d="M8 11h6M11 8v6M16 16l4 4"/>`,
    minus: `<circle cx="11" cy="11" r="6.5"/><path d="M8 11h6M16 16l4 4"/>`
  };
  const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ""}</svg>`;
  const TOOLS = [["select", "Choose and move", "Click a room, stair, door or marker to choose it. Drag a room to move it, drag its corners to resize it, drag a marker to move it."], ["room", "Draw a room", "Drag across the grid to draw a room. Draw two that touch with the same name for an L-shaped room."], ["door", "Doors and windows", "Click on a wall to put the chosen kind there; click it again to take it away."], ["stairs", "Stairs", "Drag to draw a stair. It is linked to the floor above (or below), where its other end appears."], ["erase", "Rubber", "Click a room, a door or a stair to take it away."]];

  /* ---- the editable copy of a place's map */
  // the items laid out by a room's furniture preset are laid out again after an edit; only the others are kept
  function loose(F) {
    const fx = []; for (const r of F.R || []) if (r[7] && r[7].fx) fx.push(...A.furnishRoom(r));
    const same = (a, b) => a[0] === b[0] && Math.abs(a[1] - b[1]) < .02 && Math.abs(a[2] - b[2]) < .02;
    return (F.I || []).filter(it => !fx.some(f => same(f, it)));
  }
  function draftOf(id) {
    const M = A.get(id);
    return { t: M.t, rooms: copy((A.mapEdits[id] || {}).rooms || {}), order: M.order ? M.order.slice() : null,
      floors: M.floors.map(F => { const o = { n: F.n, w: F.w, h: F.h, R: copy(F.R || []), D: copy(F.D || []), ST: copy(F.ST || []), M: copy(F.M || []), I: copy(loose(F)) }; if (F.gm || F.k) o.gm = 1; if (F.note) o.note = F.note; return o; }) };
  }
  const finished = F0 => { const F = copy(F0); F.D = F.D || []; F.ST = F.ST || []; F.M = F.M || []; F.I = (F.I || []).slice(); return A.finishFloor(F, F.R); };
  const cur = () => E.draft.floors[E.fi];
  const guide = rid => Object.assign({}, ((A.get(E.id) || {}).rooms || {})[rid] || {}, E.draft.rooms[rid] || {});
  function nextRoom() { let n = 0; for (const F of E.draft.floors) for (const r of F.R) { const m = /^R(\d+)$/.exec(r[0]); if (m) n = Math.max(n, +m[1]); } return "R" + (n + 1); }
  function nextStair() { let n = 0; for (const F of E.draft.floors) for (const s of F.ST) { const m = /^ST(\d+)$/.exec(s[0]); if (m) n = Math.max(n, +m[1]); } return "ST" + (n + 1); }
  function usualKind(F) { const n = {}; for (const r of F.R) if (/^R\d/.test(r[0]) && A.isIndoorKind(r[6])) n[r[6]] = (n[r[6]] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || "boards"; }
  function change(fn) { E.hist.push(JSON.stringify(E.draft)); if (E.hist.length > 60) E.hist.shift(); E.fut = []; fn(); E.dirty = true; paint(); }
  function undo() { if (!E.hist.length) return; E.fut.push(JSON.stringify(E.draft)); E.draft = JSON.parse(E.hist.pop()); if (E.fi >= E.draft.floors.length) E.fi = 0; E.sel = null; E.dirty = true; paint(); }
  function redo() { if (!E.fut.length) return; E.hist.push(JSON.stringify(E.draft)); E.draft = JSON.parse(E.fut.pop()); E.sel = null; E.dirty = true; paint(); }

  /* ---- what is where */
  const inside = (r, x, y) => x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4];
  function roomAt(F, x, y) { for (let i = F.R.length - 1; i >= 0; i--) if (inside(F.R[i], x, y)) return i; return -1; }
  function stairAt(F, x, y) { for (let i = F.ST.length - 1; i >= 0; i--) if (inside(F.ST[i], x, y)) return i; return -1; }
  function markerAt(F, x, y) { for (let i = F.M.length - 1; i >= 0; i--) if (Math.hypot(F.M[i][1] - x, F.M[i][2] - y) < .45) return i; return -1; }
  // the wall line nearest a point: "h" runs along row line y, "v" along column line x
  function edgeAt(x, y) { const fx = x - Math.floor(x), fy = y - Math.floor(y), dh = Math.min(fy, 1 - fy), dv = Math.min(fx, 1 - fx); return dh <= dv ? { o: "h", x: Math.floor(x), y: Math.round(y), d: dh } : { o: "v", x: Math.round(x), y: Math.floor(y), d: dv }; }
  function doorAt(F, e) { return F.D.findIndex(d => d[2] === e.o && (e.o === "h" ? d[1] === e.y && e.x >= d[0] && e.x < d[0] + (d[4] || 1) : d[0] === e.x && e.y >= d[1] && e.y < d[1] + (d[4] || 1))); }
  function handleAt(r, x, y) { const c = { nw: [r[1], r[2]], ne: [r[1] + r[3], r[2]], sw: [r[1], r[2] + r[4]], se: [r[1] + r[3], r[2] + r[4]] }; for (const [k, [hx, hy]] of Object.entries(c)) if (Math.abs(hx - x) < .4 && Math.abs(hy - y) < .4) return k; return null; }

  /* ---- drawing it */
  function overlay() {
    const F = cur(); let s = "";
    if (E.under && E.under.fi === E.fi) s += `<image href="${E.under.src}" x="${E.under.x * C}" y="${E.under.y * C}" width="${E.under.w * C}" height="${E.under.w * E.under.ratio * C}" opacity="${E.under.op}" preserveAspectRatio="none" pointer-events="none"/>`;
    const sel = E.sel;
    if (sel && sel.kind === "room" && F.R[sel.i]) { const r = F.R[sel.i]; s += `<rect class="me-sel" x="${r[1] * C}" y="${r[2] * C}" width="${r[3] * C}" height="${r[4] * C}"/>` + [[r[1], r[2]], [r[1] + r[3], r[2]], [r[1], r[2] + r[4]], [r[1] + r[3], r[2] + r[4]]].map(([x, y]) => `<rect class="me-hdl" x="${x * C - 5}" y="${y * C - 5}" width="10" height="10"/>`).join(""); }
    if (sel && sel.kind === "stair" && F.ST[sel.i]) { const r = F.ST[sel.i]; s += `<rect class="me-sel" x="${r[1] * C}" y="${r[2] * C}" width="${r[3] * C}" height="${r[4] * C}"/>`; }
    if (sel && sel.kind === "door" && F.D[sel.i]) { const [x, y, o, , len = 1] = F.D[sel.i]; s += o === "h" ? `<line class="me-seld" x1="${x * C}" y1="${y * C}" x2="${(x + len) * C}" y2="${y * C}"/>` : `<line class="me-seld" x1="${x * C}" y1="${y * C}" x2="${x * C}" y2="${(y + len) * C}"/>`; }
    if (sel && sel.kind === "marker" && F.M[sel.i]) s += `<circle class="me-sel" cx="${F.M[sel.i][1] * C}" cy="${F.M[sel.i][2] * C}" r="13"/>`;
    return s + `<rect class="me-ghost" x="0" y="0" width="0" height="0" visibility="hidden"/>`;
  }
  function paintCanvas() {
    const box = $("#meCanvas"); if (!box) return;
    const F = cur(), sx = box.scrollLeft, sy = box.scrollTop;
    A.maps.__medit = Object.assign({}, A.get(E.id), { t: E.draft.t, floors: E.draft.floors.map(finished), big: 0 }); delete A.maps.__medit.order; delete A.maps.__medit.alias; A.state.cache = {};
    let s = A.svg("__medit", E.fi, "gm", "me" + (A.state.n++), 0);
    delete A.maps.__medit; A.state.cache = {};
    s = s.replace(` class="lmap2"`, ` class="me-svg"`).replace(/ style="min-width:[^"]*"/, "").replace(/<\/svg>$/, overlay() + "</svg>");
    box.innerHTML = s;
    const svg = box.querySelector("svg"); svg.style.width = Math.round((F.w * C + 20) * 1.5 * E.zoom) + "px";
    box.scrollLeft = sx; box.scrollTop = sy;
    box.dataset.tool = E.tool;
  }
  function paint() { paintTop(); paintCanvas(); paintSide(); }
  function paintTop() {
    const dlg = $("#meDlg"); if (!dlg) return;
    dlg.querySelector(".me-floors").innerHTML = E.draft.floors.map((F, i) => `<button type="button" data-mf="${i}" aria-pressed="${i === E.fi}">${esc(F.n || "Floor " + (i + 1))}${F.gm ? " 🔒" : ""}</button>`).join("") + `<button type="button" class="me-add" data-me="addfloor">+ A floor</button>`;
    dlg.querySelector('[data-me="undo"]').disabled = !E.hist.length; dlg.querySelector('[data-me="redo"]').disabled = !E.fut.length;
    dlg.querySelectorAll("[data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === E.tool));
    dlg.querySelector(".me-tip").textContent = (TOOLS.find(t => t[0] === E.tool) || [])[2] || "";
    dlg.querySelector('[data-me="save"]').textContent = E.dirty ? "Save" : "Saved";
  }
  const num = (k, v, label, min) => `<label class="me-num"><span>${label}</span><input type="number" data-mv="${k}" value="${v}" min="${min == null ? 0 : min}" step="1"></label>`;
  function paintSide() {
    const side = $("#meSide"); if (!side) return;
    const F = cur(), sel = E.sel; let h = "";
    if (E.tool === "door") h += `<section><h4>Which kind</h4><div class="me-kinds">${DOORS.map(([k, l]) => `<button type="button" data-dt="${k}" aria-pressed="${E.doorType === k}">${l}</button>`).join("")}</div><p class="me-help">Click on a wall line to put one there. A secret door is hidden from the players.</p></section>`;
    if (sel && sel.kind === "room" && F.R[sel.i]) {
      const r = F.R[sel.i], o = r[7] || {}, g = guide(r[0]), isR = /^R\d/.test(r[0]);
      h += `<section><h4>${isR ? `Room ${esc(r[0])}` : "Ground"}</h4>
        <label class="me-f"><span>Name</span><input data-rv="name" value="${esc(r[5] || "")}" maxlength="60"></label>
        <label class="me-f"><span>Floor</span><select data-rv="kind">${kinds().map(k => `<option value="${k}"${k === r[6] ? " selected" : ""}>${esc(KIND_NAMES[k] || k)}</option>`).join("")}</select></label>
        <label class="me-f"><span>Furniture</span><select data-rv="fx"><option value="">None, or as drawn</option>${fxs().map(k => `<option value="${k}"${k === o.fx ? " selected" : ""}>${esc(k[0].toUpperCase() + k.slice(1))}</option>`).join("")}</select></label>
        <label class="me-ck"><input type="checkbox" data-rv="h"${o.h ? " checked" : ""}> Hidden from the players (a secret room)</label>
        <div class="me-nums">${num("x", r[1], "Left")}${num("y", r[2], "Top")}${num("w", r[3], "Wide", 1)}${num("h", r[4], "Deep", 1)}</div>
        ${isR ? `<label class="me-f"><span>What the players see (read aloud)</span><textarea data-rg="d" rows="3" maxlength="1200">${esc(g.d || "")}</textarea></label><label class="me-f"><span>Notes for you</span><textarea data-rg="kp" rows="2" maxlength="1200">${esc(g.kp || "")}</textarea></label>` : ""}
        <button type="button" class="me-del" data-me="delroom">Take this room away</button></section>`;
    } else if (sel && sel.kind === "stair" && F.ST[sel.i]) {
      const st = F.ST[sel.i], others = E.draft.floors.map((G, i) => [G, i]).filter(([, i]) => i !== E.fi), at = E.draft.floors.findIndex((G, i) => i !== E.fi && G.ST.some(t => t[0] === st[0]));
      h += `<section><h4>Stair ${esc(st[0])}</h4><label class="me-f"><span>Name</span><input data-sv="name" value="${esc(st[8] || "")}" placeholder="Back stairs" maxlength="40"></label>
        <label class="me-f"><span>Goes to</span><select data-sv="to"><option value="-1"${at < 0 ? " selected" : ""}>Nowhere yet</option>${others.map(([G, i]) => `<option value="${i}"${i === at ? " selected" : ""}>${esc(G.n || "Floor " + (i + 1))}</option>`).join("")}</select></label>
        <label class="me-f"><span>Which way</span><select data-sv="ud"><option value="up"${st[5] === "up" ? " selected" : ""}>Up</option><option value="down"${st[5] !== "up" ? " selected" : ""}>Down</option></select></label>
        <button type="button" class="me-del" data-me="delstair">Take this stair away</button></section>`;
    } else if (sel && sel.kind === "door" && F.D[sel.i]) {
      const d = F.D[sel.i];
      h += `<section><h4>${esc((DOORS.find(x => x[0] === (d[3] || "d")) || [, "Door"])[1])}</h4><label class="me-f"><span>Kind</span><select data-dv="type">${DOORS.map(([k, l]) => `<option value="${k}"${k === (d[3] || "d") ? " selected" : ""}>${l}</option>`).join("")}</select></label>${num("len", d[4] || 1, "How many squares wide", 1)}<button type="button" class="me-del" data-me="deldoor">Take it away</button></section>`;
    } else if (sel && sel.kind === "marker" && F.M[sel.i]) {
      const mid = F.M[sel.i][0], M = A.get(E.id), dir = A.dirOf(mid), entry = (M[dir] || {})[mid] || {};
      h += `<section><h4>Marker ${esc(mid)}</h4><p>${esc(entry.t || entry.n || (A.castData && entry.who && A.castData[entry.who] ? A.castData[entry.who].n : "") || "")}</p><p class="me-help">Drag it on the map to move it.</p></section>`;
    }
    // the floor, always
    h += `<section><h4>This floor</h4><label class="me-f"><span>Name</span><input data-fv="n" value="${esc(F.n || "")}" maxlength="40"></label>
      <label class="me-ck"><input type="checkbox" data-fv="gm"${F.gm ? " checked" : ""}> Only for you (a secret floor)</label>
      <div class="me-nums">${num("fw", F.w, "Squares wide", 4)}${num("fh", F.h, "Squares deep", 4)}</div>
      <div class="me-grow"><span>Make it bigger: add</span><input type="number" min="1" max="40" value="${E.grow || 4}" data-me-grow aria-label="Squares to add"><span>squares on the</span><div class="me-row">${[["left", "Left"], ["top", "Top"], ["right", "Right"], ["bottom", "Bottom"]].map(([k, l]) => `<button type="button" data-grow="${k}">${l}</button>`).join("")}</div></div>
      <p class="me-help">One square is ${esc(String((A.config.grid || {}).unit || 5))} ${esc((A.config.grid || {}).name || "ft")}.</p>
      ${E.draft.floors.length > 1 ? `<button type="button" class="me-del" data-me="delfloor">Take this floor away</button>` : ""}</section>`;
    // a picture to trace
    const U = E.under && E.under.fi === E.fi ? E.under : null;
    h += `<section class="me-pic"><h4>${icon("picture")} A floor plan or sketch</h4>${U ? `<label class="me-f"><span>How clearly it shows</span><input type="range" min="0.1" max="1" step="0.05" value="${U.op}" data-uv="op"></label>
        <div class="me-nums">${num("uw", +U.w.toFixed(1), "Squares wide", 1)}${num("ux", +U.x.toFixed(1), "Left", -999)}${num("uy", +U.y.toFixed(1), "Top", -999)}</div>
        <label class="me-ck"><input type="checkbox" data-uv="move"${E.underMove ? " checked" : ""}> Move the picture by dragging it</label>
        <button type="button" class="me-ai" data-me="ai">Let Claude draw the rooms from it</button>
        <p class="me-help">Or trace it yourself: draw rooms over it with Draw a room.</p>
        <button type="button" class="me-del" data-me="unpic">Take the picture away</button>` : `<p class="me-help">Lay a picture over this floor (a floor plan, a photo of your sketch, a real building's plan) and trace it, or let Claude draw its rooms.</p><label class="me-file"><input type="file" accept="image/*" data-me-pic> Choose a picture</label>`}</section>`;
    h += `<section><h4>When you are done</h4><p class="me-help">Save keeps your map in this campaign. Rooms you add need their words for the guide: write them here, or ask Claude to write them next time.</p>
      <button type="button" data-me="copy">Copy it for Claude</button>${A.mapEdits[E.id] ? `<button type="button" class="me-del" data-me="revert">Back to how it was drawn</button>` : ""}</section>`;
    side.innerHTML = h;
  }

  /* ---- the dialog */
  function open(id) {
    if (!A.maps[id] || !S) return;
    const lvl = A.mapEdits[id] ? A.mapEdits[id].level : A.levelFor(id);
    Object.assign(E, { id, draft: draftOf(id), fi: 0, tool: "select", sel: null, hist: [], fut: [], doorType: "d", dirty: false, level: lvl == null ? 99 : lvl, underMove: false, drag: null });
    const shown = A.state.f[A.keyOf(id)]; E.fi = shown != null && shown < E.draft.floors.length ? shown : 0;
    E.under = null; try { const u = JSON.parse(pref.get("u-" + id) || "null"); if (u && u.src) E.under = u; } catch (e) {}
    let dlg = $("#meDlg");
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "meDlg"; dlg.className = "me-dlg"; document.body.appendChild(dlg);
      dlg.innerHTML = `<div class="me-top"><b class="me-title"></b><div class="me-floors" role="group" aria-label="Floor"></div><span class="t-sp"></span>
          <button type="button" data-me="undo" title="Undo">${icon("undo")}</button><button type="button" data-me="redo" title="Redo">${icon("redo")}</button>
          <button type="button" data-me="close">Close</button><button type="button" class="prim" data-me="save">Save</button></div>
        <div class="me-body"><div class="me-tools" role="toolbar" aria-label="Tools">${TOOLS.map(([k, l]) => `<button type="button" data-tool="${k}" title="${esc(l)}">${icon(k)}<span>${esc(l)}</span></button>`).join("")}<span class="me-gap"></span><button type="button" data-me="zin" title="Closer">${icon("plus")}</button><button type="button" data-me="zout" title="Further">${icon("minus")}</button></div>
          <div class="me-canvas" id="meCanvas"></div><aside class="me-side" id="meSide"></aside></div>
        <p class="me-tip" aria-live="polite"></p>`;
      bind(dlg);
    }
    dlg.querySelector(".me-title").textContent = "Editing the map: " + ((A.meta[id] || {}).name || id);
    paint();
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  let leaving = 0;
  function close(force) {
    const dlg = $("#meDlg"); if (!dlg) return;
    if (E.dirty && !force) { const b = dlg.querySelector('[data-me="close"]'); if (Date.now() - leaving > 4000) { leaving = Date.now(); b.textContent = "Close without saving?"; setTimeout(() => { b.textContent = "Close"; }, 4000); return; } }
    leaving = 0; dlg.close();
  }
  async function save() {
    const ed = { t: Date.now(), level: E.level, floors: copy(E.draft.floors), rooms: Object.fromEntries(Object.entries(E.draft.rooms).filter(([, r]) => Object.values(r).some(v => String(v || "").trim()))) };
    if (E.draft.order) ed.order = E.draft.order.filter(i => i < ed.floors.length);
    A.mapEdit(E.id, ed); S.set("mapedits", E.id, ed);
    let where = "Saved in this campaign's page.";
    if (window.ATLAS_APP && window.ATLAS_APP.saveMap) { try { await window.ATLAS_APP.saveMap(E.id, ed); where = "Saved into the campaign: it stays when the campaign is rebuilt."; } catch (e) { where = "Saved in the page, but not into the campaign's files: " + (e.message || e); } }
    E.dirty = false; close(true); if (X && X.redraw) X.redraw(); toast(where);
  }
  async function revert() {
    S.set("mapedits", E.id, { off: true, t: Date.now() }); A.mapUnedit(E.id);
    if (window.ATLAS_APP && window.ATLAS_APP.saveMap) { try { await window.ATLAS_APP.saveMap(E.id, null); } catch (e) {} }
    E.dirty = false; close(true); if (X && X.redraw) X.redraw(); toast("The map is back to how it was drawn.");
  }
  function toast(t) { const n = document.getElementById("tDockNote"); if (n) { n.textContent = t; clearTimeout(toast.t); toast.t = setTimeout(() => { n.textContent = ""; }, 7000); } }
  function copyText() {
    const ed = { level: E.level, floors: E.draft.floors, rooms: E.draft.rooms }, txt = `// The map of ${(A.meta[E.id] || {}).name || E.id}, as the game master redrew it with the map editor. Save as edits/${E.id}.js in the campaign folder.\nATLAS.mapEdit(${JSON.stringify(E.id)}, ${JSON.stringify(ed)});\n`;
    const done = () => { $("#meDlg .me-tip").textContent = "Copied. Paste it to Claude with \"here is my edited map\", and it is kept in the campaign."; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => fallback()); else fallback();
    function fallback() { const ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;left:-9999px"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
  }

  /* ---- changing it */
  function moveRoom(F, i, dx, dy) {
    const r = F.R[i], [x, y, w, h] = [r[1], r[2], r[3], r[4]], within = (px, py) => px >= x && px < x + w && py >= y && py < y + h;
    for (const it of F.I) { const cx = it[1] + (it[3] || 1) / 2, cy = it[2] + (it[4] || 1) / 2; if (within(cx, cy)) { it[1] += dx; it[2] += dy; } }
    for (const m of F.M) if (within(m[1], m[2])) { m[1] += dx; m[2] += dy; }
    for (const st of F.ST) if (within(st[1] + st[3] / 2, st[2] + st[4] / 2)) { st[1] += dx; st[2] += dy; }
    for (const d of F.D) { const len = d[4] || 1; const on = d[2] === "h" ? (d[1] === y || d[1] === y + h) && d[0] >= x && d[0] + len <= x + w : (d[0] === x || d[0] === x + w) && d[1] >= y && d[1] + len <= y + h; if (on) { d[0] += dx; d[1] += dy; } }
    r[1] += dx; r[2] += dy; if (r[7] && r[7].l) r[7].l = [r[7].l[0] + dx, r[7].l[1] + dy];
  }
  function addStair(x, y, w, h) {
    const F = cur(), sid = nextStair(), n = E.draft.floors.length, to = E.fi + 1 < n ? E.fi + 1 : E.fi - 1, dir = w > h ? "e" : "n";
    const up = to > E.fi;
    F.ST.push([sid, x, y, w, h, to >= 0 ? (up ? "up" : "down") : "up", to >= 0 ? E.draft.floors[to].n : "", dir]);
    if (to >= 0) { const G = E.draft.floors[to]; G.ST.push([sid, Math.max(0, Math.min(x, G.w - w)), Math.max(0, Math.min(y, G.h - h)), w, h, up ? "down" : "up", F.n, dir]); }
    E.sel = { kind: "stair", i: F.ST.length - 1 };
  }
  function linkStair(sid, toIdx, ud) {
    const F = cur(), st = F.ST.find(s => s[0] === sid); if (!st) return;
    E.draft.floors.forEach((G, gi) => { if (gi !== E.fi) G.ST = G.ST.filter(s => s[0] !== sid); });
    if (toIdx < 0) { st[6] = ""; return; }
    const G = E.draft.floors[toIdx]; st[5] = ud; st[6] = G.n;
    G.ST.push([sid, Math.max(0, Math.min(st[1], G.w - st[3])), Math.max(0, Math.min(st[2], G.h - st[4])), st[3], st[4], ud === "up" ? "down" : "up", F.n, st[7] || "n"]);
  }
  function grow(side, n) {
    const F = cur(), stretch = k => { const d = A.kindOf(k); return !!(d && d.stretch); };
    const shift = (dx, dy) => { for (const r of F.R) { r[1] += dx; r[2] += dy; if (r[7] && r[7].l) r[7].l = [r[7].l[0] + dx, r[7].l[1] + dy]; } for (const d of F.D) { d[0] += dx; d[1] += dy; } for (const it of F.I) { it[1] += dx; it[2] += dy; } for (const st of F.ST) { st[1] += dx; st[2] += dy; } for (const m of F.M) { m[1] += dx; m[2] += dy; } };
    // ground that ran to the old edge (a street, grass, rock) runs to the new one
    if (side === "left") { shift(n, 0); for (const r of F.R) if (stretch(r[6]) && r[1] === n) { r[1] = 0; r[3] += n; } F.w += n; }
    if (side === "top") { shift(0, n); for (const r of F.R) if (stretch(r[6]) && r[2] === n) { r[2] = 0; r[4] += n; } F.h += n; }
    if (side === "right") { for (const r of F.R) if (stretch(r[6]) && r[1] + r[3] >= F.w) r[3] += n; F.w += n; }
    if (side === "bottom") { for (const r of F.R) if (stretch(r[6]) && r[2] + r[4] >= F.h) r[4] += n; F.h += n; }
  }

  /* ---- a picture to trace, and Claude reading it */
  function loadPicture(file) {
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        // kept small enough to store and to send: at most 1600 pixels across
        const k = Math.min(1, 1600 / Math.max(img.width, img.height)), cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
        const src = cv.toDataURL("image/jpeg", .86), F = cur();
        E.under = { fi: E.fi, src, ratio: cv.height / cv.width, w: F.w, x: 0, y: 0, op: .5, pw: cv.width, ph: cv.height };
        if (!pref.set("u-" + E.id, JSON.stringify(E.under))) $("#meDlg .me-tip").textContent = "The picture is too big to keep in this browser: it stays while the editor is open.";
        paint();
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  const saveUnder = () => { if (E.under) pref.set("u-" + E.id, JSON.stringify(E.under)); };
  async function aiDraw(btn) {
    const U = E.under; if (!U) return;
    const F = cur(), Wd = Math.max(8, Math.round(U.w)), Ht = Math.max(4, Math.round(U.w * U.ratio)), unit = (A.config.grid || {}).unit || 5, uname = (A.config.grid || {}).name || "ft";
    const prompt = `You are copying a floor plan onto a square grid for a tabletop roleplaying game. The picture is one floor of "${(A.meta[E.id] || {}).name || E.id}". Lay it on a grid ${Wd} squares wide and ${Ht} squares deep (one square is ${unit} ${uname}), the picture stretched to fill the grid exactly.
Answer with JSON only, in this shape:
{"rooms":[{"name":"Kitchen","x":0,"y":0,"w":4,"h":3,"kind":"flag","fx":"kitchen"}],"doors":[{"x":3,"y":5,"o":"h","type":"d"}],"stairs":[{"x":10,"y":2,"w":1,"h":3}]}
Rules: every room is a rectangle of whole squares, x and y its top-left square; rooms do not overlap; an L-shaped room is two rectangles with the same name. Name each room as it is written on the plan, or by what it plainly is. "kind" is its floor, one of: ${kinds().filter(k => !(A.kindOf(k) || {}).solid).join(", ")}. "fx" is optional furniture, one of: ${fxs().join(", ")}. A door with "o":"h" stands on the horizontal grid line y (between rows y-1 and y) at column x; with "o":"v" on the vertical grid line x (between columns x-1 and x) at row y. "type": d door, dd double door (2 squares), a open archway, w window. Put a door wherever the plan shows one, and a window on outside walls where it shows windows.`;
    const blob = await (await fetch(U.src)).blob();
    btn.disabled = true; const was = btn.textContent; btn.textContent = "Claude is reading the plan…";
    let v = null, why = "";
    try {
      let sample = null; try { sample = window.claude && window.claude.use ? await window.claude.use("sample") : null; } catch (e) { sample = null; }
      if (sample) { const lim = await sample.limits().catch(() => null); if (lim && lim.images) v = await sample.json(prompt, { images: [blob] }); else why = "This page cannot send pictures to Claude yet: it needs to be published again with that allowed."; }
      if (!v && window.ATLAS_APP && window.ATLAS_APP.trace) v = await window.ATLAS_APP.trace(U.src, prompt);
    } catch (e) { why = e && e.code === "declined" ? "Not allowed." : "Claude could not read it: " + (e.message || e.code || e); }
    btn.disabled = false; btn.textContent = was;
    if (!v || !Array.isArray(v.rooms)) { $("#meDlg .me-tip").textContent = why || "Reading a picture needs Claude: on claude.ai, or in the Atlas app. You can trace it yourself: draw rooms over it."; return; }
    change(() => fromPlan(v, Wd, Ht));
    $("#meDlg .me-tip").textContent = `Claude drew ${v.rooms.length} rooms from the picture. Check them against it, and fix anything with the tools; Undo puts the floor back.`;
  }
  function fromPlan(v, Wd, Ht) {
    const F = cur(), ok = new Set(kinds()), okfx = new Set(fxs()), names = {}, int = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+n || 0)));
    let next = +nextRoom().slice(1);
    const R = [];
    for (const r of v.rooms) {
      const x = int(r.x, 0, Wd - 1), y = int(r.y, 0, Ht - 1), w = int(r.w, 1, Wd - x), h = int(r.h, 1, Ht - y), nm = String(r.name || "Room").slice(0, 60);
      const rid = names[nm] || "R" + next++; names[nm] = rid;
      const kind = ok.has(r.kind) && !(A.kindOf(r.kind) || {}).solid ? r.kind : "boards";
      R.push(okfx.has(r.fx) ? [rid, x, y, w, h, nm, kind, { fx: r.fx }] : [rid, x, y, w, h, nm, kind]);
    }
    const D = (v.doors || []).map(d => [int(d.x, 0, Wd), int(d.y, 0, Ht), d.o === "v" ? "v" : "h", ["d", "dd", "a", "w", "g"].includes(d.type) ? d.type : "d", d.type === "dd" ? 2 : 1]);
    const ST = (v.stairs || []).map((s, i) => { const x = int(s.x, 0, Wd - 1), y = int(s.y, 0, Ht - 1); return ["ST" + (90 + i), x, y, int(s.w, 1, Wd - x), int(s.h, 1, Ht - y), "up", "", "n"]; });
    Object.assign(F, { w: Wd, h: Ht, R, D, ST, I: [] });
    if (E.under) { E.under.x = 0; E.under.y = 0; E.under.w = Wd; saveUnder(); }
    E.sel = null;
  }

  /* ---- the pointer on the map */
  function pt(e) { const svg = $("#meCanvas svg"); if (!svg) return { x: 0, y: 0 }; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return { x: q.x / C, y: q.y / C }; }
  function ghost(x, y, w, h) { const g = $("#meCanvas .me-ghost"); if (!g) return; g.setAttribute("x", x * C); g.setAttribute("y", y * C); g.setAttribute("width", Math.max(0, w * C)); g.setAttribute("height", Math.max(0, h * C)); g.setAttribute("visibility", "visible"); }
  function down(e) {
    if (e.button && e.button !== 0) return;
    const p = pt(e), F = cur(); E.drag = null;
    if (E.tool === "select") {
      if (E.under && E.underMove && E.under.fi === E.fi) { E.drag = { kind: "under", x0: p.x, y0: p.y, ux: E.under.x, uy: E.under.y }; return; }
      const mi = markerAt(F, p.x, p.y); if (mi >= 0) { E.sel = { kind: "marker", i: mi }; E.drag = { kind: "marker", i: mi, x0: p.x, y0: p.y }; paintCanvas(); paintSide(); return; }
      if (E.sel && E.sel.kind === "room" && F.R[E.sel.i]) { const hd = handleAt(F.R[E.sel.i], p.x, p.y); if (hd) { E.drag = { kind: "resize", i: E.sel.i, hd, x0: p.x, y0: p.y }; return; } }
      const ed = edgeAt(p.x, p.y), di = ed.d < .22 ? doorAt(F, ed) : -1; if (di >= 0) { E.sel = { kind: "door", i: di }; paintCanvas(); paintSide(); return; }
      const si = stairAt(F, p.x, p.y); if (si >= 0) { E.sel = { kind: "stair", i: si }; E.drag = { kind: "stair", i: si, x0: p.x, y0: p.y }; paintCanvas(); paintSide(); return; }
      const ri = roomAt(F, p.x, p.y); if (ri >= 0) { E.sel = { kind: "room", i: ri }; E.drag = { kind: "room", i: ri, x0: p.x, y0: p.y }; paintCanvas(); paintSide(); return; }
      E.sel = null; paintCanvas(); paintSide(); return;
    }
    if (E.tool === "room" || E.tool === "stairs") { E.drag = { kind: "draw", cx: Math.floor(p.x), cy: Math.floor(p.y) }; ghost(E.drag.cx, E.drag.cy, 1, 1); return; }
    if (E.tool === "door") {
      const ed = edgeAt(p.x, p.y); if (ed.x < 0 || ed.y < 0 || ed.x > F.w || ed.y > F.h) return;
      change(() => { const i = doorAt(F, ed); if (i >= 0 && (F.D[i][3] || "d") === E.doorType) F.D.splice(i, 1); else if (i >= 0) F.D[i][3] = E.doorType; else F.D.push([ed.x, ed.y, ed.o, E.doorType, E.doorType === "dd" ? 2 : 1]); E.sel = null; });
      return;
    }
    if (E.tool === "erase") {
      const ed = edgeAt(p.x, p.y), di = ed.d < .25 ? doorAt(F, ed) : -1;
      if (di >= 0) { change(() => F.D.splice(di, 1)); return; }
      const si = stairAt(F, p.x, p.y); if (si >= 0) { change(() => { const sid = F.ST[si][0]; E.draft.floors.forEach(G => { G.ST = G.ST.filter(s => s[0] !== sid); }); E.sel = null; }); return; }
      const ri = roomAt(F, p.x, p.y); if (ri >= 0) change(() => { delete E.draft.rooms[F.R[ri][0]]; F.R.splice(ri, 1); E.sel = null; });
    }
  }
  function move(e) {
    const d = E.drag; if (!d) return;
    const p = pt(e), F = cur();
    if (d.kind === "under") { E.under.x = d.ux + (p.x - d.x0); E.under.y = d.uy + (p.y - d.y0); const im = $("#meCanvas image"); if (im) { im.setAttribute("x", E.under.x * C); im.setAttribute("y", E.under.y * C); } return; }
    if (d.kind === "marker") { const g = $(`#meCanvas .lm-mk[data-ref="${CSS.escape(F.M[d.i][0])}"]`); if (g) g.setAttribute("transform", `translate(${(p.x - d.x0) * C} ${(p.y - d.y0) * C})`); d.moved = true; return; }
    if (d.kind === "room" || d.kind === "stair") { const r = d.kind === "room" ? F.R[d.i] : F.ST[d.i], dx = Math.round(p.x - d.x0), dy = Math.round(p.y - d.y0); if (dx || dy) d.moved = true; ghost(r[1] + dx, r[2] + dy, r[3], r[4]); d.dx = dx; d.dy = dy; return; }
    if (d.kind === "resize") { const r = F.R[d.i], dx = Math.round(p.x - d.x0), dy = Math.round(p.y - d.y0); let [x, y, w, h] = [r[1], r[2], r[3], r[4]]; if (d.hd.includes("w")) { x += dx; w -= dx; } if (d.hd.includes("e")) w += dx; if (d.hd.includes("n")) { y += dy; h -= dy; } if (d.hd.includes("s")) h += dy; if (w < 1) { if (d.hd.includes("w")) x = r[1] + r[3] - 1; w = 1; } if (h < 1) { if (d.hd.includes("n")) y = r[2] + r[4] - 1; h = 1; } d.box = [x, y, w, h]; ghost(x, y, w, h); return; }
    if (d.kind === "draw") { const cx = Math.floor(p.x), cy = Math.floor(p.y), x = Math.min(cx, d.cx), y = Math.min(cy, d.cy); d.box = [x, y, Math.abs(cx - d.cx) + 1, Math.abs(cy - d.cy) + 1]; ghost(...d.box); }
  }
  function up(e) {
    const d = E.drag; E.drag = null; if (!d) return;
    const p = pt(e), F = cur();
    if (d.kind === "under") { saveUnder(); paintSide(); return; }
    if (d.kind === "marker") { if (!d.moved) return; const dx = p.x - d.x0, dy = p.y - d.y0; change(() => { const m = F.M[d.i]; m[1] = Math.round((m[1] + dx) * 4) / 4; m[2] = Math.round((m[2] + dy) * 4) / 4; }); return; }
    if (d.kind === "room") { if (!d.moved) return; change(() => moveRoom(F, d.i, d.dx, d.dy)); return; }
    if (d.kind === "stair") { if (!d.moved) return; change(() => { F.ST[d.i][1] += d.dx; F.ST[d.i][2] += d.dy; }); return; }
    if (d.kind === "resize") { if (!d.box) return; change(() => { const r = F.R[d.i]; [r[1], r[2], r[3], r[4]] = d.box; }); return; }
    if (d.kind === "draw") {
      const [x, y, w, h] = d.box || [d.cx, d.cy, 1, 1]; if (x < 0 || y < 0 || x >= F.w || y >= F.h) { paintCanvas(); return; }
      const bw = Math.min(w, F.w - x), bh = Math.min(h, F.h - y);
      if (E.tool === "room") change(() => { F.R.push([nextRoom(), x, y, bw, bh, "New room", usualKind(F)]); E.sel = { kind: "room", i: F.R.length - 1 }; E.tool = "select"; });
      else change(() => { addStair(x, y, Math.max(1, bw), Math.max(1, bh)); E.tool = "select"; });
      if (E.sel && E.sel.kind === "room") setTimeout(() => { const n = $('#meSide [data-rv="name"]'); if (n) { n.focus(); n.select(); } }, 30);
    }
  }

  /* ---- the panel and the buttons */
  function bind(dlg) {
    const cv = dlg.querySelector("#meCanvas");
    cv.addEventListener("pointerdown", e => { if (!e.target.closest("svg")) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} down(e); });
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", () => { E.drag = null; paintCanvas(); });
    dlg.addEventListener("cancel", e => { if (E.dirty) { e.preventDefault(); close(); } });
    dlg.addEventListener("click", e => {
      const t = e.target;
      const tb = t.closest("[data-tool]"); if (tb) { E.tool = tb.dataset.tool; E.sel = E.tool === "select" ? E.sel : null; paint(); return; }
      const fb = t.closest("[data-mf]"); if (fb) { E.fi = +fb.dataset.mf; E.sel = null; paint(); return; }
      const dt = t.closest("[data-dt]"); if (dt) { E.doorType = dt.dataset.dt; paintSide(); return; }
      const gr = t.closest("[data-grow]"); if (gr) { const n = Math.max(1, Math.min(40, +(dlg.querySelector("[data-me-grow]") || {}).value || 4)); E.grow = n; change(() => grow(gr.dataset.grow, n)); return; }
      const b = t.closest("[data-me]"); if (!b) return;
      const F = cur();
      switch (b.dataset.me) {
        case "undo": undo(); break;
        case "redo": redo(); break;
        case "close": close(); break;
        case "save": save(); break;
        case "zin": E.zoom = Math.min(4, E.zoom * 1.25); paintCanvas(); break;
        case "zout": E.zoom = Math.max(.3, E.zoom / 1.25); paintCanvas(); break;
        case "addfloor": change(() => { E.draft.floors.push({ n: "Floor " + (E.draft.floors.length + 1), w: F.w, h: F.h, R: [], D: [], ST: [], M: [], I: [] }); if (E.draft.order) E.draft.order.push(E.draft.floors.length - 1); E.fi = E.draft.floors.length - 1; E.sel = null; }); break;
        case "delfloor": if (b.dataset.sure) change(() => { const gone = E.draft.floors.splice(E.fi, 1)[0], sids = new Set(gone.ST.map(s => s[0])); E.draft.floors.forEach(G => { G.ST = G.ST.filter(s => !sids.has(s[0])); }); if (E.draft.order) E.draft.order = E.draft.order.filter(i => i !== E.fi).map(i => i > E.fi ? i - 1 : i); E.fi = Math.max(0, E.fi - 1); E.sel = null; }); else { b.dataset.sure = 1; b.textContent = "Really take this floor away?"; } break;
        case "delroom": if (E.sel && E.sel.kind === "room") change(() => { delete E.draft.rooms[F.R[E.sel.i][0]]; F.R.splice(E.sel.i, 1); E.sel = null; }); break;
        case "delstair": if (E.sel && E.sel.kind === "stair") change(() => { const sid = F.ST[E.sel.i][0]; E.draft.floors.forEach(G => { G.ST = G.ST.filter(s => s[0] !== sid); }); E.sel = null; }); break;
        case "deldoor": if (E.sel && E.sel.kind === "door") change(() => { F.D.splice(E.sel.i, 1); E.sel = null; }); break;
        case "unpic": E.under = null; pref.set("u-" + E.id, null); paint(); break;
        case "ai": aiDraw(b); break;
        case "copy": copyText(); break;
        case "revert": if (b.dataset.sure) revert(); else { b.dataset.sure = 1; b.textContent = "Really go back to how it was drawn?"; } break;
      }
    });
    dlg.addEventListener("change", e => {
      const t = e.target, F = cur();
      if (t.matches("[data-me-pic]")) { if (t.files && t.files[0]) loadPicture(t.files[0]); return; }
      if (t.matches("[data-me-grow]")) { E.grow = +t.value || 4; return; }
      const sel = E.sel;
      if (t.dataset.rv && sel && sel.kind === "room") {
        change(() => {
          const r = F.R[sel.i], o = Object.assign({}, r[7] || {}), k = t.dataset.rv;
          if (k === "name") { const nm = t.value.trim().slice(0, 60); r[5] = nm; F.R.forEach(q => { if (q[0] === r[0] && q !== r) q[5] = nm; }); }
          else if (k === "kind") r[6] = t.value;
          else if (k === "fx") { if (t.value) o.fx = t.value; else delete o.fx; r[7] = o; }
          else if (k === "h") { if (t.checked) o.h = 1; else delete o.h; r[7] = o; }
          if (r[7] && !Object.keys(r[7]).length) r.length = 7;
        });
        return;
      }
      if (t.dataset.rg && sel && sel.kind === "room") { const rid = F.R[sel.i][0]; E.draft.rooms[rid] = Object.assign({}, E.draft.rooms[rid] || {}, { [t.dataset.rg]: t.value.slice(0, 1200) }); E.dirty = true; paintTop(); return; }
      if (t.dataset.mv) {
        const k = t.dataset.mv, v = Math.round(+t.value || 0);
        if (["x", "y", "w", "h"].includes(k) && sel && sel.kind === "room") { change(() => { const r = F.R[sel.i], ix = { x: 1, y: 2, w: 3, h: 4 }[k]; r[ix] = k === "w" || k === "h" ? Math.max(1, v) : Math.max(0, v); }); return; }
        if (k === "len" && sel && sel.kind === "door") { change(() => { F.D[sel.i][4] = Math.max(1, Math.min(6, v)); }); return; }
        if (k === "fw" || k === "fh") { change(() => { F[k === "fw" ? "w" : "h"] = Math.max(4, Math.min(400, v)); }); return; }
        if (["uw", "ux", "uy"].includes(k) && E.under) { E.under[{ uw: "w", ux: "x", uy: "y" }[k]] = k === "uw" ? Math.max(1, +t.value || 1) : +t.value || 0; saveUnder(); paintCanvas(); return; }
      }
      if (t.dataset.uv === "move") { E.underMove = t.checked; return; }
      if (t.dataset.uv === "op" && E.under) { E.under.op = +t.value; saveUnder(); paintCanvas(); return; }
      if (t.dataset.dv === "type" && sel && sel.kind === "door") { change(() => { F.D[sel.i][3] = t.value; if (t.value === "dd" && (F.D[sel.i][4] || 1) < 2) F.D[sel.i][4] = 2; }); return; }
      if (t.dataset.sv && sel && sel.kind === "stair") {
        const st = F.ST[sel.i];
        if (t.dataset.sv === "name") change(() => { const nm = t.value.trim().slice(0, 40); E.draft.floors.forEach(G => G.ST.forEach(s => { if (s[0] === st[0]) { s[8] = nm; } })); });
        else { const to = +($('#meSide [data-sv="to"]') || {}).value, ud = ($('#meSide [data-sv="ud"]') || {}).value || "up"; change(() => linkStair(st[0], to, ud)); }
        return;
      }
      if (t.dataset.fv) {
        if (t.dataset.fv === "n") change(() => { const old = F.n, nm = t.value.trim().slice(0, 40) || old; F.n = nm; E.draft.floors.forEach(G => G.ST.forEach(s => { if (s[6] === old) s[6] = nm; })); });
        if (t.dataset.fv === "gm") change(() => { if (t.checked) F.gm = 1; else delete F.gm; });
      }
    });
    dlg.addEventListener("keydown", e => {
      if (e.target.matches("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); return; }
      if ((k === "delete" || k === "backspace") && E.sel) { e.preventDefault(); const m = { room: "delroom", stair: "delstair", door: "deldoor" }[E.sel.kind]; const b = dlg.querySelector(`[data-me="${m}"]`); if (b) b.click(); return; }
      const tk = { v: "select", r: "room", d: "door", s: "stairs", e: "erase" }[k]; if (tk && !e.ctrlKey && !e.metaKey) { E.tool = tk; paint(); }
    });
  }

  /* ---- connecting it to the page: the edits in the database are laid over the places as they arrive */
  A.mapEditor = {
    open,
    init(store, ctx) {
      S = store; X = ctx;
      S.watch("mapedits", d => { if (T.applyMapEdits(d) && X && X.redraw) X.redraw(); });
      document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-medit]"); if (b) open(b.dataset.medit); });
    }
  };
})(ATLAS);
