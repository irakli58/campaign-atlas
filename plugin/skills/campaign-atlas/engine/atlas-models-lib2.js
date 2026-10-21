/* The models, part two: what stands in castles and dungeons, starships and stations, neon streets, offices and
   barracks, wastelands, factories, the wild, and the dark; the walls, doors and stairs a room is built of; and the
   things painted on floors. Same rules as part one (atlas-models-lib.js). */
(function (A) {
  "use strict";
  const M = A.models, G = M.gen, P = M.parts, PI = Math.PI, H = PI / 2, TAU = PI * 2;
  const pick = (b, list) => list[(b.r() * list.length) | 0];
  const strut = (b, a, c, r, m, seg) => { const T = b.T, dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], len = Math.hypot(dx, dy, dz) || .001; const me = b.cyl(r, r, len, m, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2, seg || 8, 1e-6); me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)); return me; };
  const plank = (b, a, c, w, t, m) => { const T = b.T, dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], len = Math.hypot(dx, dy, dz) || .001; const me = b.box(w, len, t, m, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - len / 2, (a[2] + c[2]) / 2); me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)); return me; };
  const has = (p, k) => !!(p.m && p.m[k]);
  // a lumpy stone: an icosahedron pushed about, the same each time for the same model
  function lump(b, rad, m, x, y, z, sy, rough, det) {
    const T = b.T, g = new T.IcosahedronGeometry(rad, det == null ? 1 : det), pos = g.attributes.position, seen = new Map();
    for (let i = 0; i < pos.count; i++) { const k = pos.getX(i).toFixed(3) + pos.getY(i).toFixed(3) + pos.getZ(i).toFixed(3); let f = seen.get(k); if (f == null) { f = 1 + (b.r() - .5) * (rough || .35); seen.set(k, f); } pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f * (sy || 1), pos.getZ(i) * f); }
    g.computeVertexNormals(); return b.mesh(g, m, x, y, z, 0, b.r() * TAU, 0);
  }
  M.lump = lump;
  // a wheel standing up, turning about x
  const wheel = (b, r, t, m, x, y, z, spokes, hub) => b.part(() => { if (spokes) { b.tor(r - .02, .025, m, 0, 0, 0, 0, H); for (let i = 0; i < spokes; i++) b.box(.02, r * 2 - .06, .02, m, 0, -r + .03, 0, i * PI / spokes, 0, 0); b.cyl(.05, .05, t * 1.4, hub || m, 0, 0, 0, 12, 0, H); } else { b.cyl(r, r, t, m, 0, 0, 0, 22, 0, H); b.cyl(r * .55, r * .55, t + .01, hub || "steel", 0, 0, 0, 16, 0, H); } }, x, y, z);

  /* ================= medieval and fantasy ================= */
  G("barrel", (b, p) => {
    const { w, h } = p, r = w / 2, st = p.style || "barrel";
    const body = () => {
      if (st === "drum") { b.cyl(r, r, h, "body", 0, 0, 0, 24); for (const y of [h * .33, h * .66]) b.tor(r, .012, "body", 0, y, 0); if (p.fire && b.cond !== "ruined") { b.cyl(r * .95, r * .95, .01, "coal", 0, h * .9, 0, 20); for (let i = 0; i < 4; i++) b.cone(r * (.3 + b.r() * .3), h * (.35 + b.r() * .3), i % 2 ? "fire" : "ember", (b.r() - .5) * r * .6, h * .9, (b.r() - .5) * r * .6, 8); for (let i = 0; i < 4; i++) b.cyl(.03, .03, .02, "ember", Math.cos(i * 1.6) * r, h * .2, Math.sin(i * 1.6) * r, 8, H, 0, -i * 1.6); } else { b.cyl(r * .97, r * .97, .006, "body", 0, h, 0, 24); b.cyl(.03, .03, .015, "steel", r * .5, h, 0, 10); } if (p.text) b.sign(p.text, r * 1.2, r * .4, "rgba(0,0,0,0)", "#e8e0c8", 0, h * .5, r + .005); return; }
      const bulge = st === "keg" ? 1.12 : 1.16, at = t => r * (1 + (bulge - 1) * Math.sin(t * PI));
      const side = Array.from({ length: 11 }, (_, i) => [at(i / 10), h * i / 10]);
      // an open barrel is hollow, its staves' tops showing
      b.lathe(side.concat(st === "open" || st === "fire" ? [[at(1) * .92, h], [at(.5) * .92, h * .1], [0, h * .1]] : [[0, h]]), "body", 0, 0, 0, 22);
      const hoops = st === "cask" ? [.06, .2, .8, .94] : [.1, .28, .72, .9];
      hoops.forEach((t, i) => { if (b.broken && i === 1) return; b.tor(at(t) + .003, .008, has(p, "band") ? "band" : "iron", 0, h * t, 0); });
      if (st === "powder") b.sign("POWDER", r * 1.2, r * .35, "#1c1a18", "#c8b88a", 0, h * .55, r * bulge + .005);
      if (st === "open") { b.cyl(r * .95, r * .95, .01, p.fill || "water", 0, h * .9, 0, 20); if (p.fill === "fruitred") for (let i = 0; i < 6; i++) b.sph(.04, "fruitred", (b.r() - .5) * r, h * .93, (b.r() - .5) * r, 1, 8); }
      else if (st === "fire") { b.cone(r * .8, h * .4, "fire", 0, h * .85, 0, 9); b.cone(r * .5, h * .3, "ember", 0, h * .85, 0, 9); }
      else b.cyl(r * .97, r * .97, .006, "body", 0, h - .02, 0, 22);
      if (st === "tap") b.cyl(.015, .015, .08, "brass", 0, h * .25, r * bulge + .03, 8, H);
    };
    if (p.lie) { b.part(body, 0, r, -h / 2, H, 0, 0); for (const z of [-h * .3, h * .3]) b.ext([[-r * .9, 0], [r * .9, 0], [r * .7, r * .35], [-r * .7, r * .35]], .06, "cradle" in (p.m || {}) ? "cradle" : "oak", 0, 0, z); }
    else body();
    if (p.n > 1) { body(); for (let i = 1; i < p.n; i++) b.part(body, (i % 2 ? 1 : -1) * w * 1.02, 0, i > 1 ? w * .9 : 0); }
  });

  G("crate", (b, p) => {
    const { w, d, h } = p, st = p.style || "wood";
    const one = (W, D, Hh) => {
      if (st === "cardboard") { b.box(W, Hh, D, "body"); b.box(W + .002, .002, .05, "tape" in (p.m || {}) ? "tape" : "pyellow", 0, Hh, 0); if (b.cond !== "new") b.part(() => b.box(W * .5, .004, D, "body"), -W * .25, Hh, 0, 0, 0, .5); return; }
      if (st === "plastic") { b.box(W, Hh, D, "body"); b.box(W - .03, .01, D - .03, "coal", 0, Hh - .005, 0); for (let i = 0; i < 4; i++) b.box(W * .15, Hh * .4, .004, "coal", -W * .3 + i * W * .2, Hh * .3, D / 2); return; }
      if (st === "military" || st === "ammo") {
        b.box(W, Hh, D, "body"); for (const sx of [-1, 1]) { b.box(.04, Hh + .004, D + .004, "body", sx * (W / 2 - .06)); b.box(.08, .03, .04, "steel", sx * W * .3, Hh * .7, D / 2 + .01); }
        b.sign(st === "ammo" ? "AMMO 7.62" : (p.text || "SUPPLIES"), W * .5, Hh * .22, "#3a4028", "#e8e0b8", 0, Hh * .45, D / 2 + .003); return;
      }
      if (st === "scifi") {
        b.rbox(W, Hh, D, .04, "body"); for (const sx of [-1, 1]) b.box(.03, Hh * .7, .02, "glowcyan", sx * (W / 2 - .06), Hh * .15, D / 2 - .004);
        b.box(W * .5, Hh * .2, .006, "trim" in (p.m || {}) ? "trim" : "pyellow", 0, Hh * .4, D / 2); b.box(W - .06, .02, D - .06, "pgrey", 0, Hh); return;
      }
      if (st === "cage") { b.box(W, .04, D, "body"); b.box(W, .04, D, "body", 0, Hh - .04); for (let i = 0; i <= 6; i++) for (const sz of [-1, 1]) b.box(.012, Hh, .012, "body", -W / 2 + i * W / 6, 0, sz * D / 2); return; }
      // wood: planks with a frame on every face
      b.box(W - .02, Hh - .02, D - .02, "body", 0, .01, 0);
      const fr = has(p, "frame") ? "frame" : "body", t = .025;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(t * 2, Hh, t * 2, fr, sx * (W / 2 - t), 0, sz * (D / 2 - t));
      for (const y of [0, Hh - t * 2]) { for (const sz of [-1, 1]) b.box(W, t * 2, t, fr, 0, y, sz * (D / 2 - t / 2)); for (const sx of [-1, 1]) b.box(t, t * 2, D, fr, sx * (W / 2 - t / 2), y, 0); }
      for (const sz of [-1, 1]) plank(b, [-W / 2 + t, t * 2, sz * (D / 2 - t / 2)], [W / 2 - t, Hh - t * 2, sz * (D / 2 - t / 2)], .07, t * .8, fr);
      for (let i = 1; i < 4; i++) b.box(W - .04, .004, .004, "coal", 0, i * Hh / 4, D / 2 + .001);
      if (p.open && !b.broken) { b.part(() => b.box(W, .025, D, "body", 0, 0, -D / 2), 0, Hh, -D / 2, -1.9, 0, 0); b.box(W - .06, .01, D - .06, p.fill || "straw", 0, Hh - .1, 0); if (p.fill === "gold") P.coins(b, 0, Hh - .1, 0); }
      else if (b.broken) b.part(() => b.box(W * .6, .025, D, "body"), W * .3, Hh, 0, 0, .4, .35);
      if (p.text) b.sign(p.text, W * .6, Hh * .2, "#9c7650", "#2b1d10", 0, Hh * .5, D / 2 + .004);
    };
    if (p.n > 1) { const k = p.n; for (let i = 0; i < k; i++) { const s = 1 - (i % 3) * .12; b.part(() => one(w * s, d * s, h * s), (i % 2 ? 1 : -1) * (i > 1 ? 0 : w * .52), i > 1 ? h : 0, i > 1 ? 0 : (i ? -.05 : .05), 0, (b.r() - .5) * .4, 0); } }
    else one(w, d, h);
  });

  G("chest", (b, p) => {
    const { w, d, h } = p, st = p.style || "dome", lh = st === "dome" ? h * .35 : h * .22, bh = h - lh, band = has(p, "band") ? "band" : "iron";
    if (st === "scifi") { b.rbox(w, bh, d, .04, "body"); b.rbox(w, lh, d, .04, "body", 0, bh + .005); b.box(w * .15, .03, .02, "glowcyan", 0, bh + lh * .4, d / 2); b.box(w + .01, .015, d + .01, "trim" in (p.m || {}) ? "trim" : "pblack", 0, bh); return; }
    if (st === "foot") { b.box(w, h, d, "body"); b.box(w + .01, .03, d + .01, band, 0, h - .06); for (const sx of [-1, 1]) b.box(.08, .04, .02, band, sx * w * .3, h * .5, d / 2 + .01); b.sign(p.text || "PVT. HALE", w * .4, .07, "#3a4028", "#e8e0b8", 0, h * .7, d / 2 + .003); return; }
    b.box(w, bh, d, "body");
    // a domed lid is half a cylinder lying along the chest
    const lid = () => { if (st === "dome") { const geo = new b.T.CylinderGeometry(d / 2, d / 2, w, 20, 1, false, 0, PI); b.part(() => b.mesh(geo, "body", 0, 0, 0, 0, 0, H), 0, 0, 0).scale.y = lh / (d / 2); } else b.box(w + .02, lh, d + .02, "body", 0, 0, 0); };
    const open = p.open || p.fill;
    if (open) b.part(lid, 0, bh, -d / 2, -1.7, 0, 0).children.forEach(c => c.position.z += d / 2);
    else b.part(lid, 0, bh, 0);
    for (const x of [-w * .32, w * .32]) { b.box(.04, bh + .005, d + .01, band, x, 0, 0); if (!open && st === "dome") b.part(() => b.tor(d / 2, .02, band, 0, 0, 0, 0, H, PI), x, bh, 0).scale.y = lh / (d / 2); }
    b.box(.08, .1, .02, band, 0, bh - .1, d / 2 + .01);
    if (st === "ornate") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.06, .06, .06, "gold", sx * (w / 2 - .02), bh - .06, sz * (d / 2 - .02)); b.box(w * .3, .1, .01, "gold", 0, bh * .3, d / 2 + .01); }
    if (p.fill === "gold") { P.coins(b, 0, bh - .05, 0, 1.4); for (let i = 0; i < 5; i++) P.gem(b, (b.r() - .5) * w * .6, bh + .02, (b.r() - .5) * d * .4, pick(b, ["ruby", "emerald", "sapphire", "amethyst"])); }
    else if (p.fill) b.box(w - .06, .01, d - .06, p.fill, 0, bh - .04, 0);
  });

  G("smithy", (b, p) => {
    const { w, d, h } = p, st = p.style || "anvil";
    if (st === "anvil") { b.cyl(.2, .24, .45, "bark", 0, 0, 0, 12); b.ext([[-.1, 0], [.1, 0], [.07, .1], [.14, .2], [.22, .22], [.3, .28], [-.22, .28], [-.2, .22], [-.08, .12]], .14, "body", 0, .45, 0); P.knife(b, .15, .73, .05, 1); b.box(.04, .03, .3, "oak", -.1, .73, 0); return; }
    if (st === "forge") {
      b.box(w, h * .45, d, "body"); b.box(w - .2, .06, d - .2, "coal", 0, h * .45, 0); for (let i = 0; i < 6; i++) b.sph(.06, i % 2 ? "ember" : "coal", (b.r() - .5) * (w - .3), h * .45 + .05, (b.r() - .5) * (d - .3), .6, 8); b.cone(.12, .15, "fire", 0, h * .45 + .05, 0, 8);
      b.ext([[-w / 2, 0], [w / 2, 0], [w * .15, h * .3], [-w * .15, h * .3]], d * .6, "body", 0, h * .45 + .6, -d * .15); b.box(w * .3, h * .25, d * .35, "body", 0, h * .75 + .6 - h * .3, -d * .2);
      b.part(() => { b.ext([[0, -.15], [.6, -.05], [.6, .05], [0, .15]], .1, "leather", 0, 0, 0); b.box(.02, .3, .12, "oak", 0, -.15); }, w / 2 + .05, h * .35, 0, 0, 0, -.2); return;
    }
    if (st === "grindstone") { for (const sx of [-1, 1]) { b.box(.06, h * .7, .06, "frame" in (p.m || {}) ? "frame" : "oak", sx * .2, 0, -.15); b.box(.06, h * .7, .06, "frame" in (p.m || {}) ? "frame" : "oak", sx * .2, 0, .15); } b.part(() => b.cyl(.3, .3, .1, "body", 0, 0, 0, 24, 0, H), 0, h * .7, 0); b.rod(.02, .55, "iron", 0, h * .7, 0); b.tube([[.27, h * .7, 0], [.32, h * .7, 0], [.32, h * .55, 0], [.4, h * .55, 0]], .012, "iron"); return; }
    if (st === "quench") { b.box(w, h, d, "body"); b.box(w - .08, .02, d - .08, "water", 0, h - .06, 0); for (const sz of [-1, 1]) b.box(w + .01, .03, .03, "iron", 0, h * .7, sz * (d / 2)); return; }
  });

  G("armour", (b, p) => {
    const { h } = p, st = p.style || "plate";
    if (st === "dummy") { b.box(.4, .06, .4, "oak"); b.cyl(.04, .04, h * .55, "oak", 0, .06, 0, 8); b.cyl(.17, .14, h * .35, "body", 0, h * .5, 0, 10); b.sph(.12, "body", 0, h * .92, 0, 1.1, 10); b.rod(.035, .9, "oak", 0, h * .78, 0); return; }
    if (st === "target") { for (const sx of [-1, 1]) plank(b, [sx * .35, 0, .25], [sx * .1, 1.3, 0], .05, .05, "oak"); plank(b, [0, 0, -.45], [0, 1.25, 0], .05, .05, "oak"); b.part(() => { b.cyl(.45, .45, .1, "straw", 0, 0, 0, 24, H); b.decal("target", (g, W, Hh) => { ["#f0eee6", "#1f1f1f", "#2a5ab0", "#b8231d", "#e8b726"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(W / 2, Hh / 2, W / 2 * (1 - i * .19), 0, 7); g.fill(); }); }, .88, .88, 0, null, true).position.z = .056; }, 0, 1.15, 0, -.15, 0, 0); return; }
    b.box(.4, .05, .4, "stand" in (p.m || {}) ? "stand" : "oak"); b.cyl(.025, .025, h * .5, "stand" in (p.m || {}) ? "stand" : "oak", 0, .05, 0, 8);
    if (st === "robe") { b.cyl(.18, .3, h * .75, "body", 0, .05, 0, 14); b.sph(.15, "body", 0, h * .83, -.02, 1.1, 12); return; }
    b.lathe([[.15, 0], [.2, .12], [.22, .3], [.25, .42], [.2, .48], [0, .48]], "body", 0, h * .45, 0, 16).scale.z = .7;
    for (const sx of [-1, 1]) { b.sph(.1, "body", sx * .26, h * .45 + .44, 0, .7, 12); b.cyl(.055, .05, .38, "body", sx * .3, h * .45 + .05, 0, 10); }
    b.cyl(.1, .14, .2, "body", 0, h * .45 - .18, 0, 12);
    b.lathe([[.12, 0], [.13, .1], [.11, .2], [.05, .26], [0, .27]], "body", 0, h * .45 + .52, 0, 16);
    if (st === "plate") b.box(.12, .015, .02, "coal", 0, h * .45 + .63, .11);
    if (p.shield) b.part(() => { b.ext([[-.22, .15], [.22, .15], [.22, -.05], [0, -.32], [-.22, -.05]], .03, "trim" in (p.m || {}) ? "trim" : "red"); }, 0, h * .55, .26, -.05, 0, 0);
  });

  G("lectern", (b, p) => {
    const { w, d, h } = p;
    b.box(w * .7, .05, d * .8, "body"); b.lathe([[.06, 0], [.05, .1], [.07, h * .5], [.05, h * .8], [0, h * .8]], "body", 0, .05, 0, 12);
    b.part(() => { b.box(w, .04, d, "body"); b.box(w, .05, .02, "body", 0, .02, d / 2); P.openbook(b, 0, .04, 0, 0, w / .45); }, 0, h - .05, 0, .35, 0, 0);
  });

  G("altar", (b, p) => {
    const { w, d, h } = p, st = p.style || "stone";
    if (st === "slab") { b.box(w, h * .25, d, "body"); b.box(w * .85, h * .5, d * .8, "body", 0, h * .25); b.box(w, h * .25, d, "body", 0, h * .75); if (p.blood) b.decal("altarblood", (g, W, Hh) => { g.fillStyle = "rgba(74,10,10,.85)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(W * (.3 + Math.random() * .4), Hh * (.3 + Math.random() * .4), W * (.05 + Math.random() * .12), Hh * (.05 + Math.random() * .1), 0, 0, 7); g.fill(); } }, w * .9, d * .9, h + .002); for (const sx of [-1, 1]) b.box(.06, .03, .06, "iron", sx * w * .42, h, 0); return; }
    if (st === "scifi") { b.rbox(w, h, d, .05, "body"); b.box(w - .1, .01, d - .1, "glowviolet", 0, h); b.box(w + .02, .04, .04, "glowviolet", 0, h * .3, d / 2); return; }
    b.box(w + .2, .12, d + .2, "body"); b.box(w, h - .12, d, "body", 0, .12); b.box(w + .08, .06, d + .08, "body", 0, h - .06);
    if (st === "church") { b.box(w + .1, .25, d + .1, "cloth" in (p.m || {}) ? "cloth" : "white", 0, h - .2, 0); b.box(.06, .5, .03, "gold", 0, h + .05, -d * .25); b.box(.25, .06, .03, "gold", 0, h + .38, -d * .25); for (const sx of [-1, 1]) P.candle(b, sx * w * .35, h + .05, -d * .2, 1.4, true, .2); return; }
    if (st === "dark") { for (let i = 0; i < 5; i++) P.candle(b, -w * .4 + i * w * .2, h, -d * .3, 1, true, .06 + b.r() * .12); P.skull(b, 0, h, 0, 0, 1.3); P.knife(b, w * .25, h, d * .2, .3); b.decal("altarsig", (g, W, Hh) => { g.strokeStyle = "#5a0d0d"; g.lineWidth = W / 40; g.beginPath(); g.arc(W / 2, Hh / 2, W * .4, 0, 7); g.stroke(); for (let i = 0; i < 5; i++) { const a = -H + i * TAU * 2 / 5, a2 = -H + (i + 1) * TAU * 2 / 5; g.moveTo(W / 2 + Math.cos(a) * W * .38, Hh / 2 + Math.sin(a) * Hh * .38); g.lineTo(W / 2 + Math.cos(a2) * W * .38, Hh / 2 + Math.sin(a2) * Hh * .38); } g.stroke(); }, d * .8, d * .8, h + .001); return; }
  });

  G("statue", (b, p) => {
    const { w, h } = p, st = p.style || "knight", ph = Math.min(.5, h * .2), fh = h - ph;
    if (p.plinth !== false) { b.box(w, ph * .25, w, "plinth" in (p.m || {}) ? "plinth" : "body"); b.box(w * .85, ph * .6, w * .85, "plinth" in (p.m || {}) ? "plinth" : "body", 0, ph * .25); b.box(w, ph * .15, w, "plinth" in (p.m || {}) ? "plinth" : "body", 0, ph * .85); }
    const y0 = p.plinth === false ? 0 : ph, s = fh / 1.8;
    if (st === "bust") { b.lathe([[w * .4, 0], [w * .38, fh * .2], [w * .2, fh * .35], [w * .12, fh * .45], [0, fh * .45]], "body", 0, y0, 0, 18); b.sph(w * .22, "body", 0, y0 + fh * .65, 0, 1.15, 16); return; }
    if (st === "gargoyle") { b.sph(w * .3, "body", 0, y0 + fh * .35, 0, 1.1, 12); b.sph(w * .2, "body", 0, y0 + fh * .72, w * .12, 1, 12); for (const sx of [-1, 1]) { b.ext([[0, 0], [w * .5, fh * .3], [w * .3, -fh * .05]], .03, "body", sx * w * .1, y0 + fh * .45, -w * .12, sx * .4); b.cone(.04, fh * .15, "body", sx * w * .09, y0 + fh * .8, w * .1, 6); } return; }
    if (st === "obelisk") { b.cyl(w * .25, w * .38, fh * .9, "body", 0, y0, 0, 4).rotation.y = PI / 4; b.cone(w * .27, fh * .1, "body", 0, y0 + fh * .9, 0, 4).rotation.y = PI / 4; return; }
    if (st === "idol") { b.cyl(w * .35, w * .4, fh * .55, "body", 0, y0, 0, 8); b.sph(w * .38, "body", 0, y0 + fh * .72, 0, 1.2, 12); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .2; b.tube([[Math.cos(a) * w * .2, y0 + fh * .65, Math.sin(a) * w * .2 + w * .1], [Math.cos(a) * w * .42, y0 + fh * .4, Math.sin(a) * w * .35], [Math.cos(a) * w * .5, y0 + fh * .05, Math.sin(a) * w * .45]], .03, "body"); } for (const sx of [-1, 1]) b.sph(.035, "glowgreen", sx * w * .14, y0 + fh * .8, w * .34, 1, 8); for (const sx of [-1, 1]) b.ext([[0, 0], [w * .6, fh * .25], [w * .4, -fh * .1]], .02, "body", sx * w * .25, y0 + fh * .75, -w * .2, sx * .5); return; }
    // a standing figure: legs, a robe or a coat of plates, arms, head
    const robe = st === "robed" || st === "angel" || st === "saint";
    if (robe) b.lathe([[w * .38, 0], [w * .3, s * .5], [w * .22, s * 1.05], [w * .25, s * 1.3], [w * .12, s * 1.45], [0, s * 1.45]], "body", 0, y0, 0, 18);
    else { for (const sx of [-1, 1]) b.cyl(s * .07, s * .08, s * .8, "body", sx * s * .1, y0, 0, 10); b.lathe([[s * .18, 0], [s * .2, s * .3], [s * .24, s * .55], [s * .12, s * .65], [0, s * .65]], "body", 0, y0 + s * .8, 0, 14).scale.z = .7; }
    for (const sx of [-1, 1]) strut(b, [sx * s * .22, y0 + s * 1.38, 0], [sx * s * .26, y0 + s * .95, s * .12], s * .055, "body");
    b.sph(s * .12, "body", 0, y0 + s * 1.56, 0, 1.1, 14);
    if (st === "knight") { b.part(() => { b.box(s * .04, s * 1.1, s * .02, "body", 0, 0); b.box(s * .25, s * .03, s * .04, "body", 0, s * .2); }, 0, y0 + s * .2, s * .2); b.lathe([[s * .13, 0], [s * .14, s * .1], [s * .1, s * .2], [0, s * .22]], "body", 0, y0 + s * 1.5, 0, 14); }
    if (st === "angel") for (const sx of [-1, 1]) b.ext([[0, 0], [s * .5, s * .5], [s * .7, s * .2], [s * .45, -s * .3], [s * .15, -s * .4]], .03, "body", sx * s * .05, y0 + s * 1.15, -s * .15, sx * -.4 + (sx < 0 ? PI : 0));
    if (b.broken) b.box(s * .1, s * .1, s * .1, "body", w * .4, 0, w * .3, .3, .5, .2);
  });

  G("column", (b, p) => {
    const { w, h } = p, st = p.style || "round", r = w / 2;
    if (st === "square") { b.box(w, h * .05, w, "body"); b.box(w * .82, h * .9, w * .82, "body", 0, h * .05); b.box(w, h * .05, w, "body", 0, h * .95); return; }
    if (st === "scifi") { b.rbox(w, h, w, .05, "body"); for (const sx of [-1, 1]) b.box(.02, h * .8, .02, "glowcyan", sx * w * .3, h * .1, w / 2); b.box(w + .04, .08, w + .04, "trim" in (p.m || {}) ? "trim" : "steel", 0, h * .2); b.box(w + .04, .08, w + .04, "trim" in (p.m || {}) ? "trim" : "steel", 0, h * .8); return; }
    if (st === "wood") { b.box(w, h, w, "body"); for (const sz of [-1, 1]) b.part(() => b.ext([[0, 0], [.3, 0], [0, -.3]], .1, "body"), sz * .0, h, 0, 0, sz < 0 ? PI : 0, 0); return; }
    if (st === "iron") { b.cyl(r * .5, r * .6, h, "body", 0, 0, 0, 14); b.cyl(r, r, .05, "body", 0, 0, 0, 16); b.cyl(r * .9, r * .5, .12, "body", 0, h - .12, 0, 16); return; }
    const top = st === "broken" || b.cond === "ruined" ? h * (.4 + b.r() * .3) : h;
    b.box(w * 1.15, .1, w * 1.15, "body"); b.lathe([[r * 1.02, 0], [r * 1.02, .06], [r * .9, .1], [0, .1]], "body", 0, .1, 0, 22);
    const shaft = b.cyl(r * .78, r * .88, top - .2 - (top === h ? .25 : 0), "body", 0, .2, 0, st === "fluted" ? 16 : 24);
    if (top === h) { b.lathe([[r * .78, 0], [r * 1.05, .14], [r * 1.05, .17], [0, .17]], "body", 0, h - .25, 0, 22); b.box(w * 1.2, .08, w * 1.2, "body", 0, h - .08); }
    else { for (let i = 0; i < 3; i++) lump(b, r * (.35 + b.r() * .2), "body", (b.r() - .5) * w * 2.5, .1, (b.r() - .5) * w * 2.5, .7); }
    if (st === "fluted") for (let i = 0; i < 12; i++) { const a = i * TAU / 12; b.box(.015, top - .25, .015, "coal", Math.cos(a) * r * .84, .2, Math.sin(a) * r * .84); }
    if (p.vines) for (let i = 0; i < 3; i++) b.tube(Array.from({ length: 8 }, (_, k) => [Math.cos(k * .9 + i * 2) * r * .9, .1 + k * top / 8, Math.sin(k * .9 + i * 2) * r * .9]), .015, "leaf");
    void shaft;
  });

  G("arch", (b, p) => {
    const { w, d, h } = p, t = p.t || .4, ow = w - t * 2, r = ow / 2, sh = h - r - t * .5;
    for (const sx of [-1, 1]) b.box(t, sh, d, "body", sx * (w / 2 - t / 2));
    const pts = []; for (let i = 0; i <= 16; i++) { const a = PI - i * PI / 16; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const outer = [[-w / 2, 0], ...pts, [w / 2, 0], [w / 2, r + t * .5], [-w / 2, r + t * .5]];
    b.ext(outer.map(([x, y]) => [x, y]), d, "body", 0, sh, 0);
    if (p.key) b.ext([[-.1, 0], [.1, 0], [.14, .22], [-.14, .22]], d + .04, "body", 0, sh + r - .05, 0);
  });

  G("brazier", (b, p) => {
    const { w, h } = p, st = p.style || "tripod", lit = b.cond !== "ruined" && !p.off;
    if (st === "bowl") { b.lathe([[w * .3, 0], [w * .25, h * .6], [w * .5, h * .9], [w * .5, h], [0, h * .7]], "body", 0, 0, 0, 18); }
    else { for (let i = 0; i < 3; i++) { const a = i * TAU / 3; strut(b, [Math.cos(a) * w * .45, 0, Math.sin(a) * w * .45], [Math.cos(a) * w * .25, h * .75, Math.sin(a) * w * .25], .015, "body"); } b.lathe([[0, 0], [w * .3, .02], [w * .5, h * .25], [w * .48, h * .25], [0, .03]], "body", 0, h * .72, 0, 18); }
    if (lit) { for (let i = 0; i < 5; i++) b.cone(w * .12 + b.r() * w * .1, h * .3 + b.r() * h * .3, i % 2 ? "fire" : "ember", (b.r() - .5) * w * .3, h * .92, (b.r() - .5) * w * .3, 8); for (let i = 0; i < 6; i++) b.sph(w * .07, "ember", (b.r() - .5) * w * .5, h * .93, (b.r() - .5) * w * .5, .6, 6); }
    else b.cyl(w * .4, w * .4, .03, "coal", 0, h * .9, 0, 14);
  });

  G("banner", (b, p) => {
    const { w, h } = p, st = p.style || "wall", c1 = p.c1 || "#7a1f1f", c2 = p.c2 || "#d9b04a", em = p.emblem || "lion";
    const art = (g, W, Hh) => {
      g.fillStyle = c1; g.fillRect(0, 0, W, Hh); g.strokeStyle = c2; g.lineWidth = W * .04; g.strokeRect(W * .06, W * .06, W * .88, Hh - W * .12);
      g.fillStyle = c2; const cx = W / 2, cy = Hh * .42, s = W * .28;
      if (em === "lion" || em === "beast") { g.beginPath(); g.ellipse(cx, cy, s * .8, s * .5, 0, 0, 7); g.fill(); g.beginPath(); g.arc(cx + s * .6, cy - s * .5, s * .35, 0, 7); g.fill(); for (let i = 0; i < 4; i++) g.fillRect(cx - s * .7 + i * s * .45, cy + s * .3, s * .12, s * .6); }
      else if (em === "tree") { g.fillRect(cx - s * .1, cy, s * .2, s * 1.1); g.beginPath(); g.arc(cx, cy, s * .7, 0, 7); g.fill(); }
      else if (em === "star") { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -H + i * PI / 5, rr = i % 2 ? s * .35 : s * .85; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); }
      else if (em === "eye") { g.beginPath(); g.ellipse(cx, cy, s, s * .45, 0, 0, 7); g.fill(); g.fillStyle = c1; g.beginPath(); g.arc(cx, cy, s * .3, 0, 7); g.fill(); }
      else if (em === "cross") { g.fillRect(cx - s * .15, cy - s * .8, s * .3, s * 1.8); g.fillRect(cx - s * .7, cy - s * .35, s * 1.4, s * .3); }
      else if (em === "skull") { g.beginPath(); g.arc(cx, cy - s * .1, s * .6, 0, 7); g.fill(); g.fillRect(cx - s * .35, cy + s * .3, s * .7, s * .4); g.fillStyle = c1; g.beginPath(); g.arc(cx - s * .25, cy - s * .1, s * .15, 0, 7); g.arc(cx + s * .25, cy - s * .1, s * .15, 0, 7); g.fill(); }
      else if (em === "sun") { g.beginPath(); g.arc(cx, cy, s * .45, 0, 7); g.fill(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillRect(cx + Math.cos(a) * s * .6 - 4, cy + Math.sin(a) * s * .6 - 4, 8, 8); } }
      else if (em === "corp") { g.font = `bold ${s}px Arial`; g.textAlign = "center"; g.fillText(p.text || "ARC", cx, cy + s * .35); }
      if (b.cond === "damaged" || b.cond === "ruined" || b.cond === "burned") { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(Math.random() * W, Hh); g.lineTo(Math.random() * W, Hh * (.6 + Math.random() * .3)); g.lineTo(Math.random() * W, Hh); g.fill(); } g.globalCompositeOperation = "source-over"; }
    };
    const cloth = () => { b.part(() => b.decal("ban" + c1 + c2 + em + (p.text || "") + b.cond, art, w * .92, h * .82, 0, null, true), 0, h * .5, .02); };
    if (st === "standing") { b.cyl(.15, .2, .08, "pole" in (p.m || {}) ? "pole" : "iron", 0, 0, 0, 12); b.cyl(.02, .02, h + .4, "pole" in (p.m || {}) ? "pole" : "oak", 0, 0, 0, 8); b.rod(.015, w, "pole" in (p.m || {}) ? "pole" : "oak", 0, h + .3, .03); b.part(cloth, 0, h * .2 - .08, 0); b.sph(.04, "gold", 0, h + .42, 0, 1, 10); return; }
    b.rod(.015, w + .1, "pole" in (p.m || {}) ? "pole" : "oak", 0, h * .92, -p.d / 2 + .04); b.part(cloth, 0, h * .05, -p.d / 2 + .03);
  });

  G("tapestry", (b, p) => {
    const { w, h } = p, c1 = p.c1 || "#5a2e1f", c2 = p.c2 || "#c9a24a";
    b.rod(.02, w + .12, "brass", 0, h - .02, -p.d / 2 + .04);
    b.part(() => b.decal("tap" + c1 + c2 + (p.scene || "") + b.cond, (g, W, Hh) => {
      g.fillStyle = c1; g.fillRect(0, 0, W, Hh); g.strokeStyle = c2; g.lineWidth = W * .02; g.strokeRect(W * .04, W * .04, W * .92, Hh - W * .08);
      g.fillStyle = "#3d5a3a"; g.fillRect(W * .08, Hh * .7, W * .84, Hh * .2);
      g.fillStyle = c2; for (let i = 0; i < 5; i++) { const x = W * (.15 + i * .17), y = Hh * .62; g.beginPath(); g.arc(x, y - Hh * .12, W * .025, 0, 7); g.fill(); g.fillRect(x - W * .02, y - Hh * .1, W * .04, Hh * .12); }
      g.fillStyle = "#8a6438"; g.beginPath(); g.moveTo(W * .5, Hh * .15); g.lineTo(W * .7, Hh * .45); g.lineTo(W * .3, Hh * .45); g.fill();
      for (let x = 0; x < W; x += 6) { g.fillStyle = c2; g.fillRect(x, Hh - 8, 3, 8); }
    }, w, h * .96, 0, null, true), 0, h / 2 - .02, -p.d / 2 + .05);
  });

  G("well", (b, p) => {
    const { w, h } = p, r = w / 2;
    b.lathe([[r, 0], [r, .75], [r - .15, .75], [r - .15, .05], [0, .05]], "body", 0, 0, 0, 24); b.cyl(r - .17, r - .17, .01, "water", 0, .3, 0, 20);
    if (p.roof !== false) { for (const sx of [-1, 1]) b.box(.1, h - .4, .1, "frame" in (p.m || {}) ? "frame" : "oak", sx * (r - .05), .2, 0); b.rod(.04, w, "frame" in (p.m || {}) ? "frame" : "oak", 0, h - .8, 0); b.tube([[r, h - .8, 0], [r + .15, h - .8, 0], [r + .15, h - .95, 0]], .015, "iron"); b.ext([[-w * .65, 0], [w * .65, 0], [0, .55]], w * .9, "roof" in (p.m || {}) ? "roof" : "plank", 0, h - .55, 0, H); b.cyl(.004, .004, .7, "rope", 0, h - 1.5, 0, 4); b.lathe([[.1, 0], [.12, .2], [0, .2]], "oak", 0, h - 1.7, 0, 12); }
  });

  G("cart", (b, p) => {
    const { w, d, h } = p, st = p.style || "hand", wr = st === "wagon" ? .4 : .45, bedY = wr + .1;
    b.box(w, .06, d * (st === "hand" ? .6 : .85), "body", 0, bedY, st === "hand" ? -d * .1 : 0);
    for (const sx of [-1, 1]) b.box(.04, .35, d * (st === "hand" ? .6 : .85), "body", sx * (w / 2 - .02), bedY + .06, st === "hand" ? -d * .1 : 0);
    b.box(w, .35, .04, "body", 0, bedY + .06, -d * (st === "hand" ? .4 : .425));
    const wheels = st === "hand" ? [[-d * .1]] : [[-d * .3], [d * .3]];
    for (const [z] of wheels) for (const sx of [-1, 1]) wheel(b, wr, .07, "frame" in (p.m || {}) ? "frame" : "oak", sx * (w / 2 + .06), wr, z, 8, "iron");
    for (const [z] of wheels) b.rod(.03, w + .2, "iron", 0, wr, z);
    if (st === "hand" || st === "wagon") for (const sx of [-1, 1]) b.box(.05, .05, d * .5, "body", sx * w * .3, bedY - .05, d * .35);
    if (st === "merchant") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.025, .025, 1.3, "body", sx * (w / 2 - .03), bedY + .06, sz * (d * .42 - .03), 8); b.part(() => b.cyl(w * .55, w * .55, d * .85, "canvas" in (p.m || {}) ? "canvas" : "canvas", 0, 0, 0, 16, H), 0, bedY + 1.36, 0).scale.y = .4; }
    if (p.fill === "hay") b.box(w - .1, .4, d * .6, "hay", 0, bedY + .06, -d * .05);
    else if (p.fill === "goods") for (let i = 0; i < 4; i++) b.box(.3, .3, .3, pick(b, ["pine", "burlap", "oak"]), (i % 2 - .5) * .35, bedY + .06 + ((i / 2) | 0) * .3, -d * .1);
    else if (p.fill === "corpse") b.rbox(w * .5, .2, d * .5, .08, "burlap", 0, bedY + .06, 0);
    if (b.broken) b.part(() => wheel(b, wr, .07, "oak", 0, 0, 0, 8), w / 2 + .3, .04, d * .1, H, 0, 0);
  });

  G("hay", (b, p) => {
    const { w, d, h } = p, st = p.style || "bale";
    if (st === "round") { b.part(() => b.cyl(h / 2, h / 2, w, "body", 0, 0, 0, 22, 0, H), 0, h / 2, 0); return; }
    if (st === "pile") { lump(b, w * .45, "body", 0, 0, 0, h / w * 1.6, .25); return; }
    const n = p.n || 1; for (let i = 0; i < n; i++) { const y = i > 2 ? h : 0, x = (i % 3 - (n > 1 ? 1 : 0)) * w * .52; b.box(w * .5 * (n > 1 ? 1 : 2), h, d, "body", x * (n > 1 ? 1 : 0), y, 0, 0, (b.r() - .5) * .1, 0); for (const k of [-.25, .25]) b.box(w * (n > 1 ? .5 : 1) + .005, .015, .015, "rope", x * (n > 1 ? 1 : 0), y + h * .5, k * d, 0, 0, 0); }
  });

  G("woodpile", (b, p) => {
    const { w, d, h } = p, rows = Math.max(1, Math.round(h / .16));
    for (let r = 0; r < rows; r++) { const n = Math.max(1, Math.round(w / .16) - (r % 2)); for (let i = 0; i < n; i++) b.part(() => b.cyl(.075, .075, d, "bark", 0, 0, 0, 9, H), -w / 2 + .08 + i * .16 + (r % 2) * .08, .075 + r * .14, 0, 0, (b.r() - .5) * .1, 0); }
    if (p.axe) { b.cyl(.2, .22, .4, "bark", w / 2 + .35, 0, 0, 12); b.part(() => { b.box(.03, .6, .03, "oak", 0, 0); b.ext([[0, 0], [.14, -.06], [.16, .09], [0, .04]], .012, "steel", .01, .5, 0); }, w / 2 + .35, .4, 0, 0, 0, -.5); }
  });

  G("tent", (b, p) => {
    const { w, d, h } = p, st = p.style || "ridge";
    if (st === "pavilion") { b.cyl(w / 2, w / 2, h * .55, "body", 0, 0, 0, 24).material.side = 2; b.cone(w * .55, h * .45, "roof" in (p.m || {}) ? "roof" : "body", 0, h * .55, 0, 24); b.cyl(.02, .02, .4, "oak", 0, h, 0, 6); b.ext([[0, 0], [.3, -.08], [0, -.16]], .005, "red", .02, h + .3, 0); return; }
    if (st === "yurt") { b.cyl(w / 2, w / 2, h * .5, "body", 0, 0, 0, 24); b.cone(w * .52, h * .5, "body", 0, h * .5, 0, 24); b.box(.6, 1.1, .05, "oak", 0, 0, w / 2); return; }
    b.ext([[-w / 2, 0], [w / 2, 0], [0, h]], d, "body", 0, 0, 0, H);
    b.box(.02, h, .02, "pole" in (p.m || {}) ? "pole" : "oak", 0, 0, d / 2 + .01); b.box(.02, h, .02, "pole" in (p.m || {}) ? "pole" : "oak", 0, 0, -d / 2 - .01);
    b.ext([[-w * .3, 0], [0, 0], [0, h * .7]], .01, "body", w * .3, 0, d / 2 + .02, -.5);
    b.ext([[0, 0], [w * .1, 0], [0, h * .95]], .01, "coal", -w * .05, 0, d / 2 + .005);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.01, .01, .15, "oak", sx * (w / 2 + .25), 0, sz * d * .4, 6);
  });

  G("campfire", (b, p) => {
    const { w } = p, lit = b.cond !== "ruined" && !p.off;
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10; lump(b, .08 + b.r() * .03, "granite", Math.cos(a) * w * .42, .04, Math.sin(a) * w * .42, .7, .4, 0); }
    for (let i = 0; i < 4; i++) b.part(() => b.cyl(.04, .035, w * .6, "bark", 0, 0, 0, 8, H), 0, .07, 0, (b.r() - .5) * .3, i * PI / 4, 0);
    if (lit) { b.cone(w * .2, w * .5, "fire", 0, .05, 0, 9); for (let i = 0; i < 4; i++) b.cone(w * .1, w * .3, "ember", (b.r() - .5) * w * .2, .05, (b.r() - .5) * w * .2, 8); }
    else b.cyl(w * .3, w * .3, .02, "coal", 0, 0, 0, 14);
    if (p.spit) { for (const sx of [-1, 1]) { plank(b, [sx * w * .5, 0, -.12], [sx * w * .5, .6, 0], .03, .03, "oak"); plank(b, [sx * w * .5, 0, .12], [sx * w * .5, .6, 0], .03, .03, "oak"); } b.rod(.012, w * 1.1, "iron", 0, .58, 0); b.part(() => b.sph(.12, "meat", 0, 0, 0, .7, 10).scale.x = 1.6, 0, .5, 0); }
    if (p.pot) b.part(() => { b.lathe([[.1, 0], [.17, .08], [.18, .2], [.15, .24], [0, .02]], "iron", 0, 0, 0, 16); b.cyl(.15, .15, .01, "meat", 0, .2, 0, 14); }, 0, .12, 0);
  });

  G("stocks", (b, p) => {
    const { w, h } = p, st = p.style || "stocks";
    for (const sx of [-1, 1]) b.box(.12, h, .12, "body", sx * (w / 2 - .06));
    b.box(w, .25, .1, "body", 0, st === "pillory" ? h * .62 : .35); b.box(w, .2, .1, "body", 0, st === "pillory" ? h * .62 + .25 : .6);
    const holes = st === "pillory" ? [[0, .12], [-.3, .06], [.3, .06]] : [[-.3, .07], [-.1, .07], [.1, .07], [.3, .07]];
    for (const [x, r] of holes) b.cyl(r, r, .11, "coal", x, (st === "pillory" ? h * .62 : .35) + .25, 0, 14, H);
    if (st === "stocks") b.box(w, .06, .4, "body", 0, .3, -.3);
  });

  G("cage", (b, p) => {
    const { w, d, h } = p, st = p.style || "box", bar = has(p, "bars") ? "bars" : "body";
    if (st === "hanging") { const r = w / 2; b.cyl(.005, .005, h * .3, "iron", 0, h * .7, 0, 6); b.cyl(r, r, .04, bar, 0, 0, 0, 16); b.cone(r, h * .2, bar, 0, h * .5, 0, 16); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; b.cyl(.01, .01, h * .5, bar, Math.cos(a) * r * .97, 0, Math.sin(a) * r * .97, 6); } if (p.bones) P.skull(b, 0, .04, 0, .5); return; }
    b.box(w, .06, d, bar); b.box(w, .06, d, bar, 0, h - .06);
    const nx = Math.max(3, Math.round(w / .12)), nz = Math.max(3, Math.round(d / .12));
    for (let i = 0; i <= nx; i++) for (const sz of [-1, 1]) { if (b.broken && i === 2 && sz > 0) continue; b.cyl(.012, .012, h - .1, bar, -w / 2 + i * w / nx, .05, sz * d / 2, 6); }
    for (let i = 1; i < nz; i++) for (const sx of [-1, 1]) b.cyl(.012, .012, h - .1, bar, sx * w / 2, .05, -d / 2 + i * d / nz, 6);
    if (p.straw) b.box(w * .7, .03, d * .6, "hay", 0, .06, 0);
  });

  G("coffin", (b, p) => {
    const { w, d, h } = p, st = p.style || "coffin";
    if (st === "maiden") { b.lathe([[w * .4, 0], [w * .5, h * .3], [w * .45, h * .7], [w * .3, h * .85], [w * .25, h * .95], [0, h]], "body", 0, 0, 0, 20).scale.z = d / w; b.sph(w * .2, "body", 0, h * .85, d * .38, .9, 12); for (const s of [-1, 1]) b.sph(.02, "coal", s * w * .07, h * .87, d * .5, 1, 6); b.box(w * .02, h * .7, .02, "coal", 0, h * .1, d / 2 + .005); b.box(w * .9, .04, d + .02, "band" in (p.m || {}) ? "band" : "iron", 0, h * .3); b.box(w * .8, .04, d + .02, "band" in (p.m || {}) ? "band" : "iron", 0, h * .65); return; }
    if (st === "sarcophagus") { b.box(w, h * .75, d, "body"); b.box(w + .08, h * .08, d + .08, "body", 0, 0); b.part(() => { b.box(w + .06, h * .12, d + .06, "body"); b.sph(w * .18, "body", 0, h * .14, -d * .32, .6, 12); b.box(w * .5, h * .1, d * .6, "body", 0, h * .12, .05); }, 0, h * .75, p.open ? d * .35 : 0, 0, p.open ? .3 : 0, 0); if (p.open) b.box(w - .1, .01, d - .1, "coal", 0, h * .74, 0); return; }
    const pts = [[-w * .32, -d / 2], [w * .32, -d / 2], [w / 2, -d * .2], [w * .36, d / 2], [-w * .36, d / 2], [-w / 2, -d * .2]];
    b.slab(pts, h * .8, "body"); for (const sx of [-1, 1]) b.box(.12, .03, .03, "handle" in (p.m || {}) ? "handle" : "brass", sx * w * .45, h * .4, d * .1);
    if (p.open) { b.part(() => b.slab(pts, h * .2, "body"), w * .6, 0, 0, 0, .25, 0); b.slab(pts.map(([x, z]) => [x * .85, z * .92]), .01, "satin" in (p.m || {}) ? "satin" : "red", 0, h * .7, 0); if (p.bones) { P.skull(b, 0, h * .7, -d * .32, 0); for (let i = 0; i < 4; i++) P.bone(b, (b.r() - .5) * w * .3, h * .7, (b.r() - .3) * d * .5, H + (b.r() - .5)); } }
    else { b.slab(pts.map(([x, z]) => [x * 1.03, z * 1.02]), h * .2, "body", 0, h * .8, 0); if (p.cross) { b.box(.04, .01, d * .4, "brass", 0, h + .003, -.05); b.box(w * .3, .01, .04, "brass", 0, h + .003, -d * .15); } }
  });

  G("grave", (b, p) => {
    const { w, d, h } = p, st = p.style || "headstone";
    const tilt = b.cond === "ruined" || b.cond === "damaged" ? (b.r() - .5) * .3 : 0;
    if (st === "mound") { b.part(() => b.sph(.5, "dirt", 0, 0, 0, .3, 14), 0, 0, 0).scale.set(w, 1, d); b.ext([[-.25, 0], [.25, 0], [.25, .5], [0, .62], [-.25, .5]], .08, "granite", 0, 0, -d / 2 + .05, 0); return; }
    if (st === "open") { b.box(w, .01, d, "coal", 0, 0, 0); b.part(() => b.sph(.5, "dirt", 0, 0, 0, .4, 12), w * .9, 0, 0).scale.set(w * .7, 1, d * .9); b.part(() => { b.box(.03, 1.2, .03, "oak"); b.box(.25, .3, .02, "steel", 0, -.05); }, w * .7, .15, d * .3, 0, 0, .35); return; }
    const stone = () => {
      if (st === "cross") { b.box(.12, h, .1, "body", 0, 0); b.box(w, .12, .1, "body", 0, h * .65); return; }
      if (st === "celtic") { b.box(.14, h, .12, "body", 0, 0); b.box(w, .14, .12, "body", 0, h * .65); b.tor(w * .25, .03, "body", 0, h * .72, 0, 0); return; }
      if (st === "obelisk") { b.box(w * 1.3, .15, w * 1.3, "body"); b.cyl(w * .3, w * .45, h - .3, "body", 0, .15, 0, 4).rotation.y = PI / 4; b.cone(w * .32, .15, "body", 0, h - .15, 0, 4).rotation.y = PI / 4; return; }
      if (st === "angel") { b.box(w, .3, d, "body"); b.lathe([[w * .25, 0], [w * .18, h * .45], [w * .12, h * .55], [0, h * .55]], "body", 0, .3, 0, 14); b.sph(w * .1, "body", 0, h * .9, 0, 1.1, 10); for (const sx of [-1, 1]) b.ext([[0, 0], [w * .4, h * .2], [w * .3, -h * .15]], .02, "body", sx * w * .05, h * .7, -d * .1, sx < 0 ? PI + .3 : -.3); return; }
      b.ext([[-w / 2, 0], [w / 2, 0], [w / 2, h * .8], [w * .35, h * .95], [0, h], [-w * .35, h * .95], [-w / 2, h * .8]], d, "body", 0, 0, 0);
      b.decal("rip" + (p.text || ""), (g, W, Hh) => { g.fillStyle = "rgba(30,26,22,.65)"; g.font = `bold ${W / 5}px serif`; g.textAlign = "center"; g.fillText(p.text || "R.I.P.", W / 2, Hh * .3); for (let i = 0; i < 3; i++) g.fillRect(W * .2, Hh * (.45 + i * .14), W * .6, Hh * .03); }, w * .8, h * .6, 0, null, true).position.set(0, h * .55, d / 2 + .002);
    };
    b.part(stone, 0, 0, 0, tilt, 0, tilt * .5);
    if (p.plot) { b.box(w * 1.2, .1, 1.9, "body", 0, 0, .95 + d / 2); b.box(w * 1.1, .02, 1.8, "dirt", 0, .1, .95 + d / 2); }
  });

  G("stall", (b, p) => {
    const { w, d, h } = p, st = p.style || "market", c1 = p.c1 || "#b8231d", c2 = p.c2 || "#efe6cf";
    b.box(w, .8, d * .5, "body", 0, 0, d * .2); b.box(w + .05, .04, d * .55, "top" in (p.m || {}) ? "top" : "body", 0, .8, d * .2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.05, h, .05, "body", sx * (w / 2 - .03), 0, sz * (d / 2 - .03));
    b.part(() => b.decal("awn" + c1 + c2, (g, W, Hh) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(i * W / 8, 0, W / 8, Hh); } }, w + .2, d + .3, 0), 0, h, .1, -.2, 0, 0);
    b.part(() => b.box(w + .2, .02, d + .3, "canvas"), 0, h - .02, .1, -.2, 0, 0);
    if (st === "cyber") { b.box(w, .03, .03, "glowmagenta", 0, h - .1, d / 2); b.sign(p.text || "RAMEN", w * .5, .25, "#120a1a", "#ff5adc", 0, h + .2, d / 2, 0, true); for (let i = 0; i < 3; i++) P.plate(b, -w * .3 + i * w * .3, .84, d * .25, "stew"); return; }
    const goods = p.goods || "produce";
    for (let i = 0; i < Math.round(w / .35); i++) { const x = -w / 2 + .2 + i * .35; if (goods === "produce") { b.box(.3, .1, .3, "pine", x, .84, d * .2); for (let k = 0; k < 5; k++) b.sph(.04, pick(b, ["fruitred", "fruitgreen", "fruityellow"]), x + (b.r() - .5) * .2, .96, d * .2 + (b.r() - .5) * .2, 1, 8); } else if (goods === "pots") b.lathe([[.06, 0], [.12, .1], [.08, .22], [.09, .25], [0, .25]], "terracotta", x, .84, d * .2, 12); else if (goods === "cloth") b.box(.3, .06, .35, pick(b, ["red", "blue", "green", "purple", "mustard"]), x, .84, d * .2); else if (goods === "fish") P.plate(b, x, .84, d * .2, "meat"); else if (goods === "potions") P.flask(b, x, .84, d * .2, pick(b, ["glowgreen", "glowviolet", "glowred"])); }
  });

  G("signpost", (b, p) => {
    const { h } = p, st = p.style || "post";
    if (st === "board") { for (const sx of [-1, 1]) b.box(.08, h, .08, "body", sx * .6); b.box(1.3, .9, .05, "body", 0, h * .35); for (let i = 0; i < 5; i++) b.box(.2, .26, .002, pick(b, ["paper", "parchment"]), -.45 + i * .22, h * .35 + .3 + (b.r() - .5) * .3, .028, 0, 0, (b.r() - .5) * .2); b.ext([[-.75, 0], [.75, 0], [0, .3]], .3, "roof" in (p.m || {}) ? "roof" : "plank", 0, h - .05, 0); return; }
    if (st === "hanging") { b.box(.1, h, .1, "body"); b.box(.9, .06, .06, "body", .45, h - .2); b.part(() => { b.box(.6, .45, .04, "sign" in (p.m || {}) ? "sign" : "oak"); b.sign(p.text || "THE INN", .55, .2, "#5b3b22", "#d9b04a", 0, .22, .022); }, .55, h - .7, 0); return; }
    b.box(.1, h, .1, "body"); const dirs = p.text ? p.text.split("|") : ["NORTH", "TOWN", "MINE"];
    dirs.forEach((t, i) => b.part(() => { b.ext([[0, 0], [.7, 0], [.8, .09], [.7, .18], [0, .18]], .04, "body"); b.sign(t, .55, .12, "#9c7650", "#2b1d10", .35, .09, .022); }, 0, h - .3 - i * .25, 0, 0, i * 1.9 - 1, 0));
  });

  /* ================= starships, stations and laboratories ================= */
  G("console", (b, p) => {
    const { w, d, h } = p, st = p.style || "desk", sc = has(p, "screen") ? "screen" : "screen";
    if (st === "kiosk") { b.rbox(w * .6, .08, d * .6, .02, "body"); b.box(.12, h * .7, .12, "body", 0, .08); b.part(() => { b.rbox(w, h * .35, .08, .03, "body"); b.box(w - .06, h * .3, .005, sc, 0, h * .025, .042); }, 0, h * .65, 0, -.3, 0, 0); return; }
    if (st === "wall") { b.rbox(w, h, .12, .03, "body", 0, 0, -d / 2 + .06); b.box(w - .1, h * .5, .005, sc, 0, h * .4, -d / 2 + .123); for (let i = 0; i < 8; i++) b.box(.05, .03, .02, pick(b, ["glowgreen", "glowred", "glowamber", "glowcyan"]), -w / 2 + .1 + i * (w - .2) / 7, h * .15, -d / 2 + .12); return; }
    if (st === "bridge") { const pts = []; for (let i = 0; i <= 12; i++) { const a = PI + i * PI / 12; pts.push([Math.cos(a) * w / 2, Math.sin(a) * d * .9 + d / 2]); } for (let i = 12; i >= 0; i--) { const a = PI + i * PI / 12; pts.push([Math.cos(a) * (w / 2 - d * .5), Math.sin(a) * d * .4 + d / 2]); } b.slab(pts, h * .9, "body", 0, 0, -d * .2); for (let i = 0; i < 5; i++) { const a = PI + (i + .5) * PI / 5, x = Math.cos(a) * w * .38, z = Math.sin(a) * d * .62 + d / 2 - d * .2; b.part(() => { b.box(w * .16, .01, .2, sc); }, x, h * .9 + .005, z, -.4, -a - H, 0); } return; }
    if (st === "station") { b.rbox(w, h * .75, d, .04, "body"); b.part(() => { b.box(w, .04, d * .7, "body"); b.box(w - .06, .005, d * .6, sc, 0, .04); for (let i = 0; i < 12; i++) b.box(.03, .012, .03, pick(b, ["glowgreen", "glowred", "glowamber", "glowcyan", "pgrey"]), -w * .4 + (i % 6) * w * .16, .045, d * .25 + ((i / 6) | 0) * .05 - .2); }, 0, h * .75, d * .1, .35, 0, 0); b.box(w * .9, h * .4, .05, "body", 0, h * .75, -d / 2 + .03); b.box(w * .85, h * .34, .005, sc, 0, h * .78, -d / 2 + .056); return; }
    // a desk with screens and keys
    b.box(w, h * .97, d * .6, "body", 0, 0, -d * .2); b.part(() => { b.box(w, .04, d * .5, "body"); for (let i = 0; i < 16; i++) b.box(.035, .012, .035, pick(b, ["glowgreen", "glowred", "glowamber", "glowcyan", "pgrey", "pgrey"]), -w * .42 + (i % 8) * w * .12, .04, -.05 + ((i / 8) | 0) * .06); }, 0, h * .97, d * .1, .25, 0, 0);
    for (let i = 0; i < Math.max(1, Math.round(w / .6)); i++) P.monitor(b, -w / 2 + (i + .5) * w / Math.max(1, Math.round(w / .6)), h, -d * .3, 0, sc, 1);
  });

  G("pod", (b, p) => {
    const { w, d, h } = p, st = p.style || "cryo", lit = b.cond !== "ruined";
    b.rbox(w, .25, d, .05, "body"); b.rbox(w, h - .25, .15, .05, "body", 0, .25, -d / 2 + .075);
    b.part(() => b.cyl(w / 2, w / 2, h - .3, st === "cryo" ? (b.broken ? "glass" : "frosted") : "glass", 0, 0, 0, 24), 0, .25, .02).scale.z = d / w;
    b.rbox(w, .2, d, .05, "body", 0, h - .2);
    if (lit) { b.box(w * .7, .02, .02, st === "cryo" ? "glowcyan" : "glowgreen", 0, .25, d / 2 - .02); b.box(w * .7, .02, .02, st === "cryo" ? "glowcyan" : "glowgreen", 0, h - .22, d / 2 - .02); }
    if (st === "specimen") { b.cyl(w * .45, w * .45, (h - .5) * (b.broken ? .2 : .9), lit ? "glowgreen" : "slime", 0, .25, 0, 20).material; if (!b.broken) { b.sph(w * .18, "flesh", 0, h * .55, 0, 1.3, 12); for (let i = 0; i < 4; i++) b.tube([[0, h * .45, 0], [(b.r() - .5) * w * .5, h * .3, (b.r() - .5) * w * .3], [(b.r() - .5) * w * .6, h * .2, (b.r() - .5) * w * .3]], .015, "flesh"); } }
    else if (st === "cryo" && !b.broken) { b.cyl(w * .2, w * .2, h * .6, "frosted", 0, .3, 0, 12); b.sph(w * .15, "frosted", 0, h * .8, 0, 1.2, 10); }
    b.box(.2, .14, .02, "screen", w * .25, h * .5, -d / 2 + .16);
    if (b.broken) for (let i = 0; i < 6; i++) b.box(.08 + b.r() * .1, .005, .06 + b.r() * .08, "glass", (b.r() - .5) * w * 2, .003, d / 2 + b.r() * .4, 0, b.r() * 3, 0);
  });

  G("reactor", (b, p) => {
    const { w, h } = p, r = w / 2, st = p.style || "core", lit = b.cond !== "ruined";
    if (st === "generator") { b.box(w, h * .7, p.d, "body"); for (let i = 0; i < 8; i++) b.box(w + .02, .02, p.d + .02, "body", 0, .1 + i * h * .07); b.cyl(.08, .08, h * .4, "body", w * .3, h * .7, 0, 12); b.box(.25, .2, .02, "screen", -w * .25, h * .4, p.d / 2 + .01); b.box(.06, .04, .02, lit ? "glowgreen" : "pgrey", -w * .4, h * .6, p.d / 2 + .01); return; }
    b.cyl(r, r * 1.1, h * .12, "body", 0, 0, 0, 24); b.cyl(r * 1.05, r, h * .1, "body", 0, h * .9, 0, 24);
    b.cyl(r * .45, r * .45, h * .78, lit ? (has(p, "core") ? "core" : "glowcyan") : "glass", 0, h * .12, 0, 20);
    for (let i = 0; i < 4; i++) b.tor(r * .6, .04, "body", 0, h * (.25 + i * .18), 0);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + PI / 4; b.box(.12, h * .78, .12, "body", Math.cos(a) * r * .75, h * .12, Math.sin(a) * r * .75); b.tube([[Math.cos(a) * r * .8, h * .5, Math.sin(a) * r * .8], [Math.cos(a) * r * 1.3, h * .5, Math.sin(a) * r * 1.3], [Math.cos(a) * r * 1.4, 0, Math.sin(a) * r * 1.4]], .06, "pipe" in (p.m || {}) ? "pipe" : "steel"); }
  });

  G("server", (b, p) => {
    const { d, h } = p, n = p.n || 1, w = p.w / n, lit = b.cond !== "ruined";
    for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * w; b.box(w - .01, h, d, "body", x); b.box(w - .08, h - .1, .01, "glass", x, .05, d / 2 + .005);
      for (let i = 0; i < 14; i++) { const y = .1 + i * (h - .2) / 14; b.box(w - .12, (h - .2) / 14 - .015, .005, "pblack", x, y, d / 2 - .01); if (lit) for (let j = 0; j < 4; j++) if (b.r() < .6) b.box(.012, .008, .004, pick(b, ["glowgreen", "glowgreen", "glowamber", "glowcyan", "glowred"]), x - w * .35 + j * .025, y + .015, d / 2 - .006); } }
  });

  G("holotable", (b, p) => {
    const { w, h } = p, lit = b.cond !== "ruined", show = p.show || "planet";
    b.cyl(w * .3, w * .38, h - .1, "body", 0, 0, 0, 20); b.cyl(w / 2, w / 2, .1, "body", 0, h - .1, 0, 32); b.cyl(w * .45, w * .45, .005, lit ? "glowcyan" : "glass", 0, h, 0, 32);
    if (!lit) return;
    // the projection: light you can see through
    const holo = b.mat("glowcyan").clone(); holo.transparent = true; holo.opacity = .45; holo.depthWrite = false;
    b.cone(w * .45, .4, holo, 0, h, 0, 32).rotation.x = PI;
    if (show === "planet") { b.sph(w * .2, holo, 0, h + .55, 0, 1, 18); b.tor(w * .3, .006, holo, 0, h + .55, 0, .3); }
    else if (show === "map") for (let i = 0; i < 9; i++) b.box(.08 + b.r() * .15, .05 + b.r() * .3, .08 + b.r() * .15, holo, (b.r() - .5) * w * .6, h + .05, (b.r() - .5) * w * .6);
    else if (show === "ship") b.part(() => { b.cone(w * .1, w * .5, holo, 0, 0, 0, 4); for (const s of [-1, 1]) b.box(w * .25, .01, .08, holo, s * w * .1, w * .1, 0); }, 0, h + .55, -w * .25, H, 0, 0);
  });

  G("container", (b, p) => {
    const { w, d, h } = p, st = p.style || "shipping";
    if (st === "dumpster") { b.box(w, h * .85, d, "body", 0, .12); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.05, .05, .1, "rubber", sx * (w / 2 - .1), 0, sz * (d / 2 - .1), 10, H); for (const sx of [-1, 1]) b.box(w / 2 - .02, .04, d + .04, "lid" in (p.m || {}) ? "lid" : "pblack", sx * w / 4, h, 0, b.cond === "used" || b.cond === "dirty" ? (sx > 0 ? -.4 : 0) : 0); if (b.cond !== "new") for (let i = 0; i < 4; i++) b.sph(.15, pick(b, ["pblack", "pblack", "cardboard"]), (b.r() - .5) * w * .5, h * .95, (b.r() - .5) * d * .5, .8, 8); return; }
    if (st === "skip") { b.ext([[-w / 2, 0], [w / 2, 0], [w / 2 + .3, h], [-w / 2 - .3, h]], d, "body", 0, 0, 0); b.box(w, .02, d * .9, "dirt", 0, h * .7); return; }
    // a shipping container: ribbed sides, doors at +z, its corners
    b.box(w, h, d, "body");
    for (let i = 0; i < Math.round(d / .28); i++) for (const sx of [-1, 1]) b.box(.03, h - .2, .14, "body", sx * (w / 2 + .01), .1, -d / 2 + .2 + i * .28);
    for (let i = 0; i < Math.round(w / .28); i++) b.box(.14, .03, d - .2, "body", -w / 2 + .2 + i * .28, h, 0);
    for (const sx of [-1, 1]) for (const sy of [0, h - .15]) for (const sz of [-1, 1]) b.box(.16, .15, .16, "steel", sx * (w / 2 - .08), sy, sz * (d / 2 - .08));
    for (const sx of [-1, 1]) { b.box(w / 2 - .05, h - .3, .02, "body", sx * w / 4, .15, d / 2 + .01); for (const k of [-.1, .1]) b.cyl(.015, .015, h - .3, "steel", sx * (w / 4 + k), .15, d / 2 + .03, 8); }
    if (p.text) b.sign(p.text, w * .7, .35, "rgba(0,0,0,0)", "#f2efe6", 0, h * .8, d / 2 + .025);
    if (p.open) b.part(() => b.box(w / 2 - .05, h - .3, .02, "body", w / 4), w / 2, .15, d / 2 + .02, 0, -2.2, 0);
  });

  G("robot", (b, p) => {
    const { w, h } = p, st = p.style || "humanoid", lit = b.cond !== "ruined" && b.cond !== "burned", eye = lit ? (has(p, "eye") ? "eye" : "glowcyan") : "screenoff";
    if (st === "drone") { b.rbox(w * .4, h * .3, w * .4, .05, "body", 0, h * .55); for (let i = 0; i < 4; i++) { const a = PI / 4 + i * H; b.rod(.015, w * .35, "body", Math.cos(a) * w * .25, h * .75, Math.sin(a) * w * .25); b.cyl(w * .14, w * .14, .01, "frosted", Math.cos(a) * w * .38, h * .78, Math.sin(a) * w * .38, 18); } b.sph(.04, eye, 0, h * .6, w * .2, 1, 8); return; }
    if (st === "box") { b.rbox(w, h * .7, w * .8, .05, "body", 0, h * .15); for (const sx of [-1, 1]) b.box(.08, h * .2, w * .8, "rubber", sx * w * .4, 0, 0); b.box(w * .6, h * .12, .01, eye, 0, h * .6, w * .4 + .005); b.cyl(.01, .01, h * .2, "body", w * .3, h * .85, 0, 6); return; }
    if (st === "spider") { b.sph(w * .25, "body", 0, h * .6, 0, .6, 14); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.tube([[Math.cos(a) * w * .15, h * .6, Math.sin(a) * w * .15], [Math.cos(a) * w * .38, h * .95, Math.sin(a) * w * .38], [Math.cos(a) * w * .5, 0, Math.sin(a) * w * .5]], .02, "body"); } for (let i = 0; i < 3; i++) b.sph(.025, eye, (i - 1) * .06, h * .65, w * .23, 1, 8); return; }
    if (st === "mech") { for (const sx of [-1, 1]) { b.rbox(.25, h * .45, .3, .04, "body", sx * w * .25, 0, 0); b.rbox(.32, .1, .45, .03, "body", sx * w * .25, 0, .05); } b.rbox(w * .8, h * .35, w * .6, .08, "body", 0, h * .45); b.rbox(w * .35, h * .12, w * .3, .04, "body", 0, h * .8, w * .05); b.box(w * .25, .04, .01, eye, 0, h * .85, w * .2 + .005); for (const sx of [-1, 1]) { b.rbox(.18, h * .3, .2, .04, "body", sx * w * .52, h * .45); b.cyl(.04, .04, .4, "gunmetal", sx * w * .52, h * .48, .25, 10, H); } return; }
    // a humanoid
    for (const sx of [-1, 1]) { b.rbox(w * .16, h * .45, w * .18, .03, "body", sx * w * .13, 0); b.sph(w * .08, "joint" in (p.m || {}) ? "joint" : "gunmetal", sx * w * .13, h * .45, 0, 1, 10); }
    b.rbox(w * .55, h * .3, w * .32, .05, "body", 0, h * .47); b.box(w * .2, h * .06, .01, eye, 0, h * .62, w * .16 + .002);
    for (const sx of [-1, 1]) { b.sph(w * .09, "joint" in (p.m || {}) ? "joint" : "gunmetal", sx * w * .33, h * .74, 0, 1, 10); b.rbox(w * .12, h * .38, w * .12, .03, "body", sx * w * .35, h * .38); }
    b.rbox(w * .3, h * .16, w * .28, .05, "body", 0, h * .8); b.box(w * .22, h * .035, .01, eye, 0, h * .89, w * .14 + .002);
    if (b.broken) b.part(() => b.rbox(w * .12, h * .38, w * .12, .03, "body"), w * .6, .06, w * .3, 0, .8, H);
  });

  G("turret", (b, p) => {
    const { w, h } = p, st = p.style || "scifi";
    if (st === "mg") { for (let i = 0; i < 3; i++) { const a = i * TAU / 3; strut(b, [Math.cos(a) * w * .45, 0, Math.sin(a) * w * .45], [0, h * .6, 0], .02, "body"); } b.box(.15, .15, .4, "body", 0, h * .6, 0); b.rod(.02, .8, "gunmetal", 0, h * .66, .5, "z"); b.box(.12, .15, .1, "olive", .12, h * .58, 0); return; }
    b.cyl(w * .45, w * .5, h * .4, "body", 0, 0, 0, 20); b.cyl(w * .3, w * .35, h * .15, "body", 0, h * .4, 0, 20);
    b.rbox(w * .55, h * .3, w * .6, .05, "body", 0, h * .55); for (const sx of [-1, 1]) b.cyl(.04, .04, w * .6, "gunmetal", sx * .08, h * .7, w * .5, 10, H);
    b.box(.1, .04, .01, b.cond === "ruined" ? "screenoff" : "glowred", 0, h * .75, w * .3 + .005);
  });

  G("tank", (b, p) => {
    const { w, d, h } = p, st = p.style || "upright";
    if (st === "cylinders") { const n = p.n || 4; for (let i = 0; i < n; i++) { const x = (i % 3 - 1) * .26, z = ((i / 3) | 0) * .26 - .1; b.cyl(.11, .11, h - .1, pick(b, ["pred", "pgreen", "pblue", "steel", "porange"]), x, 0, z, 16); b.sph(.11, "steel", x, h - .1, z, .6, 12); b.cyl(.025, .025, .08, "brass", x, h - .05, z, 8); } b.rod(.01, w, "steel", 0, h * .6, .03); return; }
    if (st === "horizontal") { b.part(() => { b.cyl(h * .45, h * .45, w * .85, "body", 0, 0, 0, 22, 0, H); for (const s of [-1, 1]) b.sph(h * .45, "body", s * w * .425, 0, 0, 1, 18).scale.x = .4; }, 0, h * .5, 0); for (const sx of [-1, 1]) b.ext([[-d * .45, 0], [d * .45, 0], [d * .35, h * .25], [-d * .35, h * .25]], .12, "saddle" in (p.m || {}) ? "saddle" : "concrete", sx * w * .3, 0, 0, H); if (p.text) b.sign(p.text, w * .4, h * .15, "rgba(0,0,0,0)", "#1d1b1a", 0, h * .5, h * .45 + .01); return; }
    if (st === "vat") { b.lathe([[w * .48, 0], [w * .5, h * .9], [w * .48, h * .9], [0, h * .05]], "body", 0, 0, 0, 24); b.cyl(w * .46, w * .46, .01, p.fill || "slime", 0, h * .8, 0, 22); b.tor(w * .5, .02, "body", 0, h * .9, 0); return; }
    b.cyl(w / 2, w / 2, h * .9, "body", 0, 0, 0, 24); b.cone(w / 2, h * .1, "body", 0, h * .9, 0, 24);
    for (const y of [h * .3, h * .6]) b.tor(w / 2 + .01, .015, "body", 0, y, 0);
    for (let i = 0; i < Math.round(h / .3); i++) b.box(.4, .03, .03, "steel", 0, .2 + i * .3, w / 2 + .1); for (const sx of [-1, 1]) b.box(.03, h, .03, "steel", sx * .2, 0, w / 2 + .1);
    if (p.text) b.sign(p.text, w * .6, h * .1, "rgba(0,0,0,0)", "#b8231d", 0, h * .5, w / 2 + .01);
    b.cyl(.05, .05, .02, "steel", w * .3, h * .3, w * .45, 12, H);
  });

  G("dish", (b, p) => {
    const { w, h } = p, st = p.style || "dish";
    if (st === "antenna") { b.box(.5, .05, .5, "body"); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; strut(b, [Math.cos(a) * .3, 0, Math.sin(a) * .3], [0, h, 0], .02, "body"); } for (let k = 0; k < 6; k++) b.rod(.008, .6 - k * .07, "body", 0, h * (.4 + k * .1), 0); b.sph(.03, b.cond === "ruined" ? "pgrey" : "glowred", 0, h, 0, 1, 8); return; }
    b.box(w * .4, .1, w * .4, "body"); b.cyl(.06, .08, h * .5, "body", 0, .1, 0, 12);
    b.part(() => { b.lathe(Array.from({ length: 9 }, (_, i) => [w / 2 * i / 8, (i / 8) ** 2 * w * .25]), "body", 0, 0, 0, 28).material.side = 2; for (let i = 0; i < 3; i++) { const a = i * TAU / 3; strut(b, [Math.cos(a) * w * .45, w * .23, Math.sin(a) * w * .45], [0, w * .55, 0], .01, "body"); } b.sph(.05, "body", 0, w * .55, 0, 1, 8); }, 0, h * .6, 0, -.7, 0, 0);
  });

  G("vent", (b, p) => {
    const { w, d, h } = p, st = p.style || "floor";
    if (st === "wall") { b.box(w, h, .04, "body", 0, 0, -d / 2 + .02); for (let i = 0; i < 6; i++) b.box(w - .06, .015, .03, "coal", 0, .04 + i * (h - .08) / 5, -d / 2 + .03, -.4); return; }
    if (st === "hatch") { b.box(w, .04, d, "frame" in (p.m || {}) ? "frame" : "iron"); for (let i = 0; i < 5; i++) b.box(w - .1, .03, d / 5 - .02, "body", 0, .035, -d / 2 + .05 + (i + .5) * (d - .1) / 5); b.tor(.06, .012, "iron", w * .3, .07, 0); b.box(w - .06, .02, .06, "iron", 0, .06, -d * .3); b.box(w - .06, .02, .06, "iron", 0, .06, d * .3); return; }
    if (st === "manhole") { b.cyl(w / 2, w / 2, .03, "body", 0, 0, 0, 28); b.decal("manhole", (g, W, Hh) => { g.strokeStyle = "rgba(20,20,20,.7)"; g.lineWidth = 6; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(W * .15, Hh * (.15 + i * .1)); g.lineTo(W * .85, Hh * (.15 + i * .1)); g.stroke(); } }, w * .85, w * .85, .032); return; }
    if (st === "fan") { b.box(w, .05, d, "body"); b.cyl(w * .42, w * .42, .01, "coal", 0, .045, 0, 24); for (let i = 0; i < 5; i++) b.part(() => b.box(w * .35, .005, .06, "steel", w * .18), 0, .05, 0, .2, i * TAU / 5, 0); b.cyl(.04, .04, .02, "steel", 0, .05, 0, 10); return; }
    b.box(w, .03, d, "body"); for (let i = 0; i < Math.round(w / .05); i++) b.box(.012, .005, d - .04, "coal", -w / 2 + .03 + i * .05, .028);
  });

  G("medical", (b, p) => {
    const { w, d, h } = p, st = p.style || "iv";
    if (st === "iv") { for (let i = 0; i < 5; i++) { const a = i * TAU / 5; b.box(.02, .02, .25, "steel", Math.sin(a) * .12, .03, Math.cos(a) * .12, 0, a, 0); b.sph(.02, "rubber", Math.sin(a) * .24, .02, Math.cos(a) * .24, 1, 8); } b.cyl(.012, .012, h - .05, "steel", 0, .05, 0, 8); b.tube([[-.15, h - .05, 0], [0, h, 0], [.15, h - .05, 0]], .006, "steel"); b.rbox(.1, .16, .04, .02, b.cond === "ruined" ? "blood" : "gauze", .14, h - .3, 0); b.tube([[.14, h - .3, 0], [.12, h * .5, .1], [.2, .8, .2]], .003, "glass"); return; }
    if (st === "monitor") { for (let i = 0; i < 5; i++) { const a = i * TAU / 5; b.box(.02, .02, .25, "steel", Math.sin(a) * .12, .03, Math.cos(a) * .12, 0, a, 0); } b.cyl(.015, .015, h - .4, "steel", 0, .05, 0, 8); b.rbox(.32, .25, .12, .02, "body", 0, h - .35); b.decal("ecg" + (b.cond || ""), (g, W, Hh) => { g.fillStyle = "#061a12"; g.fillRect(0, 0, W, Hh); g.strokeStyle = b.cond === "ruined" ? "#3a3a3a" : "#7dff9a"; g.lineWidth = 4; g.beginPath(); for (let x = 0; x < W; x += 4) { const k = x % 100; g.lineTo(x, Hh / 2 - (k > 40 && k < 46 ? Hh * .35 : k > 46 && k < 50 ? -Hh * .2 : 0)); } g.stroke(); }, .27, .18, 0, { glow: b.cond !== "ruined" }, true).position.set(0, h - .225, .062); return; }
    if (st === "gurney") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.cyl(.015, .015, h - .1, "steel", sx * (w / 2 - .05), .06, sz * (d / 2 - .1), 8); b.sph(.05, "rubber", sx * (w / 2 - .05), .05, sz * (d / 2 - .1), 1, 8); } b.box(w, .04, d, "steel", 0, h - .1); b.rbox(w - .04, .08, d - .04, .03, "pad" in (p.m || {}) ? "pad" : "vinyl", 0, h - .06); if (p.body) { b.rbox(w * .6, .22, d * .82, .12, "sheet" in (p.m || {}) ? "sheet" : "white", 0, h + .02, .05); b.sph(.12, "sheet" in (p.m || {}) ? "sheet" : "white", 0, h + .12, -d * .4, .7, 12); } return; }
    if (st === "wheelchair") { for (const sx of [-1, 1]) { wheel(b, .3, .03, "steel", sx * (w / 2 - .02), .3, -.05, 12, "steel"); b.cyl(.04, .04, .03, "rubber", sx * (w / 2 - .1), .04, d / 2 - .06, 8, 0, H); b.box(.02, .5, .02, "steel", sx * (w / 2 - .08), .45, -d / 2 + .1); b.box(.02, .02, d * .6, "steel", sx * (w / 2 - .08), .7, 0); } b.box(w - .16, .05, d * .5, "seat" in (p.m || {}) ? "seat" : "vinyl", 0, .45, .02); b.box(w - .16, .4, .03, "seat" in (p.m || {}) ? "seat" : "vinyl", 0, .5, -d / 2 + .12, -.1); return; }
    if (st === "xray") { b.box(w, h, .05, "body", 0, 0, -d / 2 + .025); b.box(w - .1, h * .6, .005, "glowwhite", 0, h * .2, -d / 2 + .052); b.decal("xr", (g, W, Hh) => { g.strokeStyle = "rgba(20,30,40,.8)"; g.lineWidth = W / 30; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(W / 2, Hh * (.25 + i * .1), W * .3, Hh * .04, 0, 0, PI); g.stroke(); } g.beginPath(); g.moveTo(W / 2, Hh * .1); g.lineTo(W / 2, Hh * .9); g.stroke(); }, w * .5, h * .55, 0, null, true).position.set(0, h * .5, -d / 2 + .055); return; }
    if (st === "scanner") { b.rbox(w, h * .35, d, .05, "body"); b.box(w * .9, .06, d * .8, "pad" in (p.m || {}) ? "pad" : "vinyl", 0, h * .35); b.part(() => { b.tor(h * .45, .12, "body", 0, 0, 0, 0, 0); b.tor(h * .45, .02, "glowcyan", 0, 0, .1, 0, 0); }, 0, h * .55, -d * .25); return; }
  });

  /* ================= neon streets ================= */
  G("neon", (b, p) => {
    const { w, h } = p, text = p.text || "OPEN", col = p.col || "#ff5adc", lit = b.cond !== "ruined" && b.cond !== "burned";
    const back = -p.d / 2;
    if (p.style !== "bare") b.box(w, h, .04, "body", 0, 0, back + .02);
    b.sign(text, w * .92, h * .8, p.style === "bare" ? "rgba(0,0,0,0)" : "#0a0a12", lit ? col : "#3a3a40", 0, h / 2, back + .045, 0, lit);
    if (p.style === "blade") { b.box(.04, .3, .3, "steel", 0, h, back + .15); }
  });

  G("vending", (b, p) => {
    const { w, d, h } = p, st = p.style || "drinks", lit = b.cond !== "ruined", col = p.col || (st === "cyber" ? "#ff5adc" : "#ffffff");
    b.rbox(w, h, d, .03, "body");
    b.box(w * .62, h * .7, .01, lit ? "glowwhite" : "glass", -w * .14, h * .2, d / 2 + .004);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const x = -w * .14 - w * .23 + c * w * .155, y = h * .24 + r * h * .11; st === "snacks" ? b.box(.08, .1, .02, pick(b, ["pred", "pyellow", "pblue", "porange", "pgreen"]), x, y, d / 2 + .012) : b.cyl(.03, .03, .1, pick(b, ["pred", "pblue", "pgreen", "porange", "steel"]), x, y, d / 2 + .02, 10); }
    b.box(w * .22, h * .3, .01, "pblack", w * .34, h * .45, d / 2 + .004); b.box(w * .12, .06, .005, lit ? "screengreen" : "screenoff", w * .34, h * .68, d / 2 + .01);
    b.box(w * .5, .12, .02, "pblack", -w * .1, h * .06, d / 2 + .005);
    b.sign(p.text || (st === "snacks" ? "SNACKS" : st === "cyber" ? "SYNTH-COLA" : "COLD DRINKS"), w * .9, h * .07, st === "cyber" ? "#0a0a12" : "#b8231d", col, 0, h * .92, d / 2 + .006, 0, st === "cyber" && lit);
    if (st === "cyber" && lit) for (const sx of [-1, 1]) b.box(.02, h * .9, .02, "glowcyan", sx * (w / 2 - .01), h * .05, d / 2);
  });

  G("arcade", (b, p) => {
    const { w, d, h } = p, lit = b.cond !== "ruined";
    b.ext([[-d / 2, 0], [d / 2, 0], [d / 2, h * .48], [d * .2, h * .52], [d * .1, h * .85], [d * .3, h * .9], [d * .3, h], [-d / 2, h]], w, "body", 0, 0, 0, -H);
    b.part(() => b.box(w * .85, h * .3, .01, lit ? "screen" : "screenoff"), 0, h * .68, d * .16, -.25, 0, 0);
    b.part(() => { b.box(w * .9, .02, d * .25, "pblack"); b.cyl(.012, .012, .06, "steel", -w * .2, .02, 0, 8); b.sph(.022, "pred", -w * .2, .085, 0, 1, 8); for (let i = 0; i < 4; i++) b.cyl(.02, .02, .015, pick(b, ["pred", "pblue", "pyellow", "pgreen"]), w * .05 + (i % 2) * .07, .02, ((i / 2) | 0) * .06 - .03, 10); }, 0, h * .5, d * .35, .2, 0, 0);
    b.sign(p.text || "STAR RAIDER", w * .9, h * .08, "#120a1a", lit ? "#ffbf5a" : "#555", 0, h * .95, d * .3 + .006, 0, lit);
  });

  G("billboard", (b, p) => {
    const { w, h } = p, st = p.style || "holo", lit = b.cond !== "ruined";
    for (const sx of [-1, 1]) b.box(.15, h * .45, .15, "body", sx * w * .3);
    b.box(w, h * .55, .2, "body", 0, h * .45);
    if (st === "holo") { b.box(w - .1, h * .5, .01, lit ? "screen" : "screenoff", 0, h * .475, .105); b.sign(p.text || "LIVE FOREVER", w * .8, h * .15, "rgba(0,0,0,0)", lit ? "#ff5adc" : "#444", 0, h * .78, .115, 0, lit); }
    else { b.part(() => b.decal("bb" + (p.text || ""), (g, W, Hh) => { g.fillStyle = "#e8e0c8"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#b8231d"; let fs = Hh * .3; g.font = `bold ${fs}px Arial`; const t = p.text || "DRINK COLA"; while (g.measureText(t).width > W * .88 && fs > 8) { fs -= 2; g.font = `bold ${fs}px Arial`; } g.textAlign = "center"; g.fillText(t, W / 2, Hh * .6); }, w - .1, h * .5, 0, null, true), 0, h * .725, .105); }
  });

  G("trash", (b, p) => {
    const { w, d, h } = p, st = p.style || "bags";
    if (st === "bags") { for (let i = 0; i < (p.n || 5); i++) { const x = (b.r() - .5) * (w - .4), z = (b.r() - .5) * (d - .4); b.part(() => { lump(b, .22, "body", 0, .2, 0, .9, .3); b.cyl(.03, .05, .1, "body", 0, .38, 0, 8); }, x, i > 3 ? .25 : 0, z); } return; }
    if (st === "litter") { for (let i = 0; i < 14; i++) { const k = (b.r() * 3) | 0, x = (b.r() - .5) * w, z = (b.r() - .5) * d; if (k === 0) b.box(.15, .002, .2, pick(b, ["paper", "newspaper" in M.MATS ? "paper" : "paper"]), x, 0, z, 0, b.r() * 3, 0); else if (k === 1) b.part(() => b.cyl(.033, .033, .12, pick(b, ["pred", "steel", "pblue"]), 0, 0, 0, 10, H), x, .033, z, 0, b.r() * 3, 0); else b.sph(.04, "paper", x, .03, z, .8, 6); } return; }
    if (st === "can") { b.lathe([[w * .45, 0], [w * .5, h], [w * .52, h], [0, h]], "body", 0, 0, 0, 18); b.cyl(w * .54, w * .54, .03, "body", 0, h, 0, 18); for (let i = 0; i < 6; i++) b.box(.008, h * .9, .008, "body", Math.cos(i) * w * .5, 0, Math.sin(i) * w * .5); return; }
    if (st === "wheelie") { b.box(w, h * .9, d, "body", 0, .05); b.box(w + .04, .04, d + .04, "lid" in (p.m || {}) ? "lid" : "body", 0, h - .05, 0); for (const sx of [-1, 1]) b.cyl(.08, .08, .05, "rubber", sx * (w / 2 - .06), .08, -d / 2 + .02, 14, 0, H); return; }
    if (st === "street") { b.cyl(w / 2, w / 2 * .9, h, "body", 0, 0, 0, 18); b.cyl(w / 2 + .02, w / 2 + .02, .06, "body", 0, h - .06, 0, 18); b.cyl(w * .25, w * .25, .005, "coal", 0, h, 0, 14); return; }
  });

  G("acunit", (b, p) => {
    const { w, d, h } = p, wall = p.mount === "wall";
    b.box(w, h, d, "body", 0, 0, wall ? -d / 2 + .02 + d / 2 : 0);
    b.cyl(h * .38, h * .38, .01, "coal", -w * .15, h / 2, d / 2 + .005 + (wall ? .02 : 0), 24, H);
    for (let i = 0; i < 5; i++) b.part(() => b.box(h * .3, .005, .06, "steel", h * .15), -w * .15, h / 2, d / 2 + .01, H, 0, i * TAU / 5);
    for (let i = 0; i < 8; i++) b.box(w * .25, .01, .01, "coal", w * .3, .05 + i * h * .11, d / 2 + .005);
    if (b.cond !== "new") b.tube([[w / 2, h * .2, 0], [w / 2 + .1, h * .1, 0], [w / 2 + .1, -.3, 0]], .01, "pblack");
  });

  G("cables", (b, p) => {
    const { w, d } = p, n = p.n || 5;
    for (let i = 0; i < n; i++) { const pts = []; for (let k = 0; k <= 8; k++) pts.push([-w / 2 + k * w / 8, .015 + (b.r() < .2 ? .05 : 0), (b.r() - .5) * d * .8]); b.tube(pts, .012 + b.r() * .012, pick(b, ["pblack", "pblack", "pred", "pyellow", "pblue"])); }
    if (p.box) { b.box(.3, .2, .2, "steel", w / 2, 0, 0); b.box(.06, .03, .005, "glowgreen", w / 2, .15, .1); }
  });

  G("vehicle", (b, p) => {
    const { w, d, h } = p, st = p.style || "car", wr = st === "truck" || st === "jeep" ? .4 : st === "bike" ? .32 : .33, wrecked = b.cond === "ruined" || b.cond === "burned";
    if (st === "bike") { const R = wr; for (const z of [-d * .35, d * .35]) wheel(b, R, .1, "rubber", 0, R, z, 0, "steel"); b.rbox(.3, .35, d * .5, .06, "body", 0, R * .9, 0); b.rbox(.25, .1, .5, .04, "seat" in (p.m || {}) ? "seat" : "leatherblack", 0, R * .9 + .35, -d * .12); strut(b, [0, R, d * .35], [0, R + .55, d * .25], .025, "chrome"); b.rod(.015, .6, "chrome", 0, R + .55, d * .25); b.sph(.06, b.cond === "ruined" ? "glass" : "glowwhite", 0, R + .45, d * .32, 1, 10); if (p.neon) b.box(.02, .02, d * .6, "glowmagenta", .16, R * .6, 0); return; }
    if (st === "bicycle") { for (const z of [-d * .36, d * .36]) wheel(b, .33, .03, "rubber", 0, .33, z, 12, "steel"); strut(b, [0, .33, -d * .36], [0, .65, -d * .05], .015, "body"); strut(b, [0, .33, -d * .36], [0, .33, 0], .015, "body"); strut(b, [0, .33, 0], [0, .65, -d * .05], .015, "body"); strut(b, [0, .65, -d * .05], [0, .7, d * .25], .015, "body"); strut(b, [0, .33, 0], [0, .7, d * .25], .015, "body"); strut(b, [0, .33, d * .36], [0, .8, d * .27], .015, "body"); b.rod(.012, .45, "body", 0, .82, d * .27); b.box(.1, .03, .22, "leatherblack", 0, .7, -d * .08); return; }
    if (st === "cart") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.sph(.05, "rubber", sx * (w / 2 - .08), .05, sz * (d / 2 - .1), 1, 8); b.box(w - .1, .02, d - .15, "body", 0, .15); for (let i = 0; i <= 6; i++) { b.box(.008, h - .35, .008, "body", -w / 2 + .05 + i * (w - .1) / 6, .35, d / 2 - .1); b.box(.008, h - .35, .008, "body", -w / 2 + .05 + i * (w - .1) / 6, .35, -d / 2 + .1); } b.box(w, .02, d - .2, "body", 0, .35); b.box(w, .02, .02, "body", 0, h, d / 2 - .1); b.box(w, .02, .02, "body", 0, h, -d / 2 + .1); b.rod(.015, w, "pred", 0, h + .1, -d / 2 - .02); return; }
    // cars, vans, jeeps, trucks: a body, a cabin with glass, wheels, lights
    const cab = st === "van" ? .85 : st === "truck" ? .35 : st === "jeep" ? .45 : .5, bodyH = h * (st === "van" ? .55 : .45);
    if (!wrecked) for (const sx of [-1, 1]) for (const sz of [-1, 1]) wheel(b, wr, .2, "rubber", sx * (w / 2 - .12), wr, sz * (d / 2 - wr - .25), 0, "steel");
    else for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.06, .06, .2, "rust", sx * (w / 2 - .2), 0, sz * (d / 2 - .6), 8);
    const y0 = wrecked ? .12 : wr * .6;
    b.rbox(w, bodyH, d, .1, "body", 0, y0, 0);
    const cz = st === "truck" ? d * .32 : st === "van" ? -d * .05 : -d * .05, cd = d * cab;
    b.rbox(w * .92, h - bodyH - y0, cd, .12, "body", 0, y0 + bodyH - .02, cz);
    const glass = wrecked || b.broken ? "frosted" : "glass";
    for (const sx of [-1, 1]) b.box(.01, (h - bodyH - y0) * .6, cd * .8, glass, sx * w * .462, y0 + bodyH + .05, cz);
    b.part(() => b.box(w * .8, (h - bodyH - y0) * .6, .01, glass), 0, y0 + bodyH + .05, cz + cd / 2 + .01, -.35, 0, 0);
    if (st === "truck") { b.box(w, .15, d * .58, "bed" in (p.m || {}) ? "bed" : "body", 0, y0 + bodyH, -d * .2); for (const sx of [-1, 1]) b.box(.05, .5, d * .58, "body", sx * (w / 2 - .025), y0 + bodyH, -d * .2); b.box(w, .5, .05, "body", 0, y0 + bodyH, -d / 2 + .025); }
    if (st === "jeep") { b.cyl(.3, .3, .2, "rubber", 0, y0 + bodyH * .4, -d / 2 - .1, 16, H); b.box(w * .9, .04, .3, "body", 0, y0 + bodyH, d * .3); }
    for (const sx of [-1, 1]) { b.cyl(.07, .07, .02, wrecked ? "glass" : "glowwhite", sx * w * .35, y0 + bodyH * .6, d / 2 + .005, 12, H); b.box(.14, .06, .02, wrecked ? "coal" : "glowred", sx * w * .38, y0 + bodyH * .6, -d / 2 - .005); }
    b.box(w * .9, .1, .05, "chrome", 0, y0 + .05, d / 2 + .02); b.box(w * .9, .1, .05, "chrome", 0, y0 + .05, -d / 2 - .02);
    if (st === "police") { b.box(w * .5, .08, .2, "pblack", 0, h, cz); b.box(w * .2, .07, .15, "glowred", -w * .13, h + .02, cz); b.box(w * .2, .07, .15, "glowblue" in M.MATS ? "glowblue" : "glowcyan", w * .13, h + .02, cz); for (const sx of [-1, 1]) b.box(.005, bodyH * .4, d * .5, "white", sx * w / 2, y0 + bodyH * .3, 0); }
    if (st === "taxi") b.box(w * .3, .12, .15, "glowamber", 0, h, cz);
    if (wrecked) for (let i = 0; i < 6; i++) b.box(.2, .005, .2, "rust", (b.r() - .5) * w, y0 + bodyH + .001, (b.r() - .5) * d, 0, b.r() * 3, 0);
  });
  M.MATS.glowblue = ["glow", 0x5a8aff, .3, 0, "", 0x2a50e0];

  G("street", (b, p) => {
    const { w, d, h } = p, st = p.style || "cone";
    if (st === "cone") { b.box(w, .03, w, "pblack"); b.cone(w * .35, h, "body", 0, .03, 0, 18); for (const y of [.3, .55]) b.cyl(w * .35 * (1 - y) * 1.02, w * .35 * (1 - y - .12) * 1.02, h * .12, "white", 0, y * h, 0, 18); return; }
    if (st === "barrier") { b.ext([[-d / 2, 0], [d / 2, 0], [d * .3, h * .3], [d * .15, h], [-d * .15, h], [-d * .3, h * .3]], w, "body", 0, 0, 0, -H); if (p.stripes) for (let i = 0; i < 4; i++) b.box(w * .1, h * .3, .005, i % 2 ? "pred" : "white", -w * .3 + i * w * .2, h * .5, d * .16); return; }
    if (st === "sawhorse") { for (const sx of [-1, 1]) { plank(b, [sx * w * .4, 0, -d * .4], [sx * w * .4, h, 0], .04, .04, "frame" in (p.m || {}) ? "frame" : "oak"); plank(b, [sx * w * .4, 0, d * .4], [sx * w * .4, h, 0], .04, .04, "frame" in (p.m || {}) ? "frame" : "oak"); } b.part(() => b.decal("saw", (g, W, Hh) => { for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#b8231d" : "#f2efe6"; g.beginPath(); g.moveTo(i * W / 10, 0); g.lineTo((i + 1) * W / 10, 0); g.lineTo((i + .5) * W / 10, Hh); g.lineTo((i - .5) * W / 10, Hh); g.fill(); } }, w, .2, 0, null, true), 0, h - .12, .03); b.box(w, .2, .02, "white", 0, h - .22, .015); return; }
    if (st === "hydrant") { b.lathe([[.12, 0], [.12, .05], [.09, .08], [.09, .5], [.11, .52], [.1, .6], [0, .7]], "body", 0, 0, 0, 16); for (const sx of [-1, 1]) b.cyl(.04, .04, .1, "body", sx * .12, .35, 0, 10, 0, H); b.cyl(.05, .05, .08, "body", 0, .3, .1, 10, H); return; }
    if (st === "mailbox") { b.box(.08, h * .65, .08, "post" in (p.m || {}) ? "post" : "body"); b.part(() => { b.box(w, .25, d, "body"); b.cyl(w / 2, w / 2, d, "body", 0, .25, 0, 16, H).scale.y = .6; }, 0, h * .65, 0); b.box(.02, .15, .08, "pred", w / 2 + .01, h * .65 + .25, -d * .3); return; }
    if (st === "postbox") { b.cyl(w / 2, w / 2, h * .85, "body", 0, 0, 0, 20); b.sph(w / 2, "body", 0, h * .85, 0, .5, 16); b.box(w * .5, .02, .03, "coal", 0, h * .7, w / 2); b.box(w * .3, .1, .005, "white", 0, h * .5, w / 2 + .002); return; }
    if (st === "booth") { b.box(w, .1, d, "body"); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, h - .3, .08, "body", sx * (w / 2 - .04), .1, sz * (d / 2 - .04)); for (const [x, z, ry] of [[0, d / 2 - .04, 0], [0, -d / 2 + .04, 0], [w / 2 - .04, 0, H], [-w / 2 + .04, 0, H]]) { b.part(() => { for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) b.box((Math.min(w, d) - .2) / 3 - .02, (h - .7) / 6 - .02, .01, "glass", -(Math.min(w, d) - .2) / 3 + c * (Math.min(w, d) - .2) / 3, .3 + r * (h - .7) / 6, 0); }, x, 0, z, 0, ry, 0); } b.box(w + .06, .2, d + .06, "body", 0, h - .3); b.ext([[-w / 2 - .03, 0], [w / 2 + .03, 0], [0, .12]], d + .06, "body", 0, h - .1, 0); b.sign(p.text || "TELEPHONE", w * .8, .12, "#1d1b1a", "#f2efe6", 0, h - .2, d / 2 + .035, 0, true); b.box(.2, .3, .1, "pblack", 0, 1.1, -d / 2 + .12); return; }
    if (st === "busstop") { for (const sx of [-1, 1]) b.box(.06, h, .06, "body", sx * (w / 2 - .03), 0, -d / 2 + .03); b.box(w, .04, d, "body", 0, h, 0); b.box(w - .1, h - .4, .01, "glass", 0, .3, -d / 2 + .03); b.box(w * .6, .04, .3, "body", 0, .45, -d / 2 + .2); b.box(.4, .6, .02, "glowwhite", w / 2 - .25, .8, -d / 2 + .05); b.cyl(.025, .025, h + .3, "body", w / 2 + .2, 0, d / 2, 8); b.cyl(.2, .2, .02, "pred", w / 2 + .2, h + .2, d / 2, 18, H); return; }
    if (st === "lightpole") { b.cyl(.08, .1, .4, "body", 0, 0, 0, 12); b.cyl(.05, .06, h - .4, "body", 0, .4, 0, 12); b.box(.5, .7, .25, "body", 0, h - 1.5, .15); for (const [y, m] of [[.5, "glowred"], [.3, "glowamber"], [.1, "glowgreen"]]) b.cyl(.08, .08, .02, b.cond === "ruined" ? "pgrey" : m, 0, h - 1.5 + y + .05, .28, 14, H); return; }
    if (st === "bollard") { b.cyl(w / 2, w / 2, h, "body", 0, 0, 0, 14); b.sph(w / 2, "body", 0, h, 0, .5, 12); b.cyl(w / 2 + .005, w / 2 + .005, .06, "white", 0, h * .75, 0, 14); return; }
    if (st === "meter") { b.cyl(.03, .03, h - .3, "body", 0, 0, 0, 8); b.rbox(.18, .3, .14, .04, "body", 0, h - .3); b.box(.1, .08, .005, "glass", 0, h - .15, .072); return; }
  });

  G("office", (b, p) => {
    const { w, d, h } = p, st = p.style || "cubicle";
    if (st === "cubicle") { b.box(w, h, .05, "panel" in (p.m || {}) ? "panel" : "body", 0, 0, -d / 2 + .025); b.box(.05, h, d, "panel" in (p.m || {}) ? "panel" : "body", -w / 2 + .025, 0, 0); b.box(.05, h * .7, d * .6, "panel" in (p.m || {}) ? "panel" : "body", w / 2 - .025, 0, -d * .2); b.box(w - .1, .03, d * .45, "top" in (p.m || {}) ? "top" : "birch", 0, .72, -d / 2 + d * .225 + .05); b.box(d * .45, .03, d * .5, "top" in (p.m || {}) ? "top" : "birch", -w / 2 + d * .225 + .05, .72, 0); P.monitor(b, -w * .1, .75, -d * .35); P.keyboard(b, -w * .1, .75, -d * .15); b.box(.35, .55, .5, "steel", w * .3, 0, -d * .25); return; }
    if (st === "partition") { b.box(w, h, d, "body"); b.box(w + .02, .03, d + .02, "pgrey", 0, h); return; }
    if (st === "whiteboard") { for (const sx of [-1, 1]) { b.box(.04, h, .04, "steel", sx * w * .45); b.box(.04, .03, .5, "steel", sx * w * .45); } b.box(w, h * .5, .03, "white", 0, h * .45); b.decal("wb", (g, W, Hh) => { g.strokeStyle = "#2a5ab0"; g.lineWidth = 3; g.beginPath(); g.moveTo(W * .1, Hh * .3); g.lineTo(W * .4, Hh * .3); g.lineTo(W * .5, Hh * .7); g.stroke(); g.strokeStyle = "#b8231d"; g.beginPath(); g.arc(W * .7, Hh * .45, Hh * .2, 0, 7); g.stroke(); }, w * .95, h * .47, 0, null, true).position.set(0, h * .7, .017); return; }
    if (st === "plant") return;
  });

  G("audio", (b, p) => {
    const { w, d, h } = p, st = p.style || "speakers", lit = b.cond !== "ruined";
    const cab = (x, y, W, Hh) => { b.box(W, Hh, d, "body", x, y); b.cyl(W * .35, W * .35, .02, "rubber", x, y + Hh * .62, d / 2, 20, H); b.cyl(W * .18, W * .18, .02, "rubber", x, y + Hh * .22, d / 2, 16, H); };
    if (st === "speakers") { cab(0, 0, w, h * .55); cab(0, h * .55, w * .8, h * .45); return; }
    if (st === "djbooth") { b.box(w, h * .9, d, "body"); b.box(w + .04, .04, d + .04, "top" in (p.m || {}) ? "top" : "pblack", 0, h * .9); b.box(w * .9, .04, .03, lit ? "glowmagenta" : "pgrey", 0, h * .5, d / 2 + .01); for (const s of [-1, 1]) { b.box(.35, .05, .35, "pgrey", s * w * .3, h * .94); b.cyl(.13, .13, .01, "pblack", s * w * .3, h * .99, 0, 20); } b.box(.3, .05, .25, "pblack", 0, h * .94); for (let i = 0; i < 8; i++) b.box(.02, .01, .02, pick(b, ["glowcyan", "glowmagenta", "glowgreen"]), -.1 + (i % 4) * .065, h * .99, -.05 + ((i / 4) | 0) * .1); return; }
    if (st === "jukebox") { b.box(w, h * .6, d, "body"); b.part(() => b.cyl(w / 2, w / 2, d, "body", 0, 0, 0, 22, H), 0, h * .6, 0).scale.y = (h * .4) / (w / 2); b.box(w * .7, h * .3, .01, lit ? "glowamber" : "glass", 0, h * .5, d / 2 + .005); for (const s of [-1, 1]) b.box(.04, h * .55, .03, lit ? "glowmagenta" : "pgrey", s * (w / 2 - .06), h * .05, d / 2 + .01); b.box(w * .6, h * .15, .01, "burlap", 0, h * .12, d / 2 + .004); return; }
    if (st === "gramophone") return;
  });

  /* ================= war and the wasteland ================= */
  G("sandbags", (b, p) => {
    const { w, d, h } = p, st = p.style || "wall", rows = Math.max(1, Math.round(h / .15));
    const bag = (x, y, z, ry) => b.part(() => b.rbox(.5, .15, .3, .07, "body"), x, y, z, 0, ry, 0);
    if (st === "ring") { const R = w / 2 - .15; for (let r = 0; r < rows; r++) { const n = Math.round(TAU * R / .48); for (let i = 0; i < n; i++) { const a = (i + (r % 2) * .5) * TAU / n; if (Math.abs(a - H) < .5) continue; bag(Math.cos(a) * R, r * .14, Math.sin(a) * R, -a + H); } } return; }
    for (let r = 0; r < rows; r++) { const n = Math.max(1, Math.round(w / .48)); for (let i = 0; i < n - (r % 2); i++) bag(-w / 2 + .25 + i * (w - .5) / Math.max(1, n - 1) + (r % 2) * .24, r * .14, (b.r() - .5) * .04, (b.r() - .5) * .1); if (d > .5) for (let i = 0; i < n - (r % 2); i++) bag(-w / 2 + .25 + i * (w - .5) / Math.max(1, n - 1) + (r % 2) * .24, r * .14, -.3, (b.r() - .5) * .1); }
  });

  G("jerrycan", (b, p) => {
    const { w, d, h } = p, n = p.n || 1;
    for (let i = 0; i < n; i++) b.part(() => { b.rbox(w, h * .9, d, .02, "body"); b.box(w * .9, .01, d + .006, "body", 0, h * .45); for (const sx of [-1, 1]) b.box(.015, h * .5, .005, "body", sx * w * .2, h * .2, d / 2 + .002); b.box(.04, .06, .03, "body", -w * .2, h * .9, 0); b.cyl(.025, .025, .05, "steel", w * .3, h * .88, 0, 8, -.6); }, (i % 3 - (n > 1 ? 1 : 0)) * (w + .03), 0, ((i / 3) | 0) * (d + .05), 0, (b.r() - .5) * .2, 0);
  });

  G("tower", (b, p) => {
    const { w, d, h } = p, st = p.style || "watch", deck = h * .78, lg = has(p, "legs") ? "legs" : "body";
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) plank(b, [sx * w * .5, 0, sz * d * .5], [sx * (w / 2 - .1), deck + .1, sz * (d / 2 - .1)], .12, .12, lg);
    for (const y of [deck * .35, deck * .7]) for (const sz of [-1, 1]) { b.box(w * .9, .08, .06, lg, 0, y, sz * d * .46); b.box(.06, .08, d * .9, lg, sz * w * .46, y, 0); }
    b.box(w, .1, d, "body", 0, deck);
    for (const sx of [-1, 1]) { b.box(.06, 1.1, d, "body", sx * (w / 2 - .03), deck + .1); b.box(w, 1.1, .06, "body", 0, deck + .1, sx * (d / 2 - .03)); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, h - deck, .08, lg, sx * (w / 2 - .04), deck, sz * (d / 2 - .04));
    b.ext([[-w / 2 - .2, 0], [w / 2 + .2, 0], [0, .5]], d + .4, "roof" in (p.m || {}) ? "roof" : "body", 0, h, 0);
    for (let i = 0; i < Math.round(deck / .3); i++) b.box(.4, .04, .05, lg, w / 2 + .1, .2 + i * .3, d * .3);
    for (const sz of [-.15, .45]) b.box(.04, deck + .2, .05, lg, w / 2 + .1, 0, d * sz);
    if (st === "guard") { b.part(() => { b.box(.3, .25, .4, "body"); b.box(.25, .2, .01, "glowwhite", 0, .025, .2); }, w / 2 - .2, deck + 1.25, d / 2 - .2, -.3, .5, 0); }
  });

  G("barbed", (b, p) => {
    const { w, h } = p, st = p.style || "coil";
    if (st === "fence") { const n = Math.max(2, Math.round(w / 2.5)); for (let i = 0; i <= n; i++) b.box(.06, h, .06, "post" in (p.m || {}) ? "post" : "oak", -w / 2 + i * w / n); for (let k = 0; k < 5; k++) b.rod(.003, w, "body", 0, .2 + k * (h - .3) / 4, 0); for (let i = 0; i < w * 10; i++) b.box(.03, .003, .003, "body", -w / 2 + i * .1, .2 + ((i % 5) * (h - .3)) / 4, 0, 0, i, .7); return; }
    for (let i = 0; i < 3; i++) for (let k = 0; k < Math.round(w / .25); k++) b.tor(h * (i === 2 ? .3 : .45), .004, "body", -w / 2 + k * .25 + i * .08, h * (i === 2 ? .85 : .45), (i - .5) * (i === 2 ? 0 : h * .9), 0, H + .25);
    for (let k = 0; k <= Math.round(w / 1.5); k++) plank(b, [-w / 2 + k * 1.5, 0, -.4], [-w / 2 + k * 1.5, h * 1.1, .4], .04, .04, "post" in (p.m || {}) ? "post" : "oak");
  });

  G("hedgehog", (b, p) => {
    const { w } = p, L = w * 1.1;
    b.part(() => b.box(.12, L, .12, "body", 0, -L / 2), 0, w * .38, 0, .62, 0, .62);
    b.part(() => b.box(.12, L, .12, "body", 0, -L / 2), 0, w * .38, 0, -.62, 0, .62);
    b.part(() => b.box(.12, L, .12, "body", 0, -L / 2), 0, w * .38, 0, 0, H, .95);
  });

  G("artillery", (b, p) => {
    const { w, d } = p, st = p.style || "fieldgun";
    if (st === "searchlight") { b.box(.6, .1, .6, "body"); b.cyl(.06, .06, .5, "body", 0, .1, 0, 10); b.tube([[-.35, .6, 0], [-.35, .9, 0], [.35, .9, 0], [.35, .6, 0]], .025, "body"); b.part(() => { b.cyl(.3, .25, .45, "body", 0, 0, 0, 20, H); b.cyl(.27, .27, .01, b.cond === "ruined" ? "glass" : "glowwhite", 0, 0, .23, 20, H); }, 0, .75, 0, -.25, 0, 0); return; }
    if (st === "mortar") { b.box(.5, .05, .5, "body"); b.part(() => b.cyl(.06, .07, .9, "body", 0, 0, 0, 12), 0, .05, 0, .6, 0, 0); strut(b, [0, .35, .3], [-.2, 0, .5], .015, "body"); strut(b, [0, .35, .3], [.2, 0, .5], .015, "body"); for (let i = 0; i < 4; i++) b.part(() => { b.cyl(.04, .04, .25, "olive", 0, 0, 0, 10); b.cone(.04, .08, "olive", 0, .25, 0, 10); }, .4 + i * .1, 0, -.2); return; }
    for (const sx of [-1, 1]) wheel(b, .5, .1, "body", sx * (w / 2 - .05), .5, -d * .1, 10, "steel");
    b.rod(.04, w, "steel", 0, .5, -d * .1); b.box(w * .7, .6, .06, "body", 0, .45, .05, -.2);
    b.part(() => { b.cyl(.06, .08, d * .75, "body", 0, 0, 0, 14); b.cyl(.1, .1, .3, "body", 0, 0, 0, 14); }, 0, .62, -d * .05, -1.35, 0, 0);
    for (const sx of [-1, 1]) plank(b, [sx * .1, .45, -d * .1], [sx * .25, .02, -d / 2], .06, .08, "body");
  });

  G("flag", (b, p) => {
    const { h } = p, c1 = p.c1 || "#b8231d", c2 = p.c2 || "#f2efe6", em = p.emblem || "stripes";
    b.cyl(.15, .2, .2, "base" in (p.m || {}) ? "base" : "concrete", 0, 0, 0, 12); b.cyl(.03, .04, h, "body", 0, .2, 0, 10); b.sph(.05, "gold", 0, h + .22, 0, 1, 10);
    b.part(() => b.decal("flag" + c1 + c2 + em + b.cond, (g, W, Hh) => { g.fillStyle = c1; g.fillRect(0, 0, W, Hh); g.fillStyle = c2; if (em === "stripes") for (let i = 0; i < 3; i++) g.fillRect(0, (i * 2 + 1) * Hh / 7, W, Hh / 7); else if (em === "cross") { g.fillRect(W * .3, 0, W * .12, Hh); g.fillRect(0, Hh * .44, W, Hh * .12); } else if (em === "star") { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -H + i * PI / 5, rr = i % 2 ? Hh * .12 : Hh * .3; g.lineTo(W / 2 + Math.cos(a) * rr, Hh / 2 + Math.sin(a) * rr); } g.fill(); } else if (em === "skull") { g.beginPath(); g.arc(W / 2, Hh * .45, Hh * .22, 0, 7); g.fill(); g.fillRect(W / 2 - Hh * .12, Hh * .55, Hh * .24, Hh * .15); } if (b.cond === "damaged" || b.cond === "ruined" || b.cond === "burned") { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(W, Math.random() * Hh); g.lineTo(W * (.6 + Math.random() * .3), Math.random() * Hh); g.lineTo(W, Math.random() * Hh); g.fill(); } } }, 1.2, .75, 0, null, true), .62, h - .2, 0);
  });

  G("scrap", (b, p) => {
    const { w, d, h } = p, st = p.style || "wall";
    if (st === "wall") { const n = Math.max(2, Math.round(w / .8)); for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n, hh = h * (.75 + b.r() * .3); b.box(w / n + .12, hh, .02, pick(b, ["rust", "rust", "steel", "olive", "plank"]), x, 0, (b.r() - .5) * .08, (b.r() - .5) * .05, (b.r() - .5) * .1, (b.r() - .5) * .08); for (let k = 0; k < 4; k++) b.box(w / n * .9, .015, .008, "coal", x, hh * (k + .5) / 4, .015); } for (let i = 0; i <= n; i++) b.box(.08, h + .1, .08, pick(b, ["rust", "bark", "steel"]), -w / 2 + i * w / n, 0, -.06); return; }
    if (st === "tires") { for (let i = 0; i < (p.n || 6); i++) b.tor(.3, .11, "rubber", (i > 3 ? .5 : 0) + (b.r() - .5) * .1, .11 + (i % 4) * .22, (b.r() - .5) * .1); return; }
    if (st === "junk") { for (let i = 0; i < 18; i++) { const k = (b.r() * 4) | 0, x = (b.r() - .5) * w * .8, z = (b.r() - .5) * d * .8, y = b.r() * h * .5; if (k === 0) b.box(.2 + b.r() * .4, .1 + b.r() * .3, .2 + b.r() * .3, pick(b, ["rust", "steel", "olive", "pgrey"]), x, y, z, b.r(), b.r() * 3, b.r()); else if (k === 1) b.part(() => b.cyl(.1 + b.r() * .1, .1, .3 + b.r() * .4, pick(b, ["rust", "steel"]), 0, 0, 0, 10, H), x, y + .1, z, 0, b.r() * 3, 0); else if (k === 2) b.tor(.25, .08, "rubber", x, y + .08, z, H + b.r(), b.r()); else b.box(.6, .02, .4, pick(b, ["rust", "plank"]), x, y, z, b.r() - .5, b.r() * 3, b.r() - .5); } lump(b, w * .35, "dirt", 0, 0, 0, h / w * 1.4, .3); return; }
    if (st === "shelter") { for (const sx of [-1, 1]) b.box(.06, h, .06, pick(b, ["bark", "rust"]), sx * w * .45, 0, d * .4); b.part(() => { for (let i = 0; i < 3; i++) b.box(w / 3 + .1, .02, d * 1.1, pick(b, ["rust", "olive", "steel"]), -w / 3 + i * w / 3); }, 0, h * .55, 0, .55, 0, 0); b.box(w * .6, .1, d * .5, "canvas", 0, 0, -d * .1); return; }
    if (st === "purifier") { b.cyl(.3, .3, .9, "rust", -w * .2, 0, 0, 14); b.cyl(.25, .25, .7, "steel", w * .25, 0, 0, 14); b.tube([[-w * .2, .9, 0], [0, 1.2, 0], [w * .25, .75, 0]], .03, "copper"); b.tube([[w * .25, .1, .25], [w * .25, .1, .45], [w * .25, -.05, .55]], .015, "copper"); b.lathe([[.1, 0], [.14, .2], [0, .2]], "steel", w * .25, 0, .6, 12); b.cone(.2, .25, "fire", -w * .2, -.05, 0, 8); return; }
  });

  /* ================= industry ================= */
  G("pipes", (b, p) => {
    const { w, d, h } = p, st = p.style || "run", r = p.r || .08, pm = "body";
    if (st === "run") { b.rod(r, w, pm, 0, h, 0); for (let i = 0; i <= Math.round(w / 1.2); i++) { const x = -w / 2 + i * w / Math.max(1, Math.round(w / 1.2)); b.cyl(r * 1.3, r * 1.3, .04, pm, x, h, 0, 16, 0, H); if (h > .3) b.box(.06, h - r, .06, "steel", x, 0, 0); } if (p.valve) { b.cyl(.03, .03, .15, "steel", 0, h + r, 0, 8); b.tor(.1, .012, "valve" in (p.m || {}) ? "valve" : "pred", 0, h + r + .15, 0); } return; }
    if (st === "bundle") { for (let i = 0; i < 4; i++) b.rod(r * (1 - i * .15), w, pick(b, [pm, pm, "copper", "steel"]), 0, h + (i % 2) * r * 2.2, (i - 1.5) * r * 2.3); for (let i = 0; i <= 2; i++) b.box(.06, h + r * 3, d * .9, "steel", -w / 2 + .1 + i * (w - .2) / 2, 0, 0); return; }
    if (st === "corner") { b.tube([[-w / 2, h, 0], [-r * 2, h, 0], [0, h, r * 2], [0, h, d / 2]], r, pm); b.cyl(r * 1.3, r * 1.3, .04, pm, -w / 2 + .05, h, 0, 16, 0, H); return; }
    if (st === "riser") { b.cyl(r, r, h, pm, 0, 0, 0, 16); for (let i = 1; i < 4; i++) b.cyl(r * 1.3, r * 1.3, .04, pm, 0, i * h / 4, 0, 16); b.cyl(.04, .04, .15, "steel", 0, h * .5, r, 8, H); b.tor(.09, .012, "valve" in (p.m || {}) ? "valve" : "pred", 0, h * .5, r + .15, 0); b.cyl(.06, .06, .03, "glass", r + .02, h * .7, 0, 12, 0, H); return; }
    if (st === "valve") { b.rod(r, w, pm, 0, h, 0); b.sph(r * 1.6, pm, 0, h, 0, 1, 14); b.cyl(.03, .03, .2, "steel", 0, h + r, 0, 8); b.tor(.14, .014, "valve" in (p.m || {}) ? "valve" : "pred", 0, h + r + .2, 0); for (let i = 0; i < 4; i++) b.box(.28, .012, .012, "valve" in (p.m || {}) ? "valve" : "pred", 0, h + r + .2, 0, 0, i * PI / 4, 0); return; }
  });

  G("machine", (b, p) => {
    const { w, d, h } = p, st = p.style || "press", lit = b.cond !== "ruined";
    if (st === "press") { b.box(w, h * .15, d, "body"); for (const sx of [-1, 1]) b.box(.2, h * .85, .3, "body", sx * (w / 2 - .1), h * .15); b.box(w, h * .15, d * .6, "body", 0, h * .85); b.box(w * .6, h * .2, d * .5, "body", 0, h * .55); b.cyl(.08, .08, h * .25, "chrome", 0, h * .65, 0, 12); b.box(w * .6, .05, d * .5, "steel", 0, h * .15); b.box(.25, .35, .1, "pyellow", w / 2 + .1, h * .4, d * .2); b.cyl(.05, .05, .03, lit ? "glowred" : "pgrey", w / 2 + .1, h * .65, d * .25, 12, H); return; }
    if (st === "lathe") { b.box(w, h * .6, d * .5, "body"); b.box(w, .1, d * .7, "body", 0, h * .6); b.box(w * .25, h * .3, d * .6, "body", -w * .35, h * .6 + .1); b.rod(.04, w * .6, "chrome", w * .05, h * .6 + .25, 0); b.box(.2, .2, .25, "body", w * .3, h * .6 + .1); return; }
    if (st === "drill") { b.box(.5, .08, .5, "body"); b.cyl(.05, .05, h, "chrome", 0, 0, -.15, 12); b.box(.4, .1, .4, "body", 0, h * .45, 0); b.box(.25, .35, .4, "body", 0, h - .35, -.05); b.cyl(.015, .015, .25, "steel", 0, h - .6, .05, 8); return; }
    if (st === "conveyor") { for (const sx of [-1, 1]) b.box(.05, h, .05, "steel", sx * (w / 2 - .1), 0, d / 2 - .05), b.box(.05, h, .05, "steel", sx * (w / 2 - .1), 0, -d / 2 + .05); b.box(w, .08, d, "body", 0, h - .08); for (let i = 0; i < Math.round(w / .15); i++) b.rod(.035, d - .06, "chrome", -w / 2 + .08 + i * .15, h - .02, 0, "z"); b.box(w - .06, .01, d - .1, "rubber", 0, h + .015); if (p.boxes) for (let i = 0; i < 3; i++) b.box(.3, .25, .3, "cardboard", -w * .3 + i * w * .3, h + .025, 0); return; }
    if (st === "loom") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, h, .08, "body", sx * (w / 2 - .04), 0, sz * (d / 2 - .04)); b.box(w, .08, .08, "body", 0, h - .08, 0); b.box(w * .9, .5, .01, "cloth" in (p.m || {}) ? "cloth" : "red", 0, h * .4, 0); for (let i = 0; i < 20; i++) b.cyl(.002, .002, h * .4, "white", -w * .45 + i * w * .045, h * .5, 0, 3); return; }
    if (st === "generator") { b.box(w, h * .65, d, "body"); b.cyl(h * .3, h * .3, w * .4, "body", -w * .15, h * .65, 0, 18, 0, H); b.box(w * .3, h * .35, d * .6, "body", w * .3, h * .65); b.cyl(.04, .04, h * .4, "steel", w * .35, h, 0, 8); for (let i = 0; i < 3; i++) b.cyl(.04, .04, .02, lit ? pick(b, ["glowgreen", "glowamber"]) : "pgrey", w * .4, h * .3 + i * .1, d / 2 + .01, 10, H); return; }
    if (st === "crane") { b.cyl(.004, .004, h * .7, "body", 0, h * .3, 0, 4); for (let i = 0; i < 8; i++) b.tor(.03, .008, "body", 0, h * .2 + i * .045, 0, i % 2 ? H : 0, 0); b.tube([[0, h * .2, 0], [0, .1, 0], [.08, .05, 0], [.1, .12, 0]], .02, "body"); return; }
    if (st === "chains") { for (let k = 0; k < (p.n || 4); k++) { const x = (b.r() - .5) * w, z = (b.r() - .5) * d, len = h * (.4 + b.r() * .5); for (let i = 0; i < Math.round(len / .05); i++) b.tor(.025, .007, "body", x, h - i * .05, z, i % 2 ? H : 0, i % 2 ? 0 : H); if (b.r() < .5) b.tube([[x, h - len, z], [x, h - len - .1, z], [x + .07, h - len - .14, z], [x + .09, h - len - .06, z]], .012, "body"); } return; }
  });

  G("catwalk", (b, p) => {
    const { w, d, h } = p;
    b.box(w, .05, d, "body", 0, h - .05); b.decal("grate", (g, W, Hh) => { g.strokeStyle = "#1c1a19"; g.lineWidth = 2; for (let x = 0; x < W; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); } for (let y = 0; y < Hh; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }, w, d, h + .002);
    const n = Math.max(1, Math.round(w / 1.5)); for (let i = 0; i <= n; i++) for (const sz of [-1, 1]) { const x = -w / 2 + i * w / n; if (h > .3) b.box(.06, h - .05, .06, "steel", x, 0, sz * (d / 2 - .03)); b.box(.04, 1, .04, "rail" in (p.m || {}) ? "rail" : "pyellow", x, h, sz * (d / 2 - .02)); }
    for (const sz of [-1, 1]) for (const y of [.5, 1]) b.rod(.02, w, "rail" in (p.m || {}) ? "rail" : "pyellow", 0, h + y, sz * (d / 2 - .02));
  });

  G("ladder", (b, p) => {
    const { w, h } = p, st = p.style || "wood", n = Math.round(h / .3), m = "body";
    if (st === "rope") { for (const sx of [-1, 1]) b.cyl(.012, .012, h, "rope", sx * w / 2, 0, 0, 6); for (let i = 1; i < n; i++) b.rod(.015, w, "oak", 0, i * .3, 0); return; }
    for (const sx of [-1, 1]) b.box(.05, h, .05, m, sx * w / 2);
    for (let i = 1; i <= n; i++) b.rod(.016, w, m, 0, i * h / (n + 1) + .05, 0);
    if (st === "cage") for (let i = 0; i < Math.round((h - 2) / .6); i++) b.tor(.35, .015, m, 0, 2 + i * .6, .35, H, 0, PI);
  });

  G("pallet", (b, p) => {
    const { w, d } = p, st = p.style || "pallet", n = p.n || 1;
    const one = y => { for (let i = 0; i < 3; i++) b.box(.1, .1, d, "body", -w / 2 + .05 + i * (w - .1) / 2, y); for (let i = 0; i < 7; i++) b.box(w, .02, .1, "body", 0, y + .1, -d / 2 + .05 + i * (d - .1) / 6); };
    for (let i = 0; i < n; i++) one(i * .125);
    const top = n * .125;
    if (st === "boxes") { for (let i = 0; i < 4; i++) b.box(w / 2 - .02, .35, d / 2 - .02, "cardboard", (i % 2 - .5) * w / 2, top, (((i / 2) | 0) - .5) * d / 2); for (let i = 0; i < 2; i++) b.box(w / 2 - .02, .35, d / 2 - .02, "cardboard", (i - .5) * w / 2, top + .35, 0); b.box(w + .01, .7, d + .01, "glass", 0, top); }
    else if (st === "sacks") for (let i = 0; i < 6; i++) b.part(() => b.rbox(.5, .14, .32, .07, "burlap"), (i % 2 - .5) * .5, top + ((i / 2) | 0) * .14, 0, 0, ((i / 2) | 0) % 2 ? H : 0, 0);
    else if (st === "drums") for (let i = 0; i < 4; i++) { const x = (i % 2 - .5) * w * .5, z = (((i / 2) | 0) - .5) * d * .5; b.cyl(.28, .28, .88, pick(b, ["pblue", "pred", "olive", "rust"]), x, top, z, 18); for (const y of [.3, .6]) b.tor(.285, .01, "steel", x, top + y, z); }
  });

  G("forklift", (b, p) => {
    const { w, d, h } = p;
    for (const sx of [-1, 1]) { b.cyl(.25, .25, .2, "rubber", sx * (w / 2 - .1), .25, d * .25, 18, 0, H); b.cyl(.2, .2, .18, "rubber", sx * (w / 2 - .1), .2, -d * .3, 18, 0, H); }
    b.rbox(w, .6, d * .8, .08, "body", 0, .2, -d * .05); b.box(w * .9, .4, .3, "pblack", 0, .8, -d * .38);
    b.box(.4, .35, .4, "pblack", 0, .8, -d * .1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.05, h - .8, .05, "pblack", sx * (w / 2 - .05), .8, sz * d * .25 - d * .05); b.box(w, .05, d * .6, "body", 0, h, -d * .05);
    for (const sx of [-1, 1]) b.box(.08, h * .9, .08, "steel", sx * .25, .1, d * .38); b.box(w * .8, .3, .05, "steel", 0, .2, d * .4); for (const sx of [-1, 1]) b.box(.1, .04, .9, "steel", sx * .25, .1, d * .4 + .45);
  });

  G("panel", (b, p) => {
    const { w, d, h } = p, st = p.style || "fuse", back = -d / 2, lit = b.cond !== "ruined";
    if (st === "fuse") { b.box(w, h, .12, "body", 0, 0, back + .06); b.box(w - .04, h - .04, .01, "body", 0, .02, back + .125); b.box(.03, .1, .02, "steel", w / 2 - .06, h / 2, back + .14); b.sign("DANGER", w * .6, .06, "#e8b726", "#1d1b1a", 0, h - .1, back + .132); return; }
    if (st === "control") { b.box(w, h, .2, "body", 0, 0, back + .1); for (let i = 0; i < 6; i++) b.cyl(.04, .04, .02, "white", -w * .35 + (i % 3) * w * .35, h * .65 + ((i / 3) | 0) * .14, back + .2, 14, H); for (let i = 0; i < 10; i++) b.box(.03, .03, .02, lit ? pick(b, ["glowgreen", "glowred", "glowamber"]) : "pgrey", -w * .4 + i * w * .09, h * .35, back + .2); b.box(.06, .15, .04, "pred", w * .3, h * .15, back + .2); return; }
    if (st === "switch") { b.box(w, h, .1, "body", 0, 0, back + .05); b.box(.04, .2, .04, "pblack", 0, h * .4, back + .12, -.4); b.cyl(.03, .03, .05, "pred", 0, h * .4 + .18, back + .18, 8, H); return; }
    if (st === "keypad") { b.rbox(w, h, .05, .01, "body", 0, 0, back + .025); for (let i = 0; i < 12; i++) b.box(.025, .02, .01, "pgrey", -.04 + (i % 3) * .04, .03 + ((i / 3) | 0) * .035, back + .055); b.box(.1, .03, .005, lit ? "screengreen" : "screenoff", 0, h - .05, back + .052); return; }
    if (st === "radiator") { for (let i = 0; i < Math.round(w / .06); i++) b.rbox(.04, h, d * .8, .015, "body", -w / 2 + .03 + i * .06, 0, 0); b.rod(.02, w, "body", 0, .05, 0); b.rod(.02, w, "body", 0, h - .05, 0); return; }
  });

  /* ================= the wild ================= */
  G("tree", (b, p) => {
    const { w, h } = p, st = p.style || "oak", dead = st === "dead" || b.cond === "burned", trunkM = has(p, "trunk") ? "trunk" : "bark", leaf = has(p, "leaf") ? "leaf" : "leaf";
    const tr = Math.max(.08, w * .07);
    if (st === "pine" || st === "fir") { b.cyl(tr * .6, tr, h * .3, trunkM, 0, 0, 0, 10); for (let i = 0; i < 4; i++) b.cone(w / 2 * (1 - i * .2), h * .38, b.cond === "burned" ? "coal" : (i % 2 ? "leafdark" : leaf), 0, h * (.18 + i * .18), 0, 12); if (p.snow) for (let i = 0; i < 4; i++) b.cone(w / 2 * (1 - i * .2) * .7, h * .12, "snow", 0, h * (.38 + i * .18), 0, 12); return; }
    if (st === "palm") { const pts = []; for (let i = 0; i <= 8; i++) pts.push([Math.sin(i * .2) * w * .15 * i / 8, i * h * .9 / 8, 0]); b.tube(pts, tr * .7, trunkM); const top = pts[8]; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; b.tube([top, [top[0] + Math.cos(a) * w * .25, top[1] + .25, Math.sin(a) * w * .25], [top[0] + Math.cos(a) * w * .5, top[1] - .3, Math.sin(a) * w * .5]], .05, leaf); b.part(() => b.box(w * .4, .01, .25, leaf), top[0] + Math.cos(a) * w * .3, top[1] + .05, Math.sin(a) * w * .3, 0, -a, -.25); } for (let i = 0; i < 3; i++) b.sph(.08, "walnut", top[0] + (i - 1) * .12, top[1] - .1, .08, 1, 8); return; }
    if (st === "willow") { b.cyl(tr * .8, tr * 1.3, h * .45, trunkM, 0, 0, 0, 10); b.sph(w * .38, leaf, 0, h * .7, 0, .6, 14); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; b.tube([[Math.cos(a) * w * .25, h * .72, Math.sin(a) * w * .25], [Math.cos(a) * w * .45, h * .55, Math.sin(a) * w * .45], [Math.cos(a) * w * .5, h * .15, Math.sin(a) * w * .5]], .04, i % 2 ? leaf : "leafdark"); } return; }
    if (st === "birch") { b.cyl(tr * .5, tr * .7, h * .75, "birch", 0, 0, 0, 10); for (let i = 0; i < 6; i++) b.box(tr * 1.42, .02, tr * .2, "coal", 0, h * (.1 + i * .1), tr * .55, 0, i, 0); for (let i = 0; i < 5; i++) b.sph(w * (.18 + b.r() * .08), dead ? "leafautumn" : pick(b, ["leaf", "fruitgreen"]), (b.r() - .5) * w * .4, h * (.6 + b.r() * .3), (b.r() - .5) * w * .4, 1.1, 10); return; }
    if (st === "dead" || st === "gnarled") { b.cyl(tr * .7, tr * 1.3, h * .5, st === "dead" ? "driftwood" : trunkM, 0, 0, 0, 9); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + b.r(), l = w * (.3 + b.r() * .25); b.tube([[0, h * (.35 + i * .04), 0], [Math.cos(a) * l * .5, h * (.6 + b.r() * .15), Math.sin(a) * l * .5], [Math.cos(a) * l, h * (.75 + b.r() * .25), Math.sin(a) * l]], tr * .3, st === "dead" ? "driftwood" : trunkM); } if (st === "gnarled") for (let i = 0; i < 4; i++) b.sph(w * .2, "leafdark", (b.r() - .5) * w * .6, h * (.75 + b.r() * .2), (b.r() - .5) * w * .6, .7, 9); if (p.noose) { b.cyl(.004, .004, h * .4, "rope", w * .3, h * .38, 0, 4); b.tor(.08, .008, "rope", w * .3, h * .36, 0, 0); } return; }
    if (st === "fruit") { b.cyl(tr * .6, tr * .9, h * .5, trunkM, 0, 0, 0, 10); b.sph(w * .42, leaf, 0, h * .7, 0, .8, 14); for (let i = 0; i < 12; i++) { const a = b.r() * TAU, e = b.r() * 1.2 - .3; b.sph(.05, p.fruit || "fruitred", Math.cos(a) * Math.cos(e) * w * .42, h * .7 + Math.sin(e) * w * .34, Math.sin(a) * Math.cos(e) * w * .42, 1, 8); } return; }
    if (st === "alien") { b.tube([[0, 0, 0], [w * .1, h * .4, 0], [-w * .05, h * .8, w * .05]], tr, has(p, "trunk") ? "trunk" : "alien"); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; b.sph(w * .15, "glowviolet", Math.cos(a) * w * .3, h * (.8 + b.r() * .2), Math.sin(a) * w * .3, 1.3, 10); b.tube([[-w * .05, h * .8, w * .05], [Math.cos(a) * w * .3, h * .95, Math.sin(a) * w * .3]], tr * .3, "alien"); } return; }
    // a broad leafy tree
    b.cyl(tr * .7, tr * 1.2, h * .5, trunkM, 0, 0, 0, 10);
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3; b.tube([[0, h * .4, 0], [Math.cos(a) * w * .2, h * .6, Math.sin(a) * w * .2]], tr * .4, trunkM); }
    const lf = dead ? "leafautumn" : st === "autumn" ? "leafautumn" : leaf;
    for (let i = 0; i < 7; i++) b.sph(w * (.24 + b.r() * .1), i % 3 ? lf : (dead || st === "autumn" ? "fruitred" : "leafdark"), (b.r() - .5) * w * .5, h * (.6 + b.r() * .25), (b.r() - .5) * w * .5, .85, 10);
  });

  G("bush", (b, p) => {
    const { w, d, h } = p, st = p.style || "round", lf = has(p, "leaf") ? "leaf" : "leaf";
    if (st === "hedge") { b.rbox(w, h, d, .15, lf); for (let i = 0; i < Math.round(w / .3); i++) b.sph(d * .3, "leafdark", -w / 2 + .15 + i * .3, h * (.8 + b.r() * .2), (b.r() - .5) * d * .4, .7, 8); return; }
    if (st === "flowers") { for (let i = 0; i < 4; i++) b.sph(w * .25, lf, (b.r() - .5) * w * .5, h * .4, (b.r() - .5) * d * .5, .7, 9); for (let i = 0; i < 14; i++) b.sph(.04, p.bloom || pick(b, ["fruitred", "fruityellow", "white", "purple"]), (b.r() - .5) * w * .8, h * (.6 + b.r() * .3), (b.r() - .5) * d * .8, .6, 6); return; }
    if (st === "thorn") { for (let i = 0; i < 14; i++) { const a = b.r() * TAU, e = b.r(); b.tube([[0, 0, 0], [Math.cos(a) * w * .3, h * e, Math.sin(a) * d * .3], [Math.cos(a) * w * .5, h * (e * .6 + .2), Math.sin(a) * d * .5]], .012, "bark"); } return; }
    if (st === "fern") { for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + b.r() * .3; b.tube([[0, 0, 0], [Math.cos(a) * w * .25, h, Math.sin(a) * d * .25], [Math.cos(a) * w * .5, h * .5, Math.sin(a) * d * .5]], .02, i % 2 ? lf : "leafdark"); } return; }
    for (let i = 0; i < 6; i++) b.sph(Math.min(w, d) * (.28 + b.r() * .1), i % 2 ? lf : "leafdark", (b.r() - .5) * w * .4, h * (.35 + b.r() * .2), (b.r() - .5) * d * .4, .8, 9);
  });

  G("rock", (b, p) => {
    const { w, d, h } = p, st = p.style || "boulder";
    if (st === "boulder") { lump(b, w * .5, "body", 0, h * .5, 0, h / w * 1.2, .35); return; }
    if (st === "cluster") { for (let i = 0; i < 6; i++) lump(b, w * (.12 + b.r() * .15), "body", (b.r() - .5) * w * .7, .05, (b.r() - .5) * d * .7, .7, .4); return; }
    if (st === "pebbles") { for (let i = 0; i < 20; i++) lump(b, .03 + b.r() * .05, "body", (b.r() - .5) * w, .02, (b.r() - .5) * d, .6, .3, 0); return; }
    if (st === "stalagmite") { for (let i = 0; i < 5; i++) b.cone(w * (.08 + b.r() * .1), h * (.4 + b.r() * .6), "body", (b.r() - .5) * w * .6, 0, (b.r() - .5) * d * .6, 8); return; }
    if (st === "standing") { b.part(() => b.box(w, h, d, "body", 0, 0), 0, 0, 0, (b.r() - .5) * .1, 0, (b.r() - .5) * .1); lump(b, w * .35, "moss", 0, h * .1, d * .3, .3, .5, 0); return; }
    if (st === "circle") { for (let i = 0; i < 8; i++) { const a = i * TAU / 8; b.part(() => b.box(.6, 2 + b.r() * .6, .4, "body"), Math.cos(a) * w * .45, 0, Math.sin(a) * w * .45, (b.r() - .5) * .1, -a + H, 0); } b.box(1.2, .9, .6, "body", 0, 0, 0); return; }
  });

  G("log", (b, p) => {
    const { w, d, h } = p, st = p.style || "log";
    if (st === "stump") { b.cyl(w / 2 * .92, w / 2, h, "bark", 0, 0, 0, 14); b.cyl(w / 2 * .88, w / 2 * .88, .005, "body", 0, h, 0, 14); for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + .4; b.tube([[Math.cos(a) * w * .4, .1, Math.sin(a) * w * .4], [Math.cos(a) * w * .65, .02, Math.sin(a) * w * .65]], .05, "bark"); } return; }
    b.part(() => { b.cyl(d / 2, d / 2 * 1.05, w, "bark", 0, 0, 0, 14); b.cyl(d / 2 * .92, d / 2 * .92, .005, "body", 0, w / 2 + .002, 0, 14); }, 0, d / 2, 0, 0, 0, H);
    if (st === "mossy") for (let i = 0; i < 4; i++) lump(b, d * .3, "moss", (b.r() - .5) * w * .7, d * .85, 0, .3, .5, 0);
  });

  G("growth", (b, p) => {
    const { w, d, h } = p, st = p.style || "mushrooms";
    if (st === "mushrooms") { for (let i = 0; i < (p.n || 7); i++) { const s = .5 + b.r(), x = (b.r() - .5) * w * .8, z = (b.r() - .5) * d * .8; b.cyl(.015 * s, .02 * s, .08 * s, "white", x, 0, z, 8); b.sph(.05 * s, has(p, "cap") ? "cap" : "mushroom", x, .08 * s, z, .55, 10); } return; }
    if (st === "giant") { b.cyl(w * .08, w * .12, h * .8, "white", 0, 0, 0, 12); b.sph(w / 2, has(p, "cap") ? "cap" : "mushroom", 0, h * .8, 0, .45, 18); if (p.glow) for (let i = 0; i < 8; i++) b.sph(.03, "glowcyan", (b.r() - .5) * w * .7, h * .9, (b.r() - .5) * w * .7, 1, 6); return; }
    if (st === "flowers") { for (let i = 0; i < 24; i++) { const x = (b.r() - .5) * w, z = (b.r() - .5) * d, hh = .1 + b.r() * .2; b.cyl(.004, .004, hh, "leaf", x, 0, z, 4); b.sph(.025, pick(b, ["fruitred", "fruityellow", "white", "purple", "blue"]), x, hh, z, .5, 6); } return; }
    if (st === "grass") { for (let i = 0; i < 40; i++) { const x = (b.r() - .5) * w, z = (b.r() - .5) * d; b.part(() => b.cone(.02, h * (.5 + b.r() * .5), pick(b, ["leaf", "leafdark", "straw"]), 0, 0, 0, 3), x, 0, z, (b.r() - .5) * .4, b.r() * 3, (b.r() - .5) * .4); } return; }
    if (st === "reeds") { for (let i = 0; i < 26; i++) { const x = (b.r() - .5) * w, z = (b.r() - .5) * d, hh = h * (.6 + b.r() * .4); b.cyl(.006, .008, hh, "leaf", x, 0, z, 4); if (b.r() < .4) b.cyl(.015, .015, .1, "walnut", x, hh - .05, z, 6); } return; }
    if (st === "cactus") { b.cyl(w * .14, w * .16, h, "leafdark", 0, 0, 0, 10); b.sph(w * .14, "leafdark", 0, h, 0, 1, 10); for (const s of [-1, 1]) b.tube([[0, h * (.4 + s * .05), 0], [s * w * .35, h * .45, 0], [s * w * .35, h * (.8 - s * .1), 0]], w * .09, "leafdark"); return; }
    if (st === "crystals") { for (let i = 0; i < (p.n || 7); i++) { const x = (b.r() - .5) * w * .6, z = (b.r() - .5) * d * .6, hh = h * (.4 + b.r() * .6); b.part(() => { b.cyl(.06 * hh / h + .03, .08 * hh / h + .04, hh * .8, has(p, "crystal") ? "crystal" : "crystal", 0, 0, 0, 6); b.cone(.06 * hh / h + .03, hh * .25, has(p, "crystal") ? "crystal" : "crystal", 0, hh * .8, 0, 6); }, x, 0, z, (b.r() - .5) * .6, b.r() * 3, (b.r() - .5) * .6); } return; }
    if (st === "alien") { for (let i = 0; i < 5; i++) { const x = (b.r() - .5) * w * .6, z = (b.r() - .5) * d * .6, hh = h * (.4 + b.r() * .6); b.tube([[x, 0, z], [x + (b.r() - .5) * .2, hh * .6, z], [x + (b.r() - .5) * .3, hh, z]], .03, "alien"); b.sph(.1 + b.r() * .08, pick(b, ["glowviolet", "glowcyan", "glowmagenta"]), x, hh, z, 1.2, 10); } return; }
    if (st === "vines") { for (let i = 0; i < 6; i++) { const pts = []; let x = (b.r() - .5) * w, z = (b.r() - .5) * d; for (let k = 0; k < 7; k++) { pts.push([x, .02, z]); x += (b.r() - .5) * w * .3; z += (b.r() - .5) * d * .3; } b.tube(pts, .02, pick(b, ["leaf", "leafdark", "bark"])); } return; }
    if (st === "roots") { for (let i = 0; i < 7; i++) { const a = i * TAU / 7; b.tube([[0, .2, 0], [Math.cos(a) * w * .25, .1, Math.sin(a) * d * .25], [Math.cos(a) * w * .5, 0, Math.sin(a) * d * .5]], .05 * (1 - i * .08), "bark"); } return; }
    if (st === "coral") { for (let i = 0; i < 6; i++) { const x = (b.r() - .5) * w * .6, z = (b.r() - .5) * d * .6; b.tube([[x, 0, z], [x + (b.r() - .5) * .2, h * .5, z + (b.r() - .5) * .2], [x + (b.r() - .5) * .3, h, z]], .04, pick(b, ["ppink", "porange", "glowmagenta"])); } return; }
    if (st === "eggs") { for (let i = 0; i < (p.n || 9); i++) { const x = (b.r() - .5) * w * .7, z = (b.r() - .5) * d * .7, s = .7 + b.r() * .5; b.sph(.12 * s, has(p, "egg") ? "egg" : "slime", x, .1 * s, z, 1.3, 12); } b.decal("ooze", (g, W, Hh) => { g.fillStyle = "rgba(90,120,30,.7)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(W * (.2 + Math.random() * .6), Hh * (.2 + Math.random() * .6), W * .15, Hh * .12, 0, 0, 7); g.fill(); } }, w, d, .003); return; }
    if (st === "tentacles") { for (let i = 0; i < (p.n || 4); i++) { const a = i * TAU / (p.n || 4) + b.r(), x = Math.cos(a) * w * .2, z = Math.sin(a) * d * .2, pts = []; for (let k = 0; k <= 8; k++) pts.push([x + Math.sin(k * .7 + i) * w * .12 * k / 8, k * h / 8, z + Math.cos(k * .9 + i) * d * .1 * k / 8]); b.tube(pts, .07, has(p, "skin") ? "skin" : "alien"); for (let k = 2; k < 8; k++) b.sph(.018, "flesh", pts[k][0] + .06, pts[k][1], pts[k][2], .6, 6); } lump(b, Math.min(w, d) * .3, "slime", 0, 0, 0, .3, .4); return; }
  });

  G("water", (b, p) => {
    const { w, d } = p, st = p.style || "pond";
    if (st === "puddle") { b.decal("pud" + b.cond, (g, W, Hh) => { g.fillStyle = b.cond === "dirty" ? "rgba(70,60,40,.8)" : "rgba(60,90,110,.7)"; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * TAU / 16, r = .4 + Math.random() * .1; g.lineTo(W / 2 + Math.cos(a) * W * r, Hh / 2 + Math.sin(a) * Hh * r); } g.fill(); }, w, d, .003, { rough: .05 }); return; }
    b.cyl(.5, .5, .02, has(p, "water") ? "water" : "water", 0, .02, 0, 28).scale.set(w, 1, d);
    for (let i = 0; i < 18; i++) { const a = i * TAU / 18; lump(b, .12 + b.r() * .06, has(p, "rim") ? "rim" : "granite", Math.cos(a) * w * .5, .04, Math.sin(a) * d * .5, .6, .4, 0); }
    if (st === "lilies") for (let i = 0; i < 5; i++) b.cyl(.12, .12, .01, "leaf", (b.r() - .5) * w * .5, .04, (b.r() - .5) * d * .5, 12);
    if (st === "fountain") { b.cyl(.2, .25, .9, has(p, "rim") ? "rim" : "marble", 0, 0, 0, 16); b.lathe([[0, 0], [.6, .05], [.65, .15], [0, .12]], has(p, "rim") ? "rim" : "marble", 0, .9, 0, 22); b.cyl(.04, .04, .4, has(p, "rim") ? "rim" : "marble", 0, 1.05, 0, 10); b.cyl(.58, .58, .01, "water", 0, 1.03, 0, 22); }
  });

  /* ================= what rooms are built of ================= */
  G("wall", (b, p) => {
    const { w, d, h } = p, st = p.style || "plain";
    const ruined = st === "ruined" || b.cond === "ruined";
    if (st === "log") { const n = Math.round(h / .25); for (let i = 0; i < n; i++) b.part(() => b.cyl(.13, .13, w + .2, "body", 0, 0, 0, 10, 0, H), 0, .13 + i * .24, 0); return; }
    if (st === "panel") { b.box(w, h, d, "body"); for (let i = 0; i < Math.round(w / 1); i++) { b.box(.9, h - .3, .02, "panelm" in (p.m || {}) ? "panelm" : "hullgrey", -w / 2 + .5 + i, .15, d / 2 + .005); b.box(.9, .02, .022, "glowcyan", -w / 2 + .5 + i, h * .8, d / 2 + .01); } return; }
    if (st === "window") { b.box(w, .9, d, "body"); b.box(w, h - 2.1, d, "body", 0, 2.1); for (const sx of [-1, 1]) b.box((w - 1.2) / 2, 1.2, d, "body", sx * (w / 2 - (w - 1.2) / 4), .9); b.box(1.2, 1.2, .02, b.broken ? "frosted" : "glass", 0, .9); b.box(.04, 1.2, .06, "frame" in (p.m || {}) ? "frame" : "oak", 0, .9); b.box(1.2, .04, .06, "frame" in (p.m || {}) ? "frame" : "oak", 0, 1.48); return; }
    if (st === "slit") { b.box(w, h, d, "body"); b.box(w * .6, .15, d + .02, "coal", 0, h * .6); return; }
    if (st === "fence-stone" || st === "low") { b.box(w, h, d, "body"); for (let i = 0; i < Math.round(w / .35); i++) lump(b, .1, "body", -w / 2 + .17 + i * .35, h, 0, .5, .4, 0); return; }
    if (ruined) { const n = Math.max(3, Math.round(w / .4)); for (let i = 0; i < n; i++) { const hh = h * (.3 + b.r() * .7) * (Math.abs(i - n / 2) < n * .2 ? .5 : 1); b.box(w / n + .005, hh, d, "body", -w / 2 + (i + .5) * w / n); } for (let i = 0; i < 7; i++) lump(b, .12 + b.r() * .1, "body", (b.r() - .5) * w, .05, d / 2 + b.r() * .5, .6, .4, 0); return; }
    b.box(w, h, d, "body");
    if (st === "timber") { for (let i = 0; i <= Math.round(w / .8); i++) b.box(.12, h, .02, "frame" in (p.m || {}) ? "frame" : "walnut", -w / 2 + i * w / Math.round(w / .8), 0, d / 2 + .005); b.box(w, .12, .02, "frame" in (p.m || {}) ? "frame" : "walnut", 0, h * .5, d / 2 + .005); for (let i = 0; i < Math.round(w / .8); i++) plank(b, [-w / 2 + i * w / Math.round(w / .8) + .06, .1, d / 2 + .005], [-w / 2 + (i + 1) * w / Math.round(w / .8) - .06, h * .5 - .05, d / 2 + .005], .1, .02, "frame" in (p.m || {}) ? "frame" : "walnut"); }
    if (st === "bars") { b.box(w, .1, d, "body"); }
  });

  G("door", (b, p) => {
    const { w, d, h } = p, st = p.style || "wood", open = p.open ? (p.open === true ? 1.3 : p.open) : 0, fr = has(p, "frame") ? "frame" : "body";
    // the frame
    if (st !== "bars" && st !== "portcullis" && st !== "gate") { for (const sx of [-1, 1]) b.box(.1, h, d, fr, sx * (w / 2 - .05)); b.box(w, .12, d, fr, 0, h - .12); }
    const lw = w - .2, lh = h - .14;
    const leaf = () => {
      if (st === "wood") { b.box(lw, lh, .05, "body", lw / 2); for (let i = 0; i < 4; i++) b.box(lw - .06, .004, .052, "coal", lw / 2, lh * (i + 1) / 5); b.sph(.03, "brass", lw - .08, lh * .48, .04, 1, 8); }
      else if (st === "iron") { b.box(lw, lh, .07, "body", lw / 2); for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) b.sph(.018, "iron", .1 + c * (lw - .2) / 3, .2 + r * (lh - .4) / 4, .04, 1, 6); for (const y of [.25, lh - .25]) b.box(lw, .06, .075, "iron", lw / 2, y); b.tor(.05, .01, "iron", lw - .12, lh * .5, .05, 0, 0); }
      else if (st === "modern") { b.box(lw, lh, .04, "body", lw / 2); b.rod(.012, .14, "chrome", lw - .14, lh * .48, .05); }
      else if (st === "glass") { b.box(lw, lh, .02, "glass", lw / 2); for (const x of [0, lw]) b.box(.04, lh, .04, "frame" in (p.m || {}) ? "frame" : "aluminium", x); b.rod(.015, lh * .4, "chrome", lw - .12, lh * .5, .05, "y"); }
      else if (st === "cell") { for (let i = 0; i < 7; i++) b.cyl(.015, .015, lh, "body", .06 + i * (lw - .12) / 6, 0, 0, 8); for (const y of [.1, lh * .5, lh - .1]) b.box(lw, .05, .04, "body", lw / 2, y); b.box(.12, .15, .08, "iron", lw - .1, lh * .45); }
      else if (st === "barn") { b.box(lw, lh, .05, "body", lw / 2); plank(b, [.05, .1, .03], [lw - .05, lh - .1, .03], .12, .03, "body"); b.box(lw, .12, .03, "body", lw / 2, .05, .02); b.box(lw, .12, .03, "body", lw / 2, lh - .2, .02); }
      else if (st === "vault") { b.cyl(lw / 2, lw / 2, .3, "body", lw / 2, lh / 2, 0, 28, H); for (let i = 0; i < 3; i++) b.box(.04, lw * .6, .04, "steel", lw / 2, lh / 2 - lw * .3, .17, 0, 0, i * PI / 3); b.cyl(.06, .06, .05, "steel", lw / 2, lh / 2, .17, 14, H); }
      else if (st === "secret") { b.box(lw, lh, .05, "body", lw / 2); for (let i = 0; i < 5; i++) b.box(lw - .04, .02, .2, "body", lw / 2, .15 + i * (lh - .3) / 4, .1); for (let i = 0; i < 5; i++) for (let k = 0; k < 8; k++) b.box(.035, .25, .17, pick(b, ["bookred", "bookgreen", "bookbrown", "bookblue"]), .08 + k * .07, .17 + i * (lh - .3) / 4, .1); }
    };
    if (st === "scifi") { b.box(w, h, d, fr); b.box(w - .4, h - .3, d + .02, "coal", 0, 0); if (open < .5) for (const sx of [-1, 1]) { b.box((w - .4) / 2, h - .3, .08, "body", sx * (w - .4) / 4, 0); b.box(.03, h - .4, .085, "glowcyan" in M.MATS && b.cond !== "ruined" ? "glowcyan" : "pgrey", sx * .03, .05); } b.box(.12, .18, .03, b.cond === "ruined" ? "screenoff" : "screengreen", w / 2 - .1, h * .5, d / 2 + .02); b.box(w - .2, .08, d + .04, "pyellow", 0, h - .3); return; }
    if (st === "bars") { b.box(w, .08, d, "body"); b.box(w, .08, d, "body", 0, h - .08); for (let i = 0; i < Math.round(w / .12); i++) b.cyl(.016, .016, h - .16, "body", -w / 2 + .06 + i * .12, .08, 0, 8); return; }
    if (st === "portcullis") { for (const sx of [-1, 1]) b.box(.3, h + .5, d + .3, fr in M.MATS ? fr : "granite", sx * (w / 2 + .15)); const y = open ? h * .7 : 0; for (let i = 0; i < Math.round(w / .2); i++) { b.box(.05, h, .05, "body", -w / 2 + .1 + i * .2, y); b.cone(.04, .12, "body", -w / 2 + .1 + i * .2, y - .12, 0, 4).rotation.x = PI; } for (let k = 0; k < 4; k++) b.box(w, .05, .05, "body", 0, y + .2 + k * (h - .3) / 3, 0); return; }
    if (st === "gate") { for (const sx of [-1, 1]) { b.box(.2, h + .3, .2, fr, sx * (w / 2 + .1)); b.sph(.12, fr, sx * (w / 2 + .1), h + .4, 0, 1, 10); } for (const s of [-1, 1]) b.part(() => { for (let i = 0; i < Math.round(w / 2 / .12); i++) { b.box(.02, h - .1, .02, "body", -s * (.06 + i * .12)); b.cone(.025, .1, "body", -s * (.06 + i * .12), h - .1, 0, 4); } b.box(w / 2, .04, .03, "body", -s * w / 4, .2); b.box(w / 2, .04, .03, "body", -s * w / 4, h - .4); }, s * w / 2, 0, 0, 0, open ? s * 1.1 : 0, 0); return; }
    if (st === "double") { for (const s of [-1, 1]) b.part(() => { b.box(lw / 2, lh, .05, "body", -s * lw / 4); for (let i = 0; i < 3; i++) b.box(lw / 2 - .08, .004, .052, "coal", -s * lw / 4, lh * (i + 1) / 4); b.box(.02, .15, .05, "brass", -s * .06, lh * .45, .03); }, s * lw / 2, 0, 0, 0, open ? s * open : 0, 0); return; }
    b.part(leaf, -lw / 2, 0, 0, 0, open, 0);
    if (st === "boarded") { b.box(lw, lh, .02, "coal"); for (let i = 0; i < 5; i++) b.box(lw + .1, .15, .03, "plank", 0, .2 + i * (lh - .3) / 4, .03, 0, 0, (b.r() - .5) * .3); }
  });

  G("window", (b, p) => {
    const { w, d, h } = p, st = p.style || "plain", fr = has(p, "frame") ? "frame" : "body";
    const y0 = 0;
    b.box(w, .06, d + .1, fr, 0, y0); b.box(w, .06, d, fr, 0, y0 + h - .06); for (const sx of [-1, 1]) b.box(.06, h, d, fr, sx * (w / 2 - .03), y0);
    if (st === "boarded") { b.box(w - .1, h - .1, .01, "coal", 0, y0 + .05); for (let i = 0; i < 4; i++) b.box(w + .15, .14, .03, "plank", 0, y0 + .15 + i * (h - .3) / 3, d / 2 + .02, 0, 0, (b.r() - .5) * .35); return; }
    if (st === "stained") { b.part(() => b.decal("stained", (g, W, Hh) => { const cols = ["#b8231d", "#2a5ab0", "#e8b726", "#3c8a4c", "#7b4aa8"]; for (let i = 0; i < 40; i++) { g.fillStyle = cols[i % 5]; g.beginPath(); g.moveTo(Math.random() * W, Math.random() * Hh); g.lineTo(Math.random() * W, Math.random() * Hh); g.lineTo(Math.random() * W, Math.random() * Hh); g.fill(); } g.strokeStyle = "#1d1b1a"; g.lineWidth = 4; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(Math.random() * W, 0); g.lineTo(Math.random() * W, Hh); g.stroke(); } }, w - .1, h - .1, 0, { glow: true }, true), 0, y0 + h / 2, 0); return; }
    b.box(w - .1, h - .1, .01, b.broken ? "frosted" : "glass", 0, y0 + .05);
    if (st === "plain" || st === "sash") { b.box(.03, h - .1, .03, fr, 0, y0 + .05); b.box(w - .1, .03, .03, fr, 0, y0 + h / 2); }
    if (st === "barred") for (let i = 0; i < 5; i++) b.cyl(.012, .012, h - .1, "iron", -w / 2 + .1 + i * (w - .2) / 4, y0 + .05, d / 2, 8);
    if (st === "porthole") { b.tor(w * .4, .05, fr, 0, y0 + h / 2, 0, 0, 0); }
    if (p.curtains) for (const sx of [-1, 1]) b.box(w * .25, h + .2, .04, "curtain" in (p.m || {}) ? "curtain" : "red", sx * w * .4, y0 - .1, d / 2 + .05);
  });

  G("stairs", (b, p) => {
    const { w, d, h } = p, st = p.style || "straight", n = p.steps || Math.max(3, Math.round(h / .19));
    if (st === "spiral") { const r = w / 2; b.cyl(.08, .08, h, has(p, "post") ? "post" : "steel", 0, 0, 0, 12); for (let i = 0; i < n; i++) { const a = i * TAU * .85 / n; b.part(() => b.slab([[0, -.06], [r, -.42 * r], [r, .42 * r], [0, .06]], .04, "body"), 0, (i + 1) * h / n - .04, 0, 0, a, 0); } b.tube(Array.from({ length: 13 }, (_, k) => { const a = k * TAU * .85 / 12; return [Math.cos(a) * r, .9 + k * h / 12, -Math.sin(a) * r]; }), .02, "rail" in (p.m || {}) ? "rail" : "steel"); return; }
    for (let i = 0; i < n; i++) { const sd = d / n; if (st === "open" || st === "metal") b.box(w, .04, sd + .02, "body", 0, (i + 1) * h / n - .04, d / 2 - (i + .5) * sd); else b.box(w, (i + 1) * h / n, sd, "body", 0, 0, d / 2 - (i + .5) * sd); }
    if (st === "open" || st === "metal") for (const sx of [-1, 1]) plank(b, [sx * (w / 2 - .03), 0, d / 2], [sx * (w / 2 - .03), h, -d / 2], .05, .25, "body");
    if (p.rail !== false) for (const sx of p.rail === "one" ? [1] : [-1, 1]) { b.part(() => { for (let i = 0; i < n; i += 2) b.cyl(.015, .015, .9, "rail" in (p.m || {}) ? "rail" : "body", 0, (i + 1) * h / n, d / 2 - (i + .5) * d / n, 6); }, sx * (w / 2 - .04), 0, 0); strut(b, [sx * (w / 2 - .04), .9 + h / n, d / 2 - d / n / 2], [sx * (w / 2 - .04), .9 + h, -d / 2 + d / n / 2], .025, "rail" in (p.m || {}) ? "rail" : "body"); }
  });

  G("fence", (b, p) => {
    const { w, h } = p, st = p.style || "picket", pm = has(p, "post") ? "post" : "body";
    const n = Math.max(1, Math.round(w / (st === "picket" ? .15 : st === "iron" ? .14 : 2)));
    if (st === "picket") { for (let i = 0; i <= n; i++) { if (b.broken && b.r() < .15) continue; b.box(.08, h - .08, .02, "body", -w / 2 + i * w / n, 0, 0); b.cone(.057, .08, "body", -w / 2 + i * w / n, h - .08, 0, 4).rotation.y = PI / 4; } for (const y of [h * .25, h * .7]) b.box(w, .06, .02, "body", 0, y, -.02); return; }
    if (st === "iron") { for (let i = 0; i <= n; i++) { b.cyl(.01, .01, h, "body", -w / 2 + i * w / n, 0, 0, 6); b.cone(.022, .07, "body", -w / 2 + i * w / n, h, 0, 4); } for (const y of [.12, h - .15]) b.box(w, .03, .02, "body", 0, y); for (let i = 0; i <= Math.round(w / 2); i++) b.box(.07, h + .1, .07, pm, -w / 2 + i * w / Math.max(1, Math.round(w / 2))); return; }
    if (st === "chain") { for (let i = 0; i <= Math.max(1, Math.round(w / 2.5)); i++) b.cyl(.025, .025, h, pm, -w / 2 + i * w / Math.max(1, Math.round(w / 2.5)), 0, 0, 8); b.rod(.015, w, pm, 0, h, 0); b.part(() => b.decal("chain", (g, W, Hh) => { g.strokeStyle = "rgba(160,166,170,.95)"; g.lineWidth = 2; for (let x = -Hh; x < W; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Hh, Hh); g.stroke(); g.beginPath(); g.moveTo(x + Hh, 0); g.lineTo(x, Hh); g.stroke(); } }, w, h, 0, null, true), 0, h / 2, 0); return; }
    if (st === "rail") { for (let i = 0; i <= n; i++) b.box(.1, h, .1, pm, -w / 2 + i * w / n); for (const y of [h * .35, h * .8]) b.box(w, .08, .05, "body", 0, y, .02); return; }
    if (st === "palisade") { for (let i = 0; i < Math.round(w / .22); i++) { const x = -w / 2 + .11 + i * .22, hh = h * (.9 + b.r() * .15); b.cyl(.1, .11, hh, "bark", x, 0, 0, 8); b.cone(.1, .3, "bark", x, hh, 0, 8); } b.box(w, .1, .06, "body", 0, h * .6, -.12); return; }
    if (st === "guard") { for (let i = 0; i <= n; i++) b.box(.05, h, .05, pm, -w / 2 + i * w / n); for (const y of [h * .5, h]) b.rod(.025, w, "body", 0, y, 0); return; }
  });

  G("platform", (b, p) => {
    const { w, d, h } = p, st = p.style || "dais";
    if (st === "stage") { b.box(w, h, d, "body"); b.box(w + .02, .03, d + .02, "top" in (p.m || {}) ? "top" : "plank", 0, h); b.part(() => { for (let i = 0; i < 2; i++) b.box(w * .6, h / 2 * (i + 1) - .01, .3, "body", 0, 0, d / 2 + .3 - i * .3); }, 0, 0, 0); return; }
    if (st === "round") { b.cyl(w / 2, w / 2, h, "body", 0, 0, 0, 32); b.cyl(w / 2 - .2, w / 2 - .2, h / 2, "body", 0, h, 0, 32); return; }
    if (st === "grate") { b.box(w, .06, d, "body", 0, h - .06); b.decal("grate", (g, W, Hh) => { g.strokeStyle = "#1c1a19"; g.lineWidth = 2; for (let x = 0; x < W; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); } }, w, d, h + .002); if (h > .2) for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, h - .06, .08, "steel", sx * (w / 2 - .04), 0, sz * (d / 2 - .04)); return; }
    if (st === "ramp") { b.ext([[-d / 2, 0], [d / 2, 0], [-d / 2, h]], w, "body", 0, 0, 0, -H); return; }
    if (st === "pallet") { b.box(w, h, d, "body"); return; }
    // a dais with a step on every side
    b.box(w, h * .5, d, "body"); b.box(w - .5, h * .5, d - .5, "body", 0, h * .5);
    if (p.carpet) b.box(w * .3, .01, d * .9, "carpet" in (p.m || {}) ? "carpet" : "red", 0, h, 0);
  });

  G("rubble", (b, p) => {
    const { w, d, h } = p, st = p.style || "stone";
    if (st === "stone") { for (let i = 0; i < 14; i++) lump(b, .08 + b.r() * .18, "body", (b.r() - .5) * w * .8, b.r() * h * .4, (b.r() - .5) * d * .8, .7, .4, 0); lump(b, Math.min(w, d) * .35, "body", 0, 0, 0, h / Math.min(w, d) * 1.2, .3); return; }
    if (st === "bricks") { for (let i = 0; i < 26; i++) b.box(.22, .07, .11, "brick", (b.r() - .5) * w * .8, b.r() * h * .5, (b.r() - .5) * d * .8, b.r() - .5, b.r() * 3, b.r() - .5); lump(b, Math.min(w, d) * .3, "dirt", 0, 0, 0, h / Math.min(w, d), .3); return; }
    if (st === "wood") { for (let i = 0; i < 9; i++) b.box(.12, .04, .6 + b.r() * .8, pick(b, ["plank", "oak", "pine"]), (b.r() - .5) * w * .7, b.r() * h * .5, (b.r() - .5) * d * .7, b.r() - .5, b.r() * 3, b.r() - .5); return; }
    if (st === "concrete") { for (let i = 0; i < 9; i++) b.box(.3 + b.r() * .4, .1 + b.r() * .15, .3 + b.r() * .4, "concrete", (b.r() - .5) * w * .7, b.r() * h * .3, (b.r() - .5) * d * .7, (b.r() - .5) * .5, b.r() * 3, (b.r() - .5) * .5); for (let i = 0; i < 5; i++) strut(b, [(b.r() - .5) * w * .5, .1, (b.r() - .5) * d * .5], [(b.r() - .5) * w * .7, .3 + b.r() * .3, (b.r() - .5) * d * .7], .008, "rust"); return; }
    if (st === "glass") { for (let i = 0; i < 16; i++) b.box(.03 + b.r() * .1, .004, .03 + b.r() * .1, "glass", (b.r() - .5) * w, .002, (b.r() - .5) * d, 0, b.r() * 3, 0); return; }
  });

  G("beam", (b, p) => {
    const { w, d, h } = p, st = p.style || "wood";
    if (st === "steel") { b.box(w, .02, d, "body", 0, h - .02); b.box(w, .02, d, "body", 0, h - .3); b.box(w, .28, .015, "body", 0, h - .28); return; }
    if (st === "truss") { b.box(w, .1, d, "body", 0, h - .1); for (let i = 0; i < Math.round(w / 1.5); i++) { const x = -w / 2 + .75 + i * 1.5; plank(b, [x - .5, h - .1, 0], [x, h - .7, 0], .08, d, "body"); plank(b, [x + .5, h - .1, 0], [x, h - .7, 0], .08, d, "body"); } return; }
    b.box(w, d, d, "body", 0, h - d);
  });

  /* ================= things painted on floors ================= */
  G("decal", (b, p) => {
    const { w, d } = p, st = p.style || "blood", seed = st + (p.c1 || "") + b.cond;
    const draw = {
      blood: (g, W, Hh) => { g.fillStyle = "rgba(90,10,10,.88)"; g.beginPath(); g.ellipse(W / 2, Hh / 2, W * .3, Hh * .25, .3, 0, 7); g.fill(); for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(W / 2 + (Math.random() - .5) * W * .9, Hh / 2 + (Math.random() - .5) * Hh * .9, Math.random() * W * .04 + 2, 0, 7); g.fill(); } },
      trail: (g, W, Hh) => { g.strokeStyle = "rgba(90,10,10,.8)"; g.lineCap = "round"; g.lineWidth = W * .08; g.beginPath(); g.moveTo(W * .1, Hh * .9); g.bezierCurveTo(W * .3, Hh * .5, W * .6, Hh * .7, W * .9, Hh * .1); g.stroke(); },
      oil: (g, W, Hh) => { g.fillStyle = "rgba(15,14,12,.85)"; g.beginPath(); for (let i = 0; i < 20; i++) { const a = i * TAU / 20, r = .3 + Math.random() * .15; g.lineTo(W / 2 + Math.cos(a) * W * r, Hh / 2 + Math.sin(a) * Hh * r); } g.fill(); },
      scorch: (g, W, Hh) => { const gr = g.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, W / 2); gr.addColorStop(0, "rgba(10,8,6,.95)"); gr.addColorStop(.6, "rgba(30,20,12,.6)"); gr.addColorStop(1, "rgba(30,20,12,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); },
      pentagram: (g, W, Hh) => { g.strokeStyle = p.c1 || "#7a0d0d"; g.lineWidth = W / 60; g.beginPath(); g.arc(W / 2, Hh / 2, W * .46, 0, 7); g.stroke(); g.beginPath(); g.arc(W / 2, Hh / 2, W * .4, 0, 7); g.stroke(); g.beginPath(); for (let i = 0; i <= 5; i++) { const a = -H + i * TAU * 2 / 5; g.lineTo(W / 2 + Math.cos(a) * W * .4, Hh / 2 + Math.sin(a) * Hh * .4); } g.stroke(); g.fillStyle = p.c1 || "#7a0d0d"; g.font = `${W / 18}px serif`; for (let i = 0; i < 20; i++) { const a = i * TAU / 20; g.fillText("ᚠᚢᚦᚨᚱᚲᚷᚹ"[i % 8], W / 2 + Math.cos(a) * W * .43 - W / 70, Hh / 2 + Math.sin(a) * Hh * .43 + W / 70); } },
      circle: (g, W, Hh) => { g.strokeStyle = p.c1 || "#6ff0ff"; g.lineWidth = W / 80; for (const r of [.47, .42, .25]) { g.beginPath(); g.arc(W / 2, Hh / 2, W * r, 0, 7); g.stroke(); } for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(W / 2 + Math.cos(a) * W * .335, Hh / 2 + Math.sin(a) * Hh * .335, W * .06, 0, 7); g.stroke(); } g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6; g.lineTo(W / 2 + Math.cos(a) * W * .25, Hh / 2 + Math.sin(a) * Hh * .25); } g.stroke(); },
      chalk: (g, W, Hh) => { g.strokeStyle = "rgba(240,238,230,.9)"; g.lineWidth = W / 90; g.beginPath(); g.ellipse(W * .5, Hh * .14, W * .09, Hh * .07, 0, 0, 7); g.moveTo(W * .46, Hh * .21); g.lineTo(W * .3, Hh * .3); g.lineTo(W * .12, Hh * .42); g.moveTo(W * .54, Hh * .21); g.lineTo(W * .7, Hh * .28); g.lineTo(W * .86, Hh * .2); g.moveTo(W * .42, Hh * .22); g.lineTo(W * .4, Hh * .55); g.lineTo(W * .28, Hh * .92); g.moveTo(W * .58, Hh * .22); g.lineTo(W * .6, Hh * .55); g.lineTo(W * .75, Hh * .9); g.moveTo(W * .4, Hh * .55); g.lineTo(W * .6, Hh * .55); g.stroke(); },
      hazard: (g, W, Hh) => { for (let x = -Hh; x < W + Hh; x += Hh * .5) { g.fillStyle = (Math.round(x / (Hh * .5)) % 2) ? "#e8b726" : "#1d1b1a"; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Hh * .5, 0); g.lineTo(x, Hh); g.lineTo(x - Hh * .5, Hh); g.fill(); } },
      helipad: (g, W, Hh) => { g.fillStyle = "#3c3d3f"; g.beginPath(); g.arc(W / 2, Hh / 2, W / 2, 0, 7); g.fill(); g.strokeStyle = "#e8b726"; g.lineWidth = W / 40; g.beginPath(); g.arc(W / 2, Hh / 2, W * .42, 0, 7); g.stroke(); g.fillStyle = "#f2efe6"; g.font = `bold ${W * .5}px Arial`; g.textAlign = "center"; g.fillText("H", W / 2, Hh * .68); },
      grate: (g, W, Hh) => { g.fillStyle = "#2a2c2e"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#0a0a0a"; for (let x = W * .1; x < W * .9; x += W / 9) g.fillRect(x, Hh * .1, W / 20, Hh * .8); },
      footprints: (g, W, Hh) => { g.fillStyle = p.c1 || "rgba(60,40,24,.75)"; for (let i = 0; i < 8; i++) { g.save(); g.translate(W * (.35 + (i % 2) * .3), Hh * (.92 - i * .11)); g.beginPath(); g.ellipse(0, 0, W * .05, Hh * .04, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, -Hh * .05, W * .04, Hh * .02, 0, 0, 7); g.fill(); g.restore(); } },
      crack: (g, W, Hh) => { g.strokeStyle = "rgba(20,16,12,.85)"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); let x = W / 2, y = Hh / 2; g.moveTo(x, y); for (let i = 0; i < 8; i++) { x += (Math.random() - .5) * W * .25; y += (Math.random() - .5) * Hh * .25; g.lineTo(x, y); } g.stroke(); } },
      moss: (g, W, Hh) => { for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${60 + Math.random() * 30},${90 + Math.random() * 30},${40},.6)`; g.beginPath(); g.arc(Math.random() * W, Math.random() * Hh, Math.random() * W * .08, 0, 7); g.fill(); } },
      leaves: (g, W, Hh) => { for (let i = 0; i < 70; i++) { g.fillStyle = ["#a8582a", "#c48a2c", "#7a3a1a", "#6b6a30"][i % 4]; g.save(); g.translate(Math.random() * W, Math.random() * Hh); g.rotate(Math.random() * 6); g.beginPath(); g.ellipse(0, 0, W * .025, W * .012, 0, 0, 7); g.fill(); g.restore(); } },
      snow: (g, W, Hh) => { const gr = g.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, W / 2); gr.addColorStop(0, "rgba(242,245,247,.95)"); gr.addColorStop(1, "rgba(242,245,247,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); },
      sand: (g, W, Hh) => { const gr = g.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, W / 2); gr.addColorStop(0, "rgba(216,192,138,.95)"); gr.addColorStop(1, "rgba(216,192,138,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); },
      arrow: (g, W, Hh) => { g.fillStyle = p.c1 || "#f2efe6"; g.beginPath(); g.moveTo(W / 2, Hh * .05); g.lineTo(W * .85, Hh * .45); g.lineTo(W * .62, Hh * .45); g.lineTo(W * .62, Hh * .95); g.lineTo(W * .38, Hh * .95); g.lineTo(W * .38, Hh * .45); g.lineTo(W * .15, Hh * .45); g.fill(); },
      sigil: (g, W, Hh) => { g.strokeStyle = p.c1 || "#7dff8a"; g.lineWidth = W / 50; g.beginPath(); g.moveTo(W * .5, Hh * .1); g.lineTo(W * .5, Hh * .9); g.moveTo(W * .2, Hh * .3); g.quadraticCurveTo(W * .5, Hh * .7, W * .8, Hh * .3); g.moveTo(W * .25, Hh * .75); g.lineTo(W * .75, Hh * .75); g.stroke(); g.beginPath(); g.arc(W * .5, Hh * .5, W * .1, 0, 7); g.stroke(); },
      water: (g, W, Hh) => { g.fillStyle = "rgba(60,90,110,.6)"; g.beginPath(); g.ellipse(W / 2, Hh / 2, W * .45, Hh * .4, 0, 0, 7); g.fill(); }
    }[st] || ((g, W, Hh) => { g.fillStyle = "#999"; g.fillRect(0, 0, W, Hh); });
    b.decal(seed, draw, w, d, .004, { glow: st === "circle" || st === "sigil", rough: st === "blood" || st === "oil" || st === "water" ? .15 : .9 });
  });
})(ATLAS);
