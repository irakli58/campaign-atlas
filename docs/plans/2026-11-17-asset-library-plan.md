# The asset library: inventory and plan (for the user's approval)

Answers `docs/requests/2026-11-17-asset-library-expansion.md` (the same as 2026-11-11-asset-library.md), section 13. Nothing large has been downloaded; nothing is built yet beyond what Atlas already has. Written 17 Nov 2026.

## 1. What Atlas has now

- **858 3D models made from code** (engine/atlas-models-cat.js and the model libraries, plus the dungeon, sci-fi and cave sets), each with its size, its materials (wood, metal, cloth… changeable per piece: `m: { frame: "oak" }`), its genres and its room uses. By genre (a model counts in each of its genres): historical 264, modern 288, post-apocalyptic 154, medieval and fantasy about 137, science fiction 86, plus horror, military and cyberpunk.
- **2D forms**: each model is flagged for the 2D maps (`d2`); the 2D map editor draws furniture top-down.
- **Importing your own models** (.glb) already works (atlas-models.js "models the game master brought in"; kept with the campaign).
- **My library** (atlas-mylib.js): systems, worlds, looks and places kept for every campaign, each an independent copy.
- **Furnishing by room** (atlas-modelui.js): a room's name and use pick fitting pieces of the campaign's age.

So Atlas does not start from nothing: what it lacks is breadth in some genres, search across thousands, and a way to bring in ready-made packs.

## 2. The biggest gaps

1. Science fiction interiors (86 pieces against 288 modern): bridges, consoles, cryo, medbays, engineering, cargo.
2. Characters, creatures and animals as placed pieces (Atlas draws people and portraits, but few creature figures).
3. 1920s detail: telephones, typewriters, gramophones, evidence, newspapers (some exist; the request wants many).
4. Vehicles of every age; nature props (rocks, plants, fungi) as placeable objects.
5. Search by era, room and material across everything; favourites, recently used, collections.

## 3. Sources that may legally be used

