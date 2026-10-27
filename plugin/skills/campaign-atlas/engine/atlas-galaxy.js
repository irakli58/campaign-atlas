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
    A._galaxy = g; return g;
  }
  A.galaxyApi = { G, reset: () => { A._galaxy = null; } };

  /* ---- the table's store: charts, the ship, the game master's changes */
  let ST = null; const S = () => ST || (A.tableUI && A.tableUI.api.store());
  const edits = () => (S() && S().get("gedits")) || {};
  // a system as it stands now: grown, the council's names, the game master's changes, or added by the game master
  function sys(i) {
    const g = G(), s = g.systems[i]; if (!s) return null; const e = edits()[s.id];
    return e ? Object.assign({}, s, e, { f: Object.assign({}, s.f, e.f || {}) }) : s;
  }
  const added = () => Object.entries(edits()).filter(([, e]) => e && e.added).map(([id, e]) => Object.assign({ id, i: -1, f: {} }, e));
  const allSys = () => G().systems.map((s, i) => sys(i)).filter(s => !s.gone).concat(added().filter(s => !s.gone));
  const findSys = id => { const g = G(); if (g.byId[id]) return sys(g.byId[id].i); return added().find(s => s.id === id) || null; };
  const chartOf = id => { const c = (S() && S().get("charts", id)) || null, s = findSys(id); if (c && c.state) return c.state; if (s && s.state0) return s.state0; if (s && G().regions.some(g => g.kind === "explored" && Math.hypot(g.x - s.x, g.y - s.y) <= g.r)) return "charted"; return "unknown"; };
  const known = st => st === "charted" || st === "visited" || st === "rumoured";
  const defShip = () => Object.assign({ name: "The ship", cap: 40, burn: 1, range: 12, speed: 3, cargo: 0, cargoCap: 100, crew: "", equipment: [], upgrades: [], condition: "Sound" }, (A.galaxyOver || {}).ship || {});
  const ship = () => { const s = (S() && S().get("ship", "now")) || {}, d = defShip(), g = G(); return Object.assign({}, d, { at: g.systems[g.home].id, fuel: d.fuel != null ? d.fuel : d.cap }, s); };
  const fuelRule = () => { const k = (S() && (S().get("ship", "rule") || {}).fuel) || (A.galaxyOver || {}).fuel || "normal"; return FUEL.find(f => f[0] === k) || FUEL[2]; };
  const idx = id => { const s = findSys(id); return s ? s.i : -1; };
  const ly = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * G().ly;

  /* ---- a course: hop by hop within the ship's reach, with fuel, days, dangers and the places to refuel */
  function course(fromId, toId) {
    const g = G(), sh = ship(), rule = fuelRule(), a = idx(fromId), b = idx(toId); if (a < 0 || b < 0) return { ok: false, why: "That system cannot be reached by the charts (one the game master added stands apart from the lanes)." };
    const dangerAt = j => g.regions.filter(r => r.kind === "danger" && Math.hypot(r.x - g.systems[j].x, r.y - g.systems[j].y) <= r.r).length * 3;
    const path = Gg.route(g, a, b, sh.range * ({ Sound: 1, Worn: .9, Damaged: .7, Crippled: .45 }[sh.condition] || 1), { risk: (i, j) => dangerAt(j), can: j => !sys(j).gone });
    if (!path) return { ok: false, why: `No way there within the ship's reach of ${round1(sh.range)} light years a jump${sh.condition !== "Sound" ? " (less, as it is " + sh.condition.toLowerCase() + ")" : ""}.` };
    const laneSet = g._laneSet; let fuel = +sh.fuel, total = 0, days = 0, need = 0, lowest = fuel, fails = null; const stops = [], risks = [], legs = [];
    for (let k = 1; k < path.length; k++) {
      const p = sys(path[k - 1]), q = sys(path[k]), d = ly(p, q), f = d * sh.burn * rule[2];
      if (k > 1 && p.f.fuel) { stops.push(p.name); if (sh.refuel !== false) fuel = sh.cap; }
      total += d; days += d / Math.max(.1, sh.speed); need += f; fuel -= f; lowest = Math.min(lowest, fuel);
      if (fuel < -1e-9 && !fails) fails = `The fuel runs out on the jump from ${p.name} to ${q.name}.`;
      const lane = laneSet.has(Math.min(path[k - 1], path[k]) + "-" + Math.max(path[k - 1], path[k]));
      legs.push({ from: p.name, to: q.name, ly: d, lane });
      for (const r of g.regions) if (Math.hypot(r.x - q.x, r.y - q.y) <= r.r) { if (r.kind === "danger") risks.push(`${q.name} lies in ${r.name}`); if (r.kind === "restricted") risks.push(`${q.name} lies in restricted space: ${r.name}`); }
      if (!known(chartOf(q.id))) risks.push(`${q.name} is not on their charts`);
      if (!lane) risks.push(`The jump from ${p.name} to ${q.name} is off the lanes`);
      if (q.f.anomaly) risks.push(`Something strange at ${q.name}`);
    }
    if (rule[2] && fuel < sh.cap * .15 && !fails) risks.push(`They arrive with ${Math.max(0, Math.round(fuel))} of ${sh.cap} fuel`);
    return { ok: !fails || !rule[2], why: rule[2] ? fails : null, path: path.map(i => sys(i).id), ly: total, days, fuel: rule[2] ? need : 0, left: rule[2] ? fuel : sh.fuel, stops, risks: [...new Set(risks)], legs };
  }
  const round1 = v => Math.round(v * 10) / 10;

  /* ---- the view */
  const UI = { sel: null, sys: null, planet: null, plan: null, z: 1, cx: 500, cy: 500, edit: null, adding: false, moving: null, filter: "" };
  let host = null, svg = null, drag = null;
  function mount(el) {
    host = el; host.innerHTML = `<div class="gx-wrap"><div class="gx-map"><div class="gx-bar"><input type="search" class="gx-find" placeholder="Find a system" aria-label="Find a system"><button type="button" class="gx-b" data-gx="zin" aria-label="Closer">+</button><button type="button" class="gx-b" data-gx="zout" aria-label="Further">−</button><button type="button" class="gx-b" data-gx="fit">The whole galaxy</button><button type="button" class="gx-b" data-gx="ship">The ship</button><button type="button" class="gx-b" data-gx="add" aria-pressed="false" title="Then click the map where it stands">Add a system</button></div><div class="gx-canvas"></div><div class="gx-key"></div></div><aside class="gx-side"></aside></div>`;
    svg = null; base(); over(); side();
    const cv = host.querySelector(".gx-canvas");
    cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : .8, e); }, { passive: false });
    cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, cx: UI.cx, cy: UI.cy, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (!drag) return; const k = viewW() / cv.clientWidth, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true; UI.cx = drag.cx - dx; UI.cy = drag.cy - dy; view(); });
    cv.addEventListener("pointerup", e => { const d = drag; drag = null; if (d && !d.moved) clickAt(e); });
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
    const lanes = g.lanes.map(([a, b]) => { const p = sys(a), q = sys(b); return p.gone || q.gone ? "" : `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="gx-lane"/>`; }).join("");
    const stars = L.map(s => { const st = chartOf(s.id), c = (Gg.STARS[s.cls] || Gg.STARS.G)[0]; return `<circle cx="${s.x}" cy="${s.y}" r="${s.cls === "O" || s.cls === "B" ? 2.6 : s.cls === "X" ? 2.2 : 1.8}" fill="${c}" class="gx-star gx-${st}" data-sys="${esc(s.id)}"/>`; }).join("");
    cv.innerHTML = `<svg class="gx-svg" role="img" aria-label="${esc((A.galaxyParams || {}).name || "The galaxy")}"><rect x="-500" y="-500" width="2000" height="2000" class="gx-bg"/><g class="gx-terrs">${terr}</g>${g.regions.map(r => `<circle cx="${r.x}" cy="${r.y}" r="${r.r}" class="gx-reg gx-${r.kind}"><title>${esc(r.name)}</title></circle>`).join("")}${g.sectors.map(c => `<text x="${c.x}" y="${c.y}" class="gx-sector">${esc(c.name)}</text>`).join("")}<g class="gx-lanes">${lanes}</g><g class="gx-stars">${stars}</g><g class="gx-over"></g><g class="gx-labels"></g></svg>`;
    svg = cv.querySelector("svg"); view();
    const key = host.querySelector(".gx-key");
    key.innerHTML = `${g.powers.map((p, k) => `<span><i style="background:${PCOL[k % PCOL.length]}"></i>${esc(p.name)}</span>`).join("")}<span><i class="gx-k-danger"></i>Dangerous</span><span><i class="gx-k-restricted"></i>Restricted</span><span><i class="gx-k-explored"></i>Charted space</span>`;
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
    if (UI.adding) { const id = "C" + Date.now().toString(36); S().set("gedits", id, { added: true, name: "A new system", cls: "G", x: Math.round(wx * 10) / 10, y: Math.round(wy * 10) / 10, f: {}, t: Date.now() }); UI.adding = false; UI.sel = id; UI.edit = id; refresh(); return; }
    if (UI.moving) { const id = UI.moving, e2 = Object.assign({}, edits()[id] || {}, { x: Math.round(wx * 10) / 10, y: Math.round(wy * 10) / 10 }); S().set("gedits", id, e2); UI.moving = null; A._galaxy = null; refresh(); return; }
    let best = null, bd = (14 / Math.sqrt(UI.z)) ** 2; for (const s of allSys()) { const d = (s.x - wx) ** 2 + (s.y - wy) ** 2; if (d < bd) { bd = d; best = s; } }
    if (best) { UI.sel = best.id; UI.sys = null; UI.planet = null; UI.plan = null; over(); side(); }
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
    const st = chartOf(s.id), c = (S() && S().get("charts", s.id)) || {}, g = G(), sh = ship(), here = sh.at === s.id, info = s.i >= 0 ? Gg.system(g, s.i) : { star: { name: Gg.STAR_NAME[s.cls] || "", color: (Gg.STARS[s.cls] || Gg.STARS.G)[0] }, planets: [], belts: [], sites: [] };
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
      <div class="t-row">${here ? `<span class="kn">The ship is here.</span>` : `<button type="button" class="t-btn prim" data-gx="plot" data-id="${esc(s.id)}">Plot a course here</button>`}<button type="button" class="t-mini" data-gx="open" data-id="${esc(s.id)}">${UI.sys === s.id ? "Close the system" : "Open the system"}</button><button type="button" class="t-mini" data-gx="edit" data-id="${esc(s.id)}">Change it</button></div></section>
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
  function editHTML(s) {
    const e = edits()[s.id] || {}, ov = ((A.galaxyOver || {}).systems || {})[s.id] || {};
    return `<section class="gx-card"><h4>Change ${esc(s.name)}</h4><form data-gx="save" data-id="${esc(s.id)}">
      <label class="tw-l"><span>Name</span><input class="t-in" name="name" maxlength="60" value="${esc(s.name)}"></label>
      <label class="tw-l"><span>Its star</span><select class="t-in" name="cls">${Object.keys(Gg.STARS).map(k => `<option value="${k}"${k === s.cls ? " selected" : ""}>${esc(Gg.STAR_NAME[k])}</option>`).join("")}</select></label>
      <div class="tj-keys">${[["colony", "A colony"], ["station", "A station"], ["fuel", "Fuel"], ["mining", "Mining"], ["research", "Research"], ["derelict", "A derelict"], ["anomaly", "An anomaly"]].map(([k, l]) => `<label class="t-fogck"><input type="checkbox" name="f_${k}"${s.f[k] ? " checked" : ""}> ${l}</label>`).join("")}</div>
      <label class="tw-l"><span>What it is</span><textarea class="t-in" name="desc" rows="2">${esc(e.desc || ov.desc || s.desc || "")}</textarea></label>
      <label class="tw-l"><span>Only you</span><textarea class="t-in" name="gm" rows="2">${esc(e.gm || ov.gm || s.gm || "")}</textarea></label>
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="move" data-id="${esc(s.id)}">Move it</button>${Object.keys(e).length && !e.added ? `<button type="button" class="t-mini" data-gx="unedit" data-id="${esc(s.id)}">As it was</button>` : ""}<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="remove" data-id="${esc(s.id)}">Take it off the map</button></div></form></section>`;
  }
  // the system: its star in the middle, each world on its orbit, belts, and what people put there
  function systemHTML(s, info, places) {
    const W = 320, H = 200, n = info.planets.length + info.belts.length, maxA = Math.max(1, ...info.planets.map(p => p.a), ...info.belts.map(b => b.a));
    const rx = a => 22 + Math.log(1 + a * 6) / Math.log(1 + maxA * 6) * (W / 2 - 34), ang = k => -Math.PI / 2 + k * 2.399;
    const orbits = info.planets.map((p, k) => { const r = rx(p.a), a = ang(k), x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r * .6, pr = p.kind === "gas" ? 7 : p.kind === "icegiant" ? 5.5 : Math.max(2.2, 2 + p.size * 1.6); return `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${r}" ry="${r * .6}" class="gx-orbit"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${pr.toFixed(1)}" class="gx-planet gx-p-${p.kind}${UI.planet === p.n ? " on" : ""}" data-gx="planet" data-n="${p.n}"><title>${esc(p.name)}: ${esc(p.kname)}</title></circle>`; }).join("");
    const belts = info.belts.map(b => { const r = rx(b.a); return `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${r}" ry="${r * .6}" class="gx-belt"/>`; }).join("");
    const p = UI.planet != null ? info.planets.find(x => x.n === UI.planet) : null;
    const onP = n => info.sites.filter(t => t.on === n), here = places.filter(id => (A.meta[id] || {}).planet == null);
    const row = (k, v) => v ? `<div class="gx-f"><span class="kn">${k}</span> ${esc(v)}</div>` : "";
    return `<section class="gx-card gx-system"><h4>The ${esc(s.name)} system</h4><svg viewBox="0 0 ${W} ${H}" class="gx-sysmap"><rect width="${W}" height="${H}" class="gx-bg"/>${belts}${orbits}<circle cx="${W / 2}" cy="${H / 2}" r="9" fill="${esc(info.star.color)}" class="gx-sun"/></svg>
      <p class="t-small">${info.planets.length ? info.planets.length + " world" + (info.planets.length > 1 ? "s" : "") : "No worlds"}${info.belts.length ? ", " + info.belts.length + " belt" + (info.belts.length > 1 ? "s" : "") : ""}. Click a world to see it.</p>
      ${info.sites.filter(t => t.on == null).map(t => `<div class="gx-f"><span class="kn">In orbit</span> ${esc(t.name)}</div>`).join("")}${here.length ? `<div class="gx-f"><span class="kn">Your places</span> ${here.map(id => `<button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button>`).join(" ")}</div>` : ""}
      ${p ? `<div class="gx-world"><h4>${esc(p.name)}: ${esc(p.kname)}</h4>${row("Size", p.size + " times the Earth")}${row("Gravity", p.grav + " g")}${row("Warmth", p.temp + " °C at the surface, on average")}${row("Air", p.air)}${p.pres != null ? row("Pressure", p.pres + " atmospheres") : ""}${row("Climate", p.climate)}${row("Surface", p.geo)}${row("Liquids", p.water)}${row("Life", p.life || "None found")}${row("Minerals", p.minerals)}${row("Dangers", p.hazards.join(", "))}${row("Landing", p.land)}${row("For people", p.hab)}${row("Moons", p.moons ? String(p.moons) : "")}${row("To be found", p.chance)}
        ${onP(p.n).map(t => row("Here", t.name)).join("")}${places.filter(id => (A.meta[id] || {}).planet === p.n).map(id => `<div class="gx-f"><span class="kn">Your place</span> <button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button></div>`).join("")}</div>` : ""}</section>`;
  }
  function side() {
    if (!host) return; const sd = host.querySelector(".gx-side"), s = UI.sel && findSys(UI.sel);
    sd.innerHTML = shipHTML() + (s ? sysHTML(s) : `<section class="gx-card"><p class="t-small">Click a star to see its system, plot a course there, or change what the players' charts show. Drag to move; scroll to come closer.</p></section>`);
  }
  function refresh() { A._galaxy = null; if (host) { base(); over(); side(); } }

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
      case "add": UI.adding = !UI.adding; b.setAttribute("aria-pressed", UI.adding); return;
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
      case "planet": UI.planet = +b.dataset.n; break;
      case "edit": UI.edit = UI.edit === id ? null : id; break;
      case "move": UI.moving = id; if (A.tableUI) A.tableUI.api.note("Click the map where it should stand."); return;
      case "unedit": S().set("gedits", id, null); UI.edit = null; refresh(); return;
      case "remove": if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Take it off? Click again"; return; } S().set("gedits", id, Object.assign({}, edits()[id] || {}, { gone: true })); UI.sel = null; UI.edit = null; refresh(); return;
      default: return;
    }
    over(); side();
  }
  function onChange(e) {
    const t = e.target, k = t.dataset && t.dataset.gx; if (!k) return;
    if (k === "chart" || k === "how") { const c = Object.assign({}, S().get("charts", t.dataset.id) || {}, k === "chart" ? { state: t.value } : { how: t.value }, { t: Date.now() }); S().set("charts", t.dataset.id, c); refresh(); }
    else if (k === "cond") setShip({ condition: t.value }, `Now ${t.value.toLowerCase()}`);
    else if (k === "rule") S().set("ship", "rule", { fuel: t.value });
    if (UI.plan) UI.plan = Object.assign({ to: UI.plan.to }, course(ship().at, UI.plan.to));
    over(); side();
  }
  function onSubmit(e) {
    const f = e.target; if (!f.dataset || f.dataset.gx !== "save") return; e.preventDefault();
    const id = f.dataset.id, s = findSys(id), cur = edits()[id] || {}, fl = {};
    for (const k of ["colony", "station", "fuel", "mining", "research", "derelict", "anomaly"]) fl[k] = f.elements["f_" + k].checked ? 1 : 0;
    S().set("gedits", id, Object.assign({}, cur, { name: f.elements.name.value.trim() || s.name, cls: f.elements.cls.value, f: fl, desc: f.elements.desc.value.trim(), gm: f.elements.gm.value.trim(), t: Date.now() }));
    UI.edit = null; refresh();
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
  if (A.tableUI) { const iv = setInterval(() => { const st = A.tableUI.api.store(); if (!st) return; clearInterval(iv); ST = st; for (const c of ["charts", "ship", "gedits"]) st.watch(c, () => { if (host && host.isConnected && host.offsetParent) { if (c === "gedits" || c === "charts") refresh(); else { over(); side(); } } }); }, 200); setTimeout(() => clearInterval(iv), 120000); }
})(ATLAS);
