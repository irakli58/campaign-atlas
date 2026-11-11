# A massive universal 2D and 3D asset library (the user, 11 Nov 2026)

Pasted by the user, verbatim, the fourth request of the afternoon. It asks first for an inventory and a plan (section
13); straightforward improvements on the existing infrastructure may go ahead; major architectural changes and large
downloads need the user's approval first. Queued after the interiors from a description, with which it works.

---

ATLAS — Massive Universal 2D & 3D Asset Library Expansion
Claude, I want to MASSIVELY expand Atlas's existing model and asset libraries.
Right now, the available models are too limited for the level of creative freedom I want.
My goal is for the DM to be able to place practically ANYTHING imaginable into a world, city, building, room, spaceship, dungeon, or other location.
This is not just about adding another 50 or 100 models.
I want Atlas to eventually have thousands of usable assets, with extensive variety across Fantasy, Medieval, Historical, Modern, Horror, Sci-Fi, and futuristic settings.
Most importantly, inspect the existing 2D and 3D model libraries before doing anything.
If an asset already exists, don't recreate it.
1. Massive Asset Categories
Expand the library across all of these categories.
Furniture and interiors

* Hundreds of chairs, tables, desks, beds, sofas, cabinets, wardrobes, and shelves.
* Kitchen furniture, appliances, dishes, utensils, and cookware.
* Bathroom fixtures.
* Office furniture.
* Rugs, curtains, paintings, mirrors, lamps, and decorations.
* Doors, windows, stairs, fireplaces, and architectural components.
* Storage boxes, crates, barrels, containers, and luggage.

Medieval and Fantasy

* Castle furniture, thrones, banners, and tapestries.
* Blacksmith equipment, anvils, forges, and tools.
* Medieval kitchens, taverns, and inns.
* Market stalls and merchant equipment.
* Alchemy laboratories.
* Magical artifacts, crystals, runes, and ritual objects.
* Dungeon furniture, traps, gates, chains, and cages.
* Weapons, armor, shields, and racks.
* Religious buildings and ceremonial objects.
* Farm equipment, carts, wagons, and stables.

Historical and Call of Cthulhu
I especially want extensive assets for 1920s–1930s campaigns.

* Period-appropriate desks, chairs, lamps, and furniture.
* Typewriters, telephones, radios, and gramophones.
* Filing cabinets and office equipment.
* Vintage medical equipment.
* Police stations and detective offices.
* Libraries and university laboratories.
* Jazz clubs and speakeasies.
* Vintage cars and street furniture.
* Newspapers, documents, books, and evidence objects.
* Industrial machinery and factories.
* Hotels, mansions, hospitals, and train stations.
* Archaeological equipment and museum artifacts.

Modern

* Modern houses, apartments, and offices.
* Hospitals and medical equipment.
* Police stations and security equipment.
* Restaurants, supermarkets, and shops.
* Schools and universities.
* Factories and warehouses.
* Vehicles and garages.
* Electronics, computers, televisions, and phones.
* Construction equipment.
* Street furniture and urban infrastructure.

Sci-Fi and Futuristic

* Spaceship control panels and consoles.
* Pilot seats and command bridges.
* Engines, reactors, and generators.
* Airlocks, bulkheads, and corridors.
* Cryogenic chambers.
* Research laboratories.
* Alien machinery.
* Medical pods.
* Cargo containers.
* Mining equipment.
* Robots and drones.
* Space station furniture.
* Futuristic weapons and equipment.
* Holographic displays.
* Communication terminals.
* Escape pods.
* Alien architecture.
* Spacecraft and vehicle models.

Nature and Outdoor Environments

* Trees, shrubs, grasses, and plants.
* Rocks, cliffs, boulders, and mineral formations.
* Mushrooms and fungi.
* Rivers, ponds, and environmental decorations.
* Alien vegetation.
* Crystals and geological objects.
* Ruins and abandoned structures.
* Campsites.
* Roads, bridges, fences, and walls.
* Agricultural equipment and crops.

Characters, Creatures, and Interactive Objects

* Human NPC models.
* Fantasy races and creatures.
* Animals and wildlife.
* Monsters.
* Robots.
* Alien creatures.
* Skeletons and remains.
* Containers and loot objects.
* Interactive doors and mechanisms.
* Traps and environmental hazards.

Include genre-appropriate variations.
2. Research Free Online Asset Libraries
I want you to investigate whether Atlas can legally download existing models rather than creating everything manually.
Research sources such as:

* Kenney — https://kenney.nl
* Poly Haven — https://polyhaven.com
* OpenGameArt — https://opengameart.org
* Quaternius — https://quaternius.com
* Sketchfab — https://sketchfab.com
* Other reputable open-source or free asset repositories.

Determine which assets can legally be downloaded, modified, and redistributed with Atlas.
Check each asset's actual license.
Prefer CC0 or similarly permissive assets.
Do not assume that every free model can be bundled commercially.
Investigate automated downloading only where officially supported and permitted.
3. Both 2D and 3D Assets
Atlas supports both 2D and 3D maps.
I want a much larger selection for both.
Where practical, an asset should have:

* A 3D model.
* A corresponding 2D top-down representation.
* Appropriate collision or placement dimensions.
* A consistent name and category.

