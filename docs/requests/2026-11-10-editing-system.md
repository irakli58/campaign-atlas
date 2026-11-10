# Complete galaxy, planet, world and location editing (the user, 10 Nov 2026)

Pasted by the user, verbatim, while the approved galaxy plan was being built. A plan first: nothing major to be built
until the user approves it. The plan is in the workspace's reviews/2026-11-10-editing-plan.md.

---

ATLAS — Complete Galaxy, Planet, World & Location Editing System
Claude, I want to significantly expand the manual editing capabilities of Atlas, particularly for Sci-Fi galaxies, star systems, planets, world maps, and individual locations.
Most of the functionality needed for this already exists somewhere in Atlas. My main goal is to connect these systems into one seamless editing workflow rather than create entirely new tools.
I want DMs to have complete creative control over their galaxies and worlds, while still being able to use procedural generation whenever they want.
1. Fully Editable Galaxy Map
I want to be able to manually edit the galaxy after it has been generated.
Add or improve an Edit Galaxy mode where I can:

* Add new star systems anywhere on the galaxy map.
* Move existing star systems.
* Delete or duplicate star systems.
* Rename star systems.
* Edit their coordinates and properties.
* Change the central star's classification.
* Create binary or multiple-star systems.
* Add or edit warp routes between systems.
* Assign systems to factions.
* Mark important systems and points of interest.

When adding a new star system, I should be able to click an empty location on the galaxy map and select Add Star System.
Atlas should then let me choose between generating a random system, selecting a predefined system, or building one manually.
The new system must immediately become accessible through the existing galaxy navigation system.
Preserve existing manually edited star systems during galaxy regeneration.
2. Fully Editable Star Systems
When I click a star system, I should enter its existing star system map.
I want to be able to modify everything inside it.
For example:

* Add new planets.
* Remove planets.
* Duplicate planets.
* Change planetary order.
* Adjust orbital distances.
* Change planet sizes.
* Change planetary appearances.
* Edit orbital characteristics.
* Add moons.
* Add asteroid belts.
* Add space stations.
* Add custom points of interest.
* Change star types.
* Edit multiple-star configurations.

I should be able to click an empty orbital region and select Add Planet.
Then I should be able to choose an existing planet model, generate a new planet procedurally, or create one manually.
Use the existing orbital and planetary generation systems to keep the results scientifically plausible where possible.
If I deliberately create an unrealistic system, allow it as a custom Sci-Fi configuration, but warn me about scientific inconsistencies rather than silently changing my design.
3. Large Library of Premade Stars and Planets
I want you to create a large, varied library of premade star and planet models.
However, Atlas already has a 32-bit-style planetary image generation system.
Inspect and reuse that existing renderer and its assets. Do not replace it or build a duplicate rendering system.
Expand the library with many visually distinct presets.
Star models
Include a broad selection of stellar appearances, such as:

* Red dwarfs.
* Orange dwarfs.
* Yellow dwarfs.
* White main-sequence stars.
* Blue and blue-white stars.
* Red giants.
* Blue giants.
* Supergiants.
* White dwarfs.
* Neutron stars.
* Pulsars.
* Black holes and appropriate accretion environments.

These should be based on actual stellar properties rather than arbitrary colors.
Planet models
Create many variations within categories such as:

* Earth-like terrestrial planets.
* Desert planets.
* Rocky barren planets.
* Cratered airless worlds.
* Frozen planets.
* Ocean planets.
* Volcanic planets.
* Gas giants.
* Ice giants.
* Toxic atmospheric planets.
* Super-Earths.
* High-pressure planets.
* Tidally locked planets.
* Planets with rings.
* Planets with unusual mineral compositions.
* Scientifically plausible alien worlds.

Don't create only one model per category.
I want dozens of variations where appropriate, with different surface patterns, colors, cloud formations, geological features, and atmospheric appearances.
The presets should be reusable across different star systems without making every planet look identical.
Check which models and assets already exist before adding new ones.
4. Planet Appearance Editor
When selecting a planet, I want a simple visual editor.
It should allow me to adjust:

