# How real coastlines form, and how Atlas makes them

Research for the user's request of 28 Oct 2026 (`docs/requests/2026-10-28-coastlines.md`): coastlines whose shapes are explained by geology, glaciation, sea-level history, waves and sediment, not by noise. This note sets down what shapes real coasts, the numbers the generator uses, and which step of `scripts/world-shore.js` answers each.

## 1. The first-order control: where the coast sits on its plate

Inman and Nordstrom (1971) sorted the world's coasts, at scales of about 1000 km, by plate setting, and that sorting still explains most of a continent's coastal character:

- **Collision (active, leading-edge) coasts** lie where an ocean dives under a continent: rugged, cliffed, mountainous, a narrow shelf (often 10 to 30 km) falling to a trench. The Pacific coasts of the Americas. Long and relatively straight, because they follow the plate boundary.
- **Trailing-edge (passive) coasts** lie far from any boundary, on the continent's old rifted edge: broad shelves, coastal plains, rivers that drain whole continents, deltas, barrier islands. The Atlantic coasts of the Americas. Afro- and Amero-trailing-edge coasts differ mostly in how much sediment big rivers bring.
- **Marginal-sea coasts** lie behind island arcs, sheltered from the open ocean: wide, shallow shelves, irregular hilly coasts, low waves, big deltas (the China seas, the Gulf of Mexico).

Atlas: each coast cell knows its margin from the plates (`geology` step 2): the distance to the nearest plate border and that border's kind. Shelf width and slope, wave exposure and how straight the coast runs follow from it.

## 2. Rock: why headlands stand and bays open

Hard rock (granite, gneiss, basalt, quartzite, massive limestone) erodes far more slowly than soft rock (clay, sand, marl, glacial till). Where bands of hard and soft rock meet the sea at right angles (a **discordant** coast), the soft bands are cut back into bays and the hard ones stand as headlands (the Dorset coast: Portland limestone against Greensands). Once a headland stands out, waves bend round it and attack its flanks, which leads to caves, arches and stacks. Where folded ridges run **parallel** to the coast (a **concordant**, Dalmatian or Pacific-type coast), a rising sea floods the soft valleys between the ridges and leaves long islands parallel to the shore (Croatia).

Atlas: a lithology field. Old continental shields are hard crystalline rock. Mountain belts are hard and banded, their bands running along the belt (the grain follows the plate border). Coastal plains and basins are soft sediment. Arcs and hotspots are volcanic. Warm shallow seas laid down limestone, and karst forms in it. A belt's bands give relief (ridges and valleys) and hardness. Where a belt meets the sea along its grain, the flooded valleys make Dalmatian islands. Across its grain, they make headlands and bays.

## 3. Ice: fjords, troughs and skerries

A fjord is a river valley that a glacier widened into a U and deepened, often far below today's sea level (more than half of a fjord's depth can lie below the sea), then flooded when the ice melted. The ice cuts deepest some way inland, where it was thickest, and less at the mouth, so many fjords have a shallow sill. A drowned valley with no glacial shaping is a ria, not a fjord. Fjord coasts belong to high-relief coasts that the last ice age glaciated: Norway, Chile and Patagonia, British Columbia and Alaska, southern New Zealand, Greenland. They are wettest on the coasts facing the westerlies, which fed the ice. Where the ice sheet ground over low, hard shield rock (Finland, eastern Sweden, Maine), it left a scoured surface of knobs and hollows. Flooded, that surface becomes a glacial archipelago of thousands of skerries.

Atlas: the climate of the glacial maximum is the present climate about 6 °C colder (more where the ice sheets stood). Where the coast and its highlands were cold enough for ice, the valleys draining them are carved into U-troughs that reach below the sea, deepest inland, with a sill at the mouth. Low, hard glaciated coasts are scoured into knobs and hollows.

## 4. Sea level: drowned valleys

At the last glacial maximum the sea stood about 120 m lower. Rivers cut down across the exposed shelf to its edge. When the sea rose again (most of it between 18,000 and 7,000 years ago), it flooded those valleys:

- **Rias** in hilly country: branching drowned valleys (Galicia, Brittany, south-west England).
- **Estuaries and drowned river systems** in low country (Chesapeake Bay is the drowned Susquehanna with all its tributaries).
- **Submarine canyons** off the river mouths that reached the shelf edge, carved further by sediment flows at lowstands. They are more common on steep active margins.

How far a drowned valley is still open depends on sediment supply. A big, muddy river has since filled its valley, and its delta now pushes out from the mouth. A small river in hard rock has left its ria open.

Atlas: the rivers' valleys near the coast are cut down as they were at the lowstand, then the sea returns. Each valley is then filled back in proportion to its river's sediment supply, from its basin's area, rain and the softness of its rock. What stays open is a ria or an estuary. What filled becomes a delta or a coastal plain.

## 5. Waves, tides and sediment: what the coast is built of

