# Request, 18 Nov 2026: the uploaded campaign is the bible; the Curse of Strahd generation fixes

Two requests in one message, after the user ran the import of Curse of Strahd on their own computer. The user,
verbatim:

> Claude, I want to change some important requirements for the Campaign Import & Plug-and-Play Generation feature.
> 1. The Uploaded Campaign Is the Bible
> When a DM uploads a ready-made campaign, that campaign must be treated as the absolute source of truth.
> Everything Atlas generates must follow the uploaded campaign.
> This includes:
>
> * Story and plot.
> * Characters and their motivations.
> * NPC knowledge and secrets.
> * Locations and geography.
> * Encounters and enemies.
> * Items and loot.
> * Quests and objectives.
> * Timeline and important events.
> * Campaign-specific mechanics.
> * Endings and possible outcomes.
>
> Do not change any of these simply because the AI believes it could make them better.
> The uploaded campaign takes priority over the AI Writer Councils, general RPG knowledge, and the DM Copilot's suggestions.
> 2. No Proofreading or Story Fixing
> I do not want Atlas to proofread, critique, or attempt to fix imported campaigns.
> Do not automatically:
>
> * Rewrite dialogue.
> * Correct perceived plot holes.
> * Rebalance encounters.
> * Change NPC personalities.
> * Alter quest requirements.
> * Replace story events.
> * Change item locations.
> * Modify endings.
> * Add supposedly better storylines.
> * Rewrite the campaign to improve pacing.
>
> Assume the DM wants to play the adventure as written.
> Even if the AI thinks something is strange, difficult, or unconventional, preserve it.
> 3. Generation Means Implementation, Not Rewriting
> When Atlas generates a playable campaign, it should convert the existing adventure into Atlas's systems.
> For example:
>
> * A described castle becomes an explorable map.
> * An NPC becomes a structured NPC profile.
> * A specified encounter becomes a playable encounter.
> * A treasure chest receives its specified contents.
> * A quest becomes a trackable quest.
> * A scripted event becomes an event trigger.
>
> These are implementation tasks.
> They should not change the underlying campaign.
> If Atlas needs to generate a visual representation of something, it should remain faithful to the source description.
> 4. Do Not Invent Missing Canon
> If something is not specified in the campaign, do not pretend the adventure established it.
> For example, if the players enter an ordinary building that has no described interior, Atlas can generate a plausible interior so the DM can continue playing.
> However:
>
> * It must not contradict the campaign.
> * It must not invent important story revelations.
> * It must not introduce new canon-changing NPCs.
> * It must not move important items.
> * It must not alter existing quests.
>
> Any necessary generated details should be treated as supplementary material, not original campaign canon.
> 5. No Mandatory Review or Fixing Process
> I don't want the DM to upload a campaign and then spend hours proofreading or fixing Atlas's interpretation.
> The workflow should be:
> Upload Campaign → Atlas Generates Everything → Start Playing.
> Do not require the DM to manually approve every NPC, location, item, encounter, or quest.
> Atlas should handle extraction and preparation automatically.
> Internal technical validation is fine: check that imports completed, files are readable, links work, and required assets were generated.
> But do not turn this into a story-editing or proofreading process.
> If a critical section genuinely cannot be imported, clearly identify the missing material rather than silently inventing it.
> 6. Preserve the Original Campaign
> Store the original imported campaign as an immutable reference.
> All generated Atlas data should remain connected to that reference.
> If the DM later changes something, preserve the original version so it can be restored.
> Do not silently overwrite the original adventure.
> 7. DM Customization Is Still Fully Supported
> After generation, the DM should be able to edit absolutely anything.
> For example, they can:
>
> * Change Strahd's motivations.
> * Add a new village to Barovia.
> * Replace an encounter.
> * Create new NPCs.
> * Change treasure locations.
> * Add entirely new quests.
> * Rewrite the ending.
>
> But these changes should happen only because the DM chooses to make them.
> Once the DM explicitly changes something, that customization becomes the active campaign state. Atlas must respect it without repeatedly reverting to the original adventure.
> 8. DM Copilot Must Follow the Campaign
> The DM Copilot must prioritize:
>
> 1. Explicit DM customizations and decisions.
> 2. The current campaign state and events that have occurred.
> 3. The uploaded adventure as written.
> 4. Optional AI improvisation only when necessary and consistent with the above.
>
> If the DM asks what happens in a particular location, the Copilot should use the actual adventure information rather than inventing a different version.
> If the source doesn't specify something, the Copilot can improvise a minor detail without treating it as established canon.
> Final Requirement
> The uploaded campaign is the bible. Atlas is the tool that brings it to life.
> I do not want an AI that tries to rewrite or improve published adventures.
> I want an AI that understands the adventure, faithfully implements it, prepares everything for the DM, and makes it playable immediately.
> No mandatory proofreading, no story fixing, no unsolicited rewriting.
> Only change the campaign when the DM explicitly requests a change.
> ATLAS — Critical Campaign Generation Fixes: Curse of Strahd
> Claude, I want you to stop and thoroughly investigate the current Curse of Strahd campaign generation results.
> There are serious problems with the generated campaign. Almost every major system appears to have produced incorrect results.
> Do not simply regenerate the campaign using the same broken pipeline. First identify why these problems occurred, fix the underlying causes, and then regenerate and test it.
> The uploaded adventure is the absolute source of truth. Do not rewrite, proofread, rebalance, or "fix" its story.
> 1. Rooms Must Match the Original Adventure Exactly
> This is one of my biggest complaints.
> The rooms generated for Curse of Strahd did not match the rooms described in the campaign.
> I want the rooms to match the source adventure as closely as possible.
> This includes:
>
> * Room dimensions and shapes.
> * Room arrangement.
> * Corridors and connections.
> * Doors and entrances.
> * Staircases.
> * Windows.
> * Furniture and important objects.
> * Secret passages.
> * Traps.
> * Encounter locations.
> * Room descriptions.
> * Important items.
> * NPC and monster placement.
>
> If the adventure provides an official room map, use that map as the authoritative layout when the DM has provided it and its use is permitted.
> Do not generate a random room layout and then attach the adventure's room name to it.
> For example, if Castle Ravenloft has a specific room with particular exits, furnishings, and connections, Atlas must preserve those details.
> If the original source doesn't specify exact dimensions or furniture positions, do not invent them and claim they are canonical. Fill only the necessary gaps with clearly distinguished, noncontradictory details.
> Use the existing 2D/3D room generation systems, but make them follow the imported source layout.
> 2. Fix Character Rendering — Galaxy-Shaped Characters
> For some reason, characters displayed on the map appeared in the shape of the galaxy map.
> This is clearly a rendering or asset-selection bug.
> Investigate:
>
> * Sprite and texture references.
> * Asset IDs and asset type collisions.
> * Shared rendering components.
> * Incorrect asset fallbacks.
> * Texture caching.
> * Character model loading.
> * Map layer rendering.
> * Entity-to-asset mapping.
> * Incorrect default asset selection.
>
> A character must never render using a galaxy texture or world-map asset.
> Ensure every entity uses the correct asset category.
> For example:
>
> * Characters use character sprites or models.
> * Monsters use monster sprites or models.
> * Buildings use building assets.
> * Terrain uses terrain assets.
> * Galaxy maps use galaxy assets.
>
> Fix the underlying issue rather than manually replacing the affected characters.
> Test multiple character types across fantasy, modern, and Sci-Fi campaigns to ensure the problem doesn't recur.
> 3. Fix City and Village Generation
> The generated cities and settlements were not appropriate to their actual size.
> I previously asked Atlas to fill out the entire map, but that does not mean every settlement should become a massive city.
> Settlement generation must respect the actual settlement's scale.
> For example:
> Hamlet
>
> * A handful of buildings.
> * Very small population.
> * Limited infrastructure.
>
> Village
>
> * Small residential clusters.
> * A few important buildings.
> * Farms or surrounding countryside where appropriate.
> * Simple roads and paths.
>
> Town
>
> * More buildings and streets.
> * Shops and services.
> * Appropriate public buildings.
> * More developed infrastructure.
>
> City
>
> * Larger neighborhoods.
> * More extensive roads.
> * Greater building density.
> * Districts and public infrastructure where appropriate.
>
> The generator should use the source adventure's description, maps, population information, and established geography to determine settlement size.
> Do not treat every location as a large city.
> Important clarification about filling the map
> When I say fill the whole map, I mean:
> Generate the complete appropriate settlement within its intended boundaries and level of detail.
> I do not mean:
> Fill every available tile with buildings regardless of whether the location is a tiny village.
> For a small village, the map should naturally include empty land, paths, fields, vegetation, and surrounding terrain.
> For a large city, it can have much denser development.
> Do not inflate settlements just to fill the canvas.
> 4. Use the Correct Fantasy Map Style
> For some reason, Atlas generated an 1888-style map instead of a fantasy map.
> This is incorrect for Curse of Strahd.
> Investigate why the campaign's genre and visual settings were ignored or incorrectly selected.
> The campaign importer should determine the appropriate visual style from the imported adventure and its configured setting.
> For Curse of Strahd, use the existing fantasy map generation and fantasy asset systems.
> Do not accidentally select:
>
> * 1888 historical map styles.
> * Modern map styles.
> * Sci-Fi map styles.
> * Unrelated campaign presets.
>
> Check whether genre selection is being overridden by a default value, previous campaign setting, cached configuration, or incorrect fallback.
> Ensure the selected genre propagates consistently through world, settlement, building, room, and asset generation.
> A campaign-specific atmosphere can modify the fantasy presentation, but should not silently switch to an unrelated historical preset.
> 5. Fix Voice Acting — Use Our New System
> The generated campaign used what sounded like the old voice system, possibly Google's default text-to-speech.
> We already worked on a newer voice acting and narration system.
> I want you to inspect the existing codebase and find the newer implementation.
> Check:
>
> * The current narration engine.
> * Kokoro integration, if implemented.
> * Piper fallback, if implemented.
> * Voice profiles.
> * NPC voice assignment.
> * Narrator voice selection.
> * Local vs cloud voice settings.
> * Audio generation routes.
> * Legacy TTS fallbacks.
> * Campaign import audio generation.
>
> The campaign generator must use the current voice acting system, not an old default.
> Do not assume which engine is currently active. Verify it in the code and runtime.
> If the newer system is incomplete or unavailable, report that clearly instead of silently switching to an inferior legacy engine.
> I want:
>
> * Appropriate fantasy narration.
> * Distinct NPC voices where configured.
> * Consistent voices across sessions.
> * Expressive dialogue where supported.
> * Correct pronunciation and pacing.
> * Voice settings that persist after saving.
>
> Do not regenerate all dialogue or narration until the correct audio engine is confirmed.
> 6. Fix Music Generation — Use Our New Music System
> The music was also incorrect.
> It appeared to use the older music system instead of the newer one we developed.
> Inspect the current music architecture and identify:
>
> * The latest music generation or playback system.
> * Sampled instrument support.
> * Genre-specific music packs.
> * Fantasy instrument libraries.
> * Ambient sound systems.
> * Music selection logic.
> * Legacy music implementations.
> * Campaign import audio generation.
> * Asset loading and fallback behavior.
>
> For Curse of Strahd, I want music appropriate to a gothic fantasy horror campaign.
> For example:
>
> * Dark orchestral ambience.
> * Gothic atmosphere.
> * Tense exploration music.
> * Castle ambience.
> * Suspenseful investigation music.
> * Appropriate combat music.
>
> Use the latest available and properly licensed music system and assets.
> Do not fall back to generic or outdated music without notifying the DM.
> Ensure music and sound effects respond to the current location and scene where supported.
> 7. Fix Campaign Genre Detection and Propagation
> I suspect some of these problems are related.
> Atlas may be selecting the wrong generation system or failing to propagate the campaign configuration correctly.
> Investigate the complete pipeline:
> Imported Campaign → Campaign Metadata → Genre Selection → Map Generation → Asset Selection → Audio Generation → Saved Campaign
> Ensure all systems receive the correct campaign context.
> For example, a fantasy campaign should consistently use fantasy-compatible:
>
> * World maps.
> * Settlement maps.
> * Building assets.
> * Character sprites.
> * Room furniture.
> * Music.
> * Sound effects.
> * Narration settings.
>
> Do not let individual generators silently choose unrelated defaults.
> Use a consistent campaign configuration that all generation systems can access.
> 8. The Uploaded Campaign Is the Bible
> Remember my previous requirement.
> For imported ready-made campaigns:
> The uploaded campaign is the authoritative source.
> Do not:
>
> * Rewrite the story.
> * Change room layouts.
> * Replace NPCs.
> * Modify encounters.
> * Move important items.
> * Invent different settlement layouts when canonical layouts are supplied.
> * Change the campaign setting.
> * Rebalance encounters without permission.
> * Rewrite the ending.
>
> The task is to faithfully implement the campaign inside Atlas.
> No story proofreading or story fixing is required.
> Technical validation is required to ensure Atlas correctly represents the source.
> 9. Source-Faithful Generation
> I want a distinction between two types of generation.
> Source-defined content
> When the adventure explicitly describes something, Atlas must follow that description.
> Examples:
>
> * A castle room's layout.
> * A village's location.
> * An NPC's possessions.
> * A specific encounter.
> * A hidden passage.
> * A quest objective.
>
> Unspecified content
> When the adventure does not describe something, Atlas may generate reasonable supplementary details.
> Examples:
>
> * Ordinary furniture in an unspecified house.
> * Unimportant villagers.
> * Background environmental details.
> * Mundane shop inventory.
>
> Supplementary content must not contradict the source or become established adventure canon without DM approval.
> 10. Fix Asset and Generator Selection
> Audit how Atlas selects assets and generators.
> Check for:
>
> * Incorrect asset type mappings.
> * Reused IDs across incompatible asset categories.
> * Wrong renderer selection.
> * Incorrect defaults.
> * Stale cached settings.
> * Legacy generator calls.
> * Broken configuration inheritance.
> * Missing validation.
> * Incorrect genre tags.
>
> Ensure every generator receives the correct type, scale, setting, and campaign context.
> For example, a request for a medieval fantasy village must never produce a modern city or galaxy texture.
> 11. Do Not Destroy Existing Manual Work
> Before fixing and regenerating anything:
>
> * Preserve the current campaign.
> * Back up existing data.
> * Identify manually edited content.
> * Preserve manual maps and annotations.
> * Preserve custom NPCs.
> * Preserve customized encounters.
> * Preserve campaign progress.
>
> Do not overwrite existing work without permission.
> Allow affected generated assets to be selectively regenerated.
> 12. Test the Entire Pipeline
> After fixing the underlying issues, perform a full end-to-end test using the authorized Curse of Strahd material available in the project.
> Test the following:
> Room accuracy
>
> * Compare generated room layouts with source maps and descriptions.
> * Verify room connections and exits.
> * Check furnishings and important objects.
>
> Settlement scale
>
> * Generate small villages.
> * Generate towns.
> * Generate larger settlements.
> * Verify appropriate building density and geographical scale.
>
> Character rendering
>
> * Verify characters render as characters.
> * Verify monsters use appropriate assets.
> * Ensure galaxy or unrelated map textures never appear.
>
> Genre consistency
>
> * Verify fantasy maps remain fantasy maps.
> * Ensure the 1888 map preset isn't accidentally selected.
>
> Voice acting
>
> * Verify the new narration engine is actually used.
> * Test NPC dialogue and narrator output.
> * Confirm legacy fallback behavior is explicit.
>
> Music
>
> * Verify the new music system is active.
> * Test gothic fantasy music and ambience.
> * Confirm old music generation isn't accidentally called.
>
> Campaign fidelity
>
> * Compare imported content with the source.
> * Confirm important NPCs, locations, items, and encounters are represented correctly.
>
> Use actual rendered maps and audio playback tests, not only code-level checks.
> 13. Add Automated Safeguards
> I don't want these problems to happen every time I import a campaign.
> Add validation that catches:
>
> * Wrong map genres.
> * Incorrect asset categories.
> * Characters using non-character textures.
> * Settlements generated at inappropriate scales.
> * Missing source-defined rooms.
> * Incorrect room connectivity.
> * Wrong narration engines.
> * Wrong music systems.
> * Missing campaign context.
>
> If a critical error occurs, do not silently produce an incorrect campaign.
> Report the technical problem and allow a targeted retry.
> This is not story proofreading. It is ensuring the application works correctly.
> 14. Final Implementation Instructions
> First, audit the existing codebase.
> Then:
>
> 1. Identify the root causes of each problem.
> 2. Explain which systems are broken.
> 3. Fix the underlying issues.
> 4. Verify the current voice and music systems.
> 5. Correct genre and asset selection.
> 6. Improve source-faithful room generation.
> 7. Fix settlement scale.
> 8. Add regression tests.
> 9. Regenerate the affected Curse of Strahd content.
> 10. Verify the resulting campaign visually and functionally.
>
> Do not claim these issues are resolved merely because the generation process finishes successfully.
> Show evidence that the generated results are correct.
> Final Goal
> I want Atlas to import Curse of Strahd and generate a campaign that actually matches the adventure.
>
> * Rooms must match the source.
> * Settlements must be the correct size.
> * Characters must render correctly.
> * Fantasy maps must use fantasy styles.
> * Voice acting must use our new system.
> * Music must use our new system.
> * All content must follow the uploaded adventure.
>
> Atlas should bring the existing campaign to life, not generate an unrelated interpretation of it.
> Fix these problems systematically and make sure the same issues cannot recur in future imported campaigns.
