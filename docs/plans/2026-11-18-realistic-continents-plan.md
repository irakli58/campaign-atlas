# Realistic continents: audit and staged plan

Answers `docs/requests/2026-11-18-realistic-continents.md`. Written 18 Nov 2026. It also takes in the playable past ages (`docs/requests/2026-11-18-world-ages.md`), whose core is built (`--age N`).

## 1. Audit: what already simulates geology, and what is noise

The world maker (`scripts/world-geology.js`, with `world-tectonics.js`, `world-shore.js`, `world-coast.js`, `world-ecology.js`) was rebuilt on 27 Oct on landscape-evolution research. Most of it is process-driven already.

| System | How it works now | Verdict |
|---|---|---|
| Plates | Grown from random seed cells over a winding cost; each plate gets an **independent random velocity** | Weak: motions are not coherent (no rotation about a pole, neighbours unrelated) |
| Continents | Grown from random seed cells over a **noise cost**, separately from the plates | **The biggest weakness**: continents and plates are unrelated, so plate borders cut continents arbitrarily and whether a margin is active or passive is an accident |
| Mountains | Uplift from each border's kind: continental collision (belt plus plateau), ocean under continent (coastal belt, volcanoes inland), ocean under ocean (island arc), rifts (sunken floor, raised shoulders), hotspots, slow warping | Good: ranges have reasons. Lacking: an **age** per belt (young and old belts are not told apart) |
| Erosion | Uplift and stream-power river incision solved together over many steps, hillslope creep, rain from the land's own ranges | Good: real landscape-evolution method (FastScape-style) |
| Heights | Earth's hypsometric curve applied at the end | Good |
| Ocean floor | Geologic coasts: shelf, slope, canyons off big rivers, by `world-shore.js`; otherwise by **distance from land**; ridge bump at diverging borders, trench at subducting ones | Partly: depth does not follow **crust age** (no young shallow ridge flanks, old deep basins); shelf width does not depend on margin type |
| Coasts | Fjords where the glacial maximum's ice reached the sea, deltas by sediment, rias, barrier islands, reefs by sea temperature, cliffs by rock hardness | Good: features follow conditions, not chance |
| Rivers | From the eroded land, lakes fill and spill, salt pans in dry hollows; always downhill | Good |
| Climate | Latitude, height, prevailing winds by belt, rain shadows, ocean currents (an Earth model), continentality | Good |
| Planet regimes | `--lid` plates / stagnant / squishy / tidal / iceshell / frozen (from the planetary layer): stagnant-lid swells and giant shields, rifts, craters | Good start; the regime is chosen by the planet's physics |
| Cratons | "Old shield barely rising" as a low uplift; the rocks layer marks ancient shields | Weak: no explicit stable cores that the continent is built around |
| Earthquakes | Not represented | Missing (cheap to add from the borders) |
| History | None, except the new `--age N` (plates carried back) | Missing: no dated events, no "this range formed 80 million years ago" |
| Sea level | Chosen during making; changing it means making the world again | Missing: no sea-level change on a made world |
| Hand-drawn worlds | A drawn sketch's land kept, its mountains where drawn, physics fills the rest | Good; missing: geological **suggestions** for a drawing |

## 2. The stages

Each stage keeps existing worlds exactly as they are: a world records its model, and only new worlds (or one made again by choice) get the new one, as the switch from "classic" to "plates" geology already does.

**Phase 1, the largest gain for the least work: plates and continents as one system.** This is the only significant architectural change, so it is the one for your approval:
- Plate motion from **Euler poles**: each plate rotates about a pole, so velocities vary smoothly across a plate and neighbouring plates' relative motions are consistent. Border kinds (converging, diverging, sliding) then follow.
- Continents **built on the plates**: each continental plate carries a **craton** (an old stable core) near its middle; the continent grows out from it, so it rides its plate. Borders then fall in the ocean or along continents' edges, not at random across them.
- **Margin types from that**: a continent edge on a converging border is an active margin (narrow shelf, trench, coastal range, volcanoes); one far from any border is passive (broad shelf, coastal plain); one on a diverging border is a rifted edge. Microcontinents (crust left between plates) and island arcs follow from the same rules.
- Supercontinent, fragmented and island worlds as **tectonic states** (one assembled continent; one rifting apart; many dispersed) rather than seed placement.

**Phase 2, ocean basins and margins:** sea-floor depth from **crust age** (the half-space cooling curve: ridges about 2.5 km deep, deepening to about 5.5–6 km on old floor), abyssal plains, seamounts and oceanic plateaus, shelf width by margin type, earthquakes along borders (a layer). Young basins (narrow, ridge in the middle) and old closing ones (wide, trenched) look different.

**Phase 3, history and age:** a short simulated history: plates assembled into a supercontinent, rifted, and moved to today, in steps (building on `--age`). Each mountain belt keeps when it rose, and older belts are worn lower; the map and the place cards can then say "These mountains rose when two plates met about 80 million years ago", with ages from the simulation. Past ages become playable maps in the app (Make the world as it was…).

**Phase 4, drainage and erosion by age and climate:** antecedent rivers through rising ranges where history allows; glacial landforms (U-shaped valleys, cirques, moraines) where the ice was; alluvial fans and desert basins in dry regions; erosion strength by climate. (Rivers already flow downhill and end in seas, lakes or basins.)

**Phase 5, regimes, variety and validation:** the regimes tied to the planet's physics (active plates, stagnant lid, rift-dominated, inactive), so no rocky world gets continents and oceans by default; a sea-level control on a made world; geological suggestions for a hand-drawn continent (a plausible history, where its ranges would be, its drainage), never overwriting the drawing; a validation run over many seeds checking each rule in section 15 (mountains with no cause, uphill rivers, scattered arcs, repeated coastlines, shelves at odds with their margin).

## 3. What I would start with

Phase 1, behind a new model name so every existing world is untouched, tested on a dozen seeds and land types against the checks in section 15, then Phases 2 to 5 in order. Each phase is a few sessions; Phase 1 and 2 together give most of the visible gain.

## What needs your yes

- Phase 1: continents built on the plates, plate motion from rotation poles, for **new** worlds (existing ones keep theirs).
