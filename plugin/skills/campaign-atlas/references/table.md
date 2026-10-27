# At the table

A campaign is played, not only read. Every page Atlas builds has an **At the table** view for the referee (the user asked for all of it on 20 Oct 2026) and a **players' screen** for the table. Most of it works with nothing written for it. The rest runs on what the council writes: the villains' clocks, the session plan, the players' characters woven in, handouts, rolls, stat blocks, random tables, ways back when the table is stuck, and how hard each place hits. This file says what the page does by itself, what the council writes, in what format, and what `check` asks for.

## Contents

1. What the page does by itself
2. What the council writes, and where
3. The villains' clocks
4. The session plan
5. The players' characters
6. Handouts
7. Rolls and stat blocks: the game's own rules
8. Ways back: rescues
9. Random tables
10. How hard a place hits: intensity and content
11. The age and the people
12. What `check` asks
13. Publishing
14. The investigation: clues on the map, connections, who knows what
15. Riddles and traps at the table
16. The copilot: Talk and Improvise
17. Checking the campaign for consistency
18. The world's time: the calendar, events, news
19. Factions and people's lives
20. The players' journal

## 1. What the page does by itself

**Finding one's way** (the user found the first version hard to find their way in, 20 Oct 2026, so it was laid out again):

- The **At the table** button stands apart from the other views (its own colour, a die), and a referee who has not opened it yet sees a one-time hint under the views saying what is there.
- The view opens on **Start here**: the two things a game night turns on (the players' screen, with whether it is open, and tonight's sheet), every other tool as a card saying what it is for and where things stand, and "How a game night goes" from session zero to the notes afterwards.
- The tools are listed down the side, each with a line on what it does, grouped *During the game* and *Before and after* (along the top on a narrow screen, along the bottom in the table-side view).
- A **toolbar at the bottom right of every page** holds what is wanted mid-scene without leaving the place being read: Dice, A person, Stuck?, Ask, and the Players' screen (a green dot when it is open; its panel shows a small copy of what the players see).
- Each place's page has an **At the table** row under its name: show its map to the players (a dialog where each room is clicked open as they enter), its handouts (each to read, give or print), its random tables, and its maps for online tables. A clue that is a handout has a *Handout* mark on its line that opens it.

The **At the table** view (referee only) has these tools:

| Tab | What is there |
|---|---|
| Tonight | Tonight's sheet: a strong start, the places they are likely to visit (the plan's, and those a found clue opens), the clues still to find there with their rolls and hints, the people they may meet, the players' characters' own clues, the clocks, what to do if it stalls, and the cliffhanger to aim for. Printable. Beside it, the notes on each session and **Previously on…**, a recap made from the last session's notes and what the party has found, read aloud by the narrator or put on the players' screen. The session plan. |
| Players' screen | What the players see now, and what to show them: the title, the world map (players' view), their board, the lines and veils, a dark screen, words to read, a face (a person's name, trade and look, never their secrets), a handout, or a place's map **room by room** (fog of war: a room appears when the referee clicks it open). On a cave the fog is also **brushed** away, or painted back, square by square (brush of 1 to 8 squares); a hidden chamber or secret passage joins the players' map only once the referee shows it; the fog can be turned off for a map, previewed as the players see it, and put back over every floor ("Start exploring again"). The players' screen shows a map flat or **in 3D** (the referee's choice, "Their screen shows it"; a campaign with 3D rooms starts in 3D): in 3D the same fog holds, and nothing under it is built at all (no rock, walls, models or stairs), darkness lying over it; the referee's own 3D view is never fogged, and ticking "What the players see" with 3D chosen shows the players' 3D view. It is kept (collection `fog`: `{ f: { floor: [rooms] }, c: { floor: one character a square }, cw, off }`) and the players' screen follows it at once. |
| Clocks | The villains' clocks, ticked by the referee; each tick says what has just changed in the world. **They're stuck**: ways to bring the story back to the party, from what is still open (a hint or rescue for a clue not yet found, someone who knows the way coming to them, a place with only one way in, a clock to move). |
| Combat | Initiative (in Call of Cthulhu, DEX order), wounds, and in Call of Cthulhu Sanity, Luck and Magic Points, with a Sanity roll; whoever joins from the party, the cast with numbers, or the dangers at the chosen place. Dice, and a d100 against a skill read as Call of Cthulhu reads it (regular, hard, extreme, fumble). |
| Make it up | **A person, now**: a name of the story's people and age, a trade, a look, a manner, what they want and hide. **A place, now**: a small mapped place (an inn, a shop, a house, a warehouse, an office, a church, a cave) dressed for the age, with someone in it and something to find that points where the party needs to go. Random tables: the campaign's, and everyday ones for the age (weather, the street, a complication, what is in a pocket). |
| Investigation | Every clue with its kind, where it is, how far the players have come with it, and what it joins; **Auto-Connect to Story**, who knows what, the questions still open, the loose ends, and the history of every change (section 14). |
| The board | A corkboard of every person, place and clue, with red string for leads, black for who knows whom, grey for where things are. Cards can be moved. The players' own board, on their screen, holds only the clues they have found, the places they know of, and whatever the referee pins up. |
| The party | The players' characters, and the players' notes (they write them on their screen; the referee can read and add to them). |
| Safety | Session zero: lines (not in the game) and veils (only off screen); the places that touch them are flagged. The X-card: a Stop button on the players' screen raises a banner on the referee's page. How hard each place hits. |
| Ask | Ask the campaign anything; it answers from the bible, the places, the people and the clues. On claude.ai Claude writes the answer from the passages (the `sample` capability); in the Atlas app the game master's own Claude Code does; anywhere else the passages themselves are shown, best first. |
| Print and export | The whole campaign as a printed book (the story, every place with its maps and guide, the people, the characters, the sessions, the clocks, the handouts each on its own page), saved as a file to print from a browser. A place's maps for online tables: a zip with each floor as a Universal VTT file (`.dd2vtt`, walls and doors in it, for Foundry's Universal Battlemap Importer) and as a plain picture (Roll20, Owlbear Rodeo). |

Each place's dossier also shows its intensity and content, its random tables, the players' characters' clues there, a button to show its map on the players' screen, and one to export it for online tables; each clue shows its roll, and its handout to read or give. A **table-side view** makes everything bigger to touch, with the tabs along the bottom of the screen.

**The players' window** (the user asked, 21 Oct 2026, for a separate window holding only what the players have) is the page opened a second time with `#players`: the referee's "Open the players' screen" opens it in a window of its own, to drag onto a television; on another computer, "Make this window the players' screen" turns that window into it. Nothing of the referee's is on it, and a window opened for the players has no way back to the referee's page.

**The players' copy** (the user asked, 27 Oct 2026, for the players' secrecy to be kept in the data itself): `atlas.js build` also writes `dist/players.html`, the players' window with none of the campaign in it: only its name, strap, system, dress and the lie of its land (the world map's terrain, without the places on it); not the story store, nor the cave generator's words, riddles and traps. The referee's page (atlas-share.js) sends it, through the table's store (collection `share`), only what the players have been shown, worked out again as the table changes: each place they know of (name, region, its outside once more than rumoured), the pieces of its floors they have seen or stand beside (names only where seen; hidden chambers once shown; secret doors once both sides are seen; furniture, models and stairs among them; floors not seen as blank frames without a name), the clues found (title and `pd` only), the traps shown, their board, and the world map's known places and roads. Handouts go with their words when shown. Opened from `dist/preview.html` or from the app, "Open the players' screen" opens this copy; the published page (one file) still opens itself with `#players`. Nothing need be written for it: it follows the campaign as it is.