* Hue.
* Saturation.
* Brightness.
* Planet size.
* Cloud coverage and appearance.
* Atmospheric color.
* Surface colors.
* Ice coverage.
* Ring appearance, where applicable.
* Rotation and orientation.
* Other relevant visual properties.

I especially want hue/color controls and a size slider so that the premade planet models can produce much more variation.
For example, I should be able to select a premade gas giant, change its colors, adjust its size, and create a visually distinct planet without generating an entirely new model.
Show a live preview while editing.
Keep the controls intuitive rather than overwhelming.
Important: Separate cosmetic appearance from actual scientific properties.
Changing the visual size of a planet on the star system map should not automatically change its physical radius, mass, or gravity.
If I intentionally change its physical size, Atlas should offer to recalculate dependent scientific properties or allow a custom override.
Similarly, changing a planet's color should not silently change its atmosphere, temperature, or surface composition.
5. Manual World Generation — Draw to World
I also want to expand the existing Draw to World functionality.
Atlas already has world generation and map editing systems, so I want to combine them.
The DM should be able to create a world manually rather than relying entirely on procedural generation.
For example, I want to:

1. Open a planet's surface map.
2. Choose Create World Manually or Draw to World.
3. Draw the general shape of continents, islands, mountains, lakes, or other terrain.
4. Let Atlas transform my drawing into a detailed world using the existing generation engine.
5. Continue editing the result manually.

I should also be able to begin with a procedurally generated world and manually change its geography afterward.
The generator must respect my drawings rather than completely replacing them.
For example, if I draw a continent in a particular location, Atlas should preserve its general shape and placement while adding appropriate terrain detail.
If I draw mountains, the generator should incorporate them into elevation, erosion, climate, and other relevant systems.
For Sci-Fi planets, the generated geography must still respect the planet's scientific characteristics.
An airless world shouldn't automatically gain oceans and forests simply because the Fantasy terrain generator supports them.
6. Add Points of Interest Anywhere
Once a world is generated or manually created, I want to be able to add custom points of interest directly to the map.
For example:

* Cities and towns.
* Villages and colonies.
* Military bases.
* Spaceports.
* Research stations.
* Mining facilities.
* Abandoned settlements.
* Ruins.
* Caves.
* Dungeons.
* Temples.
* Castles.
* Individual houses.
* Factories.
* Farms.
* Custom buildings.
* Natural landmarks.
* Any other location the DM wants.

The workflow should be simple:
Click a location on the map → Add Point of Interest → Choose a location type → Create or generate it.
I should be able to name the location, describe it, and decide whether Atlas generates its details or I build them manually.
The point of interest should appear on the world map and remain connected to its actual location.
7. Build and Furnish Locations
This is especially important.
Atlas already has 2D and 3D map editors, building interiors, room generation, and asset libraries.
I want these features to work together.
For example, I should be able to:

1. Add a research station to a planet's world map.
2. Click the research station.
3. Open its location map.
4. Choose to generate the station or build it myself.
5. Add buildings, rooms, corridors, and floors.
6. Open individual rooms.
7. Place furniture, equipment, decorations, and other objects.
8. Save everything as part of the campaign.

This should work for Fantasy, Sci-Fi, and Modern settings.
Furnishing and object placement
Reuse the existing asset library and room editing tools.
I want to be able to add things such as:

* Tables, chairs, desks, and beds.
* Computers and control panels.
* Scientific equipment.
* Storage containers.
* Machinery and generators.
* Doors and windows.
* Lights.
* Weapons and equipment.
* Shelves and cabinets.
* Decorative objects.
* Sci-Fi consoles and terminals.
* Fantasy furniture and magical objects.
* Modern household and office items.

Allow objects to be moved, rotated, resized, duplicated, and deleted where supported.
If an object already exists in the asset library, reuse it.
Don't generate duplicate models unnecessarily.
8. Seamless Navigation Between Everything
I want the entire editing experience to feel connected.
For example:
Galaxy Map → Star System → Planet → World Map → Point of Interest → Building → Room → Furniture
Every level should be editable.
I should be able to navigate backward without losing my position or unsaved changes.
Use breadcrumbs or another intuitive navigation system where appropriate.
If I add a building to a planetary location, it should remain associated with that location.
If I add a planet to a star system, it should appear immediately in that system's map.
If I add a star system to the galaxy, it should be accessible from the galaxy map.
These shouldn't feel like separate disconnected tools.
9. Procedural and Manual Generation Should Work Together
I don't want to choose between fully procedural generation and fully manual creation.
I want both to work together.
For example:

