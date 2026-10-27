// The story councils (the user's master plan, 26 Oct 2026, parts 1 to 3): one council, the same sitting for every
// campaign (references/council.md), whose writers change with the world it is set in. Fantasy has its fantasy writers,
// science fiction its own (and keeps them for a space horror or a mystery on a colony: the council turns its focus,
// it is not replaced), and the modern world or any period keeps the user's own mystery-and-horror council where the
// story is a mystery or horror, and other writers for crime, intrigue and history. Each member is a creative profile
// drawn from what a writer gave to literature: how they read a story and what they would add. Not the writer, and never
// their words: the council does not claim to write as they did. Guests are specialists the game master may add; they
// strengthen the council and replace no one. Used by atlas.js (council, init, check) and by the Atlas app's form.
"use strict";

// every member: name, what they bring (short, for the app), and how they read a story (for the sitting)
const MEMBERS = {
  doyle: { name: "Sir Arthur Conan Doyle", brings: "The chain of reasoning: physical evidence, deduction, a rational answer under the impossible",
    reads: "He asks how anyone would find out. Every conclusion must be reachable from things that can be seen, measured, smelt or handled. He supplies physical evidence, the small detail that does not fit, the rational explanation under the apparently impossible, the strong client and the worthy adversary, and the pace of a hunt. He distrusts coincidence and any solution that needs a confession." },
  christie: { name: "Agatha Christie", brings: "The people and the puzzle: motives, alibis, secrets, fair misdirection",
    reads: "She asks who had reason, who had the chance, and who is lying about something else entirely. Everyone in the circle has a secret; most secrets are not the crime. She supplies the cast and the web between them (money, love, fear, old wrongs), the timetable and the alibis, misdirection that plays fair, the least likely person made inevitable, and the scene where it all comes out. She distrusts any villain with no life outside the plot, and any clue only one person could ever notice." },
  poe: { name: "Edgar Allan Poe", brings: "Dread and the mind: atmosphere, obsession, the unforgettable set-piece",
    reads: "He asks what it should feel like and what it does to the people in it. He supplies atmosphere, obsession, the thing glimpsed and not explained, the mind under strain, the set-piece nobody forgets, the cipher and the buried secret, and the single effect the whole tale should leave. He distrusts comfort, tidy morals, and a horror that turns out to mean nothing." },
  lovecraft: { name: "H. P. Lovecraft", brings: "The vast and the unknowable: deep time, forbidden knowledge and its price, dread told in documents",
    reads: "He asks what lies behind the thing everyone can see, how old it is, and what it costs to know it. He supplies scale, forbidden knowledge and its price at the table (sanity, standing, a choice that cannot be unmade), dread told through documents the players will hold, the place itself as the horror, and restraint. He distrusts monsters that are only animals with teeth and endings that put the world back as it was. Take his sense of scale and his craft with documents; leave his prejudices behind: no people are made monstrous for where they come from." },
  chandler: { name: "Raymond Chandler", brings: "The mean streets: a city's corruption, voice, the investigator's code",
    reads: "He asks what the city is hiding and who it is paying. He supplies the corrupt and the respectable who are the same people, the client who lies, the cop who is tired, the rich family rotten at the root, a voice for every bar and back room, and an investigator who keeps a code no one pays for. He distrusts puzzles with no social cost and villains without money behind them." },
  hammett: { name: "Dashiell Hammett", brings: "Hard action and rival gangs: the operative who plays factions against each other",
    reads: "He asks who profits and how they can be turned on each other. He supplies rival outfits, crooked officials, double-crosses, violence that has consequences, and an investigator who works by stirring things up and watching what floats. He distrusts long explanations, and any mystery solved at a desk." },
  simenon: { name: "Georges Simenon", brings: "Understanding the guilty: ordinary lives, small places, why people break",
    reads: "He asks what drove an ordinary person to it. He supplies the street, the café, the boarding house, the family; the slow understanding of a life rather than the clever trick; pity for the guilty; and the weight of routine. He distrusts monsters and geniuses: the people he believes in are tired, frightened and human." },
  highsmith: { name: "Patricia Highsmith", brings: "The criminal's side: guilt, charm, suspense from within",
    reads: "She asks what it is like to be the one who did it, and to get away with it a little longer. She supplies charming liars, the pressure of a secret, suspicion that turns on the innocent, and suspense that comes from the guilty watching the net close. She distrusts justice that arrives on time." },
  lecarre: { name: "John le Carré", brings: "Espionage as it is: tradecraft, institutions, betrayal, moral grey",
    reads: "He asks who in the service is lying to whom, and what loyalty costs. He supplies tradecraft (dead drops, cover stories, the long debrief), institutions that protect themselves, the mole, the agent sacrificed for a larger game, and victories that feel like losses. He distrusts heroes, gadgets and clean endings." },
  greene: { name: "Graham Greene", brings: "Conscience in dangerous places: faith, compromise, the outsider abroad",
    reads: "He asks what a person will betray and what they will not. He supplies hot, failing places at the edge of empires, the compromised outsider, the innocent who does harm, faith and its loss, and choices with no clean side. He distrusts certainty, in heroes and in causes." },
  ambler: { name: "Eric Ambler", brings: "The amateur caught in the machine: arms, borders, commercial intrigue",
    reads: "He asks how an ordinary person gets pulled into a game run by arms dealers, police and governments. He supplies frontiers and papers, businessmen who are worse than spies, the innocent abroad, and plots driven by money rather than ideology. He distrusts supermen." },
  fleming: { name: "Ian Fleming", brings: "Glamour and spectacle: the larger-than-life villain, set-pieces, pace",
    reads: "He asks where the excitement is. He supplies the memorable villain with a lair and a plan, exotic places, the casino, the chase, the gadget used once and well, and a pace that never lets go. He distrusts dull rooms and long meetings." },
  dumas: { name: "Alexandre Dumas", brings: "Historical adventure: swashbuckling, loyalty, court intrigue, revenge",
    reads: "He asks where the sword is drawn and for whom. He supplies friendship and loyalty under strain, court plots, disguises, duels and escapes, the long revenge, and history as a stage for bold people. He distrusts characters who will not act." },
  scott: { name: "Sir Walter Scott", brings: "History lived from below: clans, landscape, old loyalties in a changing age",
    reads: "He asks how great events fall on ordinary people caught between sides. He supplies landscape that carries history, clans and old loyalties, customs and speech of the time, and the moment one age gives way to the next. He distrusts history told only through kings." },
  renault: { name: "Mary Renault", brings: "The ancient world made real: its customs, beliefs, honour and war",
    reads: "She asks how these people truly thought: their gods, their honour, their ideas of love and duty, without our assumptions laid over them. She supplies the ancient world exact in its customs, ritual, warfare and politics, and people who are of their time. She distrusts modern minds in old costume." },
  eco: { name: "Umberto Eco", brings: "Learned mysteries: libraries, signs, heresies, conspiracies of scholars",
    reads: "He asks what the signs mean and who decides what they mean. He supplies the abbey and the library, codes, forbidden books, theological quarrels that kill, conspiracies built from misreadings, and a mystery whose answer is also an idea. He distrusts the merely clever." },
  tolkien: { name: "J. R. R. Tolkien", brings: "Deep mythology, world history, languages and cultures, geography that holds",
    reads: "He asks what lay here before the story. He supplies ages of history, older names and the languages they come from, ruins and customs glimpsed and not all explained, consistent geography and journeys, and an epic scale earned by small faithful people." },
  martin: { name: "George R. R. Martin", brings: "Political intrigue: noble houses, succession, rivalries, consequences",
    reads: "He asks who wants the throne, the land or the marriage, and what it costs everyone else. He supplies noble houses with histories and grudges, succession quarrels, shifting alliances, characters whose motives make sense from inside, and decisions with consequences that land on the innocent. He distrusts pure heroes and pure villains." },
  leguin: { name: "Ursula K. Le Guin", brings: "Cultures and societies: belief, magic with rules and costs, believable civilizations",
    reads: "She asks how these people live: what they eat, believe, forbid and fear, and how their society holds together. She supplies cultures that are whole, magic that has rules and costs, balance and its loss, and conflict between ways of life rather than good and evil. She distrusts empty kingdoms that exist only to be fought over." },
  howard: { name: "Robert E. Howard", brings: "Adventure: dangerous wilderness, ancient ruins, sword and sorcery",
    reads: "He asks where the danger is and who is bold enough to face it. He supplies wild lands and the ruins of fallen kingdoms, sorcery that is old and wrong, treasure and the price of taking it, and a pace of action. He distrusts long talk and safe roads." },
  pratchett: { name: "Terry Pratchett", brings: "Memorable people and living towns: institutions, everyday life, humane wit",
    reads: "He asks how the town actually works: who empties the privies, who runs the guilds, what the watch is paid, and what an ordinary person makes of the marvels. He supplies memorable people, living settlements with institutions and quarrels, everyday social life, and humour that tells the truth. He distrusts heroes who are never inconvenienced by daily life." },
  asimov: { name: "Isaac Asimov", brings: "Galactic civilizations, robotics, technology, large-scale social systems",
    reads: "He asks how the whole society works and where it is heading. He supplies civilizations across centuries and worlds, robots and the rules they keep (and how those rules fail), technology with consequences, and puzzles solved by reasoning about systems. He distrusts mysteries that cheat the rules they set." },
  clarke: { name: "Arthur C. Clarke", brings: "Space exploration, scientific discovery, cosmic mysteries, advanced technology",
    reads: "He asks what is out there and what finding it will mean. He supplies voyages that respect physics, the awe of discovery, artefacts older and stranger than humanity, and technology indistinguishable from wonder. He distrusts space that behaves like the sea and aliens that behave like people." },
  herbert: { name: "Frank Herbert", brings: "Interstellar politics, resource scarcity, ecology, religion and power",
    reads: "He asks who controls the scarce thing, and how belief is used to keep it. He supplies ecologies that shape cultures, resources worth wars, religions engineered for power, great houses and guilds, and long plans within plans. He distrusts saviours." },
  dick: { name: "Philip K. Dick", brings: "Paranoia, identity, artificial minds, uncertain reality",
    reads: "He asks whether anything here is what it seems, including the players. He supplies false memories, androids and people who cannot tell which they are, corporations that own reality, drugs and dreams, and the creeping doubt that makes a scene unforgettable. He distrusts any answer that settles everything." },
  lem: { name: "Stanisław Lem", brings: "Alien intelligence, isolation, the unknowable, philosophical science fiction, hard first contact",
    reads: "He asks whether the alien is truly alien, or a human in a costume. He supplies contact that may be impossible, phenomena that defy understanding, isolation that tests the mind, and science as a human, fallible effort." }
};

