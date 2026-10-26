/* More models, part x03: what the generated caves, their riddles and their traps call for (atlas-cave.js,
   atlas-puzzles.js, atlas-traps.js, 21 Oct 2026) and the library lacked: an abandoned mine's cart, rails, timber props,
   pick and ore; a waterfall and a steam vent; ice; cobwebs; and the furniture of puzzles (a plinth for a statue, a
   great scale, a stone door, a mirror that turns on its stand, a rune slab, an offering bowl) and a bedroll for a
   camp. None of them a copy of a model the library had. Same rules as atlas-models-lib.js: metres, standing on
   y = 0, front to +z. */
(function (A) {
  "use strict";
  const M = A.models; if (!M) return;
  const G = M.gen, PI = Math.PI, H = PI / 2, TAU = PI * 2;
  Object.assign(M.MATS, { falls: ["glass", 0xcfe8f0, .1, 0, "", 0x5a8fa0, .55], foam: ["glass", 0xf4fbfd, .6, 0, "", 0, .75], steam: ["glass", 0xf0f4f6, .9, 0, "", 0, .3], iceblue: ["glass", 0xb8dcea, .15, 0, "", 0x2a5060, .7], ore: ["stone", 0x5a4a3c, .9, 0, "stone"], orevein: ["metal", 0xc89a3a, .4, .6] });

  /* ---- a mine left to the dark */
  G("xmine", (b, p) => {
    const { w, d, h } = p, st = p.style || "cart";
    if (st === "cart") {
      for (const s of [-1, 1]) for (const t of [-1, 1]) b.cyl(.14, .14, .05, "wheel" in (p.m || {}) ? "wheel" : "iron", s * (w / 2 - .03), .14, t * d * .3, 14, 0, H);
      b.ext([[-w / 2 + .05, .2], [w / 2 - .05, .2], [w / 2, h], [-w / 2, h]], d * .9, "body", 0, 0, 0);
      b.box(w * .92, .04, d * .82, "base", 0, h - .05); for (let i = 0; i < 5; i++) b.sph(.08 + b.r() * .06, "ore", (b.r() - .5) * w * .6, h - .02, (b.r() - .5) * d * .5, .7, 7);
      b.box(.06, .06, .14, "iron", 0, .26, d / 2 - .07); return;
    }
    if (st === "rails") { for (const s of [-1, 1]) b.box(.06, .08, d, "iron", s * w * .3, .04); for (let z = -d / 2 + .15; z < d / 2; z += .45) b.box(w, .06, .16, "base", 0, 0, z); return; }
    if (st === "props") { for (const s of [-1, 1]) b.box(.2, h, .2, "body", s * (w / 2 - .12), 0, 0, 0, 0, s * .04); b.box(w, .22, .24, "body", 0, h - .22); for (const s of [-1, 1]) b.box(.08, .5, .08, "body", s * (w / 2 - .32), h - .6, 0, 0, 0, s * .7); return; }
    // (a pick lies on the ground: its handle runs the depth of its box, the head at the front)
    if (st === "pick") { const L = d - .04; b.part(() => { b.cyl(.02, .025, L, "handle" in (p.m || {}) ? "handle" : "oak", 0, 0, 0, 8); b.part(() => { b.cone(.025, w * .5, "iron", 0, 0, 0, 6); }, 0, L - .03, 0, 0, 0, -H); b.part(() => { b.cone(.025, w * .5, "iron", 0, 0, 0, 6); }, 0, L - .03, 0, 0, 0, H); }, 0, .03, -L / 2, H * .92, 0, 0); return; }
    if (st === "ore") { for (let i = 0; i < 14; i++) { const r = .08 + b.r() * .14; b.sph(r, b.r() < .3 ? "orevein" : "ore", (b.r() - .5) * (w - r) * .8, r * .4 + b.r() * h * .3, (b.r() - .5) * (d - r) * .8, .7, 7); } return; }
  });
  /* ---- water falling, steam rising */
  G("xwater", (b, p) => {
    const { w, d, h } = p, st = p.style || "falls";
    if (st === "falls") {
      // the rock it falls from, the sheet of water, the churned pool below
      b.ext([[-w / 2 + .1, 0], [w / 2 - .1, 0], [w / 2, h], [-w / 2, h]], .4, "rock" in (p.m || {}) ? "rock" : "cavestone", 0, 0, -d / 2 + .2);
      b.ext([[-w * .32, 0], [w * .32, 0], [w * .26, h * .96], [-w * .26, h * .96]], .05, "falls", 0, 0, -d / 2 + .42);
      for (let i = 0; i < 6; i++) b.box(.03, h * (.5 + b.r() * .4), .02, "foam", (b.r() - .5) * w * .45, h * .1, -d / 2 + .48);
      const rim = []; for (let i = 0; i < 16; i++) { const a = i * TAU / 16; rim.push([Math.cos(a) * w * .45, Math.sin(a) * d * .3 + d * .1]); }
      b.slab(rim, .05, "cavestone"); b.slab(rim.map(([x, z]) => [x * .85, (z - d * .1) * .85 + d * .1]), .06, "darkwater");
      for (let i = 0; i < 8; i++) b.sph(.06 + b.r() * .08, "foam", (b.r() - .5) * w * .5, .05, -d / 2 + .55 + b.r() * .3, .5, 7);
      return;
    }
    if (st === "vent") {
      const rim = []; for (let i = 0; i < 12; i++) { const a = i * TAU / 12, k = .8 + b.r() * .2; rim.push([Math.cos(a) * w / 2 * k, Math.sin(a) * d / 2 * k]); }
      b.slab(rim, .1, "cavestone"); b.slab(rim.map(([x, z]) => [x * .4, z * .4]), .11, "coal");
      for (let i = 0; i < 9; i++) { const y = .12 + i * (h - .5) / 9; b.sph(.08 + i * .03, "steam", (b.r() - .5) * .03 * i, y, (b.r() - .5) * .03 * i, .8, 8); }
      for (let i = 0; i < 6; i++) b.box(.05, .02, .05, "sulphur" in (p.m || {}) ? "sulphur" : "mustard", Math.cos(i) * w * .3, .1, Math.sin(i) * d * .3);
    }
  });
  /* ---- ice */
  G("xice", (b, p) => {
    const { w, d, h } = p, st = p.style || "spikes";
    if (st === "spikes") { b.box(w, .04, d, "iceblue"); const n = Math.round(w * d * 5) + 4; for (let i = 0; i < n; i++) { const r = .05 + b.r() * .1; b.cone(r, .15 + b.r() * (h - .25), "iceblue", (b.r() - .5) * (w - r), .04, (b.r() - .5) * (d - r), 6); } return; }
    if (st === "block") { b.rbox(w - .07, h, d - .07, .06, "iceblue"); b.rbox(w * .6, h * .5, d * .6, .04, "frosted", 0, h * .2, 0); }
  });
  /* ---- cobwebs, in a corner or across a passage */
  G("xweb", (b, p) => {
    const { w, h } = p, cx = -w / 2, cy = h, spokes = 7;
    for (let i = 0; i <= spokes; i++) { const a = -i * H / spokes, len = Math.min(w, h) * (.85 + b.r() * .15); b.tube([[cx, cy, 0], [cx + Math.cos(a) * len, cy + Math.sin(a) * len, 0]], .004, "web"); }
    for (let k = 1; k <= 5; k++) { const r = Math.min(w, h) * k / 6, pts = []; for (let i = 0; i <= spokes; i++) { const a = -i * H / spokes; pts.push([cx + Math.cos(a) * r * (.95 + b.r() * .1), cy + Math.sin(a) * r * (.95 + b.r() * .1), 0]); } b.tube(pts, .003, "web"); }
    b.sph(.05, "black", cx + w * .3, cy - h * .35, .01, .8, 8);
  });
  /* ---- the furniture of puzzles */
  G("xpuzzle", (b, p) => {
    const { w, d, h } = p, st = p.style || "plinth";
    if (st === "plinth") { b.box(w, .12, d, "body"); b.box(w * .8, h - .24, d * .8, "body", 0, .12); b.box(w, .12, d, "body", 0, h - .12); b.box(w * .55, .02, d * .55, "hole" in (p.m || {}) ? "hole" : "coal", 0, h - .005); for (let i = 0; i < 3; i++) b.box(w * .5, .02, .01, "rune" in (p.m || {}) ? "rune" : "gold", 0, h * .4 + i * .1, d * .4 + .006); return; }
    if (st === "scale") {
      b.box(.5, .1, .5, "base"); b.cyl(.05, .07, h, "body", 0, .1, 0, 10); b.box(w - .44, .06, .06, "body", 0, h + .05, 0, 0, 0, .04);
      for (const s of [-1, 1]) { const x = s * (w / 2 - .27), y = h + .05 + s * -.02; for (let k = 0; k < 3; k++) { const a = k * TAU / 3; b.tube([[x, y, 0], [x + Math.cos(a) * .2, y - .55, Math.sin(a) * .2]], .006, "chain" in (p.m || {}) ? "chain" : "iron"); } b.lathe([[0, 0], [.24, .02], [.26, .08]], "body", x, y - .6, 0, 16); }
      return;
    }
    if (st === "door") {
      b.box(w, h, .25, "frame" in (p.m || {}) ? "frame" : "granite", 0, 0, -d / 2 + .125); b.box(w * .78, h * .9, .16, "body", 0, 0, -d / 2 + .3);
      b.tor(w * .22, .018, "rune" in (p.m || {}) ? "rune" : "glowviolet", 0, h * .5, -d / 2 + .39, 0); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.box(.06, .06, .02, "rune" in (p.m || {}) ? "rune" : "glowviolet", Math.cos(a) * w * .22, h * .5 + Math.sin(a) * w * .22, -d / 2 + .39); }
      return;
    }
    if (st === "mirror") { b.cyl(.16, .2, .1, "base", 0, 0, 0, 12); for (const s of [-1, 1]) b.box(.05, h * .8, .05, "body", s * w * .42, .1); b.part(() => { b.cyl(w * .38, w * .38, .03, "body", 0, 0, 0, 20, H); b.cyl(w * .34, w * .34, .032, "glass" in (p.m || {}) ? "glass" : "chrome", 0, 0, .002, 20, H); }, 0, h * .55, 0, 0, PI / 4, 0); return; }
    if (st === "rune") { b.box(w, .06, d, "body"); const pts = []; for (let i = 0; i <= 24; i++) { const a = i * TAU / 24; pts.push([Math.cos(a) * w * .38, .065, Math.sin(a) * d * .38]); } b.tube(pts, .012, "rune" in (p.m || {}) ? "rune" : "glowred"); for (let i = 0; i < 5; i++) { const a = i * TAU / 5, a2 = (i + 2) * TAU / 5; b.tube([[Math.cos(a) * w * .36, .066, Math.sin(a) * d * .36], [Math.cos(a2) * w * .36, .066, Math.sin(a2) * d * .36]], .01, "rune" in (p.m || {}) ? "rune" : "glowred"); } return; }
    if (st === "bowl") { b.lathe([[.15, 0], [.1, .1], [.08, h - .15], [.14, h - .1]], "base", 0, 0, 0, 12); b.lathe([[0, h - .1], [w * .45, h - .08], [w * .5, h + .02], [w * .46, h + .02], [0, h - .05]], "body", 0, 0, 0, 18); }
  });
  /* ---- a camp's bedroll */
  G("xbedroll", (b, p) => {
    const { w, d } = p;
    b.rbox(w, .06, d * .8, .03, "body", 0, 0, d * .1); b.cyl(.1, .1, w, "body", 0, .1, -d * .38, 12, 0, H); b.rbox(w * .5, .08, .25, .04, "pillow" in (p.m || {}) ? "pillow" : "linen", 0, .06, d * .32);
    for (const s of [-1, 1]) b.cyl(.105, .105, .02, "strap" in (p.m || {}) ? "strap" : "leather", s * w * .3, .1, -d * .38, 12, 0, H);
  });

  const F = "fantasy", MD = "medieval", HI = "historical", MO = "modern", HO = "horror", PA = "postapoc", SF = "scifi";
  const DC = "Dungeons & caves";
  M.add(DC, "Mines", [F, MD, HI, MO, HO, PA], [
    ["mine-cart", "Mine cart with ore", "xmine", { w: .8, d: 1.2, h: .8, style: "cart", m: { body: "rust", base: "oak" } }, { e: "both", tags: ["mine", "cart", "ore", "rails"] }],
    ["mine-rails", "Mine rails", "xmine", { w: .9, d: 3, h: .1, style: "rails", m: { base: "oak" } }, { e: "both", tags: ["mine", "rails", "track"] }],
    ["mine-props", "Timber pit props", "xmine", { w: 2, d: .3, h: 2.3, style: "props", m: { body: "oak" } }, { e: "both", tags: ["mine", "timber", "support", "tunnel"] }],
    ["pickaxe", "Pickaxe", "xmine", { w: .5, d: .9, h: .16, style: "pick", m: { handle: "oak" } }, { e: "both", tags: ["mine", "tool", "pick"] }],
    ["ore-pile", "Heap of ore", "xmine", { w: 1.4, d: 1.1, h: .6, style: "ore" }, { e: "both", tags: ["mine", "ore", "rocks", "metal"] }]
  ]);
  M.add(DC, "Caves", [F, MD, HI, MO, HO, PA, SF], [
    ["waterfall", "Underground waterfall", "xwater", { w: 1.6, d: 1.6, h: 3, style: "falls", m: { rock: "cavestone" } }, { e: "both", tags: ["water", "falls", "cave"] }],
    ["vent-steam", "Steam vent", "xwater", { w: .9, d: .9, h: 1.6, style: "vent" }, { e: "both", g: [F, HO, SF, PA], tags: ["steam", "volcanic", "vent", "hazard"] }],
    ["ice-spikes", "Ice spikes", "xice", { w: 1.6, d: 1.4, h: 1.1, style: "spikes" }, { e: "both", tags: ["ice", "cold", "cave"] }],
    ["ice-block", "Block of old ice", "xice", { w: 1.1, d: .9, h: .9, style: "block" }, { e: "both", tags: ["ice", "cold", "frozen"] }],
    ["cobwebs", "Cobwebs in a corner", "xweb", { w: 1.2, d: .05, h: 1.2 }, { mount: "wall", e: "both", g: [F, MD, HI, MO, HO, PA], tags: ["webs", "spider", "abandoned", "dust"] }],
    ["bedroll", "Bedroll", "xbedroll", { w: .75, d: 1.9, h: .2, m: { body: "canvas" } }, { e: "both", g: [F, MD, HI, MO, HO, PA, SF], tags: ["camp", "sleep", "bed"] }]
  ]);
  M.add(DC, "Puzzles", [F, MD, HI, HO, PA], [
    ["plinth", "Plinth for a statue", "xpuzzle", { w: .7, d: .7, h: 1, style: "plinth", m: { body: "limestone" } }, { tags: ["puzzle", "pedestal", "statue"] }],
    ["scale-great", "Great scale", "xpuzzle", { w: 1.6, d: .6, h: 1.4, style: "scale", m: { body: "bronze", base: "granite" } }, { tags: ["puzzle", "balance", "weights"] }],
    ["door-stone", "Sealed stone door", "xpuzzle", { w: 1.6, d: .5, h: 2.4, style: "door", m: { body: "darkstone" } }, { tags: ["door", "seal", "puzzle", "rune"] }],
    ["mirror-stand", "Mirror on a turning stand", "xpuzzle", { w: .8, d: .4, h: 1.5, style: "mirror", m: { body: "bronze", base: "granite" } }, { tags: ["mirror", "light", "puzzle"] }],
    ["rune-floor", "Rune slab", "xpuzzle", { w: 1.4, d: 1.4, h: .07, style: "rune", m: { body: "slate" } }, { tags: ["rune", "glyph", "trap", "magic", "seal"] }],
    ["offering-bowl", "Offering bowl", "xpuzzle", { w: .6, d: .6, h: 1, style: "bowl", m: { body: "bronze", base: "granite" } }, { tags: ["offering", "altar", "puzzle", "shrine"] }]
  ]);
  M.kit({ id: "mine-gallery", n: "Abandoned mine gallery", d: "Timber props, rails, a cart of ore, a pick left behind and a heap of spoil.", g: [F, MD, HI, MO, HO, PA],
    set: [["mine-rails", 0, 0, 0], ["mine-props", 0, -1.2, 0], ["mine-props", 0, 1.2, 0], ["mine-cart", 0, .2, 0], ["pickaxe", 1.2, -.6, 0], ["ore-pile", -1.4, .8, 0]],
    ids: ["mine-rails", "mine-props", "mine-cart", "pickaxe", "ore-pile"] });
  M.kit({ id: "puzzle-hall", n: "Puzzle hall", d: "Plinths for the statues, a great scale, a mirror on its stand, a rune slab and the sealed door they open.", g: [F, MD, HI, HO],
    set: [["door-stone", 0, -2, 0], ["plinth", -1.6, -.4, 0], ["plinth", -.6, -.4, 0], ["plinth", .4, -.4, 0], ["scale-great", 1.8, .4, 270], ["mirror-stand", -1.6, 1.2, 0], ["rune-floor", .2, 1.2, 0]],
    ids: ["door-stone", "plinth", "scale-great", "mirror-stand", "rune-floor"] });
})(ATLAS);
