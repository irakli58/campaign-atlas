/* ================================================================
   CAMPAIGN ATLAS ENGINE
   Location maps on a square grid, floor by floor, with a Player view
   and a GM view, reversible bigger versions of each map, and a
   room-by-room guide. Runs in the browser (the published page) and
   under Node (scripts/atlas.js: checks, text drawings, exports).

   A place is registered with ATLAS.place(id, { name, ..., map, expand, guide }).
   The data format is documented in references/data-format.md.
   ================================================================ */
var ATLAS = (function () {
  "use strict";
  const A = {
    config: {
      title: "Untitled campaign", subtitle: "", system: "", setting: "",
      gm: "Keeper",                       // what the game calls its referee: Keeper, GM, DM, Warden, Referee
      grid: { unit: 5, name: "ft" },      // one square on the maps
      paper: "parchment",                 // parchment | blueprint | chalk | { paper, ink, halo, hatch, hatchLine, accent, sub, stair, room }
      autoWindows: true,                  // draw windows on walls that face the outdoors
      compass: true,
      fonts: { label: "'Spectral SC', 'Spectral', Georgia, serif", mono: "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace" },
      markers: {},                        // extra marker letters: { K: ["#2f6b3a", "Key item"] }
      kinds: {},                          // extra floor kinds: { deckplate: { pat: "plate", fill: "#9aa3aa", line: "#6b757d", out: 0 } }
      items: {},                          // extra items: { console: { shape: "rect", fill: "#3b4a57", glyph: "C" } }
      labels: {},                         // rename guide fields: { chk: "Rolls" }
      categories: [],                     // index groups, in order: [{ id: "scene", name: "Crime scenes" }]
      sizeNames: ["Original", "Larger", "Largest", "Huge"],
      minInbound: 2,                      // checker: places with fewer inbound leads than this are reported
      storageKey: "atlas"
    },
    maps: {}, exp: {}, guides: {}, meta: {}, order: [],
    state: { f: {}, v: "gm", n: 0, level: 99, cache: {} }
  };
  const C = 24;                 // pixels per square
  const LM_C = C, LM_INK = "#2b2219";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const isRoom = rid => /^R\d/.test(rid);

  const PAPERS = {
    parchment: { paper: "#f1e8d0", ink: "#2b2219", halo: "#f3ead2", hatch: "#d4c6a2", hatchLine: "#8c7b5a", accent: "#8a2432", sub: "#6a5a44", stair: "#e9dcbc", room: "#6b5a3e" },
    blueprint: { paper: "#e6edf2", ink: "#1c2b3a", halo: "#edf3f7", hatch: "#c8d4dd", hatchLine: "#7b8c9b", accent: "#b23a2e", sub: "#53667a", stair: "#d9e3ea", room: "#4f6072" },
    chalk: { paper: "#ecebe6", ink: "#232323", halo: "#f2f1ec", hatch: "#d3d2cb", hatchLine: "#8b8a83", accent: "#9c3328", sub: "#5c5b56", stair: "#dddcd5", room: "#5f5e58" }
  };
  function paper() { const c = A.config.paper; return typeof c === "object" && c ? Object.assign({}, PAPERS.parchment, c) : (PAPERS[c] || PAPERS.parchment); }

  /* ---- floor kinds.  out: open ground (no walls between two open kinds; a wall, and windows, where a room meets it)
                        solid: not a place at all (rock, a roof seen from above, a void)
                        nowin: rooms of this kind get no automatic windows (cellars, vaults)
                        stretch: touching the old edge, it is stretched when a map is enlarged
                        pat: draw with another kind's pattern */
  const KINDS = {
    boards: {}, flag: {}, tile: {}, tilew: {}, "carpet-r": {}, "carpet-g": {}, "carpet-b": {}, cobble: {}, sawdust: {}, lino: {}, straw: {},
    earth: { nowin: 1 }, brick: { nowin: 1 }, stone: { nowin: 1 }, coal: { nowin: 1 }, water: { nowin: 1, stretch: 1 },
    concrete: {}, metal: {}, grating: {}, glass: {}, marble: {},
    street: { out: 1, stretch: 1 }, yard: { out: 1, pat: "cobble" }, alley: { out: 1, stretch: 1, pat: "cobble" }, grass: { out: 1, stretch: 1 },
    quay: { out: 1, stretch: 1, pat: "stone" }, river: { out: 1, stretch: 1 }, deck: { out: 1, pat: "boards" },
    sand: { out: 1, stretch: 1 }, snow: { out: 1, stretch: 1 }, mud: { out: 1, stretch: 1 }, tarmac: { out: 1, stretch: 1 }, forest: { out: 1, stretch: 1 }, space: { out: 1, stretch: 1 },
    rock: { solid: 1, stretch: 1 }, roof: { solid: 1 }, void: { solid: 1 }
  };
  function kindOf(k) { return A.config.kinds[k] || KINDS[k] || null; }
  const isOut = k => { const d = kindOf(k); return !!(d && d.out); };
  const isSolid = k => { const d = kindOf(k); return !!(d && d.solid); };
  const isIndoorKind = k => !!k && !isOut(k) && !isSolid(k);

  // generic patterns for kinds declared in the campaign's config
  const GEN = {
    plain: (f) => [8, 8, `<rect width="8" height="8" fill="${f}"/>`],
    planks: (f, l) => [48, 16, `<rect width="48" height="16" fill="${f}"/><path d="M0 7.6H48M0 15.6H48" stroke="${l}" stroke-width=".8"/><path d="M17 0V8M41 8V16" stroke="${l}" stroke-width=".6"/>`],
    tiles: (f, l) => [12, 12, `<rect width="12" height="12" fill="${f}"/><path d="M0 .5H12M.5 0V12" stroke="${l}" stroke-width=".8"/>`],
    slabs: (f, l) => [36, 36, `<rect width="36" height="36" fill="${f}"/><path d="M0 .5H36M0 18.5H36M.5 0V18M22 0V18M12 18V36" stroke="${l}" stroke-width=".9" fill="none"/>`],
    checks: (f, l) => [12, 12, `<rect width="12" height="12" fill="${f}"/><rect width="6" height="6" fill="${l}"/><rect x="6" y="6" width="6" height="6" fill="${l}"/>`],
    bricks: (f, l) => [24, 12, `<rect width="24" height="12" fill="${f}"/><path d="M0 .5H24M0 6.5H24M8 0V6M20 6V12" stroke="${l}" stroke-width=".8" fill="none"/>`],
    plate: (f, l) => [24, 24, `<rect width="24" height="24" fill="${f}"/><path d="M0 .5H24M.5 0V24" stroke="${l}" stroke-width="1"/><circle cx="3.5" cy="3.5" r=".9" fill="${l}"/><circle cx="20.5" cy="3.5" r=".9" fill="${l}"/><circle cx="3.5" cy="20.5" r=".9" fill="${l}"/><circle cx="20.5" cy="20.5" r=".9" fill="${l}"/>`],
    grate: (f, l) => [8, 8, `<rect width="8" height="8" fill="${f}"/><path d="M0 0L8 8M8 0L0 8" stroke="${l}" stroke-width=".9"/>`],
    dots: (f, l) => [20, 20, `<rect width="20" height="20" fill="${f}"/><circle cx="4" cy="5" r=".9" fill="${l}"/><circle cx="14" cy="9" r="1.1" fill="${l}"/><circle cx="8" cy="16" r=".8" fill="${l}"/>`],
    waves: (f, l) => [24, 12, `<rect width="24" height="12" fill="${f}"/><path d="M0 6 q6 -4 12 0 t12 0" fill="none" stroke="${l}" stroke-width="1"/>`],
    hatch: (f, l) => [8, 8, `<rect width="8" height="8" fill="${f}"/><path d="M0 8 L8 0 M-2 2 L2 -2 M6 10 L10 6" stroke="${l}" stroke-width="1.2"/>`],
    diamonds: (f, l) => [16, 16, `<rect width="16" height="16" fill="${f}"/><path d="M0 8 L8 0 L16 8 L8 16 Z" fill="none" stroke="${l}" stroke-width=".7"/>`]
  };
  const carpet = (base, hi) => [16, 16, `<rect width="16" height="16" fill="${base}"/><path d="M8 2 L14 8 L8 14 L2 8 Z" fill="none" stroke="${hi}" stroke-width="1"/><circle cx="8" cy="8" r="1.4" fill="${hi}"/>`];
  const cobbles = (b, a, c, d, e, s) => [12, 12, `<rect width="12" height="12" fill="${b}"/><circle cx="3" cy="3" r="2.6" fill="${a}" stroke="${s}" stroke-width=".6"/><circle cx="9" cy="9" r="2.6" fill="${c}" stroke="${s}" stroke-width=".6"/><circle cx="9" cy="3" r="2" fill="${d}" stroke="${s}" stroke-width=".5"/><circle cx="3" cy="9" r="2" fill="${e}" stroke="${s}" stroke-width=".5"/>`];
  // the built-in patterns: [width, height, body, patternTransform?]
  const PATS = {
    boards: GEN.planks("#d9be8f", "#ad8a5a"),
    flag: [24, 24, `<rect width="24" height="24" fill="#cdc5b1"/><path d="M0 .5H24M0 12.5H24M9 0V12M19 12V24" stroke="#9c937f" stroke-width=".9" fill="none"/>`],
    tile: GEN.tiles("#b96b4d", "#8d4b34"), tilew: GEN.checks("#ece8de", "#3e4a4a"),
    "carpet-r": carpet("#8c3434", "#c27a4a"), "carpet-g": carpet("#3d5a3e", "#9aa86a"), "carpet-b": carpet("#33456a", "#8f9cc0"),
    cobble: cobbles("#b5ab96", "#c4bba6", "#c2b8a2", "#bdb39e", "#bfb5a0", "#8d8471"),
    street: cobbles("#a59b86", "#b2a893", "#afa58f", "#aaa08a", "#aca28c", "#7e7563"),
    earth: [20, 20, `<rect width="20" height="20" fill="#ae9670"/><circle cx="4" cy="5" r=".9" fill="#7e6a4c"/><circle cx="14" cy="9" r="1.1" fill="#8a7553"/><circle cx="8" cy="16" r=".8" fill="#7e6a4c"/><circle cx="17" cy="17" r=".7" fill="#c2ab84"/>`],
    brick: GEN.bricks("#a86f58", "#7b4b3a"), stone: GEN.slabs("#b4ad9f", "#8a8476"),
    water: GEN.waves("#7f9e9b", "#5a7a78"), river: GEN.waves("#6b8784", "#4a6664"),
    sawdust: [10, 10, `<rect width="10" height="10" fill="#dcc697"/><circle cx="2" cy="3" r=".7" fill="#b89a62"/><circle cx="7" cy="7" r=".6" fill="#b89a62"/><circle cx="8" cy="2" r=".4" fill="#f0e0b8"/>`],
    lino: GEN.diamonds("#c6b287", "#a8935f"),
    coal: [10, 10, `<rect width="10" height="10" fill="#3a3531"/><circle cx="3" cy="3" r="1.4" fill="#25211e"/><circle cx="7" cy="7" r="1.6" fill="#4a443e"/>`],
    straw: [14, 6, `<rect width="14" height="6" fill="#d6be78"/><path d="M0 2 L9 4 M5 5 L14 1" stroke="#b39a52" stroke-width=".7"/>`],
    grass: [14, 14, `<rect width="14" height="14" fill="#a6b286"/><path d="M3 5 l1 -3 l1 3 M10 11 l1 -3 l1 3" stroke="#7b8a5c" stroke-width=".7" fill="none"/>`],
    forest: [28, 28, `<rect width="28" height="28" fill="#8fa077"/><circle cx="7" cy="8" r="5" fill="#6f8a5a" opacity=".85"/><circle cx="20" cy="19" r="6" fill="#688355" opacity=".85"/><circle cx="7" cy="8" r="1.2" fill="#4a3a2a"/><circle cx="20" cy="19" r="1.3" fill="#4a3a2a"/>`],
    roof: [16, 10, `<rect width="16" height="10" fill="#7d7a76"/><path d="M0 .5H16M0 5.5H16M4 0V5M12 5V10" stroke="#5e5b57" stroke-width=".8" fill="none"/>`],
    void: [12, 12, `<rect width="12" height="12" fill="#cfc4a6"/><path d="M0 12 L12 0 M-3 3 L3 -3 M9 15 L15 9" stroke="#8c7b5a" stroke-width=".7" opacity=".55"/>`],
    rock: GEN.hatch("#6f675b", "#4f483e"),
    concrete: GEN.dots("#bdbdb6", "#9b9b94"), metal: GEN.plate("#a3abb1", "#737d85"), grating: GEN.grate("#8d959b", "#5f686f"),
    glass: GEN.diamonds("#cfe0e6", "#9fb8c2"), marble: GEN.checks("#e9e6df", "#c9c4b8"),
    sand: GEN.dots("#dccd9c", "#b9a871"), snow: GEN.dots("#eef1f2", "#c6ced2"), mud: GEN.dots("#8c7758", "#6a5840"),
    tarmac: GEN.dots("#77787a", "#5c5d5f"),
    space: [40, 40, `<rect width="40" height="40" fill="#141a22"/><circle cx="6" cy="9" r=".8" fill="#d8dfe8"/><circle cx="27" cy="5" r=".5" fill="#aab6c4"/><circle cx="33" cy="26" r=".9" fill="#d8dfe8"/><circle cx="14" cy="31" r=".5" fill="#aab6c4"/>`]
  };
  function patFor(kind) {
    const d = kindOf(kind); if (!d) return null;
    if (d.pat && PATS[d.pat] && !d.fill) return { id: d.pat, def: PATS[d.pat] };
    if (PATS[kind] && !A.config.kinds[kind]) return { id: kind, def: PATS[kind] };
    const g = GEN[d.pat] || GEN.plain;
    return { id: kind, def: g(d.fill || "#c9c4b8", d.line || "#8f8a7e") };
  }
  function defs(p, used) {
    const P = paper(), out = [];
    const pat = (id, [w, h, body, tr]) => `<pattern id="${p}${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${tr || ""}>${body}</pattern>`;
    out.push(pat("hx", [7, 7, `<rect width="7" height="7" fill="${P.hatch}"/><line x1="0" y1="0" x2="0" y2="7" stroke="${P.hatchLine}" stroke-width="1.3" opacity=".55"/>`, ` patternTransform="rotate(45)"`]));
    out.push(pat("grid", [C, C, `<path d="M ${C} 0 L 0 0 0 ${C}" fill="none" stroke="${P.ink}" stroke-width=".5" opacity=".2"/>`]));
    const seen = new Set(["rock"]); out.push(pat("rock", PATS.rock));
    for (const k of used) { const x = patFor(k); if (!x || seen.has(x.id)) continue; seen.add(x.id); out.push(pat(x.id, x.def)); }
    return `<defs>${out.join("")}</defs>`;
  }
  // ---- furniture and fittings, drawn in an unrotated u x v box whose "back" is the top edge
  const LMI = (() => {
    const S = `stroke="${LM_INK}" stroke-width="1"`, W = "#8a6240", DW = "#5a3d28", LIN = "#f3eee0", IR = "#3b3a38", ST = "#b9b2a3";
    const R = (x, y, w, h, f, x2 = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${S} ${x2}/>`;
    const Ci = (x, y, r, f, x2 = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${S} ${x2}/>`;
    const L = (x1, y1, x2, y2, w = 1, c = LM_INK) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
    const chairs = (u, v, n) => { let s = ""; for (let i = 0; i < n; i++) { const x = (u / (n + 1)) * (i + 1); s += R(x - 4, -7, 8, 6, "#9a7048") + R(x - 4, v + 1, 8, 6, "#9a7048"); } return s; };
    return {
      bed: (u, v) => R(2, 1, u - 4, v - 2, W) + R(4, 3, u - 8, v - 6, LIN) + R(5, 4, u - 10, Math.min(9, v * .22), "#fffdf6") + L(4, v * .42, u - 4, v * .42, .8),
      dbed: (u, v) => R(2, 1, u - 4, v - 2, DW) + R(4, 3, u - 8, v - 6, LIN) + R(6, 4, u / 2 - 8, 8, "#fffdf6") + R(u / 2 + 2, 4, u / 2 - 8, 8, "#fffdf6") + L(4, v * .38, u - 4, v * .38, .8),
      cot: (u, v) => R(3, 2, u - 6, v - 4, "#a8a49a") + R(5, 3, u - 10, 6, LIN),
      bunk: (u, v) => R(2, 2, u - 4, v - 4, W) + R(4, 4, u - 8, v - 8, "#c9c0a8") + L(4, v / 2, u - 4, v / 2, 1.2),
      ward: (u, v) => R(1, 1, u - 2, v - 2, DW) + L(u / 2, 2, u / 2, v - 2, .8) + Ci(u / 2 - 3, v / 2, 1, "#c9a15a") + Ci(u / 2 + 3, v / 2, 1, "#c9a15a"),
      chest: (u, v) => R(2, 3, u - 4, v - 6, "#7a5232") + L(u * .3, 3, u * .3, v - 3, 1.5, "#3a2a1a") + L(u * .7, 3, u * .7, v - 3, 1.5, "#3a2a1a"),
      dresser: (u, v) => R(1, 1, u - 2, v - 4, W) + L(3, v * .35, u - 3, v * .35, .6) + L(3, v * .6, u - 3, v * .6, .6),
      book: (u, v) => { let s = R(0, 0, u, Math.min(v, 9), DW); const cols = ["#7a2a2a", "#2f4a3a", "#3a3a5a", "#8a6a2a", "#5a3a2a"]; for (let x = 2, i = 0; x < u - 2; x += 3, i++) s += `<rect x="${x}" y="2" width="2.2" height="${Math.min(v, 9) - 4}" fill="${cols[i % 5]}"/>`; return s; },
      shelf: (u, v) => { let s = R(0, 0, u, Math.min(v, 8), "#9a7a52"); for (let x = 3; x < u - 3; x += 6) s += `<rect x="${x}" y="2" width="4" height="${Math.min(v, 8) - 4}" fill="#d8cfb4" stroke="${LM_INK}" stroke-width=".4"/>`; return s; },
      files: (u, v) => { let s = R(0, 0, u, Math.min(v, 10), "#6a6a62"); for (let x = 0; x < u; x += 8) s += L(x, 0, x, Math.min(v, 10), .6) + L(x + 2, 5, x + 6, 5, .8); return s; },
      tbl: (u, v) => R(3, 3, u - 6, v - 6, "#a77b4f"),
      dine: (u, v) => `<g transform="translate(0 8)">${chairs(u, v - 16, Math.max(1, Math.round(u / 22)))}${R(2, 0, u - 4, v - 16, "#a77b4f")}</g>`,
      rtbl: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 3, "#a77b4f"),
      clothtbl: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, "#e8e0cc") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 7, "none", `stroke-dasharray="2 2"`),
      chair: (u, v) => R(u / 2 - 5, v / 2 - 5, 10, 10, "#9a7048") + R(u / 2 - 5, v / 2 - 6, 10, 3, DW),
      arm: (u, v) => `<rect x="${u / 2 - 8}" y="${v / 2 - 8}" width="16" height="16" rx="3" fill="#7a3a3a" ${S}/>` + R(u / 2 - 8, v / 2 - 8, 16, 5, "#5a2a2a") + R(u / 2 - 8, v / 2 - 3, 3, 11, "#6a3030") + R(u / 2 + 5, v / 2 - 3, 3, 11, "#6a3030"),
      sofa: (u, v) => `<rect x="2" y="3" width="${u - 4}" height="${v - 6}" rx="3" fill="#6a3a4a" ${S}/>` + R(2, 3, u - 4, 5, "#4a2a34") + R(2, 3, 4, v - 6, "#4a2a34") + R(u - 6, 3, 4, v - 6, "#4a2a34"),
      desk: (u, v) => R(2, 2, u - 4, v * .55, DW) + `<rect x="${u * .25}" y="${4}" width="7" height="5" fill="#f4efe2" transform="rotate(-8 ${u * .25} 4)"/>` + Ci(u * .7, 6, 1.3, "#111") + R(u / 2 - 5, v * .62, 10, 9, "#9a7048"),
      bench: (u, v) => R(1, v / 2 - 3, u - 2, 6, "#8a6a48"),
      stool: (u, v) => Ci(u / 2, v / 2, 4, "#8a6a48"),
      fp: (u, v) => R(0, 0, u, 6, "#7a6a5a") + R(u * .2, 0, u * .6, 9, "#4a3a32") + `<rect x="${u * .3}" y="1" width="${u * .4}" height="6" fill="#e0782a"/>` + R(u * .12, 9, u * .76, 5, ST),
      range: (u, v) => R(1, 0, u - 2, v - 4, IR) + Ci(u * .3, v * .35, 3, "#55524e") + Ci(u * .62, v * .35, 3, "#55524e") + L(3, v - 9, u - 3, v - 9, .8, "#888"),
      copper: (u, v) => R(2, 1, u - 4, v - 2, "#a86f58") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 5, "#b0784a"),
      sink: (u, v) => R(1, 1, u - 2, v - 4, ST) + R(4, 3, u - 8, v - 9, "#9aa4a6") + Ci(u / 2, 2.5, 1.4, "#666"),
      pump: (u, v) => Ci(u / 2, v / 2, 4, "#4a4a48") + L(u / 2, v / 2, u / 2 + 7, v / 2 - 4, 2, "#4a4a48"),
      privy: (u, v) => R(1, 1, u - 2, v - 2, "#c9b48a") + R(3, 2, u - 6, 8, "#8a6a48") + `<ellipse cx="${u / 2}" cy="6" rx="3" ry="2.2" fill="#2a2420"/>`,
      bath: (u, v) => `<rect x="2" y="2" width="${u - 4}" height="${v - 4}" rx="7" fill="#f7f6ef" ${S}/><rect x="5" y="5" width="${u - 10}" height="${v - 10}" rx="5" fill="#c9dfe2" stroke="${LM_INK}" stroke-width=".5"/>`,
      wash: (u, v) => R(2, 1, u - 4, v - 6, "#d8ccb0") + Ci(u / 2, v / 2 - 2, Math.min(u, v) / 2 - 6, "#f4f2ea"),
      counter: (u, v) => R(0, 2, u, v - 4, "#7a5534") + L(2, 5, u - 2, 5, 1, "#a77b4f"),
      till: (u, v) => R(u / 2 - 5, v / 2 - 4, 10, 8, "#b8903a") + L(u / 2 - 3, v / 2 - 1, u / 2 + 3, v / 2 - 1, .8),
      disp: (u, v) => R(1, 1, u - 2, v - 2, "#cfe0e6", `opacity=".95"`) + L(3, v / 2, u - 3, v / 2, .5) + Ci(u * .3, v * .3, 1.8, "#8a6a48") + Ci(u * .7, v * .7, 1.8, "#c9a15a"),
      work: (u, v) => R(1, 2, u - 2, v - 4, "#a07a50") + L(5, 6, 12, 6, 1.5, "#555") + L(u - 12, v - 7, u - 5, v - 9, 1.5, "#555"),
      block: (u, v) => R(2, 2, u - 4, v - 4, "#b58a5a") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 6, "none") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 9, "none"),
      hooks: (u, v) => { let s = L(1, 3, u - 1, 3, 2, "#555"); for (let x = 5; x < u - 3; x += 9) s += L(x, 3, x, 6, .8, "#555") + `<ellipse cx="${x}" cy="${10}" rx="3.2" ry="5" fill="#a8483e" ${S}/>`; return s; },
      sm: (u, v) => R(2, 3, u - 4, v - 6, "#7a5534") + R(u / 2 - 5, v / 2 - 3, 10, 6, "#1e1e1e") + Ci(u / 2 + 4, v / 2 + 4, 1, "#c9a15a"),
      dress: (u, v) => `<ellipse cx="${u / 2}" cy="${v / 2}" rx="${Math.min(u, v) / 2 - 5}" ry="${Math.min(u, v) / 2 - 7}" fill="#d8c8a8" ${S}/>` + Ci(u / 2, v / 2, 1.5, "#5a4a3a"),
      fig: (u, v, o) => `<ellipse cx="${u / 2}" cy="${v / 2 + 1}" rx="7" ry="4.5" fill="${o || "#5a3a3a"}" ${S}/>` + Ci(u / 2, v / 2 - 1, 3.6, "#e2c6a4"),
      body: (u, v) => `<rect x="${u / 2 - 6}" y="3" width="12" height="${v - 6}" rx="5" fill="#ece8dc" ${S}/>` + Ci(u / 2, 8, 3.4, "#e0dccf"),
      barrel: (u, v) => { let s = ""; const n = Math.max(1, Math.round(u / LM_C)), m = Math.max(1, Math.round(v / LM_C)); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const cx = (i + .5) * u / n, cy = (j + .5) * v / m; s += Ci(cx, cy, 9, "#8a6038") + Ci(cx, cy, 6, "none") + Ci(cx, cy, 1.5, "#3a2a1a"); } return s; },
      crate: (u, v) => { let s = ""; const n = Math.max(1, Math.round(u / LM_C)), m = Math.max(1, Math.round(v / LM_C)); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const x = i * u / n + 2, y = j * v / m + 2, w = u / n - 4, h = v / m - 4; s += R(x, y, w, h, "#b88b55") + L(x, y, x + w, y + h, .7) + L(x + w, y, x, y + h, .7); } return s; },
      sack: (u, v) => { let s = ""; for (let i = 0; i < Math.max(1, Math.round(u / 14)); i++) s += `<ellipse cx="${7 + i * 14}" cy="${v / 2}" rx="6" ry="${v / 2 - 3}" fill="#d0bc8c" ${S}/>`; return s; },
      salt: (u, v) => `<ellipse cx="${u / 2}" cy="${v / 2}" rx="${u / 2 - 2}" ry="${v / 2 - 2}" fill="#f2efe6" ${S}/>`,
      coal: (u, v) => `<path d="M2 ${v - 2} Q ${u * .3} 2 ${u * .55} ${v * .3} T ${u - 2} ${v - 2} Z" fill="#2c2825" ${S}/>`,
      bin: (u, v) => R(1, 1, u - 2, v - 2, "#3e3935") + L(1, 5, u - 1, 5, .8, "#777"),
      piano: (u, v) => R(1, 1, u - 2, v * .6, "#1e1612") + R(3, v * .6 - 4, u - 6, 3, "#f4efe2") + R(u / 2 - 6, v * .6 + 3, 12, 6, "#5a3d28"),
      clock: (u, v) => R(u / 2 - 4, 1, 8, 10, DW) + Ci(u / 2, 5, 2.4, "#efe6cc"),
      rug: (u, v, o) => `<rect x="2" y="2" width="${u - 4}" height="${v - 4}" fill="${o || "#7a3a34"}" stroke="#d8b878" stroke-width="2" opacity=".85"/><rect x="6" y="6" width="${u - 12}" height="${v - 12}" fill="none" stroke="#d8b878" stroke-width=".8" opacity=".85"/>`,
      lamp: (u, v) => `<circle cx="${u / 2}" cy="${v / 2}" r="7" fill="#ffe7a0" opacity=".45"/>` + Ci(u / 2, v / 2, 2.5, "#e6b84a"),
      plant: (u, v) => Ci(u / 2, v / 2, 6, "#5a7a4a") + Ci(u / 2, v / 2, 2, "#3a2a1a"),
      pew: (u, v) => R(1, v / 2 - 4, u - 2, 8, "#7a5534") + L(1, v / 2 - 4, u - 1, v / 2 - 4, 2.2, "#4a3220"),
      altar: (u, v) => R(2, 3, u - 4, v - 6, "#ece6d4") + L(u / 2, 4, u / 2, v - 4, 1.2, "#b8903a") + L(u / 2 - 4, v / 2 - 2, u / 2 + 4, v / 2 - 2, 1.2, "#b8903a"),
      font: (u, v) => `<polygon points="${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4 + Math.PI / 8, r = Math.min(u, v) / 2 - 3; return (u / 2 + r * Math.cos(a)) + "," + (v / 2 + r * Math.sin(a)); }).join(" ")}" fill="${ST}" ${S}/>` + Ci(u / 2, v / 2, 3, "#9ab4b8"),
      pulpit: (u, v) => `<polygon points="${u / 2},2 ${u - 2},${v / 3} ${u - 2},${v - 2} 2,${v - 2} 2,${v / 3}" fill="#7a5534" ${S}/>`,
      lectern: (u, v) => R(u / 2 - 6, v / 2 - 4, 12, 8, "#7a5534") + L(u / 2 - 6, v / 2 - 4, u / 2 + 6, v / 2 - 4, 2),
      slab: (u, v) => R(2, 4, u - 4, v - 8, "#c4c8c6") + Ci(u - 8, v / 2, 2, "#555"),
      drawers: (u, v) => { let s = R(0, 0, u, v, "#9aa2a6"); for (let x = 0; x < u; x += 12) s += L(x, 0, x, v, .8); for (let y = 0; y < v; y += 12) s += L(0, y, u, y, .8); return s; },
      bars: (u, v) => { let s = u >= v ? L(0, v / 2, u, v / 2, 1.5) : L(u / 2, 0, u / 2, v, 1.5); const n = Math.max(u, v); for (let i = 3; i < n; i += 5) s += u >= v ? Ci(i, v / 2, 1.3, IR) : Ci(u / 2, i, 1.3, IR); return s; },
      grate: (u, v) => R(2, 2, u - 4, v - 4, "#2a2826") + [5, 9, 13, 17].filter(x => x < u - 3).map(x => L(x, 3, x, v - 3, 1, "#777")).join(""),
      pipe: (u, v) => u >= v ? R(0, v / 2 - 3, u, 6, "#6f7072") + L(0, v / 2, u, v / 2, .5, "#aaa") : R(u / 2 - 3, 0, 6, v, "#6f7072") + L(u / 2, 0, u / 2, v, .5, "#aaa"),
      roots: (u, v) => `<path d="M2 ${v * .2} C ${u * .3} ${v * .1}, ${u * .4} ${v * .7}, ${u * .7} ${v * .5} S ${u - 2} ${v * .8}, ${u - 2} ${v * .9} M ${u * .2} ${v - 2} C ${u * .3} ${v * .6}, ${u * .5} ${v * .9}, ${u * .6} ${v * .3}" fill="none" stroke="#2a1e18" stroke-width="3.5" stroke-linecap="round"/><path d="M2 ${v * .2} C ${u * .3} ${v * .1}, ${u * .4} ${v * .7}, ${u * .7} ${v * .5}" fill="none" stroke="#5a4232" stroke-width="1.2"/>`,
      rubble: (u, v) => { let s = ""; for (let i = 0; i < 7; i++) { const x = (i * 37 % 100) / 100 * (u - 8) + 4, y = (i * 61 % 100) / 100 * (v - 8) + 4; s += `<polygon points="${x},${y - 3} ${x + 4},${y} ${x + 1},${y + 3} ${x - 3},${y + 1}" fill="#9a8a78" ${S}/>`; } return s; },
      puddle: (u, v) => `<ellipse cx="${u / 2}" cy="${v / 2}" rx="${u / 2 - 3}" ry="${v / 2 - 4}" fill="#7f9e9b" opacity=".75"/>`,
      foot: (u, v) => { let s = ""; const n = Math.max(2, Math.round(Math.max(u, v) / 8)); for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = u >= v ? t * u : u / 2 + (i % 2 ? 3 : -3), y = u >= v ? v / 2 + (i % 2 ? 3 : -3) : t * v; s += `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#5a4632"/>`; } return s; },
      blood: (u, v) => `<path d="M${u / 2} ${v / 2 - 6} q5 2 6 7 q-3 5 -8 4 q-5 -2 -4 -7 q2 -4 6 -4 Z" fill="#7a1a1a" opacity=".85"/>` + Ci(u / 2 + 8, v / 2 + 6, 1.4, "#7a1a1a", `stroke="none"`),
      papers: (u, v) => [0, 1, 2, 3].map(i => `<rect x="${4 + i * (u - 12) / 4}" y="${3 + (i % 2) * (v - 12) / 2}" width="7" height="5" fill="#f4efe2" stroke="${LM_INK}" stroke-width=".4" transform="rotate(${i * 23 - 20} ${4 + i * (u - 12) / 4} ${3 + (i % 2) * (v - 12) / 2})"/>`).join(""),
      cart: (u, v) => R(2, 3, u - 4, v - 6, "#9a7048") + R(0, v / 2 - 6, 3, 12, IR) + R(u - 3, v / 2 - 6, 3, 12, IR) + L(u / 2, v - 3, u / 2, v + 8, 1.5),
      trough: (u, v) => R(1, v / 2 - 4, u - 2, 8, "#7a7a72") + R(3, v / 2 - 2, u - 6, 4, "#8fb0ae"),
      well: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, ST) + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 6, "#2a3434"),
      tree: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 1, "#6f8a5a", `opacity=".9"`) + Ci(u / 2, v / 2, 3, "#4a3a2a"),
      stage: (u, v) => R(0, 0, u, v, "#6a4a32") + L(0, v - 2, u, v - 2, 3, "#3a2a1a"),
      curtain: (u, v) => R(0, 0, u, v, "#7a1a24") + [0.2, .4, .6, .8].map(t => L(u * t, 0, u * t, v, .6, "#4a0e14")).join(""),
      bar: (u, v) => R(0, 0, u, v * .55, "#5a3a22") + L(2, 3, u - 2, 3, 1, "#a77b4f") + [0.25, .5, .75].map(t => Ci(u * t, v * .8, 3, "#8a6a48")).join(""),
      taps: (u, v) => [0.3, .5, .7].map(t => Ci(u * t, v / 2, 1.8, "#b8903a")).join(""),
      safe: (u, v) => R(2, 2, u - 4, v - 4, "#2e2e2c") + Ci(u / 2, v / 2, 3, "#888"),
      stove: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 3, IR) + L(u / 2, v / 2, u / 2, 0, 2, IR),
      hatch: (u, v) => R(2, 2, u - 4, v - 4, "#8a6a48") + L(2, v / 2, u - 2, v / 2, .6) + Ci(u / 2, v / 2 + 4, 2, "none", `stroke-width="1.2"`),
      ladder: (u, v) => L(u / 2 - 4, 0, u / 2 - 4, v, 1.5) + L(u / 2 + 4, 0, u / 2 + 4, v, 1.5) + Array.from({ length: Math.floor(v / 5) }, (_, i) => L(u / 2 - 4, i * 5 + 3, u / 2 + 4, i * 5 + 3, 1)).join(""),
      column: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 3, ST),
      rail: (u, v) => u >= v ? L(0, v / 2, u, v / 2, 1.5, "#444") + Array.from({ length: Math.floor(u / 8) + 1 }, (_, i) => Ci(i * 8, v / 2, 1.3, "#444")).join("") : L(u / 2, 0, u / 2, v, 1.5, "#444") + Array.from({ length: Math.floor(v / 8) + 1 }, (_, i) => Ci(u / 2, i * 8, 1.3, "#444")).join(""),
      fence: (u, v) => u >= v ? L(0, v / 2, u, v / 2, 2.5, "#5a4632") : L(u / 2, 0, u / 2, v, 2.5, "#5a4632"),
      niche: (u, v) => { let s = ""; const n = Math.max(1, Math.round(Math.max(u, v) / LM_C)); for (let i = 0; i < n; i++) s += u >= v ? R(i * u / n + 2, 1, u / n - 4, v - 2, "#3a3430") + Ci(i * u / n + u / n / 2, v / 2, 2.4, "#d8d0bc") : R(1, i * v / n + 2, u - 2, v / n - 4, "#3a3430") + Ci(u / 2, i * v / n + v / n / 2, 2.4, "#d8d0bc"); return s; },
      furnace: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, "#7a4a32") + Ci(u / 2, v / 2, Math.min(u, v) / 4, "#f08a2a"),
      pipes: (u, v) => { let s = ""; for (let x = 3; x < u; x += 6) s += R(x - 2, 0, 4, v, "#9a9a90"); return s; },
      candle: (u, v) => Ci(u / 2, v / 2, 2, "#f4efe2") + `<circle cx="${u / 2}" cy="${v / 2}" r="5" fill="#ffd27a" opacity=".35"/>`,
      coffin: (u, v) => `<polygon points="${u / 2 - 5},2 ${u / 2 + 5},2 ${u / 2 + 8},${v * .3} ${u / 2 + 5},${v - 2} ${u / 2 - 5},${v - 2} ${u / 2 - 8},${v * .3}" fill="#5a3d28" ${S}/>`,
      cradle: (u, v) => `<ellipse cx="${u / 2}" cy="${v / 2}" rx="${u / 2 - 4}" ry="${v / 2 - 6}" fill="#c9a874" ${S}/>`,
      cabinet: (u, v) => R(1, 1, u - 2, v - 2, "#6a4a32") + L(u / 2, 1, u / 2, v - 1, .6),
      mangle: (u, v) => R(2, 2, u - 4, v - 4, "#7a7a72") + L(4, v / 2, u - 4, v / 2, 2, "#3a3a38"),
      tub: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 3, "#9a8a70") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 6, "#a9c4c4"),
      mirror: (u, v) => R(1, 1, u - 2, 4, "#cfe0e6"),
      pic: (u, v) => R(2, 0, u - 4, 3, "#b8903a"),
      organ: (u, v) => R(0, 0, u, v * .5, "#5a3d28") + Array.from({ length: Math.floor(u / 4) }, (_, i) => R(i * 4 + 1, 0, 2, v * .35, "#c9b48a")).join("") + R(u / 2 - 6, v * .55, 12, 6, "#8a6a48"),
      stall: (u, v) => R(1, 1, u - 2, v - 2, "#d6be78") + L(1, 1, u - 1, 1, 3, "#5a4632") + `<ellipse cx="${u / 2}" cy="${v / 2 + 2}" rx="${u / 2 - 6}" ry="${v / 2 - 6}" fill="#6a4a32" ${S}/>`,
      boat: (u, v) => `<path d="M2 ${v / 2} Q ${u * .15} 2 ${u * .5} 2 L ${u - 2} 2 L ${u - 2} ${v - 2} L ${u * .5} ${v - 2} Q ${u * .15} ${v - 2} 2 ${v / 2} Z" fill="#6a4a32" ${S}/>` + L(u * .4, 4, u * .4, v - 4, .8) + L(u * .7, 4, u * .7, v - 4, .8),
      seats: (u, v) => { let s = ""; for (let y = 3; y < v - 4; y += 8) for (let x = 3; x < u - 4; x += 9) s += R(x, y, 7, 6, "#7a1a24"); return s; },
      ring: (u, v) => R(2, 2, u - 4, v - 4, "#d6c08e", `stroke="#8a2a2a" stroke-width="3"`) + [[2, 2], [u - 2, 2], [2, v - 2], [u - 2, v - 2]].map(([x, y]) => Ci(x, y, 2.5, "#5a3d28")).join(""),
      jars: (u, v) => R(1, 2, u - 2, v - 4, "#6a4a32") + Array.from({ length: Math.floor((u - 4) / 6) }, (_, i) => Ci(5 + i * 6, v / 2, 2.4, "#cfdcc0")).join(""),
      lathe: (u, v) => R(1, v / 2 - 5, u - 2, 10, "#5a5a58") + Ci(6, v / 2, 5, "#7a7a78") + L(10, v / 2, u - 4, v / 2, 1.5, "#ccc"),
      sign: (u, v) => R(1, v / 2 - 3, u - 2, 6, "#2a3a2a") + L(4, v / 2, u - 4, v / 2, .6, "#c9a15a"),
      lampost: (u, v) => `<circle cx="${u / 2}" cy="${v / 2}" r="9" fill="#ffe7a0" opacity=".35"/>` + Ci(u / 2, v / 2, 2.6, "#2a2a2a"),
      brazier: (u, v) => `<circle cx="${u / 2}" cy="${v / 2}" r="10" fill="#ffb060" opacity=".35"/>` + Ci(u / 2, v / 2, 5, IR) + Ci(u / 2, v / 2, 2.5, "#f08a2a"),
      washing: (u, v) => L(0, v / 2, u, v / 2, .6) + Array.from({ length: Math.floor(u / 9) }, (_, i) => R(i * 9 + 2, v / 2, 6, 5, ["#e8e2d4", "#c9d4dc", "#d8c8b8"][i % 3])).join(""),
      vault: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, "#8a8a84") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 7, "#a8a8a2") + L(u / 2 - 5, v / 2, u / 2 + 5, v / 2, 2),
      plinth: (u, v) => R(3, 3, u - 6, v - 6, "#d8d0bc") + Ci(u / 2, v / 2, 3, "#5a3d28"),
      cage: (u, v) => R(2, 2, u - 4, v - 4, "none", `stroke-dasharray="2 2"`),
      heap: (u, v, o) => `<ellipse cx="${u / 2}" cy="${v / 2}" rx="${u / 2 - 2}" ry="${v / 2 - 2}" fill="${o || "#8a7a62"}" ${S}/>`,
      sigil: (u, v) => `<g stroke="#f4efe2" stroke-width="1.4" fill="none"><circle cx="${u / 2}" cy="${v / 2}" r="6"/>${Array.from({ length: 7 }, (_, i) => { const a = i * 2 * Math.PI / 7 - Math.PI / 2; return `<line x1="${u / 2}" y1="${v / 2}" x2="${u / 2 + 10 * Math.cos(a)}" y2="${v / 2 + 10 * Math.sin(a)}"/>`; }).join("")}</g>`,
      x: () => ""
    };
  })();
  // ---- furnishing presets (room opts.fx), laid out against a back wall at the top of a w x h box
  const LMX_FX = {
    bedroom: (w, h) => [w >= 3 ? ["dbed", .2, .1, 2, 2] : ["bed", .1, .1, 1.2, 2], ["wash", w - 1.1, .1, 1, .8], ["chest", .2, h - 1, 1.2, .8, 180], ["chair", w - 1, h - 1, .8, .8], ...(w >= 3 && h >= 3 ? [["rug", w / 2 - .8, h / 2 - .2, 1.6, 1.2, 0, 0, "#5a3a34"]] : [])],
    garret: (w, h) => [["cot", .1, .1, 1, 2], ["chest", w - 1.3, .1, 1.2, .8], ["crate", w - 1, h - 1, 1, 1], ["candle", 1.2, .3, .5, .5]],
    dorm: (w, h) => { const o = [], n = Math.max(1, Math.floor((w - .2) / 1.5)); for (let i = 0; i < n; i++) { o.push(["bed", .2 + i * 1.5, .1, 1.1, 1.9]); if (h >= 5) o.push(["bed", .2 + i * 1.5, h - 2, 1.1, 1.9, 180]); } return o; },
    ward: (w, h) => { const o = [], n = Math.max(1, Math.floor((w - .2) / 1.6)); for (let i = 0; i < n; i++) { o.push(["cot", .3 + i * 1.6, .1, 1, 1.9]); if (h >= 5) o.push(["cot", .3 + i * 1.6, h - 2, 1, 1.9, 180]); } if (h >= 6) o.push(["tbl", w / 2 - .7, h / 2 - .5, 1.4, 1]); return o; },
    cell: (w, h) => [["cot", .1, .1, .9, 1.8], ["bin", w - .8, h - .8, .7, .7]],
    kitchen: (w, h) => [["range", .1, 0, 1.6, .9], ["dresser", w - 1.1, .1, 1, 2, 90], ["dine", w / 2 - 1.1, h / 2 - .6, 2.2, 1.6], ...(h >= 4 ? [["sink", .1, h - 1, 1, 1, 180]] : [])],
    scullery: (w, h) => [["sink", .1, .1, 1, 1], ["copper", w - 1.1, .1, 1, 1], ...(h >= 3 ? [["tub", .2, h - 1, 1, 1]] : [])],
    wash: (w, h) => [["copper", .1, .1, 1, 1], ["copper", 1.2, .1, 1, 1], ["mangle", w - 1.2, .1, 1.1, 1], ["tub", .2, h - 1.1, 1, 1], ["washing", .5, h / 2 - .3, w - 1, .6]],
    parlour: (w, h) => [["fp", w / 2 - .8, 0, 1.6, .7], ["arm", w / 2 - 1.8, 1, 1, 1], ["arm", w / 2 + .8, 1, 1, 1], ["rug", w / 2 - 1.2, 1.4, 2.4, 1.6, 0, 0, "#3d5a3e"], ["sofa", w / 2 - 1.2, h - 1.1, 2.4, 1, 180], ["pic", .3, 0, 1.2, .3], ["rtbl", w - 1.1, h - 1.1, 1, 1]],
    dining: (w, h) => [["fp", .3, 0, 1.6, .7], ["dresser", w - 2.2, .1, 2, .8], ["dine", w / 2 - Math.min(2, w / 2 - .5), h / 2 - .9, Math.min(4, w - 1), 1.9], ["clock", w - .9, h - .9, .8, .8, 180]],
    office: (w, h) => [["desk", .3, .1, 1.6, 1.2], ["files", w - 1.8, .1, 1.7, .5], ["cabinet", w - .9, h - 1.6, .8, 1.5, 270], ["chair", .5, h - 1, .8, .8], ["shelf", 2.1, .05, Math.max(.8, w - 4.1), .4]],
    library: (w, h) => [["book", .1, 0, w - .2, .4], ["book", 0, .6, .4, h - 1.2, 270], ["desk", w / 2 - .8, h / 2 - .4, 1.6, 1.2], ["arm", w - 1.1, h - 1.1, 1, 1], ["lamp", w / 2 + .9, h / 2 - .5, .6, .6]],
    store: (w, h) => [["crate", .1, .1, Math.min(2, w - .2), 1], ["sack", w - 1.6, .2, 1.5, .8], ["barrel", .1, h - 1, 1, 1], ...(w >= 3 ? [["crate", w - 1.1, h - 1.1, 1, 1]] : [])],
    shop: (w, h) => [["shelf", .1, 0, w - .2, .4], ["counter", .6, 1.4, w - 1.2, .8], ["till", w - 1.4, 1.4, .8, .8], ["disp", .2, h - 1.1, 1.2, .9]],
    workshop: (w, h) => [["work", .1, .1, Math.min(2.4, w - .2), .9], ["work", 0, 1.4, .9, Math.min(2, h - 1.6), 270], ["stool", 1.3, 1.3, .6, .6], ["heap", w - 1.4, h - 1.2, 1.2, 1, 0, 0, "#9a7a52"], ["shelf", w - 1.6, 0, 1.5, .4]],
    privy: () => [["privy", 0, 0, 1, 1.6]],
    yard: (w, h) => [["pump", .2, .2, .8, .8], ["bin", w - 1, .1, .9, .9], ["washing", .5, h / 2, w - 1, .8], ["barrel", w - 1.1, h - 1.1, 1, 1]],
    cellar: (w, h) => [["barrel", .1, .1, 2, 1], ["crate", w - 1.1, .1, 1, 1], ["coal", .1, h - 1.4, 1.6, 1.3], ...(w >= 4 ? [["sack", w - 1.7, h - .9, 1.5, .8]] : [])],
    coalhole: (w, h) => [["coal", .1, .1, w - .2, h - .4]],
    attic: (w, h) => [["chest", .2, .1, 1.2, .8], ["crate", w - 1.1, .1, 1, 1], ["heap", 1.6, h - 1.1, 1.4, 1, 0, 0, "#8a7a62"], ["cot", w - 1.1, h - 2, 1, 1.9, 180]],
    chapel: (w, h) => { const o = [["altar", w / 2 - .8, .1, 1.6, .8]]; for (let y = 1.6; y < h - .6; y += 1.1) { o.push(["pew", .3, y, w / 2 - .7, .7]); o.push(["pew", w / 2 + .4, y, w / 2 - .7, .7]); } return o; },
    classroom: (w, h) => { const o = [["desk", w / 2 - .8, .1, 1.6, 1.1], ["board", 0, 0, 0, 0]]; for (let y = 1.8; y < h - .5; y += 1.1) o.push(["bench", .4, y, w - .8, .6]); return o.filter(x => x[0] !== "board"); },
    bar: (w, h) => [["bar", .2, 0, Math.min(w - .4, 4), 1], ["barrel", w - 1.1, .1, 1, 1], ["rtbl", .5, h - 1.4, 1, 1], ["stool", 1.6, h - 1.2, .6, .6], ...(w >= 5 ? [["rtbl", w - 1.6, h - 1.4, 1, 1]] : [])],
    taproom: (w, h) => { const o = [["fp", .2, 0, 1.4, .6]]; for (let i = 0; i < Math.floor(w / 2.4); i++) o.push(["tbl", .4 + i * 2.4, h / 2 - .4, 1.4, 1], ["stool", .6 + i * 2.4, h / 2 + .7, .6, .6]); return o; },
    surgery: (w, h) => [["slab", w / 2 - 1, h / 2 - .5, 2, 1], ["cabinet", .1, .1, 1.4, .6], ["jars", 1.6, .1, Math.max(1, w - 2.8), .5], ["sink", w - 1.1, .1, 1, 1], ["stool", w / 2 - .3, h / 2 + .7, .6, .6]],
    lab: (w, h) => [["work", .1, .1, w - .2, .8], ["jars", .1, h - .7, Math.max(1, w - 1.4), .6, 180], ["stove", w - 1, h - 1, .9, .9], ["stool", 1, 1.1, .6, .6]],
    vestry: (w, h) => [["ward", .1, .1, 1.4, .7], ["tbl", w / 2 - .6, h / 2 - .4, 1.2, .9], ["chest", w - 1.3, .1, 1.2, .8], ["chair", w / 2 - .4, h / 2 + .5, .7, .7]],
    stable: (w, h) => [["trough", .2, .1, Math.min(2.6, w - .4), .6], ["heap", w - 1.6, h - 1.4, 1.5, 1.2, 0, 0, "#c9a85a"], ["fence", w / 2, .8, .3, h - 1]],
    boiler: (w, h) => [["furnace", .2, .2, 1.6, 1.6], ["pipes", 2, 0, Math.max(.8, w - 2.2), .5], ["coal", w - 1.6, h - 1.4, 1.5, 1.3]],
    strong: (w, h) => [["safe", .2, .1, 1, 1], ["files", 1.4, .05, Math.max(.8, w - 1.6), .5], ["drawers", w - 1.2, h - 1.2, 1.1, 1.1]],
    landing: () => [],
    hall: (w, h) => [["rug", .2, .2, Math.max(.8, w - .4), Math.max(.8, h - .4), 0, 0, "#6a3a34"]],
    shed: (w, h) => [["work", .1, .1, Math.min(2, w - .2), .8], ["barrel", w - 1, h - 1, .9, .9], ["heap", .2, h - 1.1, 1.2, 1, 0, 0, "#8a7a62"]],
    pantry: (w, h) => [["shelf", .05, 0, w - .1, .4], ["jars", .1, h - .6, w - .2, .5, 180], ["sack", w - 1.2, h / 2 - .4, 1.1, .7]],
    nursery: (w, h) => [["cradle", .3, .2, 1, 1.4], ["cot", w - 1.2, .1, 1, 1.9], ["chair", w / 2 - .4, h - 1, .8, .8], ["rug", w / 2 - .7, h / 2 - .5, 1.4, 1, 0, 0, "#33456a"]],
    waiting: (w, h) => [["bench", .2, .1, w - .4, .6], ["bench", .2, h - .7, w - .4, .6, 180], ["clock", w / 2 - .4, 0, .8, .4]],
    ice: (w, h) => [["slab", .2, .2, 2, 1], ["drawers", w - 2.2, .05, 2.1, .9]],
    quay: () => []
  };
  // ---- more fittings, for other periods and settings
  (() => {
    const S = `stroke="${LM_INK}" stroke-width="1"`;
    const R = (x, y, w, h, f, x2 = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${S} ${x2}/>`;
    const Ci = (x, y, r, f, x2 = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${S} ${x2}/>`;
    const L = (x1, y1, x2, y2, w = 1, c = LM_INK) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
    Object.assign(LMI, {
      bell: (u, v) => `<path d="M${u * .2} ${v * .85} Q${u * .2} ${v * .15} ${u / 2} ${v * .1} Q${u * .8} ${v * .15} ${u * .8} ${v * .85} Z" fill="#b8903a" ${S}/><circle cx="${u / 2}" cy="${v * .9}" r="2.2" fill="${LM_INK}"/>`,
      box: (u, v, o) => R(1, 1, u - 2, v - 2, o || "#9a9488"),
      disc: (u, v, o) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 1.5, o || "#9a9488"),
      grave: (u, v) => `<rect x="2" y="2" width="${u - 4}" height="${v - 4}" rx="2" fill="#b9b2a3" ${S}/>` + L(4, 6, u - 4, 6, .8, "#7d776a"),
      cross: (u, v) => R(u / 2 - 1.5, 2, 3, v - 4, "#b9b2a3") + R(u / 2 - 5, v * .3, 10, 3, "#b9b2a3"),
      statue: (u, v) => R(3, 3, u - 6, v - 6, "#d8d0bc") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 6, "#b9b2a3") + Ci(u / 2, v / 2, 2, "#8a8476"),
      throne: (u, v) => R(u / 2 - 7, v / 2 - 5, 14, 12, "#7a3a3a") + R(u / 2 - 8, v / 2 - 8, 16, 5, "#b8903a"),
      fountain: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, "#b9b2a3") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 6, "#8fb0ae") + Ci(u / 2, v / 2, 2, "#b9b2a3"),
      bush: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, "#7d9465", `opacity=".9"`),
      boulder: (u, v) => `<path d="M3 ${v * .6} Q${u * .1} ${v * .15} ${u * .45} ${v * .12} Q${u * .9} ${v * .1} ${u - 3} ${v * .55} Q${u * .85} ${v - 3} ${u * .4} ${v - 3} Q${u * .1} ${v - 3} 3 ${v * .6} Z" fill="#8f897c" ${S}/>`,
      tent: (u, v) => R(2, 2, u - 4, v - 4, "#c9b98f") + L(2, 2, u - 2, v - 2, .8) + L(u - 2, 2, 2, v - 2, .8),
      campfire: (u, v) => `<circle cx="${u / 2}" cy="${v / 2}" r="10" fill="#ffb060" opacity=".35"/>` + Ci(u / 2, v / 2, 4.5, "#5a4632") + Ci(u / 2, v / 2, 2.2, "#f08a2a"),
      rack: (u, v) => { let s = R(0, 1, u, Math.min(v, 9) - 2, "#5c6168"); for (let x = 3; x < u - 2; x += 5) s += L(x, 2, x, Math.min(v, 9) - 2, 1, "#c9ced3"); return s; },
      locker: (u, v) => { let s = R(0, 0, u, Math.min(v, 10), "#7c8791"); for (let x = 8; x < u; x += 8) s += L(x, 0, x, Math.min(v, 10), .8); for (let x = 4; x < u; x += 8) s += L(x - 1, 3, x + 1, 3, .8); return s; },
      console: (u, v) => R(0, 0, u, v * .6, "#3b4a57") + `<rect x="3" y="2" width="${u - 6}" height="${Math.max(3, v * .28)}" fill="#8fd0d8" opacity=".85"/>` + [0.25, .5, .75].map(t => Ci(u * t, v * .48, 1.2, "#e6b84a", `stroke="none"`)).join(""),
      screen: (u, v) => R(1, 0, u - 2, 4, "#22303a") + `<rect x="3" y="1" width="${u - 6}" height="2" fill="#8fd0d8"/>`,
      pod: (u, v) => `<rect x="2" y="1" width="${u - 4}" height="${v - 2}" rx="${Math.min(u, v) / 2 - 2}" fill="#aab4bb" ${S}/><rect x="5" y="4" width="${u - 10}" height="${Math.max(4, v * .45)}" rx="4" fill="#cfe0e6" stroke="${LM_INK}" stroke-width=".5"/>`,
      tank: (u, v) => Ci(u / 2, v / 2, Math.min(u, v) / 2 - 2, "#8d959b") + Ci(u / 2, v / 2, Math.min(u, v) / 2 - 6, "#a9c4c4") + L(u / 2 - 3, v / 2, u / 2 + 3, v / 2, 1.2),
      generator: (u, v) => R(1, 2, u - 2, v - 4, "#5c6168") + Ci(u * .3, v / 2, Math.min(u, v) / 4, "#8d959b") + L(u * .55, v * .35, u - 4, v * .35, 1.2, "#e6b84a") + L(u * .55, v * .65, u - 4, v * .65, 1.2, "#e6b84a"),
      vehicle: (u, v, o) => `<rect x="2" y="2" width="${u - 4}" height="${v - 4}" rx="6" fill="${o || "#5a6a78"}" ${S}/><rect x="${u * .18}" y="5" width="${u * .22}" height="${v - 10}" fill="#cfe0e6" stroke="${LM_INK}" stroke-width=".5"/><rect x="${u * .68}" y="5" width="${u * .14}" height="${v - 10}" fill="#cfe0e6" stroke="${LM_INK}" stroke-width=".5"/>`,
      crystal: (u, v) => `<polygon points="${u / 2},2 ${u - 3},${v * .4} ${u * .7},${v - 2} ${u * .3},${v - 2} 3,${v * .4}" fill="#b9a6dc" ${S}/>` + L(u / 2, 2, u / 2, v - 2, .6, "#7d68ad"),
      portal: (u, v) => `<ellipse cx="${u / 2}" cy="${v / 2}" rx="${u / 2 - 2}" ry="${v / 2 - 2}" fill="#3a2a5a" ${S}/><ellipse cx="${u / 2}" cy="${v / 2}" rx="${u / 2 - 6}" ry="${v / 2 - 6}" fill="#8f7fd0" opacity=".7"/>`,
      chalk: (u, v) => `<g stroke="#f4efe2" stroke-width="1.4" fill="none"><circle cx="${u / 2}" cy="${v / 2}" r="${Math.min(u, v) / 2 - 3}"/><path d="M${u / 2} 3 V${v - 3} M3 ${v / 2} H${u - 3}"/></g>`
    });
  })();
  function customItem(d) {
    const S = `stroke="${LM_INK}" stroke-width="1"`;
    return (u, v, o) => {
      const f = o || d.fill || "#9a9488", r = Math.min(u, v) / 2 - 1.5;
      const body = d.shape === "round" ? `<circle cx="${u / 2}" cy="${v / 2}" r="${r}" fill="${f}" ${S}/>` : d.shape === "diamond" ? `<polygon points="${u / 2},1 ${u - 1},${v / 2} ${u / 2},${v - 1} 1,${v / 2}" fill="${f}" ${S}/>` : `<rect x="1" y="1" width="${u - 2}" height="${v - 2}" rx="${d.shape === "soft" ? 4 : 0}" fill="${f}" ${S}/>`;
      return body + (d.glyph ? `<text x="${u / 2}" y="${v / 2 + 3}" text-anchor="middle" font-family="${A.config.fonts.mono}" font-size="8.5" font-weight="700" fill="${d.ink || "#fff"}">${esc(d.glyph)}</text>` : "");
    };
  }
  function itemFn(code) { return LMI[code] || (A.config.items[code] ? customItem(A.config.items[code]) : null); }
  // an item may restate an attribute to override the default stroke; keep the last one so the file is valid on its own
  function tidy(s) {
    return s.replace(/<[a-z]+\s[^<>]*>/g, tag => {
      const at = [...tag.matchAll(/\s([\w:-]+)="([^"]*)"/g)], names = at.map(a => a[1]);
      if (new Set(names).size === names.length) return tag;
      const last = new Map(); for (const a of at) last.set(a[1], a[2]);
      return `<${tag.match(/^<([a-z]+)/)[1]}${[...last].map(([k, v]) => ` ${k}="${v}"`).join("")}${tag.endsWith("/>") ? "/>" : ">"}`;
    });
  }
  function drawItem(it) {
    const [code, x, y, w = 1, h = 1, rot = 0, , col] = it;
    const X = x * C, Y = y * C, W = w * C, H = h * C, sw = rot % 180 !== 0, u = sw ? H : W, v = sw ? W : H;
    const f = itemFn(code);
    const body = f ? f(u, v, col) : `<rect x="1" y="1" width="${u - 2}" height="${v - 2}" fill="none" stroke="#b23a2e" stroke-dasharray="3 2"/><text x="${u / 2}" y="${v / 2 + 3}" text-anchor="middle" font-size="9" fill="#b23a2e">?</text>`;
    return `<g transform="translate(${X + W / 2} ${Y + H / 2}) rotate(${rot}) translate(${-u / 2} ${-v / 2})">${tidy(body)}</g>`;
  }

  const MK0 = { C: ["#b7791f", "Clue"], N: ["#2c5a85", "Person"], S: ["#6a3f9e", "Secret"], E: ["#a12a2a", "Encounter or danger"], K: ["#2f6b3a", "Key item"] };
  function markers() { return Object.assign({}, MK0, A.config.markers || {}); }
  // which directory a marker letter belongs to
  function dirOf(mid) { const l = mid[0]; return l === "N" ? "npcs" : l === "S" ? "secrets" : l === "E" ? "enc" : "clues"; }

  /* ---- bigger versions of a map. The original is never changed. Each entry of `expand` describes how to enlarge
          the level before it: extra grid on each side, new rooms, wings, neighbours and floors. */
  function furnish(r) {
    const [, x, y, w, h, , , o = {}] = r, fx = LMX_FX[o.fx]; if (!fx) return [];
    const bk = o.bk || "n", sw = bk === "e" || bk === "w", lw = sw ? h : w, lh = sw ? w : h;
    return fx(lw, lh).map(([code, lx, ly, iw, ih, rot = 0, , col]) => {
      let X, Y, W, H, R;
      if (bk === "n") { X = x + lx; Y = y + ly; W = iw; H = ih; R = rot; }
      else if (bk === "s") { X = x + w - lx - iw; Y = y + h - ly - ih; W = iw; H = ih; R = rot + 180; }
      else if (bk === "e") { X = x + w - ly - ih; Y = y + lx; W = ih; H = iw; R = rot + 90; }
      else { X = x + ly; Y = y + h - lx - iw; W = ih; H = iw; R = rot + 270; }
      const it = [code, +X.toFixed(2), +Y.toFixed(2), +W.toFixed(2), +H.toFixed(2), R % 360]; if (col) it.push(0, col); return it;
    });
  }
  function doorCells(F) {
    const s = new Set();
    for (const [x, y, o, type = "d", len = 1] of (F.D || [])) for (let k = 0; k < len; k++) {
      if (type === "w") continue;
      if (o === "h") { s.add((x + k) + ":" + (y - 1)); s.add((x + k) + ":" + y); } else { s.add((x - 1) + ":" + (y + k)); s.add(x + ":" + (y + k)); }
    }
    for (const st of (F.ST || [])) for (let j = Math.floor(st[2]); j < st[2] + st[4]; j++) for (let i = Math.floor(st[1]); i < st[1] + st[3]; i++) s.add(i + ":" + j);
    return s;
  }
  function hits(it, cells) {
    const [, x, y, w = 1, h = 1] = it;
    for (let j = Math.floor(y + .05); j < y + h - .05; j++) for (let i = Math.floor(x + .05); i < x + w - .05; i++) if (cells.has(i + ":" + j)) return true;
    return false;
  }
  function finish(F, rects) {
    // furnish the rooms that ask for it (opts.fx), keeping doorways and stairs clear
    const items = [];
    for (const r of rects) if (r[7] && r[7].fx) items.push(...furnish(r));
    if (items.length) { const cells = doorCells(F); F.I = (F.I || []).concat(items.filter(it => !hits(it, cells))); }
    return F;
  }
  function layer(B, X, tag) {
    const M = Object.assign({}, B, { big: 1 });
    M.floors = B.floors.map((F0, fi) => {
      const add = (X.floors || {})[fi] || {}, drop = new Set(add.drop || []), [gl, gt, gr, gb] = (X.growF && X.growF[fi]) || X.grow || [0, 0, 0, 0];
      const F = Object.assign({}, F0, { w: add.w || F0.w + gl + gr, h: add.h || F0.h + gt + gb });
      F.R = F0.R.filter(r => !drop.has(r[0])).map(r => {
        let [id, x, y, w, h, n, kind, o] = r; x += gl; y += gt;
        if (o && o.l) o = Object.assign({}, o, { l: [o.l[0] + gl, o.l[1] + gt] });
        const kd = kindOf(kind);
        if (kd && kd.stretch && !X.nostretch) { if (r[1] === 0) { x -= gl; w += gl; } if (r[1] + r[3] >= F0.w) w = F.w - x; if (r[2] === 0) { y -= gt; h += gt; } if (r[2] + r[4] >= F0.h) h = F.h - y; }
        return o === undefined ? [id, x, y, w, h, n, kind] : [id, x, y, w, h, n, kind, o];
      }).concat(add.R || []);
      F.D = (F0.D || []).map(d => [d[0] + gl, d[1] + gt, ...d.slice(2)]).filter(d => !(add.dropD || []).some(([x, y, o]) => d[0] === x && d[1] === y && d[2] === o)).concat(add.D || []);
      F.I = (F0.I || []).map(i => [i[0], i[1] + gl, i[2] + gt, ...i.slice(3)]).filter(i => !(add.dropI || []).some(([c, x, y]) => c === i[0] && Math.abs(x - i[1]) < .01 && Math.abs(y - i[2]) < .01)).concat(add.I || []);
      F.ST = (F0.ST || []).map(st => [st[0], st[1] + gl, st[2] + gt, ...st.slice(3)]).concat(add.ST || []);
      F.M = (F0.M || []).map(mk => [mk[0], mk[1] + gl, mk[2] + gt]).concat(add.M || []);
      if (add.n) F.n = add.n;
      if (add.note) F.note = add.note;
      return finish(F, add.R || []);
    }).concat((X.add || []).map(F0 => { const F = Object.assign({ D: [], I: [], ST: [], M: [] }, F0); F.I = (F.I || []).slice(); return finish(F, F.R); }));
    // button order: an added floor reached by an "up" stair goes right after the floor it is reached from; others go last
    const nb = B.floors.length, order = (B.order || B.floors.map((_, i) => i)).slice();
    for (let i = nb; i < M.floors.length; i++) {
      let parent = -1;
      M.floors.forEach((G, gi) => { if (gi === i) return; for (const st of (G.ST || [])) if (st[5] === "up" && (M.floors[i].ST || []).some(t => t[0] === st[0])) parent = gi; });
      const at = parent >= 0 ? order.indexOf(parent) : -1;
      if (at >= 0) order.splice(at + 1, 0, i); else order.push(i);
    }
    M.order = X.order || order;
    for (const key of ["rooms", "clues", "npcs", "secrets", "enc"]) if (X[key] || B[key]) M[key] = Object.assign({}, B[key] || {}, X[key] || {});
    if (X.ov) M.ov = (B.ov ? B.ov + " " : "") + tag + " map: " + X.ov;
    if (X.run) M.run = (B.run ? B.run + " " : "") + X.run;
    if (X.ext) M.ext = X.ext;
    return M;
  }
  const keyOf = id => { const M = A.maps[id]; return (M && M.alias) || id; };
  const levels = id => (A.exp[keyOf(id)] || []).length;
  const sizeName = lv => A.config.sizeNames[lv] || "Size " + (lv + 1);
  function expanded(k, level) {
    level = Math.max(0, Math.min(level == null ? 99 : level, (A.exp[k] || []).length));
    if (!level) return A.maps[k];
    const ck = k + "@" + level; if (A.state.cache[ck]) return A.state.cache[ck];
    const X = A.exp[k][level - 1];
    return (A.state.cache[ck] = layer(expanded(k, level - 1), X, X.label || sizeName(level)));
  }
  const levelFor = id => Math.min(A.state.level, levels(id));
  function get(id, level) { if (!A.maps[id]) return null; return expanded(keyOf(id), level == null ? levelFor(id) : level); }
  const isGmFloor = F => !!(F.gm || F.k);

  /* ---- drawing one floor */
  function win(x, y, o, len) {
    const P = paper();
    if (o === "h") return `<rect x="${x * C + 4}" y="${y * C - 2.5}" width="${len * C - 8}" height="5" fill="#f3f6f4" stroke="${P.ink}" stroke-width="1"/><line x1="${x * C + 4}" y1="${y * C}" x2="${(x + len) * C - 4}" y2="${y * C}" stroke="#7aa0b0" stroke-width="1"/>`;
    return `<rect x="${x * C - 2.5}" y="${y * C + 4}" width="5" height="${len * C - 8}" fill="#f3f6f4" stroke="${P.ink}" stroke-width="1"/><line x1="${x * C}" y1="${y * C + 4}" x2="${x * C}" y2="${(y + len) * C - 4}" stroke="#7aa0b0" stroke-width="1"/>`;
  }
  function door(x, y, o, type, len, sd) {
    const L = len * C, ink = paper().ink;
    const jamb = o === "h" ? `<rect x="${x * C - 3}" y="${y * C - 3.5}" width="5" height="7" fill="${ink}"/><rect x="${x * C + L - 2}" y="${y * C - 3.5}" width="5" height="7" fill="${ink}"/>` : `<rect x="${x * C - 3.5}" y="${y * C - 3}" width="7" height="5" fill="${ink}"/><rect x="${x * C - 3.5}" y="${y * C + L - 2}" width="7" height="5" fill="${ink}"/>`;
    if (type === "a") return jamb;
    if (type === "s") return o === "h" ? `<line x1="${x * C}" y1="${y * C}" x2="${x * C + L}" y2="${y * C}" stroke="#6a3f9e" stroke-width="5" stroke-dasharray="4 3"/>` : `<line x1="${x * C}" y1="${y * C}" x2="${x * C}" y2="${y * C + L}" stroke="#6a3f9e" stroke-width="5" stroke-dasharray="4 3"/>`;
    if (type === "g") return jamb + (o === "h" ? `<line x1="${x * C}" y1="${y * C}" x2="${x * C + L}" y2="${y * C}" stroke="${ink}" stroke-width="1.5" stroke-dasharray="3 2"/>` : `<line x1="${x * C}" y1="${y * C}" x2="${x * C}" y2="${y * C + L}" stroke="${ink}" stroke-width="1.5" stroke-dasharray="3 2"/>`);
    const leaf = (hx, hy, lw) => {
      if (o === "h") { const ey = hy + sd * lw; return `<line x1="${hx}" y1="${hy}" x2="${hx}" y2="${ey}" stroke="${ink}" stroke-width="1.8"/><path d="M${hx} ${ey} A ${lw} ${lw} 0 0 ${(sd > 0) === (hx === x * C) ? 0 : 1} ${hx + (hx === x * C ? lw : -lw)} ${hy}" fill="none" stroke="${ink}" stroke-width=".6" stroke-dasharray="2 1.5"/>`; }
      const ex = hx + sd * lw; return `<line x1="${hx}" y1="${hy}" x2="${ex}" y2="${hy}" stroke="${ink}" stroke-width="1.8"/><path d="M${ex} ${hy} A ${lw} ${lw} 0 0 ${(sd > 0) === (hy === y * C) ? 1 : 0} ${hx} ${hy + (hy === y * C ? lw : -lw)}" fill="none" stroke="${ink}" stroke-width=".6" stroke-dasharray="2 1.5"/>`;
    };
    if (type === "dd") return jamb + (o === "h" ? leaf(x * C, y * C, L / 2) + leaf(x * C + L, y * C, L / 2) : leaf(x * C, y * C, L / 2) + leaf(x * C, y * C + L, L / 2));
    return jamb + leaf(x * C, y * C, L - 2);
  }
  function stair(st, gm) {
    const [sid, x, y, w, h, ud, to, dir = "n"] = st, P = paper(), X = x * C, Y = y * C, Wd = w * C, Hd = h * C, mono = A.config.fonts.mono;
    let s = `<rect x="${X}" y="${Y}" width="${Wd}" height="${Hd}" fill="${P.stair}" stroke="${P.ink}" stroke-width="1.2"/>`;
    const vert = dir === "n" || dir === "s";
    if (vert) for (let yy = Y + 4; yy < Y + Hd; yy += 5) s += `<line x1="${X}" y1="${yy}" x2="${X + Wd}" y2="${yy}" stroke="${P.ink}" stroke-width=".7"/>`;
    else for (let xx = X + 4; xx < X + Wd; xx += 5) s += `<line x1="${xx}" y1="${Y}" x2="${xx}" y2="${Y + Hd}" stroke="${P.ink}" stroke-width=".7"/>`;
    const cx = X + Wd / 2, cy = Y + Hd / 2, len = (vert ? Hd : Wd) / 2 - 4, dx = { n: 0, s: 0, e: 1, w: -1 }[dir], dy = { n: -1, s: 1, e: 0, w: 0 }[dir];
    s += `<line x1="${cx - dx * len}" y1="${cy - dy * len}" x2="${cx + dx * len}" y2="${cy + dy * len}" stroke="${P.accent}" stroke-width="1.8"/><path d="M${cx + dx * len} ${cy + dy * len} l ${-dx * 6 - dy * 4} ${-dy * 6 - dx * 4} M${cx + dx * len} ${cy + dy * len} l ${-dx * 6 + dy * 4} ${-dy * 6 + dx * 4}" stroke="${P.accent}" stroke-width="1.8" fill="none"/>`;
    const label = (ud === "up" ? "↑ " : "↓ ") + to, rot = vert && Hd > Wd + 10 ? -90 : 0;
    s += `<text x="${cx}" y="${cy + (rot ? 0 : -3)}" transform="rotate(${rot} ${cx} ${cy})" dy="${rot ? -6 : 0}" text-anchor="middle" font-family="${mono}" font-size="7" font-weight="600" fill="${P.accent}" paint-order="stroke" stroke="${P.halo}" stroke-width="2.5">${esc(label)}</text>`;
    if (gm) s += `<g class="lm-mk" data-ref="${sid}"><rect x="${X + 1}" y="${Y + 1}" width="${sid.length * 6 + 6}" height="11" rx="2" fill="#4a4a48"/><text x="${X + 4}" y="${Y + 9.5}" font-family="${mono}" font-size="8" font-weight="700" fill="#fff">${sid}</text></g>`;
    return s;
  }
  function svg(id, fi, view, pre, level) {
    const M = get(id, level), F = M.floors[fi], gm = view !== "player", P = paper(), cfg = A.config, mono = cfg.fonts.mono, lab = cfg.fonts.label;
    pre = pre || "p";
    const top = 40, bot = 30, side = 10, W = F.w * C, H = F.h * C;
    // who owns each square
    const own = Array.from({ length: F.h }, () => Array(F.w).fill(null)), first = {}, used = new Set();
    for (const r of F.R) {
      const [rid, x, y, w, h, , kind, o = {}] = r;
      if (o.h && !gm) continue;
      used.add(kind);
      if (!first[rid]) first[rid] = r;
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < F.h && i >= 0 && i < F.w) own[j][i] = { rid, kind, o };
    }
    const at = (i, j) => (i < 0 || j < 0 || i >= F.w || j >= F.h) ? null : own[j][i];
    const indoor = c => !!c && isIndoorKind(c.kind);
    const winOK = c => cfg.autoWindows && c && !(kindOf(c.kind) || {}).nowin && !(c.o && c.o.nw);
    // doors open gaps in the walls
    const gap = new Set(), doorSVG = [];
    for (const d of (F.D || [])) {
      const [x, y, o, type = "d", len = 1, side2 = 1] = d;
      if (type === "s" && !gm) continue;
      for (let k = 0; k < len; k++) gap.add(o + (o === "h" ? (x + k) + ":" + y : x + ":" + (y + k)));
      doorSVG.push(type === "w" ? win(x, y, o, len) : door(x, y, o, type, len, side2));
    }
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-side} ${-top} ${W + side * 2} ${H + top + bot}" class="lmap2"${M.big ? ` style="min-width:${Math.round((W + side * 2) * .95)}px"` : ""} role="img" aria-label="${esc(M.t)}, ${esc(F.n)}" data-loc="${id}">${defs(pre, used)}`;
    s += `<rect x="${-side}" y="${-top}" width="${W + side * 2}" height="${H + top + bot}" fill="${P.paper}"/>`;
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${pre}hx)"/>`;
    for (const r of F.R) {
      const [, x, y, w, h, , kind, o = {}] = r;
      if (o.h && !gm) continue;                      // a hidden room is simply not on the players' map
      const pt = patFor(kind);
      s += `<rect x="${x * C}" y="${y * C}" width="${w * C}" height="${h * C}" fill="${pt ? `url(#${pre}${pt.id})` : "#d9534f"}"/>`;
      if (o.h) s += `<rect x="${x * C}" y="${y * C}" width="${w * C}" height="${h * C}" fill="#6a3f9e" opacity=".12"/>`;
    }
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${pre}grid)"/>`;
    // fittings and stairs (nothing inside a hidden room shows on the players' map)
    const inHidden = (x, y) => F.R.some(r => r[7] && r[7].h && x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4]);
    for (const it of (F.I || [])) { if (!gm && (it[6] || inHidden(it[1] + (it[3] || 1) / 2, it[2] + (it[4] || 1) / 2))) continue; s += drawItem(it); }
    const gst = new Set(); M.floors.forEach(G => { if (isGmFloor(G)) (G.ST || []).forEach(x => gst.add(x[0])); });
    for (const st of (F.ST || [])) { if (!gm && (gst.has(st[0]) || inHidden(st[1] + st[3] / 2, st[2] + st[4] / 2))) continue; s += stair(st, gm); }
    // walls: thick between a room and anything that is not a room (or another building), thin between rooms
    let walls = "", inner = "", wins = "";
    for (let j = 0; j <= F.h; j++) for (let i = 0; i < F.w; i++) {
      const a = at(i, j - 1), b = at(i, j); if ((a && b && a.rid === b.rid) || (!indoor(a) && !indoor(b))) continue;
      if (gap.has("h" + i + ":" + j)) continue;
      const ext = !(indoor(a) && indoor(b)) || (a.o.b || "") !== (b.o.b || ""), seg = `M${i * C} ${j * C}H${(i + 1) * C}`;
      if (ext) { walls += seg; if (((a && isOut(a.kind)) || (b && isOut(b.kind))) && i % 2 === 1) { const room = indoor(a) ? a : b; if (winOK(room)) wins += win(i, j, "h", 1); } } else inner += seg;
    }
    for (let i = 0; i <= F.w; i++) for (let j = 0; j < F.h; j++) {
      const a = at(i - 1, j), b = at(i, j); if ((a && b && a.rid === b.rid) || (!indoor(a) && !indoor(b))) continue;
      if (gap.has("v" + i + ":" + j)) continue;
      const ext = !(indoor(a) && indoor(b)) || (a.o.b || "") !== (b.o.b || ""), seg = `M${i * C} ${j * C}V${(j + 1) * C}`;
      if (ext) { walls += seg; if (((a && isOut(a.kind)) || (b && isOut(b.kind))) && j % 2 === 1) { const room = indoor(a) ? a : b; if (winOK(room)) wins += win(i, j, "v", 1); } } else inner += seg;
    }
    s += `<path d="${inner}" stroke="${P.ink}" stroke-width="4" stroke-linecap="square" fill="none"/>`;
    s += `<path d="${walls}" stroke="${P.ink}" stroke-width="7" stroke-linecap="square" fill="none"/>`;
    s += wins + doorSVG.join("");
    // room numbers and names: the same ones the guide uses
    for (const rid in first) {
      const [, x, y, w, h, name, kind, o = {}] = first[rid];
      if (!name) continue;
      const [lx, ly] = o.l ? [o.l[0] * C, o.l[1] * C] : [(x + w / 2) * C, (y + h / 2) * C];
      const out = isOut(kind), fw = (w * C * .92) / (name.length * 5.4), fh = (h * C * .92) / (name.length * 5.4), vert = !o.l && fw < 8 && fh > fw * 1.4;
      const fs = Math.max(7, Math.min(out ? 12 : 10.5, vert ? fh : fw)), rot = vert ? ` transform="rotate(-90 ${lx} ${ly})"` : "";
      const dark = kind === "space" || kind === "coal";
      s += `<g class="lm-rl" data-ref="${rid}">`;
      if (isRoom(rid)) s += `<text x="${vert ? lx - fs - 1 : lx}" y="${vert ? ly : ly - fs - 1}" text-anchor="middle" font-family="${mono}" font-size="7.5" font-weight="600" fill="${gm ? P.accent : P.room}" paint-order="stroke" stroke="${P.halo}" stroke-width="2.5">${rid}</text>`;
      s += `<text x="${lx}" y="${ly}"${rot} text-anchor="middle" font-family="${lab}" font-size="${fs}" ${out ? 'font-style="italic" letter-spacing="1.5"' : 'letter-spacing=".4"'} fill="${P.ink}" paint-order="stroke" stroke="${P.halo}" stroke-width="${dark ? 3.6 : 3}">${esc(name)}</text></g>`;
    }
    if (gm) {
      const MK = markers();
      for (const [mid, x, y] of (F.M || [])) {
        const k = MK[mid[0]] || MK.C;
        s += `<g class="lm-mk" data-ref="${mid}"><circle cx="${x * C}" cy="${y * C}" r="9.5" fill="${k[0]}" stroke="${P.halo}" stroke-width="2"/><text x="${x * C}" y="${y * C + 3.2}" text-anchor="middle" font-family="${mono}" font-size="8.5" font-weight="700" fill="#fff">${mid}</text></g>`;
      }
    }
    // frame, title, scale, north
    const g = cfg.grid || { unit: 5, name: "ft" };
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${P.ink}" stroke-width="1.5"/>`;
    s += `<text x="0" y="${-22}" font-family="${lab}" font-size="17" letter-spacing="2" fill="${P.ink}">${esc(F.n)}</text>`;
    s += `<text x="0" y="${-8}" font-family="${mono}" font-size="8.5" letter-spacing="1" fill="${P.sub}">${esc(String(M.t || "").toUpperCase())} · ${gm ? esc(cfg.gm.toUpperCase()) + " VIEW" : "PLAYER VIEW"}</text>`;
    s += `<g transform="translate(0 ${H + 17})"><rect x="0" y="-4" width="${C * 4}" height="5" fill="none" stroke="${P.ink}"/><rect x="0" y="-4" width="${C}" height="5" fill="${P.ink}"/><rect x="${C * 2}" y="-4" width="${C}" height="5" fill="${P.ink}"/><text x="${C * 4 + 8}" y="1.5" font-family="${mono}" font-size="8.5" fill="${P.ink}">${g.unit * 4} ${esc(g.name)} · 1 square = ${g.unit} ${esc(g.name)}</text></g>`;
    if (cfg.compass && M.compass !== false) s += `<g transform="translate(${W - 10} ${-22})"><path d="M0 -10 L5 4 L0 0 L-5 4 Z" fill="${P.ink}"/><text x="0" y="14" text-anchor="middle" font-family="${lab}" font-size="10" fill="${P.ink}">N</text></g>`;
    return s + `</svg>`;
  }

  /* ---- the written guide, in the same numbers and names as the map */
  function nameOf(M, rid) { for (const F of M.floors) for (const r of F.R) if (r[0] === rid && r[5]) return r[5]; return ""; }
  function where(M, rid) { if (!rid) return ""; const n = nameOf(M, rid); return n ? `${rid} · ${n}` : rid; }
  function cnExtra(cn, pub) {
    if (!cn) return "";
    const low = (pub || "").toLowerCase();
    return cn.split(/;\s*/).map(p => p.trim().replace(/\.$/, "")).filter(p => p && !p.toLowerCase().split(/[^a-z0-9']+/).filter(w => w.length > 3 && !/^(down|from|onto|into|with|through|room|door|stair|stairs|below|above)$/.test(w)).every(w => low.includes(w))).join("; ");
  }
  function connections(M) {
    // every room's connections, worked out from the doors and stairs actually drawn on the map
    const con = {}, add = (rid, k, t) => { (con[rid] = con[rid] || []).push({ k, t }); };
    const DT = { d: "door", dd: "double doors", a: "opening", g: "gate", s: "secret door" };
    M.floors.forEach((F, fi) => {
      const own = Array.from({ length: F.h }, () => Array(F.w).fill(null)), local = {};
      for (const r of F.R) { const [rid, x, y, w, h, name] = r; if (name && !local[rid]) local[rid] = name; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < F.h && i >= 0 && i < F.w) own[j][i] = rid; }
      const at = (i, j) => (i < 0 || j < 0 || i >= F.w || j >= F.h) ? null : own[j][i];
      const lab = rid => isRoom(rid) ? `${rid} ${nameOf(M, rid)}` : (local[rid] || nameOf(M, rid) || rid);
      for (const d of (F.D || [])) {
        const [x, y, o, type] = d; if (type === "w") continue;
        const a = o === "h" ? at(x, y - 1) : at(x - 1, y), b = at(x, y);
        if (!a || !b || a === b) continue;
        const k = type === "s" || isGmFloor(F) ? "s" : "", t = DT[type] || "door";
        if (isRoom(a)) add(a, k, `${lab(b)} (${t})`);
        if (isRoom(b)) add(b, k, `${lab(a)} (${t})`);
      }
      for (const st of (F.ST || [])) {
        const c = at(Math.floor(st[1] + st[3] / 2), Math.floor(st[2] + st[4] / 2)); if (!c || !isRoom(c)) continue;
        const others = M.floors.map((G, gi) => gi !== fi && (G.ST || []).some(t => t[0] === st[0]) ? G : null).filter(Boolean);
        const k = isGmFloor(F) || others.some(isGmFloor) ? "s" : "";
        add(c, k, `${st[0]} ${st[5] === "up" ? "up" : "down"} to ${others.map(G => G.n).join(", ") || st[6] || "?"}${st[8] ? " (" + st[8] + ")" : ""}`);
      }
    });
    for (const r in con) { const seen = new Set(); con[r] = con[r].filter(c => !seen.has(c.t) && seen.add(c.t)); }
    return con;
  }
  const LABELS = { pur: "Purpose", atm: "Atmosphere", obj: "Contents", who: "People here", now: "What is happening", cl: "Clues", chk: "Skill checks", find: "Search", act: "Things to try", sec: "Secrets", dz: "Encounters", cn: "Connections", kp: "{gm} notes" };
  function label(k) { return (A.config.labels[k] || LABELS[k] || k).replace("{gm}", A.config.gm); }
  // a room's complete entry: the map's own directory, overlaid by the guide
  function roomEntry(M, G, rid) { return Object.assign({}, (M.rooms || {})[rid] || {}, ((G || {}).rooms || {})[rid] || {}); }
  function toList(to) { return (Array.isArray(to) ? to : to ? [to] : []); }
  function goLinks(to) { return toList(to).map(t => A.meta[t] ? `<button type="button" class="lm-go" data-go="${esc(t)}">${esc(A.meta[t].name || t)}</button>` : `<span class="lm-go-x">${esc(t)}</span>`).join(" "); }
  // What stands under a place's maps, in the order the Wormroot Gazetteer has it: the overview, the referee's guide,
  // the exterior to read aloud, the floors, the room-by-room guide, then the clue directory, the people, the secret
  // ways and the dangers, each entry saying where on the map it is. The page itself (atlas-shell.js) shows the first
  // impressions and "what's really going on" in the place's dossier; what it shows there (A.pageShows) is not repeated here.
  function ref(id, level) {
    const M = get(id, level), key = keyOf(id), G = A.guides[key] || {}, gmName = A.config.gm, out = [], own = A.pageShows || {};
    const f = (k, v) => v ? `<div class="lm-f"><span>${esc(k)}</span>${esc(v)}</div>` : "";
    const fh = (k, html) => html ? `<div class="lm-f"><span>${esc(k)}</span>${html}</div>` : "";
    if (M.ov && !own.ov) out.push(`<div class="lm-blk gm-only"><h4>Overview</h4><p>${esc(M.ov)}</p></div>`);
    if (G.ov || M.run) out.push(`<div class="lm-blk gm-only"><h4>${esc(gmName)} guide</h4><p>${esc([M.run, G.ov].filter(Boolean).join(" "))}</p></div>`);
    if (M.ext && !own.ext) out.push(`<div class="lm-blk"><h4>Exterior · read aloud${A.narrateBtn ? A.narrateBtn(M.ext, "exterior") : ""}</h4><p>${esc(M.ext)}</p></div>`);
    const order = M.order || M.floors.map((_, i) => i), note = F => F.note || (G.floors && G.floors[F.n]) || "";
    const roomFloor = {}, stairs = {};
    out.push(`<div class="lm-blk"><h4>Floors</h4><ul class="lm-fl">` + order.map(i => [M.floors[i], i]).map(([F, i]) => {
      const seen = new Set(), items = [];
      for (const r of F.R) { const [rid, , , , , name, , o = {}] = r; if (!isRoom(rid) || seen.has(rid)) continue; seen.add(rid); if (roomFloor[rid] === undefined) roomFloor[rid] = i; items.push(`<span class="${o.h ? "gm-only" : ""}"><b>${rid}</b> ${esc(name || nameOf(M, rid))}</span>`); }
      for (const st of (F.ST || [])) { (stairs[st[0]] = stairs[st[0]] || { name: st[8], floors: [] }).floors.push(F.n); if (st[8]) stairs[st[0]].name = st[8]; if (isGmFloor(F)) stairs[st[0]].k = 1; }
      return `<li class="${isGmFloor(F) ? "gm-only" : ""}"><button type="button" class="lm-flb" data-lmf="${i}" data-loc="${id}">${esc(F.n)}</button> ${items.join(" · ")}${note(F) ? `<div class="lm-fn gm-only">${esc(note(F))}</div>` : ""}</li>`;
    }).join("") + `</ul>`);
    const sk = Object.keys(stairs);
    if (sk.length) out.push(`<ul class="lm-st">` + sk.map(k => `<li class="${stairs[k].k ? "gm-only" : ""}"><b>${k}</b> ${esc(stairs[k].name || "Stair")}: ${stairs[k].floors.map(esc).join(" ↔ ")}</li>`).join("") + `</ul>`);
    out.push(`</div>`);
    const con = connections(M);
    const hidden = rid => M.floors.some(F => F.R.some(x => x[0] === rid && ((x[7] && x[7].h) || isGmFloor(F))));
    const auto = (obj, rid, txt, fmt) => Object.keys(obj || {}).filter(x => obj[x].at === rid && !(txt || "").includes(x) && !(txt || "").toLowerCase().includes((fmt(obj[x]) || "").toLowerCase().slice(0, 12) || "\u0000")).map(x => `${x} ${fmt(obj[x])}`).join(" · ");
    const join = (...a) => a.filter(Boolean).join(" · ");
    const num = rid => +rid.slice(1);
    const groups = order.map(i => [M.floors[i], i, Object.keys(roomFloor).filter(r => roomFloor[r] === i).sort((a, b) => num(a) - num(b))]).filter(g => g[2].length);
    if (groups.length) out.push(`<div class="lm-blk"><h4>Room-by-room guide<button type="button" class="fold-all" data-foldall="1">Open all</button></h4>` + groups.map(([F, i, list]) => `<div class="lm-fg ${isGmFloor(F) ? "gm-only" : ""}"><h5>${esc(F.n)}</h5>${note(F) ? `<p class="lm-fn gm-only">${esc(note(F))}</p>` : ""}` + list.map(k => {
      const r = roomEntry(M, G, k), cs = con[k] || [];
      const pub = cs.filter(c => !c.k).map(c => c.t).join(" · "), sec = cs.filter(c => c.k).map(c => c.t).join(" · ");
      const npcs = join(r.who, auto(M.npcs, k, r.who, n => n.n || ((A.castData || {})[n.who] || {}).n || "")), clues = join(r.cl, auto(M.clues, k, r.cl, c => c.t || ""));
      const secrets = join(r.sec, auto(M.secrets, k, r.sec, x => x.t || ""), sec ? "Hidden ways: " + sec : ""), encs = join(r.dz, auto(M.enc, k, r.dz, x => x.t || ""));
      return `<details class="lm-card fold ${hidden(k) ? "gm-only" : ""}" id="lm-${id}-${k}"><summary class="lm-ch"><b>${k}</b> ${esc(r.n || nameOf(M, k))} <i>${esc(F.n)}</i></summary>${f(label("pur"), r.pur)}${r.d ? `<p>${esc(r.d)}</p>` : ""}${f(label("atm"), r.atm)}${A.narrateBtn && (r.d || r.atm) ? `<p class="nar-row">${A.narrateBtn([r.d, r.atm].filter(Boolean).join(" "), r.n || nameOf(M, k))}</p>` : ""}<div class="gm-only">${f(label("obj"), r.obj)}${f(label("who"), npcs)}${f(label("now"), r.now)}${f(label("cl"), clues)}${f(label("chk"), r.chk)}${f(label("find"), r.find)}${f(label("act"), r.act)}${f(label("sec"), secrets)}${f(label("dz"), encs)}</div>${f(label("cn"), join(pub, cnExtra(r.cn, pub)))}<div class="gm-only">${f(label("kp"), join(r.kp, r.inv))}</div></details>`;
    }).join("") + `</div>`).join("") + `</div>`);
    // Every entry folds to one line, its letter, name and room; a click opens it (the user asked for "a drop down
    // button on the clues and stuff so it's not as crowded"). A marker clicked on the map opens its entry.
    const dir = (title, obj, fn) => {
      const k = Object.keys(obj || {}); if (!k.length) return;
      out.push(`<div class="lm-blk gm-only"><h4>${title}<button type="button" class="fold-all" data-foldall="1">Open all</button></h4>` + k.map(x => {
        const h = fn(obj[x], x), cut = h.indexOf("</div>");
        return `<details class="lm-card fold" id="lm-${id}-${x}"><summary class="lm-ch"><b class="lm-b${x[0]}">${x}</b> ${h.slice(0, cut)}${obj[x].at ? ` <i>${esc(where(M, obj[x].at))}</i>` : ""}</summary>${h.slice(cut + 6, -5)}</details>`;
      }).join("") + `</div>`);
    };
    dir("Clue directory", M.clues, c => `${esc(c.t || "")}</div>${f("Where", where(M, c.at) + (c.p ? " · " + c.p : ""))}${f("What it is", c.d)}${f("How it is found", c.how)}${f("What it reveals", c.rev)}${f("If the players miss it", c.hint)}${fh("Leads to", goLinks(c.to))}<div>`);
    // a person who is one of the cast (who: "id") is described there once; anything said here is added to it
    dir("People", M.npcs, n => { const w = (n.who && A.castData && A.castData[n.who]) || {}, g = k => n[k] || w[k]; return `${esc(n.n || w.n || "")}</div>${f("Where", where(M, n.at))}${f("Looks like", g("look"))}${f("Manner", g("voice"))}${f("What they are doing", n.doing)}${f("What they want", g("want"))}${f("What they know", n.knows)}${f("What they hide", g("secret"))}${f("The lie they tell", g("lie"))}${f("What makes them talk", g("press"))}${f("What they will reveal", n.rev)}${fh("Points to", goLinks(n.to))}<div>`; });
    dir("Secret doors, passages and hiding places", M.secrets, x => `${esc(x.t || "")}</div>${f("Where", where(M, x.at))}${f("Access", x.acc)}${f("Leads to", x.dest)}${f("Purpose", x.why)}<div>`);
    dir("Encounters and dangers", M.enc, x => `${esc(x.t || "")}</div>${f("Where", where(M, x.at))}${f("What happens", x.d)}<div>`);
    return out.join("");
  }

  /* ---- the clue web: which place points to which */
  function leads(level) {
    const out = [];
    for (const id of A.order) {
      if (!A.maps[id] || A.maps[id].alias) { for (const l of (A.meta[id].leads || [])) out.push({ from: id, via: "", to: l.to, text: l.why || "" }); continue; }
      const M = get(id, level == null ? 99 : level);
      for (const [k, c] of Object.entries(M.clues || {})) for (const t of toList(c.to)) out.push({ from: id, via: k, to: t, text: c.t || "" });
      for (const [k, n] of Object.entries(M.npcs || {})) for (const t of toList(n.to)) out.push({ from: id, via: k, to: t, text: n.n || "" });
      for (const l of (A.meta[id].leads || [])) out.push({ from: id, via: l.via || "", to: l.to, text: l.why || "" });
    }
    return out;
  }

  /* ---- registering a place */
  A.configure = cfg => { for (const k in cfg) A.config[k] = (cfg[k] && typeof cfg[k] === "object" && !Array.isArray(cfg[k]) && A.config[k] && typeof A.config[k] === "object" && !Array.isArray(A.config[k])) ? Object.assign({}, A.config[k], cfg[k]) : cfg[k]; return A; };
  // The cast: the people the story turns on, each described once.
  //   ATLAS.cast({ vane: { n: "Harbour Master Vane", role: "...", look: "...", voice: "...", bg: "...", want: "...", secret: "...", lie: "...", press: "...", fate: "..." } })
  // A person on a map who is one of them says who: "vane" and need not repeat the name or the description.
  A.cast = people => { A.castData = Object.assign(A.castData || {}, people); return A; };
  A.place = (id, def) => {
    const meta = Object.assign({}, def), map = meta.map, expand = meta.expand, guide = meta.guide;
    delete meta.map; delete meta.expand; delete meta.guide;
    A.meta[id] = Object.assign({ id }, meta);
    if (!A.order.includes(id)) A.order.push(id);
    if (map) {
      if (!map.t) map.t = meta.name || id;
      (map.floors || []).forEach(F => { F.D = F.D || []; F.I = F.I || []; F.ST = F.ST || []; F.M = F.M || []; finish(F, F.R || []); });
      A.maps[id] = map;
    }
    if (expand) A.exp[id] = Array.isArray(expand) ? expand : [expand];
    if (guide) A.guides[id] = guide;
    A.state.cache = {};
    return A;
  };

  /* ---- the map section of a place's page */
  const viewFor = () => (typeof document !== "undefined" && document.getElementById("app") && document.getElementById("app").dataset.mode === "player") ? "player" : A.state.v;
  function legend() { return `<div class="lm-legend gm-only">${Object.entries(markers()).map(([k, [c, n]]) => `<span><i style="background:${c}">${k}</i>${esc(n)}</span>`).join("")}<span><i style="background:#4a4a48;border-radius:2px">ST</i>Stairs</span><span><i style="background:repeating-linear-gradient(90deg,#6a3f9e 0 4px,transparent 4px 7px);border-radius:0;width:18px;height:5px"></i>Secret door</span><span><i style="background:#6a3f9e;opacity:.35;border-radius:0"></i>Hidden area</span></div>`; }
  function cur(id) { const M = get(id); let fi = A.state.f[keyOf(id)]; if (fi == null) fi = A.maps[id].start || 0; if (fi >= M.floors.length) fi = 0; if (isGmFloor(M.floors[fi]) && viewFor() === "player") fi = Math.max(0, M.floors.findIndex(F => !isGmFloor(F))); return fi; }
  function floorBtns(id) { const M = get(id), c = cur(id), pv = viewFor() === "player"; return (M.order || M.floors.map((_, i) => i)).map(i => { const F = M.floors[i]; return (isGmFloor(F) && pv) ? "" : `<button type="button" data-lmf="${i}" data-loc="${id}" aria-pressed="${i === c}">${esc(F.n)}</button>`; }).join(""); }
  function section(id) {
    if (!A.maps[id]) return "";
    const fi = cur(id), v = viewFor(), n = levels(id), gmName = A.config.gm;
    return `<section class="sec lmap-sec" data-loc="${id}"><h3>Maps of the location</h3>
      <div class="lm-bar"><div class="lm-floors" role="group" aria-label="Floor">${floorBtns(id)}</div>
        <div class="lm-views gm-only" role="group" aria-label="Map view"><button type="button" data-lmv="player" aria-pressed="${v === "player"}">Player view</button><button type="button" data-lmv="gm" aria-pressed="${v !== "player"}">${esc(gmName)} view</button></div>
        <button type="button" class="lm-full" data-lmfull="${id}">Full size</button>${n ? `<div class="lm-sizes" role="group" aria-label="Map size">${Array.from({ length: n + 1 }, (_, i) => `<button type="button" data-lmsize="${i}" aria-pressed="${levelFor(id) === i}">${esc(i ? (A.exp[keyOf(id)][i - 1].label || sizeName(i)) : sizeName(0))}</button>`).join("")}</div>` : ""}</div>
      <div class="lm-stage">${svg(id, fi, v, "m" + (A.state.n++))}</div>
      ${legend()}
      <div class="lm-ref">${ref(id)}</div>
    </section>`;
  }
  function fill(dlg, id) {
    const M = get(id), fi = cur(id), F = M.floors[fi];
    dlg.dataset.loc = id;
    dlg.querySelector(".lm-dlg-t").textContent = M.t;
    dlg.querySelector(".lm-dlg-fl").innerHTML = floorBtns(id);
    const body = dlg.querySelector(".lm-dlg-body");
    body.innerHTML = svg(id, fi, viewFor(), "d" + (A.state.n++));
    body.firstChild.style.width = Math.max(900, (F.w * C + 20) * 1.7) + "px";
  }
  function rerender(id) {
    const sec = document.querySelector(`.lmap-sec[data-loc="${id}"]`); if (!sec) return;
    const fi = cur(id), v = viewFor();
    sec.querySelector(".lm-stage").innerHTML = svg(id, fi, v, "m" + (A.state.n++));
    sec.querySelector(".lm-floors").innerHTML = floorBtns(id);
    sec.querySelectorAll("[data-lmv]").forEach(b => b.setAttribute("aria-pressed", (b.dataset.lmv === "player") === (v === "player")));
    const dlg = document.getElementById("lmDlg");
    if (dlg && dlg.open && dlg.dataset.loc === id) fill(dlg, id);
  }
  function setLevel(n) {
    A.state.level = n; A.state.f = {};
    try { localStorage.setItem(A.config.storageKey + "-size", String(n)); } catch (e) {}
    document.querySelectorAll(".lmap-sec").forEach(sec => { const id = sec.dataset.loc; const t = document.createElement("div"); t.innerHTML = section(id); sec.replaceWith(t.firstElementChild); });
    const dlg = document.getElementById("lmDlg"); if (dlg && dlg.open && dlg.dataset.loc) fill(dlg, dlg.dataset.loc);
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("click", e => {
      const t = e.target; if (!t || !t.closest) return;
      const sz = t.closest("[data-lmsize]"); if (sz) { setLevel(+sz.dataset.lmsize); return; }
      const fb = t.closest("[data-lmf]");
      if (fb) { const id = fb.dataset.loc; A.state.f[keyOf(id)] = +fb.dataset.lmf; rerender(id); if (fb.classList.contains("lm-flb")) { const st = document.querySelector(`.lmap-sec[data-loc="${id}"] .lm-stage`); if (st) st.scrollIntoView({ behavior: "smooth", block: "center" }); } return; }
      const vb = t.closest("[data-lmv]");
      if (vb) { A.state.v = vb.dataset.lmv; const sec = vb.closest(".lmap-sec"); if (sec) rerender(sec.dataset.loc); return; }
      const full = t.closest("[data-lmfull]");
      if (full) {
        let dlg = document.getElementById("lmDlg");
        if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "lmDlg"; dlg.className = "lm-dlg"; dlg.innerHTML = `<div class="lm-dlg-bar"><strong class="lm-dlg-t"></strong><div class="lm-floors lm-dlg-fl"></div><button type="button" class="lm-dlg-x">Close</button></div><div class="lm-dlg-body"></div>`; document.body.appendChild(dlg); dlg.querySelector(".lm-dlg-x").onclick = () => dlg.close(); }
        fill(dlg, full.dataset.lmfull); dlg.showModal(); return;
      }
      const rf = t.closest(".lmap2 [data-ref]");
      if (rf) {
        const sv = rf.closest(".lmap2"), id = sv.dataset.loc, el = document.getElementById(`lm-${id}-${rf.dataset.ref}`);
        const dlg = document.getElementById("lmDlg"); if (dlg && dlg.open) dlg.close();
        if (el) { if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("lm-hl"); void el.offsetWidth; el.classList.add("lm-hl"); }
      }
    });
  }
  A.loadPrefs = () => { try { const v = localStorage.getItem(A.config.storageKey + "-size"); if (v !== null && v !== "") A.state.level = +v; } catch (e) {} };

  Object.assign(A, { C, esc, isRoom, kindOf, isOut, isSolid, isIndoorKind, KINDS, PATS, GEN, ITEMS: LMI, FX: LMX_FX, itemFn, markers, dirOf, levels, levelFor, expanded, get, keyOf, isGmFloor, svg, ref, section, rerender, connections, roomEntry, nameOf, leads, sizeName, label, paper });
  return A;
})();
if (typeof module !== "undefined" && module.exports) module.exports = ATLAS;
