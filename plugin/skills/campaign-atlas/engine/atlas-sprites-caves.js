/* 2D drawings of the cave models (atlas-models-x03-caves.js): each model's own top-down drawing, in the map's own hand.
   The user asked (27 Oct 2026) for the cave models to look on the flat map as they are: the pictures taken of them from
   above read poorly (a plinth was a white square, a pick a stick, cobwebs a line). A drawing given here belongs to its
   model (S.plan): the flat map draws it in the model's own box, turned and sized as placed, and the 3D view stands the
   model itself, so the two never differ in place or size, and nothing is in the library twice. Each is drawn from its
   model's parts, where they are and in their colours. The box is u wide and v deep, the model's back at the top. */
(function (A) {
  "use strict";
  const S = A.sprites; if (!S || !S.plan) return;
  const K = S.kit, C = S.C, { rect, circ, dot, ell, line, poly, pline, path, rnd, tone } = K;
  const ROCK = "#6f6a62", GRANITE = "#8a8780", BRONZE = "#a8743a", ICE = "#b8dcea", ICEDARK = "#5f8fa3", ORE = "#5a4a3c";
  const crack = (x1, y1, x2, y2) => line(x1, y1, x2, y2, .5, "rgba(43,34,25,.45)");
  S.plan([
    /* ---- a mine left to the dark */
    ["mine-cart", (u, v, col) => {
      const r = rnd("cart"); let s = "";
      for (const y of [.2, .8]) for (const x of [0, 1]) s += rect(x ? u * .94 : 0, v * (y - .115), u * .06, v * .23, C.iron, .4, `stroke-width=".5"`);   // the wheels, just showing at its sides
      s += rect(0, v * .05, u, v * .9, col || "#b0622e", 1.5, `stroke-width=".7"`) + K.box(u * .04, v * .08, u * .92, v * .05, "rgba(255,200,150,.35)") + rect(u * .18, v * .16, u * .64, v * .68, "#4a3d32", 1, `stroke-width=".5"`);
      for (let i = 0; i < 7; i++) s += circ(u * (.3 + r() * .4), v * (.25 + r() * .5), Math.min(u, v) * (.06 + r() * .04), i % 3 ? "#7a6a58" : C.gold, `stroke-width=".4"`);
      return s + line(u / 2, v * .95, u / 2, v, 1.4, C.iron);
    }],
    ["mine-rails", (u, v) => {
      let s = "";
      for (let k = 0; k < 7; k++) { const y = v * (.05 + k * .15); s += rect(0, y - v * .027, u, v * .054, C.wood, .3, `stroke-width=".6"`) + line(u * .04, y, u * .96, y, .4, "rgba(43,34,25,.3)"); }
      for (const x of [.2, .8]) s += rect(u * (x - .033), 0, u * .066, v, C.iron, 0, `stroke-width=".5"`) + line(u * x, 0, u * x, v, .4, C.steel);
      return s;
    }],
    ["mine-props", (u, v) => rect(0, v * .1, u, v * .8, C.wood, 1) + K.planks(0, v * .1, u, v * .8, 3)
      + [0, 1].map(e => rect(e ? u * .9 : 0, v * .17, u * .1, v * .66, "none", 0, `stroke-dasharray="1.5 1" stroke-width=".7"`)).join("")
      + [.06, .94, .3, .7].map(t => dot(u * t, v / 2, Math.min(u * .02, v * .08), C.iron)).join("")],
    ["pickaxe", (u, v) => rect(u * .43, v * .02, u * .14, v * .9, C.light, .5, `stroke-width=".3"`) + line(u / 2, v * .06, u / 2, v * .86, .25, "rgba(43,34,25,.4)")
      + path(`M0 ${v * .97} Q${u / 2} ${v * .83} ${u} ${v * .97} Q${u / 2} ${v * .9} 0 ${v * .97}Z`, C.steel, .4)
      + rect(u * .42, v * .87, u * .16, v * .08, C.iron, 0, `stroke-width=".3"`)],
    ["ore-pile", (u, v) => {
      const r = rnd("ore"), L = [];
      for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); L.push([u / 2 + Math.cos(a) * d * u * .34, v / 2 + Math.sin(a) * d * v * .32, (u / 1.4) * (.08 + r() * .12), r() < .3]); }
      L.sort((a, b) => a[1] - b[1]);
      return L.map(([x, y, rr, vein]) => circ(x, y, rr, vein ? "#6e5a40" : ORE, `stroke-width=".5"`) + dot(x - rr * .3, y - rr * .3, rr * .3, "rgba(255,255,255,.16)") + (vein ? line(x - rr * .5, y + rr * .1, x + rr * .4, y - rr * .3, .7, C.gold) : "")).join("");
    }],
    /* ---- water falling, steam rising */
    ["waterfall", (u, v) => {
      const r = rnd("falls");
      let s = rect(0, 0, u, v * .25, ROCK, 1) + crack(u * .1, v * .08, u * .35, v * .16) + crack(u * .6, v * .06, u * .85, v * .14);
      s += ell(u / 2, v * .6, u * .45, v * .3, C.dstone) + ell(u / 2, v * .6, u * .38, v * .25, "#2f4a55", `stroke-width=".6"`);
      for (const k of [.16, .26]) s += `<ellipse cx="${u / 2}" cy="${v * .47}" rx="${u * (k + .1)}" ry="${v * k * .6}" fill="none" stroke="#cfe8f0" stroke-width=".5" opacity=".7"/>`;   // rings spreading from where it lands
      s += rect(u * .24, v * .24, u * .52, v * .05, "#cfe8f0", 0, `stroke-width=".6"`);                     // the sheet of falling water
      for (let i = 0; i < 12; i++) s += dot(u * (.3 + r() * .4), v * (.32 + r() * .2), Math.min(u, v) * (.015 + r() * .02), "#f4fbfd");
      return s;
    }],
    ["vent-steam", (u, v) => {
      const r = rnd("vent"), pts = [];
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, k = .8 + r() * .2; pts.push([u / 2 + Math.cos(a) * u / 2 * k, v / 2 + Math.sin(a) * v / 2 * k]); }
      let s = poly(pts, ROCK) + poly(pts.map(([x, y]) => [u / 2 + (x - u / 2) * .4, v / 2 + (y - v / 2) * .4]), C.black, `stroke-width=".6"`);
      for (let i = 0; i < 6; i++) s += dot(u / 2 + Math.cos(i) * u * .3, v / 2 + Math.sin(i) * v * .3, Math.min(u, v) * .04, "#d9b83a");
      for (const [k, o] of [[.44, .22], [.32, .32], [.2, .45]]) s += `<circle cx="${u / 2}" cy="${v / 2}" r="${Math.min(u, v) * k}" fill="#f0f4f6" opacity="${o}"/>`;
      return s;
    }],
    /* ---- ice */
    ["ice-spikes", (u, v) => {
      const r = rnd("icesp"), k = u / 1.6; let s = rect(0, 0, u, v, "#d6ebf3", 1.5, `stroke-width=".6"`);
      for (let i = 0; i < 15; i++) {
        const rr = (.05 + r() * .1) * k, x = rr + r() * (u - rr * 2), y = rr + r() * (v - rr * 2), pts = [];
        for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3 + r() * .5; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
        s += poly(pts, "#a9d3e3", `stroke-width=".5"`) + pts.slice(0, 3).map(p => line(x, y, p[0], p[1], .35, ICEDARK)).join("") + dot(x - rr * .25, y - rr * .25, rr * .25, "#ffffff");
      }
      return s;
    }],
    ["ice-block", (u, v) => rect(u * .03, v * .03, u * .94, v * .94, ICE, Math.min(u, v) * .1)
      + rect(u * .2, v * .2, u * .6, v * .6, "#e3f1f6", Math.min(u, v) * .06, `stroke-width=".5" stroke-dasharray="2 1.5"`)
      + pline([[u * .1, v * .3], [u * .3, v * .45], [u * .28, v * .7]], .5, ICEDARK) + pline([[u * .7, v * .1], [u * .62, v * .3]], .5, ICEDARK)
      + line(u * .12, v * .12, u * .4, v * .12, 1, "#ffffff")],
    /* ---- cobwebs: on a wall, the web spreading from the corner out over the floor in front of it */
    ["cobwebs", u => {
      const R = u * .62, sp = 6, web = "#8f8a80"; let s = "";
      for (let i = 0; i <= sp; i++) { const a = i * Math.PI / 2 / sp; s += line(0, 0, Math.cos(a) * R, Math.sin(a) * R, .35, web); }
      for (let k = 1; k <= 4; k++) { const rr = R * k / 4.4, pts = []; for (let i = 0; i <= sp; i++) { const a = i * Math.PI / 2 / sp; pts.push([Math.cos(a) * rr * (.94 + (i % 2) * .06), Math.sin(a) * rr * (.94 + (i % 2) * .06)]); } s += pline(pts, .35, web); }
      return s + dot(R * .45, R * .3, Math.max(.8, u * .03), C.black);
    }],
    /* ---- a camp's bedroll: rolled up at the top, the pillow at the open end */
    ["bedroll", (u, v, col) => {
      const c = col || "#c8b88a";
      return rect(0, v * .2, u, v * .8, c, Math.min(u, v) * .08) + line(u * .08, v * .25, u * .08, v * .95, .4, "rgba(43,34,25,.3)") + line(u * .92, v * .25, u * .92, v * .95, .4, "rgba(43,34,25,.3)")
        + rect(0, v * .065, u, v * .11, tone(c, .85), v * .05) + line(0, v * .12, u, v * .12, .5, "rgba(43,34,25,.4)")
        + [.2, .8].map(t => rect(u * (t - .02), v * .06, u * .04, v * .12, "#6a4a2a", 0, `stroke-width=".4"`)).join("")
        + rect(u * .25, v * .76, u * .5, v * .13, C.linen, v * .04);
    }],
    /* ---- the furniture of puzzles */
    ["plinth", (u, v) => rect(0, 0, u, v, "#d8d0bc") + rect(u * .07, v * .07, u * .86, v * .86, "none", 0, `stroke-width=".4" stroke="rgba(43,34,25,.35)"`)
      + rect(u * .225, v * .225, u * .55, v * .55, C.black, 0, `stroke-width=".6"`) + crack(u * .1, v * .85, u * .3, v * .93)
      + [.38, .5, .62].map(t => line(u * t, v * .96, u * t, v, .8, C.gold)).join("")],
    ["scale-great", (u, v) => {
      const k = u / 1.6, rp = .26 * k, cy = v / 2;
      let s = rect(u / 2 - .25 * k, cy - .25 * k, .5 * k, .5 * k, GRANITE, .5) + rect(u / 2 - .58 * k, cy - .03 * k, 1.16 * k, .06 * k, BRONZE, 0, `stroke-width=".5"`) + circ(u / 2, cy, .07 * k, BRONZE, `stroke-width=".5"`);
      for (const x of [u / 2 - .53 * k, u / 2 + .53 * k]) {
        s += circ(x, cy, rp, BRONZE) + circ(x, cy, rp * .78, "#c8945a", `stroke-width=".4"`);
        for (let j = 0; j < 3; j++) { const a = j * Math.PI * 2 / 3; s += line(x, cy, x + Math.cos(a) * rp * .78, cy + Math.sin(a) * rp * .78, .4, C.iron); }
      }
      return s;
    }],
    ["door-stone", (u, v) => rect(0, 0, u, v * .5, GRANITE) + crack(u * .08, v * .18, u * .28, v * .32) + crack(u * .7, v * .1, u * .9, v * .3)
      + rect(u * .11, v * .44, u * .78, v * .32, "#4a4650")
      + line(u * .28, v * .8, u * .72, v * .8, 1.2, "#a07af0") + [.28, .37, .46, .54, .63, .72].map(t => dot(u * t, v * .8, Math.max(.6, v * .05), "#c8b0ff")).join("")],
    ["mirror-stand", (u, v) => {
      const k = u / .8, cx = u / 2, cy = v / 2, e = .2 * k;
      return circ(cx, cy, .2 * k, GRANITE) + [u * .08, u * .92].map(x => rect(x - .025 * k, cy - .025 * k, .05 * k, .05 * k, BRONZE, 0, `stroke-width=".4"`)).join("")
        + line(cx - e, cy + e, cx + e, cy - e, Math.max(1.6, .05 * k), BRONZE) + line(cx - e * .9 + .5, cy + e * .9 + .5, cx + e * .9 + .5, cy - e * .9 + .5, Math.max(.8, .02 * k), "#e8f4f8");
    }],
    ["rune-floor", (u, v) => {
      const cx = u / 2, cy = v / 2, R = u * .38, P = [0, 1, 2, 3, 4].map(i => [cx + Math.cos(i * Math.PI * 2 / 5) * u * .36, cy + Math.sin(i * Math.PI * 2 / 5) * v * .36]);
      return rect(0, 0, u, v, "#4f545c") + line(u * .08, v * .9, u * .3, v * .82, .5, "rgba(0,0,0,.35)")
        + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ff4a3a" stroke-width="${Math.max(2, u * .05)}" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ff6a4a" stroke-width=".8"/>`
        + pline([0, 2, 4, 1, 3, 0].map(i => P[i]), .8, "#ff6a4a");
    }],
    ["offering-bowl", (u, v) => {
      const cx = u / 2, cy = v / 2, R = Math.min(u, v) / 2 * .98;
      return circ(cx, cy, R, BRONZE) + circ(cx, cy, R * .86, "#7a5228", `stroke-width=".5"`) + dot(cx, cy, R * .45, "#5e3e1e")
        + path(`M${cx - R * .6} ${cy - R * .55} A${R * .82} ${R * .82} 0 0 1 ${cx + R * .5} ${cy - R * .65}`, "none", .8, "rgba(255,230,180,.6)");
    }]
  ]);
})(ATLAS);
