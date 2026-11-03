# Historically realistic road and trade networks (the user, 3 Nov 2026)

Pasted by the user, verbatim, right after the request for atlas-style settlement markers (2026-11-03-atlas-markers.md).
The paste ends mid-sentence ("over hundreds or"), as received.

---

Claude, I want Atlas to generate extremely detailed, geographically accurate, and historically realistic road and trade route networks connecting villages, towns, cities, ports, and neighboring countries.
Before implementing anything, conduct thorough research into how real-world roads and trade networks form and develop. I want the generation algorithms to be based on actual historical geography, transportation economics, and terrain constraints rather than randomly connecting settlements.
1. Research Real-World Trade Networks
Study how roads and trade routes developed historically, including:

* Why settlements became connected and how trade demand influenced road construction.
* How villages connected to market towns, regional cities, and major trading centers.
* How neighboring countries established international trade corridors.
* How mountains, rivers, forests, deserts, and wetlands influenced route selection.
* How ancient roads evolved into major trade routes and transportation networks.
* How trade routes influenced the founding and growth of settlements.
* How political borders, wars, tariffs, and security affected trade.
* How different transportation technologies changed the routes people used.

Research actual historical examples, including the Silk Roads, Roman road networks, medieval European trade routes, Alpine mountain passes, and major river trading systems.
Also investigate scientific and computational methods for reconstructing historical transportation networks, including least-cost path analysis, terrain-aware pathfinding, and network growth models.
Use reliable academic research, historical maps, geographical datasets, and archaeological studies wherever possible.
2. Realistic Terrain-Based Road Generation
Roads must respect the actual geography of the generated world.
Use Atlas's existing elevation, slope, rivers, mountains, biomes, coastlines, and terrain data.
Roads should:

* Follow natural valleys and accessible terrain.
* Use mountain passes rather than unrealistically crossing peaks.
* Avoid steep slopes, cliffs, glaciers, and difficult terrain where practical.
* Cross rivers at suitable bridges, fords, or ferry locations.
* Use switchbacks on steep terrain where appropriate.
* Follow natural geographical corridors.
* Avoid unnecessarily long detours when a practical shorter route exists.

A road should never simply cut through a mountain because two cities happen to be on opposite sides.
Mountains can be crossed, but only through geographically plausible routes and with engineering appropriate to the world's technological period.
3. Intricate and Natural Road Networks
I want the roads to form complex, believable networks.
Generate:

* Small paths connecting villages.
* Rural roads connecting farms and market towns.
* Regional roads between towns and cities.
* Major roads connecting economic centers.
* International trade corridors.
* Mountain caravan routes.
* Desert trade routes.
* Bridges, ferries, and important crossings.
* Roads connecting ports to inland settlements.

Roads should branch and intersect naturally.
Avoid connecting every settlement directly to every other settlement. Instead, create realistic transportation hierarchies with important junctions, regional hubs, and smaller connecting roads.
4. Realistic Trade Route Formation
Trade routes should emerge from actual economic relationships.
Consider what each settlement produces, consumes, and needs.
For example, agricultural villages should supply nearby towns, mining settlements should transport resources to trading centers, and major ports should connect inland economies to maritime trade.
Route importance should depend on trade volume, travel costs, security, transportation technology, and political relationships.
Cities at important intersections should have opportunities to grow into major trading centers.
5. International Trade Between Countries
Generate realistic trade connections between neighboring kingdoms, nations, and factions.
International routes should consider:

* Natural border crossings.
* Mountain passes.
* Navigable rivers.
* Ports and maritime connections.
* Political relationships.
* Customs and tariffs.
* Military security.
* Regional economic demand.

Not every neighboring country should have equally strong trade connections.
Hostile borders may restrict trade, while friendly countries may develop major commercial corridors.
6. Historical Road Development
I don't want roads to appear as if they were all planned simultaneously.
Use a simplified historical development process.
Small paths may gradually become major roads as settlements grow and trade increases.
Older roads may survive even after more efficient alternatives are constructed.
Some cities may develop because of important road intersections, while others may decline when trade routes shift.
The resulting network should look like it developed over centuries.
7. Rivers and Maritime Trade
Not all trade should happen on roads.
Use Atlas's existing rivers, coastlines, and ocean current systems to generate:

* River transportation routes.
* Coastal shipping routes.
* Ocean trading corridors.
* River ports and trading settlements.
* Connections between ports and inland roads.

Account for navigability, currents, winds, seasonal conditions, and the historical technology available.
8. Connect Roads to Existing City Generation
Atlas already has city generation, interactive city maps, and explorable building interiors.
Do not rebuild any of these systems.
When I click a city dot on the world map, it should still open its existing city map. Clicking houses and buildings should still open their existing interior layouts.
Roads generated on the world map should connect logically to the existing city street networks wherever possible.
Preserve all existing city generation and building exploration functionality.
9. Map Appearance
Display cities as realistic geographical map markers: dots with their names beside them.
Roads should appear as clean, readable lines connecting settlements.
Differentiate major trade roads, regional roads, local paths, and other transportation routes using appropriate line styles.
Make the map detailed without making it cluttered.
At higher zoom levels, show smaller settlements and minor roads. At lower zoom levels, emphasize major cities and important trade corridors.
10. Research-Based Testing
Before finalizing the implementation, compare Atlas-generated networks with real-world historical transportation maps.
I specifically want you to examine:

* Whether roads follow realistic terrain.
* Whether mountain crossings use actual passes.
* Whether river crossings make geographical sense.
* Whether villages connect logically to towns and cities.
* Whether trade routes reflect economic relationships.
* Whether international connections are realistic.
* Whether road density and complexity resemble real transportation networks.

Generate several test worlds with different terrain configurations.
Show the resulting transportation networks overlaid on the terrain and explain why major routes developed where they did.
Don't just claim the results are realistic because you used a pathfinding algorithm. Compare the actual generated maps with real-world examples and critically evaluate the differences.
11. Research Sources
As starting points, investigate these academic studies:

* Ancient road network formation: https://pmc.ncbi.nlm.nih.gov/articles/PMC9944230/
* Reconstructing the Tang–Tibet trade route using geographical analysis: https://pmc.ncbi.nlm.nih.gov/articles/PMC6936881/

Use these as starting references, not as your only sources. Find additional credible research on historical trade networks, geographical route selection, transportation economics, and terrain-aware network generation.
Explain which research findings you used and how they influenced the algorithms.
12. Preserve Existing Functionality
Inspect Atlas's existing world generation, settlement placement, city generation, roads, and trade systems before making changes.
Reuse existing systems where possible.
Preserve manually edited roads, settlements, cities, and building interiors.
Don't replace the existing generator until I have reviewed and approved the results.
**The ultimate goal is to generate a world where transportation networks feel like they evolved naturally over hundreds or
