# The playbook: the quickest sound route from a story to a finished atlas

This is the order that works, with the command for each step. It was arrived at the slow way on the Wormroot Idol (51 places, about 1,300 rooms, three rounds of "make them bigger", a map fixed four times). Following it, the next campaign meets the standard on the first pass. `A` below stands for `node "<skill folder>/scripts/atlas.js"`.

## The whole route on one page

| # | Step | Command or file | Done when |
|---|---|---|---|
| 0 | A permanent folder | `A init campaigns/<name> --title "..."` | The folder exists somewhere the user can see, never a temporary one |
| 1 | The story, as given | save it as `story/source.md` | Nothing of the user's is lost |
| 2 | The council | `references/council.md` → `story/council.md`, `story/bible/`, `story/judgement.md` | Every hole closed; cast, clue web, places, acts, endings written; Tolkien grades nothing below Good; all five have signed |
| 3 | The canon sheet and the cast | `canon.md`; `ATLAS.cast({...})` in `campaign.js` | The Core and the facts are on one sheet; principals described |
| 4 | The look | `campaign.js` | Referee's title, grid, paper, fonts, categories, standards |
| 5 | The map of the whole | `A city ...` (`references/cities.md`) | The city or site builds; landmarks reviewed |
| 5b | The world map, when the story travels | `world.js`, `A world ...` (`references/world.md`) | Every location stands on it; its cities are made (`city ... --id`) |
| 6 | Every place registered | one `ATLAS.place(id, {...})` line each | Tier, category, region, tagline, position on the map |
| 7 | The trail planned | `A check` | Every place that matters has two leads in, on paper |
| 8 | The places, one at a time | the loop below | `A check <place>` is clean for each |
| 8b | The table | `table.js`, and on the places (`references/table.md`) | Clocks, the session plan, the calendar and the world's events, the players' characters woven in, handouts, rolls, stat blocks, rescues, random tables, intensity; `check`'s "the table" line is OK |
| 9 | Build and look | `A build`, the preview | Both modes, light and dark, phone width |
| 10 | Publish | the Artifact tool | One address, saved to memory and to the folder's notes |
| 11 | Report | to the user | What was made, what the council changed, what was invented |

Do the steps in this order. Each one feeds the next: the council decides the places, the places decide where the city is centred, the city gives the places their positions, the trail decides which clues each map must hold.

## Steps 0 to 7: before any room is drawn

**0. The folder.** Work in a permanent folder the user can open. Temporary folders are cleared without warning; on Wormroot that cost a day's sources and only a backup saved them.

