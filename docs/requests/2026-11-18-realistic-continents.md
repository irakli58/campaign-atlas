# Scientifically realistic continental generation and plate tectonics (the user, 18 Nov 2026, verbatim)

ATLAS — Scientifically Realistic Continental Generation & Plate Tectonics
Claude, I want you to examine Atlas's existing planetary and continental generation systems and improve their scientific realism.
My goal is for continents to form through believable geological processes, rather than looking like randomly generated landmasses.
I want Atlas to generate Earth-like terrestrial planets with plausible continents, oceans, mountain ranges, tectonic boundaries, and geological histories.
This should apply to planets where Earth-like plate tectonics are scientifically appropriate, not automatically to every rocky planet.
1. Inspect the Existing Generation System
Before implementing anything, examine:

* Continental shape generation.
* Tectonic plate generation, if present.
* Elevation and heightmap generation.
* Mountain placement.
* Ocean basin generation.
* Coastline generation.
* Erosion and sedimentation.
* River and drainage systems.
* Climate and biome generation.
* Planetary geology settings.
* Existing manual geography editing.

Determine which systems already simulate geological processes and which rely primarily on noise or arbitrary shapes.
Do not rebuild working systems unnecessarily.
2. Tectonic Plates Should Drive Continental Structure
Continental placement should be influenced by an underlying tectonic model.
Represent, at an appropriate level of abstraction:

* Continental lithosphere.
* Oceanic lithosphere.
* Convergent boundaries.
* Divergent boundaries.
* Transform boundaries.
* Subduction zones.
* Continental collisions.
* Rift zones.
* Stable continental interiors.

Plate boundaries should influence the location of mountains, volcanic arcs, trenches, rift valleys, and earthquakes.
Plate motion should be coherent rather than assigning unrelated random directions to adjacent regions.
The generator doesn't need to become a full geophysical simulator, but its geological rules should produce internally consistent results.
3. Realistic Continental Shapes
Continents should develop believable large-scale structures.
Include features such as:

* Stable continental cores or cratons.
* Continental shelves.
* Mountain belts along collision zones.
* Passive continental margins.
* Active continental margins.
* Rifted continental edges.
* Peninsulas.
* Island arcs.
* Microcontinents.
* Inland basins.
* Broad coastal plains.

Avoid repetitive, uniformly jagged coastlines.
Different continental margins should have different characteristics depending on their geological history.
For example, a passive margin may have a broad continental shelf, while an active subduction margin may have a narrow shelf, steep relief, and an offshore trench.
4. Geological History and Continental Evolution
I want the generated continents to feel like they have a history.
Investigate a simplified geological evolution model involving:

* Continental assembly.
* Supercontinent formation.
* Continental rifting.
* Ocean basin opening.
* Subduction.
* Continental collision.
* Mountain building.
* Erosion.
* Sediment deposition.

A continent should not simply appear in its final form without any geological explanation.
Where practical, generate a simplified history that explains its major features.
For example:
"These mountains formed when two continental plates collided approximately 80 million years ago."
Use approximate ages consistent with the simulated history rather than arbitrary scientific-sounding numbers.
Do not attempt computationally expensive full geological simulations unless necessary.
5. Realistic Mountain Formation
Mountain ranges should be connected to geological processes.
Examples:
Continental collision

* Large mountain belts.
* High plateaus.
* Fold-and-thrust structures.

Oceanic-continental subduction

* Volcanic mountain chains.
* Coastal mountain belts.
* Offshore trenches.

Continental rifting

* Rift valleys.
* Fault-block mountains.
* Elevated rift shoulders.

Hotspots

* Volcanic islands.
* Volcanic chains.
* Large volcanic provinces where plausible.

Mountain ranges should form coherent structures rather than appearing as random isolated peaks.
Allow ancient mountain belts to become lower and more eroded over time.
6. Realistic Ocean Basins
Oceans should have plausible geological structures.
Include:

* Mid-ocean ridges.
* Abyssal plains.
* Oceanic trenches.
* Continental slopes.
* Continental shelves.
* Seamounts.
* Oceanic plateaus.
* Volcanic island chains.

Ocean floor age should influence broad seafloor depth where practical.
New oceanic crust forms near spreading ridges and generally deepens as it cools and moves away.
Sea level should determine which continental shelves are submerged.
Do not treat the ocean as a uniform flat area surrounding continents.
7. Coastlines and Sea-Level Changes
Coastline shapes should emerge from elevation, geological structure, erosion, and sea level.
Consider:

* Drowned river valleys.
* Fjords in formerly glaciated regions.
* Deltas.
* Estuaries.
* Barrier islands.
* Coastal plains.
* Rocky coasts.
* Tectonic uplift.
* Subsidence.

Do not distribute every coastline feature randomly.
For example, fjords should primarily occur in regions with an appropriate glacial history.
Deltas should form where sediment-bearing rivers enter suitable depositional environments.
Allow sea-level adjustments to expose or submerge continental shelves without regenerating the entire world.
8. Rivers and Drainage Must Respect Geography
Rivers should be generated after major topography has been established.
They should generally:

* Flow downhill.
* Follow connected drainage networks.
* Collect water from tributaries.
* Respond to rainfall and catchment area.
* Terminate in oceans, lakes, inland basins, or other physically plausible sinks.
* Form deltas where conditions support deposition.

Avoid rivers that arbitrarily cross mountain ranges or split into unrelated branches.
Allow exceptions where geological history explains them, such as antecedent rivers cutting through uplifting mountains.
9. Erosion and Geological Age
Different landscapes should reflect their geological age and environmental conditions.
Young mountain ranges may be steep and rugged.
Ancient mountain ranges may be lower and more rounded.
Glacial environments may contain:

* U-shaped valleys.
* Cirques.
* Glacial lakes.
* Moraines.

Arid environments may contain:

* Alluvial fans.
* Dry valleys.
* Eroded plateaus.
* Desert basins.

Humid environments may contain extensive river networks and weathered landscapes.
Keep erosion computationally manageable.
10. Climate and Latitude
Geography should influence climate, and climate should influence surface features.
Consider:

* Latitude.
* Prevailing winds.
* Ocean influence.
* Elevation.
* Rain shadows.
* Continental interiors.
* Temperature.
* Precipitation.

For example, a major mountain range can produce wetter windward slopes and drier leeward regions.
However, avoid overly simplistic rules such as assuming every western coast must be wet.
Reuse Atlas's existing climate systems wherever possible.
11. Different Planetary Geological Regimes
Not every terrestrial planet should have Earth-like plate tectonics.
Investigate support for different geological regimes.
Earth-like active plate tectonics

* Moving plates.
* Subduction.
* Continental collisions.
* Seafloor spreading.

Stagnant-lid planets

* Limited or absent Earth-like plate tectonics.
* Volcanic provinces.
* Impact structures.
* Broad crustal deformation.

Rift-dominated worlds

* Significant extensional tectonics.
* Rift valleys.
* Volcanic activity.

Geologically inactive worlds

* Ancient impact basins.
* Preserved craters.
* Limited active resurfacing.

These should be scientifically plausible configurations rather than arbitrary fantasy presets.
The generator should not assume that every rocky exoplanet has continents and liquid-water oceans.
12. Realistic World Variety
I don't want every generated world to resemble Earth with slightly different continents.
Allow variation in:

* Continental count.
* Continental size.
* Ocean coverage.
* Supercontinents.
* Fragmented continental arrangements.
* Island chains.
* Mountain distribution.
* Tectonic activity.
* Geological age.
* Sea level.
* Erosion intensity.

These parameters should interact plausibly.
For example, a young ocean basin formed through continental rifting should have a different structure from an old ocean basin approaching closure.
Avoid fixed templates that repeatedly produce the same continental arrangement.
13. Manual Worldbuilding Compatibility
I still want complete control over handmade worlds.
Allow the DM to:

* Draw continental outlines.
* Add and remove land.
* Modify coastlines.
* Place mountain ranges.
* Adjust sea level.
* Edit tectonic boundaries where supported.
* Create islands and inland seas.
* Change elevation.
* Preserve manually created geography.

If I draw a continent manually, Atlas should be able to offer scientifically plausible geological suggestions without replacing my drawing.
For example, it might suggest a plausible tectonic history, mountain placement, or drainage structure.
Do not silently overwrite handmade geography.
14. Scientific Accuracy vs Performance
I understand Atlas is a tabletop RPG worldbuilding application, not a professional geodynamics simulator.
I don't need perfect physical simulation.
I want a convincing scientific approximation that produces believable geography.
Prioritize:

1. Geological consistency.
2. Realistic continental shapes.
3. Coherent mountain ranges.
4. Plausible ocean basins.
5. Realistic drainage.
6. Geological diversity.
7. Reasonable generation speed.

Use simplified geological models where appropriate.
Avoid expensive simulations that provide little visible improvement.
15. Validation and Testing
Don't judge the generator only by whether the continents look attractive.
Test whether the geological structures make sense.
Generate multiple worlds with different seeds and examine:

* Continental shapes.
* Plate boundaries.
* Mountain locations.
* Ocean basin structure.
* Coastlines.
* River networks.
* Geological consistency.
* Repetitive generation artifacts.

Compare broad geological patterns against real Earth examples without simply copying Earth's continents.
Use scientific references such as USGS geological resources and published plate tectonics research.
Check for obvious problems, including:

* Mountains unrelated to plausible tectonic processes.
* Rivers flowing uphill.
* Randomly scattered volcanic arcs.
* Identical coastlines across multiple worlds.
* Implausible plate boundaries.
* Continental shelves with inconsistent geometry.

16. Preserve Existing Atlas Features
Do not break:

* Fantasy world generation.
* Sci-Fi planet generation.
* Manual terrain editing.
* Existing saved worlds.
* Political borders.
* Roads.
* Settlements.
* Climate and biomes.
* Player parchment maps.
* World-to-city navigation.
* Existing campaign data.

Use backward-compatible changes.
If a new geological model requires significant changes, present the architecture and ask for approval before implementing it.
17. Implementation Plan
First, audit the existing generator and identify the biggest scientific weaknesses.
Then propose improvements in stages.
Suggested priorities:
Phase 1: Improve continental structure and coastlines using existing tectonic data.
Phase 2: Improve mountain ranges, continental shelves, and ocean basins.
Phase 3: Improve geological history and erosion.
Phase 4: Improve river and drainage consistency.
Phase 5: Add planetary geological regime options and scientific validation.
Do not automatically implement a complete rewrite.
Start with the improvements that offer the largest increase in realism for the least complexity.
Final Goal
I want Atlas to generate continents that look and behave as though they developed through real geological processes over millions of years.
Mountains should have reasons to exist.
Continents should have coherent geological structures.
Ocean basins should reflect tectonic activity.
Coastlines should be shaped by geography, erosion, and sea level.
The goal is scientifically believable planetary geography, not simply prettier random noise.
Make Atlas's continental generation substantially more realistic while preserving its existing functionality and reasonable performance.
