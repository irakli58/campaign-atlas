// A place, complete in one file. Copy this to e.g. 03-old-mill.js and replace everything.
// Files starting with "_" are ignored. The full format is in references/data-format.md.
ATLAS.place("old-mill", {
  name: "The Old Mill",
  category: "scene",                    // one of the category ids in campaign.js
  region: "Fenwick Lane",               // district, deck, quarter...
  acts: [1, 3],                         // when it matters (shown in the page, not checked)
  start: false,                         // true for the place(s) the story opens in
  tier: 2,                              // 1 the story cannot run without it (30+ rooms, 3+ floors), 2 the trail passes through it (12+, 2+), 3 colour (6+)
  at: [120, 80],                        // on the city map, in plan units. Or landmark: "Name" (it IS that landmark), or nothing (region places it), or offmap: true
  model: "warehouse",                   // the building it wears on the city map (see: atlas.js catalogue)
  music: { mood: "factory", also: { "The boiler blows": "chase", "Night shift": "night" } },   // the suggested song (a mood from atlas.js catalogue), and a song for each moment here
  tagline: "One sentence for the index: what a visitor would say about it.",

  map: {
    ov: "GM overview: what this place is, what happened here, why it matters to the plot.",
    run: "How to run it: which act, what the players should leave with, the stakes, the routes through it.",
    ext: "Exterior, to read aloud: what the characters see, hear and smell as they arrive. No secrets.",
    // entry: ["R1"],                   // only if the map has no open ground (a dungeon, a station)
    floors: [
      { n: "GROUND FLOOR", w: 16, h: 12,
        note: "Floor note (GM): what is on this floor, who is here and when, how it feels.",
        R: [                            // [id, x, y, w, h, name, kind, opts]
          ["st", 0, 0, 16, 2, "Fenwick Lane", "street"],
          ["R1", 2, 2, 7, 5, "Grinding floor", "boards"],
          ["R2", 9, 2, 5, 5, "Miller's office", "boards", { fx: "office" }],
          ["R3", 2, 7, 7, 3, "Sack store", "flag", { fx: "store" }],
          ["R4", 9, 7, 5, 3, "Strongroom", "brick", { h: 1 }]          // h: 1 = hidden, GM only
        ],
        D: [[4, 2, "h", "dd", 2], [9, 4, "v", "d"], [4, 7, "h", "d"], [11, 7, "h", "s"]],   // [x, y, "h"|"v", type, length]
        I: [["well", 6.5, 3, 2, 2], ["sack", 2.4, 2.4, 2, .8]],                          // [item, x, y, w, h, rotation]
        ST: [["ST1", 2, 4, 1, 2, "down", "CELLAR", "s", "Cellar steps"]],
        M: [["C1", 11.4, 3.6], ["N1", 12.6, 5.2], ["S1", 11.5, 6.6], ["E1", 5, 5]] },      // [marker id, x, y]
      { n: "CELLAR", w: 16, h: 12,
        note: "Floor note for the cellar.",
        R: [["rk", 0, 0, 16, 12, "", "rock"], ["R5", 2, 2, 7, 5, "Wheel pit", "stone"]],
        ST: [["ST1", 2, 4, 1, 2, "up", "GROUND FLOOR", "n"]],
        M: [["C2", 6, 5]] }
    ],
    rooms: {
      // d, pur and atm are shown to players too: no secrets in them. Everything else is GM only.
      R1: { d: "What anyone sees on walking in: two or three concrete sentences.", pur: "What the room is for.", atm: "Smell, sound, light.",
            obj: "Contents worth naming.", chk: "Skill checks and what each one gives.", kp: "What the GM needs to know to run it." },
      R2: { d: "...", pur: "...", atm: "...", obj: "...", chk: "...", kp: "..." },
      R3: { d: "...", pur: "...", atm: "...", obj: "...", chk: "...", kp: "..." },
      R4: { d: "...", pur: "...", atm: "...", obj: "...", chk: "...", kp: "..." },
      R5: { d: "...", pur: "...", atm: "...", obj: "...", chk: "...", kp: "..." }
    },
    clues: {
      C1: { t: "The miller's ledger", at: "R2", p: "in the desk", d: "What it is.", how: "How it is found.", rev: "What it reveals.", hint: "What the referee does if the players miss it.", to: "another-place-id" },
      C2: { t: "A second clue", at: "R5", d: "...", how: "...", rev: "..." }
    },
    npcs: { N1: { n: "Name, role", at: "R2", look: "What they look like.", manner: "How they act.", voice: "How they speak.", bg: "Their story, in a sentence or two.", ties: { castId: "How they know them.", "Another Person's Full Name": "How they know them." }, doing: "...", want: "...", knows: "...", press: "What makes them talk.", rev: "What they will reveal, and to whom." } },   // or one of the cast: { who: "id", at: "R2", doing: "...", knows: "...", rev: "..." }
    secrets: { S1: { t: "The false wall", at: "R2", acc: "How it opens.", dest: "The strongroom (R4).", why: "Why it exists." } },
    enc: { E1: { t: "The wheel turns", at: "R1", d: "What happens, when, and what it costs." } }
  }

  // Later, to make the place bigger without touching the original (the page gets size buttons):
  // expand: [{ grow: [0, 0, 6, 0], ov: "What the bigger map adds.", floors: { 0: { R: [...], D: [...], M: [...] } }, add: [ { n: "LOFT", ... } ], rooms: {...}, clues: {...} }]
});
