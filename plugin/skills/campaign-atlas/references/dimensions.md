# Dimensions and planes

The planes beyond a campaign's world (the user's request of 3 Nov 2026; the plan approved with their answers in the workspace's `reviews/2026-11-03-dimensions.md`). The engine is `engine/atlas-cosmos.js`; the module is **Dimensions and planes** (off in Minimal and Detective, on in Traditional fantasy and Everything, on in a sandbox when the campaign has a cosmos).

**Waiting for the user (4 Nov 2026):** how each dimension's map is generated is under review (`reviews/2026-11-04-environments.md`): today a layer's map is the fantasy generator's land with the plane's own ground, liquid and colours; the plan makes each plane's environment come from its lore and laws first. Change nothing in how layers are generated until the user approves.

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
    structure: "layers",         // land · unbounded · islands · layers · city · underground
    concept: "...", palette: { ground: "#hex", sea: "#hex", sky: "#hex" },
    rules: { look: "...", feel: "...", play: [{ rule: "...", source: "book, edition" }] },
    lore: [{ fact: "...", tag: "canon", source: "...", edition: "5e" }],
    conflicts: [{ id: "avernus-ruler", about: "Who rules Avernus", options: [{ value: "Zariel", source: "...", edition: "5e", note: "..." }] }],
    layers: [{ id: "avernus", name: "Avernus", n: 1, ruler: "@avernus-ruler", concept: "...",
      map: { structure: "land", climate: "arid", landshare: .8, liquid: "bloodsea", cover: { dry: "ashwaste", forest: "thornwood", wet: "bloodsea", cold: "bonefield", high: "ironspires" }, palette: { ground: "#hex" } },
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

`dev/dimensions-test.js` in the workspace, on the realm sample's `cosmos.js` (the Nine Hells' nine layers with four disagreements, the Abyss, the Feywild, the Shadowfell, the Plane of Fire, the Astral, the Blood War). It must end "all well".
