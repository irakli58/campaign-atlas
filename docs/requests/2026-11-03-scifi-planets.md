# Scientifically grounded sci-fi planet generation (the user, 3 Nov 2026)

Pasted by the user, verbatim, after the road network's development slider. They ask for research, an inspection of the
existing generators and an architecture to approve before major changes (section 20).

---

ATLAS — Scientifically Grounded Sci-Fi Planet Generation System
Claude, I want you to take everything you've learned and implemented about realistic world generation in Atlas and expand it into a comprehensive, scientifically grounded planetary generation system for Sci-Fi campaigns.
Atlas already has world generation systems involving tectonics, elevation, erosion, climate, biomes, rivers, oceans, wind patterns, settlements, roads, trade networks, and interactive maps.
I don't want you to rebuild these systems from scratch. I want you to adapt and expand them so they can generate scientifically plausible alien planets.
The goal is to create an interconnected galaxy filled with diverse planets that feel like actual celestial bodies rather than Earth maps with different colors.
Some planets should be habitable, some hostile but explorable, some completely uninhabitable, and some impossible to land on.
I want the generator to consider actual planetary science, astronomy, atmospheric physics, geology, and climate science.
1. Research Planetary Science Before Implementation
Before writing code, research how planets form and what determines their physical and environmental characteristics.
Study:

* Planet formation and protoplanetary disks.
* Stellar classification and how stars affect their planets.
* Orbital mechanics, orbital eccentricity, and axial tilt.
* Planetary mass, radius, density, and surface gravity.
* Atmospheric formation, composition, and atmospheric escape.
* Greenhouse effects and planetary temperature.
* Atmospheric circulation, prevailing winds, and jet streams.
* Planetary rotation and its effects on climate.
* Tidal locking and extreme day-night temperature differences.
* Plate tectonics, volcanism, erosion, and geological activity.
* Ocean formation, water cycles, and atmospheric moisture.
* Planetary magnetic fields and radiation exposure.
* Moon formation, orbital stability, and tidal effects.
* Conditions for life and habitability.
* Gas giants, ice giants, rocky planets, dwarf planets, and ocean worlds.

Use credible scientific sources such as NASA, ESA, peer-reviewed planetary science research, and published exoplanet studies.
Distinguish established scientific principles from speculative models and science-fiction assumptions.
I want the generated planets to be internally consistent, not merely filled with random statistics.
2. Planet Types and Random Generation
When Atlas generates a star system, it should create a believable collection of planets based on the star's properties and the system's formation history.
Possible planet types should include:

* Earth-like terrestrial planets.
* Desert planets.
* Ocean worlds.
* Frozen planets.
* Volcanic planets.
* Rocky barren planets.
* Airless worlds.
* Super-Earths.
* Gas giants.
* Ice giants.
* Toxic-atmosphere planets.
* High-pressure atmospheric worlds.
* Tidally locked planets.
* Ice-covered ocean worlds.
* Highly irradiated planets.
* Carbon-rich or otherwise unusual rocky planets, where scientifically defensible.
* Exotic and speculative planets appropriate to harder or softer science-fiction settings.

These should not simply be arbitrary categories assigned to planets.
A planet's environment should emerge from its physical characteristics, star, orbit, atmosphere, and geological history.
For example, a desert planet should be dry because of its climate and water availability, not simply because the generator randomly selected the desert category.
Allow DMs to generate random planets or manually customize their characteristics.
3. Detailed Planetary Properties
Every generated planet should have a detailed planetary profile.
Include scientifically related properties such as:
Physical characteristics

* Planet name and classification.
* Mass and radius.
* Average density.
* Surface gravity, where applicable.
* Escape velocity.
* Rotation period and length of day.
* Orbital period and length of year.
* Axial tilt.
* Orbital eccentricity.
* Distance from its star.
* Internal structure and geological activity.

Atmospheric characteristics

