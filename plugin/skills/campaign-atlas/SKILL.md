---
name: campaign-atlas
description: Turn a story into a complete, playable tabletop RPG campaign. A council of four writers (Conan Doyle, Agatha Christie, Poe, Lovecraft) debates the story, fixes its holes and adds characters, motives and clues; Tolkien judges what they wrote, strictly, and the story is finished only when all five agree; every location gets gridded floor-by-floor maps (player and GM versions), a room-by-room guide, clues with hints and where they lead, described NPCs, secrets and encounters; and a 3D map shows the whole setting, whether any REAL city recreated with its actual streets, river and landmarks in the look of the story era, an invented city (fantasy cities too), a camp or military base, or a moon base or space station of the future; and above the cities a 2D world map of the lands between them (invented, the real world, or drawn from a map the user drew), from which each city opens in 3D. Published as one interactive page. Use whenever the user gives or uploads a story, scenario, campaign notes or setting (any genre or system) and wants it developed, improved, mapped or made playable; wants locations, maps, dungeons, room keys, a gazetteer, clues or character write-ups; names a city, town, camp, base, moon base or space station and wants a 3D or playable map of it; wants a world map, a map of a region, or gives a map they drew; asks to make maps bigger; or says to do "what you did for the Wormroot Idol".
---

# Campaign Atlas

This skill turns a story into something a referee can run at the table, and it does the whole job:

1. **The story.** A council of four writers (Conan Doyle, Christie, Poe, Lovecraft) reads the user's story, argues over it, closes its holes and fills it out into a full, playable bible: the truth and its timeline, a cast with motives and secrets, a web of clues, places, acts and endings. Tolkien then judges it as a strict examiner, grading every chapter with reasons; the writers mend what he fails; and the bible is final only when all five agree on it. The user's core idea is kept; everything else is the council's to improve.
2. **The places.** Each location gets maps on a square grid (one per floor, a players' version and a GM's version), a guide that describes every room under the same number and name as the map, and the clues, people, secrets and dangers placed in specific rooms. Important places are big.
3. **The trail.** Which clue in which room points to which other place, with a hint for every clue that might be missed, so no single miss stalls the game.
4. **The map of the whole.** A 3D map above the index: any real city, fetched street by street, in the buildings of the story's age, with its landmarks; or a city invented for its time and place; or a site that is not a city. A story that travels has a **world map** above its cities: an invented land, the real world (true coasts, rivers and mountains), or the game master's own drawing, read and redrawn; each city on it opens in 3D, and the referee moves the party and plans its journeys on it.
5. **The page.** One published page with an index, search, a player-safe switch, the cast in full, the clue trail, and map-size buttons.
6. **The music.** Every place plays its own theme, made by the page itself as it plays: a mood for what the place is (a crypt, a market, the docks), in a dark orchestral mystery style by default (piano, low strings, cello, choir), with other styles for other settings, each played on the instruments of its era. Each place shows its suggested song at the top right, with a song for each of its moments (a search, a fever, a chase); the music bar's Songs chooser lists every place's songs and every mood, with what each is played on. The referee can give any place a song of their own: one of Atlas's in any style, a link (YouTube, Spotify), a music file from their computer, or a piece they made in the page's Music tab (a band, drums, and sounds such as rain, lightning and a heartbeat, looped). The referee can switch to a chase, a battle or dread at any moment.

It was distilled from a long project (the Wormroot Idol gazetteer: 51 places, about 1,300 rooms, a 3D map of 1888 London). What the user asked for there, and asked for again when it was missing, is written down as standards so the next story meets them the first time.

## Read these, in this order

| File | Read it |
|---|---|
| `references/playbook.md` | First, every time. The route from story to finished atlas, step by step, with commands. |
| `references/standards.md` | Before planning. What a finished campaign must be; most of it is enforced by `check`. |
| `references/council.md` | When the story arrives. How the four writers work, how Tolkien judges them, how all five agree, and what they must produce. |
| `references/cities.md` | When the story has a setting. Real cities, invented cities, camps and bases; the city data format. |
| `references/world.md` | When the story travels between places, or the user gives a map they drew. The world map: invented, real or from a drawing; several cities in one campaign. |
| `references/data-format.md` | When writing place files. Every field of a place, the cast and `campaign.js`. |
| `references/workflow.md` | Before the first map. How to design a place, the quality bar for a room, enlarging, and the lessons learned. |

Also here: `scripts/atlas.js` (the command line; Node 18+, nothing to install), `engine/` (the renderers and the page; never copied into a campaign), `template/` (what `init` copies), `example/` (a small complete campaign with a cast, hints and tiers; read `example/places/01-docking-bay.js` once), `example-city/` (a hand-laid city).

Run commands as `node "<this folder>/scripts/atlas.js" <command> <campaign folder>`.

## The work, in order

`references/playbook.md` has each step in full. In brief:

0. **A permanent folder.** `init` the campaign in a folder the user can see, never a temporary one. Save their story untouched as `story/source.md`.
1. **Convene the council** (`references/council.md`). Its job: make the story as interesting to play as possible, as faithful to the user's story as they asked, and at least as long as they asked (about a hundred pages when nothing was said; longer is better). Write the Core that may not change, then the debate, then the bible; then Tolkien's judgement (`story/judgement.md`), the mending, and the agreement of all five. Do this without being asked, and do not ask leave to change things: change them and report.
2. **Canon and cast.** Bring `canon.md` up to date; put the principals in `ATLAS.cast`.
3. **The look and the map of the whole.** Set `campaign.js`; run `city` for a real city, a real site, an invented city or an invented site (`references/cities.md`); review its landmarks. When the story travels, make the world map and a 3D city for each settlement that matters (`references/world.md`).
4. **Register every place**, unmapped, with its tier and its position on the city map. Plan which clue points where. Two leads into every place that matters.
5. **One place at a time, completely, in tier order**: draw at full size for its tier, `check`, `ascii`, place clues and people, write every room, `check` until clean.
6. **Build, look, publish** to one address with the Artifact tool; save the address. Without an Artifact tool, the finished campaign is `dist/preview.html`: tell the user where it is.
7. **Report**: what was made, what the council changed, what was invented while mapping.