For example, a medieval table should be usable in a 3D room and have a suitable top-down representation for a 2D map.
Investigate whether top-down sprites can be generated automatically from existing 3D models.
Don't manually recreate the same object twice if an automated conversion produces acceptable results.
4. Procedural Asset Variations
I don't want thousands of models that all look identical.
Add customization where technically appropriate.
For example, selecting a wooden table should allow changes to:

* Size.
* Shape.
* Color.
* Material.
* Texture.
* Rotation.
* Condition.
* Decorative details.

A chair might have multiple upholstery colors, wood types, or wear levels.
A Sci-Fi console might have different screen colors, layouts, and configurations.
A storage crate might be wooden, metallic, damaged, futuristic, or industrial.
Use material variants, parameterized geometry, and procedural details to expand variety without storing thousands of nearly identical files.
5. Universal Asset Search
With thousands of assets, browsing must remain easy.
I want a powerful search and filtering system.
For example, searching "1920s doctor's office" should return relevant furniture, medical equipment, lamps, cabinets, and decorations.
Support:

* Search by name.
* Search by category.
* Search by historical era.
* Search by genre.
* Search by room type.
* Search by material.
* Search by tags.
* Favorites.
* Recently used assets.
* Custom collections.

Show visual previews.
6. Import Custom Models
This is extremely important.
No built-in asset library can contain literally everything.
Allow users to import their own models and images.
Investigate support for common formats such as:

* GLB/glTF for 3D.
* OBJ where practical.
* PNG/WebP for 2D.
* SVG where appropriate.

Imported assets should be usable in the existing map editors.
Allow users to assign names, categories, tags, scale, and placement properties.
Make imported assets reusable through My Library.
7. Generate Missing Assets
If the DM searches for an object that doesn't exist, I want Atlas to help them create it.
For example:
"I need a damaged 1920s surgical examination table."
Ideally, Atlas should offer:

* Search existing assets.
* Create a variation of an existing asset.
* Assemble an object from reusable components.
* Import an external model.
* Generate a simple procedural model.
* Use optional AI-assisted asset generation if available.

Do not claim Atlas can generate arbitrary high-quality 3D models locally unless you've verified a practical solution.
Start with reliable procedural variations and composable assets.
8. Modular Downloadable Asset Packs
Thousands of models could consume significant storage.
Investigate downloadable asset packs organized by theme.
For example:

* Medieval Buildings & Furniture.
* Fantasy Dungeons.
* 1920s Detective & Horror.
* Modern Interiors.
* Sci-Fi Spaceships.
* Alien Planets.
* Nature & Environment.
* Vehicles & Machinery.
* Characters & Creatures.

Users should be able to install only the packs they need.
Display storage requirements and download progress.
Downloaded assets should work offline.
9. Integrate With Interior Generation
The expanded library must work with Atlas's existing building interior generator.
When generating a location from a description, Atlas should automatically choose appropriate assets.
For example:
"A wealthy 1920s doctor's mansion with a private laboratory."
Atlas should select period-appropriate furniture, medical equipment, bookshelves, lighting, and decorations.
It shouldn't randomly place futuristic consoles or medieval furniture.
Similarly, a Sci-Fi research station should use appropriate futuristic assets.
Use room purpose, genre, era, and context to select suitable models.
10. Complete Manual Editing
I want DMs to have extensive control over placed assets.
Where supported, allow:

* Move.
* Rotate.
* Resize.
* Duplicate.
* Delete.
* Change materials and colors.
* Group objects.
* Lock objects.
* Adjust placement and alignment.
* Save custom arrangements as reusable prefabs.

Make the editing workflow intuitive.
11. Performance
The library should remain usable even with thousands of assets.
Investigate:

* Lazy loading.
* Asset indexing.
* Thumbnail caching.
* Level of detail.
* Geometry instancing.
* Texture optimization.
* Memory management.
* Efficient storage.

Don't load the entire asset library into memory at once.
12. Preserve Existing Systems
Inspect the existing:

* 2D asset library.
* 3D model library.
* Map editors.
* Room generators.
* Furnishing systems.
* Object placement tools.
* My Library.
* Asset import functionality.

Reuse existing assets and components.
Don't rebuild working functionality.
Don't introduce incompatible models that break the renderer.
13. Implementation Plan
Before implementing major changes, provide:

1. An inventory of existing assets.
2. The biggest missing asset categories.
3. The best legally usable external asset libraries.
4. An estimate of how many additional assets can realistically be added.
5. A plan for 2D/3D asset compatibility.
6. A procedural variation system.
7. Custom asset import support.
8. Integration with interior generation.
9. Performance and storage considerations.
10. A phased implementation roadmap.

Start with the most useful categories, especially Fantasy, 1920s Call of Cthulhu, and Sci-Fi interiors.
You may implement straightforward improvements using existing infrastructure, but request approval before major architectural changes or large downloads.
Final Goal
I want Atlas to feel like a complete creative toolkit.
A DM should be able to build a medieval tavern, furnish a Victorian mansion, create a 1920s detective office, design a modern hospital, or construct an alien spaceship without constantly discovering that the necessary objects are missing.
I want an enormous, searchable, customizable library of 2D and 3D assets, plus the ability to import or create anything the library doesn't contain.
The ultimate goal is that the DM's imagination, not the available model selection, determines what can be built in Atlas.
