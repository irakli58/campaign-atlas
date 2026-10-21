// The campaigns the app knows, and the work on each: starting it, watching it, stopping it, carrying it on. A job is
// kept as data/jobs/<slug>.json, so the app can be closed and opened again without losing anything.
"use strict";
const fs = require("fs"), path = require("path"), { execFile } = require("child_process");
const { progress } = require("./progress"), { nice, describe, checkLine, wholeCheck } = require("./narrate"), launcher = require("./launch"), activity = require("./activity");

const SIZES = {
  oneshot: { label: "A one-shot", says: "A one-shot for one or two evenings: about 4 to 6 places, one or two of them tier 1.", cap: 15 },
  campaign: { label: "A campaign", says: "A campaign of several sessions: about 8 to 14 places, three or four of them tier 1.", cap: 40 },
  epic: { label: "An epic", says: "An epic, a long campaign: 18 places or more, five or more of them tier 1.", cap: 120 },
  // the game master names every place themselves, as many as they like
  unlimited: { label: "Unlimited", says: "Unlimited: your own list of places, as many as you like, and exactly those.", cap: 4, perPlace: true }
};

// How much the council may change the story (the first slider), and how long the story bible should be (the second).
// The game master reads the bible like a detective novel, to know everything that happens: longer is better, so the
// slider starts at about a hundred pages.
const FREEDOM = {
  1: { label: "Stay true", says: "Keep my story as I wrote it: its plot, its people and its places. Only close its holes and add what play needs (clues, hints, people's details)." },
  2: { label: "Close to mine", says: "Keep my plot, people and places, and the order of events. Add depth: new minor characters, subplots and clues." },
  3: { label: "Balanced", says: "Keep the core and the main turns of my story. The council may change details, add characters and subplots, and move things to make it play better." },
  4: { label: "Free to reshape", says: "Keep the core. The council may change events, people and places freely to make it as good to play as it can be." },
  5: { label: "Free rein", says: "Only the core idea is mine. Everything else is the council's to reinvent." }
};
const LENGTHS = {
  1: { label: "Short", pages: 10, words: 4000 },
  2: { label: "Medium", pages: 25, words: 10000 },
  3: { label: "Long", pages: 50, words: 20000 },
  4: { label: "A novel", pages: 100, words: 40000 },
  5: { label: "An epic", pages: 200, words: 80000, more: true }
};
const DEFAULT_FREEDOM = 3, DEFAULT_LENGTH = 4;

// The buildings on the map: chosen to fit the story, a ready-made set the game master picks, or a kit made for this
// very place (its own landmarks and streets), which takes longer and is kept for next time.
const BSETS = {
  medieval: "the medieval town (--era medieval)", industrial: "the 19th-century city, as in 1888 London (--era industrial)", modern: "the modern city (--era modern)",
  camp: "the wartime camp (city --invent ... --kind camp)", base: "the military base (city --invent ... --kind base)", future: "the future: a moon base or a station (city --invent ... --kind moonbase or station)",
  fantasy: "the fantasy town or city (city --invent ... --era fantasy): taverns, wizards' towers, temples, keeps, a great tree, standing stones"
};
const BREGIONS = { temperate: "the temperate north", mediterranean: "the Mediterranean", desert: "the desert", eastasia: "East Asia" };
function buildingsLine(o) {
  if (o.buildings === "set" && BSETS[o.bset]) return `the game master chose the ready-made set: ${BSETS[o.bset]}${BREGIONS[o.bregion] ? `, in the colours of ${BREGIONS[o.bregion]} (${o.bregion === "temperate" ? "no --region" : "--region " + o.bregion})` : ""}. Use it for the map of the whole, whatever the story's place.`;
  if (o.buildings === "custom") return "made for this place. The map's buildings are this place's own: if Atlas already has a kit for it, use it (node atlas.js kit list, then kit use); otherwise design one (references/cities.md, \"Kits\"): its famous buildings as models dressing the map's landmarks, the colours, roofs and storeys of its ordinary streets, and their details (balconies, domes); then keep it for next time with node atlas.js kit save. This takes longer, and the game master chose it.";
  return "automatic: the ready-made set that fits the story's place and time (references/cities.md); if Atlas has a kit for the very place (node atlas.js kit list), use it.";
}

