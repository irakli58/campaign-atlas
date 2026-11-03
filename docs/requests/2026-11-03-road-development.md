# Manual road creation and realistic road development (the user, 3 Nov 2026)

Pasted by the user, verbatim, while the trial road network (docs/research/2026-11-03-road-networks.md, atlas.js roads)
was open on the showcase world. Just before, they had approved the modular features proposal and said "dont forget
scifi too".

---

ATLAS — Manual Road Creation & Realistic Road Development System
Claude, I want to improve Atlas's world map road generation and map editing systems.
Right now, I think the world generator creates far too many roads. The resulting networks look like the infrastructure of a highly developed 21st-century country, even when the world is supposed to be medieval, ancient, or relatively undeveloped.
I want roads to reflect the civilization's actual level of development, and I also want DMs to be able to manually create and edit roads when building their own maps.
1. Add Manual Road Creation to the Map Editor
When a DM creates or edits a world map, they should be able to draw their own roads.
Include the ability to:

* Draw roads by clicking points on the map or using a freehand tool.
* Connect cities, towns, villages, and custom locations.
* Choose road types, such as dirt paths, trails, paved roads, highways, and trade routes.
* Edit, extend, move, or delete existing roads.
* Create intersections, junctions, bridges, and mountain passes.
* Connect manually created roads to automatically generated networks.
* Adjust roads after terrain or settlements have been edited.
* Lock manually created roads so regeneration doesn't overwrite them.

Add an optional terrain-aware road drawing mode.
For example, if I draw a road between two cities, Atlas should be able to automatically find a realistic route following valleys, avoiding steep mountains, and crossing rivers at suitable locations.
However, I should also be able to override the suggested route and draw exactly where I want.
2. Add a Civilization Development Slider
I want a slider that controls how developed a country's infrastructure is.
This should affect the number, quality, connectivity, and complexity of its roads.
For example:
Level 1 — Primitive / Tribal

* Very few established roads.
* Mostly footpaths and natural trails.
* Settlements connected by simple routes.
* Wilderness largely untouched.
* Rivers may be more important than roads.

Level 2 — Early Civilization

* Basic roads between important settlements.
* Some organized trade routes.
* Limited bridges and engineered infrastructure.
* Many villages accessible only by trails.

Level 3 — Medieval / Preindustrial

* Established trade routes connecting major towns and cities.
* Dirt roads, caravan routes, and occasional paved roads.
* Smaller settlements connected by secondary roads or paths.
* Major roads concentrated around economically important areas.
* Large wilderness regions with very little infrastructure.

Level 4 — Industrializing

* More extensive regional road networks.
* Improved bridges and engineered roads.
* Greater connectivity between settlements.
* Better transportation around industrial and commercial centers.

Level 5 — Modern / Highly Developed

* Dense, interconnected road networks.
* Major highways and extensive secondary roads.
* Most settlements connected.
* Advanced bridges, tunnels, and other infrastructure.

These should be examples rather than rigid historical rules. A highly organized ancient empire might build better roads than a fragmented medieval kingdom.
The slider should primarily represent infrastructure development, not technological sophistication alone.
3. Make Road Density Realistic
This is especially important.
The current generator appears to create too many roads, so investigate and correct the underlying generation logic.
A medieval country shouldn't have roads connecting practically every settlement in a dense network.
Instead:

* Major cities should have relatively few important roads leading outward.
* Towns should connect to nearby regional hubs.
* Villages should generally connect to the nearest useful road or market town.
* Remote villages might have only one access route.
* Some settlements might only be reachable by trails, rivers, or seasonal routes.
* Mountains, forests, deserts, and wilderness should contain large areas without roads.
* Trade routes should concentrate around economically important corridors.

Avoid generating unnecessary parallel roads between the same destinations.
Don't increase road density just because the map has many settlements.
The goal is a believable transportation network, not maximum connectivity.
4. Add Separate Road Density Controls
Alongside the civilization development slider, I suggest adding an optional Road Density setting.
For example:

* Very Sparse
* Sparse
* Moderate
* Dense
* Very Dense

This allows DMs to create a technologically advanced country with relatively few roads or a less advanced civilization with unusually extensive trade networks.
The development slider should determine the sophistication and typical structure of infrastructure, while road density controls how extensive the network is.
The settings should work together without producing unrealistic results.
5. Different Development Levels for Different Countries
Not every country in the generated world should have the same infrastructure.
Allow the DM to assign different development levels to individual countries, kingdoms, or regions.
For example, one wealthy empire might have excellent roads connecting its major cities, while a neighboring frontier kingdom relies mostly on dirt roads and caravan trails.
International roads should reflect the infrastructure on both sides of the border.
Also consider wealth, population, political stability, trade volume, terrain, and government investment.
A wealthy trading city might have excellent infrastructure even in an otherwise undeveloped region.
6. Road Generation Should Still Respect Geography
Keep the terrain-aware generation system.
Roads should follow realistic geographical corridors and avoid unnecessary crossings of mountains, rivers, cliffs, swamps, and other obstacles.
Lower-development civilizations should generally have fewer engineered solutions, such as major bridges and tunnels.
A modern civilization may be able to build a tunnel through a mountain, while a medieval civilization would usually rely on a mountain pass.
Use the actual elevation and terrain data rather than simply drawing curved lines between settlements.
7. Integrate Roads With Existing Atlas Features
Atlas already has world maps, settlement generation, city maps, and explorable buildings.
Do not rebuild those systems.
Make sure manually created and automatically generated roads work with existing settlement locations, trade networks, and city maps.
Roads should connect logically to city entrances and existing street networks wherever possible.
Preserve the current ability to click city markers, enter generated cities, and explore buildings.
8. Regeneration and DM Control
The DM should be able to adjust infrastructure development or road density after generating a world.
However, changing a slider should not immediately destroy existing roads.
Provide a preview of the proposed changes before applying them.
Allow the DM to:

* Regenerate only the roads without regenerating the terrain or settlements.
* Preserve manually created roads.
* Lock individual roads or entire regions.
* Remove unnecessary automatically generated roads.
* Restore the previous network if the new one is unsatisfactory.
* Apply different settings to individual countries.

Any changes affecting established campaign geography should require DM approval.
9. Research and Testing
Before implementing these changes, research how road density and infrastructure differed across historical civilizations.
Compare road networks from ancient empires, medieval kingdoms, early industrial countries, and modern nations.
Investigate how population density, settlement hierarchy, wealth, geography, and technology influence the number of roads.
Use that research to design believable generation rules rather than arbitrary slider multipliers.
Test the generator with several world types and development levels.
I especially want to see comparisons between a medieval kingdom and a modern country using the same geography and settlements.
The difference should be immediately noticeable.
10. Important Implementation Instructions
First, inspect the existing map editor and road generation code.
Identify why the current system creates excessively dense road networks.
Reuse existing functionality instead of creating duplicate systems.
Preserve manually edited maps, existing campaigns, and current city navigation.
Before making significant changes, explain your proposed implementation and show me what you intend to change so I can approve it.
The final goal is to give DMs complete control over road networks while ensuring that automatically generated roads look appropriate for the world's level of development.
A medieval fantasy world should look like a medieval fantasy world, not a modern European country with highways everywhere.
