# The user's request, 16 Nov 2026 (verbatim in substance): hand-drawn parchment player maps & progressive cartography

Generate crude, historically inspired, hand-drawn player maps from existing worlds: drawn as if by a commoner,
traveler, village elder or merchant, on parchment; incomplete, inaccurate in believable ways, with little
information; the DM draws, writes and adds information onto it as the players learn more. Player-facing, not a
replacement for the geographical map.

1. Inspect existing generation, terrain, rivers/lakes/coasts/mountains, settlements and roads, political boundaries,
   rendering, drawing/editing tools, DM/player visibility, exploration/discovery. Reuse the world data; do not
   significantly modify the generator.
2. Look: aged parchment, dark brown/black ink, uneven lines, rough rivers, simplified coasts, crude mountain symbols,
   small forests, basic settlement symbols, irregular handwriting, occasional stains, faded ink, wear, minimal
   decoration. Not a professional map with a parchment texture; the geography itself simplified and imperfect.
3. Limited knowledge (most important): a villager knows their village, a nearby forest, a river, a road to the next
   town, mountains in the distance, a neighbouring village, a rough distant city. Most of the world unknown; never
   reveal the whole world automatically.
4. Believable, controlled, deterministic inaccuracies (misplaced rivers, exaggerated mountains, forests too big or
   small, simplified roads, inconsistent distances, approximate settlements, missing distant geography); still useful
   for play; the DM's world stays accurate.
5. Knowledge/skill presets of the mapmaker: village commoner, traveler, merchant, soldier or scout, professional
   cartographer (presets, depending on the mapmaker's travels, not rigid class assumptions).
6. Editable (extremely important): freehand drawing, erasing, labels, roads, rivers, mountains, forests, settlement
   symbols, landmarks, notes, borders, custom symbols; feels like drawing on parchment; no regeneration needed.
7. Progressive discovery across sessions; nothing revealed automatically unless the DM enables it.
8. DM geographical map (accurate, complete, hidden locations and secret routes) vs player parchment map (incomplete,
   simplified, hand-drawn, only revealed information, DM annotations, deliberate inaccuracies); hidden things never
   on the player map until revealed.
9. Layers: base parchment, initial geography, settlements and landmarks, roads and paths, text and labels, DM
   annotations, player-visible discoveries, DM-only annotations; toggle layers, edit elements, undo/redo, lock
   elements; never flatten into one image.
10. Reveal controls, individually: a village, a road, a pass, a region, a landmark, a rumour; reuse fog-of-war if
    present but not like a satellite map uncovering: a discovered region adds a rough sketch of its landmarks.
11. Rumours: mark information confirmed, rumoured, uncertain, incorrect (e.g. a castle with a question mark, later
    corrected); rumours never become canon automatically.
12. A hand-drawn symbol library: villages, towns, cities, castles, towers, ruins, temples, bridges, forests,
    mountains, hills, rivers, lakes, swamps, roads, caves, ports, inns, dangerous areas, unknown locations; simple ink
    drawings, consistent style.
13. Customisation (simple): parchment colour, wear, ink colour, line thickness, roughness, handwriting, symbol detail,
    accuracy, knowledge level; a good default.
14. Multiple player maps (commoner's, merchant's trade map, old military map, treasure map, explorer's map); copy a
    map and add to it without altering the original; separate player groups.
15. Integration: world maps, gazetteer, locations, roads, settlements, campaign knowledge, discovery, session events,
    DM Copilot (may suggest additions but must ask approval before revealing; respect auto-discovery off), player
    visibility.
16. Save in the campaign, edit later, export as images and printable maps, share, player-facing mode; exports never
    include hidden DM information; keep editable source data.
17. Implementation order: inspect first; Phase 1 crude parchment map from the world; Phase 2 drawing and annotation
    tools; Phase 3 discovery and reveal; Phase 4 presets and multiple maps; Phase 5 campaign events, gazetteer, DM
    Copilot. Reuse existing systems; don't change geographical generation beyond small backward-compatible hooks;
    request approval before major architectural changes.