// "The lighthouse - where the keeper vanished" → { name: "The lighthouse", note: "where the keeper vanished" }
function placeList(text) {
  const seen = new Set(), out = [];
  for (let l of String(text || "").split(/\r?\n/)) {
    l = l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim(); if (!l) continue;
    const m = l.match(/^(.+?)(?:\s+[-–—]\s+|:\s+)(.+)$/), name = (m ? m[1] : l).trim().slice(0, 120), note = m ? m[2].trim().slice(0, 400) : "";
    if (seen.has(name.toLowerCase())) continue; seen.add(name.toLowerCase());
    out.push({ name, note });
  }
  return out;
}

const IDLE = 20 * 60e3;   // a campaign whose files have not changed for this long is no longer being worked on

const slugOf = s => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "campaign";

function create(P) {
  const { DATA, WORK, CAMPS, ATLAS_JS, TEMPLATE, settings, runners } = P;
  const JOBS = path.join(DATA, "jobs"); fs.mkdirSync(JOBS, { recursive: true });
  const jobs = {}, running = {}, subs = {}, prog = {};

  const file = slug => path.join(JOBS, slug + ".json");
  const pub = j => { const o = Object.assign({}, j); delete o.log; return o; };
  let timer = {};
  function save(j) { clearTimeout(timer[j.slug]); timer[j.slug] = setTimeout(() => fs.writeFileSync(file(j.slug), JSON.stringify(j, null, 1)), 400); }
  function send(slug, msg) { for (const res of subs[slug] || []) { try { res.write("data: " + JSON.stringify(msg) + "\n\n"); } catch (e) {} } }
  function log(j, entry) { entry.t = Date.now(); j.log.push(entry); if (j.log.length > 800) j.log.splice(0, j.log.length - 800); save(j); send(j.slug, { type: "log", entry }); }
  function changed(j) { save(j); send(j.slug, { type: "job", job: pub(j) }); }

  // what the app found on disk when it started: a job that was working when the app closed is stopped now
  for (const f of fs.readdirSync(JOBS).filter(f => f.endsWith(".json"))) {
    try { const j = JSON.parse(fs.readFileSync(path.join(JOBS, f), "utf8")); if (j.status === "working") { j.status = "stopped"; j.note = "The app was closed while it worked. Continue to carry on where it left off."; } jobs[j.slug] = j; } catch (e) {}
  }
  // campaigns made outside the app (copied in, or older) are listed too
  try { for (const d of fs.readdirSync(CAMPS)) if (!jobs[d] && fs.existsSync(path.join(CAMPS, d, "campaign.js"))) jobs[d] = { slug: d, title: d.replace(/-/g, " "), found: true, provider: "own", status: "waiting", created: fs.statSync(path.join(CAMPS, d)).ctimeMs, cost: 0, runCost: 0, runs: 0, log: [] }; } catch (e) {}

  async function look(slug) {
    const j = jobs[slug]; if (!j) return null;
    const p = await progress(path.join(CAMPS, slug), { atlasJs: ATLAS_JS, tmplDir: TEMPLATE, job: j });
    const key = JSON.stringify(p);
    if (prog[slug] && prog[slug].key === key) return p;
    prog[slug] = { key, p };
    send(slug, { type: "progress", progress: p });
    if (j.found && p.title && p.title !== j.title) { j.title = p.title; changed(j); }
    // a campaign made in the game master's own Claude Code or Codex: finished when its page and report are there,
    // working while its files keep changing, stopped when they have been still for a while (the window closed, or the
    // plan's limit was reached), and not started before anything but the story is written
    if (j.provider === "own") {
      // working while its files or its steps keep coming, unless Claude Code has said it stopped (its Stop hook)
      const begun = p.steps.some(s => s.id !== "story" && (s.done || s.active)), recent = !j.paused && Date.now() - (j.lastActivity || 0) < IDLE;
      const want = p.page && p.report.trim() && !recent ? "finished" : recent ? "working-own" : begun ? "stopped" : "waiting";
      if (j.status !== want) { j.status = want; changed(j); }
    }
    return p;
  }
  // while anyone watches or anything works, look at the folders every few seconds
  setInterval(() => { for (const slug of Object.keys(jobs)) { if (running[slug] || (subs[slug] && subs[slug].length) || jobs[slug].status === "working-own") look(slug).catch(() => {}); watch(slug); } }, 5000).unref();

  // A campaign made in the game master's own Claude Code or Codex works in a window the app cannot read, so the app
  // follows its files instead: each file written becomes a line of "As it happens".
  const watchers = {}, lastSaid = {};
  function watch(slug) {
    const j = jobs[slug], want = j && j.provider === "own" && j.status !== "finished";
    if (!want) { if (watchers[slug]) { watchers[slug].close(); delete watchers[slug]; } return; }
    if (watchers[slug]) return;
    try {
      watchers[slug] = fs.watch(path.join(CAMPS, slug), { recursive: true }, (ev, f) => {
        if (!f) return; f = String(f).replace(/\\/g, "/");
        if (f.startsWith("dist/") && f !== "dist/preview.html") return;
        if (/(^|\/)\.|~$|\.tmp$|checklist\.md$/.test(f)) return;
        const now = Date.now();
        if (!fs.existsSync(path.join(CAMPS, slug, f)) || fs.statSync(path.join(CAMPS, slug, f)).isDirectory()) return;
        j.lastActivity = now; save(j);
        setTimeout(() => look(slug).catch(() => {}), 1500);
        // when Claude Code's own steps are coming in (its hooks), they already say this, better
        if (j.hooked && now - j.hooked < 10 * 60e3) return;
        if (now - (lastSaid[slug + f] || 0) < 30000) return; lastSaid[slug + f] = now;
        log(j, { kind: "do", text: f === "dist/preview.html" ? "Building the page" : "Writing " + nice(f, slug) });
      });
      watchers[slug].on("error", () => { try { watchers[slug].close(); } catch (e) {} delete watchers[slug]; });
    } catch (e) {}
  }

  // open the game master's own Claude Code or Codex on this campaign, with the request already typed
  const OWN_FIRST = slug => `Make the campaign in campaigns/${slug}/ from its story (story/source.md) and my choices (story/brief.md) with the campaign-atlas skill, following the house rules in this folder, all the way to the built page and REPORT.md. Do not stop to ask me anything.`;
  const OWN_AGAIN = slug => `Carry on with the campaign in campaigns/${slug}/ where the work left off. Look at what is already written, then finish the playbook of the campaign-atlas skill: whatever is missing of the council and the places, the check until it says all clear, the build, and REPORT.md. Do not stop to ask me anything.`;
  async function launch(slug, tool) {
    const j = jobs[slug]; if (!j) throw new Error("No such campaign.");
    if (j.provider !== "own") throw new Error("This campaign is made by the app itself.");
    tool = launcher.TOOLS[tool] ? tool : (j.tool || "claude");
    const found = (await launcher.detect())[tool];
    if (!found.found) throw new Error(found.label + " is not installed on this computer yet.");
    const p = prog[slug] ? prog[slug].p : await look(slug);
    const begun = p && p.steps.some(s => s.id !== "story" && (s.done || s.active));
    await launcher.open({ tool, exe: found.path, dir: WORK, prompt: begun ? OWN_AGAIN(slug) : OWN_FIRST(slug), title: j.title, scripts: path.join(DATA, "launch", slug) });
    j.tool = tool; j.launched = j.lastActivity = Date.now(); j.status = "working-own"; j.runs = (j.runs || 0) + 1;
    log(j, { kind: "note", text: found.label + " opened in its own window" + (begun ? ", to carry on." : ".") + " If it asks whether to trust the folder, say yes." });
    changed(j); watch(slug);
    return pub(j);
  }

  // ---- the game master's own Claude Code, step by step: its hooks report each step (lib/activity.js), and what it
  // says between steps comes from its conversation file. Steps are matched to a campaign by the folder they touch.
  const sessionOf = {};
  const slugIn = e => { const s = [e.file, e.cmd, e.prompt].filter(Boolean).join(" ").replace(/\\/g, "/"), m = s.match(/campaigns\/([a-z0-9][a-z0-9-]*)/); return m && jobs[m[1]] ? m[1] : null; };
  function jobFor(e) {
    const s = slugIn(e); if (s && e.sid) sessionOf[e.sid] = s;
    if (s || sessionOf[e.sid]) return jobs[s || sessionOf[e.sid]];
    // a step that names no campaign (reading the handbook, say) belongs to the campaign opened last
    const j = Object.values(jobs).filter(x => x.provider === "own" && x.launched).sort((a, b) => b.launched - a.launched)[0];
    if (j && e.sid) sessionOf[e.sid] = j.slug;
    return j;
  }
  activity.follow(path.join(WORK, ".atlas-activity.jsonl"), e => {
    const j = jobFor(e); if (!j || j.provider !== "own") return;
    const slug = j.slug, who = j.tool === "codex" ? "Codex" : "Claude Code";
    j.lastActivity = Math.max(j.lastActivity || 0, e.t || Date.now()); j.hooked = Date.now();
    let ch = false;
    if (e.ev !== "Stop" && e.ev !== "StopFailure" && e.ev !== "Notification") { if (j.waiting) { j.waiting = null; ch = true; } if (j.paused) { j.paused = null; ch = true; } }
    if (e.ev === "SessionStart") log(j, { kind: "note", text: who + " has started in its window." });
    else if (e.ev === "PreToolUse") { const d = describe(e.tool, { command: e.cmd }, slug); if (d) log(j, { kind: "do", text: d }); }
    else if (e.ev === "PostToolUse") {
      if (e.todos) { j.plan = e.todos; ch = true; }
      else if (/Bash|PowerShell/.test(e.tool || "")) {
        if (e.res && /atlas\.js\s+check\b/.test(e.cmd || "")) {
          const c = checkLine(e.res); log(j, { kind: "check", text: c.line, ok: c.ok });
          if (wholeCheck(e.cmd)) { j.check = c; ch = true; }
        }
      } else { const d = describe(e.tool, { file_path: e.file, command: e.cmd, query: e.q, url: e.url, description: e.desc }, slug); if (d) log(j, { kind: "do", text: d }); }
      if (/^(Write|Edit|MultiEdit)$/.test(e.tool || "")) setTimeout(() => look(slug).catch(() => {}), 1000);
    }
    else if (e.ev === "Notification") { j.waiting = { t: e.t, msg: e.msg || e.title || "" }; ch = true; log(j, { kind: "note", text: who + " is waiting for you in its window" + (e.msg ? ": " + e.msg : ".") }); }
    else if (e.ev === "Stop") { j.paused = { t: e.t, last: e.last || "" }; ch = true; look(slug).catch(() => {}); }
    else if (e.ev === "StopFailure") { j.paused = { t: e.t, last: "", err: e.err || e.msg || "" }; ch = true; log(j, { kind: "error", text: who + " stopped with an error" + (e.err || e.msg ? ": " + (e.err || e.msg) : "") + ". If it was your plan's limit, press Carry on once it resets." }); look(slug).catch(() => {}); }
    if (ch) changed(j); else save(j);
  }, (sid, text) => {
    const j = sessionOf[sid] && jobs[sessionOf[sid]]; if (!j) return;
    log(j, { kind: "say", text: text.length > 700 ? text.slice(0, 700) + "…" : text });
  });

  // the map of the wider world (references/world.md in the skill)
  function worldLine(o) {
    if (o.world === "drawing" && o.drawingFile) return `the game master drew their own map of the world: story/${o.drawingFile}. Make the world map from it (references/world.md, "From a drawing"): look at the picture, put every place drawn or named on it in world.js at the spot where it stands, its roads and sea lanes as routes, and its mountains, forests, rivers and lakes as features; keep the names written on it. Then atlas.js world <campaign> --drawing story/${o.drawingFile}. The places the story needs that the drawing lacks go where they fit best.`;
    if (o.world === "real" && o.worldplace) return `a map of the real world: ${o.worldplace}. Make it with atlas.js world <campaign> --real "${o.worldplace.replace(/"/g, "'")}" (references/world.md, "The real world"): its true coasts, rivers and mountains, every location found by its real name.`;
    if (o.world === "none") return "none. The game master wants no world map: make only the one city, camp, base or station the story happens in, and no world.js, even if the story travels.";
    return "automatic: make one when the story travels between places (references/world.md): the real world when the story is set in it (atlas.js world --real), otherwise a land invented for it. A story in one city needs none.";
  }
  function brief(o, places) {
    const size = SIZES[o.size] || SIZES.campaign;
    const how = places ? `exactly the ${places.length} place${places.length > 1 ? "s" : ""} the game master listed below, no more and no fewer. Map every one of them; the council decides what each holds, its tier (the places the story turns on are tier 1, at full size), and the order of the index. If the story needs a place that is not on the list, it happens somewhere that is, or it is suggested in the report without being mapped.` : size.says;
    const free = FREEDOM[o.freedom] || FREEDOM[DEFAULT_FREEDOM], len = LENGTHS[o.length] || LENGTHS[DEFAULT_LENGTH];
    const out = [`# The game master's choices`, ``, `Written by the Campaign Atlas app from what the game master chose when they pasted the story.`, ``,
      `- **Title:** ${o.title}`, `- **How big:** ${how}`,
      `- **How much the council may change the story:** ${free.label} (${o.freedom || DEFAULT_FREEDOM} of 5). ${free.says}`,
      `- **How long the story should be:** ${len.label}: the story bible runs to about ${len.pages} pages (${len.words.toLocaleString("en")} words)${len.more ? " or more" : ""}, and that is a floor, not a ceiling. Longer is better: the game master reads the bible like a detective novel, to know everything that is happening. Write the whole truth in full: what every person did and when, where every clue came from and how it got there, what each person knows and hides, and what happens if the players do nothing. Fill it with what happens, never with padding.`,
      `- **The council's job:** to make this story as interesting to play as possible, within the freedom above.`,
      `- **Buildings on the map:** ${buildingsLine(o)}`,
      `- **The world map:** ${worldLine(o)}`,
      `- **Room maps:** ${o.maps === "3d" ? "3D. campaign.js says maps: \"3d\" (atlas.js init set it): every place's rooms are shown and edited in 3D, from one fixed angle. Furnish every room the story turns on (references/workflow.md, \"Rooms in 3D\"): a room's fx preset, its I items, and the library's models in P where the story needs a particular thing (node atlas.js models <words>); give each place the light that suits it (light: \"torch\" and the others)." : "2D: flat floor plans on the grid, as usual. Any floor can still be seen in 3D from its page."}`,
      `- **Game system:** ${o.system ? o.system : "not said: choose what suits the story, and say which in the report."}`,
      `- **What must not change:** ${o.core ? o.core : "not said: the council finds the story's core itself."}`,
      `- **Wishes for particular places:** ${o.placewish && String(o.placewish).trim() ? "under \"The game master's wishes for places\" below. Follow them exactly: the sizes, floors and rooms they ask for come before the usual sizes by tier, and a place they name is mapped even if the council would have left it out." : "none."}`,
      `- **Floor plans from the game master:** ${(o.planFiles || []).length ? "in story/plans/: " + o.planFiles.map(p => `${p.file} (${p.name})`).join(", ") + ". Draw each of those places from its plan (references/workflow.md, \"From the game master's floor plan\"): look at the picture, and lay its rooms, walls, doors, windows, stairs and the names written on it on the grid, floor by floor, keeping its shape; then put the story's clues, people and secrets in its rooms. Add rooms only where the plan leaves space or the story needs them." : "none."}`,
      `- **The players' characters:** ${o.pcs && String(o.pcs).trim() ? "in story/pcs.md, as the game master gave them. Weave every one in (references/table.md, \"The players' characters\"): a hook that makes the story theirs, a secret, and a clue of their own in one of the places, written into table.js with ATLAS.pcs." : "not given: write the rest of the table material (references/table.md) without them; the game master can add their characters later."}`,
      o.notes ? `- **Other notes from the game master:** ${o.notes}` : `- **Other notes:** none.`, ``];
    if (o.placewish && String(o.placewish).trim()) out.push(`## The game master's wishes for places`, ``, String(o.placewish).trim(), ``);
    if (places) {
      out.push(`## The places`, ``, `The game master's own list, with their names as written (keep the names; the council may add a subtitle):`, ``);
      places.forEach((p, i) => out.push(`${i + 1}. **${p.name}**${p.note ? ": " + p.note : ""}`));
      out.push(``);
    }
    return out.join("\n");
  }

  function initFolder(slug, title, maps) {
    return new Promise((res, rej) => execFile(process.execPath, [ATLAS_JS, "init", path.join(CAMPS, slug), "--title", title].concat(maps === "3d" ? ["--maps", "3d"] : []), { windowsHide: true, timeout: 30000 }, (err, out, errOut) => err ? rej(new Error(String(errOut || err.message).trim())) : res()));
  }

  async function add(o) {
    const title = String(o.title || "").trim().slice(0, 120), story = String(o.story || "");
    if (!title) throw new Error("Give the campaign a title.");
    if (story.trim().length < 200) throw new Error("Paste the whole story: a few paragraphs at least.");
    if (story.length > 3e6) throw new Error("That story is longer than the app takes (about 3 MB of text).");
    const places = o.size === "unlimited" ? placeList(o.places) : null;
    if (places && !places.length) throw new Error("List your places, one per line.");
    if (places && places.length > 300) throw new Error("That is more than 300 places. Split the story into more than one campaign.");
    let slug = slugOf(title), n = 2; while (jobs[slug] || fs.existsSync(path.join(CAMPS, slug))) slug = slugOf(title) + "-" + n++;
    await initFolder(slug, title, o.maps);
    const dir = path.join(CAMPS, slug);
    fs.writeFileSync(path.join(dir, "story", "source.md"), story);
    if (o.pcs && String(o.pcs).trim()) fs.writeFileSync(path.join(dir, "story", "pcs.md"), "# The players' characters\n\nAs the game master gave them.\n\n" + String(o.pcs).slice(0, 20000).trim() + "\n");
    if (o.world === "drawing") {
      const m = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(String(o.drawing || ""));
      if (!m) throw new Error("The picture of your map could not be read: choose it again.");
      const buf = Buffer.from(m[2], "base64"); if (buf.length > 9e6) throw new Error("The picture of your map is too large.");
      o.drawingFile = "world-drawing." + (m[1] === "jpeg" ? "jpg" : m[1]);
      fs.writeFileSync(path.join(dir, "story", o.drawingFile), buf);
    }
    // the game master's floor plans, each kept under its place's name
    o.planFiles = [];
    for (const p of (Array.isArray(o.plans) ? o.plans : []).slice(0, 12)) {
      const m = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(String(p && p.data || "")); if (!m) continue;
      const buf = Buffer.from(m[2], "base64"); if (buf.length > 6e6) continue;
      const name = String(p.name || "plan").slice(0, 80), file = "plans/" + (slugOf(name) || "plan") + "." + (m[1] === "jpeg" ? "jpg" : m[1]);
      fs.mkdirSync(path.join(dir, "story", "plans"), { recursive: true }); fs.writeFileSync(path.join(dir, "story", file), buf);
      o.planFiles.push({ name, file: "story/" + file });
    }
    fs.writeFileSync(path.join(dir, "story", "brief.md"), brief(Object.assign({}, o, { title }), places));
    const provider = o.provider === "own" ? "own" : o.provider === "openai" ? "openai" : "claude";
    const r = runners[provider];
    const j = jobs[slug] = {
      slug, title, created: Date.now(), provider, tool: provider === "own" ? (o.tool === "codex" ? "codex" : "claude") : null, model: provider === "own" ? null : (o.model && r.MODELS[o.model] ? o.model : r.DEFAULT_MODEL),
      size: SIZES[o.size] ? o.size : "campaign", places: places ? places.length : null,
      freedom: FREEDOM[o.freedom] ? +o.freedom : DEFAULT_FREEDOM, length: LENGTHS[o.length] ? +o.length : DEFAULT_LENGTH,
      storyWords: (LENGTHS[o.length] || LENGTHS[DEFAULT_LENGTH]).words,
      buildings: ["set", "custom"].includes(o.buildings) ? o.buildings : "auto",
      budget: provider === "own" || !r.PRICED ? 0 : Math.max(1, Math.min(5000, +o.budget || (places ? SIZES.unlimited.cap * places.length : (SIZES[o.size] || SIZES.campaign).cap))),
      status: provider === "own" ? "waiting" : "working", cost: 0, runCost: 0, runs: 0, session: null, check: null, plan: [], log: []
    };
    save(j);
    if (provider !== "own") go(slug, true);
    return pub(j);
  }

  const FIRST = j => `A new story is waiting in campaigns/${j.slug}/story/source.md, titled "${j.title}". The game master's choices are in campaigns/${j.slug}/story/brief.md. Make it into a finished campaign in campaigns/${j.slug}/ with the campaign-atlas skill, following CLAUDE.md and the skill's playbook all the way: the council, Tolkien's judgement and the agreement, the map, every place, the check, the build, and REPORT.md. Do not stop to ask anything.`;
  const AGAIN = j => `Carry on with the campaign in campaigns/${j.slug}/ ("${j.title}") where the work left off. The files are the record: look at what is already written (story/council.md, story/judgement.md, campaign.js, places/, and \`node atlas.js status campaigns/${j.slug}\`), then finish the playbook: whatever is missing of the council and the places, the check until it says "all clear", the build, and REPORT.md.`;

  async function go(slug, first) {
    const j = jobs[slug]; if (!j || running[slug]) return;
    const runner = runners[j.provider], conn = settings.get()[j.provider];
    if (!runner || !conn || !conn.key) { j.status = "stopped"; j.note = "Connect " + (j.provider === "openai" ? "OpenAI" : "Claude") + " first, then press Continue."; changed(j); return; }
    const abort = new AbortController(); running[slug] = abort;
    j.status = "working"; j.note = ""; j.error = ""; j.runs++; j.runCost = 0; changed(j);
    log(j, { kind: "note", text: first ? "Work started with " + (runner.MODELS[j.model] || {}).label + "." : "Work resumed." });
    const left = Math.max(0.5, j.budget - j.cost);
    const emit = e => {
      if (e.kind === "session") { j.session = e.id; save(j); return; }
      if (e.kind === "tokens") { j.runTokens = e.tokens; send(slug, { type: "tokens", tokens: (j.tokens || 0) + e.tokens }); save(j); return; }
      if (e.kind === "cost") { j.runCost = e.usd; send(slug, { type: "cost", usd: j.cost + j.runCost, budget: j.budget }); save(j); return; }
      if (e.kind === "plan") { j.plan = e.todos; changed(j); return; }
      if (e.kind === "check") { log(j, { kind: "check", text: e.line, ok: e.ok }); if (e.whole) { j.check = { ok: e.ok, line: e.line, at: e.at }; changed(j); } look(slug).catch(() => {}); return; }
      if (e.kind === "do" && /^(Writing|Revising)/.test(e.text)) setTimeout(() => look(slug).catch(() => {}), 1500);
      log(j, e);
    };
    let r;
    try {
      r = await runner.run({ slug, workspace: WORK, configDir: path.join(DATA, j.provider + "-home"), key: conn.key, model: j.model, prompt: first ? FIRST(j) : AGAIN(j), resume: first ? null : j.session, budget: left, abort, emit });
    } catch (e) {
      // a conversation that cannot be picked up again is started afresh; the files carry the work
      if (!first && j.session && /session|resume|conversation/i.test(e.message || "") && !abort.signal.aborted) {
        log(j, { kind: "note", text: "The earlier conversation could not be picked up; carrying on from the files." });
        j.session = null;
        try { r = await runner.run({ slug, workspace: WORK, configDir: path.join(DATA, j.provider + "-home"), key: conn.key, model: j.model, prompt: AGAIN(j), resume: null, budget: left, abort, emit }); } catch (e2) { r = { ok: false, subtype: "failed", cost: e2.cost || 0, errors: [e2.message] }; }
      } else r = { ok: false, subtype: "failed", cost: e.cost || 0, session: e.session, errors: [e.message || String(e)] };
    }
    delete running[slug];
    j.cost += r.cost || 0; j.runCost = 0; if (r.session) j.session = r.session;
    if (r.tokens) { j.tokens = (j.tokens || 0) + r.tokens; j.runTokens = 0; }
    const p = await look(slug).catch(() => null);
    if (r.subtype === "stopped") { j.status = "stopped"; j.note = "Stopped. Continue carries on where it left off."; }
    else if (r.subtype === "error_max_budget_usd") { j.status = "capped"; j.note = `The spending cap of $${j.budget.toFixed(2)} was reached. Raise it to carry on.`; }
    else if (r.ok && p && p.page && p.report.trim()) { j.status = "finished"; j.note = ""; }
    else if (r.ok) { j.status = "stopped"; j.note = "The AI stopped before the end. Continue lets it finish."; }
    else { j.status = "failed"; j.error = (r.errors || []).join(" ").slice(0, 600) || "The work stopped with an error."; j.note = "Something went wrong. Continue tries again from where it stopped."; }
    log(j, { kind: j.status === "failed" ? "error" : "note", text: j.status === "finished" ? `Finished. Spent $${j.cost.toFixed(2)}.` : (j.error || j.note) });
    changed(j);
  }

  function stop(slug) { const a = running[slug]; if (a) a.abort(); }
  function more(slug, o) {
    const j = jobs[slug]; if (!j) throw new Error("No such campaign.");
    if (o && +o.budget > 0) j.budget = Math.min(5000, Math.max(j.cost + 0.5, +o.budget));
    if (o && o.model && runners[j.provider] && runners[j.provider].MODELS[o.model]) j.model = o.model;
    if (j.provider === "own") throw new Error("This campaign is being made in your own Claude Code or Codex.");
    changed(j); go(slug, false);
    return pub(j);
  }
  function subscribe(slug, res) {
    (subs[slug] = subs[slug] || []).push(res);
    res.on("close", () => { subs[slug] = (subs[slug] || []).filter(r => r !== res); });
    const j = jobs[slug];
    res.write("data: " + JSON.stringify({ type: "hello", job: pub(j), log: j.log.slice(-300), progress: prog[slug] ? prog[slug].p : null }) + "\n\n");
    look(slug).catch(() => {});
  }
  const list = () => Object.values(jobs).sort((a, b) => b.created - a.created).map(j => Object.assign(pub(j), { progress: prog[j.slug] ? { counts: prog[j.slug].p.counts, page: prog[j.slug].p.page } : null }));
  // the first look at every campaign, so the library can show how far each has got
  setTimeout(() => { for (const s of Object.keys(jobs)) look(s).catch(() => {}); }, 300).unref();

  // the world map's "Make its 3D map now": a city for a location that has none, generated for the campaign's age and
  // the location's kind (no AI needed), then the page built again
  function makeCity(slug, o) {
    const dir = path.join(CAMPS, slug), id = String(o.id || ""), name = String(o.name || "").replace(/["\r\n]/g, "").trim().slice(0, 80), kind = String(o.kind || "town");
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(id) || !name) return Promise.reject(new Error("Which city?"));
    let main = ""; try { main = (/look:\s*"(\w+)"/.exec(fs.readFileSync(path.join(dir, "city.js"), "utf8")) || [])[1] || ""; } catch (e) {}
    const args = [ATLAS_JS, "city", dir, "--invent", name, "--id", id];
    if (o.look === "stars" || main === "scifi") args.push("--kind", /station|ship/.test(kind) ? "station" : "moonbase");
    else {
      args.push("--era", o.look === "atlas" || main === "modern" ? "modern" : main === "fantasy" ? "fantasy" : main === "old" || main === "industrial" ? "industrial" : "medieval");
      args.push("--size", /capital|city/.test(kind) ? "city" : "town");
      if (kind === "port") args.push("--site", "harbour");
    }
    const run = a => new Promise((res, rej) => execFile(process.execPath, a, { windowsHide: true, timeout: 180000 }, (err, out, errOut) => err ? rej(new Error(String(errOut || err.message).trim().split("\n").pop())) : res(out)));
    return run(args).then(() => run([ATLAS_JS, "build", dir])).then(() => ({ ok: true, id }));
  }

  return { add, go, stop, more, launch, subscribe, list, look, makeCity, get: slug => jobs[slug], isRunning: slug => !!running[slug], SIZES };
}

module.exports = { create, SIZES, FREEDOM, LENGTHS, DEFAULT_FREEDOM, DEFAULT_LENGTH, slugOf };
