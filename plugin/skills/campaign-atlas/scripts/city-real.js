/* Campaign Atlas: a real city for the city map.

   Given the name of any city in the world, this fetches its real streets (with their names), rivers, canals, lakes
   and coast, parks, squares, railways, town walls, districts and notable landmarks from OpenStreetMap, lays them on
   the sheet to scale, and writes the campaign's city.js. The city engine then stands houses along those streets in
   the look of the story's age, and raises each landmark on its true footprint to its true height.

   Called from atlas.js:   node atlas.js city <campaign> "Florence, Italy" [--year 1478 | --era medieval]
                           [--km 2] [--around "Ponte Vecchio"] [--landmarks 36] [--lang local|en|xx] [--region ...] [--refresh]
                           [--buildings] [--ground grass|sand|dirt|snow|concrete]
     --buildings   for a place that is not a city (a camp, a base, a compound, a village) or for a few real streets:
                   every surveyed building stands as it is, with the fences, watchtowers, tracks and sidings; no houses
                   are grown. Keep the sheet small (--km 1 to 1.6).
                           node atlas.js locate <campaign> "Ponte Vecchio"       where a real address falls on the sheet

   The data is (c) OpenStreetMap contributors, under the Open Database Licence; the map credits them, as it must. */
"use strict";
const fs = require("fs"), path = require("path");
const { eraOf, regionOf, REGION_WORDS, plen, areaOf, centroid, pip, pipRings, simplify, simplifyRing, clipLine, clipRing, writeCity } = require("./city-common.js");

const UA = "campaign-atlas/1.0 (tabletop campaign map maker)";
// The public servers that answer questions about the map. Any one of them is often busy: each is tried in turn.
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.openstreetmap.fr/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function geocode(q, extra) {
  const u = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&accept-language=en&q=" + encodeURIComponent(q) + (extra || "");
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`the place-name service answered ${r.status}`);
  return (await r.json()).map(j => ({ lat: +j.lat, lon: +j.lon, display: j.display_name, name: j.name || String(j.display_name).split(",")[0], cc: (j.address || {}).country_code || "", country: (j.address || {}).country || "", state: (j.address || {}).state || (j.address || {}).region || "", type: j.type }));
}

