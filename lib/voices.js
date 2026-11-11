// The AI narrator's voices (the user's audio requests of 11 Nov 2026, approved): speech made on this computer, by
// free models that run in the campaign page itself (in a background worker, on the graphics card when the browser
// offers it). Nothing is sent anywhere to be spoken. None ships with the app (they are hundreds of megabytes): each
// engine is installed with a click, its files downloaded once into data/voices/<engine>/ and served to the pages from
// there, so that afterwards it works with no internet:
//   kokoro      Kokoro-82M (Apache-2.0): natural, quick; Atlas's "Performance" narrator. About 360 MB.
//   piper       Piper (MIT; its phonemizer espeak-ng, GPL-3.0), two clean voices: LJSpeech (public domain) and LibriTTS
//               (CC BY 4.0, hundreds of readers). Very quick and light. About 270 MB.
//   chatterbox  Chatterbox (Resemble AI, MIT): expressive, its delivery from calm to dramatic; slow, so a passage is made
//               before it is read; Atlas's "Quality" narrator. About 1.5 GB.
// The libraries come from npm (by jsDelivr), the models from Hugging Face, at the versions the trial was made with
// (dev/narrator-trial/ in the workspace). A voice is never made from a real person's recording.
"use strict";
const fs = require("fs"), path = require("path");
const UA = "CampaignAtlas-app (voices)";
const NPM = "https://cdn.jsdelivr.net/npm/", HF = "https://huggingface.co/";
const KOKORO_VOICES = ["af_alloy", "af_aoede", "af_bella", "af_heart", "af_jessica", "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky", "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael", "am_onyx", "am_puck", "am_santa", "bf_alice", "bf_emma", "bf_isabella", "bf_lily", "bm_daniel", "bm_fable", "bm_george", "bm_lewis"];
const KO = HF + "onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/", ORT122 = NPM + "onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/dist/";
const PIPER = NPM + "@mintplex-labs/piper-tts-web@1.0.5/dist/", PW = NPM + "@diffusionstudio/piper-wasm@1.0.0/build/", ORT118 = NPM + "onnxruntime-web@1.18.0/dist/", RV = HF + "rhasspy/piper-voices/resolve/main/en/en_US/";
const TF4 = NPM + "@huggingface/transformers@4.3.2/dist/", CB = HF + "onnx-community/chatterbox-ONNX/resolve/main/";
// [where it is kept under data/voices/<engine>/, where it comes from]
const ENGINES = {
  kokoro: { name: "Kokoro (Performance)", say: "Natural voices, quick: speaks as it goes", mb: 360, licence: "Apache-2.0", files: [
    ["kokoro.web.js", NPM + "kokoro-js@1.2.1/dist/kokoro.web.js"], ["ort-wasm-simd-threaded.jsep.mjs", ORT122 + "ort-wasm-simd-threaded.jsep.mjs"], ["ort-wasm-simd-threaded.jsep.wasm", ORT122 + "ort-wasm-simd-threaded.jsep.wasm"],
    ["model/config.json", KO + "config.json"], ["model/tokenizer.json", KO + "tokenizer.json"], ["model/tokenizer_config.json", KO + "tokenizer_config.json"], ["model/onnx/model.onnx", KO + "onnx/model.onnx"],
    ...KOKORO_VOICES.map(v => ["model/voices/" + v + ".bin", KO + "voices/" + v + ".bin"])] },
  piper: { name: "Piper (light)", say: "Two clean voices, very quick and light", mb: 270, licence: "MIT (espeak-ng GPL-3.0); voices public domain and CC BY 4.0", files: [
    ["piper-tts-web.js", PIPER + "piper-tts-web.js", "patch"], ["piper-o91UDS6e.js", PIPER + "piper-o91UDS6e.js"], ["voices_static-D_OtJDHM.js", PIPER + "voices_static-D_OtJDHM.js"],
    ["ort/ort.wasm.min.js", ORT118 + "ort.wasm.min.js"], ["ort/ort-wasm-simd.wasm", ORT118 + "ort-wasm-simd.wasm"], ["ort/ort-wasm-simd-threaded.wasm", ORT118 + "ort-wasm-simd-threaded.wasm"],
    ["phonemize/piper_phonemize.js", PW + "piper_phonemize.js"], ["phonemize/piper_phonemize.wasm", PW + "piper_phonemize.wasm"], ["phonemize/piper_phonemize.data", PW + "piper_phonemize.data"],
    ["models/en_US-ljspeech-high.onnx", RV + "ljspeech/high/en_US-ljspeech-high.onnx"], ["models/en_US-ljspeech-high.onnx.json", RV + "ljspeech/high/en_US-ljspeech-high.onnx.json"], ["models/ljspeech-MODEL_CARD", RV + "ljspeech/high/MODEL_CARD"],
    ["models/en_US-libritts-high.onnx", RV + "libritts/high/en_US-libritts-high.onnx"], ["models/en_US-libritts-high.onnx.json", RV + "libritts/high/en_US-libritts-high.onnx.json"], ["models/libritts-MODEL_CARD", RV + "libritts/high/MODEL_CARD"]] },
  chatterbox: { name: "Chatterbox (Quality)", say: "Expressive, from calm to dramatic; slow, so a passage is made before it is read", mb: 1550, licence: "MIT", files: [
    ["transformers.min.js", TF4 + "transformers.min.js"], ["ort-wasm-simd-threaded.jsep.mjs", TF4 + "ort-wasm-simd-threaded.jsep.mjs"], ["ort-wasm-simd-threaded.jsep.wasm", TF4 + "ort-wasm-simd-threaded.jsep.wasm"],
    ["ort-wasm-simd-threaded.asyncify.mjs", TF4 + "ort-wasm-simd-threaded.asyncify.mjs"], ["ort-wasm-simd-threaded.asyncify.wasm", TF4 + "ort-wasm-simd-threaded.asyncify.wasm"],
    ...["config.json", "generation_config.json", "preprocessor_config.json", "tokenizer.json", "tokenizer_config.json", "default_voice.wav"].map(n => ["model/chatterbox/" + n, CB + n]),
    ...["embed_tokens", "speech_encoder", "language_model_q4", "conditional_decoder"].flatMap(n => [["model/chatterbox/onnx/" + n + ".onnx", CB + "onnx/" + n + ".onnx"], ["model/chatterbox/onnx/" + n + ".onnx_data", CB + "onnx/" + n + ".onnx_data"]])] }
};
// Piper's library asks for its runtime by a package name, which a page has no way to find: it is pointed at the file
function patch(name, buf) { if (name === "piper-tts-web.js") return Buffer.from(buf.toString("utf8").replace(/import\((["'])onnxruntime-web\/wasm\1\)/g, 'import("./ort/ort.wasm.min.js")').replace(/const speakerId = 0;/g, "const speakerId = (globalThis.__piperSpeaker | 0);")); return buf; }

function create({ DATA, seed }) {
  const DIR = path.join(DATA, "voices"), busy = {}, prog = {};
  const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
  const installed = () => { const j = readJSON(path.join(DIR, "installed.json")) || {}; return Object.keys(ENGINES).filter(k => j[k] && fs.existsSync(path.join(DIR, k))).map(k => Object.assign({ id: k }, j[k])); };
  const mark = (k, v) => { const j = readJSON(path.join(DIR, "installed.json")) || {}; if (v) j[k] = v; else delete j[k]; fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, "installed.json"), JSON.stringify(j, null, 1)); };
  const list = () => Object.entries(ENGINES).map(([id, e]) => ({ id, name: e.name, say: e.say, mb: e.mb, licence: e.licence, installed: installed().some(x => x.id === id), installing: !!busy[id], progress: prog[id] || null }));
  async function get(url, to, onBytes) {
    for (let t = 0; t < 4; t++) {
      try {
        const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30 * 60e3) }); if (!r.ok) throw new Error("HTTP " + r.status);
        fs.mkdirSync(path.dirname(to), { recursive: true }); const tmp = to + ".part", w = fs.createWriteStream(tmp);
        for await (const c of r.body) { w.write(Buffer.from(c)); if (onBytes) onBytes(c.length); }
        await new Promise((ok, no) => w.end(e => e ? no(e) : ok())); fs.renameSync(tmp, to); return;
      } catch (e) { if (t === 3) throw new Error("could not download " + url.replace(/^https:\/\/[^/]+\//, "") + " (" + e.message + ")"); await new Promise(o => setTimeout(o, 4000 * (t + 1))); }
    }
  }
  // (seed: a folder on this computer that already has the files, by the same names; the workspace's narrator trial)
  async function install(id) {
    const E = ENGINES[id]; if (!E) throw new Error("There is no such voice engine.");
    if (busy[id]) return busy[id];
    busy[id] = (async () => {
      const dest = path.join(DIR, id); prog[id] = { done: 0, of: E.files.length, mb: 0 };
      for (const [name, url, how] of E.files) {
        const to = path.join(dest, name);
        if (!(fs.existsSync(to) && fs.statSync(to).size > 0)) {
          const local = seed && seed(id, name);
          if (local && fs.existsSync(local)) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(local, to); }
          else await get(url, to, n => { prog[id].mb += n / 1e6; });
          if (how === "patch") fs.writeFileSync(to, patch(name, fs.readFileSync(to)));
        }
        prog[id].done++;
      }
      mark(id, { t: Date.now(), name: E.name });
      return { ok: true, id };
    })().finally(() => { delete busy[id]; delete prog[id]; });
    return busy[id];
  }
  function remove(id) { if (!ENGINES[id]) throw new Error("Which voice engine?"); fs.rmSync(path.join(DIR, id), { recursive: true, force: true }); mark(id, null); return { ok: true }; }
  function fileOf(rel) { const f = path.normalize(path.join(DIR, rel)); if (!f.startsWith(DIR + path.sep)) return null; return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null; }
  return { DIR, ENGINES, list, installed, install, remove, fileOf };
}
module.exports = { create, ENGINES, patch };
