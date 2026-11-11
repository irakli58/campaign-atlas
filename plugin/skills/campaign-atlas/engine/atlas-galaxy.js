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
    if (o && o.sys && d && d.sysmaps && d.sysmaps[o.sys]) return sysDraw(d.sysmaps[o.sys]);
    if (!d || (!(d.systems || []).length && !(d.things || []).length)) return `<div class="gx-empty">No star charts yet.</div>`;
    const S = d.systems, by = {}; for (const s of S) by[s.id] = s;
    const PT = S.concat(d.things || []), xs = PT.map(s => s.x), ys = PT.map(s => s.y), pad = 40, x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(160, Math.max(...xs) - x0 + pad), h = Math.max(120, Math.max(...ys) - y0 + pad);
    return `<svg class="gx-svg gx-players" viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="${esc(d.name || "The star chart")}"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" class="gx-bg"/>
      ${(d.regions || []).map(g => `<circle cx="${g.x}" cy="${g.y}" r="${g.r}" class="gx-reg gx-${esc(g.kind)}"><title>${esc(g.name || "")}</title></circle>`).join("")}
      ${(d.lanes || []).map(([a, b]) => by[a] && by[b] ? `<line x1="${by[a].x}" y1="${by[a].y}" x2="${by[b].x}" y2="${by[b].y}" class="gx-lane"/>` : "").join("")}
      ${S.map(s => `<g class="gx-sys${s.state === "visited" ? " v" : ""}"><circle cx="${s.x}" cy="${s.y}" r="${s.state === "rumoured" ? 2.4 : 3.6}" fill="${s.state === "rumoured" ? "none" : esc(s.color || "#fff")}" stroke="${esc(s.color || "#fff")}"/><text x="${s.x + 6}" y="${s.y + 3}" style="font-size:${Math.max(7, w / 70)}px">${esc(s.name)}</text></g>`).join("")}
      ${(d.things || []).map(t => t.r ? `<g class="gx-pthing"><circle cx="${t.x}" cy="${t.y}" r="${Math.max(2, t.r / Math.max(1e-6, d.ly || .1))}" fill="rgba(190,150,220,.12)" stroke="rgba(200,214,240,.4)" stroke-dasharray="3 4"/><text x="${t.x}" y="${t.y}" text-anchor="middle" style="font-size:${Math.max(7, w / 75)}px">${esc(t.name)}</text></g>` : `<g class="gx-pthing"><rect x="${t.x - 2.6}" y="${t.y - 2.6}" width="5.2" height="5.2" transform="rotate(45 ${t.x} ${t.y})" fill="${t.signal ? "#ff6b6b" : "#e8dcc0"}"/><text x="${t.x + 6}" y="${t.y + 3}" style="font-size:${Math.max(7, w / 72)}px">${esc(t.name)}</text></g>`).join("")}
      ${(d.things || []).filter(t => t.pingT && Date.now() - t.pingT < 90000).map(t => `<g class="gx-ping"><circle cx="${t.x}" cy="${t.y}" r="4"><animate attributeName="r" from="4" to="${Math.max(24, w / 14)}" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" from=".9" to="0" dur="1.8s" repeatCount="indefinite"/></circle></g>`).join("")}
      ${d.ship && by[d.ship] ? (() => { const n = d.shipNear && (d.things || []).find(t => t.id === d.shipNear), p = n || by[d.ship]; return `${d.reach > 0 ? `<circle class="gx-preach" cx="${p.x}" cy="${p.y}" r="${d.reach}"><title>How far the ship's sensors reach</title></circle>` : ""}<g class="gx-ship"><circle cx="${p.x}" cy="${p.y}" r="${Math.max(6, w / 60)}"/></g>`; })() : ""}</svg>${(d.things || []).some(t => t.signal) ? `<div class="gx-psig"><h4>Signals received</h4>${d.things.filter(t => t.signal).map(t => `<p><b>${esc(t.name)}</b>: “${esc(t.signal)}”</p>`).join("")}</div>` : ""}${(d.worlds || []).length ? `
      <details class="gx-pworlds"><summary>The worlds you have scanned (${d.worlds.length})</summary>${d.worlds.map(x => `<section><h4>${esc(x.name)} <span>${esc(x.sys)} · ${esc(x.level)}</span></h4><table class="gx-pt">${(x.rows || []).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table></section>`).join("")}</details>` : ""}`;
  };

  // a system's own map on the players' screen (the galaxy plan, section 6): distances squeezed as on the game master's
  // map, the worlds they have scanned in their pictures and names, the rest dashed outlines; names kept apart
  function sysDraw(m) {
    const W = 800, H = 520, cx = W / 2, cy = H / 2 + 10, ws = m.worlds || [], bl = m.belts || [];
    const aIn = Math.min(...ws.map(w => w.a * (1 - (w.e || 0))), ...(bl.length ? bl : [1])), aOut = Math.max(.1, ...ws.map(w => w.a * (1 + (w.e || 0))), ...bl.map(b => b * 1.1));
    const d0 = Math.max(.004, aIn * .45), R0 = 30, K = (Math.min(W, H) / 2 - 40 - R0) / Math.log(1 + aOut / d0), rad = d => R0 + K * Math.log(1 + d / d0);
    const pt = (x, y) => { const d = Math.hypot(x, y) || 1e-9, r = rad(d); return [cx + x / d * r, cy + y / d * r]; }, placed = [];
    const free = q => q[0] > 0 && q[2] < W && q[1] > 30 && q[3] < H - 20 && !placed.some(p => q[0] < p[2] && q[2] > p[0] && q[1] < p[3] && q[3] > p[1]);
    let body = "", names = "";
    for (const b of bl) body += `<circle cx="${cx}" cy="${cy}" r="${rad(b).toFixed(1)}" fill="none" stroke="#8a7d6a" stroke-width="5" stroke-dasharray="1 3" opacity=".55"/>`;
    const at = ws.map(w => { const [x, y] = pt(w.x, w.y), D = w.r === 3 ? 34 : w.r === 2 ? 24 : 18; placed.push([x - D / 2, y - D / 2, x + D / 2, y + D / 2]); return [x, y, D]; });
    ws.forEach((w, i) => {
      const [x, y, D] = at[i];
      body += `<circle cx="${cx}" cy="${cy}" r="${rad(w.a).toFixed(1)}" fill="none" stroke="#9fb0c9" stroke-opacity=".25"/>`;
      body += w.lv >= 1 && w.img ? `<image href="${esc(w.img)}" x="${(x - D * .6).toFixed(1)}" y="${(y - D * .6).toFixed(1)}" width="${(D * 1.2).toFixed(1)}" height="${(D * 1.2).toFixed(1)}" style="image-rendering:pixelated"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(D / 3).toFixed(1)}" fill="none" stroke="#9fb0c9" stroke-dasharray="2 3"/>`;
    });
    ws.forEach((w, i) => { if (!w.name) return; const [x, y, D] = at[i], t = w.name + (w.kind ? " · " + w.kind : ""), tw = t.length * 7 + 6; const c = [[x + D / 2 + 4, y - 8], [x - D / 2 - 4 - tw, y - 8], [x - tw / 2, y + D / 2 + 3], [x - tw / 2, y - D / 2 - 19]].map(([a, b]) => [a, b, a + tw, b + 16]).find(free); if (!c) return; placed.push(c); names += `<text x="${(c[0] + 3).toFixed(1)}" y="${(c[1] + 12).toFixed(1)}" font-size="12" fill="#dfe8f8">${esc(t)}</text>`; });
    const col = esc(m.color || "#fff4ea");
    return `<svg class="gx-svg gx-players gx-psys" viewBox="0 0 ${W} ${H}" role="img" aria-label="The ${esc(m.name)} system"><defs><radialGradient id="psg"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="#04060b"/>
      <text x="16" y="26" font-size="17" fill="#e8eefc">The ${esc(m.name)} system</text>${m.at ? `<text x="${W - 16}" y="26" font-size="12" fill="#8fa0bb" text-anchor="end">Where the worlds stand on ${esc(m.at)}</text>` : ""}
      <circle cx="${cx}" cy="${cy}" r="30" fill="url(#psg)"/><circle cx="${cx}" cy="${cy}" r="10" fill="${col}"/>${body}${names}
      <text x="16" y="${H - 8}" font-size="11" fill="#8fa0bb">Not to scale. The worlds not yet scanned are outlines.</text></svg>`;
  }

  const Gg = A.galaxyGen; if (!Gg) return;
  // the galaxy as grown, with the council's names and the game master's changes lain over it
  function G() {
    if (A._galaxy) return A._galaxy;
    // (grown again by the game master, the editing plan of 10 Nov 2026, stage 6: its own seed and names for its stars,
    // "~grow"; the systems they kept stand in it as they were; regions remade inside their circles, "~remake")
    const over = A.galaxyOver || {}, E0 = allEdits(), g = Gg.grow(gp(E0));
    remakeRegions(g, gp(E0), E0["~remake"]);
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
  // the campaign's changes and the page's, and the galaxy's own recipe with the game master's regrowing in it
  const allEdits = () => Object.assign({}, (A.galaxyOver || {}).edits || {}, (typeof S === "function" && S()) ? (S().get("gedits") || {}) : {});
  const gp = E0 => { const R = (E0 || {})["~grow"]; return R && R.p ? Object.assign({}, A.galaxyParams || {}, R.p) : (A.galaxyParams || {}); };
  // a region remade: inside its circle the stars grown again from a seed of its own, those the game master kept left
  // standing (each circle keeps the list made when it was remade, so later changes do not move it), joined to the
  // stars round it
  function remakeRegions(g, P, RM) {
    for (const c of (RM && RM.list) || []) {
      const pg = Gg.grow(Object.assign({}, P, { seed: c.seed, idPre: "M" + c.k + "-" })), inC = q => Math.hypot(q.x - c.x, q.y - c.y) <= c.r, keep = new Set(c.keep || []);
      const kept = g.systems.filter(q => inC(q) && keep.has(q.id));
      for (const q of g.systems) if (inC(q) && !keep.has(q.id)) q.gone = true;
      const map = new Map();
      for (const q of pg.systems) if (inC(q) && !kept.some(t => Math.hypot(t.x - q.x, t.y - q.y) < 1.6)) { const t = Object.assign({}, q, { i: g.systems.length, remade: c.k }); delete t.pw; map.set(q.i, t.i); g.systems.push(t); }
      for (const [a, b] of pg.lanes) if (map.has(a) && map.has(b)) g.lanes.push([map.get(a), map.get(b)]);
      const outside = g.systems.filter(q => !q.gone && !inC(q));
      for (const [, i] of map) { const q = g.systems[i]; if (Math.hypot(q.x - c.x, q.y - c.y) < c.r * .7) continue; let b = null, bd = Infinity; for (const t of outside.concat(kept)) { const d = Math.hypot(t.x - q.x, t.y - q.y); if (d < bd) { bd = d; b = t; } } if (b && bd < c.r * .6) g.lanes.push([Math.min(q.i, b.i), Math.max(q.i, b.i)]); }
      g.N = g.systems.length;
    }
  }

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
      // (the editing plan of 10 Nov 2026: its height above the plane, a star given as it is, companions the game master
      // set, a copy's own star, no worlds grown for a system built by hand or copied, a mark)
      if (Number.isFinite(+e.z) && e.z != null) s.z = +e.z; if (e.m2) s.m2 = e.m2; if (e.comp !== undefined) { s.comp = e.comp || null; s.compOwn = !e.compNat; } if (e.comp2 !== undefined) s.comp2 = e.comp2 || null;
      if (e.star0) s.star0 = e.star0; if (e.noGen) s.noGen = true; if (e.mark != null) s.mark = !!e.mark; if (e.special != null) s.special = e.special || "";
      if (e.i0 != null) s.i0 = +e.i0; if (e.lock != null) s.lock = !!e.lock; if (e.kept) s.kept = true; if (e.whole) s.whole = true;
    }
    // (grown again: a new star too near one the game master kept gives way to it)
    if (E["~grow"]) { const own = g.systems.filter(q => q.added && !q.gone); for (const q of g.systems) if (!q.added && !q.gone && own.some(t => Math.hypot(t.x - q.x, t.y - q.y) < 1.6)) q.gone = true; }
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
    // (things between the stars, all the game master's own: atlas-space.js)
    g.things = ed([], "~things", "t");
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
  // (an empty canvas has no home yet: the ship is nowhere until a system is added and it is moved there)
  const ship = () => { const s = (S() && S().get("ship", "now")) || {}, d = defShip(), g = G(), h = g.systems[g.home] || g.systems.find(x => !x.gone); return Object.assign({}, d, { at: h ? h.id : null, fuel: d.fuel != null ? d.fuel : d.cap }, s); };
  // (a schematic jump map: where its stars are drawn is only a layout; its routes' own lengths are what count)
  const schematic = () => ((G().p || {}).layout === "schematic");
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
      // (a nebula the game master set to blind sensors)
      for (const t of allThings()) if (t.kind === "nebula" && t.blinds && lyTo(t, q) <= (t.r || 1)) risks.push(`${q.name} lies in ${t.name}: its sensors blinded there`);
    }
    if (rule[2] && fuel < sh.cap * .15 && !fails) risks.push(`They arrive with ${Math.max(0, Math.round(fuel))} of ${sh.cap} fuel`);
    return { ok: !fails || !rule[2], why: rule[2] ? fails : null, path: path.map(i => sys(i).id), ly: total, days, fuel: rule[2] ? need : 0, left: rule[2] ? fuel : sh.fuel, stops, risks: [...new Set(risks)], legs };
  }
  const round1 = v => Math.round(v * 10) / 10;

  /* ---- the view */
  // tools: the editor's row (UI.tools), and the tool in hand: region, lane, terr (painting territory), sector
  const UI = { sel: null, sys: null, planet: null, plan: null, z: 1, cx: 500, cy: 500, edit: null, adding: false, moving: null, filter: "", tools: false, tool: null, first: null, paint: "", selReg: null, selLane: null, panel: null, pedit: null, phys: null, movingReg: null };
  let host = null, drag = null;
  const HIST = [], REDO = [];   // the game master's changes to the galaxy, to undo and do again (kept after a reload: the last twenty)
  let KH = null; const keepH = () => { if (!KH && A.ux) { KH = A.ux.keepHist("gx"); KH.load(HIST, REDO); } if (KH) KH.save(HIST, REDO); };
  function setG(id, data, how) {
    const cur = edits()[id];
    if (how !== "hist") { HIST.push({ id, before: cur == null ? null : JSON.parse(JSON.stringify(cur)), after: data == null ? null : JSON.parse(JSON.stringify(data)), t: Date.now() }); if (HIST.length > 200) HIST.shift(); REDO.length = 0; keepH(); }
    S().set("gedits", id, data); A._galaxy = null; if (A.ux && A.ux.changed) A.ux.changed();
  }
  function setGMany(list) {
    const ed = edits(), h = { t: Date.now(), many: list.map(({ id, data }) => ({ id, before: ed[id] == null ? null : JSON.parse(JSON.stringify(ed[id])), after: data == null ? null : JSON.parse(JSON.stringify(data)) })) };
    HIST.push(h); if (HIST.length > 200) HIST.shift(); REDO.length = 0; keepH();
    for (const { id, data } of list) S().set("gedits", id, data); A._galaxy = null; if (A.ux && A.ux.changed) A.ux.changed();
  }
  // (the chart's changes in words, for the one history across the editors: A.ux.undoable)
  const KEYW = { "~lanes": "the lanes, trade routes and corridors", "~regions": "the regions", "~sectors": "the sectors", "~powers": "the powers", "~terr": "territory painted", "~things": "the things between the stars", "~grow": "the galaxy grown again", "~remake": "a region remade", "~enc": "what may happen on any jump" };
  const histWhat = h => { if (h.many) { const ids = h.many.map(x => x.id); return ids.includes("~grow") ? "the galaxy grown again, your work kept" : ids.includes("~remake") ? "a region remade" : h.many.length + " changes at once"; } if (KEYW[h.id]) return KEYW[h.id]; const s = G().byId[h.id], nm = (s && s.name) || (h.after || h.before || {}).name || h.id; return !h.before && h.after && h.after.added ? nm + " added" : !h.after ? nm + " as it was" : nm + " changed"; };
  if (A.ux && A.ux.undoable) A.ux.undoable("gx", { where: () => "The star chart", list: () => HIST.map(h => ({ what: histWhat(h), t: h.t })), undo: () => undo(true), open: () => { const b = document.getElementById("v-galaxy"); if (b) b.click(); } });
  // (a change made on the page starts from the campaign's own, ATLAS.galaxyEdit({ edits }) in table.js, so nothing the
  // council placed there is lost when the game master changes it)
  const doc = id => JSON.parse(JSON.stringify(edits()[id] || ((A.galaxyOver || {}).edits || {})[id] || {}));
  /* ---- the chart drawn (the galaxy plan of 5 Nov 2026, approved 10 Nov: sections 5 to 7). One camera, in light years
          of the real galaxy (atlas-galaxy-model.js), from the whole galaxy down to one system:
          - far out: the galaxy's picture (atlas-galaxy-art.js), its arms and heart named, the campaign's space marked;
          - closer: the galaxy's own unresolved stars fade in, as many as it has there, the same each time;
          - the campaign's systems over them, each a steady size on the screen whatever the zoom, by how bright its star
            is; the most important first (the ship, the chosen, capitals, colonies, stations, your places, what the
            council or you named, what the party knows), crowded ones gathered with a count until you come closer;
          - names never over each other, more of them the closer; lanes only those of the system chosen and the course,
            unless the whole network is asked for; territories as soft areas; regions as drawn;
          - a card on hover, a trail at the top, layers each switched on and off, an overview map in the corner, a scale.
          The campaign's own coordinates (the chart's units) are unchanged: every edit, course and distance uses them. */
  const GMOD = A.galaxyModel, ART = A.galaxyArt;
  const CAM = { x: 0, y: 0, s: 1 }, LAY0 = { picture: true, field: true, terr: true, regions: true, lanes: "near", trade: true, known: false, sites: true, journey: false, grid: false, reach: true, mini: true, depth: 100 };
  // (the depth slice, for a galaxy whose stars stand above and below the plane, model 2: the stars within so many light
  // years of the ship's own height, as a share of the whole; the rest dimmed, as a flattened 3D galaxy is crowded by nature)
  let ZR = 0; const zRange = () => ZR;
  function slice() { const d = +LAY.depth; if (!ZR || !(d > 0) || d >= 100) return null; const at = findSys(ship().at); return { z: (at && at.z) || 0, half: Math.max(.5, d / 100 * ZR) }; }
  function depthSay() { const v = host && host.querySelector(".gx-depthv"); if (!v) return; const S0 = slice(); v.textContent = S0 ? `within ${Math.round(S0.half).toLocaleString("en")} light years of the ship's height` : "all of them"; }
  const LAY = (() => { try { return Object.assign({}, LAY0, JSON.parse(localStorage.getItem(((A.config || {}).storageKey || "atlas") + "-gx-layers") || "{}")); } catch (e) { return Object.assign({}, LAY0); } })();
  const keepLay = () => { try { localStorage.setItem(((A.config || {}).storageKey || "atlas") + "-gx-layers", JSON.stringify(LAY)); } catch (e) {} };
  let MG = null, FR = null, PIC = null, cvs = null, ctx = null, raf = 0, hoverId = null, fly = null, DRAWN = [], paintPts = [];
  // the galaxy round this campaign: its kind (the barred spiral of the Milky Way unless galaxy.js says), and the chart set in it
  function galaxyModel() {
    const g = G(), p = gp(allEdits());
    if (!MG || MG.__seed !== p.seed || MG.__type !== (p.galaxyType || p.type)) { MG = GMOD ? GMOD.galaxyOf({ type: p.galaxyType || (p.model === 2 ? p.type : "barred"), seed: p.seed, milkyWay: !!p.milkyWay, galaxyName: p.galaxyName, active: p.active }) : null; if (MG) { MG.__seed = p.seed; MG.__type = p.galaxyType || p.type; } PIC = null; }
    FR = MG ? GMOD.frameOf(g, MG) : { x: 0, y: 0, z: 0, k: g.ly }; return MG;
  }
  const Wpx = () => (cvs && cvs.clientWidth) || 800, Hpx = () => (cvs && cvs.clientHeight) || 500;
  const gxOf = s => ({ x: FR.x + (s.x - 500) * FR.k, y: FR.y + (s.y - 500) * FR.k });
  const scr = (x, y) => [Wpx() / 2 + (x - CAM.x) * CAM.s, Hpx() / 2 + (y - CAM.y) * CAM.s];
  // a point of the screen in the chart's own units (what the editing tools use)
  function chartAt(e) { const r = cvs.getBoundingClientRect(), x = CAM.x + (e.clientX - r.left - r.width / 2) / CAM.s, y = CAM.y + (e.clientY - r.top - r.height / 2) / CAM.s; return [500 + (x - FR.x) / FR.k, 500 + (y - FR.y) / FR.k]; }
  const chartPx = () => 1000 * FR.k * CAM.s;          // how wide the campaign's chart is on the screen
  const sMin = () => MG ? Math.min(Wpx(), Hpx()) / (2.5 * MG.Rmax) : .01, sMax = () => 300 / Math.max(.02, FR ? FR.k * 10 : 1);
  const sChart = () => Math.min(Wpx(), Hpx()) * .92 / (1000 * FR.k);
  const clampS = s => Math.max(sMin(), Math.min(sMax(), s));
  function request() { if (!raf && cvs) raf = requestAnimationFrame(() => { raf = 0; frame(); }); }
  // a smooth flight to a place and a scale (the scale eased in proportion, so a long zoom feels even)
  function flyTo(x, y, s, ms) {
    s = clampS(s); const a = { x: CAM.x, y: CAM.y, s: CAM.s }, t0 = performance.now(), d = ms == null ? 520 : ms;
    if (d <= 0 || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) { CAM.x = x; CAM.y = y; CAM.s = s; fly = null; request(); return; }
    fly = { a, b: { x, y, s }, t0, d }; request();
  }
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function stepFly(now) {
    if (!fly) return false; const t = Math.min(1, (now - fly.t0) / fly.d), e = ease(t), ls = Math.log(fly.a.s) + (Math.log(fly.b.s) - Math.log(fly.a.s)) * e, ws = Math.exp(ls);
    // (keep the target where the eye expects it while the scale changes so much: move in proportion to the zoom)
    const k = (Math.abs(Math.log(fly.b.s / fly.a.s)) > .5) ? (1 / ws - 1 / fly.a.s) / ((1 / fly.b.s - 1 / fly.a.s) || 1) : e;
    CAM.x = fly.a.x + (fly.b.x - fly.a.x) * clamp01(k); CAM.y = fly.a.y + (fly.b.y - fly.a.y) * clamp01(k); CAM.s = ws;
    if (t >= 1) fly = null; return true;
  }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  // the views the buttons and the trail go to
  const fitGalaxy = ms => { galaxyModel(); flyTo(0, 0, sMin() * 1.08, ms); };
  const fitChart = ms => { galaxyModel(); flyTo(FR.x, FR.y, sChart(), ms); };
  function centreOn(s, z) { galaxyModel(); const p = gxOf(s); flyTo(p.x, p.y, Math.max(CAM.s, sChart() * (z || 2.5))); }
  function zoomAt(f, e) {
    const r = cvs.getBoundingClientRect(), px = e ? e.clientX - r.left : r.width / 2, py = e ? e.clientY - r.top : r.height / 2;
    const wx = CAM.x + (px - r.width / 2) / CAM.s, wy = CAM.y + (py - r.height / 2) / CAM.s, s = clampS(CAM.s * f);
    fly = null; CAM.s = s; CAM.x = wx - (px - r.width / 2) / s; CAM.y = wy - (py - r.height / 2) / s; request(); trail();
  }
  function view() { request(); trail(); }
  // the rank of a system: who comes first when the chart is crowded, and whose name shows
  let RANK = new Map();
  function ranks() {
    RANK = new Map(); const g = G(), sh = ship(), caps = new Set(g.powers.map(p => p.capital).filter(x => x != null)), placed = new Set(A.order.map(id => (A.meta[id] || {}).system).filter(Boolean)), named = (A.galaxyOver || {}).systems || {}, E = edits();
    { const at = findSys(sh.at), z0 = (at && at.z) || 0; ZR = 0; for (const s of g.systems) if (s.z) ZR = Math.max(ZR, Math.abs(s.z - z0)); }
    for (const s of allSys()) {
      const st = chartOf(s.id);
      RANK.set(s.id, (s.id === sh.at ? 100 : 0) + (placed.has(s.id) ? 45 : 0) + (caps.has(s.i) ? 40 : 0) + (s.f.colony ? 30 : 0) + (s.f.station ? 18 : 0) + (named[s.id] || (E[s.id] && E[s.id].name) ? 15 : 0) + (st === "visited" ? 10 : known(st) ? 5 : 0) + (s.cls === "O" || s.cls === "B" || s.cls === "R" ? 4 : 0) + (s.mark ? 35 : 0));
    }
  }
  const rank = s => (s.id === UI.sel ? 120 : 0) + (RANK.get(s.id) || 0);
  // the soft territories: each power's systems as one area, drawn on a canvas of its own and laid down faintly
  let TERR = null;
  function territories(W, H) {
    const g = G(); if (!LAY.terr || !g.powers.length) return;
    const held = allSys().filter(s => s.pw != null); if (!held.length) return;
    const near = Math.max(1.6, (g._nn || (g._nn = medNN(g))) * 1.25), rpx = near * FR.k * CAM.s; if (rpx < 1.5) return;
    if (!TERR || TERR.width !== W || TERR.height !== H) { TERR = document.createElement("canvas"); TERR.width = W; TERR.height = H; }
    const t = TERR.getContext("2d");
    for (let k = 0; k < g.powers.length; k++) {
      const mine = held.filter(s => s.pw === k); if (!mine.length) continue;
      t.clearRect(0, 0, W, H); t.fillStyle = PCOL[k % PCOL.length];
      for (const s of mine) { const p = gxOf(s), [x, y] = scr(p.x, p.y); if (x < -rpx || y < -rpx || x > W + rpx || y > H + rpx) continue; t.beginPath(); t.arc(x, y, rpx, 0, 6.2832); t.fill(); }
      ctx.globalAlpha = .13; ctx.drawImage(TERR, 0, 0, W, H); ctx.globalAlpha = 1;
    }
  }
  // (the typical distance between neighbours, in chart units: how big a system's share of a territory is)
  function medNN(g) { const L = g.systems.filter(s => !s.gone).slice(0, 600), d = L.map(s => { let b = 1e9; for (const t of L) if (t !== s) { const q = (s.x - t.x) ** 2 + (s.y - t.y) ** 2; if (q < b) b = q; } return Math.sqrt(b); }).sort((a, b) => a - b); return d[Math.floor(d.length / 2)] || 10; }
  const ly1 = v => v >= 9950 ? (Math.round(v / 1000)).toLocaleString("en") + ",000" : v >= 100 ? Math.round(v).toLocaleString("en") : v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  function frame() {
    if (!cvs || !cvs.isConnected) return;
    const now = performance.now(), moving = stepFly(now);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Wpx(), H = Hpx();
    if (cvs.width !== Math.round(W * dpr) || cvs.height !== Math.round(H * dpr)) { cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr); TERR = null; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#03050a"; ctx.fillRect(0, 0, W, H);
    galaxyModel();
    const g = G(), viewLy = W / CAM.s, x0 = CAM.x - W / 2 / CAM.s, y0 = CAM.y - H / 2 / CAM.s, x1 = CAM.x + W / 2 / CAM.s, y1 = CAM.y + H / 2 / CAM.s;
    // 1. the galaxy's picture (made once, in slices; a sign while it is first made)
    if (MG && LAY.picture) {
      if (!PIC) { PIC = ART.picture(MG, 640, () => request()); }
      if (PIC.done) { const L = PIC.L, [ax, ay] = scr(-L, -L), sz = 2 * L * CAM.s; ctx.globalAlpha = viewLy > 30000 ? 1 : viewLy > 1500 ? .35 + .65 * Math.log(viewLy / 1500) / Math.log(20) : .35; ctx.imageSmoothingEnabled = true; ctx.drawImage(PIC.cv, ax, ay, sz, sz); ctx.globalAlpha = 1; }
    }
    // 2. its unresolved stars, fading in as the view closes in
    if (MG && LAY.field && viewLy < 60000) ART.field(ctx, MG, { x0, y0, x1, y1 }, scr, Math.min(1, Math.log(60000 / viewLy) / Math.log(6)));
    // 3. the galaxy's own parts named, when far out: its arms, its bar, its heart; the campaign's space marked
    const cw = chartPx(), C0 = scr(FR.x, FR.y);
    if (MG && viewLy > 4000) {
      ctx.font = "600 11px " + (getComputedStyle(cvs).getPropertyValue("--f-mono") || "monospace"); ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,214,240,.62)";
      if (MG.T.arms && MG.T.arms.pitch) for (const a of MG.arms) { const Rk = MG.T.arms.r0 * 1.9 + a.k * .35, u = Math.log(Rk / MG.T.arms.r0) / Math.tan(MG.T.arms.pitch * Math.PI / 180), th = a.th0 + u, [px, py] = scr(Math.cos(th) * Rk * GMOD.KPC, Math.sin(th) * Rk * GMOD.KPC); if (px > 0 && py > 0 && px < W && py < H) ctx.fillText(a.name.replace(/^The /, "").toUpperCase(), px, py); }
      if (MG.bh) { const [hx, hy] = scr(0, 0); ctx.strokeStyle = "rgba(255,226,190,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, 6.2832); ctx.stroke(); ctx.fillStyle = "rgba(255,236,210,.85)"; ctx.fillText(MG.bh.name, hx, hy - 12); }
      // the campaign's space: where the chart stands in the galaxy
      const rr = Math.max(5, cw / 2); ctx.strokeStyle = "rgba(143,209,158,.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(C0[0], C0[1], rr, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "rgba(170,235,185,.95)"; ctx.fillText((A.galaxyParams || {}).name || "Our space", C0[0], C0[1] - rr - 6);
    }
    // 4. the campaign's own space, once it is big enough on the screen to show
    DRAWN = []; THLBL = [];
    if (cw > 36) {
      const near = cw > 220, L = allSys(), SCH = schematic();
      if (LAY.grid && !SCH) grid(W, H);
      // (an empty canvas: how to begin)
      if (!L.length) { ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,214,240,.75)"; const [cx0, cy0] = scr(FR.x, FR.y); ctx.fillText("Empty space, yours to fill.", cx0, cy0 - 10); ctx.fillStyle = "rgba(160,178,210,.7)"; ctx.fillText("Right-click anywhere (or press long) to add a star system, a station, a wreck, a beacon…", cx0, cy0 + 10); }
      if (LAY.regions) for (const r of g.regions) { const p = gxOf(r), [x, y] = scr(p.x, p.y), rp = r.r * FR.k * CAM.s; if (x + rp < 0 || y + rp < 0 || x - rp > W || y - rp > H) continue; const c = { danger: "239,68,68", restricted: "245,158,11", explored: "59,130,246", unexplored: "109,122,144" }[r.kind] || "109,122,144"; ctx.fillStyle = `rgba(${c},${r.kind === "unexplored" ? .3 : .06})`; ctx.strokeStyle = `rgba(${c},${UI.selReg === r.id ? .95 : .6})`; ctx.lineWidth = UI.selReg === r.id ? 2.2 : 1; ctx.setLineDash(UI.selReg === r.id ? [] : [4, 4]); ctx.beginPath(); ctx.arc(x, y, rp, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); if (rp > 34) { ctx.font = "11px " + "sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = `rgba(${c},.85)`; ctx.fillText(r.name, x, y - rp - 4); } }
      territories(W, H);
      // lanes: the chosen system's and the course, or the whole network
      // (a jump map is its routes: all of them always shown)
      const lanes = LAY.lanes === "all" || SCH ? g.lanes : LAY.lanes === "near" && UI.sel ? g.lanes.filter(([a, b]) => { const s = findSys(UI.sel); return s && (a === s.i || b === s.i); }) : [];
      const tradeOnly = LAY.trade ? g.lanes.filter(([a, b]) => { const k = g.laneKind.get(lk(a, b)); return k === "trade" || k === "corridor"; }) : [];
      for (const [a, b] of new Set([...lanes, ...tradeOnly])) { const p = sys(a), q = sys(b); if (!p || !q || p.gone || q.gone) continue; const P = gxOf(p), Q = gxOf(q), [ax, ay] = scr(P.x, P.y), [bx, by] = scr(Q.x, Q.y), k = g.laneKind.get(lk(a, b)) || (g.laneLy.has(lk(a, b)) ? "corridor" : ""); ctx.strokeStyle = UI.selLane === lk(a, b) ? "#fff" : k === "trade" ? "rgba(224,184,74,.85)" : k === "corridor" ? "rgba(180,140,255,.85)" : "rgba(80,120,180,.75)"; ctx.lineWidth = UI.selLane === lk(a, b) ? 2.4 : k ? 1.5 : 1; ctx.setLineDash(k === "corridor" ? [5, 3] : []); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        // (on a jump map, each route's own length and days at the ship's speed, written on it)
        if (SCH && Math.hypot(bx - ax, by - ay) > 70) { const L0 = g.laneLy.get(lk(a, b)) || Gg.dist(g, a, b), dd = L0 / Math.max(.01, ship().speed || 1); THLBL.push([(ax + bx) / 2, (ay + by) / 2, `${ly1(L0)} ly · ${dd < 1 ? Math.round(dd * 24) + " h" : ly1(dd) + " d"}`, true, "lane"]); } }
      ctx.setLineDash([]);
      // (a region being remade, or opened on its own: its circle)
      for (const c of [UI.remake && Object.assign({ col: "rgba(232,176,48,.9)" }, UI.remake), UI.only && Object.assign({ col: "rgba(143,209,158,.6)" }, UI.only)].filter(Boolean)) { const p = gxOf(c), [cx, cy] = scr(p.x, p.y), rp = c.r * FR.k * CAM.s; ctx.strokeStyle = c.col; ctx.lineWidth = 1.6; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }
      // the party's way so far: the systems they visited, in order
      if (LAY.journey) { const v = Object.entries((S() && S().get("charts")) || {}).filter(([, c]) => c && c.state === "visited" && c.t).sort((a, b) => a[1].t - b[1].t).map(([id]) => findSys(id)).filter(Boolean); if (v.length > 1) { ctx.strokeStyle = "rgba(143,209,158,.55)"; ctx.lineWidth = 1.6; ctx.setLineDash([2, 4]); ctx.beginPath(); v.forEach((s, i) => { const p = gxOf(s), [x, y] = scr(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]); } }
      if (UI.plan && UI.plan.path) { const pts = UI.plan.path.map(id => findSys(id)).filter(Boolean); ctx.strokeStyle = UI.plan.ok ? "#8fd19e" : "#ef4444"; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.beginPath(); pts.forEach((s, i) => { const p = gxOf(s), [x, y] = scr(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]); }
      // the systems: a steady size on the screen; where they crowd, the most important shown and the rest counted
      const cell = near ? 7 : 11, cells = new Map(), sorted = L.slice().sort((a, b) => rank(b) - rank(a)), sp = cw / Math.sqrt(Math.max(1, L.length)), dimUnknown = LAY.known, SL = slice();
      for (const s of sorted) {
        const p = gxOf(s), [x, y] = scr(p.x, p.y); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
        // (outside the depth slice: faint, unnamed, not counted among the crowd; the ship's and the chosen always shown)
        const outR = UI.only && Math.hypot(s.x - UI.only.x, s.y - UI.only.y) > UI.only.r;
        const away = (SL && Math.abs((s.z || 0) - SL.z) > SL.half || outR) && s.id !== UI.sel && s.id !== ship().at;
        const key = Math.floor(x / cell) + ":" + Math.floor(y / cell), c = away ? null : cells.get(key);
        if (c && rank(s) < 30) { c.n++; continue; }
        if (!c && !away) cells.set(key, { s, x, y, n: 1 });
        const st = chartOf(s.id), rr = ART.radius(s.cls) * (sp > 26 ? 1.15 : 1) * (rank(s) >= 30 ? 1.12 : 1) * (away ? .7 : 1), col = ART.colour(s.cls);
        ctx.globalAlpha = (dimUnknown && !known(st) ? .32 : st === "hidden" ? .4 : 1) * (away ? .22 : 1);
        // a soft glow for the bright, then the star
        if (rr > 2.8 || rank(s) >= 30) { const gr = ctx.createRadialGradient(x, y, 0, x, y, rr * 3.2); gr.addColorStop(0, col + "55"); gr.addColorStop(1, col + "00"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rr * 3.2, 0, 6.2832); ctx.fill(); }
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.fill();
        if (s.cls === "X") { ctx.strokeStyle = "#c6a8ff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, rr + 1.6, 0, 6.2832); ctx.stroke(); }
        if (st === "visited") { ctx.strokeStyle = "rgba(143,209,158,.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, rr + 2, 0, 6.2832); ctx.stroke(); }
        // (a system the game master marked as important: a gold ring with four ticks)
        // (locked: never grown again; a small padlock above it)
        if (s.lock && !away) { const lx = x + rr + 3, ly0 = y - rr - 8; ctx.strokeStyle = "#c9d6ea"; ctx.fillStyle = "#c9d6ea"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(lx + 2.5, ly0 + 2.6, 2, Math.PI, 0); ctx.stroke(); ctx.fillRect(lx, ly0 + 2.6, 5, 4); }
        if (s.mark) { ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, rr + 4, 0, 6.2832); ctx.stroke(); for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + .785; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (rr + 4), y + Math.sin(a) * (rr + 4)); ctx.lineTo(x + Math.cos(a) * (rr + 7), y + Math.sin(a) * (rr + 7)); ctx.stroke(); } }
        // what is there, as a small mark: a colony, a station
        if (LAY.sites && sp > 16 && (s.f.colony || s.f.station)) { ctx.fillStyle = s.f.colony ? "#8fd19e" : "#9fc2ff"; if (s.f.colony) { ctx.beginPath(); ctx.arc(x + rr + 3.5, y - rr - 2, 1.8, 0, 6.2832); ctx.fill(); } else { ctx.save(); ctx.translate(x + rr + 3.5, y - rr - 2); ctx.rotate(.785); ctx.fillRect(-1.6, -1.6, 3.2, 3.2); ctx.restore(); } }
        ctx.globalAlpha = 1;
        DRAWN.push([x, y, s, rr, away, outR]);
      }
      // the crowded: a count where many were gathered under one (until the view comes closer)
      ctx.font = "10px sans-serif"; ctx.textAlign = "left";
      for (const c of cells.values()) if (c.n >= 4) { ctx.fillStyle = "rgba(160,180,220,.18)"; ctx.beginPath(); ctx.arc(c.x, c.y, 6 + Math.min(10, c.n), 0, 6.2832); ctx.fill(); if (c.n >= 6) { ctx.fillStyle = "rgba(190,205,235,.8)"; ctx.fillText(String(c.n), c.x + 7, c.y + 11); } }
      // things between the stars
      drawThings(W, H, cw);
      // the ship, its reach; what is chosen; what the search found
      const sh = ship(), at = shipPos();
      if (at) { const p = gxOf(at), [x, y] = scr(p.x, p.y); ctx.strokeStyle = "#8fd19e"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, 8, 0, 6.2832); ctx.stroke(); if (LAY.reach) { const rr = sh.range / G().ly * FR.k * CAM.s; if (rr > 12 && rr < W * 3) { ctx.fillStyle = "rgba(143,209,158,.035)"; ctx.strokeStyle = "rgba(143,209,158,.55)"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); } } }
      const sel = UI.sel && findSys(UI.sel); if (sel) { const p = gxOf(sel), [x, y] = scr(p.x, p.y); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.2832); ctx.stroke(); }
      if (UI.filter) for (const s of L.filter(s => s.name.toLowerCase().includes(UI.filter)).slice(0, 40)) { const p = gxOf(s), [x, y] = scr(p.x, p.y); ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.stroke(); }
      if (paintPts.length) { ctx.fillStyle = "rgba(255,209,102,.5)"; for (const [x, y] of paintPts) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill(); } }
      labels(sp); thingLabels();
      // the sectors' names, faint, while the chart is whole on the screen
      if (cw > 200 && cw < 2600) { ctx.font = "600 13px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(109,134,173,.32)"; for (const c of g.sectors) { const p = gxOf(c), [x, y] = scr(p.x, p.y); ctx.fillText(c.name.toUpperCase(), x, y); } }
    }
    scale(W, H); mini();
    if (moving || fly) { request(); }
    else { trail(); }
  }
  // names: a steady size, never over each other nor over a star, the most important placed first, more the closer
  function labels(sp) {
    const thr = sp > 70 ? -1 : sp > 38 ? 4 : sp > 20 ? 14 : sp > 11 ? 29 : 44, placed = LBLBOX = [], rows = DRAWN.slice().sort((a, b) => rank(b[2]) - rank(a[2]));
    ctx.font = "12px " + (getComputedStyle(cvs).fontFamily || "sans-serif"); ctx.textAlign = "left"; let n = 0;
    for (const [x, y, s, rr, away] of rows) {
      if (rank(s) <= thr || away) continue;
      const t = s.name, w = ctx.measureText(t).width, bx = x + rr + 4, by = y - 7, bw = w + 2, bh = 14;
      if (placed.some(p => bx < p[0] + p[2] && bx + bw > p[0] && by < p[1] + p[3] && by + bh > p[1]) || DRAWN.some(d => d[2] !== s && Math.abs(d[0] - (bx + bw / 2)) < bw / 2 + 2 && Math.abs(d[1] - y) < 5)) continue;
      placed.push([bx, by, bw, bh]);
      const st = chartOf(s.id); ctx.fillStyle = "rgba(3,5,10,.55)"; ctx.fillRect(bx - 1, by, bw + 2, bh); ctx.fillStyle = known(st) || st === "unknown" ? (s.id === UI.sel ? "#fff" : "#dbe7ff") : "#7d8aa0"; ctx.fillText(t, bx, y + 4);
      if (++n > 160) break;
    }
  }
  // a scale: a round number of light years
  function scale(W, H) {
    if (schematic() && chartPx() > 36) { ctx.font = "11px sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "rgba(200,214,240,.85)"; ctx.fillText("A jump map: where the stars are drawn is only a layout; each route's own length counts", W - 16, H - 46); return; }
    const want = 110 / CAM.s, p10 = Math.pow(10, Math.floor(Math.log10(want))), step = [1, 2, 5, 10].map(m => m * p10).filter(v => v <= want).pop() || p10, px = step * CAM.s;
    ctx.strokeStyle = "rgba(200,214,240,.75)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(W - 16 - px, H - 46); ctx.lineTo(W - 16, H - 46); ctx.moveTo(W - 16 - px, H - 50); ctx.lineTo(W - 16 - px, H - 42); ctx.moveTo(W - 16, H - 50); ctx.lineTo(W - 16, H - 42); ctx.stroke();
    ctx.font = "11px sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "rgba(200,214,240,.85)"; ctx.fillText(`${ly1(step)} light year${step === 1 ? "" : "s"}`, W - 16, H - 54);
  }
  // a grid of light years, if asked for: lines at round distances, labelled from the galaxy's centre
  function grid(W, H) {
    const want = 140 / CAM.s, p10 = Math.pow(10, Math.floor(Math.log10(want))), step = [1, 2, 5, 10].map(m => m * p10).filter(v => v <= want).pop() || p10, x0 = CAM.x - W / 2 / CAM.s, y0 = CAM.y - H / 2 / CAM.s;
    ctx.strokeStyle = "rgba(109,134,173,.16)"; ctx.lineWidth = 1; ctx.font = "10px sans-serif"; ctx.fillStyle = "rgba(109,134,173,.5)"; ctx.textAlign = "left";
    for (let gx = Math.ceil(x0 / step) * step; gx < x0 + W / CAM.s; gx += step) { const [x] = scr(gx, 0); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); ctx.fillText(ly1(gx), x + 3, 12); }
    for (let gy = Math.ceil(y0 / step) * step; gy < y0 + H / CAM.s; gy += step) { const [, y] = scr(0, gy); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.fillText(ly1(gy), 3, y - 3); }
  }
  // the overview: the whole galaxy small in the corner, where the view is on it
  function mini() {
    const box = host && host.querySelector(".gx-mini"); if (!box) return; box.hidden = !LAY.mini || !PIC || !PIC.done; if (box.hidden) return;
    const c = box.getContext("2d"), n = box.width, L = PIC.L; c.clearRect(0, 0, n, n); c.drawImage(PIC.cv, 0, 0, n, n);
    const m = v => (v + L) / (2 * L) * n, W = Wpx(), H = Hpx(), vx = m(CAM.x - W / 2 / CAM.s), vy = m(CAM.y - H / 2 / CAM.s), vw = W / CAM.s / (2 * L) * n, vh = H / CAM.s / (2 * L) * n;
    c.strokeStyle = "#8fd19e"; c.lineWidth = 1.2; if (vw > 3) c.strokeRect(vx, vy, vw, vh); else { c.beginPath(); c.arc(m(CAM.x), m(CAM.y), 4, 0, 6.2832); c.stroke(); }
  }
  // the trail: the galaxy, the part of it in view, the campaign's space, its sector, the system chosen; each a way there
  function trail() {
    const el = host && host.querySelector(".gx-trail"); if (!el || !MG) return;
    const parts = [`<button type="button" data-gx="galaxy" title="The whole galaxy">${esc(MG.name)}</button>`], W = Wpx(), viewLy = W / CAM.s;
    if (viewLy < 40000) { const w = GMOD.whereIs(MG, CAM.x, CAM.y, 0); parts.push(`<button type="button" data-gx="part" title="This part of the galaxy">${esc(w.name.charAt(0).toUpperCase() + w.name.slice(1))}</button>`); }
    if (chartPx() > 60) {
      parts.push(`<button type="button" data-gx="fit" title="The campaign's space">${esc((A.galaxyParams || {}).name || "Our space")}</button>`);
      const s = UI.sel && findSys(UI.sel), g = G(); if (s && s.sec != null && g.sectors[s.sec]) parts.push(`<span>${esc(g.sectors[s.sec].name)}</span>`);
      if (s) parts.push(`<button type="button" data-gx="pick" data-id="${esc(s.id)}" aria-current="page">${esc(s.name)}</button>`);
    }
    const h = `<nav class="trail ux-trail" aria-label="Where this is">${parts.join('<span class="tr-sep" aria-hidden="true">›</span>')}</nav><span class="gx-where">${esc(schematic() && chartPx() > 60 ? "a jump map: its routes' own lengths count" : ly1(viewLy) + " light years across")}${MG && !(schematic() && chartPx() > 60) && Math.hypot(CAM.x, CAM.y) > viewLy * .02 ? ` · the centre ${ly1(Math.hypot(CAM.x, CAM.y))} light years away` : MG && !(schematic() && chartPx() > 60) ? " · centred on its heart" : ""}</span>`;
    if (el.__h !== h) { el.__h = h; el.innerHTML = h; }
  }
  // the card on hover: a star's name, its kind, what is there, how far from the ship
  function hoverAt(e) {
    const r = cvs.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, card = host.querySelector(".gx-hover");
    let best = null, bd = 12 * 12; for (const d of DRAWN) { const q = (d[0] - px) ** 2 + (d[1] - py) ** 2; if (q < bd) { bd = q; best = d; } }
    if (!best) { if (card) card.hidden = true; hoverId = null; cvs.style.cursor = ""; return; }
    const s = best[2]; cvs.style.cursor = "pointer"; if (hoverId === s.id && card && !card.hidden) return; hoverId = s.id;
    const sh = ship(), at = findSys(sh.at), d = at ? ly(at, s) : null, st = chartOf(s.id), g = G(), sec = s.sec != null ? g.sectors[s.sec] : null;
    card.innerHTML = `<b>${esc(s.name)}</b><span>${esc(Gg.STAR_NAME[s.cls] || (ART.NAME[s.cls]) || "a star")}${s.bin ? ", with a companion" : ""}</span><span>${[s.f.colony && "a colony", s.f.station && "a station", s.f.fuel && "fuel", s.f.anomaly && "something strange"].filter(Boolean).join(" · ") || "&nbsp;"}</span><span class="kn">${sec ? esc(sec.name) + " · " : ""}${d != null && at !== s ? ly1(d) + " light years from the ship" : at === s ? "The ship is here" : ""}${st !== "unknown" ? " · " + esc((STATE.find(x => x[0] === st) || [0, ""])[1]).toLowerCase() : ""}</span>`;
    card.style.left = Math.min(r.width - 230, best[0] + 14) + "px"; card.style.top = Math.max(44, Math.min(r.height - 90, best[1] + 10)) + "px"; card.hidden = false;
  }
  function mount(el) {
    host = el; host.innerHTML = `<div class="gx-wrap"><div class="gx-map"><div class="gx-bar"><span class="gx-findw"><input type="search" class="gx-find" placeholder="Find a system, a sector, an arm" aria-label="Find a system, a sector or a part of the galaxy" autocomplete="off"><div class="gx-found" hidden role="listbox"></div></span><button type="button" class="gx-b" data-gx="zin" aria-label="Closer" title="Closer (+)">+</button><button type="button" class="gx-b" data-gx="zout" aria-label="Further" title="Further (−)">−</button><button type="button" class="gx-b" data-gx="galaxy" title="The whole galaxy">The galaxy</button><button type="button" class="gx-b" data-gx="fit" title="The campaign's own space">Our space</button><button type="button" class="gx-b" data-gx="sideview" aria-pressed="false" title="The galaxy seen from the side, and how high above or below its plane our stars stand">Edge-on</button><button type="button" class="gx-b" data-gx="timelapse" aria-pressed="false" title="A film of the galaxy turning: 500 million years in a minute (your stars stay where they are)">Turning</button><button type="button" class="gx-b" data-gx="ship">The ship</button><details class="gx-lay"><summary class="gx-b">Layers</summary><div class="gx-layp">${[["picture", "The galaxy itself"], ["field", "Its unresolved stars"], ["terr", "Territories"], ["regions", "Regions: dangerous, restricted, charted"], ["trade", "Trade routes and corridors"], ["known", "Dim what the party does not know"], ["sites", "Colonies and stations"], ["journey", "Where the party has been"], ["reach", "The ship's reach"], ["grid", "A grid of light years"], ["mini", "The overview map"]].map(([k, l]) => `<label><input type="checkbox" data-gxl="${k}"${LAY[k] ? " checked" : ""}> ${l}</label>`).join("")}<label class="gx-lanesel">Lanes <select class="t-in" data-gxl="lanes"><option value="off"${LAY.lanes === "off" ? " selected" : ""}>none</option><option value="near"${LAY.lanes === "near" ? " selected" : ""}>of the system chosen</option><option value="all"${LAY.lanes === "all" ? " selected" : ""}>the whole network</option></select></label><label class="gx-depth"${G().systems.some(s => s.z) ? "" : " hidden"} title="The stars near the ship's own height, the rest dimmed">Depth <input type="range" data-gxl="depth" min="2" max="100" step="2" value="${+LAY.depth || 100}" aria-label="How far above and below the ship's height the stars are shown"> <span class="gx-depthv"></span></label></div></details><button type="button" class="gx-b" data-gx="tools" aria-pressed="false" title="Systems, regions, lanes, sectors, powers and territories">Edit the galaxy</button>${A.ux ? `<span class="gx-uxs">${A.ux.saveMark()}${A.ux.keysBtn("stars")}</span>` : ""}<div class="gx-tools" hidden></div><div class="gx-trail"></div></div><div class="gx-canvas" tabindex="0" role="img" aria-label="The star chart: drag to move, scroll to come closer, click a star to open its system"><canvas class="gx-cv"></canvas><div class="gx-hover" hidden></div><canvas class="gx-mini" width="130" height="130" title="The whole galaxy, and where the view is: click to go there" hidden></canvas></div><div class="gx-key"></div></div><aside class="gx-side"></aside></div>`;
    if (A.ux && !KH) { KH = A.ux.keepHist("gx"); KH.load(HIST, REDO); }
    cvs = host.querySelector(".gx-cv"); ctx = cvs.getContext("2d");
    galaxyModel(); ranks();
    // the first view: the campaign's own space, as before
    CAM.x = FR.x; CAM.y = FR.y; CAM.s = sChart();
    base(); side(); tools(); keyHTML();
    if (typeof ResizeObserver === "function") new ResizeObserver(() => request()).observe(cvs);
    const cv = host.querySelector(".gx-canvas");
    // what can be done where the game master right-clicks (or presses long): a star, or open space
    const onMenu = e => {
      if (!A.ux || (document.getElementById("app") || {}).dataset.mode !== "gm") return;
      const [wx, wy] = chartAt(e), best = pickAt(e);
      const tool = (k, extra) => () => { if (!UI.tools) { UI.tools = true; } if (k === "add") { UI.adding = true; UI.tool = null; } else { UI.tool = k; UI.adding = false; } UI.first = null; if (extra) extra(); tools(); side(); };
      const it = [];
      const th = pickThing(e);
      if (th && !best) {
        const pl = A.order.find(id => (A.meta[id] || {}).thing === th.id);
        it.push({ label: "Its card", run: () => { UI.thing = th.id; UI.sel = null; side(); request(); } }, { label: "Move it", run: () => { UI.tools = true; UI.movingThing = th.id; tools(); if (A.tableUI) A.tableUI.api.note("Click the map where it should be."); } });
        if (!SP.isArea(th.kind)) it.push({ label: "Plot a course here", run: () => { UI.thing = th.id; UI.plan = Object.assign({ to: th.id }, courseToThing(ship().at, th)); side(); request(); } });
        it.push(th.hidden && !th.found ? { label: "Show it to the players", run: () => { setThing(th.id, { found: true, ready: false, foundHow: "shown by the game master", foundAt: nowMin(), foundT: Date.now() }); refresh(); } } : th.hidden ? { label: "Hide it again", run: () => { setThing(th.id, { found: false, ready: false }); refresh(); } } : null);
        if (!SP.isArea(th.kind)) it.push(pl ? { label: "Open it", hint: "its page and its inside", run: () => { const g0 = document.createElement("button"); g0.dataset.go = pl; host.appendChild(g0); g0.click(); g0.remove(); } } : { label: "Its inside…", run: () => thingPlace(th) });
        it.push("-", { label: "Take it away", danger: true, run: () => { setThing(th.id, null); if (UI.thing === th.id) UI.thing = null; refresh(); } });
        A.ux.menu(e, it.filter(Boolean), th.name); return;
      }
      if (best) {
        it.push({ label: "Its system", run: () => enterSystem(best.id) });
        it.push({ label: "Plot a course here", run: () => { UI.sel = best.id; over(); side(); setTimeout(() => { const b = host.querySelector('[data-gx="plot"]'); if (b) b.click(); }, 30); } });
        it.push("-", { label: "Change it", run: () => { UI.tools = true; UI.sel = best.id; UI.edit = best.id; tools(); side(); } }, { label: "Move it", run: () => { UI.tools = true; UI.moving = best.id; tools(); if (A.tableUI) A.tableUI.api.note("Click the map where it should stand."); } }, { label: "Duplicate it", run: () => dupSystem(best.id) }, { label: best.mark ? "Unmark it" : "Mark it", hint: "important", run: () => markSystem(best.id) }, { label: best.lock ? "Unlock it" : "Lock it", hint: "never grown again", run: () => lockSystem(best.id) }, { label: "A lane from it", run: tool("lane", () => { UI.first = best.id; }) });
      } else {
        if (SP) it.push({ label: "Something here…", hint: "a wreck, a beacon, a station, a gate, a nebula", run: () => KIND_MENU(e, wx, wy) });
        it.push({ label: "A star system here…", run: () => A.ux.menu(e, [{ label: "As the galaxy would have one here", hint: "its star from the real mix, its worlds from its star", run: () => addSystemAt(wx, wy, "random") }, LIB ? { label: "From the library…", hint: "a premade star and its worlds", run: () => libDlg("system", sy => addSystemPreset(wx, wy, sy)) } : null, { label: "By hand", hint: "a star of your choosing, no worlds yet", run: () => addSystemAt(wx, wy, "hand") }].filter(Boolean), "A star system here") }, { label: "A region here", run: tool("region") }, "-", { label: "Our space", run: () => fitChart() }, { label: "The whole galaxy", run: () => fitGalaxy() });
      }
      A.ux.menu(e, it, best ? best.name : "Open space");
    };
    cv.addEventListener("contextmenu", e => { e.preventDefault(); onMenu(e); });
    if (A.ux) A.ux.longPress(cv, onMenu);
    // the wheel: smooth, about the pointer; two fingers on a pad the same
    cv.addEventListener("wheel", e => { e.preventDefault(); const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; zoomAt(Math.exp(-dy * .0016), e); }, { passive: false });
    cv.addEventListener("dblclick", e => { if (e.target.closest(".gx-mini")) return; const r = cvs.getBoundingClientRect(), wx = CAM.x + (e.clientX - r.left - r.width / 2) / CAM.s, wy = CAM.y + (e.clientY - r.top - r.height / 2) / CAM.s; flyTo(wx, wy, CAM.s * 2.4, 380); });
    const ptrs = new Map();
    cv.addEventListener("pointerdown", e => {
      if (e.target.closest(".gx-mini")) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]); cv.setPointerCapture(e.pointerId);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; drag = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), s: CAM.s }; return; }
      fly = null; drag = { x: e.clientX, y: e.clientY, cx: CAM.x, cy: CAM.y, moved: false, paint: UI.tool === "terr" ? {} : null }; if (drag.paint) paintAt(e);
    });
    cv.addEventListener("pointermove", e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (!drag) { hoverAt(e); return; }
      if (drag.pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); CAM.s = clampS(drag.s * d / drag.pinch); request(); return; }
      if (drag.paint) { drag.moved = true; paintAt(e); return; }
      const dx = (e.clientX - drag.x) / CAM.s, dy = (e.clientY - drag.y) / CAM.s;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 3) drag.moved = true;
      CAM.x = drag.cx - dx; CAM.y = drag.cy - dy; request();
    });
    const up = e => { ptrs.delete(e.pointerId); const d = drag; if (ptrs.size) return; drag = null; if (!d || d.pinch) { trail(); return; } if (d.paint) { paintPts = []; const T = Object.assign(doc("~terr"), d.paint); if (Object.keys(d.paint).length) { setG("~terr", T); refresh(); } else request(); return; } if (!d.moved) clickAt(e); else trail(); };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", () => { const c = host.querySelector(".gx-hover"); if (c) c.hidden = true; hoverId = null; });
    // the overview: click it to go there
    host.querySelector(".gx-mini").addEventListener("click", e => { if (!PIC) return; const b = e.target.getBoundingClientRect(), L = PIC.L, x = -L + (e.clientX - b.left) / b.width * 2 * L, y = -L + (e.clientY - b.top) / b.height * 2 * L; flyTo(x, y, Math.max(CAM.s, Wpx() / 12000)); });
    host.addEventListener("keydown", e => {
      if (e.target.closest("input, textarea, select")) return;
      if (A.ux && A.ux.isHelpKey(e)) { e.preventDefault(); A.ux.keys("stars", host.querySelector(".ux-keysb")); return; }
      if ((e.ctrlKey || e.metaKey) && /^[zy]$/i.test(e.key)) { e.preventDefault(); undo(!(e.key.toLowerCase() === "y" || e.shiftKey)); return; }
      if (e.key === "Escape" && TL) { e.preventDefault(); tlClose(); return; }
      if (e.key === "Escape" && SV) { e.preventDefault(); sideClose(); return; }
      if (e.key === "Escape" && A.starSystem && A.starSystem.isOpen() && !(UI.tool || UI.adding || UI.moving || UI.movingReg)) { e.preventDefault(); leaveSystem(true); return; }
      if (e.key === "Escape" && (UI.regrow || UI.remake || UI.grow || UI.only)) { e.preventDefault(); if (UI.remake) UI.remake = null; else if (UI.regrow) UI.regrow = null; else if (UI.grow) UI.grow = null; else { UI.only = null; fitChart(); } tools(); side(); request(); return; }
      if (e.key === "Escape") { if (UI.tool || UI.adding || UI.moving || UI.movingReg) { UI.tool = null; UI.adding = false; UI.moving = null; UI.movingReg = null; UI.first = null; } else if (UI.sel || UI.selReg || UI.selLane) { UI.sel = null; UI.selReg = null; UI.selLane = null; } else if (UI.tools) { UI.tools = false; UI.panel = null; UI.pedit = null; } else return; e.preventDefault(); tools(); over(); side(); return; }
      if ((e.key === "+" || e.key === "=") && !e.ctrlKey) { e.preventDefault(); zoomAt(1.6); return; }
      if (e.key === "-" && !e.ctrlKey) { e.preventDefault(); zoomAt(.62); return; }
      const step = 80 / CAM.s; if (e.key === "ArrowLeft") { CAM.x -= step; } else if (e.key === "ArrowRight") { CAM.x += step; } else if (e.key === "ArrowUp") { CAM.y -= step; } else if (e.key === "ArrowDown") { CAM.y += step; }
      if (/^Arrow/.test(e.key) && e.target.closest(".gx-canvas")) { e.preventDefault(); request(); trail(); return; }
      if (UI.tools && A.ux) { const t = A.ux.numKey(e, ["add", "region", "lane", "sector", "terr"]); if (t) { e.preventDefault(); const b = host.querySelector(`[data-gx="tool"][data-t="${t}"]`); if (b) b.click(); return; } }
      if ((e.key === "Delete" || e.key === "Backspace") && UI.tools && UI.sel) { const b = host.querySelector('[data-gx="remove"]'); if (b) { e.preventDefault(); b.click(); } }
    });
    // the search: what it finds, listed, and gone to
    const find = host.querySelector(".gx-find"), list = host.querySelector(".gx-found");
    find.addEventListener("input", () => { UI.filter = find.value.trim().toLowerCase(); findList(); request(); });
    find.addEventListener("keydown", e => { if (e.key === "Enter") { const b = list.querySelector("button"); if (b) { e.preventDefault(); b.click(); } } else if (e.key === "Escape") { find.value = ""; UI.filter = ""; list.hidden = true; request(); } else if (e.key === "ArrowDown") { const b = list.querySelector("button"); if (b) { e.preventDefault(); b.focus(); } } });
    host.addEventListener("change", e => { const t = e.target; if (!t.dataset || t.dataset.gxl == null) return; const k = t.dataset.gxl; LAY[k] = t.type === "checkbox" ? t.checked : t.value; keepLay(); PIC = LAY.picture ? PIC : PIC; request(); });
    host.addEventListener("click", onClick); host.addEventListener("change", onChange); host.addEventListener("submit", onSubmit);
    // (the planet editor shows what its changes would do as they are made)
    // (a world's look changes as it is changed: each field touched is kept, the preview drawn again)
    host.addEventListener("input", e => { const lf = e.target.closest && e.target.closest("form.gx-look"); if (lf) { e.target.dataset.on = "1"; lookPreview(lf); } });
    host.addEventListener("input", e => { if (e.target.dataset && e.target.dataset.gx === "rmr" && UI.remake) { UI.remake.r = +e.target.value; const sp = e.target.parentNode.querySelector(".kn"); if (sp) sp.textContent = Math.round(UI.remake.r * G().ly) + " ly"; request(); clearTimeout(UI.rmT); UI.rmT = setTimeout(() => side(), 250); return; } });
    host.addEventListener("input", e => { if (e.target.dataset && e.target.dataset.gxl === "depth") { LAY.depth = +e.target.value; keepLay(); depthSay(); request(); if (SV) sideDraw(); return; } const f = e.target.closest && e.target.closest("form.gx-phys"); if (f) physPreview(f); });
    depthSay();
    request();
    // (a campaign of a single star system opens straight into its map; "← The galaxy" shows the space round it)
    { const g0 = G(), h0 = g0.systems[g0.home]; if ((g0.p || {}).kind === "system" && h0 && A.starSystem) setTimeout(() => { if (host && host.isConnected && !A.starSystem.isOpen()) enterSystem(h0.id); }, 250); }
  }
  // what the chart's own search finds: systems by name, sectors, regions, the galaxy's arms and its heart
  function findList() {
    const list = host.querySelector(".gx-found"), q = UI.filter; if (!q || q.length < 2) { list.hidden = true; return; }
    const g = G(), out = [];
    // (the systems by name; "marked" lists the ones the game master marked as important)
    for (const s of allSys()) if (s.name.toLowerCase().includes(q) || (s.mark && "marked".startsWith(q))) out.push([`<b>${esc(s.name)}</b><span>${esc(Gg.STAR_NAME[s.cls] || ART.NAME[s.cls] || "")}${s.sec != null && g.sectors[s.sec] ? " · " + esc(g.sectors[s.sec].name) : ""}${s.mark ? " · marked" : ""}</span>`, `data-gx="pick" data-id="${esc(s.id)}"`]);
    for (const t of allThings()) if (String(t.name).toLowerCase().includes(q)) out.push([`<b>${esc(t.name)}</b><span>${esc(SP.label(t.kind))}${t.hidden && !t.found ? " · hidden" : ""}</span>`, `data-gx="tpick" data-id="${esc(t.id)}"`]);
    for (const c of g.sectors) if (c.name.toLowerCase().includes(q)) out.push([`<b>${esc(c.name)}</b><span>A sector</span>`, `data-gx="gosec" data-id="${esc(c.id)}"`]);
    for (const r of g.regions) if (String(r.name || "").toLowerCase().includes(q)) out.push([`<b>${esc(r.name)}</b><span>A region</span>`, `data-gx="goreg" data-id="${esc(r.id)}"`]);
    if (MG) { for (const a of MG.arms) if (a.name.toLowerCase().includes(q)) out.push([`<b>${esc(a.name)}</b><span>An arm of the galaxy</span>`, `data-gx="goarm" data-k="${a.k}"`]); if (MG.bh && (MG.bh.name.toLowerCase().includes(q) || /black hole|centre|center|heart/.test(q))) out.push([`<b>${esc(MG.bh.name)}</b><span>The black hole at the centre</span>`, `data-gx="gohole"`]); }
    list.innerHTML = out.slice(0, 30).map(([h, a]) => `<button type="button" ${a}>${h}</button>`).join("") || `<p class="kn">Nothing on the chart is called that.</p>`; list.hidden = false;
  }
  // the key: the powers, the regions, the lanes, the kinds of star
  function keyHTML() {
    const g = G(), key = host.querySelector(".gx-key");
    key.innerHTML = `${g.powers.map((p, k) => `<span><i style="background:${PCOL[k % PCOL.length]}"></i>${esc(p.name)}</span>`).join("")}<span><i class="gx-k-danger"></i>Dangerous</span><span><i class="gx-k-restricted"></i>Restricted</span><span><i class="gx-k-explored"></i>Charted space</span>${g.regions.some(r => r.kind === "unexplored") ? `<span><i class="gx-k-unexplored"></i>Unexplored</span>` : ""}${[...g.laneKind.values()].includes("trade") ? `<span><i class="gx-k-trade"></i>Trade route</span>` : ""}${g.laneLy.size ? `<span><i class="gx-k-corridor"></i>Corridor</span>` : ""}<span class="gx-kstars">${["O", "B", "A", "F", "G", "K", "M"].map(c => `<i style="background:${ART.colour(c)}" title="${esc(Gg.STAR_NAME[c] || c)}"></i>`).join("")} hot to cool</span>`;
  }
  // what changes: the static caches, then a drawing
  function base() { galaxyModel(); ranks(); if (host) keyHTML(); request(); }
  function over() { request(); }
  // the system under the pointer (a steady reach on the screen)
  function pickAt(e) { const r = cvs.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let best = null, bd = 13 * 13; for (const d of DRAWN) { if (d[5]) continue; const q = (d[0] - px) ** 2 + (d[1] - py) ** 2; if (q < bd) { bd = q; best = d[2]; } } return best; }
  // a star clicked: fly to it, then into its system's own map (atlas-starsystem.js), the chart kept as it was to come back to
  function enterSystem(id) {
    const s = findSys(id); if (!s) return;
    UI.sel = id; UI.selReg = null; UI.selLane = null; UI.planet = null; UI.plan = null;
    UI.back = { x: CAM.x, y: CAM.y, s: CAM.s };
    const p = gxOf(s), into = () => { if (A.starSystem && host) { UI.sys = id; A.starSystem.open(host, { s, info: bodiesOf(s), api: SYSAPI }); } else { UI.sys = id; } side(); };
    flyTo(p.x, p.y, Math.max(CAM.s, sChart() * 6), 420); setTimeout(into, 430);
    side(); if (A.nav) A.nav.mark();
  }

  // what the system's own map asks of the chart (atlas-starsystem.js): the world or moon chosen, the places on it, the
  // ship, the date, the players' screen; and the way back to the chart as it was left
  const SYSAPI = {
    pick: (n, m) => {
      UI.planet = n == null ? null : +n; UI.moon = m == null ? null : +m; UI.pedit = null; UI.phys = null; UI.look = null; side(); if (A.starSystem) A.starSystem.redraw();
      // (its card brought into the side's view, the map left where it is)
      const sd = host && host.querySelector(".gx-side"), wc = sd && sd.querySelector(".gx-world"); if (wc && sd.scrollHeight > sd.clientHeight + 4) sd.scrollTop = Math.max(0, sd.scrollTop + wc.getBoundingClientRect().top - sd.getBoundingClientRect().top - 8);
    },
    sel: () => ({ planet: UI.planet, moon: UI.moon }),
    back: () => leaveSystem(true),
    places: sid => A.order.filter(id => (A.meta[id] || {}).system === sid).map(id => ({ id, name: A.meta[id].name || id, planet: A.meta[id].planet, site: A.meta[id].site })),
    shipHere: sid => ship().at === sid, shipName: () => ship().name,
    moonName: (p, m) => moonName(p, m),
    date: dt => A.worldTime ? A.worldTime.at(A.worldTime.now() + Math.round((dt || 0) * 1440)).short : dt ? Math.round(dt) + " days on" : "",
    show: sid => { if (A.tableUI) { A.tableUI.api.show({ kind: "galaxy", sys: sid }); A.tableUI.api.note("The players' screen shows the system: the worlds they have scanned, the rest as outlines."); } },
    // (the system as it stands now, after a world, a site or a belt was added, changed or taken away)
    fresh: id => findSys(id), info: s => { const f = findSys(s.id) || s; return bodiesOf(f); },
    // (changing it from its own map: the galaxy's tools out, the game master's menu, a world dragged)
    editing: () => !!UI.tools, menu: (ctx, ev) => sysMenu(ctx, ev), moveWorld: (n, a, ev) => sysMoveWorld(n, a, ev)
  };
  function leaveSystem(back) {
    const was = UI.sys; if (A.starSystem && A.starSystem.isOpen()) A.starSystem.close();
    UI.sys = null; UI.moon = null; UI.planet = null; UI.pedit = null; UI.phys = null;
    if (was) UI.sel = was;
    if (back && UI.back) flyTo(UI.back.x, UI.back.y, UI.back.s, 420);
    UI.back = null; request(); side(); trail();
    if (back) { if (A.nav) A.nav.mark(); const c = host && host.querySelector(".gx-canvas"); if (c) c.focus({ preventScroll: true }); }
  }
  /* ---- a system changed from its own map (the editing plan of 10 Nov 2026, stage 1): a right-click on an empty orbit
          offers a world there (what its star would make there, a world of a kind made from its physics, or one by hand),
          a belt or a station; on a world, its card, its changes, a copy, a moon, its surface, taking it away; a world
          dragged to another orbit, with the choice of what follows. Every change is one step of the galaxy's undo */
  const gmMode = () => ((document.getElementById("app") || {}).dataset || {}).mode === "gm";
  const nextLetter = info => "bcdefghijklmnopqrstuvwxyz"[Math.min(24, info.planets.length)];
  const nextN = info => Math.max(99, ...info.planets.map(x => x.n)) + 1;
  function toolsOn() { if (!UI.tools) { UI.tools = true; tools(); } }
  const strip = p => { const o = JSON.parse(JSON.stringify(p)); for (const k of ["own", "edited", "made", "sid", "pn", "phys", "keepA"]) delete o[k]; for (const m of o.moonList || []) { delete m.sid; delete m.pn; } return o; };
  function sysAddWorld(s, a, how, kind) {
    const D = doc(s.id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), n = nextN(info), nm = `${s.name} ${nextLetter(info)}`;
    const w = how === "hand" ? Object.assign(newWorld(s, kind || "rocky", a, n), { name: nm, hand: true }) : madeWorld(s, info, how === "random" ? null : kind, a, n, nm);
    B.add = (B.add || []).concat(w); setG(s.id, D); UI.planet = n; UI.moon = null; UI.phys = null; UI.pedit = null;
    if (how === "hand" || w.rough) { toolsOn(); UI.pedit = n; }
    refresh();
    if (A.tableUI) A.tableUI.api.note(w.rough ? `Its star would not make ${/^[aeiou]/i.test(Gg.KINDS[kind] || "") ? "an" : "a"} ${(Gg.KINDS[kind] || "world").toLowerCase()} ${a} AU out: ${nm} is kept as your setting has it, its card saying why.` : how === "hand" ? `${nm}: set its figures in its card.` : `${nm}: ${String(w.kname || "a world").toLowerCase()}, made from its star's physics ${a} AU out.`);
  }
  function sysDupWorld(s, n) {
    const info = bodiesOf(s), p = info.planets.find(x => x.n === n); if (!p) return;
    const D = doc(s.id), B = D.bodies = D.bodies || {}, nn = nextN(info), nm = `${s.name} ${nextLetter(info)}`, a = +(p.a * 1.3).toPrecision(3), base = p.made || p;
    // (the same world, a little further out: worked out again there from its own makings, so its warmth follows its orbit)
    const w = base.inputs && Gg.rework ? Object.assign(Gg.rework(G(), info, base, Object.assign({}, p.phys || {}, { a })), { n: nn, name: nm, hand: true, minerals: p.minerals, chance: p.chance }) : Object.assign(strip(p), { n: nn, name: nm, a, hand: true });
    B.add = (B.add || []).concat(w); setG(s.id, D); UI.planet = nn; UI.moon = null; refresh();
    if (A.tableUI) A.tableUI.api.note(`${nm}: a copy of ${p.name}, ${a} AU out. Drag it to the orbit you want.`);
  }
  function delWorld(s, n) { const D = doc(s.id), B = D.bodies = D.bodies || {}; if ((B.add || []).some(p => p.n === n)) B.add = B.add.filter(p => p.n !== n); else { B.p = B.p || {}; B.p[n] = { gone: true }; } setG(s.id, D); if (UI.planet === n) { UI.planet = null; UI.moon = null; } UI.pedit = null; UI.phys = null; refresh(); }
  // a world moved to another orbit: worked out again there, or its figures kept as the game master's
  function sysMoveWorld(n, a, ev) {
    const s = findSys(UI.sys); if (!s) return; const info = bodiesOf(s), p = info.planets.find(x => x.n === n); if (!p || !(a > 0)) return;
    const D = doc(s.id), B = D.bodies = D.bodies || {}, own = (B.add || []).find(x => x.n === n), phys = (p.made || p).inputs && Gg.rework;
    const work = () => { if (own) { if (own.inputs) { own.phys = Object.assign({}, own.phys || {}, { a }); delete own.keepA; } else own.a = a; } else { const e = (B.p = B.p || {})[n] || {}; B.p[n] = Object.assign(e, { phys: Object.assign({}, e.phys || {}, { a }), t: Date.now() }); delete B.p[n].a; delete B.p[n].keepA; } setG(s.id, D); UI.planet = n; refresh(); };
    const keep = () => { if (own) { own.a = a; own.keepA = true; } else { const e = (B.p = B.p || {})[n] || {}; B.p[n] = Object.assign(e, { a, keepA: true, t: Date.now() }); } setG(s.id, D); UI.planet = n; refresh(); };
    if (!phys) { keep(); return; }
    if (A.ux && ev) A.ux.menu(ev, [{ label: "Work out what follows", hint: "its warmth, its air, its seas", run: work }, { label: "Keep its figures", hint: "your setting's", run: keep }], `${p.name} to ${a} AU`); else work();
  }
  // a large moon added to a world, made by the planet maker as its own are; or one taken away
  function sysAddMoon(s, n) {
    const info = bodiesOf(s), p = info.planets.find(x => x.n === n); if (!p || !A.planets || !A.planets.body) return;
    const D = doc(s.id), B = D.bodies = D.bodies || {}, own = (B.add || []).find(x => x.n === n), E = own || ((B.p = B.p || {})[n] = (B.p[n] || {})), list = p.moonList || [];
    const km = Math.round(Math.max((p.radius || p.size || 1) * 6371 * 14, ...list.map(m => m.distance || m.a || 0)) * 1.5), aAU = km / 1.496e8, yrs = Math.sqrt(Math.pow(aAU, 3) / (Math.max(1e-4, p.mass || p.size || 1) / 332946));
    const k = (E.addM || []).length, r = Gg.rng(`${(A.galaxyParams || {}).seed}|moon|${s.id}|${n}|${k}`), mass = .002 + r() * .03, wf = p.a > (info.star.frost || 2.7) * .7 ? .2 + r() * .3 : .00005;
    const mb = A.planets.body(info.star, { a: p.a, mass, wf, env: "rock", host: { a: p.a, name: p.name }, period: yrs, tidal: 0 }, r, { realism: (G().p || {}).realism || "balanced", tech: (G().p || {}).tech || "armoured" });
    E.addM = (E.addM || []).concat(Object.assign(mb, { n: 50 + k, distance: km, period: Math.round(yrs * 365.25 * 10) / 10, own: true }));
    setG(s.id, D); UI.planet = n; UI.moon = 50 + k; refresh();
  }
  function sysDelMoon(s, n, m) {
    const D = doc(s.id), B = D.bodies = D.bodies || {}, own = (B.add || []).find(x => x.n === n), E = own || ((B.p = B.p || {})[n] = (B.p[n] || {}));
    if ((E.addM || []).some(x => x.n === m)) E.addM = E.addM.filter(x => x.n !== m); else E.mGone = Object.assign({}, E.mGone || {}, { [m]: 1 });
    setG(s.id, D); UI.moon = null; refresh();
  }
  function sysAddBelt(s, a) { const D = doc(s.id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), k = Math.max(99, ...info.belts.map(x => x.k)) + 1; B.addB = (B.addB || []).concat({ k, a, name: a > (info.star.frost || 2.7) ? "An icy belt" : "An asteroid belt", rich: false, icy: a > (info.star.frost || 2.7) }); setG(s.id, D); refresh(); }
  function sysAddSite(s, kind, a, ph) { const D = doc(s.id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), k = Math.max(99, ...info.sites.map(x => x.k)) + 1; B.addS = (B.addS || []).concat({ k, kind, name: (SITEK.find(x => x[0] === kind) || [0, "A site"])[1], on: null, a, ph }); setG(s.id, D); refresh(); if (A.tableUI) A.tableUI.api.note("Name it in the system's card, under Add to the system, or right-click it."); }
  function sysMenu(ctx, ev) {
    if (!A.ux || !gmMode()) return; const s = findSys(UI.sys); if (!s) return;
    const info = bodiesOf(s), it = [], KI = how => Object.entries(Gg.KINDS).map(([k, l]) => ({ label: l, run: () => sysAddWorld(s, ctx.a, how, k) }));
    if (ctx.kind === "space") {
      if (!(ctx.a > 0)) return;
      it.push({ label: "What its star would make here", hint: "from its physics", run: () => sysAddWorld(s, ctx.a, "random") }, { label: "A world of a kind…", hint: "made from its physics", run: () => A.ux.menu(ev, KI("kind"), `A world ${ctx.a} AU out`) }, LIB ? { label: "A world from the library…", hint: "worked out here", run: () => libDlg("world", w => sysAddPreset(s, ctx.a, w, ev), { info, a: ctx.a, say: `Each worked out ${ctx.a} AU from ${s.name}, as the planet maker would make it there; “fits here” means it stays of its kind.` }) } : null, { label: "A world by hand…", hint: "your own figures", run: () => A.ux.menu(ev, KI("hand"), "By hand: what kind?") },
        "-", { label: "A belt here", run: () => sysAddBelt(s, ctx.a) }, { label: "A station here", run: () => sysAddSite(s, "station", ctx.a, ctx.ph) }, { label: "Something else here…", run: () => A.ux.menu(ev, SITEK.filter(([k]) => k !== "station").map(([k, l]) => ({ label: l, run: () => sysAddSite(s, k, ctx.a, ctx.ph) })), `${ctx.a} AU out`) });
      A.ux.menu(ev, it.filter(Boolean), `${ctx.a} AU from ${s.name}`); return;
    }
    if (ctx.kind === "world" || ctx.kind === "rock") {
      const p = info.planets.find(x => x.n === ctx.n); if (!p) return;
      it.push({ label: "Its card", run: () => SYSAPI.pick(p.n) }, { label: "Its look", hint: "its picture only", run: () => { UI.planet = p.n; UI.moon = null; UI.look = p.n; UI.pedit = null; UI.phys = null; side(); } }, { label: "Change this world", run: () => { toolsOn(); UI.planet = p.n; UI.moon = null; UI.look = null; UI.pedit = p.n; UI.phys = null; side(); } });
      if ((p.made || p).inputs && Gg.rework) it.push({ label: "Work it out again", run: () => { toolsOn(); UI.planet = p.n; UI.moon = null; UI.phys = p.n; UI.pedit = null; side(); } });
      it.push({ label: "Duplicate it", run: () => sysDupWorld(s, p.n) }, { label: "Add a moon", run: () => sysAddMoon(s, p.n) });
      if (p.landable && A.worldGenerate) it.push({ label: "Open its surface", run: () => { SYSAPI.pick(p.n); setTimeout(() => { const b = host.querySelector('.gx-side .gx-world [data-gx="surface"]:not([data-m])'); if (b) b.click(); }, 80); } });
      it.push("-", { label: "Take it away", danger: true, run: () => delWorld(s, p.n) });
      A.ux.menu(ev, it, p.name); return;
    }
    if (ctx.kind === "moon") { const p = info.planets.find(x => x.n === ctx.n); if (!p) return; const m = (p.moonList || []).find(x => x.n === ctx.m); A.ux.menu(ev, [{ label: "Its card", run: () => SYSAPI.pick(p.n, ctx.m) }, "-", { label: "Take it away", danger: true, run: () => sysDelMoon(s, p.n, ctx.m) }], m ? moonName(p, m) : "A moon"); return; }
    if (ctx.kind === "site") { const t = info.sites.find(x => x.k === ctx.site); if (!t) return; const pl = A.order.find(id => (A.meta[id] || {}).system === s.id && (A.meta[id] || {}).site === t.k); A.ux.menu(ev, [pl ? { label: "Open it", hint: "its page and its inside", run: () => { const g = document.createElement("button"); g.dataset.go = pl; host.appendChild(g); g.click(); g.remove(); } } : { label: "Its inside…", hint: "a place with its page and its maps", run: () => { const b = document.createElement("button"); b.dataset.gx = "siteplace"; b.dataset.id = s.id; b.dataset.k = t.k; host.appendChild(b); b.click(); b.remove(); } }, "-", { label: "Take it away", danger: true, run: () => { const D = doc(s.id), B = D.bodies = D.bodies || {}; if ((B.addS || []).some(x => x.k === t.k)) B.addS = B.addS.filter(x => x.k !== t.k); else { B.s = B.s || {}; B.s[t.k] = { gone: true }; } setG(s.id, D); refresh(); } }], t.name); return; }
    if (ctx.kind === "star") { A.ux.menu(ev, [{ label: "Change its star and companions", run: () => { toolsOn(); UI.edit = s.id; side(); } }], s.name); }
  }

  /* ---- a system added where the game master right-clicked: grown as the galaxy would have one there (its star from the
          real mix at that place, a companion by the odds for its mass, its worlds from its star), or built by hand (a
          star of their choosing and no worlds yet); a system copied (its star, companions, worlds, belts and sites the
          same, a little way off); a system marked as important */
  const r1c = v => Math.round(v * 10) / 10;
  function starHere(wx, wy, id) {
    if (!GMOD || !MG) return { cls: "G" };
    const r = Gg.rng(`${(A.galaxyParams || {}).seed}|here|${id}`), gx = FR.x + (wx - 500) * FR.k, gy = FR.y + (wy - 500) * FR.k, pop = GMOD.populationAt(MG, gx, gy, FR.z, r);
    let m0 = GMOD.imfSample(r); if ((G().p || {}).browns === false) { let g = 0; while (m0 < .08 && g++ < 40) m0 = GMOD.imfSample(r); }
    const now = GMOD.become(m0, pop.age), c0 = GMOD.companionOf(m0, r), c = c0 ? GMOD.become(c0.mass, pop.age) : null;
    return Object.assign({ cls: now.cls, bin: !!c, m2: { cls: now.cls, mass: Math.round(now.mass * 1000) / 1000, m0: Math.round(m0 * 1000) / 1000, age: Math.round(pop.age), feh: pop.feh, pop: pop.pop } }, c ? { comp: { cls: c.cls, mass: Math.round(c.mass * 1000) / 1000, a: c0.a, e: c0.e, both: c0.a <= 2 }, compNat: true } : {});
  }
  function addSystemAt(wx, wy, how) {
    const id = "C" + Date.now().toString(36), base = { added: true, name: Gg.nameOf ? Gg.nameOf(Gg.rng(id + "|name")) : "A new system", x: r1c(wx), y: r1c(wy), f: {}, t: Date.now() };
    Object.assign(base, how === "hand" ? { cls: "G", noGen: true } : starHere(wx, wy, id));
    UI.tools = true; setG(id, base); UI.sel = id; UI.edit = how === "hand" ? id : null; refresh();
    if (A.tableUI) A.tableUI.api.note(how === "hand" ? `${base.name}: a star of your choosing and no worlds yet. Open the system and right-click an orbit to add one.` : `${base.name}: ${Gg.STAR_NAME[base.cls] || "a star"}${base.bin ? " with a companion" : ""}, as the galaxy would have one here; its worlds from its star.`);
  }
  function dupSystem(id) {
    const s = findSys(id); if (!s) return; const info = bodiesOf(s), nid = "C" + Date.now().toString(36), nm = s.name + " II", st = info.star, comp = st.companion || (A.starSystem ? A.starSystem.companion(s, info) : null);
    const map = {}, worlds = info.planets.map((p, i) => { map[p.n] = 100 + i; return Object.assign(strip(p), { n: 100 + i, name: String(p.name).replace(s.name, nm), hand: true }); });
    const bodies = { add: worlds, addB: info.belts.map((b, i) => ({ k: 100 + i, a: b.a, name: b.name, rich: b.rich, icy: b.icy })), addS: info.sites.map((t, i) => ({ k: 100 + i, kind: t.kind, name: String(t.name).replace(s.name, nm), on: t.on != null ? map[t.on] : null, a: t.a, ph: t.ph })) };
    const star0 = { cls: st.cls, color: st.color, lum: st.lum, mass: st.mass, teff: st.teff, age: st.age, flares: st.flares, metal: st.metal };
    setG(nid, Object.assign({ added: true, name: nm, cls: s.cls, bin: !!comp, x: r1c(s.x + 9), y: r1c(s.y + 6), z: s.z || undefined, f: Object.assign({}, s.f), desc: s.desc || "", noGen: true, star0, bodies, t: Date.now() }, comp ? { comp: { cls: comp.cls, mass: comp.mass, a: comp.a, e: comp.ecc != null ? comp.ecc : comp.e, both: !!comp.both }, compNat: true } : {}, st.companion2 ? { comp2: { cls: st.companion2.cls, mass: st.companion2.mass, a: st.companion2.a, e: st.companion2.ecc } } : {}));
    UI.tools = true; UI.sel = nid; refresh(); if (A.tableUI) A.tableUI.api.note(`${nm}: a copy of ${s.name}, its star and worlds the same. Move it where it belongs.`);
  }
  function lockSystem(id) { const s = findSys(id); if (!s) return; setG(id, Object.assign(doc(id), { lock: !s.lock, t: Date.now() })); refresh(); if (A.tableUI) A.tableUI.api.note(s.lock ? `${s.name} unlocked.` : `${s.name} locked: growing the galaxy or a region again leaves it as it is.`); }
  function markSystem(id) { const s = findSys(id); if (!s) return; setG(id, Object.assign(doc(id), { mark: !s.mark, t: Date.now() })); refresh(); }

  /* ---- things between the stars (atlas-space.js; the editing plan of 10 Nov 2026, stage 2): kept in "~things", drawn
          on the chart, chosen, changed in their card, found by the ship's sensors or their signal, a sweep, a clue, an
          event or the game master; a course can be plotted to one, and one can have an inside */
  const SP = A.space;
  const allThings = () => (G().things || []).filter(t => !t.gone);
  const thingById = id => allThings().find(t => t.id === id) || null;
  const nowMin = () => A.worldTime ? A.worldTime.now() : 0;
  const thingAt = t => SP ? SP.where(t, nowMin()) : { x: t.x, y: t.y };
  function setThing(id, patch, how) { const X = doc("~things"); X.add = X.add || []; const i = X.add.findIndex(t => t.id === id); if (i < 0) return; if (patch === null) X.add.splice(i, 1); else X.add[i] = Object.assign({}, X.add[i], patch); setG("~things", X, how); }
  function addThing(kind, wx, wy) {
    if (!SP) return; const id = "t" + Date.now().toString(36), X = doc("~things"), t = Object.assign(SP.fresh(kind), { id, x: r1c(wx), y: r1c(wy), t: Date.now() });
    X.add = (X.add || []).concat(t); UI.tools = true; setG("~things", X); UI.thing = id; UI.sel = null; UI.selReg = null; UI.selLane = null; refresh();
    if (A.tableUI) A.tableUI.api.note(`${SP.label(kind)} here. ${t.hidden ? "It is hidden from the players until they find it: its card says how they can." : "The players can see it on their charts."}`);
  }
  // the ship's own place: its system, or a thing it went to
  const shipPos = () => { const sh = ship(), th = sh.near && thingById(sh.near); if (th) { const p = thingAt(th); return { x: p.x, y: p.y, z: th.z || 0 }; } const s = findSys(sh.at); return s ? { x: s.x, y: s.y, z: s.z || 0 } : null; };
  const lyTo = (t, p) => { const q = thingAt(t); return Math.hypot(Math.hypot(q.x - p.x, q.y - p.y) * G().ly, (t.z || 0) - (p.z || 0)); };
  // (how far the sensors reach: by how good they are; a fifth as far inside a nebula that blinds them)
  const reachLy = () => { const r0 = SP ? SP.REACH[ship().sensors || "good"] || 2.5 : 2.5, sp = shipPos(); return sp && allThings().some(t => t.kind === "nebula" && t.blinds && lyTo(t, sp) <= (t.r || 1)) ? r0 * .2 : r0; };
  // which hidden things are found now, told to the game master (and shown to the players, for those that are to be
  // shown by themselves); called when the ship moves, the sensors sweep, the table's clues or events change
  let thBusy = false;
  function checkThings(o) {
    if (!SP || thBusy || !S() || !G().things || !G().things.length) return []; thBusy = true; const out = [];
    try {
      const sp = shipPos(), reach = reachLy(), foundClue = ref => { const [pl, id] = String(ref).split("|"); return !!(A.story && A.story.found && pl && id && A.story.found(pl, id)); }, eventDone = id => { const e = S().get("events", id); return !!(e && e.state === "done"); };
      for (const t of allThings()) {
        if (!t.hidden || t.found || t.ready) continue;
        const why = SP.met(t, { dist: sp ? lyTo(t, sp) : null, reach, swept: o && o.swept, foundClue, eventDone }); if (!why) continue;
        if (t.reveal === "auto") setThing(t.id, { found: true, foundHow: why, foundAt: nowMin(), foundT: Date.now() }, "hist"); else setThing(t.id, { ready: true, readyHow: why }, "hist");
        out.push([t, why]);
      }
    } finally { thBusy = false; }
    for (const [t, why] of out) if (A.tableUI) A.tableUI.api.note(t.reveal === "auto" ? `The players have found ${t.name}: ${why}.` : `${t.name} can be found now: ${why}. Show it to the players from its card when you choose.`);
    if (out.length) { A._galaxy = null; if (host) { request(); side(); } }
    return out;
  }
  // a course to a thing: to the system nearest it (or straight from the ship's, if near enough), then the last jump
  // (a course refused says why, in the thing's own card)
  function courseToThing(fromId, t) { return Object.assign(courseToThing0(fromId, t), { thing: t.id }); }
  function courseToThing0(fromId, t) {
    const sh = ship(), rule = fuelRule(), reach = sh.range * ({ Sound: 1, Worn: .9, Damaged: .7, Crippled: .45 }[sh.condition] || 1), from = findSys(fromId);
    const near = allSys().map(s => [s, lyTo(t, s)]).sort((a, b) => a[1] - b[1])[0]; if (!near || !from) return { ok: false, why: "No star system to set out from." };
    let c, last;
    if (lyTo(t, shipPos() || from) <= reach) { c = { ok: true, path: [from.id], ly: 0, days: 0, fuel: 0, left: sh.fuel, stops: [], risks: [], legs: [] }; last = from; }
    else { c = course(fromId, near[0].id); last = near[0]; if (!c.path) return c; }
    const dl = lyTo(t, last); if (dl > reach) return { ok: false, why: `${t.name} lies ${round1(dl)} light years from ${last.name}, the nearest system: beyond the ship's reach of ${round1(reach)} light years a jump.` };
    const f = dl * sh.burn * rule[2];
    c.legs = (c.legs || []).concat({ from: last.name, to: t.name, ly: dl, lane: false }); c.ly += dl; c.days += dl / Math.max(.1, sh.speed);
    if (rule[2]) { c.fuel += f; c.left -= f; if (c.left < -1e-9) { c.ok = false; c.why = `The fuel runs out on the way to ${t.name}.`; } }
    c.risks = [...new Set((c.risks || []).concat(`The last jump, to ${t.name}, is off the lanes`, t.attitude === "hostile" ? `${t.name} is hostile` : null).filter(Boolean))];
    return Object.assign(c, { thing: t.id, near: last.id, to: last.id });
  }
  // an area drawn: a nebula's soft clouds, an asteroid field's rocks, a debris field's shards
  function drawArea(t, x, y, rp) {
    const r = Gg.rng(t.id), sel = UI.thing === t.id;
    if (t.kind === "nebula") { ctx.globalCompositeOperation = "lighter"; for (let k = 0; k < 6; k++) { const a = r() * 6.2832, d = r() * rp * .55, bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d, br = rp * (.45 + r() * .45), g0 = ctx.createRadialGradient(bx, by, 0, bx, by, br), hue = r() < .5 ? "214,120,170" : "120,150,230"; g0.addColorStop(0, `rgba(${hue},.20)`); g0.addColorStop(1, `rgba(${hue},0)`); ctx.fillStyle = g0; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.2832); ctx.fill(); } ctx.globalCompositeOperation = "source-over"; }
    else { const n = t.kind === "asteroids" ? 140 : 70; for (let k = 0; k < n; k++) { const a = r() * 6.2832, d = Math.sqrt(r()) * rp, s0 = r() < .15 ? 2 : 1; ctx.fillStyle = t.kind === "asteroids" ? "rgba(176,160,136,.75)" : "rgba(170,176,190,.7)"; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s0, t.kind === "debris" ? 1 : s0); } }
    ctx.strokeStyle = sel ? "#fff" : "rgba(200,214,240,.28)"; ctx.setLineDash([3, 5]); ctx.lineWidth = sel ? 1.4 : 1; ctx.beginPath(); ctx.arc(x, y, rp, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    if (rp > 26) { ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(210,220,240,.8)"; ctx.fillText(t.name, x, y - rp - 4); }
  }
  let THINGS = [];
  function drawThings(W, H, cw) {
    THINGS = []; if (!SP) return;
    for (const t of allThings()) {
      const P = gxOf(thingAt(t)), [x, y] = scr(P.x, P.y);
      if (SP.isArea(t.kind)) { const rp = Math.max(7, (t.r || 1) * CAM.s); if (x + rp < 0 || y + rp < 0 || x - rp > W || y - rp > H) continue; drawArea(t, x, y, rp); THINGS.push([x, y, t, Math.min(rp, 30)]); continue; }
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      const ic = A.starSystem && A.starSystem.icon ? A.starSystem.icon(SP.icon(t.kind)) : null, faint = t.hidden && !t.found;
      ctx.globalAlpha = faint ? .55 : 1; ctx.imageSmoothingEnabled = false; if (ic) ctx.drawImage(ic, x - 9, y - 9, 18, 18); else { ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 3, y - 3, 6, 6); }
      ctx.globalAlpha = 1;
      if (faint) { ctx.strokeStyle = t.ready ? "#ffd166" : "rgba(200,214,240,.55)"; ctx.lineWidth = t.ready ? 1.6 : 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }
      if (t.signal && t.signal.on && t.signal.range && (!t.hidden || t.found || UI.thing === t.id)) { const rr = t.signal.range * CAM.s; if (rr > 16 && rr < W * 2) { ctx.strokeStyle = "rgba(255,107,107,.35)"; ctx.setLineDash([1, 4]); ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); } }
      if (UI.thing === t.id) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 15, 0, 6.2832); ctx.stroke(); }
      if (cw > 260 || UI.thing === t.id) THLBL.push([x, y, t.name, faint]);
      THINGS.push([x, y, t, 11]);
    }
  }
  // their names, after the stars' own: each where it fits, never over a star's name or a star (THLBL from drawThings,
  // LBLBOX from labels)
  let THLBL = [], LBLBOX = [];
  function thingLabels() {
    ctx.font = "11px sans-serif"; ctx.textAlign = "left";
    for (const [x, y, name, faint, lane] of THLBL) {
      const w = ctx.measureText(name).width + 4, h = 14, C = lane ? [[x - w / 2, y - 7], [x - w / 2, y + 5], [x - w / 2, y - 19]] : [[x + 13, y - 7], [x - 13 - w, y - 7], [x - w / 2, y + 12], [x - w / 2, y - 26]];
      const box = C.map(([bx, by]) => [bx, by, w, h]).find(b => !LBLBOX.some(p => b[0] < p[0] + p[2] && b[0] + b[2] > p[0] && b[1] < p[1] + p[3] && b[1] + b[3] > p[1]) && !DRAWN.some(d => d[0] > b[0] - 4 && d[0] < b[0] + b[2] + 4 && d[1] > b[1] - 4 && d[1] < b[1] + b[3] + 4));
      if (!box) continue; LBLBOX.push(box);
      ctx.fillStyle = "rgba(3,5,10,.55)"; ctx.fillRect(box[0], box[1], box[2], box[3]); ctx.fillStyle = faint ? "#9fb0c9" : "#e8dcc0"; ctx.fillText(name, box[0] + 2, box[1] + 11);
    }
  }
  function pickThing(e) { const r = cvs.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let best = null, bd = Infinity; for (const [x, y, t, rr] of THINGS) { const d = Math.hypot(x - px, y - py); if (d <= Math.max(10, rr) && d < bd) { bd = d; best = t; } } return best; }
  const KIND_MENU = (ev, wx, wy) => A.ux.menu(ev, SP.GROUPS.map(g0 => ({ label: g0 + "…", run: () => A.ux.menu(ev, Object.entries(SP.KINDS).filter(([, k]) => k[1] === g0).map(([k, v]) => ({ label: v[0], run: () => addThing(k, wx, wy) })), g0) })), "Something here");
  function thingHTML(t) {
    const gm = gmMode(), K = SP.KINDS[t.kind] || SP.KINDS.poi, area = SP.isArea(t.kind), pl = A.order.find(id => (A.meta[id] || {}).thing === t.id), sp = shipPos(), d = sp ? lyTo(t, sp) : null;
    const sel = (n, list, v) => `<select class="t-in" name="${n}">${list.map(([a, b]) => `<option value="${esc(a)}"${String(a) === String(v == null ? "" : v) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select>`;
    const state = !t.hidden ? `<div class="gx-f"><span class="kn">The players</span> can see it on their charts</div>` : t.found ? `<div class="gx-f"><span class="kn">The players</span> have found it${t.foundHow ? ": " + esc(t.foundHow) : ""}</div>` : t.ready ? `<div class="gx-f gx-warn"><span class="kn">Ready to be found</span> ${esc(t.readyHow || "")}</div>` : `<div class="gx-f"><span class="kn">The players</span> know nothing of it yet</div>`;
    const head = `<section class="gx-card gx-thing"><h3>${esc(t.name)}</h3><div class="gx-f">${esc(K[0])}${t.attitude && t.attitude !== "unknown" ? " · " + esc(((SP.ATTITUDE.find(a => a[0] === t.attitude) || [0, ""])[1]).toLowerCase()) : ""}${d != null ? ` · ${round1(d)} light years from the ship` : ""}</div>${t.desc ? `<p>${esc(t.desc)}</p>` : ""}${t.signal && t.signal.on && t.signal.message ? `<p class="t-small"><span class="kn">Its signal</span> “${esc(t.signal.message)}”</p>` : ""}${gm && t.gm ? `<p class="gx-gm"><span class="kn">Only you</span> ${esc(t.gm)}</p>` : ""}${state}
      <div class="t-row">${t.hidden && !t.found ? `<button type="button" class="t-btn${t.ready ? " prim" : ""}" data-gx="treveal" data-id="${esc(t.id)}">Show it to the players</button>` : t.hidden ? `<button type="button" class="t-mini" data-gx="thide" data-id="${esc(t.id)}">Hide it again</button>` : ""}${!area ? `<button type="button" class="t-mini" data-gx="tplot" data-id="${esc(t.id)}">Plot a course here</button>` : ""}${pl ? `<button type="button" class="t-go" data-go="${esc(pl)}">Open it</button>` : A.locations && A.locations.forPlace && !area && gm ? `<button type="button" class="t-mini" data-gx="tplace" data-id="${esc(t.id)}" title="A place of the campaign: its page, its maps deck by deck, its people and clues; its inside built in the map editor">Its inside…</button>` : ""}</div></section>`;
    if (!gm) return head;
    const sig = t.signal || {}, drift = t.drift || {}, owners = [["", "No one"], ...G().powers.map(x => [x.id, x.name]), ...Object.entries(A.factionsData || {}).filter(([id]) => !G().powers.some(x => x.id === id)).map(([id, f]) => [id, f.n || id])];
    const kinds = SP.GROUPS.map(g0 => `<optgroup label="${esc(g0)}">${Object.entries(SP.KINDS).filter(([, k]) => k[1] === g0).map(([k, v]) => `<option value="${k}"${k === t.kind ? " selected" : ""}>${esc(v[0])}</option>`).join("")}</optgroup>`).join("");
    const clues = A.story && A.story.allClues ? A.story.allClues().map(c => [c.pl + "|" + c.id, (c.c.t || c.id) + " (" + ((A.meta[c.pl] || {}).name || c.pl) + ")"]) : [], evs = A.worldTime && A.worldTime.events ? A.worldTime.events().map(e => [e.id, e.title || e.id]) : [];
    return head + `<section class="gx-card"><h4>Change ${esc(t.name)}</h4><form data-gx="savething" data-id="${esc(t.id)}">
      <label class="tw-l"><span>Name</span><input class="t-in" name="name" maxlength="80" value="${esc(t.name)}"></label>
      <label class="tw-l"><span>What it is</span><select class="t-in" name="kind">${kinds}</select></label>
      <label class="tw-l"><span>What the players see of it</span><textarea class="t-in" name="desc" rows="2">${esc(t.desc || "")}</textarea></label>
      <label class="tw-l"><span>Only you: what it really is, its story</span><textarea class="t-in" name="gm" rows="3">${esc(t.gm || "")}</textarea></label>
      ${area ? `<label class="tw-l"><span>How far it reaches (light years)</span><input class="t-in" type="number" step="any" min="0.05" name="r" value="${t.r || 1}"></label>${t.kind === "nebula" ? `<label class="t-fogck"><input type="checkbox" name="blinds"${t.blinds ? " checked" : ""}> It blinds sensors, and courses through it are warned of</label>` : ""}` : `
      <div class="gx-comp"><label class="tw-l"><span>Its condition</span><input class="t-in" name="condition" maxlength="120" value="${esc(t.condition || "")}" placeholder="adrift, its hull breached"></label><label class="tw-l"><span>To the party it is</span>${sel("attitude", SP.ATTITUDE, t.attitude)}</label><label class="tw-l"><span>It belongs to</span>${sel("owner", owners, t.owner || "")}</label></div>
      <label class="tw-l"><span>Crew and passengers</span><textarea class="t-in" name="crew" rows="2">${esc(t.crew || "")}</textarea></label>
      <label class="tw-l"><span>Cargo and equipment</span><textarea class="t-in" name="cargo" rows="2">${esc(t.cargo || "")}</textarea></label>
      <details class="gx-how"${sig.on ? " open" : ""}><summary class="t-small">Its signal</summary><label class="t-fogck"><input type="checkbox" name="sig_on"${sig.on ? " checked" : ""}> It broadcasts</label><label class="tw-l"><span>Its message</span><textarea class="t-in" name="sig_msg" rows="2">${esc(sig.message || "")}</textarea></label><div class="gx-comp"><label class="tw-l"><span>How far it carries (light years)</span><input class="t-in" type="number" step="any" min="0" name="sig_r" value="${sig.range != null ? sig.range : 2}"></label><label class="tw-l"><span>Where it really comes from (only you)</span><input class="t-in" name="sig_src" maxlength="160" value="${esc(sig.source || "")}"></label></div></details>
      <details class="gx-how"${drift.speed ? " open" : ""}><summary class="t-small">Drifting</summary><div class="gx-comp"><label class="tw-l"><span>Light years a day (0: it keeps its place)</span><input class="t-in" type="number" step="any" min="0" name="dr_s" value="${drift.speed || 0}"></label><label class="tw-l"><span>Towards (degrees: 0 east, 90 south)</span><input class="t-in" type="number" step="any" name="dr_d" value="${drift.dir || 0}"></label></div></details>`}
      <h5>Found</h5><label class="t-fogck"><input type="checkbox" name="hidden"${t.hidden ? " checked" : ""}> Hidden until the players find it</label>
      <div class="tj-keys">${SP.CONDS.map(([k, l]) => `<label class="t-fogck"><input type="checkbox" name="c_${k}"${(t.conds || []).includes(k) ? " checked" : ""}> ${esc(l)}</label>`).join("")}</div>
      ${clues.length ? `<label class="tw-l"><span>The clue that leads to it</span>${sel("clue", [["", "None"], ...clues], t.clue || "")}</label>` : ""}${evs.length ? `<label class="tw-l"><span>The event that reveals it</span>${sel("event", [["", "None"], ...evs], t.event || "")}</label>` : ""}
      <label class="tw-l"><span>When one of these happens</span>${sel("reveal", [["tell", "Tell me, and I show it to the players"], ["auto", "Show it to the players by itself"]], t.reveal || "tell")}</label>
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="tmove" data-id="${esc(t.id)}">Move it</button>${A.tableUI && A.tableUI.api && A.tableUI.api.askRaw ? `<button type="button" class="t-mini" data-gx="tfill" data-id="${esc(t.id)}" title="Claude writes what it is, its story, its crew and cargo and its message; nothing is kept until you keep it">Fill it in with Claude</button>` : ""}<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="tdel" data-id="${esc(t.id)}">Take it away</button></div><p class="t-small kn gx-tfill" aria-live="polite"></p></form></section>`;
  }
  // Claude fills the card (what it is, its story, its crew, cargo and message): into the form only, kept when the game
  // master keeps it
  async function fillThing(t, f, btn) {
    const msg = f.querySelector(".gx-tfill"), ask = A.tableUI && A.tableUI.api && A.tableUI.api.askRaw; if (!ask) return;
    const cfg = A.config || {}, near = allSys().map(s => [s, lyTo(t, s)]).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([s, d]) => `${s.name} (${round1(d)} ly)`).join(", ");
    const prompt = `A tabletop roleplaying campaign among the stars: "${cfg.title || ""}" (${[cfg.system, cfg.setting].filter(Boolean).join(", ")}). Out in space, near ${near || "no star"}, the game master has placed ${SP.label(t.kind).toLowerCase()} called "${f.elements.name.value}".${f.elements.gm.value ? " Their notes: " + f.elements.gm.value : ""}\nWrite it for them, in the voice of the campaign. Answer with JSON only: {"desc": "what the players see of it, two or three sentences, no secrets", "gm": "for the game master only: what it really is, its story, one secret and one thing that could happen there, four or five sentences", "condition": "a few words", "crew": "who is or was aboard, a sentence", "cargo": "what it carries, a sentence", "message": "its signal's words, if it broadcasts, else empty"}. Invent nothing about the campaign's own people or events; anything new reads as a suggestion.`;
    btn.disabled = true; msg.textContent = "Asking Claude…"; let v = null;
    try { const raw = await ask(prompt, null, null, { kind: "writing", what: "what " + (f.elements.name.value || "it") + " is", uses: ["its kind", "your notes", "the stars near it"] }); const m = String(raw || "").match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : null; } catch (e) { v = null; }
    btn.disabled = false; if (!v) { msg.textContent = "Claude could not answer just now. Write it yourself, or try again."; return; }
    const put = (n, x) => { if (x && f.elements[n]) f.elements[n].value = String(x).slice(0, 3000); };
    put("desc", v.desc); put("gm", v.gm); put("condition", v.condition); put("crew", v.crew); put("cargo", v.cargo); if (v.message && f.elements.sig_msg) { put("sig_msg", v.message); }
    msg.textContent = "Suggested: change anything, then Keep it. Nothing is kept until you do.";
  }
  /* ---- the library of premade worlds, stars and systems (atlas-library.js; the editing plan of 10 Nov 2026, stage 3),
          and a world's own look: its picture changed, never its physics */
  const LIB = A.library;
  // a premade star as the planet maker makes it (its light, warmth, size, age and metals given), for a preview or a world
  function presetStar(sp) { const S0 = A.planets.system(sp.cls, Gg.rng("libstar|" + sp.id), { star: { mass: sp.mass, age: sp.age / 1000, feh: sp.feh, lum: sp.lum, teff: sp.teff, radius: sp.radius } }).star; return Object.assign({}, S0, { name: sp.name, special: sp.special, radius: sp.radius, frost: 2.7 * Math.sqrt(Math.max(S0.lum, .0005)) }); }
  const REFINFO = {};
  const refInfo = cls => REFINFO[cls] || (REFINFO[cls] = { star: presetStar(LIB.get(cls === "M" ? "m-quiet" : "g-sun")), planets: [], belts: [], sites: [] });
  // a premade world worked out at an orbit of a star (info), as the planet maker makes it there; its look and its name
  function presetWorld(w, info, a, n, name) {
    const R = w.recipe, mk = (t, life) => Gg.rework(G(), info, { a, mass: R.mass, env: R.env, ecc: 0, name: name || w.name }, { a, mass: R.mass, wf: R.wf, fe: R.fe, tect: R.tect, pressure: R.pressure, gas: R.gas, life, seed: R.seed + t });
    let q = null;
    for (let t = 0; t < 40; t++) { q = mk(t, R.life); if (LIB.fits(w, q)) break; }
    // (a living world put where it cannot be one: its life no longer set, the planet maker deciding again whether life arose)
    if (R.life && !LIB.fits(w, q)) q = mk(0, null);
    return Object.assign(q, { n, name: name || w.name, look: Object.assign({}, w.look), preset: w.id, hand: true, minerals: q.minerals || (w.say && /mineral|sulphur|iron|carbon|salt|copper|basalt|olivine|silica/.test(w.say) ? w.say : "silicates"), chance: q.chance || "Nothing yet found" });
  }
  const PREV = new Map();
  const previewOf = w => { let p = PREV.get(w.id); if (!p) { const ri = refInfo(w.star); p = presetWorld(w, ri, LIB.fitOrbit(w, ri.star.lum), 0); PREV.set(w.id, p); } return p; };
  // the library's window: its worlds by kind (or its stars, or its systems), each drawn; a choice made, onPick(it)
  function libDlg(mode, onPick, ctx) {
    if (!LIB) return; let dlg = document.getElementById("libDlg");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "libDlg"; dlg.className = "lib-dlg"; document.body.appendChild(dlg); }
    const groups = mode === "star" ? [["red", "Red dwarfs", s => s.cls === "M"], ["sun", "Orange, yellow and white", s => "KGFA".includes(s.cls) && !s.special.match(/super|ttauri/)], ["hot", "Blue, giants and supergiants", s => "OBR".includes(s.cls) || /super|giant|wolfrayet/.test(s.special)], ["dead", "White dwarfs, neutron stars, black holes", s => "DNX".includes(s.cls)], ["odd", "Brown dwarfs and young stars", s => "LTY".includes(s.cls) || s.special === "ttauri"]] : mode === "system" ? [["all", "Systems", () => true]] : LIB.CATS.map(c => [c.id, c.name, w => w.cat === c.id]);
    const list = mode === "star" ? LIB.STARS : mode === "system" ? LIB.SYSTEMS : LIB.WORLDS, MY = A.myLibrary, myKind = { world: "world", system: "system", look: "look" }[mode];
    let cur = (dlg.dataset.mode === mode && dlg.dataset.g) || groups[0][0], mine = [];
    // (your own, kept to use in any campaign: atlas-mylib.js; loaded as the window opens)
    if (MY && myKind) MY.list(myKind).then(l => { mine = l; if (l.length && !groups.some(g => g[0] === "mine")) groups.push(["mine", "Yours", () => true]); if (dlg.open && dlg.dataset.mode === mode) draw(); });
    const draw = () => {
      if (cur === "mine" && !mine.length) cur = groups[0][0];
      const g0 = groups.find(g => g[0] === cur) || groups[0], items = cur === "mine" ? [] : list.filter(g0[2]);
      dlg.innerHTML = `<div class="lib-head"><h3>${mode === "star" ? "Stars from the library" : mode === "system" ? "Systems from the library" : mode === "look" ? "Looks from the library" : "Worlds from the library"}</h3><button type="button" class="t-btn" data-lib="x">Close</button></div>
        ${ctx && ctx.say ? `<p class="t-small">${esc(ctx.say)}</p>` : ""}${groups.length > 1 ? `<div class="lib-tabs" role="tablist">${groups.map(g => `<button type="button" role="tab" class="gx-b" data-lib="tab" data-g="${g[0]}" aria-pressed="${g[0] === cur}">${esc(g[1])}</button>`).join("")}</div>` : ""}
        ${cur === "mine" ? `<p class="t-small kn">Kept ${esc(MY.where())}. Each comes in as a copy of its own: changing it here changes no other campaign.</p><div class="lib-grid">${mine.map(it => `<div class="lib-tile lib-mine"><button type="button" class="lib-pickm" data-lib="pickmine" data-id="${esc(it.id)}"><canvas data-mypic="${esc(it.id)}" width="64" height="64" aria-hidden="true"></canvas><b>${esc(it.name)}</b><span class="kn">${esc(it.say || "")}${it.from ? " · from " + esc(it.from) : ""}</span></button><button type="button" class="t-mini" data-lib="forget" data-id="${esc(it.id)}">Forget it</button></div>`).join("")}</div>` : ""}
        <div class="lib-grid">${items.map(it => `<button type="button" class="lib-tile" data-lib="pick" data-id="${esc(it.id)}"><canvas data-libpic="${esc(it.id)}" width="64" height="64" aria-hidden="true"></canvas><b>${esc(it.name)}</b><span class="kn">${esc(mode === "system" ? `${(LIB.get(it.star) || {}).name || ""} · ${it.worlds.length} worlds` : mode === "star" ? `${it.cls === "X" ? "" : (it.teff ? it.teff.toLocaleString("en") + " K · " : "")}${it.mass} Suns` : (it.say || it.catName))}</span><span class="lib-fit t-small" data-libfit="${esc(it.id)}"></span></button>`).join("")}</div>`;
      dlg.dataset.mode = mode; dlg.dataset.g = cur;
      // each drawn, a few at a time, so the window opens at once; and for a world to put at an orbit, whether it stays of
      // its kind there
      for (const cv of dlg.querySelectorAll("canvas[data-mypic]")) { const it = mine.find(x => x.id === cv.dataset.mypic); if (it) try { drawMine(cv, it); } catch (e) { console.warn(e); } }
      const pics = [...dlg.querySelectorAll("canvas[data-libpic]")]; let i = 0;
      const step = () => { const t0 = Date.now(); while (i < pics.length && Date.now() - t0 < 30) { const cv = pics[i++], it = LIB.get(cv.dataset.libpic); try { drawPreset(cv, it, mode); if (mode === "world" && ctx && ctx.info && ctx.a) { const q = presetWorld(it, ctx.info, ctx.a, 0), f = dlg.querySelector(`[data-libfit="${CSS.escape(it.id)}"]`); if (f) f.textContent = LIB.fits(it, q) ? "fits here" : `here: ${String(q.kname || q.kind).toLowerCase()}`; } } catch (e) { console.warn(e); } } if (i < pics.length && dlg.open) setTimeout(step, 0); };
      setTimeout(step, 0);
    };
    dlg.onclick = e => { const b = e.target.closest("[data-lib]"); if (!b) { if (e.target === dlg) dlg.close(); return; } if (b.dataset.lib === "x") dlg.close(); else if (b.dataset.lib === "tab") { cur = b.dataset.g; draw(); } else if (b.dataset.lib === "pick") { const it = LIB.get(b.dataset.id); dlg.close(); if (it) onPick(it); }
      else if (b.dataset.lib === "pickmine") { const it = mine.find(x => x.id === b.dataset.id); dlg.close(); if (it) onPick(mode === "look" ? { mine: it, look: it.data.look || it.data, name: it.name } : { mine: it, name: it.name }); }
      else if (b.dataset.lib === "forget") { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Forget it? Click again"; return; } MY.forget(b.dataset.id).then(() => { mine = mine.filter(x => x.id !== b.dataset.id); if (!mine.length) { const k = groups.findIndex(g => g[0] === "mine"); if (k >= 0) groups.splice(k, 1); } draw(); }); } };
    draw(); if (!dlg.open) dlg.showModal();
  }
  // a picture of something of your own: a system by its star, a world as it is painted, a look on a world of its kind
  function drawMine(cv, it) {
    const c = cv.getContext("2d"); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 64, 64); c.fillStyle = "#04060b"; c.fillRect(0, 0, 64, 64); const d = it.data || {};
    if (it.kind === "system") { const ic = A.starSystem && A.starSystem.starIcon ? A.starSystem.starIcon(d.cls || "G", d.special || "", 14) : null; if (ic) { const s0 = "DN".includes(d.cls) ? 22 : 44; c.drawImage(ic, 32 - s0 / 2, 32 - s0 / 2, s0, s0); } return; }
    const p = it.kind === "look" ? Object.assign({}, d.ref || { kind: "rocky", name: it.name, palette: {} }, { look: d.look || d }) : d;
    if (!A.pixelPlanet) return; const pic = A.pixelPlanet.canvasOf(p, 24, .6, "#fff4ea"), k = Math.min(44 / 24, 62 / pic.width); c.drawImage(pic, 32 - pic.width * k / 2, 32 - pic.height * k / 2, pic.width * k, pic.height * k);
  }
  // something of your own put into this campaign, as a copy of its own: a world at an orbit (worked out there, or its
  // figures kept), a system where the game master right-clicked
  function addMyWorld(s, a, it, ev) {
    const D = doc(s.id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), n = nextN(info), nm = `${s.name} ${nextLetter(info)}`, w = JSON.parse(JSON.stringify(it.data));
    const base = Object.assign(w, { n, name: nm, hand: true, mine: it.id }); delete base.moonNames;
    const put = x => { B.add = (B.add || []).concat(x); setG(s.id, D); UI.planet = n; UI.moon = null; refresh(); if (A.tableUI) A.tableUI.api.note(`${nm}: your ${it.name}, ${x.keepA ? "its figures kept" : "worked out"} ${a} AU from ${s.name}.`); };
    const work = () => put(Object.assign({}, base, base.inputs ? { a, phys: Object.assign({}, base.phys || {}, { a }) } : { a }));
    const keep = () => put(Object.assign({}, base, { a, keepA: true }));
    if (!base.inputs || !Gg.rework) { keep(); return; }
    if (A.ux && ev) A.ux.menu(ev, [{ label: "Work it out at this orbit", hint: "its warmth, its air, its seas follow", run: work }, { label: "Keep its figures", hint: "your setting's", run: keep }], `Your ${it.name}, ${a} AU out`); else work();
  }
  function addMySystem(wx, wy, it) {
    const id = "C" + Date.now().toString(36), d = JSON.parse(JSON.stringify(it.data));
    for (const k of ["kept", "i0", "lock", "mark", "gone"]) delete d[k];
    setG(id, Object.assign(d, { added: true, whole: true, noGen: true, x: r1c(wx), y: r1c(wy), mine: it.id, t: Date.now() }));
    UI.tools = true; UI.sel = id; refresh(); if (A.tableUI) A.tableUI.api.note(`${d.name}: your system from your library, its star and worlds as you kept them.`);
  }
  // kept in your own library: a copy, taken out of this campaign's ties (its id, its place on this chart)
  async function keepMine(kind, name, say, data) {
    if (!A.myLibrary) return; try { await A.myLibrary.save({ kind, name, say, data }); if (A.tableUI) A.tableUI.api.note(`${name} kept in your library, ${A.myLibrary.where()}.`); } catch (e) { if (A.tableUI) A.tableUI.api.note("Not kept: " + e.message); }
  }
  function drawPreset(cv, it, mode) {
    const c = cv.getContext("2d"); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 64, 64); c.fillStyle = "#04060b"; c.fillRect(0, 0, 64, 64);
    if (mode === "star" || mode === "system") { const sp = mode === "system" ? LIB.get(it.star) : it, ic = A.starSystem && A.starSystem.starIcon ? A.starSystem.starIcon(sp.cls, sp.special, 14) : null; if (ic) { const s0 = sp.special === "super" ? 56 : "DN".includes(sp.cls) ? 22 : "LTY".includes(sp.cls) ? 30 : 44; c.drawImage(ic, 32 - s0 / 2, 32 - s0 / 2, s0, s0); } return; }
    const p = previewOf(it), pic = A.pixelPlanet.canvasOf(p, 24, .6, "#fff4ea"), k = Math.min(44 / 24, 62 / pic.width); c.drawImage(pic, 32 - pic.width * k / 2, 32 - pic.height * k / 2, pic.width * k, pic.height * k);
  }
  // a premade world put at an orbit: worked out there; if it is no longer of its kind, the game master chooses
  function sysAddPreset(s, a, w, ev) {
    if (w.mine) return addMyWorld(s, a, w.mine, ev);
    const D = doc(s.id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), n = nextN(info), nm = `${s.name} ${nextLetter(info)}`, q = presetWorld(w, info, a, n, nm);
    const put = x => { B.add = (B.add || []).concat(x); setG(s.id, D); UI.planet = n; UI.moon = null; refresh(); };
    if (LIB.fits(w, q)) { put(q); if (A.tableUI) A.tableUI.api.note(`${nm}: the library's “${w.name}”, worked out ${a} AU from ${s.name}.`); return; }
    const keep = () => { const ri = refInfo(w.star), k = presetWorld(w, ri, LIB.fitOrbit(w, ri.star.lum), n, nm); put(Object.assign(k, { a, keepA: true, override: `At ${a} AU from ${s.name} it would be ${String(q.kname || q.kind).toLowerCase()}: kept as the library's ${w.name}, your setting's` })); };
    if (A.ux && ev) A.ux.menu(ev, [{ label: `Work it out here: ${String(q.kname || q.kind).toLowerCase()}`, run: () => { put(q); } }, { label: `Keep it as the library's ${w.name}`, hint: "your setting's", run: keep }], `Here, ${w.name} would change`); else put(q);
  }
  // a premade star given to a system: its kind, mass, age, metals, light and warmth (its worlds made again round it,
  // the game master's own kept)
  function setStarPreset(id, sp) { const s = findSys(id); if (!s) return; setG(id, Object.assign(doc(id), { cls: sp.cls, special: sp.special || "", m2: { cls: sp.cls, mass: sp.mass, m0: sp.mass, age: sp.age, feh: sp.feh, lum: sp.lum, teff: sp.teff, radius: sp.radius, name: sp.name }, t: Date.now() })); refresh(); if (A.tableUI) A.tableUI.api.note(`${s.name}: ${sp.name.toLowerCase()}. Its worlds are made again round it; your own stay.`); }
  // a premade system where the game master right-clicked: its star, and its worlds and belts at their orbits
  function addSystemPreset(wx, wy, sy) {
    if (sy.mine) return addMySystem(wx, wy, sy.mine);
    const sp = LIB.get(sy.star); if (!sp) return; const id = "C" + Date.now().toString(36), nm = Gg.nameOf ? Gg.nameOf(Gg.rng(id + "|name")) : "A new system", info = { star: presetStar(sp), planets: [], belts: [], sites: [] };
    const worlds = sy.worlds.map(([wid, a], i) => { const w = LIB.get(wid); return w ? presetWorld(w, info, a, 100 + i, `${nm} ${"bcdefghijklmnop"[i]}`) : null; }).filter(Boolean);
    setG(id, { added: true, name: nm, x: r1c(wx), y: r1c(wy), f: {}, cls: sp.cls, special: sp.special || "", noGen: true, m2: { cls: sp.cls, mass: sp.mass, m0: sp.mass, age: sp.age, feh: sp.feh, lum: sp.lum, teff: sp.teff, radius: sp.radius, name: sp.name }, bodies: { add: worlds, addB: (sy.belts || []).map((a, i) => ({ k: 100 + i, a, name: a > info.star.frost ? "An icy belt" : "An asteroid belt", rich: false, icy: a > info.star.frost })) }, t: Date.now() });
    UI.tools = true; UI.sel = id; refresh(); if (A.tableUI) A.tableUI.api.note(`${nm}: the library's “${sy.name}”, ${sy.say}.`);
  }
  // a world's look: its picture's colours, clouds, ice, bands, storm, rings, hue, turn and size on the map
  function lookForm(s, p) {
    const L = p.look || {}, P = (A.pixelPlanet && A.pixelPlanet.withLook ? A.pixelPlanet.withLook(p) : p).palette || {}, giant = /gas|ice|mini/.test(p.env || "") || ["gas", "icegiant", "hotjupiter", "mini"].includes(p.kind), rg = L.rings || {};
    const rng0 = (k, l, mn, mx, st, v, on) => `<label class="tw-l lk-r"><span>${l}</span><input type="range" name="${k}" min="${mn}" max="${mx}" step="${st}" value="${v}"${on ? ' data-on="1"' : ""}></label>`;
    const col = (k, l, v, on) => `<label class="lk-c"><input type="color" name="${k}" value="${esc(v || "#888888")}"${on ? ' data-on="1"' : ""}> ${l}</label>`;
    return `<form class="gx-wform gx-look" data-gx="savelook" data-id="${esc(s.id)}" data-n="${p.n}"><h4>The look of ${esc(p.name)}</h4>
      <p class="t-small">Only its picture changes: its physics (its size, air, warmth, seas) stay as they are. Its real size is in Change this world.</p>
      <canvas class="lk-prev" width="112" height="112" role="img" aria-label="How it will look"></canvas>
      <div class="t-row"><button type="button" class="t-mini" data-gx="looklib">Start from a library look…</button></div>
      ${rng0("hue", "Hue", -180, 180, 5, L.hue || 0, L.hue != null)}${rng0("sat", "Saturation", 0, 2, .05, L.sat != null ? L.sat : 1, L.sat != null)}${rng0("bright", "Brightness", .5, 1.6, .05, L.bright != null ? L.bright : 1, L.bright != null)}
      <div class="lk-cols">${giant ? [0, 1, 2].map(i => col("band" + i, i ? "" : "Its bands", (L.bands || P.bands || [])[i] || ["#d8c0a0", "#b08860", "#e6d6bc"][i], !!L.bands)).join("") : col("ground", "Ground", P.ground, !!L.ground) + col("sea", "Seas", P.sea || "#2a5a8a", !!L.sea) + col("plant", "Plants", P.plant || "#4f7a3a", !!L.plant)}${col("cloudCol", "Clouds", P.clouds || "#ffffff", !!L.cloudCol)}${col("sky", "Glow of its air", P.sky || "#7fa8d8", !!L.sky)}</div>
      ${giant ? `${rng0("bandsN", "How many bands", 2, 20, 1, L.bandsN || 8, L.bandsN != null)}<label class="t-fogck"><input type="checkbox" name="storm"${(L.storm != null ? L.storm : /great/.test((p.winds || {}).storms || "")) ? " checked" : ""}${L.storm != null ? ' data-on="1"' : ""}> A great storm</label>` : `${rng0("clouds", "Clouds", 0, 1, .05, L.clouds != null ? L.clouds : .5, L.clouds != null)}${rng0("ice", "Ice", 0, 1, .05, L.ice != null ? L.ice : (p.ice || 0), L.ice != null)}${rng0("ocean", "How much is sea, in its picture", 0, 1, .05, L.ocean != null ? L.ocean : (p.ocean || 0), L.ocean != null)}${rng0("craters", "Craters", 0, 4, .1, L.craters != null ? L.craters : 1, L.craters != null)}`}
      <fieldset class="lk-ring"><legend class="t-small">Rings</legend><label class="t-fogck"><input type="checkbox" name="r_on"${(L.rings ? rg.on : !!p.rings) ? " checked" : ""}${L.rings ? ' data-on="1"' : ""}> Rings</label>${rng0("r_w", "Width", .5, 1.8, .05, rg.width || 1, L.rings != null)}${rng0("r_tilt", "Tilt", -80, 80, 1, rg.tilt != null ? rg.tilt : 18, L.rings != null)}${col("r_tint", "Their colour", rg.tint || (p.rings && !p.rings.icy ? "#968a78" : "#e2dccc"), L.rings != null)}</fieldset>
      ${rng0("rot", "Turned", 0, 360, 5, L.rot || 0, L.rot != null)}${rng0("size", "Its size on the map (the picture only)", .4, 2.5, .05, L.size || 1, L.size != null)}
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="look" data-n="">Cancel</button>${p.look ? `<button type="button" class="t-mini" data-gx="unlook" data-id="${esc(s.id)}" data-n="${p.n}">As it was</button>` : ""}${A.myLibrary ? `<button type="button" class="t-mini" data-gx="myliblook" data-id="${esc(s.id)}" data-n="${p.n}" title="This look, to give any world in any of your campaigns">Keep this look in my library</button>` : ""}</div></form>`;
  }
  // the look the form says: only what the game master touched (or had set before)
  function lookOfForm(f) {
    const on = n => f.elements[n] && f.elements[n].dataset.on === "1", v = n => f.elements[n] ? f.elements[n].value : "", L = {};
    for (const k of ["hue", "sat", "bright", "clouds", "ice", "ocean", "craters", "bandsN", "rot", "size"]) if (on(k)) L[k] = +v(k);
    for (const k of ["ground", "sea", "plant", "cloudCol", "sky"]) if (on(k)) L[k] = v(k);
    if (f.elements.band0 && (on("band0") || on("band1") || on("band2"))) L.bands = [v("band0"), v("band1"), v("band2")];
    if (on("storm")) L.storm = !!f.elements.storm.checked;
    if (on("r_on") || on("r_w") || on("r_tilt") || on("r_tint")) L.rings = { on: !!f.elements.r_on.checked, width: +v("r_w"), tilt: +v("r_tilt"), tint: v("r_tint") };
    return L;
  }
  function lookPreview(f) { const s = findSys(f.dataset.id), info = s && bodiesOf(s), p = info && info.planets.find(x => x.n === +f.dataset.n), cv = f.querySelector(".lk-prev"); if (!p || !cv || !A.pixelPlanet) return; const pic = A.pixelPlanet.canvasOf(Object.assign({}, p, { look: lookOfForm(f) }), 40, .6, info.star.color), c = cv.getContext("2d"); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 112, 112); const k = 112 / Math.max(pic.width, 40) * .98; c.drawImage(pic, 56 - pic.width * k / 2, 56 - pic.height * k / 2, pic.width * k, pic.height * k); }
  function thingPlace(t) { if (A.locations && A.locations.forPlace) A.locations.forPlace({ thing: t.id, kind: t.kind, name: t.name, pd: t.desc || "", kp: t.gm || "", label: t.name, done: () => refresh() }); }
  A.galaxyThing = id => { if (!host) return false; const t = thingById(id); if (!t) return false; if (A.starSystem && A.starSystem.isOpen()) leaveSystem(false); UI.thing = id; UI.sel = null; const p = gxOf(thingAt(t)); flyTo(p.x, p.y, Math.max(CAM.s, sChart() * 4), 400); side(); return true; };

  // (Back in the page's own history to the chart without a system: the system's map closed)
  A.galaxyClose = () => { if (UI.sys || (A.starSystem && A.starSystem.isOpen())) leaveSystem(false); if (SV) sideClose(); if (TL) tlClose(); };

  /* ---- the galaxy edge-on (the galaxy plan, section 5: "a side view shows the galaxy edge-on"): the whole of it seen
          from the side, across the line from its centre through our space; and our space itself from the side, each
          system at its height above or below the plane, the ship's height and the depth slice marked. Over the chart's
          picture, as a system's map is */
  let SV = null;
  function sideOpen() {
    if (SV) { sideClose(); return; }
    if (A.starSystem && A.starSystem.isOpen()) leaveSystem(false);
    galaxyModel(); if (!MG || !host) return;
    const under = host.querySelector(".gx-canvas"), el = document.createElement("div");
    el.className = "gx-sidev"; el.tabIndex = -1; el.setAttribute("role", "region"); el.setAttribute("aria-label", "The galaxy edge-on");
    el.innerHTML = `<div class="ss-bar"><button type="button" class="gx-b" data-gx="sideview" title="Back to the chart (Esc)">← The chart</button><span class="ss-title"><b>${esc(MG.name)}, edge-on</b></span></div>
      <div class="gx-svb"><canvas class="gx-sv1" role="img" aria-label="The whole galaxy seen from the side, with our space marked"></canvas><p class="gx-svs t-small"></p><canvas class="gx-sv2" role="img" aria-label="Our space seen from the side: each system at its height above or below the plane"></canvas><p class="gx-svs2 t-small"></p></div>`;
    under.parentNode.appendChild(el); el.style.top = under.offsetTop + "px"; el.style.height = under.offsetHeight + "px";
    SV = { el }; const b = host.querySelector('.gx-bar [data-gx="sideview"]'); if (b) b.setAttribute("aria-pressed", "true");
    sideDraw(); el.focus({ preventScroll: true });
  }
  /* ---- the galaxy turning (the galaxy plan, section 4 and stage E): a film, 500 million years in a minute. Its stars go
          round at the speed the galaxy's weight gives them where they are (inner ones lap outer ones), weave in and out
          and bob through the plane; the arms are a pattern they pass through, lit by the young stars born in it, who
          drift away as they age; the bar turns at its own pace. It never moves the campaign's stars: they keep their
          charted places, and the film says so, with the honest figure for the campaign's own time. */
  let TL = null;
  function tlOpen() {
    if (TL) { tlClose(); return; }
    if (A.starSystem && A.starSystem.isOpen()) leaveSystem(false); if (SV) sideClose();
    galaxyModel(); if (!MG || !host) return;
    const under = host.querySelector(".gx-canvas"), el = document.createElement("div"), R = Math.hypot(FR.x, FR.y), Rk = R / GMOD.KPC;
    const v = Rk > .3 ? GMOD.vcirc(MG, Rk) : 0, ten = v * 3.156e7 * 10 / 9.461e12;   // light years in ten years (km/s, seconds in a year, km in a light year)
    el.className = "gx-sidev gx-tl"; el.tabIndex = -1; el.setAttribute("role", "region"); el.setAttribute("aria-label", "The galaxy turning, as a film");
    el.innerHTML = `<div class="ss-bar"><button type="button" class="gx-b" data-gx="timelapse" title="Back to the chart (Esc)">← The chart</button><span class="ss-title"><b>${esc(MG.name)}, turning</b></span><span class="ss-sp"></span><button type="button" class="gx-b" data-gx="tlplay" aria-pressed="true">Pause</button><button type="button" class="gx-b" data-gx="tlback">From the start</button></div>
      <div class="gx-tlb"><canvas class="gx-tlcv" role="img" aria-label="The galaxy's stars going round its centre"></canvas><div class="gx-tlt"></div>
      <p class="t-small">A film: 500 million years in a minute. Your campaign's stars stay where they are charted. ${v ? `In ten years of the campaign's own time a star near ours moves about ${ten < .1 ? (Math.round(ten * 1000) / 1000) : Math.round(ten * 10) / 10} light years: nothing anyone could see.` : ""} Stars further in go round sooner: our space once in about ${Rk > .3 ? Math.round(GMOD.period(MG, Rk)) : "?"} million years. The arms are drawn as waves the stars pass through, lit by the young stars born in them; that is one of two ideas of what arms are (in the other they come and go).</p></div>`;
    under.parentNode.appendChild(el); el.style.top = under.offsetTop + "px"; el.style.height = under.offsetHeight + "px";
    const n = Math.min(14000, Math.max(5000, Math.round((Wpx() * Hpx()) / 50)));
    TL = { el, P: GMOD.particles(MG, n, (A.galaxyParams || {}).seed || "tl"), t: 0, last: 0, play: !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches), raf: 0, sun: { Rk, th: Math.atan2(FR.y, FR.x), o: Rk > .3 ? GMOD.omega(MG, Rk) : 0 } };
    if (!TL.play) { const b = el.querySelector('[data-gx="tlplay"]'); b.textContent = "Play"; b.setAttribute("aria-pressed", "false"); }
    const b = host.querySelector('.gx-bar [data-gx="timelapse"]'); if (b) b.setAttribute("aria-pressed", "true");
    TL.raf = requestAnimationFrame(tlFrame); el.focus({ preventScroll: true });
  }
  function tlClose() { if (!TL) return; cancelAnimationFrame(TL.raf); TL.el.remove(); TL = null; const b = host && host.querySelector('.gx-bar [data-gx="timelapse"]'); if (b) b.setAttribute("aria-pressed", "false"); }
  function tlFrame(now) {
    if (!TL || !TL.el.isConnected) { TL = null; return; }
    const cv = TL.el.querySelector(".gx-tlcv"), w = Math.max(260, Math.min(1000, TL.el.clientWidth - 24)), h = Math.max(220, Math.min(TL.el.clientHeight - 150, w * .62)), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px"; }
    if (TL.play && TL.last) TL.t += (now - TL.last) / 1000 * (500 / 60);       // million years: 500 in a minute
    TL.last = now;
    // (the old stars faint, so the young ones show the arms as a real galaxy's blue light does)
    const g = cv.getContext("2d"), L = MG.Rmax * .78, k = Math.min(w, h) / (2 * L), cx = w / 2, cy = h / 2;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = "rgba(4,6,11,1)"; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";
    for (const p of TL.P) { const q = GMOD.particleAt(MG, p, TL.t), x = cx + q.x * k, y = cy + q.y * k; if (x < 0 || y < 0 || x > w || y > h) continue; if (q.young) { const a = Math.max(.12, 1 - q.age / 160); g.fillStyle = `rgba(150,190,255,${(a * .9).toFixed(2)})`; g.fillRect(x, y, 2, 2); } else { g.fillStyle = p.bulge ? "rgba(255,205,150,.22)" : "rgba(255,236,210,.13)"; g.fillRect(x, y, 1.4, 1.4); } }
    g.globalCompositeOperation = "source-over";
    // the bar's own turning, and our space going round with the stars near it
    if (MG.T.bar) { const a = MG.T.bar.angle * Math.PI / 180 + GMOD.patternAngle(MG, TL.t, "bar"), l = MG.T.bar.a * GMOD.KPC * k; g.strokeStyle = "rgba(255,220,180,.22)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - Math.cos(a) * l, cy - Math.sin(a) * l); g.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); g.stroke(); }
    if (TL.sun.o) { const th = TL.sun.th + TL.sun.o * TL.t, x = cx + Math.cos(th) * TL.sun.Rk * GMOD.KPC * k, y = cy + Math.sin(th) * TL.sun.Rk * GMOD.KPC * k; g.strokeStyle = "#8fd19e"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 5, 0, 6.2832); g.stroke(); g.fillStyle = "#8fd19e"; g.font = "11px sans-serif"; g.fillText("our space", x + 8, y + 4); }
    const tt = TL.el.querySelector(".gx-tlt"), say = TL.t < 1 ? "now" : `${Math.round(TL.t).toLocaleString("en")} million years on${TL.sun.o ? `: our space ${Math.floor(TL.t * TL.sun.o / (Math.PI * 2) * 10) / 10} times round` : ""}`;
    if (tt.textContent !== say) tt.textContent = say;
    TL.raf = requestAnimationFrame(tlFrame);
  }
  function sideClose() { if (!SV) return; SV.el.remove(); SV = null; const b = host && host.querySelector('.gx-bar [data-gx="sideview"]'); if (b) b.setAttribute("aria-pressed", "false"); }
  function sideDraw() {
    if (!SV || !SV.el.isConnected) return;
    const el = SV.el, c1 = el.querySelector(".gx-sv1"), c2 = el.querySelector(".gx-sv2"), w = Math.max(280, Math.min(1100, el.clientWidth - 24)), h = Math.round(w / 4);
    const R = Math.hypot(FR.x, FR.y), ux = R > 1 ? FR.x / R : 1, uy = R > 1 ? FR.y / R : 0, nice2 = v => Math.round(v).toLocaleString("en");
    // the whole galaxy, from the side
    c1.width = w; c1.height = h; const g1 = c1.getContext("2d");
    const P = ART.sidePicture(MG, Math.round(w / 2), Math.round(h / 2), ux, uy, () => sideDraw());
    g1.fillStyle = "#04060b"; g1.fillRect(0, 0, w, h);
    const X = u => (u + P.L) / (2 * P.L) * w, Y = z => h / 2 - z / P.Z * h / 2;
    if (P.done) g1.drawImage(P.cv, 0, 0, w, h); else { g1.fillStyle = "#8fa0bb"; g1.font = "12px sans-serif"; g1.fillText("Painting the galaxy from the side…", 12, 20); }
    g1.font = "11px sans-serif"; g1.textAlign = "center";
    if (MG.bh) { g1.strokeStyle = "#ffd9a8"; g1.beginPath(); g1.arc(X(0), Y(0), 3, 0, 6.2832); g1.stroke(); g1.fillStyle = "#ffe9c8"; g1.fillText(MG.bh.name, X(0), Y(0) - 8); }
    const span = G().p.span || 100, x0 = X(R - span / 2), x1 = X(R + span / 2), bw = Math.max(5, x1 - x0);
    g1.strokeStyle = "#8fd19e"; g1.lineWidth = 1.4; g1.strokeRect((x0 + x1) / 2 - bw / 2, Y(FR.z) - Math.max(4, bw / 2), bw, Math.max(8, bw)); g1.fillStyle = "#8fd19e"; g1.fillText(R > 1 ? "our space" : "our space: all of it", (x0 + x1) / 2, Y(FR.z) + Math.max(8, bw / 2) + 12);
    { const L10 = 10000, px = L10 / (2 * P.L) * w; g1.strokeStyle = "#cfe0ff"; g1.lineWidth = 1; g1.beginPath(); g1.moveTo(10, h - 10); g1.lineTo(10 + px, h - 10); g1.stroke(); g1.textAlign = "left"; g1.fillStyle = "#cfe0ff"; g1.fillText("10,000 light years", 14 + px, h - 6); }
    el.querySelector(".gx-svs").textContent = `${MG.label}. Its thin disc of stars is some ${nice2(MG.T.hz * GMOD.KPC * 2)} light years thick${MG.T.thick ? `, its older thick disc some ${nice2(MG.T.thick.hz * GMOD.KPC * 2)}` : ""}; across, some ${nice2(MG.Rmax * 2)}. Our space stands ${nice2(Math.abs(FR.z))} light years ${FR.z >= 0 ? "above" : "below"} the middle of its plane.`;
    // our space, from the side: each system at its height
    const L = allSys(), pts = L.map(s => { const p = gxOf(s); return [(p.x - FR.x) * ux + (p.y - FR.y) * uy, s.z || 0, s]; });
    const umax = Math.max(1, ...pts.map(q => Math.abs(q[0]))), zmax = Math.max(0, ...pts.map(q => Math.abs(q[1]))), h2 = 230, w2 = w;
    const k = Math.min((w2 - 40) / (2 * umax), (h2 - 40) / (2 * Math.max(zmax, umax * .04, .5)));
    c2.width = w2; c2.height = h2; const g2 = c2.getContext("2d"); g2.fillStyle = "#04060b"; g2.fillRect(0, 0, w2, h2);
    const U = u => w2 / 2 + u * k, Zs = z => h2 / 2 - z * k, SL = slice(), at = findSys(ship().at), zs = (at && at.z) || 0;
    // the galaxy's own plane, where it is in view; the slice; the ship's height
    const zp = -FR.z; if (Math.abs(zp * k) < h2 / 2) { g2.strokeStyle = "rgba(255,230,190,.35)"; g2.setLineDash([5, 5]); g2.beginPath(); g2.moveTo(0, Zs(zp)); g2.lineTo(w2, Zs(zp)); g2.stroke(); g2.setLineDash([]); g2.fillStyle = "rgba(255,230,190,.6)"; g2.font = "11px sans-serif"; g2.textAlign = "left"; g2.fillText("the middle of the galaxy's plane", 8, Zs(zp) - 4); }
    if (SL) { g2.fillStyle = "rgba(143,209,158,.08)"; g2.fillRect(0, Zs(SL.z + SL.half), w2, SL.half * 2 * k); }
    g2.strokeStyle = "rgba(143,209,158,.55)"; g2.beginPath(); g2.moveTo(0, Zs(zs)); g2.lineTo(w2, Zs(zs)); g2.stroke();
    for (const [u, z, s] of pts) { const away = SL && Math.abs(z - SL.z) > SL.half; g2.globalAlpha = away ? .25 : .95; g2.fillStyle = ART.colour(s.cls); g2.beginPath(); g2.arc(U(u), Zs(z), Math.max(1.2, ART.radius(s.cls) * .75), 0, 6.2832); g2.fill(); }
    g2.globalAlpha = 1; if (at) { const q = pts.find(x => x[2] === at); if (q) { g2.strokeStyle = "#8fd19e"; g2.lineWidth = 2; g2.beginPath(); g2.arc(U(q[0]), Zs(q[1]), 6, 0, 6.2832); g2.stroke(); } }
    { const step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].find(v => v * k >= 70) || 20000; g2.strokeStyle = "#cfe0ff"; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(10, h2 - 10); g2.lineTo(10 + step * k, h2 - 10); g2.stroke(); g2.fillStyle = "#cfe0ff"; g2.font = "11px sans-serif"; g2.textAlign = "left"; g2.fillText(step.toLocaleString("en") + " light years", 14 + step * k, h2 - 6); }
    el.querySelector(".gx-svs2").textContent = zmax ? `Our space from the side, at the same scale both ways: its systems stand up to ${nice2(zmax)} light years above or below the ship's height. The green line is the ship's height${SL ? `; the band, the stars within ${nice2(SL.half)} light years of it (the depth slice in Layers)` : ""}.` : "Our space from the side: this galaxy was made before the heights of its stars were worked out, so its systems all lie in one plane.";
  }

  // the editor's row: what each tool does, the power a territory is painted for, undo and redo
  const REGK = [["danger", "Dangerous"], ["restricted", "Restricted"], ["explored", "Charted space"], ["unexplored", "Unexplored"]];
  const LANEK = [["lane", "A lane"], ["trade", "A trade route"], ["corridor", "A corridor (its own length)"]];
  function tools() {
    if (!host) return; const t = host.querySelector(".gx-tools"), g = G(), on = UI.tools;
    if (A.ux) A.ux.editing(host.querySelector(".gx-canvas"), on ? "the galaxy · " + (UI.adding ? "adding a system" : ({ region: "adding a region", lane: "adding a lane", sector: "adding a sector", terr: "painting territory", remake: "remaking a region" }[UI.tool] || "choose what to change")) : null);
    t.hidden = !on; host.querySelector('[data-gx="tools"]').setAttribute("aria-pressed", on);
    if (!on) return;
    const tb = (k, l, title) => `<button type="button" class="gx-b" data-gx="tool" data-t="${k}" aria-pressed="${k === "add" ? UI.adding : UI.tool === k}" title="${esc(title)}">${l}</button>`;
    const how = UI.adding ? "Click the map where the new system stands." : UI.moving ? "Click the map where it should stand." : UI.movingReg ? "Click the map where the region's middle should be." : UI.tool === "region" ? "Click the middle of the new region." : UI.tool === "remake" ? "Click the middle of the region to grow again." : UI.tool === "sector" ? "Click where the new sector's heart is: the systems nearest it join it." : UI.tool === "lane" ? (UI.first ? `Now click the star the lane from ${esc((findSys(UI.first) || {}).name || "")} goes to.` : "Click the star the lane starts from.") : UI.tool === "terr" ? "Drag over the stars to give them to the power chosen; click one star to give just it." : "Click a star, a region or a lane to change it. Esc puts a tool down.";
    t.innerHTML = tb("add", "+ System", "Then click the map where it stands") + tb("region", "+ Region", "A dangerous, restricted, charted or unexplored region") + tb("lane", "+ Lane", "A lane, a trade route or a corridor between two stars") + tb("sector", "+ Sector", "A new sector: the stars nearest it join it")
      + tb("terr", "Paint territory", "Give stars to a power or a faction") + (UI.tool === "terr" ? `<select class="t-in gx-sel" data-gx="paint" aria-label="Whose territory">${[["", "No one"], ...g.powers.map(p => [p.id, p.name]), ...Object.entries(A.factionsData || {}).filter(([id]) => !g.powers.some(p => p.id === id)).map(([id, f]) => [id, (f.n || id) + " (a faction)"])].map(([v, l]) => `<option value="${esc(v)}"${v === UI.paint ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>` : "")
      + tb("remake", "Remake a region", "Grow the stars inside a circle again, keeping what you made there") + `<button type="button" class="gx-b" data-gx="regrow" aria-pressed="${!!UI.regrow}" title="The galaxy grown again from another seed, keeping your work">Grow it again…</button>` + (smallMap() ? `<button type="button" class="gx-b" data-gx="growround" aria-pressed="${!!UI.grow}" title="A galaxy grown round your systems, which stay as they are">Grow the space round it…</button>` : "")
      + `<button type="button" class="gx-b" data-gx="panel" data-p="sp" aria-pressed="${UI.panel === "sp"}">Sectors and powers</button><button type="button" class="gx-b" data-gx="undo"${HIST.length ? "" : " disabled"} title="Ctrl+Z">Undo</button><button type="button" class="gx-b" data-gx="redo"${REDO.length ? "" : " disabled"} title="Ctrl+Y">Redo</button><button type="button" class="gx-b" data-gx="export" title="Your changes, for the campaign's table.js">Copy the changes</button><span class="gx-how">${how}</span>`;
  }
  function undo(back) { const from = back ? HIST : REDO, to = back ? REDO : HIST, h = from.pop(); if (!h) return; to.push(h); if (h.many) for (const x of (back ? h.many.slice().reverse() : h.many)) setG(x.id, back ? x.before : x.after, "hist"); else setG(h.id, back ? h.before : h.after, "hist"); keepH(); refresh(); if (A.tableUI) A.tableUI.api.note(back ? "Undone." : "Done again."); }
  // painting territory: every star under the brush given to the power chosen (kept when the stroke ends: one change)
  function paintAt(e) {
    const [wx, wy] = chartAt(e), rad = 16 / (CAM.s * FR.k);
    for (const q of allSys()) if ((q.x - wx) ** 2 + (q.y - wy) ** 2 <= rad * rad) drag.paint[q.id] = UI.paint || "";
    paintPts = Object.keys(drag.paint).map(id => { const q = findSys(id); if (!q) return null; const p = gxOf(q); return scr(p.x, p.y); }).filter(Boolean);
    request();
  }
  function clickAt(e) {
    const [wx, wy] = chartAt(e);
    const r1 = v => Math.round(v * 10) / 10, nid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10);
    if (UI.adding) { UI.adding = false; addSystemAt(wx, wy, "random"); return; }
    if (UI.moving) { const id = UI.moving; setG(id, Object.assign(doc(id), { x: r1(wx), y: r1(wy) })); UI.moving = null; refresh(); return; }
    if (UI.movingThing) { const id = UI.movingThing, t = thingById(id); UI.movingThing = null; if (t) setThing(id, Object.assign({ x: r1(wx), y: r1(wy) }, t.drift ? { drift: Object.assign({}, t.drift, { t0: nowMin() }) } : {})); refresh(); return; }
    if (UI.movingReg) { const R = doc("~regions"), id = UI.movingReg, own = (R.add || []).find(q => q.id === id); if (own) Object.assign(own, { x: r1(wx), y: r1(wy) }); else { R.edit = R.edit || {}; R.edit[id] = Object.assign(R.edit[id] || {}, { x: r1(wx), y: r1(wy) }); } setG("~regions", R); UI.movingReg = null; refresh(); return; }
    if (UI.tool === "region") { const id = nid("rg"), R = doc("~regions"); R.add = (R.add || []).concat({ id, kind: "danger", x: r1(wx), y: r1(wy), r: 30, name: "A new region" }); setG("~regions", R); UI.tool = null; UI.selReg = id; UI.sel = null; UI.selLane = null; refresh(); return; }
    if (UI.tool === "remake") { UI.tool = null; UI.remake = { x: r1(wx), y: r1(wy), r: 40, seed: 1000 + Math.floor(Math.random() * 900000) }; UI.sel = null; UI.selReg = null; UI.selLane = null; tools(); side(); request(); return; }
    if (UI.tool === "sector") { const id = nid("sc"), X = doc("~sectors"); X.add = (X.add || []).concat({ id, x: r1(wx), y: r1(wy), name: "The New Sector" }); setG("~sectors", X); UI.tool = null; UI.panel = "sp"; refresh(); return; }
    const best = pickAt(e);
    if (UI.tool === "lane") {
      if (!best) return;
      if (!UI.first) { UI.first = best.id; tools(); over(); return; }
      if (best.id === UI.first) return;
      const L = doc("~lanes"), a = UI.first, b = best.id; L.add = (L.add || []).filter(x => !((x[0] === a && x[1] === b) || (x[0] === b && x[1] === a))).concat([[a, b, "lane"]]); L.cut = (L.cut || []).filter(x => !((x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)));
      setG("~lanes", L); UI.first = null; UI.tool = null; UI.sel = null; UI.selLane = lk(findSys(a).i, findSys(b).i); UI.selReg = null; refresh(); return;
    }
    if (UI.tool === "terr") return;
    // a thing between the stars, nearer than any star: its card
    const th = pickThing(e);
    if (th && (!best || (() => { const r = cvs.getBoundingClientRect(), w = DRAWN.find(d => d[2] === best); return !w || Math.hypot(w[0] - (e.clientX - r.left), w[1] - (e.clientY - r.top)) > 6; })())) { UI.thing = th.id; UI.sel = null; UI.selReg = null; UI.selLane = null; UI.hole = false; side(); request(); return; }
    if (UI.thing) UI.thing = null;
    // a star: with the tools out it is chosen to be changed; otherwise the chart flies into its system (the user's choice)
    if (best) { if (UI.tools) { UI.sel = best.id; UI.selReg = null; UI.selLane = null; UI.sys = null; UI.planet = null; UI.plan = null; UI.hole = false; over(); side(); } else enterSystem(best.id); return; }
    // the black hole at the centre: its own card
    if (MG && MG.bh) { const r = cvs.getBoundingClientRect(), [hx, hy] = scr(0, 0); if (Math.hypot(e.clientX - r.left - hx, e.clientY - r.top - hy) < 16) { UI.hole = true; UI.sel = null; UI.selReg = null; UI.selLane = null; side(); request(); return; } }
    // no star there: the smallest region the click is in, or a lane passing close by
    if (UI.tools) {
      const g = G(), tol = 6 / (CAM.s * FR.k), segD = (p, q) => { const dx = q.x - p.x, dy = q.y - p.y, t = Math.max(0, Math.min(1, ((wx - p.x) * dx + (wy - p.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(wx - p.x - dx * t, wy - p.y - dy * t); };
      const ln = g.lanes.map(([a, b]) => [lk(a, b), segD(sys(a), sys(b))]).filter(x => x[1] < tol).sort((x, y) => x[1] - y[1])[0];
      if (ln) { UI.selLane = ln[0]; UI.sel = null; UI.selReg = null; refresh(); return; }
      const rg = g.regions.filter(r => Math.hypot(r.x - wx, r.y - wy) <= r.r).sort((x, y) => x.r - y.r)[0];
      if (rg) { UI.selReg = rg.id; UI.sel = null; UI.selLane = null; refresh(); return; }
    }
    if (UI.sel || UI.selReg || UI.selLane || UI.hole) { UI.sel = null; UI.selReg = null; UI.selLane = null; UI.hole = false; refresh(); }
  }

  /* ---- the side: the ship, the system chosen, its worlds, a course */
  function shipHTML() {
    const sh = ship(), at = findSys(sh.at), rule = fuelRule(), pct = Math.max(0, Math.min(100, sh.fuel / sh.cap * 100));
    const nearT = sh.near && thingById(sh.near);
    // (the ship walked through: its place, or made one, deck by deck, by the ship maker; the editing plan, stage 5)
    const shipPl = A.order.find(id => ((A.meta[id] || {}).name || "").toLowerCase() === String(sh.name || "").toLowerCase());
    return `<section class="gx-card"><h3>${esc(sh.name)}</h3><div class="gx-f"><span class="kn">At</span> ${nearT ? `<button type="button" class="t-link" data-gx="tpick" data-id="${esc(nearT.id)}">${esc(nearT.name)}</button>, out from ` : ""}<button type="button" class="t-link" data-gx="pick" data-id="${esc(sh.at || "")}">${esc(at ? at.name : sh.at || "nowhere yet")}</button></div>
      ${rule[2] ? `<div class="gx-fuel" title="${Math.round(sh.fuel)} of ${sh.cap}"><i style="width:${pct.toFixed(1)}%"></i></div><div class="gx-f"><span class="kn">Fuel</span> ${Math.round(sh.fuel)} of ${sh.cap}${at && at.f.fuel && sh.fuel < sh.cap ? ` <button type="button" class="t-mini" data-gx="refuel">Refuel here</button>` : ""}</div>` : ""}
      <div class="gx-f"><span class="kn">Reach</span> ${round1(sh.range)} light years a jump · <span class="kn">Speed</span> ${round1(sh.speed)} light years a day</div>
      <div class="gx-f"><span class="kn">Condition</span> <select class="t-in gx-sel" data-gx="cond">${COND.map(c => `<option${c === sh.condition ? " selected" : ""}>${c}</option>`).join("")}</select> <span class="kn">Cargo</span> ${sh.cargo} of ${sh.cargoCap}</div>
      <div class="gx-f"><span class="kn">Sensors</span> <select class="t-in gx-sel" data-gx="sens">${SENS.map(([k, l]) => `<option value="${k}"${k === (sh.sensors || "good") ? " selected" : ""}>${l}</option>`).join("")}</select> <span class="kn">how fast they learn a world by scanning it</span></div>
      ${SP && sh.at ? `<div class="t-row"><button type="button" class="t-mini" data-gx="sweep" title="Anything hidden that a sweep can find, within reach of its sensors">Sweep with the sensors</button><span class="kn">${round1(reachLy() * 1.5)} light years round the ship, an hour</span></div>` : ""}
      ${sh.crew ? `<div class="gx-f"><span class="kn">Crew</span> ${esc(sh.crew)}</div>` : ""}${(sh.equipment || []).length ? `<div class="gx-f"><span class="kn">Equipment</span> ${esc(sh.equipment.join(", "))}</div>` : ""}${(sh.upgrades || []).length ? `<div class="gx-f"><span class="kn">Upgrades</span> ${esc(sh.upgrades.join(", "))}</div>` : ""}
      <div class="gx-f"><span class="kn">Fuel</span> <select class="t-in gx-sel" data-gx="rule">${FUEL.map(([k, l]) => `<option value="${k}"${k === rule[0] ? " selected" : ""}>${l}</option>`).join("")}</select></div>
      ${shipPl ? `<div class="t-row"><button type="button" class="t-go" data-go="${esc(shipPl)}">Its decks</button></div>` : A.locations && A.locations.forPlace ? `<div class="t-row"><button type="button" class="t-mini" data-gx="shipplace">Its decks…</button><span class="kn">the ship made a place: its decks, its rooms and what is aboard</span></div>` : ""}
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
      <div class="t-row">${here ? `<span class="kn">The ship is here.</span>` : `<button type="button" class="t-btn prim" data-gx="plot" data-id="${esc(s.id)}">Plot a course here</button>`}<button type="button" class="t-mini" data-gx="open" data-id="${esc(s.id)}">${UI.sys === s.id ? "Close the system" : "Open the system"}</button><button type="button" class="t-mini" data-gx="edit" data-id="${esc(s.id)}">Change it</button>${A.myLibrary ? `<button type="button" class="t-mini" data-gx="mylibsys" data-id="${esc(s.id)}" title="A copy of it, its star and worlds, to put in any of your campaigns">Keep it in my library</button>` : ""}${A.askChange ? `<button type="button" class="t-mini" data-gx="ask" data-id="${esc(s.id)}" title="Say what should change: its details, a world or a site added; see what it replaces before anything does">Ask for a change…</button>` : ""}</div></section>
      ${UI.plan && UI.plan.to === s.id ? planHTML() : ""}${UI.edit === s.id ? editHTML(s) : ""}${UI.sys === s.id ? systemHTML(s, info, places) : ""}`;
  }
  /* ---- encounters along routes (the editing plan of 10 Nov 2026, section 4, item 2, approved): each region's table of
          what may happen on a jump through it, and one for any jump (the Sectors and powers panel), rolled as the party
          jumps; what comes up is told to the game master, who decides what it is */
  const encLines = t => String(t || "").split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => { const m = /^(\d{1,3})\s*%\s*(.+)$/.exec(l); return m ? [Math.min(100, +m[1]), m[2].trim()] : [20, l]; });
  // (a leg passes through a region where either end lies in it, or where it comes within the region's reach)
  const legThrough = (p, q, r) => { const dx = q.x - p.x, dy = q.y - p.y, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((r.x - p.x) * dx + (r.y - p.y) * dy) / L2)); return Math.hypot(p.x + dx * t - r.x, p.y + dy * t - r.y) <= r.r; };
  function rollEncounters(path, rnd) {
    const g = G(), out = [], rr = rnd || Math.random, any = encLines((edits()["~enc"] || {}).any);
    for (let k = 1; k < path.length; k++) {
      const p = findSys(path[k - 1]), q = findSys(path[k]); if (!p || !q) continue;
      const tables = g.regions.filter(r => r.enc && legThrough(p, q, r)).map(r => [r.name, encLines(r.enc)]).concat(any.length ? [["any jump", any]] : []);
      for (const [where, lines] of tables) for (const [pc, what] of lines) { const roll = Math.floor(rr() * 100) + 1; if (roll <= pc) out.push({ leg: k, from: p.name, to: q.name, where, what, roll, pc }); }
    }
    return out;
  }
  function encHTML() {
    const E = UI.encs; if (!E) return "";
    return `<section class="gx-card gx-encs"><h3>On the way</h3>${E.length ? `<ul class="gx-enc">${E.map(x => `<li><b>${esc(x.what)}</b> <span class="kn">between ${esc(x.from)} and ${esc(x.to)}, in ${esc(x.where)} (rolled ${x.roll} against ${x.pc}%)</span></li>`).join("")}</ul><p class="t-small kn">What it is, and whether it happens, is yours to say.</p>` : `<p class="kn">Nothing came up on the way.</p>`}<div class="t-row"><button type="button" class="t-mini" data-gx="encx">Put it away</button></div></section>`;
  }
  function planHTML() {
    const p = UI.plan; if (!p.path) return `<section class="gx-card gx-plan"><h4>The course</h4><p class="gx-warn">${esc(p.why)}</p></section>`;
    const nj = (p.legs || []).length || p.path.length - 1;
    return `<section class="gx-card gx-plan"><h4>The course${p.thing && thingById(p.thing) ? " to " + esc(thingById(p.thing).name) : ""}</h4><div class="gx-f">${nj} jump${nj > 1 ? "s" : ""} · ${round1(p.ly)} light years · ${round1(p.days)} days${p.fuel ? ` · ${Math.ceil(p.fuel)} fuel` : ""}</div>
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
          apply: v => { const D = doc(s.id), B = D.bodies = D.bodies || {}, n = Math.max(99, ...info.planets.map(x => x.n)) + 1, w = madeWorld(s, info, v.kind, v.a, n, v.name || undefined); B.add = (B.add || []).concat(w); setG(s.id, D); UI.sel = s.id; UI.sys = s.id; UI.planet = n; refresh(); } },
        site: { label: "Add a station, colony, mining installation or other site to it", values: `{"kind": one of ${skinds.join("|")}, "name": "its name", "on": the name of the world it is on, one of ${worlds.map(w => JSON.stringify(w[1])).join("|") || "none"}, or omitted for open space}`,
          read: v => { const kind = AC.one(v.kind, skinds); if (!kind) return null; const on = v.on ? byName(worlds, v.on) : null; return { kind, name: AC.str(v.name, 60) || (SITEK.find(x => x[0] === kind) || [0, "A site"])[1], on: on ? on[0] : null, onName: on ? on[1] : null }; },
          plan: v => ({ change: `Add ${(SITEK.find(x => x[0] === v.kind) || [0, "a site"])[1].toLowerCase()}, ${v.name}, to ${s.name}${v.onName ? ", on " + v.onName : ", in open space"}`, replaces: [], keeps: [`${s.name}'s worlds and other sites as they are`, ...keepsAll] }),
          apply: v => { const D = doc(s.id), B = D.bodies = D.bodies || {}, nk = Math.max(99, ...info.sites.map(x => x.k)) + 1; B.addS = (B.addS || []).concat({ k: nk, kind: v.kind, name: v.name, on: v.on }); setG(s.id, D); UI.sel = s.id; UI.sys = s.id; refresh(); } }
      } };
  }
  // its stars (none, a close pair, a far companion, or three: a close pair with a far third) and where it stands, as
  // numbers: light years from the chart's middle and its height above the plane (the editing plan of 10 Nov 2026)
  function starsOf(s) { const info = bodiesOf(s), c = info.star.companion || (A.starSystem ? A.starSystem.companion(s, info) : null), c2 = info.star.companion2 || null; return { mode: c2 ? "three" : c ? (c.both ? "pair" : "far") : "none", c, c2 }; }
  function starsForm(s) {
    const g = G(), { mode, c, c2 } = starsOf(s), cls = v => Object.keys(Gg.STARS).map(k => `<option value="${k}"${k === v ? " selected" : ""}>${esc(Gg.STAR_NAME[k])}</option>`).join("");
    const r2f = v => Math.round(v * 100) / 100, pos = [r2f((s.x - 500) * g.ly), r2f((s.y - 500) * g.ly), r2f(s.z || 0)], st0 = JSON.stringify([mode, c ? c.cls : "M", c ? +c.a : 40, c ? +(c.ecc != null ? c.ecc : c.e || 0) : .3, c2 ? c2.cls : "M", c2 ? +c2.a : 900]);
    return `<label class="tw-l"><span>Its stars</span><select class="t-in" name="stars">${[["none", "One star"], ["pair", "A close pair: the worlds go round both"], ["far", "A far companion: the worlds keep to the brighter"], ["three", "Three: a close pair and a far third"]].map(([k, l]) => `<option value="${k}"${k === mode ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <div class="gx-comp"><label class="tw-l"><span>The companion</span><select class="t-in" name="c_cls">${cls(c ? c.cls : "M")}</select></label><label class="tw-l"><span>How far apart (AU)</span><input class="t-in" type="number" step="any" min="0.005" name="c_a" value="${c ? +c.a : 40}"></label><label class="tw-l"><span>How stretched its orbit (0 round, 0.9 long)</span><input class="t-in" type="number" step="0.05" min="0" max="0.95" name="c_e" value="${c ? +(c.ecc != null ? c.ecc : c.e || 0) : .3}"></label>
      <label class="tw-l"><span>A third star, far out</span><select class="t-in" name="t_cls">${cls(c2 ? c2.cls : "M")}</select></label><label class="tw-l"><span>Its distance from the pair (AU)</span><input class="t-in" type="number" step="any" min="1" name="t_a" value="${c2 ? +c2.a : 900}"></label></div>
      <p class="t-small kn">Atlas warns of any world whose orbit would not last beside them, and lets it be: it is your setting.</p><input type="hidden" name="stars0" value="${esc(st0)}">
      <div class="gx-pos"><span class="kn">Where it stands, in light years from the chart's middle, and its height above the plane</span><label>East <input class="t-in t-n" type="number" step="any" name="px" value="${pos[0]}"></label><label>South <input class="t-in t-n" type="number" step="any" name="py" value="${pos[1]}"></label><label>Height <input class="t-in t-n" type="number" step="any" name="pz" value="${pos[2]}"></label><input type="hidden" name="pos0" value="${esc(JSON.stringify(pos))}"></div>`;
  }
  function editHTML(s) {
    const e = edits()[s.id] || {}, ov = ((A.galaxyOver || {}).systems || {})[s.id] || {};
    return `<section class="gx-card"><h4>Change ${esc(s.name)}</h4><form data-gx="save" data-id="${esc(s.id)}">
      <label class="tw-l"><span>Name</span><input class="t-in" name="name" maxlength="60" value="${esc(s.name)}"></label>
      <label class="tw-l"><span>Its star</span><select class="t-in" name="cls">${Object.keys(Gg.STARS).map(k => `<option value="${k}"${k === s.cls ? " selected" : ""}>${esc(Gg.STAR_NAME[k])}</option>`).join("")}</select></label>${LIB ? `<div class="t-row"><button type="button" class="t-mini" data-gx="starlib" data-id="${esc(s.id)}" title="A real kind of star with its own mass, age, light and warmth: a pulsar, a supergiant, a black hole with its disc...">Its star from the library…</button>${s.m2 && s.m2.name ? `<span class="kn">now: ${esc(s.m2.name.toLowerCase())}</span>` : ""}</div>` : ""}
      ${starsForm(s)}
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
    // (a system kept whole when the galaxy was grown again: its worlds, belts and stations are all in its bodies)
    if (s.whole) { info.planets = []; info.belts = []; info.sites = []; }
    // (a world the game master worked out again in the planet editor, e.phys: its whole profile from their changes; the
    // world as it was made is kept beside it, p.made, for the editor to start from)
    // (a world of the game master's own worked out again: its changes kept in it, as phys; its names and notes kept)
    info.planets = info.planets.map(p => { const e = (B.p || {})[p.n]; if (!e) return p; if (e.gone) return null; const q = e.phys && p.inputs && Gg.rework ? Object.assign(Gg.rework(g, info, p, e.phys), { made: p }) : p; return Object.assign({}, q, e, { edited: true }); }).filter(Boolean)
      .concat((B.add || []).map(p => { const q = p.phys && p.inputs && Gg.rework ? Object.assign(Gg.rework(g, info, p, p.phys), { made: p }) : p; return Object.assign({ own: true }, q, { n: p.n, name: p.name, owner: p.owner, gm: p.gm, phys: p.phys, hand: p.hand, rough: p.rough, moonNames: p.moonNames, a: p.keepA ? p.a : q.a, keepA: p.keepA }); })).sort((a, b) => a.a - b.a);
    // (moons the game master added to a world, and those taken away)
    for (const p of info.planets) { const E = (p.own && (B.add || []).find(x => x.n === p.n)) || (B.p || {})[p.n]; if (!E || !(E.addM || E.mGone)) continue; const gone = E.mGone || {}; p.moonList = (p.moonList || []).filter(m => !gone[m.n]).concat((E.addM || []).map(m => Object.assign({}, m))); p.moons = Math.max(0, (p.moons || 0) - Object.keys(gone).length + (E.addM || []).length); }
    info.belts = info.belts.map((b, k) => (B.b || {})[k] ? null : Object.assign({ k }, b)).filter(Boolean).concat((B.addB || []).map(b => Object.assign({ own: true }, b)));
    info.sites = info.sites.map((t, k) => { const e = (B.s || {})[k]; return e ? (e.gone ? null : Object.assign({ k }, t, e)) : Object.assign({ k }, t); }).filter(Boolean).concat((B.addS || []).map(t => Object.assign({ own: true }, t)));
    // (each world knows its system, so its globe can be painted from its opened surface: heightOf)
    for (const p of info.planets) { p.sid = s.id; for (const m of p.moonList || []) { m.sid = s.id; m.pn = p.n; } }
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
  /* a world added by hand, made by the planet maker as the generated ones are (the editing plan of 10 Nov 2026, stage 1):
     a body of the kind asked at that distance, tried with a few hundred makings until its star gives one, so it has its
     whole profile, its own colours and the planet editor. If its star would never make that kind there, it is kept as
     the game master's own (the rough figures above, its warnings saying why): their setting, never refused */
  const RECIPE = {
    gas: r => ({ env: "gas", mass: 60 + r() * 900, wf: .1 }), hotjupiter: r => ({ env: "gas", mass: 100 + r() * 700, wf: .1 }), icegiant: r => ({ env: "ice", mass: 10 + r() * 16, wf: .3 }), mini: r => ({ env: "mini", mass: 3 + r() * 7, wf: .05 }),
    dwarf: r => ({ env: "rock", mass: .0005 + r() * .006, wf: .15 + r() * .35 }), ice: r => ({ env: "rock", mass: .01 + r() * 1.5, wf: .05 + r() * .45 }), ocean: r => ({ env: "rock", mass: .3 + r() * 4, wf: .004 + r() * .06 }),
    garden: r => ({ env: "rock", mass: .5 + r() * 1.6, wf: .0001 + r() * .0008 }), desert: r => ({ env: "rock", mass: .1 + r() * 1.6, wf: Math.pow(10, -6.5 + r() * 2) }), barren: r => ({ env: "rock", mass: .005 + r() * .3, wf: .000001 }),
    rocky: r => ({ env: "rock", mass: .05 + r() * 2.5, wf: Math.pow(10, -5 + r() * 2.5) }), toxic: r => ({ env: "rock", mass: .5 + r() * 2.5, wf: .0002, pressure: 30 + r() * 70, gas: "co2" }), lava: r => ({ env: "rock", mass: .3 + r() * 3, wf: .00001, tect: "tidal" })
  };
  // (the planet maker calls a rocky world with no seas a desert or a barren one: those do for "a rocky world")
  const sameKind = (a, b) => a === b || (/^(gas|hotjupiter)$/.test(a) && /^(gas|hotjupiter)$/.test(b)), NEAR = { rocky: ["desert", "barren"] };
  function madeWorld(s, info, kind, a, n, name) {
    const nm = name || `${s.name} ${"bcdefghijklmnop"[Math.min(14, (info.planets.length) % 15)]}`;
    let near = null;
    if (Gg.rework) for (let t = 0; t < 320; t++) {
      const r = Gg.rng(`${(A.galaxyParams || {}).seed}|hand|${s.id}|${n}|${kind || "any"}|${t}`), rc = (RECIPE[kind] || RECIPE[["rocky", "desert", "ocean", "ice", "barren", "gas", "icegiant", "mini"][Math.floor(r() * 8)]])(r);
      const q = Gg.rework(G(), info, { a, mass: rc.mass, env: rc.env, ecc: 0, name: nm }, { a, mass: rc.mass, wf: rc.wf, fe: .2 + r() * .2, tect: rc.tect, pressure: rc.pressure, gas: rc.gas, life: rc.life, seed: t + 1 });
      const fin = () => Object.assign(q, { n, name: nm, hand: true, minerals: q.minerals || ["iron and nickel", "silicates", "water ice", "rare earths"][Math.floor(r() * 4)], chance: q.chance || "Nothing yet found" });
      if (!kind || sameKind(q.kind, kind)) return fin();
      if (!near && (NEAR[kind] || []).includes(q.kind)) near = fin();
    }
    if (near) return near;
    return Object.assign(newWorld(s, kind || "rocky", a, n), { name: nm, rough: true });
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
    if (p.rough) out.push(`Its star would not make ${/^[aeiou]/i.test(p.kname || "") ? "an" : "a"} ${String(p.kname || "world").toLowerCase()} ${p.a} AU out: it is kept as your setting has it, with rough figures until you change them.`);
    if (giant && !/^Impossible/.test(p.land || "")) out.push("A giant has no surface to land on.");
    if (breath && (p.temp > 60 || p.temp < -50)) out.push(`Breathable air at ${p.temp} °C: people could breathe it, but not live in that ${p.temp > 0 ? "heat" : "cold"}.`);
    if (/Seas|ocean|lakes/i.test(p.water || "") && !/molten|acid|under the ice/i.test(p.water || "") && (p.temp < -10 || p.temp > 100)) out.push(`Open water at ${p.temp} °C would ${p.temp < 0 ? "freeze" : "boil away"}.`);
    if (/^none/i.test(p.air || "") && /Seas|ocean|lakes/i.test(p.water || "") && !/molten|under the ice/i.test(p.water || "")) out.push("Open water with no air above it would boil away.");
    if (p.life && /Complex/i.test(p.life) && !p.water) out.push("Complex life with no water.");
    if (p.hab === "Habitable" && !breath) out.push("Called habitable, but the air cannot be breathed.");
    // (a world worked out from its physics has its own mass: its gravity is that mass over its size squared, so a giant
    // two or three times Jupiter's weight is not unusual; the rough rule only for a world without one)
    const dens = giant ? .35 : p.kind === "ice" || p.kind === "dwarf" ? .55 : 1, g0 = p.mass > 0 && p.size > 0 ? p.mass / (p.size * p.size) : p.size * dens;
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
  /* ---- the planet editor (the approved planets plan, 3.3: "randomise, or lock a type"; each change shows its
          consequences before it is kept): the game master changes what the world is made of and where it lies, or sets
          its crust, its air or its life, and the rest is worked out from that by the planetary layer, as it was when the
          world was made (atlas-planet.js rework); what would change is listed, with why, before anything is kept */
  const WATER = [["", "As it was made"], ["0.000001", "Bone dry"], ["0.00003", "A little, deep down"], ["0.00023", "As much as the Earth"], ["0.002", "Ten times the Earth's"], ["0.02", "So much it would cover it"], ["0.3", "Ice and rock, half water"]];
  const IRON = [["", "As its system's"], ["0.15", "Little iron: light for its size"], ["0.3", "As the Earth"], ["0.5", "Iron-rich, dense, as Mercury"]];
  const TECTS = [["", "As its physics gives"], ["plates", "Moving plates"], ["squishy", "A thick, broken lid"], ["stagnant", "One rigid lid"], ["tidal", "Heated by tides"], ["iceshell", "An ice shell over an ocean"], ["frozen", "Frozen through"]];
  const GASES = [["", "Its own mix"], ["co2", "Mostly carbon dioxide"], ["n2", "Mostly nitrogen"], ["ch4", "Mostly methane"]];
  const LIVES = [["", "As its physics gives"], ["none", "None"], ["simple", "Simple life"], ["complex", "Complex life"], ["people", "A people of its own"]];
  const ROCKY = ["rocky", "desert", "ocean", "garden", "ice", "barren", "toxic", "lava", "dwarf"];
  function physOf(f) {
    const v = n => f.elements[n] ? String(f.elements[n].value).trim() : "", n = k => { const x = parseFloat(v(k)); return Number.isFinite(x) ? x : null; }, ch = {};
    if (n("a") != null) ch.a = Math.max(.005, n("a")); if (n("mass") != null) ch.mass = Math.max(.0005, Math.min(50, n("mass")));
    if (v("wf")) ch.wf = +v("wf"); if (v("fe")) ch.fe = +v("fe"); if (v("tect")) ch.tect = v("tect");
    if (n("pressure") != null) ch.pressure = Math.max(0, Math.min(500, n("pressure"))); if (v("gas") && ch.pressure != null) ch.gas = v("gas");
    if (v("life")) ch.life = v("life"); if (v("seed")) ch.seed = +v("seed");
    return ch;
  }
  function physForm(s, p) {
    const m = p.made || p, ph = p.phys || {}, i0 = m.inputs || {}, f = (k, l, v, x) => `<label class="tw-l"><span>${l}</span><input class="t-in" name="${k}" type="number" step="any" value="${esc(v == null ? "" : v)}"${x || ""}></label>`;
    const sel = (k, l, opts, v) => `<label class="tw-l"><span>${l}</span><select class="t-in" name="${k}">${opts.map(([a, b]) => `<option value="${esc(a)}"${String(a) === String(v == null ? "" : v) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></label>`;
    return `<form class="gx-wform gx-phys" data-gx="savephys" data-id="${esc(s.id)}" data-n="${p.n}"><h4>Work out ${esc(p.name)} again</h4>
      <p class="t-small">Change what it is made of or where it lies, or set its crust, its air or its life: the rest follows from its physics. What would change is listed below before you keep it.</p>
      ${f("a", "Orbit (AU from its star)", ph.a != null ? ph.a : i0.a)}${f("mass", "Mass (the Earth is 1)", ph.mass != null ? ph.mass : i0.mass)}${sel("wf", "Water", WATER, ph.wf)}${sel("fe", "Iron", IRON, ph.fe)}
      ${sel("tect", "Its insides", TECTS, ph.tect)}${f("pressure", "Air pressure, bar (empty: as its physics gives)", ph.pressure, ' min="0"')}${sel("gas", "Its air is", GASES, ph.gas)}${sel("life", "Life", LIVES, ph.life)}
      <input type="hidden" name="seed" value="${ph.seed != null ? esc(ph.seed) : ""}">
      <div class="t-row"><button type="button" class="t-mini" data-gx="physrand" data-id="${esc(s.id)}" data-n="${p.n}">Randomise</button>${sel("lock", "keeping it", [["", "any kind"], ...ROCKY.map(k => [k, (Gg.KINDS[k] || k).toLowerCase()])], "")}</div>
      <div class="gx-cons" aria-live="polite"></div>
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="phys" data-n="">Cancel</button>${p.phys ? `<button type="button" class="t-mini" data-gx="unphys" data-id="${esc(s.id)}" data-n="${p.n}">As it was made</button>` : ""}</div></form>`;
  }
  // the preview: the world worked out with the form's changes, against the world as it stands now
  function physPreview(f) {
    const box = f.querySelector(".gx-cons"), s = findSys(f.dataset.id); if (!box || !s) return null;
    const info = bodiesOf(s), p = info.planets.find(x => x.n === +f.dataset.n); if (!p) return null;
    const q = Gg.rework(G(), info, p.made || p, physOf(f)), L = A.planets.consequences(p, q), bad = A.planets.check(q, info.star);
    box.innerHTML = L.length ? `<h5>What would change</h5><ul class="gx-pw">${L.map(c => `<li><b>${esc(c.what)}:</b> ${esc(c.was)} → <b>${esc(c.now)}</b>${c.why ? `<br><span class="t-small kn">${esc(c.why)}</span>` : ""}</li>`).join("")}</ul>${bad.length ? `<p class="t-small">Not quite consistent: ${esc(bad.join("; "))}</p>` : ""}` : `<p class="t-small kn">Nothing would change.</p>`;
    return q;
  }
  // a new world for this orbit or near it, of the kind asked if its star allows one (tried a few hundred times)
  function physRandom(f) {
    const s = findSys(f.dataset.id), info = bodiesOf(s), p = info.planets.find(x => x.n === +f.dataset.n), base = p.made || p, want = f.elements.lock.value, a0 = (base.inputs || {}).a || base.a;
    const R = Gg.rng(Date.now() + "|" + Math.random()), set = (k, v) => { if (f.elements[k]) f.elements[k].value = v; };
    for (let t = 0; t < 400; t++) {
      const ch = { a: +(a0 * (t < 150 ? 1 : .6 + R() * .9)).toPrecision(3), mass: +Math.pow(10, -2.2 + R() * 2.9).toPrecision(2), wf: +WATER[1 + Math.floor(R() * (WATER.length - 1))][0], fe: +IRON[1 + Math.floor(R() * (IRON.length - 1))][0], seed: Math.floor(R() * 1e9) };
      const q = Gg.rework(G(), info, base, ch);
      if (!want || q.kind === want) { set("a", ch.a); set("mass", ch.mass); set("wf", String(ch.wf)); set("fe", String(ch.fe)); set("tect", ""); set("pressure", ""); set("gas", ""); set("life", ""); set("seed", ch.seed); physPreview(f); return true; }
    }
    const box = f.querySelector(".gx-cons"); if (box) box.innerHTML = `<p class="t-small">No ${esc((Gg.KINDS[want] || want).toLowerCase())} came out near this orbit: its star does not make one there. Try another orbit, or set its air or water yourself.</p>`;
    return false;
  }

  /* ---- the approved extras of the planets plan (3 Nov 2026): scanning as play, the weather for tonight, a world's own
          day and year, its history, and a survey sheet to hand the players */
  // scanning: what the players know of a world grows step by step, from afar, from orbit, on the ground; each step takes
  // hours by the ship's sensors. Kept with the system's chart (collection "charts": scans { world: 0..3 })
  const SCAN = ["Nothing yet", "Seen from afar", "Scanned from orbit", "Surveyed on the ground"];
  const SENS = [["basic", "Basic sensors", 2], ["good", "Good sensors", 1], ["military", "Military sensors", .5]];
  const SCAN_H = [0, 1, 8, 48];
  const scanOf = (sid, n) => +((((S() && S().get("charts", sid)) || {}).scans || {})[n] || 0);
  function setScan(sid, n, lv) { const c = Object.assign({}, S().get("charts", sid) || {}); c.scans = Object.assign({}, c.scans || {}, { [n]: Math.max(0, Math.min(3, lv)) }); c.t = Date.now(); S().set("charts", sid, c); }
  const sensors = () => SENS.find(x => x[0] === (ship().sensors || "good")) || SENS[1];
  const hrsSay = h => h >= 48 ? `${Math.round(h / 24)} days` : h >= 1 ? `${Math.round(h)} hour${Math.round(h) === 1 ? "" : "s"}` : `${Math.round(h * 60)} minutes`;
  // a world as the players know it at a level: from afar its size, orbit and moons; from orbit its air, warmth, seas and
  // day; on the ground its life, dangers, minerals and whether one can land
  function seenRows(p, lv) {
    const giant = /gas|ice|mini/.test(p.env || ""), rows = [];
    if (lv >= 1) rows.push(["What it is", giant ? p.kname : p.size > 1.6 ? "A large rocky world" : p.size < .4 ? "A small rocky world" : "A rocky world"], ["Size", `${p.size} times the Earth`], ["Orbit", `${p.a} AU${p.year != null ? `, a year of ${p.year < 1 ? Math.round(p.year * 365.25) + " Earth days" : p.year + " Earth years"}` : ""}`], ["Moons", p.moons ? String(p.moons) : "none seen"]);
    if (lv >= 1 && p.rings) rows.push(["Rings", p.rings.say]);
    if (lv >= 2) rows.push(["Kind", p.kname], ["Gravity", `${p.grav} g`], ["Its day", p.locked ? "none: one side always faces its star" : p.day ? `${Math.round(p.day * 10) / 10} hours` : ""], ["Air", `${p.air}${p.pres != null ? `, ${p.pres} bar` : ""}`], ["Warmth", `${p.temp} °C on average`], ["Liquids", p.water || "none seen"], ["Weather", p.climate]);
    if (lv >= 3) rows.push(["Life", p.life || "none found"], ["Dangers", (p.hazards || []).join(", ") || "none found"], ["Minerals", p.minerals || ""], ["Radiation", p.radiation || ""], ["Landing", p.land], ["For people", p.hab]);
    return rows.filter(r => r[1]);
  }
  // the weather for tonight, from the world's own air and winds: its wind, what that wind does in air so thick or thin,
  // what falls, how cold the night, how far one sees; the same night always the same, the next one another
  function weather(p, night) {
    const r = Gg.rng(`${p.name}|wx|${night}`), W = p.winds || {}, P = p.pressure || 0, T = p.tempC, giant = /gas|ice|mini/.test(p.env || "");
    if (giant) return "No ground to stand on: winds of hundreds of metres a second in the cloud decks.";
    if (P < .001) return `No weather: no air. The night falls at once and hard${p.tempNight != null ? `, to ${p.tempNight - 273} °C` : ""}; the stars stand sharp and do not twinkle. Dust lies where it fell.`;
    const gust = r() < .22, kmh = Math.round((W.typical || 1) * (gust ? 2.2 + r() * 2 : .5 + r() * .9) * 3.6), feel = W.typical ? Math.round(kmh * Math.sqrt((W.push || 0) * 100) / W.typical) : kmh;
    const night0 = p.tempNight != null ? p.tempNight - 273 : Math.round(T - (p.dayNight || 10) / 2), cold = Math.round(night0 + (r() - .5) * 8);
    const falls = p.liquid === "water" ? (cold < 0 ? (r() < .4 ? "snow" : "") : r() < .45 ? (gust && T > 20 ? "a thunderstorm" : "rain") : r() < .3 ? "mist" : "") : p.liquid === "methane" ? (r() < .3 ? "a slow drizzle of methane, drops as big as coins" : "an orange haze") : p.kind === "toxic" ? "an acid haze; sulphuric rain high above that never reaches the ground" : p.liquid === "ice" || p.liquid === "subsurface" ? (r() < .3 ? "frost settling out of the air" : "") : "";
    const dust = /dust/.test(W.storms || "") && gust, see = dust ? "a few hundred metres in the dust" : falls === "mist" || /haze/.test(falls) ? "a few kilometres" : P > 20 ? "short: the thick air bends and dims the light" : "far";
    const does = feel >= 60 ? "dangerous: it can throw a person down and tear at anything not secured" : kmh >= 60 && feel < 30 ? "fast, but the air is thin: it lifts dust and blinds, it does not knock anyone down" : feel >= 30 ? "strong: hard going on foot" : "light";
    return `${p.locked && !p.host ? `A steady wind from the night side, ${gust ? "gusting to" : "about"} ${kmh} km/h` : `Wind ${gust ? "gusting to" : "about"} ${kmh} km/h`}${feel !== kmh ? ` (it pushes like ${feel} km/h on Earth)` : ""}: ${does}. ${falls ? falls[0].toUpperCase() + falls.slice(1) + ". " : ""}${dust ? "A dust front comes through. " : ""}Down to ${cold} °C in the night. Visibility ${see}.`;
  }
  // its own day and year: how long its sun takes to come round again (the solar day, from its turning and its orbit),
  // how many of those in its year, and the date there now if the campaign keeps the world's time
  function calendar(p) {
    if (/gas|ice|mini/.test(p.env || "") || !p.day) return null;
    const yearH = p.year != null ? p.year * 365.25 * 24 : (p.period || 0) * 24;
    if (p.locked && !p.host) return { say: `No days: its star stands still in its sky, high over one side, never rising on the other. Its year is ${Math.round(yearH / 24 * 10) / 10} Earth days.`, sol: 0, yearH };
    const sol = yearH && p.day < yearH ? 1 / (1 / p.day - 1 / yearH) : p.day, per = yearH ? yearH / sol : 0;
    let now = "";
    if (A.worldTime && per) { const hrs = A.worldTime.now() / 60, y = Math.floor(hrs / yearH), d = Math.floor((hrs - y * yearH) / sol), h = (hrs - y * yearH - d * sol) / sol * 24; now = ` By its own reckoning it is now day ${d + 1} of year ${y + 1}, ${Math.floor(h)}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")} in 24 of its hours.`; }
    return { say: `Its sun comes round every ${sol >= 48 ? Math.round(sol / 24 * 10) / 10 + " Earth days" : Math.round(sol * 10) / 10 + " hours"}${p.host ? ` (it faces ${p.host.name || "its planet"} always)` : ""}${per ? `; ${Math.round(per)} of its days make its year` : ""}. People living there would keep ${sol > 30 && sol < 48 ? "its day as theirs, a little longer than Earth's" : sol >= 48 ? "Earth's hours, as its days are too long to live by" : "a day of its own"}.${now}`, sol, yearH };
  }
  // its history, worked out from what it is: when it formed, its seas, its loss of air or water, its locking, its life
  // (rough times; the council and the copilot read it as background)
  function history(p, star) {
    const age = star.age || 4.6, L = [], at = (ago, what) => L.push([Math.max(0, Math.min(age, ago)), what]), W = p.why || {};
    if (/gas|ice|mini/.test(p.env || "")) { at(age, "formed with its star, beyond the frost line, gathering the disc's gas"); return L; }
    at(age, "formed with its star, from the dust and rock of its disc");
    if (/runaway/.test(W.air || "")) at(age * .8, "its oceans boiled away; their hydrogen escaped to space and left carbon dioxide behind");
    if (p.liquid === "water") at(age - .15, "its first seas gathered as it cooled");
    if (p.liquid === "subsurface") at(age - .2, "its surface froze over an ocean that stayed liquid beneath");
    if (/lose|lost|keeps only a thin/.test(W.air || "") && (p.pressure || 0) < .1) at(age * .6, "most of its air was lost to space, stripped by its star's wind and light");
    if (p.locked && !p.host && A.planets.lockYears && p.inputs) { const t = A.planets.lockYears(p.inputs.a, p.mass, p.radius, star.mass || 1) / 1e9; if (t < age) at(age - t, "its star's tides slowed it until one side faced the star for good"); }
    if (p.tectonics === "stagnant" && age > 2) at(age * .4, "its insides cooled; its volcanoes went quiet and its crust set into one rigid shell");
    if (/simple|microb/.test(p.life || "")) at(Math.max(0, age - 1), "life began, in its seas");
    if (/complex|people/.test(p.life || "")) { at(Math.max(0, age - 1), "life began, in its seas"); at(Math.min(age * .4, 1.5), "complex life arose and its plants filled the air with oxygen"); }
    if (/people/.test(p.life || "")) at(.0003, "a people of its own arose");
    return L.sort((a, b) => b[0] - a[0]);
  }
  const agoSay = g => g >= 1 ? `${Math.round(g * 10) / 10} billion years ago` : g >= .001 ? `${Math.round(g * 1000)} million years ago` : `${Math.round(g * 1e6).toLocaleString("en")} years ago`;
  // the survey sheet: what the players know of it, its globe if they have seen it, from their ship, on today's date
  function surveySheet(s, p, lv) {
    const R = seenRows(p, lv), when = A.worldTime ? A.worldTime.at(A.worldTime.now()).short : new Date().toLocaleDateString();
    const svg = lv >= 1 ? (A.pixelPlanet && typeof document !== "undefined" ? `<img src="${A.pixelPlanet.url(p, 48, bodiesOf(s).star.color)}" alt="${esc(p.name)}" class="ho-px">` : `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${globe(p, 50, 50, 44, "sv-" + s.id).replace(/data-gx="[^"]*"/g, "")}</svg>`) : "";
    return { kind: "survey", title: `Survey: ${p.name}`, date: when, svg, rows: R.length ? R : [["What is known", "nothing yet: it has not been scanned"]], from: `${SCAN[lv]}, by ${ship().name || "the ship"}` };
  }
  // the extras in a world's card: what the players know and the next scan, tonight's weather, its day and year, its history
  function extrasHTML(s, p, info) {
    const lv = scanOf(s.id, p.n), next = lv < 3 ? SCAN_H[lv + 1] * sensors()[2] : 0, cal = calendar(p), hist = history(p, info.star), night = (A.worldTime ? Math.floor(A.worldTime.now() / 1440) : 0) + (UI.wxo || 0);
    return `<div class="gx-extra">
      <div class="gx-f"><span class="kn">The players know</span> <select class="t-in gx-sel" data-gx="scan" data-id="${esc(s.id)}" data-n="${p.n}" aria-label="What the players know of ${esc(p.name)}">${SCAN.map((l, k) => `<option value="${k}"${k === lv ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>${lv < 3 ? ` <button type="button" class="t-mini" data-gx="scanup" data-id="${esc(s.id)}" data-n="${p.n}">${lv === 2 ? "Survey it" : "Scan it"}</button> <span class="kn">about ${hrsSay(next)}${lv === 2 ? ", on the ground" : ""}</span>` : ""}</div>
      <div class="t-row"><button type="button" class="t-mini" data-gx="survey" data-id="${esc(s.id)}" data-n="${p.n}">Show them the survey sheet</button></div>
      <details class="gx-how"><summary class="t-small">The weather tonight</summary><p class="t-small">${esc(weather(p, night))}</p><button type="button" class="t-mini" data-gx="wxnext">Another night</button></details>
      ${cal ? `<details class="gx-how"><summary class="t-small">Its day and year</summary><p class="t-small">${esc(cal.say)}</p></details>` : ""}
      <details class="gx-how"><summary class="t-small">Its history</summary><ul class="gx-pw">${hist.map(([g, w]) => `<li><b>${esc(agoSay(g))}</b>: ${esc(w)}</li>`).join("")}</ul><p class="t-small kn">Rough times, worked out from what it is.</p></details></div>`;
  }
  // a moon's name, as astronomers number them: its planet's name and a Roman numeral, outward from the planet
  // (the council's or the game master's own name, when the moon was given one: p.moonNames)
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
  // (a moon the game master added takes the next numeral after the moons the world was made with)
  function moonName(p, m) { if ((p.moonNames || {})[m.n]) return p.moonNames[m.n]; let k = m.n; if (m.own) { const made = (p.moonList || []).filter(x => !x.own).map(x => x.n); k = (made.length ? Math.max(...made) + 1 : 0) + (m.n - 50); } return `${p.name} ${ROMAN[k] || k + 1}`; }
  // a world's whole profile, worked out from its physics (engine/atlas-planet.js; the user's approved plan of 3 Nov 2026):
  // physical, atmosphere, environment, astronomy, each with why it is so, and its colours
  function profileHTML(p, info, sid) {
    if (p.radius == null) return "";
    const R = (k, v) => v == null || v === "" ? "" : `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`, giant = /gas|ice|mini/.test(p.env || "");
    const hrs = h => h == null ? "" : h > 48 ? `${Math.round(h / 24 * 10) / 10} Earth days` : `${Math.round(h * 10) / 10} hours`;
    const S = info.star, W = p.winds || {}, why = p.why || {};
    const g1 = R("Mass", `${p.mass} Earth masses`) + R("Radius", `${p.radius} Earth radii`) + R("Density", `${p.density} g/cm³`) + R("Gravity", `${p.gravity} g${giant ? " (at the cloud tops)" : ""}`) + R("Escape velocity", `${p.vesc} km/s`)
      + R("Day", p.locked ? `locked: ${hrs(p.day)}` : hrs(p.day)) + R("Year", p.year != null ? (p.year < 1 ? `${Math.round(p.year * 365.25 * 10) / 10} Earth days` : `${p.year} Earth years`) : "") + R("Axial tilt", `${p.tilt}°`) + R("Orbit", `${p.a} AU, eccentricity ${p.ecc}`)
      + (giant ? "" : R("Insides", ({ plates: "moving plates", squishy: "a thick, broken lid", stagnant: "one rigid lid", tidal: "tidally heated", iceshell: "an ice shell over an ocean", frozen: "frozen through" })[p.tectonics] || p.tectonics)) + R("Magnetic field", p.field);
    const g2 = R("Composition", p.composition || p.air) + (p.pressure != null ? R("Pressure", `${p.pressure} bar`) : "") + (giant ? "" : R("Breathable", p.breathable ? "yes" : "no")) + (p.greenhouse != null ? R("Greenhouse", `+${p.greenhouse} K`) : "")
      + R("Circulation", W.regime) + (W.typical ? R("Winds", `typically ${W.typical} m/s, up to ${W.extreme} m/s`) : "") + R("Storms", W.storms);
    // (the star chart keeps temp in °C; the profile's own warmth is tempC, and kelvin from it)
    const g3 = R("Average", p.tempC != null ? `${p.tempC} °C (${p.tempC + 273} K)` : "") + (p.tempDay != null ? R("Day side, night side", `${p.tempDay - 273} °C, ${p.tempNight - 273} °C`) : p.dayNight != null ? R("Day to night", `about ${p.dayNight} K`) : "") + (p.equatorPole != null && !p.locked ? R("Equator to pole", `about ${p.equatorPole} K`) : "")
      + R("Seasons", p.seasons) + R("Radiation at the surface", p.radiation) + R("Liquids", p.water) + (p.ice ? R("Ice", `${Math.round(p.ice * 100)}% of it`) : "") + R("Life", p.life ? `${p.life}` : "none known") + R("For people", p.habitable) + R("Landing", p.landing);
    const g4 = R("Its star", `${S.name || S.cls} (${S.cls}), ${S.teff ? S.teff + " K, " : ""}${S.lum} times the Sun's light${S.age ? `, ${S.age} billion years old` : ""}`) + R("Light it gets", `${p.insolation} times what the Earth gets`)
      + R("Moons", p.moons ? `${p.moons}: ${p.moonsWhy || ""}` : p.moonsWhy || "none") + R("Rings", p.rings ? p.rings.say : "");
    // (a large moon with ground to stand on opens as a world of its own, as a planet does)
    const moons = (p.moonList || []).filter(m => !m.small).map(m => `<li><b>${esc(moonName(p, m))}</b>, ${esc((Gg.KINDS[m.kind] || m.kind || "").toLowerCase())} moon, ${m.distance ? m.distance.toLocaleString("en") + " km out" : ""}: ${esc(m.air)}, ${m.tempC} °C${m.water ? ", " + esc(m.water.toLowerCase()) : ""}${m.life ? ", " + esc(m.life) : ""}${m.landable && sid && A.worldGenerate ? ` <button type="button" class="t-mini" data-gx="surface" data-id="${esc(sid)}" data-n="${p.n}" data-m="${m.n}">Open its surface</button>` : ""}</li>`).join("");
    const whys = Object.entries(why).filter(([, v]) => v).map(([k, v]) => `<li><b>${esc({ gravity: "Gravity", spin: "Its turning", tectonics: "Its insides", air: "Its air", temp: "Its warmth", locked: "Locked", liquid: "Its liquids", winds: "Its winds", class: "What kind of world" }[k] || k)}:</b> ${esc(v)}</li>`).join("");
    // (what shaped its surface, worked out from all the rest: the generator makes its surface from this, atlas-planet.js environment)
    const ev = A.planets && A.planets.environment && !giant ? A.planets.environment(p, info.star) : null, surf = ev && ev.why ? Object.entries(ev.why).filter(([k]) => k !== "frame").map(([k, v]) => `<li><b>${esc({ liquid: "Liquids", erosion: "What wears it", impacts: "Craters", volcanism: "Volcanism", climate: "Weather", life: "Life" }[k] || k)}:</b> ${esc(v)}</li>`).join("") : "";
    const pal = p.palette || {}, sw = (c, l) => c ? `<span class="gx-sw"><i style="background:${esc(c)}"></i>${esc(l)}</span>` : "";
    const cols = (pal.bands || []).map((c, i) => sw(c, i ? "" : "its bands")).join("") + sw(pal.ground, "ground") + sw(pal.sea, "seas") + sw(pal.plant, pal.plantSay ? "plants: " + pal.plantSay : "") + sw(pal.sky, "sky") + sw(pal.clouds, "clouds");
    return `<details class="gx-prof"><summary>The whole profile, and why it is so</summary>
      <h5>Physical</h5><table class="gx-pt">${g1}</table><h5>Atmosphere</h5><table class="gx-pt">${g2}</table><h5>Environment</h5><table class="gx-pt">${g3}</table><h5>In its system</h5><table class="gx-pt">${g4}</table>
      ${moons ? `<h5>Its large moons</h5><ul class="gx-pm">${moons}</ul>` : ""}${whys ? `<h5>Why it is so</h5><ul class="gx-pw">${whys}</ul>` : ""}${surf ? `<h5>Its surface, and what made it</h5><ul class="gx-pw">${surf}</ul>` : ""}${cols ? `<h5>Its colours</h5><p class="gx-sws">${cols}</p>` : ""}
      <p class="t-small kn">Worked out from its star, orbit, mass and make-up. Where science is not settled (life elsewhere, the colour of alien plants) it says so.</p></details>`;
  }
  // a world as a small globe in its own colours (atlas-planet.js palette): a giant's bands and rings; a rocky world's
  // ground, seas, ice at its poles and a rim of air if it has one; its night side away from its star
  function globe(p, x, y, r, sid, star) {
    // (as pixel art, the user's wish of 4 Nov 2026, atlas-pixelplanet.js: a still picture here, turning in the world's card)
    if (A.pixelPlanet && typeof document !== "undefined") { const N = r > 5 ? 24 : 16, M = p.rings ? Math.round(N * 2.2) : N + 6, sz = 2 * r * M / N, on = UI.planet === p.n; return `<g class="gx-planet gx-p-${esc(p.kind)}${on ? " on" : ""}" data-gx="planet" data-n="${p.n}"><title>${esc(p.name)}: ${esc(p.kname)}</title><image href="${A.pixelPlanet.url(p, N, star)}" x="${(x - sz / 2).toFixed(1)}" y="${(y - sz / 2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" class="gx-px"/>${on ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 2.5).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1"/>` : ""}</g>`; }
    const P = p.palette || {}, id = `gl-${String(sid).replace(/[^\w-]/g, "")}-${p.n}`, X = x.toFixed(1), Y = y.toFixed(1), R = r.toFixed(1), on = UI.planet === p.n, oc = p.ocean || 0;
    let body = "";
    if (P.bands) { const n = P.bands.length, h = 2 * r / (n * 2); for (let i = 0; i < n * 2; i++) body += `<rect x="${(x - r).toFixed(1)}" y="${(y - r + i * h).toFixed(2)}" width="${(2 * r).toFixed(1)}" height="${(h + .2).toFixed(2)}" fill="${esc(P.bands[i % n])}"/>`; }
    else if (P.clouds && (p.pressure || 0) > 20) body = `<circle cx="${X}" cy="${Y}" r="${R}" fill="${esc(P.clouds)}"/>`;
    else {
      body = `<circle cx="${X}" cy="${Y}" r="${R}" fill="${esc(P.sea && oc > .5 ? P.sea : P.ground || "#8a7a5a")}"/>`;
      if (P.sea && oc > .05 && oc <= .5) body += `<circle cx="${(x - r * .25).toFixed(1)}" cy="${(y + r * .15).toFixed(1)}" r="${(r * .55).toFixed(1)}" fill="${esc(P.sea)}"/>`;
      if (P.sea && oc > .5 && oc < .97) body += `<circle cx="${(x + r * .3).toFixed(1)}" cy="${(y - r * .2).toFixed(1)}" r="${(r * .4).toFixed(1)}" fill="${esc(P.plant || P.ground)}"/>`;
      if ((p.ice || 0) > .05) { const ih = r * Math.min(1, .25 + p.ice); body += `<rect x="${(x - r).toFixed(1)}" y="${(y - r).toFixed(1)}" width="${(2 * r).toFixed(1)}" height="${ih.toFixed(1)}" fill="${esc(P.ice)}"/><rect x="${(x - r).toFixed(1)}" y="${(y + r - ih).toFixed(1)}" width="${(2 * r).toFixed(1)}" height="${ih.toFixed(1)}" fill="${esc(P.ice)}"/>`; }
    }
    const rings = p.rings ? `<ellipse cx="${X}" cy="${Y}" rx="${(r * 2).toFixed(1)}" ry="${(r * .55).toFixed(1)}" fill="none" stroke="${p.rings.icy ? "#e8e2d0" : "#9a8f80"}" stroke-width="${(r * .25).toFixed(1)}" opacity=".8"/>` : "";
    const air = P.sky && (p.pressure || 0) > .05 && !P.bands ? `<circle cx="${X}" cy="${Y}" r="${(r + .8).toFixed(1)}" fill="none" stroke="${esc(P.sky)}" stroke-width=".9" opacity=".7"/>` : "";
    return `<g class="gx-planet gx-p-${esc(p.kind)}${on ? " on" : ""}" data-gx="planet" data-n="${p.n}"><title>${esc(p.name)}: ${esc(p.kname)}</title><clipPath id="${id}"><circle cx="${X}" cy="${Y}" r="${R}"/></clipPath><g clip-path="url(#${id})">${body}<circle cx="${(x + r * .35).toFixed(1)}" cy="${Y}" r="${(r * 1.05).toFixed(1)}" fill="#000" opacity=".35"/></g>${air}${rings}${on ? `<circle cx="${X}" cy="${Y}" r="${(r + 2.5).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1"/>` : ""}</g>`;
  }
  // the system: its star in the middle, each world on its orbit, belts, and what people put there
  // a large moon chosen on the system's map: its own card, and its surface to open
  const MOONW = { lava: "volcanic", rocky: "rocky", desert: "desert", ocean: "ocean", garden: "living", ice: "icy", barren: "barren", toxic: "hothouse", dwarf: "icy" };
  function moonHTML(s, p, m) {
    const nm = moonName(p, m), row = (k, v) => v == null || v === "" ? "" : `<div class="gx-f"><span class="kn">${k}</span> ${esc(v)}</div>`, w = MOONW[m.kind] || "";
    return `<div class="gx-world gx-moon">${A.pixelPlanet ? `<canvas class="gx-pxg" data-id="${esc(s.id)}" data-n="${p.n}" data-m="${m.n}" role="img" aria-label="${esc(nm)}, turning"></canvas>` : ""}<h4>${esc(nm)}: ${/^[aeiou]/.test(w) ? "an" : "a"} ${esc(w)} moon of ${esc(p.name)}</h4>
      ${row("Size", m.radius != null ? m.radius + " times the Earth" : "")}${row("Gravity", m.gravity != null ? m.gravity + " g" : "")}${row("Orbit", m.distance ? `${m.distance.toLocaleString("en")} km from ${p.name}, once round in ${m.period} days` : "")}
      ${row("Warmth", m.tempC != null ? m.tempC + " °C at the surface, on average" : "")}${row("Air", m.air)}${m.pressure != null ? row("Pressure", m.pressure + " bar") : ""}${row("Liquids", m.water)}${row("Life", m.life || "None found")}${row("Landing", m.landing)}${row("For people", m.habitable)}
      ${m.landable && A.worldGenerate ? `<div class="t-row"><button type="button" class="t-btn prim" data-gx="surface" data-id="${esc(s.id)}" data-n="${p.n}" data-m="${m.n}">Open its surface</button></div>` : ""}
      <div class="t-row"><button type="button" class="t-mini" data-gx="moon" data-m="">${esc(p.name)} itself</button></div></div>`;
  }
  function systemHTML(s, info, places) {
    const comp = A.starSystem ? A.starSystem.companion(s, info) : null, mapOpen = !!(A.starSystem && A.starSystem.isOpen());
    const p = UI.planet != null ? info.planets.find(x => x.n === UI.planet) : null, ed = UI.tools, mo = p && UI.moon != null ? (p.moonList || []).find(x => x.n === UI.moon && !x.small) : null;
    const onP = n => info.sites.filter(t => t.on === n), here = places.filter(id => (A.meta[id] || {}).planet == null);
    const row = (k, v) => v ? `<div class="gx-f"><span class="kn">${k}</span> ${esc(v)}</div>` : "";
    // (a station or site: its own place, with its page and its inside, opened; or made, for the game master)
    const sitePlace = t => A.order.find(id => (A.meta[id] || {}).system === s.id && (A.meta[id] || {}).site === t.k);
    const siteRow = (lbl, t) => { const pl = sitePlace(t); return `<div class="gx-f"><span class="kn">${lbl}</span> ${esc(t.name)}${pl ? ` <button type="button" class="t-go" data-go="${esc(pl)}">Open it</button>` : A.locations && A.locations.forPlace && gmMode() ? ` <button type="button" class="t-mini" data-gx="siteplace" data-id="${esc(s.id)}" data-k="${t.k}" title="Make it a place of the campaign: its page, its maps floor by floor, its people and clues; its inside built in the map editor">Its inside…</button>` : ""}${ed ? ` <button type="button" class="t-mini" data-gx="delsite" data-id="${esc(s.id)}" data-k="${t.k}" aria-label="Take away ${esc(t.name)}">×</button>` : ""}</div>`; };
    const wn = p ? warnings(p, s) : [], placeHere = p && places.some(id => (A.meta[id] || {}).planet === p.n), canLand = p && !/^Impossible/.test(p.land || "");
    const kinds = Object.entries(Gg.KINDS).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
    // (a companion the game master set: the worlds whose orbits would not last beside it, said, never taken away)
    const unst = comp && comp.own ? info.planets.filter(p => comp.both ? p.a * (1 - (p.ecc || 0)) <= 3.5 * comp.a : p.a * (1 + (p.ecc || 0)) >= .25 * comp.a * (1 - (comp.ecc || 0))) : [];
    return `<section class="gx-card gx-system"><h4>The ${esc(s.name)} system</h4>${comp ? `<p class="t-small">${esc(A.starSystem.companionSay(comp, s.name))}</p>` : ""}${info.star.companion2 ? `<p class="t-small">A third star, ${esc(info.star.companion2.name)}, goes round the pair ${Math.round(info.star.companion2.a).toLocaleString("en")} AU out.</p>` : ""}${unst.length ? `<p class="gx-warn t-small">Beside its companion these worlds' orbits would not last: ${esc(unst.map(p => p.name).join(", "))}. Allowed: it is your setting.</p>` : ""}
      <div class="gx-f gx-wlist"><span class="kn">Its worlds</span> ${info.planets.map(x => `<button type="button" class="t-link${UI.planet === x.n ? " on" : ""}" data-gx="planet" data-n="${x.n}">${esc(x.name)}</button>`).join(" · ") || "none"}</div>
      <p class="t-small">${info.planets.length ? info.planets.length + " world" + (info.planets.length > 1 ? "s" : "") : "No worlds"}${info.belts.length ? ", " + info.belts.length + " belt" + (info.belts.length > 1 ? "s" : "") : ""}. ${mapOpen ? "Click a world on the map, or its name here, to see it." : `<button type="button" class="t-link" data-gx="open" data-id="${esc(s.id)}">Open its map</button>`}</p>
      ${info.belts.map(b => `<div class="gx-f"><span class="kn">Belt</span> ${esc(b.name)} at ${b.a} AU${b.rich ? ", rich" : ""}${ed ? ` <button type="button" class="t-mini" data-gx="delbelt" data-id="${esc(s.id)}" data-k="${b.k}" aria-label="Take away the belt">×</button>` : ""}</div>`).join("")}
      ${info.sites.filter(t => t.on == null).map(t => siteRow("In orbit", t)).join("")}${here.length ? `<div class="gx-f"><span class="kn">Your places</span> ${here.map(id => `<button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button>`).join(" ")}</div>` : ""}
      ${mo ? moonHTML(s, p, mo) : p ? (ed && UI.pedit === p.n ? worldForm(s, p) : ed && UI.phys === p.n ? physForm(s, p) : UI.look === p.n && gmMode() ? lookForm(s, p) : `<div class="gx-world">${A.pixelPlanet ? `<canvas class="gx-pxg" data-id="${esc(s.id)}" data-n="${p.n}" role="img" aria-label="${esc(p.name)}, turning"></canvas>` : ""}<h4>${esc(p.name)}: ${esc(p.kname || Gg.KINDS[p.kind] || "")}</h4>${row("Size", p.size + " times the Earth")}${row("Gravity", p.grav + " g")}${row("Warmth", p.temp + " °C at the surface, on average")}${row("Air", p.air)}${p.pres != null ? row("Pressure", p.pres + " atmospheres") : ""}${row("Climate", p.climate)}${row("Surface", p.geo)}${row("Liquids", p.water)}${row("Life", p.life || "None found")}${row("Minerals", p.minerals)}${row("Dangers", (p.hazards || []).join(", "))}${row("Landing", p.land)}${row("For people", p.hab)}${row("Moons", p.moons ? String(p.moons) : "")}${row("To be found", p.chance)}${profileHTML(p, info, s.id)}
        ${p.owner ? row("Held by", (G().powers.find(x => x.id === p.owner) || {}).name || ((A.factionsData || {})[p.owner] || {}).n || p.owner) : ""}${p.gm ? `<p class="gx-gm"><span class="kn">Only you</span> ${esc(p.gm)}</p>` : ""}
        ${onP(p.n).map(t => siteRow("Here", t)).join("")}${places.filter(id => (A.meta[id] || {}).planet === p.n).map(id => `<div class="gx-f"><span class="kn">Your place</span> <button type="button" class="t-go" data-go="${esc(id)}">${esc(A.meta[id].name || id)}</button></div>`).join("")}
        ${wn.length ? `<ul class="gx-risks gx-wn">${wn.map(w => `<li>${esc(w)}</li>`).join("")}</ul><p class="t-small">Allowed: it is your setting. Atlas only says what would not hang together.</p>` : ""}
        ${extrasHTML(s, p, info)}
        ${p.landable && A.worldGenerate ? `<div class="t-row"><button type="button" class="t-btn prim" data-gx="surface" data-id="${esc(s.id)}" data-n="${p.n}">Open its surface</button></div><p class="t-small kn">The whole globe, made from this world's own physics the first time (a few minutes), then kept.</p>` : ""}
        ${canLand && !placeHere ? `<details class="gx-how"><summary class="t-small">Its surface as a map to explore</summary><p class="t-small">Ask Claude: “make the surface of ${esc(p.name)} as a place”, or: <code>node atlas.js wild &lt;campaign&gt; ${esc(String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"))} --system ${esc(s.id)} --planet ${p.n}</code></p></details>` : ""}
        ${p.override ? `<p class="gx-warn t-small">${esc(p.override)}.</p>` : ""}
        ${gmMode() ? `<div class="t-row"><button type="button" class="t-mini" data-gx="look" data-n="${p.n}" title="Its picture's colours, clouds, ice, bands, rings, turn and size on the map: never its physics">Its look</button>${A.myLibrary ? `<button type="button" class="t-mini" data-gx="mylibworld" data-id="${esc(s.id)}" data-n="${p.n}" title="A copy of this world, to put at an orbit in any of your campaigns">Keep it in my library</button>` : ""}${ed ? `<button type="button" class="t-mini" data-gx="pedit" data-n="${p.n}">Change this world</button>${(p.made || p).inputs && Gg.rework ? `<button type="button" class="t-mini" data-gx="phys" data-n="${p.n}">Work it out again</button>` : ""}` : ""}</div>` : ""}</div>`) : ""}
      ${ed ? `<details class="gx-add"><summary>Add to the system</summary>
        <form class="t-row" data-gx="addworld" data-id="${esc(s.id)}"><select class="t-in" name="kind" aria-label="What kind of world">${kinds}</select><label class="kn">at <input class="t-in t-n" type="number" name="a" min="0.01" step="any" value="${Math.round((Math.max(0, ...info.planets.map(x => x.a)) * 1.6 || 1) * 100) / 100}"> AU</label><button class="t-mini">+ A world</button>${LIB ? `<button type="button" class="t-mini" data-gx="libadd" data-id="${esc(s.id)}">+ From the library…</button>` : ""}</form>
        <form class="t-row" data-gx="addsite" data-id="${esc(s.id)}"><select class="t-in" name="kind" aria-label="What">${SITEK.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select><input class="t-in" name="name" placeholder="Its name" maxlength="60"><select class="t-in" name="on" aria-label="Where"><option value="">In orbit</option>${info.planets.map(x => `<option value="${x.n}">On ${esc(x.name)}</option>`).join("")}</select><button class="t-mini">+ Add it</button></form>
        <form class="t-row" data-gx="addbelt" data-id="${esc(s.id)}"><input class="t-in" name="name" placeholder="An asteroid belt" maxlength="60"><label class="kn">at <input class="t-in t-n" type="number" name="a" min="0.01" step="any" value="2.5"> AU</label><button class="t-mini">+ A belt</button></form></details>` : ""}</section>`;
  }
  // a region, a lane, the sectors and powers: what the game master changes of them
  /* ---- growing and keeping (the editing plan of 10 Nov 2026, stage 6): the galaxy or a region grown again, the game
          master's work kept; a small map grown into a galaxy round it; a region opened on its own */
  // why a system is the game master's to keep: what they made or changed, what the story or the table holds there
  function keptWhy(q, E0) {
    const why = [], e = E0[q.id], ov = ((A.galaxyOver || {}).systems || {})[q.id], st = S(), ch = st && st.get("charts", q.id), sh = st && st.get("ship", "now"), g = G();
    if (q.lock) why.push("locked");
    if (q.added) why.push(q.kept ? "kept before" : "added by you"); else if (e && Object.keys(e).some(k => k !== "t")) why.push("changed by you");
    if (ov && (ov.name || ov.desc || ov.gm)) why.push("named in the story");
    if (A.order.some(id => (A.meta[id] || {}).system === q.id)) why.push("with your places");
    if ((sh && sh.at === q.id) || (!sh && g.systems[g.home] === q) || (A.galaxyOver || {}).home === q.id) why.push("the ship's");
    if (ch && ch.state && ch.state !== "unknown") why.push("on the players' charts");
    if (q.mark) why.push("marked");
    if (Object.values(A.factionsData || {}).some(fa => (fa.systems || []).includes(q.id))) why.push("held by the story's factions");
    return why;
  }
  // a system as it stands, its star and worlds written out under its own id, so that it stands the same in a galaxy
  // grown again (its worlds keep their numbers, its places and surfaces their ties)
  function snapshot(q) {
    const info = bodiesOf(q), st = info.star, comp = st.companion || (A.starSystem ? A.starSystem.companion(q, info) : null), d = doc(q.id);
    const bodies = { add: info.planets.map(p => Object.assign(strip(p), { hand: true })), addB: info.belts.map((b, i) => ({ k: b.k != null ? b.k : i, a: b.a, name: b.name, rich: b.rich, icy: b.icy })), addS: info.sites.map(t => ({ k: t.k, kind: t.kind, name: t.name, on: t.on, a: t.a, ph: t.ph })) };
    const star0 = { cls: st.cls, color: st.color, lum: st.lum, mass: st.mass, teff: st.teff, age: st.age, flares: st.flares, metal: st.metal };
    delete d.gone;
    return Object.assign(d, { added: true, kept: true, whole: true, i0: q.i0 != null ? q.i0 : q.i, name: q.name, cls: q.cls, bin: !!comp, x: q.x, y: q.y, f: Object.assign({}, q.f), desc: q.desc || "", gm: q.gm || "", noGen: true, star0, bodies, t: Date.now() }, q.z != null ? { z: q.z } : {}, q.m2 ? { m2: q.m2 } : {}, q.special ? { special: q.special } : {}, q.mark ? { mark: true } : {}, q.lock ? { lock: true } : {},
      comp ? { comp: { cls: comp.cls, mass: comp.mass, a: comp.a, e: comp.ecc != null ? comp.ecc : comp.e, both: !!comp.both }, compNat: true } : {}, st.companion2 ? { comp2: { cls: st.companion2.cls, mass: st.companion2.mass, a: st.companion2.a, e: st.companion2.ecc } } : {});
  }
  const smallMap = () => { const p = G().p || {}; return ["system", "cluster", "blank"].includes(p.kind) || p.layout === "schematic"; };
  const GROWN = new Map();
  const grownWith = P => { const k = JSON.stringify(P); if (!GROWN.has(k)) { GROWN.clear(); GROWN.set(k, Gg.grow(P)); } return GROWN.get(k); };
  function regrowParams(seed, extra) { const E0 = allEdits(), n = ((E0["~grow"] || {}).n || 0) + 1; return Object.assign({}, gp(E0), extra || {}, { seed, idPre: "R" + n + "-" }); }
  // what would change, before anything does
  function regrowPlan(seed, extra, all) {
    const E0 = allEdits(), live = allSys(), keep = all ? live : live.filter(q => keptWhy(q, E0).length), P = regrowParams(seed, extra), ng = grownWith(P);
    const near = ng.systems.filter(q => keep.some(t => Math.hypot(t.x - q.x, t.y - q.y) < 1.6)).length, counts = {};
    for (const q of keep) for (const w of (all ? ["yours"] : keptWhy(q, E0))) counts[w] = (counts[w] || 0) + 1;
    return { keep, P, n0: live.length, nNew: ng.systems.length - near, counts };
  }
  function regrowHTML() {
    const R = regrowPlan(UI.regrow.seed), why = Object.entries(R.counts).map(([w, n]) => `${n} ${esc(w)}`).join(", ");
    return `<section class="gx-card gx-regrow"><h3>Grow it again, keeping your work</h3>
      <p class="kn">The galaxy grown again from another seed. What you made, changed, named or locked stays as it is, and so does what the story and the table hold (your places, the ship, the players' charts); the rest is grown again round it.</p>
      <div class="gx-f"><span class="kn">Kept as they are</span> ${R.keep.length} of ${R.n0} systems${why ? ": " + why : ""} (a system kept for more than one reason is counted under each)</div>
      <div class="gx-f"><span class="kn">Grown again</span> ${R.n0 - R.keep.length} systems go and ${R.nNew} new ones are grown; what the players knew of those that go goes with them. The sectors and powers are grown again too; the story's factions keep the systems you keep.</div>
      <div class="gx-f"><span class="kn">Its seed</span> <input class="t-in t-n" type="number" data-gx="rgseed" value="${UI.regrow.seed}" aria-label="The seed it is grown from"> <button type="button" class="t-mini" data-gx="regrowseed">Another seed</button></div>
      <div class="t-row"><button type="button" class="t-btn prim" data-gx="regrowgo">Grow it again</button><button type="button" class="t-btn" data-gx="regrowx">Not now</button></div>
      <p class="t-small kn">Undo brings the galaxy back as it was.</p></section>`;
  }
  // (the lanes, trade routes and corridors between the systems kept, kept with them: lengths the game master gave stay;
  // routes asked to become real distances lose theirs)
  function keptLanes(keepIds, own) {
    const g = G(), L = doc("~lanes"), K = new Set(keepIds), have = new Set((L.add || []).map(x => [x[0], x[1]].sort().join("|")));
    for (const [a, b] of g.lanes) { const p = g.systems[a], q = g.systems[b]; if (!K.has(p.id) || !K.has(q.id)) continue; const key = [p.id, q.id].sort().join("|"); if (have.has(key)) continue; have.add(key); const k = lk(a, b), ly0 = own ? own(a, b) : g.laneLy.get(k); L.add = (L.add || []).concat([[p.id, q.id, g.laneKind.get(k) || "lane"].concat(ly0 > 0 ? [Math.round(ly0 * 100) / 100] : [])]); }
    return L;
  }
  function regrowGo(seed, extra, all, what, pos, own) {
    const R = regrowPlan(seed, extra, all), E0 = allEdits(), n = ((E0["~grow"] || {}).n || 0) + 1, p = Object.assign({}, (E0["~grow"] || {}).p || {}, extra || {}, { seed: R.P.seed, idPre: R.P.idPre });
    const list = R.keep.map(q => { const d = snapshot(q); if (pos && pos[q.id]) [d.x, d.y] = pos[q.id]; return { id: q.id, data: d }; });
    list.push({ id: "~lanes", data: keptLanes(R.keep.map(q => q.id), own) });
    list.push({ id: "~grow", data: { p, n, t: Date.now() } });
    if (E0["~remake"]) list.push({ id: "~remake", data: null });
    setGMany(list); UI.regrow = null; UI.grow = null; UI.sel = null; refresh(); fitChart();
    if (A.tableUI) A.tableUI.api.note(what || `Grown again: ${R.keep.length} systems kept as they were, ${R.nNew} grown new round them. Undo brings it all back.`);
  }
  function remakeHTML() {
    const c = UI.remake, E0 = allEdits(), g = G(), inC = q => Math.hypot(q.x - c.x, q.y - c.y) <= c.r, inside = allSys().filter(inC), keep = inside.filter(q => keptWhy(q, E0).length);
    return `<section class="gx-card gx-remake"><h3>Remake a region</h3>
      <p class="kn">The stars inside the circle grown again from a seed of their own; what you made, changed, named or locked there stays, and so does what the story and the table hold.</p>
      <label class="tw-l"><span>How far it reaches (light years)</span><input class="t-in" type="range" data-gx="rmr" min="5" max="200" step="1" value="${c.r}" aria-label="How far the region reaches"> <span class="kn">${Math.round(c.r * g.ly)} ly</span></label>
      <div class="gx-f"><span class="kn">Inside it</span> ${inside.length} systems: ${keep.length} kept as they are, ${inside.length - keep.length} grown again</div>
      <div class="t-row"><button type="button" class="t-btn prim" data-gx="remakego"${inside.length - keep.length ? "" : " disabled"}>Remake it</button><button type="button" class="t-mini" data-gx="remakeseed">Another seed</button><button type="button" class="t-btn" data-gx="remakex">Not now</button></div>
      <p class="t-small kn">Undo brings the region back as it was.</p></section>`;
  }
  function remakeGo() {
    const c = UI.remake, E0 = allEdits(), RM = JSON.parse(JSON.stringify(E0["~remake"] || { list: [] })), k = (RM.list.reduce((m, x) => Math.max(m, x.k || 0), 0)) + 1;
    const keep = allSys().filter(q => Math.hypot(q.x - c.x, q.y - c.y) <= c.r && keptWhy(q, E0).length).map(q => q.id);
    RM.list.push({ k, x: c.x, y: c.y, r: c.r, seed: c.seed, keep });
    setGMany([{ id: "~remake", data: RM }]); UI.remake = null; refresh();
    const now = allSys().filter(q => Math.hypot(q.x - c.x, q.y - c.y) <= c.r).length;
    if (A.tableUI) A.tableUI.api.note(`The region remade: ${keep.length} kept, ${now - keep.length} grown new. Undo brings it back.`);
  }
  // a small map (one system, a cluster, an empty canvas, a jump map) grown into a galaxy round it
  function growHTML() {
    const sch = (G().p || {}).layout === "schematic", R = regrowPlan(UI.grow.seed, growExtra(), true);
    return `<section class="gx-card gx-growround"><h3>Grow the space round it</h3>
      <p class="kn">A galaxy grown round your ${R.keep.length === 1 ? "system" : R.keep.length + " systems"}, from the real galaxy's own mix of stars. Yours stay as they are, with their worlds, places and lanes; the new stars stand round them.</p>
      <label class="tw-l"><span>How much of it</span><select class="t-in" data-gx="grscope">${[["neighbourhood", "The neighbourhood: some hundreds of stars"], ["sector", "A sector"], ["arm", "An arm of the galaxy"]].map(([k, l]) => `<option value="${k}"${k === UI.grow.scope ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      ${sch ? `<p class="kn">A jump map is a diagram, so first it is set into real space: each system placed at about the distances your routes give (a best fit).</p><label class="tw-l"><span>Your routes</span><select class="t-in" data-gx="grroutes"><option value="keep"${UI.grow.routes !== "real" ? " selected" : ""}>Keep their own lengths and days</option><option value="real"${UI.grow.routes === "real" ? " selected" : ""}>Become the real distances between the stars</option></select></label>` : ""}
      <div class="gx-f"><span class="kn">Grown</span> about ${R.nNew} new systems round yours</div>
      <div class="t-row"><button type="button" class="t-btn prim" data-gx="growgo">Grow it</button><button type="button" class="t-mini" data-gx="growseed">Another seed</button><button type="button" class="t-btn" data-gx="growx">Not now</button></div>
      <p class="t-small kn">Undo brings back your map as it was.</p></section>`;
  }
  const growExtra = () => ({ kind: "galaxy", layout: "spatial", scope: (UI.grow && UI.grow.scope) || "neighbourhood", model: 2, systems: null, span: null });
  // (a jump map set into real space: each system moved until its routes are about as long as they say, a best fit)
  function fitSchematic(newLy) {
    const g = G(), live = allSys(); if (live.length < 2) return {};
    const P = new Map(live.map(q => [q.i, [q.x, q.y]])), want = [];
    for (const [a, b] of g.lanes) { if (!P.has(a) || !P.has(b)) continue; const L = g.laneLy.get(lk(a, b)); want.push([a, b, (L > 0 ? L : Gg.dist(g, a, b)) / newLy]); }
    // (from a ring of the right size, so the fit has room to settle)
    { const n = live.length, avg = want.reduce((m, w) => m + w[2], 0) / Math.max(1, want.length) || 5; live.forEach((q, k) => { const a = k / n * Math.PI * 2; P.set(q.i, [Math.cos(a) * avg * n / 6, Math.sin(a) * avg * n / 6]); }); }
    for (let it = 0; it < 400; it++) { const step = .5 * (1 - it / 400); for (const [a, b, d] of want) { const pa = P.get(a), pb = P.get(b), dx = pb[0] - pa[0], dy = pb[1] - pa[1], dd = Math.hypot(dx, dy) || .01, k = (dd - d) / dd * step * .5; pa[0] += dx * k; pa[1] += dy * k; pb[0] -= dx * k; pb[1] -= dy * k; } }
    // (centred where the chart's middle is)
    let mx = 0, my = 0; for (const [, p] of P) { mx += p[0]; my += p[1]; } mx /= P.size; my /= P.size;
    const out = {}; for (const q of live) { const p = P.get(q.i); out[q.id] = [Math.round((p[0] - mx + 500) * 10) / 10, Math.round((p[1] - my + 500) * 10) / 10]; } return out;
  }
  function growGo() {
    const g = G(), sch = (g.p || {}).layout === "schematic", newLy = grownWith(regrowParams(UI.grow.seed, growExtra())).ly || g.ly;
    // (a jump map fitted to its routes' lengths at the new chart's scale; a small map of real distances scaled into it)
    const pos = sch ? fitSchematic(newLy) : Object.fromEntries(allSys().map(q => [q.id, [Math.round((500 + (q.x - 500) * g.ly / newLy) * 100) / 100, Math.round((500 + (q.y - 500) * g.ly / newLy) * 100) / 100]]));
    const own = sch && UI.grow.routes !== "real" ? (a, b) => { const L = g.laneLy.get(lk(a, b)); return L > 0 ? L : Gg.dist(g, a, b); } : sch ? () => 0 : null;
    regrowGo(UI.grow.seed, growExtra(), true, sch ? "Your jump map set into real space, and a galaxy grown round it. Undo brings back your map as it was." : "A galaxy grown round your systems, which stand as they were. Undo brings back your map as it was.", pos, own);
  }
  function regHTML(r) {
    const g = G(), n = allSys().filter(s => Math.hypot(s.x - r.x, s.y - r.y) <= r.r).length, X = edits()["~regions"] || {};
    const what = { danger: "Courses through it are warned of, and kept clear of it where another way is near.", restricted: "Courses through it are warned of: someone forbids it.", explored: "The systems in it are on the players' charts from the start.", unexplored: "Courses into it are warned of: no charts reach it." }[r.kind] || "";
    return `<section class="gx-card"><h3>${esc(r.name)}</h3><form data-gx="savereg" data-id="${esc(r.id)}">
      <label class="tw-l"><span>Name</span><input class="t-in" name="name" maxlength="60" value="${esc(r.name)}"></label>
      <label class="tw-l"><span>What it is</span><select class="t-in" name="kind">${REGK.map(([k, l]) => `<option value="${k}"${k === r.kind ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="tw-l"><span>How far it reaches from its middle (light years)</span><input class="t-in" type="number" name="r" min="0.5" step="any" value="${Math.round(r.r * g.ly * 10) / 10}"></label>
      <label class="tw-l"><span>What may happen on a jump through it, one to a line: its chance, then what (30% Pirates out of the dust)</span><textarea class="t-in" name="enc" rows="3" maxlength="2000" placeholder="30% Pirates out of the dust&#10;10% A distress call, faint">${esc(r.enc || "")}</textarea></label>
      <p class="t-small">${n} system${n === 1 ? "" : "s"} in it. ${what}</p>
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-gx="movereg" data-id="${esc(r.id)}">Move it</button><button type="button" class="t-mini" data-gx="regonly" data-id="${esc(r.id)}" title="Only this region's systems and things, closer">Open it on its own</button>${!r.own && (X.edit || {})[r.id] ? `<button type="button" class="t-mini" data-gx="unreg" data-id="${esc(r.id)}">As it was</button>` : ""}<span class="t-sp"></span><button type="button" class="t-mini t-danger" data-gx="delreg" data-id="${esc(r.id)}">Take it away</button></div></form></section>`;
  }
  function laneHTML(key) {
    const g = G(), [a, b] = key.split("-").map(Number), p = sys(a), q = sys(b); if (!p || !q) return "";
    const kind = g.laneKind.get(key) || (g.laneLy.has(key) ? "corridor" : "lane"), d = ly(p, q);
    return `<section class="gx-card"><h3>${esc(p.name)} to ${esc(q.name)}</h3><form data-gx="savelane" data-a="${esc(p.id)}" data-b="${esc(q.id)}">
      <label class="tw-l"><span>What it is</span><select class="t-in" name="kind">${LANEK.map(([k, l]) => `<option value="${k}"${k === kind ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="tw-l"><span>${schematic() ? "Its length in light years: on a jump map, what its fuel and days follow" : `Its length in light years (a corridor only; the stars stand ${Math.round(d * 10) / 10} apart)`}</span><input class="t-in" type="number" name="ly" min="0.1" step="any" value="${g.laneLy.has(key) ? g.laneLy.get(key) : ""}" placeholder="${Math.round(d * 10) / 10}"></label>
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
      <h4>On any jump</h4><form data-gx="saveenc"><label class="tw-l"><span>What may happen on any jump, one to a line: its chance, then what. Each region has its own table besides, in its card.</span><textarea class="t-in" name="any" rows="3" maxlength="2000" placeholder="5% A drive fault">${esc((edits()["~enc"] || {}).any || "")}</textarea></label><div class="t-row"><button class="t-mini">Keep it</button></div></form>
      <div class="t-row"><button type="button" class="t-mini" data-gx="panel" data-p="">Close</button></div></section>`;
  }
  /* ---- the galaxy's own card, when nothing is chosen; and its black hole's (the galaxy plan, sections 2 and 3) */
  const nice = v => v >= 1e9 ? (Math.round(v / 1e8) / 10) + " billion" : v >= 1e6 ? (Math.round(v / 1e5) / 10) + " million" : Math.round(v).toLocaleString("en");
  function galaxyHTML() {
    if (!MG) galaxyModel(); if (!MG) return `<section class="gx-card"><p class="t-small">Click a star to open its system.</p></section>`;
    const w = GMOD.whereIs(MG, FR.x, FR.y, FR.z), R = Math.hypot(FR.x, FR.y), Rk = R / GMOD.KPC, per = Rk > .3 ? GMOD.period(MG, Rk) : 0, v = Rk > .3 ? GMOD.vcirc(MG, Rk) : 0;
    return `<section class="gx-card gx-gal"><h3>${esc(MG.name)}</h3><p class="t-small">${esc(MG.label)}, some ${nice(MG.Rmax * 2)} light years across.${MG.arms.length ? " Its arms: " + esc(MG.arms.map(a => a.name.replace(/^The /, "")).join(", ")) + (MG.spur ? ", and " + esc(MG.spur.name.replace(/^The /, "the ")) : "") + "." : ""}</p>
      <div class="gx-f"><span class="kn">Our space</span> ${esc((A.galaxyParams || {}).name || "The campaign's stars")}, in ${esc(w.name)}, ${nice(R)} light years from the centre</div>
      ${per ? `<div class="gx-f"><span class="kn">How it turns</span> ${Math.round(v)} km a second here: once round the centre in about ${Math.round(per)} million years. Stars further in go round sooner. In a lifetime, nothing you could see moves.</div>` : ""}
      ${MG.bh ? `<div class="t-row"><button type="button" class="t-btn" data-gx="gohole">Its heart: ${esc(MG.bh.name)}</button></div>` : ""}
      <p class="t-small kn">Click a star to open its system; drag to move; scroll to come closer. The galaxy and its faint stars are its picture; the bright points over them are the campaign's own systems.</p></section>`;
  }
  function holeHTML() {
    const B = MG && GMOD.blackHole(MG); if (!B) return "";
    const li = L => `<ul class="t-ul">${L.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    // the closest known star's orbit round it, to scale: a long, thin ellipse with the black hole at one end
    const a = 120, e = B.S2.e, b = a * Math.sqrt(1 - e * e), c = a * e;
    const orbit = `<svg viewBox="-150 -40 300 80" class="gx-s2" role="img" aria-label="The orbit of the closest known star round it"><ellipse cx="${(-c).toFixed(1)}" cy="0" rx="${a}" ry="${b.toFixed(1)}" fill="none" stroke="#9fb0c9" stroke-dasharray="3 3"/><circle cx="0" cy="0" r="3.2" fill="#000" stroke="#ffd9a8"/><circle cx="${(-c - a).toFixed(1)}" cy="0" r="2.4" fill="#cad7ff"/><text x="0" y="-10" text-anchor="middle" font-size="9" fill="#b9c6dc">${esc(B.name)}</text><text x="${(-c - a + 6).toFixed(1)}" y="16" font-size="9" fill="#b9c6dc">a star: once round in ${B.S2.years} years</text></svg>`;
    return `<section class="gx-card gx-hole"><h3>${esc(B.name)}</h3><p class="t-small">The black hole at the galaxy's centre.</p>
      <div class="gx-f"><span class="kn">Mass</span> ${nice(B.mass)} Suns</div>
      <div class="gx-f"><span class="kn">Where</span> The very centre of the galaxy, ${nice(Math.hypot(FR.x, FR.y))} light years from our space</div>
      <div class="gx-f"><span class="kn">Its edge</span> The point of no return is ${nice(B.horizon_km * 2)} km across, some ${Math.round(B.horizonSuns)} times the Sun</div>
      <div class="gx-f"><span class="kn">What it is doing</span> ${esc(B.state)}</div>
      <h5>Round it</h5>${li(B.around)}${orbit}
      <h5>The dangers</h5>${li(B.dangers)}
      <p class="t-small kn">The stars of the galaxy do not go round it: they go round the weight of the whole galaxy, its stars, gas and dark matter together. Its own pull rules only its few light years.</p>
      <div class="t-row"><button type="button" class="t-mini" data-gx="holex">Close</button></div></section>`;
  }
  function side() {
    if (!host) return; const sd = host.querySelector(".gx-side"), s = UI.sel && findSys(UI.sel);
    const g = G(), rg = UI.selReg && g.regions.find(r => r.id === UI.selReg);
    // (with a system's own map open, its cards first and the ship's after)
    const inSys = s && UI.sys === s.id && A.starSystem && A.starSystem.isOpen();
    const th = !inSys && UI.thing && thingById(UI.thing);
    sd.innerHTML = encHTML() + (UI.regrow ? regrowHTML() : "") + (UI.remake ? remakeHTML() : "") + (UI.grow ? growHTML() : "") + (UI.only ? `<section class="gx-card gx-only"><h3>${esc(UI.only.name)}, on its own</h3><p class="kn">Only its systems and what lies between them, closer; the rest faint. It is the same chart: what you add or change here is in the galaxy.</p><div class="t-row"><button type="button" class="t-btn" data-gx="regall">← The whole chart</button></div></section>` : "") + (UI.panel === "sp" ? spHTML() : "") + (UI.hole ? holeHTML() : "") + (inSys ? sysHTML(s) + shipHTML() : (th ? thingHTML(th) + (UI.plan && UI.plan.thing === th.id ? planHTML() : "") + shipHTML() : shipHTML() + (s ? sysHTML(s) : rg ? regHTML(rg) : UI.selLane ? laneHTML(UI.selLane) : galaxyHTML())));
    { const pf = sd.querySelector("form.gx-phys"); if (pf) physPreview(pf); const lf = sd.querySelector("form.gx-look"); if (lf) lookPreview(lf); }
    // (the world in its card, turning, as pixel art: atlas-pixelplanet.js)
    if (A.pixelPlanet) sd.querySelectorAll("canvas.gx-pxg").forEach(cv => { const s2 = findSys(cv.dataset.id), info = s2 && bodiesOf(s2), p = info && info.planets.find(x => x.n === +cv.dataset.n); if (!p) return; const m = cv.dataset.m != null && cv.dataset.m !== "" ? (p.moonList || []).find(x => x.n === +cv.dataset.m) : null; A.pixelPlanet.spin(cv, m ? Object.assign({}, m, { name: moonName(p, m) }) : p, 48, info.star.color); });
  }
  function refresh() { A._galaxy = null; if (host) { base(); over(); side(); tools(); if (A.starSystem && A.starSystem.isOpen()) A.starSystem.refresh(); setTimeout(() => checkThings(), 0); } }

  /* ---- what the game master does */
  const nowWhen = () => A.worldTime ? A.worldTime.at(A.worldTime.now()).short : new Date().toLocaleDateString();
  function setShip(patch, what) { const s = Object.assign({}, (S().get("ship", "now")) || {}, patch); if (what) s.log = (s.log || []).concat({ when: nowWhen(), what }).slice(-60); S().set("ship", "now", s); }
  function onClick(e) {
    const b = e.target.closest("[data-gx]"); if (!b || ["INPUT", "SELECT", "FORM", "TEXTAREA"].includes(b.tagName)) return;
    const k = b.dataset.gx, id = b.dataset.id;
    // (with the side view open, the chart's own places close it; with the system's map open, + and − come closer on it
    // and the chart's own places close it first)
    if (SV && k !== "sideview" && ["galaxy", "fit", "ship", "pick", "part", "gosec", "goreg", "goarm", "gohole", "zin", "zout"].includes(k)) sideClose();
    if (TL && !/^(timelapse|tlplay|tlback)$/.test(k) && ["galaxy", "fit", "ship", "pick", "part", "gosec", "goreg", "goarm", "gohole", "zin", "zout", "sideview"].includes(k)) tlClose();
    if (A.starSystem && A.starSystem.isOpen()) { if (k === "zin" || k === "zout") { A.starSystem.zoom(k === "zin" ? 1.6 : .62); return; } if (["galaxy", "fit", "ship", "pick", "part", "gosec", "goreg", "goarm", "gohole"].includes(k)) leaveSystem(false); }
    switch (k) {
      case "zin": zoomAt(1.6); return;
      case "zout": zoomAt(.62); return;
      case "fit": fitChart(); return;
      case "galaxy": fitGalaxy(); return;
      // (the part of the galaxy in view: some ten thousand light years of it; a sector, a region, an arm, the heart)
      case "part": flyTo(CAM.x, CAM.y, Wpx() / 9000); return;
      case "gosec": { const c = G().sectors.find(x => x.id === id); if (c) { const p = gxOf(c); flyTo(p.x, p.y, sChart() * 2.4); } host.querySelector(".gx-found").hidden = true; return; }
      case "goreg": { const c = G().regions.find(x => x.id === id); if (c) { const p = gxOf(c); flyTo(p.x, p.y, Math.min(sMax(), Wpx() * .35 / Math.max(.5, c.r * FR.k))); UI.selReg = id; UI.sel = null; side(); } host.querySelector(".gx-found").hidden = true; return; }
      case "goarm": { const a = MG && MG.arms.find(x => x.k === +b.dataset.k); if (a) { const T = MG.T, Rk = T.arms.r0 * 1.9, u = Math.log(Rk / T.arms.r0) / Math.tan(T.arms.pitch * Math.PI / 180), th = a.th0 + u; flyTo(Math.cos(th) * Rk * GMOD.KPC, Math.sin(th) * Rk * GMOD.KPC, Wpx() / 26000); } host.querySelector(".gx-found").hidden = true; return; }
      case "gohole": flyTo(0, 0, Wpx() / 3000); UI.hole = true; UI.sel = null; side(); host.querySelector(".gx-found").hidden = true; return;
      case "holex": UI.hole = false; side(); return;
      case "sideview": if (TL) tlClose(); sideOpen(); return;
      // (things between the stars)
      // (the library, and a world's look)
      case "look": UI.look = b.dataset.n === "" || b.dataset.n == null || UI.look === +b.dataset.n ? null : +b.dataset.n; if (UI.look != null) UI.planet = UI.look; UI.pedit = null; UI.phys = null; break;
      case "unlook": { const n = +b.dataset.n, D = doc(id), B = D.bodies = D.bodies || {}, own = (B.add || []).find(x => x.n === n); if (own) delete own.look; else if (B.p && B.p[n]) { delete B.p[n].look; if (!Object.keys(B.p[n]).length) delete B.p[n]; } setG(id, D); UI.look = null; refresh(); return; }
      case "looklib": { const f = b.closest("form"); libDlg("look", w => { const L = w.look || {}, set = (k, v) => { const el = f.elements[k]; if (el && v != null) { if (el.type === "checkbox") el.checked = !!v; else el.value = v; el.dataset.on = "1"; } }; for (const k of ["hue", "sat", "bright", "clouds", "ice", "ocean", "craters", "bandsN", "ground", "sea", "plant", "cloudCol", "sky"]) set(k, L[k]); if (L.bands) L.bands.slice(0, 3).forEach((c, i) => set("band" + i, c)); if (L.storm != null) set("storm", L.storm); if (L.rings) { set("r_on", L.rings.on); set("r_w", L.rings.width || 1); set("r_tilt", L.rings.tilt != null ? L.rings.tilt : 18); set("r_tint", L.rings.tint || "#e2dccc"); } lookPreview(f); }, { say: "Only its look is taken: its colours, clouds, ice, bands and rings. Its physics stay its own." }); return; }
      case "libadd": { const s = findSys(id), f = b.closest("form"), a = Math.max(.01, parseFloat(f && f.elements.a ? f.elements.a.value : "1") || 1); if (!s) return; libDlg("world", w => sysAddPreset(s, a, w, { clientX: b.getBoundingClientRect().left, clientY: b.getBoundingClientRect().bottom, target: b, preventDefault() {} }), { info: bodiesOf(s), a, say: `Each worked out ${a} AU from ${s.name}, as the planet maker would make it there; “fits here” means it stays of its kind.` }); return; }
      case "starlib": { libDlg("star", sp => setStarPreset(id, sp), { say: "Each a real kind of star: its mass, age, metals, light and warmth. The system's worlds are made again round it; your own stay." }); return; }
      case "tpick": { const t = thingById(id); if (t) A.galaxyThing(id); const fl = host.querySelector(".gx-found"); if (fl) fl.hidden = true; return; }
      case "treveal": setThing(id, { found: true, ready: false, foundHow: (thingById(id) || {}).readyHow || "shown by the game master", foundAt: nowMin(), foundT: Date.now() }); refresh(); return;
      case "thide": setThing(id, { found: false, ready: false }); refresh(); return;
      case "tplot": { const t = thingById(id); if (!t) return; UI.thing = id; UI.plan = Object.assign({}, courseToThing(ship().at, t)); side(); request(); return; }
      case "tplace": { const t = thingById(id); if (t) thingPlace(t); return; }
      case "tmove": UI.tools = true; UI.movingThing = id; tools(); if (A.tableUI) A.tableUI.api.note("Click the map where it should be."); return;
      case "tdel": if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Take it away? Click again"; return; } setThing(id, null); UI.thing = null; refresh(); return;
      case "tfill": { const t = thingById(id), f = b.closest("form"); if (t && f) fillThing(t, f, b); return; }
      case "sweep": { const out = checkThings({ swept: true }); if (!out.length && A.tableUI) A.tableUI.api.note(`The sensors sweep ${round1(reachLy() * 1.5)} light years round the ship: nothing new.`); if (A.worldTime) A.worldTime.advance(60); return; }
      case "shipplace": { const sh = ship(); if (A.locations && A.locations.forPlace) A.locations.forPlace({ name: sh.name, kind: "ship", label: sh.name, done: () => side() }); return; }
      case "siteplace": { const s = findSys(id), info = s && bodiesOf(s), t = info && info.sites.find(x => x.k === +b.dataset.k); if (!t || !A.locations || !A.locations.forPlace) return; const on = t.on != null ? info.planets.find(p => p.n === t.on) : null; A.locations.forPlace({ system: s.id, planet: t.on != null ? t.on : undefined, site: t.k, name: t.name, kind: t.kind, label: t.name, done: () => { A._galaxy = null; if (A.starSystem && A.starSystem.isOpen()) A.starSystem.refresh(); } }); void on; return; }
      case "timelapse": tlOpen(); return;
      case "tlplay": if (TL) { TL.play = !TL.play; TL.last = 0; b.textContent = TL.play ? "Pause" : "Play"; b.setAttribute("aria-pressed", TL.play); } return;
      case "tlback": if (TL) TL.t = 0; return;
      case "ship": { const s = findSys(ship().at); if (s) { UI.sel = s.id; centreOn(s, 3); over(); side(); } return; }
      case "mylibsys": { const q = findSys(id); if (!q) return; const d = snapshot(q); for (const k of ["kept", "i0", "lock", "mark", "x", "y", "t", "gone"]) delete d[k]; const info = bodiesOf(q); keepMine("system", q.name, `${info.star.name} · ${info.planets.length} world${info.planets.length === 1 ? "" : "s"}`, d); return; }
      case "mylibworld": { const q = findSys(id), info = q && bodiesOf(q), p = info && info.planets.find(x => x.n === +b.dataset.n); if (!p) return; const d = strip(p); delete d.preset; keepMine("world", p.name, `${p.kname || p.kind}${p.tempC != null ? ", " + p.tempC + " °C" : ""}`, d); return; }
      case "myliblook": { const q = findSys(id), info = q && bodiesOf(q), p = info && info.planets.find(x => x.n === +b.dataset.n), fm = b.closest("form"); if (!p || !fm) return; const L = lookOfForm(fm, p); const ref = strip(p); delete ref.look; keepMine("look", `${p.name}'s look`, `a look for ${String(p.kname || p.kind).toLowerCase()}`, { look: L, ref }); return; }
      case "encx": UI.encs = null; side(); return;
      case "regrow": UI.regrow = UI.regrow ? null : { seed: 1000 + Math.floor(Math.random() * 900000) }; UI.remake = null; UI.grow = null; side(); tools(); return;
      case "regrowseed": if (UI.regrow) { UI.regrow.seed = 1000 + Math.floor(Math.random() * 900000); side(); } return;
      case "regrowgo": if (UI.regrow) regrowGo(UI.regrow.seed); return;
      case "regrowx": UI.regrow = null; side(); tools(); return;
      case "remakego": if (UI.remake) remakeGo(); return;
      case "remakeseed": if (UI.remake) { UI.remake.seed = 1000 + Math.floor(Math.random() * 900000); side(); } return;
      case "remakex": UI.remake = null; side(); request(); return;
      case "growround": UI.grow = UI.grow ? null : { seed: 1000 + Math.floor(Math.random() * 900000), scope: "neighbourhood", routes: "keep" }; UI.regrow = null; UI.remake = null; side(); tools(); return;
      case "growseed": if (UI.grow) { UI.grow.seed = 1000 + Math.floor(Math.random() * 900000); side(); } return;
      case "growgo": if (UI.grow) growGo(); return;
      case "growx": UI.grow = null; side(); tools(); return;
      case "regonly": { const r = G().regions.find(x => x.id === b.dataset.id); if (!r) return; UI.only = { id: r.id, x: r.x, y: r.y, r: r.r, name: r.name }; UI.selReg = null; const p = gxOf(r); flyTo(p.x, p.y, Math.min(Wpx(), Hpx()) * .42 / Math.max(.01, r.r * FR.k)); side(); request(); return; }
      case "regall": UI.only = null; side(); fitChart(); return;
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
      case "pedit": UI.pedit = b.dataset.n === "" ? null : +b.dataset.n; UI.phys = null; break;
      case "phys": UI.phys = b.dataset.n === "" ? null : +b.dataset.n; UI.pedit = null; break;
      case "scanup": { const sid = b.dataset.id, n = +b.dataset.n, lv = scanOf(sid, n); if (lv >= 3) return; const h = SCAN_H[lv + 1] * sensors()[2]; setScan(sid, n, lv + 1); if (A.worldTime) A.worldTime.advance(Math.round(h * 60)); if (A.tableUI) A.tableUI.api.note(`${SCAN[lv + 1]}: ${hrsSay(h)}${A.worldTime ? " passed" : ""}.`); break; }
      case "survey": { const s = findSys(b.dataset.id), info = s && bodiesOf(s), p = info && info.planets.find(x => x.n === +b.dataset.n); if (!p || !A.tableUI) return; A.tableUI.api.show({ kind: "handout", id: "survey-" + s.id + "-" + p.n, h: surveySheet(s, p, scanOf(s.id, p.n)) }); return; }
      case "wxnext": UI.wxo = (UI.wxo || 0) + 1; break;
      case "physrand": { const f = b.closest("form"); if (f) physRandom(f); return; }
      case "unphys": { const id = b.dataset.id, n = +b.dataset.n, D = doc(id), e = D.bodies && D.bodies.p && D.bodies.p[n], own = D.bodies && (D.bodies.add || []).find(x => x.n === n); if (own && own.phys) { delete own.phys; setG(id, D); } else if (e) { delete e.phys; setG(id, D); } UI.phys = null; break; }
      case "ask": { const s = findSys(id); if (s && A.askChange) A.askChange(askSys(s)); return; }
      case "delworld": case "unworld": case "delsite": case "delbelt": {
        const n = +(b.dataset.n != null ? b.dataset.n : b.dataset.k), D = doc(id), B = D.bodies = D.bodies || {};
        if (k === "delworld") { if ((B.add || []).some(p => p.n === n)) B.add = B.add.filter(p => p.n !== n); else { B.p = B.p || {}; B.p[n] = { gone: true }; } UI.planet = null; UI.pedit = null; }
        else if (k === "unworld") { if (B.p) delete B.p[n]; UI.pedit = null; }
        else if (k === "delsite") { if ((B.addS || []).some(t => t.k === n)) B.addS = B.addS.filter(t => t.k !== n); else { B.s = B.s || {}; B.s[n] = { gone: true }; } }
        else { if ((B.addB || []).some(t => t.k === n)) B.addB = B.addB.filter(t => t.k !== n); else { B.b = B.b || {}; B.b[n] = 1; } }
        setG(id, D); refresh(); return;
      }
      case "pick": { const s = findSys(id); if (s) { UI.sel = id; UI.hole = false; centreOn(s, 2.5); over(); side(); } const fl = host.querySelector(".gx-found"); if (fl) fl.hidden = true; return; }
      case "plot": { const c = course(ship().at, id); UI.plan = Object.assign({ to: id }, c); over(); side(); return; }
      case "jump": {
        const p = UI.plan; if (!p || !p.ok || !p.path) return;
        if (p.risks.length && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Sure? " + p.risks.length + " danger" + (p.risks.length > 1 ? "s" : "") + " on the way: click again"; return; }
        // (a course to a thing between the stars: the ship there, beside the system it jumped from)
        const dest = findSys(p.to), tg = p.thing && thingById(p.thing);
        // (what may happen on the way: each region's table and the table for any jump, rolled for each leg)
        const hasEnc = G().regions.some(r => r.enc) || (edits()["~enc"] || {}).any, encs = hasEnc ? rollEncounters(p.path) : null;
        setShip({ at: p.to, near: tg ? tg.id : null, fuel: Math.max(0, p.left) }, `To ${tg ? tg.name : dest.name}: ${round1(p.ly)} ly in ${round1(p.days)} days${p.fuel ? ", " + Math.ceil(p.fuel) + " fuel" : ""}${encs && encs.length ? "; on the way: " + encs.map(x => x.what).join("; ") : ""}`);
        if (encs) { UI.encs = encs; if (A.tableUI && encs.length) A.tableUI.api.note(`On the way: ${encs.map(x => x.what).join("; ")}.`); }
        if (tg) { if (A.worldTime && p.days > 0) A.worldTime.advance(Math.round(p.days * 1440)); if (A.tableUI) A.tableUI.api.note(`The ship arrives at ${tg.name}.`); UI.plan = null; checkThings(); break; }
        for (const sid of p.path.slice(1)) S().set("charts", sid, Object.assign({}, S().get("charts", sid) || {}, { state: "visited", how: (S().get("charts", sid) || {}).how || "explored", t: Date.now() }));
        if (A.worldTime && p.days > 0) A.worldTime.advance(Math.round(p.days * 1440));
        if (A.tableUI) A.tableUI.api.note(`The ship arrives at ${dest.name}.`);
        setTimeout(() => checkThings(), 50);
        UI.plan = null; break;
      }
      case "refuel": { const sh = ship(); setShip({ fuel: sh.cap }, `Refuelled at ${(findSys(sh.at) || {}).name || sh.at}`); break; }
      case "open": if (UI.sys === id && A.starSystem && A.starSystem.isOpen()) { leaveSystem(true); return; } if (A.starSystem) { enterSystem(id); return; } UI.sys = UI.sys === id ? null : id; UI.planet = null; break;
      // (a world's surface: made the first time, then opened in the world map)
      case "surface": { const sid = b.dataset.id, n = b.dataset.n, mo = b.dataset.m; b.disabled = true; const say = t => { b.textContent = t; };
        // (how far it has got, by the time it usually takes: the worker says nothing until it is done)
        const s0 = findSys(sid), i0 = s0 && bodiesOf(s0), p0 = i0 && i0.planets.find(x => x.n === +n), nm = p0 ? (mo != null && mo !== "" ? "a moon of " + p0.name : p0.name) : "the world";
        const w = A.ux ? A.ux.work({ what: "the surface of " + nm, uses: ["its physics"] }) : null, est = (A.worldGenSecs ? A.worldGenSecs("planet") : 180) * 1000, t0 = Date.now(), iv = w ? setInterval(() => w.progress(Math.min(.95, (Date.now() - t0) / est)), 1000) : null;
        const here = () => ((document.getElementById("app") || {}).dataset || {}).view === "galaxy";
        planetSurface(sid, n, say, mo).then(wid => { clearInterval(iv); b.disabled = false; b.textContent = "Open its surface"; const stay = here(); if (w) w.end(true, "its surface is ready", () => { if (A.openWorld) A.openWorld(wid); }); if (stay && A.openWorld) A.openWorld(wid); }).catch(e => { clearInterval(iv); if (w) w.end(false); b.disabled = false; b.textContent = "Open its surface"; const m = host && host.querySelector(".gx-note"); if (m) m.textContent = e.message; else alert(e.message); }); return; }
      case "planet": UI.planet = +b.dataset.n; UI.moon = null; UI.pedit = null; UI.look = null; if (A.starSystem) A.starSystem.redraw(); break;
      case "moon": UI.moon = b.dataset.m === "" || b.dataset.m == null ? null : +b.dataset.m; if (A.starSystem) A.starSystem.redraw(); break;
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
    if (k === "rgseed" && UI.regrow) { UI.regrow.seed = Math.max(1, parseInt(t.value, 10) || 1); side(); return; }
    if (k === "grscope" && UI.grow) { UI.grow.scope = t.value; side(); return; }
    if (k === "grroutes" && UI.grow) { UI.grow.routes = t.value; return; }
    if (k === "secname" || k === "pwname") { const key = k === "secname" ? "~sectors" : "~powers", X = doc(key), id = t.dataset.id, v = t.value.trim(); if (!v) return; const own = (X.add || []).find(a => a.id === id); if (own) own.name = v; else { X.edit = X.edit || {}; X.edit[id] = Object.assign(X.edit[id] || {}, { name: v }); } setG(key, X); t.blur(); refresh(); return; }
    if (k === "chart" || k === "how") { const c = Object.assign({}, S().get("charts", t.dataset.id) || {}, k === "chart" ? { state: t.value } : { how: t.value }, { t: Date.now() }); S().set("charts", t.dataset.id, c); refresh(); }
    else if (k === "cond") setShip({ condition: t.value }, `Now ${t.value.toLowerCase()}`);
    else if (k === "sens") setShip({ sensors: t.value }, `Sensors: ${t.value}`);
    else if (k === "scan") { setScan(t.dataset.id, +t.dataset.n, +t.value); refresh(); }
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
      const D = Object.assign(doc(id), { name: v("name") || s.name, cls: v("cls"), f: fl, desc: v("desc"), gm: v("gm"), t: Date.now() });
      // (its stars, only if the game master changed them; where it stands, only if moved: a rounded figure written back
      // would shift it)
      const st1 = JSON.stringify([v("stars"), v("c_cls"), +num("c_a", 40), +num("c_e", .3), v("t_cls"), +num("t_a", 900)]);
      if (st1 !== v("stars0")) {
        const m = v("stars"), cp = { cls: v("c_cls"), mass: (Gg.STARS[v("c_cls")] || Gg.STARS.M)[2], a: Math.max(.005, num("c_a", 40)), e: Math.max(0, Math.min(.95, num("c_e", .3))), both: m === "pair" || m === "three" };
        D.bin = m !== "none"; D.comp = m === "none" ? null : cp; delete D.compNat; D.comp2 = m === "three" ? { cls: v("t_cls"), mass: (Gg.STARS[v("t_cls")] || Gg.STARS.M)[2], a: Math.max(1, num("t_a", 900)), e: 0 } : null;
      }
      const p0 = JSON.parse(v("pos0") || "[0,0,0]"), p1 = [num("px", p0[0]), num("py", p0[1]), num("pz", p0[2])], g0 = G();
      if (p1[0] !== p0[0] || p1[1] !== p0[1]) { D.x = Math.round((500 + p1[0] / g0.ly) * 1000) / 1000; D.y = Math.round((500 + p1[1] / g0.ly) * 1000) / 1000; }
      if (p1[2] !== p0[2]) D.z = p1[2];
      setG(id, D);
      // (who holds it: the territories' own document)
      const was = s.pw != null && G().powers[s.pw] ? G().powers[s.pw].id : "", now = v("owner");
      if (now !== was) setG("~terr", Object.assign(doc("~terr"), { [id]: now }));
      UI.edit = null;
    } else if (k === "saveenc") { setG("~enc", { any: (f.elements.any.value || "").trim().slice(0, 2000), t: Date.now() }); if (A.tableUI) A.tableUI.api.note("Kept: rolled on every jump.");
    } else if (k === "savereg") {
      const R = doc("~regions"), body = { name: v("name") || "A region", kind: v("kind"), r: Math.max(.5, num("r", 3)) / G().ly, enc: (f.elements.enc ? f.elements.enc.value : "").trim().slice(0, 2000) }, own = (R.add || []).find(a => a.id === id);
      if (own) Object.assign(own, body); else { R.edit = R.edit || {}; R.edit[id] = Object.assign(R.edit[id] || {}, body); }
      setG("~regions", R);
    } else if (k === "savelook") {
      // (a world's look kept: its picture only, beside its physics)
      const n = +f.dataset.n, L = lookOfForm(f), D = doc(id), B = D.bodies = D.bodies || {}, own = (B.add || []).find(x => x.n === n);
      if (own) { if (Object.keys(L).length) own.look = L; else delete own.look; } else { B.p = B.p || {}; B.p[n] = Object.assign(B.p[n] || {}, { look: L }); if (!Object.keys(L).length) delete B.p[n].look; }
      setG(id, D); UI.look = null;
    } else if (k === "savething") {
      // (a thing's card kept: what it is, its signal, its drift from where it is now, how it is found)
      const t = thingById(id); if (!t) return; const ck = n => !!(f.elements[n] && f.elements[n].checked), area = SP.isArea(v("kind"));
      const patch = { name: v("name") || t.name, kind: v("kind") || t.kind, desc: v("desc"), gm: v("gm"), hidden: ck("hidden"), conds: SP.CONDS.map(c => c[0]).filter(k2 => ck("c_" + k2)), reveal: v("reveal") || "tell", clue: v("clue") || "", event: v("event") || "", t: Date.now() };
      if (area) { patch.r = Math.max(.05, num("r", t.r || 1)); patch.blinds = ck("blinds"); }
      else {
        Object.assign(patch, { condition: v("condition"), attitude: v("attitude") || "unknown", owner: v("owner") || "", crew: v("crew"), cargo: v("cargo"), signal: { on: ck("sig_on"), message: v("sig_msg"), range: Math.max(0, num("sig_r", 2)), source: v("sig_src") } });
        const sp0 = Math.max(0, num("dr_s", 0)), dir = num("dr_d", 0), was = t.drift || {};
        if (sp0 !== (+was.speed || 0) || dir !== (+was.dir || 0)) { const here = thingAt(t); patch.x = Math.round(here.x * 100) / 100; patch.y = Math.round(here.y * 100) / 100; patch.drift = sp0 > 0 ? { speed: sp0, dir, t0: nowMin(), perLy: G().ly } : null; }
      }
      if (!patch.hidden) { patch.found = true; patch.ready = false; } else if (!t.hidden) { patch.found = false; patch.ready = false; }
      setThing(id, patch); setTimeout(() => checkThings(), 30);
    } else if (k === "savelane") {
      const L = doc("~lanes"), a = f.dataset.a, c = f.dataset.b, same = x => (x[0] === a && x[1] === c) || (x[0] === c && x[1] === a), kind = v("kind"), lyv = kind === "corridor" || schematic() ? num("ly", 0) : 0;
      L.add = (L.add || []).filter(x => !same(x)).concat([[a, c, kind, lyv > 0 ? lyv : (kind === "corridor" ? Math.round(ly(findSys(a), findSys(c)) * 5) / 10 : 0)]]); L.cut = (L.cut || []).filter(x => !same(x));
      setG("~lanes", L);
    } else if (k === "saveworld") {
      const s = findSys(id), n = +f.dataset.n, D = doc(id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), p0 = info.planets.find(x => x.n === n) || {};
      const p = { name: v("name") || p0.name, kind: v("kind"), kname: Gg.KINDS[v("kind")], a: Math.max(.01, num("a", p0.a)), size: Math.max(.01, num("size", p0.size)), grav: Math.max(0, num("grav", p0.grav)), temp: Math.round(num("temp", p0.temp)), air: v("air"), pres: v("pres") === "" ? null : Math.max(0, num("pres", 0)), climate: v("climate"), geo: v("geo"), water: v("water"), life: v("life"), minerals: v("minerals"), hazards: v("hazards").split(",").map(x => x.trim()).filter(Boolean), land: v("land"), hab: v("hab"), moons: Math.max(0, Math.round(num("moons", 0))), owner: v("owner") || null, gm: v("gm") };
      const own = (B.add || []).find(x => x.n === n);
      if (own) Object.assign(own, p); else { B.p = B.p || {}; B.p[n] = p; }
      setG(id, D); UI.pedit = null;
    } else if (k === "savephys") {
      // (the world worked out again: its changes kept, and only the names and notes the game master gave it beside them;
      // its other fields come from its physics now)
      const n = +f.dataset.n, D = doc(id), B = D.bodies = D.bodies || {}, own = (B.add || []).find(x => x.n === n);
      if (own) { own.phys = physOf(f); own.t = Date.now(); }
      else { const e = (B.p = B.p || {})[n] || {}, keep = {}; for (const q of ["name", "owner", "gm", "moonNames", "minerals", "chance"]) if (e[q] != null) keep[q] = e[q]; B.p[n] = Object.assign(keep, { phys: physOf(f), t: Date.now() }); }
      setG(id, D); UI.phys = null;
    } else if (k === "addworld") {
      const s = findSys(id), D = doc(id), B = D.bodies = D.bodies || {}, info = bodiesOf(s), n = Math.max(99, ...info.planets.map(x => x.n)) + 1, w = madeWorld(s, info, v("kind"), Math.max(.01, num("a", 1)), n);
      B.add = (B.add || []).concat(w); setG(id, D); UI.planet = n; UI.pedit = w.rough ? n : null;
      if (w.rough && A.tableUI) A.tableUI.api.note(`Its star would not make ${/^[aeiou]/i.test(Gg.KINDS[v("kind")] || "") ? "an" : "a"} ${(Gg.KINDS[v("kind")] || "world").toLowerCase()} there: it is kept as your setting has it. Its card says what does not hang together.`);
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
    // (the worlds they have scanned, with only what they learned of each: seenRows)
    const scannedWorlds = list => { const out = []; for (const s of list) { if (chartOf(s.id) === "rumoured" || !(((S().get("charts", s.id) || {}).scans))) continue; for (const p of bodiesOf(s).planets) { const lv = scanOf(s.id, p.n); if (lv > 0) out.push({ sys: s.name, name: p.name, level: SCAN[lv], rows: seenRows(p, lv) }); } } return out; };
    // (each visited system's own map for the players' screen, and each charted one they have scanned in, where the
    // worlds stand today: the worlds they have scanned in their pictures, as far as they scanned them; the rest outlines)
    const sysmaps = {};
    if (A.starSystem) for (const s of L) {
      const cs = chartOf(s.id), scans = ((S().get("charts", s.id) || {}).scans) || {}; if (cs !== "visited" && !(cs === "charted" && Object.keys(scans).length)) continue;
      const info = bodiesOf(s), P = A.starSystem.positions(s, info);
      sysmaps[s.id] = { name: s.name, color: info.star.color, at: A.worldTime ? A.worldTime.at(A.worldTime.now()).short : "", belts: info.belts.map(b => b.a), worlds: info.planets.map(p => { const lv = scanOf(s.id, p.n), q = P.find(x => x.n === p.n) || { x: p.a, y: 0, e: 0 }, sz = p.radius || p.size || 1, w = { a: p.a, x: q.x, y: q.y, e: q.e, lv, r: sz > 6 ? 3 : sz > 1.6 ? 2 : 1 }; if (lv >= 1) { w.name = p.name; w.img = A.pixelPlanet ? A.pixelPlanet.url(p, 16, info.star.color) : ""; } if (lv >= 2) w.kind = p.kname; return w; }) };
    }
    // (the things between the stars they have found, or that were never hidden: never the rest, nor anyone's secrets)
    const things = SP ? allThings().map(t => SP.forPlayers(t, nowMin())).filter(Boolean) : [];
    return { name: (A.galaxyParams || {}).name || "", systems: L.map(s => ({ id: s.id, name: chartOf(s.id) === "rumoured" ? s.name + "?" : s.name, x: s.x, y: s.y, color: (Gg.STARS[s.cls] || Gg.STARS.G)[0], state: chartOf(s.id) })), lanes, regions, ship: ids.has(sh.at) ? sh.at : null, shipNear: sh.near && things.some(t => t.id === sh.near) ? sh.near : null, worlds: scannedWorlds(L), sysmaps, things, ly: G().ly, jump: (G().p || {}).layout === "schematic", reach: SP && sh.at ? Math.round(reachLy() / G().ly * 100) / 100 : 0 };
  };

  // the view, mounted by the page's shell when the game master opens it (atlas-shell.js)
  A.galaxyMount = el => { if (!host || host !== el) mount(el); else { refresh(); } return { wake: refresh }; };
  /* ---- a world's surface (the user's approved plan of 3 Nov 2026: the whole globe made when a planet is first opened).
          The world generator atlas.js world runs is given the planet's own physics: its gravity, its air, its seas or
          their absence, its warmth, its kind of land and its colours. Made in the background, kept in this browser by
          its recipe, the same every time, and opened in the world map as one of the campaign's worlds (A.worlds,
          A.openWorld): places and changes made on it are kept as on any world. Which surfaces were opened is kept
          (collection "planetworlds"), so they come back with the page. */
  const surfId = (sid, n, m) => ("p-" + sid + "-" + n + (m != null && m !== "" ? "-m" + m : "")).replace(/[^\w-]/g, "-").slice(0, 40);
  // a world's opened surface, for its globe (the galaxy plan, section 6: "paint the globe from the real map from then
  // on, in the same style"): its heights and sea level, read once from the map the surface was made as
  const HGT = new Map();
  function heightOf(p) {
    if (!p || !p.sid || !A.worlds) return null;
    const id = p.pn != null ? surfId(p.sid, p.pn, p.n) : surfId(p.sid, p.n), w = A.worlds[id], T = w && w.terrain;
    if (!T || !T.height || !T.cols || !T.rows) return null;
    let h = HGT.get(id); if (h && h.src === T.height) return h;
    let H; if (typeof T.height === "string") { const b = atob(T.height); H = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) H[i] = b.charCodeAt(i); } else H = Uint8Array.from(T.height);
    h = { H, cols: T.cols, rows: T.rows, sea: T.sea == null ? 128 : T.sea, src: T.height }; HGT.set(id, h); return h;
  }
  if (A.pixelPlanet) A.pixelPlanet.heightOf = heightOf;
  // (since 4 Nov 2026 the recipe is the planetary layer's own: its environment worked out from its physics first, the
  // generator following it; engine/atlas-planet.js surfaceFlags. The older recipe below stays for a page without it)
  function surfaceFlags(p, seed, star) {
    if (A.planets && A.planets.surfaceFlags) return A.planets.surfaceFlags(p, star || {}, seed);
    const share = Math.max(.03, Math.min(.97, 1 - (p.ocean || 0))), tc = p.tempC;
    const climate = (p.liquid === "none" || p.liquid === "lava") && (p.pressure || 0) > .001 ? "arid" : tc > 26 ? "tropical" : tc > 16 ? "warm" : tc > 4 ? "temperate" : tc > -15 ? "cold" : "polar";
    const word = { garden: "earthlike", ocean: "earthlike", desert: "desert", ice: "ice", dwarf: "ice", lava: "volcanic", toxic: "toxic", barren: "barren", rocky: "barren" }[p.kind] || "barren";
    // (its warmth: the globe's mean brought to the planet's own temperature, world-invent.js --temp)
    const f = { size: "planet", land: "masses", landmasses: p.tectonics === "plates" ? 4 : p.tectonics === "stagnant" ? 2 : 3, landshare: share, climate, realism: "alien", setting: "scifi", planet: word, gravity: p.gravity, air: Math.max(.02, Math.min(3, p.pressure || 0)), water: 1 - share, warmth: 0, temp: tc, look: "planet", seed, replace: true, regions: true, "climate-model": "earth" };
    if (p.liquid === "water") { f.currents = true; f.coast = "geologic"; } else { f.currents = "off"; f.coast = "plain"; }
    // rivers only where a liquid runs over the ground (water, or Titan's methane); craters where nothing wears them away:
    // no air to burn up the stones and no rain to fill them, and no moving crust or fresh ice or lava to cover them
    if (p.liquid !== "water" && p.liquid !== "methane") f.norivers = true;
    f.liquid = p.liquid || "none";
    const P = p.pressure || 0, fresh = p.tectonics === "tidal" || p.tectonics === "iceshell" || p.liquid === "lava";
    const cr = P < .01 ? 1 : P < .1 ? .5 : P < 1 && p.tectonics === "stagnant" ? .25 : 0;
    if (cr) f.craters = fresh ? +(cr * .15).toFixed(2) : cr;
    // its crust: moving plates raise mountain belts; a rigid lid raises volcanic swells and rifts instead
    // (scripts/world-geology.js o.lid)
    if (p.tectonics && p.tectonics !== "plates") f.lid = p.tectonics;
    // a world locked to its star: warm under the star, cold on the night side, evened out by its air
    // (scripts/world-geology.js lockClimate); its slow turning drives no ocean gyres of Earth's kind
    if (p.locked && !p.host) { f.locked = +(Math.min(.95, P / (P + 1))).toFixed(2); f["climate-model"] = "classic"; f.currents = "off"; }
    // (the globe as large as the world is: a moon or a small planet is smaller than the Earth, and its map's scale says so)
    if (p.radius && Math.abs(p.radius - 1) > .03) f.km = Math.round(40030 * p.radius);
    return f;
  }
  // a planet, or one of its large moons (m, its number in the planet's list of moons)
  function planetOf(sid, n, m) {
    const s = findSys(sid); if (!s) return null; const info = bodiesOf(s); const p = info.planets.find(x => x.n === +n); if (!p) return null;
    if (m == null || m === "") return { s, p };
    const mo = (p.moonList || []).find(x => x.n === +m && !x.small); return mo ? { s, p: Object.assign({}, mo, { name: moonName(p, mo) }), planet: p } : null;
  }
  function registerSurface(sid, n, T, m) {
    const o = planetOf(sid, n, m); if (!o) return null; const id = surfId(sid, n, m);
    A.world({ title: o.p.name, look: "planet", kind: "planet", planet: Object.assign({ system: sid, n: +n }, m != null && m !== "" ? { moon: +m } : {}), locations: [], routes: [], regions: [] }, id);
    if (T) A.worldTerrain(Object.assign({}, T, { look: "planet", planetPalette: o.p.palette || null }), id);
    return id;
  }
  async function planetSurface(sid, n, say, m) {
    const o = planetOf(sid, n, m); if (!o) throw new Error("that world is not in the chart");
    if (!o.p.landable) throw new Error(`${o.p.name} has no surface to land on`);
    const id = surfId(sid, n, m), have = A.worlds && A.worlds[id] && A.worlds[id].terrain && A.worlds[id].terrain.height;
    if (have) return id;
    const flags = surfaceFlags(o.p, surfSeed(o, n, m), bodiesOf(o.s).star), key = "planet|" + JSON.stringify(flags);
    let T = A.worldGenCache ? await A.worldGenCache(key) : null;
    if (!T) { if (say) say(`Making the whole globe of ${o.p.name}: about ${Math.round(A.worldGenSecs("planet") / 60)} minutes the first time, then it is kept.`); T = await A.worldGenerate(flags, { title: o.p.name, locations: [] }); if (A.worldGenCache) await A.worldGenCache(key, T); }
    registerSurface(sid, n, T, m);
    const st = S(); if (st) st.set("planetworlds", id, Object.assign({ system: sid, n: +n, key, t: Date.now() }, m != null && m !== "" ? { m: +m } : {}));
    return id;
  }
  A.planetSurface = planetSurface;
  function surfSeed(o, n, m) { return (G().p.seed || 1) * 31 + ((o.s.i0 != null ? o.s.i0 : o.s.i) || 0) * 17 + (+n) + (m != null && m !== "" ? 1000 * (+m + 1) : 0); }
  // a surface's world, by the reference its world map keeps ({ system, n, moon }): the recipe its physics give and what
  // they make of it (the editing plan of 10 Nov 2026, stage 4: the world map's Draw its surface and its brushes ask it)
  A.planetSurfaceOf = ref => {
    if (!ref || ref.system == null) return null; const o = planetOf(ref.system, ref.n, ref.moon); if (!o) return null;
    const star = bodiesOf(o.s).star, flags = surfaceFlags(o.p, surfSeed(o, ref.n, ref.moon), star);
    const env = flags.env || (A.planets && A.planets.environment ? A.planets.environment(o.p, star) : null);
    return { name: o.p.name, p: o.p, flags, env };
  };
  // the surfaces opened before come back with the page: named at once, their land from this browser's keeping (or made
  // again, the same, when opened)
  // (a surface made under rules older than the planetary layer's environment is made again when it is next opened: the
  // user's answer of 4 Nov 2026, "remake them all"; the game master's places and changes on it are kept, as they lie over it)
  const currentKey = k => !!(A.planets && A.planets.ENV_V && String(k || "").includes(`"envv":${A.planets.ENV_V}`));
  A.planetSurfacesInit = st => st.watch("planetworlds", docs => { for (const [id, d] of Object.entries(docs || {})) { if (!d || !d.system || (A.worlds[id] && A.worlds[id].data)) continue; registerSurface(d.system, d.n, null, d.m); if (A.worldGenCache && d.key && currentKey(d.key)) A.worldGenCache(d.key).then(T => { if (T) registerSurface(d.system, d.n, T, d.m); }); } });
  // a system opened from elsewhere on the page (and a world in it, by its number): the star chart's own selection
  A.galaxyOpen = (id, n) => { if (!host || !findSys(id)) return false; enterSystem(id); UI.planet = n == null ? null : +n; side(); return true; };
  // (a system chosen from outside the chart: a place's trail back up to the stars)
  // (which system is chosen: a step for Back, atlas-nav.js; and the search: the systems by name, and their worlds')
  A.galaxySelected = () => UI.sel;
  // (a system's worlds, belts and sites as the page has them: grown and as the game master changed them)
  A.galaxyApi.bodies = id => { const s = findSys(id); return s ? bodiesOf(s) : null; };
  // (for the tests: what the chart has just drawn, and where its camera is; and a way to set the camera)
  A.galaxyDebug = { remake: () => UI.remake ? Object.assign({}, UI.remake) : null, tl: () => TL ? { t: TL.t, n: TL.P.length, play: TL.play, text: TL.el.textContent } : null, away: () => DRAWN.filter(d => d[4]).length, side: () => SV ? { open: true, text: SV.el.textContent } : null, where: id => { const d = DRAWN.find(q => q[2] && q[2].id === id); return d ? [Math.round(d[0]), Math.round(d[1])] : null; }, drawn: () => DRAWN.length, labels: () => (DRAWN.length), cam: () => Object.assign({}, CAM), set: (x, y, s) => { fly = null; CAM.x = x; CAM.y = y; CAM.s = clampS(s); request(); }, fitGalaxy: () => fitGalaxy(0), fitChart: () => fitChart(0), frame: () => frame(), picDone: () => !!(PIC && PIC.done), model: () => MG, frameOf: () => FR };
  (A.searchers = A.searchers || []).push({ kind: "Among the stars", order: 22, mod: ["stars"], find: q => { const out = []; if (!A.galaxyParams) return out; for (const s of allSys()) { const x = A.nav && A.nav.hit(s.name, [s.desc, s.gm].join(" "), q, (Gg.STAR_NAME[s.cls] || "A star") + (s.f && s.f.colony ? " · a colony" : s.f && s.f.station ? " · a station" : "")); if (x) out.push(Object.assign(x, { go: () => { const v = document.getElementById("v-galaxy"); if (v) v.click(); setTimeout(() => A.galaxyOpen(s.id), 40); } })); if (out.length > 40) break; } return out; } });
  A.galaxyFocus = id => { if (!host) return; const s = findSys(id); if (!s) return; UI.sel = id; centreOn(s, 2.5); over(); side(); };
  if (A.tableUI) { const iv = setInterval(() => { const st = A.tableUI.api.store(); if (!st) return; clearInterval(iv); ST = st; A.planetSurfacesInit(st); setInterval(() => { if (host && host.isConnected && host.offsetParent) checkThings(); }, 20000); for (const c of ["charts", "ship", "gedits"]) st.watch(c, () => { if (host && host.isConnected && host.offsetParent) { if (c === "gedits" || c === "charts") refresh(); else { over(); side(); } } }); }, 200); setTimeout(() => clearInterval(iv), 120000); }
})(ATLAS);
