# The map of the whole: cities and sites

Above the index of places, the page can carry one overview map: a printed plan with small 3D buildings standing on it, the campaign's places numbered, landmarks named. Three ways to get one, all writing `<campaign>/city.js`:

| The story is set in | Command | What you get |
|---|---|---|
| a real city | `atlas.js city <dir> "City, Country"` | its true streets and their names, rivers, coast, parks, squares, railways, walls, districts, landmarks |
| one place's very own buildings (when asked: "made for this place") | `atlas.js kit use <dir> <kit>`, or a `kit.js` made for it (section 4b) | its famous buildings as models on the map's landmarks, and the colours, roofs and details of its streets |
| a real place that is not a city (a camp, a base, a compound, a village, a few streets) | the same, with `--buildings` | every surveyed building as it stands, fences, watchtowers, tracks; nothing invented |
| an invented city | `atlas.js city <dir> --invent "Name"` | a city laid out for its age, site and culture; side streets and houses grown |
| an invented camp or base | `atlas.js city <dir> --invent "Name" --kind camp` (or `base`) | a compound: wire or blast wall, towers, gate, hut or tent lines, the buildings such a place has |
| the future: a base on a moon or a planet, a station in orbit | `atlas.js city <dir> --invent "Name" --kind moonbase` (or `outpost`, `colony`, `station`) | modules and domes joined by pressurised tubes, landing pads, solar fields, a reactor, a dish; craters on a moon; black sky with stars |

A story with no single setting (a road trip, a ship, a wilderness) needs no city map; leave it out.

**The map is built of its story's own buildings.** Atlas keeps a ready-made set of buildings for each kind of setting and reuses it for every campaign of that kind: the medieval town, the industrial city of 1888, the modern city, the camp and the base, and the future (`look: "scifi"`). Choose the command, the year or era and the look that fit the story, and nothing else: never the houses of 1888, or a desert base's sandbag walls, for a station in orbit. The user caught exactly that on a moon station (15 Oct 2026: "you used 1888 house models for a moon base"). `check` fails a story set in space or after 2200 whose map is not of the future, and a place wearing a building of the wrong age.

## Contents

1. A real city
2. A real site, building by building
3. An invented city
4. An invented camp or base
5. The age and the part of the world
6. Putting the campaign's places on the map
7. Checking the result, and changing it
8. The data format
9. Rules the engine keeps
10. When something goes wrong

## 1. A real city

```
node atlas.js city <dir> "Florence, Italy" --year 1478
node atlas.js city <dir> "Dubai, UAE" --around "Burj Khalifa" --km 3
node atlas.js city <dir> "London, England" --around "Whitechapel" --year 1888 --km 2.4
```

The user names a city; you choose the rest from the story.

- **`--year` or `--era`**: when the story happens. It sets the look of the buildings (section 5) and what is left out: no railways before 1830 or in a medieval city, no motorways before the modern age, no landmark built after the story's year. Without either, the city is as it stands today.
- **`--around "a place"`**: what the sheet is centred on. Use the part of the city the story happens in; the default is the city centre. `--center "lat,lon"` does the same by coordinates.
- **`--km N`**: how wide the sheet is, 2 by default (so 1.25 km deep). At 2 km every street fits, down to the alleys. Above about 3 km the command begins leaving out footpaths, then minor streets, and says so. Choose the smallest sheet that holds the story's places.
- **`--landmarks N`** (36): how many are named. **`--must "Bargello; Uffizi"`**: names that must be among them.
- **`--lang`**: streets keep their own names where the alphabet is Latin and take English ones otherwise; landmarks and rivers take English names where they exist. `--lang local` keeps everything as the city writes it; `--lang fr` (any code) prefers that language.
- **`--name "Short Name"`**: the title, when the looked-up name is unwieldy.

The data comes from OpenStreetMap. The fetch is kept in `<dir>/.cache`, so running the command again with a different year or landmark count is instant; `--refresh` fetches afresh. The map carries the credit "© OpenStreetMap contributors", which the licence requires: `check` fails if it is removed.

