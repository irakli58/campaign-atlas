// Local AI on this computer, through Ollama (the user, 17 Nov 2026: docs/requests/2026-11-17-local-ai.md; the plan:
// docs/plans/2026-11-17-local-ai-plan.md). Ollama runs the models (llama.cpp underneath: CUDA, ROCm, Metal, or the CPU),
// keeps them on this computer and answers on 127.0.0.1:11434; Atlas never bundles a model and never installs anything by
// itself: a model is pulled only when the game master presses Download, its size shown first.
// The catalogue is one list in this file, so it is easy to bring up to date: the sizes are Ollama's own downloads at their
// default 4-bit quantisation (approximate), the memory what the model needs loaded with a modest context.
"use strict";
const http = require("http");

const HOST = { host: "127.0.0.1", port: 11434 };
// [ollama tag, name, family, download GB, memory GB loaded, licence, what it is good at, notes]
const CATALOGUE = [
  ["llama3.2:3b", "Llama 3.2 3B", "Llama", 2.0, 3.5, "Llama 3.2 Community Licence", "quick replies, short NPC lines", "small: plain prose, weak at long plots"],
  ["qwen3:4b", "Qwen3 4B", "Qwen", 2.6, 4.5, "Apache 2.0", "fast answers, structured data (JSON)", "a thinking mode for harder questions"],
  ["gemma3:4b", "Gemma 3 4B", "Gemma", 3.3, 5, "Gemma Terms of Use", "fast, natural dialogue", ""],
  ["qwen3:8b", "Qwen3 8B", "Qwen", 5.2, 7, "Apache 2.0", "NPCs, structured data, the copilot on a mid-range computer", ""],
  ["mistral-nemo:12b", "Mistral Nemo 12B", "Mistral", 7.1, 9.5, "Apache 2.0", "prose and character voice", "long context (128k)"],
  ["gemma3:12b", "Gemma 3 12B", "Gemma", 8.1, 10.5, "Gemma Terms of Use", "creative writing, worldbuilding", ""],
  ["qwen3:14b", "Qwen3 14B", "Qwen", 9.3, 12, "Apache 2.0", "reasoning, mysteries, structured data", ""],
  ["gpt-oss:20b", "gpt-oss 20B", "OpenAI open-weight", 14, 16, "Apache 2.0", "reasoning, following instructions", "a mixture of experts: quick for its size"],
  ["mistral-small3.2:24b", "Mistral Small 3.2 24B", "Mistral", 15, 18, "Apache 2.0", "long-form story, the councils' voices", ""],
  ["gemma3:27b", "Gemma 3 27B", "Gemma", 17, 21, "Gemma Terms of Use", "creative writing, lore", ""],
  ["qwen3:30b", "Qwen3 30B-A3B", "Qwen", 19, 22, "Apache 2.0", "strong and fast (3B active): good on a computer with much memory and no large GPU", "a mixture of experts"],
  ["qwen3:32b", "Qwen3 32B", "Qwen", 20, 24, "Apache 2.0", "the copilot, mysteries, campaign writing", ""],
  ["llama3.3:70b", "Llama 3.3 70B", "Llama", 43, 48, "Llama 3.3 Community Licence", "the best prose of these, long campaigns", "needs a workstation"],
  ["gpt-oss:120b", "gpt-oss 120B", "OpenAI open-weight", 65, 70, "Apache 2.0", "the strongest reasoning here", "needs a workstation"]
].map(([tag, name, family, dlGB, memGB, licence, good, notes]) => ({ tag, name, family, dlGB, memGB, licence, good, notes }));

