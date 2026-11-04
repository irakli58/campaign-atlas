/* Journeys on the world map (the user's approved idea of 3 Nov 2026, the second in the workspace's
   reviews/2026-11-03-ideas.md: "when the party travels a route, the trip unfolds day by day: weather, terrain-fitting
   encounters, things found, supplies used (from Money), time passing (world's time), rumours heard at the inns on the
   way"; and their word on it: "text not checkmarks so a person writes what they are going to do").
   The world map plans the way (How do they get here?, Set this as the party's journey); this file makes each day of
   it. A day on the road: the weather where the party is (atlas-weather.js), the ground they cross (the world map's own
   land), how far they get (the route's days, slowed by the weather and, off the roads, by the ground), what they might
   meet (from the campaign's own tables when it has them, else fitting the ground and the age), a sight on the way, now
   and then something found, the food the party carries going down (and bought in the towns, from Money), the world's
   time moving on a day (events come due as they do), and, at a town, rumours the game master may pass on. Nothing is
   decided for the game master: what they meet and find are suggestions; what the party does that day the game master
   writes in the players' words, and how it went in their own. The world map's "party" doc keeps where the party is,
   with how far along the leg (road); the days are kept in the table's collection "journeys". */
(function (A) {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const unb64 = s => { if (!s) return null; const b = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary"), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const store = () => A.tableUI && A.tableUI.api && A.tableUI.api.store ? A.tableUI.api.store() : null;
  const nowM = () => (A.worldTime ? A.worldTime.now() : 0);
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

  /* ---- the ground at a spot: the world map's own kinds of land, else its height, wetness and warmth */
  const GR = {};
  function ground(wid, xy) {
    const w = A.worlds && A.worlds[wid], T = w && w.terrain; if (!T || !T.height || !xy) return "plains";
    let g = GR[wid]; if (!g || g.T !== T) g = GR[wid] = { T, H: unb64(T.height), M: T.moist ? unb64(T.moist) : null, B: T.biome ? unb64(T.biome) : null, C: T.cover ? unb64(T.cover) : null };
    const cell = T.cell || 4, i = Math.max(0, Math.min(T.cols - 1, Math.floor(xy[0] / cell))), j = Math.max(0, Math.min(T.rows - 1, Math.floor(xy[1] / cell))), n = j * T.cols + i;
    if (g.H[n] <= (T.sea || 128)) return "water";
    const code = (g.C && g.C[n]) || (g.B && g.B[n]) || 0, L = A.worldBiomes && A.worldBiomes.LIST[code], name = L ? L[0] : "";
    const C = A.weather ? A.weather.climateAt(wid, xy) : null, m = C ? C.metres : (g.H[n] - 128) * 30;
    if (name) {
      if (/mtn|mountain|alpine|spires|metalcliffs|volcano|crater|canyon|mesas/.test(name) || m > 2400) return "mountains";
      if (/forest|wood|jungle|bamboo|rainforest|boreal|taiga|birch|giant|palms|blossom|thornwood|gloomwood|mushrooms|fungal|alienforest|biolum|crystalwood|orchard|gallery|subtropical|mixed|monsoon|temperate|autumn/.test(name)) return m > 900 ? "hills" : "forest";
      if (/marsh|swamp|bog|fen|mangrove|flooded|floodplain/.test(name)) return "marsh";
      if (/desert|dunes|badlands|saltflat|drylake|aliendesert|ashwaste|cinders|brimstone|wasteland|toxic|irradiated/.test(name)) return "desert";
      if (/snow|ice|glacier|tundra|icesheet/.test(name)) return "snow";
      if (/farmland|vineyard|terraces/.test(name)) return "farmland";
      if (m > 900) return "hills";
      return "plains";
    }
    const wet = g.M ? g.M[n] / 255 : .5, t = C ? C.T : 10;
    if (m > 2200) return "mountains"; if (t < -6) return "snow"; if (m > 800) return "hills";
    if (wet < .18 && t > 8) return "desert"; if (wet > .78 && m < 150) return "marsh"; if (wet > .5) return "forest";
    return "plains";
  }
  const GROUND = { water: "on the water", mountains: "in the mountains", hills: "in the hills", forest: "in the woods", marsh: "in the marshes", desert: "in the dry country", snow: "across the snow", farmland: "through farmland", plains: "across open country" };
  // how much the ground slows a way that is not a made road (a road, a railway, a river or the sea keep their pace)
  const SLOW = { mountains: 1.6, hills: 1.25, forest: 1.2, marsh: 1.5, desert: 1.2, snow: 1.5, farmland: 1, plains: 1, water: 1 };
  const MADE = new Set(["road", "rail", "river", "sea", "air", "tunnel", "lane", "jump", "portal"]);
  // a day's pace where the campaign gives none: by the kind of way, in the map's own unit
  const PACE = { mile: { road: 20, trail: 14, pass: 10, river: 25, sea: 75, rail: 300, air: 500, tunnel: 15 }, km: { road: 32, trail: 22, pass: 16, river: 40, sea: 120, rail: 480, air: 800, tunnel: 24 } };

  /* ---- what may come on the way: suggestions for the game master, never decided for them */
  const age = () => { const g = (A.config && A.config.genre) || "", w = A.worlds && A.worlds.main && A.worlds.main.data, look = w ? w.look || (A.worlds.main.terrain || {}).look : ""; return g === "scifi" || /stars|survey|holo/.test(look || "") ? "future" : g === "modern" || look === "atlas" ? "modern" : g === "fantasy" ? "fantasy" : "past"; };
  const MEET = {
    past: {
      any: ["a carter whose wheel has come off, asking for a hand", "pilgrims on their way to a shrine, glad of company", "a tinker with news three weeks old and a pack of oddments", "a lone rider who will not give a name, going the other way fast", "a toll-keeper demanding more than the toll", "a family turned out of their farm, carrying what they could", "soldiers looking for a deserter, and not polite about it", "a messenger whose horse has gone lame, desperate to be somewhere tonight"],
      forest: ["charcoal burners who know every path and do not like strangers", "a hunter's snare with something still in it", "outlaws who would rather talk than fight, for now", "a woodcutter's child, lost", "wolves following, keeping their distance"],
      hills: ["shepherds driving a flock across the way", "a rockfall blocking the path, fresh", "a hermit who asks a riddle before giving directions"],
      mountains: ["a guide who offers the short way over, for a price", "the path gone in a slide: back, or across the scree", "a cold cave where someone has lit fires before"],
      marsh: ["eel-catchers in flat boats who know the dry ways", "lights over the water at dusk", "a causeway half under water"],
      desert: ["a caravan resting through the heat, wary of strangers", "a well, its rope cut", "the bones of a beast, and tracks leading off"],
      snow: ["a traveller frozen in a drift, still breathing", "tracks of something heavy crossing the way", "a hut buried to its eaves, smoke still rising"],
      plains: ["drovers moving cattle to market", "a burnt-out farm, still smoking", "riders on the skyline, watching"],
      farmland: ["a harvest crew who will pay a day's wage for help", "a quarrel over a boundary stone, both sides wanting a witness", "a farm dog that will not let them pass"],
      water: ["a fishing boat in trouble", "another ship keeping pace, flying no flag", "a squall coming up fast"]
    },
    fantasy: {
      any: ["a wandering hedge-wizard selling charms that might even work", "a merchant's wagon with a broken axle and a strange crate", "a knight errant who challenges every passer-by"],
      forest: ["a ring of mushrooms that was not there a moment ago", "goblin scouts, too few to attack, too many to ignore", "a dryad's tree marked with an axe"],
      hills: ["a barrow, its stone pushed aside from within", "a giant's footprint filled with rainwater"],
      mountains: ["a troll under the only bridge", "dwarven traders coming down from the passes", "a wyvern circling far above"],
      marsh: ["will-o'-the-wisps leading off the causeway", "a hag's hut on stilts, a lamp in the window"],
      desert: ["a djinn's bottle half buried in the sand", "a mirage of a city that is still there in the morning"],
      snow: ["a frost giant's horn sounding far off", "a white stag that stops and looks back"],
      plains: ["a centaur herd crossing, unhurried", "an old battlefield where the dead do not lie still at night"],
      water: ["a sea serpent's wake", "merfolk who want something for safe passage"]
    },
    modern: {
      any: ["a broken-down car and a driver with no signal", "a police checkpoint asking for papers", "a hitchhiker with a story that does not add up", "road works and a long detour", "a roadside diner where everyone stops talking"],
      forest: ["a hiker who has been lost for two days", "a logging road gated and padlocked"], mountains: ["the pass closed: chains required", "a rockfall across both lanes"],
      desert: ["a car abandoned with the doors open", "a gas station with no gas"], snow: ["a jackknifed lorry blocking the road", "a stranded coach full of tourists"],
      marsh: ["a flooded road: a ford, or an hour back"], plains: ["a farm truck that will not let them pass"], water: ["a coastguard boarding", "engine trouble far from port"]
    },
    future: {
      any: ["a drone that follows them for an hour, then turns back", "a convoy flying no registry", "a distress beacon, old and repeating", "a patrol asking for their manifest", "scavengers stripping a wreck"],
      desert: ["a dust storm on the sensors, coming fast"], snow: ["a frozen-in prospector's crawler, its crew alive"], mountains: ["a relay mast, dead, that someone has been repairing"], water: ["a sunken habitat's lights still on below"]
    }
  };
  const SIGHT = {
    forest: ["moss to the knees and light falling in shafts", "a ruined chapel swallowed by the trees", "a ford where the road crosses a brown stream", "deer that do not run"],
    hills: ["a long view back the way they came", "a standing stone on the crest", "a shepherd's hut, its fire out", "a hill fort's old banks"],
    mountains: ["peaks under snow, close enough to touch", "a waterfall falling into nothing", "a cairn on the pass, every traveller's stone on it", "eagles below them"],
    marsh: ["reeds taller than a rider", "herons and the smell of rot", "a drowned village's church tower standing in the water"],
    desert: ["heat shaking over the ground", "a dry river bed, white with salt", "a ruin half under the sand", "stars like nowhere else at night"],
    snow: ["silence, and their breath freezing", "blue shadows on the drifts", "a frozen lake, groaning"],
    plains: ["grass to the horizon in the wind", "a milestone, its letters worn away", "a gallows at the crossroads", "a burial mound"],
    farmland: ["fields being worked, the workers watching", "a mill on the stream", "an inn with a painted sign"],
    water: ["the coast going by", "dolphins at the bow", "fog banks on the horizon"]
  };
  const FIND = {
    forest: ["a hunter's cache: dried meat and arrows", "herbs for healing, if someone knows them", "an old sword in the roots of a tree"],
    hills: ["a spring of clean water", "a shepherd's lost purse", "an old coin turned up by a mole"],
    mountains: ["a dead climber's pack: rope, a journal, a map", "a vein of something glittering in the rock"],
    marsh: ["a boat, sound, pulled up among the reeds", "a bundle wrapped in oilcloth on a post"],
    desert: ["a water skin, still full, by a dead camel", "a carved tablet in an unknown script"],
    snow: ["a sledge, abandoned, with its load", "a frozen body with a letter in its coat"],
    plains: ["a lost horse, saddled", "a broken wagon with something hidden in its floor"],
    farmland: ["an orchard where no one minds a few apples", "a scarecrow wearing a good coat"],
    water: ["a cask floating in the swell", "a message in a bottle"]
  };
  // the campaign's own tables first (references/table.md: an "Encounters on the road" table, "Rumours"...)
  function fromTables(re, r) { const T = A.tablesData || {}, k = Object.keys(T).find(n => re.test(n)); return k && T[k] && T[k].length ? { text: String(pick(r, T[k])), from: k } : null; }
  function meet(r, gr, danger, kind) {
    const odds = (danger ? .55 : MADE.has(kind) && kind !== "sea" ? .22 : .35) + (gr === "mountains" || gr === "marsh" ? .1 : 0);
    if (r() > odds) return null;
    const own = fromTables(/encounter|road|travel|wild|journey/i, r); if (own) return own;
    const a = age(), M = MEET[a] || MEET.past, P = MEET.past, opts = [].concat(M[gr] || [], M.any || [], a === "fantasy" ? (P[gr] || []).concat(P.any) : []);
    return { text: pick(r, opts) };
  }

  /* ---- a leg of the way, and a point along it */
  function along(pts, f) {
    if (!pts || pts.length < 2) return pts && pts[0] ? pts[0].slice() : null;
    let tot = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
    let goal = Math.max(0, Math.min(1, f)) * tot; for (let i = 0; i < seg.length; i++) { if (goal <= seg[i] || i === seg.length - 1) { const t = seg[i] ? Math.min(1, goal / seg[i]) : 0; return [Math.round((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t) * 10) / 10, Math.round((pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t) * 10) / 10]; } goal -= seg[i]; }
    return pts[pts.length - 1].slice();
  }
  // a leg's days: the campaign's, or from its length at the pace of its kind of way, or a day where the map has no scale
  function legDays(H, a, b) {
    const L = H.leg(a, b), unit = H.unit === "mile" || H.unit === "miles" ? "mile" : "km";
    if (L.days != null && L.days > 0) return Object.assign(L, { base: L.days, how: L.basis || "" });
    if (L.dist != null) { const pace = PACE[unit][L.kind] || PACE[unit].trail; return Object.assign(L, { base: Math.max(.25, L.dist / pace), how: `at about ${pace} ${unit}s a day` }); }
    return Object.assign(L, { base: 1, how: "a day, as the map has no scale" });
  }

  /* ---- the trip's record (collection "journeys"), and the party's place (the world map's "party" doc) */
  // (the collection followed from the first look at it, so a journey under way is there after the page is opened again)
  let watched = false; const hooks = [];
  const follow = () => { const S = store(); if (S && !watched) { watched = true; S.watch("journeys", () => hooks.forEach(f => { try { f(); } catch (e) { console.warn("atlas journey", e); } })); } return S; };
  const tripOf = id => (follow() && id ? store().get("journeys", id) : null) || null;
  const putTrip = (id, t) => { const S = store(); if (S) S.set("journeys", id, t); };
  function start(H, plan, food) {
    const P = H.party(), id = "j" + Date.now().toString(36), people = Math.max(1, Object.keys(A.pcsData || {}).length || 4);
    putTrip(id, { from: P.at, to: plan[plan.length - 1], plan: plan.slice(), m: nowM(), t: Date.now(), food: food > 0 ? { days: food, people } : null, days: [] });
    return id;
  }
  // one day: travel (or rest), the weather, the ground, how far, what may come, the time moving on
  function day(H, how) {
    const P = H.party(); if (!P.at || !P.plan.length) return null;
    let trip = P.trip && tripOf(P.trip); if (!trip) { const id = start(H, P.plan, 0); P.trip = id; trip = tripOf(id) || { days: [] }; }
    const n = trip.days.length + 1, r = rng(hash(P.trip + "|" + n + "|" + (how || ""))), m0 = nowM();
    const a = P.at, b = P.plan[0], L0 = legDays(H, a, b), f0 = P.road && P.road.f ? P.road.f : 0, xy0 = P.road && P.road.xy ? P.road.xy : along(L0.way, f0);
    const gr = ground(H.wid, xy0), wx = A.weather ? A.weather.at({ wid: H.wid, xy: xy0, name: "" }, m0) : null, tv = A.weather ? A.weather.travel(wx) : { k: 1, why: "" };
    const slow = MADE.has(L0.kind) ? 1 : SLOW[gr] || 1, rest = how === "rest" || (tv.stop && how !== "press");
    const rec = { n, m: m0, how: rest ? "rest" : "travel", from: a, to: b, ground: gr, sky: wx ? A.weather.short(wx) : "", wxLong: wx ? A.weather.long(wx) : "", slow: [], made: 0 };
    if (tv.why && tv.k > 1) rec.slow.push(tv.why); if (slow > 1 && !rest) rec.slow.push(`the going ${GROUND[gr]} is slow off the roads`);
    if (tv.stop && how !== "press") rec.waited = true;
    let at = a, plan = P.plan.slice(), trail = P.trail.slice(), f = f0, legs = 0, reached = [];
    if (!rest) {
      let left = 1;                                      // what is left of the day's travelling
      while (left > .05 && plan.length) {
        const L = legDays(H, at, plan[0]), df = left / (L.base * (tv.k || 1) * (MADE.has(L.kind) ? 1 : SLOW[ground(H.wid, along(L.way, f))] || 1));
        if (f + df < 1) { f += df; left = 0; break; }
        left *= (f + df - 1) / df; trail.push(at); at = plan.shift(); reached.push(at); f = 0; legs++;
        // (a town reached late in the day: they stop there for the night)
        if (H.settled(at) && left < .5) break;
      }
      rec.made = Math.round((legs + f - f0) * 100) / 100;
    }
    const L1 = plan.length ? legDays(H, at, plan[0]) : null, xy = L1 && f > 0 ? along(L1.way, f) : H.where(at);
    rec.xy = xy; rec.reached = reached; rec.f = f; rec.at = at; rec.next = plan[0] || null;
    rec.dist = L0.dist != null && !rest && !legs ? Math.round((f - f0) * L0.dist) : null;
    // what may come, a sight, now and then something found
    const gNow = ground(H.wid, xy);
    rec.meet = meet(r, gNow, L1 ? !!(L1.r && L1.r.danger) : false, L1 ? L1.kind : "road");
    rec.sight = pick(r, SIGHT[gNow] || SIGHT.plains);
    if (r() < .15) rec.found = pick(r, FIND[gNow] || FIND.plains);
    // food
    if (trip.food) { const used = (trip.days.reduce((s, d) => s + (d.ate === false ? 0 : 1), 0)) + 1, forage = !rest && /forest|plains|farmland/.test(gNow) && r() < .2; rec.ate = !forage; rec.food = Math.max(0, trip.food.days - used + (forage ? 1 : 0)); if (forage) rec.forage = true; }
    // rumours where they stop, if it is a town
    if (H.settled(at) && (reached.includes(at) || rest)) rec.rumours = rumours(H, at, r);
    // the world moves on a day; the party where the day left them
    trip.days = trip.days.concat(rec); if (!plan.length) trip.done = true;
    putTrip(P.trip, trip);
    H.setParty({ at, plan, trail, road: plan.length && f > 0 ? { f: Math.round(f * 1000) / 1000, xy } : null, trip: plan.length ? P.trip : null, lastTrip: plan.length ? null : P.trip });
    if (A.worldTime && A.worldTime.advance) A.worldTime.advance(1440);
    if (A.history && reached.length) for (const id of reached) A.history.add({ kind: "reached", title: `The party reaches ${H.name(id)}`, what: `Day ${n} of their journey from ${H.name(trip.from)}.`, places: [id], vis: "players" });
    return { trip: P.trip, n };
  }
  // what is said in a town: a hint of what is coming in the world (the game master's own events that have words for the
  // players), places nearby the party has not heard of, a line of the campaign's own rumours
  function rumours(H, at, r) {
    const out = [], WT = A.worldTime;
    if (WT) for (const e of WT.coming().slice(0, 12)) { const w = (e.news && (e.news.text || e.news.headline)) || e.players; if (w && out.length < 2 && r() < .6) out.push({ text: w, about: e.title, kind: "coming" }); }
    for (const id of H.near(at)) { const L = H.loc(id); if (L && (L.state === "unknown" || L.state === "rumoured") && out.length < 4) out.push({ text: `Travellers speak of ${L.name}, ${H.dir(at, id)}.`, place: id, kind: "place" }); }
    const own = fromTables(/rumou?r|gossip|talk|tavern|inn/i, r); if (own) out.push({ text: own.text, kind: "table", from: own.from });
    // (and what the rumour mill has brought there by the day's end, as it is told there: atlas-rumours.js)
    const mill = A.rumours ? A.rumours.heardAt(at, nowM() + 1440).map(x => ({ text: x.say, kind: "mill", from: "the rumour mill" })) : [];
    return mill.slice(0, 2).concat(out).slice(0, 5);
  }

  /* ---- on the page: the journey bar, the day's card, the road so far */
  function bar(H) {
    const P = H.party(), trip = P.trip && tripOf(P.trip), n = trip ? trip.days.length : 0, L = legDays(H, P.at, P.plan[0]), left = Math.max(0, L.base * (1 - ((P.road && P.road.f) || 0)));
    return `<span class="wm-jday">${n ? `Day ${n} on the road` : "Not set off yet"} · ${esc(H.name(P.plan[0]))} ${left < .6 ? "by tonight" : `about ${left < 1.5 ? "a day" : Math.round(left) + " days"} away`}</span>${A.worldTime ? `<button type="button" data-w="travelday" class="prim">Travel a day</button><button type="button" data-w="restday">Rest a day</button>` : ""}${n ? `<button type="button" data-w="jlog">The road so far</button>` : ""}`;
  }
  function dayHTML(H, tripId, n) {
    const trip = tripOf(tripId); if (!trip) return "";
    const d = trip.days[n - 1]; if (!d) return "";
    const date = A.worldTime ? A.worldTime.at(d.m) : null, toGo = d.next ? H.name(d.next) : "";
    const where = d.how === "rest" ? `They rest ${d.reached && d.reached.length ? "at " + esc(H.name(d.at)) : H.settled(d.at) && !d.f ? "at " + esc(H.name(d.at)) : esc(GROUND[d.ground] || "")}${d.waited ? ", waiting out the weather" : ""}.`
      : d.reached.length ? `They reach ${d.reached.map(id => esc(H.name(id))).join(", then ")}${d.next && d.f ? ` and go on toward ${esc(toGo)}` : ""}.` : `${esc((GROUND[d.ground] || "").replace(/^./, c => c.toUpperCase()))}, on the way to ${esc(toGo)}${d.dist != null ? `: about ${d.dist} ${esc(H.unit || "")} today` : ""}.`;
    const tell = (x, i) => `<li>${esc(x.text)}${x.about ? `<span class="kn"> (a hint of: ${esc(x.about)})</span>` : x.from ? `<span class="kn"> (${esc(x.from)})</span>` : ""} <button type="button" class="t-link" data-w="jtell" data-i="${i}">Tell the players</button></li>`;
    const buy = H.settled(d.at) && !d.f && trip.food && A.money ? foodPrice(trip) : null;
    return `<button type="button" class="wm-x" data-w="close" aria-label="Close">×</button>
      <div class="eyebrow"><span>The party's journey</span>${date ? `<span>${esc(date.short)}</span>` : ""}</div>
      <h3>Day ${d.n}: ${esc(H.name(trip.from))} to ${esc(H.name(trip.to))}</h3>
      <p class="wm-desc">${where}</p>
      ${d.sky ? `<p class="wm-jw"><b>Weather:</b> ${esc(d.wxLong || d.sky)}</p>` : ""}
      ${d.slow.length && d.how !== "rest" ? `<p class="kn">Slower: ${esc(d.slow.join("; "))}.</p>` : ""}
      <h4>On the way <span class="kn">suggestions: use them, change them, or let the day pass</span></h4>
      <ul class="wm-jlist">${d.meet ? `<li><b>They meet</b> ${esc(d.meet.text)}${d.meet.from ? `<span class="kn"> (${esc(d.meet.from)})</span>` : ""}</li>` : `<li><b>Nothing</b> stops them today.</li>`}<li><b>They see</b> ${esc(d.sight)}</li>${d.found ? `<li><b>They might find</b> ${esc(d.found)}</li>` : ""}</ul>
      ${d.rumours && d.rumours.length ? `<h4>Heard in ${esc(H.name(d.at))}</h4><ul class="wm-jlist">${d.rumours.map(tell).join("")}</ul>` : ""}
      ${trip.food ? `<p class="${d.food <= 2 ? "warn" : "kn"}">${d.forage ? "They find enough to eat on the way. " : ""}Food left: ${d.food} day${d.food === 1 ? "" : "s"} for ${trip.food.people}.${d.food <= 2 ? " Running short." : ""}</p>${buy ? `<p><button type="button" data-w="jbuy">Buy 5 days of food here (${esc(buy.say)})</button></p>` : ""}` : ""}
      <form class="wm-jform" data-wj="${esc(tripId)}:${d.n}">
        <label><span>What the party does today <i>(their words)</i></span><textarea name="did" rows="2" maxlength="1200" placeholder="We keep to the river and ask at every farm about the rider.">${esc(d.did || "")}</textarea></label>
        <label><span>How it went <i>(yours)</i></span><textarea name="went" rows="2" maxlength="1200">${esc(d.went || "")}</textarea></label>
        <button type="button" class="prim" data-w="jkeep">Keep the day</button>
      </form>
      ${trip.days.length > 1 ? `<p><button type="button" class="t-link" data-w="jlog">The road so far</button></p>` : ""}`;
  }
  function logHTML(H, tripId) {
    const trip = tripOf(tripId); if (!trip) return "";
    return `<button type="button" class="wm-x" data-w="close" aria-label="Close">×</button><div class="eyebrow"><span>The party's journey</span></div>
      <h3>${esc(H.name(trip.from))} to ${esc(H.name(trip.to))}</h3><ol class="wm-jlog">${trip.days.map(d => `<li><button type="button" class="t-link" data-w="jdayopen" data-n="${d.n}">Day ${d.n}</button> ${d.how === "rest" ? "Rested" : d.reached.length ? "Reached " + d.reached.map(id => esc(H.name(id))).join(", ") : esc(GROUND[d.ground] || "")}${d.sky ? ` · <span class="kn">${esc(d.sky)}</span>` : ""}${d.did || d.went ? `<p>${esc([d.did, d.went].filter(Boolean).join(" — "))}</p>` : ""}</li>`).join("")}</ol>${trip.done ? `<p class="kn">They arrived.</p>` : ""}`;
  }
  // five days of food for the party, at the cheapest food the campaign's goods have (Money)
  function foodPrice(trip) {
    const M = A.money; if (!M || !M.goods) return null; const g = M.goods().filter(x => x.kind === "food").sort((a, b) => a.price - b.price)[0]; if (!g) return null;
    const v = Math.round(g.price * trip.food.people * 5); return { v, say: M.fmt ? M.fmt(v) : String(v), g };
  }
  function keep(tripId, n, did, went) { const t = tripOf(tripId); if (!t || !t.days[n - 1]) return; t.days = t.days.slice(); t.days[n - 1] = Object.assign({}, t.days[n - 1], { did: String(did || "").slice(0, 1200), went: String(went || "").slice(0, 1200) }); putTrip(tripId, t); }
  function buyFood(tripId) { const t = tripOf(tripId), p = t && foodPrice(t); if (!p) return false; A.money.spend(-p.v, "Food for the road"); t.food = Object.assign({}, t.food, { days: t.food.days + 5 }); putTrip(tripId, t); return true; }
  function tellRumour(tripId, n, i) {
    const t = tripOf(tripId), d = t && t.days[n - 1], x = d && d.rumours && d.rumours[i], S = store(); if (!x || !S) return false;
    S.set("news", "n" + Date.now().toString(36), { m: nowM(), when: A.worldTime ? A.worldTime.at(nowM()).short : "", headline: x.text.length > 90 ? x.text.slice(0, 87) + "…" : x.text, text: x.text, paper: "Heard on the road", t: Date.now() });
    return true;
  }
  // for the copilot: where the party is on the road
  function say() {
    const S = store(), w = A.worlds && A.worlds.main; if (!S || !w || !w.data) return "";
    const p = Object.assign({}, w.data.party || {}, (S.get("world") || {}).party || {}); if (!p.trip || !(p.plan || []).length) return "";
    const t = tripOf(p.trip); if (!t) return ""; const name = id => { const l = (w.data.locations || []).find(x => x.id === id) || (S.get("world") || {})["l-" + id] || {}; return l.name || id; }, d = t.days[t.days.length - 1];
    return `The party is on the road from ${name(t.from)} to ${name(t.to)}${d ? `, day ${d.n}, ${GROUND[d.ground] || ""}` : ""}, making for ${name(p.plan[0])}.`;
  }

  A.journey = { PACE, ground, along, legDays, start, day, bar, dayHTML, logHTML, keep, buyFood, tellRumour, say, GROUND, MEET, SIGHT, trip: tripOf, listen: f => { hooks.push(f); follow(); } };
})(typeof ATLAS !== "undefined" ? ATLAS : global.ATLAS);
