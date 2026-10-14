// The investigation tracker, the referee's own songs and their music mixes: on claude.ai a campaign page keeps these in
// the artifact's database. Opened from the app, the page keeps them here instead, one small file per campaign.
"use strict";
const fs = require("fs"), path = require("path");

function create(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const cache = {};
  const file = slug => path.join(dir, slug + ".json");
  function get(slug) {
    if (!cache[slug]) { try { cache[slug] = JSON.parse(fs.readFileSync(file(slug), "utf8")); } catch (e) { cache[slug] = { v: 0, data: {} }; } }
    return cache[slug];
  }
  const name = s => typeof s === "string" && /^[\w-]{1,80}$/.test(s);
  function write(slug, op) {
    const db = get(slug), { kind, coll, id, body } = op || {};
    if (!name(coll) || !name(id)) throw new Error("bad document");
    const c = db.data[coll] = db.data[coll] || {};
    if (kind === "set") c[id] = body && typeof body === "object" ? body : {};
    else if (kind === "update") c[id] = Object.assign({}, c[id] || {}, body && typeof body === "object" ? body : {});
    else if (kind === "delete") delete c[id];
    else throw new Error("bad write");
    db.v++;
    fs.writeFileSync(file(slug), JSON.stringify(db));
    return db.v;
  }
  return { get, write };
}

module.exports = { create };