// how much memory a model may use, and how fast it will be there: a discrete GPU's own memory (fast); Apple silicon's
// shared memory (about two thirds usable by the GPU; fast enough); otherwise the CPU and system memory (slow)
function budget(hw, over) {
  const o = over || {}, g = (hw.gpus || []).filter(x => x.vramGB || x.unified), best = g.sort((a, b) => (b.vramGB || 0) - (a.vramGB || 0))[0];
  const ram = +o.ramGB || hw.ramGB || 8, vram = o.vramGB != null && o.vramGB !== "" ? +o.vramGB : best && best.vramGB ? best.vramGB : null;
  if (hw.appleSilicon || (best && best.unified)) return { where: "unified", gb: Math.round(ram * .66 * 10) / 10, speed: "good", why: `Apple silicon shares its ${ram} GB with the GPU; about two thirds of it can hold a model` };
  if (vram) return { where: "gpu", gb: vram, ram, speed: "fast", why: `the GPU's own ${vram} GB${o.vramGB ? " (as you entered)" : ""}` };
  return { where: "cpu", gb: Math.round(ram * .55 * 10) / 10, speed: "slow", why: `no GPU memory could be read, so the processor and ${ram} GB of system memory (slower; enter the GPU's memory if it has one)` };
}

// the recommendations: best quality, balanced, fastest, low memory; each with why
function recommend(hw, over, bench) {
  const B = budget(hw, over), fits = m => m.memGB <= B.gb, room = m => m.memGB <= B.gb * .6;
  const ok = CATALOGUE.filter(fits), score = m => m.memGB;
  const pick = (list, f) => list.length ? list.reduce((a, b) => f(a, b) ? a : b) : null;
  const best = pick(ok, (a, b) => score(a) >= score(b));
  const balanced = pick(CATALOGUE.filter(room), (a, b) => score(a) >= score(b)) || best;
  const fastest = (B.where === "cpu" && fits(CATALOGUE.find(m => m.tag === "qwen3:30b")) ? CATALOGUE.find(m => m.tag === "qwen3:30b") : null) || CATALOGUE.find(m => m.tag === "qwen3:4b");
  const low = CATALOGUE.find(m => m.tag === "llama3.2:3b");
  const moe = m => /mixture of experts/.test(m.notes + " " + m.good), speedOf = m => { const b = bench && bench[m.tag]; if (b && b.tps) return `measured: ${b.tps} tokens a second`; return B.where === "cpu" ? (m.memGB > 10 && !moe(m) ? "slow (a few tokens a second)" : "usable") : m.memGB > B.gb * .85 ? "usable" : "quick"; };
  const say = (m, why) => m ? Object.assign({}, m, { why, speed: speedOf(m) }) : null;
  const tier = B.where === "cpu" ? "Light local AI (on the processor)" : B.gb >= 40 ? "Workstation local AI" : B.gb >= 20 ? "Strong local AI" : B.gb >= 10 ? "Balanced local AI" : "Light local AI";
  return {
    budget: B, tier,
    picks: [
      ["Best quality", say(best, best ? `the largest model that fits: ${B.why}` : "nothing in the list fits: try the low-memory pick")],
      ["Balanced", say(balanced, "fits with room left for a long context and the rest of your work")],
      ["Fastest", say(fastest, fastest && fastest.tag === "qwen3:30b" ? "a mixture of experts: only 3 billion of its parameters work at once, so it is quick even on the processor" : "small and quick: good for live sessions")],
      ["Low memory", say(low, "the smallest useful model")]
    ].filter(([, m]) => m),
    note: "Estimates from the models' sizes; run the benchmark to measure this computer."
  };
}

