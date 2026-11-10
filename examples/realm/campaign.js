// The campaign's settings. Everything here is optional except the title; delete what you do not need.
// See references/data-format.md ("Campaign settings") for every option.
ATLAS.configure({
  title: "The Wyrmwater Reach",
  subtitle: "A test map: a world map of an invented fantasy realm (atlas.js world), two 3D cities, and places out in the wilds",
  system: "Dungeons & Dragons 5e",
  setting: "The Wyrmwater Reach, a realm of wizards and dragons",
  genre: "fantasy",                     // the fantasy council sits (atlas.js council)
  kind: "sandbox",                      // a living world: hooks and roads, no set trail
  gm: "DM",                             // what this game calls its referee: Keeper, GM, DM, Warden, Referee
  grid: { unit: 5, name: "ft" },        // one square on the maps
  paper: "parchment",                   // parchment (period, fantasy) | blueprint (modern, sci-fi) | chalk (neutral)
  // fonts: { label: "'IM Fell English SC', Georgia, serif", google: ["IM+Fell+English+SC", "Spectral:ital,wght@0,400;0,600;1,400", "IBM+Plex+Mono:wght@400;500;600"] },
  // ui: { accent: "#8a2432", accentDark: "#d77580", display: "'IM Fell English SC', Georgia, serif" },
  // markers: { K: ["#2f6b3a", "Idol fragment"] },   // rename the key-item marker, or add letters of your own
  // kinds: {}, items: {},              // floor kinds and items of your own
  // standards: { 1: { rooms: 24 } },   // only if this setting cannot meet a tier's usual size; say why here (references/standards.md)
  categories: [
    { id: "start", name: "Where it starts" },
    { id: "scene", name: "Scenes of the crime" },
    { id: "lead", name: "Places the trail leads" },
    { id: "lair", name: "Hideouts and the finale" }
  ],
  storageKey: "atlas-realm"
});

// The cast: the people the story turns on, from the council's bible, each described once. A person on a map who is
// one of them says who: "id" and need not repeat the name or the description. Everyone (the cast and every person
// on a map) has a look, a story (bg), a manner (how they act) and ties (who they know, and how): a tie names one of
// the cast by id, or anyone else by their full name, and the page shows the web both ways.
// ATLAS.cast({
//   id: { n: "Name", role: "Who they are in the story", look: "What they look like.", manner: "How they act.", voice: "How they speak.",
//         bg: "Background.", ties: { otherId: "How they know them.", "Someone's Full Name": "How they know them." },
//         want: "What they want.", secret: "What they hide.", lie: "The lie they tell.", press: "What makes them talk.", fate: "What becomes of them." }
// });

// People of Eldermere who live their days in its streets: where each is, hour by hour (sched: [hours, place, doing]),
// and home and work for the hours their day leaves out; the 3D city shows them there, walking as the world's time moves
ATLAS.cast({
  brannoc: { n: "Brannoc", role: "Smith of the Warrens", look: "Broad, scorched forearms, a beard tied back with wire.", manner: "Says little; hammers while he listens.", bg: "Came down from the hill forts after the war and never went back.", ties: { harrow: "Mends the mill's gears and is owed for the last three." },
    want: "To be paid, and to be left alone.", secret: "He forged the grate for the mill's cellar, and wondered why a mill needs a grate.", press: "Ask about the mill's debts.",
    home: "forge", work: "forge", sched: [["06-12", "forge", "at the anvil"], ["12-13", "tavern", "eating at the Prancing Wyrm"], ["13-19", "forge", "at the anvil"], ["19-23", "tavern", "drinking, louder by the hour"]] },
  hesk: { n: "Mother Hesk", role: "Priestess of the Dawn", look: "Grey robes, ash on her brow, a lantern even by day.", manner: "Patient, and never forgets a face.", bg: "Has kept the dawn rite for thirty years.", ties: { orrin: "Thinks him clever and godless." },
    want: "The wayside shrine rebuilt before winter.", secret: "She has heard the miller's confession, and keeps it.", press: "Swear on the dawn that it will save a life.",
    home: "temple", sched: [["05-09", "temple", "at the dawn rite"], ["09-14", "shrine", "tending the wayside shrine"], ["14-20", "temple", "hearing petitions"]] },
  orrin: { n: "Orrin", role: "The wizard of Scriveners' Ward", look: "Ink to the elbows, spectacles pushed up into white hair.", manner: "Answers a question with three of his own.", bg: "Lectures at the Academy when he remembers to.", ties: { hesk: "Brings her books she will not read." },
    want: "A copy of the Saint Ivo crypt's carvings.", secret: "He sold the miller a book on old wards, and fears what for.", press: "Show him something he has never seen.",
    home: "tower", sched: [["08-12", "academy", "lecturing"], ["12-23", "tower", "in his study"]] },
  harrow: { n: "Harrow", role: "The miller", look: "Flour in every crease, a burn scar on one hand.", manner: "Jumpy; laughs too quickly.", bg: "Took the mill over from his father, and its debts.", ties: { brannoc: "Owes him for the gears." },
    want: "For no one to look in his cellar.", secret: "What he keeps under the mill is not grain.", press: "Mention the cellar grate.", offstage: true,
    home: "mill", sched: [["05-17", "mill", "at the millstones"], ["17-21", "tavern", "at the Prancing Wyrm, buying no one a drink"]] }
});

