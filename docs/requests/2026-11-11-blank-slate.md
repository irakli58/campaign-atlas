# Blank slate campaigns, a manual Gazetteer and complete story editing (the user, 11 Nov 2026)

Pasted by the user, verbatim: an audit, then the missing parts built ("Unlike a research-only request, I do want you to
implement the missing functionality after the audit"; major architectural changes to be explained and approved first).
The user's own words after it are at the end.

---

ATLAS — Blank Slate Campaign Creator, Manual Gazetteer & Complete Story Editing
Claude, I have an important question about Atlas's existing Gazetteer and campaign creation systems.
Can I currently create an entire campaign completely from scratch, without AI generating the characters, clues, handouts, plot points, or story?
We already have extensive manual worldbuilding capabilities, including editing worlds, maps, cities, buildings, and interiors.
But I want the same level of manual control over the actual storytelling and campaign content.
I want you to inspect the existing Gazetteer, campaign editor, NPC system, investigation tools, and story generation systems to determine whether this functionality already exists.
If it doesn't exist, or only partially exists, I want you to implement it by extending the existing systems.
1. Blank Slate Campaign Creation
When creating a campaign, I want the option to choose:

* AI Generated Campaign — Atlas generates the campaign using the existing systems.
* Assisted Campaign — I create the campaign while AI helps when requested.
* Blank Slate Campaign — Start completely empty and build everything manually.

In Blank Slate mode, Atlas should not automatically generate NPCs, quests, plot points, clues, locations, or storylines.
I want to begin with an empty campaign containing only the necessary organizational structure.
I should be able to add content gradually.
For example, I might create a detective campaign with only three characters, two locations, and one mysterious event.
I don't want Atlas to automatically invent additional content unless I specifically ask it to.
2. Manual Gazetteer Creation
Inspect the existing Gazetteer.
I want the Gazetteer to function as a comprehensive, editable campaign encyclopedia.
I should be able to manually create entries for:

* Characters and NPCs.
* Locations.
* Organizations and factions.
* Items and artifacts.
* Clues and evidence.
* Handouts and documents.
* Historical events.
* Plot points.
* Quests and objectives.
* Mysteries and investigations.
* Rumors and secrets.
* Relationships.
* Important campaign events.
* Custom entry types.

Every entry should support manual editing.
The DM should be able to create an entry without providing enough information for AI to generate the rest.
For example, I should be able to create an NPC with only a name and add their backstory later.
Don't require unnecessary fields.
3. Manual Character and NPC Creator
I want to be able to create every NPC myself.
The editor should support:

* Name.
* Portrait or character image.
* Age and physical description.
* Personality.
* Background.
* Occupation.
* Faction.
* Relationships.
* Motivations.
* Goals.
* Secrets.
* Inventory.
* Current location.
* Knowledge.
* Dialogue notes.
* Custom attributes.
* Game statistics, where applicable.

All fields should be optional unless technically necessary.
For example, I might create:
Arthur Blackwood

* Occupation: Private Investigator.
* Location: Arkham.
* Secret: Knows what happened at the abandoned mansion.

That's enough to create the character.
I should be able to expand the entry later.
NPC Knowledge Tracking
Atlas already has or has planned NPC knowledge tracking.
Make sure manually created NPCs work with it.
I should be able to specify:

* What the NPC knows.
* What the NPC believes.
* What the NPC doesn't know.
* What the NPC is hiding.
* Which clues the NPC can reveal.
* Under what conditions they reveal information.

The system must distinguish actual knowledge from false beliefs and deliberate lies.
Don't automatically give NPCs knowledge of the entire campaign.
4. Manual Clue and Evidence Creator
This is particularly important for Detective/Horror campaigns.
I want to create clues entirely by hand.
For example:
Clue: Bloodstained Letter
Description: A handwritten letter found in the doctor's office.
Location: Doctor's Office.
Reveals: The doctor was secretly meeting someone at the abandoned church.
I should be able to create that clue manually and connect it to existing campaign elements.
Support:

* Clue name.
* Description.
* Evidence type.
* Associated location.
* Associated NPCs.
* Related plot points.
* Discovery conditions.
* Player-visible description.
* DM-only information.
* Physical or digital handout.
* Custom tags.

Manual Clue Connections
I want to be able to manually connect clues to other clues, characters, locations, and story events.
For example:
Bloodstained Letter → Doctor → Abandoned Church → Missing Patient.
Reuse the existing clue connection system.
The automatic clue connection feature should remain available, but it must be optional.
Never automatically rewrite or connect my manually created clues without my permission.
5. Handout Creator
I want a proper handout creation system.
Handouts are essential for Call of Cthulhu and detective campaigns.
I should be able to create things like:

* Letters.
* Newspaper articles.
* Diary pages.
* Police reports.
* Medical records.
* Photographs.
* Maps.
* Telegrams.
* Notes.
* Books and manuscript pages.
* Scientific reports.
* Audio recordings.
* Custom documents.

For example, I should be able to write a newspaper article myself and give it to the players during a session.
Handout Editor
Investigate adding a document-style editor where I can:

* Write and format text.
* Add images.
* Upload existing documents.
* Choose appropriate visual templates.
* Create aged paper or vintage newspaper styling.
* Add dates, signatures, and stamps.
* Save drafts.
* Preview the player-facing version.
* Export or print handouts.
* Reveal handouts to players during sessions.

I especially want templates appropriate for 1920s Call of Cthulhu investigations.
However, the templates should be optional.
I should also be able to start with a completely blank page.
Handouts should support both DM-only and player-visible information.
Reuse existing document and asset tools wherever possible.
6. Manual Plot Point and Story Creator
I want to create my own plot points without AI deciding the story.
For example:
Plot Point: The Doctor Disappears
Trigger: Players discover the hidden laboratory.
Event: The doctor disappears before they can question him.
Consequences: The players must investigate his last known location.
I should be able to create, edit, reorder, and connect plot points.
Support:

* Plot point name.
* Description.
* Trigger conditions.
* Associated NPCs.
* Associated locations.
* Related clues.
* Consequences.
* Branching outcomes.
* Optional events.
* DM notes.

The plot system should support both linear and nonlinear campaigns.
I should be able to create branching storylines where player choices determine what happens next.
Do not force every campaign into a fixed sequence of quests.
7. Visual Story and Investigation Board
I want a visual board where I can organize my campaign.
For example, I could create nodes representing:

* NPCs.
* Clues.
* Locations.
* Plot points.
* Mysteries.
* Events.
* Handouts.

Then manually connect them.
The connections could represent:

* Knows.
* Located at.
* Leads to.
* Caused by.
* Related to.
* Reveals.
* Depends on.
* Custom relationships.

I should be able to drag nodes around, group them, and create custom connections.
Reuse the existing investigation and clue graph systems if they already support this.
Don't build another separate graph editor unnecessarily.
The visual board should reflect the actual Gazetteer entries, not duplicate their data.
Editing an NPC from the board should update that NPC everywhere in Atlas.
8. Manual Mysteries and Investigations
I want to be able to construct an entire mystery manually.
For example:
Mystery: The Disappearance of Professor Ward
I create:

* The missing professor.
* The suspects.
* The investigation locations.
* The evidence.
* The timeline.
* The actual explanation.
* False leads.
* Possible conclusions.

Atlas should organize this information without inventing the mystery for me.
I should be able to determine which clues are essential, which are optional, and which are misleading.
Allow me to connect clues to NPC knowledge and discovery conditions.
The system should help me identify potentially unreachable clues or broken dependencies, but it should not automatically change the story.
9. Manual Events and Timelines
I want to create campaign events and historical timelines manually.
For example:

* October 3: Professor Ward disappears.
* October 5: A witness reports strange lights.
* October 7: The police discover an abandoned vehicle.
* October 10: The cult performs its ritual.

Allow events to be linked to NPCs, locations, clues, and plot points.
Support events that occur at fixed times, events triggered by player actions, and events the DM activates manually.
Reuse Atlas's existing campaign event and world clock systems.
10. Integrate Story Content With Existing Maps
This is essential.
All manually created story content should connect to Atlas's existing worldbuilding tools.
For example:

1. I create a city manually.
2. I add a hospital to the city map.
3. I create a doctor NPC.
4. I assign the doctor to the hospital.
5. I create a clue.
6. I place the clue inside a hospital room.
7. I create a handout associated with that clue.
8. I create a plot point triggered when the players discover it.

Everything should remain connected.
Clicking the hospital should allow me to see associated NPCs, clues, events, and handouts.
Clicking a clue in the Gazetteer should show its associated location.
Don't make me create separate copies of the same information.
11. Manual First, AI Optional
This is one of my most important requirements.
Even in Blank Slate mode, I still want the option to ask AI for assistance.
For example:

* Suggest a backstory for this NPC.
* Generate a portrait.
* Suggest possible clues.
* Help me write a handout.
* Check my mystery for plot holes.
* Suggest a possible consequence.
* Expand this location's description.

But AI assistance should only activate when I request it.
AI should never overwrite, silently expand, or alter manually created content.
Show proposed changes before applying them.
I want the DM to remain the author of the campaign.
12. Player Visibility and Secrets
Every relevant campaign entry should support appropriate visibility controls.
For example:

* DM Only.
* Hidden Until Discovered.
* Visible to Players.
* Revealed to Specific Players, where supported.

A clue shouldn't automatically become visible simply because it exists in the Gazetteer.
A handout should only be shown when the DM reveals it or an approved discovery condition is met.
NPC secrets should never accidentally appear in player-facing views.
Integrate with the existing permissions and player visibility system.
13. Reusable Templates and My Library
Integrate this with Atlas's planned or existing My Library feature.
I want to save manually created content for reuse.
For example:

* An NPC.
* A handout.
* A mystery.
* A collection of clues.
* A story arc.
* A faction.
* A complete campaign template.

Then I should be able to import it into another campaign.
Imported content should become an independent copy unless I explicitly choose another behavior.
Preserve internal relationships when importing collections of connected entries.
14. Campaign Organization
I want a clean interface for managing all this content.
Consider organizing it into sections such as:

* Gazetteer.
* Characters.
* Locations.
* Clues & Evidence.
* Handouts.
* Plot & Story.
* Events & Timeline.
* Investigation Board.

However, inspect the existing navigation before adding new tabs.
If these features already exist in the Gazetteer, improve their discoverability rather than creating redundant sections.
The UI should be approachable for someone creating a campaign from scratch.
Allow partial entries, drafts, and unfinished content.
15. Audit the Existing Implementation
Before making changes, inspect the current codebase and answer:

1. Can I currently create a completely blank campaign?
2. Can I manually create NPCs without AI?
3. Can I manually create clues and evidence?
4. Can I manually create handouts?
5. Can I manually create plot points and branching stories?
6. Can I manually create mysteries?
7. Can I manually create events and timelines?
8. Can I manually connect all these elements?
9. Can I attach them to existing maps and locations?
10. Can I control when players discover them?
11. Can I reuse them in other campaigns?
12. Which features already exist but are difficult to access or aren't properly connected?

Classify each capability as:

* Fully implemented.
* Partially implemented.
* Exists but isn't integrated.
* Missing.

Be specific about the existing components and systems you find.
16. Implement Missing Functionality
Unlike a research-only request, I do want you to implement the missing functionality after the audit.
However:

* Reuse existing components.
* Don't rebuild working systems.
* Don't duplicate data structures unnecessarily.
* Preserve existing campaigns.
* Avoid breaking AI-generated campaign workflows.
* Make blank slate creation a first-class option.
* Keep AI assistance optional.
* Maintain compatibility with Fantasy, Sci-Fi, and Modern campaigns.

If major architectural changes are required, explain them and request my approval before proceeding.
Otherwise, implement the missing capabilities in logical stages and test each stage.
17. Test a Complete Manual Campaign Workflow
After implementation, verify that I can perform the following workflow without using AI:

1. Create a blank Call of Cthulhu campaign.
2. Create a city or choose an existing map.
3. Add three NPCs manually.
4. Create a mystery.
5. Add five clues.
6. Create two handouts.
7. Add three plot points.
8. Connect the clues to NPCs and locations.
9. Place clues inside buildings.
10. Create a timeline of events.
11. Configure which information players can see.
12. Start a session and reveal a handout.
13. Update the campaign based on player decisions.
14. Save the campaign and reopen it without losing any connections.

If any step fails, identify and fix the missing integration.
Final Goal
I want Atlas to support two equally powerful ways of creating campaigns:
AI-generated campaigns: Atlas creates worlds, NPCs, mysteries, stories, and supporting content.
Handcrafted campaigns: The DM creates every character, clue, handout, event, and story element manually.
And most importantly, I want to be able to combine them whenever I choose.
The world generation tools already give me extensive manual control over geography and locations.
Now I want that same creative freedom over the narrative itself.
Atlas should be just as useful to a DM who wants to write an entire Call of Cthulhu mystery by hand as it is to someone who wants AI to generate the campaign.

---

## The user's decision

With it: "ofcourse this is an example i want you to make the decision on whats needed and whats not because i gave you
a big request , and you know best on what features we already have". So: the audit, then what is missing built in
stages, my own judgement on what is needed; only a major change to how Atlas is built goes to the user first.

## Where it stands (11 Nov 2026)

Built: starting an empty campaign (the app's *How it is made: by hand*, `atlas.js init --blank`), the Gazetteer as the
campaign's encyclopedia, people, handouts, plot points, mysteries and quests made by hand, new kinds of connection, What
Atlas knows (with the readiness of each part), Claude's help only when asked and only kept when approved, My library for
people, handouts and story elements, finer switches. Tested with the request's fourteen steps (the workspace's
dev/handmade-test.js, all well). What was left out and why: the workspace's reviews/2026-11-11-handmade-built.md.
