/* The galaxy on the page (the user's master plan, 26 Oct 2026, parts 11 and 12): the star chart of the whole, grown from
   the campaign's seed (atlas-galaxy-gen.js), with its sectors, the powers' territories, the lanes, the charted,
   dangerous and restricted regions; a system opened to its star, worlds, belts and what people put there, and a world to
   all it is (its air, warmth, water, life, dangers, whether anyone can land, and the campaign's places on it); the
   party's ship with its fuel, reach and condition, a course plotted hop by hop with the fuel, the days, the dangers and
   the places to refuel, made only when it can be and moving the world's time on; the charts the party has (what is
   charted, visited, rumoured, kept from them), changed by the game master as they explore, scan, buy or are told; and
   the game master's own changes (names, notes, systems moved, added, taken away). Kept in the table's store
   (collections "charts", "ship", "gedits"). The players see only what is charted, drawn from what the game master's page
   sends (A.galaxyDraw, the "galaxy" document of the share): never the seed, so nothing uncharted can be worked out. */
(function (A) {
  "use strict";
  const esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const PCOL = ["#d77580", "#7fb3e6", "#8fd19e", "#e0c26a", "#b89be6", "#6fd3c9", "#e6a07f", "#b7c0ca"];
  const STATE = [["unknown", "Not on their charts"], ["rumoured", "Rumoured"], ["charted", "Charted"], ["visited", "Visited"], ["hidden", "Kept from them"]];
  const HOW = [["", "—"], ["explored", "Explored"], ["scanned", "Scanned"], ["bought", "Bought the charts"], ["recovered", "Recovered navigation data"], ["told", "Someone told them"], ["story", "The story gave it"]];
  const FUEL = [["off", "No fuel to count", 0], ["easy", "Easy", .5], ["normal", "Normal", 1], ["hard", "Hard", 1.6]];
  const COND = ["Sound", "Worn", "Damaged", "Crippled"];

  /* ---- the players' drawing: only what the game master's page sent (charted systems, their lanes, the ship) */
  A.galaxyDraw = function (d, o) {
    if (!d || !(d.systems || []).length) return `<div class="gx-empty">No star charts yet.</div>`;
    const S = d.systems, by = {}; for (const s of S) by[s.id] = s;
    const xs = S.map(s => s.x), ys = S.map(s => s.y), pad = 40, x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(160, Math.max(...xs) - x0 + pad), h = Math.max(120, Math.max(...ys) - y0 + pad);
    return `<svg class="gx-svg gx-players" viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="${esc(d.name || "The star chart")}"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" class="gx-bg"/>
      ${(d.regions || []).map(g => `<circle cx="${g.x}" cy="${g.y}" r="${g.r}" class="gx-reg gx-${esc(g.kind)}"><title>${esc(g.name || "")}</title></circle>`).join("")}
      ${(d.lanes || []).map(([a, b]) => by[a] && by[b] ? `<line x1="${by[a].x}" y1="${by[a].y}" x2="${by[b].x}" y2="${by[b].y}" class="gx-lane"/>` : "").join("")}
      ${S.map(s => `<g class="gx-sys${s.state === "visited" ? " v" : ""}"><circle cx="${s.x}" cy="${s.y}" r="${s.state === "rumoured" ? 2.4 : 3.6}" fill="${s.state === "rumoured" ? "none" : esc(s.color || "#fff")}" stroke="${esc(s.color || "#fff")}"/><text x="${s.x + 6}" y="${s.y + 3}" style="font-size:${Math.max(7, w / 70)}px">${esc(s.name)}</text></g>`).join("")}
      ${d.ship && by[d.ship] ? `<g class="gx-ship"><circle cx="${by[d.ship].x}" cy="${by[d.ship].y}" r="${Math.max(6, w / 60)}"/></g>` : ""}</svg>`;
  };

  const Gg = A.galaxyGen; if (!Gg) return;
  // the galaxy as grown, with the council's names and the game master's changes lain over it
  function G() {
    if (A._galaxy) return A._galaxy;
    const g = Gg.grow(A.galaxyParams || {}), over = A.galaxyOver || {};
    g.byId = {}; for (const s of g.systems) g.byId[s.id] = s;
    for (const [id, o] of Object.entries(over.systems || {})) { const s = g.byId[id]; if (s) { Object.assign(s, o.name ? { name: o.name } : {}, o.cls ? { cls: o.cls } : {}); s.desc = o.desc || ""; s.gm = o.gm || ""; s.f = Object.assign({}, s.f, o.flags || {}); if (o.state) s.state0 = o.state; } }
    if (over.home && g.byId[over.home]) g.home = g.byId[over.home].i;
    // the council's factions hold their systems (and replace the powers the seed grew)
    const terr = Object.entries(over.territories || {}).concat(Object.entries(A.factionsData || {}).filter(([, f]) => (f.systems || []).length).map(([id, f]) => [id, f.systems]));
    if (terr.length) { g.powers = terr.map(([id], k) => ({ id, name: ((A.factionsData || {})[id] || {}).n || id, capital: null })); for (const s of g.systems) delete s.pw; terr.forEach(([, ids], k) => { for (const sid of [].concat(ids || [])) if (g.byId[sid]) g.byId[sid].pw = k; }); }
    // the changes the campaign keeps (galaxyEdit({ edits }), given back by "Copy the changes"), then the page's own
    applyEdits(g, Object.assign({}, over.edits || {}, edits()));
    A._galaxy = g; return g;
  }
  A.galaxyApi = { G, reset: () => { A._galaxy = null; } };

  /* ---- the game master's changes (27 Oct 2026, the world builder: the galaxy, its systems and worlds edited), lain
          over the grown galaxy so that courses, lanes, sectors and territories follow them. Kept in the store's
          "gedits": a document for each system changed or added ({ name, cls, x, y, f, desc, gm, gone, added, bodies }),
          and "~lanes" ({ add: [[a, b, kind, ly]], cut: [[a, b]] }), "~regions", "~sectors", "~powers" ({ add: [...],
          edit: { id: {...} } }) and "~terr" ({ S12: power id }) */
  const lk = (a, b) => Math.min(a, b) + "-" + Math.max(a, b);
  function applyEdits(g, E) {
    const N0 = g.systems.length;
    for (const [id, e] of Object.entries(E)) {
      if (!e || id[0] === "~") continue;
      let s = g.byId[id];
      if (!s && e.added && Number.isFinite(+e.x) && Number.isFinite(+e.y)) { s = { i: g.systems.length, id, x: +e.x, y: +e.y, cls: "G", bin: false, name: "A new system", f: {}, added: true }; g.systems.push(s); g.byId[id] = s; }
      if (!s) continue;
      if (e.name) s.name = e.name; if (e.cls && Gg.STARS[e.cls]) s.cls = e.cls; if (Number.isFinite(+e.x) && e.x != null) { s.x = +e.x; s.y = +e.y; }
      if (e.f) s.f = Object.assign({}, s.f, e.f); if (e.bin != null) s.bin = !!e.bin; if (e.desc != null) s.desc = e.desc; if (e.gm != null) s.gm = e.gm; if (e.gone) s.gone = true; if (e.bodies) s.bodies = e.bodies;
    }
    g.N = g.systems.length;
    // the lanes: a system added joins its two nearest; the game master's own lanes, trade routes and corridors, and cuts
    const L = new Map(g.lanes.map(([a, b]) => [lk(a, b), [a, b]])), live = g.systems.filter(s => !s.gone);
    for (const s of g.systems.slice(N0)) if (!s.gone) for (const t of live.filter(t => t !== s).sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y)).slice(0, 2)) L.set(lk(s.i, t.i), [Math.min(s.i, t.i), Math.max(s.i, t.i)]);
    const LE = E["~lanes"] || {}; g.laneKind = new Map(); g.laneLy = new Map();
    for (const [a, b] of LE.cut || []) { const i = g.byId[a], j = g.byId[b]; if (i && j) L.delete(lk(i.i, j.i)); }
    for (const [a, b, kind, ly] of LE.add || []) { const i = g.byId[a], j = g.byId[b]; if (!i || !j || i === j) continue; const k = lk(i.i, j.i); L.set(k, [Math.min(i.i, j.i), Math.max(i.i, j.i)]); if (kind && kind !== "lane") g.laneKind.set(k, kind); if (+ly > 0) g.laneLy.set(k, +ly); }
    g.lanes = [...L.values()].filter(([a, b]) => !g.systems[a].gone && !g.systems[b].gone);
    g.adj = g.systems.map(() => []); for (const [a, b] of g.lanes) { g.adj[a].push(b); g.adj[b].push(a); }
    delete g._laneSet; delete g._grid;
    // regions, sectors, powers: renamed, moved, taken away, and the game master's own
    const ed = (list, key, pre) => { const X = E[key] || {}; list.forEach((x, k) => { x.id = x.id || pre + k; const o = (X.edit || {})[x.id]; if (o) Object.assign(x, o); }); for (const a of X.add || []) if (a && a.id) list.push(Object.assign({}, a, (X.edit || {})[a.id] || {}, { own: true })); return list.filter(x => !x.gone); };
    g.regions = ed(g.regions, "~regions", "r");
    // (a sector added, moved or taken away: every system belongs again to the nearest centre)
    const SX = E["~sectors"] || {}; g.sectors = ed(g.sectors, "~sectors", "sec");
    if ((SX.add || []).length || Object.values(SX.edit || {}).some(o => o && (o.x != null || o.gone)) || N0 !== g.N) for (const s of g.systems) { let b = -1, bd = Infinity; g.sectors.forEach((c, k) => { const d = (c.x - s.x) ** 2 + (c.y - s.y) ** 2; if (d < bd) { bd = d; b = k; } }); s.sec = b >= 0 ? b : null; }
    const pid = g.powers.map(p => p.id);
    g.powers = ed(g.powers, "~powers", "p");
    // (a power taken away lets go of its systems; the others keep theirs under their new places in the list)
    const remap = {}; pid.forEach((id, k) => { remap[k] = g.powers.findIndex(p => p.id === id); });
    for (const s of g.systems) if (s.pw != null) { s.pw = remap[s.pw]; if (s.pw < 0) delete s.pw; }
    const T = E["~terr"] || {};
    for (const [sid, pw] of Object.entries(T)) {
      const s = g.byId[sid]; if (!s) continue;
      if (!pw) { delete s.pw; continue; }
      let k = g.powers.findIndex(p => p.id === pw);
      if (k < 0 && (A.factionsData || {})[pw]) { g.powers.push({ id: pw, name: A.factionsData[pw].n || pw, capital: null }); k = g.powers.length - 1; }
      if (k >= 0) s.pw = k;
    }
  }

  /* ---- the table's store: charts, the ship, the game master's changes */
  let ST = null; const S = () => ST || (A.tableUI && A.tableUI.api.store());
  const edits = () => (S() && S().get("gedits")) || {};
  // a system as it stands now (the game master's changes are already in the galaxy: applyEdits)
  const sys = i => G().systems[i] || null;
  const allSys = () => G().systems.filter(s => !s.gone);
  const findSys = id => { const s = G().byId[id]; return s && !s.gone ? s : null; };
  const chartOf = id => { const c = (S() && S().get("charts", id)) || null, s = findSys(id); if (c && c.state) return c.state; if (s && s.state0) return s.state0; if (s && G().regions.some(g => g.kind === "explored" && Math.hypot(g.x - s.x, g.y - s.y) <= g.r)) return "charted"; return "unknown"; };
  const known = st => st === "charted" || st === "visited" || st === "rumoured";
  const defShip = () => Object.assign({ name: "The ship", cap: 40, burn: 1, range: 12, speed: 3, cargo: 0, cargoCap: 100, crew: "", equipment: [], upgrades: [], condition: "Sound" }, (A.galaxyOver || {}).ship || {});
  const ship = () => { const s = (S() && S().get("ship", "now")) || {}, d = defShip(), g = G(); return Object.assign({}, d, { at: g.systems[g.home].id, fuel: d.fuel != null ? d.fuel : d.cap }, s); };
  const fuelRule = () => { const k = (S() && (S().get("ship", "rule") || {}).fuel) || (A.galaxyOver || {}).fuel || "normal"; return FUEL.find(f => f[0] === k) || FUEL[2]; };
  const idx = id => { const s = findSys(id); return s ? s.i : -1; };
  const ly = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * G().ly;

  /* ---- a course: hop by hop within the ship's reach, with fuel, days, dangers and the places to refuel */
  function course(fromId, toId) {
    const g = G(), sh = ship(), rule = fuelRule(), a = idx(fromId), b = idx(toId); if (a < 0 || b < 0) return { ok: false, why: "That system is no longer on the map." };
    const dangerAt = j => g.regions.filter(r => r.kind === "danger" && Math.hypot(r.x - g.systems[j].x, r.y - g.systems[j].y) <= r.r).length * 3;
    const path = Gg.route(g, a, b, sh.range * ({ Sound: 1, Worn: .9, Damaged: .7, Crippled: .45 }[sh.condition] || 1), { risk: (i, j) => dangerAt(j), can: j => !sys(j).gone });
    if (!path) return { ok: false, why: `No way there within the ship's reach of ${round1(sh.range)} light years a jump${sh.condition !== "Sound" ? " (less, as it is " + sh.condition.toLowerCase() + ")" : ""}.` };
    const laneSet = g._laneSet; let fuel = +sh.fuel, total = 0, days = 0, need = 0, lowest = fuel, fails = null; const stops = [], risks = [], legs = [];
    for (let k = 1; k < path.length; k++) {
      const p = sys(path[k - 1]), q = sys(path[k]), d = g.laneLy.get(lk(path[k - 1], path[k])) || ly(p, q), f = d * sh.burn * rule[2];
      if (k > 1 && p.f.fuel) { stops.push(p.name); if (sh.refuel !== false) fuel = sh.cap; }
      total += d; days += d / Math.max(.1, sh.speed); need += f; fuel -= f; lowest = Math.min(lowest, fuel);
      if (fuel < -1e-9 && !fails) fails = `The fuel runs out on the jump from ${p.name} to ${q.name}.`;
      const lane = laneSet.has(Math.min(path[k - 1], path[k]) + "-" + Math.max(path[k - 1], path[k]));
      legs.push({ from: p.name, to: q.name, ly: d, lane, kind: g.laneKind.get(lk(path[k - 1], path[k])) || "" });
      for (const r of g.regions) if (Math.hypot(r.x - q.x, r.y - q.y) <= r.r) { if (r.kind === "danger") risks.push(`${q.name} lies in ${r.name}`); if (r.kind === "restricted") risks.push(`${q.name} lies in restricted space: ${r.name}`); if (r.kind === "unexplored") risks.push(`${q.name} lies in unexplored space: ${r.name}`); }
      if (!known(chartOf(q.id))) risks.push(`${q.name} is not on their charts`);
      if (!lane) risks.push(`The jump from ${p.name} to ${q.name} is off the lanes`);
      if (q.f.anomaly) risks.push(`Something strange at ${q.name}`);
    }
    if (rule[2] && fuel < sh.cap * .15 && !fails) risks.push(`They arrive with ${Math.max(0, Math.round(fuel))} of ${sh.cap} fuel`);
    return { ok: !fails || !rule[2], why: rule[2] ? fails : null, path: path.map(i => sys(i).id), ly: total, days, fuel: rule[2] ? need : 0, left: rule[2] ? fuel : sh.fuel, stops, risks: [...new Set(risks)], legs };
  }
  const round1 = v => Math.round(v * 10) / 10;

  /* ---- the view */
  // tools: the editor's row (UI.tools), and the tool in hand: region, lane, terr (painting territory), sector
  const UI = { sel: null, sys: null, planet: null, plan: null, z: 1, cx: 500, cy: 500, edit: null, adding: false, moving: null, filter: "", tools: false, tool: null, first: null, paint: "", selReg: null, selLane: null, panel: null, pedit: null, movingReg: null };
  let host = null, svg = null, drag = null;
  const HIST = [], REDO = [];   // the game master's changes to the galaxy this visit, to undo and do again
  function setG(id, data, how) {
    const cur = edits()[id];
    if (how !== "hist") { HIST.push({ id, before: cur == null ? null : JSON.parse(JSON.stringify(cur)), after: data == null ? null : JSON.parse(JSON.stringify(data)) }); if (HIST.length > 200) HIST.shift(); REDO.length = 0; }
    S().set("gedits", id, data); A._galaxy = null;
  }
  const doc = id => JSON.parse(JSON.stringify(edits()[id] || {}));
  function mount(el) {
    host = el; host.innerHTML = `<div class="gx-wrap"><div class="gx-map"><div class="gx-bar"><input type="search" class="gx-find" placeholder="Find a system" aria-label="Find a system"><button type="button" class="gx-b" data-gx="zin" aria-label="Closer">+</button><button type="button" class="gx-b" data-gx="zout" aria-label="Further">−</button><button type="button" class="gx-b" data-gx="fit">The whole galaxy</button><button type="button" class="gx-b" data-gx="ship">The ship</button><button type="button" class="gx-b" data-gx="tools" aria-pressed="false" title="Systems, regions, lanes, sectors, powers and territories">Edit the galaxy</button><div class="gx-tools" hidden></div></div><div class="gx-canvas" tabindex="0" aria-label="The star chart: drag to move, scroll to come closer"></div><div class="gx-key"></div></div><aside class="gx-side"></aside></div>`;
    svg = null; base(); over(); side(); tools();
    const cv = host.querySelector(".gx-canvas");
    cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : .8, e); }, { passive: false });
    cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, cx: UI.cx, cy: UI.cy, moved: false, paint: UI.tool === "terr" ? {} : null }; cv.setPointerCapture(e.pointerId); if (drag.paint) paintAt(e); });
    cv.addEventListener("pointermove", e => { if (!drag) return; if (drag.paint) { drag.moved = true; paintAt(e); return; } const k = viewW() / cv.clientWidth, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true; UI.cx = drag.cx - dx; UI.cy = drag.cy - dy; view(); });
    cv.addEventListener("pointerup", e => { const d = drag; drag = null; if (d && d.paint) { const T = Object.assign(doc("~terr"), d.paint); if (Object.keys(d.paint).length) { setG("~terr", T); refresh(); } return; } if (d && !d.moved) clickAt(e); });
    host.addEventListener("keydown", e => { if (e.target.closest("input, textarea, select")) return; if ((e.ctrlKey || e.metaKey) && /^[zy]$/i.test(e.key)) { e.preventDefault(); undo(!(e.key.toLowerCase() === "y" || e.shiftKey)); } else if (e.key === "Escape" && (UI.tool || UI.adding || UI.moving || UI.movingReg)) { UI.tool = null; UI.adding = false; UI.moving = null; UI.movingReg = null; UI.first = null; tools(); over(); } });
    host.querySelector(".gx-find").addEventListener("input", e => { UI.filter = e.target.value.trim().toLowerCase(); over(); });
    host.addEventListener("click", onClick); host.addEventListener("change", onChange); host.addEventListener("submit", onSubmit);
  }
  const viewW = () => 1000 / UI.z, viewH = () => viewW() * .62;
  function view() { if (!svg) return; svg.setAttribute("viewBox", `${UI.cx - viewW() / 2} ${UI.cy - viewH() / 2} ${viewW()} ${viewH()}`); host.querySelector(".gx-canvas").dataset.z = UI.z >= 3.5 ? "near" : UI.z >= 1.8 ? "mid" : "far"; labels(); }
  function zoomAt(f, e) { const cv = host.querySelector(".gx-canvas"), r = cv.getBoundingClientRect(), px = e ? (e.clientX - r.left) / r.width : .5, py = e ? (e.clientY - r.top) / r.height : .5, wx = UI.cx - viewW() / 2 + px * viewW(), wy = UI.cy - viewH() / 2 + py * viewH(); UI.z = Math.max(.8, Math.min(24, UI.z * f)); UI.cx = wx - (px - .5) * viewW(); UI.cy = wy - (py - .5) * viewH(); view(); }
  function centreOn(s, z) { UI.cx = s.x; UI.cy = s.y; if (z) UI.z = Math.max(UI.z, z); view(); }
  // what never changes while looking: the regions, the territories, the lanes, the systems
  function base() {
    const g = G(), L = allSys(), cv = host.querySelector(".gx-canvas");
    const terr = L.filter(s => s.pw != null).map(s => `<circle cx="${s.x}" cy="${s.y}" r="13" fill="${PCOL[s.pw % PCOL.length]}" class="gx-terr"/>`).join("");
    // (a trade route in gold, a corridor of the game master's own length in violet)
    const lanes = g.lanes.map(([a, b]) => { const p = sys(a), q = sys(b), k = g.laneKind.get(lk(a, b)) || (g.laneLy.has(lk(a, b)) ? "corridor" : ""); return p.gone || q.gone ? "" : `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="gx-lane${k ? " gx-l-" + k : ""}${UI.selLane === lk(a, b) ? " sel" : ""}"/>`; }).join("");
    const stars = L.map(s => { const st = chartOf(s.id), c = (Gg.STARS[s.cls] || Gg.STARS.G)[0]; return `<circle cx="${s.x}" cy="${s.y}" r="${s.cls === "O" || s.cls === "B" ? 2.6 : s.cls === "X" ? 2.2 : 1.8}" fill="${c}" class="gx-star gx-${st}" data-sys="${esc(s.id)}"/>`; }).join("");
    cv.innerHTML = `<svg class="gx-svg" role="img" aria-label="${esc((A.galaxyParams || {}).name || "The galaxy")}"><rect x="-500" y="-500" width="2000" height="2000" class="gx-bg"/><g class="gx-terrs">${terr}</g>${g.regions.map(r => `<circle cx="${r.x}" cy="${r.y}" r="${r.r}" class="gx-reg gx-${esc(r.kind)}${UI.selReg === r.id ? " sel" : ""}"><title>${esc(r.name)}</title></circle>`).join("")}${g.sectors.map(c => `<text x="${c.x}" y="${c.y}" class="gx-sector">${esc(c.name)}</text>`).join("")}<g class="gx-lanes">${lanes}</g><g class="gx-stars">${stars}</g><g class="gx-over"></g><g class="gx-labels"></g></svg>`;
    svg = cv.querySelector("svg"); view();
    const key = host.querySelector(".gx-key");
    key.innerHTML = `${g.powers.map((p, k) => `<span><i style="background:${PCOL[k % PCOL.length]}"></i>${esc(p.name)}</span>`).join("")}<span><i class="gx-k-danger"></i>Dangerous</span><span><i class="gx-k-restricted"></i>Restricted</span><span><i class="gx-k-explored"></i>Charted space</span>${g.regions.some(r => r.kind === "unexplored") ? `<span><i class="gx-k-unexplored"></i>Unexplored</span>` : ""}${[...g.laneKind.values()].includes("trade") ? `<span><i class="gx-k-trade"></i>Trade route</span>` : ""}${g.laneLy.size ? `<span><i class="gx-k-corridor"></i>Corridor</span>` : ""}`;
  }
  // the editor's row: what each tool does, the power a territory is painted for, undo and redo
  const REGK = [["danger", "Dangerous"], ["restricted", "Restricted"], ["explored", "Charted space"], ["unexplored", "Unexplored"]];
  const LANEK = [["lane", "A lane"], ["trade", "A trade route"], ["corridor", "A corridor (its own length)"]];
  function tools() {
    if (!host) return; const t = host.querySelector(".gx-tools"), g = G(), on = UI.tools;
    t.hidden = !on; host.querySelector('[data-gx="tools"]').setAttribute("aria-pressed", on);
    if (!on) return;
    const tb = (k, l, title) => `<button type="button" class="gx-b" data-gx="tool" data-t="${k}" aria-pressed="${k === "add" ? UI.adding : UI.tool === k}" title="${esc(title)}">${l}</button>`;
    const how = UI.adding ? "Click the map where the new system stands." : UI.moving ? "Click the map where it should stand." : UI.movingReg ? "Click the map where the region's middle should be." : UI.tool === "region" ? "Click the middle of the new region." : UI.tool === "sector" ? "Click where the new sector's heart is: the systems nearest it join it." : UI.tool === "lane" ? (UI.first ? `Now click the star the lane from ${esc((findSys(UI.first) || {}).name || "")} goes to.` : "Click the star the lane starts from.") : UI.tool === "terr" ? "Drag over the stars to give them to the power chosen; click one star to give just it." : "Click a star, a region or a lane to change it. Esc puts a tool down.";
    t.innerHTML = tb("add", "+ System", "Then click the map where it stands") + tb("region", "+ Region", "A dangerous, restricted, charted or unexplored region") + tb("lane", "+ Lane", "A lane, a trade route or a corridor between two stars") + tb("sector", "+ Sector", "A new sector: the stars nearest it join it")
      + tb("terr", "Paint territory", "Give stars to a power or a faction") + (UI.tool === "terr" ? `<select class="t-in gx-sel" data-gx="paint" aria-label="Whose territory">${[["", "No one"], ...g.powers.map(p => [p.id, p.name]), ...Object.entries(A.factionsData || {}).filter(([id]) => !g.powers.some(p => p.id === id)).map(([id, f]) => [id, (f.n || id) + " (a faction)"])].map(([v, l]) => `<option value="${esc(v)}"${v === UI.paint ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>` : "")
      + `<button type="button" class="gx-b" data-gx="panel" data-p="sp" aria-pressed="${UI.panel === "sp"}">Sectors and powers</button><button type="button" class="gx-b" data-gx="undo"${HIST.length ? "" : " disabled"} title="Ctrl+Z">Undo</button><button type="button" class="gx-b" data-gx="redo"${REDO.length ? "" : " disabled"} title="Ctrl+Y">Redo</button><button type="button" class="gx-b" data-gx="export" title="Your changes, for the campaign's table.js">Copy the changes</button><span class="gx-how">${how}</span>`;
  }
  function undo(back) { const from = back ? HIST : REDO, to = back ? REDO : HIST, h = from.pop(); if (!h) return; to.push(h); setG(h.id, back ? h.before : h.after, "hist"); refresh(); if (A.tableUI) A.tableUI.api.note(back ? "Undone." : "Done again."); }
  // painting territory: every star under the brush given to the power chosen (kept when the stroke ends: one change)
  function paintAt(e) {
    const cv = host.querySelector(".gx-canvas"), r = cv.getBoundingClientRect(), wx = UI.cx - viewW() / 2 + (e.clientX - r.left) / r.width * viewW(), wy = UI.cy - viewH() / 2 + (e.clientY - r.top) / r.height * viewH(), rad = 16 * viewW() / r.width;
    for (const s of allSys()) if ((s.x - wx) ** 2 + (s.y - wy) ** 2 <= rad * rad) drag.paint[s.id] = UI.paint || "";
    const o = svg.querySelector(".gx-over"); o.querySelectorAll(".gx-paint").forEach(n => n.remove());
    o.insertAdjacentHTML("beforeend", Object.keys(drag.paint).map(id => { const s = findSys(id); return s ? `<circle class="gx-paint" cx="${s.x}" cy="${s.y}" r="${(6 * viewW() / r.width).toFixed(2)}"/>` : ""; }).join("") + `<circle class="gx-paint gx-brush" cx="${wx}" cy="${wy}" r="${rad}"/>`);
  }
  // what changes as the game master looks: the ship, the course plotted, the system chosen, systems found by name
  function over() {
    if (!svg) return; const o = svg.querySelector(".gx-over"), sh = ship(), at = findSys(sh.at), parts = [];
    if (UI.plan && UI.plan.path) { const pts = UI.plan.path.map(id => findSys(id)).filter(Boolean); parts.push(`<polyline points="${pts.map(s => s.x + "," + s.y).join(" ")}" class="gx-route${UI.plan.ok ? "" : " bad"}"/>`); }
    if (at) parts.push(`<circle cx="${at.x}" cy="${at.y}" r="${Math.max(2, 9 / Math.sqrt(UI.z))}" class="gx-shipmark"/><circle cx="${at.x}" cy="${at.y}" r="${sh.range / G().ly}" class="gx-reach"/>`);
    const sel = UI.sel && findSys(UI.sel); if (sel) parts.push(`<circle cx="${sel.x}" cy="${sel.y}" r="${Math.max(3, 12 / Math.sqrt(UI.z))}" class="gx-selmark"/>`);
    if (UI.filter) for (const s of allSys().filter(s => s.name.toLowerCase().includes(UI.filter)).slice(0, 40)) parts.push(`<circle cx="${s.x}" cy="${s.y}" r="${Math.max(3, 8 / Math.sqrt(UI.z))}" class="gx-found"/>`);
    o.innerHTML = parts.join(""); labels();
  }
  // names: the systems on screen, more of them the closer the view (those with people or the council's names first)
  function labels() {
    // (a steady size on screen whatever the zoom; never two names over each other: the most important placed first)
    if (!svg) return; const l = svg.querySelector(".gx-labels"), x0 = UI.cx - viewW() / 2, y0 = UI.cy - viewH() / 2, cw = (host.querySelector(".gx-canvas") || {}).clientWidth || 600, fs = 11.5 * viewW() / cw;
    const vis = allSys().filter(s => s.x >= x0 && s.x <= x0 + viewW() && s.y >= y0 && s.y <= y0 + viewH());
    const imp = s => (s.id === UI.sel ? 20 : 0) + (s.id === ship().at ? 10 : 0) + (((A.galaxyOver || {}).systems || {})[s.id] ? 6 : 0) + (s.f.colony ? 3 : 0) + (s.f.station ? 2 : 0) + (known(chartOf(s.id)) ? 1 : 0);
    const placed = [], out = [];
    for (const s of vis.sort((a, b) => imp(b) - imp(a))) {
      const txt = s.name + (s.f.colony ? " ●" : s.f.station ? " ◇" : ""), bx = s.x + fs * .5, by = s.y - fs * .55, bw = txt.length * fs * .56, bh = fs * 1.1;
      if (placed.some(p => bx < p[0] + p[2] && bx + bw > p[0] && by < p[1] + p[3] && by + bh > p[1])) continue;
      placed.push([bx, by, bw, bh]); out.push(`<text x="${bx.toFixed(1)}" y="${(s.y + fs * .35).toFixed(1)}" class="gx-name gx-${chartOf(s.id)}" style="font-size:${fs.toFixed(2)}px">${esc(txt)}</text>`);
      if (out.length >= 400) break;
    }
    l.innerHTML = out.join("");
  }
  function clickAt(e) {
    const cv = host.querySelector(".gx-canvas"), r = cv.getBoundingClientRect(), wx = UI.cx - viewW() / 2 + (e.clientX - r.left) / r.width * viewW(), wy = UI.cy - viewH() / 2 + (e.clientY - r.top) / r.height * viewH();
    const r1 = v => Math.round(v * 10) / 10, nid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10);
    if (UI.adding) { const id = "C" + Date.now().toString(36); setG(id, { added: true, name: "A new system", cls: "G", x: r1(wx), y: r1(wy), f: {}, t: Date.now() }); UI.adding = false; UI.sel = id; UI.edit = id; refresh(); return; }
    if (UI.moving) { const id = UI.moving; setG(id, Object.assign(doc(id), { x: r1(wx), y: r1(wy) })); UI.moving = null; refresh(); return; }
    if (UI.movingReg) { const R = doc("~regions"), id = UI.movingReg, own = (R.add || []).find(a => a.id === id); if (own) Object.assign(own, { x: r1(wx), y: r1(wy) }); else { R.edit = R.edit || {}; R.edit[id] = Object.assign(R.edit[id] || {}, { x: r1(wx), y: r1(wy) }); } setG("~regions", R); UI.movingReg = null; refresh(); return; }
    if (UI.tool === "region") { const id = nid("rg"), R = doc("~regions"); R.add = (R.add || []).concat({ id, kind: "danger", x: r1(wx), y: r1(wy), r: 30, name: "A new region" }); setG("~regions", R); UI.tool = null; UI.selReg = id; UI.sel = null; UI.selLane = null; refresh(); return; }
    if (UI.tool === "sector") { const id = nid("sc"), X = doc("~sectors"); X.add = (X.add || []).concat({ id, x: r1(wx), y: r1(wy), name: "The New Sector" }); setG("~sectors", X); UI.tool = null; UI.panel = "sp"; refresh(); return; }
    let best = null, bd = (14 / Math.sqrt(UI.z)) ** 2; for (const s of allSys()) { const d = (s.x - wx) ** 2 + (s.y - wy) ** 2; if (d < bd) { bd = d; best = s; } }
    if (UI.tool === "lane") {
      if (!best) return;
      if (!UI.first) { UI.first = best.id; tools(); over(); return; }
      if (best.id === UI.first) return;
      const L = doc("~lanes"), a = UI.first, b = best.id; L.add = (L.add || []).filter(x => !((x[0] === a && x[1] === b) || (x[0] === b && x[1] === a))).concat([[a, b, "lane"]]); L.cut = (L.cut || []).filter(x => !((x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)));
      setG("~lanes", L); UI.first = null; UI.tool = null; UI.sel = null; UI.selLane = lk(findSys(a).i, findSys(b).i); UI.selReg = null; refresh(); return;
    }
    if (UI.tool === "terr") return;
    if (best) { UI.sel = best.id; UI.selReg = null; UI.selLane = null; UI.sys = null; UI.planet = null; UI.plan = null; over(); side(); return; }
    // no star there: the smallest region the click is in, or a lane passing close by
    if (UI.tools) {
      const g = G(), tol = 6 / Math.sqrt(UI.z), segD = (p, q) => { const dx = q.x - p.x, dy = q.y - p.y, t = Math.max(0, Math.min(1, ((wx - p.x) * dx + (wy - p.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(wx - p.x - dx * t, wy - p.y - dy * t); };
      const ln = g.lanes.map(([a, b]) => [lk(a, b), segD(sys(a), sys(b))]).filter(x => x[1] < tol).sort((x, y) => x[1] - y[1])[0];
      if (ln) { UI.selLane = ln[0]; UI.sel = null; UI.selReg = null; refresh(); return; }
      const rg = g.regions.filter(r => Math.hypot(r.x - wx, r.y - wy) <= r.r).sort((x, y) => x.r - y.r)[0];
      if (rg) { UI.selReg = rg.id; UI.sel = null; UI.selLane = null; refresh(); return; }
    }
    if (UI.sel || UI.selReg || UI.selLane) { UI.sel = null; UI.selReg = null; UI.selLane = null; refresh(); }
  }

  /* ---- the side: the ship, the system chosen, its worlds, a course */
  function shipHTML() {
    const sh = ship(), at = findSys(sh.at), rule = fuelRule(), pct = Math.max(0, Math.min(100, sh.fuel / sh.cap * 100));
    return `<section class="gx-card"><h3>${esc(sh.name)}</h3><div class="gx-f"><span class="kn">At</span> <button type="button" class="t-link" data-gx="pick" data-id="${esc(sh.at)}">${esc(at ? at.name : sh.at)}</button></div>
      ${rule[2] ? `<div class="gx-fuel" title="${Math.round(sh.fuel)} of ${sh.cap}"><i style="width:${pct.toFixed(1)}%"></i></div><div class="gx-f"><span class="kn">Fuel</span> ${Math.round(sh.fuel)} of ${sh.cap}${at && at.f.fuel && sh.fuel < sh.cap ? ` <button type="button" class="t-mini" data-gx="refuel">Refuel here</button>` : ""}</div>` : ""}
      <div class="gx-f"><span class="kn">Reach</span> ${round1(sh.range)} light years a jump · <span class="kn">Speed</span> ${round1(sh.speed)} light years a day</div>
      <div class="gx-f"><span class="kn">Condition</span> <select class="t-in gx-sel" data-gx="cond">${COND.map(c => `<option${c === sh.condition ? " selected" : ""}>${c}</option>`).join("")}</select> <span class="kn">Cargo</span> ${sh.cargo} of ${sh.cargoCap}</div>
      ${sh.crew ? `<div class="gx-f"><span class="kn">Crew</span> ${esc(sh.crew)}</div>` : ""}${(sh.equipment || []).length ? `<div class="gx-f"><span class="kn">Equipment</span> ${esc(sh.equipment.join(", "))}</div>` : ""}${(sh.upgrades || []).length ? `<div class="gx-f"><span class="kn">Upgrades</span> ${esc(sh.upgrades.join(", "))}</div>` : ""}
      <div class="gx-f"><span class="kn">Fuel</span> <select class="t-in gx-sel" data-gx="rule">${FUEL.map(([k, l]) => `<option value="${k}"${k === rule[0] ? " selected" : ""}>${l}</option>`).join("")}</select></div>
      ${(sh.log || []).length ? `<details class="fa-more"><summary>Its log (${sh.log.length})</summary><ol class="tw-hist" reversed>${sh.log.slice().reverse().slice(0, 30).map(l => `<li><span class="kn">${esc(l.when || "")}</span> ${esc(l.what)}</li>`).join("")}</ol></details>` : ""}</section>`;
  }
  function sysHTML(s) {
    const st = chartOf(s.id), c = (S() && S().get("charts", s.id)) || {}, g = G(), sh = ship(), here = sh.at === s.id, info = bodiesOf(s);
    const sec = s.sec != null ? g.sectors[s.sec] : null, pw = s.pw != null ? g.powers[s.pw] : null, regs = g.regions.filter(r => r.kind !== "explored" && Math.hypot(r.x - s.x, r.y - s.y) <= r.r);
    const places = A.order.filter(id => (A.meta[id] || {}).system === s.id);
    const ov = ((A.galaxyOver || {}).systems || {})[s.id] || {}, gm = (edits()[s.id] || {}).gm || ov.gm || s.gm || "", desc = (edits()[s.id] || {}).desc || ov.desc || s.desc || "";
    return `<section class="gx-card"><h3>${esc(s.name)}</h3><div class="gx-f">${esc(info.star.name)}${info.star.binary ? ", with a companion star" : ""}${sec ? ` · ${esc(sec.name)}` : ""}</div>
      ${pw ? `<div class="gx-f"><span class="kn">Held by</span> <i class="gx-dot" style="background:${PCOL[s.pw % PCOL.length]}"></i>${esc(pw.name)}</div>` : ""}
      ${regs.map(r => `<div class="gx-f gx-warn">${r.kind === "danger" ? "Dangerous" : "Restricted"}: ${esc(r.name)}</div>`).join("")}
      <div class="gx-tags">${[s.f.colony && "A colony", s.f.station && "A station", s.f.fuel && "Fuel", s.f.mining && "Mining", s.f.research && "Research", s.f.derelict && "A derelict", s.f.anomaly && "An anomaly"].filter(Boolean).map(t => `<span>${t}</span>`).join("")}</div>
      ${desc ? `<p>${esc(desc)}</p>` : ""}${gm ? `<p class="gx-gm"><span class="kn">Only you</span> ${esc(gm)}</p>` : ""}
      <div class="gx-f"><span class="kn">Their charts</span> <select class="t-in gx-sel" data-gx="chart" data-id="${esc(s.id)}">${STATE.map(([k, l]) => `<option value="${k}"${k === st ? " selected" : ""}>${l}</option>`).join("")}</select> <select class="t-in gx-sel" data-gx="how" data-id="${esc(s.id)}" aria-label="How they came by it">${HOW.map(([k, l]) => `<option value="${k}"${k === (c.how || "") ? " selected" : ""}>${l}</option>`).join("")}</select></div>
      ${places.length ? `<div class="gx-f"><span class="kn">Your places here</span> ${places.map(id => `<button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button>`).join(" ")}</div>` : ""}
      ${UI.tools ? `<div class="gx-f"><span class="kn">Lanes</span> ${(g.adj[s.i] || []).map(j => { const k = lk(s.i, j), t = sys(j); return t && !t.gone ? `<button type="button" class="t-link" data-gx="pickl" data-k="${k}">${esc(t.name)}${g.laneKind.get(k) === "trade" ? " (trade)" : g.laneLy.has(k) ? " (corridor)" : ""}</button>` : ""; }).join(" · ") || "none"} <button type="button" class="t-mini" data-gx="lanefrom" data-id="${esc(s.id)}">+ Lane from here</button></div>` : ""}
      <div class="t-row">${here ? `<span class="kn">The ship is here.</span>` : `<button type="button" class="t-btn prim" data-gx="plot" data-id="${esc(s.id)}">Plot a course here</button>`}<button type="button" class="t-mini" data-gx="open" data-id="${esc(s.id)}">${UI.sys === s.id ? "Close the system" : "Open the system"}</button><button type="button" class="t-mini" data-gx="edit" data-id="${esc(s.id)}">Change it</button>${A.askChange ? `<button type="button" class="t-mini" data-gx="ask" data-id="${esc(s.id)}" title="Say what should change: its details, a world or a site added; see what it replaces before anything does">Ask for a change…</button>` : ""}</div></section>
      ${UI.plan && UI.plan.to === s.id ? planHTML() : ""}${UI.edit === s.id ? editHTML(s) : ""}${UI.sys === s.id ? systemHTML(s, info, places) : ""}`;
  }
  function planHTML() {
    const p = UI.plan; if (!p.path) return `<section class="gx-card gx-plan"><h4>The course</h4><p class="gx-warn">${esc(p.why)}</p></section>`;
    return `<section class="gx-card gx-plan"><h4>The course</h4><div class="gx-f">${p.path.length - 1} jump${p.path.length > 2 ? "s" : ""} · ${round1(p.ly)} light years · ${round1(p.days)} days${p.fuel ? ` · ${Math.ceil(p.fuel)} fuel` : ""}</div>
      ${p.stops.length ? `<div class="gx-f"><span class="kn">Fuel on the way</span> ${esc(p.stops.join(", "))}</div>` : p.fuel ? `<div class="gx-f"><span class="kn">Fuel on the way</span> none</div>` : ""}
      ${p.risks.length ? `<ul class="gx-risks">${p.risks.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : `<p class="t-small">No dangers on the charts.</p>`}
      ${p.why ? `<p class="gx-warn">${esc(p.why)}</p>` : ""}
      <details><summary class="t-small">Each jump</summary><ol class="t-small">${p.legs.map(l => `<li>${esc(l.from)} to ${esc(l.to)}: ${round1(l.ly)} ly${l.lane ? "" : " (off the lanes)"}</li>`).join("")}</ol></details>
      <div class="t-row"><button type="button" class="t-btn prim" data-gx="jump"${p.ok ? "" : " disabled"}>${p.risks.length ? "Make the jump anyway" : "Make the jump"}</button><span class="kn">${A.worldTime ? "moves the world's time on " + round1(p.days) + " days" : ""}</span></div></section>`;
  }
  /* "Ask for a change" on a star system (atlas-ask.js; the user's master plan: "Add another planet", "Add a mining
     colony"): its details and who holds it; a world added; a station, colony or other site added. Only that system
     changes, and the chart's every other system, lane and territory stays as it is */
  const FLAGS = [["colony", "a colony"], ["station", "a station"], ["fuel", "fuel"], ["mining", "mining"], ["research", "research"], ["derelict", "a derelict"], ["anomaly", "an anomaly"]];
  function askSys(s) {
    const AC = A.askChange, info = bodiesOf(s), wkinds = Object.keys(Gg.KINDS), skinds = SITEK.map(x => x[0]), keepsAll = ["every other system, lane, region and territory of the chart", "the ship and the players' charts"];
    const owners = [...G().powers.map(p => [p.id, p.name]), ...Object.entries(A.factionsData || {}).filter(([id]) => !G().powers.some(p => p.id === id)).map(([id, f]) => [id, f.n || id])];
    const holder = s.pw != null && G().powers[s.pw] ? G().powers[s.pw] : null, byName = (list, n) => { const q = String(n || "").toLowerCase().trim(); return list.find(x => x[1].toLowerCase() === q || x[0] === n) || null; };
    const worlds = info.planets.map(p => [p.n, p.name]);
    return { what: "a star system", name: s.name, example: "Add a mining colony on its third world, held by the Guild.",
      now: `${info.star.name}${s.bin ? " with a companion star" : ""}. Has: ${FLAGS.filter(([k]) => s.f[k]).map(f => f[1]).join(", ") || "nothing of note"}. Held by: ${holder ? holder.name : "no one"}. Its worlds: ${info.planets.map(p => `${p.name} (${p.kname || p.kind}, ${Math.round(p.a * 100) / 100} AU)`).join(", ") || "none"}. Its sites: ${info.sites.map(x => x.name).join(", ") || "none"}.${owners.length ? " Powers and factions: " + owners.map(o => o[1]).join(", ") + "." : ""}`,
      ops: {
        details: { label: "Change its name, its description, the game master's notes, what it has, or who holds it", values: `only those that change: {"name": "...", "desc": "what it is", "gm": "for the game master only", "add": [any of ${FLAGS.map(f => f[0]).join("|")}], "drop": [any of the same]${owners.length ? `, "owner": one of ${owners.map(o => JSON.stringify(o[1])).join("|")} or "" for no one` : ""}}`,
          read: v => { const o = {}; const n = AC.str(v.name, 60); if (n && n !== s.name) o.name = n; for (const k of ["desc", "gm"]) { const t = AC.str(v[k], 1500); if (t) o[k] = t; } const fl = FLAGS.map(f => f[0]), add = (Array.isArray(v.add) ? v.add : []).filter(k => fl.includes(k) && !s.f[k]), drop = (Array.isArray(v.drop) ? v.drop : []).filter(k => fl.includes(k) && s.f[k]); if (add.length) o.add = add; if (drop.length) o.drop = drop; if (v.owner != null) { const w = v.owner === "" ? ["", ""] : byName(owners, v.owner); if (w && w[0] !== (holder ? holder.id : "")) o.owner = w[0]; } return Object.keys(o).length ? o : null; },
          plan: v => ({ change: `Change ${s.name}`, replaces: [v.name && `its name: ${s.name} → ${v.name}`, v.desc && "its description", v.gm && "your notes on it", v.drop && `what it has: no longer ${v.drop.map(k => FLAGS.find(f => f[0] === k)[1]).join(", ")}`, v.owner != null && `who holds it: ${holder ? holder.name : "no one"} → ${v.owner ? (byName(owners, v.owner) || [0, v.owner])[1] : "no one"}`].filter(Boolean), keeps: ["where it is, its star, its worlds and sites", ...keepsAll], detail: [v.add && "It gains: " + v.add.map(k => FLAGS.find(f => f[0] === k)[1]).join(", "), v.desc && "Its description: " + v.desc, v.gm && "For you: " + v.gm] }),
          apply: v => { const D = doc(s.id), fl = Object.assign({}, s.f); for (const k of v.add || []) fl[k] = 1; for (const k of v.drop || []) fl[k] = 0; setG(s.id, Object.assign(D, { name: v.name || s.name, cls: s.cls, bin: s.bin, f: fl, t: Date.now() }, v.desc ? { desc: v.desc } : {}, v.gm ? { gm: v.gm } : {})); if (v.owner != null) setG("~terr", Object.assign(doc("~terr"), { [s.id]: v.owner })); refresh(); } },
        world: { label: "Add a world to it", values: `{"kind": one of ${wkinds.join("|")}, "a": its distance from the star in AU (0.1 to 60), "name": "its name" (optional)}`,
          read: v => { const kind = AC.one(v.kind, wkinds); if (!kind) return null; const a = Math.max(.05, Math.min(60, +v.a > 0 ? +v.a : 1)); if (info.planets.some(p => Math.abs(p.a - a) < .05)) return null; return { kind, a: Math.round(a * 100) / 100, name: AC.str(v.name, 60) || undefined }; },
          plan: v => ({ change: `Add ${/^[aeiou]/i.test(Gg.KINDS[v.kind]) ? "an" : "a"} ${Gg.KINDS[v.kind].toLowerCase()}${v.name ? " named " + v.name : ""} to ${s.name}, ${v.a} AU from its star`, replaces: [], keeps: [`${s.name}'s other worlds and sites as they are`, ...keepsAll] }),
          apply: v => { const D = doc(s.id), B = D.bodies = D.bodies || {}, n = Math.max(99, ...info.planets.map(x => x.n)) + 1, w = newWorld(s, v.kind, v.a, n); if (v.name) w.name = v.name; B.add = (B.add || []).concat(w); setG(s.id, D); UI.sel = s.id; UI.sys = s.id; UI.planet = n; refresh(); } },
        site: { label: "Add a station, colony, mining installation or other site to it", values: `{"kind": one of ${skinds.join("|")}, "name": "its name", "on": the name of the world it is on, one of ${worlds.map(w => JSON.stringify(w[1])).join("|") || "none"}, or omitted for open space}`,
          read: v => { const kind = AC.one(v.kind, skinds); if (!kind) return null; const on = v.on ? byName(worlds, v.on) : null; return { kind, name: AC.str(v.name, 60) || (SITEK.find(x => x[0] === kind) || [0, "A site"])[1], on: on ? on[0] : null, onName: on ? on[1] : null }; },
          plan: v => ({ change: `Add ${(SITEK.find(x => x[0] === v.kind) || [0, "a site"])[1].toLowerCase()}, ${v.name}, to ${s.name}${v.onName ? ", on " + v.onName : ", in open space"}`, replaces: [], keeps: [`${s.name}'s worlds and other sites as they are`, ...keepsAll] }),
          apply: v => { const D = doc(s.id), B = D.bodies = D.bodies || {}, nk = Math.max(99, ...info.sites.map(x => x.k)) + 1; B.addS = (B.addS || []).concat({ k: nk, kind: v.kind, name: v.name, on: v.on }); setG(s.id, D); UI.sel = s.id; UI.sys = s.id; refresh(); } }
      } };
  }
  function editHTML(s) {
    const e = edits()[s.id] || {}, ov = ((A.galaxyOver || {}).systems || {})[s.id] || {};
    return `<section class="gx-card"><h4>Change ${esc(s.name)}</h4><form data-gx="save" data-id="${esc(s.id)}">
      <label class="tw-l"><span>Name</span><input class="t-in" name="name" maxlength="60" value="${esc(s.name)}"></label>
      <label class="tw-l"><span>Its star</span><select class="t-in" name="cls">${Object.keys(Gg.STARS).map(k => `<option value="${k}"${k === s.cls ? " selected" : ""}>${esc(Gg.STAR_NAME[k])}</option>`).join("")}</select></label>
      <label class="t-fogck"><input type="checkbox" name="bin"${s.bin ? " checked" : ""}> With a companion star</label>
      <label class="tw-l"><span>Held by</span><select class="t-in" name="owner">${[["", "No one"], ...G().powers.map(p => [p.id, p.name]), ...Object.entries(A.factionsData || {}).filter(([id]) => !G().powers.some(p => p.id === id)).map(([id, f]) => [id, (f.n || id) + " (a faction)"])].map(([v, l]) => `<option value="${esc(v)}"${(s.pw != null && G().powers[s.pw] && G().powers[s.pw].id === v) || (s.pw == null && !v) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <div class="tj-keys">${[["colony", "A colony"], ["station", "A station"], ["fuel", "Fuel"], ["mining", "Mining"], ["research", "Research"], ["derelict", "A derelict"], ["anomaly", "An anomaly"]].map(([k, l]) => `<label class="t-fogck"><input type="checkbox" name="f_${k}"${s.f[k] ? " checked" : ""}> ${l}</label>`).join("")}</div>
      <label class="tw-l"><span>What it is</span><textarea class="t-in" name="desc" rows="2">${esc(e.desc || ov.desc || s.desc || "")}</textarea></label>
      <label class="tw-l"><span>Only you</span><textarea class="t-in" name="gm" rows="2">${esc(e.gm || ov.gm || s.gm || "")}</textarea></label>
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="move" data-id="${esc(s.id)}">Move it</button>${Object.keys(e).length && !e.added ? `<button type="button" class="t-mini" data-gx="unedit" data-id="${esc(s.id)}">As it was</button>` : ""}<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="remove" data-id="${esc(s.id)}">Take it off the map</button></div></form></section>`;
  }
  /* ---- a system's worlds, belts and what people put there, as grown and as the game master changed them (bodies:
          p: { n: changes or { gone } }, add: [worlds], b: { k: 1 } belts taken away, addB: [belts], s: { k: changes or
          { gone } }, addS: [sites]) */
  const LAND = ["Open air", "Suits needed", "Only with specialised equipment", "Impossible with ordinary equipment", "Impossible: no surface"];
  const HAB = ["Habitable", "Marginal: domes and suits", "Hostile", "Uninhabitable"];
  const SITEK = [["station", "A station"], ["orbital", "An orbital facility"], ["colony", "A colony"], ["settlement", "A settlement"], ["mining", "A mining installation"], ["research", "A research facility"], ["derelict", "A derelict ship"], ["anomaly", "An anomaly"], ["ruin", "Ruins"], ["other", "Something else"]];
  function bodiesOf(s) {
    const g = G(), info = (s.i >= 0 && Gg.system(g, s.i)) || { star: { name: Gg.STAR_NAME[s.cls] || "", color: (Gg.STARS[s.cls] || Gg.STARS.G)[0] }, planets: [], belts: [], sites: [] }, B = s.bodies || {};
    info.planets = info.planets.map(p => { const e = (B.p || {})[p.n]; return e ? (e.gone ? null : Object.assign({}, p, e, { edited: true })) : p; }).filter(Boolean).concat((B.add || []).map(p => Object.assign({ own: true }, p))).sort((a, b) => a.a - b.a);
    info.belts = info.belts.map((b, k) => (B.b || {})[k] ? null : Object.assign({ k }, b)).filter(Boolean).concat((B.addB || []).map(b => Object.assign({ own: true }, b)));
    info.sites = info.sites.map((t, k) => { const e = (B.s || {})[k]; return e ? (e.gone ? null : Object.assign({ k }, t, e)) : Object.assign({ k }, t); }).filter(Boolean).concat((B.addS || []).map(t => Object.assign({ own: true }, t)));
    return info;
  }
  // a world's warmth where it orbits, and what follows from its numbers: whether anyone could land, live there
  const warmth = (s, a) => Math.round(278 * Math.pow(Math.max((Gg.STARS[s.cls] || Gg.STARS.G)[1], .0001), .25) / Math.sqrt(Math.max(.01, a))) - 273;
  function newWorld(s, kind, a, n) {
    const giant = kind === "gas" || kind === "icegiant", size = kind === "gas" ? 9 : kind === "icegiant" ? 4 : kind === "dwarf" ? .2 : 1, temp = warmth(s, a);
    const air = giant ? "Deep hydrogen and helium" : kind === "dwarf" ? "None" : kind === "garden" ? "Nitrogen and oxygen: breathable" : kind === "toxic" ? "Thick carbon dioxide, sulphur clouds" : kind === "lava" ? "Thin, sulphurous" : "Thin nitrogen";
    const p = { n, name: `${s.name} ${"bcdefghijklmnop"[Math.min(14, n % 15)]}`, kind, kname: Gg.KINDS[kind], a, size, grav: giant ? Math.round(size * .35 * 10) / 10 : size, temp, air, pres: giant ? null : air === "None" ? 0 : kind === "toxic" ? 60 : 1, water: { ocean: "A world ocean", garden: "Seas, lakes and rivers", ice: "Frozen water", lava: "Seas of molten rock" }[kind] || "", life: kind === "garden" ? "Complex life: forests, beasts" : "", hazards: [], minerals: "silicates", moons: giant ? 4 : 0, geo: giant ? "Banded storms over no surface at all" : "", climate: "", chance: "" };
    return derive(p);
  }
  function derive(p) {
    const giant = p.kind === "gas" || p.kind === "icegiant", breath = /breathable/i.test(p.air || "") && !/not|too little/i.test(p.air || "");
    p.land = giant ? LAND[4] : p.pres > 60 || p.temp > 380 ? LAND[3] : p.kind === "toxic" || p.grav > 1.5 || p.temp > 110 || p.temp < -150 ? LAND[2] : breath && p.temp > -30 && p.temp < 45 ? LAND[0] : LAND[1];
    p.hab = breath && p.life && p.temp > -20 && p.temp < 40 && p.grav < 1.4 ? HAB[0] : p.land === LAND[1] ? HAB[1] : p.land.startsWith("Impossible") ? HAB[3] : HAB[2];
    p.climate = giant ? "Storms the size of worlds" : /^none/i.test(p.air || "") ? "None: no air to carry weather" : p.temp > 60 ? "Scorching" : p.temp > 25 ? "Hot" : p.temp > 0 ? "Temperate" : p.temp > -60 ? "Cold" : "Frozen";
    return p;
  }
  // what does not hang together in a world the game master changed: said, never refused (it is their setting)
  function warnings(p, s) {
    const out = [], giant = p.kind === "gas" || p.kind === "icegiant", breath = /breathable/i.test(p.air || "") && !/not|too little/i.test(p.air || ""), exp = warmth(s, p.a);
    if (giant && !/^Impossible/.test(p.land || "")) out.push("A giant has no surface to land on.");
    if (breath && (p.temp > 60 || p.temp < -50)) out.push(`Breathable air at ${p.temp} °C: people could breathe it, but not live in that ${p.temp > 0 ? "heat" : "cold"}.`);
    if (/Seas|ocean|lakes/i.test(p.water || "") && !/molten|acid|under the ice/i.test(p.water || "") && (p.temp < -10 || p.temp > 100)) out.push(`Open water at ${p.temp} °C would ${p.temp < 0 ? "freeze" : "boil away"}.`);
    if (/^none/i.test(p.air || "") && /Seas|ocean|lakes/i.test(p.water || "") && !/molten|under the ice/i.test(p.water || "")) out.push("Open water with no air above it would boil away.");
    if (p.life && /Complex/i.test(p.life) && !p.water) out.push("Complex life with no water.");
    if (p.hab === "Habitable" && !breath) out.push("Called habitable, but the air cannot be breathed.");
    const dens = giant ? .35 : p.kind === "ice" || p.kind === "dwarf" ? .55 : 1, g0 = p.size * dens;
    if (p.size > 0 && Math.abs(p.grav - g0) > Math.max(.6, g0 * .8)) out.push(`Gravity ${p.grav} g for a world ${p.size} times the Earth's size is unusual (about ${Math.round(g0 * 10) / 10} g would be expected).`);
    if (Math.abs(p.temp - exp) > 120 && !giant && p.kind !== "lava") out.push(`At ${p.a} AU from ${s.name} it would be about ${exp} °C, not ${p.temp} °C (a thick atmosphere, an inner heat, or something stranger could explain it).`);
    if (p.kind === "lava" && p.temp < 150) out.push(`A lava world at ${p.temp} °C: its seas would have set hard.`);
    return out;
  }
  function worldForm(s, p) {
    const g = G(), f = (k, l, v, t) => `<label class="tw-l"><span>${l}</span><input class="t-in" name="${k}" ${t === "n" ? 'type="number" step="any"' : 'maxlength="160"'} value="${esc(v == null ? "" : v)}"></label>`;
    const sel = (k, l, opts, v) => `<label class="tw-l"><span>${l}</span><select class="t-in" name="${k}">${opts.map(o => Array.isArray(o) ? o : [o, o]).map(([a, b]) => `<option value="${esc(a)}"${String(a) === String(v) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></label>`;
    const owners = [["", "No one"], ...g.powers.map(x => [x.id, x.name]), ...Object.entries(A.factionsData || {}).filter(([id]) => !g.powers.some(x => x.id === id)).map(([id, x]) => [id, x.n || id])];
    return `<form class="gx-wform" data-gx="saveworld" data-id="${esc(s.id)}" data-n="${p.n}"><h4>Change ${esc(p.name)}</h4>
      ${f("name", "Name", p.name)}${sel("kind", "Kind", Object.entries(Gg.KINDS), p.kind)}${f("a", "Orbit (AU from its star)", p.a, "n")}${f("size", "Size (the Earth is 1)", p.size, "n")}${f("grav", "Gravity (g)", p.grav, "n")}${f("temp", "Warmth at the surface (°C)", p.temp, "n")}
      ${f("air", "Air", p.air)}${f("pres", "Pressure (atmospheres)", p.pres, "n")}${f("climate", "Climate", p.climate)}${f("geo", "Surface", p.geo)}${f("water", "Liquids", p.water)}${f("life", "Life", p.life)}${f("minerals", "Minerals", p.minerals)}${f("hazards", "Dangers (with commas)", (p.hazards || []).join(", "))}
      ${sel("land", "Landing", LAND, p.land)}${sel("hab", "For people", HAB, p.hab)}${f("moons", "Moons", p.moons, "n")}${sel("owner", "Held by", owners, p.owner || "")}${f("gm", "Only you", p.gm)}
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="pedit" data-n="">Cancel</button>${p.edited && !p.own ? `<button type="button" class="t-mini" data-gx="unworld" data-id="${esc(s.id)}" data-n="${p.n}">As it was</button>` : ""}<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="delworld" data-id="${esc(s.id)}" data-n="${p.n}">Take it away</button></div></form>`;
  }
  // the system: its star in the middle, each world on its orbit, belts, and what people put there
  function systemHTML(s, info, places) {
    const W = 320, H = 200, n = info.planets.length + info.belts.length, maxA = Math.max(1, ...info.planets.map(p => p.a), ...info.belts.map(b => b.a));
    const rx = a => 22 + Math.log(1 + a * 6) / Math.log(1 + maxA * 6) * (W / 2 - 34), ang = k => -Math.PI / 2 + k * 2.399;
    const orbits = info.planets.map((p, k) => { const r = rx(p.a), a = ang(k), x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r * .6, pr = p.kind === "gas" ? 7 : p.kind === "icegiant" ? 5.5 : Math.max(2.2, 2 + p.size * 1.6); return `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${r}" ry="${r * .6}" class="gx-orbit"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${pr.toFixed(1)}" class="gx-planet gx-p-${p.kind}${UI.planet === p.n ? " on" : ""}" data-gx="planet" data-n="${p.n}"><title>${esc(p.name)}: ${esc(p.kname)}</title></circle>`; }).join("");
    const belts = info.belts.map(b => { const r = rx(b.a); return `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${r}" ry="${r * .6}" class="gx-belt"/>`; }).join("");
    const p = UI.planet != null ? info.planets.find(x => x.n === UI.planet) : null, ed = UI.tools;
    const onP = n => info.sites.filter(t => t.on === n), here = places.filter(id => (A.meta[id] || {}).planet == null);
    const row = (k, v) => v ? `<div class="gx-f"><span class="kn">${k}</span> ${esc(v)}</div>` : "";
    const siteRow = (lbl, t) => `<div class="gx-f"><span class="kn">${lbl}</span> ${esc(t.name)}${ed ? ` <button type="button" class="t-mini" data-gx="delsite" data-id="${esc(s.id)}" data-k="${t.k}" aria-label="Take away ${esc(t.name)}">×</button>` : ""}</div>`;
    const wn = p ? warnings(p, s) : [], placeHere = p && places.some(id => (A.meta[id] || {}).planet === p.n), canLand = p && !/^Impossible/.test(p.land || "");
    const kinds = Object.entries(Gg.KINDS).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
    return `<section class="gx-card gx-system"><h4>The ${esc(s.name)} system</h4><svg viewBox="0 0 ${W} ${H}" class="gx-sysmap"><rect width="${W}" height="${H}" class="gx-bg"/>${belts}${orbits}<circle cx="${W / 2}" cy="${H / 2}" r="9" fill="${esc(info.star.color)}" class="gx-sun"/></svg>
      <p class="t-small">${info.planets.length ? info.planets.length + " world" + (info.planets.length > 1 ? "s" : "") : "No worlds"}${info.belts.length ? ", " + info.belts.length + " belt" + (info.belts.length > 1 ? "s" : "") : ""}. Click a world to see it.</p>
      ${info.belts.map(b => `<div class="gx-f"><span class="kn">Belt</span> ${esc(b.name)} at ${b.a} AU${b.rich ? ", rich" : ""}${ed ? ` <button type="button" class="t-mini" data-gx="delbelt" data-id="${esc(s.id)}" data-k="${b.k}" aria-label="Take away the belt">×</button>` : ""}</div>`).join("")}
      ${info.sites.filter(t => t.on == null).map(t => siteRow("In orbit", t)).join("")}${here.length ? `<div class="gx-f"><span class="kn">Your places</span> ${here.map(id => `<button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button>`).join(" ")}</div>` : ""}
      ${p ? (ed && UI.pedit === p.n ? worldForm(s, p) : `<div class="gx-world"><h4>${esc(p.name)}: ${esc(p.kname || Gg.KINDS[p.kind] || "")}</h4>${row("Size", p.size + " times the Earth")}${row("Gravity", p.grav + " g")}${row("Warmth", p.temp + " °C at the surface, on average")}${row("Air", p.air)}${p.pres != null ? row("Pressure", p.pres + " atmospheres") : ""}${row("Climate", p.climate)}${row("Surface", p.geo)}${row("Liquids", p.water)}${row("Life", p.life || "None found")}${row("Minerals", p.minerals)}${row("Dangers", (p.hazards || []).join(", "))}${row("Landing", p.land)}${row("For people", p.hab)}${row("Moons", p.moons ? String(p.moons) : "")}${row("To be found", p.chance)}
        ${p.owner ? row("Held by", (G().powers.find(x => x.id === p.owner) || {}).name || ((A.factionsData || {})[p.owner] || {}).n || p.owner) : ""}${p.gm ? `<p class="gx-gm"><span class="kn">Only you</span> ${esc(p.gm)}</p>` : ""}
        ${onP(p.n).map(t => siteRow("Here", t)).join("")}${places.filter(id => (A.meta[id] || {}).planet === p.n).map(id => `<div class="gx-f"><span class="kn">Your place</span> <button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button></div>`).join("")}
        ${wn.length ? `<ul class="gx-risks gx-wn">${wn.map(w => `<li>${esc(w)}</li>`).join("")}</ul><p class="t-small">Allowed: it is your setting. Atlas only says what would not hang together.</p>` : ""}
        ${canLand && !placeHere ? `<details class="gx-how"><summary class="t-small">Its surface as a map to explore</summary><p class="t-small">Ask Claude: “make the surface of ${esc(p.name)} as a place”, or: <code>node atlas.js wild &lt;campaign&gt; ${esc(String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"))} --system ${esc(s.id)} --planet ${p.n}</code></p></details>` : ""}
        ${ed ? `<div class="t-row"><button type="button" class="t-mini" data-gx="pedit" data-n="${p.n}">Change this world</button></div>` : ""}</div>`) : ""}
      ${ed ? `<details class="gx-add"><summary>Add to the system</summary>
        <form class="t-row" data-gx="addworld" data-id="${esc(s.id)}"><select class="t-in" name="kind" aria-label="What kind of world">${kinds}</select><label class="kn">at <input class="t-in t-n" type="number" name="a" min="0.01" step="any" value="${Math.round((Math.max(0, ...info.planets.map(x => x.a)) * 1.6 || 1) * 100) / 100}"> AU</label><button class="t-mini">+ A world</button></form>
        <form class="t-row" data-gx="addsite" data-id="${esc(s.id)}"><select class="t-in" name="kind" aria-label="What">${SITEK.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select><input class="t-in" name="name" placeholder="Its name" maxlength="60"><select class="t-in" name="on" aria-label="Where"><option value="">In orbit</option>${info.planets.map(x => `<option value="${x.n}">On ${esc(x.name)}</option>`).join("")}</select><button class="t-mini">+ Add it</button></form>
        <form class="t-row" data-gx="addbelt" data-id="${esc(s.id)}"><input class="t-in" name="name" placeholder="An asteroid belt" maxlength="60"><label class="kn">at <input class="t-in t-n" type="number" name="a" min="0.01" step="any" value="2.5"> AU</label><button class="t-mini">+ A belt</button></form></details>` : ""}</section>`;
  }
  // a region, a lane, the sectors and powers: what the game master changes of them
  function regHTML(r) {
    const g = G(), n = allSys().filter(s => Math.hypot(s.x - r.x, s.y - r.y) <= r.r).length, X = edits()["~regions"] || {};
    const what = { danger: "Courses through it are warned of, and kept clear of it where another way is near.", restricted: "Courses through it are warned of: someone forbids it.", explored: "The systems in it are on the players' charts from the start.", unexplored: "Courses into it are warned of: no charts reach it." }[r.kind] || "";
    return `<section class="gx-card"><h3>${esc(r.name)}</h3><form data-gx="savereg" data-id="${esc(r.id)}">
      <label class="tw-l"><span>Name</span><input class="t-in" name="name" maxlength="60" value="${esc(r.name)}"></label>
      <label class="tw-l"><span>What it is</span><select class="t-in" name="kind">${REGK.map(([k, l]) => `<option value="${k}"${k === r.kind ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="tw-l"><span>How far it reaches from its middle (light years)</span><input class="t-in" type="number" name="r" min="0.5" step="any" value="${Math.round(r.r * g.ly * 10) / 10}"></label>
      <p class="t-small">${n} system${n === 1 ? "" : "s"} in it. ${what}</p>
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="movereg" data-id="${esc(r.id)}">Move it</button>${!r.own && (X.edit || {})[r.id] ? `<button type="button" class="t-mini" data-gx="unreg" data-id="${esc(r.id)}">As it was</button>` : ""}<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="delreg" data-id="${esc(r.id)}">Take it away</button></div></form></section>`;
  }
  function laneHTML(key) {
    const g = G(), [a, b] = key.split("-").map(Number), p = sys(a), q = sys(b); if (!p || !q) return "";
    const kind = g.laneKind.get(key) || (g.laneLy.has(key) ? "corridor" : "lane"), d = ly(p, q);
    return `<section class="gx-card"><h3>${esc(p.name)} to ${esc(q.name)}</h3><form data-gx="savelane" data-a="${esc(p.id)}" data-b="${esc(q.id)}">
      <label class="tw-l"><span>What it is</span><select class="t-in" name="kind">${LANEK.map(([k, l]) => `<option value="${k}"${k === kind ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="tw-l"><span>Its length in light years (a corridor only; the stars stand ${Math.round(d * 10) / 10} apart)</span><input class="t-in" type="number" name="ly" min="0.1" step="any" value="${g.laneLy.has(key) ? g.laneLy.get(key) : ""}" placeholder="${Math.round(d * 10) / 10}"></label>
      <p class="t-small">Lanes are safer: courses prefer them. A corridor counts its own length for the fuel and the days, and a ship takes it even when the stars stand further apart than it can jump.</p>
      <div class="t-row"><button class="t-btn prim">Keep it</button><span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="cutlane" data-a="${esc(p.id)}" data-b="${esc(q.id)}">Cut it</button></div></form></section>`;
  }
  function spHTML() {
    const g = G(), L = allSys(), nSec = {}, nPw = {}; for (const s of L) { if (s.sec != null) nSec[s.sec] = (nSec[s.sec] || 0) + 1; if (s.pw != null) nPw[s.pw] = (nPw[s.pw] || 0) + 1; }
    return `<section class="gx-card"><h3>Sectors and powers</h3><h4>Sectors</h4><p class="t-small">Every system belongs to the sector whose heart is nearest. + Sector above adds one.</p>
      ${g.sectors.map((c, k) => `<div class="t-row"><input class="t-in" data-gx="secname" data-id="${esc(c.id)}" value="${esc(c.name)}" aria-label="Sector name"><span class="kn">${nSec[k] || 0}</span><button type="button" class="t-mini" data-gx="delsec" data-id="${esc(c.id)}" aria-label="Take away ${esc(c.name)}">×</button></div>`).join("")}
      <h4>Powers</h4><p class="t-small">Paint territory above gives them their stars.</p>
      ${g.powers.map((p, k) => `<div class="t-row"><i class="gx-dot" style="background:${PCOL[k % PCOL.length]}"></i><input class="t-in" data-gx="pwname" data-id="${esc(p.id)}" value="${esc(p.name)}" aria-label="Power name"><span class="kn">${nPw[k] || 0}</span><button type="button" class="t-mini" data-gx="delpw" data-id="${esc(p.id)}" aria-label="Take away ${esc(p.name)}">×</button></div>`).join("")}
      <form class="t-row" data-gx="addpw"><input class="t-in" name="name" placeholder="The name of a new power" maxlength="60"><button class="t-mini">+ Power</button></form>
      <div class="t-row"><button type="button" class="t-mini" data-gx="panel" data-p="">Close</button></div></section>`;
  }
  function side() {
    if (!host) return; const sd = host.querySelector(".gx-side"), s = UI.sel && findSys(UI.sel);
    const g = G(), rg = UI.selReg && g.regions.find(r => r.id === UI.selReg);
    sd.innerHTML = (UI.panel === "sp" ? spHTML() : "") + shipHTML() + (s ? sysHTML(s) : rg ? regHTML(rg) : UI.selLane ? laneHTML(UI.selLane) : `<section class="gx-card"><p class="t-small">Click a star to see its system, plot a course there, or change what the players' charts show. Drag to move; scroll to come closer. Edit the galaxy adds and changes systems, regions, lanes, sectors, powers and their territories.</p></section>`);
  }
  function refresh() { A._galaxy = null; if (host) { base(); over(); side(); tools(); } }

  /* ---- what the game master does */
  const nowWhen = () => A.worldTime ? A.worldTime.at(A.worldTime.now()).short : new Date().toLocaleDateString();
  function setShip(patch, what) { const s = Object.assign({}, (S().get("ship", "now")) || {}, patch); if (what) s.log = (s.log || []).concat({ when: nowWhen(), what }).slice(-60); S().set("ship", "now", s); }
  function onClick(e) {
    const b = e.target.closest("[data-gx]"); if (!b || ["INPUT", "SELECT", "FORM", "TEXTAREA"].includes(b.tagName)) return;
    const k = b.dataset.gx, id = b.dataset.id;
    switch (k) {
      case "zin": zoomAt(1.6); return;
      case "zout": zoomAt(.62); return;
      case "fit": UI.z = 1; UI.cx = 500; UI.cy = 500; view(); return;
      case "ship": { const s = findSys(ship().at); if (s) { UI.sel = s.id; centreOn(s, 3); over(); side(); } return; }
      case "tools": UI.tools = !UI.tools; UI.tool = null; UI.adding = false; UI.first = null; if (!UI.tools) { UI.panel = null; UI.pedit = null; } tools(); side(); return;
      case "tool": { const t = b.dataset.t; if (t === "add") { UI.adding = !UI.adding; UI.tool = null; } else { UI.tool = UI.tool === t ? null : t; UI.adding = false; } UI.first = null; UI.moving = null; UI.movingReg = null; tools(); over(); host.querySelector(".gx-canvas").focus({ preventScroll: true }); return; }
      case "panel": UI.panel = b.dataset.p || null; tools(); side(); return;
      case "undo": undo(true); return;
      case "redo": undo(false); return;
      case "export": exportEdits(); return;
      case "copyjs": { const ta = host.querySelector(".gx-export textarea"); if (!ta) return; ta.select(); const done = () => { b.textContent = "Copied"; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => { try { document.execCommand("copy"); done(); } catch (_) {} }); else { try { document.execCommand("copy"); done(); } catch (_) {} } return; }
      case "pickl": UI.selLane = b.dataset.k; UI.sel = null; UI.selReg = null; refresh(); return;
      case "lanefrom": UI.tool = "lane"; UI.first = id; tools(); return;
      case "movereg": UI.movingReg = id; tools(); if (A.tableUI) A.tableUI.api.note("Click the map where the region's middle should be."); return;
      case "unreg": { const R = doc("~regions"); if (R.edit) delete R.edit[id]; setG("~regions", R); refresh(); return; }
      case "delreg": { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Take it away? Click again"; return; } const R = doc("~regions"); if ((R.add || []).some(a => a.id === id)) R.add = R.add.filter(a => a.id !== id); else { R.edit = R.edit || {}; R.edit[id] = Object.assign(R.edit[id] || {}, { gone: true }); } setG("~regions", R); UI.selReg = null; refresh(); return; }
      case "cutlane": { const L = doc("~lanes"), a = b.dataset.a, c = b.dataset.b, same = x => (x[0] === a && x[1] === c) || (x[0] === c && x[1] === a); L.add = (L.add || []).filter(x => !same(x)); L.cut = (L.cut || []).filter(x => !same(x)).concat([[a, c]]); setG("~lanes", L); UI.selLane = null; refresh(); return; }
      case "delsec": case "delpw": { const key = k === "delsec" ? "~sectors" : "~powers", X = doc(key); if ((X.add || []).some(a => a.id === id)) X.add = X.add.filter(a => a.id !== id); else { X.edit = X.edit || {}; X.edit[id] = Object.assign(X.edit[id] || {}, { gone: true }); } setG(key, X); refresh(); return; }
      case "pedit": UI.pedit = b.dataset.n === "" ? null : +b.dataset.n; break;
      case "ask": { const s = findSys(id); if (s && A.askChange) A.askChange(askSys(s)); return; }
      case "delworld": case "unworld": case "delsite": case "delbelt": {
        const n = +(b.dataset.n != null ? b.dataset.n : b.dataset.k), D = doc(id), B = D.bodies = D.bodies || {};
        if (k === "delworld") { if ((B.add || []).some(p => p.n === n)) B.add = B.add.filter(p => p.n !== n); else { B.p = B.p || {}; B.p[n] = { gone: true }; } UI.planet = null; UI.pedit = null; }
        else if (k === "unworld") { if (B.p) delete B.p[n]; UI.pedit = null; }
        else if (k === "delsite") { if ((B.addS || []).some(t => t.k === n)) B.addS = B.addS.filter(t => t.k !== n); else { B.s = B.s || {}; B.s[n] = { gone: true }; } }
        else { if ((B.addB || []).some(t => t.k === n)) B.addB = B.addB.filter(t => t.k !== n); else { B.b = B.b || {}; B.b[n] = 1; } }
        setG(id, D); refresh(); return;
      }
      case "pick": { const s = findSys(id); if (s) { UI.sel = id; centreOn(s, 2.5); over(); side(); } return; }
      case "plot": { const c = course(ship().at, id); UI.plan = Object.assign({ to: id }, c); over(); side(); return; }
      case "jump": {
        const p = UI.plan; if (!p || !p.ok || !p.path) return;
        if (p.risks.length && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Sure? " + p.risks.length + " danger" + (p.risks.length > 1 ? "s" : "") + " on the way: click again"; return; }
        const dest = findSys(p.to); setShip({ at: p.to, fuel: Math.max(0, p.left) }, `To ${dest.name}: ${round1(p.ly)} ly in ${round1(p.days)} days${p.fuel ? ", " + Math.ceil(p.fuel) + " fuel" : ""}`);
        for (const sid of p.path.slice(1)) S().set("charts", sid, Object.assign({}, S().get("charts", sid) || {}, { state: "visited", how: (S().get("charts", sid) || {}).how || "explored", t: Date.now() }));
        if (A.worldTime && p.days > 0) A.worldTime.advance(Math.round(p.days * 1440));
        if (A.tableUI) A.tableUI.api.note(`The ship arrives at ${dest.name}.`);
        UI.plan = null; break;
      }
      case "refuel": { const sh = ship(); setShip({ fuel: sh.cap }, `Refuelled at ${(findSys(sh.at) || {}).name || sh.at}`); break; }
      case "open": UI.sys = UI.sys === id ? null : id; UI.planet = null; break;
      case "planet": UI.planet = +b.dataset.n; UI.pedit = null; break;
      case "edit": UI.edit = UI.edit === id ? null : id; break;
      case "move": UI.moving = id; tools(); if (A.tableUI) A.tableUI.api.note("Click the map where it should stand."); return;
      case "unedit": setG(id, null); UI.edit = null; refresh(); return;
      case "remove": if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Take it off? Click again"; return; } setG(id, Object.assign(doc(id), { gone: true })); UI.sel = null; UI.edit = null; refresh(); return;
      default: return;
    }
    over(); side();
  }
  function onChange(e) {
    const t = e.target, k = t.dataset && t.dataset.gx; if (!k) return;
    if (k === "paint") { UI.paint = t.value; return; }
    if (k === "secname" || k === "pwname") { const key = k === "secname" ? "~sectors" : "~powers", X = doc(key), id = t.dataset.id, v = t.value.trim(); if (!v) return; const own = (X.add || []).find(a => a.id === id); if (own) own.name = v; else { X.edit = X.edit || {}; X.edit[id] = Object.assign(X.edit[id] || {}, { name: v }); } setG(key, X); t.blur(); refresh(); return; }
    if (k === "chart" || k === "how") { const c = Object.assign({}, S().get("charts", t.dataset.id) || {}, k === "chart" ? { state: t.value } : { how: t.value }, { t: Date.now() }); S().set("charts", t.dataset.id, c); refresh(); }
    else if (k === "cond") setShip({ condition: t.value }, `Now ${t.value.toLowerCase()}`);
    else if (k === "rule") S().set("ship", "rule", { fuel: t.value });
    if (UI.plan) UI.plan = Object.assign({ to: UI.plan.to }, course(ship().at, UI.plan.to));
    over(); side();
  }
  function onSubmit(e) {
    const f = e.target, k = f.dataset && f.dataset.gx; if (!k) return; e.preventDefault();
    if (document.activeElement && f.contains(document.activeElement)) document.activeElement.blur();
    const v = n => (f.elements[n] ? String(f.elements[n].value).trim() : ""), num = (n, d) => { const x = parseFloat(v(n)); return Number.isFinite(x) ? x : d; }, id = f.dataset.id;
    if (k === "save") {
      const s = findSys(id), fl = {};
      for (const q of ["colony", "station", "fuel", "mining", "research", "derelict", "anomaly"]) fl[q] = f.elements["f_" + q].checked ? 1 : 0;
      setG(id, Object.assign(doc(id), { name: v("name") || s.name, cls: v("cls"), bin: f.elements.bin.checked, f: fl, desc: v("desc"), gm: v("gm"), t: Date.now() }));
      // (who holds it: the territories' own document)
      const was = s.pw != null && G().powers[s.pw] ? G().powers[s.pw].id : "", now = v("owner");
      if (now !== was) setG("~terr", Object.assign(doc("~terr"), { [id]: now }));
      UI.edit = null;
    } else if (k === "savereg") {
      const R = doc("~regions"), body = { name: v("name") || "A region", kind: v("kind"), r: Math.max(.5, num("r", 3)) / G().ly }, own = (R.add || []).find(a => a.id === id);
      if (own) Object.assign(own, body); else { R.edit = R.edit || {}; R.edit[id] = Object.assign(R.edit[id] || {}, body); }
      setG("~regions", R);
    } else if (k === "savelane") {
      const L = doc("~lanes"), a = f.dataset.a, c = f.dataset.b, same = x => (x[0] === a && x[1] === c) || (x[0] === c && x[1] === a), kind = v("kind"), lyv = kind === "corridor" ? num("ly", 0) : 0;
      L.add = (L.add || []).filter(x => !same(x)).concat([[a, c, kind, lyv > 0 ? lyv : (kind === "corridor" ? Math.round(ly(findSys(a), findSys(c)) * 5) / 10 : 0)]]); L.cut = (L.cut || []).filter(x => !same(x));
      setG("~lanes", L);
    } else if (k === "saveworld") {
      const s = findSys(id), n = +f.dataset.n, D = doc(id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), p0 = info.planets.find(x => x.n === n) || {};
      const p = { name: v("name") || p0.name, kind: v("kind"), kname: Gg.KINDS[v("kind")], a: Math.max(.01, num("a", p0.a)), size: Math.max(.01, num("size", p0.size)), grav: Math.max(0, num("grav", p0.grav)), temp: Math.round(num("temp", p0.temp)), air: v("air"), pres: v("pres") === "" ? null : Math.max(0, num("pres", 0)), climate: v("climate"), geo: v("geo"), water: v("water"), life: v("life"), minerals: v("minerals"), hazards: v("hazards").split(",").map(x => x.trim()).filter(Boolean), land: v("land"), hab: v("hab"), moons: Math.max(0, Math.round(num("moons", 0))), owner: v("owner") || null, gm: v("gm") };
      const own = (B.add || []).find(x => x.n === n);
      if (own) Object.assign(own, p); else { B.p = B.p || {}; B.p[n] = p; }
      setG(id, D); UI.pedit = null;
    } else if (k === "addworld") {
      const s = findSys(id), D = doc(id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), n = Math.max(99, ...info.planets.map(x => x.n)) + 1;
      B.add = (B.add || []).concat(newWorld(s, v("kind"), Math.max(.01, num("a", 1)), n)); setG(id, D); UI.planet = n; UI.pedit = n;
    } else if (k === "addsite" || k === "addbelt") {
      const s = findSys(id), D = doc(id), B = D.bodies = D.bodies || {}, info = bodiesOf(s);
      if (k === "addsite") { const kind = v("kind"), nk = Math.max(99, ...info.sites.map(x => x.k)) + 1; B.addS = (B.addS || []).concat({ k: nk, kind, name: v("name") || (SITEK.find(x => x[0] === kind) || [0, "A site"])[1], on: v("on") === "" ? null : +v("on") }); }
      else { const nk = Math.max(99, ...info.belts.map(x => x.k)) + 1; B.addB = (B.addB || []).concat({ k: nk, a: Math.max(.01, num("a", 2.5)), name: v("name") || "An asteroid belt", rich: false }); }
      setG(id, D);
    } else if (k === "addpw") {
      const name = v("name"); if (!name) return; const X = doc("~powers"); X.add = (X.add || []).concat({ id: "pw" + Date.now().toString(36), name }); setG("~powers", X);
    } else return;
    refresh();
  }
  // the changes as the campaign keeps them: table.js, ATLAS.galaxyEdit({ edits }) (laid under the page's own)
  function exportEdits() {
    const all = Object.assign({}, (A.galaxyOver || {}).edits || {}, edits());
    const js = `// The galaxy as the game master changed it on the page (${new Date().toISOString().slice(0, 10)}). Put it in table.js;\n// the page's own changes stay over it until "As it was".\nATLAS.galaxyEdit({ edits: ${JSON.stringify(all, null, 1)} });\n`;
    const sd = host.querySelector(".gx-side");
    sd.insertAdjacentHTML("afterbegin", `<section class="gx-card gx-export"><h3>Copy the changes</h3><p class="t-small">Everything you changed in the galaxy, for the campaign's table.js.</p><textarea class="t-in" rows="10" readonly>${esc(js)}</textarea><div class="t-row"><button type="button" class="t-mini" data-gx="copyjs">Copy</button><button type="button" class="t-mini" data-gx="panel" data-p="">Close</button></div></section>`);
    const ta = sd.querySelector(".gx-export textarea"); ta.focus(); ta.select();
  }

  /* ---- for the players: the charted systems, their lanes, the ship, sent by the game master's page (atlas-share.js) */
  A.galaxyShare = function (st) {
    if (!A.galaxyParams) return null; ST = ST || st;
    const g = G(), L = allSys().filter(s => known(chartOf(s.id)) && chartOf(s.id) !== "hidden"), ids = new Set(L.map(s => s.id)), sh = ship();
    const lanes = g.lanes.map(([a, b]) => [g.systems[a].id, g.systems[b].id]).filter(([a, b]) => ids.has(a) && ids.has(b) && chartOf(a) !== "rumoured" && chartOf(b) !== "rumoured");
    const regions = g.regions.filter(r => r.kind === "explored" || L.some(s => Math.hypot(r.x - s.x, r.y - s.y) <= r.r && chartOf(s.id) === "visited")).map(r => ({ kind: r.kind, x: r.x, y: r.y, r: r.r, name: r.name }));
    return { name: (A.galaxyParams || {}).name || "", systems: L.map(s => ({ id: s.id, name: chartOf(s.id) === "rumoured" ? s.name + "?" : s.name, x: s.x, y: s.y, color: (Gg.STARS[s.cls] || Gg.STARS.G)[0], state: chartOf(s.id) })), lanes, regions, ship: ids.has(sh.at) ? sh.at : null };
  };

  // the view, mounted by the page's shell when the game master opens it (atlas-shell.js)
  A.galaxyMount = el => { if (!host || host !== el) mount(el); else { refresh(); } return { wake: refresh }; };
  // (a system chosen from outside the chart: a place's trail back up to the stars)
  A.galaxyFocus = id => { if (!host) return; const s = findSys(id); if (!s) return; UI.sel = id; centreOn(s, 2.5); over(); side(); };
  if (A.tableUI) { const iv = setInterval(() => { const st = A.tableUI.api.store(); if (!st) return; clearInterval(iv); ST = st; for (const c of ["charts", "ship", "gedits"]) st.watch(c, () => { if (host && host.isConnected && host.offsetParent) { if (c === "gedits" || c === "charts") refresh(); else { over(); side(); } } }); }, 200); setTimeout(() => clearInterval(iv), 120000); }
})(ATLAS);
