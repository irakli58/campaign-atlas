# Modular features and a customizable game master's experience (the user, 3 Nov 2026)

Pasted by the user, verbatim, while the live words of the session recorder and the world-map cities were being finished.

---

ATLAS — Modular Features & Customizable DM Experience
Claude, I want you to make all Atlas features modular and optional, so every Dungeon Master can customize the application according to how they prefer to run their campaigns.
Atlas has a lot of features now, and not every DM will want to use all of them. Some DMs might only want story generation and maps, while others might want the full experience with AI assistance, world simulation, NPC tracking, session recording, and everything else.
The goal is to make Atlas as simple or as advanced as the DM wants, without removing any existing functionality.
1. Modular Feature System
Review all existing Atlas features and organize them into logical modules.
Examples include:

* AI Story Generation and Writer Councils.
* World Generation and Geological Simulation.
* City Generation and Building Interiors.
* Map Editors and Asset Libraries.
* Clue and Investigation Systems.
* NPC Knowledge and Memory Tracking.
* AI DM Copilot.
* Campaign Consistency Checker.
* World Clock and Dynamic Events.
* Factions and Political Simulation.
* Trade Routes and Economic Simulation.
* Session Recording, Transcription, and AI Memory.
* Combat, Dice, and RPG Rules.
* Soundboard, Music, and Narration.
* Player Screens, Fog of War, and Handouts.
* Random Encounters and Event Generation.

These are examples. Inspect the actual codebase and identify all existing features, including ones not mentioned here.
Don't create duplicate systems or assume something is implemented without checking.
2. Enable and Disable Features
Create a dedicated Campaign Features section in campaign settings.
Every optional module should have a clear toggle allowing the DM to enable or disable it.
For example, a DM should be able to disable the AI Copilot while keeping story generation enabled, or disable the economic simulation while keeping cities and trade routes visible.
Turning a feature off should:

* Hide its unnecessary interface elements.
* Stop its background processing where applicable.
* Prevent it from generating unwanted content or notifications.
* Reduce unnecessary resource usage.
* Preserve its existing data in case the DM enables it again.

Disabling a feature must never automatically delete its data.
3. Keep Essential Systems Working
Some Atlas features depend on others.
For example, city exploration might depend on the world map, while AI-generated consequences might depend on campaign memory.
Handle these dependencies intelligently.
Don't make the entire application stop working because one optional feature is disabled.
Where possible, allow features to operate independently or in a reduced mode.
If disabling a feature affects another module, explain the dependency clearly and offer a sensible solution.
Core functionality such as saving campaigns, navigation, and accessing existing content should remain available.
4. Different Levels of Customization
Allow DMs to choose how deeply they want to use a feature.
For example:
World Simulation

* Off: Static world.
* Basic: Minor events and simple changes.
* Advanced: Detailed factions, economics, politics, and evolving settlements.

AI DM Copilot

* Off: No AI assistance during sessions.
* On-Demand: Only responds when asked.
* Proactive: Suggests events, consequences, and consistency warnings.

NPC Tracking

* Off: Manual NPC notes.
* Basic: Track important NPC information.
* Advanced: Detailed knowledge, relationships, memories, and motivations.

Use similar levels for other features where they make sense, but don't overcomplicate simple modules that only need an on/off toggle.
5. Campaign Presets
Create optional presets to help DMs configure Atlas quickly.
Examples:

* Minimal: Story, notes, and basic maps.
* Detective / Investigation: Clues, NPC knowledge, mysteries, and consistency tracking.
* Sandbox World: World simulation, factions, trade, settlements, and dynamic events.
* Traditional Fantasy RPG: Maps, NPCs, combat, dice, encounters, and campaign notes.
* Full Atlas Experience: All compatible features enabled.

These presets should only configure modules. They should not create separate versions of Atlas.
The DM must be able to customize any preset afterward.
6. Change Features at Any Time
A DM should be able to enable or disable modules before starting a campaign or while a campaign is already running.
For example, a DM might start with basic maps and story generation, then enable NPC memory or world simulation after several sessions.
Existing campaign data must remain intact.
When a feature is enabled later, it should use relevant existing campaign information where possible, without inventing past events or silently changing established lore.
7. Clean and Adaptive Interface
The interface should adapt to the enabled modules.
If the DM disables the investigation system, investigation-specific controls should disappear from the relevant menus.
If they disable sound features, unnecessary audio controls should be hidden.
Avoid leaving empty tabs, broken navigation, or disabled buttons everywhere.
However, don't completely redesign Atlas's interface. Preserve the existing visual identity and workflows.
8. Per-Campaign Settings
Feature configurations should be saved separately for each campaign.
One campaign might use every feature, while another might use only maps and notes.
Changing settings in one campaign must not affect another.
Allow the DM to save custom presets and reuse them for future campaigns.
9. Architecture and Performance
I want this to be genuinely modular, not just a collection of switches that hide interface elements.
Where practical, modules should have clear boundaries, defined dependencies, and independent background processes.
Disabling expensive features should actually stop unnecessary calculations, AI requests, simulations, or recording processes.
Avoid rewriting the entire application solely to achieve modularity. Refactor incrementally where needed, preserving working functionality.
10. Testing and Implementation
Before making changes:

1. Inspect the entire Atlas codebase and identify existing modules and dependencies.
2. Determine which features can be fully disabled and which are essential infrastructure.
3. Design the feature configuration system.
4. Implement it without duplicating existing functionality.
5. Test different combinations of enabled and disabled modules.
6. Verify that disabling and re-enabling features preserves campaign data.
7. Ensure existing campaigns continue working correctly.

Show me the proposed module structure and settings interface before making major architectural changes.
You have creative freedom to suggest better ways of organizing the system.
Most importantly, I don't want Atlas to force DMs to use features they don't need.
A DM who only wants to generate a fantasy world and explore cities should be able to do exactly that.
A DM who wants an AI-assisted detective campaign with recorded sessions, persistent NPC memories, and consistency tracking should be able to enable those features.
And a DM who wants every system running together should be able to use the full Atlas experience.
Make Atlas powerful because of what it can do, but simple because the DM controls what it does.
