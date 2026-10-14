# The method

How to turn a story into places worth visiting, and what went wrong the first time. Written after building the Wormroot Idol gazetteer (a Call of Cthulhu campaign: 51 places, about 1,300 rooms, four map sizes for the key places).

## Contents

1. Intake: what to get from the story
2. Planning places and the clue trail
3. Designing one place
4. The quality bar for a room
5. Writing for two audiences
6. Enlarging a place
7. Canon discipline
8. Order of work and reporting
9. Lessons learned (mistakes that cost time)
10. When the user reports something you cannot see
11. The map of the whole
12. Keep the work where it cannot be lost

## 1. Intake: what to get from the story

Read everything the user gives you before drawing anything. Then fill in `canon.md`. You are looking for:

- **The truth.** What actually happened, who did it, why, and how it can end. Places exist to reveal this in pieces.
- **The cast.** Every named person, with their role, where they are found, and facts that must not drift: ages, dates, relations, what they know.
- **The places the story names**, and what must be true of each (a body was found here; a door was locked from inside; the cult meets below).
- **The setting's texture**: year, city or world, technology, what a building is made of, what the game calls its referee, what unit maps use, which skills or checks the system has.
- **The acts or phases**, if any. A place can matter in more than one, differently each time.

If the story is thin, that is fine: the atlas is where it gets thick. But ask yourself what the user would be surprised by, and keep those inventions on the list for approval (section 7).

Use the game's own vocabulary for checks (Spot Hidden and SAN in Call of Cthulhu; Perception and saving throws in D&D). If the system is unknown, describe the action and difficulty in plain words ("a careful search", "hard").

## 2. Planning places and the clue trail

List every place before mapping any. Register each one in a place file with a name, category, region, tagline and nothing else; it then shows in the index and on the checklist as "not mapped yet".

Sort them into tiers and work in that order:

- **Tier 1: the story cannot run without it.** Starting places, scenes of the central events, the antagonists' bases, the finale.
- **Tier 2: the trail passes through it.** Witnesses, archives, shops, hideouts that hold one or two things the players need.
- **Tier 3: colour and reward.** Places that deepen the world but are not required.

Then draw the clue trail on paper (or in a list): for each place, what the players learn there, and where each thing they learn sends them. Rules that keep an investigation from stalling:

- **Two ways in.** Every place that matters has at least two inbound leads, from different places or people. `check` reports places with fewer.
- **A lead is concrete.** Not "they suspect the doctor" but "the docking log shows the doctor signed for a crate at 03:31". A clue has a physical form, a room it sits in, a way it is found, and a thing it proves.
- **Starting places need no lead**: mark them `start: true`.
- **Dead ends are allowed, silence is not.** A place that points nowhere should still close a question.

In place files a lead is the `to` field on a clue or person. The page builds "How the players get here" and "Where this place points" from those, and a campaign-wide clue table.

## 3. Designing one place

Work from the outside in.

1. **What is it, really?** A terraced house, a chapel, a cargo bay. Give it the rooms such a building has, in the order they would be built: the public rooms at the front, service at the back, private above, storage below. A believable plan does half the work of description.
2. **Put it in its street.** Draw the open ground around it (the street, a yard, an alley, a quay). Neighbours, back gates and upper windows are how investigators watch, break in and escape. For enclosed places (a dungeon, a ship, a station) name the entrance rooms in `entry`.
3. **Size.** A modest building is 16 to 24 squares wide; a key location 30 to 50. With 5 ft squares a 3 by 3 room is a small bedroom and 2 wide is a corridor. Leave a margin of open ground so walls are not on the edge.
4. **Floors.** Each floor is its own grid of the same size, aligned so stairs sit on the same squares. Give every stair an id (`ST1`) and put both ends in. Cellars sit in a `rock` rectangle; an upper floor shows the street "(below)".
5. **The secret layer.** Decide what the place hides: a hidden room, a bricked-up cellar, a second way in. Hidden rooms take `{ h: 1 }` and need a secret door (`"s"`) or they cannot be reached. A whole floor only the GM sees takes `gm: 1`.
6. **Place things in rooms.** Every clue, person, secret and encounter gets an `at` room and a marker drawn inside that room. Spread them: the best clue should not be in the first room.
7. **Run `check`, then `ascii`.** The text drawing shows overlaps and gaps faster than reading coordinates.

Furnishing: give ordinary rooms a preset (`fx: "kitchen"`, `"office"`, `"bedroom"`...) and place by hand only what the story mentions (the desk with the ledger, the bed with two hollows). `bk` says which wall the furniture backs onto.

## 4. The quality bar for a room

A room's entry answers what a referee is asked at the table:

| Field | The question it answers |
|---|---|
| `d` | What do we see? (two or three concrete sentences; shown to players) |
| `pur` | What is this room for? (shown to players) |
| `atm` | What does it smell, sound and feel like? (shown to players) |
| `obj` | What is in it that we could look at or take? |
| `chk` | What can we roll, and what does each success give? |
| `kp` | What does the referee need to know that the players do not? |
| `who`, `now` | Who is here, and what are they doing when we walk in? |
| `cl`, `sec`, `dz` | Only if you want to say more than the automatic list of clues, secrets and encounters placed here. |

Every room earns its place by holding at least one of: a clue, a person, a danger, a secret, a decision, a resource, or a route that matters. A corridor can earn it by being where someone is overheard. If the honest answer is "nothing", merge the room into its neighbour or cut it. `check` counts rooms whose checks say "None" and which hold nothing, and complains above 40 percent.

Good entries are specific. "A study with books" is nothing; "the desk where the gospel was written; pipe ash in the tray, though the new minister does not smoke" is a room.

Each floor gets a note: what is on it, who is there and when, and how it feels. Each place gets an overview (`ov`: what it is and what happened), running notes (`run`: which act, what the players should leave with, the stakes) and an exterior to read aloud (`ext`).

## 5. Writing for two audiences

The page has a player-safe switch, and maps export in a player version. So:

- `d`, `pur`, `atm` and `ext` describe what anyone would see. No clue ids, no "the killer", no "hidden".
- Everything else is the GM's.
- A hidden room is absent from the players' map: no outline, no label, no furniture. Do not name a visible room "Secret study".
- A room that can only be reached through a secret door should itself be hidden, or the players' map shows a sealed box and the secret is out. `check` notes these.
- Stairs to a GM-only floor are hidden from players automatically.

## 6. Enlarging a place

Users ask for "bigger" more than once. Each time, the answer is an entry in the place's `expand` list: the earlier map is untouched, and the page gets size buttons (Original, Larger, Largest, Huge), so the change is reversible.

What to add, roughly in this order:

1. **The neighbours.** The shop next door, the lodging house, the yard behind. They bring witnesses and ways in.
2. **Down.** A cellar, a vault, a drain, a sealed older level. Secrets live below.
3. **Up.** Attics, staff floors, roofs, a loft with a view of the back windows.
4. **The service side.** Kitchens, laundries, stables, boiler rooms: where staff talk.
5. **A second building in the story's orbit.** The empty house where the watcher lives; the mews with the cabman who drove someone at three in the morning.

Rules for additions:

- Each new area brings at least one new clue, person, secret or encounter, and at least one of them should tie to something elsewhere in the campaign.
- 1.5 to 3 times the floor area is a real step; less looks the same.
- New rooms continue the numbering (`R18`, `R19`...); never renumber existing rooms, because the guide, the markers and the user's notes refer to them.
- `grow: [left, top, right, bottom]` adds squares on each side. Streets, grass, rivers and rock that touched the old edge stretch to the new one. If stretching would run a churchyard over your new cottages, set `nostretch: true` and add the extra street and ground yourself.
- After an expansion, `check` runs every size. A room reachable at one size and cut off at the next is the usual mistake.

## 7. Canon discipline

- **Check before inventing a fact.** Names, dates, who is alive, who knows what: look in `canon.md` or the user's document.
- **Name clashes are the commonest slip.** A new barge called the Ellen when Ellen is already someone's dead wife; a second Hollis. Run `check --names` and read the list.
- **One thing, one name.** If two files call the same boat two names, fix both and tell the user.
- **Dates do arithmetic.** A man who "came down in 1794" and a letter of 1889 from his pupil's youth do not both fit a pupil of 94 in 1913. Work it out.
- **Write inventions down as you make them.** Under "Invented while mapping" in `canon.md`: the addition, the place, and what it changes. Report them at the end. Small colour needs no entry; anything that changes what is true does.
- **If the user's brief contradicts their own document** (a place that does not exist in it), map the nearest real equivalent and say so.

## 8. Order of work and reporting

- Finish one place (map, guide, checks clean) before starting the next. Half-done places multiply.
- After each tier: `check` everything, `build`, look at the page, publish, and tell the user in a few lines what is new.
- `status` writes `checklist.md` from the data. Do not tick boxes by hand.
- The final report covers: what was made (counts), canon corrections, inventions to approve, and anything deliberately left out.
- Save the artifact URL and the campaign folder's location to memory, so a later session can continue.

## 9. Lessons learned

Each of these happened.

