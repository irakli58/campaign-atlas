# Scientifically accurate alien terrain and planet surface customisation (the user, 11 Nov 2026)

Pasted by the user, verbatim, while the handmade campaigns (2026-11-11-blank-slate.md) were being built: inspect first,
then implement in stages; straightforward preset additions, colour controls and minor backward-compatible generation
improvements may go ahead; a significant rewrite of world generation, or a new physics simulation, needs the user's
approval first.

---

ATLAS — Scientifically Accurate Alien Terrain Expansion & Planet Surface Customization
Claude, I want you to improve the Sci-Fi planetary terrain system in Atlas.
Currently, the manual planet terrain editor seems to use many of the same terrain types as the Fantasy world editor. This makes alien planets feel too similar to ordinary Earth-like fantasy worlds.
I want much more variety in alien terrain, with interesting names, realistic colors, and scientifically plausible geological features.
My main priority is expanding the manual terrain editor, but you may make small, targeted improvements to the existing planet generation system if necessary. Do not significantly overhaul or rebuild the generation engine.
1. Research Real Planetary Geology
Before implementing anything, research real planetary environments using reliable scientific sources such as NASA, ESA, USGS, and published planetary science research.
Study the surfaces of:

* Mars — iron-rich regolith, dunes, sedimentary layers, polar ice.
* Venus — volcanic plains, high-pressure environments, basaltic terrain.
* Mercury — heavily cratered surfaces, impact basins, ancient volcanic plains.
* The Moon — basaltic maria, pale highlands, impact ejecta.
* Io — sulfur deposits, volcanic activity, lava flows.
* Europa — water-ice crust, fractures, ridges, disrupted icy terrain.
* Titan — hydrocarbon dunes, methane/ethane lakes, organic-rich deposits.
* Pluto — nitrogen ice plains, water-ice mountains, reddish organic materials.
* Enceladus — icy fractures, fresh ice deposits, cryovolcanic activity.

Use this research to design believable terrain types for fictional exoplanets.
Remember that the exact appearance of distant exoplanet surfaces is generally unknown, so distinguish established planetary science from plausible extrapolation.
2. Expand the Alien Terrain Library
Create a large collection of scientifically inspired terrain presets.
I want significantly more variety than the current Fantasy terrain palette.
Each terrain should have an interesting name, realistic color palette, and a geological explanation.
Examples include:
Rocky and mineral terrain

* Ferric Wastes — reddish iron-oxide-rich terrain.
* Basaltic Expanse — dark volcanic rock plains.
* Olivine Highlands — greenish mineral-rich formations.
* Hematite Ridges — iron-rich rocky elevations.
* Anorthosite Highlands — pale feldspar-rich crust.
* Silicate Badlands — weathered rocky terrain.
* Impact Breccia Fields — fragmented impact-generated rock.
* Salt-Encrusted Basins — bright mineral deposits.
* Serpentine Ridges — greenish altered ultramafic rock.

Volcanic terrain

* Sulfur Plains — yellow and orange sulfur deposits.
* Obsidian Fields — dark volcanic glass.
* Basalt Floodplains — extensive solidified lava.
* Caldera Highlands — volcanic collapse structures.
* Volcanic Ashlands — fine volcanic deposits.
* Fumarole Fields — areas with volcanic gas vents.
* Pyroclastic Deposits — volcanic fragment deposits.

Frozen terrain

* Nitrogen Ice Plains — Pluto-like frozen nitrogen deposits.
* Methane Frost Fields — frozen methane-rich terrain.
* Carbon Dioxide Ice Caps — Mars-like seasonal or permanent CO₂ ice.
* Water-Ice Highlands — solid water-ice formations.
* Tholin-Stained Ice — reddish-brown organic-rich icy surfaces.
* Cryovolcanic Fields — deposits from eruptions of volatile materials.
* Fractured Ice Plains — Europa-like cracked icy crust.

Sedimentary and desert terrain

* Iron-Oxide Dunes — reddish mineral sands.
* Silica Dune Seas — pale silicate-rich dunes.
* Hydrocarbon Dune Fields — dark organic-rich deposits.
* Layered Sedimentary Mesas — exposed sedimentary strata.
* Evaporite Flats — deposits left by evaporating liquids.
* Impact Glass Fields — glass-rich impact deposits.
* Ancient Lakebeds — dried sedimentary basins.

Liquid and shoreline terrain

* Methane Lakeshores — Titan-like hydrocarbon shorelines.
* Saline Basins — mineral-rich liquid or evaporite environments.
* Hydrothermal Fields — areas shaped by hot fluid circulation.
* Water-Ocean Coastlines — appropriate for planets with stable liquid water.
* Cryogenic Liquid Basins — suitable low-temperature liquids under appropriate conditions.

These are starting examples.
Research and add many more variations, but avoid creating dozens of nearly identical presets that differ only in name.
3. Scientific Color Palettes
I want planets to have visually distinct terrain without relying on random unrealistic colors.
Use material-based palettes inspired by actual planetary surfaces.
For example:

