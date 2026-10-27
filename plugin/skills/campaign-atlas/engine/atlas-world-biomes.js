/* The world map's land cover (the user asked, 27 Oct 2026, for far more terrain on the 2D world maps: trees and forests of
   every kind, mountains of every kind in natural ranges, water of every kind, landscapes, and great regions, each setting
   in its own style; docs/requests/2026-10-27-world-map-terrain.md). This file says what each kind of land is; it draws
   nothing (atlas-world-nature.js draws it, each look by its own hand) and is shared by the page and by atlas.js world.
   - The land under a world map is a grid of cells (world-terrain.js): a height, a wetness, and now a cover: 0 where the
     land is as its climate makes it, or the code of a kind of land laid there (by atlas.js world, or the game master's
     brush). The codes are kept in world-terrain.js and in the brush's strokes, so a code never changes: add at the end.
   - The climate (world.js climate:, or atlas.js world --climate) makes the warmth of each cell from how far north it is
     and how high; warmth and wetness together give the land its natural cover (a boreal forest, a savanna, tundra...).
   - Each kind says what grows on it (tree: the kinds of tree, and how thick they stand), what marks its ground (mark),
     how its mountains are coloured (mtn), whether it is water, and what the brush does to the height of the land. */
(function (root, factory) {
  const K = factory();
  if (typeof module === "object" && module.exports) module.exports = K;
  if (root && root.ATLAS) root.ATLAS.worldBiomes = K;
  else if (typeof ATLAS !== "undefined") ATLAS.worldBiomes = K;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // [id, name, group, setting ("" any, "fantasy", "scifi"), what it is]
  //   tree: [[kind, share], ...] and dens (how thick: 1 a forest, .1 a few trees); mark: what is on the ground;
  //   mtn: the colours of its mountains; water: laid on water (land under it becomes a lake); lift: what the brush does to
  //   the height ("mtn" mountains, "hill", "cone" a volcano, "low" lowland, "mesa" tablelands)
  const LIST = [
    ["natural", "As the climate makes it (clears what was painted)", "", "", {}],
    // ---- forests and woods
    ["temperate", "Temperate forest (oak, beech, maple)", "forest", "", { tree: [["broad", .78], ["oak", .22]], dens: 1 }],
    ["boreal", "Boreal forest (pine, spruce, fir)", "forest", "", { tree: [["spruce", .55], ["pine", .45]], dens: 1 }],
    ["rainforest", "Tropical rainforest", "forest", "", { tree: [["jungle", .85], ["palm", .15]], dens: 1 }],
    ["jungle", "Jungle", "forest", "", { tree: [["jungle", .7], ["vine", .3]], dens: 1, mark: "fern" }],
    ["bamboo", "Bamboo forest", "forest", "", { tree: [["bamboo", 1]], dens: .9 }],
    ["cloud", "Cloud forest", "forest", "", { tree: [["mossy", .7], ["jungle", .3]], dens: 1, mark: "mist" }],
    ["swampforest", "Swamp forest (willow, cypress)", "forest", "", { tree: [["willow", .6], ["swampcypress", .4]], dens: .8, mark: "pool" }],
    ["mangrove", "Mangrove forest", "forest", "", { tree: [["mangrove", 1]], dens: .9, mark: "pool" }],
    ["flooded", "Flooded forest", "forest", "", { tree: [["broad", .5], ["willow", .5]], dens: .7, mark: "flood" }],
    ["autumn", "Autumn forest", "forest", "", { tree: [["autumn", .85], ["pine", .15]], dens: 1 }],
    ["snowforest", "Snowy forest", "forest", "", { tree: [["snowpine", 1]], dens: 1, mark: "snow" }],
    ["deadforest", "Dead forest", "forest", "", { tree: [["dead", .8], ["fallen", .2]], dens: .7 }],
    ["burned", "Burned forest", "forest", "", { tree: [["burned", .75], ["fallen", .25]], dens: .6, mark: "ash" }],
    ["birch", "Birch wood", "forest", "", { tree: [["birch", 1]], dens: .85 }],
    ["giant", "Ancient forest of giant trees (redwood, cedar)", "forest", "", { tree: [["redwood", .7], ["cedar", .3]], dens: .9 }],
    ["palms", "Palm grove", "forest", "", { tree: [["palm", 1]], dens: .55 }],
    ["blossom", "Cherry blossom grove", "forest", "", { tree: [["cherry", 1]], dens: .8 }],
    ["woodland", "Open woodland", "forest", "", { tree: [["broad", .6], ["oak", .4]], dens: .32 }],
    // ---- open land
    ["grass", "Grassland and meadow", "ground", "", { tree: [["broad", 1]], dens: .015, mark: "meadow" }],
    ["steppe", "Steppe", "ground", "", { mark: "steppe" }],
    ["savanna", "Savanna (acacia, baobab)", "ground", "", { tree: [["acacia", .82], ["baobab", .18]], dens: .085, mark: "steppe" }],
    ["dunes", "Sand desert and dunes", "ground", "", { mark: "dune" }],
    ["rockdesert", "Rocky desert", "ground", "", { mark: "stones", mtn: "desert" }],
    ["badlands", "Badlands", "ground", "", { mark: "gully", mtn: "desert", lift: "hill" }],
    ["tundra", "Tundra", "ground", "", { tree: [["dwarf", 1]], dens: .03, mark: "lichen", mtn: "snow" }],
    ["icesheet", "Frozen waste and ice sheet", "ground", "", { mark: "ice", mtn: "snow" }],
    ["farmland", "Farmland", "ground", "", { mark: "fields" }],
    ["orchard", "Orchards", "ground", "", { mark: "orchard" }],
    ["vineyard", "Vineyards", "ground", "", { mark: "vines" }],
    ["terraces", "Terraced fields", "ground", "", { mark: "terrace", lift: "hill" }],
    ["volcanic", "Volcanic field (lava flows, ash)", "relief", "", { mark: "lava" }],
    ["saltflat", "Salt flat", "ground", "", { mark: "salt", lift: "low" }],
    ["drylake", "Dry lakebed", "ground", "", { mark: "cracks", lift: "low" }],
    ["marsh", "Marsh and wetland", "ground", "", { mark: "marsh", lift: "low" }],
    ["bog", "Bog", "ground", "", { tree: [["dwarf", 1]], dens: .04, mark: "bog", lift: "low" }],
    ["floodplain", "Floodplain", "ground", "", { tree: [["willow", 1]], dens: .03, mark: "channels", lift: "low" }],
    ["scrub", "Scrubland (olive, cypress)", "ground", "", { tree: [["olive", .65], ["cypress", .35]], dens: .14, mark: "scrub" }],
    // ---- mountains, cliffs and the shape of the land
    ["glacier", "Glacier and ice field", "relief", "", { mark: "glacier", mtn: "snow" }],
    ["mesas", "Mesas and buttes", "relief", "", { mark: "strata", mtn: "desert", lift: "mesa" }],
    ["canyon", "Canyon and gorge", "relief", "", { mark: "canyon", mtn: "desert" }],
    ["volcano", "Volcano", "relief", "", { mark: "lava", mtn: "volcanic", lift: "cone" }],
    ["crater", "Crater", "relief", "", { mark: "crater" }],
    ["sinkholes", "Sinkholes and karst", "relief", "", { mark: "sinkhole" }],
    ["stones", "Great stone formations", "relief", "", { mark: "pillars" }],
    ["highmtn", "Jagged alpine peaks", "relief", "", { mtn: "alpine", lift: "mtn" }],
    ["oldmtn", "Old rounded mountains", "relief", "", { mtn: "green", lift: "hill" }],
    // ---- water
    ["ice", "Frozen lake or sea", "water", "", { water: 1, mark: "floes" }],
    ["reef", "Reef and sandbars", "water", "", { water: 1, mark: "reef" }],
    ["glowwater", "Glowing lake", "water", "fantasy", { water: 1, mark: "glow" }],
    ["cursedwater", "Cursed water", "water", "fantasy", { water: 1, mark: "murk" }],
    ["acid", "Acid lake", "water", "scifi", { water: 1, mark: "bubbles" }],
    ["methane", "Methane sea", "water", "scifi", { water: 1, mark: "slick" }],
    ["lava", "Lava lake", "water", "", { water: 1, mark: "lavaglow" }],
    ["alienliquid", "Alien liquid", "water", "scifi", { water: 1, mark: "slick" }],
    // ---- fantasy
    ["enchanted", "Enchanted forest", "fantasy", "fantasy", { tree: [["enchanted", .8], ["broad", .2]], dens: 1, mark: "sparkle" }],
    ["glowforest", "Forest of glowing trees", "fantasy", "fantasy", { tree: [["glowtree", .7], ["enchanted", .3]], dens: .9, mark: "sparkle" }],
    ["corrupted", "Corrupted forest", "fantasy", "fantasy", { tree: [["twisted", .8], ["dead", .2]], dens: .85, mark: "veins" }],
    ["mushrooms", "Giant mushroom forest", "fantasy", "fantasy", { tree: [["mushroom", .4], ["toadstool", .15], ["mossy", .45]], dens: .75, mark: "spores" }],
    ["wasteland", "Magical wasteland", "fantasy", "fantasy", { tree: [["dead", 1]], dens: .03, mark: "rifts" }],
    ["corruptland", "Corrupted land", "fantasy", "fantasy", { tree: [["twisted", 1]], dens: .05, mark: "veins" }],
    ["vale", "Enchanted valley", "fantasy", "fantasy", { tree: [["enchanted", 1]], dens: .05, mark: "flowers" }],
    ["floating", "Floating mountains", "fantasy", "fantasy", { mark: "floating", lift: "hill" }],
    ["cursedmtn", "Cursed mountains", "fantasy", "fantasy", { mtn: "cursed", lift: "mtn", mark: "veins" }],
    // ---- science fiction
    ["alienforest", "Alien forest", "alien", "scifi", { tree: [["bulb", .7], ["frond", .3]], dens: 1 }],
    ["biolum", "Bioluminescent forest", "alien", "scifi", { tree: [["glowbulb", .8], ["frond", .2]], dens: .9, mark: "glowdots" }],
    ["crystalwood", "Crystalline vegetation", "alien", "scifi", { tree: [["crystal", 1]], dens: .8, mark: "shards" }],
    ["fungal", "Fungal jungle", "alien", "scifi", { tree: [["fungal", .75], ["toadstool", .25]], dens: 1, mark: "spores" }],
    ["spires", "Silicon spire fields", "alien", "scifi", { tree: [["spire", 1]], dens: .55 }],
    ["aliendesert", "Alien desert", "alien", "scifi", { mark: "dune", mtn: "alien" }],
    ["toxic", "Toxic land", "alien", "scifi", { mark: "toxic", mtn: "alien" }],
    ["crystalplain", "Crystalline plains", "alien", "scifi", { mark: "shards", mtn: "crystal" }],
    ["irradiated", "Irradiated waste", "alien", "scifi", { mark: "hazard", mtn: "metal" }],
    ["crystalmtn", "Crystal mountains", "alien", "scifi", { mtn: "crystal", lift: "mtn", mark: "shards" }],
    ["metalcliffs", "Metallic cliffs", "alien", "scifi", { mtn: "metal", lift: "mtn" }],
    // (27 Oct 2026: the biomes the climate simulation gives, world-ecology.js; also paintable)
    ["monsoon", "Tropical seasonal forest", "forest", "", { tree: [["jungle", .55], ["broad", .45]], dens: .9 }],
    ["subtropical", "Humid subtropical forest", "forest", "", { tree: [["broad", .6], ["oak", .25], ["pine", .15]], dens: 1 }],
    ["mixed", "Mixed forest", "forest", "", { tree: [["broad", .5], ["spruce", .5]], dens: 1 }],
    ["mediterranean", "Mediterranean woodland and scrub", "ground", "", { tree: [["olive", .6], ["cypress", .25], ["oak", .15]], dens: .3, mark: "scrub" }],
    ["gallery", "River woodland", "forest", "", { tree: [["willow", .5], ["broad", .5]], dens: .7 }],
    ["alpine", "Alpine meadow", "ground", "", { tree: [["dwarf", 1]], dens: .02, mark: "meadow", mtn: "snow" }],
    ["rock", "Bare rock and scree", "relief", "", { mark: "stones" }],
    ["colddesert", "Cold desert", "ground", "", { mark: "stones", mtn: "desert" }],
    // (27 Oct 2026, the user: "the biomes should be very simple: desert, flat lands, forest, mountains and maybe swamp":
    // the five the climate simulation gives a world now, and snow where it never melts)
    ["desert", "Desert", "simple", "", { mark: "dune", mtn: "desert" }],
    ["plains", "Flat lands", "simple", "", { tree: [["broad", .7], ["pine", .3]], dens: .02, mark: "meadow" }],
    ["forest", "Forest", "simple", "", { tree: [["broad", .55], ["oak", .2], ["pine", .25]], dens: 1 }],
    ["mountains", "Mountains", "simple", "", { mark: "stones" }],
    ["swamp", "Swamp", "simple", "", { tree: [["willow", .6], ["swampcypress", .4]], dens: .5, mark: "marsh", lift: "low" }],
    ["snow", "Snow and ice", "simple", "", { mark: "ice", mtn: "snow" }]
  ];
  const BY = {}, CODE = {};
  LIST.forEach(([id, name, group, setting, o], code) => { const b = Object.assign({ id, name, group, setting, code, tree: null, dens: 0 }, o); BY[id] = b; CODE[id] = code; });
  const GROUPS = [["simple", "The five kinds of land"], ["forest", "Forests and woods"], ["ground", "Open land"], ["relief", "Mountains and the shape of the land"], ["water", "Water"], ["fantasy", "Fantasy"], ["alien", "Alien worlds"]];
  const byCode = c => LIST[c] ? BY[LIST[c][0]] : null;

  // ---- the climate: how warm each cell is (0 frozen, 1 hottest), from how far north it stands (north is colder, as on
  //      the maps of our own north) and how high; [the far north, the far south, how wet]
  const CLIMATES = {
    temperate: [.5, .5, 1, "Temperate"], varied: [.1, .9, 1, "From frozen north to hot south"], cold: [.1, .36, 1, "Cold"], polar: [0, .16, .9, "Polar"],
    warm: [.56, .78, 1, "Warm"], tropical: [.8, .96, 1.15, "Tropical"], arid: [.55, .88, .5, "Arid"], wet: [.42, .62, 1.3, "Wet"]
  };
  const climateOf = c => CLIMATES[String(c || "").toLowerCase()] ? String(c).toLowerCase() : "temperate";
  // yf: how far down the map (0 the top), th: how high (0 the shore, 1 the highest peak)
  function warmth(climate, yf, th, wob) {
    const [a, b] = CLIMATES[climateOf(climate)];
    return Math.max(0, Math.min(1, a + (b - a) * yf - Math.max(0, th - .12) * .62 + (wob || 0)));
  }
  const wetness = (climate, m) => Math.max(0, Math.min(1, m / 255 * CLIMATES[climateOf(climate)][2]));

  // ---- the cover the climate gives a cell that nothing was laid on (temp, wet 0..1, th the height above the sea, 0..1)
  function natural(temp, wet, th) {
    if (temp < .06) return wet > .5 && th < .5 ? CODE.icesheet : CODE.icesheet;
    if (temp < .2) return wet > .8 && th < .14 ? CODE.bog : CODE.tundra;
    if (temp < .38) return wet > .85 && th < .14 ? CODE.bog : wet > .45 ? CODE.boreal : wet > .25 ? CODE.grass : CODE.steppe;
    if (temp < .63) return wet > .83 && th < .15 ? CODE.marsh : wet > .45 ? CODE.temperate : wet > .3 ? CODE.grass : wet > .2 ? CODE.steppe : wet > .12 ? CODE.rockdesert : CODE.dunes;
    if (temp < .8) return wet > .85 && th < .14 ? CODE.swampforest : wet > .62 ? (th > .3 ? CODE.cloud : CODE.temperate) : wet > .42 ? CODE.scrub : wet > .24 ? CODE.savanna : wet > .13 ? CODE.rockdesert : CODE.dunes;
    return wet > .86 && th < .12 ? CODE.mangrove : wet > .6 ? CODE.rainforest : wet > .34 ? CODE.savanna : wet > .16 ? CODE.rockdesert : CODE.dunes;
  }
  // the kind of mountain the land's climate raises, where its cover says nothing
  function mtnOf(temp, wet) {
    if (temp < .26) return "snow";
    if (temp > .62 && wet < .36) return "desert";
    if (temp > .36 && temp < .72 && wet > .7) return "green";
    return "rock";
  }
  // what a world's setting is, from its look: what the brush offers, and what atlas.js world lays down by itself
  const settingOf = look => ({ relief: "fantasy", painted: "fantasy", parchment: "fantasy", engraved: "modern", atlas: "modern", holo: "scifi", stars: "scifi" })[look] || "fantasy";
  // the kinds the brush offers for a setting, in their groups
  function brushKinds(setting) {
    return GROUPS.map(([g, label]) => [label, LIST.filter(([, , gr, st]) => gr === g && (!st || st === setting)).map(([id, name]) => [id, name])]).filter(([, l]) => l.length);
  }
  // an alien planet's kinds of land (atlas.js world --planet): its natural covers made alien
  const PLANETS = {
    lush: { forest: "alienforest", wet: "biolum", dry: "aliendesert", cold: "crystalplain", high: "crystalmtn", liquid: "water" },
    jungle: { forest: "fungal", wet: "biolum", dry: "alienforest", cold: "alienforest", high: "crystalmtn", liquid: "water" },
    desert: { forest: "spires", wet: "toxic", dry: "aliendesert", cold: "aliendesert", high: "metalcliffs", liquid: "acid" },
    ice: { forest: "crystalwood", wet: "crystalplain", dry: "icesheet", cold: "icesheet", high: "glacier", liquid: "methane" },
    volcanic: { forest: "spires", wet: "toxic", dry: "volcanic", cold: "volcanic", high: "volcanic", liquid: "lava" },
    toxic: { forest: "fungal", wet: "toxic", dry: "irradiated", cold: "toxic", high: "metalcliffs", liquid: "acid" },
    crystal: { forest: "crystalwood", wet: "crystalplain", dry: "crystalplain", cold: "crystalplain", high: "crystalmtn", liquid: "alienliquid" },
    barren: { forest: "spires", wet: "irradiated", dry: "aliendesert", cold: "crystalplain", high: "metalcliffs", liquid: "methane" },
    earthlike: null
  };
  return { LIST, BY, CODE, GROUPS, byCode, CLIMATES, climateOf, warmth, wetness, natural, mtnOf, settingOf, brushKinds, PLANETS };
});