// the councils: four who debate and one who judges; which suits which world and story
const ROSTERS = {
  mystery: { label: "Mystery and horror", for: "modern", members: ["doyle", "christie", "poe", "lovecraft"], judge: "tolkien",
    when: "Mysteries, detective stories, horror and the supernatural, in any period (the user's own council, kept where the story is a mystery or horror)." },
  noir: { label: "Crime and noir", for: "modern", members: ["chandler", "hammett", "simenon", "highsmith"], judge: "tolkien",
    when: "Crime, gangs, corruption, police stories and noir, from the 1920s to now." },
  intrigue: { label: "Espionage and intrigue", for: "modern", members: ["lecarre", "greene", "ambler", "fleming"], judge: "tolkien",
    when: "Spies, political thrillers, conspiracies, diplomacy and wartime secret services." },
  history: { label: "Historical adventure", for: "modern", members: ["dumas", "scott", "renault", "eco"], judge: "tolkien",
    when: "Adventure and intrigue in a historical period: the ancient world, the Middle Ages, the early modern age (with Christie or Doyle as a guest when the story is a mystery)." },
  fantasy: { label: "Fantasy", for: "fantasy", members: ["martin", "leguin", "howard", "pratchett"], judge: "tolkien",
    when: "Every fantasy: high, dark, low, sword-and-sorcery, political. The focus turns to a mystery or a horror when the story is one; the council stays." },
  scifi: { label: "Science fiction", for: "scifi", members: ["asimov", "clarke", "herbert", "dick"], judge: "lem",
    when: "Every science fiction: space opera, exploration, hard science fiction, space horror, corporate dystopia, first contact. A horror or an investigation on a station keeps this council, its focus turned to the horror or the mystery." }
};