* Atmospheric composition.
* Surface atmospheric pressure, where applicable.
* Atmospheric density.
* Breathability for humans.
* Greenhouse effect.
* Cloud coverage.
* Atmospheric circulation.
* Prevailing wind patterns.
* Typical and extreme wind speeds.
* Storm frequency and severity.
* Atmospheric hazards.

Environmental characteristics

* Average surface temperature.
* Temperature variation by latitude, altitude, and season.
* Day-night temperature differences.
* Surface radiation levels.
* Magnetic field strength.
* Liquid water availability.
* Ocean coverage.
* Ice coverage.
* Geological hazards.
* Potential biological activity.
* Habitability classification.

Astronomical characteristics

* Parent star and stellar type.
* Number of moons.
* Moon sizes and orbital properties.
* Rings, if present.
* Tidal effects.
* Other relevant orbital characteristics.

Use realistic units and plausible relationships between these values.
For example, gravity should be calculated from mass and radius, rather than independently randomized.
Likewise, temperature should depend on stellar radiation, albedo, atmospheric effects, and other relevant factors.
Don't generate physically contradictory combinations without a clear speculative explanation.
4. Planet Habitability and Landing Classification
I want Atlas to distinguish between a planet being habitable and a planet being landable.
These are not the same thing.
A planet can be completely hostile to human life but still be explorable using spacesuits, vehicles, or specialized equipment.
Use classifications such as:
Naturally Habitable
Humans or other suitable species can survive on the surface without extensive protective equipment.
These planets should receive detailed world generation with continents, oceans, climates, biomes, and potentially ecosystems.
Conditionally Habitable
Humans can survive with some technological assistance, such as breathing equipment, protective clothing, or environmental shelters.
These planets should also support full surface exploration.
Hostile but Landable
The planet may have toxic air, extreme temperatures, high gravity, severe storms, or intense radiation.
Players can still land if they have suitable technology.
Generate detailed surface maps, geological features, and environmental hazards.
Not Landable
These are planets where conventional surface landing is impossible or inappropriate.
Examples include gas giants without a solid accessible surface, planets with unsurvivable conditions for the campaign's available technology, or worlds where landing is otherwise prohibited.
For these planets, do not generate an explorable world map.
Instead, display a scientifically plausible visual representation of the planet, including its atmosphere, clouds, rings, and visible features.
Players should still be able to inspect the planet's information, scan it, orbit it, and potentially interact with stations or moons.
A planet's landability should depend partly on the spacecraft and technology available to the players, rather than being an entirely fixed property.
5. Full World Generation for Landable Planets
For every landable planet, adapt Atlas's existing world generation engine to create a detailed planetary surface.
Use the existing systems for:

* Continental formation.
* Geological elevation.
* Mountains and valleys.
* Tectonic activity where applicable.
* Erosion and sedimentation.
* Oceans, lakes, and rivers.
* Climate zones.
* Wind circulation.
* Temperature distribution.
* Biomes and ecosystems.
* Natural resources.
* Settlements and civilizations.
* Roads and trade routes.

However, these systems must adapt to the actual planet.
Do not assume that every planet behaves like Earth.
For example:

* A planet without liquid surface water shouldn't generate ordinary rivers.
* A frozen world might have ice sheets, glaciers, and subsurface oceans.
* A volcanic world might have extensive lava fields and tectonic fractures.
* An ocean planet might have scattered islands or no exposed land.
* An airless planet shouldn't have ordinary wind-driven erosion.
* A tidally locked planet might have very different climates on its day and night sides.
* A high-gravity planet might have different relief and atmospheric characteristics.

