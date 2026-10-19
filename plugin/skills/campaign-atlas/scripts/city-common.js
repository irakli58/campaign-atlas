/* Campaign Atlas: what the two ways of making a city share (city-real.js fetches one, city-invent.js makes one up):
   the ages and regions a city can belong to, a little geometry, and the writer of a campaign's city.js. */
"use strict";
const fs = require("fs"), path = require("path");

// ---- when: the age decides the look of the buildings and what a city of that age can contain
const ERAS = {
  medieval: { look: "medieval", note: "plaster, timber and thatch; walls and gates; no railways, lamps or factories" },
  industrial: { look: "industrial", note: "brick terraces and slate, chimney stacks, gas lamps, railways" },
  modern: { look: "modern", note: "flat roofs, towers of glass, a clean plan" },
  future: { look: "scifi", note: "habitat modules and domes joined by tubes, landing pads, solar arrays, black sky" },
  // laid out as a medieval town is, built in fantasy's own look and with its wonders (a wizard's tower, a great tree...)
  fantasy: { look: "fantasy", note: "a medieval town's lanes and walls, roofs of blue, red and violet, turrets, a wizard's tower, a great tree, standing stones" }
};
const ERA_WORDS = { ancient: "medieval", antique: "medieval", classical: "medieval", roman: "medieval", dark: "medieval", medieval: "medieval", mediaeval: "medieval", renaissance: "medieval", tudor: "medieval", fantasy: "fantasy", "high fantasy": "fantasy", "sword and sorcery": "fantasy", magic: "fantasy", old: "industrial", georgian: "industrial", regency: "industrial", victorian: "industrial", edwardian: "industrial", industrial: "industrial", gaslight: "industrial", steampunk: "industrial", pulp: "industrial", "1920s": "industrial", noir: "industrial", modern: "modern", contemporary: "modern", present: "modern", today: "modern", cyberpunk: "modern", future: "future", scifi: "future", "sci-fi": "future", space: "future", spacefaring: "future", starfaring: "future", "far future": "future" };
// era and year from the command's flags. A year alone is enough; an era alone is enough; neither means the present day.
function eraOf(flags) {
  const year = flags.year != null && flags.year !== true ? parseInt(flags.year, 10) : null;
  let era = flags.era && flags.era !== true ? ERA_WORDS[String(flags.era).toLowerCase()] : null;
  if (flags.era && flags.era !== true && !era) throw new Error(`unknown era "${flags.era}": use medieval, industrial, modern, future or fantasy (or give --year)`);
  // a fantasy city, asked for by era or by culture: laid out as medieval, built in fantasy's look
  if (era === "fantasy" || (!era && year == null && String(flags.culture || "").toLowerCase() === "fantasy")) return { era: "medieval", year: Number.isFinite(year) ? year : null, look: "fantasy", fantasy: true };
  if (!era) era = year == null ? "modern" : year < 1650 ? "medieval" : year < 1946 ? "industrial" : year < 2100 ? "modern" : "future";
  // an industrial city before the railway and the gas main keeps the look but not the lamps and stacks
  const look = era === "industrial" && year != null && year < 1815 ? { base: "industrial", lamps: false, stacks: false } : ERAS[era].look;
  return { era, year: Number.isFinite(year) ? year : null, look };
}

// ---- where: the part of the world decides the colours (walls, roofs, ground). Country codes as OpenStreetMap gives them.
const REGION_OF = {
  mediterranean: "it es pt gr hr mt cy me al ba mk sm va mc tr ge am",
  desert: "ae sa eg ma dz tn ly iq ir jo kw qa om ye sy bh il ps lb af pk sd ml ne td mr uz tm",
  eastasia: "jp cn kr kp tw vn mn hk mo"
};
const regionOf = cc => { cc = String(cc || "").toLowerCase(); for (const [r, list] of Object.entries(REGION_OF)) if (list.split(" ").includes(cc)) return r; return ""; };
const REGION_WORDS = { mediterranean: "mediterranean", italy: "mediterranean", spain: "mediterranean", greece: "mediterranean", south: "mediterranean", desert: "desert", arabia: "desert", arabian: "desert", egypt: "desert", sahara: "desert", persia: "desert", eastasia: "eastasia", asia: "eastasia", japan: "eastasia", china: "eastasia", korea: "eastasia", temperate: "", north: "", europe: "", england: "", america: "" };

