// A second small example, to show the city map: a port town laid out with a dozen roads, a river, a harbour,
// a green and a keep. Everything between (the side streets, every house, lamp and tree) is grown from this.
// Change look to "modern" to see the same town with flat roofs and a clean plan.
ATLAS.configure({
  title: "The Drowned Bell of Saltreach",
  subtitle: "A bell that was lost with a ship has been heard ringing under the harbour, and the harbour master will not say why he has closed the east quay.",
  system: "Any investigation game",
  setting: "The port of Saltreach",
  gm: "GM",
  categories: [{ id: "town", name: "The town" }, { id: "water", name: "By the water" }],
  storageKey: "atlas-saltreach"
});

ATLAS.city({
  look: "old",                                   // "old" or "modern"
  seed: 41,                                      // the same seed always grows the same town
  sheet: { w: 300, h: 190, margin: 30 },         // the mapped area, in plan units, and the border of town drawn round it
  title: "A Plan of the Port of Saltreach",
  subtitle: "surveyed for the Harbour Commissioners",
  scaleLabel: "Scale of Chains",
  districts: { "Old Town": [80, 78], "Harbour": [215, 122], "Castle Hill": [222, 52], "The Marsh": [72, 156] },
  // [name, class, points, place it may run right up to]. Class 0 main road, 1 street, 2 lane, 3 alley.
  roads: [
    ["High Street", 0, [[-30, 62], [40, 60], [90, 66], [140, 62], [190, 58], [250, 52], [330, 48]]],
    ["Bridge Street", 0, [[140, 62], [144, 90], [150, 116], [156, 150], [160, 220]]],
    ["North Road", 0, [[140, 62], [136, 30], [130, -30]]],
    ["Quay Road", 0, [[150, 104], [190, 108], [226, 116], [262, 120], [330, 122]]],
    ["Castle Road", 1, [[190, 58], [205, 42], [214, 26], [222, -30]]],
    ["Fish Street", 1, [[226, 116], [230, 100], [228, 80], [222, 58]]],
    ["Marsh Lane", 1, [[90, 66], [84, 96], [72, 130], [62, 170], [54, 220]]],
    ["Tanners' Row", 1, [[40, 60], [36, 30], [30, -30]]],
    ["Rope Walk", 1, [[156, 150], [200, 158], [250, 172], [330, 180]]],
    ["Bell Lane", 2, [[190, 108], [194, 84], [190, 58]]]
  ],
  rivers: [{ pts: [[-30, 122], [30, 114], [90, 126], [150, 118], [200, 132], [236, 150]], hw: 5, smooth: 2, label: "River Wend", big: true, wharves: [60, 230] }],
  basins: [{ name: "The Harbour", pts: [[232, 136], [330, 130], [330, 190], [236, 176]] }],
  parks: [{ name: "The Green", pts: [[96, 18], [126, 16], [128, 46], [98, 48]] }],
  squares: [["Market Sq.", 112, 84, 4]],
  forts: [{ x: 244, y: 30, hw: 8, hh: 7, name: "The Keep" }],
  signs: [[176, 128, "Custom House Stairs"], [118, 128, "Ferry"]],
  roofs: { town: "#3e5a4f", water: "#7a2e3a" }   // roof colour of the campaign's places, by category
});

// Places appear on the city map where `at` says (plan units), or spiralled round the centre of their region if it
// is one of the city's districts. `model` chooses the building; see: atlas.js catalogue.
ATLAS.place("custom-house", { music: "docks", name: "The Custom House", category: "water", region: "Harbour", tier: 1, start: true, at: [204, 98], model: "town", tagline: "Where the harbour master keeps the east quay's ledgers under lock." });
ATLAS.place("st-brides", { music: "church", name: "St Bride's", category: "town", region: "Old Town", tier: 2, start: true, at: [70, 46], model: "church", tagline: "A church with one bell too few, and a sexton who counts them every night." });
ATLAS.place("the-anchor", { music: "tavern", name: "The Anchor", category: "water", region: "Harbour", tier: 2, start: true, model: "pub", tagline: "The pilots' inn, where the bell was first heard." });
ATLAS.place("saltworks", { music: "moor", name: "The Saltworks", category: "water", region: "The Marsh", tier: 2, start: true, model: "warehouse", tagline: "Pans, sheds and a causeway that is only there at low tide." });
ATLAS.place("the-keep", { music: "prison", name: "The Keep Gaol", category: "town", region: "Castle Hill", tier: 3, start: true, at: [214, 44], model: "hall", tagline: "The last crew of the lost ship were held here, once." });
