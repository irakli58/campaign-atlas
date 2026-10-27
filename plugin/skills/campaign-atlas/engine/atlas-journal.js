/* The players' journal, the game master's side (the user's master plan, part 9: an optional journal for the players with
   complete control by the game master; every kind of help switched on or off on its own; nothing undiscovered and
   nothing of the game master's in it; the players' theories never confirmed). A card on The players' screen: the mode
   (manual, assisted, full) and each switch, kept in the table's store (collection "jcfg"), which the players' window and
   what their copy is sent both obey (atlas-table.js, atlas-share.js). What the journal holds beyond what they found is
   what the game master gives: quests ("pquests"), hints and next steps ("hints"), "Previously on" ("recaps"); and the
   people they met, recorded when the game master shows someone's face on their screen ("met": the name, the plain part
   of the role and the look the screen showed, never more). */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T || !TU.addCard || !T.JOURNAL) return;
  const api = TU.api, esc = A.esc, J = T.JOURNAL;
  const S = () => api.store();
  const cfg = () => T.journalCfg(S());
  const nowWhen = () => A.worldTime && A.calendarData ? A.worldTime.at(A.worldTime.now()).short : new Date().toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const MODES = [["manual", "Manual", "Their own notes only: nothing recorded for them, no connections, hints or summaries."], ["assisted", "Assisted", "What they have actually found, as they found it: clues, places, people met, and the connections you pin up. Nothing is solved for them."], ["full", "Full", "All of it: quests, people, hints and next steps you give, \"Previously on\", and a timeline of what has happened."]];

  function card() {
    const c = cfg(), list = col => Object.entries(S().get(col) || {}).filter(([, v]) => v).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
    const q = list("pquests"), h = list("hints"), m = list("met");
    return `<section class="t-card t-journal"><h3>${T.icon("tonight")} The players' journal</h3>
      <p class="t-small">How much Atlas keeps for the players, in their window and their copy. Only what they have found or what you give them is ever in it, and their theories are never marked right or wrong.</p>
      <div class="t-row tj-modes" role="radiogroup" aria-label="The journal">${MODES.map(([k, l, d]) => `<button type="button" class="t-mini" data-tj="mode" data-m="${k}" aria-pressed="${c.mode === k}" title="${esc(d)}">${l}</button>`).join("")}${c.mode === "custom" ? `<span class="kn">your own mix</span>` : ""}</div>
      <p class="t-small">${esc((MODES.find(x => x[0] === c.mode) || [0, 0, "Your own mix of what is kept."])[2])}</p>
      <div class="tj-keys">${J.keys.map(([k, l]) => `<label class="t-fogck"><input type="checkbox" data-tj="key" data-k="${k}"${c[k] ? " checked" : ""}> ${esc(l)}</label>`).join("")}</div>
      ${c.quests ? `<h4 class="tw-sub">Their quests</h4>${q.length ? `<ul class="tj-list">${q.map(([id, x]) => `<li class="${x.done ? "done" : ""}">${esc(x.text)} <button type="button" class="t-link" data-tj="qdone" data-id="${esc(id)}">${x.done ? "not done" : "done"}</button> <button type="button" class="t-link" data-tj="qdel" data-id="${esc(id)}">take back</button></li>`).join("")}</ul>` : ""}<form class="t-row tj-add" data-tj="quest"><input class="t-in" name="x" maxlength="200" placeholder="A quest for them: find out who signed for the crate"><button class="t-mini">Give it</button></form>` : ""}
      ${c.hints || c.next ? `<h4 class="tw-sub">${c.hints && c.next ? "Hints and next steps" : c.hints ? "Hints" : "Next steps"}</h4>${h.length ? `<ul class="tj-list">${h.slice(0, 8).map(([id, x]) => `<li><span class="kn">${x.kind === "next" ? "Next step" : "Hint"}</span> ${esc(x.text)} <button type="button" class="t-link" data-tj="hdel" data-id="${esc(id)}">take back</button></li>`).join("")}</ul>` : ""}<form class="t-row tj-add" data-tj="hint"><input class="t-in" name="x" maxlength="400" placeholder="Something to nudge them, without solving it for them">${c.hints && c.next ? `<select class="t-in tw-sel" name="k"><option value="hint">A hint</option><option value="next">A next step</option></select>` : `<input type="hidden" name="k" value="${c.hints ? "hint" : "next"}">`}<button class="t-mini">Give it</button></form>` : ""}
      ${c.summaries ? `<h4 class="tw-sub">"Previously on…"</h4><div class="t-row"><button type="button" class="t-mini" data-tj="recap">Give them the last "Previously on…"</button><span class="kn">${Object.keys(S().get("recaps") || {}).length} given</span></div>` : ""}
      ${c.people ? `<h4 class="tw-sub">People they have met</h4><p class="t-small">Kept when you show someone's face on their screen: their name, the plain part of who they are, and how they look.</p>${m.length ? `<ul class="tj-list">${m.map(([id, x]) => `<li>${esc(x.name)}${x.role ? ` <span class="kn">${esc(x.role)}</span>` : ""} <button type="button" class="t-link" data-tj="mdel" data-id="${esc(id)}">take back</button></li>`).join("")}</ul>` : `<p class="kn">Nobody yet.</p>`}` : ""}</section>`;
  }
  TU.addCard("screen", card);

  // the people they met: kept when the game master shows a face on their screen (only what the screen showed)
  let lastFace = 0;
  function onScreen(d) {
    const n = (d || {}).now || {}; if (n.kind !== "person" || !n.name || (n.t || 0) === lastFace) return; lastFace = n.t || 0;
    if (!cfg().people) return;
    const key = "m" + String(n.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40), had = S().get("met", key);
    S().set("met", key, Object.assign({}, had || {}, { name: n.name, role: T.plainRole ? T.plainRole(n.role || "") : "", look: n.look || "", when: (had && had.when) || nowWhen(), t: (had && had.t) || Date.now() }));
  }

  const paint = () => { if (api.tab() === "screen") api.render(); };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-tj]"); if (!b || b.tagName === "INPUT" || b.tagName === "FORM") return;
    const k = b.dataset.tj, id = b.dataset.id, st = S();
    if (k === "mode") st.set("jcfg", "now", Object.assign({ mode: b.dataset.m }, J.modes[b.dataset.m]));
    else if (k === "qdone") { const x = st.get("pquests", id); if (x) st.set("pquests", id, Object.assign({}, x, { done: !x.done })); }
    else if (k === "qdel") st.set("pquests", id, null);
    else if (k === "hdel") st.set("hints", id, null);
    else if (k === "mdel") st.set("met", id, null);
    else if (k === "recap") { const n = api.session() - 1, r = n > 0 ? (api.notesOf(n) || {}).recap : ""; if (!r) { api.note("Write \"Previously on…\" under Tonight first."); return; } st.set("recaps", "s" + n, { n, text: r, t: Date.now() }); api.note("Given to their journal."); }
    else return;
    setTimeout(paint, 60);
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || t.dataset.tj !== "key") return;
    const c = cfg(); delete c.mode; c[t.dataset.k] = t.checked;
    // (a mix that is one of the modes is called by its name)
    const same = Object.entries(J.modes).find(([, v]) => J.keys.every(([k]) => !!v[k] === !!c[k]));
    S().set("jcfg", "now", Object.assign(c, { mode: same ? same[0] : "custom" })); t.blur(); setTimeout(paint, 60);
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.tj) return; e.preventDefault();
    if (document.activeElement && f.contains(document.activeElement)) document.activeElement.blur();
    const x = String((f.elements.x || {}).value || "").trim(); if (!x) return;
    if (f.dataset.tj === "quest") S().set("pquests", uid("q"), { text: x.slice(0, 200), done: false, t: Date.now() });
    if (f.dataset.tj === "hint") S().set("hints", uid("h"), { kind: (f.elements.k || {}).value === "next" ? "next" : "hint", text: x.slice(0, 400), when: nowWhen(), t: Date.now() });
    api.note("Given to their journal."); setTimeout(paint, 60);
  });
  // (watched once the table's store is there: the first plugin tab's init comes after it; the screen is read from then on)
  let tries = 0; const boot = setInterval(() => { const st = S(); if (!st) { if (++tries > 600) clearInterval(boot); return; } clearInterval(boot); st.watch("screen", d => onScreen(d)); for (const c of ["jcfg", "pquests", "hints", "recaps", "met"]) st.watch(c, paint); }, 200);
})(ATLAS);
