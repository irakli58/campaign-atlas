// For the table: what the referee needs while the game is played (references/table.md).

// The villains' clocks: each step is what changes in the world when the referee ticks it.
ATLAS.clocks([
  { id: "green", name: "The green spreads", who: "The thing in the grow beds", segments: 6,
    when: "Each shift the party spends elsewhere, or whenever they make noise in Hydroponics.",
    ticks: ["The irrigation lines on Deck 9 carry a faint green film.", "A grow-bed tech reports a rash; Petra treats her and says nothing.", "The air scrubbers on Deck 9 begin to clog; the corridor smells of cut stems.", "A maintenance crawl seals itself from inside: roots have grown through the hatch.", "Two crew collapse in the Deck 9 mess. Security closes the deck.", "The station AI declares a quarantine of the whole inner ring."],
    done: "The inner ring is sealed with the party inside unless they are already out. Okafor tries to burn the beds." },
  { id: "okafor", name: "Okafor covers it up", who: "Dr. Adaeze Okafor", segments: 4,
    when: "When the party shows their hand to anyone who reports to her.",
    ticks: ["She wipes the cryo log (C2 is gone if not found).", "She moves Ines to the cryo pods; the observation room is empty.", "She asks Hale to lose the party's own dock records.", "She files a report blaming Ines for the breach."],
    done: "Ines is frozen and the record says she caused it. The truth now needs Okafor's own confession." }
]);

// The sessions: a plan to split the campaign into evenings, each ending on a hook.
ATLAS.sessions([
  { n: 1, title: "A missing tech", hours: 3, places: ["docking-bay"], start: "The bay door cycles with the party on the floor: ninety seconds, amber lights, and somebody logged in from outside to do it.", cliff: "Ines's badge in the crawl, and drag marks heading for the medical ring." },
  { n: 2, title: "The quiet clinic", hours: 3, places: ["med-lab"], start: "Petra meets them at reception with two cups of bad coffee and a question she should not be asking: has anyone seen the doctor leave?", cliff: "The cabinet in the doctor's office rolls aside, and behind it someone is breathing." },
  { n: 3, title: "What grows on Deck 9", hours: 4, places: ["hydroponics"], start: "The lights in Hydroponics 9 are violet, and the beds are taller than they were yesterday.", cliff: "The quarantine count begins." }
]);

// The players' characters, woven in: a hook, a secret, and a clue of their own in one of the places.
ATLAS.pcs({
  sato: { n: "Lena Sato", player: "Mariam", concept: "Station security, two weeks from transfer",
    bg: "Ex-navy; took this posting to be near her sister on Deck 4.", hook: "Ines Varga taught Lena's sister to grow tomatoes. Lena owes her.",
    secret: "Lena was on duty the night of the docking and signed the gate log without looking.",
    clue: { t: "Her own signature", at: "docking-bay", d: "On the 03:10 gate log, under the Marigold's line: L. SATO, cleared. She does not remember the crate." },
    places: ["docking-bay"], stats: { HP: 13, SAN: 60, Luck: 55, MP: 12, DEX: 70 } },
  oren: { n: "Oren Vasquez", player: "Giorgi", concept: "Botanist, contract worker",
    bg: "Hired by the survey office to catalogue what comes back from the outer worlds.", hook: "The samples in the crate are his: he packed them himself on the survey.",
    secret: "He knew one sample was still alive when he sealed it.",
    clue: { t: "His packing label", at: "med-lab", d: "On the sealed case in the laboratory, in his own hand: VASQUEZ / VIABLE - DO NOT OPEN." },
    places: ["med-lab", "hydroponics"], stats: { HP: 11, SAN: 70, Luck: 45, MP: 14, DEX: 55 } }
});

// The council's ways back when the table is stuck.
ATLAS.rescues([
  { when: "If they never find the crawl", do: "Mouse comes to them: she will show the way under the bay floor if they promise not to tell security she uses it." },
  { at: "med-lab", when: "If they cannot get past Okafor", do: "The quarantine shutters drop by accident (a cleaning drone trips the lab sensor), and Okafor must choose: let them help, or let them see." }
]);

