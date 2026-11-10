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
// the example campaigns the app offers (the UX review of 5 Nov 2026, item 20): the sources of the workspace's samples, when
// this runs inside the workspace (its dev/samples), without their built pages; the app makes those on this computer
const samples = path.resolve(__dirname, "..", "..", "dev", "samples"), exDst = path.resolve(__dirname, "..", "examples");
if (fs.existsSync(samples)) {
  let m = 0;
  for (const id of ["realm", "kestrel"]) {
    const a = path.join(samples, id); if (!fs.existsSync(path.join(a, "campaign.js"))) continue;
    const b = path.join(exDst, id); fs.rmSync(b, { recursive: true, force: true });
    (function copy(x, y) { fs.mkdirSync(y, { recursive: true }); for (const f of fs.readdirSync(x)) { if (skip.has(f) || f.startsWith(".")) continue; const s = path.join(x, f), d = path.join(y, f); if (fs.statSync(s).isDirectory()) copy(s, d); else { fs.copyFileSync(s, d); m++; } } })(a, b);
  }
  console.log(`copied ${m} files of the example campaigns into ${exDst}`);
}
