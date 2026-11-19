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

## Done since

- **Phase 1, built 18 Nov** (approved: "ok do all of em"). `tectonics: 2` for every new world (world-invent.js `tectV`: a world made again keeps the version it was made with; `--tectonics 1|2`): some plates continental (as many as the land asks, the larger likelier), each carrying a **craton** near its middle from which its continent grows, slowed near its plate's edge (world-geology.js, `TV2`, `contPl`, `tvCost`); **coherent plate motion by slab pull** (1a): an oceanic plate heads for the nearest continental plate at 0.6-1 of the top speed, a continental plate drifts slowly, so borders slide or part between oceanic neighbours and converge at continents. Measured on three seeds of a four-landmass planet: plate border over land fell from 44-51% (more than the land's 39% share: borders cut continents) to 29-34% (borders in the oceans and along margins); the ranges now stand along the continents' active margins and the interiors are old plains. Seen: continents a little rounder than before (they take their plate's shape): to work on with phase 2 (lobes, microcontinents, rifted edges).
- **Phase 2, begun 18 Nov**: found already there: shelf width by margin type (world-shore.js: active and trench-side narrow, arcs narrower, rifted and collision margins wider, passive broad, ice-widened shelves). Added: **the ocean floor's age** (world-geology.js `floorAge`, tectonics 2: distance from the nearest oceanic spreading border at the plate's speed, capped at 180 million years) and **depth from it** past the slope's foot (half-space cooling: 2.6 km + 0.33 km × √age, at most 5.8 km), the ridge's separate swell no longer added; the continents' outlines made less like their plates' (the plate-edge brake uneven along the edge and softer; their own lobes). Measured: plate border over land 30-37% on three seeds. Left in phase 2: seamounts and oceanic plateaus, microcontinents, an earthquake layer (the Plates layer shows the borders by kind already).
- **Phase 2 finished 18 Nov**: seamounts (1-3 km cones, tops under the sea, on a 150 km lattice, more on older floor) and oceanic plateaus (broad 1-2 km swells) on the deep floor (world-shore.js, tectonics 2); microcontinents (0-3 slivers of continental crust 180-650 km off a continent, grown small: world-geology.js 1c); earthquakes on the Plates layer (atlas-world-art.js plateLayer: marks thickest on subduction zones and island arcs, then collisions and transforms, few on ridges and rifts).
- **Phase 3, the history, built 18 Nov**: each collision's age from the plates' own motion (400-1,800 km of shortening over the closing speed: world-geology.js collAge), young belts high and sharp, older ones worn lower (x0.62 past 80 million years), their plateaus lower still; the history recorded (world-tectonics.js layer.history: collisions with their ages and plates, subducting margins with the age of the floor arriving, continental rifts, old belts 250-1,100 million years as the roots of earlier oceans' closing) and named on the Plates layer ("Rose about 25 million years ago", the whole story on hover). Seed 21: 19 events from 5 to 966 million years. Left for phase 3: the past ages in the app (Make the world as it was…) and the history in the world's history tab.
- **Phase 4, in part (18 Nov)**: what the ice left where the glacial maximum's ice lay (world-geology.js 6b, tectonics 2): U-shaped valleys (floors flattened under the old ice) and terminal moraines at its edge (30-90 m ridges damming lakes behind). Already there: salt pans and dry lakes in dry hollows; rivers downhill to seas or lakes. Left: alluvial fans, antecedent rivers.
- **Phase 5, in part (18 Nov)**: **a validation tool** (scripts/world-validate.js <campaign>...: rivers climbing, rivers ending in water or at a confluence, high ground with a cause within 400 km (a plate border, an old belt), plate border over land against the land's share, land overlap between worlds): on three seeds, tectonics 2 passes every check (rivers climb at 0-1% of steps, 97-99% end in water or a confluence, 99-100% of high ground has a cause, borders on land 32-37% against 39% land, worlds overlap 12-46%); tectonics 1 is flagged for borders cutting continents (44-51%), the fault phase 1 mended. **Sea level** on a made world (the editing bar's Sea level, -10 to +20 on the height scale: an ice age's low sea to a hothouse age's high one; OV.style.sea, nothing made again). The planet regimes (stagnant lid, squishy, tidal, ice shell, frozen) were already there, from the planet's physics. Left: suggestions for a hand-drawn continent (its likely tectonic history, ranges, drainage) without changing it.
