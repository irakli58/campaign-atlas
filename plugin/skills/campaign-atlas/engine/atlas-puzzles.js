/* Riddles and puzzles: made answer first, then checked. The user asked on 21 Oct 2026 for riddles that "feel like part
   of the environment", every one solvable: "define the solution first, construct the question around it, verify that
   the clues support the answer", hints that help, alternative answers where fair, the props a puzzle needs, success
   and failure spelled out, and never the answer in front of the players unless the game master shows it.
   Every riddle here is built from a solution and proved by a solver before it is given out:
   - a riddle in verse names what it is by lines chosen so that each answer it could be mistaken for is ruled out by at
     least one of them (the look-alikes are written down with each answer, and checked);
   - statues in order, levers and braziers, weights on a scale, doors whose inscriptions lie, a path across marked
     tiles, mirrors turning a beam, a number sequence: each is solved by trying every possibility, and kept only if
     exactly one answers it;
   - a word spoken to a door, an offering, a spirit's question, runes pressed in order: kept only if what they need is
     somewhere the players can reach before they need it (atlas-cave.js places it; D.validateMap checks it).
   A riddle is { id, t, kind, type, at, pd (what the players are shown), d (what it is), sol (the answer), why (the
   reasoning), ans (accepted answers), hints (in order), ok, fail, time, diff, props, needs, links, data (its solution
   and clues, from which its words are written again), check (the solver's verdict), gen }.
   The traps are atlas-traps.js; both are placed in a cave by D.forCave there. Runs without a browser. */
