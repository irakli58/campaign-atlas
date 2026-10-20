#!/usr/bin/env node
/* Campaign Atlas command line. No dependencies; needs Node 18 or newer.

   node atlas.js init <dir> [--title "Name"]     start a campaign folder from the template
   node atlas.js check <dir> [place ...]         check maps, guides, player safety and the clue trail
   node atlas.js ascii <dir> <place> [floor] [--level N]   draw a floor as text
   node atlas.js dump <dir> <place ...>          print a place's rooms, clues, people (for writing guides)
   node atlas.js status <dir> [--json]           progress table; also writes <dir>/checklist.md (--json: prints it, writes nothing)
   node atlas.js build <dir>                     write dist/<slug>.html (to publish) and dist/preview.html (to open)
   node atlas.js export <dir> [place ...]        write every floor as SVG files to dist/maps/
   node atlas.js catalogue [<dir>]               list floor kinds, items and furnishing presets (and dist/catalogue.html)

   The city map (writes <dir>/city.js):
   node atlas.js city <dir> "Florence, Italy" [--year 1478 | --era medieval|industrial|modern|fantasy|future] [--km 2]
                      [--around "Ponte Vecchio"] [--landmarks 36] [--must "Bargello; Uffizi"] [--lang local|en|xx] [--region ...] [--refresh]
                      [--buildings] [--ground grass|sand|dirt|snow|concrete]
                                                 a REAL city: its true streets, water, parks and landmarks
   node atlas.js city <dir> --invent "Saltreach" [--year 1350 | --era ...] [--site river|coast|harbour|lake|plain]
                      [--culture english|american|french|italian|spanish|german|arabic|japanese|fantasy]
                      [--plan organic|grid] [--size town|city|metropolis] [--region ...] [--seed N]
                                                 an INVENTED city, laid out for its age and its part of the world
   node atlas.js city <dir> --invent "Name" --kind camp|base [--year 1943 | --era ...] [--town] [--ruin 0.5]
                                                 an invented camp or military base
   node atlas.js city <dir> --invent "Name" --kind moonbase|outpost|colony|station [--year 2291]
                                                 the FUTURE: modules, domes, tubes and pads on a moon, or a ring in orbit
   node atlas.js locate <dir> "an address or a name"   where a real spot falls on the sheet of a fetched city
   node atlas.js kit list [<dir>] · kit use <dir> <kit> [--force] · kit save <dir> [name] [--force]
                                                 KITS: buildings made for one place (references/cities.md, "Kits")
   node atlas.js city <dir> ... --id <id>        another city of the campaign (cities/<id>.js), for its world map

   The world map (world.js, by hand; world-terrain.js, by the command):
   node atlas.js world <dir> [--look parchment|atlas|stars] [--land continent|islands|coast|inland] [--size small|medium|large]
                      [--seed N] [--across "600 miles"] [--names none] [--replace]
                                                 an INVENTED land under world.js, and where its locations stand (references/world.md);
                                                 starts a world.js from the campaign's cities when there is none
   node atlas.js world <dir> --drawing <picture> [--look ...]
                                                 a map the game master DREW: the picture under the world map, its coasts traced
   node atlas.js world <dir> --real "England" [--km 800] [--unit mile|km] [--look ...]
                                                 the REAL world: true coasts, lakes, rivers, seas and mountains; places found by name
*/
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), ENGINE = path.join(ROOT, "engine");
const argv = process.argv.slice(2), cmd = argv[0];
const flags = {}, pos = [];
for (let i = 1; i < argv.length; i++) { const a = argv[i]; if (a.startsWith("--")) { const k = a.slice(2); if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") && ["title", "level", "year", "era", "km", "around", "center", "landmarks", "must", "lang", "region", "seed", "ground", "kind", "name", "ruin", "invent", "site", "culture", "plan", "size", "id", "look", "land", "across", "names", "drawing", "real", "unit"].includes(k)) flags[k] = argv[++i]; else flags[k] = true; } else pos.push(a); }
const die = m => { console.error(m); process.exit(2); };
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "atlas";

function sources(dir) {
  const c = path.join(dir, "campaign.js"); if (!fs.existsSync(c)) die(`No campaign.js in ${dir}. Start one with: node atlas.js init ${dir}`);
  const pd = path.join(dir, "places"), files = [c];
  if (fs.existsSync(path.join(dir, "city.js"))) files.push(path.join(dir, "city.js"));     // a city fetched or generated for the campaign
  const cd = path.join(dir, "cities");                                                       // its other cities, each with its own id
  if (fs.existsSync(cd)) for (const f of fs.readdirSync(cd).filter(f => f.endsWith(".js") && !f.startsWith("_")).sort()) files.push(path.join(cd, f));
  if (fs.existsSync(path.join(dir, "kit.js"))) files.push(path.join(dir, "kit.js"));       // buildings made for this place (ATLAS.kit)
  for (const f of ["world.js", "world-terrain.js"]) if (fs.existsSync(path.join(dir, f))) files.push(path.join(dir, f));   // the world map
  if (fs.existsSync(pd)) for (const f of fs.readdirSync(pd).filter(f => f.endsWith(".js") && !f.startsWith("_")).sort()) files.push(path.join(pd, f));
  return files;
}
const hasWorld = dir => fs.existsSync(path.join(dir, "world.js"));
function load(dir) {
  if (!dir) die("Which campaign folder?");
  delete require.cache[require.resolve(path.join(ENGINE, "atlas-engine.js"))];
  const A = require(path.join(ENGINE, "atlas-engine.js"));
  new Function("ATLAS", fs.readFileSync(path.join(ENGINE, "atlas-city.js"), "utf8"))(A);   // gives campaigns ATLAS.city(); loading it needs no browser
  new Function("ATLAS", fs.readFileSync(path.join(ENGINE, "atlas-music.js"), "utf8"))(A);  // the lists of moods and flavours, for the checker
  new Function("ATLAS", fs.readFileSync(path.join(ENGINE, "atlas-world.js"), "utf8"))(A);  // gives campaigns ATLAS.world()
  for (const f of sources(dir)) { try { new Function("ATLAS", fs.readFileSync(f, "utf8"))(A); } catch (e) { die(`${path.relative(dir, f)}: ${e.message}`); } }
  Object.defineProperty(A, "__dir", { value: dir });
  return A;
}
const mapped = A => A.order.filter(id => A.maps[id] && !A.maps[id].alias);
// The standard a place is held to, by how much the story depends on it (references/standards.md).
// A campaign may change any number: standards: { 1: { rooms: 24 } } in campaign.js.
const STANDARDS = {
  1: { rooms: 30, floors: 3, secrets: 2, clues: 5, people: 3, encounters: 2, inbound: 2 },
  2: { rooms: 12, floors: 2, secrets: 0, clues: 3, people: 2, encounters: 1, inbound: 2 },
  3: { rooms: 6, floors: 1, secrets: 0, clues: 1, people: 1, encounters: 0, inbound: 1 }
};
const standardFor = (A, tier) => Object.assign({}, STANDARDS[tier] || STANDARDS[3], (A.config.standards || {})[tier] || {});
const has = v => typeof v === "string" && v.replace(/[.\s]/g, "").length > 2;   // "..." and blanks are not answers

/* ---------------------------------------------------------------- check */
function gridOf(A, F, publicOnly) {
  const own = Array.from({ length: F.h }, () => Array(F.w).fill(null));
  for (const r of F.R) { const [rid, x, y, w, h, , kind, o = {}] = r; if (publicOnly && o.h) continue; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < F.h && i >= 0 && i < F.w) own[j][i] = { rid, kind, o }; }
  return own;
}
// rooms that can be walked to from the way in. publicOnly: without secret doors, hidden rooms or GM-only floors.
function reach(A, M, publicOnly) {
  const nodes = new Map(), link = (a, b) => { if (!a || !b) return; if (!nodes.has(a)) nodes.set(a, new Set()); if (!nodes.has(b)) nodes.set(b, new Set()); nodes.get(a).add(b); nodes.get(b).add(a); };
  const starts = [], stairRooms = {}, entry = new Set(M.entry || []);
  M.floors.forEach((F, fi) => {
    if (publicOnly && A.isGmFloor(F)) return;
    const own = gridOf(A, F, publicOnly), key = c => c ? fi + "/" + c.rid : null;
    for (let j = 0; j < F.h; j++) for (let i = 0; i < F.w; i++) {
      const c = own[j][i]; if (!c) continue; const k = key(c); if (!nodes.has(k)) nodes.set(k, new Set());
      if (A.isOut(c.kind) || entry.has(c.rid)) starts.push(k);
      for (const [di, dj] of [[1, 0], [0, 1]]) { const d = own[j + dj] && own[j + dj][i + di]; if (d && d.rid !== c.rid && A.isOut(c.kind) && A.isOut(d.kind)) link(k, key(d)); }
    }
    for (const [x, y, o, type = "d", len = 1] of (F.D || [])) {
      if (type === "w" || (publicOnly && type === "s")) continue;
      for (let t = 0; t < len; t++) { const a = o === "h" ? (own[y - 1] || [])[x + t] : (own[y + t] || [])[x - 1], b = o === "h" ? (own[y] || [])[x + t] : (own[y + t] || [])[x]; if (a && b) link(key(a), key(b)); }
    }
    for (const st of (F.ST || [])) { const sy = Math.floor(st[2] + st[4] / 2 - .01), sx = Math.floor(st[1] + st[3] / 2 - .01), c = own[sy] && own[sy][sx]; if (c) (stairRooms[st[0]] = stairRooms[st[0]] || []).push(key(c)); }
  });
  for (const k in stairRooms) { const l = stairRooms[k]; for (let i = 1; i < l.length; i++) link(l[0], l[i]); }
  const seen = new Set(starts), q = [...starts];
  while (q.length) { const k = q.pop(); for (const n of nodes.get(k) || []) if (!seen.has(n)) { seen.add(n); q.push(n); } }
  return { all: [...nodes.keys()], seen, starts };
}
function checkMap(A, id, level, P, N) {
  const M = A.get(id, level), DOORS = new Set(["d", "dd", "a", "g", "s", "w"]), MK = A.markers();
  const names = M.floors.map(F => F.n);
  names.forEach((n, i) => { if (!n) P(`floor ${i} has no name`); else if (names.indexOf(n) !== i) P(`two floors are both called "${n}"`); });
  const roomIds = new Set(), allIds = new Set(), named = new Set();
  M.floors.forEach(F => F.R.forEach(r => { allIds.add(r[0]); if (A.isRoom(r[0])) { roomIds.add(r[0]); if (r[5]) named.add(r[0]); } }));
  for (const rid of roomIds) if (!named.has(rid) && !A.roomEntry(M, A.guides[A.keyOf(id)], rid).n) P(`${rid} has no name on the map`);
  const marked = new Set();
  M.floors.forEach((F, fi) => {
    const fl = `"${F.n}"`;
    if (!(F.w > 0 && F.h > 0)) return P(`floor ${fl} needs a width and height`);
    for (const r of F.R) {
      const [rid, x, y, w, h, name, kind, o = {}] = r;
      if (![x, y, w, h].every(Number.isInteger)) P(`${fl} ${rid}: position and size must be whole squares (${x},${y},${w},${h})`);
      if (x < 0 || y < 0 || x + w > F.w || y + h > F.h) P(`${fl} ${rid} is out of bounds (${x},${y},${w},${h}) on a ${F.w}x${F.h} floor`);
      if (!kind) P(`${fl} ${rid} has no floor kind`); else if (!A.kindOf(kind)) P(`${fl} ${rid}: unknown floor kind "${kind}" (see: atlas.js catalogue)`);
      if (name && A.isRoom(rid) && A.isIndoorKind(kind) && !o.l && name.length * 3.7 > Math.max(w, h) * 24 * .96) P(`${fl} label "${name}" is too long for ${rid} (${w}x${h}): shorten it or make the room bigger`);
      if (o.fx && !A.FX[o.fx]) P(`${fl} ${rid}: unknown furnishing preset "${o.fx}"`);
    }
    const own = gridOf(A, F);
    for (const [x, y, o, type = "d", len = 1] of (F.D || [])) {
      if (o !== "h" && o !== "v") { P(`${fl} door ${x},${y}: direction must be "h" or "v"`); continue; }
      if (!DOORS.has(type)) P(`${fl} door ${x},${y},${o}: unknown type "${type}"`);
      for (let t = 0; t < len; t++) {
        const a = o === "h" ? (own[y - 1] || [])[x + t] : (own[y + t] || [])[x - 1], b = o === "h" ? (own[y] || [])[x + t] : (own[y + t] || [])[x];
        if (!a && !b) P(`${fl} door ${x},${y},${o} is between nothing`);
        else if (a && b && a.rid === b.rid) P(`${fl} door ${x},${y},${o} is inside one room (${a.rid})`);
        else if (type !== "g" && type !== "w" && !A.isIndoorKind(a && a.kind) && !A.isIndoorKind(b && b.kind)) P(`${fl} door ${x},${y},${o} is between two open or empty areas (open ground needs no door)`);
      }
    }
    for (const it of (F.I || [])) {
      if (!A.itemFn(it[0])) P(`${fl} unknown item "${it[0]}" (see: atlas.js catalogue; or declare it in config.items)`);
      if (it[1] < -.5 || it[2] < -.5 || it[1] + (it[3] || 1) > F.w + .5 || it[2] + (it[4] || 1) > F.h + .5) P(`${fl} item ${it[0]} is out of bounds at ${it[1]},${it[2]}`);
    }
    for (const st of (F.ST || [])) {
      const c = (own[Math.floor(st[2] + st[4] / 2 - .01)] || [])[Math.floor(st[1] + st[3] / 2 - .01)];
      if (!c || A.isSolid(c.kind)) P(`${fl} stair ${st[0]} is not inside a room or on open ground`);
      if (st[5] !== "up" && st[5] !== "down") P(`${fl} stair ${st[0]} must say "up" or "down"`);
      const others = M.floors.filter((G, gi) => gi !== fi && (G.ST || []).some(t => t[0] === st[0]));
      if (!others.length) P(`${fl} stair ${st[0]} appears on this floor only: add its other end`);
      else if (!others.some(G => G.n === st[6])) P(`${fl} stair ${st[0]} says it goes to "${st[6]}", but its other end is on "${others[0].n}"`);
    }
    for (const [mid, x, y] of (F.M || [])) {
      marked.add(mid);
      if (!MK[mid[0]]) P(`${fl} marker ${mid}: unknown letter (declare it in config.markers)`);
      const d = A.dirOf(mid), e = (M[d] || {})[mid];
      if (!e) { P(`${fl} marker ${mid} has no entry in ${d}`); continue; }
      const c = (own[Math.floor(y)] || [])[Math.floor(x)];
      if (!c) P(`${fl} marker ${mid} is drawn outside every room`);
      else if (e.at && c.rid !== e.at) P(`${fl} marker ${mid} is drawn in ${c.rid} but its entry says it is at ${e.at}`);
    }
  });
  for (const d of ["clues", "npcs", "secrets", "enc"]) for (const [k, v] of Object.entries(M[d] || {})) {
    if (!v.at) P(`${k} has no "at" (which room it is in)`); else if (!allIds.has(v.at)) P(`${k} is at ${v.at}, which is not on the map`);
    if (!marked.has(k)) N(`${k} has no marker on the map`);
    if (d !== "npcs" && !v.t) P(`${k} has no title (t)`);
    if (d === "npcs" && !v.n && !(v.who && (A.castData || {})[v.who])) P(`${k} has no name (n)`);
    for (const t of [].concat(v.to || [])) if (!A.meta[t]) P(`${k} leads to "${t}", which is not a place in this campaign`);
    if (d === "clues") { if (!has(v.d)) P(`${k} needs a description (d)`); if (!has(v.how)) P(`${k} needs how it is found (how)`); if (!has(v.rev)) P(`${k} needs what it reveals (rev)`);
      // a clue that leads somewhere must not be able to stall the game: the GM needs a way to give it when it is missed
      if (v.to && !has(v.hint)) { if ((A.meta[id].tier || 3) <= 1) P(`${k} leads on, so it needs a hint for when the players miss it (hint)`); else N(`${k} leads on but has no hint for when it is missed (hint)`); } }
    if (d === "npcs") { const w = v.who ? (A.castData || {})[v.who] : null; if (v.who && !w) P(`${k} says who: "${v.who}", but the cast has nobody of that name (ATLAS.cast in campaign.js)`); if (w && !v.n) v.n = w.n; if (!has(v.look) && !(w && has(w.look))) P(`${k} needs a description of the person (look), or who: "..." naming one of the cast`); }
    if (d === "secrets") { if (!has(v.acc)) P(`${k} needs how it is opened (acc)`); if (!has(v.dest)) P(`${k} needs where it leads (dest)`); }
    if (d === "enc" && !has(v.d)) P(`${k} needs what happens (d)`);
    if (d === "npcs" && !has(v.knows) && !has(v.doing)) N(`${k} has neither what they are doing nor what they know`);
    // every person is a person, in every place however small: a story, a way of acting, and the people they know (the
    // user asked for all of it for "every character", 15 Oct 2026)
    if (d === "npcs" && !v.who) {
      const lack = PERSON.filter(f => f !== "look" && !has(f === "ties" ? tieText(v.ties) : v[f]));   // look: checked above
      if (lack.length) P(`${k} (${String(v.n || "").split(",")[0] || "a person"}) lacks ${lack.map(f => PERSON_SAYS[f]).join(", ")}`);
    }
    if (d === "npcs") for (const t of strayTies(A, v.ties)) N(`${k}'s ties name "${t}", who is not in the cast: use a cast id, or write the name out in full`);
  }
  // can every room be reached?
  const full = reach(A, M, false), pub = reach(A, M, true);
  if (!full.starts.length) P(`there is no way in: add open ground (a street, a yard) or list the entrance rooms in map.entry`);
  else for (const k of full.all) {
    const [fi, rid] = k.split("/"), F = M.floors[fi], r = F.R.find(x => x[0] === rid);
    if (!r || !A.isIndoorKind(r[6])) continue;
    const hidden = (r[7] && r[7].h) || A.isGmFloor(F);
    if (!full.seen.has(k)) P(`"${F.n}" ${rid} "${r[5] || ""}" cannot be reached: it has no door, opening or stair${hidden ? " (a hidden room still needs a secret door)" : ""}`);
    else if (!hidden && !pub.seen.has(k)) N(`"${F.n}" ${rid} "${r[5] || ""}" can only be reached by a secret way but is drawn on the players' map: mark it hidden ({ h: 1 }) unless that is intended`);
  }
  // nothing secret on the players' map
  M.floors.forEach((F, fi) => {
    let pv, gv;
    try { gv = A.svg(id, fi, "gm", "t", level); pv = A.svg(id, fi, "player", "t", level); } catch (e) { return P(`"${F.n}" cannot be drawn: ${e.message}`); }
    for (const tag of gv.match(/<[a-z]+\s[^<>]*>/g) || []) { const n = [...tag.matchAll(/\s([\w:-]+)="/g)].map(a => a[1]); if (new Set(n).size !== n.length) { P(`"${F.n}": the drawing repeats an attribute (${tag.slice(0, 60)}...), so the exported SVG would not open`); break; } }
    if (A.isGmFloor(F)) return;
    if (pv.includes('class="lm-mk"')) P(`"${F.n}": markers show on the players' map`);
    if (pv.includes('stroke="#6a3f9e"')) P(`"${F.n}": a secret door shows on the players' map`);
    const pubNames = new Set(F.R.filter(r => !(r[7] && r[7].h)).map(r => r[5]));
    for (const r of F.R) if (r[7] && r[7].h && r[5] && !pubNames.has(r[5]) && pv.includes(">" + A.esc(r[5]) + "<")) P(`"${F.n}": hidden room "${r[5]}" is named on the players' map`);
  });
  try { A.ref(id, level); } catch (e) { P(`the guide cannot be drawn: ${e.message}`); }
  return M;
}
function checkGuide(A, id, P, N) {
  const key = A.keyOf(id), G = A.guides[key] || {}, M = A.get(id, 99), m = A.meta[id];
  if (!m.name) P("the place has no name");
  if (!M.ov) P("no overview (map.ov): what this place is and why it matters");
  if (!has(M.ext)) P("no exterior description to read aloud (map.ext)");
  const onMap = new Set(), floorNames = new Set(M.floors.map(F => F.n)), hiddenRooms = new Set();
  for (const F of M.floors) for (const r of F.R) if (A.isRoom(r[0])) { onMap.add(r[0]); if ((r[7] && r[7].h) || A.isGmFloor(F)) hiddenRooms.add(r[0]); }
  for (const rid of Object.keys(G.rooms || {})) if (!onMap.has(rid)) P(`the guide describes ${rid}, which is not on the map`);
  for (const rid of Object.keys(M.rooms || {})) if (A.isRoom(rid) && !onMap.has(rid)) P(`the room list describes ${rid}, which is not on the map`);
  for (const fn of Object.keys(G.floors || {})) if (!floorNames.has(fn)) P(`floor note for "${fn}" matches no floor (names must match exactly)`);
  for (const F of M.floors) if (!F.note && !(G.floors || {})[F.n]) P(`floor "${F.n}" has no floor note`);
  const need = ["d", "pur", "obj", "chk", "atm", "kp"], missing = [], used = { clues: new Set(), npcs: new Set(), secrets: new Set(), enc: new Set() };
  for (const d in used) for (const v of Object.values(M[d] || {})) used[d].add(v.at);
  let quiet = 0;
  for (const rid of [...onMap].sort((a, b) => +a.slice(1) - +b.slice(1))) {
    const r = A.roomEntry(M, G, rid), miss = need.filter(x => x === "kp" ? !has(r.kp) && !has(r.inv) : !has(r[x]));
    if (miss.length) missing.push(`${rid}(${miss.join(",")})`);
    const nothing = /^(none|nothing)\b/i.test(String(r.chk || "").trim()) && !["clues", "npcs", "secrets", "enc"].some(d => used[d].has(rid)) && !r.cl && !r.sec && !r.dz && !r.who;
    if (nothing) quiet++;
    if (!hiddenRooms.has(rid)) for (const fld of ["d", "pur", "atm"]) { const mm = String(r[fld] || "").match(/\b[CSEK]\d+\b/); if (mm) N(`${rid}.${fld} is shown to players but mentions ${mm[0]}`); }
  }
  if (missing.length) P(`${missing.length} room${missing.length > 1 ? "s" : ""} incomplete: ${missing.slice(0, 14).join(" ")}${missing.length > 14 ? " ..." : ""}`);
  if (onMap.size >= 6 && quiet / onMap.size > .4) N(`${quiet} of ${onMap.size} rooms have nothing to find, meet or do: give them a purpose or cut them`);
  return { rooms: onMap.size, done: onMap.size - missing.length };
}
// is the place as big and as full as its importance calls for?
function checkStandard(A, id, P) {
  const m = A.meta[id], M = A.get(id, 99);
  if (![1, 2, 3].includes(m.tier)) return P("no tier: say how much the story depends on this place (tier: 1 the story cannot run without it, 2 the trail passes through it, 3 colour)");
  const S = standardFor(A, m.tier), rooms = new Set();
  M.floors.forEach(F => F.R.forEach(r => { if (A.isRoom(r[0])) rooms.add(r[0]); }));
  const have = { rooms: rooms.size, floors: M.floors.length, secrets: Object.keys(M.secrets || {}).length, clues: Object.keys(M.clues || {}).length, people: Object.keys(M.npcs || {}).length, encounters: Object.keys(M.enc || {}).length };
  const short = Object.keys(have).filter(k => have[k] < S[k]).map(k => `${have[k]} ${k} (the standard is ${S[k]})`);
  if (short.length) P(`too small for a tier ${m.tier} place: ${short.join(", ")}`);
}
// a city map of the campaign (the main one, or rid: one of cities/): is every place on it, and does it build?
function checkCity(A, rid) {
  const out = [], K = A.cityKit, raw = rid && A.cities ? A.cities[rid] : A.cityData; let problems = 0, notes = 0;
  const me = raw.id || "main", main = raw === A.cityData, mine = id => (A.placeCity ? A.placeCity(id) : "main") === me, label = main ? "city map" : `city map "${me}"`;
  const P = m => { out.push("   ! " + m); problems++; }, N = m => { out.push("   - " + m); notes++; };
  if (!raw.sheet || !(raw.sheet.w > 0) || !(raw.sheet.h > 0)) N("no sheet size given (sheet: { w, h }): using 320 by 200");
  if (!(raw.roads || []).length && !(raw.walls || []).some(w => w.kind === "tube")) P("the city has no roads: give at least its main streets (a station may have its tubes instead)");
  (raw.roads || []).slice(0, 4000).forEach((r, i) => { if (!Array.isArray(r) || typeof r[0] !== "string" || ![0, 1, 2, 3].includes(r[1]) || !Array.isArray(r[2]) || r[2].length < 2) P(`road ${i + 1}${r && r[0] ? ` (${r[0]})` : ""} must be [name, class 0 to 3, [[x, y], [x, y], ...]]`); });
  for (const r of raw.rivers || []) if (!(r.hw > 0) || !Array.isArray(r.pts) || r.pts.length < 2) P(`river "${r.label || r.name || "?"}" needs its points (pts) and a half-width (hw)`);
  if (typeof raw.look === "string" && !K.LOOKS[raw.look]) P(`unknown look "${raw.look}": use "medieval", "industrial" (the same as "old"), "modern" or "scifi"`);
  if (raw.look && typeof raw.look === "object" && raw.look.base && !K.LOOKS[raw.look.base]) P(`unknown look base "${raw.look.base}"`);
  if (raw.region && !K.REGIONS[raw.region]) N(`unknown region "${raw.region}" (known: ${Object.keys(K.REGIONS).join(", ")}): the colours of the temperate north are used`);
  (raw.landmarks || []).forEach((l, i) => {
    if (!l || !Array.isArray(l.at) || l.at.length !== 2) P(`landmark ${i + 1}${l && l.name ? ` (${l.name})` : ""} needs at: [x, y]`);
    else if (l.kind && !K.LM_SIZE[l.kind]) P(`landmark "${l.name || i + 1}" has unknown kind "${l.kind}" (known: ${K.LM_KINDS.join(", ")})`);
    else if (l.pts && (!Array.isArray(l.pts) || l.pts.length < 3)) P(`landmark "${l.name || i + 1}": a footprint (pts) needs at least three corners`);
  });
  (raw.rows || []).forEach((r, i) => { if (!r || !Array.isArray(r.at) || r.at.length !== 2) P(`rows ${i + 1} needs at: [x, y] (the centre of its first hut)`); else if (r.roof && !["pitched", "flat", "barrel", "tent", "module"].includes(r.roof)) P(`rows ${i + 1}: unknown roof "${r.roof}" (pitched, flat, barrel, tent or module)`); });
  (raw.walls || []).forEach((w, i) => { if (!w || !Array.isArray(w.pts) || w.pts.length < 2) P(`walls ${i + 1} needs at least two points (pts)`); else if (w.kind && !["wall", "fence", "hesco", "tube"].includes(w.kind)) P(`walls ${i + 1}: unknown kind "${w.kind}" (wall, fence, hesco or tube)`); });
  if (raw.ground && !K.GROUNDS[raw.ground]) N(`unknown ground "${raw.ground}" (${Object.keys(K.GROUNDS).join(", ")})`);
  for (const k of ["basins", "parks", "plazas", "open"]) (raw[k] || []).forEach((b, i) => { if (!b || !Array.isArray(b.pts) || b.pts.length < 3) P(`${k} ${i + 1}${b && b.name ? ` (${b.name})` : ""} needs at least three points (pts)`); });
  if (problems) return { line: label, out, problems, notes };
  const D = K.prepare(raw), PL = K.cityPlaces(D), w = D.sheet.w, h = D.sheet.h, KIT = K.kit();
  for (const id of A.order) { const m = A.meta[id], mdl = Array.isArray(m.model) ? m.model[0] : m.model; if (!mine(id)) continue; if (!m.offmap && mdl && !K.MODEL_SIZE[mdl] && !KIT.models[mdl]) N(`${id}: unknown model "${mdl}", so it will stand as a house (see: atlas.js catalogue, or the kit's models)`); }
  // a kit (buildings made for this place): every part a known shape with numbers for its place and size, every
  // landmark it dresses on the map, every dress a known kind
  for (const [nm, mo] of Object.entries(KIT.models)) {
    if (!mo || !Array.isArray(mo.parts) || !mo.parts.length) { P(`kit model "${nm}" has no parts`); continue; }
    if (mo.parts.length > 800) N(`kit model "${nm}" has ${mo.parts.length} parts: a few dozen are usually enough, and many slow the page`);
    mo.parts.forEach((p, i) => {
      if (!Array.isArray(p) || !K.KIT_SHAPES.includes(p[0])) P(`kit model "${nm}", part ${i + 1}: unknown shape "${Array.isArray(p) ? p[0] : p}" (${K.KIT_SHAPES.join(", ")})`);
      else if (p.slice(2, 9).some(v => v != null && !Number.isFinite(v))) P(`kit model "${nm}", part ${i + 1}: its place, size and turn must be numbers`);
      else if ([p[5], p[6], p[7]].some(v => v != null && v <= 0)) P(`kit model "${nm}", part ${i + 1}: a size of nothing or less`);
    });
  }
  const lmNames = new Set((raw.landmarks || []).map(l => String(l.name)));
  for (const [lmName, mdl] of Object.entries(KIT.landmarks)) {
    if (!KIT.models[mdl]) P(`the kit dresses "${lmName}" as "${mdl}", which is none of its models`);
    else if (!lmNames.has(lmName)) N(`the kit has a model for "${lmName}", but the map has no landmark of that name (see the list in city.js), so it is not used`);
  }
  for (const d of KIT.dress) if (!K.KIT_DRESS.includes(d.kind)) P(`kit dress: unknown kind "${d.kind}" (${K.KIT_DRESS.join(", ")})`);
  for (const id of A.order) { const m = A.meta[id]; if (mine(id) && m.landmark && !(raw.landmarks || []).some(l => String(l.name).toLowerCase() === String(m.landmark).toLowerCase())) P(`${id} says it is the landmark "${m.landmark}", but the city has none of that name (see the list in city.js)`); }
  // The buildings fit the age, and the map fits the story: the future's own models on a map of the future and none of
  // them on an older one, and a story in space drawn as the future (the user caught a moon station built of 1888's
  // houses on a desert base, 15 Oct 2026: "you used 1888 house models for a moon base").
  const lookName = typeof raw.look === "string" ? raw.look : raw.look && raw.look.base, future = lookName === "scifi" || lookName === "future";
  for (const id of A.order) {
    const m = A.meta[id], mdl = Array.isArray(m.model) ? m.model[0] : m.model; if (!mine(id) || !mdl || m.offmap || !K.MODEL_SIZE[mdl]) continue;
    const fut = K.FUTURE_MODELS.includes(mdl);
    if (future && !fut) P(`${id} wears "${mdl}", a building of the past, on a map of the future: give it one of ${K.FUTURE_MODELS.join(", ")}, or no model (one is chosen from the place's name)`);
    else if (!future && fut) P(`${id} wears "${mdl}", a building of the future, on a ${lookName || "old"} map`);
    // fantasy's buildings belong to fantasy's map (or a medieval one, at a pinch)
    else if (K.FANTASY_MODELS.includes(mdl) && !["fantasy", "medieval"].includes(lookName)) N(`${id} wears "${mdl}", a fantasy building, on a ${lookName || "old"} map`);
  }
  if (main) {
    const cfg = A.config || {}, said = [cfg.setting, cfg.system, cfg.subtitle, cfg.strap, cfg.title].filter(x => typeof x === "string").join(" · ");
    const space = said.toLowerCase().match(/\b(space ?station|spaceship|starship|in orbit|orbital|orbiting|moon ?base|lunar|martian|asteroid|colony ship|mothership|starfinder|stars without number|2[2-9]\d\d)\b/);
    if (!future && space) P(`the story is set in space or in the future ("${space[0]}" in the campaign's setting), but the map is ${lookName || "old"}: make it with city --invent "Name" --kind moonbase, outpost, colony or station, so it is built of the future's modules, domes and tubes, not houses`);
    // a story of swords and sorcery on a map that is not fantasy's (a medieval map is let be: it may be meant)
    const magic = said.toLowerCase().match(/\b(dungeons (&|and) dragons|d&d|pathfinder|dragonbane|warhammer fantasy|the one ring|shadowdark|old-school essentials|wizards?|sorcer\w*|elves|elven|dwarves|dragons?|kingdom of)\b/);
    if (!future && magic && !["fantasy", "medieval"].includes(lookName) && !D.real) N(`the story looks like fantasy ("${magic[0]}" in the campaign's setting), but the map is ${lookName || "old"}: an invented fantasy city is city --invent "Name" --era fantasy (taverns, wizards' towers, temples and keeps)`);
  }
  for (const e of PL) {
    if (e.x == null) P(`${e.id} has no position on the city map: give it at: [x, y], or a region that is one of the city's districts (or offmap: true)`);
    else if (e.x < 0 || e.x > w || e.y < 0 || e.y > h) P(`${e.id} stands at ${e.x.toFixed(0)}, ${e.y.toFixed(0)}, outside the sheet (0 to ${w} by 0 to ${h})`);
  }
  const placed = PL.filter(e => e.x != null);
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) { const a = placed[i], b = placed[j]; if (Math.hypot(a.x - b.x, a.y - b.y) < a.lr + b.lr) N(`${a.id} and ${b.id} stand on top of each other on the city map`); }
  let line = label;
  if (!problems) try {
    const c = K.buildCity(D, placed), pl = K.plan();
    // nothing stands off the paper (the sheet and its margin): the engine leaves such things out, and this guards that it
    // still does whatever is added to it (the user saw trees standing on the table, 14 Oct 2026)
    const ON = (x, y) => x >= pl.X0 && x <= pl.X1 && y >= pl.Y0 && y <= pl.Y1, allOn = pts => pts.every(p => ON(p[0], p[1]));
    const offs = { trees: c.trees.filter(t => !ON(t[0], t[1])).length, houses: c.buildings.filter(b => !ON(b.x, b.y)).length, huts: (c.huts || []).filter(b => !ON(b.x, b.y)).length, "surveyed buildings": (c.footprints || []).filter(q => !allOn(q.pts)).length, landmarks: c.landmarks.filter(L => !L.place && !(L.pts ? allOn(L.pts) : ON(L.x, L.y))).length, "walls and fences": c.walls.filter(w => !allOn(w.pts)).length, lamps: c.lamps.filter(l => !ON(l[0], l[1])).length, boats: c.boats.filter(b => !ON(b.x, b.y)).length };
    const off = Object.entries(offs).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`);
    if (off.length) P(`off the paper: ${off.join(", ")} (the engine must leave out whatever would stand beyond the plan's edge)`);
    // on a surveyed map a place stands in one of the map's own buildings; one that found none within 12 squares wears a model instead
    if (c.unhoused && c.unhoused.length) N(`no building of the map's own within reach of: ${c.unhoused.join(", ")}. Move its at: onto one (see the plan), or say landmark: "..."; otherwise it stands as a model of its own`);
    line += `: ${D.real ? "the real " + ((D.geo && D.geo.name) || "city") + " · " : ""}${typeof D.look === "string" ? D.look : (D.look && D.look.base) || "custom"} look${D.region ? " (" + D.region + ")" : ""} · ${c.roads.length} streets${D.real ? " (" + c.roads.filter(r => r.name).length + " named)" : ""} · ${c.buildings.length} buildings · ${c.landmarks.length} landmarks · ${placed.length} places`;
    if (D.real && !D.credit) P("a real city must credit its source: credit: \"... © OpenStreetMap contributors\" (the fetch writes it; do not remove it)");
    for (const L of c.landmarks) if (!L.flat && L.h > 95) N(`landmark "${L.name}" stands ${Math.round(L.h)} squares tall: it will leave the view`);
    if (c.buildings.length > 26000) N("a very large city: slower devices will struggle. Consider a smaller sheet.");
  } catch (e) { P("the city cannot be built: " + e.message); }
  return { line, out, problems, notes };
}
// the world map: every location known and standing on the map, every route between two of them, every 3D city it names
// made, every place that says it stands in a location in one
function checkWorld(A) {
  const out = [], K = A.worldKit, W0 = A.worldData || {}; let problems = 0, notes = 0;
  const P = m => { out.push("   ! " + m); problems++; }, N = m => { out.push("   - " + m); notes++; };
  if (W0.look && !K.LOOK_OF[String(W0.look).toLowerCase()]) P(`unknown look "${W0.look}": parchment, atlas or stars`);
  if (W0.size && !(Array.isArray(W0.size) && W0.size[0] > 0 && W0.size[1] > 0)) P("size must be [width, height]");
  const ids = new Set();
  (W0.locations || []).forEach((l, i) => {
    if (!l || !l.id || !l.name) { P(`location ${i + 1} needs an id and a name`); return; }
    if (ids.has(l.id)) P(`two locations are called "${l.id}"`); ids.add(l.id);
    if (l.kind && !K.KINDS[l.kind]) N(`${l.id}: unknown kind "${l.kind}", so it shows a plain mark (known: ${Object.keys(K.KINDS).join(", ")})`);
    if (l.state && !K.STATES.some(s => s[0] === l.state)) P(`${l.id}: unknown state "${l.state}" (${K.STATES.map(s => s[0]).join(", ")})`);
    if (l.at && !(Array.isArray(l.at) && l.at.length === 2 && l.at.every(Number.isFinite))) P(`${l.id}: at must be [x, y]`);
    if (l.city && !(A.cities || {})[l.city]) N(`${l.id} names the 3D city "${l.city}", which has not been made: the map offers to make it. To make it now: atlas.js city <dir> --invent "${l.name}" --id ${l.city} (or a real city by name, with --id ${l.city})`);
    for (const pid of l.people || []) if (!(A.castData || {})[pid]) N(`${l.id}: people names "${pid}", who is not one of the cast`);
  });
  const D = K.prepareWorld(W0, A.worldTerrainData, null), [w, h] = D.size;
  for (const l of D.locs) {
    if (l.unplaced) P(TD.drawing ? `${l.id} has no place on the drawing: give it at: [x, y], read off the picture (the map is ${w} across, ${h} down)` : `${l.id} has no place on the map: run atlas.js world (it stands each location where its kind belongs), or give it at: [x, y]`);
    else if (l.at[0] < 0 || l.at[1] < 0 || l.at[0] > w || l.at[1] > h) P(`${l.id} stands at ${l.at.map(Math.round).join(", ")}, off the map (0 to ${w} by 0 to ${h})`);
  }
  const own = W0.routes || [];
  own.forEach((r, i) => {
    if (!r || !ids.has(r.from) || !ids.has(r.to)) P(`route ${i + 1}${r && r.from ? ` (${r.from} to ${r.to})` : ""} must join two of the locations (from, to)`);
    else if (r.kind && !K.ROUTES[r.kind]) P(`route ${r.from} to ${r.to}: unknown kind "${r.kind}" (${Object.keys(K.ROUTES).join(", ")})`);
    else if (r.days != null && !(typeof r.days === "number" && r.days >= 0)) P(`route ${r.from} to ${r.to}: days must be a number`);
  });
  for (const cid of Object.keys(A.cities || {})) if (!(W0.locations || []).some(l => l && (l.city === cid || (!l.city && l.id === cid)))) N(`the 3D city "${cid}" stands nowhere on the world map: give a location city: "${cid}"`);
  for (const id of A.order) {
    const m = A.meta[id];
    if (m.location && !ids.has(m.location)) P(`${id} stands in the location "${m.location}", which the world map does not have`);
    if (m.city && !(A.cities || {})[m.city]) P(`${id} stands in the city "${m.city}", which has not been made (atlas.js city <dir> ... --id ${m.city})`);
  }
  if (W0.party && W0.party.at && !ids.has(W0.party.at)) P(`the party stands at "${W0.party.at}", which is not one of the locations`);
  if (W0.scale && !(W0.scale.per > 0)) P("scale needs per: how far one unit of the map is (scale: { unit: \"mile\", per: 0.6 })");
  if (!A.worldTerrainData && D.locs.length) N("no land under the map yet: run atlas.js world");
  const TD = A.worldTerrainData || {};
  if (TD.drawing && !fs.existsSync(path.join(A.__dir || ".", TD.drawing))) P(`the drawing ${TD.drawing} is missing from the campaign folder: run atlas.js world <dir> --drawing <the picture>`);
  const FK = ["mountains", "hills", "forest", "swamp", "marsh", "desert", "lake", "sea", "river"];
  (W0.features || []).forEach((f, i) => {
    if (!f || !FK.includes(f.kind)) P(`feature ${i + 1}: kind must be one of ${FK.join(", ")}`);
    else if (!(Array.isArray(f.pts) && f.pts.length > 2) && !(Array.isArray(f.line) && f.line.length > 1) && !(Array.isArray(f.at) && (f.r || f.kind === "sea"))) P(`feature ${i + 1} (${f.kind}${f.name ? " " + f.name : ""}) needs pts: [[x, y], ...] (an area), line: [[x, y], ...] (a river, or a range with width:), or at: [x, y] with r:`);
  });
  const routes = D.routes, c3 = D.locs.filter(l => l.city && (A.cities || {})[l.city]).length;
  if (!routes.length && D.locs.length > 1) N("no routes between the locations: add routes: in world.js, or run atlas.js world to have them suggested");
  const line = `world map: ${D.look} · ${D.locs.length} location${D.locs.length === 1 ? "" : "s"} (${c3} with a 3D map) · ${routes.length} route${routes.length === 1 ? "" : "s"}${own.length ? "" : routes.length ? " (suggested)" : ""}${D.scale ? ` · 1 unit = ${D.scale.per} ${D.scale.unit || ""}` : " · no scale"}${D.party.at ? ` · the party at ${D.party.at}` : ""}`;
  return { line, out, problems, notes };
}
// the world map's land: made, or made again keeping the land and every location already placed
async function cmdWorld(dir) {
  if (!dir || !fs.existsSync(path.join(dir, "campaign.js"))) die("Which campaign folder? node atlas.js world <dir>");
  const WI = require("./world-invent.js");
  if (!hasWorld(dir)) {
    let size = null;
    if (flags.drawing && flags.drawing !== true && fs.existsSync(flags.drawing)) { const z = WI.imageSize(fs.readFileSync(flags.drawing)); if (z) size = z.w >= z.h ? [1000, Math.round(1000 * z.h / z.w)] : [Math.round(1000 * z.w / z.h), 1000]; }
    const n = WI.starter(dir, load(dir), flags, size);
    const next = flags.drawing ? "Look at the drawing and add every place on it, at: [x, y] where it is drawn, its roads as routes and its mountains, forests, rivers and lakes as features (references/world.md, \"From a drawing\")" : flags.real ? "Add the story's other places to it: each is found on the real map by its name (or geo: \"Place, Country\")" : "Add the story's other places to it (references/world.md), then run this again to place them";
    console.log(`wrote ${path.join(dir, "world.js")}: ${n ? `a location for each of the campaign's ${n} cit${n === 1 ? "y" : "ies"}` : "no locations yet"}. ${next}.`);
  }
  let A = load(dir);
  const old = A.worldTerrainData || {}, log = m => console.log(m);
  const mode = flags.drawing ? "drawing" : flags.real ? "real" : flags.land || flags.seed || flags.replace ? "invent" : old.drawing ? "drawing" : old.real ? "real" : "invent";
  const { T, summary } = mode === "drawing" ? WI.fromDrawing(dir, A, flags.drawing, flags, log) : mode === "real" ? await require("./world-real.js").realWorld(dir, A, flags, log) : WI.invent(A, flags, log);
  WI.writeTerrain(dir, T, A.config.title);
  console.log(`wrote ${path.join(dir, "world-terrain.js")}: ${summary}`);
  if (flags.across && !(A.worldData || {}).scale) console.log("  (--across sets the scale only when it starts a world.js: add scale: { unit, per } to world.js by hand)");
  A = load(dir); const r = checkWorld(A); console.log("\n" + r.line + (r.problems ? "" : " OK")); for (const l of r.out) console.log(l);
  console.log(`\nNext: node atlas.js build ${dir}   (the page shows it under "World map")`);
}
// music: every place plays a theme; a theme it names must exist
function checkMusic(A) {
  const out = [], K = A.music, c = A.config.music || {}; let problems = 0, notes = 0, chosen = 0, guessed = [], lone = [];
  if (c.flavour && !K.FLAVOURS[c.flavour]) { out.push(`   ! unknown music flavour "${c.flavour}" (known: ${Object.keys(K.FLAVOURS).join(", ")})`); problems++; }
  for (const id of A.order) {
    const m = A.meta[id], own = m.music, mood = own && typeof own === "object" ? own.mood : own;
    if (own == null) { if ((m.tier || 3) <= 1) guessed.push(`${id} (${K.guess(m)})`); continue; }
    if (!K.MOODS[mood]) { out.push(`   ! ${id}: unknown music "${mood}" (see: atlas.js catalogue)`); problems++; } else chosen++;
    if (own && typeof own === "object" && own.flavour && !K.FLAVOURS[own.flavour]) { out.push(`   ! ${id}: unknown music flavour "${own.flavour}"`); problems++; }
    // a song of the user's own, given in the data (music: { mood, link: "https://...", title }): a web address
    if (own && typeof own === "object" && own.link != null && !/^https?:\/\/\S+$/.test(String(own.link))) { out.push(`   ! ${id}: music link "${own.link}" is not a web address (it must start with https://)`); problems++; }
    // the songs for its moments (music: { mood, also: { "The spot count": "dread" } }): each one of the moods
    const also = own && typeof own === "object" && own.also ? (Array.isArray(own.also) ? own.also : Object.entries(own.also)) : [];
    for (const [when, song] of also) if (!K.MOODS[song]) { out.push(`   ! ${id}: the song for "${when}" is "${song}", which is not a mood (see: atlas.js catalogue)`); problems++; }
    if (!also.length && (m.tier || 3) <= 2 && mood !== "silence") lone.push(id);
  }
  if (guessed.length) { out.push(`   - the theme of these tier 1 places is guessed from their names; say music: "..." to choose: ${guessed.join(", ")}`); notes++; }
  if (lone.length) { out.push(`   - the songs for the moments at these tier 1 and 2 places are guessed from their scenes; to choose them, say music: { mood, also: { "The search": "dread" } }: ${lone.join(", ")}`); notes++; }
  return { line: `music: ${K.flavour()} · ${chosen} of ${A.order.length} places with a chosen theme`, out, problems, notes };
}
// What every person carries, the cast and the people on the maps alike: what they look like, their story, how they
// act, and the people they know (ties: { castId or "A full name": "how they know them" }, or a sentence)
const PERSON = ["look", "bg", "manner", "ties"];
const PERSON_SAYS = { look: "what they look like (look)", bg: "their story (bg)", manner: "how they act (manner)", ties: "who they know (ties)" };
const tieText = t => !t ? "" : typeof t === "string" ? t.trim() : Object.entries(t).filter(([, v]) => has(v)).map(([k, v]) => k + ": " + v).join("; ");
// a tie written like an id (one lower-case word) that is not one of the cast is probably a mistyped id
const strayTies = (A, t) => t && typeof t === "object" ? Object.keys(t).filter(x => /^[a-z][a-z0-9_-]*$/.test(x) && !(A.castData || {})[x]) : [];

// the cast: each principal described well enough to play, and met somewhere
function checkCast(A) {
  const out = [], cast = A.castData || {}; let problems = 0, notes = 0;
  const met = new Set(); for (const id of A.order) { const M = A.maps[id]; if (M) for (const n of Object.values(M.npcs || {})) if (n.who) met.add(n.who); }
  for (const [k, p] of Object.entries(cast)) {
    if (!p.n) { out.push(`   ! ${k} has no name (n)`); problems++; }
    const lack = [...PERSON, "want", "secret", "press"].filter(f => !(f === "ties" ? tieText(p.ties) : p[f]));
    if (lack.length) { out.push(`   ! ${k} lacks: ${lack.map(f => PERSON_SAYS[f] || ({ want: "what they want (want)", secret: "what they hide (secret)", press: "what makes them talk (press)" })[f]).join(", ")}`); problems++; }
    for (const t of strayTies(A, p.ties)) { out.push(`   - ${k}'s ties name "${t}", who is not in the cast: use a cast id, or write the name out in full`); notes++; }
    if (!met.has(k) && !p.offstage) { out.push(`   - ${k} is in the cast but is met nowhere: give a person on some map who: "${k}" (or mark the cast entry offstage: true)`); notes++; }
  }
  return { line: `cast: ${Object.keys(cast).length} principal${Object.keys(cast).length === 1 ? "" : "s"}`, out, problems, notes };
}
function cmdCheck(dir, want) {
  const A = load(dir); let problems = 0, notes = 0;
  const list = (want.length ? want : A.order);
  for (const id of list) {
    if (!A.meta[id]) { console.log(`!! ${id}: no such place`); problems++; continue; }
    if (!A.maps[id]) { console.log(`${id}: not mapped yet`); continue; }
    if (A.maps[id].alias) continue;
    const prob = new Map(), note = new Map(), n = A.levels(id);
    for (let lv = 0; lv <= n; lv++) checkMap(A, id, lv, m => prob.has(m) || prob.set(m, lv), m => note.has(m) || note.set(m, lv));
    const g = checkGuide(A, id, m => prob.set(m, n), m => note.set(m, n));
    checkStandard(A, id, m => prob.set(m, n));
    const M = A.get(id, 99), tag = lv => n ? ` [${A.sizeName(lv)}]` : "";
    console.log(`${id}: tier ${A.meta[id].tier || "?"} · ${g.rooms} rooms · ${M.floors.length} floor${M.floors.length > 1 ? "s" : ""}${n ? ` · ${n + 1} sizes` : ""} · guide ${g.done}/${g.rooms}${prob.size ? "" : "  OK"}`);
    for (const [m, lv] of prob) console.log(`   ! ${m}${tag(lv)}`);
    for (const [m, lv] of note) console.log(`   - ${m}${tag(lv)}`);
    problems += prob.size; notes += note.size;
  }
  if (!want.length) {
    // the clue trail across the whole campaign
    const leads = A.leads(), inb = {}; for (const l of leads) if (A.meta[l.to] && l.to !== l.from) (inb[l.to] = inb[l.to] || new Set()).add(l.from + "/" + l.via);
    const out = [];
    for (const id of A.order) {
      const m = A.meta[id], k = (inb[id] || new Set()).size, need = standardFor(A, m.tier).inbound; if (m.start) continue;
      if (!k) { out.push(`   ! ${id}: nothing leads here (add a clue with to: "${id}", or mark the place start: true)`); problems++; }
      else if (k < need && m.tier === 1) { out.push(`   ! ${id}: a tier 1 place needs ${need} separate leads in and has ${k}: one missed clue would stall the story`); problems++; }
      else if (k < need) { out.push(`   - ${id}: only ${k} lead${k > 1 ? "s" : ""} in; give the players a second way to find it`); notes++; }
    }
    if (!A.order.some(id => A.meta[id].start)) { out.push(`   ! no starting place: mark where the story opens with start: true`); problems++; }
    console.log(`clue trail: ${leads.length} lead${leads.length === 1 ? "" : "s"} between ${A.order.length} places${out.length ? "" : "  OK"}`); out.forEach(l => console.log(l));
    if (A.config.music !== false) { const c = checkMusic(A); console.log(c.line + (c.problems || c.notes ? "" : "  OK")); c.out.forEach(l => console.log(l)); problems += c.problems; notes += c.notes; }
    if (A.castData) { const c = checkCast(A); console.log(c.line + (c.problems || c.notes ? "" : "  OK")); c.out.forEach(l => console.log(l)); problems += c.problems; notes += c.notes; }
    for (const cid of Object.keys(A.cities || {})) { const c = checkCity(A, cid); console.log(c.line + (c.problems || c.notes ? "" : "  OK")); c.out.forEach(l => console.log(l)); problems += c.problems; notes += c.notes; }
    if (A.worldData) { const c = checkWorld(A); console.log(c.line + (c.problems || c.notes ? "" : "  OK")); c.out.forEach(l => console.log(l)); problems += c.problems; notes += c.notes; }
    else for (const id of A.order) { const m = A.meta[id]; if (m.location) { console.log(`   ! ${id} stands in the world location "${m.location}", but the campaign has no world map (world.js)`); problems++; } }
    if (flags.names) nameReview(A);
  }
  console.log(problems ? `${problems} problem(s), ${notes} note(s)` : notes ? `no problems, ${notes} note(s)` : "all clear");
  process.exitCode = problems ? 1 : 0;
}
// the same first name or surname on two different people is how canon clashes start: list them for a human to judge
function nameReview(A) {
  const by = {};
  for (const id of mapped(A)) for (const n of Object.values(A.get(id, 99).npcs || {})) {
    const full = String(n.n || "").split(/[,(]/)[0].trim();
    for (const w of full.split(/\s+/).filter(w => /^[A-Z][a-z']{2,}$/.test(w) && !/^(The|Mrs|Miss|Mr|Dr|Sir|Lady|Lord|Old|Young|Father|Mother|Brother|Sister|Captain|Sergeant|Inspector|Professor|Madame)$/.test(w))) (by[w] = by[w] || new Set()).add(full + " @" + id);
  }
  const hits = Object.entries(by).filter(([, s]) => new Set([...s].map(x => x.split(" @")[0])).size > 1);
  console.log(`names shared by different people: ${hits.length ? "" : "none"}`); for (const [w, s] of hits) console.log(`   ${w}: ${[...s].join("; ")}`);
}

/* ---------------------------------------------------------------- ascii, dump, status */
function cmdAscii(dir, id, floor) {
  const A = load(dir); if (!A.maps[id]) die(`No map for ${id}`);
  const M = A.get(id, flags.level === undefined ? 99 : +flags.level);
  console.log(`=== ${id} : ${M.t}`);
  M.floors.forEach((F, fi) => {
    if (floor !== undefined && +floor !== fi) return;
    const g = Array.from({ length: F.h }, () => Array(F.w).fill(" .")), key = {};
    for (const r of F.R) {
      const [rid, x, y, w, h, name, kind, o = {}] = r, tag = /^R\d+$/.test(rid) ? rid.slice(1).padStart(2) : (A.isOut(kind) ? " ~" : A.isSolid(kind) ? " #" : " " + rid[0]);
      key[rid] = (key[rid] ? key[rid] + "+" : `${rid}=${name || ""}(${kind}${o.h ? ",hidden" : ""}${o.b ? ",b:" + o.b : ""})`) + `[${x},${y},${w},${h}]`;
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = tag;
    }
    for (const s of F.ST || []) for (let j = Math.floor(s[2]); j < s[2] + s[4]; j++) for (let i = Math.floor(s[1]); i < s[1] + s[3]; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = "ST";
    console.log(`-- [${fi}] ${F.n} ${F.w}x${F.h}${A.isGmFloor(F) ? " (GM only)" : ""}`);
    console.log("    " + Array.from({ length: F.w }, (_, i) => String(i % 100).padStart(2)).join(""));
    g.forEach((row, j) => console.log(String(j).padStart(3) + " " + row.join("")));
    console.log("  rooms: " + Object.values(key).join("; "));
    console.log("  doors: " + (F.D || []).map(d => d.join(",")).join(" | "));
    console.log("  stairs: " + (F.ST || []).map(s => s.slice(0, 8).join(",")).join(" | ") + "   markers: " + (F.M || []).map(m => m.join(",")).join(" "));
  });
}
function cmdDump(dir, want) {
  const A = load(dir), T = s => s ? String(s).replace(/\s+/g, " ") : "";
  for (const id of want) {
    if (!A.maps[id]) { console.log(`##### ${id}: not mapped`); continue; }
    const M = A.get(id, 99), G = A.guides[A.keyOf(id)];
    console.log(`##### ${id} | ${M.t} | sizes ${A.levels(id) + 1}`); console.log("OV: " + T(M.ov)); if (M.run || (G && G.ov)) console.log("RUN: " + T([M.run, G && G.ov].filter(Boolean).join(" ")));
    M.floors.forEach(F => { const rs = []; F.R.forEach(r => { if (A.isRoom(r[0]) && !rs.includes(r[0])) rs.push(r[0]); }); console.log(`FLOOR ${F.n}: ` + rs.map(r => { const x = F.R.find(q => q[0] === r); return r + " " + (x[5] || "(" + x[6] + ")") + (x[7] && x[7].h ? " [HIDDEN]" : ""); }).join("; ")); });
    const rooms = new Set(); M.floors.forEach(F => F.R.forEach(r => A.isRoom(r[0]) && rooms.add(r[0])));
    for (const k of [...rooms].sort((a, b) => +a.slice(1) - +b.slice(1))) { const r = A.roomEntry(M, G, k); console.log(k + ": " + Object.keys(r).map(f => f + "=" + T(r[f])).join(" | ")); }
    for (const g of ["clues", "npcs", "secrets", "enc"]) for (const [k, v] of Object.entries(M[g] || {})) console.log(`${k}@${v.at}: ${v.t || v.n} | ${T(v.d || v.knows || v.dest || "").slice(0, 240)}${v.rev ? " => " + T(v.rev).slice(0, 180) : ""}${v.to ? " -> " + [].concat(v.to).join(",") : ""}`);
  }
}
function progress(A) {
  return A.order.map(id => {
    const m = A.meta[id]; if (!A.maps[id] || A.maps[id].alias) return { id, m, mapped: false };
    const M = A.get(id, 99), G = A.guides[A.keyOf(id)], rooms = new Set(); M.floors.forEach(F => F.R.forEach(r => A.isRoom(r[0]) && rooms.add(r[0])));
    let done = 0; for (const r of rooms) { const e = A.roomEntry(M, G, r); if (["d", "pur", "obj", "chk", "atm"].every(k => has(e[k])) && (has(e.kp) || has(e.inv))) done++; }
    return { id, m, mapped: true, rooms: rooms.size, done, floors: M.floors.length, sizes: A.levels(id) + 1, clues: Object.keys(M.clues || {}).length, npcs: Object.keys(M.npcs || {}).length };
  });
}
function cmdStatus(dir) {
  const A = load(dir), rows = progress(A), cats = (A.config.categories || []);
  // --json: the same table for the Atlas app's progress view; nothing is written
  if (flags.json) {
    const places = rows.map(r => Object.assign({ id: r.id, name: r.m.name || r.id, tier: r.m.tier || null, category: r.m.category || "", mapped: r.mapped }, r.mapped ? { rooms: r.rooms, done: r.done, floors: r.floors, clues: r.clues, people: r.npcs } : {}));
    console.log(JSON.stringify({ title: A.config.title, city: !!A.cityData, cities: Object.keys(A.cities || {}), world: !!A.worldData, places }));
    return;
  }
  const catName = c => (cats.find(x => x.id === c) || {}).name || c || "Places";
  console.log("place".padEnd(26) + "tier  rooms  floors  sizes  guide    clues  people");
  for (const r of rows) console.log(r.id.padEnd(26) + String(r.m.tier || "?").padStart(4) + "  " + (r.mapped ? `${String(r.rooms).padStart(5)}  ${String(r.floors).padStart(6)}  ${String(r.sizes).padStart(5)}  ${(r.done + "/" + r.rooms).padStart(7)}  ${String(r.clues).padStart(5)}  ${String(r.npcs).padStart(6)}` : "   not mapped yet"));
  const by = {}; for (const r of rows) (by[r.m.category || ""] = by[r.m.category || ""] || []).push(r);
  const order = cats.map(c => c.id), md = [`# ${A.config.title}: map and guide checklist`, "", "Written by `atlas.js status`. A place is ticked when it is mapped and every room has a complete guide entry.", ""];
  for (const c of Object.keys(by).sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)))) {
    md.push(`## ${catName(c)}`, "");
    for (const r of by[c]) md.push(!r.mapped ? `- [ ] ${r.m.name || r.id}: not mapped yet` : `- [${r.done === r.rooms ? "x" : " "}] ${r.m.name || r.id}: ${r.rooms} rooms on ${r.floors} floor${r.floors > 1 ? "s" : ""}${r.sizes > 1 ? `, ${r.sizes} map sizes` : ""}; guide ${r.done}/${r.rooms}; ${r.clues} clues, ${r.npcs} people`);
    md.push("");
  }
  fs.writeFileSync(path.join(dir, "checklist.md"), md.join("\n"));
  console.log(`wrote ${path.join(dir, "checklist.md")}`);
}

/* ---------------------------------------------------------------- build, export, catalogue */
function pageParts(dir) {
  const A = load(dir), cfg = A.config, P = A.paper(), ui = cfg.ui || {};
  // The default dress is the Wormroot Idol Gazetteer's: the Fell types, Alegreya, IBM Plex Mono (atlas.css has its colours).
  const fams = (cfg.fonts && cfg.fonts.google) || ["IM+Fell+English:ital@0;1", "IM+Fell+English+SC", "Alegreya:ital,wght@0,400;0,600;1,400", "IBM+Plex+Mono:wght@400;500"];
  const link = fams.length ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fams.map(f => "family=" + f).join("&")}&display=swap">\n` : "";
  const light = [`--map-paper: ${P.paper}`], dark = [];
  if (ui.accent) light.push(`--accent: ${ui.accent}`, `--accent-soft: color-mix(in srgb, ${ui.accent} 11%, transparent)`);
  if (ui.accentDark) dark.push(`--accent: ${ui.accentDark}`, `--accent-soft: color-mix(in srgb, ${ui.accentDark} 13%, transparent)`);
  if (ui.display) light.push(`--f-display: ${ui.display}`); if (ui.body) light.push(`--f-body: ${ui.body}`); if (ui.mono) light.push(`--f-mono: ${ui.mono}`); if (ui.sc) light.push(`--f-sc: ${ui.sc}`);
  const over = `:root { ${light.join("; ")} }` + (dark.length ? `\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${dark.join("; ")} } }\n:root[data-theme="dark"] { ${dark.join("; ")} }` : "");
  const css = fs.readFileSync(path.join(ENGINE, "atlas.css"), "utf8");
  const city = !!A.cityData;       // a campaign with a city map also needs the city engine and three.js
  const world = hasWorld(dir);     // and one with a world map, the world engine (it needs nothing else)
  const three = city ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>\n` : "";
  // the game master's drawing rides in the page itself, before the page is drawn
  const pic = world && A.worldTerrainData && A.worldTerrainData.drawing ? path.join(dir, A.worldTerrainData.drawing) : null;
  const drawingJS = pic && fs.existsSync(pic) ? "ATLAS.worldDrawingSrc = \"data:" + ({ ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" }[path.extname(pic).toLowerCase()] || "image/png") + ";base64," + fs.readFileSync(pic).toString("base64") + "\";" : "";
  const raw = [path.join(ENGINE, "atlas-engine.js"), ...(city ? [path.join(ENGINE, "atlas-city.js")] : []), ...(world ? [path.join(ENGINE, "atlas-world.js")] : []), ...(A.config.music === false ? [] : [path.join(ENGINE, "atlas-music.js")]), ...sources(dir), path.join(ENGINE, "atlas-voice.js")].map(f => fs.readFileSync(f, "utf8")).concat(storyJS(dir), drawingJS, fs.readFileSync(path.join(ENGINE, "atlas-shell.js"), "utf8")).join("\n;\n");
  const js = raw.replace(/<\/script/gi, "<\\/script");
  const body = `<title>${A.esc(cfg.title)}</title>\n${link}<style>\n${css}\n${over}\n</style>\n<div class="wrap" id="app" data-mode="gm"></div>\n${three}<script>\n${js}\n</script>\n`;
  return { A, body, raw };
}
// The story as the council wrote it (story/bible/*.md, or story/bible.md), then the council's debate and the story as
// it was given. The page shows them on its Story tab, to the referee only, so the whole story can be read in one place.
function storyJS(dir) {
  const st = path.join(dir, "story"), bd = path.join(st, "bible"), out = [];
  const add = (f, group, title) => {
    if (!fs.existsSync(f)) return; const md = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n"); if (!md.trim()) return;
    const m = /^#\s+(.+)$/m.exec(md); out.push({ group, title: title || (m ? m[1].trim() : path.basename(f, ".md")), md });
  };
  if (fs.existsSync(bd)) for (const f of fs.readdirSync(bd).filter(f => /\.md$/i.test(f) && !/^readme/i.test(f)).sort()) add(path.join(bd, f), "The story");
  add(path.join(st, "bible.md"), "The story");
  if (out.length) {
    add(path.join(st, "council.md"), "How it was made", "The council's debate");
    // Tolkien's judgement, once it is written (not the empty form a new campaign starts with)
    const jf = path.join(st, "judgement.md");
    if (fs.existsSync(jf) && !fs.readFileSync(jf, "utf8").includes("(chapter name)")) add(jf, "How it was made", "Tolkien's judgement");
    add(path.join(st, "source.md"), "How it was made", "The story as it was given");
  }
  return "ATLAS.storyData = " + JSON.stringify(out).split(String.fromCharCode(0x2028)).join(" ").split(String.fromCharCode(0x2029)).join(" ") + ";";
}
function cmdBuild(dir) {
  const { A, body, raw } = pageParts(dir), out = path.join(dir, "dist"); fs.mkdirSync(out, { recursive: true });
  const name = slug(A.config.title) + ".html";
  try { new Function(raw); } catch (e) { die("The page script does not parse: " + e.message); }
  fs.writeFileSync(path.join(out, name), body);
  fs.writeFileSync(path.join(out, "preview.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n${body}</body></html>\n`);
  console.log(`built ${path.join(out, name)} (${Math.round(body.length / 1024)} KB): publish this file as the Artifact`);
  console.log(`      ${path.join(out, "preview.html")}: the same page as a complete document, to open in a browser`);
}
function cmdExport(dir, want) {
  const A = load(dir), out = path.join(dir, "dist", "maps"); let n = 0;
  for (const id of (want.length ? want : mapped(A))) {
    if (!A.maps[id]) continue; const M = A.get(id, 99), d = path.join(out, id); fs.mkdirSync(d, { recursive: true });
    M.floors.forEach((F, fi) => { for (const v of ["player", "gm"]) { if (v === "player" && A.isGmFloor(F)) continue; const s = A.svg(id, fi, v, "x", 99).replace(/ class="lmap2"( style="[^"]*")?/, ` width="${(F.w * A.C + 20) * 1.5}" height="${(F.h * A.C + 70) * 1.5}"`); fs.writeFileSync(path.join(d, `${String(fi + 1).padStart(2, "0")}-${slug(F.n)}-${v}.svg`), s); n++; } });
  }
  console.log(`wrote ${n} SVG maps to ${out}`);
}
function cmdCatalogue(dir) {
  const A = dir ? load(dir) : require(path.join(ENGINE, "atlas-engine.js"));
  if (!A.cityKit) new Function("ATLAS", fs.readFileSync(path.join(ENGINE, "atlas-city.js"), "utf8"))(A);
  const kinds = Object.assign({}, A.KINDS, A.config.kinds), tag = d => d.out ? "open ground" : d.solid ? "solid" : "indoor";
  console.log("FLOOR KINDS\n  indoor:      " + Object.keys(kinds).filter(k => tag(kinds[k]) === "indoor").join(" ") + "\n  open ground: " + Object.keys(kinds).filter(k => kinds[k].out).join(" ") + "\n  solid:       " + Object.keys(kinds).filter(k => kinds[k].solid).join(" "));
  console.log("  (no automatic windows: " + Object.keys(kinds).filter(k => kinds[k].nowin).join(" ") + ")");
  console.log("PATTERNS FOR YOUR OWN KINDS (config.kinds.<name>.pat)\n  " + Object.keys(A.GEN).join(" "));
  console.log("ITEMS\n  " + Object.keys(A.ITEMS).concat(Object.keys(A.config.items)).join(" "));
  console.log("FURNISHING PRESETS (room opts.fx)\n  " + Object.keys(A.FX).join(" "));
  console.log("MARKERS\n  " + Object.entries(A.markers()).map(([k, v]) => `${k} ${v[1]}`).join(" · "));
  if (!A.music) new Function("ATLAS", fs.readFileSync(path.join(ENGINE, "atlas-music.js"), "utf8"))(A);
  console.log("MUSIC: moods (place: music: \"crypt\"; without it the mood is guessed from the place's name)\n  " + Object.keys(A.music.MOODS).join(" ") + "\nMUSIC: flavours (ATLAS.configure({ music: { flavour: \"arabic\" } }); without it, taken from the city's look and region)\n  " + Object.keys(A.music.FLAVOURS).join(" "));
  console.log("CITY MAP: what a place can be (place: model: \"church\" or [\"church\", 3])\n  " + A.cityKit.MODELS.join(" ") + "\nCITY MAP: looks (by age)\n  " + Object.keys(A.cityKit.LOOKS).join(" ") + "\nCITY MAP: regions (colours by part of the world)\n  " + Object.keys(A.cityKit.REGIONS).join(" ") + " (anything else: the temperate north)\nCITY MAP: kinds of landmark (landmarks: [{ name, kind, at: [x, y], h, top, pts }])\n  " + A.cityKit.LM_KINDS.join(" ") + "\n  top: tower taper|stone · church twin|dome|flat · spire needle|obelisk|column|light|stack · monument statue|fountain · bridge pylons · hall dome|spire · castle spires");
  console.log("CITY MAP: a kit, buildings made for one place (kit.js: ATLAS.kit({ name, for, look, dress, models, landmarks }); references/cities.md, \"Kits\")\n  shapes: " + A.cityKit.KIT_SHAPES.join(" ") + "\n  materials: " + A.cityKit.KIT_MATS.join(" ") + " or a colour \"#a8654a\"\n  dress: " + A.cityKit.KIT_DRESS.join(" ") + "\n  kits ready to use (atlas.js kit use <dir> <name>): " + (kitList(dir).map(k => k.id).join(" ") || "none yet"));
  console.log("STANDARDS (tier: rooms, floors, secrets, clues, people, encounters, leads in)\n" + [1, 2, 3].map(t => { const S = dir ? standardFor(A, t) : STANDARDS[t]; return `  tier ${t}: ${S.rooms}, ${S.floors}, ${S.secrets}, ${S.clues}, ${S.people}, ${S.encounters}, ${S.inbound}`; }).join("\n"));
  if (dir) {
    const C = A.C, P = A.paper(), cells = [];
    const pat = k => { const d = A.kindOf(k), g = (d.pat && A.PATS[d.pat] && !d.fill) ? A.PATS[d.pat] : (A.PATS[k] && !A.config.kinds[k]) ? A.PATS[k] : (A.GEN[d.pat] || A.GEN.plain)(d.fill || "#c9c4b8", d.line || "#8f8a7e"); return `<svg viewBox="0 0 96 48" width="96" height="48"><defs><pattern id="k-${k}" width="${g[0]}" height="${g[1]}" patternUnits="userSpaceOnUse">${g[2]}</pattern></defs><rect width="96" height="48" fill="url(#k-${k})" stroke="${P.ink}"/></svg>`; };
    for (const k of Object.keys(kinds)) cells.push(`<figure>${pat(k)}<figcaption>${k}<small>${tag(kinds[k])}</small></figcaption></figure>`);
    const items = Object.keys(A.ITEMS).concat(Object.keys(A.config.items)).filter(k => k !== "x").map(k => `<figure><svg viewBox="-4 -12 ${C * 2 + 8} ${C * 2 + 24}" width="${C * 2 + 8}" height="${C * 2 + 24}"><rect x="-4" y="-12" width="${C * 2 + 8}" height="${C * 2 + 24}" fill="${P.paper}"/>${A.itemFn(k)(C * 2, C * 2)}</svg><figcaption>${k}</figcaption></figure>`);
    const html = `<!doctype html><meta charset="utf-8"><title>Atlas catalogue</title><style>body{font:14px system-ui,sans-serif;margin:24px;background:#f4f2ec;color:#222}h1{font-size:20px}h2{font-size:15px;margin-top:28px}.g{display:flex;flex-wrap:wrap;gap:14px}figure{margin:0;text-align:center}figcaption{font:12px ui-monospace,monospace;margin-top:4px}small{display:block;color:#777}</style><h1>Floor kinds, items and presets</h1><h2>Floor kinds</h2><div class="g">${cells.join("")}</div><h2>Items (drawn 2 x 2 squares; back edge at the top)</h2><div class="g">${items.join("")}</div><h2>Furnishing presets</h2><p>${Object.keys(A.FX).join(" · ")}</p>`;
    fs.mkdirSync(path.join(dir, "dist"), { recursive: true }); fs.writeFileSync(path.join(dir, "dist", "catalogue.html"), html); console.log(`wrote ${path.join(dir, "dist", "catalogue.html")}`);
  }
}
function cmdInit(dir) {
  if (!dir) die("Where? node atlas.js init <dir>");
  if (fs.existsSync(path.join(dir, "campaign.js"))) die(`${dir} already has a campaign.js`);
  const copy = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) { const s = path.join(src, f), d = path.join(dst, f); if (fs.statSync(s).isDirectory()) copy(s, d); else fs.copyFileSync(s, d); } };
  copy(path.join(ROOT, "template"), dir);
  if (flags.title && flags.title !== true) { const c = path.join(dir, "campaign.js"); fs.writeFileSync(c, fs.readFileSync(c, "utf8").replace("Untitled campaign", String(flags.title).replace(/"/g, '\\"')).replace('storageKey: "atlas"', `storageKey: "atlas-${slug(flags.title)}"`)); }
  console.log(`started ${dir}
  1. save the story, untouched, as story/source.md
  2. convene the council (references/council.md): story/council.md, then story/bible/
  3. canon.md and the cast and places in campaign.js; the map of the whole with: atlas.js city
  4. one file per place in places/   (the whole route: references/playbook.md)`);
}

// the city map: fetch a real city, invent one, or find where a real spot falls on a fetched city's sheet
async function cmdCity(dir, place) {
  if (!dir || !fs.existsSync(path.join(dir, "campaign.js"))) die("Which campaign folder? node atlas.js city <dir> \"City, Country\"   or   node atlas.js city <dir> --invent \"Name\"");
  const id = flags.id && flags.id !== true ? require("./city-common.js").cityTarget(flags.id) : null;
  if (flags.id === true) die("--id needs a name for the city: --id harrowgate");
  try {
    if (flags.invent) require("./city-invent.js").inventCity(dir, flags.invent === true ? place : flags.invent, flags);
    else await require("./city-real.js").importCity(dir, place, flags);
  } catch (e) { die("city: " + e.message); }
  const A = load(dir), r = checkCity(A, id); console.log("\n" + r.line + (r.problems ? "" : " OK")); for (const l of r.out) console.log(l);
  if (id && !(A.worldData && (A.worldData.locations || []).some(l => l.city === id))) console.log(`\nThis city stands on the world map once a location in world.js says city: "${id}". Places stand in it with city: "${id}" (or the location's id as location:).`);
  console.log(`\nNext: node atlas.js build ${dir}   (the page shows the city above the index)`);
}
async function cmdLocate(dir, what) {
  if (!dir || !what) die("node atlas.js locate <dir> \"an address or a name\"");
  const A = load(dir), C = flags.id && A.cities ? A.cities[flags.id] : A.cityData; if (!C) die(flags.id ? `this campaign has no city "${flags.id}"` : "this campaign has no city yet");
  try { await require("./city-real.js").locate(dir, C.geo, what); } catch (e) { die("locate: " + e.message); }
}

// ---- kits: buildings made for one place, kept so the next campaign set there uses them again (the user, 15 and 20 Oct
//      2026: "you have prompt specific models already made you can just reuse them"). Two shelves: the kits that come
//      with Atlas (its kits/ folder), and your own, in a kits/ folder beside your campaigns folder.
const kitShelves = dir => [path.resolve(dir ? path.join(path.resolve(dir), "..", "..") : ".", "kits"), path.join(ROOT, "kits")];
function kitList(dir) {
  const seen = new Set(), out = [];
  for (const shelf of kitShelves(dir)) {
    if (!fs.existsSync(shelf)) continue;
    for (const f of fs.readdirSync(shelf).filter(f => f.endsWith(".js")).sort()) {
      const id = f.slice(0, -3); if (seen.has(id)) continue; seen.add(id);
      const s = fs.readFileSync(path.join(shelf, f), "utf8"), nm = s.match(/\bname:\s*"([^"]+)"/), fr = s.match(/\bfor:\s*"([^"]+)"/);
      out.push({ id, file: path.join(shelf, f), name: nm ? nm[1] : id, for: fr ? fr[1] : "", own: shelf !== path.join(ROOT, "kits") });
    }
  }
  return out;
}
function cmdKit(sub, dir, name) {
  if (sub === "list") {
    const ks = kitList(dir);
    if (!ks.length) { console.log("No kits yet. Make one in a campaign's kit.js, then: node atlas.js kit save <dir>"); return; }
    for (const k of ks) console.log(`${k.id.padEnd(22)} ${k.name}${k.for ? ": " + k.for : ""}${k.own ? "   (yours)" : ""}`);
    return;
  }
  if (sub === "use") {
    if (!dir || !name) die("node atlas.js kit use <dir> <kit>   (node atlas.js kit list shows them)");
    const want = slug(name), k = kitList(dir).find(x => x.id === want || slug(x.name) === want);
    if (!k) die(`no kit called "${name}". node atlas.js kit list shows those there are; to make one, see references/cities.md, "Kits"`);
    const to = path.join(dir, "kit.js");
    if (fs.existsSync(to) && !flags.force) die(`${to} is already there. Add --force to replace it with the kit "${k.name}"`);
    fs.copyFileSync(k.file, to); console.log(`${to}: the kit "${k.name}"${k.for ? " (" + k.for + ")" : ""}. Rebuild to see it.`);
    return;
  }
  if (sub === "save") {
    if (!dir) die("node atlas.js kit save <dir> [name]");
    const from = path.join(dir, "kit.js"); if (!fs.existsSync(from)) die(`${dir} has no kit.js to save`);
    load(dir);                                                             // a kit that does not load is not kept
    const s = fs.readFileSync(from, "utf8"), nm = s.match(/\bname:\s*"([^"]+)"/), id = slug(name || (nm ? nm[1] : path.basename(path.resolve(dir))));
    const shelf = kitShelves(dir)[0]; fs.mkdirSync(shelf, { recursive: true });
    const to = path.join(shelf, id + ".js"); if (fs.existsSync(to) && !flags.force) die(`${to} is already there. Add --force to replace it`);
    fs.copyFileSync(from, to); console.log(`kept as ${to}: the next campaign set there can use it with: node atlas.js kit use <dir> ${id}`);
    return;
  }
  die("node atlas.js kit list [<dir>] · kit use <dir> <kit> · kit save <dir> [name]");
}

switch (cmd) {
  case "city": cmdCity(pos[0], pos[1]); break;
  case "locate": cmdLocate(pos[0], pos.slice(1).join(" ")); break;
  case "init": cmdInit(pos[0]); break;
  case "check": cmdCheck(pos[0], pos.slice(1)); break;
  case "ascii": cmdAscii(pos[0], pos[1], pos[2]); break;
  case "dump": cmdDump(pos[0], pos.slice(1)); break;
  case "status": cmdStatus(pos[0]); break;
  case "build": cmdBuild(pos[0]); break;
  case "export": cmdExport(pos[0], pos.slice(1)); break;
  case "catalogue": case "catalog": cmdCatalogue(pos[0]); break;
  case "kit": cmdKit(pos[0], pos[1], pos[2]); break;
  case "world": cmdWorld(pos[0]).catch(e => die("world: " + e.message)); break;
  default: console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^#!.*\n\/\* ?/, ""));
}
