// Campaign Atlas: Claude Code runs this after each step it takes in this folder (the hooks in .claude/settings.json),
// so the app can show the game master what is happening as it happens. It writes one line to a log beside the
// workspace, and does nothing else; whatever goes wrong here, it never stops Claude Code.
"use strict";
const fs = require("fs"), path = require("path");
let raw = "";
setTimeout(() => process.exit(0), 5000).unref();
process.stdin.setEncoding("utf8");
process.stdin.on("data", d => { raw += d; });
process.stdin.on("end", () => {
  try {
    const e = JSON.parse(raw), i = e.tool_input || {}, r = e.tool_response;
    const cut = (v, n) => String(v).slice(0, n);
    const out = { t: Date.now(), ev: e.hook_event_name, sid: e.session_id, tp: e.transcript_path };
    if (e.tool_name) out.tool = e.tool_name;
    if (i.file_path || i.path) out.file = cut(i.file_path || i.path, 400);
    if (i.command) out.cmd = cut(i.command, 400);
    if (i.query) out.q = cut(i.query, 200);
    if (i.url) out.url = cut(i.url, 300);
    if (i.description) out.desc = cut(i.description, 200);
    if (Array.isArray(i.todos)) out.todos = i.todos.slice(0, 40).map(t => ({ text: cut(t.status === "in_progress" && t.activeForm ? t.activeForm : t.content || "", 200), status: t.status }));
    if (e.message) out.msg = cut(e.message, 400);
    if (e.title) out.title = cut(e.title, 200);
    if (e.notification_type) out.ntype = e.notification_type;
    if (e.prompt) out.prompt = cut(e.prompt, 600);
    if (e.last_assistant_message) out.last = String(e.last_assistant_message).slice(-1500);
    if (e.error) out.err = cut(typeof e.error === "string" ? e.error : JSON.stringify(e.error), 400);
    // the verdict of Atlas's check, so the app can show it
    if (out.cmd && /atlas\.js\s+check\b/.test(out.cmd) && r) { const s = typeof r === "string" ? r : r.stdout || r.output || JSON.stringify(r); out.res = String(s).slice(-1200); }
    fs.appendFileSync(path.join(__dirname, "..", ".atlas-activity.jsonl"), JSON.stringify(out) + "\n");
  } catch (err) {}
  process.exit(0);
});
