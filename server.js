#!/usr/bin/env node
/* Campaign Atlas, the app. Paste a story; an AI turns it into a playable campaign with the Atlas tool.

   node server.js            then open http://localhost:4747 (start-windows.bat and start-mac-linux.sh do both)

   Nothing to install for the app itself: Node 18 or newer is enough. The AI connectors are fetched the first time one
   is connected (lib/deps.js). The app listens on this computer only. */
"use strict";
if (+process.versions.node.split(".")[0] < 18) { console.error("\n  Campaign Atlas needs Node.js 18 or newer; this is " + process.version + ". Get the LTS version from https://nodejs.org/\n"); process.exit(1); }
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto"), { spawn } = require("child_process");
const deps = require("./lib/deps"), Jobs = require("./lib/jobs"), LocalDB = require("./lib/localdb"), launcher = require("./lib/launch");

const ROOT = __dirname, PORT = +process.env.ATLAS_PORT || 4747;
const UI = path.join(ROOT, "ui"), DATA = path.join(ROOT, "data"), WORK = path.join(ROOT, "workspace"), CAMPS = path.join(WORK, "campaigns");
const SHIPPED = path.join(ROOT, "plugin", "skills", "campaign-atlas"), SKILL = path.join(WORK, ".claude", "skills", "campaign-atlas");
const ATLAS_JS = path.join(SKILL, "scripts", "atlas.js"), TEMPLATE = path.join(SKILL, "template");
const TOKEN = crypto.randomBytes(24).toString("hex");
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

/* ---- the workspace the AI works in: Atlas's skill, the house rules, and the campaigns */
// one hash of every file in a folder, names and contents
function fingerprint(dir) {
  const h = crypto.createHash("sha1");
  (function walk(d, rel) { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f), r = rel + "/" + f; if (fs.statSync(p).isDirectory()) walk(p, r); else { h.update(r); h.update(fs.readFileSync(p)); } } })(dir, "");
  return h.digest("hex");
}
function setup() {
  for (const d of [DATA, CAMPS]) fs.mkdirSync(d, { recursive: true });
  if (!fs.existsSync(path.join(SHIPPED, "SKILL.md"))) { console.error("The Atlas tool is missing (" + SHIPPED + "). Download the app again."); process.exit(1); }
  // Atlas itself is refreshed from the app's copy when that copy has changed, so an updated app brings an updated tool,
  // and starting the app again leaves alone a Claude Code that is working with the tool as it is
  const stamp = fingerprint(SHIPPED), mark = path.join(SKILL, ".shipped");
  if (!fs.existsSync(mark) || fs.readFileSync(mark, "utf8") !== stamp) {
    fs.rmSync(SKILL, { recursive: true, force: true });
    fs.cpSync(SHIPPED, SKILL, { recursive: true });
    fs.writeFileSync(mark, stamp);
  }
  const rules = fs.readFileSync(path.join(ROOT, "workspace-template", "CLAUDE.md"), "utf8");
  fs.writeFileSync(path.join(WORK, "CLAUDE.md"), rules);
  fs.writeFileSync(path.join(WORK, "AGENTS.md"), rules);       // the same rules, for Codex
  fs.copyFileSync(path.join(ROOT, "workspace-template", "atlas.js"), path.join(WORK, "atlas.js"));
  // what Claude Code may do here without asking each time (once the game master trusts the folder): write inside
  // campaigns/, run Atlas, look things up on the web. Anything else it asks about in its own window.
  // And its hooks: after each step it takes, it runs atlas-hook.js, which tells the app what it did (lib/activity.js).
  const settingsFile = path.join(WORK, ".claude", "settings.json"), hookFile = path.join(WORK, ".claude", "atlas-hook.js");
  fs.copyFileSync(path.join(ROOT, "workspace-template", "atlas-hook.js"), hookFile);
  const conf = JSON.parse(fs.readFileSync(path.join(ROOT, "workspace-template", "settings.json"), "utf8"));
  const hook = [{ type: "command", command: `node "${hookFile.replace(/\\/g, "/")}"`, timeout: 10 }];
  conf.hooks = {
    SessionStart: [{ hooks: hook }], UserPromptSubmit: [{ hooks: hook }],
    PreToolUse: [{ matcher: "Bash|PowerShell", hooks: hook }], PostToolUse: [{ matcher: "*", hooks: hook }],
    Notification: [{ hooks: hook }], Stop: [{ hooks: hook }], StopFailure: [{ hooks: hook }]
  };
  const text = JSON.stringify(conf, null, 2) + "\n";
  if (!fs.existsSync(settingsFile) || fs.readFileSync(settingsFile, "utf8") !== text) fs.writeFileSync(settingsFile, text);
}

