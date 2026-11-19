# Connect Cities: automatic road networks for handmade worlds, and Add More Life (the user, 18 Nov 2026, verbatim)

ATLAS — Connect Cities: Automatic Road Networks for Handmade Worlds
Claude, I want to add a Connect Cities feature to Atlas's manual worldbuilding editor.
Atlas already has a road generation system that creates roads when generating worlds automatically.
However, I want to use that same system after creating a world manually.
For example, I might:

1. Draw the continents myself.
2. Create mountains, rivers, and forests.
3. Place several cities, towns, and villages.
4. Create countries and political borders.
5. Click Connect Cities.
6. Atlas automatically generates a realistic road network connecting the settlements.

The existing road generation system should be reused. Do not build a separate road generator.
1. Connect Cities Button
Add a clearly accessible Connect Cities button to the existing world map editor.
It should work for:

* Completely handmade worlds.
* Procedurally generated worlds that have been manually edited.
* Worlds where the DM has added new settlements.
* Worlds with existing road networks.

The button should use the current world geography and settlement data.
2. Intelligent Road Connections
Don't connect every city directly to every other city.
Create a realistic transportation network based on:

* Settlement size and importance.
* Distance between settlements.
* Terrain elevation.
* Mountain ranges.
* Rivers and lakes.
* Coastlines.
* Existing roads.
* Political borders.
* Trade relationships, where available.
* Historical era and technology level.

For example:

* Two nearby villages might have a simple dirt path.
* A capital city might have several major roads.
* A remote mountain village might have only one difficult route.
* Two trading cities might have an important commercial road.
* Rival countries might have fewer cross-border connections.

The network should be connected where practical, but not unrealistically dense.
3. Geography-Aware Pathfinding
Use Atlas's existing terrain-aware road generation.
Roads should generally:

* Avoid unnecessarily steep slopes.
* Follow valleys where appropriate.
* Cross rivers at suitable locations.
* Use mountain passes.
* Avoid lakes and impassable terrain.
* Connect to existing roads when possible.
* Avoid unnecessary detours.

Don't simply draw straight lines between cities.
If the current road system already supports bridges, passes, or terrain costs, reuse those features.
4. Road Density Settings
Add a simple road density option:
Sparse

* Only essential roads.
* Major settlements connected.
* Many villages remain isolated.
* Suitable for early medieval or sparsely populated worlds.

Balanced

* Major cities connected.
* Important towns linked to the network.
* Some secondary roads.
* Suitable for established kingdoms.

Dense

* Extensive roads and local connections.
* More villages connected.
* Suitable for developed civilizations.

The default should depend on the campaign setting where appropriate.
Do not assume every medieval world has a modern-style road network.
5. Select Which Cities to Connect
I also want manual control.
Allow the DM to:

* Connect all eligible settlements.
* Select specific cities.
* Connect only cities within one country.
* Connect two selected cities.
* Connect newly added cities to existing roads.
* Exclude certain settlements.
* Mark regions as inaccessible.

For example, I might select three cities and ask Atlas to create a road network connecting only those three.
6. Preserve Existing Roads
This is extremely important.
If the DM has already drawn roads manually, do not delete, replace, or reroute them automatically.
The Connect Cities feature should recognize existing roads and build around them.
It should be able to extend the network without destroying previous work.
Manually created roads should be treated as protected unless the DM explicitly chooses to edit them.
7. Road Types
Use existing road types where available.
Examples:

* Footpaths.
* Dirt roads.
* Trade roads.
* Major highways.
* Military roads.
* Mountain trails.
* Bridges.
* Causeways.

Road types should be appropriate to the world's technology and development.
Don't introduce unnecessary new road systems if these types already exist.
8. Political and Economic Awareness
If the DM has manually created countries and diplomatic relationships, use that information when suggesting road connections.
For example:

* Allied kingdoms might have established trade roads.
* Rival kingdoms might have limited border crossings.
* Countries at war might have damaged or blocked roads.
* Merchant cities might have stronger commercial connections.
* Important ports might connect to inland trade routes.