// The survey is asked for in three parts, so that no one request is heavy: the ground (streets, water, green, rails,
// walls, districts), the sights (landmarks and tall buildings), and the middling buildings that tell how tall each
// quarter stands (wanted only for a modern city, and done without if no server will give it).
function queries(s, w, n, e, site) {
  const head = `[out:json][timeout:170][bbox:${s},${w},${n},${e}];`;
  return {
    ground: head + `(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|road|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"];
  way["highway"~"^(service|footway|path|steps|track)$"]${site ? "" : '["name"]'};${site ? '\n  way["barrier"~"^(fence|wall|retaining_wall)$"];' : ""}
  way["waterway"~"^(river|canal|stream|riverbank|dock)$"];
  way["natural"~"^(water|coastline|wood|scrub|heath|grassland|beach|sand|wetland)$"];
  relation["natural"~"^(water|wood|beach)$"];
  relation["waterway"="riverbank"];
  way["landuse"~"^(reservoir|basin|forest|grass|meadow|cemetery|recreation_ground|village_green|farmland|orchard|vineyard|allotments|railway|quarry)$"];
  relation["landuse"~"^(reservoir|forest|cemetery|grass|meadow|farmland)$"];
  way["leisure"~"^(park|garden|pitch|golf_course|common|nature_reserve|stadium)$"];
  relation["leisure"~"^(park|garden|nature_reserve|stadium)$"];
  way["aeroway"~"^(apron|runway)$"];
  way["highway"="pedestrian"]["area"="yes"];
  relation["highway"="pedestrian"]["type"="multipolygon"];
  way["place"="square"];
  relation["place"="square"];
  way["railway"~"^(rail|light_rail|narrow_gauge|disused|abandoned|preserved)$"];
  way["barrier"="city_wall"];
  way["historic"~"^(city_wall|citywalls)$"];
  node["place"~"^(suburb|quarter|neighbourhood|borough)$"];
);
out geom;`,
    sights: head + `(
  nwr["tourism"~"^(attraction|museum)$"]["name"];
  nwr["historic"~"^(castle|fort|fortress|monument|ruins|city_gate|tower|palace|church|monastery|archaeological_site|building|manor|temple|mosque|aqueduct|bridge|tomb|ship)$"]["name"];
  nwr["historic"="memorial"]["name"]["wikidata"];
  nwr["amenity"~"^(place_of_worship|townhall|theatre|university|courthouse|fountain|library)$"]["name"];
  nwr["building"~"^(cathedral|church|chapel|mosque|temple|synagogue|shrine|palace|castle|stadium|train_station|government|civic|museum|university|tower|pyramid|pagoda)$"]["name"];
  nwr["man_made"~"^(tower|lighthouse|obelisk|bridge|chimney)$"]["name"];
  nwr["attraction"="big_wheel"];
  way["building"]["height"~"^([4-9][0-9]|[1-9][0-9][0-9])"];
  relation["building"]["height"~"^([4-9][0-9]|[1-9][0-9][0-9])"];
  way["building"]["building:levels"~"^(1[2-9]|[2-9][0-9]|[1-9][0-9][0-9])$"];
  relation["building"]["building:levels"~"^(1[2-9]|[2-9][0-9]|[1-9][0-9][0-9])$"];
);
out geom;`,
    buildings: head + `(
  way["building"];
  relation["building"];
  nwr["man_made"~"^(tower|water_tower|chimney|silo|storage_tank)$"];
  nwr["military"~"^(bunker|checkpoint)$"];
  node["barrier"~"^(gate|lift_gate)$"];
  nwr["aeroway"="helipad"];
);
out geom;`,
    quarters: head + `(
  way["building"]["building:levels"~"^([5-9]|1[01])$"];
  way["building"]["height"~"^(1[6-9]|2[0-9]|3[0-9])([^0-9]|$)"];
);
out tags center;`
  };
}
async function overpass(q, log) {
  let last = "";
  const ask = async (url, get) => {
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 200000), H = { "User-Agent": UA, "Accept": "application/json" };
    try {
      const r = get ? await fetch(url + "?data=" + encodeURIComponent(q), { headers: H, signal: ac.signal }) : await fetch(url, { method: "POST", headers: Object.assign({ "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }, H), body: "data=" + encodeURIComponent(q), signal: ac.signal });
      const text = await r.text();
      if (r.ok && text.trimStart().startsWith("{")) { const j = JSON.parse(text); if (j.remark && /error|timed out|out of memory/i.test(j.remark)) { last = `${new URL(url).host}: ${String(j.remark).slice(0, 80)}`; return null; } return j; }
      last = `${new URL(url).host} answered ${r.status}`; return null;
    } catch (err) { last = `${new URL(url).host}: ${err.name === "AbortError" ? "no answer in time" : err.message}`; return null; }
    finally { clearTimeout(timer); }
  };
  for (let round = 0; round < 3; round++) {
    for (const url of OVERPASS) {
      const j = await ask(url, false) || (encodeURIComponent(q).length < 7000 ? await ask(url, true) : null);
      if (j) return j;
      log(`   (${last}; trying the next server)`); await sleep(1500);
    }
    if (round < 2) { log("   (every server is busy; waiting a little before asking again)"); await sleep(15000); }
  }
  throw new Error("no map server would answer just now (" + last + "). They are free public servers and are often busy: try again in a few minutes.");
}

// ---- names
const LATIN = /^[\u0000-ɏḀ-ỿ -⁯]+$/;
// streets and districts keep their own names where those can be read; landmarks and water take the English name where there is one
function namer(lang) {
  const local = t => t.name || "";
  if (lang === "local") return { street: local, sight: local };
  if (lang && lang !== "en") { const f = t => t["name:" + lang] || t.name || ""; return { street: f, sight: f }; }
  const readable = t => t.name && LATIN.test(t.name) ? t.name : t["name:en"] || t.int_name || t["name:fr"] || t["name:de"] || t.name || "";
  return { street: readable, sight: t => t["name:en"] || readable(t) };
}

// ---- shapes out of OpenStreetMap elements
const key = p => p.lat.toFixed(7) + "," + p.lon.toFixed(7);
// the closed rings of an area: a closed way is one; a multipolygon's member ways are joined end to end into several
function ringsOf(el, role) {
  let parts = [];
  if (el.type === "way") { if (el.geometry) parts = [el.geometry]; }
  else if (el.type === "relation") parts = (el.members || []).filter(m => m.type === "way" && m.geometry && m.geometry.length > 1 && (!role || !m.role || m.role === role)).map(m => m.geometry);
  parts = parts.map(g => g.filter(Boolean));
  const rings = [], open = [];
  for (const g of parts) { if (g.length > 3 && key(g[0]) === key(g[g.length - 1])) rings.push(g.slice(0, -1)); else if (g.length > 1) open.push(g.slice()); }
  while (open.length) {
    let cur = open.pop(), grew = true;
    while (grew && key(cur[0]) !== key(cur[cur.length - 1])) {
      grew = false;
      for (let i = 0; i < open.length; i++) {
        const o = open[i], e = key(cur[cur.length - 1]);
        if (key(o[0]) === e) cur = cur.concat(o.slice(1)); else if (key(o[o.length - 1]) === e) cur = cur.concat(o.slice().reverse().slice(1)); else continue;
        open.splice(i, 1); grew = true; break;
      }
    }
    if (cur.length > 3 && key(cur[0]) === key(cur[cur.length - 1])) rings.push(cur.slice(0, -1));
  }
  return rings;
}
// lines that share an end and a name become one line, so a street is named once and a river runs whole
function chain(list, sameName) {
  const k = p => Math.round(p[0] * 20) + "," + Math.round(p[1] * 20), ends = new Map();
  const reg = (it, i) => { for (const p of [it.pts[0], it.pts[it.pts.length - 1]]) { const kk = k(p); let a = ends.get(kk); if (!a) ends.set(kk, a = []); a.push(i); } };
  list.forEach(reg);
  const used = new Uint8Array(list.length), out = [];
  const dir = (pts, atEnd) => { const n = pts.length, a = atEnd ? pts[n - 2] : pts[1], b = atEnd ? pts[n - 1] : pts[0]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  for (let i = 0; i < list.length; i++) {
    if (used[i]) continue; used[i] = 1;
    const it = Object.assign({}, list[i], { pts: list[i].pts.slice() });
    for (const atEnd of [true, false]) for (let guard = 0; guard < 400; guard++) {
      const tip = atEnd ? it.pts[it.pts.length - 1] : it.pts[0], heading = dir(it.pts, atEnd);
      let best = -1, bd = 1.75, rev = false;
      for (const j of ends.get(k(tip)) || []) {
        if (used[j] || (sameName && (list[j].name !== it.name || list[j].cls !== it.cls))) continue;
        const o = list[j].pts, starts = k(o[0]) === k(tip), away = starts ? Math.atan2(o[1][1] - o[0][1], o[1][0] - o[0][0]) : Math.atan2(o[o.length - 2][1] - o[o.length - 1][1], o[o.length - 2][0] - o[o.length - 1][0]);
        let d = Math.abs(away - heading); if (d > Math.PI) d = 2 * Math.PI - d;
        if (d < bd) { bd = d; best = j; rev = !starts; }
      }
      if (best < 0) break;
      used[best] = 1;
      const o = rev ? list[best].pts.slice().reverse() : list[best].pts;
      it.pts = atEnd ? it.pts.concat(o.slice(1)) : o.slice().reverse().slice(0, -1).concat(it.pts);
    }
    out.push(it);
  }
  return out;
}

const num = v => { const m = /^\s*(\d+(?:[.,]\d+)?)/.exec(String(v == null ? "" : v)); return m ? parseFloat(m[1].replace(",", ".")) : 0; };
const yearOf = t => { const m = /(-?\d{3,4})/.exec(String(t.start_date || t["construction_date"] || t.opening_date || "")); if (m) return parseInt(m[1], 10); const c = /^C?(\d{1,2})(st|nd|rd|th)?/i.exec(String(t.start_date || "")); return c ? (parseInt(c[1], 10) - 1) * 100 + 50 : null; };

async function importCity(dir, place, flags, log) {
  log = log || console.log;
  if (!place) throw new Error('Which city? node atlas.js city <campaign> "City, Country"');
  const { era, year, look } = eraOf(flags);
  const SW = 320, SH = 200, M = 30, X0 = -M, Y0 = -M, X1 = SW + M, Y1 = SH + M;
  const km = Math.max(.8, Math.min(12, parseFloat(flags.km) || 2)), mpu = km * 1000 / SW;

  // ---- where it is
  log(`looking up ${place} ...`);
  const hits = await geocode(place);
  if (!hits.length) throw new Error(`no place called "${place}" was found. Try adding the country, or spell it as its own language does.`);
  const city = hits[0];
  let lat0 = city.lat, lon0 = city.lon, centreName = "";
  if (flags.center && flags.center !== true) { const m = String(flags.center).split(/[, ]+/).map(Number); if (m.length === 2 && m.every(Number.isFinite)) [lat0, lon0] = m; else throw new Error('--center takes "latitude,longitude"'); }
  else if (flags.around && flags.around !== true) {
    await sleep(1100);
    const a = await geocode(`${flags.around}, ${place}`);
    if (!a.length) throw new Error(`"${flags.around}" was not found in ${place}`);
    lat0 = a[0].lat; lon0 = a[0].lon; centreName = a[0].name;
  }
  const KX = Math.cos(lat0 * Math.PI / 180) * 111320, KY = 110540;
  const P = g => [SW / 2 + (g.lon - lon0) * KX / mpu, SH / 2 - (g.lat - lat0) * KY / mpu];
  const pad = 8, s = lat0 - (Y1 + pad - SH / 2) * mpu / KY, n = lat0 - (Y0 - pad - SH / 2) * mpu / KY, w = lon0 + (X0 - pad - SW / 2) * mpu / KX, e = lon0 + (X1 + pad - SW / 2) * mpu / KX;
  const region = flags.region && flags.region !== true ? (REGION_WORDS[String(flags.region).toLowerCase()] ?? String(flags.region)) : regionOf(city.cc);
  log(`  ${city.display}\n  centred on ${centreName || "the city centre"} (${lat0.toFixed(5)}, ${lon0.toFixed(5)}); the sheet is ${km} km wide, ${(km * SH / SW).toFixed(2)} km deep (1 square of the plan = ${mpu.toFixed(1)} m)`);

  // ---- the survey, kept in the campaign's .cache so that changing the era or the landmarks needs no second fetch
  const site = !!flags.buildings;
  const cdir = path.join(dir, ".cache"), Q = queries(s.toFixed(5), w.toFixed(5), n.toFixed(5), e.toFixed(5), site), els = [];
  fs.mkdirSync(cdir, { recursive: true });
  for (const part of ["ground", "sights", "buildings", "quarters"]) {
    if (part === "quarters" && (era !== "modern" || site) || part === "buildings" && !site) continue;
    const cfile = path.join(cdir, `osm-${[s, w, n, e].map(v => v.toFixed(4)).join("_")}-${part}${site && part === "ground" ? "-site" : ""}.json`);
    let osm = null;
    if (fs.existsSync(cfile) && !flags.refresh) osm = JSON.parse(fs.readFileSync(cfile, "utf8"));
    else {
      log(`  fetching the ${part} from OpenStreetMap ...`);
      try { osm = await overpass(Q[part], log); fs.writeFileSync(cfile, JSON.stringify(osm)); }
      catch (err) { if (part === "ground") throw err; log(`  ! the ${part} could not be fetched (${err.message}) Run the same command again later to add them: what was fetched is kept.`); }
      await sleep(1200);
    }
    if (osm) els.push(...(osm.elements || []));
  }
  if (!els.some(el => el.tags && el.tags.highway)) throw new Error("the survey has no streets here. Check the place name, or centre the sheet with --around or --center.");

  const NM = namer(flags.lang && flags.lang !== true ? String(flags.lang) : "en");
  const WIN = [X0 - 2, Y0 - 2, X1 + 2, Y1 + 2], WIDE = [X0 - 6, Y0 - 6, X1 + 6, Y1 + 6];
  const inSheet = (x, y, m = 0) => x >= m && x <= SW - m && y >= m && y <= SH - m;
  const line = el => (el.geometry || []).filter(Boolean).map(P);
  const area = (el, role) => ringsOf(el, role).map(r => r.map(P));
  const seen = new Set(), once = el => { const k = el.type + el.id; if (seen.has(k)) return false; seen.add(k); return true; };

  // ---- streets
  const CLS = { motorway: 0, trunk: 0, primary: 0, secondary: 1, tertiary: 1, motorway_link: 1, trunk_link: 1, primary_link: 1, secondary_link: 2, tertiary_link: 2, unclassified: 2, residential: 2, living_street: 2, pedestrian: 2, road: 2, service: 3, footway: 3, path: 3, steps: 3, track: 3 };
  let pieces = [];
  const plazas = [], rails0 = [], walls = [], water = [], wlines0 = [], coast = [], green = [], open = [], districts0 = [], cands = [], mids = [];
  const GREEN = { park: .5, garden: .5, common: .2, nature_reserve: .9, recreation_ground: .12, village_green: .2, golf_course: .08, pitch: 0, forest: 1.5, wood: 1.5, scrub: .5, heath: .15, grassland: .05, meadow: .05, grass: .08, cemetery: .35, orchard: .9, vineyard: 0, allotments: .2, wetland: .1 };
  const OPEN = { beach: "sand", sand: "sand", farmland: "field", railway: "yard", quarry: "yard", apron: "paved", runway: "paved" };

  for (const el of els) {
    const t = el.tags; if (!t || !once(el)) continue;
    if (el.center) { const h = num(t.height) || num(t["building:levels"]) * 3.3; if (h >= 15) mids.push([P(el.center), h]); if (!el.geometry) continue; }
    const isArea = el.type === "relation" || (el.geometry && el.geometry.length > 3 && key(el.geometry[0]) === key(el.geometry[el.geometry.length - 1]));
    const tunnel = t.tunnel && t.tunnel !== "no" && t.tunnel !== "building_passage" || t.covered === "yes" || t.location === "underground";

    if (t.highway && el.type === "way" && CLS[t.highway] != null && t.area !== "yes") {
      const cls = CLS[t.highway];
      if (tunnel || (era !== "modern" && /^motorway/.test(t.highway)) || (cls === 3 && (/^(private|no)$/.test(t.access || "") || /^(parking_aisle|driveway)$/.test(t.service || "")))) continue;
      const name = NM.street(t);
      for (const part of clipLine(line(el), WIN)) { const pts = simplify(part, .18); if (plen(pts) >= 1.2) pieces.push({ name, cls, pts }); }
      continue;
    }
    if (t.highway === "pedestrian" || t.place === "square") { for (const r of area(el, "outer")) { const c = simplifyRing(clipRing(r, WIDE), .2); if (c.length > 2 && areaOf(c) >= 6) plazas.push({ name: NM.street(t), pts: c, area: areaOf(c), tags: t }); } }
    if (/^(fence|wall|retaining_wall)$/.test(t.barrier || "") && el.type === "way") { for (const part of clipLine(line(el), WIN)) { const pts = simplify(part, .15); if (plen(pts) >= 2) walls.push({ kind: t.barrier === "fence" ? "fence" : "wall", pts }); } if (!t.building) continue; }
    if (t.railway && el.type === "way") { if (/^(disused|abandoned|preserved)$/.test(t.railway) && era === "modern" && !site) continue;   // a line since closed was running in the story's day
      if (!tunnel && era !== "medieval" && !(year != null && year < 1830) && (site || !/^(yard|siding|spur|crossover)$/.test(t.service || ""))) for (const part of clipLine(line(el), WIN)) { const pts = simplify(part, .2); if (pts.length > 1) rails0.push({ name: "", cls: 0, pts }); } continue; }
    if (t.barrier === "city_wall" || /^(city_wall|citywalls)$/.test(t.historic || "")) { if (el.type === "way" && !isArea) { for (const part of clipLine(line(el), WIN)) { const pts = simplify(part, .2); if (plen(pts) >= 3) walls.push({ pts }); } continue; } }
    if (t.natural === "coastline") { if (el.geometry) coast.push(el.geometry.filter(Boolean)); continue; }
    if (el.type === "way" && /^(river|canal|stream)$/.test(t.waterway || "") && !isArea) { if (!tunnel) for (const part of clipLine(line(el), WIN)) { const pts = simplify(part, .2); if (pts.length > 1) wlines0.push({ name: NM.sight(t), cls: t.waterway, pts, width: num(t.width) }); } continue; }
    if (t.natural === "water" || /^(riverbank|dock)$/.test(t.waterway || "") || /^(reservoir|basin)$/.test(t.landuse || "")) {
      if (tunnel) continue;
      const rings = area(el).map(r => simplifyRing(clipRing(r, WIDE), .15)).filter(r => r.length > 2 && areaOf(r) >= 1.2).sort((a, b) => areaOf(b) - areaOf(a));
      if (rings.length && areaOf(rings[0]) >= 5) water.push({ name: /^(river|canal|stream|ditch|drain)$/.test(t.water || "") || t.waterway ? "" : NM.sight(t), rings, area: areaOf(rings[0]) });
      continue;
    }
    if (el.type === "node" && t.place) { const p = P(el); if (inSheet(p[0], p[1], 14)) districts0.push({ name: NM.street(t), at: p, rank: { suburb: 0, quarter: 1, borough: 2, neighbourhood: 3 }[t.place] ?? 4 }); continue; }

    const gk = t.leisure !== "stadium" && GREEN[t.leisure] != null ? t.leisure : GREEN[t.landuse] != null ? t.landuse : GREEN[t.natural] != null ? t.natural : null;
    const ok = OPEN[t.landuse] || OPEN[t.natural] || OPEN[t.aeroway];
    if ((gk || ok) && isArea && !(era === "medieval" && /^(pitch|golf_course)$/.test(gk || ""))) {
      for (const r of area(el, "outer")) {
        const c = simplifyRing(clipRing(r, WIDE), .25); if (c.length < 3) continue; const a = areaOf(c); if (a < 14) continue;
        if (gk) green.push({ name: a >= 250 ? NM.sight(t) : "", pts: c, trees: GREEN[gk], area: a, tags: t }); else open.push({ kind: ok, pts: c, area: a });
      }
    }
    cands.push(el);
  }

  // streets: join, name once, and keep to what the sheet can hold
  pieces = chain(pieces.filter(p => p.name), true).concat(pieces.filter(p => !p.name)).map(p => Object.assign(p, { pts: simplify(p.pts, .18), len: plen(p.pts) }));
  const budget = (X1 - X0) * (Y1 - Y0) * .21; let total = pieces.reduce((a, p) => a + p.len, 0), thinned = "";
  if (site) total = 0;      // a small sheet, where every track and path matters
  if (total > budget) { pieces = pieces.filter(p => p.cls < 3); total = pieces.reduce((a, p) => a + p.len, 0); thinned = "footpaths and alleys left out"; }
  if (total > budget) { pieces = pieces.filter(p => p.cls < 2 || p.name && p.len >= 10); total = pieces.reduce((a, p) => a + p.len, 0); thinned = "only the named through streets kept"; }
  if (total > budget * 1.3) { pieces = pieces.filter(p => p.cls < 2); thinned = "only main roads and streets kept"; }
  pieces.sort((a, b) => a.cls - b.cls || b.len - a.len);
  const labelled = {};
  const roads = pieces.map(p => {
    const mid = p.pts[p.pts.length >> 1], prev = labelled[p.name] || (labelled[p.name] = []);
    const show = !p.name || p.cls === 0 || prev.every(q => Math.hypot(q[0] - mid[0], q[1] - mid[1]) > 70);
    if (p.name && show) prev.push(mid);
    return show ? [p.name, p.cls, p.pts] : [p.name, p.cls, p.pts, null, { label: false }];
  });

  // ---- the sea: the coastline has land on its left and water on its right, so each stretch that crosses the sheet
  //      is closed clockwise round the border into a piece of sea; rings wholly inside are islands
  {
    const chains = [], pool = coast.map(g => g.slice());
    while (pool.length) { let cur = pool.pop(), grew = true; while (grew) { grew = false; for (let i = 0; i < pool.length; i++) { const o = pool[i]; if (key(o[0]) === key(cur[cur.length - 1])) cur = cur.concat(o.slice(1)); else if (key(o[o.length - 1]) === key(cur[0])) cur = o.concat(cur.slice(1)); else continue; pool.splice(i, 1); grew = true; break; } } chains.push(cur); }
    const R = WIDE, inR = p => p[0] > R[0] && p[0] < R[2] && p[1] > R[1] && p[1] < R[3], W = R[2] - R[0], H = R[3] - R[1], eps = 1e-6;
    const tOf = p => Math.abs(p[1] - R[1]) < eps ? (p[0] - R[0]) / W : Math.abs(p[0] - R[2]) < eps ? 1 + (p[1] - R[1]) / H : Math.abs(p[1] - R[3]) < eps ? 2 + (R[2] - p[0]) / W : Math.abs(p[0] - R[0]) < eps ? 3 + (R[3] - p[1]) / H : -1;
    const corner = k => [[R[0], R[1]], [R[2], R[1]], [R[2], R[3]], [R[0], R[3]]][((k % 4) + 4) % 4];
    const stretches = [], islands = [];
    for (const c of chains) {
      let pts = c.map(P); const closed = key(c[0]) === key(c[c.length - 1]);
      if (closed) { if (pts.every(inR)) { islands.push(pts.slice(0, -1)); continue; } const o = pts.findIndex(p => !inR(p)); pts = pts.slice(o, -1).concat(pts.slice(0, o + 1)); }
      for (const part of clipLine(pts, R)) if (tOf(part[0]) >= 0 && tOf(part[part.length - 1]) >= 0) stretches.push({ pts: part, t0: tOf(part[0]), t1: tOf(part[part.length - 1]) });
    }
    const seas = [], left = new Set(stretches);
    while (left.size) {
      const first = left.values().next().value, ring = []; let p = first;
      for (let guard = 0; guard < 500; guard++) {
        ring.push(...p.pts); left.delete(p);
        let next = null, gap = 9;
        for (const q of [first, ...left]) { let d = q.t0 - p.t1; if (d < 0) d += 4; if (d < gap) { gap = d; next = q; } }
        for (let k = Math.floor(p.t1) + 1; k <= p.t1 + gap + 1e-9; k++) ring.push(corner(k));
        if (next === first) break; p = next;
      }
      const sr = simplifyRing(ring, .15); if (sr.length > 2 && areaOf(sr) > 4) seas.push({ name: "", rings: [sr], area: areaOf(sr), sea: true });
    }
    if (!seas.length && islands.length) seas.push({ name: "", rings: [[[R[0], R[1]], [R[2], R[1]], [R[2], R[3]], [R[0], R[3]]]], area: W * H, sea: true });
    for (const isl of islands) { const sr = simplifyRing(isl, .15), host = seas.find(sea => pip(sr[0][0], sr[0][1], sea.rings[0])); if (host && sr.length > 2 && areaOf(sr) > .8) host.rings.push(sr); }
    water.push(...seas);
  }
  water.sort((a, b) => b.area - a.area);
  const wbox = water.map(wt => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of wt.rings[0]) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return [x0, y0, x1, y1]; });
  const wet = (x, y) => water.some((wt, i) => x >= wbox[i][0] && x <= wbox[i][2] && y >= wbox[i][1] && y <= wbox[i][3] && pipRings(x, y, wt.rings));
  const basins = water.slice(0, 220).map(wt => { const b = { name: wt.area > 120 ? wt.name : "", pts: wt.rings[0] }; if (wt.rings.length > 1) b.holes = wt.rings.slice(1); if (b.name) { const c = centroid(b.pts); if (pipRings(c[0], c[1], wt.rings)) b.at = c; else b.name = ""; } return b; });

  // ---- rivers: where a river's water is already drawn as an area, its line only carries the name and the boats
  const WDEF = { river: 20, canal: 10, stream: 3 };
  let rivers = chain(wlines0, true).map(r => {
    const pts = simplify(r.pts, .2), len = plen(pts); let inW = 0, tot = 0; const half = [];
    for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay), steps = Math.max(1, Math.round(l / 3)); for (let q = 0; q < steps; q++) { const u = (q + .5) / steps, x = ax + (bx - ax) * u, y = ay + (by - ay) * u; tot++; if (!wet(x, y)) continue; inW++; if (tot % 3) continue; const nx = -(by - ay) / (l || 1), ny = (bx - ax) / (l || 1); for (const sg of [-1, 1]) { let d = 0; while (d < 45 && wet(x + nx * sg * (d + .5), y + ny * sg * (d + .5))) d += .5; half.push(d); } } }
    half.sort((a, b) => a - b);
    const ghost = tot > 0 && inW / tot > .5, hw = ghost ? Math.max(.6, half[half.length >> 1] || 1) : Math.max(.3, Math.min(7, (r.width || WDEF[r.cls]) / mpu / 2));
    return { name: r.name, kind: r.cls, pts, len, ghost, hw };
  }).filter(r => r.len >= (r.kind === "stream" ? 30 : 8) && r.pts.length > 1);
  rivers.sort((a, b) => b.hw * b.len - a.hw * a.len);
  const named = new Set();
  rivers = rivers.slice(0, 40).map(r => { const o = { pts: r.pts, hw: r.hw, smooth: r.ghost ? 1 : r.pts.length < 9 ? 2 : 1 }; if (r.ghost) o.ghost = true; if (r.name && !named.has(r.name) && r.len > 25) { named.add(r.name); o.label = r.name; if (r.hw >= 4.5 && r.len > 140) o.big = true; else if (r.len > 220) o.repeat = 170; } return o; });

  // ---- parks, open ground, squares, railways, walls, districts
  green.sort((a, b) => b.area - a.area); open.sort((a, b) => b.area - a.area); plazas.sort((a, b) => b.area - a.area);
  const parks = green.slice(0, 260).map(g => ({ name: g.name, pts: g.pts, trees: g.trees }));
  let rails = chain(rails0, false).map(r => Object.assign(r, { pts: simplify(r.pts, .25), len: plen(r.pts) })).filter(r => r.len >= 14).sort((a, b) => b.len - a.len);
  { // several tracks side by side are one railway on a plan of this scale
    const kept = [], nearKept = (x, y) => kept.some(k => { for (let i = 1; i < k.pts.length; i++) { const [ax, ay] = k.pts[i - 1], [bx, by] = k.pts[i], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let u = l ? ((x - ax) * dx + (y - ay) * dy) / l : 0; u = u < 0 ? 0 : u > 1 ? 1 : u; if (Math.hypot(x - ax - u * dx, y - ay - u * dy) < 1.6) return true; } return false; });
    for (const r of rails) { if (site) { kept.push(r); continue; } let nearN = 0, tot = 0; for (let i = 0; i < r.pts.length; i++) { tot++; if (nearKept(r.pts[i][0], r.pts[i][1])) nearN++; } if (nearN / tot < .7) kept.push(r); if (kept.length >= 24) break; }
    rails = kept.map(r => ({ name: "", pts: r.pts }));
  }
  const districts = {};
  { const pick = []; for (const d of districts0.filter(d => d.name).sort((a, b) => a.rank - b.rank)) { if (pick.length >= 9) break; if (pick.every(q => Math.hypot(q.at[0] - d.at[0], q.at[1] - d.at[1]) > 46)) pick.push(d); } for (const d of pick) districts[d.name] = d.at; }

  // ---- landmarks
  const hu = m => (m <= 150 ? m : 150 + (m - 150) * .55) / mpu;      // the tallest are drawn a little short of scale, or they would leave the view
  const DEF = { tower: 60, hall: 16, church: 42, mosque: 34, dome: 30, castle: 15, stadium: 26, spire: 110, monument: 11, pyramid: 22, pagoda: 30, wheel: 85, bridge: 42 };
  const lms = [];
  for (const el of cands) {
    const t = el.tags, name = NM.sight(t).replace(/\s*\(.*?\)\s*/g, " ").trim(), low = (name + " " + (t.name || "")).toLowerCase();
    const levels = num(t["building:levels"]), tagH = num(t.height) || num(t["building:height"]) || (t.building && num(t.maxheight) > 30 ? num(t.maxheight) : 0);
    let hM = Math.min(1000, tagH || (levels ? levels * 3.4 + 3 : 0)); const tall = hM >= 40 || levels >= 12;
    const compound = site && (t.military || t.aeroway === "helipad" || /^(gate|lift_gate)$/.test(t.barrier || "") || /^(water_tower|silo|storage_tank)$/.test(t.man_made || ""));
    const notable = compound || t.tourism || t.historic || t.man_made || t.attraction || /^(place_of_worship|townhall|theatre|university|courthouse|fountain|library)$/.test(t.amenity || "") || /^(cathedral|church|chapel|mosque|temple|synagogue|shrine|palace|castle|stadium|train_station|government|civic|museum|university|tower|pyramid|pagoda)$/.test(t.building || "") || t.leisure === "stadium" || t.wikidata && (t.leisure || t.place === "square");
    if (!notable && !tall) continue;
    if (!name && !tall && !(site && (compound || t.man_made === "tower"))) continue;
    let rings = el.type === "node" ? [] : area(el, "outer").sort((a, b) => areaOf(b) - areaOf(a)), at;
    if (rings.length) at = centroid(rings[0]); else if (el.type === "node") at = P(el); else continue;
    if (!inSheet(at[0], at[1], 1)) continue;
    let fp = rings.length ? simplifyRing(rings[0], .12) : null, diag = 0;
    if (fp) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of fp) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } diag = Math.hypot(x1 - x0, y1 - y0); if (fp.length < 3 || diag < .5 || diag > SW * .55) fp = null; }
    const fa = fp ? areaOf(fp) : 0, bld = t.building || "", hist = t.historic || "", mm = t.man_made || "", rel = t.religion || "", tt = (t["tower:type"] || "") + " " + (t["tower:construction"] || "") + " " + (t.material || "");
    const solid = !!bld || !!t["building:part"];          // an outline that is a building, not grounds
    let kind = "", top = "";
    if (t.attraction === "big_wheel") kind = "wheel";
    else if (site && (t.man_made === "tower" && (/watch|guard|observation|defensive/.test(tt) || !name && fa < 6) || /wachturm|watchtower|guard tower|wieża/.test(low))) kind = "watchtower";
    else if (site && t.military === "bunker") kind = "bunker";
    else if (site && t.aeroway === "helipad") kind = "pad";
    else if (site && /^(gate|lift_gate)$/.test(t.barrier || "")) kind = "gate";
    else if (site && /^(water_tower|silo|storage_tank)$/.test(t.man_made || "")) kind = "tank";
    else if (!solid && /^(park|garden|nature_reserve|common)$/.test(t.leisure || "")) kind = "park";
    else if (!solid && (t.place === "square" || t.highway === "pedestrian")) kind = "square";
    else if (mm === "lighthouse") { kind = "spire"; top = "light"; }
    else if (mm === "chimney") { kind = "spire"; top = "stack"; }
    else if (mm === "obelisk" || t.memorial === "obelisk" || /\bobelisk/.test(low)) { kind = "spire"; top = "obelisk"; }
    else if (/\b(column|colonne|colonna|säule)\b/.test(low) && (hist || t.tourism)) { kind = "spire"; top = "column"; }
    else if (mm === "tower" && /bell_tower|campanile|minaret|defensive|watchtower|clock/.test(tt)) { kind = "tower"; top = "stone"; }
    else if (mm === "tower" && (!bld || bld === "yes" || bld === "tower") && !/^(apartments|office|residential|hotel|commercial)$/.test(bld)) { kind = "spire"; top = /lattice|iron|steel/.test(tt) ? "" : "needle"; }
    else if (bld === "pyramid" || /\bpyramid/.test(low)) kind = "pyramid";
    else if (t.leisure === "stadium" || bld === "stadium" || /amphithea|colosse|coliseum|\barena\b/.test(low)) kind = "stadium";
    else if (/^(castle|fort|fortress)$/.test(hist) || bld === "castle" || /\b(castle|fortress|citadel|kremlin|alc[aá]zar|castello|castel|burg|qasr)\b/.test(low)) kind = /palace|stately|manor/.test(t.castle_type || "") ? "hall" : "castle";
    else if (rel === "muslim" || bld === "mosque" || hist === "mosque") kind = "mosque";
    else if (/^(buddhist|shinto|taoist|confucian)$/.test(rel) || bld === "pagoda" || bld === "shrine") kind = "pagoda";
    else if (/^(hindu|sikh|jewish)$/.test(rel) || bld === "synagogue") kind = "dome";
    else if (t.amenity === "place_of_worship" || /^(cathedral|church|chapel)$/.test(bld) || /^(church|monastery)$/.test(hist)) { kind = "church"; top = /duomo|basilica|pantheon|\bdome\b|hagia|st\.? peter|saint peter|san pietro|st\.? paul'?s cath|sacr[eé]|invalides|santa maria del fiore|florence cathedral/.test(low) ? "dome" : /cathedral|notre[- ]dame|minster|münster|\bdom\b|kathedrale|cathédrale|catedral/.test(low) ? "twin" : ""; }
    else if (mm === "bridge" || hist === "bridge" || hist === "aqueduct") { kind = "bridge"; top = /suspension|cable|bascule/.test((t["bridge:structure"] || "") + (t["bridge:movable"] || "")) || /tower bridge|golden gate|brooklyn bridge|chain bridge/.test(low) ? "pylons" : ""; }
    else if (tall || bld === "tower") { kind = "tower"; top = hM >= 280 ? "taper" : ""; }
    else if (/^(monument|memorial|tomb)$/.test(hist) || t.tourism === "artwork" || t.amenity === "fountain") { if (fa >= 30) kind = "hall"; else { kind = "monument"; top = t.amenity === "fountain" || /fountain|fontana|fontaine|brunnen/.test(low) ? "fountain" : /statue|equestrian/.test((t.memorial || "") + (t.artwork_type || "") + low) ? "statue" : ""; } }
    else if (fp && solid) { kind = "hall"; if (/capitol|parliament|reichstag|observatory|planetarium|panth[eé]on/.test(low)) top = "dome"; }
    else if (fp) kind = "park";                             // grounds with a name (a zoo, a market, an old quarter): the name only
    else if (hist && el.type === "node") kind = "monument";
    else continue;
    if (!solid && /^(hall|church|mosque|dome|pagoda|tower|pyramid)$/.test(kind)) fp = null;   // grounds are not walls: the usual size for its kind instead
    if (kind === "bridge" && !fp) continue;
    if ((kind === "park" || kind === "square") && !t.wikidata) continue;
    // the age of the story: nothing stands that was built after it
    const built = yearOf(t), old = !!(hist || t.heritage || rel);
    if (year != null && built != null && built > year) continue;
    if (era === "medieval" && built == null && (kind === "tower" && top !== "stone" || kind === "wheel" || /^(needle|stack|light|)$/.test(top) && kind === "spire" || kind === "stadium" && !/amphithea|colosse|arena/.test(low) || kind === "bridge" && top === "pylons" || (kind === "hall" || kind === "monument" || kind === "dome") && !old)) continue;
    if (era === "industrial" && built == null && (kind === "tower" && top !== "stone" && hM >= 45 || kind === "wheel" || kind === "spire" && top === "needle" || kind === "stadium" && !old && !/amphithea|colosse|arena/.test(low))) continue;
    if (kind === "church" && hM < 30) hM = 0;               // a church's tagged height is often its nave: its tower is what shows
    const names = Object.keys(t).filter(k => k.startsWith("name:")).length;
    let score = (t.wikidata ? 50 : 0) + (t.wikipedia ? 25 : 0) + (t.tourism === "attraction" ? 30 : 0) + (t.heritage ? 25 : 0) + (/whc|unesco/i.test((t["heritage:operator"] || "") + (t["ref:whc"] ? "whc" : "")) ? 60 : 0) + Math.min(110, names * 3) + Math.min(120, hM * .5) + (hist ? 15 : 0) + (bld === "cathedral" ? 25 : 0) + (t.tourism === "museum" ? 10 : 0) + Math.min(30, Math.sqrt(fa)) - (el.type === "node" ? 15 : 0);
    if (kind === "tower" && !t.wikidata && !names) score = Math.min(score, hM * .5);
    const h = hM ? hu(hM) : hu(kind === "church" ? (top === "twin" ? 66 : top === "dome" ? 56 : 42) : kind === "spire" ? ({ needle: 180, obelisk: 22, column: 40, light: 30, stack: 50 }[top] || 120) : kind === "tower" && top === "stone" ? 45 : DEF[kind] || 16);
    const L = { name, kind, at }; if (top) L.top = top;
    if (/^(watchtower|bunker|pad|gate|tank)$/.test(kind)) { if (!name) L.label = false; lms.push({ L, score: name ? score : -1, hM, kind, tall: false, named: !!name, el }); if (kind === "watchtower" && hM) L.h = Math.max(1.5, hu(hM)); continue; }
    if (kind !== "park" && kind !== "square") { L.h = Math.max(.6, h); const flatKind = /^(spire|monument|pagoda|wheel)$/.test(kind); if (fp && (!flatKind || diag < 30)) { L.pts = fp; if (!flatKind && rings.length === 1 && el.type === "relation") { const holes = area(el, "inner").map(r => simplifyRing(r, .12)).filter(r => r.length > 2 && areaOf(r) > 1 && pip(r[0][0], r[0][1], fp)); if (holes.length) L.holes = holes; } } }
    lms.push({ L, score, hM, kind, tall, named: !!name, el });
  }
  lms.sort((a, b) => b.score - a.score);
  // --must "Bargello; Uffizi": names that must be on the map whatever their score
  const must = flags.must && flags.must !== true ? String(flags.must).toLowerCase().split(/\s*;\s*/).filter(Boolean) : [];
  for (const c of lms) if (c.named && must.some(m => c.L.name.toLowerCase().includes(m))) c.score += 10000;
  for (const m of must) if (!lms.some(c => c.named && c.L.name.toLowerCase().includes(m))) log(`  (nothing named "${m}" was found in the survey: add it by hand with ATLAS.cityEdit, after: atlas.js locate)`);
  lms.sort((a, b) => b.score - a.score);
  const want = Math.max(0, Math.min(120, parseInt(flags.landmarks, 10) || 36)), landmarks = [], spare = [], flatN = { park: 0, square: 0 }, kindN = {};
  const clash = (L, d) => landmarks.some(q => Math.hypot(q.at[0] - L.at[0], q.at[1] - L.at[1]) < d || (q.name && q.name === L.name && Math.hypot(q.at[0] - L.at[0], q.at[1] - L.at[1]) < 20));
  for (const c of lms) {
    if (!c.named) continue;
    // no one kind may take more than about two fifths of the names (a city of palaces is still more than its palaces)
    if (c.score < 10000 && (landmarks.length >= want || clash(c.L, 2.6) || (flatN[c.kind] != null && ++flatN[c.kind] > 6) || (kindN[c.kind] || 0) >= Math.max(8, want * .42))) { spare.push(c); continue; }
    kindN[c.kind] = (kindN[c.kind] || 0) + 1;
    if (landmarks.length < 8) c.L.major = true;
    landmarks.push(c.L);
  }
  const labelledN = landmarks.length;
  // every other tall building stands too, on its footprint, unnamed: this is what gives a modern city its skyline
  for (const c of lms.filter(c => c.kind === "tower" && c.L.top !== "stone" && c.L.pts && !landmarks.includes(c.L)).sort((a, b) => b.hM - a.hM).slice(0, 170)) { if (clash(c.L, 1.2)) continue; landmarks.push(Object.assign(c.L, { label: false })); }

  // ---- a site: its unnamed fixtures, then every surveyed building that is not already a landmark, as it stands
  let footprints;
  if (site) {
    for (const c of lms) if (!c.named && /^(watchtower|bunker|pad|gate|tank)$/.test(c.kind) && landmarks.length < 520 && !landmarks.some(q => Math.hypot(q.at[0] - c.L.at[0], q.at[1] - c.L.at[1]) < .8)) landmarks.push(c.L);
    const taken = new Set(lms.filter(c => landmarks.includes(c.L) && c.L.pts).map(c => c.el.type + c.el.id)), HB = { hut: 3.5, shed: 3.5, barracks: 5, garage: 3, roof: 3, hangar: 9, industrial: 8, warehouse: 8, church: 12, house: 7, residential: 8, apartments: 14, ruins: 1.5 };
    footprints = [];
    for (const el of els) {
      const t = el.tags; if (!t || !t.building || !el.geometry && el.type !== "relation" || taken.has(el.type + el.id)) continue;
      const rings = area(el, "outer").sort((a, b) => areaOf(b) - areaOf(a)); if (!rings.length) continue;
      const pts = simplifyRing(rings[0], .1), c = centroid(pts); if (pts.length < 3 || c[0] < X0 || c[0] > X1 || c[1] < Y0 || c[1] > Y1 || areaOf(pts) < .15) continue;
      const ruin = t.building === "ruins" || t.ruins === "yes" || t.ruins === "building" || t.abandoned === "yes" && t.historic === "ruins", h = num(t.height) || (num(t["building:levels"]) ? num(t["building:levels"]) * 3.2 + 1.5 : 0) || HB[t.building] || 5;
      const o = { pts, h: Math.max(.25, hu(ruin ? Math.min(h, 1.5) : h)) }; if (ruin) o.ruin = true; footprints.push([areaOf(pts), o]);
    }
    footprints = footprints.sort((a, b) => b[0] - a[0]).slice(0, 6000).map(q => q[1]);
  }

  // ---- how tall each quarter stands (a modern city only): from every building of five storeys or more
  let heights;
  if (era === "modern") {
    const cell = 16, cols = Math.ceil((X1 - X0) / cell), rows = Math.ceil((Y1 - Y0) / cell), bins = Array.from({ length: cols * rows }, () => []);
    for (const [p, h] of mids.concat(lms.filter(c => c.hM >= 15).map(c => [c.L.at, c.hM]))) { const i = Math.floor((p[0] - X0) / cell), j = Math.floor((p[1] - Y0) / cell); if (i >= 0 && j >= 0 && i < cols && j < rows) bins[j * cols + i].push(Math.min(h, 120)); }
    const v = bins.map(b => { if (b.length < 3) return 0; b.sort((x, y) => x - y); return Math.round(hu(b[Math.floor(b.length * .6)]) * 10) / 10; });
    if (v.some(Boolean)) heights = { cell, cols, rows, x0: X0, y0: Y0, v };
  }

  // ---- write it
  const cityName = flags.name && flags.name !== true ? String(flags.name) : city.name, old = era !== "modern", span = Math.round(40 * mpu / 10) * 10;
  let seed = 0; for (const ch of cityName) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const data = {
    real: true, look, region: region || undefined, seed: flags.seed && flags.seed !== true ? parseInt(flags.seed, 10) : seed % 100000,
    sheet: { w: SW, h: SH, margin: M },
    title: old ? `A Plan of ${cityName}` : cityName, subtitle: [city.state && city.state !== cityName ? city.state : "", city.country, year != null ? String(year) : ""].filter(Boolean).join(" · "),
    scaleLabel: "Scale", scaleTicks: [0, "", "", "", `${span} m`],
    credit: "Streets, water and landmarks © OpenStreetMap contributors", creditUrl: "https://www.openstreetmap.org/copyright",
    geo: { name: cityName, query: place, lat: lat0, lon: lon0, mpu, km, era, year, fetched: new Date().toISOString().slice(0, 10) },
    railHeight: .32, boats: rivers.length ? (old ? 26 : 10) : 0,
    districts, roads, rivers, basins, parks, open: open.slice(0, 140).map(o => ({ kind: o.kind, pts: o.pts })), plazas: plazas.slice(0, 80).map(p => ({ name: p.area > 20 ? p.name : "", pts: p.pts })),
    rails, walls, landmarks, heights
  };
  if (site) Object.assign(data, { fill: false, footprints, ground: flags.ground && flags.ground !== true ? String(flags.ground) : region === "desert" ? "sand" : "grass", boats: 0 });
  const file = writeCity(dir, data, [
    `${cityName}: a real city, fetched from OpenStreetMap by: atlas.js city "${place}"${year != null ? " --year " + year : " --era " + era} --km ${km}${flags.around && flags.around !== true ? ` --around "${flags.around}"` : ""}`,
    "Streets, water and landmarks (c) OpenStreetMap contributors, Open Database Licence. The map credits them; leave the credit in.",
    "This file is rewritten whenever the city is fetched again. Put your own changes in campaign.js:",
    '  ATLAS.cityEdit(c => { c.title = "..."; c.landmarks.find(l => l.name === "...").top = "dome"; c.landmarks.push({ name, kind, at: [x, y], h }); });'
  ]);

  log(`\nwrote ${path.relative(process.cwd(), file) || file}: ${cityName}, ${era}${year != null ? " (" + year + ")" : ""}${region ? ", " + region : ""}`);
  log(`  ${roads.length} streets (${roads.filter(r => r[0]).length} named${thinned ? "; " + thinned + ": use a smaller --km for every street" : ""}) · ${rivers.length} rivers and canals · ${basins.length} waters · ${parks.length} parks · ${plazas.length} squares · ${rails.length} railways · ${walls.length} walls · ${Object.keys(districts).length} districts`);
  if (site) log(`  ${footprints.length} surveyed buildings standing as they are; nothing is grown (ground: ${data.ground})`);
  log(`  ${labelledN} landmarks named on the map${landmarks.length > labelledN ? `, and ${landmarks.length - labelledN} more standing unnamed (${site ? "watchtowers, gates, bunkers and the like" : "tall buildings"})` : ""}:`);
  for (const L of landmarks.slice(0, labelledN)) log(`    ${(L.major ? "* " : "  ") + L.name.padEnd(42).slice(0, 42)} ${(L.kind + (L.top ? "/" + L.top : "")).padEnd(15)} at [${L.at[0].toFixed(0)}, ${L.at[1].toFixed(0)}]${L.h ? "  " + Math.round(L.h * mpu) + " m as drawn" : ""}`);
  if (spare.length) log(`  not placed (raise --landmarks, or add by hand): ${spare.slice(0, 24).map(c => c.L.name).join("; ")}${spare.length > 24 ? "; ..." : ""}`);
  log(`\nCheck the landmarks against what you know of ${cityName}: add any famous one that is missing, and correct a kind or roof that is wrong, with ATLAS.cityEdit in campaign.js.\nTo stand one of the campaign's places on a real spot:  node atlas.js locate <campaign> "an address or a name"`);
  return data;
}

