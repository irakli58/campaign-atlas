# Complete feature parity for handmade campaigns, the AI DM copilot, and the knowledge and readiness panel (the user, 11 Nov 2026)

Two messages pasted by the user, verbatim, while the handmade campaigns (2026-11-11-blank-slate.md) were being built.
Both belong to that work and are built with it: the campaign's own story as context, the copilot and the councils on
handmade data, importing a written campaign, and the readiness panel. Major architectural changes: approval first.

---

ATLAS — Complete Feature Parity for Handmade Campaigns & AI DM Copilot
Claude, I want to make a major improvement to how Atlas handles manually created campaigns.
Every feature available to an automatically generated campaign should also be available to a handmade campaign.
This includes the AI DM Copilot, Writer Councils, dynamic world simulation, NPC behavior, investigations, events, session assistance, and any other existing systems.
The main difference should be that, in a handmade campaign, the DM supplies the information that Atlas would normally generate.
I don't want handmade campaigns to feel like a limited version of generated campaigns.
1. Handmade Campaigns Must Support Every Existing Feature
First, audit all features currently available to generated campaigns.
Identify which ones depend on information produced by the generation process.
For example:

* AI DM Copilot.
* Writer Councils.
* Story and plot management.
* NPC knowledge tracking.
* NPC relationships.
* Clue and investigation systems.
* Dynamic world simulation.
* Country diplomacy.
* Faction relationships.
* World events.
* Quest management.
* Session assistance.
* Session transcription and memory.
* Location generation.
* Encounter generation.
* Handout generation.
* Music and soundscape recommendations.
* Any other existing features.

Determine which systems already work with handmade campaigns and which ones currently require automatically generated data.
Do not rebuild working systems. Make them accessible to handmade campaigns.
2. Campaign Story & Context Input
When creating a handmade campaign, I want the option to provide Atlas with the story and background of the campaign.
This should be a dedicated, editable section.
For example, I might write:
"The campaign takes place in 1926 in a fictional Massachusetts town. Several residents have disappeared near an abandoned hospital. The local police believe the disappearances are unrelated, but a doctor has been conducting illegal experiments beneath the hospital. The players are private investigators who have recently arrived in town."
Atlas should be able to use this information to understand the campaign.
Allow the DM to provide:

* Campaign premise.
* Setting and historical period.
* Main story.
* Important characters.
* Important locations.
* Major conflicts.
* Current events.
* Campaign history.
* Factions and relationships.
* Mysteries and secrets.
* Planned plot developments.
* Player character backgrounds.
* Campaign rules and restrictions.
* Desired tone and atmosphere.

All fields should be optional initially.
Allow the DM to paste a large campaign document instead of filling out everything individually.
3. Convert DM Information Into Usable Campaign Context
This is extremely important.
I don't want Atlas to simply store the campaign description as a large text document.
The supporting AI should actually understand the information.
For example, if I write:
"Doctor Blackwood secretly operates a laboratory beneath the hospital. The police chief knows about the experiments but is covering them up."
Atlas should understand that:

* Doctor Blackwood is an important NPC.
* The hospital is an important location.
* A hidden laboratory exists beneath it.
* The police chief knows about the laboratory.
* The police chief is concealing that information.
* The players may not know any of this yet.

Where appropriate, Atlas should offer to turn this information into structured NPCs, locations, relationships, secrets, and plot points.
However, do not automatically create or modify campaign content without the DM's permission.
Show a preview of the proposed information and allow the DM to accept, edit, or reject it.
Use existing Gazetteer, NPC, story, and knowledge systems.
4. AI DM Copilot for Handmade Campaigns
The DM Copilot must work just as well with handmade campaigns as generated ones.
It should use the DM's provided campaign information to offer relevant assistance.
For example, during a session, I might tell the Copilot:
"The players decided to question the police chief about the disappearances."
The Copilot should understand the campaign's existing story and help me decide:

* What the police chief knows.
* What information the chief is hiding.
* How the chief might respond.
* Whether the chief would lie.
* What clues the players might discover.
* What consequences could follow.
* How this affects future events.

