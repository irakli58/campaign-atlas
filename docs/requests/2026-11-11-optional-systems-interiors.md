# Optional campaign systems and building interiors from a description (the user, 11 Nov 2026)

Pasted by the user, verbatim, the third request of the afternoon (after 2026-11-11-blank-slate.md and
2026-11-11-alien-terrain.md): audit first, then straightforward changes that reuse the existing architecture; major
architectural changes to be explained and approved first. Its first part (the switches) is built with the handmade
campaigns, whose new parts are those same switches; the second (interiors from a description) next; the alien terrain
after.

---

ATLAS — Optional Campaign Systems & On-Demand Building Interior Generation
Claude, I want to add two important improvements to Atlas:

1. More control over which campaign systems are enabled.
2. The ability to generate a complete building interior from a simple description, especially when players enter an unplanned location.

Most of the necessary functionality already exists in Atlas, so inspect the current implementation before creating anything new.
1. Optional Campaign Systems
I want the DM to be able to enable or disable individual campaign features.
For example, not every campaign needs clues, investigations, quests, or traps.
A Fantasy sandbox campaign might focus entirely on exploration, factions, and world events.
A Call of Cthulhu campaign might need detailed clues, evidence, mysteries, and NPC knowledge tracking.
A Sci-Fi exploration campaign might need planets, factions, space travel, and encounters without any detective mechanics.
Don't force unnecessary systems into campaigns.
Configurable features
Investigate adding or improving toggles for:

* Clues and evidence.
* Investigation boards.
* Mysteries.
* Handouts.
* Plot points and story arcs.
* Quests and objectives.
* NPC knowledge tracking.
* NPC relationships.
* Factions and politics.
* Dynamic world events.
* Random encounters.
* Traps and riddles.
* Combat encounters.
* Survival mechanics.
* Economy and trade.
* Narration.
* Music and soundscapes.
* AI assistance and automatic story connections.

These should be independently configurable wherever technically appropriate.
Important behavior
Disabling a feature should:

* Hide its unnecessary interface elements.
* Stop automatic generation of that content.
* Prevent the feature from cluttering the Gazetteer.
* Prevent related AI systems from creating unwanted content.
* Preserve existing data rather than deleting it.

For example, if I disable clues, Atlas shouldn't automatically generate clues or show clue-related editing tools everywhere.
If I later enable clues again, previously created clues should still exist.
Allow these settings to be changed after campaign creation.
Reuse the existing modular campaign toggle system rather than creating a duplicate settings system.
2. Generate Building Interiors From Descriptions
I want a new workflow that allows the DM to generate a building interior simply by describing it.
This is particularly important when players unexpectedly decide to enter a building that I haven't prepared.
For example, during a session, the players might say:
"We want to enter the abandoned house across the street."
I should be able to click Generate Interior From Description, enter a short description, and have Atlas create a usable building interior.
Example descriptions
Fantasy
"A small medieval blacksmith's workshop with a forge, storage area, living quarters upstairs, and a cellar."
Call of Cthulhu
"A wealthy doctor's two-story house in 1920s Arkham, with a study, library, bedrooms, kitchen, and basement."
Sci-Fi
"An abandoned research laboratory on a remote mining planet, with damaged equipment, containment chambers, offices, and emergency power."
Modern
"A small convenience store with a storage room, employee office, bathroom, and back entrance."
Atlas should interpret the description and generate an appropriate layout.
3. Reuse Existing Interior Generation
Atlas already has:

* Building and location generation.
* 2D room maps.
* 3D interior generation.
* Furniture and object libraries.
* Manual room editing.
* Genre-specific assets.

Do not rebuild these systems.
Instead, connect them into a description-driven generation workflow.
The generator should determine:

* Appropriate number of rooms.
* Room sizes.
* Room purposes.
* Door placement.
* Corridors.
* Staircases.
* Floors.
* Windows.
* Furniture.
* Equipment.
* Decorations.
* Entrances and exits.

Everything should be consistent with the building's description and setting.
For example, a medieval blacksmith should contain a forge, anvil, tools, and storage rather than modern computers.
A Sci-Fi laboratory should contain appropriate futuristic equipment.
A 1920s doctor's house should use period-appropriate furniture and architectural details.
4. Fast Generation During Live Sessions
This is one of my biggest priorities.
I don't want to spend several minutes preparing a building when players unexpectedly enter it.
Add a quick generation workflow.
For example:
Select Building → Generate Interior → Enter Description → Generate
Ideally, the DM could generate a usable interior in seconds using existing procedural systems.
If the building already exists on a city map, Atlas should use its known properties, such as size, footprint, genre, and purpose.
If the building doesn't exist yet, allow the DM to create a temporary or permanent location directly from the session interface.
Offer two modes:
Quick Generate

* Minimal questions.
* Fast procedural generation.
* Sensible defaults.
* Immediately usable interior.

