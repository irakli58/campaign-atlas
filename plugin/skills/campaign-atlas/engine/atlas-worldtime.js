/* The world's time (the user's master plan, 26 Oct 2026, parts 4 and 5: a story-driven world clock, not a random one;
   events the game master writes and the council plans, each with its cause, its conditions and what the players may
   know of it; importance, with the significant ones waiting for the game master's approval; small random happenings
   only if wanted; notifications for the game master and the players; the world's news, which may differ from the
   truth). The campaign gives its calendar and its events in table.js (ATLAS.calendar, ATLAS.events:
   references/table.md, section 18); the game master adds, changes and removes events on the page, and may ask the
   council for more (nothing is added until they say so). This file keeps the time, sees each event come due (at its
   hour, or when what it waits on has happened: a clue found, a place reached, a villain's clock at a step, another
   event), calls it off when what it rests on is gone (its "unless"), and then: a background or notable event happens
   by itself and is recorded (notable ones with a word to the game master); a major or critical one waits for the
   game master: it happens, changed, later, or not at all. Where the line falls is the game master's choice. What
   happens goes to the players only when the game master says, as news on their screen and in their copy.
   Everything is kept in the table's store (collections "clock", "events", "eventdefs", "news"), so the players'
   window follows. A tab of At the table, and Time in the quick tools; the consistency check and the copilot are
   told of it. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc;
  const S = () => api.store();
  // how much an event matters (the user's three, and critical above them); "minor" is the older word for notable
  const IMP = { background: ["Background", 0], minor: ["Notable", 1], notable: ["Notable", 1], major: ["Major", 2], critical: ["Critical", 3] };
  const rank = e => (IMP[e.importance] || IMP.notable)[1];
  const ASK = [["all", "Everything", 0], ["notable", "Notable and up", 1], ["major", "Major and critical", 2], ["critical", "Only critical", 3]];
  const FREQ = [["rare", "Rarely", .2], ["some", "Sometimes", .45], ["often", "Often", .75]];
  const placeName = id => (A.meta[id] || {}).name || id;
  const UI = { edit: null, err: "", sugg: null, busy: false, focus: "" };

  /* ---- the calendar: minutes since the campaign's first moment, shown in the world's own dates */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // the council's calendar, with what the game master changed on the page over it
  const cal = () => { const mine = S() && S().get("clock", "cal"); return A.calendarData || mine ? Object.assign({}, A.calendarData || {}, mine || {}) : null; };
  // a real date as milliseconds, for any year (Date.UTC reads 0 to 99 as 1900 to 1999)
  const DATE = /^(\d{1,4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{2}))?)?/;
  const realMs = s => { const m = DATE.exec(String(s).trim()); if (!m) return null; const d = new Date(0); d.setUTCFullYear(+m[1], +m[2] - 1, +m[3]); d.setUTCHours(+(m[4] || 0), +(m[5] || 0), 0, 0); return d.getTime(); };
  // the first moment: a real date ("1888-10-31 21:00"), or day 1 of the world's own calendar at an hour
  function origin() {
    const c = cal() || {}, s = c.start;
    if (typeof s === "string" && DATE.test(s.trim())) { const ms = realMs(s), d = new Date(ms); return { real: true, ms, h: d.getUTCHours(), mi: d.getUTCMinutes() }; }
    const o = typeof s === "object" && s ? s : {}; return { real: false, day: o.day || 1, h: o.hour == null ? 8 : o.hour, mi: o.minute || 0, year: o.year || c.year || 1 };
  }
  function at(m) {
    const o = origin(), c = cal() || {};
    if (o.real) {
      const d = new Date(o.ms + m * 60000), h = d.getUTCHours(), mi = d.getUTCMinutes();
      return { long: `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`, time: hour(h, mi), short: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}, ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`, day: dayOf(m), h };
    }
    // the world's own calendar: months of so many days, weekdays, an era
    const months = (c.months && c.months.length ? c.months : [["Month", 30]]).map(x => Array.isArray(x) ? x : [x, 30]), yearLen = months.reduce((a, x) => a + (+x[1] || 30), 0);
    const total = (o.day - 1) * 1440 + o.h * 60 + o.mi + m, dayN = Math.floor(total / 1440), mins = ((total % 1440) + 1440) % 1440, year = o.year + Math.floor(dayN / yearLen); let dy = ((dayN % yearLen) + yearLen) % yearLen, mi2 = 0;
    while (dy >= (+months[mi2][1] || 30)) { dy -= +months[mi2][1] || 30; mi2++; }
    const wd = c.weekdays && c.weekdays.length ? c.weekdays[((dayN % c.weekdays.length) + c.weekdays.length) % c.weekdays.length] + " " : "";
    const h = Math.floor(mins / 60), mn = mins % 60;
    return { long: `${wd}${dy + 1} ${months[mi2][0]}, ${c.era ? c.era + " " : ""}${year}`, time: hour(h, mn), short: `${dy + 1} ${months[mi2][0]}, ${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`, day: dayOf(m), h };
  }
  const hour = (h, mi) => { const p = h < 5 || h >= 21 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"; return `${((h + 11) % 12) + 1}${mi ? ":" + String(mi).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}, ${p}`; };
  const dayOf = m => { const o = origin(); return Math.floor((o.h * 60 + o.mi + m) / 1440) + 1; };
  // when an event is due: a real date, "day 3 06:00", { day, hour }, or nothing (it waits only on what it is after)
  function whenOf(w) {
    if (w == null || w === "") return null; const o = origin();
    if (typeof w === "number") return w;
    if (typeof w === "string" && DATE.test(w.trim())) return o.real ? Math.round((realMs(w) - o.ms) / 60000) : null;
    const mm = typeof w === "string" ? /day\s*(\d+)(?:\s+(\d{1,2})(?::(\d{2}))?)?/i.exec(w) : null, day = mm ? +mm[1] : w.day, h = mm ? +(mm[2] || 0) : w.hour || 0, mi = mm ? +(mm[3] || 0) : w.minute || 0;
    if (!day) return null; return (day - 1) * 1440 + h * 60 + mi - (o.h * 60 + o.mi);
  }
  // a moment as the story's day and hour ("day 3", "06:00"), for the event form
  const dayTime = m => { const o = origin(), t = o.h * 60 + o.mi + m; return [Math.floor(t / 1440) + 1, `${String(Math.floor(((t % 1440) + 1440) % 1440 / 60)).padStart(2, "0")}:${String(((t % 60) + 60) % 60).padStart(2, "0")}`]; };

  /* ---- the time now, and the events */
  const now = () => +((S() && S().get("clock", "now")) || {}).m || 0;
  const opts = () => (S() && S().get("clock", "opts")) || {};
  // the date goes with the time, in words, for the players' window (which has no calendar of its own: it has nothing of
  // the campaign in its copy) to show as it is
  const label = m => { const d = at(m); return { date: d.long, time: d.time }; };
  const setNow = m => S().set("clock", "now", Object.assign({ m, t: Date.now() }, cal() ? label(m) : {}));
  // the events: the council's (table.js), as the game master changed them, and the game master's own (collection eventdefs)
  function evDefs() {
    const council = (A.eventsData || []).filter(e => e && e.id), mine = (S() && S().get("eventdefs")) || {};
    return council.map(e => mine[e.id] ? (mine[e.id].gone ? null : Object.assign({}, mine[e.id], { id: e.id, edited: true })) : e).filter(Boolean)
      .concat(Object.entries(mine).filter(([id, d]) => d && !d.gone && !council.some(e => e.id === id)).map(([id, d]) => Object.assign({}, d, { id, own: true })));
  }
  const evState = id => (S() && S().get("events", id)) || null;
  // (a small happening rolled from a random table keeps its own words in its state)
  const defOf = id => evDefs().find(e => e.id === id) || ((evState(id) || {}).def) || null;
  const allDone = () => Object.entries((S() && S().get("events")) || {}).map(([id, s]) => [defOf(id), s]).filter(([e, s]) => e && s && (s.state === "done" || s.state === "off"));

  // has it happened: one condition of an event's after (it waits for it) or unless (it is called off by it)
  function holds(c) {
    const st = S(); if (!st || !c) return false;
    if (c.clue) { const [pl, cid] = String(c.clue).split("/"); return (((st.get("clues", pl) || {}).done) || []).includes(cid); }
    if (c.visit) { const s = (st.get("status", c.visit) || {}).status || "unknown", fog = st.get("fog", c.visit) || {}, M = A.maps[c.visit] ? A.get(c.visit) : null; return ["open", "resolved", "closed"].includes(s) || !!(M && M.floors.some((F, fi) => T.fogSeen(fog, fi, F))); }
    if (c.known) return ((st.get("status", c.known) || {}).status || "unknown") !== "unknown";
    if (c.clock) { const [cid, n] = [].concat(c.clock), cl = (A.clocksData || []).find(x => x.id === cid); return !!cl && api.clockAt(cl) >= (+n || 1); }
    if (c.event) { const s = evState(c.event); return !!s && s.state === "done" && (!c.hours || now() >= (s.at || 0) + c.hours * 60); }
    return false;
  }
  const ready = e => [].concat(e.after || []).every(holds);
  const offBy = e => [].concat(e.unless || []).find(holds) || null;
  const dueAt = e => whenOf(e.when);
  const needs = e => rank(e) >= ((ASK.find(a => a[0] === opts().ask) || ASK[2])[2]);
  const tellable = e => !!(e.players || e.news);

  // it happens: recorded, the clock it moves moved, and the players told if the game master said so
  function happen(id, e, o) {
    // (recorded as done before the clock moves: moving it sets the watches off, and they must find it done)
    const st = S(), s = evState(id) || {}, rec = Object.assign({}, s, { state: "done", at: now(), t: Date.now(), auto: !!o.auto, news: null, ticked: null, def: s.def });
    if (o.tell && tellable(e)) rec.news = tell(e);
    st.set("events", id, rec);
    if (e.tick) { const [cid, by] = [].concat(e.tick), cl = (A.clocksData || []).find(x => x.id === cid); if (cl) { const tot = +cl.segments || (cl.ticks || []).length || 4, was = api.clockAt(cl), to = Math.min(tot, was + (+by || 1)); if (to !== was) { st.set("events", id, Object.assign({}, rec, { ticked: [cid, to - was] })); st.set("clocks", cid, Object.assign({}, st.get("clocks", cid) || {}, { at: to, t: Date.now() })); } } }
  }
  function tell(e) {
    const n = e.news || {}, id = "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    S().set("news", id, { m: now(), when: at(now()).short, headline: n.headline || e.title, text: n.text || e.players || "", paper: n.paper || "", t: Date.now() });
    return id;
  }
  // the events now due: called off if what they rest on is gone; else they happen by themselves, or wait for the game
  // master (each once; "later" ones again when their hour comes). Only once everything it reads has come from the store,
  // else an event already decided would be put again; and not while the world is paused.
  // (what it changes sets the store's watches off, which call it again: that call waits until this one is through)
  const WATCH = ["clock", "events", "eventdefs", "clues", "status", "clocks", "fog", "news"], loaded = new Set();
  let running = false, again = false;
  function evaluate() {
    if (running) { again = true; return; }
    running = true; try { evaluateNow(); } finally { running = false; }
    if (again) { again = false; setTimeout(evaluate, 0); }
  }
  function evaluateNow() {
    const st = S(); if (!st || WATCH.some(c => !loaded.has(c)) || opts().paused) return;
    const said = [];
    for (let pass = 0; pass < 6; pass++) {
      let changed = false; const t = now();
      for (const e of evDefs()) {
        const s = evState(e.id), no = offBy(e);
        if (s && ["done", "dismissed", "off"].includes(s.state)) continue;
        if (s && (s.state === "pending" || s.state === "later") && no) { st.set("events", e.id, Object.assign({}, s, { state: "off", at: t, t: Date.now(), because: cond(no) })); if (rank(e) >= 1) said.push(`Called off: ${e.title} (${cond(no)})`); changed = true; continue; }
        if (s && s.state === "pending") continue;
        if (s && s.state === "later" && t < (s.until || 0)) continue;
        const w = dueAt(e); if (w != null && t < w) continue;
        if (w == null && ![].concat(e.after || []).length) continue;
        if (!ready(e)) continue;
        if (no) { st.set("events", e.id, { state: "off", at: t, t: Date.now(), because: cond(no) }); if (rank(e) >= 1) said.push(`Called off: ${e.title} (${cond(no)})`); }
        else if (needs(e)) { st.set("events", e.id, { state: "pending", at: t, t: Date.now() }); said.push(`Waiting for you: ${e.title}${rank(e) >= 3 ? " (critical)" : ""}`); }
        else { happen(e.id, e, { auto: true }); if (rank(e) >= 1) said.push(`It happened: ${e.title}`); }
        changed = true;
      }
      if (!changed) break;
    }
    if (said.length) { api.note(said.length > 2 ? `${said.length} things in the world: ${said.slice(0, 2).join("; ")}… (under Time)` : said.join("; ") + "."); badge(); }
  }
  // the time moved on: small things happen in a living world, if the game master wants them (a line of a random table;
  // each notable, so it happens by itself unless the game master asked to see everything first)
  function advance(mins) {
    if (opts().paused) return;
    const st = S(), to = Math.max(0, now() + mins), o = opts(); setNow(to);
    if (o.random && mins >= 720) {
      const tables = Object.entries(A.tablesData || {}), pick = tables.find(([k]) => k === o.table) || tables.find(([k]) => /event|rumou?r|street|encounter|weather|news/i.test(k)) || tables[0], p = (FREQ.find(f => f[0] === o.freq) || FREQ[1])[2];
      for (let d = 0; d < Math.min(3, Math.round(mins / 1440) || 1); d++) if (pick && Math.random() < p) {
        const line = T.rollTable(Array.isArray(pick[1]) ? pick[1] : pick[1].rows || pick[1].items || []); if (!line) continue;
        const id = "r" + Date.now().toString(36) + d, def = { id, title: "Something small happens", what: String(line), players: String(line), importance: "notable", random: pick[0] };
        if (needs(def)) st.set("events", id, { state: "pending", at: to, t: Date.now(), def }); else st.set("events", id, { state: "done", at: to, t: Date.now(), auto: true, def });
        api.note(`Something small happens: ${String(line).slice(0, 90)}`);
      }
    }
    setTimeout(evaluate, 50);
  }
  // the game master's answer to an event: it happens (the players told or not), later, or not at all; or taken back
  function decide(id, how, o) {
    const st = S(), e = defOf(id), s = evState(id) || {}; if (!e) return;
    if (how === "done") { happen(id, e, { tell: o && o.tell }); api.note(`${e.title}: it happened${o && o.tell && tellable(e) ? ", and the players have been told" : ""}.`); }
    else if (how === "tell") { if (s.state === "done" && !s.news) { st.set("events", id, Object.assign({}, s, { news: tell(e) })); api.note("Told to the players."); } }
    else if (how === "later") st.set("events", id, Object.assign({}, s, { state: "later", until: now() + (o && o.hours || 1) * 60, def: s.def }));
    else if (how === "dismiss") st.set("events", id, Object.assign({}, s, { state: "dismissed", def: s.def }));
    else if (how === "undo") {
      // taken back: what it moved moves back, and what the players were told of it is taken back too
      if (s.ticked) { const [cid, by] = s.ticked, cl = (A.clocksData || []).find(x => x.id === cid); if (cl) st.set("clocks", cid, Object.assign({}, st.get("clocks", cid) || {}, { at: Math.max(0, api.clockAt(cl) - by), t: Date.now() })); }
      if (s.news) st.set("news", s.news, null);
      // (and if it is still due, it waits for the game master rather than happening again by itself)
      const w = dueAt(e), due = !e.random && (w != null ? now() >= w : [].concat(e.after || []).length > 0) && ready(e) && !offBy(e);
      st.set("events", id, due ? { state: "pending", at: now(), t: Date.now() } : null);
    }
    setTimeout(() => { evaluate(); badge(); }, 50);
  }
  const pending = () => { const st = S(); if (!st) return []; return Object.entries(st.get("events") || {}).filter(([, s]) => s && s.state === "pending").map(([id, s]) => ({ id, s, e: defOf(id) })).filter(x => x.e).sort((a, b) => (rank(b.e) - rank(a.e)) || a.s.t - b.s.t); };
  // what is coming: events with an hour, not yet due, soonest first; and those that wait only on something happening
  const coming = () => evDefs().filter(e => { const s = evState(e.id); return (!s || s.state === "later") && dueAt(e) != null && dueAt(e) > now(); }).sort((a, b) => dueAt(a) - dueAt(b));
  const waiting = () => evDefs().filter(e => { const s = evState(e.id); return (!s || s.state === "later") && !(dueAt(e) > now()) && [].concat(e.after || []).length && !ready(e); });
  function badge() { const n = pending().length, b = document.querySelector('#tDock [data-dock="time"]'); if (!b) return; let i = b.querySelector(".tw-n"); if (!i) { i = document.createElement("b"); i.className = "tw-n"; b.appendChild(i); } i.textContent = n || ""; i.hidden = !n; }

  /* ---- a condition in words, and the choices for one in the event form */
  const clueOf = ref => { const [pl, cid] = String(ref).split("/"); return A.maps[pl] ? (A.get(pl, 99).clues || {})[cid] : null; };
  const clockOf = id => (A.clocksData || []).find(x => x.id === id);
  function cond(c) {
    if (c.clue) { const k = clueOf(c.clue); return `the clue "${k ? k.t : c.clue}" is found`; }
    if (c.visit) return `the party reaches ${placeName(c.visit)}`;
    if (c.known) return `the party hears of ${placeName(c.known)}`;
    if (c.clock) { const [cid, n] = [].concat(c.clock), k = clockOf(cid); return `the clock "${k ? k.name : cid}" reaches step ${+n || 1}`; }
    if (c.event) return `${c.hours ? c.hours + " hours after " : ""}"${(defOf(c.event) || {}).title || c.event}"`;
    return "";
  }
  const condsText = l => [].concat(l || []).map(cond).filter(Boolean).join(", and ");
  function choices(skip) {
    const pls = A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-")), clues = [];
    for (const pl of pls) if (A.maps[pl]) for (const [cid, c] of Object.entries(A.get(pl, 99).clues || {})) clues.push([`clue:${pl}/${cid}`, `${placeName(pl)}: ${c.t || cid}`]);
    return [["A clue is found", clues], ["The party reaches", pls.map(id => ["visit:" + id, placeName(id)])], ["The party hears of", pls.map(id => ["known:" + id, placeName(id)])],
      ["A villain's clock reaches a step", (A.clocksData || []).map(c => ["clock:" + c.id, c.name])], ["Another event has happened (and so many hours since)", evDefs().filter(e => e.id !== skip).map(e => ["event:" + e.id, e.title])]].filter(g => g[1].length);
  }
  const toRow = c => c.clue ? { v: "clue:" + c.clue } : c.visit ? { v: "visit:" + c.visit } : c.known ? { v: "known:" + c.known } : c.clock ? { v: "clock:" + [].concat(c.clock)[0], n: [].concat(c.clock)[1] } : c.event ? { v: "event:" + c.event, n: c.hours } : { v: "" };
  const fromRow = r => { const i = r.v.indexOf(":"), k = r.v.slice(0, i), v = r.v.slice(i + 1); return k === "clock" ? { clock: [v, +r.n || 1] } : k === "event" ? Object.assign({ event: v }, +r.n ? { hours: +r.n } : {}) : k ? { [k]: v } : null; };

  /* ---- drawing it: the tab, and the quick tool's panel */
  const imp = e => { const k = IMP[e.importance] ? e.importance : "notable", nm = IMP[k][0]; return `<span class="tw-imp tw-${esc(nm.toLowerCase())}">${esc(nm)}</span>`; };
  const whenText = e => { const w = dueAt(e); return w == null ? "" : `${at(w).short} (day ${at(w).day})`; };
  // the whole of an event for the game master: what, where, who, why, what caused it, what follows, what the players hear
  function detail(e, cause) {
    const hear = e.news ? [e.news.paper, e.news.headline].filter(Boolean).join(" · ") + (e.news.text ? ". " + e.news.text : "") : e.players;
    const row = (k, v) => v ? `<div class="tw-f"><span class="kn">${k}</span> ${v}</div>` : "";
    return `${e.what ? `<p>${esc(e.what)}</p>` : ""}${row("Who", esc([].concat(e.who || []).join(", ")))}${row("Factions", esc([].concat(e.factions || []).join(", ")))}${cause ? row("Because", esc(cause)) : ""}${row("Why <i>(only you)</i>", esc(e.why || e.secret || ""))}${row("What follows", esc(e.then || ""))}${(e.outcomes || []).length ? row("It may go", esc([].concat(e.outcomes).join(" · "))) : ""}${row("Called off if", esc(condsText(e.unless)))}${row("The players hear", esc(hear || ""))}${e.tick ? row("It moves", esc(`the clock "${(clockOf([].concat(e.tick)[0]) || {}).name || [].concat(e.tick)[0]}" on ${+[].concat(e.tick)[1] || 1}`)) : ""}`;
  }
  function pendingCard(x, compact) {
    const e = x.e, tl = tellable(e);
    return `<article class="tw-ev tw-due tw-r${rank(e)}"><div class="tw-h">${imp(e)}<b>${esc(e.title)}</b>${e.place ? `<span class="kn">${esc(placeName(e.place))}</span>` : ""}<span class="kn">${esc(at(x.s.at).short)}</span></div>${compact ? (e.what ? `<p>${esc(e.what)}</p>` : "") : detail(e, condsText(e.after))}
      <div class="t-row"><button type="button" class="t-btn prim" data-tw="done" data-id="${esc(x.id)}" data-tell="${tl ? 1 : 0}">It happens${tl ? " · tell the players" : ""}</button>${tl ? `<button type="button" class="t-mini" data-tw="done" data-id="${esc(x.id)}" data-tell="0" title="It happens, and the players are not told now">Quietly</button>` : ""}${compact || e.random ? "" : `<button type="button" class="t-mini" data-tw="edit" data-id="${esc(x.id)}">Change it first</button>`}<button type="button" class="t-mini" data-tw="later" data-id="${esc(x.id)}" data-h="1">An hour later</button><button type="button" class="t-mini" data-tw="later" data-id="${esc(x.id)}" data-h="24">Tomorrow</button><button type="button" class="t-mini" data-tw="dismiss" data-id="${esc(x.id)}">Not at all</button></div></article>`;
  }
  const STEPS = [[10, "+10 min"], [60, "+1 hour"], [240, "+4 hours"], [1440, "+1 day"], [10080, "+1 week"]];
  function nowHTML(compact) {
    const d = at(now()), o = opts();
    return `<div class="tw-now"><div class="tw-date">${esc(d.long)}</div><div class="tw-time">${esc(d.time)} · day ${d.day}</div></div>${o.paused ? `<p class="tw-paused">The world is paused: time stands still and nothing comes due. <button type="button" class="t-link" data-tw="pause">Start it again</button></p>` : ""}
      <div class="t-row tw-adv">${STEPS.map(([m, l]) => `<button type="button" class="t-mini" data-tw="adv" data-m="${m}"${o.paused ? " disabled" : ""}>${l}</button>`).join("")}${compact ? "" : `<button type="button" class="t-mini" data-tw="back" title="Take back the last step of time (what happened stays: undo it below)"${backStack.length ? "" : " disabled"}>Undo</button>`}</div>
      ${compact ? "" : `<form class="t-row tw-custom" data-tw="custom"><label class="kn">Move on <input class="t-in t-n" type="number" name="n" min="1" max="999" value="3"></label><select class="t-in tw-sel" name="u"><option value="1">minutes</option><option value="60" selected>hours</option><option value="1440">days</option><option value="10080">weeks</option></select><button class="t-mini"${o.paused ? " disabled" : ""}>Go</button><span class="t-sp"></span><button type="button" class="t-mini" data-tw="pause">${o.paused ? "Start the world" : "Pause the world"}</button></form>`}`;
  }
  const field = (lbl, inner, hint) => `<label class="tw-l"><span>${lbl}</span>${inner}${hint ? `<small class="kn">${hint}</small>` : ""}</label>`;
  function editHTML() {
    const d = UI.edit.d, ch = choices(UI.edit.id), pls = A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-"));
    const rows = w => (d[w] || []).map((r, i) => `<div class="tw-cond"><select class="t-in" name="${w}k${i}"><option value="">Choose…</option>${ch.map(([g, o]) => `<optgroup label="${esc(g)}">${o.map(([v, l]) => `<option value="${esc(v)}"${v === r.v ? " selected" : ""}>${esc(l)}</option>`).join("")}</optgroup>`).join("")}</select><input class="t-in t-n" type="number" min="0" name="${w}n${i}" value="${esc(r.n == null ? "" : r.n)}" title="For a clock: the step it must reach. For an event: the hours after it." placeholder="step/h"><button type="button" class="t-mini" data-tw="delcond" data-w="${w}" data-i="${i}" aria-label="Remove this condition">×</button></div>`).join("");
    const dd = d.day ? whenOf(`day ${d.day} ${d.time || "00:00"}`) : null;
    return `<section class="t-card tw-edit" id="twEdit"><h3>${UI.edit.id ? "Change the event" : "Plan an event"}</h3>${UI.err ? `<p class="t-err">${esc(UI.err)}</p>` : ""}<form data-tw="save">
      ${field("Title", `<input class="t-in" name="title" maxlength="140" value="${esc(d.title || "")}" required>`)}
      <div class="tw-2">${field("How much it matters", `<select class="t-in" name="importance">${["background", "notable", "major", "critical"].map(k => `<option value="${k}"${(d.importance === "minor" ? "notable" : d.importance || "notable") === k ? " selected" : ""}>${IMP[k][0]}</option>`).join("")}</select>`, "Background and notable ones happen by themselves; you choose under Time which wait for you.")}
        ${field("Where", `<select class="t-in" name="place"><option value="">Nowhere in particular</option>${pls.map(id => `<option value="${esc(id)}"${id === d.place ? " selected" : ""}>${esc(placeName(id))}</option>`).join("")}</select>`)}</div>
      <div class="tw-2">${field("On day", `<input class="t-in t-n" type="number" min="1" name="day" value="${esc(d.day || "")}"> <input class="t-in tw-tm" type="time" name="time" value="${esc(d.time || "09:00")}">`, dd != null ? `That is ${esc(at(dd).long)}, ${esc(at(dd).time)}.` : "Leave the day empty for an event that waits only on what happens.")}
        ${field("Who is involved", `<input class="t-in" name="who" value="${esc([].concat(d.who || []).join(", "))}">`)}</div>
      <div class="tw-conds"><span class="kn">It waits until all of these have happened</span>${rows("after")}<button type="button" class="t-link" data-tw="addcond" data-w="after">+ a condition</button></div>
      <div class="tw-conds"><span class="kn">It is called off if any of these happens first</span>${rows("unless")}<button type="button" class="t-link" data-tw="addcond" data-w="unless">+ a reason to call it off</button></div>
      ${field("What happens <i>(for you)</i>", `<textarea class="t-in" name="what" rows="2">${esc(d.what || "")}</textarea>`)}
      ${field("Why <i>(only you: the cause, hidden plans, motives)</i>", `<textarea class="t-in" name="why" rows="2">${esc(d.why || d.secret || "")}</textarea>`)}
      ${field("What follows", `<textarea class="t-in" name="then" rows="2">${esc(d.then || "")}</textarea>`)}
      ${field("How it may go <i>(one a line)</i>", `<textarea class="t-in" name="outcomes" rows="2">${esc([].concat(d.outcomes || []).join("\n"))}</textarea>`)}
      ${field("Factions", `<input class="t-in" name="factions" value="${esc([].concat(d.factions || []).join(", "))}">`)}
      <div class="tw-2">${field("A headline for the players", `<input class="t-in" name="headline" maxlength="140" value="${esc((d.news || {}).headline || d.headline || "")}">`)}${field("How they hear it", `<input class="t-in" name="paper" maxlength="80" value="${esc((d.news || {}).paper || d.paper || "")}" placeholder="a rumour, a bulletin, a broadcast">`)}</div>
      ${field("What the players hear <i>(it may differ from the truth; empty if nothing)</i>", `<textarea class="t-in" name="players" rows="2">${esc((d.news || {}).text || d.players || "")}</textarea>`)}
      ${(A.clocksData || []).length ? field("It moves a villain's clock", `<select class="t-in" name="tickc"><option value="">No</option>${A.clocksData.map(c => `<option value="${esc(c.id)}"${c.id === [].concat(d.tick || [])[0] ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select> <input class="t-in t-n" type="number" min="1" max="12" name="tickn" value="${esc([].concat(d.tick || [])[1] || 1)}">`) : ""}
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-btn" data-tw="cancel">Cancel</button>${UI.edit.id && (defOf(UI.edit.id) || {}).edited ? `<button type="button" class="t-mini" data-tw="restore" data-id="${esc(UI.edit.id)}">Back to the council's</button>` : ""}${UI.edit.id ? `<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-tw="remove" data-id="${esc(UI.edit.id)}">Remove it</button>` : ""}</div></form></section>`;
  }
  function suggHTML() {
    const l = UI.sugg || [];
    return `<section class="t-card tw-council"><h3>Ask the council</h3><p class="t-small">The council suggests what the world does next, each from what the campaign already holds: a villain's plan, someone's motive, what the party has done. Nothing is added until you say so.</p>
      <form class="t-row" data-tw="ask"><input class="t-in" name="q" maxlength="300" value="${esc(UI.focus)}" placeholder="What should they think about? (e.g. what does the doctor do if they go to security?)"><button class="t-btn"${UI.busy ? " disabled" : ""}>${UI.busy ? "The council is talking…" : "Suggest events"}</button></form>${UI.err && !UI.edit ? `<p class="t-err">${esc(UI.err)}</p>` : ""}
      ${l.map((x, i) => `<article class="tw-ev tw-sg"><div class="tw-h">${imp(x)}<b>${esc(x.title)}</b>${x.when ? `<span class="kn">${esc(whenText(x))}</span>` : ""}${x.place ? `<span class="kn">${esc(placeName(x.place))}</span>` : ""}<span class="tw-ground ${x.grounded ? "ok" : ""}">${x.grounded ? "From the campaign" : "A new idea"}</span></div>${detail(x, condsText(x.after) ? "it waits until " + condsText(x.after) : "")}${x.basis ? `<p class="kn tw-basis">“${esc(x.basis)}”</p>` : ""}<div class="t-row"><button type="button" class="t-btn prim" data-tw="sgadd" data-i="${i}">Add it</button><button type="button" class="t-mini" data-tw="sgedit" data-i="${i}">Change it, then add</button><button type="button" class="t-mini" data-tw="sgno" data-i="${i}">Not this</button></div></article>`).join("")}</section>`;
  }
  function html() {
    const P = pending(), C = coming(), Wt = waiting(), st = S(), o = opts(), news = Object.entries(st.get("news") || {}).sort((a, b) => b[1].t - a[1].t);
    const hist = allDone().sort((a, b) => (b[1].at - a[1].at) || (b[1].t - a[1].t)), gone = (A.eventsData || []).filter(e => ((st.get("eventdefs") || {})[e.id] || {}).gone);
    const evRow = e => `<div class="tw-ev"><div class="tw-h">${imp(e)}<b>${esc(e.title)}</b><span class="kn">${dueAt(e) != null ? esc(whenText(e)) + ([].concat(e.after || []).length ? " · if " + esc(condsText(e.after)) : "") : "when " + esc(condsText(e.after))}</span>${e.own ? `<span class="tw-tag">yours</span>` : e.edited ? `<span class="tw-tag">changed</span>` : ""}<button type="button" class="t-link" data-tw="edit" data-id="${esc(e.id)}">change</button></div>${e.what ? `<p class="t-small">${esc(e.what)}</p>` : ""}${[].concat(e.unless || []).length ? `<p class="t-small kn">Called off if ${esc(condsText(e.unless))}.</p>` : ""}</div>`;
    return `<div class="t-grid t-g2w"><div>
      <section class="t-card"><h3>${T.icon("time")} The world's time</h3>${nowHTML()}<p class="t-small">Move time on as the story does: a conversation, a night's rest, a journey. What comes due happens by itself if it is background or notable, and waits for you if it matters more; anything whose reason is gone is called off.</p>
        <label class="t-small tw-ask">Wait for me before <select class="t-in tw-sel" data-tw="ask">${ASK.map(([k, l]) => `<option value="${k}"${(o.ask || "major") === k ? " selected" : ""}>${l}</option>`).join("")}</select></label></section>
      ${P.length ? `<section class="t-card"><h3>Waiting for you <span class="kn">${P.length}</span></h3>${P.map(x => pendingCard(x)).join("")}</section>` : ""}
      ${UI.edit ? editHTML() : ""}
      <section class="t-card"><div class="tw-hh"><h3>Coming</h3><button type="button" class="t-btn" data-tw="new">Plan an event</button></div>${C.length ? C.slice(0, 16).map(evRow).join("") : `<p class="kn">Nothing set for an hour.</p>`}
        ${Wt.length ? `<h4 class="tw-sub">When something happens</h4>${Wt.map(evRow).join("")}` : ""}</section>
      ${suggHTML()}
      <section class="t-card"><h3>What has happened</h3>${hist.length ? `<ol class="tw-hist" reversed>${hist.map(([e, s]) => `<li class="tw-r${rank(e)}${s.state === "off" ? " tw-off" : ""}"><span class="kn">${esc(at(s.at).short)}</span> ${imp(e)} ${esc(e.title)}${s.state === "off" ? ` <span class="kn">called off: ${esc(s.because || "")}</span>` : s.auto ? ` <span class="kn">by itself</span>` : ""}${s.state === "done" && tellable(e) && !s.news ? ` <button type="button" class="t-link" data-tw="tell" data-id="${esc(e.id)}">tell the players</button>` : ""} <button type="button" class="t-link" data-tw="undo" data-id="${esc(e.id)}">undo</button></li>`).join("")}</ol>` : `<p class="kn">Nothing yet.</p>`}
        ${gone.length ? `<p class="t-small kn">Removed: ${gone.map(e => `${esc(e.title)} <button type="button" class="t-link" data-tw="restore" data-id="${esc(e.id)}">bring back</button>`).join(", ")}</p>` : ""}</section></div>
      <div><section class="t-card"><h3>The world's news</h3>${news.length ? news.slice(0, 12).map(([id, n]) => `<div class="tw-ev"><div class="tw-h"><b>${esc(n.headline)}</b><span class="kn">${esc(n.when || "")}${n.paper ? " · " + esc(n.paper) : ""}</span></div>${n.text ? `<p>${esc(n.text)}</p>` : ""}<div class="t-row"><button type="button" class="t-mini" data-tw="unnews" data-id="${esc(id)}">Take back</button></div></div>`).join("") : `<p class="kn">Nothing told to the players yet. What you let them hear of an event goes to their screen and their copy.</p>`}
        <form class="tw-own" data-tw="own"><input class="t-in" name="h" maxlength="120" placeholder="News of your own: a headline"><input class="t-in" name="p" maxlength="80" placeholder="How they hear it: a rumour, a bulletin"><textarea class="t-in" name="x" rows="2" maxlength="1200" placeholder="What the players hear"></textarea><button class="t-btn">Tell the players</button></form></section>
      <section class="t-card"><h3>Small happenings</h3><label class="t-fogck"><input type="checkbox" data-tw="random"${o.random ? " checked" : ""}> When half a day or more passes, roll for something small</label>${Object.keys(A.tablesData || {}).length ? `<div class="t-row"><label class="t-small">From <select class="t-in tw-sel" data-tw="table">${Object.keys(A.tablesData).map(k => `<option${k === o.table ? " selected" : ""}>${esc(k)}</option>`).join("")}</select></label><label class="t-small">How often <select class="t-in tw-sel" data-tw="freq">${FREQ.map(([k, l]) => `<option value="${k}"${(o.freq || "some") === k ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>` : `<p class="kn">The campaign has no random tables for it.</p>`}<p class="t-small">Only small, local things: a rumour, a quarrel, a delay. Never a disaster.</p></section>
      <section class="t-card"><h3>The calendar</h3>${calHTML()}</section></div></div>`;
  }
  function calHTML() {
    const c = cal() || {}, real = typeof c.start === "string" && DATE.test(c.start.trim()), so = typeof c.start === "object" && c.start ? c.start : {};
    return `<form data-tw="cal"><p class="t-small">The story begins ${esc(at(0).long)}, ${esc(at(0).time)}.</p>
      ${field("It begins on", `<input class="t-in" name="start" value="${esc(real ? c.start : "")}" placeholder="a date: 1888-10-31 21:00">`, "A real date and hour; or leave it empty for the world's own calendar below.")}
      <div class="tw-2">${field("Or the world's own: year", `<input class="t-in t-n" type="number" name="year" value="${esc(so.year || c.year || "")}">`)}${field("Era", `<input class="t-in" name="era" maxlength="20" value="${esc(c.era || "")}" placeholder="AR, the Third Age">`)}</div>
      ${field("Its months", `<input class="t-in" name="months" value="${esc((c.months || []).map(m => Array.isArray(m) ? m[0] + ":" + m[1] : m).join(", "))}" placeholder="Frostmoon:30, Thaw:28, Sowing:30">`, "Each a name and its days.")}
      ${field("Its weekdays", `<input class="t-in" name="weekdays" value="${esc((c.weekdays || []).join(", "))}" placeholder="Moonday, Tirsday, Wodday">`)}
      <div class="t-row"><button class="t-mini">Keep the calendar</button>${S().get("clock", "cal") ? `<button type="button" class="t-mini" data-tw="calreset">Back to the council's</button>` : ""}</div></form>`;
  }

  /* ---- the council's suggestions (Claude, from the campaign's own words; kept only when the game master adds them) */
  function councilPrompt(q) {
    const c = A.config || {}, d = at(now()), pls = A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-"));
    const clues = []; for (const pl of pls) if (A.maps[pl]) for (const [cid, k] of Object.entries(A.get(pl, 99).clues || {})) clues.push(`${pl}/${cid}: ${k.t || cid}`);
    const hits = api.lookup([q, "plan intends will next week tonight", ...(A.clocksData || []).map(x => x.name)].filter(Boolean).join(" "), 10);
    const people = Object.entries(A.castData || {}).slice(0, 24).map(([k, p]) => `${p.n}${p.role ? ", " + p.role : ""}${p.want ? "; wants: " + p.want : ""}${p.secret ? "; hides: " + p.secret : ""}`).join("\n");
    const lately = A.copilot && A.copilot.lately ? A.copilot.lately() : "";
    return `You are the story council of the tabletop roleplaying campaign "${c.title || ""}"${c.system ? " (" + c.system + ")" : ""}${c.setting ? ", set in " + c.setting : ""}. The game master asks you to plan what happens in the world whether or not the party acts.${q ? " They ask: " + q : " Suggest what the world does next."}

Rules. Every event grows from what the campaign already establishes: an enemy's plan or clock, someone's motive, a place's situation, a consequence of what the party has done. No random catastrophes: never destroy a city, kill an important person, start a war or rewrite the story without a cause the campaign gives. Prefer events that change something the players can notice or hear of, and give each a condition that would make it no longer happen (unless). Say how much each matters: background (a small change), notable, major (could change the campaign), critical. Keep what the players hear apart from the truth: it may be a rumour or a cover story. Do not repeat the events already planned.

It is now ${d.long}, ${d.time}: day ${d.day} of the story (day 1 is the day it begins).

EVENTS ALREADY PLANNED (id: title, when):
${evDefs().map(e => `${e.id}: ${e.title}${dueAt(e) != null ? ", day " + at(dueAt(e)).day : ""}${[].concat(e.after || []).length ? ", when " + condsText(e.after) : ""}`).join("\n") || "(none)"}

THE VILLAINS' CLOCKS (id: name, step now of all; the next step):
${(A.clocksData || []).map(k => `${k.id}: ${k.name}, ${api.clockAt(k)} of ${+k.segments || (k.ticks || []).length || 4}; next: ${(k.ticks || [])[api.clockAt(k)] || k.done || ""}`).join("\n") || "(none)"}

PLACES (id: name):
${pls.map(id => `${id}: ${placeName(id)}`).join("\n")}

CLUES (place/id: title):
${clues.slice(0, 80).join("\n") || "(none)"}

${people ? "PEOPLE:\n" + people + "\n\n" : ""}WHAT HAS HAPPENED AT THE TABLE LATELY:
${lately || "(nothing recorded)"}

THE CAMPAIGN'S OWN WORDS:
${hits.map((h, i) => `[${i + 1}] ${h.src}\n${h.text}`).join("\n\n") || "(nothing found)"}

Answer with only a JSON array of two to five events, each:
{"title": "", "importance": "background|notable|major|critical", "when": "day N HH:MM, or empty", "after": [conditions it waits for], "unless": [conditions that call it off], "place": "a place id, or empty", "who": "who is involved", "what": "what happens, for the game master", "why": "the cause and the hidden truth", "then": "what follows from it", "outcomes": ["how it may go"], "players": "what the players can hear of it, or empty", "headline": "", "paper": "how they hear it", "basis": "a short exact quote from the campaign's own words that it grows from"}
A condition is one of {"clue": "place/id"}, {"visit": "place id"}, {"known": "place id"}, {"clock": ["clock id", step]}, {"event": "event id", "hours": N}, using only the ids above. Every event needs a "when" later than now, or at least one condition in "after".`;
  }
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // what Claude said, kept only where it names what is there; a quote it says it grew from is checked in the campaign
  function cleanSugg(x) {
    if (!x || typeof x !== "object" || !String(x.title || "").trim()) return null;
    const pls = new Set(A.order), okC = c => c && typeof c === "object" && (c.clue ? !!clueOf(c.clue) : c.visit ? pls.has(c.visit) : c.known ? pls.has(c.known) : c.clock ? !!clockOf([].concat(c.clock)[0]) : c.event ? !!defOf(c.event) : false);
    const e = { title: String(x.title).slice(0, 140), importance: IMP[x.importance] ? x.importance : "notable", after: [].concat(x.after || []).filter(okC), unless: [].concat(x.unless || []).filter(okC) };
    const w = typeof x.when === "string" && /^day\s*\d+/i.test(x.when.trim()) ? x.when.trim() : ""; if (w && whenOf(w) > now()) e.when = w;
    if (e.when == null && !e.after.length) return null;
    if (x.place && pls.has(x.place)) e.place = x.place;
    for (const k of ["who", "what", "why", "then", "players"]) if (typeof x[k] === "string" && x[k].trim()) e[k] = x[k].trim().slice(0, 1200);
    if (Array.isArray(x.outcomes)) e.outcomes = x.outcomes.filter(o => typeof o === "string" && o.trim()).slice(0, 5);
    if (typeof x.headline === "string" && x.headline.trim()) e.news = { headline: x.headline.trim().slice(0, 140), text: e.players || "", paper: typeof x.paper === "string" ? x.paper.trim().slice(0, 80) : "" };
    if (typeof x.basis === "string" && x.basis.trim()) { e.basis = x.basis.trim().slice(0, 300); const b = norm(e.basis).slice(0, 80); e.grounded = b.length > 12 && api.lookup(e.basis, 4).some(d => norm(d.text).includes(b)); }
    return e;
  }
  async function askCouncil(q) {
    UI.busy = true; UI.err = ""; UI.focus = q; paint();
    let r = null; try { r = await api.askRaw(councilPrompt(q), () => {}); } catch (e) { r = null; }
    UI.busy = false;
    if (!r) { UI.err = "Claude is not reachable from this page. Plan an event yourself: it works the same."; paint(); return; }
    let got = []; try { const t = String(r), a = t.indexOf("["), b = t.lastIndexOf("]"); got = JSON.parse(t.slice(a, b + 1)); } catch (e) { got = []; }
    UI.sugg = (Array.isArray(got) ? got : []).map(cleanSugg).filter(Boolean);
    if (!UI.sugg.length) UI.err = "The council's answer could not be read as events. Ask again, perhaps more precisely.";
    paint();
  }

  /* ---- the event form */
  const draftOf = e => { const w = e && dueAt(e), [day, time] = w != null ? dayTime(w) : ["", "09:00"]; return Object.assign({}, e || {}, { day, time, after: [].concat((e && e.after) || []).map(toRow), unless: [].concat((e && e.unless) || []).map(toRow) }); };
  function readForm(f) {
    const d = UI.edit.d, g = n => (f.elements[n] ? String(f.elements[n].value || "").trim() : "");
    for (const k of ["title", "importance", "place", "day", "time", "who", "what", "why", "then", "outcomes", "factions", "headline", "paper", "players", "tickc", "tickn"]) d[k] = g(k);
    for (const w of ["after", "unless"]) d[w] = (d[w] || []).map((r, i) => ({ v: g(w + "k" + i), n: g(w + "n" + i) }));
    d.news = null;
  }
  function saveForm() {
    const d = UI.edit.d;
    if (!d.title) { UI.err = "Give it a title."; return false; }
    const after = d.after.filter(r => r.v).map(fromRow).filter(Boolean), unless = d.unless.filter(r => r.v).map(fromRow).filter(Boolean);
    if (!d.day && !after.length) { UI.err = "Give it a day, or something it waits on."; return false; }
    const list = s => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
    const def = { title: d.title.slice(0, 140), importance: d.importance || "notable" };
    if (d.day) def.when = `day ${+d.day} ${d.time || "00:00"}`;
    if (after.length) def.after = after; if (unless.length) def.unless = unless;
    for (const k of ["place", "what", "why", "then", "players"]) if (d[k]) def[k] = d[k];
    if (list(d.who).length) def.who = list(d.who); if (list(d.factions).length) def.factions = list(d.factions);
    const outs = String(d.outcomes || "").split("\n").map(x => x.trim()).filter(Boolean); if (outs.length) def.outcomes = outs;
    if (d.headline) def.news = { headline: d.headline, text: d.players || "", paper: d.paper || "" };
    if (d.tickc) def.tick = [d.tickc, +d.tickn || 1];
    const id = UI.edit.id || "e" + Date.now().toString(36);
    S().set("eventdefs", id, def);
    api.note(UI.edit.id ? `${def.title}: changed.` : `${def.title}: planned.`);
    UI.edit = null; UI.err = ""; return true;
  }

  /* ---- what the game master does */
  const backStack = [];
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-tw]"); if (!b || ["INPUT", "FORM", "SELECT", "TEXTAREA"].includes(b.tagName)) return;
    const k = b.dataset.tw, id = b.dataset.id, f = b.closest("form[data-tw='save']");
    if (f && UI.edit && (k === "addcond" || k === "delcond")) readForm(f);
    switch (k) {
      case "adv": backStack.push(now()); advance(+b.dataset.m); break;
      case "back": if (backStack.length) setNow(backStack.pop()); break;
      case "pause": S().set("clock", "opts", Object.assign({}, opts(), { paused: !opts().paused })); setTimeout(evaluate, 60); break;
      case "done": decide(id, "done", { tell: b.dataset.tell === "1" }); break;
      case "tell": decide(id, "tell"); break;
      case "later": decide(id, "later", { hours: +b.dataset.h }); break;
      case "dismiss": decide(id, "dismiss"); break;
      case "undo": decide(id, "undo"); break;
      case "unnews": S().set("news", id, null); break;
      case "new": UI.edit = { id: null, d: draftOf(null) }; UI.err = ""; break;
      case "edit": UI.edit = { id, d: draftOf(defOf(id)) }; UI.err = ""; if (api.tab() !== "time") api.open("time"); break;
      case "cancel": UI.edit = null; UI.err = ""; break;
      case "addcond": UI.edit.d[b.dataset.w].push({ v: "", n: "" }); break;
      case "delcond": UI.edit.d[b.dataset.w].splice(+b.dataset.i, 1); break;
      case "restore": S().set("eventdefs", id, null); if (UI.edit && UI.edit.id === id) UI.edit = null; break;
      case "remove": {
        const own = !(A.eventsData || []).some(x => x.id === id);
        if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Remove it? Click again"; return; }
        S().set("eventdefs", id, own ? null : { gone: true }); if (own) S().set("events", id, null); UI.edit = null; break;
      }
      case "sgadd": { const x = (UI.sugg || [])[+b.dataset.i]; if (x) { const def = Object.assign({}, x); delete def.grounded; delete def.basis; S().set("eventdefs", "e" + Date.now().toString(36), def); UI.sugg.splice(+b.dataset.i, 1); api.note(`${x.title}: planned.`); } break; }
      case "sgedit": { const x = (UI.sugg || [])[+b.dataset.i]; if (x) { UI.edit = { id: null, d: draftOf(x) }; UI.sugg.splice(+b.dataset.i, 1); } break; }
      case "sgno": (UI.sugg || []).splice(+b.dataset.i, 1); break;
      case "calreset": S().set("clock", "cal", null); setTimeout(() => setNow(now()), 60); break;
      default: return;
    }
    setTimeout(() => { paint(); if (k === "new" || k === "edit" || k === "sgedit") { const el = document.getElementById("twEdit"); if (el) { el.scrollIntoView({ block: "start" }); const t = el.querySelector("input[name='title']"); if (t) t.focus({ preventScroll: true }); } } }, 80);
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.tw) return; const o = Object.assign({}, opts());
    if (t.dataset.tw === "random") o.random = t.checked; else if (t.dataset.tw === "table") o.table = t.value; else if (t.dataset.tw === "freq") o.freq = t.value; else if (t.dataset.tw === "ask") o.ask = t.value; else return;
    S().set("clock", "opts", o); if (t.dataset.tw === "ask") setTimeout(evaluate, 60);
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.tw) return; e.preventDefault();
    // (the table's tab is not drawn again while a field in it has the focus: Enter in a field leaves it there)
    if (document.activeElement && f.contains(document.activeElement)) document.activeElement.blur();
    const g = n => String((f.elements[n] || {}).value || "").trim();
    switch (f.dataset.tw) {
      case "own": { const h = g("h"); if (!h) return; S().set("news", "n" + Date.now().toString(36), { m: now(), when: at(now()).short, headline: h, text: g("x"), paper: g("p"), t: Date.now() }); api.note("Told to the players."); break; }
      case "custom": { const m = Math.round((+g("n") || 0) * (+g("u") || 60)); if (m > 0) { backStack.push(now()); advance(m); } break; }
      case "save": readForm(f); if (!saveForm()) { paint(); return; } break;
      case "ask": askCouncil(g("q")); return;
      case "cal": {
        const c = {}, start = g("start"), yr = +g("year");
        if (start) { if (!DATE.test(start)) { api.note("The date reads like 1888-10-31 21:00."); return; } c.start = start; } else c.start = { day: 1, hour: origin().h, year: yr || 1 };
        const months = g("months").split(",").map(x => x.trim()).filter(Boolean).map(x => { const [n, d] = x.split(":"); return [n.trim(), +d || 30]; }); if (months.length) c.months = months;
        const wd = g("weekdays").split(",").map(x => x.trim()).filter(Boolean); if (wd.length) c.weekdays = wd;
        if (g("era")) c.era = g("era");
        S().set("clock", "cal", c); setTimeout(() => setNow(now()), 60); api.note("The calendar is kept."); break;
      }
      default: return;
    }
    setTimeout(paint, 80);
  });
  function paint() { if (api.tab() === "time") api.render(); if (api.dock && api.dock() === "time") api.pop(); badge(); }

  TU.addTab({ key: "time", label: "The world's time", icon: "time", group: "play", after: "clocks", desc: "The date, what is coming, what waits for you, the world's news",
    html, status: () => { const n = pending().length; return n ? `${n} waiting for you` : at(now()).short + (opts().paused ? " · paused" : ""); },
    init(store) {
      for (const c of WATCH) store.watch(c, () => {
        loaded.add(c);
        // (the players' window shows the date as it was last written: write it when the calendar has changed since)
        if (c === "clock" && cal()) { const d = store.get("clock", "now") || {}, l = label(now()); if (d.date !== l.date || d.time !== l.time) setNow(now()); }
        evaluate(); if (!UI.edit) paint(); else badge();
      });
    } });
  if (TU.addDock) TU.addDock("time", "Time", "time", head => head("time", "The world's time", "time", "Everything") + nowHTML(true) + (pending().length ? pending().map(x => pendingCard(x, true)).join("") : `<p class="t-small">Nothing waits for you. ${coming()[0] ? `Next: ${esc(coming()[0].title)}, ${esc(at(dueAt(coming()[0])).short)}.` : ""}</p>`));

  // the copilot and the consistency check are told of the world's time and what has happened in it
  A.worldTime = { now, at, whenOf, pending, coming, evaluate, advance, decide, events: evDefs, councilPrompt, cleanSugg,
    recent: () => allDone().filter(([, s]) => s.state === "done").sort((a, b) => b[1].at - a[1].at).slice(0, 6).map(([e, s]) => `${at(s.at).short}: ${e.title}${e.what ? " (" + e.what + ")" : ""}`) };
  if (A.consistency) A.consistency.add("time-events", () => {
    const out = [], ids = new Set(evDefs().map(e => e.id));
    for (const e of evDefs()) {
      const src = { text: e.own ? `Your event: ${e.title}` : `table.js: ${e.id}${e.edited ? " (as you changed it)" : ""}` }, push = (kind, key, title, why, suggest, sev) => out.push({ area: "time", sev: sev || "error", kind, id: e.id + key, title, why, evidence: [src], refs: e.place && A.meta[e.place] ? ["place:" + e.place] : [], suggest });
      for (const [w, c] of [].concat(e.after || []).map(c => ["after", c]).concat([].concat(e.unless || []).map(c => ["unless", c]))) {
        const how = w === "after" ? "waits on" : "is called off by";
        if (c.visit && !A.meta[c.visit]) push("evplace", ">" + c.visit, `The event "${e.title}" ${how} a place that is not in the campaign`, `It names the place "${c.visit}".`, "Name the place meant.");
        if (c.known && !A.meta[c.known]) push("evplace", ">" + c.known, `The event "${e.title}" ${how} a place that is not in the campaign`, `It names the place "${c.known}".`, "Name the place meant.");
        if (c.clue && !clueOf(c.clue)) push("evclue", ">" + c.clue, `The event "${e.title}" ${how} a clue that is not in the campaign`, `It names the clue "${c.clue}".`, "Name the clue meant: place/clue id.");
        if (c.event && !ids.has(c.event)) push("evev", ">" + c.event, `The event "${e.title}" ${how} an event that does not exist`, `It names "${c.event}".`, "Name the event meant.");
        if (c.clock && !clockOf([].concat(c.clock)[0])) push("evclock", ">clock", `The event "${e.title}" ${how} a clock that does not exist`, `It names the clock "${[].concat(c.clock)[0]}".`, "Name the clock meant.");
      }
      if (e.place && !A.meta[e.place]) push("evat", "@" + e.place, `The event "${e.title}" happens at a place that is not in the campaign`, `Its place is "${e.place}".`, "Name the place meant.");
      if (e.tick && !clockOf([].concat(e.tick)[0])) push("evtick", "^tick", `The event "${e.title}" moves a clock that does not exist`, `It names the clock "${[].concat(e.tick)[0]}".`, "Name the clock meant.");
      const w = dueAt(e); if (e.when && w == null) push("evwhen", "?w", `When "${e.title}" happens cannot be read`, `Its when is "${e.when}".`, "Give a date like the calendar's start, or day 3 06:00.", "warn");
      if (w != null && w < 0) push("evbefore", "<0", `"${e.title}" is set before the story begins`, `It falls at ${at(w).short}, before the campaign's first moment.`, "Move it later, or tell it as something that has already happened.", "warn");
      // an event that waits on itself, or on one that waits on it, never comes
      const loop = (id, seen) => { if (seen.has(id)) return true; seen.add(id); const d = defOf(id); return !!d && [].concat(d.after || []).some(c => c.event && loop(c.event, new Set(seen))); };
      if ([].concat(e.after || []).some(c => c.event && loop(c.event, new Set([e.id])))) push("evloop", "~loop", `"${e.title}" waits on itself`, "Its conditions lead back to it through other events, so it can never come due.", "Break the circle: let one of them come on a day instead.");
    }
    return out;
  });
})(ATLAS);