* Iron oxides: reds, oranges, browns.
* Basalt: dark gray and black.
* Sulfur-bearing deposits: yellows, oranges, and other composition-dependent colors.
* Water ice: white, blue-white, and gray depending on structure, impurities, and lighting.
* Organic-rich deposits: dark brown, reddish, and nearly black.
* Salts and evaporites: whites, pale grays, and other mineral-dependent colors.
* Olivine-rich materials: potentially greenish tones.

These should be defaults, not rigid restrictions.
Add manual controls for hue, saturation, brightness, and custom palettes.
I want to create unusual alien worlds while still having access to scientifically grounded starting points.
4. Planet-Specific Terrain Compatibility
The terrain library should consider the properties of the planet being edited.
For example:
A hot, airless rocky planet should primarily suggest rocky, cratered, and thermally appropriate terrain.
A Titan-like planet should suggest hydrocarbon deposits, icy materials, and methane/ethane-related landscapes.
A volcanically active world should suggest lava fields, volcanic deposits, and sulfur-rich regions where appropriate.
A frozen outer-system planet should suggest suitable ices, fractured crusts, and cryogenic deposits.
Use existing planetary data such as:

* Temperature.
* Atmospheric pressure.
* Atmospheric composition.
* Surface gravity.
* Planetary composition.
* Volcanic activity.
* Available surface liquids.

Only use properties that actually exist in Atlas or can be safely derived.
If the necessary information is missing, don't pretend to know whether terrain is scientifically compatible.
Allow the DM to override recommendations.
These are suggestions, not restrictions. The DM should always retain creative control.
5. Small Generation Improvements Are Allowed
Unlike my earlier request, you may make limited changes to the existing planet generation system if they are necessary to support the expanded terrain variety.
For example, you may:

* Improve how existing terrain categories select their visual palettes.
* Add more scientifically appropriate surface material variations.
* Make barren planets less visually repetitive.
* Improve how rocky, icy, volcanic, and sedimentary terrain is distributed.
* Add small compatibility checks based on existing planetary properties.
* Improve the visual distinction between different planet types.
* Allow the existing generator to select from the new terrain presets.

However, do not significantly change the underlying generation architecture.
Do not rebuild:

* Tectonic simulation.
* Erosion systems.
* Climate simulation.
* River generation.
* Elevation generation.
* Planetary orbital mechanics.
* The existing Fantasy world generator.

Do not introduce complicated new physics simulations unless they are absolutely necessary, and request approval first.
Any generation adjustments should be small, modular, and backward-compatible.
6. Improve the Manual Planet Terrain Editor
I want the terrain editor to feel like a proper alien worldbuilding tool.
Add or improve:

* Terrain categories.
* Searchable terrain presets.
* Terrain previews.
* Custom color controls.
* Saved custom presets.
* Terrain descriptions.
* Scientific compatibility indicators.
* Planet-specific recommended terrain.
* Easy switching between terrain types.

Reuse the existing manual painting, drawing, and editing tools.
Don't create a separate terrain editor if the current one can be extended.
7. Preserve Existing Planet Visuals
Atlas already has a 32-bit-style planetary image generation system.
Make sure the new terrain colors and surface materials remain visually consistent with the existing planet appearance system wherever technically feasible.
For example, if I paint large red iron-rich regions onto a planet's surface, its planetary overview should ideally reflect those changes.
However, don't rebuild the 32-bit planet renderer to accomplish this.
Investigate whether the existing renderer can accept updated color or surface information through a small integration.
If that would require major architectural changes, explain the limitation first.
8. Fantasy and Sci-Fi Should Remain Distinct
The Fantasy world editor should retain its existing terrain options and behavior.
The Sci-Fi editor should have additional scientifically inspired terrain presets.
Shared components are fine, but don't force the Fantasy generator to use Sci-Fi-specific geology.
Likewise, don't make every alien planet look like an Earth-like fantasy world with recolored forests and mountains.
9. Preserve Existing Work
Do not overwrite existing planets or manually edited terrain.
Keep existing saved terrain identifiers valid.
Make sure new presets don't unexpectedly change the appearance of old campaigns.
Any data migration must preserve existing worldbuilding work.
10. Inspect First, Then Implement
Before changing anything, inspect:

* Existing Sci-Fi planet terrain options.
* Fantasy terrain presets.
* Shared terrain editor components.
* Planet generation logic.
* Terrain rendering.
* Planetary properties.
* The 32-bit planet appearance system.
* Saved map and terrain data.

Identify which features can be reused.
Then implement the terrain expansion in manageable stages.
You may proceed with straightforward preset additions, color controls, and minor backward-compatible generation improvements.
If a change requires a significant rewrite of world generation, stop and ask for my approval.
Final Goal
I want Atlas to let me create visually diverse, scientifically believable alien worlds.
A planet with iron-rich deserts should look meaningfully different from a volcanic basalt world, a sulfur-covered moon, or a frozen nitrogen-ice planet.
The manual terrain editor should provide a rich selection of realistic materials, interesting terrain names, and customizable colors.
Small improvements to procedural generation are welcome where they help support these additions.
But the priority is more scientific terrain variety and better manual worldbuilding, not a major generation overhaul.

---

## Where it stands

Taken up after the handmade campaigns (2026-11-11-blank-slate.md), which were being built when it came.
