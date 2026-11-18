/* Campaign Atlas: importing an existing adventure (the user, 18 Nov 2026: docs/requests/2026-11-18-campaign-import.md;
   the design they approved: docs/plans/2026-11-18-campaign-import-plan.md; the skill's steps: references/import.md).
   The game master's own copy of an adventure (a PDF, text or Markdown, one file or several parts, or an adventure
   already in Atlas's format) becomes a campaign Atlas can run, converted faithfully, every fact with where in the
   book it came from. The source stays in the campaign folder (story/source/), private; nothing here publishes it.

   The steps, each its own command (the AI, Claude or a local model, does the reading between them):
     import <dir> <file> [<file> ...] --i-own-this [--system S] [--chunk N]
         reads the source into story/source/text.md (page by page: <!-- page N -->), cut into chunks under
         story/source/chunks/, with story/import-state.json (what is read, what is not, what is still to do)
     import-status <dir>          what is done, and the next chunk to read
     import-mark <dir> <chunk>    checks story/extract/<chunk>.json (what was read from that chunk) and marks it done
     adventure <dir>              merges every chunk's extract into story/adventure.json: the knowledge base; joins the
                                  same thing named in two chapters, checks every link, and reports what is missing
     from-adventure <dir> [--force]
                                  writes the campaign from the knowledge base: imported.js (the cast, factions, events,
                                  clocks, tables, handouts), places/<id>.js (each place, its keyed areas as its guide),
                                  adventure.js (the whole knowledge base, for the page: the dashboard, the mechanics, the
                                  Copilot); keeps story/import-baseline.json, and never writes over a file the game master
                                  has changed since (unless --force)
     ready <dir>                  the readiness check and the completion report: Ready to play, Needs review or
                                  Incomplete, each with what is wrong; story/report.md and ready.js for the page */
"use strict";
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");

const FORMAT = "atlas-adventure/1";
// what a knowledge base holds; every entry may carry ref (where in the book: "p. 45", "Ch. 4, K20") and added: true
// (Atlas's or the AI's, not the book's)
const KINDS = ["chapters", "places", "people", "factions", "quests", "encounters", "monsters", "items", "clues", "tables", "events", "choices", "endings", "mechanics", "rules", "traps", "puzzles"];
const die = m => { console.error(m); process.exit(1); };
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } };
const wr = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === "string" ? o : JSON.stringify(o, null, 2)); };
const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "x";
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^(the|a|an) /, "").replace(/[^a-z0-9]+/g, " ").trim();

