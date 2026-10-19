# The specification

What a finished campaign made with this tool must be. These are the standards the user settled on over the Wormroot Idol project; they are written down so the next story meets them the first time, without being asked. A rule marked **[checked]** is enforced by `atlas.js check`, which reports a place that falls short. A rule without the mark is yours to keep.

## Contents

1. What is delivered
2. The story
3. How big a place must be
4. The maps
5. The room guide
6. Clues, people, secrets, encounters
7. The clue trail
8. The city map
9. The page
10. How the work is kept safe

## 1. What is delivered

For every campaign:

- **A story bible** written by the story council (`references/council.md`): the truth, the cast, the clue web, the acts, the endings. As long as the story deserves; never trimmed to save space. Four writers build it (Conan Doyle, Christie, Poe, Lovecraft); Tolkien judges it strictly, every chapter graded with reasons, nothing left below Good; it is final only when all five agree. His judgement is delivered with it (`story/judgement.md`, on the Story view).
- **An atlas page**, published as one artifact at one address that never changes: an index of places, each place's maps and room-by-room guide, the clue trail, the cast in full, and the map of the whole (a city, real or invented, or a site such as a camp or a base).
- **The source folder**, in a permanent place on the user's computer, from which the page can be rebuilt exactly.
- **A report**: what was made, what the council changed, what was invented while mapping, what is still open.

## 2. The story

- The **Core** survives: the handful of things the user's story is about (written down first, in `story/council.md` and `canon.md`). Everything else may change.
- It is a story to **play**, so it runs on clues. Every conclusion the players must reach has at least three clues, in at least two different places or people.
- Every principal character has a want, a secret, a lie they tell, and something that makes them talk.
- The truth has a dated timeline, and the antagonists have a plan that moves if the players do nothing.
- There are at least three endings: a good one, a costly one, a bad one.

## 3. How big a place must be

The user asked three times for bigger places, always for the important ones. So importance sets size, from the start. Every place carries a `tier`. **[checked]**

| Tier | What it is | Rooms | Floors | Secrets | Clues | People | Encounters | Leads in |
|---|---|---|---|---|---|---|---|---|
| 1 | The story cannot run without it: where it opens, the central scenes, the antagonists' bases, the finale | 30 or more | 3 or more | 2 or more | 5 or more | 3 or more | 2 or more | 2 or more |
| 2 | The trail passes through it: witnesses, archives, shops, lesser hideouts | 12 or more | 2 or more | any | 3 or more | 2 or more | 1 or more | 2 |
| 3 | Colour and reward | 6 or more | 1 or more | any | 1 or more | 1 or more | any | 1 |

**[checked]** for every column. These are floors, not targets: on Wormroot the key places ran 35 to 65 rooms on 3 to 5 levels, about 45 to 60 squares wide; the middle tier 12 to 37 rooms; the smallest 6 to 19. A campaign may change a number in `campaign.js` (`standards: { 1: { rooms: 24 } }`) when its setting calls for it, with a comment saying why.

- Build a tier 1 place at its full size the first time. Do not make a small version and wait to be asked.
- "Bigger" means more to find and do: each added area brings a clue, a person, a secret or a danger, and ties to something elsewhere. Empty floor is not bigger.
- When the user does ask for bigger, add an `expand` step (1.5 to 3 times the floor area) so the earlier map stays and the page offers size buttons; the page opens on the biggest.
- Existing rooms are never renumbered.

## 4. The maps

- Square grid, one map per floor, every floor of a building the same size so stairs line up. **[checked: stairs have both ends, on the floors they name]**
- Every room is numbered (`R1`...) and named on the map, and the same number and name head its entry in the guide. **[checked]**
- Every room can be walked to: doors, openings, stairs. **[checked]**
- Two versions of every floor: the players' and the GM's. On the players' version there are no hidden rooms, no secret doors, no markers, and nothing that stands inside a hidden room. **[checked]**
- A room reachable only by a secret way is itself hidden. **[noted by check]**
- Labels fit their rooms. **[checked]** Items are real ones. **[checked]** Markers sit in the room their entry names. **[checked]**
- The building is believable: public rooms at the front, service at the back, private above, storage below, and the street or yard around it drawn.

## 5. The room guide

Every room, without exception, answers: **[checked]**

