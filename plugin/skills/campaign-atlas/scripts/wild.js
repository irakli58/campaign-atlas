// The wild (the user's master plan, 26 Oct 2026, part 14: forests, mountains, deserts, swamps, jungles, tundra, plains,
// coasts, alien and hostile planetary surfaces; traversable ground, trails, rivers, landmarks, hidden places, ruins,
// camps, wildlife, hazards, encounters, weather, things to find). Made by "atlas.js wild" as a place like any other
// (places/<id>.js): one stretch of country at the campaign's own scale (the world map is for the long journeys), its
// ground laid in patches by the land, a trail across it, a river where the land has one, its landmarks as rooms with
// their guide entries (a ruin, a camp, a cave mouth, a hidden place), and a first draft of who and what is out there.
// The same seed makes the same country.
"use strict";
const hash = s => { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const rng = seed => { let a = hash(seed) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, l) => l[Math.floor(r() * l.length) % l.length];

// each land: its ground, its patches (kind and how much), whether a river runs, its trail, its landmarks, its words
const BIOMES = {
  forest: { base: "grass", patches: [["forest", .5], ["mud", .06]], river: .6, trail: "yard", sites: ["ruin", "camp", "cave", "shrine", "cabin"], name: "The forest",
    ext: "Old trees close over a narrow trail; light comes down in pieces.", weather: ["Rain dripping from the canopy for hours after it stops", "Mist in the hollows till noon", "A still, hot afternoon; insects loud", "Wind in the crowns, nothing at the ground", "A cold snap; frost on the ferns", "Thunder, and then a downpour"], life: ["A stag that does not run", "Wolves following at a distance", "Crows that gather where the party stops", "A boar in the undergrowth", "Tracks of something heavy, going round in circles", "Silence where the birds should be"] },
  mountains: { base: "gravel", patches: [["rock", .28], ["snow", .14], ["chasm", .05]], river: .3, trail: "yard", sites: ["ruin", "camp", "cave", "tower"], name: "The heights",
    ext: "A pass between grey shoulders of rock; scree below, snow above.", weather: ["Cloud coming down the pass in an hour", "A wind that knocks people over at the saddle", "Sun on snow: blinding", "Sleet", "A clear, freezing night", "Rockfall in the warm afternoon"], life: ["Goats on ledges no one could reach", "A great bird circling", "Something's bones, picked clean", "A bear's den by the trail", "Tracks in the snow that end at a cliff", "An avalanche's long white scar"] },
  desert: { base: "sand", patches: [["rock", .16], ["gravel", .2]], river: .08, trail: "sand", sites: ["ruin", "camp", "shrine", "well"], name: "The waste",
    ext: "Dunes and stone under a white sky; the trail is only where the camels went.", weather: ["Heat that shimmers the horizon", "A sandstorm on the horizon by afternoon", "A cold, starlit night", "Dry wind that cracks the lips", "A rare, violent rain: the wadis run", "Haze; the sun a red coin"], life: ["Vultures", "A scorpion in a boot", "Jackals at the camp's edge", "A snake in the shade of the only rock", "A caravan's tracks, days old", "Bones of a camel, and its saddlebags"] },
  swamp: { base: "mud", patches: [["water", .3], ["forest", .2], ["grass", .1]], river: .5, trail: "boards", sites: ["ruin", "camp", "shrine", "cabin"], name: "The marsh",
    ext: "Black water between hummocks of reed and drowned trees; a plank way, half sunk.", weather: ["Fog so thick a torch makes it worse", "Steaming heat and biting flies", "Rain on the water, endless", "A cold mist at dawn", "Will-o'-the-wisps at dusk", "Thunder rolling over the flats"], life: ["Leeches", "A heron that watches", "Something large moving under the water", "Frogs that fall silent all at once", "A drowned body caught in the roots", "Eels in the channel"] },
  jungle: { base: "forest", patches: [["grass", .14], ["mud", .12], ["water", .06]], river: .7, trail: "yard", sites: ["ruin", "camp", "shrine", "cave"], name: "The jungle",
    ext: "Green walls on every side; the trail is a tunnel cut with blades and already closing.", weather: ["Rain, hot as bathwater", "Steam rising after the rain", "A breathless noon", "A storm that turns the river brown", "Nights loud with frogs", "Mist in the canopy"], life: ["Monkeys pelting fruit", "A snake as thick as a thigh", "Ants on the march", "A jaguar's cough in the dark", "Biting flies", "A carved idol overgrown with vines"] },
  tundra: { base: "snow", patches: [["ice", .2], ["gravel", .14], ["rock", .06]], river: .2, trail: "snow", sites: ["ruin", "camp", "cave", "cairn"], name: "The white country",
    ext: "Snow to the edge of the sky, and a line of cairns that once marked a way.", weather: ["A whiteout by noon", "A clear sky and killing cold", "Wind that drifts the snow over every track", "The aurora at night", "A thaw: the ice groans", "Freezing fog"], life: ["Wolves", "A white bear on the ice", "Ravens following", "A herd of something moving far off", "A frozen traveller under the snow", "Tracks that do not belong to any beast here"] },
  plains: { base: "grass", patches: [["forest", .1], ["mud", .04]], river: .55, trail: "yard", sites: ["ruin", "camp", "tower", "shrine", "cabin"], name: "The open country",
    ext: "Grass to the horizon, a lone tree, and the road running straight toward it.", weather: ["Big skies, a hot wind", "A line of storms walking across the plain", "Grass fire smoke on the horizon", "A cool, bright morning", "Hail", "A wind that never stops"], life: ["Horses running free", "A hawk over the grass", "Riders, far off, watching", "A snake on the warm road", "Cattle with no herder", "Larks rising"] },
  coast: { base: "grass", patches: [["forest", .1], ["rock", .08]], sea: true, river: .3, trail: "yard", sites: ["ruin", "camp", "cave", "tower"], name: "The coast",
    ext: "Cliffs and coves; the sea grey and loud, a path along the edge.", weather: ["A sea fog rolling in", "Spray and a hard onshore wind", "A bright, clear day, the sea calm", "A storm driving the waves into the caves", "Rain off the sea", "The tide very low: rocks never seen"], life: ["Gulls screaming over something", "Seals on the rocks", "A wreck's timbers on the sand", "Crabs in every pool", "Smugglers' lights in a cove", "Something left by the tide"] },
  alien: { base: "sand", patches: [["crystal", .2], ["fungus", .16], ["blight", .1]], river: .3, trail: "yard", sites: ["ruin", "camp", "crash", "cave"], name: "The alien ground",
    ext: "A violet sky over ground that crunches like glass; growths taller than a person sway with no wind.", weather: ["The sky turns green before the storms", "Spores thick as snow", "Two suns, and no shade", "A rain that hisses on the suits", "Night that lasts thirty hours", "Electrical haze; the comms fail"], life: ["Swarms of something like insects", "Growths that turn to follow movement", "A beast with too many joints, grazing", "Shed skins as big as a tent", "Something singing under the ground", "Tracks of a vehicle that is not ours"] },
  hostile: { base: "gravel", patches: [["basalt", .3], ["lava", .07], ["chasm", .05], ["rock", .14]], river: 0, trail: "yard", sites: ["crash", "camp", "ruin", "cave"], name: "The surface",
    ext: "Black rock and red glow; the ground trembles, and the suit's warnings never quite stop.", weather: ["A quake every few hours", "Ash falling like snow", "Heat beyond the suits' limits in the sun", "A storm of acid", "Gas venting from the cracks", "Clear: the stars hard and close"], life: ["Nothing alive, and then something", "A mineral that moves", "A dead survey drone", "Microbes eating the boots' soles", "Signals from a ruin", "Wreckage of an earlier landing"] }
};
// a landmark: a room (or a few) with its guide entry
const SITES = {
  ruin: { n: "The ruin", k: "stone", b: "ruin", w: [7, 10], h: [5, 7], d: "Broken walls of dressed stone, roofless, a doorway still standing.", pur: "What is left of something built here long ago.", obj: "Fallen blocks, a hearth, carvings worn smooth.", chk: ["Under the hearthstone, a sealed box.", "A carving that matches something elsewhere.", "Fresh ashes in the old hearth."], atm: "Wind through the empty windows; a raven on the wall." },
  camp: { n: "The camp", k: "straw", w: [3, 4], h: [3, 3], tents: 3, d: "Tents round a fire pit, the ashes still warm.", pur: "Where someone stops for the night.", obj: "Bedrolls, packs, a cooking pot, a lean-to.", chk: ["A map with a route marked.", "A diary, the last entry unfinished.", "Too many bedrolls for the people here."], atm: "Smoke, and the smell of old food." },
  cave: { n: "Cave mouth", k: "cave", w: [4, 5], h: [3, 4], d: "A dark opening in the rock, cold air breathing out of it.", pur: "The way down into the ground.", obj: "Rock, old soot on the roof, a rusted lamp.", chk: ["Tracks going in, none coming out.", "Marks scratched by the entrance.", "A rope tied off inside, cut."], atm: "Cold air on the face; a drip somewhere far in." },
  shrine: { n: "The shrine", k: "stone", b: "ruin", w: [4, 5], h: [4, 4], d: "A small stone shrine, its offering bowl not empty.", pur: "A holy place of the people who live here, or did.", obj: "An altar, an offering bowl, a weathered figure.", chk: ["The offerings are fresh.", "A name scratched into the altar.", "Something buried under the bowl."], atm: "Quiet, as if the wind went round it." },
  cabin: { n: "The cabin", k: "boards", w: [5, 6], h: [4, 5], d: "A log cabin, its door off one hinge.", pur: "Someone's home, once.", obj: "A cot, a stove, traps on the wall, a table.", chk: ["Food on the table, weeks old.", "A trapdoor under the cot.", "Claw marks on the inside of the door."], atm: "Damp wood and old smoke." },
  tower: { n: "The watchtower", k: "stone", b: "ruin", w: [4, 5], h: [4, 5], d: "A squat stone tower, its stair still climbable.", pur: "A lookout over the country around.", obj: "A stair, a broken signal brazier, arrow slits.", chk: ["From the top, smoke in the distance.", "A bundle of signal flags.", "Initials and a date carved on the parapet."], atm: "Wind; the whole country laid out below." },
  well: { n: "The well", k: "stone", b: "ruin", w: [4, 4], h: [4, 4], d: "A walled well, the rope long gone.", pur: "Water, if there is any.", obj: "A stone rim, a broken windlass, buckets.", chk: ["Something shines at the bottom.", "The water is poisoned.", "A ladder goes down past the water."], atm: "A cool breath from below." },
  cairn: { n: "The cairn", k: "gravel", w: [3, 4], h: [3, 3], d: "A man-high pile of stones, a marker or a grave.", pur: "Marks a way, or a burial.", obj: "Stones, a carved post, frozen offerings.", chk: ["A message tucked between the stones.", "Bones under the top stones.", "It points somewhere no trail goes."], atm: "Wind keening over it." },
  crash: { n: "The crash site", k: "metal", w: [7, 9], h: [4, 5], d: "A broken hull half buried, its hatch blown open.", pur: "What came down here.", obj: "Torn plating, a cockpit, scattered cargo, a beacon.", chk: ["The beacon still blinks.", "The flight recorder is missing.", "The hatch was opened from outside."], atm: "Ticking metal, a smell of burned insulation." }
};

function makeWild(o) {
  const B = BIOMES[o.biome] || BIOMES.forest, r = rng(o.seed), W = { small: 40, medium: 56, large: 72 }[o.size] || 56, H = Math.round(W * .7), F = { n: "THE LAND", w: W, h: H, out: 1, R: [], D: [], I: [], ST: [], M: [], P: [] }, rooms = {}, guide = {};
  // value noise, so patches come in clumps rather than salt and pepper
  const nz = (() => { const g = {}, at = (x, y) => { const k = x + "," + y; if (!(k in g)) g[k] = rng(o.seed + "|" + k)(); return g[k]; }, s = t => t * t * (3 - 2 * t); return (x, y, sc) => { const X = x / sc, Y = y / sc, x0 = Math.floor(X), y0 = Math.floor(Y), fx = s(X - x0), fy = s(Y - y0), a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }; })();
  const grid = Array.from({ length: H }, () => Array(W).fill(B.base)), cell = 2;
  // the patches, each a band of the noise; the sea along one edge of a coast
  B.patches.forEach(([k, amt], pi) => { for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) { const v = nz(x + pi * 97, y + pi * 61, 7 + pi * 2); if (v > 1 - amt * 1.4) for (let j = y; j < Math.min(H, y + cell); j++) for (let i = x; i < Math.min(W, x + cell); i++) grid[j][i] = k; } });
  if (B.sea) { for (let x = 0; x < W; x++) { const shore = Math.round(H * .22 + Math.sin(x / 6) * 2 + nz(x, 3, 5) * 4); for (let y = 0; y < shore; y++) grid[y][x] = "water"; for (let y = shore; y < shore + 2; y++) if (y < H) grid[y][x] = "sand"; } }
  // a river across, from one side to the other
  const riverY = []; if (r() < B.river) { let y = Math.round(H * (.35 + r() * .3)); for (let x = 0; x < W; x++) { y += Math.round((nz(x, 77, 6) - .5) * 2.2); y = Math.max(3, Math.min(H - 5, y)); riverY[x] = y; for (let j = y; j < y + 2 + (x % 7 === 0 ? 1 : 0); j++) grid[j][x] = "river"; } }
  // the landmarks, spread out
  // (always a camp: someone is out here; the rest as the land has them)
  const sites = [], want = Math.max(3, Math.min(5, { small: 3, medium: 4, large: 5 }[o.size] || 4)), order = ["camp"].concat(B.sites.filter(k => k !== "camp").sort(() => r() - .5));
  const free = (x, y, w, h) => x >= 2 && y >= 2 && x + w <= W - 2 && y + h <= H - 2 && !sites.some(s => x < s.x + s.w + 4 && x + w + 4 > s.x && y < s.y + s.h + 4 && y + h + 4 > s.y) && (() => { for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) if (/river|water|chasm|lava/.test(grid[j] && grid[j][i])) return false; return true; })();
  const placeSite = kind => {
    const S0 = SITES[kind === "hidden" ? pick(r, ["ruin", "cave", "shrine"]) : kind], w = S0.w[0] + Math.floor(r() * (S0.w[1] - S0.w[0] + 1)), h = S0.h[0] + Math.floor(r() * (S0.h[1] - S0.h[0] + 1));
    for (let tries = 0; tries < 200; tries++) { const x = 2 + Math.floor(r() * (W - w - 4)), y = 2 + Math.floor(r() * (H - h - 4)); if (free(x, y, kind === "camp" ? w * 3 + 2 : w, h)) { sites.push({ kind, S0, x, y, w: kind === "camp" ? w * 3 + 2 : w, h, tw: w }); return true; } }
    return false;
  };
  for (const kind of order.slice(0, want).concat(o.hidden !== false ? ["hidden"] : [])) placeSite(kind);
  // (six rooms at least, a place's least: small landmarks where the land had room for no more of the large)
  const roomsSoFar = () => sites.reduce((n, s) => n + (s.kind === "camp" ? 3 : 1), 0);
  for (let k = 0; roomsSoFar() < 6 && k < 12; k++) placeSite(pick(r, ["shrine", "cairn", "well", "tower"]));
  // the trail: from the west edge to the east, passing by each landmark's door; a bridge where it crosses the river
  const pts = [[0, Math.round(H * .6)]].concat(sites.filter(s => s.kind !== "hidden").sort((a, b) => a.x - b.x).map(s => [s.x + Math.floor(s.w / 2), s.y + s.h + 1])).concat([[W - 1, Math.round(H * .45)]]);
  const trail = new Set(), lay = (x, y) => { for (let j = y; j < y + 2; j++) for (let i = x; i < x + 2; i++) if (j >= 0 && j < H && i >= 0 && i < W) trail.add(i + "," + j); };
  for (let k = 1; k < pts.length; k++) { let [x, y] = pts[k - 1]; const [tx, ty] = pts[k]; while (x !== tx || y !== ty) { lay(x, y); if (x !== tx && (r() < .65 || y === ty)) x += Math.sign(tx - x); else y += Math.sign(ty - y); } lay(tx, ty); }
  for (const key of trail) { const [i, j] = key.split(",").map(Number); if (grid[j][i] === "river") grid[j][i] = "bridge"; else if (!/water/.test(grid[j][i])) grid[j][i] = B.trail; }
  // every bit of open ground joined to the trail: the ground before each landmark's door kept open, a way cut to any
  // that rock, chasm or lava shut in, and what is still shut in made rock (so nothing on the map is out of reach)
  const pass = k => !/^(rock|chasm|lava)$/.test(k), soft = pass(B.base) ? B.base : "gravel", N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const under = new Set(); for (const s of sites) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) under.add(i + "," + j);
  const aprons = []; for (const s of sites) { if (s.kind === "camp") for (let t = 0; t < 3; t++) aprons.push([s.x + t * (s.tw + 1) + Math.floor(s.tw / 2), s.y + s.h]); else aprons.push([s.x + Math.floor(s.w / 2), s.y + s.h]); }
  for (const [x, y] of aprons) if (y < H && !pass(grid[y][x])) grid[y][x] = soft;
  const flood = () => { const seen = new Set(), q = [...trail].filter(k => { const [i, j] = k.split(",").map(Number); return pass(grid[j][i]); }); q.forEach(k => seen.add(k)); while (q.length) { const [i, j] = q.pop().split(",").map(Number); for (const [di, dj] of N4) { const a = i + di, b = j + dj, k = a + "," + b; if (a >= 0 && b >= 0 && a < W && b < H && !seen.has(k) && !under.has(k) && pass(grid[b][a])) { seen.add(k); q.push(k); } } } return seen; };
  let reached = flood();
  for (const [x, y] of aprons) if (y < H && !reached.has(x + "," + y)) {
    // the shortest way through anything to ground already reached, made passable
    const prev = new Map([[x + "," + y, null]]), q = [[x, y]]; let end = null;
    while (q.length && !end) { const [i, j] = q.shift(); for (const [di, dj] of N4) { const a = i + di, b = j + dj, k = a + "," + b; if (a < 0 || b < 0 || a >= W || b >= H || prev.has(k) || under.has(k)) continue; prev.set(k, i + "," + j); if (reached.has(k)) { end = k; break; } q.push([a, b]); } }
    for (let k = end; k; k = prev.get(k)) { const [i, j] = k.split(",").map(Number); if (!pass(grid[j][i])) grid[j][i] = soft; }
    reached = flood();
  }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (pass(grid[j][i]) && !reached.has(i + "," + j) && !under.has(i + "," + j)) grid[j][i] = "rock";
  // the ground as rectangles: runs along each row of one kind (the base first, under everything)
  F.R.push(["g", 0, 0, W, H, "", B.base, { nw: 1 }]); let gi = 0;
  for (let y = 0; y < H; y++) { let x = 0; while (x < W) { const k = grid[y][x]; let e = x; while (e < W && grid[y][e] === k) e++; if (k !== B.base) F.R.push(["g" + (++gi), x, y, e - x, 1, "", k, { nw: 1 }]); x = e; } }
  // the landmarks as rooms; each opens to the ground (a hidden one only by a secret way)
  let rn = 1; const at = {};
  for (const s of sites) {
    const S0 = s.S0, hid = s.kind === "hidden";
    if (s.kind === "camp") { for (let t = 0; t < 3; t++) { const id = "R" + rn++, x = s.x + t * (s.tw + 1); F.R.push([id, x, s.y, s.tw, s.h, t ? "Tent" : S0.n, S0.k, { nw: 1 }]); rooms[id] = { kind: "camp", tent: t }; F.D.push([x + Math.floor(s.tw / 2), s.y + s.h, "h", "a", 1]); if (!t) at.camp = id; } continue; }
    const id = "R" + rn++; F.R.push([id, s.x, s.y, s.w, s.h, hid ? S0.n.replace(/^The /, "The hidden ") : S0.n, S0.k, Object.assign({ nw: 1 }, S0.b ? { b: S0.b } : {}, hid ? { h: 1 } : {})]); rooms[id] = { kind: hid ? "hidden" : s.kind, S0 };
    F.D.push([s.x + Math.floor(s.w / 2), s.y + s.h, "h", hid ? "s" : S0.b ? "a" : "d", 1]); at[hid ? "hidden" : s.kind] = at[hid ? "hidden" : s.kind] || id;
  }
  // the words of each landmark
  for (const [id, x] of Object.entries(rooms)) {
    if (x.kind === "camp") { const S0 = SITES.camp; guide[id] = x.tent ? { d: "Another tent of the camp, its flap tied back.", pur: "Shelter for the night.", obj: "A bedroll, a pack, a lamp.", chk: pick(r, ["A letter in the pack.", "A weapon wrapped in oilcloth.", "A pouch of coins hidden in a boot."]), atm: "Canvas flapping in the wind.", kp: "A draft: whose tent this is." } : { d: S0.d, pur: S0.pur, obj: S0.obj, chk: pick(r, S0.chk), atm: S0.atm, kp: "A draft: whose camp this is and why they are here." }; continue; }
    const S0 = x.S0;
    guide[id] = x.kind === "hidden" ? { d: "Hidden from any trail: " + S0.d.charAt(0).toLowerCase() + S0.d.slice(1), pur: "What someone did not want found.", obj: S0.obj, chk: pick(r, S0.chk), atm: S0.atm, kp: "A draft: what is hidden here, who hid it, and the clue that leads to it." }
      : { d: S0.d, pur: S0.pur, obj: S0.obj, chk: pick(r, S0.chk), atm: S0.atm, kp: "A draft: what this place means to the story." };
  }
  return { F, rooms, guide, at, sites, B, W, H };
}

