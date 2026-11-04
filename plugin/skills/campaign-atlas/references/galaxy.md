# The galaxy

The user asked (26 Oct 2026, the master plan, parts 11 and 12) for galaxies of hundreds or thousands of star systems, made deterministically and lazily, with sectors, territories, trade and warp routes, explored, unexplored, dangerous and restricted space, stations, colonies and anomalies; a system that opens to its worlds, each world with coherent properties; a ship with fuel, reach, cargo, condition and crew; courses with their fuel, days, dangers and places to refuel; and star charts the players fill in as they explore, scan, buy or are told. A campaign among the stars gets a galaxy; a story in one system can keep a world map with the star-chart look (`world.md`) instead, and a story that does both may have both.

## Contents

1. Growing it
2. What the council writes over it
3. On the page
4. Courses, fuel and time
5. The players' charts
6. Ships to walk through
7. What `check` asks

## 1. Growing it

```
node scripts/atlas.js galaxy <campaign> --systems 400 --seed verge --shape spiral --arms 3 --span 100 --name "The Kestrel Verge"
```

It writes `galaxy.js`, which holds only these settings: every page grows the same galaxy from them, so nothing is stored system by system. `--systems` 20 to 5000; `--shape` spiral (with `--arms`), cluster, ring or elliptical; `--span` the light years across. It prints what grew: the sectors, lanes, powers, colonies, stations and fuel, and the home system (a settled, fuelled system near the middle, with charted space round it). `--replace` grows another (the council's names would then fall on other systems). Never edit `galaxy.js` by hand beyond its settings.

`--list` shows the systems for choosing where the story happens: `--colonies` (settled or with a station), `--near S237 --within 15` (with their distance), `--max 60`. Each line: id, name, star, sector, what is there (colony, station, fuel, mining, research, derelict, anomaly), and the power that holds it.

What grows, from the seed alone: every system's place, star (from red dwarfs, most of them, to blue giants, white dwarfs, neutron stars and black holes; some double), name (spoken or a catalogue number) and sector; lanes to the nearest systems, joined so every system can be reached; colonies (likelier round yellow and orange stars), stations, fuel, mining, research, derelicts and anomalies; charted space round home, dangerous regions (nebulae, storms, pirate space) and restricted space; and a few powers grown out from their capitals along the lanes. A system's worlds grow only when it is opened (section 3).

**The worlds are worked out from their physics** (since 3 Nov 2026, the user's approved plan in the workspace's reviews/2026-11-03-planets.md, every galaxy upgraded; `engine/atlas-planet.js`). Each step follows from the ones before:
1. The star (its light, mass, temperature, age, flares).
2. The system (its frost line, its disc, its orbits; giants mostly beyond the frost line; a hot Jupiter round about one Sun-like star in a hundred).
3. Each world's mass and make-up, then its radius, gravity, escape velocity and density.
4. Its spin (a day, its tilt, tidal locking to its star, or held off by thick air).
5. Its insides (plates, a stagnant or broken lid, tidal heating, an ice shell; its magnetic field).
6. Its air (kept or lost by the cosmic shoreline; carbon dioxide drawn down by seas and plates, or left in the air after a runaway greenhouse).
7. Its warmth (its star's light, its albedo, its greenhouse; day and night, equator and pole, seasons).
8. Its liquids (water, methane, lava, an ocean under ice).
9. Its winds (cells and jets by its rotation; their force by the air's density).
10. Radiation, then life, by the realism level.
11. What kind of world it is, read from all the rest.
12. Habitable and landable, kept apart.
13. Its moons, inside half its Hill sphere and outside its Roche limit, and its rings.
14. Its colours: from its rock, ice, seas and air; plants coloured by their star, marked as speculative.

**Settings in galaxy.js:** `realism: "hard" | "balanced" | "creative"` (balanced by default), and `tech: "suits" | "armoured" | "deep"`, which decides what can be landed on (armoured landers by default).

**On the page:**
- **The whole profile:** each world's card has it (physical, atmosphere, environment, its system), and why each is so.
- **Open its surface:** a world that can be landed on has this button. It makes the whole globe from its physics in the page's background worker the first time (a few minutes), keeps it in the browser, and opens it in the world map as one of the campaign's worlds, in the "planet" look's own colours (`world.md`, Many worlds). Which surfaces were opened is kept in collection `planetworlds`. **Its environment is worked out first** (since 4 Nov 2026, the user's plan in the workspace's reviews/2026-11-04-environments.md; `environment()` and `surfaceFlags()` in `atlas-planet.js`, the generator's `--env`): which processes made its surface and how strongly, from its physics, never a preset: its liquid and how much (none: all land, its low crust dry plains), what wears it (running liquid, wind by its air's density, ice), its craters and great basins (flooded with lava where it had volcanism), its volcanism by its insides (shield volcanoes and rifts, Venus's lava plains and coronae, Io's volcanic pits and flows over sulphur, Europa's ice ridges and chaos), its climate by its turning and air (its own number of wind belts, evened by thick air, none without air), life (no forests or grassland without it: bare ground of its own materials), its shores (beaches only with water and waves; a methane or lava shore plain), planetary names (Planitia, Montes, Mare, Lacus); the profile says what made it. Surfaces opened before this are made again when next opened, the game master's places and changes on them kept. Before it, the generator was told: its mean warmth (`--temp`), its size (`--km`, a moon or small planet smaller than the Earth), what fills its low ground (`--liquid`: water, methane, lava, ice, or none, for dry basins and pans), no rivers and no rain where nothing liquid runs (`--norivers`, and the dry climate), impact craters where no air, water or moving crust wears them away (`--craters`), volcanic swells, giant shield volcanoes and rifts instead of mountain belts where the crust does not move (`--lid`), and warmth and rain round the point under its star on a world locked to it, the night side frozen (`--locked`).
- **Large moons** that can be landed on (under Its large moons in the whole profile) open their surfaces the same way. A moon is named after its planet with a Roman numeral, outward from the planet (`p.moonNames` keeps a name of the campaign's own).
- **Work it out again** (with Edit the galaxy on): the planet editor. The game master changes what a world is made of or where it lies (orbit, mass, water, iron), or sets its insides, its air (pressure and main gas) or its life, and the planetary layer works out the rest as it did when the world was made (`A.planets.rework`; the world's own chances, kept as it was made, fall the same way, so only what follows from the change changes). **What would change** is listed, each with why, before **Keep it**. **Randomise** makes another world near that orbit, of the kind chosen if its star allows one (or says it does not). **As it was made** brings it back. Kept in the system's `gedits` document as `bodies.p[n].phys`.
- **Scanning as play:** what the players know of each world: nothing yet, seen from afar (size, orbit, moons), scanned from orbit (kind, gravity, day, air, warmth, liquids, weather), surveyed on the ground (life, dangers, minerals, radiation, landing, whether people could live there). **Scan it** moves it on one step and the world's time by the hours it takes (1, 8, 48 with good sensors; twice as long with basic, half with military: the ship's **Sensors**). Kept with the system's chart (collection `charts`, `scans`). Their star chart lists the worlds they have scanned with only what they learned.
- **Show them the survey sheet:** a handout (kind `survey`, in `atlas-table.js`) with the world's globe and what they know of it, from their ship on today's date; it stays among their handouts.
- **The weather tonight** (from its own air and winds: a wind's force by the air's density, what falls, how cold the night, how far one sees; **Another night**), **its day and year** (its solar day from its turning and orbit, how many make its year, the date there now when the campaign keeps the world's time; a world locked to its star has no days) and **its history** (when it formed, its seas, its water or air lost, its locking, its life: rough times from what it is).

**The tests** are in the workspace:
- `dev/planets-test.js`: the Solar System rebuilt from orbits and masses, 10,000 random systems against the consistency rules and survey shares, and the planet editor (an unchanged world comes out the same; changed worlds stay consistent; an Earth moved outward keeps its seas from about 1 to 1.75 AU). It must end "all well".
- `dev/planet-surface-test.js` (`--kind desert` and so on): a surface opened in the page.
- `dev/planet-editor-test.js`: the editor, scanning, the survey sheet, the weather, day and year, history, the players' copy, and moons' surfaces in the page. It must end "all well".

## 2. What the council writes over it

In `table.js`:

```js
ATLAS.galaxyEdit({
  home: "S237",
  systems: {
    S237: { name: "Kestrel", desc: "What anyone could say of it.", gm: "Only for the game master.", flags: { station: 1 }, state: "charted" },
    S95: { name: "Corvan", desc: "…", gm: "Where the samples were taken.", flags: { research: 1 } }
  },
  territories: { compact: ["S237", "S35", "S194"] },
  ship: { name: "The Wren", cap: 30, fuel: 22, burn: 1, range: 9, speed: 2.5, cargoCap: 40, crew: "…", equipment: ["Survey scanner"], upgrades: [] },
  fuel: "normal"
});
```

- `systems`: the ones the story uses, by id: a name of the story's own, `desc`, `gm`, what is there (`flags`: colony, station, fuel, mining, research, derelict, anomaly: 1 or 0), and `state` on the players' charts at the start (charted, rumoured, visited, hidden).
- `territories`: the council's own powers and the systems each holds, by faction id (the factions of `table.js`, references/table.md, section 19; a faction may instead say `systems: [...]`). Given, they replace the powers the seed grew.
- `edits`: what the game master changed on the page and copied back (section 3, **Copy the changes**): written by the page, kept as it is.
- `home`: where the party begins. `ship`: the party's ship: `cap` its fuel, `fuel` what it has, `burn` fuel a light year, `range` light years a jump, `speed` light years a day, `cargoCap`, `crew`, `equipment`, `upgrades`, `condition` (Sound, Worn, Damaged, Crippled: a worse ship reaches less far). `fuel`: off (no fuel counted), easy, normal or hard.
- The campaign's places stand in systems: `ATLAS.place(id, { …, system: "S237" })`, and on a world of it with `planet: 2` (its number in the system, from 0, as the system's card shows it). A planetary colony, a mine, a derelict ship: each a place with its map, people and state, like any other.

The council chooses the systems from `--list` to fit the story: the home where it starts, the systems the trail or the hooks lead to, the dangers between. In a living world (`kind: "sandbox"`, council.md 6b) the powers are its factions, their territories its politics, and the events of `table.js` (references/table.md, section 18) can change what the game master marks on the charts.

## 3. On the page

**Star chart**, a view of its own for the game master: the galaxy drawn whole, dragged and scrolled; sectors, the powers' territories, lanes, charted space, dangerous and restricted regions; names more of them the closer the view; **Find a system**; **The ship** to go to it. A star clicked shows its system: its star, its sector, who holds it, the regions it lies in, what is there, the council's words and what only the game master knows, the players' charts for it, the campaign's places in it; **Open the system** draws its worlds on their orbits, belts and what people put there, and a world clicked shows all it is: size, gravity, warmth, air and pressure, climate, surface, liquids, life, minerals, dangers, whether anyone can land (open air, suits, specialised equipment, or impossible: never on a gas giant), whether people could live there, moons, what might be found, and the places on it. Most worlds are hostile or worse; a world with life has water.

**The game master's changes** (the world builder, 26 Oct 2026: a galaxy generated, built by hand, or generated and then changed). **Edit the galaxy** opens a row of tools; everything changed is kept in the page (collection `gedits`) and lies over the grown galaxy, so courses, fuel, lanes, sectors and territories follow it:
- **Systems:** **+ System** where the map is clicked; **Change it**: name, star, a companion star, what is there (colony, station, fuel, mining, research, a derelict, an anomaly), who holds it, its words and notes; **Move it** (the lanes go with it and every course is worked out again); **Take it off the map**; **As it was**. A system added joins its two nearest by lanes.
- **Regions:** **+ Region** where it is clicked: dangerous, restricted, charted space or unexplored, named, its reach in light years; click inside one to change it, move it or take it away. Courses are warned of each (and kept clear of danger where they can be).
- **Lanes:** **+ Lane** from one star to another: a lane (courses prefer them), a **trade route** (drawn in gold) or a **corridor** with a length of its own in light years (a jump gate, a fold: it counts that length for the fuel and the days, and a ship takes it however far apart the stars stand). Click a lane, or one in a system's card, to change it or **Cut it**.
- **Sectors and powers:** **+ Sector** where its heart is clicked (the systems nearest it join it); rename or take away sectors and powers, and add a power. **Paint territory**: choose a power (or a faction of `table.js`), and drag over the stars to give them to it, or click one.
- **A system's worlds** (**Open the system**, with the tools open): **Change this world**: its kind, name, orbit, size, gravity, warmth, air, pressure, climate, surface, liquids, life, minerals, dangers, landing, whether people could live there, moons, who holds it, notes; **Take it away**; **As it was**. **Add to the system**: a world of any kind at an orbit (its warmth from its star and orbit, the rest from its kind, to change after), a station, an orbital facility, a colony or settlement, a mining installation, a research facility, a derelict, an anomaly or ruins, in orbit or on a world; a belt. What does not hang together (breathable air at 250 °C, open water with no air, a giant to land on, a gravity its size could not have) is said under the world, never refused: it is the campaign's setting. A world that can be landed on and has no place of the campaign on it says how to make its surface a map to explore (`atlas.js wild --system --planet`: workflow.md, "The wild").
- **Undo** and **Redo** (Ctrl+Z, Ctrl+Y) take back every change of the visit. **Copy the changes** gives them all as `ATLAS.galaxyEdit({ edits: { ... } })` for `table.js`: the campaign keeps them under the page's own.

**Ask for a change** (28 Oct 2026, the master plan's "selective AI regeneration"; engine/atlas-ask.js): the game master chooses one thing, says in words what should change, and Claude picks one of the changes that thing allows and gives its values; the page shows the change, what it replaces and what it keeps, and nothing changes until **Make the change**. Nothing else is touched; without Claude the page says so and the tools do the same by hand. On a star system (its card): its details (name, description, notes, what it has, who holds it), a world added (its kind, its distance from the star, its name), or a site added (a station, a colony, a mining installation and the rest, on one of its worlds or in open space).

## 4. Courses, fuel and time

**Plot a course here** finds the way hop by hop, each jump within the ship's reach, along the lanes where it can (off them is riskier), round dangerous space where it can. It says the jumps, light years, days, fuel, where fuel can be had on the way (the ship fills up at each), and the dangers: dangerous or restricted space, systems not on their charts, jumps off the lanes, something strange, arriving low on fuel. A course the ship cannot make (too far a jump, the fuel run out between stations) is refused and says why. **Make the jump** (twice when there are dangers) moves the ship, spends the fuel, marks every system on the way visited on their charts, logs it, and moves the world's time on by the days it took (references/table.md, section 18), so the world's events come due as they would. **Refuel here** at a system with fuel. The fuel rule, the ship's condition and its log are on its card (collection `ship`).

## 5. The players' charts

Each system is on the players' charts or not: not on their charts, rumoured, charted, visited, or kept from them; and how they came by it (explored, scanned, bought the charts, recovered navigation data, someone told them, the story gave it). Charted space round home starts charted; the game master changes the rest as the party explores, scans, buys or is told; a jump marks what it passed through visited. **The star chart** on the players' screen (and in their copy, and on their phones) shows only what is on their charts, rumoured systems as names with a question mark, the lanes between charted systems, and the ship: the page sends the positions of those systems alone, never the seed, so nothing uncharted can be worked out from it.

## 6. Ships to walk through

An important ship is a place like any other, with its decks as floors: `node scripts/atlas.js ship <campaign> <place-id> --name "The Wren" --size small|medium|large [--decks N] [--derelict] [--rooms lab,armory,brig,hydroponics,observation] [--system S237] [--tier 1|2|3] [--seed S]` writes `places/<id>.js`. A corridor runs down each deck with rooms on both sides; the bridge is in the bow of the top deck, the airlock aft (the way aboard), engineering fills the stern of the lowest deck, and a lift runs through every deck. Its rooms: bridge, captain's cabin, crew quarters, galley and mess, medical bay, cargo holds, engineering, maintenance, stores, life support, communications, observation, and with `--rooms` a laboratory, armoury, brig or hydroponics; each furnished and with its guide entry. A small ship is one deck (tier 3), a medium two (tier 2), a large three and some forty rooms (tier 1). Every word is a first draft for the council to rewrite into the story: the log on the bridge, someone aboard, and on bigger ships the real manifest, a smuggler's compartment, a stowaway or something in the vents, a sealed laboratory, the medical record, the airlock that opened mid-voyage. `--derelict` makes the same ship dark, cold and broken. Every ship has its systems (power, oxygen, pressure and the rest: references/table.md, section 21; a derelict's already failing). It passes `check` as it is, and the map editor changes it after (the game master's changes, damage and refits among them, are kept in `edits/<id>.js`). `system:` puts it in a system of the galaxy; the ship of the galaxy's `ship` setting (section 2) is the same ship when the place carries its name.

## 7. What `check` asks

`check` has a "galaxy" line: the settings readable (a seed, a shape it knows), every system the council names or a territory holds in this galaxy, the home a system of it, the fuel rule and the ship's numbers sound, every place's `system` a system of it and its `planet` a world that system has; a note when no place stands in the galaxy.