It should base its suggestions on the information I provided.
It must not invent established facts that contradict my campaign.
If something is unspecified, it should distinguish between known campaign facts and proposed ideas.
5. DM Copilot Should Handle Unexpected Player Actions
This is one of the most important features.
Imagine the players suddenly decide to:

* Visit an unplanned building.
* Interrogate an NPC I didn't expect.
* Travel to another city.
* Attack an important character.
* Ignore the main plot.
* Join an enemy faction.
* Investigate something unrelated to the original mystery.

The DM Copilot should help me improvise using the existing campaign context.
For example:
"The players unexpectedly enter an abandoned warehouse near the harbor."
The Copilot could suggest:

* What the building might contain.
* Who might be inside.
* How the location fits the setting.
* Whether existing factions have connections to it.
* Possible consequences of the players' actions.

It should also be able to use Atlas's existing building interior generator to create the location if I request it.
Suggestions should not automatically become permanent campaign canon.
Let me approve them first.
6. Information Requirements for Advanced Features
Some Atlas features need detailed information to function correctly.
I understand that handmade campaigns won't automatically contain all that information.
I want Atlas to let the DM provide it manually.
For example:
Dynamic World Simulation
The DM may need to provide:

* Countries and factions.
* Political relationships.
* Resources.
* Important settlements.
* Current conflicts.
* Planned events.
* Economic relationships.

NPC Knowledge Tracking
The DM may need to provide:

* What each NPC knows.
* What they believe.
* What they are hiding.
* Their motivations.
* Their relationships.
* What information they can reveal.

Investigation System
The DM may need to provide:

* Mysteries.
* Clues.
* Evidence.
* Suspects.
* Important locations.
* Discovery conditions.
* Relationships between clues.

Story and Plot Management
The DM may need to provide:

* Major plot points.
* Planned developments.
* Story branches.
* Character motivations.
* Important events.
* Possible outcomes.

These requirements should not prevent handmade campaigns from using the features.
Instead, Atlas should provide convenient ways for the DM to enter the necessary information.
7. Feature Readiness & Missing Information
I want a system that tells the DM what information a feature needs.
For example:
Dynamic World Simulation
Available information:

* 4 countries.
* 7 cities.
* 3 diplomatic relationships.

Missing information:

* Economic resources.
* Trade relationships.

Atlas should explain what additional information would improve the simulation.
However, distinguish between:

* Required information.
* Recommended information.
* Optional information.

Do not force the DM to complete unnecessary forms.
If a feature can function with partial information, allow it to do so.
If critical information is missing, explain the limitation and ask for only what's needed.
8. Optional AI Assistance With Missing Information
Sometimes the DM won't want to manually create every detail.
Allow Atlas to help fill gaps.
For example:
"I created five kingdoms, but I haven't defined their trade relationships. Suggest realistic trade routes based on their geography and resources."
Atlas should propose possible relationships.
The DM can then:

* Accept.
* Edit.
* Reject.
* Request alternatives.

The AI should never silently overwrite manually created content.
This should work with NPCs, factions, politics, clues, locations, histories, and other campaign systems.
9. Existing Writer Councils Must Work
Atlas already has genre-specific AI Writer Councils.
They should also support handmade campaigns.
For example:
Detective/Horror Council
Help with:

* Mystery structure.
* Clue consistency.
* Suspense.
* NPC motivations.
* Investigation pacing.
* Historical atmosphere.

Fantasy Council
Help with:

* Political conflicts.
* Worldbuilding.
* Character arcs.
* Factions.
* Fantasy storytelling.
* Campaign events.

Sci-Fi Council
Help with:

* Scientific plausibility.
* Alien civilizations.
* Space exploration.
* Political conflicts.
* Science-fiction storytelling.

The councils should analyze the DM's existing story instead of assuming they generated it.
They should respect established facts and offer suggestions rather than rewriting the campaign.
10. Canon, Secrets & Player Knowledge
Atlas must distinguish between:

* Established campaign canon.
* DM-only secrets.
* Information known to specific NPCs.
* Information revealed to players.
* AI suggestions that haven't been approved.
* Unspecified information.

