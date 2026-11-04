/* The weather, from the world's own climate (the user's approved idea of 3 Nov 2026, the third in the workspace's
   reviews/2026-11-03-ideas.md: "each day's weather at the party's place comes from the climate the world generator
   already simulates (the month's warmth and rain at that spot), not from a random table. It changes travel,
   descriptions and the music's mood").
   The climate at a spot is read back from the world map itself, by the rules the generator's ecology used
   (scripts/world-ecology.js): its latitude (as the generator laid the map over the globe), its height in metres, how
   far it lies from the sea and from the sea upwind, its year's mean warmth (kept as tempC on worlds made since 27 Oct
   2026, else worked out the same way) and its wetness (the generator's moisture): so the warmest and the coldest
   month, the year's rain in mm and the share of it that falls in the warm half. A day's weather is drawn from that
   season's normals. The weather systems are slow random fields that drift with the prevailing wind (east in the
   westerlies, west in the trade winds), so a wet spell lasts some days and neighbouring towns share it; each draw is
   fixed by the world, the place and the day, so a day always has the same weather however often it is asked. A
   planet's or a plane's map follows its environment (atlas-planet.js, atlas-cosmos.js): no air, or laws that allow no
   weather, no weather at all; locked to its star or the same everywhere, no seasons; its own rain (methane, ash). */
