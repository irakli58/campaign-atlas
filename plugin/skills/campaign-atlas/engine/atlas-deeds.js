/* Consequences (the user's master plan, 26 Oct 2026, part 20: what the party does changes the world; the council works
   out what follows, at once, in days and weeks later, from what the campaign establishes: who saw it, who it helps or
   harms, what they want and what they have to act with; the game master lets each happen, changes it, or says no, and
   nothing changes until they do). The game master writes what the party did (collection "deeds"); Claude, as the
   story council, proposes what comes of it, each with the changes it makes in the world (the same changes an event
   makes: atlas-factions.js, and prices: atlas-economy.js). One that follows at once is done when the game master lets
   it, and can be taken back; one that follows later becomes an event of the world's time (collection "eventdefs", with
   the deed it came from), which comes due on its day and happens, or waits for the game master, as any event does.
   The deed and what came of it go into the world's history. A tab of At the table. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc;
  const S = () => api.store();
  const W = () => A.worldTime;
  const nowM = () => W() ? W().now() : 0;
  const at = m => W() ? W().at(m) : { short: "", long: "", day: 1 };
  const placeName = id => (A.meta[id] || {}).name || id;
  const pls = () => A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-"));
  const FX = () => A.worldEffects;
  const HOW = [["well", "It went as they meant"], ["partly", "Partly"], ["badly", "It went wrong"], ["messy", "It went loud and messy"], ["unseen", "No one saw them"]];
  const IMP = [["background", "Background"], ["notable", "Notable"], ["major", "Major"], ["critical", "Critical"]];
  const STANCES = ["war", "hostile", "wary", "neutral", "friendly", "allied"], STATUS = ["", "missing", "hiding", "arrested", "hurt", "gone", "dead"];
  const UI = { busy: "", err: "", edit: null, open: {} };
  const deeds = () => Object.entries((S() && S().get("deeds")) || {}).filter(([, d]) => d && d.title).sort((a, b) => b[1].t - a[1].t);
  const deedOf = id => (S() && S().get("deeds", id)) || null;
  const putDeed = (id, d) => S().set("deeds", id, d);
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---- the council's proposals, kept only where they name what is there */
  function cleanFx(x) {
    if (!x || typeof x !== "object") return null;
    const F = A.factionsData || {}, C = A.castData || {}, P = p => !!A.meta[p];
    if (x.price != null || x.goods != null) return A.money ? A.money.cleanPrice(x) : null;
    if (x.faction) {
      const f = x.faction; if (!F[f]) return null;
      if (x.party) return STANCES.includes(x.party) ? { faction: f, party: x.party } : null;
      if (x.rel) return Array.isArray(x.rel) && F[x.rel[0]] && x.rel[0] !== f && STANCES.includes(x.rel[1]) ? { faction: f, rel: [x.rel[0], x.rel[1]] } : null;
      if (x.step != null) return { faction: f, step: Math.max(-3, Math.min(3, Math.round(+x.step) || 1)) };
      if (x.has && typeof x.has === "object") { const h = {}; for (const [k, v] of Object.entries(x.has)) if (["money", "people", "arms", "influence", "knowledge"].includes(k) && +v) h[k] = Math.max(-2, Math.min(2, Math.round(+v))); return Object.keys(h).length ? { faction: f, has: h } : null; }
      if (x.gains) return P(x.gains) ? { faction: f, gains: x.gains } : null;
      if (x.loses) return P(x.loses) ? { faction: f, loses: x.loses } : null;
      return null;
    }
    if (x.person) {
      const p = x.person; if (!C[p]) return null;
      if (x.at) return P(x.at) ? Object.assign({ person: p, at: x.at }, x.doing ? { doing: String(x.doing).slice(0, 80) } : {}, +x.hours ? { hours: Math.min(720, Math.round(+x.hours)) } : {}) : null;
      if (x.status != null) return STATUS.includes(x.status) ? { person: p, status: x.status } : null;
      if (x.joins) return F[x.joins] ? { person: p, joins: x.joins } : null;
      if (x.leaves) return F[x.leaves] ? { person: p, leaves: x.leaves } : null;
      if (x.learns) return { person: p, learns: String(x.learns).slice(0, 300), how: (A.story && (A.story.KHOW || []).some(k => k[0] === x.how)) ? x.how : "told" };
    }
    return null;
  }
  function cleanCon(x) {
    if (!x || typeof x !== "object" || !String(x.title || "").trim()) return null;
    const days = x.when === "now" ? 0 : Math.max(0, Math.min(120, Math.round(+x.days || (x.when === "soon" ? 2 : x.when === "later" ? 14 : 0))));
    const c = { id: uid("c"), days, importance: IMP.some(i => i[0] === x.importance) ? x.importance : "notable", title: String(x.title).trim().slice(0, 140), state: "proposed", by: "council" };
    for (const k of ["what", "why", "players", "headline"]) if (typeof x[k] === "string" && x[k].trim()) c[k] = x[k].trim().slice(0, k === "headline" ? 140 : 1200);
    c.effects = [].concat(x.effects || [], (x.prices || []).map(p => Object.assign({ price: p.goods || p.price || "all" }, p))).map(cleanFx).filter(Boolean).slice(0, 8);
    return c;
  }
  function prompt(d) {
    const c = A.config || {}, n = at(nowM()), L = A.lives, F = A.factionsData || {};
    const facs = Object.keys(F).map(id => { const f = L ? L.fac(id) : F[id]; return `${id}: ${f.n || id}; toward the party: ${f.party || "neutral"}; wants: ${f.wants || "?"}${f.has ? "; has " + Object.entries(f.has).map(([k, v]) => k + " " + v).join(", ") : ""}${(f.territory || []).length ? "; holds " + f.territory.map(placeName).join(", ") : ""}`; }).join("\n");
    const people = Object.entries(A.castData || {}).slice(0, 40).map(([id, p]) => { const w = L ? L.whereNow(id) : null; return `${id}: ${p.n}${p.role ? ", " + p.role : ""}${p.want ? "; wants: " + p.want : ""}${w && w.at ? "; now at " + placeName(w.at) : w && w.status ? "; " + w.status : ""}${L && L.factionsOf(id).length ? "; of " + L.factionsOf(id).join(", ") : ""}`; }).join("\n");
    const hits = api.lookup([d.title, d.what, placeName(d.place || ""), ((A.castData || {})[d.who] || {}).n, (F[d.fac] || {}).n].filter(Boolean).join(" "), 10);
    const lately = A.history ? A.history.recent(10).join("\n") : "";
    return `You are the story council of the tabletop roleplaying campaign "${c.title || ""}"${c.system ? " (" + c.system + ")" : ""}${c.setting ? ", set in " + c.setting : ""}. The party has done something, and the world answers. Work out what comes of it.

Rules. Every consequence follows from what the campaign establishes: who saw it or will hear of it, who it helps or harms, what they want and what they have to act with. Proportionate: the world reacts, it does not punish; no catastrophe, death of an important person or war without a cause the deed gives. Give a mix: what follows at once (when "now"), within days ("soon", days 1 to 6), and weeks later ("later", days 7 to 60). Prefer consequences that change something concrete and that the players can notice or hear of, and opportunities as well as dangers.

It is now ${n.long}, ${n.time}: day ${n.day} of the story.

WHAT THE PARTY DID: ${d.title}
HOW IT WENT: ${(HOW.find(h => h[0] === d.how) || HOW[0])[1]}${d.place ? "\nWHERE: " + placeName(d.place) + " (" + d.place + ")" : ""}${d.who ? "\nWHO IT TOUCHED: " + (((A.castData || {})[d.who] || {}).n || d.who) + " (" + d.who + ")" : ""}${d.fac ? "\nWHICH FACTION: " + ((F[d.fac] || {}).n || d.fac) + " (" + d.fac + ")" : ""}${d.what ? "\nMORE: " + d.what : ""}

FACTIONS (id: name; how they stand; what they want and have):
${facs || "(none)"}

PEOPLE (id: name, role; where they are; their factions):
${people || "(none)"}

PLACES (id: name):
${pls().map(id => `${id}: ${placeName(id)}`).join("\n")}

KINDS OF GOODS (for prices): ${A.money ? A.money.kinds().join(", ") : "(none)"}

WHAT HAS HAPPENED LATELY:
${lately || "(nothing recorded)"}

THE CAMPAIGN'S OWN WORDS:
${hits.map((h, i) => `[${i + 1}] ${h.src}\n${h.text}`).join("\n\n") || "(nothing found)"}

Answer with only a JSON array of three to six consequences, each:
{"when": "now|soon|later", "days": 0 for now, else the days from now, "importance": "background|notable|major|critical", "title": "", "what": "what happens, for the game master", "why": "why it follows from the deed", "players": "what the players may see or hear of it, or empty", "headline": "a headline if it is news, or empty", "effects": [changes], "prices": [{"goods": "a kind of goods, or all", "place": "a place id, or empty for everywhere", "by": 1.5, "days": 14}]}
A change is one of {"faction": id, "party": "war|hostile|wary|neutral|friendly|allied"}, {"faction": id, "rel": [another faction's id, stance]}, {"faction": id, "step": 1}, {"faction": id, "has": {"money|people|arms|influence|knowledge": 1 or -1}}, {"faction": id, "gains": place id}, {"faction": id, "loses": place id}, {"person": id, "at": place id, "doing": "", "hours": N}, {"person": id, "status": "missing|hiding|arrested|hurt|gone|dead"}, {"person": id, "joins": faction id}, {"person": id, "leaves": faction id}, {"person": id, "learns": "what they learn", "how": "witnessed|told|rumour"}. Use only the ids above; leave out a change rather than invent an id.`;
  }
  async function askCouncil(did) {
    UI.busy = did; UI.err = ""; paint();
    let r = null; try { r = await api.askRaw(prompt(deedOf(did) || {}), () => {}); } catch (e) { r = null; }
    UI.busy = "";
    if (!r) { UI.err = "Claude is not reachable from this page. Write what comes of it yourself: it works the same."; paint(); return; }
    let got = []; try { const t = String(r), a = t.indexOf("["), b = t.lastIndexOf("]"); got = JSON.parse(t.slice(a, b + 1)); } catch (e) { got = []; }
    const l = (Array.isArray(got) ? got : []).map(cleanCon).filter(Boolean), d = deedOf(did);
    if (!l.length || !d) { UI.err = "The council's answer could not be read. Ask again."; paint(); return; }
    putDeed(did, Object.assign({}, d, { cons: (d.cons || []).filter(c => c.state !== "proposed").concat(l) }));
    api.note(`The council proposes ${l.length} consequence${l.length > 1 ? "s" : ""}. Nothing changes until you let it.`);
  }

  /* ---- letting it happen, and taking it back */
  const cause = (d, c) => c.why || `After the party's deed: ${d.title}`;
  function record(did) {
    const d = deedOf(did); if (!d || !A.history) return;
    A.history.add({ id: "d_" + did, kind: "deed", m: d.m, t: d.t, title: d.title, what: [d.how && d.how !== "well" ? (HOW.find(h => h[0] === d.how) || [0, ""])[1] : "", d.what].filter(Boolean).join(". "), places: [d.place], who: [d.who], factions: [d.fac], vis: "players", from: "deeds",
      outcome: (d.cons || []).filter(c => c.state === "done" || c.state === "planned").map(c => c.title + (c.state === "planned" ? ` (day ${at(c.when).day})` : "")) });
  }
  function accept(did, cid, tell) {
    const d = deedOf(did); if (!d) return; const cons = (d.cons || []).map(c => Object.assign({}, c)), c = cons.find(x => x.id === cid); if (!c) return;
    const m = nowM();
    if (!c.days) {
      c.fx = FX() && (c.effects || []).length ? FX().apply({ title: c.title, effects: c.effects }, at(m).short) : [];
      if (tell && (c.players || c.headline)) { c.news = uid("n"); S().set("news", c.news, { m, when: at(m).short, headline: c.headline || c.title, text: c.players || "", paper: "", t: Date.now() }); }
      c.state = "done"; c.at = m;
      if (A.history) A.history.add({ id: `c_${did}_${cid}`, kind: "conseq", m, title: c.title, what: c.what || "", cause: cause(d, c), places: [d.place], who: (c.effects || []).map(x => x.person), factions: (c.effects || []).map(x => x.faction), outcome: (c.effects || []).map(x => FX() ? FX().say(x) : "").filter(Boolean), vis: c.news ? "players" : "gm", pub: c.news ? { headline: c.headline || c.title, text: c.players || "" } : null, news: c.news, from: "deeds" });
    } else {
      c.ev = "c" + did.slice(1) + cid.slice(1); c.when = m + c.days * 1440; c.state = "planned";
      const def = { title: c.title, importance: c.importance, when: c.when, why: cause(d, c), deed: did };
      for (const k of ["what", "players"]) if (c[k]) def[k] = c[k];
      if (d.place) def.place = d.place; if (c.headline) def.news = { headline: c.headline, text: c.players || "", paper: "" };
      if ((c.effects || []).length) def.effects = c.effects;
      S().set("eventdefs", c.ev, def);
    }
    putDeed(did, Object.assign({}, d, { cons })); record(did);
    api.note(c.days ? `${c.title}: planned for day ${at(c.when).day}, under The world's time.` : `${c.title}: it has happened${c.news ? ", and the players have been told" : ""}.`);
  }
  function takeBack(did, cid) {
    const d = deedOf(did); if (!d) return; const cons = (d.cons || []).map(c => Object.assign({}, c)), c = cons.find(x => x.id === cid); if (!c) return;
    if (c.state === "done") { if (FX() && c.fx) FX().revert(c.fx); if (c.news) S().set("news", c.news, null); if (A.history) A.history.remove(`c_${did}_${cid}`); }
    if (c.state === "planned" && c.ev) {
      const s = S().get("events", c.ev);
      if (s) { if (s.fx && FX()) FX().revert(s.fx); if (s.news) S().set("news", s.news, null); S().set("events", c.ev, null); }
      S().set("eventdefs", c.ev, null);
    }
    for (const k of ["fx", "news", "ev", "when", "at"]) delete c[k];
    c.state = "proposed"; putDeed(did, Object.assign({}, d, { cons })); record(did);
    api.note(`${c.title}: taken back. The world is as it was before it.`);
  }
  function removeDeed(did) {
    const d = deedOf(did); if (!d) return;
    for (const c of d.cons || []) if (c.state === "done" || c.state === "planned") takeBack(did, c.id);
    putDeed(did, null); if (A.history) A.history.remove("d_" + did);
  }

  /* ---- drawing it */
  const whenWord = c => c.state === "planned" ? `Day ${at(c.when).day}` : !c.days ? "At once" : c.days < 7 ? `In ${c.days} day${c.days > 1 ? "s" : ""}` : `In ${Math.round(c.days / 7)} week${c.days >= 14 ? "s" : ""}`;
  function conHTML(did, c) {
    const fx = (c.effects || []).map(x => FX() ? FX().say(x) : "").filter(Boolean), ev = c.ev && S().get("events", c.ev);
    const st = c.state === "done" ? "It has happened" : c.state === "planned" ? (ev && ev.state === "done" ? "It has happened" : ev && ev.state === "pending" ? "Due: waiting for you under The world's time" : "Planned") : c.state === "no" ? "You said no" : "";
    const imp = `<span class="tw-imp tw-${esc((IMP.find(i => i[0] === c.importance) || IMP[1])[1].toLowerCase())}">${esc((IMP.find(i => i[0] === c.importance) || IMP[1])[1])}</span>`;
    return `<div class="dd-c dd-${esc(c.state)}"><div class="tw-h"><span class="dd-when">${esc(whenWord(c))}</span>${imp}<b>${esc(c.title)}</b>${st ? `<span class="tw-tag">${esc(st)}</span>` : ""}${c.by === "gm" ? `<span class="tw-tag">yours</span>` : ""}</div>
      ${c.what ? `<p class="t-small">${esc(c.what)}</p>` : ""}${c.why ? `<p class="t-small"><span class="kn">Why</span> ${esc(c.why)}</p>` : ""}
      ${fx.length ? `<p class="t-small"><span class="kn">It changes</span> ${fx.map(esc).join("; ")}</p>` : ""}
      ${c.players || c.headline ? `<p class="t-small"><span class="kn">The players may hear</span> ${esc([c.headline, c.players].filter(Boolean).join(": "))}</p>` : ""}
      <div class="t-row">${c.state === "proposed" || c.state === "no" ? `<button type="button" class="t-btn prim" data-dd="yes" data-d="${esc(did)}" data-c="${esc(c.id)}">${c.days ? "Plan it" : "Let it happen"}</button>${!c.days && (c.players || c.headline) ? `<button type="button" class="t-btn" data-dd="yestell" data-d="${esc(did)}" data-c="${esc(c.id)}">Let it happen and tell the players</button>` : ""}<button type="button" class="t-mini" data-dd="edit" data-d="${esc(did)}" data-c="${esc(c.id)}">Change it</button>${c.state === "proposed" ? `<button type="button" class="t-mini" data-dd="no" data-d="${esc(did)}" data-c="${esc(c.id)}">No</button>` : ""}`
        : `<button type="button" class="t-mini" data-dd="back" data-d="${esc(did)}" data-c="${esc(c.id)}">Take it back</button>`}</div></div>`;
  }
  const field = (lbl, inner) => `<label class="tw-l"><span>${lbl}</span>${inner}</label>`;
  function editHTML() {
    const e = UI.edit, d = e.d;
    return `<form class="dd-ed" data-dd="con" data-d="${esc(e.did)}"><h4 class="tw-sub">${e.cid ? "Change it" : "One of your own"}</h4>
      ${field("What comes of it", `<input class="t-in" name="title" maxlength="140" required value="${esc(d.title || "")}">`)}
      <div class="tw-2">${field("When", `<span class="t-row"><input class="t-in t-n" type="number" min="0" max="120" name="days" value="${esc(d.days || 0)}"> <span class="kn">days from now (0: at once)</span></span>`)}${field("How much it matters", `<select class="t-in" name="importance">${IMP.map(([k, l]) => `<option value="${k}"${k === (d.importance || "notable") ? " selected" : ""}>${l}</option>`).join("")}</select>`)}</div>
      ${field("What happens", `<textarea class="t-in" name="what" rows="2" maxlength="1200">${esc(d.what || "")}</textarea>`)}
      ${field("Why it follows", `<input class="t-in" name="why" maxlength="400" value="${esc(d.why || "")}">`)}
      <div class="tw-2">${field("A headline, if it is news", `<input class="t-in" name="headline" maxlength="140" value="${esc(d.headline || "")}">`)}${field("What the players may hear", `<input class="t-in" name="players" maxlength="600" value="${esc(d.players || "")}">`)}</div>
      ${FX() ? `<div class="tw-conds"><span class="kn">It changes (undone if you take it back)</span>${(d.fx || []).map((r, i) => FX().rowHTML(r, i)).join("")}<button type="button" class="t-mini" data-dd="addfx">Add a change</button></div>` : ""}
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-dd="cancel">Cancel</button></div></form>`;
  }
  function deedHTML([did, d]) {
    const cons = d.cons || [], open = UI.open[did] != null ? UI.open[did] : deeds().findIndex(x => x[0] === did) < 3;
    const done = cons.filter(c => c.state === "done" || c.state === "planned").length, prop = cons.filter(c => c.state === "proposed").length;
    return `<section class="t-card dd-deed"><div class="tw-hh"><h3>${esc(d.title)}</h3><span class="kn">${esc(at(d.m).short)}${d.place ? " · " + esc(placeName(d.place)) : ""}</span></div>
      <p class="t-small">${esc((HOW.find(h => h[0] === d.how) || HOW[0])[1])}${d.what ? ". " + esc(d.what) : ""}</p>
      <p class="t-small kn">${done ? `${done} came of it` : "Nothing has come of it yet"}${prop ? ` · ${prop} proposed, waiting for you` : ""} <button type="button" class="t-link" data-dd="fold" data-d="${esc(did)}">${open ? "fold" : "open"}</button></p>
      ${open ? cons.map(c => UI.edit && UI.edit.did === did && UI.edit.cid === c.id ? editHTML() : conHTML(did, c)).join("") + (UI.edit && UI.edit.did === did && !UI.edit.cid ? editHTML() : "")
        + `<div class="t-row dd-acts">${UI.busy === did ? `<span class="kn">The council is weighing it…</span>` : `<button type="button" class="t-btn" data-dd="ask" data-d="${esc(did)}">${cons.length ? "Ask the council for more" : "Ask the council what comes of it"}</button>`}<button type="button" class="t-mini" data-dd="own" data-d="${esc(did)}">Write one of your own</button><button type="button" class="t-mini" data-dd="del" data-d="${esc(did)}">Remove the deed</button></div>` : ""}</section>`;
  }
  function html() {
    const l = deeds(), opt = (list, none) => `<option value="">${none}</option>` + list.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("");
    return `<div class="t-grid"><section class="t-card"><h3>${T.icon("deeds")} What the party did, and what comes of it</h3>
      <p class="t-small">When the party does something that matters (kills, steals, saves, lies, burns, bargains), write it here. The council works out what follows: at once, within days, and weeks later, from who saw it, who it helps or harms, and what they can do. You let each happen, change it, or say no. Nothing changes until you do; what follows later is planned as an event of the world's time.</p>
      <form class="dd-f" data-dd="deed">
        ${field("What they did", `<input class="t-in" name="title" maxlength="140" required placeholder="Burned the smugglers' warehouse on the quay">`)}
        <div class="tw-2">${field("Where", `<select class="t-in" name="place">${opt(pls().map(p => [p, placeName(p)]), "Nowhere in particular")}</select>`)}${field("How it went", `<select class="t-in" name="how">${HOW.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>`)}</div>
        <div class="tw-2">${field("Who it touched", `<select class="t-in" name="who">${opt(Object.entries(A.castData || {}).map(([k, c]) => [k, c.n || k]), "No one in particular")}</select>`)}${field("Which faction", `<select class="t-in" name="fac">${opt(Object.entries(A.factionsData || {}).map(([k, f]) => [k, f.n || k]), "None")}</select>`)}</div>
        ${field("More of it", `<textarea class="t-in" name="what" rows="2" maxlength="1200" placeholder="Who saw, what was left behind, who escaped"></textarea>`)}
        <div class="t-row"><button class="t-btn prim" name="ask" value="1">Ask the council what comes of it</button><button class="t-btn" name="keep" value="1">Keep it, I will write what follows</button></div></form>
      ${UI.err ? `<p class="t-err">${esc(UI.err)}</p>` : ""}</section>
      ${l.map(deedHTML).join("")}</div>`;
  }

  /* ---- what the game master does */
  let sure = null;
  const twice = (b, fn) => { if (sure === b) { sure = null; fn(); return; } if (sure) { sure.textContent = sure.dataset.lbl; } sure = b; b.dataset.lbl = b.textContent; b.textContent = "Really?"; setTimeout(() => { if (sure === b) { b.textContent = b.dataset.lbl; sure = null; } }, 4000); };
  const draftOf = c => Object.assign({}, c, { fx: (c.effects || []).map(x => FX() ? FX().toRow(x) : null).filter(Boolean) });
  // (the form's rows are read back before one is added or taken away)
  function readForm(f) {
    const d = UI.edit.d, g = n => String((f.elements[n] || {}).value || "").trim();
    for (const k of ["title", "what", "why", "headline", "players", "importance"]) d[k] = g(k);
    d.days = Math.max(0, Math.min(120, Math.round(+g("days") || 0)));
    if (FX()) d.fx = (d.fx || []).map((r, i) => FX().readRow(f, i));
  }
  function keepForm(f) {
    readForm(f); const e = UI.edit, d = e.d, dd = deedOf(e.did); if (!dd || !d.title) return;
    const c = { id: e.cid || uid("c"), days: d.days, importance: d.importance || "notable", title: d.title.slice(0, 140), state: "proposed", by: e.cid ? (d.by || "council") : "gm" };
    for (const k of ["what", "why", "headline", "players"]) if (d[k]) c[k] = d[k];
    c.effects = FX() ? (d.fx || []).map(FX().fromRow).filter(Boolean) : [];
    const cons = (dd.cons || []).slice(), i = cons.findIndex(x => x.id === c.id); if (i >= 0) cons[i] = c; else cons.push(c);
    putDeed(e.did, Object.assign({}, dd, { cons })); UI.edit = null;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-dd], .dd-ed [data-tw='delfx']"); if (!b || ["FORM", "SELECT", "INPUT"].includes(b.tagName)) return;
    const k = b.dataset.dd || "delfx", did = b.dataset.d, cid = b.dataset.c, f = b.closest("form[data-dd='con']");
    if (f && UI.edit && (k === "addfx" || k === "delfx")) { readForm(f); if (document.activeElement) document.activeElement.blur(); }
    switch (k) {
      case "ask": askCouncil(did); return;
      case "yes": accept(did, cid, false); break;
      case "yestell": accept(did, cid, true); break;
      case "no": { const d = deedOf(did); putDeed(did, Object.assign({}, d, { cons: d.cons.map(c => c.id === cid ? Object.assign({}, c, { state: "no" }) : c) })); break; }
      case "back": takeBack(did, cid); break;
      case "edit": { const c = (deedOf(did).cons || []).find(x => x.id === cid); if (c) UI.edit = { did, cid, d: draftOf(c) }; break; }
      case "own": UI.edit = { did, cid: null, d: { days: 0, importance: "notable", fx: [] } }; UI.open[did] = true; break;
      case "cancel": UI.edit = null; break;
      case "addfx": (UI.edit.d.fx = UI.edit.d.fx || []).push({ k: "" }); break;
      case "delfx": UI.edit.d.fx.splice(+b.dataset.i, 1); break;
      case "fold": UI.open[did] = !(UI.open[did] != null ? UI.open[did] : deeds().findIndex(x => x[0] === did) < 3); break;
      case "del": twice(b, () => { removeDeed(did); paint(); }); return;
      default: return;
    }
    setTimeout(paint, 30);
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!(t.dataset && t.dataset.twfx === "kind" && UI.edit)) return;
    const f = t.closest("form[data-dd='con']"); if (!f) return; readForm(f); t.blur(); paint();
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.dd) return; e.preventDefault();
    const g = n => String((f.elements[n] || {}).value || "").trim();
    if (f.dataset.dd === "con") { keepForm(f); if (document.activeElement) document.activeElement.blur(); paint(); return; }
    if (f.dataset.dd !== "deed" || !g("title")) return;
    const did = uid("d"), d = { title: g("title").slice(0, 140), how: g("how") || "well", m: nowM(), t: Date.now(), cons: [] };
    for (const k of ["place", "who", "fac", "what"]) if (g(k)) d[k] = g(k).slice(0, 1200);
    putDeed(did, d); record(did); f.reset(); if (document.activeElement) document.activeElement.blur();
    UI.open[did] = true;
    // (Enter in a field asks the council, as the first button does)
    if (!e.submitter || e.submitter.name !== "keep") askCouncil(did); else { UI.edit = { did, cid: null, d: { days: 0, importance: "notable", fx: [] } }; paint(); }
  });
  function paint() { if (api.tab() === "deeds") api.render(); }

  TU.addTab({ key: "deeds", label: "Consequences", icon: "deeds", group: "play", after: "history", desc: "What the party did, and what comes of it: at once, in days, weeks later",
    html, status: () => { const l = deeds(), p = l.reduce((n, [, d]) => n + (d.cons || []).filter(c => c.state === "proposed").length, 0); return p ? `${p} waiting for you` : l.length ? `${l.length} deed${l.length > 1 ? "s" : ""}` : "Nothing yet"; },
    init(store) { for (const c of ["deeds", "events", "eventdefs"]) store.watch(c, () => { if (!UI.edit) paint(); }); if (A.history) A.history.keep("deeds"); } });

  // a deed written by another tool (a remembered promise or insult from a recorded session: atlas-sessions.js), with the
  // council asked at once if it says so
  function add(d, ask) {
    const did = uid("d"), rec = Object.assign({ how: "well", m: nowM(), t: Date.now(), cons: [] }, d);
    for (const k of Object.keys(rec)) if (rec[k] === undefined || rec[k] === "") delete rec[k];
    putDeed(did, rec); record(did); UI.open[did] = true; if (ask) askCouncil(did); return did;
  }
  A.deeds = { list: deeds, proposed: () => deeds().flatMap(([did, d]) => (d.cons || []).filter(c => c.state === "proposed").map(c => ({ did, d, c }))), accept, takeBack, prompt, cleanCon, add };
})(ATLAS);
