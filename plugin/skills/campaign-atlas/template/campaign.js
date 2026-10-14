// The campaign's settings. Everything here is optional except the title; delete what you do not need.
// See references/data-format.md ("Campaign settings") for every option.
ATLAS.configure({
  title: "Untitled campaign",
  subtitle: "",                         // one sentence under the title
  system: "",                           // e.g. "Call of Cthulhu 7e"
  setting: "",                          // e.g. "London, 1888"
  gm: "Keeper",                         // what this game calls its referee: Keeper, GM, DM, Warden, Referee
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
  storageKey: "atlas"
});

// The cast: the people the story turns on, from the council's bible, each described once. The People tab shows them
// in full. A person on a map who is one of them says who: "id" and need not repeat the name or the description.
// ATLAS.cast({
//   id: { n: "Name", role: "Who they are in the story", look: "What they look like.", voice: "How they speak.", bg: "Background.",
//         want: "What they want.", secret: "What they hide.", lie: "The lie they tell.", press: "What makes them talk.", fate: "What becomes of them." }
// });

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
