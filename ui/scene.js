/* Campaign Atlas app: a little animated scene under the line that says what the AI is doing, one for each step of the
   work (the story read, the council's four pens, Tolkien's red pen, five seals, a map drawing itself, rooms appearing,
   a magnifying glass, pages bound, a letter written), with a splash of ink each time something new happens. The user
   asked for it on 20 Oct 2026, as a trial ("I might remove this feature"): it lives in this file and the block of
   app.css marked "the scene", and app.js calls it in three places (AtlasScene.show, AtlasScene.poke). */
(function () {
  "use strict";
  const CAPTIONS = {
    story: ["Reading your story, every word", "Marking what must not change"],
    council: ["Conan Doyle wants another clue", "Christie suspects the quiet one", "Poe insists on the raven", "Lovecraft says it goes deeper", "Four pens, one story"],
    judge: ["Tolkien reads, red pen in hand", "“Fair. Not yet Good.”", "The four mend what he marked"],
    agree: ["Five signatures, five seals", "The story is settled"],
    map: ["Laying out the streets", "Setting the landmarks in their places", "Drawing the coast and the roads"],
    places: ["Drawing the rooms, one by one", "Hiding a clue under the floorboards", "Putting someone behind every door"],
    check: ["Checking every room against the standards", "Looking for a clue that leads nowhere"],
    build: ["Binding it into one page", "Setting the type"],
    report: ["Writing you a letter about it all"],
    finished: ["Ready to play"],
    waiting: ["Waiting for you in the other window"],
    stopped: ["Resting. Carry on wakes it"]
  };
  const PAPER = (x, y, w, h) => `<rect class="sc-paper" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
  const QUILL = `<path class="sc-feather" d="M0 34 L5 25 C12 11 22 2 33 -3 C27 9 18 22 7 30 Z"/><path class="sc-ink" d="M0 34 L-3 39"/>`;
  // A scene told in order, every part at its moment of one ten-second loop: each part gets keyframes of its own, so the
  // whole scene keeps in step and fades out together at the end. T.cls({ how, t, d, ... }) gives the class that plays a
  // part; T.style() the keyframes. A part is drawn (a line inked), faded in, popped up, risen, stamped, shown for a
  // while (until e), popped up for a while, moved from point to point (keys: [t, x, y, opacity, turn]), flipped over
  // (a page, from its left edge), flipped away (a cover), folded (a letter), flipped down (an envelope's flap),
  // unrolled (a scroll), drawn and later struck out of sight (drawhide, until e), or kept until it goes (until).
  function tl(id) {
    let css = "", n = 0;
    const p = t => (t * 10).toFixed(1);
    return {
      cls(it) {
        const k = id + (n++), t = it.t || 0, d = it.d || .8, a = p(t), b = p(t + d), c = p(t + d + .25), r = it.rot || 0, e = it.e != null ? p(it.e) : null, e2 = it.e != null ? p(it.e + .2) : null;
        const at = q => `transform:translate(${q[1]}px,${q[2]}px)${q[4] != null ? ` rotate(${q[4]}deg)` : ""};opacity:${q[3] != null ? q[3] : 1}`;
        const last = it.keys && it.keys[it.keys.length - 1];
        const frames = it.how === "move"
          ? `0%{${at(it.keys[0])}}` + it.keys.map(q => `${p(q[0])}%{${at(q)}}`).join("") + `92%{${at(last)}}97%,100%{${at(last).replace(/opacity:[\d.]+/, "opacity:0")}}`
          : {
            draw: `0%,${a}%{stroke-dashoffset:1;opacity:1}${b}%,92%{stroke-dashoffset:0;opacity:1}97%,100%{stroke-dashoffset:0;opacity:0}`,
            drawhide: `0%,${a}%{stroke-dashoffset:1;opacity:1}${b}%,${e}%{stroke-dashoffset:0;opacity:1}${e2}%,100%{stroke-dashoffset:0;opacity:0}`,
            fade: `0%,${a}%{opacity:0}${b}%,92%{opacity:1}97%,100%{opacity:0}`,
            until: `0%,${e}%{opacity:1}${e2}%,100%{opacity:0}`,
            pop: `0%,${a}%{transform:scale(0);opacity:0}${b}%{transform:scale(1.18);opacity:1}${c}%,92%{transform:scale(1);opacity:1}97%,100%{transform:scale(1);opacity:0}`,
            popshow: `0%,${a}%{transform:scale(0);opacity:0}${b}%{transform:scale(1.15);opacity:1}${c}%,${e}%{transform:scale(1);opacity:1}${e2}%,100%{transform:scale(.7);opacity:0}`,
            rise: `0%,${a}%{transform:scaleY(0);opacity:1}${b}%,92%{transform:scaleY(1);opacity:1}97%,100%{transform:scaleY(1);opacity:0}`,
            stamp: `0%,${a}%{transform:scale(2.6) rotate(${r}deg);opacity:0}${b}%{transform:scale(.94) rotate(${r}deg);opacity:1}${c}%,92%{transform:scale(1) rotate(${r}deg);opacity:1}97%,100%{transform:scale(1) rotate(${r}deg);opacity:0}`,
            show: `0%,${a}%{opacity:0}${b}%,${e}%{opacity:1}${e2}%,100%{opacity:0}`,
            flip: `0%,${a}%{transform:scaleX(1)}${b}%,92%{transform:scaleX(-1);opacity:1}97%,100%{transform:scaleX(-1);opacity:0}`,
            flipaway: `0%,${a}%{transform:scaleX(1);opacity:1}${b}%{transform:scaleX(-1);opacity:1}${c}%,100%{transform:scaleX(-1);opacity:0}`,
            fold: `0%,${a}%{transform:scaleY(1);opacity:1}${b}%{transform:scaleY(.3);opacity:1}${c}%,100%{transform:scaleY(.3);opacity:0}`,
            flipdown: `0%,${a}%{transform:scaleY(1)}${b}%,92%{transform:scaleY(-1);opacity:1}97%,100%{transform:scaleY(-1);opacity:0}`,
            unroll: `0%,${a}%{transform:scaleX(0)}${b}%,92%{transform:scaleX(1);opacity:1}97%,100%{transform:scaleX(1);opacity:0}`
          }[it.how];
        css += `@keyframes ${k}{${frames}}.sc .${k}{animation:${k} 10s ${/draw|move|flip|fold|unroll/.test(it.how) ? "ease-in-out" : "ease-out"} infinite}`;
        return k;
      },
      style: () => `<style>${css}</style>`
    };
  }
  function timeline(id, items) {
    const T = tl(id); let body = "";
    for (const it of items) body += it.svg.replace("{k}", T.cls(it));
    return T.style() + body;
  }
  // a quill and a red pen, their tips at the point they stand on
  const QUILLTIP = `<g transform="translate(0 -34)">${QUILL}</g>`;
  const REDPEN = `<path class="sc-redpen" d="M0 0 L6 -4 L40 -40 L36 -44 L2 -10 Z"/><path class="sc-ink" d="M0 0 L-2 3"/>`;
  const STAR = (x, y, s) => `M${x} ${y - s} L${x + s * .28} ${y - s * .28} L${x + s} ${y} L${x + s * .28} ${y + s * .28} L${x} ${y + s} L${x - s * .28} ${y + s * .28} L${x - s} ${y} L${x - s * .28} ${y - s * .28} Z`;
  // keys for a pen that writes along lines: lifted between them
  const along = (lines, t0, step, dur) => { const k = []; lines.forEach(([x1, y, x2], i) => { const t = t0 + i * step; k.push([t, x1, y], [t + dur, x2, y]); }); return k; };

  // the story: a closed book opens; the quill writes a page, the next, the page turns, it writes on; then it marks in
  // red what must not change
  function storyScene() {
    const T = tl("sct"), L = [[96, 42, 164], [96, 52, 160], [96, 62, 166], [96, 72, 150], [96, 82, 158]], R = L.map(([a, y, b]) => [a + 100, y, b + 100]);
    const lines = (rows, t0, step) => rows.map(([x1, y, x2], i) => `<path class="sc-line2 sc-dash ${T.cls({ how: "draw", t: t0 + i * step, d: step * .85 })}" pathLength="1" d="M${x1} ${y} H${x2}"/>`).join("");
    const left = "M180 96 C150 86 110 86 80 94 V30 C110 22 150 22 180 32 Z", right = "M180 96 C210 86 250 86 280 94 V30 C250 22 210 22 180 32 Z";
    const keys = [[0, 300, 14, 0], [.8, 300, 14, 1], ...along(L, 1, .32, .27), ...along(R, 2.6, .28, .24), [3.7, 292, 20], [5.0, 292, 20], ...along(R, 5.2, .3, .26), [6.8, 198, 66], [7.3, 258, 66], [7.5, 270, 56], [7.8, 270, 74], [8.4, 300, 14]];
    return `<path class="sc-paper ${T.cls({ how: "fade", t: .55, d: .3 })}" d="${left}"/>${lines(L, 1, .32)}<path class="sc-paper" d="${right}"/>${lines(R, 5.2, .3)}
      <path class="sc-mark2 sc-dash ${T.cls({ how: "draw", t: 6.8, d: .5 })}" pathLength="1" d="M198 66 H258"/><path class="sc-mark2 sc-dash ${T.cls({ how: "draw", t: 7.5, d: .3 })}" pathLength="1" d="M266 56 h4 v18 h-4"/>
      <g class="sc-leaf ${T.cls({ how: "flip", t: 3.9, d: .9 })}"><path class="sc-paper" d="${right}"/>${lines(R, 2.6, .28)}</g>
      <g class="sc-leaf ${T.cls({ how: "flipaway", t: .15, d: .6 })}"><path class="sc-bookcover" d="M180 98 C210 88 252 88 284 96 V26 C252 18 210 18 180 28 Z"/><path class="sc-gilt" d="M198 44 H264 M206 54 H256"/></g>
      <g class="${T.cls({ how: "move", keys })}">${QUILLTIP}</g>` + T.style();
  }
  // the council: four writers round a table, each speaking in turn (their emblem in a bubble), a note from each flying
  // into the manuscript, which grows a line at a time
  function councilScene() {
    const T = tl("scn"), W = [
      { n: "Doyle", seat: [118, 62], name: [104, 64, "end"], bub: [80, 40], icon: `<circle class="i" cx="-1.5" cy="-1.5" r="4"/><path class="i" d="M1.5 1.5 L5.5 5.5"/>` },
      { n: "Christie", seat: [180, 30], name: [180, 18, "middle"], bub: [228, 18], icon: `<path class="i fill" d="M-2 -7 h4 v3 l3 4 v7 h-10 v-7 l3 -4 Z"/><rect class="cork" x="-2" y="-9" width="4" height="2.4"/>` },
      { n: "Poe", seat: [242, 62], name: [256, 64, "start"], bub: [284, 38], icon: `<path class="i fill" d="M-7 2 C-5 -3 -1 -5 2 -4 L6 -6 L5 -3 C7 -1 6 3 2 4 L-1 7 L-2 4 C-5 4 -7 3 -7 2 Z"/>` },
      { n: "Lovecraft", seat: [180, 94], name: [180, 112, "middle"], bub: [232, 100], icon: `<path class="i" d="M-5 6 C-6 0 -2 -5 2 -4 C6 -3 6 3 2 3 C0 3 0 1 1 0" stroke-width="2"/><circle class="dot" cx="-4.3" cy="2" r=".8"/><circle class="dot" cx="-3.4" cy="-1.6" r=".8"/>` }
    ];
    let s = `<ellipse class="sc-table ${T.cls({ how: "fade", t: 0, d: .4 })}" cx="180" cy="62" rx="62" ry="34"/><rect class="sc-paper ${T.cls({ how: "pop", t: .3, d: .3 })}" x="162" y="44" width="36" height="38" rx="1.5"/>`;
    W.forEach((w, i) => {
      const t = 1.2 + i * 1.8, [sx, sy] = w.seat, [bx, by] = w.bub, [nx, ny, anchor] = w.name;
      s += `<circle class="sc-seat ${T.cls({ how: "fade", t: .4 + i * .1, d: .3 })}" cx="${sx}" cy="${sy}" r="5"/>`;
      s += `<text class="sc-name2 ${T.cls({ how: "fade", t: .5 + i * .1, d: .3 })}" x="${nx}" y="${ny}" text-anchor="${anchor}">${w.n}</text><text class="sc-name2 on ${T.cls({ how: "show", t, d: .2, e: t + 1.5 })}" x="${nx}" y="${ny}" text-anchor="${anchor}">${w.n}</text>`;
      s += `<g transform="translate(${bx} ${by})"><g class="sc-bubble ${T.cls({ how: "popshow", t: t + .05, d: .25, e: t + 1.5 })}"><path class="b" d="M0 -11 a11 11 0 1 1 -0.01 0 Z"/><path class="b" d="M${(sx - bx) * .38} ${(sy - by) * .38} L${(sx - bx) * .2 - 3} ${(sy - by) * .2} L${(sx - bx) * .2 + 3} ${(sy - by) * .2} Z"/>${w.icon}</g></g>`;
      s += `<g class="${T.cls({ how: "move", keys: [[0, sx, sy, 0], [t + .3, sx, sy, 0], [t + .35, sx, sy, 1], [t + .8, 180, 63, 1], [t + .9, 180, 63, 0]] })}"><rect class="sc-slip" x="-4" y="-3" width="8" height="6"/></g>`;
      [0, 1].forEach(q => { const y = 50 + (i * 2 + q) * 4; s += `<path class="sc-line2 thin sc-dash ${T.cls({ how: "draw", t: t + .8 + q * .3, d: .3 })}" pathLength="1" d="M166 ${y} H${194 - ((i + q) % 3) * 4}"/>`; });
    });
    return s + T.style();
  }
  // the judge: Tolkien's red pen grades each chapter; one line is struck and marked Fair, rewritten by the four, and
  // marked Good; his pipe smokes in the corner
  function judgeScene() {
    const T = tl("scj"), rows = [[24, 0], [31, 1], [38, 1], [45, 1], [58, 0], [65, 1], [72, 1], [79, 1], [92, 0], [99, 1], [106, 1]];
    let s = PAPER(110, 10, 130, 104) + rows.filter(([y]) => y !== 72).map(([y, b]) => `<path class="${b ? "sc-line" : "sc-head"}" d="M124 ${y} H${b ? 214 - (y % 3) * 6 : 170}"/>`).join("");
    const grade = (txt, x, y, t, cls) => `<text class="sc-grade2 ${cls || ""} ${T.cls({ how: "pop", t, d: .25 })}" x="${x}" y="${y}">${txt}</text>`;
    // chapter one: Good. Chapter two: a line struck, Fair; mended; Good. Chapter three: Good.
    s += grade("Good", 262, 32, 1.4) + `<text class="sc-tickr ${T.cls({ how: "pop", t: 1.6, d: .2 })}" x="246" y="33">✓</text>`;
    s += `<path class="sc-line ${T.cls({ how: "until", e: 4.4 })}" d="M124 72 H214"/><path class="sc-strike2 sc-dash ${T.cls({ how: "drawhide", t: 2.3, d: .5, e: 4.4 })}" pathLength="1" d="M122 72 H216"/>`;
    s += `<path class="sc-line fix sc-dash ${T.cls({ how: "draw", t: 4.7, d: .6 })}" pathLength="1" d="M124 72 H204"/>`;
    s += grade("Fair", 262, 70, 3.1, "bad") + `<path class="sc-strike2 sc-dash ${T.cls({ how: "draw", t: 5.6, d: .25 })}" pathLength="1" d="M259 67 H284"/>` + grade("Good", 262, 80, 5.9);
    s += grade("Good", 262, 104, 7.0) + `<text class="sc-tickr ${T.cls({ how: "pop", t: 7.2, d: .2 })}" x="246" y="104">✓</text>`;
    s += `<path class="sc-sign sc-dash ${T.cls({ how: "draw", t: 7.6, d: .6 })}" pathLength="1" d="M200 108 c3 -6 5 4 8 -1 s4 -5 6 1 s3 3 6 -2 s4 0 8 -1"/>`;
    s += `<g class="${T.cls({ how: "move", keys: [[0, 300, 8, 0], [.8, 248, 30, 1], [1.4, 252, 36], [2.2, 122, 74], [2.8, 216, 74], [3.1, 250, 72], [4.0, 286, 40], [5.5, 248, 70], [6.0, 254, 82], [6.8, 250, 104], [7.6, 200, 110], [8.2, 228, 108], [8.6, 300, 8]] })}">${REDPEN}</g>`;
    // the pipe, and its rings of smoke (they keep their own time)
    s += `<g transform="translate(74 94)"><path class="sc-stem" d="M-20 -4 C-12 -4 -6 -2 0 2"/><path class="sc-pipe" d="M-1 -8 H11 V1 C11 8 -1 8 -1 1 Z"/><path class="sc-stem" d="M-1 -8 H11"/>${[0, 1, 2].map(i => `<circle class="sc-ringsmoke" style="--i:${i}" cx="5" cy="-12" r="3"/>`).join("")}</g>`;
    return s + T.style();
  }
  // the agreement: a scroll unrolls, its terms are written, and each of the five signs and seals in turn
  function agreeScene() {
    const T = tl("sca"), X = [84, 132, 180, 228, 276], L = ["Doyle", "Christie", "Poe", "Lovecraft", "Tolkien"];
    let s = `<rect class="sc-paper sc-unroll ${T.cls({ how: "unroll", t: .2, d: .9 })}" x="58" y="14" width="244" height="94"/>`;
    s += `<g class="${T.cls({ how: "move", keys: [[0, 124, 0], [.2, 124, 0], [1.1, 0, 0]] })}"><rect class="sc-roll" x="50" y="10" width="9" height="102" rx="4"/></g><g class="${T.cls({ how: "move", keys: [[0, -124, 0], [.2, -124, 0], [1.1, 0, 0]] })}"><rect class="sc-roll" x="301" y="10" width="9" height="102" rx="4"/></g>`;
    s += `<path class="sc-head sc-dash ${T.cls({ how: "draw", t: 1.2, d: .4 })}" pathLength="1" d="M150 26 H210"/>` + [36, 44, 52].map((y, i) => `<path class="sc-line2 thin sc-dash ${T.cls({ how: "draw", t: 1.5 + i * .25, d: .3 })}" pathLength="1" d="M78 ${y} H${282 - i * 14}"/>`).join("");
    X.forEach((x, i) => {
      const t = 2.6 + i * .95;
      s += `<path class="sc-sign sc-dash ${T.cls({ how: "draw", t, d: .4 })}" pathLength="1" d="M${x - 15} 92 c4 -8 7 6 10 -2 s5 -6 8 2 s6 4 9 -3 s4 -2 5 1"/>`;
      s += `<text class="sc-name2 ${T.cls({ how: "fade", t, d: .3 })}" x="${x}" y="103" text-anchor="middle">${L[i]}</text>`;
      s += `<g transform="translate(${x} 72)"><g class="sc-seal2 ${T.cls({ how: "stamp", t: t + .45, d: .25, rot: (i % 2 ? 8 : -8) })}"><circle r="10"/><circle class="sc-ring" r="7"/><text y="4">${L[i][0]}</text></g></g>`;
    });
    return s + T.style();
  }
  // the build: a printing press stamps four pages; each slides to the stack; a cover closes over them, its title gilt
  function buildScene() {
    const T = tl("scb");
    let s = `<path class="sc-post2" d="M70 100 V22 M130 100 V22"/><rect class="sc-beam" x="62" y="14" width="76" height="9" rx="2"/><rect class="sc-bed" x="66" y="88" width="68" height="6" rx="1"/>`;
    const pk = [[0, 0, 0]];
    [0, 1, 2, 3].forEach(i => {
      const t = .6 + i * 1.5;
      pk.push([t, 0, 0], [t + .25, 0, 34], [t + .45, 0, 34], [t + .7, 0, 0]);
      s += `<g class="${T.cls({ how: "move", keys: [[0, 0, 0, 0], [t + .7, 0, 0, 0], [t + .75, 0, 0, 1], [t + 1.25, 152, 4 - i * 5, 1], [t + 1.3, 152, 4 - i * 5, 0]] })}"><rect class="sc-paper" x="82" y="82" width="36" height="5"/></g>`;
      s += `<rect class="sc-paper ${T.cls({ how: "fade", t: t + 1.25, d: .05 })}" x="234" y="${86 - i * 5}" width="36" height="5"/>`;
    });
    s += `<rect class="sc-paper" x="82" y="82" width="36" height="5"/><g class="${T.cls({ how: "move", keys: pk })}"><rect class="sc-screw" x="97" y="12" width="6" height="36"/><rect class="sc-platen" x="78" y="44" width="44" height="8" rx="1.5"/></g>`;
    s += `<g class="${T.cls({ how: "move", keys: [[0, 0, -24, 0], [6.9, 0, -24, 0], [7.4, 0, 0, 1]] })}"><rect class="sc-bookcover" x="228" y="62" width="48" height="34" rx="3"/><path class="sc-gilt" d="M236 72 H268 M240 80 H264"/></g>`;
    s += [[222, 58], [284, 64], [252, 50], [288, 90]].map(([x, y], i) => `<path class="sc-star2 ${T.cls({ how: "pop", t: 7.6 + i * .15, d: .25 })}" d="${STAR(x, y, 5)}"/>`).join("");
    return s + T.style();
  }
  // the report: the quill writes a letter and signs it; it folds into an envelope, the flap closes, the seal is pressed,
  // and it is sent to you
  function reportScene() {
    const T = tl("scr"), L = [[146, 28, 214], [146, 38, 210], [146, 48, 216], [146, 58, 204], [146, 68, 212]];
    let s = `<g class="sc-fold ${T.cls({ how: "fold", t: 4.8, d: .4 })}"><rect class="sc-paper" x="132" y="14" width="96" height="74" rx="2"/>` +
      L.map(([x1, y, x2], i) => `<path class="sc-line2 thin sc-dash ${T.cls({ how: "draw", t: .5 + i * .65, d: .55 })}" pathLength="1" d="M${x1} ${y} H${x2}"/>`).join("") +
      `<path class="sc-sign sc-dash ${T.cls({ how: "draw", t: 3.9, d: .5 })}" pathLength="1" d="M186 80 c3 -6 5 4 8 -1 s4 -5 6 1 s3 3 6 -2"/></g>`;
    s += `<g class="${T.cls({ how: "move", keys: [[0, 0, 0], [7.2, 0, 0], [8.1, 130, -46, 0]] })}">
      <rect class="sc-envelope ${T.cls({ how: "fade", t: 5.05, d: .2 })}" x="140" y="40" width="80" height="50" rx="2"/><path class="sc-envline ${T.cls({ how: "fade", t: 5.1, d: .2 })}" d="M140 90 L180 64 L220 90"/>
      <g class="sc-flap ${T.cls({ how: "flipdown", t: 5.6, d: .4 })}"><path class="sc-envelope ${T.cls({ how: "fade", t: 5.05, d: .2 })}" d="M140 40 L180 14 L220 40 Z"/></g>
      <g transform="translate(180 64)"><g class="sc-seal2 ${T.cls({ how: "stamp", t: 6.2, d: .25, rot: -6 })}"><circle r="8"/><circle class="sc-ring" r="5.5"/></g></g></g>`;
    s += `<g class="${T.cls({ how: "move", keys: [[0, 300, 10, 0], [.4, 146, 28, 1], ...along(L, .5, .65, .55), [3.9, 186, 80], [4.4, 206, 78], [4.7, 300, 10, 0]] })}">${QUILLTIP}</g>`;
    return s + T.style();
  }
  // finished: the campaign's book, glowing; a d20 tumbles in and comes up 20; gold sparks rise
  function finishedScene() {
    const T = tl("scf");
    let s = `<circle class="sc-halo" cx="180" cy="60" r="54"/><rect class="sc-bookcover" x="146" y="22" width="68" height="80" rx="4"/><rect class="sc-giltbox" x="152" y="28" width="56" height="68" rx="2"/><path class="sc-gilt" d="M162 44 H198 M166 54 H194"/>`;
    s += `<g transform="translate(180 80)"><g class="sc-seal glow"><circle r="8"/><circle class="sc-ring" r="5.5"/></g></g>`;
    s += [[110, 30], [256, 40], [100, 86], [262, 92], [180, 10]].map(([x, y], i) => `<path class="sc-star" style="--i:${i}" d="${STAR(x, y, 7)}"/>`).join("");
    s += [0, 1, 2, 3, 4, 5, 6].map(i => `<rect class="sc-spark" style="--i:${i}" x="${128 + i * 17}" y="104" width="2.6" height="2.6"/>`).join("");
    s += `<g class="sc-roller ${T.cls({ how: "move", keys: [[0, 40, 92, 0, 0], [.6, 40, 92, 1, 0], [1.3, 84, 88, 1, 250], [1.7, 100, 92, 1, 335], [2.0, 106, 92, 1, 360]] })}"><g class="sc-die" transform="scale(1.55)"><path class="f" d="M0 -12 L10.4 -6 L10.4 6 L0 12 L-10.4 6 L-10.4 -6 Z"/><path class="face" d="M0 -9 L-7.6 5 H7.6 Z"/><path class="e" d="M0 -12 V-9 M-7.6 5 L-10.4 6 M7.6 5 L10.4 6 M-7.6 5 L0 12 L7.6 5 M-7.6 5 L-10.4 -6 M7.6 5 L10.4 -6"/><text y="1.6">20</text></g></g>`;
    return s + T.style();
  }
  // a floor plan as Atlas draws one, for the places and the check: graph paper, the outer walls, the inner walls with
  // their doorways, the doors' swings, the room numbers, the furniture, and Atlas's markers (clues, a person, a secret
  // door). put(how, t, d, svg) lays each part; the walls come back for the pencil to follow
  const WALLS = [[[140, 16], [140, 52]], [[140, 62], [140, 104]], [[76, 56], [96, 56]], [[106, 56], [140, 56]], [[212, 16], [212, 34]], [[212, 42], [212, 64]], [[140, 64], [180, 64]], [[190, 64], [284, 64]], [[230, 64], [230, 80]], [[230, 90], [230, 104]]];
  const ROOMS = [[108, 38], [108, 82], [176, 42], [248, 42], [185, 88], [257, 80]];
  function floorPlan(put) {
    let grid = ""; for (let x = 68; x < 296; x += 8) grid += `M${x} 10V110`; for (let y = 10; y < 112; y += 8) grid += `M64 ${y}H296`;
    put("fade", 0, .5, `<path class="sc-grid {k}" d="${grid}"/>`);
    put("draw", .3, 1.3, `<path class="sc-owall sc-dash {k}" pathLength="1" d="M76 16 H284 V104 H76 Z"/>`);
    WALLS.forEach(([a, b], i) => put("draw", 1.8 + i * .28, .22, `<path class="sc-iwall sc-dash {k}" pathLength="1" d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"/>`));
    ["M140 62 H150 A10 10 0 0 0 140 52", "M96 56 V66 A10 10 0 0 0 106 56", "M212 42 H220 A8 8 0 0 0 212 34", "M180 64 V74 A10 10 0 0 0 190 64", "M230 90 H240 A10 10 0 0 0 230 80"].forEach((d, i) =>
      put("draw", 4.7 + i * .14, .3, `<path class="sc-door sc-dash {k}" pathLength="1" d="${d}"/>`));
    ROOMS.forEach(([x, y], i) => put("pop", 5.4 + i * .12, .25, `<text class="sc-rno {k}" x="${x}" y="${y + 2.5}">${i + 1}</text>`));
    [`<circle class="solid" cx="96" cy="28" r="5"/><path d="M96 20.5v-1.5M96 35.5v1.5M88.5 28h-1.5M103.5 28h1.5"/>`, `<path class="solid" d="M82 66h14v24h-14Z"/><path d="M84 68h10v5h-10Z"/>`,
      `<path class="solid" d="M146 19h58v4h-58Z"/><path d="M152 19v4M160 19v4M168 19v4M176 19v4M184 19v4M192 19v4"/>`, `<path d="M262 20h18v38h-18Z M262 25h18M262 30h18M262 35h18M262 40h18M262 45h18M262 50h18"/>`,
      `<path class="solid" d="M150 78h44v8h-44Z"/>`, `<circle class="solid" cx="272" cy="97" r="3.5"/><circle class="solid" cx="279" cy="91" r="3.5"/>`].forEach((f, i) =>
      put("fade", 6.1 + i * .15, .4, `<g class="sc-furn {k}">${f}</g>`));
    put("pop", 7, .3, `<g class="sc-mk {k}"><path class="c" d="M124 39 L129 44 L124 49 L119 44 Z"/><text x="124" y="46">C</text></g>`);
    put("pop", 7.2, .3, `<g class="sc-mk {k}"><circle class="n" cx="166" cy="30" r="5"/><text x="166" y="32">N</text></g>`);
    put("pop", 7.4, .3, `<g class="sc-mk {k}"><path class="c" d="M206 89 L211 94 L206 99 L201 94 Z"/><text x="206" y="96">C</text></g>`);
    put("fade", 7.6, .4, `<path class="sc-secret {k}" d="M284 70 V84"/>`);
  }
  const PENCIL = `<path class="sc-feather" d="M0 0 L3 -7 L27 -31 L31 -27 L7 -3 Z"/><path class="sc-tip" d="M0 0 L3 -7 L7 -3 Z"/><path class="sc-tipend" d="M27 -31 L31 -27 L34 -30 L30 -34 Z"/>`;
  // the places: the plan drawn, the pencil going round each wall as it is drawn
  function placesScene() {
    const items = [], put = (how, t, d, svg) => items.push({ how, t, d, svg });
    floorPlan(put);
    const keys = [[0, 300, 110], [.3, 76, 16], [.65, 284, 16], [.9, 284, 104], [1.3, 76, 104], [1.6, 76, 16]];
    WALLS.forEach(([a, b], i) => { const t = 1.8 + i * .28; keys.push([t, a[0], a[1]], [t + .22, b[0], b[1]]); });
    [[140, 62], [96, 56], [212, 42], [180, 64], [230, 90]].forEach(([x, y], i) => keys.push([4.7 + i * .14 + .2, x + 8, y + 2]));
    [[96, 28], [89, 78], [175, 21], [271, 39], [172, 82], [275, 94], [124, 44], [166, 30], [206, 94], [284, 77]].forEach(([x, y], i) => keys.push([6.1 + i * .17, x, y]));
    keys.push([8, 300, 112]);
    items.push({ how: "move", keys, svg: `<g class="{k}">${PENCIL}</g>` });
    return timeline("scp", items);
  }
  // the check: the plan as it stands, a glass going room by room ticking each; one room shows a fault, put right and
  // ticked; then ALL CLEAR is stamped across it
  function checkScene() {
    let plan = ""; floorPlan((how, t, d, svg) => { plan += svg.replace("{k}", ""); });
    const items = [], order = [0, 2, 3, 5, 4, 1], tick = (x, y, t) => items.push({ how: "stamp", t, d: .2, rot: -8, svg: `<text class="sc-tick2 {k}" x="${x + 13}" y="${y + 3}">✓</text>` });
    const keys = [[0, 320, 20]];
    order.forEach((r, i) => {
      const [x, y] = ROOMS[r], t = .5 + i * 1.1 + (i > 2 ? .6 : 0);
      keys.push([t, x, y], [t + (r === 3 ? 1.5 : .8), x, y]);
      if (r === 3) { items.push({ how: "show", t: t + .3, d: .15, e: t + 1, svg: `<text class="sc-bang {k}" x="${x + 13}" y="${y + 4}">!</text>` }); tick(x, y, t + 1.25); }
      else tick(x, y, t + .4);
    });
    keys.push([7.6, 324, 96]);
    items.push({ how: "move", keys, svg: `<g class="{k}"><circle class="sc-lamp" r="22"/><circle class="sc-glass" r="11"/><path class="sc-ink" d="M8 8 L18 18" stroke-width="3.4"/></g>` });
    items.push({ how: "stamp", t: 7.8, d: .3, rot: -9, svg: `<g class="sc-stamp {k}"><rect x="126" y="46" width="108" height="28" rx="3"/><rect class="in" x="129.5" y="49.5" width="101" height="21" rx="2"/><text x="180" y="64.5">ALL CLEAR</text></g>` });
    return `<defs><radialGradient id="sc-glow"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` + plan + timeline("scc", items);
  }
  // the map of the whole, as an old map is drawn: the coast inked, the sea washed in with its ripples, the mountains,
  // a river down to the sea, roads curving into a town, its houses going up round the keep, a wood, a ship in the bay.
  // The water is in the page's own ink (white on the dark page), not blue: the user found blue out of keeping
  function mapScene() {
    const coast = "M20 100 C52 98 74 106 108 99 C138 93 150 104 176 96 C200 89 212 74 236 71 C260 68 270 54 294 51 C314 49 326 38 340 35";
    const items = [
      { how: "draw", t: 0, d: 1.6, svg: `<path class="sc-coast sc-dash {k}" pathLength="1" d="${coast}"/>` },
      { how: "fade", t: 1, d: 1.2, svg: `<path class="sc-sea {k}" d="${coast} L340 114 L20 114 Z"/>` },
      { how: "draw", t: 1.5, d: 1.2, svg: `<path class="sc-ripple sc-dash {k}" pathLength="1" transform="translate(0 6)" d="${coast}"/>` },
      { how: "draw", t: 1.8, d: 1.2, svg: `<path class="sc-ripple far sc-dash {k}" pathLength="1" transform="translate(0 12)" d="${coast}"/>` }
    ];
    [[34, 32], [50, 26], [66, 33], [84, 24], [100, 31]].forEach(([x, y], i) => items.push({ how: "pop", t: 1.9 + i * .18, d: .4, svg: `<g class="sc-mt {k}"><path class="face" d="M${x - 10} ${y} L${x} ${y - 15} L${x + 10} ${y} Z"/><path class="shade" d="M${x} ${y - 15} L${x + 10} ${y} L${x + 3} ${y} Z"/></g>` }));
    const river = "M72 30 C76 40 98 38 106 48 C114 62 146 66 154 80 C160 90 168 94 174 96";
    items.push({ how: "draw", t: 2.8, d: 1.4, svg: `<path class="sc-river2 sc-dash {k}" pathLength="1" d="${river}"/>` }, { how: "draw", t: 2.8, d: 1.4, svg: `<path class="sc-river2 inner sc-dash {k}" pathLength="1" d="${river}"/>` });
    ["M20 42 C52 38 86 52 126 47 C150 44 168 46 196 44", "M226 6 C224 20 212 30 202 40", "M202 48 C210 56 222 62 234 70", "M208 44 C236 40 266 32 300 30 C318 29 330 26 340 22"].forEach((d, i) =>
      items.push({ how: "draw", t: 3.8 + i * .35, d: 1, svg: `<path class="sc-road2 sc-dash {k}" pathLength="1" d="${d}"/>` }));
    items.push({ how: "pop", t: 5, d: .3, svg: `<path class="sc-bridge {k}" d="M101 43 L111 41 M103 51 L113 49"/>` });
    [[184, 38], [192, 33], [212, 35], [220, 42], [216, 53], [206, 57], [192, 53], [180, 47], [168, 41], [228, 58], [234, 49], [176, 56]].forEach(([x, y], i) =>
      items.push({ how: "rise", t: 5.2 + i * .12, d: .35, svg: `<g class="sc-house2 {k}"><path class="wall" d="M${x - 3.5} ${y} h7 v-5 h-7 Z"/><path class="roof" d="M${x - 4.5} ${y - 5} L${x} ${y - 9} L${x + 4.5} ${y - 5} Z"/></g>` }));
    items.push({ how: "rise", t: 6.7, d: .5, svg: `<g class="sc-keep {k}"><path class="wall" d="M196 48 h9 v-15 h-9 Z"/><path class="roof" d="M195 33 L200.5 23 L206 33 Z"/></g>` });
    [[40, 66], [48, 72], [56, 64], [62, 74], [70, 68], [44, 80], [54, 84], [66, 82], [76, 78], [84, 70], [36, 74], [80, 86]].forEach(([x, y], i) =>
      items.push({ how: "pop", t: 6 + i * .07, d: .3, svg: `<circle class="sc-tree {k}" cx="${x}" cy="${y}" r="4"/>` }));
    items.push({ how: "fade", t: 7.1, d: .6, svg: `<g class="{k}"><g transform="translate(272 88)"><g class="sc-ship2"><path class="hull" d="M-9 0 H9 L6 4 H-6 Z"/><path class="sail" d="M0 0 V-12 L7 -2 Z"/></g></g></g>` });
    items.push({ how: "fade", t: 2.2, d: .8, svg: `<g class="{k}"><g transform="translate(318 94)"><g class="sc-spin"><path class="sc-rose" d="M0 -12 L3 0 L0 12 L-3 0 Z M-12 0 L0 -3 L12 0 L0 3 Z"/><circle class="sc-ink" r="8" fill="none"/></g></g></g>` });
    return timeline("scm", items);
  }
  // where the ink splashes in each scene (the tip of whatever is writing)
  const SCENES = {
    story: [[180, 60], storyScene()],
    council: [[180, 62], councilScene()],
    judge: [[230, 60], judgeScene()],
    agree: [[180, 72], agreeScene()],
    map: [[202, 42], PAPER(20, 6, 320, 108) + mapScene()],
    places: [[180, 60], PAPER(60, 6, 240, 108) + placesScene()],
    check: [[180, 60], PAPER(60, 6, 240, 108) + checkScene()],
    build: [[100, 80], buildScene()],
    report: [[180, 50], reportScene()],
    finished: [[180, 60], `<defs><radialGradient id="sc-halo-g"><stop offset="0" stop-color="#e8c66a" stop-opacity=".32"/><stop offset="1" stop-color="#e8c66a" stop-opacity="0"/></radialGradient></defs>` + finishedScene()],
    // an hourglass: the sand runs down, and when the top is empty the glass turns over and it runs again
    waiting: [[180, 60], `<g class="sc-hg"><path class="sc-sand top" d="M167 30 C168 46 178 52 179.4 57 H180.6 C182 52 192 46 193 30 Z"/><path class="sc-sand bottom" d="M167 90 C168 74 178 68 179.4 63 H180.6 C182 68 192 74 193 90 Z"/><path class="sc-stream" d="M180 57 V90"/>
      <path class="sc-glass2" d="M164 20 C164 48 178 52 178 60 C178 68 164 72 164 100 M196 20 C196 48 182 52 182 60 C182 68 196 72 196 100"/>
      <path class="sc-post" d="M158 20 V100 M202 20 V100"/><rect class="sc-plate" x="154" y="14" width="52" height="6" rx="1.5"/><rect class="sc-plate" x="154" y="100" width="52" height="6" rx="1.5"/></g>`],
    // a snuffed candle: an ember on the wick, and curls of smoke rising from it one after another
    stopped: [[180, 40], `<path class="sc-holder" d="M148 102 H212 L205 110 H155 Z"/><rect class="sc-candle" x="170" y="58" width="20" height="44" rx="2"/><path class="sc-candle" d="M174 58 v9 a2 2 0 0 0 4 0 v-9"/>
      <path class="sc-ink" d="M180 58 V51"/><circle class="sc-ember" cx="180" cy="50.5" r="1.7"/>` +
      [0, 1, 2].map(i => `<path class="sc-wisp" style="--i:${i}" d="M180 47 c-5 -5 5 -9 0 -14 c-5 -5 5 -9 0 -14"/>`).join("")]
  };
  // show the scene for this moment of the work: a step's id, "finished", "waiting" or "stopped"; moving says whether
  // the work goes on (a step whose work has paused is shown stilled). The scene is drawn again only when it changes.
  function show(el, which, moving) {
    if (!el) return;
    const s = SCENES[which] ? which : "story";
    el.classList.toggle("still", !moving && !["waiting", "finished", "stopped"].includes(s));
    if (el._scene === s && el.firstChild) return;
    el._scene = s;
    const [[ax, ay], body] = SCENES[s];
    el.innerHTML = `<svg viewBox="0 0 360 120" role="img" aria-hidden="true" data-ax="${ax}" data-ay="${ay}" class="sc sc-${s}">${body}</svg><p class="sc-cap"></p>`;
    const caps = CAPTIONS[s] || [""], cap = el.querySelector(".sc-cap");
    let n = 0; const next = () => { if (!cap.isConnected) { clearInterval(el._cap); return; } cap.textContent = caps[n++ % caps.length]; cap.classList.remove("in"); void cap.offsetWidth; cap.classList.add("in"); };
    clearInterval(el._cap); next(); if (caps.length > 1) el._cap = setInterval(next, 5200);
  }
  // something new was done: a splash of ink where the pen is
  function poke(el) {
    const svg = el && el.querySelector("svg.sc"); if (!svg || el.classList.contains("still")) return;
    const x = +svg.dataset.ax + (Math.random() - .5) * 30, y = +svg.dataset.ay + (Math.random() - .5) * 16;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "sc-poke"); g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    g.innerHTML = `<circle r="3"/><circle class="o" r="3"/>` + [0, 1, 2, 3, 4].map(i => { const a = i * 1.26 + Math.random(), d = 7 + Math.random() * 6; return `<circle class="d" r="1.3" cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d).toFixed(1)}"/>`; }).join("");
    svg.appendChild(g); setTimeout(() => g.remove(), 900);
  }
  window.AtlasScene = { show, poke };
})();