Detailed Generate

* Custom number of floors.
* Room requirements.
* Building size.
* Architectural style.
* Furniture density.
* Special rooms.
* Additional constraints.

Quick Generate should be the default during live sessions.
5. Automatically Furnish the Building
The generated interior shouldn't be a collection of empty rooms.
Use Atlas's existing furniture and asset libraries to furnish rooms appropriately.
For example, a doctor's office might contain:

* Desk and chairs.
* Examination table.
* Medical cabinets.
* Bookshelves.
* Filing cabinets.
* Lamps.
* Documents.
* Period-appropriate equipment.

A Sci-Fi spaceship engineering room might contain:

* Control panels.
* Machinery.
* Power systems.
* Maintenance tools.
* Storage containers.
* Emergency equipment.

Furniture placement should consider accessibility and room function.
Avoid blocking doors, stairs, and necessary paths.
Use existing assets wherever possible.
6. Don't Automatically Add Clues or Plot Content
This is extremely important.
Generating a building interior should not automatically generate clues, mysteries, quests, or plot points unless I explicitly request them.
If I ask for an ordinary house, Atlas should generate an ordinary house.
It shouldn't automatically invent a murder mystery or hide evidence inside it.
Allow optional generation settings such as:

* Furnish interior.
* Add NPCs.
* Add loot.
* Add encounters.
* Add traps.
* Add clues.
* Add secrets.
* Add environmental storytelling.

These should respect the campaign's enabled features.
If clues are disabled for the campaign, the interior generator should not create clues.
If traps are disabled, it shouldn't create traps.
If the DM requests something explicitly, allow them to enable the relevant feature or make an intentional exception.
7. Keep Generated Buildings Editable
After generation, I want complete manual control.
I should be able to:

* Add and remove rooms.
* Move walls.
* Change doors.
* Add floors.
* Change furniture.
* Add objects.
* Remove objects.
* Rename rooms.
* Add custom NPCs.
* Add points of interest.
* Attach handouts.
* Place clues manually if enabled.

Use the existing 2D and 3D editors.
The generated building should become a normal editable Atlas location, not a temporary image.
8. Connect Buildings to the World and Gazetteer
If I generate an interior for a building in a city, it should remain linked to that building.
For example:
World Map → City → Building → Generated Interior → Rooms.
The building should also be accessible through the Gazetteer where appropriate.
If I create an interior during a live session, it should be saved automatically or through the normal save workflow.
I should be able to revisit it in later sessions.
Don't regenerate a different interior every time players return.
9. Procedural Generation Without Mandatory AI
Since we're exploring local and procedural generation for Atlas, investigate whether this feature can work primarily through existing procedural systems.
For example:

* Interpret building type and room requirements.
* Generate a floor plan.
* Assign room functions.
* Place doors and corridors.
* Furnish rooms using existing asset rules.

If AI is useful for interpreting complicated descriptions, make it optional where practical.
Ideally, basic descriptions such as "small medieval tavern with six rooms" should work without requiring cloud AI.
Be realistic about the limitations of fully local natural-language interpretation.
10. Preserve Existing Features
Inspect the existing:

* Campaign settings and feature toggles.
* Gazetteer.
* City and building maps.
* Interior generation.
* 2D/3D editors.
* Furniture library.
* Procedural generation.
* AI generation.
* Session management.

Reuse the current implementation wherever possible.
Don't duplicate existing features.
11. Implementation Instructions
First, audit the existing systems and identify what already works.
Then:

1. Improve the existing campaign feature toggles.
2. Make disabled features stop generating unwanted content.
3. Connect the description input to the existing interior generator.
4. Add Quick Generate and Detailed Generate modes.
5. Automatically furnish rooms using existing assets.
6. Ensure generated interiors are editable and saved.
7. Integrate the workflow into live sessions.
8. Test Fantasy, Sci-Fi, Modern, and Detective/Horror scenarios.

You can implement straightforward changes that reuse the existing architecture.
If major architectural changes are required, explain them and request my approval first.
Final Goal
I want Atlas to support completely different styles of tabletop RPG campaigns without forcing unnecessary features on the DM.
And I want the DM to be able to respond immediately when players do something unexpected.
For example, if players decide to investigate a random building in a city, I should be able to describe it in one sentence and have Atlas generate a complete, furnished, editable interior.
Atlas should help the DM improvise during gameplay, without taking control of the story or adding content the DM never requested.


## Where it stands (11 Nov 2026)

Part 1, the finer switches, is built (parts inside the modules of What this campaign uses: clues, board, mysteries,
Auto-Connect, people's editor, knowledge, relationships, events, rumours, factions, traps and riddles, random encounters,
quests; new modules Handouts, Plot points and story arcs, Survival, Claude's help). Part 2, interiors from a one-line
description, is next after the local-AI plan.
