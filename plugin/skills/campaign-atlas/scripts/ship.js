// A ship to walk through (the user's master plan, 26 Oct 2026, part 12: important ships are explorable places, with
// persistent interiors: bridge, crew quarters, cargo holds, engineering, a medical bay, airlocks, maintenance, and rooms
// of their own; the map editors change them after, and what changes is kept). Made by "atlas.js ship" as a place file
// like any other (places/<id>.js): its decks as floors, a corridor down each, rooms on both sides, the bridge in the bow
// and engineering in the stern, a lift through every deck; every room with its guide entry, and a first draft of what is
// aboard (a log to find, someone aboard, and on a big ship its secrets and its dangers) for the council to rewrite.
// A derelict is the same ship gone dark. Deterministic: the same seed makes the same ship.
"use strict";
const hash = s => { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const rng = seed => { let a = hash(seed) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, l) => l[Math.floor(r() * l.length) % l.length];

// each kind of room: its name, floor, furnishing, and what it is, is for, holds, gives up to a search, feels like
const ROOMS = {
  bridge: { n: "Bridge", k: "metal", fx: "office", d: "A curved bank of consoles under the forward viewports; the captain's chair in the middle, the helm and navigation stations either side.", pur: "Where the ship is flown and commanded.", obj: "Helm, navigation and sensor stations, the captain's chair, a chart table.", chk: ["The navigation log shows the last course laid in.", "A sticky note on the helm: a docking code nobody should have.", "The sensor history keeps the last contact before the jump."], atm: "The hum of the consoles, the cold light of the viewports." },
  quarters: { n: "Crew quarters", k: "lino", fx: "dorm", d: "Bunks two high along the walls, lockers between, curtains that never quite close.", pur: "Where the crew sleep.", obj: "Bunks, lockers, personal effects, a shared washbasin.", chk: ["A locker holds letters home, never sent.", "Under a mattress: a stash of contraband stimulants.", "A crewman's diary, the last pages torn out."], atm: "Close air, the smell of other people, someone's music too loud through the wall." },
  captain: { n: "Captain's cabin", k: "carpet-b", fx: "bedroom", d: "The only cabin with a real bed and a desk; a framed picture of a planet the captain has not seen in years.", pur: "The captain's own room.", obj: "A bed, a desk with a terminal, a locked drawer, a bottle half gone.", chk: ["The locked drawer: the real cargo manifest.", "The terminal's last message, unsent.", "A pistol, cleaned and loaded."], atm: "Quiet, warmer than the rest of the ship, a smell of old coffee." },
  galley: { n: "Galley and mess", k: "tile", fx: "kitchen", d: "A cramped galley with a long table bolted down beside it; magnetic plates, a coffee machine older than the ship.", pur: "Where the crew eat and talk.", obj: "Cookers, cold store, a long table, benches, a message board.", chk: ["The message board: a duty rota with one name scratched out.", "The cold store is stocked for twice the crew.", "Behind the coffee machine: a hidden radio."], atm: "Burnt coffee, recycled air, the warmest room aboard." },
  medbay: { n: "Medical bay", k: "tile", fx: "surgery", d: "Two treatment couches under a surgical lamp, a medicine cabinet, a sealed cold locker.", pur: "Where the injured and the sick are treated.", obj: "Couches, an autodoc, the medicine cabinet, a cold locker, a scanner.", chk: ["The autodoc's records: one patient treated three times for the same wound.", "The cold locker holds a sample nobody logged.", "Missing from the cabinet: every sedative."], atm: "Antiseptic sharp in the nose, the steady tick of a monitor." },
  cargo: { n: "Cargo hold", k: "grating", fx: "store", d: "A tall hold of mag-locked crates and pallets, a gantry overhead, a loader parked in the corner.", pur: "Where the cargo travels.", obj: "Crates, pallets, cargo nets, a loader, the gantry.", chk: ["One crate's seals do not match the manifest.", "Scratches on the deck where something heavy was dragged.", "A crate hums faintly, warm to the touch."], atm: "Cold, echoing, the creak of cargo nets as the ship turns." },
  engineering: { n: "Engineering", k: "metal", fx: "boiler", d: "The drive's housing fills the stern: conduits, coolant pipes, a master control station, warning lights.", pur: "Where the drive and the reactor are run.", obj: "The drive housing, reactor controls, coolant pipes, tool racks.", chk: ["The reactor log shows it run past its limits.", "A coolant valve has been tampered with.", "Tools laid out for a repair never finished."], atm: "Heat, a deep throb in the deck plates, ozone." },
  maintenance: { n: "Maintenance bay", k: "grating", fx: "workshop", d: "Workbenches, spare parts in bins, an access hatch into the crawlspaces.", pur: "Where repairs are made.", obj: "Workbenches, parts bins, welding gear, the crawlspace hatch.", chk: ["In the crawlspace: a nest of wiring that is not on any schematic.", "A spare part signed out to someone who left the ship.", "Fresh welds on the inside of the hatch."], atm: "Machine oil, the tick of cooling metal." },
  airlock: { n: "Airlock", k: "metal", fx: "", d: "A narrow chamber between two pressure doors, suits racked on the wall, a cycle panel glowing amber.", pur: "The way in and out of the ship.", obj: "Inner and outer doors, the cycle panel, vacuum suits, tethers.", chk: ["The cycle log: the outer door opened mid-voyage.", "One suit is missing.", "Frost on the inner door, as if it was opened in a hurry."], atm: "The hiss of air, the cold of the outer door." },
  lift: { n: "Lift", k: "metal", fx: "", d: "A small lift car and a ladder beside it, running through every deck.", pur: "The way between the decks.", obj: "The lift car, a ladder, deck buttons.", chk: ["Scuff marks on the ladder rungs, recent.", "The lift's log: someone rode it at 03:00.", "A keycard left in the slot."], atm: "The whine of the lift motor." },
  lab: { n: "Laboratory", k: "tile", fx: "lab", d: "Clean benches, sample freezers, an isolation box with gloves set into it.", pur: "Where samples are studied.", obj: "Benches, freezers, a microscope, the isolation box.", chk: ["The isolation box's seal has been breached and resealed.", "Notes in a hand that grows worse page by page.", "A freezer set far colder than its label says."], atm: "The hum of freezers, a faint sweet smell." },
  armory: { n: "Armoury", k: "metal", fx: "store", d: "Racks behind a locked cage: rifles, sidearms, a breaching charge.", pur: "Where weapons are kept.", obj: "Weapon racks, ammunition lockers, the cage.", chk: ["Two rifles signed out and never returned.", "The cage lock has been forced.", "A charge missing from its slot."], atm: "Gun oil, the tick of the cage's lock." },
  brig: { n: "Brig", k: "metal", fx: "cell", d: "Two small cells behind a force door; a bench and a drain in each.", pur: "Where prisoners are held.", obj: "Two cells, the door controls, restraints.", chk: ["Scratched into a cell wall: a name and a date.", "The door log: a cell opened from inside.", "A meal tray, untouched."], atm: "Silence, and the hum of the force door." },
  hydroponics: { n: "Hydroponics", k: "grating", fx: "", d: "Trays of greens under violet light, water ticking through tubes.", pur: "Where food and air are grown.", obj: "Grow trays, pumps, lamps, nutrient tanks.", chk: ["A tray of something that is not on the planting list.", "The nutrient mix has been changed by hand.", "Roots growing into the drain."], atm: "Wet, warm, green-smelling, violet light." },
  comms: { n: "Communications", k: "metal", fx: "office", d: "A cramped room of transmitters and a long-range dish control.", pur: "Where messages go out and come in.", obj: "Transmitters, the dish controls, a logging station.", chk: ["A message received and deleted, recoverable.", "The beacon was switched off by hand.", "A frequency written on the wall."], atm: "Static, the glow of signal meters." },
  observation: { n: "Observation lounge", k: "carpet-b", fx: "parlour", d: "A long window onto the stars, low chairs, a bar that was once well stocked.", pur: "Where the crew rest.", obj: "The window, chairs, the bar, a game board mid-game.", chk: ["The game board's last move.", "A glass with lipstick on it.", "Something written in the condensation on the glass."], atm: "The stars wheeling slowly past; the quietest room aboard." },
  lifesupport: { n: "Life support", k: "grating", fx: "", d: "Scrubbers, air tanks and water recyclers packed floor to ceiling.", pur: "What keeps everyone breathing.", obj: "Scrubbers, tanks, recyclers, a status board.", chk: ["One scrubber has been taken offline.", "The air mix is a little rich in something.", "A filter clogged with something organic."], atm: "The roar of fans, a dry metallic air." },
  storage: { n: "Stores", k: "metal", fx: "store", d: "Shelves of rations, spares and medical supplies, netted in.", pur: "The ship's supplies.", obj: "Shelves, rations, spares, a supply terminal.", chk: ["The supply terminal shows rations going faster than the crew can eat.", "A sealed case with no label.", "Someone has been sleeping behind the shelves."], atm: "Close, dim, the smell of cardboard and plastic." }
};
const DECK_NAMES = ["COMMAND DECK", "CREW DECK", "CARGO DECK", "ENGINEERING DECK", "LOWER HOLD"];
const PLANS = {
  // what each deck holds, beyond the corridor and the lift: deck 0 has the bridge in the bow and an airlock
  small: [["captain", "quarters", "galley", "medbay", "maintenance", "storage", "comms", "cargo", "lifesupport"]],
  medium: [["captain", "quarters", "galley", "medbay", "comms", "observation", "quarters", "storage"], ["cargo", "cargo", "maintenance", "lifesupport", "lab", "armory", "hydroponics", "storage"]],
  large: [["captain", "comms", "observation", "medbay", "quarters", "armory", "galley", "quarters"], ["quarters", "quarters", "lab", "hydroponics", "storage", "brig", "galley", "lifesupport", "maintenance"], ["cargo", "cargo", "cargo", "maintenance", "storage", "lifesupport", "lab", "storage"]]
};

function makeShip(o) {
  const r = rng(o.seed), size = PLANS[o.size] ? o.size : "medium", decks = Math.max(1, Math.min(5, +o.decks || PLANS[size].length));
  const W = { small: 30, medium: 36, large: 42 }[size] + Math.max(0, decks - PLANS[size].length) * 2, H = 15, c0 = 6, plan = [];
  for (let d = 0; d < decks; d++) plan.push((PLANS[size][d] || PLANS[size][PLANS[size].length - 1]).slice());
  if (o.extra) for (const k of o.extra) if (ROOMS[k]) plan[Math.min(decks - 1, 1)].push(k);
  if (decks === 1) plan[0].unshift("airlock");
  const floors = [], rooms = {}, entry = []; let rn = 1, lastId = 0;
  const sternW = 6, bowW = 6, liftX = 1 + sternW;
  for (let d = 0; d < decks; d++) {
    const F = { n: DECK_NAMES[d] || "DECK " + (d + 1), w: W, h: H, R: [], D: [], I: [], ST: [], M: [], P: [] };
    const add = (kind, x, y, w, h, extra) => { const id = "R" + rn++, R = ROOMS[kind]; if (kind === "airlock" && d === 0 && !entry.length) entry.push(id); F.R.push([id, x, y, w, h, R.n, R.k, Object.assign({ nw: kind === "bridge" || kind === "observation" ? 0 : 1 }, R.fx ? { fx: R.fx } : {}, extra || {})]); rooms[id] = { kind }; return id; };
    // the corridor down the middle, the stern (engineering on the lowest deck, else rooms), the bow (the bridge on deck 0)
    const xs = 1 + sternW, xe = W - 1 - bowW;
    // (on every deck but the lowest the corridor runs right aft, between the two stern rooms)
    const cx0 = d === decks - 1 ? xs : 1, cor = "R" + rn++; F.R.push([cor, cx0, c0, xe - cx0, 2, d === 0 ? "Main corridor" : "Corridor", "grating", { nw: 1 }]); rooms[cor] = { kind: "corridor", deck: d };
    if (d === decks - 1) { const e = add("engineering", 1, 2, sternW, H - 4); F.D.push([xs, c0, "v", "dd", 2]); }
    else { const s1 = add(d === 0 ? "airlock" : "storage", 1, 2, sternW, c0 - 2), s2 = add(d === 0 ? "maintenance" : "lifesupport", 1, c0 + 2, sternW, H - 4 - c0); F.D.push([3, c0, "h", d === 0 ? "dd" : "d", d === 0 ? 2 : 1]); F.D.push([3, c0 + 2, "h", "d", 1]); }
    if (d === 0) { add("bridge", xe, 3, bowW, H - 6, { nw: 0 }); F.D.push([xe, c0, "v", "dd", 2]); }
    else { add(pick(r, ["observation", "comms", "hydroponics"]), xe, 3, bowW, H - 6); F.D.push([xe, c0, "v", "d", 1]); }
    // the lift through every deck, in the upper band
    const lift = add("lift", liftX, 2, 3, c0 - 2); F.D.push([liftX + 1, c0, "h", "d", 1]);
    // (each pair of stairs on the same squares on both its decks: the pair to the deck above at one side, below at the other)
    if (d > 0) F.ST.push(["L" + d, liftX + (d % 2), 2, 1, 2, "up", floors[d - 1].n, "n", "Lift and ladder"]);
    if (d < decks - 1) F.ST.push(["L" + (d + 1), liftX + ((d + 1) % 2), 2, 1, 2, "down", DECK_NAMES[d + 1] || "DECK " + (d + 2), "s", "Lift and ladder"]);
    // rooms on both sides, filled from the stern forward, each with a door onto the corridor
    const want = plan[d].slice(), last = {}; let up = liftX + 3, lo = xs;
    const fill = (top) => { let x = top ? up : lo; const y = top ? 2 : c0 + 2, h = top ? c0 - 2 : H - 4 - c0; while (want.length && x < xe - 2) { const kind = want.shift(), wd = Math.min(xe - x, kind === "cargo" ? 7 + Math.floor(r() * 3) : kind === "quarters" || kind === "lab" ? 5 + Math.floor(r() * 2) : 4 + Math.floor(r() * 2)); if (wd < 3) { want.unshift(kind); break; } add(kind, x, y, wd, h); last[top] = F.R.length - 1; F.D.push([x + Math.floor(wd / 2), top ? c0 : c0 + 2, "h", kind === "cargo" ? "dd" : "d", kind === "cargo" ? 2 : 1]); x += wd; } if (top) up = x; else lo = x; return x; };
    // (alternate sides so both fill evenly)
    let guard = 0; while (want.length && guard++ < 40) { const before = want.length; if (lo <= up) fill(false); else fill(true); if (want.length === before) { if (lo < xe - 2) fill(false); else if (up < xe - 2) fill(true); else break; } }
    // whatever space is left on either side: a sliver goes to the room beside it, the rest into stores and maintenance
    // bays of a sensible size
    for (const [x0, top] of [[up, true], [lo, false]]) {
      let x = x0, wd = xe - x, alt = 0; const y = top ? 2 : c0 + 2, h = top ? c0 - 2 : H - 4 - c0;
      if (wd > 0 && wd < 3 && last[top] != null) { F.R[last[top]][3] += wd; continue; }
      while (wd > 0) { const c = wd >= 9 ? 5 : wd, kind = (top ? ["storage", "maintenance"] : ["maintenance", "storage"])[alt++ % 2]; add(kind, x, y, c, h); last[top] = F.R.length - 1; F.D.push([x + Math.floor(c / 2), top ? c0 : c0 + 2, "h", "d", 1]); x += c; wd -= c; }
    }
    F.note = d === 0 ? "The command deck: the bridge forward, the way aboard aft through the airlock, the lift amidships." : d === decks - 1 ? "The lowest deck: the drive and engineering fill the stern." : "A working deck between the others: crew spaces, stores and systems along one corridor.";
    floors.push(F);
  }
  return { floors, rooms, entry, W, H };
}

// the words: each room's guide entry, varied by the seed; a derelict is dark, cold and broken
function words(o, S) {
  const r = rng(o.seed + "|words"), ship = o.name, dead = o.derelict, out = {};
  for (const [id, x] of Object.entries(S.rooms)) {
    if (x.kind === "corridor") { out[id] = { d: dead ? "A long corridor in darkness, emergency strips glowing at ankle height, doors hanging half open." : "The ship's spine: a grated corridor running the length of the deck, conduit overhead, doors on either side.", pur: "The way along the deck.", obj: "Deck grating, conduit, emergency lockers, a deck plan by the lift.", chk: dead ? "Footprints in the frost on the grating, one set, going forward." : "An emergency locker has been emptied.", atm: dead ? "Your breath clouds; something knocks in the walls, far off." : "Footsteps ringing on the grating, the ship's constant hum.", kp: "Encounters on this deck come down this corridor first." }; continue; }
    const R = ROOMS[x.kind], d = dead ? R.d.replace(/\.$/, "") + pick(r, [", now dark and frozen.", "; the lights are dead and something has been through here.", ", half the panels torn open and dark."]) : R.d;
    out[id] = { d, pur: R.pur, obj: R.obj, chk: pick(r, R.chk), atm: dead ? pick(r, ["Cold enough to see your breath; only your own lights.", "Silence, but for the hull ticking as it cools.", "A faint, steady drip somewhere in the dark."]) : R.atm, kp: `A draft: make this ${R.n.toLowerCase()} matter to the story, or let the players pass through it quickly.` };
  }
  return out;
}

module.exports.makeShipPlace = function (o) {
  const S = makeShip(o), rw = words(o, S), dead = o.derelict, byKind = k => Object.keys(S.rooms).filter(id => S.rooms[id].kind === k);
  const bridge = byKind("bridge")[0], med = byKind("medbay")[0] || byKind("quarters")[0], cargo = byKind("cargo")[0] || byKind("storage")[0], eng = byKind("engineering")[0], air = S.entry[0];
  // the first draft of what is aboard: for the council to rewrite into the story
  const clues = { C1: { t: dead ? "The last log" : "The ship's log", at: bridge, k: "digital", d: dead ? "The final entries, each shorter than the last, then a long recording of breathing." : "The voyage so far, with an entry deleted the night before arrival.", how: "Reading the helm's log.", rev: "A draft: what really happened aboard.", hint: "The helm screen is still lit.", roll: "Computer Use" } };
  const npcs = { N1: { n: dead ? "A survivor, half frozen" : "The ship's pilot", at: dead ? med : bridge, look: dead ? "Gaunt, wrapped in foil blankets, eyes that will not settle." : "Lean, quick, a flight jacket older than the ship.", manner: dead ? "Starts at every sound; talks too fast, then not at all." : "Easy until asked about the last run.", bg: "A draft: who they are and why they are here.", ties: { "The captain": "a draft: how they know each other" }, doing: dead ? "Hiding in the dark." : "Running checks that do not need running.", knows: "A draft: what they saw.", want: "To get off this ship." } };
  const secrets = {}, enc = {};
  if (o.tier <= 2 || o.size === "large") {
    npcs.N2 = { n: "The quartermaster", at: cargo, look: "Broad, tattooed, a clipboard held like a weapon.", manner: "Gruff; counts everything twice.", bg: "A draft: who they are and what they owe.", ties: { "The captain": "a draft" }, doing: "Recounting the crates.", knows: "That the cargo is not what the papers say.", want: "Their cut." };
    clues.C2 = { t: "The real manifest", at: cargo, k: "document", d: "A second manifest, folded small: the cargo is not what the papers say.", how: "Searching the hold.", rev: "A draft: what the cargo is.", hint: "One crate's seals do not match.", roll: "Spot Hidden" };
    clues.C3 = { t: "The engineer's note", at: eng || med, k: "document", d: "A note taped inside a panel: 'Do not run her past ninety. I mean it.'", how: "Opening the panel.", rev: "A draft: someone knew the ship was failing.", hint: "Fresh tape on one panel.", roll: "Mechanical Repair" };
    enc.E1 = { t: dead ? "Something in the vents" : "A stowaway", at: byKind("maintenance")[0] || cargo, d: dead ? "Scratching that follows the party through the ducts, always one room ahead." : "Someone hiding among the stores, who bolts when found." };
    secrets.S1 = { t: "A smuggler's compartment", at: cargo, acc: "A deck plate under the loader lifts on hidden hinges.", dest: "A crawlspace under the hold, big enough for three people or a lot of contraband.", why: "A draft: whose it is and what is in it." };
  }
  if (o.tier === 1) {
    clues.C4 = { t: "The medical record", at: med, k: "digital", d: "One patient treated three times for the same wound, each time under another name.", how: "Reading the autodoc's records.", rev: "A draft.", hint: "The autodoc blinks a warning.", roll: "Medicine" };
    clues.C5 = { t: "The airlock cycle", at: air, k: "digital", d: "The outer door opened mid-voyage, with nobody logged in the suits.", how: "Reading the cycle panel.", rev: "A draft: who went out, or what came in.", hint: "Frost on the inner door.", roll: "Computer Use" };
    npcs.N2 = { n: "The ship's intelligence", at: bridge, look: "A voice and a pulse of light on every console.", manner: "Polite, precise, and evasive about one night.", bg: "A draft.", ties: { "The captain": "a draft" }, doing: "Watching.", knows: "Everything on its sensors, and what it was told to forget.", want: "To keep the ship whole." };
    npcs.N3 = { n: "The ship's doctor", at: med, look: "Neat, tired, gloves always on.", manner: "Kind to patients, short with everyone else.", bg: "A draft.", ties: { "The captain": "a draft" }, doing: "Restocking the cabinet, slowly.", knows: "Who was treated, and for what.", want: "To be paid and to forget this run." };
    enc.E2 = { t: dead ? "The drive wakes" : "A hull breach", at: eng || cargo, d: dead ? "The reactor restarts on its own, and every door on the deck seals." : "A seam gives way; pressure doors slam and the party is on the wrong side." };
    secrets.S2 = { t: "The sealed lab", at: byKind("lab")[0] || med, acc: "A panel behind the freezers, opened with the captain's code.", dest: "A second, smaller laboratory that is on no schematic.", why: "A draft: what was studied there." };
  }
  const used = {};
  for (const [list, ents] of [["C", clues], ["N", npcs], ["S", secrets], ["E", enc]]) for (const [mid, e] of Object.entries(ents)) {
    for (const F of S.floors) { const R = F.R.find(r => r[0] === e.at); if (!R) continue; const k = used[e.at] = (used[e.at] || 0) + 1, off = [[0, 0], [1, 0], [-1, 0], [0, 1], [1, 1]][(k - 1) % 5];
      F.M.push([mid, Math.min(R[1] + R[3] - .5, Math.max(R[1] + .5, R[1] + R[3] / 2 + off[0])), Math.min(R[2] + R[4] - .5, Math.max(R[2] + .5, R[2] + R[4] / 2 + off[1]))]); break; }
  }
  const map = { ov: `${o.name}: ${{ small: "a small ship", medium: "a ship of middling size", large: "a large ship" }[o.size] || "a ship"} of ${S.floors.length} deck${S.floors.length > 1 ? "s" : ""}${dead ? ", found adrift and dark" : ""}. Every word here is a draft for the council to make part of the story.`,
    run: dead ? "Run it slowly: darkness, cold, sounds ahead, and the log that explains too late." : "Let the players move freely; the crew are busy and the ship has corners nobody watches.",
    ext: dead ? `${o.name} hangs dark against the stars, turning slowly; no running lights, and a long scar along the hull.` : `${o.name}: a working hull, scarred and patched, her name stencilled by the airlock in letters worn half away.`,
    entry: S.entry, start: 0, compass: false, floors: S.floors, rooms: rw, clues, npcs, secrets, enc };
  map.facility = null;
  return { map, facility: dead ? { power: "down", oxygen: "failing", pressure: "strained", temperature: "failing", contamination: "strained", security: "failing", structure: "strained", comms: "down", emergency: "failing" } : true, size: S.floors.length + " deck" + (S.floors.length > 1 ? "s" : "") + " of " + S.W + "x" + S.H, rooms: Object.keys(S.rooms).length };
};
module.exports.ROOMS = Object.keys(ROOMS);
