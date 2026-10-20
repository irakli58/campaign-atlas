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
| Players' screen | What the players see now, and what to show them: the title, the world map (players' view), their board, the lines and veils, a dark screen, words to read, a face (a person's name, trade and look, never their secrets), a handout, or a place's map **room by room** (fog of war: a room appears when the referee clicks it open). |
| Clocks | The villains' clocks, ticked by the referee; each tick says what has just changed in the world. **They're stuck**: ways to bring the story back to the party, from what is still open (a hint or rescue for a clue not yet found, someone who knows the way coming to them, a place with only one way in, a clock to move). |
| Combat | Initiative (in Call of Cthulhu, DEX order), wounds, and in Call of Cthulhu Sanity, Luck and Magic Points, with a Sanity roll; whoever joins from the party, the cast with numbers, or the dangers at the chosen place. Dice, and a d100 against a skill read as Call of Cthulhu reads it (regular, hard, extreme, fumble). |
| Make it up | **A person, now**: a name of the story's people and age, a trade, a look, a manner, what they want and hide. **A place, now**: a small mapped place (an inn, a shop, a house, a warehouse, an office, a church, a cave) dressed for the age, with someone in it and something to find that points where the party needs to go. Random tables: the campaign's, and everyday ones for the age (weather, the street, a complication, what is in a pocket). |
| The board | A corkboard of every person, place and clue, with red string for leads, black for who knows whom, grey for where things are. Cards can be moved. The players' own board, on their screen, holds only the clues they have found, the places they know of, and whatever the referee pins up. |
| The party | The players' characters, and the players' notes (they write them on their screen; the referee can read and add to them). |
| Safety | Session zero: lines (not in the game) and veils (only off screen); the places that touch them are flagged. The X-card: a Stop button on the players' screen raises a banner on the referee's page. How hard each place hits. |
| Ask | Ask the campaign anything; it answers from the bible, the places, the people and the clues. On claude.ai Claude writes the answer from the passages (the `sample` capability); in the Atlas app the game master's own Claude Code does; anywhere else the passages themselves are shown, best first. |
| Print and export | The whole campaign as a printed book (the story, every place with its maps and guide, the people, the characters, the sessions, the clocks, the handouts each on its own page), saved as a file to print from a browser. A place's maps for online tables: a zip with each floor as a Universal VTT file (`.dd2vtt`, walls and doors in it, for Foundry's Universal Battlemap Importer) and as a plain picture (Roll20, Owlbear Rodeo). |

Each place's dossier also shows its intensity and content, its random tables, the players' characters' clues there, a button to show its map on the players' screen, and one to export it for online tables; each clue shows its roll, and its handout to read or give. A **table-side view** makes everything bigger to touch, with the tabs along the bottom of the screen.

**The players' window** (the user asked, 21 Oct 2026, for a separate window holding only what the players have) is the page opened a second time with `#players`: the referee's "Open the players' screen" opens it in a window of its own, to drag onto a television; on another computer, "Make this window the players' screen" turns that window into it. Nothing of the referee's is on it, and a window opened for the players has no way back to the referee's page. Its menu along the bottom (fading on The table until the mouse moves):

- **The table**: what the referee sends, and only that. When something new arrives while a player is on another page, a prompt offers to look.
- **Handouts**: every handout the referee has given them, newest first, to read again (a count shows the new ones).
- **Our board**: their corkboard of what they have found.
- **Places**: the places they know of, the first impressions, what they found there, and the maps with only the rooms they have seen.
- **Our notes**: the notes the party keeps, which the referee can read and add to.
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

`check` reads the table material with everything else. It is a **problem** when an id points nowhere (a session's place, a character's clue's place, a rescue's place), a clock has fewer ticks than segments, a handout has no text or an unknown kind, a table is not a list of words, or an intensity is outside 1 to 5. It is a **note** (which also stands between the campaign and "all clear") when the campaign has no clock, no session plan, fewer than three handouts, no character woven in while `story/pcs.md` exists, a tier 1 or 2 place with no intensity or no random table, a tier 1 or 2 place none of whose clues names its roll, or no stat block at all though the game has rules.

## 13. Publishing

The first publish declares `capabilities: { db: {}, user: {}, sample: {}, downloads: true }`: the database keeps the tracker and everything at the table and links the players' screen to the referee's page; `sample` lets Ask and Previously on be written by Claude; `downloads` lets the book and the maps for online tables be saved. Later publishes leave `capabilities` out. A page published before these existed gets them when it is next published with this full set (it replaces the old one).
