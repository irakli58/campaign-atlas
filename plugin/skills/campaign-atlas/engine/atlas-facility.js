/* A facility's systems (the user's master plan, 26 Oct 2026, part 13: in a station, a ship, a laboratory, a colony or a
   mine, track power, oxygen, pressure, temperature, contamination, security, structural integrity, communications and
   the emergency systems, for exploration and survival rather than fights). A place says which it has (facility: {
   power: "ok", oxygen: "strained" } on the place, or facility: true for all nine); its page shows each to the game
   master, who changes them as the story does, or sets one to worsen in so many hours of the world's time: when the hour
   comes it drops a level and the game master is told. An event can change one (an effect { place, system, to }), and
   taking the event back puts it back. The players can be shown the status board on their screen. Kept in the table's
   store (collection "facility"). */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !TU.dossierExtra) return;
  const api = TU.api, esc = A.esc, S = () => api.store();
  const SYS = [["power", "Power"], ["oxygen", "Oxygen"], ["pressure", "Pressure"], ["temperature", "Temperature"], ["contamination", "Contamination"], ["security", "Security"], ["structure", "Structure"], ["comms", "Communications"], ["emergency", "Emergency systems"]];
  const LV = ["ok", "strained", "failing", "down"];
  // each system's own words for its four levels
  const WORDS = { power: ["Running", "Brownouts", "Failing", "Dead"], oxygen: ["Breathable", "Thin", "Failing", "Gone"], pressure: ["Holding", "Leaking", "Falling", "Vacuum"], temperature: ["Normal", "Uncomfortable", "Dangerous", "Lethal"], contamination: ["Clean", "Traces", "Spreading", "Overrun"], security: ["Secure", "Patchy", "Breached", "Gone"], structure: ["Sound", "Stressed", "Failing", "Breaking up"], comms: ["Clear", "Static", "Intermittent", "Silent"], emergency: ["Ready", "Partial", "Failing", "Offline"] };
  const word = (k, lv) => (WORDS[k] || ["Working", "Strained", "Failing", "Down"])[Math.max(0, LV.indexOf(lv))];
  const sysOf = id => { const f = (A.meta[id] || {}).facility; if (!f) return null; return f === true ? Object.fromEntries(SYS.map(([k]) => [k, "ok"])) : f; };
  const stOf = id => (S() && S().get("facility", id)) || {};
  const now = () => A.worldTime ? A.worldTime.now() : 0, when = () => A.worldTime ? A.worldTime.at(now()).short : new Date().toLocaleTimeString();
  const levelOf = (id, k) => ((stOf(id).sys || {})[k] || {}).lv || (sysOf(id) || {})[k] || "ok";
  function set(id, k, patch, what) {
    const s = Object.assign({}, stOf(id)), sys = Object.assign({}, s.sys || {}); sys[k] = Object.assign({}, sys[k] || {}, patch); s.sys = sys;
    if (what) s.log = (s.log || []).concat({ when: when(), what }).slice(-40); S().set("facility", id, s);
  }
  const html = p => {
    const def = sysOf(p.id); if (!def) return "";
    const s = stOf(p.id), keys = SYS.filter(([k]) => k in def);
    return `<section class="sec keeper t-fac"><h3>The facility's systems</h3><p class="kn">As they stand now. Change them as the story does, or let one worsen with the world's time; show the players the board when they can see it.</p>
      <div class="fac-grid">${keys.map(([k, l]) => { const lv = levelOf(p.id, k), x = (s.sys || {})[k] || {}; return `<div class="fac-sys fac-${lv}"><div class="fac-h"><b>${esc(l)}</b><span class="fac-lv">${esc(word(k, lv))}</span></div>
        <div class="t-row"><select class="t-in" data-fac="lv" data-id="${esc(p.id)}" data-k="${k}" aria-label="${esc(l)}">${LV.map(v => `<option value="${v}"${v === lv ? " selected" : ""}>${esc(word(k, v))}</option>`).join("")}</select>${x.until ? `<span class="kn">worse at ${esc(A.worldTime ? A.worldTime.at(x.until).short : "")}</span> <button type="button" class="t-link" data-fac="stop" data-id="${esc(p.id)}" data-k="${k}">stop it</button>` : lv !== "down" ? `<label class="kn">worse in <input class="t-in t-n" type="number" min="1" max="999" data-fac="in" data-id="${esc(p.id)}" data-k="${k}" placeholder="h"> hours</label>` : ""}</div></div>`; }).join("")}</div>
      <div class="t-row"><button type="button" class="t-mini" data-fac="show" data-id="${esc(p.id)}">Show the players the status board</button>${(s.log || []).length ? `<details class="fa-more"><summary>What has changed (${s.log.length})</summary><ol class="tw-hist" reversed>${s.log.slice().reverse().map(l => `<li><span class="kn">${esc(l.when)}</span> ${esc(l.what)}</li>`).join("")}</ol></details>` : ""}</div></section>`;
  };
  // on each place's page, after what was there before
  const before = TU.dossierExtra; TU.dossierExtra = p => before(p) + html(p);

  // the world's time worsens what was set to worsen
  function tick() {
    const st = S(); if (!st) return; const t = now();
    for (const [id, s] of Object.entries(st.get("facility") || {})) for (const [k, x] of Object.entries((s && s.sys) || {})) if (x && x.until && t >= x.until) {
      const lv = LV[Math.min(3, LV.indexOf(levelOf(id, k)) + 1)], name = (SYS.find(y => y[0] === k) || [0, k])[1];
      set(id, k, { lv, until: null }, `${name}: ${word(k, lv).toLowerCase()}`); api.note(`${(A.meta[id] || {}).name || id}: ${name.toLowerCase()} is now ${word(k, lv).toLowerCase()}.`);
    }
  }
  const repaint = () => { if (A.refreshPlace) A.refreshPlace(); else document.dispatchEvent(new CustomEvent("atlas-story")); };
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.fac) return; const id = t.dataset.id, k = t.dataset.k, name = (SYS.find(y => y[0] === k) || [0, k])[1];
    if (t.dataset.fac === "lv") set(id, k, { lv: t.value, until: null }, `${name}: ${word(k, t.value).toLowerCase()}`);
    if (t.dataset.fac === "in" && +t.value > 0) set(id, k, { until: now() + Math.round(+t.value * 60) }, `${name} will worsen in ${t.value} hours`);
    t.blur(); repaint();
  });
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-fac]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return; const id = b.dataset.id, k = b.dataset.k;
    if (b.dataset.fac === "stop") { set(id, k, { until: null }, `${(SYS.find(y => y[0] === k) || [0, k])[1]} holds`); repaint(); }
    if (b.dataset.fac === "show") { const def = sysOf(id) || {}; api.show({ kind: "scene", title: `${(A.meta[id] || {}).name || id}: status`, text: SYS.filter(([x]) => x in def).map(([x, l]) => `${l}: ${word(x, levelOf(id, x))}`).join("\n") }); api.note("The status board is on the players' screen."); }
  });

  // an event's change to a system (atlas-worldtime.js effects; done and undone with the event, as the factions' are)
  if (A.worldEffects) {
    const apply0 = A.worldEffects.apply, say0 = A.worldEffects.say;
    A.worldEffects.apply = (e, w) => {
      const undo = apply0(e, w), st = S();
      for (const x of e.effects || []) if (x.place && x.system && sysOf(x.place) && LV.includes(x.to)) { if (!undo.some(u => u.coll === "facility" && u.id === x.place)) undo.push({ coll: "facility", id: x.place, before: st.get("facility", x.place) || null }); set(x.place, x.system, { lv: x.to, until: null }, `${(SYS.find(y => y[0] === x.system) || [0, x.system])[1]}: ${word(x.system, x.to).toLowerCase()}${e.title ? " (" + e.title + ")" : ""}`); }
      return undo;
    };
    A.worldEffects.say = x => x.place && x.system ? `${(A.meta[x.place] || {}).name || x.place}: ${(SYS.find(y => y[0] === x.system) || [0, x.system])[1].toLowerCase()} ${word(x.system, x.to).toLowerCase()}` : say0(x);
  }
  const boot = setInterval(() => { const st = S(); if (!st) return; clearInterval(boot); st.watch("clock", tick); st.watch("facility", () => { if (document.querySelector(".t-fac")) repaint(); }); }, 250); setTimeout(() => clearInterval(boot), 120000);
  A.facility = { SYS, LV, WORDS, levelOf, sysOf };
})(ATLAS);
