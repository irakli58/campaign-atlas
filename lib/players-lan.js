/* The players on their own phones and laptops (the user asked, 27 Oct 2026, for the players' copy on the players' own
   screens). Off until the game master switches it on for a campaign. Then a second door of the app opens on this
   computer's network (the app's port and one), and it serves only the players' copy of that campaign (dist/players.html,
   none of the campaign in it) and, of the campaign's table, only what the players' window reads: what the game master's
   page has shared with them, the fog, the screen, the handouts given, the board, the places' status, the clues found,
   the lines and veils. The players may write only their notes, the X-card and that they are there. Each campaign has
   its own link, which a new one replaces; switched off, the link stops working at once. The game master's own page and
   everything else of the app stay on this computer only. */
"use strict";
const http = require("http"), os = require("os"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const QR = require("./qr");
const READ = ["share", "fog", "screen", "given", "board", "status", "clues", "safety", "journal", "presence", "xcard"];
const WRITE = ["journal", "xcard", "presence"];

module.exports.create = ({ DATA, campDir, db, PORT, UI }) => {
  const file = path.join(DATA, "players-lan.json");
  let S = { on: {} }; try { S = Object.assign({ on: {} }, JSON.parse(fs.readFileSync(file, "utf8"))); } catch (e) {}
  const save = () => { try { fs.writeFileSync(file, JSON.stringify(S, null, 1)); } catch (e) {} };
  let server = null, starting = null, lastErr = "";
  // this computer's addresses on its networks (Wi-Fi, cable), the ones a phone at the table can reach
  const addresses = () => { const out = []; for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if ((a.family === "IPv4" || a.family === 4) && !a.internal && !/^169\.254\./.test(a.address)) out.push(a.address); return out.sort((a, b) => (/^192\.168\./.test(b) - /^192\.168\./.test(a))); };
  const slugOf = token => Object.keys(S.on).find(s => S.on[s] === token);
  const head = { "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
  const send = (res, code, body, type) => { res.writeHead(code, Object.assign({ "content-type": type || "application/json; charset=utf-8" }, head)); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
  const say = (res, code, text) => send(res, code, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Campaign Atlas</title><body style="font:17px Georgia,serif;background:#16181b;color:#e9e4d8;display:grid;place-items:center;min-height:90vh;margin:0;padding:24px;text-align:center"><p>${text}</p></body>`, "text/html; charset=utf-8");
  function body(req, max) { return new Promise((ok, no) => { let n = 0; const parts = []; req.on("data", c => { n += c.length; if (n > max) { no(new Error("too much")); req.destroy(); } else parts.push(c); }); req.on("end", () => { try { ok(JSON.parse(Buffer.concat(parts).toString("utf8") || "{}")); } catch (e) { no(e); } }); req.on("error", no); }); }
  async function route(req, res) {
    const u = new URL(req.url, "http://players"), m = u.pathname.match(/^\/p\/([a-z0-9]{10,40})\/(.*)$/);
    if (!m) return say(res, 404, "Ask the game master for the players' link.");
    const slug = slugOf(m[1]); if (!slug) return say(res, 404, "This link no longer works: ask the game master for the new one.");
    const dir = campDir(slug), rest = m[2], M = req.method;
    if (!dir) return say(res, 404, "This campaign is not here any more.");
    if (M === "GET" && rest === "") {
      const f = path.join(dir, "dist", "players.html"); if (!fs.existsSync(f)) return say(res, 404, "The game master needs to build the campaign again for the players' copy.");
      return send(res, 200, fs.readFileSync(f, "utf8").replace("<body>", `<body>\n<script src="players-db.js"></script>`), "text/html; charset=utf-8");
    }
    if (M === "GET" && rest === "players-db.js") return send(res, 200, fs.readFileSync(path.join(UI, "players-db.js"), "utf8"), "text/javascript; charset=utf-8");
    if (rest === "db") {
      if (M === "GET") {
        const d = db.get(slug); if (+u.searchParams.get("v") === d.v) { res.writeHead(204, head); return res.end(); }
        const data = {}; for (const c of READ) if (d.data[c]) data[c] = d.data[c];
        return send(res, 200, { v: d.v, data });
      }
      if (M === "POST") {
        let o; try { o = await body(req, 16 << 10); } catch (e) { return send(res, 400, { error: "That could not be read." }); }
        if (!WRITE.includes(o.coll) || !/^[A-Za-z0-9_-]{1,60}$/.test(String(o.id || "")) || !["set", "update", "delete"].includes(o.kind)) return send(res, 403, { error: "The players' window may only write its notes." });
        if (o.coll === "journal" && o.body && typeof o.body.text === "string") o.body = { text: o.body.text.slice(0, 2000), t: +o.body.t || Date.now() };
        try { return send(res, 200, { v: db.write(slug, o) }); } catch (e) { return send(res, 400, { error: e.message }); }
      }
    }
    return say(res, 404, "Nothing here.");
  }
  function start() {
    if (server) return Promise.resolve(true);
    if (starting) return starting;
    starting = new Promise(ok => {
      const s = http.createServer((req, res) => route(req, res).catch(() => { try { send(res, 500, { error: "Something went wrong." }); } catch (x) {} }));
      s.once("error", e => { starting = null; lastErr = e.code === "EADDRINUSE" ? `The port ${PORT} is taken by another program.` : e.message; ok(false); });
      // (on this computer's networks; --lan-host=127.0.0.1 keeps it on this computer alone, for trying it out)
      const host = ((process.argv.find(a => a.startsWith("--lan-host=")) || "").split("=")[1]) || "0.0.0.0";
      s.listen(PORT, host, () => { server = s; starting = null; lastErr = ""; ok(true); });
    });
    return starting;
  }
  function stopIfIdle() { if (server && !Object.keys(S.on).length) { server.close(); server = null; } }
  const local = process.argv.some(a => a === "--lan-host=127.0.0.1");
  const urls = slug => S.on[slug] ? (local ? ["127.0.0.1"] : addresses()).map(a => `http://${a}:${PORT}/p/${S.on[slug]}/`) : [];
  async function status(slug) {
    const on = !!S.on[slug]; if (on && !server) await start();
    const list = urls(slug);
    return { on, running: !!server, urls: list, qr: on && list[0] ? QR.svg(list[0], 220) : "", error: lastErr, port: PORT };
  }
  return {
    status,
    async enable(slug, fresh) { if (!S.on[slug] || fresh) { S.on[slug] = crypto.randomBytes(9).toString("hex"); save(); } await start(); return status(slug); },
    async disable(slug) { delete S.on[slug]; save(); stopIfIdle(); return status(slug); },
    // the app starting again: the doors switched on before open again
    resume() { if (Object.keys(S.on).length) start(); }
  };
};