// where a real address or named thing falls on the sheet of a city already fetched
async function locate(dir, geo, what, log) {
  log = log || console.log;
  if (!geo || !Number.isFinite(geo.lat)) throw new Error("this campaign's city was not fetched from a real one, so there is nothing to measure against");
  const SW = 320, SH = 200, KX = Math.cos(geo.lat * Math.PI / 180) * 111320, KY = 110540, mpu = geo.mpu;
  const dLat = 150 * mpu / KY, dLon = 220 * mpu / KX;
  let hits = await geocode(what, `&viewbox=${geo.lon - dLon},${geo.lat + dLat},${geo.lon + dLon},${geo.lat - dLat}&bounded=1`);
  if (!hits.length) { await sleep(1100); hits = await geocode(`${what}, ${geo.query || geo.name}`); }
  if (!hits.length) { log(`nothing called "${what}" was found in or near ${geo.name}`); return []; }
  return hits.map(h => {
    const x = SW / 2 + (h.lon - geo.lon) * KX / mpu, y = SH / 2 - (h.lat - geo.lat) * KY / mpu, on = x >= 0 && x <= SW && y >= 0 && y <= SH;
    log(`${on ? "at: [" + x.toFixed(1) + ", " + y.toFixed(1) + "]" : "off the sheet (" + x.toFixed(0) + ", " + y.toFixed(0) + ")"}   ${h.display}`);
    return { x, y, on, display: h.display };
  });
}

module.exports = { importCity, locate };
