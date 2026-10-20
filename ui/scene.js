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
  // A scene told in order, every part at its moment of one ten-second loop: each part gets keyframes of its own (drawn,
  // faded in, popped up, risen, stamped, shown for a while, or moved from point to point), so the whole scene keeps in
  // step and fades out together at the end.
  function timeline(id, items) {
    let css = "", body = "";
    const p = t => (t * 10).toFixed(1);
    items.forEach((it, n) => {
      const k = id + n, d = it.d || .8, a = p(it.t || 0), b = p((it.t || 0) + d), c = p((it.t || 0) + d + .25), r = it.rot || 0;
      const at = ([, x, y]) => `transform:translate(${x}px,${y}px)`;
      const frames = it.how === "move"
        ? `0%{${at(it.keys[0])}}` + it.keys.map(q => `${p(q[0])}%{${at(q)}}`).join("") + `92%{${at(it.keys[it.keys.length - 1])};opacity:1}97%,100%{${at(it.keys[it.keys.length - 1])};opacity:0}`
        : {
          draw: `0%,${a}%{stroke-dashoffset:1;opacity:1}${b}%,92%{stroke-dashoffset:0;opacity:1}97%,100%{stroke-dashoffset:0;opacity:0}`,
          fade: `0%,${a}%{opacity:0}${b}%,92%{opacity:1}97%,100%{opacity:0}`,
          pop: `0%,${a}%{transform:scale(0);opacity:0}${b}%{transform:scale(1.18);opacity:1}${c}%,92%{transform:scale(1);opacity:1}97%,100%{transform:scale(1);opacity:0}`,
          rise: `0%,${a}%{transform:scaleY(0);opacity:1}${b}%,92%{transform:scaleY(1);opacity:1}97%,100%{transform:scaleY(1);opacity:0}`,
          stamp: `0%,${a}%{transform:scale(2.6) rotate(${r}deg);opacity:0}${b}%{transform:scale(.94) rotate(${r}deg);opacity:1}${c}%,92%{transform:scale(1) rotate(${r}deg);opacity:1}97%,100%{transform:scale(1) rotate(${r}deg);opacity:0}`,
          show: `0%,${a}%{opacity:0}${b}%,${p(it.e)}%{opacity:1}${p(it.e + .2)}%,100%{opacity:0}`
        }[it.how];
      css += `@keyframes ${k}{${frames}}.sc .${k}{animation:${k} 10s ${it.how === "draw" || it.how === "move" ? "ease-in-out" : "ease-out"} infinite}`;
      body += it.svg.replace("{k}", k);
    });
    return `<style>${css}</style>` + body;
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
    story: [[180, 60], `<path class="sc-paper" d="M180 94 C150 84 110 84 80 92 V28 C110 20 150 20 180 30 Z"/><path class="sc-paper" d="M180 94 C210 84 250 84 280 92 V28 C250 20 210 20 180 30 Z"/>
      <path class="sc-line" d="M96 40 H164 M96 50 H160 M96 60 H166 M96 70 H150 M196 40 H264 M196 50 H258 M196 60 H262 M196 70 H240"/>
      <g class="sc-turn"><path class="sc-paper" d="M180 94 C210 84 250 84 280 92 V28 C250 20 210 20 180 30 Z"/><path class="sc-line" d="M196 40 H262 M196 50 H264 M196 60 H256 M196 70 H262 M196 80 H236"/></g>`],
    council: [[180, 74], PAPER(26, 58, 308, 44) + ["Doyle", "Christie", "Poe", "Lovecraft"].map((n, i) => {
      const x = 44 + i * 76;
      return `<path class="sc-write" style="--i:${i}" pathLength="1" d="M${x} 76 q7 -5 14 0 t14 0 t14 0 t14 0"/><path class="sc-write" style="--i:${i}" pathLength="1" d="M${x} 88 q7 -5 14 0 t14 0 t14 0"/>
        <g transform="translate(${x} 40)"><g class="sc-quill" style="--i:${i}">${QUILL}</g></g><text class="sc-name" x="${x + 26}" y="116">${n}</text>`;
    }).join("")],
    judge: [[230, 60], PAPER(110, 8, 140, 104) + `<path class="sc-line" d="M126 26 H228 M126 38 H224 M126 50 H230 M126 62 H218 M126 74 H228 M126 86 H210 M126 98 H222"/>
      <path class="sc-strike" pathLength="1" d="M126 62 H218"/>` + [[26, "✓"], [50, "✓"], [62, "✗"], [86, "✓"]].map((m, i) => `<text class="sc-mark" style="--i:${i}" x="236" y="${m[0] + 4}">${m[1]}</text>`).join("") +
      `<g class="sc-grade"><circle cx="205" cy="102" r="0" /><text x="205" y="106">Good</text></g>
      <g transform="translate(150 20)"><g class="sc-pen"><path class="sc-redpen" d="M0 0 L6 -4 L40 -40 L36 -44 L2 -10 Z"/><path class="sc-ink" d="M0 0 L-2 3"/></g></g>`],
    agree: [[180, 78], PAPER(36, 12, 288, 96) + `<path class="sc-line" d="M60 30 H300 M60 42 H290 M60 54 H296"/>` +
      ["D", "C", "P", "L", "T"].map((l, i) => `<g transform="translate(${84 + i * 48} 82)"><g class="sc-seal" style="--i:${i}"><circle r="14"/><circle class="sc-ring" r="10"/><text y="4.5">${l}</text></g></g>`).join("")],
    map: [[202, 42], PAPER(20, 6, 320, 108) + mapScene()],
    places: [[180, 60], PAPER(60, 6, 240, 108) + placesScene()],
    check: [[180, 60], PAPER(60, 6, 240, 108) + checkScene()],
    build: [[180, 40], Array.from({ length: 5 }, (_, i) => `<rect class="sc-paper sc-sheet" style="--i:${i}" x="130" y="${86 - i * 5}" width="100" height="14" rx="2"/>`).join("") +
      `<rect class="sc-cover" x="126" y="58" width="108" height="46" rx="3"/><path class="sc-ribbon" d="M206 58 V112 L212 106 L218 112 V58 Z"/>`],
    report: [[230, 54], PAPER(100, 12, 160, 96) + ["M118 32 H236", "M118 44 H240", "M118 56 H228", "M118 68 H238", "M118 80 H200"].map((d, i) => `<path class="sc-write2" style="--i:${i}" pathLength="1" d="${d}"/>`).join("") +
      `<g transform="translate(118 -2)"><g class="sc-quill2">${QUILL}</g></g><g transform="translate(236 92)"><g class="sc-seal late"><circle r="11"/><circle class="sc-ring" r="7.5"/></g></g>`],
    finished: [[180, 60], `<rect class="sc-cover" x="130" y="22" width="100" height="80" rx="4"/><path class="sc-gilt" d="M146 40 H214 M152 52 H208"/><g transform="translate(180 76)"><g class="sc-seal glow"><circle r="12"/><circle class="sc-ring" r="8"/></g></g>` +
      [[110, 30], [256, 40], [100, 86], [262, 92], [180, 12]].map((p, i) => `<path class="sc-star" style="--i:${i}" d="M${p[0]} ${p[1] - 7} L${p[0] + 2} ${p[1] - 2} L${p[0] + 7} ${p[1]} L${p[0] + 2} ${p[1] + 2} L${p[0]} ${p[1] + 7} L${p[0] - 2} ${p[1] + 2} L${p[0] - 7} ${p[1]} L${p[0] - 2} ${p[1] - 2} Z"/>`).join("")],
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