/* ---- the game master's connections: kept in data/settings.json on this computer, never shown back in full */
const SETTINGS = path.join(DATA, "settings.json");
const settings = {
  get() { try { return JSON.parse(fs.readFileSync(SETTINGS, "utf8")); } catch (e) { return {}; } },
  set(s) { fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2)); try { fs.chmodSync(SETTINGS, 0o600); } catch (e) {} }
};
const runners = { claude: require("./lib/run-claude"), openai: require("./lib/run-codex"), own: { MODELS: {}, DEFAULT_MODEL: null } };
const hint = k => k ? k.slice(0, 7) + "…" + k.slice(-4) : "";

// the game master's own Claude Code and Codex: looked for at most every few seconds
let tools = null, toolsAt = 0;
async function findTools(fresh) {
  if (fresh || !tools || Date.now() - toolsAt > 15000) { tools = await launcher.detect(); toolsAt = Date.now(); for (const k in tools) { tools[k].install = launcher.INSTALL[k]; delete tools[k].path; } }
  return tools;
}
async function state(fresh) {
  const s = settings.get(), conn = {};
  for (const p of ["claude", "openai"]) conn[p] = { connected: !!(s[p] && s[p].key), hint: s[p] ? hint(s[p].key) : "", model: s[p] && s[p].model, name: s[p] && s[p].name, installed: deps.installed(p), size: deps.CONNECTORS[p].size, ready: runners[p].READY !== false };
  return { version: VERSION, tools: await findTools(fresh), platform: process.platform, connectors: conn, models: { claude: runners.claude.MODELS, openai: runners.openai.MODELS }, defaults: { claude: runners.claude.DEFAULT_MODEL, openai: runners.openai.DEFAULT_MODEL }, sizes: Jobs.SIZES, freedom: Jobs.FREEDOM, lengths: Jobs.LENGTHS, defaults2: { freedom: Jobs.DEFAULT_FREEDOM, length: Jobs.DEFAULT_LENGTH }, campaigns: jobs.list(), workspace: WORK };
}

