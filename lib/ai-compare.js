// The quality comparison (the local AI plan's phase 6; the user's local AI request of 17 Nov 2026): one fixed set of
// questions, the kinds of work Atlas asks a model for, put to each model the game master chooses (the local ones they
// have downloaded, and Claude if they tick it) and checked by plain rules: valid JSON with the fields asked, the names
// given kept and none invented where it matters, the facts of the campaign respected, lengths kept. The checks see only
// what can be checked by rule; the answers are kept beside them for the game master's own reading. Nothing is sent
// anywhere but to the models chosen.
"use strict";

const J = t => { const m = String(t || "").match(/\{[\s\S]*\}|\[[\s\S]*\]/); if (!m) return null; try { return JSON.parse(m[0]); } catch (e) { return null; } };
const words = t => (String(t || "").match(/\S+/g) || []).length;
const has = (t, w) => String(t || "").toLowerCase().includes(String(w).toLowerCase());
const noAI = t => !/as an ai|language model|i cannot help|i'm sorry, but/i.test(String(t || ""));

const TESTS = [
  { id: "fantasy", title: "A fantasy campaign's people", kind: "writing",
    prompt: `A fantasy campaign: the river town of Elmsford, ruled by the Merchant Guild; an old bridge troll, Grudd, takes tolls. Invent three people of Elmsford for the game master. Answer with only JSON: {"people":[{"name":"","role":"","want":"","secret":""}]}`,
    checks: [["valid JSON", (t, j) => !!j], ["three people", (t, j) => !!j && Array.isArray(j.people) && j.people.length === 3], ["each has a want and a secret", (t, j) => !!j && Array.isArray(j.people) && j.people.every(p => p && p.want && p.secret)], ["names are new (not Grudd)", (t, j) => !!j && Array.isArray(j.people) && j.people.every(p => p && p.name && !has(p.name, "grudd"))]] },
  { id: "mystery", title: "A Call of Cthulhu mystery's clues", kind: "suggesting",
    prompt: `A Call of Cthulhu mystery, Arkham 1925. The truth (the Keeper's only): Dr Ellen Price, the asylum's surgeon, killed the antiquarian Silas Webb to take his copy of the Book of Eibon, now hidden in the asylum's chapel. Write clues that lead investigators to the chapel, following the three-clue rule. Answer with only JSON: {"clues":[{"title":"","where":"","what":"","leads_to":""}]}`,
    checks: [["valid JSON", (t, j) => !!j], ["at least three clues", (t, j) => !!j && Array.isArray(j.clues) && j.clues.length >= 3], ["at least three lead to the chapel", (t, j) => !!j && Array.isArray(j.clues) && j.clues.filter(c => c && has(c.leads_to, "chapel")).length >= 3], ["each says where it is found", (t, j) => !!j && Array.isArray(j.clues) && j.clues.every(c => c && c.where)]] },
  { id: "scifi", title: "A science fiction place", kind: "writing",
    prompt: `Science fiction, the year 2291. Describe Kestrel Station, a mining outpost on an ice moon of Saturn, for the game master to read aloud: one paragraph, under 120 words, present tense.`,
    checks: [["names Kestrel Station", t => has(t, "kestrel")], ["under 130 words", t => words(t) <= 130 && words(t) >= 30], ["no fantasy words", t => !/\b(tavern|sword|wizard|castle|knight|dragon)\b/i.test(t)], ["no refusal", noAI]] },
  { id: "npc", title: "A person speaking in character", kind: "answering",
    prompt: `You are Old Marta, a suspicious ferrywoman who owes money to smugglers and lies about it. A stranger asks her: "Did you take anyone across the river last night?" Answer as Marta, in her own words only, at most 50 words.`,
    checks: [["at most 60 words", t => words(t) <= 60 && words(t) >= 3], ["stays in character", t => noAI(t) && !/\bas marta\b|\bmarta would\b/i.test(t)], ["does not confess the smugglers", t => !/i owe (the )?smugglers|smugglers? (i|that i) owe/i.test(t)]] },
  { id: "politics", title: "Powers and their relations", kind: "suggesting",
    prompt: `Three powers: the Iron Crown (a kingdom), the Free Cities (a league of merchants), the Ashen Covenant (a cult). Say how each stands toward each of the other two. Answer with only JSON: {"relations":[{"a":"","b":"","stance":"ally|rival|war|trade|wary","why":""}]}`,
    checks: [["valid JSON", (t, j) => !!j], ["all three pairs", (t, j) => { if (!j || !Array.isArray(j.relations)) return false; const k = new Set(j.relations.map(r => [String(r.a || "").toLowerCase(), String(r.b || "").toLowerCase()].sort().join("~"))); return k.size >= 3; }], ["only the powers given", (t, j) => !!j && Array.isArray(j.relations) && j.relations.every(r => [r.a, r.b].every(x => /iron crown|free cities|ashen covenant/i.test(String(x || ""))))], ["stances from the list", (t, j) => !!j && Array.isArray(j.relations) && j.relations.every(r => /^(ally|rival|war|trade|wary)$/i.test(String(r.stance || "").trim()))]] },
  { id: "continuity", title: "Keeping to what happened", kind: "answering",
    prompt: `The campaign so far: Session 1, the players met Mara the clerk, who kept the guild's ledger. Session 2, Mara was found dead in the canal; the ledger is missing. Session 3, Captain Voss said the ledger was sold to the fence called the Magpie. The players ask: "Who can we ask about the ledger now?" Answer the game master in at most 80 words.`,
    checks: [["names the Magpie or Voss", t => has(t, "magpie") || has(t, "voss")], ["does not send them to Mara as if alive", t => !/(ask|talk to|speak (to|with)|visit|find) mara\b/i.test(t) || /mara('s)? (body|grave|room|home|desk|belongings)/i.test(t)], ["at most 90 words", t => words(t) <= 90]] },
  { id: "copilot", title: "Improvising at the table", kind: "answering",
    prompt: `At the table, live: the players have left the planned path and walked into the Weeping Lantern, a tavern by the docks the game master has not prepared. Give the game master something to say and do right now: at most 70 words, ready to use.`,
    checks: [["names the Weeping Lantern or the docks", t => has(t, "lantern") || has(t, "dock")], ["at most 80 words", t => words(t) <= 80 && words(t) >= 15], ["no refusal", noAI]] },
  { id: "data", title: "Structured data", kind: "checking",
    prompt: `Make one monster for a level 3 party. Answer with only JSON, exactly these keys: {"name":"","hp":0,"ac":0,"attacks":[{"name":"","bonus":0,"damage":""}],"weakness":""}. hp between 20 and 60, ac between 10 and 18.`,
    checks: [["valid JSON", (t, j) => !!j], ["the keys asked", (t, j) => !!j && ["name", "hp", "ac", "attacks", "weakness"].every(k => k in j)], ["numbers in range", (t, j) => !!j && +j.hp >= 20 && +j.hp <= 60 && +j.ac >= 10 && +j.ac <= 18], ["attacks listed", (t, j) => !!j && Array.isArray(j.attacks) && j.attacks.length >= 1 && j.attacks.every(a => a && a.name && a.damage)]] }
];

// one model through every test: ask(prompt, kind) gives its text
async function run(ask, onStep) {
  const out = [];
  for (const T of TESTS) {
    const t0 = Date.now(); let text = "", err = null;
    try { text = String(await ask(T.prompt, T.kind) || ""); } catch (e) { err = String(e.message || e).slice(0, 200); }
    const j = J(text), checks = T.checks.map(([label, f]) => { let ok = false; try { ok = !err && !!f(text, j); } catch (e) { ok = false; } return [label, ok]; });
    const r = { id: T.id, title: T.title, pass: checks.filter(c => c[1]).length, of: checks.length, checks, ms: Date.now() - t0, text: text.slice(0, 1500), err };
    out.push(r); if (onStep) onStep(r);
  }
  const pass = out.reduce((n, r) => n + r.pass, 0), of = out.reduce((n, r) => n + r.of, 0);
  return { pass, of, ms: out.reduce((n, r) => n + r.ms, 0), tests: out, t: Date.now() };
}

module.exports = { TESTS, run };
