/* The library of premade worlds, stars and systems (the editing plan of 10 Nov 2026, stage 3; the user's request of that
   day: "a large, varied library of premade star and planet models... reuse that existing renderer"). Not pictures:
   recipes. A premade world is what the planet maker (atlas-planet.js) is to make (its mass, its water, its iron, its
   crust, its air) and a look for the pixel painter (atlas-pixelplanet.js: its colours, clouds, ice, bands, storm, rings,
   hue). Put at an orbit it is worked out again there from its recipe, so it is a real world of that place, or it keeps
   its own figures as the game master's setting; and since its picture's patterns come from its name, two worlds from
   the same premade one never look the same. A premade star is a real kind of star with its own mass, age, metals,
   light and warmth (and what makes it strange: a pulsar's beams, a black hole's disc and jets, a young star's dust).
   A premade system is a star and its worlds at their orbits. Plain code: the page and atlas.js both read it. */
(function (A) {
  "use strict";
  if (!A) return;
  const hstr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = hstr(seed) || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const r3 = v => +(+v).toPrecision(3);

  /* ---- the worlds: sixteen kinds, each with its recipe (for a star like the Sun: refA, its distance there) and its
          looks. accept: the kinds of world the planet maker may call it and it still is one of these */
  const CATS = [
    { id: "earthlike", name: "Earth-like worlds", accept: ["garden", "ocean"], want: q => ["garden", "ocean"].includes(q.kind) && q.liquid === "water" && q.tempC > -25 && q.tempC < 45, recipe: r => ({ env: "rock", mass: .7 + r() * .6, wf: .0002 + r() * .0004, life: "complex", refA: 1 + r() * .12 }),
      looks: [["Blue and green", { ground: "#8a7a5a", sea: "#2a5a8a", plant: "#4f7a3a", clouds: .55 }], ["Stormy", { ground: "#9a8060", sea: "#1f4f7a", plant: "#3f6a2a", clouds: .75 }], ["Dry continents", { ground: "#a8926a", sea: "#2f6a9a", plant: "#6a8a3a", clouds: .4, ocean: .5 }], ["Islands", { ground: "#7a6a50", sea: "#1a4a6a", plant: "#2f5a2a", clouds: .5, ocean: .85 }], ["Warm and clear", { ground: "#b09a70", sea: "#3a7aa0", plant: "#7a9a4a", clouds: .3, ice: .02 }], ["In an ice age", { ground: "#7f7060", sea: "#24506e", plant: "#4a6a3a", clouds: .6, ice: .35 }], ["Golden grass", { ground: "#9a7a4a", sea: "#205070", plant: "#8a7a2a", clouds: .45 }], ["Overcast", { ground: "#6a6a5a", sea: "#2a4a5a", plant: "#3a5a3a", clouds: .85 }], ["Vivid", { ground: "#a08060", sea: "#3070a0", plant: "#507a3a", clouds: .5, sat: 1.25 }], ["Deep forests", { ground: "#6a5a40", sea: "#1f4a6a", plant: "#23502a", clouds: .55, ocean: .6 }]] },
    { id: "desert", name: "Desert worlds", accept: ["desert", "rocky"], recipe: r => ({ env: "rock", mass: .1 + r() * .9, wf: Math.pow(10, -6 + r() * 1.2), pressure: +(.005 + r() * .3).toFixed(3), gas: "co2", refA: 1.3 + r() * .5 }),
      looks: [["Ochre dunes", { ground: "#c08a50", clouds: .1 }], ["Red, as Mars", { ground: "#b0603e", clouds: .05, ice: .06 }], ["Pale sands", { ground: "#d8c8a0", clouds: .12 }], ["Grey-brown waste", { ground: "#9a8a70", clouds: .08 }], ["Orange plains", { ground: "#c87a40", clouds: .15 }], ["Rust", { ground: "#9a4a2a", clouds: .05 }], ["Salt flats", { ground: "#e0dcd0", clouds: .1 }], ["Banded canyons", { ground: "#b07850", clouds: .05, craters: .5 }], ["Dust-storm world", { ground: "#c09060", cloudCol: "#c8a070", clouds: .55 }]] },
    { id: "barren", name: "Rocky barren worlds", accept: ["barren", "desert", "rocky"], recipe: r => ({ env: "rock", mass: .05 + r() * .35, wf: .000001, pressure: 0, refA: 1.2 + r() * .8 }),
      looks: [["Grey rock", { ground: "#7a746c" }], ["Brown rock", { ground: "#8a8070" }], ["Dark basalt", { ground: "#5a5650" }], ["Pale stone", { ground: "#9a9488" }], ["Umber", { ground: "#8a7a6a" }], ["Tan", { ground: "#a09080" }], ["Slate", { ground: "#706a66" }], ["Weathered", { ground: "#8f8578", craters: .6 }], ["Scarred", { ground: "#7f766c", craters: 1.6 }]] },
    { id: "cratered", name: "Cratered airless worlds", accept: ["barren", "dwarf"], recipe: r => ({ env: "rock", mass: .01 + r() * .07, wf: .000001, pressure: 0, refA: .6 + r() * .8 }),
      looks: [["As the Moon", { ground: "#9a9a96", craters: 2.4 }], ["As Mercury", { ground: "#7a7470", craters: 3 }], ["Bright highlands", { ground: "#b0aaa0", craters: 2.2 }], ["Dark and pitted", { ground: "#4a4640", craters: 3.5 }], ["Brownish", { ground: "#6a625a", craters: 2.6 }], ["Sand-coloured", { ground: "#a8a090", craters: 2 }], ["Battered", { ground: "#8a8680", craters: 4 }], ["Ash-grey", { ground: "#606060", craters: 2.8 }]] },
    { id: "frozen", name: "Frozen worlds", accept: ["ice", "dwarf"], recipe: r => ({ env: "rock", mass: .05 + r() * 1, wf: .05 + r() * .35, pressure: r() < .6 ? 0 : +(.01 + r() * .4).toFixed(3), gas: "n2", refA: 3.5 + r() * 3 }),
      looks: [["White ice", { ice: 1 }], ["Blue ice", { ground: "#cfe0ea" }], ["Cracked, as Europa", { ground: "#e0d8cc" }], ["Cream ice", { ground: "#f0ece0" }], ["Methane frost", { ground: "#c8d8e8", cloudCol: "#e8e0d0", clouds: .25 }], ["Dirty ice", { ground: "#b8b0a8" }], ["Glacial", { ground: "#dfe8ee", clouds: .2 }], ["Tinted pink", { ground: "#e8d8d8" }], ["Old dark ice", { ground: "#9b6a4a" }]] },
    { id: "ocean", name: "Ocean worlds", accept: ["ocean", "garden"], recipe: r => ({ env: "rock", mass: .8 + r() * 4, wf: .01 + r() * .04, refA: 1 + r() * .3 }),
      looks: [["Deep blue", { sea: "#1f4f7a", clouds: .55 }], ["Bright blue", { sea: "#2a6a9a", clouds: .45 }], ["Dark sea", { sea: "#164060", clouds: .6 }], ["Teal", { sea: "#2f7a8a", clouds: .5 }], ["Storm seas", { sea: "#1a3a5a", clouds: .85 }], ["Shallow turquoise", { sea: "#3a8aa0", clouds: .35 }], ["Grey seas", { sea: "#3a5060", clouds: .7 }], ["Green seas", { sea: "#2a5f50", clouds: .5 }], ["Ice-capped", { sea: "#204a6a", clouds: .5, ice: .3 }]] },
    { id: "volcanic", name: "Volcanic worlds", accept: ["lava"], recipe: r => ({ env: "rock", mass: .4 + r() * 2.5, wf: .00001, tect: "tidal", refA: .03 + r() * .03 }),
      looks: [["Black and burning", { ground: "#1d1a18" }], ["Lava seas", { ground: "#2a2220", ocean: .5 }], ["Ashen", { ground: "#3a3430", cloudCol: "#605850", clouds: .35 }], ["Cracked crust", { ground: "#201a1a", ocean: .15 }], ["Sulphurous", { ground: "#4a4020", cloudCol: "#a09040", clouds: .2 }], ["Glowing", { ground: "#302018", ocean: .7 }], ["Basalt fields", { ground: "#28282a", ocean: .25 }], ["Smoke-wrapped", { ground: "#2a2422", cloudCol: "#4a4440", clouds: .65 }]] },
    { id: "gas", name: "Gas giants", accept: ["gas", "hotjupiter"], recipe: r => ({ env: "gas", mass: 100 + r() * 1100, wf: .1, refA: 4.5 + r() * 5 }),
      looks: [["Banded, as Jupiter", { bands: ["#d8c0a0", "#b08860", "#e6d6bc", "#9a7a5a"], storm: true }], ["Pale, as Saturn", { bands: ["#e8dcb8", "#d8c49a", "#f2ead4"] }], ["Amber", { bands: ["#c8a070", "#a07040", "#e0c090", "#805030"] }], ["Grey-brown", { bands: ["#b0a090", "#8a7a6a", "#d0c0b0", "#706050"] }], ["Ruddy, storm-scarred", { bands: ["#d0b090", "#c08060", "#f0d8b8", "#a06040"], storm: true }], ["Golden", { bands: ["#e0d0a0", "#c0a060", "#f0e8c8"] }], ["Violet haze", { bands: ["#c0b0d0", "#9a88b0", "#e0d8ec"] }], ["Cool grey-blue", { bands: ["#a8b8c8", "#8898a8", "#d0dce8"] }], ["Copper", { bands: ["#c89878", "#a87050", "#e8c0a0"], bandsN: 12 }], ["Many-banded", { bands: ["#d8b8a0", "#b8987a", "#f0dcc8", "#987860"], bandsN: 16, storm: true }], ["Hot and blue", { bands: ["#3a5f9e", "#2f4f86", "#4a6fb0"] }], ["Hot and dark", { bands: ["#2b2522", "#3d302a", "#1e1a18"] }]] },
    { id: "icegiant", name: "Ice giants", accept: ["icegiant", "mini"], recipe: r => ({ env: "ice", mass: 10 + r() * 15, wf: .3, refA: 15 + r() * 15 }),
      looks: [["Cyan, as Uranus", { bands: ["#7fc8d8", "#6ab4cc", "#8fd2e0"], bandsN: 4 }], ["Deep blue, as Neptune", { bands: ["#4a70c8", "#3a5fb0", "#6a90e0"], storm: true }], ["Teal", { bands: ["#7ad0c8", "#5ab8b0", "#9ae0d8"] }], ["Sky blue", { bands: ["#90b8e8", "#7098d0", "#b0d0f0"] }], ["Stormy blue", { bands: ["#5a80b0", "#4a6a98", "#7aa0c8"], storm: true }], ["Pale ice", { bands: ["#a0d8e0", "#80c0d0", "#c0e8f0"], bandsN: 3 }], ["Indigo", { bands: ["#5060a8", "#404e90", "#6a7ac0"] }], ["Green-blue", { bands: ["#5ab0b8", "#4a98a0", "#7ac8d0"] }]] },
    { id: "toxic", name: "Toxic hothouse worlds", accept: ["toxic"], recipe: r => ({ env: "rock", mass: .6 + r() * 1.6, wf: .0002, pressure: 40 + r() * 60, gas: "co2", refA: .6 + r() * .3 }),
      looks: [["As Venus", { cloudCol: "#d9c58a" }], ["Pale yellow", { cloudCol: "#e0d0a0" }], ["Sulphur", { cloudCol: "#c8b070" }], ["Bone white", { cloudCol: "#d8d0c0" }], ["Dark haze", { cloudCol: "#a89060" }], ["Orange smog", { cloudCol: "#c09060" }], ["Greenish acid", { cloudCol: "#b0b878" }], ["Cream", { cloudCol: "#e8d8b8" }]] },
    { id: "superearth", name: "Super-Earths", accept: ["rocky", "ocean", "garden", "desert", "ice", "barren"], recipe: r => ({ env: "rock", mass: 2 + r() * 6, wf: Math.pow(10, -4.5 + r() * 2.5), refA: .9 + r() * .8 }),
      looks: [["Great continents", { ground: "#8a7050", sea: "#2a5070", plant: "#4a6a3a", clouds: .5, ocean: .5 }], ["Heavy and dry", { ground: "#a07a50", clouds: .2 }], ["Deep oceans", { sea: "#1a3f60", clouds: .65 }], ["Mountain world", { ground: "#7a7068", clouds: .3, ice: .2 }], ["Swamp world", { ground: "#5a5a3a", sea: "#3a4a3a", plant: "#4a5a2a", clouds: .7, ocean: .4 }], ["Red giant of rock", { ground: "#a0503a", clouds: .15 }], ["Grey-green", { ground: "#6a6a58", plant: "#5a6a4a", sea: "#2a4a5a", clouds: .5 }], ["Frosted", { ground: "#c8ccd0", clouds: .3, ice: .5 }], ["Cloud-wrapped", { ground: "#8a8070", sea: "#2a4a6a", clouds: .9 }]] },
    { id: "pressure", name: "High-pressure worlds", accept: ["toxic", "ocean", "rocky", "garden"], recipe: r => ({ env: "rock", mass: 3 + r() * 5, wf: .0005 + r() * .01, pressure: 80 + r() * 200, gas: r() < .5 ? "co2" : "n2", refA: 1 + r() * .6 }),
      looks: [["Thick tan haze", { cloudCol: "#c8b890", clouds: .9 }], ["Crushing blue", { sea: "#2a4a6a", cloudCol: "#a8b8c8", clouds: .85 }], ["Murky", { cloudCol: "#9a9070", clouds: .95 }], ["Grey soup", { cloudCol: "#a0a0a0", clouds: .9 }], ["Brown murk", { cloudCol: "#8a7050", clouds: .95 }], ["Pearl", { cloudCol: "#e0dcd4", clouds: .9 }], ["Green gloom", { cloudCol: "#8a9a70", clouds: .9 }], ["Violet gloom", { cloudCol: "#9a8aa8", clouds: .9 }]] },
    { id: "locked", name: "Tidally locked worlds", accept: null, want: q => !!q.locked, star: "M", recipe: r => ({ env: "rock", mass: .4 + r() * 1.5, wf: Math.pow(10, -5 + r() * 2), pressure: +(.1 + r() * 1.4).toFixed(2), gas: "n2", refA: .7 + r() * .6 }),
      looks: [["Burnt day, frozen night", { ground: "#8a6a50", ice: .4 }], ["Ice ring round its day side", { ground: "#7a6a5a", sea: "#2a4a6a", ice: .5, ocean: .3, clouds: .5 }], ["Scorched", { ground: "#6a4a3a", clouds: .1 }], ["Twilight band", { ground: "#7a7060", plant: "#3a3a4a", clouds: .4 }], ["Glass-dark", { ground: "#3a3530", clouds: .1 }], ["Storm at its noon", { ground: "#8a7a6a", clouds: .75 }], ["Frost-capped night", { ground: "#9a8a7a", ice: .6 }], ["Red-lit", { ground: "#9a5a40", clouds: .2, hue: -8 }]] },
    { id: "ringed", name: "Ringed worlds", accept: ["gas", "icegiant", "mini", "hotjupiter"], recipe: r => r() < .6 ? ({ env: "gas", mass: 60 + r() * 500, wf: .1, refA: 6 + r() * 6 }) : ({ env: "ice", mass: 12 + r() * 12, wf: .3, refA: 15 + r() * 10 }),
      looks: [["Broad ice rings", { bands: ["#e8dcb8", "#d8c49a", "#f2ead4"], rings: { on: true, width: 1.4, tint: "#e8e2d0" } }], ["Thin dark rings", { bands: ["#c8a070", "#a07040", "#e0c090"], rings: { on: true, width: .8, tint: "#7a6a5a" } }], ["Tilted rings", { bands: ["#d0b090", "#c08060", "#f0d8b8"], rings: { on: true, width: 1.2, tilt: 40 } }], ["Blue with rings", { bands: ["#7fc8d8", "#6ab4cc", "#8fd2e0"], rings: { on: true, width: 1, tint: "#c0d8e0", tilt: 70 } }], ["Golden rings", { bands: ["#e0d0a0", "#c0a060", "#f0e8c8"], rings: { on: true, width: 1.6, tint: "#e8c890" } }], ["Rose rings", { bands: ["#d8b8a0", "#b8987a", "#f0dcc8"], rings: { on: true, width: 1.1, tint: "#d8a8a0" } }], ["Wide pale rings", { bands: ["#b0a090", "#8a7a6a", "#d0c0b0"], rings: { on: true, width: 1.8, tint: "#d8d0c0" } }], ["Edge-on rings", { bands: ["#a8b8c8", "#8898a8", "#d0dce8"], rings: { on: true, width: 1.3, tilt: 5 } }]] },
    { id: "minerals", name: "Worlds of unusual minerals", accept: ["desert", "barren", "rocky", "lava"], recipe: r => ({ env: "rock", mass: .1 + r() * 1.5, wf: .000003, fe: r() < .5 ? .5 : .15, pressure: r() < .5 ? 0 : +(.01 + r() * .1).toFixed(3), gas: "co2", refA: .9 + r() * 1 }),
      looks: [["Sulphur yellow (as Io)", { ground: "#d8c040" }, "sulphur at its surface, from its volcanoes"], ["Iron red", { ground: "#a04020" }, "rich in iron oxides"], ["Carbon black", { ground: "#2a2828" }, "carbon-rich: graphite plains, perhaps diamond below (speculative)"], ["Salt white", { ground: "#e8e4d8" }, "dried seas of salt"], ["Copper green", { ground: "#4a8a6a" }, "copper minerals, weathered green (speculative)"], ["Cobalt", { ground: "#3a4a8a" }, "a blue mineral crust (speculative)"], ["Basalt black", { ground: "#3a3a40" }, "old lava plains of basalt"], ["Jade", { ground: "#5a8a70" }, "olivine sands, green"], ["Amethyst", { ground: "#7a5a8a" }, "a violet mineral crust (speculative)"], ["Rose quartz", { ground: "#c08a8a" }, "pink silica (speculative)"]] },
    { id: "alien", name: "Alien living worlds", accept: ["garden", "ocean"], want: q => ["garden", "ocean"].includes(q.kind) && q.liquid === "water" && q.tempC > -25 && q.tempC < 45, recipe: r => ({ env: "rock", mass: .7 + r() * .6, wf: .0002 + r() * .0006, life: r() < .5 ? "complex" : "simple", refA: 1 + r() * .12 }),
      looks: [["Purple forests", { ground: "#7a6a5a", sea: "#2a4a6a", plant: "#6a3a8a", clouds: .5 }, "plants that drink a red dwarf's light look dark purple to us (speculative)"], ["Black forests", { ground: "#6a6058", sea: "#1a3a4a", plant: "#2a2a30", clouds: .5 }, "plants that take every colour of a dim star's light (speculative)"], ["Red forests", { ground: "#8a7a5a", sea: "#2a5a7a", plant: "#8a3a2a", clouds: .45 }, "plants that turn away a bright star's blue (speculative)"], ["Yellow plains", { ground: "#9a8a5a", sea: "#2a5070", plant: "#a09a3a", clouds: .4 }, "speculative"], ["Teal jungles", { ground: "#5a6a5a", sea: "#204a5a", plant: "#2a7a7a", clouds: .7 }, "speculative"], ["Blue forests", { ground: "#6a6a70", sea: "#2a3a5a", plant: "#3a4a9a", clouds: .5 }, "speculative"], ["Green seas", { ground: "#8a7a5a", sea: "#2a6a4a", plant: "#4a7a3a", clouds: .5 }, "seas green with life (speculative)"], ["Orange skies", { ground: "#9a7a5a", sea: "#3a5a6a", plant: "#5a6a2a", sky: "#d99a4e", clouds: .4 }, "a haze that reddens its sky"], ["Violet seas", { ground: "#7a6a6a", sea: "#4a3a6a", plant: "#5a6a4a", clouds: .5 }, "speculative"], ["Glowing nights", { ground: "#6a5a4a", sea: "#1f3f5f", plant: "#3a5a4a", clouds: .4 }, "its life lights its nights (speculative)"]] }
  ];
  const WORLDS = [];
  for (const c of CATS) c.looks.forEach(([nm, look, say], i) => {
    const r = rng("lib|" + c.id + "|" + i), rec = c.recipe(r);
    WORLDS.push({ id: c.id + "-" + String(i + 1).padStart(2, "0"), cat: c.id, catName: c.name, name: nm, accept: c.accept, want: c.want || null, star: c.star || "G", recipe: Object.assign({}, rec, { mass: r3(rec.mass), wf: +rec.wf.toPrecision(2), refA: r3(rec.refA), fe: rec.fe != null ? rec.fe : .3, seed: 1 + Math.floor(r() * 9000) }, rec.pressure != null ? { pressure: rec.pressure } : {}), look, say: say || "" });
  });

  /* ---- the stars: real kinds, with their mass (Suns), age (millions of years), metals, light (Suns), warmth (K), size
          (Suns), and what makes them strange (special) */
  const S = (id, name, cls, mass, age, feh, lum, teff, radius, special, say) => ({ id, name, cls, mass, age, feh, lum, teff, radius, special: special || "", say: say || "" });
  const STARS = [
    S("m-quiet", "A quiet red dwarf", "M", .3, 8000, 0, .012, 3400, .3, "", "old and calm: the commonest star there is"),
    S("m-flare", "A flaring red dwarf", "M", .15, 800, 0, .0035, 3100, .19, "flare", "young: its flares can double its light in minutes"),
    S("m-trappist", "A tiny red dwarf, as TRAPPIST-1", "M", .09, 7600, .04, .00055, 2560, .12, "flare", "small and cool: its warm worlds orbit within a few days"),
    S("m-proxima", "A red dwarf, as Proxima Centauri", "M", .12, 4850, .2, .0016, 3040, .15, "flare", "the Sun's nearest neighbour, often flaring"),
    S("m-old", "An old red dwarf, as Barnard's Star", "M", .16, 10000, -.4, .0035, 3200, .19, "", "old, poor in metals, fast across the sky"),
    S("m-spots", "A spotted red dwarf", "M", .4, 2000, 0, .025, 3600, .4, "spots", "great starspots cross its face"),
    S("k-quiet", "A quiet orange dwarf", "K", .75, 6000, 0, .3, 4600, .75, "", "long-lived and steady: kind to life"),
    S("k-young", "A young orange dwarf, as Epsilon Eridani", "K", .82, 600, -.1, .34, 5080, .74, "spots", "young and spotted, with a dusty disc"),
    S("k-old", "An old orange dwarf, poor in metals", "K", .7, 11000, -1, .24, 4500, .7, "", "from the galaxy's first ages"),
    S("g-sun", "A Sun twin", "G", 1, 4600, 0, 1, 5772, 1, "", "as the Sun"),
    S("g-young", "A young Sun", "G", 1, 300, 0, .8, 5650, .95, "spots", "fierce flares and a strong wind"),
    S("g-old", "An old Sun", "G", .95, 9000, -.1, 1.6, 5600, 1.3, "", "brightening as it ages"),
    S("g-tauceti", "A star as Tau Ceti", "G", .78, 9000, -.5, .52, 5340, .79, "", "old, steady, with a broad belt of rubble"),
    S("g-acen", "A star as Alpha Centauri A", "G", 1.1, 5300, .2, 1.5, 5790, 1.22, "", "a little larger and brighter than the Sun"),
    S("f-procyon", "A yellow-white star, as Procyon", "F", 1.5, 1800, 0, 6.9, 6530, 2.05, "", "hotter, brighter, shorter-lived"),
    S("f-hot", "A hot F star", "F", 1.3, 1500, 0, 3.2, 6700, 1.4, "", ""),
    S("a-sirius", "A white star, as Sirius", "A", 2, 250, .5, 25, 9940, 1.7, "", "brilliant, blue-white, short-lived"),
    S("a-vega", "A white star, as Vega", "A", 2.1, 450, -.5, 40, 9600, 2.4, "", "spins so fast it bulges"),
    S("a-altair", "A white star, as Altair", "A", 1.8, 1200, 0, 10.6, 7700, 1.8, "", ""),
    S("b-regulus", "A blue-white star, as Regulus", "B", 3.8, 300, 0, 300, 12000, 4, "", "hot and bright"),
    S("b-hot", "A hot blue B star", "B", 8, 30, 0, 3000, 22000, 4.5, "", "it will not live long"),
    S("o-hot", "A blue O star", "O", 30, 3, 0, 200000, 38000, 10, "", "among the hottest and brightest stars; it will explode within a few million years"),
    S("r-arcturus", "An orange giant, as Arcturus", "R", 1.1, 7100, -.5, 170, 4290, 25, "", "a star like the Sun near its end, swollen"),
    S("r-aldebaran", "An orange giant, as Aldebaran", "R", 1.2, 6600, -.3, 440, 3900, 44, "", ""),
    S("b-giant", "A blue giant", "B", 10, 20, 0, 20000, 20000, 8, "giant", ""),
    S("r-betelgeuse", "A red supergiant, as Betelgeuse", "R", 18, 9, 0, 100000, 3500, 760, "super", "so vast it would swallow Jupiter's orbit; it will explode as a supernova"),
    S("b-rigel", "A blue supergiant, as Rigel", "B", 21, 8, 0, 120000, 12100, 79, "super", "one of the brightest stars known"),
    S("f-hyper", "A yellow hypergiant", "F", 40, 4, 0, 500000, 7000, 400, "super", "unstable, shedding its outer layers"),
    S("o-wr", "A Wolf-Rayet star", "O", 20, 5, 0, 300000, 70000, 2, "wolfrayet", "it has blown away its outer layers in a fierce wind"),
    S("d-hot", "A hot young white dwarf", "D", 1, 200, 0, .1, 25000, .012, "", "a dead star's bared core, still white-hot"),
    S("d-sirius-b", "A white dwarf, as Sirius B", "D", 1, 120, 0, .056, 25000, .008, "", ""),
    S("d-cool", "A cool old white dwarf", "D", .6, 9000, 0, .0003, 5000, .013, "", "cooling for billions of years"),
    S("n-quiet", "A neutron star", "N", 1.4, 1000, 0, .001, 600000, .000014, "", "the size of a city, the weight of the Sun"),
    S("n-pulsar", "A pulsar", "N", 1.4, 10, 0, .001, 600000, .000014, "pulsar", "its beams sweep round many times a second"),
    S("n-magnetar", "A magnetar", "N", 1.4, 5, 0, .001, 700000, .000014, "magnetar", "the strongest magnetic field known; it can wipe data from light years away"),
    S("x-quiet", "A quiet black hole", "X", 10, 1000, 0, 0, 0, .00003, "quiet", "nothing falls in: dark, seen only by what it bends"),
    S("x-feeding", "A feeding black hole", "X", 10, 1000, 0, 0, 0, .00003, "feeding", "a disc of gas swirls in, glowing"),
    S("x-active", "A black hole with jets", "X", 15, 1000, 0, 0, 0, .00003, "active", "jets of matter blast out from its poles"),
    S("l-warm", "A warm brown dwarf", "L", .07, 500, 0, .0001, 1900, .1, "", "too small to burn as a star: it glows as it cools"),
    S("t-cool", "A cool brown dwarf", "T", .045, 3000, 0, .00002, 1100, .09, "", "methane in its clouds"),
    S("y-cold", "A cold brown dwarf", "Y", .02, 8000, 0, .000002, 400, .09, "", "as cold as a summer's day, its clouds of water"),
    S("g-ttauri", "A young star in its dust", "G", 1, 2, 0, 2, 4500, 2.5, "ttauri", "still gathering, wrapped in the disc its worlds will form from")
  ];

  /* ---- systems: a star and its worlds (world presets at their distances, a for its own star), and belts */
  const SYSTEMS = [
    { id: "sys-sol", name: "A system like our own", star: "g-sun", worlds: [["cratered-02", .39], ["toxic-01", .72], ["earthlike-01", 1], ["desert-02", 1.52], ["gas-01", 5.2], ["ringed-01", 9.6], ["icegiant-01", 19.2], ["icegiant-02", 30]], belts: [2.7, 40], say: "rocky worlds within, giants beyond the frost line" },
    { id: "sys-trappist", name: "A red dwarf's seven worlds", star: "m-trappist", worlds: [["barren-03", .011], ["barren-01", .015], ["locked-02", .021], ["locked-04", .028], ["frozen-02", .037], ["frozen-01", .045], ["frozen-08", .062]], belts: [], say: "seven small worlds packed close, all turned one face to their star" },
    { id: "sys-hotjupiter", name: "A hot Jupiter and its company", star: "g-acen", worlds: [["gas-11", .05], ["superearth-01", 1.15], ["icegiant-05", 8]], belts: [3.5], say: "a giant that moved in close, and the worlds that survived it" },
    { id: "sys-pulsar", name: "A pulsar's dead worlds", star: "n-pulsar", worlds: [["cratered-04", .19], ["cratered-07", .36], ["barren-09", .46]], belts: [], say: "worlds that formed again from a supernova's wreckage" },
    { id: "sys-whitedwarf", name: "A white dwarf's ruins", star: "d-cool", worlds: [["frozen-09", 2.4], ["icegiant-07", 9]], belts: [.01, 4], say: "what is left after its star became a giant and shrank: a ring of shattered rock close in" },
    { id: "sys-young", name: "A young star in its dust", star: "g-ttauri", worlds: [["gas-06", 8]], belts: [1.5, 3, 20], say: "worlds still forming in the disc" },
    { id: "sys-blackhole", name: "A black hole's survivors", star: "x-feeding", worlds: [["frozen-05", 30], ["cratered-06", 60]], belts: [5], say: "cold worlds far from a dead star that collapsed" },
    { id: "sys-orange", name: "A long-lived orange dwarf with a living world", star: "k-quiet", worlds: [["barren-02", .2], ["alien-01", .55], ["ocean-04", .7], ["gas-03", 3]], belts: [1.6], say: "an old, steady star: billions of years for life" },
    { id: "sys-giant", name: "A dying giant's scorched worlds", star: "r-arcturus", worlds: [["volcanic-03", 2], ["desert-06", 6], ["gas-12", 14]], belts: [], say: "the swollen star has burnt what was near it" }
  ];
  const byId = {}; for (const w of WORLDS) byId[w.id] = w; for (const s of STARS) byId[s.id] = s; for (const s of SYSTEMS) byId[s.id] = s;
  // a premade world placed at a star: its orbit there (refA scaled by its star's light, so it gets the light it was
  // made for), and whether what the planet maker makes there is still of its kind
  const fitOrbit = (w, lum) => r3(w.recipe.refA * Math.sqrt(Math.max(1e-6, lum || 1)));
  const fits = (w, q) => w.want ? w.want(q) : (w.accept || []).includes(q.kind);
  A.library = { CATS: CATS.map(c => ({ id: c.id, name: c.name })), WORLDS, STARS, SYSTEMS, byId, get: id => byId[id] || null, fitOrbit, fits };
})(typeof ATLAS !== "undefined" ? ATLAS : null);
