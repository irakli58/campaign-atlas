/* The investigation, as the referee sees it (the data and the reasoning are in atlas-story.js). The user asked for it
   on 21 Oct 2026: clues placed on the map and written in a moment; "Auto-Connect to Story", whose suggestions are read
   and approved one by one, never written on their own; connections made by hand, which no suggestion replaces;
   investigation chains and the ways into a revelation; open questions and contradictions; an investigation board;
   what each person knows, how they learned it, what they will say; and every change undoable.
   It is a tab of "At the table" (Investigation), and a tool of the map editor (Clues). */
(function (A) {
  "use strict";
  if (!A.story || !A.tableUI) return;
  const St = A.story, T = A.table, esc = St.esc, api = A.tableUI.api;
  const $ = s => document.querySelector(s);
  const UI = { view: "clues", sel: null, q: "", f: { pl: "", k: "", st: "", who: "", arc: "", arch: false }, person: null, item: null, review: null, follow: null, busy: null, err: "", speak: null, kedit: null, flash: "", undo: null, sure: "" };
  const opt = (list, cur, none) => (none != null ? `<option value="">${esc(none)}</option>` : "") + list.map(([v, l]) => `<option value="${esc(v)}"${String(cur) === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("");
  const glyph = k => `<svg class="ic-gl" viewBox="-5 -5 10 10" aria-hidden="true"><path d="${A.clueGlyph(k || "other")}"/></svg>`;
  const parse = ref => { const i = ref.indexOf(":"); return [ref.slice(0, i), ref.slice(i + 1)]; };
  const clueOf = ref => { const [k, r] = parse(ref); if (k !== "clue") return null; const [pl, id] = r.split("/"); return { pl, id, c: St.clue(pl, id) }; };
  const when = t => new Date(t || 0).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const stName = s => (St.STATUS.find(x => x[0] === s) || [0, s])[1];
  const label = (list, v, d) => (list.find(x => x[0] === v) || [0, d == null ? v : d])[1];
  const confChip = c => c ? `<span class="ic-conf ${esc(c)}">${esc({ high: "likely", medium: "possible", low: "a stretch" }[c] || c)}</span>` : "";
  const srcChip = s => `<span class="ic-src ${esc(s || "dm")}">${esc({ written: "written in the campaign", file: "in the campaign's files", ai: "approved suggestion", dm: "yours" }[s] || s)}</span>`;
  // a picker of everything in the campaign, by kind
  function picker(name, cur, except, kinds) {
    const g = {}; for (const e of St.entities().list) { if (e.ref === except || (kinds && !kinds.includes(e.kind))) continue; (g[e.kind] = g[e.kind] || []).push(e); }
    return `<select name="${name}" class="t-in"><option value="">Choose…</option>${Object.entries(g).map(([k, l]) => `<optgroup label="${esc(St.kindName[k] || k)}">${l.map(e => `<option value="${esc(e.ref)}"${e.ref === cur ? " selected" : ""}>${esc(e.name)}${e.sub ? " — " + esc(e.sub) : ""}</option>`).join("")}</optgroup>`).join("")}</select>`;
  }
  const relSelect = (name, cur) => `<select name="${name}" class="t-in">${St.RELS.map(r => `<option value="${esc(r[0])}"${r[0] === cur ? " selected" : ""} title="${esc(r[2])}">${esc(r[0])}</option>`).join("")}${cur && !St.RELS.some(r => r[0] === cur) ? `<option selected>${esc(cur)}</option>` : ""}<option value="__own">My own word…</option></select>`;
  const ent = ref => St.ent(ref);
  const go = ref => { const e = ent(ref); if (!e) return `<span class="ic-gone">${esc(St.name(ref))}</span>`; return `<button type="button" class="ic-ref k-${esc(e.kind)}" data-icgo="${esc(ref)}" title="${esc(St.kindName[e.kind] || "")}">${e.kind === "clue" ? glyph(e.k) : ""}${esc(e.name)}</button>`; };

  /* ================================================================ the tab */
  const VIEWS = [["clues", "Clues", "clue"], ["people", "People and what they know", "know"], ["loose", "Questions and loose ends", "ask"], ["items", "Story elements", "link"], ["history", "History", "tonight"]];
  function html() {
    const w = St.warnings();
    const head = `<div class="ic-head"><div><h3>${T.icon("clue")} The investigation</h3><p class="t-small">Every clue in the campaign, where it lies, what it joins to and who knows of it. Only you see this.</p></div><span class="t-sp"></span><button type="button" class="t-btn prim" data-ica="new">${T.icon("clue")} A new clue</button></div>
      <nav class="ic-views" role="tablist">${VIEWS.map(([k, l, ic]) => `<button type="button" role="tab" data-icv="${k}" aria-selected="${UI.view === k}">${T.icon(ic)}${esc(l)}${k === "loose" && w.length ? ` <b class="ic-badge">${w.length + Object.values(St.questions()).filter(q => q.state === "open" || q.state === "develop").length}</b>` : ""}</button>`).join("")}</nav>
      ${UI.undo ? `<div class="ic-toast"><span>${esc(UI.undo.text)}</span>${UI.undo.batch ? `<button type="button" class="t-btn" data-ica="undobatch" data-b="${esc(UI.undo.batch)}">Undo</button>` : ""}<button type="button" class="t-mini" data-ica="toastx" aria-label="Close">×</button></div>` : ""}
      ${!St.ready() ? `<p class="ic-warn">The page's store is not ready: changes cannot be kept yet.</p>` : ""}`;
    const body = { clues: cluesView, people: peopleView, loose: looseView, items: itemsView, history: historyView }[UI.view] || cluesView;
    return `<div class="inv">${head}${body(w)}</div>`;
  }

  /* ---- clues: the list, with filters, and the chosen one */
  function filtered() {
    const f = UI.f, q = UI.q.trim().toLowerCase();
    return St.allClues(f.arch).filter(({ pl, id, c, ref }) => {
      if (f.arch && !c.arch) return false;
      if (f.pl && pl !== f.pl) return false;
      if (f.k && (c.k || "") !== (f.k === "none" ? "" : f.k)) return false;
      if (f.st === "open" ? St.status(pl, id) === "resolved" : f.st && St.status(pl, id) !== f.st) return false;
      if (f.who && !St.linksOf(ref).some(l => l.other === f.who) && !St.knownBy(ref).some(k => k.who === f.who)) return false;
      if (f.arc && (f.arc.startsWith("#") ? !(c.tags || []).includes(f.arc.slice(1)) : !St.linksOf(ref).some(l => l.other === f.arc))) return false;
      if (q && ![c.t, c.pd, c.d, c.kp, c.rev, (c.tags || []).join(" "), (A.meta[pl] || {}).name].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function cluesView(w) {
    const f = UI.f, list = filtered(), all = St.allClues(), places = (A.order || []).filter(id => A.maps[id] && !A.maps[id].alias).map(id => [id, (A.meta[id] || {}).name || id]);
    const arcs = St.entities().list.filter(e => e.kind === "item" && (e.ik === "mystery" || e.ik === "quest")).map(e => [e.ref, e.name]).concat([...new Set(all.flatMap(c => c.c.tags || []))].map(t => ["#" + t, "#" + t]));
    const warnOf = ref => w.filter(x => x.ref === ref || (x.refs || []).includes(ref));
    if (UI.sel && !ent(UI.sel) && !(clueOf(UI.sel) || {}).c) UI.sel = null;
    if (!UI.sel && list.length) UI.sel = list[0].ref;
    return `<div class="ic-filters"><input class="t-in" data-icf="q" value="${esc(UI.q)}" placeholder="Search the clues" aria-label="Search the clues">
        <select class="t-in" data-icf="pl" aria-label="Map">${opt(places, f.pl, "Every place")}</select>
        <select class="t-in" data-icf="k" aria-label="Kind">${opt(St.TYPES.map(t => [t[0], t[1]]).concat([["none", "No kind set"]]), f.k, "Every kind")}</select>
        <select class="t-in" data-icf="st" aria-label="How far the players are">${opt([["open", "Not yet answered"]].concat(St.STATUS), f.st, "Found or not")}</select>
        <select class="t-in" data-icf="who" aria-label="Person">${opt(St.people().map(p => [p.ref, p.name]), f.who, "Anyone")}</select>
        ${arcs.length ? `<select class="t-in" data-icf="arc" aria-label="Mystery or tag">${opt(arcs, f.arc, "Every mystery")}</select>` : ""}
        <label class="ic-ck"><input type="checkbox" data-icf="arch"${f.arch ? " checked" : ""}> Archived</label><span class="kn">${list.length} of ${all.length}</span></div>
      <div class="ic-split"><ul class="ic-list">${list.length ? list.map(({ pl, id, c, ref }) => { const s = St.status(pl, id), ws = warnOf(ref), n = St.linksOf(ref).filter(l => l.rel !== "was found in").length; return `<li><button type="button" class="ic-row${UI.sel === ref ? " on" : ""}" data-icsel="${esc(ref)}"><i class="ic-st ${esc(s)}" title="${esc(stName(s))}"></i>${glyph(c.k)}<span class="ic-rt"><b>${esc(c.t || id)}</b><span>${esc((A.meta[pl] || {}).name || pl)} · ${esc(id)}${c.at ? " · " + esc(c.at) : ""}</span></span><span class="ic-rn">${n ? `<i title="${n} connections">${T.icon("link")}${n}</i>` : ""}${ws.length ? `<i class="ic-w" title="${esc(ws.map(x => x.text).join("\n"))}">!</i>` : ""}</span></button></li>`; }).join("") : `<li class="kn">${all.length ? "No clue matches." : "No clues yet. Make one here, or place one on a map with the map editor's Clues tool."}</li>`}</ul>
      <div class="ic-det">${UI.sel ? clueDetail(UI.sel) : `<p class="kn">Choose a clue.</p>`}</div></div>`;
  }
  function clueDetail(ref) {
    const x = clueOf(ref); if (!x || !x.c) return `<p class="kn">That clue is no longer here.</p>`;
    const { pl, id, c } = x, M = A.get(pl, 99), s = St.status(pl, id), mk = St.markerOf(pl, id), rooms = Object.keys(M.rooms || {}).filter(r => /^R\d/.test(r)).map(r => [r, `${r} ${A.nameOf(M, r) || ""}`]);
    const hist = St.history(e => e.coll === "cluebook" && e.key === pl + "/" + id && !e.undone)[0];
    const busy = UI.busy && UI.busy.ref === ref ? UI.busy.what : "";
    const places = (A.order || []).filter(q => A.meta[q] && q !== pl).map(q => [q, A.meta[q].name || q]);
    return `<article class="ic-clue">
      <div class="ic-ch">${glyph(c.k)}<div><h4>${esc(c.t || id)}${c.arch ? ` <span class="ic-src">archived</span>` : ""}</h4><p class="kn">${esc((A.meta[pl] || {}).name || pl)} · ${esc(id)}${c.at ? ` · ${esc(A.nameOf(M, c.at) || c.at)}` : ""}${mk ? "" : " · no marker on the map yet"}</p></div><span class="t-sp"></span>
        <label class="ic-stsel">How far the players are <select class="t-in" data-icstat="${esc(ref)}">${opt(St.STATUS, s)}</select></label></div>
      <div class="t-row ic-acts"><button type="button" class="t-btn prim ic-auto" data-ica="auto" data-r="${esc(ref)}"${busy ? " disabled" : ""}>${T.icon("spark")} ${busy === "connect" ? "Reading the campaign…" : "Auto-Connect to Story"}</button>
        <button type="button" class="t-btn" data-ica="follow" data-r="${esc(ref)}"${busy ? " disabled" : ""}>${busy === "follow" ? "Thinking…" : "Suggest next clues"}</button>
        <button type="button" class="t-btn" data-ica="map" data-r="${esc(ref)}">${mk ? "Show it on the map" : "Place it on the map"}</button>
        <span class="t-sp"></span><button type="button" class="t-mini" data-ica="dup" data-r="${esc(ref)}">Duplicate</button><button type="button" class="t-mini" data-ica="arch" data-r="${esc(ref)}">${c.arch ? "Bring back" : "Archive"}</button><button type="button" class="t-mini ic-del" data-ica="del" data-r="${esc(ref)}">${UI.sure === "del" + ref ? "Really delete it?" : "Delete"}</button>${hist ? `<button type="button" class="t-mini" data-ica="undo" data-g="${esc(hist.id)}" title="${esc(when(hist.t))}">Undo last change</button>` : ""}</div>
      ${UI.err && busy === "" && UI.errRef === ref ? `<p class="ic-warn">${esc(UI.err)}</p>` : ""}
      ${UI.review && UI.review.ref === ref ? reviewHTML(UI.review) : ""}
      ${UI.follow && UI.follow.ref === ref ? followHTML(UI.follow, pl) : ""}
      <details class="ic-sec" open><summary>The clue</summary><form class="ic-form" data-icform="clue" data-r="${esc(ref)}">
        <div class="ic-g2"><label>Name<input class="t-in" name="t" value="${esc(c.t || "")}" maxlength="120" required></label><label>Kind<select class="t-in" name="k">${opt(St.TYPES.map(t => [t[0], t[1]]), c.k || "", "Not set")}</select></label></div>
        <label>In a line<input class="t-in" name="sum" value="${esc(c.sum || "")}" maxlength="200" placeholder="What it is, in a few words"></label>
        <label class="ic-pub">What the players see <span class="kn">(they read this once they find it)</span><textarea class="t-in" name="pd" rows="2" maxlength="1500">${esc(c.pd || "")}</textarea></label>
        <label class="ic-gm">Only you know <span class="kn">(never shown to the players)</span><textarea class="t-in" name="kp" rows="2" maxlength="1500">${esc(c.kp || "")}</textarea></label>
        <details><summary>More: how it is found, what it means, where it leads</summary>
          <label>What it is<textarea class="t-in" name="d" rows="2" maxlength="1500">${esc(c.d || "")}</textarea></label>
          <div class="ic-g2"><label>How it is found<input class="t-in" name="how" value="${esc(c.how || "")}" maxlength="400"></label><label>The roll, if any<input class="t-in" name="roll" value="${esc(c.roll || "")}" maxlength="80" placeholder="Spot Hidden (Hard), Investigation DC 15"></label></div>
          <label>What it reveals: why it matters<textarea class="t-in" name="rev" rows="2" maxlength="1500">${esc(c.rev || "")}</textarea></label>
          <label>If the players miss it<input class="t-in" name="hint" value="${esc(c.hint || "")}" maxlength="400"></label>
          <div class="ic-g2"><label>The room<select class="t-in" name="at">${opt(rooms, c.at || "", "Not in a room")}</select></label><label>Exactly where<input class="t-in" name="p" value="${esc(c.p || "")}" maxlength="120" placeholder="under the floorboard"></label></div>
          <label>Leads to<select class="t-in" name="to" multiple size="4">${places.map(([v, l]) => `<option value="${esc(v)}"${[].concat(c.to || []).includes(v) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
          <div class="ic-g2"><label>Tags<input class="t-in" name="tags" value="${esc((c.tags || []).join(", "))}" maxlength="200" placeholder="the fire, Act II"></label><label>Notes for you<input class="t-in" name="notes" value="${esc(c.notes || "")}" maxlength="600"></label></div>
        </details>
        <div class="t-row"><button type="submit" class="t-btn prim">Save the clue</button></div></form></details>
      <details class="ic-sec" open><summary>Connections</summary>${linksHTML(ref)}</details>
      <details class="ic-sec"><summary>Where it leads, and what leads to it</summary>${chainHTML(ref)}</details>
      <details class="ic-sec"><summary>Who knows of it</summary>${knowsHTML(ref)}</details>
      <details class="ic-sec"><summary>Its web</summary>${webHTML(ref)}</details>
    </article>`;
  }
  // the connections: saved and written, read from this side; a way to add one
  function linksHTML(ref) {
    const ls = St.linksOf(ref).filter(l => l.rel !== "was found in");
    const row = l => {
      const word = l.dir === 1 ? l.rel : St.relBack(l.rel), mine = l.src !== "written" && l.src !== "file", edit = UI.ledit === l.id;
      if (edit) return `<li class="ic-lk"><form class="ic-form ic-inl" data-icform="ledit" data-id="${esc(l.id)}">${relSelect("rel", l.rel)}<input class="t-in" name="own" placeholder="your own word" maxlength="40" hidden>${go(l.other)}<input class="t-in" name="why" value="${esc(l.why || "")}" placeholder="why (for you only)" maxlength="400"><button class="t-btn prim">Save</button><button type="button" class="t-mini" data-ica="lcancel">Cancel</button></form></li>`;
      return `<li class="ic-lk"><span class="ic-rel">${esc(word)}</span> ${go(l.other)} ${srcChip(l.src)}${l.conf ? confChip(l.conf) : ""}${l.cert === "hypothesis" ? `<span class="ic-hyp">hypothesis</span>` : ""}${l.why ? `<p class="kn">${esc(l.why)}</p>` : ""}${l.basis ? `<p class="kn ic-basis">${esc(l.basis)}</p>` : ""}
        ${l.id && mine ? `<span class="ic-la"><button type="button" class="t-mini" data-ica="lshow" data-id="${esc(l.id)}" aria-pressed="${!!l.shown}" title="Show this connection on the players' board (once both ends are on it)">${l.shown ? "On the players' board" : "Pin up for the players"}</button><button type="button" class="t-mini" data-ica="ledit" data-id="${esc(l.id)}">Change</button><button type="button" class="t-mini ic-del" data-ica="ldel" data-id="${esc(l.id)}">Remove</button></span>` : ""}</li>`;
    };
    return `${ls.length ? `<ul class="ic-lks">${ls.map(row).join("")}</ul>` : `<p class="kn">Nothing joins it to the story yet. Auto-Connect to Story looks for what does, or join it yourself.</p>`}
      <form class="ic-form ic-inl" data-icform="link" data-r="${esc(ref)}"><span class="kn">Join it yourself:</span>${relSelect("rel", "reveals")}<input class="t-in" name="own" placeholder="your own word" maxlength="40" hidden>${picker("to", "", ref)}<input class="t-in" name="why" placeholder="why (for you only)" maxlength="400"><button class="t-btn">Join</button></form>`;
  }
  function chainHTML(ref) {
    const tree = (nodes, d) => nodes.length ? `<ul class="ic-tree">${nodes.map(n => `<li><span class="ic-rel">${esc(n.rel)}</span> ${go(n.ref)}${n.again ? ` <span class="kn">(already above)</span>` : ""}${n.next && n.next.length && d < 4 ? tree(n.next, d + 1) : ""}</li>`).join("")}</ul>` : "";
    const ch = St.chain(ref, 4), by = St.revealedBy(ref);
    return `<div class="ic-g2"><div><h5>Where it leads</h5>${ch.length ? tree(ch, 1) : `<p class="kn">Nowhere yet.</p>`}</div><div><h5>What leads to it</h5>${by.length ? `<ul class="ic-tree">${by.map(b => `<li>${go(b.ref)} <span class="ic-rel">${esc(b.rel)}</span></li>`).join("")}</ul>` : `<p class="kn">Nothing leads here: the players find it only by being in the place.</p>`}</div></div>`;
  }
  function knowsHTML(ref) {
    const ks = St.knownBy(ref);
    return `${ks.length ? `<ul class="ic-lks">${ks.map(k => `<li>${go(k.who)} <span class="ic-rel">${esc(label(St.KTYPES, k.type, "knows"))}</span> · ${esc(label(St.KHOW, k.how, "source not recorded"))}${k.from ? ` (from ${go(k.from)})` : ""} · ${esc(label(St.KSHARE, k.share, ""))} ${srcChip(k.src)}${k.text ? `<p class="kn">${esc(k.text)}</p>` : ""}</li>`).join("")}</ul>` : `<p class="kn">Nobody is recorded as knowing of it. Finding it does not tell anyone else: knowledge spreads only as you record it.</p>`}
      <form class="ic-form ic-inl" data-icform="kquick" data-r="${esc(ref)}"><span class="kn">Someone knows of it:</span>${picker("who", "", null, ["person"])}<select class="t-in" name="type">${opt(St.KTYPES, "fact")}</select><select class="t-in" name="how">${opt(St.KHOW, "witnessed")}</select><select class="t-in" name="share">${opt(St.KSHARE, "pressed")}</select><button class="t-btn">Record it</button></form>`;
  }
  // the clue in the middle of what it joins, and what those join, drawn on cork as the board is
  function webHTML(ref) {
    const nodes = [], edges = [], seen = new Set(), kindOf = e => e.kind === "person" || e.kind === "pc" ? "person" : e.kind === "place" || e.kind === "room" ? "place" : e.kind === "clue" ? "clue" : "item";
    const add = r => { if (seen.has(r)) return; const e = ent(r); if (!e) return; seen.add(r); nodes.push({ id: r, kind: kindOf(e), title: e.name, sub: St.kindName[e.kind] || "" }); };
    add(ref);
    for (const l of St.linksOf(ref)) { add(l.other); if (seen.has(l.other)) edges.push({ a: ref, b: l.other, kind: l.src === "written" ? (l.rel === "leads to" ? "lead" : "at") : "story" }); }
    for (const n of nodes.slice(1, 10)) for (const l of St.linksOf(n.id).slice(0, 4)) { if (nodes.length > 22) break; add(l.other); if (seen.has(l.other) && l.other !== ref) edges.push({ a: n.id, b: l.other, kind: l.src === "written" ? (l.rel === "leads to" ? "lead" : "at") : "story" }); }
    if (nodes.length < 2) return `<p class="kn">Nothing to draw yet.</p>`;
    const W = 900, H = 520, pos = T.boardLayout({ nodes, edges }, W, H);
    return `<div class="ic-web"><div class="ic-webz" style="width:${W}px;height:${H}px">${T.boardHTML({ nodes, edges }, pos, () => true, W, H, true)}</div></div><p class="t-small">Click a card to open it. Blue string is a connection saved here; red, a lead the campaign wrote; grey, where things are.</p>`;
  }

  /* ---- Auto-Connect to Story: what the campaign says, read by Claude where the page can reach it, checked, and shown
          for approval; nothing is saved until it is approved */
  async function autoConnect(ref) {
    UI.busy = { ref, what: "connect" }; UI.review = null; UI.err = ""; api.render();
    try {
      const g = St.ground(ref); let res = null, by = "page";
      if (g.pool.length) {
        const { prompt, codes } = St.connectPrompt(ref, g);
        let raw = null;
        try { raw = await api.askRaw(prompt); } catch (e) { if (e && e.code === "rate_limited") throw new Error("Claude is busy just now: try again in a minute."); console.warn("auto-connect", e); raw = null; }
        if (raw) { res = St.readConnect(raw, codes); if (res) by = "claude"; }
      }
      if (!res) res = St.localConnect(g);
      const R = { ref, by, pool: g.pool.length, dropped: res.dropped || 0, list: [], people: [], contra: [], questions: [], ideas: res.ideas || [] };
      for (const s of res.connections) {
        if (s.to === ref) continue;
        const had = St.linked(ref, s.to), same = had.find(l => (l.dir === 1 ? l.rel : St.relBack(l.rel)) === s.rel);
        if (same) continue;
        const clash = had.find(l => l.src !== "written");
        R.list.push(Object.assign({}, s, { on: !clash && s.conf !== "low", clash: clash ? (clash.dir === 1 ? clash.rel : St.relBack(clash.rel)) : "" }));
      }
      for (const p of res.people) if (!St.knownBy(ref).some(k => k.who === p.who)) R.people.push(Object.assign({}, p, { on: false }));
      R.contra = res.contradictions.map(c => Object.assign({}, c, { on: true }));
      R.questions = res.questions.filter(q => !Object.values(St.questions()).some(x => x.text === q)).map(text => ({ text, on: true }));
      UI.review = R;
    } catch (e) { UI.err = e.message || String(e); UI.errRef = ref; }
    UI.busy = null; api.render();
  }
  function reviewHTML(R) {
    const n = R.list.length + R.people.length + R.contra.length + R.questions.length;
    const head = R.by === "claude" ? `Claude read ${R.pool} elements of the campaign the page found around this clue, and suggests:` : `Suggested by the page's own matching: the same room, the same place, names and words the clue shares with the campaign.${R.pool ? " (Claude was not reachable from this page.)" : ""}`;
    if (!n && !R.ideas.length) return `<section class="ic-rev"><h5>${T.icon("spark")} Auto-Connect to Story</h5><p>Nothing in the campaign as it stands connects to this clue: no person, place or event it names or shares a room with. That is not a fault; it may be new.</p>
      <div class="t-row"><button type="button" class="t-btn" data-ica="newitem" data-r="${esc(R.ref)}">Make a new story element for it</button><button type="button" class="t-btn" data-ica="follow" data-r="${esc(R.ref)}">Suggest next clues</button><button type="button" class="t-mini" data-ica="revx">Close</button></div></section>`;
    const relOpts = (i, cur) => `<select class="t-in" data-icrev="rel" data-i="${i}">${St.RELS.map(r => `<option${r[0] === cur ? " selected" : ""}>${esc(r[0])}</option>`).join("")}${St.RELS.some(r => r[0] === cur) ? "" : `<option selected>${esc(cur)}</option>`}</select>`;
    return `<section class="ic-rev"><h5>${T.icon("spark")} Auto-Connect to Story</h5><p class="kn">${esc(head)} Tick what is right, change what is nearly right; nothing is kept until you save.${R.dropped ? ` ${R.dropped} suggestion${R.dropped > 1 ? "s" : ""} named things not in the campaign, and ${R.dropped > 1 ? "were" : "was"} left out.` : ""}</p>
      ${R.list.length ? `<h6>Connections</h6><ul class="ic-rl">${R.list.map((s, i) => `<li class="${s.clash ? "clash" : ""}"><label class="ic-ck"><input type="checkbox" data-icrev="on" data-i="${i}"${s.on ? " checked" : ""}></label><div>${relOpts(i, s.rel)} ${go(s.to)} ${confChip(s.conf)}<span class="${s.cert === "fact" ? "ic-fact" : "ic-hyp"}">${s.cert === "fact" ? "the campaign says so" : "hypothesis"}</span>
          <textarea class="t-in" rows="2" data-icrev="why" data-i="${i}" maxlength="400">${esc(s.why)}</textarea>${s.basis ? `<p class="kn ic-basis">Rests on: ${esc(s.basis)}</p>` : ""}${s.clash ? `<p class="ic-warn">You joined these already as "${esc(s.clash)}". Saving this adds a second connection beside yours; yours stays as it is.</p>` : ""}</div></li>`).join("")}</ul>` : ""}
      ${R.people.length ? `<h6>Who might know of it</h6><ul class="ic-rl">${R.people.map((p, i) => `<li><label class="ic-ck"><input type="checkbox" data-icrev="pon" data-i="${i}"${p.on ? " checked" : ""}></label><div>${go(p.who)} <span class="ic-rel">${esc(p.kind)}</span> ${confChip(p.conf)}<p class="kn">${esc(p.why)}</p></div></li>`).join("")}</ul><p class="t-small">"May already know" and "may have witnessed" become what they know (you can say how, later); the rest become connections. Nobody learns anything unless you tick it.</p>` : ""}
      ${R.contra.length ? `<h6>What does not fit</h6><ul class="ic-rl">${R.contra.map((c, i) => `<li class="clash"><label class="ic-ck"><input type="checkbox" data-icrev="con" data-i="${i}"${c.on ? " checked" : ""}></label><div>Against ${go(c.with)}: ${esc(c.issue)}<p class="kn">Ticked, it is kept as a "contradicts" connection and a warning for you to settle. Nothing is changed.</p></div></li>`).join("")}</ul>` : ""}
      ${R.questions.length ? `<h6>Questions it raises</h6><ul class="ic-rl">${R.questions.map((q, i) => `<li><label class="ic-ck"><input type="checkbox" data-icrev="qon" data-i="${i}"${q.on ? " checked" : ""}></label><div>${esc(q.text)}</div></li>`).join("")}</ul>` : ""}
      ${R.ideas.length ? `<h6>Ideas, not in the campaign</h6><ul class="ic-ideas">${R.ideas.map((t, i) => `<li>${esc(t)} <button type="button" class="t-mini" data-ica="idea" data-i="${i}" data-r="${esc(R.ref)}">Make it a story element</button></li>`).join("")}</ul>` : ""}
      <div class="t-row"><button type="button" class="t-btn prim" data-ica="revsave">Save what is ticked</button><button type="button" class="t-btn" data-ica="revall" title="Every connection that is at least possible and does not clash with yours, every contradiction and question">Accept all that are likely</button><button type="button" class="t-mini" data-ica="revx">Close</button></div></section>`;
  }
  function saveReview(all) {
    const R = UI.review; if (!R) return; const batch = St.uid("B"), note = "Auto-Connect: " + St.name(R.ref); let n = 0;
    for (const s of R.list) if (all ? (!s.clash && s.conf !== "low") : s.on) { St.link(R.ref, s.to, s.rel, { why: s.why, basis: s.basis, conf: s.conf, cert: s.cert }, { src: "ai", batch, note }); n++; }
    for (const p of R.people) if (all ? false : p.on) {
      if (/already know|witnessed/i.test(p.kind)) St.know({ who: p.who, about: R.ref, text: St.name(R.ref), type: /witness/i.test(p.kind) ? "fact" : "report", how: /witness/i.test(p.kind) ? "witnessed" : "", rel: "reliable", share: "pressed", note: "Suggested: " + p.why }, { src: "ai", batch, note });
      else St.link(p.who, R.ref, p.kind.replace(/^(may |could |would |has )/i, "").slice(0, 40) || "knows about", { why: p.why, conf: p.conf, cert: "hypothesis" }, { src: "ai", batch, note });
      n++;
    }
    for (const c of R.contra) if (all || c.on) { St.link(R.ref, c.with, "contradicts", { why: c.issue, cert: "hypothesis" }, { src: "ai", batch, note }); n++; }
    for (const q of R.questions) if (all || q.on) { St.put("questions", St.uid("Q"), { text: q.text, about: [R.ref], state: "open", src: "ai" }, { src: "ai", batch, note }); n++; }
    UI.review = null; UI.undo = n ? { text: `Saved ${n} from Auto-Connect.`, batch } : { text: "Nothing was ticked: nothing saved." }; api.render();
  }

  /* ---- the next clues: new content, only when asked for, each added only when chosen */
  async function followUp(ref) {
    UI.busy = { ref, what: "follow" }; UI.follow = null; UI.err = ""; api.render();
    try {
      const { prompt, codes } = St.followPrompt(ref); let raw = null;
      try { raw = await api.askRaw(prompt); } catch (e) { if (e && e.code === "rate_limited") throw new Error("Claude is busy just now: try again in a minute."); raw = null; }
      UI.follow = raw ? { ref, list: St.readFollow(raw, codes) || [] } : { ref, none: true };
    } catch (e) { UI.err = e.message || String(e); UI.errRef = ref; }
    UI.busy = null; api.render();
  }
  function followHTML(F, pl) {
    if (F.none) return `<section class="ic-rev"><h5>Next clues</h5><p class="kn">Suggesting new clues needs Claude, which this page cannot reach (on claude.ai it asks your permission; in the Atlas app it uses your own). You can make one yourself with "A new clue".</p><button type="button" class="t-mini" data-ica="folx">Close</button></section>`;
    const places = (A.order || []).filter(q => A.maps[q] && !A.maps[q].alias).map(q => [q, A.meta[q].name || q]);
    return `<section class="ic-rev"><h5>Next clues: ideas, not yet in the campaign</h5><p class="kn">Each is added only when you add it, as a clue without a marker, joined to this one. Place it on its map afterwards.</p>
      ${F.list.length ? `<ul class="ic-rl">${F.list.map((d, i) => `<li><div>${glyph(d.k)} <b>${esc(d.t)}</b> <span class="ic-rel">${d.route === "alternative" ? "another way to the same truth" : "what comes next"}</span><p>${esc(d.pd)}</p>${d.kp ? `<p class="kn">Only you: ${esc(d.kp)}</p>` : ""}${d.why ? `<p class="kn ic-basis">${esc(d.why)}</p>` : ""}
        <div class="t-row"><select class="t-in" data-icfol="pl" data-i="${i}">${opt(places, d.place ? d.place.slice(6) : pl)}</select><button type="button" class="t-btn" data-ica="foladd" data-i="${i}">Add this clue</button></div></div></li>`).join("")}</ul>` : `<p class="kn">No suggestion came back.</p>`}<button type="button" class="t-mini" data-ica="folx">Close</button></section>`;
  }

  /* ---- people: what each knows, how they came by it, what they will say */
  function peopleView(w) {
    const ps = St.people(), sel = UI.person && ent(UI.person) ? UI.person : (ps[0] || {}).ref;
    UI.person = sel;
    const count = r => St.knowledgeOf(r).length, warn = r => w.filter(x => (x.kind === "nosource" || x.kind === "accounts") && (x.ref === r || (x.refs || []).includes(r))).length;
    return `<div class="ic-split"><ul class="ic-list">${ps.map(p => `<li><button type="button" class="ic-row${sel === p.ref ? " on" : ""}" data-icperson="${esc(p.ref)}"><span class="ic-rt"><b>${esc(p.name)}</b><span>${esc(p.sub || "")}</span></span><span class="ic-rn">${count(p.ref) ? `<i>${count(p.ref)}</i>` : ""}${warn(p.ref) ? `<i class="ic-w">!</i>` : ""}</span></button></li>`).join("") || `<li class="kn">Nobody in this campaign yet.</li>`}</ul>
      <div class="ic-det">${sel ? personDetail(sel, w) : ""}</div></div>`;
  }
  function personDetail(ref, w) {
    const e = ent(ref), [k, rest] = parse(ref), cast = k === "cast" ? (A.castData || {})[rest] || {} : {}, [pl, nid] = k === "npc" ? rest.split("/") : [], n = pl ? ((A.get(pl, 99) || {}).npcs || {})[nid] || {} : {};
    const g = f => n[f] || cast[f] || "", written = [["Wants", g("want")], ["Hides", g("secret")], ["The lie they tell", g("lie")], ["What makes them talk", g("press")], ["Knows (written)", n.knows], ["Will reveal (written)", n.rev]].filter(x => x[1]);
    const ks = St.knowledgeOf(ref), ws = w.filter(x => x.ref === ref || (x.refs || []).includes(ref)).filter(x => x.kind === "nosource" || x.kind === "accounts" || x.kind === "gone");
    const hist = St.history(h => h.coll === "knowledge" && ((h.after || h.before || {}).who === ref)).slice(0, 12);
    const ed = UI.kedit && UI.kedit.who === ref ? UI.kedit : null, cur = ed && ed.id ? St.knowledge()[ed.id] || {} : {};
    const sp = UI.speak && UI.speak.who === ref ? UI.speak : null;
    const others = St.people().filter(p => p.ref !== ref);
    return `<article class="ic-clue"><div class="ic-ch"><div><h4>${esc(e.name)}</h4><p class="kn">${esc(e.role || e.sub || "")}</p></div></div>
      ${written.length ? `<details class="ic-sec"><summary>Written in the campaign</summary><dl class="ic-dl">${written.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl><p class="t-small">The campaign's own words, kept as they are. What follows is what you record here.</p></details>` : ""}
      ${ws.length ? ws.map(x => `<p class="ic-warn">${esc(x.text)}</p>`).join("") : ""}
      <section class="ic-sec2"><h5>What they know</h5>${ks.length ? `<ul class="ic-lks">${ks.map(x => `<li><span class="ic-rel">${esc(label(St.KTYPES, x.type, "knows"))}</span> ${x.about ? go(x.about) : ""} ${x.text ? `<b>${esc(x.text)}</b>` : ""}<p class="kn">${esc(label(St.KHOW, x.how, "How they learned it is not recorded"))}${x.from ? " · from " : ""}${x.from ? go(x.from) : ""}${x.when ? " · " + esc(x.when) : ""} · ${esc(label(St.KREL, x.rel, "unsure"))} · ${esc(label(St.KSHARE, x.share, "says if asked"))}${x.why ? " (" + esc(x.why) + ")" : ""} ${srcChip(x.src)}</p>${x.note ? `<p class="kn">${esc(x.note)}</p>` : ""}<span class="ic-la"><button type="button" class="t-mini" data-ica="kedit" data-id="${esc(x.id)}" data-who="${esc(ref)}">Change</button><button type="button" class="t-mini ic-del" data-ica="kdel" data-id="${esc(x.id)}">Remove</button></span></li>`).join("")}</ul>` : `<p class="kn">Nothing recorded. They know nothing of the investigation's clues until you say so: a clue found by the players is not known to anyone else.</p>`}
        <form class="ic-form" data-icform="know" data-who="${esc(ref)}" data-id="${esc((ed && ed.id) || "")}"><h6>${ed && ed.id ? "Change what they know" : "Record what they know or believe"}</h6>
          <div class="ic-g2"><label>About<span>${picker("about", cur.about || "", ref)}</span></label><label>In their words<input class="t-in" name="text" value="${esc(cur.text || "")}" maxlength="400" placeholder="saw a woman in a red coat leave at midnight"></label></div>
          <div class="ic-g3"><label>It is<select class="t-in" name="type">${opt(St.KTYPES, cur.type || "fact")}</select></label><label>They came by it<select class="t-in" name="how">${opt(St.KHOW, cur.how || "", "Not recorded")}</select></label><label>From (if told)<select class="t-in" name="from">${opt(others.map(p => [p.ref, p.name]), cur.from || "", "Nobody")}</select></label></div>
          <div class="ic-g3"><label>When<input class="t-in" name="when" value="${esc(cur.when || "")}" maxlength="80" placeholder="the night of the fire"></label><label>How reliable<select class="t-in" name="rel">${opt(St.KREL, cur.rel || "reliable")}</select></label><label>Will they tell<select class="t-in" name="share">${opt(St.KSHARE, cur.share || "pressed")}</select></label></div>
          <label>Why they hide it or will not tell, if they do<input class="t-in" name="why" value="${esc(cur.why || "")}" maxlength="300"></label>
          <div class="t-row"><button class="t-btn prim">${ed && ed.id ? "Save the change" : "Record it"}</button>${ed && ed.id ? `<button type="button" class="t-mini" data-ica="kcancel">Cancel</button>` : ""}</div></form></section>
      <section class="ic-sec2"><h5>Someone tells someone</h5><form class="ic-form ic-inl" data-icform="tell"><span>${esc(e.name)} tells</span><select class="t-in" name="to">${opt(others.map(p => [p.ref, p.name]), "", "whom?")}</select><span>about</span><select class="t-in" name="k">${opt(ks.map(x => [x.id, x.text || St.name(x.about)]), "", ks.length ? "what?" : "they know nothing yet")}</select><input class="t-in" name="when" placeholder="when" maxlength="80"><input type="hidden" name="from" value="${esc(ref)}"><button class="t-btn"${ks.length ? "" : " disabled"}>Record it</button></form><p class="t-small">The listener learns it at second hand, as reliable as the teller's was (a false belief passed on stays false). Nobody else learns it.</p></section>
      <section class="ic-sec2"><h5>${T.icon("know")} Speak as them</h5><form class="ic-form" data-icform="speak" data-who="${esc(ref)}"><div class="ic-g2"><label>What the party asks<input class="t-in" name="q" maxlength="400" placeholder="Where were you on the night of the fire?" value="${esc((sp && sp.q) || "")}"></label><label>Evidence they show (optional)<span>${picker("ev", (sp && sp.ev) || "", null, ["clue"])}</span></label></div><div class="t-row"><button class="t-btn prim"${UI.busy && UI.busy.what === "speak" ? " disabled" : ""}>${UI.busy && UI.busy.what === "speak" ? "Thinking…" : "Answer as them"}</button></div></form>
        ${sp && sp.reply ? `<div class="ic-say"><p>${esc(sp.reply).replace(/\n+/g, "<br>")}</p>${sp.gm ? `<p class="ic-gmline"><b>For you:</b> ${esc(sp.gm)}</p>` : ""}</div>` : ""}
        ${sp && sp.none ? `<div class="ic-say"><p class="kn">Claude is not reachable from this page. What they would share:</p><ul>${ks.filter(x => x.share === "shares" || x.share === "pressed").map(x => `<li>${esc(x.text || St.name(x.about))} <span class="kn">(${esc(label(St.KTYPES, x.type, ""))}${x.share === "pressed" ? ", if pressed" : ""})</span></li>`).join("") || "<li>Nothing, as recorded.</li>"}</ul>${ks.some(x => x.share === "hides" || x.share === "refuses") ? `<p class="kn">What they hold back: ${ks.filter(x => x.share === "hides" || x.share === "refuses").map(x => esc(x.text || St.name(x.about))).join("; ")}.</p>` : ""}</div>` : ""}
        <p class="t-small">Answered from what they know here and what the campaign writes of them; for your eyes, to read out or not.</p></section>
      ${hist.length ? `<details class="ic-sec"><summary>How they came to know it: the history</summary><ul class="ic-hist">${hist.map(h => histRow(h)).join("")}</ul></details>` : ""}
    </article>`;
  }
  async function speak(who, q, ev) {
    UI.busy = { what: "speak", ref: who }; UI.speak = { who, q, ev }; api.render();
    let raw = null; try { raw = await api.askRaw(St.speakPrompt(who, q, ev)); } catch (e) { raw = null; }
    if (raw) { const i = raw.search(/\n\s*GM:/i); UI.speak = { who, q, ev, reply: (i >= 0 ? raw.slice(0, i) : raw).trim(), gm: i >= 0 ? raw.slice(i).replace(/^\s*GM:\s*/i, "").trim() : "" }; }
    else UI.speak = { who, q, ev, none: true };
    UI.busy = null; api.render();
  }

  /* ---- questions and loose ends */
  function looseView(w) {
    const qs = Object.entries(St.questions()).map(([id, q]) => Object.assign({ id }, q)).sort((a, b) => (b.t || 0) - (a.t || 0));
    const order = ["open", "develop", "intentional", "resolved"];
    const groups = { loose: "Loose clues: nothing joins them to the story", single: "Single threads: one clue is the only way", contra: "Contradictions to settle", accounts: "Accounts that differ", nosource: "Knowledge without a source", gone: "Connections to things no longer here" };
    return `<div class="ic-g2 ic-top"><section class="ic-sec2"><h5>Open questions</h5>
        <form class="ic-form ic-inl" data-icform="q"><input class="t-in" name="text" maxlength="240" placeholder="Who had a key to the locked room?" required><button class="t-btn">Add</button></form>
        ${qs.length ? order.map(st => { const l = qs.filter(q => (q.state || "open") === st); return l.length ? `<h6>${esc(label(St.QSTATE, st))}</h6><ul class="ic-lks">${l.map(q => `<li><b>${esc(q.text)}</b> ${srcChip(q.src)}${(q.about || []).length ? `<p class="kn">About: ${(q.about || []).map(go).join(" ")}</p>` : ""}${q.answer ? `<p class="kn">Answer: ${esc(q.answer)}</p>` : ""}<span class="ic-la"><select class="t-in" data-icq="${esc(q.id)}">${opt(St.QSTATE, q.state || "open")}</select><button type="button" class="t-mini ic-del" data-ica="qdel" data-id="${esc(q.id)}">Remove</button></span></li>`).join("")}</ul>` : ""; }).join("") : `<p class="kn">No questions yet. Auto-Connect to Story suggests the ones a clue raises; mark each an intended mystery, answered, or still to write.</p>`}</section>
      <section class="ic-sec2"><h5>Loose ends</h5>${w.length ? Object.entries(groups).map(([k, t]) => { const l = w.filter(x => x.kind === k); return l.length ? `<h6>${esc(t)}</h6><ul class="ic-lks">${l.map(x => `<li><p>${esc(x.text)}</p>${x.ref ? go(x.ref) : ""}</li>`).join("")}</ul>` : ""; }).join("") : `<p class="kn">None: every clue is joined to the story, every place the story needs has more than one way in, and every piece of knowledge has a source.</p>`}</section></div>`;
  }

  /* ---- story elements: what the campaign has no place for (factions, quests, events, mysteries) */
  function itemsView() {
    const its = Object.entries(St.items()).map(([id, it]) => Object.assign({ id }, it));
    const sel = UI.item && St.items()[UI.item] ? UI.item : null, cur = sel ? St.items()[sel] : {};
    return `<div class="ic-g2 ic-top"><section class="ic-sec2"><h5>Story elements</h5><p class="t-small">The factions, quests, events and mysteries the campaign speaks of but has no page for: made here, they can be joined to clues, people and places. The rest of the campaign (people, places, villains' plans, sessions, the story bible) is already here to join to.</p>
        ${its.length ? `<ul class="ic-lks">${its.map(it => `<li><b>${esc(it.n)}</b> <span class="ic-rel">${esc(label(St.ITEMS, it.kind, ""))}</span> ${srcChip(it.src)}${it.d ? `<p class="kn">${esc(it.d)}</p>` : ""}<p class="kn">${St.linksOf("item:" + it.id).length} connections</p><span class="ic-la"><button type="button" class="t-mini" data-ica="iedit" data-id="${esc(it.id)}">Change</button><button type="button" class="t-mini ic-del" data-ica="idel" data-id="${esc(it.id)}">Remove</button></span>${St.linksOf("item:" + it.id).length ? `<ul class="ic-tree">${St.linksOf("item:" + it.id).map(l => `<li><span class="ic-rel">${esc(l.dir === 1 ? l.rel : St.relBack(l.rel))}</span> ${go(l.other)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ul>` : `<p class="kn">None made yet.</p>`}</section>
      <section class="ic-sec2"><h5>${sel ? "Change it" : "Make one"}</h5><form class="ic-form" data-icform="item" data-id="${esc(sel || "")}"><div class="ic-g2"><label>Kind<select class="t-in" name="kind">${opt(St.ITEMS, cur.kind || "mystery")}</select></label><label>Name<input class="t-in" name="n" value="${esc(cur.n || "")}" maxlength="120" required></label></div><label>What it is<textarea class="t-in" name="d" rows="3" maxlength="1500">${esc(cur.d || "")}</textarea></label><label>When (for an event)<input class="t-in" name="when" value="${esc(cur.when || "")}" maxlength="80"></label><div class="t-row"><button class="t-btn prim">${sel ? "Save" : "Make it"}</button>${sel ? `<button type="button" class="t-mini" data-ica="icancel">Cancel</button>` : ""}</div></form></section></div>`;
  }

  /* ---- the history: every change, by whom (you, or an approved suggestion), each undoable */
  const COLLWORD = { cluebook: "Clue", links: "Connection", items: "Story element", questions: "Question", knowledge: "Knowledge", trapbook: "Trap", riddlebook: "Riddle" };
  function histRow(h) {
    const r = h.after || h.before || {}, what = h.coll === "links" ? `${St.name(r.a)} ${r.rel} ${St.name(r.b)}` : h.coll === "knowledge" ? `${St.name(r.who)}: ${r.text || St.name(r.about)}` : h.coll === "cluebook" || h.coll === "trapbook" || h.coll === "riddlebook" ? (r.t || h.key) : h.coll === "questions" ? r.text : r.n || h.key;
    const act = !h.before ? "added" : !h.after ? "removed" : "changed";
    return `<li class="${h.undone ? "undone" : ""}"><span class="kn">${esc(when(h.t))}</span> <b>${esc(COLLWORD[h.coll] || h.coll)} ${act}</b>: ${esc(what || "")} ${srcChip(h.src)}${h.note && h.note !== "undo" ? ` <span class="kn">${esc(h.note)}</span>` : h.note === "undo" ? ` <span class="kn">(an undo)</span>` : ""}${h.undone ? ` <span class="kn">undone</span>` : ` <button type="button" class="t-mini" data-ica="undo" data-g="${esc(h.id)}">Undo</button>`}</li>`;
  }
  function historyView() {
    const hs = St.history().slice(0, 120), batches = [...new Set(hs.filter(h => h.batch && !h.undone).map(h => h.batch))];
    return `<section class="ic-sec2"><h5>Every change, newest first</h5><p class="t-small">What you changed and what you approved from Auto-Connect. Undo puts a thing back as it was before that change; an undo is a change too, so it can be undone.</p>
      ${batches.length ? `<p>${batches.slice(0, 6).map(b => { const l = hs.filter(h => h.batch === b); return `<button type="button" class="t-btn" data-ica="undobatch" data-b="${esc(b)}">Undo the ${l.length} from ${esc(l[0].note.replace(/^Auto-Connect: /, "") || "a suggestion")}</button>`; }).join(" ")}</p>` : ""}
      ${hs.length ? `<ul class="ic-hist">${hs.map(histRow).join("")}</ul>` : `<p class="kn">No changes yet.</p>`}</section>`;
  }

  /* ================================================================ acting on it */
  const flash = t => { UI.undo = { text: t }; };
  function saveClueForm(f) {
    const x = clueOf(f.dataset.r); if (!x) return;
    const v = n => (f.elements[n] ? f.elements[n].value : "").trim(), rec = Object.assign({}, x.c);
    for (const k of ["t", "k", "sum", "pd", "kp", "d", "how", "roll", "rev", "hint", "at", "p", "notes"]) { const s = v(k); if (s) rec[k] = s; else delete rec[k]; }
    rec.to = [...f.elements.to.selectedOptions].map(o => o.value); if (!rec.to.length) delete rec.to;
    rec.tags = v("tags").split(",").map(s => s.trim()).filter(Boolean); if (!rec.tags.length) delete rec.tags;
    if (!rec.t) rec.t = x.id;
    St.putClue(x.pl, x.id, rec, { note: "written" }); flash("The clue is saved."); api.render();
  }
  function newClue(pl, rec) {
    pl = pl || ((A.order || []).find(id => A.maps[id] && !A.maps[id].alias));
    if (!pl) return null; const id = St.nextClueId(pl);
    St.putClue(pl, id, Object.assign({ t: "New clue", k: "physical" }, rec || {}), { note: "made" });
    return "clue:" + pl + "/" + id;
  }
  // to a clue's place on the map, its floor shown and its marker flashing
  function showOnMap(ref) {
    const x = clueOf(ref); if (!x) return; const X = api.ctx(), m = St.markerOf(x.pl, x.id);
    if (!m) { if (A.mapEditor) { A.clueUI.placeNext = { pl: x.pl, id: x.id }; A.mapEditor.open(x.pl); } return; }
    A.state.f[A.keyOf(x.pl)] = m.fi; if (X.setView) X.setView("gaz"); X.go(x.pl);
    setTimeout(() => { A.rerender(x.pl); const el = document.querySelector(`.lmap-sec[data-loc="${CSS.escape(x.pl)}"] .lm-stage [data-ref="${CSS.escape(x.id)}"]`); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("lm-flash"); void el.getBoundingClientRect(); el.classList.add("lm-flash"); } }, 120);
  }
  function openRef(ref) {
    const [k] = parse(ref);
    if (k === "clue") { UI.view = "clues"; UI.sel = ref; api.render(); return; }
    if (k === "cast" || k === "npc") { UI.view = "people"; UI.person = ref; api.render(); return; }
    if (k === "item") { UI.view = "items"; UI.item = ref.slice(5); api.render(); return; }
    if (k === "question") { UI.view = "loose"; api.render(); return; }
    const e = ent(ref); if (e && e.place && A.meta[e.place]) { const X = api.ctx(); if (X.setView) X.setView("gaz"); X.go(e.place); }
  }
  async function act(b) {
    const a = b.dataset.ica, r = b.dataset.r;
    switch (a) {
      case "new": { const ref = newClue(UI.f.pl); if (ref) { UI.view = "clues"; UI.sel = ref; flash("A new clue, without a marker yet: name it, then place it on the map."); } break; }
      case "auto": return autoConnect(r);
      case "follow": return followUp(r);
      case "map": return showOnMap(r);
      case "dup": { const x = clueOf(r); if (!x) break; const ref = newClue(x.pl, Object.assign({}, x.c, { t: (x.c.t || x.id) + " (copy)" })); UI.sel = ref; flash("A copy, without a marker yet."); break; }
      case "arch": { const x = clueOf(r); if (!x) break; const rec = Object.assign({}, x.c); if (rec.arch) delete rec.arch; else rec.arch = 1; St.putClue(x.pl, x.id, rec, { note: rec.arch ? "archived" : "brought back" }); flash(rec.arch ? "Archived: off the map and the lists, kept here." : "Brought back."); break; }
      case "del": { if (UI.sure !== "del" + r) { UI.sure = "del" + r; break; } UI.sure = ""; const x = clueOf(r); if (!x) break; St.putClue(x.pl, x.id, null, { note: "deleted" }); UI.sel = null; flash("Deleted. Its connections stay, marked as pointing nowhere; History can bring it back."); break; }
      case "undo": St.undo(b.dataset.g); flash("Undone."); break;
      case "undobatch": { const n = St.undoBatch(b.dataset.b); UI.undo = { text: `Undid ${n} change${n === 1 ? "" : "s"}.` }; break; }
      case "toastx": UI.undo = null; break;
      case "revx": UI.review = null; break;
      case "revsave": return saveReview(false);
      case "revall": return saveReview(true);
      case "folx": UI.follow = null; break;
      case "foladd": { const F = UI.follow, d = F && F.list[+b.dataset.i]; if (!d) break; const sel = document.querySelector(`[data-icfol="pl"][data-i="${b.dataset.i}"]`), pl = sel ? sel.value : clueOf(F.ref).pl, batch = St.uid("B");
        const ref = newClue(pl, { t: d.t, k: d.k, pd: d.pd, kp: d.kp, how: d.how, rev: d.rev });
        St.link(F.ref, ref, d.route === "alternative" ? "confirms" : "leads to", { why: d.why, cert: "hypothesis" }, { src: "ai", batch, note: "Next clue: " + d.t });
        F.list.splice(+b.dataset.i, 1); UI.undo = { text: `Added "${d.t}" at ${(A.meta[pl] || {}).name || pl}, without a marker.`, batch }; break; }
      case "newitem": case "idea": { UI.view = "items"; UI.item = null; UI.itemSeed = a === "idea" ? (UI.review || {}).ideas[+b.dataset.i] : ""; UI.itemFor = r; break; }
      case "lshow": { const l = St.links()[b.dataset.id]; if (l) St.put("links", b.dataset.id, Object.assign({}, l, { shown: !l.shown }), { note: l.shown ? "taken down from the players' board" : "pinned up for the players" }); break; }
      case "ledit": UI.ledit = b.dataset.id; break;
      case "lcancel": UI.ledit = null; break;
      case "ldel": St.put("links", b.dataset.id, null, { note: "removed" }); flash("The connection is removed. History can bring it back."); break;
      case "kedit": UI.kedit = { who: b.dataset.who, id: b.dataset.id }; break;
      case "kcancel": UI.kedit = null; break;
      case "kdel": St.put("knowledge", b.dataset.id, null, { note: "removed" }); break;
      case "qdel": St.put("questions", b.dataset.id, null, { note: "removed" }); break;
      case "iedit": UI.item = b.dataset.id; break;
      case "icancel": UI.item = null; break;
      case "idel": St.put("items", b.dataset.id, null, { note: "removed" }); UI.item = null; break;
    }
    api.render();
  }
  function onSubmit(f) {
    const v = n => (f.elements[n] ? f.elements[n].value : "").trim(), rel = () => v("rel") === "__own" ? (v("own") || "relates to").toLowerCase().slice(0, 40) : v("rel");
    switch (f.dataset.icform) {
      case "clue": return saveClueForm(f);
      case "link": { if (!v("to")) return; St.link(f.dataset.r, v("to"), rel(), { why: v("why") }, { src: "dm", note: "joined by hand" }); flash("Joined. Suggestions never replace a connection you make."); break; }
      case "ledit": { const l = St.links()[f.dataset.id]; if (!l) break; St.put("links", f.dataset.id, Object.assign({}, l, { rel: rel(), why: v("why"), src: "dm" }), { note: "changed by hand" }); UI.ledit = null; break; }
      case "kquick": { if (!v("who")) return; St.know({ who: v("who"), about: f.dataset.r, text: St.name(f.dataset.r), type: v("type"), how: v("how"), share: v("share"), rel: v("type") === "false" ? "false" : "reliable" }, { note: "recorded" }); break; }
      case "know": { const rec = { who: f.dataset.who, about: v("about"), text: v("text"), type: v("type"), how: v("how"), from: v("from"), when: v("when"), rel: v("rel"), share: v("share"), why: v("why") }; if (!rec.about && !rec.text) return; if (f.dataset.id) { const old = St.knowledge()[f.dataset.id] || {}; St.put("knowledge", f.dataset.id, Object.assign({}, old, rec, { src: "dm" }), { note: rec.type === "false" && old.type !== "false" ? "now a false belief" : old.type === "false" && rec.type !== "false" ? "a false belief corrected" : "changed" }); } else St.know(rec, { note: "recorded" }); UI.kedit = null; break; }
      case "tell": { if (!v("to") || !v("k")) return; St.tell(v("from"), v("to"), v("k"), { when: v("when") }); flash(`Recorded: ${St.name(v("to"))} now knows it, at second hand.`); break; }
      case "speak": { if (!v("q")) return; return speak(f.dataset.who, v("q"), v("ev")); }
      case "q": { if (!v("text")) return; St.put("questions", St.uid("Q"), { text: v("text"), state: "open", about: [] }, { note: "asked" }); break; }
      case "item": { const rec = { kind: v("kind"), n: v("n"), d: v("d"), when: v("when") }; if (!rec.n) return; const id = f.dataset.id || St.uid("I"); St.put("items", id, Object.assign({}, St.items()[id] || {}, rec, { src: "dm" }), { note: f.dataset.id ? "changed" : "made" }); if (!f.dataset.id && UI.itemFor) { St.link(UI.itemFor, "item:" + id, "helps solve", {}, { note: "joined to its new element" }); UI.itemFor = null; } UI.item = null; UI.itemSeed = ""; break; }
    }
    api.render();
  }

  /* ---- the tab registered with "At the table" */
  A.tableUI.addTab({
    key: "clues", label: "Investigation", icon: "clue", group: "play", after: "board", desc: "Clues, what joins them, who knows what",
    html: () => { const h = html(); return UI.itemSeed && UI.view === "items" ? h.replace('name="d" rows="3" maxlength="1500">', 'name="d" rows="3" maxlength="1500">' + esc(UI.itemSeed)) : h; },
    status: () => { const all = St.allClues(), found = all.filter(c => St.found(c.pl, c.id)).length, w = St.warnings().length; return `${all.length} clues · ${found} found${w ? ` · ${w} loose end${w > 1 ? "s" : ""}` : ""}`; },
    bind(body) {
      body.querySelectorAll(".ic-web .bd-card").forEach(c => { c.style.cursor = "pointer"; });
      body.querySelectorAll('select[name="rel"]').forEach(s => s.addEventListener("change", () => { const own = s.parentElement.querySelector('[name="own"]'); if (own) own.hidden = s.value !== "__own"; }));
    },
    init(S, ctx) {
      St.on(meta => { if (api.tab() === "clues" && document.getElementById("tvBody")) { if (meta === "remote") api.refresh(["clues"]); } });
      document.addEventListener("click", e => {
        const t = e.target; if (!t.closest) return;
        const o = t.closest("[data-ic]"); if (o) { const [pl, id] = o.dataset.ic.split("/"); UI.view = "clues"; UI.sel = "clue:" + pl + "/" + id; api.open("clues"); return; }
        if (!t.closest(".inv")) return;
        const b = t.closest("[data-ica]"); if (b) { e.preventDefault(); act(b); return; }
        const v = t.closest("[data-icv]"); if (v) { UI.view = v.dataset.icv; UI.sure = ""; api.render(); return; }
        const s = t.closest("[data-icsel]"); if (s) { UI.sel = s.dataset.icsel; UI.review = UI.review && UI.review.ref === UI.sel ? UI.review : null; UI.sure = ""; api.render(); return; }
        const p = t.closest("[data-icperson]"); if (p) { UI.person = p.dataset.icperson; UI.speak = null; UI.kedit = null; api.render(); return; }
        const g = t.closest("[data-icgo]"); if (g) { openRef(g.dataset.icgo); return; }
        const card = t.closest(".ic-web .bd-card"); if (card) { openRef(card.dataset.bd); return; }
      });
      document.addEventListener("submit", e => { const f = e.target; if (!f.matches || !f.matches(".inv [data-icform]")) return; e.preventDefault(); onSubmit(f); });
      document.addEventListener("change", e => {
        const t = e.target; if (!t.closest || !t.closest(".inv")) return;
        if (t.dataset.icf) { if (t.dataset.icf === "arch") UI.f.arch = t.checked; else if (t.dataset.icf !== "q") UI.f[t.dataset.icf] = t.value; UI.sel = null; api.render(); return; }
        if (t.dataset.icstat) { const x = clueOf(t.dataset.icstat); if (x) St.setStatus(x.pl, x.id, t.value); return; }
        if (t.dataset.icq) { const q = St.questions()[t.dataset.icq]; if (q) St.put("questions", t.dataset.icq, Object.assign({}, q, { state: t.value }), { note: "now " + label(St.QSTATE, t.value) }); api.render(); return; }
        if (t.dataset.icrev && UI.review) { const i = +t.dataset.i, R = UI.review; if (t.dataset.icrev === "on") R.list[i].on = t.checked; else if (t.dataset.icrev === "rel") R.list[i].rel = t.value; else if (t.dataset.icrev === "pon") R.people[i].on = t.checked; else if (t.dataset.icrev === "con") R.contra[i].on = t.checked; else if (t.dataset.icrev === "qon") R.questions[i].on = t.checked; return; }
      });
      document.addEventListener("input", e => {
        const t = e.target; if (!t.closest || !t.closest(".inv")) return;
        if (t.dataset.icf === "q") { UI.q = t.value; clearTimeout(UI.qt); UI.qt = setTimeout(() => { const pos = t.selectionStart; api.render(); const n = document.querySelector('.inv [data-icf="q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 250); return; }
        if (t.dataset.icrev === "why" && UI.review) UI.review.list[+t.dataset.i].why = t.value;
      });
    }
  });

  /* ================================================================ the map editor's Clues tool */
  if (A.mapEditor && A.mapEditor.plug) {
    let ed = null;   // the editor's api
    const E = () => ed.E, F = () => ed.cur(), C = A.C;
    const cl = () => E().cl;
    const markerHit = (x, y) => { const M0 = F().M || []; for (let i = M0.length - 1; i >= 0; i--) { const m = M0[i]; if (A.dirOf(m[0]) === "clues" && Math.hypot(m[1] - x, m[2] - y) < .5) return i; } return -1; };
    const roomAt = (x, y) => { const R = F().R || []; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (/^R\d/.test(r[0]) && x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4]) return r[0]; } return ""; };
    // a furnishing under the pointer (the model library, atlas-models.js): a clue can be on it
    const propAt = (x, y) => {
      const M = A.models, sq = M ? M.sq() : 1.524; let best = null;
      for (const p of F().P || []) { const e = M && M.entry(p.a); if (!e) continue; const [w, d] = M.dims(e, p), s = p.s || 1, a = -(p.r || 0) * Math.PI / 180, dx = x - p.x, dy = y - p.y, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(lx) <= w * s / sq / 2 && Math.abs(ly) <= d * s / sq / 2) best = { p, e }; }
      // or the furniture drawn with the map, which the 3D view raises as the same models (atlas-room3d.js)
      if (!best && M && A.room3d) { const f = ed.finished(F()); for (const it of f.I || []) { const [, ix, iy, w = 1, h = 1] = it; if (x > ix && x < ix + w && y > iy && y < iy + h) { const r = A.room3d.raise(it, f), e = r && M.entry(r[0].a); if (e) best = { p: { a: r[0].a, x: ix + w / 2, y: iy + h / 2 }, e }; } } }
      return best;
    };
    const recOf = id => cl().recs[id] || St.clue(E().id, id) || { t: id };
    const ids = () => { const out = []; for (const G of E().draft.floors) for (const m of G.M || []) out.push(m[0]); return out.concat(Object.keys(cl().recs)); };
    function place(x, y, id0) {
      const pl = E().id, id = id0 || St.nextClueId(pl, ids()), hit = propAt(x, y), at = roomAt(x, y);
      const px = hit ? hit.p.x : Math.round(x * 4) / 4, py = hit ? hit.p.y : Math.round(y * 4) / 4;
      ed.change(() => { const M0 = F().M = F().M || []; const k = M0.findIndex(m => m[0] === id); if (k >= 0) M0.splice(k, 1); E().draft.floors.forEach(G => { G.M = (G.M || []).filter(m => m[0] !== id); }); F().M.push([id, px, py]); });
      if (!id0) cl().recs[id] = Object.assign({ t: hit ? "Something on the " + hit.e.n.toLowerCase() : "New clue", k: hit ? "object" : "physical" }, at ? { at } : {}, hit ? { p: "on the " + hit.e.n.toLowerCase(), on: hit.p.a } : {});
      else if (at && !recOf(id).at) cl().recs[id] = Object.assign({}, recOf(id), { at });
      cl().sel = id; E().dirty = true; ed.paint();
      setTimeout(() => { const n = document.querySelector('#meSide [data-cle="t"]'); if (n && !id0) { n.focus(); n.select(); } }, 30);
    }
    function side() {
      if (E().tool !== "clues") return "";
      const pl = E().id, sel = cl().sel, here = (F().M || []).filter(m => A.dirOf(m[0]) === "clues");
      const pending = A.clueUI.placeNext && A.clueUI.placeNext.pl === pl ? A.clueUI.placeNext.id : "";
      let h = `<section class="me-clue"><h4>${T.icon("clue")} Clues on this floor</h4>`;
      if (pending) h += `<p class="ic-warn">Click the map where ${esc(recOf(pending).t || pending)} lies.</p>`;
      if (sel) {
        const c = recOf(sel);
        h += `<div class="me-cl-ed" data-cl="${esc(sel)}"><label class="me-f"><span>Name</span><input data-cle="t" value="${esc(c.t || "")}" maxlength="120"></label>
          <label class="me-f"><span>Kind</span><select data-cle="k">${opt(St.TYPES.map(t => [t[0], t[1]]), c.k || "", "Not set")}</select></label>
          <label class="me-f"><span>What the players see</span><textarea data-cle="pd" rows="2" maxlength="1500">${esc(c.pd || "")}</textarea></label>
          <label class="me-f"><span>Only you know</span><textarea data-cle="kp" rows="2" maxlength="1500">${esc(c.kp || "")}</textarea></label>
          <label class="me-f"><span>Exactly where</span><input data-cle="p" value="${esc(c.p || "")}" maxlength="120"></label>
          <div class="me-row"><button type="button" class="prim" data-clx="auto">${T.icon("spark")} Auto-Connect to Story</button></div>
          <p class="me-help">Saves the map, then opens the clue in the investigation with its suggestions. Everything else about it (how it is found, what it reveals, where it leads) is there too.</p>
          <div class="me-row"><button type="button" data-clx="dup">Duplicate</button><button type="button" class="me-del" data-clx="del">Take it away</button></div></div>`;
      } else h += `<p class="me-help">Click the map to put a clue there (on a piece of furniture, it lies on it). Click a clue's marker to choose it; drag it to move it.</p>`;
      h += here.length ? `<div class="me-cl-list">${here.map(m => { const c = recOf(m[0]); return `<button type="button" data-clsel="${esc(m[0])}" aria-pressed="${m[0] === sel}">${glyph(c.k)} ${esc(m[0])} ${esc(c.t || "")}</button>`; }).join("")}</div>` : "";
      h += `<label class="me-ck"><input type="checkbox" data-clx="hide"${E().hideClues ? " checked" : ""}> Hide the clue markers while I work</label></section>`;
      return h;
    }
    A.mapEditor.plug({
      tools: [["clues", "Clues", "Click the map to put a clue there; click a clue's marker to choose it and drag it to move it."]],
      icons: { clues: `<circle cx="10" cy="10" r="5.5"/><path d="M14 14l5.5 5.5M8 10h4M10 8v4"/>` },
      open(a) { ed = a; E().cl = { recs: {}, sel: null, gone: [] }; const pn = A.clueUI.placeNext; if (pn && pn.pl === E().id) { E().tool = "clues"; } },
      // the clues written here and not yet saved are drawn as they will be
      draftMap(M) { const c = cl(); if (c && Object.keys(c.recs).length) M.clues = Object.assign({}, M.clues || {}, c.recs); },
      side,
      overlay() { const s = cl() && cl().sel, m = s && (F().M || []).find(x => x[0] === s); return m ? `<circle class="me-sel" cx="${m[1] * C}" cy="${m[2] * C}" r="14"/>` : ""; },
      down(e, p) {
        if (E().tool !== "clues" || (e.button && e.button !== 0)) return false;
        const pn = A.clueUI.placeNext; if (pn && pn.pl === E().id) { A.clueUI.placeNext = null; place(p.x, p.y, pn.id); return true; }
        const i = markerHit(p.x, p.y);
        if (i >= 0) { const m = F().M[i]; cl().sel = m[0]; cl().drag = { i, x0: p.x, y0: p.y, mx: m[1], my: m[2] }; ed.paintCanvas(); ed.paintSide(); return true; }
        place(p.x, p.y); return true;
      },
      move(e, p) {
        const d = cl() && cl().drag; if (!d || E().tool !== "clues") return false;
        const g = document.querySelector(`#meCanvas .lm-mk[data-ref="${CSS.escape(F().M[d.i][0])}"]`); if (g) g.setAttribute("transform", `translate(${(p.x - d.x0) * C} ${(p.y - d.y0) * C})`); d.moved = Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) > .1; d.x = p.x; d.y = p.y; return true;
      },
      up(e, p) {
        const d = cl() && cl().drag; if (!d || E().tool !== "clues") return false; cl().drag = null;
        if (d.moved) ed.change(() => { const m = F().M[d.i]; m[1] = Math.round((d.mx + d.x - d.x0) * 4) / 4; m[2] = Math.round((d.my + d.y - d.y0) * 4) / 4; const at = roomAt(m[1], m[2]); if (at && at !== recOf(m[0]).at) cl().recs[m[0]] = Object.assign({}, recOf(m[0]), { at }); });
        return true;
      },
      click(e) {
        const t = e.target, s = t.closest("[data-clsel]"); if (s) { cl().sel = s.dataset.clsel; ed.paintCanvas(); ed.paintSide(); return true; }
        const b = t.closest("[data-clx]"); if (!b || b.tagName === "INPUT") return false;
        const id = cl().sel;
        if (b.dataset.clx === "auto" && id) { const pl = E().id; ed.save().then(() => { UI.view = "clues"; UI.sel = "clue:" + pl + "/" + id; api.open("clues"); setTimeout(() => autoConnect(UI.sel), 50); }); return true; }
        if (b.dataset.clx === "dup" && id) { const m = (F().M || []).find(x => x[0] === id), nid = St.nextClueId(E().id, ids()); cl().recs[nid] = Object.assign({}, recOf(id), { t: (recOf(id).t || id) + " (copy)" }); ed.change(() => F().M.push([nid, m[1] + .5, m[2] + .5])); cl().sel = nid; ed.paint(); return true; }
        if (b.dataset.clx === "del" && id) { ed.change(() => { E().draft.floors.forEach(G => { G.M = (G.M || []).filter(m => m[0] !== id); }); }); delete cl().recs[id]; if (St.clue(E().id, id)) cl().gone.push(id); cl().sel = null; ed.paint(); return true; }
        return false;
      },
      change(e) {
        const t = e.target;
        if (t.dataset.clx === "hide") { E().hideClues = t.checked; ed.paintCanvas(); return true; }
        const k = t.dataset.cle; if (!k) return false;
        const id = cl().sel; if (!id) return true;
        cl().recs[id] = Object.assign({}, recOf(id), { [k]: t.value.trim() }); if (!t.value.trim()) delete cl().recs[id][k];
        E().dirty = true; ed.paintTop(); if (k === "k" || k === "t") { ed.paintCanvas(); }
        return true;
      },
      key(e) {
        if (E().tool !== "clues" || !cl().sel) return false;
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); const b = document.querySelector('#meSide [data-clx="del"]'); if (b) b.click(); return true; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") { e.preventDefault(); const b = document.querySelector('#meSide [data-clx="dup"]'); if (b) b.click(); return true; }
        return false;
      },
      cancel() { if (E().tool === "clues" && cl().sel) { cl().sel = null; ed.paintCanvas(); ed.paintSide(); return true; } return false; },
      // the clues written or placed here are kept when the map is: each a clue of the place
      save(a, edit) {
        const pl = E().id, c = cl(); if (!c) return;
        for (const [id, rec] of Object.entries(c.recs)) St.putClue(pl, id, rec, { note: "placed on the map" });
        for (const id of c.gone) St.putClue(pl, id, null, { note: "taken off the map" });
        c.recs = {}; c.gone = [];
        void edit;
      }
    });
  }
  A.clueUI = { open: ref => openRef(ref), autoConnect, placeNext: null };
})(ATLAS);
