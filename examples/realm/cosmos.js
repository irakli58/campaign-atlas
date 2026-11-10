// The planes beyond the Wyrmwater Reach (references/dimensions.md; the approved dimensions plan, 3 Nov 2026). The test
// the plan asks for: the Nine Hells with all nine layers, the Feywild and the Shadowfell as worlds of their own, an
// elemental plane without end, the Astral as islands in a void, the Abyss, and the Blood War between the Hells and the
// Abyss. Every fact is in Atlas's own words and tagged: canon (with its book and edition), variant (another edition
// says otherwise) or added (invented to fill a gap). Where the editions disagree, nothing is chosen: the game master
// chooses on the page. Sources: the System Reference Document 5.1 (CC-BY-4.0, Wizards of the Coast), the Dungeon
// Master's Guide (2014), Mordenkainen's Tome of Foes (2018), Baldur's Gate: Descent into Avernus (2019), Guide to Hell
// (1999), the Monster Manual (1977) and Monster Manual II (1983), Fiendish Codex II: Tyrants of the Nine Hells (2006).
ATLAS.cosmos({
  model: "great wheel",
  edition: "D&D 5th edition",
  links: [["realm", "feywild"], ["realm", "shadowfell"], ["realm", "astral"], ["astral", "hells"], ["astral", "abyss"], ["astral", "fire"], ["realm", "water"], ["realm", "air"], ["hells", "abyss"]],
  dimensions: [
    { id: "realm", name: "The Wyrmwater Reach", short: "The world", ring: "material", source: { kind: "custom" }, structure: "land",
      concept: "The campaign's own world, at the hub of the Wheel: every other plane is reached from here, or through here.",
      palette: { ground: "#7f9a5a" }, layers: [{ id: "main", name: "The Wyrmwater Reach", world: "main" }] },

    { id: "hells", name: "The Nine Hells of Baator", short: "The Nine Hells", ring: "outer", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true }, structure: "layers",
      concept: "A plane of law and evil, nine layers one beneath another, home of the devils. Order is everything here: rank, contract and punishment. Its archdevils rule a layer each under Asmodeus, and its armies fight the demons of the Abyss without end.",
      palette: { ground: "#6b4434", sea: "#5a1414", sky: "#4a120c" },
      rules: { look: "Red light without a sun; ash, iron and fire in the upper layers, ice and chasms below.", feel: "Everything is owed to someone. Every bargain is binding, every kindness has a price, and the air itself feels like a ledger.",
        play: [{ rule: "Devils are bound by the contracts they make and the hierarchy above them.", source: "Mordenkainen's Tome of Foes (2018), ch. 1" }] },
      lore: [
        { fact: "A lawful evil plane of nine layers, from Avernus at the top to Nessus at the bottom.", tag: "canon", source: "Dungeon Master's Guide (2014), ch. 2", edition: "5e" },
        { fact: "The devils are its people; the souls of the wicked come here and become lemures, the lowest devils.", tag: "canon", source: "Mordenkainen's Tome of Foes (2018), ch. 1", edition: "5e" },
        { fact: "Asmodeus rules the whole of it from Nessus; the eight layers above are each held by an archdevil who owes him allegiance.", tag: "canon", source: "Mordenkainen's Tome of Foes (2018), ch. 1", edition: "5e" },
        { fact: "The River Styx flows through Avernus.", tag: "canon", source: "Baldur's Gate: Descent into Avernus (2019)", edition: "5e" },
        { fact: "The Blood War, the devils' endless war with the demons, is fought mostly on Avernus.", tag: "canon", source: "Mordenkainen's Tome of Foes (2018), ch. 1", edition: "5e" },
        { fact: "Older editions name the devils baatezu and the plane Baator.", tag: "variant", source: "Planescape (1994), Guide to Hell (1999)", edition: "2e" },
        { fact: "The war camps, the Styx crossing and the river's ferry on the map are invented for this campaign.", tag: "added" }
      ],
      conflicts: [
        { id: "avernus-ruler", about: "Who rules Avernus", options: [
          { value: "Zariel", source: "Mordenkainen's Tome of Foes (2018); Baldur's Gate: Descent into Avernus (2019)", edition: "5e", note: "A fallen angel, restored to the layer's rule; Bel serves her." },
          { value: "Bel", source: "Guide to Hell (1999); Fiendish Codex II (2006)", edition: "2e to 4e", note: "A pit fiend who overthrew Zariel and held the layer for the war." },
          { value: "Tiamat", source: "Monster Manual (1977)", edition: "1e", note: "The dragon goddess dwells in Avernus in the first edition." } ] },
        { id: "phlegethos-ruler", about: "Who rules Phlegethos", options: [
          { value: "Belial and Fierna", source: "Guide to Hell (1999); Mordenkainen's Tome of Foes (2018)", edition: "2e, 5e", note: "Father and daughter share the throne." },
          { value: "Belial", source: "Monster Manual II (1983)", edition: "1e" } ] },
        { id: "stygia-ruler", about: "Who rules Stygia", options: [
          { value: "Levistus", source: "Guide to Hell (1999); Mordenkainen's Tome of Foes (2018)", edition: "2e (after the Reckoning), 3e, 5e", note: "Imprisoned in the ice by Asmodeus, and still its lord." },
          { value: "Geryon", source: "Monster Manual (1977)", edition: "1e, early 2e", note: "Deposed so that Levistus could rule again." } ] },
        { id: "malbolge-ruler", about: "Who rules Malbolge", options: [
          { value: "Glasya", source: "Fiendish Codex II (2006); Mordenkainen's Tome of Foes (2018)", edition: "3.5e, 5e", note: "Asmodeus's daughter." },
          { value: "The Hag Countess", source: "Guide to Hell (1999)", edition: "2e", note: "Raised after the Reckoning, deposed later." },
          { value: "Moloch", source: "Monster Manual II (1983)", edition: "1e", note: "Baalzebul's viceroy there." } ] }
      ],
      layers: [
        // (each layer its own place by its own laws (the user, 4 Nov 2026: "Avernus should not generate the same terrain as
        // Stygia or Cania"): its shape, its weather or none, its warmth, its liquid, its landforms and its rivers)
        { id: "avernus", name: "Avernus", n: 1, ruler: "@avernus-ruler", concept: "A blasted wasteland under a red sky, the Blood War's battlefield; the Styx runs through it, and fire falls from the sky.",
          laws: { weather: "none", warmth: 45 }, map: { structure: "land", landshare: .85, liquid: "bloodsea", impacts: .35, life: "none", cover: { dry: "ashwaste", forest: "thornwood", wet: "bloodsea", cold: "bonefield", high: "ironspires" }, rivers: [{ name: "The River Styx", liquid: "cursed" }], palette: { ground: "#6b4a3a", sea: "#5a1414", sky: "#5a1a10" } },
          places: [{ id: "citadel", name: "The Bronze Citadel", kind: "castle" }, { id: "forge", name: "Bel's Forge", kind: "fort" }, { id: "camp", name: "The Ashen War Camp", kind: "camp" }, { id: "crossing", name: "The Styx Crossing", kind: "landmark" }] },
        { id: "dis", name: "Dis", n: 2, ruler: "Dispater", concept: "An iron city that fills its layer, its streets hot underfoot, its walls forever being rebuilt.",
          laws: { weather: "none", warmth: 50 }, map: { structure: "city", life: "none", cover: { dry: "ironstreets", high: "ironspires" }, landforms: ["ruins"], rivers: [{ name: "The River Styx", liquid: "cursed" }], palette: { ground: "#4a4446", sky: "#3a1410" } },
          places: [{ id: "tower", name: "The Iron Tower", kind: "tower" }, { id: "gate", name: "The Gate of Dis", kind: "fort" }] },
        { id: "minauros", name: "Minauros", n: 3, ruler: "Mammon", concept: "An endless sinking swamp under a stinging rain; its greedy city sinks into the mire as it is built.",
          laws: { warmth: 22, fall: "rain" }, map: { structure: "land", landshare: .9, liquid: "cursedwater", fluvial: .3, life: "none", cover: { dry: "bog", wet: "marsh", forest: "thornwood", high: "ironspires", liquid: "cursedwater" }, palette: { ground: "#4e4a36", sea: "#34403a", sky: "#2e2a1a" } },
          places: [{ id: "city", name: "The Sinking City", kind: "city" }] },
        { id: "phlegethos", name: "Phlegethos", n: 4, ruler: "@phlegethos-ruler", concept: "A layer of fire: burning plains, rivers of flame and a city in a volcano's mouth.",
          laws: { weather: "none", warmth: 300 }, map: { structure: "land", landshare: .82, liquid: "lava", volcanism: .9, volcStyle: "paterae", life: "none", cover: { dry: "cinders", forest: "brimstone", wet: "lava", high: "volcanic" }, rivers: [{ name: "The Rivers of Flame", liquid: "lava" }], palette: { ground: "#5a2a1a", sea: "#ff5a1f", sky: "#7a2a10" } },
          places: [{ id: "abriymoch", name: "Abriymoch", kind: "city" }] },
        { id: "stygia", name: "Stygia", n: 5, ruler: "@stygia-ruler", concept: "A frozen sea under a dark sky, its lord held in a block of ice.",
          laws: { warmth: -40, fall: "snow" }, map: { structure: "ocean", liquid: "ice", life: "none", cover: { dry: "icesheet", forest: "icesheet", cold: "icesheet", high: "glacier", liquid: "ice" }, palette: { ground: "#9aa6b0", sea: "#b8c8d4", ice: "#dce8f0", sky: "#1a2030" } },
          places: [{ id: "prison", name: "The Ice-Bound Lord", kind: "landmark" }, { id: "harbor", name: "The Frozen Harbour", kind: "port" }] },
        { id: "malbolge", name: "Malbolge", n: 6, ruler: "@malbolge-ruler", concept: "An endless slope of rolling boulders, where nothing stays where it was put.",
          laws: { weather: "none", warmth: 30 }, map: { structure: "unbounded", liquid: "none", life: "none", cover: { dry: "rock", high: "stones", forest: "rock" }, landforms: ["slope", "boulders"], palette: { ground: "#6a5a50", sky: "#3a2020" } },
          places: [{ id: "citadel", name: "The Citadel on the Slope", kind: "castle" }] },
        { id: "maladomini", name: "Maladomini", n: 7, ruler: "Baalzebul", concept: "Ruined cities built and abandoned over and over, quarries and slag between them.",
          laws: { weather: "none", warmth: 25 }, map: { structure: "unbounded", liquid: "none", life: "none", cover: { dry: "wasteland", forest: "wasteland", high: "ironspires" }, landforms: ["ruins"], palette: { ground: "#5a524a", sky: "#2a1a14" } },
          places: [{ id: "ruins", name: "The Ruined Cities", kind: "ruin" }] },
        { id: "cania", name: "Cania", n: 8, ruler: "Mephistopheles", concept: "Glaciers and freezing winds, and a citadel of ice.",
          laws: { warmth: -60, fall: "snow" }, map: { structure: "unbounded", liquid: "ice", glacial: 1, life: "none", cover: { dry: "glacier", cold: "glacier", forest: "icesheet", high: "glacier" }, palette: { ground: "#b8c8d4", ice: "#eef4f8", sky: "#101824" } },
          places: [{ id: "mephistar", name: "Mephistar", kind: "castle" }] },
        { id: "nessus", name: "Nessus", n: 9, ruler: "Asmodeus", concept: "The deepest layer: chasms and trenches beyond counting, and at the bottom of the deepest, the citadel of the Lord of the Nine.",
          laws: { weather: "none", warmth: 35 }, map: { structure: "unbounded", liquid: "none", life: "none", cover: { dry: "ashwaste", high: "ironspires", forest: "ashwaste" }, landforms: ["chasms"], palette: { ground: "#3a2e2a", sky: "#1a0a0a" } },
          places: [{ id: "malsheem", name: "Malsheem", kind: "castle" }] }
      ],
      factions: {
        hells: { n: "The Nine Hells", kind: "the devils' hierarchy", leader: "Asmodeus", has: { money: 4, people: 5, arms: 5, influence: 4, knowledge: 4 }, lacks: "Numbers on the battlefield: the demons are endless.",
          wants: "To win the Blood War, and souls enough to fill its ranks.", plan: ["Hold Avernus against the next demon tide", "Buy mortal souls with good bargains", "Open a new gate on the world"], doing: "Holding the line on Avernus.",
          rels: { abyss: ["war", "The Blood War: law against chaos, without end"] }, party: "neutral", knows: "Every contract ever signed on its layers.", wrong: "That the demons can never unite.", inner: "Its archdevils plot against each other as much as against the Abyss." }
      },
      events: [{ id: "bw-tide", title: "A demon tide breaks over Avernus", when: "day 6", importance: "major", what: "A horde out of the Abyss pours across the Styx; the war camps fall back to the Bronze Citadel.", players: "The sky over Avernus burns brighter: the war has come closer." }],
      portals: [
        { id: "maw", name: "The Wyrm's Maw", kind: "gate", from: { world: "main", loc: "wyrmtooth" }, to: { dim: "hells", layer: "avernus", loc: "camp" }, who: "Anyone who speaks the old pact aloud.", when: "When the dragon sleeps.", price: "A promise, written down." },
        { id: "ferry", name: "The Styx ferry", kind: "passage", from: { dim: "hells", layer: "avernus", loc: "crossing" }, to: { dim: "hells", layer: "dis", loc: "gate" }, who: "Those who pay the ferryman.", price: "A memory, taken by the river." }
      ],
      time: { here: 1, home: 1, say: "Time runs as at home" },
      travel: { ways: "Gates, the Styx's current from other lower planes, or a summons.", cost: "A bargain, more often than coin.", dangers: ["The Blood War across Avernus", "Contracts that bind whoever signs", "The Styx's water takes the memory of whoever touches it"] },
      warning: { from: "Brother Aldous, who came back", title: "Before you go down", text: "Do not sign anything. I mean it: not a receipt, not a promise, not your name in the dust to prove you were there. They are polite, the ones in charge. They will offer you water when you are thirsty and a road when you are lost, and every gift is entered in a book you will never see.\n\nKeep away from the river. A man in our company drank from it and forgot his own wife's face. Keep away from the fighting on the plain, too: neither side cares whose side you are on.\n\nIf you must bargain, bargain for the way home first." } },

    { id: "abyss", name: "The Abyss", short: "The Abyss", ring: "outer", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true }, structure: "layers",
      concept: "A plane of chaos and evil with layers beyond counting, each the realm of a demon lord; the demons pour out of it into the Blood War.",
      palette: { ground: "#4a2a3a", sky: "#2a0a1a" },
      rules: { feel: "Nothing holds its shape for long; hunger and rage are in the air.", play: [] },
      lore: [
        { fact: "Its layers are said to be infinite; the first is the Plain of Infinite Portals.", tag: "canon", source: "Dungeon Master's Guide (2014), ch. 2", edition: "5e" },
        { fact: "Demon lords hold layers of their own: Orcus in Thanatos, Lolth in the Demonweb Pits.", tag: "canon", source: "Mordenkainen's Tome of Foes (2018), ch. 2", edition: "5e" },
        { fact: "Only three of its layers are drawn here; and countless more.", tag: "added" }
      ],
      layers: [
        { id: "portals", name: "The Plain of Infinite Portals", n: 1, concept: "A waste of pits and doorways, each opening on a deeper layer.", laws: { weather: "none", warmth: 38 }, map: { structure: "land", landshare: .8, liquid: "bloodsea", life: "none", impacts: .5, basins: 6, cover: { dry: "ashwaste", forest: "corruptland", wet: "bloodsea", high: "cursedmtn" }, palette: { ground: "#5a3a3a", sea: "#5a1414" } } },
        { id: "thanatos", name: "Thanatos", n: 113, ruler: "Orcus", concept: "A frozen land of the dead under a black sky.", laws: { weather: "none", warmth: -20 }, map: { structure: "unbounded", liquid: "none", life: "none", cover: { dry: "shadowland", forest: "bonefield", high: "bonefield" }, landforms: ["chasms"], palette: { ground: "#4a4a50" } } },
        { id: "demonweb", name: "The Demonweb Pits", n: 66, ruler: "Lolth", concept: "Webs strung across an endless void, and the drow goddess's spider-palaces in them.", laws: { weather: "none", warmth: 10 }, map: { structure: "islands", liquid: "voidsea", life: "none", cover: { dry: "corruptland", forest: "thornwood", wet: "voidsea", high: "ironspires" }, palette: { ground: "#3a2a3a", sea: "#0e0c18" } } }
      ],
      factions: {
        abyss: { n: "The Abyss", kind: "the demon hordes", leader: "No one: its lords fight each other", has: { money: 1, people: 5, arms: 4, influence: 2, knowledge: 2 }, lacks: "Order: no lord can hold the others for long.",
          wants: "To devour: the Hells, the world, each other.", plan: ["Break the line on Avernus", "Draw cultists in the world to open a way"], doing: "Pouring out against the Hells.",
          rels: { hells: ["war", "The Blood War"] }, party: "hostile", knows: "Ways no devil has found.", wrong: "That the devils' order is weakness.", inner: "Each lord would rather the war go badly for the others." }
      } },

    { id: "feywild", name: "The Feywild", short: "The Feywild", ring: "echo", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: false }, structure: "land",
      concept: "A plane of wild colour and strong feeling, full of fey, beside the world; here it is a land of its own, its own coasts and forests, its courts in their palaces.",
      palette: { ground: "#4f8a4a", plant: "#2fbf7f", sky: "#8a6ad0" },
      rules: { look: "Colours too bright, twilight that lasts for hours, flowers that turn to watch.", feel: "Feelings run high: joy is giddy, grief is crushing, and promises are kept to the letter.",
        play: [{ rule: "When a traveller leaves, time at home may have passed differently: the Dungeon Master's Guide has an optional table for it; roll on it from your book.", source: "Dungeon Master's Guide (2014), ch. 2" }] },
      lore: [
        { fact: "An echo of the Material Plane, a place of bright beauty and danger, home of the fey.", tag: "canon", source: "SRD 5.1, Planes (CC-BY-4.0)", edition: "5e" },
        { fact: "The Seelie Court of the Summer Queen and the Gloaming Court of the Queen of Air and Darkness hold great parts of it.", tag: "canon", source: "Dungeon Master's Guide (2014), ch. 2", edition: "5e" },
        { fact: "Here it is a land of its own, not a mirror of the Wyrmwater Reach: the user's choice for this campaign.", tag: "added" }
      ],
      laws: { warmth: 18, fall: "rain" }, map: { structure: "land", landshare: .6, liquid: "water", life: "complex", cover: { forest: "wildwood", dry: "feymeadow", wet: "vale", cold: "feymeadow", high: "floating" } },
      places: [{ id: "summer", name: "The Summer Court", kind: "castle" }, { id: "gloaming", name: "The Gloaming Court", kind: "castle" }, { id: "crossing", name: "The Ring of Mushrooms", kind: "grove" }],
      portals: [{ id: "maidens", name: "The Nine Maidens", kind: "crossroads", from: { world: "main", loc: "stones" }, to: { dim: "feywild", layer: "main", loc: "crossing" }, who: "Anyone who dances the ring.", when: "At dawn on midsummer's day.", price: "A song, given and not taken back." }],
      time: { here: 1, home: 1, say: "Uncertain: when they leave, the time passed at home may be a minute or a century (see its rule of play)" },
      travel: { ways: "Fey crossings at standing stones, mushroom rings and deep woods, at certain times.", cost: "A gift or a promise to its fey.", dangers: ["Promises kept to the letter", "Food that binds whoever eats it", "Time that runs strangely"] },
      warning: { from: "A note pinned inside a shepherd's hat", text: "If the music starts, do not dance. If you dance, do not eat. If you eat, do not say thank you: say it was a fair trade.\n\nThey will ask your name. Give them a name, never yours.\n\nI was gone a single evening. My brother is grey now." } },

    { id: "shadowfell", name: "The Shadowfell", short: "The Shadowfell", ring: "echo", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: false }, structure: "land",
      concept: "A grey, despairing plane of shadow beside the world, here a land of its own; its mists carry the Domains of Dread.",
      palette: { ground: "#5a5c58", sea: "#7a8088", sky: "#2a2c30" },
      rules: { look: "Colour drains away: everything is grey, the light comes from nowhere, and shadows fall the wrong way.", feel: "A weight of hopelessness that settles on everyone who stays.",
        play: [{ rule: "Shadowfell Despair: an optional rule for the weight of the plane on travellers; use it from your book.", source: "Dungeon Master's Guide (2014), ch. 2" }] },
      lore: [
        { fact: "An echo of the Material Plane, dark and drained of colour.", tag: "canon", source: "SRD 5.1, Planes (CC-BY-4.0)", edition: "5e" },
        { fact: "The Domains of Dread drift in its mists, each ruled by a Darklord.", tag: "canon", source: "Van Richten's Guide to Ravenloft (2021)", edition: "5e" },
        { fact: "Gloomwrought is a city of the Shadowfell.", tag: "canon", source: "The Shadowfell: Gloomwrought and Beyond (2011)", edition: "4e" },
        { fact: "Here it is a land of its own, not a mirror of the Wyrmwater Reach: the user's choice for this campaign.", tag: "added" }
      ],
      laws: { warmth: 4, fall: "rain" }, map: { structure: "land", landshare: .62, liquid: "mistsea", fluvial: .5, life: "complex", cover: { forest: "gloomwood", dry: "shadowland", wet: "bog", cold: "shadowland", high: "cursedmtn", liquid: "mistsea" }, palette: { plant: "#4a524a" } },
      places: [{ id: "gloomwrought", name: "Gloomwrought", kind: "city" }, { id: "mists", name: "The Edge of the Mists", kind: "landmark" }],
      portals: [{ id: "barrow", name: "The deepest crypt of the Barrow", kind: "passage", from: { world: "main", loc: "barrow" }, to: { dim: "shadowfell", layer: "main", loc: "gloomwrought" }, who: "The dead, and those who walk with them.", when: "At the dark of the moon." }],
      time: { here: 1, home: 1 },
      travel: { ways: "Places of death and grief where the shadow lies thin.", dangers: ["Despair that settles on travellers", "Mists that carry the unwary into a Domain of Dread"] },
      warning: { from: "Carved into the inside of the Barrow's door", text: "THE GREY COMES IN THROUGH THE EYES. KEEP A LIGHT AND A REASON TO GO HOME. SAY THE REASON ALOUD EVERY MORNING. WHEN YOU CANNOT REMEMBER IT, YOU ARE ALREADY THEIRS." } },

    { id: "fire", name: "The Elemental Plane of Fire", short: "Fire", ring: "inner", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true }, structure: "unbounded",
      concept: "An endless plane of flame: burning plains, seas of fire, and the City of Brass of the efreet.",
      palette: { ground: "#6a3a20", sea: "#ff6a20", sky: "#a03a10" },
      rules: { look: "Everything glows; the horizon shimmers and never comes closer.", feel: "Heat without end, and a city where everything is for sale.", play: [] },
      lore: [
        { fact: "One of the Inner Planes, of raw elemental fire.", tag: "canon", source: "SRD 5.1, Planes (CC-BY-4.0)", edition: "5e" },
        { fact: "The City of Brass, ruled by the efreet, stands there.", tag: "canon", source: "Dungeon Master's Guide (2014), ch. 2", edition: "5e" },
        { fact: "No sea and no coast: here it runs to every edge of the map.", tag: "added" }
      ],
      laws: { weather: "none", warmth: 400 }, map: { structure: "unbounded", liquid: "none", life: "none", volcanism: 1, volcStyle: "paterae", cover: { dry: "cinders", forest: "brimstone", high: "volcanic" }, rivers: [{ name: "The River of Fire", liquid: "lava" }, { name: "The Burning Run", liquid: "lava" }] },
      places: [{ id: "brass", name: "The City of Brass", kind: "city" }, { id: "market", name: "The Ember Market", kind: "town" }],
      travel: { ways: "Spells, gates in volcanoes, the efreet's own bargains.", dangers: ["The heat itself: protection against fire, or death", "The efreet's slave markets"] } },

    { id: "water", name: "The Elemental Plane of Water", short: "Water", ring: "inner", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true }, structure: "ocean",
      concept: "An endless sea with no shore and, in its depths, no floor; light fades to blue darkness the deeper one goes, and its cities hang in the water or cling to drifting reefs.",
      palette: { ground: "#5a7a6a", sea: "#1f5d7a", sky: "#3a7a9a" },
      rules: { look: "Blue in every direction, lighter above, darker below.", feel: "No up but the light; no air but what one brings.", play: [] },
      lore: [
        { fact: "One of the Inner Planes, of raw elemental water.", tag: "canon", source: "SRD 5.1, Planes (CC-BY-4.0)", edition: "5e" },
        { fact: "No shores and almost no land: its few reefs and the creatures' cities are its places.", tag: "added" }
      ],
      laws: { warmth: 16 }, map: { structure: "ocean", liquid: "water", life: "complex", cover: { dry: "reef", forest: "reef", high: "stones" } },
      places: [{ id: "reefcity", name: "The Reef of Many Voices", kind: "city" }, { id: "airpocket", name: "The Last Air", kind: "landmark" }],
      travel: { ways: "Spells and gates; the water itself carries those who know its currents.", dangers: ["Drowning", "The crushing depths", "Currents that carry a traveller a hundred leagues"] } },

    { id: "air", name: "The Elemental Plane of Air", short: "Air", ring: "inner", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true }, structure: "sky",
      concept: "An endless sky with no ground: floating islands of earth drift in it, cloud banks lie below them, and the winds never stop.",
      palette: { ground: "#8a9a7a", sea: "#dfe6ee", sky: "#9fc0e8" },
      rules: { look: "Sky above and below; islands of earth adrift.", feel: "Falling is the only danger, and it never ends.", play: [] },
      lore: [
        { fact: "One of the Inner Planes, of raw elemental air.", tag: "canon", source: "SRD 5.1, Planes (CC-BY-4.0)", edition: "5e" },
        { fact: "Its drifting islands of earth are where its travellers and peoples make their homes.", tag: "added" }
      ],
      laws: { warmth: 12, weather: "storms", gravity: "none" }, map: { structure: "sky", liquid: "mistsea", life: "complex", cover: { dry: "plains", forest: "woodland", high: "highmtn", liquid: "mistsea" } },
      places: [{ id: "isle", name: "The Wandering Isle", kind: "town" }, { id: "eye", name: "The Eye of the Storm", kind: "landmark" }],
      travel: { ways: "Flight, or the winds themselves, for those who can ride them.", dangers: ["Falling forever", "Storms that scatter islands"] } },

    { id: "astral", name: "The Astral Plane", short: "The Astral", ring: "transitive", source: { kind: "lore", setting: "Dungeons & Dragons", edition: "5th edition", strict: true }, structure: "islands",
      concept: "A silver void of thought between the planes, where the bodies of dead gods drift like islands and the githyanki sail.",
      palette: { ground: "#8a8aa0", sea: "#cfd0e0", sky: "#5a5a80" },
      rules: { look: "A silver sky in every direction, threads of colour where other planes are near.", feel: "Timeless: no one ages, no one hungers.", play: [{ rule: "One moves there by thought, not by walking.", source: "Dungeon Master's Guide (2014), ch. 2" }] },
      lore: [
        { fact: "The plane between the planes, through which travellers reach the Outer Planes.", tag: "canon", source: "SRD 5.1, Planes (CC-BY-4.0)", edition: "5e" },
        { fact: "The bodies of dead gods drift there; the githyanki raid from their fortresses in it.", tag: "canon", source: "Dungeon Master's Guide (2014), ch. 2", edition: "5e" }
      ],
      laws: { weather: "none", warmth: 15, gravity: "subjective" }, map: { structure: "chart" },
      places: [{ id: "godbody", name: "The Drifting God", kind: "ruin" }, { id: "fortress", name: "A githyanki fortress", kind: "fort" }],
      time: { here: 1, home: 1, say: "Timeless for those in it: no one ages there, while the world's time runs on" } }
  ]
});