However, these should be plausible influences, not absolute restrictions.
A hostile border can still have roads, including military routes, smuggling paths, or historically established infrastructure.
9. Preview Before Applying
Before adding roads permanently, show a preview of the proposed network.
The DM should be able to:

* Accept all proposed roads.
* Remove individual proposed connections.
* Change road types.
* Adjust routes.
* Regenerate suggestions.
* Cancel without changing the world.

Do not modify existing roads or geography until the DM confirms the preview.
10. Incremental Road Generation
I want this feature to work even after the world is already established.
For example:

* I create five cities.
* I click Connect Cities.
* Atlas creates the road network.
* Later, I add another town.
* I click Connect Cities again.
* Atlas suggests connections for the new town.

It should not regenerate the entire road network unnecessarily.
Reuse existing infrastructure whenever possible.
11. Manual Editing After Generation
All generated roads should remain fully editable using Atlas's existing road editing tools.
Allow the DM to:

* Move road segments.
* Change road types.
* Add intersections.
* Delete connections.
* Extend roads.
* Add bridges.
* Mark roads as abandoned or blocked.

Generated roads should behave exactly like manually created roads.
12. Integrate With Existing Systems
The new feature should work with:

* Manual worldbuilding.
* Procedural world generation.
* Terrain and elevation maps.
* Settlements.
* Political borders.
* Faction relationships.
* Trade routes.
* Dynamic world simulation.
* Player maps.
* Gazetteer.

Roads should remain linked to actual settlements and the existing transportation network.
If the player parchment map system is enabled, newly generated roads should not automatically become visible to players.
The DM should decide which roads are revealed.
13. Performance
The system should remain practical for large worlds.
If a world has hundreds of settlements:

* Avoid testing every possible route with expensive full pathfinding.
* Use reasonable candidate selection.
* Reuse existing road segments.
* Cache terrain costs where appropriate.
* Generate previews efficiently.

Don't freeze the editor while calculating the network.
14. Inspect Existing Code First
Before implementation, examine:

* Existing road generation algorithms.
* Manual road drawing tools.
* Settlement data.
* Terrain-aware pathfinding.
* Road network storage.
* Political and trade systems.
* Map rendering.

Determine how to expose the existing road generator through a new manual worldbuilding action.
Avoid duplicating code or creating incompatible road data.
15. Test the Feature
Test these scenarios:

1. A handmade world with five cities and no roads.
2. A mountainous world with difficult passes.
3. A world with multiple rivers and bridges.
4. Two neighboring kingdoms with hostile relations.
5. A world with existing manually drawn roads.
6. A large world with dozens of settlements.
7. Adding a new town to an established road network.

Verify that routes are sensible, existing roads are preserved, and the preview accurately reflects the final result.
Final Goal
I want to be able to build the important parts of a world myself and let Atlas handle the repetitive infrastructure work.
Draw continents → Place settlements → Create countries → Click Connect Cities → Get a realistic road network.
The system already exists for generated worlds, so focus on making it accessible and convenient for handmade worlds.
Do not rebuild the road generator. Reuse it, improve its integration where necessary, and preserve the DM's manual work.

---

The user, the same day, while this was being looked into (verbatim):

Claude, one change to the Add More Life feature:
Instead of using Sparse / Normal / Dense options, add a Settlement Density slider from 0 to 100, with a default value of 45.

* 0: No additional settlements.
* 25: A few scattered villages and hamlets.
* 50: Moderately populated countryside.
* 75: Numerous villages, farms, and trading posts.
* 100: Very densely populated areas wherever geography and available resources realistically support settlement.

The slider should control the number of additional settlements generated, not simply scatter villages uniformly across the map.
Continue considering terrain, water, farmland, existing cities, roads, political borders, technology, and available resources.
Show the estimated number of new settlements before generation, and let the DM preview the result.
Keep the Add More Life checkbox so the feature can be turned on or off independently of Connect Cities.
Reuse the existing road and settlement generation systems. Preserve all manually created geography, cities, and roads.

(No "Add More Life" existed before this: it is read as an option of Connect Cities that adds the settlements the road network's own settlement model (world-roads.js settle(), central places by the land's food) would put on the land, with its own checkbox.)
