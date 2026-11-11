/* ================================================================
   CAMPAIGN ATLAS: PLOT POINTS, MYSTERIES AND QUESTS, BY HAND
   The story's own structure written by the game master (the user's request of 11 Nov 2026 for handmade campaigns):
     a plot point: what sets it off (by hand, a clue found, another plot point, an event of the world's time), what
       happens, what follows, its branches (if the players do this, that plot point comes next), whether it is
       optional, in an order or in none ("Do not force every campaign into a fixed sequence of quests");
     a mystery: its question, the truth (the Keeper's only), the suspects, its clues, each essential, optional or
       misleading, the possible conclusions; and what Atlas sees and says, never changes: an essential clue nobody can
       reach, fewer than three ways to the answer;
     a quest: its objective, who gives it, the reward, where it stands.
   Each is a story element of the investigation (atlas-story.js, kinds "plot", "mystery", "quest"), so it is joined to
   people, places and clues by the investigation's own connections, kept and undone with its history, written into the
   campaign's files in the Atlas app (edits/story.js), and read by the copilot and the consistency check. A tab of At
   the table, "Plot and story"; its parts are switched by "Plot points and story arcs" and the investigation's
   Mysteries (atlas-modules.js). Nothing here is ever written by Claude unless the game master asks and keeps it.
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined" || !A.tableUI || !A.story) return;
  const T = A.table, St = A.story, esc = A.esc, api = A.tableUI.api;
  const mod = (k, l) => !A.modules || A.modules.on(k, l);
  // the kinds this tab writes, among the story elements
  if (!St.ITEMS.some(x => x[0] === "plot")) St.ITEMS.unshift(["plot", "A plot point"]);
  // the connections the user asked for besides the investigation's own (11 Nov 2026)
  for (const r of [["depends on", "is needed by", "it cannot happen until this has"], ["caused by", "causes", "it happened because of this"], ["related to", "is related to", "the two belong together"], ["located at", "is the place of", "it is there"]]) if (!St.RELS.some(x => x[0] === r[0])) St.RELS.push(r);
  const PSTATE = [["waiting", "Waiting"], ["ready", "Its moment has come"], ["happened", "Happened"], ["skipped", "Did not happen"]];
  const QSTATE = [["offered", "Not yet taken up"], ["accepted", "Taken up"], ["done", "Done"], ["failed", "Failed"]];
  const ROLES = [["", "Not part of it"], ["essential", "Essential"], ["optional", "Optional"], ["misleading", "Misleading: a false lead"]];
  const TRIG = [["hand", "When I say so"], ["clue", "When a clue is found"], ["plot", "When another plot point has happened"], ["event", "When an event of the world's time happens"]];
  const UI = { edit: null, err: "" };
  const items = kind => Object.entries(St.items()).map(([id, it]) => Object.assign({ id }, it)).filter(it => it.kind === kind);
  const opt = (list, v, none) => (none != null ? `<option value="">${esc(none)}</option>` : "") + list.map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("");
  const label = (list, k, d) => (list.find(x => x[0] === k) || [0, d || k])[1];
  const clueList = () => St.allClues().map(c => ["clue:" + c.pl + "/" + c.id, (c.c.t || c.id) + " (" + ((A.meta[c.pl] || {}).name || c.pl) + ")"]);
  const people = () => St.people().map(p => [p.ref, p.name]);
  const places = () => (A.order || []).filter(id => A.meta[id]).map(id => ["place:" + id, A.meta[id].name || id]);
  const events = () => (A.worldTime ? A.worldTime.events() : []).map(e => [e.id, e.title || e.id]);
  const linked = (ref, kind) => St.linksOf(ref).filter(l => l.other.startsWith(kind + ":")).map(l => l.other);
  // has a plot point's moment come: its trigger, from what the table has recorded
  function ready(it) {
    const on = it.on || {}; if (!on.k || on.k === "hand" || !on.ref) return false;
    if (on.k === "clue") { const [pl, id] = on.ref.slice(5).split("/"); return St.found(pl, id); }
    if (on.k === "plot") { const o = St.items()[on.ref]; return !!o && o.state === "happened"; }
    if (on.k === "event") { const S = api.store(), e = S && (S.get("events") || {})[on.ref]; return !!e && e.state === "done"; }
    return false;
  }
  const state = it => it.state === "happened" || it.state === "skipped" ? it.state : ready(it) ? "ready" : "waiting";
  // what Atlas sees in a mystery, and says (it never changes the story)
  function warnings(m) {
    const out = [], roles = m.roles || {}, ess = Object.entries(roles).filter(([, r]) => r === "essential").map(([k]) => k);
    if (!Object.keys(roles).length) out.push("No clues are part of it yet.");
    else if (ess.length < 3) out.push(`${ess.length} essential clue${ess.length === 1 ? "" : "s"}: the players are surer to reach the answer with three ways to it (a missed clue then does not stall the story).`);
    const leads = A.leads ? A.leads() : [], into = new Set(leads.map(l => l.to));
    for (const ref of ess) {
      const [pl, id] = ref.slice(5).split("/"), c = St.clue(pl, id); if (!c) { out.push(`An essential clue is no longer in the campaign (${ref.slice(5)}).`); continue; }
      const nm = c.t || id, pn = (A.meta[pl] || {}).name || pl;
      if (!c.at) out.push(`"${nm}" lies in no room of ${pn}: the players cannot come upon it on the map.`);
      if (!(A.meta[pl] || {}).start && !into.has(pl) && !St.linksOf("place:" + pl).some(l => l.dir === -1 && l.rel === "leads to")) out.push(`"${nm}" is in ${pn}, which nothing leads to and the story does not start at: how do the players get there?`);
    }
    const sus = m.suspects || []; if (m.truth && !sus.length) out.push("No suspects yet.");
    return out;
  }

  /* ---- the tab */
  function html() {
    const plots = items("plot").sort((a, b) => (a.order == null ? 1e9 : a.order) - (b.order == null ? 1e9 : b.order) || String(a.n).localeCompare(String(b.n)));
    const showM = mod("investigation.mysteries"), showQ = mod("plot.quests");
    const ed = UI.edit;
    const head = `<div class="ic-head"><div><h3>${T.icon("link")} Plot and story</h3><p class="t-small">The story as you write it: plot points and what sets them off, the branches the players' choices open${showM ? ", the mysteries and their clues" : ""}${showQ ? ", the quests" : ""}. Nothing is written here but by you; Atlas only says when a plot point's moment has come, and what a mystery may lack. Only you see this.</p></div></div>`;
    const plotRow = it => { const st = state(it), br = (it.branches || []).filter(b => b && (b.if || b.to)); return `<li class="pl-row pl-${st}"><div><b>${esc(it.n || "A plot point")}</b> <span class="ic-rel">${esc(label(PSTATE, st))}</span>${it.opt ? ` <span class="kn">optional</span>` : ""}${it.trig ? `<p class="kn">Sets it off: ${esc(it.trig)}</p>` : ""}${it.d ? `<p>${esc(it.d)}</p>` : ""}${br.length ? `<ul class="ic-tree">${br.map(b => `<li>If ${esc(b.if || "…")}: ${b.to && St.items()[b.to] ? esc(St.items()[b.to].n) : "…"}</li>`).join("")}</ul>` : ""}</div>
      <span class="ic-la">${it.order != null ? `<button type="button" class="t-mini" data-pl="up" data-id="${esc(it.id)}" aria-label="Earlier">↑</button><button type="button" class="t-mini" data-pl="down" data-id="${esc(it.id)}" aria-label="Later">↓</button>` : ""}${st !== "happened" ? `<button type="button" class="t-mini" data-pl="happened" data-id="${esc(it.id)}">It happened</button>` : `<button type="button" class="t-mini" data-pl="waiting" data-id="${esc(it.id)}">Not yet</button>`}<button type="button" class="t-mini" data-pl="edit" data-id="${esc(it.id)}">Change</button></span></li>`; };
    const sec = (title, list, kind, btn) => `<section class="ic-sec2"><h5>${esc(title)}</h5>${list}<div class="t-row"><button type="button" class="t-btn" data-pl="new" data-k="${kind}">${esc(btn)}</button></div></section>`;
    // the plot points' branches, drawn as the board is
    let web = "";
    if (plots.length > 1 && T.boardLayout && T.boardHTML) {
      const nodes = plots.map(p => ({ id: "s:item:" + p.id, kind: "item", title: p.n || "A plot point", sub: label(PSTATE, state(p)) })), byId = {}; nodes.forEach(n => { byId[n.id] = n; });
      const edges = []; for (const p of plots) { for (const b of p.branches || []) if (b && b.to && byId["s:item:" + b.to]) edges.push({ a: "s:item:" + p.id, b: "s:item:" + b.to, kind: "story", rel: b.if ? "if " + b.if : "then" }); if (p.on && p.on.k === "plot" && byId["s:item:" + p.on.ref]) edges.push({ a: "s:item:" + p.on.ref, b: "s:item:" + p.id, kind: "story", rel: "sets off" }); }
      const W = 860, H = Math.max(260, Math.min(560, 90 * Math.ceil(nodes.length / 3) + 120)), pos = T.boardLayout({ nodes, edges }, W, H);
      web = `<details class="ic-sec"${edges.length ? " open" : ""}><summary>The branches, drawn</summary><div class="ic-web"><div class="ic-webz" style="width:${W}px;height:${H}px">${T.boardHTML({ nodes, edges }, pos, () => true, W, H, true)}</div></div></details>`;
    }
    let body = sec("Plot points", plots.length ? `<ol class="pl-list">${plots.map(plotRow).join("")}</ol>${web}` : `<p class="kn">None yet. A plot point is a moment of the story: what sets it off, what happens, what follows. In an order, or in none.</p>`, "plot", "+ A plot point");
    if (showM) { const ms = items("mystery"); body += sec("Mysteries", ms.length ? `<ul class="ic-lks">${ms.map(m => { const roles = Object.entries(m.roles || {}), w = warnings(m); return `<li><b>${esc(m.n || "A mystery")}</b> <span class="ic-rel">${esc(m.state === "solved" ? "Solved" : "Open")}</span>${m.d ? `<p>${esc(m.d)}</p>` : ""}<p class="kn">${["essential", "optional", "misleading"].map(r => `${roles.filter(x => x[1] === r).length} ${r}`).join(" · ")} clues · ${(m.suspects || []).length} suspects</p>${w.map(x => `<p class="ic-warn">${esc(x)}</p>`).join("")}<span class="ic-la"><button type="button" class="t-mini" data-pl="edit" data-id="${esc(m.id)}">Change</button></span></li>`; }).join("")}</ul>` : `<p class="kn">None yet. A mystery holds its question, the truth, the suspects, its clues and the ways it might end.</p>`, "mystery", "+ A mystery"); }
    if (showQ) { const qs = items("quest"); body += sec("Quests and objectives", qs.length ? `<ul class="ic-lks">${qs.map(q => `<li><b>${esc(q.n || "A quest")}</b> <span class="ic-rel">${esc(label(QSTATE, q.qs || "offered"))}</span>${q.d ? `<p>${esc(q.d)}</p>` : ""}${q.giver ? `<p class="kn">Given by ${esc(St.name(q.giver))}${q.reward ? " · reward: " + esc(q.reward) : ""}</p>` : ""}<span class="ic-la"><button type="button" class="t-mini" data-pl="edit" data-id="${esc(q.id)}">Change</button></span></li>`).join("")}</ul>` : `<p class="kn">None yet.</p>`, "quest", "+ A quest"); }
    return `<div class="inv pl">${head}${UI.err ? `<p class="t-err">${esc(UI.err)}</p>` : ""}${ed ? editForm(ed) : ""}${body}</div>`;
  }
  function editForm(ed) {
    const it = ed.id ? Object.assign({}, St.items()[ed.id] || {}) : { kind: ed.kind }, k = it.kind || ed.kind, on = it.on || {};
    const ms = (n, list, sel, size) => `<select class="t-in" name="${n}" multiple size="${size || 4}">${list.map(([v, l]) => `<option value="${esc(v)}"${sel.includes(v) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    const ref = it.id ? "item:" + it.id : null, inv = ref ? linked(ref, "cast").concat(linked(ref, "npc")) : [], invP = ref ? linked(ref, "place") : [], invC = ref ? linked(ref, "clue") : [];
    const common = `<div class="ic-g2"><label>Name<input class="t-in" name="n" value="${esc(it.n || "")}" maxlength="120" required placeholder="${k === "plot" ? "The doctor disappears" : k === "mystery" ? "The Disappearance of Professor Ward" : "Find the missing ledger"}"></label>`;
    let f = "";
    if (k === "plot") {
      const plots = items("plot").filter(p => p.id !== it.id).map(p => [p.id, p.n || p.id]), br = (it.branches || []).concat([{}, {}]).slice(0, Math.max(2, (it.branches || []).length + 1));
      f = `${common}<label>In the order<select class="t-in" name="order">${opt([["", "In no order"], ["end", "Last"]].concat(it.order != null ? [["keep", "Where it is"]] : []), it.order != null ? "keep" : "")}</select></label></div>
        <label>What happens<textarea class="t-in" name="d" rows="2" maxlength="2000" placeholder="The doctor disappears before they can question him">${esc(it.d || "")}</textarea></label>
        <div class="ic-g2"><label>What sets it off, in words<input class="t-in" name="trig" value="${esc(it.trig || "")}" maxlength="400" placeholder="The players discover the hidden laboratory"></label><label>Atlas watches for it<select class="t-in" name="onk">${opt(TRIG, on.k || "hand")}</select></label></div>
        <label class="pl-on" data-for="clue"${on.k === "clue" ? "" : " hidden"}>The clue<select class="t-in" name="onclue">${opt(clueList(), on.k === "clue" ? on.ref : "", "Which clue?")}</select></label>
        <label class="pl-on" data-for="plot"${on.k === "plot" ? "" : " hidden"}>The plot point<select class="t-in" name="onplot">${opt(plots, on.k === "plot" ? on.ref : "", "Which?")}</select></label>
        <label class="pl-on" data-for="event"${on.k === "event" ? "" : " hidden"}>The event<select class="t-in" name="onevent">${opt(events(), on.k === "event" ? on.ref : "", events().length ? "Which?" : "No events planned yet")}</select></label>
        <label>What follows<textarea class="t-in" name="cons" rows="2" maxlength="2000" placeholder="They must investigate his last known location">${esc(it.cons || "")}</textarea></label>
        <fieldset class="pl-br"><legend>Branches: what the players' choices lead to</legend>${br.map((b, i) => `<div class="ic-g2"><label>If<input class="t-in" name="bif${i}" value="${esc(b.if || "")}" maxlength="200" placeholder="they go to the police"></label><label>Then<select class="t-in" name="bto${i}">${opt(plots, b.to || "", "…")}</select></label></div>`).join("")}</fieldset>
        <label class="loc-ck"><input type="checkbox" name="opt"${it.opt ? " checked" : ""}> Optional: the story goes on without it</label>`;
    } else if (k === "mystery") {
      const roles = it.roles || {}, cl = clueList();
      f = `${common}<label>Where it stands<select class="t-in" name="mstate">${opt([["open", "Open"], ["solved", "Solved"]], it.state || "open")}</select></label></div>
        <label>The question<textarea class="t-in" name="d" rows="2" maxlength="2000" placeholder="What became of Professor Ward?">${esc(it.d || "")}</textarea></label>
        <label>The truth, for you only<textarea class="t-in" name="truth" rows="3" maxlength="4000">${esc(it.truth || "")}</textarea></label>
        <label>The suspects${ms("suspects", people(), it.suspects || [])}</label>
        <fieldset class="pl-br"><legend>Its clues</legend>${cl.length ? cl.map(([v, l]) => `<label class="pl-role"><span>${esc(l)}</span><select class="t-in" name="role:${esc(v)}">${opt(ROLES, roles[v] || "")}</select></label>`).join("") : `<p class="kn">No clues in the campaign yet.</p>`}</fieldset>
        <label>How it might end: the possible conclusions, one a line<textarea class="t-in" name="concl" rows="3" maxlength="3000">${esc((it.concl || []).join("\n"))}</textarea></label>`;
    } else {
      f = `${common}<label>Where it stands<select class="t-in" name="qs">${opt(QSTATE, it.qs || "offered")}</select></label></div>
        <label>The objective<textarea class="t-in" name="d" rows="2" maxlength="2000">${esc(it.d || "")}</textarea></label>
        <div class="ic-g2"><label>Given by<select class="t-in" name="giver">${opt(people(), it.giver || "", "Nobody in particular")}</select></label><label>The reward<input class="t-in" name="reward" value="${esc(it.reward || "")}" maxlength="200"></label></div>`;
    }
    const joins = `<details class="ic-sec"${inv.length || invP.length || invC.length ? " open" : ""}><summary>Who and where it involves</summary><div class="ic-g3"><label>People${ms("ppl", people(), inv)}</label><label>Places${ms("pls", places(), invP)}</label><label>Clues${ms("cls", clueList(), invC)}</label></div><p class="t-small">Kept as the investigation's connections ("involves"), so the board, the copilot and each place's page see them.</p></details>`;
    return `<section class="t-card pl-edit"><h4>${ed.id ? "Change it" : k === "plot" ? "A plot point" : k === "mystery" ? "A mystery" : "A quest"}</h4><form data-plform="1" data-id="${esc(ed.id || "")}" data-k="${esc(k)}">${f}${joins}<label>Your notes<textarea class="t-in" name="notes" rows="2" maxlength="3000">${esc(it.notes || "")}</textarea></label>
      <div class="t-row"><button class="t-btn prim">${ed.id ? "Save" : "Make it"}</button><button type="button" class="t-mini" data-pl="cancel">Cancel</button>${ed.id ? `<button type="button" class="t-mini" data-pl="lib" data-id="${esc(ed.id)}">Keep in my library</button><button type="button" class="t-mini ic-del" data-pl="del" data-id="${esc(ed.id)}">Remove</button>` : ""}</div></form></section>`;
  }
  function save(f) {
    const id = f.dataset.id || St.uid("I"), k = f.dataset.k, v = n => (f.elements[n] ? f.elements[n].value : "").trim(), sel = n => f.elements[n] ? [...f.elements[n].selectedOptions].map(o => o.value) : [];
    const old = St.items()[id] || {}, rec = Object.assign({}, old, { kind: k, n: v("n") || "Untitled", src: old.src || "dm" });
    for (const x of ["d", "notes"]) { if (v(x)) rec[x] = v(x); else delete rec[x]; }
    if (k === "plot") {
      for (const x of ["trig", "cons"]) { if (v(x)) rec[x] = v(x); else delete rec[x]; }
      const onk = v("onk"), r = onk === "clue" ? v("onclue") : onk === "plot" ? v("onplot") : onk === "event" ? v("onevent") : ""; rec.on = onk && onk !== "hand" ? { k: onk, ref: r } : { k: "hand" };
      rec.branches = []; for (let i = 0; i < 8; i++) { if (!f.elements["bif" + i]) break; const b = { if: v("bif" + i), to: v("bto" + i) }; if (b.if || b.to) rec.branches.push(b); } if (!rec.branches.length) delete rec.branches;
      rec.opt = !!(f.elements.opt && f.elements.opt.checked); if (!rec.opt) delete rec.opt;
      const o = v("order"), ord = items("plot").map(p => p.order).filter(x => x != null); if (o === "") delete rec.order; else if (o === "end") rec.order = (ord.length ? Math.max(...ord) : 0) + 1; else if (o === "keep" && old.order == null) rec.order = (ord.length ? Math.max(...ord) : 0) + 1;
      if (!rec.state) rec.state = "waiting";
    } else if (k === "mystery") {
      if (v("truth")) rec.truth = v("truth"); else delete rec.truth;
      rec.suspects = sel("suspects"); if (!rec.suspects.length) delete rec.suspects;
      const roles = {}; for (const el of f.elements) if (el.name && el.name.startsWith("role:") && el.value) roles[el.name.slice(5)] = el.value; rec.roles = roles;
      rec.concl = v("concl").split(/\n/).map(s => s.trim()).filter(Boolean); if (!rec.concl.length) delete rec.concl;
      rec.state = v("mstate") || "open";
    } else { rec.qs = v("qs") || "offered"; for (const x of ["giver", "reward"]) { if (v(x)) rec[x] = v(x); else delete rec[x]; } }
    St.put("items", id, rec, { note: f.dataset.id ? "written" : "made" });
    // who and where it involves: the investigation's connections, the ones no longer chosen taken away
    const ref = "item:" + id, want = new Set(sel("ppl").concat(sel("pls"), sel("cls")));
    if (k === "mystery") for (const [c, r] of Object.entries(rec.roles || {})) if (r) want.add(c);
    for (const l of St.linksOf(ref)) if (l.rel === "involves" && l.dir === 1 && !want.has(l.other) && St.links()[l.id] && St.links()[l.id].src === "dm") St.put("links", l.id, null, { note: "written" });
    for (const o of want) if (!St.linked(ref, o).length) St.link(ref, o, o.startsWith("clue:") && k === "mystery" ? "involves" : "involves", {}, { note: "written" });
    UI.edit = null; UI.err = ""; api.note("Saved."); api.render();
  }
  function act(b) {
    const a = b.dataset.pl, id = b.dataset.id, it = id ? St.items()[id] : null;
    if (a === "new") { UI.edit = { kind: b.dataset.k }; api.render(); return; }
    if (a === "edit") { UI.edit = { id }; api.render(); return; }
    if (a === "cancel") { UI.edit = null; api.render(); return; }
    if (a === "del" && it) { A.tableUI.twice(b, () => { St.put("items", id, null, { note: "removed" }); UI.edit = null; api.note(`"${it.n}" removed: the investigation's history can bring it back.`); api.render(); }); return; }
    if ((a === "happened" || a === "waiting") && it) { St.put("items", id, Object.assign({}, it, { state: a }), { note: "at the table" }); api.render(); return; }
    if ((a === "up" || a === "down") && it) {
      const L = items("plot").filter(p => p.order != null).sort((x, y) => x.order - y.order), i = L.findIndex(p => p.id === id), j = a === "up" ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= L.length) return;
      const oi = L[i].order, oj = L[j].order; St.put("items", L[i].id, Object.assign({}, St.items()[L[i].id], { order: oj }), { note: "written" }); St.put("items", L[j].id, Object.assign({}, St.items()[L[j].id], { order: oi }), { note: "written" }); api.render(); return;
    }
    if (a === "lib" && it && A.myLibrary) { const pack = St.packOf ? St.packOf("item:" + id) : { items: { [id]: it } }; A.myLibrary.save({ kind: "story", name: it.n, say: label(St.ITEMS, it.kind, ""), data: pack }).then(() => api.note(`"${it.n}" is kept in your library.`), x => api.note(x.message)); }
  }
  A.tableUI.addTab({
    key: "plot", label: "Plot and story", icon: "link", group: "prep", after: "clues", desc: "Plot points, branches, mysteries and quests, as you write them",
    html,
    status: () => { const p = items("plot"), r = p.filter(x => state(x) === "ready").length; return `${p.length} plot point${p.length === 1 ? "" : "s"}${r ? ` · ${r} whose moment has come` : ""}`; },
    bind(body) {
      const f = body.querySelector("form[data-plform]"); if (!f) return;
      f.addEventListener("submit", e => { e.preventDefault(); save(f); });
      const k = f.elements.onk; if (k) k.addEventListener("change", () => { for (const el of f.querySelectorAll(".pl-on")) el.hidden = el.dataset.for !== k.value; });
    },
    init() {
      document.addEventListener("click", e => { const b = e.target.closest && e.target.closest(".pl [data-pl]"); if (b) { e.preventDefault(); act(b); } });
      St.on(() => { if (api.tab() === "plot") api.render(); });
    }
  });
  // for the Gazetteer and the readiness panel: open the tab at a new one of a kind
  A.plot = { open: kind => { UI.edit = kind ? { kind } : null; const X = api.ctx(); if (X && X.setView) X.setView("table"); api.open("plot"); }, edit: id => { UI.edit = { id }; const X = api.ctx(); if (X && X.setView) X.setView("table"); api.open("plot"); }, items, state, warnings };
})(typeof ATLAS !== "undefined" ? ATLAS : {});
