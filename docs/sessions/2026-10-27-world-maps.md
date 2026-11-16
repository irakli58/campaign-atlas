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

## In progress when these notes were last written
- Scientifically accurate sandy beaches (full request: docs/requests/2026-10-27-beaches.md): sediment from rivers
  (stream power), cliffs, reefs, volcanoes; waves from the wind belts with fetch and exposure; longshore drift
  (capacity ~ sin 2θ) depositing where it slows; beaches, gravel, rocky cliffs, dunes, barrier islands with lagoons and
  inlets, spits, salt marsh and mangroves. Behind `--coast natural` until the user approves.
- Realistic ocean currents (full request: docs/requests/2026-10-27-ocean-currents.md): wind-driven gyres with
  western intensification from the actual basins, equatorial currents, circumpolar current where a latitude band is
  open, Ekman upwelling on eastern boundaries; sea temperature carried by the currents feeding the climate (fog, rain,
  coastal deserts, sea ice); a toggleable currents layer (warm red/orange, cold blue arrows, gyres, equator and
  latitude lines, names and strengths). Behind an opt-in until approved.
- The user will continue in a local session after this one: keep this file and HANDOFF.md current.

## Where the ocean and beach work stands (work in progress, committed so it is not lost)
Both are opt-in and change nothing unless asked: `atlas.js world <dir> --ocean natural --coast natural`, or the
"Simulate the oceans (preview)" checkbox in Make a new world. Regional and existing worlds stay byte-identical.
- scripts/world-ocean.js (done, working): winds by belt plus geostrophic turn round each ocean's high; Stommel's
  equation r∇²ψ + β∂ψ/∂x = curl τ solved by SOR on the basins (coasts as walls, regional maps padded with open sea);
  circumpolar current where a westerly band is all sea on a planet; Ekman upwelling; SST advected along the currents
  and relaxed to the latitude's; sea ice below -1.2 °C. Output `T.ocean` (coarse u, v, warmth, named gyres and
  currents). Feeds climateEarth (sea warmth, cold/upwelling → fog and drought) and the ecology (coast temperature
  anomaly, winter-weighted). Tested on a 6-continent planet: gyres at ±30°, western boundary currents warm, eastern
  cold, equatorial currents westward.
- Map layer (done): `ATLAS.worldArt.currents(WD)` draws arrows (orange-red warm, blue cold), gyre circles with turn,
  named currents with warm/cold and strength, equator and 30° lines, a key. Page toggle button "Ocean currents"
  (`.wm-octog`, data-w="currents"), shown only when the world has `T.ocean`, remembered per browser.
- scripts/world-coast.js (working, still being tuned): sediment by stream power down the rivers (gravel from steep,
  cold ground, worn to sand with distance), cliff supply, reef carbonate in warm seas, volcanic black sand; waves
  from belt winds with fetch, openness and storminess, normalised per world; longshore drift with capacity ~ E^1.5
  sin2θ, deposition where it slows, converges or is sheltered; classes beach/gravel/cliff/dune/marsh/mangrove/
  barrier/spit/lagoon; a report of the 8 greatest beaches and why. Calibrated so about a third of coasts are sandy.
  Output T.shore, T.shoreW (width), T.sand (makeup); drawn in both relief looks (old `beaches` strip is used only
  when a world has no T.shore).
- Barrier islands fixed: judged by the sand to be had along ~100 km of coast (log-averaged), on a shallow shelf, low
  land behind (relief < 220 m), moderate waves; two cells wide, inlets at river mouths and rarely elsewhere; capped
  at ~12% of coasts (Stutz & Pilkey 2011). Sandy coasts ~1/3 (Luijendijk et al. 2018). Label bug fixed (coral vs
  volcanic sand).
- Measured on a 6-continent planet: coasts by warm currents ~8 °C warmer than coasts by cold currents at the same
  latitude; a cold eastern-boundary current runs beside a west-coast desert (as Canary/Sahara).
- Then still to do for these requests: before/after images and the explanations the user asked for (why each beach
  and each current formed, how currents change the nearby climate), docs (references/world.md), tutorial step for
  the currents toggle, and wait for the user's approval before making either the default.

## Plates, rocks and resources (16 Nov 2026: the user asked "do 1 and 3 and add both to the planet generation")
- Done: scripts/world-tectonics.js, called at the end of world-geology.js (records old belts and hotspots without
  touching the land: land, climate and rivers verified identical). T.tect, T.rocks, T.deposits; plates named.
  Page buttons "Plates" and "Rocks and resources" (atlas-world-art.js plateLayer, rockLayer). Tested on a large
  5-landmass world and a 6-continent planet; page toggles tested; tutorial step added.
- Not done (option 2, offered): plates moving over time (continental drift history).

