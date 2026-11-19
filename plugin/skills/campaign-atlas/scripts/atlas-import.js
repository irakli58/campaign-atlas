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
  // (an imported adventure: its places as the book has them, so the standards for the council's campaigns do not apply)
  { const cf = path.join(dir, "campaign.js"), t = fs.readFileSync(cf, "utf8"); if (!/\bmade:\s*"/.test(t)) fs.writeFileSync(cf, t.replace(/(\n\s*storageKey:\s*"[^"]*")/, `\n  made: "import",                       // an adventure the game master owns, imported (references/import.md)$1`)); }
  // the build reads them (atlas.js sources: imported.js, adventure.js, ready.js)
  console.log(`Wrote ${wrote.length} file${wrote.length === 1 ? "" : "s"}: ${wrote.slice(0, 12).join(", ")}${wrote.length > 12 ? "…" : ""}.`);
  if (kept.length) console.log(`Kept as you changed them (not written over; --force to replace them with the adventure's version): ${kept.join(", ")}.`);
  console.log("Next: node atlas.js ready " + dir + ", then draw the places' maps (references/import.md, step 5) and build.");
}

/* ---- the readiness check and the completion report */
// what in the adventure leans on a thing (the same as the page's "What depends on…")
function dependsOn(kb, id) {
  const by = index(kb), is = v => { const x = resolve(by, v); return x && x.id === id; }, out = [];
  for (const q of kb.quests) if (is(q.giver) || is(q.place) || (q.needs || []).some(is)) out.push("quest " + q.name);
  for (const e of kb.encounters) if (is(e.place) || (e.participants || []).some(p => is(p.name))) out.push("encounter " + e.name);
  for (const c of kb.clues) if (is(c.place) || [].concat(c.points || []).some(is)) out.push("clue " + (c.name || c.text || "").slice(0, 40));
  for (const it of kb.items) if (is(it.place) || is(it.holder)) out.push("item " + it.name);
  for (const m of kb.mechanics || []) for (const s of m.slots || []) for (const o of s.options || []) if (String(o.value || "").split(":")[1] && String(o.value).split(":")[1].split("/")[0] === id) out.push(`${m.name} (${o.card || o.range || "a result"})`);
  return [...new Set(out)];
}
function cmdReady(dir, ctx) {
  const kb = rd(path.join(dir, "story", "adventure.json"), null); if (!kb) die("No story/adventure.json yet.");
  for (const k of KINDS) kb[k] = kb[k] || [];
  const by = index(kb), has = f => fs.existsSync(path.join(dir, f)), rep = { t: new Date().toISOString(), checks: [], counts: {}, review: [] };
  const add = (id, label, state, why, link) => rep.checks.push({ id, label, state, why, link });
  const cov = kb.coverage || {};
  add("source", "The source is read", cov.notRead && cov.notRead.length ? "incomplete" : cov.unreadablePages && cov.unreadablePages.length ? "review" : "ready",
    cov.notRead && cov.notRead.length ? `${cov.notRead.length} of ${cov.chunks} chunks are not read yet (${cov.notRead.map(c => "pages " + c.pages.join("-")).join("; ")})` : cov.unreadablePages && cov.unreadablePages.length ? `${cov.unreadablePages.length} pages had no text (scans): ${cov.unreadablePages.slice(0, 20).join(", ")}` : cov.chunks ? `all ${cov.chunks} chunks (${cov.pages} pages)` : "the adventure was given in Atlas's format", "import");
  const startP = kb.start && resolve(by, kb.start.place);
  add("start", "Where it starts", startP ? "ready" : "incomplete", startP ? `${startP.name}${kb.start.hook ? ": " + kb.start.hook : ""}` : "the adventure's starting place is not known", "places");
  const unmapped = kb.places.filter(p => !has(`places/${p.id}.js`)), noMap = kb.places.filter(p => (p.areas || []).length && has(`places/${p.id}.js`) && !/["']?\bmap["']?\s*:/.test(fs.readFileSync(path.join(dir, `places/${p.id}.js`), "utf8")) && !fs.existsSync(path.join(dir, "edits", p.id + ".js")));
  add("places", "Places", !kb.places.length ? "incomplete" : unmapped.length ? "incomplete" : noMap.length ? "review" : "ready", !kb.places.length ? "no places" : unmapped.length ? `${unmapped.length} not written yet (atlas.js from-adventure)` : noMap.length ? `${kb.places.length} places; ${noMap.length} of those with keyed areas have no map drawn yet (atlas.js map-from-source): they play from their keyed areas meanwhile (${noMap.slice(0, 8).map(p => p.name).join(", ")}${noMap.length > 8 ? "…" : ""})` : `${kb.places.length}: every one the book keys into rooms is drawn${kb.places.some(p => !(p.areas || []).length) ? `; ${kb.places.filter(p => !(p.areas || []).length).length} the book describes without rooms play from their words` : ""}`, "places");
  const key = kb.people.filter(p => p.important || p.role), thin = key.filter(p => !(p.want || p.motivation) || !(p.look || p.personality || p.manner));
  // (what the book leaves out of a person is the book's, not a fault: noted, never a review the game master must do)
  add("people", "Important people", !kb.people.length ? "incomplete" : "ready", !kb.people.length ? "no people" : thin.length ? `${kb.people.length} people, as the book has them (${thin.length} without a look or a stated want in the book: ${thin.slice(0, 6).map(p => p.name).join(", ")})` : `${kb.people.length}`, "people");
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
  // the campaign as it stands now, against the book: a person or a place the game master took away, and what leaned on it
  let A = null; try { A = ctx && ctx.load ? ctx.load(dir) : null; } catch (e) { A = null; }
  if (A) {
    const gone = [...kb.people.filter(p => !(A.castData || {})[p.id]).map(p => ["person", p]), ...kb.places.filter(p => !A.meta[p.id]).map(p => ["place", p])];
    const startGone = startP && !A.meta[startP.id];
    add("changes", "Changes since the import", startGone ? "incomplete" : gone.some(([, p]) => dependsOn(kb, p.id).length) ? "review" : "ready",
      !gone.length ? "nothing the adventure needs has been taken away" : gone.map(([k, p]) => { const d = dependsOn(kb, p.id); return `${k} ${p.name} removed${d.length ? "; it was needed by " + d.slice(0, 6).join(", ") + (d.length > 6 ? "…" : "") : ""}`; }).join(". ") + (startGone ? ". The starting place is gone: choose another start." : ""), "changes");
  }
  // the rooms against the book: every keyed area a room under its key, every exit the book gives a door, an archway or
  // stairs between those two rooms (the user, 18 Nov 2026: "Rooms Must Match the Original Adventure Exactly")
  if (A) {
    let areas = 0, have = 0, exits = 0, joined = 0; const miss = [], unj = [];
    for (const p of kb.places) {
      const M = A.maps[p.id]; if (!M || !(p.areas || []).length) continue;
      const roomOfKey = {}; for (const [rid, r] of Object.entries(M.rooms || {})) if (r && r.key) roomOfKey[r.key] = rid;
      const where = {}; (M.floors || []).forEach((F, fi) => (F.R || []).forEach(r => { if (/^R\d/.test(r[0])) (where[r[0]] = where[r[0]] || []).push([fi, r[1], r[2], r[3], r[4]]); }));
      const roomAt = (fi, x, y) => { for (const [rid, L] of Object.entries(where)) for (const [f, rx, ry, rw, rh] of L) if (f === fi && x >= rx && x < rx + rw && y >= ry && y < ry + rh) return rid; return null; };
      const doorBetween = (a, b) => (M.floors || []).some((F, fi) => (F.D || []).some(d => { const [x, y, o, , len] = d; for (let i = 0; i < (len || 1); i++) { const p1 = o === "h" ? [x + i, y - 1] : [x - 1, y + i], p2 = o === "h" ? [x + i, y] : [x, y + i], r1 = roomAt(fi, ...p1), r2 = roomAt(fi, ...p2); if ((r1 === a && r2 === b) || (r1 === b && r2 === a)) return true; } return false; }));
      const stairsBetween = (a, b) => { const fa = (where[a] || [])[0], fb = (where[b] || [])[0]; if (!fa || !fb || fa[0] === fb[0]) return false; const st = (M.floors[fa[0]].ST || []).map(q => q[0]).filter(id => (M.floors[fb[0]].ST || []).some(q => q[0] === id)); return st.length > 0; };
      const seen = new Set();
      for (const a of p.areas) { areas++; if (roomOfKey[a.id]) have++; else miss.push(`${p.name} ${a.id || a.name}`);
        for (const e of a.exits || []) { const t = typeof e === "string" ? e : e.to, key = [a.id, t].sort().join("|"); if (!t || seen.has(key)) continue; seen.add(key); const ra = roomOfKey[a.id], rb = roomOfKey[t]; if (!ra || !rb) continue; exits++;
          if (doorBetween(ra, rb) || stairsBetween(ra, rb)) joined++; else unj.push(`${p.name} ${a.id}–${t}`); } }
    }
    if (areas) add("rooms", "Rooms as the book has them", miss.length ? "incomplete" : unj.length ? "review" : "ready",
      `${have} of ${areas} keyed areas are rooms under their key${miss.length ? " (missing: " + miss.slice(0, 8).join(", ") + (miss.length > 8 ? "…" : "") + ")" : ""}; ${joined} of ${exits} of the book's exits are doors or stairs between the right rooms${unj.length ? " (not joined: " + unj.slice(0, 6).join(", ") + ")" : ""}`, "places");
  }
  add("secrets", "Secrets kept from the players", leaks.length ? "incomplete" : "ready", leaks.length ? `${leaks.length} handouts carry the game master's notes: ${leaks.map(i => i.name).join(", ")}` : "handouts carry only what the players may read; the page's player view and the players' copy hold no secrets (checked when built: node atlas.js check)", "secrets");
  for (const k of KINDS) rep.counts[k] = kb[k].length;
  for (const k of KINDS) for (const e of kb[k]) if (e.added) rep.review.push({ kind: k, id: e.id, name: e.name || e.title, why: "Atlas's addition, not the book's" });
  // (Atlas's own additions are listed as supplementary, not a review: only the technical checks can hold the campaign back)
  rep.state = rep.checks.some(c => c.state === "incomplete") ? "incomplete" : rep.checks.some(c => c.state === "review") ? "review" : "ready";
  rep.chapters = (kb.chapters || []).map(c => ({ name: c.name || c.title, ref: refOf(c) }));
  wr(path.join(dir, "story", "report.json"), rep);
  wr(path.join(dir, "ready.js"), `// The readiness check and completion report (atlas.js ready): read by the page's Start here.\nATLAS.readiness(${JSON.stringify(rep)});\n`);
  const W = { ready: "Ready to play", review: "Needs review", incomplete: "Incomplete" };
  const md = [`# ${kb.title || "The adventure"}: completion report`, "", `**${W[rep.state]}**, ${rep.t.slice(0, 10)}`, "", "| Check | State | |", "|---|---|---|", ...rep.checks.map(c => `| ${c.label} | ${W[c.state]} | ${c.why.replace(/\|/g, "/")} |`), "",
    "## What was made", "", ...KINDS.filter(k => rep.counts[k]).map(k => `- ${k}: ${rep.counts[k]}`), "", rep.chapters.length ? "## Chapters\n\n" + rep.chapters.map(c => `- ${c.name}${c.ref ? " (" + c.ref + ")" : ""}`).join("\n") + "\n" : "",
    rep.review.length ? "## Atlas's additions (supplementary, not the book's)\n\n" + rep.review.map(r => `- ${r.kind}: ${r.name}`).join("\n") + "\n" : ""];
  wr(path.join(dir, "story", "report.md"), md.join("\n"));
  console.log(`${W[rep.state]}.`); for (const c of rep.checks) console.log(`  ${c.state === "ready" ? "✓" : c.state === "review" ? "!" : "✗"} ${c.label}: ${c.why}`);
  if (rep.review.length) console.log(`  ${rep.review.length} of Atlas's additions to review.`);
  console.log("story/report.md, and ready.js for the page.");
}

/* ---- the places' maps from the book (the user, 18 Nov 2026: "Do not generate a random room layout and then attach the
   adventure's room name to it"). Every keyed area is a room, under its own key; its size as the book gives it (in the
   campaign's squares); its exits as the book gives them: a door, double doors, an archway, a gate, a secret door, a
   window, stairs to another floor; the people, encounters and clues the book puts in it. Where the book's own map is
   traced (references/import.md, step 5) that tracing wins; otherwise the rooms are laid out by their exits, joined
   where the book joins them, and the map says the positions are Atlas's (src.layout: "text"), never the book's. */
const FT = { ft: 1, feet: 1, foot: 1, "'": 1, m: 3.28, metres: 3.28, meters: 3.28, yards: 3, yd: 3 };
function sizeOf(a, unit) {
  const v = a.size; if (Array.isArray(v) && v.length >= 2) return { w: Math.max(1, Math.round(+v[0])), h: Math.max(1, Math.round(+v[1])), src: "book" };
  const t = String(v || a.dimensions || "").toLowerCase(); let m;
  const toSq = (n, u) => Math.max(1, Math.round(n * (FT[u] || 1) / unit));
  if ((m = /(\d+(?:\.\d+)?)\s*(ft|feet|foot|'|m|metres|meters|yards|yd)?\s*(?:by|x|×)\s*(\d+(?:\.\d+)?)\s*(ft|feet|foot|'|m|metres|meters|yards|yd)?/.exec(t))) return { w: toSq(+m[1], m[2] || m[4] || "ft"), h: toSq(+m[3], m[4] || m[2] || "ft"), src: "book" };
  if ((m = /(\d+(?:\.\d+)?)[- ]?(ft|feet|foot|'|m|metres|meters)?[- ]?(square|wide|across|diameter|radius)/.exec(t))) { const n = toSq(+m[1] * (m[3] === "radius" ? 2 : 1), m[2] || "ft"); return { w: n, h: n, src: "book", round: /diameter|radius/.test(m[3]) }; }
  return { w: 6, h: 6, src: "atlas" };
}
const DOOR = { door: "d", doors: "dd", double: "dd", arch: "a", archway: "a", opening: "a", passage: "a", corridor: "a", open: "a", gate: "g", portcullis: "g", secret: "s", hidden: "s", window: "w" };
function mapOfPlace(kb, p, unit, by) {
  const areas = (p.areas || []).filter(a => a && (a.id || a.name)); if (!areas.length) return null;
  const floorOf = a => String(a.floor || a.level || "GROUND FLOOR").toUpperCase();
  const floors = [...new Set(areas.map(floorOf))], R = {}, rooms = {}, placed = {}, idOf = {};
  areas.forEach((a, i) => { idOf[a.id || a.name] = "R" + (i + 1); });
  const S = {}; for (const a of areas) S[a.id || a.name] = sizeOf(a, unit);
  const exitsOf = a => (a.exits || a.connections || []).map(e => typeof e === "string" ? { to: e } : e).filter(e => e && e.to);
  const sameArea = v => areas.find(a => a.id === v || a.name === v || norm(a.name) === norm(v));
  const out = { ov: p.gm || p.desc || "", ext: p.desc || "", entry: ["R1"], floors: [], rooms: {}, clues: {}, npcs: {}, enc: {}, src: { layout: "text", from: "adventure", ref: refOf(p) } };
  const sideV = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  for (const fl of floors) {
    const on = areas.filter(a => floorOf(a) === fl), box = {}, overlaps = (x, y, w, h) => Object.values(box).some(b => x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y);
    const start = on[0]; box[start.id || start.name] = { x: 0, y: 0, w: S[start.id || start.name].w, h: S[start.id || start.name].h };
    const queue = [start];
    while (queue.length || Object.keys(box).length < on.length) {
      const a = queue.shift() || on.find(x => !box[x.id || x.name]); if (!a) break; const ka = a.id || a.name;
      if (!box[ka]) { const mx = Math.max(0, ...Object.values(box).map(b => b.x + b.w)); box[ka] = { x: mx + 2, y: 0, w: S[ka].w, h: S[ka].h }; }
      const A0 = box[ka];
      for (const e of exitsOf(a)) {
        const b = sameArea(e.to); if (!b || floorOf(b) !== fl) continue; const kb2 = b.id || b.name; if (box[kb2]) continue;
        const { w, h } = S[kb2], want = sideV[String(e.side || e.wall || "").toLowerCase()], tries = want ? [want, [0, 1], [1, 0], [0, -1], [-1, 0]] : [[1, 0], [0, 1], [-1, 0], [0, -1]];
        let got = null;
        for (const [dx, dy] of tries) {
          for (let slide = 0; slide < 30 && !got; slide++) for (const sg of [1, -1]) {
            const off = slide * sg, x = dx > 0 ? A0.x + A0.w : dx < 0 ? A0.x - w : A0.x + Math.round((A0.w - w) / 2) + off, y = dy > 0 ? A0.y + A0.h : dy < 0 ? A0.y - h : A0.y + Math.round((A0.h - h) / 2) + off;
            const touches = dx ? (y < A0.y + A0.h && y + h > A0.y) : (x < A0.x + A0.w && x + w > A0.x);
            if (touches && !overlaps(x, y, w, h)) { got = { x, y, w, h }; break; }
          }
          if (got) break;
        }
        if (!got) { const mx = Math.max(...Object.values(box).map(q => q.x + q.w)); got = { x: mx + 1, y: A0.y, w, h, far: true }; }
        box[kb2] = got; queue.push(b);
      }
    }
    // the floor's squares: everything moved to start at 1, 1
    const x0 = Math.min(...Object.values(box).map(b => b.x)) - 1, y0 = Math.min(...Object.values(box).map(b => b.y)) - 1;
    for (const b of Object.values(box)) { b.x -= x0; b.y -= y0; }
    const F = { n: fl, w: Math.max(...Object.values(box).map(b => b.x + b.w)) + 1, h: Math.max(...Object.values(box).map(b => b.y + b.h)) + 1, R: [], D: [], I: [], ST: [], M: [], P: [] };
    for (const a of on) { const k = a.id || a.name, b = box[k], rid = idOf[k]; placed[k] = { fl, b, rid };
      // (the label as fits the room: the name, or for a small room the book's key; the full name is in the guide)
      const nm = String(a.name || k), fits = nm.length <= Math.max(3, b.w * 2.6);
      F.R.push([rid, b.x, b.y, b.w, b.h, fits ? nm.slice(0, 28) : String(a.id || nm).slice(0, Math.max(3, Math.floor(b.w * 2.6))), a.kind || (/cave|cavern|tunnel|grotto/i.test(a.name || "") ? "cave" : /yard|court|garden|graveyard|cemetery|road|square/i.test(a.name || "") ? "yard" : "stone"), a.hidden ? { h: 1 } : undefined].filter(v => v !== undefined));
    }
    // the exits as doors on the wall two rooms share; a secret one the GM's only
    const seen = new Set();
    for (const a of on) for (const e of exitsOf(a)) {
      const b = sameArea(e.to); if (!b || floorOf(b) !== fl) continue; const ka = a.id || a.name, kb2 = b.id || b.name, key = [ka, kb2].sort().join("|"); if (seen.has(key)) continue; seen.add(key);
      const P = box[ka], Q = box[kb2], t = DOOR[String(e.kind || e.type || "door").toLowerCase()] || "d", len = t === "dd" ? 2 : 1;
      if (P.x + P.w === Q.x || Q.x + Q.w === P.x) { const x = P.x + P.w === Q.x ? Q.x : P.x, y1 = Math.max(P.y, Q.y), y2 = Math.min(P.y + P.h, Q.y + Q.h); if (y2 > y1) { F.D.push([x, Math.floor((y1 + y2 - len) / 2), "v", t, len]); continue; } }
      if (P.y + P.h === Q.y || Q.y + Q.h === P.y) { const y = P.y + P.h === Q.y ? Q.y : P.y, x1 = Math.max(P.x, Q.x), x2 = Math.min(P.x + P.w, Q.x + Q.w); if (x2 > x1) { F.D.push([Math.floor((x1 + x2 - len) / 2), y, "h", t, len]); continue; } }
      out.src.unjoined = (out.src.unjoined || []).concat(`${ka}–${kb2}`);   // (laid out apart: the book's exit kept in the guide)
    }
    out.floors.push(F);
  }
  // stairs between floors, where the book's exits go up or down
  let sn = 0; const fIdx = n => out.floors.findIndex(F => F.n === n);
  for (const a of areas) for (const e of exitsOf(a)) { const b = sameArea(e.to); if (!b || floorOf(b) === floorOf(a)) continue; const ka = a.id || a.name, kb2 = b.id || b.name; if (ka > kb2) continue;
    // (up or down as the book says it, else by what the floors are: a crypt, a cellar or a dungeon is below)
    const pa = placed[ka], pb = placed[kb2], id = "S" + (++sn), low = n => /crypt|cellar|basement|under|below|dungeon|sewer|vault|catacomb|cave|pit|lower/i.test(n), hi = n => /tower|upper|attic|loft|roof|second|first floor|balcony|spire/i.test(n);
    const up = /\bdown\b/i.test(e.dir || e.kind || "") ? false : /\bup\b/i.test(e.dir || e.kind || "") ? true : low(pb.fl) && !low(pa.fl) ? false : low(pa.fl) && !low(pb.fl) ? true : hi(pb.fl) ? true : fIdx(pb.fl) > fIdx(pa.fl);
    out.floors[fIdx(pa.fl)].ST.push([id, pa.b.x, pa.b.y, 1, 1, up ? "up" : "down", pb.fl, "n", e.name || ""]);
    out.floors[fIdx(pb.fl)].ST.push([id, pb.b.x, pb.b.y, 1, 1, up ? "down" : "up", pa.fl, "n"]); }
  // each room's guide, as the book has it; what is Atlas's said so
  for (const a of areas) { const k = a.id || a.name, rid = idOf[k];
    out.rooms[rid] = { n: `${a.id ? a.id + ". " : ""}${a.name || ""}`, key: a.id || "", d: a.desc || "", kp: a.gm || "", obj: [].concat(a.features || a.furniture || []).join("; "), src: { ref: refOf(a) || a.ref || "", size: S[k].src } };
    for (const kk of Object.keys(out.rooms[rid])) if (out.rooms[rid][kk] === "") delete out.rooms[rid][kk]; }
  // who and what the book puts in each room: a marker at its centre (people, encounters, clues)
  const mark = (letter, k, rec, i) => { const pl = placed[k]; if (!pl) return; const F = out.floors[fIdx(pl.fl)], id = letter + (i + 1); F.M.push([id, pl.b.x + pl.b.w / 2 + (i % 3) * .7 - .7, pl.b.y + Math.min(pl.b.h - .6, pl.b.h / 2 + .9)]); return id; };
  const areaKey = v => { const a = sameArea(v); return a ? a.id || a.name : null; };
  kb.people.filter(x => (resolve(by, x.at) || {}).id === p.id && x.area).forEach((x, i) => { const k = areaKey(x.area), id = k && mark("N", k, x, i); if (id) out.npcs[id] = { who: x.id, at: idOf[k], doing: x.doing || x.role || "", knows: (x.knows || []).map(q => q.text || q).join(" ") }; });
  kb.encounters.filter(e => (resolve(by, e.place) || {}).id === p.id && e.area).forEach((e, i) => { const k = areaKey(e.area), id = k && mark("E", k, e, i); if (id) out.enc[id] = { t: e.name, at: idOf[k], d: [e.conditions, [].concat(e.outcomes || []).join(" / ")].filter(Boolean).join(" "), src: refOf(e) }; });
  kb.clues.filter(c => (resolve(by, c.place) || {}).id === p.id && c.area).forEach((c, i) => { const k = areaKey(c.area), id = k && mark("C", k, c, i); if (id) out.clues[id] = { t: String(c.name || c.text || "").slice(0, 80), at: idOf[k], d: c.text || "", to: [].concat(c.points || []).map(v => (resolve(by, v) || {}).id).filter(Boolean)[0], src: refOf(c) }; });
  // every floor the same size, so the stairs line up
  const W = Math.max(...out.floors.map(F => F.w)), H = Math.max(...out.floors.map(F => F.h)); for (const F of out.floors) { F.w = W; F.h = H; }
  return out;
}
function cmdMapFromSource(dir, want, flags) {
  const kb = rd(path.join(dir, "story", "adventure.json"), null); if (!kb) die("No story/adventure.json yet.");
  for (const k of KINDS) kb[k] = kb[k] || [];
  const by = index(kb), unit = (() => { try { const m = /grid:\s*\{\s*unit:\s*(\d+(?:\.\d+)?)/.exec(fs.readFileSync(path.join(dir, "campaign.js"), "utf8")); return m ? +m[1] : 5; } catch (e) { return 5; } })();
  const bf = path.join(dir, "story", "import-baseline.json"), base = rd(bf, { files: {} }), list = want.length ? kb.places.filter(p => want.includes(p.id)) : kb.places, done = [], kept = [], none = [];
  for (const p of list) {
    const f = `places/${p.id}.js`, fp = path.join(dir, f); if (!fs.existsSync(fp)) { none.push(p.name + " (not written: from-adventure)"); continue; }
    if (fs.existsSync(path.join(dir, "edits", p.id + ".js")) && !flags.force) { kept.push(p.name + " (redrawn in the map editor)"); continue; }
    const had = fs.readFileSync(fp, "utf8"), b = base.files[f]; if (b && hash(had) !== b.hash && !flags.force) { kept.push(p.name + " (changed by you)"); continue; }
    const only = flags._only && flags._only[p.id], P2 = only ? Object.assign({}, p, { areas: (p.areas || []).filter(a => only.has(a.id)) }) : p;
    const M = mapOfPlace(kb, P2, unit, by); if (!M) { none.push(p.name + " (the book gives it no keyed areas)"); continue; }
    const body = had.replace(/\nATLAS\.place\(/, "\nATLAS.place(").replace(/\}\);\s*$/, `,
  "map": ${JSON.stringify(M)}
});
`).replace(/,\n\s*"map": \{[\s\S]*\}\n\}\);\n,\n  "map"/, `,
  "map"`);
    const clean = had.replace(/,\n  "map": [\s\S]*\n\}\);\s*$/, "\n});\n"), next = clean.replace(/\n\}\);\s*$/, `,
  "map": ${JSON.stringify(M)}
});
`);
    void body; wr(fp, next); base.files[f] = { hash: hash(next), t: new Date().toISOString(), text: next };
    const n = M.floors.reduce((k, F) => k + F.R.length, 0), d = M.floors.reduce((k, F) => k + F.D.length + F.ST.length, 0);
    done.push(`${p.name}: ${n} room${n === 1 ? "" : "s"} on ${M.floors.length} floor${M.floors.length === 1 ? "" : "s"}, ${d} door${d === 1 ? "" : "s"} and stair${d === 1 ? "" : "s"}${(M.src.unjoined || []).length ? `; ${M.src.unjoined.length} exit${M.src.unjoined.length > 1 ? "s" : ""} could not be put on a shared wall (kept in the guide)` : ""}${Object.values(M.rooms).some(r => r.src && r.src.size === "atlas") ? "; some sizes are Atlas's (the book gives none)" : ""}`);
  }
  wr(bf, base);
  console.log(done.length ? "Drawn from the book:\n  " + done.join("\n  ") : "Nothing drawn.");
  if (kept.length) console.log("Kept as they are (--force to draw them from the book again): " + kept.join(", "));
  if (none.length) console.log("Not drawn: " + none.join(", "));
}
/* ---- choosing what to generate (the user, 18 Nov 2026: docs/requests/2026-11-18-selective-location-generation.md).
   The whole adventure is read and known (the knowledge base, imported.js, places/<id>.js with their words and keyed
   areas, the Copilot's passages); drawing a place is a step of its own, for the places the game master chooses, when
   they choose: a settlement's streets (atlas.js city at its own size), a building's rooms (map-from-source), or one
   room and its neighbours. Each place's state is kept in story/generation.json: not generated, generating, generated,
   partially generated, failed (with why), so a failed one is tried again alone. Never over the game master's work. */
