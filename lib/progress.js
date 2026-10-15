// How far a campaign has got, read from its folder alone. The same reading serves a campaign the app is making and one
// the game master is making in their own Claude Code or Codex, since both leave the same files behind.
"use strict";
const fs = require("fs"), path = require("path"), { execFile } = require("child_process");

const read = f => { try { return fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n"); } catch (e) { return ""; } };
const mtime = f => { try { return fs.statSync(f).mtimeMs; } catch (e) { return 0; } };
const files = d => { try { return fs.readdirSync(d).filter(f => !f.startsWith(".")); } catch (e) { return []; } };

// a section of a markdown file, from its heading to the next heading of the same level
function section(md, head) {
  const i = md.indexOf(head); if (i < 0) return "";
  const rest = md.slice(i + head.length), j = rest.search(/\n## /);
  return j < 0 ? rest : rest.slice(0, j);
}

// the council's transcript against the template it started from
function council(dir, tmplDir) {
  const md = read(path.join(dir, "story", "council.md")), tmpl = read(path.join(tmplDir, "story", "council.md"));
  const bible = files(path.join(dir, "story", "bible")).filter(f => f.endsWith(".md") && read(path.join(dir, "story", "bible", f)).trim().length > 200);
  const bibleWords = bible.reduce((n, f) => n + read(path.join(dir, "story", "bible", f)).split(/\s+/).length, 0);
  const started = md && md.trim() !== tmpl.trim();
  const rounds = (md.match(/^## Round \d/mg) || []).filter(h => { const s = section(md, h).trim(), t = section(tmpl, h).trim(); return s && s !== t && s.length > t.length + 80; }).length;
  const judge = read(path.join(dir, "story", "judgement.md"));
  const judged = !!judge.trim() && !judge.includes("(chapter name)") && /Excellent|Good|Wanting|Poor/.test(judge);
  const grades = (judge.match(/^###\s.*?:\s*(Excellent|Good|Wanting|Poor)\b/mg) || []).map(l => l.match(/(Excellent|Good|Wanting|Poor)\b/)[1]);
  const after = section(judge, "## After the mending"), mended = after.trim().length > 80 && !/^\s*Each point that failed/.test(after.trim());
  // the agreement: each of the five has written something after their name, other than the template's own words
  const agree = section(md, "## Round 8"), tagree = section(tmpl, "## Round 8");
  const names = ["Conan Doyle", "Christie", "Poe", "Lovecraft", "Tolkien"];
  const head = n => "\\*\\*[^*\\n]*" + n + "[^*\\n]*\\*\\*";
  const said = n => { const m = agree.match(new RegExp(head(n) + "([^\\n]*(?:\\n(?!\\*\\*)[^\\n]*)*)")), t = tagree.match(new RegExp(head(n) + "([^\\n]*)")); return !!m && m[1].trim().length > 20 && m[1].trim() !== (t ? t[1].trim() : ""); };
  const signed = agree !== tagree ? names.filter(said) : [];
  return { started, rounds, bible: bible.length, bibleWords, judged, grades, mended, signed };
}

// Atlas's own table of places, rooms and guides (atlas.js status --json); while a place file is half written it may not
// load, and then the last good reading stands
const lastGood = {};
function places(dir, atlasJs) {
  return new Promise(res => {
    execFile(process.execPath, [atlasJs, "status", dir, "--json"], { timeout: 30000, windowsHide: true, maxBuffer: 8 << 20 }, (err, out) => {
      try { if (!err) lastGood[dir] = JSON.parse(String(out).trim().split("\n").pop()); } catch (e) {}
      res(lastGood[dir] || null);
    });
  });
}

// Atlas's check, run by the app itself whenever the campaign's files have changed since the last run, so the step is
// true whoever ran the last check, and even if nobody did (one run at a time per campaign; the verdict is its last line)
const checks = {};
function checkNow(dir, atlasJs, newest) {
  const c = checks[dir] = checks[dir] || {};
  if (c.running || c.for === newest) return c.result || null;
  c.running = true;
  execFile(process.execPath, [atlasJs, "check", dir], { timeout: 120000, windowsHide: true, maxBuffer: 8 << 20 }, (err, out) => {
    c.running = false; c.for = newest;
    const lines = String(out || "").trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const v = [...lines].reverse().find(l => /^all clear$|^no problems,|problem\(s\)/.test(l));
    c.result = v ? { ok: v === "all clear", line: v, at: Date.now() } : null;
  });
  return c.result || null;
}

async function progress(dir, { atlasJs, tmplDir, job }) {
  const c = council(dir, tmplDir), P = await places(dir, atlasJs);
  const list = (P && P.places) || [], mapped = list.filter(p => p.mapped);
  const rooms = mapped.reduce((n, p) => n + (p.rooms || 0), 0), done = mapped.reduce((n, p) => n + (p.done || 0), 0);
  const clues = mapped.reduce((n, p) => n + (p.clues || 0), 0), people = mapped.reduce((n, p) => n + (p.people || 0), 0);
  const city = fs.existsSync(path.join(dir, "city.js"));
  const page = path.join(dir, "dist", "preview.html"), built = mtime(page);
  const newest = Math.max(mtime(path.join(dir, "campaign.js")), mtime(path.join(dir, "city.js")), ...files(path.join(dir, "places")).map(f => mtime(path.join(dir, "places", f))));
  const report = read(path.join(dir, "REPORT.md"));
  // the app's own check, once every place is registered and something has been mapped; else what the AI last reported
  const own = list.length && mapped.length ? checkNow(dir, atlasJs, newest) : null;
  const check = own && own.at >= newest - 1000 ? own : job && job.check;
  const steps = [
    { id: "story", label: "Your story, saved as you gave it", done: fs.existsSync(path.join(dir, "story", "source.md")) },
    { id: "council", label: "The council debates and builds", who: "Conan Doyle, Christie, Poe and Lovecraft", done: c.rounds >= 5 && c.bible > 0, active: c.started,
      detail: c.started ? `${c.rounds} of 9 rounds written` + (c.bible ? `; the bible: ${c.bible} chapter${c.bible > 1 ? "s" : ""}, ${c.bibleWords.toLocaleString("en")}${job && job.storyWords ? " of about " + job.storyWords.toLocaleString("en") : ""} words (about ${Math.max(1, Math.round(c.bibleWords / 400))} pages)` : "") : "" },
    { id: "judge", label: "Tolkien judges, and the four mend", who: "J. R. R. Tolkien", done: c.judged && c.rounds >= 8, active: c.judged,
      detail: c.grades.length ? c.grades.length + " chapters graded: " + ["Excellent", "Good", "Wanting", "Poor"].map(g => [g, c.grades.filter(x => x === g).length]).filter(x => x[1]).map(x => x[1] + " " + x[0]).join(", ") + (c.mended && c.grades.some(g => g === "Wanting" || g === "Poor") ? "; those below Good were mended and judged again" : "") : "" },
    { id: "agree", label: "All five agree on the finished story", done: c.signed.length === 5, active: c.signed.length > 0, detail: c.signed.length ? c.signed.length + " of 5 have signed" : "" },
    { id: "map", label: "The map of the whole", done: city, active: city },
    { id: "places", label: "Every place mapped, room by room", done: list.length > 0 && mapped.length === list.length && done === rooms, active: list.length > 0,
      detail: list.length ? `${mapped.length} of ${list.length} places mapped; ${rooms} rooms, ${done} written; ${clues} clues, ${people} people` : "" },
    { id: "check", label: "Checked against Atlas's standards", done: !!(check && check.ok) && (!check.at || check.at >= newest - 1000), active: !!check, detail: check ? check.line : "" },
    { id: "build", label: "The page built", done: built > 0 && built >= newest - 1000, active: built > 0 },
    { id: "report", label: "The report for you", done: report.trim().length > 100, active: !!report.trim() }
  ];
  // the step being worked on: the first not done, once something after it has not started either
  const current = steps.find(s => !s.done);
  if (current) current.current = true;
  return { title: P && P.title, steps, places: list, counts: { places: list.length, mapped: mapped.length, rooms, done, clues, people }, page: built > 0, report };
}

module.exports = { progress };
