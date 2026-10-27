/* The game master's copilot (the user asked, 27 Oct 2026, for an improvising partner at the table). Most of all: a
   player says something nobody planned to one of the campaign's people, and the game master needs that person's answer
   now. Talk takes the investigation's "Speak as them" (atlas-story.js: who they are, and only what they know) further:
   a conversation that goes on, each answer in their voice, which the game master can change, ask for again or in
   another tone, show the players, and, only when they say so, have the person remember (their knowledge, which every
   later answer draws on) and add to tonight's notes. Improvise answers the other moments a game master is stuck (a
   place to describe, a reaction, two people talking, consequences, details, what happens next, an encounter), each
   from the campaign's own words (the passages "Ask the campaign" finds), never deciding for the game master and never
   changing the campaign by itself. Everything here stays on the game master's side unless they show it.
   It is a tab of At the table, and "Talk" in the toolbar at the bottom right of every page. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table, St = A.story; if (!TU || !T || !St) return;
  const api = TU.api, esc = A.esc;
  const UI = { mode: "talk", who: "", q: "", tone: "", busy: false, mem: null, imp: { kind: "describe", text: "", place: "", a: "", b: "", out: "", hits: null }, err: "" };
  const TONES = [["", "As they are"], ["warmer", "Warmer, more open"], ["colder", "Colder, curt"], ["evasive", "Evasive"], ["suspicious", "Suspicious of them"], ["bargain", "Wants something in return"], ["threat", "Threatening"], ["afraid", "Frightened"], ["short", "Shorter"], ["more", "Say more"]];
  const TONE_SAY = { warmer: "warmer and more open than usual, though still themselves", colder: "colder and more curt", evasive: "evasive: they turn the question aside", suspicious: "suspicious of the party and their reasons for asking", bargain: "bargaining: they want something in return before saying more", threat: "threatening, if their nature allows it", afraid: "frightened", short: "very short: one or two sentences", more: "fuller: they say more than usual, as far as they know and are willing" };
  const OPINIONS = [["", "Not recorded"], ["friendly", "Friendly"], ["trusting", "Trusts them"], ["neutral", "Neutral"], ["wary", "Wary"], ["afraid", "Afraid of them"], ["hostile", "Hostile"]];
  const IMP = [
    ["describe", "Describe a place", "What the players see, hear and smell as they come in"],
    ["react", "How would someone react", "To something the players did or said"],
    ["dialogue", "Two people talk", "A short exchange the players overhear"],
    ["consequence", "What follows from it", "Believable consequences of what the players did"],
    ["details", "Details around them", "Small things to notice, sounds, people in the background"],
    ["next", "What could happen next", "Options from the story's open threads"],
    ["encounter", "An encounter now", "Something to meet, fitting the place and the moment"]
  ];
  const S = () => api.store();
  const docId = ref => String(ref).replace(/[^a-zA-Z0-9_-]/g, "_");
  const talk = ref => (S() && S().get("talks", docId(ref))) || { who: ref, turns: [], opinion: "" };
  const saveTalk = (ref, d) => S().set("talks", docId(ref), Object.assign({}, d, { who: ref, t: Date.now() }));
  const people = () => St.people().slice().sort((a, b) => a.name.localeCompare(b.name));
  const nameOf = ref => (St.ent(ref) || {}).name || ref;
  const placeName = id => (A.meta[id] || {}).name || id;
  // where a person is met: the place of their page, or the first place they stand in
  const whereOf = ref => { const e = St.ent(ref) || {}, at = (e.at || [])[0]; return at ? { pl: at.pl, room: at.room, npc: at.npc } : e.place ? { pl: e.place } : null; };
  const npcOf = ref => { const w = whereOf(ref); return w && w.npc ? ((A.get(w.pl, 99) || {}).npcs || {})[w.npc] || {} : {}; };

  /* ---- what has happened lately at the table: tonight's notes, the places opened and finished, the clocks */
  function lately() {
    const st = S(), out = [], n = api.session(), notes = (api.notesOf(n) || {}).notes || "";
    if (notes) out.push(`Tonight's notes (session ${n}): ${notes.slice(-900)}`);
    const known = Object.entries(st.get("status") || {}).filter(([, v]) => v && v.status && v.status !== "unknown").map(([id, v]) => `${placeName(id)} (${v.status})`);
    if (known.length) out.push("Places the party knows of: " + known.slice(0, 20).join(", "));
    const found = []; for (const [pl, d] of Object.entries(st.get("clues") || {})) for (const k of (d && d.done) || []) { const c = ((A.get(pl, 99) || {}).clues || {})[k]; if (c) found.push(`${c.t || k} (${placeName(pl)})`); }
    if (found.length) out.push("Clues the party has found: " + found.slice(-15).join("; "));
    for (const c of A.clocksData || []) { const at = api.clockAt(c); if (at) out.push(`${c.name}: ${at} of ${+c.segments || (c.ticks || []).length || 4} — ${(c.ticks || [])[at - 1] || ""}`); }
    return out.join("\n");
  }

  /* ---- Talk: the prompt, built on Speak as them */
  function talkPrompt(ref, q, d, again) {
    const base = St.speakPrompt(ref, q, null), cut = base.indexOf("THE PARTY ASKS:");
    const w = whereOf(ref), n = npcOf(ref), op = (OPINIONS.find(o => o[0] === d.opinion) || [0, ""])[1];
    const conv = (d.turns || []).slice(-8).map(t => `A player: ${t.q}\n${nameOf(ref)}: ${t.a}`).join("\n");
    const extra = [
      w ? `WHERE THEY ARE: ${placeName(w.pl)}${w.room && A.nameOf ? ", " + (A.nameOf(A.get(w.pl, 99), w.room) || w.room) : ""}${n.doing ? "; " + n.doing : ""}` : "",
      `WHAT HAS HAPPENED AT THE TABLE LATELY (they know of it only if they were there, were told, or it is common talk):\n${lately() || "(nothing recorded)"}`,
      op ? `WHAT THEY THINK OF THE PARTY: ${op}` : "",
      conv ? `THE CONVERSATION SO FAR (this scene):\n${conv}` : "",
      UI.tone ? `THE GAME MASTER WANTS THIS ANSWER: ${TONE_SAY[UI.tone]}. Stay true to who they are.` : "",
      again ? `Give a different answer from this one, still in character: "${again}"` : ""
    ].filter(Boolean).join("\n\n");
    const head = cut > 0 ? base.slice(0, cut) : base, tail = cut > 0 ? base.slice(cut) : "";
    return head + extra + "\n\n" + tail.replace("THE PARTY ASKS:", "A PLAYER SAYS OR ASKS:") + " They may lie, evade, bargain, threaten, grow suspicious or refuse, as their nature and what is at stake for them call for; never reveal what only the game master knows unless their own motives would.";
  }
  const split = raw => { const i = raw.search(/\n\s*GM:/i); return { a: (i >= 0 ? raw.slice(0, i) : raw).trim().replace(/^["“]|["”]$/g, ""), gm: i >= 0 ? raw.slice(i).replace(/^\s*GM:\s*/i, "").trim() : "" }; };
  async function answer(again) {
    const ref = UI.who; if (!ref) return;
    const d = talk(ref), turns = (d.turns || []).slice();
    let q = UI.q.trim(), prev = null;
    if (again) { prev = turns.pop(); if (!prev) return; q = prev.q; } else if (!q) return;
    UI.busy = true; UI.err = ""; paint();
    const turn = { q, a: "…", gm: "", t: Date.now(), tone: UI.tone };
    const live = Object.assign({}, d, { turns: turns.concat([turn]) });
    let raw = null;
    try { raw = await api.askRaw(talkPrompt(ref, q, Object.assign({}, d, { turns }), prev && prev.a), t => { const s = split(t); turn.a = s.a || "…"; paintTalk(live); }); } catch (e) { raw = null; UI.err = e && e.code === "rate_limited" ? "Too many at once: wait a moment." : ""; }
    if (raw) { Object.assign(turn, split(raw)); saveTalk(ref, live); UI.q = ""; }
    else { turn.a = ""; turn.none = true; UI.err = UI.err || "Claude is not reachable from this page: here is what they would share, as recorded."; }
    UI.busy = false; paint(live);
  }
  // without Claude: what they would tell, as their knowledge says
  function fallback(ref) {
    const ks = St.knowledgeOf(ref), tell = ks.filter(x => x.share === "shares" || x.share === "pressed"), hide = ks.filter(x => x.share === "hides" || x.share === "refuses"), n = npcOf(ref);
    return `<div class="cp-say"><ul>${tell.map(x => `<li>${esc(x.text || St.name(x.about))}${x.share === "pressed" ? ` <span class="kn">(if pressed)</span>` : ""}</li>`).join("") || (n.rev ? `<li>${esc(n.rev)}</li>` : "<li>Nothing, as recorded.</li>")}</ul>${hide.length ? `<p class="kn">What they hold back: ${hide.map(x => esc(x.text || St.name(x.about))).join("; ")}.</p>` : ""}</div>`;
  }

  /* ---- drawing it */
  const opt = (list, cur) => list.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`).join("");
  function whoPicker() {
    const ps = people(), byPl = {};
    for (const p of ps) { const w = whereOf(p.ref), g = w ? placeName(w.pl) : "The cast"; (byPl[g] = byPl[g] || []).push(p); }
    return `<select class="t-in" data-cp="who" aria-label="Who they are talking to"><option value="">Who are they talking to?</option>${Object.entries(byPl).map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(p => `<option value="${esc(p.ref)}"${p.ref === UI.who ? " selected" : ""}>${esc(p.name)}${p.sub ? " · " + esc(p.sub) : ""}</option>`).join("")}</optgroup>`).join("")}</select>`;
  }
  function turnHTML(ref, t, i, last) {
    return `<div class="cp-turn"><p class="cp-q"><span>A player</span>${esc(t.q)}</p>
      ${t.none ? fallback(ref) : `<div class="cp-say"><b>${esc(nameOf(ref))}</b><textarea class="cp-a" data-cp="edit" data-i="${i}" rows="${Math.min(8, 2 + Math.ceil((t.a || "").length / 70))}" aria-label="Their answer: change it as you like">${esc(t.a || "")}</textarea>${t.gm ? `<p class="cp-gm"><b>For you:</b> ${esc(t.gm)}</p>` : ""}</div>
      <div class="t-row cp-acts">${last ? `<button type="button" class="t-mini" data-cp="again"${UI.busy ? " disabled" : ""}>Another answer</button>` : ""}<button type="button" class="t-mini" data-cp="showp" data-i="${i}" title="Their name and these words on the players' screen">Show the players</button><button type="button" class="t-mini" data-cp="memo" data-i="${i}" title="They remember it; it can go in tonight's notes. Nothing is kept until you say so.">Remember this…</button><button type="button" class="t-mini" data-cp="copy" data-i="${i}">Copy</button>${t.kept ? `<span class="cp-kept">Remembered</span>` : ""}</div>`}
      ${UI.mem && UI.mem.i === i && UI.mem.who === ref ? memForm(ref, t) : ""}</div>`;
  }
  function memForm(ref, t) {
    const n = api.session(), sum = UI.mem.text != null ? UI.mem.text : `Session ${n}: the party asked "${t.q}"; ${nameOf(ref)} answered: "${String(t.a || "").slice(0, 220)}${(t.a || "").length > 220 ? "…" : ""}"`;
    return `<form class="cp-mem" data-cp="memsave"><h6>What ${esc(nameOf(ref))} remembers of it</h6><textarea class="t-in" name="text" rows="3" maxlength="600">${esc(sum)}</textarea>
      <label>What they learned from the party, if anything<input class="t-in" name="learned" maxlength="300" placeholder="that the party is looking for the doctor"></label>
      <label class="t-fogck"><input type="checkbox" name="notes" checked> Add it to tonight's notes</label>
      <div class="t-row"><button class="t-btn prim">Remember it</button><button type="button" class="t-mini" data-cp="memx">Not now</button></div>
      <p class="t-small">It joins what they know (the investigation shows it, and every later answer draws on it). Undo is in the investigation's history.</p></form>`;
  }
  function talkHTML(compact, liveD) {
    const ref = UI.who, d = ref ? liveD || talk(ref) : null, turns = d ? d.turns || [] : [];
    const e = ref ? St.ent(ref) || {} : {}, w = ref ? whereOf(ref) : null;
    return `<div class="cp-talk">${whoPicker()}
      ${ref ? `<p class="t-small cp-who">${esc(e.role || e.sub || "")}${w ? " · " + esc(placeName(w.pl)) : ""} · <label>Thinks of the party <select class="t-in t-in-s" data-cp="opinion">${opt(OPINIONS, d.opinion || "")}</select></label></p>` : ""}
      <div class="cp-turns">${turns.slice(compact ? -3 : -12).map((t, i, a) => turnHTML(ref, t, turns.length - a.length + i, i === a.length - 1)).join("")}</div>
      ${ref ? `<form class="cp-ask" data-cp="ask"><textarea class="t-in" name="q" rows="2" maxlength="600" placeholder="What the player said, as they said it" aria-label="What the player said">${esc(UI.q)}</textarea>
        <div class="t-row"><label class="t-small">Tone <select class="t-in t-in-s" data-cp="tone">${opt(TONES, UI.tone)}</select></label><span class="t-sp"></span>${turns.length ? `<button type="button" class="t-mini" data-cp="newscene" title="Start a fresh conversation (what they remember stays)">New scene</button>` : ""}<button class="t-btn prim"${UI.busy ? " disabled" : ""}>${UI.busy ? "Thinking…" : "Answer as them"}</button></div></form>` : `<p class="t-small">Choose who the players are talking to. They answer from who they are and only what they know: they may lie, dodge, bargain or refuse, as they would.</p>`}
      ${UI.err ? `<p class="t-small cp-err">${esc(UI.err)}</p>` : ""}</div>`;
  }
  function impHTML() {
    const I = UI.imp, k = IMP.find(x => x[0] === I.kind) || IMP[0], placed = ["describe", "details", "encounter", "next", "consequence"].includes(I.kind), two = I.kind === "dialogue", one = I.kind === "react";
    const pick = (name, cur) => `<select class="t-in" data-cp="${name}"><option value="">${name === "place" ? "Where (optional)" : "Who"}</option>${name === "place" ? A.order.filter(id => !String(id).startsWith("fly-")).map(id => `<option value="${esc(id)}"${id === cur ? " selected" : ""}>${esc(placeName(id))}</option>`).join("") : people().map(p => `<option value="${esc(p.ref)}"${p.ref === cur ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`;
    const ph = { describe: "The room they just entered, the weather, the mood (optional)", react: "What the players did or said", dialogue: "What they talk about", consequence: "What the players did", details: "What is going on around them (optional)", next: "Where things stand (optional)", encounter: "The mood or danger you want (optional)" }[I.kind];
    return `<form class="cp-imp" data-cp="imp"><div class="cp-kinds" role="group" aria-label="What you need">${IMP.map(([v, l, h]) => `<button type="button" class="t-mini" data-cp="kind" data-k="${v}" aria-pressed="${v === I.kind}" title="${esc(h)}">${esc(l)}</button>`).join("")}</div>
      <p class="t-small">${esc(k[2])}.</p>
      <div class="t-row">${placed ? pick("place", I.place) : ""}${one || two ? pick("a", I.a) : ""}${two ? pick("b", I.b) : ""}</div>
      <textarea class="t-in" name="text" rows="2" maxlength="600" placeholder="${esc(ph)}">${esc(I.text)}</textarea>
      <div class="t-row"><span class="t-sp"></span><button class="t-btn prim"${UI.busy ? " disabled" : ""}>${UI.busy ? "Thinking…" : "Suggest"}</button></div></form>
      ${I.out ? `<div class="cp-out"><textarea class="cp-a" data-cp="impedit" rows="${Math.min(14, 3 + Math.ceil(I.out.length / 70))}" aria-label="The suggestion: change it as you like">${esc(I.out)}</textarea>
        <div class="t-row cp-acts"><button type="button" class="t-mini" data-cp="impagain"${UI.busy ? " disabled" : ""}>Another</button><button type="button" class="t-mini" data-cp="impshow">Show the players</button><button type="button" class="t-mini" data-cp="impnote">Add to tonight's notes</button><button type="button" class="t-mini" data-cp="impcopy">Copy</button></div>
        <p class="t-small">A suggestion, from the campaign's own words: nothing changes in the campaign unless you change it.</p></div>` : ""}
      ${I.hits && I.hits.length && !I.out ? `<details open><summary>What the campaign says</summary><ol class="t-hits">${I.hits.map(h => `<li><b>${esc(h.src)}</b><p>${esc(h.text)}</p></li>`).join("")}</ol></details>` : ""}
      ${UI.err && UI.mode === "imp" ? `<p class="t-small cp-err">${esc(UI.err)}</p>` : ""}`;
  }
  function panelHTML(compact, liveD) {
    return `<div class="cp${compact ? " cp-sm" : ""}"><div class="cp-modes" role="tablist"><button type="button" role="tab" data-cp="mode" data-m="talk" aria-selected="${UI.mode === "talk"}">Talk</button><button type="button" role="tab" data-cp="mode" data-m="imp" aria-selected="${UI.mode === "imp"}">Improvise</button></div>
      ${UI.mode === "talk" ? talkHTML(compact, liveD) : impHTML()}</div>`;
  }
  // drawn again where it stands: the tab, and the toolbar's panel
  function paint(liveD) {
    const tab = document.querySelector("#tvBody .cp-host"); if (tab) tab.innerHTML = panelHTML(false, liveD);
    const pop = document.querySelector("#tPop .cp-host"); if (pop) pop.innerHTML = panelHTML(true, liveD);
  }
  // while an answer comes in, only the conversation is drawn again (so the text box being typed in keeps its words)
  function paintTalk(liveD) { document.querySelectorAll(".cp-turns").forEach(box => { const ref = UI.who, turns = liveD.turns, sm = !!box.closest(".cp-sm"); box.innerHTML = turns.slice(sm ? -3 : -12).map((t, i, a) => turnHTML(ref, t, turns.length - a.length + i, i === a.length - 1)).join(""); }); }

  /* ---- Improvise: a prompt from the campaign's passages */
  function impPrompt(again) {
    const I = UI.imp, c = A.config || {}, k = IMP.find(x => x[0] === I.kind) || IMP[0];
    const who = [I.a, I.b].filter(Boolean).map(ref => { const e = St.ent(ref) || {}, n = npcOf(ref), cast = ref.startsWith("cast:") ? (A.castData || {})[ref.slice(5)] || {} : {}, g = f => n[f] || cast[f] || ""; return `${e.name}${e.role ? ", " + e.role : ""}: ${[g("manner") && "manner: " + g("manner"), g("voice") && "voice: " + g("voice"), g("want") && "wants: " + g("want"), g("secret") && "hides: " + g("secret"), St.knowledgeOf(ref).length ? "knows: " + St.knowledgeOf(ref).map(x => x.text || St.name(x.about)).join("; ") : ""].filter(Boolean).join("; ")}`; }).join("\n");
    const q = [I.text, I.place && placeName(I.place), ...[I.a, I.b].filter(Boolean).map(nameOf)].filter(Boolean).join(" ");
    const hits = api.lookup(q || k[1], 10); I.hits = hits;
    const asks = {
      describe: `Describe ${I.place ? placeName(I.place) : "where the players are"}${I.text ? " (" + I.text + ")" : ""} as the players come in, to be read aloud: what they see, hear and smell, in three to five sentences. Only what is there for anyone to notice: no secrets.`,
      react: `How would ${I.a ? nameOf(I.a) : "this person"} react to this: ${I.text || "(the players' latest action)"}? Their likely reaction in two to four sentences, what they say if anything, and what they do next. Keep to who they are.`,
      dialogue: `Write a short exchange (four to eight lines) between ${I.a ? nameOf(I.a) : "one person"} and ${I.b ? nameOf(I.b) : "another"}${I.text ? " about " + I.text : ""}, as the players might overhear it. Each speaks in their own voice and says only what they know.`,
      consequence: `The players did this: ${I.text || "(describe it)"}. Suggest believable consequences: what happens at once, what soon, what later; who notices and how they respond; what changes${I.place ? " at " + placeName(I.place) : ""}. Mark anything not grounded in the campaign as a suggestion.`,
      details: `Give five small details around the players${I.place ? " at " + placeName(I.place) : ""}${I.text ? " (" + I.text + ")" : ""}: sounds, smells, small things to notice, people in the background. One line each.`,
      next: `Where things stand: ${I.text || "(as the passages and the table's state say)"}. Suggest three things that could happen next, each from the story's open threads (the villains' clocks, leads not yet followed), with what sets it off. One short paragraph each.`,
      encounter: `Suggest an encounter for right now${I.place ? " at " + placeName(I.place) : ""}${I.text ? " (" + I.text + ")" : ""}: who or what, what they want, how it could go (talk, flight or fight), and how it ties to the story. Name stat blocks only if the passages give them.`
    }[I.kind];
    return `You help the game master of the tabletop roleplaying campaign "${c.title || ""}"${c.system ? " (" + c.system + ")" : ""} improvise during play. Ground everything in the campaign's own words below; never contradict them, and never decide what the players do or how the dice fall. Where you add something the campaign does not say, keep it small and consistent with it. Plain prose, no headings, no lists unless asked.

${asks}${again ? `\n\nGive something different from this: "${again.slice(0, 600)}"` : ""}

${who ? "THE PEOPLE:\n" + who + "\n\n" : ""}WHAT HAS HAPPENED AT THE TABLE LATELY:\n${lately() || "(nothing recorded)"}

THE CAMPAIGN'S OWN WORDS:
${hits.map((h, i) => `[${i + 1}] ${h.src}\n${h.text}`).join("\n\n") || "(nothing found)"}`;
  }
  async function improvise(again) {
    UI.busy = true; UI.err = ""; const I = UI.imp, prev = again ? I.out : ""; I.out = ""; paint();
    let r = null; try { r = await api.askRaw(impPrompt(prev), t => { I.out = t; document.querySelectorAll(".cp-out .cp-a").forEach(x => { x.value = t; }); }); } catch (e) { r = null; }
    I.out = r ? String(r).replace(/\*\*([^*]+)\*\*/g, "$1").trim() : ""; if (!r) UI.err = "Claude is not reachable from this page: here is what the campaign says.";
    UI.busy = false; paint();
  }

  /* ---- what the game master does */
  const copy = t => { try { navigator.clipboard.writeText(t); api.note("Copied."); } catch (e) { api.note("This browser would not copy it."); } };
  const addNotes = text => { const n = api.session(), cur = (api.notesOf(n) || {}).notes || ""; api.saveNotes(n, (cur ? cur.replace(/\s+$/, "") + "\n" : "") + "• " + text); };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-cp]"); if (!b || b.tagName === "SELECT" || b.tagName === "TEXTAREA" || b.tagName === "FORM") return;
    const k = b.dataset.cp, ref = UI.who, d = ref ? talk(ref) : null, i = +b.dataset.i;
    switch (k) {
      case "mode": UI.mode = b.dataset.m; UI.err = ""; paint(); break;
      case "talkto": A.copilot.talkTo(b.dataset.who); break;
      case "kind": UI.imp.kind = b.dataset.k; UI.imp.out = ""; UI.imp.hits = null; paint(); break;
      case "again": answer(true); break;
      case "newscene": if (d) { saveTalk(ref, Object.assign({}, d, { turns: [] })); UI.mem = null; paint(Object.assign({}, d, { turns: [] })); } break;
      case "showp": { const t = d && d.turns[i]; if (t) api.show({ kind: "scene", title: nameOf(ref), text: t.a }); break; }
      case "copy": { const t = d && d.turns[i]; if (t) copy(t.a); break; }
      case "memo": UI.mem = { who: ref, i, text: null }; paint(); break;
      case "memx": UI.mem = null; paint(); break;
      case "impagain": improvise(true); break;
      case "impshow": if (UI.imp.out) api.show({ kind: "scene", title: "", text: UI.imp.out }); break;
      case "impnote": if (UI.imp.out) { addNotes(UI.imp.out); api.note("Added to tonight's notes."); } break;
      case "impcopy": if (UI.imp.out) copy(UI.imp.out); break;
    }
  });
  document.addEventListener("change", e => {
    const t = e.target, k = t.dataset && t.dataset.cp; if (!k) return;
    if (k === "who") { UI.who = t.value; UI.mem = null; UI.err = ""; paint(); }
    else if (k === "tone") UI.tone = t.value;
    else if (k === "opinion" && UI.who) { const d = talk(UI.who); saveTalk(UI.who, Object.assign({}, d, { opinion: t.value })); }
    else if (k === "place" || k === "a" || k === "b") UI.imp[k] = t.value;
    else if (k === "edit" && UI.who) { const d = talk(UI.who), turns = (d.turns || []).slice(), j = +t.dataset.i; if (turns[j]) { turns[j] = Object.assign({}, turns[j], { a: t.value, edited: true }); saveTalk(UI.who, Object.assign({}, d, { turns })); } }
    else if (k === "impedit") UI.imp.out = t.value;
  });
  document.addEventListener("input", e => { const t = e.target; if (t.name === "q" && t.closest && t.closest(".cp-ask")) UI.q = t.value; else if (t.name === "text" && t.closest && t.closest(".cp-imp")) UI.imp.text = t.value; else if (t.name === "text" && t.closest && t.closest(".cp-mem") && UI.mem) UI.mem.text = t.value; });
  document.addEventListener("keydown", e => { const t = e.target; if (e.key === "Enter" && !e.shiftKey && t.name === "q" && t.closest && t.closest(".cp-ask")) { e.preventDefault(); answer(false); } });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.cp) return; e.preventDefault();
    if (f.dataset.cp === "ask") answer(false);
    else if (f.dataset.cp === "imp") improvise(false);
    else if (f.dataset.cp === "memsave") {
      const ref = UI.who, d = talk(ref), j = UI.mem && UI.mem.i, t = d.turns[j]; if (!t) return;
      const text = f.querySelector('[name="text"]').value.trim(), learned = f.querySelector('[name="learned"]').value.trim(), notes = f.querySelector('[name="notes"]').checked, n = api.session();
      // what they remember: a thing they saw for themselves; what they learned: told by the party
      if (text) St.know({ who: ref, text, type: "fact", how: "present", rel: "reliable", share: "pressed", when: "Session " + n, note: "A conversation at the table, kept by the game master" }, { src: "copilot" });
      if (learned) St.know({ who: ref, text: learned, type: "report", how: "told", rel: "reliable", share: "pressed", when: "Session " + n, note: "Told by the party" }, { src: "copilot" });
      if (notes && text) addNotes(text);
      const turns = d.turns.slice(); turns[j] = Object.assign({}, t, { kept: true }); saveTalk(ref, Object.assign({}, d, { turns }));
      UI.mem = null; api.note(`${nameOf(ref)} will remember it.`); paint();
    }
  });

  /* ---- where it lives: a tab of At the table, and Talk in the toolbar */
  TU.addTab({ key: "copilot", label: "Copilot", icon: "ask", group: "play", after: "ask", desc: "A person's answer to what a player said; help when you are stuck",
    html: () => `<div class="t-grid t-g2w"><div><section class="t-card"><h3>${T.icon("ask")} Copilot</h3><div class="cp-host">${panelHTML(false)}</div></section></div>
      <div><section class="t-card"><h3>How it helps</h3><p class="t-small"><b>Talk:</b> choose who the players are talking to and type what a player said. They answer as themselves, from only what they know (what the investigation records, and what the campaign writes of them): they may lie, dodge, bargain or refuse. Change the answer as you like, ask for another or in another tone, carry on the conversation, show it to the players, and, only if you say so, have them remember it.</p><p class="t-small"><b>Improvise:</b> a place to describe, how someone reacts, two people talking, what follows from what the players did, details around them, what could happen next, an encounter. Each from the campaign's own words; nothing in the campaign changes by itself.</p><p class="t-small">On claude.ai Claude writes the answers (the page asks the first time); in the Atlas app, your own Claude. Without either, Talk shows what they would share, and Improvise what the campaign says.</p></section></div></div>`,
    status: () => { const n = Object.keys((S() && S().get("talks")) || {}).length; return n ? `${n} ${n === 1 ? "conversation" : "conversations"}` : ""; }
  });
  if (TU.addDock) TU.addDock("talk", "Talk", "ask", head => head("ask", "Talk as them", "copilot", "Copilot") + `<div class="cp-host">${panelHTML(true)}</div>`);
  // from a person's page in the investigation: carry on with them here
  A.copilot = { talkTo(ref) { UI.mode = "talk"; UI.who = ref; UI.mem = null; if (api.openDock) api.openDock("talk"); else api.open("copilot"); paint(); }, prompt: talkPrompt, impPrompt };
})(ATLAS);
