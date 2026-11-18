# Importing an adventure the game master owns

This file is for the case where the game master gives a published or written adventure (a PDF, text or Markdown,
whole or in parts) and wants it **run as written**, not reinvented. Examples are a published campaign book, a
scenario, or their own long notes. The design comes from the user's request of 18 Nov 2026
(docs/requests/2026-11-18-campaign-import.md) and the plan they approved
(docs/plans/2026-11-18-campaign-import-plan.md).

**The rules that matter most**

- **Only the game master's own copy, for their own table.** `import` needs `--i-own-this`. The source stays in
  `story/source/`. Never fetch an adventure from the web, never rebuild a missing chapter from summaries or memory, and
  never publish the source or quote it at length outside the game master's own private page. If pages are missing or
  unreadable, say so in the report and ask for them.
- **Faithful.** The council does not sit to reinvent anything. Keep the book's people, places, numbering of keyed
  areas, encounters, treasure and where it lies, its random tables and its special mechanics.
  - Add only what play needs and the book leaves out, such as a hint for a clue that could be missed, or a look for a
    person the book never describes.
  - Mark every addition `added: true`, so the report lists it for review.
- **Every fact has a `ref`**, saying where in the book it is: `"p. 43"`, `"Ch. 4, K20"`, `"App. C"`. The game master
  must be able to check anything against the book.

## The steps

```
node atlas.js init <dir> --title "…" --genre fantasy --system "Dungeons & Dragons 5e" --kind sandbox
node atlas.js import <dir> <book.pdf> [<part2.pdf> …] --i-own-this [--chunk 14000]
  (read every chunk, one at a time, into story/extract/<chunk>.json; after each:)
node atlas.js import-mark <dir> <chunk>          # checks it, marks it read
node atlas.js import-status <dir>                # what is left
node atlas.js adventure <dir>                    # merges into story/adventure.json; links and coverage
node atlas.js from-adventure <dir>               # writes imported.js, places/<id>.js, adventure.js
  (draw each place's map from the book's keyed areas: playbook, step 5, with the areas' ids as room ids)
node atlas.js ready <dir>                        # the readiness check and the completion report
node atlas.js build <dir>
```

### 1. Read the source

`import` takes the files in order. Several parts are joined page after page, which is how a book too big to give in
one piece is given.
- **A PDF** is read with `pdftotext` where it is installed, otherwise with pdf.js. A page with no text (a scan) is
  listed as unreadable.
- **Text and Markdown** keep their own page marks (`<!-- page 12 -->`, `[p. 12]`).

`<!-- page N -->` counts the pages of the files as given, so a second part goes on from where the first ended. In a
`ref`, cite the book's own printed page number where the page shows one. Atlas's count is only for finding the page in
`text.md`.

The text is in `story/source/text.md`, and the chunks are in `story/source/chunks/NNN.md`. Each chunk is whole pages,
cut at a chapter where one is near. A local model gets smaller chunks (`--chunk 6000`).

### 2. Read each chunk into an extract

For each chunk, write `story/extract/NNN.json`: everything of the campaign that the chunk holds, in the knowledge base's
own sections. Read the whole chunk.
- A chunk that is only art, credits or rules already known still gets an extract with `"notes": "…"` saying so, so
  nothing is skipped in silence.
- `import-mark` refuses an extract with an unknown section, an entry with no name, or an entry with no `ref`.
- A person or place met in several chunks is written in each with the same `id` (lowercase, hyphens), and the merge
  joins them.

Each section is a list, and every entry has `id`, `name` (or `title`) and `ref`. These are the fields Atlas reads; add
others freely.

