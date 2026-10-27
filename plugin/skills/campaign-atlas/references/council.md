# The story council

When the user hands over a story, it goes to the council before anything is mapped. Four writers read it, argue over it, mend its holes, people it with characters worth meeting, and fill it out into a story that can be played. Then a judge judges what they made, strictly and with reasons; they mend what the judge fails; and the story is finished only when all five agree on it. **Which writers sit depends on the world the story is set in** (the user's master plan, 26 Oct 2026): for a mystery or a horror in our world, in any period, the user's own council of Doyle, Christie, Poe and Lovecraft with J. R. R. Tolkien judging; for fantasy, Martin, Le Guin, Howard and Pratchett with Tolkien judging; for science fiction, Asimov, Clarke, Herbert and Dick with Stanisław Lem judging; and for crime, intrigue or history in our world, writers of those (section 2). The sitting is the same for every council. The user asked for this in so many words: full creative freedom, any length, as long as the core of their story survives and the result is gripping; and (14 Oct 2026) "Tolkien should be really judging, and all 5 of the writers agree on what should be written at the end: Tolkien just judges how good they did, and then they all have to agree on a finished product". And because it will be played at a table, it has to run on clues.

**The council's job is to make the story as interesting to play as possible** (the user's words, 15 Oct 2026). Every proposal, every cut and every addition is weighed by that: does it give the players more to discover, more to choose, more to fear, more people worth talking to? A change that makes the story neater but duller to play is refused.

Do this every time a story is given, without being asked again. Do not ask the user for permission to change things: change them, write down what changed, and tell them at the end.

**Settings may come with the story** (in the Campaign Atlas app, `story/brief.md` and `story/council.json`; otherwise from what the user says), and they bind the council:

- **The world**: fantasy, science fiction, or the modern world or any period (with its year, region and age), as `genre` in `campaign.js`; and **the kind of campaign**: detective (a structured mystery), sandbox (a living world, no set trail and no main quest) or hybrid (a living world with mysteries in it), as `kind`. Without them, the council reads them from the story and sets them. They choose the council and what it makes (sections 2, 6 and 6b).
- **The council itself**, when the game master changed it (`story/council.json`: a council, writers taken off or put in, another judge, guest specialists). `node scripts/atlas.js council <campaign>` prints who sits and how each reads a story; that is the council, whatever this file's examples say.
- **The details** the game master chose (tone, how much horror, magic or technology, how big a world, how many settlements, factions and events, how much combat and how hard the mystery, when it starts): the council works to them.

