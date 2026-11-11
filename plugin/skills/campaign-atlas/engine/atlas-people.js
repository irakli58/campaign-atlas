/* ================================================================
   CAMPAIGN ATLAS: PEOPLE, BY HAND
   A person of the campaign made or changed on its page (the user's request of 11 Nov 2026 for handmade campaigns: "I
   want to be able to create every NPC myself ... All fields should be optional unless technically necessary. For
   example, I might create: Arthur Blackwood, Occupation: Private Investigator, Location: Arkham, Secret: Knows what
   happened at the abandoned mansion. That's enough to create the character.").
   A person made here is one of the campaign's cast (A.castData, as campaign.js's ATLAS.cast gives it), so everything
   that knows the cast knows them: their card, what they know and how they came to know it (the investigation,
   atlas-story.js), Talk, the board, the factions and their days, the players' screen when their face is shown. Where
   the game master puts them (a place, a room), they stand on its map and in its People here. Nothing is invented for
   them: Claude suggests only when asked, and what it suggests is shown, field by field, to take or leave.
   Kept in the table's store (collection "people") and, in the Atlas app, in the campaign's files (edits/0-people.js, an
   ATLAS.cast of its own), so a rebuild keeps them. A cast member the council wrote may be changed here too: the change is
   kept the same way and laid over what campaign.js says. Part of "Writing the story by hand" (atlas-modules.js).
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined") return;
  const esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]));
  const on = () => !A.modules || A.modules.on("storyedit");
  const P = A.people = {};
  let S = null;
  // [field, label, rows (0: one line), placeholder, group]
  const F = [
    ["n", "Name", 0, "Arthur Blackwood", "who"], ["role", "Occupation, or who they are", 0, "Private investigator", "who"], ["age", "Age", 0, "about fifty", "who"],
    ["look", "How they look", 2, "Tall, grey at the temples, a coat too thin for the weather", "about"], ["manner", "Personality: how they act", 2, "Polite to a fault; watches the door", "about"],
    ["voice", "How they talk", 1, "Slow, Boston vowels, never swears", "about"], ["bg", "Background", 3, "", "about"],
    ["want", "What they want", 2, "", "drive"], ["goals", "Their goals", 2, "", "drive"], ["fears", "What they fear", 1, "", "drive"],
    ["secret", "Their secret", 2, "Knows what happened at the abandoned mansion", "secret"], ["lie", "The lie they tell", 1, "", "secret"], ["press", "What makes them talk", 1, "", "secret"],
    ["items", "What they carry, what they own", 2, "", "more"], ["notes", "Notes for playing them: lines, habits, tells", 2, "", "more"], ["statsText", "Game statistics", 3, "STR 60 CON 55 ... Sanity 45", "more"],
    ["attrs", "Attributes of your own: one a line, a name, a colon, its value", 2, "Rank: Sergeant\nOwes money to: the Castellanos", "more"]
  ];
  const GROUPS = [["who", "Who they are"], ["about", "What they are like"], ["drive", "What drives them"], ["secret", "What they hide"], ["more", "Belongings, notes, statistics"]];
  const FILE = {};   // what the campaign's files say of each, before the page changed it
  // ---- the people as the page has them: laid over the cast
  function apply(id, rec) {
    if (!A.castData) A.castData = {};
    if (!(id in FILE)) FILE[id] = A.castData[id] ? JSON.parse(JSON.stringify(A.castData[id])) : null;
    if (!rec || rec.off) { if (FILE[id]) A.castData[id] = JSON.parse(JSON.stringify(FILE[id])); else delete A.castData[id]; }
    else { const r = Object.assign({}, rec); delete r.t; A.castData[id] = r; }
    if (A.story) A.story._ents = null; if (A.state) A.state.cache = {};
  }
  function loadAll() { const all = (S && S.get("people")) || {}; for (const [id, rec] of Object.entries(all)) apply(id, rec); }
  // where they stand: a person put in a place (and a room) is one of its people, on its map
  const ov0 = A.overlay;
  const OV = new WeakMap(); let VER = 1;
  A.overlay = (k, M) => {
    const M1 = ov0 ? ov0(k, M) : M; if (!M1) return M1;
    const here = Object.entries(A.castData || {}).filter(([, c]) => c && c.at && c.at.pl === k); if (!here.length) return M1;
    const c = OV.get(M1); if (c && c.v === VER) return c.M;
    const npcs = Object.assign({}, M1.npcs || {}), has = new Set(Object.values(npcs).map(n => n && n.who).filter(Boolean));
    for (const [id, p] of here) if (!has.has(id)) npcs["H-" + id] = { who: id, at: p.at.room || undefined, doing: p.at.doing || undefined };
    const out = Object.assign({}, M1, { npcs }); OV.set(M1, { v: VER, M: out }); return out;
  };
  const bump = () => { VER++; if (A.story) A.story._ents = null; if (A.state) A.state.cache = {}; };
  // ---- keeping them
  const slug = s => String(s || "person").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 24) || "person";
  const newId = n => { let id; do id = "h-" + slug(n) + "-" + Math.random().toString(36).slice(2, 5); while ((A.castData || {})[id]); return id; };
  async function mirror() {
    if (!window.ATLAS_APP || !window.ATLAS_APP.savePeople) return "Saved in this campaign's page.";
    const out = {}; for (const [id, rec] of Object.entries((S && S.get("people")) || {})) if (rec && !rec.off) { const r = Object.assign({}, rec); delete r.t; out[id] = r; }
    try { await window.ATLAS_APP.savePeople(out); return "Saved into the campaign: it stays when the campaign is rebuilt."; } catch (e) { return "Saved in the page, but not into the campaign's files: " + (e.message || e); }
  }
  async function save(id, rec) {
    rec = Object.assign({}, rec, { t: Date.now() }); if (!rec.n) rec.n = "Someone";
    if (!FILE[id] && !(A.castData || {})[id]) rec.made = "hand";
    if (S) S.set("people", id, rec); apply(id, rec); bump(); changed();
    const w = await mirror(); note(w); return id;
  }
  async function forget(id) {
    if (S) S.set("people", id, { off: true, t: Date.now() }); apply(id, null); bump(); changed();
    note(FILE[id] ? "Back to what the campaign's files say of them." : "Taken away. What they knew stays in the record, unattached."); await mirror();
  }
  const changed = () => { document.dispatchEvent(new CustomEvent("atlas-places")); document.dispatchEvent(new CustomEvent("atlas-story", { detail: { note: "people" } })); };
  const note = t => { if (A.tableUI && A.tableUI.api) A.tableUI.api.note(t); };

  /* ---- the editor: a dialog, only the name asked for */
  let dlg = null, cur = null;
  const val = (r, k) => k === "attrs" ? Object.entries(r.attrs || {}).map(([a, b]) => a + ": " + b).join("\n") : k === "items" && Array.isArray(r.items) ? r.items.join("\n") : r[k] == null ? "" : String(r[k]);
  const opt = (list, v, none) => (none != null ? `<option value="">${esc(none)}</option>` : "") + list.map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("");
  function roomsOf(pl) {
    const M = pl && A.maps[pl] && A.get(pl, 99); if (!M) return [];
    const out = []; (M.floors || []).forEach(Fl => (Fl.R || []).forEach(r => { if (A.isRoom && !A.isRoom(r[0])) return; out.push([r[0], ((A.nameOf ? A.nameOf(M, r[0]) : "") || r[0]) + ((M.floors || []).length > 1 ? " (" + (Fl.n || "") + ")" : "")]); }));
    return out;
  }
  function factionOpts() {
    const L = Object.entries(A.factionsData || {}).map(([id, f]) => [id, f.n || f.name || id]);
    if (A.story && A.story.items) for (const [id, it] of Object.entries(A.story.items())) if (it.kind === "faction") L.push(["item:" + id, it.n || id]);
    return L;
  }
  function form(id, r) {
    const places = (A.order || []).filter(pl => A.meta[pl]).map(pl => [pl, A.meta[pl].name || pl]), at = r.at || {}, facs = factionOpts(), my = [].concat(r.factions || [])[0] || "";
    const field = ([k, l, rows, ph]) => rows ? `<label>${esc(l)}<textarea class="t-in" name="${k}" rows="${rows}" maxlength="4000" placeholder="${esc(ph)}">${esc(val(r, k))}</textarea></label>` : `<label>${esc(l)}<input class="t-in" name="${k}" value="${esc(val(r, k))}" maxlength="160" placeholder="${esc(ph)}"${k === "n" ? " required" : ""}></label>`;
    const known = id && A.story && A.story.knowledgeOf ? A.story.knowledgeOf("cast:" + id).length : 0;
    return `<form class="pp-form" method="dialog">
      <div class="loc-head"><h3>${id ? esc(r.n || "A person") : "A person of your own"}</h3><button type="button" class="t-btn" data-pp="x" aria-label="Close">Close</button></div>
      ${id ? "" : `<p class="t-small">A name is all they need. Everything else is for when you know it, and can be changed whenever you like.</p>`}
      <div class="pp-top"><div class="pp-face">${r.img ? `<img src="${esc(r.img)}" alt="">` : `<span>No picture</span>`}<label class="t-btn">${r.img ? "Another picture" : "A picture"}<input type="file" accept="image/*" data-pp="img" hidden></label>${r.img ? `<button type="button" class="t-mini" data-pp="noimg">No picture</button>` : ""}</div>
        <div class="pp-who">${F.filter(f => f[4] === "who").map(field).join("")}
          <div class="loc-g2"><label>Where they are<select class="t-in" name="pl">${opt(places, at.pl || "", "Nowhere in particular")}</select></label><label>The room<select class="t-in" name="room">${opt(roomsOf(at.pl), at.room || "", "Not in a room")}</select></label></div>
          <label>Faction<select class="t-in" name="faction">${opt(facs, my, "None")}</select></label></div></div>
      ${GROUPS.slice(1).map(([g, gl]) => `<details class="loc-more"${F.some(f => f[4] === g && val(r, f[0])) ? " open" : ""}><summary>${esc(gl)}</summary>${F.filter(f => f[4] === g).map(field).join("")}</details>`).join("")}
      ${id ? `<p class="t-small">What they know, believe wrongly, hide or will not tell: ${known ? known + " thing" + (known === 1 ? "" : "s") + " recorded" : "nothing recorded yet"}. <button type="button" class="t-link" data-pp="knows">Record what they know</button> (they know nothing of the campaign's clues until you say so).</p>` : ""}
      <div class="loc-ai"><span class="kl">Optional help</span><button type="button" class="t-btn" data-pp="ai">Suggest what is still empty</button><span class="pp-aimsg t-small" aria-live="polite"></span></div>
      <div class="pp-sug" hidden></div>
      <div class="loc-go"><button type="button" class="t-btn prim" data-pp="save">${id ? "Save" : "Make them"}</button>${id ? `<button type="button" class="t-btn" data-pp="show" title="Their name and face on the players' screen">Show them to the players</button><button type="button" class="t-btn" data-pp="lib">Keep in my library</button><button type="button" class="t-btn ic-del" data-pp="del">${FILE[id] ? "Back as written" : "Take them away"}</button>` : ""}<button type="button" class="t-btn" data-pp="x">Cancel</button></div>
    </form>`;
  }
  function read() {
    const f = dlg.querySelector("form"), v = n => (f.elements[n] ? f.elements[n].value : "").trim(), r = Object.assign({}, cur.rec);
    for (const [k] of F) { if (k === "attrs") { const o = {}; for (const l of v(k).split(/\n/)) { const i = l.indexOf(":"); if (i > 0 && l.slice(i + 1).trim()) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } if (Object.keys(o).length) r.attrs = o; else delete r.attrs; continue; } const s = v(k); if (s) r[k] = s; else delete r[k]; }
    const pl = v("pl"), room = v("room"); if (pl) r.at = Object.assign({}, r.at && r.at.pl === pl ? r.at : {}, { pl, room: room || undefined }); else delete r.at;
    const fa = v("faction"); const rest = [].concat(r.factions || []).slice(1); if (fa) r.factions = [fa].concat(rest.filter(x => x !== fa)); else if (rest.length) r.factions = rest; else delete r.factions;
    if (cur.img !== undefined) { if (cur.img) r.img = cur.img; else delete r.img; }
    return r;
  }
  P.open = (id, seed) => {
    if (!on()) return;
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "ppDlg"; dlg.className = "loc-dlg pp-dlg"; document.body.appendChild(dlg);
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("change", e => {
        if (e.target.name === "pl") { const f = dlg.querySelector("form"); f.elements.room.innerHTML = opt(roomsOf(e.target.value), "", "Not in a room"); }
        if (e.target.dataset && e.target.dataset.pp === "img" && e.target.files[0]) picture(e.target.files[0]);
      });
    }
    const rec = id && A.castData && A.castData[id] ? JSON.parse(JSON.stringify(A.castData[id])) : Object.assign({}, seed || {});
    cur = { id: id || null, rec, img: undefined };
    dlg.innerHTML = form(cur.id, rec); if (!dlg.open) dlg.showModal();
    setTimeout(() => { const n = dlg.querySelector('[name="n"]'); if (n && !id) n.focus(); }, 30);
  };
  // (a picture of their own, made small enough to keep in the page)
  function picture(file) {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 360 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); cur.img = c.toDataURL("image/jpeg", .85); const r = read(); dlg.innerHTML = form(cur.id, Object.assign(r, { img: cur.img })); };
    img.onerror = () => note("That file could not be read as a picture.");
    img.src = url;
  }
  async function onClick(e) {
    const b = e.target.closest("[data-pp]"); if (!b) return; const a = b.dataset.pp;
    if (a === "x") { dlg.close(); return; }
    if (a === "img") return;
    if (a === "noimg") { cur.img = null; const r = read(); delete r.img; dlg.innerHTML = form(cur.id, r); return; }
    if (a === "ai") return suggest(b);
    if (a === "use") { const f = dlg.querySelector("form"), k = b.dataset.k, el = f.elements[k]; if (el) { el.value = cur.sug[k]; const d = el.closest("details"); if (d) d.open = true; } b.closest("li").remove(); return; }
    if (a === "save") { const r = read(); if (!r.n) { dlg.querySelector('[name="n"]').focus(); return; } const id = cur.id || newId(r.n); dlg.close(); await save(id, r); return; }
    if (a === "del") { const id = cur.id; A.tableUI.twice(b, async () => { dlg.close(); await forget(id); }); return; }
    if (a === "show") { const c = (A.castData || {})[cur.id]; if (c && A.tableUI) A.tableUI.api.show({ kind: "person", name: c.n, role: A.table && A.table.plainRole ? A.table.plainRole(c.role) : c.role, look: c.look, img: c.img }); note((c.n || "They") + " are on the players' screen."); return; }
    if (a === "lib") { const c = (A.castData || {})[cur.id]; if (c && A.myLibrary) { const d = JSON.parse(JSON.stringify(c)); delete d.at; delete d.factions; A.myLibrary.save({ kind: "person", name: c.n, say: c.role || "", data: d }).then(() => note(c.n + " is kept in your library."), x => note(x.message)); } return; }
    if (a === "knows") { const id = cur.id; dlg.close(); const X = A.tableUI && A.tableUI.api && A.tableUI.api.ctx(); if (X && X.setView) X.setView("table"); if (A.tableUI) A.tableUI.api.open("clues"); if (A.clueUI) A.clueUI.open("cast:" + id); }
  }
  // Claude, only when asked: what it suggests for the empty fields, each to take or leave; nothing is kept until Save
  async function suggest(btn) {
    const msg = dlg.querySelector(".pp-aimsg"), ask = A.tableUI && A.tableUI.api && A.tableUI.api.askRaw, r = read();
    if (!ask) { msg.textContent = "Suggestions need Claude: on claude.ai, or in the Atlas app."; return; }
    const empty = F.filter(([k]) => k !== "n" && k !== "attrs" && k !== "statsText" && !r[k]).map(([k, l]) => [k, l]);
    if (!empty.length) { msg.textContent = "Nothing is empty."; return; }
    const cfg = A.config || {}, known = F.filter(([k]) => r[k] && k !== "attrs").map(([k, l]) => `${l}: ${r[k]}`).join("\n"), where = r.at && A.meta[r.at.pl] ? A.meta[r.at.pl].name : "";
    const prompt = `A tabletop roleplaying campaign: "${cfg.title || ""}" (${[cfg.system, cfg.setting].filter(Boolean).join(", ")}). The game master is writing a person of their own. What they have written:\n${known}${where ? "\nWhere they are: " + where : ""}\nSuggest the fields still empty, in the voice of the campaign, consistent with what is written and inventing nothing about the campaign's other people or events. Answer with JSON only, one short entry for each of: ${empty.map(([k, l]) => `"${k}" (${l})`).join(", ")}.`;
    btn.disabled = true; msg.textContent = "Asking Claude…";
    let v = null; try { const raw = await ask(prompt, null, null, { kind: "writing", what: "suggestions for " + (r.n || "a person"), uses: ["what you wrote of them"] }); const m = String(raw || "").match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : null; } catch (e) { v = null; }
    btn.disabled = false;
    if (!v) { msg.textContent = "Claude could not answer just now. Write it yourself, or try again."; return; }
    cur.sug = {}; const items = empty.filter(([k]) => typeof v[k] === "string" && v[k].trim()).map(([k, l]) => { cur.sug[k] = String(v[k]).trim().slice(0, 4000); return `<li><b>${esc(l)}</b><p>${esc(cur.sug[k])}</p><button type="button" class="t-mini" data-pp="use" data-k="${esc(k)}">Use this</button></li>`; });
    const box = dlg.querySelector(".pp-sug"); box.hidden = false; box.innerHTML = `<h5>Claude suggests</h5><p class="t-small">Nothing is used until you choose it, and nothing is kept until you save.</p><ul>${items.join("")}</ul>`;
    msg.textContent = "";
  }
  // the people made or changed here, for the Gazetteer's list
  P.list = () => Object.entries(A.castData || {}).filter(([, c]) => c).map(([id, c]) => ({ id, n: c.n || id, role: c.role || "", made: c.made === "hand", at: c.at || null, img: c.img || "" })).sort((a, b) => a.n.localeCompare(b.n));
  P.save = save; P.forget = forget;
  // from the library: an independent copy
  P.fromLibrary = async it => { const d = JSON.parse(JSON.stringify(it.data || {})); return save(newId(d.n || it.name), Object.assign(d, { made: "hand" })); };
  P.init = store => {
    S = store; loadAll(); bump();
    if (S.watch) S.watch("people", () => { loadAll(); bump(); changed(); });
  };
})(typeof ATLAS !== "undefined" ? ATLAS : {});
