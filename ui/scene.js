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
    map: [[300, 30], PAPER(20, 6, 320, 108) + `<path class="sc-river sc-draw" style="--i:0" pathLength="1" d="M20 92 C80 72 120 102 170 82 S260 42 340 54"/>` +
      ["M36 32 H322", "M62 14 V112", "M150 14 L172 112", "M244 14 C232 60 262 80 252 112", "M36 70 H330", "M100 14 C110 50 90 80 112 112"].map((d, i) => `<path class="sc-road sc-draw" style="--i:${i + 1}" pathLength="1" d="${d}"/>`).join("") +
      Array.from({ length: 26 }, (_, i) => { const x = 40 + (i * 53) % 280, y = 18 + (i * 37) % 86; return `<rect class="sc-house" style="--i:${i}" x="${x}" y="${y}" width="${7 + i % 3 * 2}" height="${6 + i % 2 * 3}"/>`; }).join("") +
      `<g transform="translate(312 32)"><g class="sc-spin"><path class="sc-rose" d="M0 -16 L4 0 L0 16 L-4 0 Z M-16 0 L0 -4 L16 0 L0 4 Z"/><circle class="sc-ink" r="11" fill="none"/></g></g>`],
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