What is real and what is not: the streets, names, water, parks, railways, walls, districts and landmarks are the city's own. The ordinary houses are not surveyed one by one: the engine stands houses of the right age along the real streets. Landmarks stand on their true footprints at their true heights (the very tallest drawn a little short of scale so they stay in view); every other tall building in a modern city stands unnamed on its own footprint, so the skyline is the real one.

## 2. A real site, building by building

```
node atlas.js city <dir> "Auschwitz II-Birkenau, Poland" --buildings --year 1944 --km 1.9 --name "Birkenau"
node atlas.js city <dir> "Alcatraz Island" --buildings --km 1
```

`--buildings` is for a place where the buildings themselves are the map. Every surveyed building stands as it is (ruins as ruins), with the fences and walls, watchtowers, gates, bunkers, tanks, helicopter pads, all tracks and paths, and railway sidings. No houses are grown. `--ground grass|sand|dirt|snow|concrete` says what lies between.

The survey shows the place as it is today. For a story set in its past, compare the result with what you know of the place then and restore what has gone with `ATLAS.cityEdit` (section 7): a row of huts that is now only foundations is one `rows` entry.

A place of real suffering is mapped accurately and without ornament. The people held there are the subject of the story, not its scenery.

## 3. An invented city

```
node atlas.js city <dir> --invent "Saltreach" --year 1350 --site harbour
node atlas.js city <dir> --invent "Karlstadt" --year 1890 --site river --culture german
node atlas.js city <dir> --invent "Newhaven" --era modern --site coast --culture american
```

- **`--year` / `--era`**: medieval gives a walled town of crooked lanes with a castle, a cathedral and gates; industrial gives a boulevard where the wall stood, a railway and station, gasworks and a park; modern gives a grid with a business quarter of towers, a stadium and a great park.
- **`--site`**: `river`, `coast`, `harbour` (a river mouth), `lake`, `plain`.
- **`--culture`**: the language of the street names and the kind of great buildings: `english`, `american`, `french`, `italian`, `spanish`, `german`, `arabic`, `japanese`, `fantasy`. It also sets the region's colours where that is obvious.
- **`--plan organic|grid`**, **`--size town|city|metropolis`**, **`--region`**, **`--seed N`**: the same seed lays out the same city; another seed, another.

The command prints the districts and landmarks it made. Use them: set each place's `region` to a district, or make a place *be* a landmark.

When the council's story describes the city (a river with three bridges, the cathedral on the hill), generate, then bend the result to the story with `ATLAS.cityEdit`, or lay the city out by hand (the `example-city` folder shows a hand-laid one).

## 4. An invented camp or base

```
node atlas.js city <dir> --invent "Stalag IX" --kind camp --year 1943
node atlas.js city <dir> --invent "Camp Falcon" --kind base --region desert --town --ruin 0.5
```

- **camp**: double wire, watchtowers, a gate and gatehouse, a roll-call square, hut lines in fenced compounds, kitchens, infirmary, cells, workshops, the guards' compound outside the wire, a railway siding and ramp, forest behind.
- **base**: a blast wall (an ordinary wall before the modern age), towers, an entry point with a chicane and bunkers, tent or hut lines, headquarters, dining hall, aid station, motor pool, fuel point, helicopter pads and hangars, an ammunition point fenced apart, a range, a mast.
- **`--town`** adds a small town where the road comes in; **`--ruin 0.5`** leaves half its houses roofless, for a place that has been fought over.

Everything on a site is listed in `city.js` (`rows`, `walls`, `landmarks`, `open`); nothing is grown. Rearrange it freely with `ATLAS.cityEdit` to fit the story.

### 4a. The future: a moon base, an outpost, a colony, a station

```
node atlas.js city <dir> --invent "Selene Base" --kind moonbase --year 2291
node atlas.js city <dir> --invent "Tycho Ring" --kind station --year 2291
```

