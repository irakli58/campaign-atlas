# The world map

The level above the cities: the wider world the story travels (a realm, a coast, a country, a star system), on the page's **World map** tab. Every location on it may be one of the campaign's 3D cities, and **Enter** opens that city in the page's own 3D map (the same view as the Gazetteer), with **← World map** above it to come back. Places link to locations, and the panel of a location lists its places, the people met there, what leads there, its scenes and its routes. The referee can change it on the page: move, add and delete locations and routes, mark what the party knows, set where the party is and plan its journey. Changes are kept in the page's database, and **Copy as world.js** gives them back to the campaign.

The user asked for it on 20 Oct 2026, and the same day for maps made from their own drawings and for the real world.

## When to make one

- **The story travels between places** (towns, a kingdom, a coast, planets): make one. The brief says so when the game master chose; otherwise decide.
- **The story stays in one city or one site:** none is needed (a world map of one location adds nothing).
- **Which kind:**
  - the game master's **drawing** when they gave one;
  - the **real world** when the story is set in it (Victorian England, the Mediterranean of 1350, modern Georgia);
  - otherwise an **invented** land in the story's look.

## Three ways to make it

### An invented land

```
node atlas.js world <dir> [--look painted|parchment|engraved|atlas|holo|stars] [--land continent|islands|archipelago|coast|inland]
    [--size small|medium|large|huge|vast|world] [--seed N] [--across "600 miles"] [--km 6000]
    [--climate temperate|varied|cold|polar|warm|tropical|arid|wet] [--realism realistic|fantasy|alien]
    [--planet lush|jungle|desert|ice|volcanic|toxic|crystal|barren] [--gravity 0.5] [--air 0.6] [--water 0.7] [--warmth 0.1]
    [--regions none] [--geology classic] [--climate-model earth]
```

**A world is big** (the user, 27 Oct 2026): a new world is `vast` (2600 by 1820, about 6000 km across) unless the story asks for a small land, a single coast or an island (`--size`). `world` is bigger still (3600 by 2520). The map knows its scale in miles (fantasy, the past) or km.