(function (A) {
  "use strict";
  const D = A.devices = A.devices || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const rng = s => (A.cave && A.cave.rng ? A.cave.rng(s) : (() => { let a = 1; for (const ch of String(s)) a = (a * 31 + ch.charCodeAt(0)) >>> 0; const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; r.range = (l, h) => l + r() * (h - l); r.int = (l, h) => Math.floor(l + r() * (h - l + 1)); r.pick = x => x[Math.floor(r() * x.length)]; r.chance = p => r() < p; r.shuffle = x => { for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }; r.weighted = l => { const t = l.reduce((s, x) => s + x[1], 0); let v = r() * t; for (const x of l) { v -= x[1]; if (v <= 0) return x[0]; } return l[l.length - 1][0]; }; return r; })());
  D.rng = rng;
  const list = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"], num = n => NUM[n] || String(n), Num = n => cap(num(n));
  const an = w => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;

  /* ---- the campaign's rules: its words for a roll, how hard, how much it hurts */
  D.system = () => { const s = String((A.config || {}).system || ""); if (/cthulhu|\bcoc\b|delta green|pulp|trail of|gumshoe/i.test(s)) return "coc"; if (/pathfinder|pf2/i.test(s)) return "pf"; if (/d&d|dnd|\b5e\b|5th|dungeons|13th age|old.?school|\bosr\b|\bose\b/i.test(s)) return "dnd"; return "any"; };
  const SK = {
    perceive: ["Wisdom (Perception)", "Perception", "Spot Hidden", "Perception"], search: ["Intelligence (Investigation)", "Perception (searching)", "Spot Hidden", "Searching"], listen: ["Wisdom (Perception)", "Perception", "Listen", "Hearing"],
    arcana: ["Intelligence (Arcana)", "Arcana", "Occult", "Lore of the uncanny"], lore: ["Intelligence (History)", "Society", "History", "History"], religion: ["Intelligence (Religion)", "Religion", "Occult", "Religion"],
    nature: ["Wisdom (Survival)", "Nature", "Natural World", "Survival"], mechanism: ["Dexterity with thieves' tools", "Thievery", "Mechanical Repair or Locksmith", "Mechanisms"], athletics: ["Strength (Athletics)", "Athletics", "Climb or a STR roll", "Athletics"],
    climb: ["Strength (Athletics)", "Athletics", "Climb", "Climbing"], swim: ["Strength (Athletics)", "Athletics", "Swim", "Swimming"], jump: ["Strength (Athletics)", "Athletics", "Jump", "Jumping"], balance: ["Dexterity (Acrobatics)", "Acrobatics", "a DEX roll", "Agility"],
    insight: ["Wisdom (Insight)", "Perception", "Psychology", "Insight"], stealth: ["Dexterity (Stealth)", "Stealth", "Stealth", "Stealth"], navigate: ["Wisdom (Survival)", "Survival", "Navigate", "Navigation"], reason: ["Intelligence check", "Intelligence check", "an INT roll", "Reasoning"],
    will: ["Wisdom saving throw", "Will save", "a POW roll", "Willpower"], dodge: ["Dexterity saving throw", "Reflex save", "Dodge", "Dodging"], endure: ["Constitution saving throw", "Fortitude save", "a CON roll", "Endurance"], strength: ["Strength saving throw", "Fortitude save", "a STR roll", "Strength"]
  };
  const SYS = { dnd: 0, pf: 1, coc: 2, any: 3 };
  const DC = { dnd: [10, 12, 15, 18, 21], pf: [15, 18, 20, 25, 30], coc: ["Regular", "Regular", "Hard", "Hard", "Extreme"], any: ["easy", "fair", "hard", "very hard", "heroic"] };
  D.roll = (skill, diff) => { const sys = D.system(), d = clamp(Math.round(diff || 3), 1, 5) - 1, name = (SK[skill] || [skill, skill, skill, skill])[SYS[sys]]; return sys === "dnd" || sys === "pf" ? `DC ${DC[sys][d]} ${name}` : sys === "coc" ? `${cap(name)} (${DC.coc[d]})` : `${name} (${DC.any[d]})`; };
  // harm, by how severe (1 to 5) and of what kind
  D.harm = (sev, type) => {
    const sys = D.system(), s = clamp(Math.round(sev || 2), 1, 5) - 1, t = type ? " " + type : "";
    if (sys === "dnd") return ["1d4" + t + " damage", "2d6" + t + " damage", "4d6" + t + " damage", "8d6" + t + " damage", "10d10" + t + " damage"][s];
    if (sys === "pf") return ["1d6" + t + " damage", "2d8" + t + " damage", "4d8" + t + " damage", "6d10" + t + " damage", "10d10" + t + " damage"][s];
    if (sys === "coc") return ["1 hit point", "1D4 damage", "1D6+1 damage", "2D6 damage", "4D6 damage (a lethal blow, if you rule so)"][s];
    return ["a graze", "a minor wound", "a serious wound", "a grave wound", "a wound that may kill"][s];
  };
  D.sanity = sev => D.system() === "coc" ? ["0/1 SAN", "0/1D3 SAN", "1/1D4 SAN", "1/1D6 SAN", "1D4/1D8 SAN"][clamp(Math.round(sev || 2), 1, 5) - 1] : "";
  D.save = (kind, diff) => { const sys = D.system(); return sys === "coc" ? D.roll(kind === "dodge" ? "dodge" : kind, diff) + " to avoid it" : D.roll(kind, diff) + (sys === "dnd" || sys === "pf" ? ", half on a success" : " to avoid the worst of it"); };
  // the story's tone: what magic is called, and what is in the dark
  D.tone = () => { const e = A.table && A.table.era ? A.table.era() : "fantasy", sys = D.system(); if (e === "future") return "scifi"; if (e === "fantasy" || e === "medieval" || sys === "dnd" || sys === "pf") return "fantasy"; if (sys === "coc" || e === "1920s" || e === "victorian") return "horror"; return "modern"; };
  const WORDS = {
    fantasy: { magic: "magic", magical: "magical", rune: "rune", runes: "runes", ward: "ward", sense: "detect magic or a careful Arcana check", dispel: "dispel magic", glow: "a pale magical glow", power: "the old magic" },
    horror: { magic: "sorcery", magical: "unnatural", rune: "sigil", runes: "sigils", ward: "warding sign", sense: "an Occult roll, or a sensitive's unease", dispel: "a banishing rite, or the Elder Sign", glow: "a sickly phosphorescence", power: "something old and patient" },
    scifi: { magic: "alien technology", magical: "alien", rune: "glyph", runes: "glyphs", ward: "field", sense: "a scanner sweep", dispel: "cutting its power or overriding it", glow: "a cold blue light", power: "the old machines" },
    modern: { magic: "something inexplicable", magical: "uncanny", rune: "symbol", runes: "symbols", ward: "warding mark", sense: "careful study, or a sensitive's unease", dispel: "breaking the pattern", glow: "a light with no source", power: "whatever made this place" }
  };
  D.w = (k, tone) => (WORDS[tone || D.tone()] || WORDS.fantasy)[k] || k;

  /* ================================================================ riddles in verse
     Each answer comes with lines that describe it, each line saying which trait it names, and the answers it could be
     mistaken for, each with the traits it shares. A riddle is a set of lines that every look-alike fails at least once. */
  const VERSE = [
    { a: "an echo", alt: ["echo", "echoes", "an echo"], th: ["sound", "cave"], lines: [["I answer every voice, though I have none of my own.", "answers"], ["Shout, and I shout back; whisper, and so do I.", "answers"], ["I dwell in hollows and die in open fields.", "hollow"], ["No eye has ever seen me, though every ear has met me.", "unseen"], ["I always have the last word, and it is always yours.", "answers"]], conf: { "a parrot": ["answers"], "the wind": ["unseen", "hollow"], "silence": ["unseen", "hollow"] }, hints: ["You are standing in its home.", "It cannot speak first.", "Call out, and listen."] },
    { a: "darkness", alt: ["darkness", "the dark", "dark", "the darkness", "night"], th: ["darkness", "cave"], lines: [["The more of me there is, the less you see.", "blinds"], ["Bring one small flame and I flee into the corners.", "fears-light"], ["I filled this hall before the first stone was cut.", "here-first"], ["I weigh nothing, yet I press on every eye.", "weightless"], ["Close your eyes and you carry me with you.", "eyes"]], conf: { "fog": ["blinds", "weightless"], "smoke": ["blinds", "weightless"], "sleep": ["eyes"], "a shadow": ["fears-light", "weightless"] }, hints: ["You brought something to fight it.", "It is everywhere your light is not.", "Put out your light and you will have it."] },
    { a: "time", alt: ["time", "the years", "age"], th: ["time"], lines: [["I eat stone and iron, kings and their crowns.", "devours"], ["I run without legs and never once look back.", "forward"], ["You cannot hold me, keep me, or buy me back.", "intangible"], ["Every candle you have burned has counted me.", "counted"], ["The water carving these walls is only my slow hand.", "carves"]], conf: { "rust": ["devours"], "water": ["forward", "carves"], "fire": ["devours", "counted"], "death": ["devours", "intangible"] }, hints: ["You are running out of it.", "Clocks and candles both measure it.", "It passes while you stand here thinking."] },
    { a: "fire", alt: ["fire", "flame", "a flame", "a fire", "a candle flame"], th: ["light", "fire"], lines: [["Feed me and I live; give me drink and I die.", "dies-water"], ["I have a tongue but cannot taste; I climb, yet have no hands.", "tongue"], ["I am born of a spark and leave only ash behind me.", "ash"], ["I give you light and warmth, and bite the hand that holds me.", "bites"]], conf: { "a dragon": ["bites", "tongue"], "lightning": ["ash", "bites"], "a plant": [] }, hints: ["You carry some with you.", "Water is its enemy.", "It is lighting your way."] },
    { a: "water", alt: ["water", "a drop of water", "drops of water", "dripping water", "the drip"], th: ["water", "cave"], lines: [["I carved this whole cave, a single tap at a time.", "carves"], ["I fall all my life and am never broken.", "falls"], ["Pour me into any vessel and I take its shape.", "shape"], ["Every echo dripping in this hall is my voice.", "drips"]], conf: { "time": ["carves"], "sand": ["shape", "falls"], "rain": ["falls", "shape", "carves"] }, hints: ["You can hear it.", "It made this place.", "You drink it."] },
    { a: "stone", alt: ["stone", "a stone", "rock", "the rock"], th: ["stone", "cave"], lines: [["I was here before the first king and will be here after the last.", "ancient"], ["Water slowly eats me; I never eat at all.", "eaten"], ["Masons cut me; sculptors free the faces sleeping in me.", "carved"], ["You stand on me, beside me and beneath me now.", "around"]], conf: { "time": ["ancient"], "wood": ["carved"], "ice": ["eaten", "carved"], "the earth": ["ancient", "around"] }, hints: ["Look around you.", "Sculptors work it.", "It is all around you, and under your feet."] },
    { a: "silence", alt: ["silence", "quiet", "the silence"], th: ["sound"], lines: [["Speak my name and I am gone.", "broken"], ["I fill a room the moment the last voice leaves it.", "after"], ["Thieves and hunters pray to me.", "stealth"]], conf: { "a secret": ["broken"], "darkness": ["stealth"] }, hints: ["You have it when nobody speaks.", "Saying it aloud destroys it.", "Hush."] },
    { a: "a shadow", alt: ["shadow", "a shadow", "your shadow", "shadows"], th: ["light", "darkness"], lines: [["I follow you everywhere and never make a sound.", "follows"], ["Bring a light and I am born; take it away and I am gone.", "needs-light"], ["I grow long at evening and short at noon.", "length"], ["I lie down when you lie down, and rise when you rise.", "mimic"]], conf: { "an echo": [], "a dog": ["follows"], "darkness": ["follows"] }, hints: ["You brought it in with you.", "Your lantern makes it.", "Look at the floor behind you."] },
    { a: "a key", alt: ["key", "a key", "the key"], th: ["door"], lines: [["I have teeth but never bite.", "teeth"], ["I am small, yet I open the way for the strong.", "opens"], ["Lose me and the door forgets you.", "door"]], conf: { "a comb": ["teeth"], "a saw": ["teeth"], "a password": ["opens", "door"] }, hints: ["Doors know it.", "It is made of metal and fits in a hand.", "What turns in a lock?"] },
    { a: "a map", alt: ["map", "a map", "the map"], th: ["journey"], lines: [["I hold mountains and rivers, yet weigh less than a bird.", "holds-land"], ["I have roads but no carts, cities but no people.", "empty-roads"], ["Fold me, and the whole world folds with me.", "folds"]], conf: { "a painting": ["holds-land"], "a dream": ["empty-roads", "holds-land"], "a book": ["folds"] }, hints: ["Travellers carry it.", "It is drawn, not built.", "You may have one in your pack."] },
    { a: "the moon", alt: ["moon", "the moon"], th: ["light", "time"], lines: [["No one down here can see me, yet I pull the sea against the cliffs.", "tides"], ["I wear a different face each night, and the same face forever.", "phases"], ["I borrow all my light and pay none of it back.", "borrowed"]], conf: { "the sun": ["tides"], "a mirror": ["borrowed"] }, hints: ["It is above the world, far above you.", "It changes its face every night.", "Wolves sing to it."] },
    { a: "smoke", alt: ["smoke"], th: ["fire"], lines: [["I rise from what is dying and climb toward the sky.", "rises"], ["I can fill a hall but never a hand.", "unholdable"], ["Where I am, my mother is near.", "fire-near"], ["I sting the eyes of those who sit close to my mother.", "stings"]], conf: { "steam": ["rises", "unholdable"], "mist": ["unholdable"] }, hints: ["It comes from fire.", "It climbs.", "Your torch makes a little."] },
    { a: "breath", alt: ["breath", "a breath", "your breath", "breathing"], th: ["life"], lines: [["Light as a feather, yet the strongest cannot hold me for long.", "cannot-hold"], ["I leave you and return, all your life.", "returns"], ["On a cold morning you can see me.", "visible-cold"]], conf: { "the wind": ["cannot-hold"], "a secret": ["cannot-hold"] }, hints: ["You are doing it now.", "It fogs on a cold morning.", "Hold it, and see how long you last."] },
    { a: "a bone", alt: ["bone", "a bone", "bones", "a skeleton"], th: ["death"], lines: [["I am inside you now, and I will be here long after you are not.", "outlasts"], ["Dogs dig for me; scholars count me.", "dogs"], ["The dead keep me when they keep nothing else.", "dead-keep"]], conf: { "a tooth": ["outlasts", "dead-keep"], "gold": ["dead-keep"] }, hints: ["You have over two hundred of them.", "The dead keep them.", "Look at what lies on the floor of this place."] },
    { a: "a coffin", alt: ["coffin", "a coffin", "a grave", "a tomb", "a casket"], th: ["death"], lines: [["Carpenters build me for a man who will never thank them.", "built-for-dead"], ["I am the last bed, and no one wakes in me.", "last-bed"], ["Six carry me; one fills me.", "six"]], conf: { "a cradle": ["built-for-dead"], "a bed": [], "a ship": ["six"] }, hints: ["It is made of wood, for the dead.", "It is buried.", "Undertakers sell it."] },
    { a: "footsteps", alt: ["footsteps", "footprints", "steps", "your footsteps", "tracks"], th: ["journey"], lines: [["The farther you go, the more of me you leave behind.", "left-behind"], ["In this dust I keep the record of all who came before you.", "record"], ["You make me on every journey and never carry me.", "made-not-carried"]], conf: { "memories": ["left-behind"], "time": ["left-behind"] }, hints: ["Look down.", "Hunters follow them.", "You are making them now."] },
    { a: "a mirror", alt: ["mirror", "a mirror", "a reflection", "your reflection", "still water"], th: ["light"], lines: [["I show you your face but have none of my own.", "shows-face"], ["With me, left is right and right is left.", "reversed"], ["Break me and I multiply.", "multiplies"]], conf: { "a portrait": ["shows-face"], "a window": ["shows-face"] }, hints: ["It shows you yourself.", "Still water can be one.", "Vain kings keep them."] },
    { a: "ice", alt: ["ice"], th: ["water", "cold"], lines: [["I am water that has learned to stand still.", "still-water"], ["Warm me in your hand and I weep.", "melts"], ["I am glass that no glassblower made.", "glass"]], conf: { "glass": [], "snow": ["melts"], "salt": [] }, hints: ["It is cold.", "It is water.", "It melts."] },
    { a: "a spider's web", alt: ["web", "a web", "cobweb", "a cobweb", "spider web", "a spider's web", "spiderweb"], th: ["cave", "creature"], lines: [["I am a net no fisherman ever cast.", "net"], ["I was woven in the night by a weaver with eight legs.", "eight"], ["Flies come to me and never leave.", "traps"]], conf: { "a net": ["net", "traps"], "a sticky trap": ["traps"] }, hints: ["Look in the corners.", "Something with eight legs made it.", "Flies fear it."] },
    { a: "a door", alt: ["door", "a door", "the door", "doors"], th: ["door"], lines: [["Open, I let you pass; shut, I do not; I am neither wall nor road.", "open-shut"], ["I have a handle, and nothing to carry.", "handle"], ["Knock on me, and I may answer.", "knock"]], conf: { "a gate": ["open-shut", "knock"], "a box": ["open-shut", "handle"] }, hints: ["Every house has one.", "You knock on it.", "You are standing before one."] },
    { a: "your name", alt: ["name", "a name", "your name", "my name"], th: ["life"], lines: [["It belongs to you, yet others use it more than you do.", "others-use"], ["You were given it before you could speak, and it will be carved over you when you no longer can.", "given-carved"]], conf: { "a face": [], "a title": ["others-use"] }, hints: ["It is yours.", "Your mother gave it to you.", "Others call you by it."] },
    { a: "a secret", alt: ["secret", "a secret", "secrets"], th: ["mystery"], lines: [["If you have me, you long to share me; once you share me, you have me no more.", "share-lose"], ["I am kept best by one, and badly by two.", "kept-alone"], ["This place is full of me.", "here"]], conf: { "silence": ["kept-alone"], "a promise": ["kept-alone"] }, hints: ["Everyone keeps one.", "Tell it, and it is gone.", "This place hides many."] },
    { a: "rust", alt: ["rust", "corrosion"], th: ["time", "metal"], lines: [["I am the red that eats iron.", "eats-iron"], ["Water and air are my parents; old blades are my meat.", "parents"], ["Swords fear me more than any shield.", "swords"]], conf: { "fire": ["eats-iron"], "blood": [] }, hints: ["It is red-brown.", "It grows on old iron left wet.", "Look at the old blades."] },
    { a: "a torch", alt: ["torch", "a torch", "lantern", "a lantern", "a candle", "a lamp", "light", "a light"], th: ["light", "cave"], lines: [["You carry me into the dark to make the dark smaller.", "shrinks-dark"], ["I eat my own body to give you sight.", "eats-self"], ["When I die, the dark comes back to claim its hall.", "dies-dark"]], conf: { "the sun": ["dies-dark"], "an eye": [] }, hints: ["You are holding one.", "It burns.", "Without it you would be blind down here."] },
    { a: "a heartbeat", alt: ["heartbeat", "a heartbeat", "heart", "your heart", "a heart"], th: ["life"], lines: [["A drum no hand has struck, beating in the dark inside you.", "inner-drum"], ["It quickens when you are afraid.", "fear"], ["When it stops, so do you.", "stops"]], conf: { "a clock": ["stops"], "breath": ["fear", "stops"] }, hints: ["You can feel it.", "It is in your chest.", "Put your hand there."] },
    { a: "a bridge", alt: ["bridge", "a bridge"], th: ["journey"], lines: [["My back is for walking on; I lie across what you cannot cross.", "across"], ["I hold hands with both banks and never let go.", "both-banks"]], conf: { "a rope": ["across"], "a ford": ["both-banks"] }, hints: ["It spans.", "Rivers have them.", "Without it, you would swim."] },
    { a: "gold", alt: ["gold"], th: ["treasure"], lines: [["Kings die for me and thieves live for me.", "wanted"], ["I never rust and I never rot.", "never-rusts"], ["I sleep in the rock until greed wakes me.", "in-rock"]], conf: { "silver": ["wanted", "in-rock"], "glory": ["wanted"], "salt": ["never-rusts"] }, hints: ["It glitters.", "Dragons sleep on it.", "It is yellow and heavy."] },
    { a: "a stalactite", alt: ["stalactite", "a stalactite", "stalactites", "dripstone"], th: ["cave", "stone"], lines: [["I grow downward by a hair in a lifetime.", "grows-down"], ["I am an icicle of stone that will never melt.", "stone-icicle"], ["My brother rises from the floor to meet me.", "brother"]], conf: { "an icicle": ["grows-down"], "a stalagmite": ["stone-icicle"] }, hints: ["Look up.", "It hangs from the roof.", "It is made by dripping water."] },
    { a: "a chain", alt: ["chain", "a chain", "chains"], th: ["metal", "captive"], lines: [["I am only as strong as my weakest part.", "weakest"], ["I am rings that hold hands.", "rings"], ["Prisoners wear me and anchors drag me.", "prisoners"]], conf: { "a rope": ["weakest", "prisoners"], "a necklace": ["rings"] }, hints: ["It is made of links.", "It is iron.", "Gaolers use it."] },
    { a: "death", alt: ["death"], th: ["death"], lines: [["Every one of you will meet me, and none of you twice.", "once"], ["I come for kings and beggars at the same price.", "equal"], ["Those who know me best can tell you nothing of me.", "silent"]], conf: { "sleep": ["silent"], "time": ["equal"] }, hints: ["Nobody escapes it.", "It comes at the end.", "The bones in this place have met it."] },
    { a: "salt", alt: ["salt"], th: ["water", "ward"], lines: [["I am born of the sea and die in the rain.", "sea-rain"], ["Kings once paid their soldiers in me.", "paid"], ["A pinch of me wakes a dull meal, and a ring of me keeps out the restless dead.", "meal-ward"]], conf: { "sugar": [], "silver": ["meal-ward", "paid"] }, hints: ["It is white.", "The sea is full of it.", "Cooks use it."] }
  ];
  D.VERSE = VERSE;
  // a verse riddle's lines: chosen until every look-alike fails one of them, then a line or two more for colour
  function verseLines(e, R) {
    const lines = R.shuffle(e.lines.slice()), chosen = [], conf = Object.entries(e.conf);
    const left = () => conf.filter(([, f]) => !chosen.some(l => !f.includes(l[1])));
    // two lines to begin; then a line for each look-alike still standing, one that rules it out
    for (const l of lines) if (chosen.length < 2) chosen.push(l);
    for (let guard = 0; guard < 6 && left().length; guard++) { const [, f] = left()[0], l = lines.find(x => !chosen.includes(x) && !f.includes(x[1])); if (!l) break; chosen.push(l); }
    if (chosen.length < 3 && R.chance(.6)) { const more = lines.find(x => !chosen.includes(x)); if (more) chosen.push(more); }
    // in the order they are written (the first of them reads as the opening)
    chosen.sort((a, b) => e.lines.indexOf(a) - e.lines.indexOf(b));
    return { chosen, open: left().map(([n]) => n) };
  }
  D.checkVerse = (e, chosen) => {
    const left = Object.entries(e.conf).filter(([, f]) => !chosen.some(l => !f.includes(l[1]))).map(([n]) => n);
    return { ok: !left.length && chosen.length >= 2, unique: !left.length, rules: Object.keys(e.conf).map(n => { const by = chosen.find(l => !e.conf[n].includes(l[1])); return by ? `${n}: ruled out by "${by[0]}"` : `${n}: NOT ruled out`; }), notes: left.length ? "Could also be " + list(left) : "" };
  };

  /* ================================================================ puzzles, each with its solver */
  const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
  const perms = n => { const out = [], a = [...Array(n).keys()], rec = k => { if (k === n) { out.push(a.slice()); return; } for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(k + 1); [a[k], a[i]] = [a[i], a[k]]; } }; rec(0); return out; };
  const FIG = {
    fantasy: [["the King", "a crown"], ["the Queen", "a sceptre"], ["the Knight", "a sword"], ["the Priest", "a book"], ["the Beggar", "a bowl"], ["the Child", "a flower"], ["the Wizard", "a staff"]],
    horror: [["the Drowned Man", "a net"], ["the Widow", "a veil"], ["the Physician", "a lancet"], ["the Child", "a doll"], ["the Priest", "a book"], ["the Hanged Man", "a rope"], ["the Watcher", "a lantern"]],
    scifi: [["the Pilot", "a helm"], ["the Engineer", "a spanner"], ["the Medic", "a phial"], ["the Child", "a star"], ["the Envoy", "a tablet"], ["the Sentinel", "a spear"], ["the Navigator", "a compass"]],
    modern: [["the Miner", "a pick"], ["the Mother", "a cradle"], ["the Soldier", "a rifle"], ["the Priest", "a book"], ["the Child", "a ball"], ["the Doctor", "a satchel"], ["the Fisherman", "a net"]]
  };
  // statues on plinths: an order, and the fewest true sayings that leave only that order
  function statues(R, o) {
    const tone = o.tone, n = clamp(2 + (o.diff || 3), 3, 6), figs = R.shuffle((FIG[tone] || FIG.fantasy).slice()).slice(0, n), sol = R.shuffle([...Array(n).keys()]);
    const pos = p => { const q = []; p.forEach((f, i) => { q[f] = i; }); return q; };
    const P = pos(sol), name = i => figs[i][0];
    const pool = [];
    for (let a = 0; a < n; a++) {
      pool.push({ t: "at", a, k: P[a], s: `${cap(name(a))} stands in the ${ORD[P[a]]} place.`, ok: q => q[a] === P[a] });
      if (P[a] === 0 || P[a] === n - 1) pool.push({ t: "end", a, s: `${cap(name(a))} stands at one end.`, ok: q => q[a] === 0 || q[a] === n - 1 });
      else pool.push({ t: "notend", a, s: `${cap(name(a))} stands at neither end.`, ok: q => q[a] !== 0 && q[a] !== n - 1 });
      for (let b = 0; b < n; b++) if (a !== b) {
        if (P[a] < P[b]) pool.push({ t: "left", a, b, s: `${cap(name(a))} stands somewhere left of ${name(b)}.`, ok: q => q[a] < q[b] });
        if (P[a] + 1 === P[b]) pool.push({ t: "next", a, b, s: `${cap(name(b))} stands at ${name(a)}'s right hand.`, ok: q => q[a] + 1 === q[b] });
        if (a < b && Math.abs(P[a] - P[b]) > 1) pool.push({ t: "apart", a, b, s: `${cap(name(a))} will not stand beside ${name(b)}.`, ok: q => Math.abs(q[a] - q[b]) > 1 });
      }
    }
    const all = perms(n).map(pos), count = cs => all.filter(q => cs.every(c => c.ok(q))).length;
    const chosen = [];
    for (const c of R.shuffle(pool.filter(c => c.t !== "at"))) { if (count(chosen) === 1) break; if (count(chosen.concat([c])) < count(chosen)) chosen.push(c); }
    if (count(chosen) !== 1) for (const c of pool.filter(c => c.t === "at")) { if (count(chosen) === 1) break; chosen.push(c); }
    // nothing said that is not needed
    for (let i = chosen.length - 1; i >= 0; i--) { const w = chosen.slice(0, i).concat(chosen.slice(i + 1)); if (count(w) === 1) chosen.splice(i, 1); }
    const order = sol.map(name);
    return { type: "statues", data: { figs, sol, rules: chosen.map(c => c.s) }, check: { ok: count(chosen) === 1, unique: count(chosen) === 1, tried: all.length, notes: `${all.length} orders tried; exactly ${count(chosen)} fits every saying.` }, sol: order.join(", "), ans: [order.join(", ")] };
  }
  // levers, each lighting or snuffing some of the braziers: one set of pulls lights them all, and only one
  function levers(R, o) {
    // (never more levers than braziers: with more, two different sets of pulls always give the same braziers)
    const n = clamp(1 + (o.diff || 3), 3, 5), m = n + ((o.diff || 3) >= 4 ? 1 : 0), L = "ABCDEF".slice(0, n).split("");
    for (let t = 0; t < 200; t++) {
      const rows = L.map(() => { let r = 0; while (!r) for (let j = 0; j < m; j++) if (R.chance(.45)) r |= 1 << j; return r; });
      const goal = (1 << m) - 1, want = R.int(1, (1 << n) - 1);
      let start = goal; for (let i = 0; i < n; i++) if (want >> i & 1) start ^= rows[i];
      if (start === goal || start === 0 && m < 3) continue;
      const sols = []; for (let s = 1; s < 1 << n; s++) { let v = start; for (let i = 0; i < n; i++) if (s >> i & 1) v ^= rows[i]; if (v === goal) sols.push(s); }
      if (sols.length !== 1) continue;
      if ((o.diff || 3) >= 2 && [...Array(n).keys()].filter(i => sols[0] >> i & 1).length < 2) continue;
      const pick = L.filter((_, i) => sols[0] >> i & 1), lit = [...Array(m).keys()].filter(j => start >> j & 1);
      return { type: "levers", data: { L, rows, m, start, sol: sols[0] }, check: { ok: true, unique: true, tried: (1 << n) - 1, notes: `All ${(1 << n) - 1} ways of pulling the levers tried; one lights every brazier.` }, sol: "Pull " + list(pick) + (pick.length > 1 ? " (in any order, each once)" : " once"), ans: [pick.join(""), pick.join(" "), pick.join(", ")], lit };
    }
    return null;
  }
  // weights on a scale: one set of idols weighs exactly what the door asks
  function weights(R, o) {
    const n = clamp(3 + (o.diff || 3), 4, 7);
    for (let t = 0; t < 300; t++) {
      const w = [...Array(n)].map(() => R.int(1, 9)), pick = [...Array(n).keys()].filter(() => R.chance(.45)); if (pick.length < 2) continue;
      const target = pick.reduce((s, i) => s + w[i], 0), sols = [];
      for (let s = 1; s < 1 << n; s++) { let v = 0; for (let i = 0; i < n; i++) if (s >> i & 1) v += w[i]; if (v === target) sols.push(s); }
      if (sols.length !== 1) continue;
      return { type: "weights", data: { w, target, sol: sols[0] }, check: { ok: true, unique: true, tried: (1 << n) - 1, notes: `All ${(1 << n) - 1} sets of idols weighed; one comes to ${target}.` }, sol: "The idols marked " + list(pick.map(i => String(w[i]))) + ` (together ${target})`, ans: [pick.map(i => w[i]).sort((a, b) => a - b).join(" ")] };
    }
    return null;
  }
  // doors whose inscriptions lie: only one door is safe, and the rule about truth leaves only one choice
  function doors(R, o) {
    const n = 3, names = ["left", "middle", "right"];
    const said = [
      (me) => ({ s: "This door is safe.", f: safe => safe === me }), (me) => ({ s: "This door is not safe.", f: safe => safe !== me }),
      ...[0, 1, 2].map(k => me => ({ s: k === me ? null : `The ${names[k]} door is safe.`, f: safe => safe === k })),
      ...[0, 1, 2].map(k => me => ({ s: k === me ? null : `The ${names[k]} door is not safe.`, f: safe => safe !== k })),
      (me) => ({ s: "The safe door is beside this one.", f: safe => Math.abs(safe - me) === 1 }), (me) => ({ s: "The safe door is at one end.", f: safe => safe !== 1 })
    ];
    const RULES = [["one", "Exactly one of these three inscriptions is true.", c => c === 1], ["two", "Exactly two of these three inscriptions are true.", c => c === 2], ["none", "Every inscription here is a lie.", c => c === 0]];
    for (let t = 0; t < 400; t++) {
      const rule = R.pick(RULES), ins = [0, 1, 2].map(me => { let x; do x = R.pick(said)(me); while (!x.s); return x; });
      const fits = [0, 1, 2].filter(safe => rule[2](ins.filter(x => x.f(safe)).length));
      if (fits.length !== 1) continue;
      return { type: "doors", data: { rule: rule[1], ins: ins.map(x => x.s), safe: fits[0] }, check: { ok: true, unique: true, tried: 3, notes: `Each door tried as the safe one; only the ${names[fits[0]]} door makes "${rule[1]}" hold.` }, sol: `The ${names[fits[0]]} door`, ans: [names[fits[0]], `the ${names[fits[0]]} door`] };
    }
    void n; return null;
  }
  // a floor of marked tiles: one path across steps on the marks in the order a verse gives
  const MARKS = { fantasy: ["Sun", "Moon", "Star", "Wave", "Flame"], horror: ["Eye", "Hand", "Worm", "Key", "Star"], scifi: ["Circle", "Triangle", "Square", "Spiral", "Cross"], modern: ["Sun", "Moon", "Star", "Wave", "Flame"] };
  function tiles(R, o) {
    const cols = clamp(3 + Math.floor((o.diff || 3) / 2), 4, 6), rows = clamp(3 + Math.ceil((o.diff || 3) / 2), 4, 7), marks = (MARKS[o.tone] || MARKS.fantasy).slice(0, 4 + ((o.diff || 3) >= 4 ? 1 : 0)), k = clamp((o.diff || 3), 3, 4), seq = R.shuffle(marks.slice()).slice(0, k);
    for (let t = 0; t < 300; t++) {
      // the path: from the bottom row to the top, never back on itself
      const path = []; let x = R.int(0, cols - 1), y = rows - 1; path.push([x, y]); const seen = new Set([x + "," + y]);
      while (y > 0 && path.length < rows * cols) { const opts = [[x, y - 1], [x - 1, y], [x + 1, y]].filter(([a, b]) => a >= 0 && a < cols && !seen.has(a + "," + b)); if (!opts.length) break; const [a, b] = R.chance(.5) ? opts[0] : R.pick(opts); x = a; y = b; path.push([a, b]); seen.add(a + "," + b); }
      if (y !== 0) continue;
      const grid = [...Array(rows)].map(() => [...Array(cols)].map(() => R.pick(marks)));
      path.forEach(([a, b], i) => { grid[b][a] = seq[i % k]; });
      // count every way across that keeps to the order; change tiles off the path until there is only the one
      const ways = () => { let n = 0; const dfs = (a, b, i, vis) => { if (n > 1) return; if (grid[b][a] !== seq[i % k]) return; if (b === 0) { n++; return; } for (const [c, d] of [[a, b - 1], [a - 1, b], [a + 1, b], [a, b + 1]]) if (c >= 0 && d >= 0 && c < cols && d < rows && !vis.has(c + "," + d)) { vis.add(c + "," + d); dfs(c, d, i + 1, vis); vis.delete(c + "," + d); } }; for (let a = 0; a < cols; a++) dfs(a, rows - 1, 0, new Set([a + "," + (rows - 1)])); return n; };
      for (let fix = 0; fix < 60 && ways() > 1; fix++) { const off = []; for (let b = 0; b < rows; b++) for (let a = 0; a < cols; a++) if (!seen.has(a + "," + b)) off.push([a, b]); const [a, b] = R.pick(off); grid[b][a] = R.pick(marks); }
      if (ways() !== 1) continue;
      return { type: "tiles", data: { cols, rows, grid, seq, path }, check: { ok: true, unique: true, notes: `Every way across the ${cols}×${rows} floor followed; one keeps to the order ${seq.join(", ")}.` }, sol: `Step only on ${seq.join(", then ")}, over and over: ${path.map(([a, b]) => `${String.fromCharCode(65 + a)}${rows - b}`).join(" ")}`, ans: [seq.join(" ")] };
    }
    return null;
  }
  // a number sequence: its rule, and no other simple rule giving the same numbers and a different next one
  const SEQ = [
    ["add", (a, d) => k => a + d * k, "each is {d} more than the last"], ["double", (a) => k => a * 2 ** k, "each is twice the last"], ["triple", (a) => k => a * 3 ** k, "each is three times the last"],
    ["square", (a) => k => (k + a) ** 2, "they are the squares"], ["tri", (a) => k => (k + a) * (k + a + 1) / 2, "they are the triangle numbers"], ["fib", (a, d) => k => { let x = a, y = d; for (let i = 0; i < k; i++) [x, y] = [y, x + y]; return x; }, "each is the sum of the two before it"],
    ["alt", (a, d) => k => a + Math.floor((k + 1) / 2) * d + Math.floor(k / 2) * (d + 1), "they climb by {d}, then by {d1}, in turn"], ["dbl1", (a) => k => { let x = a; for (let i = 0; i < k; i++) x = x * 2 + 1; return x; }, "each is twice the last and one more"]
  ];
  function sequence(R, o) {
    const shown = 4 + ((o.diff || 3) >= 4 ? 1 : 0);
    const make = (r, a, d) => [...Array(shown + 1)].map((_, k) => r[1](a, d)(k));
    for (let t = 0; t < 200; t++) {
      const r = R.pick(SEQ.slice(0, clamp(3 + (o.diff || 3), 4, SEQ.length))), a = R.int(1, 6), d = R.int(2, 6), s = make(r, a, d);
      if (s.some(v => v > 400 || v < 1) || new Set(s).size < s.length) continue;
      // any other rule from the list that shows the same numbers but goes on differently would make it unfair
      let clash = null;
      for (const q of SEQ) for (let a2 = 0; a2 <= 12 && !clash; a2++) for (let d2 = 1; d2 <= 12 && !clash; d2++) { const s2 = make(q, a2, d2); if (s2.slice(0, shown).every((v, i) => v === s[i]) && s2[shown] !== s[shown]) clash = q[0]; }
      if (clash) continue;
      return { type: "sequence", data: { shown: s.slice(0, shown), next: s[shown], rule: r[2].replace("{d}", d).replace("{d1}", d + 1) }, check: { ok: true, unique: true, notes: `Checked against every simple rule (adding, doubling, tripling, squares, triangle numbers, sums of the two before, alternate steps): none gives these numbers and a different next one.` }, sol: String(s[shown]), ans: [String(s[shown])] };
    }
    return null;
  }
  // mirrors on a floor: turned the right way, they carry a beam from the light to the crystal; only one way does
  function mirrors(R, o) {
    const N = 5, nM = clamp(2 + (o.diff || 3), 3, 6);
    const step = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }, bounce = { "/": { e: "n", n: "e", w: "s", s: "w" }, "\\": { e: "s", s: "e", w: "n", n: "w" } };
    const run = (src, dir, M, target) => { let [x, y] = src, d = dir; const seen = new Set(); for (let k = 0; k < 60; k++) { x += step[d][0]; y += step[d][1]; if (x < 0 || y < 0 || x >= N || y >= N) return null; if (x === target[0] && y === target[1]) return true; const m = M.find(q => q.x === x && q.y === y); if (m) { d = bounce[m.o][d]; const key = x + "," + y + d; if (seen.has(key)) return null; seen.add(key); } } return null; };
    for (let t = 0; t < 400; t++) {
      // the beam's way, turning at each mirror
      const src = [-1, R.int(0, N - 1)]; let x = src[0], y = src[1], d = "e"; const M = [], used = new Set();
      for (let turns = 0; turns < 3 + (o.diff >= 4 ? 1 : 0); turns++) {
        const len = R.int(1, 3); for (let k = 0; k < len; k++) { x += step[d][0]; y += step[d][1]; }
        if (x < 0 || y < 0 || x >= N || y >= N || used.has(x + "," + y)) break;
        const nd = R.pick(d === "e" || d === "w" ? ["n", "s"] : ["e", "w"]), o2 = Object.keys(bounce).find(k => bounce[k][d] === nd);
        M.push({ x, y, o: o2 }); used.add(x + "," + y); d = nd;
      }
      if (M.length < 2) continue;
      let tx = x, ty = y; const len = R.int(1, 3); for (let k = 0; k < len; k++) { tx += step[d][0]; ty += step[d][1]; }
      if (tx < 0 || ty < 0 || tx >= N || ty >= N || used.has(tx + "," + ty)) continue;
      const target = [tx, ty];
      // the decoys
      while (M.length < nM) { const a = R.int(0, N - 1), b = R.int(0, N - 1); if (used.has(a + "," + b) || (a === tx && b === ty)) continue; used.add(a + "," + b); M.push({ x: a, y: b, o: R.pick(["/", "\\"]), decoy: 1 }); }
      if (!run(src, "e", M, target)) continue;
      // every way of turning them: the ways that reach the crystal must all turn the mirrors the beam touches alike
      const ways = []; for (let s = 0; s < 1 << M.length; s++) { const M2 = M.map((m, i) => Object.assign({}, m, { o: s >> i & 1 ? "\\" : "/" })); if (run(src, "e", M2, target)) ways.push(M2); }
      const touched = w => { const out = []; let [cx, cy] = src, dd = "e"; for (let k = 0; k < 60; k++) { cx += step[dd][0]; cy += step[dd][1]; if (cx === target[0] && cy === target[1]) break; const m = w.find(q => q.x === cx && q.y === cy); if (m) { out.push(m.x + "," + m.y + m.o); dd = bounce[m.o][dd]; } } return out.join("|"); };
      const kinds = new Set(ways.map(touched)); if (kinds.size !== 1) continue;
      const start = M.map(m => Object.assign({}, m, { o: R.chance(.5) ? "/" : "\\" })); if (run(src, "e", start, target)) continue;
      const cell = (a, b) => `${String.fromCharCode(65 + a)}${b + 1}`;
      return { type: "mirrors", data: { N, src, target, M, start }, check: { ok: true, unique: true, tried: 1 << M.length, notes: `All ${1 << M.length} ways of turning the mirrors tried; every way that lights the crystal turns the mirrors on the beam's path alike.` }, sol: "Turn " + M.filter(m => !m.decoy).map(m => `the mirror at ${cell(m.x, m.y)} to ${m.o === "/" ? "lean right (/)" : "lean left (\\)"}`).join("; ") + "; the others do not matter.", ans: [] };
    }
    return null;
  }
  // runes pressed in an order told by a verse
  const RUNES = {
    fantasy: [["Sun", "the sun went down"], ["Wave", "the sea rose to meet it"], ["Moon", "the moon climbed out of the water"], ["Star", "the stars came after"], ["Flame", "a fire was lit on the hill"], ["Root", "the old tree woke"], ["Crown", "the king was crowned"], ["Eye", "the watcher opened its eye"]],
    horror: [["Eye", "the eye opened"], ["Hand", "a hand reached up"], ["Worm", "the worm turned in the earth"], ["Key", "the key was turned"], ["Gate", "the gate swung wide"], ["Star", "the stars came right"], ["Mouth", "the mouth began to sing"], ["Crown", "the crown was set upon the drowned head"]],
    scifi: [["Circle", "the ring was closed"], ["Spiral", "the spiral turned"], ["Triangle", "the three points met"], ["Square", "the walls were raised"], ["Cross", "the paths crossed"], ["Star", "the star was lit"], ["Wave", "the signal went out"], ["Eye", "the sentinel woke"]]
  };
  function runes(R, o) {
    const set = R.shuffle((RUNES[o.tone] || RUNES.fantasy).slice()), k = clamp(2 + (o.diff || 3), 3, 5), seq = set.slice(0, k), extra = set.slice(k, k + 2);
    const words = ["First", "Then", "After that", "And then", "Last of all"];
    const verse = seq.map((r, i) => `${i === k - 1 ? words[4] : words[Math.min(i, 3)]} ${r[1]}.`).join(" ");
    // checked: the verse names every rune of the order, in the order, once each, and none of the others
    const at = seq.map(r => verse.indexOf(r[1])), ok = at.every((v, i) => v >= 0 && (!i || v > at[i - 1])) && extra.every(r => verse.indexOf(r[1]) < 0);
    return { type: "runes", data: { seq: seq.map(r => r[0]), all: R.shuffle(seq.concat(extra).map(r => r[0])), verse }, check: { ok, unique: ok, notes: ok ? `The verse names ${k} of the ${k + extra.length} ${D.w("runes", o.tone)}, each once, in order; it names none of the others.` : "The verse does not order the runes." }, sol: seq.map(r => r[0]).join(", then "), ans: [seq.map(r => r[0]).join(" ")] };
  }
  // words spoken to a door: carved somewhere the players pass first
  const PHRASE = { fantasy: [["Ithil", "dor", "anvaren"], ["Kael", "morra", "ves"], ["Ost", "harrow", "lin"]], horror: [["Ia", "ngah", "fhtagn"], ["Yr", "zhothal", "ka"], ["Ath", "naru", "sel"]], scifi: [["Seven", "nine", "zero"], ["Open", "the", "way"]], modern: [["Lux", "in", "tenebris"], ["Memento", "mori"]] };
  function password(R, o) {
    const ph = R.pick(PHRASE[o.tone] || PHRASE.fantasy).join(" "), half = R.chance(.5);
    return { type: "password", data: { phrase: ph, split: half }, needs: half ? 2 : 1, check: { ok: true, unique: true, notes: "The words are written where the players pass before the door (checked when the cave is made)." }, sol: `Speak the words "${ph}"`, ans: [ph.toLowerCase()] };
  }
  // what a guardian will take: something the cave itself gives, from a room the players reach first
  const OFFER = { lake: ["water from the still lake", "a cup of the dark water"], crystal: ["a shard of the grotto's crystal", "a crystal from the deep"], fungus: ["a glowing cap from the fungus garden", "the pale light that grows"], ossuary: ["a skull from the ossuary", "one of the old dead"], gold: ["a coin from the hoard", "gold"], lava: ["a stone still warm from the fire below", "warm stone"], moss: ["a handful of the green moss", "green moss"] };
  function offering(R, o) {
    const have = Object.keys(OFFER).filter(k => (o.features || []).includes(k));
    const k = have.length ? R.pick(have) : null; if (!k) return null;
    const [what, how] = OFFER[k];
    const ask = { lake: "Bring me what the dark keeps cold and still, in a cup.", crystal: "Bring me a splinter of the light that never burns.", fungus: "Bring me the lantern that grows.", ossuary: "Bring me one who went before you.", gold: "Bring me what kings die for, from the hoard below.", lava: "Bring me the stone that remembers the fire.", moss: "Bring me the carpet the water weaves." }[k];
    return { type: "offering", data: { feature: k, what, ask }, needs: 1, check: { ok: true, unique: true, notes: `The cave has ${what.replace(/^(a |the )/, "")} for the taking (checked when the cave is made).` }, sol: `Offer ${what}`, ans: [how] };
  }
  // an illusion among real things: one of them shows every sign of being real
  const TELLS = [["casts a shadow", "casts no shadow"], ["has dust lying on it", "has no dust on it at all"], ["rings dully when tapped", "makes no sound when tapped"], ["shows in the pool's reflection", "does not show in the pool's reflection"], ["is cold to the touch", "is neither warm nor cold, as if not there"], ["stirs the cobwebs near it", "has cobwebs passing through it"]];
  function illusion(R, o) {
    const things = { fantasy: ["iron chest", "stone idol", "silver mirror", "brass-bound door", "crowned statue"], horror: ["coffin", "idol", "mirror", "door", "carved figure"], scifi: ["crate", "terminal", "statue", "door", "sphere"], modern: ["chest", "idol", "mirror", "door", "statue"] }[o.tone] || ["chest", "idol", "mirror", "door"];
    const n = clamp(2 + (o.diff || 3), 3, 5), tells = R.shuffle(TELLS.slice()).slice(0, clamp(2 + Math.floor((o.diff || 3) / 2), 2, 4)), real = R.int(0, n - 1), thing = R.pick(things);
    const objs = [...Array(n)].map((_, i) => i === real ? tells.map(() => 1) : tells.map(() => R.chance(.6) ? 1 : 0));
    objs.forEach((x, i) => { if (i !== real && x.every(Boolean)) x[R.int(0, tells.length - 1)] = 0; });
    const fits = objs.filter(x => x.every(Boolean)).length;
    const lab = i => ["first", "second", "third", "fourth", "fifth"][i];
    return { type: "illusion", data: { thing, n, real, tells: tells, objs }, check: { ok: fits === 1, unique: fits === 1, notes: `${n} ${thing}s, each looked at for ${tells.length} signs; exactly ${fits} shows all of them.` }, sol: `The ${lab(real)} ${thing} is real; the others are illusions`, ans: [lab(real), String(real + 1)] };
  }
  // a spirit asks about the past: the answer is carved somewhere the players pass first, or is someone of the
  // campaign's own (then the question names only what the campaign says of them)
  const HIST = { fantasy: [["Ser Aldric", "sealed the deep door"], ["the Abbess Marrow", "drowned the lower halls"], ["King Oswin the Lame", "buried his crown here"], ["the mason Tobin", "cut the first steps"]], horror: [["Josiah Crane", "sealed the lower chamber"], ["Sister Agathe", "drowned the shrine"], ["the surveyor Abel Marsh", "walked into the dark and came back changed"]], scifi: [["Captain Ilse Varro", "sealed the deep lock"], ["the engineer Tomas Reyes", "cut the first tunnel"]], modern: [["Tom Hollis", "sealed the lower gallery"], ["Ada Brennan", "drowned the old workings"]] };
  function spirit(R, o) {
    const cast = Object.entries(A.castData || {}).filter(([, c]) => c && c.n && c.role);
    const roles = {}; cast.forEach(([, c]) => { const r = String(c.role).split(/[;,—(]/)[0].trim().toLowerCase(); roles[r] = (roles[r] || 0) + 1; });
    const fit = cast.filter(([, c]) => roles[String(c.role).split(/[;,—(]/)[0].trim().toLowerCase()] === 1);
    if (fit.length && R.chance(.5) && o.allowCast !== false) {
      const [cid, c] = R.pick(fit), role = String(c.role).split(/[;,—(]/)[0].trim();
      return { type: "spirit", data: { who: c.n, what: role, cast: cid }, needs: 0, links: [{ to: "cast:" + cid, rel: "concerns" }], check: { ok: true, unique: true, notes: `The campaign has one person who is "${role}": ${c.n}.` }, sol: c.n, ans: [c.n.toLowerCase(), c.n.split(/\s+/).pop().toLowerCase()] };
    }
    const [who, did] = R.pick(HIST[o.tone] || HIST.fantasy);
    return { type: "spirit", data: { who, what: did, gen: 1 }, needs: 1, check: { ok: true, unique: true, notes: "The name is carved where the players pass first (checked when the cave is made)." }, sol: who, ans: [who.toLowerCase(), who.split(/\s+/).pop().toLowerCase()] };
  }
  const PUZZLES = { statues, levers, weights, doors, tiles, sequence, mirrors, runes, password, offering, illusion, spirit };
  D.PUZZLES = Object.keys(PUZZLES);

  /* ---- what kinds there are, how elaborate each is, and the kind each belongs to */
  D.RIDDLE_KINDS = [
    ["verse", "A riddle in verse", "riddle", 1], ["statues", "Statues to set in order", "environment", 2], ["levers", "Levers and braziers", "logic", 2], ["weights", "Weights on a scale", "logic", 2],
    ["doors", "Doors whose inscriptions lie", "logic", 3], ["tiles", "A path across marked tiles", "environment", 3], ["sequence", "A sequence of numbers", "logic", 1], ["mirrors", "Mirrors and a beam of light", "environment", 4],
    ["runes", "Runes pressed in order", "magic", 2], ["password", "Words spoken to a door", "magic", 1], ["offering", "An offering to a guardian", "magic", 2], ["illusion", "An illusion among real things", "magic", 3], ["spirit", "A spirit's question about the past", "story", 2]
  ];
  D.RIDDLE_GROUPS = [["riddle", "Traditional riddles"], ["environment", "Puzzles in the room"], ["logic", "Logic puzzles"], ["magic", "Magical riddles"], ["story", "Questions of the story"]];

  /* ---- writing a riddle out from what it is: the players' words, the game master's, the hints */
  const SETTING = {
    verse: { fantasy: ["Words are cut into the lintel, in a hand older than the kingdom:", "Name me, and the stone will hear."], horror: ["Letters are scratched into the rock, filled in with something dark:", "Speak my name aloud."], scifi: ["Glyphs flicker across a cracked panel, and a voice reads them in a dead language you somehow understand:", "State the answer."], modern: ["Someone has painted words on the rock in careful capitals:", "SAY IT AND PASS."] }
  };
  function render(rec, R, o) {
    const t = o.tone || D.tone(), dt = rec.data || {}, near = o.near || "the chamber", W = k => D.w(k, t);
    const out = { pd: "", d: "", why: "", hints: [], props: [], layout: "" };
    switch (rec.type) {
      case "verse": {
        // the frame never names the answer (a riddle about stone does not end "the stone will hear")
        let [a, b] = SETTING.verse[t] || SETTING.verse.fantasy;
        const e = VERSE.find(x => x.a === dt.a), says = txt => (e ? e.alt : [dt.a]).some(w => names(txt, w));
        if (says(a)) a = "Words are cut here, beside the way:"; if (says(b)) b = "Answer, and pass.";
        out.pd = `${a}\n\n${dt.lines.map(l => l[0]).join("\n")}\n\n${b}`;
        out.d = `A riddle in verse, cut where the way is barred. The answer is ${dt.a}.`;
        out.why = `Each line names a trait of ${dt.a}: ${dt.lines.map(l => `"${l[0]}"`).join(" ")} ${dt.rules ? "Nothing else fits all of them: " + dt.rules.join("; ") + "." : ""}`;
        out.hints = dt.hints.slice();
        break;
      }
      case "statues": {
        const n = dt.figs.length;
        out.pd = `${Num(n)} plinths stand in a row, empty, and ${n} statues lie toppled around them: ${list(dt.figs.map(f => `${f[0]} with ${f[1]}`))}. Each plinth has a hollow fitted for a statue's base. Above them, worn into the rock:\n\n${dt.rules.join("\n")}`;
        out.d = `The statues must stand on the plinths, left to right, in one order. Each weighs about as much as a person and can be lifted by two.`;
        out.why = `Taken together the sayings allow only one order (left to right): ${dt.sol.map(i => dt.figs[i][0]).join(", ")}. Start from the sayings that fix a place, then the ones that join two figures.`;
        // the second hint fixes a figure the sayings do not place outright
        const k = Math.max(0, dt.sol.findIndex(f => !dt.rules.some(r => r.startsWith(cap(dt.figs[f][0])) && /place\.$/.test(r))));
        out.hints = ["Start with the sayings that fix a figure in a place, or at an end; the others hang from those.", `${cap(dt.figs[dt.sol[k]][0])} belongs in the ${ORD[k]} place.`, `From the left, the first two are ${dt.figs[dt.sol[0]][0]} and ${dt.figs[dt.sol[1]][0]}.`];
        out.props = dt.figs.map(f => ({ a: "statue-robed", n: `Statue of ${f[0]}` })).concat([{ a: "plinth", n: "Plinth", count: n }]);
        break;
      }
      case "levers": {
        const lit = [...Array(dt.m).keys()].map(j => dt.start >> j & 1 ? "lit" : "dark");
        out.pd = `${Num(dt.L.length)} iron levers stand in a row, marked ${list(dt.L)}. Across the chamber ${num(dt.m)} braziers stand before a sealed door; ${list(lit.map((s, j) => `the ${ORD[j]} is ${s}`))}. Each lever, pulled, lights some braziers and snuffs others. The door has a socket for every brazier's light.`;
        out.d = `Pulling a lever toggles its braziers (lit goes dark, dark lights). Pulling it again undoes it. The door opens when every brazier burns at once.`;
        out.layout = dt.L.map((l, i) => `${l}: ${[...Array(dt.m).keys()].filter(j => dt.rows[i] >> j & 1).map(j => ORD[j]).join(", ")}`).join("\n");
        out.why = `Each lever toggles: ${out.layout.replace(/\n/g, "; ")}. Pulling ${dt.solL} once each lights every brazier; no other set of pulls does (order does not matter, and pulling a lever twice undoes it).`;
        out.hints = ["Try one lever at a time and watch which braziers change.", "Pulling a lever twice is the same as never pulling it.", `One of the levers you need is ${dt.solL[0]}.`];
        out.props = dt.L.map(l => ({ a: "lever-floor", n: `Lever ${l}` })).concat([...Array(dt.m)].map(() => ({ a: "brazier-bowl", n: "Brazier" })));
        break;
      }
      case "weights": {
        out.pd = `A great stone scale hangs before the door, one pan empty. Carved over it: "Lay before me what weighs ${dt.target}, no more and no less." On a shelf sit ${num(dt.w.length)} small idols, each marked with pips: ${list(dt.w.map(String))}.`;
        out.d = `The idols weigh what their pips say. The pan must hold exactly ${dt.target}; any other weight tips the scale wrongly.`;
        out.why = `Of every set of idols, only ${list(dt.solW.map(String))} adds up to ${dt.target}.`;
        out.hints = ["The pips are the weight.", `You need ${dt.solW.length} idols.`, `One of them is the idol marked ${dt.solW[0]}.`];
        out.props = [{ a: "scale-great", n: "The great scale" }].concat(dt.w.map(w => ({ a: "idol-small", n: `Idol (${w} pips)` })));
        break;
      }
      case "doors": {
        const names = ["left", "middle", "right"];
        out.pd = `Three doors stand side by side, each with words carved on it.\n\nThe left door: "${dt.ins[0]}"\nThe middle door: "${dt.ins[1]}"\nThe right door: "${dt.ins[2]}"\n\nAbove them all: "${dt.rule} Only one door is safe."`;
        out.d = `One door leads on; the other two are false (see what lies behind them).`;
        out.why = `Suppose each door is the safe one in turn and count the true inscriptions: only the ${names[dt.safe]} door makes "${dt.rule}" hold.`;
        out.hints = ["Suppose each door in turn is the safe one.", "For each guess, count how many inscriptions would then be true.", `It is not the ${names[(dt.safe + 1) % 3]} door.`];
        out.props = [0, 1, 2].map(i => ({ a: "door-stone", n: `The ${names[i]} door` }));
        break;
      }
      case "tiles": {
        const g = dt.grid, rows = dt.rows;
        out.pd = `The floor ahead is laid with square tiles, ${dt.cols} across and ${rows} deep, each carved with a sign: ${list([...new Set(g.flat())])}. Bones lie on some of them. On the wall, a verse: "${dt.seq.map((s, i) => (i ? (i === dt.seq.length - 1 ? "and last " : "then ") : "Walk first ") + "where the " + s + " is").join(", ")}; begin again, and do not stray."`;
        out.d = `Stepping on a tile out of the order sets off the floor (see the linked trap). Moving diagonally is not allowed; one may step sideways or forward.`;
        out.layout = g.map((row, b) => `${rows - b} ` + row.map((s, a) => (dt.path.some(([x, y]) => x === a && y === b) ? "[" + s.slice(0, 2) + "]" : " " + s.slice(0, 2) + " ")).join("")).join("\n") + "\n  " + [...Array(dt.cols)].map((_, a) => " " + String.fromCharCode(65 + a) + "  ").join("");
        out.why = `Walking from the near edge and stepping only on ${dt.seq.join(", ")} in turn, there is exactly one way across (bracketed on the layout).`;
        out.hints = ["The verse is the order of the signs.", `The first step is on ${an(dt.seq[0])}.`, `The path starts at tile ${String.fromCharCode(65 + dt.path[0][0])}1.`];
        break;
      }
      case "sequence": {
        out.pd = `A row of stone discs is set into the wall, each with a number of notches: ${dt.shown.join(", ")}. The last socket is empty. Below, a heap of notched discs, from one notch to many.`;
        out.d = `The right disc completes the row and opens the way; a wrong one falls through and is gone.`;
        out.why = `The rule: ${dt.rule}. The next is ${dt.next}.`;
        out.hints = ["Look at how each number follows from the one before.", `The rule: ${dt.rule}.`, `It is more than ${dt.shown[dt.shown.length - 1]}.`];
        break;
      }
      case "mirrors": {
        const cell = (a, b) => `${String.fromCharCode(65 + a)}${b + 1}`, N = dt.N;
        out.pd = `A shaft of light falls through a crack into the chamber and strikes nothing. ${num(dt.M.length)} bronze mirrors on pivots stand about the floor, each turnable to lean one way or the other. Across the room, set in the wall, a cloudy crystal waits.`;
        out.d = `Turned the right way, the mirrors carry the beam from the crack to the crystal, which then opens the way. Mirrors off the beam's path change nothing.`;
        const at = (a, b) => { if (a === dt.target[0] && b === dt.target[1]) return " C "; const m = dt.M.find(q => q.x === a && q.y === b); return m ? ` ${m.o} ` : " . "; };
        out.layout = "    " + [...Array(N)].map((_, a) => " " + String.fromCharCode(65 + a) + " ").join("") + "\n" + [...Array(N)].map((_, b) => `${String(b + 1).padStart(2)} ${b === dt.src[1] ? "→" : " "}` + [...Array(N)].map((_, a) => at(a, b)).join("")).join("\n") + "\n(→ the light, C the crystal; mirrors as they must be turned)";
        out.why = `Following the beam from the crack, each mirror on its path turns it once; set as in the layout, it reaches the crystal. Every other way of turning the mirrors that the beam touches sends it into the walls.`;
        out.hints = ["Follow the beam from where it enters.", "Only the mirrors the beam touches matter.", `The first mirror the beam meets is at ${cell(dt.M[0].x, dt.M[0].y)}.`];
        out.props = dt.M.map(m => ({ a: "mirror-stand", n: `Mirror (${cell(m.x, m.y)})` })).concat([{ a: "crystals", n: "The crystal" }]);
        break;
      }
      case "runes": {
        out.pd = `${Num(dt.all.length)} ${W("runes")} are cut into the face of the door, each in its own round stone that gives a little under the hand: ${list(dt.all)}.${o.verseHere ? `\n\nBeneath them: "${dt.verse}"` : ""}`;
        out.d = `The stones must be pressed in one order; the verse that tells it ${o.verseHere ? "is beneath them" : "is carved elsewhere (see the clue it needs)"}. A wrong press lets every stone spring back.`;
        out.why = `The verse tells the order: "${dt.verse}" Each event is one ${W("rune")}: ${dt.seq.join(", ")}.`;
        out.hints = [o.verseHere ? "The verse is the order." : "Something you read earlier in these caves tells a story in order.", `The first is ${dt.seq[0]}.`, `The first two: ${dt.seq.slice(0, 2).join(", then ")}.`];
        out.props = dt.all.map(r => ({ a: "button-rune", n: `${r} stone` }));
        break;
      }
      case "password": {
        out.pd = `The door has no handle, no hinge and no keyhole. Across it, in letters that seem to move when not looked at directly: "Speak, and be known."`;
        out.d = `The door opens to the words "${dt.phrase}", spoken aloud. ${dt.split ? "They are carved in two places the players pass before the door, half in each." : "They are carved in a place the players pass before the door."}`;
        out.why = `The words are found earlier in the cave, worn but legible.`;
        out.hints = ["The door wants words, not force.", "Words like these were carved somewhere you have already been.", `They begin "${dt.phrase.split(" ")[0]}".`];
        break;
      }
      case "offering": {
        out.pd = `A figure of stone holds out its empty hands before the way on. A voice, or the memory of one, says: "${dt.ask}"`;
        out.d = `The guardian lets them pass when they lay ${dt.what} in its hands. Anything else is let fall.`;
        out.why = `The demand describes ${dt.what}, which the cave itself gives in a room the players reach first.`;
        out.hints = ["It wants something from these caves.", "You have seen it already, on your way here.", `It wants ${dt.what}.`];
        out.props = [{ a: "statue-robed", n: "The guardian" }];
        break;
      }
      case "illusion": {
        const lab = i => ["first", "second", "third", "fourth", "fifth"][i];
        out.pd = `${Num(dt.n)} ${dt.thing}s stand here, alike in every way the eye can tell at first. ${W("magical") === "magical" ? "Only one is real." : "Something about them is wrong."}`;
        out.d = `${Num(dt.n - 1)} of them are illusions. Looked at closely: ` + dt.objs.map((x, i) => `the ${lab(i)} ${x.map((v, k) => dt.tells[k][v ? 0 : 1]).join(", ")}`).join("; ") + ".";
        out.why = `Only the ${lab(dt.real)} ${dt.thing} shows every sign of a real thing (${dt.tells.map(x => x[0]).join(", ")}).`;
        out.hints = ["Illusions fool the eye, not the other senses.", `Check whether each ${dt.thing} ${dt.tells[0][0]}.`, `It is not the ${lab((dt.real + 1) % dt.n)}.`];
        break;
      }
      case "spirit": {
        out.pd = `The air goes cold, and a figure of mist stands where the way is narrowest. It asks, in a voice like water: "Who ${dt.what}? Name them, and I will rest."`;
        out.d = dt.cast ? `The answer is ${dt.who}, from the campaign itself.` : `The answer is ${dt.who}: the name is carved where the players pass first (the clue it needs).`;
        out.why = dt.cast ? `${dt.who} is the one the campaign calls "${dt.what}".` : `An inscription earlier in the cave names ${dt.who}, who ${dt.what}.`;
        out.hints = ["It asks about someone real.", dt.cast ? "Someone you have heard of in this story." : "A name carved somewhere you have been.", `The name begins with "${dt.who.replace(/^(the|ser|sister|captain|king)\s+/i, "")[0]}".`];
        break;
      }
    }
    return out;
  }

  /* ---- a riddle, made and checked. o: { type (or group), diff, tone, theme, features, near, verseHere, seed, at } */
  D.riddle = (o, R0) => {
    o = Object.assign({ diff: 3 }, o || {}); o.tone = o.tone || D.tone();
    const R = R0 || rng("riddle:" + (o.seed || Math.random()));
    let type = o.type;
    // how elaborate a puzzle may be follows how hard it should be: no mirror hall in a simple cave
    const pool = D.RIDDLE_KINDS.filter(k => (!o.group || k[2] === o.group) && k[3] <= Math.max(1, (o.diff || 3) + 1) && (!o.avoid || !o.avoid.includes(k[0])) && (o.allowNeeds !== false || !["password", "offering"].includes(k[0])));
    for (let attempt = 0; attempt < 16; attempt++) {
      if (!o.type) type = R.pick(pool.length ? pool : D.RIDDLE_KINDS).at(0);
      let rec;
      if (type === "verse") {
        const cands = VERSE.filter(e => !o.theme || e.th.includes(o.theme)), e = R.pick(cands.length ? cands : VERSE);
        const { chosen } = verseLines(e, R), chk = D.checkVerse(e, chosen);
        rec = { type: "verse", data: { a: e.a, lines: chosen, hints: e.hints, rules: chk.rules }, sol: cap(e.a), ans: e.alt.slice(), check: { ok: chk.ok, unique: chk.unique, notes: chk.notes || "Every look-alike answer is ruled out by a line: " + chk.rules.join("; ") + "." } };
      } else {
        const f = PUZZLES[type]; if (!f) return null;
        rec = f(R, o); if (!rec) { if (o.type) return null; continue; }
        if (type === "levers") rec.data.solL = rec.sol.replace(/^Pull /, "").replace(/ \(.*$/, "").split(/, | and /);
        if (type === "weights") rec.data.solW = [...Array(rec.data.w.length).keys()].filter(i => rec.data.sol >> i & 1).map(i => rec.data.w[i]);
        if (type === "runes") { rec.data.here = o.verseHere !== false && (o.allowNeeds === false || !o.layered); if (!rec.data.here) rec.needs = 1; o.verseHere = rec.data.here; }
      }
      if (!rec.check.ok) continue;
      if (o.allowNeeds === false && rec.needs) continue;
      const kind = (D.RIDDLE_KINDS.find(k => k[0] === type) || [])[2] || "riddle";
      const T = { verse: "A riddle at the door", statues: "The plinths", levers: "The braziers", weights: "The great scale", doors: "Three doors", tiles: "The marked floor", sequence: "The notched discs", mirrors: "The mirror hall", runes: `The ${D.w("rune", o.tone)} door`, password: "The door that listens", offering: "The empty hands", illusion: "Which is real?", spirit: "The question in the mist" }[type];
      const words = render(rec, R, o);
      const okText = o.ok || { verse: "The stone grinds aside.", statues: "When the last statue settles, the plinths sink a finger's breadth and the way opens.", levers: "With every brazier burning, the door's sockets glow and it swings in.", weights: "The scale settles level; somewhere a counterweight falls and the door lifts.", doors: "The safe door opens on the way on.", tiles: "They cross untouched.", sequence: "The disc locks home and the wall slides back.", mirrors: "The crystal blazes; the wall beneath it parts.", runes: "The last stone stays down and the door opens.", password: "The letters burn bright and the door is simply gone.", offering: "The hands close on it, and the guardian steps aside.", illusion: "The false ones fade like breath on glass.", spirit: "The figure bows its head and thins into the cold air." }[type];
      const failText = o.fail || { verse: "Nothing opens; a wrong answer echoes back mockingly.", statues: "A wrong order: the plinths do not move.", levers: "Nothing, until the door's patience ends (see the linked trap, if any).", weights: "The scale tips; the pan resets after a long minute.", doors: "A false door opens onto danger (the linked trap).", tiles: "A wrong step sets off the floor (the linked trap).", sequence: "The wrong disc drops into the dark.", mirrors: "The beam strikes stone, and nothing happens.", runes: "Every stone springs back with a crack.", password: "The door stays shut; the letters dim a little.", offering: "The hands open and let it fall.", illusion: "Touching a false one, the hand passes through; the room grows colder.", spirit: "The figure screams, and the cold bites (see the linked trap, if any)." }[type];
      return Object.assign({ t: o.t || T, kind, type, diff: clamp(Math.round(o.diff || 3), 1, 5), pd: words.pd, d: words.d, sol: rec.sol, why: words.why, ans: (rec.ans || []).filter(Boolean), hints: words.hints, ok: okText, fail: failText, props: words.props, layout: words.layout || "", data: rec.data, check: rec.check, needs: rec.needs || 0, links: rec.links || [], gen: 1 }, o.time ? { time: o.time } : {});
    }
    return null;
  };
  // the same riddle in new words (the same answer; a verse riddle gets other lines)
  D.reword = (rec, seed) => {
    const R = rng("reword:" + seed), o = { tone: D.tone(), diff: rec.diff, verseHere: rec.data && rec.data.here };
    if (rec.type === "verse") { const e = VERSE.find(x => x.a === rec.data.a); if (!e) return rec; const { chosen } = verseLines(e, R), chk = D.checkVerse(e, chosen); const data = Object.assign({}, rec.data, { lines: chosen, rules: chk.rules }); const w = render({ type: "verse", data }, R, o); return Object.assign({}, rec, { pd: w.pd, why: w.why, data, check: { ok: chk.ok, unique: chk.unique, notes: chk.notes || "Every look-alike answer is ruled out by a line." } }); }
    if (rec.type === "statues") { const data = Object.assign({}, rec.data, { rules: R.shuffle(rec.data.rules.slice()) }); const w = render({ type: "statues", data }, R, o); return Object.assign({}, rec, { pd: w.pd, data }); }
    const w = render({ type: rec.type, data: rec.data }, R, o); return Object.assign({}, rec, { pd: w.pd || rec.pd });
  };
  // a riddle checked as it stands (after the game master's edits): what makes it unfair
  D.validateRiddle = r => {
    const out = [];
    if (!r) return ["missing"];
    if (!String(r.pd || "").trim()) out.push("The players have nothing to read or see (no words for the players).");
    if (!String(r.sol || "").trim()) out.push("It has no answer.");
    if (!(r.hints || []).filter(h => String(h).trim()).length) out.push("It has no hint.");
    if (!String(r.ok || "").trim()) out.push("What happens when it is solved is not said.");
    if (!String(r.fail || "").trim()) out.push("What happens when it is failed is not said.");
    if (r.check && r.check.ok === false) out.push("Its solver found it ambiguous or unsolvable: " + (r.check.notes || ""));
    // the players' words must not hold an accepted answer, as a word of its own
    if (r.type === "verse" && (r.ans || [r.sol]).some(w => names(r.pd, w))) out.push("The players' words give the answer away.");
    return out;
  };
  // does a text name this answer (a whole word, without its "a" or "the")?
  function names(txt, w) { const k = String(w || "").toLowerCase().replace(/^(a|an|the|your|my) /, "").trim(); if (k.length < 3) return false; return new RegExp("\\b" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(String(txt || "")); }
})(ATLAS);
