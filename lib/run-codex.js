// Makes a campaign with OpenAI's Codex, through the Codex SDK and the game master's own OpenAI API key. Codex reads the
// workspace's AGENTS.md (the same house rules as Claude's CLAUDE.md), which sends it to Atlas's handbook.
"use strict";
const deps = require("./deps");
const { nice, checkLine } = require("./narrate");

// Codex picks its own current model unless told otherwise
const MODELS = { default: { label: "Codex's own choice of model", note: "OpenAI's current coding model" } };
const DEFAULT_MODEL = "default";

// is the key good? (listing the models a key can use costs nothing)
async function verify(key) {
  const r = await fetch("https://api.openai.com/v1/models", { headers: { authorization: "Bearer " + key } });
  if (!r.ok) throw Object.assign(new Error((await r.text().catch(() => "")).slice(0, 300) || "HTTP " + r.status), { status: r.status });
  await deps.install("openai");
  return { model: DEFAULT_MODEL, name: "OpenAI Codex" };
}

function describe(item, slug) {
  switch (item.type) {
    case "file_change": return (item.changes || []).map(c => (c.kind === "add" ? "Writing " : c.kind === "delete" ? "Removing " : "Revising ") + nice(c.path, slug)).join("; ");
    case "command_execution": { const m = String(item.command || "").match(/atlas\.js\s+(\w+)/); return m ? ({ check: "Checking the campaign against Atlas's standards", build: "Building the page", city: "Making the map of the whole", status: "Taking stock of the places" }[m[1]] || "Running Atlas: " + m[1]) : null; }
    case "web_search": return "Searching the web: " + String(item.query || "").slice(0, 120);
    default: return null;
  }
}

async function run({ slug, workspace, configDir, key, model, prompt, resume, abort, emit }) {
  await deps.install("openai");
  const { Codex } = await deps.load("@openai/codex-sdk");
  // its own home folder, so a ChatGPT sign-in on this computer is never used: only the key
  const env = Object.assign({}, process.env, { CODEX_HOME: configDir });
  delete env.OPENAI_API_KEY; delete env.CODEX_API_KEY; delete env.OPENAI_BASE_URL;
  require("fs").mkdirSync(configDir, { recursive: true });
  const codex = new Codex({ apiKey: key, env });
  const opts = { workingDirectory: workspace, skipGitRepoCheck: true, sandboxMode: "workspace-write", approvalPolicy: "never", networkAccessEnabled: true, webSearchMode: "live" };
  if (model && model !== DEFAULT_MODEL) opts.model = model;
  const thread = resume ? codex.resumeThread(resume, opts) : codex.startThread(opts);
  let session = resume || null, tokens = 0, said = new Set();
  try {
    const { events } = await thread.runStreamed(prompt, { signal: abort.signal });
    for await (const ev of events) {
      if (ev.type === "thread.started") { session = ev.thread_id; emit({ kind: "session", id: session }); }
      else if (ev.type === "item.started" || ev.type === "item.updated" || ev.type === "item.completed") {
        const it = ev.item;
        if (it.type === "todo_list") emit({ kind: "plan", todos: (it.items || []).map(t => ({ text: t.text, status: t.completed ? "completed" : "pending" })) });
        else if (ev.type === "item.completed" && it.type === "agent_message" && it.text && it.text.trim()) emit({ kind: "say", text: it.text.trim() });
        else if (ev.type === "item.completed" && it.type === "error") emit({ kind: "note", text: it.message });
        else if (ev.type === "item.started" && !said.has(it.id)) { const d = describe(it, slug); if (d) { said.add(it.id); emit({ kind: "do", text: d }); } }
        if (ev.type === "item.completed" && it.type === "command_execution" && /atlas\.js\s+check\b/.test(it.command || "")) {
          emit(Object.assign({ kind: "check", whole: /atlas\.js\s+check\s+("[^"]+"|'[^']+'|\S+)\s*['"]?\s*$/.test(String(it.command).trim()) }, checkLine(it.aggregated_output)));
        }
        if (ev.type === "item.completed" && it.type === "file_change") { const d = describe(it, slug); if (d && !said.has(it.id)) emit({ kind: "do", text: d }); }
      } else if (ev.type === "turn.completed") {
        const u = ev.usage || {}; tokens += (u.input_tokens || 0) + (u.output_tokens || 0);
        emit({ kind: "tokens", tokens });
      } else if (ev.type === "turn.failed") return { ok: false, subtype: "failed", cost: 0, tokens, session, errors: [ev.error && ev.error.message || "The turn failed."] };
      else if (ev.type === "error") return { ok: false, subtype: "failed", cost: 0, tokens, session, errors: [ev.message] };
    }
    return { ok: true, subtype: "success", cost: 0, tokens, session, errors: [] };
  } catch (e) {
    if (abort.signal.aborted) return { ok: false, subtype: "stopped", cost: 0, tokens, session, errors: [] };
    throw Object.assign(e, { session, cost: 0 });
  }
}

module.exports = { run, verify, MODELS, DEFAULT_MODEL, PRICED: false };
