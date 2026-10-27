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
node atlas.js world <dir> [--look parchment|engraved|atlas|holo|stars] [--land continent|islands|coast|inland] [--size small|medium|large] [--seed N] [--across "600 miles"]
```

**Looks** (the user asked, 27 Oct 2026, for world maps that look professionally drawn, in a style fitting the setting; atlas-world-art.js draws them, atlas-world.js keeps everything the map does): `parchment` for fantasy and the middle ages (an inked coast echoed out to sea, hatched mountain ranges, woods of broadleaf and pine, marsh, sand, waves and ships, a compass rose, a chequered frame, a title cartouche); `engraved` for the past (an atlas plate of the 1800s: hachured slopes, water-lining, a graduated border, a north arrow); `atlas` for the modern world (shaded relief in height colours, sea depths, built-up areas round the towns, a coordinate grid); `holo` for a planet in science fiction (a survey display: glowing contours, a lettered grid, a frame of readouts; `palette: "alien"` in world.js for an alien world's colours); `stars` for a star chart. Without `--look`, a world takes the look of its campaign's setting and age. On the page the game master changes it in the map's bar (kept as the world's `style`; the players see the same). Finer things (more woods, waves, contour and depth lines, stipple) come in as the map is brought closer.

1. The first run writes `world.js` with a location for each of the campaign's cities.
2. Add the story's other places to `world.js` (below), with no `at:`.
3. Run it again: the same seed keeps the same land.
   - Every location without `at:` is stood where its kind belongs: a port on the coast, a city by a river, a castle on the hills, a mine or a lair in the mountains, a moon beside its planet.
   - Locations already placed keep their spots.
   - While `world.js` has no routes of its own, it suggests roads, trails, passes and sea routes between neighbours.
4. Name the land's features in `regions:` ({ name, kind: "sea" | "lake" | "range" | "forest" }), largest first. Unnamed ones get names in the same spirit; `--names none` leaves them unnamed.

Looks:
- `parchment` is fantasy and the past: ink, mountains and woods drawn as a cartographer would.
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
  look: "parchment",                                // parchment · engraved · atlas · holo · stars (the game master may change it on the page)
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
