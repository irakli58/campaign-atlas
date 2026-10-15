ATLAS.place("docking-bay", {
  music: "ship",
  name: "Docking Bay 3",
  category: "scene", region: "Deck 9, outer ring", acts: 1, start: true, tier: 1,
  tagline: "Where Ines Varga was last seen on camera, walking toward a shuttle that was not on the schedule.",
  map: {
    ov: "A small freight bay on the outer ring. Ines Varga, hydroponics tech, walked in here at 03:12 three shifts ago and never walked out on any camera. She left through the floor: a maintenance crawl under the deck plates. The bay is also where Dr. Okafor's unlisted crates arrive, waved through by a customs officer who is paid not to open them.",
    run: "Act 1. The players should leave with two leads: the medical crate signed for by the doctor (C1, to the Med Bay) and the green residue (C2, to Hydroponics). The crawl (S1) rewards a careful search with Ines's badge (C3). The hold below is optional and dangerous: the cache (S2) holds the quarantine override key (K1), which matters in the last act.",
    ext: "The bay door is a wall of scratched alloy four people high, striped yellow and black. Beyond its small port the stars turn slowly. The air smells of coolant and cold metal, and somewhere a loader is beeping to itself.",
    entry: ["R7"],
    floors: [
      { n: "BAY LEVEL", w: 26, h: 16,
        note: "The landing bay, the customs office and crew lounge beside it, the cargo lock with the freight lift, bay control, and the ring corridor that everyone arrives by. Busy at shift change, empty in between; the cameras cover the bay floor but not the corridor end.",
        R: [["sp", 0, 0, 26, 3, "Open space", "space"],
          ["R1", 2, 3, 12, 8, "Landing bay", "metal"], ["R1", 10, 11, 4, 2, "", "metal"],
          ["R2", 14, 3, 6, 4, "Customs office", "concrete", { fx: "office" }],
          ["R3", 14, 7, 6, 4, "Crew lounge", "carpet-b"],
          ["R4", 20, 3, 4, 10, "Cargo lock", "grating"],
          ["R5", 2, 11, 8, 2, "Maintenance crawl", "grating", { h: 1 }],
          ["R6", 14, 11, 6, 2, "Bay control", "glass"],
          ["R7", 2, 13, 22, 2, "Ring corridor", "metal"]],
        D: [[6, 3, "h", "g", 4], [14, 4, "v", "d"], [14, 8, "v", "d"], [16, 7, "h", "d"], [20, 8, "v", "d"], [21, 13, "h", "dd", 2],
          [16, 13, "h", "d"], [17, 11, "h", "d"], [11, 13, "h", "dd", 2], [5, 11, "h", "s"], [5, 13, "h", "s"]],
        I: [["vehicle", 4, 4.4, 6, 3.2, 0, 0, "#6d7f8d"], ["crate", 11.4, 4, 2, 2], ["crate", 11.4, 8, 2, 1], ["sofa", 14.4, 9.6, 2.6, 1, 180], ["tbl", 17.2, 8, 1.6, 1.2], ["locker", 14.2, 7.1, 3, .5],
          ["console", 14.4, 11.1, 3, .8], ["screen", 18, 11.05, 1.6, .4], ["pipe", 2.4, 11.8, 7, .5], ["crate", 20.3, 3.4, 2, 2], ["barrel", 20.3, 6, 1, 2]],
        ST: [["ST1", 22, 10, 1, 2, "down", "CARGO HOLD", "s", "Freight lift"]],
        M: [["C1", 16.6, 4.6], ["N1", 18.4, 5.6], ["C2", 9.4, 9.4], ["N2", 15.6, 9], ["S1", 5.5, 10.6], ["C3", 7, 12], ["E1", 5, 6]] },
      { n: "CARGO HOLD", w: 26, h: 16,
        note: "Under the bay: the hold where freight waits for customs, a cold store, and behind a false bulkhead the cache where the doctor's crates are kept out of the log. Dim, loud with compressors, and patrolled by one badly maintained loader drone.",
        R: [["hl", 0, 0, 26, 16, "", "hull"], ["R8", 12, 3, 12, 10, "Cargo hold", "metal"], ["R9", 6, 3, 6, 5, "Cold store", "concrete"], ["R10", 6, 8, 6, 3, "The cache", "metal", { h: 1 }]],
        D: [[12, 5, "v", "dd", 2], [12, 9, "v", "s"]],
        I: [["crate", 13, 3.4, 4, 2], ["crate", 18, 3.4, 3, 1], ["crate", 13, 10.6, 3, 2], ["barrel", 17, 11, 2, 1], ["drone", 19, 7, 1.2, 1.2], ["rack", 6.3, 3.2, 5.4, .4], ["crate", 7, 8.6, 2, 2], ["safe", 10.4, 8.4, 1.2, 1.2]],
        ST: [["ST1", 22, 10, 1, 2, "up", "BAY LEVEL", "n"]],
        M: [["E2", 19.6, 8.6], ["S2", 12.4, 9.5], ["K1", 10.2, 9.9]] }
    ],
    rooms: {
      R1: { d: "A freight bay big enough for one shuttle. A scuffed courier boat sits in the cradle with its ramp down; cargo is stacked against the east wall under a strip of failing lights.", pur: "The landing bay, where Ines was last seen.", atm: "Coolant, cold metal, a loader beeping somewhere below.", obj: "The courier boat Marigold (cold, unlocked, empty), stacked freight, a deck plate with newer bolts than its neighbours.", chk: "Search the freight: C2. Notice the deck plate (a careful search, or follow the scuff marks): S1. Pull the bay camera record from R6: Ines walks in at 03:12, crouches by the freight, and the camera loses her.", kp: "E1 can interrupt any long search. The Marigold's own log was wiped by someone who knew how." },
      R2: { d: "A cramped office behind a scratched window: a desk, a wall of filing drawers, a kettle.", pur: "Customs: every crate through Bay 3 is signed for here.", atm: "Instant coffee and toner.", obj: "The docking log (C1), stamps, a drawer of unopened final-demand letters.", chk: "Read the log with Tellis's leave, or while he is out: C1. Read Tellis himself: he is frightened of the doctor, not of the players.", kp: "N1 Tellis takes the doctor's money and hates himself for it. Treated decently, he says which crates he never opened." },
      R3: { d: "A lounge for bay crews: a sagging sofa, a table ringed with cup marks, a row of lockers.", pur: "Where the dock hands wait out the gaps between ships.", atm: "Stale tea and somebody's forgotten lunch.", obj: "Lockers (work gloves, a pack of cards), the shift rota with Ines's name pencilled in beside a dock hand's.", chk: "Talk to Mouse (kindness, or a favour): Ines asked her how to get under the bay floor.", kp: "N2 Mouse liked Ines. She has not told security because security works for the doctor's friend." },
      R4: { d: "A tall lock with a grated floor and the freight lift at its far end.", pur: "The cargo lock between the bay and the hold below.", atm: "Wind through the grating whenever the lift moves.", obj: "Crates waiting for the lift, a drum of sealant, the lift cage (ST1).", chk: "Ride the lift down (it is loud: the drone below hears it).", kp: "The only public way down to the hold." },
      R5: { d: "A crawlway under the bay's deck plates, hip high, lined with pipes. Fresh scratches in the dust lead east.", pur: "A maintenance crawl nobody has logged a visit to in a year.", atm: "Dust, warm pipes, the bay's noise muffled overhead.", obj: "Pipes, a dropped ID badge (C3), drag marks.", chk: "Search the dust: C3. Follow the drag marks to the corridor panel (S1's other end).", kp: "Ines came this way under her own power. Something heavy was dragged after her, the other way." },
      R6: { d: "A glass booth over the bay with a console and a wall screen.", pur: "Bay control: the doors, the cameras and the cradle.", atm: "The hum of the console and a view of the whole bay.", obj: "The bay console, twelve hours of camera record, the door cycle override.", chk: "Operate the console (a technical roll) to pull the 03:12 record, or to stop E1 once it has begun.", kp: "The record has a clean eleven-minute gap after 03:14. Only two logins can cut a record: the dockmaster's and the doctor's." },
      R7: { d: "The outer ring corridor, curving away in both directions. A wall panel near the bay hatch sits a finger's width proud.", pur: "The way everyone arrives.", atm: "Recycled air and distant footsteps.", obj: "A wall panel that does not sit flush (S1's far end), a dead camera dome.", chk: "Spot the proud panel in passing (hard), or easily once the crawl is known.", kp: "The corridor camera has been dead for a month. Nobody filed the fault." },
      R8: { d: "A hold stacked with freight on magnetic pallets, lit in strips. A loader drone trundles between the rows, far too fast.", pur: "The hold where freight waits for customs.", atm: "Compressors, strip lights, the whine of the drone.", obj: "Freight pallets, the loader drone, a bulkhead whose weld seam is too neat.", chk: "Dodge or disable the drone: E2. Study the west bulkhead: S2.", kp: "The drone is not sabotaged, only neglected. It makes a search here a race." },
      R9: { d: "A walk-in cold store of racked sample cases, breath-fogging cold.", pur: "Cold storage for perishables and medical freight.", atm: "Frost on the racks and a compressor's rattle.", obj: "Sample cases, one rack with a clean rectangle in the frost where a crate stood until recently.", chk: "Compare the clean rectangle with the docking log (C1): the missing crate is the doctor's.", kp: "Confirms C1 for players who came down without reading the log." },
      R10: { d: "A space behind a false bulkhead: two medical crates, a floor safe, and a camp stool.", pur: "The cache where the doctor's crates sit off the books.", atm: "Still air and the smell of antiseptic.", obj: "Two crates stencilled MEDICAL, QUARANTINE GRADE, a floor safe with the override key (K1).", chk: "Open the safe (hard, or with Tellis's code): K1. Open a crate: empty restraint harnesses, sized for people.", kp: "K1 opens the quarantine doors on the whole deck. Whoever holds it decides how the last act goes." }
    },
    clues: {
      C1: { t: "The docking log", at: "R2", p: "on the customs desk", d: "The courier boat Marigold docked at 03:10 with no crew listed. One crate, medical, quarantine grade, signed for by Dr. A. Okafor at 03:31.", how: "Reading the log, with Tellis's leave or without it.", rev: "The doctor received an unscheduled crate twenty minutes after Ines walked into the bay.", hint: "Tellis lets slip that the doctor signs for her own crates, and glances at the log as he says it.", to: "med-lab" },
      C2: { t: "A torn work glove", at: "R1", p: "wedged between two pallets", d: "A hydroponics work glove, torn at the cuff, stiff with a green residue that smells of cut stems.", how: "Searching the freight by the east wall.", rev: "Ines came straight from her shift, and she was handling something from the grow beds.", hint: "Mouse saw Ines drop something by the east pallets and says so if asked what she was wearing.", to: "hydroponics" },
      C3: { t: "Ines's ID badge", at: "R5", p: "in the dust under a pipe", d: "I. VARGA, HYDROPONICS 9. The clip is bent, as if pulled off in a struggle.", how: "Searching the crawl.", rev: "She was here, and she did not leave the crawl willingly. The drag marks run toward the medical ring.", hint: "Anyone following the drag marks from the hatch finds the badge where they end.", to: "med-lab" },
      K1: { t: "The quarantine override key", at: "R10", p: "in the floor safe", d: "A red key card on a lanyard: DECK 9 QUARANTINE OVERRIDE. It opens, or seals, every quarantine door on the deck.", how: "Opening the safe (hard), or with the code Tellis remembers once he trusts the players.", rev: "Whoever carries it can open the sealed ward in the Med Bay, or lock the doctor in it." }
    },
    npcs: {
      N1: { n: "Bram Tellis, customs officer", at: "R2", look: "Fifty, soft, tired, with a stamp-ink stain on his cuff.", manner: "Agrees with everyone, sweats, and shuffles papers when a question gets close.", bg: "Twenty years on the station; a gambling debt to the commissary that a few unopened crates a month keep quiet.", ties: { okafor: "she pays him, through a third party she thinks he does not know about", "Dockmaster Joss Hale": "his superior; they drink together and never talk about work" }, doing: "Pretending to audit a manifest.", knows: "Which crates he was paid not to open, and that the doctor collects them in person.", rev: "Everything, to anyone who promises to keep his name out of it." },
      N2: { n: "'Mouse' Adeyemi, dock hand", at: "R3", look: "Nineteen, quick, in a coverall two sizes too big.", manner: "Never still; answers a question with a question, and watches your hands, not your face.", bg: "Born on the station; knows every crawlway because she grew up hiding in them.", ties: { "Ines Varga": "her friend, the only adult who ever treated her as one; Mouse is frightened for her", "Bram Tellis": "the customs man; she knows he takes money and despises him for it" }, doing: "Waiting for the next ship and watching the door.", knows: "Ines asked her how to get under the bay floor, and why: she thought something was being moved at night.", rev: "To anyone who is kind, and who is plainly not security.", to: "hydroponics" }
    },
    secrets: {
      S1: { t: "The loose deck plate", at: "R1", acc: "A deck plate by the freight stack lifts with a pry bar; its bolts are finger tight.", dest: "The maintenance crawl (R5), and through it a wall panel in the ring corridor.", why: "How Ines got out of camera view, and how she was taken out of the bay." },
      S2: { t: "The false bulkhead", at: "R8", acc: "A section of the west bulkhead slides on a hidden rail; the weld seam is painted on.", dest: "The cache (R10).", why: "Where the doctor's crates wait until they can be moved unseen." }
    },
    enc: {
      E1: { t: "The door cycles", at: "R1", d: "A warning tone, amber lights, and the bay door begins its cycle with people on the floor. Ninety seconds to reach a hatch or the control booth. Somebody triggered it from a remote login." },
      E2: { t: "The loader drone", at: "R8", d: "The drone's proximity sensor is dead. It runs its route at full speed and will pin anyone standing in a pallet lane." }
    }
  },
  expand: [{
    label: "Larger",
    grow: [0, 0, 4, 0],
    ov: "The east end of the bay: the fuel store, the dockmaster's cabin and the corridor that serves them. The dockmaster keeps a private ledger.",
    floors: {
      0: {
        R: [["R11", 24, 3, 6, 5, "Fuel store", "concrete"], ["R12", 24, 8, 6, 5, "Dockmaster's cabin", "carpet-b", { fx: "bedroom", bk: "e" }], ["R13", 24, 13, 6, 2, "East corridor", "metal"]],
        D: [[24, 13, "v", "a", 2], [26, 13, "h", "d"], [26, 8, "h", "d"]],
        I: [["tank", 24.4, 3.4, 2, 2], ["tank", 27, 3.4, 2, 2], ["desk", 24.3, 11, 1.6, 1.2, 180]],
        M: [["C4", 25.4, 11.4], ["N3", 27, 10]]
      }
    },
    rooms: {
      R11: { d: "A fuel store of two pressure tanks behind a blast door, frost on the feed lines.", pur: "Fuel for the bay's cradle and visiting boats.", atm: "A chemical cold and a faint hiss.", obj: "Two pressure tanks, a feed manifold, warning placards.", chk: "Nothing to find, and a great deal to set off: any fight here risks the tanks.", kp: "A hazard, and a threat a desperate dockmaster might use." },
      R12: { d: "A cabin with a real bed, a desk and a porthole: the best quarters on the ring.", pur: "The dockmaster's cabin and private office.", atm: "Good whisky and a ticking antique clock.", obj: "The desk with the private ledger (C4), a wall safe, framed commendations.", chk: "Search the desk while Hale is out: C4. Press Hale with the ledger: he blames the doctor.", kp: "N3 Hale cut the camera record. He does not know what is in the crates and has chosen not to ask." },
      R13: { d: "A short spur of corridor serving the fuel store and the dockmaster's cabin.", pur: "The east corridor.", atm: "Quieter than the ring; the carpet starts at the dockmaster's door.", obj: "A fire point, a notice board of safety bulletins.", chk: "Wait here unseen to watch who visits the dockmaster.", kp: "The doctor visits at the end of second shift, every third day." }
    },
    clues: { C4: { t: "The dockmaster's ledger", at: "R12", p: "in the desk's false bottom", d: "Monthly payments from 'O.', each the day after an unlisted docking. Beside the latest: 'last one. told her I'm out.'", how: "Searching the desk.", rev: "The dockmaster is paid by Okafor to lose camera records, and he is frightened enough to want out.", hint: "Hale, pressed about the missing camera minutes, looks at the desk before he looks at the players.", to: "med-lab" } },
    npcs: { N3: { n: "Dockmaster Joss Hale", at: "R12", look: "Sixty, upright, immaculate, with a drinker's careful hands.", manner: "Formal to the point of coldness; offers a chair, never a drink, and checks the door is shut before he says anything true.", bg: "Navy, then forty years running docks; this was meant to be his quiet last posting.", ties: { okafor: "she treated his wife at the end, for free; he cut the bay record for her and hates himself for it", "Bram Tellis": "his customs officer and drinking companion; suspects him and has never asked" }, doing: "Drafting a resignation he will not send.", knows: "That he cut eleven minutes from the bay record on the doctor's order.", rev: "Under pressure, or to anyone who offers him a way out that does not end in the brig." } }
  }]
});
