// A question from a campaign page ("Ask the campaign", "Previously on...", a floor plan to read into rooms), answered by
// the game master's own Claude Code in print mode (claude -p), on their own plan: no key, no extra cost. It runs in a
// folder of its own, away from the workspace, so the workspace's hooks and house rules do not take it for campaign
// work. One question at a time.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), { spawn } = require("child_process"), launch = require("./launch");

const HOME = path.join(os.tmpdir(), "campaign-atlas-ask");
let exe = null, queue = Promise.resolve();

async function find() {
  if (exe && fs.existsSync(exe)) return exe;
  const t = await launch.detect();
  exe = t.claude && t.claude.found ? t.claude.path : null;
  return exe;
}

function run(file, prompt, extra) {
  return new Promise((res, rej) => {
    fs.mkdirSync(HOME, { recursive: true });
    const args = ["-p", "--output-format", "text", ...(extra || [])];
    // an npm install leaves a .cmd, which Windows runs only through cmd.exe; the native installer leaves an .exe
    const p = /\.(cmd|bat)$/i.test(file) ? spawn("cmd.exe", ["/d", "/s", "/c", `"${file}" ${args.join(" ")}`], { cwd: HOME, windowsHide: true, windowsVerbatimArguments: true }) : spawn(file, args, { cwd: HOME, windowsHide: true });
    let out = "", err = "";
    const timer = setTimeout(() => { try { p.kill(); } catch (e) {} rej(new Error("Claude took too long to answer.")); }, 240000);
    p.stdout.on("data", d => { out += d; });
    p.stderr.on("data", d => { err += d; });
    p.on("error", e => { clearTimeout(timer); rej(e); });
    p.on("close", code => {
      clearTimeout(timer);
      const text = out.trim();
      if (code === 0 && text) return res(text);
      rej(new Error(/log ?in|auth|sign ?in/i.test(err + out) ? "Claude Code is not signed in on this computer." : (err || out || "Claude did not answer.").trim().split(/\r?\n/).pop().slice(0, 300)));
    });
    p.stdin.end(prompt);
  });
}
function queued(fn) {
  const next = queue.then(async () => {
    const file = await find();
    if (!file) throw new Error("Claude Code is not on this computer.");
    return fn(file);
  });
  queue = next.catch(() => {});
  return next;
}

function ask(prompt) {
  prompt = String(prompt || "").slice(0, 60000);
  if (!prompt.trim()) return Promise.reject(new Error("No question."));
  return queued(file => run(file, prompt));
}

// a floor plan or sketch from the map editor: the picture is put where Claude Code may read it, and its answer, which
// the prompt asks to be JSON only, is taken out of whatever it wrote around it
function readPlan(image, prompt) {
  const m = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(String(image || ""));
  if (!m) return Promise.reject(new Error("The picture could not be read."));
  const buf = Buffer.from(m[2], "base64"); if (buf.length > 8e6) return Promise.reject(new Error("The picture is too large."));
  prompt = String(prompt || "").slice(0, 20000);
  return queued(async file => {
    fs.mkdirSync(HOME, { recursive: true });
    const pic = path.join(HOME, "plan-" + Date.now() + "." + (m[1] === "jpeg" ? "jpg" : m[1]));
    fs.writeFileSync(pic, buf);
    try {
      const text = await run(file, `${prompt}\n\nThe floor plan is the picture at ${pic}: open it with the Read tool and look at it carefully before answering. Answer with the JSON only.`, ["--allowedTools", "Read"]);
      const a = text.indexOf("{"), b = text.lastIndexOf("}");
      if (a < 0 || b < a) throw new Error("Claude did not answer with a plan.");
      return JSON.parse(text.slice(a, b + 1));
    } finally { try { fs.unlinkSync(pic); } catch (e) {} }
  });
}

module.exports = { ask, readPlan };
