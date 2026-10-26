/* The story's web: clues as the referee writes and places them on the page, the connections between a clue and the rest
   of the campaign, the story elements Atlas has no place for yet (factions, quests, events, mysteries), the questions an
   investigation leaves open, what each person knows and how they came to know it, and a history of every change, each
   of which can be undone. The user asked for it on 21 Oct 2026 ("place clues on the map", "Auto-Connect to Story",
   "an investigation board", "NPC knowledge").
   Nothing here competes with the campaign's own data: a clue is still a place's clue (its marker on the map, its entry
   in the guide), a person is the cast or a place's people, a place is a place. What the referee writes on the page is
   laid over what the campaign's files say (A.overlay, in A.get), and kept in the page's database; in the Atlas app it is
   also written into the campaign (edits/story.js), and a campaign's files may hold it too (ATLAS.storyEdit).
   This file holds the data and the reasoning, and runs without a browser (the checker reads it); atlas-clueui.js is
   what the referee sees. */
(function (A) {
  "use strict";
  const St = A.story = A.story || {};
  const esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));
  St.esc = esc;

  /* ---- the words of the investigation */
  // a clue's kind, and the sign its marker wears on the map (drawn in a circle 13 across, centred)
  St.TYPES = [
    ["physical", "Physical evidence", "M-3.4 -1.4a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0M.5 .6l2.8 2.8"],
    ["document", "A document", "M-2.6 -3.4h3.4l1.8 1.8v5h-5.2zM-1.3 -.5h2.6M-1.3 1.3h2.6"],
    ["testimony", "Testimony, a witness", "M-3.4 -2.6h6.8v4h-3.4l-2 1.8v-1.8h-1.4z"],
    ["digital", "Digital evidence, records", "M-3.4 -2.8h6.8v4.4h-6.8zM-1.6 3.2h3.2M0 1.6v1.6"],
    ["environment", "Something in the place", "M-2.8 3c0-3.4 1.6-5.6 5.2-6.4c.4 3.4-1.4 5.8-5.2 6.4zM-2.8 3l2.6-2.6"],
    ["object", "A suspicious object", "M-3.6 0c2-2.6 5.2-2.6 7.2 0c-2 2.6-5.2 2.6-7.2 0zM-.9 0a.9 .9 0 1 0 1.8 0a.9 .9 0 1 0 -1.8 0"],
    ["secret", "A secret, a hidden way", "M-2.6 -.2h5.2v3.4h-5.2zM-1.5 -.2v-1.4a1.5 1.5 0 0 1 3 0v1.4"],
    ["magic", "A magical or uncanny trace", "M0 -3.6l1 2.4l2.6.2l-2 1.7l.7 2.6l-2.3-1.4l-2.3 1.4l.7-2.6l-2-1.7l2.6-.2z"],
    ["lead", "A lead, a rumour", "M-3.4 0h6.2M.6 -2.6l2.6 2.6l-2.6 2.6"],
    ["other", "Something else", "M-1.5 -1.4a1.5 1.5 0 1 1 1.5 1.5v1M0 2.8v.1"]
  ];
  const TYPE = Object.fromEntries(St.TYPES.map(t => [t[0], t]));
  A.clueGlyph = k => (TYPE[k] || TYPE.other)[2];
  A.clueTypeName = k => (TYPE[k] || [0, String(k || "")])[1];
  // how far the players have come with a clue: they have not found it, found it, looked into it, understood it, and
  // used it to answer what it answers
  St.STATUS = [["undiscovered", "Not found"], ["discovered", "Found"], ["investigated", "Looked into"], ["understood", "Understood"], ["resolved", "Answered"]];
  // how one thing bears on another: [the word, the word read backwards, what it means]
  St.RELS = [
    ["leads to", "is led to by", "following it takes the players there"],
    ["reveals", "is revealed by", "it uncovers this"],
    ["implicates", "is implicated by", "it points at them as responsible"],
    ["contradicts", "is contradicted by", "the two cannot both be true"],
    ["confirms", "is confirmed by", "it bears this out"],
    ["explains", "is explained by", "it accounts for this"],
    ["opens", "is opened by", "it gives access to this"],
    ["belongs to", "owns", "it is theirs, or came from there"],
    ["advances", "is advanced by", "it moves this goal or quest on"],
    ["helps solve", "is helped by", "it is a piece of this mystery"],
    ["matches", "matches", "the two are the same mark, sign or thing"],
    ["involves", "is involved in", "they are part of it"],
    ["witnessed", "was witnessed by", "they saw it happen"],
    ["knows about", "is known to", "they know of it"],
    ["concerns", "is concerned by", "it is about this"],
    // between traps, riddles and what they keep (atlas-traps.js): asked for with the cave generator, 21 Oct 2026
    ["guards", "is guarded by", "it protects this"],
    ["sets off", "is set off by", "it triggers this"],
    ["makes safe", "is made safe by", "knowing or doing it disarms this"]
  ];
  const REL = Object.fromEntries(St.RELS.map(r => [r[0], r]));
  St.relBack = r => (REL[r] || [r, "(" + r + ")"])[1];
  // the connections that carry an investigation forward, from the first to the second
  const FORWARD = new Set(["leads to", "reveals", "implicates", "explains", "opens", "advances", "helps solve", "confirms"]);
  // the kinds of story element a campaign may lack and the referee may make
  St.ITEMS = [["mystery", "A mystery, a story arc"], ["faction", "A faction, an organisation"], ["quest", "A quest, an objective"], ["event", "An event, in the past or to come"], ["secret", "A secret"], ["thing", "A thing, an object"], ["other", "Something else"]];
  // what a person holds to be so, and how sure it is
  St.KTYPES = [["fact", "Seen for themselves"], ["report", "Told by someone"], ["rumour", "A rumour"], ["deduction", "Worked out"], ["suspicion", "Suspects, cannot prove"], ["false", "Believes, wrongly"]];
  // how they came by it
  St.KHOW = [["witnessed", "Saw it happen"], ["present", "Was there at the time"], ["found", "Found the clue"], ["told", "Was told"], ["read", "Read it"], ["accessed", "Looked it up in records or a machine"], ["rumour", "Heard it said"], ["inferred", "Worked it out"], ["assigned", "Because you say so"]];
  // what they will do with it
  St.KSHARE = [["shares", "Tells anyone who asks"], ["pressed", "Tells if pressed, paid or trusted"], ["hides", "Hides it, may lie"], ["refuses", "Will not tell, whatever happens"]];
  St.KREL = [["reliable", "Reliable"], ["doubtful", "Doubtful"], ["false", "False"]];
  St.QSTATE = [["open", "Open"], ["intentional", "A mystery on purpose"], ["develop", "Needs writing"], ["resolved", "Answered"]];

  /* ---- what the campaign's files hold (ATLAS.storyEdit), and what the page's database holds */
  const COLLS = ["cluebook", "links", "items", "questions", "knowledge"];
  // (traps and riddles placed or written on the page are kept as clues are, place by place: trapbook, riddlebook; how
  // each stands at the table, armed or found or solved, in devstate)
  const FILE = { cluebook: {}, links: {}, items: {}, questions: {}, knowledge: {}, trapbook: {}, riddlebook: {} };
  const LIVE = { cluebook: {}, links: {}, items: {}, questions: {}, knowledge: {}, log: {}, cluestate: {}, done: {}, trapbook: {}, riddlebook: {}, devstate: {} };
  const DBN = { cluebook: "cluebook", links: "storylinks", items: "storyitems", questions: "storyq", knowledge: "knowledge", log: "storylog", cluestate: "cluestate", trapbook: "trapbook", riddlebook: "riddlebook", devstate: "devstate" };
  let VER = 1;
  const bump = () => { VER++; if (A.state) A.state.cache = {}; St._ents = null; };
  // the campaign's own story data: { cluebook: { place: { C7: {...} } }, links: [...], items: [...], questions: [...],
  // knowledge: [...], trapbook: { place: { T1: {...} } }, riddlebook: { place: { P1: {...} } } } (lists or objects by
  // id); later files win
  A.storyEdit = doc => {
    if (!doc) return A;
    for (const [pl, rec] of Object.entries(doc.cluebook || {})) FILE.cluebook[pl] = Object.assign({}, FILE.cluebook[pl] || {}, (rec && rec.clues) || rec || {});
    for (const bk of ["trapbook", "riddlebook"]) for (const [pl, rec] of Object.entries(doc[bk] || {})) FILE[bk][pl] = Object.assign({}, FILE[bk][pl] || {}, (rec && rec.recs) || rec || {});
    for (const k of ["links", "items", "questions", "knowledge"]) { const v = doc[k]; if (!v) continue; const list = Array.isArray(v) ? v : Object.entries(v).map(([id, r]) => Object.assign({ id }, r)); for (const r of list) if (r && r.id) FILE[k][r.id] = Object.assign({ src: "file" }, r); }
    bump(); return A;
  };
  const merged = k => { const o = Object.assign({}, FILE[k]); for (const [id, r] of Object.entries(LIVE[k])) o[id] = r; for (const id of Object.keys(o)) if (!o[id] || o[id].off) delete o[id]; return o; };
  const bookOf = k => { const f = FILE.cluebook[k], l = (LIVE.cluebook[k] || {}).clues; return f || l ? Object.assign({}, f || {}, l || {}) : null; };
  const devBook = (bk, k) => { const f = FILE[bk][k], l = (LIVE[bk][k] || {}).recs; return f || l ? Object.assign({}, f || {}, l || {}) : null; };
  St.links = () => merged("links"); St.items = () => merged("items"); St.questions = () => merged("questions"); St.knowledge = () => merged("knowledge");
  St.raw = (k, id) => k === "cluebook" ? null : (LIVE[k][id] || FILE[k][id] || null);
  St.ver = () => VER;

  /* ---- the clues as the referee wrote them, laid over the place (A.get calls this) */
  const OVC = new WeakMap();
  A.overlay = (k, M) => {
    const book = bookOf(k), tb = devBook("trapbook", k), rb = devBook("riddlebook", k); if ((!book && !tb && !rb) || !M) return M;
    const c = OVC.get(M); if (c && c.v === VER) return c.M;
    const lay = (base, bk) => { const o = Object.assign({}, base || {}); for (const [id, r] of Object.entries(bk || {})) { if (!r || r.off) { delete o[id]; continue; } const x = Object.assign({}, r); delete x.t0; o[id] = x; } return o; };
    const clues = Object.assign({}, M.clues || {});
    for (const [id, r] of Object.entries(book || {})) { if (!r || r.off) { delete clues[id]; continue; } const x = Object.assign({}, clues[id] || {}, r); delete x.t0; clues[id] = x; }
    const out = Object.assign({}, M, { clues });
    if (tb) out.traps = lay(M.traps, tb); if (rb) out.riddles = lay(M.riddles, rb);
    OVC.set(M, { v: VER, M: out }); return out;
  };
  // a trap or a riddle as it stands, and how it stands at the table: { s: "armed" | "found" | "triggered" | "disarmed"
  // for a trap, "unsolved" | "solved" | "failed" for a riddle; shown: on the players' map or screen; hints: how many given }
  St.trap = (pl, id) => { const M = A.maps[pl] && A.get(pl, 99); return M && (M.traps || {})[id] || null; };
  St.riddle = (pl, id) => { const M = A.maps[pl] && A.get(pl, 99); return M && (M.riddles || {})[id] || null; };
  St.devState = (pl, id) => Object.assign({}, ((LIVE.devstate[pl] || {}).s || {})[id] || {});
  St.setDevState = (pl, id, patch) => {
    if (!ST) return;
    const doc = { s: Object.assign({}, (LIVE.devstate[pl] || {}).s || {}) }; doc.s[id] = Object.assign({}, doc.s[id] || {}, patch, { t: Date.now() });
    LIVE.devstate[pl] = doc; ST.set(DBN.devstate, pl, doc); bump(); St.changed({ note: "at the table" });
  };
  // the players see a trap once the referee shows it, or once it is found or goes off
  A.devShown = (pl, id) => { const s = ((LIVE.devstate[pl] || {}).s || {})[id]; return !!(s && (s.shown || s.s === "found" || s.s === "triggered")); };
  // the next free id at a place for a trap (T) or a riddle (P)
  St.nextDevId = (pl, letter, extra) => {
    let n = 0; const see = id => { const m = new RegExp("^" + letter + "(\\d+)$").exec(id || ""); if (m) n = Math.max(n, +m[1]); };
    const M = A.maps[pl] && A.get(pl, 99); if (M) { Object.keys(M.traps || {}).concat(Object.keys(M.riddles || {})).forEach(see); M.floors.forEach(F => (F.M || []).forEach(m => see(m[0]))); }
    Object.keys(devBook("trapbook", pl) || {}).concat(Object.keys(devBook("riddlebook", pl) || {})).forEach(see); (extra || []).forEach(see);
    return letter + (n + 1);
  };
  A.clueGone = (k, id) => { const b = bookOf(k); return !!(b && b[id] && b[id].off); };
  // a clue as it stands, and whether the campaign's files wrote it
  St.clue = (pl, id) => { const M = A.maps[pl] && A.get(pl, 99); return M && (M.clues || {})[id] ? M.clues[id] : null; };
  St.allClues = (withArchived) => { const out = []; for (const pl of A.order || []) { if (!A.maps[pl] || A.maps[pl].alias) continue; const M = A.get(pl, 99); for (const [id, c] of Object.entries(M.clues || {})) if (withArchived || !c.arch) out.push({ pl, id, c, ref: "clue:" + pl + "/" + id }); } return out; };
  // the next free clue id at a place: C and a number no clue, marker or record there has
  St.nextClueId = (pl, extra) => {
    let n = 0; const see = id => { const m = /^C(\d+)$/.exec(id || ""); if (m) n = Math.max(n, +m[1]); };
    const M = A.maps[pl]; if (M) { A.__noOverlay = true; try { for (let lv = 0; lv <= 99; lv++) { const X = A.get(pl, lv); Object.keys(X.clues || {}).forEach(see); X.floors.forEach(F => (F.M || []).forEach(m => see(m[0]))); if (lv >= ((A.exp[A.keyOf ? A.keyOf(pl) : pl] || []).length)) break; } } finally { A.__noOverlay = false; } }
    Object.keys(bookOf(pl) || {}).forEach(see); (extra || []).forEach(see);
    return "C" + (n + 1);
  };
  // where a clue's marker stands: the floor and the square
  St.markerOf = (pl, id) => { const M = A.maps[pl] && A.get(pl, 99); if (!M) return null; for (let fi = 0; fi < M.floors.length; fi++) for (const m of M.floors[fi].M || []) if (m[0] === id) return { fi, x: m[1], y: m[2] }; return null; };

  /* ---- how far the players have come: the tracker's "found" (collection clues), and beyond it (cluestate) */
  St.status = (pl, id) => { const s = ((LIVE.cluestate[pl] || {}).s || {})[id]; if (s && s !== "undiscovered" && s !== "discovered") return s; return (LIVE.done[pl] || []).includes(id) ? "discovered" : (s === "discovered" ? "discovered" : "undiscovered"); };
  St.found = (pl, id) => St.status(pl, id) !== "undiscovered";

  /* ---- everything in the campaign a clue can be joined to: refs are kind:id (clue:place/C3, npc:place/N2, cast:id,
          place:id, room:place/R4, secret:place/S1, enc:place/E1, clock:id, tick:clock/2, session:3, pc:id,
          chapter:3, item:id, question:id) */
  const plainRole = r => String(r || "").split(/\s*[;—(]\s*|\s+-\s+/)[0].trim();
  const joinT = (...a) => a.filter(Boolean).join(" ");
  St.entities = () => {
    if (St._ents) return St._ents;
    const list = [], by = {}, add = e => { if (by[e.ref]) return by[e.ref]; by[e.ref] = e; list.push(e); return e; };
    const cast = A.castData || {};
    for (const [cid, c] of Object.entries(cast)) add({ ref: "cast:" + cid, kind: "person", name: c.n || cid, sub: plainRole(c.role), role: c.role || "", text: joinT(c.n, c.role, c.look, c.bg, c.want, c.secret, c.lie, c.press, c.fate, typeof c.ties === "object" && c.ties ? Object.values(c.ties).join(" ") : c.ties), facts: [c.role && "Role: " + c.role, c.want && "Wants: " + c.want, c.secret && "Hides: " + c.secret].filter(Boolean), places: [] });
    for (const pl of A.order || []) {
      const m = A.meta[pl] || {};
      const pe = add({ ref: "place:" + pl, kind: "place", name: m.name || pl, sub: m.region || "", text: joinT(m.name, m.tagline, m.region), facts: [m.tagline].filter(Boolean), place: pl });
      if (!A.maps[pl] || A.maps[pl].alias) continue;
      const M = A.get(pl, 99); pe.text = joinT(pe.text, M.ov, M.ext); if (M.ov) pe.facts.push(M.ov.slice(0, 220));
      const rname = rid => (A.nameOf ? A.nameOf(M, rid) : "") || rid;
      for (const [rid, r] of Object.entries(M.rooms || {})) if (/^R\d/.test(rid)) add({ ref: "room:" + pl + "/" + rid, kind: "room", name: `${rname(rid)} (${m.name || pl})`, sub: rid, text: joinT(rname(rid), r.d, r.obj, r.now, r.sec), facts: [r.d && r.d.slice(0, 180)].filter(Boolean), place: pl, room: rid });
      for (const [id, c] of Object.entries(M.clues || {})) { if (c.arch) continue; add({ ref: "clue:" + pl + "/" + id, kind: "clue", name: c.t || id, sub: `${m.name || pl}${c.at ? ", " + rname(c.at) : ""}`, text: joinT(c.t, c.pd, c.d, c.kp, c.how, c.rev, c.hint, (c.tags || []).join(" ")), facts: [c.d && "It is: " + c.d, c.rev && "It reveals: " + c.rev, c.at && "Found in: " + rname(c.at)].filter(Boolean), place: pl, room: c.at, id, k: c.k }); }
      for (const [id, n] of Object.entries(M.npcs || {})) {
        const c = n.who && cast[n.who];
        if (c) { const e = by["cast:" + n.who]; e.places.push(pl); e.text = joinT(e.text, n.doing, n.knows, n.rev); e.at = e.at || []; e.at.push({ pl, room: n.at, npc: id }); continue; }
        const s = String(n.n || id), i = s.indexOf(", ");
        add({ ref: "npc:" + pl + "/" + id, kind: "person", name: i > 0 ? s.slice(0, i) : s, sub: i > 0 ? plainRole(s.slice(i + 2)) : (m.name || pl), role: i > 0 ? s.slice(i + 2) : "", text: joinT(s, n.look, n.bg, n.doing, n.want, n.knows, n.secret, n.lie, n.rev), facts: [n.doing && "Doing: " + n.doing, n.knows && "Knows: " + n.knows, n.secret && "Hides: " + n.secret].filter(Boolean), place: pl, room: n.at, places: [pl], at: [{ pl, room: n.at, npc: id }] });
      }
      for (const [id, x] of Object.entries(M.secrets || {})) add({ ref: "secret:" + pl + "/" + id, kind: "secret", name: x.t || id, sub: m.name || pl, text: joinT(x.t, x.acc, x.dest, x.why), facts: [x.why && "Why: " + x.why, x.dest && "Leads to: " + x.dest].filter(Boolean), place: pl, room: x.at });
      for (const [id, x] of Object.entries(M.enc || {})) add({ ref: "enc:" + pl + "/" + id, kind: "event", name: x.t || id, sub: m.name || pl, text: joinT(x.t, x.d), facts: [x.d && x.d.slice(0, 200)].filter(Boolean), place: pl, room: x.at });
      for (const [id, x] of Object.entries(M.traps || {})) if (x) add({ ref: "trap:" + pl + "/" + id, kind: "trap", name: x.t || id, sub: `${m.name || pl}${x.at ? ", " + rname(x.at) : ""}`, text: joinT(x.t, x.d, x.trig, x.eff, (x.signs || []).join(" ")), facts: [x.trig && "Set off by: " + x.trig, x.eff && "Does: " + String(x.eff).slice(0, 160)].filter(Boolean), place: pl, room: x.at, id });
      for (const [id, x] of Object.entries(M.riddles || {})) if (x) add({ ref: "riddle:" + pl + "/" + id, kind: "riddle", name: x.t || id, sub: `${m.name || pl}${x.at ? ", " + rname(x.at) : ""}`, text: joinT(x.t, x.pd, x.d), facts: [x.d && x.d.slice(0, 160), x.sol && "Answer: " + x.sol].filter(Boolean), place: pl, room: x.at, id });
    }
    (A.clocksData || []).forEach((c, ci) => { const cid = c.id || "clock" + ci; add({ ref: "clock:" + cid, kind: "plan", name: c.name || cid, sub: "A villain's plan" + (c.who ? ": " + c.who : ""), text: joinT(c.name, c.who, ...(c.ticks || []), c.done), facts: [c.done && "If it fills: " + c.done].filter(Boolean) }); (c.ticks || []).forEach((t, i) => add({ ref: "tick:" + cid + "/" + i, kind: "event", name: t.length > 70 ? t.slice(0, 68) + "…" : t, sub: `${c.name || cid}, step ${i + 1}`, text: t, facts: [`Step ${i + 1} of ${c.name || cid}`] })); });
    for (const s of A.sessionsData || []) add({ ref: "session:" + s.n, kind: "quest", name: `Session ${s.n}${s.title ? ": " + s.title : ""}`, sub: "The session plan", text: joinT(s.title, s.start, s.cliff, s.notes, s.goal), facts: [s.start && "Starts: " + s.start, s.goal && "Goal: " + s.goal].filter(Boolean), places: [].concat(s.places || []) });
    for (const [id, pc] of Object.entries(A.pcsData || {})) add({ ref: "pc:" + id, kind: "pc", name: pc.n || id, sub: "A player's character", text: joinT(pc.n, pc.concept, pc.bg, pc.hook, pc.secret), facts: [pc.hook && "Hook: " + pc.hook].filter(Boolean) });
    (A.storyData || []).forEach((ch, i) => { if (ch.group !== "The story") return; add({ ref: "chapter:" + i, kind: "chapter", name: ch.title, sub: "The story bible", text: String(ch.md || "").slice(0, 6000), facts: [String(ch.md || "").replace(/[#*_>`]/g, "").replace(/\s+/g, " ").slice(0, 200)] }); });
    for (const [id, it] of Object.entries(St.items())) add({ ref: "item:" + id, kind: it.kind === "event" ? "event" : it.kind === "quest" ? "quest" : "item", ik: it.kind, name: it.n || id, sub: (St.ITEMS.find(x => x[0] === it.kind) || [0, "A story element"])[1], text: joinT(it.n, it.d, it.when), facts: [it.d].filter(Boolean) });
    for (const [id, q] of Object.entries(St.questions())) add({ ref: "question:" + id, kind: "question", name: q.text, sub: (St.QSTATE.find(x => x[0] === q.state) || [0, "Open"])[1], text: q.text, facts: [] });
    St._ents = { list, by };
    return St._ents;
  };
  St.ent = ref => St.entities().by[ref] || null;
  St.name = ref => { const e = St.ent(ref); return e ? e.name : ref ? "(gone: " + ref.split(":").slice(1).join(":") + ")" : ""; };
  St.kindName = { clue: "Clue", person: "Person", place: "Place", room: "Room", secret: "Secret", event: "Event", plan: "Villain's plan", quest: "Quest, session", pc: "Player's character", chapter: "From the story", item: "Story element", question: "Question", trap: "Trap", riddle: "Riddle or puzzle" };
  // the people: the cast, and each place's people who are not of the cast
  St.people = () => St.entities().list.filter(e => e.kind === "person");
  // a place's person, as the person they are (the cast member, when they are one)
  St.personRef = (pl, npc) => { const M = A.maps[pl] && A.get(pl, 99), n = M && (M.npcs || {})[npc]; return n && n.who && (A.castData || {})[n.who] ? "cast:" + n.who : "npc:" + pl + "/" + npc; };

  /* ---- what the campaign's own files already join: shown with the saved connections, never changed from here */
  St.written = () => {
    const out = [];
    for (const e of St.entities().list) {
      if (e.kind === "clue") { const c = St.clue(e.place, e.id) || {}; if (c.at) out.push({ a: e.ref, b: "room:" + e.place + "/" + c.at, rel: "was found in", src: "written" }); for (const t of [].concat(c.to || [])) if (A.meta[t] && t !== e.place) out.push({ a: e.ref, b: "place:" + t, rel: "leads to", src: "written" }); }
      if (e.kind === "person") for (const at of e.at || []) { out.push({ a: e.ref, b: at.room ? "room:" + at.pl + "/" + at.room : "place:" + at.pl, rel: "is at", src: "written" }); const n = ((A.get(at.pl, 99) || {}).npcs || {})[at.npc] || {}; for (const t of [].concat(n.to || [])) if (A.meta[t]) out.push({ a: e.ref, b: "place:" + t, rel: "points to", src: "written" }); }
      if (e.kind === "secret" && e.room) out.push({ a: e.ref, b: "room:" + e.place + "/" + e.room, rel: "is in", src: "written" });
      if (e.kind === "quest") for (const p of e.places || []) if (A.meta[p]) out.push({ a: e.ref, b: "place:" + p, rel: "goes to", src: "written" });
    }
    const cast = A.castData || {};
    for (const [cid, c] of Object.entries(cast)) if (c.ties && typeof c.ties === "object") for (const [to, how] of Object.entries(c.ties)) { const t = cast[to] ? to : Object.keys(cast).find(k => String((cast[k] || {}).n || "").toLowerCase() === to.toLowerCase()); if (t && t !== cid) out.push({ a: "cast:" + cid, b: "cast:" + t, rel: "knows", why: how, src: "written" }); }
    return out.filter(l => St.ent(l.b));
  };
  // every connection touching a thing: the saved ones and the written ones, each read from that thing's side
  St.linksOf = ref => {
    const out = [];
    for (const [id, l] of Object.entries(St.links())) { if (l.a === ref) out.push(Object.assign({ id, dir: 1, other: l.b }, l)); else if (l.b === ref) out.push(Object.assign({ id, dir: -1, other: l.a }, l)); }
    for (const l of St.written()) { if (l.a === ref) out.push(Object.assign({ dir: 1, other: l.b }, l)); else if (l.b === ref) out.push(Object.assign({ dir: -1, other: l.a }, l)); }
    return out;
  };
  St.linked = (a, b) => St.linksOf(a).filter(l => l.other === b);

  /* ---- investigation chains: what a clue leads to, and on; what reveals it */
  const fwd = ref => {
    const out = [];
    for (const l of St.linksOf(ref)) { if (l.dir === 1 && (FORWARD.has(l.rel) || l.rel === "points to")) out.push({ to: l.other, rel: l.rel, src: l.src }); else if (l.dir === -1 && l.rel === "witnessed") out.push({ to: l.other, rel: "was witnessed by", src: l.src }); }
    // a place leads on through the clues found there
    if (ref.startsWith("place:")) { const pl = ref.slice(6); for (const c of St.allClues().filter(c => c.pl === pl)) out.push({ to: c.ref, rel: "holds", src: "written" }); }
    return out;
  };
  St.chain = (ref, depth) => {
    const seen = new Set([ref]);
    const walk = (r, d) => d <= 0 ? [] : fwd(r).filter(x => St.ent(x.to)).map(x => { const again = seen.has(x.to); seen.add(x.to); return { ref: x.to, rel: x.rel, src: x.src, again, next: again ? [] : walk(x.to, d - 1) }; });
    return walk(ref, depth || 4);
  };
  // what leads to it: clues and people that lead here, and what reveals it
  St.revealedBy = ref => {
    const out = [];
    for (const l of St.linksOf(ref)) if (l.dir === -1 && (FORWARD.has(l.rel) || l.rel === "points to")) out.push({ ref: l.other, rel: l.rel, src: l.src });
    if (ref.startsWith("clue:")) { const pl = ref.slice(5).split("/")[0]; for (const l of St.linksOf("place:" + pl)) if (l.dir === -1 && (l.rel === "leads to" || l.rel === "points to")) out.push({ ref: l.other, rel: l.rel + " " + St.name("place:" + pl), src: l.src }); }
    return out;
  };

  /* ---- the changes: every write is kept in the history, and each can be undone */
  let ST = null; const LOG_MAX = 400;
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  St.uid = uid;
  const cleanRec = r => JSON.parse(JSON.stringify(r));
  function logIt(coll, key, before, after, meta) {
    if (!ST) return null; const id = uid("g");
    const e = { t: Date.now(), coll, key, before: before ? cleanRec(before) : null, after: after ? cleanRec(after) : null, src: (meta && meta.src) || "dm", batch: (meta && meta.batch) || "", note: (meta && meta.note) || "" };
    ST.set(DBN.log, id, e); LIVE.log[id] = e;
    const ids = Object.keys(LIVE.log).sort((a, b) => LIVE.log[a].t - LIVE.log[b].t); if (ids.length > LOG_MAX) for (const old of ids.slice(0, ids.length - LOG_MAX)) { ST.set(DBN.log, old, null); delete LIVE.log[old]; }
    return id;
  }
  // a record of links, items, questions or knowledge, written (or taken away, with null)
  St.put = (coll, id, rec, meta) => {
    if (!ST) throw new Error("The page's store is not ready");
    const before = St.raw(coll, id), after = rec ? Object.assign({}, rec, { t: Date.now() }) : { off: true, t: Date.now() };
    LIVE[coll][id] = after; ST.set(DBN[coll], id, after); bump();
    logIt(coll, id, before, rec ? after : null, meta); St.changed(meta);
    return id;
  };
  // a clue, written over the place's (or taken away, with null); the whole clue is kept, so the record stands alone
  St.putClue = (pl, id, rec, meta) => {
    if (!ST) throw new Error("The page's store is not ready");
    const before = St.clue(pl, id), doc = { clues: Object.assign({}, (LIVE.cluebook[pl] || {}).clues || {}), t: Date.now() };
    doc.clues[id] = rec ? Object.assign({}, rec, { t0: Date.now() }) : { off: true };
    LIVE.cluebook[pl] = doc; ST.set(DBN.cluebook, pl, doc); bump();
    logIt("cluebook", pl + "/" + id, before, rec, meta); St.changed(meta);
  };
  // a trap ("trapbook") or a riddle ("riddlebook"), written over the place's own (or taken away, with null); logged and
  // undoable like a clue. A record the game master changed by hand says so (edited), so a regeneration asks first.
  St.putDev = (bk, pl, id, rec, meta) => {
    if (!ST) throw new Error("The page's store is not ready");
    const before = bk === "trapbook" ? St.trap(pl, id) : St.riddle(pl, id), doc = { recs: Object.assign({}, (LIVE[bk][pl] || {}).recs || {}), t: Date.now() };
    doc.recs[id] = rec ? Object.assign({}, rec, { t0: Date.now() }) : { off: true };
    LIVE[bk][pl] = doc; ST.set(DBN[bk], pl, doc); bump();
    logIt(bk, pl + "/" + id, before, rec, meta); St.changed(meta);
  };
  St.setStatus = (pl, id, s) => {
    if (!ST) return;
    const doc = { s: Object.assign({}, (LIVE.cluestate[pl] || {}).s || {}) }; doc.s[id] = s; LIVE.cluestate[pl] = doc; ST.set(DBN.cluestate, pl, doc);
    // the tracker's tick is the same thing as found
    const done = new Set(LIVE.done[pl] || []); if (s === "undiscovered") done.delete(id); else done.add(id); LIVE.done[pl] = [...done].sort(); ST.set("clues", pl, { done: LIVE.done[pl] });
    bump(); St.changed();
  };
  // a change taken back: the record as it was before it
  St.undo = logId => {
    const e = LIVE.log[logId]; if (!e || e.undone) return false;
    if (e.coll === "cluebook") { const [pl, id] = e.key.split("/"); St.putClue(pl, id, e.before, { note: "undo", src: "dm" }); }
    else if (e.coll === "trapbook" || e.coll === "riddlebook") { const [pl, id] = e.key.split("/"); St.putDev(e.coll, pl, id, e.before, { note: "undo", src: "dm" }); }
    else St.put(e.coll, e.key, e.before, { note: "undo", src: "dm" });
    const u = Object.assign({}, e, { undone: Date.now() }); LIVE.log[logId] = u; ST.set(DBN.log, logId, u);
    return true;
  };
  St.undoBatch = batch => { const ids = Object.keys(LIVE.log).filter(k => LIVE.log[k].batch === batch && !LIVE.log[k].undone).sort((a, b) => LIVE.log[b].t - LIVE.log[a].t); ids.forEach(St.undo); return ids.length; };
  St.history = filter => Object.entries(LIVE.log).map(([id, e]) => Object.assign({ id }, e)).filter(e => !filter || filter(e)).sort((a, b) => b.t - a.t);

  /* ---- a connection, made by the referee or approved from a suggestion. Nothing here replaces another: a link the
          referee made stays as it is until they change it */
  St.link = (a, b, rel, o, meta) => St.put("links", (o && o.id) || uid("L"), Object.assign({ a, b, rel, src: (meta && meta.src) || "dm" }, o || {}), meta);
  // a person's knowledge: what they know or believe, about what, how they came by it, what they will do with it
  St.know = (rec, meta) => St.put("knowledge", rec.id || uid("K"), Object.assign({ src: (meta && meta.src) || "dm" }, rec, { id: undefined }), meta);
  St.knowledgeOf = who => Object.entries(St.knowledge()).filter(([, k]) => k.who === who).map(([id, k]) => Object.assign({ id }, k));
  St.knownBy = about => Object.entries(St.knowledge()).filter(([, k]) => k.about === about).map(([id, k]) => Object.assign({ id }, k));
  // one person tells another: the listener comes to know it, at second hand, as reliable as the teller's was
  St.tell = (fromWho, toWho, kid, o, meta) => {
    const k = St.knowledge()[kid]; if (!k) return null;
    const type = k.type === "false" ? "false" : k.type === "rumour" ? "rumour" : "report";
    return St.know(Object.assign({ who: toWho, about: k.about || "", text: k.text || "", type, how: "told", from: fromWho, rel: k.rel || "reliable", share: "pressed", when: (o && o.when) || "", note: (o && o.note) || "", via: kid }, o || {}), Object.assign({ note: `${St.name(fromWho)} told ${St.name(toWho)}` }, meta || {}));
  };

  /* ---- the warnings an investigation needs: the loose ends, the single threads, the contradictions */
  St.warnings = () => {
    const out = [], links = St.links(), clues = St.allClues();
    for (const c of clues) {
      const any = St.linksOf(c.ref).filter(l => l.rel !== "was found in").length + St.knownBy(c.ref).length;
      if (!any && c.c.k !== "lead") out.push({ kind: "loose", ref: c.ref, text: `Nothing joins ${c.c.t || c.id} to the story yet: no lead, no connection, nobody who knows of it.` });
    }
    // the three-clue rule: a place the story needs, reached by one clue only
    const into = {};
    for (const c of clues) for (const l of St.linksOf(c.ref)) if (l.dir === 1 && l.rel === "leads to" && l.other.startsWith("place:")) (into[l.other] = into[l.other] || new Set()).add(c.ref);
    for (const p of St.people()) for (const l of St.linksOf(p.ref)) if (l.dir === 1 && l.rel === "points to") (into[l.other] = into[l.other] || new Set()).add(p.ref);
    for (const [pl, from] of Object.entries(into)) { const m = A.meta[pl.slice(6)] || {}; if (from.size === 1 && !m.start && (m.tier || 3) <= 2) { const only = [...from][0]; out.push({ kind: "single", ref: pl, refs: [only], text: `Only one way leads to ${St.name(pl)}: ${St.name(only)}. If the players miss it, they cannot get there; a second and a third way would make it safe.` }); } }
    // a mystery helped by one clue only
    for (const it of St.entities().list.filter(e => e.kind === "item" && e.ik === "mystery")) { const by = St.linksOf(it.ref).filter(l => l.dir === -1 && (l.rel === "helps solve" || l.rel === "reveals" || l.rel === "explains")); if (by.length === 1) out.push({ kind: "single", ref: it.ref, refs: [by[0].other], text: `The mystery "${it.name}" rests on one clue: ${St.name(by[0].other)}.` }); }
    for (const [id, l] of Object.entries(links)) {
      for (const end of [l.a, l.b]) if (!St.ent(end)) out.push({ kind: "gone", ref: end === l.a ? l.b : l.a, link: id, text: `A connection (${l.rel}) points to something no longer in the campaign: ${St.name(end)}.` });
      if (l.rel === "contradicts") out.push({ kind: "contra", ref: l.a, refs: [l.b], link: id, text: `${St.name(l.a)} contradicts ${St.name(l.b)}${l.why ? ": " + l.why : ""}. Decide which is true, or keep both as a deliberate puzzle.` });
    }
    // knowledge: without a source, or at odds with another's
    const kn = St.knowledge(), byAbout = {};
    for (const [id, k] of Object.entries(kn)) {
      if (!k.how) out.push({ kind: "nosource", ref: k.who, k: id, text: `${St.name(k.who)} knows "${k.text || St.name(k.about)}", but how they came to know it is not recorded.` });
      if (k.about && !St.ent(k.about)) out.push({ kind: "gone", ref: k.who, k: id, text: `${St.name(k.who)} knows about something no longer in the campaign.` });
      if (k.about) (byAbout[k.about] = byAbout[k.about] || []).push([id, k]);
    }
    for (const [about, list] of Object.entries(byAbout)) { const sure = list.filter(([, k]) => k.type === "fact" || k.type === "report"), wrong = list.filter(([, k]) => k.type === "false"); if (sure.length && wrong.length) out.push({ kind: "accounts", ref: about, refs: [...sure, ...wrong].map(([, k]) => k.who), text: `Accounts of ${St.name(about)} differ: ${sure.map(([, k]) => St.name(k.who)).join(", ")} ${sure.length > 1 ? "know" : "knows"} it, ${wrong.map(([, k]) => St.name(k.who)).join(", ")} ${wrong.length > 1 ? "believe" : "believes"} otherwise.` }); }
    return out;
  };

  /* ---- grounding a suggestion: what the campaign itself says joins a clue to each thing in it. The page's own
          matching, without any AI: the same room, the same place, the clue's words naming a thing, a thing's words
          naming the clue, and words the two share that little else in the campaign uses */
  const STOP = new Set("the and for are but not you all any can had her was one our out has have his how its may new now old see two way who did get him let say she too use that this with from they them then than there their what when where which while will would about into your been were also only some such more most very just like over after before under again does doing done here why whom whose clue room place found find thing things something someone shows show seems".split(" "));
  const toks = s => (String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9']{3,}/g) || []).map(w => w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w).filter(w => !STOP.has(w));
  const nameHit = (text, name) => { const n = String(name || "").trim(); if (n.length < 4) return false; const re = new RegExp("(^|[^a-z0-9])" + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])"); return re.test(String(text || "").toLowerCase()); };
  // a person's name as it is said: the whole, and the surname alone when it is distinctive
  const namesOf = e => { const n = String(e.name || ""), parts = n.split(/\s+/).filter(p => p.length > 3 && !/^(the|of|and|von|van|de|der|dr|mr|mrs|miss|sir|lady|lord|sister|father|brother)$/i.test(p)); return e.kind === "person" && parts.length > 1 ? [n, parts[parts.length - 1]] : [n]; };
  St.ground = (ref, opt) => {
    opt = opt || {};
    const ents = St.entities(), me = ents.by[ref]; if (!me) return { cands: [], pool: [], people: [] };
    const N = ents.list.length, df = {}; for (const e of ents.list) for (const w of new Set(toks(e.name + " " + e.text))) df[w] = (df[w] || 0) + 1;
    const mine = new Set(toks(me.name + " " + me.text)), C = new Map();
    const add = (to, score, fact, rel, conf) => { if (!to || to === ref || !ents.by[to]) return; const c = C.get(to) || { ref: to, score: 0, facts: [], rel, conf: "low" }; c.score += score; if (fact && !c.facts.includes(fact)) c.facts.push(fact); const order = { low: 0, medium: 1, high: 2 }; if (order[conf] > order[c.conf]) { c.conf = conf; c.rel = rel; } C.set(to, c); };
    const pl = me.place, room = me.room, M = pl && A.maps[pl] ? A.get(pl, 99) : null, rn = r => (M && A.nameOf ? A.nameOf(M, r) : "") || r;
    // the same room, the same place
    for (const e of ents.list) {
      if (e.ref === ref) continue;
      const here = (e.at || []).find(a => a.pl === pl) || (e.place === pl ? { pl, room: e.room } : null);
      if (!here || !pl) continue;
      if (e.kind === "person") { if (room && here.room === room) add(e.ref, 3, `${e.name} is written into ${rn(room)}, where the clue lies.`, "involves", "medium"); else add(e.ref, 1, `${e.name} is at ${St.name("place:" + pl)}.`, "involves", "low"); }
      else if (e.kind === "secret" && room && e.room === room) add(e.ref, 2.5, `The secret "${e.name}" is in the same room.`, "reveals", "low");
      else if (e.kind === "clue" && room && e.room === room) add(e.ref, 1.5, `${e.name} lies in the same room.`, "concerns", "low");
      else if (e.kind === "event" && room && e.room === room) add(e.ref, 2, `"${e.name}" happens in the same room.`, "explains", "low");
    }
    for (const e of ents.list) if (e.kind === "quest" && pl && (e.places || []).includes(pl)) add(e.ref, 1, `${e.name} goes to ${St.name("place:" + pl)}.`, "advances", "low");
    // names: the clue's words name a thing, or a thing's words name the clue
    const myText = me.name + " " + me.text;
    for (const e of ents.list) {
      if (e.ref === ref || e.kind === "chapter" || e.kind === "question") continue;
      if (namesOf(e).some(n => nameHit(myText, n))) add(e.ref, 4, `The clue's own words name ${e.name}.`, e.kind === "person" ? "concerns" : e.kind === "place" ? "leads to" : "concerns", "medium");
      if (me.name.length > 5 && nameHit(e.text, me.name)) add(e.ref, 3.5, `${e.name}'s own words mention "${me.name}".`, "concerns", "medium");
    }
    // the story bible: the chapter that tells of it most
    // shared words that little else uses
    for (const e of ents.list) {
      if (e.ref === ref) continue;
      const theirs = new Set(toks(e.name + " " + e.text)), shared = [...mine].filter(w => theirs.has(w) && df[w] <= Math.max(2, N * .04));
      if (shared.length >= 2) { const s = shared.reduce((a, w) => a + Math.log(1 + N / df[w]), 0) / 3; add(e.ref, s, `Both speak of ${shared.slice(0, 4).map(w => '"' + w + '"').join(", ")}.`, e.kind === "chapter" ? "explains" : "concerns", "low"); }
    }
    // what is joined already is not suggested again; it is shown as it is
    const have = new Set(St.linksOf(ref).map(l => l.other));
    const cands = [...C.values()].filter(c => !have.has(c.ref)).sort((a, b) => b.score - a.score).slice(0, opt.max || 24);
    // who might know of it: the people written into its room or place, and those whose words touch it
    const peopleK = cands.filter(c => St.ent(c.ref).kind === "person").map(c => ({ ref: c.ref, facts: c.facts, kind: c.facts.some(f => / is written into /.test(f)) ? "may have seen it" : "may know of it" }));
    // what Claude is shown: the matches, and the campaign's principals beside them (its cast, its important places, the
    // villains' plans, the sessions, the story elements), so it can see connections no shared word shows
    const pool = cands.slice(), inPool = new Set(pool.map(c => c.ref));
    for (const e of ents.list) {
      if (pool.length >= (opt.pool || 50)) break;
      if (e.ref === ref || inPool.has(e.ref) || have.has(e.ref)) continue;
      const principal = e.ref.startsWith("cast:") || e.kind === "item" || e.kind === "plan" || e.kind === "quest" || (e.kind === "place" && ((A.meta[e.place] || {}).tier || 3) <= 2) || (e.kind === "clue" && e.place === pl);
      if (principal) { pool.push({ ref: e.ref, score: 0, facts: [e.kind === "clue" ? "Another clue of the same place." : "One of the campaign's principal " + (St.kindName[e.kind] || e.kind).toLowerCase() + "s, listed for context."], rel: "concerns", conf: "low" }); inPool.add(e.ref); }
    }
    return { cands, pool, people: peopleK, me };
  };

  /* ---- asking Claude: the clue, the campaign's setting, and only the things above, each by a short code. What comes
          back is kept only where it names one of those codes: nothing it makes up can enter the campaign as a fact */
  St.genre = () => { const c = A.config || {}, e = A.table && A.table.era ? A.table.era() : ""; return [c.system, e && { victorian: "Victorian", "1920s": "the 1920s", medieval: "medieval", fantasy: "fantasy", modern: "modern day", future: "science fiction" }[e], c.setting, c.subtitle].filter(Boolean).join("; "); };
  const clueBrief = (c, me) => [`Title: ${c.t || me.name}`, c.k && `Kind: ${A.clueTypeName(c.k)}`, `Where: ${me.sub}${c.p ? " (" + c.p + ")" : ""}`, c.pd && `What the players see: ${c.pd}`, c.d && `What it is: ${c.d}`, c.kp && `What only the game master knows: ${c.kp}`, c.how && `How it is found: ${c.how}`, c.rev && `What it reveals: ${c.rev}`, (c.tags || []).length && `Tags: ${c.tags.join(", ")}`].filter(Boolean).join("\n");
  St.connectPrompt = (ref, g) => {
    const me = g.me, pl = me.place, c = St.clue(pl, me.id) || {}, cfg = A.config || {};
    const pool = (g.pool || g.cands).slice(0, 50), codes = {}; pool.forEach((x, i) => { codes["E" + (i + 1)] = x.ref; });
    const have = St.linksOf(ref).slice(0, 20).map(l => `- ${l.dir === 1 ? l.rel : St.relBack(l.rel)} ${St.name(l.other)} (${l.src === "written" ? "written in the campaign" : l.src === "ai" ? "approved suggestion" : "set by the game master"})`).join("\n");
    const kn = St.knownBy(ref).map(k => `- ${St.name(k.who)} ${St.KTYPES.find(x => x[0] === k.type) ? "(" + St.KTYPES.find(x => x[0] === k.type)[1].toLowerCase() + ")" : ""}: ${k.text || ""}`).join("\n");
    const prompt = `You help the game master of the tabletop roleplaying campaign "${cfg.title || ""}" (${St.genre() || "any genre"}) connect a clue to the campaign's existing story. Use ONLY the elements listed below, by their codes. Do not invent people, places, events or facts. Keep to the campaign's genre and tone.

THE CLUE
${clueBrief(c, me)}

ALREADY CONNECTED (do not repeat these)
${have || "- nothing yet"}
${kn ? "\nWHO ALREADY KNOWS OF IT\n" + kn + "\n" : ""}
CAMPAIGN ELEMENTS (code, kind, name, and what the campaign says of it; "why matched" is how the page found it)
${pool.map((x, i) => { const e = St.ent(x.ref); return `E${i + 1} [${St.kindName[e.kind] || e.kind}] ${e.name}${e.sub ? " — " + e.sub : ""}\n   says: ${(e.facts || []).join(" | ").slice(0, 360) || "(little written)"}\n   why matched: ${x.facts.join(" ").slice(0, 240)}`; }).join("\n")}

Answer with JSON only:
{"connections":[{"to":"E3","rel":"implicates","why":"one or two sentences","basis":"the campaign facts it rests on","confidence":"high|medium|low","certainty":"fact|hypothesis"}],
 "people":[{"who":"E5","kind":"may already know|may have witnessed|could discover it|would recognise its meaning|could misread it|has reason to hide it","why":"...","confidence":"high|medium|low"}],
 "contradictions":[{"with":"E2","issue":"what does not fit, and why"}],
 "questions":["a question this clue raises that the campaign does not answer"],
 "ideas":["a new story idea, clearly not yet in the campaign"]}
Rules: "rel" is one of: ${St.RELS.map(r => r[0]).join(", ")}. "certainty" is "fact" only when the listed text itself says so; otherwise "hypothesis". Leave a list empty rather than stretch. If nothing truly connects, say so with empty lists and put possibilities under "ideas". Never reveal more than the clue would in play.`;
    return { prompt, codes };
  };
  // what came back, checked: codes that were not offered are dropped, words are trimmed, kinds kept to what is known
  St.readConnect = (raw, codes) => {
    let v = raw; if (typeof v === "string") { const m = v.match(/\{[\s\S]*\}/); try { v = m ? JSON.parse(m[0]) : null; } catch (e) { v = null; } }
    if (!v || typeof v !== "object") return null;
    const s = (x, n) => String(x == null ? "" : x).trim().slice(0, n || 400), conf = x => ["high", "medium", "low"].includes(x) ? x : "low";
    const out = { connections: [], people: [], contradictions: [], questions: [], ideas: [], dropped: 0 };
    for (const c of [].concat(v.connections || [])) { const to = codes[s(c.to, 8)]; if (!to) { out.dropped++; continue; } out.connections.push({ to, rel: s(c.rel, 30).toLowerCase() || "concerns", why: s(c.why), basis: s(c.basis), conf: conf(c.confidence), cert: c.certainty === "fact" ? "fact" : "hypothesis" }); }
    for (const p of [].concat(v.people || [])) { const who = codes[s(p.who, 8)]; if (!who || (St.ent(who) || {}).kind !== "person") { out.dropped++; continue; } out.people.push({ who, kind: s(p.kind, 40), why: s(p.why), conf: conf(p.confidence) }); }
    for (const c of [].concat(v.contradictions || [])) { const w = codes[s(c.with, 8)]; if (!w) { out.dropped++; continue; } out.contradictions.push({ with: w, issue: s(c.issue) }); }
    out.questions = [].concat(v.questions || []).map(q => s(q, 240)).filter(Boolean).slice(0, 6);
    out.ideas = [].concat(v.ideas || []).map(q => s(q, 300)).filter(Boolean).slice(0, 5);
    return out;
  };
  // without Claude: the page's matching, read as suggestions (never as facts)
  St.localConnect = g => ({
    connections: g.cands.filter(c => c.score >= 1.5).slice(0, 10).map(c => ({ to: c.ref, rel: c.rel || "concerns", why: c.facts.join(" "), basis: "Found by the page's matching: " + c.facts[0], conf: c.conf, cert: "hypothesis" })),
    people: g.people.slice(0, 6).map(p => ({ who: p.ref, kind: p.kind, why: p.facts.join(" "), conf: "low" })),
    contradictions: [], questions: [], ideas: [], dropped: 0, local: true
  });
  // the next clues: new content, asked for separately, never added on its own
  St.followPrompt = ref => {
    const me = St.ent(ref), c = St.clue(me.place, me.id) || {}, cfg = A.config || {}, places = St.entities().list.filter(e => e.kind === "place").slice(0, 40), codes = {};
    places.forEach((p, i) => { codes["P" + (i + 1)] = p.ref; });
    const links = St.linksOf(ref).filter(l => l.src !== "written" || l.rel === "leads to").slice(0, 16).map(l => `- ${l.dir === 1 ? l.rel : St.relBack(l.rel)} ${St.name(l.other)}`).join("\n");
    return { codes, prompt: `You help the game master of "${cfg.title || ""}" (${St.genre() || "any genre"}). Suggest up to three follow-up clues for the clue below: what the players could find next, or other ways to reach the same revelation if they miss it (no mystery should hang on one clue). Fit the genre: its kinds of evidence, its tone, its means of finding things out. Place each in one of the listed places by its code. These are proposals for the game master, not facts.

THE CLUE
${clueBrief(c, me)}
${links ? "\nITS CONNECTIONS\n" + links : ""}

PLACES
${places.map((p, i) => `P${i + 1} ${p.name}${p.sub ? " — " + p.sub : ""}`).join("\n")}

Answer with JSON only: {"clues":[{"t":"short title","k":"${St.TYPES.map(t => t[0]).join("|")}","place":"P3","pd":"what the players see","kp":"what only the game master knows","how":"how it is found","rev":"what it reveals","route":"next|alternative","why":"why it follows"}]}` };
  };
  St.readFollow = (raw, codes) => {
    let v = raw; if (typeof v === "string") { const m = v.match(/\{[\s\S]*\}/); try { v = m ? JSON.parse(m[0]) : null; } catch (e) { v = null; } }
    if (!v) return null; const s = (x, n) => String(x == null ? "" : x).trim().slice(0, n || 400);
    return [].concat(v.clues || []).slice(0, 4).map(c => ({ t: s(c.t, 80), k: TYPE[c.k] ? c.k : "other", place: codes[s(c.place, 6)] || "", pd: s(c.pd), kp: s(c.kp), how: s(c.how), rev: s(c.rev), route: c.route === "alternative" ? "alternative" : "next", why: s(c.why) })).filter(c => c.t);
  };
  // speaking as a person: what they know, how sure, what they will say, and why they hold the rest back
  St.speakPrompt = (who, question, evidence) => {
    const e = St.ent(who) || { name: who }, cast = who.startsWith("cast:") ? (A.castData || {})[who.slice(5)] || {} : {}, [pl, nid] = who.startsWith("npc:") ? who.slice(4).split("/") : [], n = pl ? ((A.get(pl, 99) || {}).npcs || {})[nid] || {} : {};
    const g = k => n[k] || cast[k] || "";
    const kn = St.knowledgeOf(who).map(k => `- ${k.text || St.name(k.about)}${k.about ? " (about: " + St.name(k.about) + ")" : ""} — ${(St.KTYPES.find(x => x[0] === k.type) || [0, "known"])[1].toLowerCase()}; came by it: ${(St.KHOW.find(x => x[0] === k.how) || [0, "unrecorded"])[1].toLowerCase()}${k.from ? " (from " + St.name(k.from) + ")" : ""}; reliability: ${k.rel || "unsure"}; will: ${(St.KSHARE.find(x => x[0] === k.share) || [0, "tell if asked"])[1].toLowerCase()}${k.why ? " because " + k.why : ""}`).join("\n");
    const ev = evidence ? St.ent(evidence) : null, evc = ev && ev.kind === "clue" ? St.clue(ev.place, ev.id) || {} : null;
    return `You are playing ${e.name}${e.role ? ", " + e.role : ""}, a character in the tabletop roleplaying campaign "${(A.config || {}).title || ""}" (${St.genre() || "any genre"}), speaking to the players' characters. Stay in character and keep to the setting.

WHO THEY ARE
${[g("look") && "Looks: " + g("look"), g("manner") && "Manner: " + g("manner"), g("voice") && "Voice: " + g("voice"), g("bg") && "Their story: " + g("bg"), g("want") && "Wants: " + g("want"), g("secret") && "Hides: " + g("secret"), g("lie") && "The lie they tell: " + g("lie"), g("press") && "What makes them talk: " + g("press"), n.doing && "Doing now: " + n.doing].filter(Boolean).join("\n")}

WHAT THEY KNOW (and nothing else)
${kn || "- (nothing recorded beyond the above)"}
${n.knows ? "Written in the campaign: they know " + n.knows : ""}${n.rev ? "\nThey will reveal: " + n.rev : ""}
${ev ? `\nTHE PARTY SHOWS THEM: ${ev.name}${evc && evc.pd ? " — " + evc.pd : ""}\n` : ""}
THE PARTY ASKS: ${question}

Rules: answer only from what they know. Say what they saw as seen, what they heard as hearsay, what they suspect as suspicion. Never name or describe what they could not know (if they saw a coat but not a face, they cannot say whose face). Hold back what they hide or refuse, for the reasons given; lie only where their established lie or motives call for it. React to evidence in character. Reply with their words (two to six sentences), then a line starting "GM:" saying briefly what they held back or got wrong, and why.`;
  };

  /* ---- the page's database: watched, laid over the campaign, and (in the Atlas app) kept in the campaign's files */
  let listeners = [], mirrorT = 0;
  St.on = fn => { listeners.push(fn); };
  St.changed = meta => {
    for (const f of listeners) { try { f(meta); } catch (e) { console.warn(e); } }
    if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("atlas-story", { detail: meta || {} }));
    if (meta !== "remote" && typeof window !== "undefined" && window.ATLAS_APP && window.ATLAS_APP.saveStory) { clearTimeout(mirrorT); mirrorT = setTimeout(() => window.ATLAS_APP.saveStory(St.snapshot()).catch(e => console.warn("story not kept in the campaign", e)), 1500); }
  };
  // what the page has written, as the campaign's edits/story.js holds it
  St.snapshot = () => ({ cluebook: Object.fromEntries(Object.entries(LIVE.cluebook).map(([pl, d]) => [pl, (d && d.clues) || {}])), links: LIVE.links, items: LIVE.items, questions: LIVE.questions, knowledge: LIVE.knowledge, trapbook: Object.fromEntries(Object.entries(LIVE.trapbook).map(([pl, d]) => [pl, (d && d.recs) || {}])), riddlebook: Object.fromEntries(Object.entries(LIVE.riddlebook).map(([pl, d]) => [pl, (d && d.recs) || {}])) });
  St.ready = () => !!ST;
  St.connect = (store, opt) => {
    if (ST) return; ST = store;
    const map = Object.entries(DBN).concat([["done", "clues"]]);
    for (const [k, coll] of map) store.watch(coll, d => {
      if (k === "done") LIVE.done = Object.fromEntries(Object.entries(d || {}).map(([pl, x]) => [pl, ((x || {}).done || []).filter(s => typeof s === "string")]));
      else LIVE[k] = Object.assign({}, d || {});
      bump(); St.changed("remote");
    });
    void opt;
  };
})(ATLAS);
