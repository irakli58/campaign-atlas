#!/usr/bin/env node
/* Campaign Atlas: checks a made world's geology for sense, not looks (the realistic continents request of 18 Nov 2026,
   section 15: "test whether the geological structures make sense"). For each campaign folder given (its world-terrain.js):
     - rivers: share of their steps that climb, and whether each ends in the sea or a lake;
     - mountains: share of the high ground (the land's top 5%) with a cause near it: a plate border, an old belt's roots;
     - plate borders: share running over land, against the land's own share (borders should mostly lie in the oceans and
       along the continents' margins, not cut through them);
     - repetition: with several worlds, how much their land masks overlap (different seeds should not share coastlines).
   node world-validate.js <campaign> [<campaign> ...] */
"use strict";
const fs = require("fs"), path = require("path");
function load(dir) { let T = null; new Function("window", "ATLAS", fs.readFileSync(path.join(dir, "world-terrain.js"), "utf8"))({}, { worldTerrain: t => { T = t; } }); return T; }
const dec = b => Uint8Array.from(Buffer.from(b, "base64"));
function check(dir) {
  const T = load(dir); if (!T || !T.height) return { dir, error: "no land" };
  const H = dec(T.height), cols = T.cols, rows = T.rows, cell = T.cell, sea = T.sea || 128, at = (x, y) => H[Math.min(rows - 1, Math.max(0, Math.floor(y / cell))) * cols + Math.min(cols - 1, Math.max(0, Math.floor(x / cell)))];
  const kmU = (T.scale && +T.scale.per || 1) * ({ mile: 1.609, km: 1, league: 4.83 }[(T.scale && T.scale.unit) || "km"] || 1), out = { dir: path.basename(dir), tectonics: T.tectonics || 1 };
  // rivers
  let steps = 0, up = 0, ends = 0, endOk = 0;
  // (a tributary ends where it joins a bigger river: on land, rightly; so the other rivers' points count as water)
  const rv = new Set(); (T.rivers || []).forEach((r, k) => (r.pts || []).forEach((q, i) => { if (i < (r.pts.length - 1)) rv.add(k + ":" + Math.floor(q[0] / cell) + "," + Math.floor(q[1] / cell)); }));
  const onOther = (k, x, y) => { const i0 = Math.floor(x / cell), j0 = Math.floor(y / cell); for (let k2 = 0; k2 < (T.rivers || []).length; k2++) { if (k2 === k) continue; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) if (rv.has(k2 + ":" + (i0 + di) + "," + (j0 + dj))) return true; } return false; };
  (T.rivers || []).forEach((r, rk) => { const p = r.pts || []; let prev = null; for (const q of p) { const h = at(q[0], q[1]); if (prev != null) { steps++; if (h > prev + 3) up++; } prev = h; }
    if (p.length) { ends++; const e = p[p.length - 1], h = at(e[0], e[1]); if (h <= sea + 2 || r.lake || r.toLake || r.sink) endOk++; else { let wet = false; for (let dy = -2; dy <= 2 && !wet; dy++) for (let dx = -2; dx <= 2 && !wet; dx++) if (at(e[0] + dx * cell, e[1] + dy * cell) <= sea) wet = true; if (wet || onOther(rk, e[0], e[1])) endOk++; } } });
  out.riversUphill = steps ? up / steps : 0; out.riversEndWet = ends ? endOk / ends : 1; out.rivers = ends;
  // mountains with a cause
  const L = T.tect; let land = 0; const lh = []; for (let n = 0; n < H.length; n++) if (H[n] > sea) { land++; lh.push(H[n]); }
  lh.sort((a, b) => a - b); const top = lh[Math.floor(lh.length * .95)] || 255;
  if (L) { const B = dec(L.border), causes = []; for (let j = 0; j < L.rows; j++) for (let i = 0; i < L.cols; i++) if (B[j * L.cols + i]) causes.push([(i + .5) * L.step, (j + .5) * L.step]);
    for (const h of L.history || []) if (h.kind === "oldbelt" && h.at) causes.push(h.at);
    // (a grid of the causes, for a quick nearest look)
    const g = 400 / kmU, bins = new Map(), key = (x, y) => Math.floor(x / g) + "," + Math.floor(y / g); for (const c of causes) { const k = key(c[0], c[1]); if (!bins.has(k)) bins.set(k, []); bins.get(k).push(c); }
    let high = 0, caused = 0; for (let n = 0; n < H.length; n += 3) { if (H[n] < top) continue; high++; const x = (n % cols + .5) * cell, y = ((n / cols) | 0 + .5) * cell, bx = Math.floor(x / g), by = Math.floor(y / g); let ok = false;
      for (let a = -1; a <= 1 && !ok; a++) for (let b = -1; b <= 1 && !ok; b++) for (const c of bins.get((bx + a) + "," + (by + b)) || []) if (Math.hypot(c[0] - x, c[1] - y) < g) { ok = true; break; }
      if (ok) caused++; }
    out.mountainsWithCause = high ? caused / high : 1;
    let bl = 0, bt = 0; for (let j = 0; j < L.rows; j++) for (let i = 0; i < L.cols; i++) { if (!B[j * L.cols + i]) continue; bt++; if (at((i + .5) * L.step, (j + .5) * L.step) > sea) bl++; }
    out.bordersOnLand = bt ? bl / bt : 0; }
  out.land = land / H.length; out._mask = { cols, rows, m: H.map(h => h > sea ? 1 : 0) };
  return out;
}
const dirs = process.argv.slice(2); if (!dirs.length) { console.error("node world-validate.js <campaign> [<campaign> ...]"); process.exit(2); }
const R = dirs.map(check), pc = v => (v * 100).toFixed(0) + "%";
for (const r of R) { if (r.error) { console.log(`${r.dir}: ${r.error}`); continue; }
  const warn = []; if (r.riversUphill > .02) warn.push("rivers climb"); if (r.riversEndWet < .95) warn.push("rivers end on dry land"); if (r.mountainsWithCause != null && r.mountainsWithCause < .85) warn.push("high ground without a cause"); if (r.bordersOnLand != null && r.bordersOnLand > r.land) warn.push("plate borders cut through the continents");
  console.log(`${r.dir} (tectonics ${r.tectonics}): rivers ${r.rivers}, climbing steps ${pc(r.riversUphill)}, ending in water ${pc(r.riversEndWet)} · high ground with a cause ${r.mountainsWithCause != null ? pc(r.mountainsWithCause) : "?"} · plate border on land ${r.bordersOnLand != null ? pc(r.bordersOnLand) : "?"} (land ${pc(r.land)})${warn.length ? " · TO LOOK AT: " + warn.join(", ") : " · well"}`); }
// repetition between worlds of the same size
const ok = R.filter(r => !r.error);
for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) { const a = ok[i]._mask, b = ok[j]._mask; if (a.cols !== b.cols || a.rows !== b.rows) continue; let inter = 0, uni = 0; for (let n = 0; n < a.m.length; n++) { if (a.m[n] || b.m[n]) uni++; if (a.m[n] && b.m[n]) inter++; }
  const J = uni ? inter / uni : 0; console.log(`  ${ok[i].dir} and ${ok[j].dir}: their land overlaps ${pc(J)}${J > .6 ? " · TO LOOK AT: too alike" : ""}`); }