/* ---- Ollama: is it here, what does it hold, pull a model, measure one, ask one */
function req(method, path, body, onLine, ms) {
  return new Promise((res, rej) => {
    const r = http.request(Object.assign({}, HOST, { method, path, headers: { "content-type": "application/json" }, timeout: ms || 3000 }), resp => {
      let buf = "", all = "";
      resp.on("data", d => { const s = String(d); all += s; if (onLine) { buf += s; let i; while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (line.trim()) { try { onLine(JSON.parse(line)); } catch (e) {} } } } });
      resp.on("end", () => { if (resp.statusCode >= 400) return rej(new Error("Ollama: " + all.slice(0, 200))); try { res(onLine ? null : JSON.parse(all || "{}")); } catch (e) { res(all); } });
    });
    r.on("timeout", () => { r.destroy(new Error("Ollama did not answer in time.")); });
    r.on("error", rej);
    if (body) r.write(JSON.stringify(body)); r.end();
  });
}
async function status() {
  try { const v = await req("GET", "/api/version"), t = await req("GET", "/api/tags"); return { running: true, version: v.version || null, models: (t.models || []).map(m => ({ tag: m.name, sizeGB: Math.round(m.size / 1073741824 * 10) / 10 })) }; }
  catch (e) { return { running: false, why: "Ollama is not running on this computer (or not installed)." }; }
}
const PULLS = {};
function pull(tag) {
  if (!CATALOGUE.some(m => m.tag === tag)) return Promise.reject(new Error("Not a model of the list."));
  if (PULLS[tag] && !PULLS[tag].done) return Promise.resolve(PULLS[tag]);
  const P = PULLS[tag] = { tag, done: false, part: 0, total: 0, status: "starting" };
  req("POST", "/api/pull", { model: tag, stream: true }, l => { P.status = l.status || P.status; if (l.total) { P.total = l.total; P.part = l.completed || P.part; } if (l.error) { P.error = l.error; P.done = true; } }, 6 * 3600e3).then(() => { P.done = true; if (!P.error) P.status = "ready"; }, e => { P.done = true; P.error = e.message; });
  return Promise.resolve(P);
}
// a short, fixed test: how long to load and to begin, and how many tokens a second (Ollama's own counts)
async function bench(tag) {
  const t0 = Date.now(), r = await req("POST", "/api/generate", { model: tag, prompt: "In two sentences, describe a tavern on a rainy night in a medieval town.", stream: false, options: { num_predict: 120, temperature: .7 } }, null, 600e3);
  const ns = 1e9, tps = r.eval_count && r.eval_duration ? Math.round(r.eval_count / (r.eval_duration / ns) * 10) / 10 : null;
  return { tag, tps, loadS: r.load_duration ? Math.round(r.load_duration / ns * 10) / 10 : null, firstS: r.prompt_eval_duration ? Math.round((r.load_duration + r.prompt_eval_duration) / ns * 10) / 10 : null, wallS: Math.round((Date.now() - t0) / 100) / 10, at: Date.now() };
}
// a question answered by the chosen local model (the page's "Ask", the copilot and the rest, when the game master chose
// Local): nothing leaves this computer
// (the question's answer as JSON when it asks for JSON: Ollama keeps the model to valid JSON; careful, for writing and
// checking when preparing: a draft, then the model reads its draft against the question and mends what does not hold:
// the plan-check-mend that lets a small model do better, at about twice the time; fast for live answers)
const clean = t => String(t || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
const gen = (tag, prompt, o) => req("POST", "/api/generate", Object.assign({ model: tag, prompt: String(prompt).slice(0, 60000), stream: false, options: { num_ctx: 8192, temperature: o.temp != null ? o.temp : .7 }, keep_alive: "10m" }, o.json ? { format: "json" } : {}), null, 600e3).then(r => clean(r.response));
async function ask(tag, prompt, opts) {
  const o = opts || {}, json = /\bjson\b/i.test(String(prompt).slice(-1500));
  const draft = await gen(tag, prompt, { json });
  if (!o.careful) return draft;
  const check = `${prompt}\n\n---\nA first answer was written:\n${draft}\n\n---\nRead the first answer against everything above: what the question asked, the campaign's facts and names given, and any rule it set (length, form, JSON). Mend every mistake, contradiction or thing left out, and keep what was right. Answer with the mended answer only, in the same form${json ? " (JSON only)" : ""}, nothing about the checking.`;
  try { const fixed = await gen(tag, check, { json, temp: .4 }); return fixed || draft; } catch (e) { return draft; }
}

module.exports = { CATALOGUE, budget, recommend, status, pull, PULLS, bench, ask };