// the specialists a game master may add to any council (the user's own list)
const GUESTS = {
  logic: { name: "An investigation logic specialist", brings: "Checks every deduction: that each conclusion has three clues, no clue needs a leap, and the solution is fair." },
  history: { name: "A historical accuracy specialist", brings: "Checks dates, technology, dress, speech, law and prices against the period, and names any anachronism." },
  military: { name: "A military strategy specialist", brings: "Checks forces, ranks, logistics, tactics and the conduct of war, and what an army could really do." },
  politics: { name: "A political systems specialist", brings: "Checks how power works here: offices, laws, succession, factions, and who can really order what." },
  ecology: { name: "A planetary ecology specialist", brings: "Checks climates, food chains, atmospheres and resources, and what a world can and cannot sustain." },
  horror: { name: "A horror atmosphere specialist", brings: "Checks the dread: pacing, restraint, the unseen, and that each frightening scene earns its effect." },
  puzzles: { name: "A puzzle design specialist", brings: "Checks every riddle, lock and trap: one answer, a fair clue, and a way past for a table that fails." },
  economy: { name: "An economy specialist", brings: "Checks money, trade, wages and prices, and what each faction can afford to do." }
};

// the three worlds and the three kinds of campaign (the user's own words for them)
const GENRES = {
  fantasy: { label: "Fantasy", says: "Medieval kingdoms, high or dark fantasy, sword and sorcery, magic, monsters, dungeons, guilds and noble houses.", subs: ["High fantasy", "Dark fantasy", "Sword and sorcery", "Low fantasy", "Political intrigue", "Fantasy mystery", "Fantasy horror"] },
  scifi: { label: "Science fiction", says: "Space opera, exploration, hard science fiction, space horror, corporate dystopia, alien civilizations, stations and starships.", subs: ["Space opera", "Exploration", "Hard science fiction", "Space horror", "Corporate dystopia", "First contact", "Mystery on a colony or station"] },
  modern: { label: "The modern world, or any period", says: "Any time from the ancient world to tomorrow, real or alternate history: a year, a place, an age of technology.", subs: ["Mystery and horror", "Crime and noir", "Espionage and intrigue", "Historical adventure", "War", "Thriller", "Something else"] }
};
const KINDS = {
  detective: { label: "Detective / investigation", says: "A structured mystery: suspects, clues, evidence, timelines and what each person knows." },
  sandbox: { label: "Living world / sandbox", says: "A world that runs on its own: settlements, factions, people with aims, places to explore and plans in motion. No set clue trail and no main quest." },
  hybrid: { label: "Hybrid", says: "A living world with investigations woven into it: the players may follow the mysteries, or not." }
};
// the modern world's council by its kind of story
const MODERN_SUB = { "Mystery and horror": "mystery", "Crime and noir": "noir", "Espionage and intrigue": "intrigue", "Historical adventure": "history", "War": "history", "Thriller": "intrigue" };

