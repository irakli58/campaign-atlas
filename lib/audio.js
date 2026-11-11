// Sound packs (the user's audio request of 11 Nov 2026, approved): real recordings for the Sounds panel of every
// campaign page and for the music's textures. None ships with the app (they are tens of megabytes): each pack is
// installed with a click, downloaded once from the app's own releases on GitHub into data/audio/<pack>/, and served to
// the pages from there, so that afterwards it works with no internet. The game master's own sound files are kept in their
// browser by the page itself, never here.
// A pack is one file, <pack>.atlaspack: a line "ATLASPACK 1", a line of JSON listing its files and their sizes, then the
// files one after another. Every recording in the packs is free to pass on (CC0, public domain, CC BY, CC BY-SA), each
// with its credit in the pack's catalogue.json and in CREDITS.md.
"use strict";
const fs = require("fs"), path = require("path");
const RELEASE = "https://github.com/irakli58/campaign-atlas/releases/download/sounds-v1/";
const UA = "CampaignAtlas-app (sound packs)";
function create({ DATA, local }) {
  // (local: a folder holding packs.json and the .atlaspack files as the release does, used instead of it when given)
  const DIR = path.join(DATA, "audio"), busy = {};
  let avail = null, availT = 0;
  const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
  // the packs installed: data/audio/packs.json, kept as each is installed or taken away
  function installed() { const j = readJSON(path.join(DIR, "packs.json")); return (j && j.packs) || []; }
  function writeList(list) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, "packs.json"), JSON.stringify({ packs: list }, null, 1)); }
  // the packs there are, from the release (asked once an hour at most)
  async function available() {
    if (avail && Date.now() - availT < 3600e3) return avail;
    if (local) { const j = readJSON(path.join(local, "packs.json")); if (j && j.packs) { avail = j.packs; availT = Date.now(); return avail; } }
    try { const r = await fetch(RELEASE + "packs.json", { headers: { "user-agent": UA } }); if (!r.ok) throw new Error("HTTP " + r.status); avail = (await r.json()).packs || []; availT = Date.now(); }
    catch (e) { if (!avail) throw new Error("The list of sound packs could not be fetched (" + e.message + "). Is this computer online?"); }
    return avail;
  }
  function unpack(buf, to) {
    const nl = buf.indexOf(10), nl2 = buf.indexOf(10, nl + 1);
    if (buf.slice(0, nl).toString() !== "ATLASPACK 1" || nl2 < 0) throw new Error("not a sound pack");
    const idx = JSON.parse(buf.slice(nl + 1, nl2).toString()); let o = nl2 + 1;
    fs.mkdirSync(to, { recursive: true });
    for (const f of idx.files) {
      if (!/^[a-z0-9][a-z0-9._-]{0,80}$/i.test(f.name) || f.name.includes("..")) throw new Error("a file with a strange name: " + f.name);
      if (o + f.size > buf.length) throw new Error("the pack is cut short");
      fs.writeFileSync(path.join(to, f.name), buf.slice(o, o + f.size)); o += f.size;
    }
    return idx;
  }
  async function install(id, progress) {
    if (!/^[a-z0-9-]{1,32}$/.test(id || "")) throw new Error("Which pack?");
    if (busy[id]) return busy[id];
    busy[id] = (async () => {
      const list = await available(), p = list.find(x => x.id === id); if (!p) throw new Error("There is no such sound pack.");
      const here = local && path.join(local, id + ".atlaspack");
      if (here && fs.existsSync(here)) {
        const buf = fs.readFileSync(here); if (progress) progress(buf.length, buf.length);
        const tmp = path.join(DIR, "." + id + "-new"); fs.rmSync(tmp, { recursive: true, force: true }); unpack(buf, tmp);
        const dest = path.join(DIR, id); fs.rmSync(dest, { recursive: true, force: true }); fs.renameSync(tmp, dest);
        const mine = installed().filter(x => x.id !== id); mine.push(Object.assign({}, p, { installed: Date.now() })); writeList(mine);
        return { ok: true, id };
      }
      const r = await fetch(RELEASE + id + ".atlaspack", { headers: { "user-agent": UA } }); if (!r.ok) throw new Error("The pack could not be downloaded (HTTP " + r.status + ").");
      const total = +r.headers.get("content-length") || p.bytes || 0, parts = []; let got = 0;
      for await (const c of r.body) { parts.push(Buffer.from(c)); got += c.length; if (progress) progress(got, total); }
      const tmp = path.join(DIR, "." + id + "-new"); fs.rmSync(tmp, { recursive: true, force: true });
      unpack(Buffer.concat(parts), tmp);
      const dest = path.join(DIR, id); fs.rmSync(dest, { recursive: true, force: true }); fs.renameSync(tmp, dest);
      const mine = installed().filter(x => x.id !== id); mine.push(Object.assign({}, p, { installed: Date.now() })); writeList(mine);
      return { ok: true, id };
    })().finally(() => { delete busy[id]; });
    return busy[id];
  }
  function remove(id) {
    if (!/^[a-z0-9-]{1,32}$/.test(id || "")) throw new Error("Which pack?");
    fs.rmSync(path.join(DIR, id), { recursive: true, force: true }); writeList(installed().filter(x => x.id !== id)); return { ok: true };
  }
  // a file of an installed pack, for the pages (GET /audio/<pack>/<file>)
  function fileOf(rel) {
    const f = path.normalize(path.join(DIR, rel)); if (!f.startsWith(DIR + path.sep) && f !== path.join(DIR, "packs.json")) return null;
    return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
  }
  return { DIR, installed, available, install, remove, fileOf, unpack, busy: () => Object.keys(busy) };
}
module.exports = { create, RELEASE };