// Random tables for the whole campaign (each place can have its own).
ATLAS.tables({
  "Station rumours": ["The doctor has been sleeping in her office.", "Something is wrong with the tomatoes on 9.", "The Marigold came in with nobody aboard.", "Security is doubling patrols on the inner ring.", "Hale is retiring early; nobody knows why.", "A grow tech went missing and nobody filed a report."]
});

// The world's time: the station's calendar, and what happens on it whether or not the party acts. Background and
// notable events happen by themselves; major and critical ones wait for the referee's yes (references/table.md, section 18).
ATLAS.calendar({ start: "2291-03-14 06:00" });
ATLAS.events([
  { id: "shift", title: "The morning shift change", when: "day 1 08:00", importance: "background",
    what: "Two hundred crew cross the inner ring at once; the corridors are full and nobody looks twice at anyone.",
    players: "The ring fills with the morning shift: easy to move unseen for half an hour." },
  { id: "notice-up", title: "Operations closes Hydroponics 9", when: "day 1 14:00", place: "hydroponics", importance: "major", who: ["Dr. Adaeze Okafor"],
    what: "Okafor has Operations post the maintenance notice. The deck's doors lock to anyone without medical clearance.",
    why: "She wants the beds out of sight while she decides whether to burn them; the notice is her cover story.",
    then: "Anyone wanting into Hydroponics now needs Okafor's clearance, a forged one, or the maintenance crawl.",
    unless: [{ clue: "med-lab/C3" }],
    effects: [{ faction: "medical", step: 1 }, { faction: "medical", gains: "hydroponics" }, { faction: "security", rel: ["medical", "hostile"] }],
    news: { headline: "Hydroponics 9 closed for maintenance", text: "Station Operations has closed Hydroponics 9 until further notice. Crew with skin irritation should report to Medical 9.", paper: "Station bulletin" } },
  { id: "rash", title: "A grow tech reports a rash", when: "day 2 09:00", place: "med-lab", importance: "notable", effects: [{ person: "okafor", learns: "A second grow tech from Deck 9 has the rash.", how: "told" }],
    what: "Petra treats a tech from Deck 9 and logs it as an allergy. The second case this week.", tick: ["green", 1] },
  { id: "hale-runs", title: "Hale tries to leave the station", after: [{ clue: "docking-bay/C4" }], importance: "major", place: "docking-bay", who: ["the dockmaster"],
    unless: [{ event: "quarantine" }],
    outcomes: ["He gets away, and his records with him", "Okafor stops him first", "The party reaches him and he talks"],
    what: "Once his ledger is found, the dockmaster books passage on the next freighter out, and Okafor hears of it.",
    players: "Word on the dock: the dockmaster has booked himself on tonight's freighter." },
  { id: "quarantine", title: "The station AI quarantines the inner ring", after: [{ clock: ["green", 6] }], importance: "critical",
    effects: [{ faction: "security", gains: "hydroponics" }, { faction: "medical", loses: "hydroponics" }, { place: "hydroponics", system: "contamination", to: "down" }, { place: "med-lab", system: "security", to: "failing" }, { person: "okafor", at: "hydroponics", doing: "trying to burn the beds", hours: 6 }],
    what: "Every door between the inner ring and the docks seals. Anyone inside stays inside.",
    news: { headline: "QUARANTINE: inner ring sealed", text: "By order of the station AI, all crew remain where they are. Doors between the inner ring and the docks are sealed.", paper: "Station alert" } },
  { id: "inquiry", title: "The survey office asks after its samples", after: [{ event: "notice-up", hours: 48 }], importance: "background",
    what: "A message from the survey office: when will the samples be catalogued? Oren's contract is mentioned by name." }
]);

