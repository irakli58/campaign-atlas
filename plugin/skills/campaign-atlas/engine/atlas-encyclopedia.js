/* ================================================================
   CAMPAIGN ATLAS: THE GAZETTEER AS THE CAMPAIGN'S ENCYCLOPEDIA
   The user's request of 11 Nov 2026 for handmade campaigns: "I want the Gazetteer to function as a comprehensive,
   editable campaign encyclopedia", easy to find for someone making a campaign from nothing, with no sections that
   repeat what is already there. Above the Gazetteer's places, an index of what else the campaign holds: its people,
   clues, handouts and story (mysteries, plot points, quests, factions, events, things, secrets), each counted, each
   listed, each with its New button, each opening where it is written: the people editor (atlas-people.js), the
   investigation (atlas-clueui.js), the handout writer (atlas-handouts.js), Plot and story (atlas-plot.js), What Atlas
   knows (atlas-knowledge.js). Nothing is kept here: it reads them. A part switched off for the campaign is not listed.
   An empty campaign opens on a card of where to begin. Only the game master sees any of it.
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined") return;
  const esc = A.esc, mod = (k, l) => !A.modules || A.modules.on(k, l), E = A.encyclopedia = {};
  const api = () => A.tableUI && A.tableUI.api;
  const toTable = tab => { const a = api(), X = a && a.ctx(); if (X && X.setView) X.setView("table"); if (a) a.open(tab); };
  // a new place: in the city, where there is one; else a place of the campaign, on no map yet
  E.newPlace = () => { if (!A.locations) return; if (A.locations.hasCity && A.locations.hasCity()) A.locations.newInCity(); else A.locations.forPlace({ label: "the campaign", kind: "" }); };
  const ACTS = {
    place: () => E.newPlace(),
    person: () => A.people && A.people.open(null),
    portraits: () => A.people && A.people.drawAll && A.people.drawAll(),
    city: () => E.cityOpen(),
    clue: () => { toTable("clues"); if (A.clueUI && A.clueUI.newClue && !A.clueUI.newClue()) api().note("A clue lies in a place: make a place with a map first."); },
    handout: () => A.handoutWriter && A.handoutWriter.open(null),
    plot: () => A.plot && A.plot.open("plot"), mystery: () => A.plot && A.plot.open("mystery"), quest: () => A.plot && A.plot.open("quest"),
    item: kind => { toTable("clues"); if (A.clueUI && A.clueUI.newItem) A.clueUI.newItem(kind); },
    story: () => A.knowledge ? A.knowledge.open() : toTable("know"),
    knows: () => toTable("know"), map: () => A.ATLAS_MAKEMAP ? A.ATLAS_MAKEMAP() : toTable("know")
  };
  function counts() {
    const St = A.story, items = St ? Object.entries(St.items()).map(([id, it]) => Object.assign({ id }, it)) : [];
    return { places: (A.order || []).filter(id => A.meta[id]), people: A.people ? A.people.list() : Object.entries(A.castData || {}).map(([id, c]) => ({ id, n: c.n || id, role: c.role || "" })),
      clues: St ? St.allClues() : [], handouts: (A.table && A.table.allHandouts ? A.table.allHandouts() : []).concat(A.handoutWriter ? A.handoutWriter.list().filter(h => h.state === "draft") : []), items };
  }
  const SKIND = [["mystery", "Mysteries", "investigation.mysteries", "Mystery"], ["plot", "Plot points", "plot", "Plot point"], ["quest", "Quests", "plot.quests", "Quest"], ["faction", "Factions", null, "Faction"], ["event", "Events", null, "Event"], ["thing", "Things", null, "Thing"], ["secret", "Secrets", null, "Secret"], ["other", "Other", null, "Story"]];
  function html() {
    if (!A.tableUI) return "";
    const C = counts(), it = (cls, data, label, sub) => `<li><button type="button" class="enc-it" ${data}><span>${esc(label)}</span>${sub ? `<i>${esc(sub)}</i>` : ""}</button></li>`;
    const sec = (key, title, n, list, btns) => `<details class="enc-sec" data-enc="${key}"${E.open === key ? " open" : ""}><summary><b>${esc(title)}</b><span class="enc-n">${n}</span></summary>${list.length ? `<ul>${list.slice(0, 40).join("")}${list.length > 40 ? `<li class="kn">and ${list.length - 40} more</li>` : ""}</ul>` : ""}<div class="enc-new">${btns}</div></details>`;
    const btn = (a, l, extra) => `<button type="button" class="enc-add" data-enca="${a}"${extra ? ` data-k="${extra}"` : ""}>${esc(l)}</button>`;
    let h = `<div class="enc-head"><span class="enc-t">The campaign</span>${A.knowledge ? `<button type="button" class="enc-know" data-enca="knows" title="The campaign's own story, and what each part of Atlas could use">What Atlas knows</button>` : ""}</div>`;
    if (A.people && mod("people.editor")) h += sec("people", "People", C.people.length, C.people.map(p => it("", `data-encp="${esc(p.id)}"`, p.n, p.role)), btn("person", "+ A person") + (A.portrait && A.portrait.on() && A.people.missing && A.people.missing() ? btn("portraits", `Draw portraits for the ${A.people.missing()} without a picture`) : ""));
    if (mod("investigation") && mod("investigation.clues")) h += sec("clues", "Clues", C.clues.length, C.clues.map(c => it("", `data-encc="clue:${esc(c.pl)}/${esc(c.id)}"`, c.c.t || c.id, (A.meta[c.pl] || {}).name || "")), btn("clue", "+ A clue"));
    if (mod("handouts") && A.handoutWriter) h += sec("handouts", "Handouts", C.handouts.length, C.handouts.map(x => it("", x.state === "draft" || (A.handbook && A.handbook[x.id]) ? `data-ench="${esc(x.id)}"` : `data-t="hview" data-id="${esc(x.id)}"`, x.title || x.headline || "Untitled", x.state === "draft" ? "draft" : x.place ? (A.meta[x.place] || {}).name || "" : "")), btn("handout", "+ A handout"));
    const kinds = SKIND.filter(([, , m]) => !m || mod(m)), story = C.items.filter(x => kinds.some(k => k[0] === x.kind));
    if (A.story && (mod("investigation") || mod("plot"))) h += sec("story", "Story", story.length, story.map(x => it("", `data-enci="${esc(x.id)}" data-k="${esc(x.kind)}"`, x.n || "Untitled", (SKIND.find(k => k[0] === x.kind) || [0, 0, 0, ""])[3])), [mod("plot") && A.plot ? btn("plot", "+ A plot point") : "", mod("investigation.mysteries") && A.plot ? btn("mystery", "+ A mystery") : "", mod("plot.quests") && A.plot ? btn("quest", "+ A quest") : "", mod("investigation") ? btn("item", "+ A faction, an event, a thing, a secret", "faction") : ""].join(""));
    h += `<div class="enc-new enc-places">${A.locations ? btn("place", "+ A place") : ""}${canCity() ? btn("city", "+ A city for the campaign") : ""}</div>`;
    return h;
  }
  /* ---- the campaign's own city, made from its page (the user, 11 Nov 2026: "do these"): the Atlas app runs the city
          maker for it (atlas.js city), invented for the campaign's age or a real city with its real streets, water and
          landmarks, and builds the page again with it. Only while the campaign has none: a city once made is the
          campaign's, its places and changes laid over it, and is not made again from here. */
  const canCity = () => !A.cityData && !!(window.ATLAS_APP && window.ATLAS_APP.makeCity);
  const ERA_CITY = { victorian: "industrial", "1920s": "industrial", medieval: "medieval", fantasy: "fantasy", modern: "modern", future: "future" };
  let cdlg = null;
  E.cityOpen = () => {
    if (!canCity()) { api().note(A.cityData ? "This campaign has its city already." : "A city is made by the Atlas tool: in the Atlas app (this button), or atlas.js city."); return; }
    const cfg = A.config || {}, era = ERA_CITY[A.table && A.table.era ? A.table.era() : "modern"] || "modern", yr = +cfg.year || (String([cfg.setting, cfg.subtitle, cfg.strap, cfg.title].join(" ")).match(/\b(1[0-9]\d\d|20\d\d)\b/) || [])[1] || "";
    const o = (list, v) => list.map(([k, l]) => `<option value="${k}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("");
    if (!cdlg) { cdlg = document.createElement("dialog"); cdlg.id = "cityDlg"; cdlg.className = "loc-dlg"; document.body.appendChild(cdlg); cdlg.addEventListener("click", cityClick); cdlg.addEventListener("change", e => { if (e.target.name === "how" || e.target.name === "era") cityPaint(); }); }
    cdlg.innerHTML = `<form class="pp-form city-form" method="dialog"><div class="loc-head"><h3>A city for the campaign</h3><button type="button" class="t-btn" data-cty="x">Close</button></div>
      <p class="t-small">Made by the Atlas tool on this computer, in 3D, with its streets, its quarters and its buildings of the age; your places go into it after with + Add location. No AI is needed.</p>
      <div class="cty-how" role="radiogroup"><label><input type="radio" name="how" value="invent" checked> Invented for its age and place</label><label><input type="radio" name="how" value="real"> A real city, with its real streets, river and landmarks</label></div>
      <label>Its name<input class="t-in" name="name" maxlength="80" required placeholder="Kingsport"></label>
      <div class="loc-g2"><label>Its age<select class="t-in" name="era">${o([["medieval", "The middle ages"], ["industrial", "The age of steam and gaslight to the 1930s"], ["modern", "Today"], ["fantasy", "Fantasy"], ["future", "The future"]], era)}</select></label><label>The year, if you like<input class="t-in" name="year" type="number" min="1" max="2099" value="${esc(yr)}" placeholder="1925"></label></div>
      <div class="cty-inv"><div class="loc-g2"><label>How big<select class="t-in" name="size">${o([["town", "A town"], ["city", "A city"], ["metropolis", "A great city"]], "town")}</select></label><label>Where it lies<select class="t-in" name="site">${o([["plain", "On open ground"], ["river", "On a river"], ["coast", "On the coast"], ["harbour", "A harbour"], ["lake", "By a lake"]], "river")}</select></label></div>
        <div class="loc-g2"><label>Its streets<select class="t-in" name="plan">${o([["organic", "Grown over time"], ["grid", "Laid out in a grid"]], era === "modern" ? "grid" : "organic")}</select></label><label>Its people and buildings<select class="t-in" name="culture">${o([["english", "English"], ["american", "American"], ["french", "French"], ["italian", "Italian"], ["spanish", "Spanish"], ["german", "German"], ["arabic", "Arabic"], ["japanese", "Japanese"], ["fantasy", "Fantasy"]], era === "fantasy" ? "fantasy" : /arkham|america|new england|massachusetts|chicago|new york/i.test(String(cfg.setting || "") + " " + (cfg.title || "")) ? "american" : "english")}</select></label></div>
        <label class="cty-fut">What it is<select class="t-in" name="kind">${o([["moonbase", "A base on a moon"], ["outpost", "An outpost"], ["colony", "A colony"], ["station", "A station in orbit"]], "moonbase")}</select></label>
        <label>A number for another of the same kind (leave empty for any)<input class="t-in" name="seed" type="number" min="0" max="999999" placeholder="7"></label></div>
      <div class="cty-real"><p class="t-small">Its real streets, water, parks and landmarks are fetched from OpenStreetMap, then drawn in buildings of the age you chose; it takes a few minutes and needs the internet. Name it with its country: <i>Florence, Italy</i>.</p>
        <div class="loc-g2"><label>Around (a landmark at its middle, if you like)<input class="t-in" name="around" maxlength="80" placeholder="Ponte Vecchio"></label><label>How far across, in kilometres<input class="t-in" name="km" type="number" min="0.5" max="6" step="0.5" value="2"></label></div></div>
      <p class="cty-msg t-small" aria-live="polite"></p>
      <div class="loc-go"><button type="button" class="t-btn prim" data-cty="make">Make the city</button><button type="button" class="t-btn" data-cty="x">Cancel</button></div></form>`;
    cityPaint(); if (!cdlg.open) cdlg.showModal(); setTimeout(() => { const n = cdlg.querySelector('[name="name"]'); if (n) n.focus(); }, 30);
  };
  function cityPaint() {
    const f = cdlg.querySelector("form"), real = f.elements.how.value === "real", fut = f.elements.era.value === "future";
    f.querySelector(".cty-inv").hidden = real; f.querySelector(".cty-real").hidden = !real;
    f.querySelector(".cty-fut").hidden = !fut || real; for (const n of ["size", "site", "plan", "culture"]) f.elements[n].closest("label").hidden = fut;
    f.elements.name.placeholder = real ? "Florence, Italy" : fut ? "Tycho Ring" : "Kingsport";
  }
  async function cityClick(e) {
    const b = e.target.closest("[data-cty]"); if (!b) return;
    if (b.dataset.cty === "x") { if (!b.disabled) cdlg.close(); return; }
    const f = cdlg.querySelector("form"), v = n => String(f.elements[n] ? f.elements[n].value : "").trim(), msg = cdlg.querySelector(".cty-msg");
    if (!v("name")) { f.elements.name.focus(); return; }
    const real = v("how") === "real", o = { main: true, name: v("name"), real, era: v("era"), year: v("year") };
    if (real) Object.assign(o, { around: v("around"), km: v("km") }); else Object.assign(o, { size: v("size"), site: v("site"), plan: v("plan"), culture: v("culture"), kind: v("kind"), seed: v("seed") });
    cdlg.querySelectorAll("button, input, select").forEach(x => { x.disabled = true; });
    msg.textContent = real ? "Fetching its streets and drawing them: a few minutes. The page opens again on the city when it is ready." : "Laying out its streets and buildings: a minute or so. The page opens again on the city when it is ready.";
    try { await window.ATLAS_APP.makeCity(o); }
    catch (err) { cdlg.querySelectorAll("button, input, select").forEach(x => { x.disabled = false; }); msg.textContent = "The city could not be made: " + ((err && err.message) || err); }
  }
  // an empty campaign: where to begin
  E.startHTML = () => {
    const b = (a, l, s) => `<button type="button" class="enc-start" data-enca="${a}"><b>${esc(l)}</b><span>${esc(s)}</span></button>`;
    return `<section class="enc-empty"><h2>An empty campaign</h2><p>Make it a piece at a time. Nothing is invented for it: Claude helps only when you ask, and shows what it suggests before anything changes.</p>
      <div class="enc-grid">${A.knowledge ? b("story", "Its story", "As much or as little as you have, or a whole document") : ""}${A.locations ? b("place", "A place", "A name is enough; build its inside after") : ""}${A.people && mod("people.editor") ? b("person", "A person", "A name is enough; the rest when you know it") : ""}${mod("handouts") && A.handoutWriter ? b("handout", "A handout", "A letter, a newspaper, a police report…") : ""}${mod("plot") && A.plot ? b("plot", "A plot point", "What sets it off, what happens, what follows") : ""}${mod("investigation.mysteries") && A.plot ? b("mystery", "A mystery", "Its truth, suspects, clues and endings") : ""}${canCity() ? b("city", "A city", "Invented for its age, or a real one with its real streets, in 3D") : ""}</div>
      <p class="kn">${canCity() ? "A world map or a star chart are made with the Atlas tool (atlas.js world and galaxy)" : "A city, a world map or a star chart are made with the Atlas tool (in the Atlas app, or atlas.js city, world and galaxy)"}; places of your own can be made without one.</p></section>`;
  };
  E.paint = () => { const el = document.getElementById("encyc"); if (el) el.innerHTML = html(); };
  document.addEventListener("click", e => {
    const t = e.target; if (!t.closest) return;
    const sum = t.closest(".enc-sec > summary"); if (sum) { const d = sum.parentElement; setTimeout(() => { E.open = d.open ? d.dataset.enc : null; }, 0); return; }
    const a = t.closest("[data-enca]"); if (a) { e.preventDefault(); const f = ACTS[a.dataset.enca]; if (f) f(a.dataset.k); return; }
    const p = t.closest("[data-encp]"); if (p && A.people) { A.people.open(p.dataset.encp); return; }
    const c = t.closest("[data-encc]"); if (c) { toTable("clues"); if (A.clueUI) A.clueUI.open(c.dataset.encc); return; }
    const h = t.closest("[data-ench]"); if (h && A.handoutWriter) { A.handoutWriter.open(h.dataset.ench); return; }
    const i = t.closest("[data-enci]"); if (i) { const k = i.dataset.k; if (A.plot && ["plot", "mystery", "quest"].includes(k)) A.plot.edit(i.dataset.enci); else { toTable("clues"); if (A.clueUI) A.clueUI.open("item:" + i.dataset.enci); } }
  });
  for (const ev of ["atlas-places", "atlas-story", "atlas-context"]) document.addEventListener(ev, () => setTimeout(E.paint, 0));
  if (A.modules && A.modules.watch) A.modules.watch(() => E.paint());
})(typeof ATLAS !== "undefined" ? ATLAS : {});