| Source | Licence | Bundle with Atlas? | Notes |
|---|---|---|---|
| [Kenney](https://kenney.nl/assets/furniture-kit) | CC0 (public domain) | Yes | Furniture Kit (140 files), many kits; low-poly, consistent style |
| [Quaternius](https://quaternius.com/packs/fantasypropsmegakit.html) | CC0 | Yes | About 80 packs, about 1,100 models (counts vary by source): fantasy props, sci-fi essentials, nature, medieval village |
| [Poly Haven](https://www.polyhaven.com/license) | CC0 for the assets | Yes (the files); the API has separate terms | Realistic props, textures, HDRIs. Its API terms differ from the asset licence: download by hand, not through the API, unless its terms allow |
| [OpenGameArt](https://opengameart.org/content/furniture-kit) | Set per file (CC0, CC-BY, CC-BY-SA, GPL…) | Only CC0 and CC-BY files, checked one by one | Mixed quality |
| Sketchfab | Per model (many CC-BY, some not downloadable) | Not by default | Only as the game master's own imports |

Kenney and Quaternius are the core: CC0, game-ready glTF, consistent low-poly styles. Each pack's own page is checked before it is used.

## 4. How many more is realistic

- Kenney and Quaternius together: roughly 1,500–2,500 usable pieces after leaving out duplicates of what Atlas makes.
- New parametric models in Atlas's own style: about 300–500 more in the gaps above (each one gives many variants by size and materials).
- With materials and sizes, the game master sees several thousand distinct objects. Reaching "thousands" honestly means counting variants; the plan says so on screen ("1,800 models, 9,000 variants").

## 5. 2D and 3D together

- Atlas's own models keep their 2D forms.
- For imported glTF: **render a top-down sprite from the model itself** (an orthographic camera straight down, flat light, transparent background) once when the pack is installed; kept beside the model. Tested on a sample before the rest.
- Each piece gets a footprint (width, depth, height) from its bounding box, for placing and blocking.

## 6. Variants without thousands of files

Atlas already varies by materials and size. Add, per kind: condition (new, worn, damaged, ruined: wear textures and a few broken parts), colour tint for cloth and paint, and for science fiction screen colours and layouts. For imported packs: material tints only (their geometry stays as made).

## 7. Your own models

Already: .glb. To add: .gltf with its files, .obj (with .mtl) converted on import, PNG/WebP/SVG for 2D pieces; on import the name, category, tags, era, scale and footprint are asked for; kept in My library to use in any campaign.

## 8. With the interior maker

Each imported piece is tagged with era, genre and room uses when its pack is prepared (by hand, once per pack, checked), so "Furnish the rooms" and "A building from a description" pick it as they pick Atlas's own: a 1920s doctor's study gets period pieces, never a sci-fi console.

## 9. Size and speed

- Packs are optional downloads from the project's GitHub releases, like the sound packs: Medieval & Fantasy, 1920s Detective & Horror, Modern Interiors, Sci-Fi Interiors, Nature, Vehicles, Characters & Creatures. Estimated 20–150 MB each (to be measured).
- An index (name, tags, era, room, footprint, thumbnail) loads at once; models load only when placed; instancing for repeated pieces; thumbnails cached.

## 10. The phases

1. **Search and browse** over what exists: one search across Atlas's models (era, genre, room, material, tags), favourites, recent, collections. No downloads.
2. **Import widened**: .gltf, .obj, 2D images, the questions on import, My library.
3. **The first packs**, the request's priority: Fantasy (Quaternius fantasy props and medieval village, Kenney castle and dungeon kits), 1920s (Atlas's own new parametric pieces, as no CC0 pack covers the period well), Sci-Fi interiors (Quaternius sci-fi essentials, Kenney space kits). Top-down sprites rendered, tags written, tested in furnishing.
4. **Variants**: condition and tints.
5. **The other packs**: modern, nature, vehicles, characters and creatures.
6. **Generate missing assets**: a variation of an existing piece, or one assembled from parts; AI-made 3D is not promised (not verified to work well locally).

## What needs your yes

- Downloading the first packs (phase 3; each pack's size shown first).
- Whether the downloadable packs go on the project's GitHub releases (as the sound packs do).
- Whether the low-poly styles of Kenney and Quaternius sit well beside Atlas's own models (a side-by-side picture before phase 3).

## Done since (17 Nov; the user: "make executive decisions")

- Found: the library browser already had search, filters, kits, favourites, recently used, previews and .glb import, so phase 1 was mostly there.
- Added: **search by room or place** (atlas-models.js `M.find`): a search's words also find the ready-made kits that speak of them, a room's other names counted (a speakeasy is a bar, a doctor's office a surgery or a hospital), rarer words weighing more, generic words ("office", "room") half, abandoned or ruined kits lower unless asked; **era words** (1920s, 1930s, twenties, Edwardian, Prohibition, Cthulhu → historical); **collections of the game master's own** ("To a collection…" on a model; "My collections" in the list; kept in the browser like the favourites). Tested: "1920s doctor's office" (nothing before; now 28, medical and police pieces of the period, no science fiction), "speakeasy" (bar pieces), "alchemist laboratory", "damaged crate".
- Done since, the order of a room search: pieces come by their kit's rank, then in the kit's own order (the pieces that make the room first), no longer mixed by name; a kit's words matched whole (a prison "warder" no longer counted as a hospital "ward", which had put cell bars and a chained skeleton in a 1920s doctor's office).
- Left: the packs (phase 3) cannot be downloaded from this cloud session (kenney.nl, quaternius.com, opengameart.org and polyhaven.com are refused by its network): to be made from the user's own computer, as the sound packs were.
- **Variants (17 Nov)**: found mostly there: a placed model's size, turn, height, condition (new to ruined), material of its main part from its family, colours and shape (width, depth, height and the model's own options). Added **Vary it** (atlas-modelui.js `vary`, also `M.vary`): another fitting material (a precious one only for what is already precious: no gold crate), its condition a step or two either way, a colour already given shifted a little in hue and lightness, its size within a tenth; several chosen are each varied differently; undone with Ctrl+Z. Tested on a chair, a crate and a console, five times each.
- **Manual editing and missing assets (17 Nov)**: the request's section 10 had move, turn, size, duplicate, delete, materials and colours, placement and snapping; added **Group** (p.gp: a click chooses the whole group), **Lock** (p.lk: not dragged, turned, nudged, varied or taken away until unlocked) and **Save as a set…** (the chosen models as an arrangement of the game master's own, kept in this browser like the library's favourites, listed under Your sets and put down anywhere like a kit; forgotten with its ×). Section 7: a search that finds nothing now shows the nearest models by any of its words and says plainly what can be done (adapt the nearest: material, wear, colour, shape, Vary it; combine pieces and save a set; bring in a .glb); nothing pretends to make a 3D model from words. Tested in the Kestrel example's editor: grouped, locked (the arrow keys left it), saved as a set and put down again; "velvet fainting couch" found the velvet settee and a lounge couch.
- **Section 9, the era of a described place (17 Nov)**: a building made from a description keeps the age the description names (`def.era`: 1920s, victorian, medieval, future, modern; "1920s" itself was not being read, now it is), and is laid out (its floors) and furnished in that age before the campaign's: the library's era words (atlas-modelui.js eraGenres, now ahead of a kit's own genres) and the room fixtures raised in 3D (atlas-room3d.js era(), through `A.__placeEra` while furnishing). Tested in the science fiction Kestrel example: "A 1920s doctor's office" furnished with no science fiction piece (a detective's desk, not a crew desk); the same description without its age keeps the campaign's.