/* ---- http */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".woff2": "font/woff2" };
const HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]);
const send = (res, code, body, type) => { res.writeHead(code, { "content-type": type || "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
const fail = (res, code, msg) => send(res, code, { error: msg });
function body(req, limit) {
  return new Promise((res, rej) => {
    let n = 0; const parts = [];
    req.on("data", c => { n += c.length; if (n > limit) { rej(new Error("too large")); req.destroy(); } else parts.push(c); });
    req.on("end", () => { try { res(parts.length ? JSON.parse(Buffer.concat(parts).toString("utf8")) : {}); } catch (e) { rej(new Error("bad request")); } });
    req.on("error", rej);
  });
}
function file(res, f, type) {
  fs.readFile(f, (err, buf) => err ? fail(res, 404, "not found") : send(res, 200, buf, type || TYPES[path.extname(f).toLowerCase()] || "application/octet-stream"));
}
// only folders the app made, by their own names
const campDir = slug => /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug || "") && fs.existsSync(path.join(CAMPS, slug, "campaign.js")) ? path.join(CAMPS, slug) : null;
function openFolder(dir) {
  const [cmd, args] = process.platform === "win32" ? ["explorer.exe", [dir]] : process.platform === "darwin" ? ["open", [dir]] : ["xdg-open", [dir]];
  try { spawn(cmd, args, { detached: true, stdio: "ignore", windowsHide: false }).unref(); } catch (e) {}
}

let jobs, db;
async function route(req, res) {
  // this computer only, and only pages the app served itself may ask it to do anything
  if (!HOSTS.has(req.headers.host || "")) return fail(res, 403, "This app answers only on this computer.");
  const url = new URL(req.url, "http://localhost"), p = url.pathname, m = req.method;
  // the token comes in a header, which another website's page cannot send here; only the live progress stream, which
  // changes nothing, may carry it in the address (a browser's EventSource cannot set headers)
  const authed = req.headers["x-atlas-token"] === TOKEN || (m === "GET" && /\/events$/.test(p) && url.searchParams.get("t") === TOKEN);
  if (m === "POST" && !/^application\/json\b/.test(req.headers["content-type"] || "")) return fail(res, 415, "JSON only.");
  const site = req.headers["sec-fetch-site"];
  const ours = !site || site === "same-origin" || site === "none";

  if (m === "GET" && (p === "/" || p === "/index.html")) return send(res, 200, fs.readFileSync(path.join(UI, "index.html"), "utf8").replace("__TOKEN__", TOKEN), TYPES[".html"]);
  if (m === "GET" && p.startsWith("/ui/")) { const f = path.join(UI, path.normalize(p.slice(4)).replace(/^(\.\.[\\/])+/, "")); return f.startsWith(UI + path.sep) ? file(res, f) : fail(res, 404, "not found"); }

  // a finished campaign, opened from the app: its page, with the app's database in place of claude.ai's
  let mm;
  if ((mm = p.match(/^\/play\/([a-z0-9-]+)\/(.*)$/))) {
    const dir = campDir(mm[1]); if (!dir) return fail(res, 404, "No such campaign.");
    const rest = mm[2];
    if (!ours) return fail(res, 403, "forbidden");
    if (m === "GET" && rest === "") {
      const f = path.join(dir, "dist", "preview.html"); if (!fs.existsSync(f)) return send(res, 404, "<p>This campaign's page has not been built yet.</p>", TYPES[".html"]);
      const html = fs.readFileSync(f, "utf8").replace("<body>", `<body>\n<script src="/play/${mm[1]}/local-db.js"></script>`);
      return send(res, 200, html, TYPES[".html"]);
    }
    if (m === "GET" && rest === "local-db.js") return send(res, 200, fs.readFileSync(path.join(UI, "local-db.js"), "utf8").replace("__TOKEN__", TOKEN).replace("__URL__", `/play/${mm[1]}/db`), TYPES[".js"]);
    if (m === "GET" && rest === "download") {
      const f = path.join(dir, "dist", "preview.html"); if (!fs.existsSync(f)) return fail(res, 404, "not built");
      res.writeHead(200, { "content-type": TYPES[".html"], "content-disposition": `attachment; filename="${mm[1]}.html"` }); return fs.createReadStream(f).pipe(res);
    }
    // the world map's "Make its 3D map now"
    if (m === "POST" && rest === "make-city") {
      if (!authed) return fail(res, 403, "forbidden");
      try { return send(res, 200, await jobs.makeCity(mm[1], await body(req, 1 << 12))); } catch (e) { return fail(res, 400, e.message); }
    }
    if (rest === "db") {
      if (!authed) return fail(res, 403, "forbidden");
      if (m === "GET") { const d = db.get(mm[1]); return +url.searchParams.get("v") === d.v ? (res.writeHead(204), res.end()) : send(res, 200, d); }
      if (m === "POST") { try { return send(res, 200, { v: db.write(mm[1], await body(req, 1 << 20)) }); } catch (e) { return fail(res, 400, e.message); } }
    }
    return fail(res, 404, "not found");
  }

  if (!p.startsWith("/api/")) return fail(res, 404, "not found");
  if (!authed || !ours) return fail(res, 403, "Reload the app's page.");
  try {
    if (m === "GET" && p === "/api/state") return send(res, 200, await state(url.searchParams.get("fresh") === "1"));
    if (m === "POST" && p === "/api/connect") {
      const o = await body(req, 1 << 14), prov = o.provider, key = String(o.key || "").trim();
      if (!["claude", "openai"].includes(prov)) return fail(res, 400, "Which AI?");
      if (!key) return fail(res, 400, "Paste your API key.");
      const r = runners[prov]; if (r.READY === false) return fail(res, 400, r.NOT_READY || "Not available yet.");
      const model = r.MODELS[o.model] ? o.model : r.DEFAULT_MODEL;
      let who;
      try { who = await r.verify(key, model); } catch (e) { return fail(res, 400, plain(e, prov)); }
      const s = settings.get(); s[prov] = { key, model, name: who.name }; settings.set(s);
      return send(res, 200, await state());
    }
    if (m === "POST" && p === "/api/disconnect") { const o = await body(req, 1 << 12), s = settings.get(); delete s[o.provider]; settings.set(s); return send(res, 200, await state()); }
    if (m === "POST" && p === "/api/campaigns") { const j = await jobs.add(await body(req, 16 << 20)); return send(res, 200, { job: j, state: await state() }); }
    if ((mm = p.match(/^\/api\/campaigns\/([a-z0-9-]+)\/(events|stop|continue|report|open|launch)$/))) {
      const slug = mm[1], j = jobs.get(slug); if (!j) return fail(res, 404, "No such campaign.");
      if (m === "GET" && mm[2] === "events") { res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" }); const ping = setInterval(() => res.write(": ping\n\n"), 20000); res.on("close", () => clearInterval(ping)); return jobs.subscribe(slug, res); }
      if (m === "GET" && mm[2] === "report") { let t = ""; try { t = fs.readFileSync(path.join(CAMPS, slug, "REPORT.md"), "utf8"); } catch (e) {} return send(res, 200, { report: t }); }
      if (m === "POST" && mm[2] === "stop") { jobs.stop(slug); return send(res, 200, { ok: true }); }
      if (m === "POST" && mm[2] === "continue") return send(res, 200, { job: jobs.more(slug, await body(req, 1 << 12)) });
      if (m === "POST" && mm[2] === "open") { openFolder(path.join(CAMPS, slug)); return send(res, 200, { ok: true }); }
      if (m === "POST" && mm[2] === "launch") return send(res, 200, { job: await jobs.launch(slug, (await body(req, 1 << 12)).tool) });
    }
    if (m === "POST" && p === "/api/open-workspace") { openFolder(WORK); return send(res, 200, { ok: true }); }
    return fail(res, 404, "not found");
  } catch (e) { return fail(res, 400, e.message || String(e)); }
}

// what went wrong connecting, in plain words
function plain(e, prov) {
  const s = String((e && (e.status || "")) + " " + (e && e.message || e));
  if (/401|authentication|invalid.*key|incorrect api key/i.test(s)) return "That key was not accepted. Copy it again from your " + (prov === "claude" ? "Claude Console" : "OpenAI") + " account.";
  if (/403|permission/i.test(s)) return "That key cannot use this model. Check your account's access.";
  if (/404|not_found/i.test(s)) return "That model is not available to this key. Try the other model.";
  if (/429|rate|credit|billing|balance/i.test(s)) return "The account has no credit left, or is busy. Check billing in your account.";
  if (/ENOTFOUND|ECONNREFUSED|network|fetch failed|timed? ?out/i.test(s)) return "Could not reach the AI. Is this computer online?";
  return s.trim().slice(0, 300);
}

// an unexpected error is written down (data/errors.log) and the app keeps running: a game master's campaign may be
// being made in another window, and the app should still be there to show it
function note(kind, e) { try { fs.appendFileSync(path.join(DATA, "errors.log"), `${new Date().toISOString()} ${kind}: ${(e && e.stack) || e}\n`); } catch (x) {} console.error(kind + ":", (e && e.message) || e); }
process.on("uncaughtException", e => note("uncaught", e));
process.on("unhandledRejection", e => note("unhandled", e));

setup();
jobs = Jobs.create({ DATA, WORK, CAMPS, ATLAS_JS, TEMPLATE, settings, runners });
db = LocalDB.create(path.join(DATA, "play"));
const server = http.createServer((req, res) => route(req, res).catch(e => { try { fail(res, 500, e.message); } catch (x) {} }));
server.on("error", e => { if (e.code === "EADDRINUSE") { console.log(`Campaign Atlas is already running: open http://localhost:${PORT}`); process.exit(0); } throw e; });
server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  Campaign Atlas ${VERSION} is running.\n  Open http://localhost:${PORT} in your browser. Close this window to stop it.\n`);
  if (process.argv.includes("--open")) openUrl(`http://localhost:${PORT}`);
});
function openUrl(u) {
  const [cmd, args] = process.platform === "win32" ? ["cmd.exe", ["/c", "start", "", u]] : process.platform === "darwin" ? ["open", [u]] : ["xdg-open", [u]];
  try { spawn(cmd, args, { detached: true, stdio: "ignore", windowsHide: true }).unref(); } catch (e) {}
}