## Rules that matter most

The reasons are in the references; these are the ones that were learned by getting them wrong.

- **The Core is the user's; the rest is the council's.** Full creative freedom to add characters, motives, clues, places and twists, and to change anything that is not the Core. Length does not matter; dullness does.
- **It is a game, so it runs on clues.** Three clues to every conclusion, in at least two places. Every clue that leads on carries a hint for when it is missed.
- **Important places are big, from the start.** Tier 1: thirty rooms or more on three floors or more. Never draw a small version and wait to be asked. Bigger means more to find, not more floor.
- **A real city is the real city.** When the user names one, fetch it: actual streets with their names, the actual river, the actual landmarks. Never draw a real city from memory. Its buildings wear the story's age: medieval, industrial or modern.
- **The map and the guide share one set of names.** Room ids are `R1`, `R2`...; never describe a room that is not drawn, never draw one with no entry.
- **Every place has its theme.** Say `music: "mood"` on each place that matters (`catalogue` lists the moods); the rest are guessed from their names. Sound starts only from the page's Music button.
- **Every person is a person.** Everyone the players can meet, however minor, has what they look like, their story, how they act and who they know (`look`, `bg`, `manner`, `ties`); the principals have the rest too in the cast (how they speak, want, secret, lie, what makes them talk, fate). Ties name people by cast id or full name, and the page shows the web both ways.
- **Nothing secret reaches the players.** Hidden rooms take `{ h: 1 }`, secret doors are type `"s"`, GM-only floors take `gm: 1`. A room's `d`, `pur` and `atm` are shown to players.
- **Run `check` after every change, and act on it.** It enforces the standards: sizes by tier, every room written, players' maps clean, the trail unbroken, hints, descriptions, the city sound.
- **Never edit `city.js`.** It is rewritten by the `city` command; changes go in `campaign.js` with `ATLAS.cityEdit`.
- **Keep the work where it cannot be lost**: a permanent folder, one published address saved to memory, and no artifact deleted unless the user says so.

## Commands

```
node scripts/atlas.js init <dir> --title "Name"     start a campaign folder (with story/ for the council)
node scripts/atlas.js check <dir> [place ...]       standards, maps, guides, player safety, clue trail, cast, city
node scripts/atlas.js ascii <dir> <place> [floor]   a floor as text, with room rectangles, doors and markers
node scripts/atlas.js dump <dir> <place ...>        everything written about a place, compactly
node scripts/atlas.js status <dir>                  progress table; rewrites checklist.md
node scripts/atlas.js build <dir>                   dist/<title>.html (publish) and dist/preview.html (look)
node scripts/atlas.js export <dir> [place ...]      every floor as SVG, player and GM
node scripts/atlas.js catalogue [<dir>]             floor kinds, items, presets, city models, looks, landmark kinds

node scripts/atlas.js city <dir> "City, Country" [--year N | --era ...] [--km 2] [--around "..."] [--must "..."]
                                                    a real city: its true streets, water and landmarks
node scripts/atlas.js city <dir> "Place" --buildings [--km 1.5]
                                                    a real site, building by building (camp, base, village)
node scripts/atlas.js city <dir> --invent "Name" [--year N] [--site river|coast|harbour|lake|plain] [--culture ...]
                                                    an invented city for its age, site and people
node scripts/atlas.js city <dir> --invent "Name" --kind camp|base [--town] [--ruin 0.5]
                                                    an invented camp or military base
node scripts/atlas.js city <dir> --invent "Name" --kind moonbase|outpost|colony|station [--year 2291]
                                                    the future: modules, domes and tubes on a moon, or a ring in orbit
node scripts/atlas.js locate <dir> "an address"     where a real spot falls on a fetched city's sheet
node scripts/atlas.js kit list | use <dir> <kit> | save <dir>
                                                    buildings made for one place (a city's own landmarks and streets):
                                                    the kits there are, one into a campaign, a campaign's kept for next time
node scripts/atlas.js city <dir> ... --id <id>      another city of the campaign (cities/<id>.js), for a location of the world map
node scripts/atlas.js world <dir> [--look parchment|atlas|stars] [--land continent|islands|coast|inland]
                                                    the world map: an invented land under world.js, its locations placed
node scripts/atlas.js world <dir> --drawing <picture>   the world map from the game master's own drawing
node scripts/atlas.js world <dir> --real "Region"   the real world: true coasts, rivers, mountains; places found by name
```

Write place files with the Write and Edit tools. Shell heredocs on this user's machine eat backslashes and stumble on apostrophes, which place files are full of.

## When the user asks for changes later

- "Make it bigger", "more rooms", "more to find": add an `expand` step to that place; see "Enlarging a place" in `references/workflow.md`.
- "A different city", "another year", "more landmarks": run `city` again with other options. "This landmark is wrong": `ATLAS.cityEdit`.
- "A map of the world", "here is a map I drew", "use the real coast": `references/world.md`.
- "Change the story": reconvene the council on that point, update the bible and canon, then the places it touches.
- "The players should not see X": hide it, then `check`.
- "Add a place": register it, give it two inbound leads, map it, rebuild.
- Something looks wrong and you cannot see what: ask which map and what is wrong, once, before inspecting anything.
