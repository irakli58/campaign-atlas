/* Terrain presets for painting alien worlds (the user, 17 Nov 2026: docs/requests/2026-11-17-scifi-terrain-presets.md,
   the original "much more visual variety" and its revision, "scientifically grounded, not just fantasy terrain with
   unusual colors"). A preset is a look and its explanation laid over a kind of land that already exists
   (atlas-world-biomes.js): the brush lays that kind (its behaviour: what it does to the height, whether it is a liquid)
   and the preset's colour as a tint the map's look reads (atlas-world-art.js). Nothing here touches how worlds are made.
   Each: [id, name, category, the kind it reuses, its colour, scientific?, what makes it look so, where it is plausible
   ("needs": checked against the planet's own figures where the page has them), a real place like it, and for a
   scientific one the range of colours its materials take (hue degrees, from..to, so the colour may be changed within it).
   Sources for the science: NASA/JPL and USGS planetary geology (Mars's iron oxides and sulfates, the lunar maria and
   anorthosite highlands, Io's sulfur, Pluto's nitrogen and methane ices and tholins, Titan's hydrocarbon dunes and seas,
   Europa's water ice and its reddish salts, Venus's basalt plains, Mercury's low-reflectance material). Speculative ones
   say so. */
(function (A) {
  "use strict";
  const CATS = [["rock", "Rocky and mineral"], ["volcanic", "Volcanic"], ["ice", "Frozen"], ["sediment", "Desert and sedimentary"], ["organic", "Organic-rich"], ["exotic", "Exotic but plausible"], ["creative", "Creative (no scientific claim)"]];
  // needs: cold (surface below this °C), warm (above), volcanic (an active or recent volcanic world), liquid (the
  // surface liquid it borders), air (pressure at least, bar)
  const P = [
    // ---- rocky and mineral
    ["ferric", "Ferric Wastes", "rock", "rockdesert", "#b4552d", 1, "Regolith coloured by fine iron oxides (nanophase ferric oxide) coating the grains: red-orange to brown as the oxidation and grain size vary.", "A world whose iron-bearing rock has been oxidised: by a thin oxidising air, water long ago, or radiation.", "Mars", [5, 30], {}],
    ["basaltic", "Basaltic Plains", "rock", "rock", "#3c3a38", 1, "Dark, fine-grained volcanic rock rich in iron and magnesium (pyroxene, plagioclase): low reflectance, grey to near black.", "Any rocky world with a volcanic past.", "The lunar maria; Venus's plains", [0, 40], {}],
    ["anorthosite", "Anorthosite Highlands", "rock", "highmtn", "#c9c3b6", 1, "Pale crust made almost wholly of plagioclase feldspar, floated up from an early magma ocean: bright grey-white.", "An old, airless or near-airless world with an ancient crust.", "The Moon's highlands", [30, 60], {}],
    ["olivine", "Olivine Fields", "rock", "rock", "#6f7a3c", 1, "Rock and sand rich in olivine, a magnesium-iron silicate that is olive to bottle green where it has not weathered.", "Young basalt, or a dry world where olivine survives unweathered.", "Mars's Nili Fossae; Hawaii's green sand", [60, 95], {}],
    ["hematite", "Hematite Ridges", "rock", "badlands", "#7a3324", 1, "Iron oxide (hematite) in grey crystalline or red fine-grained form, often concentrated by old water: reddish-brown to dark grey.", "A world with iron-rich rock and some history of water.", "Mars's Meridiani Planum 'blueberries'", [0, 20], {}],
    ["silicate", "Silicate Badlands", "rock", "badlands", "#9a7d62", 1, "Weathered silicate rock cut into gullies and ridges; buff to brown as clays and oxides form.", "A world with past wind or water erosion.", "Mars; Earth's badlands", [15, 40], {}],
    ["mercurian", "Low-Reflectance Plains", "rock", "rock", "#4a4846", 1, "Dark material thought to be darkened by graphite (carbon) in the crust: one of the darkest rocky surfaces known.", "An airless world close to its star.", "Mercury", [0, 40], {}],
    ["regolith", "Grey Regolith", "rock", "aliendesert", "#8b8781", 1, "Rock ground to dust by micrometeorites and darkened by space weathering (solar wind and tiny iron particles).", "Any airless rocky world.", "The Moon; asteroids", [0, 40], {}],
    ["serpentine", "Serpentine Highlands", "rock", "highmtn", "#5f7a58", 1, "Ultramafic rock altered by water into serpentine minerals: mottled green to grey-green.", "A world where water once worked through deep, iron-magnesium rock.", "Mars (detected from orbit); Earth's ophiolites", [80, 140], { }],
    ["clay", "Clay Terraces", "rock", "mesas", "#a07a5a", 1, "Layered clays (phyllosilicates) formed where water long touched the rock: tan, buff and reddish bands.", "A world that once had standing or flowing water.", "Mars's Mawrth Vallis", [15, 45], {}],
    ["ironmetal", "Metal-Rich Plains", "rock", "metalcliffs", "#6b6e72", 1, "Exposed iron-nickel metal or metal-rich rock: grey with a dull sheen (speculative for a whole plain; known from metal asteroids and meteorites).", "A metal-rich body, or the core of a world stripped of its mantle.", "The asteroid 16 Psyche (thought to be metal-rich)", [180, 230], {}],
    // ---- volcanic
    ["sulfur", "Sulfur Plains", "volcanic", "volcanic", "#d9c240", 1, "Sulfur and sulfur dioxide frost from volcanic plumes: yellow, orange and red as the sulfur's form changes with temperature, white where SO₂ frost lies.", "A volcanically active world; strongest where tides heat the interior.", "Io", [30, 60], { volcanic: 1 }],
    ["redsulfur", "Short-Chain Sulfur Rings", "volcanic", "volcanic", "#b8432a", 1, "Fresh short-chain sulfur (S₃, S₄) around a vent: red, fading to yellow as it changes to ordinary sulfur.", "Around an active volcanic vent.", "The rings around Io's Pele", [0, 25], { volcanic: 1 }],
    ["obsidian", "Obsidian Fields", "volcanic", "volcanic", "#1c1b1e", 1, "Volcanic glass, cooled too fast to crystallise: black, glossy, sharp.", "A world with silica-rich volcanism.", "Earth's obsidian flows", [200, 280], { volcanic: 1 }],
    ["floodbasalt", "Basalt Floodplains", "volcanic", "volcanic", "#2f2d2c", 1, "Vast sheets of runny lava that flooded the land and set into dark basalt.", "A world with (or that had) great outpourings of lava.", "Venus; the lunar maria; Earth's Deccan Traps", [0, 40], {}],
    ["ash", "Volcanic Ashlands", "volcanic", "volcanic", "#6d6964", 1, "Fine shattered rock and glass from explosive eruptions: grey to dark grey, lighter when weathered.", "A world with explosive volcanism (and enough air for ash to spread far).", "Earth; Mars's Medusae Fossae (possibly ash)", [0, 40], { volcanic: 1 }],
    ["fumarole", "Fumarole Fields", "volcanic", "volcanic", "#c9b25a", 1, "Hot vents breathing sulfurous gas: crusts of sulfur, white sulfates and red-orange iron around the vents.", "An active volcanic world.", "Io; Earth's Dallol and Solfatara", [30, 60], { volcanic: 1 }],
    ["lavalake", "Lava Lakes", "volcanic", "lava", "#e2541b", 1, "Molten silicate rock, glowing orange to red where it is open, with a dark cooling crust.", "An intensely volcanic world, or one hot enough for rock to melt.", "Io's Loki Patera; exoplanet 55 Cancri e (thought to have lava)", [0, 30], { volcanic: 1 }],
    ["venus", "Venusian Highland Crust", "volcanic", "highmtn", "#8a6a4a", 1, "Rock under a crushing, hot carbon dioxide air; seen through the clouds as dull orange-brown (the light filtered by the air).", "A hot world with a very thick air.", "Venus", [15, 40], { warm: 300, air: 50 }],
    // ---- frozen
    ["n2ice", "Nitrogen Ice Plains", "ice", "icesheet", "#e6e1d6", 1, "Solid nitrogen, flowing slowly as glaciers and cells: bright white to cream.", "Below about −210 °C (63 K), where nitrogen freezes.", "Pluto's Sputnik Planitia; Triton", [30, 60], { cold: -210 }],
    ["ch4frost", "Methane Frost Fields", "ice", "icesheet", "#d8dde0", 1, "Methane frost and snow on the heights; bright, faintly bluish or pinkish where tholins mix in.", "Below about −180 °C (93 K), where methane freezes.", "Pluto's Cthulhu-edged mountains; Eris", [180, 230], { cold: -180 }],
    ["co2ice", "Carbon Dioxide Ice Caps", "ice", "icesheet", "#f0efea", 1, "Dry ice laid down as seasonal and perennial caps; very bright, sculpted into pits and swirls as it sublimes.", "Below about −125 °C at a thin air (higher at more pressure).", "Mars's polar caps (the southern 'Swiss cheese' terrain)", [30, 60], { cold: -100 }],
    ["waterice", "Water-Ice Highlands", "ice", "glacier", "#dfe9ee", 1, "Crust of frozen water, hard as rock at these temperatures: white to bluish, streaked where salts or dust lie in it.", "Wherever water stays frozen: below 0 °C, and for millions of years below about −100 °C.", "Europa; Enceladus; Ganymede", [180, 220], { cold: 0 }],
    ["chaosice", "Chaos Terrain", "ice", "glacier", "#c9b9a4", 1, "Ice crust broken into rafts and refrozen, stained reddish-brown by salts or sulfur compounds from below.", "An ice world with a liquid ocean under its crust.", "Europa's Conamara Chaos", [15, 40], { cold: 0 }],
    ["tholinice", "Tholin-Stained Ice", "ice", "icesheet", "#9a5a3c", 1, "Ice coloured by tholins, dark red-brown organic compounds made when sunlight or radiation breaks up methane and nitrogen.", "A cold outer world with methane and radiation.", "Pluto's Cthulhu Macula; Arrokoth", [10, 30], { cold: -150 }],
    ["co2frost", "Seasonal Frost Fans", "ice", "icesheet", "#cfc8bd", 1, "Thin seasonal frost; in spring jets of gas through it scatter dark fans of dust over the bright frost.", "A cold world with seasons and a thin air.", "Mars's southern spiders and fans", [20, 50], { cold: -80 }],
    ["blackice", "Dark Ice Plains", "ice", "icesheet", "#3a3f46", 1, "Ice darkened by dust, carbon or long radiation weathering: dark grey to black (darker than fresh ice by far).", "A cold world with dust or carbon on its ice, or an old irradiated surface.", "Callisto's dark plains; Iapetus's dark side", [190, 230], { cold: 0 }],
    ["cryovolc", "Cryovolcanic Deposits", "ice", "glacier", "#cdd6db", 1, "Water, ammonia and salts erupted from below as a slush or plume and frozen: smooth, bright, often bluish.", "An ice world with internal heat (tides, radioactivity).", "Enceladus's tiger stripes; Ceres's Ahuna Mons", [180, 220], { cold: 0 }],
    // ---- desert and sedimentary
    ["fedunes", "Iron-Oxide Dunes", "sediment", "dunes", "#a8562c", 1, "Wind-blown sand coated with iron oxide: rust-red to dark brown (basaltic sand underneath is darker).", "A world with a wind and oxidised iron.", "Mars's dune fields", [5, 30], { air: .002 }],
    ["basaltdunes", "Dark Basaltic Dunes", "sediment", "dunes", "#3e3a3a", 1, "Sand of dark basalt grains, too fresh for oxides to redden: grey to blue-black.", "A world with wind and volcanic rock.", "Mars's Nili Patera dunes; Iceland's black sands", [190, 260], { air: .002 }],
    ["silicasand", "Silica Sand Seas", "sediment", "dunes", "#e1cf9c", 1, "Quartz and other light silicate sand sorted by long weathering: pale cream to gold.", "A world with long weathering by wind or water.", "Earth's ergs", [35, 55], { air: .01 }],
    ["gypsum", "Gypsum Dunes", "sediment", "dunes", "#ece6da", 1, "Sand of gypsum (calcium sulfate) from dried lakes: brilliant white.", "A world where salty water evaporated.", "Mars's north polar gypsum dunes; Earth's White Sands", [30, 60], { air: .002 }],
    ["sulfate", "Sulfate Flats", "sediment", "saltflat", "#ddd2b8", 1, "Evaporite beds of sulfate salts left by drying water: pale cream, white and buff.", "A world where water once evaporated.", "Mars's Gale crater sulfate unit; Meridiani", [30, 55], {}],
    ["evaporite", "Evaporite Basins", "sediment", "drylake", "#d9d1c4", 1, "Dry lakebeds of salts (chlorides, sulfates, carbonates) left as water evaporated: white to pastel crusts.", "A world with water, now or once, in closed basins.", "Earth's playas; Mars's chloride deposits", [20, 60], {}],
    ["saltcrust", "Salt-Encrusted Plains", "sediment", "saltflat", "#f2f0ea", 1, "A bright crust of salt over a flat basin; cracked into polygons as it dries.", "A dry world with salty water at or below its surface.", "Earth's Salar de Uyuni", [30, 60], {}],
    ["layered", "Layered Sedimentary Mesas", "sediment", "mesas", "#b07c58", 1, "Stacked beds of sediment laid by water or wind and cut into mesas, the layers showing as bands of tan, buff and red.", "A world with a long sedimentary history.", "Mars's Mount Sharp; Earth's Colorado Plateau", [10, 40], {}],
    ["carbonate", "Carbonate Plains", "sediment", "saltflat", "#cfc5ae", 1, "Rock of carbonates (calcite, dolomite, magnesite) formed in water: pale grey to cream.", "A world that had water and carbon dioxide together.", "Mars's Jezero crater; Earth's limestones", [30, 60], {}],
    // ---- organic-rich
    ["hcdunes", "Hydrocarbon Dune Fields", "organic", "dunes", "#3b2f27", 1, "Dunes of organic grains (tholin-like hydrocarbons and nitriles) that fell from a hazy air: dark brown.", "A cold world with a thick methane-nitrogen air.", "Titan's Shangri-La", [15, 35], { cold: -150, air: .5 }],
    ["hcshore", "Hydrocarbon Lakeshores", "organic", "marsh", "#4e4235", 1, "Wet ground beside seas of liquid methane and ethane, soaked with organics.", "Only where methane or ethane is liquid: about −180 to −160 °C with an air near Titan's (1.5 bar).", "Titan's Ligeia and Kraken Mare shores", [20, 40], { cold: -150, air: .5, liquid: "methane" }],
    ["hcsea", "Methane-Ethane Seas", "organic", "methane", "#1f2a33", 1, "Liquid methane and ethane: dark and very still under a thick, hazy air.", "About −180 to −160 °C (93–110 K) with about 1.5 bar of air.", "Titan's Kraken Mare", [190, 230], { cold: -150, warm: -185, air: .5 }],
    ["organichaze", "Haze-Fall Plains", "organic", "aliendesert", "#8a6a48", 1, "Ground buried under organic haze that drifted down from the air for ages: orange-brown.", "A cold world with a thick methane-rich air under ultraviolet light.", "Titan's plains", [20, 40], { cold: -120, air: .5 }],
    ["carbonaceous", "Carbonaceous Plains", "organic", "aliendesert", "#2a2826", 1, "Rock rich in carbon, organics and clays, like the primitive meteorites: very dark grey-black.", "A primitive, carbon-rich body.", "The asteroids Bennu and Ryugu", [0, 40], {}],
    // ---- exotic but plausible
    ["impactglass", "Impact Glass Fields", "exotic", "crater", "#4c4a40", 1, "Rock melted by a great impact and frozen to glass and breccia: dark, glossy beads and shards.", "Any rocky world with large impacts.", "Libyan desert glass; lunar glass beads", [40, 90], {}],
    ["ejecta", "Bright Ray Ejecta", "exotic", "crater", "#d8d4cb", 1, "Fresh rock thrown from a young crater, not yet darkened by space weathering: bright rays.", "Any airless world with young craters.", "The Moon's Tycho rays", [30, 60], {}],
    ["salts", "Hydrated Salt Stains", "exotic", "icesheet", "#b0765a", 1, "Salts brought up from a buried ocean and darkened by radiation: reddish-brown streaks on ice (thought to be sodium chloride and sulfates).", "An ice world with an ocean below and radiation from a nearby giant.", "Europa's lineae", [10, 30], { cold: 0 }],
    ["sodiumchloride", "Radiation-Coloured Salt Plains", "exotic", "saltflat", "#d8c76a", 1, "Table salt turned yellow by radiation (colour centres), as experiments show it would on Europa: speculative as a whole plain.", "An irradiated world with salt at the surface.", "Europa's Tara Regio (yellow, thought to be irradiated salt)", [40, 60], { cold: 0 }],
    ["perchlorate", "Perchlorate Soils", "exotic", "aliendesert", "#b59372", 1, "Soil laced with perchlorate salts, which hold water and are toxic: looks like ordinary oxidised soil, a hidden danger.", "A dry, oxidising world.", "Mars (Phoenix lander)", [15, 40], {}],
    ["subduction", "Rare Mineral Exposures", "exotic", "crystalplain", "#4f7f86", 1, "Exposed beds of unusual minerals (e.g. copper carbonates, glaucophane): blue-green; speculative as a large region.", "A world with varied, water-altered geology.", "Earth's malachite and blueschist outcrops", [170, 200], {}],
    // ---- creative (from the user's first message: any colour, no scientific claim)
    ["crimson", "Crimson Wastes", "creative", "aliendesert", "#8e1f22", 0, "Deep red rocky terrain.", "", "", null, {}],
    ["violet", "Violet Barrens", "creative", "aliendesert", "#6a3f8a", 0, "Purple alien landscape.", "", "", null, {}],
    ["azure", "Azure Flats", "creative", "crystalplain", "#2f7fd0", 0, "Bright blue mineral plains.", "", "", null, {}],
    ["emerald", "Emerald Crust", "creative", "crystalplain", "#2e9a5a", 0, "Green mineral-rich terrain.", "", "", null, {}],
    ["cobalt", "Cobalt Ridges", "creative", "metalcliffs", "#3d5a8a", 0, "Blue-grey mineral formations.", "", "", null, {}],
    ["amethyst", "Amethyst Highlands", "creative", "crystalmtn", "#7d4fb0", 0, "Purple crystalline mountains.", "", "", null, {}],
    ["crystal", "Crystal Fields", "creative", "crystalplain", "#bfe0ef", 0, "Crystalline formations.", "", "", null, {}],
    ["glassdunes", "Glass Dunes", "creative", "dunes", "#a9c6cf", 0, "Reflective desert terrain.", "", "", null, {}],
    ["biolum", "Bioluminescent Groves", "creative", "biolum", "#3fd6c0", 0, "Glowing alien vegetation.", "", "", null, {}],
    ["ember", "Ember Wastes", "creative", "volcanic", "#c1441c", 0, "Red and orange volcanic landscapes.", "", "", null, {}],
    ["magma", "Magma Fields", "creative", "lava", "#ff6a1a", 0, "Glowing lava terrain.", "", "", null, {}],
    ["methaneflats", "Frozen Methane Flats", "creative", "icesheet", "#bcd9ec", 0, "Pale blue icy plains.", "", "", null, {}],
    ["glacialwaste", "Glacial Wastes", "creative", "glacier", "#e3f0f7", 0, "White and blue ice fields.", "", "", null, {}],
    ["cryohigh", "Cryogenic Highlands", "creative", "glacier", "#a8c8e0", 0, "Icy mountain regions.", "", "", null, {}],
    ["ashen", "Ashen Expanse", "creative", "volcanic", "#7a7672", 0, "Grey ash-covered land.", "", "", null, {}],
    ["ironstone", "Ironstone Highlands", "creative", "highmtn", "#a65a2a", 0, "Rusty orange mountains.", "", "", null, {}],
    ["shattered", "Shattered Badlands", "creative", "badlands", "#7d6a5a", 0, "Fractured rocky terrain.", "", "", null, {}],
    ["toxicmarsh", "Toxic Marshes", "creative", "toxic", "#7fa13a", 0, "Greenish swamp terrain.", "", "", null, {}],
    ["acidic", "Acidic Basins", "creative", "acid", "#c9d23a", 0, "Yellow-green liquid-covered terrain.", "", "", null, {}],
    ["rust", "Rust Deserts", "creative", "dunes", "#b9592a", 0, "Orange-red deserts.", "", "", null, {}],
    ["fungalforest", "Fungal Forests", "creative", "fungal", "#a06a9a", 0, "Alien mushroom-like vegetation.", "", "", null, {}],
    ["petrified", "Petrified Forests", "creative", "deadforest", "#8a7d6e", 0, "Ancient mineralised vegetation.", "", "", null, {}]
  ].map(([id, name, cat, base, col, sci, why, where, ref, range, needs]) => ({ id: "p:" + id, name, cat, base, col, sci: !!sci, why, where, ref, range, needs }));
  const BY = Object.fromEntries(P.map(p => [p.id, p]));

  /* ---- colour: hex <-> hue, saturation, lightness */
  const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return [128, 128, 128]; const v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  const rgbHex = c => "#" + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  function toHsl(hex) { const [r, g, b] = hexRgb(hex).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]; }
  function fromHsl(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return rgbHex([f(0) * 255, f(8) * 255, f(4) * 255]); }
  // (is a colour within a scientific preset's range of hues? greys and near-whites count as in range)
  function inRange(p, hex) { if (!p || !p.range) return true; const [h, s] = toHsl(hex); if (s < 12) return true; const [a, b] = p.range; return a <= b ? h >= a - 8 && h <= b + 8 : h >= a - 8 || h <= b + 8; }

  /* ---- the advice: is this preset plausible on this world? (advisory only; never stops the brush). planet: { tempC,
          pressure, liquid, volcanic } as far as the page knows; an unknown figure is said to be unknown */
  function advise(p, planet) {
    if (!p || !p.sci) return "";
    const n = p.needs || {}, w = planet || {}, out = [], unk = [];
    if (n.cold != null) { if (w.tempC == null) unk.push("its temperature"); else if (w.tempC > n.cold + 15) out.push(`${p.name} needs it colder than about ${n.cold} °C; this world's surface is about ${Math.round(w.tempC)} °C.`); }
    if (n.warm != null && n.warm > -100) { if (w.tempC == null) unk.push("its temperature"); else if (w.tempC < n.warm - 30) out.push(`${p.name} is a hot world's terrain; this one is about ${Math.round(w.tempC)} °C.`); }
    if (n.warm != null && n.warm <= -100 && w.tempC != null && w.tempC > -150) out.push(`Liquid methane would boil away at about ${Math.round(w.tempC)} °C: ${p.name} is unlikely here.`);
    if (n.air != null) { if (w.pressure == null) unk.push("its air pressure"); else if (w.pressure < n.air) out.push(`${p.name} needs more air than this world has (${w.pressure} bar; about ${n.air} bar or more).`); }
    if (n.liquid && w.liquid && w.liquid !== n.liquid) out.push(`${p.name} borders ${n.liquid} seas; this world's liquid is ${w.liquid}.`);
    if (n.volcanic && w.volcanic === false) out.push(`${p.name} wants an active volcanic world; this one is not known to be.`);
    if (!out.length && unk.length) return `Plausibility unknown: the page does not know ${[...new Set(unk)].join(" or ")} for this world.`;
    return out.join(" ");
  }

  A.terrainPresets = { CATS, LIST: P, BY, toHsl, fromHsl, hexRgb, rgbHex, inRange, advise };
})(typeof ATLAS !== "undefined" ? ATLAS : (typeof window !== "undefined" ? (window.ATLAS = window.ATLAS || {}) : {}));
