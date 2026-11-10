# Custom star systems, local space and jump maps (the user, 10 Nov 2026)

Pasted by the user, verbatim, right after the editing request (2026-11-10-editing-system.md). A plan first: nothing
major to be built until the user approves it. The plan is in the workspace's reviews/2026-11-10-editing-plan.md, with
the editing request's.

---

ATLAS — Custom Star System, Local Space & Jump Map Editor
Claude, I want to expand Atlas's Sci-Fi map creation system so that DMs are not required to generate an entire galaxy to create a space campaign.
I want the ability to create a single star system, a small cluster of star systems, or a completely custom space map using a blank canvas.
Think of this as a zoomed-in section of the galaxy where the DM can manually place star systems, ships, stations, anomalies, distress signals, and other points of interest.
Most of the necessary features already exist in Atlas. Please inspect and reuse them rather than rebuilding everything.
1. Add Different Space Map Creation Options
When creating a Sci-Fi map, give the DM the following options:
Full Galaxy Map

* Generate or manually create an entire galaxy.
* Keep the existing galaxy generation system.

Local Star Cluster / Jump Map

* Create a smaller map containing a handful of star systems.
* Let the DM choose how many systems to generate.
* Allow manually placed systems.
* Support travel routes and locations between systems.

Single Star System

* Create only one star system.
* Use the existing star system editor.
* Allow adding planets, moons, asteroid belts, stations, ships, and other locations.
* No galaxy generation required.

Blank Space Canvas

* Start with an empty space map.
* Manually place everything.
* Allow procedural generation of selected regions or objects later.

These map types should use the same underlying data and editing systems where possible.
2. Interactive Blank Space Canvas
I want a flexible map editor where I can click anywhere in space and add objects.
For example:
Click empty space → Add Object → Choose Object Type
Available objects should include:

* Star systems.
* Individual stars.
* Planets and moons, where appropriate.
* Asteroid fields.
* Nebulae.
* Space stations.
* Mining outposts.
* Abandoned stations.
* Shipwrecks.
* Derelict spacecraft.
* Lost ships.
* Distress beacons.
* Emergency transmissions.
* Unidentified signals.
* Wormholes.
* Jump gates.
* Anomalies.
* Debris fields.
* Military installations.
* Hidden bases.
* Pirate hideouts.
* Custom points of interest.

I should be able to move, rename, resize, rotate, duplicate, and delete objects where appropriate.
Use Atlas's existing asset library and 32-bit-style rendering wherever possible.
3. Small Jump Maps
I especially want maps showing a few nearby star systems and the space between them.
For example, imagine a campaign containing only five star systems.
The DM could place those systems manually and connect them using jump routes.
Along those routes, the DM could add encounters and discoveries.
For example:

* A derelict ship drifting between two systems.
* A lost exploration vessel transmitting a distress signal.
* A damaged freighter requesting assistance.
* An abandoned mining station.
* A mysterious signal coming from an unexplored region.
* A pirate ambush location.
* An ancient alien structure.
* A hidden refueling station.

These objects should exist at specific locations on the map.
The DM should be able to click them to open additional information, encounter details, or an associated location map.
4. Space Encounters and Points of Interest
Each space point of interest should support more than just a marker.
For example, if I add a lost ship, I should be able to define:

* Ship name and classification.
* Its visual model.
* Its position.
* Whether it is moving or stationary.
* Its condition.
* Crew and passengers.
* Faction affiliation.
* Cargo and equipment.
* Whether it is broadcasting a signal.
* Whether it is hostile, friendly, abandoned, or unknown.
* Associated quests, mysteries, or encounters.

The DM should be able to create these details manually or ask Atlas to generate them.
For a distress beacon, allow the DM to configure its message, signal range, source, and whether players can detect it.
Don't automatically reveal hidden information to players.
Use Atlas's existing DM/player visibility system to control what players can discover.
5. Clickable Shipwrecks and Space Locations
This is important.
If I place a shipwreck or space station on the map, I want to be able to click it and open a more detailed location.
For example:
Jump Map → Derelict Ship → Ship Interior → Individual Rooms → Furniture and Objects
Reuse Atlas's existing 2D/3D room editors, interior generation, and furnishing systems.
I should be able to manually build a derelict ship's interior or procedurally generate it.
Then I should be able to place:

* Doors and corridors.
* Control consoles.
* Engines and machinery.
* Storage containers.
* Furniture.
* Bodies and evidence.
* Damaged equipment.
* Security systems.
* NPCs and creatures.
* Custom clues.
* Interactive objects.

This should work with the existing investigation, clue placement, and NPC knowledge systems.
6. Distress Signals and Discoverable Locations
I want space exploration to support interesting discoveries.
For example, players traveling between two star systems might receive a distress signal from a nearby ship.
The DM should be able to place a distress beacon on the map and configure how it becomes discoverable.
Possible discovery conditions:

* Entering sensor range.
* Receiving a transmission.
* Completing a scan.
* Following coordinates.
* Learning about the location from an NPC.
* Discovering a clue.
* Triggering a scripted campaign event.