// ---- geometry (plan units: x east, y south)
const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const plen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
const areaOf = pts => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
const centroid = pts => { let x = 0, y = 0, a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; a += f; x += (pts[j][0] + pts[i][0]) * f; y += (pts[j][1] + pts[i][1]) * f; } if (Math.abs(a) < 1e-9) { let sx = 0, sy = 0; for (const p of pts) { sx += p[0]; sy += p[1]; } return [sx / pts.length, sy / pts.length]; } return [x / (3 * a), y / (3 * a)]; };
const pip = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const pipRings = (x, y, rings) => { let c = false; for (const r of rings) if (pip(x, y, r)) c = !c; return c; };
// Douglas-Peucker, without recursion (a coastline can run to tens of thousands of points)
function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length), st = [[0, pts.length - 1]]; keep[0] = keep[pts.length - 1] = 1;
  while (st.length) {
    const [a, b] = st.pop(), [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) { let t = l ? ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const d = Math.hypot(pts[i][0] - ax - t * dx, pts[i][1] - ay - t * dy); if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const simplifyRing = (ring, tol) => { if (ring.length < 4) return ring.slice(); const s = simplify([...ring, ring[0]], tol); s.pop(); return s; };
// the parts of a line that lie inside a rectangle [x0, y0, x1, y1]
function clipLine(pts, R) {
  const out = []; let cur = null;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay;
    let t0 = 0, t1 = 1, ok = true;
    for (const [p, q] of [[-dx, ax - R[0]], [dx, R[2] - ax], [-dy, ay - R[1]], [dy, R[3] - ay]]) {
      if (p === 0) { if (q < 0) { ok = false; break; } } else { const r = q / p; if (p < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; } else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; } }
    }
    if (!ok) { if (cur) { out.push(cur); cur = null; } continue; }
    const s = [ax + t0 * dx, ay + t0 * dy], e = [ax + t1 * dx, ay + t1 * dy];
    if (!cur || t0 > 0) { if (cur) out.push(cur); cur = [s]; }
    cur.push(e);
    if (t1 < 1) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out.filter(l => l.length > 1);
}
// a ring cut down to a rectangle (Sutherland-Hodgman: exact for the convex window, good enough for a fill)
function clipRing(ring, R) {
  let pts = ring;
  const edges = [[p => p[0] >= R[0], (a, b) => { const t = (R[0] - a[0]) / (b[0] - a[0]); return [R[0], a[1] + t * (b[1] - a[1])]; }], [p => p[0] <= R[2], (a, b) => { const t = (R[2] - a[0]) / (b[0] - a[0]); return [R[2], a[1] + t * (b[1] - a[1])]; }],
    [p => p[1] >= R[1], (a, b) => { const t = (R[1] - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), R[1]]; }], [p => p[1] <= R[3], (a, b) => { const t = (R[3] - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), R[3]]; }]];
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(cut(a, b)); }
    pts = out; if (pts.length < 3) return [];
  }
  return pts;
}

// ---- the campaign's city.js
const r1 = v => Math.round(v * 10) / 10;
function ser(v, exact) {
  if (v && v.__js) return v.__js;                                  // a function, written out as its source
  if (typeof v === "number") return String(exact ? v : r1(v));
  if (Array.isArray(v)) return "[" + v.map(x => ser(x, exact)).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ":" + ser(x, exact)).join(",") + "}";
  return JSON.stringify(v);
}
// data: the object for ATLAS.city(). Long lists go one item to a line so the file can be read and compared.
function writeCity(dir, data, head) {
  const lines = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
    if (Array.isArray(v) && v.length > 3 && v.some(x => x && typeof x === "object")) lines.push(`  ${key}: [\n${v.map(x => "    " + ser(x)).join(",\n")}\n  ]`);
    else lines.push(`  ${key}: ${ser(v, k === "geo")}`);
  }
  const file = path.join(dir, "city.js");
  fs.writeFileSync(file, head.map(l => "// " + l).join("\n") + "\nATLAS.city({\n" + lines.join(",\n") + "\n});\n");
  return file;
}
const js = src => ({ __js: src });

module.exports = { ERAS, eraOf, regionOf, REGION_WORDS, mulberry32, plen, areaOf, centroid, pip, pipRings, simplify, simplifyRing, clipLine, clipRing, writeCity, js, r1 };
