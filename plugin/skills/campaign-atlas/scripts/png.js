/* Campaign Atlas: a PNG read into plain pixels, with nothing but Node's own zlib (for atlas.js world --sketch: a world
   drawn by hand). Any PNG a drawing program or a phone saves: 1, 2, 4, 8 or 16 bits, grey, colour, a palette, with or
   without transparency; not interlaced ones (a rare kind: the error says to save the picture again). */
"use strict";
const zlib = require("zlib");

function readPNG(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG picture");
  let p = 8, W = 0, H = 0, depth = 8, type = 2, inter = 0, pal = null, trns = null; const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p), kind = buf.toString("latin1", p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (kind === "IHDR") { W = d.readUInt32BE(0); H = d.readUInt32BE(4); depth = d[8]; type = d[9]; inter = d[12]; }
    else if (kind === "PLTE") pal = d;
    else if (kind === "tRNS") trns = d;
    else if (kind === "IDAT") idat.push(d);
    else if (kind === "IEND") break;
  }
  if (inter) throw new Error("this PNG is interlaced: save it again without interlacing (most programs do by default)");
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]; if (!ch) throw new Error("an unknown kind of PNG");
  const bpp = Math.max(1, (ch * depth) >> 3), stride = (W * ch * depth + 7) >> 3, raw = zlib.inflateSync(Buffer.concat(idat)), img = Buffer.alloc(stride * H);
  // undo each row's filter
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? img[o + x - bpp] : 0, b = y ? img[o - stride + x] : 0, c = y && x >= bpp ? img[o - stride + x - bpp] : 0, v = raw[src + x];
      let r;
      if (f === 0) r = v; else if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      img[o + x] = r & 255;
    }
  }
  // to RGBA, 8 bits
  const out = new Uint8Array(W * H * 4), max = (1 << depth) - 1;
  const sample = (y, i) => { if (depth === 8) return img[y * stride + i]; if (depth === 16) return img[y * stride + i * 2]; const bit = i * depth, by = img[y * stride + (bit >> 3)]; return (by >> (8 - depth - (bit & 7))) & max; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, s = k => sample(y, x * ch + k), sc = v => depth === 8 || depth === 16 ? v : Math.round(v * 255 / max);
    if (type === 3) { const i = s(0); out[o] = pal[i * 3]; out[o + 1] = pal[i * 3 + 1]; out[o + 2] = pal[i * 3 + 2]; out[o + 3] = trns && i < trns.length ? trns[i] : 255; }
    else if (type === 0 || type === 4) { const g = sc(s(0)); out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = type === 4 ? s(1) : 255; }
    else { out[o] = s(0); out[o + 1] = s(1); out[o + 2] = s(2); out[o + 3] = type === 6 ? s(3) : 255; }
  }
  return { width: W, height: H, data: out };
}

module.exports = { readPNG };