(function (A) {
  "use strict";
  const unb64 = s => { if (!s) return null; if (typeof s !== "string") return Uint8Array.from(s); const b = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary"), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // (as the generator has them: world-invent.js SIZE_KM, world-ecology.js LAT and MEDIAN_MM, world-geology.js's rain it
  // wants for each climate; the height grid's steps in metres as atlas-world-art.js reads them)
  const SIZE_KM = { supercontinent: 13000, hemisphere: 20000, planet: 40030 };
  const LAT = { temperate: [52, 38], varied: [68, 4], cold: [70, 52], polar: [84, 66], warm: [36, 22], tropical: [16, -6], arid: [33, 17], wet: [56, 42] };
  const MEDIAN_MM = { temperate: 760, varied: 620, cold: 460, polar: 260, warm: 560, tropical: 1500, arid: 190, wet: 1300 };
  const WANT = { temperate: .62, varied: .55, cold: .55, polar: .4, warm: .5, tropical: .72, arid: .26, wet: .82 };
  const LAND_M = [[0, 0], [200, .06], [500, .15], [1000, .28], [1500, .37], [2000, .45], [3000, .6], [4500, .78], [6000, .9], [8500, 1]];
  const metres = (v, sea) => { if (v <= sea) return 0; const t = (v - sea) / (255 - sea); for (let q = 1; q < LAND_M.length; q++) if (t <= LAND_M[q][1]) return LAND_M[q - 1][0] + (t - LAND_M[q - 1][1]) / (LAND_M[q][1] - LAND_M[q - 1][1]) * (LAND_M[q][0] - LAND_M[q - 1][0]); return 8500; };

  /* ---- the climate at a spot */
  const GRIDS = {};
  function grid(wid) {
    const w = A.worlds && A.worlds[wid], T = w && w.terrain;
    if (!T || !T.height || !T.cols || !T.rows) return null;
    const g = GRIDS[wid]; if (g && g.T === T) return g;
    const climate = LAT[T.climate] ? T.climate : "temperate", miles = T.scale && T.scale.unit === "mile";
    const kmA = T.scale && T.scale.per && T.w ? T.scale.per * T.w / (miles ? .6214 : 1) : SIZE_KM[T.sizeName] || (T.w || T.cols * (T.cell || 4)) * 2.3;
    const whole = T.sizeName === "planet", L0 = LAT[climate], mid = (L0[0] + L0[1]) / 2, span = (T.h || T.rows) / (T.w || T.cols) * kmA / 111;
    const lat = T.ocean && Array.isArray(T.ocean.lat) ? T.ocean.lat : whole ? [90, -90] : SIZE_KM[T.sizeName] ? [Math.min(88, mid + span / 2), Math.max(-88, mid - span / 2)] : L0;
    const env = T.env || null, cl = env && env.climate ? env.climate : {};
    return GRIDS[wid] = { T, wid, H: unb64(T.height), M: T.moist ? unb64(T.moist) : null, TC: T.tempC ? unb64(T.tempC) : null, sea: T.sea || 128, cols: T.cols, rows: T.rows, cell: T.cell || 4,
      climate, kmA, cellKm: kmA / T.cols, lat, earth: T.climateModel === "earth", env, EVK: cl.even ? Math.sqrt(Math.max(0, 1 - cl.even)) : 1, BKe: cl.cells ? cl.cells / 3 : 1,
      miles, seed: (T.seed || 1) * 7919 + [...String(wid)].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 0) };
  }
  // how far to the nearest sea, in cells, looking out ring by ring (about 2500 km at most: beyond it is the heart of a continent)
  function seaDist(g, i, j) {
    const { H, sea, cols, rows } = g, R = Math.ceil(2500 / g.cellKm); let best = Infinity;
    for (let r = 0; r <= R && r <= best; r++) {
      for (let dj = -r; dj <= r; dj++) for (const di of Math.abs(dj) === r ? range(-r, r) : [-r, r]) {
        const x = i + di, y = j + dj; if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        if (H[y * cols + x] <= sea) { const d = Math.hypot(di, dj); if (d < best) best = d; }
      }
    }
    return best;
  }
  const range = (a, b) => { const o = []; for (let k = a; k <= b; k++) o.push(k); return o; };
  function climateAt(wid, xy) {
    const g = grid(wid); if (!g || !xy) return null;
    const i = clamp(Math.floor(xy[0] / g.cell), 0, g.cols - 1), j = clamp(Math.floor(xy[1] / g.cell), 0, g.rows - 1), n = j * g.cols + i;
    const latD = g.lat[0] + (g.lat[1] - g.lat[0]) * (j + .5) / g.rows, a0 = Math.abs(latD), a = a0 * g.EVK, aB = a0 * g.BKe, e = metres(g.H[n], g.sea);
    const dS = seaDist(g, i, j), coastKm = dS * g.cellKm, cont = 1 - Math.exp(-coastKm / 550);
    // (the sea upwind: the westerlies blow from the west between about 30° and 60°, the trade and the polar winds from the east)
    let up = 0, w = 0; for (let x = i; x >= 0 && g.H[j * g.cols + x] > g.sea; x--) up++; if (up > i) up = 1e5;
    for (let x = i; x < g.cols && g.H[j * g.cols + x] > g.sea; x++) w++; if (w >= g.cols - i) w = 1e5;
    const westS = smooth(26, 34, aB) * (1 - smooth(56, 64, aB)), upwind = Math.min(4000, up * g.cellKm) * westS + Math.min(4000, w * g.cellKm) * (1 - westS);
    const env = g.env, model = env && env.climate ? env.climate.model : "", seasons = !(model === "locked" || model === "uniform" || model === "none");
    const weather = !(env && (env.fall === "none" || model === "none"));
    // the warmest and the coldest month (world-ecology.js: the Earth's averages by latitude, winters colder inland, 6.5 °C
    // colder for every km of height); a world made since 27 Oct 2026 keeps its year's mean, which the swing sits about
    const swing = seasons ? Math.max(0, 3 + .004 * a * a + 2 * cont + .35 * a * cont) : 0;
    let Tm;
    if (g.TC) Tm = g.TC[n] - 60;
    else { const lapse = e * .0065, tw = 30 - .0045 * a * a + 2 * cont - lapse, tc = 27 - .0085 * a * a - .35 * a * cont - lapse; Tm = (tw + tc) / 2; }
    if (env && model === "uniform" && env.climate.temp != null && !g.TC) Tm = env.climate.temp - e * .0065;
    // the year's rain in mm: the generator's moisture is its aridity (rain against what the air could take up) on a world
    // with an ecology, its rain against the climate's typical on an older one
    const m01 = g.M ? g.M[n] / 255 : .5;
    let P;
    if (g.TC) {
      const AI = m01 * 1.8, ra = 15 + 21 * Math.pow(Math.cos(a * Math.PI / 180), 1.4); P = 600;
      for (let k = 0; k < 4; k++) { const dtr = 7 + 8 * Math.exp(-P / 400) + 4 * cont, pet = g.earth ? clamp(.0023 * .408 * ra * Math.max(0, Tm + 17.8) * Math.sqrt(Math.max(3, dtr)) * 365, 60, 2600) : clamp(62 * (Tm + 4), 120, 2000); P = Math.max(5, AI * pet); }
    } else P = Math.max(5, MEDIAN_MM[g.climate] * (m01 * 255 / 200) / WANT[g.climate]);
    // when it falls: the share in the warm half of the year (world-ecology.js: monsoon and savanna summers, dry
    // Mediterranean summers on west coasts, even rain on maritime coasts, summer rain inland)
    const mon = smooth(6, 12, aB) * (1 - smooth(22, 28, aB)), medS = smooth(29, 33, aB) * (1 - smooth(39, 43, aB)) * (1 - smooth(250, 500, upwind)), mar = smooth(38, 46, aB) * (1 - smooth(300, 700, upwind));
    const s = clamp(.52 + mon * (.26 + .1 * cont) + (1 - mon) * smooth(26, 40, aB) * .1 * cont + (aB > 28 ? .08 * cont : 0) - medS * .34 - mar * .1, .15, .92);
    const belt = aB < 30 ? "trades" : aB < 60 ? "westerlies" : "polar";
    return { wid, n, x: xy[0], y: xy[1], xkm: (i + .5) * g.cellKm, ykm: (j + .5) * g.cellKm, lat: latD, metres: Math.round(e), coastKm: Math.round(coastKm), cont, upwind,
      T: Tm, swing, Tw: Tm + swing / 2, Tc: Tm - swing / 2, P, s, seasons, weather, belt, south: latD < 0,
      drift: belt === "westerlies" ? 350 : belt === "trades" ? -250 : -150, dtr: clamp(7 + 8 * Math.exp(-P / 400) + 4 * cont, 4, 18),
      fall: env ? env.fall || "rain" : "rain", liquid: env && env.liquid ? env.liquid.kind : "water", miles: g.miles, seed: g.seed, kind: env ? env.kind || "planet" : "" };
  }

  /* ---- a season's normals: f the moment's place in its year (0 to 1), winter where the heart of the northern winter lies */
  function season(C, f, winter) {
    const cold = C.south ? winter + .5 : winter, c = -Math.cos(2 * Math.PI * (f - cold));      // -1 deep winter, 1 high summer
    const Tm = C.T + (C.seasons ? C.swing / 2 * c : 0), k = clamp(Math.PI * (C.s - .5), -.95, .95), rate = C.P / 365 * (1 + (C.seasons ? k * c : 0));
    const I = clamp(2 + .3 * Math.max(0, Tm), 2, 14);
    return { c, T: Tm, rate, I, pWet: clamp(rate / I, .01, .9), month: rate * 30.4, days: clamp(rate / I, .01, .9) * 30.4 };
  }

  /* ---- the weather systems: for each node of a grid about 600 km across, drifting with the wind, a slow random series
     day by day (each day leaning on the last); a place reads the nodes about it, so its neighbours share its weather */
  const NODE = 600;
  const h32 = (a, b, c, d) => { let h = 2166136261 ^ (a | 0); h = Math.imul(h ^ (b | 0), 16777619); h = Math.imul(h ^ (c | 0), 16777619); h = Math.imul(h ^ (d | 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const gauss = (a, b, c, d) => { const u = Math.max(1e-9, h32(a, b, c, d)), v = h32(a ^ 0x5bd1e995, b + 101, c, d); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  function series(seed, gx, gy, day, rho) { let z = gauss(seed, gx, gy, day - 24); const q = Math.sqrt(1 - rho * rho); for (let d = day - 23; d <= day; d++) z = rho * z + q * gauss(seed, gx, gy, d); return z; }
  function field(C, ch, day, rho) {
    const X = (C.xkm - C.drift * day) / NODE, Y = C.ykm / NODE, gx = Math.floor(X), gy = Math.floor(Y), fx = X - gx, fy = Y - gy, wx = fx * fx * (3 - 2 * fx), wy = fy * fy * (3 - 2 * fy);
    let z = 0, w2 = 0;
    for (const [dx, dy, w] of [[0, 0, (1 - wx) * (1 - wy)], [1, 0, wx * (1 - wy)], [0, 1, (1 - wx) * wy], [1, 1, wx * wy]]) { if (w < 1e-6) continue; z += w * series(C.seed * 13 + ch, gx + dx, gy + dy, day, rho); w2 += w * w; }
    return z / Math.sqrt(w2 || 1);
  }
  const erf = x => { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const Phi = z => .5 * (1 + erf(z / Math.SQRT2));
  const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

  /* ---- one day's weather at a spot: day the story's day (whole days from its first), f and winter as season() */
  function dayAt(C, day, f, winter) {
    if (!C) return null;
    const N = season(C, f, winter), d = { day, climate: C, normals: N };
    if (!C.weather) return Object.assign(d, { none: true });
    const zW = field(C, 1, day, .45), zT = field(C, 2, day, .7), zV = field(C, 3, day, .5), zD = field(C, 4, day, .6), u = Phi(zW);
    const wet = u > 1 - N.pWet, depth = wet ? (u - (1 - N.pWet)) / N.pWet : 0, amt = wet ? N.I * -Math.log(1 - Math.min(.995, depth)) : 0;
    const cloud = wet ? 1 : u / (1 - N.pWet);
    const sigma = clamp(1.3 + 2.8 * C.cont + .03 * Math.abs(C.lat), 1, 5.5);
    let Tday = N.T + sigma * zT; if (wet && N.c > 0) Tday -= 1.2; if (wet && N.c < 0 && Math.abs(C.lat) > 40) Tday += 1;
    const dtr = C.dtr * (wet ? .55 : cloud > .8 ? .75 : 1), hi = Tday + dtr / 2, lo = Tday - dtr / 2;
    let kind = "";
    if (wet) kind = C.fall !== "rain" && C.fall !== "snow" ? C.fall : C.fall === "snow" || Tday <= -.5 ? "snow" : Tday <= 1.5 ? "sleet" : "rain";
    const thunder = wet && kind === "rain" && N.T >= 16 && amt >= 1.2 * N.I && (Math.abs(C.lat) < 25 || N.c > .2);
    const base = .5 + .5 * smooth(35, 55, Math.abs(C.lat)) + (C.coastKm < 30 ? .4 : 0) + (C.metres > 1500 ? .3 : 0);
    const spd = base + .55 * Math.abs(zV) + (wet ? .35 : 0) + (amt > 2 * N.I ? .4 : 0) + (thunder ? .3 : 0);
    const wind = spd < .6 ? 0 : spd < 1 ? 1 : spd < 1.5 ? 2 : spd < 2.1 ? 3 : 4;
    const from = (C.belt === "westerlies" ? 270 : C.belt === "trades" ? (C.south ? 135 : 45) : 90) + zD * 55;
    const humid = C.P > 500 || C.coastKm < 50, fogP = !wet && wind <= 1 ? .22 * (N.c < 0 ? 1 : .4) * (humid ? 1 : .25) : 0, fog = fogP > 0 && h32(C.seed, C.n, day, 5) < fogP;
    return Object.assign(d, { wet, kind, amount: Math.round(amt * 10) / 10, thunder, blizzard: kind === "snow" && wind >= 3 && amt >= 2, cloud: wet ? 1 : cloud,
      sky: wet ? "overcast" : cloud > .8 ? "cloudy" : cloud > .55 ? "some cloud" : "clear", T: Tday, hi, lo, wind, from: COMPASS[((Math.round((((from % 360) + 360) % 360) / 45)) % 8)], fog, frost: !wet && lo <= 0 && (wind <= 2 || lo <= -3) });
  }

  /* ---- in words */
  const deg = (C, t) => C && C.miles ? `${Math.round(t * 9 / 5 + 32)} °F` : `${Math.round(t)} °C`;
  const WINDS = ["still air", "a light air", "a fresh breeze", "a strong wind", "a gale"];
  const windy = d => d.wind === 0 ? "still" : `${["", "a light", "a fresh", "a strong", "a"][d.wind]} ${d.from}${d.wind === 4 ? "erly gale" : "erly"}`.replace(/  /g, " ");
  const feel = t => t < -10 ? "bitterly cold" : t < 0 ? "freezing" : t < 8 ? "cold" : t < 15 ? "cool" : t < 22 ? "mild" : t < 28 ? "warm" : t < 34 ? "hot" : "scorching";
  const FALLS = { methane: ["methane drizzle", "methane rain", "a methane downpour"], ash: ["a light fall of ash", "falling ash", "a thick fall of ash"], frost: ["a rime of frost", "frost settling", "a heavy fall of frost"], blood: ["a fine red drizzle", "a rain of blood", "a downpour of blood"] };
  function fallWord(d) {
    const a = d.amount, I = d.normals.I;
    if (d.kind === "rain") return d.thunder ? "thunderstorms" : a < 1 ? "drizzle" : a < .6 * I ? "light rain" : a < 2 * I ? "rain" : a < 30 ? "heavy rain" : "a downpour";
    if (d.kind === "snow") return d.blizzard ? "a blizzard" : a < 2 ? "light snow" : a < 8 ? "snow" : "heavy snow";
    if (d.kind === "sleet") return "rain and sleet";
    const F = FALLS[d.kind]; return F ? F[a < .6 * I ? 0 : a < 2 * I ? 1 : 2] : d.kind;
  }
  function short(d) {
    if (!d) return ""; if (d.none) return "No weather";
    const w = d.wet ? fallWord(d) : d.fog ? "morning fog" : d.sky === "clear" ? (d.frost ? "clear, a frost" : "clear") : d.sky === "some cloud" ? "bright, some cloud" : "cloudy";
    return `${w[0].toUpperCase()}${w.slice(1)}${d.wind >= 3 && !d.blizzard ? ", " + (d.wind === 4 ? "a gale" : "windy") : ""} · ${deg(d.climate, d.hi)}`;
  }
  function long(d) {
    if (!d) return ""; const C = d.climate;
    if (d.none) return C.kind === "plane" ? "No weather: the plane's laws keep its air still." : "No weather: there is no air to make it.";
    const mood = d.wet ? (d.thunder ? "A heavy, thundery day" : d.kind === "snow" ? (d.blizzard ? "A white-out" : "A hushed, snowy day") : d.amount > 2 * d.normals.I ? "A wild, wet day" : "A grey, damp day")
      : d.fog ? "Fog lies thick until mid-morning, then" : d.sky === "clear" ? (d.hi < 0 ? "A bright, frozen day" : d.hi > 30 ? "A cloudless, blazing day" : "A clear day") : d.sky === "some cloud" ? "A bright day of passing cloud" : "A dull, grey day";
    const fall = d.wet ? `: ${fallWord(d)}${d.wind ? " on " + windy(d) : ""}` : d.fog ? ` ${d.sky === "clear" ? "clear" : "grey"} skies${d.wind ? ", " + windy(d) : ""}` : d.wind ? `, ${windy(d)}` : ", the air still";
    return `${mood}${fall}; ${deg(C, d.hi)}, ${d.lo < d.hi - 1 ? "falling to " + deg(C, d.lo) + " in the night" : "no colder at night"}${d.frost ? ", with a frost by morning" : ""}. ${feel(d.hi)[0].toUpperCase()}${feel(d.hi).slice(1)}.`;
  }
  // what it does to a journey: how much longer the way takes, and why
  function travel(d) {
    if (!d || d.none) return { k: 1, why: "" };
    if (d.blizzard) return { k: 3, why: "a blizzard: no one travels in it, they wait it out", stop: true };
    if (d.kind === "snow") return { k: d.amount >= 8 ? 2 : 1.5, why: d.amount >= 8 ? "deep snow on the ways" : "snow on the ways" };
    if (d.wind === 4) return { k: 1.25, why: "a gale: hard going, and ships stay in harbour", sea: true };
    if (d.wet && d.amount >= Math.max(12, 2 * d.normals.I)) return { k: 1.3, why: "the roads are mud, the fords high" };
    if (d.hi >= 35) return { k: 1.25, why: "resting through the midday heat" };
    if (d.fog) return { k: 1.15, why: "slow going in the fog, and easy to lose the way" };
    if (d.wet) return { k: 1.1, why: "wet going" };
    return { k: 1, why: "" };
  }
  // why it is so: the place's climate in a sentence
  function why(d, monthName) {
    const C = d.climate, N = d.normals, deg0 = t => deg(C, t);
    const where = `${Math.round(Math.abs(C.lat))}° ${C.lat >= 0 ? "N" : "S"}, ${C.coastKm < 15 ? "by the sea" : `${C.coastKm} km from the sea`}${C.metres > 150 ? `, ${C.metres} m up` : ""}`;
    if (d.none) return `${where}. ${long(d)}`;
    const rain = C.fall === "rain" || C.fall === "snow" ? (N.T < 0 ? "snow" : "rain") : FALLS[C.fall] ? FALLS[C.fall][1].replace(/^(a |an )/, "") : C.fall;
    return `${monthName ? monthName + ", at " : "At "}${where}: days of about ${deg0(N.T + C.dtr / 2)} and nights of ${deg0(N.T - C.dtr / 2)}; about ${Math.round(N.month)} mm of ${rain} on ${Math.max(1, Math.round(N.days))} days in a month${C.seasons ? `. Its warmest month about ${deg0(C.Tw)}, its coldest ${deg0(C.Tc)}; ${Math.round(C.P)} mm in the year, ${C.s > .62 ? "most of it in summer" : C.s < .4 ? "most of it in winter" : "through the year"}` : ", the same all year round"}.`;
  }
  // its sounds, for the music played outdoors (atlas-music.js air): rain, wind, thunder
  function air(d) {
    if (!d || d.none) return null; const o = {};
    if (d.wet && (d.kind === "rain" || d.kind === "sleet" || FALLS[d.kind])) o.rain = d.amount < 1 ? .1 : d.amount < 2 * d.normals.I ? .2 : .3;
    if (d.wind) o.wind = [0, .06, .12, .2, .28][d.wind]; if (d.kind === "snow") o.wind = Math.max(o.wind || 0, .1);
    if (d.thunder) o.thunder = 1;
    return Object.keys(o).length ? o : null;
  }

  /* ---- the party's place, and the time: the world map's own record of where the party is (its "party" doc), the
     world's time (atlas-worldtime.js) for the day and the season */
  function store() { return A.tableUI && A.tableUI.api && A.tableUI.api.store ? A.tableUI.api.store() : null; }
  function spotOf(wid, id) {
    const w = A.worlds && A.worlds[wid]; if (!w || !w.data || !id) return null;
    const S = store(), docs = (S && S.get(wid === "main" ? "world" : "world_" + wid)) || {}, lov = docs["l-" + id] || {}, L0 = (w.data.locations || []).find(l => l && l.id === id) || {};
    if (lov.gone) return null;
    const at = Array.isArray(lov.at) ? lov.at : Array.isArray(L0.at) ? L0.at : w.terrain && w.terrain.spots ? w.terrain.spots[id] : null;
    return at ? { wid, id, xy: at, name: lov.name || L0.name || id } : null;
  }
  function party() {
    const S = store(), w = A.worlds && A.worlds.main; if (!w || !w.data) return null;
    // (on another plane: its map, where it has one; the party's plane is atlas-cosmos.js's)
    const ph = A.cosmosApi && A.cosmosApi.partyHere ? A.cosmosApi.partyHere() : null;
    if (ph && ph.d && ph.l && !ph.l.world) { const id = ("dim-" + ph.d.id + "-" + ph.l.id).replace(/[^\w-]/g, "-").slice(0, 40), pw = A.worlds[id]; if (pw && pw.terrain && pw.terrain.height) return { wid: id, xy: [(pw.terrain.w || pw.terrain.cols * (pw.terrain.cell || 4)) / 2, (pw.terrain.h || pw.terrain.rows * (pw.terrain.cell || 4)) / 2], name: `${ph.d.short || ph.d.name}, ${ph.l.name}`, plane: true }; return null; }
    const p = Object.assign({}, w.data.party || {}, (S && (S.get("world") || {}).party) || {});
    // (on the road between two places: where the day's journey left them, atlas-journey.js)
    if (p.road && Array.isArray(p.road.xy) && (p.plan || []).length) { const to = spotOf("main", p.plan[0]); return { wid: "main", xy: p.road.xy, name: `the road to ${to ? to.name : p.plan[0]}`, road: true }; }
    return p.at ? spotOf("main", p.at) : null;
  }
  // the moment's day, its place in the year, where the year's winter is, and the month's name
  function when(m) {
    const WT = A.worldTime;
    if (WT && WT.yearOf) { const y = WT.yearOf(m); return { day: y.dayN, f: y.f, winter: y.winter, month: y.month, set: y.set }; }
    const dayN = Math.floor((m || 0) / 1440); return { day: dayN, f: (.29 + dayN / 365) % 1, winter: .04, month: "", set: false };
  }
  const nowM = () => (A.worldTime ? A.worldTime.now() : 0);
  function at(spot, m) { if (!spot) return null; const C = climateAt(spot.wid, spot.xy); if (!C) return null; const t = when(m), d = dayAt(C, t.day, t.f, t.winter); d.when = t; d.spot = spot; return d; }
  const today = () => at(party(), nowM());

  /* ---- on the page */
  // the Time tab's card: the weather where the party is, the days ahead, why, what it does to the roads
  function cardHTML(show) {
    const sp = party(), ph = !sp && A.cosmosApi && A.cosmosApi.partyHere ? A.cosmosApi.partyHere() : null;
    if (ph && ph.d && ph.l && !ph.l.world) return `<section class="t-card wx-card"><h3>The weather <span class="kn">${esc(ph.d.short || ph.d.name)}</span></h3><p class="kn">The party is on ${esc(ph.d.name)}, ${esc(ph.l.name)}. Make its map under Dimensions to see its weather, by its own laws.</p></section>`;
    if (!sp) return A.worlds && A.worlds.main && A.worlds.main.terrain && A.worlds.main.terrain.height ? `<section class="t-card wx-card"><h3>The weather</h3><p class="kn">Set where the party is on the world map (a place, then The party is here) to see their weather, drawn from the world's own climate.</p></section>` : "";
    const d = at(sp, nowM()); if (!d) return "";
    const next = [1, 2, 3].map(k => at(sp, nowM() + k * 1440)), tv = travel(d), names = ["Tomorrow", "The day after"];
    const head = `<h3>The weather <span class="kn">at ${esc(sp.name)}</span></h3>`;
    if (d.none) return `<section class="t-card wx-card">${head}<p>${esc(long(d))}</p></section>`;
    return `<section class="t-card wx-card">${head}<div class="wx-today"><b>${esc(short(d).split(" · ")[0])}</b><span>${esc(deg(d.climate, d.hi))}</span><span class="kn">night ${esc(deg(d.climate, d.lo))}</span></div>
      <p>${esc(long(d))}</p>${tv.why ? `<p class="t-small wx-road"><b>On the way:</b> ${esc(tv.why)}${tv.k > 1 && !tv.stop ? ` (a day's journey takes about ${tv.k >= 2 ? "twice as long" : Math.round((tv.k - 1) * 100) + "% longer"})` : ""}.</p>` : ""}
      <ol class="wx-next">${next.map((x, k) => `<li><span class="kn">${k < 2 ? names[k] : esc(A.worldTime ? A.worldTime.at(nowM() + 3 * 1440).wd || "In three days" : "In three days")}</span> ${esc(short(x))}</li>`).join("")}</ol>
      <details class="wx-why"><summary>Why this weather</summary><p class="t-small">${esc(why(d, d.when.month))} The world's own climate, as its map was made; each day drawn from it, the same day always the same.${d.when.set ? "" : " The calendar is not set, so the story is taken to begin in spring: set it below."}</p></details>
      <label class="t-fogck"><input type="checkbox" data-tw="wxshow"${show ? " checked" : ""}> Show it on the players' screen</label></section>`;
  }
  // a world-map place's weather: today's, if the world keeps time, else its climate (atlas-world.js, the place's panel)
  function panelHTML(wid, L) {
    if (!L || !Array.isArray(L.at)) return ""; const C = climateAt(wid, L.at); if (!C) return "";
    const g = grid(wid); if (g.H[C.n] <= g.sea) return "";
    const t = A.worldTime ? when(nowM()) : null, d = t ? dayAt(C, t.day, t.f, t.winter) : null;
    if (d) { d.when = t; return `<div class="wm-wx"><b>Weather:</b> ${esc(short(d))}<details><summary>Why</summary><p class="kn">${esc(long(d))} ${esc(why(d, t.month))}</p></details></div>`; }
    return `<div class="wm-wx"><b>Climate:</b> ${C.weather ? `${C.seasons ? `summer days about ${esc(deg(C, C.Tw + C.dtr / 2))}, winter days ${esc(deg(C, C.Tc + C.dtr / 2))}` : `days about ${esc(deg(C, C.T + C.dtr / 2))} all year`}; ${Math.round(C.P)} mm of ${C.fall === "rain" ? "rain" : esc(C.fall)} a year` : "no weather"}<span class="kn"> (${Math.round(Math.abs(C.lat))}° ${C.lat >= 0 ? "N" : "S"}${C.metres > 150 ? ", " + C.metres + " m up" : ""})</span></div>`;
  }
  // the journey's note: today's weather where the party is, and what it does to the way
  function roadNote() { const d = today(), tv = travel(d); return d && tv.why ? `In today's weather: ${tv.why}${tv.k > 1 && !tv.stop ? `, so about ${tv.k >= 2 ? "twice as long" : Math.round((tv.k - 1) * 100) + "% longer"}` : ""}.` : ""; }
  // for the copilot: the weather where the party is, now
  function say() { const d = today(); if (!d) return ""; return `The weather where the party is (${d.spot.name}${d.when.month ? ", " + d.when.month : ""}): ${d.none ? long(d) : long(d) + (travel(d).why ? " On the way: " + travel(d).why + "." : "")}`; }
  // the players' screen's line, written into the clock with the date (atlas-worldtime.js label)
  function sky(m) { const S = store(), o = (S && S.get("clock", "opts")) || {}; if (o.wxHide) return ""; const d = at(party(), m == null ? nowM() : m); return d ? short(d) : ""; }
  // the music outdoors follows it
  let lastAir = "";
  function sync() { const a = air(today()), k = JSON.stringify(a); if (k === lastAir) return; lastAir = k; if (A.music && A.music.air) A.music.air(a); }

  A.weather = { climateAt, season, dayAt, at, today, party, spotOf, short, long, why, travel, air, cardHTML, panelHTML, roadNote, say, sky, sync, deg, WINDS };
})(typeof ATLAS !== "undefined" ? ATLAS : global.ATLAS);
