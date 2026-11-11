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
    if (A.people && mod("people.editor")) h += sec("people", "People", C.people.length, C.people.map(p => it("", `data-encp="${esc(p.id)}"`, p.n, p.role)), btn("person", "+ A person"));
    if (mod("investigation") && mod("investigation.clues")) h += sec("clues", "Clues", C.clues.length, C.clues.map(c => it("", `data-encc="clue:${esc(c.pl)}/${esc(c.id)}"`, c.c.t || c.id, (A.meta[c.pl] || {}).name || "")), btn("clue", "+ A clue"));
    if (mod("handouts") && A.handoutWriter) h += sec("handouts", "Handouts", C.handouts.length, C.handouts.map(x => it("", x.state === "draft" || (A.handbook && A.handbook[x.id]) ? `data-ench="${esc(x.id)}"` : `data-t="hview" data-id="${esc(x.id)}"`, x.title || x.headline || "Untitled", x.state === "draft" ? "draft" : x.place ? (A.meta[x.place] || {}).name || "" : "")), btn("handout", "+ A handout"));
    const kinds = SKIND.filter(([, , m]) => !m || mod(m)), story = C.items.filter(x => kinds.some(k => k[0] === x.kind));
    if (A.story && (mod("investigation") || mod("plot"))) h += sec("story", "Story", story.length, story.map(x => it("", `data-enci="${esc(x.id)}" data-k="${esc(x.kind)}"`, x.n || "Untitled", (SKIND.find(k => k[0] === x.kind) || [0, 0, 0, ""])[3])), [mod("plot") && A.plot ? btn("plot", "+ A plot point") : "", mod("investigation.mysteries") && A.plot ? btn("mystery", "+ A mystery") : "", mod("plot.quests") && A.plot ? btn("quest", "+ A quest") : "", mod("investigation") ? btn("item", "+ A faction, an event, a thing, a secret", "faction") : ""].join(""));
    h += `<div class="enc-new enc-places">${A.locations ? btn("place", "+ A place") : ""}</div>`;
    return h;
  }
  // an empty campaign: where to begin
  E.startHTML = () => {
    const b = (a, l, s) => `<button type="button" class="enc-start" data-enca="${a}"><b>${esc(l)}</b><span>${esc(s)}</span></button>`;
    return `<section class="enc-empty"><h2>An empty campaign</h2><p>Make it a piece at a time. Nothing is invented for it: Claude helps only when you ask, and shows what it suggests before anything changes.</p>
      <div class="enc-grid">${A.knowledge ? b("story", "Its story", "As much or as little as you have, or a whole document") : ""}${A.locations ? b("place", "A place", "A name is enough; build its inside after") : ""}${A.people && mod("people.editor") ? b("person", "A person", "A name is enough; the rest when you know it") : ""}${mod("handouts") && A.handoutWriter ? b("handout", "A handout", "A letter, a newspaper, a police report…") : ""}${mod("plot") && A.plot ? b("plot", "A plot point", "What sets it off, what happens, what follows") : ""}${mod("investigation.mysteries") && A.plot ? b("mystery", "A mystery", "Its truth, suspects, clues and endings") : ""}</div>
      <p class="kn">A city, a world map or a star chart are made with the Atlas tool (in the Atlas app, or atlas.js city, world and galaxy); places of your own can be made without one.</p></section>`;
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
