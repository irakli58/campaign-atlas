/* The recorder link (the user asked, 3 Nov 2026, to put a phone in the middle of the table and record the session; a
   separate phone, or a laptop, maybe a Mac). Off until the game master opens it for a campaign. Then a third door of
   the app opens on this computer's network (the app's port and two), over https with a certificate of the app's own
   (selfsigned.js), because phones give a web page the microphone only over https. It serves one page, the recorder
   (ui/recorder.html), and takes from it only this: a recording begun (its session, the table's consent), its sound in
   pieces of ten seconds as they are recorded, how it stands, its words if the phone writes them as it hears them, and
   a recording made elsewhere sent whole. The sound is kept in the campaign's folder (recordings/<id>/), where the game
   master's page plays it from (server.js, rec-audio); the rest goes into the campaign's table like anything the page
   writes. The recorder reads nothing of the campaign but its title and the session's number. Closed, the link stops
   working at once; a new link replaces the old. */
"use strict";
const https = require("https"), os = require("os"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const QR = require("./qr"), SS = require("./selfsigned");
const PART = 300;

module.exports.create = ({ DATA, campDir, db, PORT, UI }) => {
  const file = path.join(DATA, "recorder-lan.json"), certFile = path.join(DATA, "recorder-cert.json");
  let S = { on: {} }; try { S = Object.assign({ on: {} }, JSON.parse(fs.readFileSync(file, "utf8"))); } catch (e) {}
  const save = () => { try { fs.writeFileSync(file, JSON.stringify(S, null, 1)); } catch (e) {} };
  let server = null, starting = null, lastErr = "";
  const addresses = () => { const out = []; for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if ((a.family === "IPv4" || a.family === 4) && !a.internal && !/^169\.254\./.test(a.address)) out.push(a.address); return out; };
  const local = process.argv.some(a => a === "--lan-host=127.0.0.1");
  // the app's certificate, made again when this computer's addresses change or it grows old
  function cert() {
    const hosts = [...new Set(addresses().concat(["127.0.0.1", "localhost"]))];
    let c = null; try { c = JSON.parse(fs.readFileSync(certFile, "utf8")); } catch (e) {}
    if (!c || hosts.some(h => !(c.hosts || []).includes(h)) || Date.now() - (c.made || 0) > 300 * 864e5) { c = SS.make(hosts); try { fs.writeFileSync(certFile, JSON.stringify(c)); } catch (e) {} }
    return c;
  }
  const slugOf = token => Object.keys(S.on).find(s => S.on[s] === token);
  const head = { "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
  const send = (res, code, body, type) => { res.writeHead(code, Object.assign({ "content-type": type || "application/json; charset=utf-8" }, head)); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
  const say = (res, code, text) => send(res, code, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Campaign Atlas</title><body style="font:17px Georgia,serif;background:#16181b;color:#eee;padding:24px">${text}</body>`, "text/html; charset=utf-8");
  const json = (req, max) => new Promise((ok, no) => { let n = 0; const parts = []; req.on("data", c => { n += c.length; if (n > max) { no(new Error("too much")); req.destroy(); } else parts.push(c); }); req.on("end", () => { try { ok(JSON.parse(Buffer.concat(parts).toString("utf8") || "{}")); } catch (e) { no(e); } }); req.on("error", no); });
  const raw = (req, max) => new Promise((ok, no) => { let n = 0; const parts = []; req.on("data", c => { n += c.length; if (n > max) { no(new Error("too much")); req.destroy(); } else parts.push(c); }); req.on("end", () => ok(Buffer.concat(parts))); req.on("error", no); });
  const recId = s => /^r[a-z0-9]{6,30}$/.test(String(s || "")) ? String(s) : null;
  const recDir = (dir, rec) => path.join(dir, "recordings", rec);
  const titleOf = dir => { try { const m = /title:\s*"((?:[^"\\]|\\.)*)"/.exec(fs.readFileSync(path.join(dir, "campaign.js"), "utf8")); return m ? JSON.parse('"' + m[1] + '"') : ""; } catch (e) { return ""; } };
  const sessionNow = slug => +((((db.get(slug).data || {}).log || {}).now || {}).n) || 1;
  const recOf = (slug, rec) => ((db.get(slug).data || {}).recs || {})[rec] || null;
  const write = (slug, coll, id, body, kind) => db.write(slug, { kind: kind || "set", coll, id, body });

  async function route(req, res) {
    const u = new URL(req.url, "https://recorder"), m = u.pathname.match(/^\/r\/([a-z0-9]{10,40})\/(.*)$/);
    if (!m) return say(res, 404, "Ask the game master for the recorder's link.");
    const slug = slugOf(m[1]); if (!slug) return say(res, 404, "This link no longer works: ask the game master for the new one.");
    const dir = campDir(slug), rest = m[2], M = req.method, q = k => u.searchParams.get(k) || "";
    if (!dir) return say(res, 404, "This campaign is not here any more.");
    if (M === "GET" && rest === "") return send(res, 200, fs.readFileSync(path.join(UI, "recorder.html"), "utf8").replace("__REC__", JSON.stringify({ title: titleOf(dir), session: sessionNow(slug) }).replace(/</g, "\\u003c")), "text/html; charset=utf-8");
    if (M === "GET" && rest === "state") return send(res, 200, { title: titleOf(dir), session: sessionNow(slug) });
    try {
      // a recording begun: its session and the table's consent, as the phone was told them
      if (M === "POST" && rest === "start") {
        const o = await json(req, 8 << 10), id = "r" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
        if (!o.consent) return send(res, 400, { error: "The table has not agreed to be recorded." });
        write(slug, "recs", id, { session: Math.max(1, Math.min(999, +o.session || sessionNow(slug))), started: Date.now(), state: "recording", dur: 0, parts: [], where: "app", device: String(o.device || "a phone").slice(0, 40), live: !!o.live, lang: String(o.lang || "").slice(0, 12), consent: { t: Date.now(), text: String(o.consent).slice(0, 600) }, speakers: {}, t: Date.now() });
        return send(res, 200, { id });
      }
      // a piece of the sound (ten seconds), kept under its part and its number: sent again, it is the same file
      if (M === "PUT" && rest === "chunk") {
        const rec = recId(q("rec")), part = +q("part"), seq = +q("seq"); if (!rec || !recOf(slug, rec) || !(part >= 0 && part < 1000) || !(seq >= 0 && seq < 1e6)) return send(res, 400, { error: "Which recording?" });
        const buf = await raw(req, 6 << 20), d = recDir(dir, rec); fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(path.join(d, `${String(part).padStart(3, "0")}-${String(seq).padStart(6, "0")}.chunk`), buf);
        return send(res, 200, { ok: true });
      }
      // how it stands: recording, paused, stopped; how long; its parts (each run of the microphone)
      if (M === "POST" && rest === "state") {
        const o = await json(req, 32 << 10), rec = recId(o.rec), cur = rec && recOf(slug, rec); if (!cur) return send(res, 400, { error: "Which recording?" });
        const parts = Array.isArray(o.parts) ? o.parts.slice(0, 200).map(p => ({ n: +p.n || 0, at: +p.at || 0, mime: String(p.mime || "").slice(0, 60) })) : cur.parts;
        write(slug, "recs", rec, Object.assign({}, cur, { state: ["recording", "paused", "stopped", "lost"].includes(o.state) ? o.state : cur.state, dur: Math.max(0, +o.dur || cur.dur || 0), parts, t: Date.now() }));
        return send(res, 200, { ok: true });
      }
      // the words, as the phone heard them: added to the recording's transcript, three hundred lines to a document
      if (M === "POST" && rest === "words") {
        const o = await json(req, 512 << 10), rec = recId(o.rec); if (!rec || !recOf(slug, rec)) return send(res, 400, { error: "Which recording?" });
        const add = (Array.isArray(o.segs) ? o.segs : []).filter(s => Array.isArray(s) && typeof s[3] === "string").slice(0, 2000).map(s => [+s[0] || 0, +s[1] || 0, String(s[2] || "").slice(0, 40), s[3].slice(0, 2000)]);
        if (!add.length) return send(res, 200, { ok: true });
        const T = (db.get(slug).data || {}).transcript || {}, docs = Object.values(T).filter(x => x && x.rec === rec).sort((a, b) => a.k - b.k), all = docs.flatMap(x => x.segs || []), from = all.length;
        all.push(...add);
        for (let k = Math.floor(from / PART); k * PART < all.length; k++) write(slug, "transcript", `${rec}_${k}`, { rec, k, segs: all.slice(k * PART, (k + 1) * PART) });
        return send(res, 200, { ok: true, lines: all.length });
      }
      // a recording made elsewhere (the phone's own recorder app), sent whole
      if (M === "PUT" && rest === "file") {
        const id = "r" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"), d = recDir(dir, id); fs.mkdirSync(d, { recursive: true });
        const f = path.join(d, "000-000000.chunk"), out = fs.createWriteStream(f); let n = 0, cut = false;
        await new Promise((ok, no) => { req.on("data", c => { n += c.length; if (n > 3 * 1024 ** 3) { cut = true; req.destroy(); } }); req.pipe(out); out.on("finish", ok); out.on("error", no); req.on("error", no); req.on("close", () => { if (cut) no(new Error("too big")); }); });
        write(slug, "recs", id, { session: Math.max(1, +q("session") || sessionNow(slug)), started: +q("at") || Date.now(), state: "stopped", dur: Math.max(0, +q("dur") || 0), parts: [{ n: 0, at: 0, mime: q("mime").slice(0, 60) || "audio/mpeg" }], where: "app", device: "sent from " + (q("device") || "a phone").slice(0, 30), name: q("name").slice(0, 120), uploaded: true, speakers: {}, t: Date.now() });
        return send(res, 200, { id, bytes: n });
      }
    } catch (e) { return send(res, 400, { error: e.message === "too much" ? "That is too big." : "That could not be kept: " + e.message }); }
    return say(res, 404, "Nothing here.");
  }
  function start() {
    if (server) return Promise.resolve(true);
    if (starting) return starting;
    starting = new Promise(ok => {
      let c; try { c = cert(); } catch (e) { lastErr = "The app could not make its certificate: " + e.message; starting = null; return ok(false); }
      const s = https.createServer({ cert: c.cert, key: c.key }, (req, res) => route(req, res).catch(() => { try { send(res, 500, { error: "Something went wrong." }); } catch (x) {} }));
      s.once("error", e => { starting = null; lastErr = e.code === "EADDRINUSE" ? `The port ${PORT} is taken by another program.` : e.message; ok(false); });
      s.listen(PORT, local ? "127.0.0.1" : "0.0.0.0", () => { server = s; starting = null; lastErr = ""; ok(true); });
    });
    return starting;
  }
  function stopIfIdle() { if (server && !Object.keys(S.on).length) { server.close(); server = null; } }
  const urls = slug => S.on[slug] ? (local ? ["127.0.0.1"] : addresses()).map(a => `https://${a}:${PORT}/r/${S.on[slug]}/`) : [];
  async function status(slug) {
    const on = !!S.on[slug]; if (on && !server) await start();
    const list = urls(slug);
    return { on, running: !!server, urls: list, qr: on && list[0] ? QR.svg(list[0], 200) : "", error: lastErr, port: PORT };
  }
  // for the game master's page (server.js): a part of a recording's sound, its pieces one after another
  function audio(slug, rec, part, res) {
    const dir = campDir(slug); rec = recId(rec); if (!dir || !rec) return send(res, 404, { error: "not found" });
    const d = recDir(dir, rec), pre = String(+part || 0).padStart(3, "0") + "-";
    let files = []; try { files = fs.readdirSync(d).filter(f => f.startsWith(pre) && f.endsWith(".chunk")).sort(); } catch (e) {}
    if (!files.length) return send(res, 404, { error: "not found" });
    const meta = recOf(slug, rec) || {}, mime = ((meta.parts || []).find(p => p.n === (+part || 0)) || {}).mime || "audio/webm";
    res.writeHead(200, Object.assign({ "content-type": mime.split(";")[0], "content-length": files.reduce((a, f) => a + fs.statSync(path.join(d, f)).size, 0) }, head));
    (function next(i) { if (i >= files.length) return res.end(); const r = fs.createReadStream(path.join(d, files[i])); r.on("end", () => next(i + 1)); r.on("error", () => res.end()); r.pipe(res, { end: false }); })(0);
  }
  function drop(slug, rec) { const dir = campDir(slug); rec = recId(rec); if (!dir || !rec) return false; try { fs.rmSync(recDir(dir, rec), { recursive: true, force: true }); } catch (e) {} return true; }
  return {
    status, audio, drop,
    async enable(slug, fresh) { if (!S.on[slug] || fresh) { S.on[slug] = crypto.randomBytes(9).toString("hex"); save(); } await start(); return status(slug); },
    async disable(slug) { delete S.on[slug]; save(); stopIfIdle(); return status(slug); },
    resume() { if (Object.keys(S.on).length) start(); }
  };
};