The generator should use scientifically plausible processes appropriate to each environment.
6. Realistic Continents and Planetary Geography
For terrestrial planets with suitable geology, generate believable continents and geological features.
Use the existing realistic terrain generation research and algorithms, adapting them to the planet's physical conditions.
Consider planetary size, geological age, tectonic activity, internal heat, crust composition, volcanism, erosion, and the presence or absence of liquids.
Not every planet should have Earth-like plate tectonics.
Some worlds may have a largely stagnant crust, extensive volcanic provinces, ancient impact basins, or other geological structures.
The resulting geography should reflect those differences.
I want planets to look genuinely alien while still following understandable physical principles.
7. Planet-Specific Color Palettes
This is very important visually.
I don't want every generated planet to look like Earth with blue oceans and green continents.
The color palette should depend on the planet's actual environment, surface materials, atmosphere, and potential biology.
For example:

* Earth-like planets may have blue oceans, green vegetation, and varied terrain.
* Desert worlds may have tan, red, orange, ochre, or dark rocky landscapes.
* Frozen worlds may have white, pale blue, gray, or darker ice-covered terrain.
* Volcanic worlds may feature dark basalt, ash fields, and glowing lava.
* Barren worlds may have gray, brown, reddish, or mineral-colored surfaces.
* Alien biospheres may use unusual vegetation colors if their biology and stellar environment provide a plausible explanation.
* Ocean worlds may have different water colors depending on chemistry, suspended materials, depth, and atmospheric conditions.

These are examples, not rigid rules.
Generate colors from planetary properties instead of assigning arbitrary palettes.
Also distinguish between the planet's appearance from orbit and the colors used for its detailed surface map.
Give the DM an option to customize colors without changing the underlying physical simulation.
8. Advanced Atmospheric and Wind Simulation
I want the planetary climate system to be especially realistic.
Research and implement suitable approximations of atmospheric circulation.
Consider:

* Planetary rotation speed.
* Coriolis effects.
* Atmospheric pressure and density.
* Temperature gradients.
* Stellar heating.
* Axial tilt and seasons.
* Ocean-atmosphere interactions.
* Surface friction and topography.
* Prevailing winds.
* Jet streams.
* Hadley-like circulation where appropriate.
* Atmospheric superrotation on suitable planets.
* Extreme storms.
* Tidal locking.
* Atmospheric composition and heat retention.

Wind patterns should influence the generated surface.
For example, prevailing winds can affect precipitation, desert formation, dune orientation, coastal climates, erosion, and vegetation distribution.
A planet with powerful winds and a thin atmosphere should behave differently from one with powerful winds and a dense atmosphere.
Wind speed alone should not determine environmental effects; atmospheric density and other physical factors matter too.
Do not apply Earth's atmospheric circulation model unchanged to every planet.
9. Temperature and Climate Modeling
Calculate approximate planetary temperatures using stellar radiation, orbital distance, albedo, greenhouse effects, and atmospheric heat transport.
Then model regional variations based on:

* Latitude.
* Altitude.
* Ocean coverage.
* Continental interiors.
* Wind patterns.
* Seasons.
* Rotation.
* Axial tilt.
* Atmospheric density.
* Tidal locking.

A tidally locked planet might have a permanently illuminated hemisphere, a dark hemisphere, and a transition zone.
Whether these regions are habitable should depend on the atmosphere and heat transport, not simply on their location.
Avoid giving planets arbitrary temperatures unrelated to their stars and atmospheres.
10. Alien Biomes and Ecosystems
For planets capable of supporting life, generate ecosystems appropriate to their environment.
Don't automatically use Earth's forests, grasslands, and deserts everywhere.
Research how different stellar spectra, atmospheric compositions, gravity, water availability, and environmental pressures might influence hypothetical life.
Possible ecosystems could include:

* Earth-like forests and grasslands.
* Dense alien jungles.
* Unusual microbial landscapes.
* Bioluminescent ecosystems where biologically plausible.
* Fungal-like ecosystems.
* Coastal ecosystems.
* Subsurface ecosystems.
* Extreme-environment microbial life.
* Speculative alien vegetation adapted to different light conditions.

Keep a clear distinction between scientifically established biology and speculative xenobiology.
Not every habitable planet should contain life.
Not every life-bearing planet should contain complex organisms.
And not every planet with complex life should have intelligent civilizations.
11. Moons and Planetary Systems
Generate moons based on plausible planetary characteristics and formation scenarios.
Consider:

* Planetary mass.
* Orbital stability.
* Hill spheres.
* Roche limits.
* Tidal interactions.
* Captured bodies.
* Impact-generated moons.
* Regular satellite systems.

A planet might have no moons, one large moon, or many smaller satellites.
Moons should also be explorable when appropriate.
Some moons might have atmospheres, subsurface oceans, volcanic activity, ice fields, or settlements.
Use the same planetary generation principles for landable moons, with appropriate differences.
12. Population, Civilizations, and Settlements
Some planets should be inhabited, while others should be completely empty.
Distinguish between:

* Uninhabited planets.
* Planets with microbial or primitive life.
* Planets with complex native ecosystems.
* Planets with intelligent indigenous civilizations.
* Human or alien colonies.
* Industrialized worlds.
* Heavily urbanized planets.
* Mining colonies.
* Agricultural colonies.
* Research outposts.
* Military installations.
* Abandoned colonies.
* Ruined civilizations.

Population should be influenced by environmental conditions, available resources, technology, colonization history, and political circumstances.
A barely survivable planet might have a small research station or mining outpost rather than millions of inhabitants.
A prosperous habitable world could contain multiple countries, cities, transportation networks, and complex economies.
Use Atlas's existing city generation, faction, settlement, economy, and trade systems wherever applicable.
Do not rebuild them.
13. Planetary Settlements and Transportation
Transportation networks should reflect the planet's technology and environment.
An advanced civilization might have highways, railways, orbital elevators where physically and technologically plausible, or atmospheric transport.
A frontier colony might have only a few roads connecting its landing site, mines, and settlements.
A planet with extreme terrain or environmental hazards might rely heavily on aircraft or spacecraft rather than surface roads.
Adapt the existing infrastructure development and road density controls to individual planets.
14. Planet Visuals and Exploration
I want each planet to have an attractive, recognizable appearance from space.
When viewing a star system, players should see planets represented by appropriate planetary images or rendered globes.
The visuals should reflect their generated properties.
For example, a gas giant should have believable atmospheric bands and storms, while an icy planet should have a surface appropriate to its temperature and composition.
For non-landable planets, the orbital visualization and planetary information should be the primary experience.
For landable planets, clicking the planet should allow the DM to open its generated world map.
Ideally, the planetary globe and surface map should represent the same geography, so continents and major features are consistent between the two views.
Use the existing map navigation architecture wherever possible.
15. Integration With Atlas's Existing Galaxy Generator
Atlas already has Sci-Fi star system generation, connected systems, warp travel, fuel limitations, factions, and planetary exploration concepts.
Integrate this new system into those existing features.
When a star system is generated:

1. Generate the star or stars.
2. Establish plausible planetary orbits.
3. Generate planetary physical properties.
4. Determine atmospheres, temperatures, and environmental conditions.
5. Determine habitability and landability.
6. Generate moons and other relevant bodies.
7. Generate orbital visuals for every planet.
8. Generate detailed surface maps for landable planets when needed.
9. Determine whether life or civilizations exist.
10. Connect inhabited worlds to existing factions, economies, and interstellar trade networks.

For performance, consider generating detailed planetary surfaces only when a DM requests or opens them, while maintaining a deterministic seed so the same planet remains consistent.
A planet should not change its continents, atmosphere, or moons every time the DM opens it.
16. Scientific Consistency and Validation
Create a system that checks whether generated planetary characteristics are physically consistent.
For example:

* Gravity must match mass and radius.
* Orbital periods should be consistent with the stellar system.
* Temperatures should be compatible with stellar heating and atmospheric properties.
* Atmospheres should be plausible for the planet's gravity, temperature, and history.
* Liquid water should exist only where conditions allow it.
* Moons should have plausible orbital configurations.
* Climate and wind systems should reflect planetary rotation and atmospheric conditions.
* Ecosystems should be compatible with the environment or explicitly speculative.
* Settlements should have plausible survival requirements.

