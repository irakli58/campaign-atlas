#!/usr/bin/env node
/* For whoever develops Atlas: copies the live Atlas tool (the campaign-atlas skill) into plugin/skills/campaign-atlas/, which
   is what the app ships. Run it after changing the tool, before publishing the app.

   node tools/sync-atlas.js [path to the skill folder]     (default: ~/.claude/skills/campaign-atlas) */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const src = path.resolve(process.argv[2] || path.join(os.homedir(), ".claude", "skills", "campaign-atlas"));
const dst = path.resolve(__dirname, "..", "plugin", "skills", "campaign-atlas");
if (!fs.existsSync(path.join(src, "SKILL.md"))) { console.error("No Atlas tool at " + src); process.exit(2); }
// what ships: the tool itself, never a campaign's leftovers
const skip = new Set(["node_modules", ".git", "dist"]);
fs.rmSync(dst, { recursive: true, force: true });
let n = 0;
(function copy(a, b) {
  fs.mkdirSync(b, { recursive: true });
  for (const f of fs.readdirSync(a)) {
    if (skip.has(f) || f.startsWith(".")) continue;
    const s = path.join(a, f), d = path.join(b, f);
    if (fs.statSync(s).isDirectory()) copy(s, d); else { fs.copyFileSync(s, d); n++; }
  }
})(src, dst);
console.log(`copied ${n} files of the Atlas tool into ${dst}`);
