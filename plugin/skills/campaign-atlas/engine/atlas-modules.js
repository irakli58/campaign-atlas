/* Campaign Atlas: what a campaign uses (the user's request of 3 Nov 2026, "Modular features & customizable DM
   experience"; the plan approved with their answers in the workspace's reviews/2026-11-03-modules.md). Eighteen (Dimensions and planes added with the dimensions plan)
   modules, each with its levels; presets; a game master's own presets. (Since 11 Nov 2026 a module may have parts, each
   switched on and off on its own inside it, "investigation.clues" and so on: the user asked for clues, the board,
   mysteries, knowledge, relationships, events, factions, traps, encounters each to be "independently configurable", and
   for handouts, plot points, survival and Claude's help as modules of their own.) The core is never switched off: the gazetteer
   and its maps, saving, search, help, Tonight, the clocks, the party, and safety (lines and veils, the X-card: the user
   chose that safety is always on).
   - Where a campaign's choice lives: campaign.js ATLAS.campaign({ features: { preset: "detective" } } or features:
     { world: "look", ... }), which the build reads (a module off is left out of the page); and the page's database
     (collection "features", doc "now"), so a change on the page is at once.
   - A campaign that has never chosen keeps everything it had: every module at its highest level ("As before").
   - Off means off: its tabs, tools, views and buttons are not drawn (A.modules.on(), and html[data-m-<id>] for the
     page's own CSS), and its background work does not start. Switching off never deletes anything; switching back on
     picks up where it was. */
