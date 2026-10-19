// A kit: the buildings of Tbilisi, Georgia, made for the place (references/cities.md, "Kits").
// Use it in a campaign set in Tbilisi:  node atlas.js kit use <campaign> tbilisi
// Old Tbilisi: two- and three-storey houses of brick and plaster in ochre, cream and faded rose, under red tin and
// tiled roofs, with carved wooden balconies painted sky blue or left bare; Georgian churches of pale stone with a tall
// drum and a conical roof; the walls of Narikala along the ridge; the domed sulphur baths of Abanotubani; the glass
// canopy of the Bridge of Peace; the Mother of Kartli on the hill. Scale: one square is about 8 metres.
ATLAS.kit({
  name: "Tbilisi",
  for: "Tbilisi, Georgia: Old Tbilisi and the centre, from the 19th century to today",

  // the ordinary streets: laid over the map's age (modern or industrial)
  look: {
    brick: ["#d9c29c", "#e4d3b1", "#cfa98b", "#e7d9c4", "#c99b7d", "#dcc7a1", "#bba68d"],
    stone: ["#ebe0cb", "#e2d4b9", "#d7c3a3", "#efe7d7", "#d9cbb3"],
    ware: ["#a88a6c", "#9c8064", "#b39476"],
    slate: ["#9c5b3f", "#8b4f37", "#7b7571", "#a9674b", "#6f6b67"],
    tile: ["#a95d3f", "#9d5439", "#b36b49"],
    flats: ["#8f8a84", "#a09a92", "#7d7974", "#b0a79c"],
    landmark: 0xeadcc4, lmRoof: 0x8b5b45,
    pitched: 0.55,          // over half the roofs are pitched or hipped, red tin and tile
    tall: [1.05, 2.1]       // two to four storeys
  },

  // carved wooden balconies: sky blue in the old town round the baths and Sioni, bare wood across the river
  dress: [
    { kind: "balcony", share: 0.5, near: [165, 140], r: 70, color: "#6f97ab", trim: "#2f3f48" },
    { kind: "balcony", share: 0.3, near: [210, 120], r: 80, color: "#7b5a3a", trim: "#3e2c1c" },
    { kind: "balcony", share: 0.12, color: "#8a6a4a", trim: "#3e2c1c" }
  ],

  // the landmarks, in squares of the plan about their centre; size is the width they were drawn at, so each is scaled
  // to its true footprint on the map
  models: {
    // Holy Trinity (Sameba): a vast cross-domed cathedral on a stepped podium, a tall drum under a gilded cone
    sameba: { size: 12, parts: [
      ["box", "stone", 0, 0, 0, 12, 1.1, 12], ["box", "stone", 0, 1.1, 0, 10, .5, 10],
      ["box", "stone", 0, 1.6, 0, 9.4, 4.4, 3.8], ["box", "stone", 0, 1.6, 0, 3.8, 4.4, 9.4],
      ["box", "stone", -2.6, 1.6, -2.6, 2.4, 3.6, 2.4], ["box", "stone", 2.6, 1.6, -2.6, 2.4, 3.6, 2.4], ["box", "stone", -2.6, 1.6, 2.6, 2.4, 3.6, 2.4], ["box", "stone", 2.6, 1.6, 2.6, 2.4, 3.6, 2.4],
      ["roof", "#8b8f8a", 0, 6, 0, 9.8, 1.5, 4.1], ["roof", "#8b8f8a", 0, 6, 0, 9.8, 1.5, 4.1, 1.5708],
      ["cylinder", "stone", 0, 6.8, 0, 3.3, 3.6, 3.3], ["cone", "gold", 0, 10.4, 0, 3.7, 2.8, 3.7],
      ["box", "gold", 0, 13.2, 0, .16, 1.5, .16], ["box", "gold", 0, 14.1, 0, .9, .16, .16],
      ["cylinder", "stone", -3.2, 5.2, -3.2, 1.2, 1.4, 1.2], ["cone", "gold", -3.2, 6.6, -3.2, 1.35, 1.2, 1.35],
      ["cylinder", "stone", 3.2, 5.2, -3.2, 1.2, 1.4, 1.2], ["cone", "gold", 3.2, 6.6, -3.2, 1.35, 1.2, 1.35],
      ["cylinder", "stone", -3.2, 5.2, 3.2, 1.2, 1.4, 1.2], ["cone", "gold", -3.2, 6.6, 3.2, 1.35, 1.2, 1.35],
      ["cylinder", "stone", 3.2, 5.2, 3.2, 1.2, 1.4, 1.2], ["cone", "gold", 3.2, 6.6, 3.2, 1.35, 1.2, 1.35]
    ] },
    // Sioni: an old Georgian church of pale stone, cross-domed, with a drum and a grey conical roof
    sioni: { size: 6, parts: [
      ["box", "stone", 0, 0, 0, 6, 2.6, 3.4], ["box", "stone", 0, 0, 0, 3.4, 2.6, 5.4],
      ["roof", "#7f7a74", 0, 2.6, 0, 6.2, 1.1, 3.6], ["roof", "#7f7a74", 0, 2.6, 0, 5.6, 1.1, 3.6, 1.5708],
      ["cylinder", "stone", 0, 3.2, 0, 2, 2.2, 2], ["cone", "#6f6a64", 0, 5.4, 0, 2.3, 1.6, 2.3], ["box", "dark", 0, 7, 0, .1, .7, .1]
    ] },
    // Metekhi: a small cross-domed church on the cliff over the river
    metekhi: { size: 5, parts: [
      ["box", "stone", 0, 0, 0, 5, 2.4, 3], ["box", "stone", 0, 0, 0, 3, 2.4, 4.4],
      ["roof", "#8a7f72", 0, 2.4, 0, 5.2, 1, 3.2], ["roof", "#8a7f72", 0, 2.4, 0, 4.6, 1, 3.2, 1.5708],
      ["cylinder", "stone", 0, 2.9, 0, 1.7, 1.8, 1.7], ["cone", "#7a6f62", 0, 4.7, 0, 2, 1.4, 2]
    ] },
    // Narikala: the old fortress walls along the ridge, round and square towers, the little church inside
    narikala: { size: 30, parts: [
      ["box", "#b9a688", 0, 0, -2, 30, 1.8, .9], ["box", "#b9a688", -9, 0, 1.5, 12, 1.5, .8, .35], ["box", "#b9a688", 9, 0, 1.2, 12, 1.5, .8, -.3],
      ["cylinder", "#b3a083", -15, 0, -2, 2.2, 3.4, 2.2], ["cylinder", "#b3a083", -5, 0, -2, 2, 3, 2], ["box", "#ad9a7d", 5, 0, -2, 2.4, 3.6, 2.4], ["cylinder", "#b3a083", 15, 0, -2, 2.2, 3.2, 2.2],
      ["cylinder", "#b3a083", -14, 0, 4, 1.8, 2.6, 1.8], ["box", "#ad9a7d", 14, 0, 3.6, 2, 2.8, 2],
      ["box", "stone", 2, 0, 1.6, 2.4, 1.5, 1.6], ["roof", "#8a7f72", 2, 1.5, 1.6, 2.6, .8, 1.8], ["cylinder", "stone", 2, 1.8, 1.6, .7, .9, .7], ["cone", "#7a6f62", 2, 2.7, 1.6, .85, .7, .85]
    ] },
    // the Bridge of Peace: a footbridge under a long, wavy canopy of glass and steel
    "peace-bridge": { size: 18, parts: [
      ["box", "#4a4f55", 0, 1.1, 0, 18, .25, 1.4],
      ["tube", "glass", 0, 1.35, 0, 16.5, 1.1, 1.9],
      ["ball", "glass", -6.5, 2.1, 0, 4.4, 1.5, 2.5], ["ball", "glass", 0, 2.3, 0, 6, 1.8, 2.7], ["ball", "glass", 6.5, 2.1, 0, 4.4, 1.5, 2.5],
      ["box", "#4a4f55", -9, 0, 0, .5, 1.1, 1.2], ["box", "#4a4f55", 9, 0, 0, .5, 1.1, 1.2], ["box", "#4a4f55", 0, 0, 0, .5, 1.1, 1.2]
    ] },
    // the Mother of Kartli: the aluminium statue on the ridge, a bowl in one hand, a sword in the other
    "mother-kartli": { scale: .6, fit: false, size: 2, parts: [
      ["box", "#8f9599", 0, 0, 0, 1.2, .5, 1.2], ["frustum", "#a9b0b4", 0, .5, 0, .9, 3.4, .9], ["ball", "#a9b0b4", 0, 4.25, 0, .55, .62, .55],
      ["box", "#a9b0b4", .75, 3.1, 0, 1.1, .14, .14], ["box", "#c3c9cc", 1.3, 2.6, 0, .08, 1.6, .08],
      ["box", "#a9b0b4", -.7, 3, 0, .9, .14, .14], ["cylinder", "#c3c9cc", -1.1, 3.05, 0, .55, .2, .55]
    ] },
    // the sulphur baths of Abanotubani: low brick domes rising out of the ground, each with a little lantern
    "sulfur-bath": { scale: 1, parts: [
      ["dome", "brick", -2.4, 0, -1, 3.2, 2, 3.2], ["cylinder", "brick", -2.4, 1, -1, .5, .5, .5],
      ["dome", "brick", 1.2, 0, -1.6, 2.6, 1.6, 2.6], ["cylinder", "brick", 1.2, .8, -1.6, .45, .45, .45],
      ["dome", "brick", 0, 0, 1.8, 2.8, 1.8, 2.8], ["cylinder", "brick", 0, .9, 1.8, .45, .45, .45],
      ["dome", "brick", 3, 0, 1.4, 2, 1.2, 2], ["box", "#c9a27a", -1, 0, 4, 3.4, 1.6, 1.6]
    ] },
    // for a campaign's own place in the old town: a house with a carved blue balcony round its upper floor
    "balcony-house": { claim: 3, parts: [
      ["box", "wall", 0, 0, 0, 3.6, 3.4, 2.8], ["roof", "roof", 0, 3.4, 0, 3.9, 1.1, 3.1],
      ["box", "#6f97ab", 0, 1.9, 1.6, 3.4, .55, .7], ["box", "#2f3f48", 0, 2.45, 1.95, 3.4, .12, .06],
      ["box", "#6f97ab", 1.95, 1.9, 0, .7, .55, 2.6], ["box", "dark", -.8, 0, 1.42, .8, 1.4, .05]
    ] }
  },

  // the map's own landmarks, by the name they have on it, and the model each wears
  landmarks: {
    "Holy Trinity Cathedral of Tbilisi": "sameba",
    "Sioni Cathedral of the Dormition": "sioni",
    "Metekhi Church": "metekhi",
    "Narikala": "narikala",
    "Bridge of Peace": "peace-bridge",
    "Mother of Kartli": "mother-kartli",
    "Sulphur Baths": "sulfur-bath"
  }
});
