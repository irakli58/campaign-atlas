/* The campaign's things (the item and loot system, 18 Nov 2026: docs/requests/2026-11-18-item-loot-system.md; plan:
   docs/plans/2026-11-18-item-loot-plan.md). Every thing in the campaign, from a rusty kitchen knife to a legendary
   artifact, lives in ONE store: collection "stash", which Money and goods already used for what the party carries.
   Each record has an owner:
   - "party" (or none) for what the party carries, so Money and goods shows the same things it always did;
   - "pc:<id>", a person's ref ("cast:<id>", "npc:<place>/<id>"), "place:<id>", "merchant:<id>";
   - "in:<item id>", inside a chest or a bag;
   - "library", the campaign's item library.
   Moving a thing changes its owner and keeps its record, so nothing is duplicated.
   Where a thing comes from:
   - the game's own items (atlas-items-rules.js: the SRD for D&D 5e, the names of its equipment for other games, and the
     game master's own list, collection "rulebook");
   - the age's goods (atlas-economy.js);
   - Atlas's ordinary and story things, marked as Atlas's.
   Everything generated is a proposal until the game master keeps it. Loot follows the place (what it is, who is there,
   whose ground it is, what happened there), a person's things follow their trade, wealth and faction, and a poor or
   empty place may hold nothing worth taking. A thing's secret, its story and who wants it stay the game master's; the
   players see its look and what has been revealed to them. A thing becomes a clue only when the game master adds it as
   one (St.putClue, logged and undoable). A tab of At the table ("Items"), a card on Make it up, a section on every
   place's page, a line on every person's card, and the Copilot's "Things and loot". */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc, R = A.itemRules || { DND5: null, NAMES: {}, which: () => "" };
  const S = () => api.store();
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const cap = s => String(s || "").replace(/^./, c => c.toUpperCase());
  const low = s => String(s || "").replace(/^(The|A|An) /, m => m.toLowerCase());
  const uid = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const cfg = () => A.config || {};
  const placeName = id => (A.meta[id] || {}).name || id;
  const pls = () => (A.order || []).filter(id => A.meta[id] && !String(id).startsWith("fly-"));

  /* ---- the game, the age, magic */
  const game = () => R.which(cfg().system);
  const ageOf = () => { const e = T.era ? T.era() : "medieval"; return e === "medieval" || e === "fantasy" ? "medieval" : e === "modern" ? "modern" : e === "future" ? "future" : e === "1920s" ? "1920s" : "old"; };
  const magicHere = () => game() === "dnd5" || game() === "pf2e" || /fantasy|myth|sword|sorcer|wizard|dragon/i.test([cfg().genre, cfg().setting].join(" "));
  const weirdHere = () => game() === "coc" || /cthulhu|horror|weird|occult|delta green|vampire|kult/i.test([cfg().genre, cfg().system, cfg().setting].join(" "));
  const ruleName = () => { const g = game(); return g === "dnd5" ? R.DND5.name : g && R.NAMES[g] ? R.NAMES[g].name : cfg().system || ""; };

  /* ---- the categories */
  const CATS = [["weapon", "Weapons"], ["armour", "Armour"], ["ammo", "Ammunition"], ["consumable", "Potions and consumables"], ["medicine", "Medicine"], ["food", "Food and drink"], ["gear", "Gear and supplies"], ["tool", "Tools"],
    ["clothing", "Clothing"], ["jewellery", "Jewellery"], ["book", "Books"], ["document", "Documents and letters"], ["key", "Keys"], ["personal", "Personal belongings"], ["valuable", "Coins, gems and art"], ["trade", "Trade goods and materials"],
    ["container", "Chests, boxes and bags"], ["relic", "Relics and artifacts"], ["device", "Devices and technology"], ["household", "Household things"]];
  const catName = c => (CATS.find(x => x[0] === c) || [0, cap(c || "Things")])[1];
  // the economy's kinds of goods, as categories
  const KIND_CAT = { weapons: "weapon", armour: "armour", ammunition: "ammo", medicine: "medicine", food: "food", drink: "food", clothing: "clothing", tools: "tool", light: "gear", books: "book", luxury: "jewellery", tech: "device", fuel: "gear", animals: "trade", valuables: "valuable" };
  const RAR = ["common", "uncommon", "rare", "very rare", "legendary"];
  const RW = { common: 1, uncommon: 6, rare: 40, "very rare": 250, legendary: 1500 };

  /* ---- the small pictures: one for each category, drawn in the page's own line, framed for the age */
  const GL = { weapon: "M5 19 19 5M15 5h4v4M7 15l2 2M4 20l2-2", armour: "M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z", ammo: "M8 4h2v11H8zM14 4h2v11h-2zM7 18h4M13 18h4", consumable: "M10 3h4v4l3 5v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-7l3-5z", medicine: "M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z",
    food: "M6 11h12a6 6 0 0 1-12 0zM9 4v4M12 3v5M15 4v4", gear: "M4 8h16v11H4zM9 8V5h6v3", tool: "M14 4a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2z", clothing: "M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-4z", jewellery: "M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM9 6l3-3 3 3",
    book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10", document: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7", key: "M8 14a4 4 0 1 1 3-6l9 0v3h-2v2h-2v-2h-5a4 4 0 0 1-3 3z", personal: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0",
    valuable: "M6 9 9 4h6l3 5-6 11z M6 9h12", trade: "M4 8h16l-2 12H6zM8 8a4 4 0 0 1 8 0", container: "M4 9h16v10H4zM4 9l2-4h12l2 4M11 13h2", relic: "M12 3l2.5 6H21l-5 4 2 7-6-4-6 4 2-7-5-4h6.5z", device: "M6 4h12v16H6zM9 17h6M9 7h6v6H9z", household: "M4 11 12 4l8 7v9H4zM10 20v-6h4v6" };
  const glyph = (c, cls) => `<svg class="itg${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${GL[c] || GL.personal}"/></svg>`;
  const pic = x => x.img ? `<img class="it-img" src="${esc(x.img)}" alt="">` : `<span class="it-ph age-${ageOf()}">${glyph(x.cat || "personal")}</span>`;

  /* ---- the catalogue: every thing that can be found in this campaign, best first */
  // the age's ordinary things, which need no story
  const ORD = {
    medieval: { household: ["A rusty kitchen knife", "A cracked clay jug", "A wooden bowl", "A tallow candle stub", "A straw-stuffed pillow", "A bent iron pot", "A worn broom", "A chipped cup", "A sack of turnips", "A spindle and wool", "A three-legged stool", "A patched blanket"],
      personal: ["A bone comb", "A carved wooden toy", "A string of prayer beads", "A small knife", "A pouch of dried herbs", "A lucky stone", "A pair of dice", "A wax tablet"], document: ["A tax tally stick", "A letter, badly spelled", "A debt marker", "A pilgrim's token"] },
    old: { household: ["A chipped teacup", "A tin of boot polish", "A cracked mirror", "A stopped carriage clock", "A ladle", "A coal scuttle", "A box of matches", "A stack of old newspapers"],
      personal: ["A clay pipe", "A handkerchief with initials", "A pawn ticket", "A tin whistle", "A pocket comb", "A rosary"], document: ["A pawn ticket", "A rent book", "A calling card", "A letter in a woman's hand", "A railway timetable"] },
    "1920s": { household: ["A chipped teacup", "A cracked mirror", "A stopped clock", "An empty gin bottle", "A box of matches", "A stack of old newspapers", "A cheap vase", "A broken radio"],
      personal: ["A cigarette case, empty", "A lipstick", "A rabbit's foot", "A pocket comb", "A matchbook from a club", "A rosary"], document: ["A pawn ticket", "A train ticket stub", "A calling card", "A letter in a woman's hand", "A receipt"] },
    modern: { household: ["A chipped mug", "A dead phone charger", "A stack of junk mail", "A takeaway menu", "A broken umbrella", "A plastic chair", "A half-empty bottle of water"],
      personal: ["A lighter", "A key ring with no keys", "A receipt", "A pair of cheap earbuds", "A wallet with no cash", "A packet of gum"], document: ["A parking ticket", "A crumpled receipt", "A business card", "A sticky note with a number"] },
    future: { household: ["A dented ration tin", "A cracked cup", "A cable with no plug", "A spent chemlight", "A stained bunk sheet", "A broken stool"],
      personal: ["A worn photo of a planet", "A good-luck charm", "A deck of plastic cards", "A dead datapad", "A personal music chip"], document: ["A crew roster", "A maintenance log", "A cargo manifest", "A pay slip"] }
  };
  const ordOf = a => ORD[a] || ORD.medieval;
  // the economy's goods of the age, and its treasure
  const ageGoods = () => (A.money ? A.money.goods() : []).filter(g => !["lodging", "services", "travel"].includes(g.kind) && !/treatment|visit|a hot meal|dinner|a meal|ride|passage|a night|a word with|a favour|ticket|a guide/i.test(g.n)).map(g => ({ n: g.n.replace(/^(a|an) /i, m => m), cat: KIND_CAT[g.kind] || "gear", cost: g.price, rarity: g.rarity || "common", src: g.own ? "campaign" : "narrative" }));
  const ageTreasure = () => { const t = (A.economyData || {}).treasure || (A.money && A.money.age ? A.money.age().treasure : []) || []; return t.map(x => Array.isArray(x) ? { n: x[0], cat: "valuable", cost: A.money.parse(x[1]), rarity: x[2] || "common", src: "narrative" } : { n: x.n, cat: x.kind || "valuable", cost: A.money.parse(x.value), rarity: x.rarity || "common", src: "campaign" }); };
  // the game's own (the SRD for D&D 5e, names for others), and the game master's own list
  // (a game's named equipment belongs to its usual age: Call of Cthulhu's to the 1920s; a campaign of that game set in
  // another age, a Cthulhu game in the far future, gets its own age's things instead)
  const AGE_GROUP = { medieval: "past", fantasy: "past", old: "early", victorian: "early", "1920s": "early", modern: "modern", future: "future" };
  const sameAge = a => !a || AGE_GROUP[a] === AGE_GROUP[ageOf()];
  function gameItems() {
    const g = game(), out = [];
    for (const [id, x] of Object.entries((S() && S().get("rulebook")) || {})) if (x && x.n) out.push(Object.assign({ src: "rulebook", rb: id }, x));
    if (g === "dnd5") {
      for (const [n, cat, cost, w, st] of R.DND5.items) out.push({ n, cat, cost, weight: w, stats: st, src: "srd", rarity: "common" });
      for (const [n, cat, rar, att, say] of R.DND5.magic) out.push({ n, cat, rarity: rar === "varies" ? "uncommon" : rar, attune: att, stats: say, magic: true, src: "srd", cost: null });
    } else if (g && R.NAMES[g] && sameAge(R.NAMES[g].age)) {
      const N = R.NAMES[g], avg = cat => { const l = ageGoods().filter(x => x.cat === cat).map(x => x.cost); return l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null; };
      for (const cat of ["weapon", "armour", "gear", "document"]) for (const n of N[cat] || []) out.push({ n, cat, src: "names", book: N.book, cost: avg(cat), rarity: "common" });
    }
    return out;
  }
  // the whole catalogue for a category (or all), the game's first; magic only when asked for or allowed
  function catalogue(o) {
    o = o || {}; const a = ageOf();
    let l = gameItems();
    if (!l.some(x => x.src === "srd" || x.src === "names") || o.allAges) l = l.concat(ageGoods(), ageTreasure());
    else l = l.concat(ageTreasure());
    for (const [cat, names] of Object.entries(ordOf(a))) for (const n of names) l.push({ n, cat, cost: 1, rarity: "common", src: "narrative", ordinary: true });
    if (o.allAges) for (const [k, O] of Object.entries(ORD)) if (k !== a) for (const [cat, names] of Object.entries(O)) for (const n of names) l.push({ n, cat, cost: 1, rarity: "common", src: "narrative", ordinary: true, offAge: k });
    if (o.cat) l = l.filter(x => x.cat === o.cat);
    if (o.magic === false) l = l.filter(x => !x.magic);
    return l;
  }

  /* ---- what a place is, and so what may be found there: [match, profile] */
  const PROF = [
    [/bandit|camp|outlaw|brigand|raider|smuggl|hideout|den\b/, { k: "camp", w: 1, cats: { weapon: 3, food: 3, valuable: 2, personal: 2, document: 1, container: 1, gear: 2 }, story: ["A merchant's stolen necklace", "A letter mentioning another hideout", "A purse cut from someone's belt", "A tally of who has paid for passage"] }],
    [/wizard|mage|sorcer|arcan|alchemist|witch'?s? hut|tower of|observatory/, { k: "study", w: 2, cats: { book: 4, consumable: 2, document: 2, tool: 2, relic: 1, gear: 1 }, story: ["A notebook of half-finished workings", "A sealed letter to another of the craft"] }],
    [/manor|house|hall|mansion|villa|estate|home|cottage|lodg/, { k: "house", w: 2, cats: { household: 4, personal: 3, document: 2, jewellery: 1, book: 1, clothing: 2, container: 1 }, story: ["An old diary", "A damaged photograph", "A locked jewellery box", "A letter never sent", "A family portrait with a face scratched out"] }],
    [/tomb|crypt|barrow|grave|ossuary|mausoleum|catacomb/, { k: "tomb", w: 2, cats: { valuable: 3, relic: 2, jewellery: 2, weapon: 1, armour: 1, household: 1 }, story: ["A burial mask", "Grave goods of a forgotten house", "A funerary inscription", "A ring on a finger bone"] }],
    [/ruin|abandon|derelict|ruined|wreck|haunted|empty/, { k: "ruin", w: 0, empty: .35, cats: { household: 4, personal: 2, document: 1, trade: 1, container: 1 }, story: ["A note left by the last to leave", "A broken thing someone came back for"] }],
    [/lab|laborator|research|institute|observator|workshop|clinic/, { k: "lab", w: 2, cats: { device: 3, tool: 3, document: 3, medicine: 2, book: 2 }, story: ["An experimental device", "A research log with pages torn out", "A sample case, still sealed", "A prototype no one else has seen"] }],
    [/station|ship|vessel|hull|deck|bay|outpost|colony|dock(ing)?\b/, { k: "station", w: 1, cats: { device: 3, gear: 3, medicine: 2, ammo: 1, document: 2, food: 1 }, story: ["An access card", "Emergency medical supplies", "Salvageable equipment", "An experimental device", "A black-box recorder"] }],
    [/temple|shrine|church|chapel|abbey|monaster|cathedral|sanctu|priory/, { k: "temple", w: 2, cats: { relic: 2, book: 2, valuable: 2, household: 1, document: 1, jewellery: 1 }, story: ["A relic in a reliquary", "A ledger of tithes", "A forbidden prayer book"] }],
    [/tavern|inn\b|alehouse|pub\b|saloon|bar\b|club/, { k: "tavern", w: 1, cats: { food: 4, household: 3, personal: 2, valuable: 1, document: 1 }, story: ["A debt slate", "A drunk's forgotten purse", "A letter left for someone"] }],
    [/forge|smith|foundry|armou?ry|arsenal/, { k: "forge", w: 2, cats: { weapon: 4, armour: 3, tool: 3, trade: 2 }, story: ["A blade made to an odd order", "A mould for a key"] }],
    [/guild|market|shop|store|emporium|bazaar|warehouse|counting/, { k: "market", w: 3, cats: { trade: 4, valuable: 2, document: 3, container: 2, clothing: 1 }, story: ["A ledger of debts", "A cargo manifest that does not add up", "A strongbox"] }],
    [/keep|castle|fort|barrack|garrison|citadel|tower|palace/, { k: "keep", w: 3, cats: { weapon: 3, armour: 3, document: 2, valuable: 2, clothing: 1, food: 1 }, story: ["A sealed order", "A signet ring", "A map of the defences"] }],
    [/mill|farm|barn|croft|orchard|granary|village/, { k: "farm", w: 0, cats: { household: 4, food: 3, tool: 3, personal: 1 }, story: ["A grate that does not belong in a mill", "A tally of grain owed"] }],
    [/library|academy|college|archive|school|scriptor|study/, { k: "library", w: 2, cats: { book: 4, document: 4, tool: 1, personal: 1 }, story: ["A book with a hollow spine", "Marginal notes in a dead man's hand"] }],
    [/hospital|asylum|sanator|infirmar/, { k: "hospital", w: 1, cats: { medicine: 4, document: 3, tool: 2, personal: 2 }, story: ["A patient's file", "A restraint with a name scratched into it"] }],
    [/mine|quarr|pit\b|shaft/, { k: "mine", w: 1, cats: { tool: 4, trade: 3, gear: 2, valuable: 1 }, story: ["An ore sample that should not be here", "A miner's tally"] }],
    [/cave|cavern|grotto|lair|warren|tunnel/, { k: "cave", w: 1, empty: .2, cats: { valuable: 2, weapon: 2, household: 1, personal: 2, relic: 1 }, story: ["The belongings of someone who did not come back"] }],
    [/harbou?r|port|wharf|quay|pier|dock/, { k: "harbour", w: 1, cats: { trade: 4, food: 2, gear: 2, document: 2 }, story: ["A cargo manifest", "A sailor's keepsake"] }]
  ];
  const DEFAULT_PROF = { k: "place", w: 1, cats: { household: 3, personal: 2, gear: 2, valuable: 1, document: 1 }, story: [] };
  function placeWords(id) {
    const m = A.meta[id] || {}, M = A.maps[id] ? A.get(id, 99) : {};
    const people = Object.values(M.npcs || {}).map(n => n.n || "").join(" "), rooms = Object.values(M.rooms || {}).map(r => r.n || r.name || "").join(" ");
    return [m.name, m.cat, m.kind, m.tagline, m.sub, M.ov, M.ext, people, rooms].join(" ").toLowerCase();
  }
  function profileOf(words) {
    for (const [re, p] of PROF) if (re.test(words)) return p;
    return DEFAULT_PROF;
  }
  // how rich a place or a person is: 0 poor, 1 modest, 2 comfortable, 3 rich
  const wealthOf = (words, base) => Math.max(0, Math.min(3, base + (/noble|lord|lady|baron|duke|king|queen|guildmaster|banker|rich|wealthy|merchant prince|palace|treasury|vault/.test(words) ? 1 : 0) - (/poor|beggar|starving|ruin|abandon|derelict|hovel|slum|warren/.test(words) ? 1 : 0)));

  /* ---- a thing from the catalogue, made particular: quality, condition, worth, and a story only if it deserves one */
  const QUAL = () => (A.money && A.money.QUAL) || [["plain", "Plain", 1, 1]], COND = () => (A.money && A.money.COND) || [["good", "Good", 1, 1]];
  const pickW = l => { let r = Math.random() * l.reduce((a, x) => a + x[3], 0); for (const x of l) if ((r -= x[3]) < 0) return x; return l[0]; };
  function particular(base, o) {
    o = o || {};
    const q = base.ordinary ? ["plain", "Plain", 1] : pickW(QUAL()), cd = o.cond ? COND().find(c => c[0] === o.cond) || pickW(COND()) : base.ordinary ? pickW(COND().map(c => c[0] === "broken" || c[0] === "worn" ? [c[0], c[1], c[2], c[3] * 2] : c)) : pickW(COND());
    const cost = base.cost != null ? base.cost : (A.money ? Math.max(10, ...A.money.goods().filter(g => g.kind === "food").map(g => g.price)) * 4 : 100) * (RW[base.rarity] || 1);
    return { n: base.n, cat: base.cat, rarity: base.rarity || "common", quality: q[0], cond: cd[0], value: Math.max(1, Math.round(cost * (q[2] || 1) * (cd[2] || 1))), qty: 1,
      weight: base.weight != null ? base.weight : undefined, stats: base.stats || "", src: base.src || "narrative", book: base.book || "", attune: base.attune || "", magic: !!base.magic, ordinary: !!base.ordinary, offAge: base.offAge || "" };
  }

  // a story thing's category from its own words
  const catFor = n => { const t = String(n).toLowerCase(); return /letter|order|ledger|manifest|tally|note|log|file|roster|deed|map|chart|record|inscription/.test(t) ? "document" : /book|diary|journal/.test(t) ? "book" : /box|strongbox|chest|case|crate/.test(t) ? "container" : /ring|necklace|locket|signet|brooch/.test(t) ? "jewellery" : /relic|reliquary|mask|idol|ceremonial|goods/.test(t) ? "relic" : /device|prototype|recorder|card|sample|equipment|supplies/.test(t) ? "device" : /photograph|portrait/.test(t) ? "document" : /purse|coins/.test(t) ? "valuable" : "personal"; };
  // the same thing found twice is one thing, twice
  const merge = l => { const out = []; for (const x of l) { const y = !x.unique && out.find(z => !z.unique && z.n === x.n && (x.ordinary || (z.cond === x.cond && z.quality === x.quality))); if (y) y.qty = (y.qty || 1) + (x.qty || 1); else out.push(x); } return out; };

  /* ---- the campaign's own material, for stories */
  const factions = () => Object.entries(A.factionsData || {}).filter(([, f]) => f && f.n).map(([id, f]) => Object.assign({ id }, f));
  const events = () => (Array.isArray(A.eventsData) ? A.eventsData : Object.values(A.eventsData || {})).filter(e => e && e.title);
  const people = () => A.story && A.story.people ? A.story.people() : Object.entries(A.castData || {}).map(([id, c]) => ({ ref: "cast:" + id, name: c.n, role: c.role || "", text: [c.n, c.role, c.bg].join(" "), places: [] }));
  const factionAt = id => id ? factions().find(f => (f.territory || []).includes(id) || f.hq === id) || null : null;
  const eventsAt = id => events().filter(e => e.place === id);

  /* ---- a unique thing: name, look, materials, condition, maker, age, origin, previous owner, significance, properties,
     worth, faction, rumours; the players see its look, the rest is the game master's until revealed */
  const KINDS = {
    medieval: [["Ring", "jewellery", ["tarnished silver", "red gold", "black iron", "carved bone"]], ["Signet", "jewellery", ["silver", "gold", "bronze"]], ["Dagger", "weapon", ["pitted steel", "bronze", "obsidian"]], ["Blade", "weapon", ["blued steel", "old bronze"]],
      ["Lantern", "gear", ["brass", "iron and horn"]], ["Seal", "document", ["silver", "carved jade"]], ["Key", "key", ["iron", "bronze"]], ["Amulet", "jewellery", ["silver", "amber", "jet"]], ["Book", "book", ["vellum bound in calfskin"]], ["Chart", "document", ["vellum", "painted linen"]],
      ["Cup", "relic", ["pewter", "silver", "horn"]], ["Bell", "relic", ["bronze"]], ["Horn", "relic", ["ox horn bound in silver"]], ["Coin", "valuable", ["old gold", "clipped silver"]], ["Reliquary", "relic", ["gilt wood", "silver and crystal"]], ["Shield", "armour", ["oak and iron", "painted limewood"]]],
    old: [["Pocket watch", "personal", ["silver", "gunmetal"]], ["Revolver", "weapon", ["blued steel", "nickel"]], ["Cane", "personal", ["ebony and silver"]], ["Locket", "jewellery", ["gold", "silver"]], ["Letters", "document", ["cream paper, tied with ribbon"]], ["Photograph", "document", ["a glass plate", "an albumen print"]],
      ["Ledger", "book", ["red morocco"]], ["Key", "key", ["brass"]], ["Music box", "personal", ["rosewood"]], ["Figurine", "relic", ["green soapstone", "black basalt"]], ["Diary", "book", ["cracked leather"]]],
    modern: [["Phone", "device", ["a cracked case"]], ["Keycard", "key", ["white plastic"]], ["Drive", "device", ["a scratched thumb drive"]], ["Field recorder", "device", ["dented aluminium"]], ["Badge", "personal", ["a leather wallet"]], ["Notebook", "book", ["black card covers"]], ["Photograph", "document", ["a Polaroid"]], ["Ring", "jewellery", ["white gold"]]],
    future: [["Data shard", "device", ["cracked crystal"]], ["Sidearm", "weapon", ["ceramic", "matte alloy"]], ["Implant", "device", ["bioplastic"]], ["Access token", "key", ["a chipped plate"]], ["Field recorder", "device", ["a scorched casing"]], ["Beacon", "device", ["a sealed capsule"]], ["Relic", "relic", ["a material no lab can name"]], ["Suit seal", "armour", ["a worn helmet ring"]]]
  };
  KINDS["1920s"] = KINDS.old;
  const LOOKS = ["worn smooth where hands have held it", "with a name half filed away", "warmer than it should be", "lighter than it looks", "marked with a sign no one can read", "newer than its story says", "patched once, carefully", "smelling faintly of smoke", "wrapped in a strip of old cloth", "with a crest of a house nobody remembers"];
  const AGES_OF = { medieval: ["a few years old", "a lifetime old", "two centuries old", "older than the kingdom"], old: ["a few years old", "from the last century", "older than the house"], "1920s": ["a few years old", "from before the war", "older than the house"], modern: ["a few months old", "a few years old", "decades old"], future: ["a few years old", "from before the colony", "older than human spaceflight"] };
  function artifact(o) {
    o = o || {}; const a = ageOf(), magic = magicHere() && o.magic !== false && o.super !== false, wrd = !magic && weirdHere() && o.super !== false;
    const P = people(), F = factions(), E = events(), PL = pls();
    const tieP = o.person ? P.find(x => x.ref === o.person) : null, tieF = o.faction ? F.find(x => x.id === o.faction) : null;
    const p = tieP || (P.length ? pick(P) : null), f = tieF || (o.place && factionAt(o.place)) || (F.length ? pick(F) : null), e = (o.place && eventsAt(o.place)[0]) || (E.length ? pick(E) : null);
    const at = o.place || (PL.length ? pick(PL) : null);
    const kinds = o.cat ? KINDS[a].filter(k => k[1] === o.cat) : KINDS[a], [noun, cat, mats] = pick(kinds.length ? kinds : KINDS[a]), mat = pick(mats);
    const rar = o.rarity || (magic ? pick(["uncommon", "uncommon", "rare", "rare", "very rare"]) : pick(["uncommon", "rare", "rare"]));
    const cond = o.cond || pick(["worn", "good", "good", "worn", "broken"]);
    const owner = p && Math.random() < .5 ? p.name : null;
    const name = owner ? `${owner}'s ${noun}` : f && Math.random() < .5 ? `The ${noun} of ${low(f.n)}` : at ? `The ${noun} of ${low(placeName(at))}` : `The ${pick(["Grey", "Ashen", "Last", "Broken", "Quiet", "Drowned"])} ${noun}`;
    const look = `${cap(noun.toLowerCase())} of ${mat}, ${pick(LOOKS)}.`;
    const maker = f && Math.random() < .5 ? `made for ${f.n}` : pick(["by a craftsman whose mark is worn away", "by someone who knew what they were doing", "by hands no one remembers"]);
    const significance = [p ? `It belonged to ${p.name}${p.role ? `, ${low(p.role)}` : ""}.` : "", f ? `It bears the mark of ${f.n}${f.leader ? `; ${f.leader} would know it` : ""}.` : "", e ? `It turned up after ${low(e.title).replace(/\.$/, "")}.` : ""].filter(Boolean).slice(0, 2).join(" ");
    const wantF = F.filter(x => x !== f && x.wants), wantP = P.filter(x => x !== p && /want|seek|search/.test(x.text || ""));
    const wants = wantF.length ? (w => `${w.n}: ${low(w.wants).replace(/\.$/, "")}; this would help.`)(pick(wantF)) : f ? `${f.n}, to have it back.` : "";
    const rumours = [f ? `They say ${f.n} would pay well, and ask no questions.` : "", at ? `Someone at ${placeName(at)} swears it was never theirs to lose.` : "", "It is said to bring bad luck to whoever sells it."].filter(Boolean);
    const L = at ? placeName(at) : "the place it came from", Fn = f ? f.n : "those who made it", Pn = p ? p.name : "its last owner";
    let does, stats = "", src = "narrative";
    if (magic) { does = pick([`Glows faintly when anyone sworn to ${Fn} is near.`, `Grows cold in the presence of a lie.`, `Points, held loosely, toward ${L}.`, `Opens any door of ${L} it touches, once a day.`, `Turns aside the first blow struck at its bearer each day.`, `Whispers the name of someone who held it before, one a night.`]);
      if (game() === "dnd5") { stats = `${cap(rar)} wondrous item${rar !== "uncommon" ? ", requires attunement" : ""}; its power is in the secret.`; src = "homebrew"; } }
    else if (wrd) { does = pick([`Whoever keeps it dreams of ${L}, and wakes knowing a little more of it.`, `Clocks near it run slow.`, `Animals will not stay in a room with it.`, `It is never quite where it was left.`]); if (game() === "coc") { stats = "Seeing what it does may call for a Sanity roll: the Keeper decides the loss."; src = "homebrew"; } }
    else does = pick([`It proves what ${Fn} would rather nobody knew.`, `It opens the strongroom at ${L}.`, `It is the one thing that ties ${Pn} to what happened.`, `It is worth a pardon, or a fortune, to ${Fn}.`]);
    const base = particular({ n: name, cat, rarity: rar, cost: null, src }, { cond });
    return Object.assign(base, { unique: true, magic, desc: look, secret: does, stats, src,
      story: { made: mat, maker, age: pick(AGES_OF[a] || AGES_OF.medieval), origin: at ? placeName(at) : "", prev: p ? p.name : "", significance, faction: f ? f.n : "", rumours, wants },
      reveals: [{ text: f ? `The mark is that of ${f.n}.` : `Its maker's mark is a sign of ${pick(["an old guild", "a lost house", "a dead order"])}.`, shown: false }, { text: does, shown: false }],
      tie: [p && p.ref, f && "faction:" + f.id, at && "place:" + at].filter(Boolean), origin: at || "" });
  }

  /* ---- loot for a place: from what it is, who is there, whose ground, what happened; often little, sometimes nothing */
  function lootFor(id, o) {
    o = o || {}; const words = placeWords(id), P = profileOf(words), wealth = o.wealth != null ? o.wealth : wealthOf(words, P.w);
    if (o.n == null && P.empty && Math.random() < P.empty) return { items: [], coins: 0, why: `Nothing worth taking: ${placeName(id)} has been picked clean.` };
    const n = o.n != null ? o.n : Math.max(0, Math.round([1, 2, 3, 4][wealth] + Math.random() * 2 - .5)), cat = o.cat || null, out = [];
    const lib = catalogue({ cat, magic: o.super === true ? undefined : magicHere() && o.super !== false ? undefined : false, allAges: o.allAges });
    const rarCap = o.rarity ? RAR.indexOf(o.rarity) : Math.min(4, wealth + (o.super ? 1 : 0)), within = x => RAR.indexOf(x.rarity) <= Math.max(0, rarCap) && (!o.maxValue || (x.cost || 0) <= o.maxValue);
    const cats = Object.entries(P.cats);
    for (let i = 0; i < n; i++) {
      const c = cat || pickW(cats.map(([k, w]) => [k, k, 1, w]))[0], pool = lib.filter(x => x.cat === c && within(x) && (o.super !== true || x.magic || c === "relic"));
      const magicOk = magicHere() && o.super !== false, l = pool.filter(x => !x.magic || (magicOk && Math.random() < .25 + wealth * .1));
      const base = (l.length ? pick(l) : pool.length ? pick(pool) : null); if (!base) continue;
      out.push(particular(base));
    }
    // a thing of the place's own story, now and then: its kind's, or one tied to the campaign
    if ((o.n == null || o.story) && P.story.length && Math.random() < .45 + wealth * .1) { const sn = pick(P.story); out.push(Object.assign(particular({ n: sn, cat: catFor(sn), rarity: "uncommon", src: "narrative" }), { desc: "", secret: "", story: { origin: placeName(id) } })); }
    if (o.unique || (o.n == null && wealth >= 2 && Math.random() < .2)) out.push(artifact({ place: id, super: o.super }));
    const day = A.money ? Math.max(10, ...A.money.goods().filter(g => g.kind === "food").map(g => g.price)) * 4 : 100;
    const coins = o.noCoins ? 0 : Math.round(day * [0, .3, 1.2, 4][wealth] * Math.random());
    return { items: merge(out), coins, why: `${cap(P.k === "place" ? "what is" : "what a " + P.k + " holds")} at ${placeName(id)}${wealth === 0 ? ", poor" : wealth === 3 ? ", rich" : ""}${factionAt(id) ? `, on ${factionAt(id).n}'s ground` : ""}` };
  }

  /* ---- a person's things: their trade, wealth and faction; one of the cast may carry a thing of their own story */
  const TRADE = [
    [/soldier|guard|sergeant|watch(man)?|knight|captain|warrior|mercenar|marine|trooper/, { weapon: 3, armour: 2, food: 1, personal: 1, gear: 1 }],
    [/merchant|trader|shop|pedlar|peddler|chandler|guildmaster|factor|broker/, { trade: 3, valuable: 2, document: 2, container: 1, clothing: 1 }],
    [/noble|lord|lady|baron|duke|count|prince|princess|king|queen|heir/, { jewellery: 3, clothing: 2, document: 2, valuable: 2, weapon: 1 }],
    [/scientist|doctor|professor|scholar|researcher|engineer|alchemist|physician/, { tool: 3, book: 2, document: 2, device: 2, medicine: 1 }],
    [/cult|acolyte|priest|priestess|cleric|monk|nun|sexton|vicar|abbot/, { relic: 2, book: 2, personal: 2, jewellery: 1, consumable: 1 }],
    [/bandit|thief|cutpurse|smuggler|brigand|pirate|outlaw|footpad/, { weapon: 2, valuable: 2, tool: 1, personal: 2, document: 1 }],
    [/explorer|pilot|scout|ranger|hunter|spacer|prospector|surveyor/, { gear: 3, weapon: 1, food: 2, medicine: 1, device: 1 }],
    [/smith|carpenter|mason|tanner|cooper|wright|miller|baker|brewer/, { tool: 3, household: 2, personal: 1, trade: 1 }],
    [/wizard|mage|sorcer|witch|warlock|druid/, { book: 3, consumable: 2, relic: 1, personal: 1, tool: 1 }],
    [/innkeep|landlord|landlady|barkeep|cook|servant|maid|butler/, { household: 3, food: 2, personal: 2, key: 1 }],
    [/farmer|peasant|labourer|laborer|beggar|fisher|shepherd/, { household: 2, food: 2, tool: 2, personal: 1 }],
    [/sailor|fisherman|boatman|ferryman|captain of/, { gear: 2, weapon: 1, food: 1, personal: 2 }]
  ];
  function thingsOf(ref, o) {
    o = o || {}; const e = (A.story && A.story.ent ? A.story.ent(ref) : null) || people().find(x => x.ref === ref) || { name: ref, role: "", text: "" };
    const words = [e.name, e.role, e.sub, e.text].join(" ").toLowerCase(), cats = (TRADE.find(([re]) => re.test(words)) || [0, { personal: 3, household: 1, food: 1, valuable: 1 }])[1];
    const wealth = o.wealth != null ? o.wealth : wealthOf(words, 1), n = o.n != null ? o.n : 2 + wealth + Math.floor(Math.random() * 2), lib = catalogue({ magic: magicHere() && o.super !== false ? undefined : false, allAges: o.allAges }), out = [];
    const cl = Object.entries(cats).map(([k, w]) => [k, k, 1, w]);
    for (let i = 0; i < n; i++) {
      const c = o.cat || pickW(cl)[0], pool = lib.filter(x => x.cat === c && RAR.indexOf(x.rarity) <= wealth && (!x.magic || Math.random() < .15 * wealth));
      if (pool.length) out.push(particular(pick(pool)));
    }
    if (String(ref).startsWith("cast:") && (o.unique !== false) && Math.random() < .7) out.push(artifact({ person: ref, super: o.super, place: (e.places || [])[0] }));
    const day = A.money ? Math.max(10, ...A.money.goods().filter(g => g.kind === "food").map(g => g.price)) * 4 : 100;
    return { items: merge(out), coins: Math.round(day * [.05, .3, 1.5, 6][wealth] * (.5 + Math.random())), why: `${e.name}${e.role ? ", " + low(e.role) : ""}` };
  }

  /* ---- a shop's stock: the merchant's trade and the place: a village, a city, a mining town, a frontier post */
  function stockFor(m, o) {
    o = o || {}; const words = [m.n, (m.sells || []).join(" "), m.at ? placeWords(m.at) : ""].join(" ").toLowerCase();
    const size = /capital|city|grand|emporium|guild|bazaar/.test(words) ? 3 : /frontier|outpost|remote|wild|camp|station/.test(words) ? 0 : /village|hamlet|farm/.test(words) ? 1 : 2;
    const cats = new Set((m.sells || []).map(k => KIND_CAT[k] || k)); if (/mine|quarr/.test(words)) ["tool", "gear"].forEach(c => cats.add(c)); if (/village|farm|mill/.test(words)) ["tool", "food", "household"].forEach(c => cats.add(c)); if (size === 3) ["jewellery", "clothing", "valuable"].forEach(c => cats.add(c));
    const lib = catalogue({ magic: o.super ? undefined : false }).filter(x => !x.ordinary && x.cost && (!cats.size || cats.has(x.cat)) && RAR.indexOf(x.rarity) <= size), n = o.n || [4, 7, 10, 14][size], out = [], seen = new Set();
    for (let i = 0; i < n * 3 && out.length < n && lib.length; i++) { const b = pick(lib); if (seen.has(b.n)) continue; seen.add(b.n); out.push(Object.assign(particular(b, { cond: "good" }), { qty: b.rarity === "common" ? 1 + Math.floor(Math.random() * [2, 3, 5, 6][size]) : 1 })); }
    return { items: out, coins: 0, why: `${m.n || "A shop"}${m.at ? " at " + placeName(m.at) : ""}: ${["a frontier post's few things", "a village's", "a town's", "a city's wide choice"][size]}` };
  }

  /* ---- loot tables of the game master's own: weighted rows of a thing, a category or nothing */
  const tables = () => Object.entries((S() && S().get("loottables")) || {}).filter(([, t]) => t && t.n).map(([id, t]) => Object.assign({ id }, t));
  function rollTable(t, rolls) {
    const rows = (t.rows || []).filter(r => +r.w > 0), out = []; if (!rows.length) return { items: [], coins: 0, why: t.n };
    const lib = catalogue({ magic: t.mundane ? false : undefined });
    for (let i = 0; i < (rolls || +t.rolls || 1); i++) {
      const r = pickW(rows.map(x => [x, x, 1, +x.w]))[0], q = Math.max(1, +r.qty || 1);
      if (r.what === "nothing") continue;
      if (String(r.what).startsWith("cat:")) { const l = lib.filter(x => x.cat === r.what.slice(4)); if (l.length) out.push(Object.assign(particular(pick(l)), { qty: q })); continue; }
      if (String(r.what).startsWith("lib:")) { const x = S().get("stash", r.what.slice(4)); if (x) out.push(Object.assign({}, x, { qty: q, owner: undefined, copyOf: r.what.slice(4) })); continue; }
      const found = lib.find(x => x.n.toLowerCase() === String(r.what).toLowerCase());
      out.push(Object.assign(found ? particular(found) : particular({ n: String(r.what), cat: r.cat || "personal", rarity: "common", src: "homebrew", cost: A.money ? A.money.parse(r.value || 0) || null : null }), { qty: q }));
    }
    return { items: merge(out), coins: 0, why: t.n };
  }

  /* ---- the store */
  const all = () => Object.entries((S() && S().get("stash")) || {}).filter(([, x]) => x && x.n).map(([id, x]) => Object.assign({ id }, x));
  const ownerOf = x => x.owner || "party";
  const put = (x, owner) => { const id = uid(); const rec = Object.assign({}, x, { owner: owner || x.owner || "party", t: Date.now() }); delete rec.id; for (const k of Object.keys(rec)) if (rec[k] === undefined) delete rec[k]; S().set("stash", id, rec); return id; };
  const patch = (id, p) => { const x = S().get("stash", id); if (x) S().set("stash", id, Object.assign({}, x, p, { t: x.t || Date.now() })); };
  function ownerName(o) {
    o = o || "party";
    if (o === "party") return "The party"; if (o === "library") return "The item library";
    if (o.startsWith("pc:")) return ((A.pcsData || {})[o.slice(3)] || {}).n || "A player's character";
    if (o.startsWith("place:")) return placeName(o.slice(6));
    if (o.startsWith("merchant:")) { const m = A.money ? A.money.merchants().find(y => y.id === o.slice(9)) : null; return m ? (m.n || "A merchant") + "'s shop" : "A shop"; }
    if (o.startsWith("in:")) { const c = S().get("stash", o.slice(3)); return c ? "In " + low(c.n) : "In a container"; }
    const e = A.story && A.story.ent ? A.story.ent(o) : null; return e ? e.name : o;
  }
  function owners() {
    const out = [["party", "The party"], ["library", "The item library"]];
    for (const [id, pc] of Object.entries(A.pcsData || {})) if (pc && pc.n) out.push(["pc:" + id, pc.n + " (a player's character)"]);
    for (const p of people()) out.push([p.ref, p.name + (p.role ? ", " + low(p.role) : "")]);
    for (const id of pls()) out.push(["place:" + id, placeName(id)]);
    if (A.money) for (const m of A.money.merchants()) out.push(["merchant:" + m.id, (m.n || "A merchant") + "'s shop"]);
    for (const x of all()) if (x.cat === "container" || /chest|box|bag|case|trunk|strongbox|satchel|pack\b|crate|locker/i.test(x.n)) out.push(["in:" + x.id, "In " + low(x.n) + " (" + ownerName(ownerOf(x)) + ")"]);
    return out;
  }
  const SRC = { srd: "Official open rules", rulebook: "From your rulebook", names: "Named in the game; its statistics are in the book", campaign: "The campaign's own", homebrew: "Homebrew (Atlas's suggestion, not official)", narrative: "Narrative: no game statistics" };
  const srcLine = x => x.src === "srd" ? `${SRC.srd}: ${R.SRD}` : x.src === "names" ? `${SRC.names}${x.book ? ` (${x.book})` : ""}` : SRC[x.src] || SRC.narrative;

  /* ---- drawing */
  const money = v => A.money ? A.money.fmt(v) : String(v);
  const word = (L, k) => ((L || []).find(x => x[0] === k) || [0, k])[1];
  const meta = x => [x.rarity && x.rarity !== "common" ? cap(x.rarity) : "", x.quality && x.quality !== "plain" ? word(QUAL(), x.quality) : "", x.cond && x.cond !== "good" ? word(COND(), x.cond).toLowerCase() : "", x.magic ? "magic" : "", x.attune || "", x.value ? "worth " + money(x.value) : "", x.weight ? x.weight + " lb" : ""].filter(Boolean).join(" · ");
  const UI = { res: null, ctx: "place", place: "", person: "", merchant: "", n: "", cat: "", rar: "", sup: "", allAges: false, sel: "", own: "", q: "", edit: null, clueAsk: "", rb: false, lt: "", ltOpen: false };
  function propHTML(x, i) {
    return `<li class="it-row">${pic(x)}<div class="it-b"><b>${esc(x.n)}</b>${x.qty > 1 ? ` <span class="kn">×${x.qty}</span>` : ""} <span class="kn">${esc(catName(x.cat))}${meta(x) ? " · " + esc(meta(x)) : ""}</span>
      ${x.desc ? `<p class="it-d">${esc(x.desc)}</p>` : ""}${x.stats ? `<p class="it-st"><span class="it-src it-src-${esc(x.src)}" title="${esc(srcLine(x))}">${esc(x.src === "srd" ? "SRD" : x.src === "homebrew" ? "Homebrew" : x.src === "rulebook" ? "Your rules" : "")}</span> ${esc(x.stats)}</p>` : x.src === "names" ? `<p class="it-st kn">Statistics: in ${esc(x.book || "the rulebook")}.</p>` : ""}
      ${x.secret ? `<p class="it-sec"><span class="kl">Secret</span>${esc(x.secret)}</p>` : ""}${x.story && x.story.significance ? `<p class="kn">${esc(x.story.significance)}</p>` : ""}${x.offAge ? `<p class="warn">Out of this campaign's age (${esc(x.offAge)}): kept only because you allowed it.</p>` : ""}</div>
      <div class="it-acts"><button type="button" class="t-btn" data-it="pkeep" data-i="${i}">Keep</button><button type="button" class="t-link" data-it="pdrop" data-i="${i}">Leave it</button></div></li>`;
  }
  function resultHTML() {
    const r = UI.res; if (!r) return "";
    const dest = r.owner ? ownerName(r.owner) : "the item library";
    return `<div class="it-res"><p class="kn">${esc(r.why || "")}${r.coins ? ` · and ${esc(money(r.coins))} in coin` : ""}</p>
      ${r.items.length ? `<ul class="it-list">${r.items.map(propHTML).join("")}</ul>` : `<p>${esc(r.empty || "Nothing worth taking. (Not every place has loot: that is often the believable answer.)")}</p>`}
      <div class="t-row">${r.items.length || r.coins ? `<button type="button" class="t-btn prim" data-it="pall" title="Each is kept as a thing of ${esc(dest)}">Keep all for ${esc(dest)}</button><button type="button" class="t-btn" data-it="pparty">The party takes it all</button>` : ""}<button type="button" class="t-link" data-it="pclear">Clear</button></div></div>`;
  }
  const opt = (v, l, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`;
  function genHTML(quick) {
    const ms = A.money ? A.money.merchants() : [];
    return `<form class="it-gen" data-it="gen" onsubmit="return false">
      <div class="t-row"><select class="t-in" data-itf="ctx" aria-label="For what">${opt("place", "For a place", UI.ctx)}${opt("person", "A person's things", UI.ctx)}${ms.length ? opt("shop", "A shop's stock", UI.ctx) : ""}${opt("artifact", "A unique artifact", UI.ctx)}${opt("ordinary", "Ordinary objects", UI.ctx)}${tables().length ? opt("table", "From a loot table", UI.ctx) : ""}</select>
        ${UI.ctx === "person" ? `<select class="t-in" data-itf="person" aria-label="Whose">${people().map(p => opt(p.ref, p.name, UI.person)).join("")}</select>` : UI.ctx === "shop" ? `<select class="t-in" data-itf="merchant" aria-label="Which shop">${ms.map(m => opt(m.id, m.n || m.id, UI.merchant)).join("")}</select>` : UI.ctx === "table" ? `<select class="t-in" data-itf="lt" aria-label="Which table">${tables().map(t => opt(t.id, t.n, UI.lt)).join("")}</select>` : `<select class="t-in" data-itf="place" aria-label="Where">${UI.ctx === "artifact" ? opt("", "Tied to anywhere", UI.place) : ""}${pls().map(p => opt(p, placeName(p), UI.place)).join("")}</select>`}
        <button type="button" class="t-btn prim" data-it="go">${UI.ctx === "artifact" ? "Make it" : "Generate loot"}</button></div>
      ${quick ? "" : `<details class="it-more"><summary>More choices</summary><div class="t-row">
        <label class="t-small">How many <input class="t-in t-n" type="number" min="0" max="20" data-itf="n" value="${esc(UI.n)}" placeholder="as fits"></label>
        <select class="t-in" data-itf="cat" aria-label="Category">${opt("", "Any category", UI.cat)}${CATS.map(([k, l]) => opt(k, l, UI.cat)).join("")}</select>
        <select class="t-in" data-itf="rar" aria-label="Rarity">${opt("", "Rarity as fits", UI.rar)}${RAR.map(r => opt(r, cap(r), UI.rar)).join("")}</select>
        <select class="t-in" data-itf="sup" aria-label="Mundane or supernatural">${opt("", magicHere() ? "Magic as fits" : weirdHere() ? "The strange as fits" : "Mundane", UI.sup)}${opt("no", "Mundane only", UI.sup)}${magicHere() || weirdHere() ? opt("yes", magicHere() ? "Magical" : "Strange", UI.sup) : ""}</select>
        <label class="t-fogck"><input type="checkbox" data-itf="allAges"${UI.allAges ? " checked" : ""}> Allow things from other ages</label></div></details>`}</form>`;
  }
  function run() {
    const o = { n: UI.n === "" ? null : +UI.n, cat: UI.cat || null, rarity: UI.rar || null, super: UI.sup === "yes" ? true : UI.sup === "no" ? false : undefined, allAges: UI.allAges };
    let r;
    if (UI.ctx === "person") { const ref = UI.person || (people()[0] || {}).ref; if (!ref) return; r = thingsOf(ref, o); r.owner = ref; }
    else if (UI.ctx === "shop") { const m = (A.money ? A.money.merchants() : []).find(y => y.id === UI.merchant) || (A.money ? A.money.merchants()[0] : null); if (!m) return; r = stockFor(m, o); r.owner = "merchant:" + m.id; }
    else if (UI.ctx === "artifact") { const x = artifact({ place: UI.place || null, cat: o.cat, rarity: o.rarity, super: o.super }); r = { items: [x], coins: 0, why: "A thing of this campaign's own story" }; r.owner = UI.place ? "place:" + UI.place : "library"; }
    else if (UI.ctx === "ordinary") { const id = UI.place || pls()[0], O = ordOf(ageOf()), l = [].concat(O.household, O.personal), n = o.n || 5, out = []; for (let i = 0; i < n; i++) out.push(particular({ n: pick(l), cat: "household", rarity: "common", src: "narrative", ordinary: true })); r = { items: out, coins: 0, why: "Ordinary things, for the room" }; r.owner = id ? "place:" + id : "library"; }
    else if (UI.ctx === "table") { const t = tables().find(x => x.id === UI.lt) || tables()[0]; if (!t) return; r = rollTable(t, o.n || null); r.owner = UI.place ? "place:" + UI.place : "library"; }
    else { const id = UI.place || pls()[0]; if (!id) return; r = lootFor(id, o); r.owner = "place:" + id; }
    UI.res = r;
  }

  /* ---- the Items tab: the store, by owner; the editor; generate; the rulebook's own items; loot tables */
  function listHTML() {
    const q = UI.q.toLowerCase(), L = all().filter(x => (!UI.own || ownerOf(x) === UI.own) && (!q || [x.n, x.desc, catName(x.cat)].join(" ").toLowerCase().includes(q))).sort((a, b) => (b.t || 0) - (a.t || 0));
    const used = [...new Set(all().map(ownerOf))];
    return `<div class="t-row"><input class="t-in" type="search" data-itf="q" value="${esc(UI.q)}" placeholder="Find a thing" aria-label="Find a thing"><select class="t-in" data-itf="own" aria-label="Whose">${opt("", "Everyone's", UI.own)}${used.map(o => opt(o, ownerName(o), UI.own)).join("")}</select><button type="button" class="t-btn" data-it="new">+ A thing of your own</button></div>
      ${L.length ? `<ul class="it-list it-lib">${L.map(x => `<li class="it-row${UI.sel === x.id ? " on" : ""}">${pic(x)}<button type="button" class="it-b it-pick" data-it="sel" data-id="${esc(x.id)}"><b>${esc(x.n)}</b>${x.qty > 1 ? ` ×${x.qty}` : ""} <span class="kn">${esc(ownerName(ownerOf(x)))}${x.role && x.role !== "loot" ? " · " + esc(x.role) : ""}${x.equipped ? " · equipped" : ""}</span></button></li>`).join("")}</ul>` : `<p class="kn">${all().length ? "Nothing matches." : "No things yet: generate some, or make one of your own."}</p>`}`;
  }
  function editHTML() {
    const id = UI.sel, x = id ? S().get("stash", id) : UI.edit; if (!x) return "";
    const st = x.story || {}, rv = x.reveals || [];
    const f = (k, l, v, ph, ta) => ta ? `<label class="it-f"><span>${l}</span><textarea class="t-in" name="${k}" rows="2" placeholder="${esc(ph || "")}">${esc(v || "")}</textarea></label>` : `<label class="it-f"><span>${l}</span><input class="t-in" name="${k}" value="${esc(v == null ? "" : v)}" placeholder="${esc(ph || "")}"></label>`;
    return `<form class="it-ed" data-it="save" data-id="${esc(id || "")}">
      <div class="it-edh">${pic(x)}<h4>${esc(x.n || "A new thing")}</h4></div>
      <div class="it-g2">${f("n", "Name", x.n, "The Ashen King's Signet")}<label class="it-f"><span>Category</span><select class="t-in" name="cat">${CATS.map(([k, l]) => opt(k, l, x.cat || "personal")).join("")}</select></label>
        <label class="it-f"><span>Whose, or where</span><select class="t-in" name="owner">${owners().filter(([o]) => o !== "in:" + id).map(([o, l]) => opt(o, l, ownerOf(x))).join("")}</select></label>${f("qty", "How many", x.qty || 1)}
        <label class="it-f"><span>Rarity</span><select class="t-in" name="rarity">${RAR.map(r => opt(r, cap(r), x.rarity || "common")).join("")}</select></label>
        <label class="it-f"><span>Quality</span><select class="t-in" name="quality">${QUAL().map(q => opt(q[0], q[1], x.quality || "plain")).join("")}</select></label>
        <label class="it-f"><span>Condition</span><select class="t-in" name="cond">${COND().map(c => opt(c[0], c[1], x.cond || "good")).join("")}</select></label>
        ${f("value", "Worth", x.value ? money(x.value) : "", money(1000))}${f("weight", "Weight (lb, if it matters)", x.weight)}
        <label class="it-f"><span>What it is in the story</span><select class="t-in" name="role">${opt("loot", "Ordinary loot", x.role)}${opt("plot", "An important plot object", x.role)}${opt("clue", "A clue", x.role)}</select></label>
        <label class="t-fogck"><input type="checkbox" name="equipped"${x.equipped ? " checked" : ""}> Worn or carried ready</label><label class="t-fogck"><input type="checkbox" name="magic"${x.magic ? " checked" : ""}> ${magicHere() ? "Magical" : "Supernatural"}</label></div>
      ${f("desc", "What the players see", x.desc, "An old silver medallion with an unfamiliar symbol.", 1)}
      ${f("secret", "Your secret (never shown to the players)", x.secret, "What it really is, or does.", 1)}
      <div class="it-g2"><label class="it-f"><span>Its statistics come from</span><select class="t-in" name="src">${Object.entries(SRC).map(([k, l]) => opt(k, l, x.src || "narrative")).join("")}</select></label>${f("attune", "Attunement or requirements", x.attune, game() === "dnd5" ? "requires attunement" : "")}</div>
      ${f("stats", "Game statistics", x.stats, game() === "dnd5" ? "1d8 slashing · versatile (1d10)" : game() === "mothership" ? "Damage, shots, special (from the Player's Survival Guide)" : "As your game writes them", 1)}
      ${x.src === "srd" ? `<p class="t-small kn">${esc(R.SRD)}. The rulebook holds the full text.</p>` : ""}
      ${f("img", "A picture (a link, or leave empty for its small drawing)", x.img, "https://…")}
      <details class="it-more"${st.significance || st.maker ? " open" : ""}><summary>Its history</summary><div class="it-g2">${f("s_made", "Made of", st.made)}${f("s_maker", "Maker", st.maker)}${f("s_age", "How old", st.age)}${f("s_origin", "From", st.origin)}${f("s_prev", "Owned before by", st.prev)}${f("s_faction", "Its faction", st.faction)}</div>
        ${f("s_significance", "Why it matters", st.significance, "", 1)}${f("s_wants", "Who wants it", st.wants, "", 1)}${f("s_rumours", "Rumours (one a line)", (st.rumours || []).join("\n"), "", 1)}</details>
      <h5 class="it-h5">Found out later</h5><p class="t-small">Facts the players learn as they look into it. Each is yours until you tell them.</p>
      <ul class="it-rv">${rv.map((r, i) => `<li class="${r.shown ? "done" : ""}">${esc(r.text)} ${id ? (r.shown ? `<span class="kn">they know</span>` : `<button type="button" class="t-link" data-it="reveal" data-id="${esc(id)}" data-i="${i}">Tell the players</button>`) : ""}</li>`).join("")}</ul>
      ${f("newreveal", "A fact to find out later", "", "The symbol belongs to an extinct religious order.")}
      <div class="t-row"><button type="submit" class="t-btn prim">Save</button>${id ? `<button type="button" class="t-btn" data-it="show" data-id="${esc(id)}" title="Its name, what they see, and what has been revealed: never your secret">Show the players</button>
        <button type="button" class="t-btn" data-it="use" data-id="${esc(id)}">${x.qty > 1 ? "Use one" : "Used up"}</button><button type="button" class="t-btn" data-it="clue" data-id="${esc(id)}">Make it a clue…</button>
        <button type="button" class="t-btn" data-it="copy" data-id="${esc(id)}" title="Keep a copy in the item library, to give out again">Copy to the library</button><button type="button" class="t-link" data-it="del" data-id="${esc(id)}">Destroyed: take it away</button>` : `<button type="button" class="t-link" data-it="cancel">Cancel</button>`}</div>
      ${UI.clueAsk === id && id ? clueAskHTML(id, x) : ""}</form>`;
  }
  function clueAskHTML(id, x) {
    const pl = (String(ownerOf(x)).startsWith("place:") ? ownerOf(x).slice(6) : x.origin) || UI.place || pls()[0];
    return `<div class="it-clue warnbox"><p>Add <b>${esc(x.n)}</b> as a clue at <select class="t-in" data-itf="cluepl">${pls().map(p => opt(p, placeName(p), pl)).join("")}</select>? It joins the investigation (logged, and undoable there). Nothing about the mystery changes unless you write it.</p>
      <div class="t-row"><button type="button" class="t-btn prim" data-it="clueyes" data-id="${esc(id)}">Add the clue</button><button type="button" class="t-link" data-it="clueno">Not now</button></div></div>`;
  }
  function rulebookHTML() {
    const L = Object.entries((S() && S().get("rulebook")) || {}).filter(([, x]) => x && x.n), g = game(), N = R.NAMES[g];
    return `<details class="it-more"${UI.rb ? " open" : ""} data-it="rbfold"><summary>Your game's own items (${L.length})</summary>
      <p class="t-small">${g === "dnd5" ? `Atlas has the D&D 5e items of the ${esc(R.SRD)}. Add the others your table uses from your books.` : N ? `Atlas knows the names of ${esc(N.name)}'s equipment but not its statistics, which are in ${esc(N.book)}. Write them here from your book and they come first in everything generated.` : `Write your game's items here from your books, and they come first in everything generated.`} One a line: <i>name | category | cost | statistics | weight | rarity</i>.</p>
      <form data-it="rbadd"><textarea class="t-in" name="lines" rows="3" placeholder="${g === "mothership" ? "Pulse rifle | weapon | 2400 | 3d10 damage, 5 shots | | common" : "Longsword +1 | weapon | 1000 gp | 1d8+1 slashing | 3 | uncommon"}"></textarea><div class="t-row"><button type="submit" class="t-btn">Add them</button></div></form>
      ${L.length ? `<ul class="it-list">${L.map(([id, x]) => `<li class="it-row">${pic(x)}<div class="it-b"><b>${esc(x.n)}</b> <span class="kn">${esc(catName(x.cat))}${x.cost ? " · " + esc(money(x.cost)) : ""}</span>${x.stats ? `<p class="it-st">${esc(x.stats)}</p>` : ""}</div><button type="button" class="t-link" data-it="rbdel" data-id="${esc(id)}">Remove</button></li>`).join("")}</ul>` : ""}</details>`;
  }
  function tablesHTML() {
    const L = tables();
    return `<details class="it-more"${UI.ltOpen ? " open" : ""} data-it="ltfold"><summary>Loot tables (${L.length})</summary>
      <p class="t-small">Your own tables, to roll again and again: a village household, a bandit's purse, an ancient tomb. Each row is a thing (by name), a category (cat:weapon), a thing in the library, or nothing; the weight is how likely.</p>
      ${L.map(t => `<div class="it-lt"><b>${esc(t.n)}</b> <span class="kn">${(t.rows || []).length} rows · ${t.rolls || 1} roll${(t.rolls || 1) > 1 ? "s" : ""}</span> <button type="button" class="t-btn" data-it="ltroll" data-id="${esc(t.id)}">Roll</button> <button type="button" class="t-link" data-it="ltdel" data-id="${esc(t.id)}">Remove</button>
        <ul class="t-small">${(t.rows || []).map(r => `<li>${esc(r.w)} × ${esc(r.what === "nothing" ? "nothing" : r.what)}${+r.qty > 1 ? " (" + r.qty + ")" : ""}</li>`).join("")}</ul></div>`).join("")}
      <form data-it="ltadd"><input class="t-in" name="n" required maxlength="80" placeholder="A bandit's purse" aria-label="The table's name"><input class="t-in t-n" type="number" name="rolls" min="1" max="12" value="2" aria-label="How many rolls">
        <textarea class="t-in" name="rows" rows="4" placeholder="3 | cat:weapon&#10;4 | A few copper coins&#10;1 | A letter mentioning another hideout&#10;2 | nothing"></textarea><label class="t-fogck"><input type="checkbox" name="mundane"> Mundane only</label><div class="t-row"><button type="submit" class="t-btn">Save the table</button></div></form></details>`;
  }
  function html() {
    const g = game();
    return `<div class="t-grid t-g2w"><div>
      <section class="t-card"><h3>${glyph("valuable", "ic")} Generate</h3><p class="t-small">From this campaign: ${esc(ruleName() ? ruleName() + "'s items" : "its age's things")}${g && g !== "dnd5" && R.NAMES[g] ? " (their names; statistics from your book)" : ""}, its places, people, factions and story. Proposals only: nothing is added until you keep it.</p>
        ${genHTML(false)}${resultHTML()}</section>
      <section class="t-card">${rulebookHTML()}${tablesHTML()}</section></div>
      <div><section class="t-card"><h3>${glyph("container", "ic")} The campaign's things</h3>${listHTML()}</section>${UI.sel || UI.edit ? `<section class="t-card">${editHTML()}</section>` : ""}</div></div>`;
  }

  /* ---- the card on Make it up: the quick way during a session */
  TU.addCard("make", () => A.modules && !A.modules.on("makeup", "on") ? "" : `<section class="t-card it-quick"><h3>${glyph("valuable", "ic")} Loot and things, now</h3>${genHTML(true)}${resultHTML()}<p class="t-small"><button type="button" class="t-link" data-t="tab" data-tab="items">All the campaign's things</button></p></section>`);

  /* ---- a place's page: what is there, and Generate loot here */
  TU.addDossier && TU.addDossier(p => {
    if (A.state && A.state.mode === "player") return "";
    const here = all().filter(x => ownerOf(x) === "place:" + p.id);
    return `<section class="sec keeper it-here"><h3>Things here</h3>${here.length ? `<ul class="it-list">${here.map(x => `<li class="it-row">${pic(x)}<div class="it-b"><b>${esc(x.n)}</b>${x.qty > 1 ? " ×" + x.qty : ""} <span class="kn">${esc(meta(x))}</span>${x.desc ? `<p class="it-d">${esc(x.desc)}</p>` : ""}</div><div class="it-acts"><button type="button" class="t-btn" data-it="take" data-id="${esc(x.id)}">The party takes it</button></div></li>`).join("")}</ul>` : `<p class="kn sec-none">Nothing kept here yet.</p>`}
      <div class="t-row ed-only"><button type="button" class="t-btn" data-it="here" data-pl="${esc(p.id)}">Generate loot here</button></div>${UI.res && UI.res.owner === "place:" + p.id ? resultHTML() : ""}</section>`;
  });
  // a person's card: what they carry
  function personHTML(ref) {
    const mine = all().filter(x => ownerOf(x) === ref);
    return `<div class="it-person"><span class="kl">Carries</span>${mine.length ? mine.map(x => `<span class="it-chip">${esc(x.n)}${x.qty > 1 ? " ×" + x.qty : ""}</span>`).join(" ") : `<span class="kn">nothing kept yet</span>`} <button type="button" class="t-link" data-it="theirs" data-ref="${esc(ref)}">Their things…</button>${UI.res && UI.res.owner === ref ? resultHTML() : ""}</div>`;
  }

  /* ---- what the game master does */
  const paint = () => { if (api.tab() === "items" || api.tab() === "make") api.render(); else if (A.renderDossier) A.renderDossier(); else document.dispatchEvent(new CustomEvent("atlas-places")); };
  function keepOne(x, owner) { const rec = Object.assign({}, x); delete rec.copyOf; return put(rec, owner); }
  function showToPlayers(x) {
    const known = (x.reveals || []).filter(r => r.shown).map(r => r.text);
    api.show && api.show({ kind: "handout", id: "item-" + (x.id || uid()), h: { id: "item-" + (x.id || uid()), title: x.n, kind: "note", text: [x.desc || `${catName(x.cat)}.`, ...known].join("\n\n") } });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-it]"); if (!b || ["FORM", "SELECT", "INPUT", "TEXTAREA", "DETAILS"].includes(b.tagName)) return;
    const k = b.dataset.it, id = b.dataset.id, st = S(); if (!st) return;
    const r = UI.res, i = +b.dataset.i;
    switch (k) {
      case "go": run(); break;
      case "here": UI.ctx = "place"; UI.place = b.dataset.pl; UI.res = Object.assign(lootFor(b.dataset.pl, {}), { owner: "place:" + b.dataset.pl }); break;
      case "theirs": UI.res = Object.assign(thingsOf(b.dataset.ref, {}), { owner: b.dataset.ref }); break;
      case "pkeep": if (r && r.items[i]) { keepOne(r.items[i], r.owner || "library"); r.items.splice(i, 1); api.note && api.note("Kept."); } break;
      case "pdrop": if (r) r.items.splice(i, 1); break;
      case "pall": if (r) { for (const x of r.items) keepOne(x, r.owner || "library"); if (r.coins && r.owner && r.owner !== "party") put({ n: money(r.coins) + " in coin", cat: "valuable", value: r.coins, rarity: "common", src: "narrative" }, r.owner); UI.res = null; api.note && api.note("Kept: each is a thing of " + (r.owner ? ownerName(r.owner) : "the library") + "."); } break;
      case "pparty": if (r) { for (const x of r.items) keepOne(x, "party"); if (r.coins && A.money) A.money.spend(r.coins, "Loot"); if (A.history && r.items.length) A.history.add({ kind: "loot", title: "Found: " + r.items.map(x => low(x.n)).join(", ") }); UI.res = null; api.note && api.note("The party has it."); } break;
      case "pclear": UI.res = null; break;
      case "take": patch(id, { owner: "party" }); api.note && api.note("The party has it."); break;
      case "sel": UI.sel = UI.sel === id ? "" : id; UI.edit = null; UI.clueAsk = ""; break;
      case "new": UI.sel = ""; UI.edit = { n: "", cat: "personal", owner: UI.own || "library", rarity: "common", quality: "plain", cond: "good", qty: 1, src: "homebrew", reveals: [] }; break;
      case "cancel": UI.edit = null; break;
      case "reveal": { const x = st.get("stash", id); if (!x) return; const rv = (x.reveals || []).slice(); if (rv[i]) rv[i] = Object.assign({}, rv[i], { shown: true }); patch(id, { reveals: rv }); showToPlayers(Object.assign({ id }, x, { reveals: rv })); break; }
      case "show": { const x = st.get("stash", id); if (x) showToPlayers(Object.assign({ id }, x)); return; }
      case "use": { const x = st.get("stash", id); if (!x) return; if ((x.qty || 1) > 1) patch(id, { qty: x.qty - 1 }); else { st.set("stash", id, null); UI.sel = ""; } break; }
      case "del": st.set("stash", id, null); UI.sel = ""; break;
      case "copy": { const x = st.get("stash", id); if (x) { put(Object.assign({}, x, { equipped: false }), "library"); api.note && api.note("A copy is in the item library."); } break; }
      case "clue": UI.clueAsk = id; break;
      case "clueno": UI.clueAsk = ""; break;
      case "clueyes": {
        const x = st.get("stash", id), sel = document.querySelector("[data-itf='cluepl']"), pl = sel ? sel.value : null, St = A.story;
        if (!x || !pl || !St || !St.putClue || !St.nextClueId) { api.note && api.note("The investigation is not open on this page."); return; }
        const cid = St.nextClueId(pl); St.putClue(pl, cid, { t: x.n, k: "physical", d: x.desc || "", text: [x.desc, x.secret].filter(Boolean).join(" "), item: id }, { note: "made from a thing" });
        patch(id, { role: "clue", clue: pl + "/" + cid }); UI.clueAsk = ""; api.note && api.note(`A clue at ${placeName(pl)}: ${x.n}.`); break;
      }
      case "rbdel": st.set("rulebook", id, null); break;
      case "ltroll": { const t = tables().find(x => x.id === id); if (t) { UI.res = Object.assign(rollTable(t), { owner: UI.place ? "place:" + UI.place : "library" }); } break; }
      case "ltdel": st.set("loottables", id, null); break;
      default: return;
    }
    paint();
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || t.dataset.itf == null) return;
    const k = t.dataset.itf; if (k === "cluepl") return;
    UI[k] = t.type === "checkbox" ? t.checked : t.value;
    if (k === "ctx" || k === "own") { if (k === "ctx") UI.res = null; paint(); }
  });
  document.addEventListener("input", e => { const t = e.target; if (t.dataset && t.dataset.itf === "q") { UI.q = t.value; const box = document.querySelector(".it-lib"); if (box) paintSoon(); } });
  let pt = 0; const paintSoon = () => { clearTimeout(pt); pt = setTimeout(() => { const f = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.itf === "q"; paint(); if (f) { const q = document.querySelector("[data-itf='q']"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } } }, 250); };
  document.addEventListener("toggle", e => { const d = e.target; if (!d.dataset) return; if (d.dataset.it === "rbfold") UI.rb = d.open; if (d.dataset.it === "ltfold") UI.ltOpen = d.open; }, true);
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !["save", "rbadd", "ltadd"].includes(f.dataset.it)) return; e.preventDefault();
    const g = n => String((f.elements[n] || {}).value || "").trim(), st = S();
    if (f.dataset.it === "save") {
      const id = f.dataset.id, x = id ? st.get("stash", id) || {} : UI.edit || {};
      const rv = (x.reveals || []).slice(); if (g("newreveal")) rv.push({ text: g("newreveal").slice(0, 400), shown: false });
      const rec = Object.assign({}, x, { n: g("n").slice(0, 120) || "A thing", cat: g("cat"), owner: g("owner") || "library", qty: Math.max(1, Math.round(+g("qty") || 1)), rarity: g("rarity"), quality: g("quality"), cond: g("cond"),
        value: A.money ? A.money.parse(g("value")) : +g("value") || 0, weight: g("weight") ? +g("weight") : undefined, role: g("role"), equipped: !!(f.elements.equipped || {}).checked, magic: !!(f.elements.magic || {}).checked,
        desc: g("desc").slice(0, 1200), secret: g("secret").slice(0, 1200), src: g("src"), attune: g("attune").slice(0, 120), stats: g("stats").slice(0, 600), img: /^(https?:|data:image\/)/.test(g("img")) ? g("img").slice(0, 300000) : "",
        story: { made: g("s_made"), maker: g("s_maker"), age: g("s_age"), origin: g("s_origin"), prev: g("s_prev"), faction: g("s_faction"), significance: g("s_significance"), wants: g("s_wants"), rumours: g("s_rumours").split("\n").map(s => s.trim()).filter(Boolean) }, reveals: rv });
      if (rec.owner === "in:" + id) rec.owner = x.owner || "library";
      for (const kk of Object.keys(rec)) if (rec[kk] === undefined) delete rec[kk];
      if (id) st.set("stash", id, Object.assign(rec, { t: x.t || Date.now() })); else { UI.sel = put(rec, rec.owner); UI.edit = null; }
      api.note && api.note("Saved.");
    } else if (f.dataset.it === "rbadd") {
      for (const line of g("lines").split("\n").map(s => s.trim()).filter(Boolean)) {
        const [n, cat, cost, stats, w, rar] = line.split("|").map(s => (s || "").trim()); if (!n) continue;
        const c = (CATS.find(x => x[0] === (cat || "").toLowerCase() || x[1].toLowerCase().startsWith((cat || "").toLowerCase())) || ["gear"])[0];
        st.set("rulebook", "r" + uid(), { n: n.slice(0, 120), cat: c, cost: cost ? (A.money ? A.money.parse(cost) : +cost) : null, stats: (stats || "").slice(0, 400), weight: w ? +w : undefined, rarity: RAR.includes((rar || "").toLowerCase()) ? rar.toLowerCase() : "common", t: Date.now() });
      }
      UI.rb = true;
    } else {
      const rows = g("rows").split("\n").map(s => s.trim()).filter(Boolean).map(l => { const [w, what, qty] = l.split("|").map(s => (s || "").trim()); return { w: Math.max(0, +w || 1), what: (what || "nothing").slice(0, 120), qty: Math.max(1, +qty || 1) }; });
      if (!g("n") || !rows.length) return;
      st.set("loottables", "lt" + uid(), { n: g("n").slice(0, 80), rolls: Math.max(1, Math.min(12, +g("rolls") || 1)), rows, mundane: !!(f.elements.mundane || {}).checked, t: Date.now() }); UI.ltOpen = true;
    }
    paint();
  });

  TU.addTab({ key: "items", label: "Items and loot", icon: "coin", group: "prep", after: "money", desc: "Every thing of the campaign: loot for a place, a person's things, a shop's stock, unique artifacts, your game's own items, loot tables",
    html, status: () => { const n = all().length; return n ? `${n} thing${n > 1 ? "s" : ""}` : "Loot, things, artifacts"; },
    init(store) { for (const c of ["stash", "rulebook", "loottables"]) store.watch(c, () => { if (api.tab() === "items") api.render(); }); } });

  // (for the Copilot, atlas-copilot.js, and the tests)
  A.items = { lootFor, thingsOf, stockFor, artifact, rollTable, catalogue, all, put, patch, ownerName, personHTML, game, ageOf, magicHere, CATS, propose: r => { UI.res = r; paint(); }, particular };
})(typeof ATLAS !== "undefined" ? ATLAS : this.ATLAS);