const SETTLE = /\b(hamlet|village|town|city|capital|port|settlement|metropolis)\b/i;
const genFile = dir => path.join(dir, "story", "generation.json");
function statusOf(dir, kb, p, gen) {
  const g = (gen || {})[p.id] || {}; if (g.status === "generating" || g.status === "failed") return g;
  const settle = SETTLE.test(p.kind || "") || SETTLE.test(p.name || ""), city = fs.existsSync(path.join(dir, "cities", p.id + ".js")) || (fs.existsSync(path.join(dir, "city.js")) && new RegExp(`invent "${String(p.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(fs.readFileSync(path.join(dir, "city.js"), "utf8")));
  const f = path.join(dir, "places", p.id + ".js"), txt = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "", hasMap = /["']?\bmap["']?\s*:/.test(txt) || fs.existsSync(path.join(dir, "edits", p.id + ".js"));
  const keys = new Set((txt.match(/"key":"([^"]+)"/g) || []).map(x => x.slice(7, -1))), areas = (p.areas || []).map(a => a.id).filter(Boolean), have = areas.filter(k => keys.has(k)).length;
  const kids = kb.places.filter(c => [c.parent, c.region].some(v => v && (v === p.id || norm(v) === norm(p.name))));
  const kidS = kids.map(c => statusOf(dir, kb, c, gen).status).filter(s => s !== "words"), anyKid = kidS.some(s => s === "generated" || s === "partial");
  let status = "not generated";
  if (settle) status = city ? (kids.length && kidS.some(s => s !== "generated") ? "partial" : "generated") : anyKid ? "partial" : "not generated";
  else if (areas.length) status = hasMap ? (have >= areas.length ? "generated" : have ? "partial" : "generated") : "not generated";
  else status = kidS.length ? (anyKid ? (kidS.every(s => s === "generated") ? "generated" : "partial") : "not generated") : "words";   // (a place the book gives only in words: nothing to draw)
  return Object.assign({}, g, { status, settle, rooms: areas.length, roomsDrawn: have, city });
}
function tree(kb) {
  const by = index(kb), parentOf = p => { for (const v of [p.parent, p.region]) { const x = v && resolve(by, v); if (x && x !== p && kb.places.includes(x)) return x.id; } return null; };
  const kids = {}; for (const p of kb.places) { const q = parentOf(p) || ""; (kids[q] = kids[q] || []).push(p); }
  return { kids, roots: kids[""] || [] };
}
function cmdLocations(dir, flags) {
  const kb = rd(path.join(dir, "story", "adventure.json"), null); if (!kb) die("No story/adventure.json yet.");
  for (const k of KINDS) kb[k] = kb[k] || [];
  const gen = rd(genFile(dir), {}), T = tree(kb), out = [], start = kb.start && (resolve(index(kb), kb.start.place) || {}).id;
  const walk = (p, d) => { const st = statusOf(dir, kb, p, gen); out.push(Object.assign({ id: p.id, name: p.name, kind: p.kind || "", depth: d, parent: null, start: p.id === start, areas: (p.areas || []).map(a => ({ id: a.id, name: a.name, floor: a.floor || "" })), ref: refOf(p) }, st)); for (const c of T.kids[p.id] || []) { walk(c, d + 1); out[out.length - 1].parent = out[out.length - 1].parent || p.id; } };
  for (const r of T.roots) walk(r, 0);
  if (flags.json) { console.log(JSON.stringify(out)); return out; }
  const W = { generated: "✓ generated", partial: "◐ partly generated", "not generated": "· not generated", generating: "… generating", failed: "✗ failed", words: "  (in words only)" };
  for (const x of out) console.log(`${"  ".repeat(x.depth)}${W[x.status] || x.status}  ${x.name}${x.rooms ? ` (${x.roomsDrawn || 0}/${x.rooms} rooms)` : ""}${x.start ? "  ← where it starts" : ""}${x.status === "failed" && x.error ? "  " + x.error : ""}   [${x.id}]`);
  console.log(`\nGenerate: node atlas.js generate ${dir} <id> [<id> ...] [--depth exterior|playable|complete] [--rooms K1,K2]   (--start: where it opens; --all: everything)`);
  return out;
}
function cmdGenerate(dir, ids, flags) {
  const kb = rd(path.join(dir, "story", "adventure.json"), null); if (!kb) die("No story/adventure.json yet.");
  for (const k of KINDS) kb[k] = kb[k] || [];
  const by = index(kb), T = tree(kb), depth = ["exterior", "playable", "complete"].includes(flags.depth) ? flags.depth : "playable", gen = rd(genFile(dir), {}), save = () => wr(genFile(dir), gen);
  let want = ids.map(v => (resolve(by, v) || {}).id || v);
  // the start: where it opens and what is there (the opening session needs it)
  if (flags.start) { const s = kb.start && resolve(by, kb.start.place); if (s) { want.push(s.id); const par = [s.parent, s.region].map(v => v && resolve(by, v)).find(x => x && kb.places.includes(x)); if (par) want.push(par.id); } }
  if (flags.all) want = kb.places.map(p => p.id);
  want = [...new Set(want)];
  const unknown = want.filter(id => !kb.places.some(p => p.id === id)); if (unknown.length) die(`Not places of this adventure: ${unknown.join(", ")} (node atlas.js locations ${dir})`);
  const city = require("./city-invent.js"), common = require("./city-common.js"), results = [];
  for (const id of want) {
    const p = kb.places.find(x => x.id === id); gen[id] = { status: "generating", depth, t: new Date().toISOString() }; save();
    try {
      const st = statusOf(dir, kb, p, {}), did = [];
      // a settlement's streets, at its own size, in the campaign's world; never over one the game master changed
      if (st.settle) {
        const f = path.join(dir, "cities", p.id + ".js");
        if (fs.existsSync(f) && !flags.force) did.push("its streets were there already (kept)");
        else { common.cityTarget(p.id); try { city.inventCity(dir, p.name, Object.assign({}, p.population ? { population: String(p.population) } : { size: (SETTLE.exec(p.kind || "") || SETTLE.exec(p.name || "") || ["", "village"])[1].toLowerCase().replace("capital", "city").replace("port", "town").replace("settlement", "village") }), () => {}); } finally { common.cityTarget(null); } did.push("its streets, at " + (p.population ? "its population" : "its size"));
          // (its city on the world map: the world's location for it says city: "<id>", when there is a world)
          const wf = path.join(dir, "world.js"); if (fs.existsSync(wf)) { const t = fs.readFileSync(wf, "utf8"); if (!t.includes(`city: "${p.id}"`) && !flags.nolink) did.push(`(to show it from the world map, its location there takes city: "${p.id}")`); } }
        // its buildings with rooms: the playable ones (people, encounters or the start there) or all of them
        if (depth !== "exterior") for (const c of T.kids[p.id] || []) { if (!(c.areas || []).length) continue; const busy = kb.encounters.some(e => (resolve(by, e.place) || {}).id === c.id) || kb.people.some(x => (resolve(by, x.at) || {}).id === c.id) || (kb.start && (resolve(by, kb.start.place) || {}).id === c.id);
          if (depth === "complete" || busy) { const log = []; const L = console.log; console.log = m => log.push(m); try { cmdMapFromSource(dir, [c.id], flags); } finally { console.log = L; } did.push(log.join(" ").replace(/\s+/g, " ").replace(/^Drawn from the book: /, "").slice(0, 160)); gen[c.id] = { status: "generated", depth, t: new Date().toISOString() }; } }
      }
      // a building's rooms: all, or the rooms asked for and the ones they open onto (the least the room needs to be played)
      if ((p.areas || []).length) {
        let f2 = flags;
        if (flags.rooms && flags.rooms !== true) { const ask = String(flags.rooms).split(",").map(s => s.trim()).filter(Boolean), near = new Set(ask);
          for (const a of p.areas) if (ask.includes(a.id)) for (const e of a.exits || []) near.add(typeof e === "string" ? e : e.to);
          f2 = Object.assign({}, flags, { _only: { [p.id]: near } }); did.push(`room${ask.length > 1 ? "s" : ""} ${ask.join(", ")}${near.size > ask.length ? ` and the ${near.size - ask.length} ${near.size - ask.length > 1 ? "rooms" : "room"} they open onto` : ""}`); }
        const log = []; const L = console.log; console.log = m => log.push(m); try { cmdMapFromSource(dir, [p.id], f2); } finally { console.log = L; }
        did.push(log.join(" ").replace(/\s+/g, " ").replace(/^Drawn from the book: /, "").replace(new RegExp("^" + String(p.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ": "), "").slice(0, 200));
      }
      if (!did.length) did.push("the book gives it only in words: nothing to draw; it is known to the Copilot and the page as written");
      const now = statusOf(dir, kb, p, {}); gen[id] = { status: flags.rooms && flags.rooms !== true ? "partial" : now.status === "words" ? "generated" : now.status, depth, t: new Date().toISOString(), did };
      results.push(`✓ ${p.name}: ${did.join("; ")}`);
    } catch (e) { gen[id] = { status: "failed", depth, t: new Date().toISOString(), error: String(e.message || e).split("\n")[0].slice(0, 240) }; results.push(`✗ ${p.name}: ${gen[id].error} (try it again: node atlas.js generate ${dir} ${id})`); }
    save();
  }
  console.log(results.join("\n"));
  console.log("Then: node atlas.js build " + dir + " (and node atlas.js ready " + dir + ")");
  return results;
}
async function run(cmd, pos, flags, ctx) {
  if (cmd === "locations") return cmdLocations(pos[0], flags);
  if (cmd === "generate") return cmdGenerate(pos[0], pos.slice(1), flags);
  if (cmd === "map-from-source") return cmdMapFromSource(pos[0], pos.slice(1), flags);
  if (cmd === "import") return cmdImport(pos[0], pos.slice(1), flags);
  if (cmd === "import-status") return cmdStatus(pos[0]);
  if (cmd === "import-mark") return cmdMark(pos[0], pos[1]);
  if (cmd === "adventure") return cmdAdventure(pos[0]);
  if (cmd === "from-adventure") return cmdFromAdventure(pos[0], flags);
  if (cmd === "ready") return cmdReady(pos[0], ctx);
}
module.exports = { run, FORMAT, KINDS, merge, crossCheck, buildFiles, checkPart, headingsOf, textPages, dependsOn };
