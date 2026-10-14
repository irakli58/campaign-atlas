// The game master's own Claude Code or Codex, signed in with their own subscription: the app finds it on this computer
// and opens it in a terminal window of its own, in the workspace, with the request already typed. The game master sees
// it work and can step in at any time; the app never signs in for them and never touches their login.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), { execFile, spawn } = require("child_process");

const WIN = process.platform === "win32", MAC = process.platform === "darwin";
const TOOLS = {
  claude: { label: "Claude Code", cmd: "claude", plan: "a Claude Pro or Max plan" },
  codex: { label: "Codex", cmd: "codex", plan: "a ChatGPT Plus or Pro plan" }
};

// where the installers put it, for when the app was started before the tool was installed and PATH is stale
function usual(cmd) {
  const h = os.homedir();
  return WIN ? [path.join(h, ".local", "bin", cmd + ".exe"), path.join(process.env.APPDATA || "", "npm", cmd + ".cmd")]
    : [path.join(h, ".local", "bin", cmd), "/opt/homebrew/bin/" + cmd, "/usr/local/bin/" + cmd, path.join(h, ".npm-global", "bin", cmd)];
}
function find(cmd) {
  return new Promise(res => {
    const done = out => { const p = String(out || "").split(/\r?\n/).map(s => s.trim()).find(Boolean); if (p) return res(p); res(usual(cmd).find(f => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } }) || null); };
    if (WIN) execFile("where.exe", [cmd], { windowsHide: true, timeout: 8000 }, (err, out) => done(err ? "" : out));
    else execFile("/bin/sh", ["-c", "command -v " + cmd], { timeout: 8000 }, (err, out) => done(err ? "" : out));
  });
}
async function detect() {
  const out = {};
  for (const [k, t] of Object.entries(TOOLS)) { const p = await find(t.cmd); out[k] = { label: t.label, found: !!p, path: p, plan: t.plan }; }
  return out;
}

// the one-line installers, as each maker publishes them
const INSTALL = {
  claude: WIN ? { shell: "PowerShell", line: "irm https://claude.ai/install.ps1 | iex" } : { shell: "Terminal", line: "curl -fsSL https://claude.ai/install.sh | bash" },
  codex: { shell: WIN ? "PowerShell" : "Terminal", line: "npm install -g @openai/codex" }
};

const q1 = s => "'" + String(s).replace(/'/g, "'\\''") + "'";                  // a single-quoted shell word
const safe = s => String(s).replace(/[^\w .,:'-]/g, "").slice(0, 80);         // a window title

// open a terminal in `dir`, running `exe` with `prompt` (the prompt is the app's own words and the campaign's folder name)
function open({ tool, exe, dir, prompt, title, scripts }) {
  if (/["%^&|<>`$\\]/.test(prompt)) throw new Error("bad prompt");
  fs.mkdirSync(scripts, { recursive: true });
  const name = "start-" + tool;
  if (WIN) {
    const f = path.join(scripts, name + ".cmd");
    fs.writeFileSync(f, ["@echo off", `title Campaign Atlas: ${safe(title)}`, `cd /d "${dir}"`, `"${exe}" "${prompt}"`, "echo.", `echo ${TOOLS[tool].label} has finished. You can close this window.`, "pause >nul", ""].join("\r\n"));
    spawn("cmd.exe", ["/c", "start", "", f], { detached: true, stdio: "ignore", windowsHide: false }).unref();
    return;
  }
  const f = path.join(scripts, name + (MAC ? ".command" : ".sh"));
  fs.writeFileSync(f, ["#!/bin/bash", `cd ${q1(dir)} || exit 1`, `${q1(exe)} ${q1(prompt)}`, `echo; echo ${q1(TOOLS[tool].label + " has finished. You can close this window.")}`, "read -r _", ""].join("\n"));
  fs.chmodSync(f, 0o755);
  if (MAC) { spawn("open", ["-a", "Terminal", f], { detached: true, stdio: "ignore" }).unref(); return; }
  // Linux: the first terminal there is
  const terms = [["x-terminal-emulator", ["-e", f]], ["gnome-terminal", ["--", f]], ["konsole", ["-e", f]], ["xfce4-terminal", ["-x", f]], ["kitty", [f]], ["alacritty", ["-e", f]], ["xterm", ["-e", f]]];
  return new Promise((res, rej) => {
    (function next(i) {
      if (i >= terms.length) return rej(new Error("No terminal program was found. Open a terminal in " + dir + " and run: " + TOOLS[tool].cmd));
      execFile("/bin/sh", ["-c", "command -v " + terms[i][0]], (err, out) => {
        if (err || !String(out).trim()) return next(i + 1);
        spawn(terms[i][0], terms[i][1], { detached: true, stdio: "ignore" }).unref(); res();
      });
    })(0);
  });
}

module.exports = { TOOLS, INSTALL, detect, open };