- **Waves.** The wave climate follows the wind belts. Westerly storm belts at 40 to 60° send swell across whole oceans. The trades bring steady waves from the east in the tropics. Exposure depends on fetch, the open water in the direction of the waves.
- **Longshore drift.** Waves striking the shore at an angle move sand along it. Sand is deposited where the drift slows: where the coast turns, in the lee of headlands, where two drifts meet, and where it runs out. The results are spits, tombolos and cuspate forelands. Behind a headland the beach curves into a crenulate, half-heart bay in static equilibrium (Hsu and Evans' parabolic bay shape; the log-spiral of Yasso). Bays are never perfect circles.
- **Barrier islands** (Hayes 1979) need gentle shelves with sand, small tides and moderate waves. They are long and narrow on microtidal coasts (tidal range under about 1 to 2 m), become short "drumstick" barriers cut by many inlets on mesotidal coasts, and give way to tidal flats where the range is over about 3.5 m. They are mostly limited to coasts whose mean wave height is under about 2.2 m. A lagoon lies behind them.
- **Deltas** (Galloway 1975) are classed by which process controls them. A river-dominated delta pushes out as fingers of distributaries (the Mississippi). A wave-dominated delta is a smooth, cuspate bulge lined with beaches and beach ridges (the Nile, the São Francisco). A tide-dominated delta is a funnel of channels and long islands with mangroves and tidal flats (the Ganges-Brahmaputra). About 80 % of the world's deltas lean to wave dominance, 10 % to tide and 10 % to river.
- **Tidal range.** Ranges are small in enclosed seas (the Mediterranean, the Baltic) and on narrow shelves. They are amplified over broad shelves and in funnel-shaped embayments.
- **Arid coasts.** Where onshore winds blow over sand-rich, dry coasts, dunes reach the sea. The Namib's sand comes from the Orange River, carried more than 700 km north by swell-driven drift and blown inland by south-westerly winds. The cold Benguela current keeps the coast dry.
- **Mud and plants.** Sheltered, tidal coasts with fine sediment grow mudflats and salt marshes in temperate and cold climates, and mangroves in warm ones. Mangroves reach about 30° of latitude, a little further on warm-current coasts.

## 6. Reefs and islands

- **Coral reefs** need warm, clear, shallow water. Corals live where the sea stays between about 18 and 36 °C, best at 26 to 28 °C. They avoid the mud of big river mouths. Fringing reefs hug tropical shores. Barrier reefs stand at the edges of tropical shelves.
- **Atolls** (Darwin) are rings of reef around a lagoon over a volcano that has sunk. They form on hotspot chains and old volcanic platforms in tropical seas, up to the "Darwin point". In Hawaii that point is at about 29° N; beyond it the reef cannot keep up with the subsidence and the volcano becomes a drowned seamount, or a guyot. Bermuda, at 32° N, survives only because the Gulf Stream warms it. The Maldives are atolls on a long volcanic ridge.
- **Volcanic island arcs** stand where one ocean plate dives under another. They are curved lines of separate volcanoes some 100 to 300 km from the trench, over the point where the slab reaches about 120 km depth. The arc runs parallel to the trench, closer when the slab dips steeply. The islands are cones, alone or merged into long islands (Java). Indonesia and Japan are arcs.
- **Hotspot chains** are lines of volcanoes along the plate's motion. They are youngest, highest and largest over the hotspot, older, eroded and smaller down the chain, then atolls in warm seas, then seamounts.
- **Continental fragments** are pieces rifted off a continent: Madagascar, the Seychelles, New Zealand.
- **Glacial archipelagos** are scoured shield rock, flooded (see 3). **Barrier islands** (see 5). **Delta islands** lie between distributaries.

## 7. The sea floor

The shelf breaks at about 130 m depth on average, near the glacial lowstand's shoreline. Shelves are tens to hundreds of km wide on passive margins and narrow on active ones. Beyond the break, the continental slope drops to about 3000 to 4000 m over some tens of km, cut by canyons. Then come the abyssal plains at 4000 to 6000 m, mid-ocean ridges at about 2500 m and trenches beyond 7000 m. Glaciated shelves are crossed by the troughs of the old ice streams, with banks between them. Tropical shelves can be flat reef platforms. Seamounts rise along hotspot tracks. A broad shallow shelf damps waves and amplifies tides. A steep volcanic island has deep water close in and takes the open ocean's full swell.

## 8. How irregular a coast is, and why

Measured coastline fractal dimensions differ by region. The South African coast is nearly smooth (D ≈ 1.02); its wave-straightened sandy shores run for hundreds of km. The west coast of Britain, glaciated and of hard, varied rock, is about 1.25. Norway's fjord coast is often given as about 1.5. Complexity is therefore not uniform: it follows the coast's origin. Atlas gives each coast cell a roughness from its kind:

| roughness | coasts |
|---|---|
| low | sandy, barrier and wave-dominated delta coasts; dune coasts |
| middle | cliffs and headland-bay coasts |
| high | rias, karst and concordant coasts |
| highest | fjords and skerries |

The detail the page adds when zoomed in follows that roughness, so a smooth coast stays smooth however close you look.

## 9. The order Atlas follows

1. Plates, continents, uplift and river erosion (unchanged: `world-geology.js`).
2. Rock and its grain, from the plates (lithology, hardness, the bands of the belts).
3. The sea level chosen, then the glacial maximum. Ice where it was cold enough. Valleys carved into troughs below the sea; low hard shield scoured.
4. The lowstand. Rivers cut their valleys down to the old shore.
5. The sea returns. Valleys flood, then fill back with each river's sediment: rias, estuaries, deltas.
6. Waves. The wave climate from the wind belts and the storm belts' swell; exposure by fetch. Soft rock on exposed coasts retreats; hard rock stands as headlands.
7. Deposition. Deltas built by type (river, wave or tide). Barrier islands with their lagoons and inlets where tides are small and shelves gentle. Spits where the drift runs past a turn of the coast.
8. Islands by their origin: arcs as chains of cones, hotspot chains aging into atolls in warm seas, scoured skerries, fragments.
9. The sea floor: shelf, slope and canyons by margin, troughs and banks, reef platforms, seamounts, ridge, trench.
10. After the climate: each coast classed (beach, dunes, marsh, mangrove, reef, cliff and so on) with the reason it formed there. The page draws it, and its "Coasts" view shows why.

## Sources

- Bosboom and Stive, *Coastal Dynamics* (TU Delft): [tectonic plate setting of coasts](https://geo.libretexts.org/Bookshelves/Oceanography/Coastal_Dynamics_(Bosboom_and_Stive)/02%3A_Large-scale_geographical_variation_of_coasts/2.03%3A_Tectonic_control_of_coasts/2.3.2%3A_Tectonic_plate_setting_of_coasts), [summary of the tectonic classification](https://geo.libretexts.org/Bookshelves/Oceanography/Coastal_Dynamics_(Bosboom_and_Stive)/02%3A_Large-scale_geographical_variation_of_coasts/2.03%3A_Tectonic_control_of_coasts/2.3.4%3A_Summary_of_the_tectonic_classification), [classification of deltas](https://geo.libretexts.org/Bookshelves/Oceanography/Coastal_Dynamics_(Bosboom_and_Stive)/02%3A_Large-scale_geographical_variation_of_coasts/2.07%3A_Process-based_classification/2.7.3%3A_Classification_of_deltas)
- Penn State, [Plate tectonics and coastal classification](https://courses.ems.psu.edu/earth107/node/558); National Research Council (1994), [Environmental Science in the Coastal Zone, ch. 7](https://nap.nationalacademies.org/read/2249/chapter/7)
- Coastal Wiki, [Wave-dominated river deltas](https://coastalwiki.org/wiki/Wave-dominated_river_deltas); Nienhuis et al. (2020, Nature), global delta morphology (wave about 80 %, tide 10 %, river 10 %)
- Hayes (1979), *Barrier island morphology as a function of tidal and wave regime*, through [Origin, evolution and classification of tidal inlets (J. Coastal Res. SI 69)](https://bioone.org/journals/Journal-of-Coastal-Research/volume-69/issue-sp1/SI_69_3/Origin-Evolution-and-Classification-of-Tidal-Inlets/10.2112/SI_69_3.full) and [Springer's encyclopedia entry](https://rd.springer.com/referenceworkentry/10.1007%252F978-3-319-93806-6_212)
- [Fjord (Wikipedia)](https://en.wikipedia.org/wiki/Fjord); [Concordant coastline (Wikipedia)](https://en.wikipedia.org/wiki/Concordant_coastline)
- Hsu and Evans (1989), parabolic bay shapes, through [IHSet documentation](https://ihcantabria.github.io/IHSetDocs/Model_description/models/static_equilibrium/equilibrium_planform/ihsetgonzalez.html)
- Mandelbrot (1967), [How long is the coast of Britain?](https://gsp.humboldt.edu/olm_2021/Courses/GSP_510/Articles/Mandelbrot1967.pdf), Science 156
- Grigg (1982), [Darwin point](https://doi.org/10.1007/bf00286537), Coral Reefs 1; [Atoll (Wikipedia)](https://en.wikipedia.org/wiki/Atoll)
- EarthByte, [arc-trench distances](https://www.earthbyte.org/calculating-arc-trench-distances-using-the-smithsonian-global-volcanism-project-database/); USGS, [This Dynamic Planet](https://pubs.usgs.gov/gip/99/pdf/gip99_chapter1ppt.pdf)
- Namib: [Bluck et al. (2007), J. Geol. Soc.](https://eprints.gla.ac.uk/11465), [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/10217849)
- Submarine canyons and lowstand rivers: [EGU 2018 abstract](https://meetingorganizer.copernicus.org/EGU2018/EGU2018-11124.pdf?pdf)
- Headlands and bays: [Internet Geography](https://www.internetgeography.net/topics/how-do-geological-structure-and-rock-type-influence-coastal-forms/)

No dataset was downloaded. The rules above are applied to each world's own plates, rock, climate and rivers, and no real coastline's shape is copied.
