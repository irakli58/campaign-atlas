/* More models, part x02: spaceships, stations and the surfaces of other worlds. Doors, hatches and corridor frames;
   crew seats; power and its machinery; the medbay; security; quarters and the galley; engines; things broken and
   leaking; and what explorers take onto a moon or a planet. Added for the user's asset expansion (21 Oct 2026); each is
   a kind the library lacked (dev/asset-inventory.txt lists what it had). Metres, standing on y = 0, front to +z. */
(function (A) {
  "use strict";
  const M = A.models; if (!M) return;
  const G = M.gen, PI = Math.PI, H = PI / 2, TAU = PI * 2;
  const pick = (b, l) => l[(b.r() * l.length) | 0];
  const has = (p, k) => !!(p.m && p.m[k]);
  const lit = b => b.cond !== "ruined" && b.cond !== "burned";
  const LEDS = ["glowgreen", "glowamber", "glowcyan", "glowred"];
  const leds = (b, n, x0, x1, y, z, ry) => { for (let i = 0; i < n; i++) b.box(.025, .015, .01, lit(b) ? pick(b, LEDS) : "pgrey", x0 + (x1 - x0) * (i + .5) / n, y, z, 0, ry || 0, 0); };
  const panel = (b, w, h, x, y, z, ry, m) => b.part(() => { b.box(w, h, .012, m || "screen"); b.box(w + .02, h + .02, .008, "trim" in {} ? "trim" : "gunmetal", 0, -.01, -.006); }, x, y, z, 0, ry || 0, 0);
  Object.assign(M.MATS, { hazard: ["metal", 0xd9a21e, .5, .3, ""], carbon: ["plastic", 0x2a2d31, .4, .1, ""], spacesuit: ["fabric", 0xe8e6de, .85, 0, "fabric"], visor: ["glass", 0xc89a3a, .05, .6, "", 0, .85], solar: ["glass", 0x1c2c5a, .15, .4, "", 0x02040a], regolith: ["stone", 0x9a958c, 1, 0, "stone"], marsrock: ["stone", 0xa0583a, .95, 0, "stone"], plasma: ["glow", 0xb06aff, .3, 0, "", 0x7a2ae0], foam: ["plastic", 0xe8e0c8, .9, 0, ""] });

  /* ---- doors, hatches and corridors */
  G("xsfdoor", (b, p) => {
    const { w, d, h } = p, st = p.style || "slide", open = !!p.open;
    const frame = () => { for (const s of [-1, 1]) b.box(.2, h, d, "body", s * (w / 2 - .1), 0); b.box(w, .25, d, "body", 0, h - .25); b.box(w - .4, .03, .02, lit(b) ? (has(p, "light") ? "light" : "glowcyan") : "pgrey", 0, h - .2, d / 2 + .005); };
    if (st === "slide") { frame(); const gap = open ? (w - .4) * .48 : 0; for (const s of [-1, 1]) b.part(() => { b.box((w - .4) / 2, h - .25, d * .4, "door" in (p.m || {}) ? "door" : "body"); b.box((w - .4) / 2 * .6, .04, .01, "hazard", 0, (h - .25) * .5, d * .2 + .006); }, s * ((w - .4) / 4 + gap), 0, 0); leds(b, 3, w / 2 - .18, w / 2 - .02, h * .5, d / 2 + .005); return; }
    if (st === "blast") { b.box(w + .3, h + .3, d, "body", 0, 0, -.05); b.box(w, h, d * .2, "hole" in (p.m || {}) ? "hole" : "carbon", 0, 0, d / 2 - .05); const k = open ? .85 : 0; b.part(() => { b.box(w, h, d * .5, "door" in (p.m || {}) ? "door" : "body"); for (let i = 0; i < 6; i++) b.box(w / 6 - .02, .1, .02, i % 2 ? "hazard" : "pblack", -w / 2 + (i + .5) * w / 6, .1, d * .25 + .01); }, 0, h * k, 0); return; }
    if (st === "iris") { b.cyl(w / 2, w / 2, .08, "body", 0, 0, 0, 24); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; b.part(() => b.ext([[0, 0], [w * .45, 0], [w * .3, w * .2]], .02, "door" in (p.m || {}) ? "door" : "body"), 0, .085, 0, -H, a + (open ? .6 : 0), 0); } b.tor(w / 2 - .03, .02, lit(b) ? "glowamber" : "pgrey", 0, .085, 0); return; }
    if (st === "lift") { frame(); b.box(w - .4, h - .25, .04, "door" in (p.m || {}) ? "door" : "steel", 0, 0, -d * .2); b.box(.02, h - .25, .05, "pblack", 0, 0, -d * .2 + .01); b.box(.15, .25, .03, "pgrey", w / 2 + .1, h * .45, d / 2 + .01); b.cyl(.025, .025, .01, lit(b) ? "glowamber" : "pgrey", w / 2 + .1, h * .5, d / 2 + .03, 10, H); b.cyl(.025, .025, .01, lit(b) ? "glowgreen" : "pgrey", w / 2 + .1, h * .43, d / 2 + .03, 10, H); return; }
    if (st === "corridor") { // a corridor section: floor, sides leaning in, a ceiling with lights, open at both ends
      b.box(w, .08, d, "floor" in (p.m || {}) ? "floor" : "gunmetal"); for (let i = 0; i < Math.round(d / .3); i++) b.box(w - .2, .005, .02, "pblack", 0, .081, -d / 2 + .15 + i * .3);
      for (const s of [-1, 1]) { b.box(.12, h * .6, d, "body", s * (w / 2 - .06), .08); b.part(() => b.box(.12, h * .45, d, "body"), s * (w / 2 - .2), h * .6 + .08, 0, 0, 0, s * .45); for (let i = 0; i < Math.round(d / .6); i++) b.box(.05, h * .55, .08, "rib" in (p.m || {}) ? "rib" : "gunmetal", s * (w / 2 - .14), .1, -d / 2 + .3 + i * .6); b.box(.02, .02, d - .1, lit(b) ? "glowcyan" : "pgrey", s * (w / 2 - .13), .12, 0); }
      b.box(w * .5, .08, d, "body", 0, h, 0); return; }
    if (st === "frame") { frame(); for (let i = 0; i < 4; i++) b.box(.06, .06, d + .02, "hazard", -w / 2 + .1, .2 + i * (h - .4) / 3, 0); return; }
  }, [["open", "Open", 0, 1, 1]]);
  G("xhatch", (b, p) => {
    const { w, d, h } = p, st = p.style || "floor", open = !!p.open;
    if (st === "floor") { b.box(w + .1, .04, d + .1, "body"); b.part(() => { b.box(w, .03, d, "door" in (p.m || {}) ? "door" : "body", 0, 0, d / 2); for (let i = 0; i < 4; i++) b.box(w * .8, .006, .03, "hazard", 0, .03, d * (.2 + i * .2)); b.cyl(.06, .06, .02, "pgrey", 0, .03, d * .5, 12); }, 0, .04, -d / 2, open ? -1.4 : 0, 0, 0); if (open) b.box(w * .9, .002, d * .9, "hole" in (p.m || {}) ? "hole" : "pblack", 0, .041, 0); return; }
    if (st === "vent") { b.box(w, h, .06, "body", 0, 0, -d / 2 + .03); for (let i = 0; i < 6; i++) b.box(w - .08, .02, .03, "pblack", 0, .06 + i * (h - .12) / 5, -d / 2 + .07, .5, 0, 0); if (open) b.part(() => b.box(w, h, .03, "body"), w / 2, 0, -d / 2 + .08, 0, -1.8, 0); return; }
    if (st === "panel") { b.box(w, h, .05, "body", 0, 0, -d / 2 + .025); if (open) { b.box(w - .08, h - .08, .02, "pblack", 0, .04, -d / 2 + .055); for (let i = 0; i < 6; i++) b.tube([[-w * .35 + i * w * .14, h * .9, -d / 2 + .07], [-w * .3 + i * w * .12, h * .5, -d / 2 + .1], [-w * .35 + i * w * .14, h * .1, -d / 2 + .07]], .008, pick(b, ["pred", "pblue", "pyellow", "pgreen", "pwhite"])); leds(b, 5, -w * .3, w * .3, h * .8, -d / 2 + .07); b.part(() => b.box(w, h, .03, "body"), -w / 2, 0, -d / 2 + .1, 0, 1.6, 0); } else { for (const s of [-1, 1]) for (const t of [-1, 1]) b.cyl(.012, .012, .01, "steel", s * (w / 2 - .04), h / 2 + t * (h / 2 - .04), -d / 2 + .055, 8, H); b.box(w * .5, .03, .005, "hazard", 0, h * .5, -d / 2 + .055); } return; }
  }, [["open", "Open", 0, 1, 1]]);

  /* ---- seats */
  G("xsfseat", (b, p) => {
    const { w, d, h } = p, st = p.style || "crew";
    const seat = (x, z, ry) => b.part(() => { b.rbox(w * .9, .12, d * .8, .04, "seat" in (p.m || {}) ? "seat" : "carbon", 0, .45, 0); b.rbox(w * .9, h - .5, .12, .04, "seat" in (p.m || {}) ? "seat" : "carbon", 0, .5, -d * .38, -.12, 0, 0); for (const s of [-1, 1]) { b.box(.06, .25, d * .6, "body", s * w * .48, .45, 0); b.box(.05, h - .7, .03, "strap" in (p.m || {}) ? "strap" : "pred", s * w * .25, .6, -d * .3 + .06, -.12, 0, 0); } b.cyl(.08, .14, .45, "body", 0, 0, 0, 10); }, x, 0, z, 0, ry || 0, 0);
    if (st === "crew") { seat(0, 0); return; }
    if (st === "row") { const n = Math.max(2, Math.round(p.w / .65)), sw = p.w / n; b.box(p.w, .06, d * .7, "body", 0, .38); for (let i = 0; i < n; i++) b.part(() => { b.box(sw * .9, .1, d * .7, "seat" in (p.m || {}) ? "seat" : "carbon", 0, .44); b.box(sw * .9, h - .5, .1, "seat" in (p.m || {}) ? "seat" : "carbon", 0, .5, -d * .32); b.box(.04, h - .7, .02, "strap" in (p.m || {}) ? "strap" : "pred", -sw * .2, .6, -d * .26); b.box(.04, h - .7, .02, "strap" in (p.m || {}) ? "strap" : "pred", sw * .2, .6, -d * .26); }, -p.w / 2 + (i + .5) * sw, 0, 0); for (const s of [-1, 1]) b.box(.06, .38, d * .6, "body", s * (p.w / 2 - .05), 0); return; }
    if (st === "command") { b.cyl(.3, .4, .15, "body", 0, 0, 0, 20); b.cyl(.1, .12, .3, "body", 0, .15, 0, 12); b.part(() => { b.rbox(w * .9, .14, d * .8, .05, "seat" in (p.m || {}) ? "seat" : "leatherblack", 0, .45, 0); b.rbox(w * .9, h - .45, .14, .06, "seat" in (p.m || {}) ? "seat" : "leatherblack", 0, .5, -d * .38, -.15, 0, 0); for (const s of [-1, 1]) b.part(() => { b.rbox(.16, .1, d * .7, .03, "body", 0, 0, 0); b.box(.12, .005, .2, "screen", 0, .1, .1); leds(b, 3, -.05, .05, .101, .2); }, s * w * .55, .65, .05); }, 0, 0, 0); return; }
    if (st === "pilot") { seat(0, 0); b.part(() => { b.rbox(w * 1.3, .5, .35, .06, "body", 0, 0, 0); b.box(w * 1.1, .01, .25, "screen", 0, .5, 0, -.5, 0, 0); leds(b, 8, -w * .5, w * .5, .51, .14); b.cyl(.02, .02, .25, "body", 0, .5, -.1, 8); b.box(.18, .05, .03, "body", 0, .74, -.1); }, 0, .45, d * .85); return; }
  });

  /* ---- consoles the library lacked: a cockpit's dashboard, a comms rack, a control pillar, a security scanner arch */
  G("xsfconsole", (b, p) => {
    const { w, d, h } = p, st = p.style || "cockpit";
    if (st === "cockpit") { b.rbox(w, h * .6, d * .5, .05, "body", 0, 0, -d * .25); b.part(() => { b.rbox(w, .08, d * .6, .03, "body"); for (let i = 0; i < 3; i++) panel(b, w * .28, .25, -w * .32 + i * w * .32, .1, -d * .18, 0); leds(b, 18, -w * .45, w * .45, .085, d * .2); }, 0, h * .6, 0, .3, 0, 0); b.part(() => { const pts = []; for (let i = 0; i <= 10; i++) { const a = PI + i * PI / 10; pts.push([Math.cos(a) * w * .55, Math.sin(a) * .05]); } b.box(w * 1.05, h * .5, .03, "glass", 0, 0, 0); b.box(w * 1.1, .05, .1, "body", 0, h * .5, 0); for (const s of [-1, 1]) b.box(.06, h * .5, .1, "body", s * w * .53, 0, 0); }, 0, h * .78, -d * .45, -.35, 0, 0); return; }
    if (st === "comms") { b.box(w, h, d, "body"); for (let i = 0; i < 4; i++) { b.box(w - .08, h / 5 - .04, .02, "pblack", 0, .1 + i * h / 5, d / 2 + .01); leds(b, 6, -w * .4, w * .1, .14 + i * h / 5, d / 2 + .025); b.cyl(.05, .05, .02, "pgrey", w * .3, .16 + i * h / 5, d / 2 + .03, 12, H); } b.part(() => { b.box(.08, .2, .05, "pblack"); b.tube([[0, 0, .02], [.1, -.2, .08], [.05, -.4, .05]], .006, "pblack"); }, -w * .38, h * .82, d / 2 + .06); panel(b, w * .6, h * .14, 0, h * .82, d / 2 + .015); return; }
    if (st === "pillar") { b.cyl(w / 2, w / 2 + .05, h * .8, "body", 0, 0, 0, 16); b.part(() => { b.cyl(w / 2 + .1, w / 2, .1, "body", 0, 0, 0, 16); b.cyl(w / 2, w / 2, .005, lit(b) ? "screen" : "screenoff", 0, .1, 0, 16); }, 0, h * .8, 0, .35, 0, 0); for (let i = 0; i < 3; i++) b.tor(w / 2 + .01, .012, lit(b) ? "glowcyan" : "pgrey", 0, h * (.2 + i * .2), 0); return; }
    if (st === "arch") { for (const s of [-1, 1]) { b.rbox(.25, h, d, .05, "body", s * (w / 2 - .125)); b.box(.02, h - .3, d * .6, lit(b) ? "glowred" : "pgrey", s * (w / 2 - .26), .15, 0); } b.rbox(w, .25, d, .05, "body", 0, h - .25); panel(b, .3, .2, w / 2 + .1, h * .55, 0, -H); return; }
    if (st === "map") { b.box(w, h * .9, d, "body"); b.box(w - .1, .01, d - .1, lit(b) ? "screen" : "screenoff", 0, h * .9); if (lit(b)) { const holo = b.mat("glowcyan").clone(); holo.transparent = true; holo.opacity = .5; holo.depthWrite = false; for (let i = 0; i < 12; i++) b.sph(.02 + b.r() * .03, holo, (b.r() - .5) * w * .8, h * .9 + .05 + b.r() * .2, (b.r() - .5) * d * .8, 1, 8); b.tor(w * .3, .004, holo, 0, h * .9 + .12, 0); } return; }
  });

  /* ---- power */
  G("xsfpower", (b, p) => {
    const { w, d, h } = p, st = p.style || "cell";
    if (st === "cell") { b.cyl(w / 2, w / 2, .08, "body", 0, 0, 0, 16); b.cyl(w * .38, w * .38, h - .16, lit(b) ? (has(p, "core") ? "core" : "plasma") : "glass", 0, .08, 0, 16); for (let i = 0; i < 3; i++) b.box(.04, h - .16, .04, "body", Math.cos(i * TAU / 3) * w * .44, .08, Math.sin(i * TAU / 3) * w * .44); b.cyl(w / 2, w / 2, .08, "body", 0, h - .08, 0, 16); b.box(.06, .04, .02, "hazard", 0, h - .1, w / 2); return; }
    if (st === "rack") { b.box(w, .06, d, "body"); b.box(w, .06, d, "body", 0, h - .06); for (const s of [-1, 1]) b.box(.06, h, d, "body", s * (w / 2 - .03)); const n = Math.max(2, Math.round(w / .3)); for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const x = -w / 2 + .1 + (i + .5) * (w - .2) / n, y = .06 + r * (h - .12) / 2; b.cyl(.09, .09, (h - .12) / 2 - .06, "battery" in (p.m || {}) ? "battery" : "pblue", x, y, 0, 12); b.cyl(.04, .04, .03, lit(b) ? "glowgreen" : "pgrey", x, y + (h - .12) / 2 - .06, 0, 10); } return; }
    if (st === "dock") { b.box(w, .1, d, "body"); b.box(w * .8, h, .25, "body", 0, 0, -d / 2 + .125); b.box(w * .5, .4, .01, lit(b) ? "screen" : "screenoff", 0, h * .6, -d / 2 + .255); for (const s of [-1, 1]) { b.box(.08, .3, .3, "body", s * w * .3, .1, -d / 2 + .3); b.box(.04, .06, .04, lit(b) ? "glowcyan" : "pgrey", s * w * .3, .4, -d / 2 + .4); } b.tor(w * .3, .02, lit(b) ? "glowcyan" : "pgrey", 0, .11, 0); return; }
    if (st === "capacitor") { b.box(w, .1, d, "body"); const n = Math.max(2, Math.round(w / .35)); for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n; b.cyl(.13, .13, h - .25, "body", x, .1, 0, 14); for (let k = 0; k < 5; k++) b.tor(.135, .01, "copper", x, .2 + k * (h - .35) / 5, 0); b.cyl(.04, .04, .15, "copper", x, h - .15, 0, 8); } b.tube([[-w / 2 + .1, h, 0], [0, h + .1, 0], [w / 2 - .1, h, 0]], .02, "copper"); return; }
    if (st === "junction") { b.box(w, h, d, "body", 0, 0, -d / 2 + d / 2); for (let i = 0; i < 4; i++) b.cyl(.05, .05, .5, "conduit" in (p.m || {}) ? "conduit" : "hazard", -w * .3 + i * w * .2, h, 0, 10); for (let i = 0; i < 4; i++) b.cyl(.05, .05, .5, "conduit" in (p.m || {}) ? "conduit" : "hazard", -w * .3 + i * w * .2, -.5 + .01, 0, 10); b.box(w * .6, h * .3, .01, lit(b) ? "screen" : "screenoff", 0, h * .5, d / 2 + .005); b.sign("⚡", w * .2, w * .2, "#d9a21e", "#111", -w * .3, h * .2, d / 2 + .006); return; }
    if (st === "conduit") { b.box(w, .25, d, "body"); b.box(w - .1, .02, d * .5, lit(b) ? (has(p, "glow") ? "glow" : "plasma") : "pgrey", 0, .25); for (let i = 0; i < Math.round(w / .4); i++) b.box(.06, .27, d + .02, "gunmetal", -w / 2 + .2 + i * .4); return; }
  });

  /* ---- the medbay */
  G("xsfmed", (b, p) => {
    const { w, d, h } = p, st = p.style || "bed";
    if (st === "bed") { b.rbox(w * .6, .5, d * .5, .05, "body", 0, 0, 0); b.rbox(w, .12, d, .05, "body", 0, .5); b.rbox(w * .9, .08, d * .95, .04, "pad" in (p.m || {}) ? "pad" : "foam", 0, .62); b.rbox(w * .5, .06, .3, .03, "pad" in (p.m || {}) ? "pad" : "foam", 0, .7, -d / 2 + .2); b.part(() => { b.cyl(.025, .025, 1.2, "body", 0, 0, 0, 8); b.box(.5, .35, .04, "body", 0, 1.2, 0, -.2, 0, 0); b.box(.44, .28, .005, lit(b) ? "screen" : "screenoff", 0, 1.235, .02, -.2, 0, 0); }, w / 2 + .15, 0, -d / 2 + .3); b.box(w * .8, .02, .02, lit(b) ? "glowcyan" : "pgrey", 0, .55, d / 2); return; }
    if (st === "surgeon") { b.cyl(.2, .25, .2, "body", 0, h - .2, 0, 14); const arm = (a, k) => b.part(() => { b.box(.06, .6, .06, "body", 0, -.6, 0); b.sph(.05, "gunmetal", 0, -.62, 0, 1, 8); b.part(() => { b.box(.05, .45, .05, "body", 0, -.45, 0); b.cone(.02, .08, k ? "steel" : (lit(b) ? "glowred" : "pgrey"), 0, -.53, 0, 8); }, 0, -.62, 0, .7, 0, 0); }, Math.cos(a) * .15, h - .2, Math.sin(a) * .15, .4, a, 0); arm(0, 0); arm(TAU / 3, 1); arm(TAU * 2 / 3, 1); return; }
    if (st === "scanner") { b.rbox(w * .5, .55, d, .05, "body", 0, 0, 0); b.rbox(w * .45, .08, d * .95, .04, "pad" in (p.m || {}) ? "pad" : "foam", 0, .55); b.part(() => { b.tor(w * .55, .12, "body", 0, 0, 0, 0); b.tor(w * .5, .01, lit(b) ? "glowcyan" : "pgrey", 0, 0, .1, 0); }, 0, .75, -d * .1); for (const s of [-1, 1]) b.box(.15, .75, .3, "body", s * w * .52, 0, -d * .1); return; }
    if (st === "stasis") { b.rbox(w, .4, d, .06, "body"); b.part(() => { b.cyl(w * .42, w * .42, d * .9, "frosted", 0, 0, 0, 20, 0, H); }, 0, .62, 0); b.rbox(w, .1, d * .1, .03, "body", 0, .4, -d / 2 + .05); b.rbox(w, .1, d * .1, .03, "body", 0, .4, d / 2 - .05); if (lit(b)) b.box(w * .6, .02, d * .8, "glowcyan", 0, .41); b.box(.25, .15, .01, lit(b) ? "screen" : "screenoff", w * .25, .25, d / 2 + .005); return; }
    if (st === "decon") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, h, .08, "body", sx * (w / 2 - .04), 0, sz * (d / 2 - .04)); b.box(w, .08, d, "body", 0, h - .08); b.box(w, .06, d, "body"); for (const s of [-1, 1]) b.box(.02, h - .2, d - .1, "frosted", s * (w / 2 - .04), .06, 0); for (let i = 0; i < 9; i++) b.cyl(.025, .025, .02, "steel", -w * .3 + (i % 3) * w * .3, h - .1, -d * .3 + ((i / 3) | 0) * d * .3, 8); b.box(w - .2, .04, .02, lit(b) ? "glowamber" : "pgrey", 0, h - .14, d / 2 - .02); b.box(w * .7, .005, d * .7, "grate" in (p.m || {}) ? "grate" : "pblack", 0, .061); return; }
    if (st === "freezer") { b.rbox(w, h, d, .03, "body"); b.box(w - .06, h * .65, .01, "frosted", 0, h * .3, d / 2 + .005); for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) b.cyl(.02, .02, .08, pick(b, ["pred", "pblue", "pyellow", "pwhite"]), -w * .35 + j * w * .17, h * .32 + i * h * .15, d * .2, 8); b.box(w * .4, .08, .01, lit(b) ? "screen" : "screenoff", -w * .2, h * .12, d / 2 + .005); b.box(.03, .3, .04, "steel", w * .4, h * .45, d / 2 + .03); return; }
    if (st === "cart") { b.rbox(w, .06, d, .02, "body", 0, .85); b.rbox(w, .06, d, .02, "body", 0, .45); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.cyl(.018, .018, .85, "steel", sx * (w / 2 - .04), .08, sz * (d / 2 - .04), 8); b.cyl(.04, .04, .03, "pblack", sx * (w / 2 - .04), .04, sz * (d / 2 - .04), 10, H); } P_tray(b, 0, .91, 0); b.box(.12, .08, .08, "pred", w * .3, .51, 0); b.box(.2, .1, .14, "pwhite", -w * .2, .51, 0); return; }
  });
  const P_tray = (b, x, y, z) => { b.box(.36, .015, .24, "steel", x, y, z); for (let i = 0; i < 5; i++) b.box(.015, .006, .14, "steel", x - .12 + i * .06, y + .015, z, 0, (i - 2) * .1, 0); };

  /* ---- security */
  G("xsfsec", (b, p) => {
    const { w, d, h } = p, st = p.style || "camera";
    if (st === "camera") { b.box(.12, .12, .04, "body", 0, 0, -d / 2 + .02); b.part(() => { b.box(.03, .03, .12, "body", 0, 0, .06); b.part(() => { b.rbox(.1, .1, .24, .03, "housing" in (p.m || {}) ? "housing" : "pwhite", 0, -.05, .1); b.cyl(.035, .035, .01, "glass", 0, 0, .225, 12, H); b.sph(.008, lit(b) ? "glowred" : "pgrey", .03, .03, .2, 1, 6); }, 0, 0, .12, .35, .4, 0); }, 0, .06, -d / 2 + .04); return; }
    if (st === "turret") { b.cyl(w * .4, w * .45, .1, "body", 0, h - .1, 0, 16); b.cyl(.06, .06, .2, "body", 0, h - .3, 0, 10); b.part(() => { b.sph(w * .3, "body", 0, 0, 0, .8, 14); for (const s of [-1, 1]) b.cyl(.025, .025, w * .6, "gunmetal", s * .05, 0, w * .4, 10, H); b.sph(.025, lit(b) ? "glowred" : "pgrey", 0, .06, w * .26, 1, 8); }, 0, h - .45, 0, .3, .5, 0); return; }
    if (st === "laser") { for (const s of [-1, 1]) { b.rbox(.12, h, .12, .03, "body", s * w / 2); for (let i = 0; i < 4; i++) b.cyl(.015, .015, .02, lit(b) ? "glowred" : "pgrey", s * (w / 2 - .065), .3 + i * (h - .5) / 3, 0, 8, 0, H); } if (lit(b)) { const beam = b.mat("glowred").clone(); beam.transparent = true; beam.opacity = .55; for (let i = 0; i < 4; i++) b.box(w - .1, .006, .006, beam, 0, .3 + i * (h - .5) / 3); } return; }
    if (st === "idscan") { b.rbox(w, h * .85, d, .04, "body", 0, 0, 0); b.part(() => { b.rbox(w, .3, .08, .03, "body"); b.box(w * .7, .14, .005, lit(b) ? "screen" : "screenoff", 0, .12, .042); b.box(w * .4, .03, .005, lit(b) ? "glowgreen" : "pgrey", 0, .04, .042); }, 0, h * .85, 0, -.4, 0, 0); b.box(.14, .1, .04, "pblack", 0, h * .6, d / 2 + .02); return; }
    if (st === "forcefield") { for (const s of [-1, 1]) { b.rbox(.2, h, d, .05, "body", s * (w / 2 - .1)); b.box(.04, h - .3, .04, lit(b) ? "glowcyan" : "pgrey", s * (w / 2 - .22), .15, 0); } if (lit(b)) { const f = b.mat("glowcyan").clone(); f.transparent = true; f.opacity = .22; f.depthWrite = false; b.box(w - .44, h - .3, .01, f, 0, .15); } return; }
    if (st === "armory") { b.box(w, h, d, "body"); b.box(w - .06, h - .1, .02, "glass", 0, .05, d / 2 + .005); const n = Math.max(2, Math.round(w / .25)); for (let i = 0; i < n; i++) { const x = -w / 2 + .1 + (i + .5) * (w - .2) / n; b.part(() => { b.box(.06, h * .55, .04, "gunmetal", 0, 0, 0); b.box(.05, .12, .1, "gunmetal", 0, h * .15, .05); b.cyl(.012, .012, h * .2, "pblack", 0, h * .55, 0, 6); }, x, h * .18, 0, 0, 0, .1); } b.box(w * .3, .06, .01, lit(b) ? "glowred" : "pgrey", 0, h - .1, d / 2 + .01); return; }
  });

  /* ---- quarters and galley */
  G("xsfliving", (b, p) => {
    const { w, d, h } = p, st = p.style || "bunk";
    if (st === "bunk") { b.rbox(w, h, d, .05, "body"); for (let i = 0; i < 2; i++) { const y = .15 + i * h * .48; b.box(w - .1, h * .4, d - .05, "hole" in (p.m || {}) ? "hole" : "carbon", 0, y + .02, .05); b.rbox(w - .16, .1, d - .12, .03, "pad" in (p.m || {}) ? "pad" : "foam", 0, y, .05); b.box(w - .2, .02, .02, lit(b) ? "glowamber" : "pgrey", 0, y + h * .38, d / 2 - .02); b.box(.02, h * .3, d * .9, "curtain" in (p.m || {}) ? "curtain" : "grey", w / 2 - .06, y + .08, .03); } return; }
    if (st === "mess") { b.rbox(w, .06, d, .03, "body", 0, .74); b.cyl(.08, .12, .74, "body", 0, 0, 0, 10); for (const s of [-1, 1]) { b.rbox(w, .06, .4, .03, "seat" in (p.m || {}) ? "seat" : "carbon", 0, .45, s * (d / 2 + .35)); b.box(.06, .45, .3, "body", 0, 0, s * (d / 2 + .35)); } for (let i = 0; i < 4; i++) b.box(.25, .02, .18, "steel", -w * .3 + (i % 2) * w * .6, .8, (i < 2 ? -1 : 1) * d * .25); return; }
    if (st === "dispenser") { b.rbox(w, h, d, .04, "body"); b.box(w * .7, h * .25, .01, lit(b) ? "screen" : "screenoff", 0, h * .65, d / 2 + .005); b.box(w * .5, h * .2, d * .3, "hole" in (p.m || {}) ? "hole" : "carbon", 0, h * .3, d / 2 - d * .15 + .01); for (let i = 0; i < 4; i++) b.cyl(.025, .025, .01, lit(b) ? pick(b, LEDS) : "pgrey", -w * .25 + i * w * .17, h * .55, d / 2 + .006, 10, H); b.box(.14, .03, .14, "steel", 0, h * .3, d * .2); return; }
    if (st === "treadmill") { b.box(w * .6, .1, d, "body"); b.box(w * .5, .02, d * .9, "pblack", 0, .1); for (const s of [-1, 1]) b.cyl(.025, .025, 1.1, "body", s * w * .3, .1, -d / 2 + .15, 8); b.box(w * .7, .05, .25, "body", 0, 1.2, -d / 2 + .15); b.box(.25, .15, .01, lit(b) ? "screen" : "screenoff", 0, 1.26, -d / 2 + .03, -.4, 0, 0); return; }
    if (st === "hydro") { const n = 3; for (let i = 0; i < n; i++) { const y = .1 + i * (h - .2) / n; b.box(w, .08, d, "body", 0, y); b.box(w - .1, .04, d - .1, "soil" in (p.m || {}) ? "soil" : "earth", 0, y + .08); for (let k = 0; k < Math.round(w / .12); k++) b.cone(.04 + b.r() * .03, .1 + b.r() * .12, "leaf", -w / 2 + .08 + k * .12, y + .12, (b.r() - .5) * d * .5, 6); if (lit(b)) b.box(w - .1, .02, .04, "glowmagenta", 0, y + (h - .2) / n - .04, 0); } for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.04, h, .04, "body", sx * (w / 2 - .02), 0, sz * (d / 2 - .02)); return; }
    if (st === "recycler") { b.cyl(w / 2, w / 2, h * .7, "body", 0, 0, 0, 16); b.sph(w / 2, "body", 0, h * .7, 0, .5, 16); b.cyl(w * .35, w * .35, h * .5, "glass", 0, h * .12, w * .05, 16); b.cyl(w * .33, w * .33, h * .3, "water" in (p.m || {}) ? "water" : "glassblue", 0, h * .12, w * .05, 16); b.tube([[w / 2, h * .5, 0], [w * .8, h * .5, 0], [w * .8, 0, 0]], .03, "steel"); leds(b, 3, -.05, .05, h * .78, w / 2); return; }
  });

  /* ---- engines and the engineering deck */
  G("xsfengine", (b, p) => {
    const { w, d, h } = p, st = p.style || "thruster";
    if (st === "thruster") { b.part(() => { b.cyl(w * .3, w * .5, d * .6, "body", 0, 0, 0, 20, 0, 0); b.cyl(w * .32, w * .32, d * .4, "body", 0, d * .6, 0, 20); for (let i = 0; i < 6; i++) b.tor(w * (.33 + i * .028), .015, "gunmetal", 0, d * (.1 + i * .08), 0, 0); b.cyl(w * .45, w * .45, .01, lit(b) ? "glowcyan" : "carbon", 0, -.005, 0, 20); }, 0, w / 2, d * .2, H, 0, 0); for (const s of [-1, 1]) b.box(.15, w * .3, d * .4, "body", s * w * .35, 0, -d * .2); return; }
    if (st === "drive") { b.box(w, .3, d, "body"); b.part(() => { b.cyl(h * .3, h * .3, d * .9, "body", 0, 0, 0, 20); for (let i = 0; i < 5; i++) b.tor(h * .36, .05, "ring" in (p.m || {}) ? "ring" : "gunmetal", 0, -d * .35 + i * d * .175, 0, 0); b.cyl(h * .12, h * .12, d * .95, lit(b) ? "plasma" : "glass", 0, 0, 0, 14); }, 0, h * .5, 0, H, 0, 0); return; }
    if (st === "coolant") { for (let i = 0; i < 2; i++) b.cyl(w * .22, w * .22, h, "body", (i - .5) * w * .5, 0, 0, 16); for (let i = 0; i < 2; i++) b.sph(w * .22, "body", (i - .5) * w * .5, h, 0, .5, 14); b.tube([[-w * .25, h * .8, w * .2], [0, h * .9, w * .3], [w * .25, h * .8, w * .2]], .04, "pipe" in (p.m || {}) ? "pipe" : "paintblue"); b.box(w * .2, .2, .01, "hazard", -w * .25, h * .4, w * .22); b.cyl(.06, .06, .02, "glass", w * .25, h * .5, w * .22, 12, H); return; }
    if (st === "bench") { b.box(w, .08, d, "body", 0, .9); for (const s of [-1, 1]) b.box(.08, .9, d, "body", s * (w / 2 - .04)); b.box(w, h - .9, .05, "body", 0, .98, -d / 2 + .025); for (let i = 0; i < 8; i++) b.box(.04, .2 + b.r() * .1, .02, pick(b, ["steel", "pred", "pyellow", "gunmetal"]), -w * .4 + i * w * .11, 1.1 + b.r() * .2, -d / 2 + .06); b.box(.3, .1, .2, "hazard", w * .2, .98, 0); b.cyl(.06, .06, .12, "pgrey", -w * .3, .98, .1, 10); b.box(.2, .02, .14, lit(b) ? "screen" : "screenoff", -w * .05, .99, .05); return; }
    if (st === "spool") { b.cyl(w / 2, w / 2, .06, "body", 0, 0, 0, 20, H); b.cyl(w * .3, w * .3, d - .12, "cable" in (p.m || {}) ? "cable" : "pblack", 0, w / 2, 0, 20, H); for (const s of [-1, 1]) b.cyl(w / 2, w / 2, .04, "body", 0, w / 2, s * (d / 2 - .02), 20, H); b.tube([[0, w * .8, 0], [w * .4, w * .3, .1], [w * .8, .02, .3]], .03, "cable" in (p.m || {}) ? "cable" : "pblack"); return; }
  });

  /* ---- things broken: the station after the accident */
  G("xsfdamage", (b, p) => {
    const { w, d, h } = p, st = p.style || "sparks";
    if (st === "sparks") { b.box(w, h, .05, "body", 0, 0, -d / 2 + .025); b.box(w * .5, h * .4, .02, "pblack", 0, h * .3, -d / 2 + .055); for (let i = 0; i < 5; i++) b.tube([[-w * .2 + i * w * .1, h * .6, -d / 2 + .06], [-w * .25 + i * w * .12, h * .3, -d / 2 + .25], [-w * .3 + i * w * .15, 0, -d / 2 + .3 + b.r() * .2]], .008, pick(b, ["pred", "pyellow", "pblue"])); for (let i = 0; i < 9; i++) b.box(.006, .006, .06 + b.r() * .08, "glowamber", (b.r() - .5) * w * .4, h * .35 + b.r() * .2, -d / 2 + .1 + b.r() * .15, b.r() * 3, b.r() * 3, 0); return; }
    if (st === "leak") { b.cyl(.08, .08, w, "pipe" in (p.m || {}) ? "pipe" : "steel", 0, h, 0, 12, 0, H); b.cyl(.1, .1, .1, "body", -w * .1, h, 0, 12, 0, H); for (let i = 0; i < 3; i++) b.sph(.05 + b.r() * .04, "steam" in (p.m || {}) ? "steam" : "frosted", -w * .1 + (b.r() - .5) * .2, h + .1 + i * .15, (b.r() - .5) * .2, 1, 8); const pts = []; for (let i = 0; i < 12; i++) { const a = i * TAU / 12, k = .7 + b.r() * .3; pts.push([Math.cos(a) * w * .35 * k, Math.sin(a) * d * .35 * k]); } b.slab(pts, .006, "puddle" in (p.m || {}) ? "puddle" : "slime", -w * .1, 0, 0); return; }
    if (st === "wreck") { b.box(w, h * .6, d * .5, "body", 0, 0, -d * .25, 0, 0, .15); b.box(w * .8, .02, d * .3, "glass", 0, h * .6, -d * .1, -.6, 0, .15); for (let i = 0; i < 8; i++) b.box(.1 + b.r() * .2, .02, .1 + b.r() * .2, pick(b, ["body", "glass", "carbon"]), (b.r() - .5) * w, .01, d * .1 + b.r() * d * .4, 0, b.r() * 3, 0); return; }
    if (st === "debris") { for (let i = 0; i < 9; i++) b.box(.2 + b.r() * .5, .02 + b.r() * .06, .15 + b.r() * .4, pick(b, ["body", "carbon", "gunmetal", "hazard"]), (b.r() - .5) * w * .8, b.r() * .25, (b.r() - .5) * d * .8, (b.r() - .5), b.r() * 3, (b.r() - .5)); for (let i = 0; i < 4; i++) b.tube([[(b.r() - .5) * w, .02, (b.r() - .5) * d], [(b.r() - .5) * w * .5, .2, 0], [(b.r() - .5) * w, .02, (b.r() - .5) * d]], .012, pick(b, ["pred", "pblack", "pyellow"])); return; }
    if (st === "beacon") { b.cyl(w / 2, w / 2 + .03, .1, "body", 0, 0, 0, 14); b.cyl(w * .3, w * .3, h * .5, "hazard", 0, .1, 0, 14); b.cyl(w * .25, w * .25, h * .3, lit(b) ? "glowred" : "glass", 0, h * .6, 0, 14); b.sph(w * .25, "body", 0, h * .9, 0, .5, 12); return; }
    if (st === "patch") { b.box(w, h, .02, "body", 0, 0, -d / 2 + .01); b.box(w * .6, h * .6, .03, "patch" in (p.m || {}) ? "patch" : "hazard", .03, h * .2, -d / 2 + .035, 0, 0, .1); for (let i = 0; i < 10; i++) b.cyl(.012, .012, .02, "steel", -w * .25 + (i % 5) * w * .12, h * .25 + ((i / 5) | 0) * h * .45, -d / 2 + .05, 8, H); for (let i = 0; i < 4; i++) b.box(.006, h * .3, .005, "pblack", w * .35, h * .2, -d / 2 + .025, 0, 0, (b.r() - .5)); return; }
  });

  /* ---- other worlds: the surface, its habitats and what explorers carry */
  G("xspace", (b, p) => {
    const { w, d, h } = p, st = p.style || "rover";
    if (st === "rover") { b.rbox(w * .8, .35, d * .7, .08, "body", 0, .5); for (const sx of [-1, 1]) for (const sz of [-1, 0, 1]) { b.cyl(.28, .28, .22, "tyre" in (p.m || {}) ? "tyre" : "pblack", sx * w * .45, .28, sz * d * .32, 14, 0, H); b.cyl(.15, .15, .23, "body", sx * w * .45, .28, sz * d * .32, 10, 0, H); } b.rbox(w * .5, .5, d * .35, .1, "body", 0, .85, -d * .1); b.box(w * .45, .2, .02, "glass", 0, 1.05, d * .08); b.cyl(.015, .015, .6, "body", w * .3, .85, -d * .3, 6); b.part(() => b.dish ? null : b.cyl(.18, .02, .06, "body", 0, 0, 0, 16), w * .3, 1.45, -d * .3, -.5, 0, 0); b.box(w * .7, .02, d * .3, "solar", 0, .86, d * .25); return; }
    if (st === "suit") { b.cyl(.25, .3, .08, "body", 0, 0, 0, 12); b.cyl(.025, .025, h - .1, "body", 0, .08, -.12, 8); const s = "spacesuit"; for (const sx of [-1, 1]) { b.cyl(.08, .07, .8, s, sx * .12, .1, 0, 10); b.cyl(.09, .09, .1, "boot" in (p.m || {}) ? "boot" : "pgrey", sx * .12, .08, .02, 10); } b.rbox(.5, .65, .32, .12, s, 0, .9); b.rbox(.4, .5, .18, .05, "pack" in (p.m || {}) ? "pack" : "pwhite", 0, .95, -.22); for (const sx of [-1, 1]) b.part(() => { b.cyl(.065, .06, .6, s, 0, -.6, 0, 10); b.sph(.07, "pgrey", 0, -.65, 0, 1, 8); }, sx * .32, 1.48, 0, 0, 0, sx * .15); b.sph(.17, s, 0, 1.68, 0, 1, 14); b.sph(.13, "visor", 0, 1.69, .07, .85, 12); b.box(.2, .1, .02, lit(b) ? "screen" : "screenoff", 0, 1.3, .17); return; }
    if (st === "o2rack") { b.box(w, .06, d, "body"); b.box(w, .06, d * .4, "body", 0, h * .7, -d * .3); const n = Math.max(2, Math.round(w / .24)); for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n; b.cyl(.1, .1, h * .82, "tank" in (p.m || {}) ? "tank" : "paintwhite", x, .06, 0, 14); b.sph(.1, "tank" in (p.m || {}) ? "tank" : "paintwhite", x, h * .88, 0, .6, 12); b.cyl(.025, .025, .08, "brass", x, h * .9, 0, 8); b.box(.12, .05, .005, "hazard", x, h * .5, .1); } return; }
    if (st === "solar") { b.cyl(.06, .08, h * .6, "body", 0, 0, 0, 10); b.part(() => { b.box(w, .04, d, "body"); b.box(w - .06, .01, d - .06, "solar", 0, .04); for (let i = 1; i < 4; i++) b.box(.01, .012, d - .06, "body", -w / 2 + i * w / 4, .042, 0); for (let i = 1; i < 3; i++) b.box(w - .06, .012, .01, "body", 0, .042, -d / 2 + i * d / 3); }, 0, h * .6, 0, -.5, 0, 0); return; }
    if (st === "array") { b.box(w * .3, .2, w * .3, "body"); b.cyl(.04, .05, h * .8, "body", 0, .2, 0, 8); for (let i = 0; i < 4; i++) b.part(() => { b.box(w * .7, .02, .02, "body"); for (let k = 0; k < 5; k++) b.box(.02, .15, .02, "body", -w * .3 + k * w * .15, 0); }, 0, h * (.45 + i * .14), 0, 0, i * .4, 0); b.sph(.04, lit(b) ? "glowred" : "pgrey", 0, h, 0, 1, 8); return; }
    if (st === "meteor") { const r = Math.min(w, d) / 2; b.sph(r, "body", 0, r * .7, 0, .8, 9); for (let i = 0; i < 8; i++) b.sph(r * (.2 + b.r() * .2), "body", (b.r() - .5) * r * 1.4, r * .4 + b.r() * r * .6, (b.r() - .5) * r * 1.4, .8, 6); for (let i = 0; i < 5; i++) b.sph(r * .08, pick(b, ["crystal", "glowcyan", "iron"]), (b.r() - .5) * r, r * 1.2, (b.r() - .5) * r, 1, 5); const pts = []; for (let i = 0; i < 14; i++) { const a = i * TAU / 14; pts.push([Math.cos(a) * w * .7, Math.sin(a) * d * .7]); } b.slab(pts, .02, "scorch" in (p.m || {}) ? "scorch" : "coal"); return; }
    if (st === "samples") { b.rbox(w, h * .35, d, .03, "body"); b.box(w - .04, .02, d - .04, "foam", 0, h * .35); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { b.cyl(.05, .05, h * .5, "glass", -w * .3 + i * w * .3, h * .35, -d * .2 + j * d * .4, 12); b.cyl(.045, .045, h * .25, pick(b, ["regolith", "marsrock", "crystal", "slime"]), -w * .3 + i * w * .3, h * .35, -d * .2 + j * d * .4, 12); b.cyl(.052, .052, .03, "pgrey", -w * .3 + i * w * .3, h * .85, -d * .2 + j * d * .4, 12); } return; }
    if (st === "dome") { b.cyl(w / 2, w / 2, .15, "body", 0, 0, 0, 24); b.sph(w / 2 - .05, "glass", 0, .15, 0, h / w * 2, 20); for (let i = 0; i < 6; i++) b.part(() => b.tor(w / 2 - .05, .02, "body", 0, 0, 0, 0, 0, PI), 0, .15, 0, 0, i * PI / 6, 0); for (let i = 0; i < 9; i++) b.cone(.1 + b.r() * .1, .3 + b.r() * .3, "leaf", (b.r() - .5) * w * .6, .15, (b.r() - .5) * w * .6, 6); return; }
    if (st === "processor") { b.cyl(w / 2, w / 2, h * .6, "body", 0, 0, 0, 18); b.cyl(w * .3, w * .4, h * .35, "body", 0, h * .6, 0, 18); for (let i = 0; i < 4; i++) { const a = i * TAU / 4; b.cyl(.12, .12, h * .9, "pipe" in (p.m || {}) ? "pipe" : "steel", Math.cos(a) * w * .55, 0, Math.sin(a) * w * .55, 10); b.sph(.12, "pipe" in (p.m || {}) ? "pipe" : "steel", Math.cos(a) * w * .55, h * .9, Math.sin(a) * w * .55, 1, 8); } b.cyl(w * .2, w * .2, .2, lit(b) ? "glowamber" : "pgrey", 0, h * .95, 0, 14); for (let i = 0; i < 3; i++) b.sph(.25 + i * .1, "steam" in (p.m || {}) ? "steam" : "frosted", 0, h * 1.05 + i * .25, 0, .7, 8); return; }
    if (st === "habitat") { b.part(() => { b.cyl(h / 2, h / 2, d, "body", 0, 0, 0, 20, 0, 0); for (let i = 0; i < 4; i++) b.tor(h / 2 + .01, .03, "rib" in (p.m || {}) ? "rib" : "gunmetal", 0, -d * .4 + i * d * .27, 0, 0); for (const s of [-1, 1]) b.sph(h / 2, "body", 0, s * d / 2, 0, .35, 18); b.cyl(.12, .12, .02, "glass", h / 2, 0, 0, 12, 0, H); }, 0, h / 2 + .2, 0, H, 0, 0); for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(.1, .3, .1, "body", s * h * .35, 0, t * d * .35); b.box(.6, 1.2, .1, "door" in (p.m || {}) ? "door" : "hazard", 0, .3, d / 2 + h * .1); return; }
    if (st === "pad") { b.cyl(w / 2, w / 2, .15, "body", 0, 0, 0, 24); b.cyl(w / 2 - .2, w / 2 - .2, .005, "pgrey", 0, .15, 0, 24); b.tor(w * .3, .04, "hazard", 0, .155, 0); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; b.box(.12, .03, .12, lit(b) ? "glowamber" : "pgrey", Math.cos(a) * (w / 2 - .1), .15, Math.sin(a) * (w / 2 - .1)); } return; }
  });

  /* ================================================================ the catalogue */
  const F = "fantasy", SF = "scifi", FU = "futuristic", CY = "cyberpunk", MO = "modern", MI = "military", HO = "horror", PA = "postapoc";
  const FUT = [SF, FU], FUTC = [SF, FU, CY];
  const SS = "Sci-fi & space";
  M.add(SS, "Doors & corridors", FUT, [
    ["door-slide", "Sliding door", "xsfdoor", { w: 1.6, d: .35, h: 2.5, style: "slide", m: { body: "hullgrey", door: "hullwhite" } }, { tags: ["door", "automatic"] }],
    ["door-slide-open", "Sliding door, open", "xsfdoor", { w: 1.6, d: .35, h: 2.5, style: "slide", open: true, m: { body: "hullgrey", door: "hullwhite" } }, { tags: ["door", "automatic"] }],
    ["door-blast", "Blast door", "xsfdoor", { w: 2.4, d: .6, h: 2.6, style: "blast", m: { body: "gunmetal", door: "hullgrey" } }, { g: [SF, FU, MI], tags: ["door", "heavy", "vault"] }],
    ["door-blast-open", "Blast door, raised", "xsfdoor", { w: 2.4, d: .6, h: 2.6, style: "blast", open: true, m: { body: "gunmetal", door: "hullgrey" } }, { g: [SF, FU, MI], tags: ["door", "heavy"] }],
    ["hatch-iris", "Iris hatch", "xsfdoor", { w: 1.3, d: 1.3, h: .1, style: "iris", m: { body: "gunmetal", door: "hullgrey" } }, { tags: ["hatch", "floor"] }],
    ["hatch-iris-open", "Iris hatch, open", "xsfdoor", { w: 1.3, d: 1.3, h: .1, style: "iris", open: true, m: { body: "gunmetal", door: "hullgrey" } }, { tags: ["hatch", "floor"] }],
    ["lift-doors", "Lift doors", "xsfdoor", { w: 1.8, d: .4, h: 2.5, style: "lift", m: { body: "hullgrey", door: "steel" } }, { g: [SF, FU, CY, MO], tags: ["elevator", "lift"] }],
    ["corridor-section", "Corridor section", "xsfdoor", { w: 2.6, d: 3, h: 2.6, style: "corridor", m: { body: "hullwhite", floor: "gunmetal", rib: "gunmetal" } }, { tags: ["corridor", "modular", "ship"] }],
    ["corridor-frame", "Bulkhead frame", "xsfdoor", { w: 2.4, d: .5, h: 2.6, style: "frame", m: { body: "hullgrey" } }, { tags: ["frame", "modular", "ship"] }],
    ["hatch-floor", "Floor hatch", "xhatch", { w: .9, d: .9, h: .05, style: "floor", m: { body: "gunmetal" } }, { g: [SF, FU, MI, MO, PA], tags: ["hatch", "access"] }],
    ["hatch-floor-open", "Floor hatch, open", "xhatch", { w: .9, d: .9, h: .05, style: "floor", open: true, m: { body: "gunmetal" } }, { g: [SF, FU, MI, MO, PA], tags: ["hatch", "access"] }],
    ["vent-grille", "Vent grille", "xhatch", { w: .7, d: .1, h: .5, style: "vent", m: { body: "hullgrey" } }, { mount: "wall", g: [SF, FU, MO, CY, HO], tags: ["vent", "crawlspace"] }],
    ["vent-grille-open", "Vent grille, kicked open", "xhatch", { w: .7, d: .1, h: .5, style: "vent", open: true, m: { body: "hullgrey" } }, { mount: "wall", g: [SF, FU, MO, CY, HO], tags: ["vent", "escape"] }],
    ["maint-panel", "Maintenance panel", "xhatch", { w: .6, d: .1, h: .8, style: "panel", m: { body: "hullgrey" } }, { mount: "wall", tags: ["panel", "wiring"] }],
    ["maint-panel-open", "Maintenance panel, open", "xhatch", { w: .6, d: .1, h: .8, style: "panel", open: true, m: { body: "hullgrey" } }, { mount: "wall", tags: ["panel", "wiring", "hacked"] }]
  ]);
  M.add(SS, "Seats & stations", FUT, [
    ["seat-crew", "Crew seat with harness", "xsfseat", { w: .6, d: .6, h: 1.2, style: "crew", m: { body: "gunmetal", seat: "carbon", strap: "pred" } }, { tags: ["seat", "harness"] }],
    ["seat-row", "Row of jump seats", "xsfseat", { w: 2.4, d: .55, h: 1.2, style: "row", m: { body: "gunmetal", seat: "carbon", strap: "pyellow" } }, { g: [SF, FU, MI], tags: ["seats", "dropship"] }],
    ["seat-command", "Command chair", "xsfseat", { w: .8, d: .8, h: 1.3, style: "command", m: { body: "hullgrey", seat: "leatherblack" } }, { tags: ["captain", "bridge"] }],
    ["seat-pilot", "Pilot's seat and controls", "xsfseat", { w: .7, d: .7, h: 1.2, style: "pilot", m: { body: "hullgrey", seat: "carbon", strap: "pred" } }, { tags: ["pilot", "cockpit"] }],
    ["console-cockpit", "Cockpit dashboard", "xsfconsole", { w: 2.4, d: 1.2, h: 1.2, style: "cockpit", m: { body: "hullgrey" } }, { tags: ["cockpit", "windows", "flight"] }],
    ["console-comms", "Comms rack", "xsfconsole", { w: .9, d: .5, h: 1.8, style: "comms", m: { body: "gunmetal" } }, { g: [SF, FU, MI, MO], tags: ["radio", "communication"] }],
    ["console-pillar", "Control pillar", "xsfconsole", { w: .6, d: .6, h: 1.2, style: "pillar", m: { body: "hullwhite" } }, { tags: ["control", "terminal"] }],
    ["scanner-arch", "Security scanner arch", "xsfconsole", { w: 1.2, d: .6, h: 2.3, style: "arch", m: { body: "hullgrey" } }, { g: [SF, FU, CY, MO], tags: ["security", "checkpoint", "scanner"] }],
    ["console-starmap", "Star-map table", "xsfconsole", { w: 1.6, d: 1, h: 1, style: "map", m: { body: "gunmetal" } }, { tags: ["navigation", "hologram"] }]
  ]);
  M.add(SS, "Power", FUT, [
    ["power-cell", "Power cell", "xsfpower", { w: .45, d: .45, h: .9, style: "cell", m: { body: "gunmetal" } }, { tags: ["battery", "energy", "plasma"] }],
    ["battery-rack", "Battery rack", "xsfpower", { w: 1.4, d: .5, h: 1.6, style: "rack", m: { body: "gunmetal", battery: "pblue" } }, { g: [SF, FU, MO, MI], tags: ["battery", "storage"] }],
    ["charge-dock", "Robot charging dock", "xsfpower", { w: 1, d: 1, h: 1.6, style: "dock", m: { body: "hullgrey" } }, { tags: ["robot", "charging"] }],
    ["capacitor-bank", "Capacitor bank", "xsfpower", { w: 1.6, d: .5, h: 1.4, style: "capacitor", m: { body: "gunmetal" } }, { g: [SF, FU, CY, MO], tags: ["power", "electric"] }],
    ["power-junction", "Power junction", "xsfpower", { w: .8, d: .4, h: 1, style: "junction", m: { body: "gunmetal", conduit: "hazard" } }, { g: [SF, FU, CY, MO, MI], tags: ["power", "cables"] }],
    ["plasma-conduit", "Plasma conduit", "xsfpower", { w: 3, d: .5, h: .3, style: "conduit", m: { body: "hullgrey", glow: "plasma" } }, { tags: ["power", "floor", "modular"] }]
  ]);
  M.add(SS, "Medbay", FUT, [
    ["medbed-scifi", "Medbay bed", "xsfmed", { w: .9, d: 2.1, h: 1.3, style: "bed", m: { body: "hullwhite", pad: "foam" } }, { tags: ["medical", "bed", "hospital"] }],
    ["surgeon-robot", "Surgical robot arms", "xsfmed", { w: 1.2, d: 1.2, h: 2.6, style: "surgeon", m: { body: "hullwhite" } }, { mount: "ceiling", tags: ["medical", "surgery", "robot"] }],
    ["diag-scanner", "Diagnostic scanner", "xsfmed", { w: 1.1, d: 2.1, h: 1.4, style: "scanner", m: { body: "hullwhite", pad: "foam" } }, { g: [SF, FU, MO], tags: ["medical", "scanner", "mri"] }],
    ["stasis-pod", "Stasis capsule", "xsfmed", { w: .9, d: 2.2, h: 1.1, style: "stasis", m: { body: "hullgrey" } }, { tags: ["medical", "sleep", "cryo"] }],
    ["decon-stall", "Decontamination stall", "xsfmed", { w: 1.2, d: 1.2, h: 2.4, style: "decon", m: { body: "hullwhite", grate: "pblack" } }, { g: [SF, FU, MO, HO], tags: ["quarantine", "shower", "decontamination"] }],
    ["sample-freezer", "Sample freezer", "xsfmed", { w: .8, d: .7, h: 1.9, style: "freezer", m: { body: "hullwhite" } }, { g: [SF, FU, MO, HO], tags: ["samples", "cold", "lab"] }],
    ["med-cart", "Medical cart", "xsfmed", { w: .7, d: .5, h: .95, style: "cart", m: { body: "hullwhite" } }, { g: [SF, FU, MO], tags: ["medical", "instruments"] }]
  ]);
  M.add(SS, "Security", FUTC, [
    ["cam-security", "Security camera", "xsfsec", { w: .2, d: .4, h: .3, style: "camera", m: { body: "pgrey", housing: "pwhite" } }, { mount: "wall", g: [SF, FU, CY, MO, MI], tags: ["camera", "surveillance", "cctv"] }],
    ["turret-ceiling", "Ceiling turret", "xsfsec", { w: .7, d: .7, h: .9, style: "turret", m: { body: "gunmetal" } }, { mount: "ceiling", tags: ["turret", "defence", "gun"] }],
    ["laser-grid", "Laser grid", "xsfsec", { w: 2, d: .2, h: 1.6, style: "laser", m: { body: "gunmetal" } }, { g: [SF, FU, CY, MO], tags: ["lasers", "heist", "alarm"] }],
    ["id-scanner", "ID scanner post", "xsfsec", { w: .35, d: .3, h: 1.2, style: "idscan", m: { body: "hullgrey" } }, { g: [SF, FU, CY, MO], tags: ["access", "keycard", "biometric"] }],
    ["forcefield-gate", "Force-field gate", "xsfsec", { w: 2.2, d: .4, h: 2.4, style: "forcefield", m: { body: "gunmetal" } }, { tags: ["gate", "barrier", "prison"] }],
    ["armory-locker", "Weapons locker", "xsfsec", { w: 1.4, d: .5, h: 1.9, style: "armory", m: { body: "gunmetal" } }, { g: [SF, FU, CY, MI], tags: ["weapons", "rifles", "armoury"] }]
  ]);
  M.add(SS, "Quarters & galley", FUT, [
    ["bunk-wall", "Wall bunks", "xsfliving", { w: 2.1, d: .9, h: 1.9, style: "bunk", m: { body: "hullwhite", pad: "foam", curtain: "grey" } }, { tags: ["bed", "crew", "sleep"] }],
    ["mess-table", "Mess table with benches", "xsfliving", { w: 1.8, d: .8, h: .8, style: "mess", m: { body: "hullgrey", seat: "carbon" } }, { tags: ["table", "galley", "canteen"] }],
    ["food-dispenser", "Food dispenser", "xsfliving", { w: .8, d: .5, h: 1.8, style: "dispenser", m: { body: "hullwhite" } }, { g: [SF, FU, CY], tags: ["food", "galley"] }],
    ["treadmill", "Treadmill", "xsfliving", { w: .9, d: 1.8, h: 1.4, style: "treadmill", m: { body: "hullgrey" } }, { g: [SF, FU, MO, CY], tags: ["gym", "exercise"] }],
    ["hydro-rack", "Hydroponics rack", "xsfliving", { w: 1.6, d: .6, h: 1.9, style: "hydro", m: { body: "hullwhite", soil: "earth" } }, { g: [SF, FU, CY, MO, PA], tags: ["plants", "food", "garden"] }],
    ["water-recycler", "Water recycler", "xsfliving", { w: .8, d: .8, h: 1.6, style: "recycler", m: { body: "hullgrey", water: "glassblue" } }, { g: [SF, FU, PA], tags: ["water", "life support"] }]
  ]);
  M.add(SS, "Engines & engineering", FUT, [
    ["thruster", "Thruster", "xsfengine", { w: 1.8, d: 2.4, h: 1.8, style: "thruster", m: { body: "gunmetal" } }, { tags: ["engine", "exhaust"] }],
    ["drive-core", "Drive core", "xsfengine", { w: 1.6, d: 3.2, h: 2, style: "drive", m: { body: "hullgrey", ring: "gunmetal" } }, { tags: ["engine", "warp", "core"] }],
    ["coolant-tanks", "Coolant tanks", "xsfengine", { w: 1.6, d: .8, h: 2, style: "coolant", m: { body: "hullwhite", pipe: "paintblue" } }, { g: [SF, FU, MO, PA], tags: ["tanks", "cooling"] }],
    ["eng-bench", "Engineering workbench", "xsfengine", { w: 1.8, d: .8, h: 1.8, style: "bench", m: { body: "gunmetal" } }, { g: [SF, FU, CY], tags: ["workbench", "tools", "repair"] }],
    ["cable-spool", "Cable spool", "xsfengine", { w: .9, d: .7, h: .9, style: "spool", m: { body: "pine", cable: "pblack" } }, { g: [SF, FU, MO, MI, PA, CY], e: "both", tags: ["cable", "construction"] }]
  ]);
  M.add(SS, "Damage & emergency", [SF, FU, CY, HO, PA], [
    ["panel-sparking", "Sparking panel", "xsfdamage", { w: .8, d: .4, h: 1.2, style: "sparks", m: { body: "hullgrey" } }, { mount: "wall", k: ["damaged", "burned"], tags: ["broken", "electric", "sparks"] }],
    ["pipe-leaking", "Leaking pipe", "xsfdamage", { w: 1.6, d: 1.2, h: 1.6, style: "leak", m: { pipe: "steel", puddle: "slime" } }, { g: [SF, FU, MO, HO, PA, CY], tags: ["leak", "steam", "broken"] }],
    ["console-wrecked", "Wrecked console", "xsfdamage", { w: 1.6, d: 1.2, h: 1, style: "wreck", m: { body: "hullgrey" } }, { tags: ["broken", "smashed"] }],
    ["debris-scifi", "Wreckage", "xsfdamage", { w: 2, d: 2, h: .4, style: "debris", m: { body: "hullwhite" } }, { e: "both", tags: ["debris", "crash", "broken"] }],
    ["beacon-emergency", "Emergency beacon", "xsfdamage", { w: .3, d: .3, h: .6, style: "beacon", m: { body: "gunmetal" } }, { g: [SF, FU, MO, MI, PA], e: "both", tags: ["beacon", "rescue", "alarm"] }],
    ["hull-patch", "Patched hull breach", "xsfdamage", { w: 1.2, d: .2, h: 1.2, style: "patch", m: { body: "hullgrey", patch: "hazard" } }, { mount: "wall", tags: ["repair", "breach"] }]
  ]);
  M.add(SS, "Planetside", [SF, FU, PA], [
    ["rover", "Exploration rover", "xspace", { w: 2.2, d: 3, h: 1.6, style: "rover", m: { body: "paintwhite", tyre: "pblack" } }, { e: "out", tags: ["vehicle", "moon", "mars"] }],
    ["spacesuit-stand", "Spacesuit on a stand", "xspace", { w: .8, d: .6, h: 1.9, style: "suit", m: { body: "gunmetal", pack: "pwhite" } }, { tags: ["eva", "spacesuit", "airlock"] }],
    ["o2-rack", "Oxygen tank rack", "xspace", { w: 1.2, d: .4, h: 1.4, style: "o2rack", m: { body: "gunmetal", tank: "paintwhite" } }, { g: [SF, FU, MO, MI], tags: ["oxygen", "life support"] }],
    ["solar-panel", "Solar panel", "xspace", { w: 2, d: 1.2, h: 1.4, style: "solar", m: { body: "steel" } }, { e: "out", g: [SF, FU, MO, PA], tags: ["solar", "power"] }],
    ["antenna-array", "Antenna array", "xspace", { w: 1.2, d: 1.2, h: 3.6, style: "array", m: { body: "steel" } }, { e: "out", g: [SF, FU, MO, MI], tags: ["antenna", "communication"] }],
    ["meteorite", "Meteorite in its crater", "xspace", { w: 1.6, d: 1.6, h: .9, style: "meteor", m: { body: "iron", scorch: "coal" } }, { e: "out", g: [SF, FU, HO, MO, F], tags: ["rock", "space", "crater"] }],
    ["sample-case", "Sample case", "xspace", { w: .6, d: .4, h: .35, style: "samples", m: { body: "paintwhite" } }, { g: [SF, FU, MO], tags: ["samples", "science", "rocks"] }],
    ["greenhouse-dome", "Greenhouse dome", "xspace", { w: 3, d: 3, h: 2.2, style: "dome", m: { body: "hullwhite" } }, { e: "out", tags: ["greenhouse", "plants", "dome"] }],
    ["atmo-processor", "Atmosphere processor", "xspace", { w: 2.4, d: 2.4, h: 4, style: "processor", m: { body: "hullgrey", pipe: "steel" } }, { e: "out", tags: ["terraforming", "machine"] }],
    ["habitat-module", "Habitat module", "xspace", { w: 2.6, d: 5, h: 2.6, style: "habitat", m: { body: "hullwhite", rib: "gunmetal", door: "hazard" } }, { e: "out", tags: ["habitat", "base", "module"] }],
    ["landing-pad-small", "Landing beacon pad", "xspace", { w: 4, d: 4, h: .2, style: "pad", m: { body: "concrete" } }, { e: "out", tags: ["landing", "pad"] }]
  ]);

  /* ---- kits */
  M.kit({ id: "medbay", n: "Medbay", d: "Two medbay beds, the surgical arms, a diagnostic scanner, a stasis capsule, a freezer and a cart.", g: FUT,
    set: [["medbed-scifi", -1.4, 0, 0], ["medbed-scifi", 1.4, 0, 0], ["surgeon-robot", -1.4, 0, 0], ["diag-scanner", 0, -2, 90], ["stasis-pod", 2.8, -1.6, 90], ["sample-freezer", -2.6, -2, 0], ["med-cart", 0, 1.4, 0]],
    ids: ["medbed-scifi", "surgeon-robot", "diag-scanner", "stasis-pod", "sample-freezer", "med-cart"] });
  M.kit({ id: "crew-quarters", n: "Crew quarters", d: "Wall bunks, a mess table, the food dispenser, a treadmill and the water recycler.", g: FUT,
    set: [["bunk-wall", -1.5, -1.8, 0], ["bunk-wall", 1.5, -1.8, 0], ["mess-table", 0, .6, 0], ["food-dispenser", 2.6, .6, 270], ["treadmill", -2.4, 1, 0], ["water-recycler", 2.5, -.6, 0]],
    ids: ["bunk-wall", "mess-table", "food-dispenser", "treadmill", "water-recycler"] });
  M.kit({ id: "engineering", n: "Engineering deck", d: "The drive core, coolant tanks, capacitors, a power junction, a workbench and cable spools.", g: FUT,
    set: [["drive-core", 0, 0, 90], ["coolant-tanks", -2.4, -1.6, 0], ["capacitor-bank", 2.2, -1.6, 0], ["power-junction", 2.6, 0, 270], ["eng-bench", -2.4, 1.6, 180], ["cable-spool", 1.6, 1.6, 0]],
    ids: ["drive-core", "coolant-tanks", "capacitor-bank", "power-junction", "eng-bench", "cable-spool"] });
  M.kit({ id: "cockpit", n: "Cockpit", d: "The dashboard under its windows, two pilots' seats, the command chair and a star-map table.", g: FUT,
    set: [["console-cockpit", 0, -1.4, 0], ["seat-pilot", -.7, -.4, 180], ["seat-pilot", .7, -.4, 180], ["seat-command", 0, 1, 180], ["console-starmap", 0, 2.4, 0]],
    ids: ["console-cockpit", "seat-pilot", "seat-command", "console-starmap"] });
  M.kit({ id: "security-post", n: "Security post", d: "A scanner arch, an ID post, the force-field gate, cameras, a turret and the weapons locker.", g: FUTC,
    set: [["scanner-arch", 0, 0, 0], ["id-scanner", 1, .4, 0], ["forcefield-gate", 0, -2, 0], ["cam-security", -1.6, -2.2, 0], ["turret-ceiling", 1.6, -1, 0], ["armory-locker", -2, 1.2, 90]],
    ids: ["scanner-arch", "id-scanner", "forcefield-gate", "cam-security", "turret-ceiling", "armory-locker"] });
  M.kit({ id: "moonbase-yard", n: "Moon-base yard", d: "A habitat module, a rover, solar panels, an antenna array, the landing pad and a greenhouse dome.", g: [SF, FU],
    set: [["habitat-module", 0, 0, 90], ["rover", 4, 2, 30], ["solar-panel", -4, -3, 0], ["solar-panel", -4, -1.4, 0], ["antenna-array", 4, -3, 0], ["landing-pad-small", 0, 5, 0], ["greenhouse-dome", -4, 3, 0]],
    ids: ["habitat-module", "rover", "solar-panel", "antenna-array", "landing-pad-small", "greenhouse-dome"] });
})(ATLAS);