**The rules of a natural map** (the user, 27 Oct 2026: generation must look natural, "and Earth is a good example"; scripts/world-geology.js). A new invented land is made the way the Earth makes one, each step from the one before, and only then drawn in its look:
1. *Plates.* A handful of large tectonic plates (6 to 10: few enough that their borders, and so the ranges, are long), continental where the land should be, oceanic elsewhere, each moving its own way.
2. *Mountains only where plates meet.* Two continents colliding: a great range along the suture and a lower plateau behind it. An ocean diving under a continent: a coastal range, its volcanoes a little inland, a trench offshore. Two oceans: an arc of volcanic islands. Plates pulling apart: a rift of lakes on land, a ridge under the sea. Plates sliding past: low ridges. Old ranges worn low lie across old continents; a hotspot leaves a chain of volcanic islands at sea and only a gentle swell on land. A range runs the whole length of its border; nothing else makes high ground.
2b. *The land is carved, not drawn* (the user, 27 Oct 2026: the first geology "looks extremely unnatural"). The plates say only where the land rises and how fast; the land then rises and its rivers cut it down together, over many steps of time (the stream power law solved implicitly, as FastScape does; hillslopes creep; the rain the ranges catch feeds the rivers that cut them), so ridges, spurs, foothills, valleys and branching river networks emerge. Continents and plates grow from seed cells over the sheet, so their shapes are their own, never the map's frame; most of a continent is an old shield of plains; the sea stands a little above the lowest land and floods the river mouths into bays; the sea floor is shelf, slope and deep ocean. Noise only seeds the detail.
3. *Earth's proportions.* Heights are matched rank for rank to the Earth's hypsometric curve: most land low, about a quarter hills and mountains, about a tenth above 2000 m, peaks of 6000 to 8000 m.
4. *Erosion and drainage.* Rivers cut valleys (the stream power law), slopes slump and creep; the drainage is one connected network. Every river rises in high ground and runs downhill to the sea, or into a lake and out of it again; rivers join, never split, except in a delta.
5. *Lakes only in basins*, mostly rifts and glacial hollows; a lake stands in the deep part of its hollow; all lakes together about 2 to 3% of the land; a dry basin is a salt pan, not a lake. No puddles.
6. *Climate from latitude, height and wind.* Warmth falls with latitude and 6.5 °C per km of height. The winds of each belt (trade winds, westerlies, polar easterlies) carry the ocean's moisture inland and rain it out as they climb: the windward side of a range is wet, the far side in its rain shadow; the subtropical belts are dry, the equator wet. The rain is calibrated to the climate chosen.
7. *What lives on it is simulated* (scripts/world-ecology.js, 27 Oct 2026: "actual biome simulation, not randomly placed biome decorations"). Each cell gets its climate (the warmest and the coldest month from the Earth's averages by latitude, winters colder inland, summers a little warmer; 6.5 °C less per km of height; the year's rain in mm from the winds, with rain shadows; when it falls: a dry season in the monsoon belt, dry summers on subtropical west coasts; the air's evaporative demand and so the aridity index), its Köppen class, and from these and the ground its biome: trees where the warmest month passes about 10 °C and there is water enough, thinning with the climate into open land and desert; alpine land, bare rock and snow above the treeline; swamp only on flat, low, waterlogged ground; a strip of woodland along rivers through deserts. A desert is not one sand but a mosaic, each kind where the land puts it (the user: the desert "looks kinda unnatural"): bare rock on the uplands and steep slopes, sand seas filling the wide, low, driest basins (with long dune ridges broken into fields), gravel plains between them and below the mountains, salt pans on the lowest flat floors; plants thin out gradually and in patches as the land dries, and small rivers that cross it run dry for part of the year (drawn dashed, as wadis) (world-terrain.js `ground`: 0 not dry, 1 sand, 2 gravel, 3 rock, 4 salt). `--climate-model earth` (the default for new worlds since the user approved it, 27 Oct 2026; a world made before by the plates keeps the classic rules unless asked; `--climate-model classic` for them: the user asked that deserts form "because of the world's climate and geography"; the classic model stays the default until approved) works the rain out from the Earth's own causes of dry land, in mm a year (world-geology.js `climateEarth`): sinking air in the subtropical highs (about 20 to 35°) that rains little and carries its water off toward the equator (the Sahara, Arabia); the rising air of the equator and the storm tracks of the westerlies (about 40 to 60°) that rain much and draw water in from both sides; cold currents along subtropical west coasts, only beside a broad land (the Namib, the Atacama: cool, foggy, almost rainless) and warm currents along east coasts (wetter, like Florida); rain shadows, with the descending air warming and drying past a range (Patagonia); interiors drying with distance from the sea (the Gobi); the summer monsoon from the equator's side, fading poleward into the desert (the Sahel); cold air holding little water (the polar deserts). The water the air could take is Hargreaves' (sun by latitude, warmth, the day's temperature swing), so the same rain makes desert in the heat and steppe in the cold, and the humidity classes are UNEP's. The desert floor then follows the land: sand seas only downwind of a supply (dry riverbeds and lakebeds, dry coasts) in low flat basins (about a quarter of the dry land), bare rock on uplands, gravel plains elsewhere, salt pans and clay pans (dry lakebeds) on basin floors, badlands where great rivers cut soft basin fill (`ground` 5 dry lakebed, 6 badlands); the relief look adds a grey-green shrubland stage between grass and bare ground. The land is the same under either model. The map shows five kinds of land, as the user asked ("very simple"): **desert, flat land, forest, mountains, swamp**, and snow where it never melts (`--biomes detailed` keeps the finer biomes). Tree cover (0 to 255) is kept beside it, and the shaded relief makes denser forest greener. In fantasy, its own places stand where a rule puts them, and the command says why: the enchanted wood in the deepest, wettest heart of the greatest forest; corruption seeping from a volcano down its valleys and rivers; giant mushrooms where swamp meets forest in the warm lowland; floating mountains about the highest peak; a hidden vale in flat land ringed by mountains; a glowing tarn, the highest lake (world-terrain.js `lore`). A world made before keeps its land and cover.
7b. *Land cover from warmth and wetness* (Whittaker's biomes): forest where it is wet enough, grassland, savanna, desert, tundra, ice; glaciers only where cold and high; volcanoes only where the plates put them; regions grow along the terrain and fade into the land round them.
8. *Settlements where people would live:* mild, watered, fertile land by rivers and coasts, not deserts, tundra or swamp.
`atlas.js world` prints how the land measures against each rule, with the Earth's figure beside it, and marks a broken rule with "!". `--realism realistic` lays down nothing fantastic; `fantasy` (the default for fantasy) allows, seldom and where they belong, enchanted and corrupted woods, giant mushrooms, floating mountains, a glowing lake; `alien` (science fiction) runs the same rules on a planet of its own gravity (weak gravity, taller mountains), air (thin air, less rain), water and warmth, and makes its land cover alien (`--planet`). A world made before 27 Oct 2026 keeps the land it had; `--geology classic` makes the older, simpler land.

**Kinds of land** (engine/atlas-world-biomes.js; drawn by atlas-world-nature.js in each look): forests (temperate, boreal, rainforest, jungle, bamboo, cloud, swamp, mangrove, flooded, autumn, snowy, dead, burned, birch, giant trees, palms, blossom, open woodland), open land (grassland, steppe, savanna, dunes, rocky desert, badlands, tundra, ice sheet, farmland, orchards, vineyards, terraces, salt flat, dry lakebed, marsh, bog, floodplain, scrub), relief (volcanic field, glacier, mesas and buttes, canyon, volcano, crater, sinkholes, stone formations, alpine peaks, old rounded mountains), water (frozen, reef, glowing, cursed, acid, methane, lava, alien liquid), fantasy and alien kinds. On the page, Edit map, Shape the land paints any of them with a brush whose size is a slider; "As the climate makes it" erases what was painted. In world.js, `shape: { strokes: [{ m: "jungle", r: 40, p: [[x, y], ...] }] }`; a drawing's `features:` may name any kind too. A river may say what flows in it: `liquid: "lava" | "frozen" | "glowing" | "cursed" | "acid" | "methane" | "alien"`.

**Make a new world** (27 Oct 2026; the user: the person making the map chooses "how big of a map they want", and "upload a picture of how the map should look ... and it generates the map"; then, preferring the painted way, "make it more fleshed out"): on the page, Edit map, Make a new world generates a land in the page itself (the same generator, in a worker; kept in the browser by its recipe, the recipe among the referee's changes as `gen`; Back to the campaign's own land undoes it): how big (a slider: small to a whole planet, with a supercontinent and half a planet between), its shape (presets: one big continent, a Pangaea, two continents, several like the Earth, many islands, an archipelago; or sliders for how many landmasses, 1 to 40, and how much is land, 10 to 90%: `--land masses --landmasses N --landshare 0.3`; or a coast, all land, **Paint it myself**, or **From a picture of my own**), climate, the Earth's rules or the older ones, fantasy or realistic, the look, a seed. The painter has a colour key (engine/atlas-world-sketch.js KINDS): blue water (the sea where it reaches the open sea, a lake inside the land, a river if a thin line), plains, forest, desert, swamp, snow, hills, mountains, volcano; it starts from the current map, from the sea, or from a picture read into the key's colours to touch up. The generator takes the painted land as its crust, raises painted mountains and hills (the plates' belts faint beside them), cuts painted rivers, sinks painted lakes, sets a cone at each volcano, and steers the climate where forest, desert, swamp or snow were painted, so they come out so; everything else (the rivers' branches, the valleys, the rain, the edges) is worked out. A slider says how closely to follow the drawing (`--loose 0` exactly as drawn to `1` loosely; natural, .5, by default since the user approved it): coasts get bays, headlands and a ragged edge, ranges break into massifs with passes and spurs, painted areas' edges wander; a drawn river is always a river, from the lake it touches to the sea. From the command line: `atlas.js world <dir> --sketch drawing.png [--size ...]` (PNG; a coloured map in the key's colours is read most surely; an ink drawing works too: the sea is the paper outside the coasts, gaps in the coast closed, open marks inside the land mountains, long lines rivers, loops round paper lakes, writing and symbols left out).

**Hydrographic relief** (`hydro`, the default for fantasy since 27 Oct 2026, from the user's example of a raised relief print of California): the land as a slab on pale paper casting a soft shadow, no sea colour; one low sun from the north-west with warm brown shade; the slopes lit from a smooth surface with valleys carved along every stream (the drawn ones and many finer ones), so ridges and gullies branch as the water made them; sage lowland, tan foothills, brown mountains, pale grey to white peaks, forests greener the denser they are, deserts in their own ground's colours; lakes blue on the slab; every stream drawn, thicker downstream; a serif title. Drawing only: the land is the generator's.

**Shaded relief** (`relief`, the default for fantasy until the hydrographic look, the default for fantasy since 27 Oct 2026, when the user asked for "the shaded relief map, it looks way better"): the land lit from the north-west, coloured by two rules: the taller the land, the whiter, to white at the highest peaks; the denser a forest, the greener. No drawn mountains or trees; rivers and lakes in blue, places, routes and names over it. The other looks remain in the map's style menu.

**Looks** (the user asked, 27 Oct 2026, for world maps that look professionally drawn, in a style fitting the setting; atlas-world-art.js draws them, atlas-world.js keeps everything the map does): `painted` for fantasy (the default since 27 Oct 2026, when the user asked for fantasy maps "way more detailed", after maps painted in colour: green lowland, ochre and orange dry land, forests drawn tree by tree, mountains drawn by hand in ranges, lit and shaded, with crags, spurs and snow, hills, dunes, marsh, farmland round the settlements, a blue-green sea glowing pale along the coasts with ripples, ships, settlements with red roofs, an eight-pointed compass, a title scroll and a key of the realms); `parchment` for the middle ages, and fantasy when chosen (an inked coast echoed out to sea, hatched mountain ranges, woods of broadleaf and pine, marsh, sand, waves and ships, a compass rose, a chequered frame, a title cartouche); `engraved` for the past (an atlas plate of the 1800s: hachured slopes, water-lining, a graduated border, a north arrow); `atlas` for the modern world (shaded relief in height colours, sea depths, built-up areas round the towns, a coordinate grid); `holo` for a planet in science fiction (a survey display: glowing contours, a lettered grid, a frame of readouts; `palette: "alien"` in world.js for an alien world's colours); `stars` for a star chart. Without `--look`, a world takes the look of its campaign's setting and age. On the page the game master changes it in the map's bar (kept as the world's `style`; the players see the same). Finer things (more woods, waves, contour and depth lines, stipple) come in as the map is brought closer.

1. The first run writes `world.js` with a location for each of the campaign's cities.
2. Add the story's other places to `world.js` (below), with no `at:`.
3. Run it again: the same seed keeps the same land.
   - Its rivers run as water would, down to the sea, and every one rises in the mountains (or, where a land has none, its highest hills): the user asked for it on 27 Oct 2026, "like in the real world". A river with no high ground in its catchment is not drawn. A river the game master draws on the page (Edit map, + River) runs wherever they draw it.
   - Every location without `at:` is stood where its kind belongs: a port on the coast, a city by a river, a castle on the hills, a mine or a lair in the mountains, a moon beside its planet.
   - Locations already placed keep their spots.
   - While `world.js` has no routes of its own, it suggests roads, trails, passes and sea routes between neighbours.
4. Name the land's features in `regions:` ({ name, kind: "sea" | "lake" | "range" | "forest" }), largest first. Unnamed ones get names in the same spirit; `--names none` leaves them unnamed.

Looks:
- `painted` is fantasy: a map painted in colour, as a fantasy map is drawn today.
- `parchment` is the middle ages (and fantasy when the game master chooses it): ink, mountains and woods drawn as a cartographer would.
- `atlas` is the modern world.
- `stars` is a star map with nebulae and space lanes.

### From a drawing (the game master's own map)

```
node atlas.js world <dir> --drawing story/world-drawing.jpg
```

1. The picture is copied into the campaign as `world-drawing.<type>` and goes into the page.
2. The map takes its shape: 1000 units along the longer side, so a point at (px, py) on a picture W pixels wide is at (px × 1000 / W, py × 1000 / W). The command prints the size.
3. **Look at the picture** (Read it) and write `world.js` from it:
   - **Every place drawn or named on it** is a location, `at:` where it is drawn, with the name as written. Choose its `kind` from its symbol and name (a castle drawing is a `castle`, a ship or anchor a `port`).
   - **Its roads, tracks and sea lanes** are routes.
   - **Its features**, so the redrawn map has them where the drawing does:
     - `{ kind: "mountains", pts: [[x, y], ...] }` for an area, or `line: [[x, y], ...], width: 40` for a range drawn as a row of peaks;
     - `hills`, `forest`, `swamp`, `desert` in the same way;
     - `{ kind: "river", line: [...] }`;
     - `{ kind: "lake", pts: [...] }`;
     - `{ kind: "sea", at: [x, y] }`, which marks open water when the coast does not reach the sheet's edge.
     - Give each a `name:` when the drawing names it.
   - Places the story needs that the drawing lacks go where they fit best; say so in the report.
4. The page shows the drawing as drawn, or (the **Your drawing** switch) **redrawn** in Atlas's look. It traces the coast:
   - on a coloured map, its blue is the sea;
   - on a pencil or ink drawing, the sea is the paper reached from the sheet's edge without crossing a line;
   - words written in the sea are not islands.

   If the coast is not closed (it runs off the sheet), mark the sea with a `sea` feature.
5. `check` fails a location with no `at:`.

### The real world

```
node atlas.js world <dir> --real "Northern England" [--km 800] [--unit mile|km]
```

1. The region is found by name, with a margin, laid out to scale. `--km` gives so many kilometres across its middle.
2. It is drawn from real data:
   - **Natural Earth**: the true coasts, lakes and rivers, and the names of the seas and mountain ranges;
   - **the terrain tiles**: the true heights, so the mountains stand where they are.
3. The map knows its scale, so distances are real; give `speeds:` for travel times.
4. Every location without `at:` is found by its real name inside the region. Give `geo: "Housesteads Roman Fort"` (a real place, or one near an invented one), or `geo: [lat, lon]`, when the name alone will not do. The command lists any it could not find.
5. Everything fetched is kept in `.cache`.

## world.js

Written by hand (never `world-terrain.js`, which the command writes).

```js
ATLAS.world({
  title: "The Wyrmwater Reach",
  look: "painted",                                  // painted · parchment · engraved · atlas · holo · stars (the game master may change it on the page)
  scale: { unit: "mile", per: 0.5 },               // one unit of the map; without it no distances are shown (a real map knows its own)
  speeds: { road: 24, trail: 16, pass: 10, river: 30, sea: 72 },   // a day's travel by each kind of route, in that unit
  regions: [{ name: "The Wyrmwater", kind: "sea" }],
  features: [],                                     // from a drawing (above)
  locations: [
    { id: "eldermere", name: "Eldermere", kind: "capital", city: "main", desc: "What the players may read.", gm: "For the referee only." },
    { id: "harrowgate", name: "Harrowgate", kind: "port", city: "harrowgate" },
    { id: "barrow", name: "The Barrow of Kings", kind: "dungeon", state: "rumoured", events: [{ t: "A scene", d: "What happens." }], people: ["castId"] }
  ],
  routes: [
    { from: "eldermere", to: "harrowgate", kind: "river", name: "The Elder", days: 2, danger: "Wreckers", blocked: "The bridge is down", hidden: true, gm: "...", enc: [{ t: "On the way", d: "..." }] }
  ],
  party: { at: "eldermere" }
});
```

- **kinds of location:**
  - settlements: capital, city, town, village, hamlet, port, castle, keep, fort, manor, farm, inn, tower, monastery, camp, base, airport, station;
  - sites: ruin, dungeon, cave, lair, temple, shrine, mine, landmark, stones, battlefield, bridge, lighthouse, grove, wreck, site;
  - the stars: star, planet, moon, outpost, asteroid, belt, gate, ship, anomaly.
- **state** is what the party knows: `unknown` (hidden from the players' map), `rumoured`, `known` (the default), `visited` or `done`.
- **routes:** road, trail, pass, river, sea, rail, air, tunnel, portal, lane, jump. They are drawn along the land (or the sea) by the map itself. `via: [[x, y], ...]` sends one through given points.
- **Travel time:**
  - shown only when the map knows it: a route's own `days:`, or its length by the scale divided by `speeds:` for its kind;
  - never invented: no scale means no distances.
- **The party:** `party.at` is where it is. The referee plans the journey on the page, which finds the shortest way by the routes and around blocked ones.

## Editing the world on the page

The user asked (26 Oct 2026, the world builder) to generate a world, make one from nothing, or generate it and change what they like, without rebuilding what they are happy with. **Edit map** on the page does it. What is changed is kept in the page's database (collection `world`) and laid over the campaign's own world; nothing in the campaign folder changes until **Copy as world.js** gives it back.

- **Places and routes:** add, move (drag), change, duplicate and delete; a place may be **held by** one of the campaign's factions (`owner:`).
- **Shape the land:** a brush that raises land from the sea, makes sea or a lake, raises mountains or hills, flattens to lowland, plants forest, dries to desert, wets to swamp, or makes grassland. Each stroke is kept, so the land can be put back stroke by stroke. A world with no land under it (no `world-terrain.js`, no drawing) starts as all sea or all land and is painted from there. Routes find their way over the new land.
- **Rivers:** drawn point by point from the source to the mouth.
- **Realms:** kingdoms, empires, provinces, territories, claims, districts or sectors, drawn round their border, with who holds them (a faction: its colour is theirs), and hidden from the players if secret. The factions' tab lists what each faction holds on the world map. A place shows the realm it stands in.
- **Names:** a sea, a range, a forest, written where the referee puts them.
- Rivers, realms and names are moved by dragging, reshaped by their corners, changed, duplicated and deleted. The land's own rivers and names (from `world-terrain.js`) can be changed or removed too.
- **Undo and Redo** (Ctrl+Z, Ctrl+Y) take back every change of the visit and do it again.
- **The players' copy** gets the reshaped land, the rivers and names, and the realms that are not hidden, never who holds them or what only the referee knows of them.

What **Copy as world.js** writes, and what may be written by hand the same way:

```js
ATLAS.world({
  // ...
  shape: { base: "sea", strokes: [{ m: "land", r: 60, p: [[420, 300], [610, 330]] }, { m: "mountains", r: 30, p: [[500, 320]] }] },
  realms: [{ id: "aldmere", name: "The Kingdom of Aldmere", kind: "kingdom", pts: [[400, 260], [640, 250], [660, 420], [410, 430]], owner: "crown", hidden: false, desc: "...", gm: "..." }],
  rivers: [{ id: "mere", name: "The Mere", pts: [[520, 300], [560, 380], [610, 470]], w: 1.8 }],
  labels: [{ id: "downs", name: "The Grey Downs", kind: "region", at: [300, 470], size: 18, angle: 0 }],
  hide: ["t3", "tl1"]          // rivers (t0, t1...) and names (tl0, tl1...) of world-terrain.js taken away or written again here
});
```

- **shape:** `base` is `"sea"` or `"land"` (only for a world with no land of its own); a stroke is `m` (land, sea, mountains, hills, flat, forest, desert, swamp, grass), `r` (its radius, in the map's units) and `p` (the points it passed through), laid over the land in order.
- **realms** need a name and three corners or more; `owner` names one of the factions (`table.js`, `ATLAS.factions`); `at` places the name (else it stands in the middle).
- `check` checks them all.

## Cities and places

- A location with `city: "id"` has a 3D map: `city.js` is `"main"`, and other cities are `cities/<id>.js`, made with `atlas.js city <dir> ... --id <id>` (a real city or an invented one, any of the usual options).
- A place stands in a city with `city: "id"` (in `ATLAS.place`), or in a location with `location: "id"`.
- A place with neither stands in the main city.
- A place in a location with no 3D map is on the world map only (a dungeon, a ruin out in the wilds).
- A city's own changes go in `campaign.js` as `ATLAS.cityEdit(c => { ... }, "id")`. A kit dresses the city it names (`city: "id"`), or the main city.
- A settlement on the map with no 3D map shows **No 3D map yet**:
  - in the Atlas app the referee can make it there and then;
  - on a published page the panel says how (ask Claude, or `atlas.js city <dir> --invent "Name" --id <id>`).

## Check

`check` checks:
- every location: known kind and state, on the map;
- every route: between two locations, of a known kind, with days as a number;
- every feature;
- every city a location names (made, or a note offering to make it);
- every 3D city: on the world map;
- every place's `city:` and `location:`;
- the party.