- **How much it may change the story**, from *Stay true* (keep the plot, people and places as written; only close holes and add what play needs) through *Balanced* (keep the core and the main turns) to *Free rein* (only the core idea is the user's). Without a setting, the council works at *Balanced* with the Core below.
- **How long the story should be.** The story bible is read by the game master like a detective novel, to know everything that is happening: the longer and more detailed, the better, and a hundred pages is not too much. The length given is a floor, not a ceiling. Without a setting, aim for about a hundred pages (some 40,000 words) for a campaign and never less than thirty for a one-shot.

## Contents

1. The Core: what may not change
2. The four writers
3. The judge
4. The clerk
5. The sitting, round by round
6. What the council must produce (6b: a living world)
7. The playability audit
8. The judgement
9. The agreement
10. Length and how to write it
11. Files
12. What to tell the user

## 1. The Core: what may not change

Before the writers speak, write the Core: five to ten plain sentences that say what the user's story *is*. Typically: the premise, the central mystery or threat and the truth behind it, who the player characters are, where and when it happens, any person or event the user clearly cares about, the kind of ending they want, the tone, the game system.

Everything outside the Core is the council's to change, cut, rename or replace. Inside it, nothing changes. If a hole turns out to be *in* the Core, the council finds a fix that keeps the Core true and flags it for the user rather than overruling them.

Write the Core at the top of `story/council.md` and of `canon.md`. Every later proposal, and every judgement, is tested against it.

## 2. The four writers

They are four ways of reading a story, each with a job. Write them in their own voices: it keeps the views apart and makes the transcript worth reading. Capture how each thinks; never quote or paraphrase their published work. Each is a creative profile drawn from what a writer gave to literature, not the writer: the council never claims to be them or to write as they wrote.

**Who sits.** `atlas.js council <campaign>` prints the four (or as many as the game master left on), each with what they bring and how they read a story, from `scripts/councils.js`, which holds every council. Read them as fully as the four below are written, and keep each one's job distinct: five agents with different names and the same opinions are no council. A science fiction story that is a horror or a mystery keeps the science fiction council, its focus turned to the horror or the mystery; a fantasy murder keeps the fantasy council. Where a story is a mystery in a council that has no detective, the writers take up Doyle's and Christie's questions among them (who could find out, and how; who had reason), and the audit's three-clue rule holds all the same.

**Guests.** The game master may add specialists (investigation logic, historical accuracy, military strategy, political systems, planetary ecology, horror atmosphere, puzzle design, economy, or their own). A guest does not replace a writer and writes no plot: in Round 1 they read for their speciality, in Round 3 they raise what is wrong in it, and at the agreement they sign that their speciality is sound. What they raise must be mended or answered, like the judge's points.

The mystery-and-horror council, the user's own, as the example of how fully each member is read:

**Sir Arthur Conan Doyle: the chain of reasoning.** He asks how anyone would *find out*. Every conclusion must be reachable from things that can be seen, measured, smelt or handled; an observant person should be able to say "you have been in Afghanistan, I perceive" and be right for reasons. He supplies physical evidence, the small detail that does not fit, the rational explanation under the apparently impossible, the strong client and the worthy adversary, and the pace of a hunt. He distrusts coincidence and any solution that needs a confession.

**Agatha Christie: the people and the puzzle.** She asks who had reason, who had the chance, and who is lying about something else entirely. Everyone in the circle has a secret; most secrets are not the crime. She supplies the cast and the web between them (money, love, fear, old wrongs), the timetable and the alibis, misdirection that plays fair, the least likely person made inevitable, and the scene where it all comes out. She distrusts any villain with no life outside the plot, and any clue that only one person could ever notice.

**Edgar Allan Poe: the dread and the mind.** He asks what it should *feel* like and what it does to the people in it. He supplies atmosphere, obsession, the thing glimpsed and not explained, the mind under strain, the set-piece that nobody forgets, the cipher and the buried secret, and the single effect the whole tale should leave. He also invented the reasoning detective, so he will argue method with Doyle. He distrusts comfort, tidy morals, and a horror that turns out to mean nothing.

**H. P. Lovecraft: the vast and the unknowable.** He asks what lies behind the thing everyone can see, how old it is, and what it costs to know it. He supplies scale (deep time, a history older than the town, an indifference larger than any villain); forbidden knowledge and its price (the truth that undoes the one who learns it, which at the table is a cost: sanity, standing, a choice that cannot be unmade); dread told through documents (diaries, letters, depositions, clippings: the handouts the players will hold); the place itself as the horror (the decayed town, the old house, the geography that is wrong); and restraint, the less shown the more felt. He distrusts monsters that are only animals with teeth, explanations that comfort, gore in place of awe, and endings that put the world back as it was. Where the story is not supernatural he still reads for the thing beneath: the old crime a town is built on, an inherited guilt, a knowledge that should have stayed buried. Take his sense of scale and dread and his craft with documents; leave his prejudices behind him. No people are made monstrous for where they come from, and the care rule of the audit binds him first.

They disagree by nature: Doyle wants it explicable, Poe wants some of it not to be, and Lovecraft wants the explanation found and worse than the mystery; Christie wants the answer among the people at the table, Doyle wants it in the mud on a boot, Lovecraft wants it older than any of them. The disagreements are the point. Do not smooth them over. The clerk keeps Lovecraft to the Core: no gods from beyond in a story that has none; where the Core is human, his scale comes through the human story.

## 3. The judge

The judge is J. R. R. Tolkien, except for science fiction, where it is Stanisław Lem (or whoever the game master chose: `atlas.js council`). The judge works the same way whoever it is.

**J. R. R. Tolkien: the judge.** He takes no part in the debate and writes no plot. When the four have built the story and the audit has passed, he reads all of it and judges how good it is: a scholar marking an examination, not a friend giving praise. He gives every judgement a grade and a reason, says plainly what is good and why and what is not and why, and says what it would take to pass. He is not easily pleased: a grade must be earned in the text, and "it is fine" is not a judgement. What he judges is in section 8.

He judges by the measures he lived by: that a world must be there before the story starts (its history, its older names, its ruins, its customs, glimpsed and not all explained); that names and words must belong to their language, people and century; that every date, distance and journey must hold; that plain strong words beat strings of adjectives, and what is read aloud must sound well spoken; that a story must mean something beyond its plot; that hope, when it comes, must be earned and must cost, and grief must keep its dignity; and that what serves only the writer should go.

He has no veto over the Core, which is the user's, or over a rule of play, which is the clerk's; anything else he fails must be mended or answered.

**Stanisław Lem: the judge of science fiction.** He judges as strictly, with the same grades and the same form (section 8), by his own measures: that the science holds, or where it is bent, it is bent on purpose and its consequences followed; that the alien is truly other, not a human in a mask, and that contact can fail; that technology changes how people live, think and rule, and not only what they carry; that isolation and the unknown are felt, not explained away; that an idea is followed further than is comfortable; and that people stay fallible, with science a human effort and not magic. In section 8 he reads "The world before the story" as the history of the worlds and their technology, "Names and words" as the speech and terms of the age to come, and adds a measure of his own: **The idea**: is there one, and is it followed through?

## 4. The clerk

You are the clerk. You keep the Core, keep the minutes, break ties among the writers, and speak for the table: the referee who must run this and the players who must be able to solve it. The clerk has the last word on one question only: can it be played?

Ties among the writers are settled in this order: the Core; then what plays best; then what leaves the stronger effect. Record the loser's objection as a dissent when it has merit. A dissent often becomes an optional scene or an alternative ending. The clerk does not decide the finished story alone: that takes all five (section 9).

## 5. The sitting, round by round

**Round 0. The reading.** The clerk summarises the story as given, writes the Core, and lists every hole, vagueness and unanswered question found (motives that do not hold, events with no cause, places with nothing to do, characters who exist only to deliver one line, a mystery with one path to its answer).

**Round 1. Four readings.** Each writer, briefly and in voice: what is good and must be kept, the three worst weaknesses as they see them, and the one thing they would add first.

**Round 2. Proposals.** Each brings concrete material, not advice: named characters with histories and motives, specific clues and where they lie, scenes, reversals, places. Number the proposals so they can be argued over.

**Round 3. The debate.** They go through the proposals and the clerk's list of holes. Where they agree, adopt and move on. Where they do not, let them argue it properly: each position in a few sentences, a rejoinder, then the clerk's ruling with its reason. A full campaign should have at least a dozen points genuinely argued. Every hole from Round 0 must end the round closed, with the fix stated.

**Round 4. The build.** Together they produce everything in section 6.

**Round 5. The audit.** The clerk runs section 7 and sends back anything that fails.

**Round 6. The judgement.** The judge (Tolkien, or Lem for science fiction: section 3) judges the whole (section 8) and writes `story/judgement.md`.

**Round 7. The mending.** The writers mend everything the judge graded below the bar, in the bible itself, and answer each point: what they changed, or why they will not (only the Core or a rule of play excuses not mending). The judge judges the mended parts again; repeat until nothing stands below the bar.

**Round 8. The agreement.** All five must agree on the finished story (section 9). Then the clerk lists everything that differs from what the user wrote.

## 6. What the council must produce

For a detective campaign (and for the investigations of a hybrid):

- **The truth.** What really happened, in order, with dates and times. Who did what, why, and what they did afterwards to hide it.
- **The antagonists' plan and its clock.** What they want, the steps they will take, and what happens, step by step, if the players do nothing.
- **The cast.** Every principal with: a name and role; what they look like; how they act (their manner: how they stand, what they do with their hands, how they treat a stranger); how they speak; a background that explains them; who they know and how (family, friends, enemies, employers, debts, old loves: the web of the story, so the players can follow one person to the next); what they want; what they hide; the lie they tell; what makes them talk; what becomes of them. Principals go into `campaign.js` as `ATLAS.cast({...})`.
- **Everyone else.** Every person the players can meet on a map, however minor, gets the same four things in a sentence or two each: what they look like, their story, how they act, and who they know (the user asked for this for "each person in a room"). A guard has a sergeant he fears and a sister he writes to; a maid knows which of the family is kind. These ties are what make a minor person worth talking to.
- **The clue web.** Every conclusion the players must reach, with at least three clues to it, in at least two different places or people. For each clue: where it is, what it is, how it is found, what it reveals, a hint the referee can give if it is missed, and where it leads.
- **Red herrings.** A few, each with a true explanation the players can discover, so a false trail ends in something learned.
- **The places.** Every location the story needs, each with a tier (see `standards.md`), what happens there, who is there, and which clues it holds. If the setting is a real city or site, name the real places the scenes happen in.
- **The acts.** How the story opens, how it turns, where it tightens, and the scenes that must not be lost.
- **The endings.** At least three: one earned, one costly, one failed. Say what each one takes.
- **Hooks and handouts.** How the player characters are drawn in, and the letters, clippings, photographs and maps the players will hold, each written out in full, as the players will read it, in the voice of whoever wrote it.
- **The players' characters, woven in.** When the game master gives their players' characters (`story/pcs.md`), each one gets a reason the story is theirs (a hook tied to the cast or the crime), a secret the story can bring out, and a clue only they would recognise, placed in one of the places. Christie finds the secret and the tie; Doyle places the clue. The game master's own words for who the character is stay as they are.
- **For the table** (`references/table.md`): the antagonists' clocks as steps the referee ticks, each a thing that changes in the world; the campaign split into sessions, each with a strong start and a cliffhanger; the calendar the story keeps and the events that happen in the world whether or not the party acts, some on a date and some in answer to what the party does, each something the players can notice or hear of; a rescue for every clue the story needs (a way it reaches the party if they miss it); the roll that finds each clue and the numbers of whatever may fight, in the game's own rules; a random table or two for each important place; and how hard each place hits, with what it holds, honestly named. These go into `table.js` and the place files when the places are written.

### 6b. A living world: sandbox and hybrid

The user asked (26 Oct 2026) that a sandbox is never forced into a mystery: no set clue trail, no main quest, no combat or detection the story does not want. A sandbox is a world that runs on its own, for the players to go where they like. The council makes, instead of the clue web and the acts:

- **The world as it stands**: its history in brief, what is happening now, the tensions about to break, and what each power wants this year. The truth of it, as the detective's truth is written: who did what, when, and why.
- **Regions and settlements**: each with who rules it, who lives there and how, what it trades and needs, what it fears, its laws and customs, its notable people, and the troubles in it now. Important settlements and sites are places (mapped by tier, as always).
- **Factions**: every power that acts (houses, guilds, churches, companies, gangs, governments, alien polities), with its leader and members, what it has (money, people, arms, knowledge) and lacks, what it wants, its plan and the step it is on, its friends and enemies, and what it does not know. No faction can do more than it has.
- **People with aims**: the cast as in section 6, each with what they want and what they are doing about it now, where they are at what hour, and what they will do if nobody stops them.
- **Hooks**: at every important place, two or more ways into adventure (a job offered, a rumour, a plea, a danger, a prize), each with who gives it, what is really behind it, and where it leads (`hooks: [{ t, d, who, to }]` on the place). Several lead nowhere planned: the world answers whatever the players do.
- **The world in motion**: the events that happen whether or not the players act (`ATLAS.events` in `table.js`, references/table.md, section 18): factions' plans step by step, people's schedules, seasons and markets, each with its cause, its conditions, what calls it off, and what the players can hear of it. At least six for a campaign; the clocks for any power working toward something.
- **Places to explore**: ruins, wilds, derelicts, lairs, each with what is there and why, what it guards, and what finding it changes. Mysteries may lie in them, optional.
- **For a hybrid**: one or more investigations inside the living world, each with its own truth and clue web as in section 6 (three clues to each conclusion), which the players may take up or never notice. The world goes on either way.
- **For the table**: as in section 6, but the sessions are a starting situation and the likely first steps rather than a plan; random tables for each region (encounters, rumours, weather); handouts for the world's notices, letters and news.

The playability audit (section 7) reads differently for a living world: no bottleneck and real choice still hold; the three-clue rule binds only the investigations; and two more are added. **Many doors**: from wherever the players stand, there are at least two places to go and a reason to go to each. **The world moves**: if the players do nothing, something they can notice changes within a session, and nothing catastrophic happens without a cause the campaign gives.

## 7. The playability audit

A story that reads well can still be unplayable. Check, and fix what fails:

- **Three clues.** For every necessary conclusion, list its clues. Fewer than three, or all in one place, fails.
- **No bottleneck.** No single door, roll, conversation or survivor that the whole story must pass through.
- **Choice.** At each stage the players have at least two sensible things to do next, and what they choose changes something.
- **The idle table.** If the players stall, the clock moves and brings the story to them.
- **A fair solution.** A group that pays attention can work out the truth before it is told to them.
- **Something for each kind of player.** Talking, searching, thinking, daring, and (where the game has it) fighting.
- **The game's own rules.** The skills, checks and dangers suit the system named in the Core.
- **Care.** If the setting is a real atrocity or a living people's grief, the story is accurate and the victims are people, not scenery.

## 8. The judgement

The judge judges, in their own voice, each chapter of the bible and the whole, against these measures:

| Measure | What he asks |
|---|---|
| The world before the story | Is there a history behind the page, older names, ruins, customs, glimpsed and not all explained? Or does the world begin where the plot does? |
| Names and words | Does every name belong to its language, people, place and century? Are any two easily confused? Is any word out of its time (a guard of 1944 does not say "okay")? |
| Consistency | Do the dates, distances, travel times, weather and moon hold? Does each person know only what they could know, when they could know it? Do the maps and the text agree? |
| The read-aloud | Does every passage meant to be read to the players sound well spoken: strong plain words, sentences the voice can carry, the first thing heard the thing that matters? |
| The people | Does each have a life beyond their use to the plot? Would the players remember them? |
| The meaning | Does the story mean something beyond its plot, without preaching it? |
| Hope and grief | Is the earned ending earned, does the costly one cost, does the failed one keep its dignity? |
| What should go | A scene that repeats another, a person with no work, a flourish that serves only the writer. |

Every judgement carries a grade and its reason: **Excellent**, **Good**, **Wanting**, **Poor**. The bar is Good: anything Wanting or Poor must be mended. Write `story/judgement.md` as:

1. **His verdict on the whole**, in a paragraph, with its grade.
2. **Chapter by chapter**: the grade, then *What is good, and why* (to keep, with the reason it works) and *What is not, and why* (each fault: where it is, why it fails, what would mend it).
3. **The measures**: one grade and one reason for each row of the table above.
4. **After the mending**: each failed point judged again, with the new grade and why.

## 9. The agreement

The story is finished only when all five agree on it: the four writers and the judge (Doyle, Christie, Poe, Lovecraft and Tolkien, for the user's own council; whoever `atlas.js council` names otherwise). Guests sign too, for their speciality. Each says, in voice, whether they put their name to it, and if not, exactly what would change their mind. An objection goes back to the mending: the four mend, Tolkien judges the mended part, and all five are asked again. Nobody is outvoted; a point is closed only when all five accept it. The ways to agreement are a better version that answers both sides, an optional scene or alternative ending that keeps what each side wants, or a writer persuaded on the page by an argument (record it). The Core and the rules of play bind all five: an objection to either is answered by explaining it, not by changing it.

Write the agreement at the end of `story/council.md`: each of the five signs with a line on why they are content, and the clerk records the unanimous verdict and Tolkien's final grade for the whole. Only then is the bible final and mapping begins.

## 10. Length and how to write it

Write as much as the story deserves, and at least the length that was asked for (section 1's settings: about a hundred pages when nothing was said). Fifty pages, a hundred, five hundred: the user has said length does not matter and dullness does, and that "the longer the story the better, because the DM can read it like a detective book and know everything that's happening". Never shorten to save effort, and never pad: a long bible is long because it holds more people, more places and more to find, each of them specific: what every person did and when, where every clue came from and how it got there, what each knows and hides, what happens hour by hour if the players do nothing.

A long bible is written in parts, one file per chapter, each finished before the next is begun: the truth and timeline; the cast; the clue web; the places; the acts, scene by scene; the endings; handouts. Prefer the named and the dated to the general: "the 9.40 from Paddington, late by eleven minutes" over "a train".

## 11. Files

| File | What it holds |
|---|---|
| `story/source.*` | The user's story exactly as given. Never edited. |
| `story/council.md` | The Core, the readings, the proposals, the debate with rulings and dissents, the mending, the agreement of all five, the list of changes. |
| `story/bible.md` or `story/bible/NN-name.md` | The finished, playable story: everything in section 6, as all five agreed it. |
| `story/judgement.md` | The judge's judgement (Tolkien's, or Lem's): his verdict, grades and reasons, chapter by chapter, and his judgement again after the mending. |
| `canon.md` | The Core and the facts sheet every map is checked against, brought up to date from the bible. |
| `campaign.js` | `ATLAS.cast({...})` for the principals; the places registered with their tiers. |
| `table.js` | The clocks, the session plan, the calendar and the world's events, the players' characters, ways back, random tables and handouts that belong to no clue (`references/table.md`). |
| `story/pcs.md` | The players' characters as the game master gave them, when they did. Never edited. |

`build` puts the bible on the page's Story view, and with it, under "How it was made", the council's debate, Tolkien's judgement and the story as given.

## 12. What to tell the user

When the sitting is over, tell them in plain words: what the council kept, the main things it changed and why, who it added, Tolkien's verdict and grade with the main things he made them mend, how the five came to agree (and any point that took long), anything in the Core they were tempted to touch, and where to read the whole debate and the judgement. They may strike any change; strike it without argument and let the council mend around it.
