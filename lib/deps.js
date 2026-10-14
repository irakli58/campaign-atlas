// The AI connectors are large (the Claude one carries its own engine, about 270 MB), so none is installed with the app:
// each is fetched from npm the first time someone connects that AI, into one folder beside the app.
"use strict";
const fs = require("fs"), path = require("path"), { spawn } = require("child_process"), { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..");
// ATLAS_DEPS, or a one-line .deps-path file, moves the folder (e.g. out of a synced folder such as OneDrive)
function depsDir() {
  if (process.env.ATLAS_DEPS) return path.resolve(process.env.ATLAS_DEPS);
  try { const p = fs.readFileSync(path.join(ROOT, ".deps-path"), "utf8").trim(); if (p) return path.resolve(ROOT, p.replace(/%([^%]+)%/g, (m, k) => process.env[k] || m)); } catch (e) {}
  return path.join(ROOT, ".deps");
}
const DEPS = depsDir();

// the versions the app was built and tested with
const CONNECTORS = {
  claude: { label: "Claude", packages: { "@anthropic-ai/claude-agent-sdk": "0.3.300", "@anthropic-ai/sdk": "0.134.0" }, size: "about 270 MB" },
  openai: { label: "OpenAI Codex", packages: { "@openai/codex-sdk": "0.162.1" }, size: "about 100 MB" }
};

const pkgDir = name => path.join(DEPS, "node_modules", ...name.split("/"));
function installed(which) {
  const c = CONNECTORS[which]; if (!c) return false;
  return Object.entries(c.packages).every(([n, v]) => { try { return JSON.parse(fs.readFileSync(path.join(pkgDir(n), "package.json"), "utf8")).version === v; } catch (e) { return false; } });
}

const busy = {};
function install(which, log) {
  if (installed(which)) return Promise.resolve();
  if (busy[which]) return busy[which];
  const c = CONNECTORS[which];
  fs.mkdirSync(DEPS, { recursive: true });
  if (!fs.existsSync(path.join(DEPS, "package.json"))) fs.writeFileSync(path.join(DEPS, "package.json"), JSON.stringify({ name: "campaign-atlas-connectors", private: true }, null, 2));
  const args = ["install", "--no-audit", "--no-fund", "--loglevel=error", ...Object.entries(c.packages).map(([n, v]) => `${n}@${v}`)];
  const win = process.platform === "win32";
  busy[which] = new Promise((resolve, reject) => {
    // npm is a .cmd file on Windows, which Node only starts through the shell; the arguments are the app's own, never the user's
    const p = win ? spawn(["npm", ...args].join(" "), { cwd: DEPS, shell: true, windowsHide: true }) : spawn("npm", args, { cwd: DEPS, windowsHide: true });
    let err = "";
    p.stdout.on("data", d => log && log(String(d)));
    p.stderr.on("data", d => { err += d; log && log(String(d)); });
    p.on("error", e => reject(new Error("npm could not be started: " + e.message + ". Is Node.js installed with npm?")));
    p.on("close", code => code === 0 && installed(which) ? resolve() : reject(new Error("Installing the " + c.label + " connector failed" + (err.trim() ? ": " + err.trim().split("\n").slice(-3).join(" ") : "."))));
  }).finally(() => { delete busy[which]; });
  return busy[which];
}

// import an installed package (both connectors are ES modules), from the connectors folder rather than the app's
function entry(name) {
  const dir = pkgDir(name), pj = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  let e = pj.exports;
  if (e && typeof e === "object" && "." in e) e = e["."];
  for (let i = 0; i < 4 && e && typeof e === "object"; i++) e = e.import || e.node || e.default || e.require;
  return path.join(dir, typeof e === "string" ? e : (pj.module || pj.main || "index.js"));
}
const load = name => import(pathToFileURL(entry(name)).href);

module.exports = { DEPS, CONNECTORS, installed, install, load };
