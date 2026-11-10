/* Recorded sessions, and what the table remembers (the user's request of 3 Nov 2026, in the app's
   docs/requests/2026-11-03-session-memory.md; the design in docs/research/2026-11-03-session-memory.md). The game master
   records a session, here (a laptop, or this page on a phone) or on a phone of its own through the Atlas app's recorder
   link (app/lib/recorder-lan.js), or adds a recording or its words made anywhere. The sound is kept in pieces as it is
   recorded, so an interruption loses seconds, not the evening: here in this browser (IndexedDB), from the phone on the
   computer running Atlas. The words come live from the browser's own speech recognition, or from a transcript made by
   any tool (Whisper, a phone's recorder app, a service), read in with its times and speakers; the game master names the
   speakers and corrects the words, the words as first written kept beside every correction.
   Then Claude, as the table's note-taker, reads the words a part at a time and writes down what the campaign should
   remember: what the party did and decided, conversations, promises and threats, clues, places, things, fates, bonds,
   the players' theories, open questions, changes in the world, what should come back later; each with when it was said
   (the session and the time in the recording), a quote, and what kind of truth it is (it happened, the game master said
   so, someone claimed it, a player's idea, Claude's own reading). Nothing counts until the game master keeps it: kept,
   kept but unsure, changed, or not so. What is kept is the campaign's memory (collection "memory"): the copilot draws on
   the part of it that bears on each question (A.memory.recall: words and names, never the whole of it), the world's
   history shows it, the consistency check compares it with the world, and unfinished business can be handed to the
   consequences. Nothing here reaches the players' copy or their phones. A tab of At the table. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T || typeof document === "undefined") return;
  const api = TU.api, esc = A.esc, St = A.story;
  const S = () => api.store();
  const W = () => A.worldTime;
  const cfg = () => A.config || {};
  const placeName = id => (A.meta[id] || {}).name || id;
  const facName = id => ((A.factionsData || {})[id] || {}).n || id;
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hms = s => { s = Math.max(0, Math.round(+s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
  const r1 = v => Math.round(v * 10) / 10;
  const UI = { rec: "", sub: "words", q: "", busy: "", stop: false, prog: null, err: "", edit: "", consent: false, live: true, sound: true, lang: "", focus: null, filter: "", from: 0, lost: [], link: null, tq: "" };

  /* ---- what is remembered: its kinds, and what kind of truth each note is */
  const KINDS = [["did", "What the party did"], ["decision", "A decision"], ["talk", "A conversation"], ["promise", "A promise or agreement"], ["threat", "A threat"], ["clue", "A clue found"], ["visit", "A place reached"], ["item", "A thing gained, lost or used"], ["fate", "Someone's fate"], ["bond", "A bond or a rivalry"], ["theory", "The players' theory"], ["mystery", "An open question"], ["change", "The world changed"], ["later", "To come back later"]];
  const SRC = [["canon", "It happened"], ["narration", "The game master said so"], ["claim", "Someone claimed it"], ["player", "A player's idea"], ["ai", "Claude's reading"]];
  const STATES = [["proposed", "Waiting for you"], ["kept", "Kept"], ["unsure", "Kept, unsure"], ["no", "Not so"]];
  const word = (L, k) => (L.find(x => x[0] === k) || [0, k])[1];
  const FATES = ["", "dead", "hurt", "missing", "arrested", "hiding", "gone"];

  /* ---- the store: recordings, their words, the memory */
  const recs = () => Object.entries((S() && S().get("recs")) || {}).filter(([, r]) => r && r.started).sort((a, b) => b[1].started - a[1].started);
  const recOf = id => (S() && S().get("recs", id)) || null;
  const putRec = (id, r) => S().set("recs", id, Object.assign({}, r, { t: Date.now() }));
  const opts = () => (S() && S().get("recs", "opts")) || {};
  const mems = () => Object.entries((S() && S().get("memory")) || {}).filter(([, m]) => m && m.text);
  const memOf = id => (S() && S().get("memory", id)) || null;
  // the words of a recording, kept three hundred lines to a document: [time, length, speaker, words, the words as first written]
  const PART = 300;
  const segsOf = rec => Object.values((S() && S().get("transcript")) || {}).filter(d => d && d.rec === rec).sort((a, b) => a.k - b.k).flatMap(d => d.segs || []);
  function saveSegs(rec, segs, only) {
    for (let k = 0; k * PART < segs.length; k++) if (!only || only.has(k)) S().set("transcript", rec + "_" + k, { rec, k, segs: segs.slice(k * PART, (k + 1) * PART) });
    for (const [id, d] of Object.entries(S().get("transcript") || {})) if (d && d.rec === rec && d.k * PART >= Math.max(1, segs.length)) S().set("transcript", id, null);
  }
  const sessionsKnown = () => { const n = new Set((A.sessionsData || []).map(s => +s.n).filter(Boolean)); for (const [, r] of recs()) if (r.session) n.add(+r.session); n.add(+api.session() || 1); return [...n].sort((a, b) => a - b); };
  const sessionTitle = n => { const s = (A.sessionsData || []).find(x => +x.n === +n); return `Session ${n}${s && s.title ? ": " + s.title : ""}`; };

  /* ---- who is who: the campaign's people, the party, and the people at the table */
  const pcs = () => A.pcsData || {};
  function refName(r) {
    const s = String(r || "");
    if (s.startsWith("cast:")) return ((A.castData || {})[s.slice(5)] || {}).n || s.slice(5);
    if (s.startsWith("pc:")) return (pcs()[s.slice(3)] || {}).n || s.slice(3);
    if (s.startsWith("?")) return s.slice(1);
    return St && St.name ? St.name(s) : s;
  }
  // a name or an id as Claude wrote it, as one of the campaign's people when it is surely one
  function refOf(x) {
    const s = String(x || "").trim(); if (!s) return null;
    const C = A.castData || {}, P = pcs(), low = s.toLowerCase();
    if (s.startsWith("cast:") && C[s.slice(5)]) return s; if (C[s]) return "cast:" + s;
    if (s.startsWith("pc:") && P[s.slice(3)]) return s; if (P[s]) return "pc:" + s;
    for (const [id, c] of Object.entries(C)) if (String(c.n || "").toLowerCase() === low) return "cast:" + id;
    for (const [id, c] of Object.entries(P)) if (String(c.n || "").toLowerCase() === low) return "pc:" + id;
    return "?" + s.slice(0, 60);
  }
  // the names said at a table that point to someone or somewhere: a cast member's whole name and the parts of it long
  // enough to be theirs alone, a place's name, a faction's name
  let NAMES = null;
  function names() {
    if (NAMES) return NAMES;
    const out = [], common = new Set(["doctor", "nurse", "captain", "mister", "madam", "father", "mother", "sister", "brother", "lord", "lady", "the"]);
    const add = (n, ref) => { const s = String(n || "").toLowerCase().trim(); if (s.length > 3 && !common.has(s)) out.push([s, ref]); };
    for (const [id, c] of Object.entries(A.castData || {})) { add(c.n, "cast:" + id); for (const w of String(c.n || "").split(/[\s.,'"]+/)) if (w.length > 4) add(w, "cast:" + id); }
    for (const id of A.order) if (A.meta[id] && !String(id).startsWith("fly-")) add(placeName(id), "place:" + id);
    for (const [id, f] of Object.entries(A.factionsData || {})) add(f.n, "faction:" + id);
    const seen = {}; for (const [n] of out) seen[n] = (seen[n] || 0) + 1;
    return (NAMES = out.filter(([n]) => seen[n] === 1 || out.filter(x => x[0] === n).every(x => x[1] === out.find(y => y[0] === n)[1])));
  }
  const entName = r => r.startsWith("place:") ? placeName(r.slice(6)) : r.startsWith("faction:") ? facName(r.slice(8)) : refName(r);
  const entitiesIn = q => { const s = " " + String(q || "").toLowerCase() + " "; return [...new Set(names().filter(([n]) => s.includes(n)).map(x => x[1]))]; };
  const speakerOf = (rec, label) => ((recOf(rec) || {}).speakers || {})[label] || null;
  function speakerName(rec, label) {
    const sp = speakerOf(rec, label); if (!sp) return label ? label : "Someone";
    if (sp.who === "gm") return sp.name ? `${sp.name} (game master)` : "The game master";
    if (sp.who && sp.who.startsWith("pc:")) { const pc = pcs()[sp.who.slice(3)] || {}; return `${sp.name || pc.player || "A player"} (as ${pc.n || "their character"})`; }
    if (sp.who === "player") return `${sp.name || "A player"} (a player)`;
    return sp.name || label || "Someone";
  }

  /* ---- the sound, kept in this browser as it is recorded (pieces of ten seconds) */
  const MIMES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  let dbp = null;
  function idb() {
    if (!dbp) dbp = new Promise((ok, no) => { if (!window.indexedDB) return no(new Error("no IndexedDB")); const r = indexedDB.open("atlas-audio-" + (cfg().storageKey || "atlas"), 1); r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("recs", { keyPath: "id" }); d.createObjectStore("chunks", { keyPath: ["rec", "part", "seq"] }); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    return dbp;
  }
  const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const idbPut = async (st, v) => req((await idb()).transaction(st, "readwrite").objectStore(st).put(v));
  const idbAll = async st => req((await idb()).transaction(st).objectStore(st).getAll());
  const range = rec => IDBKeyRange.bound([rec, 0, 0], [rec, 1e9, 1e12]);
  const chunksOf = async rec => req((await idb()).transaction("chunks").objectStore("chunks").getAll(range(rec)));
  async function dropHere(rec) { const d = await idb(), t = d.transaction(["chunks", "recs"], "readwrite"); t.objectStore("chunks").delete(range(rec)); t.objectStore("recs").delete(rec); return new Promise(ok => { t.oncomplete = ok; t.onerror = ok; }); }
  const urls = {};
  async function partURL(rec, n, m) {
    const k = rec + ":" + n; if (urls[k]) return urls[k];
    if (m.where === "app") return window.ATLAS_APP && window.ATLAS_APP.audioUrl ? window.ATLAS_APP.audioUrl(rec, n) : null;
    let ch = []; try { ch = (await chunksOf(rec)).filter(c => c.part === n).sort((a, b) => a.seq - b.seq); } catch (e) { return null; }
    if (!ch.length) return null;
    return (urls[k] = URL.createObjectURL(new Blob(ch.map(c => c.blob), { type: ((m.parts || []).find(p => p.n === n) || {}).mime || ch[0].blob.type || "audio/webm" })));
  }
  // (a recording made in a browser does not say how long it is: asking for its end makes it find out, so it can be wound)
  const ready = a => new Promise(ok => { const go = () => { if (a.duration === Infinity || isNaN(a.duration)) { a.currentTime = 1e101; a.ontimeupdate = () => { a.ontimeupdate = null; a.currentTime = 0; ok(); }; } else ok(); }; if (a.readyState >= 1) go(); else a.onloadedmetadata = () => { a.onloadedmetadata = null; go(); }; setTimeout(ok, 4000); });
  // the player stands apart from the tab, so the tab can be drawn again (new words, a note kept) while it plays
  function player() {
    let p = document.getElementById("smPlayer");
    if (!p) { p = document.createElement("div"); p.id = "smPlayer"; p.className = "sm-player keeper"; p.innerHTML = `<span class="sm-pl-t"></span><audio controls preload="none"></audio><button type="button" class="t-mini" data-sm="plclose" aria-label="Close the player">×</button>`; document.body.appendChild(p); }
    p.hidden = false; return p;
  }
  async function playAt(rec, t) {
    const m = recOf(rec); if (!m) return;
    if (m.where === "none" || m.audioGone) { api.note("The sound of this recording is not kept: its words are."); return; }
    const parts = (m.parts && m.parts.length ? m.parts : [{ n: 0, at: 0 }]), p = parts.filter(x => (x.at || 0) <= t + .01).pop() || parts[0];
    const src = await partURL(rec, p.n, m); if (!src) { api.note("The sound of this recording is not on this device: its words are."); return; }
    const pl = player(), a = pl.querySelector("audio"); pl.querySelector(".sm-pl-t").textContent = `S${m.session} ${hms(t)}`;
    if (a.dataset.src !== src) { a.src = src; a.dataset.src = src; await ready(a); }
    try { a.currentTime = Math.max(0, t - (p.at || 0) - 1.5); } catch (e) {}
    a.play().catch(() => {});
  }

  /* ---- recording here: start, pause, go on, stop; the microphone watched; the screen kept awake */
  let R = null;
  const CHUNK = 10000;
  const elapsed = () => !R ? 0 : R.acc + (R.running && !R.paused ? (performance.now() - R.t0) / 1000 : 0);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const why = () => !window.isSecureContext ? "This page is not a secure one (https, or this computer itself), and browsers give the microphone only to secure pages."
    : UI.sound && (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || !window.MediaRecorder) ? "This browser cannot keep the sound from a web page." : "";
  // (the words alone, without the sound, are a recording too: the user wants what was said written down, 3 Nov 2026)
  const canStart = () => !why() && (UI.sound || (UI.live && !!SR));
  async function start() {
    // (Recorded sessions at "The words": the words only, never the sound; atlas-modules.js)
    if (A.modules && !A.modules.on("recorded", "sound")) UI.sound = false;
    if (R || !canStart()) return;
    const n = +UI.sess || +api.session() || 1, id = uid("r");
    const meta = { session: n, started: Date.now(), state: "recording", dur: 0, parts: [], where: UI.sound ? "here" : "none", noSound: !UI.sound || undefined, device: device(), live: !!(UI.live && SR), lang: UI.lang || "", consent: { t: Date.now(), text: CONSENT }, wm: W() ? W().now() : null, speakers: {} };
    if (!meta.noSound) delete meta.noSound;
    R = { id, meta, acc: 0, part: -1, seq: 0, segs: [], dirty: new Set(), saved: 0, hints: [], heard: {}, running: false, paused: false, soundOff: !UI.sound };
    if (UI.sound) { try { await newPart(); } catch (e) { R = null; UI.err = e && e.name === "NotAllowedError" ? "The microphone was not allowed. Allow it for this page (the lock or camera sign beside the address) and start again." : "The microphone could not be started: " + (e && e.message || e); paint(); return; } }
    else { R.running = true; R.t0 = performance.now(); }
    putRec(id, meta); idbPut("recs", { id, state: "recording", session: n, started: meta.started, parts: meta.parts, dur: 0 }).catch(() => {});
    wake(); if (meta.live) words(true);
    R.timer = setInterval(tick, 1000); banner(); paint();
  }
  async function newPart() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    const mime = MIMES.find(m => MediaRecorder.isTypeSupported(m)) || "";
    const mr = new MediaRecorder(stream, Object.assign({ audioBitsPerSecond: 32000 }, mime ? { mimeType: mime } : {}));
    const at = elapsed();
    R.part++; R.seq = 0; R.stream = stream; R.mr = mr; R.lost = false;
    R.meta.parts = (R.meta.parts || []).concat({ n: R.part, at: r1(at), mime: mr.mimeType || mime });
    const part = R.part;
    mr.ondataavailable = e => { if (e.data && e.data.size && R) { const seq = R.seq++; idbPut("chunks", { rec: R.id, part, seq, blob: e.data, t: r1(elapsed()) }).catch(() => { UI.err = "This browser would not keep the sound: its storage may be full."; }); } };
    const tr = stream.getAudioTracks()[0]; if (tr) tr.onended = () => lost();
    meter(stream);
    mr.start(CHUNK); R.t0 = performance.now(); R.running = true;
  }
  // the microphone stopped (a phone locked its screen, a call came, it was unplugged): the time stops with it, and it is
  // taken up again as soon as the page is seen again
  function lost() { if (!R || !R.running || R.soundOff) return; R.acc = elapsed(); R.running = false; R.lost = true; R.meta.state = "lost"; save(true); tick(); }
  // (some phones cannot write the words and keep the sound at once: the words are kept, the sound so far kept, the rest let go)
  function wordsOnly() {
    if (!R || R.soundOff) return; R.soundOff = true;
    try { R.mr.stop(); } catch (e) {} try { R.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
    R.mr = null; R.stream = null; R.an = null; R.meta.noSound = true; R.wordsOff = "";
    if (!R.running) { R.lost = false; R.running = true; R.t0 = performance.now(); R.meta.state = R.paused ? "paused" : "recording"; }
    R.meta.live = true; words(true); save(true); paint();
  }
  async function again() { if (!R || !R.lost || R.soundOff) return; try { await newPart(); R.meta.state = R.paused ? "paused" : "recording"; save(true); tick(); } catch (e) { UI.err = "The microphone could not be started again: " + (e && e.message || e); paint(); } }
  function pause() { if (!R || R.paused) return; R.acc = elapsed(); R.paused = true; try { R.mr.pause(); } catch (e) {} R.meta.state = "paused"; words(false); save(true); paint(); }
  function resume() { if (!R || !R.paused) return; R.t0 = performance.now(); R.paused = false; try { R.mr.resume(); } catch (e) {} R.meta.state = "recording"; if (R.meta.live) words(true); save(true); paint(); }
  async function stop() {
    if (!R) return; const r = R;
    r.acc = elapsed(); r.running = false; words(false);
    await new Promise(ok => { try { if (r.mr.state === "inactive") return ok(); r.mr.onstop = () => ok(); r.mr.stop(); } catch (e) { ok(); } setTimeout(ok, 3000); });
    try { r.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
    clearInterval(r.timer); if (r.ctx) r.ctx.close().catch(() => {}); if (r.wl) r.wl.release().catch(() => {});
    r.meta.state = "stopped"; r.meta.dur = r1(r.acc); flush(true); save(true);
    idbPut("recs", { id: r.id, state: "stopped", session: r.meta.session, started: r.meta.started, parts: r.meta.parts, dur: r.meta.dur }).catch(() => {});
    R = null; banner(); UI.rec = r.id; UI.sub = segsOf(r.id).length ? "words" : "add"; paint();
    api.note(r.meta.noSound && !(r.meta.parts || []).length ? `Written down: ${segsOf(r.id).length} lines said in ${hms(r.meta.dur)} of ${sessionTitle(r.meta.session).toLowerCase()}.` : `Recorded: ${hms(r.meta.dur)} of ${sessionTitle(r.meta.session).toLowerCase()}, kept on this device.`);
  }
  function save(now) { if (!R) return; R.meta.dur = r1(elapsed()); if (now || Date.now() - (R.lastMeta || 0) > 30000) { R.lastMeta = Date.now(); putRec(R.id, R.meta); idbPut("recs", { id: R.id, state: R.meta.state, session: R.meta.session, started: R.meta.started, parts: R.meta.parts, dur: R.meta.dur }).catch(() => {}); } }
  async function wake() { try { if (R && navigator.wakeLock && document.visibilityState === "visible") R.wl = await navigator.wakeLock.request("screen"); } catch (e) {} }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && R) { wake(); if (R.lost && !R.paused) again(); } });
  window.addEventListener("beforeunload", e => { if (R) { save(true); flush(true); e.preventDefault(); e.returnValue = ""; } });
  function meter(stream) {
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; if (!R.ctx) R.ctx = new C(); const an = R.ctx.createAnalyser(); an.fftSize = 1024; R.ctx.createMediaStreamSource(stream).connect(an); R.an = an; R.buf = new Float32Array(an.fftSize); } catch (e) {}
  }
  const device = () => { const u = navigator.userAgent || ""; return /iPhone|iPad/.test(u) ? "an iPhone or iPad" : /Android/.test(u) ? "an Android phone" : /Mac OS X/.test(u) ? "a Mac" : /Windows/.test(u) ? "a Windows computer" : "this device"; };
  function tick() {
    if (!R) return;
    let lvl = 0; if (R.an && R.running && !R.paused) { R.an.getFloatTimeDomainData(R.buf); let s = 0; for (const v of R.buf) s += v * v; lvl = Math.sqrt(s / R.buf.length); }
    R.quiet = R.soundOff ? (R.running && !R.paused && Date.now() - (R.lastWords || R.meta.started) > 90000 ? 99 : 0) : lvl < .004 && R.running && !R.paused ? (R.quiet || 0) + 1 : 0;
    const mic = R.lost ? "The microphone stopped: the screen may have locked. It starts again when this page is open." : R.paused ? "Paused." : R.soundOff ? (R.quiet ? "No words heard for a while: is the browser still listening? Keep this page open." : "Listening, and writing down what is said.") : R.quiet > 25 ? "No sound for a while: is the microphone covered or muted?" : "Hearing the table.";
    const set = (sel, f) => document.querySelectorAll(sel).forEach(f);
    set(".sm-dur", e => { e.textContent = hms(elapsed()); }); set(".sm-lvl i", e => { e.style.width = Math.min(100, Math.round(lvl * 900)) + "%"; });
    set(".sm-mic", e => { e.textContent = mic; e.classList.toggle("bad", !!(R.lost || R.quiet > 25)); });
    save(false); flush(false);
  }
  // a banner on every page of the campaign while it records: what is happening, and stopping it at once
  function banner() {
    let b = document.getElementById("smBanner");
    if (!R) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "smBanner"; b.className = "sm-banner keeper"; b.setAttribute("role", "status"); document.body.appendChild(b); }
    b.innerHTML = `<span class="sm-dot${R.paused ? " paused" : ""}"></span><b>${R.paused ? "Paused" : "Recording"}</b> <span class="sm-dur">${hms(elapsed())}</span><button type="button" data-sm="${R.paused ? "resume" : "pause"}">${R.paused ? "Go on" : "Pause"}</button><button type="button" data-sm="stop">Stop</button><button type="button" data-sm="openrec">Open</button>`;
  }

  /* ---- the words, live, from the browser's speech recognition (as the table speaks; no one told apart) */
  function words(on) {
    if (!SR || !R) return;
    if (!on) { R.wantWords = false; try { R.sr && R.sr.stop(); } catch (e) {} return; }
    R.wantWords = true; if (R.sr) return;
    const sr = new SR(); sr.continuous = true; sr.interimResults = true; sr.lang = R.meta.lang || navigator.language || "en-US";
    if (opts().local && "processLocally" in sr) { try { sr.processLocally = true; } catch (e) {} }
    const st = {};
    sr.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]; if (st[i] == null) st[i] = elapsed();
        if (r.isFinal) { const x = String(r[0].transcript || "").trim(); if (x) addSeg([r1(st[i]), r1(Math.max(.5, elapsed() - st[i])), "", x]); delete st[i]; }
      }
    };
    // (no speech for a while ends a listening, and it starts again; without the internet it waits a few seconds first; a
    // device that cannot listen while it keeps the sound offers to keep the words instead)
    sr.onerror = e => {
      if (!R) return; R.wordErr = e.error; R.wordWait = Date.now() + (e.error === "network" ? 5000 : 0);
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") { R.wantWords = false; R.wordsOff = e.error === "audio-capture" ? (R.soundOff ? "The microphone is busy: the words cannot be written." : "This device cannot write the words while it keeps the sound.") : "The browser did not allow the live words."; paint(); }
      else if (e.error === "network") document.querySelectorAll(".sm-mic").forEach(x => { x.textContent = "The words need the internet: waiting for it."; });
    };
    sr.onend = () => { if (!R) return; R.sr = null; if (R.wantWords && !R.paused && R.running) setTimeout(() => R && R.wantWords && words(true), Math.max(300, (R.wordWait || 0) - Date.now())); };
    R.sr = sr; try { sr.start(); } catch (e) { R.sr = null; }
  }
  function addSeg(seg) {
    if (!R) return; if (!R.segs.length) R.segs = segsOf(R.id).slice();
    R.segs.push(seg); R.dirty.add(Math.floor((R.segs.length - 1) / PART)); R.lastWords = Date.now();
    hintsFor(R.id, seg);
    document.querySelectorAll(".sm-last").forEach(e => { e.innerHTML = R.segs.slice(-3).map(s => `<p><span class="kn">${hms(s[0])}</span> ${esc(s[3])}</p>`).join(""); });
  }
  function flush(now) { if (!R || !R.dirty.size || (!now && Date.now() - R.saved < 20000)) return; R.saved = Date.now(); saveSegs(R.id, R.segs, R.dirty); R.dirty = new Set(); }

  /* ---- while the table plays: what is remembered of whoever and wherever is named (the game master's eyes only; no
     call to Claude, nothing interrupts) */
  const HINTS = [];
  function hintsFor(rec, seg) {
    // (reminders unasked only with the copilot at "Also unasked"; atlas-modules.js)
    if (A.modules && !A.modules.on("copilot", "unasked")) return;
    if (!memList().length) return;
    const t = seg[0], heard = (hintsFor.heard = hintsFor.heard || {});
    for (const ref of entitiesIn(seg[3])) {
      if (heard[ref] != null && t - heard[ref] < 600) continue; heard[ref] = t;
      const about = recall(entName(ref), { k: 3, ref }).filter(m => m.rec !== rec || m.t < t - 60);
      const open = about.filter(m => m.open);
      if (!about.length) continue;
      HINTS.unshift({ at: t, name: entName(ref), lines: (open.length ? open : about).slice(0, 2) });
      HINTS.length = Math.min(HINTS.length, 6);
    }
    document.querySelectorAll(".sm-hints").forEach(e => { e.innerHTML = hintsHTML(); });
  }
  const hintsHTML = () => HINTS.length ? HINTS.map(h => `<div class="sm-hint"><b>${esc(h.name)}</b> <span class="kn">named at ${hms(h.at)}</span>${h.lines.map(m => `<p>${m.open ? `<span class="sm-open">unfinished</span> ` : ""}${esc(m.text)} <button type="button" class="t-link" data-sm="show" data-id="${esc(m.id)}">${esc(cite(m))}</button></p>`).join("")}</div>`).join("") : `<p class="kn">When someone or somewhere the table remembers is named, what was remembered of them shows here.</p>`;

  /* ---- a recording, or its words, from anywhere */
  async function addAudio(file, n) {
    const id = uid("r"), mime = file.type || "audio/mpeg";
    const dur = await new Promise(ok => { const a = new Audio(), u = URL.createObjectURL(file); a.preload = "metadata"; a.onloadedmetadata = () => { const d = a.duration; URL.revokeObjectURL(u); ok(isFinite(d) ? d : 0); }; a.onerror = () => ok(0); a.src = u; setTimeout(() => ok(0), 8000); });
    try { await idbPut("chunks", { rec: id, part: 0, seq: 0, blob: file, t: dur }); await idbPut("recs", { id, state: "stopped", session: n, started: file.lastModified || Date.now(), parts: [{ n: 0, at: 0, mime }], dur }); }
    catch (e) { api.note("This browser would not keep the recording: its storage may be full."); return; }
    putRec(id, { session: n, started: file.lastModified || Date.now(), state: "stopped", dur: r1(dur), parts: [{ n: 0, at: 0, mime }], where: "here", device: device(), name: file.name.slice(0, 120), uploaded: true, speakers: {} });
    UI.rec = id; UI.sub = "add"; paint();
  }
  // a transcript, in whatever shape it comes: JSON from Whisper, WhisperX, OpenAI, Deepgram or AssemblyAI; SRT or VTT
  // subtitles; or text, a line a turn ("[01:02:03] Name: words", "Name: words", "Name 12:03" over its words)
  const tsec = s => { const p = String(s).split(":").map(Number); return p.reduce((a, v) => a * 60 + v, 0); };
  function parseWords(src) {
    const t = String(src || "").replace(/^﻿/, ""), segs = [];
    const add = (st, en, sp, x) => { x = String(x || "").replace(/\s+/g, " ").trim(); if (x) segs.push([r1(+st || 0), r1(Math.max(0, (+en || +st || 0) - (+st || 0))), String(sp == null ? "" : sp).trim().slice(0, 40), x.slice(0, 2000)]); };
    if (/^\s*[[{]/.test(t)) {
      try {
        const j = JSON.parse(t), dg = j.results && j.results.channels && (((j.results.channels[0] || {}).alternatives || [])[0] || {});
        const spk = v => v == null || v === "" ? "" : typeof v === "number" ? "Speaker " + (v + 1) : /^[A-Z]$/.test(v) ? "Speaker " + v : String(v);
        if (dg && dg.paragraphs && dg.paragraphs.paragraphs) { for (const p of dg.paragraphs.paragraphs) add(p.start != null ? p.start : (p.sentences || [{}])[0].start, p.end, spk(p.speaker), (p.sentences || []).map(s => s.text).join(" ")); return segs; }
        const arr = Array.isArray(j) ? j : j.segments || j.utterances || (j.results && j.results.utterances) || j.transcription || [];
        const ms = arr.length && arr.some(x => +x.start > 50000) && arr.every(x => Number.isInteger(+x.start));
        for (const x of arr) { const k = ms ? .001 : 1; add((x.start != null ? +x.start : x.start_time != null ? +x.start_time : 0) * k, (x.end != null ? +x.end : +x.end_time || 0) * k, spk(x.speaker != null ? x.speaker : x.speaker_label), x.text != null ? x.text : x.transcript); }
        if (segs.length) return segs;
      } catch (e) {}
    }
    if (/-->/.test(t)) {
      for (const b of t.split(/\r?\n\s*\r?\n/)) {
        const m = /((?:\d{1,2}:)?\d{1,2}:\d{2})[.,](\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2})[.,](\d{1,3})/.exec(b); if (!m) continue;
        let body = b.slice(b.indexOf(m[0]) + m[0].length).trim(), sp = "";
        const v = /<v(?:\.[\w.]+)?\s+([^>]+)>/.exec(body); if (v) sp = v[1];
        body = body.replace(/<[^>]+>/g, "");
        const c = /^([^\s:][^:]{0,30}):\s+/.exec(body); if (!sp && c) { sp = c[1]; body = body.slice(c[0].length); }
        add(tsec(m[1]) + +("0." + m[2]), tsec(m[3]) + +("0." + m[4]), sp, body);
      }
      return segs;
    }
    let at = 0, who = "";
    for (const raw of t.split(/\r?\n/)) {
      const line = raw.trim(); if (!line) continue;
      let m = /^\[?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:[.,]\d+)?\]?\s*[-–]?\s*(?:([^:\d][^:]{0,38}):\s*)?(.*)$/.exec(line);
      if (m) { at = tsec(m[1]); if (m[2]) who = m[2]; if (m[3]) add(at, at, m[2] || who, m[3]); continue; }
      m = /^(.{1,40}?)\s+\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*:?\s*$/.exec(line); if (m) { who = m[1]; at = tsec(m[2]); continue; }
      m = /^([^:]{1,40}):\s+(.+)$/.exec(line); if (m && !/https?$/.test(m[1])) { who = m[1]; add(at, at, who, m[2]); continue; }
      add(at, at, who, line);
    }
    return segs;
  }
  function addWords(text, rec, n) {
    const segs = parseWords(text); if (!segs.length) { api.note("No words could be read from that file."); return; }
    let id = rec;
    if (!id) { id = uid("r"); putRec(id, { session: n, started: Date.now(), state: "stopped", dur: segs[segs.length - 1][0] + segs[segs.length - 1][1], parts: [], where: "none", device: "", speakers: {}, wordsOnly: true }); }
    // (who spoke, as the file names them: the people already at this table are matched by name)
    const m = recOf(id), sp = Object.assign({}, m.speakers || {}), table = opts().table || [];
    for (const lab of new Set(segs.map(s => s[2]).filter(Boolean))) if (!sp[lab]) { const known = table.find(p => p.name.toLowerCase() === lab.toLowerCase()); if (known) sp[lab] = { who: known.who, name: known.name }; }
    putRec(id, Object.assign({}, m, { speakers: sp, words: "file" }));
    saveSegs(id, segs); UI.rec = id; UI.sub = "words"; paint();
    api.note(`${segs.length} lines of words read in.`);
  }

  /* ---- what the table should remember: Claude reads the words a part at a time */
  const STOP = new Set("the a an and or of to in on at for with from by is was were be been it its this that these those what who whom which when where why how did do does have has had they them their there here we our you your i me my he she his her him not no yes as about into than then so if but just like got get gonna okay ok yeah oh um uh".split(" "));
  // (a word's ending taken off, so "insulted" finds "insult" and "promises" finds "promised")
  const stem = w => w.length > 4 ? w.replace(/(ings|ing|edly|ed|es|s|e)$/, "") : w;
  const toks = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)).map(stem);
  const lineOf = (rec, s) => `[${hms(s[0])}] ${speakerName(rec, s[2])}: ${s[3]}`;
  function parts(rec, segs) {
    const out = []; let cur = [], len = 0;
    for (const s of segs) { const l = lineOf(rec, s); if (len + l.length > 24000 && cur.length) { out.push(cur); cur = []; len = 0; } cur.push(s); len += l.length + 1; }
    if (cur.length) out.push(cur); return out;
  }
  function campaignBrief() {
    const C = A.castData || {}, clues = [];
    for (const pl of A.order) if (A.maps[pl]) for (const [cid, k] of Object.entries((A.get(pl, 99) || {}).clues || {})) clues.push(`${pl}/${cid}: ${k.t || cid}`);
    return `PEOPLE OF THE CAMPAIGN (id: name, role):\n${Object.entries(C).slice(0, 60).map(([id, c]) => `${id}: ${c.n}${c.role ? ", " + String(c.role).slice(0, 60) : ""}`).join("\n") || "(none)"}
THE PARTY'S CHARACTERS (id: name, played by):\n${Object.entries(pcs()).map(([id, p]) => `${id}: ${p.n}${p.player ? ", played by " + p.player : ""}`).join("\n") || "(not written)"}
PLACES (id: name):\n${A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-")).map(id => `${id}: ${placeName(id)}`).join("\n")}
FACTIONS (id: name):\n${Object.entries(A.factionsData || {}).map(([id, f]) => `${id}: ${f.n || id}`).join("\n") || "(none)"}
CLUES (place/id: title):\n${clues.slice(0, 120).join("\n") || "(none)"}`;
  }
  function notePrompt(rec, seg, i, n, before) {
    const m = recOf(rec), c = cfg(), text = seg.map(s => lineOf(rec, s)).join("\n");
    const known = recall(text.slice(0, 6000), { k: 14 }).map(x => `- [${cite(x)}] ${x.text}`).join("\n");
    const table = Object.entries(m.speakers || {}).map(([lab, sp]) => `${lab}: ${speakerName(rec, lab)}`).join("\n");
    return `You are the note-taker of the tabletop roleplaying campaign "${c.title || ""}"${c.system ? " (" + c.system + ")" : ""}${c.setting ? ", set in " + c.setting : ""}. Below is part ${i + 1} of ${n} of what was said at the table in ${sessionTitle(m.session).toLowerCase()}: the time into its recording, who spoke, and their words${(m.speakers && Object.keys(m.speakers).length) ? "" : " (who spoke was not recorded: tell the game master from the players by what is said)"}. Write down what the campaign should remember.

Rules.
- Only what is in this part. Never invent; never fill a gap with what probably happened.
- Each note gives the time (seconds into the recording) where it was said, and a few words quoted from the transcript.
- Say what kind of truth it is: "canon" (it happened in the game: the game master narrated it as fact, or the players' characters did it), "narration" (the game master describing the world), "claim" (something one of the game master's characters said: it may be a lie or a mistake), "player" (a player's guess, theory, suspicion or plan, not established), "ai" (your own reading, said by no one). When unsure, give a lower confidence.
- Rules talk, dice, jokes, food and real life are not memory: leave them out.
- Use the ids below when you are sure who or what is meant; otherwise write the name as said.
- Promises, threats, agreements, debts, insults, open questions and anything that could come back later are "open": say what could come of it.

KINDS: did (what the party did), decision (a choice that matters), talk (a conversation with one of the game master's characters: what was asked, said, learned), promise (a promise or agreement, with whom, what), threat (made or received), clue (a clue found: its id if it is one of the campaign's), visit (a place reached or left), item (a thing gained, lost, given or used), fate (someone killed, rescued, hurt, captured, betrayed, freed), bond (a friendship, debt, grudge or rivalry), theory (the players' theory or suspicion), mystery (a question left open), change (the world changed), later (a consequence waiting to happen).

${campaignBrief()}

${table ? "WHO IS WHO AT THE TABLE:\n" + table + "\n\n" : ""}${known ? "ALREADY REMEMBERED FROM BEFORE (for continuity: write a note again only if something new happened):\n" + known + "\n\n" : ""}${before ? "WHAT HAPPENED JUST BEFORE THIS PART: " + before + "\n\n" : ""}THE TRANSCRIPT (part ${i + 1} of ${n}):
${text}

Answer with only JSON: {"summary": "what happened in this part, three to six sentences, past tense", "notes": [{"kind": "", "text": "one plain sentence, past tense", "t": seconds, "quote": "a few words from the transcript", "src": "canon|narration|claim|player|ai", "conf": 0.0 to 1.0, "who": [ids or names], "places": [place ids], "factions": [faction ids], "clue": "place/id or empty", "fate": {"who": "id", "now": "dead|hurt|missing|arrested|hiding|gone"} or null, "learns": {"who": "id", "what": "what they learned"} or null, "open": true or false, "next": "what could come of it later, or empty"}]}`;
  }
  const json = r => { const s = String(r || ""), a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
  const clueOk = c => { const [pl, cid] = String(c || "").split("/"); return !!(pl && cid && A.maps[pl] && ((A.get(pl, 99) || {}).clues || {})[cid]); };
  function cleanNote(x, rec, seg) {
    if (!x || typeof x !== "object" || !KINDS.some(k => k[0] === x.kind) || !String(x.text || "").trim()) return null;
    const m = recOf(rec), t0 = seg[0][0], t1 = seg[seg.length - 1][0] + seg[seg.length - 1][1];
    const n = { rec, session: m.session, t: r1(Math.min(t1, Math.max(t0, +x.t || t0))), kind: x.kind, text: String(x.text).trim().slice(0, 400), quote: String(x.quote || "").trim().slice(0, 240), src: SRC.some(s => s[0] === x.src) ? x.src : "ai", conf: Math.max(0, Math.min(1, +x.conf || .6)), state: "proposed", by: "claude", t0: Date.now() };
    n.who = [...new Set([].concat(x.who || []).map(refOf).filter(Boolean))].slice(0, 8);
    n.places = [].concat(x.places || []).filter(p => A.meta[p]).slice(0, 6); n.factions = [].concat(x.factions || []).filter(f => (A.factionsData || {})[f]).slice(0, 6);
    if (x.clue && clueOk(x.clue)) n.clue = x.clue;
    if (x.fate && typeof x.fate === "object") { const w = refOf(x.fate.who); if (w && w.startsWith("cast:") && FATES.includes(x.fate.now)) n.fate = { who: w, now: x.fate.now }; }
    if (x.learns && typeof x.learns === "object" && String(x.learns.what || "").trim()) { const w = refOf(x.learns.who); if (w && w.startsWith("cast:")) n.learns = { who: w, what: String(x.learns.what).trim().slice(0, 300) }; }
    n.open = !!x.open || ["promise", "threat", "mystery", "later"].includes(n.kind);
    if (String(x.next || "").trim()) n.next = String(x.next).trim().slice(0, 300);
    // (said twice, in the overlap or again by Claude: kept once)
    const w = new Set(toks(n.text));
    for (const [, o] of mems()) if (o.rec === rec && o.kind === n.kind) { const v = toks(o.text), same = v.filter(x => w.has(x)).length; if (same / Math.max(1, Math.min(w.size, v.length)) > .7) return null; }
    return n;
  }
  async function remember(rec) {
    const segs = segsOf(rec); if (!segs.length || UI.busy) return;
    const P = parts(rec, segs), sums = [];
    UI.busy = rec; UI.stop = false; UI.err = ""; UI.prog = [0, P.length]; paint();
    for (let i = 0; i < P.length && !UI.stop; i++) {
      let r = null; try { r = await api.askRaw(notePrompt(rec, P[i], i, P.length, sums[sums.length - 1] || ""), () => {}, null, { kind: "reading", what: `session ${recOf(rec).session}'s words, part ${i + 1} of ${P.length}`, uses: ["what was said", "what is already remembered"] }); } catch (e) { r = null; }
      if (!r) { UI.err = "Claude is not reachable from this page. Write what to remember yourself (+ A note of your own), or try again where Claude is."; break; }
      const j = json(r); if (!j) { UI.err = `Part ${i + 1}: Claude's answer could not be read. Look again to try it once more.`; continue; }
      if (j.summary) sums.push(String(j.summary).slice(0, 1500));
      for (const n of [].concat(j.notes || []).map(x => cleanNote(x, rec, P[i])).filter(Boolean)) S().set("memory", uid("m"), n);
      UI.prog = [i + 1, P.length]; paint();
    }
    if (sums.length) {
      const n = recOf(rec).session, cur = S().get("sessmem", "s" + n) || {};
      let sum = sums.join(" ");
      if (sums.length > 1) { try { const r = await api.askRaw(`Join these notes on the parts of one session of the tabletop roleplaying campaign "${cfg().title || ""}" into one summary of the session for the game master: what the party did and decided, who they met, what they found, what changed, what was left open. Past tense, two short paragraphs, nothing added.\n\n${sums.map((s, i) => `PART ${i + 1}: ${s}`).join("\n")}`, () => {}); if (r && r.trim()) sum = r.trim().slice(0, 4000); } catch (e) {} }
      if (cur.state !== "kept") S().set("sessmem", "s" + n, { n, summary: sum, parts: sums, state: "proposed", by: "claude", t: Date.now() });
    }
    UI.busy = ""; UI.prog = null; UI.sub = "notes"; paint();
    api.note("Read. What to remember waits for you: keep it, change it, or say it is not so.");
  }

  /* ---- what is kept: the campaign's memory, and what the game master does with it */
  const memList = () => mems().filter(([, m]) => m.state === "kept" || m.state === "unsure");
  const cite = m => `S${m.session} ${hms(m.t)}`;
  // the remembered notes that bear on a question: by its words (the rarer the more), by who and where it names, by what
  // kind of thing it asks after; kept notes only, unless asked for the unsure too
  function recall(q, o) {
    o = o || {};
    const list = mems().filter(([, m]) => m.state === "kept" || (o.unsure && m.state === "unsure") || (o.all && m.state !== "no"));
    if (!list.length) return [];
    const qt = toks(q), ents = o.ref ? [o.ref] : entitiesIn(q), low = String(q || "").toLowerCase(), want = new Set();
    for (const [re, ks] of [[/promis|swore|oath|vow|agree|deal|owe/, ["promise"]], [/insult|offend|anger|rude|mock|humiliat/, ["did", "bond", "threat"]], [/clue|evidence|found|discover/, ["clue"]], [/\bmet\b|meet|talk|spoke|said/, ["talk", "visit"]], [/visit|went|last time|been to/, ["visit", "did"]], [/die|dead|kill|rescue|betray|captur/, ["fate"]], [/theor|suspect|think|believe|guess/, ["theory"]], [/threat|warn/, ["threat"]], [/item|gave|took|stole|bought|carry/, ["item"]], [/unfinish|haunt|loose end|forgot|never return|owe|open/, ["open"]]]) if (re.test(low)) ks.forEach(k => want.add(k));
    const docs = list.map(([id, m]) => ({ id, m, w: toks([m.text, m.quote, m.next, ...(m.who || []).map(refName), ...(m.places || []).map(placeName), ...(m.factions || []).map(facName)].join(" ")) }));
    const df = {}; for (const d of docs) for (const w of new Set(d.w)) df[w] = (df[w] || 0) + 1;
    const N = docs.length;
    for (const d of docs) {
      let s = 0; const set = new Set(d.w);
      for (const w of qt) if (set.has(w)) s += Math.log(1 + N / df[w]); else if (w.length > 4 && d.w.some(x => x.startsWith(w.slice(0, -1)))) s += .5;
      // (the one who acted, named first, counts more than the others it touched)
      for (const r of ents) { const [k, id] = r.includes(":") ? [r.slice(0, r.indexOf(":")), r.slice(r.indexOf(":") + 1)] : ["", r], wi = (d.m.who || []).indexOf(r); if ((k === "place" && (d.m.places || []).includes(id)) || (k === "faction" && (d.m.factions || []).includes(id))) s += 3; else if (wi === 0) s += 4; else if (wi > 0) s += 2; }
      if (want.has(d.m.kind)) s += 2; if (want.has("open") && d.m.open) s += 2.5;
      if (d.m.state === "unsure") s *= .7;
      d.s = s;
    }
    return docs.filter(d => d.s > .4).sort((a, b) => b.s - a.s || (b.m.session - a.m.session)).slice(0, o.k || 10).map(d => Object.assign({ id: d.id }, d.m));
  }
  // for a prompt: the remembered notes that bear on it, each with where it was said and what kind of truth it is
  const SRCWORD = { canon: "it happened", narration: "the game master said so", claim: "a claim, maybe false", player: "a player's idea, not fact", ai: "an inference" };
  function forPrompt(q, k, o) {
    const l = recall(q, Object.assign({ k: k || 8, unsure: true }, o || {})); if (!l.length) return "";
    return `WHAT THE TABLE REMEMBERS (from recorded sessions; [S3 41:10] is session 3, 41 minutes 10 seconds into its recording):\n` + l.map(m => `- [${cite(m)}] (${SRCWORD[m.src] || m.src}${m.state === "unsure" ? ", uncertain" : ""}${m.open ? ", unfinished" : ""}) ${m.text}${m.next ? " Could lead to: " + m.next : ""}`).join("\n");
  }
  // the words around where a question's names and words were said, for the copilot to quote
  function snippets(q, n) {
    const qt = toks(q), ents = entitiesIn(q).map(r => entName(r).toLowerCase()), out = [];
    if (!qt.length && !ents.length) return [];
    for (const [rid, r] of recs()) {
      const segs = segsOf(rid);
      for (let i = 0; i < segs.length; i++) {
        const x = segs[i][3].toLowerCase(); let s = 0; for (const w of qt) if (x.includes(w)) s++; for (const e of ents) if (x.includes(e)) s += 2;
        if (s >= 2) out.push({ s, text: segs.slice(Math.max(0, i - 1), i + 2).map(z => `[S${r.session} ${hms(z[0])}] ${speakerName(rid, z[2])}: ${z[3]}`).join("\n") });
      }
    }
    return out.sort((a, b) => b.s - a.s).slice(0, n || 6).map(x => x.text);
  }
  const unfinished = () => memList().filter(([, m]) => m.open).sort((a, b) => (a[1].session - b[1].session) || (a[1].t - b[1].t));
  function keep(id, state) {
    const m = memOf(id); if (!m) return;
    const nm = Object.assign({}, m, { state, t1: Date.now() }); S().set("memory", id, nm);
    // (kept, it is part of the world's history, with the moment it was said; not kept, it is not)
    if (A.history) {
      if (state === "kept" || state === "unsure") A.history.add({ id: "s_" + id, kind: "session", m: (recOf(m.rec) || {}).wm != null ? recOf(m.rec).wm : W() ? W().now() : null, t: m.t0, title: m.text.slice(0, 140), what: m.quote ? "“" + m.quote + "”" : "", cause: `${word(KINDS, m.kind)}, ${cite(m)}${state === "unsure" ? ", uncertain" : ""}`, who: (m.who || []).filter(r => r.startsWith("cast:")).map(r => r.slice(5)), places: m.places, factions: m.factions, vis: m.src === "ai" ? "gm" : "players", from: "rec", mem: id });
      else A.history.remove("s_" + id);
    }
  }
  // what comes of it: handed to the consequences, with when it was said and how long it has waited
  function toDeed(id) {
    const m = memOf(id); if (!m || !A.deeds || !A.deeds.add) return;
    const since = Math.max(0, (+api.session() || m.session) - m.session), who = (m.who || []).find(r => r.startsWith("cast:"));
    A.deeds.add({ title: m.text.slice(0, 140), how: "well", place: (m.places || [])[0], who: who ? who.slice(5) : undefined, fac: (m.factions || [])[0],
      what: `Remembered from ${sessionTitle(m.session).toLowerCase()} (${hms(m.t)} into its recording)${since ? ", " + since + " session" + (since > 1 ? "s" : "") + " ago" : ""}${m.open ? "; nothing has come of it since" : ""}.${m.quote ? " At the table: “" + m.quote + "”." : ""}${m.next ? " It could lead to: " + m.next : ""}` }, true);
    api.open("deeds");
  }

  /* ---- drawing it */
  const opt = (v, l, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`;
  const LANGS = [["", "The browser's own language"], ["en-US", "English (US)"], ["en-GB", "English (UK)"], ["ka-GE", "Georgian"], ["ru-RU", "Russian"], ["uk-UA", "Ukrainian"], ["de-DE", "German"], ["fr-FR", "French"], ["es-ES", "Spanish"], ["it-IT", "Italian"], ["pl-PL", "Polish"], ["pt-BR", "Portuguese"], ["tr-TR", "Turkish"], ["nl-NL", "Dutch"], ["ja-JP", "Japanese"]];
  const CONSENT = "We would like to record tonight's game so Atlas can keep notes of what happens in our story. The recording stays with the game master. Say if you'd rather not; we can pause or stop at any time, and delete it afterwards.";
  function recorderHTML() {
    if (R) {
      return `<section class="t-card sm-rec on"><div class="sm-recnow"><span class="sm-dot${R.paused ? " paused" : ""}"></span><b>${R.paused ? "Paused" : R.lost ? "Waiting for the microphone" : "Recording"}</b><span class="sm-dur">${hms(elapsed())}</span></div>
        <p class="kn">${esc(sessionTitle(R.meta.session))} · on ${esc(R.meta.device)} · ${R.soundOff ? "the words written down as they are said" : "kept here, ten seconds at a time"}</p>
        ${R.soundOff ? "" : `<div class="sm-lvl" aria-hidden="true"><i></i></div>`}<p class="sm-mic t-small" aria-live="polite">${R.soundOff ? "Listening, and writing down what is said." : "Hearing the table."}</p>
        <div class="t-row sm-big">${R.paused ? `<button type="button" class="t-btn prim" data-sm="resume">Go on</button>` : `<button type="button" class="t-btn" data-sm="pause">Pause</button>`}<button type="button" class="t-btn sm-stop" data-sm="stop">Stop</button>${R.lost ? `<button type="button" class="t-btn" data-sm="again">Start the microphone again</button>` : ""}</div>
        ${R.meta.live ? `<h4 class="tw-sub">The words, as they are said</h4>${R.wordsOff ? `<p class="t-small">${esc(R.wordsOff)}${R.soundOff ? "" : " The sound is still recorded."}</p>${!R.soundOff && SR ? `<div class="t-row"><button type="button" class="t-btn" data-sm="wordsonly">Keep the words instead of the sound</button></div>` : ""}` : `<div class="sm-last t-small">${R.segs.length ? R.segs.slice(-3).map(s => `<p><span class="kn">${hms(s[0])}</span> ${esc(s[3])}</p>`).join("") : `<p class="kn">Listening…</p>`}</div>`}` : ""}
        <h4 class="tw-sub">Remembered, as you play (yours only)</h4><div class="sm-hints t-small">${hintsHTML()}</div>
        <p class="t-small kn">Keep this page open and the screen on${/phone|iPad/.test(R.meta.device) ? ", the phone plugged in" : ""}. If the screen locks, most phones stop the microphone; it starts again when the page is open.</p></section>`;
    }
    const no = why(), ss = sessionsKnown(), cur = +UI.sess || +api.session() || 1, list = ss.includes(cur) ? ss : ss.concat(cur).sort((a, b) => a - b);
    return `<section class="t-card sm-rec"><h3>${T.icon("mic")} Record this session</h3>
      ${no ? `<p class="t-warnbox">${esc(no)}</p><p class="t-small">Record instead with ${window.ATLAS_APP && window.ATLAS_APP.recorder ? "a phone of its own through the recorder link (below), or " : ""}your phone's own recorder app, and add the file here afterwards; or open the campaign on the computer that runs Atlas, or on claude.ai.</p>` : `
      <label class="t-small">Which session <select class="t-in tw-sel" data-sm="sess">${list.map(n => opt(n, sessionTitle(n), cur)).join("")}</select></label>
      <div class="sm-consent"><p class="t-small">Read this to the table first:</p><blockquote>${esc(CONSENT)}</blockquote>
        <label class="t-fogck"><input type="checkbox" data-sm="consent"${UI.consent ? " checked" : ""}> Everyone at the table knows and has agreed</label></div>
      ${SR ? `<label class="t-fogck"><input type="checkbox" data-sm="live"${UI.live ? " checked" : ""}> Write the words down as we play</label> <select class="t-in tw-sel" data-sm="lang" aria-label="In which language">${LANGS.map(([k, l]) => opt(k, l, UI.lang)).join("")}</select>
        <p class="t-small kn">The words are written by the browser's own speech service${/Chrome|Edg/.test(navigator.userAgent) ? " (Google's, over the internet" + (opts().local ? ", or on this device where it can" : "") + ")" : /Safari/.test(navigator.userAgent) ? " (Apple's)" : ""}, as they are said; who said them is not told apart.</p>` : `<p class="t-small kn">This browser cannot write the words as you play (Chrome, Edge and Safari can); keep the sound, and add its words afterwards.</p>`}
      ${A.modules && !A.modules.on("recorded", "sound") ? `<p class="t-small kn">The words only: keeping the sound too is switched off in What this campaign uses.</p>` : `<label class="t-fogck"><input type="checkbox" data-sm="sound"${UI.sound ? " checked" : ""}> Keep the sound too</label>`}
      <div class="t-row sm-big"><button type="button" class="t-btn prim" data-sm="start"${UI.consent && canStart() ? "" : " disabled"}>${T.icon("mic")}Start recording</button></div>`}
      ${UI.err ? `<p class="t-err">${esc(UI.err)}</p>` : ""}</section>`;
  }
  function lostHTML() {
    return UI.lost.length ? `<section class="t-card sm-lost"><h3>A recording was interrupted</h3>${UI.lost.map(r => `<div class="tw-ev"><div class="tw-h"><b>${esc(sessionTitle(r.session))}</b><span class="kn">begun ${esc(new Date(r.started).toLocaleString())} · ${esc(hms(r.dur))} saved</span></div>
      <div class="t-row"><button type="button" class="t-btn prim" data-sm="lostkeep" data-id="${esc(r.id)}">Keep what was saved</button><button type="button" class="t-btn" data-sm="lostgo" data-id="${esc(r.id)}">Go on recording it</button><button type="button" class="t-mini" data-sm="lostdrop" data-id="${esc(r.id)}">Throw it away</button></div></div>`).join("")}</section>` : "";
  }
  function linkHTML() {
    if (!(window.ATLAS_APP && window.ATLAS_APP.recorder)) return "";
    const d = UI.link;
    return `<section class="t-card"><h3>Record on a phone or another laptop</h3>
      ${!d || !d.on ? `<p class="t-small">Put a phone (or a laptop) in the middle of the table as the recorder. It sends what it hears to this computer as it records, so a locked or crashed phone loses seconds, not the evening. Nothing is reachable from the network until you open the link.</p><div class="t-row"><button type="button" class="t-btn prim" data-sm="linkon">Open the recorder link</button></div>`
        : `<div class="t-lanqr">${d.qr || ""}<div><p class="t-small">On the recording phone, point the camera at the code, or type:</p><p class="t-lanurl">${esc((d.urls || [])[0] || "")}</p>
          <p class="t-small kn">The phone will say the connection is not private: it is this computer's own address. Choose to go on (on an iPhone: Show Details, then visit this website; on Android: Advanced, then Proceed). Phones give the microphone only to such a page.</p>
          <div class="t-row"><button type="button" class="t-mini" data-sm="linknew">A new link</button><button type="button" class="t-mini" data-sm="linkoff">Close the link</button></div></div></div>`}
      ${d && d.error ? `<p class="t-err">${esc(d.error)}</p>` : ""}</section>`;
  }
  function addHTML(rec) {
    const ss = sessionsKnown(), cur = rec ? (recOf(rec) || {}).session : +api.session() || 1;
    return `<section class="t-card"><h3>${rec ? "Add its words" : "Add a recording or its words"}</h3>
      ${rec ? "" : `<label class="t-small">For <select class="t-in tw-sel" data-sm="addsess">${ss.map(n => opt(n, sessionTitle(n), cur)).join("")}</select></label>
      <label class="sm-file">A recording made anywhere (a phone's recorder app, a laptop): <input type="file" accept="audio/*,video/mp4,video/webm,.m4a,.mp3,.wav,.ogg,.opus,.webm" data-sm="audio"></label>`}
      <label class="sm-file">${rec ? "Its words" : "Or the words alone"}, from any tool: <input type="file" accept=".txt,.srt,.vtt,.json,text/plain,application/json" data-sm="words"${rec ? ` data-id="${esc(rec)}"` : ""}></label>
      <p class="t-small kn">Text, subtitles (SRT, VTT) or JSON: Whisper and WhisperX, OpenAI, Deepgram, AssemblyAI; a phone recorder's transcript as text ("Name 0:12" over the words, or "Name: words"). The times and who spoke come with them.</p></section>`;
  }
  function libraryHTML() {
    const by = {}; for (const [id, r] of recs()) (by[r.session] = by[r.session] || []).push([id, r]);
    const ns = Object.keys(by).map(Number).sort((a, b) => b - a), all = mems();
    const res = UI.q ? searchHTML() : "";
    return `<section class="t-card"><div class="tw-hh"><h3>The sessions</h3><input class="t-in tw-sel" data-sm="q" value="${esc(UI.q)}" placeholder="Search what was said and remembered" aria-label="Search"></div>${res}
      ${ns.length ? ns.map(n => { const ms = all.filter(([, m]) => m.session === n), w = ms.filter(([, m]) => m.state === "proposed").length, k = ms.filter(([, m]) => m.state === "kept" || m.state === "unsure").length, sm = S().get("sessmem", "s" + n);
        return `<div class="sm-sess"><div class="tw-h"><b>${esc(sessionTitle(n))}</b><span class="kn">${k ? k + " remembered" : "nothing remembered yet"}${w ? ` · <span class="sm-wait">${w} waiting for you</span>` : ""}</span></div>${sm && sm.summary ? `<p class="t-small">${esc(sm.summary.slice(0, 280))}${sm.summary.length > 280 ? "…" : ""}</p>` : ""}
          ${by[n].map(([id, r]) => `<div class="sm-recrow"><button type="button" class="t-link" data-sm="open" data-id="${esc(id)}">${esc(new Date(r.started).toLocaleDateString())}${r.wordsOnly ? " · words only" : " · " + hms(r.dur)}</button> <span class="kn">${r.state === "recording" || r.state === "paused" || r.state === "lost" ? "<b class=sm-wait>recording now</b> · " : ""}${esc(r.where === "app" ? "sound on the computer" : r.where === "here" ? (r.audioGone ? "sound deleted" : "sound on " + (r.device || "this device")) : "")}${segsOf(id).length ? " · " + segsOf(id).length + " lines of words" : " · no words yet"}</span></div>`).join("")}</div>`; }).join("") : `<p class="kn">Nothing recorded yet.</p>`}</section>`;
  }
  function searchHTML() {
    const q = UI.q, ms = recall(q, { all: true, k: 12 }), sn = []; const ql = q.toLowerCase();
    for (const [rid, r] of recs()) { const segs = segsOf(rid); segs.forEach(s => { if (sn.length < 12 && s[3].toLowerCase().includes(ql)) sn.push([rid, r, s]); }); }
    return `<div class="sm-res">${ms.length ? `<h4 class="tw-sub">Remembered</h4>${ms.map(m => `<p class="t-small"><button type="button" class="t-link" data-sm="show" data-id="${esc(m.id)}">${esc(cite(m))}</button> ${esc(m.text)} <span class="kn">${esc(word(STATES, m.state).toLowerCase())}</span></p>`).join("")}` : ""}
      ${sn.length ? `<h4 class="tw-sub">Said</h4>${sn.map(([rid, r, s]) => `<p class="t-small"><button type="button" class="t-link" data-sm="at" data-id="${esc(rid)}" data-t="${s[0]}">S${r.session} ${hms(s[0])}</button> ${esc(speakerName(rid, s[2]))}: ${esc(s[3].slice(0, 200))}</p>`).join("")}` : ""}
      ${!ms.length && !sn.length ? `<p class="kn">Nothing found.</p>` : ""}</div>`;
  }
  function unfinishedHTML() {
    const l = unfinished(); if (!l.length) return "";
    return `<section class="t-card"><h3>Unfinished business</h3><p class="t-small">Promises, threats, debts and open questions the table has not settled, oldest first. Hand one to the consequences to see what comes of it.</p>
      ${l.slice(0, 12).map(([id, m]) => `<div class="tw-ev"><p class="t-small"><button type="button" class="t-link" data-sm="show" data-id="${esc(id)}">${esc(cite(m))}</button> ${esc(m.text)}</p><div class="t-row">${A.deeds && A.deeds.add ? `<button type="button" class="t-mini" data-sm="deed" data-id="${esc(id)}">What comes of it?</button>` : ""}<button type="button" class="t-mini" data-sm="settled" data-id="${esc(id)}">Settled</button></div></div>`).join("")}</section>`;
  }
  function privacyHTML() {
    const o = opts();
    return `<section class="t-card"><h3>Privacy and keeping</h3>
      <p class="t-small">The sound stays where it was recorded: in this browser on this device, or, from the recorder link, on the computer that runs Atlas. The words and what is remembered are kept with the campaign's table, like your notes. None of it reaches the players' screen, their copy or their phones.</p>
      <p class="t-small">The words are made where you choose: live, by the browser's speech service (Google's in Chrome, Apple's in Safari); afterwards, by whatever tool made the transcript you add. What to remember is read by your own Claude.</p>
      <label class="t-small">Keep the sound <select class="t-in tw-sel" data-sm="keep">${[["", "until I delete it"], ["30", "for 30 days"], ["7", "for 7 days"], ["words", "only until its words are added"]].map(([k, l]) => opt(k, l, o.keep || "")).join("")}</select></label>
      ${SR && /Chrome|Edg/.test(navigator.userAgent) ? `<label class="t-fogck"><input type="checkbox" data-sm="local"${o.local ? " checked" : ""}> Live words on this device when the browser can (newer Chrome on a computer)</label>` : ""}</section>`;
  }
  function memCard(id, m) {
    const tags = (m.who || []).map(r => `<span class="hs-chip hs-p">${esc(refName(r))}</span>`).join("") + (m.places || []).map(p => api.goBtn(p)).join("") + (m.factions || []).map(f => `<span class="hs-chip hs-fa">${esc(facName(f))}</span>`).join("");
    if (UI.edit === id) return `<form class="sm-card sm-ed" data-sm="medit" data-id="${esc(id)}"><textarea class="t-in" name="text" rows="2" maxlength="400">${esc(m.text)}</textarea>
      <div class="t-row"><select class="t-in tw-sel" name="kind">${KINDS.map(([k, l]) => opt(k, l, m.kind)).join("")}</select><select class="t-in tw-sel" name="src">${SRC.map(([k, l]) => opt(k, l, m.src)).join("")}</select><label class="t-fogck"><input type="checkbox" name="open"${m.open ? " checked" : ""}> Unfinished</label></div>
      <input class="t-in" name="next" maxlength="300" value="${esc(m.next || "")}" placeholder="What could come of it later"><input class="t-in" name="note" maxlength="300" value="${esc(m.note || "")}" placeholder="Your own note on it">
      <div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-sm="cancel">Cancel</button></div></form>`;
    const acts = m.state === "kept" || m.state === "unsure" ? [
      m.clue && !((S().get("clues", m.clue.split("/")[0]) || {}).done || []).includes(m.clue.split("/")[1]) ? `<button type="button" class="t-mini" data-sm="clue" data-id="${esc(id)}">Mark the clue found</button>` : "",
      m.fate && A.worldEffects ? `<button type="button" class="t-mini" data-sm="fate" data-id="${esc(id)}">Record: ${esc(refName(m.fate.who))} ${esc(m.fate.now)}</button>` : "",
      m.learns && St && St.know ? `<button type="button" class="t-mini" data-sm="learns" data-id="${esc(id)}">${esc(refName(m.learns.who))} knows it now</button>` : "",
      (m.open || ["did", "promise", "threat", "later", "change"].includes(m.kind)) && A.deeds && A.deeds.add ? `<button type="button" class="t-mini" data-sm="deed" data-id="${esc(id)}">What comes of it?</button>` : "",
      m.open ? `<button type="button" class="t-mini" data-sm="settled" data-id="${esc(id)}">Settled</button>` : ""].join("") : "";
    return `<div class="sm-card sm-st-${esc(m.state)}" id="sm-${esc(id)}"><div class="tw-h"><button type="button" class="t-link sm-at" data-sm="at" data-id="${esc(m.rec)}" data-t="${m.t}">▶ ${esc(cite(m))}</button><span class="hs-kind">${esc(word(KINDS, m.kind))}</span><span class="sm-src sm-src-${esc(m.src)}">${esc(word(SRC, m.src))}</span>${m.open ? `<span class="sm-open">unfinished</span>` : ""}${m.conf < .5 ? `<span class="tw-tag">Claude is unsure</span>` : ""}${m.by === "gm" ? `<span class="tw-tag">yours</span>` : ""}</div>
      <p><b>${esc(m.text)}</b></p>${m.quote ? `<p class="t-small kn">“${esc(m.quote)}”</p>` : ""}${m.next ? `<p class="t-small"><span class="kn">Could lead to</span> ${esc(m.next)}</p>` : ""}${m.note ? `<p class="t-small"><span class="kn">Your note</span> ${esc(m.note)}</p>` : ""}
      ${tags ? `<div class="hs-tags">${tags}</div>` : ""}
      <div class="t-row">${m.state !== "kept" ? `<button type="button" class="t-btn${m.state === "proposed" ? " prim" : ""}" data-sm="keep" data-id="${esc(id)}">Keep</button>` : ""}${m.state !== "unsure" ? `<button type="button" class="t-mini" data-sm="unsure" data-id="${esc(id)}">Keep, unsure</button>` : ""}<button type="button" class="t-mini" data-sm="edit" data-id="${esc(id)}">Change</button>${m.state !== "no" ? `<button type="button" class="t-mini" data-sm="no" data-id="${esc(id)}">Not so</button>` : ""}${acts}</div></div>`;
  }
  function wordsHTML(rec) {
    const segs = segsOf(rec), m = recOf(rec);
    if (!segs.length) return addHTML(rec) + (m && m.live ? "" : "");
    const labels = [...new Set(segs.map(s => s[2]).filter(Boolean))], table = opts().table || [];
    const who = (lab) => { const sp = (m.speakers || {})[lab] || {}, v = sp.who || ""; return `<select class="t-in tw-sel" data-sm="spk" data-id="${esc(rec)}" data-lab="${esc(lab)}"><option value="">Who is this?</option>${opt("gm", "The game master", v)}${Object.entries(pcs()).map(([id, p]) => opt("pc:" + id, `${p.player ? p.player + ", playing " : ""}${p.n}`, v)).join("")}${opt("player", "A player", v)}${opt("other", "Someone else", v)}</select><input class="t-in tw-sel" data-sm="spkname" data-id="${esc(rec)}" data-lab="${esc(lab)}" value="${esc(sp.name || "")}" placeholder="Their name" list="smTable">`; };
    let list = segs.map((s, i) => [s, i]);
    if (UI.tq) { const q = UI.tq.toLowerCase(); list = list.filter(([s]) => s[3].toLowerCase().includes(q) || speakerName(rec, s[2]).toLowerCase().includes(q)); }
    const at = UI.focus != null ? Math.max(0, list.findIndex(([s]) => s[0] >= UI.focus - .01)) : 0, from = Math.max(0, Math.min(at - 20, list.length - 200)), shown = list.slice(from, from + 200);
    return `${labels.length ? `<section class="t-card"><h3>Who spoke</h3><p class="t-small">Name each voice once; the names are kept for the next sessions. The words were told apart by the tool that made them.</p><datalist id="smTable">${table.map(p => `<option value="${esc(p.name)}">`).join("")}</datalist>${labels.map(l => `<div class="sm-spk"><b>${esc(l)}</b>${who(l)}</div>`).join("")}</section>` : `<p class="t-small kn">Who spoke is not in these words: Claude tells the game master from the players by what is said.</p>`}
      <section class="t-card"><div class="tw-hh"><h3>What was said</h3><input class="t-in tw-sel" data-sm="tq" value="${esc(UI.tq)}" placeholder="Find in the words" aria-label="Find in the words"></div>
      ${from > 0 ? `<button type="button" class="t-mini" data-sm="earlier">Earlier</button>` : ""}
      <ol class="sm-words">${shown.map(([s, i]) => `<li class="${UI.focus != null && Math.abs(s[0] - UI.focus) < 2 ? "on" : ""}" data-i="${i}"><button type="button" class="t-link sm-at" data-sm="at" data-id="${esc(rec)}" data-t="${s[0]}">${hms(s[0])}</button> <b>${esc(speakerName(rec, s[2]))}</b> ${UI.edit === rec + ":" + i ? `<input class="t-in" data-sm="fix" data-id="${esc(rec)}" data-i="${i}" value="${esc(s[3])}">` : `<span>${esc(s[3])}</span> <button type="button" class="t-link sm-fixb" data-sm="fixopen" data-id="${esc(rec)}" data-i="${i}" title="Correct the words">✎</button>${s[4] != null ? ` <span class="kn" title="${esc("First written: " + s[4])}">(corrected)</span>` : ""}`}</li>`).join("")}</ol>
      ${from + 200 < list.length ? `<button type="button" class="t-mini" data-sm="later">Later (${list.length - from - 200} more)</button>` : ""}</section>`;
  }
  // the notes waiting for the game master, on the card every suggestion of Claude's is on (the UX review of 5 Nov 2026,
  // items 13 and 14): ticked where Claude is sure and it happened; each can be written over, or asked for again alone
  function waitingCard(rec, ms) {
    const wait = ms.filter(([, m]) => m.state === "proposed").sort((a, b) => a[1].t - b[1].t); if (!wait.length || !A.ux) return "";
    const sure = m => m.conf >= .8 && (m.src === "canon" || m.src === "narration");
    return A.ux.card({ id: "notes-" + rec, title: `What to remember from session ${recOf(rec).session}`, intro: "Ticked: what happened, and Claude is sure of it. Untick what is wrong, write over what is nearly right, or ask again for one note.",
      made: ["what was said at the table", "what the campaign already remembers"], touches: ["the campaign's memory, which the copilot, the council and the history recall"], keeps: ["everything kept before", "what you leave unticked, still waiting here"],
      parts: wait.map(([id, m]) => ({ id, label: `${word(KINDS, m.kind)} · ${cite(m)}${m.conf < .5 ? " · Claude is unsure" : ""}`, text: m.text, on: sure(m) })), keepAllLabel: "Keep them all",
      onKeep: sel => { for (const p of sel) { const m = memOf(p.id); if (!m) continue; if (p.text && p.text !== m.text) S().set("memory", p.id, Object.assign({}, m, { text: String(p.text).slice(0, 400), by: "gm" })); keep(p.id, "kept"); } api.note(`Kept ${sel.length}. The rest wait here.`); paint(); },
      onDrop: () => { for (const [id] of wait) keep(id, "no"); api.note("Not so: crossed out, kept below in case you change your mind."); paint(); },
      onAgain: async (id, wish) => {
        const m = memOf(id); if (!m) return null; const seg = segsOf(rec).filter(s => s[0] >= m.t - 150 && s[0] <= m.t + 150); if (!seg.length) return null;
        const r = await api.askRaw(notePrompt(rec, seg, 0, 1, "") + `\n\nWrite again only this one note, better: "${m.text}" (${m.kind}).${wish ? " The game master says: " + wish : ""} Answer with the same JSON, with one note.`, () => {}, null, { kind: "writing", what: "one note again: " + m.text.slice(0, 40) + (m.text.length > 40 ? "…" : ""), uses: ["what was said around it"] });
        const j = json(r), x = j && [].concat(j.notes || [])[0]; if (!x || !String(x.text || "").trim()) return null;
        const nm = Object.assign({}, m, { text: String(x.text).trim().slice(0, 400), quote: String(x.quote || m.quote || "").trim().slice(0, 240), again: Date.now() }, KINDS.some(k => k[0] === x.kind) ? { kind: x.kind } : {});
        S().set("memory", id, nm);
        return { label: `${word(KINDS, nm.kind)} · ${cite(nm)} · asked again`, text: nm.text, on: true };
      } });
  }
  function notesHTML(rec) {
    const ms = mems().filter(([, m]) => m.rec === rec), f = UI.filter, w = ms.filter(([, m]) => m.state === "proposed").length, card = f ? "" : waitingCard(rec, ms);
    const shown = ms.filter(([, m]) => (!f || m.state === f || m.kind === f) && !(card && m.state === "proposed")).sort((a, b) => a[1].t - b[1].t);
    return `<section class="t-card"><div class="tw-hh"><h3>What to remember</h3>${UI.busy === rec ? `<span class="kn">Reading part ${UI.prog ? UI.prog[0] + 1 : 1} of ${UI.prog ? UI.prog[1] : "?"}… <button type="button" class="t-link" data-sm="halt">stop</button></span>` : segsOf(rec).length ? `<button type="button" class="t-btn prim" data-sm="remember" data-id="${esc(rec)}">${ms.length ? "Read it again" : "Find what to remember"}</button>` : ""}</div>
      <p class="t-small">Claude reads the words a part at a time and writes down what the campaign should remember, each with where it was said. Nothing counts until you keep it; "Not so" stays here, crossed out, in case you change your mind.</p>
      ${UI.err ? `<p class="t-err">${esc(UI.err)}</p>` : ""}
      <div class="t-row"><select class="t-in tw-sel" data-sm="filter" aria-label="Show">${opt("", "Everything", f)}${STATES.map(([k, l]) => opt(k, l, f)).join("")}${KINDS.map(([k, l]) => opt(k, l, f)).join("")}</select>${w ? `<button type="button" class="t-mini" data-sm="keepsure" data-id="${esc(rec)}">Keep all that happened and Claude is sure of (${ms.filter(([, m]) => m.state === "proposed" && m.conf >= .8 && (m.src === "canon" || m.src === "narration")).length})</button>` : ""}<button type="button" class="t-mini" data-sm="own" data-id="${esc(rec)}">+ A note of your own</button></div>
      ${card}${shown.map(([id, m]) => memCard(id, m)).join("") || (card ? "" : `<p class="kn">${ms.length ? "Nothing of that kind." : "Nothing yet."}</p>`)}</section>`;
  }
  const GROUPS = [["Decisions and deeds", ["decision", "did"]], ["Conversations", ["talk"]], ["Clues", ["clue"]], ["Places", ["visit"]], ["Things", ["item"]], ["Fates and bonds", ["fate", "bond"]], ["The world changed", ["change"]], ["Promises and threats", ["promise", "threat"]], ["The players' theories", ["theory"]], ["Open questions", ["mystery"]], ["To come back later", ["later"]]];
  function sessionHTML(rec) {
    const m = recOf(rec), n = m.session, sm = S().get("sessmem", "s" + n), ms = mems().filter(([, x]) => x.session === n && (x.state === "kept" || x.state === "unsure"));
    return `<section class="t-card"><h3>${esc(sessionTitle(n))}: what happened</h3>
      ${sm ? (UI.edit === "sum" ? `<form data-sm="sumedit"><textarea class="t-in" name="s" rows="6" maxlength="4000">${esc(sm.summary)}</textarea><div class="t-row"><button class="t-btn prim">Keep it</button><button type="button" class="t-mini" data-sm="cancel">Cancel</button></div></form>`
        : `<div class="t-readout"><p>${esc(sm.summary).replace(/\n+/g, "</p><p>")}</p></div><div class="t-row">${sm.state !== "kept" ? `<button type="button" class="t-btn prim" data-sm="sumkeep" data-n="${n}">Keep it</button>` : `<span class="tw-tag">kept</span>`}<button type="button" class="t-mini" data-sm="sumopen">Change it</button><button type="button" class="t-mini" data-sm="sumnotes" data-n="${n}">Put it in the session's notes, for "Previously on…"</button></div>`)
        : `<p class="kn">No summary yet: it is written when the words are read.</p>`}
      ${GROUPS.map(([g, ks]) => { const l = ms.filter(([, x]) => ks.includes(x.kind)).sort((a, b) => a[1].t - b[1].t); return l.length ? `<h4 class="tw-sub">${g}</h4>${l.map(([id, x]) => `<p class="t-small"><button type="button" class="t-link" data-sm="show" data-id="${esc(id)}">${esc(hms(x.t))}</button> ${esc(x.text)}${x.state === "unsure" ? ` <span class="kn">(unsure)</span>` : ""}${x.next ? ` <span class="kn">Could lead to: ${esc(x.next)}</span>` : ""}</p>`).join("")}` : ""; }).join("")}</section>${pacingHTML(rec)}`;
  }
  /* ---- how the evening went (the user's approved idea of 3 Nov 2026, the fifteenth in reviews/2026-11-03-ideas.md:
     "after a session, a quiet chart of how the evening went (talk, exploration, fights, rules discussion) from the live
     words' timing and content, with one suggestion"): each stretch of words read for what it is about by the words in
     it (no Claude, nothing sent anywhere), the evening drawn in steps, how long each kind took, and one suggestion, the
     plainest that fits */
  const PACE = [
    ["talk", "Talk and story", "#6d7f93", null],
    ["explore", "Exploring", "#5f9a6b", /\b(doors?|rooms?|corridors?|halls?|look(?:s|ing)? (?:at|around|for|in|under|inside)|search(?:es|ing)?|opens?|go(?:es)? (?:to|down|up|in|into|out|through)|walks?|maps?|north|south|east|west|upstairs|downstairs|deck|hatch|explore|inside|outside|enters?|climbs?|cellar|street|stairs|bay|ladder|vents?|tunnels?|path|road|ruins?)\b/gi],
    ["fight", "Fighting", "#b0662e", /\b(attacks?|hits?|miss(?:es)?|damage|initiative|wound(?:s|ed)?|shoots?|shot|stabs?|swings?|parry|dodges?|hp|hit points|armou?r class|kill(?:s|ed)?|dies|unconscious|grenade|sword|blast|crit(?:ical)?|punch(?:es)?|fight(?:s|ing)?|guns?|pistol|rifle|bleed(?:s|ing)?)\b/gi],
    ["rules", "Rules", "#a07c10", /\b(rules?|roll(?:s|ed|ing)?|modifier|bonus|dc|advantage|disadvantage|skill|character sheet|page \d+|rulebook|spell slots?|saving throw|how does|can i|is that allowed|percentile|d20|d100|d6|d8|d10|d12|dice|sanity|spot hidden|luck)\b/gi],
    ["off", "Off the game", "#8a8378", /\b(pizza|snacks?|food|a break|toilet|bathroom|my phone|haha|lol|anyway|beer|coffee|tea|starving|hungry|the bus|train home|the dog|the kids|be right back|brb)\b/gi]
  ];
  function pacing(segs) {
    if (!segs || !segs.length) return null;
    const end = Math.max(...segs.map(s => (+s[0] || 0) + (+s[1] || 0))), step = end > 1800 ? 300 : Math.max(15, Math.ceil(end / 20)), n = Math.max(1, Math.ceil(end / step));
    const bins = Array.from({ length: n }, (_, i) => ({ t: i * step, c: {} })), tot = {}, kinds = [];
    segs.forEach((s, i) => {
      const t = +s[0] || 0, d = Math.max(+s[1] || 0, i + 1 < segs.length ? Math.max(0, (+segs[i + 1][0] || 0) - t) : 4), x = String(s[3] || "");
      let best = "talk", score = /["“”]/.test(x) ? 1 : 0;
      for (const [k, , , re] of PACE) if (re) { const m = x.match(re), v = m ? m.length : 0; if (v > score) { best = k; score = v; } }
      kinds.push(best); tot[best] = (tot[best] || 0) + d; const b = bins[Math.min(n - 1, Math.floor(t / step))]; b.c[best] = (b.c[best] || 0) + d;
    });
    // the longest stretch of one kind
    let run = null, cur = null; segs.forEach((s, i) => { const k = kinds[i]; if (!cur || cur.k !== k) cur = { k, a: +s[0] || 0, b: +s[0] || 0 }; cur.b = (+s[0] || 0) + (+s[1] || 0); if (!run || cur.b - cur.a > run.b - run.a) run = Object.assign({}, cur); });
    const sum = Object.values(tot).reduce((a, b) => a + b, 0) || 1, pc = k => Math.round((tot[k] || 0) / sum * 100);
    const at = k => { let t = 0, v = 0; for (const b of bins) if ((b.c[k] || 0) > v) { v = b.c[k]; t = b.t; } return hms(t); };
    const say = pc("rules") >= 20 ? `Rules took ${pc("rules")}% of the evening, most of it around ${at("rules")}. A short sheet of the rules that came up could give that time back to the story.`
      : pc("fight") >= 45 ? `Fighting filled ${pc("fight")}% of the evening. A scene next time that cannot be won by fighting would change the pace.`
      : pc("off") >= 15 ? `${pc("off")}% of the evening was off the game, much of it around ${at("off")}. A break planned near then might gather it into one.`
      : run && run.b - run.a >= 2400 && run.k !== "talk" ? `From ${hms(run.a)} to ${hms(run.b)} it was all ${PACE.find(p => p[0] === run.k)[1].toLowerCase()}. Something else breaking into a stretch that long keeps the table awake.`
      : pc("talk") >= 75 && pc("explore") < 8 ? `Almost all talk (${pc("talk")}%). A place to search or a door to open next time would let the players lead.`
      : `A balanced evening: ${PACE.filter(p => pc(p[0])).map(p => `${pc(p[0])}% ${p[1].toLowerCase()}`).join(", ")}.`;
    return { step, end, bins, tot, pc, say, run, kinds };
  }
  function pacingHTML(rec) {
    const P = pacing(segsOf(rec)); if (!P) return "";
    const W = 600, H = 120, bw = W / P.bins.length, big = P.step;
    const bars = P.bins.map((b, i) => { let y = H; return PACE.map(([k, l, col]) => { const v = Math.min(H, (b.c[k] || 0) / big * H); if (!v) return ""; y -= v; return `<rect x="${(i * bw + .5).toFixed(1)}" y="${Math.max(0, y).toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${v.toFixed(1)}" fill="${col}"><title>${hms(b.t)}: ${esc(l)}, ${Math.round(b.c[k])} s</title></rect>`; }).join(""); }).join("");
    const ticks = P.bins.map((b, i) => i % Math.max(1, Math.round(P.bins.length / 6)) ? "" : `<text x="${(i * bw + 2).toFixed(1)}" y="${H + 14}">${hms(b.t)}</text>`).join("");
    return `<section class="t-card sm-pace"><h3>How the evening went</h3><svg class="sm-pchart" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="The session's time by kind: ${PACE.map(p => p[1] + " " + P.pc(p[0]) + "%").join(", ")}">${bars}${ticks}</svg>
      <p class="sm-pkey">${PACE.map(([k, l, col]) => `<span><i style="background:${col}"></i>${esc(l)} <b>${P.pc(k)}%</b></span>`).join("")}</p>
      <p class="sm-psay">${esc(P.say)}</p><p class="t-small kn">Read from the words alone, by what they are about; nothing is sent anywhere. A rough guide, not a verdict.</p></section>`;
  }
  function recHTML(rec) {
    const m = recOf(rec); if (!m) { UI.rec = ""; return home(); }
    const w = mems().filter(([, x]) => x.rec === rec && x.state === "proposed").length, sound = m.where === "app" || (m.where === "here" && !m.audioGone);
    return `<div class="t-grid"><section class="t-card sm-head"><div class="tw-hh"><h3>${esc(sessionTitle(m.session))}</h3><button type="button" class="t-link" data-sm="back">All sessions</button></div>
      <p class="t-small kn">${esc(new Date(m.started).toLocaleString())}${m.wordsOnly ? " · words only" : " · " + hms(m.dur)}${m.name ? " · " + esc(m.name) : ""}${m.where === "app" ? " · the sound is on the computer that runs Atlas" : m.where === "here" ? (m.audioGone ? " · the sound was deleted" : " · the sound is on " + esc(m.device || "this device")) : ""}</p>
      ${sound ? `<div class="t-row"><button type="button" class="t-btn" data-sm="at" data-id="${esc(rec)}" data-t="0">▶ Play it from the start</button><span class="t-small kn">or click any time beside the words</span></div>` : ""}
      <div class="t-row sm-tabs" role="tablist">${[["words", "What was said"], ["notes", `What to remember${w ? " (" + w + ")" : ""}`], ["session", "The session"], ["add", "Add words"]].map(([k, l]) => `<button type="button" role="tab" class="t-mini" data-sm="sub" data-k="${k}" aria-selected="${UI.sub === k}">${esc(l)}</button>`).join("")}
        <span class="t-sp"></span>${sound ? `<button type="button" class="t-mini" data-sm="dropsound" data-id="${esc(rec)}">Delete the sound</button>` : ""}<button type="button" class="t-mini" data-sm="dropwords" data-id="${esc(rec)}">Delete the words</button><button type="button" class="t-mini" data-sm="dropall" data-id="${esc(rec)}">Delete all of it</button></div></section>
      ${UI.sub === "notes" ? notesHTML(rec) : UI.sub === "session" ? sessionHTML(rec) : UI.sub === "add" ? addHTML(rec) : wordsHTML(rec)}</div>`;
  }
  function home() {
    return `<div class="t-grid t-g2w"><div>${lostHTML()}${recorderHTML()}${linkHTML()}${addHTML("")}</div><div>${libraryHTML()}${unfinishedHTML()}${privacyHTML()}</div></div>`;
  }
  const html = () => UI.rec ? recHTML(UI.rec) : home();

  /* ---- what the game master does */
  let sure = null;
  const twice = (b, fn) => { if (sure === b) { sure = null; fn(); return; } if (sure) sure.textContent = sure.dataset.lbl; sure = b; b.dataset.lbl = b.textContent; b.textContent = "Really?"; setTimeout(() => { if (sure === b) { b.textContent = b.dataset.lbl; sure = null; } }, 4000); };
  async function finishLost(id, go) {
    const r = UI.lost.find(x => x.id === id); if (!r) return;
    let ch = []; try { ch = await chunksOf(id); } catch (e) {}
    const dur = r1(ch.reduce((a, c) => Math.max(a, c.t || 0), r.dur || 0)), meta = Object.assign({ session: r.session, started: r.started, where: "here", device: device(), speakers: {} }, recOf(id) || {}, { parts: r.parts || [], dur });
    UI.lost = UI.lost.filter(x => x.id !== id);
    if (go && !R && !why()) {
      R = { id, meta: Object.assign(meta, { state: "recording" }), acc: dur, part: (r.parts || []).length - 1, seq: 0, segs: [], dirty: new Set(), saved: 0, running: false, paused: false, soundOff: !!meta.noSound };
      if (meta.noSound) { R.running = true; R.t0 = performance.now(); }
      else try { await newPart(); } catch (e) { R = null; UI.err = "The microphone could not be started: " + (e && e.message || e); paint(); return; }
      putRec(id, R.meta); wake(); if (R.meta.live) words(true); R.timer = setInterval(tick, 1000); banner(); paint(); return;
    }
    meta.state = "stopped"; putRec(id, meta); idbPut("recs", { id, state: "stopped", session: meta.session, started: meta.started, parts: meta.parts, dur }).catch(() => {});
    UI.rec = id; paint();
  }
  async function dropSound(id) {
    const m = recOf(id); if (!m) return;
    if (m.where === "here") await dropHere(id).catch(() => {});
    if (m.where === "app" && window.ATLAS_APP && window.ATLAS_APP.dropAudio) await window.ATLAS_APP.dropAudio(id).catch(() => {});
    for (const k of Object.keys(urls)) if (k.startsWith(id + ":")) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
    putRec(id, Object.assign({}, m, { audioGone: true, where: m.where === "app" ? "none" : m.where }));
  }
  function show(mid) {
    const m = memOf(mid); if (!m) return;
    api.open("recorded"); UI.rec = m.rec; UI.sub = "notes"; UI.filter = ""; UI.focus = m.t; paint();
    setTimeout(() => { const el = document.getElementById("sm-" + mid); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("sm-flash"); } }, 120);
  }
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-sm]"); if (!b || ["SELECT", "INPUT", "FORM", "TEXTAREA"].includes(b.tagName)) return;
    const k = b.dataset.sm, id = b.dataset.id;
    switch (k) {
      case "start": start(); return;
      case "pause": pause(); banner(); return;
      case "resume": resume(); banner(); return;
      case "stop": stop(); return;
      case "again": again(); return;
      case "wordsonly": wordsOnly(); return;
      case "openrec": api.open("recorded"); UI.rec = ""; paint(); return;
      case "lostkeep": finishLost(id, false); return;
      case "lostgo": finishLost(id, true); return;
      case "lostdrop": twice(b, async () => { await dropHere(id).catch(() => {}); UI.lost = UI.lost.filter(x => x.id !== id); if (recOf(id)) putRec(id, Object.assign({}, recOf(id), { state: "stopped", audioGone: true })); paint(); }); return;
      case "linkon": case "linknew": case "linkoff": try { UI.link = await window.ATLAS_APP.recorder(k === "linkoff" ? { on: false } : { on: true, fresh: k === "linknew" }); } catch (x) { UI.link = { error: "The app did not answer: is it still running?" }; } paint(); return;
      case "open": UI.rec = id; UI.sub = segsOf(id).length ? "words" : "add"; UI.focus = null; UI.tq = ""; break;
      case "back": UI.rec = ""; UI.edit = ""; UI.err = ""; break;
      case "sub": UI.sub = b.dataset.k; UI.edit = ""; break;
      // (a time: the words there, and the sound from there; from a note, the note stays in view)
      case "at": { const card = !!b.closest(".sm-card"); UI.rec = id; UI.focus = +b.dataset.t; if (!card) UI.sub = "words"; paint(); if (!card) setTimeout(() => { const el = document.querySelector(".sm-words li.on"); if (el) el.scrollIntoView({ block: "center" }); }, 60); playAt(id, +b.dataset.t); return; }
      case "plclose": { const p = document.getElementById("smPlayer"); if (p) { const a = p.querySelector("audio"); a.pause(); p.hidden = true; } return; }
      case "show": show(id); return;
      case "earlier": UI.focus = Math.max(0, (UI.focus || 0) - 600); break;
      case "later": { const s = segsOf(UI.rec); const i = Math.min(s.length - 1, (s.findIndex(x => x[0] >= (UI.focus || 0)) + 200)); UI.focus = s[Math.max(0, i)][0]; break; }
      case "fixopen": UI.edit = id + ":" + b.dataset.i; paint(); setTimeout(() => { const i = document.querySelector('[data-sm="fix"]'); if (i) i.focus(); }, 30); return;
      case "remember": remember(id); return;
      case "halt": UI.stop = true; return;
      case "keep": keep(id, "kept"); break;
      case "unsure": keep(id, "unsure"); break;
      case "no": keep(id, "no"); break;
      case "edit": UI.edit = id; break;
      case "cancel": UI.edit = ""; break;
      case "keepsure": for (const [mid, m] of mems()) if (m.rec === id && m.state === "proposed" && m.conf >= .8 && (m.src === "canon" || m.src === "narration")) keep(mid, "kept"); break;
      case "own": { const t = UI.focus || 0, mid = uid("m"); S().set("memory", mid, { rec: id, session: recOf(id).session, t, kind: "did", text: "(write it)", src: "canon", conf: 1, state: "proposed", by: "gm", t0: Date.now(), who: [], places: [], factions: [] }); UI.edit = mid; UI.sub = "notes"; break; }
      case "clue": { const m = memOf(id); if (m && m.clue && St && St.setStatus) { const [pl, cid] = m.clue.split("/"); St.setStatus(pl, cid, "discovered"); api.note("Marked found."); } break; }
      case "fate": { const m = memOf(id); if (m && m.fate && A.worldEffects) { const fx = A.worldEffects.apply({ title: `As the table remembers (${cite(m)})`, effects: [{ person: m.fate.who.slice(5), status: m.fate.now }] }, W() ? W().at(W().now()).short : ""); S().set("memory", id, Object.assign({}, m, { fateDone: fx })); api.note(`${refName(m.fate.who)}: ${m.fate.now}.`); } break; }
      case "learns": { const m = memOf(id); if (m && m.learns && St && St.know) { try { St.know({ who: m.learns.who, text: m.learns.what, type: "report", how: "told", when: `${sessionTitle(m.session)}, ${hms(m.t)}`, why: "Remembered at the table" }, { src: "session", note: "remembered from a recorded session" }); api.note(`${refName(m.learns.who)} knows it now.`); } catch (x) { api.note("It could not be added to what they know."); } } break; }
      case "deed": toDeed(id); return;
      case "settled": { const m = memOf(id); if (m) S().set("memory", id, Object.assign({}, m, { open: false, settled: Date.now() })); break; }
      case "sumkeep": { const sm = S().get("sessmem", "s" + b.dataset.n); if (sm) S().set("sessmem", "s" + b.dataset.n, Object.assign({}, sm, { state: "kept", t: Date.now() })); break; }
      case "sumopen": UI.edit = "sum"; break;
      case "sumnotes": { const n = +b.dataset.n, sm = S().get("sessmem", "s" + n), cur = (api.notesOf(n) || {}).notes || ""; if (sm && !cur.includes(sm.summary.slice(0, 60))) api.saveNotes(n, (cur ? cur + "\n\n" : "") + sm.summary); api.note(`In the notes of session ${n}: "Previously on…" under Tonight is made from them.`); break; }
      case "dropsound": twice(b, () => { dropSound(id).then(paint); }); return;
      case "dropwords": twice(b, () => { saveSegs(id, []); paint(); }); return;
      case "dropall": twice(b, async () => { await dropSound(id); saveSegs(id, []); for (const [mid, m] of mems()) if (m.rec === id) { if (A.history) A.history.remove("s_" + mid); S().set("memory", mid, null); } S().set("recs", id, null); UI.rec = ""; paint(); }); return;
      default: return;
    }
    paint();
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.sm) return; const k = t.dataset.sm;
    if (k === "consent") { UI.consent = t.checked; } else if (k === "live") UI.live = t.checked; else if (k === "sound") UI.sound = t.checked; else if (k === "lang") UI.lang = t.value; else if (k === "sess") UI.sess = t.value; else if (k === "filter") UI.filter = t.value;
    else if (k === "q") UI.q = t.value.trim(); else if (k === "tq") { UI.tq = t.value.trim(); UI.focus = null; }
    else if (k === "keep" || k === "local") S().set("recs", "opts", Object.assign({}, opts(), k === "keep" ? { keep: t.value } : { local: t.checked }));
    else if (k === "audio" && t.files[0]) { const sel = document.querySelector('[data-sm="addsess"]'); addAudio(t.files[0], +(sel ? sel.value : api.session()) || 1); return; }
    else if (k === "words" && t.files[0]) { const sel = document.querySelector('[data-sm="addsess"]'), f = t.files[0], rec = t.dataset.id || ""; f.text().then(x => addWords(x, rec, +(sel ? sel.value : api.session()) || 1)); return; }
    else if (k === "spk" || k === "spkname") {
      const m = recOf(t.dataset.id); if (!m) return; const sp = Object.assign({}, m.speakers || {}), lab = t.dataset.lab, cur = Object.assign({}, sp[lab] || {});
      if (k === "spk") cur.who = t.value; else cur.name = t.value.trim().slice(0, 40);
      sp[lab] = cur; putRec(t.dataset.id, Object.assign({}, m, { speakers: sp }));
      // (the people at this table, kept for the next sessions)
      if (cur.name && cur.who) { const tb = (opts().table || []).filter(p => p.name.toLowerCase() !== cur.name.toLowerCase()).concat({ name: cur.name, who: cur.who }).slice(-24); S().set("recs", "opts", Object.assign({}, opts(), { table: tb })); }
    }
    else if (k === "fix") { const segs = segsOf(t.dataset.id).slice(), i = +t.dataset.i, s = segs[i]; if (s && t.value.trim() !== s[3]) { segs[i] = [s[0], s[1], s[2], t.value.trim(), s[4] != null ? s[4] : s[3]]; saveSegs(t.dataset.id, segs, new Set([Math.floor(i / PART)])); } UI.edit = ""; }
    else return;
    t.blur(); paint();
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.sm) return; e.preventDefault();
    const g = n => String((f.elements[n] || {}).value || "").trim();
    if (f.dataset.sm === "medit") { const m = memOf(f.dataset.id); if (m && g("text")) { S().set("memory", f.dataset.id, Object.assign({}, m, { text: g("text").slice(0, 400), kind: g("kind"), src: g("src"), open: f.elements.open.checked, next: g("next") || undefined, note: g("note") || undefined, edited: Date.now(), state: m.state === "proposed" || m.state === "no" ? "kept" : m.state })); keep(f.dataset.id, m.state === "unsure" ? "unsure" : "kept"); } UI.edit = ""; }
    else if (f.dataset.sm === "sumedit") { const n = (recOf(UI.rec) || {}).session, sm = S().get("sessmem", "s" + n); if (sm) S().set("sessmem", "s" + n, Object.assign({}, sm, { summary: g("s").slice(0, 4000), state: "kept", by: "gm", t: Date.now() })); UI.edit = ""; }
    if (document.activeElement) document.activeElement.blur(); paint();
  });
  function paint() { if (api.tab() === "recorded") api.render(); }

  // the sound kept no longer than the game master said
  function retention() {
    const keepFor = opts().keep; if (!keepFor) return;
    for (const [id, r] of recs()) {
      if (r.audioGone || r.where === "none" || r.state !== "stopped" || (R && R.id === id)) continue;
      const old = keepFor === "words" ? segsOf(id).length > 0 && r.words === "file" : Date.now() - r.started > +keepFor * 864e5;
      if (old) dropSound(id);
    }
  }
  const loaded = new Set();
  // (the search: the sessions planned, and those recorded)
  (A.searchers = A.searchers || []).push({ kind: "Sessions", order: 38, find: q => { const out = []; for (const s of A.sessionsData || []) { const x = A.nav && A.nav.hit("Session " + (s.n || "") + (s.title ? ": " + s.title : ""), [s.start, s.goal, s.notes].join(" "), q, "Tonight's sheet"); if (x) out.push(Object.assign(x, { go: () => api.open("tonight") })); } for (const [id, r] of recs()) { const x = A.nav && A.nav.hit(r.title || "A recorded session", [r.text, r.summary].join(" ").slice(0, 20000), q, "Recorded " + new Date(r.started).toLocaleDateString()); if (x) out.push(Object.assign(x, { go: () => api.open("recorded") })); } return out.slice(0, 20); } });
  TU.addTab({ key: "recorded", label: "Recorded sessions", icon: "mic", group: "play", after: "tonight", desc: "Record the table; its words; what the campaign remembers of every session",
    html, status: () => { if (R) return (R.paused ? "Paused" : "Recording") + " · " + hms(elapsed()); const w = mems().filter(([, m]) => m.state === "proposed").length, k = memList().length; return w ? `${w} to remember waiting for you` : k ? `${k} things remembered` : "Nothing recorded yet"; },
    init(store) {
      for (const c of ["recs", "transcript", "memory", "sessmem", "clues"]) store.watch(c, () => { loaded.add(c); if (loaded.has("recs") && loaded.has("transcript") && !retention.done) { retention.done = true; retention(); } if (!document.activeElement || !document.activeElement.closest || !document.activeElement.closest("#tvBody")) paint(); });
      // a recording this browser was making when the page went away
      idbAll("recs").then(l => { UI.lost = l.filter(r => r.state !== "stopped"); if (UI.lost.length) paint(); }).catch(() => {});
      if (window.ATLAS_APP && window.ATLAS_APP.recorder) window.ATLAS_APP.recorder().then(d => { UI.link = d; paint(); }, () => {});
      if (A.history) for (const c of ["memory", "sessmem"]) A.history.keep(c);
    } });

  // the copilot, the world's history and the consistency check draw on it (atlas-copilot.js, atlas-history.js)
  A.sessionPacing = pacing;
  A.memory = { recall, forPrompt, snippets, unfinished: () => unfinished().map(([id, m]) => Object.assign({ id }, m)), cite, show, refName, KINDS, SRC, parseWords };
  if (A.consistency) A.consistency.add("sessions", () => {
    const out = [], st = S(); if (!st) return out;
    for (const [id, m] of memList()) {
      const ev = [{ text: `${sessionTitle(m.session)}, ${hms(m.t)}${m.quote ? ": “" + m.quote + "”" : ""}` }];
      if (m.state === "kept" && m.fate && !m.fateDone && m.fate.now === "dead") { const L = st.get("npcstate", m.fate.who.slice(5)) || {}; if (L.status !== "dead") out.push({ area: "people", sev: "warn", kind: "memfate", id: "mem>" + id, title: `The table remembers ${refName(m.fate.who)} died, but the world has them alive`, why: m.text, evidence: ev, refs: [m.fate.who], suggest: "Record it from the recorded session, or mark the memory unsure if the table was mistaken." }); }
      if (m.state === "kept" && m.clue) { const [pl, cid] = m.clue.split("/"); if (!(((st.get("clues", pl) || {}).done) || []).includes(cid)) out.push({ area: "table", sev: "warn", kind: "memclue", id: "mem>" + id, title: `The table remembers finding a clue the tracker does not have`, why: m.text, evidence: ev, refs: ["place:" + pl], suggest: "Mark the clue found from the recorded session, or mark the memory unsure." }); }
    }
    return out;
  });
})(ATLAS);
