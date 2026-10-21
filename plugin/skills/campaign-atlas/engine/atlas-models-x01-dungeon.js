/* More models, part x01: dungeons, caves, crypts and ruins. Traps and the mechanisms that spring or open them,
   the furniture of captivity, catacombs, caves (their formations, pools of water, lava and poison), and ruins. Added
   for the user's asset expansion (21 Oct 2026), none of them a copy of a model the library had: every kind here was
   missing (dev/asset-inventory.txt). Same rules as atlas-models-lib.js: metres, standing on y = 0, front to +z. */
(function (A) {
  "use strict";
  const M = A.models; if (!M) return;
  const G = M.gen, PI = Math.PI, H = PI / 2, TAU = PI * 2;
  const pick = (b, l) => l[(b.r() * l.length) | 0];
  Object.assign(M.MATS, { lava: ["glow", 0xff6a1a, .5, 0, "", 0xff3a00], lavacrust: ["stone", 0x2a1c16, .95, 0, "stone"], poison: ["glow", 0x7adf3a, .2, 0, "", 0x3a8a10, .85], darkwater: ["glass", 0x1e3a44, .05, 0, "", 0, .8], cavestone: ["stone", 0x6b6258, .95, 0, "stone"], flowstone: ["stone", 0xb8a888, .6, 0, "marble"], rope: ["fabric", 0xb8975e, 1, 0, "burlap"], web: ["glass", 0xf0f0f0, .9, 0, "", 0, .35] });

  /* ---- traps */
  G("xtrap", (b, p) => {
    const { w, d, h } = p, st = p.style || "plate", sprung = !!p.sprung;
    if (st === "plate") { b.box(w, .03, d, "base"); b.box(w * .86, sprung ? .005 : .04, d * .86, "body", 0, .03); for (let i = 0; i < 4; i++) b.box(w * .05, .006, d * .3, "base", (i - 1.5) * w * .22, .07, 0, 0, b.r() * .4, 0); return; }
    if (st === "spikes") { b.box(w, .05, d, "base"); const n = Math.max(3, Math.round(w / .16)), m = Math.max(3, Math.round(d / .16)); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const x = -w / 2 + (i + .5) * w / n, z = -d / 2 + (j + .5) * d / m; b.box(.05, .002, .05, "hole", x, .05, z); if (sprung) b.cone(.025, h * (.75 + b.r() * .25), "body", x, .05, z, 6); } return; }
    if (st === "pit") { b.box(w, .03, d, "base"); b.box(w * .9, .002, d * .9, "hole", 0, .03); for (let i = 0; i < 9; i++) b.cone(.03, .22 + b.r() * .15, "body", (b.r() - .5) * w * .75, .032, (b.r() - .5) * d * .75, 6); for (const s of [-1, 1]) b.box(w, .06, .08, "base", 0, 0, s * (d / 2 - .04)); return; }
    if (st === "beartrap") { b.cyl(w * .4, w * .4, .015, "body", 0, 0, 0, 20); b.box(w * .9, .015, .06, "body", 0, .015); for (const s of [-1, 1]) b.part(() => { b.tor(w * .38, .012, "body", 0, 0, 0, 0, 0, PI); for (let i = 0; i < 9; i++) { const a = PI * (i + .5) / 9; b.cone(.012, .05, "body", Math.cos(a) * w * .38, Math.sin(a) * w * .38 - .05, 0, 4); } }, 0, .02, 0, sprung ? s * .1 : s * 1.45, 0, 0); b.tube([[w * .4, .01, 0], [w * .6, .01, .1], [w * .7, .01, .3]], .006, "chain"); return; }
    if (st === "blade") { b.box(w, .12, .25, "base", 0, h - .12); b.box(.08, .2, .08, "body", 0, h - .32); b.part(() => { b.box(.03, h * .6, .03, "body", 0, -h * .6); b.ext([[-w * .35, 0], [w * .35, 0], [w * .25, -.12], [0, -.2], [-w * .25, -.12]], .02, "blade", 0, -h * .62); }, 0, h - .32, 0, 0, 0, sprung ? .5 : 0); return; }
    if (st === "darts") { b.box(w, h, .08, "base", 0, 0, -d / 2 + .04); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.cyl(.015, .015, .02, "hole", -w * .3 + i * w * .2, h * (.3 + j * .2), -d / 2 + .08, 8, H); b.box(w * .6, .03, .03, "trigger" in (p.m || {}) ? "trigger" : "body", 0, .02, d / 2 - .1); return; }
    if (st === "flame") { b.box(w, .04, d, "base"); b.cyl(w * .3, w * .3, .02, "body", 0, .04, 0, 16); for (let i = 0; i < 5; i++) b.box(w * .5, .01, .02, "hole", 0, .061, -w * .2 + i * w * .1); if (sprung) for (let i = 0; i < 3; i++) b.cone(w * (.22 - i * .05), h * (.8 + i * .2), "fire", (b.r() - .5) * .05, .06, (b.r() - .5) * .05, 8); return; }
    if (st === "net") { b.box(w, .06, .06, "base", 0, h - .06); const n = 6; for (let i = 0; i <= n; i++) { b.tube([[-w / 2 + i * w / n, h - .06, 0], [-w / 2 + i * w / n, h * .55, .15], [-w / 2 + i * w / n * .9 + w * .05, h * .2, .05]], .008, "rope"); } for (let j = 1; j < 4; j++) b.box(w * (1 - j * .05), .012, .012, "rope", 0, h - .06 - j * h * .18, j * .04); return; }
    if (st === "log") { b.box(w, .1, .2, "base", 0, h - .1); for (const s of [-1, 1]) b.tube([[s * w * .35, h - .1, 0], [s * w * .35, h * .55, 0]], .01, "rope"); b.part(() => { b.cyl(.2, .2, w * .8, "body", 0, 0, 0, 12, 0, H); for (let i = 0; i < 6; i++) b.cone(.03, .18, "spike" in (p.m || {}) ? "spike" : "iron", -w * .3 + i * w * .12, 0, .2, 6, H); }, 0, h * .5, 0); return; }
  }, [["sprung", "Sprung", 0, 1, 1]]);

  /* ---- what opens, springs or turns */
  G("xmech", (b, p) => {
    const { w, d, h } = p, st = p.style || "lever", on = !!p.on;
    if (st === "lever") { b.rbox(w, h, .06, .02, "base", 0, 0, -d / 2 + .03); b.box(w * .3, .04, .08, "body", 0, h / 2 - .02, -d / 2 + .1); b.part(() => { b.cyl(.018, .018, h * .55, "body", 0, 0, 0, 8); b.sph(.035, "knob" in (p.m || {}) ? "knob" : "body", 0, h * .55, 0, 1, 10); }, 0, h / 2, -d / 2 + .1, on ? .9 : -.9, 0, 0); return; }
    if (st === "floorlever") { b.box(w, .12, d, "base"); b.box(w * .2, .12, d * .8, "slot" in (p.m || {}) ? "slot" : "hole", 0, .005); b.part(() => { b.cyl(.025, .03, h, "body", 0, 0, 0, 8); b.cyl(.04, .04, .14, "grip" in (p.m || {}) ? "grip" : "leather", 0, h - .08, 0, 10); }, 0, .1, 0, on ? .6 : -.6, 0, 0); return; }
    if (st === "wheel") { b.box(w * .3, h * .3, .1, "base", 0, h * .35, -d / 2 + .05); b.part(() => { b.tor(w * .45, .025, "body", 0, 0, 0, 0); for (let i = 0; i < 6; i++) b.part(() => b.box(w * .88, .025, .025, "body"), 0, 0, 0, 0, 0, i * PI / 6); b.cyl(.05, .05, .1, "body", 0, 0, 0, 12, H); }, 0, h * .5, -d / 2 + .16); return; }
    if (st === "button") { b.box(w, h, .12, "base", 0, 0, -d / 2 + .06); b.part(() => { b.cyl(w * .25, w * .25, on ? .02 : .06, "body", 0, 0, 0, 16, H); }, 0, h * .5, -d / 2 + .12); for (let i = 0; i < 6; i++) b.box(.012, .06, .005, "rune" in (p.m || {}) ? "rune" : "base", Math.cos(i * TAU / 6) * w * .36, h * .5 + Math.sin(i * TAU / 6) * w * .36 - .03, -d / 2 + .123); return; }
    if (st === "winch") { for (const s of [-1, 1]) b.box(.1, h, d, "base", s * (w / 2 - .05)); b.cyl(h * .25, h * .25, w - .2, "drum" in (p.m || {}) ? "drum" : "body", 0, h * .6, 0, 16, 0, H); b.cyl(h * .27, h * .27, w - .2, "rope", 0, h * .6, 0, 16, 0, H).scale.set(.98, 1, .98); for (const s of [-1, 1]) b.part(() => { b.box(.04, h * .4, .04, "iron", 0, -h * .2); b.cyl(.025, .025, .2, "iron", .1, -h * .4, 0, 8, 0, H); }, s * (w / 2 + .02), h * .6, 0, on ? 1.2 : 0, 0, 0); b.tube([[0, h * .6 + h * .26, 0], [0, h * 1.6, -d * .2]], .015, "rope"); return; }
    if (st === "chainpull") { b.box(w, .08, .1, "base", 0, h - .08, -d / 2 + .05); const n = Math.round(h * 9); for (let i = 0; i < n; i++) b.tor(.025, .007, "chain", 0, h - .1 - i * .06, -d / 2 + .12, i % 2 ? 0 : H, H); b.part(() => b.tor(.06, .014, "body", 0, 0, 0, 0, 0), 0, h - .14 - n * .06, -d / 2 + .12); return; }
    if (st === "keyhole") { b.rbox(w, h, .08, .02, "base", 0, 0, -d / 2 + .04); b.cyl(w * .3, w * .3, .02, "body", 0, h * .55, -d / 2 + .085, 18, H); b.box(.03, .08, .01, "hole", 0, h * .5, -d / 2 + .1); b.cyl(.025, .025, .01, "hole", 0, h * .58, -d / 2 + .1, 10, H); return; }
  }, [["on", "Pulled, pressed or turned", 0, 1, 1]]);

  /* ---- captivity and cruelty */
  G("xchains", (b, p) => {
    const { w, h } = p, st = p.style || "manacles";
    const chain = (x0, y0, z0, x1, y1, z1) => { const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.max(2, Math.round(len / .05)); for (let i = 0; i < n; i++) { const t = i / n, sag = Math.sin(t * PI) * .06; b.tor(.022, .006, "chain", x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - sag, z0 + (z1 - z0) * t, i % 2 ? 0 : H, i % 2 ? H : 0); } };
    if (st === "manacles") { for (const s of [-1, 1]) { b.box(.08, .08, .04, "body", s * w * .35, h - .1, -.02); b.tor(.03, .008, "body", s * w * .35, h - .12, .01, 0); chain(s * w * .35, h - .15, .02, s * w * .3, h * .55, .08); b.tor(.045, .014, "body", s * w * .3, h * .5, .08, H * .8); } return; }
    if (st === "floor") { b.cyl(.08, .1, .04, "body", 0, 0, 0, 10); b.tor(.05, .012, "body", 0, .06, 0, 0); chain(0, .05, 0, w * .3, .02, w * .2); chain(w * .3, .02, w * .2, w * .45, .02, -w * .1); for (const s of [-1, 1]) b.tor(.045, .014, "body", w * .45 + s * .04, .015, -w * .1, H); return; }
    if (st === "skeleton") {
      for (const s of [-1, 1]) { b.box(.08, .08, .04, "body", s * w * .3, h * .9, -.08); chain(s * w * .3, h * .88, -.05, s * w * .25, h * .62, .02); }
      // a skeleton slumped against the wall, its arms held up by the chains
      b.box(.24, .05, .14, "bone", 0, .05, .02); b.sph(.1, "bone", 0, h * .66, .04, 1.1, 10); for (let i = 0; i < 5; i++) b.tor(.08 - i * .006, .01, "bone", 0, h * .58 - i * .045, .04, H); b.cyl(.015, .015, h * .25, "bone", 0, h * .3, -.02, 6);
      for (const s of [-1, 1]) { b.tube([[s * .1, h * .6, .04], [s * w * .2, h * .66, .04], [s * w * .25, h * .62, .03]], .014, "bone"); b.tube([[s * .07, .08, .05], [s * .12, .1, .3], [s * .1, .03, .45]], .018, "bone"); }
      return;
    }
    if (st === "hook") { b.box(.06, .06, .3, "body", 0, h - .06, -.12); chain(0, h - .08, .02, 0, h * .55, .02); b.tube([[0, h * .55, .02], [0, h * .45, .02], [.05, h * .4, .02], [.07, h * .45, .02]], .012, "body"); return; }
  });
  G("xtorture", (b, p) => {
    const { w, d, h } = p, st = p.style || "rack";
    if (st === "rack") { for (const s of [-1, 1]) b.box(.1, .12, d, "body", s * (w / 2 - .05), h - .12); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.1, h - .12, .1, "body", sx * (w / 2 - .05), 0, sz * (d / 2 - .05)); for (let i = 0; i < 4; i++) b.box(w - .2, .04, .12, "body", 0, h - .1, -d / 2 + .3 + i * (d - .6) / 3); for (const s of [-1, 1]) { b.cyl(.06, .06, w - .1, "body", 0, h - .02, s * (d / 2 - .1), 10, 0, H); b.part(() => { for (let i = 0; i < 4; i++) b.box(.04, .3, .04, "body", 0, 0, 0, i * PI / 4); }, w / 2 + .03, h - .02, s * (d / 2 - .1), 0, 0, 0); b.tube([[-.1, h, s * (d / 2 - .1)], [-.05, h + .02, s * (d / 2 - .3)], [.05, h + .01, s * (d / 2 - .45)]], .015, "rope"); } return; }
    if (st === "wheel") { b.box(.2, h * .5, .2, "body", 0, 0, 0); b.part(() => { b.tor(w * .45, .05, "body", 0, 0, 0, 0); for (let i = 0; i < 8; i++) b.part(() => b.box(w * .88, .05, .05, "body"), 0, 0, 0, 0, 0, i * PI / 8); b.cyl(.1, .1, .2, "iron", 0, 0, 0, 12, H); }, 0, h * .5, 0, H, 0, 0); return; }
    if (st === "guillotine") { for (const s of [-1, 1]) b.box(.12, h, .12, "body", s * w * .3, 0, 0); b.box(w * .75, .14, .14, "body", 0, h - .14); b.ext([[-w * .26, 0], [w * .26, .12], [w * .26, .35], [-w * .26, .35]], .03, "blade", 0, h * .62); b.box(w * .7, .25, .2, "body", 0, .3, 0); b.cyl(.08, .08, .21, "hole", 0, .55, 0, 12, H); b.box(.5, .1, d * .8, "body", 0, .25, d * .35); b.cyl(.15, .14, .25, "basket" in (p.m || {}) ? "basket" : "rope", 0, 0, -d * .35, 12); return; }
    if (st === "gallows") { b.box(w, .3, d, "body"); for (let i = 0; i < 4; i++) b.box(.5, .08, .25, "body", w / 2 + .1, .05 + i * .075, -d / 2 + .2 + i * .25); b.box(.15, h, .15, "body", -w * .35, .3); b.box(w * .7, .14, .14, "body", -w * .05, h + .15); b.box(.08, .5, .08, "body", -w * .25, h - .1, 0, 0, 0, -.8); b.tube([[w * .25, h + .15, 0], [w * .25, h - .55, 0]], .015, "rope"); b.tor(.08, .015, "rope", w * .25, h - .65, 0, 0); b.box(.8, .02, .8, "hatch" in (p.m || {}) ? "hatch" : "body", w * .25, .3); return; }
    if (st === "post") { b.cyl(.12, .14, h, "body", 0, 0, 0, 10); b.tor(.06, .015, "iron", 0, h * .85, .13, 0); b.tor(.06, .015, "iron", 0, h * .3, .13, 0); b.tube([[0, h * .85, .17], [.1, h * .6, .25], [.06, h * .45, .28]], .01, "rope"); return; }
    if (st === "chair") { b.box(w, .06, d, "body", 0, .45); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.06, .45, .06, "body", sx * (w / 2 - .04), 0, sz * (d / 2 - .04)); b.box(w, h - .45, .06, "body", 0, .45, -d / 2 + .03); for (let i = 0; i < 30; i++) b.cone(.012, .04, "iron", (b.r() - .5) * w * .9, .51, (b.r() - .5) * d * .9, 4); for (let i = 0; i < 24; i++) b.cone(.012, .04, "iron", (b.r() - .5) * w * .9, .55 + b.r() * (h - .65), -d / 2 + .06, 4, H); for (const sx of [-1, 1]) b.tor(.05, .012, "iron", sx * w * .4, .58, d * .2, H); return; }
  });
  // a cell's front: bars from wall to wall, its barred door set in them, standing open or shut
  G("xcell", (b, p) => {
    const { w, h } = p, open = !!p.open, dw = Math.min(1, w * .4), n = Math.round(w / .14);
    b.box(w, .08, .08, "body", 0, h - .08); b.box(w, .06, .08, "body", 0, 0);
    for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n; if (x > w / 2 - dw - .05 && x < w / 2 - .05) continue; b.cyl(.016, .016, h - .1, "body", x, .05, 0, 8); }
    b.part(() => { b.box(.05, h - .14, .05, "body", 0, 0); b.box(.05, h - .14, .05, "body", dw - .05, 0); for (const y of [.15, h * .5, h - .25]) b.box(dw - .05, .04, .03, "body", dw / 2 - .025, y); for (let i = 1; i < 6; i++) b.cyl(.014, .014, h - .16, "body", i * (dw - .05) / 6, 0, 0, 8); b.box(.1, .14, .06, "lock" in (p.m || {}) ? "lock" : "iron", dw - .1, h * .45, 0); }, w / 2 - dw - .02, .07, 0, 0, open ? -1.6 : 0, 0);
  }, [["open", "Standing open", 0, 1, 1]]);

  /* ---- the dead below: catacombs */
  G("xcrypt", (b, p) => {
    const { w, d, h } = p, st = p.style || "niches";
    if (st === "niches") { b.box(w, h, d, "body"); const rows = Math.max(2, Math.round(h / .55)), cols = Math.max(1, Math.round(w / .9)); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = -w / 2 + (c + .5) * w / cols, y = .15 + r * (h - .2) / rows, hh = (h - .2) / rows - .12, ww = w / cols - .14; b.box(ww, hh, .04, "hole", x, y, d / 2 - .015); if (b.r() < .7) { b.box(ww * .8, .09, .02, "bone", x, y + .02, d / 2 + .01); b.sph(.075, "bone", x + ww * .3, y + .08, d / 2 - .02, 1.1, 8); } } return; }
    if (st === "ossuary") { b.box(w, h, d * .4, "body", 0, 0, -d * .3); const rows = Math.round(h / .14), cols = Math.round(w / .16); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (r % 3 === 1) { b.cyl(.025, .025, w / cols * .9, "bone", -w / 2 + (c + .5) * w / cols, .08 + r * h / rows, -d * .05, 6, 0, H); continue; } b.sph(.07, "bone", -w / 2 + (c + .5) * w / cols, .08 + r * h / rows, -d * .06, 1.05, 8); b.box(.04, .03, .01, "hole", -w / 2 + (c + .5) * w / cols - .02, .09 + r * h / rows, .004); b.box(.04, .03, .01, "hole", -w / 2 + (c + .5) * w / cols + .02, .09 + r * h / rows, .004); } return; }
    if (st === "effigy") { b.box(w, h * .7, d, "body"); b.box(w + .06, .06, d + .06, "body", 0, h * .7); b.part(() => { b.box(w * .5, .14, d * .55, "effigy" in (p.m || {}) ? "effigy" : "body", 0, 0, 0); b.sph(.12, "effigy" in (p.m || {}) ? "effigy" : "body", 0, .12, -d * .33, .8, 10); for (const s of [-1, 1]) b.box(.08, .08, .3, "effigy" in (p.m || {}) ? "effigy" : "body", s * .05, .14, -d * .05, .5, 0, 0); b.box(w * .12, .04, d * .4, "sword" in (p.m || {}) ? "sword" : "iron", 0, .15, d * .05); }, 0, h * .76, 0); for (let i = 0; i < 3; i++) b.box(w * .2, h * .4, .02, "trim" in (p.m || {}) ? "trim" : "body", -w * .3 + i * w * .3, h * .15, d / 2 + .01); return; }
    if (st === "urns") { b.box(w, .12, d, "body"); b.box(w, h, .2, "body", 0, 0, -d / 2 + .1); for (let i = 0; i < 3; i++) b.lathe([[0, 0], [.1, .02], [.14, .15], [.11, .3], [.07, .34], [.08, .38], [0, .38]], "urn" in (p.m || {}) ? "urn" : "terracotta", -w * .3 + i * w * .3, .12, 0, 14); return; }
    if (st === "bier") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, h - .08, .08, "body", sx * (w / 2 - .06), 0, sz * (d / 2 - .06)); b.box(w, .08, d, "body", 0, h - .08); b.box(w * .85, .14, d * .9, "shroud" in (p.m || {}) ? "shroud" : "linen", 0, h, 0); b.sph(.12, "shroud" in (p.m || {}) ? "shroud" : "linen", 0, h + .12, -d * .35, .7, 10); for (const s of [-1, 1]) P_candle(b, s * w * .55, 0, -d * .4); return; }
  });
  const P_candle = (b, x, y, z) => { b.cyl(.04, .05, 1.1, "iron", x, y, z, 8); b.cyl(.07, .05, .03, "iron", x, y + 1.1, z, 10); b.cyl(.03, .03, .16, "wax", x, y + 1.13, z, 8); b.cone(.012, .04, "fire", x, y + 1.29, z, 6); };

  /* ---- caves */
  G("xcave", (b, p) => {
    const { w, d, h } = p, st = p.style || "stalactites";
    const lump = (r, hh, x, y, z, down) => { const c = b.cone(r, hh, "body", x, y, z, 7); if (down) { c.rotation.x = PI; c.position.y = y + hh / 2; } return c; };
    if (st === "stalactites") { const n = Math.round(w * d * 6) + 4; for (let i = 0; i < n; i++) { const r = .05 + b.r() * .14, hh = .2 + b.r() * h; lump(r, hh, (b.r() - .5) * w, -hh, (b.r() - .5) * d, true); } b.box(w, .05, d, "body", 0, -.05); return; }
    if (st === "pillar") { b.lathe([[w * .5, 0], [w * .36, h * .2], [w * .2, h * .45], [w * .16, h * .5], [w * .22, h * .58], [w * .38, h * .85], [w * .5, h], [0, h]], "body", 0, 0, 0, 10); for (let i = 0; i < 5; i++) lump(.04 + b.r() * .06, .2 + b.r() * .4, (b.r() - .5) * w * .8, 0, (b.r() - .5) * d * .8); return; }
    if (st === "flowstone") { b.lathe([[w * .5, 0], [w * .45, h * .2], [w * .32, h * .5], [w * .2, h * .8], [w * .1, h], [0, h]], "body", 0, 0, 0, 9).scale.z = d / w; for (let i = 0; i < 6; i++) b.tor(w * (.45 - i * .05), .025, "body", 0, h * (.1 + i * .14), 0, H).scale.z = d / w; return; }
    if (st === "boulders") { for (let i = 0; i < 6; i++) { const r = .2 + b.r() * .35; b.sph(r, "body", (b.r() - .5) * (w - r), r * .6, (b.r() - .5) * (d - r), .75 + b.r() * .3, 8); } return; }
    if (st === "mouth") { const pts = []; for (let i = 0; i <= 14; i++) { const a = PI - i * PI / 14; pts.push([Math.cos(a) * w * .32 + (b.r() - .5) * .08, Math.sin(a) * h * .85 + (b.r() - .5) * .08]); } const out = [[-w / 2, 0]].concat(pts.map(([x, y]) => [x, Math.max(0, y)]), [[w / 2, 0], [w / 2, h], [-w / 2, h]]); b.ext(out, d, "body", 0, 0, 0); for (let i = 0; i < 4; i++) lump(.06 + b.r() * .05, .2 + b.r() * .3, (b.r() - .5) * w * .5, h * .55 + b.r() * h * .2, d / 2 - .1, true); return; }
    if (st === "glowworms") { b.box(w, .05, d, "body", 0, -.05); for (let i = 0; i < Math.round(w * d * 30); i++) { const x = (b.r() - .5) * w, z = (b.r() - .5) * d, len = .1 + b.r() * h; b.cyl(.002, .002, len, "web", x, -len, z, 4); b.sph(.008, "glowcyan", x, -len, z, 1, 5); } return; }
  });
  // pools: still water, lava, poison; shaped stone round them
  G("xpool", (b, p) => {
    const { w, d } = p, st = p.style || "water", rim = [];
    for (let i = 0; i < 18; i++) { const a = i * TAU / 18, k = .85 + b.r() * .15; rim.push([Math.cos(a) * w / 2 * k, Math.sin(a) * d / 2 * k]); }
    b.slab(rim, .05, "rim" in (p.m || {}) ? "rim" : "cavestone");
    b.slab(rim.map(([x, z]) => [x * .86, z * .86]), .055, "body");
    if (st === "lava") { for (let i = 0; i < 7; i++) b.slab([[0, 0], [.1 + b.r() * .2, .05], [.15, .2 + b.r() * .1], [0, .18]].map(([x, z]) => [x * w * .6, z * d * .6]), .06, "lavacrust", (b.r() - .5) * w * .5, 0, (b.r() - .5) * d * .5); for (let i = 0; i < 4; i++) b.sph(.05 + b.r() * .06, "lava", (b.r() - .5) * w * .5, .06, (b.r() - .5) * d * .5, .5, 8); }
    if (st === "poison") for (let i = 0; i < 9; i++) b.sph(.02 + b.r() * .05, "poison", (b.r() - .5) * w * .6, .06, (b.r() - .5) * d * .6, .7, 8);
    if (st === "water") for (let i = 0; i < 3; i++) b.sph(.08 + b.r() * .1, "cavestone", (b.r() - .5) * w * .5, .02, (b.r() - .5) * d * .5, .5, 7);
  });

  /* ---- ruins */
  G("xruin", (b, p) => {
    const { w, d, h } = p, st = p.style || "arch";
    if (st === "arch") { b.box(w * .22, h * .7, d, "body", -w * .39, 0); b.box(w * .22, h * .35, d, "body", w * .39, 0); const n = 7; for (let i = 0; i < 4; i++) { const a = PI - i * PI / n; b.part(() => b.box(w * .16, w * .1, d, "body"), Math.cos(a) * w * .39, h * .7 + Math.sin(a) * w * .3, 0, 0, 0, a - H); } for (let i = 0; i < 5; i++) b.box(.15 + b.r() * .2, .1 + b.r() * .12, .15 + b.r() * .2, "body", w * .3 + (b.r() - .5) * .6, 0, d / 2 + .2 + b.r() * .4, 0, b.r() * 2, 0); return; }
    if (st === "drums") { for (let i = 0; i < 3; i++) b.cyl(w * .32, w * .32, w * .55, "body", -w * .35 + i * w * .38 + (b.r() - .5) * .1, w * .32, (b.r() - .5) * d * .3, 16, 0, H + (b.r() - .5) * .4); b.box(w * .75, w * .2, w * .75, "body", w * .3, 0, -d * .3, 0, .3, 0); return; }
    if (st === "head") { b.sph(w * .4, "body", 0, w * .25, 0, 1.1, 14); b.box(w * .5, w * .1, w * .2, "body", 0, w * .35, w * .3); b.box(w * .12, w * .16, w * .1, "body", 0, w * .2, w * .4); b.cyl(w * .45, w * .5, w * .08, "dirt" in (p.m || {}) ? "dirt" : "earth", 0, 0, 0, 16); for (let i = 0; i < 3; i++) b.box(.2, .02, .2, "moss", (b.r() - .5) * w * .6, w * .6 + b.r() * .1, (b.r() - .5) * w * .3); return; }
    if (st === "toppled") { b.part(() => { b.box(w * .3, w * .9, w * .3, "body", 0, 0, 0); b.sph(w * .16, "body", 0, w * 1.02, 0, 1.1, 10); for (const s of [-1, 1]) b.box(w * .12, w * .45, w * .12, "body", s * w * .2, w * .4, 0, 0, 0, s * .2); }, 0, w * .15, 0, H, .4, 0); b.box(w * .5, w * .3, w * .5, "body", -w * .7, 0, 0); return; }
    if (st === "steps") { for (let i = 0; i < 5; i++) { const ww = w * (1 - (b.r() < .4 ? b.r() * .5 : 0)); b.box(ww, h / 5, d * (1 - i / 5), "body", (w - ww) / 2 * (b.r() < .5 ? -1 : 1), i * h / 5, -d * i / 10); } for (let i = 0; i < 4; i++) b.box(.15 + b.r() * .15, .08, .15, "body", (b.r() - .5) * w, 0, d / 2 + .1 + b.r() * .3, 0, b.r() * 2, 0); return; }
    if (st === "overgrown") { b.cyl(w * .35, w * .38, h, "body", 0, 0, 0, 14); for (let i = 0; i < 7; i++) { const a = b.r() * TAU; b.tube([[Math.cos(a) * w * .38, 0, Math.sin(a) * w * .38], [Math.cos(a + .6) * w * .4, h * .4, Math.sin(a + .6) * w * .4], [Math.cos(a + 1.3) * w * .39, h * .8, Math.sin(a + 1.3) * w * .39]], .015, "vine" in (p.m || {}) ? "vine" : "leaf"); } for (let i = 0; i < 10; i++) b.sph(.06 + b.r() * .05, "leaf", (b.r() - .5) * w * .8, b.r() * h, (b.r() - .5) * w * .8, .6, 6); return; }
    if (st === "collapse") { for (let i = 0; i < 6; i++) b.box(.5 + b.r() * .7, .06 + b.r() * .08, .3 + b.r() * .4, "body", (b.r() - .5) * w * .6, b.r() * .3, (b.r() - .5) * d * .6, (b.r() - .5) * .8, b.r() * 3, (b.r() - .5) * .8); for (let i = 0; i < 3; i++) b.box(.12, .12, 1.2 + b.r(), "beam" in (p.m || {}) ? "beam" : "oak", (b.r() - .5) * w * .5, .1 + b.r() * .4, (b.r() - .5) * d * .4, (b.r() - .5) * .6, b.r() * 3, .3); for (let i = 0; i < 20; i++) b.box(.08 + b.r() * .12, .06, .08 + b.r() * .1, "body", (b.r() - .5) * w, 0, (b.r() - .5) * d, 0, b.r() * 3, 0); return; }
  });

  /* ---- crossing: bridges */
  G("xbridge", (b, p) => {
    const { w, d, h } = p, st = p.style || "rope";
    if (st === "rope") { const n = Math.round(d / .22); for (let i = 0; i < n; i++) { const z = -d / 2 + (i + .5) * d / n, sag = Math.sin((i + .5) / n * PI) * .15; if (b.broken && b.r() < .2) continue; b.box(w, .04, d / n - .05, "body", 0, h - sag, z, 0, (b.r() - .5) * .08, 0); } for (const s of [-1, 1]) { for (const e of [-1, 1]) b.cyl(.06, .07, h + .9, "post" in (p.m || {}) ? "post" : "oak", s * w / 2, 0, e * d / 2, 8); const pts = []; for (let i = 0; i <= 10; i++) pts.push([s * w / 2, h + .85 - Math.sin(i / 10 * PI) * .25, -d / 2 + i * d / 10]); b.tube(pts, .02, "rope"); const low = pts.map(([x, y, z], i) => [x, h - Math.sin(i / 10 * PI) * .15, z]); b.tube(low, .02, "rope"); } return; }
    if (st === "plank") { const n = Math.round(d / .3); for (let i = 0; i < n; i++) b.box(w, .06, d / n - .02, "body", 0, h, -d / 2 + (i + .5) * d / n); for (const s of [-1, 1]) b.box(.12, .14, d, "body", s * (w / 2 - .06), h - .14); for (const s of [-1, 1]) for (let i = 0; i <= 2; i++) b.box(.12, h, .12, "body", s * (w / 2 - .06), 0, -d / 2 + i * d / 2); return; }
    if (st === "stone") { b.ext([[-d / 2, 0], [-d / 2, h + .3], [d / 2, h + .3], [d / 2, 0], [d * .35, 0], ...Array.from({ length: 11 }, (_, i) => { const a = i * PI / 10; return [Math.cos(a) * d * .35, Math.sin(a) * h * .75]; }), [-d * .35, 0]], w, "body", 0, 0, 0, H); for (const s of [-1, 1]) b.box(.2, .3, d, "body", s * (w / 2 - .1), h + .3); return; }
    if (st === "draw") { b.box(w, .15, d, "body", 0, 0, 0, .5, 0, 0); for (let i = 0; i < 5; i++) b.box(.06, .16, d - .1, "iron", -w / 2 + .1 + i * (w - .2) / 4, 0, 0, .5, 0, 0); for (const s of [-1, 1]) b.tube([[s * (w / 2 - .1), d * .45 * Math.sin(.5) + .1, -d * .45 * Math.cos(.5) * -1], [s * (w / 2 - .1), h + 1.5, -d / 2]], .02, "chain"); return; }
  });

  /* ================================================================ the catalogue */
  const F = "fantasy", MD = "medieval", HI = "historical", MO = "modern", HO = "horror", PA = "postapoc", SF = "scifi", FU = "futuristic", CY = "cyberpunk", MI = "military";
  const OLD = [F, MD, HI, HO], ALL = [F, MD, HI, MO, MI, HO, PA, CY, SF, FU];
  const DC = "Dungeons & caves";
  M.add(DC, "Traps", [F, MD, HO], [
    ["trap-plate", "Pressure plate", "xtrap", { w: .7, d: .7, h: .08, style: "plate", m: { base: "granite", body: "limestone" } }, { tags: ["trigger", "trap"] }],
    ["trap-plate-sprung", "Pressure plate, pressed", "xtrap", { w: .7, d: .7, h: .06, style: "plate", sprung: true, m: { base: "granite", body: "limestone" } }, { tags: ["trigger", "trap"] }],
    ["trap-spikes", "Spike trap, sprung", "xtrap", { w: 1.4, d: 1.4, h: .45, style: "spikes", sprung: true, m: { base: "granite", body: "iron", hole: "coal" } }, { tags: ["trap", "spikes"] }],
    ["trap-spikes-hidden", "Spike trap, hidden", "xtrap", { w: 1.4, d: 1.4, h: .1, style: "spikes", m: { base: "granite", body: "iron", hole: "coal" } }, { tags: ["trap", "holes"] }],
    ["trap-pit", "Pit with stakes", "xtrap", { w: 1.5, d: 1.5, h: .4, style: "pit", m: { base: "oak", body: "pine", hole: "coal" } }, { tags: ["trap", "pit", "hole"] }],
    ["trap-bear", "Bear trap", "xtrap", { w: .5, d: .5, h: .1, style: "beartrap", m: { body: "iron", chain: "iron" } }, { g: [F, MD, HI, HO, PA], tags: ["trap", "hunting"] }],
    ["trap-blade", "Swinging blade", "xtrap", { w: 1, d: .3, h: 3, style: "blade", m: { base: "granite", body: "iron", blade: "steel" } }, { mount: "ceiling", tags: ["trap", "pendulum"] }],
    ["trap-darts", "Dart wall", "xtrap", { w: 1.4, d: .6, h: 1.6, style: "darts", m: { base: "granite", body: "limestone", hole: "coal" } }, { tags: ["trap", "arrows"] }],
    ["trap-flame", "Flame jet", "xtrap", { w: .6, d: .6, h: 1.4, style: "flame", sprung: true, m: { base: "granite", body: "iron", hole: "coal" } }, { tags: ["trap", "fire"] }],
    ["trap-net", "Net trap", "xtrap", { w: 1.6, d: .4, h: 2.6, style: "net", m: { base: "oak" } }, { g: [F, MD, HO, PA], tags: ["trap", "net"] }],
    ["trap-log", "Spiked log trap", "xtrap", { w: 2, d: .5, h: 2.6, style: "log", m: { base: "oak", body: "oak", spike: "iron" } }, { g: [F, MD, PA], tags: ["trap", "swinging"] }]
  ]);
  M.add(DC, "Mechanisms", [F, MD, HO], [
    ["lever-wall", "Wall lever", "xmech", { w: .3, d: .25, h: .45, style: "lever", m: { base: "granite", body: "iron" } }, { mount: "wall", tags: ["switch", "puzzle"] }],
    ["lever-wall-down", "Wall lever, pulled", "xmech", { w: .3, d: .25, h: .45, style: "lever", on: true, m: { base: "granite", body: "iron" } }, { mount: "wall", tags: ["switch", "puzzle"] }],
    ["lever-floor", "Floor lever", "xmech", { w: .4, d: .6, h: 1, style: "floorlever", m: { base: "granite", body: "iron", grip: "leather" } }, { tags: ["switch", "puzzle"] }],
    ["wheel-valve", "Turning wheel", "xmech", { w: .7, d: .3, h: 1.4, style: "wheel", m: { base: "granite", body: "bronze" } }, { g: [F, MD, HO, HI], tags: ["switch", "gate"] }],
    ["button-rune", "Rune button", "xmech", { w: .4, d: .2, h: .4, style: "button", m: { base: "granite", body: "limestone", rune: "glowcyan" } }, { mount: "wall", tags: ["switch", "puzzle", "magic"] }],
    ["winch", "Winch", "xmech", { w: 1.2, d: .6, h: 1, style: "winch", m: { base: "oak", body: "oak", drum: "oak" } }, { g: [F, MD, HI], tags: ["gate", "portcullis"] }],
    ["chain-pull", "Bell pull chain", "xmech", { w: .2, d: .2, h: 1.8, style: "chainpull", m: { base: "oak", body: "iron", chain: "iron" } }, { mount: "wall", tags: ["switch", "bell"] }],
    ["lock-plate", "Keyhole plate", "xmech", { w: .35, d: .15, h: .5, style: "keyhole", m: { base: "granite", body: "brass", hole: "coal" } }, { mount: "wall", tags: ["lock", "puzzle", "key"] }]
  ]);
  M.add(DC, "Captivity", OLD, [
    ["manacles-wall", "Manacles on a wall", "xchains", { w: .8, d: .2, h: 1.9, style: "manacles", m: { body: "iron", chain: "iron" } }, { tags: ["chains", "prison", "dungeon"] }],
    ["shackles-floor", "Floor shackles", "xchains", { w: .9, d: .9, h: .1, style: "floor", m: { body: "iron", chain: "iron" } }, { tags: ["chains", "prison"] }],
    ["skeleton-chained", "Chained skeleton", "xchains", { w: 1, d: .6, h: 1.9, style: "skeleton", m: { body: "iron", chain: "iron", bone: "bone" } }, { tags: ["chains", "dead", "prison"] }],
    ["meat-hook", "Hanging hook", "xchains", { w: .3, d: .3, h: 2.6, style: "hook", m: { body: "iron", chain: "iron" } }, { mount: "ceiling", g: [F, MD, HI, HO, PA], tags: ["chains", "butcher"] }],
    ["torture-rack", "Torture rack", "xtorture", { w: 1, d: 2.2, h: .9, style: "rack", m: { body: "oak" } }, { tags: ["torture", "dungeon"] }],
    ["breaking-wheel", "Breaking wheel", "xtorture", { w: 1.6, d: .3, h: 2.2, style: "wheel", m: { body: "oak" } }, { tags: ["torture", "execution"] }],
    ["guillotine", "Guillotine", "xtorture", { w: 1, d: 1.4, h: 3, style: "guillotine", m: { body: "oak", blade: "steel", hole: "coal", basket: "pine" } }, { g: [HI, HO, F], e: "both", tags: ["execution"] }],
    ["gallows", "Gallows", "xtorture", { w: 2.4, d: 2, h: 3, style: "gallows", m: { body: "oak" } }, { g: [MD, HI, HO, F], e: "out", tags: ["execution", "hanging"] }],
    ["whipping-post", "Whipping post", "xtorture", { w: .4, d: .4, h: 2, style: "post", m: { body: "oak" } }, { e: "both", tags: ["torture", "punishment"] }],
    ["spiked-chair", "Interrogation chair, spiked", "xtorture", { w: .6, d: .6, h: 1.2, style: "chair", m: { body: "oak" } }, { tags: ["torture", "chair"] }],
    ["cell-front", "Cell bars with a door", "xcell", { w: 3, d: .2, h: 2.4, m: { body: "iron", lock: "iron" } }, { tags: ["prison", "jail", "bars"] }],
    ["cell-front-open", "Cell bars, door open", "xcell", { w: 3, d: .2, h: 2.4, open: true, m: { body: "iron", lock: "iron" } }, { tags: ["prison", "jail", "bars"] }]
  ]);
  M.add(DC, "Crypts & catacombs", [F, MD, HI, HO], [
    ["catacomb-niches", "Burial niches", "xcrypt", { w: 2, d: .5, h: 2.2, style: "niches", m: { body: "limestone", hole: "coal", bone: "bone" } }, { tags: ["tomb", "bones", "wall"] }],
    ["ossuary-wall", "Wall of skulls", "xcrypt", { w: 2, d: .5, h: 2.2, style: "ossuary", m: { body: "limestone", bone: "bone", hole: "coal" } }, { tags: ["bones", "skulls", "wall"] }],
    ["tomb-effigy", "Tomb with an effigy", "xcrypt", { w: 1, d: 2.2, h: 1, style: "effigy", m: { body: "marble", effigy: "marble", sword: "iron" } }, { tags: ["tomb", "knight", "noble"] }],
    ["tomb-effigy-dark", "Weathered tomb", "xcrypt", { w: 1, d: 2.2, h: 1, style: "effigy", m: { body: "granite", effigy: "darkstone", sword: "bronze" } }, { tags: ["tomb", "old"] }],
    ["urn-shelf", "Shelf of burial urns", "xcrypt", { w: 1.6, d: .5, h: 1.2, style: "urns", m: { body: "limestone", urn: "terracotta" } }, { g: [HI, F, HO], tags: ["urns", "ashes"] }],
    ["bier", "Bier with a shrouded body", "xcrypt", { w: .9, d: 2.1, h: .8, style: "bier", m: { body: "oak", shroud: "linen" } }, { tags: ["body", "funeral", "dead"] }]
  ]);
  M.add(DC, "Caves", [F, MD, HI, MO, HO, PA, SF], [
    ["stalactites", "Stalactites", "xcave", { w: 2, d: 2, h: 1.2, style: "stalactites", m: { body: "cavestone" } }, { mount: "ceiling", e: "both", tags: ["cave", "ceiling"] }],
    ["cave-pillar", "Cave column", "xcave", { w: .9, d: .9, h: 3, style: "pillar", m: { body: "cavestone" } }, { e: "both", tags: ["cave", "stalagmite"] }],
    ["flowstone", "Flowstone mound", "xcave", { w: 1.6, d: 1.2, h: 1.2, style: "flowstone", m: { body: "flowstone" } }, { e: "both", tags: ["cave"] }],
    ["cave-boulders", "Fallen boulders", "xcave", { w: 2.2, d: 1.8, h: 1, style: "boulders", m: { body: "cavestone" } }, { e: "both", tags: ["cave", "rocks", "rockfall"] }],
    ["cave-mouth", "Cave mouth", "xcave", { w: 4, d: 1.4, h: 3, style: "mouth", m: { body: "cavestone" } }, { e: "both", tags: ["cave", "entrance", "wall"] }],
    ["glowworms", "Glowworm threads", "xcave", { w: 1.6, d: 1.6, h: .8, style: "glowworms", m: { body: "cavestone" } }, { mount: "ceiling", e: "both", g: [F, HO, SF], tags: ["cave", "glowing"] }],
    ["pool-cave", "Cave pool", "xpool", { w: 2.4, d: 1.8, h: .06, style: "water", m: { body: "darkwater", rim: "cavestone" } }, { e: "both", tags: ["water", "underground"] }],
    ["pool-lava", "Lava pool", "xpool", { w: 2.4, d: 1.8, h: .08, style: "lava", m: { body: "lava", rim: "lavacrust" } }, { e: "both", g: [F, SF, HO], tags: ["lava", "fire", "volcano"] }],
    ["pool-poison", "Poison pool", "xpool", { w: 2, d: 1.6, h: .07, style: "poison", m: { body: "poison", rim: "cavestone" } }, { e: "both", g: [F, HO, PA, SF], tags: ["poison", "acid", "toxic"] }]
  ]);
  M.add(DC, "Ruins", [F, MD, HI, HO, PA], [
    ["ruin-arch", "Broken arch", "xruin", { w: 3, d: .6, h: 3, style: "arch", m: { body: "limestone" } }, { e: "both", tags: ["ruin", "arch", "broken"] }],
    ["ruin-drums", "Fallen column drums", "xruin", { w: 1.2, d: 1.6, h: .8, style: "drums", m: { body: "marble" } }, { e: "both", g: [F, HI], tags: ["ruin", "column", "greek", "roman"] }],
    ["ruin-head", "Half-buried stone head", "xruin", { w: 1.2, d: 1.2, h: 1, style: "head", m: { body: "sandstone", dirt: "earth" } }, { e: "out", g: [F, HI], tags: ["ruin", "statue", "ancient"] }],
    ["ruin-toppled", "Toppled statue", "xruin", { w: 1, d: 2.6, h: .6, style: "toppled", m: { body: "marble" } }, { e: "both", tags: ["ruin", "statue", "broken"] }],
    ["ruin-steps", "Broken steps", "xruin", { w: 2, d: 1.6, h: .8, style: "steps", m: { body: "limestone" } }, { e: "both", tags: ["ruin", "stairs"] }],
    ["ruin-pillar-vines", "Overgrown pillar", "xruin", { w: .7, d: .7, h: 2.4, style: "overgrown", m: { body: "limestone", vine: "leaf" } }, { e: "both", tags: ["ruin", "vines", "jungle"] }],
    ["ruin-collapse", "Collapsed ceiling", "xruin", { w: 3, d: 3, h: .8, style: "collapse", m: { body: "limestone", beam: "oak" } }, { e: "both", g: [F, MD, HI, MO, HO, PA], tags: ["ruin", "debris", "cave-in"] }]
  ]);
  M.add(DC, "Bridges & crossings", [F, MD, HI, HO, PA], [
    ["bridge-rope", "Rope bridge", "xbridge", { w: 1.2, d: 4, h: .6, style: "rope", m: { body: "pine", post: "oak" } }, { e: "both", tags: ["bridge", "chasm"] }],
    ["bridge-plank", "Plank bridge", "xbridge", { w: 1.6, d: 3, h: .5, style: "plank", m: { body: "oak" } }, { e: "both", tags: ["bridge", "stream"] }],
    ["bridge-stone", "Stone arch bridge", "xbridge", { w: 2, d: 4, h: 1.2, style: "stone", m: { body: "granite" } }, { e: "out", tags: ["bridge", "river"] }],
    ["drawbridge", "Drawbridge, lowering", "xbridge", { w: 2.6, d: 3, h: 2, style: "draw", m: { body: "oak", chain: "iron" } }, { e: "out", g: [F, MD], tags: ["bridge", "castle", "gate"] }]
  ]);

  /* ---- kits: a whole dungeon room at once */
  M.kit({ id: "torture-chamber", n: "Torture chamber", d: "A rack, a wheel, chains and the spiked chair, with braziers to see by.", g: [F, MD, HO],
    set: [["torture-rack", 0, 0, 0], ["breaking-wheel", -2, -1.2, 0], ["manacles-wall", 1.6, -1.6, 0], ["spiked-chair", 1.4, .6, 270], ["brazier", -1.4, 1, 0], ["meat-hook", .6, -.6, 0], ["shackles-floor", -.8, 1.4, 0]],
    ids: ["torture-rack", "breaking-wheel", "manacles-wall", "spiked-chair", "brazier", "meat-hook", "shackles-floor"] });
  M.kit({ id: "trapped-hall", n: "Trapped corridor", d: "Pressure plates, a hidden spike trap, a dart wall and the swinging blade they answer to.", g: [F, MD, HO],
    set: [["trap-plate", 0, -1.5, 0], ["trap-spikes-hidden", 0, 0, 0], ["trap-darts", -1, 1.2, 90], ["trap-blade", 0, 1.6, 0], ["lever-wall", 1, -2, 270]],
    ids: ["trap-plate", "trap-spikes-hidden", "trap-darts", "trap-blade", "lever-wall"] });
  M.kit({ id: "catacomb", n: "Catacomb", d: "Burial niches, a wall of skulls, an effigy tomb, urns and a bier.", g: [F, MD, HI, HO],
    set: [["catacomb-niches", -1.2, -1.6, 0], ["ossuary-wall", 1.2, -1.6, 0], ["tomb-effigy", 0, .2, 0], ["urn-shelf", -1.8, .8, 90], ["bier", 1.6, .8, 0], ["candles-cluster", 0, -.9, 0]],
    ids: ["catacomb-niches", "ossuary-wall", "tomb-effigy", "urn-shelf", "bier"] });
  M.kit({ id: "cavern", n: "Cavern", d: "Stalactites over a dark pool, columns, flowstone and fallen boulders.", g: [F, HO, MO, SF],
    set: [["pool-cave", 0, .5, 0], ["stalactites", 0, .4, 0], ["cave-pillar", -1.6, -1, 0], ["flowstone", 1.6, -1.2, 0], ["cave-boulders", 1.4, 1.6, 0], ["glowworms", -1.2, 1.2, 0]],
    ids: ["pool-cave", "stalactites", "cave-pillar", "flowstone", "cave-boulders", "glowworms"] });
  M.kit({ id: "prison-block", n: "Prison cells", d: "Two cell fronts, one open, shackles, a chained skeleton and the warder's lever.", g: [F, MD, HI, HO],
    set: [["cell-front", -1.6, 0, 0], ["cell-front-open", 1.6, 0, 0], ["skeleton-chained", -1.6, -1, 0], ["shackles-floor", 1.4, -1, 0], ["lever-wall", 3, 1, 270], ["bucket", -.8, -1.2, 0]],
    ids: ["cell-front", "cell-front-open", "skeleton-chained", "shackles-floor", "lever-wall"] });
})(ATLAS);
