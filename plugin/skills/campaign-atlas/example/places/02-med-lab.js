ATLAS.place("med-lab", {
  music: "hospital",
  name: "The Med Bay",
  category: "station", region: "Deck 9, medical ring", acts: [2, 3], tier: 2,
  tagline: "A clean, quiet clinic with one more room than its floor plan admits.",
  intensity: 3, content: ["medical restraint", "body horror (mild)"],
  tables: { "What the nurse is doing": ["Restocking the dressing trolley, twice", "Arguing with the pharmacy over the comm", "Sitting very still, staring at the office door", "Re-pinning her lanyard badges in a new order"], "In the doctor's desk": ["A half-written resignation", "Three empty stim blister packs", "A photograph of a woman on a beach, planetside", "A requisition for twelve kilos of herbicide, denied"] },
  map: {
    ov: "Deck 9's clinic, run by Dr. Adaeze Okafor. Three shifts ago a crate of sealed samples from the outer survey came in through Bay 3, and something in it took root in the hydroponics beds. Ines Varga found it. Okafor has her sedated in an observation room that is on no plan, while she decides whether to report a quarantine breach that would end her career.",
    run: "Acts 2 and 3. Okafor is not a monster: she is frightened, and every hour she waits makes it worse. The public rooms give the patient chart (C1) and the cryo log (C2). The observation room (S1) holds Ines, alive, and the recordings (C3) that prove where the crate went. How the players treat Okafor decides whether the ending is a rescue or a siege.",
    ext: "A frosted glass door marked MEDICAL 9, a strip of green light over it. Inside it is very clean and very quiet, and colder than the corridor.",
    entry: ["R1"],
    floors: [
      { n: "MEDICAL BAY", w: 22, h: 13,
        note: "Reception, the ward, the doctor's office, the laboratory and the cryo room, with the hidden observation room behind the office. Bright, quiet and cold. One nurse on duty; the doctor is always in.",
        R: [["hl", 0, 0, 22, 13, "", "hull"],
          ["R1", 2, 2, 6, 4, "Reception", "lino", { fx: "waiting" }],
          ["R2", 8, 2, 8, 4, "Ward", "tilew", { fx: "ward" }],
          ["R3", 16, 2, 4, 4, "Doctor's office", "carpet-g", { fx: "office" }],
          ["R4", 2, 6, 8, 5, "Laboratory", "concrete", { fx: "lab" }],
          ["R5", 10, 6, 6, 5, "Cryo room", "metal"],
          ["R6", 16, 6, 4, 5, "Observation room", "glass", { h: 1 }]],
        D: [[8, 3, "v", "d"], [16, 3, "v", "d"], [4, 6, "h", "d"], [10, 8, "v", "d"], [12, 6, "h", "d"], [17, 6, "h", "s"]],
        I: [["pod", 10.4, 6.3, 1, 2], ["pod", 11.8, 6.3, 1, 2], ["pod", 13.2, 6.3, 1, 2], ["pod", 14.6, 6.3, 1, 2], ["console", 11.4, 10, 3, .8, 180],
          ["cot", 16.4, 8.6, 1, 2], ["console", 17.8, 6.2, 2, .8], ["chair", 18.6, 9.4, .8, .8]],
        M: [["N2", 4.4, 4.4], ["C1", 11, 4.2], ["N1", 18.4, 4.2], ["S1", 17.5, 5.6], ["E1", 5.6, 8.6], ["C2", 14.2, 9], ["C3", 18.6, 7.6]] }
    ],
    rooms: {
      R1: { d: "A small reception with benches, a desk and a wall clock that runs a minute slow.", pur: "Reception: every patient is logged here.", atm: "Disinfectant and a too-bright light.", obj: "The admissions terminal, benches, a rack of leaflets on decompression sickness.", chk: "Talk to Nurse Petra: she is loyal to the doctor and worried about her. Read her (insight): she has been told not to go into the office.", kp: "N2 Petra does not know about R6. She does know the doctor has not gone home in three shifts." },
      R2: { d: "A six-bed ward, five beds made with hospital corners and one stripped to the frame.", pur: "The ward.", atm: "Quiet, and the tick of a drip stand nobody is using.", obj: "Beds, a drip stand, the chart rack (C1).", chk: "Read the chart rack: C1. Notice the stripped bed has restraint anchors, recently used.", kp: "Ines was admitted here at 03:40 and moved within the hour." },
      R3: { d: "A tidy office: a desk, filing drawers, a tall cabinet against the south wall, a cold cup of tea.", pur: "Dr. Okafor's office.", atm: "Paper, tea, and a woman who has not slept.", obj: "The desk, the files, the tall cabinet (S1), a framed licence.", chk: "Talk to Okafor: threats close her up, honesty opens her. Search while she is out: the cabinet rolls aside (S1).", kp: "N1 Okafor. She will show R6 herself to anyone who convinces her there is a way through this that saves Ines." },
      R4: { d: "A laboratory of benches and sample jars, with a fume hood humming over a sealed case.", pur: "The laboratory.", atm: "Reagents and the fume hood's hum.", obj: "Sample jars of green cuttings, a sealed case stencilled OUTER SURVEY, the quarantine panel.", chk: "Identify the cuttings (science): not from any catalogued species, and still growing in the jar. Open the sealed case: E1.", kp: "E1 seals the Med Bay. The override key (Docking Bay 3, K1) opens it again." },
      R5: { d: "Four cryo pods along the wall, three dark and one with its status lights on.", pur: "The cryo room.", atm: "Cold enough to see your breath; a soft double beep.", obj: "Four pods, the cryo console and its log (C2).", chk: "Read the console log (a technical roll): C2.", kp: "Pod 4 holds the courier boat's pilot, who touched the crate first. He is alive." },
      R6: { d: "A narrow glass-walled room with one cot, a monitoring console and a chair pulled close.", pur: "An observation room that is on no plan.", atm: "The hush of a room where someone has been watched for days.", obj: "A cot with Ines Varga (sedated), the console and its recordings (C3), Okafor's chair.", chk: "Wake Ines (medicine, or wait six hours): she can say what she found. Play the recordings: C3.", kp: "Ines is the proof. Moving her needs Okafor's help or two people and a clear corridor." }
    },
    clues: {
      C1: { t: "The patient chart", at: "R2", p: "in the chart rack", d: "VARGA, I. Admitted 03:40. Presenting: contact exposure, plant matter, Hydroponics 9. No discharge entry.", how: "Reading the chart rack.", rev: "Ines was brought here alive, and whatever she touched came from the grow beds.", hint: "Lindqvist mentions the last patient she admitted came in smelling of cut stems.", to: "hydroponics", roll: "Medicine or Spot Hidden", handout: { kind: "datapad", title: "Patient chart: VARGA, I.", date: "2291-04-12 03:40", text: "Admitted 03:40. Presenting: contact exposure, plant matter, Hydroponics 9.\n\nSedated on arrival (Dr A. Okafor). Bed 6.\n\nDischarge: [no entry]", from: "MEDICAL 9 / RECORDS" } },
      C2: { t: "The cryo log", at: "R5", p: "on the cryo console", d: "Pod 4 sealed at 03:36, six minutes before Ines was admitted. Occupant unlisted. Authorised: Okafor.", how: "Reading the console log.", rev: "There is a second patient, hidden in plain sight, and he arrived with the crate.", hint: "A pod status light shows amber on the reception board: one more pod is in use than there are patients.", to: "docking-bay", roll: "Computer Use, Hard", rescue: "Petra mentions that pod 4 has been beeping since the crate came in, and she was told to leave it." },
      C3: { t: "The observation recordings", at: "R6", p: "on the monitoring console", d: "Okafor's own voice notes: the crate's seal failed in the bay, she moved the samples to the grow beds 'for containment', and by morning they had spread.", how: "Playing the recordings.", rev: "The breach is in Hydroponics, it is growing, and the doctor has known for three shifts.", hint: "Okafor, if the players are honest with her, plays the recordings herself.", to: "hydroponics", handout: { kind: "message", title: "Voice note transcript, 04:12", from: "Okafor", text: "Okafor: Seal failed in the bay. My hands. My fault.\nOkafor: Moved the samples to beds 14 to 18. Containment, I told myself.\nOkafor: By morning it was in the irrigation. God help me." } }
    },
    npcs: {
      N1: { who: "okafor", at: "R3", doing: "Writing and deleting a breach report.", knows: "Everything: the crate, the spread, where Ines is.", rev: "To honesty and a plan. Never to a threat." },
      N2: { n: "Nurse Petra Lindqvist", at: "R1", look: "Thirty, brisk, kind, with a badge lanyard full of pins.", manner: "Warm and fast; finishes your sentences, and fusses with the pins when she is worried.", bg: "Trained planetside, followed the doctor to the station six years ago, and has run the clinic's front desk ever since.", ties: { okafor: "her doctor and mentor; loyal, and hurt at being locked out", "Ines Varga": "a patient she saw admitted the night Ines vanished, and never saw leave" }, doing: "Keeping reception running and worrying.", knows: "The doctor has not left in three shifts and has locked her out of the office.", rev: "Freely, if the players seem to want to help the doctor rather than hang her." }
    },
    secrets: { S1: { t: "The rolling cabinet", at: "R3", acc: "The tall cabinet on the office's south wall rolls aside on a floor track.", dest: "The observation room (R6).", why: "Built as an isolation room and left off the plans when the deck was refitted. Okafor found it years ago." } },
    enc: { E1: { t: "Quarantine", roll: "Luck to reach the door", stats: { STR: 0, HP: 0, notes: "Not a creature: a twelve-hour count. Each hour the green spreads one room." }, at: "R4", d: "Opening the sealed case trips the lab's sensors. Shutters drop on every door of the Med Bay and a calm voice begins a twelve-hour count. The override key opens them; so does Okafor, if she chooses." } }
  }
});

// A place can be listed before it is mapped: it appears in the index and on the clue trail, and the checklist shows it as still to do.
ATLAS.place("hydroponics", {
  music: "laboratory",
  name: "Hydroponics 9",
  category: "station", region: "Deck 9, inner ring", acts: 3, tier: 2,
  tagline: "Grow beds under violet light, and something in them that was not planted."
});
