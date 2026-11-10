/* Finding your way about a campaign (the user's UX review of 5 Nov 2026, items 1 to 5 and 22, approved the same day;
   the workspace's reviews/2026-11-05-ux-review.md):
   1. one search for everything the campaign holds: places, people, clues and the investigation's other cards,
      factions, the world map's places, the worlds, the stars, the planes, handouts, rumours, events, sessions, the
      story's chapters and the table's own tools; grouped by kind, each opening where it lives (A.searchers: other
      files add their own kinds: { kind, find(q, gm) -> [{ t, s, go, peek, score }], mod })
   2. Back goes back: each move (a view, a place, a tool, a city, a world and its place, a star system) is a step the
      browser's Back, the mouse's back button, Alt+Left and the ‹ › beside the views undo and do again
   3. the trail at the top of every map (A.nav.worldTitle, A.nav.cityTrail), and the world chooser grouped
   4. recently visited: the last eight things opened, shown when the search box is empty; Ctrl+K goes to it
   5. one card for a person, a faction or a place, opened from any name anywhere, without leaving the screen
      (A.nav.peek("person:cast:id" | "person:npc:pl/k" | "faction:id" | "place:id"); elements with data-peek)
   22. the checklist for the first session, on Start here (A.nav.checklistHTML), ticking itself
   The players' screen has none of it (the shell stops before it is started). */
