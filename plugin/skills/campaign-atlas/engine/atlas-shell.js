/* The page around the maps, laid out exactly as the Wormroot Idol Gazetteer is (the user asked that every campaign's page
   match it): the masthead with search, act filter and the referee/player switch; the views (Gazetteer, The story); the
   strip of key items; the investigation tracker; the 3D plan; then the index of places beside the dossier of the chosen
   place. A dossier reads: eyebrow, name, subtitle, act tags, first impressions, the maps with their room-by-room guide,
   what's really going on, people here, clues to find, scenes and hooks, connected places, why they're connected, access
   and leads, previous and next. Everything is drawn from what ATLAS.place(), ATLAS.cast() and ATLAS.configure() registered
   and from the story the build put in A.storyData. The tracker saves to the artifact's database (capabilities: db, user). */
(function () {
  "use strict";
  const A = ATLAS, cfg = A.config, esc = A.esc, app = document.getElementById("app");
  const $ = s => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(cfg.storageKey + "-" + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(cfg.storageKey + "-" + k, v); } catch (e) {} }
  };
  A.loadPrefs();
  // the page's database (claude.ai, the Atlas app), or else one kept in this browser (atlas-table.js), so the tracker and
  // the table work wherever the page is opened
  const DBP = (async () => { let db = null; try { db = window.claude && window.claude.use ? await window.claude.use("db") : null; } catch (e) { db = null; } return db || (A.localDb ? A.localDb(cfg.storageKey) : null); })();
  // the players' screen: the same page opened with #players (or made so in this window), showing only what the referee shows
  const asPlayers = (location.hash || "") === "#players" || (() => { try { return sessionStorage.getItem(cfg.storageKey + "-players") === "1"; } catch (e) { return false; } })();
  if (asPlayers && A.playersScreen) { const st = A.table.makeStore(DBP, cfg.storageKey); A.playersScreen({ store: st, found: A.table.foundIn(st), prefStore: store }); return; }
  A.pageShows = { ov: 1, ext: 1 };          // the dossier shows these itself, so the map reference does not repeat them
  const gm = cfg.gm || "GM";
  const toList = v => (Array.isArray(v) ? v : v || v === 0 ? [v] : []);
  const roman = n => { let s = ""; for (const [v, r] of [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) while (n >= v) { s += r; n -= v; } return s || "0"; };
  const pad = n => String(n).padStart(2, "0");

  /* ---- the campaign, as the page needs it */
  const ids = A.order.slice();
  const P = ids.map((id, i) => { const m = A.meta[id]; return { id, n: i + 1, name: m.name || id, dist: m.region || "", cat: m.category || "", acts: toList(m.acts).map(Number).filter(x => x > 0), sub: m.tagline || "", start: !!m.start, M: A.maps[id] ? A.get(id, 99) : null }; });
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const CATS = {}; for (const c of cfg.categories || []) CATS[c.id] = c.name; for (const p of P) if (!(p.cat in CATS)) CATS[p.cat] = p.cat === "custom" ? "Places of your own" : p.cat || "Places";
  const ACTS = [...new Set(P.flatMap(p => p.acts))].sort((a, b) => a - b);
  const actTitle = a => { const t = Array.isArray(cfg.acts) ? cfg.acts[a - 1] : (cfg.acts || {})[a]; return "Act " + roman(a) + (t ? " · " + t : ""); };
  const castOf = n => (n && n.who && A.castData && A.castData[n.who]) || null;
  // "Leon Sztajn, room orderly" is a name and a role; one of the cast has them apart already
  const who = n => { const c = castOf(n); if (c) return [n.n || c.n || "", c.role || ""]; const s = String(n.n || ""), i = s.indexOf(", "); return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : [s, ""]; };

  // The strip of key items (in the Gazetteer, the seven fingers): cfg.keys, or every K entry found on the maps
  const keyWord = cfg.keyName || ((cfg.markers || {}).K || [])[1] || "Key item";
  const BONES = (cfg.keys || P.flatMap(p => Object.entries((p.M || {}).clues || {}).filter(([k]) => k[0] === "K").map(([, c]) => ({ name: String(c.t || "").replace(/\s*\(.*\)\s*$/, ""), place: p.id }))))
    .map((b, i) => ({ k: roman(i + 1), name: b.name, place: byId[b.place] ? b.place : null, where: b.where || "" }));
  const bonesAt = id => BONES.filter(b => b.place === id);

  // What the referee ticks off at a place: its clues, and the people there who point somewhere else
  // (built again when the clues change on the page: the investigation, atlas-story.js)
  const ROWS = {}, INTO = {};
  function index() {
  for (const k of Object.keys(ROWS)) delete ROWS[k]; for (const k of Object.keys(INTO)) delete INTO[k];
  for (const p of P) {
    if (A.maps[p.id]) p.M = A.get(p.id, 99);
    const M = p.M, rows = ROWS[p.id] = []; if (!M) continue;
    for (const [k, c] of Object.entries(M.clues || {})) if (!c.arch) rows.push({ k, short: c.t || k, text: (c.t || k) + (c.rev ? ": " + c.rev : c.d ? ": " + c.d : ""), to: toList(c.to).filter(t => byId[t] && t !== p.id), hint: c.hint || "", roll: c.roll || "", handout: c.handout ? p.id + "." + k : "", rescue: c.rescue || "" });
    for (const [k, n] of Object.entries(M.npcs || {})) { const to = toList(n.to).filter(t => byId[t] && t !== p.id); if (!to.length) continue; const [nm] = who(n), pr = n.press || (castOf(n) || {}).press; rows.push({ k, short: "Talking to " + nm, text: nm + ": " + (n.rev || n.knows || "points the way on"), to, hint: pr ? "What makes them talk: " + pr : "", person: nm }); }
    for (const l of A.meta[p.id].leads || []) if (byId[l.to]) rows.push({ k: "L" + rows.length, short: l.why || "A lead", text: l.why || "A lead", to: [l.to], hint: "" });
    for (const r of rows) for (const t of r.to) (INTO[t] = INTO[t] || []).push({ from: p.id, k: r.k, short: r.short, text: r.text, person: r.person });
  }
  }
  index();
  const outOf = id => [...new Set((ROWS[id] || []).flatMap(r => r.to))];
  const linksOf = id => ids.filter(q => q !== id && (outOf(id).includes(q) || outOf(q).includes(id)));

  const state = { q: "", cat: "all", act: "all", mode: store.get("mode") === "player" ? "player" : "gm", sel: ids[0], view: "gaz" };
  const hash = () => (location.hash || "").replace(/^#/, "");
  if (byId[hash()]) state.sel = hash(); else if (byId[store.get("sel")]) state.sel = store.get("sel");

  function matches(p) {
    if (state.cat !== "all") { if (state.cat === "bones") { if (!bonesAt(p.id).length) return false; } else if (p.cat !== state.cat) return false; }
    if (state.act !== "all" && !p.acts.includes(+state.act)) return false;
    if (state.q) {
      const keeper = state.mode === "gm", M = p.M || {};
      let hay = [p.name, p.dist, M.ext || ""].join(" ");
      for (const F of M.floors || []) for (const r of F.R) if (r[5] && (keeper || !(r[7] && r[7].h) && !A.isGmFloor(F))) hay += " " + r[5];
      if (keeper) hay += " " + [p.sub, M.ov || "", ...Object.values(M.npcs || {}).map(n => who(n).join(" ")), ...Object.values(M.clues || {}).map(c => c.t || ""), ...Object.values(M.enc || {}).map(e => e.t || "")].join(" ");
      if (!hay.toLowerCase().includes(state.q.toLowerCase())) return false;
    }
    return true;
  }

  /* ---- the frame */
  const kicker = [cfg.system, cfg.setting, gm + "'s gazetteer"].filter(Boolean).join(" · ");
  app.dataset.mode = state.mode;
  app.innerHTML = `
  <header class="mast">
    <div><div class="kicker">${esc(kicker)}</div><h1>${esc(cfg.title)}${cfg.strap ? `: <em>${esc(cfg.strap)}</em>` : ""}</h1></div>
    <div class="tools">
      <input id="q" class="search" type="search" placeholder="Search places, people, clues" aria-label="Search places, people and clues">
      ${ACTS.length ? `<select id="act" class="actsel" aria-label="Filter by act"><option value="all">All acts</option>${ACTS.map(a => `<option value="${a}">${esc(actTitle(a))}</option>`).join("")}</select>` : ""}
      <div class="mode" role="group" aria-label="View mode"><button id="m-keeper" type="button" aria-pressed="${state.mode === "gm"}">${esc(gm)}</button><button id="m-player" type="button" aria-pressed="${state.mode === "player"}">Player-safe</button></div>
    </div>
  </header>
  ${A.music ? `<div class="musicbar">${A.music.html()}</div>` : ""}
  <nav class="views" aria-label="View">
    <button type="button" id="v-gaz" aria-pressed="true">Gazetteer</button>
    ${A.worldData && A.worldMount ? `<button type="button" id="v-world" aria-pressed="false">World map</button>` : ""}
    ${A.galaxyParams && A.galaxyMount ? `<button type="button" id="v-galaxy" class="keeper" aria-pressed="false">Star chart</button>` : ""}
    ${A.tableUI ? `<button type="button" id="v-table" class="keeper v-play" aria-pressed="false" title="Everything for game night: the players' screen, handouts, clocks, dice and more">${A.table.icon("play")}At the table</button>` : ""}
    ${(A.storyData || []).length ? `<button type="button" id="v-story" class="keeper" aria-pressed="false">The story</button>` : ""}
    ${A.music && A.music.enabled && A.music.enabled() ? `<button type="button" id="v-music" aria-pressed="false">Music</button>` : ""}
  </nav>
  <section class="story keeper" id="story" aria-label="The whole story"></section>
  <section class="studio" id="studio" aria-label="Make your own music"></section>
  ${A.tableUI ? `<section class="tablev keeper" id="tablev" aria-label="At the table"></section>` : ""}
  <nav class="bones keeper" id="bones" aria-label="${esc(keyWord)}" style="--bones:${Math.max(1, BONES.length)}"></nav>
  <section class="tracker keeper" id="tracker" aria-label="Investigation tracker">
    <details id="trk"><summary><span class="trh">Investigation tracker</span><span class="trs" id="trk-sum"></span></summary><div id="trk-body"></div></details>
  </section>
  <dialog id="keyDlg" class="kedlg" aria-label="Key editor"></dialog>
  ${A.worldData && A.worldMount ? `<section class="worldv" id="worldv" aria-label="World map"></section>` : ""}
  ${A.galaxyParams && A.galaxyMount ? `<section class="galaxyv keeper" id="galaxyv" aria-label="The galaxy"></section>` : ""}
  ${A.cityData && A.cityMount ? `<section class="atlas" aria-label="Plan of the whole"><div class="citybar" id="citybar" hidden></div><div class="cmap" id="citybox"></div></section>` : ""}
  <div class="layout">
    <aside class="index"><div class="chips" id="cats" role="group" aria-label="Filter by type of place"></div><div class="list" id="list"></div></aside>
    <main class="dossier" id="dossier" aria-live="polite"></main>
  </div>`;

  /* ---- the strip, the filters, the index */
  function renderBones() {
    $("#bones").innerHTML = BONES.map(b => `<button type="button" class="${b.place && b.place === state.sel ? "on" : ""}"${b.place ? ` data-go="${esc(b.place)}"` : ""}><span class="rn">${b.k}</span><span class="bn">${esc(b.name)}</span><span class="bs">${esc(b.where || (b.place ? byId[b.place].name : ""))}</span></button>`).join("");
  }
  function renderCats() {
    const opts = [["all", "All places"], ...Object.entries(CATS), ...(BONES.length ? [["bones", cfg.keySites || keyWord + " sites"]] : [])];
    $("#cats").innerHTML = opts.filter(([k]) => !(k === "bones" && state.mode === "player")).map(([k, v]) => `<button type="button" class="chip" data-cat="${esc(k)}" aria-pressed="${state.cat === k}">${esc(v)}</button>`).join("");
  }
  function renderList() {
    const shown = P.filter(matches);
    if (!shown.length) { $("#list").innerHTML = `<p class="empty">No places match. Clear the search or pick another filter.</p>`; return; }
    let out = "";
    for (const [k, label] of Object.entries(CATS)) {
      const items = shown.filter(p => p.cat === k); if (!items.length) continue;
      out += `<h3>${esc(label)}</h3><ol>` + items.map(p => { const b = bonesAt(p.id).map(x => x.k).join(" "); return `<li class="${p.M ? "" : "todo"}"><button type="button" data-go="${esc(p.id)}" aria-current="${p.id === state.sel}"><span class="no">${pad(p.n)}</span><span><span class="nm">${esc(p.name)}</span><span class="ds">${esc(p.dist)}</span></span>${b && state.mode === "gm" ? `<span class="bt" title="${esc(keyWord)} ${b}">${b}</span>` : "<span></span>"}</button></li>`; }).join("") + `</ol>`;
    }
    $("#list").innerHTML = out;
  }

  /* ---- the plan of the whole */
  let CITY = null;
  const renderMap = () => { if (CITY) CITY.sync({ sel: state.sel, mode: state.mode, matches: p => !!byId[p.id] && matches(byId[p.id]) }); };
  // A campaign may have several cities (city.js and cities/<id>.js), one on the plan at a time: a place opens its own
  // city's map, and the world map's "Enter" opens the city it names. The old map is taken down first.
  const CITIES = A.cities || {}, mainCity = (A.cityData && A.cityData.id) || "main";
  const cityOf = id => (A.placeCity ? A.placeCity(id) : mainCity);
  // a city is called by its place on the world map, else by its sheet's title
  const cityLabel = id => { const L = A.worldData && (A.worldData.locations || []).find(l => l && (l.city === id || (!l.city && l.id === id))); return (L && L.name) || (CITIES[id] && CITIES[id].title) || id; };
  let cityId = null;
  function mountCity(id, then) {
    if (!A.cityMount || !$("#citybox")) return;
    if (!CITIES[id]) id = mainCity;
    if (CITY && cityId === id) { if (then && CITY.map) then(CITY); else if (then) CITY.then = then; return; }
    if (CITY) CITY.dispose();
    cityId = id; store.set("city", id);
    CITY = A.cityMount($("#citybox"), { city: id, onPick: pid => go(pid, true), addLocation: A.locations ? c => A.locations.create(c) : null, onReady: c => { if (A.locations) A.locations.setCity(c); renderMap(); paintStatusDots(); const f = c.then || then; c.then = null; if (f) f(c); else if (byId[state.sel] && cityOf(state.sel) === id) c.flyTo(state.sel); } });
    renderCityBar();
  }
  if (A.locations) A.locations.__shell = { mountCity };
  // above the 3D map: back to the world, and the campaign's other cities
  function renderCityBar() {
    const bar = $("#citybar"); if (!bar) return;
    const ids = Object.keys(CITIES), loc = WORLD && WORLD.locationOf(cityId);
    if (!A.worldData && ids.length < 2) { bar.hidden = true; return; }
    bar.hidden = false;
    const nm = cityLabel;
    bar.innerHTML = `${A.worldData && A.worldMount ? `<button type="button" class="cb-back" data-world="${esc(loc || "")}">← World map</button>` : ""}<span class="cb-here"><span class="kl">Now on the map</span>${esc(nm(cityId))}</span>${ids.length > 1 ? `<label class="cb-pick"><span class="kl">Another city</span><select id="cityPick" aria-label="Show another city on the map">${ids.map(id => `<option value="${esc(id)}"${id === cityId ? " selected" : ""}>${esc(nm(id))}</option>`).join("")}</select></label>` : ""}`;
  }

  /* ---- places the game master makes in a city (atlas-locations.js): taken into the index as they come, renamed,
          moved or taken away, and the city drawn again with its buildings (the city itself is the same: atlas-city.js) */
  function syncPlaces() {
    for (let i = P.length - 1; i >= 0; i--) if (!A.meta[P[i].id]) { delete byId[P[i].id]; P.splice(i, 1); }
    for (let i = ids.length - 1; i >= 0; i--) if (!A.meta[ids[i]]) ids.splice(i, 1);
    for (const id of A.order) {
      const m = A.meta[id]; if (!m) continue;
      let p = byId[id]; if (!p) { p = byId[id] = { id }; P.push(p); ids.push(id); }
      Object.assign(p, { name: m.name || id, dist: m.region || "", cat: m.category || "", acts: toList(m.acts).map(Number).filter(x => x > 0), sub: m.tagline || "", start: !!m.start, M: A.maps[id] ? A.get(id, 99) : null });
    }
    const pos = id => A.order.indexOf(id); P.sort((a, b) => pos(a.id) - pos(b.id)); ids.sort((a, b) => pos(a) - pos(b)); P.forEach((p, i) => { p.n = i + 1; });
    for (const p of P) if (!(p.cat in CATS)) CATS[p.cat] = p.cat === "custom" ? "Places of your own" : p.cat || "Places";
    if (!byId[state.sel]) state.sel = ids[0];
  }
  document.addEventListener("atlas-places", ev => {
    syncPlaces(); index(); renderAll(false);
    const want = ev.detail && ev.detail.go;
    if (CITY && cityId) { const c = cityId; CITY.dispose(); CITY = null; cityId = null; mountCity(c, cc => { const s = byId[want] ? want : state.sel; if (byId[s] && cityOf(s) === c) cc.flyTo(s); }); }
    if (byId[want]) go(want);
  });

  /* ---- the world map (atlas-world.js): the level above the cities. It is drawn the first time it is shown and kept,
          so it is where it was left (its view, its choice) when the referee comes back from a city. */
  let WORLD = null;
  // the campaign's places in a world location: those that say location: "<its id>", or stand in the city it names
  const inLoc = (pid, L) => { const m = A.meta[pid] || {}, c = L.city || (CITIES[L.id] ? L.id : null); if (m.location) return m.location === L.id; return !!c && cityOf(pid) === c; };
  const WORLD_CTX = {
    mode: () => state.mode,
    placesAt: L => P.filter(p => inLoc(p.id, L)).map(p => ({ id: p.id, n: p.n, name: p.name, st: TR.ready ? stOf(p.id) : "", acts: p.acts })),
    peopleAt: (L, places) => {
      const out = [], had = new Set();
      for (const q of places) for (const n of Object.values((byId[q.id].M || {}).npcs || {})) { const [nm, role] = who(n); if (nm && !had.has(nm)) { had.add(nm); out.push({ name: nm, role, pid: q.id }); } }
      for (const cid of L.people || []) { const c = (A.castData || {})[cid]; if (c && !had.has(c.n)) { had.add(c.n); out.push({ name: c.n, role: c.role || "", pid: POSTED[cid] || null }); } }
      return out;
    },
    leadsInto: (L, places) => { const here = new Set(places.map(p => p.id)), out = []; for (const id of here) for (const w of INTO[id] || []) if (!here.has(w.from)) out.push({ fromId: w.from, from: byId[w.from].name, text: shortClue(w.text) }); return out; },
    hasCity: id => !!(CITIES[id] && A.cityMount),
    cityName: id => cityLabel(id),
    enter: (cid, locId) => enterCity(cid),
    open: pid => { setView("gaz"); go(pid); },
    db: DBP, store,
    // in the Atlas app the page can make a city itself (window.ATLAS_APP, set by the app); on claude.ai it cannot
    makeCity: window.ATLAS_APP && window.ATLAS_APP.makeCity ? (L, W) => window.ATLAS_APP.makeCity({ id: L.city || L.id, loc: L.id, name: L.name, kind: L.kind, look: W.look }) : null
  };
  function enterCity(cid) {
    setView("gaz");
    // the dossier follows: if the chosen place is in another city, choose this city's first place
    if (!(byId[state.sel] && cityOf(state.sel) === cid)) { const first = P.find(p => cityOf(p.id) === cid); if (first) { state.sel = first.id; store.set("sel", first.id); renderAll(false); } }
    mountCity(cid);
    const at = document.querySelector(".atlas"); if (at) at.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function showWorld(locId) {
    setView("world");
    if (WORLD && locId) WORLD.select(locId);
  }

  /* ---- the dossier */
  // "Open all" / "Close all" for a list of folding entries (clues, people, rooms, scenes, connections)
  const FOLDALL = `<button type="button" class="fold-all" data-foldall="1">Open all</button>`;
  // referee only: why each connected place is connected, and through whom
  function connWhy(p) {
    const items = linksOf(p.id).map(id => {
      const q = byId[id], out = (ROWS[p.id] || []).filter(r => r.to.includes(id)), inn = (ROWS[id] || []).filter(r => r.to.includes(p.id));
      const people = [...new Set([...out, ...inn].map(r => r.person).filter(Boolean))];
      const why = [...out.map(r => `<p><span class="kl">From here</span>${esc(r.text)}</p>`), ...inn.map(r => `<p><span class="kl">From there</span>${esc(r.text)}</p>`)].join("");
      return `<details class="ci"><summary class="cn"><span class="n">${pad(q.n)}</span>${esc(q.name)}</summary>${why}${people.length ? `<p class="cw"><span>People</span>${people.map(esc).join(" · ")}</p>` : ""}<p><button type="button" class="slink" data-go="${esc(id)}">Open ${esc(q.name)} →</button></p></details>`;
    }).join("");
    return items ? `<section class="sec keeper"><h3>Why they're connected${FOLDALL}</h3><div class="connbox">${items}</div></section>` : "";
  }
  function renderDossier(flash) {
    if (!byId[state.sel]) { $("#dossier").innerHTML = `<p class="empty">No places yet. Each place the campaign registers appears here.</p>`; return; }
    const p = byId[state.sel], M = p.M || {}, i = P.indexOf(p), prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    const acts = p.acts.map(a => `<span class="tag">Act ${roman(a)}</span>`).join("");
    const bone = bonesAt(p.id).map(b => `<span class="tag bone keeper">${esc(keyWord)} ${b.k} · ${esc(b.name)}</span>`).join("");
    // where it stands on the world map, as a way there
    const wl = A.worldData && A.worldMount ? (A.worldData.locations || []).find(L => L && L.id && inLoc(p.id, L)) : null;
    const wtag = wl && (state.mode === "gm" || wl.state !== "unknown") ? `<button type="button" class="tag wtag" data-world="${esc(wl.id)}" title="Show it on the world map">⌖ ${esc(wl.name)}</button>` : "";
    const links = linksOf(p.id).map(id => `<button type="button" data-go="${esc(id)}"><span class="n">${pad(byId[id].n)}</span>${esc(byId[id].name)}</button>`).join("");
    const hooks = Object.values(M.enc || {}).map(e => `<li><details class="hk"><summary>${esc(e.t || "")}${e.roll && A.tableUI ? " " + A.tableUI.roll(e.roll) : ""}</summary><p>${esc(e.d || "")}</p>${e.stats && A.tableUI ? A.tableUI.stats(e.stats, e.count ? e.count + " of them" : "") : ""}</details></li>`);
    // the head of the dossier, with the place's suggested song at its top right (the user asked for it there)
    $("#dossier").innerHTML = `
      <div class="dhead"><div class="dtop"><div class="dtitle">
      <div class="eyebrow"><span>No. ${pad(p.n)}</span><span>${esc(CATS[p.cat] || "")}</span><span>${esc(p.dist)}</span></div>
      <h2>${esc(p.name)}</h2>
      ${p.sub ? `<p class="subt keeper">${esc(p.sub)}</p>` : ""}
      <div class="meta">${acts}${bone}${wtag}</div>
      ${A.tableUI ? A.tableUI.dossierBar(p) : ""}
      </div>${A.music && A.music.card ? A.music.card(p.id) : ""}</div></div>
      <div id="accSlot">${accTop(p.id)}</div>
      ${A.locations && A.customs && A.customs[p.id] ? A.locations.panel(p) : ""}
      ${M.ext ? `<section class="sec readaloud"><h3>First impressions · read aloud${A.narrateBtn ? `<span class="nar-h">${A.narrateBtn(M.ext, "first impressions")}${A.narrateSet()}</span>` : ""}</h3><p class="lead">${esc(M.ext)}</p></section>` : ""}
      ${p.M ? A.section(p.id) : `<section class="sec"><h3>Maps of the location</h3><p class="empty">This place has not been mapped yet.</p></section>`}
      ${M.ov ? `<section class="sec secret keeper"><h3>What's really going on</h3><p>${esc(M.ov)}</p></section>` : ""}
      <section class="sec keeper" id="peopleSlot"><h3>People here${FOLDALL}</h3>${peopleList(p)}</section>
      <div class="keeper" id="clueSlot">${clueSection(p)}</div>
      ${A.tableUI ? A.tableUI.dossierExtra(p) : ""}
      ${hooks.length ? `<section class="sec keeper"><h3>Scenes and hooks${FOLDALL}</h3><ul class="hks">${hooks.join("")}</ul></section>` : ""}
      <section class="sec"><h3>Connected places</h3><div class="links">${links || `<span class="kn">None.</span>`}</div></section>
      ${connWhy(p)}
      <div id="leadsSlot">${leadsPanel(p.id)}</div>
      <nav class="pager" aria-label="Previous and next place">
        <button type="button" data-go="${esc(prev.id)}">← ${pad(prev.n)} ${esc(prev.name)}</button>
        <button type="button" data-go="${esc(next.id)}">${pad(next.n)} ${esc(next.name)} →</button>
      </nav>`;
    const d = $("#dossier");
    if (flash) { d.classList.remove("flash"); void d.offsetWidth; d.classList.add("flash"); }
  }
  function renderAll(flash) {
    app.dataset.mode = state.mode;
    $("#m-keeper").setAttribute("aria-pressed", state.mode === "gm");
    $("#m-player").setAttribute("aria-pressed", state.mode === "player");
    renderBones(); renderCats(); renderList(); renderMap(); renderDossier(flash); paintStatusDots();
  }
  function go(id, fromMap) {
    if (!byId[id]) return;
    state.sel = id; store.set("sel", id);
    // a place in another of the campaign's cities brings that city onto the map
    const pc = cityOf(id);
    if (pc && CITIES[pc] && pc !== cityId) mountCity(pc, c => c.flyTo(id)); else if (CITY) CITY.flyTo(id);
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
    renderAll(true);
    if (A.music) A.music.place(id);            // each place has its own theme: it changes with the place while music is on
    const d = $("#dossier");                   // chosen on the plan: stay with the plan. Otherwise bring the dossier's head into view if it has scrolled away
    if (!fromMap && d && (d.getBoundingClientRect().top < 0 || window.matchMedia("(max-width: 860px)").matches)) d.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---- the story: the council's bible, told in reading order in one column, as the Gazetteer's story view is */
  const story = A.storyData || [];
  const inl = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // just enough Markdown for a story bible: headings, paragraphs, lists, tables, quotations, rules
  function md(src) {
    const L = src.split("\n"), out = [], LI = /^\s*([-*]|\d+\.)\s+/, cells = l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    let i = 0, m;
    while (i < L.length) {
      const l = L[i];
      if (!l.trim()) { i++; continue; }
      if ((m = /^(#{1,5})\s+(.*)$/.exec(l))) { const n = Math.min(m[1].length + 2, 6); out.push(`<h${n}>${inl(m[2])}</h${n}>`); i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
      if (/^\s*\|/.test(l) && i + 1 < L.length && /^\s*\|?\s*:?-{2,}/.test(L[i + 1])) {
        const head = cells(l), rows = []; i += 2;
        while (i < L.length && /^\s*\|/.test(L[i])) rows.push(cells(L[i++]));
        out.push(`<div class="st-table"><table><thead><tr>${head.map(c => `<th>${inl(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      if (/^\s*>/.test(l)) { const q = []; while (i < L.length && /^\s*>/.test(L[i])) q.push(L[i++].replace(/^\s*>\s?/, "")); out.push(`<blockquote>${md(q.join("\n"))}</blockquote>`); continue; }
      if ((m = LI.exec(l))) {
        const tag = /\d/.test(m[1]) ? "ol" : "ul", items = [];
        while (i < L.length && LI.test(L[i])) { let t = L[i++].replace(LI, ""); while (i < L.length && /^\s{2,}\S/.test(L[i]) && !LI.test(L[i])) t += " " + L[i++].trim(); items.push(t); }
        out.push(`<${tag}>${items.map(t => `<li>${inl(t)}</li>`).join("")}</${tag}>`); continue;
      }
      const p = []; while (i < L.length && L[i].trim() && !/^(#{1,5}\s|\s*>|\s*\|)/.test(L[i]) && !LI.test(L[i])) p.push(L[i++].trim());
      if (!p.length) p.push(L[i++].trim());
      out.push(`<p>${inl(p.join(" "))}</p>`);
    }
    return out.join("\n");
  }
  function renderStory() {
    const el = $("#story"); if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    const short = t => t.replace(/^\d+\.\s*/, "").split(/[,:]/)[0];
    el.innerHTML = `<div class="st-wrap">
      <div class="st-kicker">${esc(gm)} only · Spoilers for the whole campaign</div>
      <h2 class="st-h">The story, start to finish</h2>
      <p class="st-lead">This is the whole of ${esc(cfg.title)}, as the story council wrote it, so that someone who has never seen the campaign can read it once and then run it. The chapters follow in reading order${story.some(c => c.group !== "The story") ? "; the council's own debate, and the story as it was first given, come last" : ""}.</p>
      <nav class="st-toc" aria-label="Chapters">${story.map((c, i) => `<button type="button" data-sjump="${i}">${esc(short(c.title))}</button>`).join("")}</nav>
      ${story.map((c, i) => `<section class="st-act" id="st-${i}"><h3>${esc(c.title)}</h3>${md(c.md.replace(/^\s*#\s+.*\n/, ""))}</section>`).join("")}
    </div>`;
  }
  function setView(v) {
    if (v === "story" && (!story.length || state.mode !== "gm")) v = "gaz";
    if (v === "music" && !$("#v-music")) v = "gaz";
    if (v === "world" && !$("#v-world")) v = "gaz";
    if (v === "galaxy" && (!$("#v-galaxy") || state.mode !== "gm")) v = "gaz";
    if (v === "table" && (!$("#v-table") || state.mode !== "gm")) v = "gaz";
    state.view = v; app.dataset.view = v;
    $("#v-gaz").setAttribute("aria-pressed", v === "gaz");
    if ($("#v-world")) $("#v-world").setAttribute("aria-pressed", v === "world");
    if (v === "world") { if (!WORLD) WORLD = A.worldMount($("#worldv"), WORLD_CTX); else WORLD.wake(); WORLD.search(state.q); renderCityBar(); }
    if ($("#v-galaxy")) $("#v-galaxy").setAttribute("aria-pressed", v === "galaxy");
    if (v === "galaxy") A.galaxyMount($("#galaxyv"));
    if ($("#v-story")) $("#v-story").setAttribute("aria-pressed", v === "story");
    if ($("#v-table")) $("#v-table").setAttribute("aria-pressed", v === "table");
    if (v === "table") A.tableUI.view();
    if ($("#v-music")) $("#v-music").setAttribute("aria-pressed", v === "music");
    if (v === "story") renderStory();
    if (v === "music") A.music.studio($("#studio"));   // the Music tab: music of the referee's own (the user asked for it, 14 Oct 2026)
    store.set("view", v);
    if (v === "gaz" && CITY && CITY.map && CITY.map.request) CITY.map.request();
  }

  /* ================================================================
     THE INVESTIGATION TRACKER (referee only), as the Gazetteer has it. It tracks KEYS, not locations: each key is one
     record saying where it is found and which places it opens, so adding a key updates every place it touches. Kept in
     the artifact's database: keys/<id>, status/<placeId>, places/<id> (places the referee adds), clues/<placeId> (the
     clues ticked there), chars/<id> (notes on a person), tracker/party.
     ================================================================ */
  const KINDS = { knowledge: "Knowledge", introduction: "Introduction", leverage: "Leverage", favour: "Favour or trust", cover: "Cover or reason", item: "Object" };
  const STATUSES = [["unknown", "Unknown"], ["rumoured", "Rumoured"], ["known", "Known"], ["open", "Open"], ["resolved", "Resolved"], ["closed", "Closed"]];
  const TR = { db: null, canWrite: false, ready: false, keys: [], status: {}, places: {}, party: [], clues: {}, chars: {}, q: "", show: "all", edit: null };
  const placeName = id => (byId[id] ? byId[id].name : TR.places[id] ? TR.places[id].name : id);
  const allPlaces = () => [...P.map(p => ({ id: p.id, name: p.name, dist: p.dist })), ...Object.entries(TR.places).map(([id, v]) => ({ id, name: v.name, dist: v.dist || "Added place" }))];
  const stOf = id => (TR.status[id] && TR.status[id].status) || "unknown";
  const isFound = k => !!(k.found || (k.heldBy && k.heldBy.length));
  const keysOpening = id => TR.keys.filter(k => (k.opens || []).includes(id));
  const keysFoundAt = id => TR.keys.filter(k => (k.foundAt || []).includes(id));
  async function trWrite(fn) {
    if (!TR.db || !TR.canWrite) return;
    try { await fn(TR.db); } catch (e) {
      if (e && e.code === "invalid_argument") { TR.canWrite = false; renderTrackerAll(); }
      else if (e && e.code === "quota_exceeded") { const s = $("#trk-sum"); if (s) s.textContent = "The tracker's storage is full: delete some keys or places you no longer need."; }
      else console.warn("tracker write failed", e);
    }
  }
  // The viewer shows no confirm() box, so a delete asks twice: the button says "Really?" and a second click does it.
  let sure = null;
  function twice(btn, fn) {
    if (sure === btn) { sure = null; fn(); return; }
    if (sure) { sure.textContent = sure.dataset.lbl; sure.classList.remove("sure"); }
    sure = btn; btn.dataset.lbl = btn.textContent; btn.textContent = "Really?"; btn.classList.add("sure");
    setTimeout(() => { if (sure === btn) { btn.textContent = btn.dataset.lbl; btn.classList.remove("sure"); sure = null; } }, 4000);
  }
  function placeChips(list, removable) {
    return (list || []).filter(Boolean).map(id => `<span class="pc">${byId[id] ? `<button type="button" class="pcg" data-go="${esc(id)}">${esc(placeName(id))}</button>` : `<span class="pcg">${esc(placeName(id))}</span>`}${removable ? `<button type="button" class="pcx" data-rm="${esc(id)}" aria-label="Remove ${esc(placeName(id))}">×</button>` : ""}</span>`).join("");
  }
  const stDot = id => { const s = stOf(id); return `<span class="sd st-${s}" title="${esc(STATUSES.find(x => x[0] === s)[1])}"></span>`; };
  function keyRow(k) {
    const f = isFound(k), ro = TR.canWrite ? "" : " disabled";
    const held = TR.party.length ? `<div class="kh"><span class="kl">Held by</span>${TR.party.map(m => `<button type="button" class="hb${(k.heldBy || []).includes(m.id) ? " on" : ""}" data-hold="${esc(k.id)}" data-mem="${esc(m.id)}" aria-pressed="${(k.heldBy || []).includes(m.id)}"${ro}>${esc(m.name)}</button>`).join("")}</div>` : "";
    return `<div class="key${f ? " found" : ""}">
      <label class="kf"><input type="checkbox" data-found="${esc(k.id)}"${f ? " checked" : ""}${ro}><span class="kt">${esc(k.title || "Untitled key")}</span></label>
      <span class="kk">${esc(KINDS[k.kind] || "Knowledge")}</span>
      ${k.detail ? `<p class="kd">${esc(k.detail)}</p>` : ""}
      <div class="kg"><span class="kl">Found at</span>${placeChips(k.foundAt) || `<span class="kn">anywhere</span>`}${k.from ? `<span class="kfrom">from ${esc(k.from)}</span>` : ""}</div>
      <div class="kg"><span class="kl">Opens</span>${placeChips(k.opens) || `<span class="kn">nothing yet</span>`}${k.effect ? `<span class="kfx">${esc(k.effect)}</span>` : ""}</div>
      ${held}
      ${TR.canWrite ? `<div class="ka"><button type="button" data-kedit="${esc(k.id)}">Edit</button><button type="button" data-kdel="${esc(k.id)}">Delete</button></div>` : ""}
    </div>`;
  }
  function renderTracker() {
    const body = $("#trk-body"), sum = $("#trk-sum"); if (!body) return;
    if (!TR.ready) { body.innerHTML = `<p class="trnote">${TR.db === false ? "The tracker saves to this page's database, which isn't available here. Open the page on claude.ai while signed in to use it." : "Loading the tracker…"}</p>`; sum.textContent = ""; return; }
    const found = TR.keys.filter(isFound), ticked = Object.values(TR.clues).reduce((n, a) => n + a.length, 0), total = Object.values(ROWS).reduce((n, a) => n + a.length, 0);
    sum.textContent = `${ticked} of ${total} clues found · ${found.length} of ${TR.keys.length} keys · ${TR.party.length} ${TR.party.length === 1 ? "character" : "characters"}`;
    const places = allPlaces();
    const ready = places.filter(p => ["unknown", "rumoured", "known"].includes(stOf(p.id)) && accessInfo(p.id).via.length > 0);
    const fragile = places.filter(p => !["resolved", "closed"].includes(stOf(p.id)) && accessInfo(p.id).ways.length === 1 && !accessInfo(p.id).free);
    const leads = places.filter(p => ["rumoured", "known"].includes(stOf(p.id)));
    const list = arr => arr.length ? `<ul>${arr.map(p => `<li>${stDot(p.id)}${byId[p.id] ? `<button type="button" data-go="${esc(p.id)}">${esc(p.name)}</button>` : `<span>${esc(p.name)}</span>`}</li>`).join("")}</ul>` : `<p class="kn">None right now.</p>`;
    const q = TR.q.toLowerCase();
    const match = k => {
      if (TR.show === "found" && !isFound(k)) return false;
      if (TR.show === "missing" && isFound(k)) return false;
      if (TR.show.startsWith("m:") && !(k.heldBy || []).includes(TR.show.slice(2))) return false;
      if (!q) return true;
      return [k.title, k.detail, k.from, k.effect, ...(k.foundAt || []).map(placeName), ...(k.opens || []).map(placeName)].join(" ").toLowerCase().includes(q);
    };
    const shown = TR.keys.filter(match);
    body.innerHTML = `
      ${TR.canWrite ? "" : `<p class="trnote">Read-only: you can see the tracker but not change it.</p>`}${TR.db && TR.db.local ? `<p class="trnote">Kept in this browser only. Open the page on claude.ai, signed in, to keep it with the page.</p>` : ""}
      <div class="party"><span class="kl">Characters</span>${TR.party.map(m => `<span class="pc"><span class="pcg">${esc(m.name)}</span>${TR.canWrite ? `<button type="button" class="pcx" data-mdel="${esc(m.id)}" aria-label="Remove ${esc(m.name)}">×</button>` : ""}</span>`).join("") || `<span class="kn">none added</span>`}
        ${TR.canWrite ? `<form class="inl" id="memForm"><input id="memName" placeholder="Add a character" aria-label="Character name" maxlength="40"><button type="submit">Add</button></form>` : ""}</div>
      <div class="trsum">
        <section><h4>Ready to follow</h4><p class="hint">A ticked clue or found key opens these, and the party hasn't been yet.</p>${list(ready)}</section>
        <section><h4>Leads in play</h4><p class="hint">Rumoured or known, not yet open.</p>${list(leads)}</section>
        <section><h4>Only one way in</h4><p class="hint">Only one clue or key leads here. If it's missed, the trail dies: add another route.</p>${list(fragile)}</section>
      </div>
      <div class="trbar">
        <input type="search" id="trq" placeholder="Search keys, people, places" value="${esc(TR.q)}" aria-label="Search keys">
        <select id="trshow" aria-label="Show which keys">
          <option value="all"${TR.show === "all" ? " selected" : ""}>All keys</option>
          <option value="found"${TR.show === "found" ? " selected" : ""}>Found</option>
          <option value="missing"${TR.show === "missing" ? " selected" : ""}>Not found yet</option>
          ${TR.party.map(m => `<option value="m:${esc(m.id)}"${TR.show === "m:" + m.id ? " selected" : ""}>Held by ${esc(m.name)}</option>`).join("")}
        </select>
        ${TR.canWrite ? `<button type="button" class="prim" data-knew="">+ New key</button><button type="button" id="plNew">+ New place</button>` : ""}
      </div>
      <div class="keys">${shown.length ? shown.map(keyRow).join("") : `<p class="kn">${TR.keys.length ? "No keys match." : "No keys yet. A key is anything the party gains that opens a place: a name, an introduction, a pass, a favour."}</p>`}</div>
      ${Object.keys(TR.places).length ? `<h4 class="addh">Places you've added</h4><div class="addp">${Object.entries(TR.places).map(([id, v]) => `<div class="ap">${stDot(id)}<span class="apn">${esc(v.name)}</span><span class="kn">${esc(v.dist || "")}</span><select data-stsel="${esc(id)}" aria-label="Status of ${esc(v.name)}"${TR.canWrite ? "" : " disabled"}>${STATUSES.map(([sv, sl]) => `<option value="${sv}"${stOf(id) === sv ? " selected" : ""}>${sl}</option>`).join("")}</select>${TR.canWrite ? `<button type="button" class="pcx" data-pldel="${esc(id)}" aria-label="Delete ${esc(v.name)}">×</button>` : ""}</div>`).join("")}</div>` : ""}`;
  }

  // ---- per-place clue checklists and access
  const clueDone = (place, k) => !!(TR.clues[place] && TR.clues[place].includes(k));
  const shortClue = s => { const t = String(s); return t.length > 78 ? t.slice(0, 75).replace(/\s+\S*$/, "") + "…" : t; };
  function accessInfo(id) {
    const ways = [];
    for (const w of INTO[id] || []) ways.push({ kind: "clue", at: w.from, text: w.short, done: clueDone(w.from, w.k) });
    for (const k of keysOpening(id)) ways.push({ kind: "key", at: (k.foundAt || [])[0], text: k.title, done: isFound(k), key: k });
    const st = TR.status[id] || {}, s = stOf(id);
    const free = typeof st.free === "boolean" ? st.free : ((byId[id] && byId[id].start) || ways.length === 0);
    const via = ways.filter(w => w.done);
    return { acc: free || via.length > 0 || s === "open" || s === "resolved", free, via, ways, s };
  }
  function accBadge(id) { if (!TR.ready) return ""; const a = accessInfo(id); return a.acc ? `<span class="acc ok" title="Accessible">✓</span>` : `<span class="acc no" title="Not accessible yet">🔒</span>`; }
  function wayLine(w) {
    return `<li class="${w.done ? "got" : ""}"><span class="wk">${w.done ? "✓" : "○"}</span><span>${w.kind === "key" ? `<strong>${esc(w.text)}</strong> <span class="kk">key</span>` : esc(shortClue(w.text))}${w.at ? ` <span class="kn">at</span> ${placeChips([w.at])}` : ""}</span></li>`;
  }
  function clueSection(p) {
    const rows = ROWS[p.id] || [];
    const lead = (r, done) => r.to.length ? `<div class="cl-to"><span class="kn">${TR.ready ? (done ? "Opened" : "Would open") : "Leads to"}</span>${r.to.map(t => `<span class="pc">${accBadge(t)}<button type="button" class="pcg" data-go="${esc(t)}">${esc(placeName(t))}</button></span>`).join("")}</div>` : "";
    const hint = r => r.hint ? `<details class="chint"><summary>${r.to.length === 1 ? "How to hint at " + esc(placeName(r.to[0])) : r.to.length ? "How to hint where it leads" : "If it is missed"}</summary><p>${esc(r.hint)}</p></details>` : "";
    const fold = (r, done) => `<details class="clf"><summary>${esc(r.short)}${r.roll && A.tableUI ? " " + A.tableUI.roll(r.roll) : ""}${r.handout && A.tableUI ? ` <button type="button" class="ho-b" data-t="hview" data-id="${esc(r.handout)}" title="Read this handout, or give it to the players">${A.table.icon("handout")}Handout</button>` : ""}</summary><p class="clx">${esc(r.text)}</p>${lead(r, done)}${hint(r)}${r.rescue ? `<details class="chint"><summary>If they're stuck</summary><p>${esc(r.rescue)}</p></details>` : ""}${r.handout && A.tableUI ? `<p class="cl-ho">${A.tableUI.handoutBtns(r.handout)}</p>` : ""}</details>`;
    if (!TR.ready) return `<section class="sec"><h3>Clues to find${rows.length ? FOLDALL : ""}</h3>${rows.length ? `<ul class="cls">${rows.map(r => `<li class="cl"><span class="ckx"></span>${fold(r)}</li>`).join("")}</ul>` : `<p class="kn">None here.</p>`}</section>`;
    const ro = TR.canWrite ? "" : " disabled";
    const main = rows.map(r => { const done = clueDone(p.id, r.k); return `<li class="cl${done ? " done" : ""}"><input type="checkbox" data-clue="${esc(p.id)}" data-ck="${esc(r.k)}" aria-label="Found: ${esc(r.short)}"${done ? " checked" : ""}${ro}>${fold(r, done)}</li>`; }).join("");
    const extra = keysFoundAt(p.id).map(k => {
      const done = isFound(k);
      const leads = (k.opens || []).length ? `<div class="cl-to"><span class="kn">${done ? "Opened" : "Would open"}</span>${k.opens.map(t => `<span class="pc">${accBadge(t)}${byId[t] ? `<button type="button" class="pcg" data-go="${esc(t)}">${esc(placeName(t))}</button>` : `<span class="pcg">${esc(placeName(t))}</span>`}</span>`).join("")}</div>` : "";
      return `<li class="cl${done ? " done" : ""}"><input type="checkbox" data-found="${esc(k.id)}" aria-label="Found: ${esc(k.title)}"${done ? " checked" : ""}${ro}><details class="clf"><summary>${esc(k.title)}</summary>${k.from ? `<p class="clx kn">From ${esc(k.from)}</p>` : ""}${leads}</details></li>`;
    }).join("");
    const n = rows.filter(r => clueDone(p.id, r.k)).length + keysFoundAt(p.id).filter(isFound).length, tot = rows.length + keysFoundAt(p.id).length;
    return `<section class="sec"><h3>Clues to find <span class="cl-n">${n} of ${tot} found</span>${tot ? FOLDALL : ""}</h3><ul class="cls">${main}${extra}</ul>
      ${TR.canWrite ? `<button type="button" class="addclue" data-kfound="${esc(p.id)}">+ Add a clue found here</button>` : ""}</section>`;
  }
  function accHead(id) {
    const a = accessInfo(id), st = TR.status[id] || {};
    return a.acc
      ? `<div class="accbox ok"><strong>✓ Accessible.</strong> ${a.free ? (byId[id] && byId[id].start && typeof st.free !== "boolean" ? "A starting place: the story opens here." : a.ways.length ? "Marked open from the start." : "Nothing gates it: the party can go once they know of it.") : a.via.length ? `Opened by ${a.via.map(w => `“${esc(shortClue(w.text))}”${w.at ? ` at ${esc(placeName(w.at))}` : ""}`).join("; ")}.` : "Marked open or resolved."}</div>`
      : `<div class="accbox no"><strong>🔒 Not accessible yet.</strong> None of the ${a.ways.length} clue${a.ways.length === 1 ? "" : "s"} that lead here has been found. They can still force it (see Access, leads and keys below), but nothing points them here.</div>`;
  }
  function accTop(id) { return TR.ready ? `<div class="keeper acctop">${accHead(id)}</div>` : ""; }
  function leadsPanel(id) {
    if (!TR.ready) return `<section class="sec keeper"><h3>Access, leads and keys</h3><p class="kn">${TR.db === false ? "Tracking needs the page open on claude.ai while signed in." : "Loading…"}</p></section>`;
    const a = accessInfo(id), st = TR.status[id] || {}, ro = TR.canWrite ? "" : " disabled";
    const warn = a.ways.length === 1 && !["resolved", "closed"].includes(a.s) ? `<p class="warn">Only one way in. If the party misses it, they can't find this place. Consider another lead.</p>` : "";
    return `<section class="sec keeper leads"><h3>Access, leads and keys</h3>
      ${accHead(id)}
      <label class="freeck"><input type="checkbox" data-free="${esc(id)}"${a.free ? " checked" : ""}${ro}> Open from the start (a public place, or somewhere they already know)</label>
      <div class="stseg" role="group" aria-label="Status">${STATUSES.map(([v, l]) => `<button type="button" data-st="${v}" data-pl="${esc(id)}" aria-pressed="${a.s === v}"${ro}><span class="sd st-${v}"></span>${l}</button>`).join("")}</div>
      <h4>Ways in (${a.via.length} of ${a.ways.length} found)</h4>
      ${a.ways.length ? `<ul class="wl">${a.ways.map(wayLine).join("")}</ul>` : `<p class="kn">No clue points here.</p>`}${warn}
      <div class="grid2">
        <label class="nt"><span>Forcing it without a lead</span><textarea data-note="force" data-pl="${esc(id)}" rows="3" placeholder="What it costs: a roll, a bribe, someone noticing…"${ro}>${esc(st.force || "")}</textarea></label>
        <label class="nt"><span>What closes it</span><textarea data-note="closes" data-pl="${esc(id)}" rows="3" placeholder="What happens if the party waits or gets caught…"${ro}>${esc(st.closes || "")}</textarea></label>
      </div>
      ${TR.canWrite ? `<button type="button" class="prim" data-knew="${esc(id)}">+ Add another way in</button>` : ""}
    </section>`;
  }
  function renderClues() { const p = byId[state.sel], slot = $("#clueSlot"); if (p && slot) slot.innerHTML = clueSection(p); }
  function renderLeads() { const slot = $("#leadsSlot"); if (slot) slot.innerHTML = leadsPanel(state.sel); const t = $("#accSlot"); if (t) t.innerHTML = accTop(state.sel); }
  function paintStatusDots() {
    const acc = id => (TR.ready && !accessInfo(id).acc ? "locked" : "");
    const pins = CITY && CITY.map && CITY.map.pins;
    if (pins) for (const id in pins) { pins[id].dataset.st = TR.ready ? stOf(id) : ""; pins[id].dataset.acc = acc(id); }
    document.querySelectorAll("#list li button[data-go]").forEach(b => { b.dataset.st = TR.ready ? stOf(b.dataset.go) : ""; b.dataset.acc = acc(b.dataset.go); });
  }
  function renderTrackerAll() { renderTracker(); renderLeads(); renderClues(); paintStatusDots(); if (WORLD && state.view === "world") WORLD.sync(); }

  // ---- the key editor and the new-place form (one dialog)
  function openKeyEditor(id, forPlace, foundPlace) {
    const k = id ? TR.keys.find(x => x.id === id) : null;
    TR.edit = k ? JSON.parse(JSON.stringify(k)) : { id: null, title: "", kind: "knowledge", detail: "", from: "", effect: "", foundAt: foundPlace ? [foundPlace] : [], opens: forPlace ? [forPlace] : [], heldBy: [], found: false };
    renderKeyEditor();
    const d = $("#keyDlg"); if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    setTimeout(() => $("#ke-title") && $("#ke-title").focus(), 30);
  }
  function renderKeyEditor() {
    const e = TR.edit, opts = allPlaces().map(p => `<option value="${esc(p.name)}">${esc(p.dist)}</option>`).join("");
    $("#keyDlg").innerHTML = `<form method="dialog" id="keForm" class="ke">
      <h3>${e.id ? "Edit key" : "New key"}</h3>
      <label><span>What the party gets</span><input id="ke-title" value="${esc(e.title)}" maxlength="120" required placeholder="e.g. the foreman's password"></label>
      <label><span>Kind</span><select id="ke-kind">${Object.entries(KINDS).map(([v, l]) => `<option value="${v}"${e.kind === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label><span>Details</span><textarea id="ke-detail" rows="2" maxlength="600">${esc(e.detail)}</textarea></label>
      <div class="pick"><span>Found at</span><div class="chips2" data-chips="foundAt">${placeChips(e.foundAt, true)}</div><input list="placeOpts" data-add="foundAt" placeholder="Type a place and press Enter" aria-label="Add a place where this key is found"></div>
      <label><span>From whom (people)</span><input id="ke-from" value="${esc(e.from)}" maxlength="200"></label>
      <div class="pick"><span>Opens</span><div class="chips2" data-chips="opens">${placeChips(e.opens, true)}</div><input list="placeOpts" data-add="opens" placeholder="Type a place and press Enter" aria-label="Add a place this key opens"></div>
      <label><span>What it does there</span><input id="ke-effect" value="${esc(e.effect)}" maxlength="200"></label>
      <datalist id="placeOpts">${opts}</datalist>
      <div class="ka"><button type="submit" value="cancel" formnovalidate>Cancel</button><button type="submit" value="save" class="prim">Save key</button></div>
    </form>`;
  }
  function openPlaceEditor() {
    $("#keyDlg").innerHTML = `<form method="dialog" id="plForm" class="ke">
      <h3>New place</h3>
      <label><span>Name of the place</span><input id="pl-name" maxlength="80" required></label>
      <label><span>District or region (optional)</span><input id="pl-dist" maxlength="40"></label>
      <div class="ka"><button type="submit" value="cancel" formnovalidate>Cancel</button><button type="submit" value="save" class="prim">Add place</button></div>
    </form>`;
    const d = $("#keyDlg"); if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    setTimeout(() => $("#pl-name") && $("#pl-name").focus(), 30);
  }
  const closeDlg = () => { const d = $("#keyDlg"); if (d.close) d.close(); else d.removeAttribute("open"); };
  function pullEditor() { const e = TR.edit; e.title = $("#ke-title").value.trim(); e.kind = $("#ke-kind").value; e.detail = $("#ke-detail").value.trim(); e.from = $("#ke-from").value.trim(); e.effect = $("#ke-effect").value.trim(); }
  function addPlaceTo(field, text) {
    const t = text.trim().toLowerCase(); if (!t) return false;
    const p = allPlaces().find(x => x.name.toLowerCase() === t) || allPlaces().find(x => x.name.toLowerCase().startsWith(t));
    if (!p) return false;
    pullEditor();
    if (!TR.edit[field].includes(p.id)) TR.edit[field].push(p.id);
    renderKeyEditor(); const inp = document.querySelector(`#keyDlg input[data-add="${field}"]`); if (inp) inp.focus();
    return true;
  }

  // ---- who knows whom. A person's ties name the people they know and how (ties: { castId or "Full Name": "how" }).
  // Everyone is also shown the people elsewhere who name them, so the web reads both ways, and a name links to the
  // place where that person is met. A person is known by their cast id, or else by their name in lower case.
  const tiesOf = n => { const t = n.ties || (castOf(n) || {}).ties; if (!t) return []; return typeof t === "string" ? [{ text: t }] : Object.entries(t).map(([to, text]) => ({ to, text })); };
  const norm = s => String(s || "").trim().toLowerCase();
  const CASTNAME = {}; for (const [id, c] of Object.entries(A.castData || {})) if (c.n) CASTNAME[norm(c.n)] = id;
  const keyTo = to => (A.castData || {})[to] ? to : CASTNAME[norm(to)] || norm(to);
  const keyOf = n => n.who || keyTo(who(n)[0]);
  const POSTED = {}, NAMED = {}, NAMEOF = {};
  const named = (to, x) => (NAMED[to] = NAMED[to] || []).push(x);
  for (const p of P) for (const [k, n] of Object.entries((p.M || {}).npcs || {})) {
    const me = keyOf(n); if (me && !POSTED[me]) { POSTED[me] = p.id; NAMEOF[me] = who(n)[0]; }
    if (n.ties && typeof n.ties === "object") for (const [to, text] of Object.entries(n.ties)) { const t = keyTo(to); if (t !== me) named(t, { name: who(n)[0], pid: p.id, text }); }
  }
  for (const [id, c] of Object.entries(A.castData || {})) if (c.ties && typeof c.ties === "object") for (const [to, text] of Object.entries(c.ties)) { const t = keyTo(to); if (t !== id) named(t, { name: c.n, cast: id, text }); }
  function personLink(to) {
    const t = keyTo(to), c = (A.castData || {})[t], name = c ? c.n : NAMEOF[t] || to, at = POSTED[t];
    return at && byId[at] ? `<a href="#${esc(at)}">${esc(name)}</a>` : esc(name);
  }
  function tiesRows(n) {
    const own = tiesOf(n).map(t => `<li>${t.to ? `<b>${personLink(t.to)}</b>: ` : ""}${esc(t.text)}</li>`).join("");
    const by = (NAMED[keyOf(n)] || []).map(x => `<li><b>${x.cast ? personLink(x.cast) : byId[x.pid] ? `<a href="#${esc(x.pid)}">${esc(x.name)}</a>` : esc(x.name)}</b>: ${esc(x.text)}</li>`).join("");
    return (own ? `<div class="pf"><dt>Ties</dt><dd><ul class="ties">${own}</ul></dd></div>` : "") + (by ? `<div class="pf"><dt>Named by</dt><dd><ul class="ties">${by}</ul></dd></div>` : "");
  }

  // ---- people: each "People here" entry opens into a profile, with the referee's own notes saved per person
  function profile(pid, k, n) {
    const c = castOf(n) || {}, cid = n.who || pid + "." + k, g = f => n[f] || c[f] || "";
    const row = (label, v, cls) => v ? `<div class="pf${cls ? " " + cls : ""}"><dt>${label}</dt><dd>${esc(v)}</dd></div>` : "";
    const notes = TR.chars[cid] ? TR.chars[cid].notes || "" : "", M = byId[pid].M;
    return `<div class="prof"><dl>
      ${row("Where", n.at ? ((A.nameOf && A.nameOf(M, n.at)) ? n.at + " · " + A.nameOf(M, n.at) : n.at) : "")}${row("Looks", g("look"))}${row("Manner", g("manner"))}${row("Sounds", g("voice"))}${row("Doing", n.doing)}${row("Story", g("bg"))}${tiesRows(n)}${row("Wants", g("want"))}${row("Knows", n.knows)}${row("Secret", g("secret"), "sec-k")}${row("Lie", g("lie"))}${row("Talks", g("press"))}${row("Reveals", n.rev)}${row("Fate", c.fate)}
    </dl>${A.tableUI ? A.tableUI.stats(n.stats || c.stats) : ""}
    ${TR.ready ? `<label class="cnote"><span>Your notes on ${esc(who(n)[0])}</span><textarea data-cnote="${esc(cid)}" rows="3" placeholder="What the party has learned, how you've played them, changes…"${TR.canWrite ? "" : " disabled"}>${esc(notes)}</textarea></label>` : ""}</div>`;
  }
  function peopleList(p) {
    const np = Object.entries((p.M || {}).npcs || {});
    if (!np.length) return `<p class="kn">Nobody is posted here.</p>`;
    return `<ul class="ppl">${np.map(([k, n]) => { const [name, role] = who(n); return `<li><details class="npc" id="pp-${esc(p.id)}-${esc(k)}"><summary><span class="npn">${esc(name)}</span>${role ? `<span class="npr"> — ${esc(role)}</span>` : ""}</summary>${profile(p.id, k, n)}</details></li>`; }).join("")}</ul>`;
  }
  function syncCharNotes() {
    document.querySelectorAll("textarea[data-cnote]").forEach(t => {
      if (document.activeElement === t) return;
      const v = TR.chars[t.dataset.cnote] ? TR.chars[t.dataset.cnote].notes || "" : "";
      if (t.value !== v) t.value = v;
      t.disabled = !TR.canWrite;
    });
  }
  // open profiles stay open when the list is drawn again
  function renderPeople() { const p = byId[state.sel], slot = $("#peopleSlot"); if (!p || !slot) return; const open = [...slot.querySelectorAll("details[open]")].map(d => d.id); slot.innerHTML = `<h3>People here${FOLDALL}</h3>${peopleList(p)}`; open.forEach(id => { const d = document.getElementById(id); if (d) d.open = true; }); }

  /* ---- events */
  document.addEventListener("click", e => {
    const t = e.target; if (!t.closest) return;
    if (t.closest("#v-gaz")) { setView("gaz"); return; }
    if (t.closest("#v-story")) { setView("story"); return; }
    if (t.closest("#v-music")) { setView("music"); return; }
    if (t.closest("#v-world")) { setView("world"); return; }
    if (t.closest("#v-galaxy")) { setView("galaxy"); return; }
    if (t.closest("#v-table")) { setView("table"); return; }
    const wb = t.closest("[data-world]"); if (wb) { showWorld(wb.dataset.world || null); return; }
    const j = t.closest("[data-sjump]"); if (j) { const s = document.getElementById("st-" + j.dataset.sjump); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const fa = t.closest("[data-foldall]"); if (fa) { const box = fa.closest(".lm-blk, .sec"), list = box ? [...box.querySelectorAll("details.fold, details.clf, details.hk, details.npc, details.ci")] : [], open = list.some(d => !d.open); list.forEach(d => { d.open = open; }); fa.textContent = open ? "Close all" : "Open all"; return; }
    const nk = t.closest("[data-knew]"); if (nk) { openKeyEditor(null, nk.dataset.knew || null); return; }
    const nf = t.closest("[data-kfound]"); if (nf) { openKeyEditor(null, null, nf.dataset.kfound); return; }
    const ed = t.closest("[data-kedit]"); if (ed) { openKeyEditor(ed.dataset.kedit); return; }
    const dl = t.closest("[data-kdel]"); if (dl) { const k = TR.keys.find(x => x.id === dl.dataset.kdel); if (k) twice(dl, () => trWrite(db => db.collection("keys").doc(k.id).delete())); return; }
    const hb = t.closest("[data-hold]"); if (hb) { const k = TR.keys.find(x => x.id === hb.dataset.hold); if (!k) return; const h = new Set(k.heldBy || []); h.has(hb.dataset.mem) ? h.delete(hb.dataset.mem) : h.add(hb.dataset.mem); trWrite(db => db.collection("keys").doc(k.id).update({ heldBy: [...h], found: h.size > 0 || !!k.found })); return; }
    const st = t.closest("[data-st][data-pl]"); if (st) { const id = st.dataset.pl, cur = TR.status[id] || {}; trWrite(db => db.collection("status").doc(id).set(Object.assign({}, cur, { status: st.dataset.st }))); return; }
    const mdl = t.closest("[data-mdel]"); if (mdl) { const m = TR.party.find(x => x.id === mdl.dataset.mdel); if (m) twice(mdl, () => trWrite(db => db.doc("tracker/party").set({ members: TR.party.filter(x => x.id !== m.id) }))); return; }
    const rm = t.closest("#keyDlg [data-rm]"); if (rm) { e.preventDefault(); pullEditor(); const f = rm.closest("[data-chips]").dataset.chips; TR.edit[f] = TR.edit[f].filter(x => x !== rm.dataset.rm); renderKeyEditor(); return; }
    if (t.closest("#plNew")) { openPlaceEditor(); return; }
    const pd = t.closest("[data-pldel]"); if (pd) { if (TR.places[pd.dataset.pldel]) twice(pd, () => trWrite(db => db.collection("places").doc(pd.dataset.pldel).delete())); return; }
    const g = t.closest("[data-go]");
    if (g && !g.closest(".lmap-sec")) { if (g.closest("#story, #tablev, #tDlg, #galaxyv")) setView("gaz"); go(g.dataset.go, !!g.closest(".atlas")); return; }
    if (g) { go(g.dataset.go); return; }
    const c = t.closest("[data-cat]"); if (c) { state.cat = c.dataset.cat; renderAll(false); return; }
    if (t.closest("#m-keeper")) { setMode("gm"); return; }
    if (t.closest("#m-player")) { setMode("player"); return; }
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.matches) return;
    if (t.matches("#act")) { state.act = t.value; renderList(); renderMap(); paintStatusDots(); }
    if (t.matches("#cityPick")) mountCity(t.value);
    if (t.matches("[data-found]")) { const k = TR.keys.find(x => x.id === t.dataset.found); if (!k) return; const on = t.checked; trWrite(db => db.collection("keys").doc(k.id).update(on ? { found: true } : { found: false, heldBy: [] })); }
    if (t.matches("#trshow")) { TR.show = t.value; renderTracker(); }
    if (t.matches("[data-clue]")) { const pl = t.dataset.clue, k = t.dataset.ck, cur = new Set(TR.clues[pl] || []); t.checked ? cur.add(k) : cur.delete(k); trWrite(db => db.collection("clues").doc(pl).set({ done: [...cur].sort() })); }
    if (t.matches("[data-free]")) { const id = t.dataset.free, cur = TR.status[id] || {}; trWrite(db => db.collection("status").doc(id).set(Object.assign({ status: "unknown" }, cur, { free: t.checked }))); }
    if (t.matches("[data-stsel]")) { const id = t.dataset.stsel, cur = TR.status[id] || {}; trWrite(db => db.collection("status").doc(id).set(Object.assign({}, cur, { status: t.value }))); }
    if (t.matches("textarea[data-note]")) { const id = t.dataset.pl, cur = TR.status[id] || {}, v = t.value.slice(0, 1500); if ((cur[t.dataset.note] || "") === v) return; trWrite(db => db.collection("status").doc(id).set(Object.assign({ status: "unknown" }, cur, { [t.dataset.note]: v }))); }
    if (t.matches("textarea[data-cnote]")) { const id = t.dataset.cnote, v = t.value.slice(0, 4000); if (((TR.chars[id] || {}).notes || "") === v) return; trWrite(db => db.collection("chars").doc(id).set({ notes: v })); }
  });
  document.addEventListener("input", e => {
    const t = e.target; if (!t.matches) return;
    if (t.matches("#q")) { state.q = t.value.trim(); renderList(); renderMap(); paintStatusDots(); if (WORLD) WORLD.search(state.q); }
    if (t.matches("#trq")) { TR.q = t.value; const pos = t.selectionStart; renderTracker(); const q = $("#trq"); q.focus(); try { q.setSelectionRange(pos, pos); } catch (_) {} }
  });
  document.addEventListener("keydown", e => {
    const t = e.target;
    if (t.matches && t.matches("#keyDlg input[data-add]") && e.key === "Enter") { e.preventDefault(); if (!addPlaceTo(t.dataset.add, t.value)) { t.setCustomValidity("No place with that name"); t.reportValidity(); setTimeout(() => t.setCustomValidity(""), 1500); } }
  });
  document.addEventListener("submit", e => {
    if (e.target.id === "memForm") { e.preventDefault(); const n = $("#memName").value.trim().slice(0, 40); if (!n) return; trWrite(db => db.doc("tracker/party").set({ members: [...TR.party, { id: "m" + Math.random().toString(36).slice(2, 8), name: n }] })); return; }
    if (e.target.id === "plForm") {
      if (!e.submitter || e.submitter.value !== "save") return;
      e.preventDefault();
      const name = $("#pl-name").value.trim().slice(0, 80), dist = $("#pl-dist").value.trim().slice(0, 40); if (!name) { $("#pl-name").reportValidity(); return; }
      closeDlg(); trWrite(db => db.collection("places").doc("x-" + Math.random().toString(36).slice(2, 9)).set({ name, dist })); return;
    }
    if (e.target.id === "keForm") {
      if (!e.submitter || e.submitter.value !== "save") return;
      e.preventDefault();
      pullEditor();
      document.querySelectorAll("#keyDlg input[data-add]").forEach(i => { if (i.value.trim()) addPlaceTo(i.dataset.add, i.value); });   // a place typed but not yet added
      const k = TR.edit; if (!k.title) { $("#ke-title").reportValidity(); return; }
      const id = k.id || "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const order = k.order != null ? k.order : (TR.keys.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1);
      const body = { title: k.title, kind: k.kind, detail: k.detail, from: k.from, effect: k.effect, foundAt: k.foundAt, opens: k.opens, heldBy: k.heldBy || [], found: !!k.found, order };
      closeDlg(); trWrite(db => db.collection("keys").doc(id).set(body));
    }
  });
  function setMode(m) {
    state.mode = m; store.set("mode", m);
    if (m === "player" && state.cat === "bones") state.cat = "all";
    if (m === "player" && (state.view === "story" || state.view === "table")) setView("gaz");
    renderAll(false);
    if (WORLD) WORLD.sync();
  }
  window.addEventListener("hashchange", () => {
    const h = hash();
    if (h === "world") showWorld(); else if (/^city\//.test(h) && CITIES[h.slice(5)]) enterCity(h.slice(5));
    else if (byId[h] && h !== state.sel) go(h);
  });

  /* ---- the table (atlas-table-gm.js): its context, before the first paint */
  if (A.tableUI) A.tableUI.init({ P, byId, ROWS, INTO, who, castOf, state, TR, POSTED, md, inl, db: DBP, prefs: store, go, setView: v => setView(v),
    stOf, accessInfo, clueDone, redraw: () => { if (byId[state.sel]) renderDossier(false); } });
  // the clues changed on the page (the investigation, the map editor): the lists are made again, the place drawn again
  document.addEventListener("atlas-story", () => { clearTimeout(index.t); index.t = setTimeout(() => { index(); if (byId[state.sel] && state.view === "gaz") renderDossier(false); renderTrackerAll(); }, 60); });

  /* ---- first paint */
  renderAll(false); renderTracker();
  if (A.music) { A.music.bind(app); A.music.place(state.sel); }
  // the city on the plan: the chosen place's own (or the one shown last); #world and #city/<id> open those directly
  if (A.cityData && A.cityMount) { const h = hash(), want = /^city\//.test(h) ? h.slice(5) : byId[state.sel] ? cityOf(state.sel) : store.get("city"); mountCity(CITIES[want] ? want : mainCity); }
  if (/^city\//.test(hash()) && CITIES[hash().slice(5)]) enterCity(hash().slice(5));
  else setView(hash() === "world" ? "world" : ["story", "music", "world", "table", "galaxy"].includes(store.get("view")) ? store.get("view") : "gaz");

  /* ---- connect the tracker to the artifact's database */
  (async function initTracker() {
    let db = null, user = null;
    db = await DBP;
    if (!db) { TR.db = false; renderTrackerAll(); return; }
    try { user = await window.claude.use("user"); } catch (e) { user = null; }
    TR.db = db;
    let can = null; try { can = user && user.can ? await user.can("data.write") : null; } catch (e) { can = null; }
    TR.canWrite = can !== false;
    let got = 0; const need = 6, mark = () => { if (++got >= need) { TR.ready = true; renderPeople(); } renderTrackerAll(); };
    const fail = e => { console.warn("tracker", e); if (e && (e.code === "revoked" || e.code === "not_granted")) { TR.db = false; TR.ready = false; renderTrackerAll(); } };
    const first = {}, once = (k, again) => { if (!first[k]) { first[k] = 1; mark(); } else again(); };
    db.collection("chars").onSnapshot(s => { TR.chars = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); once("chars", syncCharNotes); }, fail);
    db.collection("clues").onSnapshot(s => { TR.clues = Object.fromEntries(s.docs.map(d => [d.id, ((d.data() || {}).done || []).filter(x => typeof x === "string")])); once("clues", renderTrackerAll); }, fail);
    db.collection("keys").onSnapshot(s => { TR.keys = s.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(b.title)); once("keys", renderTrackerAll); }, fail);
    db.collection("status").onSnapshot(s => { TR.status = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); once("status", renderTrackerAll); }, fail);
    db.collection("places").onSnapshot(s => { TR.places = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); once("places", renderTrackerAll); }, fail);
    db.doc("tracker/party").onSnapshot(s => { TR.party = (s.exists && (s.data() || {}).members) || []; once("party", renderTrackerAll); }, fail);
  })();
})();
