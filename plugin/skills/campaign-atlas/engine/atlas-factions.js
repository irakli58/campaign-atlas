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
  // (the powers the game master makes or details on the page (the user, 17 Nov 2026: "anything Atlas can generate
  // automatically, I should also be able to create, edit, or control manually"; docs/requests/2026-11-17-manual-
  // civilization-editor.md): collection "factiondefs", one document a power, laid over the written one of that id or
  // standing alone; a removed one of their own is marked off, never deleted, so nothing joined to it breaks)
  const ownDefs = () => { try { return (S() && S().get("factiondefs")) || {}; } catch (e) { return {}; } };
  const defs = () => { const out = Object.assign({}, A.factionsData || {}); for (const [id, d] of Object.entries(ownDefs())) { if (!d) continue; if (d.off) { if (!(A.factionsData || {})[id]) delete out[id]; continue; } out[id] = Object.assign({}, out[id] || {}, d); } return out; };
  // the kinds of power, by the campaign's age (science fiction has its own; none is forced on any campaign)
  const KINDS_OLD = ["Kingdom", "Empire", "Country", "City-state", "Republic", "Principality", "Duchy", "Tribal confederation", "Theocracy", "Merchant guild", "Religious order", "Church", "Criminal organisation", "Noble house", "Rebel movement", "Secret society", "Political party", "Mercenary company", "Other"];
  const KINDS_NEW = ["Interstellar empire", "Planetary government", "Federation", "Independent colony", "Corporation", "Corporate territory", "Star-system alliance", "Trade consortium", "Military junta", "Rebel movement", "Criminal syndicate", "Religious order", "Political party", "Secret society", "Other"];
  const futureEra = () => { try { return String((A.table && A.table.era ? A.table.era() : "") || (A.config || {}).era || "").toLowerCase() === "future"; } catch (e) { return false; } };
  // treaties and standing arrangements between two powers, beside how they stand (STANCE); "vassal" and "tributary"
  // have a direction (which of the two is the vassal)
  const TREATY = [["trade", "Trade partners"], ["nap", "Non-aggression pact"], ["defence", "Defensive alliance"], ["vassal", "Vassal and overlord"], ["tribute", "Tributary"], ["embargo", "Embargo"], ["ceasefire", "Ceasefire"], ["occupation", "Occupation"], ["dispute", "Territorial dispute"], ["blockade", "Blockade"], ["marriage", "Dynastic marriage"]];
  const pairKey = (a, b) => [a, b].sort().join("~");
  const diplo = (a, b) => { try { return (S() && S().get("diplomacy", pairKey(a, b))) || null; } catch (e) { return null; } };
  const FIELDS = [["government", "Government"], ["leaderName", "Leader"], ["officials", "Officials"], ["population", "Population"], ["culture", "Culture"], ["religion", "Religion"], ["economy", "Economy and resources"], ["military", "Military strength"], ["laws", "Laws and policies"], ["history", "History"], ["custom", "Other (one 'name: value' a line)"]];
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
  const UI = { open: {}, move: null, web: null };
  function bars(f) { return `<div class="fa-has">${HAS.map(([k, l]) => { const v = Math.max(0, Math.min(5, +f.has[k] || 0)); return `<div class="fa-bar"><span class="kn">${l}</span><span class="fa-pips" aria-label="${l}: ${v} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span><button type="button" class="t-mini" data-fa="has" data-id="${esc(f.id)}" data-k="${k}" data-d="-1" aria-label="Less ${l}">−</button><button type="button" class="t-mini" data-fa="has" data-id="${esc(f.id)}" data-k="${k}" data-d="1" aria-label="More ${l}">+</button></div>`; }).join("")}</div>`; }
  function card(f) {
    const others = ids().filter(o => o !== f.id), plan = [].concat(f.plan || []);
    const row = (k, v) => v ? `<div class="tw-f"><span class="kn">${k}</span> ${v}</div>` : "";
    // the realms and places the world map says it holds (atlas-world.js: "Held by" on a realm or a place)
    let lands = []; try { lands = A.worldHeld ? A.worldHeld(Object.entries((S() && S().get("world")) || {}), f.id) : []; } catch (e) { lands = []; }
    // (folded: its name, how it stands to the party and what it is doing; the rest on a click; the UX review of 5 Nov 2026)
    const open = UI.open[f.id] != null ? UI.open[f.id] : ids().length <= 1, st0 = stanceOf(f.party || "neutral");
    return `<article class="t-card fa-card" style="--fa:${esc(f.color)}"><details class="fa-fold" data-fafold="${esc(f.id)}"${open ? " open" : ""}><summary class="fa-h"><i class="fa-dot"></i><h3>${esc(f.n || f.id)}</h3>${f.kind ? `<span class="kn">${esc(f.kind)}</span>` : ""}<span class="fa-sum"><span class="fa-st fa-st-${esc(f.party || "neutral")}">${esc(st0[1])} toward the party</span>${f.doing ? `<span class="kn">${esc(f.doing.length > 70 ? f.doing.slice(0, 68) + "…" : f.doing)}</span>` : ""}</span>${A.nav ? `<button type="button" class="t-mini fa-pk" data-uxpeek="faction:${esc(f.id)}" title="Its card, beside whatever is open">Card</button>` : ""}</summary>
      ${row("Led by", esc(personName(f.leader)))}${[].concat(f.members || []).length ? row("Members", esc([].concat(f.members).map(personName).join(", "))) : ""}${row("Seat", f.hq ? go(f.hq) : "")}${f.territory.length ? row("Holds", f.territory.map(go).join(", ")) : ""}${lands.length ? row("On the world map", esc(lands.join(", "))) : ""}
      ${bars(f)}${f.lacks ? row("Lacks", esc(f.lacks)) : ""}${row("Wants", esc(f.wants || ""))}
      ${plan.length ? `<div class="fa-plan"><span class="kn">Their plan</span><ol>${plan.map((p, i) => `<li class="${i < f.step ? "done" : i === f.step ? "now" : ""}">${esc(p)}</li>`).join("")}</ol><div class="t-row"><button type="button" class="t-mini" data-fa="step" data-id="${esc(f.id)}" data-d="-1">Back a step</button><button type="button" class="t-mini" data-fa="step" data-id="${esc(f.id)}" data-d="1">Next step</button>${f.clock ? `<span class="kn">and its clock: ${esc(((A.clocksData || []).find(c => c.id === f.clock) || {}).name || f.clock)}</span>` : ""}</div></div>` : ""}
      ${row("Doing now", esc(f.doing || ""))}
      ${f.capital ? row("Capital", go(f.capital)) : ""}${[].concat(f.settlements || []).length ? row("Its towns and cities", [].concat(f.settlements).map(go).join(", ")) : ""}${FIELDS.filter(([k]) => k !== "custom" && f[k]).map(([k, l]) => row(l, esc(f[k]))).join("")}${f.custom ? String(f.custom).split("\n").filter(l => l.trim()).map(l => { const i = l.indexOf(":"); return i > 0 ? row(esc(l.slice(0, i).trim()), esc(l.slice(i + 1).trim())) : row("", esc(l)); }).join("") : ""}
      ${(() => { let L = []; try { L = Object.entries((S() && S().get("world")) || {}).filter(([k, d]) => k.startsWith("l-") && d && d.owner === f.id && (d.res || d.imp)); } catch (e) { L = []; } return L.length ? row("Its towns produce", esc(L.map(([k, d]) => `${d.name || (A.meta[k.slice(2)] || {}).name || (((A.worldData || {}).locations || []).find(l => l.id === k.slice(2)) || {}).name || k.slice(2)}: ${[d.res, d.imp ? "needs " + d.imp : ""].filter(Boolean).join("; ")}`).join(" · "))) : ""; })()}
      ${tradeRow(f)}
      ${diploHTML(f, others)}
      <div class="t-row"><button type="button" class="t-mini" data-fa="edit" data-id="${esc(f.id)}">Edit its details</button>${ownDefs()[f.id] && !(A.factionsData || {})[f.id] ? `<button type="button" class="t-mini" data-fa="remove" data-id="${esc(f.id)}">Remove</button>` : ""}</div>
      ${UI.edit === f.id ? powerForm(f) : ""}
      <div class="fa-rels"><span class="kn">How they stand</span>${others.map(o => `<label class="fa-rel"><span>${esc(defs()[o].n || o)}</span> <select class="t-in" data-fa="rel" data-id="${esc(f.id)}" data-o="${esc(o)}">${stanceOpts(f.rels[o] || "neutral")}</select>${relWhy(f.id, o) ? `<small class="kn">${esc(relWhy(f.id, o))}</small>` : ""}</label>`).join("")}<label class="fa-rel"><span><b>Toward the party</b></span> <select class="t-in" data-fa="party" data-id="${esc(f.id)}">${stanceOpts(f.party)}</select></label></div>
      <details class="fa-more"><summary>What only you know</summary>${row("They know", esc(f.knows || ""))}${row("They believe, wrongly", esc(f.wrong || ""))}${row("Inside it", esc(f.inner || ""))}${row("Reputation", esc(f.rep || ""))}${row("Its past", esc(f.past || ""))}</details>
      ${f.log.length ? `<details class="fa-more"><summary>What has changed (${f.log.length})</summary><ol class="tw-hist" reversed>${f.log.slice().reverse().map(l => `<li><span class="kn">${esc(l.when || "")}</span> ${esc(l.what)}</li>`).join("")}</ol></details>` : ""}</details></article>`;
  }
  /* ---- the relationship web (the user's approved idea of 3 Nov 2026, the eleventh in reviews/2026-11-03-ideas.md:
     "factions' stances and the remembered bonds and grudges as a living diagram, joined to the existing board"): the
     party at its heart; the factions, how they stand to each other and to the party; the people of the cast, the
     factions they belong to and lead, the ties written for them, what they think of the party (as the copilot's Talk
     keeps it), and the bonds, rivalries, promises and threats the table remembers (Recorded sessions, kept). Drawn
     from the world as it is now, so it changes as the story does. One clicked shows every line it has and where each
     comes from; a person can be found on the board. */
  const WCOL = { war: "#b0161b", hostile: "#c0392b", wary: "#a07c10", friendly: "#3f8a4f", allied: "#2f6b3a", trusting: "#2f6b3a", afraid: "#a07c10", member: "#8a8f8b", leads: "#5b6166", tie: "#6f7f93", bond: "#7a4fa0", promise: "#2a8a8a", threat: "#8a1f1f" };
  const WSAY = { member: "belongs to", leads: "leads", tie: "knows", bond: "a bond or a rivalry", promise: "a promise", threat: "a threat", trusting: "trusts", afraid: "is afraid of" };
  const OPIN = { friendly: "friendly", trusting: "trusting", wary: "wary", afraid: "afraid", hostile: "hostile" };
  function webModel() {
    const nodes = [{ id: "party", kind: "party", label: "The party" }], edges = [], has = new Set(["party"]), cast = A.castData || {};
    const addN = (id, kind, label, color) => { if (!has.has(id)) { has.add(id); nodes.push({ id, kind, label, color }); } };
    const L = ids().map(fac).filter(Boolean), pn = id => (cast[id] || {}).n || id;
    for (const f of L) addN("f:" + f.id, "faction", f.n, f.color);
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j], k = a.rels[b.id] || b.rels[a.id] || "neutral"; if (k !== "neutral") edges.push({ a: "f:" + a.id, b: "f:" + b.id, k, why: relWhy(a.id, b.id) || relWhy(b.id, a.id), src: "Factions and people" }); }
    for (const f of L) if (f.party && f.party !== "neutral") edges.push({ a: "f:" + f.id, b: "party", k: f.party, why: "", src: "Factions and people" });
    for (const id of Object.keys(cast)) for (const fid of factionsOf(id)) if (has.has("f:" + fid)) { addN("p:" + id, "person", pn(id)); edges.push({ a: "p:" + id, b: "f:" + fid, k: (defs()[fid] || {}).leader === id ? "leads" : "member", why: "", src: "Factions and people" }); }
    for (const [id, c] of Object.entries(cast)) if (c && c.ties && typeof c.ties === "object") for (const [to, why] of Object.entries(c.ties)) {
      const t = cast[to] ? to : Object.keys(cast).find(k => String(cast[k].n || "").toLowerCase() === String(to).toLowerCase()); if (!t || t === id) continue;
      addN("p:" + id, "person", pn(id)); addN("p:" + t, "person", pn(t)); const e = edges.find(x => x.k === "tie" && x.a === "p:" + t && x.b === "p:" + id);
      if (e) e.why += " / " + why; else edges.push({ a: "p:" + id, b: "p:" + t, k: "tie", why: String(why || ""), src: "The cast" });
    }
    for (const d of Object.values((S() && S().get("talks")) || {})) { const id = d && String(d.who || "").startsWith("cast:") ? d.who.slice(5) : null; if (!id || !cast[id] || !OPIN[d.opinion]) continue; addN("p:" + id, "person", pn(id)); edges.push({ a: "p:" + id, b: "party", k: OPIN[d.opinion], why: "As they think of the party, from talking with them", src: "Talk" }); }
    for (const m of Object.values((S() && S().get("memory")) || {})) {
      if (!m || m.state !== "kept" || !["bond", "promise", "threat"].includes(m.kind)) continue;
      const cs = [...new Set((m.who || []).filter(w => String(w).startsWith("cast:") && cast[w.slice(5)]).map(w => "p:" + w.slice(5)))], party = (m.who || []).some(w => !String(w).startsWith("cast:"));
      cs.forEach(n => addN(n, "person", pn(n.slice(2))));
      if (cs.length >= 2) edges.push({ a: cs[0], b: cs[1], k: m.kind, why: m.text, src: "Remembered, session " + (m.session || "?") });
      else if (cs.length === 1) edges.push({ a: cs[0], b: "party", k: m.kind, why: m.text, src: "Remembered, session " + (m.session || "?") });
      else if (party && (m.factions || []).length) for (const f of m.factions) if (has.has("f:" + f)) edges.push({ a: "f:" + f, b: "party", k: m.kind, why: m.text, src: "Remembered, session " + (m.session || "?") });
    }
    return { nodes, edges };
  }
  // laid out by springs and pushes, always the same for the same web: the party in the middle, factions round it, each
  // person drawn toward the factions and people they are joined to
  function webLayout(M, W, H) {
    const P = {}, n = M.nodes.length, fs = M.nodes.filter(x => x.kind === "faction");
    M.nodes.forEach((x, i) => { const fi = fs.indexOf(x), a = x.kind === "faction" ? -Math.PI / 2 + fi * 2 * Math.PI / Math.max(1, fs.length) : i * 2.39996; const r = x.kind === "party" ? 0 : x.kind === "faction" ? .3 : .42; P[x.id] = [W / 2 + Math.cos(a) * r * W, H / 2 + Math.sin(a) * r * H]; });
    const k = Math.sqrt(W * H / Math.max(4, n)) * .62;
    for (let it = 0; it < 260; it++) {
      const D = {}; for (const x of M.nodes) D[x.id] = [0, 0];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = M.nodes[i].id, b = M.nodes[j].id, dx = P[a][0] - P[b][0], dy = P[a][1] - P[b][1], d = Math.max(1, Math.hypot(dx, dy)), f = k * k / d; D[a][0] += dx / d * f; D[a][1] += dy / d * f; D[b][0] -= dx / d * f; D[b][1] -= dy / d * f; }
      for (const e of M.edges) { const dx = P[e.a][0] - P[e.b][0], dy = P[e.a][1] - P[e.b][1], d = Math.max(1, Math.hypot(dx, dy)), f = d * d / k * (e.k === "member" || e.k === "leads" ? 1.2 : .8); D[e.a][0] -= dx / d * f; D[e.a][1] -= dy / d * f; D[e.b][0] += dx / d * f; D[e.b][1] += dy / d * f; }
      const tmax = 18 * (1 - it / 260) + 1;
      for (const x of M.nodes) { if (x.kind === "party") { P.party = [W / 2, H / 2]; continue; } const [dx, dy] = D[x.id], d = Math.max(.01, Math.hypot(dx, dy)), s = Math.min(d, tmax); P[x.id][0] = Math.max(60, Math.min(W - 60, P[x.id][0] + dx / d * s + (W / 2 - P[x.id][0]) * .004)); P[x.id][1] = Math.max(26, Math.min(H - 26, P[x.id][1] + dy / d * s + (H / 2 - P[x.id][1]) * .004)); }
    }
    return P;
  }
  function web() {
    const M = webModel(); if (M.nodes.length < 3) return "";
    const W = 640, H = 470, P = webLayout(M, W, H), sel = UI.web && M.nodes.some(x => x.id === UI.web) ? UI.web : null, near = new Set(sel ? M.edges.filter(e => e.a === sel || e.b === sel).flatMap(e => [e.a, e.b]) : []);
    // (two lines between the same pair bend apart, so both are seen)
    const pairs = {};
    const lines = M.edges.map(e => { const pk = [e.a, e.b].sort().join("|"), ix = pairs[pk] = (pairs[pk] || 0) + 1, bend = .08 * Math.ceil(ix / 2) * (ix % 2 ? 1 : -1) * (e.a < e.b ? 1 : -1), [x1, y1] = P[e.a], [x2, y2] = P[e.b], on = !sel || e.a === sel || e.b === sel, dash = ["wary", "afraid", "tie", "promise", "threat"].includes(e.k) ? (e.k === "tie" ? "2 4" : "6 5") : "", w = e.k === "war" || e.k === "allied" || e.k === "leads" ? 3 : e.k === "member" ? 1.2 : 2;
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}Q${((x1 + x2) / 2 + (y2 - y1) * bend).toFixed(1)} ${((y1 + y2) / 2 - (x2 - x1) * bend).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${WCOL[e.k] || WCOL[stanceOf(e.k)[0]] || "#8a8f8b"}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""} opacity="${on ? .9 : .12}"><title>${esc(label(M, e.a))} – ${esc(label(M, e.b))}: ${esc((WSAY[e.k] || stanceOf(e.k)[1]).toLowerCase())}${e.why ? ". " + esc(e.why) : ""}</title></path>`; }).join("");
    const dots = M.nodes.map(x => { const [cx, cy] = P[x.id], on = !sel || x.id === sel || near.has(x.id), r = x.kind === "party" ? 15 : x.kind === "faction" ? 11 : 6.5;
      return `<g class="fw-n fw-${x.kind}${x.id === sel ? " sel" : ""}" data-fa="websel" data-id="${esc(x.id)}" tabindex="0" role="button" aria-label="${esc(x.label)}" opacity="${on ? 1 : .3}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${x.kind === "faction" ? esc(x.color || "#777") : x.kind === "party" ? "#d9a227" : "#e8e4da"}"/><text x="${cx.toFixed(1)}" y="${(cy + r + 12).toFixed(1)}" text-anchor="middle">${esc(x.label.length > 24 ? x.label.slice(0, 22) + "…" : x.label)}</text></g>`; }).join("");
    const list = sel ? M.edges.filter(e => e.a === sel || e.b === sel).map(e => { const o = e.a === sel ? e.b : e.a; return `<li><b style="color:${WCOL[e.k] || "inherit"}">${esc(WSAY[e.k] || stanceOf(e.k)[1])}</b> ${esc(label(M, o))}${e.why ? `: <span class="t-small">${esc(e.why)}</span>` : ""} <span class="kn">(${esc(e.src)})</span></li>`; }).join("") : "";
    return `<svg class="fa-web fa-web2" viewBox="0 0 ${W} ${H}" role="img" aria-label="The web of who stands with whom">${lines}${dots}</svg>
      <p class="t-small fw-key"><span style="color:#3f8a4f">━</span> friends, allies · <span style="color:#a07c10">┅</span> wary, afraid · <span style="color:#c0392b">━</span> hostile, at war · <span style="color:#8a8f8b">─</span> belongs to · <span style="color:#6f7f93">┈</span> knows · <span style="color:#7a4fa0">━</span> bond · <span style="color:#2a8a8a">┅</span> promise · <span style="color:#8a1f1f">┅</span> threat</p>
      ${sel ? `<div class="fw-sel"><h4>${esc(label(M, sel))}</h4>${list ? `<ul class="t-ul">${list}</ul>` : `<p class="kn">Nothing joins them yet.</p>`}<div class="t-row">${sel.startsWith("p:") && A.nav ? `<button type="button" class="t-mini" data-uxpeek="person:cast:${esc(sel.slice(2))}">Their card</button>` : sel.startsWith("f:") && A.nav ? `<button type="button" class="t-mini" data-uxpeek="faction:${esc(sel.slice(2))}">Its card</button>` : ""}${sel.startsWith("p:") ? `<button type="button" class="t-mini" data-fa="webboard" data-id="${esc(sel)}">Find them on the board</button>` : ""}<button type="button" class="t-mini" data-fa="websel" data-id="">Show everyone</button></div></div>` : `<p class="t-small kn">Click someone for every line they have and where it comes from.</p>`}`;
  }
  const label = (M, id) => (M.nodes.find(x => x.id === id) || {}).label || id;
  function peopleHTML() {
    const L = lived(); if (!L.length) return `<p class="kn">No one in the cast has a day written for them yet (sched, home, work on the cast: references/table.md, section 19).</p>`;
    const t = nowAt();
    return `<p class="t-small">Where each of them is ${esc(t.long ? "on " + t.long + ", " + t.time : "now")}, by their day, their week and what has happened to them. Move someone, or change how they are; the world's events do the same.</p><div class="fa-people">${L.map(([id, c]) => {
      const w = whereNow(id) || {}, L2 = lifeOf(id), fs = factionsOf(id).map(fac).filter(Boolean), mv = UI.move === id;
      return `<div class="fa-person"><div class="fa-ph">${A.nav ? `<button type="button" class="t-link fa-pn" data-uxpeek="person:cast:${esc(id)}" title="Their card"><b>${esc(c.n || id)}</b></button>` : `<b>${esc(c.n || id)}</b>`}${fs.map(f => `<span class="fa-tag" style="--fa:${esc(f.color)}">${esc(f.n)}</span>`).join(" ")}</div>
        <div class="fa-now">${w.at ? go(w.at) : w.status ? "" : `<span class="kn">unknown</span>`}${w.doing ? ` <span class="t-small">${esc(w.doing)}</span>` : ""}${w.by === "moved" ? `<br><span class="kn">moved${w.until ? ", until " + esc(A.worldTime.at(w.until).short) : ""}</span> <button type="button" class="t-link" data-fa="back" data-id="${esc(id)}">back to their day</button>` : ""}</div>
        <div class="t-row"><select class="t-in" data-fa="status" data-id="${esc(id)}" aria-label="How ${esc(c.n)} is">${STATUS.map(([k, l]) => `<option value="${k}"${(L2.status || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select><button type="button" class="t-link" data-fa="move" data-id="${esc(id)}">${mv ? "cancel" : "move them"}</button></div>
        ${mv ? `<form class="t-row fa-moveform" data-fa="moveto" data-id="${esc(id)}"><select class="t-in" name="at">${placeOpts("")}</select><input class="t-in" name="doing" placeholder="doing what"><label class="kn">for <input class="t-in t-n" type="number" name="hours" min="0" placeholder="all"> hours</label><button class="t-mini">Move</button></form>` : ""}</div>`;
    }).join("")}</div>`;
  }
  /* ---- diplomacy between two powers: how they stand, their treaties, why and how things are now; edited in place */
  // trade between the powers, from what their towns produce and need (the place form's "produces" and "needs" on the
  // world map): what this power could buy from each other and sell to it, and what stands in the way (war, an
  // embargo). Worked out each time, nothing kept: change a town's goods and it follows (the manual civilization
  // editor's request of 17 Nov 2026)
  const goodsOf = t => String(t || "").toLowerCase().split(/,|;|\band\b|\//).map(x => x.trim().replace(/^(some|fine|raw)\s+/, "").replace(/s$/, "")).filter(x => x.length > 2);
  const sameGood = (a, b) => a === b || a.includes(b) || b.includes(a);
  function tradeBook() {
    let docs = {}; try { docs = (S() && S().get("world")) || {}; } catch (e) { docs = {}; }
    const by = {}; for (const [k, d] of Object.entries(docs)) if (k.startsWith("l-") && d && d.owner) { const b = by[d.owner] = by[d.owner] || { res: [], imp: [] }; b.res.push(...goodsOf(d.res)); b.imp.push(...goodsOf(d.imp)); }
    return by;
  }
  function tradeRow(f) {
    const by = tradeBook(), me = by[f.id]; if (!me || !(me.res.length || me.imp.length)) return "";
    const all = defs(), out = [];
    for (const [o, them] of Object.entries(by)) {
      if (o === f.id || !all[o]) continue;
      const buy = [...new Set(me.imp.filter(g => them.res.some(h => sameGood(g, h))))], sell = [...new Set(me.res.filter(g => them.imp.some(h => sameGood(g, h))))];
      if (!buy.length && !sell.length) continue;
      const rel = (fac(f.id) || {}).rels || {}, st = rel[o], d = diplo(f.id, o), tr = ((d && d.treaties) || []).map(t => String(t).split(":")[0]);
      const block = st === "war" ? "blocked: at war" : tr.includes("embargo") ? "blocked: an embargo" : st === "hostile" ? "hard: hostile" : tr.includes("trade") ? "trade partners" : "";
      out.push(`${(all[o] || {}).n || o}: ${[buy.length && "buys " + buy.join(", "), sell.length && "sells " + sell.join(", ")].filter(Boolean).join("; ")}${block ? " (" + block + ")" : ""}`);
    }
    return out.length ? `<div class="tw-f"><span class="kn">Trade with other powers</span> ${esc(out.join(" · "))}</div>` : "";
  }
  function diploHTML(f, others) {
    const lines = others.map(o => { const d = diplo(f.id, o); if (!d || !((d.treaties || []).length || d.why || d.now)) return ""; const tr = (d.treaties || []).map(t => { const [k, who] = String(t).split(":"), L = (TREATY.find(x => x[0] === k) || [0, k])[1]; return k === "vassal" || k === "tribute" ? `${L}: ${esc((defs()[who] || {}).n || who)} the ${k === "vassal" ? "vassal" : "tributary"}` : L; }); return `<li><b>${esc(defs()[o].n || o)}</b>${tr.length ? ` <span class="fa-tr">${tr.map(esc).join(" · ")}</span>` : ""}${d.why ? `<br><span class="kn">Why:</span> ${esc(d.why)}` : ""}${d.now ? `<br><span class="kn">Now:</span> ${esc(d.now)}` : ""} <button type="button" class="t-mini" data-fa="diplo" data-id="${esc(f.id)}" data-o="${esc(o)}">Change</button></li>`; }).filter(Boolean);
    const sel = UI.dip && UI.dip[0] === f.id ? UI.dip[1] : null;
    return `<div class="fa-dip"><span class="kn">Diplomacy</span>${lines.length ? `<ul class="fa-dipl">${lines.join("")}</ul>` : ""}${others.length ? `<div class="t-row"><select class="t-in" data-fa="dippick" data-id="${esc(f.id)}"><option value="">Treaties, a dispute, a war's reason… with</option>${others.map(o => `<option value="${esc(o)}"${o === sel ? " selected" : ""}>${esc(defs()[o].n || o)}</option>`).join("")}</select></div>` : ""}${sel ? dipForm(f.id, sel) : ""}</div>`;
  }
  function dipForm(a, b) {
    const d = diplo(a, b) || {}, has = new Set(d.treaties || []), nb = esc((defs()[b] || {}).n || b), na = esc((defs()[a] || {}).n || a);
    const box = (k, l) => k === "vassal" || k === "tribute" ? `<label><input type="checkbox" name="t" value="${k}:${esc(b)}"${has.has(k + ":" + b) ? " checked" : ""}> ${l} (${nb} the ${k === "vassal" ? "vassal" : "tributary"})</label><label><input type="checkbox" name="t" value="${k}:${esc(a)}"${has.has(k + ":" + a) ? " checked" : ""}> ${l} (${na} the ${k === "vassal" ? "vassal" : "tributary"})</label>` : `<label><input type="checkbox" name="t" value="${k}"${has.has(k) ? " checked" : ""}> ${l}</label>`;
    return `<form class="fa-dipf" data-fa="dipform" data-id="${esc(a)}" data-o="${esc(b)}"><p class="kn">${na} and ${nb}: how they stand is chosen above; here what binds or divides them.</p><div class="fa-tbox">${TREATY.map(([k, l]) => box(k, l)).join("")}</div>
      <label>Why <input class="t-in" name="why" value="${esc(d.why || "")}" placeholder="e.g. both claim the Northern Mountains"></label><label>How things are now <input class="t-in" name="now" value="${esc(d.now || "")}" placeholder="e.g. border skirmishes and an unstable ceasefire"></label>
      <div class="t-row"><button type="submit" class="t-btn prim">Keep it</button><button type="button" class="t-btn" data-fa="dipclose" data-id="${esc(a)}">Close</button></div></form>`;
  }
  /* ---- conflicts as their own entries (the user, 17 Nov 2026: "The Northern Border War. Participants: Valoria and
          Drakmor. Cause: disputed territory. Status: ongoing"): collection "conflicts"; its sides are powers; nothing in
          the world changes because of one unless the game master says (Set them at war) */
  const CSTAT = [["brewing", "Brewing"], ["ongoing", "Ongoing"], ["ceasefire", "In a ceasefire"], ["frozen", "Frozen"], ["ended", "Ended"]];
  const conflicts = () => { try { return Object.entries((S() && S().get("conflicts")) || {}).filter(([, c]) => c && !c.off); } catch (e) { return []; } };
  function conflictsHTML() {
    const L = conflicts(), nm = id => esc((defs()[id] || {}).n || id);
    return `<section class="t-card fa-conf"><h3>Conflicts</h3>${L.length ? L.map(([id, c]) => `<div class="fa-cf"><b>${esc(c.n)}</b> <span class="kn">${esc((CSTAT.find(x => x[0] === c.status) || [0, ""])[1])}</span><br>${[].concat(c.a || []).map(nm).join(", ") || "—"} <i>against</i> ${[].concat(c.b || []).map(nm).join(", ") || "—"}${c.cause ? `<br><span class="kn">Cause:</span> ${esc(c.cause)}` : ""}${c.aims ? `<br><span class="kn">What each side wants:</span> ${esc(c.aims)}` : ""}${c.land ? `<br><span class="kn">Disputed:</span> ${esc(c.land)}` : ""}${[].concat(c.places || []).length ? `<br><span class="kn">Where it matters:</span> ${[].concat(c.places).map(go).join(", ")}` : ""}${c.outcomes ? `<br><span class="kn">How it might end:</span> ${esc(c.outcomes)}` : ""}${c.past ? `<br><span class="kn">So far:</span> ${esc(c.past)}` : ""}
        <div class="t-row"><button type="button" class="t-mini" data-fa="cfedit" data-id="${esc(id)}">Change</button>${c.status !== "ended" && [].concat(c.a || []).length && [].concat(c.b || []).length ? `<button type="button" class="t-mini" data-fa="cfwar" data-id="${esc(id)}" title="Set every power on one side at war with every power on the other (their stances; you can set them back)">Set them at war</button>` : ""}<button type="button" class="t-mini" data-fa="cfoff" data-id="${esc(id)}">Remove</button></div>${UI.cf === id ? conflictForm(id, c) : ""}</div>`).join("") : `<p class="kn">None yet. A war, a rebellion, a feud between houses, a border dispute…</p>`}
      <div class="t-row"><button type="button" class="t-btn" data-fa="cfnew">+ A conflict</button></div>${UI.cf === "+new" ? conflictForm("", {}) : ""}</section>`;
  }
  function conflictForm(id, c) {
    const pw = ids().map(x => [x, (defs()[x] || {}).n || x]), places = Object.entries(A.meta || {}).filter(([, m]) => m && m.name).map(([pid, m]) => [pid, m.name]), side = (k, sel) => `<fieldset class="fa-setl"><legend>${k === "a" ? "One side" : "The other side"}</legend>${pw.map(([x, n]) => `<label><input type="checkbox" name="${k}" value="${esc(x)}"${[].concat(sel || []).includes(x) ? " checked" : ""}> ${esc(n)}</label>`).join("")}</fieldset>`;
    return `<form class="fa-pf" data-fa="cfform" data-id="${esc(id)}"><label>Name <input class="t-in" name="n" required value="${esc(c.n || "")}" placeholder="e.g. The Northern Border War"></label>${side("a", c.a)}${side("b", c.b)}
      <label>Status <select class="t-in" name="status">${CSTAT.map(([k, l]) => `<option value="${k}"${(c.status || "ongoing") === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>Cause <input class="t-in" name="cause" value="${esc(c.cause || "")}"></label><label>What each side wants <input class="t-in" name="aims" value="${esc(c.aims || "")}"></label><label>Disputed land <input class="t-in" name="land" value="${esc(c.land || "")}" placeholder="e.g. the Northern Mountains"></label>
      <fieldset class="fa-setl"><legend>Where it matters</legend>${places.map(([pid, n]) => `<label><input type="checkbox" name="pl" value="${esc(pid)}"${[].concat(c.places || []).includes(pid) ? " checked" : ""}> ${esc(n)}</label>`).join("")}</fieldset>
      <label>How it might end<textarea class="t-in" name="outcomes" rows="2">${esc(c.outcomes || "")}</textarea></label><label>What has happened so far<textarea class="t-in" name="past" rows="2">${esc(c.past || "")}</textarea></label>
      <div class="t-row"><button type="submit" class="t-btn prim">Keep it</button><button type="button" class="t-btn" data-fa="cfclose">Cancel</button></div></form>`;
  }
  /* ---- a power made or detailed by hand: only its name is needed; everything else may come later */
  function powerForm(f) {
    f = f || {}; const places = Object.entries(A.meta || {}).filter(([, m]) => m && m.name).map(([id, m]) => [id, m.name]).sort((x, y) => x[1].localeCompare(y[1])), kinds = futureEra() ? KINDS_NEW : KINDS_OLD;
    const setl = new Set([].concat(f.settlements || []));
    return `<form class="fa-pf" data-fa="powerform" data-id="${esc(f.id || "")}"><h4 class="t-h4">${f.id ? "Its details" : "A new power"}</h4>
      <label>Name <input class="t-in" name="n" required value="${esc(f.n || "")}" placeholder="e.g. The Kingdom of Valoria"></label>
      <label>What it is <select class="t-in" name="kind"><option value="">—</option>${kinds.map(k => `<option${(f.kind || "") === k ? " selected" : ""}>${esc(k)}</option>`).join("")}</select></label>
      <label>Its colour <input type="color" name="color" value="${esc(f.color || COLORS[ids().length % COLORS.length])}"></label>
      <label>Capital <select class="t-in" name="capital"><option value="">—</option>${places.map(([id, n]) => `<option value="${esc(id)}"${f.capital === id ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
      <details${f.id ? " open" : ""}><summary>More (all optional)</summary>
        ${FIELDS.map(([k, l]) => k === "history" || k === "custom" || k === "laws" ? `<label>${esc(l)}<textarea class="t-in" name="${k}" rows="2">${esc(f[k] || "")}</textarea></label>` : `<label>${esc(l)} <input class="t-in" name="${k}" value="${esc(f[k] || "")}"></label>`).join("")}
        <label>Wants <input class="t-in" name="wants" value="${esc(f.wants || "")}"></label>
        <fieldset class="fa-setl"><legend>Its towns and cities</legend>${places.map(([id, n]) => `<label><input type="checkbox" name="setl" value="${esc(id)}"${setl.has(id) ? " checked" : ""}> ${esc(n)}</label>`).join("")}</fieldset>
      </details>
      <div class="t-row"><button type="submit" class="t-btn prim">${f.id ? "Keep it" : "Make it"}</button><button type="button" class="t-btn" data-fa="closeform">Cancel</button></div>
      <p class="kn">Its borders are painted on the world map (Edit map, + Realm, held by it); its relations above, and Diplomacy for treaties.</p></form>`;
  }
  function html() {
    const L = ids().map(fac), addBar = `<section class="t-card fa-add"><div class="t-row"><button type="button" class="t-btn prim" data-fa="new">+ A power</button><span class="kn">A country, kingdom, empire, guild, church, rebels, corporation… made by hand; only a name is needed.</span></div>${UI.edit === "+new" ? powerForm(null) : ""}</section>`;
    if (!L.length && !lived().length) return addBar + `<section class="t-card"><h3>${T.icon("board")} Factions and people</h3><p class="kn">No factions or people's days yet: make a power above, or the council gives them in table.js (ATLAS.factions).</p></section>`;
    if (!L.length && !lived().length) return `<section class="t-card"><h3>${T.icon("board")} Factions and people</h3><p class="kn">This campaign has no factions or people's days written yet. The council gives them in table.js (ATLAS.factions) and on the cast (home, work, sched): who holds power and what they have, what they want and are doing about it, and where each important person is at each hour (references/table.md, section 19).</p></section>`;
    const wb = web();
    return `<div class="t-grid t-g2w"><div>${addBar}${ids().length ? conflictsHTML() : ""}${wb ? `<section class="t-card fw-card"><h3>The web</h3>${wb}</section>` : ""}${L.map(card).join("") || ""}</div><div><section class="t-card"><h3>The people, now</h3>${peopleHTML()}</section></div></div>`;
  }

  // (a faction's fold remembered while the page is open)
  document.addEventListener("toggle", e => { const d = e.target; if (d && d.dataset && d.dataset.fafold) UI.open[d.dataset.fafold] = d.open; }, true);
  /* ---- what the game master does: every change is kept with the world's date, and can be changed back */
  const when = () => nowAt().short || "";
  function setFac(id, patch, what) { const s = Object.assign({}, stOf(id), patch); s.log = (s.log || []).concat({ when: when(), what }).slice(-30); S().set("factions", id, s); }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-fa]"); if (!b || ["SELECT", "FORM", "INPUT"].includes(b.tagName)) return;
    const k = b.dataset.fa, id = b.dataset.id, f = id && fac(id);
    if (k === "has" && f) { const v = Math.max(0, Math.min(5, (+f.has[b.dataset.k] || 0) + +b.dataset.d)); setFac(id, { has: Object.assign({}, stOf(id).has || {}, { [b.dataset.k]: v }) }, `${(HAS.find(h => h[0] === b.dataset.k) || [0, ""])[1].toLowerCase()} now ${v} of 5`); }
    else if (k === "step" && f) { const v = Math.max(0, Math.min([].concat(f.plan || []).length, (f.step || 0) + +b.dataset.d)); setFac(id, { step: v }, v >= [].concat(f.plan || []).length ? "the plan is done" : `the plan at step ${v + 1}: ${[].concat(f.plan)[v]}`); }
    else if (k === "move") UI.move = UI.move === id ? null : id;
    else if (k === "websel") UI.web = id && UI.web !== id ? id : null;
    // (a person of the web on the board: its card brought into view and marked for a moment)
    else if (k === "webboard") { api.open("board"); setTimeout(() => { const c = document.querySelector(`#tBoard [data-bd="${CSS.escape(id)}"]`); if (c) { c.scrollIntoView({ block: "center", inline: "center" }); c.classList.add("t-bflash"); setTimeout(() => c.classList.remove("t-bflash"), 2400); } }, 500); return; }
    else if (k === "back") { const L = Object.assign({}, lifeOf(id)); delete L.at; delete L.doing; delete L.until; S().set("npcstate", id, L); }
    else if (k === "new") UI.edit = UI.edit === "+new" ? null : "+new";
    else if (k === "edit") { UI.edit = UI.edit === id ? null : id; UI.open[id] = true; }
    else if (k === "closeform") UI.edit = null;
    else if (k === "remove" && f) { if (!confirm(`Remove ${f.n || id}? Its relations and what refers to it are kept, should it come back.`)) return; S().set("factiondefs", id, Object.assign({}, ownDefs()[id] || {}, { off: true })); }
    else if (k === "diplo") { UI.dip = [id, b.dataset.o]; UI.open[id] = true; }
    else if (k === "dipclose") UI.dip = null;
    else if (k === "cfnew") UI.cf = UI.cf === "+new" ? null : "+new";
    else if (k === "cfedit") UI.cf = UI.cf === id ? null : id;
    else if (k === "cfclose") UI.cf = null;
    else if (k === "cfoff") { const c = (S().get("conflicts") || {})[id]; if (c && confirm(`Remove ${c.n}?`)) S().set("conflicts", id, Object.assign({}, c, { off: true })); }
    else if (k === "cfwar") { const c = (S().get("conflicts") || {})[id]; if (!c) return; for (const x of [].concat(c.a || [])) for (const y of [].concat(c.b || [])) for (const [p1, p2] of [[x, y], [y, x]]) setFac(p1, { rels: Object.assign({}, stOf(p1).rels || {}, { [p2]: "war" }) }, `at war with ${(defs()[p2] || {}).n || p2} (${c.n})`); }
    else return;
    setTimeout(paint, 60);
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.fa) return; const id = t.dataset.id;
    if (t.dataset.fa === "rel") { const o = t.dataset.o; for (const [a, b2] of [[id, o], [o, id]]) setFac(a, { rels: Object.assign({}, stOf(a).rels || {}, { [b2]: t.value }) }, `now ${stanceOf(t.value)[1].toLowerCase()} with ${(defs()[b2] || {}).n || b2}`); }
    else if (t.dataset.fa === "party") setFac(id, { party: t.value }, `${stanceOf(t.value)[1].toLowerCase()} toward the party`);
    else if (t.dataset.fa === "dippick") { UI.dip = t.value ? [id, t.value] : null; }
    else if (t.dataset.fa === "status") { const L = Object.assign({}, lifeOf(id), { status: t.value }); L.log = (L.log || []).concat({ when: when(), what: (STATUS.find(s => s[0] === t.value) || [0, ""])[1].toLowerCase() }).slice(-20); S().set("npcstate", id, L); }
    t.blur(); setTimeout(paint, 60);
  });
  document.addEventListener("submit", e => {
    const fm = e.target; if (!fm.dataset || !["powerform", "dipform", "cfform"].includes(fm.dataset.fa)) return; e.preventDefault();
    if (fm.dataset.fa === "cfform") {
      const n = fm.elements.n.value.trim(); if (!n) return; const id = fm.dataset.id || "c" + Date.now().toString(36), vals = k => [...fm.querySelectorAll(`input[name="${k}"]:checked`)].map(x => x.value);
      S().set("conflicts", id, { n, a: vals("a"), b: vals("b"), status: fm.elements.status.value, cause: fm.elements.cause.value.trim(), aims: fm.elements.aims.value.trim(), land: fm.elements.land.value.trim(), places: vals("pl"), outcomes: fm.elements.outcomes.value.trim(), past: fm.elements.past.value.trim(), t: Date.now() });
      UI.cf = null; setTimeout(paint, 60); return;
    }
    if (fm.dataset.fa === "dipform") {
      const a = fm.dataset.id, b = fm.dataset.o, treaties = [...fm.querySelectorAll('input[name="t"]:checked')].map(x => x.value);
      S().set("diplomacy", pairKey(a, b), { treaties, why: fm.elements.why.value.trim(), now: fm.elements.now.value.trim(), t: Date.now() });
      const said = treaties.map(t => (TREATY.find(x => x[0] === t.split(":")[0]) || [0, t])[1].toLowerCase()).join(", ") || "no treaty";
      for (const [x, y] of [[a, b], [b, a]]) setFac(x, {}, `with ${(defs()[y] || {}).n || y}: ${said}`);
      UI.dip = null; setTimeout(paint, 60); return;
    }
    const n = fm.elements.n.value.trim(); if (!n) return;
    let id = fm.dataset.id; const isNew = !id;
    if (isNew) { id = "p-" + n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) + "-" + Math.random().toString(36).slice(2, 5); }
    const d = Object.assign({}, ownDefs()[id] || {}, { n, kind: fm.elements.kind.value || undefined, color: fm.elements.color.value, capital: fm.elements.capital.value || undefined, wants: fm.elements.wants ? fm.elements.wants.value.trim() || undefined : undefined, settlements: [...fm.querySelectorAll('input[name="setl"]:checked')].map(x => x.value), own: isNew || !!(ownDefs()[id] || {}).own, t: Date.now() });
    for (const [k] of FIELDS) { const v = fm.elements[k] ? fm.elements[k].value.trim() : ""; d[k] = v || undefined; }
    if (d.capital && !(d.settlements || []).includes(d.capital)) d.settlements = [d.capital].concat(d.settlements || []);
    if (!d.hq && d.capital) d.hq = d.capital;
    S().set("factiondefs", id, JSON.parse(JSON.stringify(d))); UI.edit = null; UI.open[id] = true; setTimeout(paint, 60);
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
    init(store) { for (const c of ["factions", "npcstate", "clock", "world", "talks", "memory", "factiondefs", "diplomacy", "conflicts"]) store.watch(c, () => paint()); } });

  // the copilot: where someone is now and what they belong to; the investigation: the factions as things to join to
  // the powers, how each pair stands, their treaties and the conflicts, as lines for a council's question (the world
  // council and the consequences read it, so what the world does next keeps to the diplomacy the game master set)
  function relationsText() {
    const all = defs(), ids2 = Object.keys(all).filter(id => !all[id].off), out = [], sOf = r => Array.isArray(r) ? r[0] : r && typeof r === "object" ? r.stance : r;
    for (const id of ids2) { const f = fac(id) || all[id]; out.push(`${id}: ${f.n || id}${f.kind ? " (" + f.kind + ")" : ""}${f.wants ? "; wants: " + f.wants : ""}; toward the party: ${f.party || "neutral"}`); }
    const pairs = [];
    for (let i = 0; i < ids2.length; i++) for (let j = i + 1; j < ids2.length; j++) {
      const a = ids2[i], b = ids2[j], ra = sOf((all[a].rels || {})[b]), rb = sOf((all[b].rels || {})[a]), d = diplo(a, b), tr = ((d && d.treaties) || []).map(t => { const [k, who] = String(t).split(":"); return ((TREATY.find(x => x[0] === k) || [0, k])[1]) + (who ? " (" + ((all[who] || {}).n || who) + ")" : ""); });
      if (!ra && !rb && !tr.length && !(d && (d.why || d.now))) continue;
      pairs.push(`${all[a].n || a} and ${all[b].n || b}: ${ra || rb || "neutral"}${ra && rb && ra !== rb ? ` (${all[a].n || a} ${ra}, ${all[b].n || b} ${rb})` : ""}${tr.length ? "; treaties: " + tr.join(", ") : ""}${d && d.why ? "; why: " + d.why : ""}${d && d.now ? "; now: " + d.now : ""}`);
    }
    const cs = conflicts().map(([, c]) => `${c.n || "A conflict"} (${c.status || "ongoing"}): ${[].concat(c.a || []).map(x => (all[x] || {}).n || x).join(", ")} against ${[].concat(c.b || []).map(x => (all[x] || {}).n || x).join(", ")}${c.cause ? "; cause: " + c.cause : ""}${c.aims ? "; aims: " + c.aims : ""}${c.land ? "; over: " + c.land : ""}`);
    return (out.length ? "THE POWERS (id: name; what they want):\n" + out.join("\n") : "") + (pairs.length ? "\n\nHOW THE POWERS STAND WITH EACH OTHER (keep to it: no alliance broken, war declared or treaty ignored without a cause the campaign gives):\n" + pairs.join("\n") : "") + (cs.length ? "\n\nCONFLICTS:\n" + cs.join("\n") : "");
  }
  A.lives = { whereNow, factionsOf, about, fac, ids, all: defs, diplomacy: diplo, TREATY, conflicts, relationsText };
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