**On the players' own phones** (the Atlas app only, app/lib/players-lan.js): the Players' screen tab has "Let the players join from this Wi-Fi". Switched on, the app opens a second door on this computer's network (its port and one) serving only that campaign's players' copy and, of its table, only what the players' window reads; the players may write only their notes, the X-card and their presence. The tab shows the link and its QR code (app/lib/qr.js); "A new link" replaces it, and switching it off closes it at once. Nothing is reachable from the network until it is switched on; Windows may ask once whether Node.js may use private networks.

Its menu along the bottom (fading on The table until the mouse moves):

- **The table**: what the referee sends, and only that. When something new arrives while a player is on another page, a prompt offers to look.
- **Handouts**: every handout the referee has given them, newest first, to read again (a count shows the new ones).
- **Our board**: their corkboard of what they have found.
- **Places**: the places they know of, the first impressions, what they found there, and the maps with only the rooms they have seen.
- **News**: what the referee has let them hear of the world (section 18), newest first, with a count of what is new; the world's date stands in a corner of The table.
- **Journal**: what the referee gives them to keep, by the journal's settings (section 20): their quests, the people they have met, hints and next steps, "Previously on", and in full mode a timeline.
- **Our notes**: the notes the party keeps, which the referee can read and add to; each a note, a theory or a question. Atlas never says whether a theory is right.
- **Stop**: the X-card.

A face shows a person's name, the plain part of their role (what follows a semicolon or a dash is left off, being often the secret) and their look. The window follows the referee's page at once.

Where it keeps things: the page's database on claude.ai and in the Atlas app; anywhere else (a file opened from the computer), in that browser, so the tracker and the table still work.

## 2. What the council writes, and where

