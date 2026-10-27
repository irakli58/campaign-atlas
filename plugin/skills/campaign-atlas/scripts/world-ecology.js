/* Campaign Atlas: the living cover of a world, worked out from its geography and climate (the user, 27 Oct 2026:
   "actual biome simulation, not randomly placed biome decorations ... vegetation and ecosystems developed naturally
   from the geography and climate"). world-geology.js calls it once the land, the sea, the lakes and the rain are made.
   Every cell gets, in order:
     - its climate: the year's mean temperature (latitude, and 6.5 °C less for every km of height), how far the seasons
       swing (more toward the poles, more far from the sea: continentality), the year's rain in mm (the winds' moisture,
       rained out on windward slopes, scarce in rain shadows and far inland), when the rain falls (a dry season in the
       monsoon belt, dry summers on subtropical west coasts, summer rain deep inland), the water the air could take from
       it (potential evapotranspiration), and so how dry it is (the aridity index, rain over that demand);
     - its Köppen climate class (A tropical, B dry, C temperate, D continental, E polar, with their letters);
     - its biome: from the class, and then from the ground itself: forest thinning to alpine meadow above the treeline,
       bare rock and permanent snow above that; wetlands only where the land is flat, low and waterlogged (marsh, bog,
       swamp forest, mangrove on hot coasts, floodplain along the great rivers); a green corridor along each river
       through dry country; sand dunes in the low desert basins, stony desert on the uplands;
     - its tree cover, 0 to 255, from the year's productivity (Lieth's Miami model: warmth and rain together), so a
       forest thins into woodland, grassland, scrub and desert as the climate does.
   The biome codes are those of engine/atlas-world-biomes.js. Nothing here draws: the map's looks draw these layers each
   in their own way. */
"use strict";
const BIO = require("../engine/atlas-world-biomes.js");

// latitude across the sheet for each climate (north at the top): [top, bottom], degrees
const LAT = { temperate: [52, 38], varied: [68, 4], cold: [70, 52], polar: [84, 66], warm: [36, 22], tropical: [16, -6], arid: [33, 17], wet: [56, 42] };
// the middle land's yearly rain for each climate, in mm (the winds' pattern is scaled to it)
const MEDIAN_MM = { temperate: 760, varied: 620, cold: 460, polar: 260, warm: 560, tropical: 1500, arid: 190, wet: 1300 };

