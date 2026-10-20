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
  const PLAN = `<rect class="sc-wall" x="80" y="18" width="200" height="84"/>` +
    [[80, 18, 60, 40], [140, 18, 70, 40], [210, 18, 70, 40], [80, 58, 90, 44], [170, 58, 50, 44], [220, 58, 60, 44]].map((r, i) => `<path class="sc-room" style="--i:${i}" pathLength="1" d="M${r[0]} ${r[1]} h${r[2]} v${r[3]} h${-r[2]} Z"/>`).join("");
  // A scene told in order, every part at its moment of one ten-second loop: each part gets keyframes of its own (drawn,
  // faded in, popped up or risen), so the whole scene keeps in step and fades out together at the end.
  function timeline(id, items) {
    let css = "", body = "";
    const p = t => (t * 10).toFixed(1);
    items.forEach((it, n) => {
      const k = id + n, d = it.d || .8, a = p(it.t), b = p(it.t + d), c = p(it.t + d + .25);
      const frames = {
        draw: `0%,${a}%{stroke-dashoffset:1;opacity:1}${b}%,92%{stroke-dashoffset:0;opacity:1}97%,100%{stroke-dashoffset:0;opacity:0}`,
        fade: `0%,${a}%{opacity:0}${b}%,92%{opacity:1}97%,100%{opacity:0}`,
        pop: `0%,${a}%{transform:scale(0);opacity:0}${b}%{transform:scale(1.18);opacity:1}${c}%,92%{transform:scale(1);opacity:1}97%,100%{transform:scale(1);opacity:0}`,
        rise: `0%,${a}%{transform:scaleY(0);opacity:1}${b}%,92%{transform:scaleY(1);opacity:1}97%,100%{transform:scaleY(1);opacity:0}`
      }[it.how];
      css += `@keyframes ${k}{${frames}}.sc .${k}{animation:${k} 10s ${it.how === "draw" ? "ease-in-out" : "ease-out"} infinite}`;
      body += it.svg.replace("{k}", k);
    });
    return `<style>${css}</style>` + body;
  }
  // the map of the whole, as an old map is drawn: the coast inked, the sea washed in with its ripples, the mountains,
  // a river down to the sea, roads curving into a town, its houses going up round the keep, a wood, a ship in the bay
  function mapScene() {
    const coast = "M20 100 C52 98 74 106 108 99 C138 93 150 104 176 96 C200 89 212 74 236 71 C260 68 270 54 294 51 C314 49 326 38 340 35";
    const items = [
      { how: "draw", t: 0, d: 1.6, svg: `<path class="sc-coast sc-dash {k}" pathLength="1" d="${coast}"/>` },
      { how: "fade", t: 1, d: 1.2, svg: `<path class="sc-sea {k}" d="${coast} L340 114 L20 114 Z"/>` },
      { how: "draw", t: 1.5, d: 1.2, svg: `<path class="sc-ripple sc-dash {k}" pathLength="1" transform="translate(0 6)" d="${coast}"/>` },
      { how: "draw", t: 1.8, d: 1.2, svg: `<path class="sc-ripple far sc-dash {k}" pathLength="1" transform="translate(0 12)" d="${coast}"/>` }
    ];
    [[34, 32], [50, 26], [66, 33], [84, 24], [100, 31]].forEach(([x, y], i) => items.push({ how: "pop", t: 1.9 + i * .18, d: .4, svg: `<g class="sc-mt {k}"><path class="face" d="M${x - 10} ${y} L${x} ${y - 15} L${x + 10} ${y} Z"/><path class="shade" d="M${x} ${y - 15} L${x + 10} ${y} L${x + 3} ${y} Z"/></g>` }));
    items.push({ how: "draw", t: 2.8, d: 1.4, svg: `<path class="sc-river2 sc-dash {k}" pathLength="1" d="M72 30 C76 40 98 38 106 48 C114 62 146 66 154 80 C160 90 168 94 174 96"/>` });
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
      <path class="sc-paper sc-turn" d="M180 94 C210 84 250 84 280 92 V28 C250 20 210 20 180 30 Z"/>`],
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
    places: [[180, 60], PAPER(60, 6, 240, 108) + PLAN + [[110, 38], [175, 40], [245, 34], [125, 80], [250, 84]].map((p, i) => `<circle class="sc-clue" style="--i:${i}" cx="${p[0]}" cy="${p[1]}" r="3.5"/>`).join("") +
      `<g transform="translate(0 0)"><g class="sc-pencil"><path class="sc-feather" d="M0 0 L5 -2 L34 -31 L31 -34 L2 -5 Z"/><path class="sc-ink" d="M0 0 L-2 2"/></g></g>`],
    check: [[180, 60], PAPER(60, 6, 240, 108) + PLAN.replace(/sc-room"/g, 'sc-room still"') + [[108, 38], [173, 38], [243, 38], [123, 80], [193, 80], [248, 80]].map((p, i) => `<text class="sc-tick" style="--i:${i}" x="${p[0]}" y="${p[1]}">✓</text>`).join("") +
      `<g transform="translate(0 0)"><g class="sc-loupe"><circle class="sc-glass" cx="0" cy="0" r="16"/><path class="sc-ink" d="M11 11 L26 26" stroke-width="4"/></g></g>`],
    build: [[180, 40], Array.from({ length: 5 }, (_, i) => `<rect class="sc-paper sc-sheet" style="--i:${i}" x="130" y="${86 - i * 5}" width="100" height="14" rx="2"/>`).join("") +
      `<rect class="sc-cover" x="126" y="58" width="108" height="46" rx="3"/><path class="sc-ribbon" d="M206 58 V112 L212 106 L218 112 V58 Z"/>`],
    report: [[230, 54], PAPER(100, 12, 160, 96) + ["M118 32 H236", "M118 44 H240", "M118 56 H228", "M118 68 H238", "M118 80 H200"].map((d, i) => `<path class="sc-write2" style="--i:${i}" pathLength="1" d="${d}"/>`).join("") +
      `<g transform="translate(118 -2)"><g class="sc-quill2">${QUILL}</g></g><g transform="translate(236 92)"><g class="sc-seal late"><circle r="11"/><circle class="sc-ring" r="7.5"/></g></g>`],
    finished: [[180, 60], `<rect class="sc-cover" x="130" y="22" width="100" height="80" rx="4"/><path class="sc-gilt" d="M146 40 H214 M152 52 H208"/><g transform="translate(180 76)"><g class="sc-seal glow"><circle r="12"/><circle class="sc-ring" r="8"/></g></g>` +
      [[110, 30], [256, 40], [100, 86], [262, 92], [180, 12]].map((p, i) => `<path class="sc-star" style="--i:${i}" d="M${p[0]} ${p[1] - 7} L${p[0] + 2} ${p[1] - 2} L${p[0] + 7} ${p[1]} L${p[0] + 2} ${p[1] + 2} L${p[0]} ${p[1] + 7} L${p[0] - 2} ${p[1] + 2} L${p[0] - 7} ${p[1]} L${p[0] - 2} ${p[1] - 2} Z"/>`).join("")],
    waiting: [[180, 60], `<path class="sc-ink" fill="none" d="M160 18 H200 M160 102 H200 M164 18 C164 48 196 48 196 60 C196 72 164 72 164 102 M196 18 C196 48 164 48 164 60 C164 72 196 72 196 102"/>
      <path class="sc-sand top" d="M170 26 H190 C190 40 180 50 180 54 C180 50 170 40 170 26 Z"/><path class="sc-sand bottom" d="M168 100 H192 C192 90 180 82 180 80 C180 82 168 90 168 100 Z"/><path class="sc-stream" d="M180 54 V96"/>`],
    stopped: [[180, 40], `<rect class="sc-candle" x="170" y="56" width="20" height="46" rx="2"/><path class="sc-ink" d="M180 56 V48"/><path class="sc-holder" d="M150 102 H210 L204 110 H156 Z"/>
      <path class="sc-smoke" d="M180 46 C174 38 186 32 180 24 C174 16 186 10 180 2"/>`]
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