- **moonbase** (also **outpost**, **colony**: the same on a planet): a central hub dome with tubes out to its areas: Habitation (rows of modules), Operations (operations centre, comms dish, mast), Research (a dome and its laboratories), Power (a reactor and a solar field), the Landing Field (pads, a hangar, a fuel store) and sometimes Mining; a perimeter track and a rover track off the sheet; craters all round. Ground `regolith`.
- **station**: a ring of tubes round a hub, four spokes, modules along the ring in four sections (Habitation Ring, Green Ring, Engineering, Command), a docking arm and a cargo arm each ending in a pad and a hangar, solar arrays, a comms dish and the core. Ground `deck`.
- The look is `"scifi"`: white modules on grey ground, the sheet hanging in black space among stars. A place on such a map that names no `model` wears one of the future's own, chosen from its name: `dock` (docking, hangar, landing, spindle, airlock), `command` (command, bridge, control, operations, spire), `reactor` (engineering, reactor, power, core), `greenhouse` (hydroponics, garden, green), `medbay`, `lab` (lab, research, science, xeno), `quarters` (habitation, quarters, crew), `antenna` (comms, array, dish, listening), `mine`, `solar`, `cargo`, `habdome` (dome, hall, mess), else `module`.
- The future's parts for laying one out by hand or bending a generated one (`ATLAS.cityEdit`): landmarks of kind `module`, `habdome`, `reactor`, `dish`, `solar` (with the older `pad`, `hangar`, `tank`, `spire`); walls of kind `tube` (a pressurised corridor: `{ kind: "tube", pts: [[x, y], ...] }`); `rows` with `roof: "module"` (habitat modules side by side); `open` of kind `crater`. A station needs no roads: its tubes are its streets.

### 4b. Kits: buildings made for one place

The ready-made sets fit a *kind* of place. A kit fits *one* place: Tbilisi's carved balconies and its cathedral on the hill, Venice's palazzi, a fantasy city's spires, a particular station's look. The user asked for this on 20 Oct 2026 ("you won't be able to use generic models, you will need custom"): when the game master chooses buildings **made for this place** (the app writes it in `story/brief.md`), or asks for a real city's own look, the map wears a kit. It takes more work, so it is done when asked, and every kit is kept and used again.

**First look for one already made.** `node atlas.js kit list` shows the kits Atlas has (its `kits/` folder) and the user's own (a `kits/` folder beside the campaigns folder). `node atlas.js kit use <dir> <kit>` copies one into the campaign as `kit.js`. Only when there is none, design one; when it is done and the map looks right, `node atlas.js kit save <dir>` keeps it for the next campaign set there.

**The kit file** (`<campaign>/kit.js`; `kits/tbilisi.js` is a full example):

```js
ATLAS.kit({
  name: "Tbilisi", for: "Tbilisi, Georgia: Old Tbilisi and the centre",
  look: { brick: [...], stone: [...], slate: [...], tile: [...], flats: [...], landmark: 0xeadcc4, lmRoof: 0x8b5b45, pitched: 0.55, tall: [1.05, 2.1] },
  dress: [{ kind: "balcony", share: 0.5, near: [165, 140], r: 70, color: "#6f97ab", trim: "#2f3f48" }],
  models: { sameba: { size: 12, parts: [["box", "stone", 0, 0, 0, 12, 1.1, 12], ["cone", "gold", 0, 10.4, 0, 3.7, 2.8, 3.7]] } },
  landmarks: { "Holy Trinity Cathedral of Tbilisi": "sameba" }
});
```