module.exports.makeWildPlace = function (o) {
  const X = makeWild(o), B = X.B, first = Object.keys(X.rooms)[0], camp = X.at.camp || first, land = X.at.ruin || X.at.shrine || X.at.tower || X.at.crash || X.at.cabin || first;
  // the first draft of who and what is out there, for the council to rewrite
  const npcs = { N1: { n: pick(rng(o.seed + "|n"), o.biome === "alien" || o.biome === "hostile" ? ["A stranded surveyor", "The last of a landing party"] : ["A hunter", "A ranger", "A hermit", "A scout"]), at: camp, look: "Weathered, wary, kit mended many times.", manner: "Slow to speak; watches the party's hands.", bg: "A draft: who they are and why they are out here.", ties: { "Someone in the nearest town": "a draft" }, doing: "Mending a strap by the fire.", knows: "The way through, and what to avoid.", want: "To be left alone, or to be taken home." } };
  const clues = { C1: { t: "Tracks and a dropped pack", at: land, k: "physical", d: "Boot prints, a dragged weight, and a pack dropped in a hurry.", how: "Searching around the landmark.", rev: "A draft: who passed this way, and what they were carrying.", hint: "The birds have found something.", roll: "Track" } };
  const enc = { E1: { t: pick(rng(o.seed + "|e"), B.life), d: "A draft: what it does, and how the party can avoid it." }, E2: { t: "The land itself", d: "A draft: the hazard here (" + (B.patches.map(p => p[0]).filter(k => /mud|water|chasm|lava|blight|ice|snow|rock/.test(k)).join(", ") || "the weather") + ") and what it costs to cross." } };
  const secrets = X.at.hidden ? { S1: { t: "The hidden place", at: X.at.hidden, acc: "Found only by someone who knows where to look, or by the clue that leads here.", dest: "A draft: what it holds.", why: "A draft: who hid it." } } : {};
  // markers, each in its room or, for what roams the land, out on the ground near the middle
  const mk = (id, x, y) => X.F.M.push([id, Math.round(x * 4) / 4, Math.round(y * 4) / 4]);
  const centre = id => { const R = X.F.R.find(q => q[0] === id); return [R[1] + R[3] / 2, R[2] + R[4] / 2]; };
  mk("N1", ...centre(camp)); mk("C1", ...centre(land)); if (X.at.hidden) mk("S1", ...centre(X.at.hidden));
  const e2 = X.at.cave || X.at.camp || land; enc.E1.at = land; enc.E2.at = e2;
  const c1 = centre(land), c2 = centre(e2); mk("E1", c1[0] + 1, c1[1]); mk("E2", c2[0] + (e2 === camp ? 1 : 0), c2[1] + (e2 === land ? 1 : 0));
  const map = { ov: `${o.name}: ${B.name.toLowerCase()}, a stretch of it some ${X.W} by ${X.H} squares${X.at.hidden ? ", with a place hidden off the trail" : ""}. Every word is a draft for the council to make part of the story.`,
    run: `Let the land slow them: the ground, the weather (roll on its table), and what lives here. The trail is the easy way; off it, the going is hard and things are found.`,
    ext: B.ext, start: 0, compass: true, floors: [Object.assign(X.F, { note: "The trail runs west to east past the landmarks; off it the ground is as the map shows." })], rooms: X.guide, clues, npcs, secrets, enc };
  return { map, tables: { "Weather here": B.weather.slice(), "Out here": B.life.slice() }, size: X.W + "x" + X.H, rooms: Object.keys(X.rooms).length, sites: X.sites.map(s => s.kind) };
};
module.exports.BIOMES = Object.keys(BIOMES);
