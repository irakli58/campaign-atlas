/* Caves, riddles and traps as the referee works with them (the data and the reasoning are atlas-cave.js,
   atlas-puzzles.js and atlas-traps.js). The user asked for it on 21 Oct 2026: "Generate Cave", "Generate Riddle",
   "Generate Trap", "Generate Cave with Riddles and Traps", "Regenerate Selected Room / Riddle / Trap", every part
   editable afterwards, nothing hand-made overwritten without asking, undo, and the answers never in front of the
   players unless the game master shows them.
   In the map editor: "Generate a cave" (a window of settings, a seed, a look at it before it is used, then it
   replaces the map or goes below it as new levels); the Carve and Ground tools (brushes that cut floor out of the rock,
   fill it back, or change what the floor is and how high it stands); a chosen chamber grown, shrunk, moved whole or
   given a new shape; "Check the way through" and "Mend it"; the Traps and Riddles tools (a click makes one there,
   chosen and edited in the panel, joined into chains that cannot loop). At the table: each trap's and riddle's state,
   its hints given one at a time, the riddle shown to the players as an inscription, a trap shown on their map, a
   chain run through. Everything made here is kept as clues are (the story's trapbook and riddlebook, and in the
   Atlas app edits/story.js). */
(function (A) {
  "use strict";
  if (!A.cave || !A.devices) return;
  const CV = A.cave, D = A.devices, St = A.story, esc = A.esc, C = A.C;
  const $ = s => document.querySelector(s);
  const copy = o => JSON.parse(JSON.stringify(o));
  const opt = (list, cur) => list.map(([v, l]) => `<option value="${esc(v)}"${String(cur) === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("");
  const lines = s => String(s || "").split(/\n/).map(x => x.trim()).filter(Boolean);
  const TRAP_STATES = [["armed", "Armed, not found"], ["found", "Found by the players"], ["triggered", "Gone off"], ["disarmed", "Disarmed"]];
  const RIDDLE_STATES = [["unsolved", "Not solved"], ["solved", "Solved"], ["failed", "Failed"]];

  /* ================================================================ at the table: the place's guide */
  A.devPanel = (pl, id, kind) => {
    if (!St || !St.ready || !St.ready()) return "";
    const s = St.devState(pl, id), rec = kind === "trap" ? St.trap(pl, id) : St.riddle(pl, id); if (!rec) return "";
    if (kind === "trap") return `<div class="dv-live" data-dvp="${esc(pl)}/${esc(id)}" data-dvk="trap"><label>Now: <select data-dvs>${opt(TRAP_STATES, s.s || "armed")}</select></label>
      <label class="dv-ck"><input type="checkbox" data-dvshow${s.shown ? " checked" : ""}> On the players' map</label>
      ${(rec.links || []).length ? `<button type="button" class="t-mini" data-dvrun>Run the chain</button>` : ""}<div class="dv-out"></div></div>`;
    const given = s.hints || 0;
    return `<div class="dv-live" data-dvp="${esc(pl)}/${esc(id)}" data-dvk="riddle"><label>Now: <select data-dvs>${opt(RIDDLE_STATES, s.s || "unsolved")}</select></label>
      <button type="button" class="t-mini" data-dvshow>Show the players the words</button>
      ${(rec.hints || []).length ? `<button type="button" class="t-mini" data-dvhint${given >= rec.hints.length ? " disabled" : ""}>${given >= rec.hints.length ? "Every hint given" : `Give hint ${given + 1} of ${rec.hints.length}`}</button>` : ""}
      ${given ? `<ol class="dv-given">${rec.hints.slice(0, given).map((h, i) => `<li>${esc(h)} <button type="button" class="t-mini" data-dvhintshow="${i}" title="Show this hint on the players' screen">Show</button></li>`).join("")}</ol>` : ""}
      ${(rec.links || []).length ? `<button type="button" class="t-mini" data-dvrun="solve">If solved…</button><button type="button" class="t-mini" data-dvrun="fail">If failed…</button>` : ""}<div class="dv-out"></div></div>`;
  };
  // the card stays open (and in view) when the page is drawn again after a change
  const keepOpen = (pl, id) => { for (const ms of [120, 400]) setTimeout(() => { const el = document.getElementById("lm-" + pl + "-" + id); if (el && !el.open) { el.open = true; el.scrollIntoView({ block: "nearest" }); } }, ms); };
  // the players' screen: through the table's own way of showing them things (atlas-table-gm.js)
  const showPlayers = doc => { const api = A.tableUI && A.tableUI.api; if (api && api.show) { api.show(doc); return true; } return false; };
  const bookOf = pl => { const M = A.get(pl, 99) || {}; return Object.assign({}, M.traps || {}, M.riddles || {}); };
  const nameIn = pl => x => { const M = A.get(pl, 99) || {}; if (/^door:/.test(x)) return "the door it guards"; const r = (M.traps || {})[x] || (M.riddles || {})[x] || (M.enc || {})[x] || (M.secrets || {})[x]; return r ? `${x} ${r.t || ""}`.trim() : x; };
  if (typeof document !== "undefined") document.addEventListener("click", e => {
    const t = e.target, box = t.closest && t.closest(".dv-live"); if (!box) return;
    const [pl, id] = box.dataset.dvp.split("/"), kind = box.dataset.dvk, rec = kind === "trap" ? St.trap(pl, id) : St.riddle(pl, id), out = box.querySelector(".dv-out"); if (!rec) return;
    keepOpen(pl, id);
    if (t.matches("[data-dvshow]") && kind === "riddle") { const ok = showPlayers({ kind: "handout", id: "riddle-" + pl + "-" + id, h: { kind: "inscription", title: rec.t, text: rec.pd } }); St.setDevState(pl, id, { shown: 1 }); out.textContent = ok ? "On the players' screen now, and in their handouts." : "The players' screen is not open in this page."; return; }
    if (t.matches("[data-dvhint]")) { const n = (St.devState(pl, id).hints || 0) + 1; St.setDevState(pl, id, { hints: Math.min(n, (rec.hints || []).length) }); return; }
    if (t.matches("[data-dvhintshow]")) { const h = (rec.hints || [])[+t.dataset.dvhintshow]; if (h) showPlayers({ kind: "scene", title: rec.t, text: h }); out.textContent = "The hint is on the players' screen."; return; }
    if (t.matches("[data-dvrun]")) { const on = t.dataset.dvrun || "trigger", steps = D.fire(bookOf(pl), id, on, nameIn(pl)); out.innerHTML = steps.length ? `<ol class="dv-chain">${steps.map(s => `<li style="margin-left:${s.depth}em"${s.stop ? ' class="stop"' : ""}>${esc(s.text)}</li>`).join("")}</ol>` : "<p>Nothing is joined to it for that.</p>"; return; }
  });
  if (typeof document !== "undefined") document.addEventListener("change", e => {
    const t = e.target, box = t.closest && t.closest(".dv-live"); if (!box) return;
    const [pl, id] = box.dataset.dvp.split("/"); keepOpen(pl, id);
    if (t.matches("[data-dvs]")) St.setDevState(pl, id, { s: t.value });
    if (t.matches("[data-dvshow]") && t.type === "checkbox") St.setDevState(pl, id, { shown: t.checked ? 1 : 0 });
  });

  /* ================================================================ the map editor */
  if (!A.mapEditor || !A.mapEditor.plug) return;
  let ed = null;
  const E = () => ed.E, F = () => ed.cur();
  const cvs = () => E().cv;
  const dv = () => E().draft.dv || (E().draft.dv = { recs: {}, gone: [] });
  const place = () => E().id;
  const tone = () => D.tone();
  const caveSet = () => Object.assign({}, CV.DEFAULTS, ((E().draft.more || {}).cave || {}).settings || ((A.get(place(), 99) || {}).cave || {}).settings || {});
  const roomIx = (Fl, x, y) => { const R = Fl.R || []; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4]) return i; } return -1; };
  const roomAtP = (x, y) => { const i = roomIx(F(), Math.floor(x), Math.floor(y)); return i >= 0 ? F().R[i][0] : ""; };
  const nextR = () => { let n = 0; for (const G of E().draft.floors) for (const r of G.R) { const m = /^R(\d+)$/.exec(r[0]); if (m) n = Math.max(n, +m[1]); } const M0 = A.get(place(), 99) || {}; for (const k of Object.keys(M0.rooms || {})) { const m = /^R(\d+)$/.exec(k); if (m) n = Math.max(n, +m[1]); } return "R" + (n + 1); };
  const recOf = id => dv().recs[id] || (id[0] === "T" ? St.trap(place(), id) : St.riddle(place(), id)) || null;
  const markerIds = () => { const out = []; for (const G of E().draft.floors) for (const m of G.M || []) out.push(m[0]); return out.concat(Object.keys(dv().recs)); };

  /* ---- generating a cave: the window */
  function settingsHTML(s) {
    const sel = ([k, label, list]) => `<label class="cv-f"><span>${esc(label)}</span><select name="${k}">${opt(list, s[k])}</select></label>`;
    return `<div class="cv-grid">${CV.SETTINGS.map(sel).join("")}</div>
      <details class="cv-more"${s.size === "custom" || s.levels || s.traps === "custom" || s.riddles === "custom" ? " open" : ""}><summary>More</summary><div class="cv-grid">
        <label class="cv-f"><span>Squares wide (my own size)</span><input type="number" name="w" min="20" max="160" value="${s.w || 56}"></label>
        <label class="cv-f"><span>Squares deep (my own size)</span><input type="number" name="h" min="16" max="120" value="${s.h || 40}"></label>
        <label class="cv-f"><span>Levels (0: as the heights setting says)</span><input type="number" name="levels" min="0" max="5" value="${s.levels || 0}"></label>
        <label class="cv-f"><span>How many traps (when "Exactly")</span><input type="number" name="nTraps" min="0" max="40" value="${s.nTraps || 4}"></label>
        <label class="cv-f"><span>How many riddles (when "Exactly")</span><input type="number" name="nRiddles" min="0" max="30" value="${s.nRiddles || 2}"></label>
        <label class="cv-f"><span>Where the traps go</span><select name="trapsWhere">${opt([["guard", "Guarding what matters"], ["passages", "In the narrow passages"], ["doors", "At doors and hidden ways"], ["everywhere", "Anywhere"]], s.trapsWhere)}</select></label>
        <label class="cv-f"><span>Where the riddles go</span><select name="riddlesWhere">${opt([["doors", "At doors and sealed ways"], ["shrines", "In shrines and great halls"], ["everywhere", "Anywhere"]], s.riddlesWhere)}</select></label>
      </div></details>`;
  }
  function genDialog() {
    let dlg = $("#cvDlg");
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "cvDlg"; dlg.className = "cv-dlg"; document.body.appendChild(dlg);
      dlg.addEventListener("click", e => { const b = e.target.closest("[data-cvd]"); if (b) { e.preventDefault(); dlgAct(b.dataset.cvd, b); } });
      dlg.addEventListener("change", e => { if (e.target.name === "size" || e.target.name === "traps" || e.target.name === "riddles") { const more = dlg.querySelector(".cv-more"); if (more && /custom/.test(e.target.value)) more.open = true; } });
      dlg.addEventListener("cancel", () => { cvs().gen = null; });
    }
    const s = cvs().last || Object.assign({}, CV.DEFAULTS, { seed: CV.newSeed() }), had = E().draft.floors.some(G => (G.R || []).length);
    dlg.innerHTML = `<form class="cv-form" onsubmit="return false"><div class="cv-head"><h3>Generate a cave</h3><span class="t-sp"></span><button type="button" data-cvd="x" aria-label="Close">×</button></div>
      <p class="cv-help">Choose what kind of cave, or let Atlas choose. The same seed and the same settings always make the same cave; change only the traps or riddles and the chambers stay where they are.</p>
      <div class="cv-row"><button type="button" data-cvd="random">A random cave</button><label class="cv-f cv-seed"><span>Seed</span><input name="seed" value="${esc(s.seed || "")}" maxlength="60"></label><button type="button" data-cvd="seed">New seed</button></div>
      ${settingsHTML(s)}
      <fieldset class="cv-where"><legend>Where it goes</legend>
        <label><input type="radio" name="where" value="replace" checked> ${had ? "In place of this map (Undo brings the map back)" : "As this place's map"}</label>
        ${had ? `<label><input type="radio" name="where" value="below"> Below it, as new levels (join them with the Stairs tool)</label>` : ""}</fieldset>
      <div class="cv-prev"></div>
      <div class="cv-act"><button type="button" class="prim" data-cvd="make">Make it</button><button type="button" data-cvd="use" disabled>Use this cave</button><button type="button" data-cvd="x">Close</button></div></form>`;
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  const formSettings = dlg => { const f = dlg.querySelector("form"), s = {}; for (const [k] of CV.SETTINGS) s[k] = f.elements[k].value; for (const k of ["w", "h", "levels", "nTraps", "nRiddles"]) s[k] = +f.elements[k].value || 0; s.trapsWhere = f.elements.trapsWhere.value; s.riddlesWhere = f.elements.riddlesWhere.value; s.seed = f.elements.seed.value.trim() || CV.newSeed(); return s; };
  function dlgAct(k, b) {
    const dlg = $("#cvDlg"), f = dlg.querySelector("form");
    if (k === "x") { cvs().gen = null; dlg.close(); return; }
    if (k === "seed") { f.elements.seed.value = CV.newSeed(); return; }
    if (k === "random") { const s = CV.randomSettings(CV.newSeed()); cvs().last = s; genDialog(); dlgAct("make"); return; }
    if (k === "make") {
      const s = formSettings(dlg); cvs().last = s;
      b && (b.disabled = true);
      setTimeout(() => {
        let res = null, err = "";
        try { res = CV.generate(s); } catch (x) { err = x.message || String(x); console.warn(x); }
        if (b) b.disabled = false;
        const pv = dlg.querySelector(".cv-prev");
        if (!res) { pv.innerHTML = `<p class="cv-err">The cave could not be made: ${esc(err)}. Nothing has changed; try another seed.</p>`; return; }
        cvs().gen = res; cvs().pfi = 0; preview(); dlg.querySelector('[data-cvd="use"]').disabled = false;
      }, 20);
      return;
    }
    if (k === "pf") { cvs().pfi = +b.dataset.fi; preview(); return; }
    if (k === "use") { const where = (f.elements.where || {}).value || "replace"; adopt(cvs().gen, where); cvs().gen = null; dlg.close(); return; }
  }
  function preview() {
    const dlg = $("#cvDlg"), res = cvs().gen, pv = dlg.querySelector(".cv-prev"); if (!res) return;
    const M = res.map, r = res.report, fi = cvs().pfi || 0, c = r.check;
    A.maps.__cvprev = Object.assign({ t: "Preview" }, copy(M)); A.state.cache = {};
    let svg = ""; try { svg = A.svg("__cvprev", fi, "gm", "cvp" + (A.state.n++), 0); } finally { delete A.maps.__cvprev; A.state.cache = {}; }
    pv.innerHTML = `<div class="cv-rep"><b>${r.chambers} chambers, ${r.passages} passages${r.built ? ", " + r.built + " built rooms" : ""}</b> on ${r.levels === 1 ? "one level" : r.levels + " levels"} (${r.size.join(" × ")} squares). ${r.traps} trap${r.traps === 1 ? "" : "s"}, ${r.riddles} riddle${r.riddles === 1 ? "" : "s"}, ${r.secrets} secret door${r.secrets === 1 ? "" : "s"}, ${r.encounters} encounter${r.encounters === 1 ? "" : "s"}. <span class="${c.ok ? "cv-ok" : "cv-err"}">${esc(c.summary)}.</span></div>
      ${M.floors.length > 1 ? `<div class="cv-pf">${M.floors.map((G, i) => `<button type="button" data-cvd="pf" data-fi="${i}" aria-pressed="${i === fi}">${esc(G.n)}</button>`).join("")}</div>` : ""}
      <div class="cv-svg">${svg.replace(/ class="lmap2"/, ' class="cv-map"').replace(/ style="min-width:[^"]*"/, "")}</div>`;
  }
  // the cave's ids made free in this place (nothing it brings may take the id of a room, clue, trap or anything the
  // place has already), its words changed to match, and the cave laid into the map
  function adopt(res, where) {
    const M = copy(res.map), pl = place(), cur = A.get(pl, 99) || { floors: [] }, below = where === "below", base = below ? E().draft.floors.length : 0;
    const max = {}; const see = id => { const m = /^(ST|R|C|E|S|T|P)(\d+)$/.exec(id || ""); if (m) max[m[1]] = Math.max(max[m[1]] || 0, +m[2]); };
    for (const G of E().draft.floors.concat(cur.floors || [])) { (G.R || []).forEach(r => see(r[0])); (G.M || []).forEach(m => see(m[0])); (G.ST || []).forEach(s => see(s[0])); }
    for (const k of ["rooms", "clues", "enc", "secrets", "traps", "riddles"]) Object.keys(cur[k] || {}).forEach(see); Object.keys(dv().recs).forEach(see);
    const ren = {}; const take = id => { const m = /^(ST|R|C|E|S|T|P)(\d+)$/.exec(id || ""); if (!m || ren[id]) return; max[m[1]] = (max[m[1]] || 0) + 1; ren[id] = m[1] + max[m[1]]; };
    for (const G of M.floors) { G.R.forEach(r => take(r[0])); (G.M || []).forEach(m => take(m[0])); (G.ST || []).forEach(s => take(s[0])); }
    for (const k of ["rooms", "clues", "enc", "secrets", "traps", "riddles"]) Object.keys(M[k] || {}).forEach(take);
    const rt = s => typeof s === "string" ? s.replace(/\b(ST|R|C|E|S|T|P)(\d+)\b/g, (w) => ren[w] || w).replace(/(door:[hv]:\d+:\d+)@(\d+)/g, (w, d, li) => d + "@" + (+li + base)) : s;
    const deep = o => Array.isArray(o) ? o.map(deep) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deep(v)])) : rt(o);
    const rekey = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [ren[k] || k, deep(v)]));
    for (const G of M.floors) { G.R.forEach(r => { r[0] = ren[r[0]] || r[0]; }); (G.M || []).forEach(m => { m[0] = ren[m[0]] || m[0]; }); (G.ST || []).forEach(s => { s[0] = ren[s[0]] || s[0]; }); if (G.note) G.note = rt(G.note); }
    const rooms = rekey(M.rooms), more = { enc: rekey(M.enc), secrets: rekey(M.secrets) }, traps = rekey(M.traps), riddles = rekey(M.riddles), clues = rekey(M.clues);
    const cave = Object.assign({}, M.cave, { roles: rekey(M.cave.roles) });
    ed.change(() => {
      const d = E().draft;
      if (below) { d.floors = d.floors.concat(M.floors); if (d.order) d.order = d.order.concat(M.floors.map((_, i) => base + i)); d.more = Object.assign({}, d.more || {}); d.more.enc = Object.assign({}, d.more.enc || {}, more.enc); d.more.secrets = Object.assign({}, d.more.secrets || {}, more.secrets); d.more.cave = cave; d.more.ov = [d.more.ov, rt(M.ov)].filter(Boolean).join(" "); }
      else {
        // what the old map had that was generated and never touched by hand (its traps, riddles, dangers, secret doors and
        // carved clues) goes with it; what the game master wrote stays
        const old = A.get(place(), 99) || {}, goneMore = { enc: {}, secrets: {} };
        for (const G of d.floors) for (const m of G.M || []) {
          const k = m[0];
          if (/^[TP]\d/.test(k)) { const r = recOf(k); if (r && r.gen && !r.edited) d.dv.gone = (d.dv.gone || []).concat([k]); }
          else if (/^E\d/.test(k) && (old.enc || {})[k] && old.enc[k].gen) goneMore.enc[k] = null;
          else if (/^S\d/.test(k) && (old.secrets || {})[k] && old.secrets[k].gen) goneMore.secrets[k] = null;
          else if (/^C\d/.test(k) && (old.clues || {})[k] && old.clues[k].gen && !old.clues[k].edited) d.cvGone = (d.cvGone || []).concat([k]);
        }
        d.floors = M.floors; d.order = null; E().fi = 0;
        d.more = Object.assign({}, d.more || {}, { enc: Object.assign(goneMore.enc, more.enc), secrets: Object.assign(goneMore.secrets, more.secrets), cave, ov: rt(M.ov), run: rt(M.run), ext: rt(M.ext) });
      }
      d.rooms = Object.assign({}, below ? d.rooms : {}, rooms);
      d.dv = d.dv || { recs: {}, gone: [] }; Object.assign(d.dv.recs, traps, riddles);
      d.cvClues = Object.assign({}, d.cvClues || {}, clues);
      E().sel = null;
    });
    if (below) E().fi = base;
    ed.paint();
    ed.tip(`The cave is in the map: ${res.report.chambers} chambers and ${res.report.passages} passages${res.report.levels > 1 ? " on " + res.report.levels + " levels" : ""}. Save keeps it; Undo takes it back.${below ? " Join it to the floor above with the Stairs tool." : ""}`);
  }

  /* ---- the brushes */
  const brushCells = (p, n) => { const out = [], r = (n - 1) / 2, cx = Math.floor(p.x), cy = Math.floor(p.y); for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) { if (n > 1 && Math.hypot(dx, dy) > r + .5) continue; out.push([cx + dx, cy + dy]); } return out; };
  function stroke(p) {
    const st = cvs().stroke; if (!st) return;
    // the brush runs the whole way from where it was to where it is, however fast the hand moves
    const from = st.last || p, steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / .5)), pts = []; st.last = p;
    for (let k = 1; k <= steps; k++) pts.push({ x: from.x + (p.x - from.x) * k / steps, y: from.y + (p.y - from.y) * k / steps });
    for (const q of pts) for (const [x, y] of brushCells(q, cvs().brush || 2)) { if (x < 0 || y < 0 || x >= F().w || y >= F().h) continue; const k = x + "," + y; if (st.cells.has(k)) continue; st.cells.set(k, [x, y]); st.add.push([x, y]); }
    const svg = $("#meCanvas svg.me-svg"); if (!svg) return;
    let g = svg.querySelector(".cv-brush"); if (!g) { g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "cv-brush" + (st.erase ? " erase" : "")); svg.appendChild(g); }
    for (const [x, y] of st.add.splice(0)) { const r = document.createElementNS("http://www.w3.org/2000/svg", "rect"); r.setAttribute("x", x * C); r.setAttribute("y", y * C); r.setAttribute("width", C); r.setAttribute("height", C); g.appendChild(r); }
  }
  function commitStroke() {
    const st = cvs().stroke; cvs().stroke = null; if (!st || !st.cells.size) { ed.paintCanvas(); return; }
    const cells = [...st.cells.values()], tool = E().tool;
    ed.change(() => {
      const G = F(); let nF;
      if (tool === "terrain") nF = cvs().tmode === "height" ? CV.paint(G, cells, null, { el: +cvs().tel || 0 }) : CV.paint(G, cells, null, { kind: cvs().tkind || "water" });
      else if (st.erase) nF = CV.paint(G, cells, null, { rock: true });
      else {
        let rid = cvs().into || "", name = "";
        if (!rid) { rid = st.from || ""; }
        if (rid === "__chamber" || rid === "__passage" || !rid) { name = rid === "__passage" ? "New passage" : "New chamber"; rid = nextR(); }
        nF = CV.paint(G, cells, rid, { name, hidden: !!cvs().hidden });
      }
      G.R = nF.R; G.cave = 1;
    });
  }

  /* ---- a chamber chosen on a cave floor: the whole of it moved, grown, shrunk, reshaped or filled in */
  const caveRoom = () => { const s = E().sel; if (!s || s.kind !== "room" || !F().cave) return null; const r = F().R[s.i]; return r ? r[0] : null; };
  function roomOps(rid) {
    const g = (E().draft.rooms || {})[rid] || ((A.get(place(), 99) || {}).rooms || {})[rid] || {}, kinds = Object.keys(A.KINDS).filter(k => !(A.kindOf(k) || {}).solid);
    return `<section class="cv-room"><h4>The whole of ${esc(rid)}</h4>
      <div class="me-row"><button type="button" data-cv="grow">Grow</button><button type="button" data-cv="shrink">Shrink</button><button type="button" data-cv="regen">New shape</button></div>
      <label class="me-f"><span>Its floor, all of it</span><select data-cv="rkind"><option value="">Choose…</option>${kinds.map(k => `<option value="${k}">${esc(k)}</option>`).join("")}</select></label>
      <label class="me-f"><span>Its height (metres)</span><input type="number" step=".5" min="-10" max="20" data-cv="rel" value="0"></label>
      <p class="me-help">Drag it with Choose and move to move all of it, with what is in it. "New shape" redraws it about the same size, keeping every way into it and everything placed in it${g.gen ? "" : ""}.</p>
      <button type="button" class="me-del" data-cv="rock">Fill it with rock</button></section>`;
  }

  /* ---- the check */
  function checkNow() {
    const M = { floors: E().draft.floors.map(G => ed.finished(G)), entry: (A.get(place(), 99) || {}).entry, cave: (E().draft.more || {}).cave };
    cvs().check = CV.check(M);
    const book = Object.assign({}, (A.get(place(), 99) || {}).traps || {}, (A.get(place(), 99) || {}).riddles || {}, dv().recs);
    cvs().devCheck = D.validateMap(Object.assign({}, A.get(place(), 99) || {}, M, { traps: Object.fromEntries(Object.entries(book).filter(([k]) => k[0] === "T")), riddles: Object.fromEntries(Object.entries(book).filter(([k]) => k[0] === "P")), clues: Object.assign({}, (A.get(place(), 99) || {}).clues || {}, E().draft.cvClues || {}) }));
  }
  function checkHTML() {
    const c = cvs().check; if (!c) return "";
    const item = (x, cls) => `<li class="${cls}">${esc(x.text)}${x.rid ? ` <button type="button" class="t-mini" data-cvshow="${esc(x.fi)}/${esc(x.rid)}">Show</button>` : ""}</li>`;
    const dc = cvs().devCheck || [];
    return `<div class="cv-check"><p class="${c.ok ? "cv-ok" : "cv-err"}"><b>${esc(c.summary)}.</b></p>${c.errors.length || c.warnings.length ? `<ul>${c.errors.map(x => item(x, "err")).join("")}${c.warnings.map(x => item(x, "warn")).join("")}</ul><button type="button" class="prim" data-cv="mend">Mend it</button><p class="me-help">Mending joins what cannot be reached by the cheapest way: a ford, a bridge, a place to climb, a short passage dug through. What is meant (secret, swum, sealed) is left alone. Undo takes it back.</p>` : ""}
      ${c.notes.length ? `<details><summary>${c.notes.length} meant so</summary><ul>${c.notes.map(x => item(x, "note")).join("")}</ul></details>` : ""}
      ${dc.length ? `<p class="cv-err"><b>Traps and riddles:</b></p><ul>${dc.map(x => `<li class="warn">${esc(x.text)}</li>`).join("")}</ul>` : (Object.keys(dv().recs).length || c ? `<p class="cv-ok">Traps and riddles: fair, joined to what exists, no loops.</p>` : "")}</div>`;
  }

  /* ---- traps and riddles placed and edited */
  function newDev(letter, x, y, o) {
    const at0 = roomAtP(x, y); if (!at0 || A.isSolid((F().R[roomIx(F(), Math.floor(x), Math.floor(y))] || [])[6])) { ed.tip("Put it inside a chamber, a passage or a room: there is only rock there."); return; }
    const id = St.nextDevId(place(), letter, markerIds()), at = at0, s = caveSet();
    let rec;
    if (letter === "T") { const pre = o && o.preset || (s.danger === "safe" ? "nonlethal" : ["temple", "ruin"].includes(s.env) ? "temple" : ["magic", "corrupted"].includes(s.env) ? "guardian" : s.danger === "deadly" ? "deadly" : "simple"); rec = D.trap(Object.assign({ preset: pre, seed: id + Date.now() }, o || {})); rec.preset = pre; const [aw, ah] = rec.area; rec.area = [Math.max(0, Math.floor(x) - Math.floor((aw - 1) / 2)), Math.max(0, Math.floor(y) - Math.floor((ah - 1) / 2)), aw, ah]; }
    else rec = D.riddle(Object.assign({ diff: ({ safe: 2, moderate: 3, dangerous: 4, deadly: 4 })[s.danger] || 3, seed: id + Date.now(), allowNeeds: false }, o || {})) || D.riddle({ type: "verse", seed: id });
    rec.at = at;
    ed.change(() => { const G = F(); G.M = G.M || []; G.M.push([id, Math.round(x * 4) / 4, Math.round(y * 4) / 4]); dv().recs[id] = rec; });
    cvs().dsel = id; ed.paint();
  }
  const devHit = (x, y) => { for (const m of F().M || []) if (/^[TP]\d/.test(m[0]) && Math.hypot(m[1] - x, m[2] - y) < .5) return m; return null; };
  function devSide(letter) {
    const here = (F().M || []).filter(m => m[0][0] === letter), sel = cvs().dsel && cvs().dsel[0] === letter ? cvs().dsel : null, rec = sel ? recOf(sel) : null;
    let h = `<section class="cv-dev"><h4>${letter === "T" ? "Traps" : "Riddles and puzzles"} on this floor</h4>`;
    if (!rec) h += `<p class="me-help">Click the map to make ${letter === "T" ? "a trap" : "a riddle or puzzle"} there${letter === "T" ? "" : ""}; click one to choose it. Each is made to suit the cave and checked before it is given.</p>` + (letter === "T" ? `<label class="me-f"><span>The next one</span><select data-cvn="preset">${opt([["", "To suit the cave"]].concat(D.PRESETS.map(p => [p[0], p[1]])), cvs().npreset || "")}</select></label><label class="me-f"><span>Or of this kind</span><select data-cvn="cat">${opt([["", "Any kind"]].concat(D.TRAP_CATS.map(c => [c[0], c[1]])), cvs().ncat || "")}</select></label>` : `<label class="me-f"><span>The next one</span><select data-cvn="rtype">${opt([["", "To suit the cave"]].concat(D.RIDDLE_KINDS.map(k => [k[0], k[1]])), cvs().nrtype || "")}</select></label><label class="me-f"><span>How hard</span><select data-cvn="rdiff">${opt([1, 2, 3, 4, 5].map(n => [n, ["Easy", "Fair", "Hard", "Very hard", "Fiendish"][n - 1]]), cvs().nrdiff || 3)}</select></label>`);
    if (rec) h += letter === "T" ? trapEditor(sel, rec) : riddleEditor(sel, rec);
    h += here.length ? `<div class="me-cl-list">${here.map(m => `<button type="button" data-cvsel="${esc(m[0])}" aria-pressed="${m[0] === sel}">${esc(m[0])} ${esc((recOf(m[0]) || {}).t || "")}</button>`).join("")}</div>` : "";
    return h + `</section>`;
  }
  const fld = (k, label, v, area) => area ? `<label class="me-f"><span>${esc(label)}</span><textarea data-cve="${k}" rows="${area}" maxlength="4000">${esc(v || "")}</textarea></label>` : `<label class="me-f"><span>${esc(label)}</span><input data-cve="${k}" value="${esc(v || "")}" maxlength="300"></label>`;
  function linksEditor(id, rec) {
    const ids = markerIds().filter(x => x !== id && /^[TPES]\d/.test(x)), name = x => `${x} ${(recOf(x) || ((A.get(place(), 99) || {}).enc || {})[x] || ((E().draft.more || {}).enc || {})[x] || ((E().draft.more || {}).secrets || {})[x] || ((A.get(place(), 99) || {}).secrets || {})[x] || {}).t || ""}`.trim();
    return `<div class="cv-links"><h5>Joined to</h5>${(rec.links || []).length ? `<ul>${rec.links.map((l, i) => `<li>${esc((D.LINK_ON.find(x => x[0] === (l.on || "trigger")) || [0, l.on])[1])}, it ${esc((D.LINK_DO.find(x => x[0] === l.do) || [0, l.do])[1])} ${esc(/^door:/.test(l.to) ? "the door it guards" : name(l.to))} <button type="button" class="t-mini" data-cvunlink="${i}">×</button></li>`).join("")}</ul>` : `<p class="me-help">Nothing yet.</p>`}
      <div class="cv-addlink"><select data-cvl="on">${opt(D.LINK_ON.filter(x => id[0] === "T" ? ["trigger", "disarm"].includes(x[0]) : ["solve", "fail"].includes(x[0])), id[0] === "T" ? "trigger" : "fail")}</select><select data-cvl="do">${opt(D.LINK_DO, "activate")}</select><select data-cvl="to"><option value="">what…</option>${opt(ids.map(x => [x, name(x)]), "")}</select><button type="button" class="t-mini" data-cv="link">Join</button></div></div>`;
  }
  const regenBtn = (id, rec, what) => `<button type="button" data-cv="redev"${rec.edited ? ` data-sure="0"` : ""}>${rec.edited ? `Make another ${what} (your changes go)` : `Make another ${what}`}</button>`;
  function trapEditor(id, rec) {
    const v = D.validateTrap(rec);
    return `<div class="cv-ed" data-cvid="${esc(id)}"><p class="cv-kind">${esc(id)} · ${esc((D.TRAP_CATS.find(c => c[0] === rec.cat) || [0, rec.cat])[1])} · ${esc(rec.mech || "")} · severity ${rec.sev}/5</p>
      ${fld("t", "Name", rec.t)}<label class="me-f"><span>The players see it</span><select data-cve="vis">${opt([["hidden", "Hidden"], ["partial", "Partly: there are signs"], ["obvious", "Plainly"]], rec.vis)}</select></label>
      ${fld("trig", "What sets it off", rec.trig, 2)}${fld("d", "How it works", rec.d, 2)}${fld("eff", "What happens", rec.eff, 3)}${fld("signs", "Warning signs (one to a line)", (rec.signs || []).join("\n"), 3)}
      ${fld("detectroll", "Finding it: the roll", (rec.detect || {}).roll)}${fld("bypass", "Ways past (one to a line)", (rec.bypass || []).map(b => b.how + (b.roll ? " (" + b.roll + ")" : "")).join("\n"), 3)}
      ${fld("reset", "Does it reset", rec.reset)}${fld("alert", "Who hears it", rec.alert)}${fld("pd", "What the players see when it is found or goes off", rec.pd, 2)}${fld("kp", "Only you know", rec.kp, 2)}
      <div class="me-nums"><label class="me-num"><span>Reaches, wide</span><input type="number" min="1" max="12" data-cve="aw" value="${(rec.area || [0, 0, 1, 1])[2]}"></label><label class="me-num"><span>Reaches, deep</span><input type="number" min="1" max="12" data-cve="ah" value="${(rec.area || [0, 0, 1, 1])[3]}"></label></div>
      ${linksEditor(id, rec)}${v.length ? `<ul class="cv-warn">${v.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="me-row">${regenBtn(id, rec, "trap")}<button type="button" data-cv="dupdev">Duplicate</button><button type="button" class="me-del" data-cv="deldev">Take it away</button></div></div>`;
  }
  function riddleEditor(id, rec) {
    const v = D.validateRiddle(rec);
    return `<div class="cv-ed" data-cvid="${esc(id)}"><p class="cv-kind">${esc(id)} · ${esc((D.RIDDLE_KINDS.find(k => k[0] === rec.type) || [0, rec.type])[1])} · difficulty ${rec.diff}/5</p>
      ${fld("t", "Name", rec.t)}${fld("pd", "What the players see (never the answer)", rec.pd, 6)}${fld("sol", "The answer (only you)", rec.sol)}${fld("ans", "Also accepted (commas between)", (rec.ans || []).join(", "))}
      ${fld("hints", "Hints, in the order given (one to a line)", (rec.hints || []).join("\n"), 3)}${fld("why", "Why it works", rec.why, 2)}${fld("ok", "When solved", rec.ok, 2)}${fld("fail", "When failed", rec.fail, 2)}${fld("time", "Time allowed (if any)", rec.time)}
      <label class="me-f"><span>How hard</span><select data-cve="diff">${opt([1, 2, 3, 4, 5].map(n => [n, ["Easy", "Fair", "Hard", "Very hard", "Fiendish"][n - 1]]), rec.diff)}</select></label>
      ${rec.layout ? `<pre class="lm-pre">${esc(rec.layout)}</pre>` : ""}<p class="me-help">${esc((rec.check || {}).notes || "")}</p>
      ${linksEditor(id, rec)}${v.length ? `<ul class="cv-warn">${v.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="me-row"><button type="button" data-cv="reword">New words, same answer</button>${regenBtn(id, rec, "riddle")}<button type="button" data-cv="dupdev">Duplicate</button><button type="button" class="me-del" data-cv="deldev">Take it away</button></div></div>`;
  }
  function editRec(id, k, val) {
    const r = copy(recOf(id) || {});
    if (k === "signs") r.signs = lines(val); else if (k === "hints") r.hints = lines(val); else if (k === "ans") r.ans = val.split(",").map(x => x.trim()).filter(Boolean);
    else if (k === "bypass") r.bypass = lines(val).map(l => { const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(l); return m ? { how: m[1], roll: m[2] } : { how: l, roll: "" }; });
    else if (k === "detectroll") r.detect = Object.assign({}, r.detect || {}, { roll: val });
    else if (k === "aw" || k === "ah") { const a = (r.area || [0, 0, 1, 1]).slice(); a[k === "aw" ? 2 : 3] = Math.max(1, Math.min(12, +val || 1)); r.area = a; }
    else if (k === "diff") r.diff = +val; else r[k] = val;
    r.edited = 1;
    ed.change(() => { dv().recs[id] = r; });
  }

  /* ---- the plug */
  A.mapEditor.plug({
    tools: [["carve", "Carve the cave", "Drag to cut floor out of the rock. Hold Alt, or drag with the right button, to fill it back with rock."], ["terrain", "Water, lava and ground", "Drag over the floor to change what it is (water, lava, ice, a chasm, a bridge, moss…) or how high it stands."], ["traps", "Traps", "Click the map to make a trap there; click a trap's marker to choose it."], ["riddles", "Riddles", "Click the map to make a riddle or puzzle there; click its marker to choose it."]],
    icons: { carve: `<path d="M4 20l7-7M14 4c3 0 6 3 6 6l-4-1-3 3-4-4 3-3z"/>`, terrain: `<path d="M3 15c3-3 5 3 9 0s6 3 9 0M3 20c3-3 5 3 9 0s6 3 9 0M7 10l3-5 3 5"/>`, traps: `<path d="M12 3l9 16H3z"/><path d="M12 9v5M12 17v.5"/>`, riddles: `<path d="M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 2v.7M12 18v.5"/><circle cx="12" cy="12" r="9"/>`, cave: `<path d="M3 20c0-8 4-14 9-14s9 6 9 14"/><path d="M9 20c0-3 1.4-5 3-5s3 2 3 5"/>` },
    topHTML: api => `<button type="button" class="me-cave" data-cv="gen" title="Generate a cave: chambers, passages, water, heights, secrets, riddles and traps">${api.icon ? api.icon("cave") : ""}<span>Generate a cave</span></button>`,
    open(a) {
      ed = a; E().cv = { brush: 2, into: "", tkind: "water", tmode: "kind", tel: 2, stroke: null, check: null, dsel: null, last: E().cv && E().cv.last };
      E().draft.dv = { recs: {}, gone: [] }; E().draft.cvClues = {};
      const cv = $("#meCanvas"); if (cv && !cv.__cvctx) { cv.__cvctx = 1; cv.addEventListener("contextmenu", e => { if (["carve", "terrain"].includes(E().tool)) e.preventDefault(); }); }
    },
    // what is being made here, drawn as it will be: its traps and riddles, its clues
    draftMap(M) {
      const d = E().draft;
      if (d.dv && Object.keys(d.dv.recs).length) { M.traps = Object.assign({}, M.traps || {}); M.riddles = Object.assign({}, M.riddles || {}); for (const [k, r] of Object.entries(d.dv.recs)) (k[0] === "T" ? M.traps : M.riddles)[k] = r; }
      if (d.cvClues && Object.keys(d.cvClues).length) M.clues = Object.assign({}, M.clues || {}, d.cvClues);
      if (d.more) { if (d.more.enc) M.enc = Object.assign({}, M.enc || {}, d.more.enc); if (d.more.secrets) M.secrets = Object.assign({}, M.secrets || {}, d.more.secrets); }
    },
    side() {
      let h = "";
      const tool = E().tool, cave = !!F().cave;
      if (tool === "carve") h += `<section class="cv-tool"><h4>Carve the cave</h4><label class="me-f"><span>Brush</span><select data-cvb="brush">${opt([[1, "One square"], [2, "Two squares"], [3, "Three squares"], [4, "Four squares"]], cvs().brush)}</select></label>
        <label class="me-f"><span>Floor of</span><select data-cvb="into"><option value=""${!cvs().into ? " selected" : ""}>The room where I start (or a new chamber)</option><option value="__chamber"${cvs().into === "__chamber" ? " selected" : ""}>A new chamber</option><option value="__passage"${cvs().into === "__passage" ? " selected" : ""}>A new passage</option>${[...new Set(F().R.map(r => r[0]))].filter(x => /^R\d/.test(x)).map(x => `<option value="${esc(x)}"${cvs().into === x ? " selected" : ""}>${esc(x)} ${esc((F().R.find(r => r[0] === x && r[5]) || [])[5] || "")}</option>`).join("")}</select></label>
        <label class="me-ck"><input type="checkbox" data-cvb="hidden"${cvs().hidden ? " checked" : ""}> Hidden from the players (a secret place)</label>
        <p class="me-help">Drag to cut floor out of the rock; Alt-drag or right-drag fills it back. ${cave ? "" : "Carving turns this floor into a cave: rock all round, drawn as stone."}</p></section>`;
      if (tool === "terrain") { const K = [["cave", "Cave floor"], ["gravel", "Scree"], ["moss", "Moss"], ["fungus", "Fungus"], ["crystal", "Crystal"], ["ice", "Ice"], ["blight", "Blight"], ["sand", "Sand"], ["earth", "Earth"], ["basalt", "Black rock"], ["shallows", "Shallow water (wade)"], ["water", "Deep water (swim)"], ["lava", "Lava"], ["chasm", "A chasm"], ["bridge", "A bridge"], ["flag", "Flagstones"]];
        h += `<section class="cv-tool"><h4>Water, lava and ground</h4><div class="me-kinds">${K.map(([k, l]) => `<button type="button" data-cvt="${k}" aria-pressed="${cvs().tmode === "kind" && cvs().tkind === k}">${esc(l)}</button>`).join("")}</div>
        <label class="me-f"><span>Brush</span><select data-cvb="brush">${opt([[1, "One square"], [2, "Two squares"], [3, "Three squares"], [4, "Four squares"]], cvs().brush)}</select></label>
        <label class="me-ck"><input type="radio" name="cvtm" data-cvb="tmode" value="height"${cvs().tmode === "height" ? " checked" : ""}> Paint a height instead:</label> <input type="number" step=".5" min="-10" max="20" data-cvb="tel" value="${cvs().tel}" aria-label="Height in metres"> metres
        <p class="me-help">More than about a body's height between two squares is a cliff: it needs a place to climb, or the Mend in the check makes one.</p></section>`; }
      if (tool === "traps") h += devSide("T");
      if (tool === "riddles") h += devSide("P");
      const rid = caveRoom(); if (rid && tool === "select") h += roomOps(rid);
      if (cave || tool === "carve" || tool === "terrain" || cvs().check) h += `<section class="cv-chk"><h4>The way through</h4><button type="button" data-cv="check">Check the way through</button>${checkHTML()}</section>`;
      return h;
    },
    overlay() {
      let s = "";
      const rid = caveRoom(); if (rid) for (const r of F().R) if (r[0] === rid) s += `<rect class="cv-roomsel" x="${r[1] * C}" y="${r[2] * C}" width="${r[3] * C}" height="${r[4] * C}"/>`;
      if (cvs() && cvs().hl) for (const r of F().R) if (r[0] === cvs().hl) s += `<rect class="cv-hl" x="${r[1] * C}" y="${r[2] * C}" width="${r[3] * C}" height="${r[4] * C}"/>`;
      const d = cvs() && cvs().dsel, m = d && (F().M || []).find(x => x[0] === d); if (m) s += `<circle class="me-sel" cx="${m[1] * C}" cy="${m[2] * C}" r="14"/>`;
      const md = cvs() && cvs().mdrag; if (md && md.dx != null) for (const r of F().R) if (r[0] === md.rid) s += `<rect class="me-ghost-r" x="${(r[1] + md.dx) * C}" y="${(r[2] + md.dy) * C}" width="${r[3] * C}" height="${r[4] * C}"/>`;
      return s;
    },
    down(e, p) {
      const tool = E().tool;
      if (tool === "carve" || tool === "terrain") {
        if (e.button === 1) return false;
        const i = roomIx(F(), Math.floor(p.x), Math.floor(p.y));
        cvs().stroke = { cells: new Map(), add: [], erase: tool === "carve" && (e.altKey || e.button === 2), from: i >= 0 ? F().R[i][0] : "" };
        if (tool === "carve" && !cvs().stroke.from) { const near = brushCells(p, 5).map(([x, y]) => roomIx(F(), x, y)).find(k => k >= 0); if (near != null && near >= 0 && !cvs().into) cvs().stroke.from = F().R[near][0]; }
        E().drag = { kind: "cvstroke" }; stroke(p); return true;
      }
      if (tool === "traps" || tool === "riddles") {
        if (e.button && e.button !== 0) return false;
        const m = devHit(p.x, p.y);
        if (m) { cvs().dsel = m[0]; cvs().ddrag = { id: m[0], x0: p.x, y0: p.y, mx: m[1], my: m[2] }; E().drag = { kind: "cvdev" }; ed.paintCanvas(); ed.paintSide(); return true; }
        const letter = tool === "traps" ? "T" : "P";
        const o = letter === "T" ? Object.assign({}, cvs().npreset ? { preset: cvs().npreset } : {}, cvs().ncat ? { cat: cvs().ncat } : {}) : Object.assign({}, cvs().nrtype ? { type: cvs().nrtype } : {}, { diff: +cvs().nrdiff || undefined });
        newDev(letter, p.x, p.y, o); return true;
      }
      // a chamber of a cave moved whole with the select tool (markers, stairs and doors keep their own handling)
      if (tool === "select" && F().cave && (!e.button || e.button === 0)) {
        const near = (F().M || []).some(m => Math.hypot(m[1] - p.x, m[2] - p.y) < .5) || (F().ST || []).some(s => p.x >= s[1] && p.x < s[1] + s[3] && p.y >= s[2] && p.y < s[2] + s[4]);
        const fx = p.x - Math.floor(p.x), fy = p.y - Math.floor(p.y), onEdge = Math.min(fx, 1 - fx, fy, 1 - fy) < .2;
        if (near || onEdge) return false;
        const i = roomIx(F(), Math.floor(p.x), Math.floor(p.y)); if (i < 0) return false;
        E().sel = { kind: "room", i }; cvs().mdrag = { rid: F().R[i][0], x0: p.x, y0: p.y }; E().drag = { kind: "cvroom" };
        ed.paintCanvas(); ed.paintSide(); return true;
      }
      return false;
    },
    move(e, p) {
      if (cvs() && cvs().stroke) { stroke(p); return true; }
      const dd = cvs() && cvs().ddrag; if (dd) { const g = $(`#meCanvas .lm-mk[data-ref="${CSS.escape(dd.id)}"]`); if (g) g.setAttribute("transform", `translate(${(p.x - dd.x0) * C} ${(p.y - dd.y0) * C})`); dd.moved = Math.abs(p.x - dd.x0) + Math.abs(p.y - dd.y0) > .1; dd.x = p.x; dd.y = p.y; return true; }
      const md = cvs() && cvs().mdrag; if (md) { const dx = Math.round(p.x - md.x0), dy = Math.round(p.y - md.y0); if (dx !== md.dx || dy !== md.dy) { md.dx = dx; md.dy = dy; ed.paintCanvas(); } return true; }
      return false;
    },
    up() {
      if (cvs() && cvs().stroke) { E().drag = null; commitStroke(); return true; }
      const dd = cvs() && cvs().ddrag; if (dd) { cvs().ddrag = null; E().drag = null; if (dd.moved) ed.change(() => { const m = (F().M || []).find(x => x[0] === dd.id); if (!m) return; m[1] = Math.round((dd.mx + dd.x - dd.x0) * 4) / 4; m[2] = Math.round((dd.my + dd.y - dd.y0) * 4) / 4; const r = recOf(dd.id); if (r) { const r2 = copy(r), at = roomAtP(m[1], m[2]); if (at) r2.at = at; if (r2.area) { r2.area[0] = Math.max(0, Math.floor(m[1]) - Math.floor((r2.area[2] - 1) / 2)); r2.area[1] = Math.max(0, Math.floor(m[2]) - Math.floor((r2.area[3] - 1) / 2)); } dv().recs[dd.id] = r2; } }); else ed.paint(); return true; }
      const md = cvs() && cvs().mdrag; if (md) { cvs().mdrag = null; E().drag = null; if (md.dx || md.dy) ed.change(() => { const G = F(), nF = CV.moveRoom(G, md.rid, md.dx, md.dy); Object.assign(G, { R: nF.R, M: nF.M, ST: nF.ST, P: nF.P, I: nF.I }); E().sel = { kind: "room", i: G.R.findIndex(r => r[0] === md.rid) }; }); else ed.paint(); return true; }
      return false;
    },
    click(e) {
      const t = e.target;
      const sel = t.closest("[data-cvsel]"); if (sel) { cvs().dsel = sel.dataset.cvsel; ed.paintCanvas(); ed.paintSide(); return true; }
      const tk = t.closest("[data-cvt]"); if (tk) { cvs().tkind = tk.dataset.cvt; cvs().tmode = "kind"; ed.paintSide(); return true; }
      const sh = t.closest("[data-cvshow]"); if (sh) { const [fi, rid] = sh.dataset.cvshow.split("/"); E().fi = +fi; cvs().hl = rid; ed.paint(); return true; }
      const un = t.closest("[data-cvunlink]"); if (un) { const id = cvs().dsel, r = copy(recOf(id)); r.links.splice(+un.dataset.cvunlink, 1); r.edited = 1; ed.change(() => { dv().recs[id] = r; }); return true; }
      const b = t.closest("[data-cv]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return false;
      const k = b.dataset.cv, rid = caveRoom(), id = cvs().dsel;
      switch (k) {
        case "gen": genDialog(); return true;
        case "grow": case "shrink": if (rid) ed.change(() => { const G = F(); G.R = CV.growRoom(G, rid, k === "grow" ? 1 : -1).R; E().sel = { kind: "room", i: G.R.findIndex(r => r[0] === rid) }; }); return true;
        case "regen": if (rid) { const s = caveSet(), props = { volcanic: ["rocks", "rock", "cave-boulders"], ice: ["ice-spikes", "rocks"], crystal: ["crystals", "crystals-amethyst"], sandstone: ["rocks", "pebbles"], ancient: ["standing-stone", "rocks"] }[s.geology]; let ok = false; ed.change(() => { const G = F(), r = CV.regenRoom(G, rid, Date.now(), props ? { props } : {}); ok = r.ok; if (r.ok) { G.R = r.F.R; G.P = r.F.P; E().sel = { kind: "room", i: G.R.findIndex(x => x[0] === rid) }; } }); ed.tip(ok ? `${rid} has a new shape. Its ways in, its stairs, its markers and your own furnishings are where they were; Undo brings the old shape back.` : "That room could not be redrawn."); } return true;
        case "rock": if (rid) { if (b.dataset.sure) { ed.change(() => { const G = F(), cells = []; for (const r of G.R) if (r[0] === rid) for (let y = r[2]; y < r[2] + r[4]; y++) for (let x = r[1]; x < r[1] + r[3]; x++) cells.push([x, y]); G.R = CV.paint(G, cells, null, { rock: true }).R; E().sel = null; }); } else { b.dataset.sure = 1; b.textContent = "Really fill it with rock?"; } } return true;
        case "check": cvs().hl = null; checkNow(); ed.paint(); return true;
        case "mend": { let n = 0; ed.change(() => { const M = { floors: E().draft.floors.map(G => Object.assign({}, G)), entry: (A.get(place(), 99) || {}).entry }, fx = CV.repair(M, { seed: Date.now() }); n = fx.changed.length; fx.floors.forEach((G, i) => { if (fx.changed.includes(i)) Object.assign(E().draft.floors[i], { R: G.R, D: G.D }); }); }); cvs().hl = null; checkNow(); ed.paint(); ed.tip(n ? `Mended on ${n} floor${n > 1 ? "s" : ""}. Look at what changed; Undo takes it back.` : "Nothing could be mended by itself: look at what the check says."); return true; }
        case "link": { const box = b.closest(".cv-addlink"), on = box.querySelector('[data-cvl="on"]').value, dov = box.querySelector('[data-cvl="do"]').value, to = box.querySelector('[data-cvl="to"]').value; if (!to || !id) return true; const book = Object.assign({}, bookOf(place()), dv().recs), l = { on, do: dov, to }; if (D.wouldLoop(book, id, l)) { ed.tip(`That would make a loop: ${to} already sets off ${id}, by way of the chain. Nothing was joined.`); return true; } const r = copy(recOf(id)); r.links = (r.links || []).concat([l]); r.edited = 1; ed.change(() => { dv().recs[id] = r; }); return true; }
        case "reword": if (id) { const r = recOf(id); ed.change(() => { dv().recs[id] = Object.assign(D.reword(r, Date.now()), { edited: r.edited }); }); } return true;
        case "redev": if (id) { const r = recOf(id); if (r.edited && b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Really? Your changes to it will go"; return true; } const m = (F().M || []).find(x => x[0] === id); let nr; if (id[0] === "T") { nr = D.trap({ preset: r.preset || cvs().npreset || undefined, cat: cvs().ncat || undefined, seed: id + Date.now() }); const [aw, ah] = nr.area; nr.area = [Math.max(0, Math.floor(m[1]) - Math.floor((aw - 1) / 2)), Math.max(0, Math.floor(m[2]) - Math.floor((ah - 1) / 2)), aw, ah]; nr.preset = r.preset; } else nr = D.riddle({ type: cvs().nrtype || undefined, diff: r.diff, seed: id + Date.now(), allowNeeds: false }); if (!nr) return true; nr.at = r.at; nr.links = r.links || []; ed.change(() => { dv().recs[id] = nr; }); } return true;
        case "dupdev": if (id) { const m = (F().M || []).find(x => x[0] === id), nid = St.nextDevId(place(), id[0], markerIds()); ed.change(() => { F().M.push([nid, m[1] + .5, m[2] + .5]); dv().recs[nid] = Object.assign(copy(recOf(id)), { t: (recOf(id).t || id) + " (copy)", links: [] }); }); cvs().dsel = nid; ed.paint(); } return true;
        case "deldev": if (id) { ed.change(() => { E().draft.floors.forEach(G => { G.M = (G.M || []).filter(m => m[0] !== id); }); delete dv().recs[id]; dv().gone = (dv().gone || []).concat([id]); }); cvs().dsel = null; ed.paint(); } return true;
      }
      return false;
    },
    change(e) {
      const t = e.target;
      if (t.dataset.cvb) { const k = t.dataset.cvb; cvs()[k] = t.type === "checkbox" ? t.checked : t.type === "radio" ? t.value : t.value; if (k === "brush") cvs().brush = +t.value; if (k === "tel") { cvs().tel = +t.value; cvs().tmode = "height"; } ed.paintSide(); return true; }
      if (t.dataset.cvn) { const k = t.dataset.cvn; cvs()["n" + k.replace(/^n/, "")] = t.value; if (k === "preset") cvs().npreset = t.value; if (k === "cat") cvs().ncat = t.value; if (k === "rtype") cvs().nrtype = t.value; if (k === "rdiff") cvs().nrdiff = +t.value; return true; }
      if (t.dataset.cve && cvs().dsel) { editRec(cvs().dsel, t.dataset.cve, t.value); return true; }
      if (t.dataset.cv === "rkind" && t.value) { const rid = caveRoom(); if (rid) ed.change(() => { const G = F(), cells = []; for (const r of G.R) if (r[0] === rid) for (let y = r[2]; y < r[2] + r[4]; y++) for (let x = r[1]; x < r[1] + r[3]; x++) cells.push([x, y]); G.R = CV.paint(G, cells, null, { kind: t.value }).R; }); return true; }
      if (t.dataset.cv === "rel") { const rid = caveRoom(); if (rid) ed.change(() => { const G = F(), cells = []; for (const r of G.R) if (r[0] === rid) for (let y = r[2]; y < r[2] + r[4]; y++) for (let x = r[1]; x < r[1] + r[3]; x++) cells.push([x, y]); G.R = CV.paint(G, cells, null, { el: +t.value || 0 }).R; }); return true; }
      return false;
    },
    key(e) {
      const tool = E().tool;
      if ((tool === "traps" || tool === "riddles") && cvs().dsel && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); const b = document.querySelector('#meSide [data-cv="deldev"]'); if (b) b.click(); return true; }
      return false;
    },
    cancel() { if (cvs() && (cvs().stroke || cvs().mdrag)) { cvs().stroke = null; cvs().mdrag = null; E().drag = null; ed.paintCanvas(); return true; } if (cvs() && cvs().dsel && ["traps", "riddles"].includes(E().tool)) { cvs().dsel = null; ed.paint(); return true; } return false; },
    // kept when the map is: each trap and riddle, and the clues a generated cave carved, as the story's own
    save() {
      const pl = place(), d = E().draft; if (!St || !St.ready || !St.ready()) return;
      try {
        for (const [id, rec] of Object.entries((d.dv || {}).recs || {})) St.putDev(id[0] === "T" ? "trapbook" : "riddlebook", pl, id, rec, { note: rec.gen && !rec.edited ? "made with the cave" : "placed on the map" });
        for (const id of (d.dv || {}).gone || []) if (!(d.dv.recs || {})[id]) St.putDev(id[0] === "T" ? "trapbook" : "riddlebook", pl, id, null, { note: "taken off the map" });
        for (const [id, rec] of Object.entries(d.cvClues || {})) St.putClue(pl, id, rec, { note: "carved with the cave" });
        for (const id of d.cvGone || []) if (!(d.cvClues || {})[id]) St.putClue(pl, id, null, { note: "gone with the cave it was carved in" });
      } catch (x) { console.warn(x); }
      d.dv = { recs: {}, gone: [] }; d.cvClues = {}; d.cvGone = [];
    }
  });
})(ATLAS);
