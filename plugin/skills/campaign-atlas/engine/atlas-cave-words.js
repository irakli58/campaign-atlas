/* The words of a generated cave (atlas-cave.js): the levels' names, every chamber's and passage's name, and the guide
   for each room (what the players see, what it is for, its air and sound, what is in it, the rolls it asks, the game
   master's notes), written from what the room actually holds: its size and shape, its water, heights, drops, lava,
   crystals, fungus, the formations and things placed in it, what lives there, and where its ways lead. The cave's
   overview, the way to run it, the mouth to read aloud, its dangers and its secret doors. All of it is a draft for
   the game master: plain, editable, and marked as made with the cave. Runs without a browser. */
(function (A) {
  "use strict";
  const W = A.caveWords = {};
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const list = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const D = () => A.devices || { roll: (k, d) => k + " (" + d + ")", w: k => k, tone: () => "fantasy" };
  const roll = (k, d) => D().roll(k, d);
  const feet = m => { const g = (A.config || {}).grid || { unit: 5, name: "ft" }; return /ft|feet|foot/.test(g.name || "ft") ? `${+m.toFixed(1)} m (about ${Math.round(m * 3.28)} ft)` : `${+m.toFixed(1)} m`; };
  const pickNew = (R, opts, used) => { const free = opts.filter(o => !used.has(o)); const v = free.length ? R.pick(free) : null; if (v) used.add(v); return v; };

  /* ---- the levels */
  W.levelName = (g, li, n, s, R) => {
    if (n === 1) return { mine: "THE MINE", temple: "THE TEMPLE CAVES", ruin: "THE RUINED CAVES", lair: "THE LAIR", crystal: "THE CRYSTAL CAVES", fungal: "THE FUNGUS CAVES", flooded: "THE DROWNED CAVES", volcanic: "THE BURNING CAVES", magic: "THE SHINING CAVES", corrupted: "THE BLIGHTED CAVES" }[s.env] || "THE CAVES";
    if (li === 0) return { mine: "THE UPPER WORKINGS", temple: "THE OUTER HALLS", ruin: "THE UPPER RUINS" }[s.env] || R.pick(["THE UPPER CAVES", "THE NEAR CAVES", "THE FIRST CAVES"]);
    if (li === n - 1) return { mine: "THE DEEP WORKINGS", temple: "THE SANCTUM BELOW", ruin: "THE BURIED CITY", lair: "THE LAIR", volcanic: "THE FIRE BELOW", flooded: "THE DROWNED DEEP", corrupted: "THE HEART OF THE ROT", magic: "THE WELL OF LIGHT" }[s.env] || R.pick(["THE DEEPEST HALLS", "THE ABYSS", "THE BOTTOM OF THE WORLD"]);
    const wet = /lakes|flooded|submerged|waterfalls/.test(s.water);
    return wet ? R.pick(["THE DROWNED HALLS", "THE WATER GALLERIES"]) : s.geology === "volcanic" ? "THE ASH GALLERIES" : s.geology === "ice" ? "THE FROZEN DEEP" : s.geology === "crystal" ? "THE GLITTERING DEEP" : ["THE DEEP GALLERIES", "THE MIDDLE DEEPS", "THE LOWER CAVES"][li % 3];
  };

  /* ---- names */
  const ADJ = { limestone: ["Dripping", "Pale", "Fluted", "White", "Weeping"], volcanic: ["Ash", "Black", "Scorched", "Glass", "Cinder"], ice: ["Frozen", "Blue", "Rimed", "Glittering", "Cold"], crystal: ["Glittering", "Violet", "Shining", "Prism", "Bright"], sandstone: ["Red", "Ochre", "Banded", "Wind-cut", "Rust"], ancient: ["Black", "Old", "Silent", "Grey", "Hollow"] };
  const NOUN = { small: ["Hollow", "Pocket", "Niche", "Cell", "Nook"], medium: ["Chamber", "Grotto", "Hall", "Cave", "Room"], large: ["Cavern", "Gallery", "Vault", "Hall", "Chamber"] };
  const BY_FEAT = { lake: ["The Still Lake", "The Black Mere", "The Drowned Hall", "The Cold Pool"], falls: ["The Falls", "The Hall of Falling Water", "The Weeping Wall"], flooded: ["The Flooded Chamber", "The Sunken Hall"], chasm: ["The Chasm", "The Rift", "The Split Hall"], cliff: ["The Cliffs", "The High Ledges", "The Broken Floor"], ledge: ["The Ledges", "The Terraces", "The Step"], lava: ["The Burning Hall", "The Fire Pit", "The Red Hall"], crystal: ["The Crystal Grotto", "Glimmer Hall", "The Jewel Box"], fungus: ["The Fungus Garden", "The Glowing Wood", "The Mushroom Hall"], moss: ["The Mossy Hall", "The Green Cave"], blight: ["The Rotting Hall", "The Black Vein"], ice: ["The Ice Hall", "The Frozen Pool", "The Glass Floor"], stream: ["The Stream Hall", "The Wet Gallery", "The Ford"], collapse: ["The Fallen Hall", "The Broken Roof"], gravel: ["The Scree Hall", "The Loose Floor"], ruin: ["The Ruined Hall", "The Hall of Old Stones"], temple: ["The Temple Cavern", "The Hall of Pillars"], hut: ["The Camp Cavern", "The Workings"] };
  const BY_ROLE = {
    heart: () => ["The Great Cavern", "The Cathedral", "The Hall of Echoes", "The Vault of the Deep", "The Long Hall"], rest: () => ["The Dry Hollow", "The Sleeper's Nook", "The Quiet Pocket", "The Hermit's Hollow"], treasure: () => ["The Hoard", "The Vault", "The Strongroom", "The Reliquary", "The Gilded Pocket"],
    boss: s => ({ lair: ["The Lair", "The Bone Pit"], temple: ["The Inner Sanctum", "The Black Altar"], corrupted: ["The Heart of the Rot"], magic: ["The Well of Light"], volcanic: ["The Forge of the Deep"], ruin: ["The Throne Hall"], mine: ["The Deepest Working"], flooded: ["The Drowned Throne"], crystal: ["The Crystal Heart"], fungal: ["The Mould Garden"] }[s.env] || ["The Deepest Hall", "The Throne Hollow", "The Last Chamber"]),
    nest: () => ["The Nest", "The Brood Chamber", "The Den"], shrine: () => ["The Shrine", "The Chapel of the Deep", "The Idol's Niche"], descent: () => ["The Shaft Chamber", "The Way Down", "The Brink"],
    cache: () => ["The Hidden Cache", "The Secret Store"], hidden: () => ["The Secret Hollow", "The Hidden Room"], hideout: () => ["The Hideout", "The Smugglers' Hole"], ossuary: () => ["The Ossuary", "The Bone Niche"]
  };
  const TUN = { adj: ["Narrow", "Winding", "Low", "Dripping", "Twisting", "Crooked", "Sloping", "Dusty", "Echoing", "Cold", "Tight", "Long"], noun: ["Passage", "Tunnel", "Crawl", "Way", "Squeeze"], wide: ["Gallery", "Passage", "Tunnel", "Way"] };
  W.name = (levels, s, R) => {
    const used = new Set();
    levels.forEach(g => {
      
      g.rooms.forEach(r => {
        if (!r.id || r.type === "gone") return;
        const n = g.own.reduce((k, o) => k + (o === r.q ? 1 : 0), 0), size = n < 22 ? "small" : n < 70 ? "medium" : "large";
        r.size = n; r.sz = size;
        if (r.name) return;
        if (r.type === "outside") { r.name = r.hidden ? "A hidden hollow" : { grass: "The Hillside", snow: "The Snowfield", sand: s.geology === "volcanic" ? "The Ash Slope" : "The Dunes", forest: "The Forest Edge" }[r.kind] || "Outside"; return; }
        if (r.type === "built") { r.name = { temple: ["The Sanctum", "The Vestry", "The Ossuary"], ruin: ["The Ruined Hall", "The Guardroom", "The Storeroom"], hut: ["The Foreman's Hut", "The Tool Store"], gate: ["The Sealed Door"] }[r.built][r.part || 0] || "The Old Room"; return; }
        if (r.type === "tunnel" || r.type === "spur") {
          if (r.role === "entrance") { r.name = s.env === "mine" ? "The Adit" : "The Cave Mouth"; return; }
          if (r.role === "onward") { r.name = "The Way On"; return; }
          if (r.role === "hidden exit") { r.name = "The Hidden Way Out"; return; }
          if (r.role === "secret way") { r.name = "A Secret Way"; return; }
          if (r.feats.includes("submerged")) { r.name = R.pick(["The Sump", "The Drowned Passage", "The Water Crawl"]); return; }
          if (r.feats.includes("collapse")) { r.name = "The Blocked Passage"; return; }
          if (r.type === "spur" || r.deadEnd) { r.name = R.pick(["Dead End", "Blind Passage", "The Cul-de-sac", "A Passage to Nowhere"]); return; }
          if (r.bottleneck) { const v = pickNew(R, ["The Neck", "The Throat", "The Gap", "The Needle's Eye", "The Narrows"], used); if (v) { r.name = v; return; } }
          if (s.env === "mine") { r.name = R.pick(["Main Drift", "Haulage Way", "Crosscut", "The Old Drift", "Side Drift"]); return; }
          const wide = n / Math.max(1, Math.sqrt(n)) > 2.6;
          r.name = R.pick(r.feats.includes("stream") ? ["Wet", "Streaming", "Dripping"] : r.feats.includes("lava") ? ["Burning", "Hot"] : TUN.adj) + " " + R.pick(wide ? TUN.wide : TUN.noun);
          return;
        }
        // chambers: their role, else their most telling feature, else their stone and size
        const roleNames = r.role && BY_ROLE[r.role] ? BY_ROLE[r.role](s) : null;
        let v = roleNames ? pickNew(R, roleNames, used) : null;
        if (!v && r.anchor) v = pickNew(R, ["The Foot of the Shaft", "The Landing", "The Shaft's Bottom"], used);
        for (const f of ["lake", "falls", "flooded", "chasm", "cliff", "lava", "crystal", "fungus", "ruin", "temple", "hut", "ice", "ledge", "blight", "stream", "collapse", "moss", "gravel"]) { if (v) break; if (r.feats.includes(f) && R.chance(.85)) v = pickNew(R, BY_FEAT[f], used); }
        for (let t = 0; t < 8 && !v; t++) { const a = R.pick(ADJ[s.geology] || ADJ.limestone), n = R.pick(NOUN[size]), c = "The " + a + " " + n; if (a !== n && !used.has(c)) { used.add(c); v = c; } }
        r.name = v || "The " + R.pick(NOUN[size]) + " " + r.id;
      });
    });
  };

  /* ---- what each room is like, read aloud; and the rest of its guide */
  const SIZE = {
    small: ["A cramped hollow", "A low pocket in the rock", "A small chamber", "A tight, round hollow"],
    medium: ["A chamber of fair size", "A rounded chamber", "A crooked chamber", "A long, low chamber"],
    large: ["A great cavern", "A broad hall of rock", "A vaulted cavern", "A long gallery"],
    huge: ["A cavern vast enough to swallow a church", "An immense hollow whose far side is lost to the light", "A hall of rock too big for any lantern"]
  };
  const TUNNEL = { narrow: ["A narrow passage", "A tight crawl", "A twisting passage barely wide enough for one", "A low tunnel where the tall must stoop"], wide: ["A broad passage", "A wide tunnel", "A gallery wide enough for three abreast"] };
  const ROCK = {
    limestone: ["pale limestone, streaked with ochre and wet", "smooth, water-worn limestone", "white limestone hanging in folds like curtains", "grey limestone, slick with damp"],
    volcanic: ["black, glassy basalt", "rough rock folded like cooled porridge", "dark basalt veined with red", "pitted black stone"],
    ice: ["grey rock sheathed in blue ice", "rock and old ice fused together", "glittering, frost-furred stone"],
    crystal: ["rock studded with crystals", "grey stone glittering with violet crystal", "rock that sparkles at the touch of light"],
    sandstone: ["red sandstone in soft bands", "ochre rock carved smooth by old water", "crumbling, banded sandstone"],
    ancient: ["black rock older than anything above it", "dark, glassy stone that drinks the light", "grey-black stone, cold to the touch"]
  };
  const FEAT = {
    lake: ["Most of the floor is a still, black lake; a lip of stone runs round its edge.", "A lake fills the middle of the chamber, so clear its bottom seems a hand away, and so cold it hurts.", "Dark water lies across the floor, unmoving, with a shelf of wet rock around it."],
    falls: ["Water pours from a crack high in the wall into a churning pool, and the roar fills the chamber.", "A thin waterfall spills from the dark above and shatters on the rocks below."],
    flooded: ["Water has risen into the chamber: it stands waist-deep at the edges and deeper in the middle.", "The chamber is flooded, the water black and still, with only a ledge or two above it."],
    submerged: ["The passage dips under the water: the only way on is to hold one's breath and swim.", "The roof comes down to meet the water; beyond, the passage is drowned."],
    stream: ["A shallow stream chatters across the floor and is gone under the far wall.", "A stream runs through, ankle-deep and cold, and has worn a channel in the floor."],
    chasm: ["A chasm splits the floor; a stone dropped into it falls a long time before it strikes.", "A crack in the floor opens onto nothing, and cold air breathes up out of it."],
    bridge: ["A narrow bridge crosses it.", "A span of stone bridges it at its narrowest."],
    ledge: ["Part of the floor rises in a shelf above the rest.", "A ledge runs along one side, higher than a person."],
    ramp: ["A slope of broken rock leads up to it."], climb: ["The only way up is a climb; an old rope hangs down."],
    cliff: ["The floor breaks off in a sheer drop.", "One side of the chamber stands high above the other on a cliff of bare rock."],
    lava: ["Lava glows in a crack across the floor, and the air shimmers above it.", "A pool of lava lights the chamber red; the heat is like an open oven."],
    crystal: ["Crystals as long as a forearm jut from the walls, catching any light and throwing it back in colours.", "Clusters of crystal grow from the floor like frozen flames."],
    fungus: ["Pale fungus grows in shelves up the walls, glowing faintly blue.", "Mushrooms taller than a man stand in a crowd, their caps dripping."],
    moss: ["Damp moss carpets the floor and muffles every step."], blight: ["Black veins run through the rock as if something were growing in it, and the stone gives under a hand."],
    ice: ["The floor is sheathed in ice, glassy and treacherous.", "Ice coats the walls in frozen waves."], gravel: ["Loose scree covers the floor and shifts underfoot."],
    collapse: ["Part of the roof has fallen: a slope of rubble blocks the way on."],
    pillars: ["Thick columns of rock hold up the roof.", "Pillars of living rock stand about the floor like the trunks of a stone forest."]
  };
  const PROP = { stalagmites: "Stalagmites rise from the floor, and stalactites hang in ranks above them.", stalactites: "Stalactites hang in ranks from the roof.", flowstone: "Flowstone pours down one wall in frozen folds.", "cave-pillar": "Where a stalactite and a stalagmite have met, a column stands.", bones: "Bones litter the floor, cracked open for the marrow.", skulls: "Skulls are piled against the wall.", "mine-props": "Old timber props hold up the roof, grey with rot.", "mine-cart": "A rusted cart stands on a stretch of broken rail.", "ruin-drums": "Worked stone lies among the natural rock: a fallen column in pieces.", "ruin-head": "A great carved head lies half buried, staring at the roof.", glowworms: "Threads of light hang from the roof where glowworms wait.", "egg-sacs": "Pale egg sacs cluster in the cracks.", cobwebs: "Webs thick as sailcloth hang across the corners.", roots: "Roots have broken through the roof and hang down like ropes.", campfire: "Someone has made a fire here before: a ring of stones, old ash.", "chest-treasure": "A chest stands against the wall.", "altar-stone": "A rough altar stands at the far end.", "altar-dark": "A black altar stands at the far end, stained dark.", "standing-stone": "A standing stone has been raised here, by hands, not water.", "vent-steam": "Steam hisses from cracks in the floor.", "ice-spikes": "Spikes of ice grow from the floor.", "pool-lava": "Molten rock bubbles in a pool.", "pool-cave": "A clear pool lies in a hollow of the floor.", waterfall: "" };
  const LIGHT = { dark: "Beyond your light there is nothing at all.", dim: "A grey half-light seeps down from cracks somewhere far above.", biolum: "Everything glows faintly blue-green with the life on the walls.", magic: "Motes of pale light drift in the air, from nowhere.", lava: "Everything is lit red from below.", torch: "Old torches burn in iron brackets, though no one is here to tend them." };
  const SOUND = { limestone: ["Water drips somewhere, slow and steady.", "Every footstep echoes twice."], volcanic: ["Rock ticks and cracks as it cools.", "A low rumble comes up through the floor."], ice: ["Ice creaks and groans.", "A thin, high singing comes from the ice."], crystal: ["The crystals ring faintly when anyone speaks.", "A hum, too low to hear, felt in the teeth."], sandstone: ["Sand whispers down the walls.", "A dry wind moans in the passages."], ancient: ["There is no sound at all, and that is worse.", "A slow, deep pulse, like something breathing far below."] };
  const SMELL = { limestone: "It smells of wet stone.", volcanic: "The air stinks of sulphur.", ice: "The cold burns the nose.", crystal: "The air is dry and smells of nothing.", sandstone: "It smells of dust and old heat.", ancient: "It smells of age, like a shut room." };
  const ENV_AIR = { lair: "It reeks of animal and old meat.", fungal: "The air is thick and sweet with spores.", corrupted: "There is a smell of rot that seems to come from the rock itself.", mine: "It smells of old timber, rust and lamp oil.", temple: "There is a ghost of old incense.", magic: "The air prickles like before a storm.", flooded: "Everything is wet; the air is heavy with it.", volcanic: "The heat makes it hard to breathe." };
  const PUR = { entrance: "The way in from the surface.", onward: "Leads on into the wider caves, beyond this map.", "hidden exit": "A hidden way out to the surface.", heart: "The heart of the caves: most ways cross here.", rest: "A safe place to rest: hard to find, easy to defend.", treasure: "Where the cave's treasure lies.", boss: "The end of the caves, where the worst of it waits.", nest: "Where the things that live here breed.", shrine: "A place of worship, older than anyone remembers.", ruin: "What is left of something built here long ago.", camp: "Where the miners lived and stored their tools.", gate: "A door made to keep the way shut.", "secret way": "A hidden way, behind a secret door.", cache: "A hiding place for something of value.", hidden: "A hidden room, found only through a secret door.", hideout: "Where someone once lived in hiding.", ossuary: "Where the dead were laid away." };
  const FINDS = ["an old lantern, empty and dented", "a boot, with nothing in it", "scratch marks counting days on the wall", "a few candle stubs wedged in a crack", "a broken pick handle", "a coin from a kingdom no one remembers", "a child's carved toy, worn smooth", "a frayed rope tied off to a spike", "a chalk arrow on the wall, pointing back the way they came", "a torn page of a journal, the ink run", "a rusted knife", "the ashes of a fire, and a burned map"];
  const nbNames = (g, r, adj, seen) => [...adj[r.q]].map(q => g.rooms[q]).filter(o => o && o.id && o.type !== "gone" && (!seen || !o.hidden)).map(o => `${o.id} ${o.name || ""}`.trim());
  W.describe = (map, levels, s, R) => {
    const Dv = D(), dz = { safe: 2, moderate: 3, dangerous: 3, deadly: 4 }[s.danger] || 3, tone = Dv.tone ? Dv.tone() : "fantasy";
    const props = new Map(); levels.forEach(g => g.props.forEach(p => { if (p.c == null) return; const q = g.own[p.c]; if (q < 0) return; const k = g.li + ":" + q; if (!props.has(k)) props.set(k, []); props.get(k).push(p.a); }));
    const marks = {}; levels.forEach(g => g.marks.forEach(m => { const c = Math.floor(m[2]) * g.W + Math.floor(m[1]), q = g.own[c]; if (q < 0) return; const id = g.rooms[q].id; (marks[id] = marks[id] || []).push(m[0]); }));
    const rooms = map.rooms;
    levels.forEach((g, li) => {
      const adj = (A.cave && A.cave._graph) ? A.cave._graph(g) : null;
      g.rooms.forEach(r => {
        if (!r.id || !/^R\d/.test(r.id) || r.type === "gone") return;
        const n = r.size || 1, f = r.feats || [], ps = props.get(li + ":" + r.q) || [], nb = adj ? nbNames(g, r, adj) : [], nbSeen = adj ? nbNames(g, r, adj, true) : [];
        const geo = s.geology, sz = n >= 160 ? "huge" : n >= 70 ? "large" : n >= 22 ? "medium" : "small";
        // what they see
        const bits = [];
        if (r.type === "built") bits.push(builtD(r, s, R));
        else if (r.type === "tunnel" || r.type === "spur") bits.push(`${R.pick(TUNNEL[n / Math.max(1, Math.sqrt(n)) > 2.6 ? "wide" : "narrow"])} through ${R.pick(ROCK[geo] || ROCK.limestone)}.`);
        else bits.push(`${R.pick(SIZE[sz])}${sz === "huge" ? ", its walls" : ""} of ${R.pick(ROCK[geo] || ROCK.limestone)}.`);
        const fe = ["falls", "lake", "flooded", "submerged", "chasm", "cliff", "ledge", "lava", "stream", "crystal", "fungus", "ice", "blight", "moss", "collapse", "gravel"].filter(k => f.includes(k));
        for (const k of fe.slice(0, 2)) { bits.push(R.pick(FEAT[k])); if (k === "chasm" && cellHas(g, r.q, "bridge")) bits.push(R.pick(FEAT.bridge)); if ((k === "ledge" || k === "cliff") && f.includes("ramp")) bits.push(FEAT.ramp[0]); if ((k === "ledge" || k === "cliff") && f.includes("climb")) bits.push(FEAT.climb[0]); }
        if (r.type === "chamber" && pillars(g, r.q) && bits.length < 3) bits.push(R.pick(FEAT.pillars));
        const pd = [...new Set(ps)].map(a => PROP[a]).filter(Boolean); if (pd.length && bits.length < 4) bits.push(R.pick(pd));
        if (r.role === "rest") bits.push("It is dry here, and quieter than the rest.");
        // its air
        const atm = [R.pick(SOUND[geo] || SOUND.limestone), ENV_AIR[s.env] || SMELL[geo] || "", f.includes("falls") ? "The water's roar drowns every other sound." : f.includes("lava") ? "The heat beats on the face." : "", LIGHT[s.light] || ""].filter(Boolean).join(" ");
        // what it is for
        const pur = PUR[r.role] || (r.anchor ? "Where the way down from the level above comes out." : (r.bottleneck ? "A narrow place every way through must pass: two can hold it against many." : r.type === "tunnel" && nbSeen.length >= 2 ? `Joins ${list(nbSeen.slice(0, 3))}.` : r.type === "spur" || r.deadEnd ? "A dead end." : nbSeen.length ? `A chamber on the way between ${list(nbSeen.slice(0, 3))}.` : "A chamber of the caves."));
        // what is in it (for the game master)
        const obj = [];
        if (f.includes("lake") || f.includes("flooded")) obj.push("The water is deep in the middle (swimming) and waist-deep at the edges.");
        if (f.includes("submerged")) obj.push("The passage is drowned for its whole length: a long held breath, or a rope and a strong swimmer to lead.");
        if (f.includes("chasm")) obj.push("The chasm is deep enough to kill: a fall is a long one, unless the game master puts water at its bottom.");
        if (r.hi) obj.push(`The high ground stands ${feet(r.hi)} above the rest.`);
        if (f.includes("lava")) obj.push("The lava burns whatever touches it; it cannot be crossed except by the bridge or the rim.");
        if (ps.length) obj.push("Here: " + list([...new Set(ps)].map(a => modelName(a))) + ".");
        if (r.role === "treasure") obj.push("The treasure lies here: choose it to suit your game and the party's level.");
        if (r.type === "chamber" && !r.role && R.chance(.35)) obj.push(cap(R.pick(FINDS)) + ", left by someone who came before.");
        const devs = (marks[r.id] || []).filter(m => /^[TPESC]\d/.test(m)).map(m => `${m}${(map.traps[m] || map.riddles[m] || map.enc[m] || map.secrets[m] || map.clues[m] || {}).t ? " " + (map.traps[m] || map.riddles[m] || map.enc[m] || map.secrets[m] || map.clues[m]).t : ""}`);
        if (devs.length) obj.push("Marked on the map: " + devs.join("; ") + ".");
        if (!obj.length) obj.push(r.type === "tunnel" ? "Nothing but the passage itself." : "Rock, and the dark.");
        // the rolls it asks
        const chk = [];
        if (f.includes("climb") || f.includes("cliff")) chk.push(`Climbing up or down: ${roll("climb", f.includes("cliff") ? dz + 1 : dz)}.`);
        if (f.includes("ledge") && !f.includes("climb")) chk.push(`Up the slope to the ledge: no roll, unless in a hurry (${roll("athletics", 2)}).`);
        if (f.includes("ice")) chk.push(`Crossing the ice in a hurry: ${roll("balance", dz)}.`);
        if (f.includes("lake") || f.includes("flooded")) chk.push(`Swimming the deep water: ${roll("swim", 2)}; in armour, ${roll("swim", 4)}.`);
        if (f.includes("submerged")) chk.push(`Swimming the drowned passage: ${roll("swim", dz)}, and ${roll("endure", dz)} to hold one's breath to the end.`);
        if (f.includes("chasm") && cellHas(g, r.q, "bridge")) chk.push(`Crossing the bridge in a fight or a rush: ${roll("balance", dz)}.`);
        if (f.includes("stream")) chk.push("Following the stream leads to the next chamber it runs through.");
        if ((marks[r.id] || []).some(m => /^S\d/.test(m))) chk.push(`Finding the hidden door: ${roll("search", dz + 1)}.`);
        if (s.explore === "maze" || s.explore === "confusing") chk.push(`Keeping track of the way back: ${roll("navigate", s.explore === "maze" ? 4 : 3)}.`);
        chk.push(`Listening for what is ahead: ${roll("listen", 2)}.`);
        // the game master's notes
        const kp = [];
        if (nb.length) kp.push("Ways out: " + nb.join("; ") + ".");
        if (r.bottleneck) kp.push("A bottleneck: the whole cave beyond depends on it.");
        if (r.sw) kp.push("This passage is meant to be swum: it is the only way to what lies beyond it, on purpose.");
        if (r.hidden) kp.push("Hidden: not on the players' map until they find the secret door.");
        if (r.role === "rest") kp.push("The safest place in the caves to rest: nothing comes here unless led.");
        if (r.role === "boss") kp.push("The climax of the caves: give it the campaign's own villain or thing, if it has one.");
        if (r.enc) kp.push(`${r.enc} lives here.`);
        rooms[r.id] = Object.assign(rooms[r.id] || {}, { d: bits.join(" "), pur, atm, obj: obj.join(" "), chk: chk.join(" "), kp: kp.join(" ") || "Nothing more.", gen: 1 });
      });
      const F = map.floors[li];
      if (F) {
        const live = g.rooms.filter(r => r.id && /^R\d/.test(r.id) && r.type !== "gone"), ch = live.filter(r => r.type === "chamber").length, key = live.filter(r => ["boss", "treasure", "rest", "heart", "shrine", "nest"].includes(r.role)).map(r => `${r.id} ${r.name} (${({ boss: "the end", treasure: "the treasure", rest: "a safe rest", heart: "the heart", shrine: "a shrine", nest: "the nest" })[r.role]})`);
        const down = (F.ST || []).filter(st => st[5] === "down").map(st => `${st[0]} ${st[8] || ""}`.trim()), up = (F.ST || []).filter(st => st[5] === "up").map(st => st[0]);
        F.note = [`${ch} chambers and ${live.length - ch} passages.`, key.length ? "Key places: " + key.join("; ") + "." : "", down.length ? "Down: " + down.join(", ") + "." : "", up.length ? "Up: " + up.join(", ") + "." : ""].filter(Boolean).join(" ");
      }
    });
    // the whole cave
    const nL = levels.length, all = levels.flatMap(g => g.rooms.filter(r => r.id && /^R\d/.test(r.id) && r.type !== "gone"));
    const nCh = all.filter(r => r.type === "chamber").length, nPa = all.filter(r => r.type === "tunnel" || r.type === "spur").length;
    const envW = { natural: "natural cave", lair: "monster's lair", ruin: "cave around an ancient ruin", mine: "abandoned mine", temple: "underground temple", magic: "magical cavern", fungal: "fungal cave", crystal: "crystal cave", flooded: "flooded cave", volcanic: "volcanic cave", corrupted: "corrupted cave" }[s.env] || "cave";
    const boss = all.find(r => r.role === "boss"), tre = all.find(r => r.role === "treasure"), rest = all.find(r => r.role === "rest"), ent = all.find(r => r.role === "entrance");
    const feats = {}; all.forEach(r => (r.feats || []).forEach(f => { feats[f] = (feats[f] || 0) + 1; }));
    const fw = Object.entries({ lake: "lakes", falls: "waterfalls", flooded: "flooded chambers", submerged: "drowned passages", chasm: "chasms", cliff: "cliffs", ledge: "ledges", lava: "lava", crystal: "crystal", fungus: "fungus", ice: "ice", collapse: "fallen passages", ruin: "a ruin", temple: "a temple", hut: "the miners' camp" }).filter(([k]) => feats[k]).map(([, w]) => w);
    const T = Object.keys(map.traps || {}).length, P = Object.keys(map.riddles || {}).length, E = Object.keys(map.enc || {}).length, S = Object.keys(map.secrets || {}).length;
    map.ov = `${/^[aeiou]/.test(envW) ? "An" : "A"} ${envW} of ${nL === 1 ? "one level" : nL + " levels"}, cut in ${({ limestone: "limestone", volcanic: "volcanic rock", ice: "ice and rock", crystal: "crystal-shot rock", sandstone: "sandstone", ancient: "ancient black rock" })[s.geology]}: ${nCh} chambers and ${nPa} passages${fw.length ? ", with " + list(fw) : ""}.${ent ? ` It is entered by ${ent.id} ${ent.name}.` : ""}${rest ? ` The safest place to rest is ${rest.id} ${rest.name}.` : ""}${tre ? ` Its treasure lies in ${tre.id} ${tre.name}${tre.hidden ? ", behind a secret door" : ""}.` : ""}${boss ? ` It ends in ${boss.id} ${boss.name}.` : ""} ${T ? T + " trap" + (T > 1 ? "s" : "") : "No traps"}, ${P ? P + " riddle" + (P > 1 ? "s" : "") + " or puzzle" + (P > 1 ? "s" : "") : "no riddles"}, ${E ? E + " encounter" + (E > 1 ? "s" : "") : "no encounters"}, ${S ? S + " secret door" + (S > 1 ? "s" : "") : "no secret doors"}. Made with the cave generator from the seed "${s.seed}": everything here is a draft, yours to change.`;
    map.run = [s.light === "dark" ? "There is no light but what the party brings: count torches and oil." : s.light === "dim" ? "There is a little light, enough to move by but not to read or to search well." : "The cave gives its own light; a lantern still shows more.", s.explore === "maze" ? "It is a maze: let the players map it, and ask for navigation rolls in the passages." : s.explore === "confusing" ? "Passages look alike; a careless party loses its way." : "", S ? "Secret doors (S) open on hidden places; they are not on the players' map until found." : "", T || P ? "Traps (T) and riddles (P) are marked for you only; each lists its signs, its rolls and what it is joined to." : "", "Every room was checked to be reachable from the way in; what is reached only by swimming or through a secret door is meant so."].filter(Boolean).join(" ");
    map.ext = ({ mine: "A timber-framed opening in the hillside, its beams black with age. Rails run out of it and stop at a heap of spoil. Cold air breathes out of the dark.", temple: "Half buried in the slope, a doorway of carved stone, its carvings worn to ghosts. Beyond it, steps go down into the dark.", ruin: "A broken arch of dressed stone stands at the mouth of a cave, as if the hill had grown over a building.", lair: "A cave mouth in the rock, the ground before it trampled bare and scattered with bones.", volcanic: "A crack in black rock, warm air rolling out of it with a smell of sulphur.", flooded: "A cave mouth at the water's edge, the water running into it.", crystal: "A cave mouth whose edges glitter, as if the rock had been dusted with glass.", fungal: "A cave mouth fringed with pale mushrooms, breathing a sweet, damp air.", corrupted: "A cave mouth where nothing grows, the rock around it stained black.", magic: "A cave mouth from which a faint light comes, though it is dark inside." })[s.env] || ({ ice: "A mouth of blue ice in the mountainside, cold beyond cold breathing out of it.", sandstone: "A dark opening in a red cliff, sand drifted into its mouth." })[s.geology] || "A dark mouth in the rock, cold air breathing out of it.";
  };
  function builtD(r, s, R) {
    if (r.built === "gate") return "The passage is closed by a door of fitted stone, set in a frame of dressed blocks.";
    if (r.built === "temple") return r.part ? R.pick(["A small room of dressed stone behind the sanctum.", "A side room, its walls carved with worn figures."]) : R.pick(["Dressed stone walls rise inside the cavern: a temple, its floor of polished stone.", "A temple of fitted stone stands within the cave, its doorway flanked by carved figures."]);
    if (r.built === "ruin") return r.part ? R.pick(["A roofless room of old masonry.", "A small room of fallen stone."]) : R.pick(["The walls of an ancient building stand inside the cavern, roofless, their stones fitted without mortar.", "A ruin of dressed stone, half swallowed by the cave."]);
    if (r.built === "hut") return r.part ? "A store of planks and nails, its shelves fallen." : "A hut of rough planks built against the rock, its door hanging.";
    return "A room of worked stone.";
  }
  const cellHas = (g, q, kind) => { for (let c = 0; c < g.W * g.H; c++) if (g.own[c] === q && g.kind[c] === kind) return true; return false; };
  const pillars = (g, q) => { let n = 0; for (let c = g.W; c < g.W * (g.H - 1); c++) { if (g.own[c] >= 0) continue; const x = c % g.W; if (x < 1 || x >= g.W - 1) continue; if (g.own[c - 1] === q && g.own[c + 1] === q && g.own[c - g.W] === q && g.own[c + g.W] === q) n++; } return n; };
  const modelName = a => { const e = A.models && A.models.entry ? A.models.entry(a) : null; return e ? e.n.toLowerCase() : a.replace(/-/g, " "); };

  /* ---- what lives here (the game master gives it stats from their own game) */
  const ENC = {
    fantasy: { natural: ["A cave bear and her cubs", "A nest of giant spiders", "A great cloud of bats", "A pack of cave wolves", "Blind crawlers from the deep", "A troll sleeping off a meal"], lair: ["Its young", "Scavengers picking at its leavings", "Its old kills, not all of them dead"], ruin: ["Skeletal guardians, still at their posts", "Bandits camped in the ruins", "A ghost that walks the old halls"], mine: ["Kobolds who took over the workings", "The miners who never left", "A rock-eating worm"], temple: ["Cultists at their rites", "Temple guardians of stone", "The priest who stayed"], magic: ["A wandering elemental", "Living crystal", "Wisps that lead travellers astray"], fungal: ["Fungus folk", "The dead, worked like puppets by the fungus", "Shriekers that call the others"], crystal: ["Crystal spiders", "A gem-hungry young dragon"], flooded: ["Something in the water", "Eels as long as a boat", "The drowned dead"], volcanic: ["Fire beetles", "A salamander", "Little imps of smoke and magma"], corrupted: ["Twisted things that were once animals", "The blighted dead", "Tendrils from the walls"] },
    horror: { natural: ["Something pale that lives in the dark", "Rats, too many and too bold", "A hermit gone strange"], lair: ["Its young", "What it brings back"], ruin: ["Ghouls feeding", "A presence in the old stones"], mine: ["The miners who never left", "What the miners dug up"], temple: ["Cultists at their rites", "A worshipper of the thing below"], magic: ["Lights that are not lights", "Something that wears a borrowed face"], fungal: ["The fungus-ridden dead"], crystal: ["Something that sings in the crystal"], flooded: ["The drowned thing", "A deep one, far from the sea"], volcanic: ["Something that lives in the heat"], corrupted: ["Things that were once people", "The rot, moving"] },
    scifi: { natural: ["Feral crawlers", "A swarm of scavenger drones"], lair: ["Its brood", "The remains of a survey team, some still moving"], ruin: ["Guardian machines, still on watch", "Salvagers who do not want witnesses"], mine: ["Mining drones gone wrong", "The last shift, still working"], temple: ["Cultists of the old makers", "A sentinel construct"], magic: ["An energy entity", "Living crystal"], fungal: ["Spore-hosts"], crystal: ["Silicate lifeforms"], flooded: ["Something in the coolant water"], volcanic: ["Heat-lovers"], corrupted: ["The infected"] }
  };
  const BOSS = { lair: "The beast whose lair this is", temple: "The high priest, and what answers their call", corrupted: "The heart of the blight", magic: "The guardian of the well", volcanic: "A wyrm of fire", ruin: "The last king, risen", mine: "What the miners woke", natural: "The oldest thing in the caves", fungal: "The great mould", crystal: "The crystal colossus", flooded: "The thing in the lake" };
  W.encounter = (r, s, R, g) => {
    const tone = D().tone ? D().tone() : "fantasy", set = ENC[tone] || ENC.fantasy, list0 = set[s.env] || set.natural;
    const t = r.role === "boss" ? (tone === "horror" && s.env === "natural" ? "The thing at the bottom of the dark" : BOSS[s.env] || "The master of these caves") : r.role === "nest" ? R.pick(set.lair || list0) : R.pick(list0);
    const feats = r.feats || [], scale = { safe: "a few, and easily avoided", moderate: "enough to be a real fight for the party", dangerous: "more than the party should fight head-on", deadly: "enough to kill the careless" }[s.danger] || "a handful";
    const tactics = feats.includes("lake") || feats.includes("flooded") ? "They use the water: they come from it and drag others into it." : feats.includes("ledge") || feats.includes("cliff") ? "They hold the high ground and drop on those below." : feats.includes("chasm") ? "They try to drive intruders toward the edge." : feats.includes("fungus") ? "They hide among the fungus until close." : "They use the dark: they come from where the light does not reach.";
    return { t, d: `${r.role === "boss" ? "The cave's last danger." : "Met here."} How many: ${scale}. ${tactics} Give them stats from your game, to suit the party.`, count: r.role === "boss" ? 1 : undefined };
  };
  // a secret door: how it opens, where it goes, why it is there
  const ACC = ["A loose slab at the foot of the wall swings inward when pushed low down.", "A crack too regular to be natural hides a door; pressing the stone above it lets it open.", "Behind a curtain of flowstone is a gap a person can squeeze through.", "A boulder that looks immovable is balanced to roll aside.", "A shelf of rock pivots on a hidden pin when its far end is lifted."];
  W.secret = (from, to, s, R) => {
    const dz = { safe: 2, moderate: 3, dangerous: 4, deadly: 4 }[s.danger] || 3;
    return { t: `A hidden way to ${to.name || to.id}`, acc: R.pick(ACC) + ` Finding it: ${roll("search", dz)}.`, dest: `${to.id} ${to.name || ""}`.trim(), why: { cache: "Someone hid their valuables here.", shrine: "A shrine kept from strangers' eyes.", hideout: "Someone lived here in hiding.", ossuary: "The dead were laid here and walled away.", treasure: "The cave's treasure, kept from casual eyes.", hidden: "A hiding place, made or found by someone who did not want to be followed." }[to.role] || "Someone wanted it hidden." };
  };
  W.hiddenExit = (r, s, R) => ({ t: "A hidden way out", acc: R.pick(ACC) + ` Finding it: ${roll("search", 3)}.`, dest: "The surface, far from the main entrance", why: R.pick(["An escape route, made by someone who expected to need one.", "A smugglers' way.", "The way the cave's masters came and went unseen."]) });
})(ATLAS);