Use simplified scientific models where full physical simulation would be computationally impractical.
I don't need a supercomputer-grade climate simulation, but I do want the underlying relationships to make scientific sense.
17. DM Customization and Scientific Realism Settings
Allow the DM to customize planetary generation.
Possible controls include:

* Randomize an entire planet.
* Select or lock a planet type.
* Adjust gravity.
* Adjust atmospheric composition.
* Adjust atmospheric pressure.
* Adjust temperature.
* Adjust ocean coverage.
* Adjust geological activity.
* Adjust wind intensity.
* Set the number of moons.
* Choose whether a planet contains life.
* Choose whether intelligent civilizations exist.
* Adjust population and infrastructure development.
* Customize the planetary color palette.
* Choose whether a planet is landable with the campaign's technology.

If the DM changes a property, explain any important scientific consequences.
For example, changing atmospheric pressure might affect wind behavior, habitability, and surface conditions.
Offer three optional realism levels:
Hard Sci-Fi: Prioritize established physics and conservative scientific assumptions.
Balanced Sci-Fi: Follow real science but allow reasonable speculative environments and technologies.
Creative Sci-Fi: Allow more fantastical planets while maintaining as much internal consistency as possible.
The DM should always have final control.
18. Research and Testing
Before implementation, research real planets and exoplanets, including:

* Earth.
* Mars.
* Venus.
* Mercury.
* Jupiter.
* Saturn.
* Titan.
* Europa.
* Io.
* Pluto.
* TRAPPIST-1 planetary system.
* Other well-studied exoplanets and candidate ocean worlds.

Study how their environments differ and which physical processes produce those differences.
Use real planetary data as reference cases.
Test whether the generator can produce scientifically plausible analogues of these worlds without hardcoding their exact properties.
Also generate numerous random planets and evaluate their diversity, physical consistency, geography, climates, and visual appearance.
I want to see examples of Earth-like worlds, desert worlds, ocean worlds, frozen planets, volcanic planets, airless planets, and gas giants.
For each example, show its planetary profile, orbital appearance, and generated surface map if landable.
Explain why its characteristics make scientific sense.
19. Preserve Existing Atlas Functionality
Before changing anything, inspect the existing Sci-Fi generator and world generation codebase.
Identify which systems can be reused and which require additional planetary logic.
Do not create a completely separate world generator that duplicates existing terrain, climate, city, and map systems.
Instead, create a modular planetary layer that supplies appropriate physical parameters to the existing world generation systems.
Keep existing Fantasy, Modern, and Detective/Horror campaign functionality intact.
Preserve existing generated planets, maps, settlements, and manually edited content.
Make this system modular so DMs who don't want advanced planetary simulation can disable it or use simplified generation.
20. Implementation Approval
Before implementing major changes, present your proposed architecture, scientific research findings, and implementation plan to me.
Explain:

* Which existing Atlas systems you will reuse.
* Which new planetary systems need to be created.
* How planetary properties will be generated consistently.
* How surface maps will adapt to different planetary environments.
* How performance will be managed.
* Which scientific approximations are necessary.
* Which features are scientifically established versus speculative.
* Any improvements or additional features you recommend.

You can suggest new ideas that would make the planetary generation system more immersive or scientifically sophisticated, but do not implement additional features or make major architectural changes without my approval.
The ultimate goal is for Atlas to generate an enormous variety of believable alien worlds.
I want every planet to feel like a real place with its own physical history, atmosphere, gravity, weather, geology, climate, ecosystems, and potentially civilizations.
A planet shouldn't simply be an Earth map with different colors. Its entire environment should emerge from its physical characteristics and its place in the star system.
At the same time, Atlas must remain a practical tabletop RPG tool. Scientific realism should make the worlds more believable and interesting without making generation unnecessarily slow or complicated.
