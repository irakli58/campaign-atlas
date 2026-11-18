# Campaign import and plug-and-play adventures: audit and proposed design (18 Nov 2026)

This covers the request docs/requests/2026-11-18-campaign-import.md (20 sections). Phase 1, the audit, is done. The
design below is a proposal: the request says "Request approval before major architectural changes", so nothing in
it is built until the user approves.

## Phase 1: what Atlas already has

| Need | What exists | Where |
|---|---|---|
| A story becomes a campaign | The skill pipeline: the writers' council, canon and cast, places on a tier standard, the clue trail, the table, the build, `check`. A workspace job runs it with Claude Code (or Codex) on `story/source.md`, with the game master's choices in `story/brief.md`: how much may change (1 Stay true to 5 Free rein), the length, the system, the world and the buildings. | SKILL.md, references/playbook.md, lib/jobs.js, lib/run-claude.js |
| A source file | Pasted text only. There is no PDF or file intake. | ui/app.js, server.js |
| The ruleset | `system` in campaign.js. Items now follow it (atlas-items-rules.js); stat blocks are written by the skill. | |
| World and maps | The world generator (tectonics, rivers, roads), invented cities, a drawn map traced, handmade worlds, Connect Cities, place maps by tier, the quick place from a description. | scripts/world-*.js, atlas-world.js, atlas-quickplace.js |
| NPCs and what they know | `ATLAS.cast`, place people, `St.knowledge` (who knows what, how, and whether they share it). Talk answers only from what a person knows. | atlas-story.js, atlas-copilot.js |
| Factions, events, clocks, consequences | factionsData, eventsData, clocks, deeds, history | table.js, atlas-factions.js, atlas-deeds.js |
| Encounters, traps, puzzles | Place `enc` (hooks and encounters), trapbook, riddlebook, stat blocks | |
| Items and loot | The new item store and generators, with the game's own items | atlas-items.js |
| The Copilot | Talk and Improvise, grounded in the campaign's passages (`lookupBest`, with local embeddings), what the table remembers, and the consistency check. Never changes the campaign by itself. | atlas-copilot.js, atlas-table-gm.js |
| Dependencies and consistency | `St.linksOf`, `St.chain`, `St.revealedBy`, the consistency check, the clue trail check | atlas-story.js, atlas-consistency.js, scripts/atlas.js check |
| Editing and versions | Every editor writes over the files into the page's store, logged and undoable. Map versions. Handmade campaigns keep "what is written on the page". | atlas-ux.js, handmade.md |
| Local AI | Ollama models (3B to 70B) for answers and embeddings. They are not yet used for whole-campaign writing. | lib/ai-local.js |
| A dashboard | The world at a glance, At the table's Start here and its checklist, Tonight | atlas-dashboard.js, atlas-nav.js |

**Conclusion:** most of what an import needs exists. What is missing is:
- the **intake** of a file (a PDF, a text or Markdown file, a structured file);
- a **faithful** mode, where the adventure is converted and not reinvented by the council;
- **source references** on everything imported;
- a structured **adventure knowledge base** extracted in chunks;
- **adventure mechanics** that are set up once and stay fixed (the Tarokka reading is one);
- a **baseline** to compare and revert to;
- a **readiness check and completion report**;
- the Copilot telling **the adventure's facts apart from its suggestions**.

## The proposed design (for approval)

1. **Import an adventure**, a new choice in the workspace's New campaign.
   - **What it takes:** a file (PDF, .txt, .md or .json), or pasted text, and the ruleset.
   - **A confirmation:** that the game master owns the material and it is for their own table.
   - **Where the source goes:** it stays in the campaign folder on their computer (`story/source/`). It is never
     published or bundled: the built page holds the campaign Atlas made from it, published privately, or not at all
     if the game master prefers.
   - **PDF text:** read with pdf.js (`pdfjs-dist`, Apache 2.0), a new dependency. Scanned pages without text are
     reported as unreadable, never guessed.
