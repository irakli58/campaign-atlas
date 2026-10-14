// Makes a campaign with Claude, through the Claude Agent SDK and the game master's own API key. The agent works in the
// app's workspace with the campaign-atlas skill, may write only inside campaigns/, and may run only Atlas's own command.
"use strict";
const path = require("path"), deps = require("./deps");
const { describe, toolText, checkLine } = require("./narrate");

const MODELS = {
  "claude-opus-5-5": { label: "Claude Opus 5.5", note: "the best writer", price: { in: 4, out: 20, cw: 5, cr: 0.2 } },
  "claude-sonnet-5-5": { label: "Claude Sonnet 5.5", note: "about half the cost", price: { in: 2, out: 10, cw: 2.5, cr: 0.2 } }
};
const DEFAULT_MODEL = "claude-opus-5-5";

// is the key good, and can it use the model? (looking a model up costs nothing)
async function verify(key, model) {
  await deps.install("claude");
  const mod = await deps.load("@anthropic-ai/sdk"), Anthropic = mod.default || mod.Anthropic;
  const client = new Anthropic({ apiKey: key });
  const m = await client.models.retrieve(model || DEFAULT_MODEL);
  return { model: m.id, name: m.display_name || (MODELS[m.id] || {}).label || m.id };
}

const APPEND = slug => `
You are working inside the Campaign Atlas app on the campaign in campaigns/${slug}/. The game master who pasted the story cannot see this conversation and will not answer questions, so never ask one: decide, and say what you decided in REPORT.md. There is no Artifact tool and nothing to publish: the finished page is campaigns/${slug}/dist/preview.html, made by \`node atlas.js build campaigns/${slug}\`, and the app shows it. Run Atlas only as \`node atlas.js <command> campaigns/${slug}\` from the working folder; write files only inside campaigns/${slug}/, with the Write and Edit tools.`;

function cost(usage, price) {
  if (!usage || !price) return 0;
  return ((usage.input_tokens || 0) * price.in + (usage.output_tokens || 0) * price.out + (usage.cache_creation_input_tokens || 0) * price.cw + (usage.cache_read_input_tokens || 0) * price.cr) / 1e6;
}

/* run one stretch of work. emit(event) receives: { kind: "say"|"do"|"plan"|"check"|"cost"|"note"|"error", ... } */
async function run({ slug, workspace, configDir, key, model, prompt, resume, budget, abort, emit }) {
  await deps.install("claude");
  const { query } = await deps.load("@anthropic-ai/claude-agent-sdk");
  const env = Object.assign({}, process.env, { ANTHROPIC_API_KEY: key, CLAUDE_CONFIG_DIR: configDir });
  // the key is the only way in: never a subscription login, a token or a redirect left in the environment
  for (const k of ["CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY"]) delete env[k];
  const price = (MODELS[model] || MODELS[DEFAULT_MODEL]).price;
  const q = query({
    prompt,
    options: {
      cwd: workspace,
      model,
      env,
      resume: resume || undefined,
      abortController: abort,
      maxBudgetUsd: budget > 0 ? budget : undefined,
      settingSources: ["project"],                  // the workspace's CLAUDE.md and skill; nothing of the person's own
      skills: ["campaign-atlas"],
      systemPrompt: { type: "preset", preset: "claude_code", append: APPEND(slug) },
      permissionMode: "dontAsk",                    // anything not allowed below is refused, never asked about
      allowedTools: [`Edit(/campaigns/${slug}/**)`, "Bash(node atlas.js *)", "PowerShell(node atlas.js *)", "WebSearch", "WebFetch", "TodoWrite"],
      disallowedTools: ["AskUserQuestion", "NotebookEdit"]
    }
  });
  const spent = new Map(), pending = new Map();
  let session = resume || null, last = 0;
  const total = () => { let s = 0; for (const v of spent.values()) s += v; return s; };
  try {
    for await (const m of q) {
      if (m.type === "system" && m.subtype === "init") {
        session = m.session_id; emit({ kind: "session", id: session, model: m.model, keySource: m.apiKeySource });
        // the game master's key, and nothing else, pays for the work
        if (m.apiKeySource !== "ANTHROPIC_API_KEY") { try { q.close(); } catch (e) {} throw new Error("The Claude connector did not take your API key (it found: " + m.apiKeySource + "). Nothing was spent."); }
      } else if (m.type === "assistant") {
        const msg = m.message || {};
        if (msg.id && msg.usage) { spent.set(msg.id, cost(msg.usage, price)); const t = total(); if (t - last > 0.01) { last = t; emit({ kind: "cost", usd: t, estimate: true }); } }
        for (const b of msg.content || []) {
          if (b.type === "text" && b.text && b.text.trim() && !m.parent_tool_use_id) emit({ kind: "say", text: b.text.trim() });
          else if (b.type === "tool_use") {
            if (b.name === "TodoWrite" && b.input && Array.isArray(b.input.todos)) { emit({ kind: "plan", todos: b.input.todos.map(t => ({ text: t.status === "in_progress" && t.activeForm ? t.activeForm : t.content, status: t.status })) }); continue; }
            pending.set(b.id, { name: b.name, input: b.input || {} });
            const d = describe(b.name, b.input || {}, slug);
            if (d) emit({ kind: "do", text: d, tool: b.name });
          }
        }
      } else if (m.type === "user" && m.message && Array.isArray(m.message.content)) {
        for (const b of m.message.content) {
          if (b.type !== "tool_result") continue;
          const p = pending.get(b.tool_use_id); pending.delete(b.tool_use_id);
          const text = toolText(b.content);
          const cmd = p && /(Bash|PowerShell)/.test(p.name) ? String(p.input.command || "").trim() : "";
          if (/atlas\.js\s+check\b/.test(cmd)) emit(Object.assign({ kind: "check", whole: /atlas\.js\s+check\s+("[^"]+"|'[^']+'|\S+)\s*$/.test(cmd) }, checkLine(text)));
          else if (b.is_error && p && !/^(Read|Glob|Grep)$/.test(p.name)) emit({ kind: "note", text: "Refused or failed: " + (describe(p.name, p.input, slug) || p.name) + (text ? " (" + text.slice(0, 160) + ")" : "") });
        }
      } else if (m.type === "result") {
        const usd = typeof m.total_cost_usd === "number" ? m.total_cost_usd : total();
        emit({ kind: "cost", usd, estimate: false });
        return { ok: m.subtype === "success" && !m.is_error, subtype: m.subtype, cost: usd, session: m.session_id || session, result: m.result || "", errors: m.errors || [] };
      }
    }
    return { ok: false, subtype: "ended", cost: total(), session, errors: ["The work ended without a result."] };
  } catch (e) {
    if (abort && abort.signal.aborted) return { ok: false, subtype: "stopped", cost: total(), session, errors: [] };
    throw Object.assign(e, { session, cost: total() });
  }
}

module.exports = { run, verify, MODELS, DEFAULT_MODEL, PRICED: true };