(function (A) {
  "use strict";
  if (!A || A.nav || typeof document === "undefined") return;
  const esc = A.esc, ls = (A.ux && A.ux.ls) || { get: () => null, set: () => {} };
  const NAV = A.nav = {};
  let X = null;                          // the shell's own: state, byId, P, go, setView, who, castOf, POSTED, ...
  const $ = s => document.querySelector(s);
  const S = () => A.tableUI && A.tableUI.api && A.tableUI.api.store && A.tableUI.api.store();
  const gm = () => !X || X.state.mode === "gm";
  const modOn = r => !r || !A.modules || A.modules.on(r[0], r[1]);
  const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  /* ================================================================ where the page is, as a step to go back to */
  const H = []; let at = -1, restoring = 0, lastPush = 0, useHist = true;
  NAV.snapshot = () => {
    if (!X) return null; const st = X.state, v = st.view, e = { view: v };
    if (v === "gaz") { e.sel = st.sel; e.city = X.cityId ? X.cityId() : null; }
    else if (v === "world") { e.wid = X.worldSel ? X.worldSel() : "main"; const W = X.worldApi && X.worldApi(); e.loc = W && W.selected ? W.selected() : null; }
    else if (v === "table") e.tab = A.tableUI ? A.tableUI.api.tab() : "home";
    else if (v === "galaxy") e.sys = A.galaxySelected ? A.galaxySelected() : null;
    return e;
  };
  const keyOf = e => e ? [e.view, e.sel || "", e.city || "", e.wid || "", e.loc || "", e.tab || "", e.sys || ""].join("|") : "";
  const hashOf = e => e.view === "gaz" ? "#" + (e.sel || "") : e.view === "world" ? (e.wid && e.wid !== "main" ? "#world/" + e.wid : "#world") + (e.loc ? "/" + e.loc : "") : e.view === "table" ? "#table/" + (e.tab || "home") : e.view === "galaxy" ? "#stars" + (e.sys ? "/" + e.sys : "") : "#" + e.view;
  NAV.busy = () => Date.now() - restoring < 450;
  // a move happened: a step to come back to (quick moves in the same view are one step)
  NAV.mark = () => {
    if (!X || NAV.busy() || (A.tutorial && A.tutorial.playing && A.tutorial.playing())) return;
    const e = NAV.snapshot(); if (!e) return;
    noteSeen(e);
    if (keyOf(H[at]) === keyOf(e)) return;
    const now = Date.now(), top = H[at], bare = top && top.view === e.view && ((e.view === "world" && !top.loc && e.loc && top.wid === e.wid) || (e.view === "galaxy" && !top.sys && e.sys)), merge = top && ((now - lastPush < 600 && top.view === e.view) || (bare && now - lastPush < 6000));
    lastPush = now;
    if (merge) H[at] = e; else { H.length = at + 1; H.push(e); if (H.length > 80) H.shift(); at = H.length - 1; }
    if (useHist) { try { history[merge ? "replaceState" : "pushState"]({ atlasNav: at, n: H.length }, "", hashOf(e)); } catch (err) { useHist = false; } }
    visitOf(e); paintBtns();
  };
  NAV.restore = e => {
    if (!X || !e) return; restoring = Date.now();
    try {
      if (e.view === "gaz") { X.setView("gaz"); if (e.sel && X.byId[e.sel]) X.go(e.sel); }
      else if (e.view === "world") {
        if (e.wid && X.worldSel && e.wid !== X.worldSel() && A.openWorld) A.openWorld(e.wid); else X.setView("world");
        if (e.loc && X.whenWorld) X.whenWorld(W => W.select(e.loc));
      }
      else if (e.view === "table") { if (A.tableUI) A.tableUI.api.open(e.tab || "home"); }
      else if (e.view === "galaxy") { X.setView("galaxy"); if (e.sys && A.galaxyOpen) setTimeout(() => A.galaxyOpen(e.sys), 30); else if (A.galaxyClose) A.galaxyClose(); }
      else X.setView(e.view);
    } catch (err) { console.warn("atlas: could not go back there", err); }
    restoring = Date.now(); paintBtns();
  };
  function step(d) {
    const j = at + d; if (j < 0 || j >= H.length) return;
    if (useHist) { history.go(d); return; }
    at = j; NAV.restore(H[at]);
  }
  NAV.back = () => step(-1); NAV.forward = () => step(1);
  NAV.can = () => ({ back: at > 0, forward: at < H.length - 1 });
  window.addEventListener("popstate", ev => { const n = ev.state && ev.state.atlasNav; if (n == null || !H[n]) return; at = n; NAV.restore(H[n]); });
  NAV.btnsHTML = () => `<span class="ux-navb" role="group" aria-label="Back and forward"><button type="button" id="nav-back" data-nav="back" title="Back (Alt+←)" aria-label="Back" disabled>‹</button><button type="button" id="nav-fwd" data-nav="fwd" title="Forward (Alt+→)" aria-label="Forward" disabled>›</button></span>${A.ux && A.ux.chgBtnHTML ? A.ux.chgBtnHTML() : ""}`;
  function paintBtns() {
    const c = NAV.can(), b = $("#nav-back"), f = $("#nav-fwd");
    if (b) { b.disabled = !c.back; b.title = c.back ? "Back to " + label(H[at - 1]) + " (Alt+←)" : "Back"; }
    if (f) { f.disabled = !c.forward; f.title = c.forward ? "Forward to " + label(H[at + 1]) + " (Alt+→)" : "Forward"; }
  }
  // a step in words, for the buttons' tips
  function label(e) {
    if (!e) return ""; const pl = id => (X.byId[id] || {}).name || id;
    if (e.view === "gaz") return e.sel ? pl(e.sel) : "the gazetteer";
    if (e.view === "world") { const w = (A.worlds[e.wid || "main"] || {}).data || {}, L = (w.locations || []).find(l => l && l.id === e.loc); return (L ? L.name + ", " : "") + (w.title || "the world map"); }
    if (e.view === "table") { const b = document.querySelector(`.tv-nav [data-tab="${e.tab}"] .tvn-l`); return b ? b.textContent : "At the table"; }
    if (e.view === "galaxy") { const g = A.galaxyApi && A.galaxyApi.G(), s = g && e.sys && g.byId[e.sys]; return s ? s.name : "the star chart"; }
    return { story: "the story", music: "the music" }[e.view] || e.view;
  }

  /* ================================================================ recently visited, and what has been seen */
  const SEEN = (() => { try { return JSON.parse(ls.get("seen") || "{}") || {}; } catch (e) { return {}; } })();
  NAV.seen = k => { if (!k || SEEN[k]) return; SEEN[k] = Date.now(); ls.set("seen", JSON.stringify(SEEN)); if (A.tableUI && X && X.state.view === "table" && A.tableUI.api.tab() === "home") setTimeout(() => A.tableUI.api.render(), 30); };
  NAV.wasSeen = k => !!SEEN[k];
  function noteSeen(e) { NAV.seen("v:" + e.view); if (e.view === "table") NAV.seen("tab:" + e.tab); if (e.view === "gaz" && e.city) NAV.seen("v:city"); }
  document.addEventListener("click", e => { const t = e.target.closest && e.target.closest("[data-mf-open], [data-t='openscreen'], [data-t='beplayers']"); if (!t) return; NAV.seen(t.matches("[data-mf-open]") ? "gear" : "screen"); }, true);
  const RECENT = () => { try { return JSON.parse(ls.get("recent") || "[]") || []; } catch (e) { return []; } };
  NAV.visit = v => {
    if (!v || !v.k || !v.id || !v.t) return;
    const L = RECENT().filter(x => !(x.k === v.k && x.id === v.id && (x.w || "") === (v.w || ""))); L.unshift({ k: v.k, id: v.id, t: String(v.t).slice(0, 80), s: String(v.s || "").slice(0, 80), w: v.w || "" });
    ls.set("recent", JSON.stringify(L.slice(0, 8)));
  };
  NAV.recent = () => RECENT();
  function visitOf(e) {
    if (e.view === "gaz" && e.sel && X.byId[e.sel]) { const p = X.byId[e.sel]; NAV.visit({ k: "place", id: p.id, t: p.name, s: p.dist || "A place" }); }
    if (e.view === "world" && e.loc) { const w = (A.worlds[e.wid || "main"] || {}).data || {}, L = (w.locations || []).find(l => l && l.id === e.loc); if (L) NAV.visit({ k: "loc", id: L.id, w: e.wid || "main", t: L.name, s: (w.title || "The world map") }); }
    if (e.view === "galaxy" && e.sys) { const g = A.galaxyApi && A.galaxyApi.G(), s = g && g.byId[e.sys]; if (s) NAV.visit({ k: "sys", id: s.id, t: s.name, s: "A star system" }); }
    if (e.view === "world" && e.wid && e.wid !== "main") { const w = (A.worlds[e.wid] || {}).data; if (w) NAV.visit({ k: "world", id: e.wid, t: w.title || e.wid, s: w.kind === "plane" ? "A plane's layer" : w.kind === "planet" ? "A world's surface" : "A world" }); }
  }
  // a thing found or remembered, opened where it lives
  NAV.open = v => {
    if (!v || !X) return;
    if (v.k === "place") { X.setView("gaz"); X.go(v.id); }
    else if (v.k === "loc") { if (A.openWorld && (v.w || "main") !== (X.worldSel ? X.worldSel() : "main")) A.openWorld(v.w || "main"); else X.setView("world"); if (X.whenWorld) X.whenWorld(W => W.select(v.id)); }
    else if (v.k === "world") { if (A.openWorld) A.openWorld(v.id); }
    else if (v.k === "sys") { X.setView("galaxy"); if (A.galaxyOpen) setTimeout(() => A.galaxyOpen(v.id), 30); }
    else if (v.k === "person" || v.k === "faction") NAV.peek(v.k + ":" + v.id);
    else if (v.k === "tab") { if (A.tableUI) A.tableUI.api.open(v.id); }
  };

  /* ================================================================ 1. one search for everything */
  A.searchers = A.searchers || [];
  const snip = (text, q) => { const t = String(text || "").replace(/\s+/g, " "), i = fold(t).indexOf(q); if (i < 0) return t.slice(0, 90); const a = Math.max(0, i - 36); return (a ? "…" : "") + t.slice(a, a + 96) + (a + 96 < t.length ? "…" : ""); };
  const score = (title, text, q) => { const ft = fold(title); return ft === q ? 5 : ft.startsWith(q) ? 4 : ft.split(/[\s,.'’-]+/).some(w => w.startsWith(q)) ? 3 : ft.includes(q) ? 2 : fold(text).includes(q) ? 1 : 0; };
  NAV.hit = (title, text, q, extra) => { const sc = score(title, text, q); return sc ? Object.assign({ t: title, s: sc >= 2 ? extra || "" : snip(text, q), score: sc }, {}) : null; };
  const KINDS_OF = { person: "People", place: "Places", clue: "Clues", room: "Rooms", secret: "Secrets", event: "Events", plan: "Villains' plans", quest: "Quests", item: "The investigation" };
  // what the page itself knows: places (player-safe for the players), the investigation's cards, the world maps, the
  // worlds, handouts, the story's chapters, the table's tools
  function builtIn(q) {
    const out = [], add = (kind, h, go, order) => { if (h) out.push(Object.assign(h, { kind, go, order: order || 50 })); };
    // places, as the index filters them (the players see only what they may)
    for (const p of X.P) { if (!X.matches(p, q)) continue; const h = { t: p.name, s: [p.dist, p.sub].filter(Boolean).join(" · "), score: score(p.name, "", q) || 1 }; add("Places", h, () => NAV.open({ k: "place", id: p.id }), 10); }
    if (gm() && A.story && A.story.entities) {
      let L = []; try { L = A.story.entities().list; } catch (e) { L = []; }
      for (const e of L) {
        if (!e || e.kind === "place") continue;
        const kind = e.ik === "faction" ? "Factions" : KINDS_OF[e.kind] || "The investigation", h = NAV.hit(e.name || "", [e.sub, e.text].join(" "), q, e.sub || ""); if (!h) continue;
        const ref = e.ref;
        add(kind, h, () => {
          if (e.kind === "person") NAV.peek("person:" + ref);
          else if (e.ik === "faction") NAV.peek("faction:" + String(ref).slice(8));
          else if (A.clueUI && A.tableUI) { A.tableUI.api.open("clues"); setTimeout(() => A.clueUI.open(ref), 40); }
          else if (e.place && X.byId[e.place]) NAV.open({ k: "place", id: e.place });
        }, kind === "People" ? 12 : kind === "Factions" ? 14 : 30);
      }
    } else if (!gm()) {
      // (the players: people named where they may see them, nothing more)
    }
    // the places of the world maps, on every world the campaign has
    if (modOn(["world"])) for (const w of Object.values(A.worlds || {})) {
      if (!w || !w.data) continue;
      for (const L of w.data.locations || []) {
        if (!L || !L.name || (!gm() && (L.state === "unknown" || L.gm))) continue;
        const h = NAV.hit(L.name, [L.kind, L.region, gm() ? L.desc : ""].join(" "), q, [L.kind, w.id === "main" ? "" : w.data.title].filter(Boolean).join(" · ") || "On the world map"); if (!h) continue;
        add("On the maps", h, () => NAV.open({ k: "loc", id: L.id, w: w.id }), 16);
      }
      const wh = NAV.hit(w.data.title || w.id, w.data.kind || "", q, w.data.kind === "plane" ? "A plane's layer" : w.data.kind === "planet" ? "A world's surface" : "A world map"); if (wh) add("Worlds", wh, () => { if (A.openWorld) A.openWorld(w.id); }, 18);
    }
    if (gm() && A.table && A.table.allHandouts) for (const h0 of A.table.allHandouts()) {
      const h = NAV.hit(h0.title || h0.t || h0.id, [h0.text, h0.from, h0.sub].join(" "), q, h0.place && X.byId[h0.place] ? "found at " + X.byId[h0.place].name : "A handout"); if (!h) continue;
      add("Handouts", h, () => { const b = document.createElement("button"); b.type = "button"; b.dataset.t = "hview"; b.dataset.id = h0.id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, 40);
    }
    if (gm()) (A.storyData || []).forEach((c, i) => { const h = NAV.hit(c.title, c.md.slice(0, 20000), q, c.group === "The story" ? "A chapter of the story" : c.group); if (h) add("The story", h, () => { X.setView("story"); setTimeout(() => { const s = document.getElementById("st-" + i); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }, 60); });
    // the table's own tools, by name: "rumour" finds the rumour mill
    if (gm() && A.tableUI && A.tableUI.api.tabs) for (const t of A.tableUI.api.tabs()) { const h = NAV.hit(t.label, t.desc, q, t.desc); if (h && h.score >= 2) add("Tools", h, () => NAV.open({ k: "tab", id: t.key }), 70); }
    return out;
  }
  NAV.find = q0 => {
    const q = fold(q0).trim(); if (q.length < 2 || !X) return [];
    let out = builtIn(q);
    for (const p of A.searchers) { if (p.mod && !modOn(p.mod)) continue; if (p.gm !== false && !gm()) continue; try { for (const h of p.find(q, gm()) || []) out.push(Object.assign({ kind: p.kind, order: p.order || 45 }, h)); } catch (e) { console.warn("atlas search", p.kind, e); } }
    const seen = new Set(); out = out.filter(h => { const k = h.kind + "|" + h.t + "|" + h.s; if (seen.has(k)) return false; seen.add(k); return true; });
    return out.sort((a, b) => a.order - b.order || b.score - a.score || String(a.t).localeCompare(String(b.t)));
  };
  // the list under the search box
  const SR = { open: false, more: {}, items: [] };
  function srEl() { let el = $("#uxSr"); if (!el) { const q = $("#q"); if (!q) return null; el = document.createElement("div"); el.id = "uxSr"; el.className = "ux-sr"; el.hidden = true; el.setAttribute("role", "listbox"); el.setAttribute("aria-label", "What the search found"); q.parentNode.insertBefore(el, q.nextSibling); } return el; }
  function paintSR(q) {
    const el = srEl(); if (!el) return;
    let groups = {};
    if (!q || q.length < 2) {
      const R = RECENT(); if (!R.length) { el.hidden = true; return; }
      SR.items = R.map(v => ({ t: v.t, s: v.s, go: () => NAV.open(v) }));
      el.innerHTML = `<div class="ux-srg"><div class="ux-srh">Recently visited</div>${SR.items.map((h, i) => `<button type="button" role="option" class="ux-sri" data-sri="${i}"><b>${esc(h.t)}</b>${h.s ? `<span>${esc(h.s)}</span>` : ""}</button>`).join("")}</div>`;
      el.hidden = false; SR.open = true; return;
    }
    const all = NAV.find(q); SR.items = [];
    for (const h of all) (groups[h.kind] = groups[h.kind] || []).push(h);
    const html = Object.entries(groups).map(([k, L]) => { const n = SR.more[k] ? L.length : Math.min(L.length, 5); return `<div class="ux-srg"><div class="ux-srh">${esc(k)} <span class="kn">${L.length}</span></div>${L.slice(0, n).map(h => { const i = SR.items.push(h) - 1; return `<button type="button" role="option" class="ux-sri" data-sri="${i}"><b>${esc(h.t)}</b>${h.s ? `<span>${esc(h.s)}</span>` : ""}</button>`; }).join("")}${L.length > n ? `<button type="button" class="ux-srm" data-srmore="${esc(k)}">${L.length - n} more</button>` : ""}</div>`; }).join("");
    el.innerHTML = html || `<p class="ux-sr0">Nothing in this campaign is called that, or says it.</p>`;
    el.hidden = false; SR.open = true;
  }
  const closeSR = () => { const el = $("#uxSr"); if (el) el.hidden = true; SR.open = false; SR.more = {}; };
  NAV.closeSearch = closeSR;
  function openHit(i) { const h = SR.items[i]; if (!h) return; closeSR(); const q = $("#q"); if (q) q.blur(); try { h.go(); } catch (e) { console.warn(e); } }
  let srT = null;
  document.addEventListener("input", e => { if (!e.target.matches || !e.target.matches("#q")) return; clearTimeout(srT); const v = e.target.value; srT = setTimeout(() => { SR.more = {}; paintSR(fold(v).trim()); }, 110); });
  document.addEventListener("focusin", e => { if (e.target.matches && e.target.matches("#q") && !e.target.value.trim()) paintSR(""); });
  document.addEventListener("click", e => {
    const t = e.target; if (!t.closest) return;
    const it = t.closest("[data-sri]"); if (it) { openHit(+it.dataset.sri); return; }
    const m = t.closest("[data-srmore]"); if (m) { SR.more[m.dataset.srmore] = 1; const q = $("#q"); paintSR(fold(q ? q.value : "").trim()); return; }
    if (SR.open && !t.closest("#uxSr, #q")) closeSR();
    const nb = t.closest("[data-nav]"); if (nb) { if (nb.dataset.nav === "back") NAV.back(); else if (nb.dataset.nav === "fwd") NAV.forward(); else if (nb.dataset.nav === "changes" && A.ux && A.ux.changesOpen) A.ux.changesOpen(); }
  });
  document.addEventListener("keydown", e => {
    const t = e.target;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") { const q = $("#q"); if (q) { e.preventDefault(); q.focus(); q.select(); paintSR(fold(q.value).trim()); } return; }
    if (!useHist && e.altKey && !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !(A.ux && A.ux.typing(t))) { e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1); return; }
    if (!SR.open) return;
    const inList = t.closest && t.closest("#uxSr"), btns = [...document.querySelectorAll("#uxSr .ux-sri, #uxSr .ux-srm")];
    if (e.key === "Escape") { closeSR(); if (inList) { const q = $("#q"); if (q) q.focus(); } return; }
    if (t.matches && t.matches("#q")) { if (e.key === "ArrowDown" && btns[0]) { e.preventDefault(); btns[0].focus(); } else if (e.key === "Enter" && SR.items.length) { e.preventDefault(); openHit(0); } return; }
    if (inList && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); const i = btns.indexOf(document.activeElement), j = i + (e.key === "ArrowDown" ? 1 : -1); if (j < 0) { const q = $("#q"); if (q) q.focus(); } else if (btns[j]) btns[j].focus(); }
  });

  /* ================================================================ 3. the trail at the top of the maps */
  const crumbs = (parts, here) => `<nav class="trail ux-trail" aria-label="Where this is">${parts.map(p => p.attr ? `<button type="button" ${p.attr} title="${esc(p.tip || "")}">${esc(p.t)}</button>` : `<span>${esc(p.t)}</span>`).join('<span class="tr-sep" aria-hidden="true">›</span>')}${here ? `${parts.length ? `<span class="tr-sep" aria-hidden="true">›</span>` : ""}<span aria-current="page">${esc(here)}</span>` : ""}</nav>`;
  // the world map's head: the world, and where it stands (a planet in its system among the stars; a plane's layer in
  // its dimension), and the place chosen on it
  NAV.worldTitle = (wid, selName) => {
    const w = (A.worlds[wid || "main"] || {}).data || {}, parts = [];
    if (w.kind === "planet" && w.planet) {
      const g = A.galaxyApi && A.galaxyApi.G(), s = g && g.byId[w.planet.system];
      parts.push({ t: "The stars", attr: `data-navgo="stars"`, tip: "The star chart" });
      if (s) parts.push({ t: s.name, attr: `data-navgo="sys" data-s="${esc(s.id)}"`, tip: "Its star system" });
      parts.push({ t: String(w.title || "").replace(/:.*$/, "") || "The world", attr: `data-navgo="planet" data-s="${esc(w.planet.system)}" data-n="${w.planet.n}"`, tip: "The world's card in its system" });
      parts.push({ t: w.planet.moon != null ? "the moon's surface" : "its surface" });
    } else if (w.kind === "plane" && w.plane) {
      const D = A.cosmosApi && A.cosmosApi.dimOf ? A.cosmosApi.dimOf(w.plane.dim) : null;
      parts.push({ t: "The planes", attr: `data-navgo="dims"`, tip: "Dimensions and planes" });
      if (D) parts.push({ t: D.name, attr: `data-navgo="dims" data-d="${esc(D.id)}"`, tip: "Its dimension" });
      parts.push({ t: String(w.title || "").replace(/^[^:]*:\s*/, "") || "This layer", attr: selName ? `data-world=""` : "" });
    } else parts.push({ t: w.title || "The world", attr: selName ? `data-world=""` : "", tip: "The whole world" });
    if (!selName) { const last = parts.pop(); return crumbs(parts, last.t); }
    return crumbs(parts, selName);
  };
  // above the city: the world, its place on it, and the place chosen in the city
  NAV.cityTrail = (cityName, locId, placeName) => {
    const parts = [];
    if (A.worldData && A.worldMount && modOn(["world"])) parts.push({ t: A.worldData.title || "The world", attr: `data-world=""`, tip: "The world map" });
    parts.push(locId ? { t: cityName, attr: `data-world="${esc(locId)}"`, tip: "Its place on the world map" } : { t: cityName });
    if (!placeName) { const last = parts.pop(); return crumbs(parts, last.t); }
    return crumbs(parts, placeName);
  };
  // the world chooser grouped: this world, the worlds of the stars by their systems, the planes by their dimensions
  NAV.worldOptions = cur => {
    const L = A.worldList ? A.worldList() : [], g = A.galaxyApi && A.galaxyApi.G && (() => { try { return A.galaxyApi.G(); } catch (e) { return null; } })(), groups = new Map(), first = [];
    for (const w of L) {
      const d = (A.worlds[w.id] || {}).data || {};
      if (d.kind === "planet" && d.planet) { const s = g && g.byId[d.planet.system], k = "Among the stars: " + (s ? s.name : d.planet.system); (groups.get(k) || groups.set(k, []).get(k)).push([w.id, String(w.name).replace(/^.*?:\s*/, "") || w.name]); }
      else if (d.kind === "plane" && d.plane) { const D = A.cosmosApi && A.cosmosApi.dimOf ? A.cosmosApi.dimOf(d.plane.dim) : null, k = "The planes: " + (D ? D.name : d.plane.dim); (groups.get(k) || groups.set(k, []).get(k)).push([w.id, String(w.name).replace(/^[^:]*:\s*/, "") || w.name]); }
      else first.push([w.id, w.name]);
    }
    const o = ([id, n]) => `<option value="${esc(id)}"${id === cur ? " selected" : ""}>${esc(n)}</option>`;
    return first.map(o).join("") + [...groups.entries()].map(([k, l]) => `<optgroup label="${esc(k)}">${l.map(o).join("")}</optgroup>`).join("");
  };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-navgo]"); if (!b || !X) return;
    const k = b.dataset.navgo;
    if (k === "stars") X.setView("galaxy");
    else if (k === "sys" || k === "planet") { X.setView("galaxy"); setTimeout(() => { if (A.galaxyOpen) A.galaxyOpen(b.dataset.s, k === "planet" ? +b.dataset.n : null); }, 40); }
    else if (k === "dims" && A.tableUI) { A.tableUI.api.open("dims"); if (b.dataset.d && A.cosmosShow) setTimeout(() => A.cosmosShow(b.dataset.d), 40); }
  });

  /* ================================================================ 5. one card for a person, a faction, a place */
  const PK = { cur: null };
  function peekEl() {
    let el = $("#uxPeek");
    if (!el) { el = document.createElement("aside"); el.id = "uxPeek"; el.className = "ux-peek keeper"; el.hidden = true; el.setAttribute("aria-label", "A card"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
    return el;
  }
  const row = (k, v) => v ? `<div class="pf"><dt>${esc(k)}</dt><dd>${v}</dd></div>` : "";
  const rowT = (k, v) => v ? row(k, esc(v)) : "";
  const placeBtn = id => X.byId[id] ? `<button type="button" class="t-link" data-peekgo="${esc(id)}">${esc(X.byId[id].name)}</button>` : esc(id);
  const facBtn = id => { const f = A.lives && A.lives.fac ? A.lives.fac(id) : null; return f ? `<button type="button" class="t-link" data-uxpeek="faction:${esc(id)}">${esc(f.n || id)}</button>` : esc(id); };
  const personBtn = ref => { const n = refName(ref); return n ? `<button type="button" class="t-link" data-uxpeek="person:${esc(ref)}">${esc(n)}</button>` : ""; };
  function refName(ref) { if (A.story && A.story.ent) { const e = A.story.ent(ref); if (e) return e.name; } if (String(ref).startsWith("cast:")) return ((A.castData || {})[ref.slice(5)] || {}).n || ""; return ""; }
  // a person by their reference ("cast:id" or "npc:place/key"), with all Atlas knows of them, gathered
  function personHTML(ref) {
    const [k, rest] = [String(ref).split(":")[0], String(ref).split(":").slice(1).join(":")];
    const cid = k === "cast" ? rest : null, cast = cid ? (A.castData || {})[cid] || {} : {};
    let npc = {}, npcAt = null;
    if (k === "npc") { const [pl, nk] = rest.split("/"); npcAt = pl; npc = (((A.maps[pl] && A.get(pl, 99)) || {}).npcs || {})[nk] || {}; }
    else if (cid) for (const p of X.P) { const M = p.M || {}; for (const n of Object.values(M.npcs || {})) if (n.who === cid) { npc = n; npcAt = p.id; break; } if (npcAt) break; }
    const g = f => npc[f] || cast[f] || "", name = refName(ref) || g("n") || "Someone", role = (X.who ? X.who(npc.n ? npc : { n: cast.n, who: cid })[1] : "") || cast.role || "";
    const st = S(), h = [];
    // where they are now: their day (atlas-factions.js), else where they are posted
    const w = cid && A.lives && A.lives.whereNow ? A.lives.whereNow(cid) : null;
    const now = w && w.at ? `${placeBtn(w.at)}${w.doing ? ` <span class="t-small">${esc(w.doing)}</span>` : ""}` : npcAt ? `${placeBtn(npcAt)}${npc.doing ? ` <span class="t-small">${esc(npc.doing)}</span>` : ""}` : w && w.status ? esc(w.status) : "";
    const facs = cid && A.lives && A.lives.factionsOf ? A.lives.factionsOf(cid) : [];
    // ties both ways
    const ties = []; if (cast.ties && typeof cast.ties === "object") for (const [to, why] of Object.entries(cast.ties)) { const t = (A.castData || {})[to] ? "cast:" + to : null; ties.push(`${t ? personBtn(t) : esc(to)}: ${esc(why)}`); }
    if (cid) for (const [oid, c] of Object.entries(A.castData || {})) if (oid !== cid && c.ties && typeof c.ties === "object") for (const [to, why] of Object.entries(c.ties)) if (to === cid || String(to).toLowerCase() === String(cast.n || "").toLowerCase()) ties.push(`${personBtn("cast:" + oid)} of them: ${esc(why)}`);
    // what was said to them, and what they think of the party (Talk, atlas-copilot.js)
    const talk = st ? (st.get("talks") || {}) : {}, T = Object.values(talk).find(d => d && d.who === ref) || null, turns = T ? (T.turns || []).slice(-3) : [];
    // what the table remembers of them (Recorded sessions, kept)
    const mems = st ? Object.values(st.get("memory") || {}).filter(m => m && m.state === "kept" && (m.who || []).includes(ref)).slice(-4) : [];
    // what they know, as the investigation records it
    const know = A.story && A.story.knowledgeOf ? A.story.knowledgeOf(ref).slice(0, 6) : [];
    h.push(`<div class="ux-pkh"><span class="ux-ck">A person</span><h3>${esc(name)}</h3>${role ? `<p class="kn">${esc(role)}</p>` : ""}</div><dl class="ux-pkd">`);
    h.push(row("Where they are now", now));
    h.push(rowT("Looks", g("look")), rowT("Manner", g("manner")), rowT("Sounds", g("voice")), rowT("Their story", g("bg")), rowT("Wants", g("want")));
    if (facs.length) h.push(row("Belongs to", facs.map(facBtn).join(", ")));
    if (ties.length) h.push(row("Ties", `<ul class="ties">${ties.map(t => `<li>${t}</li>`).join("")}</ul>`));
    if (T && T.opinion) h.push(rowT("Of the party", T.opinion));
    if (turns.length) h.push(row("Lately said", `<ul class="ux-said">${turns.map(t => `<li>${t.q ? `<span class="kn">${esc(t.q)}</span><br>` : ""}${esc(t.a || "")}</li>`).join("")}</ul>`));
    if (know.length) h.push(row("What they know", `<ul>${know.map(x => `<li>${esc(x.text || (A.story.name ? A.story.name(x.about) : ""))}</li>`).join("")}</ul>`));
    else if (npc.knows || npc.rev) h.push(rowT("What they know", [npc.knows, npc.rev].filter(Boolean).join(" ")));
    if (mems.length) h.push(row("Remembered", `<ul>${mems.map(m => `<li>${esc(m.text)}${m.session ? ` <span class="kn">session ${esc(m.session)}</span>` : ""}</li>`).join("")}</ul>`));
    h.push(`</dl><dl class="ux-pkd ux-sec">${rowT("Secret", g("secret"))}${rowT("The lie they tell", g("lie"))}${rowT("What makes them talk", g("press"))}${rowT("Fate", cast.fate)}</dl>`);
    const where = (w && w.at) || npcAt;
    h.push(`<div class="t-row ux-pka">${A.copilot && A.copilot.talkTo ? `<button type="button" class="t-btn prim" data-peekact="talk" data-r="${esc(ref)}">Talk to them</button>` : ""}${where && X.byId[where] ? `<button type="button" class="t-btn" data-peekgo="${esc(where)}">Show where they are</button>` : ""}${A.clueUI && A.tableUI ? `<button type="button" class="t-btn" data-peekact="inv" data-r="${esc(ref)}">In the investigation</button>` : ""}</div>`);
    return h.join("");
  }
  function factionHTML(id) {
    const f = A.lives && A.lives.fac ? A.lives.fac(id) : null; if (!f) return `<p class="kn">That faction is not in this campaign.</p>`;
    const HAS = [["wealth", "Wealth"], ["force", "Force"], ["influence", "Influence"], ["secrets", "Secrets"]];
    const pip = v => `<span class="fa-pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span>`;
    const members = [].concat(f.members || []).map(m => personBtn("cast:" + m) || esc(m));
    return `<div class="ux-pkh"><span class="ux-ck">A faction</span><h3><i class="fa-dot" style="--fa:${esc(f.color || "#888")}"></i> ${esc(f.n || id)}</h3>${f.kind ? `<p class="kn">${esc(f.kind)}</p>` : ""}</div><dl class="ux-pkd">
      ${f.leader ? row("Led by", personBtn("cast:" + f.leader) || esc(f.leader)) : ""}${members.length ? row("Members", members.join(", ")) : ""}${f.hq ? row("Seat", placeBtn(f.hq)) : ""}${(f.territory || []).length ? row("Holds", f.territory.map(placeBtn).join(", ")) : ""}
      ${f.has ? row("What they have", HAS.filter(([k]) => f.has[k] != null).map(([k, l]) => `<span class="ux-has"><span class="kn">${l}</span> ${pip(+f.has[k] || 0)}</span>`).join(" ")) : ""}
      ${rowT("Wants", f.wants)}${rowT("Doing now", f.doing)}${rowT("Toward the party", f.party && f.party !== "neutral" ? f.party : "")}</dl>
      <div class="t-row ux-pka">${A.tableUI ? `<button type="button" class="t-btn prim" data-peekact="factions">In Factions and people</button>` : ""}</div>`;
  }
  function placeHTML(id) {
    const p = X.byId[id]; if (!p) return "";
    const M = p.M || {}, people = Object.entries(M.npcs || {}).map(([k, n]) => personBtn(A.story && A.story.personRef ? A.story.personRef(id, k) : n.who ? "cast:" + n.who : "npc:" + id + "/" + k) || esc(X.who(n)[0]));
    const clues = Object.keys(M.clues || {}).length;
    return `<div class="ux-pkh"><span class="ux-ck">A place</span><h3>${esc(p.name)}</h3><p class="kn">${esc([p.dist, p.sub].filter(Boolean).join(" · "))}</p></div><dl class="ux-pkd">
      ${M.ext ? rowT("First impressions", M.ext.length > 300 ? M.ext.slice(0, 297) + "…" : M.ext) : ""}${people.length ? row("People here", people.join(", ")) : ""}${clues ? rowT("Clues", clues + " to find") : ""}</dl>
      <div class="t-row ux-pka"><button type="button" class="t-btn prim" data-peekgo="${esc(id)}">Open it</button></div>`;
  }
  NAV.peek = what => {
    if (!X || !gm()) { if (X && String(what).startsWith("place:")) NAV.open({ k: "place", id: String(what).slice(6) }); return; }
    const el = peekEl(), [k, ...r] = String(what).split(":"), id = r.join(":");
    const body = k === "person" ? personHTML(id) : k === "faction" ? factionHTML(id) : k === "place" ? placeHTML(id) : "";
    if (!body) return;
    PK.cur = what;
    el.innerHTML = `<button type="button" class="ux-pkx" data-peekclose aria-label="Close the card">×</button>${body}`;
    el.hidden = false; el.classList.add("on");
    if (k === "person") NAV.visit({ k: "person", id, t: refName(id) || id, s: "A person" });
    if (k === "faction") { const f = A.lives && A.lives.fac ? A.lives.fac(id) : null; if (f) NAV.visit({ k: "faction", id, t: f.n || id, s: "A faction" }); }
    const x = el.querySelector(".ux-pkx"); if (x) x.focus({ preventScroll: true });
  };
  NAV.closePeek = () => { const el = $("#uxPeek"); if (el) { el.hidden = true; el.classList.remove("on"); } PK.cur = null; };
  NAV.peeking = () => PK.cur;
  document.addEventListener("click", e => {
    const t = e.target; if (!t.closest) return;
    const pk = t.closest("[data-uxpeek]"); if (pk && !pk.closest(".ux-peek [data-peekgo]")) { e.preventDefault(); e.stopPropagation(); NAV.peek(pk.dataset.uxpeek); return; }
    if (t.closest("[data-peekclose]")) { NAV.closePeek(); return; }
    const pg = t.closest("[data-peekgo]"); if (pg) { NAV.closePeek(); NAV.open({ k: "place", id: pg.dataset.peekgo }); return; }
    const pa = t.closest("[data-peekact]"); if (pa) {
      const a = pa.dataset.peekact, ref = pa.dataset.r; NAV.closePeek();
      if (a === "talk" && A.copilot) A.copilot.talkTo(ref);
      else if (a === "inv" && A.clueUI && A.tableUI) { A.tableUI.api.open("clues"); setTimeout(() => A.clueUI.open(ref), 40); }
      else if (a === "factions" && A.tableUI) A.tableUI.api.open("factions");
      return;
    }
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && PK.cur && !(A.ux && A.ux.typing(e.target)) && !document.querySelector(".ux-pop")) { const el = $("#uxPeek"); if (el && !el.hidden) { NAV.closePeek(); } } });

  /* ================================================================ 22. the first session, step by step */
  NAV.checklist = () => {
    const st = S(), z = st ? (st.get("safety", "zero") || {}) : {}, sess = A.sessionsData || [], notes = st ? Object.keys(st.get("notes") || {}).length : 0;
    const hasMap = (A.worldList && A.worldList().length) || A.cityData || A.galaxyParams;
    return [
      (A.storyData || []).length ? { k: "story", t: "Read the story", d: "The whole campaign, start to finish, as the council wrote it.", done: NAV.wasSeen("v:story"), attr: `data-ckgo="story"` } : null,
      hasMap ? { k: "map", t: "Look at the map", d: "The world, the city or the stars, and where each place stands.", done: NAV.wasSeen("v:world") || NAV.wasSeen("v:city") || NAV.wasSeen("v:galaxy"), attr: `data-ckgo="map"` } : null,
      A.modules ? { k: "uses", t: "Choose what the campaign uses", d: "Switch off the parts of Atlas it does not need: they are hidden, nothing is lost.", done: NAV.wasSeen("gear"), attr: "data-mf-open" } : null,
      { k: "party", t: "Add the players' characters", d: "Who they are, and how the story touches each.", done: Object.keys(A.pcsData || {}).length > 0 || NAV.wasSeen("tab:party"), attr: `data-t="tab" data-tab="party"` },
      { k: "safety", t: "Agree lines and veils with the table", d: "What stays out of the story, and what happens only off screen.", done: [].concat(z.lines || [], z.veils || []).filter(Boolean).length > 0, attr: `data-t="tab" data-tab="safety"` },
      { k: "tonight", t: "Prepare the first session", d: "Tonight's sheet: where they start, who they meet, what can go wrong.", done: NAV.wasSeen("tab:tonight") || notes > 0 || sess.some(s => s && s.done), attr: `data-t="tab" data-tab="tonight"` },
      A.playersScreen ? { k: "screen", t: "Try the players' screen", d: "A second window for the television: they see only what you send.", done: NAV.wasSeen("screen"), attr: `data-t="openscreen"` } : null
    ].filter(Boolean);
  };
  NAV.checklistHTML = () => {
    if (ls.get("checklist-off") === "1") return "";
    const L = NAV.checklist(), n = L.filter(x => x.done).length;
    if (n === L.length && ls.get("checklist-done-seen") === "1") return "";
    if (n === L.length) ls.set("checklist-done-seen", "1");
    return `<section class="th-check" aria-label="Ready for the first session"><div class="th-ckh"><h3>Ready for the first session</h3><span class="kn">${n} of ${L.length} done</span><span class="t-sp"></span><button type="button" class="t-link" data-ckoff>Hide this list</button></div>
      <ol>${L.map(x => `<li class="${x.done ? "done" : ""}"><span class="th-ckm" aria-hidden="true">${x.done ? "✓" : ""}</span><button type="button" class="th-ckb" ${x.attr}><b>${esc(x.t)}</b><span>${esc(x.d)}</span></button></li>`).join("")}</ol></section>`;
  };
  document.addEventListener("click", e => {
    const t = e.target; if (!t.closest || !X) return;
    if (t.closest("[data-ckoff]")) { ls.set("checklist-off", "1"); if (A.tableUI) A.tableUI.api.render(); return; }
    if (t.closest("[data-ckon]")) { ls.set("checklist-off", null); ls.set("checklist-done-seen", null); if (A.tableUI) A.tableUI.api.render(); return; }
    const g = t.closest("[data-ckgo]"); if (!g) return;
    if (g.dataset.ckgo === "story") X.setView("story");
    else if (g.dataset.ckgo === "map") { if (A.worldList && A.worldList().length && $("#v-world")) X.setView("world"); else if (A.galaxyParams && $("#v-galaxy")) X.setView("galaxy"); else { X.setView("gaz"); const a = $(".atlas"); if (a) a.scrollIntoView({ behavior: "smooth", block: "start" }); NAV.seen("v:city"); } }
  });

  /* ================================================================ started by the shell, once the page is drawn */
  NAV.init = ctx => {
    X = ctx;
    // the first step: where the page opened
    const e = NAV.snapshot(); if (e) { H.push(e); at = 0; noteSeen(e); try { history.replaceState({ atlasNav: 0, n: 1 }, "", location.hash || hashOf(e)); } catch (err) { useHist = false; } visitOf(e); }
    paintBtns();
  };
  // the page's address, read back when it opens: #world/<world>/<place>, #table/<tool>, #stars/<system>, #story, #music
  NAV.parseHash = h => {
    h = String(h || "").replace(/^#/, "");
    let m;
    if ((m = /^world(?:\/([\w-]+))?(?:\/([^/]+))?$/.exec(h))) { const a = m[1], b = m[2]; if (a && A.worlds && A.worlds[a] && A.worlds[a].data) return { view: "world", wid: a, loc: b || null }; if (a) return { view: "world", wid: "main", loc: a }; return { view: "world", wid: "main" }; }
    if ((m = /^table\/([\w-]+)$/.exec(h))) return { view: "table", tab: m[1] };
    if ((m = /^stars(?:\/([\w-]+))?$/.exec(h))) return { view: "galaxy", sys: m[1] || null };
    if (h === "story" || h === "music") return { view: h };
    return null;
  };
})(typeof ATLAS !== "undefined" ? ATLAS : null);
