# Hand-off: where Campaign Atlas stands, and what comes next

Kept up to date with every push, so that work can go on from any session (a cloud session sees only this repository).
Last updated: 27 Oct 2026.

## What this is

Campaign Atlas turns a story into a playable tabletop campaign: a council of writers fills out the story, every place gets floor-by-floor maps, cities are drawn in 3D (real ones from their real streets), worlds and galaxies get maps above them, and everything ends up as one page the game master runs the table from. This repository is the **app** (`server.js`, `ui/`, `lib/`): paste a story and the user's own Claude Code makes the campaign. The **tool** that makes campaigns is the Claude Code skill mirrored in `plugin/skills/campaign-atlas/`:

- `SKILL.md`, `references/*.md`: how a campaign is made (start with `references/playbook.md`; the world map is `references/world.md`; galaxies `references/galaxy.md`; the table `references/table.md`; the data format `references/data-format.md`; the workflow and the wild `references/workflow.md`).
- `scripts/atlas.js`: the command line (`init`, `check`, `build`, `city`, `world`, `galaxy`, `ship`, `wild`, `cave`, `council`, ...). `check` must end "all clear" before anything is published.
- `engine/*.js`, `engine/atlas.css`: the page itself (plain browser code, no build step). `atlas-world.js` the world map and its editor, `atlas-world-art.js` how each look is drawn, `atlas-galaxy*.js` the galaxy and its editor, `atlas-city.js` the 3D cities, `atlas-mapedit.js` the room-map editor, `atlas-table*.js` everything for game night, `atlas-tutorial-data.js` the lessons.

On the user's own machine the live copy of the skill is `~/.claude/skills/campaign-atlas`; `node tools/sync-atlas.js` copies it into `plugin/skills/campaign-atlas` before each commit. **A cloud session edits `plugin/skills/campaign-atlas` here directly**; the next session on the user's machine copies those changes back into `~/.claude/skills/campaign-atlas` (check `git log` for commits made elsewhere) before going on.

## Standing rules (from the user)

- Make the sensible decisions yourself; no needless questions. Keep going to the end of a piece of work; no check-in pauses.
- **Push before finishing anything**, and keep this file current.
- Never delete a published artifact without the user's explicit say-so. Do not change the Wormroot Idol Gazetteer unless asked by name.
- Start no helper agents unless asked.
- Never enter credentials or API keys into fields; the user enters their own. Downloading any outside file needs the user's yes (name, source, size).
- Every new feature is taught: a lesson in `engine/atlas-tutorial-data.js` (with its `COVERS` and `FEATURES`); the workspace's `dev/tutorial-coverage.js` must say "all taught" and `dev/tutorial-video.js` records the video again. The app's own lessons are `ui/tour-data.js`.
- After any change to the city engine, the workspace's `dev/city_regression.js` must still build the Wormroot Idol's London exactly.
- Generated traps are fictional game mechanics only.
- Every map must be editable when the generated one has a flaw or the game master does not like it (27 Oct 2026).
- Real places (modern campaigns in real cities) are not reshaped: only the story's places are put into buildings already there.
- The user is a game master, not a programmer: talk about stories, places, maps and clues.
- Claude cannot hear: the music and voices were balanced by measurement; take the user's word for how they sound.

## Done (newest first)

- **Fantasy world maps painted in colour** (27 Oct): the look `painted`, now the default for fantasy: forests tree by tree, mountains drawn by hand as stamps (single peaks, twin peaks, massifs, spires, snowy versions), hills, farmland round settlements, a glowing coast with ripples, ships, red-roofed settlements, an eight-pointed compass, a title scroll, a key of the realms. Parchment, engraved, atlas (modern: the user likes it as it is), survey and star chart remain.
- **The galaxy editor**: systems added and moved (courses follow), regions, lanes, trade routes, corridors of their own length, sectors, powers, territory painted, a system's worlds, belts, stations and facilities changed, added or removed, with warnings for what would not hang together; undo and redo; "Copy the changes" for `table.js`.
- **The world builder on the world map**: a land brush (land, sea or lake, mountains, hills, lowland, forest, desert, swamp, grassland), rivers, realms held by factions (secret ones for the referee), names, duplicate, move and reshape, undo and redo, a world from nothing (all sea or all land), "Copy as world.js".
- **The wild** (`atlas.js wild`): forests, mountains, deserts, swamps, jungles, tundra, plains, coasts, alien and hostile surfaces as places.
- Facility systems (power, air, pressure and the rest) for stations and ships; people, dangers and secrets placed on room maps.
- Before that: the galaxy and ships, the players' journal, factions and people's lives, the world's time and events, councils by world, tutorials, caves with riddles and traps, the players' copy, the copilot, the consistency checker.

## To do, in order

1. **The city map editor** (fantasy and invented cities): click a building to move, remove or change its kind; add buildings, shops, taverns, houses; roads (add, reroute), walls and gates, parks and plazas; who holds which district (factions); people; a building opens its interior map where it has one. Lay the changes over the built city as "+ Add location" does (`atlas-locations.js`, `setCustom`), never rebuilding it, and keep `dev/city_regression.js` exact. Undo and redo. Teach it.
2. **The rest of the world builder**: selective regeneration with confirmation (this village, this building, expand this cave, add a planet), each showing what would be replaced; back-to-the-parent navigation everywhere (world → city → building → room; galaxy → system → planet → place).
3. **Stage H** of the master plan: loot and economy; the quest consequence simulator; world history and a timeline; the game master's dashboard with manual, assisted and autonomous modes.
4. Record the tutorial video again (new lessons: shaping the world, changing the galaxy).
5. **Modern real cities, last**: only adding the story's places into buildings that already stand; the real streets and buildings never change.
6. **Finally, the UI/UX polish** across the app: make a checkpoint branch first, keep the identity, test every workflow and screen size, update the lessons. **At its start, remind the user** to review the narrator's voice, the voice quality and every sound effect with them (they said some are "really bad"); change nothing there before then.

Open-ended: the asset library; expedition planning for planets.

## How to try things

```
node plugin/skills/campaign-atlas/scripts/atlas.js init /tmp/atlas-test --title "Test"
node plugin/skills/campaign-atlas/scripts/atlas.js world /tmp/atlas-test
node plugin/skills/campaign-atlas/scripts/atlas.js check /tmp/atlas-test
node plugin/skills/campaign-atlas/scripts/atlas.js build /tmp/atlas-test
```

Open `/tmp/atlas-test/dist/preview.html` in a browser. Test outside the repository, and never touch the user's own campaigns in `workspace/`. The skill's `example/` is a full campaign to copy, build and look at.
