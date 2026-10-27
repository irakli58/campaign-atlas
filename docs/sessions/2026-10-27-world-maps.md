# Session notes: world maps (27 Oct 2026)

What was asked, what was done, and what is waiting, so the next session can carry on. All work is on the branch
`world-terrain-expansion` (pushed). HANDOFF.md has the same in the project's running list.

## What the user asked, in order (their words where it matters)
1. Deserts "look kinda unnatural" → deserts are a mosaic: rock, gravel plains, sand seas in basins, salt pans, wadis.
2. Deserts must form "because of the world's climate and geography" → the Earth climate model (`--climate-model earth`):
   subtropical highs, cold/warm currents, rain shadows, interiors, monsoon, polar deserts. **On trial; the classic model
   is still the default for regional maps** (a whole planet always uses the Earth model).
3. "Make the map look better, DO NOT CHANGE THE GENERATION" + an example (a raised relief print of California) →
   the **hydrographic relief** look (`hydro`, now the default for fantasy). "It looks really grainy" → valleys carved
   along every stream instead of noise. "The flat lands do not look flat" → slopes lit in metres.
4. "Maps way way bigger, like the whole earth" → `--size planet` (pole to pole). The user chose "whole planet" as the
   direction. Shortfalls then fixed: broad belts, island arcs, faint rifts, tiled zoom detail, sub-grid gullies.
   **Not the default yet: waiting on the user's approval.**
5. "The person generating the map chooses how big it is", "upload a picture of how the map should look and it
   generates the map", then "I like the coloured map one better ... make it more fleshed out" → **Make a new world**
   in the page (Edit map) with a **painter** (colour key: water, plains, forest, desert, swamp, snow, hills, mountains,
   volcano), or a picture read into the painter; `atlas.js world --sketch file.png` in Node.
6. "A human won't make the mountains natural: slightly modify the shape after it's done" → `--loose 0..1`
   (coast bays/headlands, ranges broken into massifs with passes and spurs, wandering edges). First version was too
   subtle ("I don't see a difference"); now stronger. **Waiting on approval**: default still 0 (as drawn), and the
   page does not offer the choice yet. Plan once approved: default .5 ("Natural"), a "How closely to follow my
   drawing" select in Make a new world (Exactly / Natural / Loosely) passing `loose` in the `gen` recipe → flags.loose.
7. "Where's the river leading out to sea from the lake? That might be story relevant" + "have other rivers too but
   keep that one" → a drawn river is always a real river (`drawnRivers` in scripts/world-invent.js): followed along
   the line, from the lake it touches to the sea, joined across lakes, its bed cut downhill, drawn as the main river;
   the generator's own rivers stay too. No generator lakes are dug on a drawn river.

## Open decisions for the user
- Earth climate model as the default for regional maps?
- Whole planet as the default size? (about 3 min to make)
- "Natural" touches for drawings: approve strength, then make it the default and add it to the page.

## Known rough spots
- A painted swamp shows only faintly in the hydro look.
- Rivers look very wide when zoomed far into a planet; square-ish snow patches on some planet uplands.

## How to check work (scratch tools were in the session's scratchpad, not in the repo)
- Old worlds must stay byte-identical: generate `t1` without flags and compare to a saved copy.
- Regional classic and Earth-model outputs at fixed seeds must not change when only drawing changes.
- Render with Playwright: load engine files + world.js + world-terrain.js, `ATLAS.worldArt.draw(WD, look)`.
- The page: `atlas.js build <dir>`, open dist/preview.html, World map, Edit map, Make a new world.