| Section | Fields |
|---|---|
| `chapters` | `name`, `summary`, `ref` |
| `places` | `name`, `kind` (village, castle, ruin, tower…), `parent` or `region` (another place's id), `desc` (what the players see), `gm` (what only the game master knows), `areas: [{ id: "K20", name, desc, gm, ref }]`, `links: [{ to, how }]`, `tier`, `ref` |
| `people` | `name`, `role`, `look`, `manner`, `voice`, `bg`, `want`, `secret`, `knows: [{ text, about, ref }]` (only what they plausibly know), `at` (a place id), `faction`, `ties: [{ who, how }]`, `stats` (a book reference such as "MM p. 297", or the block), `triggers`, `reactions`, `important`, `ref` |
| `factions` | `name`, `kind`, `leader`, `hq`, `territory`, `wants`, `plan`, `rels`, `ref` |
| `quests` | `name`, `giver`, `place`, `goal`, `steps`, `reward`, `optional`, `needs` (ids of what it depends on), `clock`, `ref` |
| `encounters` | `name`, `place`, `area`, `kind` (combat, social, exploration, trap, puzzle), `participants: [{ name, count, stats }]`, `conditions`, `terrain`, `positions`, `outcomes`, `rewards`, `consequences`, `ref` |
| `monsters` | `name`, `stats` (a book reference, or the block if the adventure prints it), `ref` |
| `items` | `name`, `cat`, `rarity`, `place`, `area`, `holder`, `desc` (what the players see), `gm` (its secret), `stats`, `unique`, `story` (a story item), `mechanic` (the mechanic that places it), `handout` (the text the players may read), `ref` |
| `clues` | `text`, `place`, `area`, `points` (place ids), `about`, `ref` |
| `tables` | `name`, `roll` ("d12"), `rows: [{ range, text }]`, `ref` |
| `events` | `title`, `when`, `place`, `what`, `why`, `trigger`, `ref` |
| `choices` and `endings` | `name`, `text`, `outcomes`, `ref` |
| `traps` and `puzzles` | `name`, `place`, `area`, `text`, `solution`, `ref` |
| `rules` | `name`, `text` (a short note of a rule the adventure adds, in Atlas's words, with its `ref`; never the rulebook's text) |
| `mechanics` | The adventure's special systems: a reading, a draw, a roll that sets the campaign up. See below. |

Also, once in any chunk:
- `"start": { "place": "<id>", "hook": "…", "level": 1, "ref": "…" }`
- `"setting": "…"`
- `"title"`
- `"system"`

### 3. Special mechanics

A mechanic is described as data, from the book, so that any adventure's own system fits: a card reading, a roll on a
table that decides where things are, a choice at the start. Atlas carries no adventure's tables. The cards and what they
mean come from the game master's book, through the extract.

```json
{ "id": "the-reading", "name": "The card reading", "kind": "draw", "when": "setup", "ref": "Ch. 1, p. 11",
  "deck": [{ "card": "The Seer", "text": "…" }, { "card": "The Hangman", "text": "…" }],
  "slots": [
    { "id": "lantern", "name": "Where the lantern lies", "sets": "item:the-lantern",
      "options": [{ "card": "The Seer", "value": "place:old-chapel/K4", "text": "In the chapel's crypt…" }, … ] },
    { "id": "ally", "name": "Who will help", "sets": "person:", "options": [{ "card": "…", "value": "person:mara", "text": "…" }] } ] }
```

- `kind` is one of:
  - `draw` (each slot draws one card, no card twice);
  - `roll` (each slot rolls on its options: `"roll": "d8"`, with options having `range`);
  - `choose` (the game master picks).
- `sets` says what the result decides:
  - `item:<id>`, where that item lies;
  - `person:<id>` or `person:`, who;
  - `place:<id>`, where;
  - `quest:<id>`;
  - `text:`, only words.

On the page, At the table's Start here shows the mechanic. The game master draws or rolls it once, or chooses or
enters the book's own reading as played at the table. The results are then **locked**: they cannot change by accident,
and redrawing asks first. They are applied everywhere at once:
- the item's place in the item store;
- the person's knowledge and hooks;
- the place's hooks;
- the Copilot's facts.

### 4. Merge and check: `adventure`

`adventure` joins the extracts and writes `story/adventure.json`:
- the same `id`, or the same name, is one entry, with every `ref` kept;
- `coverage` records the chunks read, those not read, those said to be empty, and the unreadable pages;
- `check` lists every link pointing at nothing, and any unique item that appears twice.

Fix the extracts and run it again until the links resolve.

### 5. Write the campaign: `from-adventure`

`from-adventure` writes:
- **`imported.js`:** the cast, factions, events, tables, handouts and clocks, each with `src: { ref, added }`;
- **`places/<id>.js`:** each place (name, tier, tagline, category, region, hooks from its encounters and quests), with
  `imp`: its description, its keyed areas, and who, what and which clues are there;
- **`adventure.js`:** the whole knowledge base, for the page.

It keeps `story/import-baseline.json`, a copy of what it wrote. A file the game master has changed since is never
written over again (`--force` to replace it with the adventure's version), and the baseline lets the page compare and
revert.

Then draw each place's map in the usual way (playbook, step 5), keeping the book's own numbering:
- **room ids:** the keyed areas' ids (`K20` becomes a room `K20`);
- **each room's guide:** the area's `desc` and `gm`;
- **people, clues, encounters, traps and treasure:** each in its area.

Where the game master gives the book's map as an image, trace it (`references/world.md`, a drawn map; for a building,
the room layout from the image). Where there is none, draw it from the text and say in the place's `src` that the
layout is Atlas's interpretation (`src.layout: "atlas"`).

Items go into the item store as the book places them. A unique artifact appears once, where the book or its mechanic
puts it, and is never placed at random.

### 6. Readiness: `ready`

`ready` checks:
- the source is read, every chunk, with the unreadable pages named;
- where it starts;
- places, written and mapped;
- the important people, with a look and what they want;
- the encounters' statistics;
- the story items placed;
- the mechanics;
- the links;
- the opening session (where it opens, and who is there);
- that no secret is in what the players are given.

Each check is **Ready to play**, **Needs review** or **Incomplete**. The whole is Incomplete while any check is. It
writes `story/report.md` (the completion report, with what was made and Atlas's additions to review) and `ready.js`
for the page, where Start here shows it and enables **Start the campaign** only when nothing is Incomplete. **Never
call the campaign ready when something critical is missing.**

### 7. Report to the game master

Report:
- what was read, and what was not;
- what was made;
- what is Atlas's own;
- the readiness state, with what to do next for each check that is not ready.
