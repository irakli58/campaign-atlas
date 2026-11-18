# Request, 18 Nov 2026: selective location generation for imported campaigns

It came with a screenshot of the user's Curse of Strahd import (localhost:4747/play/curse-of-strahd/#krezk): the
Village of Barovia's 3D map drawn as a vast dense city of thousands of houses filling the whole sheet, with districts
"By the River", "The Village", "Under the Pillarstone"; 156 people; 0 of 73 clues found. The user, verbatim:

> ATLAS — Selective Location Generation for Imported Campaigns
> Claude, I want to add an important feature to Atlas's premade campaign import system.
> When a DM uploads a campaign PDF, Atlas should analyze the entire adventure, but the DM should be able to select which locations to generate instead of being forced to generate every location immediately.
> This should work with Curse of Strahd and all other imported tabletop RPG campaigns.
> 1. Read the Entire Campaign First
> When the DM uploads a campaign PDF, Atlas should extract and understand the complete adventure.
> Identify:
>
> * Regions and world maps.
> * Cities, towns, and villages.
> * Castles and fortresses.
> * Dungeons and caves.
> * Important buildings.
> * Individual rooms.
> * Encounter locations.
> * NPCs associated with locations.
> * Items, loot, traps, and clues.
> * Connections between locations.
>
> Store this information in the campaign knowledge system.
> Analyzing a location and generating its playable map are two separate operations.
> The entire campaign should be understood even if only a few locations are generated.
> 2. Location Selection Screen
> After Atlas finishes reading the PDF, show a Choose Locations to Generate screen.
> Display all identified locations in a hierarchical structure.
> For example, a Curse of Strahd import might look like:
>
> * Barovia
>    * Village of Barovia
>       * Important buildings
>       * Individual interiors
>    * Vallaki
>       * Important buildings
>       * Individual interiors
>    * Krezk
>    * Castle Ravenloft
>       * Floors and sections
>       * Individual rooms
>    * Death House
>       * Floors
>       * Individual rooms
>    * Other locations identified in the uploaded adventure
>
> Use the actual imported PDF to determine the complete location hierarchy. This example is illustrative, not a replacement for the source.
> Add checkboxes beside locations.
> The DM should be able to select an entire region, one settlement, one building, or even individual rooms.
> 3. Generation Options
> Provide these choices:
> Generate Everything
> Generate all supported locations from the campaign.
> Generate Selected Locations
> Generate only the locations checked by the DM.
> Generate Starting Locations
> Suggest the locations needed for the opening session, based on the imported adventure's starting conditions.
> Generate Later
> Import and organize the campaign without generating detailed location maps yet.
> The DM should never be required to generate everything before starting.
> 4. Generate Locations On Demand
> The DM should be able to generate additional locations at any time.
> For example:
> The DM imports Curse of Strahd and initially generates only the Village of Barovia and Death House.
> Several sessions later, the party decides to visit Vallaki.
> The DM opens the location list, selects Vallaki, and clicks Generate Location.
> Atlas then generates the selected settlement and its requested interiors using the information already extracted from the campaign.
> There should be no need to reimport or reread the entire PDF.
> 5. Generate Individual Buildings and Rooms
> Selection should work at multiple levels.
> For example:
>
> * Generate the entire settlement.
> * Generate only its streets and exterior buildings.
> * Generate one specific building.
> * Generate one floor.
> * Generate one individual room.
>
> If a DM selects a building, Atlas should generate the building and its relevant rooms without requiring the entire settlement to be fully generated.
> If a room is selected, preserve its canonical dimensions, connections, and contents wherever the source specifies them.
> Generate only the minimal surrounding context necessary to make it usable.
> 6. Respect the Original Campaign
> The uploaded campaign remains the absolute source of truth.
> Generated locations must match the adventure's descriptions and supplied maps.
> Do not:
>
> * Change room layouts.
> * Invent different building arrangements where canonical maps exist.
> * Expand small villages into massive cities.
> * Move important NPCs.
> * Change encounters.
> * Relocate important loot.
> * Rewrite the story.
>
> Atlas is implementing the adventure, not redesigning it.
> 7. Keep Ungenerated Locations in Campaign Knowledge
> Even when a location has not been visually generated, Atlas should still know about it.
> For example, if Vallaki has not been generated, the DM Copilot should still understand its role in the adventure, associated NPCs, quests, and events.
> An ungenerated location should not be treated as nonexistent.
> Keep its story information, secrets, relationships, and source references available to the DM.
> 8. Track Generation Status
> Every location should display its current status.
> Examples:
>
> * Not Generated.
> * Generating.
> * Generated.
> * Partially Generated.
> * Generation Failed.
>
> A settlement with generated streets but no interiors should be marked Partially Generated.
> Allow failed locations to be retried individually without regenerating everything else.
> 9. Preserve Existing Work
> If a location has already been generated and the DM has edited it, do not overwrite it.
> When the DM selects it again, offer options such as:
>
> * Open Existing Location.
> * Generate Missing Interiors.
> * Generate Additional Details.
> * Regenerate From Source.
>
> Regenerating existing content should require explicit confirmation and should preserve a recoverable copy of manual edits.
> 10. Background and Batch Generation
> Allow the DM to select multiple locations and generate them as a batch.
> Show progress for each location.
> For example:
>
> * Village of Barovia — Complete.
> * Death House — Complete.
> * Vallaki — Generating.
> * Castle Ravenloft — Queued.
>
> The DM should be able to continue using already prepared parts of Atlas while other locations are being processed, where the application supports it.
> Generation jobs should be resumable after interruption where practical.
> 11. Optional Generation Depth
> Allow the DM to decide how much detail to generate for each selected location.
> Exterior Only
>
> * Settlement layout.
> * Streets.
> * Buildings.
> * Terrain.
>
> Playable
>
> * Exterior map.
> * Important interiors.
> * NPC placements.
> * Encounters.
> * Relevant loot.
>
> Complete
>
> * All source-defined rooms and interiors.
> * Full relevant encounter setup.
> * Items and containers.
> * Interactive details.
> * Associated audio and ambience.
>
> The meaning of Complete must be based on what the uploaded source actually defines. Do not invent missing canonical content.
> 12. Use the Correct Existing Systems
> Selective generation must use the same corrected systems as full campaign generation.
> That means:
>
> * Fantasy campaigns use fantasy maps.
> * Characters use proper character sprites.
> * Villages remain village-sized.
> * Rooms match the source.
> * Narration uses the latest voice acting system.
> * Music uses the latest music system.
> * Existing assets and manually edited content are preserved.
>
> Do not create a separate, lower-quality generation pipeline for selected locations.
> 13. Efficient Generation
> This feature should reduce unnecessary processing.
> If the DM selects only two locations, Atlas should not generate every map and interior in the campaign.
> However, it should still retain the relationships and source information necessary for future generation.
> Use the existing extracted campaign data to avoid repeated PDF processing.
> 14. Testing
> Test this feature using authorized Curse of Strahd source material.
> Verify that the DM can:
>
> 1. Import and analyze the complete adventure.
> 2. See all extracted locations.
> 3. Select only the Village of Barovia.
> 4. Generate its map at an appropriate village scale.
> 5. Generate Death House separately.
> 6. Start playing without generating Castle Ravenloft.
> 7. Ask the DM Copilot questions about ungenerated locations.
> 8. Generate Vallaki later.
> 9. Generate individual rooms on demand.
> 10. Preserve manually edited locations.
> 11. Retry failed generation jobs.
> 12. Generate the remaining campaign without duplicating existing content.
>
> Final Goal
> I want Atlas to understand the entire imported adventure but generate only the locations the DM actually wants.
> Upload Campaign → Analyze Everything → Choose Locations → Generate Selected → Start Playing → Generate More Whenever Needed.
> The DM should be able to prepare the entire campaign or only the next session.
> All locations must remain faithful to the uploaded adventure, and everything should remain editable afterward.
> Reuse Atlas's existing campaign importer, world generation, map editors, and audio systems. Do not rebuild working features.
