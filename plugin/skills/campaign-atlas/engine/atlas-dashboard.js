/* The world at a glance (the user's master plan, 26 Oct 2026, part 21: the game master's dashboard of the living world:
   the date and the clock, what waits for their word, what is coming, what has happened lately, what the factions and
   people are doing, the news, what the players can see, the council's suggestions; and how much the world may do by
   itself: by hand (everything waits for the game master), helped (the big things wait) or on its own (only the
   critical waits), with safeguards that hold whatever the choice: a change that cannot be put right by itself (a death,
   someone gone for good, a place lost, a war, a power broken) always waits; nothing reaches the players unless the
   game master tells them; whatever happened by itself can be taken back; the world is saved before time moves on a day
   or more, to go back to). It reads the other tabs (atlas-worldtime.js, atlas-factions.js, atlas-history.js,
   atlas-deeds.js, atlas-economy.js) and keeps nothing of its own but the choice, in the clock's options. A tab of At
   the table, first of those for the game. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc;
  const S = () => api.store();
  const W = () => A.worldTime;
  const placeName = id => (A.meta[id] || {}).name || id;
  const personName = id => ((A.castData || {})[id] || {}).n || id;
  const opts = () => (S() && S().get("clock", "opts")) || {};
  // how much the world does by itself: the line under which an event happens without the game master
  const MODES = [["all", "By hand", "Everything waits for your word."], ["major", "Helped", "Small things happen by themselves; the major and critical wait for you."], ["critical", "On its own", "The world runs; only the critical waits for you."]];
  const modeNow = () => { const a = opts().ask || A.config.approve || "major"; return a === "notable" ? "major" : a; };

  /* ---- the safeguards: what always waits, whatever the line */
  function guard(e) {
    const why = [];
    for (const x of (e && e.effects) || []) {
      if (x.status === "dead") why.push(`${personName(x.person)} dies`);
      else if (x.status === "gone") why.push(`${personName(x.person)} is gone for good`);
      else if (x.loses) why.push(`a place is lost: ${placeName(x.loses)}`);
      else if (x.rel && x.rel[1] === "war") why.push("a war begins");
      else if (x.party === "war") why.push("a faction goes to war with the party");
      else if (x.has && Object.values(x.has).some(v => +v <= -2)) why.push("a power is broken");
    }
    return why.length ? why.join("; ") : "";
  }
  A.worldGuard = e => !!guard(e);
  const SAFE = ["A death, someone gone for good, a place lost, a war or a power broken always waits for your word, however the world is set to run.",
    "Nothing reaches the players unless you tell them.", "Whatever happened by itself can be taken back, under The world's time.",
    "Before time moves on a day or more, the world is saved as it was, to go back to (under The world's history)."];

  /* ---- drawing it */
  const STEPS = [[60, "+1 hour"], [240, "+4 hours"], [1440, "+1 day"], [10080, "+1 week"]];
  const imp = e => { const k = { background: "Background", minor: "Notable", notable: "Notable", major: "Major", critical: "Critical" }[e.importance] || "Notable"; return `<span class="tw-imp tw-${k.toLowerCase()}">${k}</span>`; };
  function waiting() {
    const P = W() ? W().pending() : [], C = A.deeds ? A.deeds.proposed() : [];
    if (!P.length && !C.length) return `<p class="kn">Nothing waits for you.</p>`;
    return P.map(({ id, e }) => { const g = guard(e); return `<div class="tw-ev db-w"><div class="tw-h">${imp(e)}<b>${esc(e.title)}</b>${g ? `<span class="db-guard" title="It waits for you whatever the world is set to do">Held back: ${esc(g)}</span>` : ""}</div>${e.what ? `<p class="t-small">${esc(e.what)}</p>` : ""}
      <div class="t-row"><button type="button" class="t-btn prim" data-tw="done" data-id="${esc(id)}">Let it happen</button>${e.players || e.news ? `<button type="button" class="t-btn" data-tw="done" data-tell="1" data-id="${esc(id)}">And tell the players</button>` : ""}<button type="button" class="t-mini" data-tw="later" data-h="24" data-id="${esc(id)}">A day later</button><button type="button" class="t-mini" data-tw="dismiss" data-id="${esc(id)}">Not at all</button></div></div>`; }).join("")
      + (C.length ? `<div class="tw-ev"><div class="tw-h"><b>${C.length} consequence${C.length > 1 ? "s" : ""} of what the party did</b><button type="button" class="t-link" data-db="go" data-k="deeds">see them under Consequences</button></div><ul class="db-l">${C.slice(0, 5).map(x => `<li>${esc(x.c.title)} <span class="kn">after: ${esc(x.d.title)}</span></li>`).join("")}</ul></div>` : "");
  }
  function factions() {
    const L = A.lives, ids = Object.keys(A.factionsData || {}); if (!L || !ids.length) return `<p class="kn">No factions in this campaign.</p>`;
    const STW = { war: "At war with the party", hostile: "Hostile", wary: "Wary", neutral: "Neutral", friendly: "Friendly", allied: "Allied" };
    return `<ul class="db-l">${ids.map(id => { const f = L.fac(id), last = (f.log || []).slice(-1)[0], plan = f.plan || []; return `<li><b>${esc(f.n || id)}</b> <span class="kn">${esc(STW[f.party] || "Neutral")} toward the party${plan.length ? ` · plan ${f.step} of ${plan.length}${plan[f.step] ? ": next, " + esc(String(plan[f.step]).slice(0, 80)) : ""}` : ""}</span>${last ? `<br><span class="t-small">${esc(last.when || "")}: ${esc(last.what)}</span>` : ""}</li>`; }).join("")}</ul>`;
  }
  function people() {
    const st = S(), L = A.lives, moved = Object.entries(st.get("npcstate") || {}).filter(([id, s]) => s && (A.castData || {})[id] && ((s.log || []).length || s.status));
    if (!moved.length) return `<p class="kn">No one has done anything out of their usual days yet.</p>`;
    return `<ul class="db-l">${moved.slice(0, 10).map(([id, s]) => { const w = L ? L.whereNow(id) : null, last = (s.log || []).slice(-1)[0]; return `<li><b>${esc(personName(id))}</b> <span class="kn">${w && w.at ? "at " + esc(placeName(w.at)) : w && w.status ? esc(w.status) : ""}</span>${last ? `<br><span class="t-small">${esc(last.when || "")}: ${esc(last.what)}</span>` : ""}</li>`; }).join("")}</ul>`;
  }
  function html() {
    const w = W(); if (!w) return `<p class="kn">The world's time is not part of this page.</p>`;
    const d = w.at(w.now()), o = opts(), C = w.coming().slice(0, 6), H = A.history ? A.history.all().filter(h => h.m != null).slice(0, 8) : [];
    const news = Object.entries(S().get("news") || {}).sort((a, b) => b[1].t - a[1].t).slice(0, 4), cl = S().get("clock", "now") || {};
    const known = A.history ? A.history.all().filter(h => h.vis === "players").length : 0, money = A.money;
    return `<div class="t-grid">
      <section class="t-card db-top"><div class="db-now"><div><div class="tw-date">${esc(d.long)}</div><div class="tw-time">${esc(d.time)} · day ${d.day}${o.paused ? " · paused" : ""}</div></div>
        <div class="t-row tw-adv">${STEPS.map(([m, l]) => `<button type="button" class="t-mini" data-tw="adv" data-m="${m}"${o.paused ? " disabled" : ""}>${l}</button>`).join("")}<button type="button" class="t-mini" data-tw="pause">${o.paused ? "Start the world again" : "Pause the world"}</button><button type="button" class="t-link" data-db="go" data-k="time">more under The world's time</button></div></div>
        <div class="db-modes" role="radiogroup" aria-label="How much the world does by itself">${MODES.map(([k, l, t]) => `<button type="button" role="radio" class="db-mode" data-db="mode" data-v="${k}" aria-checked="${modeNow() === k}"><b>${l}</b><span>${t}</span></button>`).join("")}</div>
        <details class="db-safe"><summary>The safeguards, which hold whatever you choose</summary><ul>${SAFE.map(s => `<li>${esc(s)}</li>`).join("")}</ul></details></section>
      <div class="t-grid t-g2w"><div>
      <section class="t-card"><h3>Waiting for you</h3>${waiting()}</section>
      <section class="t-card"><div class="tw-hh"><h3>Coming</h3><button type="button" class="t-btn" data-db="council">Ask the council what comes next</button></div>${C.length ? `<ul class="db-l">${C.map(e => `<li>${imp(e)} <b>${esc(e.title)}</b> <span class="kn">${esc(w.at(w.whenOf(e.when)).short)}</span></li>`).join("")}</ul>` : `<p class="kn">Nothing set for an hour.</p>`}</section>
      <section class="t-card"><div class="tw-hh"><h3>Lately</h3><button type="button" class="t-link" data-db="go" data-k="history">the whole history</button></div>${H.length ? `<ul class="db-l">${H.map(h => `<li><span class="kn">${esc(w.at(h.m).short)}</span> <span class="hs-kind">${esc((A.history.KIND || {})[h.kind] || h.kind)}</span> ${esc(h.title)}</li>`).join("")}</ul>` : `<p class="kn">Nothing yet.</p>`}</section></div>
      <div><section class="t-card"><div class="tw-hh"><h3>The factions</h3><button type="button" class="t-link" data-db="go" data-k="factions">more</button></div>${factions()}</section>
      <section class="t-card"><h3>People out of their usual days</h3>${people()}</section>
      <section class="t-card"><h3>What the players can see</h3><p class="t-small">${cl.date ? `The date on their screen: <b>${esc(cl.date)}</b>. ` : ""}${known ? `${known} thing${known > 1 ? "s" : ""} they know of, in the history. ` : ""}${money ? `Their purse: <b>${esc(money.fmt(money.purse()))}</b>.` : ""}</p>
        ${news.length ? `<ul class="db-l">${news.map(([, n]) => `<li><b>${esc(n.headline)}</b> <span class="kn">${esc(n.when || "")}${n.paper ? " · " + esc(n.paper) : ""}</span></li>`).join("")}</ul>` : `<p class="kn">No news told to them yet.</p>`}</section></div></div></div>`;
  }

  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-db]"); if (!b) return;
    const k = b.dataset.db;
    if (k === "go") api.open(b.dataset.k);
    else if (k === "mode") { S().set("clock", "opts", Object.assign({}, opts(), { ask: b.dataset.v })); api.note(MODES.find(m => m[0] === b.dataset.v)[2]); if (W()) setTimeout(W().evaluate, 60); }
    else if (k === "council") { api.open("time"); setTimeout(() => { const f = document.querySelector(".tw-council"); if (f) { f.scrollIntoView({ block: "start" }); const i = f.querySelector("input"); if (i) i.focus({ preventScroll: true }); } }, 120); }
  });
  function paint() { if (api.tab() === "dash") api.render(); }

  TU.addTab({ key: "dash", label: "The world at a glance", icon: "dash", group: "play", after: "home", desc: "The date, what waits for you, what is coming and has happened; how much the world does by itself",
    html, status: () => { const n = (W() ? W().pending().length : 0) + (A.deeds ? A.deeds.proposed().length : 0); return n ? `${n} waiting for you` : (MODES.find(m => m[0] === modeNow()) || MODES[1])[1]; },
    init(store) { for (const c of ["clock", "events", "eventdefs", "news", "factions", "npcstate", "history", "deeds", "econ"]) store.watch(c, () => paint()); } });
})(ATLAS);
