/* ================================================================
   CAMPAIGN ATLAS: THE AI NARRATOR
   Natural voices made on the game master's own computer (the user's audio requests of 11 Nov 2026, approved: "do all
   of em then ill choose if something is bad"): free models that run in this page, in a background worker, on the
   graphics card when the browser offers it. Nothing is sent anywhere to be spoken. They are installed in the Atlas
   app (its lib/voices.js), which serves them to the page; where they are not installed, the narrator reads with the
   browser's own voices as before (atlas-voice.js).
     Kokoro   Performance: natural, quick, speaks as it goes (it makes the next sentence while one is read).
     Piper    light: two clean voices, very quick, for any computer.
   Four narrators, as the user described them, each with options to choose from:
     science fiction  a calm woman's voice close in your ear, like a mission's handler, with a soft echo;
     Call of Cthulhu  an old British man, slow and ominous, like a board game's narrator of cosmic horror;
     modern           a plain modern voice (the user did not know which: several to choose from);
     fantasy          a warm British woman telling a tale, like a fantasy role-playing game's narrator.
   Each has its pitch (in semitones, without changing its speed) and speed (without changing its pitch), set where the
   measured voice was not yet what the user described, and moved freely: "you know how we can edit the pitch and speed
   of the narator if its not exactly how we want it you should edit that". No voice is made from a real person.
   ================================================================ */
