// A question from a campaign page ("Ask the campaign", "Previously on..."), answered by the game master's own Claude
// Code in print mode (claude -p), on their own plan: no key, no extra cost. It runs in a folder of its own, away from the
// workspace, so the workspace's hooks and house rules do not take it for campaign work. One question at a time.
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

function run(file, prompt) {
  return new Promise((res, rej) => {
    fs.mkdirSync(HOME, { recursive: true });
    const args = ["-p", "--output-format", "text"];
    // an npm install leaves a .cmd, which Windows runs only through cmd.exe; the native installer leaves an .exe
    const p = /\.(cmd|bat)$/i.test(file) ? spawn("cmd.exe", ["/d", "/s", "/c", `"${file}" ${args.join(" ")}`], { cwd: HOME, windowsHide: true, windowsVerbatimArguments: true }) : spawn(file, args, { cwd: HOME, windowsHide: true });
    let out = "", err = "";
    const timer = setTimeout(() => { try { p.kill(); } catch (e) {} rej(new Error("Claude took too long to answer.")); }, 180000);
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

function ask(prompt) {
  prompt = String(prompt || "").slice(0, 60000);
  if (!prompt.trim()) return Promise.reject(new Error("No question."));
  const next = queue.then(async () => {
    const file = await find();
    if (!file) throw new Error("Claude Code is not on this computer.");
    return run(file, prompt);
  });
  queue = next.catch(() => {});
  return next;
}

module.exports = { ask };
