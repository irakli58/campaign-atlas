# Request, 18 Nov 2026: complete campaign import and plug-and-play adventure generation

It came while the item and loot system was being built; it says to finish that first. The user, verbatim:

> ATLAS — Complete Campaign Import & Plug-and-Play Adventure Generation
> Claude, after completing the current item and loot generation work, I want you to implement and thoroughly test a major new Atlas feature:
> Import an existing tabletop RPG campaign and automatically turn it into a fully prepared, playable Atlas campaign.
> Use D&D's Curse of Strahd as the main end-to-end test case.
> I want a DM to be able to provide an adventure book or other authorized campaign materials, click a button, and have Atlas prepare everything needed to start running the campaign with minimal manual preparation.
> Afterward, the DM must be able to customize absolutely anything.
> 1. Research Curse of Strahd
> First, research the official Curse of Strahd adventure, its structure, setting, rules, and requirements.
> Use the actual adventure text supplied through an authorized source for detailed conversion. Do not scrape protected content from unauthorized websites, bypass access restrictions, or reconstruct missing copyrighted chapters from summaries.
> If the complete source is unavailable, report what is missing and request the required materials.
> Use official documentation and authorized reference material to understand:
>
> * The overall campaign structure.
> * Barovia and its major locations.
> * Castle Ravenloft.
> * Important NPCs and factions.
> * Story progression.
> * Encounters.
> * Monsters.
> * Treasures and special items.
> * Random tables.
> * Tarokka readings and their campaign effects.
> * Important events and character motivations.
> * Gothic horror atmosphere.
> * Character progression and rules.
>
> Preserve the original adventure's logic, relationships, and important story details.
> 2. Add an Import Campaign Feature
> Add an Import Campaign option to Atlas.
> Support authorized sources such as:
>
> * PDF adventure books.
> * Text documents.
> * Markdown files.
> * Structured campaign files.
> * DM-authored campaign notes.
> * Supported licensed integrations, where permitted.
>
> Do not assume that owning content on one platform automatically authorizes downloading or copying it into another.
> The DM should be able to select a source, choose the ruleset, and start the import process.
> 3. Automatically Analyze the Entire Campaign
> Atlas should read the provided adventure materials and identify:
>
> * Campaign setting.
> * Chapters and story arcs.
> * Starting conditions.
> * Important locations.
> * NPCs.
> * Factions.
> * Quests.
> * Encounters.
> * Monsters.
> * Items and loot.
> * Clues and secrets.
> * Dialogue and roleplaying guidance.
> * Random events.
> * Traps and puzzles.
> * Important choices.
> * Multiple possible outcomes.
> * Campaign-ending conditions.
>
> Create a structured campaign knowledge base that connects everything.
> Retain source references for imported facts so the DM can inspect where information came from.
> Distinguish original adventure content from AI-generated additions.
> 4. Generate the Complete World
> For Curse of Strahd, Atlas should prepare the campaign's relevant geography and locations.
> Generate or import, where authorized:
>
> * The regional map of Barovia.
> * Settlements and important landmarks.
> * Roads and travel routes.
> * Forests, mountains, and rivers.
> * Castle Ravenloft.
> * Important buildings.
> * Dungeon maps.
> * Encounter locations.
> * Building interiors.
> * Relevant room contents.
>
> Use existing Atlas map generation and editing systems.
> Maps should remain geographically and narratively consistent with the adventure.
> If an original map is unavailable, Atlas may offer a clearly labeled AI-generated interpretation, subject to DM approval.
> 5. Prepare Every Important NPC
> Generate structured NPC profiles containing:
>
> * Name.
> * Role in the campaign.
> * Appearance.
> * Personality.
> * Motivations.
> * Relationships.
> * Faction affiliations.
> * Current location.
> * Knowledge and secrets.
> * Relevant statistics.
> * Dialogue guidance.
> * Important story triggers.
> * Possible reactions to player actions.
>
> Use Atlas's existing NPC knowledge tracking.
> NPCs should know only what they plausibly know.
> Their behavior should remain consistent with the imported adventure unless the DM changes it.
> 6. Prepare All Encounters
> For every supported encounter, prepare:
>
> * Location.
> * Participants.
> * Enemy statistics.
> * Encounter conditions.
> * Starting positions where specified.
> * Terrain.
> * Relevant maps.
> * Possible outcomes.
> * Rewards.
> * Consequences.
> * Rules references.
>
> Support both combat and noncombat encounters.
> Where the source provides specific encounter details, preserve them.
> If Atlas adds optional encounters, clearly distinguish them from the original adventure.
> 7. Generate Items, Loot, and Inventories
> Integrate the campaign-specific loot generator.
> Prepare:
>
> * Important magical items.
> * Story artifacts.
> * Ordinary loot.
> * Shop inventories.
> * NPC possessions.
> * Treasure containers.
> * Equipment.
> * Documents and clues.
>
> Respect the adventure's specified rewards and item locations.
> Do not randomly relocate important story items or duplicate unique artifacts.
> 8. Complete Story and Quest Tracking
> Create an interconnected campaign structure.
> Atlas should track:
>
> * Main story progression.
> * Optional quests.
> * Character goals.
> * Important decisions.
> * NPC relationships.
> * Trigger conditions.
> * Discoveries.
> * Completed encounters.
> * Unresolved storylines.
> * Possible endings.
>
> The campaign should not be forced into a single linear path if the original adventure supports exploration and player choice.
> 9. Handle Special Campaign Mechanics
> This is especially important for Curse of Strahd.
> Atlas must recognize adventure-specific mechanics rather than treating every campaign as generic D&D.
> For example, support the Tarokka reading and its consequences for campaign setup.
> Where the authorized source specifies randomized outcomes, Atlas should apply those outcomes consistently across locations, quests, NPC knowledge, and item placement.
> Store the results so they don't change accidentally during play.
> Other imported adventures may have entirely different special mechanics.
> Design this as an extensible system rather than hardcoding everything around Curse of Strahd.
> 10. Generate a Ready-to-Run DM Dashboard
> Once import and preparation are complete, the DM should see a campaign dashboard containing:
>
> * Current campaign state.
> * Starting location.
> * Current objectives.
> * Important NPCs.
> * Available encounters.
> * Relevant maps.
> * Session notes.
> * Story developments.
> * Party information.
> * Unresolved quests.
> * Quick-access rules.
> * Important hidden information.
>
> The DM should be able to start the first session without manually creating every individual component.
> 11. AI DM Copilot
> The existing DM Copilot should understand the entire imported campaign.
> For example, the DM should be able to ask:
>
> * "What happens if the players go to Vallaki?"
> * "Which NPCs are currently in this location?"
> * "What does this NPC know about Strahd?"
> * "What encounters are available here?"
> * "What happens if the players ignore this quest?"
> * "What loot is in this room?"
> * "What should I prepare for the next session?"
> * "What happens if the party attacks this NPC?"
>
> The Copilot should use the imported adventure, current campaign state, and player decisions.
> It should distinguish established adventure facts from its own suggestions.
> If something is unspecified, it should say so and offer a suitable optional improvisation.
> 12. Make the Campaign Truly Plug-and-Play
> The DM should not have to spend hours configuring Atlas after importing a campaign.
> Automatically prepare the required data, links, maps, encounters, NPCs, and game systems.
> Provide a Start Campaign button once essential preparation is complete.
> Before that, run a readiness check.
> For example:
>
> * Are all required locations available?
> * Are important NPCs created?
> * Are encounter statistics available?
> * Are important items placed correctly?
> * Are special mechanics initialized?
> * Are story triggers connected?
> * Is the opening session playable?
> * Are DM-only secrets protected?
>
> If something is missing, display the problem clearly.
> Do not claim a campaign is fully ready when critical source material or game data is missing.
> 13. Everything Must Be Editable
> This is an absolute requirement.
> After import, the DM should be able to modify:
>
> * The story.
> * NPCs.
> * Maps.
> * Locations.
> * Monsters.
> * Encounters.
> * Loot.
> * Quests.
> * Dialogue.
> * Factions.
> * Campaign rules.
> * Special events.
> * Endings.
>
> For example, I might import Curse of Strahd and then decide to add a new village, replace an NPC, or create an entirely different ending.
> Atlas should allow this without breaking the campaign.
> AI-generated content and imported content should both be editable.
> Keep an original-source reference or baseline so the DM can compare changes or revert selected edits.
> Never overwrite manual changes without permission.
> 14. Handle Changes Intelligently
> If the DM changes something important, Atlas should identify the consequences.
> For example:
> If an important NPC is removed, Atlas should identify quests, encounters, or story events that depend on that NPC.
> It should offer possible fixes without automatically rewriting the campaign.
> If a story-critical item is moved, update the relevant references after DM confirmation.
> Use existing campaign knowledge and dependency systems where possible.
> 15. Support Campaigns Beyond D&D
> Do not design this feature exclusively for Curse of Strahd.
> It should eventually support:
>
> * Other D&D adventures.
> * Call of Cthulhu scenarios.
> * Pathfinder adventures.
> * Sci-Fi campaigns.
> * Homebrew campaigns.
> * Completely original campaigns.
> * Other tabletop RPG systems.
>
> The importer should understand the selected ruleset and adapt its preparation accordingly.
> 16. Support Local and Cloud AI
> Integrate with Atlas's existing local/cloud generation architecture.
> Allow imported campaign processing to use local AI when available and suitable.
> Use a shared structured campaign format so the results remain compatible with Atlas regardless of the selected AI provider.
> Be transparent when a local model cannot reliably process a very large adventure in one pass.
> Use chunked processing, persistent extraction, cross-chapter consistency checks, and verification rather than silently omitting content.
> 17. Test Using Curse of Strahd
> After the general importer is implemented, perform a complete end-to-end test using the authorized Curse of Strahd source material.
> Test:
>
> 1. Importing the complete adventure.
> 2. Extracting the campaign structure.
> 3. Creating the world and locations.
> 4. Preparing NPCs and relationships.
> 5. Preparing encounters and monsters.
> 6. Assigning loot and important artifacts.
> 7. Initializing special campaign mechanics.
> 8. Linking story events and triggers.
> 9. Generating the opening session.
> 10. Running simulated player decisions.
> 11. Changing NPCs and quests manually.
> 12. Confirming that saved changes persist.
> 13. Confirming that player-facing information never exposes DM secrets.
>
> Test branching player choices, not just the expected story route.
> Identify missing content, broken dependencies, inconsistent NPC knowledge, and unsupported mechanics.
> Fix the underlying importer rather than adding one-off patches that only work for Curse of Strahd.
> 18. Campaign Completion Report
> After processing, show a clear report:
>
> * Source coverage.
> * Chapters processed.
> * Locations created.
> * Maps prepared.
> * NPCs created.
> * Encounters prepared.
> * Items created.
> * Quests connected.
> * Special mechanics initialized.
> * Missing or unresolved information.
> * AI-generated additions requiring review.
>
> Include links to the relevant Atlas editors.
> The report should distinguish Ready to Play from Needs Review and Incomplete.
> 19. Copyright and Licensing
> The feature must respect the rights of adventure publishers.
> Do not bundle, publicly redistribute, or publish the full Curse of Strahd adventure or its proprietary assets without appropriate authorization.
> Support DM-provided materials only where processing and use are permitted, and investigate licensed integrations where appropriate.
> Keep imported copyrighted content private and subject to applicable permissions.
> Do not treat a public web summary as a substitute for the complete official adventure.
> 20. Implementation Order
> Finish the current item and loot generation work first.
> Then:
> Phase 1: Audit Atlas's existing campaign import, world generation, and DM Copilot systems.
> Phase 2: Implement structured adventure extraction and cross-referencing.
> Phase 3: Generate playable locations, NPCs, encounters, quests, and loot.
> Phase 4: Integrate campaign-specific mechanics and DM Copilot.
> Phase 5: Add readiness checks, customization, and change tracking.
> Phase 6: Conduct the complete Curse of Strahd test using authorized source materials.
> Do not rebuild systems that already exist.
> Preserve all existing Atlas campaign data.
> Request approval before major architectural changes.
> Final Goal
> I want Atlas to become a platform where a DM can take an existing tabletop RPG adventure, import it, and have the application prepare the campaign for them.
> Import Campaign → Analyze Adventure → Generate Maps, NPCs, Encounters, Loot, and Story Systems → Start Playing.
> The DM should be able to run the campaign with minimal preparation and use the DM Copilot whenever needed.
> After import, everything must remain editable so the DM can customize the adventure as much or as little as they want.
> Curse of Strahd should be the first comprehensive test case, but the feature must work for many different campaigns and tabletop RPG systems.

## The approval (18 Nov 2026)

After the audit and the proposed design (docs/plans/2026-11-18-campaign-import-plan.md), the user, verbatim:

> go ahead with the first one and ill provide the pdf soon

("The first one" is the design.) The user will provide the Curse of Strahd PDF; until then the importer is built and
tested on an original test adventure.