2. **"Convert faithfully"**, a level 0 under how much may change. The council does not reinvent anything; it closes only
   holes the game master approves. Everything Atlas adds is marked `src: { added: true }`.
3. **Extraction in chunks**, a new skill step (references/import.md).
   - **The output** is a knowledge base in one shared format, `story/adventure.json`. It covers the setting, chapters
     and arcs, the start, locations (with their keyed areas), NPCs, factions, quests, encounters (with participants,
     conditions, outcomes and rewards), monsters (by name and book reference), items and their places, clues, secrets,
     roleplaying notes, random tables, traps and puzzles, choices, outcomes and endings.
   - **Every fact carries `ref`**: chapter, section or keyed area, and page.
   - **How it runs:**
     - each chunk's results are kept as it goes, so an import can stop and carry on;
     - after the last chunk, a cross-chapter pass merges duplicates and checks the links;
     - a coverage report lists the sections read, the sections with nothing extracted, and the unreadable pages.
   - **Local or cloud:**
     - the same steps run with Claude or a local model;
     - a local model gets smaller chunks;
     - Atlas says plainly when a model is too small to process the whole adventure reliably.
4. **Building from the knowledge base** uses the existing systems:
   - places, keyed rooms and their maps, with the adventure's own maps traced when the game master gives them,
     otherwise drawn by Atlas and marked as an interpretation;
   - the cast, their knowledge, factions, events, clocks, encounters, traps and riddles;
   - items through the item store (unique artifacts placed where the book puts them, never duplicated);
   - the world map: a handmade world laid out from the book's geography, with Connect Cities for the roads.
5. **Adventure mechanics**, a general table.js `ATLAS.mechanics`: a setup drawn or rolled once whose results feed
   places, items, people's knowledge and quests.
   - **How it is described:** as data, from the game master's own book (the cards or rolls, and what each sets). Atlas
     ships no adventure's tables.
   - **How it is kept:** the results are stored and locked, so nothing changes during play unless the game master
     redraws it.
   - **The Tarokka reading** is the first one.
6. **A baseline**: the import keeps what it made (`story/import-baseline.json`). For anything imported, the page can
   show what has changed since the import, and "revert to the adventure's version". Nothing written by the game master
   is overwritten without asking.
7. **Consequences of a change**: removing a person, a place or an item lists what depends on it (quests, encounters,
   clues, knowledge and mechanics' results) from `St.linksOf` and the knowledge base. Fixes are offered and never
   applied by themselves.
8. **The readiness check and completion report**: `atlas.js ready <campaign>` and a page panel. They check:
   - places, people and stat blocks;
   - items placed;
   - mechanics set up;
   - triggers joined;
   - an opening session that can be played;
   - nothing secret on the players' side.

   The report counts what was made, chapter by chapter, and marks each as Ready to play, Needs review or Incomplete,
   with links to the editors. It never says ready when something critical is missing.
9. **The Copilot**: the knowledge base joins its passages. Answers mark "The adventure says" (with the reference)
   apart from "A suggestion"; when the book is silent the Copilot says so, then offers an improvisation.
10. **The dashboard**: At the table's Start here gains the adventure's state (where they start, current objectives, the
    people and encounters here, the mechanics' results, open quests) and a **Start the campaign** button that is only
    enabled once the readiness check passes.

## What is needed from the user

- **Approval of this design**, or changes to it, as the request asks. It adds a dependency (pdf.js), a new skill step,
  a mode in the workspace, and new collections and files.
- **The Curse of Strahd source**: the user's own copy of the adventure (a PDF or text they are entitled to use), put in
  the workspace. Atlas will not scrape it, buy it, or rebuild it from summaries; without it, the end-to-end test cannot
  be done. D&D Beyond's books cannot be downloaded from here, and a purchase there is not permission to copy them out.
- **Where it runs**: the extraction and the build need the user's computer (the workspace app with Claude Code, or a
  local model large enough). From this cloud session, the importer can be built and tested on material that is free to
  use (an original test adventure written for the purpose), but not on Curse of Strahd until the source is provided.
