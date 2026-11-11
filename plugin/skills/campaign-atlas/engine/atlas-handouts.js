/* ================================================================
   CAMPAIGN ATLAS: HANDOUTS, WRITTEN BY HAND
   The handout writer (the user's request of 11 Nov 2026: "I should be able to write a newspaper article myself and give
   it to the players during a session"; templates for 1920s investigations, optional; a blank page; DM-only and
   player-visible information; drafts; a preview of the players' version; printed; revealed in the session).
   A handout is drawn in the look of its kind and age as every handout of Atlas is (atlas-table.js, handoutHTML: a
   letter, a newspaper, a telegram, a diary page, a report, a recording, a book's page, a map...), with what a handout
   written here may add: formatting, a picture of one's own, a signature, a stamp, aged paper. The Keeper's notes on it
   are never drawn. A draft stays the Keeper's; a ready one is among the campaign's handouts, given to the players'
   screen when the Keeper says (and kept by them), printed with the rest. Joined to a place and a clue, it is found
   there as a clue's handout is.
   Kept in the table's store (collection "handbook") and, in the Atlas app, in the campaign's files
   (edits/0-handouts.js, read into A.handbook). The module "Handouts" (atlas-modules.js) switches it.
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined" || !A.table) return;
  const T = A.table, esc = A.esc, on = () => !A.modules || A.modules.on("handouts");
  A.handbook = A.handbook || {};   // (the campaign's files fill it first: edits/0-handouts.js, ATLAS.handbookEdit in atlas-table.js)
  const H = A.handoutWriter = {};
  let S = null;
  const KINDS = [
    ["Pages", [["page", "A blank page"], ["letter", "A letter"], ["note", "A note"], ["diary", "A diary page"], ["book", "A page of a book or manuscript"], ["scroll", "A scroll"], ["inscription", "An inscription in stone"]]],
    ["The press and the post", [["newspaper", "A newspaper article"], ["telegram", "A telegram"], ["notice", "A notice"], ["poster", "A poster"]]],
    ["Records", [["report", "A report: police, medical, scientific"], ["ledger", "A ledger, a list"], ["photo", "A photograph"], ["map", "A map"], ["recording", "A recording"]]],
    ["Screens", [["email", "An e-mail"], ["message", "Messages"], ["datapad", "A datapad"]]]
  ];
  const ERAS = [["", "The campaign's own age"], ["victorian", "Victorian"], ["1920s", "The 1920s and 30s"], ["medieval", "Medieval"], ["fantasy", "Fantasy"], ["modern", "Today"], ["future", "The future"]];
  // optional starts: the kinds a 1920s investigation hands round most, filled in to show the shape (nothing of the campaign)
  const TPL = [
    ["blank", "A blank page", { kind: "page" }],
    ["paper20", "A 1920s newspaper article", { kind: "newspaper", era: "1920s", headline: "Professor Missing", sub: "University fears for colleague last seen on Tuesday", date: "Thursday, October 7, 1926", price: "Two cents", text: "Write the article here.\n\nA second paragraph." }],
    ["letter20", "A 1920s letter", { kind: "letter", era: "1920s", date: "October 3rd, 1926", to: "My dear Harold,", text: "Write the letter here.", from: "Yours ever, E." }],
    ["tele20", "A telegram", { kind: "telegram", era: "1920s", to: "", from: "", date: "", text: "Write it as it was sent. Every full stop becomes STOP." }],
    ["police20", "A 1920s police report", { kind: "report", era: "1920s", form: "Arkham Police Department: Incident Report", date: "October 5, 1926", fields: "Officer: Sgt. \nLocation: \nReported by: \nNature of incident: ", text: "What the officer wrote.", stamp: "Filed" }],
    ["medical20", "A 1920s hospital record", { kind: "report", era: "1920s", form: "St. Mary's Hospital: Patient Record", date: "", fields: "Patient: \nAdmitted: \nAttending physician: \nCondition: ", text: "The physician's notes.", stamp: "Confidential" }],
    ["science", "A scientific report", { kind: "report", form: "Laboratory report", fields: "Sample: \nReceived: \nExamined by: ", text: "Findings." }],
    ["diary", "A diary page", { kind: "diary", date: "", text: "Write the entry." }],
    ["photo", "A photograph", { kind: "photo", caption: "", text: "Describe what it shows, or choose a picture." }],
    ["rec", "A recording", { kind: "recording", title: "", text: "What is heard on it." }]
  ];
  const FIELDS = { // which fields each kind uses besides its text
    page: ["title"], letter: ["date", "to", "from"], note: ["from"], diary: ["date"], book: ["title", "date"], scroll: ["title", "from"], inscription: ["title"],
    newspaper: ["headline", "sub", "date", "price", "paper"], telegram: ["date", "to", "from"], notice: ["title", "from"], poster: ["title", "from"],
    report: ["form", "title", "date", "fields", "from"], ledger: ["title"], photo: ["caption"], map: ["title"], recording: ["title", "date"], email: ["title", "date", "from", "to"], message: ["title", "from"], datapad: ["title", "date", "from"]
  };
  const FLABEL = { title: "Title", headline: "Headline", sub: "Beneath the headline", date: "Date", price: "Price", paper: "The paper's name (else from the city)", to: "To", from: "From, or signed", form: "The form's heading", fields: "Its fields, one a line: a name, a colon, what is filled in", caption: "Caption" };
  const opt = (list, v, none) => (none != null ? `<option value="">${esc(none)}</option>` : "") + list.map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("");
  const kindOpts = v => KINDS.map(([g, L]) => `<optgroup label="${esc(g)}">${opt(L, v)}</optgroup>`).join("");
  const label = id => { const h = A.handbook[id] || {}; return h.title || h.headline || h.caption || "Untitled"; };
  const note = t => { if (A.tableUI && A.tableUI.api) A.tableUI.api.note(t); };
  // ---- keeping them
  async function mirror() {
    if (!window.ATLAS_APP || !window.ATLAS_APP.saveHandouts) return "Saved in this campaign's page.";
    const out = {}; for (const [id, h] of Object.entries(A.handbook)) if (h && !h.off) { const r = Object.assign({}, h); delete r.t; out[id] = r; }
    try { await window.ATLAS_APP.saveHandouts(out); return "Saved into the campaign: it stays when the campaign is rebuilt."; } catch (e) { return "Saved in the page, but not into the campaign's files: " + (e.message || e); }
  }
  async function save(id, rec) {
    rec = Object.assign({ made: "hand", fmt: true }, rec, { t: Date.now() });
    A.handbook[id] = rec; if (S) S.set("handbook", id, rec); changed(); note(await mirror()); return id;
  }
  async function forget(id) { delete A.handbook[id]; if (S) S.set("handbook", id, { off: true, t: Date.now() }); changed(); await mirror(); }
  const changed = () => { if (A.state) A.state.cache = {}; document.dispatchEvent(new CustomEvent("atlas-places")); if (A.tableUI && A.tableUI.api && A.tableUI.api.tab && ["screen", "export"].includes(A.tableUI.api.tab())) A.tableUI.api.render(); };
  const newId = () => "hw-" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);

  /* ---- the writer: the form beside the players' version */
  let dlg = null, cur = null;
  function places() { return (A.order || []).filter(id => A.meta[id]).map(id => [id, A.meta[id].name || id]); }
  function cluesOf(pl) { const M = pl && A.maps[pl] && A.get(pl, 99); return M ? Object.entries(M.clues || {}).filter(([, c]) => c && !c.arch).map(([k, c]) => [k, c.t || k]) : []; }
  function form() {
    const r = cur.rec, k = r.kind || "page", fl = FIELDS[k] || ["title"];
    const fld = n => n === "fields" ? `<label>${esc(FLABEL[n])}<textarea class="t-in" name="fields" rows="4" maxlength="3000">${esc(r.fields || "")}</textarea></label>` : `<label>${esc(FLABEL[n] || n)}<input class="t-in" name="${n}" value="${esc(r[n] || "")}" maxlength="200"></label>`;
    return `<form class="hw-form" method="dialog">
      <div class="loc-head"><h3>${cur.id ? "The handout" : "A handout of your own"}</h3><button type="button" class="t-btn" data-hw="x" aria-label="Close">Close</button></div>
      <div class="hw-split"><div class="hw-left">
        ${cur.id ? "" : `<label>To start with<select class="t-in" name="tpl">${opt(TPL.map(t => [t[0], t[1]]), cur.tpl || "blank")}</select></label>`}
        <div class="loc-g2"><label>What it is<select class="t-in" name="kind">${kindOpts(k)}</select></label><label>Its look<select class="t-in" name="era">${opt(ERAS, r.era || "")}</select></label></div>
        <div class="hw-fl">${fl.map(fld).join("")}</div>
        <label>${k === "ledger" ? "Its lines (columns divided by |)" : k === "message" ? "The messages, one a line: who, a colon, what they wrote" : k === "photo" || k === "map" ? "What it shows (if there is no picture)" : "The text"} <span class="kn">**bold**, *italic*, _underlined_, # a heading, --- a rule</span><textarea class="t-in" name="text" rows="9" maxlength="20000">${esc(r.text || "")}</textarea></label>
        <details class="loc-more"${r.img || r.sig || r.stamp || r.aged || r.audio ? " open" : ""}><summary>A picture, a signature, a stamp</summary>
          <div class="hw-pic">${r.img ? `<img src="${esc(r.img)}" alt="">` : ""}<label class="t-btn">${r.img ? "Another picture" : "A picture"}<input type="file" accept="image/*" data-hw="img" hidden></label>${r.img ? `<button type="button" class="t-mini" data-hw="noimg">No picture</button>` : ""}</div>
          ${k === "recording" ? `<div class="hw-pic">${r.audio ? `<audio controls src="${esc(r.audio)}"></audio>` : ""}<label class="t-btn">${r.audio ? "Another sound file" : "The sound file"}<input type="file" accept="audio/*" data-hw="audio" hidden></label></div>` : ""}
          <div class="loc-g2"><label>A signature<input class="t-in" name="sig" value="${esc(r.sig || "")}" maxlength="80" placeholder="H. Armitage"></label><label>A stamp<input class="t-in" name="stamp" value="${esc(r.stamp || "")}" maxlength="40" placeholder="Confidential"></label></div>
          <label class="loc-ck"><input type="checkbox" name="aged"${r.aged ? " checked" : ""}> Aged paper: yellowed, stained</label></details>
        <details class="loc-more"${r.place || r.notes ? " open" : ""}><summary>Where it is found, and your notes</summary>
          <div class="loc-g2"><label>Found at<select class="t-in" name="place">${opt(places(), r.place || "", "Nowhere in particular")}</select></label><label>With the clue<select class="t-in" name="clue">${opt(cluesOf(r.place), r.clue || "", "No clue")}</select></label></div>
          <label>Your notes: only you see them, never the players<textarea class="t-in" name="notes" rows="2" maxlength="3000">${esc(r.notes || "")}</textarea></label></details>
        <label class="loc-ck"><input type="checkbox" name="ready"${r.state === "draft" ? "" : " checked"}> Ready: among the campaign's handouts, to give to the players (unticked, it is a draft only you see)</label>
        <div class="loc-ai" data-ai-help><span class="kl">Optional help</span><button type="button" class="t-btn" data-hw="ai">Help me write it</button><span class="hw-aimsg t-small" aria-live="polite"></span></div>
      </div>
      <div class="hw-right"><div class="kn">What the players see</div><div class="hw-prev">${T.handoutHTML(playerView(r))}</div></div></div>
      <div class="loc-go"><button type="button" class="t-btn prim" data-hw="save">Save</button>${cur.id && A.handbook[cur.id] && A.handbook[cur.id].state !== "draft" ? `<button type="button" class="t-btn" data-hw="give">Give to the players</button>${A.tableUI && A.tableUI.onlyTo ? A.tableUI.onlyTo(cur.id) : ""}<button type="button" class="t-btn" data-t="hprint" data-id="${esc(cur.id)}">Print</button>` : ""}${cur.id ? `<button type="button" class="t-btn" data-hw="lib">Keep in my library</button><button type="button" class="t-btn ic-del" data-hw="del">Remove</button>` : ""}<button type="button" class="t-btn" data-hw="x">Cancel</button></div>
    </form>`;
  }
  // the players' version: everything but the Keeper's notes
  const playerView = r => { const o = Object.assign({ fmt: true }, r); delete o.notes; return o; };
  function read() {
    const f = dlg.querySelector("form"), v = n => (f.elements[n] ? f.elements[n].value : ""), r = Object.assign({}, cur.rec);
    r.kind = v("kind") || "page"; r.era = v("era") || undefined;
    for (const n of ["title", "headline", "sub", "date", "price", "paper", "to", "from", "form", "fields", "caption", "text", "sig", "stamp", "notes", "place", "clue"]) { if (!f.elements[n]) continue; const s = v(n); if (s.trim()) r[n] = s; else delete r[n]; }
    r.aged = !!(f.elements.aged && f.elements.aged.checked); if (!r.aged) delete r.aged;
    r.state = f.elements.ready && f.elements.ready.checked ? "ready" : "draft";
    if (!r.era) delete r.era;
    return r;
  }
  function paint() { const y = dlg.scrollTop; dlg.innerHTML = form(); dlg.scrollTop = y; }
  H.open = (id, seed) => {
    if (!on()) return;
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "hwDlg"; dlg.className = "loc-dlg hw-dlg"; document.body.appendChild(dlg);
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("input", () => { cur.rec = read(); const p = dlg.querySelector(".hw-prev"); if (p) p.innerHTML = T.handoutHTML(playerView(cur.rec)); });
      dlg.addEventListener("change", e => {
        const n = e.target.name;
        if (n === "tpl") { const t = TPL.find(x => x[0] === e.target.value); cur.tpl = e.target.value; cur.rec = Object.assign({}, JSON.parse(JSON.stringify(t ? t[2] : {})), { state: cur.rec.state }); paint(); return; }
        if (n === "kind" || n === "place") { cur.rec = read(); if (n === "place") delete cur.rec.clue; paint(); return; }
        if (e.target.dataset && e.target.dataset.hw === "img" && e.target.files[0]) picture(e.target.files[0]);
        if (e.target.dataset && e.target.dataset.hw === "audio" && e.target.files[0]) sound(e.target.files[0]);
      });
    }
    cur = { id: id || null, rec: id && A.handbook[id] ? JSON.parse(JSON.stringify(A.handbook[id])) : Object.assign({ kind: "page" }, seed || {}), tpl: "blank" };
    paint(); if (!dlg.open) dlg.showModal();
  };
  function picture(file) {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); cur.rec = read(); cur.rec.img = c.toDataURL("image/jpeg", .84); paint(); };
    img.onerror = () => note("That file could not be read as a picture."); img.src = url;
  }
  function sound(file) {
    if (file.size > 8e6) { note("That sound file is over 8 MB: shorten it, or use a smaller file."); return; }
    const fr = new FileReader(); fr.onload = () => { cur.rec = read(); cur.rec.audio = String(fr.result); paint(); }; fr.readAsDataURL(file);
  }
  async function onClick(e) {
    const b = e.target.closest("[data-hw]"); if (!b) return; const a = b.dataset.hw;
    if (a === "x") { dlg.close(); return; }
    if (a === "img" || a === "audio") return;
    if (a === "noimg") { cur.rec = read(); delete cur.rec.img; paint(); return; }
    if (a === "ai") return help(b);
    if (a === "save") { const r = read(); const id = cur.id || newId(); cur.id = id; await save(id, r); paint(); return; }
    if (a === "give") { const id = cur.id; if (A.tableUI) A.tableUI.api.show({ kind: "handout", id }); note(`"${label(id)}" is on the players' screen, and theirs to keep.`); return; }
    if (a === "del") { const id = cur.id; A.tableUI.twice(b, async () => { dlg.close(); await forget(id); note("Removed. A copy the players were given stays theirs."); }); return; }
    if (a === "lib") { const h = A.handbook[cur.id]; if (h && A.myLibrary) { const d = JSON.parse(JSON.stringify(h)); delete d.place; delete d.clue; A.myLibrary.save({ kind: "handout", name: label(cur.id), say: (KINDS.flatMap(g => g[1]).find(x => x[0] === h.kind) || [0, ""])[1], data: d }).then(() => note("Kept in your library."), x => note(x.message)); } }
  }
  // Claude, when asked: a text for it, put in the box, to change; nothing is kept until Save
  async function help(btn) {
    const msg = dlg.querySelector(".hw-aimsg"), ask = A.tableUI && A.tableUI.api && A.tableUI.api.askRaw, r = read();
    if (!ask) { msg.textContent = "Help needs Claude: on claude.ai, or in the Atlas app."; return; }
    const cfg = A.config || {}, kind = (KINDS.flatMap(g => g[1]).find(x => x[0] === r.kind) || [0, "a handout"])[1];
    const prompt = `A tabletop roleplaying campaign: "${cfg.title || ""}" (${[cfg.system, cfg.setting].filter(Boolean).join(", ")}). The game master is writing a handout for the players: ${kind.toLowerCase()}${r.title || r.headline ? `, "${r.title || r.headline}"` : ""}. What they have so far:\n${r.text || "(nothing yet)"}\n${r.notes ? "Their own notes (do not reveal anything here the players should not read): " + r.notes + "\n" : ""}Write the text of the handout in the voice and period of the campaign, about 120 to 220 words, ready to hand to the players. Use only what is given; invent no names of the campaign's people or places that are not given; keep any secret in the notes out of it. Answer with the text alone.`;
    btn.disabled = true; msg.textContent = "Asking Claude…";
    let t = null; try { t = await ask(prompt, null, null, { kind: "writing", what: "a handout", uses: ["what you wrote"] }); } catch (e) { t = null; }
    btn.disabled = false;
    if (!t) { msg.textContent = "Claude could not answer just now. Write it yourself, or try again."; return; }
    const f = dlg.querySelector("form"); f.elements.text.value = String(t).trim().slice(0, 20000); cur.rec = read(); dlg.querySelector(".hw-prev").innerHTML = T.handoutHTML(playerView(cur.rec));
    msg.textContent = "Written in the box: change anything. Nothing is kept until you save.";
  }
  H.list = () => Object.entries(A.handbook).filter(([, h]) => h && !h.off).map(([id, h]) => ({ id, title: label(id), kind: h.kind, state: h.state || "ready", place: h.place || "" }));
  H.fromLibrary = it => save(newId(), Object.assign(JSON.parse(JSON.stringify(it.data || {})), { state: "draft" }));
  H.init = store => {
    S = store; const all = S.get("handbook") || {};
    for (const [id, h] of Object.entries(all)) { if (!h || h.off) delete A.handbook[id]; else A.handbook[id] = h; }
    if (S.watch) S.watch("handbook", docs => { for (const [id, h] of Object.entries(docs || {})) { if (!h || h.off) delete A.handbook[id]; else A.handbook[id] = h; } changed(); });
  };
})(typeof ATLAS !== "undefined" ? ATLAS : {});