// The map of the whole is written to city.js by one command (references/cities.md); never edit that file:
//   a real city            node atlas.js city <this folder> "City, Country" --year 1888 --around "the quarter the story is in"
//   a real camp, base...   the same, with --buildings
//   an invented city       node atlas.js city <this folder> --invent "Name" --year 1350 --site harbour --culture english
//   an invented site       node atlas.js city <this folder> --invent "Name" --kind camp     (or base)
// Your own changes to it go here, so that fetching or generating it again does not lose them:
// ATLAS.cityEdit(c => { c.title = "..."; c.landmarks.push({ name: "...", kind: "hall", at: [x, y] }); });

// Register every place here first, unmapped, in the order the index should list them; each gets its own file in
// places/ when it is drawn. tier: 1 the story cannot run without it, 2 the trail passes through it, 3 colour.
// On the city map a place stands at: [x, y], or IS a landmark (landmark: "Name"), or is somewhere in its region.
// ATLAS.place("first-place", { name: "The First Place", category: "start", region: "Old Town", tier: 1, start: true, at: [160, 100], model: "town", tagline: "One sentence for the index." });

// test places: no model is named, so each takes one of fantasy's own from its name
ATLAS.place("tavern", { name: "The Prancing Wyrm Tavern", category: "start", region: "The Old Ward", tier: 3, start: true, tagline: "Ale, rumours and a locked cellar.",
  hooks: [{ t: "The miller has not paid for his ale in a month", d: "He says the mill turns by itself at night, and he will not go near it after dark.", who: "Mother Tansy, the landlady", to: "mill" },
    { t: "Knocking under Saint Ivo's", d: "The sexton swears something answers when he knocks on the crypt door.", who: "Old Pell, drinking alone", to: "crypt" }] });
ATLAS.place("tower", { name: "The Wizard Orrin's House", category: "start", region: "Scriveners' Ward", tier: 3, start: true, tagline: "Where the stars are read." });
ATLAS.place("temple", { name: "Temple of the Dawn", category: "scene", region: "The Old Ward", tier: 3, start: true, tagline: "Gold and incense." });
ATLAS.place("shrine", { name: "The Wayside Shrine", category: "scene", region: "Beggars' Rest", tier: 3, start: true, tagline: "A candle for the lost." });
ATLAS.place("keep", { name: "Ravenhold Keep", category: "scene", region: "Guildhall Ward", tier: 3, start: true, tagline: "The baron's stronghold." });
ATLAS.place("guild", { name: "The Merchants' Guild", category: "scene", region: "Guildhall Ward", tier: 3, start: true, tagline: "Coin and contracts." });
ATLAS.place("forge", { name: "Brannoc's Forge", category: "lead", region: "The Warrens", tier: 3, start: true, tagline: "Steel and sparks." });
ATLAS.place("grove", { name: "The Druid Grove", category: "lead", region: "Beggars' Rest", tier: 3, start: true, tagline: "Where the old ones meet." });
ATLAS.place("academy", { name: "The Academy of Lore", category: "lead", region: "Scriveners' Ward", tier: 3, start: true, tagline: "Books chained to desks." });
ATLAS.place("mill", { name: "Harrow's Mill", category: "lair", region: "The Warrens", tier: 3, tagline: "The sails turn at night." });
ATLAS.place("crypt", { name: "The Crypt of Saint Ivo", category: "lair", region: "The Old Ward", tier: 3, tagline: "Something knocks." });
ATLAS.place("hut", { name: "The Witch's Hut", category: "lair", region: "The Warrens", tier: 3, tagline: "Smoke, bones and bargains." });

// the second city, Harrowgate (cities/harrowgate.js, made with: atlas.js city realm --invent "Harrowgate" --id harrowgate)
ATLAS.place("harbour-inn", { name: "The Drowned Lantern", city: "harrowgate", category: "lead", region: "Lanternmarket", tier: 3, start: true, tagline: "Sailors' talk and a back room.",
  hooks: [{ t: "Bells under the water", d: "Fishers off the point hear the drowned abbey's bells before every storm, and the last storm took a boat.", who: "A fisher's widow", to: "abbey" },
    { t: "A witch who sells fair winds", d: "The captains pay her in secrets, and one of them wants his back.", who: "Captain Orla Venn", to: "hut" }] });
ATLAS.place("customs", { name: "The Customs House", city: "harrowgate", category: "scene", region: "The Old Ward", tier: 3, start: true, tagline: "Every crate is counted, but not every crate is opened." });
ATLAS.place("lighthouse-chapel", { name: "Chapel of the Lamp", city: "harrowgate", landmark: "The Beacon", category: "lead", tier: 3, start: true, tagline: "The keeper prays to something in the water." });

// out in the wilds: places in a world location that has no 3D map of its own
ATLAS.place("barrow", { name: "The Barrow of Kings", location: "barrow", category: "lair", tier: 3, start: true, tagline: "Seven kings, and one empty grave." });
ATLAS.place("abbey", { name: "The Sunken Abbey", location: "abbey", category: "lair", tier: 3, tagline: "Its bells ring under the water." });
