/* Factions and people's lives (the user's master plan, 26 Oct 2026, parts 6 and 7: factions that act from what they
   actually have, relationships that change through events and the party's deeds, territory; important people with a
   home, a workplace, a day and a week, factions, fears, beliefs and suspicions, who move as the world's time moves and
   change when the world does). The council writes the factions in table.js (ATLAS.factions) and the people's lives on
   the cast (home, work, sched, week, factions, fears, believes, suspects, wrong: references/table.md, section 19). The
   page keeps what has changed since (collections "factions" and "npcstate"), by the game master's hand or by an event
   the game master let happen (an event's effects, done and undone with it: atlas-worldtime.js). What people know stays
   the investigation's (atlas-story.js): an event can teach someone something, recorded with how they came by it.
   Nothing here is shown to the players. A tab of At the table; the copilot and the consistency check are told of it. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc, St = A.story;
  const S = () => api.store();
  const placeName = id => (A.meta[id] || {}).name || id;
  const go = id => A.meta[id] ? api.goBtn(id) : esc(id || "");
  // how two powers stand (and how one stands toward the party), from war to alliance
  const STANCE = [["war", "At war", -3], ["hostile", "Hostile", -2], ["wary", "Wary", -1], ["neutral", "Neutral", 0], ["friendly", "Friendly", 1], ["allied", "Allied", 2]];
  const stanceOf = k => STANCE.find(s => s[0] === k) || STANCE[3];
  // what a faction has, each from 0 (none) to 5 (as much as any power in the story): it can do no more than this allows
  const HAS = [["money", "Money"], ["people", "People"], ["arms", "Arms"], ["influence", "Influence"], ["knowledge", "Knowledge"]];
  const STATUS = [["", "As usual"], ["missing", "Missing"], ["hiding", "In hiding"], ["arrested", "Arrested"], ["hurt", "Hurt"], ["gone", "Gone away"], ["dead", "Dead"]];
  const COLORS = ["#8a2432", "#2f6b3a", "#2b5d8a", "#9a6a12", "#6b3a8a", "#2f7a7a", "#8a4b24", "#555f6b"];

  /* ---- the factions as written, with what has changed since */
  const defs = () => A.factionsData || {};
  const ids = () => Object.keys(defs());
  const stOf = id => (S() && S().get("factions", id)) || {};
  function fac(id) {
    const d = defs()[id]; if (!d) return null; const s = stOf(id);
    const rels = {}; for (const [o, r] of Object.entries(d.rels || {})) rels[o] = Array.isArray(r) ? r[0] : typeof r === "object" ? r.stance : r;
    return Object.assign({}, d, { id, rels: Object.assign(rels, s.rels || {}), party: s.party || d.party || "neutral", step: s.step != null ? s.step : (d.step || 0), has: Object.assign({}, d.has || {}, s.has || {}), territory: s.territory || [].concat(d.territory || []), log: s.log || [], color: d.color || COLORS[ids().indexOf(id) % COLORS.length] });
  }
  const relWhy = (id, o) => { const r = (defs()[id] || {}).rels || {}, x = r[o]; return Array.isArray(x) ? x[1] || "" : typeof x === "object" && x ? x.why || "" : ""; };
  const personName = p => { const c = (A.castData || {})[p]; return c ? c.n : String(p || ""); };

  /* ---- people: where each one of the cast is now, by their day and week and what has happened to them */
  const nowM = () => A.worldTime ? A.worldTime.now() : 0;
  const nowAt = () => A.worldTime ? A.worldTime.at(nowM()) : { h: 12, wd: "" };
  const lifeOf = id => (S() && S().get("npcstate", id)) || {};
  const inRange = (r, h) => { const m = /^(\d{1,2})(?::\d{2})?\s*-\s*(\d{1,2})/.exec(String(r)); if (!m) return false; const a = +m[1], b = +m[2]; return a <= b ? h >= a && h < b : h >= a || h < b; };
  // a day of a person: [["08-18", "med-lab", "at work"], ...]; their week: { Starday: [...] } for the days that differ
  function whereNow(id) {
    const c = (A.castData || {})[id]; if (!c) return null; const L = lifeOf(id), t = nowAt(), m = nowM();
    if (L.status && ["dead", "gone", "missing", "arrested", "hiding"].includes(L.status) && !L.at) return { status: L.status, by: "status" };
    if (L.at && (!L.until || m < L.until)) return { at: L.at, doing: L.doing || "", by: "moved", until: L.until, status: L.status };
    const day = (c.week && t.wd && c.week[t.wd]) || c.sched || [];
    for (const [r, at, doing] of day) if (inRange(r, t.h)) return { at, doing: doing || "", by: "schedule", status: L.status };
    if (t.h >= 22 || t.h < 6) return c.home ? { at: c.home, doing: "asleep", by: "home", status: L.status } : null;
    return c.work ? { at: c.work, doing: "at work", by: "work", status: L.status } : c.home ? { at: c.home, doing: "at home", by: "home", status: L.status } : null;
  }
  const factionsOf = id => { const c = (A.castData || {})[id] || {}, L = lifeOf(id), base = [].concat(c.factions || []); for (const f of ids()) { const d = defs()[f]; if ((d.leader === id || [].concat(d.members || []).includes(id)) && !base.includes(f)) base.push(f); } return base.filter(f => !(L.left || []).includes(f)).concat((L.joined || []).filter(f => !base.includes(f))); };
  const lived = () => Object.entries(A.castData || {}).filter(([, c]) => c.sched || c.week || c.home || c.work || c.factions || c.fears || c.believes);
  // what the copilot is told of someone: where they are now, their factions, what they fear, believe and suspect
  function about(ref) {
    const id = String(ref || "").startsWith("cast:") ? ref.slice(5) : null, c = id && (A.castData || {})[id]; if (!c) return "";
    const w = whereNow(id), fs = factionsOf(id).map(f => fac(f)).filter(Boolean), out = [];
    if (w) out.push(`WHERE THEY ARE NOW (${nowAt().short || ""}): ${w.at ? placeName(w.at) : ""}${w.doing ? ", " + w.doing : ""}${w.status ? " (" + (STATUS.find(s => s[0] === w.status) || [0, w.status])[1].toLowerCase() + ")" : ""}`);
    if (fs.length) out.push("THEIR FACTIONS: " + fs.map(f => `${f.n}${f.leader === id ? " (they lead it)" : ""}: wants ${f.wants || "?"}; stands ${stanceOf(f.party)[1].toLowerCase()} toward the party`).join("; "));
    for (const [k, l] of [["fears", "WHAT THEY FEAR"], ["believes", "WHAT THEY BELIEVE"], ["suspects", "WHAT THEY SUSPECT"], ["wrong", "WHAT THEY HAVE WRONG (they believe it)"], ["rep", "THEIR REPUTATION"]]) if (c[k]) out.push(`${l}: ${c[k]}`);
    return out.join("\n");
  }

  /* ---- what an event changes, done when it happens and undone with it */
  const KINDS = [["rel", "Two factions now stand"], ["party", "A faction now stands, toward the party"], ["step", "A faction's plan moves on"], ["has", "A faction gains or loses"], ["gains", "A faction takes a place"], ["loses", "A faction loses a place"], ["at", "Someone goes to a place"], ["status", "Someone is now"], ["joins", "Someone joins a faction"], ["leaves", "Someone leaves a faction"], ["learns", "Someone learns something"]];
  function say(x) {
    const f = x.faction && fac(x.faction), fn = f ? f.n : x.faction, pn = personName(x.person);
    if (x.rel) return `${fn} and ${(fac(x.rel[0]) || {}).n || x.rel[0]}: ${stanceOf(x.rel[1])[1].toLowerCase()}`;
    if (x.party) return `${fn} toward the party: ${stanceOf(x.party)[1].toLowerCase()}`;
    if (x.step != null) return `${fn}'s plan moves on${typeof x.step === "number" && x.step !== 1 ? " " + x.step + " steps" : ""}`;
    if (x.has) return `${fn}: ${Object.entries(x.has).map(([k, v]) => `${(HAS.find(h => h[0] === k) || [0, k])[1].toLowerCase()} ${v > 0 ? "+" : ""}${v}`).join(", ")}`;
    if (x.gains) return `${fn} takes ${placeName(x.gains)}`;
    if (x.loses) return `${fn} loses ${placeName(x.loses)}`;
    if (x.at) return `${pn} goes to ${placeName(x.at)}${x.doing ? " (" + x.doing + ")" : ""}${x.hours ? " for " + x.hours + " hours" : ""}`;
    if (x.status != null) return `${pn}: ${(STATUS.find(s => s[0] === x.status) || [0, x.status])[1].toLowerCase()}`;
    if (x.joins) return `${pn} joins ${(fac(x.joins) || {}).n || x.joins}`;
    if (x.leaves) return `${pn} leaves ${(fac(x.leaves) || {}).n || x.leaves}`;
    if (x.learns) return `${pn} learns: ${x.learns}`;
    return "";
  }
  // each change keeps what it replaced, so taking the event back puts the world back as it was
  function apply(e, when) {
    const st = S(), undo = []; if (!st) return undo;
    const keep = (coll, id) => { if (!undo.some(u => u.coll === coll && u.id === id)) undo.push({ coll, id, before: st.get(coll, id) || null }); };
    const logF = (id, what) => { const s = Object.assign({}, st.get("factions", id) || {}); s.log = (s.log || []).concat({ when, what: what + (e.title ? " (" + e.title + ")" : "") }).slice(-30); return s; };
    for (const x of e.effects || []) {
      if (x.faction && !defs()[x.faction]) continue;
      if (x.rel) { const [o, k] = x.rel; if (!defs()[o]) continue; keep("factions", x.faction); keep("factions", o); for (const [a, b] of [[x.faction, o], [o, x.faction]]) { const s = logF(a, `now ${stanceOf(k)[1].toLowerCase()} with ${(defs()[b] || {}).n || b}`); s.rels = Object.assign({}, s.rels || {}, { [b]: k }); st.set("factions", a, s); } }
      else if (x.party) { keep("factions", x.faction); const s = logF(x.faction, `${stanceOf(x.party)[1].toLowerCase()} toward the party`); s.party = x.party; st.set("factions", x.faction, s); }
      else if (x.step != null) { keep("factions", x.faction); const f = fac(x.faction), s = logF(x.faction, "the plan moves on"); s.step = Math.max(0, Math.min((f.plan || []).length, (f.step || 0) + (+x.step || 1))); st.set("factions", x.faction, s); }
      else if (x.has) { keep("factions", x.faction); const f = fac(x.faction), s = logF(x.faction, say(x).replace(/^[^:]*: /, "")); s.has = Object.assign({}, s.has || {}); for (const [k, v] of Object.entries(x.has)) s.has[k] = Math.max(0, Math.min(5, (+f.has[k] || 0) + +v)); st.set("factions", x.faction, s); }
      else if (x.gains || x.loses) { keep("factions", x.faction); const f = fac(x.faction), p = x.gains || x.loses, s = logF(x.faction, (x.gains ? "takes " : "loses ") + placeName(p)); s.territory = x.gains ? [...new Set(f.territory.concat(p))] : f.territory.filter(t => t !== p); st.set("factions", x.faction, s); }
      else if (x.person && (A.castData || {})[x.person]) {
        const id = x.person; keep("npcstate", id); const L = Object.assign({}, st.get("npcstate", id) || {});
        if (x.at) Object.assign(L, { at: x.at, doing: x.doing || "", until: x.hours ? nowM() + x.hours * 60 : null });
        else if (x.status != null) { L.status = x.status; if (["dead", "gone", "missing", "arrested", "hiding"].includes(x.status)) { delete L.at; delete L.until; } }
        else if (x.joins) { L.joined = [...new Set((L.joined || []).concat(x.joins))]; L.left = (L.left || []).filter(f => f !== x.joins); }
        else if (x.leaves) { L.left = [...new Set((L.left || []).concat(x.leaves))]; L.joined = (L.joined || []).filter(f => f !== x.leaves); }
        else if (x.learns && St && St.know) { try { const kid = St.know({ who: "cast:" + id, text: x.learns, about: x.about || "", type: x.type || (x.how === "rumour" ? "rumour" : "report"), how: x.how || "told", when, why: e.title ? "When " + e.title.toLowerCase() : "" }, { src: "event", note: "learned in the world: " + (e.title || "") }); undo.push({ know: kid }); } catch (err) {} continue; }
        L.log = (L.log || []).concat({ when, what: say(x) }).slice(-20); st.set("npcstate", id, L);
      }
    }
    return undo;
  }
  function revert(undo) { const st = S(); for (const u of (undo || []).slice().reverse()) { if (u.know) { try { St.put("knowledge", u.know, null, { src: "event", note: "taken back with its event" }); } catch (e) {} } else if (u.coll) st.set(u.coll, u.id, u.before); } }

  // the event form's rows for what an event changes (atlas-worldtime.js draws them in its form)
  const facOpts = (v, none) => (none ? `<option value="">${none}</option>` : "") + ids().map(f => `<option value="${esc(f)}"${f === v ? " selected" : ""}>${esc(defs()[f].n || f)}</option>`).join("");
  const personOpts = v => `<option value="">Who…</option>` + Object.entries(A.castData || {}).map(([k, c]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(c.n || k)}</option>`).join("");
  const placeOpts = v => `<option value="">Where…</option>` + A.order.filter(p => A.meta[p] && !String(p).startsWith("fly-")).map(p => `<option value="${esc(p)}"${p === v ? " selected" : ""}>${esc(placeName(p))}</option>`).join("");
  const stanceOpts = v => STANCE.map(([k, l]) => `<option value="${k}"${k === v ? " selected" : ""}>${l}</option>`).join("");
  const toRow = x => x.rel ? { k: "rel", a: x.faction, b: x.rel[0], c: x.rel[1] } : x.party ? { k: "party", a: x.faction, c: x.party } : x.step != null ? { k: "step", a: x.faction, c: String(x.step) } : x.has ? { k: "has", a: x.faction, b: Object.keys(x.has)[0], c: String(Object.values(x.has)[0]) } : x.gains ? { k: "gains", a: x.faction, b: x.gains } : x.loses ? { k: "loses", a: x.faction, b: x.loses } : x.at ? { k: "at", a: x.person, b: x.at, c: x.doing || "", d: x.hours || "" } : x.status != null ? { k: "status", a: x.person, c: x.status } : x.joins ? { k: "joins", a: x.person, b: x.joins } : x.leaves ? { k: "leaves", a: x.person, b: x.leaves } : x.learns ? { k: "learns", a: x.person, c: x.learns, b: x.how || "told" } : { k: "" };
  function fromRow(r) {
    const fk = ["rel", "party", "step", "has", "gains", "loses"].includes(r.k);
    if (!r.k || !r.a) return null;
    if (fk && !defs()[r.a]) return null;
    switch (r.k) {
      case "rel": return r.b && r.c ? { faction: r.a, rel: [r.b, r.c] } : null;
      case "party": return { faction: r.a, party: r.c || "neutral" };
      case "step": return { faction: r.a, step: +r.c || 1 };
      case "has": return r.b ? { faction: r.a, has: { [r.b]: +r.c || 0 } } : null;
      case "gains": return r.b ? { faction: r.a, gains: r.b } : null;
      case "loses": return r.b ? { faction: r.a, loses: r.b } : null;
      case "at": return r.b ? Object.assign({ person: r.a, at: r.b }, r.c ? { doing: r.c } : {}, +r.d ? { hours: +r.d } : {}) : null;
      case "status": return { person: r.a, status: r.c || "" };
      case "joins": return r.b ? { person: r.a, joins: r.b } : null;
      case "leaves": return r.b ? { person: r.a, leaves: r.b } : null;
      case "learns": return r.c ? { person: r.a, learns: r.c, how: r.b || "told" } : null;
    }
    return null;
  }
  function rowHTML(r, i) {
    const n = k => `fx${k}${i}`, fk = ["rel", "party", "step", "has", "gains", "loses"].includes(r.k), pk = ["at", "status", "joins", "leaves", "learns"].includes(r.k);
    const sel = (k, opts, lbl) => `<select class="t-in" name="${n(k)}" aria-label="${lbl}">${opts}</select>`, inp = (k, v, ph, t) => `<input class="t-in${t === "number" ? " t-n" : ""}" ${t ? `type="${t}" ` : ""}name="${n(k)}" value="${esc(v == null ? "" : v)}" placeholder="${ph}">`;
    let more = "";
    if (fk) more += sel("a", facOpts(r.a, "Which faction…"), "Which faction");
    if (pk) more += sel("a", personOpts(r.a), "Who");
    if (r.k === "rel") more += sel("b", facOpts(r.b, "And which…"), "And which faction") + sel("c", stanceOpts(r.c || "hostile"), "How they stand");
    if (r.k === "party") more += sel("c", stanceOpts(r.c || "hostile"), "How they stand toward the party");
    if (r.k === "step") more += inp("c", r.c || "1", "steps", "number");
    if (r.k === "has") more += sel("b", HAS.map(([k, l]) => `<option value="${k}"${k === r.b ? " selected" : ""}>${l}</option>`).join(""), "What") + inp("c", r.c || "-1", "+1 or -1", "number");
    if (["gains", "loses", "at"].includes(r.k)) more += sel("b", placeOpts(r.b), "Which place");
    if (r.k === "at") more += inp("c", r.c, "doing what") + inp("d", r.d, "for hours", "number");
    if (r.k === "status") more += sel("c", STATUS.map(([k, l]) => `<option value="${k}"${k === r.c ? " selected" : ""}>${l}</option>`).join(""), "Now");
    if (r.k === "joins" || r.k === "leaves") more += sel("b", facOpts(r.b, "Which faction…"), "Which faction");
    if (r.k === "learns") more += inp("c", r.c, "what they learn") + sel("b", St.KHOW.map(([k, l]) => `<option value="${k}"${k === (r.b || "told") ? " selected" : ""}>${l}</option>`).join(""), "How they learn it");
    return `<div class="tw-cond tw-fx"><select class="t-in" name="${n("k")}" data-twfx="kind" aria-label="What changes"><option value="">What changes…</option>${KINDS.map(([k, l]) => `<option value="${k}"${k === r.k ? " selected" : ""}>${l}</option>`).join("")}</select>${more}<button type="button" class="t-mini" data-tw="delfx" data-i="${i}" aria-label="Remove this change">×</button></div>`;
  }
  const readRow = (f, i) => { const g = k => f.elements["fx" + k + i] ? String(f.elements["fx" + k + i].value || "").trim() : ""; return { k: g("k"), a: g("a"), b: g("b"), c: g("c"), d: g("d") }; };
  A.worldEffects = { apply, revert, say, KINDS, toRow, fromRow, rowHTML, readRow, any: () => ids().length || Object.keys(A.castData || {}).length };

  /* ---- the tab */
  const UI = { open: {}, move: null };
  function bars(f) { return `<div class="fa-has">${HAS.map(([k, l]) => { const v = Math.max(0, Math.min(5, +f.has[k] || 0)); return `<div class="fa-bar"><span class="kn">${l}</span><span class="fa-pips" aria-label="${l}: ${v} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span><button type="button" class="t-mini" data-fa="has" data-id="${esc(f.id)}" data-k="${k}" data-d="-1" aria-label="Less ${l}">−</button><button type="button" class="t-mini" data-fa="has" data-id="${esc(f.id)}" data-k="${k}" data-d="1" aria-label="More ${l}">+</button></div>`; }).join("")}</div>`; }
  function card(f) {
    const others = ids().filter(o => o !== f.id), plan = [].concat(f.plan || []);
    const row = (k, v) => v ? `<div class="tw-f"><span class="kn">${k}</span> ${v}</div>` : "";
    return `<article class="t-card fa-card" style="--fa:${esc(f.color)}"><div class="fa-h"><i class="fa-dot"></i><h3>${esc(f.n || f.id)}</h3>${f.kind ? `<span class="kn">${esc(f.kind)}</span>` : ""}</div>
      ${row("Led by", esc(personName(f.leader)))}${[].concat(f.members || []).length ? row("Members", esc([].concat(f.members).map(personName).join(", "))) : ""}${row("Seat", f.hq ? go(f.hq) : "")}${f.territory.length ? row("Holds", f.territory.map(go).join(", ")) : ""}
      ${bars(f)}${f.lacks ? row("Lacks", esc(f.lacks)) : ""}${row("Wants", esc(f.wants || ""))}
      ${plan.length ? `<div class="fa-plan"><span class="kn">Their plan</span><ol>${plan.map((p, i) => `<li class="${i < f.step ? "done" : i === f.step ? "now" : ""}">${esc(p)}</li>`).join("")}</ol><div class="t-row"><button type="button" class="t-mini" data-fa="step" data-id="${esc(f.id)}" data-d="-1">Back a step</button><button type="button" class="t-mini" data-fa="step" data-id="${esc(f.id)}" data-d="1">Next step</button>${f.clock ? `<span class="kn">and its clock: ${esc(((A.clocksData || []).find(c => c.id === f.clock) || {}).name || f.clock)}</span>` : ""}</div></div>` : ""}
      ${row("Doing now", esc(f.doing || ""))}
      <div class="fa-rels"><span class="kn">How they stand</span>${others.map(o => `<label class="fa-rel"><span>${esc(defs()[o].n || o)}</span> <select class="t-in" data-fa="rel" data-id="${esc(f.id)}" data-o="${esc(o)}">${stanceOpts(f.rels[o] || "neutral")}</select>${relWhy(f.id, o) ? `<small class="kn">${esc(relWhy(f.id, o))}</small>` : ""}</label>`).join("")}<label class="fa-rel"><span><b>Toward the party</b></span> <select class="t-in" data-fa="party" data-id="${esc(f.id)}">${stanceOpts(f.party)}</select></label></div>
      <details class="fa-more"><summary>What only you know</summary>${row("They know", esc(f.knows || ""))}${row("They believe, wrongly", esc(f.wrong || ""))}${row("Inside it", esc(f.inner || ""))}${row("Reputation", esc(f.rep || ""))}${row("Its past", esc(f.past || ""))}</details>
      ${f.log.length ? `<details class="fa-more"><summary>What has changed (${f.log.length})</summary><ol class="tw-hist" reversed>${f.log.slice().reverse().map(l => `<li><span class="kn">${esc(l.when || "")}</span> ${esc(l.what)}</li>`).join("")}</ol></details>` : ""}</article>`;
  }
  // the web of how the factions stand, round a circle: green for allies, red for enemies, dashed for wary
  function web() {
    const L = ids().map(fac); if (L.length < 2) return "";
    const W = 320, H = 280, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 48, pos = {}; L.forEach((f, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / L.length; pos[f.id] = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
    const col = k => ({ war: "#b0161b", hostile: "#c0392b", wary: "#a07c10", neutral: "#8a8f8b", friendly: "#3f8a4f", allied: "#2f6b3a" })[k] || "#8a8f8b";
    const lines = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j], k = a.rels[b.id] || b.rels[a.id] || "neutral"; if (k === "neutral") continue; const [x1, y1] = pos[a.id], [x2, y2] = pos[b.id]; lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col(k)}" stroke-width="${Math.abs(stanceOf(k)[2]) + 1}"${k === "wary" ? ' stroke-dasharray="6 5"' : ""}><title>${esc(a.n)} and ${esc(b.n)}: ${stanceOf(k)[1]}</title></line>`); }
    return `<svg class="fa-web" viewBox="0 0 ${W} ${H}" role="img" aria-label="How the factions stand">${lines.join("")}${L.map(f => { const [x, y] = pos[f.id]; return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="${esc(f.color)}"/><text x="${Math.max(60, Math.min(W - 60, x)).toFixed(1)}" y="${(y + (y < cy ? -17 : 30)).toFixed(1)}" text-anchor="middle">${esc(f.n.length > 22 ? f.n.slice(0, 20) + "…" : f.n)}</text></g>`; }).join("")}</svg><p class="t-small"><span style="color:#3f8a4f">━</span> friends and allies · <span style="color:#a07c10">┅</span> wary · <span style="color:#c0392b">━</span> hostile, at war</p>`;
  }
  function peopleHTML() {
    const L = lived(); if (!L.length) return `<p class="kn">No one in the cast has a day written for them yet (sched, home, work on the cast: references/table.md, section 19).</p>`;
    const t = nowAt();
    return `<p class="t-small">Where each of them is ${esc(t.long ? "on " + t.long + ", " + t.time : "now")}, by their day, their week and what has happened to them. Move someone, or change how they are; the world's events do the same.</p><div class="fa-people">${L.map(([id, c]) => {
      const w = whereNow(id) || {}, L2 = lifeOf(id), fs = factionsOf(id).map(fac).filter(Boolean), mv = UI.move === id;
      return `<div class="fa-person"><div class="fa-ph"><b>${esc(c.n || id)}</b>${fs.map(f => `<span class="fa-tag" style="--fa:${esc(f.color)}">${esc(f.n)}</span>`).join(" ")}</div>
        <div class="fa-now">${w.at ? go(w.at) : w.status ? "" : `<span class="kn">unknown</span>`}${w.doing ? ` <span class="t-small">${esc(w.doing)}</span>` : ""}${w.by === "moved" ? `<br><span class="kn">moved${w.until ? ", until " + esc(A.worldTime.at(w.until).short) : ""}</span> <button type="button" class="t-link" data-fa="back" data-id="${esc(id)}">back to their day</button>` : ""}</div>
        <div class="t-row"><select class="t-in" data-fa="status" data-id="${esc(id)}" aria-label="How ${esc(c.n)} is">${STATUS.map(([k, l]) => `<option value="${k}"${(L2.status || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select><button type="button" class="t-link" data-fa="move" data-id="${esc(id)}">${mv ? "cancel" : "move them"}</button></div>
        ${mv ? `<form class="t-row fa-moveform" data-fa="moveto" data-id="${esc(id)}"><select class="t-in" name="at">${placeOpts("")}</select><input class="t-in" name="doing" placeholder="doing what"><label class="kn">for <input class="t-in t-n" type="number" name="hours" min="0" placeholder="all"> hours</label><button class="t-mini">Move</button></form>` : ""}</div>`;
    }).join("")}</div>`;
  }
  function html() {
    const L = ids().map(fac);
    if (!L.length && !lived().length) return `<section class="t-card"><h3>${T.icon("board")} Factions and people</h3><p class="kn">This campaign has no factions or people's days written yet. The council gives them in table.js (ATLAS.factions) and on the cast (home, work, sched): who holds power and what they have, what they want and are doing about it, and where each important person is at each hour (references/table.md, section 19).</p></section>`;
    return `<div class="t-grid t-g2w"><div>${L.map(card).join("") || ""}</div><div>${L.length > 1 ? `<section class="t-card"><h3>How they stand</h3>${web()}</section>` : ""}<section class="t-card"><h3>The people, now</h3>${peopleHTML()}</section></div></div>`;
  }

  /* ---- what the game master does: every change is kept with the world's date, and can be changed back */
  const when = () => nowAt().short || "";
  function setFac(id, patch, what) { const s = Object.assign({}, stOf(id), patch); s.log = (s.log || []).concat({ when: when(), what }).slice(-30); S().set("factions", id, s); }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-fa]"); if (!b || ["SELECT", "FORM", "INPUT"].includes(b.tagName)) return;
    const k = b.dataset.fa, id = b.dataset.id, f = id && fac(id);
    if (k === "has" && f) { const v = Math.max(0, Math.min(5, (+f.has[b.dataset.k] || 0) + +b.dataset.d)); setFac(id, { has: Object.assign({}, stOf(id).has || {}, { [b.dataset.k]: v }) }, `${(HAS.find(h => h[0] === b.dataset.k) || [0, ""])[1].toLowerCase()} now ${v} of 5`); }
    else if (k === "step" && f) { const v = Math.max(0, Math.min([].concat(f.plan || []).length, (f.step || 0) + +b.dataset.d)); setFac(id, { step: v }, v >= [].concat(f.plan || []).length ? "the plan is done" : `the plan at step ${v + 1}: ${[].concat(f.plan)[v]}`); }
    else if (k === "move") UI.move = UI.move === id ? null : id;
    else if (k === "back") { const L = Object.assign({}, lifeOf(id)); delete L.at; delete L.doing; delete L.until; S().set("npcstate", id, L); }
    else return;
    setTimeout(paint, 60);
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.fa) return; const id = t.dataset.id;
    if (t.dataset.fa === "rel") { const o = t.dataset.o; for (const [a, b2] of [[id, o], [o, id]]) setFac(a, { rels: Object.assign({}, stOf(a).rels || {}, { [b2]: t.value }) }, `now ${stanceOf(t.value)[1].toLowerCase()} with ${(defs()[b2] || {}).n || b2}`); }
    else if (t.dataset.fa === "party") setFac(id, { party: t.value }, `${stanceOf(t.value)[1].toLowerCase()} toward the party`);
    else if (t.dataset.fa === "status") { const L = Object.assign({}, lifeOf(id), { status: t.value }); L.log = (L.log || []).concat({ when: when(), what: (STATUS.find(s => s[0] === t.value) || [0, ""])[1].toLowerCase() }).slice(-20); S().set("npcstate", id, L); }
    t.blur(); setTimeout(paint, 60);
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || f.dataset.fa !== "moveto") return; e.preventDefault();
    if (document.activeElement && f.contains(document.activeElement)) document.activeElement.blur();
    const at = f.elements.at.value; if (!at) return; const h = +f.elements.hours.value || 0, L = Object.assign({}, lifeOf(f.dataset.id), { at, doing: f.elements.doing.value.trim(), until: h ? nowM() + h * 60 : null });
    L.log = (L.log || []).concat({ when: when(), what: `to ${placeName(at)}` }).slice(-20); S().set("npcstate", f.dataset.id, L); UI.move = null; setTimeout(paint, 60);
  });
  function paint() { if (api.tab() === "factions") api.render(); }

  TU.addTab({ key: "factions", label: "Factions and people", icon: "board", group: "play", after: "time", desc: "Who holds power, what they have and want, how they stand; where everyone is now",
    html, status: () => { const n = ids().length, p = lived().length; return n || p ? [n && `${n} faction${n > 1 ? "s" : ""}`, p && `${p} ${p > 1 ? "people" : "person"}`].filter(Boolean).join(" · ") : "None in this campaign"; },
    init(store) { for (const c of ["factions", "npcstate", "clock"]) store.watch(c, () => paint()); } });

  // the copilot: where someone is now and what they belong to; the investigation: the factions as things to join to
  A.lives = { whereNow, factionsOf, about, fac, ids };
  if (St && St.extraEntities) St.extraEntities.push(() => ids().map(id => { const d = defs()[id]; return { ref: "faction:" + id, kind: "item", ik: "faction", name: d.n || id, sub: "A faction" + (d.kind ? ": " + d.kind : ""), text: [d.n, d.kind, d.wants, d.doing, [].concat(d.plan || []).join(" "), d.knows, d.inner, d.past].filter(Boolean).join(" "), facts: [d.wants && "Wants: " + d.wants, d.doing && "Doing: " + d.doing].filter(Boolean) }; }));
  if (A.consistency) A.consistency.add("factions", () => {
    const out = [], cast = A.castData || {}, pl = p => !!A.meta[p], push = (sev, kind, id, title, why, suggest) => out.push({ area: "people", sev, kind, id, title, why, evidence: [{ text: "table.js: " + id.split(/[>@~]/)[0] }], refs: [], suggest });
    for (const id of ids()) {
      const d = defs()[id], nm = d.n || id;
      if (d.leader && !cast[d.leader] && /^[a-z0-9-]+$/.test(d.leader)) push("warn", "faclead", id + ">lead", `${nm}'s leader is not in the cast`, `It names "${d.leader}" as its leader.`, "Name a person of the cast by id, or write the leader's name in full.");
      for (const p of [].concat(d.hq || [], d.territory || [])) if (p && !pl(p)) push("error", "facplace", id + "@" + p, `${nm} holds a place that is not in the campaign`, `It names "${p}".`, "Name the place meant.");
      for (const o of Object.keys(d.rels || {})) if (!defs()[o]) push("error", "facrel", id + "~" + o, `${nm} stands toward a faction that does not exist`, `It names "${o}".`, "Name the faction meant.");
      for (const o of Object.keys(d.rels || {})) if (defs()[o] && (defs()[o].rels || {})[id]) { const a = (fac(id).rels || {})[o], b = (fac(o).rels || {})[id]; if (a && b && Math.abs(stanceOf(a)[2] - stanceOf(b)[2]) >= 3 && id < o) push("warn", "facodd", id + "~" + o + "~odd", `${nm} and ${defs()[o].n || o} see each other very differently`, `${nm} is ${stanceOf(a)[1].toLowerCase()} toward them; they are ${stanceOf(b)[1].toLowerCase()} toward ${nm}.`, "If it is a deception or a misunderstanding, mark it intentional; else bring them closer."); }
    }
    for (const [cid, c] of Object.entries(cast)) {
      for (const p of [c.home, c.work].filter(Boolean)) if (!pl(p)) push("error", "lifeplace", "cast:" + cid + "@" + p, `${c.n || cid}'s home or work is not a place of the campaign`, `It names "${p}".`, "Name the place meant.");
      for (const day of [c.sched || []].concat(Object.values(c.week || {}))) {
        for (const [r, at] of day) if (at && !pl(at)) push("error", "lifeplace", "cast:" + cid + "@" + at, `${c.n || cid}'s day takes them to a place that is not in the campaign`, `At ${r} they are at "${at}".`, "Name the place meant.");
        for (let h = 0; h < 24; h++) { const here = day.filter(([r]) => inRange(r, h)); if (here.length > 1 && new Set(here.map(x => x[1])).size > 1) { push("warn", "lifetwice", "cast:" + cid + "~" + h, `${c.n || cid} is in two places at ${String(h).padStart(2, "0")}:00`, `Their day has them at ${here.map(x => placeName(x[1])).join(" and ")} at once.`, "Make the hours of their day follow one another."); break; } }
      }
      for (const f of [].concat(c.factions || [])) if (!defs()[f]) push("error", "lifefac", "cast:" + cid + ">" + f, `${c.n || cid} belongs to a faction that does not exist`, `They name "${f}".`, "Name the faction meant.");
    }
    return out;
  });
})(ATLAS);
