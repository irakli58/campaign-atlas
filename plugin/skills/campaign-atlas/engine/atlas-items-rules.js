/* The rulesets' own items (the item and loot system, 18 Nov 2026; the user: "everything should be rpg rule set / game
   specific … if its dnd use dnd items if its mothership use mothership items, but let the player make their own too").
   Where a game's rules are open, its items come with their statistics and the credit the licence asks for:
   - D&D 5e: the System Reference Document 5.1, by Wizards of the Coast LLC, under CC-BY-4.0. Its weapons, armour, gear
     and tools are given with their cost, weight and statistics; its magic items with rarity and attunement and a short
     summary in Atlas's own words, the rulebook being the full text.
   Where a game's rules are not open, only its equipment's names are known here (a Mothership game finds a vaccsuit, not
   a sword). Nothing of its rules or statistics is copied: each item says where its statistics are, and the game master
   writes them in. The game master's own list (collection "rulebook", written in the Items tab) always comes first.
   Every item says where its statistics come from: "srd" (an open rules text, credited), "rulebook" (the game master's,
   from their book), "homebrew" or "narrative". Nothing made up is ever marked as official. */
(function (A) {
  "use strict";
  const SRD = "System Reference Document 5.1 (Wizards of the Coast LLC, CC-BY-4.0)";
  const gp = n => Math.round(n * 100), sp = n => n * 10, cp = n => n;
  // [name, category, cost in copper, weight in lb, statistics, rarity]
  const W = (n, c, w, s) => [n, "weapon", c, w, s];
  const DND5 = {
    name: "Dungeons & Dragons 5e", source: SRD, open: true, money: "gp",
    items: [
      // simple melee weapons
      W("Club", sp(1), 2, "1d4 bludgeoning · light"), W("Dagger", gp(2), 1, "1d4 piercing · finesse, light, thrown (20/60)"), W("Greatclub", sp(2), 10, "1d8 bludgeoning · two-handed"),
      W("Handaxe", gp(5), 2, "1d6 slashing · light, thrown (20/60)"), W("Javelin", sp(5), 2, "1d6 piercing · thrown (30/120)"), W("Light hammer", gp(2), 2, "1d4 bludgeoning · light, thrown (20/60)"),
      W("Mace", gp(5), 4, "1d6 bludgeoning"), W("Quarterstaff", sp(2), 4, "1d6 bludgeoning · versatile (1d8)"), W("Sickle", gp(1), 2, "1d4 slashing · light"), W("Spear", gp(1), 3, "1d6 piercing · thrown (20/60), versatile (1d8)"),
      // simple ranged
      W("Light crossbow", gp(25), 5, "1d8 piercing · ammunition (80/320), loading, two-handed"), W("Dart", cp(5), .25, "1d4 piercing · finesse, thrown (20/60)"), W("Shortbow", gp(25), 2, "1d6 piercing · ammunition (80/320), two-handed"), W("Sling", sp(1), 0, "1d4 bludgeoning · ammunition (30/120)"),
      // martial melee
      W("Battleaxe", gp(10), 4, "1d8 slashing · versatile (1d10)"), W("Flail", gp(10), 2, "1d8 bludgeoning"), W("Glaive", gp(20), 6, "1d10 slashing · heavy, reach, two-handed"), W("Greataxe", gp(30), 7, "1d12 slashing · heavy, two-handed"),
      W("Greatsword", gp(50), 6, "2d6 slashing · heavy, two-handed"), W("Halberd", gp(20), 6, "1d10 slashing · heavy, reach, two-handed"), W("Lance", gp(10), 6, "1d12 piercing · reach, special"), W("Longsword", gp(15), 3, "1d8 slashing · versatile (1d10)"),
      W("Maul", gp(10), 10, "2d6 bludgeoning · heavy, two-handed"), W("Morningstar", gp(15), 4, "1d8 piercing"), W("Pike", gp(5), 18, "1d10 piercing · heavy, reach, two-handed"), W("Rapier", gp(25), 2, "1d8 piercing · finesse"),
      W("Scimitar", gp(25), 3, "1d6 slashing · finesse, light"), W("Shortsword", gp(10), 2, "1d6 piercing · finesse, light"), W("Trident", gp(5), 4, "1d6 piercing · thrown (20/60), versatile (1d8)"), W("War pick", gp(5), 2, "1d8 piercing"),
      W("Warhammer", gp(15), 2, "1d8 bludgeoning · versatile (1d10)"), W("Whip", gp(2), 3, "1d4 slashing · finesse, reach"),
      // martial ranged
      W("Blowgun", gp(10), 1, "1 piercing · ammunition (25/100), loading"), W("Hand crossbow", gp(75), 3, "1d6 piercing · ammunition (30/120), light, loading"), W("Heavy crossbow", gp(50), 18, "1d10 piercing · ammunition (100/400), heavy, loading, two-handed"),
      W("Longbow", gp(50), 2, "1d8 piercing · ammunition (150/600), heavy, two-handed"), W("Net", gp(1), 3, "special, thrown (5/15)"),
      // armour
      ["Padded armor", "armour", gp(5), 8, "Light · AC 11 + Dex · Stealth disadvantage"], ["Leather armor", "armour", gp(10), 10, "Light · AC 11 + Dex"], ["Studded leather armor", "armour", gp(45), 13, "Light · AC 12 + Dex"],
      ["Hide armor", "armour", gp(10), 12, "Medium · AC 12 + Dex (max 2)"], ["Chain shirt", "armour", gp(50), 20, "Medium · AC 13 + Dex (max 2)"], ["Scale mail", "armour", gp(50), 45, "Medium · AC 14 + Dex (max 2) · Stealth disadvantage"],
      ["Breastplate", "armour", gp(400), 20, "Medium · AC 14 + Dex (max 2)"], ["Half plate", "armour", gp(750), 40, "Medium · AC 15 + Dex (max 2) · Stealth disadvantage"], ["Ring mail", "armour", gp(30), 40, "Heavy · AC 14 · Stealth disadvantage"],
      ["Chain mail", "armour", gp(75), 55, "Heavy · AC 16 · Str 13 · Stealth disadvantage"], ["Splint armor", "armour", gp(200), 60, "Heavy · AC 17 · Str 15 · Stealth disadvantage"], ["Plate armor", "armour", gp(1500), 65, "Heavy · AC 18 · Str 15 · Stealth disadvantage"],
      ["Shield", "armour", gp(10), 6, "+2 AC"],
      // ammunition
      ["Arrows (20)", "ammo", gp(1), 1, ""], ["Crossbow bolts (20)", "ammo", gp(1), 1.5, ""], ["Sling bullets (20)", "ammo", cp(4), 1.5, ""], ["Blowgun needles (50)", "ammo", gp(1), 1, ""],
      // adventuring gear
      ["Backpack", "gear", gp(2), 5, ""], ["Bedroll", "gear", gp(1), 7, ""], ["Blanket", "gear", sp(5), 3, ""], ["Candle", "gear", cp(1), 0, ""], ["Caltrops (bag of 20)", "gear", gp(1), 2, ""], ["Chain (10 feet)", "gear", gp(5), 10, ""],
      ["Climber's kit", "gear", gp(25), 12, ""], ["Crowbar", "gear", gp(2), 5, ""], ["Grappling hook", "gear", gp(2), 4, ""], ["Hammer", "gear", gp(1), 3, ""], ["Hunting trap", "gear", gp(5), 25, ""], ["Lamp", "gear", sp(5), 1, ""],
      ["Lantern, bullseye", "gear", gp(10), 2, ""], ["Lantern, hooded", "gear", gp(5), 2, ""], ["Lock", "gear", gp(10), 1, ""], ["Manacles", "gear", gp(2), 6, ""], ["Mirror, steel", "gear", gp(5), .5, ""], ["Oil (flask)", "gear", sp(1), 1, ""],
      ["Pick, miner's", "gear", gp(2), 10, ""], ["Piton", "gear", cp(5), .25, ""], ["Pouch", "gear", sp(5), 1, ""], ["Rope, hempen (50 feet)", "gear", gp(1), 10, ""], ["Rope, silk (50 feet)", "gear", gp(10), 5, ""], ["Sack", "gear", cp(1), .5, ""],
      ["Shovel", "gear", gp(2), 5, ""], ["Spyglass", "gear", gp(1000), 1, ""], ["Tinderbox", "gear", sp(5), 1, ""], ["Torch", "gear", cp(1), 1, ""], ["Waterskin", "gear", sp(2), 5, ""], ["Whetstone", "gear", cp(1), 1, ""], ["Hourglass", "gear", gp(25), 1, ""],
      ["Magnifying glass", "gear", gp(100), 0, ""], ["Map or scroll case", "gear", gp(1), 1, ""], ["Ball bearings (bag of 1,000)", "gear", gp(1), 2, ""], ["Healer's kit", "medicine", gp(5), 3, "10 uses: stabilize a creature at 0 hit points without a check"],
      ["Rations (1 day)", "food", sp(5), 2, ""], ["Holy water (flask)", "consumable", gp(25), 1, "Thrown: 2d6 radiant to a fiend or undead"], ["Acid (vial)", "consumable", gp(25), 1, "Thrown: 2d6 acid"], ["Alchemist's fire (flask)", "consumable", gp(50), 1, "Thrown: 1d4 fire each turn until put out"],
      ["Antitoxin (vial)", "medicine", gp(50), 0, "Advantage on saving throws against poison for 1 hour"], ["Book", "book", gp(25), 5, ""], ["Ink (1 ounce bottle)", "gear", gp(10), 0, ""], ["Ink pen", "gear", cp(2), 0, ""], ["Parchment (one sheet)", "document", sp(1), 0, ""],
      ["Spellbook", "book", gp(50), 3, ""], ["Component pouch", "gear", gp(25), 2, ""], ["Holy symbol (amulet)", "jewellery", gp(5), 1, ""], ["Signet ring", "jewellery", gp(5), 0, ""], ["Perfume (vial)", "gear", gp(5), 0, ""], ["Soap", "gear", cp(2), 0, ""],
      ["Clothes, common", "clothing", sp(5), 3, ""], ["Clothes, fine", "clothing", gp(15), 6, ""], ["Clothes, traveler's", "clothing", gp(2), 4, ""], ["Clothes, costume", "clothing", gp(5), 4, ""], ["Robes", "clothing", gp(1), 4, ""],
      // tools
      ["Thieves' tools", "tool", gp(25), 1, ""], ["Smith's tools", "tool", gp(20), 8, ""], ["Herbalism kit", "tool", gp(5), 3, ""], ["Disguise kit", "tool", gp(25), 3, ""], ["Forgery kit", "tool", gp(15), 5, ""], ["Poisoner's kit", "tool", gp(50), 2, ""],
      ["Navigator's tools", "tool", gp(25), 2, ""], ["Alchemist's supplies", "tool", gp(50), 8, ""], ["Brewer's supplies", "tool", gp(20), 9, ""], ["Carpenter's tools", "tool", gp(8), 6, ""], ["Cook's utensils", "tool", gp(1), 8, ""], ["Mason's tools", "tool", gp(10), 8, ""],
      ["Leatherworker's tools", "tool", gp(5), 5, ""], ["Jeweler's tools", "tool", gp(25), 2, ""], ["Tinker's tools", "tool", gp(50), 10, ""], ["Dice set", "gear", sp(1), 0, ""], ["Playing card set", "gear", sp(5), 0, ""], ["Lute", "tool", gp(35), 2, ""], ["Flute", "tool", gp(2), 1, ""]
    ],
    // magic items: [name, category, rarity, attunement, summary in Atlas's words]
    magic: [
      ["Potion of healing", "consumable", "common", "", "Drink: regain 2d4 + 2 hit points."], ["Potion of greater healing", "consumable", "uncommon", "", "Drink: regain 4d4 + 4 hit points."],
      ["Potion of superior healing", "consumable", "rare", "", "Drink: regain 8d4 + 8 hit points."], ["Potion of supreme healing", "consumable", "very rare", "", "Drink: regain 10d4 + 20 hit points."],
      ["Potion of climbing", "consumable", "common", "", "For an hour: a climbing speed equal to walking speed, and advantage on Strength (Athletics) checks to climb."],
      ["Potion of water breathing", "consumable", "uncommon", "", "Breathe underwater for an hour."], ["Potion of resistance", "consumable", "uncommon", "", "Resistance to one damage type for an hour."],
      ["Potion of fire breath", "consumable", "uncommon", "", "For an hour, a bonus action breathes fire (up to three times)."], ["Potion of heroism", "consumable", "rare", "", "For an hour: temporary hit points and the effect of bless."],
      ["Potion of invisibility", "consumable", "very rare", "", "Invisible for an hour, or until attacking or casting a spell."], ["Potion of speed", "consumable", "very rare", "", "The effect of haste for a minute."], ["Potion of flying", "consumable", "very rare", "", "A flying speed for an hour."],
      ["Oil of slipperiness", "consumable", "uncommon", "", "The effect of freedom of movement for 8 hours, or poured out as a grease spell."], ["Dust of disappearance", "consumable", "uncommon", "", "Thrown in the air: creatures nearby are invisible for a while."],
      ["Spell scroll", "consumable", "varies", "", "One spell, cast from the scroll; its rarity goes with the spell's level."],
      ["Weapon, +1", "weapon", "uncommon", "", "+1 to attack and damage rolls."], ["Weapon, +2", "weapon", "rare", "", "+2 to attack and damage rolls."], ["Weapon, +3", "weapon", "very rare", "", "+3 to attack and damage rolls."],
      ["Armor, +1", "armour", "rare", "", "+1 to AC while worn."], ["Armor, +2", "armour", "very rare", "", "+2 to AC while worn."], ["Shield, +1", "armour", "uncommon", "", "+1 AC beyond the shield's own."],
      ["Ammunition, +1", "ammo", "uncommon", "", "+1 to attack and damage rolls; lost once it hits."], ["Mithral armor", "armour", "uncommon", "", "Medium or heavy armour with no Strength need and no Stealth disadvantage."],
      ["Adamantine armor", "armour", "uncommon", "", "Medium or heavy armour: a critical hit against the wearer is a normal hit."], ["Javelin of lightning", "weapon", "uncommon", "", "Once a day, thrown, it becomes a bolt of lightning."],
      ["Flame tongue", "weapon", "rare", "requires attunement", "A command word sets the blade alight: extra fire damage, and it sheds light."], ["Dagger of venom", "weapon", "rare", "", "+1 dagger; once a day its blade drips poison."],
      ["Mace of disruption", "weapon", "rare", "requires attunement", "Extra radiant damage to fiends and undead, which it can destroy outright."], ["Sword of sharpness", "weapon", "very rare", "requires attunement", "Maximum damage against objects; may sever a limb on a critical hit."],
      ["Bag of holding", "gear", "uncommon", "", "Holds far more than its size (500 pounds) while weighing 15 pounds."], ["Rope of climbing", "gear", "uncommon", "", "60 feet of rope that moves, ties and unties itself at a command."],
      ["Immovable rod", "gear", "uncommon", "", "A button fixes it in place, where it holds up to 8,000 pounds."], ["Driftglobe", "gear", "uncommon", "", "A small globe that sheds light and floats after its owner."],
      ["Decanter of endless water", "gear", "uncommon", "", "Pours fresh or salt water at a command: a stream, a fountain or a geyser."], ["Lantern of revealing", "gear", "uncommon", "", "Its light shows invisible creatures and objects."],
      ["Alchemy jug", "gear", "uncommon", "", "Pours a chosen liquid once a day: water, wine, vinegar, oil, honey and more."], ["Goggles of night", "gear", "uncommon", "", "Darkvision out to 60 feet."],
      ["Boots of elvenkind", "clothing", "uncommon", "", "Silent steps: advantage on Dexterity (Stealth) checks to move silently."], ["Cloak of elvenkind", "clothing", "uncommon", "requires attunement", "Hood up: harder to see, advantage on Stealth checks to hide."],
      ["Cloak of protection", "clothing", "uncommon", "requires attunement", "+1 to AC and saving throws."], ["Gloves of thievery", "clothing", "uncommon", "", "+5 to Sleight of Hand checks and to picking locks."],
      ["Hat of disguise", "clothing", "uncommon", "requires attunement", "Cast disguise self at will."], ["Slippers of spider climbing", "clothing", "uncommon", "requires attunement", "Walk up walls and across ceilings, hands free."],
      ["Gauntlets of ogre power", "clothing", "uncommon", "requires attunement", "Strength 19 while worn."], ["Headband of intellect", "clothing", "uncommon", "requires attunement", "Intelligence 19 while worn."],
      ["Eyes of the eagle", "gear", "uncommon", "requires attunement", "Advantage on Wisdom (Perception) checks that rely on sight."], ["Brooch of shielding", "jewellery", "uncommon", "requires attunement", "Resistance to force damage; immune to magic missile."],
      ["Periapt of wound closure", "jewellery", "uncommon", "requires attunement", "Stabilises the wearer when dying, and doubles healing from Hit Dice."], ["Pearl of power", "jewellery", "uncommon", "requires attunement by a spellcaster", "Once a day, regain a spent spell slot (up to 3rd level)."],
      ["Ring of mind shielding", "jewellery", "uncommon", "requires attunement", "Thoughts cannot be read; lies cannot be detected magically."], ["Ring of water walking", "jewellery", "uncommon", "", "Walk on liquid as if it were ground."],
      ["Ring of protection", "jewellery", "rare", "requires attunement", "+1 to AC and saving throws."], ["Ring of feather falling", "jewellery", "rare", "requires attunement", "Falls as gently as a feather."],
      ["Amulet of health", "jewellery", "rare", "requires attunement", "Constitution 19 while worn."], ["Bracers of defense", "clothing", "rare", "requires attunement", "+2 AC while wearing no armour and no shield."],
      ["Boots of speed", "clothing", "rare", "requires attunement", "Click the heels: double speed for a while, and attacks of opportunity have disadvantage."], ["Necklace of fireballs", "jewellery", "rare", "", "Beads to throw, each a fireball."],
      ["Wand of magic missiles", "gear", "uncommon", "", "7 charges: cast magic missile; regains 1d6 + 1 charges at dawn."], ["Wand of web", "gear", "uncommon", "requires attunement by a spellcaster", "7 charges: cast web; regains 1d6 + 1 charges at dawn."],
      ["Wand of fireballs", "gear", "rare", "requires attunement by a spellcaster", "7 charges: cast fireball; regains 1d6 + 1 charges at dawn."], ["Staff of the python", "gear", "uncommon", "requires attunement by a cleric, druid or warlock", "Thrown down, it becomes a giant constrictor snake."],
      ["Sentinel shield", "armour", "uncommon", "", "Advantage on initiative rolls and Wisdom (Perception) checks."], ["Arrow-catching shield", "armour", "rare", "requires attunement", "+2 AC against ranged attacks, and can take an arrow meant for another."],
      ["Vorpal sword", "weapon", "legendary", "requires attunement", "+3 weapon that ignores resistance to slashing; a natural 20 can cut off a head."]
    ]
  };

  // the names of games whose rules are not open: what their characters carry, as their books name it (no statistics)
  const NAMES = {
    mothership: { name: "Mothership", book: "the Mothership Player's Survival Guide", age: "future",
      weapon: ["Pulse rifle", "Combat shotgun", "Smart rifle", "SMG", "Revolver", "Flare gun", "Flamethrower", "Nail gun", "Rigging gun", "Laser cutter", "Boarding axe", "Vibechete", "Stun baton", "Scalpel", "Crowbar", "Frag grenade", "Foam gun", "Tranq pistol", "General-purpose machine gun", "Hand welder"],
      armour: ["Vaccsuit", "Hazard suit", "Standard battle dress", "Advanced battle dress", "Standard crew attire"],
      gear: ["Flashlight", "Chemlight", "Medscanner", "Bioscanner", "Automed", "Stimpak", "Pain pills", "Radiation pills", "Mag-boots", "Oxygen tank", "Rebreather", "Short-range comms", "Long-range comms", "Emergency beacon", "Personal locator", "Infrared goggles", "Body cam", "Binoculars", "Patch kit", "Electronic tool set", "Assorted tools", "Lockpick set", "Fire extinguisher", "Mylar blanket", "Paracord", "Water filtration device", "Foldable stretcher", "Jetpack", "Exoloader", "Geiger counter", "Explosives & detonator", "Cybernetic diagnostic scanner"] },
    coc: { name: "Call of Cthulhu", book: "the Call of Cthulhu Investigator Handbook or Keeper Rulebook", age: "1920s",
      weapon: [".38 revolver", ".45 automatic", "Webley revolver", "12-gauge double-barrelled shotgun", "Pump-action shotgun", "Bolt-action rifle", "Thompson submachine gun", "Derringer", "Straight razor", "Knife", "Club", "Sword cane", "Brass knuckles"],
      gear: ["Flashlight", "Kerosene lantern", "Camera and flash", "Notebook and pencil", "Magnifying glass", "First-aid kit", "Lock picks", "Crowbar", "Rope", "Matches", "Road map", "Pocket watch", "Hip flask", "Typewriter", "Field binoculars", "Shovel"],
      document: ["A diary", "A letter", "A newspaper clipping", "A telegram", "A ledger", "A photograph", "A deed", "A map", "An occult tome"] },
    alien: { name: "Alien RPG", book: "the Alien RPG core rulebook", age: "future",
      weapon: ["Pulse rifle", "Smartgun", "Service pistol", "Shotgun", "Flamethrower", "Cutting torch", "Bolt gun", "Knife"], armour: ["Compression suit", "Hazard suit", "Body armour"],
      gear: ["Motion tracker", "Flashlight", "Comm unit", "Personal medkit", "Seegson P-DAT", "Maintenance jack", "Signal flare", "Cigarettes", "Deck of cards"] },
    traveller: { name: "Traveller", book: "the Traveller Core Rulebook", age: "future",
      weapon: ["Autopistol", "Revolver", "Gauss rifle", "Laser carbine", "Shotgun", "Body pistol", "Cutlass", "Dagger", "Stunner"], armour: ["Vacc suit", "Flak jacket", "Cloth armour", "Combat armour", "Mesh"],
      gear: ["Hand computer", "Commdot", "Medikit", "Rebreather", "Thermal cloak", "Portable generator", "Toolkit", "Binoculars"] },
    cyberpunk: { name: "Cyberpunk RED", book: "the Cyberpunk RED core rulebook", age: "future",
      weapon: ["Heavy pistol", "Very heavy pistol", "Medium pistol", "SMG", "Shotgun", "Assault rifle", "Sniper rifle", "Monokatana", "Heavy melee weapon", "Light melee weapon"], armour: ["Kevlar", "Light armorjack", "Medium armorjack", "Bulletproof shield"],
      gear: ["Agent", "Medtech bag", "Techtool", "Flashlight", "Binoculars", "Radio scanner", "Smart glasses", "Memory chip", "Disposable cell phone"] },
    blades: { name: "Blades in the Dark", book: "Blades in the Dark", age: "victorian",
      weapon: ["A blade or two", "Throwing knives", "A pistol", "A second pistol", "A large weapon", "An unusual weapon"], armour: ["Armor", "Heavy armor"],
      gear: ["Burglary gear", "Climbing gear", "Arcane implements", "Documents", "Subterfuge supplies", "Demolition tools", "Tinkering tools", "Lantern", "Spiritbane charm"] },
    pf2e: { name: "Pathfinder 2e", book: "the Pathfinder Player Core", age: "fantasy" }
  };
  // which game this campaign plays, from its words (campaign.js system)
  function which(system) {
    const s = String(system || "").toLowerCase();
    if (/d&d|dnd|dungeons\s*(&|and)\s*dragons|5e|5th edition|srd/.test(s)) return "dnd5";
    if (/mothership/.test(s)) return "mothership"; if (/cthulhu|delta green/.test(s)) return "coc"; if (/\balien\b/.test(s)) return "alien";
    if (/traveller/.test(s)) return "traveller"; if (/cyberpunk/.test(s)) return "cyberpunk"; if (/blades in the dark|forged in the dark/.test(s)) return "blades"; if (/pathfinder/.test(s)) return "pf2e";
    return "";
  }
  A.itemRules = { DND5, NAMES, which, SRD };
})(typeof ATLAS !== "undefined" ? ATLAS : this.ATLAS);