| Field | Shown to | What it holds |
|---|---|---|
| `d` Description | everyone | What is seen on walking in. Two or three concrete sentences. |
| `pur` Purpose | everyone | What the room is for. |
| `atm` Atmosphere | everyone | Smell, sound, light. |
| `obj` Contents | GM | What can be looked at or taken. |
| `chk` Skill checks | GM | What can be rolled, and what each success gives. |
| `kp` GM notes | GM | What the referee needs to know to run it. |

The page adds on its own, from what is placed in the room: the people there, the clues, the secrets, the encounters, and the connections worked out from the doors and stairs.

- `d`, `pur` and `atm` never give anything away. **[noted by check when they name a clue or secret]**
- Every room earns its place with a clue, a person, a danger, a secret, a choice, or a route that matters. **[noted by check above 40% idle rooms]**
- Every floor has a note (what is here, who, when, how it feels); every place has an overview, running notes and an exterior to read aloud. **[checked]**

## 6. Clues, people, secrets, encounters

- A clue has a title, a room, a description, how it is found, what it reveals, and usually where it leads. **[checked]**
- A clue that leads somewhere has a hint: what the referee can do when the players miss it, so no single clue can stall the game. **[checked at tier 1; noted below]**
- A person has a name and role, a room, what they look like, what they are doing, what they know, and what makes them tell it. **[name, room and description checked in every place; the rest noted]**
- **Every person is a person.** Each one the players can meet, however minor, has what they look like, their story, how they act, and who they know (`look`, `bg`, `manner`, `ties`): the user asked whether "each person who's in a room" had a backstory, a description, the people they know and are friends with, and how they act, and wants all four. A sentence or two each is enough for a minor person; the ties are what make them worth talking to, and the page shows the web both ways. **[all four checked in every place, their own or the cast's]**
- The people the story turns on are the cast (`ATLAS.cast`): each described once and in full, with what they look like, how they act, how they speak, their background, who they know and how, what they want, what they hide, the lie they tell, what makes them talk and what becomes of them. A person on a map who is one of them says `who`. **[looks, story, manner, ties, want, secret and what makes them talk checked; a cast member met nowhere noted]**
- A secret has how it opens and where it leads. **[checked]** An encounter says what happens. **[checked]**
- Each is drawn as a marker in its room. **[noted by check when missing]**
- **People are where they are posted.** The user asked for this in so many words: "the guards should be in the guard tower". Everyone the text says is somewhere is on the map there, with a marker and a figure (the `fig` item): a guard in his tower, a sentry at his gate, a patrol on its path, a gang at its work, a clerk at his desk. A post is drawn as a place of its own (a watchtower, a sentry box or a gatehouse is a small room with its person in it), never only mentioned in a note or an encounter. Say when the post is manned if it is not always.

## 7. The clue trail

- The story has at least one starting place. **[checked]**
- Every other place is pointed to by a clue or a person somewhere else. **[checked]**
- A tier 1 place has two separate leads in, so one missed clue cannot stall the game. **[checked]** Tier 2 should. **[noted]**
- A lead names a real place. **[checked]**

## 8. The city map

A story set in one place gets a map of the whole: small 3D buildings standing on a printed plan, the campaign's places numbered, the landmarks named. How to make one is in `cities.md`. The engine keeps these rules itself; they are listed so nobody undoes them.

- **A real city is the real city.** When the user names a city that exists, its streets, their names, its rivers and coast, parks, railways and walls are fetched, never invented or drawn from memory. **[checked: a real city carries its source's credit]**
- **The buildings belong to the story's age**: medieval, industrial, modern or the future, in the colours of that part of the world. Nothing stands that was built after the story's year.
- **The map is built of its story's own set of buildings.** Atlas keeps a ready-made set for each kind of setting (the medieval town, the city of 1888, the modern city, fantasy's town, the camp, the base, the future's moon base and station) and every campaign of that kind reuses it. A story in space or after 2200 is drawn as the future: modules, domes and tubes under black sky, never the houses of 1888 or a desert base's walls (the user caught a moon station built of them, 15 Oct 2026). A place that names no model on such a map takes one of the future's own from its name. **[checked: a story in space or the future on a map that is not; a place wearing a building of the wrong age]**
- **Its landmarks are there.** The famous buildings, bridges, towers and parks stand on their true footprints at their true heights, and are named. Read the list after every fetch and add what is missing.
- **An invented city suits its age, its site and its people**: walls and crooked lanes, or boulevards and a station, or a grid and towers; street names in the right language.
- **A place that is not a city is mapped as what it is**: a camp, a base or a compound shows its real or invented buildings, fences and towers, with nothing grown between them.
- The plan is drawn, and the houses stand, right to the edge of the sheet. No fading to blank paper, no thinning out toward the edges.
- **Nothing stands off the paper.** The paper is the plan (the sheet and its margin); beyond it is the table. Every tree (with its crown), house, hut, surveyed building, landmark, wall, fence, viaduct, boat, lamp and chimney lies wholly on it: the engine leaves out whatever would hang over the edge and cuts a wall where the paper ends. The user saw trees standing out on the table and asked that nothing be generated out of bounds again (14 Oct 2026). Anything new the engine learns to stand up must go through the same rule (the last pass of `buildCity`). **[checked: nothing off the paper, by kind]**
- The frame runs round the very edge of the sheet. A frame drawn a margin in from the edge reads as a stray line across the map.
- Nothing on the ground moves with the camera or changes with zoom. The plan is printed once, sharply, in tiles.
- No two flat surfaces lie close together. The table under the sheet is drawn first and kept out of the depth buffer; the near plane follows the view.
- The paper's grain is soft and fixed to the plan. No per-pixel noise.
- Lamp posts, chimneys and trunks are hidden when the view is too far to see them.
- If 3D cannot start, a flat map with the same places takes its place.
- Every place is on the map, inside the sheet, or is marked `offmap`. **[checked]** A place that says it is a landmark names one the city has. **[checked]**
- **A place stands in one of the map's own buildings.** The user caught this on Birkenau: "the locations are out of place; you are not using the ones that are native to the map". On a real city or surveyed site, a place set down by `at` takes the map's own building at or nearest that spot (a surveyed outline, including the closed wall a survey keeps round a ruin's foundations; a hut of a row; a house along a street) and wears its true outline, in the place's colours, with its pin. Never a model of its own dropped among the real buildings, turned the wrong way. The engine does this itself; choose `at` on the building the place really is (look at the plan, or `locate`). **[noted by check when no building is within 12 squares]**
- **A landmark added by hand stands on the survey's own outline** beneath it when there is one (a crematorium drawn as a rectangle takes its true foundations), and that outline is not drawn twice. Before drawing a footprint yourself, look for one in `city.js`: a survey often holds a ruin as a closed `wall`. A landmark may be given only its outline (`pts`); its centre is taken from it.
- **Angles are in radians.** One above 6.3 can only be degrees and is read so (hut rows written `ang: 90` once stood askew at 117°).

## 9. The page

- One artifact, one address. Later versions are published to the same address, each with a short label.
- Works in light and dark, and at phone width; nothing scrolls sideways except a map inside its own frame.
- A player-safe switch hides everything meant for the GM.
- **The page is laid out exactly as the Wormroot Idol Gazetteer is.** The user asked for this in so many words ("make it exactly like the wormwood layout"), after three rounds of noticing differences. `engine/atlas-shell.js` and `engine/atlas.css` are a port of that page; do not redesign them, and compare against the Gazetteer (`wormroot-gazetteer-src/preview-music.html`) before changing either. From the top:
  1. **Masthead**: a kicker (system · setting · the referee's gazetteer), the title with a short strap in the accent colour (`strap`), then search, the act filter (`acts`) and the referee / player-safe switch.
  2. **Music bar**, right-aligned: Music (play and stop), Songs (the chooser: what is playing, follow the places or hold a song, the style, every place's songs, and every mood grouped with what it is played on), volume, and what is playing. The user asked for a player "easier to choose songs with" (14 Oct 2026).
  3. **Views**: Gazetteer, The story (referee only), and Music. No other tabs: people and clues live on the places. Music is where the referee makes music of their own (the user asked for it: "create your own music loop ... ambient sounds like lightning, heart beat ... and instrumental musics ... add a new music tab"): a piece is a style and a band (melody, chords, drone, drums from any time and place), how tense, how big the room, sounds all the way through (wind, rain, waves, running water, fire, a crowd, machines), now and then (lightning, distant thunder, a bell, a ship's horn, a clock, clanking, steam), and horror sounds (asked for by the user: someone screaming, knocking at a door, footsteps, a door creaking, heavy breathing, a heartbeat, whispers, a monster growling, a wolf, a dog barking, a cat screaming, chains, gunshots), each with a "hear it" button that plays it once. It plays while it is changed, levels its own loudness, saves itself (database `mixes`), and can be given to any place. Pitched drips and chirps are never offered.
  4. **The strip of key items** (`keys`; in the Gazetteer, the seven fingers): numeral, name, where it lies.
  5. **The investigation tracker**, folded shut: characters, ready to follow, leads in play, only one way in, keys.
  6. **The 3D plan.**
  7. **The index** (category chips, places by category with number, name, district and key numeral) beside **the dossier**.
- **A dossier reads in this order**: beside the head, at its top right, the suggested song (the user asked for it there: the place's song, and for the referee a song for each moment at the place; under the name when the column is narrow); eyebrow (number, category, district); name; subtitle (the tagline, referee only); act tags; access box; first impressions to read aloud; the maps, with the referee's guide, floors, room-by-room guide, clue directory, people, secret ways and dangers under them; what's really going on; people here (each opening into a profile, with the referee's notes); clues to find (a checklist: tick, where it would lead, how to hint at it); scenes and hooks; connected places; why they're connected; access, leads and keys; previous and next.
- **Entries fold.** Every room, clue, person, secret way, danger, scene and connection on a place's page starts as one line (its letter or number, its name, and where it is) and opens when clicked; each list has an Open all switch, and a marker clicked on a map opens its entry. The user asked for this ("a drop down button on the clues and stuff so it's not as crowded").
- **The whole story is on the page.** The council's bible (`story/bible/*.md`), its debate and the story as given are put on the Story view by `build`, in one reading column with the chapters as a row of links. The user reads the story there, not in the folder: a campaign whose story exists only as files has not delivered it.
- **The tracker saves.** Ticked clues, place statuses, keys, characters and notes are kept in the artifact's database, so the first publish declares `capabilities: { db: {}, user: {} }`. Where there is no database (the local preview) the tracker says so and the checklists show as plain lists.
- Every place has music of its own: a theme in the mood of the place, in the dark orchestral mystery style the user chose as the default (another style only where the story plainly calls for one), made by the page itself, started from the Music button, changing as the referee moves from place to place. Tier 1 and 2 places say which mood they play rather than leaving it to be guessed. **[an unknown mood is checked; a guessed tier 1 theme is noted]**
- **The referee can give any place a song of their own** (the user asked: "add the option to put your own custom song for each location"). From the card's "Use your own song": one of Atlas's songs in any style, or a link (YouTube, Spotify and the like open in a new tab; a link to a music file plays in the page), both saved in the page's database (`songs`, one document a place); or a music file from their computer, played in the page and kept in that browser only (a published page cannot store audio, and their own recordings are not for everyone the page is shared with). Their song plays in place of the suggested one, which stays on the card. The page declares `db` for this, as it does for the tracker.
- **One narrator reads the page aloud** (the user: "i want one narrator"). Each place's first impressions and each room (its description, then its smell, sound and light) has a Read aloud button; the narrator's voice, depth, speed and volume are set once in its settings ("Narrator", beside the first impressions) and kept in that browser, since each computer has its own voices. The music steps back while it speaks; with no music playing, a bed of the place's own sound plays under him (its air and weather, a low drone, faint chords; the user asked for "ambient noise to the narrator so it's not so dull"). The narrator the user chose is Google UK English Male, deep (pitch 0.55, speed 0.88, short pauses 0.35), which only Chrome has; the settings say which voice is reading and warn when the chosen one is missing. It uses the browser's free voices (`engine/atlas-voice.js`); a voice cloned from a sample, or designed from a description, needs a paid service and belongs to the downloadable app. If the user supplies a sample of how the narrator should sound (`dev\reference\`), measure its pitch and pace and set the narrator's defaults to match.
- **Each style sounds like its era.** The user asked for this ("medieval should have the instruments which they had during the medieval time"). A style plays only instruments, scales, harmony and drum rhythms of its time and place (a lute, a hurdy-gurdy and bare fifths in the middle ages; a violin, an upright piano and a military snare in wartime; an oud, a ney and quarter tones in the Arab world), and a mood within it takes the instrument that would really be heard there (the shawm in a medieval market, a barrel organ in a Victorian street). Choose the style by the story's year and place. The list is in `data-format.md`, section 5.
- The title is the campaign's name.
- Never delete an artifact unless the user says so.

## 10. How the work is kept safe

- The campaign folder lives in a permanent place the user can see. Never in a temporary folder: on Wormroot, Windows cleared the temporary folder mid-project and only a backup made the day before saved the sources.
- `check` is clean before anything is published.
- `canon.md` is current, and everything invented is listed in it for the user.
- `checklist.md` is written by `status`, not by hand.
- The artifact's address and the folder's location are saved to memory and written in the folder's own notes.