- **`look`**: the colours of the ordinary streets (wall colours `brick` and `stone`, warehouses `ware`, roofs `slate` and `tile`, flat roofs `flats`; the landmarks' `landmark` and `lmRoof`), laid over the map's age. `pitched`: the share of pitched roofs (0 to 1). `tall: [min, max]`: how many times the usual height the houses stand.
- **`dress`**: details added to a share of the ordinary houses: `balcony` (a wooden balcony on each long face, one to three storeys; `color`, `trim`, `width`) and `dome` (a small dome on the roof; `color`). `near: [x, y]` and `r` keep it to one quarter.
- **`models`**: buildings made of simple parts, the way Atlas's own are. A part is `[shape, material, x, y, z, sx, sy, sz, ry, { rx, rz }]`, in squares of the plan about the model's centre, y up. Shapes: `box`, `roof` (a gable, its ridge along x), `cylinder`, `cone`, `frustum` (a cone cut short), `pyramid`, `spire` (a four-sided needle), `obelisk`, `dome` (a half sphere), `tube` (a cylinder lying along x), `arch` (a half ring standing on its feet, sx wide), `ball` and `ring` (centred on y); every shape but the ball and the ring stands with its foot at y. Materials: `wall`, `roof` (the place's colour), `dark`, `glow`, `green`, `glass`, `gold`, `copper`, `stone`, `brick`, `wood`, `white`, `black`, `water`, or any colour `"#a8654a"`. `ry` turns a part about the upright, `rx`/`rz` tilt it.
- A model's `size` is the width it is drawn at: on a map with a real footprint for the landmark it dresses, it is scaled to that footprint (turned along it), so the cathedral covers its true ground; `fit: false` and `scale` keep it as drawn. A place's model may say `claim` (the ground it takes, in squares).
- **`landmarks`**: which model each of the map's landmarks wears, by its name as `city.js` has it (`check` notes a name the map does not have). A landmark you add yourself may name its model directly: `c.landmarks.push({ name: "Sulphur Baths", kind: "custom", at: [197, 167], model: "sulfur-bath" })`. A place may wear a model too (`model: "balcony-house"`); on a real map a place still stands in the map's own building there, and a kit model is for its landmarks.

**Designing one.** Find out what the place looks like: its five to ten most famous buildings (from what you know; search the web when you can), and its ordinary streets (wall colours, roof material and pitch, storeys, the details that make them its own). Scale: one square is `geo.mpu` metres on a real map (in `city.js`; about 8 at 2.6 km) and about 5 on an invented one. Draw each famous building in ten to forty parts, its silhouette before its details: what someone would know it by from across the river. Then `check`, `build`, and look at it beside a photograph in your mind: the dome the right colour, the tower the right height against the houses, the colours of the street. Write what you made in the report.

## 5. The age and the part of the world

`look` is the age: `"medieval"` (plaster, timber and thatch, steep roofs, no lamps or factory stacks), `"industrial"` (also `"old"`: brick terraces, slate, chimney pots, gas lamps, stacks, an aged paper plan), `"modern"` (flat roofs, glass towers, a clean plan), `"scifi"` (also `"future"`: white modules and domes, grey ground, black sky and stars; `--era future`, or a year from 2100). A year decides it when no era is given: before 1650 medieval, before 1946 industrial, before 2100 modern, after that the future. A look may also be an object laid over one of them: `look: { base: "industrial", lamps: false }`.

`region` is the part of the world, laid over the look: `"mediterranean"` (stucco and terracotta), `"desert"` (sand-coloured walls, flat roofs, pale ground), `"eastasia"` (white plaster, dark timber, grey tile). Anything else is the temperate north. A real city's region comes from its country; `--region` overrides.

`ground` (sites): `"grass"`, `"sand"`, `"dirt"`, `"snow"`, `"concrete"`, and for the future `"regolith"` (a moon's dust) and `"deck"` (a station's plan).

## 6. Putting the campaign's places on the map

Each place needs one of these in its registration (`ATLAS.place(id, { ... })`):

| Field | Meaning |
|---|---|
| `at: [x, y]` | Here, in plan units (the sheet is `sheet.w` by `sheet.h`, usually 320 by 200; x east, y south). On a real city or surveyed site the place stands **in the map's own building** at or nearest this spot (a surveyed outline, a hut, a house) and wears its true outline; set `at` on the building it really is. `native: false` keeps a model of its own instead. |
| `landmark: "Name"` | This place *is* that landmark: it stands there and wears its shape. The name must match one in `city.js`. |
| `region: "District"` | Somewhere in that district: places sharing one are spread round its centre. |
| `offmap: true` | Not on this map (another town, a ship at sea). |

For a real city, find where a real address or building falls on the sheet:

```
node atlas.js locate <dir> "221B Baker Street"
```

It prints `at: [x, y]`, or says the spot is off the sheet (then widen `--km` or re-centre with `--around`).

`model` chooses the building a place wears when it is not a landmark (`"church"`, `"pub"`, `"warehouse"`, `["hall", 4]`...); `atlas.js catalogue` lists them. On a real or surveyed map it is used only when no building of the map's own is within 12 squares (`check` names such a place): there, a model dropped among the real buildings stands out of place, as the user saw on Birkenau. `badge` puts a short GM-only mark on its pin.

A survey often keeps a building that is now a ruin as a closed `wall` round its foundations (Birkenau's barracks and crematoria are all like this). Those outlines count as buildings: places stand in them, and a landmark added by hand on top of one takes that true outline instead of the rectangle it was drawn with. Look for them in `city.js` before drawing a footprint yourself.

## 7. Checking the result, and changing it

After any `city` command:

1. Read the list of landmarks it printed. You know the city: is anything famous missing? Add it with `--must`, or raise `--landmarks`. Is a kind or a roof wrong (a domed cathedral given a spire, a castle called a hall)? Correct it.
2. Remove anything that could not be there in the story's year but slipped through because the survey gives it no date.
3. `build` and look at it. Is the story's quarter in the middle of the sheet? Are the river and the main streets where they should be?

`city.js` is rewritten whenever the command runs, so never edit it. Changes go in `campaign.js`:

```js
ATLAS.cityEdit(c => {
  c.title = "Florence in the Year of the Conspiracy";
  const duomo = c.landmarks.find(l => l.name === "Santa Maria del Fiore"); duomo.top = "dome"; duomo.h = 18;
  c.landmarks = c.landmarks.filter(l => l.name !== "Ex-Cinema Capitol");
  c.landmarks.push({ name: "The Hanged Man", kind: "hall", at: [141, 96], h: 2.4 });
  c.rows.push({ at: [60, 40], ang: 0, n: 12, cols: 2, w: 9, d: 2.3 });          // a site: twelve huts, two deep
  c.districts["The Rookery"] = [88, 120];
});
```

## 8. The data format

`ATLAS.city({ ... })`. Coordinates are plan units; a line or ring is `[[x, y], ...]`. Everything is optional except `roads`.

| Field | Form | Notes |
|---|---|---|
| `look`, `region`, `ground` | strings | Section 5. |
| `seed` | number | The same seed grows the same city. |
| `sheet` | `{ w, h, margin }` | The mapped area and the border of plan printed round it. Default 320, 200, 30. |
| `title`, `subtitle`, `scaleLabel`, `scaleTicks` | strings, `[5 labels]` | The cartouche and scale bar. |
| `real` | `true` | A surveyed city: nothing is grown or invented, nothing named. Set by the fetch. |
| `grow`, `wobble`, `clear` | booleans | Grow side streets; wobble hand-laid roads; move roads aside for campaign buildings. Each defaults to on for an invented city, off for a real one. |
| `fill` | `false` | A site: no houses are grown at all. |
| `built` | `[{ pts }]` | Keep grown houses to these zones. |
| `ruin` | 0 to 1 | The share of grown houses standing roofless. |
| `roads` | `[[name, class, pts, place?, { label: false }?], ...]` | Class 0 main road, 1 street, 2 lane, 3 alley. |
| `rivers` | `[{ pts, hw, smooth, label, big, repeat, wharves, ghost }]` | `hw` half-width. `ghost`: the water is drawn by a basin; the line carries the name and boats. |
| `basins` | `[{ name, pts, holes, at }]` | Water as an area: sea, lake, dock, a river's banks. `holes` are islands. |
| `parks` | `[{ name, pts, trees }]` | `trees` 0 to 1.5: how wooded. |
| `open` | `[{ kind, pts }]` | Ground that is neither built nor green: `"sand"`, `"field"`, `"paved"`, `"yard"`. |
| `plazas` | `[{ name, pts }]` | Paved squares. (`squares: [[name, x, y, r]]` are round green ones.) |
| `rails` | `[{ name, pts }]` | `railHeight` (default 1.1) is how high they ride: low for a line on the ground. |
| `walls` | `[{ pts, kind }]` | `"wall"` (a town wall with towers), `"fence"` (wire), `"hesco"` (a blast wall). |
| `districts` | `{ "Name": [x, y] }` | Named on the map; a place's `region` may be one. |
| `landmarks` | `[{ name, kind, at, pts, holes, h, top, size, ang, label, major }]` | Below. |
| `rows` | `[{ at, ang, n, cols, w, d, h, gap, colGap, roof, color }]` | Huts side by side along `ang` (radians: `Math.PI / 2` runs south; a value above 6.3 is read as degrees), long side across it. `roof`: `"pitched"`, `"flat"`, `"barrel"`, `"tent"`. |
| `footprints` | `[{ pts, h, ruin }]` | Surveyed ordinary buildings, each raised to `h`. |
| `heights` | `{ cell, cols, rows, x0, y0, v: [...] }` | How tall each quarter stands (modern look). |
| `names` | `{ pool, suffix: [[...], [...], [...]], format }` | Names for grown streets. `format: "{s} {n}"` puts the kind first (Via Roma); `"{n}{s}"` joins them (Kirchgasse). |
| `grand`, `crooked`, `rich`, `wharf`, `height` | functions of `(x, y)` | Where streets are wide, crooked, well-to-do; where warehouses line the water; where houses stand low. |
| `gasworks`, `forts`, `towers`, `signs`, `boats`, `roofs`, `abbr` | | As in `example-city/campaign.js`. |
| `credit`, `creditUrl`, `geo` | | A real city's source and where it is. Written by the fetch; leave them. |

**Landmarks.** `kind` decides the shape; `pts` (a footprint) and `h` (height in plan units) make it this particular one; without them it takes the usual size for its kind, scaled by `size`.

| kind | what stands | `top` |
|---|---|---|
| `tower` | the footprint raised; glass in a modern city | `taper` (stepped, with a mast), `stone` (a masonry tower with a cap) |
| `hall` | any notable building: the footprint raised, with a roof slab | `dome`, `spire` |
| `church` | nave with a ridge roof and a west tower | `twin` (two towers), `dome`, `flat` (none) |
| `mosque`, `dome`, `pagoda`, `pyramid` | as named | |
| `castle` | curtain wall on the outline, towers at its corners, a keep | `spires` |
| `stadium` | a bowl on the outline, a pitch inside | |
| `spire` | a lattice tower by default | `needle` (a mast with a pod), `obelisk`, `column`, `light` (lighthouse), `stack` (chimney) |
| `monument` | a plinth and obelisk | `statue`, `fountain` |
| `bridge` | a deck on the outline | `pylons` |
| `wheel` | a great wheel | |
| `watchtower`, `tent`, `hangar`, `bunker`, `gate`, `tank`, `pad` | what a compound has | |
| `park`, `square` | nothing: the name only | |

`label: false` stands it unnamed; `major: true` names it from far off.

## 9. Rules the engine keeps

Each was learned by getting it wrong; do not undo them.

- The plan is printed, and buildings stand, right to the edge of the sheet. Nothing fades out; nothing stands off it.
- The frame runs round the very edge of the sheet, not a margin in from it.
- Nothing on the ground moves with the camera or changes with zoom: the plan is printed once, in sharp tiles.
- The table under the sheet is drawn first and kept out of the depth buffer; the near plane follows the view.
- Paper grain is soft and fixed to the plan, never one random value per pixel.
- Lamp posts, chimneys and trunks are hidden when too far to see.
- Surveyed water is ruled, not edged, so pieces that meet show no seam.
- If 3D cannot start, a flat map with the same places takes its place.
- A hand-laid city must build exactly as it did before any change to the engine (`dev/city_regression.js` in the workspace proves it against the Wormroot Idol's London).

## 10. When something goes wrong

- **"no map server would answer"**: the survey comes from free public servers that are often busy. The command already tries five, three times. Wait a few minutes and run it again; whatever part was fetched is kept.
- **The wrong place was found**: add the country or region to the name, or use `--center "lat,lon"`.
- **The story's quarter is at the edge**: `--around "a landmark in that quarter"`.
- **Too few streets ("only main roads kept")**: the sheet is too wide for full detail. Use a smaller `--km`.
- **A famous landmark is missing**: `--must "its name"`; if the survey does not have it under that name, `locate` it and add it by hand with `cityEdit`.
- **A landmark is the wrong shape**: set its `kind` and `top` with `cityEdit`.
- **Slow on a phone**: a smaller `--km`, or fewer landmarks. `check` warns above 26,000 buildings.
