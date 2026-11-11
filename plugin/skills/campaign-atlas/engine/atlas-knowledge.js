/* ================================================================
   CAMPAIGN ATLAS: WHAT ATLAS KNOWS
   The campaign as the game master tells it, and what Atlas knows of it (the user's requests of 11 Nov 2026: complete
   feature parity for handmade campaigns, and the Campaign Knowledge & Readiness Panel):
     - the campaign's own story, in as many or as few of its parts as the game master likes (the premise, the setting,
       the main story, its people and places, conflicts, what is happening now, its history, factions, secrets, what is
       planned, the players' characters, its rules, its tone), or a whole document pasted or read from a file (text,
       Markdown, Word, PDF), kept word for word. The copilot, Talk, Improvise, Ask the campaign and the councils read it
       with everything else (A.corpusExtra);
     - Read it into entries: Claude reads it and proposes the people, places, what each knows or hides, the secrets and
       plot points it holds; each is shown, to tick, change or leave; only what is ticked is made, through the editors'
       own saving (people, places, the investigation's knowledge and story elements). Nothing is made otherwise;
     - readiness: for each part of Atlas switched on, whether it has what it needs, from what the campaign holds (never a
       percentage): ready, ready in part, needs information; what is required, recommended or optional; each a button to
       the editor that gives it; parts switched off are not listed. Never a checklist to finish before playing;
     - Ask Atlas what it knows: what can be seen for certain answered at once (who has no motive, which factions have no
       ties...), anything else by Claude, from the campaign's own words, facts told apart from suggestions.
   Kept in the table's store (collection "context") and, in the Atlas app, in the campaign's files (edits/0-context.js,
   ATLAS.contextEdit). A tab of At the table, and on the Gazetteer's start for an empty campaign. One knowledge: nothing
   here is a second copy of the campaign; readiness reads what the other parts already keep.
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined" || !A.tableUI) return;
  const T = A.table, esc = A.esc, api = A.tableUI.api, St = A.story;
  const mod = (k, l) => !A.modules || A.modules.on(k, l);
  const SECTIONS = [
    ["premise", "The premise", "In a sentence or two: what the campaign is about", 2], ["setting", "The setting and its period", "1926, a fictional Massachusetts town", 2],
    ["story", "The main story", "What is really going on, as you see it", 6], ["people", "Important characters", "", 4], ["places", "Important places", "", 3],
    ["conflicts", "Its conflicts", "", 3], ["now", "What is happening now", "", 3], ["history", "Its history", "", 3], ["factions", "Factions and how they stand", "", 3],
    ["secrets", "Mysteries and secrets (only you see them)", "", 4], ["plans", "What you plan to happen", "", 3], ["pcs", "The players' characters", "", 3],
    ["rules", "Its rules and what is off limits", "", 2], ["tone", "Its tone and atmosphere", "grim and grounded; slow dread", 2]
  ];
  A.contextData = A.contextData || {};   // (the campaign's files fill it first: edits/0-context.js, ATLAS.contextEdit in atlas-table.js)
  let S = null;
  const ctx = () => Object.assign({}, A.contextData, (S && (S.get("context") || {}).now) || {});
  A.contextNow = ctx;
  // the copilot and Ask the campaign read it as the campaign's own words
  (A.corpusExtra = A.corpusExtra || []).push(() => { const c = ctx(), out = []; for (const [k, l] of SECTIONS) if (c[k]) out.push(["The campaign, as written: " + l, c[k]]); if (c.doc) out.push(["The campaign document" + (c.docName ? " (" + c.docName + ")" : ""), c.doc]); return out; });
  async function save(patch) {
    const next = Object.assign({}, ctx(), patch, { t: Date.now() }); for (const k of Object.keys(next)) if (next[k] === "") delete next[k];
    if (S) S.set("context", "now", next);
    document.dispatchEvent(new CustomEvent("atlas-context"));
    if (window.ATLAS_APP && window.ATLAS_APP.saveContext) { try { const o = Object.assign({}, next); delete o.t; await window.ATLAS_APP.saveContext(o); api.note("Saved into the campaign."); } catch (e) { api.note("Saved in the page, but not into the campaign's files: " + (e.message || e)); } }
    else api.note("Saved in this campaign's page.");
  }

  /* ---- reading a document: text and Markdown as they are; Word (its document.xml, unzipped here); PDF (pdf.js) */
  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (/\.(txt|md|markdown|text)$/.test(name) || /^text\//.test(file.type)) return file.text();
    if (/\.docx$/.test(name)) return docxText(await file.arrayBuffer());
    if (/\.pdf$/.test(name)) return pdfText(await file.arrayBuffer());
    throw new Error("Atlas reads text, Markdown, Word (.docx) and PDF files.");
  }
  async function docxText(buf) {
    const b = new Uint8Array(buf), dv = new DataView(buf); let e = b.length - 22; while (e > 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e <= 0) throw new Error("That Word file could not be read.");
    let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const fname = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nl));
      if (fname === "word/document.xml") {
        const lnl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true), data = b.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + csize);
        const xml = method === 0 ? new TextDecoder().decode(data) : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
        return xml.replace(/<w:tab\/>/g, "\t").replace(/<\/w:p>/g, "\n\n").replace(/<w:br\/>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
      }
      p += 46 + nl + xl + cl;
    }
    throw new Error("That Word file has no text Atlas can find.");
  }
  async function pdfText(buf) {
    if (!window.pdfjsLib) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload = ok; s.onerror = () => no(new Error("The PDF reader could not be loaded (it comes from cdnjs: is this computer online?).")); document.head.appendChild(s); });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise, out = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 300); i++) { const pg = await pdf.getPage(i), tc = await pg.getTextContent(); out.push(tc.items.map(t => t.str + (t.hasEOL ? "\n" : " ")).join("").replace(/[ \t]+\n/g, "\n")); }
    return out.join("\n\n").trim();
  }

  /* ---- what the campaign holds, read from where each part keeps it */
  function holds() {
    const cast = Object.entries(A.castData || {}).filter(([, c]) => c), clues = St ? St.allClues() : [], items = St ? Object.entries(St.items()).map(([id, it]) => Object.assign({ id }, it)) : [];
    const kn = St ? Object.values(St.knowledge()) : [], places = (A.order || []).filter(id => A.meta[id]), mapped = places.filter(id => A.maps[id] && !A.maps[id].alias);
    const facs = Object.entries(A.factionsData || {}), evs = A.worldTime ? A.worldTime.events() : [], hs = T.allHandouts ? T.allHandouts() : [], c = ctx();
    const tied = new Set(); for (const [id, f] of facs) for (const k of Object.keys(f.rel || f.ties || f.stance || {})) { tied.add(id); tied.add(k); }
    return { cast, clues, items, kn, places, mapped, facs, evs, hs, c, tied, story: !!(c.story || c.doc || c.premise || (A.storyData || []).some(ch => ch.group === "The story")) };
  }
  // the parts switched on, each with what it needs: [label, the module, required [], recommended [], optional []]; each
  // need [true if it has it, words, the editor that gives it]
  function readiness() {
    const H = holds(), n = (x, w) => `${x} ${w}${x === 1 ? "" : "s"}`, out = [];
    const motives = H.cast.filter(([, c]) => !c.want).length, secrets = H.cast.filter(([, c]) => c.secret).length;
    const add = (name, on, req, rec, opt) => { if (on) out.push({ name, req: req.filter(Boolean), rec: rec.filter(Boolean), opt: (opt || []).filter(Boolean) }); };
    add("The copilot (Talk, Improvise, Ask the campaign)", mod("copilot") && mod("ai"),
      [[H.story || H.cast.length || H.places.length, "something of the campaign to read: its story, a person or a place", "context"]],
      [[H.story, "the campaign's own story", "context"], [H.cast.length, H.cast.length ? n(H.cast.length, "person") : "its people", "person"], [H.cast.length && !motives, motives ? `what ${n(motives, "person")} want${motives === 1 ? "s" : ""}` : "what each person wants", "people"], [secrets, secrets ? n(secrets, "secret") + " kept by people" : "the secrets people keep", "people"], [H.c.now || H.items.some(i => i.kind === "plot"), "what is happening now, or the plot points", "context:now"]]);
    add("The investigation: clues", mod("investigation.clues"),
      [[H.clues.length, H.clues.length ? n(H.clues.length, "clue") : "a clue", "clue"]],
      [[H.clues.length && H.clues.every(x => x.c.at), "every clue in a room of its place", "clue"], [H.clues.some(x => St.linksOf("clue:" + x.pl + "/" + x.id).length || [].concat(x.c.to || []).length), "clues joined to the story or leading somewhere", "clue"]],
      [[H.items.some(i => i.kind === "mystery"), "a mystery holding them", "mystery"]]);
    add("What people know", mod("people.knowledge") && mod("investigation", "advanced"),
      [[H.cast.length, "a person", "person"]],
      [[H.kn.length, H.kn.length ? n(H.kn.length, "thing") + " recorded as known, believed or hidden" : "what anyone knows, believes wrongly or hides", "knowledge"]]);
    add("Plot points and story arcs", mod("plot"), [],
      [[H.items.some(i => i.kind === "plot"), "a plot point", "plot"], [H.items.some(i => i.kind === "plot" && i.on && i.on.k !== "hand"), "a plot point Atlas watches for (set off by a clue or an event)", "plot"]],
      [[H.items.some(i => (i.branches || []).length), "branches", "plot"]]);
    add("Mysteries", mod("investigation.mysteries"), [],
      [[H.items.some(i => i.kind === "mystery"), "a mystery", "mystery"], [H.items.some(i => i.kind === "mystery" && Object.values(i.roles || {}).filter(r => r === "essential").length >= 3), "three essential clues to a mystery", "mystery"], [H.items.some(i => i.kind === "mystery" && i.truth), "the truth of a mystery", "mystery"]]);
    add("The living world: events of the world's time", mod("living") && mod("living.events"), [],
      [[H.evs.length, H.evs.length ? n(H.evs.length, "event") + " planned" : "an event planned", "events"]],
      [[!!A.calendarData, "a calendar of its own (else the world's time keeps an ordinary one)", null]]);
    add("Factions and politics", mod("living", "advanced") && mod("living.factions"),
      [[H.facs.length, H.facs.length ? n(H.facs.length, "faction") : "a faction", "factions"]],
      [[H.facs.length && H.facs.every(([id]) => H.tied.has(id)), "how each faction stands with the others", "factions"], [H.facs.some(([, f]) => f.goal || f.plan || f.wants), "what the factions want", "factions"]]);
    add("The players' screen", mod("players"), [],
      [[H.mapped.length, H.mapped.length ? n(H.mapped.length, "place") + " with maps to show" : "a place with a map", "place"], [H.hs.length, H.hs.length ? n(H.hs.length, "handout") : "a handout", "handout"]]);
    add("Handouts", mod("handouts"), [], [[H.hs.length, H.hs.length ? n(H.hs.length, "handout") : "a handout", "handout"]]);
    add("Sounds", mod("sounds"), [], [[A.sound && A.sound.items().length, "a sound pack installed (the Sounds panel)", "sounds"]]);
    add("The narrator", mod("music", "voice"), [], [], [[A.narratorAI && A.narrator && A.narrator.engines().length, "the AI voices (in the Atlas app: the narrator's settings)", "narrator"]]);
    for (const r of out) r.status = r.req.some(x => !x[0]) ? "need" : r.rec.some(x => !x[0]) ? "part" : "ready";
    return { list: out, H };
  }
  // what can be seen for certain, without asking anyone
  function certain() {
    const H = holds(), L = [];
    const noWant = H.cast.filter(([, c]) => !c.want).map(([id, c]) => c.n || id); if (noWant.length) L.push(["People with no motive written", noWant]);
    const noSecret = H.cast.filter(([, c]) => !c.secret).map(([id, c]) => c.n || id); if (noSecret.length && noSecret.length < H.cast.length) L.push(["People with no secret", noSecret]);
    const noRoom = H.clues.filter(x => !x.c.at).map(x => (x.c.t || x.id) + " (" + ((A.meta[x.pl] || {}).name || x.pl) + ")"); if (noRoom.length) L.push(["Clues in no room", noRoom]);
    const lone = H.facs.filter(([id]) => !H.tied.has(id)).map(([id, f]) => f.n || f.name || id); if (lone.length) L.push(["Factions with no ties to the others", lone]);
    const knowNothing = H.cast.filter(([id]) => !H.kn.some(k => k.who === "cast:" + id)).map(([id, c]) => c.n || id); if (knowNothing.length && H.kn.length) L.push(["People recorded as knowing nothing", knowNothing]);
    if (A.consistency && A.consistency.findings) { try { const f = A.consistency.findings().slice(0, 8).map(x => x.text || String(x)); if (f.length) L.push(["What does not fit (the consistency check)", f]); } catch (e) {} }
    return L;
  }

  /* ---- the tab */
  const UI = { open: null, props: null, busy: "", ans: null };
  const GO = { context: "The campaign's story", person: "+ A person", people: "The people", clue: "+ A clue", knowledge: "Record what they know", plot: "+ A plot point", mystery: "+ A mystery", events: "Plan an event", factions: "The factions", place: "+ A place", handout: "+ A handout", sounds: "The Sounds panel", narrator: "The narrator's settings" };
  function html() {
    const c = ctx(), R = readiness(), ai = mod("ai");
    const filled = SECTIONS.filter(([k]) => c[k]).length;
    const rd = R.list.map(r => `<div class="kn-r kn-${r.status}"><div class="kn-rh"><b>${esc(r.name)}</b><span class="kn-st">${r.status === "ready" ? "Ready" : r.status === "part" ? "Ready in part" : "Needs information"}</span></div>
      ${[["Required", r.req], ["Recommended", r.rec], ["Optional", r.opt]].filter(([, L]) => L.length).map(([h, L]) => `<p class="kn-l"><span>${h}:</span> ${L.map(([ok, w, go]) => `<span class="kn-i${ok ? " ok" : ""}">${ok ? "✓" : "–"} ${esc(w)}${!ok && go ? ` <button type="button" class="t-link" data-know="go" data-go="${esc(go)}">${esc(GO[go.split(":")[0]] || "Open")}</button>` : ""}</span>`).join("")}</p>`).join("")}</div>`).join("") || `<p class="kn">Nothing switched on needs anything.</p>`;
    const ce = certain();
    return `<div class="know">
      <div class="ic-head"><div><h3>${T.icon("tonight")} What Atlas knows</h3><p class="t-small">The campaign as you tell it, what Atlas knows of it, and what each part of Atlas switched on could use. Nothing here must be filled in before you play: a campaign runs with as little as you have.</p></div></div>
      <section class="t-card" id="knCtx"><h4>The campaign's story <span class="kn">${filled ? filled + " of " + SECTIONS.length + " parts written" : "not written yet"}${c.doc ? " · a document of " + Math.round(c.doc.length / 1000) + " thousand characters" : ""}</span></h4>
        <p class="t-small">Write as much or as little as you like, in any of its parts, or paste or read in a whole document. It is kept word for word, and the copilot, Ask the campaign and the councils read it with the rest.</p>
        <form data-knform="ctx">${SECTIONS.map(([k, l, ph, rows]) => `<details class="loc-more"${c[k] || UI.open === k ? " open" : ""}><summary>${esc(l)}${c[k] ? " ✓" : ""}</summary><textarea class="t-in" name="${k}" rows="${rows}" maxlength="60000" placeholder="${esc(ph)}">${esc(c[k] || "")}</textarea></details>`).join("")}
          <details class="loc-more"${c.doc ? " open" : ""}><summary>A whole document${c.docName ? ": " + esc(c.docName) : ""}</summary><textarea class="t-in" name="doc" rows="8" maxlength="3000000" placeholder="Paste your campaign document here, or read it from a file">${esc(c.doc || "")}</textarea>
            <label class="t-btn">Read it from a file (text, Markdown, Word, PDF)<input type="file" accept=".txt,.md,.markdown,.docx,.pdf,text/plain" data-know="file" hidden></label> <span class="kn-fmsg t-small" aria-live="polite"></span></details>
          <div class="t-row"><button class="t-btn prim">Save</button>${ai ? `<button type="button" class="t-btn" data-know="read"${UI.busy ? " disabled" : ""}>${UI.busy === "read" ? "Reading…" : "Read it into entries"}</button><span class="t-small">Claude proposes the people, places, secrets and plot points it holds; nothing is made but what you tick.</span>` : ""}</div></form>
        ${UI.props ? propsHTML() : ""}</section>
      <section class="t-card"><h4>Is each part of Atlas ready?</h4><p class="t-small">For each part switched on for this campaign: what it needs to work, and what would help it. Each gap opens where it is filled in.</p><div class="kn-rs">${rd}</div></section>
      <section class="t-card"><h4>Ask Atlas what it knows</h4>
        ${ce.length ? `<details class="loc-more" open><summary>What can be seen for certain</summary>${ce.map(([h, L]) => `<p class="kn-l"><span>${esc(h)}:</span> ${L.slice(0, 24).map(esc).join(" · ")}${L.length > 24 ? " …" : ""}</p>`).join("")}</details>` : ""}
        ${ai ? `<form data-knform="ask" class="ic-form ic-inl"><input class="t-in" name="q" maxlength="400" placeholder="What do you know about my campaign? What does the copilot need for the next session?"><button class="t-btn"${UI.busy ? " disabled" : ""}>${UI.busy === "ask" ? "Thinking…" : "Ask"}</button></form>${UI.ans ? `<div class="ic-say kn-ans">${esc(UI.ans).replace(/\n/g, "<br>")}</div>` : ""}` : `<p class="kn">Claude's help is switched off for this campaign.</p>`}</section>
    </div>`;
  }
  // Claude's proposals from the story, each to tick
  function propsHTML() {
    const P = UI.props, row = (k, i, title, sub) => `<li><label class="loc-ck"><input type="checkbox" data-kp="${k}:${i}" checked> <b>${esc(title)}</b></label>${sub ? `<p class="kn">${esc(sub)}</p>` : ""}</li>`;
    const blocks = [["people", "People", x => [x.n, [x.role, x.secret && "Secret: " + x.secret, x.want && "Wants: " + x.want].filter(Boolean).join(" · ")]], ["places", "Places", x => [x.name, [x.kind, x.kp].filter(Boolean).join(" · ")]], ["knows", "What people know or hide", x => [`${x.who}: ${x.text}`, [x.type === "false" ? "believes it wrongly" : x.type === "suspicion" ? "suspects it" : "knows it", x.share === "hides" ? "hides it" : x.share === "refuses" ? "will not tell" : ""].filter(Boolean).join(", ")]], ["items", "Secrets, mysteries, plot points, factions", x => [x.n, [x.kind, x.d].filter(Boolean).join(" · ")]]];
    return `<div class="kn-props"><h5>What Claude found in it</h5><p class="t-small">Its reading of what you wrote, not established yet. Untick what is wrong; what you keep is made as you would make it by hand, and can be changed after.</p>${blocks.map(([k, h, f]) => (P[k] || []).length ? `<h6>${esc(h)}</h6><ul>${P[k].map((x, i) => { const [a, b] = f(x); return row(k, i, a, b); }).join("")}</ul>` : "").join("")}${P.note ? `<p class="kn">${esc(P.note)}</p>` : ""}<div class="t-row"><button type="button" class="t-btn prim" data-know="make">Make the ticked ones</button><button type="button" class="t-mini" data-know="drop">Leave them all</button></div></div>`;
  }
  async function readIn() {
    const c = ctx(), text = SECTIONS.filter(([k]) => c[k]).map(([k, l]) => `## ${l}\n${c[k]}`).join("\n\n") + (c.doc ? "\n\n## The document\n" + c.doc.slice(0, 120000) : "");
    if (!text.trim()) { api.note("Write something of the campaign's story first."); return; }
    const have = Object.values(A.castData || {}).map(p => p.n).filter(Boolean).slice(0, 80).join(", "), placesHave = (A.order || []).map(id => (A.meta[id] || {}).name).filter(Boolean).slice(0, 80).join(", ");
    const prompt = `You help a game master organise the campaign they wrote. Read it and list what it ESTABLISHES, in its own words: people, places, what particular people know, believe wrongly or hide, and the secrets, mysteries, plot points and factions it describes. Invent nothing; leave out anything it does not say. People already made: ${have || "none"}. Places already made: ${placesHave || "none"}; do not list those again.
Answer with JSON only: {"people":[{"n":"name","role":"","look":"","want":"","secret":"","place":"a place's name if it says where they are"}],"places":[{"name":"","kind":"house|shop|tavern|hospital|church|office|warehouse|other","pd":"what the players see","kp":"what it really is, its secrets"}],"knows":[{"who":"a person's name","text":"what they know, in a few words","type":"fact|false|suspicion","share":"shares|pressed|hides|refuses"}],"items":[{"kind":"mystery|plot|secret|faction|event|quest","n":"","d":""}],"note":"anything unclear, in a sentence"}

THE CAMPAIGN:
${text}`;
    UI.busy = "read"; api.render();
    let v = null; try { const raw = await api.askRaw(prompt, null, null, { kind: "reading", what: "your campaign's story", uses: ["what you wrote"] }); const m = String(raw || "").match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : null; } catch (e) { v = null; }
    UI.busy = ""; UI.props = v && typeof v === "object" ? v : null; if (!v) api.note("Claude could not read it just now. Try again, or make the entries yourself."); api.render();
  }
  async function makeTicked(body) {
    const P = UI.props || {}, on = k => [...body.querySelectorAll(`[data-kp^="${k}:"]`)].filter(x => x.checked).map(x => P[k][+x.dataset.kp.split(":")[1]]).filter(Boolean);
    const byName = {}, ppl = on("people"), pls = on("places"), kns = on("knows"), its = on("items"); let made = 0;
    for (const p of pls) { if (!A.locations || !A.locations.save) break; const id = "c-" + String(p.name || "place").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) + "-" + Math.random().toString(36).slice(2, 6); await A.locations.save(id, { name: p.name || "A place", type: "other", typeName: p.kind || "A place", pd: p.pd || "", kp: p.kp || "", ext: {}, from: "the campaign's story" }); made++; }
    for (const p of ppl) { if (!A.people) break; const at = p.place ? (A.order || []).find(id => ((A.meta[id] || {}).name || "").toLowerCase() === String(p.place).toLowerCase()) : null; const rec = { n: p.n || "Someone" }; for (const k of ["role", "look", "want", "secret"]) if (p[k]) rec[k] = p[k]; if (at) rec.at = { pl: at }; const id = await A.people.save("h-" + String(rec.n).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20) + "-" + Math.random().toString(36).slice(2, 5), rec); byName[rec.n.toLowerCase()] = id; made++; }
    const find = nm => { nm = String(nm || "").toLowerCase(); if (byName[nm]) return byName[nm]; const e = Object.entries(A.castData || {}).find(([, c]) => (c.n || "").toLowerCase() === nm || (c.n || "").toLowerCase().includes(nm)); return e ? e[0] : null; };
    for (const k of kns) { const who = find(k.who); if (!who || !St) continue; St.know({ who: "cast:" + who, text: k.text, type: ["fact", "false", "suspicion"].includes(k.type) ? k.type : "fact", share: ["shares", "pressed", "hides", "refuses"].includes(k.share) ? k.share : "pressed", how: "assigned" }, { note: "from the campaign's story" }); made++; }
    for (const it of its) { if (!St) break; St.put("items", St.uid("I"), { kind: ["mystery", "plot", "secret", "faction", "event", "quest"].includes(it.kind) ? it.kind : "other", n: it.n || "Untitled", d: it.d || "", src: "dm" }, { note: "from the campaign's story" }); made++; }
    UI.props = null; api.note(made ? `${made} made from the campaign's story. Change any of them where they are kept.` : "Nothing was ticked."); api.render();
  }
  function go(where) {
    const [k, sec] = where.split(":"), X = api.ctx();
    if (k === "context") { UI.open = sec || null; api.open("know"); return; }
    if (k === "person" && A.people) return A.people.open(null);
    if (k === "people" || k === "knowledge") { if (X && X.setView) X.setView("table"); api.open("clues"); const p = Object.keys(A.castData || {})[0]; if (A.clueUI && p) A.clueUI.open("cast:" + p); return; }
    if (k === "clue") { if (X && X.setView) X.setView("table"); api.open("clues"); if (A.clueUI && A.clueUI.newClue) A.clueUI.newClue(); return; }
    if ((k === "plot" || k === "mystery") && A.plot) return A.plot.open(k);
    if (k === "events") { if (X && X.setView) X.setView("table"); api.open("time"); return; }
    if (k === "factions") { if (X && X.setView) X.setView("table"); api.open("factions"); return; }
    if (k === "place" && A.encyclopedia) return A.encyclopedia.newPlace();
    if (k === "handout" && A.handoutWriter) return A.handoutWriter.open(null);
    if (k === "sounds" && A.sound) return A.sound.open(true);
    if (k === "narrator" && A.narrator) return A.narrator.open();
  }
  A.tableUI.addTab({
    key: "know", label: "What Atlas knows", icon: "tonight", group: "prep", after: "plot", desc: "The campaign's own story, what Atlas knows of it, what each part could use",
    html,
    status: () => { const r = readiness().list; const need = r.filter(x => x.status === "need").length, part = r.filter(x => x.status === "part").length; return need ? `${need} part${need === 1 ? "" : "s"} could use something` : part ? `${part} ready in part` : "everything switched on is ready"; },
    bind(body) {
      const f = body.querySelector('form[data-knform="ctx"]'); if (f) f.addEventListener("submit", e => { e.preventDefault(); const o = {}; for (const [k] of SECTIONS) o[k] = f.elements[k].value.trim(); o.doc = f.elements.doc.value; save(o).then(() => api.render()); });
      const q = body.querySelector('form[data-knform="ask"]'); if (q) q.addEventListener("submit", async e => { e.preventDefault(); const t = q.elements.q.value.trim(); if (!t) return; UI.busy = "ask"; api.render(); UI.ans = await ask(t); UI.busy = ""; api.render(); });
      const fi = body.querySelector('[data-know="file"]'); if (fi) fi.addEventListener("change", async () => { const file = fi.files[0]; if (!file) return; const msg = body.querySelector(".kn-fmsg"); msg.textContent = "Reading " + file.name + "…"; try { const t = await readFile(file); body.querySelector('textarea[name="doc"]').value = t; await save({ doc: t, docName: file.name }); msg.textContent = `Read: ${Math.round(t.length / 1000)} thousand characters, kept word for word.`; } catch (x) { msg.textContent = x.message; } fi.value = ""; });
    },
    init(store) {
      S = store;
      document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-know]"); if (!b || b.dataset.know === "file") return; const a = b.dataset.know;
        if (a === "go") { e.preventDefault(); go(b.dataset.go); } else if (a === "read") readIn(); else if (a === "make") makeTicked(b.closest(".know")); else if (a === "drop") { UI.props = null; api.render(); } });
      if (S.watch) S.watch("context", () => { document.dispatchEvent(new CustomEvent("atlas-context")); if (api.tab() === "know") api.render(); });
    }
  });
  // a question about the campaign: what is known, what is missing, and what would only be a suggestion
  async function ask(q) {
    const R = readiness(), ce = certain(), H = R.H;
    const facts = `People: ${H.cast.map(([, c]) => c.n).join(", ") || "none"}. Places: ${H.places.map(id => A.meta[id].name).join(", ") || "none"}. Clues: ${H.clues.length}. Story elements: ${H.items.map(i => i.kind + " \"" + i.n + "\"").join(", ") || "none"}. Factions: ${H.facs.map(([, f]) => f.n || f.name).join(", ") || "none"}. Events planned: ${H.evs.length}.`;
    const gaps = R.list.map(r => `${r.name}: ${r.status}${r.req.concat(r.rec).filter(x => !x[0]).map(x => "; lacks " + x[1]).join("")}`).join("\n"), seen = ce.map(([h, L]) => h + ": " + L.join(", ")).join("\n");
    const pass = api.lookup ? (api.lookup(q, 10) || []).map(p => `[${p.src}] ${p.text}`).join("\n") : "";
    const prompt = `You are Atlas, helping the game master of the tabletop campaign "${(A.config || {}).title || ""}". Answer their question about the campaign from what it holds. Keep three things apart and label them: what the campaign ESTABLISHES (quote or name it), what is MISSING or unspecified, and any SUGGESTION of yours (clearly marked as only a suggestion). Never present a suggestion as a fact; never contradict what is established. Short and plain.
WHAT IT HOLDS: ${facts}
WHAT EACH PART OF ATLAS LACKS:
${gaps}
WHAT CAN BE SEEN FOR CERTAIN:
${seen}
PASSAGES OF THE CAMPAIGN:
${pass}
THE QUESTION: ${q}`;
    try { const t = await api.askRaw(prompt, null, null, { kind: "answering", what: "what Atlas knows", uses: ["the campaign"] }); return t ? String(t).trim() : "Claude could not answer just now."; } catch (e) { return "Claude could not answer just now."; }
  }
  A.knowledge = { readiness, certain, holds, open: sec => go("context" + (sec ? ":" + sec : "")), ctx, SECTIONS };
})(typeof ATLAS !== "undefined" ? ATLAS : {});
