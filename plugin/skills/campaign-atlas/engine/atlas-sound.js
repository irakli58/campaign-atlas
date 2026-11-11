/* ================================================================
   CAMPAIGN ATLAS: SOUNDS
   Real recordings at the table (the user's audio request of 11 Nov 2026, approved: "do all of em then ill choose if
   something is bad"): a soundboard of ambiences that loop, sounds that play once, and scenes that start several at a
   time with their occasional sounds coming now and then, each time a different take, a little to the left or the right.
   Simple to use: a search, the scenes, what is playing with a volume for each, Stop all.
   Where the sounds come from:
     - sound packs, installed by the game master: in the Atlas app on their computer (window.ATLAS_APP.audio), or at an
       address the campaign names (ATLAS.configure({ sounds: { base } })); each pack a catalogue.json with every sound's
       name, kind, length, whether it loops, its level, its tags, and for each take its source, licence and credit;
     - the game master's own files (a Sonniss bundle, Pixabay downloads, BigSoundBank downloads), kept in this browser;
       they never leave it.
   The music's own synthesized textures and events are played from recordings when a pack has them (atlas-music.js asks
   A.sound.recorded(key)). The narrator lowers the ambience while he speaks (A.sound.duck) and can play a sound at a cue
   written in his text, [sound: thunder]. Every recording that asks for credit is listed in Credits.
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined") return;
  const esc = s => (A.esc ? A.esc(s) : String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]));
  const SK = () => ((A.config && A.config.storageKey) || "atlas") + "-sound-";
  const pref = { get: (k, d) => { try { const v = localStorage.getItem(SK() + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(SK() + k, JSON.stringify(v)); } catch (e) {} } };
  const S = { items: new Map(), packs: [], loaded: false, ac: null, out: null, buses: {}, layers: new Map(), events: new Map(), scene: null, duck: 1, vol: pref.get("vol", .8), open: false, q: "", own: [] };

  /* ---- the scenes Atlas starts with: layers that loop at their level, and sounds that come now and then (every so many
          seconds, between the two numbers). A sound missing from the packs installed is simply left out */
  const SCENE = (id, name, genre, tags, layers, events) => ({ id, name, genre, tags, layers, events: events || [] });
  const SCENES = [
    SCENE("storm", "A thunderstorm", "everywhere", ["storm", "rain", "thunder", "night"], [["thunderstorm", .7], ["rain-heavy", .35], ["wind-howl", .2]], [["thunder", 14, 40, .9]]),
    SCENE("rain-night", "Rain at night", "everywhere", ["rain", "night", "calm"], [["rain-light", .75]], [["owl", 45, 110, .45]]),
    SCENE("rain-inside", "Rain on the roof, indoors", "everywhere", ["rain", "inside", "shelter", "investigation"], [["rain-roof", .7], ["clock", .35]], [["thunder", 50, 120, .35]]),
    SCENE("forest-day", "A forest by day", "fantasy", ["forest", "nature", "travel"], [["forest-day", .8], ["river", .25]], [["crows", 40, 100, .4]]),
    SCENE("forest-night", "A forest at night", "fantasy", ["forest", "night", "eerie"], [["forest-night", .7], ["crickets", .4]], [["owl", 30, 80, .5], ["wolf", 90, 220, .45]]),
    SCENE("camp", "A camp by a fire", "fantasy", ["camp", "fire", "night", "travel"], [["fire", .6], ["crickets", .35], ["wind-soft", .2]], [["owl", 60, 140, .35]]),
    SCENE("cave", "A cave", "fantasy", ["cave", "underground", "dark"], [["cave-drips", .8], ["drone", .2]], [["growl", 100, 220, .35]]),
    SCENE("dungeon", "A dungeon", "fantasy", ["dungeon", "prison", "underground", "dark"], [["cave-drips", .55], ["drone", .35]], [["chains", 25, 70, .5], ["steps-stone", 45, 100, .45], ["growl", 80, 180, .35]]),
    SCENE("tavern", "A tavern", "fantasy", ["tavern", "inn", "crowd", "town"], [["tavern", .8], ["fire", .35]], [["door-open", 60, 150, .4], ["cheer", 150, 320, .35]]),
    SCENE("market", "A market", "fantasy", ["market", "town", "crowd", "day"], [["market", .8]], [["horse", 40, 90, .45], ["dog", 60, 150, .4], ["bell", 150, 300, .35]]),
    SCENE("smithy", "A blacksmith's", "fantasy", ["smithy", "forge", "town"], [["fire", .5], ["crowd", .15]], [["smith", 5, 13, .7]]),
    SCENE("castle", "A castle hall", "fantasy", ["castle", "hall", "nobles"], [["fire", .45], ["wind-soft", .2], ["crowd", .15]], [["steps-stone", 30, 75, .45], ["door-close", 60, 150, .45], ["armour", 50, 110, .4]]),
    SCENE("battle", "A battle", "fantasy", ["battle", "war", "fight"], [["drums", .55], ["crowd", .4]], [["sword", 3, 8, .7], ["horn", 40, 90, .6], ["cheer", 60, 130, .5], ["bow", 6, 15, .5]]),
    SCENE("harbour", "A harbour", "everywhere", ["harbour", "sea", "port", "coast"], [["sea", .7], ["wind-soft", .3]], [["gulls", 15, 40, .5], ["bell", 150, 300, .3]]),
    SCENE("blizzard", "A blizzard", "everywhere", ["snow", "cold", "storm", "mountain"], [["blizzard", .85], ["wind-howl", .3]]),
    SCENE("desert", "Desert wind", "everywhere", ["desert", "sand", "wind"], [["sandstorm", .75], ["blizzard", .35], ["wind-howl", .3]]),
    SCENE("spaceship", "A spaceship", "scifi", ["ship", "space", "engine", "travel"], [["hum-engine", .7], ["vent", .35]], [["beeps", 15, 45, .4], ["servo", 40, 90, .35], ["door-slide", 60, 150, .4]]),
    SCENE("station-abandoned", "An abandoned space station", "scifi", ["station", "abandoned", "derelict", "space", "eerie", "spaceship"], [["hum-reactor", .4], ["vent", .3], ["drone", .25]], [["static", 40, 90, .3], ["creak-floor", 40, 100, .35], ["sparks", 50, 120, .4], ["geiger", 90, 200, .3]]),
    SCENE("station-alarm", "A station on alert", "scifi", ["alarm", "danger", "station", "emergency"], [["hum-reactor", .5], ["alarm", .4]], [["airlock", 20, 50, .45], ["beeps", 10, 25, .4]]),
    SCENE("comms", "Comms and static", "scifi", ["radio", "comms", "signal", "distress"], [["static", .35]], [["radio", 20, 50, .55], ["morse", 60, 130, .45], ["sonar", 70, 150, .35]]),
    SCENE("industrial", "Machinery", "scifi", ["factory", "industry", "machine", "engine"], [["machinery", .7], ["hum-reactor", .3]], [["airlock", 30, 70, .45], ["sparks", 60, 130, .4]]),
    SCENE("haunted", "A haunted house", "horror", ["haunted", "house", "mansion", "night", "horror"], [["empty-house", .6], ["wind-howl", .4], ["clock", .2]], [["creak-floor", 20, 50, .5], ["steps-wood", 40, 90, .45], ["door-creak", 60, 140, .45], ["whispers", 90, 200, .3]]),
    SCENE("dread", "Dread", "horror", ["horror", "tension", "fear"], [["drone", .5], ["heartbeat", .3]], [["breathing", 40, 90, .45], ["scream", 120, 300, .3]]),
    SCENE("crypt", "A crypt", "horror", ["crypt", "tomb", "church", "underground"], [["cave-drips", .45], ["drone", .35], ["wind-soft", .15]], [["chains", 60, 140, .35], ["whispers", 70, 160, .3], ["bell", 180, 360, .3]]),
    SCENE("church", "A church", "everywhere", ["church", "temple", "chapel", "shrine"], [["empty-house", .4], ["wind-howl", .12], ["crowd", .08]], [["bell", 120, 300, .35], ["steps-stone", 60, 140, .35]]),
    SCENE("house", "A quiet old house", "everywhere", ["house", "manor", "home", "inside", "study"], [["clock", .4], ["fire", .3]], [["creak-floor", 60, 150, .3], ["door-close", 120, 260, .3]]),
    SCENE("at-sea", "At sea", "everywhere", ["sea", "ship", "boat", "ocean", "voyage"], [["sea", .8], ["wind-howl", .3]], [["gulls", 40, 100, .4], ["bell", 160, 320, .25]]),
    SCENE("moor", "A moor, open country", "everywhere", ["moor", "wilderness", "hills", "travel", "plains"], [["wind-howl", .55], ["wind-soft", .3]], [["crows", 40, 110, .45], ["wolf", 160, 360, .3]]),
    SCENE("ruins", "Ruins", "everywhere", ["ruins", "war", "abandoned", "rubble"], [["wind-howl", .5], ["drone", .2]], [["crows", 40, 100, .45], ["creak-floor", 70, 160, .3]]),
    SCENE("lab", "A laboratory", "scifi", ["laboratory", "lab", "science", "hospital"], [["hum-reactor", .4], ["vent", .35]], [["beeps", 12, 35, .4], ["servo", 50, 120, .3]]),
    SCENE("city-night", "A city at night", "modern", ["city", "street", "night", "town"], [["rain-light", .3], ["crowd", .2]], [["dog", 60, 150, .35], ["bell", 200, 400, .25]]),
    SCENE("office", "A quiet office at night", "modern", ["office", "investigation", "study", "inside"], [["clock", .5], ["rain-roof", .3]], [["thunder", 80, 180, .25]])
  ];
  // (Sounds switched off for this campaign: the music plays its own textures, nothing is loaded)
  const soundsOn = () => !A.modules || A.modules.on("sounds");
  // the music's textures and events, played from recordings when a pack has them (atlas-music.js)
  const MUSIC_KEY = { wind: "wind-soft", rain: "rain-light", sea: "sea", water: "river", fire: "fire", crowd: "crowd", hum: "hum-engine", lightning: "thunder", thunder: "thunder", toll: "bell", tick: "clock", clank: "smith", steam: "airlock", scream: "scream", knock: "knock", steps: "steps-wood", creak: "door-creak", breath: "breathing", heart: "heartbeat", whisper: "whispers", monster: "growl", wolf: "wolf", dog: "dog", chains: "chains" };
  // words that mean the same, for the search ("abandoned spaceship")
  const SYN = { spaceship: ["ship", "space", "station", "engine", "hum"], abandoned: ["empty", "eerie", "derelict", "creak", "abandoned"], scary: ["horror", "dread", "eerie"], spooky: ["horror", "eerie", "haunted"], inn: ["tavern"], pub: ["tavern"], storm: ["thunder", "rain", "wind"], weather: ["rain", "wind", "storm", "snow"], sea: ["waves", "harbour", "coast"], dragon: ["roar", "beast", "monster"], monster: ["growl", "roar", "beast"], fight: ["sword", "battle"], computer: ["beeps", "terminal"], radio: ["static", "comms", "signal"], night: ["owl", "crickets", "night"], fire: ["fire", "camp"], door: ["door"], ghost: ["whispers", "haunted", "horror"], underground: ["cave", "dungeon", "crypt"] };

  /* ---- the packs */
  const bases = () => { const out = []; try { const o = localStorage.getItem("atlas-soundbase"); if (o) out.push(o); } catch (e) {} if (A.config && A.config.sounds && A.config.sounds.base) out.push(A.config.sounds.base); if (window.ATLAS_APP && window.ATLAS_APP.audio && window.ATLAS_APP.audio.base) out.push(window.ATLAS_APP.audio.base); return [...new Set(out)].map(b => b.replace(/\/?$/, "/")); };
  // (in the Atlas app: the packs there are, to install with a click; the app keeps them in its own folder)
  const appAudio = () => window.ATLAS_APP && window.ATLAS_APP.audio;
  async function packList() { if (!appAudio()) return; try { S.app = await appAudio().packs(); } catch (e) { S.app = { error: e.message, installed: [], available: null }; } paint(); }
  async function installPack(id) {
    S.installing = id; paint();
    try { await appAudio().install(id); S.loaded = false; S.items.clear(); S.packs = []; await load(); await packList(); if (A.tableUI) A.tableUI.api.note("The sound pack is installed."); }
    catch (e) { if (A.tableUI) A.tableUI.api.note("The sound pack could not be installed: " + e.message); }
    S.installing = null; paint();
  }
  async function removePack(id) { try { await appAudio().remove(id); stopAll(0); S.loaded = false; S.items.clear(); S.packs = []; await load(); await packList(); } catch (e) { if (A.tableUI) A.tableUI.api.note(e.message); } }
  async function load() {
    if (S.loaded) return; S.loaded = true;
    for (const base of bases()) {
      try {
        const packs = await (await fetch(base + "packs.json", { cache: "no-store" })).json();
        for (const p of packs.packs || packs) {
          try { const cat = await (await fetch(base + p.id + "/catalogue.json", { cache: "no-store" })).json(); const pack = Object.assign({}, p, cat, { base: base + p.id + "/" }); S.packs.push(pack); for (const it of cat.sounds || []) S.items.set(it.id, Object.assign({}, it, { pack: p.id, base: pack.base })); } catch (e) { console.warn("sound pack", p.id, e); }
        }
      } catch (e) { /* no packs at this address */ }
    }
    await loadOwn(); await libLoad();
    paint();
  }
  /* ---- the game master's own sounds, in this browser (IndexedDB) */
  const idb = () => new Promise((ok, no) => { const r = indexedDB.open("atlas-own-sounds", 1); r.onupgradeneeded = () => r.result.createObjectStore("own", { keyPath: "id" }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  async function loadOwn() { try { const db = await idb(); const all = await new Promise(o => { const q = db.transaction("own").objectStore("own").getAll(); q.onsuccess = () => o(q.result || []); q.onerror = () => o([]); }); S.own = all; for (const it of all) S.items.set(it.id, Object.assign({}, it, { own: true })); } catch (e) {} }
  async function addOwn(files) {
    const db = await idb(), added = [];
    for (const f of files) {
      const name = f.name.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(), low = name.toLowerCase();
      let dur = 0; try { dur = (await ctx().decodeAudioData(await f.arrayBuffer())).duration; } catch (e) { continue; }
      const loop = dur > 25 || /\b(ambien|amb|loop|atmos|room tone|rain|wind|forest|crowd|hum|drone|river|sea|waves)\b/.test(low);
      const it = { id: "own-" + Date.now().toString(36) + Math.floor(Math.random() * 1000), name, cat: loop ? "ambience" : "effect", loop, dur: Math.round(dur * 10) / 10, gain: 1, tags: low.split(/\s+/).filter(w => w.length > 2), desc: "Your own sound", blob: f, credit: "Your own file", licence: "yours" };
      await new Promise(o => { const t = db.transaction("own", "readwrite"); t.objectStore("own").put(it); t.oncomplete = o; t.onerror = o; });
      S.items.set(it.id, Object.assign({}, it, { own: true })); added.push(it);
    }
    S.own = S.own.concat(added); paint(); return added;
  }
  async function forgetOwn(id) { const db = await idb(); await new Promise(o => { const t = db.transaction("own", "readwrite"); t.objectStore("own").delete(id); t.oncomplete = o; t.onerror = o; }); S.items.delete(id); S.own = S.own.filter(x => x.id !== id); stopLayer(id); paint(); }

  /* ---- the sound itself: one audio context, a limiter, three channels (ambience, effects, the narrator's own) */
  function ctx() {
    if (S.ac) return S.ac;
    const AC = window.AudioContext || window.webkitAudioContext; S.ac = new AC();
    const lim = S.ac.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = .003; lim.release.value = .25;
    S.out = S.ac.createGain(); S.out.gain.value = S.vol; S.out.connect(lim); lim.connect(S.ac.destination);
    for (const b of ["amb", "fx", "voice"]) { S.buses[b] = S.ac.createGain(); S.buses[b].connect(S.out); }
    S.an = S.ac.createAnalyser(); S.an.fftSize = 2048; S.out.connect(S.an);   // (how loud it is now: for the tests, which cannot listen either)
    return S.ac;
  }
  const BUF = new WeakMap();
  // a take's sound, decoded once for each audio context (the music has its own)
  function bufferOf(ac, take, item) {
    let m = BUF.get(ac); if (!m) { m = new Map(); BUF.set(ac, m); }
    const key = item.own ? item.id : item.base + take.file; if (m.has(key)) return m.get(key);
    const p = (item.own ? Promise.resolve(item.blob.arrayBuffer()) : fetch(key).then(r => { if (!r.ok) throw new Error("no " + take.file); return r.arrayBuffer(); })).then(b => ac.decodeAudioData(b)).then(buf => item.loop ? seamless(ac, buf) : buf);
    p.catch(() => m.delete(key)); m.set(key, p); return p;
  }
  // A loop made seamless again on the sound as decoded: its last 40 ms crossfaded into its first (equal power), so that
  // it runs round with no click. (Each pack's loop is seamless before it is encoded; the encoding changes its first and
  // last few milliseconds a little, and dev/sound-packs/check-packs.js measured the click that left, 11 Nov 2026.)
  function seamless(ac, buf) {
    const n = buf.length, k = Math.min(Math.round(buf.sampleRate * .04), Math.floor(n / 4)); if (k < 8) return buf;
    const out = ac.createBuffer(buf.numberOfChannels, n - k, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const x = buf.getChannelData(c), y = out.getChannelData(c); y.set(x.subarray(0, n - k));
      for (let i = 0; i < k; i++) { const t = i / k; y[i] = x[i] * Math.sin(t * Math.PI / 2) + x[n - k + i] * Math.cos(t * Math.PI / 2); }
    }
    return out;
  }
  const takesOf = it => it.own ? [{ file: "", dur: it.dur }] : (it.takes || []);
  const LAST = new Map();
  function pickTake(it) { const T = takesOf(it); if (T.length < 2) return T[0]; let k; do k = Math.floor(Math.random() * T.length); while (k === LAST.get(it.id)); LAST.set(it.id, k); return T[k]; }
  const level = (it, v) => (it.gain || 1) * (v == null ? 1 : v);
  // an ambience, round and round: a prepared loop loops on its own; any other sound is crossfaded into itself
  async function startLayer(id, v, fade) {
    const it = S.items.get(id); if (!it) return false; const ac = ctx(); await ac.resume();
    if (S.layers.has(id)) { setLayer(id, v); return true; }
    const L = { id, v: v == null ? .7 : v, g: ac.createGain(), srcs: [], timer: 0 }; L.g.gain.value = 0; L.g.connect(S.buses.amb); S.layers.set(id, L);
    const take = pickTake(it), buf = await bufferOf(ac, take, it).catch(() => null); if (!buf || !S.layers.has(id)) { S.layers.delete(id); return false; }
    const t0 = ac.currentTime + .05;
    if (it.loop && it.seamless !== false && !it.own) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(L.g); s.start(t0, Math.random() * Math.max(0, buf.duration - 1)); L.srcs.push(s); }
    else { const xf = Math.min(3, buf.duration / 4); let at = t0; const next = () => { if (!S.layers.has(id)) return; const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buf; s.connect(g); g.connect(L.g); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(1, at + xf); g.gain.setValueAtTime(1, at + buf.duration - xf); g.gain.linearRampToValueAtTime(0, at + buf.duration); s.start(at); s.stop(at + buf.duration + .05); L.srcs.push(s); if (L.srcs.length > 3) L.srcs.shift(); at += buf.duration - xf; L.timer = setTimeout(next, Math.max(200, (at - ac.currentTime - 1.5) * 1000)); }; next(); }
    L.g.gain.setTargetAtTime(level(it, L.v), t0, (fade == null ? 2.5 : fade) / 3);
    paint(); return true;
  }
  function setLayer(id, v) { const L = S.layers.get(id), it = S.items.get(id); if (!L || !it) return; L.v = v; L.g.gain.setTargetAtTime(level(it, v), ctx().currentTime, .15); }
  function stopLayer(id, fade) { const L = S.layers.get(id); if (!L) return; S.layers.delete(id); clearTimeout(L.timer); const ac = ctx(), t = ac.currentTime, f = fade == null ? 2 : fade; L.g.gain.cancelScheduledValues(t); L.g.gain.setValueAtTime(L.g.gain.value, t); L.g.gain.linearRampToValueAtTime(0, t + f); setTimeout(() => { for (const s of L.srcs) try { s.stop(); } catch (e) {} try { L.g.disconnect(); } catch (e) {} }, f * 1000 + 100); paint(); }
  // a sound once: a take chosen, a touch of pitch and loudness its own each time, a little to one side
  async function play(id, o) {
    o = o || {}; const it = S.items.get(id); if (!it) return false; const ac = ctx(); await ac.resume();
    const take = pickTake(it), buf = await bufferOf(ac, take, it).catch(() => null); if (!buf) return false;
    const s = ac.createBufferSource(), g = ac.createGain(), pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    s.buffer = buf; s.playbackRate.value = o.vary === false ? 1 : 1 + (Math.random() - .5) * .07;
    g.gain.value = level(it, o.vol == null ? .8 : o.vol) * (o.vary === false ? 1 : Math.pow(10, (Math.random() - .5) * .25));
    if (pan) { pan.pan.value = o.pan != null ? o.pan : o.vary === false ? 0 : (Math.random() - .5) * 1.1; s.connect(g); g.connect(pan); pan.connect(S.buses.fx); } else { s.connect(g); g.connect(S.buses.fx); }
    s.start(); return true;
  }
  // a sound now and then: every so many seconds, at random between the two
  function startEvent(id, min, max, v) { stopEvent(id); const E = { id, min, max, v, timer: 0 }; const go = () => { if (!S.events.has(id)) return; play(id, { vol: v }); E.timer = setTimeout(go, (min + Math.random() * (max - min)) * 1000); }; S.events.set(id, E); E.timer = setTimeout(go, (min * .4 + Math.random() * (max - min) * .5) * 1000); paint(); }
  function stopEvent(id) { const E = S.events.get(id); if (E) { clearTimeout(E.timer); S.events.delete(id); paint(); } }
  // a scene: its layers fade in as the last one's fade out (those both share stay), its sounds now and then begin
  function startScene(sc) {
    if (typeof sc === "string") sc = sceneOf(sc); if (!sc) return false;
    const keep = new Set(sc.layers.map(l => l[0]));
    for (const id of [...S.layers.keys()]) if (!keep.has(id)) stopLayer(id, 3);
    for (const id of [...S.events.keys()]) stopEvent(id);
    let any = false;
    for (const [id, v] of sc.layers) if (S.items.has(id)) { any = true; if (S.layers.has(id)) setLayer(id, v); else startLayer(id, v, 3); }
    for (const [id, a, b, v] of sc.events) if (S.items.has(id)) { any = true; startEvent(id, a, b, v); }
    S.scene = sc.id; pref.set("scene", sc.id); paint(); return any;
  }
  function stopAll(fade) { for (const id of [...S.layers.keys()]) stopLayer(id, fade == null ? 2.5 : fade); for (const id of [...S.events.keys()]) stopEvent(id); S.scene = null; paint(); }
  // the narrator speaking: the ambience steps back (to a third, as the music does), and comes up again after
  function duck(on) { S.duck = on ? (pref.get("duckTo", .35)) : 1; if (S.ac) S.buses.amb.gain.setTargetAtTime(S.duck, S.ac.currentTime, on ? .2 : .6); }
  // what is playing, kept as a scene of the game master's own
  function nowAsScene(name) { return { id: "mine-" + Date.now().toString(36), name: name || "My scene", genre: "yours", tags: [], layers: [...S.layers.values()].map(L => [L.id, Math.round(L.v * 100) / 100]), events: [...S.events.values()].map(E => [E.id, E.min, E.max, E.v]) }; }
  const ownScenes = () => { const st = A.tableUI && A.tableUI.api && A.tableUI.api.store && A.tableUI.api.store(); const d = st && st.get ? (st.get("soundscenes") || {}) : pref.get("scenes", {}); return Object.values(d || {}).filter(x => x && x.layers); };
  function saveScene(sc) { const st = A.tableUI && A.tableUI.api && A.tableUI.api.store && A.tableUI.api.store(); if (st && st.set) st.set("soundscenes", sc.id, sc); else { const d = pref.get("scenes", {}); d[sc.id] = sc; pref.set("scenes", d); } paint(); }
  function dropScene(id) { const st = A.tableUI && A.tableUI.api && A.tableUI.api.store && A.tableUI.api.store(); if (st && st.set) st.set("soundscenes", id, null); else { const d = pref.get("scenes", {}); delete d[id]; pref.set("scenes", d); } paint(); }
  // (the scenes kept in my library, for every campaign: atlas-mylib.js, kind "soundscape")
  let LIB = [];
  const libLoad = () => { if (!A.myLibrary) return Promise.resolve(); return A.myLibrary.list("soundscape").then(L => { LIB = L.map(it => Object.assign({}, it.data, { id: "lib-" + it.id, name: it.name, genre: "yours", lib: it.id, tags: (it.data && it.data.tags) || [] })).filter(x => x.layers); paint(); }).catch(() => {}); };
  if (A.myLibrary && A.myLibrary.on) A.myLibrary.on(libLoad);
  const allScenes = () => { const own = ownScenes(), names = new Set(own.map(x => x.name)); return SCENES.concat(own, LIB.filter(x => !names.has(x.name))); };
  const sceneOf = id => allScenes().find(s => s.id === id) || null;
  const playable = sc => sc.layers.some(l => S.items.has(l[0])) || sc.events.some(e => S.items.has(e[0]));

  /* ---- the search: names, tags, words that mean the same */
  function search(q) {
    const words = String(q || "").toLowerCase().split(/[^a-z0-9']+/).filter(w => w.length > 1); if (!words.length) return { scenes: [], sounds: [] };
    const want = words.flatMap(w => [w].concat(SYN[w] || []));
    const hit = txt => { const t = txt.toLowerCase(); let s = 0; for (const w of want) if (t.includes(w)) s += words.includes(w) ? 3 : 1; return s; };
    const scenes = allScenes().filter(playable).map(sc => [hit(sc.name + " " + sc.tags.join(" ") + " " + sc.layers.concat(sc.events).map(l => (S.items.get(l[0]) || {}).name || "").join(" ")), sc]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    const sounds = [...S.items.values()].filter(it => it.cat !== "music").map(it => [hit(it.name + " " + (it.tags || []).join(" ") + " " + (it.desc || "") + " " + (it.cat || "")), it]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    return { scenes, sounds };
  }
  // a place's scene: the one it names (sound: "tavern"), or the one its music's mood suggests
  const MOOD_SCENE = { calm: "house", street: "market", night: "city-night", market: "market", tavern: "tavern", church: "church", temple: "church", crypt: "crypt", library: "office", manor: "house", palace: "castle", docks: "harbour", sea: "at-sea", sewer: "dungeon", cellar: "dungeon", cave: "cave", laboratory: "lab", hospital: "lab", prison: "dungeon", factory: "industrial", warehouse: "ruins", station: "industrial", forest: "forest-day", moor: "moor", desert: "desert", storm: "storm", ritual: "dread", dread: "dread", mystery: "office", sorrow: "rain-night", battle: "battle", base: "industrial", ruins: "ruins", ship: "spaceship" };
  function sceneForPlace(id) { const m = A.meta && A.meta[id]; if (!m) return null; if (m.sound) return sceneOf(m.sound); const th = A.music && A.music.themeFor ? A.music.themeFor(id) : null, mood = th && th.mood; return mood && MOOD_SCENE[mood] ? sceneOf(MOOD_SCENE[mood]) : null; }

  /* ---- the panel */
  const fmt = s => s >= 60 ? Math.floor(s / 60) + " min " + Math.round(s % 60) + " s" : Math.round(s) + " s";
  function credits() {
    const out = []; for (const it of S.items.values()) for (const t of takesOf(it)) if (!it.own && t.credit) out.push([it.name, t]);
    return out;
  }
  function paint() {
    const el = document.getElementById("sndPanel"); if (!el || el.hidden) { const b = document.getElementById("snd-btn"); if (b) b.setAttribute("aria-pressed", S.layers.size || S.events.size ? "true" : "false"); return; }
    const items = [...S.items.values()].filter(it => it.cat !== "music"), has = items.length > 0, q = S.q.trim(), R = q ? search(q) : null;
    const sceneBtn = sc => `<button type="button" class="snd-sc${S.scene === sc.id ? " on" : ""}" data-snd="scene" data-id="${esc(sc.id)}" title="${esc(sc.layers.concat(sc.events).map(l => (S.items.get(l[0]) || {}).name).filter(Boolean).join(", "))}">${esc(sc.name)}</button>`;
    const sndBtn = it => it.loop ? `<button type="button" class="snd-it${S.layers.has(it.id) ? " on" : ""}" data-snd="layer" data-id="${esc(it.id)}" title="${esc((it.desc || "") + (it.dur ? " · " + fmt(it.dur) : ""))}">${esc(it.name)}</button>` : `<button type="button" class="snd-it fx" data-snd="once" data-id="${esc(it.id)}" title="${esc((it.desc || "") + (takesOf(it).length > 1 ? " · " + takesOf(it).length + " takes" : ""))}">▶ ${esc(it.name)}</button>`;
    const groups = [["ambience", "To loop"], ["effect", "To play once"]];
    const playing = [...S.layers.values()].map(L => { const it = S.items.get(L.id) || {}; return `<div class="snd-row"><span>${esc(it.name || L.id)}</span><input type="range" min="0" max="1" step=".02" value="${L.v}" data-sndv="${esc(L.id)}" aria-label="${esc(it.name)}: volume"><button type="button" class="snd-x" data-snd="stop" data-id="${esc(L.id)}" aria-label="Stop ${esc(it.name)}">×</button></div>`; }).join("") + [...S.events.values()].map(E => { const it = S.items.get(E.id) || {}; return `<div class="snd-row ev"><span>${esc(it.name || E.id)} <span class="kn">now and then</span></span><input type="range" min="0" max="1" step=".02" value="${E.v}" data-sndev="${esc(E.id)}" aria-label="${esc(it.name)}: volume"><button type="button" class="snd-x" data-snd="stopev" data-id="${esc(E.id)}" aria-label="Stop ${esc(it.name)}">×</button></div>`; }).join("");
    el.innerHTML = `<div class="snd-head"><h3>Sounds</h3><button type="button" class="snd-close" data-snd="close" aria-label="Close">Close</button></div>
      ${has ? "" : `<p class="snd-empty">No sound packs are installed yet. ${appAudio() ? "Install one below: it is downloaded once, then works with no internet." : "In the Atlas app they install with a click; here you can add your own sound files below."}</p>`}
      ${appAudio() && (!has || S.showPacks) ? packsHTML() : ""}
      <div class="snd-bar"><input type="search" class="snd-q" placeholder="Search: abandoned spaceship, tavern, storm…" value="${esc(S.q)}" aria-label="Search the sounds"><label class="snd-vol">Volume <input type="range" min="0" max="1" step=".02" value="${S.vol}" data-sndmaster="1"></label><button type="button" data-snd="stopall"${S.layers.size || S.events.size ? "" : " disabled"}>Stop all</button></div>
      ${playing ? `<div class="snd-now"><h4>Playing</h4>${playing}<button type="button" class="snd-save" data-snd="savescene">Keep this as a scene…</button></div>` : ""}
      ${R ? `<div class="snd-sec"><h4>Found</h4>${R.scenes.length ? `<div class="snd-grid">${R.scenes.map(sceneBtn).join("")}</div>` : ""}<div class="snd-grid">${R.sounds.slice(0, 40).map(sndBtn).join("") || `<p class="kn">Nothing found for “${esc(q)}”.</p>`}</div></div>` : `
      <div class="snd-sec"><h4>Scenes</h4><div class="snd-grid">${allScenes().filter(sc => playable(sc) || sc.genre === "yours").map(sceneBtn).join("") || `<p class="kn">The scenes appear when sound packs are installed.</p>`}</div></div>
      ${groups.map(([k, label]) => { const L = items.filter(it => (it.cat || (it.loop ? "ambience" : "effect")) === k).sort((a, b) => a.name.localeCompare(b.name)); return L.length ? `<div class="snd-sec"><h4>${label}</h4><div class="snd-grid">${L.map(sndBtn).join("")}</div></div>` : ""; }).join("")}`}
      <div class="snd-sec snd-foot"><label class="snd-add">Add your own sounds<input type="file" accept="audio/*" multiple data-sndadd="1" hidden></label>
        <label class="snd-ck"><input type="checkbox" data-sndpref="place"${pref.get("place", false) ? " checked" : ""}> Start each place's scene when it is opened</label>
        <label class="snd-ck"><input type="checkbox" data-sndpref="weather"${pref.get("weather", true) ? " checked" : ""}> The day's weather outdoors (rain, wind, thunder)</label>
        <button type="button" data-snd="credits">Credits</button>${appAudio() && has ? `<button type="button" data-snd="packs" aria-expanded="${!!S.showPacks}">Sound packs</button>` : ""}${S.own.length ? `<button type="button" data-snd="ownlist">Your own sounds (${S.own.length})</button>` : ""}</div>`;
    const b = document.getElementById("snd-btn"); if (b) b.setAttribute("aria-pressed", S.layers.size || S.events.size ? "true" : "false");
  }
  function packsHTML() {
    const A0 = S.app; if (!A0) { packList(); return `<div class="snd-sec"><h4>Sound packs</h4><p class="kn">Looking for the sound packs…</p></div>`; }
    const inst = new Map((A0.installed || []).map(p => [p.id, p])), avail = A0.available || [...inst.values()];
    const mb = b => b ? (b / 1e6).toFixed(b < 1e7 ? 1 : 0) + " MB" : "";
    return `<div class="snd-sec snd-packs"><h4>Sound packs</h4>${A0.error && !avail.length ? `<p class="kn">${esc(A0.error)}</p>` : ""}<ul>${avail.map(p => `<li><b>${esc(p.name)}</b> <span class="kn">${esc(p.say || "")} · ${p.count || "?"} sounds, ${mb(p.bytes)}</span> ${S.installing === p.id ? `<span class="kn">Installing…</span>` : inst.has(p.id) ? `<span class="kn">installed</span> <button type="button" data-snd="unpack" data-id="${esc(p.id)}">Take it away</button>` : `<button type="button" class="prim" data-snd="install" data-id="${esc(p.id)}"${S.installing ? " disabled" : ""}>Install</button>`}</li>`).join("")}</ul><p class="kn">Recordings free to share, from Wikimedia Commons (CC0, public domain, CC BY and CC BY-SA); each credited in Credits.</p></div>`;
  }
  function openPanel(on) {
    let el = document.getElementById("sndPanel");
    if (!el) { el = document.createElement("div"); el.id = "sndPanel"; el.className = "snd-panel snd-float"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Sounds"); el.hidden = true; document.body.appendChild(el); }
    if (!el.dataset.bound) { el.dataset.bound = "1"; bind(el); }
    S.open = on == null ? el.hidden : on; el.hidden = !S.open; if (S.open) { load().then(paint); paint(); const q = el.querySelector(".snd-q"); if (q) q.focus(); }
    const b = document.getElementById("snd-btn"); if (b) b.setAttribute("aria-expanded", S.open);
  }
  function dlg(html) { let d = document.getElementById("sndDlg"); if (!d) { d = document.createElement("dialog"); d.id = "sndDlg"; d.className = "snd-dlg"; document.body.appendChild(d); d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-sndx]")) d.close(); }); } d.innerHTML = html; d.showModal(); return d; }
  function bind(el) {
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-snd]"); if (!b) return; const id = b.dataset.id;
      switch (b.dataset.snd) {
        case "close": openPanel(false); break;
        case "scene": if (S.scene === id) stopAll(); else startScene(id); break;
        case "layer": if (S.layers.has(id)) stopLayer(id); else startLayer(id, .7); break;
        case "once": play(id, { vary: true }); break;
        case "stop": stopLayer(id); break;
        case "stopev": stopEvent(id); break;
        case "stopall": stopAll(); break;
        case "savescene": { const d = dlg(`<form method="dialog" class="snd-form"><h3>Keep this as a scene</h3><label>Its name <input name="n" maxlength="60" required value="${esc(S.scene ? ((sceneOf(S.scene) || {}).name || "") + " (mine)" : "My scene")}"></label><p class="kn">Kept in this campaign; with “Also in my library” in every campaign of yours.</p><label class="snd-ck"><input type="checkbox" name="lib" checked> Also in my library</label><div><button value="cancel" formnovalidate>Cancel</button> <button value="ok" class="prim">Keep it</button></div></form>`);
          d.querySelector("form").addEventListener("submit", ev => { if (ev.submitter && ev.submitter.value !== "ok") return; const f = ev.target, sc = nowAsScene(f.elements.n.value.trim()); saveScene(sc); S.scene = sc.id; if (f.elements.lib.checked && A.myLibrary) A.myLibrary.save({ kind: "soundscape", name: sc.name, say: sc.layers.length + " sounds playing, " + sc.events.length + " now and then", data: sc }).catch(() => {}); }); break; }
        case "install": installPack(id); break;
        case "unpack": removePack(id); break;
        case "packs": S.showPacks = !S.showPacks; if (S.showPacks) packList(); paint(); break;
        case "credits": { const C = credits(); dlg(`<div class="snd-form"><h3>Credits for the sounds</h3><p class="kn">Every recording in the sound packs installed, with where it comes from and its licence. Those under CC BY and CC BY-SA ask for this credit; those in the public domain or under CC0 do not, and are listed too.</p><ol class="snd-cred">${C.map(([n, t]) => `<li><b>${esc(n)}</b>: ${esc(t.title || t.file)}${t.author ? " by " + esc(t.author) : ""}, ${esc(t.licence || "")}${t.page ? ` · <a href="${esc(t.page)}" target="_blank" rel="noopener">source</a>` : ""}</li>`).join("") || "<li>No packs installed.</li>"}</ol><button type="button" data-sndx="1">Close</button></div>`); break; }
        case "ownlist": dlg(`<div class="snd-form"><h3>Your own sounds</h3><p class="kn">Kept in this browser only, never sent anywhere.</p><ul class="snd-cred">${S.own.map(it => `<li>${esc(it.name)} <span class="kn">${it.loop ? "loops" : "plays once"} · ${fmt(it.dur)}</span> <button type="button" data-sndforget="${esc(it.id)}">Forget it</button></li>`).join("")}</ul><button type="button" data-sndx="1">Close</button></div>`).addEventListener("click", ev => { const f = ev.target.closest("[data-sndforget]"); if (f) { forgetOwn(f.dataset.sndforget); f.closest("li").remove(); } }); break;
      }
    });
    el.addEventListener("input", e => {
      const t = e.target;
      if (t.classList.contains("snd-q")) { S.q = t.value; clearTimeout(S.qt); S.qt = setTimeout(() => { const pos = t.selectionStart; paint(); const q = el.querySelector(".snd-q"); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }, 160); return; }
      if (t.dataset.sndv) { setLayer(t.dataset.sndv, +t.value); return; }
      if (t.dataset.sndev) { const E = S.events.get(t.dataset.sndev); if (E) E.v = +t.value; return; }
      if (t.dataset.sndmaster) { S.vol = +t.value; pref.set("vol", S.vol); if (S.out) S.out.gain.setTargetAtTime(S.vol, S.ac.currentTime, .1); }
    });
    el.addEventListener("change", async e => {
      const t = e.target;
      if (t.dataset.sndadd && t.files && t.files.length) { const n = (await addOwn([...t.files])).length; t.value = ""; if (A.tableUI) A.tableUI.api.note(n ? `${n} sound${n === 1 ? "" : "s"} of your own added, kept in this browser.` : "Those files could not be read as sound."); }
      if (t.dataset.sndpref) pref.set(t.dataset.sndpref, t.checked);
    });
  }
  /* ---- the narrator's cues: [sound: thunder] plays a sound, [scene: storm] starts a scene, [stop sounds] stops them */
  const CUE = /\[(sound|scene|stop sounds?)(?::\s*([^\]]+))?\]/gi;
  function cue(kind, what) {
    kind = kind.toLowerCase(); if (/^stop/.test(kind)) { stopAll(); return; }
    const w = String(what || "").trim(); if (kind === "scene") { const sc = allScenes().find(s => s.id === w || s.name.toLowerCase() === w.toLowerCase()) || search(w).scenes[0]; if (sc) startScene(sc); return; }
    const it = S.items.get(w) || search(w).sounds.find(x => !x.loop) || search(w).sounds[0]; if (it) { if (it.loop) startLayer(it.id, .6); else play(it.id, { vol: .85 }); }
  }

  A.sound = {
    SCENES, load, play, start: startLayer, set: setLayer, stop: stopLayer, scene: startScene, stopAll, duck, search, open: openPanel, items: () => [...S.items.values()], packs: () => S.packs.slice(), playing: () => ({ layers: [...S.layers.keys()], events: [...S.events.keys()], scene: S.scene }), credits,
    has: id => S.items.has(id), sceneForPlace, addOwn, saveScene, dropScene, cue, CUE,
    // for the music: whether a texture or an event of a theme has a recording, and that recording's sound for its own context
    recorded: key => { const id = MUSIC_KEY[key]; return soundsOn() && id && S.items.has(id) ? id : null; },
    bufferFor: (ac, id) => { const it = S.items.get(id); if (!it) return Promise.reject(new Error("no " + id)); return bufferOf(ac, pickTake(it), it); },
    item: id => S.items.get(id) || null,
    tracks: () => [...S.items.values()].filter(it => it.cat === "music").sort((a, b) => a.title.localeCompare(b.title)).map(it => ({ id: it.id, title: it.title || it.name, composer: it.composer || "", moods: it.moods || [], genre: it.genre || "", dur: it.dur, licence: (it.takes[0] || {}).licence || "", url: it.base + (it.takes[0] || {}).file })),
    track: id => { const it = S.items.get(id); return it && it.cat === "music" ? { id, title: it.title || it.name, composer: it.composer || "", licence: (it.takes[0] || {}).licence || "", url: it.base + (it.takes[0] || {}).file } : null; },
    level: () => { if (!S.an) return -Infinity; const d = new Float32Array(S.an.fftSize); S.an.getFloatTimeDomainData(d); let q = 0; for (const v of d) q += v * v; return 10 * Math.log10(q / d.length + 1e-12); },
    state: () => S.ac ? S.ac.state : "none",
    html: () => (A.modules && !A.modules.on("sounds")) || (A.music && A.music.enabled && !A.music.enabled()) ? "" : `<div class="music snd-wrap" role="group" aria-label="Sounds"><button type="button" id="snd-btn" class="snd-btn" aria-pressed="false" aria-expanded="false" aria-controls="sndPanel" title="Sounds: ambiences that loop, sounds to play once, and scenes of several at a time"><span aria-hidden="true">≋</span> Sounds</button></div><div id="sndPanel" class="snd-panel" role="dialog" aria-label="Sounds" hidden></div>`
  };
  // the button beside the music's, wherever the page draws the music bar
  document.addEventListener("click", e => { if (!e.target.closest) return; const b = e.target.closest("#snd-btn"); if (b) { openPanel(); return; } if (S.open && !e.target.closest("#sndPanel") && !e.target.closest("#sndDlg") && document.contains(e.target)) openPanel(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && S.open) { const d = document.getElementById("sndDlg"); if (d && d.open) return; openPanel(false); } });
  // a place opened: its scene, when the game master chose that
  const place0 = A.music && A.music.place;
  if (place0) A.music.place = id => { place0(id); if (!pref.get("place", false) || id === S.lastPlace) return; S.lastPlace = id; const sc = sceneForPlace(id); if (sc) load().then(() => { if (playable(sc)) startScene(sc); }); };
  // the day's weather outdoors (atlas-weather.js gives the music its air): its rain, wind and thunder as recordings too
  const air0 = A.music && A.music.air;
  if (air0) A.music.air = a => { air0(a); if (!pref.get("weather", true) || !S.layers.size && !S.events.size) return; const W = a || {}; if (W.rain) startLayer(W.rain > .5 ? "rain-heavy" : "rain-light", Math.min(.8, .3 + W.rain * .5)); else { stopLayer("rain-light"); stopLayer("rain-heavy"); } if (W.thunder) startEvent("thunder", 20, 60, .7); else stopEvent("thunder"); };
  setTimeout(() => { if (!A.modules || A.modules.on("sounds")) load(); }, 1500);
})(typeof ATLAS !== "undefined" ? ATLAS : {});
