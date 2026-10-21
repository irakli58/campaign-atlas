/* Rooms in 3D, seen from one fixed angle. The user asked (21 Oct 2026) for 3D room maps "with a locked camera
   perspective", to be chosen when a campaign is made ("do you want 3d or 2d"): rooms built, furnished and searched in
   3D, the camera never turned, only slid and zoomed, like looking down into a diorama on the table.
   A 3D room is not a second map. It is the floor the 2D editor draws (rooms, doors, windows, stairs, furnishings,
   clues and people), raised: so 2D and 3D are two views of one map, every tool of the editor works in both, and
   switching between them loses nothing. The flat furniture of the 2D maps (beds, tables, barrels, altars...) is raised
   into the library's models where the library has one; what it has not stays painted on the floor.
   R3.stage is the 3D view of one floor. The map editor's 3D mode is a plug of atlas-mapedit.js; a place's floor opens
   in 3D from its maps; and a campaign whose maps are 3D (configure({ maps: "3d" })) shows its rooms in 3D on the page. */
(function (A) {
  "use strict";
  if (!A.models) return;
  const M = A.models, R3 = A.room3d = {}, esc = A.esc;
  const hasDoc = typeof document !== "undefined";
  const rad = d => d * Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---- the one angle every room is seen from: from the south-west, looking down at 52 degrees, without perspective.
          It is set once when a view is made, and nothing the mouse, the keys or a finger does can change it. */
  const YAW = 45, PITCH = 52, DIST = 400;
  R3.ANGLE = Object.freeze({ yaw: YAW, pitch: PITCH, from: "south-west", projection: "orthographic" });
  const BACK = [-Math.cos(rad(PITCH)) * Math.sin(rad(YAW)), Math.sin(rad(PITCH)), Math.cos(rad(PITCH)) * Math.cos(rad(YAW))];

  /* ---- light: how a room is lit. Each keeps enough light to see and choose everything. */
  R3.LIGHTS = [
    ["normal", "Normal light", { bg: 0x1d1f22, sky: 0xfff6e8, ground: 0x4a4036, hemi: .6, sun: 0xfff2dc, si: .85, lamp: [0xffd9a0], li: .35 }],
    ["torch", "Torchlight", { bg: 0x0f0a06, sky: 0xffcf96, ground: 0x24170c, hemi: .32, sun: 0xffa060, si: .28, lamp: [0xff8a3a], li: 1.7, fx: "flicker" }],
    ["horror", "Dark horror", { bg: 0x06080b, sky: 0x8796b6, ground: 0x0b0b12, hemi: .26, sun: 0xa9bcff, si: .34, lamp: [0xa8ffcf], li: .9, fx: "flicker", dark: true }],
    ["lab", "Laboratory", { bg: 0x161c22, sky: 0xf4fbff, ground: 0x8c99a6, hemi: .82, sun: 0xffffff, si: .72, lamp: [0xdff4ff], li: .3 }],
    ["emergency", "Emergency red", { bg: 0x0d0303, sky: 0xff7a6a, ground: 0x1d0606, hemi: .3, sun: 0xff4a36, si: .26, lamp: [0xff2a1a], li: 1.6, fx: "pulse", dark: true }],
    ["neon", "Cyberpunk neon", { bg: 0x08040f, sky: 0x9a80ff, ground: 0x140828, hemi: .32, sun: 0x9a88ff, si: .3, lamp: [0xff2bd6, 0x22e6ff], li: 1.6, fx: "hum" }]
  ];
  const LIGHT = Object.fromEntries(R3.LIGHTS.map(l => [l[0], l[2]]));
  R3.WALLS = [["cut", "Walls cut away"], ["low", "Low walls"], ["full", "Full walls"]];
  // the light a floor is lit by: its own, its place's, the campaign's, or normal
  R3.lightOf = (id, F) => { const k = (F && F.light) || ((A.meta || {})[id] || {}).light || ((A.maps || {})[id] || {}).light || A.config.light || "normal"; return LIGHT[k] ? k : "normal"; };
  const era = () => { try { return A.table && A.table.era ? A.table.era() : "victorian"; } catch (e) { return "victorian"; } };

  /* ---- the 2D maps' furniture, raised: [model, how it fills its drawing, { age: another model }]. fit stretches it to
          the drawing, row puts as many as fit side by side along it, nat keeps its own size (smaller if it must),
          flat covers the drawing, line runs along it. */
  const RAISE = {
    bed: ["bed-single", "fit", { future: "bed-pod" }], dbed: ["bed-double", "fit", { medieval: "bed-fourposter", fantasy: "bed-fourposter" }], cot: ["bed-cot", "fit"], bunk: ["bed-bunk", "fit", { modern: "bed-bunk-metal", future: "bed-bunk-metal" }],
    ward: ["wardrobe", "fit"], chest: ["chest", "nat"], dresser: ["dresser", "fit"], drawers: ["dresser", "fit"], book: ["bookcase", "row"], shelf: ["shelf-pantry", "row", { modern: "shelf-metal", future: "shelf-metal" }], jars: ["shelf-pantry", "row"], files: ["filing", "row"], cabinet: ["cupboard", "fit"],
    tbl: ["table-dining", "fit", { medieval: "table-trestle", fantasy: "table-trestle", future: "table-lab" }], dine: ["table-dining", "fit"], rtbl: ["table-round", "fit"], clothtbl: ["table-banquet", "fit"],
    chair: ["chair-wood", "nat", { victorian: "chair-dining", "1920s": "chair-dining", modern: "chair-office", future: "chair-office" }], arm: ["armchair", "nat"], sofa: ["sofa-3", "fit", { victorian: "sofa-chesterfield", "1920s": "sofa-chesterfield" }], stool: ["stool-3", "nat"], bench: ["bench-back", "row"], pew: ["bench-pew", "row"], throne: ["chair-throne", "nat"],
    desk: ["desk-writing", "fit", { "1920s": "desk-detective", modern: "desk-office", future: "desk-scifi" }], work: ["table-workbench", "fit"], counter: ["counter-kitchen", "row"], bar: ["counter-bar", "fit"], disp: ["counter-jewels", "fit"], slab: ["table-autopsy", "fit"], altar: ["altar-stone", "fit"], lectern: ["lectern", "nat"], pulpit: ["lectern", "nat"],
    fp: ["fireplace-stone", "fit", { victorian: "fireplace-brick", "1920s": "fireplace-brick", modern: "fireplace-brick" }], range: ["stove-range", "fit"], stove: ["stove-iron", "nat", { modern: "stove-modern", future: "stove-synth" }], sink: ["counter-sink", "fit"], bath: ["bathtub", "fit", { modern: "bathtub-modern", future: "bathtub-modern" }], wash: ["washstand", "nat"], privy: ["latrine", "fit", { modern: "toilet", future: "toilet-steel" }],
    barrel: ["barrel", "nat"], crate: ["crate-military", "nat", { future: "crate-scifi" }], sack: ["sacks", "fit"], safe: ["safe", "nat"], cage: ["cage", "fit"], coffin: ["coffin", "fit"],
    piano: ["piano-upright", "nat"], organ: ["organ", "fit"], clock: ["clock-grandfather", "nat"], rug: ["rug-persian", "flat", { modern: "rug-modern" }], lamp: ["lamp-floor", "nat", { medieval: "candles-cluster", fantasy: "candles-cluster" }], candle: ["candles-cluster", "nat"], brazier: ["brazier", "nat"], lampost: ["lamp-street", "nat", { victorian: "lamp-gas", "1920s": "lamp-gas" }], plant: ["plant-snake", "nat"],
    stage: ["stage", "flat"], stall: ["stall-market", "fit"], cart: ["cart-hand", "fit", { medieval: "cart-goods", fantasy: "cart-goods" }], trough: ["trough", "fit"], well: ["well", "nat"], fountain: ["fountain", "fit"], column: ["column-round", "nat", { future: "column-scifi" }], plinth: ["statue-bust", "nat"], statue: ["statue-angel", "nat", { medieval: "statue-knight", fantasy: "statue-knight" }],
    bars: ["bars", "line"], fence: ["fence-picket", "line", { modern: "fence-chain", future: "fence-chain" }], rail: ["railing", "line"], grave: ["grave-headstone", "nat"], cross: ["grave-cross", "nat"], tree: ["tree-fruit", "nat"], bush: ["bush", "fit"], boulder: ["rock", "fit"], rubble: ["rubble-stone", "flat"], tent: ["tent", "fit"], campfire: ["campfire", "nat"],
    rack: ["rack-weapons", "row", { modern: "shelf-metal", future: "shelf-metal" }], locker: ["lockers", "row", { future: "lockers-scifi" }], console: ["console-desk", "row", { modern: "workstation" }], pod: ["bed-pod", "fit"], tank: ["tank-specimen", "nat"], generator: ["generator-diesel", "fit", { future: "generator-scifi" }], crystal: ["crystals", "fit"], lathe: ["lathe", "fit"], vehicle: ["car", "fit", { medieval: "wagon", fantasy: "wagon", victorian: "wagon" }]
  };
  // things that give light, among the furniture and the models
  const GLOWS = new Set(["fp", "brazier", "candle", "campfire", "lamp", "lampost"]), GLOW_RX = /fire|brazier|candle|torch|sconce|lamp|lantern|chandelier|forge|neon|glow/;
  R3.raiseOf = code => { const r = RAISE[code]; if (!r) return null; const id = (r[2] && r[2][era()]) || r[0]; return M.entry(id) ? { id, mode: r[1] } : (M.entry(r[0]) ? { id: r[0], mode: r[1] } : null); };
  // the room a point is in
  function roomOf(F, x, y) { const R = F.R || []; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4]) return r; } return null; }
  // one piece of 2D furniture as models: a list of { a, p, x, y, r, s } (a row of shelves is several), or null when the
  // library has nothing like it
  R3.raise = (it, F) => { const rr = R3.raiseOf(it[0]); return rr ? R3.raiseAs(rr, it, F) : null; };
  // the same, as a given model (rr: { id, mode }): a 2D drawing of the library (atlas-sprites.js) names its own
  R3.raiseAs = (rr, it, F) => {
    const [code, x, y, w = 1, h = 1, rot0 = 0, , col] = it;
    const e = M.entry(rr.id), sq = M.sq(), mode = rr.mode; if (!e) return null; let rot = rot0 || 0, sw = rot % 180 !== 0;
    let u = (sw ? h : w) * sq, v = (sw ? w : h) * sq;                 // the drawing along the model's own width and depth
    const [nw, nd] = M.dims(e), par = e.p && e.p.w != null && e.p.d != null;
    // drawn the other way round from the model: a row of shelves drawn down a wall, a bed drawn across the room. It is
    // turned, a thing against a wall to face into its room.
    const across = mode === "row" || mode === "line" ? v > u * 1.15 : mode === "fit" && ((nw > nd * 1.15 && v > u * 1.15) || (nd > nw * 1.15 && u > v * 1.15));
    if (across) { const room = F && roomOf(F, x + w / 2, y + h / 2), cx = x + w / 2; rot = (rot + (room && cx - room[1] < room[1] + room[3] - cx ? 270 : 90)) % 360; [u, v] = [v, u]; }
    // things that come one beside another (shelves, cabinets, benches, consoles) fill a long drawing as a row
    const n = mode === "row" ? Math.max(1, Math.round(u / (nw * 1.05))) : 1, cw = u / n;
    const spec = { a: rr.id };
    if (par && mode === "flat") spec.p = { w: +(u * .98).toFixed(3), d: +(v * .98).toFixed(3) };
    else if (par && mode === "line") spec.p = { w: +(u * .98).toFixed(3) };
    else if (par && (mode === "fit" || mode === "row")) spec.p = { w: +clamp(cw * .94, nw * .6, nw * (mode === "row" ? 1.25 : 1.5)).toFixed(3), d: +clamp(v * .9, nd * .6, nd * 1.5).toFixed(3) };
    if (col && /^#/.test(col)) spec.col = col;
    const [fw, fd] = M.dims(e, spec), s = +Math.min(1, (cw * .98) / Math.max(fw, .01), mode === "line" ? 1 : (v * .98) / Math.max(fd, .01)).toFixed(3);
    const cx = x + w / 2, cy = y + h / 2, a = rad(rot), out = [];
    for (let k = 0; k < n; k++) { const lx = ((k + .5) * cw - u / 2) / sq; out.push(Object.assign({}, spec, { x: +(cx + lx * Math.cos(a)).toFixed(3), y: +(cy + lx * Math.sin(a)).toFixed(3), r: rot, s, glow: GLOWS.has(code) })); }
    return out;
  };

  /* ---- the walls: which stand full height and which are cut down so the camera sees in. Looking from the south-west,
          a room's north and east walls are behind it; the building's own outer walls behind it stand full, the rest
          are cut down, as a model house is cut away. */
  R3.walls = (F, gm, mode) => {
    const own = Array.from({ length: F.h }, () => Array(F.w).fill(null));
    for (const r of F.R || []) { const [rid, x, y, w, h, , kind, op = {}] = r; if (op.h && !gm) continue; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < F.h && i >= 0 && i < F.w) own[j][i] = { rid, kind, o: op }; }
    const at = (i, j) => (i < 0 || j < 0 || i >= F.w || j >= F.h) ? null : own[j][i], indoor = c => !!c && A.isIndoorKind(c.kind);
    const door = new Map(); for (const d of F.D || []) { const [x, y, or, type = "d", len = 1] = d; if (type === "s" && !gm) continue; for (let k = 0; k < len; k++) door.set(or + (or === "h" ? (x + k) + ":" + y : x + ":" + (y + k)), type); }
    const edge = (i, j, or) => {
      const a = or === "h" ? at(i, j - 1) : at(i - 1, j), b = at(i, j);
      if ((a && b && a.rid === b.rid) || (!indoor(a) && !indoor(b))) return null;
      const ext = !(indoor(a) && indoor(b)) || (a.o.b || "") !== (b.o.b || "");
      // behind the room on the camera's side, with nothing indoors beyond it
      const back = or === "h" ? indoor(b) && !indoor(a) : indoor(a) && !indoor(b);
      return { ext, tall: mode === "full" || (mode !== "low" && back), t: door.get(or + i + ":" + j) || "" };
    };
    const out = [];
    const lines = (or, nk, ni) => { for (let k = 0; k <= nk; k++) { let start = 0, cur = null; for (let i = 0; i <= ni; i++) { const ed = i < ni ? (or === "h" ? edge(i, k, "h") : edge(k, i, "v")) : null, same = cur && ed && !ed.t && !cur.t && ed.ext === cur.ext && ed.tall === cur.tall; if (same) continue; if (cur) out.push(Object.assign({ or, k, i0: start, i1: i }, cur)); cur = ed; start = i; } } };
    lines("h", F.h, F.w); lines("v", F.w, F.h);
    return out;
  };

  /* ---- the stage: one floor in 3D. o: { events (the element whose pointer events it shares), panOnly (no tools: a
          left drag slides), panIfFree() (a left drag on nothing slides), cancelTool(), wheelForTool(e), overlay(),
          preview(), pickable(), onPick(hit), onLight(k), onWalls(k), onGrid(on), nameOf(mid), title } */
  const LOCK_IC = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>`;
  const pref = (k, d) => { try { const v = localStorage.getItem(A.config.storageKey + "-r3-" + k); return v == null ? d : v; } catch (e) { return d; } };
  const keep = (k, v) => { try { localStorage.setItem(A.config.storageKey + "-r3-" + k, v); } catch (e) {} };
  R3.pref = pref; R3.keep = keep;
  const VIEWS = new Map();   // where each floor was last looked at, this visit: { x, y, z, zoom }

  R3.stage = async (host, o) => {
    o = o || {};
    const T = await M.three();
    const sq = M.sq();
    const r = new T.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    const wrap = document.createElement("div"); wrap.className = "r3";
    wrap.innerHTML = `<div class="r3-hud" role="toolbar" aria-label="The 3D view">
        <span class="r3-lock" title="Every room is seen from this one angle. You can slide and zoom; the view never turns.">${LOCK_IC}Fixed view</span>
        <button type="button" data-r3="zin" title="Closer (+)" aria-label="Closer">+</button><button type="button" data-r3="zout" title="Further (−)" aria-label="Further">−</button>
        <button type="button" data-r3="fit" title="Fit the chosen room, or the whole floor (Home)">Fit</button><button type="button" data-r3="reset" title="Back to the whole floor">Reset view</button>
        <select data-r3="walls" aria-label="Walls">${R3.WALLS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select>
        <select data-r3="light" aria-label="Light">${R3.LIGHTS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select>
        <button type="button" data-r3="grid" aria-pressed="true" title="The squares of the grid">Grid</button>
      </div><div class="r3-tip" hidden></div>
      <p class="r3-help">${o.panOnly ? "Drag to slide" : "Slide: right or middle button, or hold Space and drag"}; zoom with the wheel; two fingers slide and pinch.</p>`;
    r.domElement.className = "r3-cv me-3dc"; r.domElement.setAttribute("tabindex", "0"); r.domElement.setAttribute("aria-label", "The floor in 3D");
    wrap.prepend(r.domElement); host.appendChild(wrap);
    const hud = wrap.querySelector(".r3-hud"), tipEl = wrap.querySelector(".r3-tip");
    const scene = new T.Scene(); scene.environment = M.env(T, r);
    // the camera: set once, from the one angle, and never turned again
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, DIST * 3);
    cam.position.set(BACK[0] * DIST, BACK[1] * DIST, BACK[2] * DIST); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true);
    const LOCK = cam.quaternion.clone(), RIGHT = new T.Vector3(1, 0, 0).applyQuaternion(LOCK), UP = new T.Vector3(0, 1, 0).applyQuaternion(LOCK), BK = new T.Vector3(BACK[0], BACK[1], BACK[2]);
    const VH = 8;   // half the height of the view at zoom 1, in metres
    const ZMIN = .05, ZMAX = 12;
    // what is on the stage
    const G = {}; for (const k of ["floor", "grid", "under", "walls", "stairs", "items", "props", "pins", "over", "ghost", "lights"]) { G[k] = new T.Group(); G[k].name = k; scene.add(G[k]); }
    const hemi = new T.HemisphereLight(0xfff6e8, 0x40382e, .55), sun = new T.DirectionalLight(0xfff2dc, .8);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; scene.add(hemi, sun, sun.target);
    const S = { F: null, gm: true, walls: pref("walls", "cut"), light: "normal", lightOver: "", grid: pref("grid", "1") === "1", keys: {}, props: [], items: [], lamps: [], disp: [], gen: 0, sel: null, hoverOn: false, last: null, grabY: 0, focus: null, key: "" };
    const own = x => { S.disp.push(x); return x; };   // geometry and materials this stage made, to free at the end
    const ndc = new T.Vector2(), ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0);

    /* -- the view: slid and zoomed, never turned */
    const size = () => { const w = wrap.clientWidth || 600, h = wrap.clientHeight || 400, a = w / h; r.setSize(w, h, false); r.domElement.style.width = "100%"; r.domElement.style.height = "100%"; cam.left = -VH * a; cam.right = VH * a; cam.top = VH; cam.bottom = -VH; cam.updateProjectionMatrix(); dirty(); };
    const rayAt = (cx, cy) => { const b = r.domElement.getBoundingClientRect(); ndc.set(((cx - b.left) / b.width) * 2 - 1, -((cy - b.top) / b.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray; };
    const groundAt = (cx, cy, h) => { rayAt(cx, cy); plane.constant = -(h || 0); const p = new T.Vector3(); return ray.ray.intersectPlane(plane, p) ? p : null; };
    const centreGround = () => { const b = r.domElement.getBoundingClientRect(); return groundAt(b.left + b.width / 2, b.top + b.height / 2); };
    function lookAt(p) { cam.position.set(p.x + BK.x * DIST, p.y + BK.y * DIST, p.z + BK.z * DIST); }
    function keepNear() {
      // the floor never slides out of sight
      if (!S.F) return; const c = centreGround(); if (!c) return;
      const W = S.F.w * sq, D = S.F.h * sq, m = 2, x = clamp(c.x, -m, W + m), z = clamp(c.z, -m, D + m);
      if (x !== c.x || z !== c.z) cam.position.add(new T.Vector3(x - c.x, 0, z - c.z));
    }
    function fitBox(x0, z0, x1, z1, top) {
      const pts = []; for (const x of [x0, x1]) for (const z of [z0, z1]) for (const y of [0, top || 0]) pts.push(new T.Vector3(x, y, z));
      const xs = pts.map(p => p.dot(RIGHT)), ys = pts.map(p => p.dot(UP)), b = r.domElement.getBoundingClientRect(), a = (b.width || 600) / (b.height || 400);
      const hw = (Math.max(...xs) - Math.min(...xs)) / 2 * 1.1 + .4, hh = (Math.max(...ys) - Math.min(...ys)) / 2 * 1.12 + .4;
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2, mid = new T.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2);
      lookAt(mid); cam.position.add(RIGHT.clone().multiplyScalar(cx - mid.dot(RIGHT))).add(UP.clone().multiplyScalar(cy - mid.dot(UP)));
      cam.zoom = clamp(Math.min(VH * a / hw, VH / hh), ZMIN, ZMAX); cam.updateProjectionMatrix(); remember(); dirty();
    }
    const fitFloor = () => { if (S.F) fitBox(0, 0, S.F.w * sq, S.F.h * sq, wallH()); };
    function fit() { const f = o.focus && o.focus(); if (f) fitBox(f[0] * sq, f[1] * sq, (f[0] + f[2]) * sq, (f[1] + f[3]) * sq, wallH()); else fitFloor(); }
    function zoomAt(f, cx, cy) {
      const b = r.domElement.getBoundingClientRect(); if (cx == null) { cx = b.left + b.width / 2; cy = b.top + b.height / 2; }
      const before = groundAt(cx, cy); cam.zoom = clamp(cam.zoom * f, ZMIN, ZMAX); cam.updateProjectionMatrix();
      const after = groundAt(cx, cy); if (before && after) cam.position.add(before.sub(after));
      keepNear(); remember(); dirty();
    }
    function panPx(dx, dy) { const u = (2 * VH / cam.zoom) / (r.domElement.clientHeight || 400); cam.position.addScaledVector(RIGHT, -dx * u).addScaledVector(UP, dy * u); keepNear(); remember(); dirty(); }
    const remember = () => { if (S.key) VIEWS.set(S.key, { p: cam.position.toArray(), z: cam.zoom }); };
    // the guard: whatever happens, the camera faces the one way
    const guard = () => { if (!cam.quaternion.equals(LOCK)) cam.quaternion.copy(LOCK); if (cam.up.y !== 1) cam.up.set(0, 1, 0); };

    /* -- drawing it, when something changed */
    let raf = 0, need = true, gone = false, anim = false, t0 = 0;
    function dirty() { need = true; if (!raf && !gone) raf = requestAnimationFrame(frame); }
    // a 2D drawing laid on the floor is drawn when its picture is ready
    const onDrawn = () => dirty(); document.addEventListener("atlas-sprite-drawn", onDrawn);
    function frame(t) {
      raf = 0; if (gone) return;
      if (anim) { animate(t); need = true; }
      if (!need) return; need = false;
      guard(); sync();
      r.render(scene, cam);
      if (anim && !document.hidden) raf = requestAnimationFrame(frame);
    }

    /* -- the floor: the map's own drawing, without its markers, its models and the furniture raised in 3D */
    const floorMat = own(new T.MeshStandardMaterial({ color: 0x8a7a60, roughness: .95 }));
    const floorMesh = new T.Mesh(own(new T.PlaneGeometry(1, 1)), floorMat); floorMesh.rotation.x = -Math.PI / 2; floorMesh.receiveShadow = true; G.floor.add(floorMesh);
    let texGen = 0;
    function drawFloor(svg, F) {
      const g = ++texGen, C = A.C;
      svg = svg.replace(/ class="lmap2"( style="[^"]*")?/, "").replace(/viewBox="[^"]*"/, `viewBox="0 0 ${F.w * C} ${F.h * C}" width="${F.w * 48}" height="${F.h * 48}"`);
      const img = new Image();
      img.onload = () => {
        if (g !== texGen || gone) return;
        const k = Math.min(1, 4096 / Math.max(F.w * 48, F.h * 48)), cv = document.createElement("canvas"); cv.width = Math.round(F.w * 48 * k); cv.height = Math.round(F.h * 48 * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        const t = new T.CanvasTexture(cv); t.anisotropy = 8;
        if (floorMat.map) floorMat.map.dispose(); floorMat.map = t; floorMat.color.set(0xffffff); floorMat.needsUpdate = true; dirty();
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }
    function drawGrid(F) {
      G.grid.children.forEach(c => c.geometry.dispose()); G.grid.clear();
      const pts = []; for (let i = 0; i <= F.w; i++) pts.push(i * sq, .012, 0, i * sq, .012, F.h * sq); for (let j = 0; j <= F.h; j++) pts.push(0, .012, j * sq, F.w * sq, .012, j * sq);
      const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
      G.grid.add(new T.LineSegments(geo, gridMat)); G.grid.visible = S.grid;
    }
    const gridMat = own(new T.LineBasicMaterial({ color: 0x1a1612, transparent: true, opacity: .28, depthWrite: false }));

    /* -- walls, doors, windows and stairs */
    const E3 = era(), stone = E3 === "medieval" || E3 === "fantasy", steel = E3 === "future";
    const wallM = own(new T.MeshStandardMaterial({ color: steel ? 0xc7cdd4 : stone ? 0xbcb2a0 : 0xddd5c6, roughness: .92, metalness: steel ? .15 : 0 }));
    const extM = own(new T.MeshStandardMaterial({ color: steel ? 0x737d88 : stone ? 0x8e8472 : 0x8f877a, roughness: .95, metalness: steel ? .2 : 0 }));
    const capM = own(new T.MeshStandardMaterial({ color: 0x2b2722, roughness: 1 }));
    const secretM = own(new T.MeshStandardMaterial({ color: 0x8a6fb0, roughness: .9 }));
    const glassM = own(new T.MeshStandardMaterial({ color: 0xbfe0ee, transparent: true, opacity: .32, roughness: .05, depthWrite: false }));
    const woodM = own(new T.MeshStandardMaterial({ color: steel ? 0x5d6670 : 0x6a4a30, roughness: .75, metalness: steel ? .4 : 0 }));
    const ironM = own(new T.MeshStandardMaterial({ color: 0x2e2e30, roughness: .6, metalness: .7 }));
    const stepM = own(new T.MeshStandardMaterial({ color: steel ? 0x7d858d : 0x7a6248, roughness: .85 }));
    const LOW = 1.05;
    const wallH = () => (S.F && +S.F.wh) || 2.7;
    function box(w, h, d, mat, x, y, z, ry, group, data) {
      const geo = own(new T.BoxGeometry(Math.max(.001, w), Math.max(.001, h), Math.max(.001, d)));
      const me = new T.Mesh(geo, mat); me.position.set(x, y + h / 2, z); if (ry) me.rotation.y = ry; me.castShadow = me.receiveShadow = true; if (data) me.userData = data; (group || G.walls).add(me); return me;
    }
    function buildWalls(F, gm) {
      G.walls.clear(); G.stairs.clear();
      const th0 = Math.max(1, sq / 1.524), H = wallH();
      for (const s of R3.walls(F, gm, S.walls)) {
        const th = (s.ext ? .22 : .12) * th0, top = s.tall ? H : Math.min(LOW, H), side = s.ext ? extM : wallM, mats = [side, side, capM, side, side, side];
        const [x0, z0, x1, z1] = s.or === "h" ? [s.i0 * sq, s.k * sq, s.i1 * sq, s.k * sq] : [s.k * sq, s.i0 * sq, s.k * sq, s.i1 * sq];
        const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = s.or === "v" ? Math.PI / 2 : 0, data = { wall: s };
        const piece = (y0, y1, mat, l, off, thick) => { const me = box((l == null ? len + th : l), y1 - y0, thick || th, mat, cx + (s.or === "h" ? off || 0 : 0), y0, cz + (s.or === "v" ? off || 0 : 0), ry, G.walls, data); return me; };
        if (!s.t) { piece(0, top, mats); continue; }
        if (s.t === "s") { piece(0, top, gm ? [secretM, secretM, capM, secretM, secretM, secretM] : mats); continue; }
        if (s.t === "w") { const sill = Math.min(.9, top); piece(0, sill, mats); if (top > sill) piece(sill, Math.min(2.1, top), glassM, len, 0, th * .3); if (top > 2.1) piece(2.1, top, mats); continue; }
        // a doorway: its posts, a lintel in a full wall, and the door standing open into the room on the camera's side
        const post = .09, dh = Math.min(2.1, top);
        piece(0, top, side, post, -len / 2 + post / 2, th * 1.05); piece(0, top, side, post, len / 2 - post / 2, th * 1.05);
        if (top > 2.15) piece(2.15, top, mats, len, 0);
        if (s.t === "a") continue;
        if (s.t === "g") { const n = Math.max(3, Math.round(len / .14)); for (let k = 1; k < n; k++) { const off = -len / 2 + k * len / n; piece(0, Math.min(1.8, top), ironM, .025, off, .025); } continue; }
        const leaves = s.t === "dd" ? 2 : 1, lw = (len - post * 2) / leaves;
        for (let k = 0; k < leaves; k++) {
          // hinged at the end of the opening, swung open towards the camera (to the south of an east-west wall, to the west of a north-south one)
          const hinge = -len / 2 + post + (k ? len - post * 2 : 0), dir = k ? -1 : 1;
          const g = new T.Group(); const leaf = box(lw * .96, dh, .045, woodM, dir * lw * .48, 0, 0, 0, g, data);
          leaf.position.y = dh / 2;
          if (s.or === "h") { g.position.set(cx + hinge, 0, cz); g.rotation.y = dir * -Math.PI / 2 * .92; } else { g.position.set(cx, 0, cz + hinge); g.rotation.y = Math.PI / 2 + dir * -Math.PI / 2 * .92; }
          G.walls.add(g);
        }
      }
      // stairs: steps rising across them
      const inHidden = (x, y) => (F.R || []).some(q => q[7] && q[7].h && x >= q[1] && x < q[1] + q[3] && y >= q[2] && y < q[2] + q[4]);
      for (const st of F.ST || []) {
        const [, x, y, w, h, ud, , dir = "n"] = st; if (!gm && inHidden(x + w / 2, y + h / 2)) continue;
        const n = 8, vert = dir === "n" || dir === "s";
        for (let k = 0; k < n; k++) {
          const f = k / n, hh = Math.max(.05, (ud === "up" ? (k + 1) / n : 1 - k / n) * 1.2), sw = vert ? w * sq : w * sq / n, sd = vert ? h * sq / n : h * sq;
          const sx = x * sq + (vert ? w * sq / 2 : (dir === "e" ? f : 1 - f - 1 / n) * w * sq + sw / 2), sz = y * sq + (vert ? (dir === "s" ? f : 1 - f - 1 / n) * h * sq + sd / 2 : h * sq / 2);
          box(sw, hh, sd, stepM, sx, 0, sz, 0, G.stairs, { stair: st[0] });
        }
      }
    }

    /* -- models: the furniture raised from the drawing, and the game master's own */
    const ghostMats = new Map();
    function ghostly(obj, a, tint) {
      obj.traverse(ch => { if (!ch.isMesh) return; const one = m => { const k = m.uuid + a + (tint || ""); let g = ghostMats.get(k); if (!g) { g = m.clone(); g.transparent = true; g.opacity = a; g.depthWrite = a > .7; if (tint) { g.color = new T.Color(tint); g.map = null; } ghostMats.set(k, g); } return g; }; ch.material = Array.isArray(ch.material) ? ch.material.map(one) : one(ch.material); ch.castShadow = false; });
      return obj;
    }
    async function modelObj(p, e, opts) {
      if (e.load && !e.gltf) { try { await e.load(); } catch (x) { return null; } }
      const obj = M.build(T, p); if (!obj) return null;
      const s = p.s || 1, H = wallH(); obj.scale.setScalar(s);
      const lift = e.mount === "ceiling" ? Math.max(0, H - .1 - M.dims(e, p)[2] * s) : e.mount === "wall" ? (p.z != null ? p.z : (e.p.y0 != null ? e.p.y0 : 1.2)) : (p.z || 0);
      obj.position.set(p.x * sq, lift, p.y * sq); obj.rotation.y = -rad(p.r || 0);
      obj.traverse(ch => { if (ch.isMesh) ch.castShadow = ch.receiveShadow = true; });
      // a lamp hanging from a ceiling the camera cannot see would hide the room under it: it is drawn faintly
      if (e.mount === "ceiling" && S.walls !== "full") ghostly(obj, .35);
      if (opts && opts.hidden) ghostly(obj, .5);
      obj.userData = Object.assign({ base: [p.x, p.y, p.r || 0, lift] }, opts && opts.data);
      return obj;
    }
    const pkey = p => M.specKey(p) + "|" + [p.x, p.y, p.r || 0, p.s || 1, p.z || 0, p.h ? 1 : 0].join(",");
    async function buildProps(F, gm, g) {
      const list = (F.P || []).map((p, i) => [p, i]).filter(([p]) => gm || !p.h);
      const keepIdx = new Set(list.map(([, i]) => i));
      // what is gone or changed is taken off; what is new is built
      for (let i = S.props.length - 1; i >= 0; i--) { const it = S.props[i]; if (!it) continue; const p = (F.P || [])[i]; if (!keepIdx.has(i) || !p || it.k !== pkey(p)) { G.props.remove(it.obj); S.props[i] = null; } }
      S.props.length = (F.P || []).length;
      for (const [p, i] of list) {
        if (S.props[i]) continue; const e = M.entry(p.a); if (!e) continue;
        const obj = await modelObj(p, e, { hidden: p.h && gm, data: { pi: i } }); if (g !== S.gen || gone) return;
        if (obj) { G.props.add(obj); S.props[i] = { k: pkey(p), obj }; dirty(); }
      }
    }
    async function buildItems(F, gm, g) {
      G.items.clear(); S.items = [];
      const inHidden = (x, y) => (F.R || []).some(q => q[7] && q[7].h && x >= q[1] && x < q[1] + q[3] && y >= q[2] && y < q[2] + q[4]);
      for (const it of F.I || []) {
        if (!gm && (it[6] || inHidden(it[1] + (it[3] || 1) / 2, it[2] + (it[4] || 1) / 2))) continue;
        for (const p of R3.raise(it, F) || []) {
          const e = M.entry(p.a), obj = await modelObj(p, e, { data: { item: it[0], name: e.n } }); if (g !== S.gen || gone) return;
          if (obj) { G.items.add(obj); S.items.push({ p, e, obj }); }
        }
      }
      dirty();
    }
    // the top of whatever a marker stands on: a table, a counter, a chest
    function surfaceAt(x, y) {
      let top = 0;
      // (a 2D drawing stands as tall as the models the 3D view raises it as)
      const on = (p, e) => { if (!e || (e.mount && e.mount !== "floor")) return; const [w, d, h0] = M.dims(e, p), s = e.d2 && A.sprites ? 1 : p.s || 1, h = e.d2 && A.sprites ? A.sprites.height(e, p) * (p.s || 1) : h0; if (h * s > 1.3) return; const a = -rad(p.r || 0), dx = x - p.x, dy = y - p.y, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(lx) <= w * s / sq / 2 && Math.abs(ly) <= d * s / sq / 2) top = Math.max(top, (p.z || 0) + h * s); };
      for (const p of (S.F && S.F.P) || []) on(p, M.entry(p.a));
      for (const it of S.items) on(it.p, it.e);
      return top;
    }

    /* -- markers: a clue is a pin standing where it lies, a person a figure, a secret or a danger a pin of its colour */
    const spriteTex = new Map();
    function badge(col, glyph, text) {
      const k = col + "|" + glyph + "|" + text; if (spriteTex.has(k)) return spriteTex.get(k);
      const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c = cv.getContext("2d");
      c.beginPath(); c.arc(64, 64, 54, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 9; c.strokeStyle = "#fff"; c.stroke();
      if (glyph) { c.save(); c.translate(64, 64); c.scale(8, 8); c.lineWidth = 1.15; c.lineCap = c.lineJoin = "round"; c.strokeStyle = "#fff"; c.stroke(new Path2D(glyph)); c.restore(); }
      else { c.fillStyle = "#fff"; c.font = `bold ${text.length > 2 ? 40 : 50}px ${A.config.fonts && A.config.fonts.mono || "monospace"}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 64, 67); }
      const t = own(new T.CanvasTexture(cv)); spriteTex.set(k, t); return t;
    }
    function tag(text, col) {
      const k = "t|" + text + "|" + col; if (spriteTex.has(k)) return spriteTex.get(k);
      const cv = document.createElement("canvas"); cv.width = 128; cv.height = 48; const c = cv.getContext("2d");
      c.fillStyle = "rgba(20,16,12,.82)"; c.beginPath(); c.roundRect ? c.roundRect(4, 6, 120, 36, 10) : c.rect(4, 6, 120, 36); c.fill();
      c.fillStyle = "#fff"; c.font = `bold 26px ${A.config.fonts && A.config.fonts.mono || "monospace"}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 64, 25);
      const t = own(new T.CanvasTexture(cv)); spriteTex.set(k, t); return t;
    }
    const stemGeo = own(new T.CylinderGeometry(.018, .018, 1, 6)), ringGeo = own(new T.RingGeometry(.12, .2, 24)), pawnGeo = own(new T.CylinderGeometry(.13, .2, .82, 16)), headGeo = own(new T.SphereGeometry(.13, 16, 12)), footGeo = own(new T.CylinderGeometry(.24, .26, .06, 24));
    const pinMats = new Map(); const pinMat = col => { if (!pinMats.has(col)) pinMats.set(col, own(new T.MeshStandardMaterial({ color: col, roughness: .5 }))); return pinMats.get(col); };
    const ringMats = new Map(); const ringMat = col => { if (!ringMats.has(col)) ringMats.set(col, own(new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .9, side: T.DoubleSide, depthWrite: false }))); return ringMats.get(col); };
    function buildPins(F) {
      G.pins.clear(); S.pins = {};
      if (!S.gm || o.markers === false) return;
      const MK = A.markers();
      for (const m of F.M || []) {
        const [mid, x, y] = m, l = mid[0], isClue = A.dirOf(mid) === "clues";
        const rec = o.recOf ? o.recOf(mid) : null;
        if (isClue && ((o.noClues && o.noClues()) || (rec && rec.arch))) continue;
        const col = (MK[l] || MK.C)[0], top = surfaceAt(x, y), g = new T.Group();
        g.position.set(x * sq, top, y * sq); g.userData = { mid, base: [x, y, top] };
        if (l === "N") {
          // a person: a figure on a round foot, their marker over them
          const f = new T.Mesh(footGeo, pinMat(col)); f.position.y = .03; const b = new T.Mesh(pawnGeo, pinMat(col)); b.position.y = .47; const h = new T.Mesh(headGeo, pinMat(0xe9dcc8)); h.position.y = 1.0;
          [f, b, h].forEach(me => { me.castShadow = true; me.userData = { mid }; g.add(me); });
          const sp = new T.Sprite(own(new T.SpriteMaterial({ map: badge(col, "", mid), depthTest: false, transparent: true }))); sp.scale.set(.42, .42, 1); sp.position.y = 1.45; sp.renderOrder = 30; sp.userData = { mid }; g.add(sp);
        } else {
          const stem = new T.Mesh(stemGeo, pinMat(col)); stem.scale.y = .62; stem.position.y = .31; stem.userData = { mid }; g.add(stem);
          const ring = new T.Mesh(ringGeo, ringMat(col)); ring.rotation.x = -Math.PI / 2; ring.position.y = .012; ring.userData = { mid }; g.add(ring);
          const glyph = isClue && rec && rec.k && A.clueGlyph ? A.clueGlyph(rec.k) : "";
          const sp = new T.Sprite(own(new T.SpriteMaterial({ map: badge(col, glyph, mid), depthTest: false, transparent: true }))); sp.scale.set(.4, .4, 1); sp.position.y = .78; sp.renderOrder = 30; sp.userData = { mid }; g.add(sp);
          if (glyph) { const tg = new T.Sprite(own(new T.SpriteMaterial({ map: tag(mid, col), depthTest: false, transparent: true }))); tg.scale.set(.36, .135, 1); tg.position.y = 1.04; tg.renderOrder = 31; tg.userData = { mid }; g.add(tg); }
        }
        G.pins.add(g); S.pins[mid] = g;
      }
    }

    /* -- a picture laid over the floor to trace (the editor's) */
    let underKey = "";
    function drawUnder(U) {
      const k = U ? [U.src.length, U.x, U.y, U.w, U.ratio, U.op].join("|") : ""; if (k === underKey) return; underKey = k;
      G.under.children.forEach(c => { c.geometry.dispose(); if (c.material.map) c.material.map.dispose(); c.material.dispose(); }); G.under.clear();
      if (!U) return;
      const tex = new T.TextureLoader().load(U.src, () => dirty());
      const me = new T.Mesh(new T.PlaneGeometry(U.w * sq, U.w * U.ratio * sq), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: U.op, depthWrite: false }));
      me.rotation.x = -Math.PI / 2; me.position.set((U.x + U.w / 2) * sq, .006, (U.y + U.w * U.ratio / 2) * sq); G.under.add(me);
    }

    /* -- light */
    function lightUp(F) {
      const k = S.lightOver || S.light, L = LIGHT[k] || LIGHT.normal;
      G.lights.children.forEach(l => { if (l.dispose) l.dispose(); }); G.lights.clear(); S.lamps = [];
      scene.background = new T.Color(L.bg);
      hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
      const W = F.w * sq, D = F.h * sq, big = Math.max(W, D);
      sun.color.set(L.sun); sun.intensity = L.si; sun.position.set(W / 2 - big * .45, big * 1.2, D / 2 - big * .35); sun.target.position.set(W / 2, 0, D / 2);
      Object.assign(sun.shadow.camera, { left: -big * .8, right: big * .8, top: big * .8, bottom: -big * .8, near: .1, far: big * 4 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.needsUpdate = true;
      // lamps: where the room has something that gives light, or else in its biggest rooms; never more than eight
      const at = [];
      for (const it of S.items) if (it.p.glow || GLOW_RX.test(it.p.a)) at.push([it.p.x, it.p.y]);
      for (const p of F.P || []) if ((GLOW_RX.test(p.a) || (M.entry(p.a) || {}).glow) && (S.gm || !p.h)) at.push([p.x, p.y]);
      if (at.length < 3 && k !== "normal" && k !== "lab") for (const q of (F.R || []).filter(q => A.isIndoorKind(q[6]) && (S.gm || !(q[7] && q[7].h))).sort((a, b) => b[3] * b[4] - a[3] * a[4]).slice(0, 6)) at.push([q[1] + q[3] / 2, q[2] + q[4] / 2]);
      const pick = []; for (const p of at) if (pick.length < 8 && !pick.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 3)) pick.push(p);
      pick.forEach(([x, y], i) => { const pl = new T.PointLight(L.lamp[i % L.lamp.length], L.li, sq * 9, 1.6); pl.position.set(x * sq, 1.9, y * sq); G.lights.add(pl); S.lamps.push({ l: pl, base: L.li, ph: i * 1.7 }); });
      anim = !!L.fx && S.lamps.length > 0; wrap.dataset.light = k; if (anim) dirty();
    }
    function animate(t) {
      const L = LIGHT[S.lightOver || S.light] || LIGHT.normal, s = t / 1000;
      for (const m of S.lamps) {
        if (L.fx === "flicker") m.l.intensity = m.base * (.82 + .1 * Math.sin(s * 9 + m.ph) + .08 * Math.sin(s * 23.7 + m.ph * 2));
        else if (L.fx === "pulse") m.l.intensity = m.base * (.35 + .65 * Math.max(0, Math.sin(s * 2.4 + m.ph)));
        else if (L.fx === "hum") m.l.intensity = m.base * (.9 + .1 * Math.sin(s * 3 + m.ph));
      }
    }

    /* -- what the editor shows over the room: what is chosen, the handles, what is being drawn or put down */
    const selM = own(new T.MeshBasicMaterial({ color: 0xf0a83a, transparent: true, opacity: .95, depthTest: false, depthWrite: false }));
    const ghostM = own(new T.MeshBasicMaterial({ color: 0x3fa7d6, transparent: true, opacity: .3, depthTest: false, depthWrite: false }));
    const edgeM = own(new T.MeshBasicMaterial({ color: 0x3fa7d6, transparent: true, opacity: .95, depthTest: false, depthWrite: false }));
    const handM = own(new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
    let overKey = "";
    function flat(x0, z0, x1, z1, y, mat, t) {
      // a ribbon on the floor from one point to another
      const len = Math.hypot(x1 - x0, z1 - z0); if (len < .001) return;
      const me = new T.Mesh(new T.BoxGeometry(len + t, .015, t), mat); me.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); me.rotation.y = -Math.atan2(z1 - z0, x1 - x0); me.renderOrder = 20; G.over.add(me);
    }
    function outline(pts, y, mat, t) { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; flat(a[0] * sq, a[1] * sq, b[0] * sq, b[1] * sq, y, mat, t); } }
    function drawOver(list) {
      G.over.children.forEach(c => { if (c.geometry) c.geometry.dispose(); }); G.over.clear();
      for (const s of list) {
        if (s.t === "rect") outline([[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]], .03, selM, .07);
        else if (s.t === "ghost") { const me = new T.Mesh(new T.BoxGeometry(s.w * sq, .05, s.h * sq), ghostM); me.position.set((s.x + s.w / 2) * sq, .03, (s.y + s.h / 2) * sq); me.renderOrder = 19; G.over.add(me); outline([[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]], .06, edgeM, s.thin ? .04 : .07); }
        else if (s.t === "handle") { const me = new T.Mesh(s.rot ? new T.CylinderGeometry(.16, .16, .04, 20) : new T.BoxGeometry(.24, .05, .24), s.rot ? selM : handM); me.position.set(s.x * sq, (s.z || 0) + .04, s.y * sq); me.renderOrder = 22; me.userData = { handle: [s.x, s.y] }; G.over.add(me); if (s.from) flat(s.from[0] * sq, s.from[1] * sq, s.x * sq, s.y * sq, (s.z || 0) + .03, selM, .03); }
        else if (s.t === "bar") { const [x0, z0, x1, z1] = s.o === "h" ? [s.x, s.y, s.x + s.len, s.y] : [s.x, s.y, s.x, s.y + s.len]; flat(x0 * sq, z0 * sq, x1 * sq, z1 * sq, .05, selM, .14); }
        else if (s.t === "ring") { const g = S.pins[s.mid]; if (!g) continue; const me = new T.Mesh(new T.RingGeometry(.3, .4, 32), selM); me.rotation.x = -Math.PI / 2; me.position.set(g.position.x, g.position.y + .02, g.position.z); me.renderOrder = 21; G.over.add(me); }
        else if (s.t === "prop") { const p = s.p; if (!p) continue; outline(s.corners, (p.z || 0) + .03, selM, .05); }
      }
    }
    // the ghost of a model being put down
    let ghostKey = "";
    async function drawGhost(list) {
      const k = (list || []).map(p => M.specKey(p)).join(";");
      if (k !== ghostKey) {
        ghostKey = k; G.ghost.clear();
        for (const p of list || []) { const e = M.entry(p.a); if (!e) continue; const obj = await modelObj(Object.assign({}, p, { x: 0, y: 0, r: 0, z: 0 }), e); if (!obj || ghostKey !== k) return; ghostly(obj, .55); obj.userData.ghost = 1; G.ghost.add(obj); }
      }
      (list || []).forEach((p, i) => { const obj = G.ghost.children[i]; if (!obj) return; const e = M.entry(p.a), lift = e && e.mount === "wall" ? (p.z != null ? p.z : (e.p.y0 != null ? e.p.y0 : 1.2)) : (p.z || 0); obj.position.set(p.x * sq, lift, p.y * sq); obj.rotation.y = -rad(p.r || 0); obj.scale.setScalar(p.s || 1); });
      G.ghost.visible = !!(list && list.length && S.hoverOn);
    }
    // each frame, the editor's moving things: models and markers being dragged, the ghost, the overlay
    function sync() {
      if (!o.overlay) return;
      const ov = o.overlay() || [], k = JSON.stringify(ov);
      if (k !== overKey) { overKey = k; drawOver(ov); }
      const pv = (o.preview && o.preview()) || {};
      S.props.forEach((it, i) => { if (!it) return; const b = it.obj.userData.base, q = (pv.props || {})[i]; it.obj.position.x = (q ? q.x : b[0]) * sq; it.obj.position.z = (q ? q.y : b[1]) * sq; it.obj.rotation.y = -rad(q ? q.r : b[2]); });
      for (const [mid, g] of Object.entries(S.pins || {})) { const b = g.userData.base, q = (pv.pins || {})[mid]; g.position.x = (q ? q.x : b[0]) * sq; g.position.z = (q ? q.y : b[1]) * sq; }
      drawGhost(pv.ghost || null);
    }

    /* -- the pointer: a point on the map, in squares. What it means depends on what is under it: a marker, a wall (its
          foot), a model (the point of it the pointer is on) or the floor. In a drag, the height the drag began at. */
    function hits(cx, cy, want) {
      rayAt(cx, cy); const targets = [];
      if (want.handles) targets.push(G.over); if (want.pins) targets.push(G.pins); if (want.walls) targets.push(G.walls); if (want.models) targets.push(G.props, G.items); if (want.stairs) targets.push(G.stairs);
      return ray.intersectObjects(targets, true).filter(h => h.object.visible !== false && !(h.object.material && h.object.material.opacity < .4 && !h.object.userData.handle));
    }
    const dataOf = obj => { while (obj && obj !== scene) { const u = obj.userData || {}; if (u.mid || u.handle || u.wall || u.pi != null || u.item || u.stair) return u; obj = obj.parent; } return {}; };
    const WANT = { select: { handles: 1, pins: 1, walls: 1, models: 1, stairs: 1 }, floor: { walls: 1, models: 1 }, wall: { walls: 1, models: 1, stairs: 1 }, props: { handles: 1, models: 1, walls: 1 }, place: { models: 1, walls: 1 }, clues: { pins: 1, models: 1, walls: 1 }, view: { pins: 1, models: 1, walls: 1, stairs: 1 } };
    function mapPoint(ev, mode) {
      let p = null, h = 0, what = null;
      if (mode === "drag") { const g = groundAt(ev.clientX, ev.clientY, S.grabY); p = g ? { x: g.x / sq, y: g.z / sq } : S.last; }
      else {
        const hit = hits(ev.clientX, ev.clientY, WANT[mode] || WANT.floor).find(x => !dataOf(x.object).ghost);
        const u = hit ? dataOf(hit.object) : {};
        if (u.handle) { p = { x: u.handle[0], y: u.handle[1] }; h = 0; what = { handle: 1 }; }
        else if (u.mid) { const g = S.pins[u.mid]; p = { x: g.userData.base[0], y: g.userData.base[1] }; h = g.userData.base[2]; what = { mid: u.mid }; }
        else if (u.wall) { const w = u.wall; p = w.or === "h" ? { x: clamp(hit.point.x / sq, w.i0, w.i1 - .001), y: w.k + .001 } : { x: w.k - .001, y: clamp(hit.point.z / sq, w.i0, w.i1 - .001) }; h = 0; what = { wall: w }; }
        else if (hit) { p = { x: hit.point.x / sq, y: hit.point.z / sq }; h = hit.point.y; what = u.pi != null ? { pi: u.pi } : u.item ? { item: u.item, name: u.name } : u.stair ? { stair: u.stair } : {}; }
        else { const g = groundAt(ev.clientX, ev.clientY); p = g ? { x: g.x / sq, y: g.z / sq } : { x: -1, y: -1 }; what = { floor: 1 }; }
        if (ev.type === "pointerdown") S.grabY = h;
      }
      S.last = p; S.what = what; dirty(); return p;
    }

    /* -- the mouse, the wheel, the keys and fingers: they slide and zoom; none of them turns the view */
    const ev = o.events || wrap, K = { pan: null, touch: new Map(), pinch: null, space: false };
    const onCanvas = e => e.target === r.domElement;
    function startPan(e) { K.pan = { x: e.clientX, y: e.clientY, id: e.pointerId }; wrap.classList.add("r3-panning"); try { ev.setPointerCapture(e.pointerId); } catch (x) {} }
    const downCap = e => {
      if (!onCanvas(e)) return;
      r.domElement.focus({ preventScroll: true });
      if (e.pointerType === "touch") {
        K.touch.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (K.touch.size === 2) { if (o.cancelTool) o.cancelTool(); K.pan = null; const [a, b] = [...K.touch.values()]; K.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; e.stopImmediatePropagation(); e.preventDefault(); return; }
        if (K.touch.size > 2) { e.stopImmediatePropagation(); return; }
      }
      if (e.button === 1 || e.button === 2 || (e.button === 0 && (K.space || o.panOnly))) { startPan(e); if (e.button !== 2) { e.stopImmediatePropagation(); e.preventDefault(); } K.pan.btn = e.button; if (o.panOnly) K.pan.click = { x: e.clientX, y: e.clientY, t: Date.now() }; }
    };
    const downLate = e => { if (!onCanvas(e) || K.pan || K.pinch || e.button !== 0 || e.pointerType === "touch" && K.touch.size > 1) return; if (o.panIfFree && o.panIfFree()) startPan(e); };
    const moveCap = e => {
      if (K.pinch && K.touch.has(e.pointerId)) {
        K.touch.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a, b] = [...K.touch.values()]; if (!b) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        panPx(cx - K.pinch.cx, cy - K.pinch.cy); if (K.pinch.d > 10 && d > 10) zoomAt(d / K.pinch.d, cx, cy);
        // the angle between the two fingers is not read: two fingers turning do not turn the view
        K.pinch = { d, cx, cy }; e.stopImmediatePropagation(); return;
      }
      if (K.touch.has(e.pointerId)) K.touch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (K.pan && e.pointerId === K.pan.id) { panPx(e.clientX - K.pan.x, e.clientY - K.pan.y); K.pan.x = e.clientX; K.pan.y = e.clientY; K.pan.moved = true; e.stopImmediatePropagation(); return; }
      if (onCanvas(e)) { S.hoverOn = true; hover(e); }
    };
    const upCap = e => {
      if (K.touch.has(e.pointerId)) { K.touch.delete(e.pointerId); if (K.pinch) { if (K.touch.size < 2) K.pinch = null; e.stopImmediatePropagation(); return; } }
      if (K.pan && e.pointerId === K.pan.id) {
        const pn = K.pan; K.pan = null; wrap.classList.remove("r3-panning");
        if (pn.click && !pn.moved && o.onPick && e.type === "pointerup") { const hit = mapPoint(e, "view"); o.onPick(Object.assign({}, S.what || {}, hit || {})); }
        if (pn.btn !== 2 || pn.moved) e.stopImmediatePropagation();
      }
    };
    const leave = () => { S.hoverOn = false; tipEl.hidden = true; dirty(); };
    const wheel = e => { if (o.wheelForTool && o.wheelForTool(e)) return; e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016)), e.clientX, e.clientY); };
    const ctx = e => { if (onCanvas(e)) e.preventDefault(); };
    const kd = e => { if (e.key === " " && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) { if (!K.space) { K.space = true; wrap.classList.add("r3-space"); } } };
    const ku = e => { if (e.key === " ") { K.space = false; wrap.classList.remove("r3-space"); } };
    ev.addEventListener("pointerdown", downCap, true); ev.addEventListener("pointerdown", downLate); ev.addEventListener("pointermove", moveCap, true); ev.addEventListener("pointerup", upCap, true); ev.addEventListener("pointercancel", upCap, true);
    r.domElement.addEventListener("pointerleave", leave); wrap.addEventListener("wheel", wheel, { passive: false }); wrap.addEventListener("contextmenu", ctx);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    // what is under the pointer, named
    let hoverT = 0;
    function hover(e) {
      if (hoverT) return; hoverT = requestAnimationFrame(() => {
        hoverT = 0; if (gone || !S.F) return;
        const hit = hits(e.clientX, e.clientY, WANT.view)[0], u = hit ? dataOf(hit.object) : {};
        let t = "";
        if (u.mid) t = u.mid + (o.nameOf ? ": " + (o.nameOf(u.mid) || "") : "");
        else if (u.pi != null) { const p = (S.F.P || [])[u.pi], e2 = p && M.entry(p.a); t = e2 ? e2.n + (p.h ? " (hidden from the players)" : "") : ""; }
        else if (u.item) t = u.name || "";
        else { const g = hit ? hit.point : groundAt(e.clientX, e.clientY); const q = g && roomOf(S.F, g.x / sq, g.z / sq); if (q && q[5]) t = (/^R\d/.test(q[0]) ? q[0] + " · " : "") + q[5]; }
        if (!t) { tipEl.hidden = true; return; }
        const b = wrap.getBoundingClientRect(); tipEl.textContent = t; tipEl.hidden = false; tipEl.style.left = Math.min(b.width - 20, e.clientX - b.left + 14) + "px"; tipEl.style.top = (e.clientY - b.top + 16) + "px";
      });
      dirty();
    }
    // the view's own buttons
    hud.addEventListener("click", e => {
      const b = e.target.closest("[data-r3]"); if (!b || b.tagName === "SELECT") return;
      if (b.dataset.r3 === "zin") zoomAt(1.25); else if (b.dataset.r3 === "zout") zoomAt(.8); else if (b.dataset.r3 === "fit") fit(); else if (b.dataset.r3 === "reset") fitFloor();
      else if (b.dataset.r3 === "grid") { S.grid = !S.grid; keep("grid", S.grid ? "1" : "0"); b.setAttribute("aria-pressed", S.grid); G.grid.visible = S.grid; if (o.onGrid) o.onGrid(S.grid); dirty(); }
    });
    hud.addEventListener("change", e => {
      const t = e.target; if (t.dataset.r3 === "walls") { S.walls = t.value; keep("walls", t.value); if (o.onWalls) o.onWalls(t.value); if (S.F) { buildWalls(S.F, S.gm); S.props.forEach((it, i) => { if (it) { G.props.remove(it.obj); S.props[i] = null; } }); buildProps(S.F, S.gm, S.gen); } dirty(); }
      if (t.dataset.r3 === "light") { if (o.onLight) o.onLight(t.value); else { S.lightOver = t.value; if (S.F) lightUp(S.F); dirty(); } }
    });
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null; if (ro) ro.observe(wrap);
    size();

    /* -- the stage's own words */
    const st = {
      /* show a floor: F (finished), and { gm, svg() (its 2D drawing), light, key (where it is remembered), under } */
      async show(F, s) {
        const g = ++S.gen; s = s || {};
        const geoK = JSON.stringify([F.w, F.h, F.R, F.D, F.ST, s.gm, F.wh]), itemK = JSON.stringify([F.I, F.R, s.gm]), first = !S.F;
        const keyChanged = s.key !== S.key; S.key = s.key || ""; S.F = F; S.gm = s.gm !== false; S.light = s.light || "normal";
        if (keyChanged) { S.lightOver = ""; S.props.forEach(it => it && G.props.remove(it.obj)); S.props = []; }
        hud.querySelector('[data-r3="walls"]').value = S.walls; hud.querySelector('[data-r3="light"]').value = S.lightOver || S.light; hud.querySelector('[data-r3="grid"]').setAttribute("aria-pressed", S.grid);
        floorMesh.scale.set(F.w * sq, F.h * sq, 1); floorMesh.position.set(F.w * sq / 2, 0, F.h * sq / 2);
        if (S.keys.geo !== geoK + S.walls) { S.keys.geo = geoK + S.walls; buildWalls(F, S.gm); drawGrid(F); }
        // the drawing on the floor: the furniture raised in 3D, the markers and the models are left off it
        let svg = "";
        A.__noProps = true; A.__noMarkers = true; A.__raise = it => !!R3.raise(it, F);
        try { svg = s.svg ? s.svg() : ""; } finally { A.__noProps = false; A.__noMarkers = false; A.__raise = null; }
        if (svg && svg !== S.keys.svg) { S.keys.svg = svg; drawFloor(svg, F); }
        drawUnder(s.under || null);
        if (S.keys.items !== itemK) { S.keys.items = itemK; await buildItems(F, S.gm, g); if (g !== S.gen) return; }
        await buildProps(F, S.gm, g); if (g !== S.gen || gone) return;
        buildPins(F);
        const lk = JSON.stringify([S.lightOver || S.light, F.w, F.h, (F.P || []).filter(p => GLOW_RX.test(p.a)).map(p => [p.x, p.y]), S.items.length]);
        if (S.keys.light !== lk) { S.keys.light = lk; lightUp(F); }
        if (keyChanged || first) { const v = VIEWS.get(S.key); if (v) { cam.position.fromArray(v.p); cam.zoom = v.z; cam.updateProjectionMatrix(); } else fitFloor(); }
        overKey = ""; dirty();
      },
      mapPoint, fit, fitFloor, reset: fitFloor,
      zoomBy: f => zoomAt(f), panBy: (dx, dy) => panPx(dx, dy),
      last: () => S.last, hover: () => S.hoverOn, what: () => S.what,
      surfaceAt, dirty,
      // for the tests: the camera as it stands
      camState: () => ({ q: cam.quaternion.toArray().map(v => +v.toFixed(9)), type: cam.type, ortho: !!cam.isOrthographicCamera, zoom: cam.zoom, pos: cam.position.toArray(), up: cam.up.toArray(), fov: cam.fov == null ? null : cam.fov }),
      setLight(k) { S.lightOver = ""; S.light = k; if (S.F) lightUp(S.F); hud.querySelector('[data-r3="light"]').value = k; dirty(); },
      el: wrap, renderer: r, scene, camera: cam,
      dispose() {
        gone = true; cancelAnimationFrame(raf); if (ro) ro.disconnect();
        ev.removeEventListener("pointerdown", downCap, true); ev.removeEventListener("pointerdown", downLate); ev.removeEventListener("pointermove", moveCap, true); ev.removeEventListener("pointerup", upCap, true); ev.removeEventListener("pointercancel", upCap, true);
        window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); document.removeEventListener("atlas-sprite-drawn", onDrawn);
        if (floorMat.map) floorMat.map.dispose();
        for (const x of S.disp) { try { x.dispose(); } catch (e) {} }
        for (const m of ghostMats.values()) m.dispose();
        G.over.children.forEach(c => c.geometry && c.geometry.dispose()); G.grid.children.forEach(c => c.geometry.dispose());
        if (scene.environment) scene.environment.dispose();
        r.dispose(); wrap.remove();
      }
    };
    R3.active = st;
    return st;
  };

  /* ================================================================ a place's floor in 3D, from its page */
  const pageView = () => (document.getElementById("app") && document.getElementById("app").dataset.mode === "player") || A.state.v === "player" ? "player" : "gm";
  function placeOpts(id, fi, gm) {
    const pk = A.keyOf(id), Mp = A.get(id), F = Mp.floors[fi];
    return {
      F, opts: { gm, svg: () => A.svg(id, fi, gm ? "gm" : "player", "r3" + (A.state.n++)), light: R3.lightOf(pk, F), key: pk + "/" + fi + "/" + (gm ? "g" : "p") },
      stage: {
        markers: gm, noClues: () => A.state.noClues,
        recOf: mid => (A.get(id).clues || {})[mid] || null,
        nameOf: mid => { const d = A.get(id)[A.dirOf(mid)] || {}, e = d[mid] || {}; return e.t || e.n || (A.castData && e.who && A.castData[e.who] ? A.castData[e.who].n : ""); },
        // a click on a marker opens its clue in the investigation (or its entry in the guide); on a room, its entry
        onPick: hit => {
          if (hit.mid && A.dirOf(hit.mid) === "clues" && A.clueUI && gm) { const dlg = document.getElementById("r3Dlg"); if (dlg && dlg.open) dlg.close(); A.clueUI.open("clue:" + pk + "/" + hit.mid); return; }
          let ref = hit.mid; if (!ref) { const q = roomOf(F, hit.x, hit.y); ref = q && q[0]; }
          const el = ref && document.getElementById(`lm-${id}-${ref}`); if (!el) return;
          const dlg = document.getElementById("r3Dlg"); if (dlg && dlg.open) dlg.close();
          if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("lm-hl"); void el.offsetWidth; el.classList.add("lm-hl");
        }
      }
    };
  }
  let pageStage = null;
  R3.page = async (id, fi) => {
    let dlg = document.getElementById("r3Dlg");
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "r3Dlg"; dlg.className = "m3-dlg r3-dlg";
      dlg.innerHTML = `<div class="m3-bar"><b class="m3-t"></b><div class="lm-floors m3-fl"></div><span class="t-sp"></span><button type="button" data-r3d="x">Close</button></div><div class="m3-view r3-host"></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("close", () => { if (pageStage) { pageStage.dispose(); pageStage = null; } });
      dlg.addEventListener("click", e => { const b = e.target.closest("[data-r3d], [data-r3f]"); if (!b) return; if (b.dataset.r3d === "x") dlg.close(); else R3.page(dlg.dataset.id, +b.dataset.r3f); });
      dlg.addEventListener("keydown", e => { if (!pageStage || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; const ar = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] }[e.key]; if (ar) { e.preventDefault(); pageStage.panBy(ar[0], ar[1]); } else if (e.key === "+" || e.key === "=") pageStage.zoomBy(1.2); else if (e.key === "-") pageStage.zoomBy(1 / 1.2); else if (e.key === "Home" || e.key === "0") pageStage.fitFloor(); });
    }
    const Mp = A.get(id), gm = pageView() !== "player";
    if (!Mp.floors[fi]) fi = 0;
    dlg.dataset.id = id; dlg.dataset.fi = fi;
    dlg.querySelector(".m3-t").textContent = `${(A.meta[id] || {}).name || Mp.t}: ${Mp.floors[fi].n}`;
    dlg.querySelector(".m3-fl").innerHTML = (Mp.order || Mp.floors.map((_, i) => i)).map(i => { const G = Mp.floors[i]; return !gm && A.isGmFloor(G) ? "" : `<button type="button" data-r3f="${i}" aria-pressed="${i === fi}">${esc(G.n)}</button>`; }).join("");
    if (!dlg.open) dlg.showModal();
    const P = placeOpts(id, fi, gm), host = dlg.querySelector(".r3-host");
    try {
      if (!pageStage) { host.innerHTML = `<p class="m3-wait">Building the room…</p>`; pageStage = await R3.stage(host, Object.assign({ panOnly: true }, P.stage)); host.querySelector(".m3-wait") && host.querySelector(".m3-wait").remove(); }
      else Object.assign(pageStage, {});
      await pageStage.show(P.F, P.opts);
    } catch (err) { host.innerHTML = `<p class="m3-wait">The 3D view cannot start here: ${esc(err.message || err)}</p>`; pageStage = null; }
  };
  M.page3D = R3.page;

  /* ---- a campaign with 3D maps: each place's floor shown in 3D on its page, with the flat map a click away */
  R3.on3d = () => A.config.maps === "3d" && pref("flat", "") !== "1";
  // the engine asks what goes on a place's map stage
  A.stageHTML = (id, fi, v) => R3.on3d() && hasDoc ? `<div class="r3-inline" data-r3i="${esc(id)}" data-fi="${fi}" data-v="${v}"><p class="m3-wait">Building the room…</p></div>` : null;
  const inline = new Map();
  async function mountInline(h) {
    if (inline.has(h)) return; inline.set(h, null);
    const id = h.dataset.r3i, fi = +h.dataset.fi, gm = h.dataset.v !== "player"; if (!A.maps[id]) return;
    const P = placeOpts(id, fi, gm);
    try { h.innerHTML = ""; const s = await R3.stage(h, Object.assign({ panOnly: true }, P.stage)); if (!document.contains(h)) { s.dispose(); inline.delete(h); return; } inline.set(h, s); await s.show(P.F, P.opts); }
    catch (err) { h.innerHTML = `<p class="m3-wait">The 3D view cannot start here (${esc(err.message || err)}). The flat map is a click away.</p>`; }
  }
  function unmountInline(h) { const s = inline.get(h); if (s) s.dispose(); inline.delete(h); if (document.contains(h)) h.innerHTML = `<p class="m3-wait">Building the room…</p>`; }
  if (hasDoc && typeof IntersectionObserver === "function" && typeof MutationObserver === "function") {
    const io = new IntersectionObserver(es => { for (const en of es) { if (en.isIntersecting) mountInline(en.target); else if (inline.get(en.target)) unmountInline(en.target); } }, { rootMargin: "300px" });
    const scan = () => {
      document.querySelectorAll(".r3-inline:not([data-r3w])").forEach(h => { h.dataset.r3w = 1; io.observe(h); });
      for (const h of [...inline.keys()]) if (!document.contains(h)) { const s = inline.get(h); if (s) s.dispose(); inline.delete(h); io.unobserve(h); }
    };
    const start = () => new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  }
  if (hasDoc) document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-m3d], [data-lm3d]"); if (!b) return;
    if (b.dataset.lm3d != null) { keep("flat", R3.on3d() ? "1" : ""); document.querySelectorAll(".lmap-sec").forEach(sec => { const t = document.createElement("div"); t.innerHTML = A.section(sec.dataset.loc); sec.replaceWith(t.firstElementChild); }); return; }
    const id = b.dataset.m3d, M0 = A.get(id); let fi = A.state.f[A.keyOf(id)]; if (fi == null || fi >= M0.floors.length) fi = A.maps[id].start || 0;
    R3.page(id, fi);
  });

  /* ================================================================ the map editor in 3D */
  if (hasDoc && A.mapEditor) {
    let api = null, st = null, starting = null;
    const E = () => api.E, Fc = () => api.cur();
    const St = A.story;
    const recOf = mid => Object.assign({}, (St && St.clue && St.clue(E().id, mid)) || ((A.get(E().id) || {}).clues || {})[mid] || {}, (E().cl && E().cl.recs[mid]) || {});
    const nameOf = mid => { if (A.dirOf(mid) === "clues") return recOf(mid).t || ""; const d = (A.get(E().id) || {})[A.dirOf(mid)] || {}, e = d[mid] || {}; return e.t || e.n || (A.castData && e.who && A.castData[e.who] ? A.castData[e.who].n : ""); };
    function setMode(on) {
      const e = E(); if (!!e.view3d === on) return;
      e.view3d = on; keep("mode", on ? "3d" : "2d");
      if (!on && st) { st.dispose(); st = null; }
      api.paint();
    }
    // what the editor draws over the room in 3D: the same as over the flat map
    function overlay() {
      const e = E(), F = Fc(), out = [], sel = e.sel;
      if (sel && sel.kind === "room" && F.R[sel.i]) { const q = F.R[sel.i]; out.push({ t: "rect", x: q[1], y: q[2], w: q[3], h: q[4] }); [[q[1], q[2]], [q[1] + q[3], q[2]], [q[1], q[2] + q[4]], [q[1] + q[3], q[2] + q[4]]].forEach(([x, y]) => out.push({ t: "handle", x, y })); }
      if (sel && sel.kind === "stair" && F.ST[sel.i]) { const s = F.ST[sel.i]; out.push({ t: "rect", x: s[1], y: s[2], w: s[3], h: s[4] }); }
      if (sel && sel.kind === "door" && F.D[sel.i]) { const [x, y, o, , len = 1] = F.D[sel.i]; out.push({ t: "bar", x, y, o, len }); }
      if (sel && sel.kind === "marker" && F.M[sel.i]) out.push({ t: "ring", mid: F.M[sel.i][0] });
      if (e.tool === "clues" && e.cl && e.cl.sel) out.push({ t: "ring", mid: e.cl.sel });
      const ps = (e.psel || []).filter(i => i < (F.P || []).length);
      if (M.ui) for (const i of ps) { const p = F.P[i], pd = e.pdrag, moved = pd && pd.kind === "move" && pd.moved && pd.idx.includes(i) ? Object.assign({}, p, { x: pd.at[pd.idx.indexOf(i)][0] + pd.dx, y: pd.at[pd.idx.indexOf(i)][1] + pd.dy }) : pd && pd.kind === "rot" && pd.i === i && pd.moved ? Object.assign({}, p, { r: pd.r }) : p; out.push({ t: "prop", p: moved, corners: M.ui.corners(moved) }); }
      if (M.ui && ps.length === 1 && !(e.pdrag && e.pdrag.moved)) { const p = F.P[ps[0]], [hx, hy] = M.ui.handle(p); out.push({ t: "handle", x: hx, y: hy, z: p.z || 0, rot: true, from: [p.x, p.y] }); }
      const d = e.drag;
      if (d && d.kind === "draw") { const b = d.box || [d.cx, d.cy, 1, 1]; out.push({ t: "ghost", x: b[0], y: b[1], w: b[2], h: b[3] }); }
      if (d && (d.kind === "room" || d.kind === "stair") && d.moved) { const q = d.kind === "room" ? F.R[d.i] : F.ST[d.i]; if (q) out.push({ t: "ghost", x: q[1] + d.dx, y: q[2] + d.dy, w: q[3], h: q[4] }); }
      if (d && d.kind === "resize" && d.box) out.push({ t: "ghost", x: d.box[0], y: d.box[1], w: d.box[2], h: d.box[3] });
      const pd = e.pdrag; if (pd && pd.kind === "box" && pd.x1 != null) out.push({ t: "ghost", x: Math.min(pd.x0, pd.x1), y: Math.min(pd.y0, pd.y1), w: Math.abs(pd.x1 - pd.x0), h: Math.abs(pd.y1 - pd.y0), thin: true });
      return out;
    }
    function preview() {
      const e = E(), F = Fc(), out = { props: {}, pins: {}, ghost: null }, lp = st && st.last();
      const pd = e.pdrag;
      if (pd && pd.kind === "move" && pd.moved) pd.idx.forEach((j, k) => { const q = F.P[j]; if (q) out.props[j] = { x: pd.at[k][0] + pd.dx, y: pd.at[k][1] + pd.dy, r: q.r || 0 }; });
      if (pd && pd.kind === "rot" && pd.moved) { const q = F.P[pd.i]; if (q) out.props[pd.i] = { x: q.x, y: q.y, r: pd.r }; }
      const d = e.drag; if (d && d.kind === "marker" && lp) { const m = F.M[d.i]; if (m) out.pins[m[0]] = { x: m[1] + lp.x - d.x0, y: m[2] + lp.y - d.y0 }; }
      const cd = e.cl && e.cl.drag; if (cd && cd.x != null) { const m = F.M[cd.i]; if (m) out.pins[m[0]] = { x: cd.mx + cd.x - cd.x0, y: cd.my + cd.y - cd.y0 }; }
      if (e.tool === "furnish" && e.place && lp && M.ui) out.ghost = M.ui.ghostAt(e.place, lp.x, lp.y);
      return out;
    }
    const lightOf = () => R3.lightOf(E().id, Fc());
    function show() {
      const e = E(), F = api.finished(Fc());
      st.show(F, { gm: true, svg: () => api.draftSVG(e.fi, "gm", "r3e" + (A.state.n++)), light: lightOf(), key: "edit/" + e.id + "/" + e.fi, under: e.under && e.under.fi === e.fi ? e.under : null });
    }
    A.mapEditor.plug({
      topHTML: () => `<div class="me-dim" role="group" aria-label="Edit in 2D or 3D"><button type="button" data-r3v="2d" title="The flat map">2D</button><button type="button" data-r3v="3d" title="The room in 3D, seen from one fixed angle">3D</button></div>`,
      open(a) {
        api = a; const e = E(), mode = pref("mode", "");
        e.view3d = mode ? mode === "3d" : A.config.maps === "3d";
        if (st) { st.dispose(); st = null; }
        const dlg = document.getElementById("meDlg"); if (dlg && !dlg.__r3) { dlg.__r3 = 1; dlg.addEventListener("close", () => { if (st) { st.dispose(); st = null; } }); }
      },
      top(a, dlg) { dlg.querySelectorAll("[data-r3v]").forEach(b => b.setAttribute("aria-pressed", (b.dataset.r3v === "3d") === !!E().view3d)); dlg.classList.toggle("me-in3d", !!E().view3d); },
      // in 3D the canvas is the stage: drawn again from the map whenever the map or what is chosen changes
      paintCanvas() {
        const e = E(); if (!e.view3d) return false;
        const box = document.getElementById("meCanvas"); if (!box) return true; box.dataset.tool = e.tool;
        if (st) { show(); return true; }
        if (starting) return true;
        box.innerHTML = `<p class="m3-wait">Building the room…</p>`;
        starting = R3.stage(box, {
          events: box,
          overlay, preview, recOf, nameOf, noClues: () => !!E().hideClues,
          focus: () => { const s = E().sel, F = Fc(); return s && s.kind === "room" && F.R[s.i] ? F.R[s.i].slice(1, 5) : null; },
          // a left drag that takes nothing (no room, no model, no marker) slides the view
          panIfFree: () => { const x = E(); return x.tool === "select" && !x.drag && !x.sel && !x.pdrag && !(x.psel && x.psel.length) && !(x.cl && x.cl.drag); },
          cancelTool: () => { const x = E(); x.drag = null; x.pdrag = null; if (x.cl) x.cl.drag = null; api.paintCanvas(); },
          wheelForTool: () => E().tool === "furnish" && !!E().place,
          onLight: k => api.change(() => { const F = Fc(); if (k && k !== R3.lightOf(E().id, Object.assign({}, F, { light: "" }))) F.light = k; else delete F.light; })
        }).then(s => { starting = null; const w = box.querySelector(".m3-wait"); if (w) w.remove(); if (!E().view3d || !document.getElementById("meDlg").open) { s.dispose(); return; } st = s; show(); })
          .catch(err => { starting = null; box.innerHTML = `<p class="m3-wait">The 3D view cannot start here (${esc(err.message || err)}). The 2D map still works: switch back with 2D.</p>`; });
        return true;
      },
      pt(ev) {
        const e = E(); if (!e.view3d || !st) return null;
        const dragging = !!(e.drag || e.pdrag || (e.cl && e.cl.drag));
        const mode = dragging && ev.type !== "pointerdown" ? "drag" : ({ select: "select", room: "floor", stairs: "floor", door: "wall", erase: "wall", furnish: e.place ? "place" : "props", clues: "clues" })[e.tool] || "floor";
        return st.mapPoint(ev, mode);
      },
      side() {
        const e = E(), F = Fc(); if (!e.view3d) return "";
        return `<section class="r3-side"><h4>${LOCK_IC} The room in 3D</h4>
          <label class="me-f"><span>Light</span><select data-r3s="light">${R3.LIGHTS.map(([k, n]) => `<option value="${k}"${k === lightOf() ? " selected" : ""}>${n}</option>`).join("")}</select></label>
          <label class="me-f"><span>Wall height</span><select data-r3s="wh">${[2.4, 2.7, 3, 3.6, 4.5, 6].map(v => `<option value="${v}"${v === ((+F.wh) || 2.7) ? " selected" : ""}>${v} m</option>`).join("")}</select></label>
          <p class="me-help">Every room is seen from the same fixed angle, so you never lose your way. Slide with the right or middle button, or hold Space and drag; zoom with the wheel. Turn a model with R or its round handle: the model turns, never the view.</p></section>`;
      },
      click(ev) {
        const t = ev.target, v = t.closest("[data-r3v]"); if (v) { setMode(v.dataset.r3v === "3d"); return true; }
        const z = t.closest('[data-me="zin"], [data-me="zout"]'); if (z && E().view3d) { if (st) st.zoomBy(z.dataset.me === "zin" ? 1.25 : .8); return true; }
        return false;
      },
      change(ev) {
        const t = ev.target, k = t.dataset.r3s; if (!k) return false;
        if (k === "light") { api.change(() => { const F = Fc(); if (t.value === "normal" && !((A.meta[E().id] || {}).light || A.config.light)) delete F.light; else F.light = t.value; }); if (st) st.setLight(t.value); return true; }
        if (k === "wh") { api.change(() => { const F = Fc(), v = +t.value; if (v === 2.7) delete F.wh; else F.wh = v; }); return true; }
        return false;
      },
      key(ev) {
        if (!E().view3d || !st) return false;
        const k = ev.key;
        if (k === "+" || k === "=") { st.zoomBy(1.2); return true; }
        if (k === "-" || k === "_") { st.zoomBy(1 / 1.2); return true; }
        if (k === "Home" || k === "0") { st.fit(); return true; }
        if (k === " ") { ev.preventDefault(); return true; }
        const ar = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] }[k];
        if (ar && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); st.panBy(ar[0], ar[1]); return true; }
        return false;
      }
    });
    R3.editorStage = () => st;
  }
})(ATLAS);