For example, if I establish that a particular NPC is secretly responsible for a murder, the Copilot should remember that.
It shouldn't randomly suggest a different murderer as though that were established fact.
It must also avoid revealing DM-only information in player-facing material.
Reuse the existing NPC knowledge tracking and visibility systems.
11. Campaign Memory & Session Updates
As the campaign progresses, the DM Copilot should understand what has changed.
For example:

* An NPC was killed.
* A faction changed allegiance.
* Players discovered a secret.
* A building was destroyed.
* A war began.
* A clue was revealed.
* Players traveled to another region.

Use Atlas's existing session tracking, transcription, event, and memory systems where available.
The DM should be able to confirm important changes before they become permanent.
The Copilot should use the updated state in future sessions.
12. All Campaign Creation Modes Should Share the Same Systems
Atlas may have different creation workflows:

* Fully generated campaigns.
* AI-assisted campaigns.
* Completely handmade campaigns.

These should all use the same underlying campaign systems.
The difference should be the source of the information.
Generated campaign: Atlas creates the initial data.
AI-assisted campaign: The DM and Atlas create the data together.
Handmade campaign: The DM creates the initial data.
Once created, all three should have access to the same features.
I should also be able to switch between manual and AI-assisted workflows later without losing functionality.
13. Respect Disabled Features
Atlas also has configurable campaign systems.
If the DM disables clues, mysteries, quests, combat, or other optional features, the Copilot should respect those settings.
For example:
If clues are disabled, the Copilot shouldn't constantly suggest clues.
If dynamic world simulation is disabled, it shouldn't automatically advance geopolitical events.
If AI generation is disabled, it shouldn't generate new content without an explicit request.
The Copilot should adapt to the type of campaign the DM wants to run.
14. Integrate With Existing Atlas Features
The handmade campaign should be able to use:

* Gazetteer.
* World and city maps.
* Building and room generation.
* NPC editor.
* Faction editor.
* Diplomacy editor.
* Road and trade systems.
* Investigation boards.
* Handout creator.
* Dynamic world events.
* AI DM Copilot.
* Writer Councils.
* Session memory.
* Music and soundscape systems.
* My Library.

Do not create separate versions of these tools for handmade campaigns.
Reuse the same data structures and functionality.
15. Import Existing Campaigns
I also want to be able to bring campaigns I've already written into Atlas.
For example, I might have a 30-page campaign document containing:

* Story.
* Characters.
* Locations.
* Clues.
* Events.
* Factions.
* Secrets.
* Historical background.

Atlas should allow me to import or paste this material.
Investigate support for common document formats such as PDF, DOCX, Markdown, and plain text.
The system should help identify relevant campaign information and offer to organize it into Atlas's existing structures.
Preserve the original text and allow me to correct the interpretation.
Do not silently invent missing information or overwrite existing entries.
16. Audit and Implementation
Before making changes, inspect how generated campaigns currently supply information to:

* DM Copilot.
* Writer Councils.
* NPC systems.
* Investigation systems.
* Dynamic simulation.
* Events.
* Session memory.
* Other generation-dependent features.

Identify any hidden dependencies on the automatic generation process.
Then make those features work with manually supplied data.
Prioritize reusing existing systems and building a shared campaign context layer rather than duplicating functionality.
If Atlas already has a suitable context or knowledge system, extend it instead of replacing it.
Test the following workflow:

1. Create a completely blank campaign.
2. Enter a custom story.
3. Manually create NPCs, locations, and factions.
4. Define relationships and secrets.
5. Enable the DM Copilot.
6. Ask it questions about the campaign.
7. Introduce unexpected player actions.
8. Generate an unplanned building interior.
9. Update the campaign after a session.
10. Verify that the Copilot remembers the established facts and respects the DM's choices.

