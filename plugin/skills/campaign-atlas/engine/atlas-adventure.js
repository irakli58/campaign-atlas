/* An imported adventure at the table (the user, 18 Nov 2026: docs/requests/2026-11-18-campaign-import.md; the skill's
   steps: references/import.md). The knowledge base (adventure.js, from atlas.js from-adventure) and its readiness
   report (ready.js, from atlas.js ready) become:
   - the adventure's card on At the table's Start here: where it starts and its hook, the readiness check (Ready to play,
     Needs review, Incomplete, with what to do for each), the special mechanics, the objectives, the important people,
     the endings, what depends on a thing, what has changed since the import, and Start the campaign;
   - the special mechanics (a card reading, a roll, a choice at the start), drawn or entered once and LOCKED, their
     results applied everywhere at once: an item's place in the item store, who will help, the Copilot's facts;
   - on every imported place's page, its keyed areas from the book (until its map is drawn), with references;
   - the book's facts in the Copilot's passages, each named with where in the book it is.
   Kept in collections "adv" (started, the objectives, the item store seeded) and "mechanics" (each mechanic's results). */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc, S = () => api.store();
  const KB = () => A.adventureData, REP = () => A.readinessData;
  if (!KB()) return;
  const list = k => (KB()[k] || []);
  const norm = s => String(s || "").toLowerCase().replace(/^(the|a|an) /, "").replace(/[^a-z0-9]+/g, " ").trim();
  const find = v => { if (!v) return null; for (const k of ["places", "people", "factions", "quests", "items", "encounters"]) { const x = list(k).find(e => e.id === v || norm(e.name || e.title) === norm(v)); if (x) return Object.assign({ _k: k }, x); } return null; };
  const refOf = x => [].concat(x.refs || x.ref || []).filter(Boolean).join("; ");
  const refChip = x => refOf(x) ? `<span class="adv-ref" title="Where it is in the adventure">${esc(refOf(x))}</span>` : x.added ? `<span class="adv-ref adv-added" title="Atlas's addition, not the book's">Atlas's</span>` : "";
  const placeLabel = id => (A.meta[id] || {}).name || (find(id) || {}).name || id;
  const personRef = id => "cast:" + id;
  // a mechanic's value: "place:abbey/A4", "person:hollis", "item:x", "quest:y", "text:"
  const parse = v => { const s = String(v || ""), i = s.indexOf(":"); if (i < 0) return { kind: "text" }; const kind = s.slice(0, i), rest = s.slice(i + 1), [id, area] = rest.split("/"); return { kind, id, area }; };
  const say = v => { const p = parse(v); if (p.kind === "place") { const ar = ((find(p.id) || {}).areas || []).find(a => a.id === p.area); return placeLabel(p.id) + (p.area ? ", " + p.area + (ar ? " " + ar.name : "") : ""); } if (p.kind === "person") return (find(p.id) || {}).name || p.id; return ""; };

  /* ---- the item store, seeded once with the book's items where the book puts them (atlas-items.js) */
  const stash = () => Object.entries((S() && S().get("stash")) || {}).filter(([, x]) => x && x.n);
  const advItem = id => stash().find(([, x]) => x.adv === id);
  function itemRec(it, owner, area) {
    return { n: it.name, cat: it.cat || "personal", rarity: it.rarity || (it.unique ? "rare" : "common"), quality: "plain", cond: "good", qty: 1, desc: it.desc || "", secret: it.gm || "", stats: it.stats || "", src: "campaign",
      unique: !!it.unique, role: it.story ? "plot" : "loot", adv: it.id, area: area || it.area || "", story: { significance: refOf(it) ? "From the adventure: " + refOf(it) : "" }, owner, t: Date.now() };
  }
  function ownerFor(v, it) { const p = parse(v); if (p.kind === "place" && p.id) return { owner: "place:" + p.id, area: p.area || "" }; if (p.kind === "person" && p.id) return { owner: personRef(p.id), area: "" }; if (it && it.holder) return { owner: personRef((find(it.holder) || { id: it.holder }).id), area: "" }; if (it && it.place) return { owner: "place:" + ((find(it.place) || { id: it.place }).id), area: it.area || "" }; return { owner: "library", area: "" }; }
  function seed() {
    const st = S(); if (!st || (st.get("adv", "seeded") || {}).t) return;
    for (const it of list("items")) { if (it.mechanic || advItem(it.id)) continue; const o = ownerFor(null, it); st.set("stash", "a" + it.id.replace(/[^\w-]/g, "").slice(0, 40), itemRec(it, o.owner, o.area)); }
    st.set("adv", "seeded", { t: Date.now() });
  }

  /* ---- the special mechanics: drawn, rolled or chosen once, then locked */
  const mres = id => (S() && S().get("mechanics", id)) || null;
  const shuffle = l => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function draw(m) {
    const out = {};
    if (m.kind === "draw") { const deck = shuffle((m.deck || []).map(c => c.card || c.name)); (m.slots || []).forEach((s, i) => { const card = deck[i % Math.max(1, deck.length)], o = (s.options || []).find(x => x.card === card) || {}; out[s.id] = { card, value: o.value || "", text: o.text || "" }; }); }
    else (m.slots || []).forEach(s => { const o = (s.options || [])[Math.floor(Math.random() * (s.options || []).length)] || {}; out[s.id] = { card: o.card || o.range || "", value: o.value || "", text: o.text || "" }; });
    return out;
  }
  // the results, applied at once: where each item lies, in the item store (never a second copy of a unique thing)
  function apply(m, res) {
    const st = S();
    for (const s of m.slots || []) {
      const r = res[s.id]; if (!r) continue; const tgt = parse(s.sets);
      if (tgt.kind === "item" && tgt.id) {
        const it = list("items").find(x => x.id === tgt.id) || { id: tgt.id, name: tgt.id }, o = ownerFor(r.value, it), had = advItem(tgt.id);
        if (had) st.set("stash", had[0], Object.assign({}, had[1], { owner: o.owner, area: o.area, placedBy: m.name })); else st.set("stash", "a" + tgt.id.replace(/[^\w-]/g, "").slice(0, 40), Object.assign(itemRec(it, o.owner, o.area), { placedBy: m.name }));
      }
    }
  }
  function save(m, res, how) { S().set("mechanics", m.id, { res, how, locked: true, t: Date.now() }); apply(m, res); if (A.history) A.history.add({ kind: "setup", title: `${m.name}: ${Object.values(res).map(r => r.card).filter(Boolean).join(", ")}` }); }
  A.adventureMechanics = () => list("mechanics").map(m => { const r = mres(m.id); return r ? `${m.name}: ${(m.slots || []).map(s => `${s.name}: ${r.res[s.id] ? (r.res[s.id].card ? r.res[s.id].card + ", " : "") + (r.res[s.id].text || say(r.res[s.id].value)) : "not set"}`).join("; ")}` : `${m.name}: not set up yet`; }).join(" · ");

  /* ---- what depends on a thing (the consequences of changing or removing it): from the knowledge base */
  function deps(id) {
    const out = [], is = v => { const x = find(v); return x && x.id === id; }, add = (k, x, why) => out.push({ k, name: x.name || x.title, why, ref: refOf(x) });
    for (const q of list("quests")) { if (is(q.giver)) add("quest", q, "gives it"); if (is(q.place)) add("quest", q, "it happens there"); for (const n of q.needs || []) if (is(n)) add("quest", q, "needs it"); }
    for (const e of list("encounters")) { if (is(e.place)) add("encounter", e, "it happens there"); for (const p of e.participants || []) if (is(p.name)) add("encounter", e, "takes part"); }
    for (const c of list("clues")) { if (is(c.place)) add("clue", c, "found there"); for (const v of [].concat(c.points || [])) if (is(v)) add("clue", c, "points to it"); }
    for (const it of list("items")) { if (is(it.place)) add("item", it, "lies there"); if (is(it.holder)) add("item", it, "carries it"); }
    for (const p of list("people")) { if (is(p.at)) add("person", p, "is there"); if (is(p.faction)) add("person", p, "belongs to it"); for (const k of p.knows || []) if (k && is(k.about)) add("person", p, "knows about it"); }
    for (const f of list("factions")) { if (is(f.leader)) add("faction", f, "leads it"); if (is(f.hq)) add("faction", f, "its seat"); }
    for (const m of list("mechanics")) for (const s of m.slots || []) for (const o of s.options || []) { const p = parse(o.value); if (p.id === id) add("mechanic", m, `${o.card || o.range || "a result"} of "${s.name}" sends it here`); }
    for (const e of list("endings")) if (String(e.text || "").toLowerCase().includes(norm((find(id) || {}).name))) out.push({ k: "ending", name: e.name, why: "named in it", ref: refOf(e) });
    return out;
  }
  // what has changed since the import: the cast and the places as they stand, against the book's
  function changes() {
    const out = [];
    for (const p of list("people")) { const c = (A.castData || {})[p.id]; if (!c) { out.push(`${p.name}: removed (the adventure has them: ${refOf(p) || "no reference"})`); continue; } for (const [f, g] of [["name", "n"], ["role", "role"], ["want", "want"], ["secret", "secret"]]) if (p[f] && c[g] !== undefined && String(c[g]) !== String(p[f])) out.push(`${p.name}: ${f} changed`); }
    for (const p of list("places")) { const m = A.meta[p.id]; if (!m) out.push(`${p.name}: removed`); else if (m.name !== p.name) out.push(`${p.name}: now "${m.name}"`); }
    for (const id of Object.keys(A.castData || {})) if (!list("people").some(p => p.id === id)) out.push(`${(A.castData[id] || {}).n || id}: added, not in the adventure`);
    for (const id of A.order || []) if (A.meta[id] && !String(id).startsWith("fly-") && !list("places").some(p => p.id === id)) out.push(`${A.meta[id].name}: a place added, not in the adventure`);
    return out;
  }

  /* ---- the card on Start here */
  const UI = { enter: "", redraw: "", dep: "" };
  const W = { ready: ["Ready to play", "adv-ok"], review: ["Needs review", "adv-rv"], incomplete: ["Incomplete", "adv-no"] };
  const go = (kind) => ({ places: list("places")[0] && `<button type="button" class="t-link" data-go="${esc(list("places")[0].id)}">the places</button>`, items: `<button type="button" class="t-link" data-t="tab" data-tab="items">Items and loot</button>`, people: `<button type="button" class="t-link" data-t="tab" data-tab="factions">Factions and people</button>`, start: KB().start && `<button type="button" class="t-link" data-go="${esc(KB().start.place)}">the start</button>`, mechanics: `<a class="t-link" href="#adv-mech">below</a>`, encounters: list("places")[0] && `<button type="button" class="t-link" data-go="${esc(list("places")[0].id)}">the places</button>` }[kind] || "");
  function mechHTML(m) {
    const r = mres(m.id);
    if (UI.enter === m.id) return `<form class="adv-mf" data-adv="enter" data-id="${esc(m.id)}"><p class="t-small">The reading as you played it at the table: for each, what came up.</p>${(m.slots || []).map(s => `<label class="it-f"><span>${esc(s.name)}</span><select class="t-in" name="${esc(s.id)}">${(s.options || []).map((o, i) => `<option value="${i}">${esc((o.card || o.range || "") + (o.text ? ": " + o.text : ""))}</option>`).join("")}</select></label>`).join("")}<div class="t-row"><button type="submit" class="t-btn prim">Keep this reading</button><button type="button" class="t-link" data-adv="cancel">Cancel</button></div></form>`;
    if (!r) return `<p class="t-small">${esc(m.when === "setup" ? "Set it up before the first session: Atlas draws it, or you enter the reading you did at the table. Then it is kept, and it places things for you." : "")}</p><div class="t-row"><button type="button" class="t-btn prim" data-adv="draw" data-id="${esc(m.id)}">${m.kind === "draw" ? "Draw for me" : m.kind === "roll" ? "Roll for me" : "Choose for me"}</button><button type="button" class="t-btn" data-adv="enterit" data-id="${esc(m.id)}">${m.kind === "draw" ? "Enter the reading as played" : "Enter the results"}</button></div>`;
    return `<ul class="adv-res">${(m.slots || []).map(s => { const x = r.res[s.id] || {}; return `<li><b>${esc(s.name)}</b>: ${x.card ? `<span class="adv-card">${esc(x.card)}</span> ` : ""}${esc(x.text || say(x.value) || "")}${parse(x.value).kind === "place" ? ` <button type="button" class="t-link" data-go="${esc(parse(x.value).id)}">Go there</button>` : ""}</li>`; }).join("")}</ul>
      <p class="t-small kn">Locked ${r.how === "entered" ? "(entered as played)" : "(drawn by Atlas)"}: applied to the item store and the Copilot. ${UI.redraw === m.id ? `<b>Redraw, and change where things are?</b> <button type="button" class="t-btn" data-adv="redrawyes" data-id="${esc(m.id)}">Yes, redraw</button> <button type="button" class="t-link" data-adv="cancel">Keep it</button>` : `<button type="button" class="t-link" data-adv="redraw" data-id="${esc(m.id)}">Redraw…</button>`}</p>`;
  }
  function card() {
    const kb = KB(), rep = REP(), st = S(), now = (st && st.get("adv", "now")) || {}, qs = (st && st.get("adv", "quests")) || {};
    const start = kb.start || {}, sp = find(start.place), state = rep ? rep.state : "review", wv = W[state] || W.review, mUnset = list("mechanics").filter(m => !mres(m.id));
    const blockers = rep ? rep.checks.filter(c => c.state === "incomplete") : [];
    const important = list("people").filter(p => p.important || (kb.factions || []).some(f => find(f.leader) && find(f.leader).id === p.id)).slice(0, 10);
    const ch = changes();
    return `<section class="t-card adv-card"><div class="tw-hh"><h3>${glyphBook} ${esc(kb.title || "The adventure")}</h3><span class="adv-state ${wv[1]}">${esc(wv[0])}</span></div>
      <p class="t-small">Imported from the game master's own copy${(kb.source && kb.source.files || []).length ? ` (${esc(kb.source.files.map(f => f.file).join(", "))}${kb.source.pages ? ", " + kb.source.pages + " pages" : ""})` : ""}. Kept private with this campaign. Every fact keeps where in the book it is; Atlas's additions are marked.</p>
      ${sp ? `<p><span class="kl">Where it starts</span><button type="button" class="t-link" data-go="${esc(sp.id)}">${esc(placeLabel(sp.id))}</button>${start.hook ? ": " + esc(start.hook) : ""}${start.level ? ` <span class="kn">(level ${esc(start.level)})</span>` : ""} ${refChip(start)}</p>` : ""}
      ${rep ? `<details class="adv-ready"${state !== "ready" ? " open" : ""}><summary>The readiness check</summary><ul>${rep.checks.map(c => `<li class="adv-c-${esc(c.state)}"><span class="adv-mark" aria-hidden="true">${c.state === "ready" ? "✓" : c.state === "review" ? "!" : "✗"}</span><b>${esc(c.label)}</b>: ${esc(c.why)} ${c.state !== "ready" && go(c.link) ? go(c.link) : ""}</li>`).join("")}</ul>${rep.review && rep.review.length ? `<p class="t-small">${rep.review.length} of Atlas's additions to review: ${esc(rep.review.slice(0, 8).map(r => r.name).join(", "))}${rep.review.length > 8 ? "…" : ""}.</p>` : ""}<p class="t-small kn">Checked ${esc(String(rep.t || "").slice(0, 10))} (node atlas.js ready: run it again after changes).</p></details>` : `<p class="warn">No readiness report yet: run node atlas.js ready on the campaign.</p>`}
      ${list("mechanics").length ? `<h4 class="tw-sub" id="adv-mech">The adventure's own mechanics</h4>${list("mechanics").map(m => `<div class="adv-m"><b>${esc(m.name)}</b> ${refChip(m)}${mechHTML(m)}</div>`).join("")}` : ""}
      ${list("quests").length ? `<h4 class="tw-sub">Objectives</h4><ul class="adv-q">${list("quests").map(q => { const s = qs[q.id] || "open"; return `<li class="adv-q-${esc(s)}"><select class="t-in" data-adv="quest" data-id="${esc(q.id)}" aria-label="${esc(q.name)}">${[["open", "Open"], ["done", "Done"], ["failed", "Failed"], ["ignored", "Ignored"]].map(([v, l]) => `<option value="${v}"${v === s ? " selected" : ""}>${l}</option>`).join("")}</select> <b>${esc(q.name)}</b>${q.optional ? " <span class=\"kn\">(optional)</span>" : ""}: ${esc(q.goal || "")} ${refChip(q)}</li>`; }).join("")}</ul>` : ""}
      ${important.length ? `<h4 class="tw-sub">The people who matter</h4><ul class="adv-p">${important.map(p => `<li><b>${esc(p.name)}</b>${p.role ? ", " + esc(p.role) : ""}${p.at ? ` · <button type="button" class="t-link" data-go="${esc((find(p.at) || {}).id || p.at)}">${esc(placeLabel((find(p.at) || {}).id || p.at))}</button>` : ""} ${refChip(p)}</li>`).join("")}</ul>` : ""}
      ${list("endings").length ? `<details><summary>How it can end (${list("endings").length})</summary><ul>${list("endings").map(e => `<li><b>${esc(e.name)}</b>: ${esc(e.text || "")} ${refChip(e)}</li>`).join("")}</ul></details>` : ""}
      <details><summary>What depends on…</summary><p class="t-small">Before you remove or change a person, a place or an item: what in the adventure leans on it. Nothing is changed for you.</p><select class="t-in" data-adv="dep" aria-label="Which"><option value="">Choose…</option>${["people", "places", "items", "factions"].flatMap(k => list(k).map(x => `<option value="${esc(x.id)}"${UI.dep === x.id ? " selected" : ""}>${esc(x.name)} (${k.slice(0, -1)})</option>`)).join("")}</select>
        ${UI.dep ? (d => d.length ? `<ul>${d.map(x => `<li>${esc(x.k)}: <b>${esc(x.name)}</b>, ${esc(x.why)} ${x.ref ? `<span class="adv-ref">${esc(x.ref)}</span>` : ""}</li>`).join("")}</ul><p class="t-small">If you remove it, each of these needs a new place, person or reason: change them yourself, or ask the Copilot for options.</p>` : `<p class="kn">Nothing in the adventure depends on it.</p>`)(deps(UI.dep)) : ""}</details>
      <details${ch.length ? "" : ""}><summary>Changed since the import (${ch.length})</summary>${ch.length ? `<ul>${ch.map(c => `<li>${esc(c)}</li>`).join("")}</ul><p class="t-small">The book's version of every file is kept (story/import-baseline.json): node atlas.js from-adventure --force puts a file back as the adventure had it; your changes are never written over without it.</p>` : `<p class="kn">Nothing yet: it stands as the adventure has it.</p>`}</details>
      <div class="t-row adv-go">${now.started ? `<span class="adv-state adv-ok">Started ${esc(new Date(now.started).toLocaleDateString())}</span>` : `<button type="button" class="t-btn prim" data-adv="start"${blockers.length || mUnset.length ? " disabled" : ""}>Start the campaign</button>${blockers.length ? `<span class="t-small">Not yet: ${esc(blockers.map(c => c.label.toLowerCase()).join("; "))} ${blockers.length > 1 ? "are" : "is"} incomplete.</span>` : mUnset.length ? `<span class="t-small">Set up ${esc(mUnset.map(m => m.name).join(", "))} first.</span>` : state === "review" ? `<span class="t-small">Some things need review (above); the campaign can be played as it is.</span>` : ""}`}</div></section>`;
  }
  const glyphBook = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
  TU.addCard("home", card);

  /* ---- a place's page: the book's keyed areas, until its map is drawn */
  TU.addDossier && TU.addDossier(p => {
    const m = A.meta[p.id] || {}, imp = m.imp, src = m.src; if (!imp && !src) return "";
    const placed = stash().filter(([, x]) => x.owner === "place:" + p.id && x.adv);
    return `<section class="sec keeper adv-place"><h3>From the adventure ${src ? refChip(src) : ""}</h3>
      ${imp && imp.intro ? `<p>${esc(imp.intro)}</p>` : ""}${imp && imp.gm ? `<p class="it-sec"><span class="kl">For you</span>${esc(imp.gm)}</p>` : ""}
      ${imp && (imp.areas || []).length && !A.maps[p.id] ? `<p class="t-small kn">No map is drawn yet: these are the book's keyed areas.</p>` : ""}
      ${imp && (imp.areas || []).length ? `<ol class="adv-areas">${imp.areas.map(a => `<li><b>${esc(a.id)}. ${esc(a.name)}</b> ${a.ref ? `<span class="adv-ref">${esc(a.ref)}</span>` : ""}${a.desc ? `<p>${esc(a.desc)}</p>` : ""}${a.gm ? `<p class="it-sec"><span class="kl">For you</span>${esc(a.gm)}</p>` : ""}${placed.filter(([, x]) => x.area === a.id).map(([, x]) => `<p class="adv-here"><span class="kl">Here</span>${esc(x.n)}${x.placedBy ? ` <span class="kn">(${esc(x.placedBy)})</span>` : ""}</p>`).join("")}</li>`).join("")}</ol>` : ""}
      ${imp && (imp.clues || []).length ? `<h4 class="tw-sub">Clues</h4><ul>${imp.clues.map(c => `<li>${esc(c.t)}${c.area ? ` <span class="kn">(${esc(c.area)})</span>` : ""}${(c.points || []).length ? " → " + c.points.map(id => `<button type="button" class="t-link" data-go="${esc(id)}">${esc(placeLabel(id))}</button>`).join(", ") : ""} ${c.ref ? `<span class="adv-ref">${esc(c.ref)}</span>` : ""}</li>`).join("")}</ul>` : ""}</section>`;
  });

  /* ---- the Copilot's passages: the book's facts, each named with where it is */
  A.adventurePassages = () => {
    const out = [], P = (src, text, go) => { if (text && String(text).trim()) out.push([src, text, go]); }, R = x => `The adventure, ${refOf(x) || "no reference"}`;
    for (const p of list("places")) { P(`${R(p)}: ${p.name}`, [p.desc, p.gm].filter(Boolean).join(" "), p.id); for (const a of p.areas || []) P(`${R(a)}: ${p.name}, ${a.id} ${a.name}`, [a.desc, a.gm].filter(Boolean).join(" "), p.id); }
    for (const p of list("people")) P(`${R(p)}: ${p.name}`, [p.role, p.look, p.manner, p.bg, p.want && "Wants: " + p.want, p.secret && "Secret: " + p.secret, ...(p.knows || []).map(k => "Knows: " + (k.text || k)), ...(p.reactions || []).map(r => "If: " + r), p.at && "Where: " + placeLabel((find(p.at) || {}).id || p.at)].filter(Boolean).join(" "), (find(p.at) || {}).id);
    for (const k of ["encounters", "quests", "events", "endings", "clues", "items", "tables", "rules", "choices", "factions"]) for (const x of list(k)) P(`${R(x)}: ${x.name || x.title || k}`, [x.text, x.desc, x.gm, x.goal, x.what, x.why, x.conditions, x.wants, [].concat(x.outcomes || []).join(" / "), x.place && "At: " + placeLabel((find(x.place) || {}).id || x.place), (x.participants || []).map(y => `${y.count || 1} ${y.name}${y.stats ? " (" + y.stats + ")" : ""}`).join(", "), (x.rows || []).map(r => (r.range || "") + " " + (r.text || "")).join("; ")].filter(Boolean).join(" "), (find(x.place) || {}).id);
    const mech = A.adventureMechanics(); if (mech) P("The adventure's setup, as drawn for this game", mech);
    return out;
  };

  /* ---- what the game master does */
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-adv]"); if (!b || ["SELECT", "FORM"].includes(b.tagName)) return;
    const k = b.dataset.adv, m = list("mechanics").find(x => x.id === b.dataset.id);
    if (k === "draw" && m && !mres(m.id)) save(m, draw(m), "drawn");
    else if (k === "enterit") UI.enter = b.dataset.id;
    else if (k === "cancel") { UI.enter = ""; UI.redraw = ""; }
    else if (k === "redraw") UI.redraw = b.dataset.id;
    else if (k === "redrawyes" && m) { UI.redraw = ""; save(m, draw(m), "drawn"); api.note && api.note(`${m.name}: drawn again; where things lie has moved with it.`); }
    else if (k === "start") { if (b.disabled) return; S().set("adv", "now", { started: Date.now() }); api.note && api.note("The campaign has begun. Tonight has the first session's sheet."); }
    else return;
    api.render();
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.adv) return;
    if (t.dataset.adv === "quest") { const q = Object.assign({}, S().get("adv", "quests") || {}); q[t.dataset.id] = t.value; S().set("adv", "quests", q); }
    else if (t.dataset.adv === "dep") UI.dep = t.value; else return;
    api.render();
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || f.dataset.adv !== "enter") return; e.preventDefault();
    const m = list("mechanics").find(x => x.id === f.dataset.id); if (!m) return;
    const res = {}; for (const s of m.slots || []) { const o = (s.options || [])[+((f.elements[s.id] || {}).value || 0)] || {}; res[s.id] = { card: o.card || o.range || "", value: o.value || "", text: o.text || "" }; }
    UI.enter = ""; save(m, res, "entered"); api.render();
  });
  // the item store is seeded with the book's items once the page's store is open, on the game master's side only
  // (the page's store reads only the collections something watches: this file's own, watched as soon as it is open)
  let tries = 0, watched = false; const t0 = setInterval(() => { tries++; const st = S();
    if (st && !watched && st.watch) { watched = true; for (const c of ["mechanics", "adv"]) st.watch(c, () => { if (api.tab() === "home") api.render(); }); }
    if (st && document.getElementById("app") && document.getElementById("app").dataset.mode === "gm") { clearInterval(t0); setTimeout(() => { try { seed(); } catch (er) { console.warn("atlas: the adventure's items could not be placed", er); } }, 800); } else if (tries > 60) clearInterval(t0); }, 500);
  A.adventureApi = { deps, changes, draw, seed, apply };
})(typeof ATLAS !== "undefined" ? ATLAS : this.ATLAS);
