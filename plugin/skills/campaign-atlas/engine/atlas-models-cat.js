/* The catalogue: every model in the library, by category and kind, with the genres it belongs to, its materials, its
   size in metres (w across, d deep, h high) and where it goes (on the floor, on a wall at height y0, or hung from the
   ceiling); and the kits, ready sets for a kind of place. Each row: [id, name, generator, options, more]. An id is
   kept for ever once a map uses it. */
(function (A) {
  "use strict";
  const M = A.models;
  const F = "fantasy", MD = "medieval", HI = "historical", MO = "modern", MI = "military", HO = "horror", PA = "postapoc", CY = "cyberpunk", SF = "scifi", FU = "futuristic";
  const OLD = [F, MD, HI, HO], NOW = [MO, HO, PA], FUT = [SF, FU], ALL = [F, MD, HI, MO, MI, HO, PA, CY, SF, FU];
  Object.assign(M.MATS, { paintred: ["metal", 0x9a2e22, .55, .4, "metal"], paintblue: ["metal", 0x2a4d7a, .55, .4, "metal"], paintgreen: ["metal", 0x3a5a3a, .6, .4, "metal"], paintyellow: ["metal", 0xd9a21e, .55, .4, "metal"], paintwhite: ["metal", 0xe4e4e0, .5, .35, "metal"], paintorange: ["metal", 0xc4561e, .55, .4, "metal"], jade: ["stone", 0x3f7a5a, .3, 0, "marble"] });
  // where a model goes, besides the floor: on a wall (at the height its y0 gives) or hung from the ceiling; outdoors or both
  const W = (y0, more) => Object.assign({ mount: "wall" }, more || {}), C = more => Object.assign({ mount: "ceiling" }, more || {}), O = more => Object.assign({ e: "out" }, more || {}), B = more => Object.assign({ e: "both" }, more || {});

  /* ================= A. furniture and interiors ================= */
  const FI = "Furniture & interiors";
  M.add(FI, "Seating", [F, MD, HI, MO, HO], [
    ["chair-wood", "Wooden chair", "chair", { w: .45, d: .45, h: .9, m: { frame: "oak" }, slats: 3 }],
    ["chair-ladder", "Ladder-back chair", "chair", { w: .46, d: .44, h: 1, m: { frame: "pine" }, ladder: true }],
    ["chair-windsor", "Windsor chair", "chair", { w: .48, d: .46, h: .95, m: { frame: "walnut" }, spindles: 7, turned: true }, { g: [HI, MD, HO] }],
    ["chair-dining", "Upholstered dining chair", "chair", { w: .48, d: .5, h: 1, m: { frame: "mahogany", seat: "red" }, style: "upholstered", turned: true }, { g: [HI, MO, HO] }],
    ["chair-arm", "Wooden armchair", "chair", { w: .58, d: .52, h: 1, m: { frame: "oak", seat: "leather" }, style: "arm", pad: true }],
    ["chair-throne", "Throne", "chair", { w: .85, d: .7, h: 1.8, sh: .52, m: { frame: "walnut", seat: "red", trim: "gold" }, style: "throne" }, { g: [F, MD] }],
    ["chair-throne-dark", "Obsidian throne", "chair", { w: .9, d: .72, h: 2, sh: .52, m: { frame: "obsidian", seat: "black", trim: "silver" }, style: "throne" }, { g: [F, HO] }],
    ["chair-office", "Office chair", "chair", { w: .62, d: .6, h: 1.05, m: { seat: "pblack", legs: "chrome" }, style: "office" }, { g: [MO, CY] }],
    ["chair-exec", "Leather executive chair", "chair", { w: .68, d: .65, h: 1.2, m: { seat: "leatherblack", legs: "chrome" }, style: "office" }, { g: [MO, CY] }],
    ["chair-gaming", "Gaming chair", "chair", { w: .66, d: .62, h: 1.3, m: { seat: "pblack", legs: "blackmetal", trim: "pred" }, style: "gaming" }, { g: [MO, CY] }],
    ["chair-pilot", "Pilot seat", "chair", { w: .7, d: .66, h: 1.3, m: { seat: "hullwhite", legs: "gunmetal", trim: "glowcyan" }, style: "gaming" }, { g: FUT }],
    ["chair-folding", "Folding chair", "chair", { w: .45, d: .48, h: .82, m: { legs: "steel", seat: "steel" }, style: "folding" }, { g: [MO, MI, PA] }],
    ["chair-plastic", "Plastic chair", "chair", { w: .52, d: .52, h: .8, m: { seat: "pwhite" }, style: "plastic", arms: true }, { g: [MO, PA] }],
    ["chair-school", "School chair", "chair", { w: .42, d: .42, h: .8, m: { frame: "steel", seat: "birch" }, slats: 1 }, { g: [MO, HO] }],
    ["chair-rocking", "Rocking chair", "chair", { w: .55, d: .6, h: 1.1, m: { frame: "walnut" }, style: "rocking", spindles: 6, arms: true }, { g: [HI, HO] }],
    ["chair-restraint", "Restraint chair", "chair", { w: .65, d: .65, h: 1.3, m: { frame: "oak" }, style: "arm", straps: true }, { g: [HO, HI] }],
    ["chair-interrogation", "Interrogation chair", "chair", { w: .5, d: .5, h: .85, m: { frame: "steel" }, slats: 1 }, { g: [MO, MI, HO] }],
    ["stool-3", "Three-legged stool", "stool", { w: .35, d: .35, h: .45, m: { seat: "pine", legs: "pine" } }, { g: [F, MD, HI] }],
    ["stool-tall", "Tavern stool", "stool", { w: .38, d: .38, h: .72, legs: 4, m: { seat: "oak", legs: "oak" } }, { g: [F, MD, HI] }],
    ["stool-bar", "Bar stool", "stool", { w: .4, d: .4, h: .75, m: { seat: "red", legs: "chrome" }, style: "bar" }, { g: [MO, CY] }],
    ["stool-log", "Log seat", "stool", { w: .45, d: .45, h: .45, m: { seat: "oak" }, style: "log" }, B({ g: [F, MD, PA] })],
    ["bench-plain", "Wooden bench", "bench", { w: 1.6, d: .35, h: .45, m: { frame: "oak" } }, { g: [F, MD, HI] }],
    ["bench-back", "Bench with a back", "bench", { w: 1.6, d: .45, h: .9, m: { frame: "pine" } }, { g: [F, MD, HI, MO] }],
    ["bench-pew", "Church pew", "bench", { w: 2.4, d: .6, h: 1, m: { frame: "oak" }, style: "pew" }, { g: [MD, HI, HO] }],
    ["bench-park", "Park bench", "bench", { w: 1.6, d: .65, h: .85, m: { frame: "iron", seat: "pine" }, style: "park" }, O({ g: [HI, MO, HO, PA] })],
    ["bench-log", "Log bench", "bench", { w: 1.8, d: .4, h: .45, m: { frame: "pine" }, style: "log" }, O({ g: [F, MD, PA] })],
    ["bench-metal", "Locker-room bench", "bench", { w: 1.5, d: .35, h: .45, m: { frame: "steel" }, style: "metal" }, { g: [MO, MI] }],
    ["bench-waiting", "Waiting-room seats", "bench", { w: 2, d: .55, h: .85, m: { frame: "chrome", seat: "pblue" }, style: "seats" }, { g: [MO, HO, FU] }],
    ["sofa-3", "Three-seat sofa", "sofa", { w: 2.1, d: .9, h: .85, m: { frame: "grey", cushion: "grey", legs: "walnut" } }, { g: [MO] }],
    ["sofa-loveseat", "Loveseat", "sofa", { w: 1.5, d: .88, h: .85, seats: 2, m: { frame: "teal", cushion: "teal", legs: "walnut" }, pillows: true }, { g: [MO, HI] }],
    ["armchair", "Armchair", "sofa", { w: .9, d: .85, h: .95, seats: 1, m: { frame: "brown", cushion: "cream", legs: "walnut" }, style: "rolled" }, { g: [HI, MO, HO] }],
    ["sofa-chesterfield", "Chesterfield sofa", "sofa", { w: 2.1, d: .95, h: .8, m: { frame: "leather", cushion: "leather", legs: "walnut" }, style: "chesterfield" }, { g: [HI, MO] }],
    ["armchair-club", "Leather club chair", "sofa", { w: 1, d: .9, h: .8, seats: 1, m: { frame: "leather", cushion: "leather", legs: "walnut" }, style: "chesterfield" }, { g: [HI, MO, HO] }],
    ["sofa-modern", "Modern sofa", "sofa", { w: 2.2, d: .95, h: .78, m: { frame: "black", cushion: "black", legs: "chrome" }, style: "modern" }, { g: [MO, CY] }],
    ["sofa-chaise", "Corner sofa", "sofa", { w: 2.4, d: .95, h: .82, seats: 3, m: { frame: "cream", cushion: "cream", legs: "walnut" }, style: "chaise" }, { g: [MO] }],
    ["sofa-velvet", "Velvet settee", "sofa", { w: 1.6, d: .8, h: .9, seats: 2, m: { frame: "purple", cushion: "purple", legs: "gold" }, style: "rolled", pillows: true }, { g: [HI, F, HO] }],
    ["sofa-club", "Club booth seating", "sofa", { w: 2.4, d: .8, h: 1.1, seats: 3, m: { frame: "leatherred", cushion: "leatherred", legs: "chrome" }, style: "modern", arms: false }, { g: [MO, CY] }],
    ["sofa-lounge", "Lounge couch", "sofa", { w: 2.2, d: .9, h: .75, m: { frame: "white", cushion: "white", legs: "hullgrey" }, style: "modern" }, { g: FUT }]
  ]);
  M.add(FI, "Tables", [F, MD, HI, MO], [
    ["table-dining", "Dining table", "table", { w: 1.8, d: .9, h: .76, m: { top: "walnut", legs: "walnut" }, turned: true }, { g: [HI, MO, HO] }],
    ["table-farm", "Farmhouse table", "table", { w: 2, d: .9, h: .76, m: { top: "pine", legs: "pine" } }],
    ["table-trestle", "Trestle table", "table", { w: 2.2, d: .85, h: .76, m: { top: "oak", legs: "oak" }, style: "trestle" }, { g: [F, MD] }],
    ["table-tavern", "Tavern table with drinks", "table", { w: 1.8, d: .85, h: .76, m: { top: "oak", legs: "oak" }, style: "trestle", items: "tavern" }, { g: [F, MD, HI] }],
    ["table-banquet", "Banquet table, laid", "table", { w: 3, d: 1.1, h: .76, m: { top: "oak", legs: "oak", cloth: "white" }, cloth: true, items: "dinner" }, { g: [F, MD, HI] }],
    ["table-round", "Round table", "table", { w: 1.1, d: 1.1, h: .76, m: { top: "oak", legs: "oak" }, round: true, style: "pedestal" }],
    ["table-cafe", "Café table", "table", { w: .7, d: .7, h: .74, m: { top: "marble", legs: "iron" }, round: true, style: "pedestal" }, B({ g: [HI, MO] })],
    ["table-coffee", "Coffee table", "table", { w: 1.1, d: .6, h: .42, m: { top: "walnut", legs: "walnut" }, taper: true }, { g: [MO, HI] }],
    ["table-side", "Side table", "table", { w: .5, d: .5, h: .6, m: { top: "cherry", legs: "cherry" }, turned: true }, { g: [HI, MO, HO] }],
    ["table-card", "Card table", "table", { w: .9, d: .9, h: .76, m: { top: "mahogany", legs: "mahogany" }, felt: true, items: "cards" }, { g: [HI, MO] }],
    ["table-poker", "Poker table", "table", { w: 1.3, d: 1.3, h: .76, m: { top: "walnut", legs: "walnut" }, round: true, style: "pedestal", felt: true, items: "cards" }, { g: [MO, CY] }],
    ["table-map", "War-room map table", "table", { w: 2, d: 1.2, h: .9, m: { top: "oak", legs: "oak" }, items: "maps" }, { g: [F, MD, HI, MI] }],
    ["table-alchemy", "Alchemist's table", "table", { w: 1.6, d: .8, h: .85, m: { top: "walnut", legs: "walnut" }, items: "alchemy" }, { g: [F, MD, HO] }],
    ["table-lab", "Laboratory bench", "table", { w: 1.8, d: .75, h: .9, m: { top: "porcelain", legs: "steel" }, style: "metal", shelf: true, items: "lab" }, { g: [HI, MO, SF, HO] }],
    ["table-workbench", "Workbench", "table", { w: 1.8, d: .75, h: .9, t: .07, lt: .09, m: { top: "oak", legs: "oak" }, shelf: true, items: "tools" }, { g: ALL }],
    ["table-steel", "Steel work table", "table", { w: 1.5, d: .75, h: .9, m: { top: "steel", legs: "steel" }, style: "metal", shelf: true }, { g: [MO, MI, SF, PA] }],
    ["table-folding", "Folding table", "table", { w: 1.8, d: .75, h: .74, m: { top: "pwhite", legs: "steel" }, style: "x" }, { g: [MO, MI, PA] }],
    ["table-camp", "Camp table", "table", { w: 1, d: .6, h: .7, m: { top: "olive", legs: "aluminium" }, style: "x" }, B({ g: [MI, MO, PA] })],
    ["table-kitchen", "Kitchen table", "table", { w: 1.2, d: .8, h: .76, m: { top: "birch", legs: "birch" } }, { g: [HI, MO] }],
    ["table-evidence", "Evidence table", "table", { w: 1.8, d: .75, h: .74, m: { top: "pwhite", legs: "steel" }, style: "x", items: "evidence" }, { g: [MO, HO] }],
    ["table-sewing", "Sewing table", "table", { w: 1, d: .55, h: .75, m: { top: "oak", legs: "iron" }, items: "sewing" }, { g: [HI, MO] }],
    ["table-radio", "Radio table", "table", { w: 1.2, d: .7, h: .75, m: { top: "olive", legs: "steel" }, style: "x", items: "radio" }, { g: [MI, HI] }],
    ["table-ritual", "Ritual table", "table", { w: 1.4, d: .8, h: .85, m: { top: "ebony", legs: "ebony", cloth: "black" }, cloth: true, items: "ritual" }, { g: [F, HO] }],
    ["table-feast", "Feast table with food", "table", { w: 2.2, d: .9, h: .76, m: { top: "oak", legs: "oak" }, style: "trestle", items: "food" }, { g: [F, MD, HI] }],
    ["desk-writing", "Writing desk", "table", { w: 1.2, d: .6, h: .76, m: { top: "mahogany", legs: "mahogany" }, turned: true, drawers: 2, items: "papers" }, { g: [HI, F, HO] }],
    ["desk-detective", "Detective's desk", "table", { w: 1.5, d: .75, h: .76, m: { top: "oak", legs: "oak" }, drawers: 3, ped: true, items: "papers" }, { g: [HI, MO, HO] }],
    ["desk-office", "Office desk", "table", { w: 1.5, d: .75, h: .74, m: { top: "birch", legs: "pgrey" }, style: "panel", drawers: 3, ped: true, items: "office" }, { g: [MO] }],
    ["desk-executive", "Executive desk", "table", { w: 1.9, d: .9, h: .76, m: { top: "walnut", legs: "walnut" }, style: "panel", drawers: 3, ped: true, items: "papers" }, { g: [MO, HI] }],
    ["desk-school", "School desk", "table", { w: .7, d: .5, h: .72, m: { top: "birch", legs: "steel" }, style: "metal" }, { g: [MO, HO] }],
    ["desk-computer", "Computer desk", "table", { w: 1.4, d: .7, h: .74, m: { top: "pblack", legs: "pblack" }, style: "panel", items: "office" }, { g: [MO, CY] }],
    ["desk-scifi", "Crew desk", "table", { w: 1.4, d: .7, h: .74, rad: .05, m: { top: "hullwhite", legs: "hullgrey" }, style: "block", items: "office" }, { g: FUT }]
  ]);
  M.add(FI, "Beds", [F, MD, HI, MO, HO], [
    ["bed-single", "Single bed", "bed", { w: 1, d: 2.05, h: 1, m: { frame: "pine", sheet: "white", blanket: "blue" } }],
    ["bed-double", "Double bed", "bed", { w: 1.5, d: 2.1, h: 1.1, m: { frame: "walnut", sheet: "white", blanket: "red" } }],
    ["bed-fourposter", "Four-poster bed", "bed", { w: 1.7, d: 2.2, h: 2.2, m: { frame: "mahogany", sheet: "linen", blanket: "wine", canopy: "wine" }, style: "fourposter", carved: true }, { g: [F, MD, HI, HO] }],
    ["bed-bunk", "Bunk bed", "bed", { w: 1, d: 2, h: 1.9, m: { frame: "pine", sheet: "white", blanket: "green" }, style: "bunk" }],
    ["bed-bunk-metal", "Barracks bunk", "bed", { w: 1, d: 2, h: 1.9, m: { frame: "olive", sheet: "white", blanket: "khaki" }, style: "bunk-metal" }, { g: [MI, MO, PA] }],
    ["bed-cot", "Camp cot", "bed", { w: .75, d: 1.95, h: .45, mh: .45, m: { frame: "aluminium", sheet: "canvas", blanket: "khaki" }, style: "cot" }, B({ g: [MI, MO, PA] })],
    ["bed-hospital", "Hospital bed", "bed", { w: 1, d: 2.1, h: 1, mh: .6, m: { frame: "steel", sheet: "white", blanket: "blue" }, style: "hospital" }, { g: [MO, HO, FU] }],
    ["bed-prison", "Prison bunk", "bed", { w: .8, d: 1.95, h: .5, mh: .45, m: { frame: "steel", sheet: "grey", blanket: "grey" }, style: "prison" }, { g: [MO, HO, MI] }],
    ["bed-iron", "Iron bedstead", "bed", { w: 1.1, d: 2, h: 1.2, m: { frame: "iron", sheet: "white", blanket: "grey" }, style: "metal" }, { g: [HI, HO] }],
    ["bed-straw", "Straw pallet", "bed", { w: .9, d: 1.9, h: .15, m: { blanket: "brown" }, style: "straw" }, { g: [F, MD, PA] }],
    ["bed-mattress", "Mattress on the floor", "bed", { w: 1.4, d: 1.95, h: .2, m: { sheet: "cream" }, style: "mattress" }, { g: [MO, PA, HO] }],
    ["bed-pod", "Sleep pod", "bed", { w: 1.1, d: 2.2, h: 1.3, mh: .45, m: { frame: "hullwhite", sheet: "white", blanket: "grey" }, style: "pod" }, { g: [SF, FU, CY] }]
  ]);
  M.add(FI, "Storage", [F, MD, HI, MO, HO], [
    ["wardrobe", "Wardrobe", "cabinet", { w: 1.2, d: .6, h: 2, m: { body: "walnut", handle: "brass" }, style: "wardrobe", crown: true }],
    ["wardrobe-modern", "Modern wardrobe", "cabinet", { w: 1.6, d: .6, h: 2.1, m: { body: "pwhite", handle: "chrome" }, style: "wardrobe", base: .05, pulls: true }, { g: [MO] }],
    ["dresser", "Chest of drawers", "cabinet", { w: 1, d: .5, h: .95, m: { body: "oak", handle: "brass" }, style: "dresser" }],
    ["dresser-mirror", "Dressing table with mirror", "cabinet", { w: 1.2, d: .5, h: .8, m: { body: "cherry", handle: "brass" }, style: "dresser", rows: 3, mirror: true, legs: true }, { g: [HI, MO, HO] }],
    ["nightstand", "Nightstand", "cabinet", { w: .45, d: .4, h: .6, m: { body: "walnut", handle: "brass" }, style: "nightstand", legs: true }],
    ["cupboard", "Cupboard", "cabinet", { w: 1, d: .5, h: 1.8, m: { body: "pine", handle: "iron" }, style: "cupboard", crown: true }],
    ["sideboard", "Sideboard", "cabinet", { w: 1.8, d: .5, h: .9, m: { body: "mahogany", handle: "brass" }, style: "sideboard", legs: true, turned: true }, { g: [HI, MO, HO] }],
    ["china-cabinet", "China cabinet", "cabinet", { w: 1.1, d: .45, h: 1.9, m: { body: "mahogany" }, style: "display", fill: "plates", crown: true }, { g: [HI, HO] }],
    ["display-trophy", "Trophy cabinet", "cabinet", { w: 1.2, d: .45, h: 1.9, m: { body: "walnut" }, style: "display", fill: "trophies", crown: true }, { g: [HI, MO] }],
    ["curio-cabinet", "Curiosity cabinet", "cabinet", { w: 1, d: .45, h: 1.9, m: { body: "ebony" }, style: "display", crown: true }, { g: [F, HI, HO] }],
    ["cabinet-medical", "Medicine cabinet", "cabinet", { w: .8, d: .4, h: 1.8, m: { body: "pwhite" }, style: "display" }, { g: [MO, HO, HI] }],
    ["filing", "Filing cabinet", "cabinet", { w: .47, d: .62, h: 1.32, m: { body: "hullgrey" }, style: "filing", base: .02 }, { g: [MO, HO, HI] }],
    ["filing-olive", "Army filing cabinet", "cabinet", { w: .47, d: .62, h: 1.32, m: { body: "olive" }, style: "filing", base: .02 }, { g: [MI, HI] }],
    ["lockers", "Row of lockers", "cabinet", { w: 1.2, d: .5, h: 1.85, m: { body: "paintblue" }, style: "locker", base: .05 }, { g: [MO, HO] }],
    ["lockers-olive", "Army lockers", "cabinet", { w: 1.2, d: .5, h: 1.85, m: { body: "olive" }, style: "locker", base: .05 }, { g: [MI] }],
    ["lockers-scifi", "Suit lockers", "cabinet", { w: 1.5, d: .55, h: 2.1, m: { body: "hullwhite" }, style: "locker", base: .05, n: 3 }, { g: FUT }],
    ["safe", "Safe", "cabinet", { w: .6, d: .6, h: .8, m: { body: "gunmetal" }, style: "safe", base: .05 }, { g: [HI, MO] }],
    ["safe-vault", "Bank safe", "cabinet", { w: 1, d: .8, h: 1.6, m: { body: "steel" }, style: "safe", base: .08 }, { g: [HI, MO] }],
    ["tool-chest", "Rolling tool chest", "cabinet", { w: .7, d: .5, h: 1, m: { body: "paintred", handle: "chrome" }, style: "dresser", rows: 6, pulls: true }, { g: [MO, PA, MI] }],
    ["bookcase", "Bookcase", "shelf", { w: 1, d: .32, h: 2, m: { frame: "walnut" } }],
    ["bookcase-tall", "Library bookcase", "shelf", { w: 1.4, d: .35, h: 2.6, n: 7, m: { frame: "mahogany" } }, { g: [F, HI, HO] }],
    ["bookcase-low", "Low bookshelf", "shelf", { w: 1.2, d: .3, h: 1, n: 3, m: { frame: "pine" } }],
    ["shelf-pantry", "Pantry shelves", "shelf", { w: 1.2, d: .4, h: 1.9, m: { frame: "pine" }, open: true, fill: "jars" }],
    ["shelf-wine", "Wine rack", "shelf", { w: 1.2, d: .4, h: 1.8, m: { frame: "oak" }, style: "cubby", fill: "bottles" }],
    ["shelf-scrolls", "Scroll rack", "shelf", { w: 1.2, d: .4, h: 1.6, m: { frame: "walnut" }, style: "cubby", fill: "scrolls" }, { g: [F, MD] }],
    ["shelf-potions", "Potion shelves", "shelf", { w: 1.2, d: .3, h: 1.8, m: { frame: "ebony" }, open: true, fill: "potions" }, { g: [F, HO] }],
    ["shelf-metal", "Metal shelving", "shelf", { w: 1.2, d: .45, h: 1.9, n: 5, m: { frame: "steel" }, style: "rack", fill: "boxes" }, { g: [MO, MI, PA, SF] }],
    ["shelf-store", "Shop shelving", "shelf", { w: 1.5, d: .5, h: 1.8, n: 5, m: { frame: "pwhite" }, style: "rack", fill: "goods" }, { g: [MO, CY, PA] }],
    ["shelf-canned", "Shelves of tins", "shelf", { w: 1.2, d: .4, h: 1.8, n: 5, m: { frame: "rust" }, style: "rack", fill: "cans" }, { g: [PA, MO, MI] }],
    ["shelf-skulls", "Ossuary shelves", "shelf", { w: 1.4, d: .4, h: 2, m: { frame: "darkstone" }, open: true, fill: "skulls" }, { g: [F, MD, HO] }],
    ["shelf-files", "Archive shelves", "shelf", { w: 1.4, d: .4, h: 2.2, n: 6, m: { frame: "hullgrey" }, style: "rack", fill: "files" }, { g: [MO, HI, MI] }],
    ["shelf-wall", "Wall shelf", "shelf", { w: 1, d: .22, h: .4, n: 1, y0: 1.3, m: { frame: "oak" }, style: "wall", fill: "mixed" }, W(1.3)]
  ]);
  M.add(FI, "Kitchen", [F, MD, HI, MO, HO, PA], [
    ["counter-kitchen", "Kitchen counter", "counter", { w: 1.8, d: .62, h: .9, m: { body: "pwhite", top: "granite", handle: "chrome" } }, { g: [MO, HO, PA] }],
    ["counter-sink", "Kitchen sink unit", "counter", { w: 1.2, d: .62, h: .9, m: { body: "pwhite", top: "granite", handle: "chrome" }, sink: true }, { g: [MO, HO, PA] }],
    ["counter-hob", "Counter with hob", "counter", { w: 1.2, d: .62, h: .9, m: { body: "pwhite", top: "granite", handle: "chrome" }, hob: true }, { g: [MO, HO, PA] }],
    ["counter-old", "Wooden kitchen counter", "counter", { w: 1.8, d: .62, h: .9, m: { body: "pine", top: "oak", handle: "iron" }, items: "food" }, { g: [HI, MD, F] }],
    ["counter-island", "Kitchen island", "counter", { w: 1.8, d: .9, h: .9, m: { body: "walnut", top: "marble", handle: "brass" }, style: "island" }, { g: [MO] }],
    ["stove-modern", "Cooker", "stove", { w: .6, d: .6, h: .9, m: { body: "pwhite" }, style: "modern" }, { g: [MO, HO, PA] }],
    ["stove-range", "Cast-iron range", "stove", { w: 1.2, d: .6, h: .85, ph: 2.6, m: { body: "iron" }, style: "range" }, { g: [HI, HO] }],
    ["stove-iron", "Pot-bellied stove", "stove", { w: .5, d: .5, h: 1, ph: 2.4, m: { body: "iron" }, style: "iron" }, { g: [HI, PA, MI, HO] }],
    ["stove-synth", "Food synthesiser", "stove", { w: .7, d: .6, h: 1.6, m: { body: "hullwhite" }, style: "synth" }, { g: [SF, FU, CY] }],
    ["fridge", "Refrigerator", "appliance", { w: .7, d: .7, h: 1.8, m: { body: "pwhite", handle: "chrome" } }, { g: [MO, HO, PA] }],
    ["fridge-retro", "Retro refrigerator", "appliance", { w: .75, d: .7, h: 1.6, m: { body: "porcelain" }, style: "retro" }, { g: [MO, HI, HO] }],
    ["icebox", "Icebox", "appliance", { w: .8, d: .55, h: 1.3, m: { body: "oak" }, style: "icebox" }, { g: [HI] }],
    ["fridge-drinks", "Drinks cooler", "appliance", { w: .75, d: .65, h: 1.9, m: { body: "paintred" }, style: "drinks" }, { g: [MO, CY] }],
    ["microwave", "Microwave", "appliance", { w: .5, d: .35, h: .3, m: { body: "pblack" }, style: "microwave" }, { g: [MO, CY], tags: ["small"] }],
    ["washer", "Washing machine", "appliance", { w: .6, d: .6, h: .85, m: { body: "pwhite" }, style: "washer" }, { g: [MO] }],
    ["boiler-water", "Water heater", "appliance", { w: .5, d: .5, h: 1.3, m: { body: "copper" }, style: "boiler" }, { g: [HI, MO, PA] }],
    ["hearth", "Cooking hearth", "fireplace", { w: 2, d: .8, h: 2.4, m: { body: "granite", hearth: "slate" }, style: "hearth" }, { g: [F, MD, HI] }]
  ]);
  M.add(FI, "Bathroom", [HI, MO, HO], [
    ["toilet", "Toilet", "toilet", { w: .4, d: .68, h: .42, m: { body: "porcelain", seat: "pwhite" } }, { g: [MO, HO, PA] }],
    ["toilet-steel", "Prison toilet", "toilet", { w: .45, d: .6, h: .42, m: { body: "steel" }, style: "steel" }, { g: [MO, MI, HO] }],
    ["latrine", "Latrine bench", "toilet", { w: 1, d: .6, h: .45, m: { body: "plank" }, style: "latrine" }, { g: [MD, MI, PA] }],
    ["sink-pedestal", "Basin", "sink", { w: .55, d: .45, h: .85, m: { body: "porcelain" } }],
    ["washstand", "Washstand with jug", "sink", { w: .8, d: .45, h: .8, m: { body: "walnut", top: "marble" }, style: "washstand" }, { g: [HI, HO, F] }],
    ["sink-utility", "Steel sink", "sink", { w: .8, d: .55, h: .9, m: { body: "steel" }, style: "utility" }, { g: [MO, HO, MI, PA] }],
    ["bathtub", "Clawfoot bathtub", "bathtub", { w: .8, d: 1.7, h: .65, m: { body: "porcelain", feet: "brass" } }],
    ["bathtub-modern", "Bathtub", "bathtub", { w: .75, d: 1.7, h: .55, m: { body: "pwhite" }, style: "built" }, { g: [MO] }],
    ["bathtub-tin", "Tin bath", "bathtub", { w: .6, d: 1.1, h: .4, m: { body: "steel" }, style: "tin" }, { g: [HI, MD, PA] }],
    ["bathtub-blood", "Bloodied bathtub", "bathtub", { w: .8, d: 1.7, h: .65, m: { body: "porcelain", feet: "iron" }, blood: true }, { g: [HO] }],
    ["shower", "Shower", "shower", { w: .9, d: .9, h: 2.1, m: { base: "porcelain" } }, { g: [MO, HO] }],
    ["trough", "Stone trough", "sink", { w: 1.6, d: .5, h: .55, m: { body: "granite" }, style: "trough" }, O({ g: [F, MD, HI] })]
  ]);
  M.add(FI, "Lighting", [F, MD, HI, MO, HO], [
    ["lamp-floor", "Floor lamp", "lamp", { w: .45, d: .45, h: 1.6, m: { body: "brass", shade: "cream" }, style: "floor" }, { g: [HI, MO, HO] }],
    ["lamp-table", "Table lamp", "lamp", { w: .32, d: .32, h: .55, m: { body: "porcelain", shade: "cream" }, style: "table" }, { g: [HI, MO, HO], tags: ["small"] }],
    ["lamp-desk", "Desk lamp", "lamp", { w: .2, d: .3, h: .5, m: { body: "brass" }, style: "desk" }, { g: [HI, MO, CY], tags: ["small"] }],
    ["lamp-oil", "Oil lamp", "lamp", { w: .14, d: .14, h: .32, m: { body: "brass" }, style: "oil" }, { g: [HI, F, HO], tags: ["small"] }],
    ["lantern", "Lantern", "lamp", { w: .16, d: .16, h: .35, m: { body: "iron" }, style: "lantern" }, B({ g: [F, MD, HI, HO, PA], tags: ["small"] })],
    ["lamp-street", "Street light", "lamp", { w: .5, d: 1, h: 4.5, m: { body: "gunmetal" }, style: "street" }, O({ g: [MO, CY, PA, HO] })],
    ["lamp-gas", "Gas lamp-post", "lamp", { w: .4, d: .4, h: 3.4, m: { body: "blackmetal" }, style: "gas" }, O({ g: [HI, HO] })],
    ["lamp-flood", "Floodlight", "lamp", { w: .9, d: .9, h: 2.2, m: { body: "paintyellow" }, style: "flood" }, B({ g: [MO, MI, PA] })],
    ["candelabrum", "Floor candelabrum", "lamp", { w: .4, d: .4, h: 1.6, m: { body: "iron" }, style: "candelabrum" }, { g: [F, MD, HO] }],
    ["lamp-lava", "Lava lamp", "lamp", { w: .18, d: .18, h: .48, m: { body: "chrome" }, style: "lava" }, { g: [MO, CY], tags: ["small"] }],
    ["chandelier", "Candle chandelier", "hanging", { w: 1, d: 1, h: 1, m: { body: "iron" }, style: "candles" }, C({ g: [F, MD, HI, HO] })],
    ["chandelier-crystal", "Crystal chandelier", "hanging", { w: 1.1, d: 1.1, h: 1.1, m: { body: "brass" }, style: "crystal" }, C({ g: [HI, F, HO] })],
    ["chandelier-iron", "Wagon-wheel chandelier", "hanging", { w: 1.3, d: 1.3, h: 1, m: { body: "blackmetal" }, style: "iron" }, C({ g: [F, MD] })],
    ["pendant", "Pendant lamp", "hanging", { w: .4, d: .4, h: 1, m: { body: "pblack" }, style: "pendant" }, C({ g: [MO, CY] })],
    ["light-cage", "Cage lamp", "hanging", { w: .25, d: .25, h: .7, m: { body: "steel" }, style: "cage" }, C({ g: [MO, MI, PA, HO] })],
    ["bulb", "Bare bulb", "hanging", { w: .1, d: .1, h: .8, m: { body: "pblack" }, style: "bulb" }, C({ g: [HI, MO, HO, PA] })],
    ["fan-ceiling", "Ceiling fan", "hanging", { w: 1.2, d: 1.2, h: .5, m: { body: "brass", blade: "walnut" }, style: "fan" }, C({ g: [MO, HI] })],
    ["light-panel", "Ceiling light panel", "hanging", { w: 1.2, d: .6, h: .08, m: { body: "pwhite" }, style: "panel" }, C({ g: [MO, SF, FU] })],
    ["lantern-hanging", "Hanging lantern", "hanging", { w: .25, d: .25, h: .8, m: { body: "iron" }, style: "lantern" }, C({ g: [F, MD, HI] })],
    ["light-surgical", "Surgical light", "hanging", { w: .7, d: .7, h: 1.2, m: { body: "pwhite" }, style: "surgical" }, C({ g: [MO, HO, SF] })],
    ["sconce-torch", "Wall torch", "sconce", { w: .15, d: .3, h: .6, y0: 1.6, m: { body: "iron" }, style: "torch" }, W(1.6, { g: [F, MD, HO] })],
    ["sconce-candle", "Candle sconce", "sconce", { w: .12, d: .2, h: .3, y0: 1.6, m: { body: "brass" }, style: "candle" }, W(1.6, { g: [F, HI, HO] })],
    ["sconce-electric", "Wall lamp", "sconce", { w: .18, d: .25, h: .25, y0: 1.7, m: { body: "brass", shade: "cream" }, style: "electric" }, W(1.7, { g: [HI, MO] })],
    ["light-emergency", "Emergency light", "sconce", { w: .35, d: .12, h: .1, y0: 2.2, m: { body: "pgrey" }, style: "emergency" }, W(2.2, { g: [MO, SF, MI] })],
    ["light-strip", "Strip light", "sconce", { w: 1.2, d: .1, h: .05, y0: 2.3, m: { body: "pgrey" }, style: "tube" }, W(2.3, { g: [MO, SF, FU] })],
    ["light-neon-tube", "Neon tube", "sconce", { w: 1.2, d: .1, h: .05, y0: 2.2, m: { body: "pblack", light: "glowmagenta" }, style: "tube" }, W(2.2, { g: [CY, FU] })],
    ["light-bulkhead", "Caged wall lamp", "sconce", { w: .16, d: .15, h: .16, y0: 2, m: { body: "iron" }, style: "cage" }, W(2, { g: [MO, MI, PA, HO] })],
    ["candle-stick", "Candlestick", "candles", { w: .12, d: .12, h: .35, m: { body: "brass" }, style: "stick" }, { g: [F, MD, HI, HO], tags: ["small"] }],
    ["candelabra", "Candelabra", "candles", { w: .4, d: .12, h: .5, m: { body: "silver" }, style: "candelabra" }, { g: [F, HI, HO], tags: ["small"] }],
    ["candles-cluster", "Cluster of candles", "candles", { w: .4, d: .4, h: .3, m: { body: "wax" }, style: "cluster" }, { g: [F, MD, HO], tags: ["small"] }],
    ["candles-ring", "Ring of candles", "candles", { w: 1.6, d: 1.6, h: .25, m: { body: "wax" }, style: "ring" }, { g: [F, HO] }]
  ]);
  M.add(FI, "Decor", [F, MD, HI, MO, HO], [
    ["rug-persian", "Persian rug", "rug", { w: 2, d: 3, h: .01, m: { body: "red" }, style: "persian", c1: "#7a2020", c2: "#d8c49a", c3: "#1f3050" }],
    ["rug-round", "Round rug", "rug", { w: 1.8, d: 1.8, h: .01, m: { body: "blue" }, style: "round", c1: "#30476e", c2: "#d8c49a", c3: "#7a2020" }],
    ["rug-runner", "Hall runner", "rug", { w: .9, d: 3.5, h: .01, m: { body: "wine" }, style: "runner", c1: "#5a1424", c2: "#c9a24a", c3: "#1f3050" }],
    ["rug-rag", "Rag rug", "rug", { w: 1.2, d: 1.8, h: .01, m: { body: "brown" }, style: "rag", c1: "#8a5a3a", c2: "#c8b48a", c3: "#5a6a7a" }, { g: [HI, MD, PA] }],
    ["rug-modern", "Modern rug", "rug", { w: 2, d: 1.4, h: .01, m: { body: "cream" }, style: "modern", c1: "#d9d1bd", c2: "#2f6f6c", c3: "#c4622d" }, { g: [MO, CY] }],
    ["rug-bearskin", "Bearskin rug", "rug", { w: 1.6, d: 2, h: .01, m: { body: "brown" }, style: "hide", c1: "#3a2a1e" }, { g: [F, MD, HI] }],
    ["rug-wolf", "Wolf pelt", "rug", { w: 1, d: 1.5, h: .01, m: { body: "grey" }, style: "hide", c1: "#6c6c6a" }, { g: [F, MD] }],
    ["painting-landscape", "Landscape painting", "frame", { w: 1, d: .05, h: .7, y0: 1.3, m: { frame: "gold" }, style: "painting" }, W(1.3)],
    ["painting-portrait", "Portrait", "frame", { w: .6, d: .05, h: .8, y0: 1.3, m: { frame: "gold" }, style: "portrait" }, W(1.3)],
    ["painting-sinister", "Sinister portrait", "frame", { w: .8, d: .05, h: 1.1, y0: 1.2, m: { frame: "ebony" }, style: "portrait" }, W(1.2, { g: [HO, HI, F] })],
    ["mirror", "Mirror", "frame", { w: .6, d: .05, h: .9, y0: 1.1, m: { frame: "gold" }, style: "mirror" }, W(1.1)],
    ["map-wall", "Wall map", "frame", { w: 1.2, d: .05, h: .8, y0: 1.3, m: { frame: "walnut" }, style: "map" }, W(1.3, { g: ALL })],
    ["board-crime", "Evidence board", "frame", { w: 1.5, d: .05, h: 1, y0: 1, m: { frame: "oak" }, style: "board" }, W(1, { g: [MO, HI, HO, CY] })],
    ["blackboard", "Blackboard", "frame", { w: 2, d: .05, h: 1, y0: .9, m: { frame: "oak" }, style: "blackboard" }, W(.9, { g: [HI, MO, HO] })],
    ["poster", "Poster", "frame", { w: .6, d: .02, h: .85, y0: 1.2, style: "poster", c1: "#c4622d", c2: "#1f2a38" }, W(1.2, { g: [MO, CY, MI, PA] })],
    ["clock-grandfather", "Grandfather clock", "clock", { w: .5, d: .3, h: 2.1, m: { body: "walnut" } }, { g: [HI, HO] }],
    ["clock-wall", "Wall clock", "clock", { w: .35, d: .06, h: .35, y0: 1.8, m: { body: "walnut" }, style: "wall" }, W(1.8, { g: [HI, MO, HO] })],
    ["piano-upright", "Upright piano", "piano", { w: 1.5, d: .6, h: 1.3, m: { body: "ebony" }, items: true }, { g: [HI, MO, HO] }],
    ["piano-grand", "Grand piano", "piano", { w: 1.5, d: 2, h: 1, m: { body: "ebony" }, style: "grand" }, { g: [HI, MO, HO] }],
    ["organ", "Pipe organ", "piano", { w: 2.4, d: 1, h: 3.2, m: { body: "walnut" }, style: "organ" }, { g: [HI, HO, F] }],
    ["plant-fern", "Potted fern", "potplant", { w: .5, d: .5, h: .7, m: { pot: "terracotta" }, style: "fern" }, { g: [HI, MO] }],
    ["plant-ficus", "Potted tree", "potplant", { w: .6, d: .6, h: 1.6, m: { pot: "terracotta" }, style: "ficus" }, { g: [MO, HI] }],
    ["plant-palm", "Potted palm", "potplant", { w: .8, d: .8, h: 1.5, m: { pot: "ceramicblue" }, style: "palm" }, { g: [HI, MO] }],
    ["plant-cactus", "Potted cactus", "potplant", { w: .3, d: .3, h: .5, m: { pot: "terracotta" }, style: "cactus" }, { g: [MO], tags: ["small"] }],
    ["plant-flowers", "Flower pot", "potplant", { w: .35, d: .35, h: .45, m: { pot: "terracotta" }, style: "flowers" }, { g: [HI, MO, F], tags: ["small"] }],
    ["plant-snake", "Snake plant", "potplant", { w: .35, d: .35, h: .8, m: { pot: "pwhite" }, style: "snake" }, { g: [MO, CY] }],
    ["plant-dead", "Dead houseplant", "potplant", { w: .45, d: .45, h: .7, m: { pot: "terracotta" }, style: "dead" }, { g: [HO, PA] }],
    ["fireplace-stone", "Stone fireplace", "fireplace", { w: 1.8, d: .6, h: 2.6, m: { body: "limestone", mantel: "oak", hearth: "slate" } }, { g: [F, MD, HI, HO] }],
    ["fireplace-grand", "Grand fireplace", "fireplace", { w: 2.6, d: .8, h: 3, m: { body: "marble", hearth: "marble" }, style: "grand", items: "candles" }, { g: [HI, F, HO] }],
    ["fireplace-brick", "Brick fireplace", "fireplace", { w: 1.5, d: .5, h: 2.4, m: { body: "brick", mantel: "walnut", hearth: "slate" }, items: "clock" }, { g: [HI, MO] }],
    ["fireplace-cold", "Cold fireplace", "fireplace", { w: 1.8, d: .6, h: 2.6, m: { body: "darkstone", mantel: "ebony", hearth: "slate" }, lit: false, items: "skull" }, { g: [HO, F] }]
  ]);
  M.add(FI, "Office & screens", [MO, CY], [
    ["computer-desktop", "Desktop computer", "computer", { w: 1, d: .6, h: .5 }, { tags: ["small"] }],
    ["computer-crt", "Old computer", "computer", { w: .45, d: .6, h: .45, style: "crt" }, { g: [MO, PA, HO], tags: ["small"] }],
    ["laptop", "Laptop", "computer", { w: .33, d: .23, h: .22, m: { body: "aluminium" }, style: "laptop" }, { g: [MO, CY, MI], tags: ["small"] }],
    ["workstation", "Triple-monitor workstation", "computer", { w: 1.6, d: .6, h: .55, style: "workstation" }, { g: [MO, CY, SF], tags: ["small"] }],
    ["terminal-green", "Green-screen terminal", "computer", { w: .45, d: .6, h: .45, m: { body: "beige" }, style: "terminal" }, { g: [MO, HI, PA, CY], tags: ["small"] }],
    ["tv-flat", "Flat-screen television", "screen", { w: 1.2, d: .3, h: .8, m: { screen: "screen" }, style: "flat" }, { tags: ["small"] }],
    ["tv-wall", "Wall screen", "screen", { w: 1.6, d: .1, h: .9, y0: 1.2, m: { screen: "screen" }, style: "wall" }, W(1.2, { g: [MO, CY, SF, FU] })],
    ["tv-crt", "Old television", "screen", { w: .6, d: .5, h: .5, m: { body: "walnut" }, style: "crt", ant: true }, { g: [MO, HI, HO, PA], tags: ["small"] }],
    ["tv-cabinet", "Television cabinet", "screen", { w: 1, d: .5, h: .9, m: { body: "walnut" }, style: "cabinet" }, { g: [HI, MO, HO] }],
    ["screen-board", "Display screen on a stand", "screen", { w: 1.6, d: .6, h: 1.9, m: { screen: "screen" }, style: "board" }, { g: [MO, CY, SF, MI] }],
    ["watercooler", "Water cooler", "appliance", { w: .35, d: .35, h: 1.3, m: { body: "pwhite" }, style: "cooler" }],
    ["copier", "Photocopier", "appliance", { w: .6, d: .6, h: 1.1, m: { body: "pgrey" }, style: "copier" }],
    ["atm", "Cash machine", "appliance", { w: .8, d: .7, h: 1.7, m: { body: "pgrey" }, style: "atm" }, B()],
    ["cubicle", "Office cubicle", "office", { w: 1.8, d: 1.6, h: 1.5, m: { panel: "grey", top: "birch" }, style: "cubicle" }],
    ["partition", "Office partition", "office", { w: 1.6, d: .06, h: 1.5, m: { body: "grey" }, style: "partition" }],
    ["whiteboard", "Whiteboard", "office", { w: 1.5, d: .5, h: 1.8, m: { body: "steel" }, style: "whiteboard" }]
  ]);
  M.add(FI, "Medical", [MO, HO, SF], [
    ["iv-stand", "Drip stand", "medical", { w: .5, d: .5, h: 1.9, style: "iv" }],
    ["monitor-medical", "Patient monitor", "medical", { w: .5, d: .5, h: 1.5, m: { body: "pwhite" }, style: "monitor" }],
    ["gurney", "Gurney", "medical", { w: .65, d: 1.95, h: .85, m: { pad: "vinyl" }, style: "gurney" }],
    ["gurney-body", "Covered body on a gurney", "medical", { w: .65, d: 1.95, h: .85, m: { pad: "vinyl", sheet: "white" }, style: "gurney", body: true }, { g: [MO, HO, HI] }],
    ["wheelchair", "Wheelchair", "medical", { w: .65, d: .8, h: .95, m: { seat: "vinyl" }, style: "wheelchair" }, { g: [MO, HO, HI] }],
    ["xray", "X-ray light box", "medical", { w: .8, d: .1, h: .6, y0: 1.2, m: { body: "pwhite" }, style: "xray" }, W(1.2)],
    ["scanner", "Body scanner", "medical", { w: .9, d: 2.3, h: 1.9, m: { body: "hullwhite" }, style: "scanner" }, { g: [SF, FU, MO] }],
    ["table-operating", "Operating table", "table", { w: .75, d: 2, h: .9, m: { top: "steel", legs: "steel" }, style: "metal", straps: true, items: "surgery" }, { g: [MO, HO, HI, SF] }],
    ["table-autopsy", "Autopsy slab", "table", { w: .8, d: 2.1, h: .9, m: { top: "steel", legs: "steel" }, style: "pedestal" }, { g: [MO, HO, HI] }]
  ]);

  /* ================= B. medieval and fantasy ================= */
  const MF = "Medieval & fantasy";
  M.add(MF, "Tavern & cellar", [F, MD, HI], [
    ["barrel", "Barrel", "barrel", { w: .6, d: .6, h: .9, m: { body: "oak", band: "iron" } }, B()],
    ["barrel-keg", "Keg", "barrel", { w: .4, d: .4, h: .55, m: { body: "oak", band: "iron" }, style: "keg" }, B({ tags: ["small"] })],
    ["barrel-cask", "Wine cask on a cradle", "barrel", { w: 1, d: 1.4, h: 1.4, m: { body: "oak", band: "iron", cradle: "oak" }, style: "cask", lie: true }],
    ["barrel-tap", "Ale barrel with a tap", "barrel", { w: .6, d: .6, h: .9, m: { body: "oak", band: "iron" }, style: "tap" }],
    ["barrel-rain", "Rain barrel", "barrel", { w: .65, d: .65, h: .9, m: { body: "oak", band: "iron" }, style: "open", fill: "water" }, O({ g: [F, MD, HI, PA] })],
    ["barrel-apples", "Barrel of apples", "barrel", { w: .6, d: .6, h: .9, m: { body: "oak", band: "iron" }, style: "open", fill: "fruitred" }, B()],
    ["barrel-powder", "Powder keg", "barrel", { w: .45, d: .45, h: .6, m: { body: "walnut", band: "iron" }, style: "powder" }, { g: [F, MD, HI, MI] }],
    ["barrel-stack", "Stacked barrels", "barrel", { w: .6, d: .6, h: .9, n: 3, m: { body: "oak", band: "iron" } }, B()],
    ["counter-bar", "Tavern bar", "counter", { w: 3, d: .7, h: 1.1, m: { body: "oak", top: "walnut" }, style: "bar", taps: 3, items: "tavern" }],
    ["counter-bar-chrome", "Chrome bar counter", "counter", { w: 3, d: .7, h: 1.1, m: { body: "chrome", top: "pblack" }, style: "bar", taps: 2 }, { g: [MO, CY] }],
    ["sign-inn", "Inn sign", "signpost", { w: 1.4, d: .2, h: 2.6, m: { body: "oak", sign: "oak" }, style: "hanging", text: "THE BLACK BOAR" }, O()]
  ]);
  M.add(MF, "Smithy & armoury", [F, MD, HI], [
    ["anvil", "Anvil", "smithy", { w: .6, d: .45, h: .75, m: { body: "iron" }, style: "anvil" }, B()],
    ["forge", "Forge", "smithy", { w: 1.6, d: 1.2, h: 1.9, m: { body: "brick" }, style: "forge" }, B()],
    ["grindstone", "Grindstone", "smithy", { w: .8, d: .6, h: 1, m: { body: "sandstone", frame: "oak" }, style: "grindstone" }, B()],
    ["quench", "Quenching trough", "smithy", { w: 1.2, d: .5, h: .6, m: { body: "oak" }, style: "quench" }, B()],
    ["rack-weapons", "Weapon rack", "weapon", { w: 1.4, d: .3, h: 1.6, m: { body: "oak" }, style: "rack" }, { g: [F, MD, HI, MI] }],
    ["rack-swords", "Sword rack", "weapon", { w: 1.2, d: .3, h: 1.4, m: { body: "walnut" }, style: "rack", kind: "sword" }],
    ["rack-spears", "Spear rack", "weapon", { w: 1.2, d: .3, h: 1.8, m: { body: "oak" }, style: "rack", kind: "spear" }],
    ["rack-rifles", "Rifle rack", "weapon", { w: 1.4, d: .3, h: 1.4, m: { body: "olive" }, style: "rack", kind: "rifle" }, { g: [MI, HI, MO, PA] }],
    ["armor-plate", "Suit of armour", "armour", { w: .6, d: .4, h: 1.9, m: { body: "steel", stand: "oak", trim: "red" }, style: "plate", shield: true }],
    ["armor-mail", "Mail on a stand", "armour", { w: .6, d: .4, h: 1.8, m: { body: "iron", stand: "oak" }, style: "mail" }],
    ["armor-robe", "Robes on a stand", "armour", { w: .6, d: .4, h: 1.8, m: { body: "purple", stand: "walnut" }, style: "robe" }, { g: [F, HO] }],
    ["dummy", "Training dummy", "armour", { w: 1, d: .4, h: 1.7, m: { body: "burlap" }, style: "dummy" }, B()],
    ["target", "Archery target", "armour", { w: 1, d: .6, h: 1.6, m: { body: "straw" }, style: "target" }, O()]
  ]);
  M.add(MF, "Magic", [F, HO], [
    ["cauldron", "Cauldron", "vessel", { w: .7, d: .7, h: .55, m: { body: "iron" }, style: "cauldron", fill: "glowgreen" }, B({ g: [F, MD, HO] })],
    ["cauldron-fire", "Cauldron over a fire", "vessel", { w: .8, d: .8, h: .6, m: { body: "iron" }, style: "cauldron", fill: "glowviolet", fire: true }, B({ g: [F, MD, HO] })],
    ["crystalball", "Crystal ball", "curio", { w: .25, d: .25, h: .32, m: { body: "walnut" }, style: "crystalball" }, { tags: ["small"] }],
    ["lectern", "Lectern with a tome", "lectern", { w: .55, d: .45, h: 1.15, m: { body: "oak" } }, { g: [F, MD, HI, HO] }],
    ["circle-magic", "Magic circle", "decal", { w: 3, d: 3, h: .01, style: "circle", c1: "#6ff0ff" }, B()],
    ["circle-summoning", "Summoning circle", "decal", { w: 3, d: 3, h: .01, style: "pentagram", c1: "#7a0d0d" }, B()],
    ["sigil", "Glowing sigil", "decal", { w: 1.2, d: 1.2, h: .01, style: "sigil", c1: "#7dff8a" }, B({ g: [F, HO, SF] })],
    ["altar-stone", "Stone altar", "altar", { w: 1.6, d: .8, h: 1, m: { body: "granite" } }, B({ g: [F, MD, HO] })],
    ["altar-dark", "Dark altar", "altar", { w: 1.6, d: .8, h: 1, m: { body: "obsidian" }, style: "dark" }, B({ g: [F, HO] })],
    ["altar-sacrifice", "Sacrificial slab", "altar", { w: 2, d: .9, h: .9, m: { body: "darkstone" }, style: "slab", blood: true }, B({ g: [F, HO] })],
    ["telescope", "Telescope", "curio", { w: .8, d: .8, h: 1.6, m: { body: "brass", frame: "walnut" }, style: "telescope" }, B({ g: [F, HI, MO] })],
    ["globe", "Globe", "curio", { w: .45, d: .45, h: .9, m: { body: "walnut" }, style: "globe" }, { g: [F, HI, MO] }],
    ["hourglass", "Hourglass", "curio", { w: .12, d: .12, h: .25, m: { body: "walnut" }, style: "hourglass" }, { tags: ["small"] }]
  ]);
  M.add(MF, "Castle & keep", [F, MD], [
    ["banner-wall", "Wall banner", "banner", { w: .8, d: .1, h: 1.8, y0: 1.2, c1: "#7a1f1f", c2: "#d9b04a", emblem: "lion" }, W(1.2)],
    ["banner-wall-blue", "Blue banner with a star", "banner", { w: .8, d: .1, h: 1.8, y0: 1.2, c1: "#1f3050", c2: "#e3d8c0", emblem: "star" }, W(1.2)],
    ["banner-cult", "Cult banner", "banner", { w: .8, d: .1, h: 1.8, y0: 1.2, c1: "#1d1b1a", c2: "#7a0d0d", emblem: "eye" }, W(1.2, { g: [F, HO] })],
    ["banner-standing", "Standing banner", "banner", { w: .7, d: .3, h: 2.2, m: { pole: "oak" }, style: "standing", c1: "#2f4a32", c2: "#d9b04a", emblem: "tree" }, B()],
    ["tapestry", "Tapestry", "tapestry", { w: 2, d: .08, h: 1.5, y0: 1 }, W(1, { g: [F, MD, HI] })],
    ["statue-knight", "Knight statue", "statue", { w: .8, d: .8, h: 2.4, m: { body: "limestone" }, style: "knight" }, B({ g: [F, MD, HI] })],
    ["statue-robed", "Robed figure", "statue", { w: .8, d: .8, h: 2.3, m: { body: "granite" }, style: "robed" }, B({ g: [F, MD, HO] })],
    ["statue-angel", "Angel statue", "statue", { w: .9, d: .9, h: 2.4, m: { body: "marble" }, style: "angel" }, B({ g: [F, HI, HO] })],
    ["statue-bust", "Bust on a plinth", "statue", { w: .5, d: .5, h: 1.6, m: { body: "marble", plinth: "granite" }, style: "bust" }, { g: [HI, F, MO] }],
    ["gargoyle", "Gargoyle", "statue", { w: .6, d: .6, h: 1.2, m: { body: "darkstone" }, style: "gargoyle" }, B({ g: [F, MD, HO] })],
    ["brazier", "Brazier", "brazier", { w: .6, d: .6, h: 1, m: { body: "iron" }, style: "tripod" }, B({ g: [F, MD, HO] })],
    ["brazier-bowl", "Fire bowl", "brazier", { w: .8, d: .8, h: .9, m: { body: "bronze" }, style: "bowl" }, B({ g: [F, MD, HO] })],
    ["chest", "Iron-bound chest", "chest", { w: .9, d: .55, h: .65, m: { body: "oak", band: "iron" }, style: "dome" }, B({ g: [F, MD, HI] })],
    ["chest-treasure", "Treasure chest", "chest", { w: .9, d: .55, h: .65, m: { body: "oak", band: "iron" }, style: "dome", fill: "gold" }, B({ g: [F, MD, HI] })],
    ["chest-flat", "Plain chest", "chest", { w: .8, d: .45, h: .5, m: { body: "pine", band: "iron" }, style: "flat" }, B({ g: [F, MD, HI, PA] })],
    ["chest-ornate", "Ornate chest", "chest", { w: .9, d: .55, h: .65, m: { body: "ebony", band: "gold" }, style: "ornate" }, B({ g: [F, HI] })],
    ["coffer", "Coffer", "chest", { w: .4, d: .28, h: .28, m: { body: "walnut", band: "brass" }, style: "flat" }, { g: [F, MD, HI], tags: ["small"] }],
    ["stocks", "Stocks", "stocks", { w: 1.4, d: .5, h: .9, m: { body: "oak" }, style: "stocks" }, O({ g: [MD, HI, HO] })],
    ["pillory", "Pillory", "stocks", { w: 1, d: .4, h: 1.9, m: { body: "oak" }, style: "pillory" }, O({ g: [MD, HI, HO] })],
    ["cage", "Iron cage", "cage", { w: 1.5, d: 1.5, h: 1.8, m: { body: "iron", bars: "iron" }, straw: true }, B({ g: [F, MD, HO, PA] })],
    ["cage-hanging", "Hanging cage", "cage", { w: .8, d: .8, h: 2.2, m: { bars: "iron" }, style: "hanging", bones: true }, C({ g: [F, MD, HO] })]
  ]);
  M.add(MF, "Village & camp", [F, MD, HI], [
    ["well", "Well", "well", { w: 1.4, d: 1.4, h: 2.6, m: { body: "granite", frame: "oak", roof: "plank" } }, O()],
    ["cart-hand", "Handcart", "cart", { w: 1, d: 1.8, h: .9, m: { body: "plank", frame: "oak" }, style: "hand" }, O({ g: [F, MD, HI, PA] })],
    ["cart-hay", "Hay cart", "cart", { w: 1.4, d: 2.8, h: 1.2, m: { body: "plank", frame: "oak" }, style: "wagon", fill: "hay" }, O()],
    ["cart-goods", "Cart of goods", "cart", { w: 1.4, d: 2.8, h: 1.2, m: { body: "plank", frame: "oak" }, style: "wagon", fill: "goods" }, O()],
    ["cart-plague", "Plague cart", "cart", { w: 1.2, d: 2.4, h: 1, m: { body: "driftwood", frame: "driftwood" }, style: "wagon", fill: "corpse" }, O({ g: [MD, HO] })],
    ["wagon", "Covered wagon", "cart", { w: 1.4, d: 2.8, h: 2.2, m: { body: "plank", frame: "oak", canvas: "canvas" }, style: "merchant" }, O()],
    ["haybale", "Hay bale", "hay", { w: 1, d: .5, h: .4, m: { body: "hay" } }, B({ g: [F, MD, HI, MO] })],
    ["hay-stack", "Stack of hay bales", "hay", { w: 1.6, d: .5, h: .4, n: 5, m: { body: "hay" } }, B({ g: [F, MD, HI, MO] })],
    ["hay-round", "Round bale", "hay", { w: 1.2, d: 1.2, h: 1.2, m: { body: "hay" }, style: "round" }, O({ g: [HI, MO] })],
    ["hay-pile", "Pile of straw", "hay", { w: 1.4, d: 1.4, h: .5, m: { body: "straw" }, style: "pile" }, B()],
    ["woodpile", "Woodpile with an axe", "woodpile", { w: 1.4, d: .5, h: .8, m: { body: "bark" }, axe: true }, B({ g: [F, MD, HI, PA, MO] })],
    ["tent", "Tent", "tent", { w: 2, d: 2.4, h: 1.6, m: { body: "canvas", pole: "oak" } }, O({ g: [F, MD, HI, MO, PA] })],
    ["tent-pavilion", "Pavilion", "tent", { w: 3.5, d: 3.5, h: 3.2, m: { body: "cream", roof: "red" }, style: "pavilion" }, O()],
    ["yurt", "Yurt", "tent", { w: 4, d: 4, h: 2.8, m: { body: "cream" }, style: "yurt" }, O()],
    ["campfire", "Campfire", "campfire", { w: 1, d: 1, h: .5 }, O({ g: ALL })],
    ["campfire-spit", "Campfire with a spit", "campfire", { w: 1.1, d: 1.1, h: .7, spit: true }, O()],
    ["campfire-pot", "Campfire with a pot", "campfire", { w: 1, d: 1, h: .5, pot: true }, O({ g: [F, MD, HI, PA, MI] })],
    ["stall-market", "Market stall", "stall", { w: 2, d: 1.2, h: 2.2, m: { body: "plank", top: "oak" }, goods: "produce" }, O()],
    ["stall-cloth", "Cloth merchant's stall", "stall", { w: 2, d: 1.2, h: 2.2, m: { body: "plank", top: "oak" }, goods: "cloth", c1: "#2a5ab0" }, O()],
    ["stall-pots", "Potter's stall", "stall", { w: 2, d: 1.2, h: 2.2, m: { body: "plank", top: "oak" }, goods: "pots", c1: "#3c8a4c" }, O()],
    ["stall-fish", "Fishmonger's stall", "stall", { w: 2, d: 1.2, h: 2.2, m: { body: "plank", top: "oak" }, goods: "fish", c1: "#30476e" }, O()],
    ["stall-potions", "Potion seller's stall", "stall", { w: 2, d: 1.2, h: 2.2, m: { body: "ebony", top: "walnut" }, goods: "potions", c1: "#5a2e6a", c2: "#d9b04a" }, O({ g: [F] })],
    ["signpost", "Signpost", "signpost", { w: 1, d: 1, h: 2.2, m: { body: "oak" }, text: "NORTH|TOWN|MINE" }, O({ g: [F, MD, HI, PA] })],
    ["noticeboard", "Notice board", "signpost", { w: 1.5, d: .4, h: 2.2, m: { body: "oak", roof: "plank" }, style: "board" }, O({ g: [F, MD, HI] })]
  ]);

  /* ================= C. science fiction and space ================= */
  const SS = "Sci-fi & space";
  M.add(SS, "Consoles & computers", [SF, FU, CY], [
    ["console-desk", "Control console", "console", { w: 1.8, d: .9, h: .95, m: { body: "hullgrey", screen: "screen" } }],
    ["console-bridge", "Bridge console", "console", { w: 3, d: 1.2, h: .95, m: { body: "hullgrey" }, style: "bridge" }],
    ["console-station", "Engineering station", "console", { w: 1.4, d: .8, h: 1.6, m: { body: "gunmetal" }, style: "station" }],
    ["console-wall", "Wall control panel", "console", { w: 1.4, d: .3, h: 1.2, y0: .8, m: { body: "hullgrey" }, style: "wall" }, W(.8)],
    ["kiosk", "Information kiosk", "console", { w: .6, d: .5, h: 1.5, m: { body: "hullwhite" }, style: "kiosk" }, B({ g: [SF, FU, CY, MO] })],
    ["holotable", "Holo-table (planet)", "holotable", { w: 1.6, d: 1.6, h: .95, m: { body: "hullgrey" }, show: "planet" }],
    ["holotable-map", "Holo-table (tactical map)", "holotable", { w: 1.6, d: 1.6, h: .95, m: { body: "gunmetal" }, show: "map" }, { g: [SF, FU, CY, MI] }],
    ["holotable-ship", "Holo-table (ship)", "holotable", { w: 1.6, d: 1.6, h: .95, m: { body: "hullgrey" }, show: "ship" }],
    ["server", "Server rack", "server", { w: .6, d: 1, h: 2.1, m: { body: "blackmetal" } }, { g: [SF, FU, CY, MO] }],
    ["server-row", "Row of server racks", "server", { w: 2.4, d: 1, h: 2.1, n: 4, m: { body: "blackmetal" } }, { g: [SF, FU, CY, MO] }]
  ]);
  M.add(SS, "Machinery", [SF, FU], [
    ["reactor", "Reactor core", "reactor", { w: 2, d: 2, h: 3, m: { body: "hullgrey", core: "glowcyan", pipe: "steel" } }],
    ["reactor-red", "Unstable reactor", "reactor", { w: 2, d: 2, h: 3, m: { body: "gunmetal", core: "glowred", pipe: "rust" } }, { g: [SF, FU, HO] }],
    ["generator-scifi", "Power generator", "reactor", { w: 1.6, d: 1, h: 1.6, m: { body: "hullgrey" }, style: "generator" }],
    ["tank-fuel", "Fuel tank", "tank", { w: 2.5, d: 1.2, h: 1.3, m: { body: "hullwhite", saddle: "steel" }, style: "horizontal", text: "H2 · FUEL" }, B({ g: [SF, FU, MO, MI] })],
    ["turret", "Sentry turret", "turret", { w: .8, d: .8, h: 1.1, m: { body: "hullgrey" } }, B()],
    ["dish", "Satellite dish", "dish", { w: 2, d: 2, h: 2.4, m: { body: "hullwhite" } }, O({ g: [SF, FU, MO, MI] })],
    ["antenna", "Antenna mast", "dish", { w: .6, d: .6, h: 4, m: { body: "steel" }, style: "antenna" }, O({ g: [SF, FU, MO, MI, PA] })],
    ["vent-floor", "Floor vent", "vent", { w: .6, d: .6, h: .03, m: { body: "steel" } }, { g: [SF, FU, MO, CY] }],
    ["vent-wall", "Wall vent", "vent", { w: .6, d: .1, h: .4, y0: .3, m: { body: "steel" }, style: "wall" }, W(.3, { g: [SF, FU, MO, CY, HO] })],
    ["vent-fan", "Exhaust fan", "vent", { w: .8, d: .8, h: .05, m: { body: "gunmetal" }, style: "fan" }, { g: [SF, FU, MO, CY, PA] }],
    ["pipes-scifi", "Coolant pipes", "pipes", { w: 3, d: .6, h: .4, m: { body: "hullgrey" }, style: "bundle" }]
  ]);
  M.add(SS, "Medical & science", [SF, FU, HO], [
    ["cryopod", "Cryo pod", "pod", { w: .9, d: .9, h: 2.2, m: { body: "hullwhite" }, style: "cryo" }],
    ["tank-specimen", "Specimen tank", "pod", { w: .9, d: .9, h: 2.2, m: { body: "gunmetal" }, style: "specimen" }],
    ["medkit-wall", "Wall medical station", "console", { w: .8, d: .25, h: .9, y0: .9, m: { body: "pwhite" }, style: "wall" }, W(.9)]
  ]);
  M.add(SS, "Cargo", [SF, FU, CY, MO], [
    ["crate-scifi", "Cargo crate", "crate", { w: 1, d: .8, h: .7, m: { body: "hullwhite", trim: "pyellow" }, style: "scifi" }, B()],
    ["crate-scifi-stack", "Stacked cargo crates", "crate", { w: 1, d: .8, h: .7, n: 3, m: { body: "hullgrey", trim: "porange" }, style: "scifi" }, B()],
    ["container", "Shipping container", "container", { w: 2.44, d: 6.06, h: 2.59, m: { body: "paintorange" }, text: "MAERCO" }, O({ g: [MO, MI, PA, CY, SF] })],
    ["container-blue", "Blue shipping container", "container", { w: 2.44, d: 6.06, h: 2.59, m: { body: "paintblue" } }, O({ g: [MO, MI, PA, CY, SF] })],
    ["container-open", "Open shipping container", "container", { w: 2.44, d: 6.06, h: 2.59, m: { body: "paintgreen" }, open: true }, O({ g: [MO, MI, PA, CY, SF] })],
    ["container-pod", "Cargo pod", "container", { w: 2.44, d: 4, h: 2.4, m: { body: "hullwhite" }, text: "MK-7 / KEEP SEALED" }, B({ g: FUT })]
  ]);
  M.add(SS, "Ship & station", [SF, FU], [
    ["bulkhead", "Bulkhead door", "door", { w: 1.6, d: .4, h: 2.5, m: { body: "hullgrey", frame: "hullgrey" }, style: "scifi" }],
    ["airlock", "Airlock door", "door", { w: 2, d: .5, h: 2.6, m: { body: "steel", frame: "hullwhite" }, style: "scifi" }],
    ["wall-hull", "Hull wall panel", "wall", { w: 2, d: .2, h: 2.6, m: { body: "hullgrey" }, style: "panel" }],
    ["column-scifi", "Support pillar", "column", { w: .5, d: .5, h: 2.8, m: { body: "hullgrey", trim: "steel" }, style: "scifi" }],
    ["window-porthole", "Porthole", "window", { w: .8, d: .2, h: .8, y0: 1.1, m: { frame: "steel" }, style: "porthole" }, W(1.1, { g: [SF, FU, HI] })],
    ["floor-hazard", "Hazard stripes", "decal", { w: 2, d: .4, h: .01, style: "hazard" }, B({ g: [SF, FU, MO, MI] })],
    ["floor-helipad", "Landing pad marking", "decal", { w: 6, d: 6, h: .01, style: "helipad" }, O({ g: [SF, FU, MO, MI] })],
    ["platform-round", "Round platform", "platform", { w: 3, d: 3, h: .3, m: { body: "hullgrey" }, style: "round" }, B()]
  ]);
  M.add(SS, "Robots", [SF, FU, CY], [
    ["robot", "Service robot", "robot", { w: .6, d: .4, h: 1.8, m: { body: "hullwhite", joint: "gunmetal" } }, B()],
    ["robot-combat", "Combat android", "robot", { w: .65, d: .45, h: 1.9, m: { body: "blackmetal", joint: "gunmetal", eye: "glowred" } }, B()],
    ["robot-box", "Cargo bot", "robot", { w: .7, d: .6, h: 1, m: { body: "paintyellow" }, style: "box" }, B()],
    ["drone", "Hover drone", "robot", { w: .7, d: .7, h: .5, m: { body: "gunmetal" }, style: "drone" }, B({ g: [SF, FU, CY, MO, MI] })],
    ["robot-spider", "Spider bot", "robot", { w: 1.2, d: 1.2, h: .7, m: { body: "gunmetal", eye: "glowred" }, style: "spider" }, B()],
    ["mech", "Walker mech", "robot", { w: 2.4, d: 2, h: 3.6, m: { body: "olive", eye: "glowamber" }, style: "mech" }, O({ g: [SF, FU, MI, CY] })]
  ]);
  M.add(SS, "Alien", [SF, FU, HO], [
    ["altar-alien", "Alien altar", "altar", { w: 1.6, d: .9, h: 1, m: { body: "alien" }, style: "scifi" }, B()],
    ["obelisk-alien", "Alien obelisk", "statue", { w: 1, d: 1, h: 3.5, m: { body: "obsidian", plinth: "alien" }, style: "obelisk" }, B({ g: [SF, FU, HO, F] })],
    ["statue-eldritch", "Eldritch statue", "statue", { w: 1.2, d: 1.2, h: 2.6, m: { body: "mossstone" }, style: "idol" }, B({ g: [HO, F, SF] })]
  ]);

  /* ================= D. cyberpunk ================= */
  const CP = "Cyberpunk";
  M.add(CP, "Street", [CY, FU, MO], [
    ["vending-cyber", "Synth-cola machine", "vending", { w: .9, d: .8, h: 1.9, m: { body: "blackmetal" }, style: "cyber" }, B()],
    ["stall-noodle", "Noodle stall", "stall", { w: 2, d: 1.2, h: 2.3, m: { body: "steel", top: "steel" }, style: "cyber", c1: "#1d1b1a", c2: "#e03ac0", text: "RAMEN" }, B()],
    ["trash-bags", "Pile of rubbish bags", "trash", { w: 1.4, d: 1.2, h: .6, m: { body: "pblack" } }, B({ g: [CY, MO, PA, HO] })],
    ["litter", "Litter", "trash", { w: 2, d: 2, h: .05, style: "litter" }, B({ g: [CY, MO, PA, HO] })],
    ["dumpster", "Dumpster", "container", { w: 1.9, d: 1.1, h: 1.3, m: { body: "paintgreen", lid: "pblack" }, style: "dumpster" }, O({ g: [CY, MO, PA, HO] })],
    ["ac-unit", "Air-conditioning unit", "acunit", { w: .9, d: .4, h: .7, m: { body: "aluminium" } }, O({ g: [CY, MO, PA] })],
    ["ac-unit-wall", "Wall air-conditioner", "acunit", { w: .8, d: .35, h: .55, y0: 2, m: { body: "aluminium" }, mount: "wall" }, W(2, { e: "out" })],
    ["cables", "Cables on the floor", "cables", { w: 3, d: .6, h: .05, box: true }, B({ g: [CY, MO, SF, PA] })],
    ["motorbike", "Motorbike", "vehicle", { w: .7, d: 2.1, h: 1.1, m: { body: "blackmetal", seat: "leatherblack" }, style: "bike", neon: true }, O({ g: [CY, MO, PA] })],
    ["billboard-holo", "Holo billboard", "billboard", { w: 3, d: .4, h: 4, m: { body: "blackmetal" }, style: "holo" }, O()],
    ["billboard", "Billboard", "billboard", { w: 3, d: .4, h: 4, m: { body: "steel" }, style: "paper", text: "DRINK COLA" }, O({ g: [MO, PA, HI] })]
  ]);
  M.add(CP, "Neon", [CY, FU, MO], [
    ["neon-open", "Neon sign: OPEN", "neon", { w: .9, d: .08, h: .35, y0: 2, text: "OPEN", col: "#ff5adc" }, W(2, { e: "both" })],
    ["neon-bar", "Neon sign: BAR", "neon", { w: .9, d: .08, h: .4, y0: 2.2, text: "BAR", col: "#6ff0ff" }, W(2.2, { e: "both" })],
    ["neon-hotel", "Neon sign: HOTEL", "neon", { w: 1.6, d: .08, h: .4, y0: 2.5, text: "HOTEL", col: "#ffbf5a" }, W(2.5, { e: "both" })],
    ["neon-ramen", "Neon sign: ラーメン", "neon", { w: 1.4, d: .08, h: .4, y0: 2.2, text: "ラーメン", col: "#ff5a4a" }, W(2.2, { e: "both" })],
    ["neon-clinic", "Neon sign: CLINIC", "neon", { w: 1.2, d: .08, h: .35, y0: 2.2, text: "CLINIC +", col: "#7dff8a" }, W(2.2, { e: "both" })],
    ["neon-custom", "Neon sign (your words)", "neon", { w: 1.2, d: .08, h: .35, y0: 2.2, text: "NEON", col: "#b98aff", style: "bare" }, W(2.2, { e: "both" })]
  ]);
  M.add(CP, "Nightlife", [CY, MO], [
    ["arcade", "Arcade cabinet", "arcade", { w: .7, d: .8, h: 1.8, m: { body: "pblack" } }],
    ["speakers", "Speaker stack", "audio", { w: .6, d: .5, h: 1.6, m: { body: "pblack" }, style: "speakers" }, B()],
    ["djbooth", "DJ booth", "audio", { w: 1.8, d: .8, h: 1.05, m: { body: "blackmetal" }, style: "djbooth" }],
    ["jukebox", "Jukebox", "audio", { w: .9, d: .65, h: 1.6, m: { body: "walnut" }, style: "jukebox" }, { g: [MO, HI, CY] }]
  ]);

  /* ================= E. modern ================= */
  const MM = "Modern";
  M.add(MM, "Vehicles", [MO, HO, PA], [
    ["car", "Car", "vehicle", { w: 1.8, d: 4.4, h: 1.45, m: { body: "paintblue" } }, O({ g: [MO, HO, CY] })],
    ["car-red", "Red car", "vehicle", { w: 1.8, d: 4.4, h: 1.45, m: { body: "paintred" } }, O({ g: [MO, HO, CY] })],
    ["car-police", "Police car", "vehicle", { w: 1.85, d: 4.8, h: 1.5, m: { body: "paintwhite" }, style: "police" }, O({ g: [MO, HO, CY] })],
    ["car-taxi", "Taxi", "vehicle", { w: 1.8, d: 4.6, h: 1.5, m: { body: "paintyellow" }, style: "taxi" }, O({ g: [MO, CY] })],
    ["van", "Van", "vehicle", { w: 2, d: 5, h: 2.2, m: { body: "paintwhite" }, style: "van" }, O({ g: [MO, HO, CY, PA] })],
    ["truck", "Pickup truck", "vehicle", { w: 2, d: 5.3, h: 1.9, m: { body: "paintred" }, style: "truck" }, O({ g: [MO, PA] })],
    ["car-wreck", "Burned-out car", "vehicle", { w: 1.8, d: 4.4, h: 1.4, m: { body: "rust" } }, O({ g: [PA, MO, HO, MI], k: ["ruined", "burned", "rusty"] })],
    ["bicycle", "Bicycle", "vehicle", { w: .6, d: 1.75, h: 1, m: { body: "paintred" }, style: "bicycle" }, O({ g: [MO, HI, PA] })],
    ["cart-shopping", "Shopping trolley", "vehicle", { w: .55, d: .9, h: 1, m: { body: "chrome" }, style: "cart" }, B({ g: [MO, PA, HO] })]
  ]);
  M.add(MM, "Street furniture", [MO, HO, CY, PA], [
    ["cone", "Traffic cone", "street", { w: .4, d: .4, h: .7, m: { body: "porange" }, style: "cone" }, B()],
    ["barrier-jersey", "Concrete barrier", "street", { w: 3, d: .6, h: .8, m: { body: "concrete" }, style: "barrier" }, O({ g: [MO, MI, PA, CY] })],
    ["barrier-plastic", "Plastic road barrier", "street", { w: 1.5, d: .5, h: .8, m: { body: "pred" }, style: "barrier", stripes: true }, O()],
    ["sawhorse", "Police barricade", "street", { w: 1.8, d: .6, h: 1.1, m: { frame: "pwhite" }, style: "sawhorse" }, B()],
    ["hydrant", "Fire hydrant", "street", { w: .4, d: .3, h: .7, m: { body: "paintred" }, style: "hydrant" }, O()],
    ["mailbox", "Mailbox", "street", { w: .25, d: .45, h: 1.2, m: { body: "paintblue", post: "oak" }, style: "mailbox" }, O()],
    ["postbox", "Pillar box", "street", { w: .5, d: .5, h: 1.5, m: { body: "paintred" }, style: "postbox" }, O({ g: [HI, MO] })],
    ["phonebooth", "Telephone box", "street", { w: 1, d: 1, h: 2.5, m: { body: "paintred" }, style: "booth" }, O({ g: [HI, MO, HO] })],
    ["busstop", "Bus shelter", "street", { w: 3, d: 1.4, h: 2.4, m: { body: "aluminium" }, style: "busstop" }, O()],
    ["traffic-light", "Traffic light", "street", { w: .5, d: .5, h: 3.5, m: { body: "gunmetal" }, style: "lightpole" }, O()],
    ["bollard", "Bollard", "street", { w: .2, d: .2, h: .9, m: { body: "blackmetal" }, style: "bollard" }, O()],
    ["meter", "Parking meter", "street", { w: .2, d: .15, h: 1.3, m: { body: "gunmetal" }, style: "meter" }, O()],
    ["trashcan-street", "Street bin", "trash", { w: .5, d: .5, h: .9, m: { body: "paintgreen" }, style: "street" }, B()],
    ["trashcan-wheelie", "Wheelie bin", "trash", { w: .6, d: .7, h: 1.05, m: { body: "pgreen", lid: "pgreen" }, style: "wheelie" }, O()],
    ["trashcan-metal", "Metal dustbin", "trash", { w: .5, d: .5, h: .75, m: { body: "steel" }, style: "can" }, B({ g: [MO, HI, PA, HO] })],
    ["manhole", "Manhole cover", "vent", { w: .7, d: .7, h: .03, m: { body: "iron" }, style: "manhole" }, O({ g: [MO, HI, CY, PA, HO] })]
  ]);
  M.add(MM, "Shop", [MO, CY], [
    ["counter-shop", "Shop counter", "counter", { w: 2, d: .7, h: 1, m: { body: "pwhite" }, style: "shop" }],
    ["counter-jewels", "Jeweller's counter", "counter", { w: 2, d: .7, h: 1, m: { body: "walnut" }, style: "shop", fill: "jewels" }, { g: [MO, HI, F] }],
    ["counter-reception", "Reception desk", "counter", { w: 2.4, d: .9, h: 1.1, m: { body: "walnut", top: "marble" }, style: "reception", sign: "RECEPTION" }, { g: [MO, HO, FU] }],
    ["vending", "Drinks machine", "vending", { w: .9, d: .8, h: 1.9, m: { body: "paintred" }, style: "drinks" }, B()],
    ["vending-snacks", "Snack machine", "vending", { w: .9, d: .8, h: 1.9, m: { body: "pblack" }, style: "snacks" }, B()]
  ]);

  /* ================= F. military ================= */
  const ML = "Military";
  M.add(ML, "Fortifications", [MI, MO, PA, HI], [
    ["sandbags", "Sandbag wall", "sandbags", { w: 2.4, d: .35, h: .9, m: { body: "sandbag" } }, B()],
    ["sandbags-double", "Double sandbag wall", "sandbags", { w: 2.4, d: .7, h: 1.2, m: { body: "sandbag" } }, B()],
    ["sandbags-ring", "Sandbag emplacement", "sandbags", { w: 3, d: 3, h: 1, m: { body: "sandbag" }, style: "ring" }, O()],
    ["barbed-coil", "Barbed-wire coil", "barbed", { w: 3, d: 1, h: .8, m: { body: "steel", post: "oak" } }, O()],
    ["barbed-fence", "Barbed-wire fence", "barbed", { w: 5, d: .1, h: 1.4, m: { body: "steel", post: "oak" }, style: "fence" }, O()],
    ["hedgehog", "Tank trap", "hedgehog", { w: 1.6, d: 1.6, h: 1.4, m: { body: "rust" } }, O()],
    ["watchtower", "Watchtower", "tower", { w: 2.4, d: 2.4, h: 5.5, m: { body: "pine", legs: "pine", roof: "plank" } }, O({ g: [MI, HI, PA, MD] })],
    ["guardtower", "Guard tower with a searchlight", "tower", { w: 2.4, d: 2.4, h: 5.5, m: { body: "concrete", legs: "steel", roof: "steel" }, style: "guard" }, O({ g: [MI, MO, HO, PA] })],
    ["wall-bunker", "Bunker wall with a firing slit", "wall", { w: 3, d: .6, h: 2.2, m: { body: "concrete" }, style: "slit" }, B()]
  ]);
  M.add(ML, "Equipment", [MI, MO, PA], [
    ["crate-military", "Supply crate", "crate", { w: 1.2, d: .6, h: .6, m: { body: "olive" }, style: "military" }, B()],
    ["crate-ammo", "Ammo crate", "crate", { w: .8, d: .4, h: .35, m: { body: "olive" }, style: "ammo" }, B()],
    ["crate-ammo-stack", "Stack of ammo crates", "crate", { w: .8, d: .4, h: .35, n: 3, m: { body: "olive" }, style: "ammo" }, B()],
    ["jerrycan", "Jerrycan", "jerrycan", { w: .17, d: .35, h: .47, m: { body: "olive" } }, B({ tags: ["small"] })],
    ["jerrycans", "Row of jerrycans", "jerrycan", { w: .17, d: .35, h: .47, n: 5, m: { body: "paintred" } }, B()],
    ["drum-oil", "Oil drum", "barrel", { w: .58, d: .58, h: .88, m: { body: "paintblue" }, style: "drum" }, B({ g: [MI, MO, PA, CY, SF] })],
    ["drum-stack", "Oil drums", "barrel", { w: .58, d: .58, h: .88, n: 3, m: { body: "olive" }, style: "drum" }, B({ g: [MI, MO, PA, CY] })],
    ["drum-toxic", "Toxic waste drum", "barrel", { w: .58, d: .58, h: .88, m: { body: "paintyellow" }, style: "drum", text: "☢ TOXIC" }, B({ g: [MO, PA, SF, CY, HO] })],
    ["footlocker", "Footlocker", "chest", { w: .8, d: .45, h: .4, m: { body: "olive", band: "steel" }, style: "foot" }],
    ["mortar", "Mortar", "artillery", { w: .8, d: .8, h: .9, m: { body: "olive" }, style: "mortar" }, O()],
    ["mg-nest", "Mounted machine gun", "turret", { w: 1, d: 1.2, h: 1.1, m: { body: "gunmetal" }, style: "mg" }, B({ g: [MI, HI, PA] })],
    ["searchlight", "Searchlight", "artillery", { w: .8, d: .8, h: 1.2, m: { body: "olive" }, style: "searchlight" }, O({ g: [MI, HI, MO, HO] })],
    ["fieldgun", "Field gun", "artillery", { w: 1.8, d: 3.2, h: 1.5, m: { body: "olive" } }, O({ g: [MI, HI] })],
    ["flagpole", "Flagpole", "flag", { w: 1.3, d: .4, h: 5, m: { body: "steel", base: "concrete" }, c1: "#b8231d", c2: "#f2efe6", emblem: "stripes" }, O({ g: ALL })],
    ["flag-pirate", "Black flag", "flag", { w: 1.3, d: .4, h: 4, m: { body: "oak", base: "oak" }, c1: "#1d1b1a", c2: "#f2efe6", emblem: "skull" }, O({ g: [HI, F, PA] })],
    ["tent-military", "Army tent", "tent", { w: 3, d: 4, h: 2.2, m: { body: "khaki", pole: "olive" } }, O()]
  ]);
  M.add(ML, "Vehicles", [MI, PA], [
    ["jeep", "Army jeep", "vehicle", { w: 1.6, d: 3.4, h: 1.8, m: { body: "olive" }, style: "jeep" }, O({ g: [MI, PA, MO] })],
    ["truck-army", "Army truck", "vehicle", { w: 2.3, d: 6.5, h: 2.6, m: { body: "olive", bed: "olive" }, style: "truck" }, O({ g: [MI, PA, HI] })]
  ]);

  /* ================= G. post-apocalyptic ================= */
  const PP = "Post-apocalyptic";
  M.add(PP, "Scrap & shelter", [PA, MO, CY], [
    ["scrap-wall", "Scrap-metal wall", "scrap", { w: 3, d: .2, h: 2.2, m: { body: "rust" } }, B()],
    ["tires", "Pile of tyres", "scrap", { w: 1.2, d: 1.2, h: .9, m: { body: "rubber" }, style: "tires" }, B()],
    ["junk", "Junk heap", "scrap", { w: 2.5, d: 2.5, h: 1.2, m: { body: "rust" }, style: "junk" }, B()],
    ["shelter", "Lean-to shelter", "scrap", { w: 2.4, d: 2, h: 1.8, m: { body: "rust" }, style: "shelter" }, O()],
    ["purifier", "Water still", "scrap", { w: 1.4, d: 1, h: 1.3, m: { body: "rust" }, style: "purifier" }, B()],
    ["drum-fire", "Burning barrel", "barrel", { w: .58, d: .58, h: .88, m: { body: "rust" }, style: "drum", fire: true }, B({ g: [PA, MO, CY, HO] })],
    ["sign-danger", "Hand-painted sign", "signpost", { w: 1, d: 1, h: 2, m: { body: "rust" }, text: "KEEP OUT|NO WATER" }, O()],
    ["crate-plastic", "Plastic crate", "crate", { w: .6, d: .4, h: .3, m: { body: "pblue" }, style: "plastic" }, B({ tags: ["small"] })],
    ["boxes-cardboard", "Cardboard boxes", "crate", { w: .5, d: .4, h: .4, n: 3, m: { body: "cardboard", tape: "pyellow" }, style: "cardboard" }, { g: [MO, PA, CY, HO] }],
    ["box-cardboard", "Cardboard box", "crate", { w: .5, d: .4, h: .4, m: { body: "cardboard", tape: "pyellow" }, style: "cardboard" }, { g: [MO, PA, CY, HO], tags: ["small"] }]
  ]);

  /* ================= H. industrial ================= */
  const IN = "Industrial";
  M.add(IN, "Pipes & tanks", [MO, PA, HI, SF, CY], [
    ["pipes-run", "Pipe run with a valve", "pipes", { w: 3, d: .3, h: .6, m: { body: "steel", valve: "pred" }, valve: true }, B()],
    ["pipes-bundle", "Pipe bundle", "pipes", { w: 3, d: .6, h: .5, m: { body: "steel" }, style: "bundle" }, B()],
    ["pipes-corner", "Pipe elbow", "pipes", { w: 1.2, d: 1.2, h: .6, m: { body: "copper" }, style: "corner" }, B({ g: [MO, HI, PA, CY] })],
    ["pipes-riser", "Riser with a gauge", "pipes", { w: .4, d: .4, h: 2.6, m: { body: "steel", valve: "pred" }, style: "riser" }],
    ["valve", "Great valve", "pipes", { w: 1.4, d: .4, h: .6, m: { body: "iron", valve: "pred" }, style: "valve" }, B()],
    ["tank-upright", "Storage tank", "tank", { w: 2, d: 2, h: 3.5, m: { body: "steel" }, text: "WATER" }, B()],
    ["tank-vat", "Chemical vat", "tank", { w: 1.8, d: 1.8, h: 1.4, m: { body: "steel" }, style: "vat", fill: "slime" }, { g: [MO, PA, SF, HO, CY] }],
    ["tank-molten", "Vat of molten metal", "tank", { w: 1.8, d: 1.8, h: 1.4, m: { body: "iron" }, style: "vat", fill: "ember" }, { g: [MO, HI, F] }],
    ["gas-cylinders", "Gas cylinders", "tank", { w: .8, d: .5, h: 1.5, style: "cylinders" }, B()],
    ["boiler-steam", "Steam boiler", "tank", { w: 3, d: 1.5, h: 1.8, m: { body: "iron", saddle: "brick" }, style: "horizontal", text: "BOILER No. 2" }, { g: [HI, MO, PA] }]
  ]);
  M.add(IN, "Machines", [MO, HI, PA], [
    ["press", "Hydraulic press", "machine", { w: 1.6, d: 1.2, h: 2.6, m: { body: "paintyellow" }, style: "press" }],
    ["lathe", "Lathe", "machine", { w: 2, d: .8, h: 1.3, m: { body: "paintgreen" }, style: "lathe" }],
    ["drill", "Pillar drill", "machine", { w: .5, d: .5, h: 1.7, m: { body: "gunmetal" }, style: "drill" }],
    ["conveyor", "Conveyor belt", "machine", { w: 4, d: .8, h: .9, m: { body: "gunmetal" }, style: "conveyor", boxes: true }, { g: [MO, PA, SF, CY] }],
    ["loom", "Power loom", "machine", { w: 2, d: 1.2, h: 1.8, m: { body: "iron", cloth: "red" }, style: "loom" }, { g: [HI] }],
    ["generator-diesel", "Diesel generator", "machine", { w: 1.8, d: 1, h: 1.3, m: { body: "paintyellow" }, style: "generator" }, B({ g: [MO, MI, PA] })],
    ["crane-hook", "Crane hook", "machine", { w: .3, d: .3, h: 2.5, m: { body: "steel" }, style: "crane" }, C()],
    ["forklift", "Forklift", "forklift", { w: 1.2, d: 2.6, h: 2.2, m: { body: "paintyellow" } }, B({ g: [MO, PA] })]
  ]);
  M.add(IN, "Structure & storage", [MO, PA, HI, SF], [
    ["catwalk", "Catwalk", "catwalk", { w: 4, d: 1, h: 2.5, m: { body: "steel", rail: "pyellow" } }, B()],
    ["catwalk-low", "Raised walkway", "catwalk", { w: 4, d: 1, h: .5, m: { body: "steel", rail: "steel" } }, B()],
    ["ladder", "Steel ladder", "ladder", { w: .5, d: .1, h: 3, m: { body: "steel" } }, B()],
    ["ladder-cage", "Caged ladder", "ladder", { w: .5, d: .8, h: 5, m: { body: "steel" }, style: "cage" }, B()],
    ["ladder-wood", "Wooden ladder", "ladder", { w: .5, d: .1, h: 2.5, m: { body: "pine" } }, B({ g: [F, MD, HI, MO, PA] })],
    ["ladder-rope", "Rope ladder", "ladder", { w: .5, d: .1, h: 3, style: "rope" }, B({ g: [F, MD, HI, PA] })],
    ["pallet", "Pallet", "pallet", { w: 1.2, d: .8, h: .15, m: { body: "pine" } }, B()],
    ["pallet-stack", "Stack of pallets", "pallet", { w: 1.2, d: .8, h: .75, n: 6, m: { body: "pine" } }, B()],
    ["pallet-boxes", "Pallet of boxes", "pallet", { w: 1.2, d: .8, h: .85, m: { body: "pine" }, style: "boxes" }, B()],
    ["pallet-sacks", "Pallet of sacks", "pallet", { w: 1.2, d: .8, h: .6, m: { body: "pine" }, style: "sacks" }, B()],
    ["pallet-drums", "Pallet of drums", "pallet", { w: 1.2, d: 1.2, h: 1, m: { body: "pine" }, style: "drums" }, B()],
    ["fusebox", "Fuse box", "panel", { w: .5, d: .15, h: .7, y0: 1.2, m: { body: "hullgrey" }, style: "fuse" }, W(1.2)],
    ["control-panel", "Control cabinet", "panel", { w: 1, d: .3, h: 1.4, m: { body: "paintgreen" }, style: "control" }, { g: [MO, HI, PA, SF] }],
    ["lever", "Lever switch", "panel", { w: .3, d: .15, h: .5, y0: 1, m: { body: "hullgrey" }, style: "switch" }, W(1, { g: [MO, HI, PA, SF, HO] })],
    ["keypad", "Keypad", "panel", { w: .15, d: .05, h: .2, y0: 1.3, m: { body: "steel" }, style: "keypad" }, W(1.3, { g: [MO, SF, FU, CY] })],
    ["radiator", "Radiator", "panel", { w: 1, d: .12, h: .6, m: { body: "pwhite" }, style: "radiator" }, { g: [MO, HI, HO] }],
    ["toolbox", "Toolbox", "bag", { w: .5, d: .25, h: .25, m: { body: "paintred" }, style: "toolbox" }, B({ tags: ["small"] })],
    ["chains-hanging", "Hanging chains", "machine", { w: 1.2, d: 1.2, h: 2.5, m: { body: "iron" }, style: "chains" }, C({ g: [MO, HI, HO, MD, PA] })]
  ]);

  /* ================= I. nature ================= */
  const NA = "Nature";
  M.add(NA, "Trees", [F, MD, HI, MO, HO, PA], [
    ["tree-oak", "Oak tree", "tree", { w: 5, d: 5, h: 7, m: { trunk: "bark", leaf: "leaf" } }, O()],
    ["tree-autumn", "Autumn tree", "tree", { w: 5, d: 5, h: 7, m: { trunk: "bark", leaf: "leafautumn" }, style: "autumn" }, O()],
    ["tree-pine", "Pine tree", "tree", { w: 3, d: 3, h: 8, m: { trunk: "bark", leaf: "leafdark" }, style: "pine" }, O()],
    ["tree-fir-snow", "Snowy fir", "tree", { w: 3, d: 3, h: 7, m: { trunk: "bark", leaf: "leafdark" }, style: "pine", snow: true }, O()],
    ["tree-birch", "Birch", "tree", { w: 2.5, d: 2.5, h: 7, m: { trunk: "birch", leaf: "leaf" }, style: "birch" }, O()],
    ["tree-willow", "Willow", "tree", { w: 6, d: 6, h: 6, m: { trunk: "bark", leaf: "leaf" }, style: "willow" }, O()],
    ["tree-palm", "Palm tree", "tree", { w: 4, d: 4, h: 7, m: { trunk: "bark", leaf: "leaf" }, style: "palm" }, O({ g: [HI, MO, PA, F] })],
    ["tree-dead", "Dead tree", "tree", { w: 4, d: 4, h: 6, m: { trunk: "driftwood" }, style: "dead" }, O()],
    ["tree-gnarled", "Gnarled tree", "tree", { w: 5, d: 5, h: 6, m: { trunk: "bark", leaf: "leafdark" }, style: "gnarled" }, O({ g: [F, HO, MD] })],
    ["tree-hanging", "Hanging tree", "tree", { w: 4, d: 4, h: 6, m: { trunk: "driftwood" }, style: "dead", noose: true }, O({ g: [HO, HI, MD] })],
    ["tree-fruit", "Apple tree", "tree", { w: 3.5, d: 3.5, h: 4.5, m: { trunk: "bark", leaf: "leaf" }, style: "fruit" }, O()],
    ["tree-alien", "Alien tree", "tree", { w: 3, d: 3, h: 5, m: { trunk: "alien" }, style: "alien" }, O({ g: [SF, FU, F, HO] })]
  ]);
  M.add(NA, "Plants", [F, MD, HI, MO, HO, PA], [
    ["bush", "Bush", "bush", { w: 1.2, d: 1.2, h: 1, m: { leaf: "leaf" } }, O()],
    ["hedge", "Hedge", "bush", { w: 3, d: .8, h: 1.4, m: { leaf: "leaf" }, style: "hedge" }, O()],
    ["bush-flower", "Flowering bush", "bush", { w: 1.2, d: 1.2, h: 1, m: { leaf: "leaf" }, style: "flowers" }, O()],
    ["bush-thorn", "Thorn bush", "bush", { w: 1.4, d: 1.4, h: 1, m: { leaf: "bark" }, style: "thorn" }, O()],
    ["ferns", "Ferns", "bush", { w: 1, d: 1, h: .7, m: { leaf: "leaf" }, style: "fern" }, O()],
    ["mushrooms", "Mushrooms", "growth", { w: .6, d: .6, h: .15, m: { cap: "mushroom" } }, B({ tags: ["small"] })],
    ["mushroom-giant", "Giant mushroom", "growth", { w: 2, d: 2, h: 2.5, m: { cap: "mushroom" }, style: "giant" }, B({ g: [F, HO] })],
    ["mushroom-glow", "Glowing mushroom", "growth", { w: 1.6, d: 1.6, h: 2, m: { cap: "alien" }, style: "giant", glow: true }, B({ g: [F, SF, HO] })],
    ["flowers", "Wildflowers", "growth", { w: 1.5, d: 1.5, h: .3, style: "flowers" }, O()],
    ["grass", "Tall grass", "growth", { w: 1.5, d: 1.5, h: .6, style: "grass" }, O()],
    ["reeds", "Reeds", "growth", { w: 1.5, d: 1.5, h: 1.4, style: "reeds" }, O()],
    ["cactus", "Cactus", "growth", { w: 1, d: 1, h: 2.2, style: "cactus" }, O({ g: [HI, MO, PA, F] })],
    ["alien-plant", "Alien bulb plants", "growth", { w: 1.2, d: 1.2, h: 1.3, style: "alien" }, B({ g: [SF, FU, F, HO] })],
    ["vines", "Creeping vines", "growth", { w: 2, d: 2, h: .05, style: "vines" }, B()],
    ["roots", "Tangle of roots", "growth", { w: 2, d: 2, h: .3, style: "roots" }, B({ g: [F, MD, HO] })],
    ["coral", "Coral", "growth", { w: 1, d: 1, h: .8, style: "coral" }, B({ g: [F, SF, MO] })]
  ]);
  M.add(NA, "Rocks & crystals", [F, MD, HI, MO, HO, PA, SF], [
    ["rock", "Boulder", "rock", { w: 1.4, d: 1.2, h: 1, m: { body: "granite" } }, B()],
    ["rock-big", "Great boulder", "rock", { w: 3, d: 2.6, h: 2.2, m: { body: "granite" } }, O()],
    ["rocks", "Scattered rocks", "rock", { w: 2, d: 2, h: .4, m: { body: "granite" }, style: "cluster" }, B()],
    ["pebbles", "Pebbles", "rock", { w: 1.5, d: 1.5, h: .1, m: { body: "slate" }, style: "pebbles" }, B()],
    ["stalagmites", "Stalagmites", "rock", { w: 1.5, d: 1.5, h: 1.8, m: { body: "limestone" }, style: "stalagmite" }, B({ g: [F, MD, HO, SF] })],
    ["standing-stone", "Standing stone", "rock", { w: .8, d: .4, h: 2.4, m: { body: "granite" }, style: "standing" }, O({ g: [F, MD, HI, HO] })],
    ["stone-circle", "Stone circle", "rock", { w: 12, d: 12, h: 2.6, m: { body: "granite" }, style: "circle" }, O({ g: [F, MD, HI, HO] })],
    ["crystals", "Crystal cluster", "growth", { w: 1, d: 1, h: 1, m: { crystal: "crystal" }, style: "crystals" }, B({ g: [F, SF, HO] })],
    ["crystals-red", "Blood crystals", "growth", { w: 1, d: 1, h: 1, m: { crystal: "ruby" }, style: "crystals" }, B({ g: [F, SF, HO] })],
    ["crystals-amethyst", "Amethyst geode", "growth", { w: .8, d: .8, h: .7, m: { crystal: "amethyst" }, style: "crystals", n: 9 }, B({ g: [F, SF] })],
    ["log", "Fallen log", "log", { w: 3, d: .5, h: .5, m: { body: "pine" } }, O()],
    ["log-mossy", "Mossy log", "log", { w: 3, d: .6, h: .6, m: { body: "pine" }, style: "mossy" }, O()],
    ["stump", "Tree stump", "log", { w: .7, d: .7, h: .5, m: { body: "pine" }, style: "stump" }, O()]
  ]);
  M.add(NA, "Water & ground", [F, MD, HI, MO, HO, PA], [
    ["pond", "Pond", "water", { w: 3, d: 2.4, h: .1, m: { water: "water", rim: "granite" } }, O()],
    ["pond-lilies", "Lily pond", "water", { w: 3, d: 2.4, h: .1, m: { water: "water", rim: "mossstone" }, style: "lilies" }, O()],
    ["fountain", "Fountain", "water", { w: 2.4, d: 2.4, h: 1.6, m: { water: "water", rim: "marble" }, style: "fountain" }, O({ g: [F, MD, HI, MO] })],
    ["puddle", "Puddle", "water", { w: 1, d: .8, h: .01, style: "puddle" }, B()],
    ["patch-leaves", "Fallen leaves", "decal", { w: 2, d: 2, h: .01, style: "leaves" }, B()],
    ["patch-moss", "Moss", "decal", { w: 1.5, d: 1.5, h: .01, style: "moss" }, B()],
    ["patch-snow", "Drift of snow", "decal", { w: 2, d: 2, h: .01, style: "snow" }, B()],
    ["patch-sand", "Drift of sand", "decal", { w: 2, d: 2, h: .01, style: "sand" }, B({ g: [HI, MO, PA, SF] })]
  ]);

  /* ================= J. containers and small props ================= */
  const SP = "Containers & small props";
  const small = (more) => Object.assign({ tags: ["small"] }, more || {});
  M.add(SP, "Food & drink", [F, MD, HI, MO, HO, PA], [
    ["tankard", "Tankard", "vessel", { w: .1, d: .1, h: .13, m: { body: "oak" }, style: "tankard" }, small({ g: [F, MD, HI] })],
    ["mugs", "Mugs", "vessel", { w: .3, d: .3, h: .1, m: { body: "terracotta" }, style: "mugs", n: 4 }, small()],
    ["goblet", "Goblet", "vessel", { w: .08, d: .08, h: .15, m: { body: "silver" }, style: "goblet" }, small({ g: [F, MD, HI, HO] })],
    ["goblets", "Goblets", "vessel", { w: .3, d: .3, h: .15, m: { body: "gold" }, style: "goblets", n: 4 }, small({ g: [F, MD, HI] })],
    ["bottle-wine", "Wine bottle", "bottles", { w: .08, d: .08, h: .3, m: { glass: "glassgreen" }, style: "wine" }, small()],
    ["bottles", "Bottles", "bottles", { w: .4, d: .3, h: .3, n: 5, style: "wine" }, small()],
    ["bottles-beer", "Beer bottles", "bottles", { w: .3, d: .25, h: .24, n: 6, style: "beer" }, small({ g: [MO, PA, CY, MI] })],
    ["bottles-empty", "Empty bottles", "bottles", { w: .6, d: .5, h: .08, n: 4, style: "fallen" }, small({ g: [MO, PA, HO, HI] })],
    ["bread", "Loaves of bread", "food", { w: .5, d: .3, h: .1, style: "bread" }, small({ g: [F, MD, HI, MO] })],
    ["cheese", "Cheese wheel", "food", { w: .4, d: .4, h: .12, style: "cheese" }, small({ g: [F, MD, HI] })],
    ["fruit-bowl", "Fruit bowl", "food", { w: .3, d: .3, h: .1, m: { body: "walnut" }, style: "fruit" }, small()],
    ["meat", "Joint of meat", "food", { w: .45, d: .25, h: .15, style: "meat" }, small({ g: [F, MD, HI, HO] })],
    ["fish", "Fish", "food", { w: .35, d: .1, h: .05, style: "fish" }, small()],
    ["feast", "Feast platter", "food", { w: .6, d: .4, h: .2, m: { body: "silver" }, style: "feast" }, small({ g: [F, MD, HI] })],
    ["rations", "Ration box", "food", { w: .35, d: .25, h: .15, style: "rations" }, small({ g: [MI, MO, PA] })],
    ["plate-stew", "Bowl of stew", "food", { w: .22, d: .22, h: .06, style: "plate-stew" }, small({ g: [F, MD, HI, PA] })],
    ["plate-meat", "Plate of meat", "food", { w: .22, d: .22, h: .06, style: "plate-meat" }, small()],
    ["jar", "Jar", "vessel", { w: .15, d: .15, h: .2, m: { body: "glass", lid: "cork" }, style: "jar", lid: true }, small()],
    ["vase", "Vase", "vessel", { w: .25, d: .25, h: .45, m: { body: "porcelain" }, style: "vase" }, small()],
    ["urn", "Urn", "vessel", { w: .35, d: .35, h: .55, m: { body: "bronze" }, style: "urn" }, small({ g: [F, MD, HI, HO] })],
    ["amphora", "Amphora", "vessel", { w: .35, d: .35, h: .7, m: { body: "terracotta" }, style: "amphora" }, small({ g: [F, HI] })],
    ["jug", "Jug", "vessel", { w: .18, d: .18, h: .25, m: { body: "terracotta" }, style: "jug" }, small()],
    ["pot-cooking", "Cooking pot", "vessel", { w: .35, d: .35, h: .28, m: { body: "iron", lid: "iron" }, style: "pot", lid: true }, small()],
    ["kettle", "Kettle", "vessel", { w: .22, d: .22, h: .25, m: { body: "copper" }, style: "kettle" }, small()],
    ["teapot", "Teapot", "vessel", { w: .22, d: .22, h: .2, m: { body: "porcelain" }, style: "teapot" }, small({ g: [HI, MO, HO] })],
    ["bowl", "Bowl", "vessel", { w: .2, d: .2, h: .08, m: { body: "pine" }, style: "bowl" }, small()],
    ["bucket", "Bucket of water", "vessel", { w: .32, d: .32, h: .32, m: { body: "oak", band: "iron" }, style: "bucket", fill: "water" }, small({ e: "both" })],
    ["bucket-metal", "Metal bucket", "vessel", { w: .3, d: .3, h: .3, m: { body: "steel" }, style: "bucket" }, small({ e: "both" })],
    ["canister", "Canister", "vessel", { w: .2, d: .2, h: .3, m: { body: "steel" }, style: "canister" }, small({ g: [MO, MI, PA, SF] })]
  ]);
  M.add(SP, "Books & papers", ALL, [
    ["book", "Book", "books", { w: .24, d: .17, h: .04, n: 1, style: "stack" }, small()],
    ["books-stack", "Stack of books", "books", { w: .24, d: .17, h: .25, n: 6, style: "stack" }, small()],
    ["book-open", "Open book", "books", { w: .36, d: .25, h: .04, style: "open" }, small()],
    ["books-row", "Books between bookends", "books", { w: .5, d: .2, h: .25, m: { bookend: "brass" }, style: "row" }, small()],
    ["books-pile", "Heap of books", "books", { w: .8, d: .8, h: .15, n: 12, style: "pile" }, small()],
    ["scroll", "Scroll", "books", { w: .35, d: .06, h: .05, n: 1, style: "scroll" }, small({ g: [F, MD, HI] })],
    ["scrolls", "Scrolls", "books", { w: .4, d: .3, h: .1, n: 5, style: "scroll" }, small({ g: [F, MD, HI] })],
    ["letter", "Sealed letter", "books", { w: .21, d: .3, h: .003, m: { paper: "parchment" }, style: "letter", seal: true }, small({ g: [F, MD, HI, HO] })],
    ["note", "Note", "books", { w: .21, d: .3, h: .003, m: { paper: "paper" }, style: "letter" }, small()],
    ["newspaper", "Newspaper", "books", { w: .38, d: .58, h: .01, style: "newspaper" }, small({ g: [HI, MO, HO, PA] })],
    ["map-treasure", "Treasure map", "books", { w: .5, d: .4, h: .005, style: "map" }, small({ g: [F, MD, HI] })]
  ]);
  M.add(SP, "Tools", ALL, [
    ["tool-shovel", "Shovel", "tool", { w: .25, d: 1.2, h: .05, style: "shovel" }, small({ e: "both" })],
    ["tool-pickaxe", "Pickaxe", "tool", { w: .6, d: .9, h: .05, style: "pickaxe" }, small({ e: "both" })],
    ["tool-crowbar", "Crowbar", "tool", { w: .1, d: .9, h: .03, style: "crowbar" }, small()],
    ["tool-hammer", "Hammer", "tool", { w: .13, d: .35, h: .04, style: "hammer" }, small()],
    ["tool-wrench", "Wrench", "tool", { w: .08, d: .3, h: .02, style: "wrench" }, small()],
    ["tool-saw", "Saw", "tool", { w: .15, d: .6, h: .01, style: "saw" }, small()],
    ["rope", "Coil of rope", "tool", { w: .6, d: .6, h: .15, m: { body: "rope" }, style: "rope" }, small({ e: "both" })],
    ["chain", "Length of chain", "tool", { w: 1.5, d: .06, h: .03, m: { body: "iron" }, style: "chain" }, small({ e: "both" })],
    ["lockpicks", "Lockpicks", "tool", { w: .2, d: .1, h: .01, style: "lockpicks" }, small()]
  ]);
  M.add(SP, "Treasure & curios", [F, MD, HI, MO, HO], [
    ["skull", "Skull", "curio", { w: .15, d: .2, h: .15, style: "skull" }, small({ g: [F, MD, HI, HO, PA] })],
    ["skulls", "Pile of skulls", "curio", { w: 1, d: 1, h: .35, style: "skulls" }, { g: [F, MD, HO], e: "both" }],
    ["bones", "Scattered bones", "curio", { w: 1.2, d: 1.2, h: .1, style: "bones" }, { g: [F, MD, HO, PA], e: "both" }],
    ["skeleton", "Skeleton", "curio", { w: .5, d: 1.7, h: .15, style: "skeleton" }, { g: [F, MD, HI, HO, PA], e: "both" }],
    ["coins", "Pile of coins", "curio", { w: .4, d: .4, h: .08, style: "coins" }, small({ g: [F, MD, HI] })],
    ["gold-bars", "Gold bars", "curio", { w: .5, d: .2, h: .1, style: "goldbars" }, small({ g: [F, HI, MO] })],
    ["gems", "Gems", "curio", { w: .3, d: .3, h: .05, style: "gems" }, small({ g: [F, MD, HI] })],
    ["crown", "Crown", "curio", { w: .2, d: .2, h: .12, style: "crown" }, small({ g: [F, MD] })],
    ["idol-small", "Strange idol", "curio", { w: .2, d: .2, h: .3, m: { body: "jade" }, style: "idol" }, small({ g: [F, HO, HI] })],
    ["doll", "Porcelain doll", "curio", { w: .2, d: .15, h: .4, m: { dress: "white", hair: "walnut" }, style: "doll" }, small({ g: [HI, HO, MO] })],
    ["chess", "Chessboard", "curio", { w: .45, d: .45, h: .05, m: { body: "walnut" }, style: "chess" }, small()],
    ["gramophone", "Gramophone", "curio", { w: .4, d: .4, h: .6, m: { body: "walnut" }, style: "music" }, small({ g: [HI, HO] })],
    ["typewriter", "Typewriter", "curio", { w: .45, d: .35, h: .25, m: { body: "pblack" }, style: "typewriter" }, small({ g: [HI, MO, HO] })],
    ["radio-vintage", "Valve radio", "curio", { w: .45, d: .25, h: .35, m: { body: "walnut" }, style: "radio" }, small({ g: [HI, MO, HO] })],
    ["radio-field", "Field radio", "curio", { w: .4, d: .25, h: .3, m: { body: "olive" }, style: "radio" }, small({ g: [MI, HI, PA] })],
    ["phone-rotary", "Rotary telephone", "curio", { w: .22, d: .22, h: .15, m: { body: "pblack" }, style: "phone" }, small({ g: [HI, MO, HO] })],
    ["phone-mobile", "Mobile phone", "curio", { w: .08, d: .16, h: .01, style: "mobile" }, small({ g: [MO, CY] })],
    ["camera", "Camera", "curio", { w: .15, d: .08, h: .1, m: { body: "pblack" }, style: "camera" }, small({ g: [HI, MO, CY] })],
    ["walkie", "Walkie-talkie", "curio", { w: .06, d: .04, h: .2, m: { body: "pblack" }, style: "walkie" }, small({ g: [MO, MI, PA] })]
  ]);
  M.add(SP, "Bags & cases", ALL, [
    ["sack", "Sack", "bag", { w: .45, d: .35, h: .6, m: { body: "burlap" }, style: "sack" }, small({ e: "both" })],
    ["sacks", "Pile of sacks", "bag", { w: 1.4, d: .9, h: .6, m: { body: "burlap" }, style: "sacks" }, { e: "both" }],
    ["backpack", "Backpack", "bag", { w: .35, d: .25, h: .5, m: { body: "olive", strap: "leatherblack" }, style: "backpack", roll: true }, small()],
    ["suitcase", "Suitcase", "bag", { w: .65, d: .22, h: .45, m: { body: "leather", trim: "brass" }, style: "suitcase" }, small({ g: [HI, MO, HO] })],
    ["briefcase", "Briefcase", "bag", { w: .45, d: .12, h: .33, m: { body: "leatherblack" }, style: "briefcase" }, small({ g: [HI, MO, CY] })],
    ["duffel", "Kit bag", "bag", { w: .7, d: .35, h: .35, m: { body: "khaki" }, style: "duffel" }, small({ g: [MI, MO, PA] })],
    ["basket", "Basket", "bag", { w: .4, d: .4, h: .3, m: { body: "straw" }, style: "basket" }, small()],
    ["basket-bread", "Basket of bread", "bag", { w: .4, d: .4, h: .3, m: { body: "straw" }, style: "basket", fill: "bread" }, small()],
    ["basket-fruit", "Basket of fruit", "bag", { w: .4, d: .4, h: .3, m: { body: "straw" }, style: "basket", fill: "fruit" }, small()],
    ["firstaid", "First-aid kit", "bag", { w: .35, d: .25, h: .12, m: { body: "pwhite" }, style: "firstaid" }, small({ g: [MO, MI, PA, HO] })],
    ["medkit", "Medkit", "bag", { w: .4, d: .25, h: .15, m: { body: "hullwhite" }, style: "medkit" }, small({ g: [SF, FU, CY] })],
    ["bin-office", "Wastepaper basket", "bag", { w: .3, d: .3, h: .35, m: { body: "pblack" }, style: "bin" }, small({ g: [MO, HI, CY] })]
  ]);
  M.add(SP, "Weapons", ALL, [
    ["sword", "Sword", "weapon", { w: .2, d: 1, h: .05, m: { body: "brass", blade: "steel", grip: "leather" }, style: "sword" }, small({ g: [F, MD, HI] })],
    ["dagger", "Dagger", "weapon", { w: .1, d: .35, h: .03, m: { body: "brass" }, style: "dagger" }, small({ g: [F, MD, HI, HO] })],
    ["axe", "Battle-axe", "weapon", { w: .3, d: .9, h: .05, m: { haft: "oak" }, style: "axe" }, small({ g: [F, MD] })],
    ["spear", "Spear", "weapon", { w: .08, d: 2, h: .04, style: "spear" }, small({ g: [F, MD, HI] })],
    ["mace", "Mace", "weapon", { w: .15, d: .7, h: .12, style: "mace" }, small({ g: [F, MD] })],
    ["bow", "Bow", "weapon", { w: .2, d: 1.4, h: .03, m: { body: "walnut" }, style: "bow" }, small({ g: [F, MD, HI] })],
    ["shield-round", "Round shield", "weapon", { w: .75, d: .75, h: .08, m: { body: "oak" }, style: "shield", round: true }, small({ g: [F, MD] })],
    ["shield-knight", "Knight's shield", "weapon", { w: .55, d: .75, h: .08, m: { body: "red", trim: "gold" }, style: "shield" }, small({ g: [F, MD] })],
    ["rifle", "Rifle", "weapon", { w: .1, d: 1.1, h: .05, m: { body: "walnut" }, style: "rifle" }, small({ g: [HI, MO, MI, PA] })],
    ["pistol", "Pistol", "weapon", { w: .08, d: .22, h: .04, m: { body: "gunmetal" }, style: "pistol" }, small({ g: [HI, MO, MI, PA, CY, HO] })],
    ["blaster", "Blaster", "weapon", { w: .1, d: .35, h: .05, m: { body: "hullwhite" }, style: "blaster" }, small({ g: [SF, FU, CY] })]
  ]);
  M.add(SP, "Lab & potions", [F, HI, MO, HO, SF], [
    ["potion", "Potion", "bottles", { w: .1, d: .1, h: .17, n: 1, style: "potion" }, small({ g: [F, HO] })],
    ["potions", "Potions", "bottles", { w: .4, d: .3, h: .25, n: 5, style: "potion" }, small({ g: [F, HO] })],
    ["vials", "Vials", "bottles", { w: .3, d: .2, h: .1, n: 6, style: "vial" }, small()],
    ["jar-specimen", "Specimen jar", "vessel", { w: .2, d: .2, h: .3, m: { body: "glass" }, style: "jar", organ: true, lid: true }, small({ g: [HI, HO, SF] })]
  ]);

  /* ================= K. architecture ================= */
  const AR = "Architecture";
  M.add(AR, "Walls", ALL, [
    ["wall-stone", "Stone wall", "wall", { w: 2, d: .4, h: 2.8, m: { body: "granite" } }, B({ g: [F, MD, HI, HO] })],
    ["wall-brick", "Brick wall", "wall", { w: 2, d: .25, h: 2.8, m: { body: "brick" } }, B({ g: [HI, MO, HO, PA, CY] })],
    ["wall-plaster", "Plaster wall", "wall", { w: 2, d: .15, h: 2.8, m: { body: "limestone" } }],
    ["wall-plank", "Plank wall", "wall", { w: 2, d: .1, h: 2.6, m: { body: "plank" } }, B({ g: [F, MD, HI, PA] })],
    ["wall-timber", "Timber-framed wall", "wall", { w: 2.4, d: .2, h: 2.8, m: { body: "limestone", frame: "walnut" }, style: "timber" }, B({ g: [F, MD, HI] })],
    ["wall-log", "Log wall", "wall", { w: 2, d: .3, h: 2.4, m: { body: "bark" }, style: "log" }, B({ g: [F, MD, HI, PA] })],
    ["wall-concrete", "Concrete wall", "wall", { w: 2, d: .25, h: 2.8, m: { body: "concrete" } }, B({ g: [MO, MI, PA, CY, HO] })],
    ["wall-metal", "Metal wall", "wall", { w: 2, d: .1, h: 2.8, m: { body: "steel" } }, B({ g: [MO, MI, SF, CY, PA] })],
    ["wall-ruined", "Ruined wall", "wall", { w: 3, d: .4, h: 2.4, m: { body: "granite" }, style: "ruined" }, B({ k: ["ruined", "damaged", "dirty", "burned"] })],
    ["wall-window", "Wall with a window", "wall", { w: 2.4, d: .3, h: 2.8, m: { body: "brick", frame: "oak" }, style: "window" }, B()],
    ["wall-low", "Low stone wall", "wall", { w: 2.5, d: .5, h: .9, m: { body: "mossstone" }, style: "low" }, O({ g: [F, MD, HI, MO, HO] })]
  ]);
  M.add(AR, "Columns & arches", ALL, [
    ["column-round", "Stone column", "column", { w: .6, d: .6, h: 3.2, m: { body: "limestone" } }, B({ g: [F, MD, HI, HO] })],
    ["column-fluted", "Fluted marble column", "column", { w: .6, d: .6, h: 3.2, m: { body: "marble" }, style: "fluted" }, B({ g: [F, HI, HO] })],
    ["column-square", "Square pillar", "column", { w: .6, d: .6, h: 3, m: { body: "granite" }, style: "square" }, B()],
    ["column-broken", "Broken column", "column", { w: .6, d: .6, h: 3.2, m: { body: "marble" }, style: "broken" }, B({ g: [F, MD, HI, HO, PA] })],
    ["column-vines", "Overgrown column", "column", { w: .6, d: .6, h: 3.2, m: { body: "mossstone" }, vines: true }, B({ g: [F, MD, HO] })],
    ["post-wood", "Wooden post", "column", { w: .25, d: .25, h: 2.8, m: { body: "oak" }, style: "wood" }, B({ g: [F, MD, HI, PA] })],
    ["column-iron", "Cast-iron column", "column", { w: .4, d: .4, h: 3.2, m: { body: "blackmetal" }, style: "iron" }, B({ g: [HI, MO, PA] })],
    ["arch", "Stone archway", "arch", { w: 2.6, d: .6, h: 3.2, m: { body: "limestone" }, key: true }, B({ g: [F, MD, HI, HO] })],
    ["arch-brick", "Brick arch", "arch", { w: 2.4, d: .4, h: 3, m: { body: "brick" }, t: .3 }, B({ g: [HI, MO, HO, PA] })]
  ]);
  M.add(AR, "Doors & gates", ALL, [
    ["door-wood", "Wooden door", "door", { w: 1.1, d: .2, h: 2.2, m: { body: "oak", frame: "walnut" } }, B()],
    ["door-wood-open", "Open wooden door", "door", { w: 1.1, d: .2, h: 2.2, m: { body: "oak", frame: "walnut" }, open: 1.3 }, B()],
    ["door-iron", "Iron-studded door", "door", { w: 1.2, d: .25, h: 2.3, m: { body: "oak", frame: "granite" }, style: "iron" }, B({ g: [F, MD, HO] })],
    ["door-double", "Double doors", "door", { w: 2, d: .25, h: 2.6, m: { body: "walnut", frame: "limestone" }, style: "double" }, B({ g: [F, MD, HI, HO] })],
    ["door-modern", "Modern door", "door", { w: 1, d: .15, h: 2.1, m: { body: "pwhite", frame: "pwhite" }, style: "modern" }, { g: [MO, HO, CY] }],
    ["door-glass", "Glass door", "door", { w: 1.1, d: .15, h: 2.2, m: { body: "aluminium", frame: "aluminium" }, style: "glass" }, B({ g: [MO, CY, FU] })],
    ["door-cell", "Cell door", "door", { w: 1.1, d: .2, h: 2.2, m: { body: "iron", frame: "concrete" }, style: "cell" }, { g: [F, MD, HI, MO, HO] }],
    ["door-barn", "Barn door", "door", { w: 1.6, d: .2, h: 2.4, m: { body: "plank", frame: "oak" }, style: "barn" }, B({ g: [HI, MO, HO, PA] })],
    ["door-vault", "Vault door", "door", { w: 2.2, d: .6, h: 2.4, m: { body: "steel", frame: "concrete" }, style: "vault" }, { g: [HI, MO, SF, CY] }],
    ["door-secret", "Secret bookcase door", "door", { w: 1.2, d: .4, h: 2.3, m: { body: "walnut", frame: "walnut" }, style: "secret" }, { g: [F, HI, HO, MO] }],
    ["door-boarded", "Boarded-up door", "door", { w: 1.1, d: .2, h: 2.2, m: { body: "oak", frame: "walnut" }, style: "boarded" }, B({ g: [HO, PA, HI, MO] })],
    ["bars", "Cell bars", "door", { w: 2, d: .1, h: 2.5, m: { body: "iron" }, style: "bars" }, { g: [F, MD, HI, MO, HO] }],
    ["portcullis", "Portcullis", "door", { w: 3, d: .3, h: 3.2, m: { body: "iron", frame: "granite" }, style: "portcullis" }, B({ g: [F, MD] })],
    ["gate-iron", "Iron gates", "door", { w: 3, d: .2, h: 2.4, m: { body: "blackmetal", frame: "brick" }, style: "gate" }, O({ g: [HI, MO, HO, F] })]
  ]);
  M.add(AR, "Windows", ALL, [
    ["window", "Window", "window", { w: 1.2, d: .2, h: 1.4, y0: .9, m: { frame: "oak" }, style: "plain" }, W(.9)],
    ["window-sash", "Sash window with curtains", "window", { w: 1.2, d: .2, h: 1.6, y0: .8, m: { frame: "birch", curtain: "wine" }, style: "sash", curtains: true }, W(.8, { g: [HI, MO, HO] })],
    ["window-barred", "Barred window", "window", { w: .8, d: .25, h: .8, y0: 1.5, m: { frame: "concrete" }, style: "barred" }, W(1.5)],
    ["window-boarded", "Boarded window", "window", { w: 1.2, d: .2, h: 1.4, y0: .9, m: { frame: "oak" }, style: "boarded" }, W(.9, { g: [HO, PA, HI, MO] })],
    ["window-stained", "Stained-glass window", "window", { w: 1.2, d: .25, h: 2.4, y0: 1, m: { frame: "limestone" }, style: "stained" }, W(1, { g: [F, MD, HI, HO] })]
  ]);
  M.add(AR, "Stairs & ladders", ALL, [
    ["stairs-wood", "Wooden stairs", "stairs", { w: 1.2, d: 3, h: 2.8, m: { body: "oak", rail: "walnut" } }, B()],
    ["stairs-stone", "Stone steps", "stairs", { w: 2, d: 2, h: 1, m: { body: "granite" }, rail: false }, B({ g: [F, MD, HI, HO] })],
    ["stairs-metal", "Metal stairs", "stairs", { w: 1, d: 3, h: 2.8, m: { body: "steel", rail: "pyellow" }, style: "metal" }, B({ g: [MO, MI, SF, PA, CY] })],
    ["stairs-spiral", "Spiral staircase", "stairs", { w: 2, d: 2, h: 3, m: { body: "iron", post: "iron", rail: "iron" }, style: "spiral" }, B()],
    ["stairs-spiral-stone", "Spiral stone stair", "stairs", { w: 2, d: 2, h: 3, m: { body: "granite", post: "granite", rail: "iron" }, style: "spiral" }, B({ g: [F, MD, HI, HO] })]
  ]);
  M.add(AR, "Fences & rails", ALL, [
    ["fence-picket", "Picket fence", "fence", { w: 3, d: .1, h: 1, m: { body: "birch" }, style: "picket" }, O({ g: [HI, MO, HO] })],
    ["fence-iron", "Iron railings", "fence", { w: 3, d: .1, h: 1.6, m: { body: "blackmetal", post: "brick" }, style: "iron" }, O({ g: [HI, MO, HO] })],
    ["fence-chain", "Chain-link fence", "fence", { w: 4, d: .1, h: 2.2, m: { body: "steel", post: "steel" }, style: "chain" }, O({ g: [MO, MI, PA, CY] })],
    ["fence-rail", "Rail fence", "fence", { w: 4, d: .15, h: 1.2, m: { body: "pine", post: "oak" }, style: "rail" }, O({ g: [F, MD, HI, MO] })],
    ["palisade", "Palisade", "fence", { w: 4, d: .3, h: 3, m: { body: "bark" }, style: "palisade" }, O({ g: [F, MD, HI, PA] })],
    ["railing", "Guard rail", "fence", { w: 3, d: .1, h: 1, m: { body: "steel", post: "steel" }, style: "guard" }, B({ g: [MO, MI, SF, CY, PA] })]
  ]);
  M.add(AR, "Floors & platforms", ALL, [
    ["dais", "Dais", "platform", { w: 3, d: 3, h: .4, m: { body: "marble", carpet: "red" }, carpet: true }, B({ g: [F, MD, HI, HO] })],
    ["stage", "Stage", "platform", { w: 5, d: 3, h: .8, m: { body: "walnut", top: "plank" }, style: "stage" }],
    ["platform-grate", "Metal platform", "platform", { w: 2, d: 2, h: .8, m: { body: "steel" }, style: "grate" }, B({ g: [MO, MI, SF, PA, CY] })],
    ["ramp", "Ramp", "platform", { w: 1.5, d: 3, h: .8, m: { body: "concrete" }, style: "ramp" }, B()],
    ["trapdoor", "Trapdoor", "vent", { w: .9, d: .9, h: .05, m: { body: "oak", frame: "iron" }, style: "hatch" }, { g: [F, MD, HI, HO, PA] }],
    ["hatch-metal", "Floor hatch", "vent", { w: .9, d: .9, h: .05, m: { body: "steel", frame: "gunmetal" }, style: "hatch" }, { g: [MO, MI, SF, CY] }],
    ["grate", "Drain grate", "decal", { w: .6, d: .6, h: .01, style: "grate" }, B()],
    ["beam-wood", "Wooden beam", "beam", { w: 4, d: .3, h: 2.8, m: { body: "oak" } }, C({ g: [F, MD, HI, HO] })],
    ["beam-steel", "Steel girder", "beam", { w: 4, d: .2, h: 3, m: { body: "rust" }, style: "steel" }, C({ g: [MO, PA, HI] })],
    ["truss", "Roof truss", "beam", { w: 6, d: .2, h: 3.2, m: { body: "oak" }, style: "truss" }, C({ g: [F, MD, HI, PA] })]
  ]);
  M.add(AR, "Rubble", ALL, [
    ["rubble-stone", "Stone rubble", "rubble", { w: 2, d: 2, h: .8, m: { body: "granite" } }, B()],
    ["rubble-brick", "Brick rubble", "rubble", { w: 2, d: 2, h: .6, m: { body: "brick" }, style: "bricks" }, B()],
    ["rubble-wood", "Broken planks", "rubble", { w: 2, d: 2, h: .4, m: { body: "plank" }, style: "wood" }, B()],
    ["rubble-concrete", "Concrete rubble", "rubble", { w: 2.4, d: 2.4, h: .6, m: { body: "concrete" }, style: "concrete" }, B({ g: [MO, MI, PA, CY, SF] })],
    ["glass-shards", "Broken glass", "rubble", { w: 1, d: 1, h: .01, style: "glass" }, B()]
  ]);

  /* ================= L. horror ================= */
  const HR = "Horror";
  M.add(HR, "Graveyard", [HO, HI, MD, F], [
    ["grave-headstone", "Headstone", "grave", { w: .6, d: .15, h: .9, m: { body: "granite" }, text: "R.I.P." }, O()],
    ["grave-cross", "Grave cross", "grave", { w: .5, d: .1, h: 1.1, m: { body: "limestone" }, style: "cross" }, O()],
    ["grave-celtic", "Celtic cross", "grave", { w: .6, d: .15, h: 1.6, m: { body: "granite" }, style: "celtic" }, O()],
    ["grave-obelisk", "Obelisk grave", "grave", { w: .5, d: .5, h: 2, m: { body: "granite" }, style: "obelisk" }, O()],
    ["grave-angel", "Weeping angel grave", "grave", { w: .7, d: .5, h: 1.9, m: { body: "marble" }, style: "angel" }, O()],
    ["grave-plot", "Grave with a plot", "grave", { w: .6, d: .15, h: .9, m: { body: "granite" }, plot: true }, O()],
    ["grave-mound", "Fresh grave", "grave", { w: 1, d: 2, h: .3, m: { body: "dirt" }, style: "mound" }, O()],
    ["grave-open", "Open grave", "grave", { w: 1, d: 2, h: .1, style: "open" }, O()],
    ["coffin", "Coffin", "coffin", { w: .7, d: 2, h: .55, m: { body: "walnut", handle: "brass" }, cross: true }, B()],
    ["coffin-open", "Open coffin", "coffin", { w: .7, d: 2, h: .55, m: { body: "walnut", satin: "red", handle: "brass" }, open: true, bones: true }, B()],
    ["sarcophagus", "Sarcophagus", "coffin", { w: 1, d: 2.3, h: 1, m: { body: "limestone" }, style: "sarcophagus" }, B({ g: [HO, F, MD, HI] })],
    ["sarcophagus-open", "Open sarcophagus", "coffin", { w: 1, d: 2.3, h: 1, m: { body: "limestone" }, style: "sarcophagus", open: true }, B({ g: [HO, F, MD, HI] })]
  ]);
  M.add(HR, "Ritual & remains", [HO, F, HI], [
    ["blood-pool", "Pool of blood", "decal", { w: 1.2, d: 1, h: .01, style: "blood" }, B({ g: [HO, MO, HI, PA, CY] })],
    ["blood-trail", "Trail of blood", "decal", { w: 1, d: 2.5, h: .01, style: "trail" }, B({ g: [HO, MO, HI, PA, CY] })],
    ["footprints", "Footprints", "decal", { w: .6, d: 2, h: .01, style: "footprints" }, B({ g: ALL })],
    ["chalk-outline", "Chalk body outline", "decal", { w: 1, d: 1.9, h: .01, style: "chalk" }, B({ g: [MO, HI, HO, CY] })],
    ["scorch", "Scorch mark", "decal", { w: 1.5, d: 1.5, h: .01, style: "scorch" }, B({ g: ALL })],
    ["oil-stain", "Oil stain", "decal", { w: 1.2, d: 1, h: .01, style: "oil" }, B({ g: [MO, PA, MI, CY, SF] })],
    ["floor-crack", "Cracked floor", "decal", { w: 1.5, d: 1.5, h: .01, style: "crack" }, B({ g: ALL })],
    ["tentacles", "Tentacles from the floor", "growth", { w: 2, d: 2, h: 2.2, m: { skin: "alien" }, style: "tentacles" }, B({ g: [HO, F, SF] })],
    ["egg-sacs", "Egg sacs", "growth", { w: 1.5, d: 1.5, h: .4, m: { egg: "slime" }, style: "eggs" }, B({ g: [HO, SF, F] })],
    ["iron-maiden", "Iron maiden", "coffin", { w: .7, d: .6, h: 2, m: { body: "iron", band: "rust" }, style: "maiden" }, { g: [HO, MD, F] }]
  ]);

  /* ================= the kits: a set of models for a kind of place, and a ready arrangement of them (in squares,
     about the point where the game master puts it down) ================= */
  M.kit({ id: "tavern", n: "Tavern", g: [F, MD, HI], d: "A common room: the bar, tables and benches, barrels, the fire.",
    ids: ["counter-bar", "table-tavern", "table-trestle", "bench-plain", "stool-tall", "stool-3", "barrel", "barrel-keg", "barrel-stack", "barrel-tap", "fireplace-stone", "chandelier-iron", "sconce-torch", "tankard", "mugs", "bottles", "lantern", "shelf-wine", "sign-inn", "rug-bearskin", "plate-stew", "bread", "cheese", "hearth"],
    set: [["counter-bar", 0, -2.4, 0], ["barrel-stack", -2.6, -2.7, 0], ["barrel-tap", 2.3, -2.7, 0], ["table-tavern", -1.6, .2, 0], ["bench-plain", -1.6, -.3, 0], ["bench-plain", -1.6, .7, 0], ["table-tavern", 1.6, .2, 0], ["bench-plain", 1.6, -.3, 0], ["bench-plain", 1.6, .7, 0], ["fireplace-stone", 0, 2.7, 180], ["rug-bearskin", 0, 1.9, 0], ["chandelier-iron", 0, 0, 0], ["stool-tall", -.8, -1.8, 0], ["stool-tall", .4, -1.8, 0]] });
  M.kit({ id: "castle", n: "Castle hall & dungeon", g: [F, MD], d: "A throne on its dais, banners, pillars and braziers; cells, chains and treasure below.",
    ids: ["chair-throne", "dais", "banner-wall", "banner-standing", "tapestry", "column-round", "brazier", "statue-knight", "armor-plate", "rack-weapons", "chest-treasure", "cage", "door-iron", "portcullis", "bars", "chains-hanging", "skulls", "sconce-torch", "rug-runner", "table-banquet", "chandelier", "door-cell", "bones", "cage-hanging"],
    set: [["dais", 0, -2.5, 0], ["chair-throne", 0, -2.6, 0], ["rug-runner", 0, .2, 0], ["column-round", -2, -1, 0], ["column-round", 2, -1, 0], ["column-round", -2, 1.5, 0], ["column-round", 2, 1.5, 0], ["brazier", -1.2, -2.2, 0], ["brazier", 1.2, -2.2, 0], ["armor-plate", -2.8, -2.6, 0], ["armor-plate", 2.8, -2.6, 0], ["banner-standing", -1.1, -3.2, 0], ["banner-standing", 1.1, -3.2, 0]] });
  M.kit({ id: "wizard", n: "Wizard's laboratory", g: [F, HO], d: "Potions, scrolls and tomes; the cauldron, the circle and the stars.",
    ids: ["table-alchemy", "shelf-potions", "shelf-scrolls", "bookcase-tall", "lectern", "cauldron-fire", "crystalball", "circle-magic", "telescope", "globe", "hourglass", "candles-cluster", "books-pile", "chandelier", "potions", "skull", "curio-cabinet", "armor-robe", "rug-persian", "sigil"],
    set: [["circle-magic", 0, .5, 0], ["cauldron-fire", 0, .5, 0], ["table-alchemy", -2, -2.3, 0], ["shelf-potions", 0, -2.8, 0], ["bookcase-tall", 2, -2.8, 0], ["lectern", 2.2, -.8, 270], ["telescope", 2.4, 2.2, 0], ["shelf-scrolls", -2.8, 0, 90], ["books-pile", -2, 2.2, 0], ["candles-cluster", -1.4, 1.5, 0], ["chandelier", 0, -1, 0]] });
  M.kit({ id: "apartment", n: "Modern apartment", g: [MO, HO], d: "Living room, kitchen, bedroom and bathroom.",
    ids: ["sofa-3", "armchair", "table-coffee", "tv-flat", "rug-modern", "lamp-floor", "plant-ficus", "bed-double", "nightstand", "wardrobe-modern", "counter-kitchen", "counter-sink", "counter-hob", "fridge", "table-kitchen", "chair-wood", "toilet", "bathtub-modern", "sink-pedestal", "washer", "pendant", "bookcase", "desk-computer", "chair-office"],
    set: [["rug-modern", 0, 0, 0], ["sofa-3", 0, .9, 180], ["table-coffee", 0, 0, 0], ["tv-flat", 0, -1.1, 0], ["armchair", 1.5, 0, 270], ["lamp-floor", -1.5, 1.1, 0], ["plant-ficus", 1.6, 1.2, 0], ["counter-kitchen", -2.6, -2.5, 0], ["fridge", -1.4, -2.5, 0], ["table-kitchen", -2.6, -1.2, 0], ["chair-wood", -3.1, -1.2, 90], ["chair-wood", -2.1, -1.2, 270]] });
  M.kit({ id: "office", n: "Office", g: [MO, CY], d: "Desks and cubicles, filing, the copier and the water cooler.",
    ids: ["desk-office", "chair-office", "cubicle", "filing", "copier", "watercooler", "whiteboard", "plant-snake", "partition", "light-panel", "computer-desktop", "desk-executive", "chair-exec", "bookcase", "bin-office", "shelf-files", "safe", "sofa-modern", "counter-reception", "bench-waiting"],
    set: [["cubicle", -2, -1.6, 0], ["cubicle", 0, -1.6, 0], ["cubicle", 2, -1.6, 0], ["chair-office", -2, -1.3, 180], ["chair-office", 0, -1.3, 180], ["chair-office", 2, -1.3, 180], ["filing", -2.8, 1.2, 90], ["filing", -2.8, 1.6, 90], ["copier", 2.6, 1.4, 270], ["watercooler", 2.6, .6, 270], ["whiteboard", 0, 2.4, 180], ["plant-snake", -2.6, 2.4, 0], ["light-panel", 0, 0, 0]] });
  M.kit({ id: "hospital", n: "Hospital & laboratory", g: [MO, HO, SF], d: "A ward, an operating theatre and a lab.",
    ids: ["bed-hospital", "iv-stand", "monitor-medical", "gurney", "wheelchair", "table-operating", "light-surgical", "cabinet-medical", "xray", "sink-utility", "table-lab", "scanner", "cryopod", "tank-specimen", "bench-waiting", "counter-reception", "jar-specimen", "firstaid", "vials", "table-autopsy"],
    set: [["table-operating", 0, 0, 0], ["light-surgical", 0, 0, 0], ["monitor-medical", -.8, -.4, 0], ["iv-stand", .8, -.4, 0], ["cabinet-medical", -2.4, -2.6, 0], ["sink-utility", -1.2, -2.6, 0], ["table-lab", 1.6, -2.6, 0], ["gurney", 2.6, .6, 0], ["wheelchair", -2.4, 1.6, 30], ["xray", 0, -2.9, 0]] });
  M.kit({ id: "police", n: "Police station & crime scene", g: [MO, HI, HO], d: "The detective's office, the evidence, the tape and the chalk.",
    ids: ["desk-detective", "chair-office", "board-crime", "table-evidence", "filing", "chair-interrogation", "lamp-desk", "camera", "chalk-outline", "blood-pool", "footprints", "sawhorse", "cone", "car-police", "gurney-body", "bars", "door-cell", "bed-prison", "toilet-steel", "typewriter"],
    set: [["chalk-outline", 0, 0, 20], ["blood-pool", .3, -.3, 0], ["footprints", 1.4, .6, 120], ["sawhorse", -2, 1.8, 0], ["sawhorse", 1.6, 2, 20], ["cone", -.4, 2.1, 0], ["cone", .4, 2.1, 0], ["gurney-body", 2.4, -1.2, 90], ["camera", -.9, .4, 0], ["table-evidence", -2.3, -1.5, 90]] });
  M.kit({ id: "outpost", n: "Military outpost", g: [MI, MO, PA], d: "Sandbags and wire, a watchtower, tents, crates and the radio.",
    ids: ["sandbags", "sandbags-ring", "watchtower", "tent-military", "bed-bunk-metal", "bed-cot", "crate-military", "crate-ammo", "crate-ammo-stack", "jerrycans", "drum-oil", "table-map", "table-radio", "mg-nest", "searchlight", "flagpole", "barbed-coil", "hedgehog", "jeep", "footlocker", "rack-rifles", "chair-folding", "lamp-flood", "generator-diesel", "radio-field"],
    set: [["sandbags-ring", 0, -2, 0], ["mg-nest", 0, -2, 0], ["sandbags", -2.6, 0, 90], ["sandbags", 2.6, 0, 90], ["tent-military", -1.8, 2, 0], ["crate-ammo-stack", 1.2, 1, 0], ["crate-military", 2, 1.6, 15], ["jerrycans", 1.2, 2.4, 0], ["drum-oil", 2.4, 2.6, 0], ["table-radio", 0, .8, 0], ["chair-folding", 0, 1.3, 180], ["flagpole", -2.8, -2.8, 0]] });
  M.kit({ id: "factory", n: "Factory floor", g: [MO, HI, PA], d: "Pipes and tanks, the press and the belt, catwalks above.",
    ids: ["pipes-run", "pipes-bundle", "pipes-riser", "valve", "tank-upright", "tank-vat", "conveyor", "press", "lathe", "drill", "catwalk", "ladder-cage", "pallet-boxes", "pallet-stack", "forklift", "gas-cylinders", "control-panel", "fusebox", "generator-diesel", "shelf-metal", "crane-hook", "light-cage", "toolbox", "tool-chest", "boiler-steam", "oil-stain"],
    set: [["conveyor", 0, 0, 0], ["press", -2.4, -1.6, 0], ["lathe", 1.8, -1.8, 0], ["tank-vat", 2.6, 1.6, 0], ["pallet-boxes", -2.4, 1.6, 0], ["pallet-stack", -1.4, 2.2, 0], ["forklift", -.2, 2.2, 90], ["control-panel", 0, -2.4, 0], ["pipes-run", 0, -2.9, 0], ["light-cage", 0, 0, 0], ["oil-stain", 1, 1.2, 0]] });
  M.kit({ id: "neon", n: "Cyberpunk street & nightclub", g: [CY, FU, MO], d: "Neon, noodles and rubbish outside; the bar, the booth and the arcade inside.",
    ids: ["neon-open", "neon-bar", "neon-hotel", "neon-ramen", "neon-clinic", "neon-custom", "vending-cyber", "stall-noodle", "trash-bags", "litter", "dumpster", "ac-unit", "cables", "motorbike", "billboard-holo", "arcade", "chair-gaming", "counter-bar-chrome", "stool-bar", "speakers", "djbooth", "jukebox", "sofa-club", "light-neon-tube", "puddle", "drum-fire"],
    set: [["stall-noodle", 0, -1.8, 0], ["stool-bar", -.5, -1.1, 0], ["stool-bar", .5, -1.1, 0], ["vending-cyber", 2.3, -2.3, 0], ["trash-bags", -2.4, -2.2, 0], ["dumpster", -2.3, 0, 90], ["motorbike", 1.5, .8, 30], ["puddle", 0, 1.4, 0], ["cables", .2, 2.4, 0], ["drum-fire", -1.2, 2, 0]] });
  M.kit({ id: "spaceship", n: "Spaceship interior", g: [SF, FU], d: "The bridge, the corridors and the crew's quarters.",
    ids: ["console-bridge", "console-desk", "console-station", "chair-pilot", "bulkhead", "airlock", "wall-hull", "column-scifi", "crate-scifi", "crate-scifi-stack", "lockers-scifi", "bed-pod", "holotable-ship", "vent-floor", "light-strip", "window-porthole", "robot", "stove-synth", "desk-scifi", "light-panel", "floor-hazard", "medkit"],
    set: [["console-bridge", 0, -1.8, 0], ["chair-pilot", 0, -1, 0], ["chair-pilot", -1.4, -.9, 330], ["chair-pilot", 1.4, -.9, 30], ["holotable-ship", 0, 1, 0], ["console-station", -2.5, 1, 90], ["console-station", 2.5, 1, 270], ["bulkhead", 0, 2.9, 0], ["column-scifi", -2.4, -2.4, 0], ["column-scifi", 2.4, -2.4, 0], ["light-panel", 0, 0, 0]] });
  M.kit({ id: "station", n: "Space station", g: [SF, FU], d: "Reactor, servers and labs, the docking pad and the cargo.",
    ids: ["reactor", "generator-scifi", "server-row", "holotable", "kiosk", "cryopod", "tank-specimen", "scanner", "airlock", "platform-round", "dish", "antenna", "tank-fuel", "drone", "turret", "floor-hazard", "floor-helipad", "container-pod", "robot-box", "pipes-scifi", "console-wall", "catwalk"],
    set: [["reactor", 0, 0, 0], ["floor-hazard", 0, 1.6, 0], ["floor-hazard", 0, -1.6, 0], ["generator-scifi", -2.4, -1.8, 0], ["generator-scifi", 2.4, -1.8, 0], ["server-row", -2.2, 1.8, 0], ["console-station", 2.2, 1.8, 0], ["pipes-scifi", 0, -2.7, 0], ["drone", 1.4, .2, 0]] });
  M.kit({ id: "alien", n: "Alien facility", g: [SF, HO, F], d: "Things that grew here, things that were built here, and what they keep.",
    ids: ["tree-alien", "alien-plant", "crystals", "crystals-red", "egg-sacs", "tentacles", "altar-alien", "obelisk-alien", "statue-eldritch", "tank-specimen", "sigil", "mushroom-glow", "roots", "vines", "cryopod", "floor-crack", "bones", "skeleton"],
    set: [["obelisk-alien", 0, -2, 0], ["altar-alien", 0, -.6, 0], ["sigil", 0, -.6, 0], ["egg-sacs", -2, 1.2, 0], ["egg-sacs", 2.2, .8, 0], ["tentacles", -2.4, -1.8, 0], ["crystals", 2.4, -2, 0], ["alien-plant", 1.8, 2.2, 0], ["mushroom-glow", -1.6, 2.4, 0], ["skeleton", .8, 1.4, 40]] });
  M.kit({ id: "shelter", n: "Post-apocalyptic shelter", g: [PA, MO, HO], d: "Scrap walls, a fire in a drum, water, and what was saved.",
    ids: ["scrap-wall", "shelter", "tires", "junk", "purifier", "drum-fire", "bed-mattress", "car-wreck", "crate-plastic", "boxes-cardboard", "shelf-canned", "cart-shopping", "bed-cot", "jerrycan", "rubble-concrete", "chair-plastic", "table-folding", "lantern", "radio-field", "sign-danger", "trash-bags", "stove-iron", "tool-crowbar", "backpack"],
    set: [["drum-fire", 0, 0, 0], ["bed-mattress", -2, -1.6, 90], ["bed-cot", -2, .6, 90], ["shelf-canned", 0, -2.6, 0], ["purifier", 2, -2.2, 0], ["table-folding", 1.8, .4, 90], ["chair-plastic", 1.2, .4, 90], ["tires", 2.4, 2.2, 0], ["cart-shopping", -.6, 2.2, 200], ["scrap-wall", 0, 3, 0], ["jerrycan", 2.6, -.8, 0], ["boxes-cardboard", -2.4, 2.4, 0]] });
  M.kit({ id: "asylum", n: "Abandoned hospital", g: [HO, MO, HI], d: "Iron beds, a wheelchair left in the hall, something in the bath.",
    ids: ["bed-iron", "wheelchair", "gurney-body", "chair-restraint", "bathtub-blood", "bulb", "blood-pool", "blood-trail", "doll", "chair-rocking", "mirror", "painting-sinister", "door-boarded", "window-boarded", "bones", "jar-specimen", "cabinet-medical", "light-surgical", "table-operating", "iv-stand", "chains-hanging", "floor-crack", "glass-shards", "plant-dead", "door-cell"],
    set: [["bed-iron", -2.2, -2, 0], ["bed-iron", -.7, -2, 0], ["bed-iron", .8, -2, 0], ["wheelchair", 2, .4, 200], ["blood-trail", .4, .6, 30], ["doll", -1.5, .8, 0], ["chair-restraint", 2.4, -2.2, 0], ["bulb", 0, 0, 0], ["glass-shards", -.4, 2, 0], ["iv-stand", 1.4, -2.3, 0], ["floor-crack", -2.2, 1.8, 0]] });
})(ATLAS);
