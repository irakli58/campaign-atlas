# Campaign Atlas

**Paste a story. Play a campaign.**

Campaign Atlas turns a story (a plot, a scenario, a page of notes) into a complete tabletop campaign you can run at the table:

- **The story, filled out.** A council of four writers (Arthur Conan Doyle, Agatha Christie, Edgar Allan Poe and H. P. Lovecraft) debates your story, closes its holes, and adds people with motives and secrets, clues, places, acts and endings. J. R. R. Tolkien then judges their work chapter by chapter, strictly; they mend whatever he fails; and the story is finished only when all five agree. What you say must not change, doesn't.
- **Every place mapped.** Floor-by-floor maps on a square grid, a players' copy and a game master's copy, with every room described: what is there, who is there, what can be found and where each clue leads. The important places are big (thirty rooms and more).
- **The whole world in 3D.** A real city is drawn from its real streets, river and landmarks, in the buildings of your story's age; an invented city or a camp is laid out for its time and place.
- **Music for every place.** Each place plays its own theme, made by the page itself, with suggested songs for its key moments, your own songs, and a music maker with rain, thunder and heartbeats.
- **A read-aloud narrator**, an investigation tracker for your table, and a player-safe view.
- **Maps exactly as you want them.** Say what a place should be ("a mansion of four floors and sixty rooms, a hidden chapel under the east wing"), give your own floor plan or sketch, or redraw any map yourself in its editor: rooms, doors, stairs, floors, size. The editor can also lay a picture over the grid to trace, or let your Claude read it into rooms.
- **Furnish any room from a library of 3D models.** Over seven hundred models for every kind of story, built into Atlas: furniture, castles and taverns, magic, starships and stations, neon streets, offices and police stations, barracks and wire, wastelands, factories, forests and caves, walls, doors and stairs, graveyards and asylums. Search in plain words ("rusty barrel"), filter by genre, material and condition, turn each one in a 3D preview, and change its condition, material, colour and size. Put down a whole tavern, laboratory or spaceship bridge at once with one of fifteen kits. Move, turn, stack, copy and hide them, see the room in 3D, and bring in your own models (.glb files).
- **Everything for game night.** A players' screen for a second window or a TV (maps revealed room by room, handouts drawn as the letters, telegrams and newspapers they are, faces, the world map, a corkboard of what the players know, their own notes, and a Stop button); the villains' clocks; tonight's session sheet and a read-aloud "Previously on…"; a "They're stuck" button; combat with wounds and sanity; dice; a person or a small mapped place made up on the spot; random tables; safety tools; "Ask the campaign" (answered by your own Claude); the whole campaign as a printable book; and maps with walls and doors for Foundry, Roll20 and other online tables. Give your players' characters with the story and the council weaves each one in.

Everything ends up as one page that opens in your browser.

## What you need

- **A computer** with Windows 10 or newer, macOS 13 or newer, or Linux.
- **Node.js**, free from [nodejs.org](https://nodejs.org/) (the version marked LTS). The start file sends you there if it is missing.
- **An AI to do the writing.** Any one of these:
  - **A Claude Pro or Max subscription**, with **Claude Code** on your computer. This is the usual way, and costs nothing beyond your subscription. The app shows you how to install Claude Code if it is missing.
  - **A ChatGPT Plus or Pro subscription**, with **Codex** on your computer.
  - **An API key** from Claude or OpenAI, if you have no subscription. You then pay per use; the app shows a rough cost and stops at a spending cap you set.

## Start it

1. Download this folder: on GitHub, press **Code**, then **Download ZIP**, and unzip it somewhere you'll find it again.
2. Double-click the start file:
   - Windows: `start-windows.bat`
   - Mac: `start-mac.command` (the first time, right-click it and choose **Open**)
   - Linux: run `./start-linux.sh`
3. Your browser opens Campaign Atlas. Keep the small window that opened with it; closing that window stops the app.

## Make a campaign

1. **Who does the work:** choose Claude or ChatGPT (your subscription), or open *Pay per use* for an API key.
2. **Your story:** a title, and the story pasted in or opened from a `.txt` or `.md` file.
3. **Your choices:** how big (a one-shot, a campaign or an epic), the game system, what must not change, and, if you know them, your players' characters.
4. Press **Make my campaign**.

With a subscription, your own Claude Code (or Codex) opens in a window of its own with the request already typed, and does the work there. The first time, it asks whether to trust the folder: say yes. The app follows along: the council's progress, Tolkien's grades, each place as it is mapped. A full campaign is a lot of writing and takes a while, from about an hour for a one-shot to many hours for an epic. If your plan's usage limit stops it partway, press **Carry on** once the limit resets: it picks up from what is already written, and nothing is lost.

When it's done, press **Open the campaign**. **Download the page** saves it as a single file you can keep, copy or open anywhere.

## Or use it straight from Claude Code

If you already use Claude Code, you can skip the app and add Atlas to Claude Code as a plugin. In Claude Code, type these two lines:

```
/plugin marketplace add irakli58/campaign-atlas
/plugin install campaign-atlas@campaign-atlas
```

Then paste a story and ask for a campaign. It is the same tool; the finished page is saved as `dist/preview.html` in the campaign's folder.

## Where things are kept

Everything stays on your computer, inside this folder:

- `workspace/campaigns/` holds your campaigns, one folder each: the story, the council's debate, Tolkien's judgement, the bible, the maps and the finished page.
- `data/` holds the app's own records and any API key you entered.

Your story goes only to the AI you chose. The app answers only on your own computer (`http://localhost:4747`), not on your network.

## Why the app doesn't sign in to your subscription for you

Anthropic and OpenAI don't allow other apps to sign in with your Claude or ChatGPT subscription. So with a subscription, it is always your own Claude Code or Codex, signed in by you, that does the work; the app only opens it with everything ready and follows the files it writes.

---

## For developers

- `server.js` is the app: a small web server with no dependencies, listening on 127.0.0.1 only. Requests must come from the page it served (a per-run token in a header, JSON only, `Host` and `Sec-Fetch-Site` checked).
- `ui/` is the page. `ui/local-db.js` stands in for the claude.ai artifact database when a campaign page is opened from the app, so the tracker and the music maker save locally, and lets the page keep a redrawn map (`save-map`) or a model brought into the library (`save-model`, written to the campaign's `models/`) in the campaign.
- `lib/launch.js` finds and opens the user's own Claude Code or Codex. `lib/jobs.js` keeps the campaigns and follows their folders. `lib/progress.js` reads how far a campaign has got from its files, using `atlas.js status --json`.
- `lib/run-claude.js` (Claude Agent SDK) and `lib/run-codex.js` (Codex SDK) are the pay-per-use path. Their packages are fetched from npm the first time someone connects that AI (`lib/deps.js`). Set `ATLAS_DEPS`, or write a folder into a `.deps-path` file, to keep them somewhere other than `.deps/`.
- `plugin/skills/campaign-atlas/` is the Atlas tool itself (a Claude Code skill: the council, the map engine, the page). The repository is also a Claude Code plugin marketplace (`.claude-plugin/marketplace.json`, with the plugin in `plugin/`). The app copies the skill into `workspace/.claude/skills/` at every start, with the house rules (`workspace-template/CLAUDE.md`, also written as `AGENTS.md` for Codex) and the permissions Claude Code needs (`workspace-template/settings.json`). `tools/sync-atlas.js` refreshes it from a development copy of the skill; `claude plugin validate .` checks the plugin.

## Licence

MIT: anyone may use, change and share Campaign Atlas, as long as the copyright notice in [LICENSE](LICENSE) goes with it.
