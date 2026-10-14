// What the AI is doing, in the game master's words rather than a programmer's: "Writing the place Block 22", not
// "Write places/03-block-22.js". Shared by every connector.
"use strict";

const SAYS = {
  check: "Checking the campaign against Atlas's standards", build: "Building the page", city: "Making the map of the whole",
  status: "Taking stock of the places", ascii: "Drawing a floor as text to look it over", dump: "Reading back everything written about a place",
  catalogue: "Looking up what Atlas can draw", catalog: "Looking up what Atlas can draw", locate: "Finding an address on the map",
  init: "Starting the campaign folder", export: "Exporting the maps"
};

const title = s => s.replace(/^\d+[-_]/, "").replace(/\.(md|js)$/, "").replace(/[-_]+/g, " ");
// a file, named as the game master would name it
function nice(file, slug) {
  if (!file) return "a file";
  let f = String(file).replace(/\\/g, "/");
  const at = f.indexOf("campaigns/" + slug + "/"); if (at >= 0) f = f.slice(at + slug.length + 11);
  const sk = f.indexOf("skills/campaign-atlas/"); if (sk >= 0) { const r = f.slice(sk + 22); return "the Atlas handbook (" + title(r.split("/").pop()) + ")"; }
  if (f === "story/source.md") return "your story";
  if (f === "story/brief.md") return "your choices";
  if (f === "story/council.md") return "the council's debate";
  if (f === "story/judgement.md") return "Tolkien's judgement";
  if (f.startsWith("story/bible/")) return "the story bible: " + title(f.slice(12));
  if (f === "story/bible.md") return "the story bible";
  if (f.startsWith("places/")) return "the place " + title(f.slice(7));
  if (f === "campaign.js") return "the campaign's settings, cast and places";
  if (f === "canon.md") return "the canon sheet";
  if (f === "REPORT.md") return "the report for you";
  if (f === "city.js") return "the map of the whole";
  if (f === "checklist.md") return "the checklist";
  if (/(^|\/)CLAUDE\.md$|(^|\/)AGENTS\.md$/.test(f)) return "the house rules";
  return f.split("/").slice(-2).join("/");
}

function command(cmd) {
  const m = String(cmd || "").match(/atlas\.js\s+(\w+)/);
  if (m) return SAYS[m[1]] || "Running Atlas: " + m[1];
  return null;   // other commands (listing a folder and the like) are not worth a line
}

function describe(name, input, slug) {
  input = input || {};
  const file = input.file_path || input.path || input.notebook_path;
  switch (name) {
    case "Write": return "Writing " + nice(file, slug);
    case "Edit": case "MultiEdit": return "Revising " + nice(file, slug);
    case "Read": return "Reading " + nice(file, slug);
    case "Glob": case "Grep": case "LS": return null;
    case "Bash": case "PowerShell": return command(input.command);
    case "Skill": return "Opening the Atlas handbook";
    case "WebSearch": return "Searching the web: " + String(input.query || "").slice(0, 120);
    case "WebFetch": try { return "Reading " + new URL(input.url).hostname; } catch (e) { return "Reading a web page"; }
    case "Agent": case "Task": return "Handing a part to a helper" + (input.description ? ": " + input.description : "");
    case "TodoWrite": return null;
    default: return null;
  }
}

// a tool result's text, whatever shape it came in
function toolText(c) {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map(x => typeof x === "string" ? x : (x && x.text) || "").join("\n");
  if (c && typeof c === "object") return c.text || c.output || "";
  return "";
}

// the verdict line of `atlas.js check`: "all clear", "no problems, 2 note(s)" or "3 problem(s), 1 note(s)"
function checkLine(text) {
  const lines = String(text || "").trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const v = [...lines].reverse().find(l => /^all clear$|^no problems,|problem\(s\)/.test(l)) || lines[lines.length - 1] || "";
  return { ok: v === "all clear", line: v || "the check did not finish", at: Date.now() };
}

module.exports = { describe, toolText, checkLine, nice };
