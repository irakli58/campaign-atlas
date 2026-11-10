/* The rumour mill (the user's approved idea of 3 Nov 2026, the fourth in the workspace's reviews/2026-11-03-ideas.md:
   "what happens in the world travels as rumours along the roads, a few miles a day, and changes as it spreads. The
   players hear the version that has reached the inn they are in. Atlas keeps the truth and every version").
   A rumour starts at a place on the world map: by itself when an event happens there that has words for the players
   (atlas-worldtime.js), or when the game master starts one, writing what really happened and what people say. It
   travels the world map's routes at the pace of the people on them (each way's days, as the journeys reckon them, and
   half a day in each place for the tale to be told), as far as it matters (a background event no further than the
   next place, a critical one everywhere). At each place it is told again from the version that came there, and often
   changed: numbers grow, things get worse, the place goes vague, someone is blamed, a detail is added or lost. Every
   version is worked out from the rumour and the place alone, so it is always the same and nothing but the rumour
   itself is kept (collection "rumours"). The game master sees the truth beside every version and when it reaches each
   place; what is going round where the party is waits for them to tell it (or, if they choose, is told by itself when
   it arrives). The copilot is told what is going round there, and a journey hears it in the towns it reaches. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc, S = () => api.store();
  const nowM = () => (A.worldTime ? A.worldTime.now() : 0);
  const at = m => (A.worldTime ? A.worldTime.at(m) : { short: "", long: "" });
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const UI = { open: null, err: "" };

  /* ---- the world map's places and ways, with the game master's changes (its "world" collection) */
  const PACE0 = { mile: { road: 20, trail: 14, pass: 10, river: 25, sea: 75, rail: 300, air: 500, tunnel: 15 }, km: { road: 32, trail: 22, pass: 16, river: 40, sea: 120, rail: 480, air: 800, tunnel: 24 } };
  function graph() {
    const w = A.worlds && A.worlds.main; if (!w || !w.data) return null;
    const docs = (S() && S().get("world")) || {}, OV = A.worldOV ? A.worldOV(Object.entries(docs)) : { loc: {}, route: {} }, T0 = w.terrain || {}, spots = T0.spots || {}, locs = {};
    for (const l of w.data.locations || []) { if (!l || !l.id) continue; const o = Object.assign({ kind: "town" }, l, OV.loc[l.id] || {}); if (o.gone) continue; o.at = Array.isArray(o.at) ? o.at : spots[l.id]; if (Array.isArray(o.at)) locs[l.id] = o; }
    for (const [id, d] of Object.entries(OV.loc || {})) if (!locs[id] && d && !d.gone && d.name && Array.isArray(d.at)) locs[id] = Object.assign({ id, kind: "town" }, d);
    const R = {};
    for (const r of (w.data.routes && w.data.routes.length ? w.data.routes : T0.routes || [])) { if (!r || !r.from || !r.to) continue; const id = r.id || r.from + "~" + r.to; R[id] = Object.assign({ kind: "road" }, r, { id }); }
    for (const [id, d] of Object.entries(OV.route || {})) { if (!d) continue; if (R[id]) Object.assign(R[id], d); else if (!d.gone && d.from && d.to) R[id] = Object.assign({ kind: "road", id }, d); }
    const scale = w.data.scale && w.data.scale.per > 0 ? w.data.scale : T0.scale && T0.scale.per > 0 ? T0.scale : null, speeds = w.data.speeds || null, PACE = (A.journey && A.journey.PACE) || PACE0;
    const days = r => { if (typeof r.days === "number" && r.days >= 0) return r.days; if (!scale) return 1; const a = locs[r.from], b = locs[r.to], unit = /mile/.test(scale.unit || "") ? "mile" : "km", d = Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) * 1.25 * scale.per; return d / ((speeds && speeds[r.kind]) || PACE[unit][r.kind] || PACE[unit].trail); };
    const adj = {};
    for (const r of Object.values(R)) { if (r.gone || r.blocked || !locs[r.from] || !locs[r.to]) continue; const d = days(r); (adj[r.from] = adj[r.from] || []).push([r.to, d]); (adj[r.to] = adj[r.to] || []).push([r.from, d]); }
    return { locs, adj };
  }
  // the world-map place a campaign place stands in: itself, the one it names, else the one whose 3D city it is in
  function locOf(pid) {
    const w = A.worlds && A.worlds.main; if (!w || !w.data || !pid) return null; const L = w.data.locations || [];
    if (L.some(l => l.id === pid)) return pid; const m = A.meta[pid] || {};
    if (m.location && L.some(l => l.id === m.location)) return m.location;
    const c = A.placeCity ? A.placeCity(pid) : null, hit = c && L.find(l => (l.city || l.id) === c); return hit ? hit.id : null;
  }

  /* ---- told again, and changed: one change at a time, from the version that came */
  const NUM = [[/\b(two|a couple of)\b/i, "half a dozen"], [/\bthree\b/i, "five or six"], [/\bfour\b/i, "seven or eight"], [/\b(five|six)\b/i, "a dozen"], [/\ba few\b/i, "a dozen"], [/\bseveral\b/i, "scores of"], [/\ba dozen\b/i, "a hundred"], [/\bsome\b/i, "many"], [/\bscores of\b/i, "hundreds of"]];
  const WORSE = [["has not come home", "was lost with all hands"], ["not come home", "gone down with all hands"], ["is burning", "has burned to the ground"], ["burning", "burned to the ground"], ["a fire", "a great fire"], ["sick", "dying"], ["hurt", "killed"], ["wounded", "killed"], ["stolen", "stolen, every coin of it"], ["closed", "sealed by order"], ["arrested", "dragged off in chains"], ["a fight", "a pitched battle"], ["a quarrel", "a brawl"], ["missing", "dead, most likely"], ["strange", "unnatural"], ["lights", "fire in the sky"], ["a boat", "a ship"], ["is due", "is doubled"], ["tolls", "has not stopped tolling"], ["smoke", "black smoke"], ["a stranger", "a band of strangers"], ["seen", "seen by half the town"]];
  const MORE = ["and it is not the first time", "though the watch denies it", "and a reward is offered", "and no one will speak of it after dark", "and the priests say it is a sign", "and someone was seen running from it", "and the roads are being watched"];
  // (the world's own powers: not those of other planes, atlas-cosmos.js, whom a market town would hardly name)
  const blamed = () => { const planar = new Set(); try { for (const d of (A.cosmosApi ? A.cosmosApi.cosmos().dimensions : [])) for (const k of Object.keys(d.factions || {})) planar.add(k); } catch (e) {} const F = Object.entries(A.factionsData || {}).filter(([k]) => !planar.has(k)).map(([, f]) => f && (f.n || f.name)).filter(Boolean); return F.length ? F : ["strangers off the road", "the smugglers", "the old families", "the tax men"]; };
  // (a version told after "They say": its first word in small letters, unless it is a name: a place, a power, a person)
  const NAMES = () => { const s = new Set(); const add = n => { const w = String(n || "").split(/\s+/)[0]; if (w) s.add(w.replace(/['’]s$/, "")); }; for (const m of Object.values(A.meta || {})) add(m.name); for (const f of Object.values(A.factionsData || {})) add(f && (f.n || f.name)); const w = A.worlds && A.worlds.main; for (const l of (w && w.data && w.data.locations) || []) add(l.name); for (const p of Object.values(A.castData || {})) add(p && p.n); s.delete("The"); s.delete("A"); return s; };
  const lower = t => { if (!t) return t; const w = t.split(/\s+/)[0].replace(/['’]s$/, "").replace(/[,.:;]$/, ""); return NAMES().has(w) || /^[A-Z]{2,}/.test(w) ? t : t[0].toLowerCase() + t.slice(1); };
  const MUT = [
    (t, r) => { for (const [re, to] of NUM) if (re.test(t)) return [t.replace(re, to), "the numbers grown"]; const m = /\b(\d+)\b/.exec(t); return m ? [t.replace(m[1], String(Math.round(+m[1] * (2 + r() * 2)))), "the numbers grown"] : null; },
    (t, r) => { const c = WORSE.filter(([a, b]) => t.toLowerCase().includes(a) && !t.toLowerCase().includes(b)); if (!c.length) return null; const [a, b] = c[Math.floor(r() * c.length)], i = t.toLowerCase().indexOf(a); return [t.slice(0, i) + b + t.slice(i + a.length), "made worse in the telling"]; },
    t => { const m = /\b(in|at) ((?:the )?[A-Z][\w']+(?: (?:of )?[A-Z][\w']+)*)/.exec(t); return m && !/\bnear\b/.test(t) ? [t.replace(m[0], `somewhere near ${m[2]}`), "the place gone vague"] : null; },
    (t, r) => /some say|blame/.test(t) ? null : [t.replace(/[.!]?\s*$/, "") + `, and some say ${(x => x[Math.floor(r() * x.length)])(blamed())} had a hand in it.`, "someone blamed"],
    (t, r) => { const m = MORE.filter(x => !t.includes(x)); return m.length ? [t.replace(/[.!]?\s*$/, "") + `, ${m[Math.floor(r() * m.length)]}.`, "a detail added"] : null; },
    t => { const i = t.search(/[,;:—]| and /); return i > 30 && i < t.length - 15 ? [t.slice(0, i).replace(/\s+$/, "") + ".", "a detail lost"] : null; }
  ];
  function retell(v, r) {
    if (r() < .3) return { text: v.text, hops: v.hops + 1, changes: v.changes };
    for (let k = 0; k < 8; k++) { const f = MUT[Math.floor(r() * MUT.length)], out = f(v.text, r); if (out && out[0] !== v.text) return { text: out[0], hops: v.hops + 1, changes: v.changes.concat(out[1]) }; }
    return { text: v.text, hops: v.hops + 1, changes: v.changes };
  }
  const FRAMES = ["They say", "Word at the inn is that", "A carter swears", "Everyone here has heard that", "A pedlar told it:", "The talk at the well is that", "A boatman says"];
  const told = (x, place) => x.hops ? `${FRAMES[hash(place + "|" + x.hops) % FRAMES.length]} ${lower(x.text)}` : x.text;
  // how far a rumour goes: as far as what started it matters, in places along the ways
  // (and for how long: an old rumour is no longer worth the telling, unless it was a great thing)
  const REACH = { background: 1, minor: 3, notable: 3, major: 6, critical: 99, near: 2, region: 5, everywhere: 99 };
  const LASTS = { background: 3, minor: 20, notable: 20, major: 45, critical: 120, near: 7, region: 30, everywhere: 365 };

  /* ---- where it has gone, and what is said in each place */
  function spread(R) {
    const G = graph(); if (!G || !G.locs[R.from]) return [];
    const reach = REACH[R.reach] || 4, lasts = LASTS[R.reach] || 30, dist = { [R.from]: 0 }, hops = { [R.from]: 0 }, prev = {}, done = new Set(), q = [[0, R.from]];
    while (q.length) {
      q.sort((a, b) => a[0] - b[0]); const [d, u] = q.shift(); if (done.has(u)) continue; done.add(u);
      if (hops[u] >= reach) continue;
      for (const [v, w] of G.adj[u] || []) { const nd = d + w + .5; if (nd <= lasts && nd < (dist[v] == null ? Infinity : dist[v])) { dist[v] = nd; prev[v] = u; hops[v] = hops[u] + 1; q.push([nd, v]); } }
    }
    const order = Object.keys(dist).sort((a, b) => dist[a] - dist[b]), ver = { [R.from]: { text: (R.said || R.truth || "").trim(), hops: 0, changes: [] } };
    for (const p of order) if (p !== R.from) ver[p] = retell(ver[prev[p]], rng(hash(R.id + "|" + p)));
    return order.map(p => ({ id: p, name: G.locs[p].name, at: R.m + Math.round(dist[p] * 1440), hops: ver[p].hops, text: ver[p].text, say: told(ver[p], p), changes: ver[p].changes, from: prev[p] || null }));
  }
  const all = () => Object.entries((S() && S().get("rumours")) || {}).filter(([id, R]) => id !== "opts" && R && !R.gone && (R.truth || R.said)).map(([id, R]) => Object.assign({ id }, R)).sort((a, b) => b.m - a.m);
  // what is going round a place by a moment: each rumour's version there, once it has come
  function heardAt(place, m) { if (!place) return []; const out = []; for (const R of all()) { if (R.m > m) continue; const x = spread(R).find(p => p.id === place); if (x && x.at <= m) out.push(Object.assign({ rumour: R.id, truth: R.truth }, x)); } return out; }
  const partyAt = () => { const w = A.worlds && A.worlds.main, p = Object.assign({}, (w && w.data && w.data.party) || {}, ((S() && S().get("world")) || {}).party || {}); return p.road && (p.plan || []).length ? null : p.at || null; };
  const placeName = id => { const G = graph(); return (G && G.locs[id] && G.locs[id].name) || id; };

  /* ---- started by itself: an event that happened at a place, with words for the players */
  function fromEvents() {
    const st = S(); if (!st || !A.worldTime) return;
    const defs = A.worldTime.events(), have = st.get("rumours") || {};
    for (const e of defs) {
      const s = (st.get("events") || {})[e.id], key = "ev-" + e.id, words = (e.news && (e.news.text || e.news.headline)) || e.players;
      if (s && s.state === "done" && words && e.place && !have[key]) { const from = locOf(e.place); if (from) st.set("rumours", key, { truth: e.what || e.title, said: words, from, m: s.at != null ? s.at : nowM(), reach: e.importance || "notable", ev: e.id, t: Date.now() }); }
      else if (have[key] && !have[key].mine && (!s || s.state !== "done")) st.set("rumours", key, null);
    }
  }
  // told to the players by itself when it reaches them, if the game master wants it so
  const opts = () => ((S() && S().get("rumours", "opts")) || {});
  function autoTell() {
    if (!opts().auto) return; const p = partyAt(); if (!p) return;
    for (const x of heardAt(p, nowM())) { const R = (S().get("rumours") || {})[x.rumour]; if (!R || (R.told || {})[p]) continue; tell(x.rumour, p, true); }
  }
  function tell(rid, place, auto) {
    const R = (S().get("rumours") || {})[rid], x = R && spread(Object.assign({ id: rid }, R)).find(p => p.id === place); if (!x) return false;
    S().set("news", "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), { m: nowM(), when: at(nowM()).short, headline: x.say.length > 90 ? x.say.slice(0, 87) + "…" : x.say, text: x.say, paper: `Rumour in ${x.name}`, t: Date.now(), rumour: rid });
    S().set("rumours", rid, Object.assign({}, R, { told: Object.assign({}, R.told || {}, { [place]: auto ? "auto" : "gm" }) }));
    return true;
  }

  /* ---- the tab */
  function html() {
    const G = graph(), p = partyAt(), now = nowM(), here = p ? heardAt(p, now) : [], list = all();
    if (!G) return `<section class="t-card"><h3>${T.icon("rumour")} The rumour mill</h3><p class="kn">The rumour mill needs the world map: its places and the ways between them are where rumours travel.</p></section>`;
    const locs = Object.values(G.locs).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const row = (R, x) => { const come = x.at <= now, R0 = R.told || {}; return `<tr class="${come ? "rm-came" : "rm-not"}"><th>${esc(x.name)}${x.id === p ? ` <span class="rm-party">the party</span>` : ""}</th><td class="kn">${x.hops ? (come ? esc(at(x.at).short) : `${esc(at(x.at).short)} <i>(in ${Math.max(1, Math.round((x.at - now) / 1440))} day${Math.round((x.at - now) / 1440) > 1 ? "s" : ""})</i>`) : "where it began"}</td><td>${esc(x.say)}${x.changes.length ? `<span class="kn rm-ch"> ${esc(x.changes.join("; "))}</span>` : ""}</td><td>${come ? (R0[x.id] ? `<span class="kn">told</span>` : `<button type="button" class="t-link" data-rm="tell" data-id="${esc(R.id)}" data-p="${esc(x.id)}">Tell the players</button>`) : ""}</td></tr>`; };
    const card = R => { const sp = spread(R), came = sp.filter(x => x.at <= now).length; return `<details class="rm-r"${UI.open === R.id ? " open" : ""} data-id="${esc(R.id)}"><summary><b>${esc((R.said || R.truth).slice(0, 90))}${(R.said || R.truth).length > 90 ? "…" : ""}</b> <span class="kn">from ${esc(placeName(R.from))}, ${esc(at(R.m).short)} · ${came} of ${sp.length} places${R.ev ? " · from an event" : ""}</span></summary>
      <p class="rm-truth"><b>The truth</b> <i>(only you)</i>: ${esc(R.truth || R.said)}</p><table class="rm-t"><tbody>${sp.map(x => row(R, x)).join("")}</tbody></table>
      <div class="t-row"><button type="button" class="t-mini" data-rm="stop" data-id="${esc(R.id)}">${R.ev ? "Let it die out" : "Take it back"}</button></div></details>`; };
    return `<div class="t-grid t-g2w"><div>
      <section class="t-card"><h3>${T.icon("rumour")} The rumour mill</h3><p class="t-small">What happens in the world travels the roads as rumours, at the pace of the people on them, and changes as it is told again. You keep the truth; each place has its own version.</p>
        ${p ? `<h4>Going round ${esc(placeName(p))}, where the party is</h4>${here.length ? `<ul class="rm-here">${here.map(x => `<li>${esc(x.say)} ${((S().get("rumours") || {})[x.rumour] || {}).told && (S().get("rumours") || {})[x.rumour].told[p] ? `<span class="kn">told</span>` : `<button type="button" class="t-link" data-rm="tell" data-id="${esc(x.rumour)}" data-p="${esc(p)}">Tell the players</button>`}</li>`).join("")}</ul>` : `<p class="kn">Nothing has reached them here yet.</p>`}` : `<p class="kn">${A.worlds.main.data ? "The party is on the road, or not placed on the world map: rumours are heard in places." : ""}</p>`}
        <label class="t-fogck"><input type="checkbox" data-rm="auto"${opts().auto ? " checked" : ""}> When a rumour reaches the party, tell them by itself</label></section>
      <section class="t-card"><h3>The rumours</h3>${list.length ? list.map(card).join("") : `<p class="kn">None yet. An event with words for the players starts one where it happens; or start one below.</p>`}</section></div>
      <div><section class="t-card"><h3>Start a rumour</h3>${UI.err ? `<p class="t-err">${esc(UI.err)}</p>` : ""}<form data-rm="new">
        <label class="tw-l"><span>What really happened <i>(only you)</i></span><textarea class="t-in" name="truth" rows="3" maxlength="800" placeholder="The miller set the fire himself, to hide what he kept in the cellar."></textarea></label>
        <label class="tw-l"><span>What people say at first</span><textarea class="t-in" name="said" rows="2" maxlength="400" placeholder="Harrow's Mill burned last night; the miller got out with nothing."></textarea></label>
        <div class="tw-2"><label class="tw-l"><span>Where it starts</span><select class="t-in" name="from">${locs.map(l => `<option value="${esc(l.id)}"${l.id === p ? " selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>
        <label class="tw-l"><span>How far it goes</span><select class="t-in" name="reach"><option value="near">The places nearby</option><option value="region" selected>The region</option><option value="everywhere">Everywhere</option></select></label></div>
        <div class="t-row"><button class="t-btn prim">Let it spread</button></div></form></section></div></div>`;
  }
  function paint() { if (api.tab() === "rumours") api.render(); }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-rm]"); if (!b || b.tagName === "INPUT" || b.tagName === "FORM") return;
    const id = b.dataset.id;
    if (b.dataset.rm === "tell") { if (tell(id, b.dataset.p)) api.note("Told to the players, as it is said there."); UI.open = id; }
    else if (b.dataset.rm === "stop") { const R = (S().get("rumours") || {})[id]; if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Really? Click again"; return; } S().set("rumours", id, R && R.ev ? Object.assign({}, R, { gone: true, mine: true }) : null); }
    else return;
    setTimeout(paint, 60);
  });
  document.addEventListener("toggle", e => { const d = e.target; if (d.classList && d.classList.contains("rm-r")) UI.open = d.open ? d.dataset.id : UI.open === d.dataset.id ? null : UI.open; }, true);
  document.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.rm === "auto") { S().set("rumours", "opts", Object.assign({}, opts(), { auto: t.checked })); if (t.checked) setTimeout(autoTell, 60); } });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || f.dataset.rm !== "new") return; e.preventDefault();
    const g = n => String((f.elements[n] || {}).value || "").trim(), truth = g("truth"), said = g("said") || truth;
    if (!said) { UI.err = "Write what happened, or what people say."; paint(); return; }
    const id = "r" + Date.now().toString(36); UI.err = ""; UI.open = id;
    S().set("rumours", id, { truth: truth || said, said, from: g("from"), reach: g("reach") || "region", m: nowM(), mine: true, t: Date.now() });
    if (document.activeElement && f.contains(document.activeElement)) document.activeElement.blur();
    api.note("The rumour is out."); setTimeout(paint, 60);
  });

  // (the search: each rumour by its truth and by what is said)
  (A.searchers = A.searchers || []).push({ kind: "Rumours", order: 36, mod: ["living"], find: q => all().map(R => { const t = String(R.title || R.said || R.truth || "A rumour"), x = A.nav && A.nav.hit(t.length > 70 ? t.slice(0, 68) + "…" : t, [R.truth, R.said].join(" "), q, "The rumour mill"); return x ? Object.assign(x, { go: () => api.open("rumours") }) : null; }).filter(Boolean).slice(0, 30) });
  TU.addTab({ key: "rumours", label: "The rumour mill", icon: "rumour", group: "play", after: "time", desc: "What happens travels the roads as rumours and changes as it goes; you keep the truth",
    html, status: () => { const p = partyAt(), n = p ? heardAt(p, nowM()).length : 0; return n ? `${n} going round where the party is` : `${all().length} rumour${all().length === 1 ? "" : "s"}`; },
    init(store) {
      for (const c of ["rumours", "events", "eventdefs", "clock", "world"]) store.watch(c, () => { if (c === "events" || c === "eventdefs") fromEvents(); if (c === "clock" || c === "world" || c === "rumours") autoTell(); paint(); });
    } });

  // for the copilot and the journeys: what is going round where the party is, and in a town on the way
  A.rumours = { all, spread, heardAt, tell, locOf, graph, say: () => { const p = partyAt(); if (!p) return ""; const h = heardAt(p, nowM()); return h.length ? `Rumours going round ${placeName(p)}, where the party is (as people tell them, not the truth): ` + h.slice(0, 5).map(x => `"${x.text}"`).join("; ") : ""; } };
})(ATLAS);
