/* The models, part one: furniture, fittings, lights and the small things that stand on them. Each generator builds one
   kind of thing from simple solids and the library's materials (atlas-models.js), from its size (w across, d deep,
   h high, in metres) and its options; the catalogue (atlas-models-cat.js) names the variants. A model stands on y = 0,
   centred, its front to +z (down the map); one hung on a wall has its back at -z. */
(function (A) {
  "use strict";
  const M = A.models, G = M.gen, PI = Math.PI, H = PI / 2, TAU = PI * 2;
  Object.assign(M.MATS, {
    blood: ["organic", 0x4a0a0a, .25, 0, ""], ink: ["paper", 0x1d1b1a, .6, 0, ""], chalk: ["stone", 0xf0eee6, 1, 0, ""], coal: ["stone", 0x1c1a19, .9, 0, ""], ember: ["glow", 0xff5a1a, .6, 0, "", 0xc8360a], hay: ["organic", 0xd9bc6a, 1, 0, "burlap"], sandbag: ["fabric", 0xb19a6c, 1, 0, "burlap"], felt: ["fabric", 0x1f5a34, .95, 0, "fabric"], navy: ["fabric", 0x1f2a44, .95, 0, "fabric"], wine: ["fabric", 0x5a1424, .9, 0, "fabric"], gauze: ["fabric", 0xe8e4da, .95, 0, "", 0, .8], beige: ["plastic", 0xd8ceb4, .6, 0, ""], khaki: ["fabric", 0x8f8558, .95, 0, "camo"]
  });

  /* ---- shared pieces */
  const BOOKS = ["bookred", "bookgreen", "bookblue", "bookbrown", "leather", "bookred", "parchment"];
  // a cylinder or a plank from one point to another
  const strut = (b, a, c, r, m, seg) => { const T = b.T, dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], len = Math.hypot(dx, dy, dz) || .001; const me = b.cyl(r, r, len, m, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2, seg || 8, 1e-6); me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)); return me; };
  const plank = (b, a, c, w, t, m) => { const T = b.T, dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], len = Math.hypot(dx, dy, dz) || .001; const me = b.box(w, len, t, m, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - len / 2, (a[2] + c[2]) / 2); me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)); return me; };
  // a piece lying on the floor along z (a fallen leg, a plank)
  const lying = (b, w, len, t, m, x, z, ry) => b.part(() => b.box(w, t, len, m), x, 0, z, 0, ry || 0, 0);
  const pick = (b, list) => list[(b.r() * list.length) | 0];
  // books standing on a shelf from x0 to x1, at height y, their spines to +z
  function bookRow(b, x0, x1, y, z, depth, hmax, gaps) {
    let x = x0;
    while (x < x1 - .025) {
      const t = .018 + b.r() * .035, hh = hmax * (.68 + b.r() * .32); if (x + t > x1) break;
      if (gaps && b.r() < .07) { x += .06 + b.r() * .08; continue; }
      if (b.r() < .05 && x + hh < x1) { b.box(hh, t, depth * .8, pick(b, BOOKS), x + hh / 2, y, z); x += hh + .004; continue; }
      b.box(t, hh, depth * (.72 + b.r() * .22), pick(b, BOOKS), x + t / 2, y, z); x += t + .002;
    }
  }
  // the small things a surface is dressed with; also used on their own
  const P = M.parts = {
    bottle: (b, x, y, z, m, s = 1) => b.lathe([[.035 * s, 0], [.037 * s, .16 * s], [.03 * s, .19 * s], [.012 * s, .22 * s], [.012 * s, .27 * s], [.014 * s, .28 * s], [0, .28 * s]], m || "glassgreen", x, y, z, 12),
    flask: (b, x, y, z, m, s = 1) => { b.lathe([[0, 0], [.05 * s, .004], [.066 * s, .04 * s], [.056 * s, .08 * s], [.018 * s, .11 * s], [.014 * s, .17 * s], [0, .17 * s]], "glass", x, y, z, 14); b.sph(.05 * s, m || "glowgreen", x, y + .045 * s, z, .75, 10); },
    vial: (b, x, y, z, m) => { b.cyl(.012, .012, .09, "glass", x, y, z, 8); b.cyl(.01, .01, .05, m || "glowred", x, y, z, 8); b.cyl(.013, .013, .015, "cork" in M.MATS ? "cork" : "pine", x, y + .09, z, 8); },
    book: (b, x, y, z, m, ry, s = 1) => b.part(() => { b.box(.17, .035, .24, m || "bookred"); b.box(.16, .027, .226, "paper", .008, .004, 0); }, x, y, z, 0, ry || 0, 0, s),
    openbook: (b, x, y, z, ry, s = 1) => b.part(() => { b.box(.36, .012, .25, "leather"); b.box(.17, .02, .23, "paper", -.088, .01, 0, 0, 0, .06); b.box(.17, .02, .23, "paper", .088, .01, 0, 0, 0, -.06); }, x, y, z, 0, ry || 0, 0, s),
    candle: (b, x, y, z, s = 1, lit = true, hh = .12) => b.part(() => { b.cyl(.018, .02, hh, "wax"); if (lit) b.cone(.009, .03, "fire", 0, hh + .004, 0, 8); }, x, y, z, 0, 0, 0, s),
    mug: (b, x, y, z, m, s = 1) => b.part(() => { b.cyl(.04, .037, .1, m || "terracotta"); b.tor(.03, .007, m || "terracotta", .045, .05, 0, 0, 0); }, x, y, z, 0, 0, 0, s),
    goblet: (b, x, y, z, m, s = 1) => b.lathe([[.03 * s, 0], [.032 * s, .006 * s], [.006 * s, .02 * s], [.006 * s, .07 * s], [.035 * s, .1 * s], [.04 * s, .15 * s], [.038 * s, .15 * s], [0, .1 * s]], m || "silver", x, y, z, 16),
    plate: (b, x, y, z, food, s = 1) => b.part(() => {
      b.cyl(.11, .08, .015, "porcelain", 0, 0, 0, 24);
      if (food === "bread") b.sph(.06, "bread", 0, .04, 0, .6, 12);
      else if (food === "meat") { b.sph(.055, "meat", -.01, .035, 0, .55, 10); b.rod(.008, .08, "bone", .055, .03, 0); }
      else if (food === "fruit") for (let i = 0; i < 4; i++) b.sph(.03, ["fruitred", "fruitgreen", "fruityellow"][i % 3], Math.cos(i * 1.6) * .045, .045, Math.sin(i * 1.6) * .045, 1, 10);
      else if (food === "cheese") b.ext([[0, 0], [.1, 0], [0, .06]], .06, "cheese", -.03, .015, 0);
      else if (food === "stew") { b.cyl(.075, .05, .05, "terracotta", 0, .012, 0, 18); b.cyl(.068, .068, .004, "meat", 0, .055, 0, 18); }
    }, x, y, z, 0, 0, 0, s),
    paper: (b, x, y, z, ry, m) => b.box(.21, .002, .297, m || "paper", x, y, z, 0, ry || 0, 0),
    skull: (b, x, y, z, ry, s = 1) => b.part(() => { b.sph(.075, "bone", 0, .085, -.012, 1, 14); b.box(.075, .045, .07, "bone", 0, .02, .035); b.sph(.019, "coal", -.028, .088, .052, 1, 8); b.sph(.019, "coal", .028, .088, .052, 1, 8); b.box(.012, .02, .01, "coal", 0, .055, .072); }, x, y, z, 0, ry || 0, 0, s),
    coins: (b, x, y, z, s = 1) => b.part(() => { b.cone(.11, .06, "gold", 0, 0, 0, 14); for (let i = 0; i < 14; i++) { const a = b.r() * TAU, d = .09 + b.r() * .07; b.cyl(.016, .016, .004, "gold", Math.cos(a) * d, 0, Math.sin(a) * d, 12); } }, x, y, z, 0, 0, 0, s),
    inkwell: (b, x, y, z) => { b.cyl(.025, .03, .04, "glass", x, y, z, 10); b.cyl(.02, .02, .03, "ink", x, y, z, 10); b.rod(.002, .18, "white", x + .03, y + .08, z, "x"); },
    knife: (b, x, y, z, ry) => b.part(() => { b.box(.14, .004, .02, "steel", .05); b.box(.09, .016, .02, "walnut", -.065); }, x, y, z, 0, ry || 0, 0),
    tray: (b, x, y, z, m) => b.box(.4, .015, .28, m || "steel", x, y, z),
    microscope: (b, x, y, z) => b.part(() => { b.box(.12, .02, .16, "pblack"); b.box(.03, .2, .03, "pblack", 0, .02, -.05); b.cyl(.018, .018, .14, "pblack", 0, .12, .0, 12, .5); b.box(.08, .01, .08, "steel", 0, .08, .02); }, x, y, z),
    monitor: (b, x, y, z, ry, m, s = 1) => b.part(() => { b.box(.18, .012, .14, "pblack"); b.box(.04, .2, .03, "pblack", 0, .01, -.03); b.box(.56, .34, .03, "pblack", 0, .14, -.02); b.box(.53, .31, .002, m || "screen", 0, .155, -.004); }, x, y, z, 0, ry || 0, 0, s),
    keyboard: (b, x, y, z, ry) => b.part(() => { b.box(.44, .022, .14, "pblack"); b.box(.42, .006, .12, "pgrey", 0, .022, 0); }, x, y, z, 0, ry || 0, 0),
    phone: (b, x, y, z, ry) => b.part(() => { b.rbox(.075, .009, .155, .008, "pblack"); b.box(.068, .001, .145, "screenoff", 0, .009, 0); }, x, y, z, 0, ry || 0, 0),
    cards: (b, x, y, z) => { for (let i = 0; i < 6; i++) b.box(.063, .002, .088, i % 2 ? "white" : "red", x + (b.r() - .5) * .25, y + i * .002, z + (b.r() - .5) * .2, 0, b.r() * TAU, 0); },
    chips: (b, x, y, z) => { for (let i = 0; i < 5; i++) for (let j = 0; j < 3 + ((b.r() * 5) | 0); j++) b.cyl(.02, .02, .004, ["pred", "pblue", "pgreen", "pblack", "pwhite"][i], x + i * .045, y + j * .0042, z, 14); },
    bone: (b, x, y, z, ry, s = 1) => b.part(() => { b.rod(.012, .22, "bone"); for (const e of [-1, 1]) { b.sph(.02, "bone", e * .11, 0, .012, 1, 8); b.sph(.02, "bone", e * .11, 0, -.012, 1, 8); } }, x, y + .02 * s, z, 0, ry || 0, 0, s),
    gem: (b, x, y, z, m, s = 1) => b.part(() => { b.cone(.03, .03, m || "ruby", 0, .03, 0, 6); const lo = b.cone(.03, .03, m || "ruby", 0, 0, 0, 6); lo.rotation.x = PI; lo.position.y = .015; }, x, y, z, 0, 0, 0, s)
  };
  M.MATS.cork = ["wood", 0xb38a5c, .95, 0, ""]; M.MATS.rope = ["fabric", 0xa88a5c, 1, 0, "burlap"];
  // a surface dressed with the things that belong on it: kind, width and depth of the surface, its height
  function dress(b, kind, w, d, y) {
    const r = b.r, sp = (k = 1) => [(r() - .5) * (w - .22) * k, (r() - .5) * (d - .16) * k];
    if (kind === "alchemy") { for (let i = 0; i < 5; i++) { const [x, z] = sp(); P.flask(b, x, y, z, ["glowgreen", "glowviolet", "glowamber", "glowred", "glowcyan"][i], .8 + r() * .7); } for (let i = 0; i < 4; i++) { const [x, z] = sp(); P.bottle(b, x, y, z, pick(b, ["glassgreen", "glassamber", "glassblue", "glasspurple"]), .55 + r() * .3); } P.openbook(b, -w * .2, y, d * .1, .2, .9); P.candle(b, w * .38, y, -d * .3); P.skull(b, w * .3, y, d * .15, -.4, .8); }
    else if (kind === "lab") { for (let i = 0; i < 6; i++) { const [x, z] = sp(); i % 2 ? P.flask(b, x, y, z, pick(b, ["glowgreen", "glowcyan", "glassblue"]), .7 + r() * .4) : P.vial(b, x, y, z, pick(b, ["glowred", "glowgreen", "glowamber"])); } P.microscope(b, w * .3, y, 0); P.paper(b, -w * .3, y, d * .1, .3); }
    else if (kind === "maps") { b.box(w * .7, .002, d * .7, "parchment", 0, y, 0, 0, .06, 0); P.candle(b, -w * .4, y, -d * .35); P.candle(b, w * .4, y, d * .35); P.knife(b, w * .15, y + .003, d * .1, .7); for (let i = 0; i < 5; i++) { const [x, z] = sp(.6); b.cyl(.012, .015, .03, pick(b, ["pred", "pblue", "brass"]), x, y + .002, z, 8); } }
    else if (kind === "dinner") { const n = Math.max(2, Math.floor(w / .55)); for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n; for (const s of [-1, 1]) { P.plate(b, x, y, s * (d / 2 - .17), pick(b, ["meat", "bread", "stew", "fruit", ""])); P.goblet(b, x + .14, y, s * (d / 2 - .26)); } } for (let i = 0; i < Math.max(1, n / 2); i++) P.candle(b, -w / 2 + (i + .5) * w / Math.max(1, n / 2) * .99, y, 0, 1.4); }
    else if (kind === "tavern") { for (let i = 0; i < 3; i++) { const [x, z] = sp(); P.mug(b, x, y, z, pick(b, ["terracotta", "pine", "iron"])); } { const [x, z] = sp(); P.plate(b, x, y, z, "bread"); } P.candle(b, 0, y, 0, 1, true, .07); }
    else if (kind === "papers") { for (let i = 0; i < 6; i++) { const [x, z] = sp(); P.paper(b, x, y + i * .002, z, (r() - .5) * 1.2, r() < .3 ? "parchment" : "paper"); } P.book(b, w * .3, y, -d * .2, "bookblue", .3); P.inkwell(b, -w * .35, y, -d * .25); }
    else if (kind === "office") { P.monitor(b, 0, y, -d * .22); P.keyboard(b, 0, y, d * .12); P.mug(b, w * .32, y, d * .05, "porcelain", .8); P.paper(b, -w * .33, y, d * .05, -.2); P.phone(b, w * .22, y, d * .2, .4); }
    else if (kind === "cards") { P.cards(b, 0, y, 0); P.chips(b, -w * .25, y, d * .25); P.chips(b, w * .1, y, -d * .28); P.mug(b, w * .35, y, d * .2, "glassamber"); }
    else if (kind === "tools") { b.box(.3, .015, .05, "walnut", -w * .2, y, d * .1, 0, .4, 0); b.box(.12, .04, .04, "iron", -w * .2 + .15, y, d * .1 - .06, 0, .4, 0); b.box(.25, .02, .03, "steel", w * .2, y, -d * .2, 0, -.3, 0); b.box(.35, .1, .18, "pred", w * .25, y, d * .15); for (let i = 0; i < 8; i++) { const [x, z] = sp(); b.cyl(.006, .006, .02, "steel", x, y, z, 6); } }
    else if (kind === "surgery") { P.tray(b, w * .25, y, -d * .2); for (let i = 0; i < 5; i++) P.knife(b, w * .25 - .14 + i * .07, y + .016, -d * .2, H); P.vial(b, -w * .3, y, d * .2, "glowred"); }
    else if (kind === "ritual") { P.openbook(b, 0, y, 0); P.skull(b, -w * .3, y, -d * .15, .3); for (let i = 0; i < 5; i++) P.candle(b, Math.cos(i * TAU / 5) * w * .35, y, Math.sin(i * TAU / 5) * d * .35, 1, true, .06 + r() * .1); b.box(.18, .003, .18, "blood", w * .2, y, d * .2); }
    else if (kind === "food") { P.plate(b, -w * .25, y, 0, "bread"); P.plate(b, w * .05, y, d * .1, "cheese"); P.plate(b, w * .3, y, -d * .1, "fruit"); P.bottle(b, -w * .05, y, -d * .25, "glassgreen"); }
    else if (kind === "evidence") { for (let i = 0; i < 5; i++) { const [x, z] = sp(); b.ext([[-.03, 0], [.03, 0], [0, .05]], .04, "pyellow", x, y, z); } P.paper(b, -w * .2, y, d * .2, .2); P.phone(b, w * .25, y, 0, 1); }
    else if (kind === "weapons") { b.box(.9, .012, .05, "steel", 0, y + .01, -d * .15, 0, .1, 0); b.box(.18, .03, .04, "leather", -.5, y, -d * .15 - .05, 0, .1, 0); P.knife(b, w * .2, y, d * .2, .5); b.cyl(.2, .2, .03, "oak", -w * .25, y, d * .15, 24); }
    else if (kind === "sewing") { b.box(.3, .2, .2, "pblack", -w * .2, y, 0); b.cyl(.012, .012, .1, "steel", -w * .2, y + .2, .05, 8); b.box(.4, .002, .3, "red", w * .15, y, 0, 0, .3, 0); }
    else if (kind === "radio") { b.box(.4, .2, .25, "olive", 0, y, -d * .15); b.cyl(.03, .03, .03, "pblack", -.1, y + .2, -d * .15, 10); b.rod(.004, .6, "steel", .12, y + .5, -d * .2, "y"); P.paper(b, w * .3, y, d * .2, .1); b.box(.1, .05, .06, "pblack", -w * .3, y, d * .2); }
  }
  M.dress = dress;
  const KN = ["", "alchemy", "lab", "maps", "dinner", "tavern", "papers", "office", "cards", "tools", "surgery", "ritual", "food", "evidence", "weapons", "sewing", "radio"];

  /* ================= furniture ================= */
  G("table", (b, p) => {
    const { w, d, h } = p, t = p.t || .045, y = h - t, st = p.style || "four", lt = p.lt || Math.max(.045, Math.min(.09, Math.min(w, d) * .07)), lost = b.broken ? (b.r() * 4) | 0 : -1;
    if (p.round) b.cyl(w / 2, w / 2, t, "top", 0, y, 0, 40); else if (p.rad) b.rbox(w, t, d, p.rad, "top", 0, y, 0); else b.box(w, t, d, "top", 0, y, 0);
    if (st === "four") {
      let k = 0; const ox = p.round ? w * .27 : w / 2 - lt, oz = p.round ? w * .27 : d / 2 - lt;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = sx * ox, z = sz * oz;
        if (k++ === lost) { b.box(lt, y * .5, lt, "legs", x, 0, z); lying(b, lt, y * .45, lt, "legs", x * 1.3, z + sz * .3, .7); continue; }
        if (p.turned) b.lathe([[lt * .42, 0], [lt * .58, .05], [lt * .36, y * .3], [lt * .62, y * .45], [lt * .34, y * .62], [lt * .5, y * .86], [lt * .6, y], [0, y]], "legs", x, 0, z, 12);
        else if (p.taper) b.cyl(lt * .45, lt * .25, y, "legs", x, 0, z, 10); else b.box(lt, y, lt, "legs", x, 0, z);
      }
      if (!p.noapron && !p.round) { const ah = Math.min(.1, y * .14); b.box(w - lt * 2, ah, .02, "legs", 0, y - ah, d / 2 - lt); b.box(w - lt * 2, ah, .02, "legs", 0, y - ah, -d / 2 + lt); b.box(.02, ah, d - lt * 2, "legs", w / 2 - lt, y - ah, 0); b.box(.02, ah, d - lt * 2, "legs", -w / 2 + lt, y - ah, 0); }
      if (p.rails) { b.box(w - lt * 2, .05, .04, "legs", 0, .12, d / 2 - lt); b.box(w - lt * 2, .05, .04, "legs", 0, .12, -d / 2 + lt); }
    } else if (st === "trestle") {
      for (const sx of [-1, 1]) { const x = sx * (w / 2 - .2); b.box(.07, y - .05, d * .4, "legs", x, .05, 0); b.box(.09, .06, d * .85, "legs", x, 0, 0); b.box(.09, .05, d * .78, "legs", x, y - .05, 0); }
      b.box(w - .4, .07, .05, "legs", 0, y * .3, 0);
    } else if (st === "pedestal") {
      b.lathe([[.065, 0], [.065, y * .08], [.045, y * .18], [.07, y * .5], [.045, y * .82], [.08, y], [0, y]], "legs", 0, 0, 0, 16);
      if (p.round || p.disc) b.cyl(Math.min(w, d) * .22, Math.min(w, d) * .27, .05, "legs", 0, 0, 0, 24); else { b.box(.07, .05, Math.min(w, d) * .6, "legs"); b.box(Math.min(w, d) * .6, .05, .07, "legs"); }
    } else if (st === "metal") {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.017, .017, y, "legs", sx * (w / 2 - .04), 0, sz * (d / 2 - .04), 10);
      for (const sz of [-1, 1]) b.rod(.012, w - .08, "legs", 0, y * .25, sz * (d / 2 - .04));
    } else if (st === "panel") {
      for (const sx of [-1, 1]) b.box(.035, y, d - .02, "legs", sx * (w / 2 - .02), 0, 0);
      b.box(w - .07, y * .5, .018, "legs", 0, y * .45, -d / 2 + .04);
    } else if (st === "x") {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) plank(b, [sx * (w / 2 - .1), 0, sz * d * .38], [sx * (w / 2 - .1), y, -sz * d * .38], .035, .025, "legs");
      b.rod(.012, w - .2, "legs", 0, y * .5, 0);
    } else if (st === "block") {
      b.box(w * .86, y, d * .8, "legs");
    }
    if (p.shelf) b.box(w - lt * 2.2, .025, d - lt * 2.2, "top", 0, Math.min(.18, y * .22), 0);
    if (p.drawers) {
      const n = p.drawers;
      if (p.ped) { const pw = Math.min(.42, w * .32), px = w / 2 - pw / 2 - .02; b.box(pw, y - .02, d - .06, "legs", px, .02, 0); for (let i = 0; i < n; i++) { const dh = (y - .06) / n, yy = .04 + i * dh; b.box(pw - .04, dh - .02, .02, "legs", px, yy, d / 2 - .03); b.box(.1, .012, .018, "brass", px, yy + dh / 2, d / 2 - .01); } }
      else for (let i = 0; i < n; i++) { const dw = (w - .16) / n, x = -w / 2 + .08 + (i + .5) * dw; b.box(dw - .02, .09, .02, "legs", x, y - .1, d / 2 - lt + .01); b.sph(.014, "brass", x, y - .055, d / 2 - lt + .03, 1, 8); }
    }
    if (p.cloth) { if (p.round) b.cyl(w / 2 + .03, w / 2 + .1, .3, "cloth", 0, h - .3 + .004, 0, 40); else b.box(w + .08, .28, d + .08, "cloth", 0, h - .28 + .004, 0); }
    if (p.felt) b.box(w - .16, .006, d - .16, "felt", 0, h, 0);
    if (p.items) dress(b, p.items, w, d, h + (p.cloth ? .006 : p.felt ? .006 : 0));
    if (p.straps) for (const z of [-.5, 0, .45]) b.box(w + .02, .012, .06, "leatherblack", 0, h, z * d);
  }, [["items", "On it", 0, KN.length - 1, 1, KN]]);

  G("chair", (b, p) => {
    const { w, d, h } = p, sh = p.sh || .46, st = p.style || "plain", lt = p.lt || .04;
    if (st === "office" || st === "gaming") {
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; b.box(.035, .03, w * .44, "legs", Math.sin(a) * w * .2, .05, Math.cos(a) * w * .2, 0, a, 0); b.sph(.026, "rubber", Math.sin(a) * w * .42, .026, Math.cos(a) * w * .42, 1, 8); }
      b.cyl(.026, .026, sh - .14, "steel", 0, .07, 0, 10);
      b.rbox(w * .88, .08, d * .82, .03, "seat", 0, sh - .08, .03);
      const bh = h - sh - .02; b.rbox(w * .82, bh, .07, .03, "seat", 0, sh + .02, -d / 2 + .08);
      if (st === "gaming") { for (const sx of [-1, 1]) b.rbox(.08, bh * .55, .11, .03, "trim", sx * w * .41, sh + .02 + bh * .1, -d / 2 + .09); b.rbox(w * .45, .1, .06, .03, "trim", 0, h - .2, -d / 2 + .14); b.box(w * .6, .03, .004, "trim", 0, sh + bh * .5, -d / 2 + .12); }
      if (p.arms !== false) for (const sx of [-1, 1]) { b.box(.025, .22, .025, "legs", sx * w * .44, sh - .05, 0); b.rbox(.06, .03, d * .45, .012, "rubber", sx * w * .44, sh + .17, 0); }
      return;
    }
    const yy = sh - .04, back = h > sh + .05;
    const lost = b.broken && st !== "throne" ? (b.r() * 2) | 0 : -1;
    if (st === "folding") {
      for (const sx of [-1, 1]) { plank(b, [sx * w * .45, 0, d * .45], [sx * w * .45, h, -d * .45], .02, .015, "legs"); plank(b, [sx * w * .45, 0, -d * .45], [sx * w * .45, sh, d * .3], .02, .015, "legs"); }
      b.box(w * .9, .02, d * .8, "seat", 0, sh - .02, 0); b.box(w * .86, .18, .015, "seat", 0, h - .24, -d * .38);
      return;
    }
    if (st === "plastic") {
      b.rbox(w, .04, d, .02, "seat", 0, sh - .04, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.025, .03, sh - .03, "seat", sx * (w / 2 - .05), 0, sz * (d / 2 - .05), 10);
      b.rbox(w * .95, h - sh, .03, .015, "seat", 0, sh - .02, -d / 2 + .03);
      if (p.arms) for (const sx of [-1, 1]) b.rbox(.04, .04, d * .8, .015, "seat", sx * (w / 2 - .02), sh + .18, 0);
      return;
    }
    // legs: the back legs run up into the back
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 - lt / 2);
      if (p.turned) b.lathe([[lt * .45, 0], [lt * .55, .04], [lt * .38, yy * .5], [lt * .55, yy * .7], [lt * .45, yy], [0, yy]], "frame", x, 0, d / 2 - lt / 2, 10); else b.box(lt, yy, lt, "frame", x, 0, d / 2 - lt / 2);
      if (back) b.box(lt, (sx === -1 && lost === 0) ? yy : h, lt, "frame", x, 0, -d / 2 + lt / 2); else b.box(lt, yy, lt, "frame", x, 0, -d / 2 + lt / 2);
      if (p.rungs !== false) b.box(lt * .6, lt * .6, d - lt, "frame", x, .14, 0);
    }
    if (p.rungs !== false) b.box(w - lt, lt * .6, lt * .6, "frame", 0, .2, d / 2 - lt / 2);
    if (st === "upholstered" || st === "throne" || p.pad) { b.box(w, .04, d, "frame", 0, yy - .02, 0); b.rbox(w - .02, .07, d - .03, .025, "seat", 0, yy + .01, .01); }
    else b.box(w, .035, d, p.m && p.m.seat ? "seat" : "frame", 0, yy, 0);
    if (back) {
      const top = h, by = sh + .04;
      if (st === "upholstered") b.rbox(w - lt * 2, top - by - .04, .06, .025, "seat", 0, by, -d / 2 + lt / 2 + .01);
      else if (st === "throne") {
        b.box(w - lt * 2, top - by, .06, "frame", 0, by, -d / 2 + lt / 2);
        b.rbox(w - lt * 2 - .08, (top - by) * .75, .05, .02, "seat", 0, by + .05, -d / 2 + lt / 2 + .04);
        b.ext([[-w / 2, 0], [w / 2, 0], [w * .3, .2], [0, .32], [-w * .3, .2]], .07, "frame", 0, top, -d / 2 + lt / 2);
        for (const sx of [-1, 1]) b.sph(.045, "trim", sx * (w / 2 - lt / 2), top + .04, -d / 2 + lt / 2, 1, 12);
        b.sph(.05, "trim", 0, top + .34, -d / 2 + lt / 2, 1, 12);
      } else if (p.spindles) { const n = p.spindles; b.box(w - lt * 2, .06, lt, "frame", 0, top - .06, -d / 2 + lt / 2); for (let i = 0; i < n; i++) b.cyl(.009, .009, top - by - .06, "frame", -w / 2 + lt + (i + .5) * (w - lt * 2) / n, by, -d / 2 + lt / 2, 6); }
      else if (p.ladder) { for (let i = 0; i < 3; i++) b.box(w - lt * 2, .05, .02, "frame", 0, by + (i + 1) * (top - by) / 3.6, -d / 2 + lt / 2); }
      else { const n = p.slats || 2; for (let i = 0; i < n; i++) { if (b.broken && i === 0) continue; b.box(w - lt * 2, Math.min(.1, (top - by) / (n * 1.8)), .02, "frame", 0, top - (i + 1) * (top - by) / (n + .4), -d / 2 + lt / 2); } b.box(w, .06, .03, "frame", 0, top - .06, -d / 2 + lt / 2); }
    }
    if (st === "arm" || st === "throne" || st === "upholstered" && p.arms || p.arms) {
      const ah = st === "throne" ? sh + .28 : sh + .22;
      for (const sx of [-1, 1]) { const x = sx * (w / 2 - lt / 2); b.box(lt, ah - yy, lt, "frame", x, yy, d / 2 - lt * 1.5); b.box(lt * 1.6, .04, d - lt, "frame", x, ah, -lt / 2); if (st === "throne") b.sph(.04, "trim", x, ah + .03, d / 2 - lt, 1, 10); }
    }
    if (st === "rocking") for (const sx of [-1, 1]) { const x = sx * (w / 2 - lt / 2); b.tube([[x, .09, -d * .85], [x, .02, -d * .3], [x, 0, 0], [x, .02, d * .35], [x, .1, d * .75]], .016, "frame"); }
    if (p.straps) { b.box(.06, .015, d * .9, "leatherblack", w * .3, yy + .04, 0); b.box(.06, .015, d * .9, "leatherblack", -w * .3, yy + .04, 0); }
  });

  G("stool", (b, p) => {
    const { w, h } = p, n = p.legs || 3, rr = w / 2;
    if (p.style === "bar") { b.cyl(.025, .025, h - .05, "legs", 0, .02, 0, 10); b.cyl(rr * .8, rr * .85, .02, "legs", 0, 0, 0, 20); b.tor(rr * .7, .012, "legs", 0, h * .35, 0); b.rbox(w, .06, w, .025, "seat", 0, h - .06, 0); return; }
    if (p.style === "log") { b.cyl(rr, rr * 1.05, h, "bark"); b.cyl(rr * .96, rr * .96, .005, "seat", 0, h, 0); return; }
    if (p.style === "crate") { b.box(w, h, w, "seat"); return; }
    b.cyl(rr, rr, .04, "seat", 0, h - .04, 0, 24);
    for (let i = 0; i < n; i++) { const a = i * TAU / n + .4, c = Math.cos(a), s = Math.sin(a); strut(b, [c * rr * .55, h - .04, s * rr * .55], [c * rr * .85, 0, s * rr * .85], .018, "legs"); }
    if (h > .55) b.tor(rr * .62, .01, "legs", 0, h * .32, 0);
  });

  G("bench", (b, p) => {
    const { w, d, h } = p, st = p.style || "plain", sh = p.sh || .45;
    if (st === "park") {
      for (const sx of [-1, 1]) { const x = sx * (w / 2 - .12); b.ext([[-d / 2, 0], [-d / 2 + .06, 0], [-d / 2 + .1, sh - .05], [d / 2 - .04, sh - .05], [d / 2 - .04, 0], [d / 2, 0], [d / 2, sh], [-d / 2 + .02, sh], [-d / 2 - .02, h], [-d / 2 - .06, h]], .05, "frame", x, 0, 0, -H); }
      for (let i = 0; i < 4; i++) b.box(w, .03, .08, "seat", 0, sh, -d / 2 + .1 + i * (d - .16) / 3.3);
      for (let i = 0; i < 3; i++) b.box(w, .08, .025, "seat", 0, sh + .1 + i * .12, -d / 2 + .02 - i * .02, -.15);
      return;
    }
    if (st === "pew") {
      for (const sx of [-1, 1]) b.ext([[-d / 2, 0], [d / 2, 0], [d / 2, sh + .2], [d / 2 - .1, sh + .3], [-d / 2 + .05, sh + .3], [-d / 2 + .05, h], [-d / 2, h]], .05, "frame", sx * (w / 2 - .025), 0, 0, -H);
      b.box(w - .05, .04, d - .1, "frame", 0, sh - .04, .03); b.box(w - .05, h - sh, .03, "frame", 0, sh, -d / 2 + .04); b.box(w - .05, .04, .12, "frame", 0, h - .04, -d / 2 + .06);
      if (p.m && p.m.seat) b.rbox(w - .1, .04, d - .14, .015, "seat", 0, sh, .04);
      return;
    }
    if (st === "log") { b.part(() => { b.cyl(d / 2, d / 2, w, "bark", 0, 0, 0, 14, 0, H); }, 0, sh - d / 2, 0); b.box(w * .98, .01, d * .9, "frame", 0, sh, 0); for (const sx of [-1, 1]) b.cyl(.12, .13, sh - d / 2 + .05, "bark", sx * w * .35, 0, 0, 12); return; }
    if (st === "metal") { b.box(w, .03, d, "frame", 0, sh - .03, 0); for (const sx of [-1, 1]) { b.box(.04, sh - .03, .04, "frame", sx * (w / 2 - .05), 0, d / 2 - .05); b.box(.04, sh - .03, .04, "frame", sx * (w / 2 - .05), 0, -d / 2 + .05); } b.box(w - .1, .02, .02, "frame", 0, .1, 0); return; }
    if (st === "seats") { const n = Math.max(2, Math.round(w / .5)); b.box(w, .05, .06, "frame", 0, sh - .14, 0); for (const sx of [-1, 1]) b.box(.05, sh - .14, d * .6, "frame", sx * (w / 2 - .1), 0, 0); for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * w / n; b.rbox(w / n - .04, .05, d * .9, .02, "seat", x, sh - .06, .02); b.rbox(w / n - .04, h - sh, .04, .02, "seat", x, sh - .04, -d / 2 + .03); } return; }
    b.box(w, .05, d, "frame", 0, sh - .05, 0);
    for (const sx of [-1, 1]) { b.box(.06, sh - .05, d * .8, "frame", sx * (w / 2 - .1), 0, 0); }
    b.box(w - .2, .05, .04, "frame", 0, .12, 0);
    if (h > sh + .1) { for (const sx of [-1, 1]) b.box(.05, h - sh + .05, .04, "frame", sx * (w / 2 - .1), sh - .05, -d / 2 + .02); b.box(w, .12, .03, "frame", 0, h - .14, -d / 2 + .02); }
  });

  G("sofa", (b, p) => {
    const { w, d, h } = p, n = p.seats || Math.max(1, Math.round((w - .3) / .62)), st = p.style || "plain", arm = p.arms === false ? 0 : (p.armw || (st === "chesterfield" ? .2 : .16)), sh = p.sh || .44;
    const iw = w - arm * 2, by = .08, bh = sh - by - .13;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) st === "modern" ? b.box(.03, by, .03, "legs", sx * (w / 2 - .06), 0, sz * (d / 2 - .06)) : b.cyl(.025, .02, by, "legs", sx * (w / 2 - .07), 0, sz * (d / 2 - .07), 8);
    b.rbox(w, bh, d, .03, "frame", 0, by, 0);
    if (st === "chesterfield") b.rbox(iw, .16, d - .22, .06, "frame", 0, by + bh, .1);
    else for (let i = 0; i < n; i++) b.rbox(iw / n - .012, .15, d - .22, .06, "cushion", -iw / 2 + (i + .5) * iw / n, by + bh, .1);
    b.rbox(w - (st === "chesterfield" ? 0 : arm * 1.2), h - by, .22, .06, "frame", 0, by, -d / 2 + .11);
    if (st !== "chesterfield" && st !== "futon") for (let i = 0; i < n; i++) b.rbox(iw / n - .02, h - sh - .06, .14, .06, "cushion", -iw / 2 + (i + .5) * iw / n, sh, -d / 2 + .27);
    if (arm) for (const sx of [-1, 1]) {
      const ah = st === "chesterfield" ? h - by : sh + .2 - by;
      b.rbox(arm, ah, d, .05, "frame", sx * (w / 2 - arm / 2), by, 0);
      if (st === "chesterfield" || st === "rolled") b.part(() => b.cyl(arm * .62, arm * .62, d, "frame", 0, 0, 0, 16, H), sx * (w / 2 - arm / 2), by + ah - .02, 0);
    }
    if (st === "chesterfield") for (let i = 0; i < Math.round(iw / .14); i++) for (let j = 0; j < 2; j++) b.sph(.012, "frame", -iw / 2 + .07 + i * .14 + (j % 2) * .07, sh + .12 + j * .14, -d / 2 + .225, 1, 6);
    if (st === "chaise") b.rbox(iw / n, .15, .7, .06, "cushion", -iw / 2 + iw / n / 2, by + bh, d / 2 + .3), b.rbox(iw / n + arm, bh, .7, .03, "frame", -iw / 2 + iw / n / 2 - arm / 2, by, d / 2 + .3);
    if (p.pillows) for (const sx of [-1, 1]) b.rbox(.38, .36, .12, .06, "pillow", sx * (iw / 2 - .25), sh + .02, -d / 2 + .38, sx * .3);
    if (b.broken) { b.box(.2, .02, .15, "coal", iw * .2, sh + .015, .05); }
  });

  G("bed", (b, p) => {
    const { w, d, h } = p, st = p.style || "plain", mh = p.mh || .5, metal = st === "hospital" || st === "metal" || st === "bunk-metal" || st === "prison";
    const mattress = (y, ww, dd, z = 0) => { b.rbox(ww, .18, dd, .05, "mattress" in (p.m || {}) ? "mattress" : "sheet", 0, y, z); if (p.blanket !== false) { b.rbox(ww + .03, .025, dd * .62, .012, "blanket", 0, y + .17, z + dd * .19); b.rbox(ww + .03, .04, .12, .015, "sheet", 0, y + .17, z - dd * .12 + .02); } const np = ww > 1.15 ? 2 : 1; for (let i = 0; i < np; i++) b.rbox(np === 2 ? ww * .42 : ww * .7, .1, .3, .05, "sheet", np === 2 ? (i ? 1 : -1) * ww * .23 : 0, y + .17, z - dd / 2 + .22); };
    if (st === "cot") { for (const sz of [-1, 1]) plank(b, [-w / 2 + .04, 0, sz * (d / 2 - .1)], [w / 2 - .04, mh - .05, sz * (d / 2 - .1)], .03, .03, "frame"), plank(b, [w / 2 - .04, 0, sz * (d / 2 - .1)], [-w / 2 + .04, mh - .05, sz * (d / 2 - .1)], .03, .03, "frame"); for (const sx of [-1, 1]) b.rod(.018, d, "frame", sx * (w / 2 - .03), mh - .04, 0, "z"); b.box(w - .04, .015, d - .04, "sheet", 0, mh - .055, 0); b.rbox(w * .6, .08, .45, .03, "blanket", 0, mh - .04, d / 2 - .35); return; }
    if (st === "straw" || st === "mattress") { b.rbox(w, st === "straw" ? .14 : .2, d, .05, st === "straw" ? "hay" : "sheet", 0, 0, 0); if (st === "straw") b.rbox(w * .9, .03, d * .55, .015, "blanket", 0, .13, d * .15, .08); else { b.rbox(w * .5, .1, .3, .05, "sheet", 0, .19, -d / 2 + .22); if (b.cond !== "new") b.box(w * .3, .003, d * .2, "dirt", w * .1, .2, .1); } return; }
    if (st === "pod") {
      b.rbox(w, mh, d, .08, "frame", 0, 0, 0); mattress(mh - .02, w - .12, d - .12);
      b.rbox(w, .08, d, .04, "frame", 0, h - .08, 0); b.rbox(w, h, .08, .03, "frame", 0, 0, -d / 2 + .04); b.rbox(.08, h, d, .03, "frame", -w / 2 + .04, 0, 0);
      b.box(.02, .02, d - .2, "glowcyan", -w / 2 + .09, h - .12, 0); b.box(.3, .18, .01, "screen", -w / 2 + .1, mh + .4, -d / 2 + .3, 0, H, 0); return;
    }
    // the frame
    const hb = p.hb || (st === "fourposter" ? .7 : st === "hospital" ? .45 : .5), post = st === "fourposter" ? (p.ph || 2.1) : 0;
    if (metal) {
      for (const sx of [-1, 1]) { b.cyl(.02, .02, mh + hb, "frame", sx * (w / 2 - .02), 0, -d / 2 + .02, 8); b.cyl(.02, .02, mh + hb * .7, "frame", sx * (w / 2 - .02), 0, d / 2 - .02, 8); b.rod(.018, d, "frame", sx * (w / 2 - .02), mh - .1, 0, "z"); }
      for (const [z, hh] of [[-d / 2 + .02, hb], [d / 2 - .02, hb * .7]]) { b.rod(.018, w, "frame", 0, mh + hh - .02, z, "x"); for (let i = 1; i < 6; i++) b.cyl(.008, .008, hh - .02, "frame", -w / 2 + i * w / 6, mh, z, 6); }
      if (st === "hospital") { for (const sx of [-1, 1]) { b.rod(.012, d * .5, "frame", sx * (w / 2 + .02), mh + .3, -d * .12, "z"); b.rod(.012, d * .5, "frame", sx * (w / 2 + .02), mh + .15, -d * .12, "z"); } for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.sph(.04, "rubber", sx * (w / 2 - .04), .04, sz * (d / 2 - .06), 1, 10); b.part(() => b.rbox(w - .1, .18, d * .35, .05, "sheet"), 0, mh - .02, -d / 2 + d * .2, -.5, 0, 0); b.rbox(w - .1, .18, d * .6, .05, "sheet", 0, mh - .1, d * .18); b.rbox(w - .1, .025, d * .45, .012, "blanket", 0, mh + .08, d * .22); return; }
      if (st === "prison") { b.box(w, .04, d, "frame", 0, mh - .1, 0); b.box(.04, mh - .1, d, "frame", -w / 2 + .02, 0, 0); b.rbox(w - .04, .08, d - .04, .03, "sheet", 0, mh - .06, 0); b.rbox(w * .6, .06, .3, .03, "blanket", 0, mh + .02, d / 2 - .3); return; }
    } else {
      for (const sx of [-1, 1]) {
        b.box(.06, mh + hb, .07, "frame", sx * (w / 2 - .03), 0, -d / 2 + .035);
        b.box(.06, (post || mh + .2), .07, "frame", sx * (w / 2 - .03), 0, d / 2 - .035);
        if (post) b.box(.06, post, .07, "frame", sx * (w / 2 - .03), 0, -d / 2 + .035);
        b.box(.04, .2, d - .14, "frame", sx * (w / 2 - .03), mh - .32, 0);
      }
      b.box(w - .12, hb + .05, .04, "frame", 0, mh - .05, -d / 2 + .035);
      if (p.carved) b.ext([[-w / 2 + .06, 0], [w / 2 - .06, 0], [w / 2 - .06, .05], [w * .2, .12], [0, .2], [-w * .2, .12], [-w / 2 + .06, .05]], .04, "frame", 0, mh + hb, -d / 2 + .035);
      b.box(w - .12, .3, .04, "frame", 0, mh - .2, d / 2 - .035);
      b.box(w - .12, .03, d - .14, "frame", 0, mh - .2, 0);
      if (post) { for (const sx of [-1, 1]) b.box(.05, .08, d, "frame", sx * (w / 2 - .03), post - .08, 0); for (const sz of [-1, 1]) b.box(w, .08, .05, "frame", 0, post - .08, sz * (d / 2 - .035)); if (p.canopy !== false) { b.box(w, .02, d, "canopy", 0, post, 0); for (const sx of [-1, 1]) b.box(.02, post * .55, .5, "canopy", sx * (w / 2 + .02), post * .45, -d / 2 + .25); } }
    }
    mattress(mh - .18, w - .1, d - .12);
    if (st === "bunk" || st === "bunk-metal") { const y2 = mh + 1.05; for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.05, y2 + .35, .05, "frame", sx * (w / 2 - .025), 0, sz * (d / 2 - .025)); b.box(w - .06, .04, d - .06, "frame", 0, y2 - .2, 0); mattress(y2 - .17, w - .1, d - .12); for (let i = 0; i < 5; i++) b.box(.3, .03, .04, "frame", w / 2 + .02, .3 + i * (y2 / 5), d / 2 - .3, 0, H, 0); b.box(.03, y2 + .1, .04, "frame", w / 2 + .02, 0, d / 2 - .15); b.box(.03, y2 + .1, .04, "frame", w / 2 + .02, 0, d / 2 - .45); }
  });

  G("cabinet", (b, p) => {
    const { w, d, h } = p, st = p.style || "cupboard", base = p.legs ? .12 : (p.base == null ? .07 : p.base), crown = p.crown ? .05 : 0, fz = d / 2;
    const bodyH = h - base - crown;
    b.box(w, bodyH, d, "body", 0, base, 0);
    if (crown) b.box(w + .05, crown, d + .03, "body", 0, h - crown, .0);
    if (p.legs) for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.turned ? b.lathe([[.025, 0], [.035, .03], [.02, .08], [.03, base], [0, base]], "body", sx * (w / 2 - .04), 0, sz * (d / 2 - .04), 8) : b.box(.04, base, .04, "body", sx * (w / 2 - .04), 0, sz * (d / 2 - .04));
    else if (base) b.box(w - .04, base, d - .04, p.m && p.m.base ? "base" : "body", 0, 0, -.01);
    const hm = p.m && p.m.handle ? "handle" : "brass";
    if (st === "locker") {
      const n = p.n || Math.max(1, Math.round(w / .32)), cw = w / n;
      for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * cw, open = b.broken && i === 1; const door = () => { b.box(cw - .015, bodyH - .02, .015, "body", 0, 0, 0); for (let v = 0; v < 4; v++) b.box(cw * .5, .008, .004, "coal", 0, bodyH - .12 - v * .025, .009); b.box(.02, .1, .02, "steel", cw * .3, bodyH * .5, .015); b.box(.08, .05, .002, "paper", 0, bodyH - .25, .009); }; open ? b.part(door, x - cw / 2, base + .01, fz + .01, 0, -1.4, 0).children.forEach(c => c.position.x += cw / 2) : b.part(door, x, base + .01, fz + .008); }
      return;
    }
    if (st === "safe") { b.box(w - .08, bodyH - .08, .03, "body", 0, base + .04, fz + .01); b.part(() => { b.cyl(.06, .06, .03, "steel", 0, 0, 0, 24, H); }, w * .1, base + bodyH * .55, fz + .04); b.part(() => { for (let i = 0; i < 3; i++) b.box(.012, .16, .012, "steel", 0, 0, 0, 0, 0, i * PI / 3); }, -w * .2, base + bodyH * .5, fz + .04); return; }
    if (st === "display") {
      b.box(w - .06, bodyH - .06, .006, "glass", 0, base + .03, fz + .004);
      for (const sx of [-1, 1]) b.box(.02, .02, .02, hm, sx * .03, base + bodyH * .5, fz + .01);
      const n = p.shelves || 3; for (let i = 1; i <= n; i++) { const y = base + .03 + (bodyH - .06) * i / (n + 1); b.box(w - .08, .012, d - .06, "glass", 0, y, 0); for (let k = 0; k < 4; k++) { const x = -w / 2 + .12 + k * (w - .24) / 3; p.fill === "plates" ? b.cyl(.09, .09, .012, "porcelain", x, y + .1, -d / 2 + .1, 20, H) : p.fill === "trophies" ? b.lathe([[.04, 0], [.012, .04], [.012, .1], [.05, .14], [.05, .2], [0, .14]], "gold", x, y + .012, 0, 14) : P.bottle(b, x, y + .012, 0, pick(b, ["glassamber", "glassgreen", "glassblue", "porcelain"]), .7); } }
      return;
    }
    // drawers and doors on the front: rows of drawers at the top (or all of it), doors under them
    const rows = p.rows != null ? p.rows : st === "dresser" ? 4 : st === "filing" ? 4 : st === "nightstand" ? 1 : st === "sideboard" ? 1 : st === "wardrobe" ? 1 : 0;
    const cols = p.cols || (st === "dresser" && w > 1 ? 2 : st === "sideboard" ? 3 : 1);
    const doors = p.doors != null ? p.doors : st === "wardrobe" ? 2 : st === "cupboard" ? 2 : st === "sideboard" ? 3 : st === "nightstand" ? 0 : 0;
    const dh = doors || st === "nightstand" ? Math.min(.2, bodyH / 5) : (bodyH - .02) / Math.max(1, rows);
    const drawY0 = doors || st === "nightstand" ? (st === "wardrobe" ? base + .02 : base + bodyH - .02 - rows * dh) : base + .01;
    if (st === "nightstand" && !doors) b.box(w - .06, bodyH - dh - .06, .01, "coal", 0, base + .03, d / 2 - .02);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cw = (w - .04) / cols, x = -w / 2 + .02 + (c + .5) * cw, y = drawY0 + r * dh;
      b.box(cw - .02, dh - .02, .02, "body", x, y + .01, fz);
      if (st === "filing") { b.box(.12, .03, .012, "steel", x, y + dh * .55, fz + .015); b.box(.08, .03, .002, "paper", x, y + dh * .75, fz + .012); }
      else if (p.pulls) b.box(.12, .014, .02, hm, x, y + dh / 2, fz + .015); else { b.sph(.016, hm, x - Math.min(.15, cw * .25), y + dh / 2, fz + .018, 1, 8); b.sph(.016, hm, x + Math.min(.15, cw * .25), y + dh / 2, fz + .018, 1, 8); }
    }
    if (doors) {
      const y0 = st === "wardrobe" ? base + .02 + rows * dh : base + .02, dhh = st === "wardrobe" ? bodyH - .04 - rows * dh : bodyH - .04 - rows * dh, dw = (w - .04) / doors;
      for (let i = 0; i < doors; i++) {
        const x = -w / 2 + .02 + (i + .5) * dw, open = p.open && i === doors - 1;
        const leaf = () => { b.box(dw - .015, dhh, .02, "body", 0, 0, 0); if (p.glass) b.box(dw - .1, dhh - .12, .006, "glass", 0, .06, .012); else b.box(dw - .1, dhh - .12, .012, "body", 0, .06, .012); b.box(.016, .12, .02, hm, (i % 2 ? -1 : 1) * (dw / 2 - .05), dhh / 2 - .06, .025); };
        if (open) { const g = b.part(leaf, x + dw / 2, y0, fz + .01, 0, 1.2, 0); g.children.forEach(c => c.position.x -= dw / 2); for (let s = 1; s < 3; s++) b.box(dw - .04, .015, d - .06, "body", x, y0 + s * dhh / 3, 0); }
        else b.part(leaf, x, y0, fz + .01);
      }
    }
    if (st === "nightstand" && !doors) b.box(w - .06, .015, d - .06, "body", 0, base + bodyH * .35, .02);
    if (p.top) b.box(w + .04, .03, d + .03, "top", 0, h, 0);
    if (p.items) dress(b, p.items, w, d, h + (p.top ? .03 : 0));
    if (p.mirror) { b.box(w * .8, .7, .03, "body", 0, h, -d / 2 + .05); b.box(w * .7, .6, .005, "chrome", 0, h + .05, -d / 2 + .068); }
  }, [["items", "On it", 0, KN.length - 1, 1, KN]]);

  G("shelf", (b, p) => {
    const { w, d, h } = p, n = p.n || Math.max(2, Math.round(h / .38)), st = p.style || "wood", fill = p.fill || "books", th = .025;
    let levels = [];
    if (st === "rack") {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.035, h, .035, "frame", sx * (w / 2 - .018), 0, sz * (d / 2 - .018));
      for (let i = 0; i < n; i++) { const y = .08 + i * (h - .12) / (n - 1 || 1); b.box(w - .01, .02, d - .01, "frame", 0, y, 0); levels.push(y + .02); }
      plank(b, [-w / 2 + .02, .1, -d / 2 + .02], [w / 2 - .02, h - .1, -d / 2 + .02], .02, .006, "frame");
    } else if (st === "wall") {
      for (let i = 0; i < n; i++) { const y = i * .35; b.box(w, th, d, "frame", 0, y, 0); for (const sx of [-1, 1]) b.ext([[0, 0], [d * .8, 0], [0, -.15]], .02, "bracket" in (p.m || {}) ? "bracket" : "iron", sx * (w / 2 - .12), y, -d / 2, -H); levels.push(y + th); }
    } else if (st === "cubby") {
      b.box(w, h, .02, "frame", 0, 0, -d / 2 + .01); for (const sx of [-1, 1]) b.box(th, h, d, "frame", sx * (w / 2 - th / 2)); b.box(w, th, d, "frame", 0, h - th); b.box(w, th, d, "frame");
      const cols = Math.max(2, Math.round(w / .3)); for (let i = 1; i < cols; i++) b.box(.015, h, d, "frame", -w / 2 + i * w / cols);
      for (let i = 1; i < n; i++) b.box(w, .015, d, "frame", 0, i * h / n);
      for (let r = 0; r < n; r++) for (let c = 0; c < cols; c++) { const x = -w / 2 + (c + .5) * w / cols, y = r * h / n + .02; if (fill === "scrolls") for (let k = 0; k < 4; k++) b.rod(.025, d * .85, pick(b, ["parchment", "paper", "parchment"]), x + (k % 2 - .5) * .06, y + .025 + (k > 1 ? .045 : 0), 0, "z"); else if (fill === "bottles") for (let k = 0; k < 3; k++) b.rod(.035, d * .8, pick(b, ["glassgreen", "glassamber", "glasspurple"]), x + (k - 1) * .075, y + .035, 0, "z"); }
      return;
    } else {
      for (const sx of [-1, 1]) b.box(th, h, d, "frame", sx * (w / 2 - th / 2));
      b.box(w, th * 1.4, d + .02, "frame", 0, h - th * 1.4, .01); b.box(w - th * 2, .08, d, "frame");
      if (!p.open) b.box(w - th * 2, h - .08, .012, "frame", 0, .08, -d / 2 + .006);
      for (let i = 1; i < n; i++) { const y = .08 + i * (h - .08 - th) / n; b.box(w - th * 2, th, d - .015, "frame", 0, y - th, .005); }
      for (let i = 0; i < n; i++) levels.push(.08 + i * (h - .08 - th) / n);
    }
    const gap = (levels[1] || h) - (levels[0] || 0) - .03, inner = w - (st === "wall" ? 0 : th * 2) - .02;
    levels.forEach((y, i) => {
      if (b.cond === "ruined" && b.r() < .4) return;
      const f = fill === "mixed" ? pick(b, ["books", "jars", "boxes", "books", "bottles"]) : fill;
      if (f === "books") bookRow(b, -inner / 2, inner / 2, y, 0, d * .85, Math.min(.3, gap), true);
      else if (f === "jars") for (let x = -inner / 2 + .07; x < inner / 2 - .05; x += .11 + b.r() * .04) b.lathe([[.045, 0], [.05, .02], [.05, .11], [.035, .13], [.04, .15], [0, .15]], pick(b, ["glass", "glassgreen", "glassamber", "terracotta", "porcelain"]), x, y, (b.r() - .5) * d * .3, 12);
      else if (f === "bottles") for (let x = -inner / 2 + .05; x < inner / 2 - .04; x += .08 + b.r() * .03) P.bottle(b, x, y, (b.r() - .5) * d * .3, pick(b, ["glassgreen", "glassamber", "glassblue", "glasspurple"]), Math.min(1, gap / .3));
      else if (f === "potions") for (let x = -inner / 2 + .06; x < inner / 2 - .05; x += .1 + b.r() * .03) P.flask(b, x, y, 0, pick(b, ["glowgreen", "glowviolet", "glowred", "glowamber", "glowcyan"]), Math.min(1, gap / .2) * (.6 + b.r() * .4));
      else if (f === "boxes") { let x = -inner / 2; while (x < inner / 2 - .12) { const bw = .14 + b.r() * .2; if (x + bw > inner / 2) break; b.box(bw - .01, Math.min(gap, .1 + b.r() * .15), d * .8, pick(b, ["cardboard", "cardboard", "pine"]), x + bw / 2, y, 0); x += bw; } }
      else if (f === "cans") for (let x = -inner / 2 + .04; x < inner / 2 - .04; x += .085) b.cyl(.037, .037, .11, pick(b, ["steel", "pred", "pblue", "steel"]), x, y, 0, 12);
      else if (f === "files") bookRow(b, -inner / 2, inner / 2, y, 0, d * .85, Math.min(.31, gap), false);
      else if (f === "goods") { let x = -inner / 2; while (x < inner / 2 - .1) { const k = (b.r() * 3) | 0; if (k === 0) b.box(.15, Math.min(gap, .12), d * .7, pick(b, ["cardboard", "porange", "pred"]), x + .08, y, 0); else if (k === 1) b.cyl(.045, .045, .12, pick(b, ["pyellow", "pgreen", "steel"]), x + .06, y, 0, 12); else P.bottle(b, x + .05, y, 0, pick(b, ["glassgreen", "pblue"]), .8); x += .17; } }
      else if (f === "skulls") for (let x = -inner / 2 + .1; x < inner / 2 - .08; x += .2) P.skull(b, x, y, 0, (b.r() - .5) * .6);
      else if (f === "tools") { b.box(.3, .1, .2, "pred", -inner / 4, y, 0); b.cyl(.06, .06, .1, "rope" in M.MATS ? "rope" : "burlap", inner / 4, y, 0, 14); }
    });
  });

  G("counter", (b, p) => {
    const { w, d, h } = p, st = p.style || "kitchen", t = .04, fz = d / 2;
    if (st === "bar") {
      b.box(w, h - t, .06, "body", 0, 0, fz - .1); b.box(w, t, d, "top", 0, h - t, 0);
      for (let i = 0; i < Math.round(w / .5); i++) b.box(.4, h - .3, .015, "body", -w / 2 + .25 + i * .5, .12, fz - .065);
      b.rod(.02, w, "brass", 0, .18, fz + .02, "x"); for (let i = 0; i <= Math.round(w / 1.2); i++) b.box(.02, .12, .1, "brass", -w / 2 + .1 + i * (w - .2) / Math.max(1, Math.round(w / 1.2)), .08, fz - .03);
      b.box(w - .1, .03, d * .5, "body", 0, h * .5, -d * .15);
      if (p.taps) for (let i = 0; i < p.taps; i++) { const x = -w * .3 + i * .14; b.cyl(.015, .015, .25, "brass", x, h, -d * .2, 8); b.box(.04, .12, .04, pick(b, ["oak", "pblack", "porcelain"]), x, h + .25, -d * .2 + .02); }
      if (p.items) dress(b, p.items, w, d * .6, h);
      return;
    }
    if (st === "shop" || st === "glass") {
      b.box(w, .3, d, "body"); b.box(w, h - .3 - t, .04, "body", 0, .3, -fz + .02);
      for (const sx of [-1, 1]) b.box(.04, h - .3 - t, d, "body", sx * (w / 2 - .02), .3, 0);
      b.box(w - .08, h - .34 - t, .008, "glass", 0, .3, fz - .01); b.box(w, t, d, "glass", 0, h - t, 0);
      for (let i = 0; i < Math.round(w / .2); i++) { const x = -w / 2 + .12 + i * .2; p.fill === "jewels" ? P.gem(b, x, .32 + (h - .34) * .4, 0, pick(b, ["ruby", "emerald", "sapphire", "amethyst", "gold"])) : b.box(.12, .08, .12, pick(b, ["pred", "pblue", "cardboard", "pyellow", "leather"]), x, .3 + (h - .34) * .2, (b.r() - .5) * d * .3); }
      return;
    }
    if (st === "reception") {
      b.box(w, h, .06, "body", 0, 0, fz - .03); b.box(w + .04, .04, .3, "top", 0, h, fz - .12);
      b.box(w - .1, .03, d - .1, "top", 0, .74, -.02); for (const sx of [-1, 1]) b.box(.04, .74, d - .1, "body", sx * (w / 2 - .03), 0, -.02);
      P.monitor(b, -w * .2, .77, -d * .15); P.keyboard(b, -w * .2, .77, d * .05); P.phone(b, w * .25, .77, 0);
      if (p.sign) b.sign(p.sign, w * .5, .12, "#1f2a38", "#e8e3d6", 0, h * .55, fz + .002);
      return;
    }
    // kitchen cabinets with a worktop; with a sink or a hob, doors below and a row of drawers
    b.box(w - .02, .08, d - .07, "base" in (p.m || {}) ? "base" : "body", 0, 0, -.04); b.box(w, h - t - .08, d - .04, "body", 0, .08, -.02);
    b.box(w + .02, t, d + .02, "top", 0, h - t, 0);
    const n = Math.max(1, Math.round(w / .5)), cw = w / n;
    for (let i = 0; i < n; i++) { const x = -w / 2 + (i + .5) * cw; b.box(cw - .015, .15, .02, "body", x, h - t - .17, fz - .02); b.box(.12, .012, .02, "handle" in (p.m || {}) ? "handle" : "steel", x, h - t - .1, fz); b.box(cw - .015, h - t - .3, .02, "body", x, .09, fz - .02); b.box(.012, .12, .02, "handle" in (p.m || {}) ? "handle" : "steel", x + cw / 2 - .06, h - t - .3, fz); }
    if (p.sink) { b.box(.5, .005, d * .55, "steel", -w * .2, h + .001, -.02); b.box(.44, .004, d * .45, "coal", -w * .2, h + .004, -.02); b.tube([[-w * .2, h, -d / 2 + .06], [-w * .2, h + .25, -d / 2 + .06], [-w * .2, h + .25, -d / 2 + .2]], .012, "chrome"); }
    if (p.hob) for (let i = 0; i < 4; i++) b.cyl(.08, .08, .012, "iron", w * .2 + (i % 2 - .5) * .26, h, (((i / 2) | 0) - .5) * .24, 18);
    if (p.items) dress(b, p.items, w, d, h);
    if (st === "island") { b.box(w + .02, t, d + .3, "top", 0, h - t, .15); }
  }, [["items", "On it", 0, KN.length - 1, 1, KN]]);

  G("fireplace", (b, p) => {
    const { w, d, h } = p, st = p.style || "stone", ow = p.ow || w * .55, oh = p.oh || Math.min(h * .6, .95), lit = p.lit !== false && b.cond !== "ruined" && b.cond !== "burned";
    b.box(w + .3, .05, d + .35, "hearth" in (p.m || {}) ? "hearth" : "body", 0, 0, .17);
    for (const sx of [-1, 1]) b.box((w - ow) / 2, oh, d, "body", sx * (ow / 2 + (w - ow) / 4), .05, 0);
    b.box(w, .25, d, "body", 0, oh + .05, 0);
    b.box(ow, oh, .06, "coal", 0, .05, -d / 2 + .03);
    if (st === "hearth") { b.rod(.018, ow * .8, "iron", 0, oh * .85, -d * .1, "x"); b.tube([[0, oh * .85, -d * .1], [0, oh * .5, -d * .1]], .006, "iron"); b.part(() => { b.lathe([[0, 0], [.16, .02], [.2, .12], [.18, .26], [.15, .28], [0, .28]], "iron"); }, 0, oh * .5 - .28, -d * .1); }
    else b.box(w + .16, .06, d * .5 + .12, "mantel" in (p.m || {}) ? "mantel" : "body", 0, oh + .3, -d * .25 + .06 + d / 4);
    if (h > oh + .5) b.box(w * .82, h - oh - .36, d * .75, "body", 0, oh + .36, -d * .125);
    if (st === "grand") { for (const sx of [-1, 1]) b.cyl(.07, .08, oh + .25, "body", sx * (w / 2 + .02), .05, d / 2 - .04, 14); b.box(w + .3, .1, d * .6, "body", 0, oh + .36, -d * .2 + .1); }
    // logs on irons, and the fire
    for (const sx of [-1, 1]) b.box(.03, .14, .3, "iron", sx * ow * .3, .05, -d * .05);
    if (b.cond !== "ruined") for (let i = 0; i < 3; i++) b.part(() => b.cyl(.06, .055, ow * .6, "bark", 0, 0, 0, 10, 0, H), (b.r() - .5) * .05, .18 + (i === 2 ? .09 : 0), -d * .12 + (i === 1 ? .1 : i === 2 ? .05 : 0), 0, (b.r() - .5) * .3, 0);
    if (lit) { for (let i = 0; i < 5; i++) b.cone(.06 + b.r() * .05, .2 + b.r() * .2, i % 2 ? "fire" : "ember", (b.r() - .5) * ow * .5, .2, -d * .05 + (b.r() - .5) * .1, 8); }
    else b.box(ow * .7, .03, d * .5, "coal", 0, .05, 0);
    if (p.items === "candles") for (let i = 0; i < 3; i++) P.candle(b, -w * .35 + i * w * .35, oh + .36, -d * .25 + .06 + d / 4, 1.2);
    if (p.items === "clock") b.box(.25, .3, .12, "walnut", 0, oh + .36, 0);
    if (p.items === "skull") P.skull(b, w * .3, oh + .36, 0, .2, 1.2);
  });

  G("stove", (b, p) => {
    const { w, d, h } = p, st = p.style || "iron";
    if (st === "iron") {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.04, .15, .04, "body", sx * w * .3, 0, sz * d * .3);
      b.lathe([[w * .32, 0], [w * .48, .12], [w * .5, .4], [w * .42, .6], [w * .3, .7], [w * .3, .75], [0, .75]], "body", 0, .15, 0, 20);
      b.box(.18, .14, .02, "body", 0, .3, w * .48); b.box(.14, .08, .005, "ember", 0, .33, w * .49);
      b.cyl(.065, .065, (p.ph || h) - .9, "body", 0, .9, 0, 14);
      return;
    }
    if (st === "range") {
      b.box(w, h * .85, d, "body"); b.box(w + .04, .04, d + .04, "steel", 0, h * .85, 0);
      for (let i = 0; i < 2; i++) { b.box(w * .4, h * .45, .02, "body", (i - .5) * w * .48, .15, d / 2 + .01); b.box(.1, .015, .02, "brass", (i - .5) * w * .48, .6, d / 2 + .03); }
      b.rod(.012, w, "brass", 0, h * .8, d / 2 + .06);
      for (let i = 0; i < 3; i++) b.cyl(.1, .1, .01, "iron", (i - 1) * w * .3, h * .85 + .04, 0, 18);
      b.box(w, .5, .2, "body", 0, h * .85 + .04, -d / 2 + .1); b.cyl(.07, .07, Math.max(.5, (p.ph || 2.4) - h), "body", 0, h * .85 + .54, -d / 2 + .1, 14);
      return;
    }
    if (st === "synth") {
      b.rbox(w, h, d, .05, "body"); b.box(w * .6, h * .3, .02, "coal", 0, h * .4, d / 2 - .005); b.box(w * .58, .015, .015, "glowcyan", 0, h * .7 + .02, d / 2); b.box(w * .5, .18, .006, "screen", 0, h * .75, d / 2 - .002); return;
    }
    // a modern cooker
    b.box(w, h, d, "body"); b.box(w - .06, h * .55, .02, "body", 0, .1, d / 2 + .01); b.box(w * .6, h * .3, .006, "screenoff", 0, .22, d / 2 + .022); b.box(w * .7, .02, .03, "steel", 0, h * .63, d / 2 + .04);
    for (let i = 0; i < 4; i++) { b.cyl(.075, .075, .008, "pblack", (i % 2 - .5) * w * .5, h, (((i / 2) | 0) - .5) * d * .5, 18); b.cyl(.016, .016, .025, "pblack", -w / 2 + .08 + i * (w - .16) / 3, h * .82, d / 2 + .01, 10, H); }
    b.box(w, .1, .05, "body", 0, h, -d / 2 + .025);
  });

  G("sink", (b, p) => {
    const { w, d, h } = p, st = p.style || "pedestal";
    if (st === "pedestal") { b.lathe([[.14, 0], [.1, .05], [.08, h * .6], [.1, h - .12], [0, h - .12]], "body", 0, 0, -d * .1, 18); b.rbox(w, .14, d, .05, "body", 0, h - .14, 0); b.box(w * .7, .02, d * .6, "coal", 0, h - .02, .02); b.tube([[0, h, -d / 2 + .05], [0, h + .14, -d / 2 + .05], [0, h + .14, -d / 2 + .15]], .012, "chrome"); return; }
    if (st === "washstand") { b.box(w, h - .04, d, "body"); b.box(w + .02, .03, d + .02, "top", 0, h - .03, 0); b.lathe([[0, 0], [.08, .01], [.18, .08], [.2, .1], [0, .02]], "porcelain", 0, h, 0, 22); b.lathe([[.06, 0], [.08, .1], [.06, .2], [.05, .24], [.07, .27], [0, .27]], "porcelain", w * .32, h, -d * .2, 16); return; }
    if (st === "trough") { b.box(w, h - .3, d, "body", 0, .3, 0); b.box(w - .1, .02, d - .1, "water", 0, h - .1, 0); for (const sx of [-1, 1]) b.box(.12, .3, d * .8, "body", sx * (w / 2 - .15)); return; }
    // utility: steel, on legs
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.018, .018, h - .25, "legs" in (p.m || {}) ? "legs" : "steel", sx * (w / 2 - .04), 0, sz * (d / 2 - .04), 8);
    b.box(w, .25, d, "body", 0, h - .25, 0); b.box(w - .06, .01, d - .06, "coal", 0, h - .005, 0); b.tube([[0, h, -d / 2 + .03], [0, h + .3, -d / 2 + .03], [0, h + .3, -d / 2 + .2]], .014, "chrome");
  });

  G("toilet", (b, p) => {
    const { w, d, h } = p, st = p.style || "modern";
    if (st === "latrine") { b.box(w, h, d, "body"); b.cyl(.12, .12, .01, "coal", 0, h, 0, 16); b.box(w, .6, .05, "body", 0, h, -d / 2 + .025); return; }
    if (st === "steel") { b.rbox(w, h, d * .7, .05, "body", 0, 0, -d * .15); b.cyl(.17, .15, .03, "body", 0, h, .06, 18); b.cyl(.13, .13, .005, "coal", 0, h + .03, .06, 16); return; }
    b.box(w * .9, .38, .18, "body", 0, h - .02, -d / 2 + .09); b.box(w * .95, .03, .2, "body", 0, h + .36, -d / 2 + .1);
    b.lathe([[.12, 0], [.13, .2], [.18, h - .03], [0, h - .03]], "body", 0, 0, .04, 18).scale.z = 1.3;
    b.cyl(.19, .19, .03, "seat" in (p.m || {}) ? "seat" : "body", 0, h - .03, .06, 20).scale.z = 1.25; b.cyl(.13, .13, .005, "water", 0, h, .06, 16).scale.z = 1.25;
  });

  G("bathtub", (b, p) => {
    const { w, d, h } = p, st = p.style || "claw";
    if (st === "tin") { b.lathe([[w * .3, 0], [w * .45, h * .6], [w * .5, h], [w * .46, h], [0, h * .2]], "body", 0, 0, 0, 24).scale.z = d / w; return; }
    if (st === "claw") { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.sph(.05, "feet" in (p.m || {}) ? "feet" : "brass", sx * (w / 2 - .12), .05, sz * (d / 2 - .22), 1, 10); b.rbox(w, h - .1, d, .2, "body", 0, .1, 0); }
    else b.box(w, h, d, "body");
    b.rbox(w - .14, .02, d - .16, .1, b.cond === "ruined" ? "dirt" : p.blood ? "blood" : "water", 0, h - .012, 0);
    b.tube([[0, h, -d / 2 + .04], [0, h + .18, -d / 2 + .04], [0, h + .18, -d / 2 + .14]], .013, "chrome");
  });

  G("shower", (b, p) => {
    const { w, d, h } = p;
    b.box(w, .06, d, "base" in (p.m || {}) ? "base" : "porcelain"); b.box(w, h, .03, "tile", 0, 0, -d / 2 + .015); b.box(.03, h, d, "tile", -w / 2 + .015, 0, 0);
    b.box(.008, h - .1, d - .03, "glass", w / 2 - .004, .06, .015); b.box(w - .03, h - .1, .008, "glass", .015, .06, d / 2 - .004);
    b.tube([[0, 1.1, -d / 2 + .03], [0, 2, -d / 2 + .03], [0, 2.02, -d / 2 + .25]], .012, "chrome"); b.cyl(.08, .06, .03, "chrome", 0, 1.98, -d / 2 + .25, 16);
  });

  G("appliance", (b, p) => {
    const { w, d, h } = p, st = p.style || "fridge";
    if (st === "fridge") { b.rbox(w, h, d, .03, "body"); b.box(w - .01, .006, .02, "coal", 0, h * .62, d / 2); for (const y of [h * .75, h * .3]) b.box(.025, .25, .03, "handle" in (p.m || {}) ? "handle" : "chrome", w / 2 - .07, y, d / 2 + .02); return; }
    if (st === "retro") { b.rbox(w, h - .08, d, .12, "body", 0, .08, 0); b.box(w * .8, .08, d * .8, "pblack"); b.box(.05, .2, .04, "chrome", w / 2 - .1, h * .65, d / 2 + .01); b.box(w * .4, .05, .01, "chrome", 0, h - .2, d / 2); return; }
    if (st === "icebox") { b.box(w, h, d, "body"); for (const y of [.1, h * .55]) { b.box(w - .1, h * .38, .02, "body", 0, y, d / 2 + .01); b.box(.06, .05, .03, "brass", w / 2 - .1, y + h * .19, d / 2 + .03); } return; }
    if (st === "drinks") { b.box(w, h, d, "body"); b.box(w - .08, h - .3, .01, "glass", 0, .2, d / 2 + .004); b.box(w - .12, h * .1, .005, "glowwhite", 0, h - .14, d / 2 + .006); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) P.bottle(b, -w / 2 + .1 + c * (w - .2) / 3, .22 + r * (h - .4) / 4, .05, pick(b, ["glassgreen", "glassamber", "pred", "pblue"]), .7); b.sign(p.sign || "COLD DRINKS", w * .9, .12, "#b8231d", "#fff", 0, h - .1, d / 2 + .01); return; }
    if (st === "washer") { b.box(w, h, d, "body"); b.cyl(.2, .2, .03, "chrome", 0, h * .45, d / 2, 28, H); b.cyl(.16, .16, .01, "glass", 0, h * .45, d / 2 + .016, 28, H); b.box(w, .12, .01, "pgrey", 0, h - .14, d / 2 + .002); b.cyl(.025, .025, .02, "chrome", w * .3, h - .08, d / 2 + .01, 12, H); return; }
    if (st === "microwave") { b.rbox(w, h, d, .02, "body"); b.box(w * .65, h * .75, .005, "screenoff", -w * .12, h * .12, d / 2 + .002); return; }
    if (st === "boiler") { b.cyl(w / 2, w / 2, h, "body", 0, 0, 0, 22); b.tube([[0, h, 0], [0, h + .2, 0], [0, h + .2, -w]], .03, "copper"); b.cyl(.05, .05, .02, "chrome", 0, h * .6, w / 2, 14, H); return; }
    if (st === "cooler") { b.box(w, h - .35, d, "body"); b.lathe([[.13, 0], [.15, .05], [.15, .3], [.05, .35], [0, .35]], "glassblue", 0, h - .35, 0, 18); b.box(.05, .03, .04, "pblue", -.06, h * .55, d / 2 + .02); b.box(.05, .03, .04, "pred", .06, h * .55, d / 2 + .02); return; }
    if (st === "copier") { b.box(w, h - .2, d, "body"); b.box(w, .2, d * .8, "pgrey", 0, h - .2, -d * .1); b.box(.25, .08, .1, "screen", w * .3, h, d * .2); for (let i = 0; i < 3; i++) b.box(w * .8, .1, .01, "pgrey", 0, .1 + i * .15, d / 2 + .005); return; }
    if (st === "atm") { b.box(w, h, d, "body"); b.box(w * .8, h * .3, .1, "pgrey", 0, h * .45, d / 2 + .05); b.box(w * .5, .2, .002, "screen", 0, h * .65, d / 2 + .11); b.box(w * .3, .02, .03, "coal", 0, h * .5, d / 2 + .1); b.sign(p.sign || "CASH", w * .8, .12, "#16365c", "#fff", 0, h - .1, d / 2 + .01); return; }
  });

  G("screen", (b, p) => {
    const { w, d, h } = p, st = p.style || "flat", sm = p.m && p.m.screen ? "screen" : "screenoff";
    if (st === "flat") { b.box(w * .35, .015, .2, "pblack"); b.box(.06, .12, .03, "pblack", 0, 0, -.04); b.box(w, h - .1, .04, "pblack", 0, .1, -.02); b.box(w - .03, h - .13, .002, sm, 0, .115, .001); return; }
    if (st === "wall") { b.box(w, h, .04, "pblack", 0, 0, -d / 2 + .02); b.box(w - .03, h - .03, .002, sm, 0, .015, -d / 2 + .041); return; }
    if (st === "crt") { b.rbox(w, h, d, .04, "body"); b.rbox(w * .8, h * .78, .02, .05, sm, -w * .06, h * .1, d / 2 - .002); for (let i = 0; i < 2; i++) b.cyl(.02, .02, .02, "pblack", w * .38, h * .6 - i * .1, d / 2, 10, H); if (p.ant) for (const s of [-1, 1]) strut(b, [0, h, 0], [s * .25, h + .4, -.05], .004, "chrome"); return; }
    if (st === "cabinet") { b.box(w, h, d, "body"); b.rbox(w * .65, h * .45, .02, .05, sm, -w * .1, h * .4, d / 2); b.box(w * .2, h * .45, .01, "burlap", w * .37, h * .4, d / 2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.04, .12, .04, "body", sx * (w / 2 - .05), -.12, sz * (d / 2 - .05)); return; }
    if (st === "board") { b.box(w, h - .5, .04, "frame" in (p.m || {}) ? "frame" : "pblack", 0, .5, 0); b.box(w - .04, h - .54, .002, sm, 0, .52, .021); for (const sx of [-1, 1]) { b.box(.05, .5, .05, "steel", sx * w * .35); b.box(.05, .02, .5, "steel", sx * w * .35); } return; }
  });

  G("computer", (b, p) => {
    const { w, d } = p, st = p.style || "desktop";
    if (st === "laptop") { b.box(w, .018, d, "body"); b.box(w * .95, .003, d * .5, "pgrey", 0, .018, d * .15); b.box(w, d * .95, .008, "body", 0, .018, -d / 2, -.25); b.box(w * .92, d * .82, .002, "screen", 0, .06, -d / 2 + .03, -.25); return; }
    if (st === "crt") { b.rbox(.38, .36, .4, .03, "beige", 0, .1, -.05); b.rbox(.3, .26, .02, .03, p.m && p.m.screen ? "screen" : "screengreen", 0, .15, .16); b.box(.44, .1, .38, "beige", 0, 0, -.05); b.box(.44, .03, .16, "beige", 0, 0, .3); return; }
    if (st === "workstation") { for (let i = -1; i <= 1; i++) P.monitor(b, i * .58, 0, -d * .2 + Math.abs(i) * .08, -i * .35, "screen"); P.keyboard(b, 0, 0, d * .2); return; }
    if (st === "terminal") { b.rbox(.45, .4, .45, .04, "body", 0, 0, -.05); b.rbox(.32, .26, .02, .04, "screengreen", 0, .08, .175); b.box(.46, .04, .18, "body", 0, 0, .28); return; }
    P.monitor(b, 0, 0, -d * .2, 0, "screen"); P.keyboard(b, 0, 0, d * .2); b.box(.18, .42, .42, "pblack", w / 2 - .12, 0, -.05); b.box(.06, .02, .1, "pblack", .32, 0, d * .22);
  });

  G("lamp", (b, p) => {
    const { w, h } = p, st = p.style || "floor", glow = b.cond === "ruined" || p.off ? "glass" : (p.m && p.m.light ? "light" : "glowwhite");
    if (st === "floor") { b.cyl(.14, .15, .03, "body", 0, 0, 0, 20); b.cyl(.012, .012, h - .3, "body", 0, .03, 0, 8); b.lathe([[w / 2, 0], [w * .3, .3], [0, .3]], "shade" in (p.m || {}) ? "shade" : "cream", 0, h - .32, 0, 22).material.side = 2; b.sph(.05, glow, 0, h - .22, 0, 1, 10); return; }
    if (st === "table") { b.lathe([[.08, 0], [.09, .03], [.05, .08], [.09, .2], [.02, .3], [0, .3]], "body", 0, 0, 0, 18); b.cyl(.008, .008, h - .45, "brass", 0, .3, 0, 8); b.lathe([[w / 2, 0], [w * .32, .2], [0, .2]], "shade" in (p.m || {}) ? "shade" : "cream", 0, h - .22, 0, 20).material.side = 2; b.sph(.035, glow, 0, h - .15, 0, 1, 10); return; }
    if (st === "desk") { b.cyl(.08, .09, .025, "body", 0, 0, 0, 16); strut(b, [0, .02, 0], [0, .3, -.05], .01, "body"); strut(b, [0, .3, -.05], [0, .42, .15], .01, "body"); b.part(() => { b.cone(.07, .1, "body"); b.sph(.03, glow, 0, .01, 0, 1, 8); }, 0, .45, .2, PI * .85, 0, 0); return; }
    if (st === "oil") { b.lathe([[.06, 0], [.07, .02], [.06, .1], [.03, .12], [0, .12]], "body", 0, 0, 0, 16); b.lathe([[.03, 0], [.045, .04], [.04, .1], [.022, .2], [0, .2]], "glass", 0, .12, 0, 16); b.cone(.012, .04, "fire", 0, .15, 0, 8); return; }
    if (st === "lantern") { b.box(w, .03, w, "body"); b.box(w, .03, w, "body", 0, h * .7); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.01, h * .7, .01, "body", sx * (w / 2 - .005), 0, sz * (w / 2 - .005)); b.box(w - .02, h * .65, w - .02, "glassamber", 0, .03); b.cone(w * .6, h * .2, "body", 0, h * .73, 0, 4).rotation.y = PI / 4; b.tor(.03, .005, "body", 0, h - .02, 0, 0); b.cone(.015, .05, "fire", 0, .1, 0, 8); return; }
    if (st === "street" || st === "gas") { b.cyl(.09, .12, .5, "body", 0, 0, 0, 14); b.cyl(.04, .05, h - .5, "body", 0, .5, 0, 12); if (st === "gas") { b.rod(.012, .4, "body", 0, h - .55, 0); b.part(() => { b.cyl(.12, .07, .3, "glassamber", 0, 0, 0, 4); b.cone(.16, .15, "body", 0, .3, 0, 4); b.sph(.05, b.cond === "ruined" ? "glass" : "glowamber", 0, .15, 0, 1, 8); }, 0, h - .2, 0, 0, PI / 4, 0); } else { b.tube([[0, h - .1, 0], [0, h, .2], [0, h, .7]], .04, "body"); b.rbox(.25, .08, .45, .03, "body", 0, h - .05, .75); b.box(.2, .01, .35, glow, 0, h - .06, .75); } return; }
    if (st === "flood") { for (let i = 0; i < 3; i++) { const a = i * TAU / 3; strut(b, [Math.cos(a) * .4, 0, Math.sin(a) * .4], [0, h - .3, 0], .015, "body"); } b.part(() => { b.box(.5, .35, .15, "body"); b.box(.45, .3, .01, glow, 0, .025, .08); }, 0, h - .35, 0, -.3, 0, 0); return; }
    if (st === "candelabrum") { b.lathe([[.18, 0], [.12, .05], [.03, .15], [.03, h - .2], [.06, h - .15], [.08, h - .1], [0, h - .1]], "body", 0, 0, 0, 16); P.candle(b, 0, h - .1, 0, 1.3); return; }
    if (st === "lava") { b.lathe([[.08, 0], [.1, .1], [.05, .18], [0, .18]], "body", 0, 0, 0, 16); b.lathe([[.05, 0], [.08, .15], [.04, .3], [0, .3]], "glowmagenta", 0, .18, 0, 16); return; }
  });

  G("hanging", (b, p) => {
    const { w, h } = p, st = p.style || "candles", glow = b.cond === "ruined" ? "glass" : "glowwhite", top = h;
    if (st === "candles" || st === "iron") { b.cyl(.006, .006, h * .4, "body", 0, top - h * .4, 0, 6); b.tor(w / 2, .02, "body", 0, top - h * .55, 0); b.cyl(.03, .03, .08, "body", 0, top - h * .6, 0, 10); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; strut(b, [0, top - h * .45, 0], [Math.cos(a) * w / 2, top - h * .55, Math.sin(a) * w / 2], .005, "body"); if (b.cond !== "ruined") P.candle(b, Math.cos(a) * w / 2, top - h * .55 + .02, Math.sin(a) * w / 2, 1, b.cond !== "burned"); } if (st === "iron") b.tor(w * .3, .015, "body", 0, top - h * .75, 0); return; }
    if (st === "crystal") { b.cyl(.01, .01, h * .3, "brass", 0, top - h * .3, 0, 6); for (let k = 0; k < 3; k++) { const rr = w / 2 * (1 - k * .3), y = top - h * (.4 + k * .17); b.tor(rr, .012, "brass", 0, y, 0); for (let i = 0; i < 10 - k * 2; i++) { const a = i * TAU / (10 - k * 2); b.cone(.02, .08, "crystal", Math.cos(a) * rr, y - .1, Math.sin(a) * rr, 6); P.candle(b, Math.cos(a) * rr, y + .01, Math.sin(a) * rr, .6, true); } } return; }
    if (st === "pendant") { b.cyl(.004, .004, h * .7, "pblack", 0, top - h * .7, 0, 6); b.lathe([[w / 2, 0], [w * .15, h * .25], [0, h * .25]], "body", 0, top - h * .95, 0, 22).material.side = 2; b.sph(.04, glow, 0, top - h * .9, 0, 1, 10); return; }
    if (st === "cage") { b.cyl(.004, .004, h * .5, "body", 0, top - h * .5, 0, 6); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.tube([[0, top - h * .5, 0], [Math.cos(a) * w / 2, top - h * .7, Math.sin(a) * w / 2], [0, top - h, 0]], .004, "body"); } b.sph(.05, glow, 0, top - h * .78, 0, 1.3, 10); return; }
    if (st === "bulb") { b.cyl(.003, .003, h * .8, "pblack", 0, top - h * .8, 0, 6); b.sph(.04, b.cond === "ruined" ? "glass" : "glowamber", 0, top - h * .86, 0, 1.3, 10); return; }
    if (st === "fan") { b.cyl(.02, .02, .2, "body", 0, top - .2, 0, 8); b.cyl(.09, .09, .12, "body", 0, top - .32, 0, 16); for (let i = 0; i < 4; i++) b.part(() => b.box(w / 2, .01, .14, "blade" in (p.m || {}) ? "blade" : "walnut", w / 4), 0, top - .3, 0, 0, i * H + .3, 0); return; }
    if (st === "panel") { b.box(w, .06, p.d, "body", 0, top - .06, 0); b.box(w - .04, .005, p.d - .04, b.cond === "ruined" ? "glass" : "glowwhite", 0, top - .065, 0); return; }
    if (st === "lantern") { b.cyl(.004, .004, h * .4, "body", 0, top - h * .4, 0, 6); b.part(() => { b.box(w, .02, w, "body"); b.box(w - .02, h * .4, w - .02, "glassamber", 0, .02); b.cone(w * .6, h * .15, "body", 0, h * .42, 0, 4); b.cone(.012, .05, "fire", 0, .06, 0, 8); }, 0, top - h * .95, 0, 0, PI / 4, 0); return; }
    if (st === "surgical") { b.cyl(.03, .03, h * .5, "steel", 0, top - h * .5, 0, 10); b.part(() => { b.cyl(w / 2, w / 2 * .8, .1, "body", 0, 0, 0, 24); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; b.cyl(.05, .05, .005, glow, Math.cos(a) * w * .28, -.003, Math.sin(a) * w * .28, 12); } }, 0, top - h * .6, 0, .3, 0, 0); return; }
  });

  G("sconce", (b, p) => {
    const { w, d, h } = p, st = p.style || "torch", back = -d / 2, lit = b.cond !== "ruined" && !p.off;
    if (st === "torch") { b.box(.08, .16, .02, "body", 0, -.1, back + .01); strut(b, [0, -.04, back + .02], [0, .02, back + .12], .012, "body"); b.part(() => { b.cyl(.025, .015, .4, "pine", 0, 0, 0, 8); b.cyl(.035, .03, .08, "burlap", 0, .34, 0, 8); if (lit) { b.cone(.05, .18, "fire", 0, .41, 0, 8); b.cone(.03, .12, "ember", 0, .41, 0, 8); } }, 0, -.1, back + .14, -.25, 0, 0); return; }
    if (st === "candle") { b.box(.06, .14, .015, "body", 0, -.07, back + .008); b.tube([[0, -.04, back + .01], [0, -.06, back + .08], [0, -.02, back + .12]], .008, "body"); b.cyl(.04, .03, .02, "body", 0, -.02, back + .12, 12); if (lit) P.candle(b, 0, 0, back + .12, 1.1); return; }
    if (st === "electric") { b.cyl(.05, .05, .02, "body", 0, 0, back + .01, 14, H); b.tube([[0, 0, back + .02], [0, .05, back + .1]], .008, "body"); b.lathe([[.07, 0], [.04, .12], [0, .12]], "shade" in (p.m || {}) ? "shade" : "cream", 0, .02, back + .12, 16).material.side = 2; if (lit) b.sph(.025, "glowamber", 0, .07, back + .12, 1, 8); return; }
    if (st === "emergency") { b.rbox(w, .1, .08, .02, "body", 0, -.05, back + .04); b.box(w - .04, .06, .01, lit ? (p.m && p.m.light ? "light" : "glowred") : "glass", 0, -.03, back + .085); return; }
    if (st === "tube") { b.box(w, .03, .03, "body", 0, -.015, back + .015); b.rod(.012, w - .06, lit ? (p.m && p.m.light ? "light" : "glowwhite") : "glass", 0, 0, back + .04, "x"); return; }
    if (st === "cage") { b.box(.14, .14, .03, "body", 0, -.07, back + .015); b.sph(.05, lit ? "glowamber" : "glass", 0, 0, back + .07, 1.2, 10); for (let i = 0; i < 4; i++) b.tor(.06, .004, "body", 0, 0, back + .07, 0, i * PI / 4, PI); return; }
  });

  G("candles", (b, p) => {
    const { w, h } = p, st = p.style || "stick", lit = b.cond !== "ruined" && b.cond !== "burned";
    if (st === "stick") { b.lathe([[.06, 0], [.06, .01], [.015, .03], [.012, h - .15], [.035, h - .13], [.03, h - .12], [0, h - .12]], "body", 0, 0, 0, 16); P.candle(b, 0, h - .13, 0, 1, lit); return; }
    if (st === "candelabra") { b.lathe([[.08, 0], [.08, .015], [.02, .04], [.015, h * .6], [.03, h * .62], [0, h * .62]], "body", 0, 0, 0, 16); for (const s of [-1, 1]) b.tube([[0, h * .5, 0], [s * w * .3, h * .55, 0], [s * w * .42, h * .68, 0]], .01, "body"); for (const x of [-w * .42, 0, w * .42]) { b.cyl(.025, .02, .03, "body", x, x ? h * .68 : h * .62, 0, 12); P.candle(b, x, (x ? h * .68 : h * .62) + .03, 0, 1, lit); } return; }
    if (st === "cluster") { for (let i = 0; i < 9; i++) { const a = b.r() * TAU, d = b.r() * w * .4; P.candle(b, Math.cos(a) * d, 0, Math.sin(a) * d, 1.1 + b.r() * .6, lit && b.r() < .85, .05 + b.r() * .2); } b.cyl(w * .4, w * .45, .01, "wax", 0, 0, 0, 18); return; }
    if (st === "ring") { for (let i = 0; i < 13; i++) { const a = i * TAU / 13; P.candle(b, Math.cos(a) * w * .47, 0, Math.sin(a) * w * .47, 1.2, lit, .08 + b.r() * .12); } return; }
  });

  G("rug", (b, p) => {
    const { w, d } = p, st = p.style || "persian", c1 = p.c1 || "#7a2020", c2 = p.c2 || "#d8c49a", c3 = p.c3 || "#1f3050";
    if (st === "round") b.cyl(w / 2, w / 2, .008, "body", 0, 0, 0, 40).scale.z = d / w; else if (st !== "hide") b.box(w, .008, d, "body", 0, 0, 0);
    b.decal(st + c1 + c2 + c3 + (b.cond || ""), (g, W, Hh) => {
      g.fillStyle = c1; if (st === "round") { g.beginPath(); g.ellipse(W / 2, Hh / 2, W / 2, Hh / 2, 0, 0, 7); g.fill(); } else g.fillRect(0, 0, W, Hh);
      g.strokeStyle = c2; g.lineWidth = Math.min(W, Hh) * .05;
      if (st === "persian" || st === "runner") { const m = Math.min(W, Hh) * .08; g.strokeRect(m, m, W - m * 2, Hh - m * 2); g.lineWidth /= 3; g.strokeStyle = c3; g.strokeRect(m * 1.9, m * 1.9, W - m * 3.8, Hh - m * 3.8); g.fillStyle = c3; g.beginPath(); g.ellipse(W / 2, Hh / 2, W * .18, Hh * .2, 0, 0, 7); g.fill(); g.fillStyle = c2; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc([m * 3.5, W - m * 3.5][i % 2], [m * 3.5, Hh - m * 3.5][i >> 1], m * .9, 0, 7); g.fill(); } g.strokeStyle = c2; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(W / 2, Hh / 2, W * (.06 + k * .025), Hh * (.07 + k * .028), 0, 0, 7); g.stroke(); } }
      else if (st === "round") { for (let k = 1; k < 5; k++) { g.lineWidth = Math.min(W, Hh) * .02; g.strokeStyle = k % 2 ? c2 : c3; g.beginPath(); g.ellipse(W / 2, Hh / 2, W / 2 * (1 - k * .18), Hh / 2 * (1 - k * .18), 0, 0, 7); g.stroke(); } }
      else if (st === "stripes" || st === "rag") { const n = 14; for (let i = 0; i < n; i++) { g.fillStyle = [c1, c2, c3][i % 3]; g.fillRect(0, i * Hh / n, W, Hh / n * .8); } }
      else if (st === "modern") { g.fillStyle = c2; g.fillRect(W * .1, Hh * .1, W * .35, Hh * .8); g.fillStyle = c3; g.beginPath(); g.arc(W * .7, Hh * .5, Math.min(W, Hh) * .25, 0, 7); g.fill(); }
      else if (st === "hide") { g.clearRect(0, 0, W, Hh); g.fillStyle = c1; g.beginPath(); g.moveTo(W * .5, 0); g.bezierCurveTo(W * .9, Hh * .05, W * .7, Hh * .3, W, Hh * .35); g.bezierCurveTo(W * .75, Hh * .5, W * .9, Hh * .7, W * .95, Hh); g.lineTo(W * .5, Hh * .85); g.lineTo(W * .05, Hh); g.bezierCurveTo(W * .1, Hh * .7, W * .25, Hh * .5, 0, Hh * .35); g.bezierCurveTo(W * .3, Hh * .3, W * .1, Hh * .05, W * .5, 0); g.fill(); }
      if (b.cond === "dirty" || b.cond === "worn" || b.cond === "ruined" || b.cond === "burned") { g.globalAlpha = .25; g.fillStyle = b.cond === "burned" ? "#120c08" : "#3a2c1e"; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse(Math.random() * W, Math.random() * Hh, W * .08, Hh * .05, 0, 0, 7); g.fill(); } g.globalAlpha = 1; }
    }, w, d, .009);
  });

  G("frame", (b, p) => {
    const { w, h } = p, st = p.style || "painting", back = -p.d / 2, y0 = 0;
    const fr = p.m && p.m.frame ? "frame" : "gold", fw = st === "poster" || st === "board" ? .02 : .06;
    if (st !== "poster") { b.box(w, h, .03, fr, 0, y0, back + .015); }
    const art = (g, W, Hh) => {
      if (st === "mirror") return;
      if (st === "map") { g.fillStyle = "#d9c39a"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#6b4e33"; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(Math.random() * W, Math.random() * Hh); for (let k = 0; k < 6; k++) g.lineTo(Math.random() * W, Math.random() * Hh); g.stroke(); } g.fillStyle = "#3e6b9a"; g.beginPath(); g.ellipse(W * .7, Hh * .6, W * .15, Hh * .12, .3, 0, 7); g.fill(); return; }
      if (st === "board") { g.fillStyle = "#a8835a"; g.fillRect(0, 0, W, Hh); for (let i = 0; i < 9; i++) { g.fillStyle = ["#f2efe6", "#f5e68a", "#e8e3d6", "#c9dbe8"][i % 4]; g.save(); g.translate(W * .1 + (i % 3) * W * .3, Hh * .12 + ((i / 3) | 0) * Hh * .3); g.rotate((Math.random() - .5) * .3); g.fillRect(0, 0, W * .2, Hh * .2); g.restore(); } g.strokeStyle = "#b8231d"; g.lineWidth = 3; g.beginPath(); g.moveTo(W * .2, Hh * .2); g.lineTo(W * .5, Hh * .5); g.lineTo(W * .8, Hh * .25); g.moveTo(W * .5, Hh * .5); g.lineTo(W * .25, Hh * .8); g.stroke(); return; }
      if (st === "blackboard") { g.fillStyle = "#26302a"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "rgba(240,238,230,.7)"; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(W * .08, Hh * (.15 + i * .12)); g.lineTo(W * (.3 + Math.random() * .5), Hh * (.15 + i * .12)); g.stroke(); } return; }
      if (st === "poster") { g.fillStyle = p.c1 || "#c4622d"; g.fillRect(0, 0, W, Hh); g.fillStyle = p.c2 || "#1f2a38"; g.beginPath(); g.arc(W / 2, Hh * .42, W * .28, 0, 7); g.fill(); g.fillRect(W * .12, Hh * .78, W * .76, Hh * .08); return; }
      if (st === "portrait") { const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#3a2c22"); gr.addColorStop(1, "#1a1410"); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); g.fillStyle = "#1c1612"; g.beginPath(); g.ellipse(W / 2, Hh * .95, W * .38, Hh * .35, 0, 0, 7); g.fill(); g.fillStyle = "#c9a07a"; g.beginPath(); g.ellipse(W / 2, Hh * .4, W * .17, Hh * .16, 0, 0, 7); g.fill(); g.fillStyle = "#2a1c12"; g.beginPath(); g.ellipse(W / 2, Hh * .3, W * .19, Hh * .1, 0, PI, 0); g.fill(); return; }
      // a landscape
      const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#8fa9bf"); gr.addColorStop(.55, "#e4d6b4"); gr.addColorStop(.56, "#5d7044"); gr.addColorStop(1, "#3a4a2c"); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
      g.fillStyle = "#4b5a3c"; g.beginPath(); g.moveTo(0, Hh * .6); for (let x = 0; x <= W; x += W / 8) g.lineTo(x, Hh * (.42 + Math.random() * .12)); g.lineTo(W, Hh * .6); g.fill();
    };
    if (st === "mirror") { b.box(w - fw * 2, h - fw * 2, .005, b.broken ? "frosted" : "chrome", 0, y0 + fw, back + .032); if (b.broken) for (let i = 0; i < 5; i++) b.box(.004, h * .5, .001, "coal", (b.r() - .5) * w * .5, y0 + h * .3, back + .036, 0, 0, (b.r() - .5) * 2); }
    else b.part(() => b.decal(st + w + h + (p.c1 || ""), art, w - fw * 2, h - fw * 2, 0, null, true), 0, y0 + h / 2, back + .032);
  });

  G("clock", (b, p) => {
    const { w, d, h } = p, st = p.style || "grandfather";
    const face = (g, W, Hh) => { g.fillStyle = "#efe6cf"; g.beginPath(); g.arc(W / 2, Hh / 2, W / 2 - 2, 0, 7); g.fill(); g.strokeStyle = "#1d1b1a"; g.lineWidth = W / 50; g.stroke(); g.fillStyle = "#1d1b1a"; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillRect(W / 2 + Math.cos(a) * W * .4 - 3, Hh / 2 + Math.sin(a) * Hh * .4 - 3, 6, 6); } g.lineWidth = W / 40; g.beginPath(); g.moveTo(W / 2, Hh / 2); g.lineTo(W / 2 + W * .2, Hh / 2 - Hh * .12); g.moveTo(W / 2, Hh / 2); g.lineTo(W / 2 - W * .05, Hh / 2 - Hh * .33); g.stroke(); };
    if (st === "wall") { b.cyl(w / 2, w / 2, .05, "body", 0, w / 2, -d / 2 + .025, 28, H); b.part(() => b.decal("clock", face, w * .86, w * .86, 0, null, true), 0, w / 2, -d / 2 + .052); return; }
    b.box(w, .12, d, "body"); b.box(w * .8, h - .55, d * .8, "body", 0, .12, 0); b.box(w, .45, d, "body", 0, h - .45, 0);
    b.ext([[-w / 2, 0], [w / 2, 0], [w * .35, .1], [0, .16], [-w * .35, .1]], d, "body", 0, h, 0);
    b.part(() => b.decal("clock", face, w * .75, w * .75, 0, null, true), 0, h - .23, d / 2 + .005);
    b.box(w * .5, h - .9, .005, "glass", 0, .3, d * .4 + .003); b.rod(.004, h - 1.1, "brass", 0, .3 + (h - 1.1) / 2 + .15, d * .3, "y"); b.cyl(.06, .06, .01, "brass", 0, .42, d * .3, 18, H);
  });

  G("piano", (b, p) => {
    const { w, d, h } = p, st = p.style || "upright";
    if (st === "grand") {
      const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, -d * .1], [w * .3, d * .2], [w * .05, d * .45], [-w * .3, d / 2], [-w / 2, d / 2]];
      b.slab(pts.map(([x, z]) => [x, z]), .3, "body", 0, h - .3, 0); for (const [x, z] of [[-w * .4, -d * .4], [w * .4, -d * .4], [-w * .35, d * .4]]) b.cyl(.05, .04, h - .3, "body", x, 0, z, 10);
      b.box(w, .02, .16, "white", 0, h - .32, -d / 2 - .08); for (let i = 0; i < 36; i++) if (i % 7 !== 2 && i % 7 !== 6) b.box(.012, .012, .09, "pblack", -w / 2 + .02 + i * (w - .04) / 36, h - .3, -d / 2 - .1);
      b.part(() => b.slab(pts, .02, "body"), 0, h, 0, .4, 0, 0); return;
    }
    if (st === "organ") { b.box(w, h * .4, d, "body"); for (let i = 0; i < 15; i++) { const x = -w / 2 + .1 + i * (w - .2) / 14, ph = h * (.55 + .4 * (1 - Math.abs(i - 7) / 7)); b.cyl(.035, .035, ph, "brass", x, h * .4, -d * .3, 10); } b.box(w * .8, .02, .2, "white", 0, h * .38, d / 2 + .1); return; }
    b.box(w, h, d * .55, "body", 0, 0, -d * .22); b.box(w, .06, d, "body", 0, .7, 0); b.box(w - .1, .02, .16, "white", 0, .76, d / 2 - .1);
    for (let i = 0; i < 36; i++) if (i % 7 !== 2 && i % 7 !== 6) b.box(.012, .012, .09, "pblack", -w / 2 + .07 + i * (w - .14) / 36, .78, d / 2 - .13);
    for (const sx of [-1, 1]) b.box(.05, .7, .05, "body", sx * (w / 2 - .04), 0, d / 2 - .06);
    if (p.items) P.candle(b, w * .35, h, -d * .2, 1.2);
  });

  G("potplant", (b, p) => {
    const { w, h } = p, st = p.style || "fern", pot = p.m && p.m.pot ? "pot" : "terracotta", ph = Math.min(.4, h * .3);
    b.lathe([[w * .28, 0], [w * .36, ph * .9], [w * .38, ph], [w * .34, ph], [0, ph * .85]], pot, 0, 0, 0, 18);
    b.cyl(w * .33, w * .33, .01, "dirt", 0, ph * .86, 0, 16);
    const dead = b.cond === "ruined" || b.cond === "burned" || st === "dead", lf = dead ? "leafautumn" : "leaf";
    if (st === "fern") for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + b.r(), l = h - ph; b.tube([[0, ph, 0], [Math.cos(a) * w * .2, ph + l * .6, Math.sin(a) * w * .2], [Math.cos(a) * w * .5, ph + l * .4, Math.sin(a) * w * .5]], .025, lf); }
    else if (st === "ficus" || st === "tree") { b.cyl(.02, .025, h * .55, "bark", 0, ph, 0, 8); for (let i = 0; i < 6; i++) b.sph(w * (.22 + b.r() * .1), dead ? "leafautumn" : (i % 2 ? "leaf" : "leafdark"), (b.r() - .5) * w * .4, h * .7 + (b.r() - .3) * h * .25, (b.r() - .5) * w * .4, .85, 10); }
    else if (st === "palm") for (let i = 0; i < 7; i++) { const a = i * TAU / 7; b.tube([[0, ph, 0], [Math.cos(a) * w * .15, h * .85, Math.sin(a) * w * .15], [Math.cos(a) * w * .5, h * .6, Math.sin(a) * w * .5]], .02, lf); b.part(() => b.box(w * .3, .005, .08, lf), Math.cos(a) * w * .3, h * .78, Math.sin(a) * w * .3, 0, -a, -.3); }
    else if (st === "cactus") { b.cyl(w * .14, w * .16, h - ph, "leafdark", 0, ph, 0, 10); b.sph(w * .14, "leafdark", 0, h, 0, 1, 10); b.tube([[0, ph + (h - ph) * .4, 0], [w * .25, ph + (h - ph) * .45, 0], [w * .25, ph + (h - ph) * .75, 0]], w * .07, "leafdark"); }
    else if (st === "flowers") { for (let i = 0; i < 9; i++) { const x = (b.r() - .5) * w * .5, z = (b.r() - .5) * w * .5, y = ph + (h - ph) * (.6 + b.r() * .4); b.cyl(.005, .005, y - ph, "leaf", x, ph, z, 5); b.sph(.035, dead ? "leafautumn" : pick(b, ["fruitred", "fruityellow", "white", "purple"]), x, y, z, .6, 8); } }
    else if (st === "snake" || st === "dead") for (let i = 0; i < 8; i++) { const x = (b.r() - .5) * w * .3, z = (b.r() - .5) * w * .3; b.part(() => b.cone(.04, (h - ph) * (.6 + b.r() * .4), dead ? "leafautumn" : "leafdark", 0, 0, 0, 4), x, ph, z, (b.r() - .5) * .3, b.r() * 3, (b.r() - .5) * .3).scale.z = .3; }
  });

  /* ================= small things ================= */
  G("vessel", (b, p) => {
    const { w, h } = p, st = p.style || "jar", r = w / 2;
    if (st === "goblet") { P.goblet(b, 0, 0, 0, "body", h / .15); return; }
    if (st === "goblets") { for (let i = 0; i < (p.n || 4); i++) P.goblet(b, (b.r() - .5) * w * .7, 0, (b.r() - .5) * p.d * .7, "body"); return; }
    if (st === "mugs") { for (let i = 0; i < (p.n || 4); i++) P.mug(b, (b.r() - .5) * w * .7, 0, (b.r() - .5) * p.d * .7, "body"); return; }
    const prof = {
      jar: [[r * .85, 0], [r, h * .1], [r, h * .8], [r * .7, h * .9], [r * .75, h], [0, h]],
      vase: [[r * .5, 0], [r * .55, h * .05], [r, h * .35], [r * .45, h * .8], [r * .6, h], [r * .55, h], [0, h * .2]],
      urn: [[r * .55, 0], [r * .5, h * .1], [r * .7, h * .15], [r, h * .45], [r * .7, h * .8], [r * .75, h * .88], [r * .5, h * .9], [r * .55, h], [0, h]],
      amphora: [[0, 0], [r * .2, h * .05], [r, h * .45], [r * .8, h * .7], [r * .3, h * .82], [r * .3, h * .95], [r * .4, h], [0, h * .9]],
      jug: [[r * .8, 0], [r, h * .35], [r * .85, h * .7], [r * .4, h * .85], [r * .45, h], [0, h * .8]],
      pot: [[r * .7, 0], [r * .95, h * .2], [r, h * .7], [r * .9, h], [r * .85, h], [0, h * .1]],
      bowl: [[0, 0], [r * .5, 0], [r * .9, h * .6], [r, h], [r * .92, h], [0, h * .2]],
      bucket: [[r * .78, 0], [r, h], [r * .95, h], [0, h * .05]],
      tankard: [[r, 0], [r * .92, h], [r * .85, h], [0, h * .05]],
      cauldron: [[r * .4, 0], [r * .85, h * .2], [r, h * .55], [r * .85, h * .9], [r * .9, h], [r * .82, h], [0, h * .15]],
      kettle: [[r * .8, 0], [r, h * .4], [r * .55, h * .8], [r * .3, h * .85], [0, h * .9]],
      canister: [[r, 0], [r, h], [r * .9, h], [0, h]],
      teapot: [[r * .6, 0], [r, h * .35], [r * .85, h * .7], [r * .35, h * .82], [.01, h]]
    }[st] || [[r, 0], [r, h], [0, h]];
    b.lathe(prof, "body", 0, 0, 0, 22);
    if (st === "jug" || st === "tankard" || st === "teapot") b.tor(h * .22, .008, "body", r * 1.02, h * .5, 0, 0, 0);
    if (st === "teapot" || st === "kettle") strut(b, [-r * .8, h * .3, 0], [-r * 1.5, h * .7, 0], .012, "body");
    if (st === "amphora" || st === "urn") for (const s of [-1, 1]) b.tor(h * .12, .012, "body", s * r * .55, h * .75, 0, 0, H);
    if (st === "bucket") { b.tor(r, .006, "body" in (p.m || {}) && p.m.band ? "band" : "iron", 0, h * .75, 0); b.tube([[-r, h * .9, 0], [0, h * 1.35, 0], [r, h * .9, 0]], .005, "iron"); if (p.fill) b.cyl(r * .95, r * .95, .01, p.fill, 0, h * .85, 0, 18); }
    if (st === "cauldron") { for (let i = 0; i < 3; i++) { const a = i * TAU / 3; b.cyl(.025, .02, h * .2, "body", Math.cos(a) * r * .55, -h * .02, Math.sin(a) * r * .55, 6); } b.cyl(r * .82, r * .82, .015, p.fill || "glowgreen", 0, h * .82, 0, 22); for (const s of [-1, 1]) b.tor(r * .2, .012, "body", s * r * .95, h * .9, 0, 0, H); if (p.fire) { for (let i = 0; i < 4; i++) b.part(() => b.cyl(.04, .04, r * 1.4, "bark", 0, 0, 0, 8, 0, H), 0, .04, 0, 0, i * PI / 4, 0); b.cone(r * .4, .3, "fire", 0, .05, 0, 8); } }
    if (p.lid) b.cyl(r * .78, r * .78, .02, "lid" in (p.m || {}) ? "lid" : "cork", 0, h, 0, 18);
    if (p.fill && st !== "bucket" && st !== "cauldron") b.cyl(r * .88, r * .88, .008, p.fill, 0, h * .9, 0, 18);
    if (p.organ) { b.sph(r * .45, "flesh", 0, h * .4, 0, 1, 12); b.cyl(r * .9, r * .9, h * .8, "glassamber", 0, h * .05, 0, 18); }
  });

  G("bottles", (b, p) => {
    const { w, d } = p, st = p.style || "wine", n = p.n || 1;
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 0 : (b.r() - .5) * (w - .08), z = n === 1 ? 0 : (b.r() - .5) * (d - .08), m = p.m && p.m.glass ? "glass" : pick(b, ["glassgreen", "glassamber", "glassblue", "glasspurple"]);
      if (st === "potion") P.flask(b, x, 0, z, pick(b, ["glowgreen", "glowviolet", "glowred", "glowamber", "glowcyan"]), .7 + b.r() * .5);
      else if (st === "vial") P.vial(b, x, 0, z, pick(b, ["glowred", "glowgreen", "glowcyan"]));
      else if (st === "beer") P.bottle(b, x, 0, z, m === "glass" ? "glassamber" : m, .8);
      else if (st === "fallen") b.part(() => P.bottle(b, 0, 0, 0, m), x, .037, z, H, b.r() * 3, 0);
      else P.bottle(b, x, 0, z, m, 1.1);
    }
  });

  G("books", (b, p) => {
    const { w, d, h } = p, st = p.style || "stack";
    if (st === "stack") { let y = 0; const n = p.n || Math.max(2, Math.round(h / .04)); for (let i = 0; i < n; i++) { const t = .03 + b.r() * .025; P.book(b, (b.r() - .5) * .03, y, (b.r() - .5) * .03, pick(b, BOOKS), (b.r() - .5) * .4, w / .24); y += t * w / .24; } return; }
    if (st === "open") { P.openbook(b, 0, 0, 0, 0, w / .36); return; }
    if (st === "row") { bookRow(b, -w / 2, w / 2, 0, 0, d, h); for (const s of [-1, 1]) b.box(.03, h * .6, d, "bookend" in (p.m || {}) ? "bookend" : "brass", s * (w / 2 + .02)); return; }
    if (st === "pile") { for (let i = 0; i < (p.n || 12); i++) { const a = b.r() * TAU, rr = b.r() * w * .35; P.book(b, Math.cos(a) * rr, (b.r() < .5 ? .035 : 0) + (i > 8 ? .07 : 0), Math.sin(a) * rr, pick(b, BOOKS), b.r() * TAU); } return; }
    if (st === "scroll") { for (let i = 0; i < (p.n || 1); i++) b.part(() => { b.cyl(.025, .025, w * .8, "parchment", 0, 0, 0, 12, 0, H); for (const s of [-1, 1]) b.cyl(.012, .012, .03, "walnut", s * w * .42, 0, 0, 8, 0, H); }, (b.r() - .5) * (p.n > 1 ? w * .3 : 0), .025 + (i > 2 ? .05 : 0), (b.r() - .5) * (p.n > 1 ? d * .6 : 0), 0, (b.r() - .5) * (p.n > 1 ? 1 : 0), 0); return; }
    if (st === "letter") { P.paper(b, 0, 0, 0, .1, p.m && p.m.paper ? "paper" : "parchment"); if (p.seal) b.cyl(.015, .015, .004, "red", .04, .002, .1, 12); return; }
    if (st === "newspaper") { b.box(w, .006, d, "paper"); b.box(w * .9, .001, .03, "ink", 0, .006, -d * .38); for (let i = 0; i < 8; i++) b.box(w * .38, .001, .01, "grey", (i % 2 - .5) * w * .45, .006, -d * .2 + ((i / 2) | 0) * d * .15); return; }
    if (st === "map") { b.box(w, .002, d, "parchment"); b.decal("mapdecal", (g, W, Hh) => { g.strokeStyle = "#6b4e33"; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * W, Math.random() * Hh); for (let k = 0; k < 5; k++) g.lineTo(Math.random() * W, Math.random() * Hh); g.stroke(); } g.fillStyle = "#b8231d"; g.font = `bold ${W / 8}px serif`; g.fillText("X", W * .6, Hh * .6); }, w * .95, d * .95, .003); return; }
  });

  G("food", (b, p) => {
    const { w, d } = p, st = p.style || "bread";
    if (st.startsWith("plate")) { P.plate(b, 0, 0, 0, st.slice(6), w / .22); return; }
    if (st === "bread") { for (let i = 0; i < (p.n || 3); i++) b.part(() => b.sph(.08, "bread", 0, 0, 0, .55, 12).scale.set(1.6, .55, 1), (b.r() - .5) * (w - .2), .04, (b.r() - .5) * (d - .1), 0, b.r() * 3, 0); return; }
    if (st === "cheese") { b.cyl(w / 2, w / 2, p.h, "cheese", 0, 0, 0, 24); return; }
    if (st === "fruit") { b.lathe([[0, 0], [w * .25, 0], [w * .48, p.h * .8], [w * .5, p.h], [w * .45, p.h], [0, p.h * .2]], "body", 0, 0, 0, 20); for (let i = 0; i < 7; i++) b.sph(.035, pick(b, ["fruitred", "fruitgreen", "fruityellow"]), (b.r() - .5) * w * .5, p.h * .9, (b.r() - .5) * w * .5, 1, 10); return; }
    if (st === "meat") { b.sph(.12, "meat", 0, .08, 0, .6, 12).scale.x = 1.5; b.rod(.02, .2, "bone", .2, .07, 0); return; }
    if (st === "fish") { b.sph(.05, "steel", 0, .025, 0, .5, 10).scale.x = 3.2; b.ext([[0, 0], [.06, .04], [.06, -.04]], .01, "steel", .15, .025, 0); return; }
    if (st === "feast") { b.box(w, .02, d, "silver"); b.sph(.14, "meat", 0, .09, 0, .65, 14).scale.x = 1.4; for (let i = 0; i < 8; i++) b.sph(.03, pick(b, ["fruitred", "fruitgreen", "fruityellow"]), (b.r() - .5) * w * .8, .04, (b.r() - .5) * d * .8, 1, 8); return; }
    if (st === "rations") { b.box(w, p.h, d, "cardboard"); for (let i = 0; i < 4; i++) b.cyl(.04, .04, .1, "olive", -w * .3 + i * w * .2, p.h, 0, 12); return; }
  });

  G("curio", (b, p) => {
    const { w, h } = p, st = p.style || "skull";
    if (st === "skull") { P.skull(b, 0, 0, 0, 0, w / .15); return; }
    if (st === "mobile") { P.phone(b, 0, 0, 0, 0); return; }
    if (st === "skeleton") {
      // lying on its back, head to -z
      const L = p.d;
      P.skull(b, 0, 0, -L * .44, PI, 1);
      for (let i = 0; i < 14; i++) b.sph(.018, "bone", 0, .02, -L * .36 + i * L * .02, 1, 6);
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) b.tube([[0, .03, -L * .33 + i * L * .03], [s * .1, .05, -L * .32 + i * L * .03], [s * .14, .02, -L * .3 + i * L * .03]], .007, "bone");
      b.sph(.08, "bone", 0, .03, L * .02, .4, 10).scale.x = 1.8;
      for (const s of [-1, 1]) { b.part(() => { b.rod(.014, L * .2, "bone", 0, 0, 0, "z"); b.rod(.012, L * .19, "bone", s * .03, 0, L * .2, "z"); }, s * .09, .02, L * .14); b.part(() => { b.rod(.012, L * .16, "bone", 0, 0, 0, "z"); b.rod(.01, L * .14, "bone", s * .02, 0, L * .15, "z"); }, s * .2, .02, -L * .2, 0, s * .15, 0); }
      return;
    }
    if (st === "skulls") { for (let i = 0; i < (p.n || 8); i++) P.skull(b, (b.r() - .5) * w * .6, i > 5 ? .12 : 0, (b.r() - .5) * w * .6, b.r() * 6); for (let i = 0; i < 6; i++) P.bone(b, (b.r() - .5) * w * .7, 0, (b.r() - .5) * w * .7, b.r() * 6); return; }
    if (st === "bones") { for (let i = 0; i < (p.n || 7); i++) P.bone(b, (b.r() - .5) * w * .7, 0, (b.r() - .5) * w * .7, b.r() * 6, .7 + b.r() * .6); P.skull(b, 0, 0, 0, b.r() * 6); return; }
    if (st === "crystalball") { b.cyl(w * .3, w * .4, h * .2, "body", 0, 0, 0, 16); b.sph(w * .4, "crystal", 0, h * .2 + w * .38, 0, 1, 24); return; }
    if (st === "globe") { b.cyl(w * .3, w * .35, .03, "body", 0, 0, 0, 16); b.cyl(.012, .012, h * .4, "body", 0, .03, 0, 8); b.sph(w * .4, "ceramicblue", 0, h * .6, 0, 1, 24); b.tor(w * .44, .008, "brass", 0, h * .6, 0, 0, .4); return; }
    if (st === "hourglass") { for (const y of [0, h - .02]) b.cyl(w / 2, w / 2, .02, "body", 0, y, 0, 12); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; b.cyl(.006, .006, h, "body", Math.cos(a) * w * .42, 0, Math.sin(a) * w * .42, 6); } b.lathe([[w * .35, 0], [w * .05, (h - .04) / 2], [w * .35, h - .04], [0, h - .04]], "glass", 0, .02, 0, 16); b.cone(w * .28, h * .2, "sand", 0, .02, 0, 14); return; }
    if (st === "coins") { P.coins(b, 0, 0, 0, w / .3); return; }
    if (st === "goldbars") { for (let i = 0; i < 6; i++) b.ext([[-.08, 0], [.08, 0], [.065, .045], [-.065, .045]], .08, "gold", (i % 3 - 1) * .17, (i > 2 ? .045 : 0), i > 2 ? 0 : 0, 0); return; }
    if (st === "gems") { for (let i = 0; i < 9; i++) P.gem(b, (b.r() - .5) * w * .7, 0, (b.r() - .5) * w * .7, pick(b, ["ruby", "emerald", "sapphire", "amethyst", "crystal"]), .6 + b.r() * .6); return; }
    if (st === "crown") { b.lathe([[w * .45, 0], [w * .48, h * .5], [w * .46, h * .5], [0, 0]], "gold", 0, 0, 0, 24); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.cone(.025, h * .5, "gold", Math.cos(a) * w * .46, h * .45, Math.sin(a) * w * .46, 6); P.gem(b, Math.cos(a) * w * .48, h * .2, Math.sin(a) * w * .48, pick(b, ["ruby", "sapphire", "emerald"]), .5); } return; }
    if (st === "idol") { b.box(w * .7, h * .12, w * .7, "body"); b.cyl(w * .25, w * .32, h * .5, "body", 0, h * .12, 0, 10); b.sph(w * .28, "body", 0, h * .74, 0, 1.1, 12); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.tube([[Math.cos(a) * w * .15, h * .7, Math.sin(a) * w * .15 + w * .15], [Math.cos(a) * w * .3, h * .5, Math.sin(a) * w * .2 + w * .25], [Math.cos(a) * w * .35, h * .25, Math.sin(a) * w * .25 + w * .2]], .012, "body"); } for (const s of [-1, 1]) b.sph(.015, "glowgreen", s * w * .1, h * .8, w * .26, 1, 8); return; }
    if (st === "telescope") { for (let i = 0; i < 3; i++) { const a = i * TAU / 3; strut(b, [Math.cos(a) * w * .4, 0, Math.sin(a) * w * .4], [0, h * .6, 0], .012, "frame" in (p.m || {}) ? "frame" : "walnut"); } b.part(() => { b.cyl(.04, .055, h * .8, "body", 0, 0, 0, 16, 0, 1.1); }, 0, h * .65, 0, 0, 0, 0); return; }
    if (st === "music") { b.box(w, h * .3, w, "body"); b.cone(.03, .1, "brass", 0, h * .3, 0, 12); b.lathe([[0, 0], [.02, .05], [.08, h * .5], [.22, h * .7], [.2, h * .72], [0, .05]], "brass", w * .1, h * .3 + .08, -w * .1, 20).rotation.z = -.6; b.cyl(w * .4, w * .4, .01, "pblack", 0, h * .3, 0, 24); return; }
    if (st === "typewriter") { b.ext([[-w / 2, 0], [w / 2, 0], [w / 2, .08], [w * .3, .14], [-w * .3, .14], [-w / 2, .08]], p.d, "body", 0, 0, 0); b.rod(.025, w * 1.05, "pblack", 0, .17, -p.d * .25); for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) b.cyl(.009, .009, .01, "white", -w * .35 + c * w * .078, .08 - r * .012 + .02, p.d * .1 + r * .035, 8); P.paper(b, 0, .25, -p.d * .3, 0); return; }
    if (st === "radio") { b.rbox(w, h, p.d, .03, "body"); b.box(w * .6, h * .5, .01, "burlap", -w * .1, h * .3, p.d / 2); for (let i = 0; i < 2; i++) b.cyl(.025, .025, .02, "brass", w * .32, h * .35 + i * h * .25, p.d / 2 + .01, 12, H); return; }
    if (st === "phone") { b.box(w, h * .4, p.d, "body"); b.cyl(w * .3, w * .3, .01, "white", 0, h * .4, p.d * .1, 18, -.5); b.part(() => { b.rod(.015, w * .9, "body"); for (const s of [-1, 1]) b.sph(.03, "body", s * w * .4, -.01, 0, .6, 10); }, 0, h * .45, -p.d * .2); return; }
    if (st === "camera") { b.box(w, h * .6, p.d, "body", 0, 0, 0); b.cyl(h * .3, h * .3, p.d * .8, "pblack", 0, h * .3, p.d * .7, 16, H); b.box(w * .3, h * .2, p.d * .6, "body", -w * .2, h * .6, 0); return; }
    if (st === "walkie") { b.rbox(w, h, p.d, .01, "body"); b.cyl(.008, .008, h * .5, "pblack", w * .3, h, 0, 6); b.box(w * .6, h * .2, .002, "screengreen", 0, h * .65, p.d / 2); return; }
    if (st === "doll") { b.cyl(w * .3, w * .4, h * .45, "dress" in (p.m || {}) ? "dress" : "white", 0, 0, 0, 12); b.sph(w * .25, "porcelain", 0, h * .6, 0, 1, 14); b.sph(w * .27, "hair" in (p.m || {}) ? "hair" : "walnut", 0, h * .64, -w * .04, 1, 12); for (const s of [-1, 1]) { b.sph(.008, "coal", s * w * .08, h * .62, w * .23, 1, 6); strut(b, [s * w * .25, h * .42, 0], [s * w * .35, h * .2, w * .1], .012, "porcelain"); } if (b.broken) b.box(.001, h * .15, .001, "coal", w * .05, h * .52, w * .25); return; }
    if (st === "chess") { b.box(w, .03, w, "body"); b.decal("chess", (g, W, Hh) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#2a1e14" : "#e8dcc0"; g.fillRect(i * W / 8, j * Hh / 8, W / 8, Hh / 8); } }, w * .9, w * .9, .031); for (let i = 0; i < 12; i++) b.lathe([[.012, 0], [.006, .02], [.01, .035], [0, .04]], i % 2 ? "pblack" : "pwhite", -w * .4 + (i % 8) * w * .113, .03, (i < 8 ? -1 : 1) * w * .35, 10); return; }
  });

  G("bag", (b, p) => {
    const { w, d, h } = p, st = p.style || "sack";
    if (st === "sack") { b.sph(w / 2, "body", 0, h * .42, 0, h / w * .95, 12).scale.z = d / w; b.cyl(w * .1, w * .18, h * .2, "body", 0, h * .78, 0, 8); b.tor(w * .1, .008, "rope" in M.MATS ? "rope" : "straw", 0, h * .82, 0); return; }
    if (st === "sacks") { for (let i = 0; i < (p.n || 4); i++) { const x = (i % 3 - 1) * w * .32, z = ((i / 3) | 0) * d * .4 - d * .2, y = i > 2 ? h * .35 : 0; b.part(() => { b.sph(.25, "body", 0, .2, 0, .8, 10).scale.x = 1.4; }, x, y, z, 0, b.r() - .5, 0); } return; }
    if (st === "backpack") { b.rbox(w, h, d * .7, .05, "body", 0, 0, -d * .1); b.rbox(w * .8, h * .4, d * .3, .04, "body", 0, h * .1, d * .3); b.rbox(w * 1.02, h * .3, d * .72, .04, "flap" in (p.m || {}) ? "flap" : "body", 0, h * .72, -d * .1); for (const s of [-1, 1]) b.box(.05, h * .7, .015, "strap" in (p.m || {}) ? "strap" : "leatherblack", s * w * .25, h * .15, -d * .45); if (p.roll) b.cyl(.08, .08, w * 1.1, "green", 0, h + .08, -d * .1, 12, 0, H); return; }
    if (st === "suitcase") { b.rbox(w, h, d, .03, "body"); b.box(w + .005, .015, d + .005, "trim" in (p.m || {}) ? "trim" : "brass", 0, h * .5); b.tube([[-.07, h, 0], [-.06, h + .06, 0], [.06, h + .06, 0], [.07, h, 0]], .01, "leatherblack"); for (const s of [-1, 1]) b.box(.03, .025, .01, "brass", s * w * .3, h - .03, d / 2 + .003); return; }
    if (st === "briefcase") { b.rbox(w, h, d, .02, "body"); b.tube([[-.06, h, 0], [-.05, h + .05, 0], [.05, h + .05, 0], [.06, h, 0]], .009, "body"); for (const s of [-1, 1]) b.box(.03, .02, .01, "chrome", s * w * .3, h - .03, d / 2 + .003); if (p.open) b.part(() => { for (let i = 0; i < 4; i++) b.box(w * .4, .03, d * .9, "fabric" in M.MATS ? "fabric" : "paper", (i % 2 - .5) * w * .45, i * .0, 0); }, 0, h, 0); return; }
    if (st === "duffel") { b.part(() => b.cyl(h / 2, h / 2, w, "body", 0, 0, 0, 16, 0, H), 0, h / 2, 0); b.rod(.008, w * .9, "metal" in M.MATS ? "steel" : "steel", 0, h, 0); return; }
    if (st === "basket") { b.lathe([[w * .38, 0], [w * .5, h], [w * .47, h], [0, h * .05]], "body", 0, 0, 0, 18); b.tube([[-w * .45, h, 0], [0, h * 1.6, 0], [w * .45, h, 0]], .012, "body"); if (p.fill) for (let i = 0; i < 6; i++) b.sph(.04, p.fill === "bread" ? "bread" : pick(b, ["fruitred", "fruitgreen", "fruityellow"]), (b.r() - .5) * w * .5, h * .9, (b.r() - .5) * w * .5, p.fill === "bread" ? .6 : 1, 10); return; }
    if (st === "toolbox") { b.box(w, h * .75, d, "body"); b.ext([[-w / 2, 0], [w / 2, 0], [w * .4, h * .15], [-w * .4, h * .15]], d, "body", 0, h * .75, 0); b.rod(.012, w * .5, "pblack", 0, h, 0); return; }
    if (st === "firstaid") { b.rbox(w, h, d, .02, "body"); b.box(w * .1, .002, d * .45, "pred", 0, h, 0); b.box(w * .35, .002, d * .13, "pred", 0, h, 0); return; }
    if (st === "medkit") { b.rbox(w, h, d, .03, "body"); b.box(w * .12, .002, d * .5, "glowgreen", 0, h, 0); b.box(w * .4, .002, d * .14, "glowgreen", 0, h, 0); b.box(w * .8, .01, .02, "glowgreen", 0, h * .5, d / 2); return; }
    if (st === "bin") { b.lathe([[w * .4, 0], [w * .5, h], [w * .48, h], [0, h * .02]], "body", 0, 0, 0, 18); if (b.cond !== "new") for (let i = 0; i < 3; i++) b.sph(.06, "paper", (b.r() - .5) * w * .4, h * .9, (b.r() - .5) * w * .4, .8, 8); return; }
  });

  // weapons and tools lie on the floor (or a table) along their depth: d is their length
  G("weapon", (b, p) => {
    const w = p.style === "shield" ? p.w : p.d, st = p.style || "sword", lie = p.stand ? 0 : 1;
    const flat = fn => b.part(fn, 0, .02, 0, lie ? -H : 0, 0, 0);
    if (st === "sword") return flat(() => { b.box(.05, w * .72, .008, "blade" in (p.m || {}) ? "blade" : "steel", 0, w * .26); b.box(.2, .03, .03, "body", 0, w * .23); b.box(.035, w * .18, .035, "grip" in (p.m || {}) ? "grip" : "leather", 0, w * .05); b.sph(.03, "body", 0, w * .04, 0, 1, 8); });
    if (st === "dagger") return flat(() => { b.box(.035, w * .58, .006, "steel", 0, w * .42); b.box(.1, .02, .025, "body", 0, w * .4); b.box(.03, w * .3, .03, "leather", 0, w * .1); });
    if (st === "axe") return flat(() => { b.box(.035, w, .03, "haft" in (p.m || {}) ? "haft" : "oak", 0, 0); b.ext([[0, 0], [.18, -.08], [.2, .12], [0, .06]], .015, "steel", .015, w * .82, 0); });
    if (st === "spear") return flat(() => { b.cyl(.015, .015, w * .85, "oak", 0, 0, 0, 8); b.cone(.03, w * .15, "steel", 0, w * .85, 0, 4); });
    if (st === "mace") return flat(() => { b.cyl(.018, .018, w * .75, "oak", 0, 0, 0, 8); b.sph(.06, "iron", 0, w * .82, 0, 1, 10); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.cone(.015, .05, "iron", Math.cos(a) * .055, w * .8, Math.sin(a) * .055, 6); } });
    if (st === "bow") return flat(() => { b.tube([[0, 0, 0], [.12, w * .25, 0], [.15, w * .5, 0], [.12, w * .75, 0], [0, w, 0]], .012, "body"); b.cyl(.002, .002, w, "white", 0, 0, 0, 4); });
    if (st === "shield") { b.part(() => { if (p.round) { b.cyl(w / 2, w / 2, .03, "body", 0, 0, 0, 28, H); b.sph(.06, "iron", 0, 0, .02, .5, 12); b.tor(w / 2, .012, "iron", 0, 0, 0, 0, 0); } else { b.ext([[-w / 2, .3 * w], [w / 2, .3 * w], [w / 2, -.1 * w], [0, -.62 * w], [-w / 2, -.1 * w]], .03, "body", 0, 0, 0); b.ext([[-.03, .25 * w], [.03, .25 * w], [.03, -.5 * w], [-.03, -.5 * w]], .035, "trim" in (p.m || {}) ? "trim" : "gold", 0, 0, .005); } }, 0, .02, 0, -H, 0, 0); return; }
    if (st === "rifle") return flat(() => { b.box(.03, w * .55, .025, "steel", 0, w * .45); b.box(.04, w * .4, .05, "body", 0, .05); b.box(.05, w * .14, .06, "body", 0, 0, -.01); b.box(.03, .06, .03, "steel", 0, w * .5, .03); });
    if (st === "pistol") return flat(() => { b.box(.03, .2, .04, "body", 0, .06); b.box(.03, .1, .05, "grip" in (p.m || {}) ? "grip" : "pblack", 0, 0, -.03, .3); });
    if (st === "blaster") return flat(() => { b.rbox(.05, .26, .07, .015, "body", 0, .08); b.rbox(.04, .12, .05, .01, "pblack", 0, 0, -.04); b.box(.052, .1, .01, "glowcyan", 0, .15, .03); b.cyl(.015, .015, .05, "glowcyan", 0, .34, 0, 8); });
    if (st === "rack") { for (const s of [-1, 1]) b.box(.06, w > 1.5 ? 1.6 : 1.4, .08, "body", s * (p.w / 2 - .05)); b.box(p.w, .06, .1, "body", 0, .25); b.box(p.w, .06, .08, "body", 0, 1.2, -.02); const n = Math.max(3, Math.round(p.w / .18)); for (let i = 0; i < n; i++) { const x = -p.w / 2 + .12 + i * (p.w - .24) / (n - 1), k = p.kind || pick(b, ["sword", "spear", "axe", "rifle"]); if (k === "rifle") b.part(() => { b.box(.03, .7, .025, "steel", 0, .55); b.box(.04, .5, .05, "walnut", 0, .05); }, x, .28, .03, .12, 0, 0); else if (k === "spear") b.part(() => { b.cyl(.012, .012, 1.5, "oak", 0, 0, 0, 8); b.cone(.025, .14, "steel", 0, 1.5, 0, 4); }, x, .28, .03, .08, 0, 0); else if (k === "axe") b.part(() => { b.box(.03, .9, .03, "oak"); b.ext([[0, 0], [.15, -.07], [.17, .1], [0, .05]], .012, "steel", .01, .75, 0); }, x, .28, .03, .1, 0, 0); else b.part(() => { b.box(.045, .75, .007, "steel", 0, .2); b.box(.16, .025, .025, "brass", 0, .18); b.box(.03, .16, .03, "leather"); }, x, .3, .04, .1, 0, 0); } }
  });

  G("tool", (b, p) => {
    const st = p.style || "shovel", w = st === "rope" || st === "chain" || st === "lockpicks" ? p.w : p.d;
    const flat = fn => b.part(fn, 0, .02, 0, -H, 0, 0);
    if (st === "shovel") return flat(() => { b.cyl(.016, .016, w * .75, "oak", 0, 0, 0, 8); b.box(.2, w * .25, .01, "steel", 0, w * .75); b.box(.12, .03, .03, "oak", 0, -.02); });
    if (st === "pickaxe") return flat(() => { b.cyl(.018, .018, w, "oak", 0, 0, 0, 8); b.tube([[-.25, w * .92, 0], [0, w, 0], [.25, w * .92, 0]], .018, "iron"); });
    if (st === "crowbar") return flat(() => b.tube([[0, 0, 0], [0, w * .9, 0], [.04, w, 0], [.08, w * .98, 0]], .012, "iron"));
    if (st === "hammer") return flat(() => { b.box(.03, w * .8, .025, "oak"); b.box(.12, .04, .04, "iron", 0, w * .8); });
    if (st === "wrench") return flat(() => { b.box(.03, w * .8, .01, "steel"); b.tor(.03, .012, "steel", 0, w * .82, 0, 0, 0, 4.5); });
    if (st === "saw") return flat(() => { b.ext([[0, 0], [.12, 0], [.12, w * .75], [0, w * .7]], .002, "steel", 0, .1, 0); b.box(.04, .12, .03, "oak", .06, 0); });
    if (st === "rope") { for (let i = 0; i < 5; i++) b.tor(w * (.35 - i * .02), .018, "body", 0, .018 + i * .03, 0); return; }
    if (st === "chain") { for (let i = 0; i < Math.round(w / .05); i++) b.tor(.025, .007, "body", -w / 2 + i * .05, .01, 0, i % 2 ? H : 0, 0, 0); return; }
    if (st === "lockpicks") { b.box(w, .01, .08, "leather"); for (let i = 0; i < 5; i++) b.box(.1, .002, .004, "steel", 0, .01, -.03 + i * .015); return; }
  });
})(ATLAS);