// The powers on the station: what each has (0 to 5), wants and is doing, and how they stand (references/table.md, section 19).
ATLAS.factions({
  medical: { n: "Medical Nine", kind: "the medical ring", leader: "okafor", members: ["okafor", "Nurse Petra Lindqvist"], hq: "med-lab", territory: ["med-lab"],
    has: { money: 2, people: 2, arms: 0, influence: 3, knowledge: 5 }, lacks: "Anyone Okafor can trust with the truth.",
    wants: "To contain the breach before anyone learns there was one.", clock: "okafor",
    plan: ["Close Hydroponics 9 for 'maintenance'", "Wipe the cryo log", "Move Ines to the cryo pods", "File a report blaming Ines"], doing: "Keeping the beds sealed and the records clean.",
    rels: { security: ["wary", "Security could open any door she closes"], dock: ["friendly", "Hale owes her a favour"] }, party: "wary",
    knows: "Everything about the crate and the spread.", wrong: "That the spores die in vacuum.", inner: "Petra suspects, and is afraid to ask.", rep: "Efficient, cold, overworked.", past: "A clinic given a research budget nobody asked for." },
  security: { n: "Station Security", kind: "the station's police", leader: "Chief Ama Kofi", territory: [],
    has: { money: 3, people: 4, arms: 4, influence: 3, knowledge: 2 }, wants: "Order on the inner ring, and no scandal before the inspection.",
    plan: ["Double the patrols on the inner ring", "Question the dock crews", "Seal the deck if anyone collapses"], doing: "Doubling the patrols on the inner ring.",
    rels: { medical: "wary", dock: ["wary", "they suspect Hale is on the take"] }, party: "neutral", knows: "That eleven minutes are missing from the bay cameras.", inner: "Half the officers drink with the dock crews." },
  dock: { n: "The Docks", kind: "dock crews and customs", leader: "Dockmaster Joss Hale", members: ["Bram Tellis", "'Mouse' Adeyemi"], hq: "docking-bay", territory: ["docking-bay"],
    has: { money: 3, people: 3, arms: 1, influence: 2, knowledge: 3 }, wants: "Goods moving, and no questions asked.", doing: "Losing eleven minutes of camera records.",
    rels: { medical: "friendly", security: "wary" }, party: "neutral", knows: "Who signed for the crate.", inner: "Mouse sees everything and tells no one, yet." }
});

// Money and goods (references/table.md, section 22): the station's credits and goods are the future's own; these are
// the station's merchants, and what is dear on Deck 9 since the crate came in.
ATLAS.economy({
  mode: "full",
  purse: 340,
  regions: { "hydroponics": { by: 1, scarce: ["food"], note: "Deck 9, with its beds closed" }, "docking-bay": { by: .9, plenty: ["tools", "fuel"], note: "The docks, where it comes in" } },
  merchants: {
    mouse: { n: "Mouse's locker by Bay 3", at: "docking-bay", sells: ["tools", "tech", "fuel", "services"], stock: 2, restock: 5, markup: 1.2, buys: .6 },
    dispensary: { n: "The Med Bay dispensary", at: "med-lab", sells: ["medicine"], stock: 4, restock: 3, buys: .3 }
  }
});

// Handouts the council made that are not one place's clue.
ATLAS.handouts([
  { id: "notice", kind: "notice", title: "NOTICE TO ALL DECK 9 CREW", text: "Hydroponics 9 is closed for routine maintenance until further notice.\n\nCrew with skin irritation should report to Medical 9 at once.", from: "Station Operations" }
]);

// The galaxy round the station (galaxy.js grows it; references/galaxy.md): the systems the story uses, and the party's ship.
ATLAS.galaxyEdit({
  home: "S237",
  systems: {
    S237: { name: "Kestrel", desc: "Kestrel Station turns in high orbit over a dead red world; the inner ring is where the trouble is.", gm: "The Marigold came in from Corvan with nobody aboard." },
    S95: { name: "Corvan", desc: "The survey office's last stop: a yellow-white star and a world they were cataloguing.", gm: "Where the samples were taken. Something there is still growing.", flags: { research: 1 } },
    S6: { name: "Quianl Drift", gm: "The courier's beacon went silent here for nine hours." }
  },
  ship: { name: "The Wren", cap: 30, fuel: 22, burn: 1, range: 9, speed: 2.5, cargoCap: 40, crew: "The party, and a pilot who owes Hale money", equipment: ["Survey scanner", "Two vacuum suits"], upgrades: [] },
  fuel: "normal"
});