// L: { E (heights in m, water <= 0), lake (1 a lake), rain (the winds' rain, relative), temp (°C, from latitude and
// height), want (the rain's median as calibrated) }; o: { cols, rows, km, climate, tempShift }; U: tools
function ecology(L, o, U) {
  const earth = o.model === "earth", { cols, rows } = o, N = cols * rows, cellKm = (o.km || 3200) / cols, B = BIO.CODE, E = L.E;
  const [la, lb] = LAT[o.climate] || LAT.temperate, lat = j => la + (lb - la) * (j + .5) / rows;
  const I = n => n % cols, J = n => (n / cols) | 0, land = n => E[n] > 0 && !L.lake[n];
  const ocean = new Uint8Array(N), st = [];
  for (let n = 0; n < N; n++) { const i = I(n), j = J(n); if (E[n] <= 0 && !L.lake[n] && (!i || !j || i === cols - 1 || j === rows - 1)) { ocean[n] = 1; st.push(n); } }
  while (st.length) { const n = st.pop(), i = I(n), j = J(n); for (const m of [i > 0 ? n - 1 : -1, i < cols - 1 ? n + 1 : -1, j > 0 ? n - cols : -1, j < rows - 1 ? n + cols : -1]) if (m >= 0 && !ocean[m] && E[m] <= 0 && !L.lake[m]) { ocean[m] = 1; st.push(m); } }
  const dOcean = U.distance(cols, rows, n => ocean[n] === 1);
  // how far the wind has come over land: for each cell the distance back to the sea, upwind (westerlies blow from the
  // west, the trade winds and the polar winds from the east)
  // (the belts meet over several degrees, not on a line: near 30° and 60° the two winds are blended by how far into
  // each belt the cell lies)
  const upW = new Float32Array(N), upE = new Float32Array(N), upwind = new Float32Array(N);
  for (let j = 0; j < rows; j++) {
    let lw = -1e9, le = -1e9;
    for (let s = 0; s < cols; s++) { const n = j * cols + s; if (ocean[n]) lw = s; upW[n] = (s - lw) * cellKm; }
    for (let s = 0; s < cols; s++) { const i = cols - 1 - s, n = j * cols + i; if (ocean[n]) le = s; upE[n] = (s - le) * cellKm; }
  }
  const westShare = a => smooth(26, 34, a) * (1 - smooth(56, 64, a));
  for (let n = 0; n < N; n++) { const w = westShare(Math.abs(lat(J(n)))); upwind[n] = Math.min(4000, upW[n]) * w + Math.min(4000, upE[n]) * (1 - w); }
  // the rivers: water gathered down the land (to know which ground is waterlogged, and where rivers cross dry land)
  const acc = flow(E, cols, rows, U);
  const T = new Float32Array(N), Tw = new Float32Array(N), Tc = new Float32Array(N), P = new Float32Array(N), sf = new Float32Array(N), AI = new Float32Array(N);
  const kop = new Uint8Array(N), biome = new Uint8Array(N), canopy = new Uint8Array(N), med = MEDIAN_MM[o.climate] || 620;
  const slope = n => { const i = I(n), j = J(n); let s = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; s = Math.max(s, Math.abs(E[b * cols + a] - E[n])); } return s / (cellKm * 1000); };
  const accBig = Math.max(30, N * .0025);
  for (let n = 0; n < N; n++) {
    const j = J(n), a = Math.abs(lat(j)), e = Math.max(0, E[n]);
    // warmth: the latitude's, less with height; the seasons swing more toward the poles and far from the sea
    // the warmest and the coldest month, each from the Earth's own averages by latitude (July about 21 °C at 45°, 14 °C
    // at 60°, 8 °C at 70°); winters far colder inland than on the coast, where the sea keeps them mild, summers a little
    // warmer inland; both 6.5 °C colder for every km of height. The year's mean lies between them
    const cont = 1 - Math.exp(-dOcean[n] * cellKm / 550), lapse = e * .0065 - (o.tempShift || 0) * 40;
    // (a cold current keeps its coast cool and grey in summer: Lima, Walvis Bay, San Diego)
    const fg = earth && L.fog ? L.fog[n] : 0;
    const tw = 30 - .0045 * a * a + 2 * cont - lapse - 6 * fg, tc = 27 - .0085 * a * a - .35 * a * cont - lapse - fg, t = (tw + tc) / 2;
    T[n] = t; Tw[n] = tw; Tc[n] = tc;
    // the year's rain in mm, and when it falls (the share in the warm half of the year)
    P[n] = Math.max(5, earth && L.mm ? L.mm[n] : L.rain[n] / (L.want || .55) * med);
    // (each belt's season blended smoothly into the next: the even rain of the equator, the summer rain of the monsoon
    // and savanna belt, the dry summers of the subtropical west coasts (the Mediterranean, California, central Chile),
    // the even rain of maritime coasts, the summer rain of continental interiors)
    const mon = smooth(6, 12, a) * (1 - smooth(22, 28, a)), medS = smooth(29, 33, a) * (1 - smooth(39, 43, a)) * (1 - smooth(250, 500, upwind[n])), mar = smooth(38, 46, a) * (1 - smooth(300, 700, upwind[n]));
    let s = .52 + mon * (.26 + .1 * cont) + (1 - mon) * smooth(26, 40, a) * .1 * cont + (a > 28 ? .08 * cont : 0) - medS * .34 - mar * .1;
    sf[n] = Math.max(.15, Math.min(.92, s));
    // what the air could take (a simple Thornthwaite-like demand), and so how dry the land is
    // (with the Earth model, Hargreaves' demand: the sun's strength at the latitude, the warmth, and the day's swing of
    // temperature, wide under the clear skies of dry land and narrow under clouds or sea fog; so a hot desert's air takes
    // three times the water a cool one's does, and the same 150 mm makes the Sahara at 25° and only steppe at 50°)
    const ra = 15 + 21 * Math.pow(Math.cos(a * Math.PI / 180), 1.4), dtr = 7 + 8 * Math.exp(-P[n] / 400) + 4 * cont - 5 * fg;
    const pet = earth ? Math.max(60, Math.min(2600, .0023 * .408 * ra * Math.max(0, t + 17.8) * Math.sqrt(Math.max(3, dtr)) * 365)) : Math.max(120, Math.min(2000, 62 * (t + 4)));
    AI[n] = P[n] / pet;
    if (!land(n)) continue;
    kop[n] = koppen(T[n], Tw[n], Tc[n], P[n], s);
  }
  if (process.env.ATLAS_DEBUG) { const q = (F) => { const v = []; for (let n = 0; n < N; n++) if (land(n)) v.push(F[n]); v.sort((x, y) => x - y); return [.05, .25, .5, .75, .95].map(p => Math.round(v[Math.floor(p * (v.length - 1))] * 100) / 100).join(" "); }; console.error("P", q(P), "| AI", q(AI)); }
  // biomes, from the class and the ground
  for (let n = 0; n < N; n++) {
    if (!land(n)) continue;
    const k = KOP[kop[n]], e = E[n], ai = AI[n], sl = slope(n), riv = acc[n];
    let b;
    switch (k[0]) {
      case "E": b = k === "EF" ? B.icesheet : e > 1400 || Tw[n] > 6 && e > 900 ? B.alpine : B.tundra; break;
      case "B": b = k[1] === "W" ? (k[2] === "h" ? (e < 700 && sl < .012 && riv < accBig * .3 ? B.dunes : B.rockdesert) : B.colddesert) : (k[2] === "h" ? B.scrub : B.steppe); break;
      case "A": b = k === "Af" ? (e > 1300 ? B.cloud : B.rainforest) : k === "Am" ? B.monsoon : (ai > .95 ? B.woodland : B.savanna); break;
      case "C": b = k[1] === "s" ? B.mediterranean : ai < .55 ? B.grass : ai < (earth ? .65 : .8) ? B.woodland : k[1] === "w" ? B.woodland : k[2] === "a" ? B.subtropical : k[2] === "c" ? B.mixed : B.temperate; break;
      default: b = ai < .5 ? B.steppe : ai < (earth ? .65 : .78) ? B.grass : (k[2] === "a" || k[2] === "b") ? (ai < .95 ? B.mixed : B.temperate) : B.boreal;
    }
    // above the trees: alpine meadow, then bare rock where it is steep, then snow
    if (k[0] !== "B" && Tw[n] < 9.5 && e > 600 && b !== B.icesheet) b = B.alpine;
    if ((b === B.alpine || b === B.tundra) && (sl > .09 || Tw[n] < 4)) b = B.rock;
    if (Tw[n] < 1.5 && e > 300) b = B.icesheet;
    // wetlands: flat, low, and waterlogged (much water gathering, or more rain than the air takes)
    const flat = sl < .007 && e < 400, soaked = riv > accBig * .7 || (ai > 1.2 && riv > accBig * .15) || (ai > 1.6 && e < 60);
    if (flat && soaked && k[0] !== "B" && k[0] !== "E") {
      if (T[n] > 21 && dOcean[n] * cellKm < 25) b = B.mangrove;
      else if (T[n] > 18) b = B.swampforest;
      else if (k[0] === "D" || T[n] < 4) b = B.bog;
      else b = riv > accBig * 6 ? B.floodplain : B.marsh;
    }
    // a river through dry land keeps a green corridor along it
    if ((k[0] === "B" || ai < .45) && riv > accBig * 2.5 && b !== B.icesheet) b = B.gallery;
    biome[n] = b;
  }
  // a corridor is as wide as its river allows: spread it a cell or two from the channel, only into dry land
  { const add = []; for (let n = 0; n < N; n++) if (biome[n] === B.gallery) { const i = I(n), j = J(n), w = acc[n] > accBig * 10 ? 1 : 0; for (let dj = -w; dj <= w; dj++) for (let di = -w; di <= w; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (land(m) && [B.dunes, B.rockdesert, B.colddesert, B.scrub, B.steppe].includes(biome[m])) add.push(m); } } for (const m of add) biome[m] = B.gallery; }
  // tree cover, from the year's productivity (Lieth's Miami model), the treeline, fire in the savanna, the wetlands
  for (let n = 0; n < N; n++) {
    if (!land(n)) continue;
    const t = T[n], npp = Math.min(3000 / (1 + Math.exp(1.315 - .119 * t)), 3000 * (1 - Math.exp(-.000664 * P[n])));
    // (trees close over the land where the summers are warm enough (the warmest month above about 10 °C: the treeline)
    // and there is water enough (the aridity index above about a half); how thick they stand rises with productivity)
    let c = Math.max(0, Math.min(1, earth ? (AI[n] - .3) / .45 : (AI[n] - .45) / .5)) * Math.max(0, Math.min(1, (Tw[n] - 10) / 4)) * Math.min(1, .55 + npp / 1600);
    const b = biome[n];
    if (b === B.savanna) c *= .4; else if (b === B.woodland || b === B.mediterranean) c *= .6; else if (b === B.grass || b === B.steppe) c *= .2;
    else if (b === B.marsh || b === B.floodplain) c *= .15; else if (b === B.bog) c *= .3; else if (b === B.swampforest || b === B.mangrove) c = Math.max(c, .8);
    else if (b === B.gallery) c = Math.max(c, .55); else if (b === B.alpine || b === B.tundra) c *= .08; else if ([B.rock, B.icesheet, B.dunes, B.rockdesert, B.colddesert].includes(b)) c = 0;
    canopy[n] = Math.round(c * 255);
  }
  if (process.env.ATLAS_DEBUG) { const cnt = {}, kc = {}; let L0 = 0; for (let n = 0; n < N; n++) if (land(n)) { L0++; const nm = BIO.LIST[biome[n]][0]; cnt[nm] = (cnt[nm] || 0) + 1; kc[KOP[kop[n]]] = (kc[KOP[kop[n]]] || 0) + 1; } const f = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k, v]) => k + " " + Math.round(v / L0 * 100)).join(", "); console.error("biomes:", f(cnt)); console.error("koppen:", f(kc)); }
  // the five kinds of land the map shows (the user, 27 Oct 2026: "very simple: desert, flat lands, forest, mountains and
  // maybe swamp"), and snow where it never melts; the detailed biome stays in .detail. Mountains are the high, rugged
  // ground (about 1800 m and up, or above the trees); forest is wherever trees close over the land; the rest is flat
  // land, or desert where the climate is dry
  const simple = new Uint8Array(N), DES = new Set([B.dunes, B.rockdesert, B.colddesert, B.scrub]), WET = new Set([B.marsh, B.bog, B.swampforest, B.mangrove, B.floodplain]);
  for (let n = 0; n < N; n++) {
    if (!land(n)) continue; const b = biome[n];
    simple[n] = b === B.icesheet ? B.snow : WET.has(b) ? B.swamp : (b === B.alpine || b === B.rock || E[n] > 1800) ? B.mountains : DES.has(b) ? B.desert : canopy[n] > 90 || b === B.gallery && canopy[n] > 60 ? B.forest : B.plains;
  }
  const ground = earth ? groundEarth() : groundClassic();
  function groundClassic() {
  // the bare ground of dry land, where little grows over it (the user, 27 Oct 2026: the desert "looks kinda
  // unnatural"): a desert is not one sand but a mosaic, each by its place in the land: bare rock on the uplands and
  // steep slopes (hamada), sand seas (ergs) filling the wide low basins where the wind drops its sand, gravel plains
  // (reg) between them and on the fans below the mountains, salt pans in the basins that cannot drain.
  // 0 not dry, 1 sand, 2 gravel, 3 rock, 4 salt
  const ground = new Uint8Array(N), mean = Float32Array.from(E, v => Math.max(0, v)); blur(mean, cols, rows, 18, 2);
  const sandF = new Float32Array(N);
  for (let n = 0; n < N; n++) { if (!land(n) || AI[n] > .55) continue; const rel = E[n] - mean[n]; sandF[n] = AI[n] < .22 && rel < -60 && slope(n) < .01 ? 1 : 0; }
  blur(sandF, cols, rows, 3, 2);
  for (let n = 0; n < N; n++) {
    if (!land(n) || AI[n] > .55) continue; const rel = E[n] - mean[n], sl = slope(n);
    ground[n] = sl > .03 || rel > 160 || E[n] > 1600 ? 3 : sandF[n] > .5 ? 1 : 2;
  }
  for (const n of L.playa || []) if (land(n) && AI[n] < .35) ground[n] = 4;
  // and on the lowest, flattest floors of the driest basins, where what little water comes down dries to a crust (the
  // Sahara's chotts, the Lut's kavirs): a few pans, no more than about 2% of the dry land
  { const salt = new Float32Array(N); let dry = 0;
    for (let n = 0; n < N; n++) { if (!ground[n]) continue; dry++; if (AI[n] < .2 && slope(n) < .006 && E[n] - mean[n] < -110) salt[n] = 1; }
    blur(salt, cols, rows, 2, 1); const c = []; for (let n = 0; n < N; n++) if (salt[n] > .55 && ground[n] && ground[n] !== 3) c.push(n);
    c.sort((a, b) => (E[a] - mean[a]) - (E[b] - mean[b])); for (const n of c.slice(0, Math.round(dry * .02))) ground[n] = 4; }
  return ground;
  }
  // the bare ground with the Earth model: what a desert's floor is made of, from its rock, its water and its wind
  //   - rock (hamada) where the land is high, steep or stands above its surroundings: the wind strips it bare;
  //   - badlands where soft ground at the foot of the uplands is cut by many dry gullies (the Dakota Badlands, the
  //     Bardenas): dry land, moderate slopes, much water gathering in short bursts; few of them;
  //   - sand seas (ergs) only where there is sand to make them: it comes from dry riverbeds, dry lakebeds and dry
  //     coasts, is carried downwind (westward in the trades, eastward in the westerlies) and is dropped where the
  //     ground is low and flat; so an erg lies downwind of its sources in a basin (the Namib's sand from the Orange
  //     river, the Sahara's ergs in its basins), and most desert is not sand at all;
  //   - salt pans on the lowest flat floors of the driest basins, dry lakebeds (clay pans) on those of the less dry;
  //   - gravel plains (reg) everywhere else, and on the fans below the mountains;
  //   - cold deserts (and the polar ones, under 250 mm a year beyond the trees) the same, in the colder colours.
  // 0 not dry, 1 sand, 2 gravel, 3 rock, 4 salt, 5 dry lakebed, 6 badlands
  function groundEarth() {
    const ground = new Uint8Array(N), mean = Float32Array.from(E, v => Math.max(0, v)); blur(mean, cols, rows, 18, 2);
    const dry = n => land(n) && biome[n] !== B.icesheet && (AI[n] < .5 || (Tw[n] < 10 && P[n] < 250));
    let nd = 0; for (let n = 0; n < N; n++) if (dry(n)) nd++;
    // the sand: made, carried and dropped
    const src = new Float32Array(N);
    for (let n = 0; n < N; n++) { if (!dry(n) || AI[n] > .35) continue; if (acc[n] > accBig * .3) src[n] += Math.min(3, acc[n] / (accBig * 3)); if (dOcean[n] * cellKm < 15) src[n] += .6; }
    for (const n of L.playa || []) if (dry(n)) src[n] += 1.5;
    const dep = new Float32Array(N);
    for (let j = 0; j < rows; j++) {
      const a = Math.abs(lat(j)), w = westShare(a) > .5 ? 1 : -1; let c = 0;
      for (let s = 0; s < cols; s++) {
        const i = w > 0 ? s : cols - 1 - s, n = j * cols + i;
        if (!land(n)) { c *= .6; continue; }
        c += src[n] * .08;
        const trap = dry(n) && AI[n] < .25 ? smooth(.016, .004, slope(n)) * smooth(40, -80, E[n] - mean[n]) : 0;
        const d = c * trap * .05; dep[n] += d; c -= d; c *= Math.exp(-cellKm / 900);
      }
    }
    blur(dep, cols, rows, 3, 2);
    // the gullied soft ground: where a great river cuts down through the soft fill of a dry basin, its banks break into
    // badlands (the Missouri breaks, the Bardenas); the steeper ground within a few cells of such a river, few of them
    const near = new Float32Array(N); for (let n = 0; n < N; n++) if (land(n) && acc[n] > accBig) near[n] = 1;
    blur(near, cols, rows, 3, 1);
    const gc = [];
    for (let n = 0; n < N; n++) { if (!dry(n) || AI[n] > .45 || near[n] < .05) continue; const sl = slope(n), rel = E[n] - mean[n]; if (sl > .006 && sl < .04 && rel > -90 && rel < 200 && E[n] > 80 && E[n] < 1500) gc.push(n); }
    gc.sort((x, y) => slope(y) * near[y] - slope(x) * near[x]);
    const gul = new Float32Array(N); for (const n of gc.slice(0, Math.round(nd * .04))) gul[n] = 1;
    blur(gul, cols, rows, 1, 1);
    const ds = []; for (let n = 0; n < N; n++) if (dep[n] > 0) ds.push(dep[n]); ds.sort((x, y) => y - x);
    const sandT = Math.max(1e-6, ds[Math.min(ds.length - 1, Math.round(nd * .25))] || 1e-6);
    for (let n = 0; n < N; n++) {
      if (!dry(n)) continue; const rel = E[n] - mean[n], sl = slope(n);
      ground[n] = sl > .03 || rel > 160 || E[n] > 1600 ? 3 : gul[n] > .25 ? 6 : dep[n] >= sandT ? 1 : 2;
    }
    // the lowest flat floors of the basins: salt where it is driest, clay where some water still gathers
    const pan = new Float32Array(N); for (let n = 0; n < N; n++) if (dry(n) && AI[n] < .45 && slope(n) < .006 && E[n] - mean[n] < -110) pan[n] = 1;
    blur(pan, cols, rows, 2, 1);
    const c = []; for (let n = 0; n < N; n++) if (pan[n] > .55 && ground[n] && ground[n] !== 3) c.push(n);
    c.sort((x, y) => (E[x] - mean[x]) - (E[y] - mean[y]));
    for (const n of c.slice(0, Math.round(nd * .025))) ground[n] = AI[n] < .2 ? 4 : 5;
    for (const n of L.playa || []) if (dry(n)) ground[n] = AI[n] < .2 ? 4 : 5;
    return ground;
  }
  return { T, Tw, Tc, P, sf, AI, kop, biome: o.detailed ? biome : simple, detail: biome, canopy, acc, ground };
}
function blur(F, cols, rows, r, passes) {
  const tmp = new Float32Array(F.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) { let acc = 0, cnt = 0; const o = j * cols; for (let i = -r; i < cols + r; i++) { if (i + r >= 0 && i + r < cols) { acc += F[o + i + r]; cnt++; } if (i - r - 1 >= 0 && i - r - 1 < cols) { acc -= F[o + i - r - 1]; cnt--; } if (i >= 0 && i < cols) tmp[o + i] = acc / cnt; } }
    for (let i = 0; i < cols; i++) { let acc = 0, cnt = 0; for (let j = -r; j < rows + r; j++) { if (j + r >= 0 && j + r < rows) { acc += tmp[(j + r) * cols + i]; cnt++; } if (j - r - 1 >= 0 && j - r - 1 < rows) { acc -= tmp[(j - r - 1) * cols + i]; cnt--; } if (j >= 0 && j < rows) F[j * cols + i] = acc / cnt; } }
  }
}
function smooth(a, b, v) { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
// the flow of water over the land: each cell's share of the rain gathered from above it (the priority flood fills the
// hollows so the water runs on)
function flow(E, cols, rows, U) {
  const N = cols * rows, seen = new Uint8Array(N), rec = new Int32Array(N).fill(-1), order = [], hp = new U.Heap(), lvl = new Float32Array(N);
  for (let n = 0; n < N; n++) { const i = n % cols, j = (n / cols) | 0; if (E[n] <= 0 || !i || !j || i === cols - 1 || j === rows - 1) { seen[n] = 1; lvl[n] = E[n]; hp.push(n, E[n]); } }
  while (hp.size) { const c = hp.pop(); order.push(c); const i = c % cols, j = (c / cols) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const m = b * cols + a; if (seen[m]) continue; seen[m] = 1; rec[m] = c; lvl[m] = Math.max(E[m], lvl[c] + .01); hp.push(m, lvl[m]); } }
  const A = new Float32Array(N); for (let n = 0; n < N; n++) A[n] = E[n] > 0 ? 1 : 0;
  for (let k = order.length - 1; k >= 0; k--) { const n = order[k], r = rec[n]; if (r >= 0) A[r] += A[n]; }
  return A;
}
// the Köppen classes, by their letters; each cell keeps the index
const KOP = ["", "Af", "Am", "Aw", "BWh", "BWk", "BSh", "BSk", "Csa", "Csb", "Cwa", "Cwb", "Cfa", "Cfb", "Cfc", "Dsa", "Dsb", "Dwa", "Dwb", "Dwc", "Dfa", "Dfb", "Dfc", "Dfd", "ET", "EF"];
const KI = Object.fromEntries(KOP.map((k, i) => [k, i]));
// T the year's mean, Tw the warmest month, Tc the coldest (°C); P the year's rain (mm); s the share falling in summer
function koppen(T, Tw, Tc, P, s) {
  if (Tw < 0) return KI.EF;
  if (Tw < 10) return KI.ET;
  const th = 20 * T + (s >= .7 ? 280 : s <= .3 ? 0 : 140);
  if (P < th) return P < th / 2 ? (T >= 18 ? KI.BWh : KI.BWk) : (T >= 18 ? KI.BSh : KI.BSk);
  // the driest month's rain, roughly, from the year's and how unevenly it falls
  const dry = P / 12 * Math.max(.05, 1 - Math.abs(s - .5) * 2.4);
  if (Tc >= 18) return dry >= 60 ? KI.Af : dry >= 100 - P / 25 ? KI.Am : KI.Aw;
  const sub = Tw >= 22 ? "a" : "b", wet = s <= .32 ? "s" : s >= .72 ? "w" : "f";
  if (Tc > -3) { if (wet === "s") return KI["Cs" + sub]; if (wet === "w") return KI["Cw" + sub]; return Tw < 15 ? KI.Cfc : KI["Cf" + sub]; }
  if (wet === "s") return KI["Ds" + sub];
  if (wet === "w") return Tw < 15 ? KI.Dwc : KI["Dw" + sub];
  return Tc < -38 ? KI.Dfd : Tw < 15 ? KI.Dfc : KI["Df" + sub];
}

module.exports = { ecology, KOP, LAT, MEDIAN_MM };