**1 and 2. The story and the council.** Save the story untouched. Set the world and the kind of campaign in `campaign.js` (`genre`: fantasy, scifi or modern; `kind`: detective, sandbox or hybrid), from the brief or from the story, and see who sits: `node scripts/atlas.js council <campaign>`. Convene that council (`references/council.md`) and let it run to its full length: four writers (for a mystery or horror in our world, the user's own: Conan Doyle, Christie, Poe, Lovecraft; for fantasy, science fiction, crime, intrigue or history, their own) debate and build; the judge (Tolkien; Lem for science fiction) judges what they built, strictly, chapter by chapter, with grades and reasons (`story/judgement.md`); they mend everything below Good; and the bible is final only when all five agree. Do not start mapping from the raw story, nor before the five have agreed: every hole the council would have closed becomes a room with nothing to do or a clue that leads nowhere.

**3. Canon and cast.** Bring `canon.md` up to date from the bible. Put the principals in `ATLAS.cast`. A person on a map then says `who: "id"` and is described once.

**4. The look.** In `campaign.js`: what the referee is called, the grid unit, paper and ink, fonts, an accent, the categories places fall into. `A catalogue` shows what floor kinds and furnishings exist; add any the setting needs.

**5. The map of the whole.** A real city, a real site, an invented city, an invented camp or base, or a base or station of the future: one command (`references/cities.md`). Choose the year from the story, and the set of buildings that fits it (the future for a story in space). Centre a real city on the quarter the story happens in. Read the landmark list and correct it from what you know of the place. When buildings **made for this place** were asked for (`story/brief.md`, or the user), dress the map in a kit: `node atlas.js kit list`, then `kit use`; if there is none for the place, design one (`cities.md`, 4b) and keep it with `kit save`. A kit already on the shelf for the story's city is worth using even when it was not asked for.

**5b. The world map.** When the story travels between places (towns, a coast, a kingdom, planets), make a world map (`references/world.md`); a story in one city needs none. The brief says which kind when the game master chose:
- their own drawing: read it, and write every place on it into `world.js` where it is drawn;
- the real world: `A world <dir> --real "Region"`;
- otherwise an invented land in the story's look.

Every settlement the story spends time in gets its own 3D city: `A city <dir> ... --id <id>`, named by its location's `city:`. Places stand in their city (`city: "id"`), or in a location (`location: "id"`) when it has no 3D map. Write the locations' `desc` for the players and `gm` for the referee, the dangers and closures on the routes, and where the party starts.

**6. Register every place, unmapped.** One line each:

```js
ATLAS.place("custom-house", { name: "The Custom House", category: "water", region: "Harbour", tier: 1, start: true, acts: [1, 3], at: [204, 98], model: "town", tagline: "Where the harbour master keeps the east quay's ledgers under lock." });
```

For a real city, `A locate <dir> "the address"` gives `at`. A place that is a landmark says `landmark: "its name"`. On a real city or site, put `at` on the very building the place is: the place stands in the map's own building there and wears it (never a model dropped among the real ones; the user saw that as "out of place"). If `check` says no building is within reach, move `at` onto one.

Give each place its music here too: `music: "crypt"` (the moods are listed by `A catalogue`). Choose by what the place should feel like in the story, not only by what it is: a church where the worst scene happens may play `dread`. The style is the user's chosen default (`arkham`: dark orchestral mystery); set another in `campaign.js` only when the story plainly is not that, and then by the story's year and place.

Then suggest a song for each moment at the place that changes the mood: `music: { mood: "prison", also: { "The spot count": "dread", "The eighth flame": "sorrow" } }`. Name the moment as its scene or encounter is named, so the referee recognises it, and choose from the moods that exist (never a new one). The page shows these on a card at the top right of the place (the user asked for "suggested song" there), and in the music bar's song chooser. Every tier 1 and 2 place should have them; a place that plays silence needs none. A place without them still gets them: Atlas guesses a song for each of its scenes from the scene's name (a search is Dread, a feast is Tavern, a fever is Hospital), so every campaign has suggested songs; naming them by hand is for choosing better than the guess.

**7. Plan the trail.** For each place write down which clues it holds and where each points. `A check` reports any place nothing leads to. Fix the plan now, while it costs a line; later it costs a redrawn floor.

## Step 8: one place, start to finish

Take the places in tier order, tier 1 first. Finish each before starting the next.

1. **Size it to its tier at once** (`standards.md`): tier 1 is thirty rooms or more on three floors or more. Do not draw a small version and wait to be asked.
2. **Lay out the floors.** Start from what the building is: public rooms at the front, service behind, private above, storage and secrets below. Keep every floor of a building the same size so stairs line up. Use `fx` to furnish a room in one word.
3. `A check <dir> <place>` and `A ascii <dir> <place> <floor>`: read the text drawing. Fix every problem before writing a word of the guide.
4. **Place the clues, people, secrets and encounters** from the trail plan, each with its marker in its room. Give every clue that leads on a `hint`. For the table (`references/table.md`): the `roll` that finds a clue, in the game's own words; a `handout` with its whole text when the clue is a document; a `rescue` for each clue the story needs; `stats` for anyone or anything that may fight; the place's `intensity` and `content`, and for a tier 1 or 2 place a random table or two of its own.
5. `A dump <dir> <place>`: one compact page of everything written so far. Write the room guide from it, about ten rooms to an edit, floor by floor.
6. `A check <dir> <place>` until it says OK. Then `A status <dir>`, which rewrites `checklist.md`.

What makes this fast:

- Write place files with the Write and Edit tools. Shell heredocs on this machine eat backslashes and break on apostrophes.
- One place per file, named `NN-id.js`, so the order of files is the order of the index.
- Never keep a checklist by hand; `status` writes it from the data.
- When a floor is nearly the one below it, copy that floor's outline and change the inside.
- Read `check`'s notes as well as its problems: "more than 40% of rooms have nothing to do" is the note that precedes "make it more interesting".

## Step 8b: the table

When the places are mapped, write `table.js` (`references/table.md`): a clock for each enemy working in the background, the campaign split into sessions, the calendar and the events that happen in the world whether or not the party acts (on a date, or when the party does something; each waits for the referee's yes) (a strong start and a cliffhanger each, every tier 1 and 2 place in one), the players' characters woven in when they were given (`story/pcs.md`: a hook, a secret and a clue of their own placed in a place, which the place file then holds too), the ways back that belong to no one clue, the campaign's own random tables, and any handout that is not a clue. `A check` reads it on its "the table" line. The page does the rest by itself: the players' screen with fog of war, the board, combat and sanity, people and places made on the spot, Ask the campaign, the printed book, maps for online tables, the safety tools.

## Steps 9 to 11: out of the door

**9. Build and look.** `A build <dir>` writes `dist/<title>.html` (to publish) and `dist/preview.html` (to open). The page is laid out exactly as the Wormroot Idol Gazetteer is (`standards.md`, section 9): look at it against that list. Look at one tier 1 place in the referee's view and in player-safe mode: its people here, its clues to find, its maps; look at the city map, the strip of key items and the Story view.

**4a. The masthead.** While setting the look (step 4), give `campaign.js` a short `system` and `setting`, a `strap`, the `acts` and the `keys` (`data-format.md`, section 5). Leave fonts and colours unset: the default dress is the Gazetteer's.

**10. Publish** `dist/<title>.html` with the Artifact tool (load `artifact-design` first for its publish rules, and `artifact-capabilities` for the tracker's database). The first publish declares `capabilities: { db: {}, user: {}, sample: { images: true }, downloads: true, assets: {} }`: the database keeps the investigation tracker and everything at the table and links the players' screen to the referee's page; `sample` lets "Ask the campaign" and "Previously on…" be written by Claude, and the map editor send a floor plan to Claude to read (`images`); `downloads` lets the printed book and the maps for online tables be saved; `assets` keeps the 3D models the game master brings into the model library. Later publishes leave `capabilities` out, which keeps them (a page first published with only `db` and `user` is given the full set once, on its next publish). Later versions go to the same address with a short label. Save the address to memory and write it in the folder's notes. Never delete an artifact unless the user says so.

Where there is no Artifact tool (plain Claude Code, Codex, the Campaign Atlas app), or the folder's house rules say nothing is published, the finished campaign is `dist/preview.html`: one complete page that opens in any browser and can be copied anywhere. Tell the user where it is. Opened that way, the music, the narrator, the referee's own songs, the tracker and everything at the table work, kept in that browser (in the Campaign Atlas app, kept by the app); "Ask the campaign" then shows the passages that answer a question, and in the app it is answered by the game master's own Claude Code.

**11. Report.** In plain words: what was made (how many places, rooms, clues, people); what the council changed; everything invented while mapping that touches the plot (from `canon.md`); what is still open.

## When the user comes back

| They say | Do |
|---|---|
| "Make it bigger", "more rooms" | Add an `expand` step to that place (1.5 to 3 times the floor), each new area with something in it; the earlier size stays as a button. Or, if they want to do it themselves: the place's "Edit this map" |
| "I want the mansion exactly like this", a floor plan or sketch | Draw it from their words or picture (`workflow.md`, "When the game master wants it exactly so"); tell them the page's map editor can change any map, and trace or read a picture |
| "I changed the map on the page" (or any return to a published campaign) | Take in the redrawn maps (`workflow.md`, "Taking in a redrawn map"): `edits/<place>.js`, then the guide entries `check` asks for |
| "The map looks wrong" and you cannot see what | Ask which map and what is wrong, once, with choices. Four maps were inspected on Wormroot before asking; ask first |
| "Change the city" | Run `city` again with other options, or `ATLAS.cityEdit`; never edit `city.js` |
| "A map of the wider world", "here is my map", "the real coast" | `references/world.md`: an invented land, their drawing (`--drawing`), or the real world (`--real`) |
| "Make the 3D map of X" (a location on the world map) | `A city <dir> --invent "X" --id <its city id>` (or a real city by name, with `--id`), then build |
| "Here is world.js from the page" (Copy as world.js) | Put it in place of the old `world.js`, `A world <dir>` (keeps the land), check, build |
| "Add a place" | Register it, give it two leads in from existing clues, map it, rebuild |
| "Here are my players' characters" | Save them as `story/pcs.md`; weave each in (`references/table.md`, section 5): `ATLAS.pcs` in `table.js` and their own clue in its place; check, build |
| "How do I show my players the map", "a second screen", "handouts" | Nothing to make: the page's At the table view, Players' screen tab (`references/table.md`, section 1). Tell them how |
| "Add a clock", "split it into sessions", "make this a handout", "add an event", "set the date" | `table.js` or the clue's `handout` (`references/table.md`); check, build |
| "Players should not see X" | `h: 1`, door type `"s"`, or `gm: 1`; then `check` |
| A new story | A new campaign folder; start at step 0 |

## Done means

- `A check <dir>` ends "all clear".
- Every place meets its tier.
- The table is written: clocks, sessions, handouts, rolls, stat blocks, intensity, and the players' characters when they were given.
- The council's transcript, the bible and the canon sheet are in the folder.
- The page is published at one address, and that address is saved.
- The user has been told what changed and what was invented.