| What | Where | Who leads |
|---|---|---|
| The clocks | `table.js`: `ATLAS.clocks([...])` | Christie (the antagonists' plan) and Lovecraft (what it costs) |
| The session plan | `table.js`: `ATLAS.sessions([...])` | The clerk, for the table |
| The players' characters | `table.js`: `ATLAS.pcs({...})` | Christie (secrets and ties), Doyle (their own clue) |
| Handouts | each clue's `handout`; others in `table.js`: `ATLAS.handouts([...])` | Lovecraft (documents), Poe (their voice) |
| Rolls | each clue's `roll`; encounters' `roll` | Doyle |
| Stat blocks | `stats` on a person, on the cast, on an encounter | The clerk, in the game's own rules |
| Rescues | a clue's `rescue`; `table.js`: `ATLAS.rescues([...])` | Doyle and Christie |
| Random tables | a place's `tables`; `table.js`: `ATLAS.tables({...})` | Poe (atmosphere), Christie (rumour) |
| Intensity and content | each place's `intensity` and `content` | The clerk, honestly |
| The calendar and the world's events | `table.js`: `ATLAS.calendar({...})`, `ATLAS.events([...])` (section 18) | Christie (what the world does on its own), Doyle (what the players can learn of it) |
| The factions, and people's days | `table.js`: `ATLAS.factions({...})`; on the cast: `home`, `work`, `sched`, `week`, `factions`, `fears`, `believes`, `suspects`, `wrong` (section 19) | Christie (who wants what), the council's political writer where it has one |

`table.js` sits in the campaign folder beside `campaign.js` (`atlas.js init` writes an empty one). Write it after the bible is agreed and the places are registered, so every id it names exists.

## 3. The villains' clocks

The council's "antagonists' plan and its clock" (council.md, section 6), made into something the referee ticks. One clock for each enemy who works while the party investigates; a campaign usually has two or three, a one-shot one.

```js
ATLAS.clocks([
  { id: "green", name: "The green spreads", who: "The thing in the grow beds", segments: 6,
    when: "Each shift the party spends elsewhere, or whenever they make noise in Hydroponics.",
    ticks: ["The irrigation lines carry a faint green film.", "A grow-bed tech reports a rash.", "…"],
    done: "The inner ring is sealed with the party inside." }
]);
```

- `ticks`: one sentence for each step, each a thing that happens in the world the players can notice or hear of (never "the villain gets stronger"). As many ticks as `segments`; four to eight.
- `when`: what makes the referee tick it (time passing, a noise, a clue shown to the wrong person).
- `done`: what happens when it is full: the failed ending, or the worst turn before it.

## 4. The session plan

The campaign split into evenings of play, each beginning strongly and ending on a hook. A campaign's acts usually make two to four sessions each; a one-shot is one.

```js
ATLAS.sessions([
  { n: 1, title: "A missing tech", hours: 3, places: ["docking-bay"],
    start: "The bay door cycles with the party on the floor: ninety seconds, amber lights.",
    cliff: "Ines's badge in the crawl, and drag marks heading for the medical ring." }
]);
```

`start` is a strong start: something happening, not a briefing. `cliff` is where the evening should end. `places` are the places the session is likely to visit (place ids). Every tier 1 and 2 place belongs to some session.

## 5. The players' characters

When the game master gives their players' characters (in the app, `story/pcs.md`; or in the conversation), the council weaves each one into the story: a reason this story is theirs, a secret that the story can uncover, and a clue only they would recognise, placed in one of the places.

```js
ATLAS.pcs({
  sato: { n: "Lena Sato", player: "Mariam", concept: "Station security, two weeks from transfer",
    bg: "Ex-navy; took this posting to be near her sister on Deck 4.",
    hook: "Ines Varga taught Lena's sister to grow tomatoes. Lena owes her.",
    secret: "Lena was on duty the night of the docking and signed the gate log without looking.",
    clue: { t: "Her own signature", at: "docking-bay", d: "On the 03:10 gate log: L. SATO, cleared." },
    places: ["docking-bay"], ties: { okafor: "treated her sister once" },
    stats: { HP: 13, SAN: 60, Luck: 55, MP: 12, DEX: 70 } }
});
```

Keep the game master's own words for who the character is; add only the hook, the secret, the clue, the places that matter to them, and ties to the cast (by cast id). Write the clue into the place too: as one of its clues, or in the room's guide. Without characters, write no `ATLAS.pcs`; the game master can add them later.

## 6. Handouts

Every document the players can hold is a handout: a letter, a diary page, a telegram, a newspaper, a ledger, a notice, a photograph, an email or a phone's messages, a datapad, a scroll. Write its whole text, as the players will read it, in the voice of whoever wrote it. The page draws it as the thing it is, on the paper of its age, and the referee reads it, prints it, or gives it to the players on their screen.

On a clue:

```js
C1: { t: "The patient chart", at: "R2", …, handout: { kind: "datapad", title: "Patient chart: VARGA, I.", date: "2291-04-12 03:40", text: "Admitted 03:40.\n\nDischarge: [no entry]", from: "MEDICAL 9 / RECORDS" } }
```

Or not on any clue: `ATLAS.handouts([{ id: "notice", kind: "notice", title: "…", text: "…", from: "…" }])`.

| `kind` | Fields it uses | Drawn as |
|---|---|---|
| `letter` | `date`, `to`, `text`, `from` | ink on aged paper |
| `diary` | `date`, `text` | a handwritten page on ruled paper |
| `note` | `text`, `from` | a scrawled note |
| `telegram` | `date`, `to`, `from`, `text` | a telegraph form; full stops become STOP |
| `newspaper` | `paper` (the masthead), `date`, `price`, `headline`, `sub`, `text` | a column of newsprint |
| `ledger` | `title`, `text` with one line per row and `|` between columns | a ruled account book |
| `notice` | `title`, `text`, `from` | a posted bill |
| `photo` | `scene` (what is in the picture), `caption` | a faded photograph |
| `email` | `from`, `to`, `title` (subject), `date`, `text` | an email |
| `message` | `title`, `from` (whose phone it is), `text` with one `Name: words` per line | a phone's messages |
| `datapad` | `title`, `date`, `text`, `from` | a screen of the future |
| `scroll` | `title`, `text`, `from` | a rolled parchment with a seal |

Without `kind`, the page chooses by the story's age (a letter; a scroll in a medieval or fantasy story; an email in a modern one; a datapad in the future). `era` on a handout overrides the age for that one. Separate paragraphs with a blank line (`\n\n`). Every clue that is a document should be a handout; a campaign has at least three.

## 7. Rolls and stat blocks: the game's own rules

A clue that must be found by a roll says which, in the system's own words: `roll: "Spot Hidden"`, `roll: "Library Use, Hard"`, `roll: "Investigation DC 15"`, `roll: "Notice, -2"`. An encounter may have one too. The roll is shown beside the clue; a clue that is found without a roll needs none. Never make a roll the only way to a clue the story needs (council.md, the audit): that is what `hint` and `rescue` are for.

People and dangers who may come to a fight, or need the system's numbers, have `stats`, on the person (`npcs`), on the cast, or on an encounter (with `count` for a group):

- **Call of Cthulhu** (and Delta Green, Pulp Cthulhu, other BRP games): `STR CON SIZ DEX INT POW APP EDU`, `HP MP SAN Luck Build DB Move Armour`, `attacks: [{ n: "Knife", pct: 40, dmg: "1D4+DB" }]`, `skills: { "Spot Hidden": 60 }`, `spells: [...]`, `sanloss: "1/1D6"`, `notes`.
- **D&D 5e** and other d20 games: `AC HP Speed STR DEX CON INT WIS CHA`, `saves`, `skills`, `senses`, `languages`, `CR`, `traits: [{ n, d }]`, `actions: [{ n, hit, dmg, d }]`, `reactions`, `notes`.
- **Any other system**: its own fields, written as they are named (`{ Might: 3, Wits: 2, Harm: "2 (knife)" }`), with `attacks` and `notes` if wanted.

The page lays the block out in the system's way; the combat tracker takes HP, SAN, Luck, MP, DEX and AC from it. The players' characters may carry `stats` too.

## 8. Ways back: rescues

The audit's "no bottleneck" made usable at the table. A clue the story needs gets a `rescue`: another way the same truth reaches the party if they miss it (someone comes to them, a second copy turns up, the clock moves and shows it). A `hint` nudges them to find it; a `rescue` brings it to them.

```js
C2: { t: "The cryo log", …, roll: "Computer Use, Hard", rescue: "Petra mentions that pod 4 has been beeping since the crate came in." }
ATLAS.rescues([{ when: "If they never find the crawl", do: "Mouse comes to them …" }, { at: "med-lab", when: "If they cannot get past Okafor", do: "…" }])
```

`ATLAS.rescues` is for ways back that belong to no one clue: `when` the table is stuck like this, `do` this; `at` is the place it belongs to, if any.

## 9. Random tables

Each tier 1 and 2 place has one or two tables of its own: what is overheard there, what is in a drawer, who comes through the door, what the weather does on that hill. Six to ten entries, each specific to the story (a rumour names a person; a drawer holds something with a history).

```js
ATLAS.place("med-lab", { …, tables: { "What the nurse is doing": ["Restocking the dressing trolley, twice", …], "In the doctor's desk": ["A half-written resignation", …] } });
ATLAS.tables({ "Station rumours": ["The doctor has been sleeping in her office.", …] });
```

The page adds everyday tables for the story's age by itself; write only what belongs to this story.

## 10. How hard a place hits: intensity and content

Every tier 1 and 2 place says how hard it hits, 1 to 5 (`1` gentle, `3` tense, `5` brutal), and what it contains that a player might want to know about before the game, in plain words:

```js
ATLAS.place("med-lab", { …, intensity: 3, content: ["medical restraint", "body horror (mild)"] });
```

Name what is there honestly (violence, death, death of a child, torture, body horror, self-harm, suicide, sexual violence, animal harm, racism, insects, drowning, claustrophobia). `content: []` says there is nothing to warn of. The page shows it on the place, and flags it against the lines and veils the table writes at session zero.

## 11. The age and the people

The page reads the story's age from the city's look and the year in `setting`, to dress the handouts and name the people made at the table. Where it cannot tell, say it in `campaign.js`: `era: "victorian" | "1920s" | "medieval" | "fantasy" | "modern" | "future"`, and `people: "english" | "american" | "french" | "german" | "polish" | "italian" | "spanish" | "russian" | "arabic" | "japanese" | "georgian" | "fantasy" | "future"` for whose names they are.

## 12. What `check` asks

`check` reads the table material with everything else. It is a **problem** when an id points nowhere (a session's place, a character's clue's place, a rescue's place), a clock has fewer ticks than segments, a handout has no text or an unknown kind, a table is not a list of words, or an intensity is outside 1 to 5, or an event waits on what is not there, has neither a `when` nor an `after`, or a `when` that cannot be read. It is a **note** (which also stands between the campaign and "all clear") when the campaign has no clock, no session plan, fewer than three handouts, no character woven in while `story/pcs.md` exists, a tier 1 or 2 place with no intensity or no random table, a tier 1 or 2 place none of whose clues names its roll, or no stat block at all though the game has rules, or sessions but no world events.

## 13. Publishing

The first publish declares `capabilities: { db: {}, user: {}, sample: { images: true }, downloads: true, assets: {} }`: the database keeps the tracker and everything at the table and links the players' screen to the referee's page; `sample` lets Ask and Previously on be written by Claude, and the map editor send Claude a floor plan to read into rooms (`images`); `downloads` lets the book and the maps for online tables be saved; `assets` keeps the 3D models the game master brings into the model library. Later publishes leave `capabilities` out. A page published before these existed gets them when it is next published with this full set (it replaces the old one).

## 14. The investigation: clues on the map, connections, who knows what

The user asked for it on 21 Oct 2026: clues placed on the 2D map, joined to the story with Claude's help but never without the game master's say, and a record of what each person knows and how they came to know it. It needs nothing written for it; it reads the campaign as it is.

**Placing clues.** The map editor's **Clues** tool: a click puts a clue down with the next free id, in the room under the pointer (and "on the desk" when a piece of furniture is there). Its marker wears the sign of its kind (physical, document, testimony, digital, something in the place, a suspicious object, a secret, a magical trace, a lead, other). Drag to move it; Duplicate, Delete (or the Delete key, Ctrl+D to copy); a quick form for its name, kind, what the players are told and what only the referee knows; and **Auto-Connect to Story**. "Hide clue markers" in the editor, and "Clue markers" beside each map, take the signs off without touching the clues. The players' maps never show them.

**The Investigation tab** (in *During the game*):

- **Clues**: every clue, filtered by place, kind, how far the players have come (not found, found, looked into, understood, answered; "found" is the same tick as the tracker's), person, mystery or tag. A clue opens to its full form (what the players are told, what only the referee knows, notes, tags), its connections, the chain it starts, who knows of it, and a small web of what it touches. Duplicate, archive, delete (asked twice), undo the last change.
- **Auto-Connect to Story.** The page first finds, in the campaign itself, what could bear on the clue: the same room and place, the people and places it names, words they share, the principals. Those (up to fifty) are given to Claude with codes, and Claude may only connect the clue to them; anything it names that is not one of them is dropped. Each suggestion says how it bears (one of the fifteen kinds of connection), why, what in the campaign it rests on (quoted), how likely, and whether the campaign says so or it is a guess. With it come the people who might know of the clue, what does not fit (a contradiction is a warning to settle, never a change), the questions it raises, and ideas that are not in the campaign (kept apart, made into a story element only if chosen). **Nothing is kept until the game master ticks it and saves**; "Accept all that are likely" saves only the likely ones; a whole accepted batch is undone with one click. A connection the game master made, changed or removed is never touched by a later suggestion, and things already joined are not suggested again. Without Claude (a page opened from a file), the page's own matching suggests, and says so. **Suggest next clues** is separate, and makes clues only when chosen.
- **People**: what each one knows, believes, suspects or wrongly believes, about which clue or thing, how they came by it (saw it, was there, found it, was told and by whom, read it, looked it up, heard it said, worked it out, or "because you say so"), when, how reliable, and what they will do with it (tell anyone, tell if pressed, hide it and maybe lie, never tell). **Nobody knows anything because a clue exists or the players found it**: only what is recorded. "X told Y" passes a thing on as second-hand, from X, and keeps both. **Speak as them** answers a question from the party in that person's voice, from what they know and what the campaign writes of them; what they hide they keep, or lie about as their entry says, and a note for the referee says what they held back.
- **Questions and loose ends**: the questions an investigation leaves open (open, a mystery on purpose, needs writing, answered), and the warnings: a clue joined to nothing, a clue that is the only way to something, two things that contradict, knowledge with no source, people whose accounts of one thing differ, a connection to something that no longer exists.
- **Story elements**: factions, quests, events, mysteries and the like that the campaign speaks of but has no page for, to join to.
- **History**: every change, by whom (the game master, an approved suggestion, the files), with Undo.

**Privacy.** The referee's board shows the saved connections as story string; the players' board, only those pinned up for them. The players' screen shows of a found clue only what the players are told (`pd`), never what only the referee knows, the connections, or anyone's knowledge.

**Where it is kept.** The page's database (collections `cluebook`, `storylinks`, `storyitems`, `storyq`, `knowledge`, `storylog`, `cluestate`), and in the Atlas app also the campaign's `edits/story.js` (`data-format.md`, section 8; `workflow.md`, "Taking in the investigation"). `check` notes a connection or a piece of knowledge that names something which is not there.

## 15. Riddles and traps at the table

The user asked for them on 21 Oct 2026, with the generated caves (`workflow.md`, "Caves, riddles and traps"). Each trap and riddle of a place has its card in the place's guide (**Traps**, **Riddles and puzzles**), for the referee only: everything it is, the answer folded away until asked for, and above it what to do now. A trap: how it stands (armed, found by the players, gone off, disarmed), whether the players' map shows it (a warning sign where it is, its reach hatched), and **Run the chain** (what it sets off, in order; nothing fires twice). A riddle: how it stands (not solved, solved, failed), **Show the players the words** (on their screen as words cut in stone, and in their handouts; never the answer), the hints given one at a time (each can be shown to them too), and what happens if solved or failed. In the map editor, the **Traps** and **Riddles** tools make one where the map is clicked (to suit the cave, or of a chosen preset, kind or difficulty), and edit every part of it: its words, its answer and hints, its trigger, signs, rolls and ways past, its reach, its chains (a link that would make a loop is refused). "New words, same answer" rewrites a riddle; "Make another" replaces one, and asks first when the referee has changed it. All of it is kept with the investigation (collections `trapbook`, `riddlebook`, and their state at the table in `devstate`; in the Atlas app, `edits/story.js`), undoable in its History.

## 16. The copilot: Talk and Improvise

The user asked (27 Oct 2026) for an improvising partner at the table, above all for a person's answer to what a player said that nobody planned. It is a tab of At the table (**Copilot**) and **Talk** in the toolbar at the bottom right (atlas-copilot.js), and needs nothing written for it: it works from what the campaign already has.

- **Talk** takes the investigation's "Speak as them" further (its prompt, `St.speakPrompt`: who they are, and only what they know). The referee chooses a person and types what a player said; the answer comes in their voice, with a line for the referee on what they held back. Each answer can be changed by hand, asked for again ("Another answer") or in a tone (warmer, colder, evasive, suspicious, bargaining, threatening, frightened, shorter, fuller), and the conversation goes on with the turns before it in view. The prompt adds where they are, what has happened at the table lately (tonight's notes, the places known, the clues found, the clocks; they know of it only if they could), what they think of the party (set by the referee) and the conversation so far. They may lie, dodge, bargain, threaten or refuse as their nature calls for. "Show the players" puts their name and words on the players' screen; "Remember this…" keeps, only when the referee says so, what they remember (a knowledge record: seen for themselves) and what they learned from the party (told), and adds it to tonight's notes: from then on every answer of theirs draws on it. Conversations are kept in the table's store (collection `talks`).
- **Improvise**: describe a place, how someone reacts, two people talking, what follows from what the players did, details around them, what could happen next, an encounter now. Each prompt carries the campaign's passages that bear on it (the same search as Ask the campaign), the people named (what they know), and what has happened lately; it never decides for the referee. The result can be changed, asked for again, shown to the players, added to tonight's notes or copied.
- Nothing in the campaign changes unless the referee says so; without Claude, Talk shows what the person would share as recorded, and Improvise what the campaign says.

## 17. Checking the campaign for consistency

The user asked (27 Oct 2026) for the campaign to stay consistent as the story develops. **Consistency** is a tab of At the table (atlas-consistency.js), and it grows from what the investigation already finds (`St.warnings`: loose clues, single ways in, contradictions the referee recorded, differing accounts, knowledge without a source, connections to things gone). It adds what the campaign's data shows for certain: a clue leading to no place or lying in no room, a hidden clue with no way to it, a person or a secret in a room that is not there, someone who told what they are not recorded as knowing, rooms or cave chambers nobody can reach (the cave check for caves), clues found or rooms shown in a place the tracker still marks unknown, handouts from places the party has not heard of, tonight's plan sending them somewhere finished, sessions naming places that do not exist.

Every finding is **Certain**, **Possible** or **Worth a look**, with why, its evidence (each a link to what it names) and how to mend it. The referee can go to it, mend it by the one change offered where there is one (remove a dead connection, say how someone knows a thing, mark a place open), ask Claude for the smallest fix, mark it **intentional** (a lie, a misunderstanding, a mystery on purpose) or dismiss it; a marked finding comes back only if its evidence changes (collection `consist`). Nothing changes without the referee. "Ask Claude to read for contradictions" sends the story, the places, the people, the sessions and tonight's notes; each contradiction it returns is kept only if both sides are quoted from that material word for word, and is listed as possible. The checks run again a moment after the table or the investigation changes. The copilot's Improvise has **Does it fit?**, which answers from the same findings. Later systems add their own checks with `A.consistency.add(name, fn)`.

Write campaigns so they pass it: every clue's `to` a place id, every `at` a room of the map, a way into every room, a way to every hidden clue (a secret door and its secret), and knowledge passed on only from someone who knows it.

## 18. The world's time: the calendar, events, news

The user asked (26 Oct 2026, the master plan, parts 4 and 5) for a world that moves whether or not the party acts, and moves for reasons, not at random: a world clock and calendar; events the game master writes and the council plans, each with its time, its conditions, who and what it involves, its hidden cause, its consequences and what the players may know of it; events that are called off when what they rest on is gone; how much each matters, with the significant ones waiting for the game master's approval; small random happenings only if wanted, and never disasters; a word on the screen for the game master and the players; and the world's news, which may differ from the truth. It is a tab of At the table (**The world's time**) and **Time** in the toolbar, with a count of what waits (atlas-worldtime.js).

**What the council writes**, in `table.js`, after the clocks and sessions (Christie leads, as with the clocks: what the enemies and the world do on their own; Doyle sees that each one changes something the players can find out, and that each has a reason in the story):

```js
ATLAS.calendar({ start: "2291-03-14 06:00" });   // a real date and hour; or the world's own calendar:
// ATLAS.calendar({ start: { day: 1, hour: 8, year: 1203 }, months: [["Frostmoon", 30], ["Thaw", 28]], weekdays: ["Moonday", "Tirsday"], era: "AR" });
ATLAS.events([
  { id: "notice-up", title: "Operations closes Hydroponics 9", when: "day 1 14:00", place: "hydroponics", importance: "major", who: ["Dr. Adaeze Okafor"],
    what: "Okafor has Operations post the maintenance notice; the deck's doors lock.",
    why: "She wants the beds out of sight while she decides whether to burn them; the notice is her cover story.",
    then: "Anyone wanting into Hydroponics now needs her clearance, a forged one, or the crawl.",
    unless: [{ clue: "med-lab/C3" }],
    news: { headline: "Hydroponics 9 closed for maintenance", text: "…", paper: "Station bulletin" } },
  { id: "hale-runs", title: "Hale tries to leave the station", after: [{ clue: "docking-bay/C4" }], unless: [{ event: "quarantine" }], importance: "major",
    what: "Once his ledger is found, the dockmaster books passage out.", outcomes: ["He gets away", "Okafor stops him first", "The party reaches him and he talks"],
    players: "Word on the dock: the dockmaster has booked himself on tonight's freighter." },
  { id: "rash", title: "A grow tech reports a rash", when: "day 2 09:00", importance: "notable", what: "…", tick: ["green", 1] },
  { id: "quarantine", title: "The station AI seals the inner ring", after: [{ clock: ["green", 6] }], importance: "critical", what: "…" },
  { id: "inquiry", title: "The survey office asks after its samples", after: [{ event: "notice-up", hours: 48 }], importance: "background", what: "…" }
]);
```

- `when`: `"day 3 06:00"` (day 1 is the day the story starts), a date and hour like the calendar's start when it is a real date, or `{ day, hour }`. Without `when`, the event waits only on `after`.
- `after`: what must have happened first, all of it: `{ clue: "place/clue id" }` found, `{ visit: place }` the party there (the place open, or a room of it shown), `{ known: place }` the party knowing of it, `{ clock: [id, n] }` a villain's clock at step n, `{ event: id, hours }` another event happened (and so many hours since).
- `unless`: the same kinds of condition; if any has happened when the event comes due (or while it waits for the game master), it is **called off**, with the reason recorded. This is how events stay conditional: the rebels' attack is called off if the party exposed them first.
- `importance`: `background` (a small change, recorded quietly), `notable` (recorded, with a word to the game master), `major` (could change the campaign) or `critical`. By default background and notable events happen by themselves when they come due, and major and critical ones wait for the game master; the game master moves that line ("Wait for me before…": everything, notable and up, major and critical, only critical). (`minor`, the older word, reads as notable.)
- For the game master: `place`, `who` (the people involved), `factions`, `what` (what happens), `why` (the cause, hidden plans and motives: never shown to the players), `then` (what follows), `outcomes` (how it may go). For the players: `players` (a line they hear), or `news: { headline, text, paper }` (a bulletin, a rumour, a broadcast, a paper); it may be incomplete or wrong, since the truth stays in `what` and `why`.
- `tick: [clock, n]`: when it happens it moves a villain's clock on (undoing it moves it back).
- Six to twelve events for a campaign, three or four for a one-shot: some on dates (the world's routine, the enemy's timetable), some on what the party does (the enemy's answer to being found out), each with a reason the campaign gives and, where it makes sense, an `unless`. Each changes something the players can notice or hear of. Nothing random and nothing catastrophic without a cause in the story.

**At the table.** The tab shows the date and hour, with buttons to move time on (+10 minutes to +1 week, any number of minutes, hours, days or weeks, and Undo), and **Pause the world** (time stands still and nothing comes due). Then: what waits for the game master, critical first, each with everything about it (what, who, factions, because, why, what follows, how it may go, what calls it off, what the players hear) and **It happens** (telling the players if it has something for them), **Quietly**, **Change it first**, **An hour later**, **Tomorrow**, **Not at all**; what is coming, with its hour, and what waits on something happening, each with **change**; **Plan an event**, a form for all of an event's parts (its conditions chosen from the campaign's own clues, places, clocks and events); **Ask the council**, where the game master may say what to think about and Claude, as the story council, suggests two to five events from the campaign's own words (each condition must name what is in the campaign, or it is dropped; each says the passage it grows from, and is marked "From the campaign" when that passage is really there, "A new idea" when not), added only with **Add it** or **Change it, then add**; and **What has happened**, with what happened by itself, what was called off and why, **tell the players** for what they were not told, and **undo** (an event undone that is still due comes back to wait for the game master). Beside it: the world's news, with news of the game master's own; **Small happenings** (off unless ticked; when half a day or more passes, a roll on one of the campaign's random tables, rarely, sometimes or often; always small and local); and **The calendar**, to set the start, or the world's own year, era, months and weekdays, over the council's. The events the game master writes or changes are kept in the page (collection `eventdefs`), over the council's; a changed one can go back to the council's, a removed one can be brought back.

**The players** see the world's date in a corner of their screen, and a **News** tab with all they have been told, newest first; news that comes while they are elsewhere shows a word on the screen and a count on the tab. Their copy and their phones get the date in words and the news, never the events, their causes or what is planned.

**Where it is kept**: collections `clock` (`now`: minutes since the start, and the date in words; `opts`: who must approve, paused, small happenings; `cal`: the game master's calendar), `events` (each event's state: pending, done, later, dismissed, off, with what it moved and told), `eventdefs` (the game master's own and changed events), `news`. The copilot is told the date and what has happened lately; the consistency check finds an event that waits on, or is called off by, a place, clue, clock or event that is not there, a `when` that cannot be read, an event set before the story begins, or events that wait on each other in a circle. `check` asks the same of `table.js` (section 12), and notes a campaign with sessions but no events.

## 19. Factions and people's lives

The user asked (26 Oct 2026, the master plan, parts 6 and 7) for factions that act from what they actually have, whose standing changes through events and the party's deeds, and for important people with a home, a workplace, a day and a week, factions, fears, beliefs and suspicions, who move as the world's time moves. It is a tab of At the table, **Factions and people** (atlas-factions.js). What people know stays the investigation's (section 14): knowledge with its source, reliability and when, never more than they could know.

**What the council writes.** The factions, in `table.js` (Christie leads: who wants what and what they will do for it; Martin, Herbert or le Carré where they sit):

```js
ATLAS.factions({
  medical: { n: "Medical Nine", kind: "the medical ring", leader: "okafor", members: ["okafor", "Nurse Petra Lindqvist"], hq: "med-lab", territory: ["med-lab"],
    has: { money: 2, people: 2, arms: 0, influence: 3, knowledge: 5 }, lacks: "Anyone she can trust with the truth.",
    wants: "To contain the breach before anyone learns there was one.", clock: "okafor",
    plan: ["Close Hydroponics 9", "Wipe the cryo log", "Move Ines to the pods", "Blame Ines"], step: 0, doing: "Keeping the beds sealed.",
    rels: { security: ["wary", "Security could open any door she closes"], dock: "friendly" }, party: "wary",
    knows: "Everything about the crate.", wrong: "That the spores die in vacuum.", inner: "Petra suspects, and is afraid to ask.", rep: "Efficient, cold.", past: "…" }
});
```

- `has`: what it has to act with, each 0 (none) to 5 (as much as any power in the story): money, people, arms, influence, knowledge. A faction does nothing it has not the means for; `lacks` says what it is short of.
- `plan`: its steps in order, `step` the one it is on, `doing` what it is doing now; `clock` ties it to a villain's clock when it has one.
- `rels`: how it stands toward each other faction: `war`, `hostile`, `wary`, `neutral`, `friendly`, `allied`, with why (`["wary", "why"]`); `party`: how it stands toward the party.
- For the referee only: `knows` (its intelligence), `wrong` (what it believes wrongly: misinformation), `inner` (its own quarrels), `rep` (how others see it), `past` (its history).
- `leader` and `members`: a cast id, or a name written in full.

People's lives, on the cast (`campaign.js`), for every important person:

```js
okafor: { …, home: "med-lab", work: "med-lab", factions: ["medical"],
  sched: [["06-08", "hydroponics", "checking the beds before anyone is in"], ["08-20", "med-lab", "in her office"], ["20-06", "med-lab", "asleep in her office"]],
  week: { Sunday: [["06-09", "docking-bay", "with Hale, over the bay records"], ["09-20", "med-lab", "in her office"], ["20-06", "med-lab", "asleep"]] },
  fears: "…", believes: "…", suspects: "…", wrong: "what they have wrong, and believe", rep: "their reputation" }
```

- `sched`: their usual day, hour ranges with a place and what they do there (`"20-06"` runs past midnight); `week`: the days that differ, by the calendar's weekday names, each a whole day. Outside any range they are at `home` at night and at `work` by day.
- `fears`, `believes`, `suspects`, `wrong` (a misunderstanding, held as true), `rep`: the copilot speaks from them.

**What events change** (section 18): an event's `effects`, done when it happens and undone with it: `{ faction, rel: [other, stance] }` (both ways), `{ faction, party: stance }`, `{ faction, step: 1 }`, `{ faction, has: { arms: -1 } }`, `{ faction, gains: place }` and `{ faction, loses: place }`, `{ person, at: place, doing, hours }` (they go there, for so many hours or until moved back), `{ person, status: "missing" }` (missing, hiding, arrested, hurt, gone, dead, or "" for as usual), `{ person, joins: faction }`, `{ person, leaves: faction }`, `{ person, learns: "what", how: "rumour" }` (a knowledge record of the investigation, with the event as its source). The referee adds and changes them in the event form under Time.

**At the table.** Each faction's card: its leader and members, seat and holdings, what it has (raised or lowered with a click), what it lacks and wants, its plan with the step it is on (on and back), what it is doing, how it stands toward each other faction and the party (changed with a choice; both ways), and folded, what only the referee knows and every change since, dated in the world's time. Beside them, the web of how they stand, and **the people, now**: where each is at this hour of the world's time, by their day and week or where they were moved, with how they are (missing, hurt, dead…) and **move them**. The copilot is told where someone is now, their factions, and what they fear, believe and suspect; the investigation can join a clue or a person to a faction. **Where it is kept**: collections `factions` (what has changed of each, with its log) and `npcstate` (where each was moved, how they are, the factions joined or left). The consistency check finds a faction holding or naming what is not there, two factions that see each other very differently (mark it intentional if it is a deception), a person's day naming a place that is not there or putting them in two places at once, and a person in a faction that does not exist; `check` asks the same of the files, and notes a living world with no factions.

## 20. The players' journal

The user asked (26 Oct 2026, the master plan, part 9) for a journal for the players under the game master's complete control: some tables want to solve a mystery with no help at all, so every kind of help can be switched off. It needs nothing written for it. A card on **The players' screen** tab (atlas-journal.js) sets it, and both the players' window and what their copy is sent obey it (atlas-table.js, atlas-share.js): what is switched off is not sent to the copy at all.

- **Manual**: their own notes only. No clues recorded for them, no people, places or connections, no hints or summaries.
- **Assisted** (the default, as the players' window always was): what they have actually found, as they found it: the clues found (their titles and what they were told), the places they know, the people whose faces were shown to them, and the connections the referee pinned up. Nothing is solved for them.
- **Full**: all of that, and their quests, hints and next steps, "Previously on", and a timeline of what has happened (news, handouts, people met, recaps, hints, in order).
- **Each part on its own**: the clues they found, the places they know, the people they met, the connections pinned up, their quests, hints, next steps, "Previously on", their own notes. A mix that is not one of the three modes is the referee's own.

What fills it beyond what they found is what the referee gives, from the card: a quest (and when it is done), a hint or a next step, "Previously on…" from Tonight. The people they met are kept when the referee shows someone's face on their screen: the name, the plain part of the role (never what follows a semicolon or a dash) and the look the screen showed. Their notes may be a note, a theory or a question; a theory is never marked right or wrong. Nothing undiscovered, no secret, no faction's plan, no event the referee has not let happen, and none of the referee's notes is ever in it.

**Where it is kept**: collections `jcfg` (the settings), `pquests`, `hints`, `recaps`, `met`, and `journal` (their notes, with `kind` "theory" or "question"). On the players' phones (the app), these are read with the rest of what the players' window reads.
