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

// Handouts the council made that are not one place's clue.
ATLAS.handouts([
  { id: "notice", kind: "notice", title: "NOTICE TO ALL DECK 9 CREW", text: "Hydroponics 9 is closed for routine maintenance until further notice.\n\nCrew with skin irritation should report to Medical 9 at once.", from: "Station Operations" }
]);
