// For the table: what the referee needs while the game is played. Written by the council after the bible is agreed and
// the places are registered (references/table.md, where every field is explained). The page's "At the table" view runs
// on it: the villains' clocks, tonight's sheet, the players' characters, handouts, ways back, random tables.

// The villains' clocks: one for each enemy who works while the party investigates. Each tick is a thing that changes in
// the world; the referee ticks it (when) and the last tick leads to what happens when it is full (done).
// ATLAS.clocks([
//   { id: "cult", name: "The cult prepares the rite", who: "The Brethren of the Lamp", segments: 6,
//     when: "Each night the party spends elsewhere.",
//     ticks: ["...", "...", "...", "...", "...", "..."],
//     done: "The rite is performed at the old quarry." }
// ]);

// The sessions: the campaign split into evenings, each with a strong start (something happening) and a cliffhanger.
// ATLAS.sessions([
//   { n: 1, title: "...", hours: 3, places: ["place-id"], start: "...", cliff: "..." }
// ]);

// The players' characters, woven in (only when the game master gave them: story/pcs.md): a hook that makes the story
// theirs, a secret, and a clue of their own at one of the places.
// ATLAS.pcs({
//   id: { n: "Name", player: "Who plays them", concept: "...", bg: "...", hook: "...", secret: "...",
//         clue: { t: "What they find", at: "place-id", d: "What it is" }, places: ["place-id"], ties: { castId: "how" } }
// });

// Ways back when the table is stuck, that belong to no one clue (a clue's own goes on the clue: rescue: "...").
// ATLAS.rescues([{ when: "If they never find the cellar", do: "..." }]);

// Random tables for the whole campaign (each place can have its own: tables: { ... } on the place).
// ATLAS.tables({ "Rumours in the town": ["...", "...", "...", "...", "...", "..."] });

// Handouts that belong to no one clue (a clue's own goes on the clue: handout: { kind, title, text, ... }).
// ATLAS.handouts([{ id: "notice", kind: "notice", title: "...", text: "...", from: "..." }]);