Also verify that the same features work in automatically generated campaigns without regressions.
You may implement straightforward integrations using existing architecture.
Request approval before major architectural changes.
Final Goal
I want absolutely no functional disadvantage to creating a campaign manually instead of generating it with Atlas.
If Atlas can automatically generate a feature, I should be able to supply the necessary information myself and use that same feature.
The AI DM Copilot should understand my handmade story, characters, locations, relationships, secrets, and campaign history.
It should help me improvise, answer questions, manage consequences, and run sessions without changing my established story.
Atlas should be equally powerful whether the DM creates everything, the AI creates everything, or they work together.

---

Claude, I also want you to implement the Campaign Knowledge & Readiness Panel you suggested as part of the handmade campaign feature parity improvements.
This should work for both handmade and generated campaigns.
1. Campaign Knowledge Dashboard
Create a central place where the DM can see what Atlas knows about the campaign.
Organize information into categories such as:

* Campaign story and lore.
* NPCs and their knowledge.
* Locations and maps.
* Countries and factions.
* Diplomatic relationships.
* Clues and investigations.
* Plot points and planned events.
* World history.
* Session history and player actions.
* Rules and campaign settings.

Show which categories contain information, which are incomplete, and which haven't been configured.
2. Feature Readiness Indicators
For each enabled Atlas feature, show whether it has enough information to function.
Use three statuses:

* Ready: The feature has the information it needs.
* Partially Ready: The feature works, but additional information could improve it.
* Needs Information: Critical information is missing.

For example:
AI DM Copilot — Partially Ready
Available:

* Campaign story.
* 8 NPCs.
* 5 locations.

Recommended:

* NPC motivations.
* Important secrets.
* Current story developments.

Dynamic World Simulation — Needs Information
Available:

* 4 kingdoms.
* 7 settlements.

Missing:

* Diplomatic relationships.
* Initial simulation settings.

Readiness must be based on actual feature requirements, not arbitrary completeness percentages.
Disabled features should not be marked as incomplete or require setup.
3. Direct Editing
Every missing-information item should link directly to the appropriate existing editor.
For example, clicking "Add Diplomatic Relationships" should open the diplomacy editor.
Don't create duplicate editing interfaces.
4. AI-Assisted Gap Filling
Add an optional Help Me Fill This In action.
For example, if my kingdoms don't have diplomatic relationships, I could ask Atlas to suggest them based on the existing world.
The AI should use established campaign information and propose plausible additions.
I should be able to accept, edit, or reject each suggestion.
Nothing should become established campaign canon without my approval.
5. Ask Atlas What It Knows
Add a way to ask questions such as:

* "What do you know about my campaign?"
* "Which NPCs have undefined motivations?"
* "What information is missing for the dynamic world simulation?"
* "Are there contradictions in my story?"
* "Which factions have no defined relationships?"
* "What does the DM Copilot need to help me run the next session?"

Atlas should distinguish established facts from missing information and AI suggestions.
6. Avoid Mandatory Setup
This is very important.
I don't want Atlas forcing me to complete dozens of forms before I can play.
A handmade campaign should be usable even with very little information.
The readiness panel is an optional assistant, not a mandatory checklist.
Only require information when a particular feature genuinely cannot function without it.
7. Integration and Implementation
Inspect the existing campaign context, Gazetteer, feature toggles, and DM Copilot systems first.
Reuse their data and functionality.
The readiness panel should update when the DM adds information, changes settings, imports campaign material, or approves new content.
Do not create a second campaign knowledge database.
Ensure it works for handmade, AI-assisted, and generated campaigns.
The goal is to let the DM see what Atlas knows, understand what information its features need, and optionally get help filling in the gaps—without restricting creative freedom.


## Where it stands (11 Nov 2026)

Built with the blank-slate request (docs/requests/2026-11-11-blank-slate.md): the copilot and the councils read the game
master's own entries and the campaign's own story; a written campaign read in (text, Markdown, Word, PDF) and turned into
entries only when ticked; the Campaign Knowledge panel (*What Atlas knows*, At the table) with the readiness of each part
switched on, its gaps leading to their editors, and *Ask Atlas what it knows*. No second store of knowledge: it reads each
part's own data. Record: the workspace's reviews/2026-11-11-handmade-built.md.
