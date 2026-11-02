/* A certificate of this computer's own, for the recorder link (recorder-lan.js): phones give a web page the microphone
   only when it comes over https, and a page on the home network has no certificate a phone already trusts. So the app
   makes one for itself, for its own addresses, with Node's own cryptography (an EC P-256 key, signed by itself), kept in
   the app's data folder and made again when the addresses change. The phone warns once that it does not know who signed
   it; the game master says to go on. Nothing is downloaded and nothing leaves this computer. */
"use strict";
const crypto = require("crypto");

// DER, the few parts of it a certificate needs
function der(tag, body) {
  const n = body.length; let len;
  if (n < 128) len = Buffer.from([n]); else { const b = []; let v = n; while (v) { b.unshift(v & 255); v >>= 8; } len = Buffer.from([0x80 | b.length, ...b]); }
  return Buffer.concat([Buffer.from([tag]), len, body]);
}
const seq = (...x) => der(0x30, Buffer.concat(x)), set = (...x) => der(0x31, Buffer.concat(x));
const int = b => der(0x02, b[0] & 0x80 ? Buffer.concat([Buffer.from([0]), b]) : b);
function oid(s) {
  const p = s.split(".").map(Number), out = [40 * p[0] + p[1]];
  for (const n of p.slice(2)) { const b = [n & 127]; let v = Math.floor(n / 128); while (v) { b.unshift((v & 127) | 128); v = Math.floor(v / 128); } out.push(...b); }
  return der(0x06, Buffer.from(out));
}
const utc = d => der(0x17, Buffer.from(d.toISOString().replace(/[-:T]/g, "").slice(2, 14) + "Z"));
const name = cn => seq(set(seq(oid("2.5.4.3"), der(0x0c, Buffer.from(cn)))));

// hosts: this computer's addresses (and names) the phone will use
function make(hosts) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const algo = seq(oid("1.2.840.10045.4.3.2"));                                   // ecdsa-with-SHA256
  const san = seq(...hosts.map(h => /^\d+\.\d+\.\d+\.\d+$/.test(h) ? der(0x87, Buffer.from(h.split(".").map(Number))) : der(0x82, Buffer.from(h))));
  const exts = der(0xa3, seq(
    seq(oid("2.5.29.17"), der(0x04, san)),                                         // its addresses
    seq(oid("2.5.29.19"), der(0x04, seq())),                                       // not a certificate authority
    seq(oid("2.5.29.37"), der(0x04, seq(oid("1.3.6.1.5.5.7.3.1"))))));             // for a web server
  const now = Date.now(), cn = "Campaign Atlas on this computer";
  const tbs = seq(der(0xa0, int(Buffer.from([2]))), int(crypto.randomBytes(12)), algo, name(cn), seq(utc(new Date(now - 864e5)), utc(new Date(now + 397 * 864e5))), name(cn),
    publicKey.export({ type: "spki", format: "der" }), exts);
  const sig = crypto.sign("sha256", tbs, privateKey);
  const cert = seq(tbs, algo, der(0x03, Buffer.concat([Buffer.from([0]), sig])));
  return { cert: "-----BEGIN CERTIFICATE-----\n" + cert.toString("base64").match(/.{1,64}/g).join("\n") + "\n-----END CERTIFICATE-----\n", key: privateKey.export({ type: "pkcs8", format: "pem" }), hosts, made: now };
}

module.exports = { make };
