// What the game master's own Claude Code is doing, step by step. Its hooks (workspace/.claude/atlas-hook.js) add a line
// to workspace/.atlas-activity.jsonl after each step; this reads the new lines as they come. Each line also names
// the session's conversation file, and from that the app takes what Claude says as it works ("Now the council
// reads the story…"), so the game master sees small live updates and not only finished files.
"use strict";
const fs = require("fs");

function readNew(file, pos) {
  let size; try { size = fs.statSync(file).size; } catch (e) { return { pos, lines: [] }; }
  if (size < pos) pos = 0;                                  // the file was started afresh
  if (size === pos) return { pos, lines: [] };
  const fd = fs.openSync(file, "r"), len = Math.min(size - pos, 4 << 20), buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, pos); fs.closeSync(fd);
  const text = buf.toString("utf8"), end = text.lastIndexOf("\n");
  if (end < 0) return { pos, lines: [] };                   // half a line: wait for the rest
  return { pos: pos + Buffer.byteLength(text.slice(0, end + 1)), lines: text.slice(0, end).split("\n").filter(Boolean) };
}

// follow(file, onStep, onSay): onStep(event) for each hook line, onSay(sessionId, text, time) for what Claude says
function follow(file, onStep, onSay) {
  let pos = 0; try { pos = fs.statSync(file).size; } catch (e) {}   // earlier activity is not news
  const talks = {};                                                 // session → { file, pos, seen }
  function tick() {
    const r = readNew(file, pos); pos = r.pos;
    for (const l of r.lines) {
      let e; try { e = JSON.parse(l); } catch (x) { continue; }
      if (e.sid && e.tp && !talks[e.sid]) { let p = 0; try { p = e.ev === "SessionStart" ? 0 : fs.statSync(e.tp).size; } catch (x) {} talks[e.sid] = { file: e.tp, pos: p, seen: new Set() }; }
      try { onStep(e); } catch (x) {}
    }
    // the conversations: Claude's own words, as it writes them between steps
    for (const [sid, T] of Object.entries(talks)) {
      const c = readNew(T.file, T.pos); T.pos = c.pos;
      for (const l of c.lines) {
        let o; try { o = JSON.parse(l); } catch (x) { continue; }
        if (o.type !== "assistant" || o.isSidechain || !o.message || !Array.isArray(o.message.content)) continue;
        for (const b of o.message.content) {
          if (b.type !== "text" || !b.text || !b.text.trim()) continue;
          const key = (o.uuid || "") + b.text.slice(0, 40); if (T.seen.has(key)) continue; T.seen.add(key);
          try { onSay(sid, b.text.trim(), Date.parse(o.timestamp) || Date.now()); } catch (x) {}
        }
      }
    }
    // the log is kept short: once it is large and fully read, it starts again
    try { if (pos > (8 << 20) && fs.statSync(file).size === pos) { fs.writeFileSync(file, ""); pos = 0; } } catch (x) {}
  }
  setInterval(tick, 1500).unref();
}

module.exports = { follow };