// the council for a campaign: the game master's choice (story/council.json) over the default for its world
function defaultRoster(genre, sub) {
  if (genre === "fantasy") return "fantasy";
  if (genre === "scifi") return "scifi";
  return MODERN_SUB[sub] || "mystery";
}
function councilOf(cfg, chosen) {
  const c = chosen || {}, rid = ROSTERS[c.roster] ? c.roster : defaultRoster(c.genre || cfg.genre, c.sub || cfg.subgenre), R = ROSTERS[rid];
  const ids = Array.isArray(c.members) && c.members.length ? c.members.filter(m => MEMBERS[m]) : R.members.slice();
  const judge = MEMBERS[c.judge] ? c.judge : R.judge;
  const guests = (Array.isArray(c.guests) ? c.guests : []).map(g => typeof g === "string" ? (GUESTS[g] ? Object.assign({ id: g }, GUESTS[g]) : { id: "own", name: g, brings: "" }) : g && g.name ? { id: "own", name: String(g.name), brings: String(g.brings || "") } : null).filter(Boolean);
  return { roster: rid, label: R.label, members: ids.map(id => Object.assign({ id }, MEMBERS[id])), judge: Object.assign({ id: judge }, MEMBERS[judge]), guests };
}

module.exports = { MEMBERS, ROSTERS, GUESTS, GENRES, KINDS, MODERN_SUB, defaultRoster, councilOf };
