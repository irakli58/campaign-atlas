/* The city editor (the user asked, 26 Oct 2026, in the world builder: "Existing City Map Editor: Expand Without
   Rebuilding"; and 27 Oct: every map editable when the generated one has a flaw, "editing the city however I want").
   A generated city is never built again: the game master's changes are a list of steps laid over the city as it was
   built, in order, the way atlas-locations.js sets the game master's own places into it. A house moved, turned or
   changed is cleared where it stood (it keeps its turn in the city's sequence, so no other house changes colour) and
   set down again at the end of the list with the colours and height it had; a house added, a road, a park or a square
   clears what stood under it. Steps: remove, move, change, add (houses); road; wall; gate; park; square; district.
   The steps are kept in the table's store ("cityedits", one document a city) and may be given back to the campaign
   as ATLAS.cityChanges(id, steps) in campaign.js. A real city is not edited here (its real streets stay as they are). */
(function (A) {
  "use strict";
  if (!A.cityKit) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = () => A.tableUI && A.tableUI.api && A.tableUI.api.store();
  const r1 = v => Math.round(v * 10) / 10;
  const KINDS = [["terrace", "A house"], ["shop", "A shop"], ["pub", "A tavern or inn"], ["church", "A church"], ["chapel", "A chapel"], ["school", "A school or hall"], ["ware", "A warehouse"], ["back", "A shed or outbuilding"]];
  const ROADS = [[0, "A main road"], [1, "A street"], [2, "A lane"], [3, "An alley"]], RW = [2.8, 1.7, 1.1, .7];
  const ZCOL = ["#8a2432", "#2f6b3a", "#2b5d8a", "#9a6a12", "#6b3a8a", "#2f7a7a", "#8a4b24", "#555f6b"];

  /* ---- laying the steps over a city */
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const segDist = (x, y, P) => { let best = 1e9; for (let i = 1; i < P.length; i++) { const [ax, ay] = P[i - 1], [bx, by] = P[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return best; };
  const corners = b => { const c = Math.cos(b.a || 0), s = Math.sin(b.a || 0); return [[-b.w / 2, -b.d / 2], [b.w / 2, -b.d / 2], [b.w / 2, b.d / 2], [-b.w / 2, b.d / 2]].map(([u, v]) => [b.x + u * c - v * s, b.y + u * s + v * c]); };
  const area = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return Math.abs(a / 2); };
  const hash = (a, b, c) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function snapshot(C) { return { buildings: C.buildings.map(b => Object.assign({}, b)), trees: C.trees.map(t => t.slice()), lamps: C.lamps.map(l => l.slice()), roads: C.roads.slice(), parks: C.parks.slice(), plazas: C.plazas.slice(), walls: C.walls.slice() }; }
  function reset(C, base) {
    C.buildings.length = 0; for (const b of base.buildings) C.buildings.push(Object.assign({}, b));
    C.trees = base.trees.map(t => t.slice()); C.lamps = base.lamps.map(l => l.slice());
    C.roads = base.roads.slice(); C.parks = base.parks.slice(); C.plazas = base.plazas.slice(); C.walls = base.walls.slice(); C.zones = []; C.gates = [];
  }
  // the house at a point: the one whose footprint holds it, or the nearest centre close by
  function houseAt(C, at) {
    let best = null, bd = 2.2;
    for (const b of C.buildings) { if (b.gone) continue; if (inPoly(at[0], at[1], corners(b))) return b; const d = Math.hypot(b.x - at[0], b.y - at[1]); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  // clear what stands under a shape: houses, trees, lamps (keep: the house just set down)
  function clear(C, inside, keep) {
    for (const b of C.buildings) if (b !== keep && !b.gone && (inside(b.x, b.y) || corners(b).some(([x, y]) => inside(x, y)))) b.gone = true;
    C.trees = C.trees.filter(([x, y]) => !inside(x, y)); C.lamps = C.lamps.filter(([x, y]) => !inside(x, y));
  }
  const looksOf = o => Object.assign({}, o.wallC ? { wallC: o.wallC } : {}, o.roofC ? { roofC: o.roofC } : {}, o.H ? { H: o.H } : {}, o.pitch != null ? { pitch: o.pitch } : {});
  function apply(C, steps) {
    for (const s of steps) {
      if (!s || !s.op) continue;
      if (["remove", "move", "change"].includes(s.op)) {
        const b = houseAt(C, s.at); if (!b) continue;
        b.gone = true; if (s.op === "remove") continue;
        const n = Object.assign({}, b, { gone: false, wallC: b.wallC, roofC: b.roofC, H: b.H, pitch: b.pitch }, looksOf(s.look || {}));
        if (s.op === "move") { if (s.to) { n.x = s.to[0]; n.y = s.to[1]; } if (s.ang != null) n.a = s.ang; }
        if (s.op === "change") {
          if (s.kind && s.kind !== b.type) { n.type = s.kind; delete n.wallC; delete n.roofC; }
          if (s.floors) n.H = Math.max(.6, +s.floors * .95);
          if (s.roof) n.pitch = s.roof === "pitched";
          if (s.w) n.w = +s.w; if (s.d) n.d = +s.d;
        }
        C.buildings.push(n); if (s.op === "move") clear(C, (x, y) => inPoly(x, y, corners(Object.assign({}, n, { w: n.w + .3, d: n.d + .3 }))), n);
      } else if (s.op === "add") {
        const n = { x: s.x, y: s.y, w: s.w || 3.2, d: s.d || 2.6, a: s.ang || 0, h: 1, type: s.kind || "terrace", west: .5, east: .5, roof: s.roof === "flat" ? 0 : 1, cls: 2, rid: -1, H: Math.max(.6, (+s.floors || 2) * .95), pitch: s.roof !== "flat", added: true };
        C.buildings.push(n); clear(C, (x, y) => inPoly(x, y, corners(Object.assign({}, n, { w: n.w + .3, d: n.d + .3 }))), n);
      } else if (s.op === "road" && (s.pts || []).length > 1) {
        const cls = Math.max(0, Math.min(3, s.cls == null ? 1 : +s.cls)), w = RW[cls];
        C.roads.push({ id: C.roads.length, pts: s.pts, cls, w, name: s.name || "", parent: -1, ign: null, label: !!s.name, own: true });
        clear(C, (x, y) => segDist(x, y, s.pts) < w / 2 + .35);
      } else if (s.op === "wall" && (s.pts || []).length > 1) {
        C.walls.push({ name: s.name || "", kind: s.kind || "wall", pts: s.pts, own: true });
        clear(C, (x, y) => segDist(x, y, s.pts) < 1.1);
      } else if (s.op === "gate" && s.at) {
        // the wall nearest the gate is opened there: split in two round a gap, a tower each side (atlas-city.js)
        let best = null; C.walls.forEach((w, wi) => { if (w.kind && w.kind !== "wall") return; for (let i = 1; i < w.pts.length; i++) { const d = segDist(s.at[0], s.at[1], [w.pts[i - 1], w.pts[i]]); if (!best || d < best.d) best = { d, wi, i }; } });
        if (!best || best.d > 6) continue;
        const w = C.walls[best.wi], [ax, ay] = w.pts[best.i - 1], [bx, by] = w.pts[best.i], L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
        const t = Math.max(0, Math.min(L, (s.at[0] - ax) * ux + (s.at[1] - ay) * uy)), gx = ax + ux * t, gy = ay + uy * t, gap = s.gap || 3.6;
        const A1 = w.pts.slice(0, best.i).concat([[gx - ux * gap / 2, gy - uy * gap / 2]]), B1 = [[gx + ux * gap / 2, gy + uy * gap / 2]].concat(w.pts.slice(best.i));
        C.walls.splice(best.wi, 1, Object.assign({}, w, { pts: A1 }), Object.assign({}, w, { pts: B1, name: "" }));
        C.gates.push([gx, gy, Math.atan2(uy, ux), gap]);
      } else if ((s.op === "park" || s.op === "plaza") && (s.pts || []).length > 2) {
        const P = s.pts; clear(C, (x, y) => inPoly(x, y, P));
        if (s.op === "plaza") C.plazas.push({ name: s.name || "", pts: P, own: true });
        else {
          C.parks.push({ name: s.name || "", pts: P, own: true });
          // trees among the grass, as many as a park of the city has
          const xs = P.map(p => p[0]), ys = P.map(p => p[1]), n = Math.min(400, Math.round(area(P) / 18)), x0 = Math.min(...xs), y0 = Math.min(...ys), sx = Math.max(...xs) - x0, sy = Math.max(...ys) - y0;
          for (let k = 0, made = 0; k < n * 4 && made < n; k++) { const x = x0 + hash(k, sx * 10, 3) * sx, y = y0 + hash(k, sy * 10, 7) * sy; if (inPoly(x, y, P)) { C.trees.push([x, y, .9 + hash(k, 5, 9) * .7]); made++; } }
        }
      } else if (s.op === "district" && (s.pts || []).length > 2) {
        const f = s.owner && A.lives && A.lives.fac(s.owner);
        C.zones.push({ name: s.name || "", pts: s.pts, owner: s.owner || "", col: s.col || (f ? f.color : ZCOL[C.zones.length % ZCOL.length]) });
      }
    }
  }
  const stepsOf = id => (((store() && store().get("cityedits", id)) || {}).steps) || [];
  const allSteps = id => [...((A.cityChangeData || {})[id] || []), ...stepsOf(id)];

  /* ---- the people the game master places in the city (the user's queue, 27 Oct 2026: "people placed in a city"): each
          of the campaign's people where they are, with a note of what they are doing there; one place each; kept in
          the table's store ("citypeople", one document a city) and shown whenever the city is */
  const peopleOf = id => (((store() && store().get("citypeople", id)) || {}).list) || [];
  const cast = () => A.story && A.story.people ? A.story.people().map(p => [p.ref, p.name]) : [];
  const nameOf = ref => (cast().find(c => c[0] === ref) || [0, String(ref || "").replace(/^[a-z]+:/, "")])[1];
  function showPeople(ctl, selRef) { if (ctl.map && ctl.map.people) ctl.map.people(peopleOf(ctl.city).map(q => Object.assign({ name: nameOf(q.ref), sel: q.ref === selRef }, q))); }

  /* ---- attaching to a city as it is built (atlas-city.js calls this before drawing it) */
  A.cityEditor = {
    attach(ctl, C) {
      const id = ctl.city; ctl.ce = { base: snapshot(C), C, applied: "" };
      reset(C, ctl.ce.base); apply(C, allSteps(id)); ctl.ce.applied = JSON.stringify(allSteps(id));
      // (the store may answer after the city is up, or another window may change it: drawn again when its steps differ)
      const hook = () => { const st = store(); if (!st) return false; st.watch("cityedits", () => { if (!ctl.ce || ctl.ce.busy) return; const now = JSON.stringify(allSteps(id)); if (now !== ctl.ce.applied) redraw(ctl); }); st.watch("citypeople", () => showPeople(ctl, ctl.ceUI && ctl.ceUI.selRef())); return true; };
      if (!hook()) { const iv = setInterval(() => { if (hook()) clearInterval(iv); }, 300); setTimeout(() => clearInterval(iv), 60000); }
      // (the people are shown once the city's map is up)
      const up = () => { if (!ctl.map || !ctl.map.people || !store()) return false; showPeople(ctl); return true; };
      if (!up()) { const iv = setInterval(() => { if (up()) clearInterval(iv); }, 400); setTimeout(() => clearInterval(iv), 60000); }
    },
    open, apply, KINDS
  };
  function redraw(ctl) {
    const id = ctl.city, C = ctl.ce.C;
    reset(C, ctl.ce.base); apply(C, allSteps(id)); ctl.ce.applied = JSON.stringify(allSteps(id));
    if (ctl.redraw) ctl.redraw();
    showPeople(ctl, ctl.ceUI && ctl.ceUI.selRef());
    if (ctl.ceUI) ctl.ceUI.after();
  }

  /* ---- the editor's bar and its tools */
  function open(ctl, box) {
    if (ctl.ceUI) { ctl.ceUI.close(); return; }
    A.cityEditor.current = ctl;   // (the city being edited: the lessons and the checks find it here)
    const bar = box.querySelector(".cebar"), host = box.querySelector(".map3d"), id = ctl.city;
    const U = { tool: "select", sel: null, pts: [], redo: [], moving: false, note: "", selP: null, movingP: false };
    const st = store(); if (!st) return;
    ctl.placing = true;
    const save = steps => { ctl.ce.busy = true; st.set("cityedits", id, { steps, t: Date.now() }); ctl.ce.busy = false; redraw(ctl); };
    const push = s => { U.redo = []; save(stepsOf(id).concat([s])); };
    const savePeople = list => { st.set("citypeople", id, { list, t: Date.now() }); showPeople(ctl, U.selP); render(); };
    const facs = () => A.lives ? A.lives.ids().map(f => [f, (A.lives.fac(f) || {}).n || f]) : [];
    const opt = (list, cur) => list.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`).join("");
    const TOOLS = [["select", "Choose a building"], ["add", "+ Building"], ["road", "+ Road"], ["wall", "+ Wall"], ["gate", "+ Gate"], ["park", "+ Park"], ["plaza", "+ Square"], ["district", "+ District"], ["person", "+ Person"]];
    const HOW = { select: "Click a building to move, turn, change or remove it.", add: "Click where the new building stands.", road: "Click along the road's way; Finish when it is drawn.", wall: "Click along the wall; Finish when it is drawn.", gate: "Click on a wall where the gate is.", park: "Click round the park's edge; Finish to close it.", plaza: "Click round the square's edge; Finish to close it.", district: "Click round the district; Finish to close it.", person: "Choose who, then click where they are in the city. Click a person to move them or take them away." };
    function render() {
      const C = ctl.ce.C, b = U.sel, n = stepsOf(id).length;
      bar.hidden = false;
      bar.innerHTML = `<div class="ce-row">${TOOLS.map(([k, l]) => `<button type="button" data-ce="tool" data-t="${k}" aria-pressed="${U.tool === k}">${l}</button>`).join("")}<span class="ce-sp"></span><button type="button" data-ce="undo"${n ? "" : " disabled"}>Undo</button><button type="button" data-ce="redo"${U.redo.length ? "" : " disabled"}>Redo</button><button type="button" data-ce="export"${n ? "" : " disabled"}>Copy the changes</button><button type="button" data-ce="done" class="ce-done">Done</button></div>
        <div class="ce-how">${U.moving ? "Click where the building should stand." : esc(HOW[U.tool])}${U.pts.length ? ` <button type="button" data-ce="finish">Finish</button> <button type="button" data-ce="back">Take back a point</button>` : ""}${U.note ? ` <span class="ce-note">${esc(U.note)}</span>` : ""}</div>
        ${["road", "wall"].includes(U.tool) || (U.tool === "add") || ["park", "plaza", "district"].includes(U.tool) ? `<div class="ce-opts">${U.tool === "road" ? `<label>Kind <select data-ce="o" data-k="cls">${opt(ROADS, U.cls == null ? 1 : U.cls)}</select></label>` : ""}${U.tool === "add" ? `<label>Kind <select data-ce="o" data-k="kind">${opt(KINDS, U.kind || "terrace")}</select></label><label>Floors <input type="number" min="1" max="12" data-ce="o" data-k="floors" value="${U.floors || 2}"></label><label>Roof <select data-ce="o" data-k="roof">${opt([["pitched", "Pitched"], ["flat", "Flat"]], U.roof || "pitched")}</select></label>` : ""}${U.tool !== "add" ? `<label>Name <input data-ce="o" data-k="name" maxlength="60" value="${esc(U.name || "")}" placeholder="optional"></label>` : ""}${U.tool === "district" && facs().length ? `<label>Held by <select data-ce="o" data-k="owner">${opt([["", "No one"], ...facs()], U.owner || "")}</select></label>` : ""}</div>` : ""}
        ${U.tool === "person" ? `<div class="ce-opts">${cast().length ? `<label>Who <select data-ce="o" data-k="who">${opt([["", "Choose someone…"], ...cast()], U.who || "")}</select></label><label>Doing <input data-ce="o" data-k="pnote" maxlength="80" value="${esc(U.pnote || "")}" placeholder="optional: what they are doing here"></label>` : `<span class="ce-note">The campaign has no people yet.</span>`}</div>` : ""}
        ${U.selP ? (q => q ? `<div class="ce-sel"><strong>${esc(nameOf(q.ref))}</strong><label>Doing <input data-ce="pnote" maxlength="80" value="${esc(q.note || "")}" placeholder="what they are doing here"></label><button type="button" data-ce="pmove">Move</button><button type="button" data-ce="premove" class="ce-del">Take away</button></div>` : "")(peopleOf(id).find(q => q.ref === U.selP)) : ""}
        ${b && !b.gone ? `<div class="ce-sel"><strong>${esc((KINDS.find(k => k[0] === b.type) || [0, "A building"])[1])}</strong>
          <button type="button" data-ce="move">Move</button><button type="button" data-ce="turn" data-d="-1" title="Turn it left">⟲</button><button type="button" data-ce="turn" data-d="1" title="Turn it right">⟳</button>
          <label>Kind <select data-ce="kind">${opt(KINDS, b.type)}</select></label><label>Floors <input type="number" min="1" max="12" data-ce="floors" value="${Math.max(1, Math.round((b._H || 1.9) / .95))}"></label><label>Roof <select data-ce="roof">${opt([["pitched", "Pitched"], ["flat", "Flat"]], b._pitch ? "pitched" : "flat")}</select></label>
          ${A.locations && A.locations.fromBuilding ? `<button type="button" data-ce="makeplace" title="Make this building one of your own places, with its own maps, people and clues">Make it a place</button>` : ""}<button type="button" data-ce="remove" class="ce-del">Remove</button></div>` : ""}`;
    }
    // where a step points: the building's centre as it stands now
    const at = b => [r1(b.x), r1(b.y)];
    const look = b => ({ wallC: b._wall, roofC: b._roof, H: r1(b._H * 100) / 100, pitch: !!b._pitch });
    function onClick(ev) {
      if (ev.button !== 0 || !ctl.map) return;
      const p = ctl.map.planAt(ev.clientX, ev.clientY); if (!p) return;
      const C = ctl.ce.C;
      if (U.moving && U.sel) { const b = U.sel; U.moving = false; push({ op: "move", at: at(b), to: [r1(p[0]), r1(p[1])], look: look(b) }); return; }
      if (U.movingP && U.selP) { U.movingP = false; savePeople(peopleOf(id).map(q => q.ref === U.selP ? Object.assign({}, q, { at: [r1(p[0]), r1(p[1])] }) : q)); return; }
      if (U.tool === "person") { if (!U.who) { U.note = "Choose who first."; render(); return; } U.note = ""; U.selP = U.who; savePeople(peopleOf(id).filter(q => q.ref !== U.who).concat([{ ref: U.who, at: [r1(p[0]), r1(p[1])], note: (U.pnote || "").trim() }])); return; }
      if (U.tool === "select") { const ib = ctl.map.pickBuilding(ev.clientX, ev.clientY); U.sel = ib != null ? C.buildings[ib] : null; if (U.sel && U.selP) { U.selP = null; showPeople(ctl); } ctl.map.mark(U.sel); render(); return; }
      if (U.tool === "add") { push({ op: "add", x: r1(p[0]), y: r1(p[1]), ang: 0, kind: U.kind || "terrace", floors: +U.floors || 2, roof: U.roof || "pitched" }); return; }
      if (U.tool === "gate") { push({ op: "gate", at: [r1(p[0]), r1(p[1])] }); return; }
      U.pts.push([r1(p[0]), r1(p[1])]); ctl.map.guide(U.pts, ["park", "plaza", "district"].includes(U.tool)); render();
    }
    function finish() {
      const closed = ["park", "plaza", "district"].includes(U.tool), need = closed ? 3 : 2;
      if (U.pts.length < need) { U.note = closed ? "Three corners at least." : "Two points at least."; render(); return; }
      const s = { op: U.tool, pts: U.pts.slice() }; if (U.name) s.name = U.name;
      if (U.tool === "road") s.cls = U.cls == null ? 1 : +U.cls; if (U.tool === "district" && U.owner) s.owner = U.owner;
      U.pts = []; U.name = ""; ctl.map.guide(null); push(s);
    }
    let down = null;
    const pd = ev => { down = { x: ev.clientX, y: ev.clientY }; }, pu = ev => { if (!down) return; const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y); down = null; if (moved < 6 && ev.target.closest("canvas")) onClick(ev); };
    host.addEventListener("pointerdown", pd); host.addEventListener("pointerup", pu);
    const key = ev => { if (ev.target.closest && ev.target.closest("input, select, textarea")) return; if (ev.key === "Enter" && U.pts.length) { ev.preventDefault(); finish(); } else if (ev.key === "Escape") { U.pts = []; U.moving = false; ctl.map.guide(null); render(); } else if ((ev.ctrlKey || ev.metaKey) && /^[zy]$/i.test(ev.key)) { ev.preventDefault(); undo(!(ev.key.toLowerCase() === "y" || ev.shiftKey)); } };
    box.addEventListener("keydown", key);
    function undo(back) {
      const steps = stepsOf(id);
      if (back) { if (!steps.length) return; U.redo.push(steps[steps.length - 1]); U.sel = null; ctl.map.mark(null); save(steps.slice(0, -1)); }
      else { if (!U.redo.length) return; const s = U.redo.pop(); save(steps.concat([s])); }
    }
    function exportJS() {
      const js = `// The city as the game master changed it on the page (${new Date().toISOString().slice(0, 10)}). Put it in campaign.js;\n// the page's own changes are laid after it.\nATLAS.cityChanges(${JSON.stringify(id)}, ${JSON.stringify(allSteps(id), null, 1)});\n`;
      const d = document.createElement("div"); d.className = "ce-export"; d.innerHTML = `<p>Every change to this city, for the campaign's campaign.js:</p><textarea readonly rows="8">${esc(js)}</textarea><div><button type="button" data-ce="copy">Copy</button><button type="button" data-ce="closex">Close</button></div>`;
      bar.appendChild(d); const ta = d.querySelector("textarea"); ta.focus(); ta.select();
    }
    function onBar(ev) {
      const b = ev.target.closest("[data-ce]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
      const k = b.dataset.ce, s = U.sel;
      if (k === "tool") { U.tool = b.dataset.t; U.pts = []; U.moving = false; U.note = ""; ctl.map.guide(null); if (U.tool !== "select") { U.sel = null; ctl.map.mark(null); } render(); }
      else if (k === "finish") finish();
      else if (k === "back") { U.pts.pop(); ctl.map.guide(U.pts, ["park", "plaza", "district"].includes(U.tool)); render(); }
      else if (k === "undo") undo(true); else if (k === "redo") undo(false);
      else if (k === "export") exportJS();
      else if (k === "copy") { const ta = bar.querySelector(".ce-export textarea"); ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => { b.textContent = "Copied"; }, () => { try { document.execCommand("copy"); b.textContent = "Copied"; } catch (e) {} }); }
      else if (k === "closex") { const d = bar.querySelector(".ce-export"); if (d) d.remove(); }
      else if (k === "done") close();
      else if (k === "pmove" && U.selP) { U.movingP = true; U.note = "Click where they are now."; render(); }
      else if (k === "premove" && U.selP) { const r = U.selP; U.selP = null; savePeople(peopleOf(id).filter(q => q.ref !== r)); }
      else if (s && k === "makeplace") { const b = s; close(); A.locations.fromBuilding(ctl, b); }
      else if (s && k === "move") { U.moving = true; render(); }
      else if (s && k === "turn") push({ op: "move", at: at(s), ang: r1(((s.a || 0) + +b.dataset.d * Math.PI / 12) * 1000) / 1000, look: look(s) });
      else if (s && k === "remove") { push({ op: "remove", at: at(s) }); U.sel = null; ctl.map.mark(null); }
    }
    function onChange(ev) {
      const t = ev.target, k = t.dataset && t.dataset.ce, s = U.sel; if (!k) return;
      if (k === "o") { U[t.dataset.k] = t.value; return; }
      if (k === "pnote" && U.selP) { savePeople(peopleOf(id).map(q => q.ref === U.selP ? Object.assign({}, q, { note: t.value.trim() }) : q)); return; }
      if (s && k === "kind") push({ op: "change", at: at(s), kind: t.value, look: look(s) });
      else if (s && k === "floors") push({ op: "change", at: at(s), floors: Math.max(1, Math.min(12, +t.value || 1)), look: look(s) });
      else if (s && k === "roof") push({ op: "change", at: at(s), roof: t.value, look: look(s) });
    }
    bar.addEventListener("click", onBar); bar.addEventListener("change", onChange);
    const onPerson = ev => { const el = ev.target.closest && ev.target.closest("[data-person]"); if (!el) return; ev.preventDefault(); ev.stopPropagation(); U.selP = el.dataset.person; U.sel = null; U.movingP = false; if (ctl.map) ctl.map.mark(null); showPeople(ctl, U.selP); render(); };
    box.addEventListener("click", onPerson, true);
    // (after each redraw the chosen building is found again where the step put it)
    const after = () => { if (U.sel) { const last = stepsOf(id).slice(-1)[0]; const C = ctl.ce.C, p = last && (last.to || (last.op === "move" || last.op === "change" ? last.at : null)); U.sel = p ? houseAt(C, p) : null; } if (ctl.map) ctl.map.mark(U.sel); render(); };
    function close() { box.removeEventListener("click", onPerson, true); showPeople(ctl); host.removeEventListener("pointerdown", pd); host.removeEventListener("pointerup", pu); box.removeEventListener("keydown", key); bar.removeEventListener("click", onBar); bar.removeEventListener("change", onChange); bar.hidden = true; bar.innerHTML = ""; if (ctl.map) { ctl.map.mark(null); ctl.map.guide(null); } ctl.placing = false; ctl.ceUI = null; box.querySelector("[data-editcity]").setAttribute("aria-pressed", "false"); }
    ctl.ceUI = { close, after, selRef: () => U.selP };
    box.querySelector("[data-editcity]").setAttribute("aria-pressed", "true");
    render();
  }
})(ATLAS);
