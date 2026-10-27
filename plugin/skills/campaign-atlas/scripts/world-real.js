/* Campaign Atlas: a world map of the real world (atlas.js world <dir> --real "England"). Writes world-terrain.js from:
     - Natural Earth (public domain, naturalearthdata.com): the true coasts, lakes and rivers, and the names of the seas
       and the mountain ranges;
     - the Mapzen terrain tiles on AWS Open Data: the true height of the land and the depth of the sea, so the
       mountains stand where they really are;
     - OpenStreetMap's place-name search: where each location of world.js stands, found by its name (or by its geo:
       "Place, Country", or geo: [lat, lon]), inside the region.
   The map is laid out to scale (1000 units along its longer side), and knows its scale: distances on it are real.
   What is fetched is kept in the campaign's .cache, so running it again needs no second fetch. */
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");

const UA = "campaign-atlas/1.0 (tabletop campaign map maker)";
const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/";
const TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

async function getJSON(url, file, log, what) {
  if (file && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  if (log && what) log(`  fetching ${what} ...`);
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${what || url}: the server answered ${r.status}`);
  const txt = await r.text();
  if (file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, txt); }
  return JSON.parse(txt);
}
async function search(q, extra, cache) {
  const key = q + (extra || "");
  if (cache && cache[key] !== undefined) return cache[key];
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=" + encodeURIComponent(q) + (extra || ""), { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`the place-name service answered ${r.status}`);
  const j = (await r.json())[0] || null, hit = j ? { lat: +j.lat, lon: +j.lon, name: j.name || String(j.display_name).split(",")[0], display: j.display_name, bbox: (j.boundingbox || []).map(Number), cc: "" } : null;
  if (cache) cache[key] = hit;
  await sleep(1100);                                   // the service asks for no more than one question a second
  return hit;
}

// ---- a PNG, read: enough of the format for the terrain tiles (8 bits a channel, grey, RGB, RGBA or a palette)
function readPNG(buf) {
  let i = 8, w = 0, h = 0, type = 0, depth = 0, pal = null; const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i), t = buf.toString("ascii", i + 4, i + 8), d = buf.subarray(i + 8, i + 8 + len);
    if (t === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; if (d[12]) throw new Error("interlaced PNG"); }
    else if (t === "PLTE") pal = d; else if (t === "IDAT") idat.push(d); else if (t === "IEND") break;
    i += 12 + len;
  }
  if (depth !== 8) throw new Error("PNG depth " + depth);
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type], raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, out = Buffer.alloc(w * h * 3);
  let prev = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++], line = Buffer.from(raw.subarray(p, p + stride)); p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? line[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      if (f === 1) line[x] = (line[x] + a) & 255; else if (f === 2) line[x] = (line[x] + b) & 255; else if (f === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 3;
      if (type === 3) { const k = line[x] * 3; out[o] = pal[k]; out[o + 1] = pal[k + 1]; out[o + 2] = pal[k + 2]; }
      else if (ch <= 2) out[o] = out[o + 1] = out[o + 2] = line[x * ch];
      else { out[o] = line[x * ch]; out[o + 1] = line[x * ch + 1]; out[o + 2] = line[x * ch + 2]; }
    }
    prev = line;
  }
  return { w, h, rgb: out };
}

// ---- the region: where it is and how big, laid out to scale (east-west shrunk by the cosine of the latitude)
async function region(q, flags, cache, log) {
  const hit = await search(q, "", cache);
  if (!hit) throw new Error(`"${q}" was not found: try another name for the region ("Northern England", "the Aegean Sea", "Bavaria, Germany")`);
  let [s, n, w, e] = hit.bbox.length === 4 ? hit.bbox : [hit.lat - 2, hit.lat + 2, hit.lon - 3, hit.lon + 3];
  const lat0 = (s + n) / 2, kx = Math.cos(lat0 * Math.PI / 180) * 111.32, ky = 110.57;
  // --km 800: so many kilometres across, about the region's middle; otherwise the region with a margin
  if (flags.km && flags.km !== true) { const km = +flags.km, lon0 = (w + e) / 2; w = lon0 - km / 2 / kx; e = lon0 + km / 2 / kx; const hkm = Math.min(km * 1.2, Math.max((n - s) * ky, km * .55)); s = lat0 - hkm / 2 / ky; n = lat0 + hkm / 2 / ky; }
  else { const pw = (e - w) * .08, ph = (n - s) * .08; w -= pw; e += pw; s -= ph; n += ph; }
  // no thinner than 1 to 2.2 either way
  let wk = (e - w) * kx, hk = (n - s) * ky;
  if (wk / hk > 2.2) { const d = (wk / 2.2 - hk) / 2 / ky; s -= d; n += d; hk = (n - s) * ky; }
  if (hk / wk > 2.2) { const d = (hk / 2.2 - wk) / 2 / kx; w -= d; e += d; wk = (e - w) * kx; }
  log(`  ${hit.display}: ${Math.round(wk)} km across, ${Math.round(hk)} km down`);
  return { name: hit.name, display: hit.display, s, n, w, e, lat0, lon0: (w + e) / 2, kx, ky, wk, hk };
}

async function realWorld(dir, A, flags, log) {
  const K = A.worldKit, W0 = A.worldData || {}, old = A.worldTerrainData || {}, cdir = path.join(dir, ".cache");
  const q = flags.real && flags.real !== true ? String(flags.real) : old.real && old.real.query;
  if (!q) throw new Error('which part of the world? atlas.js world <dir> --real "England"');
  const gfile = path.join(cdir, "places.json"), cache = fs.existsSync(gfile) ? JSON.parse(fs.readFileSync(gfile, "utf8")) : {};
  const saveCache = () => { fs.mkdirSync(cdir, { recursive: true }); fs.writeFileSync(gfile, JSON.stringify(cache)); };
  const R = await region(q, flags, cache, log); saveCache();
  const long = 1000, wide = R.wk >= R.hk, w = wide ? long : Math.round(long * R.wk / R.hk), h = wide ? Math.round(long * R.hk / R.wk) : long;
  const kmPer = R.wk / w, cell = 4, cols = Math.round(w / cell), rows = Math.round(h / cell), N = cols * rows;
  const X = lon => (lon - R.w) / (R.e - R.w) * w, Y = lat => (R.n - lat) / (R.n - R.s) * h;
  const inBox = (lon, lat, m) => lon >= R.w - m && lon <= R.e + m && lat >= R.s - m && lat <= R.n + m;
  const res = R.wk > 2500 ? "50m" : "10m", get = (name, what) => getJSON(NE + `ne_${res}_${name}.geojson`, path.join(cdir, `ne_${res}_${name}.geojson`), log, what);

  // ---- the land and the lakes, filled cell by cell (a scanline through each cell's middle)
  const polys = gj => { const out = []; for (const f of gj.features || []) { const g = f.geometry; if (!g) continue; for (const P of g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []) out.push({ rings: P, props: f.properties || {} }); } return out; };
  const bboxOf = rings => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of rings[0]) { a = Math.min(a, p[0]); c = Math.max(c, p[0]); b = Math.min(b, p[1]); d = Math.max(d, p[1]); } return [a, b, c, d]; };
  function fill(rings, mark) {
    const rs = rings.map(r => r.map(p => [X(p[0]), Y(p[1])]));
    for (let j = 0; j < rows; j++) {
      const y = (j + .5) * cell, xs = [];
      for (const r of rs) for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [x1, y1] = r[k], [x2, y2] = r[i]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) { const i0 = Math.max(0, Math.ceil(xs[k] / cell - .5)), i1 = Math.min(cols - 1, Math.floor(xs[k + 1] / cell - .5)); for (let i = i0; i <= i1; i++) mark(j * cols + i); }
    }
  }
  const land = new Uint8Array(N), lake = new Uint8Array(N), touches = b => !(b[2] < R.w - 1 || b[0] > R.e + 1 || b[3] < R.s - 1 || b[1] > R.n + 1);
  for (const P of polys(await get("land", "the coasts (Natural Earth)"))) if (touches(bboxOf(P.rings))) fill(P.rings, n => { land[n] = 1; });
  try { for (const P of polys(await get("lakes", "the lakes"))) if (touches(bboxOf(P.rings))) fill(P.rings, n => { lake[n] = 1; }); } catch (e) { log("  ! the lakes could not be fetched: " + e.message); }

  // ---- the heights, from the terrain tiles (metres above or below the sea)
  const elev = new Float32Array(N); let gotElev = false;
  try {
    const cellM = kmPer * cell * 1000, latR = R.lat0 * Math.PI / 180;
    let z = clamp(Math.round(Math.log2(156543 * Math.cos(latR) / cellM)), 1, 11);
    const tx = lon => (lon + 180) / 360, ty = lat => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; };
    let x0, x1, y0, y1;
    for (;;) { const s = 2 ** z; x0 = Math.floor(tx(R.w) * s); x1 = Math.floor(tx(R.e) * s); y0 = Math.floor(ty(R.n) * s); y1 = Math.floor(ty(R.s) * s); if ((x1 - x0 + 1) * (y1 - y0 + 1) <= 64 || z <= 1) break; z--; }
    const n = (x1 - x0 + 1) * (y1 - y0 + 1); log(`  fetching the heights of the land: ${n} terrain tile${n > 1 ? "s" : ""} (zoom ${z}) ...`);
    const tiles = {}, td = path.join(cdir, "terrain");
    fs.mkdirSync(td, { recursive: true });
    for (let ty_ = y0; ty_ <= y1; ty_++) for (let tx_ = x0; tx_ <= x1; tx_++) {
      const f = path.join(td, `${z}-${tx_}-${ty_}.png`);
      let buf = fs.existsSync(f) ? fs.readFileSync(f) : null;
      if (!buf) { const r = await fetch(`${TILES}${z}/${tx_}/${ty_}.png`, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error(`a terrain tile answered ${r.status}`); buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(f, buf); }
      tiles[tx_ + "," + ty_] = readPNG(buf);
    }
    const s2 = 2 ** z;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const lon = R.w + (i + .5) / cols * (R.e - R.w), lat = R.n - (j + .5) / rows * (R.n - R.s), fx = tx(lon) * s2, fy = ty(lat) * s2, T = tiles[Math.floor(fx) + "," + Math.floor(fy)];
      if (!T) continue;
      const px = clamp(Math.floor((fx % 1) * T.w), 0, T.w - 1), py = clamp(Math.floor((fy % 1) * T.h), 0, T.h - 1), o = (py * T.w + px) * 3;
      elev[j * cols + i] = T.rgb[o] * 256 + T.rgb[o + 1] + T.rgb[o + 2] / 256 - 32768;
    }
    gotElev = true;
  } catch (e) { log("  ! the heights could not be fetched (" + e.message + "): the land is drawn without its relief. Run the same command later to add it."); }
  // land: 129 to 255, a mountain from about 1800 m; sea: shallower near the coast. A lake lies just below the sea's level.
  const H = new Uint8Array(N), M = new Uint8Array(N);
  for (let n = 0; n < N; n++) {
    if (lake[n]) { H[n] = 116; M[n] = 160; continue; }
    if (land[n]) { const e = Math.max(0, elev[n]); H[n] = clamp(Math.round(130 + 125 * Math.min(1, Math.pow(e / 2600, .62))), 129, 255); }
    else H[n] = clamp(Math.round(gotElev ? 127 + Math.max(-125, Math.min(0, elev[n]) / 32) : 110), 0, 127);
    M[n] = 118;
  }
  if (!land.some(v => v)) log("  ! no land in this region: it is all sea");

  // ---- rivers, the sea's names and the mountains' names
  const T = { look: null, real: { query: q, name: R.name, bbox: [R.s, R.w, R.n, R.e].map(v => Math.round(v * 1e4) / 1e4) }, w, h, cols, rows, cell, sea: 128, spots: {}, labels: [], routes: [], rivers: [],
    scale: { unit: flags.unit && flags.unit !== true ? String(flags.unit) : /\b(england|britain|scotland|wales|ireland|united kingdom|uk|usa|united states|america)\b/i.test(R.display) ? "mile" : "km", per: 0 },
    credit: "Coasts, lakes, rivers and names: Natural Earth. Heights: Mapzen terrain tiles (AWS Open Data). Places: © OpenStreetMap contributors." };
  T.scale.per = Math.round((T.scale.unit === "mile" ? kmPer / 1.609 : kmPer) * 1e4) / 1e4;
  try {
    const maxRank = R.wk > 1500 ? 5 : R.wk > 600 ? 8 : 12;
    for (const f of (await get("rivers_lake_centerlines", "the rivers")).features || []) {
      const p = f.properties || {}, g = f.geometry; if (!g || (p.scalerank != null && p.scalerank > maxRank)) continue;
      for (const L of g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : []) {
        let run = [];
        const flush = () => { if (run.length > 2) T.rivers.push({ pts: run.map(([lo, la]) => [Math.round(X(lo) * 10) / 10, Math.round(Y(la) * 10) / 10]), w: Math.round((.8 + Math.max(0, 9 - (p.scalerank || 6)) * .18) * 10) / 10, name: p.name || undefined }); run = []; };
        for (const pt of L) { if (inBox(pt[0], pt[1], .05)) run.push(pt); else flush(); }
        flush();
      }
    }
  } catch (e) { log("  ! the rivers could not be fetched: " + e.message); }
  const sea = n => H[n] <= 128;
  try {
    const fromLand = (() => { const D = new Float32Array(N).fill(1e9), qq = []; for (let n = 0; n < N; n++) if (!sea(n)) { D[n] = 0; qq.push(n); } for (let k = 0; k < qq.length; k++) { const n = qq[k], i = n % cols, j = (n / cols) | 0; for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && D[m] > D[n] + 1) { D[m] = D[n] + 1; qq.push(m); } } return D; })();
    const named = new Set();
    for (const P of polys(await getJSON(NE + "ne_10m_geography_marine_polys.geojson", path.join(cdir, "ne_10m_geography_marine_polys.geojson"), log, "the names of the seas"))) {
      const name = P.props.name || P.props.NAME; if (!name || named.has(name) || !touches(bboxOf(P.rings))) continue;
      let best = -1, bd = -1, cnt = 0;
      fill(P.rings, n => { if (sea(n)) { cnt++; const i = n % cols, j = (n / cols) | 0, edge = Math.min(i, cols - 1 - i, j, rows - 1 - j); const d = Math.min(fromLand[n], edge * .7); if (d > bd) { bd = d; best = n; } } });
      if (cnt < N * .006 || best < 0) continue;
      named.add(name);
      T.labels.push({ name, kind: /lake/i.test(P.props.featurecla || "") ? "lake" : "sea", at: [((best % cols) + .5) * cell, (((best / cols) | 0) + .5) * cell].map(Math.round), size: Math.round(14 + Math.min(12, cnt / N * 30)) });
    }
    for (const f of (await getJSON(NE + "ne_10m_geography_regions_points.geojson", path.join(cdir, "ne_10m_geography_regions_points.geojson"), log, "the names of the mountains")).features || []) {
      const p = f.properties || {}, c = f.geometry && f.geometry.coordinates, cla = String(p.featurecla || p.FEATURECLA || "");
      if (!c || !inBox(c[0], c[1], 0) || !(p.name || p.NAME)) continue;
      const kind = /range|mtn|mountain/i.test(cla) ? "range" : /plateau|plain|desert|peninsula|basin|lowland|upland|valley/i.test(cla) ? "region" : null;
      if (kind) T.labels.push({ name: p.name || p.NAME, kind, at: [Math.round(X(c[0])), Math.round(Y(c[1]))], size: kind === "range" ? 14 : 15 });
    }
  } catch (e) { log("  ! the names of the seas and mountains could not be fetched: " + e.message); }

  // ---- where the locations stand: found by name in the region (geo: "Place, Country" to say which, or geo: [lat, lon])
  const keep = !flags.replace && old.real && old.real.query === q ? old.spots || {} : {};
  let found = 0; const lost = [];
  for (const l of W0.locations || []) {
    if (!l || !l.id || Array.isArray(l.at)) continue;
    let ll = Array.isArray(l.geo) ? { lat: l.geo[0], lon: l.geo[1] } : null;
    if (!ll && keep[l.id] && !l.geo) { T.spots[l.id] = keep[l.id]; continue; }
    if (!ll) {
      const view = `&viewbox=${R.w},${R.n},${R.e},${R.s}&bounded=1`;
      try { ll = await search(typeof l.geo === "string" ? l.geo : l.name, view, cache) || (typeof l.geo === "string" ? await search(l.geo, "", cache) : await search(`${l.name}, ${R.name}`, "", cache)); } catch (e) { log("  ! " + e.message); }
      saveCache();
    }
    if (ll && inBox(ll.lon, ll.lat, 0)) { T.spots[l.id] = [Math.round(X(ll.lon) * 10) / 10, Math.round(Y(ll.lat) * 10) / 10]; found++; }
    else lost.push(l.id);
  }
  if (lost.length) log(`  not found in ${R.name}: ${lost.join(", ")}. Give each a geo: "Place, Country" (its real name, or a real place near it), geo: [lat, lon], or at: [x, y] on the map (${w} by ${h})`);
  T.height = Buffer.from(H).toString("base64"); T.moist = Buffer.from(M).toString("base64");
  const lookWord = (flags.look && flags.look !== true ? flags.look : null) || W0.look || old.look || require("./world-invent").lookOfCity(A);
  T.look = K.LOOK_OF[String(lookWord).toLowerCase()] || "parchment";
  const share = Math.round(H.reduce((s, v) => s + (v > 128 ? 1 : 0), 0) / N * 100);
  return { T, summary: `the real ${R.name}: ${Math.round(R.wk)} by ${Math.round(R.hk)} km (1 unit = ${T.scale.per} ${T.scale.unit}), ${share}% land${gotElev ? ", with its true heights" : ""}, ${T.rivers.length} rivers, ${T.labels.length} names; ${found} location${found === 1 ? "" : "s"} found by name` };
}

module.exports = { realWorld, readPNG };
