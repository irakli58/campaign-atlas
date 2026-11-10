// For the table (references/table.md): the Reach goes on whether or not the party acts.
ATLAS.calendar({ start: { day: 1, hour: 8, year: 1203 }, months: [["Frostmoon", 30], ["Thaw", 28], ["Sowing", 30], ["Greenmonth", 31]], weekdays: ["Moonday", "Tirsday", "Wodday", "Thorsday", "Freyday", "Starday", "Sunday"], era: "AR" });
ATLAS.events([
  { id: "storm", title: "A storm off Harrowgate", when: "day 3 20:00", importance: "notable", place: "harbour-inn",
    what: "A winter storm drives the fishing fleet in; one boat does not come back.", why: "The abbey's bells rang the night before: something under the water calls the storms.",
    players: "The harbour bell tolls for a boat that has not come home." },
  { id: "tithe", title: "The baron's men collect the tithe early", when: "day 5 09:00", importance: "major", place: "keep",
    what: "The baron's sergeant takes the winter tithe a month early, by force where he must.", why: "The baron owes the Merchants' Guild more than he can pay.",
    then: "The Warrens go hungry; the guild buys up the debts.",
    effects: [{ faction: "baron", has: { money: 1 } }, { faction: "baron", has: { influence: -1 } }, { faction: "guild", gains: "mill" }], outcomes: ["The town pays and resents it", "A riot at the Guildhall", "The party finds out about the debt"],
    news: { headline: "The tithe is called early", text: "Criers in every ward: the baron's tithe is due this Starday.", paper: "The town criers" } },
  { id: "mill-fire", title: "Harrow's Mill burns", after: [{ event: "tithe", hours: 48 }], unless: [{ visit: "mill" }], importance: "major", place: "mill",
    what: "Someone fires the mill before anyone can see what turns its sails at night.", why: "The miller's creditor at the guild wants the land, and what is under it.",
    players: "Smoke over the Warrens: Harrow's Mill is burning." }
]);

// The powers of the Reach (references/table.md, section 19).
ATLAS.factions({
  baron: { n: "House Ravenhold", kind: "the baron's house", leader: "Baron Aldric Ravenhold", hq: "keep", territory: ["keep", "tavern", "temple"],
    has: { money: 1, people: 3, arms: 3, influence: 4, knowledge: 2 }, lacks: "Money: the house is mortgaged to the guild.",
    wants: "To keep his seat without the town learning how deep his debts run.", plan: ["Call the winter tithe early", "Sell the guild the mill's land", "Marry his daughter to the guildmaster's son"],
    doing: "Squeezing the Warrens for the tithe.", rels: { guild: ["wary", "He owes them more than he can pay"] }, party: "neutral",
    knows: "That the guild holds his notes.", wrong: "That the guild wants only money.", inner: "His sergeant is tired of collecting from starving people." },
  guild: { n: "The Merchants' Guild", kind: "the town's merchants", leader: "Guildmaster Sabeth Orme", hq: "guild", territory: ["guild", "forge"],
    has: { money: 5, people: 2, arms: 1, influence: 3, knowledge: 4 }, lacks: "A claim to rule: they have the money and no title.",
    wants: "The baron's seat, bought rather than taken.", plan: ["Buy up the baron's debts", "Take the mill's land", "Marry into the house"],
    doing: "Buying up debts in the Warrens.", rels: { baron: ["wary", "Their debtor, for now"] }, party: "friendly",
    knows: "What lies under the mill.", inner: "The smiths' guild resents the merchants." }
});
