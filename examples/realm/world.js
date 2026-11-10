// The world map of The Wyrmwater Reach: the places the story travels between, and the ways between them
// (references/world.md). Written by hand. atlas.js world <campaign> makes the land under it (world-terrain.js), stands
// every location that has no at: [x, y] where its kind belongs, and suggests routes while there are none here.
ATLAS.world({
  title: "The Wyrmwater Reach",
  look: "painted",
  scale: { unit: "mile", per: 0.5 },                       // the map is 1000 units across: 500 miles
  speeds: { road: 24, trail: 16, pass: 10, river: 30, sea: 72 },
  regions: [
    { name: "The Wyrmwater", kind: "sea" },
    { name: "The Greyspine", kind: "range" },
    { name: "The Thornwold", kind: "forest" }
  ],
  locations: [
    { id: "eldermere", name: "Eldermere", kind: "capital", city: "main", desc: "The river city of the Reach: guildhalls, a wizard's tower and the baron's keep." },
    { id: "harrowgate", name: "Harrowgate", kind: "port", city: "harrowgate", desc: "A salt-grey harbour town, where the smugglers' boats come in under the lighthouse." },
    { id: "kingsford", name: "Kingsford", kind: "town", desc: "A market town at the old crossing, where the King's Road meets the river.", gm: "The reeve sells news of travellers to the Barrow's keepers." },
    { id: "greyfen", name: "Greyfen", kind: "village", desc: "Reed roofs and peat smoke at the edge of the marsh.", events: [{ t: "The drowned child", d: "A villager swears she saw her drowned son walking towards the abbey at dusk." }] },
    { id: "ravenspire", name: "Ravenspire", kind: "castle", state: "rumoured", desc: "A border castle in the Greyspine, said to be held by the baron's disowned brother." },
    { id: "barrow", name: "The Barrow of Kings", kind: "dungeon", desc: "A green hill full of the old kings, sealed since the Reach was young." },
    { id: "abbey", name: "The Sunken Abbey", kind: "ruin", desc: "An abbey that slid into the mere in a single night." },
    { id: "wyrmtooth", name: "The Wyrm's Tooth", kind: "lair", state: "unknown", desc: "A crag above the snowline.", gm: "The old dragon sleeps here; the cult at the abbey means to wake it." },
    { id: "stones", name: "The Nine Maidens", kind: "stones", desc: "A ring of nine stones on the moor, where the roads cross." }
  ],
  routes: [
    { from: "eldermere", to: "kingsford", kind: "road", name: "The King's Road" },
    { from: "kingsford", to: "harrowgate", kind: "road", name: "The Salt Road", danger: "Wreckers watch the cliff road at night" },
    { from: "eldermere", to: "harrowgate", kind: "river", name: "The Elder, downstream" },
    { from: "kingsford", to: "greyfen", kind: "trail" },
    { from: "greyfen", to: "abbey", kind: "trail", danger: "The marsh lights lead travellers off the causeway" },
    { from: "kingsford", to: "stones", kind: "trail" },
    { from: "stones", to: "barrow", kind: "trail" },
    { from: "eldermere", to: "ravenspire", kind: "road", name: "The Old Border Road", blocked: "The bridge at Wolf's Leap is down since the spring floods" },
    { from: "stones", to: "ravenspire", kind: "pass", name: "The Shepherd's Way", danger: "Snow and wolves" },
    { from: "ravenspire", to: "wyrmtooth", kind: "pass", hidden: true, gm: "Only the castle's huntsmen know the way up." },
    { from: "harrowgate", to: "abbey", kind: "sea", days: 1.5, desc: "Round the headland and into the mere at high tide." }
  ],
  // the realms: who holds which part of the Reach (the factions are in table.js); the cult's claim only the referee sees
  realms: [
    { id: "barony", name: "The Barony of Ravenhold", kind: "duchy", owner: "baron", at: [455, 662], pts: [[372, 520], [520, 488], [648, 506], [700, 600], [596, 688], [400, 680]], desc: "The baron's own land: the city, the fields along the Elder, and the tithe they owe him." },
    { id: "charter", name: "The Guild's Charter", kind: "republic", owner: "guild", at: [842, 528], pts: [[760, 330], [962, 352], [968, 520], [820, 566], [736, 452]], desc: "The roads and the market town the Merchants' Guild has bought from the baron, toll by toll." },
    { id: "mere-claim", name: "The Drowned Claim", kind: "claim", hidden: true, at: [336, 180], pts: [[150, 66], [470, 52], [508, 168], [236, 206]], gm: "What the abbey's cult means to hold once the wyrm wakes: the mere, the marsh and every village on it." }
  ],
  party: { at: "eldermere", plan: ["kingsford"] }
});
