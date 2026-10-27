/* A QR code, drawn as SVG, for the players' link (players-lan.js): a phone's camera opens the players' copy at once.
   Byte mode, error correction level M, versions 1 to 10 (up to 213 bytes, far more than a link needs). Written to the
   standard (ISO/IEC 18004), in the manner of Nayuki's public-domain generator; read back by read() in the tests. */
"use strict";

// versions 1-10 at level M: [error correction bytes per block, [blocks, data bytes each]...]
const BLOCKS = [null, [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]], [16, [4, 27]], [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const M_BITS = 0;   // the format's two bits for level M

/* ---- arithmetic in GF(256), and Reed-Solomon error correction */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a, b) => a && b ? EXP[LOG[a] + LOG[b]] : 0;
function divisor(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g.slice(1); }
function ecc(data, n) { const g = divisor(n), r = new Array(n).fill(0); for (const b of data) { const f = b ^ r.shift(); r.push(0); for (let i = 0; i < n; i++) r[i] ^= mul(g[i], f); } return r; }

/* ---- the codewords: mode, length, the bytes, padding; split into blocks, each with its correction, interleaved */
function codewords(bytes) {
  let ver = 0;
  for (let v = 1; v <= 10; v++) { const cap = BLOCKS[v].slice(1).reduce((n, [k, d]) => n + k * d, 0); if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) { ver = v; break; } }
  if (!ver) throw new Error("Too long for a QR code here");
  const spec = BLOCKS[ver], groups = spec.slice(1), cap = groups.reduce((n, [k, d]) => n + k * d, 0);
  const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); for (const b of bytes) put(b, 8);
  put(0, Math.min(4, cap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
  for (let p = 0xec; data.length < cap; p ^= 0xec ^ 0x11) data.push(p);
  const blocks = []; let at = 0; for (const [k, d] of groups) for (let i = 0; i < k; i++) { const blk = data.slice(at, at + d); at += d; blocks.push({ d: blk, e: ecc(blk, spec[0]) }); }
  const out = [], maxD = Math.max(...blocks.map(b => b.d.length));
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
  for (let i = 0; i < spec[0]; i++) for (const b of blocks) out.push(b.e[i]);
  return { ver, words: out };
}

/* ---- the symbol */
const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
const formatBits = mask => { const data = (M_BITS << 3) | mask; let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537); return ((data << 10) | rem) ^ 0x5412; };
const versionBits = ver => { let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25); return (ver << 12) | rem; };
function symbol(ver, words, mask) {
  const size = ver * 4 + 17, mod = Array.from({ length: size }, () => new Array(size).fill(false)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = ALIGN[ver], last = al.length - 1;
  for (let i = 0; i < al.length; i++) for (let j = 0; j < al.length; j++) { if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  const drawFormat = () => {
    const b = formatBits(mask), bit = i => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i)); set(8, size - 8, true);
  };
  drawFormat();
  if (ver >= 7) { const b = versionBits(ver); for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); } }
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v; if (!fn[y][x] && i < words.length * 8) { mod[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; } }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[mask](x, y)) mod[y][x] = !mod[y][x];
  return { size, mod, fn };
}
// how hard a symbol is to read (runs, blocks, balance): the mask that reads best is kept
function penalty({ size, mod }) {
  let p = 0;
  for (let k = 0; k < 2; k++) for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { const c = k ? mod[b][a] : mod[a][b], d = k ? mod[b - 1][a] : mod[a][b - 1]; if (c === d) { run++; if (b === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
  let dark = 0; for (const row of mod) for (const c of row) if (c) dark++; p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return p;
}
function make(text) {
  const bytes = [...Buffer.from(String(text), "utf8")], { ver, words } = codewords(bytes);
  let best = null; for (let m = 0; m < 8; m++) { const s = symbol(ver, words, m), pn = penalty(s); if (!best || pn < best.pn) best = Object.assign(s, { pn, mask: m, ver }); }
  return best;
}
// the symbol as SVG, with its quiet zone
function svg(text, px) {
  const s = make(text), n = s.size + 8; let d = "";
  for (let y = 0; y < s.size; y++) for (let x = 0; x < s.size; x++) if (s.mod[y][x]) d += `M${x + 4} ${y + 4}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${px || n * 6}" height="${px || n * 6}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* ---- reading a symbol back (for the tests): format, unmasking, the codewords, their correction, the bytes */
function read(s) {
  const { size, mod } = s, ver = (size - 17) / 4, bit = (x, y) => mod[y][x] ? 1 : 0;
  let fb = 0; for (let i = 0; i <= 5; i++) fb |= bit(8, i) << i; fb |= bit(8, 7) << 6; fb |= bit(8, 8) << 7; fb |= bit(7, 8) << 8; for (let i = 9; i < 15; i++) fb |= bit(14 - i, 8) << i;
  const mask = [0, 1, 2, 3, 4, 5, 6, 7].find(m => formatBits(m) === fb); if (mask == null) throw new Error("format bits unreadable");
  const blank = symbol(ver, [], mask), fn = blank.fn, bits = [];
  for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v; if (!fn[y][x]) bits.push((mod[y][x] !== MASKS[mask](x, y)) ? 1 : 0); } }
  const spec = BLOCKS[ver], groups = spec.slice(1), total = groups.reduce((n, [k, d]) => n + k * (d + spec[0]), 0), words = [];
  for (let i = 0; i < total; i++) words.push(bits.slice(i * 8, i * 8 + 8).reduce((a, b) => a * 2 + b, 0));
  const sizes = []; for (const [k, d] of groups) for (let i = 0; i < k; i++) sizes.push(d);
  const blocks = sizes.map(d => ({ d: [], e: [], n: d })); let at = 0;
  for (let i = 0; i < Math.max(...sizes); i++) for (const b of blocks) if (i < b.n) b.d.push(words[at++]);
  for (let i = 0; i < spec[0]; i++) for (const b of blocks) b.e.push(words[at++]);
  for (const b of blocks) { const e = ecc(b.d, spec[0]); if (e.some((x, i) => x !== b.e[i])) throw new Error("correction does not match"); }
  const data = [].concat(...blocks.map(b => b.d)), db = []; for (const w of data) for (let i = 7; i >= 0; i--) db.push((w >>> i) & 1);
  const take = n => { const v = db.slice(0, n).reduce((a, b) => a * 2 + b, 0); db.splice(0, n); return v; };
  if (take(4) !== 4) throw new Error("not byte mode");
  const len = take(ver < 10 ? 8 : 16), out = []; for (let i = 0; i < len; i++) out.push(take(8));
  return Buffer.from(out).toString("utf8");
}

module.exports = { svg, make, read, ecc, formatBits, codewords };
