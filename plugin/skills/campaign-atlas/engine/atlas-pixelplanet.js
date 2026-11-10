/* Campaign Atlas: worlds as pixel art (the user, 4 Nov 2026: "make the planet image 32 bit pixelated and make it cool
   looking, also remember not every planet has a sea"). Each world is drawn as a small sphere of chunky pixels in its
   own palette (atlas-planet.js), every part of it from what the world is:
   - seas only where it has a liquid (water, methane, lava), as much of it as its ocean share; a dry world all ground;
   - its ground in tones of its own rock, plants where it has life (coloured by its star), ice caps by its ice;
   - impact craters where no air, water or moving crust wears them away; an icy moon's cracks;
   - a giant's bands, more of them the faster it turns, and its great storm; a hothouse under its cloud deck;
   - clouds where it has weather, a glowing rim of air on its lit side, lava and a people's city lights on its night side;
   - rings, behind and before it; lit by its own star's colour from one side, in bands of light with ordered dithering,
     as pixel art is shaded.
   In a world's card it turns, slowly (still for anyone who asks the system for less motion). */
(function (A) {
  "use strict";
  if (!A || A.pixelPlanet) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, hex = s => { s = String(s || "#888888"); if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]; return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], lt = (c, f) => c.map(v => v + (255 - v) * f), dk = (c, f) => c.map(v => v * (1 - f));
  const hstr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  // smooth 3D value noise and its sum over octaves, on the sphere (so the texture has no seam)
  function noise3(seed) {
    const h = (x, y, z) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177) + Math.imul(seed, 2246822519) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const f = t => t * t * (3 - 2 * t);
    return (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = f(x - xi), v = f(y - yi), w = f(z - zi); let s = 0;
      for (let k = 0; k < 8; k++) { const a = k & 1, b = (k >> 1) & 1, c = (k >> 2) & 1; s += h(xi + a, yi + b, zi + c) * (a ? u : 1 - u) * (b ? v : 1 - v) * (c ? w : 1 - w); } return s; };
  }
  const fbm = (n, x, y, z, oct) => { let s = 0, a = .5, f = 1, t = 0; for (let o = 0; o < oct; o++) { s += a * n(x * f, y * f, z * f); t += a; a *= .5; f *= 2.03; } return s / t; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);
  const giantOf = p => /gas|ice|mini/.test(p.env || "") || ["gas", "icegiant", "hotjupiter", "mini"].includes(p.kind);

  /* ---- the world's surface, once: an equirectangular map of colours, what glows, and its clouds */
  const TW = 128, TH = 64;
  function texture(p) {
    const P = p.palette || {}, seed = hstr(p.name || p.kind || "world"), N1 = noise3(seed), N2 = noise3(seed + 7), N3 = noise3(seed + 13), r = rng(seed);
    const col = new Float32Array(TW * TH * 3), glow = new Float32Array(TW * TH * 3), lights = new Float32Array(TW * TH), cloud = new Float32Array(TW * TH), elev = new Float32Array(TW * TH);
    const sph = (i, j) => { const lon = (i + .5) / TW * Math.PI * 2, lat = Math.PI / 2 - (j + .5) / TH * Math.PI; return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon), lat]; };
    const put = (k, c) => { col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2]; };
    if (giantOf(p)) {
      // a giant: its bands, wavering where the jets shear them; its great storm
      const B = (P.bands || ["#d8c0a0", "#b08860", "#e6d6bc", "#9a7a5a"]).map(hex), nb = clamp(Math.round(4 + 8 * (24 / Math.max(6, p.day || 10))), 4, 14);
      const storm = /great/.test((p.winds || {}).storms || "") ? [r() * Math.PI * 2, (r() - .5) * .9] : null;
      for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
        const k = j * TW + i, [x, y, z, lat] = sph(i, j), turb = fbm(N1, x * 3, y * 9, z * 3, 3) - .5, b = (lat / Math.PI + .5) * nb + turb * 1.6;
        const bi = ((Math.floor(b) % B.length) + B.length) % B.length, bf = b - Math.floor(b);
        let c = mix(B[bi], B[(bi + 1) % B.length], clamp(bf * 3 - 2, 0, 1) * .6);
        c = c.map(v => v * (.9 + fbm(N2, x * 6, y * 14, z * 6, 2) * .2));
        if (storm) { const lon = (i + .5) / TW * Math.PI * 2, dl = Math.atan2(Math.sin(lon - storm[0]), Math.cos(lon - storm[0])), dd = Math.hypot(dl / .5, (lat - storm[1]) / .17); if (dd < 1) c = mix(c, lt(mix(B[1], [200, 90, 60], .5), .15), (1 - dd) * .9); }
        put(k, c);
      }
      return { col, glow, lights, cloud, giant: true };
    }
    const g = hex(P.ground || "#8a7a5a"), sea = P.sea ? hex(P.sea) : null, plant = P.plant ? hex(P.plant) : null, ice = hex(P.ice || "#e8f0f5");
    const liquid = p.liquid || "none", oc = sea && ["water", "methane", "lava"].includes(liquid) ? clamp(p.ocean || 0, 0, 1) : 0, lava = liquid === "lava" || p.kind === "lava";
    const thick = (p.pressure || 0) > 20 && P.clouds, airless = (p.pressure || 0) < .01;
    // its height everywhere, and the level its seas fill to (as much as its ocean share)
    // (once its surface has been opened, the globe is painted from that map's own heights and its sea: its continents
    // are the map's; the galaxy plan of 5 Nov 2026, section 6. Before, from its noise, the same every time)
    const real = A.pixelPlanet.heightOf ? A.pixelPlanet.heightOf(p) : null;
    if (real) { for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) { const gi = Math.min(real.cols - 1, Math.floor((i + .5) / TW * real.cols)), gj = Math.min(real.rows - 1, Math.floor((j + .5) / TH * real.rows)); elev[j * TW + i] = real.H[gj * real.cols + gi] / 255; } }
    else for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) { const [x, y, z] = sph(i, j); elev[j * TW + i] = fbm(N1, x * 2.1 + 3, y * 2.1, z * 2.1, 4) * .75 + fbm(N2, x * 6, y * 6, z * 6, 3) * .25; }
    let seaLv = -1; if (real) { if (oc > 0 || real.sea > 0) seaLv = sea && oc > 0 ? real.sea / 255 : -1; } else if (oc > 0) { const s = Float32Array.from(elev).sort(); seaLv = s[Math.min(s.length - 1, Math.floor(oc * s.length))]; if (oc >= .97) seaLv = 2; }
    // craters where nothing wears them away (as the surface map has them): many small, few great
    const craters = [], nC = airless || (p.pressure < .1 && p.tectonics === "stagnant") ? (airless ? 26 : 12) : p.tectonics === "frozen" ? 18 : 0;
    for (let c = 0; c < nC; c++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); craters.push([s * Math.cos(a), u, s * Math.sin(a), .04 + Math.pow(r(), 3) * .22]); }
    const capLat = (p.ice || 0) > .02 && liquid !== "subsurface" && liquid !== "ice" ? Math.PI / 2 * (1 - clamp(.12 + p.ice * .7, 0, .95)) : (liquid === "ice" || liquid === "subsurface" ? -1 : Math.PI / 2 * (airless || liquid === "none" ? 1.2 : .86));
    for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
      const k = j * TW + i, [x, y, z, lat] = sph(i, j), e = elev[k], tone = fbm(N3, x * 9, y * 9, z * 9, 2);
      let c;
      if (thick) { const sw = fbm(N1, x * 2 + y * 3, y * 6, z * 2, 3); c = mix(hex(P.clouds), dk(hex(P.clouds), .3), clamp((sw - .4) * 2.2, 0, 1)); put(k, c); continue; }
      if (e < seaLv) {
        // a sea, darker the deeper; lava bright and glowing
        const dpt = clamp((seaLv - e) / .18, 0, 1);
        if (lava) { c = mix([255, 200, 90], [200, 50, 20], dpt * .8); const gk = .8 + tone * .4; glow[k * 3] = c[0] * gk; glow[k * 3 + 1] = c[1] * gk; glow[k * 3 + 2] = c[2] * gk; }
        else c = mix(lt(sea, .18), dk(sea, .35), dpt);
      } else {
        const hgt = clamp((e - Math.max(0, seaLv)) / .35, 0, 1);
        // its rock in tones: low and dark, high and pale; a dry world's old basins darker still (maria)
        c = mix(dk(g, .22), lt(g, .2), clamp(hgt * .9 + (tone - .5) * .5, 0, 1));
        if (oc === 0 && e < .42) c = mix(c, dk(g, .35), clamp((.42 - e) * 6, 0, .7));
        if (plant && Math.abs(lat) < 1.1 && hgt < .75) c = mix(c, plant, clamp(.75 - hgt + (tone - .5), 0, .85) * (1 - Math.abs(lat) / 1.3));
        if (lava) { c = dk(c, .55); const crack = Math.abs(fbm(N2, x * 5, y * 5, z * 5, 3) - .5); if (crack < .03) { const gc = [255, 120, 40]; c = mix(c, gc, .8); glow[k * 3] = 230; glow[k * 3 + 1] = 90; glow[k * 3 + 2] = 30; } }
      }
      // craters: a pale rim, a dark floor
      for (const [cx, cy, cz, cr] of craters) { const d = Math.acos(clamp(x * cx + y * cy + z * cz, -1, 1)) / cr; if (d < 1.15) { c = d > .85 ? lt(c, .32 * (1.15 - d) / .3) : dk(c, .26 * (1 - d * .6)); } }
      // ice: caps by its ice; an icy world all ice, cracked (reddish lines, as Europa's)
      if (liquid === "ice" || liquid === "subsurface" || p.surface === "ice" || p.kind === "ice" || p.kind === "dwarf") { c = mix(ice, dk(ice, .12), tone * .6); const ln = Math.abs(fbm(N1, x * 4, y * 4, z * 4, 3) - .5); if (ln < .022) c = mix(c, [150, 90, 60], .7); }
      else if (Math.abs(lat) > capLat + (tone - .5) * .12) c = mix(c, ice, .9);
      // a people of its own: their cities' lights, seen on the night side
      if (/people/.test(p.life || "") && e >= seaLv && fbm(N3, x * 14, y * 14, z * 14, 2) > .7) lights[k] = 1;
      put(k, c);
      // clouds where it has weather
      if ((p.pressure || 0) > .05 && (liquid === "water" || liquid === "methane" || (p.pressure || 0) > 1)) { const cl = fbm(N2, x * 2.6 + 9, y * 4, z * 2.6, 4); cloud[k] = clamp((cl - (liquid === "water" ? .52 : .58)) * 4, 0, .85); }
    }
    return { col, glow, lights, cloud, giant: false, haze: liquid === "methane" ? [217, 154, 78] : null };
  }
  const TEX = new Map();
  const texOf = p => { const key = [p.name, p.kind, p.ocean, p.liquid, p.ice, p.pressure, JSON.stringify(p.palette || {}), A.pixelPlanet.heightOf && A.pixelPlanet.heightOf(p) ? "real" : ""].join("|"); let t = TEX.get(key); if (!t) { t = texture(p); TEX.set(key, t); if (TEX.size > 80) TEX.delete(TEX.keys().next().value); } return t; };

  /* ---- the sphere: N pixels across, turned by rot, lit from the upper left by its star; with rings, wider */
  function render(p, N, rot, star, light) {
    const T = texOf(p), P = p.palette || {}, rings = p.rings, M = rings ? Math.round(N * 2.2) : N + 6, img = new Uint8ClampedArray(M * M * 4);
    const R = N / 2 - .5, cx = M / 2, cy = M / 2, L = light ? light.slice(0, 3) : [-.8, -.3, .52], LN = Math.hypot(...L); L[0] /= LN; L[1] /= LN; L[2] /= LN;
    const sun = star ? hex(star).map(v => .82 + v / 255 * .18) : [1, 1, 1], sky = P.sky ? hex(P.sky) : null, air = clamp(Math.log10(Math.max(p.pressure || 0, 1e-4) * 1000) / 4, 0, 1);
    const ringC = rings ? (rings.icy ? [226, 220, 204] : [150, 138, 120]) : null, tilt = -.32, ct = Math.cos(tilt), st = Math.sin(tilt);
    const putPx = (i, j, c, a) => { const o = (j * M + i) * 4; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2]; img[o + 3] = a == null ? 255 : a; };
    const ringAt = (dx, dy) => { if (!rings) return null; const rx = dx * ct + dy * st, ry = (-dx * st + dy * ct) / .28, rr = Math.hypot(rx, ry) / R; if (rr < 1.3 || rr > 2.05) return null; const band = .7 + .3 * Math.sin(rr * 23) * Math.sin(rr * 7.3); return { c: ringC.map(v => v * band), a: Math.round(clamp((rr - 1.3) * 8, 0, 1) * clamp((2.05 - rr) * 8, 0, 1) * (rings.icy ? 235 : 170)), back: ry < 0 }; };
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
      const dx = i + .5 - cx, dy = j + .5 - cy, x = dx / R, y = dy / R, d2 = x * x + y * y, bay = BAYER[(j & 3) * 4 + (i & 3)], rg = ringAt(dx, dy);
      if (d2 > 1) {
        // the rim of air, glowing on the lit side; the rings behind the world
        const d = Math.sqrt(d2), side = clamp(-(x * L[0] + y * L[1]) / d + .35, 0, 1);
        if (sky && air > .05 && d < 1 + .16 * air + .05) { const a = clamp((1 + .16 * air + .05 - d) / (.16 * air + .05), 0, 1) * side * .85 + bay * .25; if (a > .2) { putPx(i, j, mix(sky, [255, 255, 255], .25), Math.round(clamp(a, 0, 1) * 200)); continue; } }
        if (rg && rg.a > 0) putPx(i, j, rg.c, rg.a);
        continue;
      }
      if (rg && !rg.back && rg.a > 120) { putPx(i, j, rg.c, 255); continue; }
      const z = Math.sqrt(1 - d2), lat = Math.asin(clamp(-y, -1, 1)), lon = Math.atan2(x, z) + rot;
      let u = Math.floor(((lon / (Math.PI * 2)) % 1 + 1) % 1 * TW), v = Math.floor((.5 - lat / Math.PI) * TH); v = clamp(v, 0, TH - 1); const k = v * TW + u;
      // light in bands, dithered where they meet: highlight, day, dusk, the terminator, night
      const lam = x * L[0] + y * L[1] + z * L[2] + bay * .2, lv = lam > .62 ? 1.12 : lam > .28 ? 1 : lam > .04 ? .74 : lam > -.1 ? .46 : .16;
      let c = [T.col[k * 3] * lv * sun[0], T.col[k * 3 + 1] * lv * sun[1], T.col[k * 3 + 2] * lv * sun[2]];
      if (T.cloud[k] > 0) { const ca = T.cloud[k] > .35 + bay * .3 ? T.cloud[k] : 0; if (ca) c = mix(c, [255 * lv * sun[0], 255 * lv * sun[1], 255 * lv * sun[2]], ca); }
      if (T.haze) c = mix(c, T.haze.map(q => q * lv), .35);
      // what glows: lava, and a people's lights, brightest where it is night
      const night = clamp(.3 - lam, 0, 1) / .3;
      if (T.glow[k * 3] > 0) c = [Math.max(c[0], T.glow[k * 3] * (.45 + night * .55)), Math.max(c[1], T.glow[k * 3 + 1] * (.45 + night * .55)), Math.max(c[2], T.glow[k * 3 + 2] * (.45 + night * .55))];
      if (T.lights[k] && night > .5) c = mix(c, [255, 214, 120], .85);
      // the edge of the air on the lit limb
      if (sky && air > .05 && lam > -.05) c = mix(c, lt(sky, .2), clamp(Math.pow(1 - z, 3) * air * 1.4, 0, .6));
      putPx(i, j, c);
    }
    return { data: img, size: M };
  }
  function canvasOf(p, N, rot, star, light) {
    const r = render(p, N, rot || 0, star, light), cv = document.createElement("canvas"); cv.width = cv.height = r.size;
    const ctx = cv.getContext("2d"), id = ctx.createImageData(r.size, r.size); id.data.set(r.data); ctx.putImageData(id, 0, 0); return cv;
  }
  // a still picture, as a data URL, for the star chart's system and the survey sheet (kept: the chart redraws often)
  const URLS = new Map();
  function url(p, N, star) {
    if (typeof document === "undefined") return "";
    const key = [p.name, p.kind, N, star, p.ocean, p.liquid, JSON.stringify(p.palette || {}), A.pixelPlanet.heightOf && A.pixelPlanet.heightOf(p) ? "real" : ""].join("|"); let u = URLS.get(key);
    if (!u) { u = canvasOf(p, N || 32, .6, star).toDataURL("image/png"); URLS.set(key, u); if (URLS.size > 300) URLS.delete(URLS.keys().next().value); }
    return u;
  }
  // a world turning in a canvas, as long as the canvas is on the page; still if the viewer asked for less motion
  function spin(cv, p, N, star) {
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d"), per = p.locked && !p.host ? 60 : clamp(14 * Math.pow((p.day || 24) / 24, .25), 8, 40);   // seconds a turn takes here
    let rot = .6, last = 0;
    // (each of its pixels three of the screen's, fewer for a ringed giant, so it fits its card)
    const draw = () => { const r = render(p, N, rot, star); if (cv.width !== r.size) { cv.width = cv.height = r.size; const k = Math.min(3, 300 / r.size); cv.style.width = cv.style.height = Math.round(r.size * k) + "px"; } const id = ctx.createImageData(r.size, r.size); id.data.set(r.data); ctx.putImageData(id, 0, 0); };
    draw(); if (still) return;
    const tick = t => { if (!cv.isConnected) return; if (t - last > 80) { rot += (t - (last || t)) / 1000 / per * Math.PI * 2; last = t; draw(); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  // (heightOf(p): the world's opened surface, { H, cols, rows, sea }, or null; set by the star chart, atlas-galaxy.js)
  A.pixelPlanet = { render, canvasOf, url, spin, heightOf: null };
})(typeof ATLAS !== "undefined" ? ATLAS : typeof window !== "undefined" ? (window.ATLAS = window.ATLAS || {}) : null);
