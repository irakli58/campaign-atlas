# A manual civilisation, diplomacy, infrastructure and world simulation editor (the user, 11 Nov 2026)

Pasted by the user, verbatim, the fifth request of the afternoon: audit first (section 15), then straightforward changes
on the existing architecture; major architectural changes to be explained and approved first. Queued with the others
(the workspace memory's request-queue-2026-11-11.md has the order).

---

ATLAS — Manual Civilization, Diplomacy, Infrastructure & World Simulation Editor
Claude, I want to significantly improve Atlas's manual worldbuilding capabilities.
Atlas already generates many sophisticated systems automatically when creating worlds, including civilizations, countries, factions, diplomatic relationships, roads, trade routes, settlements, and dynamic world events.
However, I want the same level of control when creating a world entirely from scratch.
Currently, I can manually create and edit geography, cities, and locations, but I want to make sure I can also manually create and configure the political, economic, and infrastructure systems that Atlas normally generates.
The goal is feature parity between AI/procedurally generated worlds and handcrafted worlds.
Before implementing anything, inspect the existing systems and reuse them wherever possible.
1. Manual Countries, Kingdoms & Civilizations
Allow me to create countries, kingdoms, empires, city-states, republics, tribal confederations, and other political entities manually.
Each country should support:

* Name and description.
* Government type.
* Capital city.
* Territory and borders.
* Flag, emblem, and colors.
* Leader and government officials.
* Population, where supported.
* Culture and religion.
* Economy and resources.
* Military strength.
* Laws and policies.
* Associated cities and settlements.
* Internal factions.
* Historical background.
* Custom properties.

All fields should be optional where possible.
I should be able to create a country with only a name and territory, then expand it later.
Countries should work with Atlas's existing faction and civilization systems rather than becoming separate, disconnected objects.
2. Manual Diplomatic Relationships
This is one of my biggest priorities.
I want to manually define relationships between countries, kingdoms, factions, and civilizations.
For example:

* Allied.
* Friendly.
* Neutral.
* Rival.
* Hostile.
* At war.
* Trade partners.
* Non-aggression pact.
* Defensive alliance.
* Vassal and overlord.
* Tributary relationship.
* Embargo.
* Ceasefire.
* Occupation.
* Territorial dispute.

Allow relationships to include custom descriptions and conditions.
For example:
Kingdom of Valoria ↔ Empire of Drakmor
Relationship: Hostile
Reason: Both claim ownership of the Northern Mountains.
Current situation: Border skirmishes and an unstable ceasefire.
I want Atlas to recognize this as an actual diplomatic relationship, not just a text note.
Relationship visualization
Add or reuse a diplomacy map or relationship graph.
I should be able to select a country and see its allies, enemies, trading partners, and other relationships.
Allow me to manually edit relationships directly from this interface.
If the existing world generation system has diplomatic scores or relationship values, reuse them.
Don't create a separate incompatible relationship model.
3. Manual Borders and Territories
Allow me to draw and edit country borders directly on the world map.
I want to:

* Create a new territory.
* Assign territory to a country.
* Draw borders.
* Expand or shrink borders.
* Split territories.
* Merge territories.
* Create disputed regions.
* Create unclaimed territory.
* Assign cities to countries.

If Atlas already has political map layers, reuse them.
Borders should remain separate from physical geography.
Changing a border should not regenerate mountains, rivers, or settlements.
4. Manual Road Construction
Atlas already generates roads automatically.
I want to manually create roads using the same road system.
For example, I should be able to connect two cities by drawing a road between them.
Support:

* Dirt roads.
* Trails.
* Paved roads.
* Major highways.
* Trade roads.
* Military roads.
* Bridges.
* Mountain passes.
* Other appropriate road types.

Road availability should depend on the world's setting.
A medieval kingdom shouldn't automatically have modern highways.
Road editing
Allow me to:

* Draw roads.
* Connect settlements.
* Change road types.
* Edit road paths.
* Delete roads.
* Create intersections.
* Connect roads to existing networks.
* Mark roads as damaged, blocked, or abandoned.

Where appropriate, use existing terrain-aware pathfinding to suggest realistic routes.
For example, roads should generally avoid extremely steep terrain unless a mountain pass or engineered route is appropriate.
However, I should always be able to override the suggested path.
Do not require me to regenerate the world to add a road.
5. Manual Trade Routes
I want to create trade routes independently of roads.
For example:
Trade Route: The Silver Road
Origin: Valoria
Destination: Drakmor
Goods: Silver, grain, and textiles.
Trade volume: High.
Status: Active.
Allow trade routes to use:

* Roads.
* Rivers.
* Sea routes.
* Caravan paths.
* Other transport networks appropriate to the setting.

Trade routes should connect to Atlas's existing economy and faction systems.
If two countries are at war, Atlas should understand that their trade relationship might be affected.
However, it should not automatically destroy or remove my manually created trade routes.
6. Manual Resources and Economic Relationships
Allow me to manually assign resources and economic characteristics to countries and settlements.
Examples:

* Iron mines.
* Gold deposits.
* Agricultural regions.
* Timber production.
* Fishing.
* Manufacturing.
* Markets.
* Ports.
* Strategic resources.

I should be able to define which countries produce, import, and export different resources.
Reuse Atlas's existing economy and resource systems.
Don't build an entirely new economic simulation if one already exists.
7. Manual Political and Military Conflicts
I want to create conflicts between countries and factions.
For example:
The Northern Border War
Participants: Valoria and Drakmor.
Cause: Disputed territory.
Status: Ongoing.
Important locations: Northern Mountains.
Allow me to define:

* Participants.
* Causes.
* Objectives.
* Disputed territories.
* Military alliances.
* Current status.
* Historical events.
* Possible outcomes.

Integrate this with the existing dynamic world and event systems.
8. Manual Faction Influence
Countries should not be the only political entities.
I want to create relationships involving:

* Merchant guilds.
* Religious organizations.
* Criminal organizations.
* Noble houses.
* Rebel movements.
* Corporations.
* Political parties.
* Secret societies.
* Sci-Fi factions.

For example, a merchant guild might have influence in several countries.
A rebel organization might control territory inside an empire.
A corporation might operate across multiple star systems.
Reuse existing faction mechanics and support relationships between different types of entities.
9. Manual Events and World History
Allow me to create important historical events manually.
Examples:

* Kingdom founded.
* Civil war.
* Trade agreement.
* Diplomatic marriage.
* Revolution.
* Border conflict.
* Natural disaster.
* Economic crisis.
* Assassination.
* Religious schism.

Events should be connectable to countries, factions, cities, and locations.
I should be able to create an entire history for a world without AI generating it.
10. Integration With Dynamic World Simulation
This is extremely important.
Atlas already has dynamic world systems.
I want manually created countries, roads, relationships, and factions to work with those systems.
For example:

1. I manually create two kingdoms.
2. I define them as rivals.
3. I create a disputed border.
4. I establish trade routes between their cities.
5. I enable dynamic world events.
6. Atlas uses the existing relationships as context for future developments.

However, manual worldbuilding must not mean surrendering control to automatic simulation.
Allow the DM to choose between:
Static World
The world remains exactly as I created it unless I edit it.
DM-Controlled World
I manually trigger diplomatic changes, wars, events, and developments.
Dynamic World
Atlas uses the existing simulation to evolve the world, respecting established relationships and constraints.
These should reuse existing campaign settings and simulation toggles.
In Dynamic World mode, preserve the existing preference for major events to be planned or DM-approved, with minor events allowed to occur automatically when enabled.
11. Integrate With Existing Maps
Everything should be connected.
For example:
World Map → Country → Region → City → Building.
Countries should know which cities belong to them.
Roads should connect actual locations.
Trade routes should use the transportation network.
Factions should be associated with territories and settlements.
Political relationships should be visible from the relevant country or faction entries.
Avoid creating duplicate data.
12. Sci-Fi Compatibility
This system should also work with Sci-Fi campaigns.
For example:

* Interstellar empires.
* Planetary governments.
* Independent colonies.
* Corporate territories.
* Star system alliances.
* Trade agreements.
* Interstellar conflicts.
* Warp routes.
* Blockades.

Reuse the existing galaxy, star system, and faction systems.
Do not force medieval political structures onto Sci-Fi civilizations.
13. Worldbuilding Tools and UI
I want the manual world editor to expose the systems that Atlas already uses during automatic generation.
Consider tools such as:

* Political Map Editor.
* Diplomacy Editor.
* Road & Infrastructure Editor.
* Trade Route Editor.
* Faction Editor.
* Economy & Resources Editor.
* World History Editor.

However, don't create unnecessary new tabs if these tools can fit naturally into existing interfaces.
I want a clean, intuitive workflow.
For example, selecting a country on the map should let me edit its borders, diplomacy, settlements, resources, and associated factions.
14. Generated Worlds Must Also Be Editable
These manual editing tools shouldn't only work for blank worlds.
I also want to use them on worlds Atlas has already generated.
For example, after generating a fantasy world, I should be able to:

* Change diplomatic relationships.
* Create new countries.
* Redraw borders.
* Add roads.
* Remove roads.
* Create trade routes.
* Modify resources.
* Start or end wars.
* Add factions.
* Edit historical events.

Manual changes should persist.
The generator or simulation should not silently overwrite them.
15. Audit Existing Features First
Before implementation, inspect Atlas's existing:

* Civilization generation.
* Country and faction systems.
* Diplomacy systems.
* Political map layers.
* Road generation and editing.
* Trade route generation.
* Economy systems.
* Dynamic world simulation.
* World event systems.
* Manual worldbuilding editor.

For each capability, identify whether it is:

* Already implemented and accessible.
* Implemented but only used during automatic generation.
* Partially implemented.
* Missing.

If Atlas already has the underlying functionality, expose it through the manual world editor instead of rebuilding it.
16. Implementation Instructions
After auditing:

1. Expose existing country and civilization creation tools.
2. Add manual diplomatic relationship editing.
3. Enable manual borders and territory editing.
4. Connect manual roads to the existing road network.
5. Add manual trade route editing.
6. Expose economic and resource editing.
7. Connect manually created entities to dynamic simulation.
8. Ensure generated worlds can use the same tools.
9. Test persistence, compatibility, and editing.

Implement straightforward changes using the existing architecture.
If major architectural changes are required, explain them and request approval first.
Final Goal
A world created manually should be just as detailed and functional as a world generated automatically by Atlas.
I want to create the geography, countries, civilizations, roads, trade routes, diplomatic relationships, conflicts, and history myself.
And if I later decide to enable Atlas's dynamic world simulation, it should understand and use everything I created.
The key principle is simple:
Anything Atlas can generate automatically, I should also be able to create, edit, or control manually.