Allow DMs to create hidden points of interest that only become visible when specific conditions are met.
Use the existing campaign event and clue systems where possible.
Don't automatically reveal everything when the map opens.
7. Travel Routes and Distances
Allow the DM to draw or generate connections between star systems.
Reuse Atlas's existing warp travel and fuel systems.
The map should support:

* Jump routes.
* Travel distances.
* Fuel requirements.
* Estimated travel times.
* Restricted routes.
* Dangerous regions.
* Hidden routes.
* Custom travel rules.

However, not every object needs to be connected by a jump route.
A derelict ship might simply exist at coordinates between two systems.
Keep a distinction between actual spatial position and abstract travel connections.
If the DM chooses a realistic spatial map, distances and routes should remain internally consistent.
If they choose an abstract jump map, allow a schematic layout without pretending that visual distances represent physical distances.
8. Zoomed-In Galaxy Regions
I also want the option to select a region of an existing galaxy and open it as a detailed local space map.
For example:
Galaxy Map → Select Region → Open Local Jump Map
The local map should display the star systems and relevant objects within that region.
I should be able to add custom locations to it.
Those locations should remain connected to the original galaxy.
If I add a star system in the local map, it should also exist in the parent galaxy.
If I move or rename a star system, the change should be reflected consistently.
Do not create disconnected copies of the same star systems.
Use shared object identifiers and synchronized map views.
9. Standalone Maps That Can Be Expanded Later
A DM should be able to start a campaign with just one star system or a small jump map.
Later, they might decide to expand the campaign into a larger galaxy.
I want Atlas to support that.
For example:

1. Create a map with three star systems.
2. Build planets and locations inside them.
3. Run several sessions.
4. Decide to expand the campaign.
5. Generate additional surrounding systems or a larger galaxy.
6. Preserve the original three systems and all their existing content.

The original map should become part of the expanded galaxy without losing campaign history, locations, or manual edits.
If the original map used an abstract layout, ask the DM how it should be embedded into physical galactic coordinates.
10. Manual and Procedural Creation
I want to be able to create everything myself or let Atlas help.
For example:

* Place five stars manually, then generate their planets.
* Generate a small cluster, then add a shipwreck.
* Place a distress beacon, then generate its backstory.
* Create a space station, then manually furnish its interior.
* Generate a derelict ship, then add custom clues.
* Draw a jump route, then place encounters along it.

All of these should use existing Atlas systems wherever possible.
11. Easy Navigation and Editing
Keep the editor fluid and intuitive.
I should be able to:

* Zoom and pan smoothly.
* Drag objects around.
* Click objects to inspect them.
* Open their detailed maps.
* Add and remove points of interest.
* Draw travel routes.
* Toggle labels and overlays.
* Filter object categories.
* Search for locations.
* Undo and redo edits.
* Save and return to the map later.

Avoid cluttering the map with too many labels.
Use contextual editing tools rather than permanently displaying every possible control.
12. Preserve Existing Features
Before implementing, inspect the existing:

* Galaxy map.
* Star system editor.
* Planet generation.
* 32-bit celestial object rendering.
* Warp travel.
* Map editor.
* Points of interest.
* Ship and station assets.
* Room and interior editors.
* NPC and clue systems.
* Campaign events.
* DM/player visibility.

Reuse existing functionality.
Don't duplicate systems that already work.
13. Implementation Plan and Approval
Before changing anything, present a plan explaining:

1. How standalone star system maps will work.
2. How small jump maps will be created.
3. How the blank space canvas will function.
4. How space objects and points of interest will be placed.
5. How shipwrecks and stations connect to existing interior editors.
6. How hidden signals and discoveries will work.
7. How local maps will synchronize with larger galaxy maps.
8. How standalone maps can later expand into full galaxies.
9. Which features already exist and only need connecting.
10. Any additional features you recommend.

Do not implement major changes until I approve the plan.
My goal is to make Atlas suitable for both enormous galaxy-spanning campaigns and small, focused Sci-Fi adventures.
A DM should be able to create a campaign with just three star systems, a mysterious derelict ship, a distress beacon, and a hidden space station—without having to generate an entire galaxy.
Space should be a fully editable adventure environment, not just a background containing stars and planets.

## The user's decision (10 Nov 2026, after reading the plan, reviews/2026-11-10-editing-plan.md)

> what do you mean by this Your own library: save a system, station, ship or world you built, and use it in your other campaigns.

> other than that i give the green light to everything else i just want you to explain this and i might do it with this too

All of the plan, stages 1 to 7, and the plan's recommendation on each of its five questions: a library of about 150
worlds and 40 stars to start; things found by a condition tell the game master, who reveals them; schematic jump maps
alongside real-distance maps; the galaxy plan's stage F folded into this plan. "Your own library" (section 4, item 1)
was explained to the user and waits for their word.
> oh okay i give you the green light to do that one thing too

(After the explanation of "your own library": approved as well. The whole plan is approved.)