## Players' parchment maps (16 Nov 2026; request: docs/requests/2026-11-16-player-parchment-maps.md)
- The user: optional: "if the DM wants the players to see the real map they can see it, if not they get the [hand-drawn] one".
- Done: engine/atlas-pmap.js (generate from the world by maker preset, home and accuracy; render on parchment; the
  editor with tools, layers, status, lock, hide, DM-only; reveal place/rumour/land/road; suggestions of places the
  party learned of, added only on approval; several maps, copy; look options; picture and print of the players'
  version). atlas-world.js: "Players' maps" button, docs pm-<id> and pmset with undo/redo. atlas-share.js: given maps
  shared as pmap:<id> without DM layer/hidden/links; in parchment mode the real world is not shared. atlas-table.js:
  players' screen shows a pmap, and the world map as the parchment map in parchment mode. Tested end to end.
- Phase 5: the Copilot tab (atlas-copilot.js pmapHTML) offers places the party knows that a given map lacks, "Add it"
  or "Not now"; nothing added unasked. Still to do: tying additions to session events; perhaps a list of given
  maps in the players' copy apart from the screen.

## Dropped (16 Nov 2026)
- Anything for the old map styles (painted, parchment: drawn trees and symbols), e.g. "polish the trees": the user
  will not use them.

## Decided (the user: "okay I like everything now")
- The Earth climate model is the default for new worlds (a plates world made before keeps the classic rules when made
  again with the same seed; `--climate-model classic|earth` overrides; T.climateModel is written when earth).
- A whole planet is the default size for new worlds (in the page and atlas.js world; about 2 to 3 min).
- Natural touches for drawings are on by default (loose .5), with a slider in Make a new world ("make a slider on
  how close they want it to the drawing"): left exactly as drawn, right loosely.
- "Map size slider would be good too": How big is a slider over the seven sizes (Small to A whole planet), naming
  the size, its width and height in km and about how long it takes. "There is a big jump from 8300 to 40000" → two
  sizes between: a supercontinent (13,000 km) and half a planet (20,000 km), given in km (SIZE_KM), spanning the
  latitudes their km do, eroded at full detail (about 2 min each).
- "A preset for how it should look: islandy, one big continent ... how many landmasses" → `--land masses` with
  `--landmasses N` and `--landshare`, landmasses of varied sizes kept apart by straits; in the page, presets (one
  big continent, Pangaea, two continents, several like the Earth, many islands, an archipelago) set two sliders.
- "Sandy shores on some of the islands?" → beaches drawn as a strip along the open-sea coast where it is low and
  gentle, in stretches, warm more than cool, none where the sea freezes (drawing only; `beaches` in atlas-world-art.js).
- "What are these?" (a ring with a dark middle): a volcano as the hydro look draws it; offered to draw it as a peak.

## Known rough spots
- A painted swamp shows only faintly in the hydro look.
- Rivers look very wide when zoomed far into a planet; square-ish snow patches on some planet uplands.

## How to check work (scratch tools were in the session's scratchpad, not in the repo)
- Old worlds must stay byte-identical: generate `t1` without flags and compare to a saved copy.
- Regional classic and Earth-model outputs at fixed seeds must not change when only drawing changes.
- Render with Playwright: load engine files + world.js + world-terrain.js, `ATLAS.worldArt.draw(WD, look)`.
- The page: `atlas.js build <dir>`, open dist/preview.html, World map, Edit map, Make a new world.

### Parchment readability (16 Nov 2026)
The user asked for cleaner player maps (priority hierarchy, few spaced symbols, no overlaps, density presets, Minimal for commoners, never move the DM's marks). Done in engine/atlas-pmap.js, see references/world.md "Players' maps: readability". Mid-way the user said "the connecting lines between cities look weird" (roads were straight lines across the sea; now routed like the real map's roads) and "i wanted you to use the geological map as reference not the old one" (tests now run on freshly generated plates worlds, not the old painted test campaigns). Also fixed: big symbols (the home city) were drawn with a zero stroke width.
Then the user: "make a general contour of the continent, then put only the really famous places there and some of the really famous mountains stuff a commoner would know"; "do not try adding lines inside of the contour like the ones you did before it looks weird"; "yess this is good also add the forests and thats it". Done: the commoner's map (references/world.md, "The commoner's map").
Then: "okay can you slightly fill out the map like slighlty more so its less empty do not go overboard": up to 6 places (towns after the cities), 4 ranges and 4 forests, a peak or clump more on the big ones.
Then: "fill out the map with some more mountains and forests so its not as empty", and "the small hill looking stuff looks so weird remove that": heights and woods judged per continent, more ranges and woods, woods drawn as groups, small mountains (not hill arcs) on the lower uplands.
Then: "i want a slider on how detailed the map is and how accurate it is": How much is drawn and How accurate, in the New map form and The look (references/world.md, "Two sliders").