/* ---- reading the source */
// the PDF's text, page by page: pdftotext where it is installed (poppler), else pdf.js fetched beside the app
// (lib/deps.js, "pdf"), else a clear message; a page with no text (a scan) is reported, never guessed
async function pdfPages(file) {
  try { const out = execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], { maxBuffer: 1 << 30 }).toString("utf8"); return out.split("\f").map(s => s.replace(/\s+$/, "")); } catch (e) { if (e.code !== "ENOENT") console.warn("pdftotext could not read it (" + e.message.split("\n")[0] + "); trying pdf.js"); }
  const dirs = [process.env.ATLAS_DEPS, path.resolve(__dirname, "../../../../.deps"), path.resolve(process.cwd(), ".deps")].filter(Boolean);
  let lib = null;
  for (const d of dirs) { const p = path.join(d, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs"); if (fs.existsSync(p)) { lib = await import(require("url").pathToFileURL(p).href); break; } }
  if (!lib) die("To read a PDF, Atlas needs pdftotext (poppler: apt install poppler-utils, brew install poppler) or pdf.js:\n  npm install --prefix <the app folder>/.deps pdfjs-dist@4.10.38\nThe workspace app fetches pdf.js by itself the first time a PDF is imported. Or give the adventure as text or Markdown.");
  const doc = await lib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), useSystemFonts: true, isEvalSupported: false }).promise, pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pg = await doc.getPage(n), tc = await pg.getTextContent(), lines = []; let y = null, line = "";
    for (const it of tc.items) { const yy = Math.round(it.transform[5]); if (y !== null && Math.abs(yy - y) > 2) { lines.push(line); line = ""; } line += (line && !line.endsWith(" ") && !it.str.startsWith(" ") ? " " : "") + it.str; y = yy; if (it.hasEOL) { lines.push(line); line = ""; y = null; } }
    if (line) lines.push(line); pages.push(lines.join("\n").replace(/[ \t]+\n/g, "\n"));
  }
  return pages;
}
// a text or Markdown file: its own page markers if it has them (<!-- page 12 -->, [p. 12], "Page 12" alone on a line),
// else one "page" a section
function textPages(t) {
  const marks = [...t.matchAll(/^(?:<!--\s*page\s+(\d+)\s*-->|\[p\.?\s*(\d+)\]|page\s+(\d+))\s*$/gim)];
  if (marks.length > 1) { const out = []; marks.forEach((m, i) => { const n = +(m[1] || m[2] || m[3]), a = m.index + m[0].length, b = i + 1 < marks.length ? marks[i + 1].index : t.length; out[n - 1] = (out[n - 1] || "") + t.slice(a, b).trim(); }); return out.map(x => x || ""); }
  return [t];
}
// the headings of a page: Markdown #, or short lines in capitals, or "Chapter N", or a keyed area ("K20. Name", "E4 ")
const HEAD = /^(#{1,4}\s+.+|chapter\s+\d+[^\n]{0,60}|appendix\s+[a-z][^\n]{0,60}|[A-Z][A-Z0-9 ,'’:&-]{4,60}|[A-Z]{1,2}\d{1,3}[a-z]?\.\s+[^\n]{2,60})$/;
const headingsOf = t => String(t).split("\n").map(l => l.trim()).filter(l => l.length > 3 && l.length < 70 && HEAD.test(l)).map(l => l.replace(/^#+\s*/, "")).slice(0, 40);

async function cmdImport(dir, files, flags) {
  if (!dir || !fs.existsSync(path.join(dir, "campaign.js"))) die("Which campaign folder? Start one first: node atlas.js init <dir> --title \"...\"; then: node atlas.js import <dir> <file> --i-own-this");
  if (!files.length) die("Which file? node atlas.js import <dir> <adventure.pdf | .txt | .md | .json> [more parts in order] --i-own-this");
  if (!flags["i-own-this"]) die("Import only your own copy of an adventure, for your own table: say so with --i-own-this. Atlas keeps it in this campaign folder and never publishes it; the page made from it holds the campaign, not the book.");
  const S = path.join(dir, "story", "source"); fs.mkdirSync(path.join(S, "chunks"), { recursive: true });
  // an adventure already in Atlas's format: straight to the knowledge base
  if (files.length === 1 && /\.json$/i.test(files[0])) { const kb = rd(files[0], null); if (!kb || kb.format !== FORMAT) die(`${files[0]} is not an adventure in Atlas's format (format: "${FORMAT}")`); wr(path.join(dir, "story", "adventure.json"), kb); console.log("An adventure in Atlas's format: story/adventure.json. Next: node atlas.js adventure " + dir); return; }
  const prev = flags.append ? rd(path.join(dir, "story", "import-state.json"), null) : null;
  let pages = prev ? (fs.readFileSync(path.join(S, "text.md"), "utf8").split(/^<!-- page \d+ -->$/m).slice(1).map(s => s.trim())) : [], parts = prev ? prev.source.files : [];
  for (const f of files) {
    if (!fs.existsSync(f)) die("No such file: " + f);
    const base = path.basename(f), keep = path.join(S, base); if (path.resolve(f) !== path.resolve(keep)) fs.copyFileSync(f, keep);
    const got = /\.pdf$/i.test(f) ? await pdfPages(f) : textPages(fs.readFileSync(f, "utf8"));
    parts.push({ file: base, kind: /\.pdf$/i.test(f) ? "pdf" : /\.md$/i.test(f) ? "markdown" : "text", firstPage: pages.length + 1, pages: got.length });
    pages = pages.concat(got);
  }
  const text = pages.map((t, i) => `<!-- page ${i + 1} -->\n${t}`).join("\n\n");
  wr(path.join(S, "text.md"), text);
  const unread = pages.map((t, i) => [i + 1, t.replace(/\s+/g, "").length]).filter(([, n]) => n < 40).map(([n]) => n);
  // the chunks: whole pages, cut at a heading where one is near, about --chunk characters each (smaller for a local model)
  const size = Math.max(2000, +flags.chunk || 14000), chunks = []; let cur = { pages: [], chars: 0, heads: [] };
  pages.forEach((t, i) => {
    const h = headingsOf(t), big = cur.chars + t.length > size, cut = cur.pages.length && (big || (cur.chars > size * .6 && /^(chapter|appendix)/i.test(h[0] || "")));
    if (cut) { chunks.push(cur); cur = { pages: [], chars: 0, heads: [] }; }
    cur.pages.push(i + 1); cur.chars += t.length; cur.heads.push(...h);
  });
  if (cur.pages.length) chunks.push(cur);
  fs.readdirSync(path.join(S, "chunks")).forEach(f => fs.unlinkSync(path.join(S, "chunks", f)));
  const st = { format: FORMAT, source: { files: parts, pages: pages.length, chars: text.length, unreadable: unread, rights: { own: true, t: new Date().toISOString(), note: "The game master's own copy, for their own table. Kept in this folder; never published." } },
    system: flags.system && flags.system !== true ? String(flags.system) : null, chunkSize: size,
    chunks: chunks.map((c, i) => { const id = String(i + 1).padStart(3, "0"), f = `story/source/chunks/${id}.md`; wr(path.join(dir, f), `<!-- chunk ${id}: pages ${c.pages[0]}-${c.pages[c.pages.length - 1]} -->\n` + c.pages.map(n => `<!-- page ${n} -->\n${pages[n - 1]}`).join("\n\n")); return { id, file: f, pages: [c.pages[0], c.pages[c.pages.length - 1]], chars: c.chars, heads: [...new Set(c.heads)].slice(0, 30), status: "todo" }; }) };
  wr(path.join(dir, "story", "import-state.json"), st);
  console.log(`Read ${parts.map(p => p.file).join(" + ")}: ${pages.length} page${pages.length === 1 ? "" : "s"}, ${text.length.toLocaleString("en")} characters, in ${st.chunks.length} chunk${st.chunks.length === 1 ? "" : "s"} of about ${size.toLocaleString("en")}.`);
  if (unread.length) console.log(`  ${unread.length} page${unread.length > 1 ? "s have" : " has"} no text to read (scanned or pictures): ${unread.slice(0, 30).join(", ")}${unread.length > 30 ? "…" : ""}. They are reported as missing, never guessed: give their text, or an OCR'd copy.`);
  console.log(`Next: read each chunk (references/import.md) into story/extract/<chunk>.json, then node atlas.js import-mark ${dir} <chunk>. node atlas.js import-status ${dir} says what is left.`);
}
function cmdStatus(dir) {
  const st = rd(path.join(dir, "story", "import-state.json"), null); if (!st) die("Nothing imported yet: node atlas.js import " + dir + " <file> --i-own-this");
  const done = st.chunks.filter(c => c.status === "done"), next = st.chunks.find(c => c.status !== "done");
  console.log(`${done.length} of ${st.chunks.length} chunks read (pages ${st.source.pages}).${st.source.unreadable.length ? ` ${st.source.unreadable.length} pages had no text.` : ""}`);
  if (next) console.log(`Next: chunk ${next.id}, pages ${next.pages[0]}-${next.pages[1]}${next.heads.length ? " (" + next.heads.slice(0, 6).join("; ") + ")" : ""}: ${next.file} → story/extract/${next.id}.json`);
  else console.log("Every chunk is read. Next: node atlas.js adventure " + dir);
}
// what one chunk's reading must look like: a partial knowledge base
function checkPart(o, where) {
  const errs = [];
  if (!o || typeof o !== "object") return ["not a JSON object"];
  for (const k of Object.keys(o)) if (!KINDS.includes(k) && !["setting", "start", "title", "system", "notes", "chunk"].includes(k)) errs.push(`unknown section "${k}" (one of: ${KINDS.join(", ")})`);
  for (const k of KINDS) if (o[k] != null) { if (!Array.isArray(o[k])) { errs.push(`${k} must be a list`); continue; } o[k].forEach((x, i) => { if (!x || !(x.name || x.title || x.text)) errs.push(`${k}[${i}] has no name`); if (x && !x.ref && !x.added) errs.push(`${k}[${i}] (${x.name || x.title || ""}) has no ref: where in the book it comes from${where ? " (this chunk: " + where + ")" : ""}`); }); }
  return errs;
}
function cmdMark(dir, id) {
  const sf = path.join(dir, "story", "import-state.json"), st = rd(sf, null); if (!st) die("Nothing imported yet.");
  const c = st.chunks.find(x => x.id === String(id).padStart(3, "0")); if (!c) die("No chunk " + id);
  const ef = path.join(dir, "story", "extract", c.id + ".json"), o = rd(ef, null); if (!o) die(`No reading of chunk ${c.id} yet: write ${path.relative(dir, ef)} (references/import.md)`);
  const errs = checkPart(o, `pages ${c.pages[0]}-${c.pages[1]}`); if (errs.length) die(`story/extract/${c.id}.json:\n  - ${errs.slice(0, 20).join("\n  - ")}`);
  c.status = "done"; c.counts = Object.fromEntries(KINDS.filter(k => (o[k] || []).length).map(k => [k, o[k].length])); c.nothing = !Object.keys(c.counts).length;
  wr(sf, st);
  console.log(`Chunk ${c.id} read: ${Object.entries(c.counts).map(([k, n]) => n + " " + k).join(", ") || "nothing of the campaign in it (said so)"}.`); cmdStatus(dir);
}

/* ---- the knowledge base: every chunk's reading merged */
const key = x => x.id || slug(x.name || x.title || x.text);
function merge(into, from) {
  for (const k of KINDS) for (const x of from[k] || []) {
    const L = into[k] = into[k] || [], id = key(x), same = L.find(y => y.id === id || (norm(y.name || y.title) && norm(y.name || y.title) === norm(x.name || x.title)) || (x.aka || []).some(a => norm(a) === norm(y.name)));
    if (!same) { L.push(Object.assign({ id }, x, { refs: [].concat(x.ref || []) })); continue; }
    for (const [f, v] of Object.entries(x)) {
      if (f === "ref") { same.refs = [...new Set([...(same.refs || []), ...[].concat(v)])]; continue; }
      if (v == null || v === "") continue;
      if (Array.isArray(v)) same[f] = [...(same[f] || []), ...v.filter(e => !(same[f] || []).some(o => JSON.stringify(o) === JSON.stringify(e)))];
      else if (typeof v === "string" && typeof same[f] === "string" && same[f] && !same[f].includes(v)) same[f] = same[f].length >= v.length ? same[f] : v;
      else if (same[f] == null || same[f] === "") same[f] = v;
    }
  }
  for (const f of ["setting", "start", "title", "system"]) if (from[f] && !into[f]) into[f] = from[f];
  return into;
}
// every link between the parts of the knowledge base, and what it points to that is not there
const LINKS = { places: ["parent", "region"], people: ["at", "faction", "place"], factions: ["leader", "hq"], quests: ["giver", "place", "target"], encounters: ["place"], items: ["place", "holder"], clues: ["place", "points", "about"], events: ["place"], choices: ["place"], mechanics: [] };
function index(kb) { const by = {}; for (const k of KINDS) for (const x of kb[k] || []) { by[k + ":" + x.id] = x; by["*:" + x.id] = x; by["n:" + norm(x.name || x.title)] = x; } return by; }
function resolve(by, v) { if (!v) return null; return by["*:" + v] || by["n:" + norm(v)] || by["*:" + slug(v)] || null; }
function crossCheck(kb) {
  const by = index(kb), dangling = [], dup = [];
  for (const [k, fields] of Object.entries(LINKS)) for (const x of kb[k] || []) for (const f of fields) for (const v of [].concat(x[f] || [])) if (typeof v === "string" && !resolve(by, v)) dangling.push(`${k} "${x.name || x.title}": its ${f} "${v}" is nowhere in the adventure`);
  for (const x of kb.items || []) if (x.unique && (kb.items || []).filter(y => norm(y.name) === norm(x.name)).length > 1) dup.push(`the unique item "${x.name}" appears more than once`);
  // a mechanic's options must point at things that exist: place:<id>[/<area>], person:<id>, item:<id>, quest:<id>
  for (const m of kb.mechanics || []) for (const s of m.slots || []) for (const o of s.options || []) { const v = String(o.value || ""), [kind, rest] = [v.split(":")[0], v.slice(v.indexOf(":") + 1)]; if (!rest || kind === "text") continue;
    const [id, area] = rest.split("/"), hit = resolve(by, id);
    if (!hit) dangling.push(`mechanic "${m.name}", ${o.card || o.range || "an option"} of "${s.name}": ${v} is nowhere in the adventure`);
    else if (area && kind === "place" && !(hit.areas || []).some(a => a.id === area)) dangling.push(`mechanic "${m.name}", ${o.card || o.range || "an option"} of "${s.name}": ${hit.name} has no area ${area}`); }
  for (const m of kb.mechanics || []) for (const s of m.slots || []) for (const t of [].concat(s.sets || [])) { const [kind] = String(t).split(":"); if (!["item", "person", "place", "quest", "text"].includes(kind)) dangling.push(`mechanic "${m.name}", slot "${s.name}": sets "${t}", which is not item:, person:, place:, quest: or text:`); }
  return { dangling: [...new Set(dangling)], dup: [...new Set(dup)] };
}
function cmdAdventure(dir) {
  const st = rd(path.join(dir, "story", "import-state.json"), null), af = path.join(dir, "story", "adventure.json");
  let kb = rd(af, null);
  if (st) {
    kb = { format: FORMAT, title: null, system: st.system, source: st.source, coverage: {} };
    for (const c of st.chunks) { const o = rd(path.join(dir, "story", "extract", c.id + ".json"), null); if (o && c.status === "done") merge(kb, o); }
    const notRead = st.chunks.filter(c => c.status !== "done"), empty = st.chunks.filter(c => c.status === "done" && c.nothing);
    kb.coverage = { chunks: st.chunks.length, read: st.chunks.length - notRead.length, notRead: notRead.map(c => ({ id: c.id, pages: c.pages })), saidEmpty: empty.map(c => ({ id: c.id, pages: c.pages })), unreadablePages: st.source.unreadable, pages: st.source.pages };
  } else if (!kb) die("Nothing to make a knowledge base from: node atlas.js import " + dir + " <file> --i-own-this, or give an adventure.json");
  for (const k of KINDS) kb[k] = kb[k] || [];
  const x = crossCheck(kb); kb.check = x;
  wr(af, kb);
  const n = k => kb[k].length, ai = KINDS.reduce((a, k) => a + kb[k].filter(e => e.added).length, 0);
  console.log(`story/adventure.json: ${KINDS.filter(k => n(k)).map(k => n(k) + " " + k).join(", ")}${ai ? `; ${ai} of them Atlas's additions (marked added)` : ""}.`);
  if (kb.coverage && kb.coverage.notRead && kb.coverage.notRead.length) console.log(`  NOT READ YET: ${kb.coverage.notRead.length} chunk${kb.coverage.notRead.length > 1 ? "s" : ""} (${kb.coverage.notRead.map(c => "pages " + c.pages.join("-")).join("; ")}). The campaign is incomplete until they are.`);
  if (x.dangling.length) console.log(`  ${x.dangling.length} link${x.dangling.length > 1 ? "s" : ""} to something not in the adventure:\n    - ${x.dangling.slice(0, 25).join("\n    - ")}`);
  if (x.dup.length) console.log(`  ${x.dup.join("; ")}`);
}

/* ---- the campaign from the knowledge base */
const js = o => JSON.stringify(o, null, 2);
const refOf = x => [].concat(x.refs || x.ref || []).filter(Boolean).join("; ");
function placeId(by, v) { const p = resolve(by, v); return p ? p.id : v ? slug(v) : null; }
function buildFiles(kb) {
  const by = index(kb), files = {}, people = {}, factions = {}, events = [], tables = {}, clocks = [], handouts = [];
  for (const p of kb.people) {
    const at = placeId(by, p.at || p.place);
    people[p.id] = { n: p.name, role: p.role || "", look: p.look || "", manner: p.manner || p.personality || "", voice: p.voice || p.dialogue || "", bg: p.bg || p.background || "", want: p.want || p.motivation || "", secret: p.secret || "", press: p.press || "", fate: p.fate || "",
      ties: Object.fromEntries((p.ties || p.relationships || []).map(t => typeof t === "string" ? [t, ""] : [(resolve(by, t.who) || {}).id || t.who, t.how || t.text || ""]).filter(([k]) => k)), src: { ref: refOf(p), added: !!p.added }, home: at || undefined, stats: p.stats || undefined };
    for (const kk of Object.keys(people[p.id])) if (people[p.id][kk] === undefined || people[p.id][kk] === "") delete people[p.id][kk];
  }
  for (const f of kb.factions) factions[f.id] = { n: f.name, kind: f.kind || "", leader: (resolve(by, f.leader) || {}).name || f.leader || "", hq: placeId(by, f.hq) || undefined, territory: (f.territory || []).map(t => placeId(by, t)), wants: f.wants || "", plan: f.plan || [], doing: f.doing || "", rels: f.rels || {}, src: { ref: refOf(f), added: !!f.added } };
  for (const e of kb.events) events.push({ id: e.id, title: e.title || e.name, when: e.when || "", place: placeId(by, e.place) || undefined, what: e.what || e.text || "", why: e.why || "", players: e.players || "", importance: e.importance || "notable", src: { ref: refOf(e), added: !!e.added } });
  for (const t of kb.tables) tables[t.name] = (t.rows || []).map(r => typeof r === "string" ? r : (r.range ? r.range + ": " : "") + (r.text || ""));
  for (const h of kb.items.filter(x => x.handout)) handouts.push({ id: "h-" + h.id, title: h.name, text: h.handout, place: placeId(by, h.place) || undefined });
  for (const q of kb.quests.filter(x => x.clock)) clocks.push({ id: "q-" + q.id, name: q.name, size: +q.clock || 6, what: q.goal || "" });
  // what each person knows (the investigation's knowledge: only what the book says they know), the quests as story
  // elements, and the ties of person to power and quest to giver, for the Copilot and the story's web (atlas-story.js)
  const ref2 = v => { const x = resolve(by, v); if (!x) return null; return kb.people.includes(x) ? "cast:" + x.id : kb.places.includes(x) ? "place:" + x.id : kb.factions.includes(x) ? "item:faction-" + x.id : kb.quests.includes(x) ? "item:quest-" + x.id : null; };
  const knowledge = [], sitems = [], links = [];
  for (const p of kb.people) (p.knows || []).forEach((k, i) => knowledge.push({ id: `kb-${p.id}-${i}`, who: "cast:" + p.id, text: typeof k === "string" ? k : k.text, about: typeof k === "string" ? undefined : ref2(k.about) || undefined, type: "fact", how: "present", share: k.share || "pressed", src: { ref: (typeof k === "string" ? "" : k.ref) || refOf(p), added: !!p.added } }));
  for (const f of kb.factions) sitems.push({ id: "faction-" + f.id, n: f.name, kind: "faction", d: [f.kind, f.wants && "Wants: " + f.wants].filter(Boolean).join(". "), src: { ref: refOf(f) } });
  for (const q of kb.quests) sitems.push({ id: "quest-" + q.id, n: q.name, kind: "quest", d: [q.goal, q.reward && "Reward: " + q.reward].filter(Boolean).join(" "), src: { ref: refOf(q), optional: !!q.optional } });
  for (const p of kb.people) if (p.faction && resolve(by, p.faction)) links.push({ id: `kb-l-${p.id}-f`, a: "cast:" + p.id, b: ref2(p.faction), rel: "belongs to", src: { ref: refOf(p) } });
  for (const q of kb.quests) if (q.giver && ref2(q.giver)) links.push({ id: `kb-l-${q.id}-g`, a: ref2(q.giver), b: "item:quest-" + q.id, rel: "involves", src: { ref: refOf(q) } });
  files["imported.js"] = `// What the adventure brings (atlas.js from-adventure, from story/adventure.json): its people, powers, events, tables and
// handouts, each with where in the book it comes from (src.ref); src.added marks Atlas's own additions. Change anything:
// a file you change is never written over again without --force (story/import-baseline.json keeps what was imported).
ATLAS.cast(${js(people)});
${Object.keys(factions).length ? `ATLAS.factions(${js(factions)});` : ""}
${events.length ? `ATLAS.events(${js(events)});` : ""}
${Object.keys(tables).length ? `ATLAS.tables(${js(tables)});` : ""}
${handouts.length ? `ATLAS.handouts(${js(handouts)});` : ""}
${clocks.length ? `ATLAS.clocks(${js(clocks)});` : ""}
${knowledge.length || sitems.length || links.length ? `if (ATLAS.storyEdit) ATLAS.storyEdit(${js({ knowledge, items: sitems, links })});` : ""}
`;
  // each place, its keyed areas as its guide (until its map is drawn: references/import.md, step 5)
  const tierOf = p => p.tier || (kb.start && placeId(by, kb.start.place) === p.id ? 1 : (kb.encounters.filter(e => placeId(by, e.place) === p.id).length + (p.areas || []).length) > 10 ? 1 : (p.areas || []).length > 2 ? 2 : 3);
  for (const p of kb.places) {
    const enc = kb.encounters.filter(e => placeId(by, e.place) === p.id), its = kb.items.filter(i => placeId(by, i.place) === p.id), clues = kb.clues.filter(c => placeId(by, c.place) === p.id), who = kb.people.filter(x => placeId(by, x.at || x.place) === p.id);
    const def = { name: p.name, tier: tierOf(p), tagline: p.tagline || String(p.desc || "").split(/(?<=\.)\s/)[0].slice(0, 160), cat: p.cat || (kb.start && placeId(by, kb.start.place) === p.id ? "start" : "lead"), region: (resolve(by, p.region || p.parent) || {}).name || p.region || undefined,
      src: { ref: refOf(p), added: !!p.added, kind: p.kind || "" },
      hooks: [...enc.filter(e => e.kind !== "combat" || e.hook).map(e => ({ t: e.name, d: [e.conditions, e.outcomes && [].concat(e.outcomes).join(" / ")].filter(Boolean).join(" "), src: refOf(e) })), ...kb.quests.filter(q => placeId(by, q.place) === p.id).map(q => ({ t: q.name, d: q.goal || "", src: refOf(q) }))],
      imp: { intro: p.desc || "", gm: p.gm || "", areas: (p.areas || []).map(a => ({ id: a.id || slug(a.name), name: a.name, desc: a.desc || "", gm: a.gm || "", ref: refOf(a) || a.ref || "" })),
        people: who.map(x => x.id), encounters: enc.map(e => e.id), items: its.map(i => i.id), clues: clues.map(c => ({ t: c.text || c.name, points: [].concat(c.points || []).map(v => placeId(by, v)), area: c.area || "", ref: refOf(c) })) } };
    for (const kk of Object.keys(def)) if (def[kk] === undefined) delete def[kk];
    files[`places/${p.id}.js`] = `// ${p.name}: from the adventure (${refOf(p) || "no reference"}). Its keyed areas (imp.areas) are read at the table until its map is drawn.\nATLAS.place(${JSON.stringify(p.id)}, ${js(def)});\n`;
  }
  files["adventure.js"] = `// The adventure's knowledge base, for the page (atlas.js from-adventure): the dashboard, the mechanics, the readiness
// report and the Copilot read it. Made from the game master's own copy; it stays private with this campaign.
ATLAS.adventure(${JSON.stringify(Object.assign({}, kb, { source: Object.assign({}, kb.source || {}, { files: ((kb.source || {}).files || []).map(f => ({ file: f.file, pages: f.pages })) }) }))});\n`;
  return files;
}
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
function cmdFromAdventure(dir, flags) {
  const kb = rd(path.join(dir, "story", "adventure.json"), null); if (!kb) die("No story/adventure.json yet: node atlas.js adventure " + dir);
  for (const k of KINDS) kb[k] = kb[k] || [];
  const bf = path.join(dir, "story", "import-baseline.json"), base = rd(bf, { files: {} }), files = buildFiles(kb), kept = [], wrote = [];
  for (const [f, s] of Object.entries(files)) {
    const p = path.join(dir, f), had = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null, b = base.files[f];
    // a file changed since the last import is the game master's: never written over without --force
    if (had != null && b && hash(had) !== b.hash && hash(had) !== hash(s) && !flags.force) { kept.push(f); continue; }
    if (had != null && !b && had !== s && !flags.force && f !== "adventure.js") { kept.push(f); continue; }
    wr(p, s); wrote.push(f); base.files[f] = { hash: hash(s), t: new Date().toISOString(), text: s };
  }
  base.format = FORMAT; base.t = new Date().toISOString(); wr(bf, base);
  // the build reads them (atlas.js sources: imported.js, adventure.js, ready.js)
  console.log(`Wrote ${wrote.length} file${wrote.length === 1 ? "" : "s"}: ${wrote.slice(0, 12).join(", ")}${wrote.length > 12 ? "…" : ""}.`);
  if (kept.length) console.log(`Kept as you changed them (not written over; --force to replace them with the adventure's version): ${kept.join(", ")}.`);
  console.log("Next: node atlas.js ready " + dir + ", then draw the places' maps (references/import.md, step 5) and build.");
}

/* ---- the readiness check and the completion report */
function cmdReady(dir) {
  const kb = rd(path.join(dir, "story", "adventure.json"), null); if (!kb) die("No story/adventure.json yet.");
  for (const k of KINDS) kb[k] = kb[k] || [];
  const by = index(kb), has = f => fs.existsSync(path.join(dir, f)), rep = { t: new Date().toISOString(), checks: [], counts: {}, review: [] };
  const add = (id, label, state, why, link) => rep.checks.push({ id, label, state, why, link });
  const cov = kb.coverage || {};
  add("source", "The source is read", cov.notRead && cov.notRead.length ? "incomplete" : cov.unreadablePages && cov.unreadablePages.length ? "review" : "ready",
    cov.notRead && cov.notRead.length ? `${cov.notRead.length} of ${cov.chunks} chunks are not read yet (${cov.notRead.map(c => "pages " + c.pages.join("-")).join("; ")})` : cov.unreadablePages && cov.unreadablePages.length ? `${cov.unreadablePages.length} pages had no text (scans): ${cov.unreadablePages.slice(0, 20).join(", ")}` : cov.chunks ? `all ${cov.chunks} chunks (${cov.pages} pages)` : "the adventure was given in Atlas's format", "import");
  const startP = kb.start && resolve(by, kb.start.place);
  add("start", "Where it starts", startP ? "ready" : "incomplete", startP ? `${startP.name}${kb.start.hook ? ": " + kb.start.hook : ""}` : "the adventure's starting place is not known", "places");
  const unmapped = kb.places.filter(p => !has(`places/${p.id}.js`)), noMap = kb.places.filter(p => has(`places/${p.id}.js`) && !/\bmap\s*:/.test(fs.readFileSync(path.join(dir, `places/${p.id}.js`), "utf8")) && !fs.existsSync(path.join(dir, "edits", p.id + ".js")));
  add("places", "Places", !kb.places.length ? "incomplete" : unmapped.length ? "incomplete" : noMap.length ? "review" : "ready", !kb.places.length ? "no places" : unmapped.length ? `${unmapped.length} not written yet (atlas.js from-adventure)` : noMap.length ? `${kb.places.length} places; ${noMap.length} have no map drawn yet: they play from their keyed areas (${noMap.slice(0, 8).map(p => p.name).join(", ")}${noMap.length > 8 ? "…" : ""})` : `${kb.places.length}, every one mapped`, "places");
  const key = kb.people.filter(p => p.important || p.role), thin = key.filter(p => !(p.want || p.motivation) || !(p.look || p.personality || p.manner));
  add("people", "Important people", !kb.people.length ? "incomplete" : thin.length ? "review" : "ready", !kb.people.length ? "no people" : thin.length ? `${kb.people.length} people; ${thin.length} lack a look or what they want: ${thin.slice(0, 6).map(p => p.name).join(", ")}` : `${kb.people.length}`, "people");
  const noStats = kb.encounters.filter(e => e.kind === "combat" && (e.participants || []).some(x => !x.stats && !(resolve(by, x.name) || {}).stats));
  add("encounters", "Encounters and their statistics", !kb.encounters.length ? "review" : noStats.length ? "review" : "ready", !kb.encounters.length ? "no encounters found" : noStats.length ? `${kb.encounters.length} encounters; ${noStats.length} fights have someone with no statistics or book reference: ${noStats.slice(0, 6).map(e => e.name).join(", ")}` : `${kb.encounters.length}`, "encounters");
  const lost = kb.items.filter(i => (i.unique || i.story) && !i.place && !i.holder && !i.mechanic);
  add("items", "Important items placed", lost.length ? "review" : "ready", lost.length ? `${lost.length} story items have no place, holder or mechanic: ${lost.map(i => i.name).join(", ")}` : `${kb.items.length} items`, "items");
  const mechs = kb.mechanics || [];
  add("mechanics", "Special mechanics", !mechs.length ? "ready" : mechs.some(m => !(m.slots || []).length) ? "review" : "ready", !mechs.length ? "none in this adventure" : `${mechs.map(m => m.name).join(", ")}: set up on the page (At the table, Start here), once, then kept${mechs.some(m => !(m.slots || []).length) ? "; one has nothing it sets" : ""}`, "mechanics");
  const x = crossCheck(kb);
  add("links", "Story links and triggers", x.dangling.length ? "review" : "ready", x.dangling.length ? `${x.dangling.length} links point to nothing: ${x.dangling.slice(0, 5).join("; ")}` : "every link resolves", "links");
  add("opening", "The opening session", startP && kb.people.some(p => resolve(by, p.at) === startP) ? "ready" : startP ? "review" : "incomplete", startP ? (kb.people.some(p => resolve(by, p.at) === startP) ? `opens at ${startP.name}, with ${kb.people.filter(p => resolve(by, p.at) === startP).map(p => p.name).join(", ")}` : `opens at ${startP.name}, with nobody placed there`) : "no start", "start");
  // the DM's secrets stay the DM's: nothing secret written into what the players are given
  const leaks = kb.items.filter(i => i.handout && i.gm && String(i.handout).includes(String(i.gm).slice(0, 30)));
  add("secrets", "Secrets kept from the players", leaks.length ? "incomplete" : "ready", leaks.length ? `${leaks.length} handouts carry the game master's notes: ${leaks.map(i => i.name).join(", ")}` : "handouts carry only what the players may read; the page's player view and the players' copy hold no secrets (checked when built: node atlas.js check)", "secrets");
  for (const k of KINDS) rep.counts[k] = kb[k].length;
  for (const k of KINDS) for (const e of kb[k]) if (e.added) rep.review.push({ kind: k, id: e.id, name: e.name || e.title, why: "Atlas's addition, not the book's" });
  rep.state = rep.checks.some(c => c.state === "incomplete") ? "incomplete" : rep.checks.some(c => c.state === "review") || rep.review.length ? "review" : "ready";
  rep.chapters = (kb.chapters || []).map(c => ({ name: c.name || c.title, ref: refOf(c) }));
  wr(path.join(dir, "story", "report.json"), rep);
  wr(path.join(dir, "ready.js"), `// The readiness check and completion report (atlas.js ready): read by the page's Start here.\nATLAS.readiness(${JSON.stringify(rep)});\n`);
  const W = { ready: "Ready to play", review: "Needs review", incomplete: "Incomplete" };
  const md = [`# ${kb.title || "The adventure"}: completion report`, "", `**${W[rep.state]}**, ${rep.t.slice(0, 10)}`, "", "| Check | State | |", "|---|---|---|", ...rep.checks.map(c => `| ${c.label} | ${W[c.state]} | ${c.why.replace(/\|/g, "/")} |`), "",
    "## What was made", "", ...KINDS.filter(k => rep.counts[k]).map(k => `- ${k}: ${rep.counts[k]}`), "", rep.chapters.length ? "## Chapters\n\n" + rep.chapters.map(c => `- ${c.name}${c.ref ? " (" + c.ref + ")" : ""}`).join("\n") + "\n" : "",
    rep.review.length ? "## Atlas's additions, to review\n\n" + rep.review.map(r => `- ${r.kind}: ${r.name}`).join("\n") + "\n" : ""];
  wr(path.join(dir, "story", "report.md"), md.join("\n"));
  console.log(`${W[rep.state]}.`); for (const c of rep.checks) console.log(`  ${c.state === "ready" ? "✓" : c.state === "review" ? "!" : "✗"} ${c.label}: ${c.why}`);
  if (rep.review.length) console.log(`  ${rep.review.length} of Atlas's additions to review.`);
  console.log("story/report.md, and ready.js for the page.");
}

async function run(cmd, pos, flags) {
  if (cmd === "import") return cmdImport(pos[0], pos.slice(1), flags);
  if (cmd === "import-status") return cmdStatus(pos[0]);
  if (cmd === "import-mark") return cmdMark(pos[0], pos[1]);
  if (cmd === "adventure") return cmdAdventure(pos[0]);
  if (cmd === "from-adventure") return cmdFromAdventure(pos[0], flags);
  if (cmd === "ready") return cmdReady(pos[0]);
}
module.exports = { run, FORMAT, KINDS, merge, crossCheck, buildFiles, checkPart, headingsOf, textPages };