* Generate a galaxy, then manually add star systems.
* Generate a star system, then replace one planet.
* Choose a premade planet, then customize its appearance.
* Generate a planetary world, then manually redraw part of a continent.
* Draw a world manually, then let Atlas generate geological detail.
* Add a custom city, then generate its buildings.
* Build a structure manually, then use procedural generation to furnish selected rooms.
* Generate a location, then manually replace individual objects.

Every generation stage should allow manual editing, and every manual creation stage should optionally support procedural assistance.
Do not regenerate an entire world when I only want to change one small location.
10. Preserve User Edits and Campaign Data
Manual edits should always take priority over procedural regeneration unless the DM explicitly chooses otherwise.
Implement or reuse appropriate protections for:

* Manually placed star systems.
* Edited planets.
* Custom planet appearances.
* Hand-drawn geography.
* Custom points of interest.
* Buildings and interiors.
* Furnished rooms.
* NPCs and factions associated with locations.

Add undo and redo where possible.
If regeneration might overwrite custom content, show a preview and request confirmation.
Preserve existing campaign data and saved maps.
11. User Experience
Keep the editing interface simple and intuitive.
I don't want a huge collection of unrelated buttons.
Consider contextual editing tools.
For example:

* Clicking empty space in the galaxy offers Add Star System.
* Clicking a star system offers Edit System.
* Clicking an orbital region offers Add Planet.
* Clicking a planet offers Edit Appearance, Edit Properties, or Open World.
* Clicking the world map offers terrain editing or Add Point of Interest.
* Clicking a building offers Edit Building or Open Interior.
* Clicking a room offers furnishing and object placement.

These are suggested interactions. Inspect the existing UI and choose the simplest approach consistent with Atlas's current design.
12. Inspect Existing Features Before Building Anything
This is extremely important.
Most of these systems already exist in some form.
Before implementing anything, inspect the codebase and identify:

1. Which features already exist and work.
2. Which features exist but aren't connected to the appropriate screens.
3. Which features only need minor modifications.
4. Which features genuinely need to be created.
5. Which existing asset libraries and generators can be reused.

I strongly prefer connecting and improving existing systems rather than rebuilding them.
Do not duplicate working functionality.
13. Present an Implementation Plan First
Before making major changes, present a detailed implementation plan.
Explain how you would connect the galaxy editor, star system editor, planet model library, planet appearance customization, Draw to World system, point-of-interest placement, building generation, and furnishing tools.
Identify the easiest improvements that could be implemented first.
Also suggest any additional features that would make manual worldbuilding easier or more enjoyable.
Do not implement major changes until I approve the plan.
The ultimate goal is to make Atlas a complete, interconnected worldbuilding environment where I can generate an entire galaxy procedurally, customize individual stars and planets, draw my own worlds, create locations, build structures, and furnish their interiors.
I want the freedom to create everything manually, generate everything procedurally, or combine both approaches at any level.
Atlas should give the DM complete creative control without making the editing process complicated.

## The user's decision (10 Nov 2026, after reading the plan, reviews/2026-11-10-editing-plan.md)

> what do you mean by this Your own library: save a system, station, ship or world you built, and use it in your other campaigns.

> other than that i give the green light to everything else i just want you to explain this and i might do it with this too

All of the plan, stages 1 to 7, and the plan's recommendation on each of its five questions: a library of about 150
worlds and 40 stars to start; things found by a condition tell the game master, who reveals them; schematic jump maps
alongside real-distance maps; the galaxy plan's stage F folded into this plan. "Your own library" (section 4, item 1)
was explained to the user and waits for their word.
> oh okay i give you the green light to do that one thing too

(After the explanation of "your own library": approved as well. The whole plan is approved.)