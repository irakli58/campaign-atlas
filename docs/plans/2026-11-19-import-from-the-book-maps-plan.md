# The import from the book's own maps: plan (19 Nov 2026)

The request is docs/requests/2026-11-19-import-workflow-from-the-book-maps.md. The workflow is now step one of
plugin/skills/campaign-atlas/references/import.md ("The workflow: from the book's own maps, outward in").

## What went wrong before

- **The PDF's pictures were never looked at.** The import read only the text (pdftotext). The maps carry the layouts:
  where each place stands, the shape of each village, each building's rooms. They were thrown away.
- **The map of the whole was not made from the book's map.** The settlements were then made from their names, at sizes
  and in looks that were the generator's, not the book's.
- **Interiors came from the text alone, or were designed freshly.** They did not come from the book's floor plans.

## What to build

1. **Image extraction** in `atlas.js import`:
   - `pdfimages -png` puts every picture in `story/source/images/`, with its page;
   - `pdftoppm -r 110` renders each page that holds a large picture to `story/source/pages/`, for the maps drawn as
     vector art;
   - an index, `story/source/images.json`, records each image's page, size and file.
2. **A map catalogue, `story/maps.json`**, written by the reader (the AI) from the pictures. For each map:
   - which place it is, its page and its scale, and where north is;
   - its keys with their pixel positions;
   - its named features;
   - its roads and paths, as lines of points.

   `atlas.js maps <dir>` checks it: every place in the knowledge base with a map has its map read, and every key on a
   map is a place or a room of the text.
3. **The region from its map**: `world --drawing` on the regional map, with the locations written from `maps.json`
   (the key's pixel position converted to the map's units) and the features traced from the picture. The coast tracer
   must treat an inland map's pale snow and hex grid as land, not sea: a `land: "all"` or `sea: "none"` setting for a
   valley like Barovia.
4. **A settlement from its map**: a `city` mode that takes the book's settlement map, with the buildings' positions,
   shapes and numbers from `maps.json`, and its streets as drawn, instead of growing a town.
5. **A building from its plan**: rooms traced from the plan (`maps.json`: each room's rectangle in squares, its doors,
   stairs, secret doors), written as the place's floors. `map-from-source` is the fallback when there is no plan.
6. **People and loot from the key text**, into those rooms: what `map-from-source` does for markers, by room key.
7. **Checks**: `ready` compares each map's keys with the places, rooms, people and treasure written.

## The first test

The user's own regional map of Barovia (19 Nov 2026). From it, a private scratch campaign was made, never committed,
holding the world map of Barovia as the book draws it:
- the lakes Zarovich, Baratok and Luna, and Tser Pool and Falls;
- the Raven, Luna and Ivlis rivers;
- the Svalich Woods, the mountains, and the Old Svalich Road;
- every lettered site at its spot.
