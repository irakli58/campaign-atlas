# Dimensions and planes

The planes beyond a campaign's world (the user's request of 3 Nov 2026; the plan approved with their answers in the workspace's `reviews/2026-11-03-dimensions.md`). The engine is `engine/atlas-cosmos.js`; the module is **Dimensions and planes** (off in Minimal and Detective, on in Traditional fantasy and Everything, on in a sandbox when the campaign has a cosmos).

**How a layer's map is made (the user's plan of 4 Nov 2026, approved with their answers in `reviews/2026-11-04-environments.md`):** a plane's map comes from what its lore says it is, not from the fantasy generator's world in other colours. `envOf(d, l)` in `atlas-cosmos.js` turns a layer's recipe and laws into an environment (the same object a planet's physics gives, `kind: "plane"`), and the world generator follows it as it follows a planet's. Its shape is its frame:

| `map.structure` | What is made |
|---|---|
| `land` | a land with seas (`landshare`, default .62) |
| `unbounded` | a land without end: no sea, no coast (also `city`, `underground`) |
| `islands` | islands in a void or a sea of its liquid |
| `ocean` | all ocean, a few islands (the Plane of Water) |
| `sky` | islands adrift over clouds (the Plane of Air) |
| `chart` | no surface: drawn as a chart of what drifts in it (the Astral), not a terrain map |
| `city` | a city that is the plane (its dry ground `ironstreets` unless given) |
| `mirror` | the campaign's own world, its coasts, ranges and rivers, remade by the layer's laws: heights raised or worn (`relief`), its own ground and liquid (`cover`), its rivers of its liquid, names changed if `rename` says how (`"{name}"` for the world's own) |

Its **laws** (`laws` on the dimension, the layer or its map): `weather: "none"` (no rain, no rivers unless its lore names them, no wearing by water) or `"storms"`; `warmth` in °C (the same everywhere: a plane has no poles or latitudes); `gravity` (said, not drawn); `fall` (rain, snow, ash); `life` (complex, sparse, microbial, none: no forests where nothing grows). On the map: `liquid` (water, bloodsea, ichor, mistsea, voidsea, astral, lava, ice, none) and its shores by it (water a beach; blood, ichor, mist a plain dark line, no pale shallows; lava a glowing line); `landforms` (`slope`: the whole land tilted, as Malbolge's endless slope; `boulders`; `chasms`; `ruins`: ruined cities); `rivers: [{ name, liquid }]` (named rivers that run because the lore says so, rain or none, across the map by the lowest ground, as the Styx through the upper Hells); `crust`, `impacts`, `volcanism`, `fluvial`, `aeolian`, `glacial` as a planet's. Names follow its liquid (a sea of blood is a Sea of Blood or a Red Deep, mist the Cloud Deeps, never a Mare). Without any of this a layer is made as before.

**Mirror or a world of its own** is the game master's choice for any dimension (the user's answer): Add a dimension asks it ("Its land"), and `asMirror(d)` makes every layer a mirror. The Feywild and the Shadowfell stay worlds of their own unless the game master chooses a mirror. Plane settlements and architecture in 3D are a later stage (the user's answer).

## The rules the user set

- **Where editions disagree, always ask.** No edition wins by itself, not even the campaign's own. Each disagreement is listed with every answer and its source; the game master's choice (or their own answer) is kept.
- **Every fact tagged:** canon (with its book and edition), variant (another edition says otherwise), added (invented to fill a gap), or the game master's own.
- **Facts in Atlas's own words**, never a book's text. The System Reference Document 5.1 is CC-BY-4.0 and may be relied on and credited; other books are cited, not copied.
- **No invented rules of play:** a rule comes with its source, or is marked the game master's own.
- **The Feywild and the Shadowfell are worlds of their own** in the user's campaigns (not mirrors), unless the game master asks for a mirror.
- **Nothing is reachable unless a way is drawn** (a portal).

## cosmos.js

```js
ATLAS.cosmos({
  model: "great wheel",          // great wheel · world axis · the campaign's own
  edition: "D&D 5th edition",
  links: [["realm", "feywild"], ...],   // lines drawn between dimensions in the cosmology
  dimensions: [{
    id: "hells", name: "The Nine Hells of Baator", short: "The Nine Hells",
    ring: "outer",               // material · echo · transitive · inner · outer · other (where it is drawn)
    source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true },   // lore · custom · random
    structure: "layers",         // land · unbounded · islands · ocean · sky · chart · mirror · layers · city · underground
    laws: { weather: "none", warmth: 45, gravity: "light", fall: "ash", life: "sparse" },   // the whole dimension's; a layer's own override
    concept: "...", palette: { ground: "#hex", sea: "#hex", sky: "#hex" },
    rules: { look: "...", feel: "...", play: [{ rule: "...", source: "book, edition" }] },
    lore: [{ fact: "...", tag: "canon", source: "...", edition: "5e" }],
    conflicts: [{ id: "avernus-ruler", about: "Who rules Avernus", options: [{ value: "Zariel", source: "...", edition: "5e", note: "..." }] }],
    layers: [{ id: "avernus", name: "Avernus", n: 1, ruler: "@avernus-ruler", concept: "...",
      map: { structure: "land", climate: "arid", landshare: .8, liquid: "bloodsea", cover: { dry: "ashwaste", forest: "thornwood", wet: "bloodsea", cold: "bonefield", high: "ironspires" }, palette: { ground: "#hex" },
        laws: { weather: "none", warmth: 50 }, landforms: ["chasms"], rivers: [{ name: "The Styx", liquid: "water" }], relief: 1.4, rename: "Burnt {name}" },
      places: [{ id: "citadel", name: "The Bronze Citadel", kind: "castle" }] }],
    // a layer that is one of the campaign's own maps (the world itself for the Material Plane): { id, name, world: "main" }
    factions: { hells: { n, kind, leader, has, wants, plan, rels: { abyss: ["war", "The Blood War"] }, ... } },   // join Factions and people
    events: [{ id, title, when, what, players }],   // join the world's time, marked with their plane
    portals: [{ id, name, kind: "gate", from: { world: "main", loc: "wyrmtooth" }, to: { dim: "hells", layer: "avernus", loc: "camp" }, who, when, price }],
    time: { here: 1, home: 1, say: "..." },   // days there against days at home
    travel: { ways, cost, dangers: [] },
    warning: { from, title, text }            // the traveller's warning, a handout
  }]
});
```

A value "@<conflict id>" (a layer's ruler) shows the game master's choice, or "not chosen yet". Kinds of ground and liquid of the planes (`engine/atlas-world-biomes.js`, "The planes"): ashwaste, ironspires, bonefield, brimstone, cinders, thornwood, wildwood, feymeadow, shadowland, gloomwood, ironstreets; liquids bloodsea, ichor, mistsea, voidsea, astral; any other kind of the list may be used too. The generator's flags for them: `atlas.js world --setting plane --cover "forest=...,wet=...,dry=...,cold=...,high=...,liquid=..." --liquid <kind>`.

## On the page

The **Dimensions** tab of At the table: the cosmology drawn (a gold dot where choices wait), a dimension's card (its concept, rules in three kinds, layers, ways, disagreements, facts with tags, powers and events), **Make its map** / **Open its map** for each layer (made in the page's background worker the first time, kept in the browser, collection `dimworlds`), **The party is here** (the copilot is told the plane and its rules), **They come home** (the days spent there move the world's time as the plane's time runs), **Go through** a portal, **Show them the traveller's warning**, **Hide it**, **Add a dimension** from the lore or a description (Claude, shown before it is kept) or at random (a premise drawn first, everything following from it). Kept in collection `cosmos` (`c:<dim>:<conflict>`, `party`, `dim:<id>`, `seed:<dim>:<layer>`, `gone:<id>`).

## The test

`dev/dimensions-test.js` in the workspace, on the realm sample's `cosmos.js` (the Nine Hells' nine layers with four disagreements and each layer's laws, the Abyss, the Feywild, the Shadowfell, the Planes of Fire, Water and Air, the Astral, the Blood War). It makes the maps in the built page and checks each is what its lore says: the Styx through Avernus, Stygia's frozen sea, Malbolge's slope, Cania all ice, Nessus's chasms, every layer different, Water all ocean, Air islands over cloud, the Astral a chart, a mirror with the campaign's own coasts; then the copilot, time, a portal, the warning, the Blood War and a random dimension. It must end "all well".
