/* Checking the campaign for consistency (the user asked, 27 Oct 2026): what does not fit together, across the story and
   its clues, the people and what they know, the maps, and what the players have done at the table. It grows from what
   the investigation already finds (atlas-story.js: St.warnings: loose clues, single ways in, contradictions the game
   master recorded, differing accounts, knowledge without a source, connections to things gone), and adds what the
   campaign's own data can show for certain: a clue that leads to no place or lies in no room, a person in a room that
   is not there, someone who told what they are not recorded as knowing, a chamber nobody can reach, a hidden clue with
   no way to it, a clue found or a room seen in a place the table still marks unknown, tonight's plan sending the party
   somewhere finished.
   Every finding carries its evidence. What only the campaign's words could show (a tunnel the story speaks of that the
   maps lack) is left to Claude, asked on demand, and kept only where both sides of it quote the campaign word for word;
   those are possible issues, for the game master to judge. Nothing is ever changed without the game master: each
   finding can be gone to, mended by hand, mended by the one change offered for it, marked intentional (a lie, a
   misunderstanding, a mystery on purpose) or dismissed, and it comes back only if its evidence changes.
   The checks run again a moment after the table or the investigation changes; the copilot (atlas-copilot.js) asks
   them when the game master asks whether something fits. Later systems (factions, the world clock, travel) add their
   checks with A.consistency.add(name, fn). */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table, St = A.story; if (!TU || !T || !St) return;
  const api = TU.api, esc = A.esc;
  const AREAS = [["story", "The story and its clues"], ["people", "People and what they know"], ["maps", "The maps"], ["table", "What the players have done"], ["time", "Sessions and clocks"]];
  const SEV = [["error", "Certain"], ["warn", "Possible"], ["note", "Worth a look"]];
  const S = () => api.store();
  const placeName = id => (A.meta[id] || {}).name || id;
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const roomIds = M => { const s = new Set(); for (const F of M.floors || []) for (const r of F.R || []) s.add(r[0]); for (const k of Object.keys(M.rooms || {})) s.add(k); return s; };
  const status = id => ((S() && S().get("status", id)) || {}).status || "unknown";

  /* ---- the checks: each gives findings { area, sev, kind, title, why, evidence: [{ text, ref }], refs, suggest, fix } */
  const CHECKS = [];
  const add = (name, fn) => { CHECKS.push([name, fn]); return api; };

  // what the investigation already finds
  add("investigation", () => St.warnings().map(w => {
    const base = { kind: w.kind, refs: [w.ref].concat(w.refs || []).filter(Boolean), evidence: [{ text: w.text, ref: w.ref }], why: w.text };
    switch (w.kind) {
      case "gone": return Object.assign(base, { area: "story", sev: "error", title: "A connection to something no longer in the campaign", suggest: "Remove the connection, or put back what it joined.", fix: w.link ? { kind: "unlink", link: w.link, label: "Remove the connection" } : null, id: w.link || w.k });
      case "contra": return Object.assign(base, { area: "story", sev: "warn", title: `${St.name(w.ref)} and ${St.name((w.refs || [])[0])} contradict each other`, suggest: "Decide which is true, or mark it intentional: a lie or a misunderstanding the players are meant to untangle.", id: w.link });
      case "accounts": return Object.assign(base, { area: "people", sev: "warn", title: "Accounts that differ", suggest: "If someone is wrong or lying on purpose, mark it intentional; if not, correct what one of them believes.", id: w.ref });
      case "nosource": return Object.assign(base, { area: "people", sev: "note", title: `How ${St.name(w.ref)} knows it is not recorded`, suggest: "Say how they came by it, so their answers stay honest to it.", fix: { kind: "how", k: w.k, label: "Record how they know it" }, id: w.k });
      case "single": return Object.assign(base, { area: "story", sev: "warn", title: `Only one way leads to ${St.name(w.ref)}`, suggest: "Add a second clue or person pointing there (the three-clue rule), so the story does not stall on one missed find.", id: w.ref });
      case "loose": return Object.assign(base, { area: "story", sev: "note", title: "A clue nothing joins to the story", suggest: "Connect it (Auto-Connect in the investigation), or mark it intentional as a red herring.", id: w.ref });
      default: return Object.assign(base, { area: "story", sev: "note", title: w.text.split(":")[0], suggest: "", id: w.ref || w.text });
    }
  }));

  // clues: where they lead, where they lie, whether they can be reached
  add("clues", () => {
    const out = [];
    for (const pl of A.order) {
      if (!A.maps[pl] || A.maps[pl].alias) continue;
      const M = A.get(pl, 99), rooms = roomIds(M), hidden = new Set();
      for (const F of M.floors) for (const r of F.R || []) if (r[7] && r[7].h) hidden.add(r[0]);
      for (const [cid, c] of Object.entries(M.clues || {})) {
        if (c.arch) continue; const ref = "clue:" + pl + "/" + cid, nm = c.t || cid;
        for (const to of [].concat(c.to || [])) if (to && !A.meta[to]) out.push({ area: "story", sev: "error", kind: "lead", id: ref + ">" + to, title: `"${nm}" leads to a place that is not in the campaign`, why: `Its lead names "${to}", and no place has that id.`, evidence: [{ text: `${placeName(pl)}, clue ${cid}: leads to "${to}"`, ref }], refs: [ref], suggest: "Point it at the place meant, or add that place." });
        // (a room's id, R and a number; a clue may also lie on a piece of ground, which is not a room)
        if (c.at && /^R\d/.test(c.at) && !rooms.has(c.at)) out.push({ area: "maps", sev: "error", kind: "room", id: ref + "@" + c.at, title: `"${nm}" lies in a room the map does not have`, why: `It is placed in ${c.at}, and no floor of ${placeName(pl)} has a room ${c.at}.`, evidence: [{ text: `${placeName(pl)}, clue ${cid}: at ${c.at}`, ref }], refs: [ref], suggest: "Move it into a room of the map (the map editor's Clues tool), or draw the room." });
        if (c.at && hidden.has(c.at)) { const reach = Object.values(M.secrets || {}).some(x => x.at === c.at || String(x.dest || "").includes(c.at)) || (M.floors || []).some(F => (F.D || []).some(d => d[3] === "s")); if (!reach) out.push({ area: "story", sev: "warn", kind: "hidden", id: ref + "#h", title: `"${nm}" is in a hidden room with no way to it`, why: `${c.at} is hidden from the players, and no secret door or secret of ${placeName(pl)} leads into it.`, evidence: [{ text: `${placeName(pl)}, clue ${cid}: in hidden room ${c.at}`, ref }], refs: [ref], suggest: "Give the room a secret door and a hint to it, or move the clue." }); }
      }
    }
    return out;
  });

  // people: where they stand, and who told whom what
  add("people", () => {
    const out = [], kn = St.knowledge();
    for (const pl of A.order) {
      if (!A.maps[pl] || A.maps[pl].alias) continue;
      const M = A.get(pl, 99), rooms = roomIds(M);
      for (const [nid, n] of Object.entries(M.npcs || {})) if (n.at && /^R\d/.test(n.at) && !rooms.has(n.at)) { const ref = St.personRef(pl, nid); out.push({ area: "people", sev: "error", kind: "where", id: ref + "@" + n.at, title: `${St.name(ref)} stands in a room the map does not have`, why: `They are placed in ${n.at} of ${placeName(pl)}, and the map has no such room.`, evidence: [{ text: `${placeName(pl)}, ${nid}: at ${n.at}`, ref }], refs: [ref], suggest: "Place them in a room of the map." }); }
    }
    for (const [id, k] of Object.entries(kn)) {
      if (k.off || k.how !== "told" || !k.from) continue;
      const theirs = St.knowledgeOf(k.from).some(x => (k.about && x.about === k.about) || (k.text && x.text && x.text.toLowerCase() === k.text.toLowerCase()) || x.id === k.via);
      const written = (St.ent(k.from) || {}).text || "", words = String(k.text || "").toLowerCase().split(/\W+/).filter(w => w.length > 5);
      if (!theirs && !(words.length && words.filter(w => written.toLowerCase().includes(w)).length >= Math.ceil(words.length * .6)))
        out.push({ area: "people", sev: "warn", kind: "told", id: id, title: `${St.name(k.from)} told ${St.name(k.who)} something they are not recorded as knowing`, why: `${St.name(k.who)} learned "${k.text || St.name(k.about)}" from ${St.name(k.from)}, but nothing ${St.name(k.from)} knows, and nothing written of them, says they knew it.`, evidence: [{ text: `${St.name(k.who)} knows "${k.text || St.name(k.about)}", told by ${St.name(k.from)}`, ref: k.who }], refs: [k.who, k.from], suggest: `Record how ${St.name(k.from)} came to know it, or say ${St.name(k.who)} learned it some other way.` });
    }
    return out;
  });

  // maps: chambers and rooms nobody can reach, stairs that go nowhere, secrets in rooms that are not there
  add("maps", () => {
    const out = [];
    for (const pl of A.order) {
      if (!A.maps[pl] || A.maps[pl].alias) continue;
      const M = A.get(pl, 99), ref = "place:" + pl, rooms = roomIds(M);
      if (M.floors.some(F => F.cave) && A.cave && A.cave.check) {
        let r = null; try { r = A.cave.check(M); } catch (e) { r = null; }
        if (r) { for (const e of r.errors || []) out.push({ area: "maps", sev: "error", kind: "cave", id: ref + ":" + hash(e.text), title: `${placeName(pl)}: ${e.text.split(":")[0]}`, why: e.text, evidence: [{ text: e.text, ref }], refs: [ref], suggest: "Open the map editor and press Check, then Mend: it opens a way with the least digging." }); for (const e of r.warnings || []) out.push({ area: "maps", sev: "warn", kind: "cave", id: ref + ":" + hash(e.text), title: `${placeName(pl)}: ${e.text.split(":")[0]}`, why: e.text, evidence: [{ text: e.text, ref }], refs: [ref], suggest: "Open the map editor and press Check." }); }
      } else {
        M.floors.forEach((F, fi) => {
          if (A.isGmFloor(F)) return;
          // a room with a way in: a door on its edge, stairs in it, or open ground beside it
          const own = new Map(); for (const r of F.R || []) for (let j = r[2]; j < r[2] + r[4]; j++) for (let i = r[1]; i < r[1] + r[3]; i++) own.set(i + "," + j, r);
          const way = new Set();
          for (const d of F.D || []) { const [x, y, or, , len = 1] = d; for (let k = 0; k < len; k++) for (const [i, j] of or === "h" ? [[x + k, y - 1], [x + k, y]] : [[x - 1, y + k], [x, y + k]]) { const r = own.get(i + "," + j); if (r) way.add(r[0]); } }
          for (const s of F.ST || []) { const r = own.get(Math.floor(s[1] + s[3] / 2) + "," + Math.floor(s[2] + s[4] / 2)); if (r) way.add(r[0]); }
          for (const r of F.R || []) if (!A.isIndoorKind(r[6])) { way.add(r[0]); for (let j = r[2] - 1; j <= r[2] + r[4]; j++) for (let i = r[1] - 1; i <= r[1] + r[3]; i++) { const q = own.get(i + "," + j); if (q) way.add(q[0]); } }
          const seen = new Set();
          for (const r of F.R || []) {
            if (seen.has(r[0]) || !A.isIndoorKind(r[6]) || A.isSolid(r[6])) continue; seen.add(r[0]);
            if (way.has(r[0])) continue;
            // rooms of one id joined, or a room opening on a room of another id with no wall between them, count too
            const nm = (F.R.find(q => q[0] === r[0] && q[5]) || r)[5] || r[0];
            out.push({ area: "maps", sev: "warn", kind: "noway", id: ref + "/" + fi + "/" + r[0], title: `${placeName(pl)}: ${nm} has no way in`, why: `On ${F.n || "floor " + (fi + 1)}, ${r[0]} ${nm} has no door, no stairs and no open ground beside it.`, evidence: [{ text: `${placeName(pl)}, ${F.n || "floor " + (fi + 1)}: ${r[0]} ${nm}`, ref }], refs: [ref], suggest: "Give it a door (or a secret door, if it is meant to be found), or join it to the room beside it." });
          }
        });
      }
      for (const [sid, x] of Object.entries(M.secrets || {})) if (x.at && /^R\d/.test(x.at) && !rooms.has(x.at)) out.push({ area: "maps", sev: "error", kind: "secret", id: ref + "#" + sid, title: `${placeName(pl)}: the secret "${x.t || sid}" is in a room the map does not have`, why: `It is placed in ${x.at}, and no floor has that room.`, evidence: [{ text: `${placeName(pl)}, secret ${sid}: at ${x.at}`, ref }], refs: [ref], suggest: "Place it in a room of the map." });
    }
    return out;
  });

  // what the players have done: found and seen in places the table still marks unknown; given handouts; tonight's plan
  add("table", () => {
    const out = [], st = S(); if (!st) return out;
    for (const [pl, d] of Object.entries(st.get("clues") || {})) {
      const done = (d && d.done) || []; if (!done.length || !A.meta[pl]) continue;
      if (["unknown", "rumoured"].includes(status(pl))) { const M = A.maps[pl] ? A.get(pl, 99) : {}; const names = done.map(k => ((M.clues || {})[k] || {}).t || k); out.push({ area: "table", sev: "warn", kind: "foundin", id: "found:" + pl, title: `The players found clues at ${placeName(pl)}, which the table marks ${status(pl)}`, why: `${names.length} clue${names.length > 1 ? "s" : ""} found there (${names.slice(0, 3).join("; ")}${names.length > 3 ? "…" : ""}), but the tracker says the party ${status(pl) === "unknown" ? "has not heard of it" : "has only heard of it"}.`, evidence: names.slice(0, 4).map(n => ({ text: `Found: ${n}`, ref: "place:" + pl })), refs: ["place:" + pl], suggest: "Mark the place open (they have been there), or take back the finds.", fix: { kind: "status", pl, to: "open", label: "Mark it open" } }); }
    }
    for (const [pl, doc] of Object.entries(st.get("fog") || {})) {
      if (!A.maps[pl] || doc.off || status(pl) !== "unknown") continue;
      const M = A.get(pl); if (!M.floors.some((F, fi) => T.fogSeen(doc, fi, F))) continue;
      out.push({ area: "table", sev: "warn", kind: "seenin", id: "seen:" + pl, title: `The players have seen ${placeName(pl)}, which the table marks unknown`, why: "Rooms of its map have been shown on the players' screen, but the tracker says the party has not heard of it.", evidence: [{ text: `${placeName(pl)}: rooms shown to the players`, ref: "place:" + pl }], refs: ["place:" + pl], suggest: "Mark it known or open.", fix: { kind: "status", pl, to: "open", label: "Mark it open" } });
    }
    for (const [hid, g] of Object.entries(st.get("given") || {})) { const h = (g && g.h) || T.allHandouts().find(x => x.id === hid); if (h && h.place && A.meta[h.place] && status(h.place) === "unknown") out.push({ area: "table", sev: "note", kind: "handout", id: "ho:" + hid, title: `A handout from ${placeName(h.place)} was given, but the place is unknown to the party`, why: `"${h.title || h.headline || hid}" belongs to ${placeName(h.place)}, which the tracker says they have not heard of.`, evidence: [{ text: `Given: ${h.title || h.headline || hid}`, ref: "place:" + h.place }], refs: ["place:" + h.place], suggest: "If they have it, they know of the place: mark it rumoured or known.", fix: { kind: "status", pl: h.place, to: "known", label: "Mark it known" } }); }
    const n = api.session(), s = (A.sessionsData || []).find(x => +x.n === +n);
    for (const pl of [].concat((s && s.places) || [])) { if (!A.meta[pl]) continue; if (["resolved", "closed"].includes(status(pl))) out.push({ area: "time", sev: "note", kind: "plan", id: "plan:" + n + ":" + pl, title: `Tonight's plan sends the party to ${placeName(pl)}, which is ${status(pl) === "closed" ? "closed" : "finished"}`, why: `Session ${n}'s plan lists ${placeName(pl)}; the tracker marks it ${status(pl)}.`, evidence: [{ text: `Session ${n}: ${s.title || ""}`, ref: "place:" + pl }], refs: ["place:" + pl], suggest: "Change tonight's plan, or reopen the place if the story returns there." }); }
    return out;
  });

  // sessions and clocks: what they name must exist
  add("time", () => {
    const out = [];
    for (const s of A.sessionsData || []) for (const pl of [].concat(s.places || [])) if (pl && !A.meta[pl]) out.push({ area: "time", sev: "error", kind: "sess", id: "sess:" + s.n + ":" + pl, title: `Session ${s.n} names a place that is not in the campaign`, why: `Its plan lists "${pl}", and no place has that id.`, evidence: [{ text: `Session ${s.n}${s.title ? ": " + s.title : ""}` }], refs: [], suggest: "Name the place meant." });
    return out;
  });

  /* ---- running them, and what the game master decided */
  let LAST = { at: 0, list: [] }, AI = [];
  function run() {
    const list = [];
    for (const [name, fn] of CHECKS) { let r = []; try { r = fn() || []; } catch (e) { console.warn("atlas: the consistency check " + name + " failed", e); } for (const f of r) list.push(Object.assign({ check: name }, f)); }
    for (const f of AI) list.push(f);
    for (const f of list) { f.key = f.check + ":" + f.kind + ":" + (f.id || hash(f.why || f.title)); f.sig = hash(JSON.stringify(f.evidence || []) + "|" + (f.why || "")); }
    const seen = new Set(); LAST = { at: Date.now(), list: list.filter(f => !seen.has(f.key) && seen.add(f.key)) };
    return LAST;
  }
  // what the game master said of a finding: intentional or dismissed, until its evidence changes
  const decided = f => { const d = S() && S().get("consist", hash(f.key)); return d && d.sig === f.sig ? d.state : ""; };
  const open = () => LAST.list.filter(f => !decided(f));
  // the findings that bear on a question (the copilot asks): those naming what it names
  function about(q) {
    const ws = String(q || "").toLowerCase().split(/\W+/).filter(w => w.length > 3);
    if (!LAST.at) run();
    return open().map(f => { const t = (f.title + " " + f.why + " " + (f.refs || []).map(r => St.name(r)).join(" ")).toLowerCase(); return [f, ws.filter(w => t.includes(w)).length]; }).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
  }

  /* ---- Claude, asked: contradictions only the campaign's words can show, kept only where both sides are quoted */
  function material() {
    const parts = [];
    for (const ch of A.storyData || []) if (ch.group === "The story") parts.push(`# ${ch.title}\n${ch.md}`);
    for (const p of A.order) { const m = A.meta[p] || {}, M = A.maps[p] ? A.get(p, 99) : null; parts.push(`# Place: ${m.name || p}${m.region ? " (" + m.region + ")" : ""}\n${[m.tagline, M && M.ov, M && M.ext].filter(Boolean).join("\n")}${M ? "\nRooms: " + Object.entries(M.rooms || {}).slice(0, 40).map(([rid, r]) => `${rid} ${A.nameOf ? A.nameOf(M, rid) : ""}: ${String(r.d || "").slice(0, 140)}`).join(" | ") : ""}${M ? "\nPeople here: " + Object.values(M.npcs || {}).map(n => `${n.n || n.who}${n.knows ? " (knows: " + n.knows + ")" : ""}`).join("; ") : ""}${M ? "\nClues: " + Object.entries(M.clues || {}).map(([k, c]) => `${c.t || k}${c.to ? " → " + [].concat(c.to).join(", ") : ""}`).join("; ") : ""}`); }
    for (const c of Object.values(A.castData || {})) parts.push(`# Person: ${c.n}${c.role ? ", " + c.role : ""}\n${[c.bg, c.want && "Wants: " + c.want, c.secret && "Hides: " + c.secret, c.lie && "Lies: " + c.lie, c.fate && "Fate: " + c.fate].filter(Boolean).join("\n")}`);
    for (const s of A.sessionsData || []) parts.push(`# Session ${s.n}: ${s.title || ""}\n${[s.start, s.cliff, s.notes].filter(Boolean).join("\n")}`);
    const n = api.session(), notes = (api.notesOf(n) || {}).notes; if (notes) parts.push(`# What happened at the table (session ${n} notes)\n${notes}`);
    return parts.join("\n\n").slice(0, 60000);
  }
  async function askClaude() {
    const mat = material(), c = A.config || {};
    const prompt = `You check the tabletop roleplaying campaign "${c.title || ""}" for contradictions: two statements in the material below that cannot both be true (a passage between places the maps or descriptions deny, a person in two places at once, an event before its cause, someone dead who later acts, a building destroyed that later stands, a fact told two ways). Lies, mistakes and mysteries the material itself presents as such are NOT contradictions. Find at most eight, the most certain first.\n\nReply only with lines of JSON, one per contradiction: {"area": "story"|"people"|"maps"|"time", "title": "a short title", "why": "why they cannot both be true", "a": "the first statement, copied word for word from the material (at most 25 words)", "b": "the second, word for word (at most 25 words)", "fix": "the smallest change that would mend it"}\n\nMATERIAL:\n${mat}`;
    const raw = await api.askRaw(prompt);
    if (raw == null) return null;
    const flat = mat.replace(/\s+/g, " ").toLowerCase(), has = q => q && q.length > 8 && flat.includes(String(q).replace(/\s+/g, " ").toLowerCase().replace(/^["“]|["”]$/g, "").replace(/…$/, "").trim());
    const got = String(raw).split("\n").map(l => { try { return JSON.parse(l.trim().replace(/,$/, "")); } catch (e) { return null; } }).filter(x => x && x.title && x.a && x.b);
    // grounded: both sides must be in the campaign's own words, or it is not kept
    AI = got.filter(x => has(x.a) && has(x.b)).map((x, i) => ({ check: "claude", area: AREAS.some(a => a[0] === x.area) ? x.area : "story", sev: "warn", kind: "words", id: hash(x.a + "|" + x.b), title: x.title, why: x.why || "", evidence: [{ text: `"${x.a}"` }, { text: `"${x.b}"` }], refs: [], suggest: x.fix || "", ai: true }));
    return { asked: got.length, kept: AI.length };
  }
  // Claude's suggestion for mending one finding, from its evidence and the passages around it
  async function suggestFix(f) {
    const hits = api.lookup([f.title, f.why, ...(f.refs || []).map(r => St.name(r))].join(" "), 8);
    const prompt = `In the tabletop roleplaying campaign "${(A.config || {}).title || ""}", this does not fit:\n${f.title}\nWhy: ${f.why}\nEvidence:\n${(f.evidence || []).map(e => "- " + e.text).join("\n")}\n\nSuggest the smallest change that makes it consistent while keeping the story, its mysteries and what the players have already seen: say exactly what to change and where, in two to four sentences. If it could be intentional (a lie, a misunderstanding), say how to make that clear instead. Plain prose.\n\nThe campaign's own words:\n${hits.map((h, i) => `[${i + 1}] ${h.src}\n${h.text}`).join("\n\n")}`;
    return api.askRaw(prompt);
  }

  /* ---- the page: a tab of At the table */
  const UI = { show: "open", area: "", busy: "", fixes: {}, msg: "" };
  const go = ref => {
    if (!ref) return; const k = ref.split(":")[0];
    if (["clue", "cast", "npc", "item"].includes(k) && A.clueUI) { api.open("clues"); setTimeout(() => A.clueUI.open(ref), 30); return; }
    const pl = k === "place" ? ref.slice(6) : (St.ent(ref) || {}).place; const X = api.ctx(); if (pl && A.meta[pl] && X) { if (X.setView) X.setView("gaz"); X.go(pl); }
  };
  function card(f) {
    const d = decided(f), sev = SEV.find(s => s[0] === f.sev) || SEV[2], fx = UI.fixes[f.key];
    return `<article class="cc cc-${f.sev}${d ? " cc-done" : ""}" data-ck="${esc(f.key)}"><div class="cc-h"><span class="cc-sev">${esc(sev[1])}</span>${f.ai ? `<span class="cc-sev cc-ai" title="Found by Claude in the campaign's words; both sides are quoted from it">Read by Claude</span>` : ""}<b>${esc(f.title)}</b></div>
      <p class="cc-why">${esc(f.why)}</p>
      ${(f.evidence || []).length ? `<ul class="cc-ev">${f.evidence.map(e => `<li>${e.ref ? `<button type="button" class="t-link" data-cc="go" data-ref="${esc(e.ref)}">${esc(e.text)}</button>` : esc(e.text)}</li>`).join("")}</ul>` : ""}
      ${f.suggest ? `<p class="cc-sug"><b>To mend it:</b> ${esc(f.suggest)}</p>` : ""}
      ${fx ? `<div class="cc-fix">${fx === "…" ? "Thinking…" : esc(fx).replace(/\n+/g, "<br>")}</div>` : ""}
      ${f.fix && f.fix.kind === "how" && !d ? `<div class="t-row"><select class="t-in t-in-s" data-cc-how="${esc(f.fix.k)}">${St.KHOW.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select><button type="button" class="t-mini" data-cc="how" data-k="${esc(f.fix.k)}">Record it</button></div>` : ""}
      <div class="t-row cc-acts">${(f.refs || [])[0] ? `<button type="button" class="t-mini" data-cc="go" data-ref="${esc(f.refs[0])}">Go to it</button>` : ""}${f.fix && f.fix.kind !== "how" && !d ? `<button type="button" class="t-mini" data-cc="fix">${esc(f.fix.label)}</button>` : ""}<button type="button" class="t-mini" data-cc="ai"${UI.busy ? " disabled" : ""}>Suggest a fix</button>${d ? `<span class="cc-state">${d === "intentional" ? "Marked intentional" : "Dismissed"}</span><button type="button" class="t-mini" data-cc="undo">Bring it back</button>` : `<button type="button" class="t-mini" data-cc="intentional" title="A lie, a misunderstanding or a mystery on purpose: it will not be raised again unless its evidence changes">Intentional</button><button type="button" class="t-mini" data-cc="dismiss">Dismiss</button>`}</div></article>`;
  }
  function html() {
    if (!LAST.at) run();
    const all = LAST.list, shown = all.filter(f => (UI.show === "all" || !decided(f)) && (!UI.area || f.area === UI.area));
    const count = a => all.filter(f => !decided(f) && (!a || f.area === a)).length;
    const bySev = s => shown.filter(f => f.sev === s);
    return `<div class="t-grid t-g2w"><div><section class="t-card cc-top"><h3>${T.icon("clue")} Is the campaign consistent?</h3>
        <p class="t-small">What does not fit together, from the campaign's own data: each finding with its evidence. Nothing changes unless you say so. Mark a lie, a misunderstanding or a mystery on purpose as intentional, and it is not raised again unless its evidence changes.</p>
        <div class="t-row"><button type="button" class="t-btn prim" data-cc="run">Check again</button><button type="button" class="t-btn" data-cc="claude"${UI.busy ? " disabled" : ""} title="Claude reads the story, the places, the people and tonight's notes for contradictions only their words show; each is kept only if both sides are quoted from the campaign">${UI.busy === "claude" ? "Claude is reading…" : "Ask Claude to read for contradictions"}</button><span class="t-small">Checked ${new Date(LAST.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
        ${UI.msg ? `<p class="t-small">${esc(UI.msg)}</p>` : ""}
        <div class="t-row cc-areas"><button type="button" class="t-mini" data-cc="area" data-a="" aria-pressed="${!UI.area}">All (${count("")})</button>${AREAS.map(([a, l]) => `<button type="button" class="t-mini" data-cc="area" data-a="${a}" aria-pressed="${UI.area === a}">${esc(l)} (${count(a)})</button>`).join("")}<label class="t-fogck"><input type="checkbox" data-cc="showall"${UI.show === "all" ? " checked" : ""}> Show what you marked</label></div></section>
      ${shown.length ? SEV.map(([s, l]) => bySev(s).length ? `<h4 class="cc-g">${esc(l)} <span class="kn">${bySev(s).length}</span></h4>${bySev(s).map(card).join("")}` : "").join("") : `<section class="t-card"><p class="kn">Nothing to look at${UI.area ? " here" : ""}: everything the checks can see fits together.</p></section>`}</div>
      <div><section class="t-card"><h3>What is checked</h3><ul class="t-small cc-list"><li><b>The story and its clues:</b> clues that lead nowhere or lie in no room, hidden clues with no way to them, places reached by one clue only, clues nothing joins to the story, contradictions you recorded.</li><li><b>People:</b> someone in a room that is not there, someone who told what they did not know, knowledge without a source, accounts that differ.</li><li><b>The maps:</b> rooms and chambers nobody can reach, stairs that go nowhere, secrets in rooms that are not there.</li><li><b>What the players have done:</b> clues found or rooms seen in a place still marked unknown, handouts from places they have not heard of, tonight's plan sending them somewhere finished.</li><li><b>Claude, when asked:</b> contradictions only the words show (a tunnel the story speaks of that the maps lack, someone in two places at once), each kept only when both sides are quoted from the campaign.</li></ul><p class="t-small">It looks again a moment after anything changes. The copilot uses the same findings when you ask it whether something fits.</p></section></div></div>`;
  }
  const keyOf = el => el.closest("[data-ck]") && el.closest("[data-ck]").dataset.ck, find = k => LAST.list.find(f => f.key === k);
  function mark(f, state) { S().set("consist", hash(f.key), state ? { state, sig: f.sig, key: f.key, t: Date.now() } : null); }
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-cc]"); if (!b || b.tagName === "INPUT") return;
    const k = b.dataset.cc, f = find(keyOf(b) || "");
    switch (k) {
      case "run": run(); UI.msg = ""; api.render(); break;
      case "area": UI.area = b.dataset.a; api.render(); break;
      case "go": go(b.dataset.ref); break;
      case "intentional": case "dismiss": if (f) { mark(f, k === "intentional" ? "intentional" : "dismissed"); api.render(); } break;
      case "undo": if (f) { mark(f, null); api.render(); } break;
      case "fix": if (!f || !f.fix) return;
        if (f.fix.kind === "unlink") St.put("links", f.fix.link, null, { src: "consistency" });
        else if (f.fix.kind === "status") { const cur = S().get("status", f.fix.pl) || {}; S().set("status", f.fix.pl, Object.assign({}, cur, { status: f.fix.to })); }
        api.note("Done. (Undo it where it was made: the investigation's history, or the place's tracker.)"); setTimeout(() => { run(); api.render(); }, 300); break;
      case "how": { const sel = document.querySelector(`[data-cc-how="${CSS.escape(b.dataset.k)}"]`), kk = St.knowledge()[b.dataset.k]; if (sel && kk) { St.put("knowledge", b.dataset.k, Object.assign({}, kk, { how: sel.value }), { src: "consistency" }); setTimeout(() => { run(); api.render(); }, 300); } break; }
      case "ai": if (!f) return; UI.fixes[f.key] = "…"; api.render(); { let t = null; try { t = await suggestFix(f); } catch (x) { t = null; } UI.fixes[f.key] = t || "Claude is not reachable from this page: the suggestion above is the one to follow."; api.render(); } break;
      case "claude": UI.busy = "claude"; UI.msg = ""; api.render(); { let r = null; try { r = await askClaude(); } catch (x) { r = null; } UI.busy = ""; run(); UI.msg = r == null ? "Claude is not reachable from this page." : r.kept ? `Claude found ${r.asked}; ${r.kept} quote the campaign on both sides and are listed below as possible.` : r.asked ? `Claude found ${r.asked}, but none quoted the campaign word for word on both sides, so none is kept.` : "Claude found no contradictions."; api.render(); } break;
    }
  });
  document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.cc === "showall") { UI.show = e.target.checked ? "all" : "open"; api.render(); } });

  TU.addTab({ key: "consistency", label: "Consistency", icon: "clue", group: "prep", after: "party", desc: "What does not fit together, with its evidence",
    html, status: () => { if (!LAST.at) return ""; const n = open().length; return n ? `${n} to look at` : "all fits"; },
    init(store) {
      // again a moment after the table or the investigation changes (each check is quick; the whole runs in a blink)
      let t = 0; const soon = () => { clearTimeout(t); t = setTimeout(() => { run(); if (api.tab() === "consistency") api.render(); }, 800); };
      for (const c of ["status", "clues", "fog", "given", "consist", "talks", "log", "mapedits"]) store.watch(c, soon);
      document.addEventListener("atlas-story", soon); store.ready.then(soon);
    }
  });
  A.consistency = { add, run, about, open: () => open(), askClaude, suggestFix, last: () => LAST };
})(ATLAS);