(function (A) {
  "use strict";
  if (typeof window === "undefined") return;
  const app = () => window.ATLAS_APP && window.ATLAS_APP.voices;
  const base = () => new URL((app() && app().base) || "/voices/", location.href).href;
  // [id, narrator, label, engine, voice (a Kokoro voice, two blended "a+b:share", or Piper's model#speaker), its own speed,
  //  pitch, speed, echo, what it is]. The first of each narrator is where it starts.
  // (each starts as the model makes it, its pitch untouched: shifting it afterwards adds a mechanical edge, and the user
  // heard Kokoro unprocessed as "waaay better", 11 Nov 2026. The pitch measured to suit the narrator described is kept
  // as a suggestion, to try: sug)
  const P = (id, type, label, engine, voice, rate, pitch, speed, echo, note) => ({ id, type, label, engine, voice, rate, pitch: 0, sug: pitch, speed, echo: !!echo, note });
  const PRESETS = [
    P("k-heart-nicole", "scifi", "Heart and Nicole, blended", "kokoro", "af_heart+af_nicole:.5", .95, 1, 1.1, 1, "between Kokoro's best voice and its softest"),
    P("k-nicole", "scifi", "Nicole, soft and close", "kokoro", "af_nicole", .95, 1, 1.1, 1, "breathy, as if in your ear"),
    P("k-heart", "scifi", "Heart", "kokoro", "af_heart", .95, .5, 1.05, 1, "Kokoro's best voice"),
    P("k-bella", "scifi", "Bella", "kokoro", "af_bella", .95, .5, 1.1, 1, "warm"),
    P("k-sky", "scifi", "Sky", "kokoro", "af_sky", .95, 1, 1.1, 1, "low and even"),
    P("k-emma-s", "scifi", "Emma", "kokoro", "bf_emma", .95, 1, 1.1, 1, "British"),
    P("p-759", "scifi", "Piper, reader 759", "piper", "en_US-libritts-high#759", 1, 1, .85, 1, "light, more mechanical"),
    P("p-lj-s", "scifi", "Piper, LJSpeech", "piper", "en_US-ljspeech-high#0", 1, 1, .8, 1, "light, clear, more mechanical"),
    P("k-lewis", "cthulhu", "Lewis, slow", "kokoro", "bm_lewis", .85, 0, 1.1, 0, "British man, deepest"),
    P("k-george-lewis", "cthulhu", "George and Lewis, blended, slow", "kokoro", "bm_george+bm_lewis:.4", .82, -4, 1.1, 0, "two British men, deep"),
    P("k-george", "cthulhu", "George, slow", "kokoro", "bm_george", .85, -4, 1.05, 0, "British man"),
    P("k-fable", "cthulhu", "Fable, slow", "kokoro", "bm_fable", .85, -3, .95, 0, "British man"),
    P("k-daniel", "cthulhu", "Daniel, slow", "kokoro", "bm_daniel", .85, -4, .9, 0, "British man"),
    P("k-george-fable", "cthulhu", "George and Fable, blended, slow", "kokoro", "bm_george+bm_fable:.5", .85, -4, 1, 0, "two British men"),
    P("p-805", "cthulhu", "Piper, reader 805", "piper", "en_US-libritts-high#805", 1, 0, .8, 0, "light, very deep, more mechanical"),
    P("p-736", "cthulhu", "Piper, reader 736", "piper", "en_US-libritts-high#736", 1, 0, .8, 0, "light, deep, more mechanical"),
    P("k-michael", "modern", "Michael", "kokoro", "am_michael", 1, 0, 1, 0, "American man"),
    P("k-fenrir", "modern", "Fenrir", "kokoro", "am_fenrir", 1, 0, 1, 0, "American man, brighter"),
    P("k-puck", "modern", "Puck", "kokoro", "am_puck", 1, 0, 1, 0, "American man, low"),
    P("k-michael-fenrir", "modern", "Michael and Fenrir, blended", "kokoro", "am_michael+am_fenrir:.5", 1, 0, 1, 0, "between the two"),
    P("k-heart-m", "modern", "Heart", "kokoro", "af_heart", 1, 0, 1, 0, "American woman"),
    P("k-sarah", "modern", "Sarah", "kokoro", "af_sarah", 1, 0, 1, 0, "American woman"),
    P("p-414", "modern", "Piper, reader 414", "piper", "en_US-libritts-high#414", 1, 0, 1, 0, "light, more mechanical"),
    P("p-lj-m", "modern", "Piper, LJSpeech", "piper", "en_US-ljspeech-high#0", 1, 0, 1, 0, "light, clear, more mechanical"),
    P("k-emma-isabella", "fantasy", "Emma and Isabella, blended", "kokoro", "bf_emma+bf_isabella:.5", .92, -1.5, 1.05, 0, "two British women"),
    P("k-emma", "fantasy", "Emma, unhurried", "kokoro", "bf_emma", .92, 0, 1.05, 0, "British woman"),
    P("k-isabella", "fantasy", "Isabella, unhurried", "kokoro", "bf_isabella", .92, -2.5, 1.05, 0, "British woman"),
    P("k-emma-heart", "fantasy", "Emma and Heart, blended", "kokoro", "bf_emma+af_heart:.35", .92, -.5, 1.05, 0, "British, warmer"),
    P("k-bella-f", "fantasy", "Bella, unhurried", "kokoro", "af_bella", .92, -1, 1.1, 0, "American woman, warm"),
    P("p-460", "fantasy", "Piper, reader 460", "piper", "en_US-libritts-high#460", 1, 0, .8, 0, "light, more mechanical"),
    P("p-575", "fantasy", "Piper, reader 575", "piper", "en_US-libritts-high#575", 1, -.5, .8, 0, "light, more mechanical")
  ];
  const TYPES = [["scifi", "Science fiction"], ["cthulhu", "Call of Cthulhu"], ["modern", "Modern"], ["fantasy", "Fantasy"]];
  // the campaign's own narrator, from its world (campaign.js genre)
  // (its genre when campaign.js names one; else its setting, era and title: "Kestrel Station, 2291" is science fiction)
  function typeFor() {
    const C = A.config || {}, g = String(C.genre || "").toLowerCase(), t = [C.genre, C.subgenre, C.setting, C.era, C.title].filter(Boolean).join(" ").toLowerCase();
    if (/sci|space|future|cyber/.test(g)) return "scifi"; if (/fantasy|sword|myth/.test(g)) return "fantasy"; if (/modern|crime|thriller|noir|contemporary/.test(g)) return "modern";
    const yr = +((t.match(/\b(1[0-9]{3}|2[0-9]{3})\b/) || [])[1] || 0);
    if (/\b(station|starship|spaceship|orbit|planet|moon base|galaxy|colony|android|cyber)/.test(t) || yr > 2100) return "scifi";
    if (/\b(realm|kingdom|dragon|elves|elf|dwarf|wizard|sorcer|keep|reach|duchy)/.test(t) || yr && yr < 1500) return "fantasy";
    if (yr >= 1950) return "modern";
    return "cthulhu";
  }

  /* ---- the workers: each engine in its own, its files from the app */
  const WORKER = {
    kokoro: (root) => `import { KokoroTTS, env } from ${JSON.stringify(root + "kokoro/kokoro.web.js")};
const ROOT = ${JSON.stringify(root + "kokoro/")}, HF = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/";
let BLENDS = {}; const f0 = self.fetch.bind(self);
// (the model and its voices are asked for by their Hugging Face addresses: they come from the app instead; a blend of two
// voices, the average of their style vectors, is served under a spare voice's name)
self.fetch = async (u, o) => { const s = typeof u === "string" ? u : u.url; if (s.startsWith(HF)) { const rest = s.slice(HF.length), m = /^voices\\/([a-z_]+)\\.bin$/.exec(rest);
  if (m && BLENDS[m[1]]) { const [a, b, w] = BLENDS[m[1]], A1 = new Float32Array(await (await f0(ROOT + "model/voices/" + a + ".bin")).arrayBuffer()), B1 = new Float32Array(await (await f0(ROOT + "model/voices/" + b + ".bin")).arrayBuffer()), C = new Float32Array(A1.length); for (let i = 0; i < C.length; i++) C[i] = A1[i] * (1 - w) + B1[i] * w; return new Response(C.buffer); }
  return f0(ROOT + "model/" + rest, o); } return f0(u, o); };
env.wasmPaths = ROOT;
let tts = null;
onmessage = async e => { const { id, op } = e.data; try {
  if (op === "load") { BLENDS = e.data.blends || {}; const t0 = performance.now(); let dev = e.data.device; try { tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: dev }); } catch (x) { if (dev !== "wasm") { dev = "wasm"; tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "wasm" }); } else throw x; } postMessage({ id, ok: true, ms: performance.now() - t0, device: dev }); return; }
  if (op === "say") { const t0 = performance.now(), a = await tts.generate(e.data.text, { voice: e.data.voice, speed: (e.data.rate || 1) * (e.data.speed || 1) }); const pcm = shape(new Float32Array(a.audio), e.data.pitch || 0, 1); /* its speed set in the model itself, untouched after: the user heard the stretched voice as robotic, 11 Nov 2026 */ postMessage({ id, ok: true, ms: performance.now() - t0, sr: a.sampling_rate, pcm }, [pcm.buffer]); }
} catch (err) { postMessage({ id, ok: false, error: String((err && err.message) || err).slice(0, 400) }); } };
${SHAPE}`,
    piper: (root) => `const ROOT = ${JSON.stringify(root + "piper/")}, HF = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main/en/en_US/", f0 = self.fetch.bind(self);
self.fetch = (u, o) => { const s = typeof u === "string" ? u : u.url; if (s.startsWith(HF)) { const n = s.slice(HF.length).split("/").pop(); return f0(ROOT + "models/" + n, o); } return f0(u, o); };
let S = null, cur = "";
onmessage = async e => { const { id, op } = e.data; try {
  if (op === "load" || op === "say" && e.data.model !== cur) { const P = await import(ROOT + "piper-tts-web.js"), t0 = performance.now(), model = e.data.model || "en_US-libritts-high"; S = await P.TtsSession.create({ voiceId: model, wasmPaths: { onnxWasm: ROOT + "ort/", piperData: ROOT + "phonemize/piper_phonemize.data", piperWasm: ROOT + "phonemize/piper_phonemize.wasm" } }); cur = model; if (op === "load") { postMessage({ id, ok: true, ms: performance.now() - t0, device: "wasm" }); return; } }
  if (op === "say") { globalThis.__piperSpeaker = e.data.speaker | 0; const t0 = performance.now(), wav = await S.predict(e.data.text), buf = await wav.arrayBuffer(), dv = new DataView(buf); let o = 12, sr = 22050, data = null;
    while (o + 8 <= buf.byteLength) { const tag = String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3)), len = dv.getUint32(o + 4, true); if (tag === "fmt ") sr = dv.getUint32(o + 12, true); if (tag === "data") { data = new Int16Array(buf.slice(o + 8, o + 8 + len)); break; } o += 8 + len; }
    const x = new Float32Array(data.length); for (let i = 0; i < x.length; i++) x[i] = data[i] / 32768; const pcm = shape(x, e.data.pitch || 0, e.data.speed || 1); postMessage({ id, ok: true, ms: performance.now() - t0, sr, pcm }, [pcm.buffer]); }
} catch (err) { postMessage({ id, ok: false, error: String((err && err.message) || err).slice(0, 400) }); } };
${SHAPE}`
  };
  // pitch and speed, each without the other: time-stretched by WSOLA (overlapping pieces matched where they fit best),
  // then resampled. The same as the listening page of the trial, so a voice sounds here as it did there.
  var SHAPE = `function stretch(x, rate) { if (Math.abs(rate - 1) < 1e-3) return x; const N = 1024, Hs = 512, Ha = Hs * rate, tol = 220, w = new Float32Array(N); for (let i = 0; i < N; i++) w[i] = .5 - .5 * Math.cos(2 * Math.PI * i / N);
  const outLen = Math.ceil(x.length / rate) + N, out = new Float32Array(outLen), nrm = new Float32Array(outLen); let ip = 0, op = 0, prev = -1;
  while (ip + N + tol < x.length && op + N < outLen) { let c = Math.round(ip); if (prev >= 0) { const tgt = prev + Hs; let best = -Infinity; for (let d = -tol; d <= tol; d += 2) { const k = Math.round(ip) + d; if (k < 0 || k + N > x.length) continue; let sum = 0; for (let j = 0; j < N / 2; j += 4) sum += x[k + j] * x[tgt + j]; if (sum > best) { best = sum; c = k; } } }
    for (let j = 0; j < N; j++) { out[op + j] += x[c + j] * w[j]; nrm[op + j] += w[j]; } prev = c; ip += Ha; op += Hs; }
  for (let i = 0; i < op; i++) out[i] = nrm[i] > 1e-3 ? out[i] / nrm[i] : 0; return out.slice(0, op); }
function resample(x, f) { const n = Math.floor(x.length / f), y = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * f, a = Math.floor(p), t = p - a; y[i] = (x[a] || 0) * (1 - t) + (x[a + 1] || 0) * t; } return y; }
function shape(x, semis, speed) { const f = Math.pow(2, semis / 12); if (Math.abs(semis) < 1e-3) return stretch(x, speed); return resample(stretch(x, speed / f), f); }`;
  const W = {};
  function worker(engine) {
    if (W[engine]) return W[engine];
    const url = URL.createObjectURL(new Blob([WORKER[engine](base())], { type: "text/javascript" })), w = new Worker(url, { type: "module" }), wait = new Map(); let n = 0;
    w.onmessage = e => { const p = wait.get(e.data.id); if (!p) return; wait.delete(e.data.id); e.data.ok ? p[0](e.data) : p[1](new Error(e.data.error)); };
    w.onerror = e => { for (const [, p] of wait) p[1](new Error(e.message || "the voice could not start")); wait.clear(); delete W[engine]; };
    const call = msg => new Promise((ok, no) => { const id = ++n; wait.set(id, [ok, no]); w.postMessage(Object.assign({ id }, msg)); });
    const blends = {}; let spare = 0; const SPARE = ["am_santa", "am_adam", "af_jessica", "af_river", "bf_lily", "am_liam", "af_kore", "am_eric"];
    for (const p of PRESETS) if (p.engine === "kokoro" && p.voice.includes("+")) { const m = /^([a-z_]+)\+([a-z_]+):([\d.]+)$/.exec(p.voice); if (m) { p.kv = SPARE[spare++]; blends[p.kv] = [m[1], m[2], +m[3]]; } }
    W[engine] = { call, ready: (async () => { const gpu = engine === "kokoro" && navigator.gpu && await navigator.gpu.requestAdapter().catch(() => null); return call({ op: "load", device: gpu ? "webgpu" : "wasm", blends }); })() };
    W[engine].ready.then(r => { W[engine].info = r; }, () => { delete W[engine]; });
    return W[engine];
  }
  const voiceOf = p => p.engine === "kokoro" ? (p.kv || p.voice) : p.voice;
  async function make(p, text, adj) {
    const wk = worker(p.engine); await wk.ready;
    if (p.engine === "kokoro") return wk.call({ op: "say", text, voice: voiceOf(p), rate: p.rate, pitch: adj.pitch, speed: adj.speed });
    const [model, sp] = p.voice.split("#"); return wk.call({ op: "say", text, model, speaker: +sp || 0, pitch: adj.pitch, speed: adj.speed });
  }

  /* ---- playing it: each sentence made while the one before is read, with its pause after, and a cue where it stands */
  let AC = null, cur = null;
  const ctx = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
  // How robotic (the user, 11 Nov 2026: "add a slider to the scifi one how robotic you want them to sound"): at 0 the voice
  // as made; up from there, more and more of the metallic edge of a machine's voice (the voice multiplied by a low hum:
  // ring modulation) and the hollow ring of a speaker grille (a very short delay feeding itself: a comb)
  function robot(c, inp, out, r) {
    if (!(r > 0)) { inp.connect(out); return null; }
    const dry = c.createGain(); dry.gain.value = 1 - .55 * r; inp.connect(dry); dry.connect(out);
    const ring = c.createGain(); ring.gain.value = 0; const osc = c.createOscillator(); osc.type = "sine"; osc.frequency.value = 40 + 60 * r; osc.connect(ring.gain); osc.start();
    const rw = c.createGain(); rw.gain.value = .75 * r; inp.connect(ring); ring.connect(rw); rw.connect(out);
    const d = c.createDelay(.05); d.delayTime.value = .006 + .004 * r; const fb = c.createGain(); fb.gain.value = .35 + .45 * r; const cw = c.createGain(); cw.gain.value = .45 * r;
    inp.connect(d); d.connect(fb); fb.connect(d); d.connect(cw); cw.connect(out);
    return osc;
  }
  function echoOf(c) { const n = Math.floor(c.sampleRate * 1.6), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2) * .5; } return b; }
  // pieces: strings to read, and { cue } to play; adj: { pitch, speed, echo, volume, pause }; done(): when it has finished
  function speak(pieces, p, adj, hooks) {
    stop(); const c = ctx(), me = { stopped: false, srcs: [], timers: [] }; cur = me;
    c.resume();
    const out = c.createGain(); out.gain.value = adj.volume == null ? 1 : adj.volume; out.connect(c.destination); me.out = out;
    const inp = c.createGain(); me.osc = robot(c, inp, out, adj.robot || 0); me.inp = inp;
    if (adj.echo) { const cv = c.createConvolver(), wg = c.createGain(); cv.buffer = echoOf(c); wg.gain.value = .32; out.connect(cv); cv.connect(wg); wg.connect(c.destination); }
    let at = 0; const jobs = [];
    // (the next two sentences are being made while one is read)
    const want = i => { if (i >= pieces.length || jobs[i] || typeof pieces[i] !== "string") return; jobs[i] = make(p, pieces[i], adj); jobs[i].catch(() => {}); };
    (async () => {
      for (let i = 0; i < pieces.length && !me.stopped; i++) {
        const pc = pieces[i];
        if (typeof pc !== "string") { const when = Math.max(0, (at - c.currentTime) * 1000); me.timers.push(setTimeout(() => { if (!me.stopped && hooks.cue) hooks.cue(pc.cue); }, when)); continue; }
        want(i); for (let k = i + 1; k < pieces.length && k <= i + 3; k++) want(k);
        let r; try { r = await jobs[i]; } catch (e) { if (hooks.error) hooks.error(e); if (!me.stopped) { me.stopped = true; if (hooks.done) hooks.done(); } return; }
        if (me.stopped) return;
        const b = c.createBuffer(1, r.pcm.length, r.sr); b.copyToChannel(r.pcm, 0);
        const s = c.createBufferSource(); s.buffer = b; s.connect(inp); const t = Math.max(c.currentTime + .05, at); s.start(t); me.srcs.push(s);
        if (i === 0 && hooks.started) hooks.started();
        at = t + b.duration + (adj.pause == null ? .35 : adj.pause) * (/[.!?…]["'”’)\]]*$/.test(pc) ? .7 : /[,;:—–]["'”’)\]]*$/.test(pc) ? .35 : .1);
      }
      if (me.stopped) return;
      me.timers.push(setTimeout(() => { if (!me.stopped) { me.stopped = true; if (hooks.done) hooks.done(); } }, Math.max(0, (at - c.currentTime) * 1000)));
    })();
    return me;
  }
  function stop() { const m = cur; cur = null; if (!m) return; m.stopped = true; for (const s of m.srcs) try { s.stop(); } catch (e) {} for (const t of m.timers) clearTimeout(t); try { m.out.disconnect(); m.inp.disconnect(); if (m.osc) m.osc.stop(); } catch (e) {} }

  A.narratorAI = {
    PRESETS, TYPES, typeFor,
    // the engines installed in the app; none outside it
    engines: async () => { if (!app()) return []; try { return (await app().list()).filter(e => e.installed).map(e => e.id); } catch (e) { return []; } },
    available: () => !!app() && (!A.modules || A.modules.on("music", "voice")),
    preset: id => PRESETS.find(p => p.id === id) || null,
    speak, stop, speaking: () => !!cur,
    // (for the tests: whether an engine has started, and where)
    info: engine => W[engine] && W[engine].info || null,
    warm: engine => worker(engine).ready
  };
})(typeof ATLAS !== "undefined" ? ATLAS : {});
