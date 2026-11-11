# Campaigns made by hand

The user's requests of 11 Nov 2026 (the app's docs/requests/2026-11-11-blank-slate.md and 2026-11-11-handmade-parity.md):
a campaign the game master makes entirely by hand, with every part of Atlas open to it, and Claude helping only when
asked. The audit and the decisions: the workspace's reviews/2026-11-11-handmade-audit.md.

## Starting one

- `atlas.js init <dir> --blank [--title ...] [--setting "Arkham, 1926"] [--system "Call of Cthulhu 7e"] [--genre ...] [--kind ...]`
  writes `made: "hand"` into campaign.js, no council or judgement files, a stub story/source.md.
- The Atlas app: the new-campaign form's first choice, "How it is made": *By hand, from an empty campaign* (no story,
  no AI started; app/lib/jobs.js `addBlank`), built at once, its card "Made by hand".
- `check` on a handmade campaign: the council's standards (tier sizes, the clue trail, a starting place, a cast member's
  every field, room descriptions) are notes ("still to make"), never problems; broken data stays a problem.
- Never convene the council or invent content for a `made: "hand"` campaign unless the game master asks for it.

## Where each thing written on the page is kept

| What | The page (table store collection) | The Atlas app's campaign file | Engine |
|---|---|---|---|
| People (the cast, made or changed) | `people` | `edits/0-people.js`: `ATLAS.cast({...})` | atlas-people.js |
| Places of one's own | `customplaces` | `edits/0-places.js`: `ATLAS.customPlaces({...})` | atlas-locations.js |
| Clues, connections, story elements (plot points, mysteries, quests, factions, events...), knowledge | `cluebook`, `storylinks`, `storyitems`, `knowledge` | `edits/story.js`: `ATLAS.storyEdit({...})` | atlas-story.js, atlas-clueui.js, atlas-plot.js |
| Handouts written on the page | `handbook` | `edits/0-handouts.js`: `ATLAS.handbookEdit({...})` | atlas-handouts.js |
| The campaign's own story | `context` (doc `now`) | `edits/0-context.js`: `ATLAS.contextEdit({...})` | atlas-knowledge.js |

A person made by hand: `{ n, role, age, look, manner, voice, bg, want, goals, fears, secret, lie, press, items, notes,
statsText, attrs: { name: value }, img (a small JPEG data URL), at: { pl, room }, factions: [id], made: "hand" }`; only
`n` is needed. `at` puts them among the place's people, on its map (an overlay over A.get's npcs).

A plot point is a story element `{ kind: "plot", n, d, trig, on: { k: "hand" | "clue" | "plot" | "event", ref }, cons,
branches: [{ if, to: itemId }], opt, order, state: "waiting" | "happened" | "skipped", notes }` (its moment "ready" is
worked out from `on`). A mystery `{ kind: "mystery", n, d, truth, suspects: [ref], roles: { clueRef: "essential" |
"optional" | "misleading" }, concl: [text], state }`. A quest `{ kind: "quest", n, d, giver, reward, qs }`. Who and where
each involves: the investigation's own connections ("involves"). New relations: depends on, caused by, related to,
located at.

A handout written on the page: any kind of atlas-table.js `handoutHTML`, plus `page`, `report` (`form`, `fields` as
"name: value" lines), `recording` (`audio`), `book`, `map`; on any kind `img`, `sig`, `stamp`, `aged`; `fmt: true`
(**bold**, *italic*, _underline_, # headings, --- rules); `state: "draft"` keeps it the Keeper's; `notes` never leave the
Keeper's side (stripped in `allHandouts`).

A portrait drawn from a description (atlas-portrait.js, part `people.portraits`): `A.portrait.params(person, { seed,
over })` reads the person's words (age, a woman's or a man's face, skin, hair and its colour, eyes, beard, spectacles, a
scar, freckles, build, a hat, what they do, their manner; `A.portrait.WORDS`) into choices; `svg(choices)` draws it in
the look of the campaign's age (`photo` sepia for victorian and 1920s, `painted` for medieval and fantasy, `colour` for
modern, `future`); `url()` is kept as the person's `img`, with `portrait: { seed, over }` beside it so Draw again and
Change the drawing work from what was chosen. Deterministic: the same person, seed and choices draw the same face.
`A.people.drawAll()` draws everyone without a picture. The workspace's dev/portrait-gallery.js shows a range of them.

Something for one player only (part `players.private`): collection `private` `{ t, to, kind: "note" | "handout", title,
text | h }`; `to` is `pc:<id>` (A.pcsData) or `n:<name>` (a player who named their own screen); a screen says whose it is
in the players' window (kept per browser) and in `presence` `who-<device>`. The Atlas app's players' link sends a phone
only the entries for the `me` it asks with (app/lib/players-lan.js); the shared screen shows none.

A city made from the page (the Atlas app only): `+ A city for the campaign` (atlas-encyclopedia.js) asks the app
(`ATLAS_APP.makeCity({ main: true, name, real, era, year, size, site, plan, culture, kind, seed, around, km })`, app
lib/jobs.js `makeMainCity`), which runs `atlas.js city` for city.js and builds the page again; only while there is no
city.js.

## Where the game master finds it

- The Gazetteer's index above its places (atlas-encyclopedia.js): people, clues, handouts, story, each with its New; an
  empty campaign opens on where to begin.
- At the table: Plot and story (atlas-plot.js), What Atlas knows (atlas-knowledge.js: the campaign's story, a document
  read from a file (text, Markdown, Word, PDF), Read it into entries (proposals to tick), readiness of each part switched
  on, Ask Atlas what it knows), the Investigation as before.

## The copilot on a handmade campaign

Its passages (atlas-table-gm.js `corpus`) hold everything written on the page and are made again whenever it changes:
story elements, what each person knows, handouts, and the campaign's own story (`A.corpusExtra`). Talk and Speak as
them read a person's knowledge, so a person who hides something may lie. "Claude's help" off (module `ai`) stops every
request at `askRaw`.

## Switches (atlas-modules.js)

Modules may have parts, `module.part`, each on unless switched off: `investigation.clues`, `.board`, `.mysteries`,
`.autoconnect`; `people.editor`, `.portraits`, `.knowledge`, `.relations`; `players.private`; `living.events`, `.rumours`, `.factions`; `caves.traps`;
`makeup.encounters`; `plot.quests`. New modules: `handouts`, `plot`, `survival`, `ai`, `sounds`. `A.modules.on("x.y")`,
`A.modules.part(x, y)`, `A.modules.setPart(k, bool)`; html `data-m-<module>-<part>`. New work that makes content must
respect them (an interior generator makes no clues with `investigation.clues` off).

Tests: the workspace's dev/handmade-test.js (the user's fourteen steps, then the copilot and the switches) and
dev/more-handmade-test.js (one player only, portraits, a city from the page) must end "all well".
