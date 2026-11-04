/* The world's history (the user's master plan, 26 Oct 2026, part 22: one record of everything that has happened in the
   world: events, news, what the factions and people did, what the party did and what came of it, what the party found
   and where it went; each with when, why, who and what it touched, what came of it, and whether the players know;
   filters by kind, person, faction, place and what the players know; the world saved as it is at a moment, and gone
   back to). Most of it is read from where it already lives: the events and the news of the world's time
   (atlas-worldtime.js, collections "events" and "news"), what each event changed (atlas-factions.js). What the party
   found and where it went is written down as it happens (collection "history", one record for each, taken away again
   if the game master takes the find back); what the party did and what came of it is written by the consequences
   (atlas-deeds.js); the game master may write anything else. A saved moment (collection "snaps") keeps the world's
   collections as they were; going back puts them back, after saving the world as it is first, so going back can be
   undone too. What the party has found stays as it is. A tab of At the table; the dashboard reads it. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc;
  const S = () => api.store();
  const W = () => A.worldTime;
  const nowM = () => W() ? W().now() : 0;
  const at = m => W() ? W().at(m) : { short: "", long: "", day: 1 };
  const placeName = id => (A.meta[id] || {}).name || id;
  const personName = id => ((A.castData || {})[id] || {}).n || id;
  const facName = id => ((A.factionsData || {})[id] || {}).n || id;
  const pls = () => A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-"));
  const UI = { f: { kind: "", who: "", place: "", vis: "", q: "" }, write: false, open: 60, tlz: 36, tsel: null, tlAt: null };
  // the kinds of what happens, in the order the filter lists them
  const KIND = {
    event: "In the world", deed: "The party did", conseq: "Because of it", found: "Found", heard: "Heard of", reached: "Reached",
    settled: "Finished", news: "News", off: "Called off", loot: "Gained or spent", session: "At the table", note: "Written by you"
  };
  // the collections that are the world (a plugin adds its own: A.history.keep)
  const COLLS = ["clock", "events", "eventdefs", "news", "factions", "npcstate", "clocks", "history"];
  // what the party found and where it went is not the world's: going back leaves it as it is
  const OURS = /^(f|k|v|x)_/;

  /* ---- everything that has happened, from where it lives */
  function fromEvents() {
    const st = S(), out = [], defs = W() ? W().events() : [], told = new Set(), say = A.worldEffects ? A.worldEffects.say : () => "";
    for (const [id, s] of Object.entries(st.get("events") || {})) {
      if (!s || !["done", "off"].includes(s.state)) continue;
      const e = defs.find(x => x.id === id) || s.def; if (!e) continue;
      if (s.news) told.add(s.news);
      const fx = e.effects || [], who = new Set(), facs = new Set(), places = new Set([e.place].filter(Boolean));
      for (const x of fx) {
        if (x.person) who.add(x.person); if (x.faction) facs.add(x.faction); if (x.rel) facs.add(x.rel[0]);
        if (x.joins || x.leaves) facs.add(x.joins || x.leaves); for (const p of [x.at, x.gains, x.loses]) if (p) places.add(p);
      }
      const n = s.news ? st.get("news", s.news) : null;
      out.push({ id: "ev~" + id, kind: s.state === "off" ? "off" : e.deed ? "conseq" : "event", m: s.at || 0, t: s.t || 0, title: e.title, what: e.what || "",
        cause: s.state === "off" ? "Called off: " + (s.because || "") : e.why || "", whoText: e.who || "", who: [...who], factions: [...facs], places: [...places],
        outcome: s.state === "done" ? fx.map(say).filter(Boolean).concat(e.then ? [e.then] : []) : [], vis: n ? "players" : "gm",
        pub: n ? { headline: n.headline, text: n.text, paper: n.paper } : null, imp: e.importance || "notable", auto: !!s.auto, from: "time", ev: id, cons: s.cons || "" });
    }
    // news told without an event behind it (a consequence's is in its own record)
    for (const h of Object.values(st.get("history") || {})) if (h && h.news) told.add(h.news);
    for (const [id, n] of Object.entries(st.get("news") || {})) if (n && !told.has(id)) out.push({ id: "nw~" + id, kind: "news", m: n.m || 0, t: n.t || 0, title: n.headline, what: n.text || "", vis: "players", pub: { headline: n.headline, text: n.text, paper: n.paper }, who: [], factions: [], places: [], from: "time" });
    return out;
  }
  function all() {
    const st = S(); if (!st) return [];
    const own = Object.entries(st.get("history") || {}).filter(([id, h]) => id !== "since" && h && h.title).map(([id, h]) => Object.assign({ who: [], factions: [], places: [], outcome: [] }, h, { id, own: true }));
    return fromEvents().concat(own).sort((a, b) => ((b.m == null ? -1e12 : b.m) - (a.m == null ? -1e12 : a.m)) || ((b.t || 0) - (a.t || 0)));
  }
  const words = h => [h.title, h.what, h.cause, h.whoText, [].concat(h.outcome || []).join(" "), (h.who || []).map(personName).join(" "), (h.factions || []).map(facName).join(" "), (h.places || []).map(placeName).join(" ")].join(" ").toLowerCase();
  function list(f) {
    f = f || {}; const q = String(f.q || "").toLowerCase().trim();
    return all().filter(h => (!f.kind || h.kind === f.kind) && (!f.vis || h.vis === f.vis)
      && (!f.who || (f.who.startsWith("p:") ? (h.who || []).includes(f.who.slice(2)) : (h.factions || []).includes(f.who.slice(2))))
      && (!f.place || (h.places || []).includes(f.place)) && (!q || q.split(/\s+/).every(w => words(h).includes(w))));
  }
  const recent = n => all().filter(h => h.m != null).slice(0, n || 8).map(h => `${at(h.m).short}: ${h.title}${h.what ? " (" + String(h.what).slice(0, 160) + ")" : ""}`);

  // something the game master (or another tool) writes down; it happened now unless it says when
  function add(h) {
    const id = h.id || "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), rec = Object.assign({ kind: "note", m: nowM(), t: Date.now(), vis: "gm" }, h); delete rec.id;
    for (const k of Object.keys(rec)) if (rec[k] === undefined || rec[k] === "") delete rec[k];
    for (const k of ["who", "factions", "places"]) rec[k] = [].concat(rec[k] || []).filter(Boolean);
    S().set("history", id, rec); return id;
  }
  const remove = id => S().set("history", id, null);

  /* ---- what the party found and where it went, written down as it happens (each once, by a name of its own, so two
     windows write the same record; taken away when the game master takes it back) */
  const RANK = { rumoured: 1, known: 1, closed: 1, open: 2, resolved: 3 };
  let busy = false;
  function discoveries() {
    const st = S(); if (busy || !st || ["clues", "status", "history"].some(c => !loaded.has(c))) return;
    busy = true;
    try {
      const H = st.get("history") || {}, first = !H.since, m = first ? null : nowM(), want = new Map();
      if (first) st.set("history", "since", { t: Date.now(), m: nowM() });
      for (const [pl, d] of Object.entries(st.get("clues") || {})) for (const cid of (d && d.done) || []) {
        const k = A.maps[pl] ? (A.get(pl, 99).clues || {})[cid] : null;
        want.set(`f_${pl}_${cid}`, { kind: "found", title: `Found: ${k ? k.t || cid : cid}`, what: k && k.d ? String(k.d).slice(0, 300) : "", places: [pl], vis: "players" });
      }
      for (const [pl, d] of Object.entries(st.get("status") || {})) {
        const r = RANK[(d || {}).status] || 0; if (!A.meta[pl]) continue;
        if (r >= 1) want.set(`k_${pl}`, { kind: "heard", title: `Heard of ${placeName(pl)}`, places: [pl], vis: "players" });
        if (r >= 2) want.set(`v_${pl}`, { kind: "reached", title: `Reached ${placeName(pl)}`, places: [pl], vis: "players" });
        if (r >= 3) want.set(`x_${pl}`, { kind: "settled", title: `Finished at ${placeName(pl)}`, places: [pl], vis: "players" });
      }
      for (const [id, h] of want) if (!H[id]) st.set("history", id, Object.assign({ m, t: Date.now(), who: [], factions: [] }, first ? { early: true } : {}, h));
      for (const id of Object.keys(H)) if (OURS.test(id) && !want.has(id)) st.set("history", id, null);
    } finally { busy = false; }
  }

  /* ---- the world saved as it is, and gone back to */
  const snaps = () => Object.entries((S() && S().get("snaps")) || {}).filter(([, s]) => s && s.data).sort((a, b) => b[1].t - a[1].t);
  function snapshot(name, auto) {
    const st = S(), data = {};
    for (const c of COLLS) data[c] = Object.fromEntries(Object.entries(st.get(c) || {}).filter(([id]) => !(c === "history" && (OURS.test(id) || id === "since"))));
    const rec = { name: String(name || "").slice(0, 80) || at(nowM()).short, t: Date.now(), m: nowM(), when: at(nowM()).short, data, auto: !!auto };
    if (JSON.stringify(rec).length > 900000) { api.note("The world is too big to save as one moment. Remove old news or events first."); return null; }
    const id = "s" + Date.now().toString(36); st.set("snaps", id, rec);
    // (the oldest saved by itself go when there are more than eight of them)
    const autos = snaps().filter(([, s]) => s.auto); for (const [sid] of autos.slice(8)) st.set("snaps", sid, null);
    return id;
  }
  // (the world's time is held still until every collection is back and saved, so nothing comes due half way)
  async function restore(id) {
    const st = S(), s = st.get("snaps", id); if (!s || !s.data) return false;
    snapshot(`Before going back to "${s.name}"`, true);
    const hold = W() && W().hold, ws = []; if (hold) hold(true);
    try {
      for (const c of COLLS) {
        if (!s.data[c]) continue; const was = s.data[c], cur = st.get(c) || {};
        for (const k of Object.keys(cur)) if (!(k in was) && !(c === "history" && (OURS.test(k) || k === "since"))) ws.push(st.set(c, k, null));
        for (const [k, v] of Object.entries(was)) if (JSON.stringify(cur[k]) !== JSON.stringify(v)) ws.push(st.set(c, k, v));
      }
      await Promise.all(ws); await new Promise(r => setTimeout(r, 400));
    } finally { if (hold) hold(false); }
    api.note(`The world is back as it was at "${s.name}" (${s.when}). What the party has found stays as it is.`);
    return true;
  }

  /* ---- drawing it */
  const chip = (cls, t) => `<span class="hs-chip ${cls}">${esc(t)}</span>`;
  function entryHTML(h, pub) {
    if (pub) { const p = h.pub || {}; return `<li class="hs-e"><div class="tw-h"><span class="kn">${h.m == null ? "Before" : esc(at(h.m).short)}</span><b>${esc(p.headline || h.title)}</b>${p.paper ? `<span class="kn">${esc(p.paper)}</span>` : ""}</div>${p.text || (!h.pub && h.what) ? `<p class="t-small">${esc(p.text || h.what)}</p>` : ""}</li>`; }
    const out = [].concat(h.outcome || []).filter(Boolean);
    const tags = (h.who || []).map(p => chip("hs-p", personName(p))).concat((h.factions || []).map(f => chip("hs-fa", facName(f)))).join("") + (h.places || []).filter(p => A.meta[p]).map(p => api.goBtn(p)).join("");
    return `<li class="hs-e hs-k-${esc(h.kind)}${h.imp ? " hs-" + esc(h.imp) : ""}">
      <div class="tw-h"><span class="kn">${h.m == null ? "Before" : esc(at(h.m).time.replace(/,.*/, ""))}</span><span class="hs-kind">${esc(h.kl || KIND[h.kind] || h.kind)}</span><b>${esc(h.title)}</b>${h.vis === "players" ? `<span class="tw-tag hs-know">the players know</span>` : ""}${h.auto ? `<span class="tw-tag">by itself</span>` : ""}</div>
      ${h.what ? `<p class="t-small">${esc(h.what)}</p>` : ""}
      ${h.cause ? `<p class="t-small"><span class="kn">Why</span> ${esc(h.cause)}</p>` : ""}${h.whoText ? `<p class="t-small"><span class="kn">Who</span> ${esc(h.whoText)}</p>` : ""}
      ${out.length ? `<p class="t-small"><span class="kn">What came of it</span> ${out.map(esc).join("; ")}</p>` : ""}
      ${tags ? `<div class="hs-tags">${tags}</div>` : ""}
      ${h.from === "time" ? `<button type="button" class="t-link" data-hs="time">under The world's time</button>` : h.from === "deeds" ? `<button type="button" class="t-link" data-hs="deeds">under Consequences</button>` : h.from === "rec" ? `<button type="button" class="t-link" data-hs="rec" data-id="${esc(h.mem || "")}">where it was said</button>` : h.own && !OURS.test(h.id) ? `<button type="button" class="t-link" data-hs="del" data-id="${esc(h.id)}">remove</button>` : ""}</li>`;
  }
  function timeline(l, pub) {
    if (!l.length) return `<p class="kn">${all().length ? "Nothing that fits." : "Nothing yet. As time moves on and the party acts, what happens is written here."}</p>`;
    let day = null, s = "";
    for (const h of l.slice(0, UI.open)) {
      const d = h.m == null ? "Before the record began" : at(h.m).long;
      if (d !== day) { s += `${day !== null ? "</ol>" : ""}<h4 class="tw-sub">${esc(d)}</h4><ol class="hs-l">`; day = d; }
      s += entryHTML(h, pub);
    }
    return s + "</ol>" + (l.length > UI.open && !pub ? `<button type="button" class="t-mini" data-hs="more">${l.length - UI.open} more</button>` : "");
  }
  /* ---- the timeline to scroll (the user's approved idea of 3 Nov 2026, the eighth in the workspace's
     reviews/2026-11-03-ideas.md: "the world's history drawn as a line of days, with sessions, events, deeds and their
     consequences linked"): a row for each kind of thing (the sessions at the table as bands of the days each covered,
     what happened in the world, what the party did, found and reached, and what came of their deeds), a line from each
     deed to its consequences, today marked, and what is coming after it, faint. Click a mark for the whole of it. */
  const LANES = [["table", "At the table", ["session"]], ["world", "In the world", ["event", "news", "off", "note"]], ["party", "The party", ["deed", "found", "heard", "reached", "loot"]], ["came", "What came of it", ["conseq"]]];
  const laneOf = k => (LANES.find(L => L[2].includes(k)) || LANES[1])[0];
  // the story's first moment's place in its day, so days are drawn midnight to midnight
  const dayOff = () => { const o = at(0), mm = /(\d{1,2}):(\d{2})\s*$/.exec(o.short || ""); return mm ? +mm[1] * 60 + +mm[2] : (o.h || 0) * 60; };
  // each session's first moment in the world (kept when the session number moves on: see init)
  function sessionBands() {
    const st = S(), out = []; if (!st) return out; const log = st.get("log") || {}, starts = [];
    for (const [id, d] of Object.entries(log)) { const n = /^s(\d+)$/.exec(id); if (n && d && d.m0 != null) starts.push([+n[1], d.m0]); }
    if (!starts.some(s => s[0] === 1)) starts.push([1, 0]);
    starts.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    starts.forEach(([n, m], i) => out.push({ n, a: m, b: i + 1 < starts.length ? starts[i + 1][1] : nowM() }));
    return out.filter(s => s.b > s.a || s.n === +api.session());
  }
  function timelineHTML() {
    const L = all().filter(h => h.m != null), now = nowM(), off = dayOff(), dz = UI.tlz, PAD = 14, LH = 46, TOP = 26;
    const comingE = W() ? W().coming().slice(0, 12).map(e => ({ e, m: W().whenOf(e.when) })).filter(x => x.m != null && x.m > now) : [];
    const day = m => (m + off) / 1440, d0 = Math.floor(Math.min(0, ...L.map(h => day(h.m)))), d1 = Math.ceil(Math.max(day(now) + 1, ...comingE.map(x => day(x.m) + 1)));
    const X = m => PAD + (day(m) - d0) * dz, w = PAD * 2 + (d1 - d0) * dz, H = TOP + LANES.length * LH + 8, Y = k => TOP + LANES.findIndex(l => l[0] === k) * LH + LH / 2;
    let s = "";
    // the days: a tick each day where there is room, each week otherwise; a date where it fits
    const every = dz >= 22 ? 1 : dz >= 6 ? 7 : 30, lab = Math.max(every, Math.ceil(78 / dz / every) * every);
    for (let d = d0; d <= d1; d++) { if ((d - d0) % every) continue; const x = PAD + (d - d0) * dz; s += `<line class="tl-day" x1="${x}" x2="${x}" y1="${TOP - 4}" y2="${H - 6}"/>`; if (!((d - d0) % lab)) s += `<text class="tl-date" x="${x + 3}" y="${TOP - 10}">${esc(at(d * 1440 - off).short.replace(/,.*$/, ""))}</text>`; }
    LANES.forEach(([k], i) => { s += `<line class="tl-lane" x1="0" x2="${w}" y1="${TOP + (i + 1) * LH}" y2="${TOP + (i + 1) * LH}"/>`; });
    // the sessions, as bands of the days they covered
    for (const b of sessionBands()) { const x0 = X(b.a), x1 = Math.max(x0 + 6, X(b.b)); s += `<g class="tl-sess"><rect x="${x0}" y="${Y("table") - 11}" width="${x1 - x0}" height="22" rx="4"/><text x="${x0 + 5}" y="${Y("table") + 4}">Session ${b.n}</text></g>`; }
    // each mark, stacked where a day holds more than one in its row
    const pos = {}, used = {};
    for (const h of L.slice().sort((a, b) => a.m - b.m)) {
      const k = laneOf(h.kind), key = k + "|" + Math.floor(day(h.m)), n = used[key] = (used[key] || 0) + 1; if (n > 4) continue;
      const x = X(h.m), y = Y(k) + [0, -10, 10, -20, 20][n - 1] * (k === "table" ? .6 : 1); pos[h.id] = [x, y];
    }
    // the lines from a deed to what came of it
    const deedOf = h => { if (h.kind !== "conseq") return null; const m1 = /^c_(.+)_[^_]+$/.exec(h.id || ""); if (m1) return "d_" + m1[1]; const e = h.ev && W() ? W().events().find(x => x.id === h.ev) : null; return e && e.deed ? "d_" + e.deed : null; };
    for (const h of L) { const d = deedOf(h); if (d && pos[d] && pos[h.id]) { const [ax, ay] = pos[d], [bx, by] = pos[h.id], mx = (ax + bx) / 2; s += `<path class="tl-link" d="M${ax} ${ay}C${mx} ${ay} ${mx} ${by} ${bx} ${by}"/>`; } }
    for (const h of L) { const p = pos[h.id]; if (!p) continue; s += `<g class="tl-m tl-${esc(h.kind)}${UI.tsel === h.id ? " sel" : ""}${h.vis === "players" ? " pub" : ""}" data-hs="tlsel" data-id="${esc(h.id)}" tabindex="0" role="button" aria-label="${esc(at(h.m).short + ": " + h.title)}"><circle cx="${p[0]}" cy="${p[1]}" r="${h.kind === "session" ? 3.5 : 5.5}"/><title>${esc(at(h.m).short + ": " + h.title)}</title></g>`; }
    // what is coming, faint, after today
    for (const x of comingE) s += `<g class="tl-m tl-coming"><circle cx="${X(x.m)}" cy="${Y("world")}" r="5"/><title>${esc(at(x.m).short + ": " + x.e.title + " (coming)")}</title></g>`;
    s += `<line class="tl-now" x1="${X(now)}" x2="${X(now)}" y1="${TOP - 6}" y2="${H - 4}"/><text class="tl-nowt" x="${X(now) + 4}" y="${H - 6}">now</text>`;
    const sel = UI.tsel ? L.find(h => h.id === UI.tsel) : null;
    setTimeout(keepScroll, 0);
    return `<section class="t-card hs-tlc"><div class="tw-hh"><h3>The timeline</h3><span class="t-row"><button type="button" class="t-mini" data-hs="tlz" data-z="out" aria-label="Show more days">−</button><button type="button" class="t-mini" data-hs="tlz" data-z="in" aria-label="Show fewer days, larger">+</button></span></div>
      <div class="hs-tlw"><div class="hs-tll" style="padding-top:${TOP}px">${LANES.map(([, n]) => `<div style="height:${LH}px">${esc(n)}</div>`).join("")}</div>
      <div class="hs-tlx"><svg class="hs-tl-svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="The world's history as a line of days">${s}</svg></div></div>
      ${sel ? `<ol class="hs-l hs-tlsel">${entryHTML(sel)}</ol>` : `<p class="t-small kn">Click a mark for the whole of it. A line joins a deed to what came of it; faint marks after today are what is coming.</p>`}</section>`;
  }
  // after drawing: the timeline scrolled to today the first time, else kept where it was
  function keepScroll() { const x = document.querySelector(".hs-tlx"); if (!x) return; if (UI.tlAt == null) { const n = x.querySelector(".tl-now"); x.scrollLeft = n ? Math.max(0, +n.getAttribute("x1") - x.clientWidth * .7) : x.scrollWidth; } else x.scrollLeft = UI.tlAt; x.onscroll = () => { UI.tlAt = x.scrollLeft; }; }
  const sel = (name, opts, v, lbl) => `<select class="t-in tw-sel" data-hs="${name}" aria-label="${lbl}">${opts.map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  const field = (lbl, inner) => `<label class="tw-l"><span>${lbl}</span>${inner}</label>`;
  function writeHTML() {
    const opt = (l, none) => `<option value="">${none}</option>` + l.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("");
    return `<form class="t-card tw-edit hs-w" data-hs="write"><h3>Write what happened</h3>
      ${field("What happened", `<input class="t-in" name="title" maxlength="140" required placeholder="The harbour master was found drowned">`)}
      ${field("More of it", `<textarea class="t-in" name="what" rows="2" maxlength="1200"></textarea>`)}
      <div class="tw-2">${field("Why", `<input class="t-in" name="cause" maxlength="300" placeholder="He knew of the smuggling">`)}${field("What came of it", `<input class="t-in" name="outcome" maxlength="300">`)}</div>
      <div class="tw-2">${field("Who", `<select class="t-in" name="who">${opt(Object.entries(A.castData || {}).map(([k, c]) => [k, c.n || k]), "No one in particular")}</select>`)}${field("Which faction", `<select class="t-in" name="fac">${opt(Object.entries(A.factionsData || {}).map(([k, f]) => [k, f.n || k]), "None")}</select>`)}</div>
      <div class="tw-2">${field("Where", `<select class="t-in" name="place">${opt(pls().map(p => [p, placeName(p)]), "Nowhere in particular")}</select>`)}${field("When", `<input class="t-in" name="when" placeholder="now, or day 3 18:00">`)}</div>
      <label class="t-fogck"><input type="checkbox" name="pub"> The players know of it</label>
      <div class="t-row"><button class="t-btn prim">Write it down</button><button type="button" class="t-mini" data-hs="cancel">Cancel</button></div></form>`;
  }
  function html() {
    const f = UI.f, l = list(f), P = all().filter(h => h.vis === "players"), sn = snaps();
    const who = [["", "Anyone"]].concat(Object.entries(A.factionsData || {}).map(([k, x]) => ["f:" + k, x.n || k]), Object.entries(A.castData || {}).map(([k, c]) => ["p:" + k, c.n || k]));
    return `<div class="t-grid t-g2w"><div>
      <section class="t-card"><div class="tw-hh"><h3>${T.icon("history")} The world's history</h3><button type="button" class="t-btn" data-hs="new">Write what happened</button></div>
        <p class="t-small">Everything that has happened, newest first: what happened in the world, what the party did and what came of it, what they found and where they went, the news. Each says when, why, who and what it changed, and whether the players know.</p>
        <div class="t-row hs-f">${sel("kind", [["", "Everything"]].concat(Object.entries(KIND)), f.kind, "What kind")}${sel("who", who, f.who, "Who")}${sel("place", [["", "Anywhere"]].concat(pls().map(p => [p, placeName(p)])), f.place, "Where")}${sel("vis", [["", "Known or not"], ["players", "The players know"], ["gm", "Only you know"]], f.vis, "Who knows")}<input class="t-in tw-sel" data-hs="q" value="${esc(f.q)}" placeholder="Words in it" aria-label="Words in it">${Object.values(f).some(Boolean) ? `<button type="button" class="t-mini" data-hs="clear">Show all</button>` : ""}</div></section>
      ${UI.write ? writeHTML() : ""}
      ${timelineHTML()}
      <section class="t-card hs-tl">${timeline(l)}</section></div>
      <div><section class="t-card hs-pub"><h3>As the players know it</h3><p class="t-small">What the party has seen, found and been told, in the words they heard it.</p>${P.length ? timeline(P.slice(0, 14), true) : `<p class="kn">Nothing yet.</p>`}</section>
      <section class="t-card"><h3>Saved moments</h3><p class="t-small">Save the world as it is now: the date, the events, the news, the factions, where everyone is${COLLS.length > 8 ? ", the consequences and the money" : ""}. Going back puts all of it back as it was, after saving it as it is first, so going back can be undone. What the party has found stays as it is.</p>
        <form class="t-row" data-hs="snap"><input class="t-in" name="n" maxlength="80" placeholder="A name: before the raid"><button class="t-btn">Save the world now</button></form>
        ${sn.length ? `<ul class="hs-snaps">${sn.map(([id, s]) => `<li><b>${esc(s.name)}</b> <span class="kn">${esc(s.when || "")}${s.auto ? " · saved by itself" : ""}</span><span class="t-row"><button type="button" class="t-mini" data-hs="restore" data-id="${esc(id)}">Go back to it</button><button type="button" class="t-mini" data-hs="unsnap" data-id="${esc(id)}">Remove</button></span></li>`).join("")}</ul>` : `<p class="kn">None saved yet.</p>`}</section>
      ${A.word ? A.word.cardHTML() : ""}</div></div>`;
  }

  /* ---- what the game master does */
  let sure = null;
  const twice = (b, fn) => { if (sure === b) { sure = null; fn(); return; } if (sure) { sure.textContent = sure.dataset.lbl; } sure = b; b.dataset.lbl = b.textContent; b.textContent = "Really?"; setTimeout(() => { if (sure === b) { b.textContent = b.dataset.lbl; sure = null; } }, 4000); };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-hs]"); if (!b || ["INPUT", "FORM", "SELECT"].includes(b.tagName)) return;
    const k = b.dataset.hs, id = b.dataset.id;
    if (k === "new") { UI.write = true; paint(); setTimeout(() => { const i = document.querySelector('.hs-w [name="title"]'); if (i) i.focus(); }, 30); }
    else if (k === "cancel") { UI.write = false; document.activeElement && document.activeElement.blur(); paint(); }
    else if (k === "clear") { UI.f = { kind: "", who: "", place: "", vis: "", q: "" }; paint(); }
    else if (k === "more") { UI.open += 60; paint(); }
    else if (k === "tlsel") { UI.tsel = UI.tsel === id ? null : id; paint(); }
    else if (k === "tlz") { const x = document.querySelector(".hs-tlx"), f = b.dataset.z === "in" ? 1.6 : 1 / 1.6, z = Math.max(3, Math.min(160, UI.tlz * f)); if (x) UI.tlAt = (x.scrollLeft + x.clientWidth / 2) * (z / UI.tlz) - x.clientWidth / 2; UI.tlz = z; paint(); }
    else if (k === "time" || k === "deeds") api.open(k);
    // (remembered at the table: its recording, at the moment it was said: atlas-sessions.js)
    else if (k === "rec" && A.memory) A.memory.show(id);
    else if (k === "del") twice(b, () => remove(id));
    else if (k === "unsnap") twice(b, () => S().set("snaps", id, null));
    else if (k === "restore") twice(b, () => restore(id));
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.hs || !(t.dataset.hs in UI.f)) return;
    UI.f[t.dataset.hs] = t.value; UI.open = 60; t.blur(); paint();
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.hs) return; e.preventDefault();
    const g = n => String((f.elements[n] || {}).value || "").trim();
    if (f.dataset.hs === "snap") { if (snapshot(g("n"))) api.note("The world is saved as it is now."); f.reset(); document.activeElement && document.activeElement.blur(); }
    else if (f.dataset.hs === "write") {
      if (!g("title")) return; const w = g("when"), m = w && !/^now$/i.test(w) && W() ? W().whenOf(w) : null;
      add({ title: g("title").slice(0, 140), what: g("what"), cause: g("cause"), outcome: g("outcome") ? [g("outcome")] : [], who: [g("who")], factions: [g("fac")], places: [g("place")], vis: f.elements.pub.checked ? "players" : "gm", m: m != null ? m : nowM() });
      UI.write = false; document.activeElement && document.activeElement.blur(); api.note("Written into the world's history.");
    }
  });
  function paint() { if (api.tab() === "history") { api.render(); keepScroll(); } }

  const loaded = new Set();
  TU.addTab({ key: "history", label: "The world's history", icon: "history", group: "play", after: "factions", desc: "Everything that has happened, who knows of it; the world saved and gone back to",
    html, status: () => { const n = all().length; return n ? `${n} thing${n > 1 ? "s" : ""} so far` : "Nothing yet"; },
    init(store) {
      for (const c of ["history", "events", "news", "snaps", "clues", "status", "clock", "eventdefs"]) store.watch(c, () => { loaded.add(c); if (["clues", "status", "history"].includes(c)) discoveries(); if (!UI.write) paint(); });
      // (the session moved on at the table: the world's time it began at, for the timeline's bands)
      store.watch("log", L => { const n = +((L.now || {}).n); if (n && !(L["s" + n] || {}).m0 && loaded.has("clock")) store.set("log", "s" + n, Object.assign({}, L["s" + n] || {}, { m0: nowM() })); });
    } });

  A.history = { add, remove, all, list, recent, snapshot, restore, snaps, KIND, keep: c => { if (!COLLS.includes(c)) COLLS.push(c); } };
})(ATLAS);