(function (A) {
  "use strict";
  if (!A || A.modules) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---- the modules: [key, label] for each level, the lowest first; the first is always off */
  const MODULES = [
    { id: "world", group: "world", name: "World map", say: "The land between your places: coasts, mountains, roads and realms; its editor", levels: [["off", "Off"], ["look", "To look at"], ["edit", "To edit"]] },
    { id: "cities", group: "world", name: "Cities in 3D", say: "The city in 3D, people in its streets, places of your own; the city editor", levels: [["off", "Off"], ["look", "To look at"], ["edit", "To edit"]] },
    // (furnishing is part of making a place, a cave or a house: it comes with the editor, never as a level of its own;
    // the user, 3 Nov 2026)
    { id: "mapedit", group: "world", name: "Map editor, 3D rooms and furnishing", say: "Redrawing a place's maps, rooms in 3D, furnishing caves, houses and rooms from the model library", levels: [["off", "Off"], ["on", "On"]] },
    { id: "caves", group: "world", name: "Caves, riddles, traps", say: "Generated caves, their riddles and traps, the fog over them", levels: [["off", "Off"], ["on", "On"]], parts: [["traps", "Traps and riddles, in caves and on every map"]] },
    { id: "stars", group: "world", name: "The stars", say: "The star chart, systems, the ship and its fuel, the players' charts", levels: [["off", "Off"], ["on", "On"]] },
    // (the approved dimensions plan, 3 Nov 2026: an 18th module)
    { id: "dimensions", group: "world", name: "Dimensions and planes", say: "The planes beyond the world: their layers and maps, the ways between, where the sources disagree", levels: [["off", "Off"], ["on", "On"]] },
    { id: "investigation", group: "story", name: "Investigation", say: "Clues found and the board; then connections, who knows what, Auto-Connect", levels: [["off", "Off"], ["basic", "Basic"], ["advanced", "Advanced"]], parts: [["clues", "Clues and evidence"], ["board", "The investigation board"], ["mysteries", "Mysteries: their truth, suspects, false leads, conclusions"], ["autoconnect", "Auto-Connect: Claude's suggested connections"]] },
    { id: "people", group: "story", name: "People", say: "Who is where; then their days, what they know and remember", levels: [["off", "Notes only"], ["basic", "Basic"], ["advanced", "Advanced"]], parts: [["editor", "People made and changed by hand"], ["portraits", "Portraits drawn from a description"], ["knowledge", "What each person knows, believes and hides"], ["relations", "Relationships: ties and the web"]] },
    // (the handmade campaigns of 11 Nov 2026: written on the page, each a switch of its own)
    { id: "handouts", group: "story", name: "Handouts", say: "Letters, newspapers, telegrams, reports: written on the page, given to the players, printed", levels: [["off", "Off"], ["on", "On"]] },
    { id: "plot", group: "story", name: "Plot points and story arcs", say: "Plot points with their triggers, consequences and branches; quests and objectives", levels: [["off", "Off"], ["on", "On"]], parts: [["quests", "Quests and objectives"]] },
    { id: "ai", group: "story", name: "Claude's help", say: "Suggestions anywhere on the page, only when asked: writing, ideas, Auto-Connect. Off: nothing on the page asks Claude", levels: [["off", "Off"], ["on", "On"]] },
    { id: "copilot", group: "story", name: "Copilot", say: "Talk, Improvise and Ask the campaign; then reminders while you play", levels: [["off", "Off"], ["asked", "When asked"], ["unasked", "Also unasked"]] },
    { id: "consistency", group: "story", name: "Consistency check", say: "Finds what contradicts what in the campaign", levels: [["off", "Off"], ["on", "On"]] },
    { id: "fights", group: "table", name: "Fights and dice", say: "Initiative, wounds, sanity, dice, stat blocks", levels: [["off", "Off"], ["on", "On"]] },
    { id: "makeup", group: "table", name: "Make it up", say: "A person or a place on the spot, random tables, small happenings", levels: [["off", "Off"], ["on", "On"]], parts: [["encounters", "Random encounters on journeys and jumps"]] },
    { id: "survival", group: "table", name: "Survival", say: "Food and supplies on a journey, the days they last; a world's cold, heat and air as dangers", levels: [["off", "Off"], ["on", "On"]] },
    { id: "recorded", group: "table", name: "Recorded sessions", say: "Recording the table, the words, what the table remembers", levels: [["off", "Off"], ["words", "The words"], ["sound", "The words and the sound"]] },
    { id: "print", group: "table", name: "Print and export", say: "The book, handouts on paper, maps for online tables", levels: [["off", "Off"], ["on", "On"]] },
    { id: "living", group: "living", name: "The living world", parts: [["events", "Events of the world's time"], ["rumours", "Rumours and the week's paper"], ["factions", "Factions and politics"]], say: "The world's time, events, news and history; then factions, consequences and the dashboard", levels: [["off", "Off: a still world"], ["basic", "Basic"], ["advanced", "Advanced"]] },
    { id: "money", group: "living", name: "Money and goods", say: "Purses, the party's stash, loot; then merchants and prices that move", levels: [["off", "Off"], ["simple", "Simple"], ["full", "Full"]] },
    { id: "players", group: "players", name: "The players' side", say: "The players' screen, fog and handouts; then their own copy, phones and journal", levels: [["off", "Off"], ["screen", "The screen"], ["copy", "The screen and their own copy"]], parts: [["private", "Something for one player only, on their own phone"]] },
    { id: "music", group: "sound", name: "Music and voice", say: "Music for every place and songs, recorded music from the music packs; then the narrator, with the AI voices where they are installed", levels: [["off", "Off"], ["music", "Music"], ["voice", "Music and narration"]] },
    // (the user's audio request of 11 Nov 2026, and "remember everything has to be modular": the soundboard is its own)
    { id: "sounds", group: "sound", name: "Sounds", say: "Real recordings at the table: ambiences, sounds to play once, scenes; your own sound files", levels: [["off", "Off"], ["on", "On"]] }
  ];
  const GROUPS = [["world", "The world"], ["story", "The story"], ["table", "At the table"], ["living", "The living world"], ["players", "The players"], ["sound", "Sound"]];
  const BY = {}; MODULES.forEach(m => { BY[m.id] = m; });
  // the presets as the user approved them (3 Nov 2026), and Science fiction, added for their "dont forget scifi too"
  const P = (world, cities, mapedit, caves, stars, investigation, people, living, money, copilot, consistency, recorded, fights, makeup, players, music, print) => ({ world, cities, mapedit, caves, stars, investigation, people, living, money, copilot, consistency, recorded, fights, makeup, players, music, print });
  const PRESETS = {
    minimal: ["Minimal", P("look", "look", "off", "off", "off", "off", "off", "off", "off", "off", "off", "off", "off", "off", "screen", "music", "on")],
    detective: ["Detective", P("off", "look", "on", "off", "off", "advanced", "advanced", "basic", "off", "asked", "on", "words", "off", "on", "screen", "music", "on")],
    sandbox: ["Sandbox world", P("edit", "edit", "on", "on", "off", "basic", "basic", "advanced", "full", "asked", "off", "off", "on", "on", "copy", "music", "on")],
    fantasy: ["Traditional fantasy", P("look", "look", "on", "on", "off", "basic", "basic", "basic", "simple", "asked", "off", "off", "on", "on", "screen", "music", "on")],
    scifi: ["Science fiction", P("look", "look", "on", "off", "on", "basic", "basic", "basic", "simple", "asked", "off", "off", "on", "on", "screen", "music", "on")],
    // (Everything: the stars as the setting has them)
    everything: ["Everything", P("edit", "edit", "on", "on", "setting", "advanced", "advanced", "advanced", "full", "unasked", "on", "words", "on", "on", "copy", "voice", "on")]
  };
  // (Dimensions and planes, the 18th: off where the plan says, on for fantasy and Everything; a sandbox has them when the
  // campaign has a cosmos)
  Object.entries({ minimal: "off", detective: "off", sandbox: "setting", fantasy: "on", scifi: "off", everything: "on" }).forEach(([k, v]) => { PRESETS[k][1].dimensions = v; });
  // (Sounds and Writing the story by hand, added 11 Nov 2026: on in every preset but Minimal, which keeps to the music)
  Object.keys(PRESETS).forEach(k => { PRESETS[k][1].sounds = k === "minimal" ? "off" : "on"; });
  // (Handouts, plot points, survival and Claude's help, 11 Nov 2026: by what each kind of campaign is)
  Object.entries({ minimal: ["off", "off", "off", "on"], detective: ["on", "on", "off", "on"], sandbox: ["on", "on", "on", "on"], fantasy: ["on", "on", "on", "on"], scifi: ["on", "on", "on", "on"], everything: ["on", "on", "on", "on"] }).forEach(([k, [h, p, s, ai]]) => Object.assign(PRESETS[k][1], { handouts: h, plot: p, survival: s, ai }));
  // (and the parts each preset leaves off: a detective story has no random encounters; a sandbox no mysteries to solve)
  const PRESET_PARTS = { detective: { "makeup.encounters": "off" }, sandbox: { "investigation.mysteries": "off" }, scifi: { "investigation.mysteries": "off" } };
  Object.entries(PRESET_PARTS).forEach(([k, o]) => Object.assign(PRESETS[k][1], o));
  // what leans on what: [module, from level, needs module, at least, what happens without it]
  const NEEDS = [
    ["copilot", "unasked", "recorded", "words", "Reminders while you play come from what is recorded. With Recorded sessions off, the copilot can still be asked."],
    ["money", "full", "living", "basic", "Prices that move with events need the world's time. With the living world off, prices stay as they are."],
    ["cities", "look", "world", "look", "With the world map off, cities open from the gazetteer only."],
    ["world", "look", "cities", "look", "With Cities in 3D off, the world map shows towns without entering them."],
    ["investigation", "advanced", "people", "basic", "Who knows what needs People. With People at Notes only, the investigation keeps its clues and connections."]
  ];

  /* ---- the choice now: the page's database over campaign.js; a campaign that never chose has everything as before */
  const rank = (id, key) => { const m = BY[id]; if (!m) return 0; const i = m.levels.findIndex(l => l[0] === key); return i < 0 ? m.levels.length - 1 : i; };
  const top = id => BY[id].levels[BY[id].levels.length - 1][0];
  const hasStars = () => !!A.galaxyParams, hasPlanes = () => !!(A.cosmosData && (A.cosmosData.dimensions || []).length);
  const PARTS = []; MODULES.forEach(m => (m.parts || []).forEach(([p]) => PARTS.push(m.id + "." + p)));
  function fromPreset(pid) { const p = PRESETS[pid]; if (!p) return null; const out = {}; for (const k of PARTS) if (p[1][k] === "off") out[k] = "off"; for (const m of MODULES) { let v = p[1][m.id]; if (v === "setting") v = (m.id === "dimensions" ? hasPlanes() : hasStars()) ? "on" : "off"; out[m.id] = v; } return out; }
  let STATE = null;   // { preset, levels }
  const fromConfig = () => {
    const f = (A.config && A.config.features) || null; if (!f) return { preset: null, levels: {} };
    const base = f.preset ? fromPreset(f.preset) || {} : {}, levels = Object.assign({}, base);
    for (const m of MODULES) if (typeof f[m.id] === "string" && BY[m.id].levels.some(l => l[0] === f[m.id])) levels[m.id] = f[m.id];
    for (const k of PARTS) if (f[k] === "off" || f[k] === "on") levels[k] = f[k];
    return { preset: f.preset && PRESETS[f.preset] && Object.keys(levels).every(k => levels[k] === base[k]) ? f.preset : null, levels };
  };
  const state = () => STATE || (STATE = fromConfig());
  const level = id => { const v = state().levels[id]; return BY[id] && BY[id].levels.some(l => l[0] === v) ? v : BY[id] ? top(id) : "off"; };
  // on: at least the given level (or anything but off)
  const on = (id, min) => { if (id && id.includes(".")) return part(id); return !BY[id] || rank(id, level(id)) >= (min ? rank(id, min) : 1); };
  // a part: its module on, and the part not switched off
  const part = (id, p) => { const k = p ? id + "." + p : id, m = k.slice(0, k.indexOf(".")); return on(m) && state().levels[k] !== "off"; };
  const W = [];
  let store = null;
  function apply() {
    const de = typeof document !== "undefined" && document.documentElement;
    if (de) { for (const m of MODULES) de.setAttribute("data-m-" + m.id, level(m.id)); for (const k of PARTS) de.setAttribute("data-m-" + k.replace(".", "-"), part(k) ? "on" : "off"); }
    for (const f of W) { try { f(); } catch (e) { console.warn("atlas: a module's change", e); } }
    paintOpen();
  }
  function save(next) {
    STATE = next; apply();
    if (store) store.set("features", "now", { preset: next.preset || null, levels: next.levels, t: Date.now() });
  }
  const set = (id, key) => { if (!BY[id] || !BY[id].levels.some(l => l[0] === key)) return; const s = state(); save({ preset: null, levels: Object.assign({}, fullLevels(), s.levels, { [id]: key }) }); };
  const fullLevels = () => { const o = {}; for (const m of MODULES) o[m.id] = level(m.id); for (const k of PARTS) if (state().levels[k] === "off") o[k] = "off"; return o; };
  const setPart = (k, v) => { if (!PARTS.includes(k)) return; const s = state(), L = Object.assign({}, fullLevels(), s.levels); if (v) delete L[k]; else L[k] = "off"; save({ preset: null, levels: L }); };
  function usePreset(pid) {
    if (pid === "asbefore") { save({ preset: null, levels: {} }); return; }
    const mine = mineList()[pid]; if (mine) { save({ preset: pid, levels: Object.assign({}, mine.levels) }); return; }
    const l = fromPreset(pid); if (l) save({ preset: pid, levels: l });
  }
  // the game master's own presets, kept in this browser for every campaign it opens (the Atlas app serves them all from
  // one place, so there they are shared between campaigns)
  const MINE = "atlas-my-presets";
  const mineList = () => { try { return JSON.parse(localStorage.getItem(MINE) || "{}") || {}; } catch (e) { return {}; } };
  function saveMine(name) { const all = mineList(), id = "my-" + String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40); all[id] = { name: String(name).slice(0, 60), levels: fullLevels() }; try { localStorage.setItem(MINE, JSON.stringify(all)); } catch (e) {} const s = state(); save({ preset: id, levels: Object.assign({}, s.levels, fullLevels()) }); }
  function dropMine(id) { const all = mineList(); delete all[id]; try { localStorage.setItem(MINE, JSON.stringify(all)); } catch (e) {} paintOpen(); }
  // the page's database opened: its choice, if any, is the one (atlas-table-gm.js)
  function connect(st) {
    store = st;
    st.watch("features", docs => { const d = docs && docs.now; if (d && d.levels && typeof d.levels === "object") { STATE = { preset: d.preset || null, levels: d.levels }; apply(); } });
  }
  // the files of a module left out of this page when it was built (campaign.js features): they come back when it is built again
  const missing = () => (A.config && A.config.featuresBuilt && A.config.featuresBuilt.out) || [];

  /* ---- the settings: one panel, on Start here and behind the gear at the top of the page */
  function summary() {
    const s = state(), n = MODULES.filter(m => on(m.id)).length;
    const name = !s.preset && !Object.keys(s.levels).length ? "As before: everything" : s.preset ? (PRESETS[s.preset] ? PRESETS[s.preset][0] : (mineList()[s.preset] || {}).name || "Your own choice") : "Your own choice";
    return { name, n, of: MODULES.length };
  }
  function panelHTML() {
    const s = state(), cur = fullLevels(), mine = mineList(), miss = missing(), su = summary();
    const preBtn = (id, label) => `<button type="button" class="mf-pb" data-mf-pre="${esc(id)}" aria-pressed="${s.preset === id || (id === "asbefore" && !s.preset && !Object.keys(s.levels).length)}">${esc(label)}</button>`;
    let h = `<div class="mf"><p class="mf-lead">Choose what this campaign uses. Switching something off hides it and stops its work; nothing is deleted, and switching it back on picks up where it was. Safety (lines and veils, the X-card) is always on.</p>`;
    h += `<div class="mf-pres"><span class="mf-pl">Presets</span>${preBtn("asbefore", "As before")}${Object.entries(PRESETS).map(([id, [l]]) => preBtn(id, l)).join("")}${Object.entries(mine).map(([id, p]) => `<span class="mf-mine">${preBtn(id, p.name)}<button type="button" class="mf-x" data-mf-drop="${esc(id)}" aria-label="Forget the preset ${esc(p.name)}" title="Forget this preset">×</button></span>`).join("")}${SAVING ? `<span class="mf-name"><input type="text" data-mf-name maxlength="60" placeholder="A name for these choices" aria-label="A name for these choices"><button type="button" class="mf-pb" data-mf-savego>Save</button></span>` : `<button type="button" class="mf-pb mf-save" data-mf-save>Save these as my own…</button>`}</div>`;
    h += `<p class="mf-now">Now: <b>${esc(su.name)}</b> · ${su.n} of ${su.of} in use</p>`;
    for (const [g, gl] of GROUPS) {
      h += `<h4 class="mf-g">${esc(gl)}</h4><div class="mf-list">`;
      for (const m of MODULES.filter(x => x.group === g)) {
        const lv = cur[m.id], warn = NEEDS.filter(([id, from, need, least]) => id === m.id && rank(id, lv) >= rank(id, from) && rank(need, cur[need]) < rank(need, least)).map(x => x[4]);
        const gone = miss.includes(m.id) && on(m.id);
        h += `<div class="mf-row${lv === "off" ? " off" : ""}"><div class="mf-t"><b>${esc(m.name)}</b><span class="mf-say">${esc(m.say)}</span>${warn.map(w => `<span class="mf-warn">${esc(w)}</span>`).join("")}${gone ? `<span class="mf-warn">Left out of this page when it was built: it comes back when the page is built again (in the Atlas app, at once; on claude.ai, by publishing again).</span>` : ""}</div>`;
        h += `<div class="mf-seg" role="radiogroup" aria-label="${esc(m.name)}">${m.levels.map(([k, l]) => `<button type="button" role="radio" aria-checked="${lv === k}" data-mf-set="${m.id}:${k}">${esc(l)}</button>`).join("")}</div>${(m.parts || []).length && lv !== "off" ? `<div class="mf-parts">${m.parts.map(([p, pl]) => `<label class="mf-part"><input type="checkbox" data-mf-part="${m.id}.${p}"${part(m.id, p) ? " checked" : ""}> ${esc(pl)}</label>`).join("")}</div>` : ""}</div>`;
      }
      h += `</div>`;
    }
    return h + `</div>`;
  }
  // the dialog behind the gear (SAVING: the name of a new preset being asked for)
  let DLG = null, SAVING = false;
  function open() {
    if (typeof document === "undefined") return;
    if (!DLG) { DLG = document.createElement("dialog"); DLG.className = "kedlg mf-dlg"; DLG.setAttribute("aria-label", "What this campaign uses"); document.body.appendChild(DLG); }
    DLG.innerHTML = `<div class="ke"><h3>What this campaign uses</h3>${panelHTML()}<div class="ka"><button type="button" class="prim" data-mf-close>Done</button></div></div>`;
    if (!DLG.open) { try { DLG.showModal(); } catch (e) { DLG.setAttribute("open", ""); } }
  }
  function paintOpen() {
    if (typeof document === "undefined") return;
    if (DLG && DLG.open) { const y = DLG.querySelector(".ke") ? DLG.scrollTop : 0; DLG.querySelector(".ke").innerHTML = `<h3>What this campaign uses</h3>${panelHTML()}<div class="ka"><button type="button" class="prim" data-mf-close>Done</button></div>`; DLG.scrollTop = y; }
    for (const el of document.querySelectorAll(".mf-inline")) el.innerHTML = panelHTML();
  }
  if (typeof document !== "undefined") {
    document.addEventListener("click", e => {
      const t = e.target; if (!t || !t.closest) return;
      const pt = t.closest("[data-mf-part]"); if (pt) { setPart(pt.dataset.mfPart, pt.checked); return; }
      const b = t.closest("[data-mf-set],[data-mf-pre],[data-mf-save],[data-mf-savego],[data-mf-drop],[data-mf-close],[data-mf-open]"); if (!b) return;
      if (b.dataset.mfSavego != null) { const i = b.parentNode.querySelector("[data-mf-name]"), n = i && i.value.trim(); SAVING = false; if (n) saveMine(n); else paintOpen(); return; }
      if (b.dataset.mfOpen != null) { open(); return; }
      if (b.dataset.mfClose != null) { if (DLG) DLG.close(); return; }
      if (b.dataset.mfSet) { const [id, k] = b.dataset.mfSet.split(":"); set(id, k); return; }
      if (b.dataset.mfPre) { usePreset(b.dataset.mfPre); return; }
      if (b.dataset.mfDrop) { dropMine(b.dataset.mfDrop); return; }
      if (b.dataset.mfSave != null) { SAVING = true; paintOpen(); const i = document.querySelector(".mf-dlg[open] [data-mf-name], .mf-inline [data-mf-name]"); if (i) i.focus(); }
    });
    document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.matches && e.target.matches("[data-mf-name]")) { e.preventDefault(); const n = e.target.value.trim(); SAVING = false; if (n) saveMine(n); else paintOpen(); } });
    const first = () => apply();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", first); else setTimeout(first, 0);
  }
  A.modules = { LIST: MODULES, GROUPS, PRESETS, NEEDS, PARTS, level, on, part, setPart, set, usePreset, connect, watch: f => W.push(f), panelHTML, open, summary, fromPreset, missing, rank };
})(typeof ATLAS !== "undefined" ? ATLAS : this.ATLAS);