- **Unknown item codes drew nothing, silently.** Graves and crosses were "placed" on a churchyard for weeks and never appeared. Now an unknown item draws a red dashed box and `check` reports it.
- **Stretching ran open ground over new buildings.** Growing a map stretched the churchyard across the cottages added beside it. Use `nostretch` and add the ground by hand when new rooms go where old open ground would stretch.
- **Doors between two open areas are errors.** Open ground connects to open ground without a door; only gates (`"g"`) may stand between two outdoor areas.
- **Every rectangle needs a kind**, including unnamed filler. A nameless, kindless rect breaks the draw.
- **Same-id rectangles make L-shaped rooms**, and only the first carries the label. Use this instead of inventing "R1a".
- **Later rectangles draw over earlier ones.** A building drawn after the churchyard sits on it; a hidden room drawn over a visible room vanishes cleanly from the players' map.
- **Labels must fit.** A long name in a 2 by 2 room is unreadable; shorten the label and put the full name in the guide's `n`, or give the label a position with `l`.
- **Markers drift.** A clue's marker ended up one room over from its `at`. `check` now compares them.
- **A map that renders is not a map that works.** Rooms with no door, stairs with one end, a floor note keyed to a floor name that had changed: all rendered fine. Trust `check`, not the picture.
- **Exports must stand alone.** The page forgave markup that a standalone SVG file does not. `check` validates what `export` writes.
- **Player maps leaked.** An early version drew hidden rooms as blank boxes, which is as good as a label. Hidden rooms are now simply absent.
- **The shell's heredocs ate backslashes and choked on apostrophes.** Write files with the Write tool; make small changes with Edit.
- **Screenshots of the preview can fail when the pane is hidden.** Verify with `check`, the page's DOM and console, and a fixed viewport size; do not loop on screenshots.
- **Publishing to a new URL orphans the old one.** Always update the same artifact, and never delete an artifact without the user saying so.
- **Long jobs outlive a session.** Keep the checklist current and the canon sheet honest, so the work can be picked up cold.

## 10. When the user reports something you cannot see

The Wormroot city map flickered on the user's computer and never on the one it was built on. Three rounds of fixes taught this:

- **Ask what and where before changing anything.** "The map is messed up" could have meant four different maps. One question with concrete choices (which map; what it looks like: flickering, blurry, blank, misplaced) saved more time than an hour of looking.
- **Measure instead of squinting.** When a fault will not reproduce, build a number: render two almost identical views and count the pixels that change; hash generated data before and after a change to prove what did not move. A screenshot of a still frame cannot show flicker.
- **A fix you could not see working is a guess. Say so**, and ask the user to confirm. Do not report it as fixed.
- **If a fix makes things worse, take it out and say it was yours.** The first fix added a sharper patch that followed the camera; the user saw parts of the map vanishing. Removing it was the fix.
- **Decoration that looks unfinished is a bug to the person looking at it.** A map that faded to bare paper at its edges, and houses that thinned out toward the outskirts, were both deliberate and both reported as faults. Fill the whole sheet.
- **Add to generated content without moving what is there.** New houses were placed by a second pass with its own random sequence and appended last, so every existing building kept its place. Users notice when things they know have shifted.
- **Test the fallback.** The backup map for devices without 3D had never once appeared: an SVG element ignores `hidden = false`; the attribute has to be removed.

## 11. The map of the whole

The tool now has one: a real city fetched street by street, an invented city, or a site that is not a city, standing in 3D above the index. How to make it is in `cities.md`; when in the work to make it is step 5 of `playbook.md`.

It began as the Wormroot Idol's map of 1888 London, built by hand for that one city. What went wrong there, in the order it went wrong, is why the engine is as it is:

- Two flat surfaces a hair apart flickered from a distance. So no planes are stacked close together; the table under the sheet is drawn first and kept out of the depth buffer; the near plane follows the view.
- A paper texture with a random value in every pixel crawled like static when the view moved. So grain is soft and tied to plan units.
- A sharper patch of ground that followed the camera made parts of the map vanish and the rest look coarser. So nothing on the ground follows the camera or changes with zoom: it is printed once, in tiles, as sharply as the device can afford, and swapped in in one step.
- Things thinner than a pixel twinkled. So lamp posts, chimneys and trunks are hidden beyond the distance at which they can be seen.
- The plan faded to bare paper at the edges while the houses did not, leaving them standing on nothing; then the houses thinned out toward the edge. So both run right to the edge of the sheet.
- The frame was still drawn a margin in from the edge, where the fade used to begin, and read as a stray line across the water. So the frame runs round the very edge.
- The user said "the flat map is messed up" and four different maps were inspected before anyone asked which one. Ask first (section 10).

A change to the city engine must leave a hand-laid city exactly as it was. The workspace's `dev/city_regression.js` feeds London to the engine and compares every road, house, lamp and tree with what the Wormroot page builds; run it after any change to `engine/atlas-city.js`.

## 12. Keep the work where it cannot be lost

Midway through the Wormroot project Windows emptied the temporary folder the sources were in. A copy made the day before, in a folder on the Desktop, rebuilt the published page byte for byte; without it the page could only have been edited as one two-megabyte file. A campaign's folder lives in a permanent place from its first minute, and anything that takes more than a few minutes to make is written there, not to a temporary directory.
