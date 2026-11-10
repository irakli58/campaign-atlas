/* The galaxy as it physically is (the galaxy plan of 5 Nov 2026, approved by the user on 10 Nov: the workspace's
   reviews/2026-11-05-galaxy-plan.md, sections 2 to 4). Plain code, no page: the star chart draws from it, the new
   generator (model 2, atlas-galaxy-gen.js) grows its systems from it, and the time-lapse moves its stars with it.
   Units: light years (ly) and kiloparsecs (kpc, 3,261.56 ly) for where, km/s for speed, millions of years (Myr) for time,
   Suns for mass. The galaxy's centre is at (0, 0); x to the right, y down the chart, z out of the plane.

   What it rests on (figures checked on 5 Nov 2026, the rest from the standard reviews, marked):
   - the discs: thin disc scale length 2.6 kpc, scale height 0.3 kpc; thick disc 2.0 kpc and 0.9 kpc, about 12% of the
     disc's stars near the Sun (Bland-Hawthorn and Gerhard 2016, as reported in later papers)
   - the bar: half-length 5.0 kpc, about 28-33 degrees from the Sun's line to the centre (Wegg, Gerhard and Portail 2015);
     it turns at about 33-40 km/s/kpc (Portail and others 2017; Clarke and Gerhard 2022)
   - the arms: four main arms and the local spur, wound at 7 to 20 degrees (Reid and others 2014, Wu and others 2019); in
     old stars only some 10-20% denser than between them, in young stars and gas several times [density-wave theory, Lin
     and Shu 1964; the arms' own turning speed about 20-28 km/s/kpc: not settled, said so]
   - the rotation: 229 km/s at the Sun, falling 1.7 km/s each kpc out to 25 kpc (Eilers and others 2019); worked out here
     from a bulge and bar (1.6e10 Suns), the discs (4.4e10) and a dark-matter halo [NFW, 8e11 Suns, scale 16 kpc], fitted
     to that curve within about 2 km/s from 5 to 25 kpc; the black hole's own pull only at the centre
   - the black hole: 4.297 million Suns, 8,277 parsecs from the Sun (GRAVITY 2022); about a billionth as bright as it
     could be; its pull rules a few light years [its sphere of influence, ~2 pc]
   - the stars: born by the initial mass function [Kroupa 2001: slopes 0.3 below 0.08 Suns, 1.3 to 0.5, 2.3 above];
     a star lives about 10 billion years times its mass to the power -2.5 on the main sequence, then is briefly a giant,
     then a white dwarf (below 8 Suns), a neutron star (8-20) or a black hole (above 20); companions by mass: about one
     in five of the smallest, half of the Sun-like, nine in ten of the massive (Offner and others 2023); poorer in metals
     further out, -0.06 dex a kpc [the disc's gradient], and in the halo
   - globular clusters: about 160, round the halo [Harris catalogue]; open clusters: thousands, young, in the disc */
(function (A) {
  "use strict";
  const KPC = 3261.56, D2R = Math.PI / 180, TAU = Math.PI * 2;
  const GRAV = 4.30091e-6;                              // the gravitational constant in kpc (km/s)^2 per Sun
  const KMS_KPC_PER_MYR = 1.0227e-3;                    // 1 km/s/kpc in radians a million years
  const hash = s => { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const rng = seed => { let a = hash(seed) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = r => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  /* ---- the kinds of galaxy: each a set of figures (lengths in kpc). The barred spiral is the Milky Way's own. */
  const TYPES = {
    barred: { label: "A barred spiral, like the Milky Way", Rd: 2.6, Rmax: 16, hz: .3, thick: { Rd: 2, hz: .9, f: .12 }, bar: { a: 5, b: 1.6, c: 1, angle: 28, f: .2, omega: 37 }, bulge: { a: .7, f: .08 }, arms: { n: 4, major: [0, 2], pitch: 12, r0: 4.4, w: .5, young: 4, old: .15, spur: true, omega: 24 }, halo: { f: .012 }, Md: 4.4e10, Mb: 1.6e10, halo2: { rs: 16, Mvir: 8e11 }, bh: { mass: 4.297e6, active: 0 }, gc: 160, dust: 1 },
    spiral: { label: "A grand spiral with no bar", Rd: 3, Rmax: 18, hz: .3, thick: { Rd: 2.3, hz: .9, f: .1 }, bar: null, bulge: { a: 1, f: .15 }, arms: { n: 2, major: [0, 1], pitch: 14, r0: 2.5, w: .45, young: 5, old: .25, omega: 22 }, halo: { f: .01 }, Md: 6e10, Mb: 2e10, halo2: { rs: 18, Mvir: 1.5e12 }, bh: { mass: 3e7, active: 0 }, gc: 250, dust: 1 },
    flocculent: { label: "A ragged spiral of many short arms", Rd: 2.4, Rmax: 14, hz: .3, thick: { Rd: 2, hz: .8, f: .12 }, bar: null, bulge: { a: .6, f: .06 }, arms: { n: 9, major: [], pitch: 24, r0: 1.5, w: .25, young: 2.5, old: .06, len: .9, omega: 20 }, halo: { f: .012 }, Md: 3.5e10, Mb: 6e9, halo2: { rs: 15, Mvir: 9e11 }, bh: { mass: 2e6, active: 0 }, gc: 100, dust: .8 },
    lenticular: { label: "A lens-shaped galaxy: a disc with no arms", Rd: 2.8, Rmax: 15, hz: .5, thick: { Rd: 2.4, hz: 1.1, f: .3 }, bar: null, bulge: { a: 1.4, f: .4 }, arms: null, halo: { f: .02 }, Md: 5e10, Mb: 6e10, halo2: { rs: 18, Mvir: 1.5e12 }, bh: { mass: 1e8, active: .1 }, gc: 400, dust: .2 },
    elliptical: { label: "A giant elliptical: a great ball of old stars", Rd: 0, Rmax: 15, hz: 0, thick: null, bar: null, bulge: { a: 6, f: 1, q: .7 }, arms: null, halo: { f: .05 }, Md: 0, Mb: 4e11, halo2: { rs: 30, Mvir: 5e12 }, bh: { mass: 2e9, active: .6 }, gc: 3000, dust: .05 },
    dwarf: { label: "A dwarf irregular: small, clumpy, still making stars", Rd: .9, Rmax: 4, hz: .4, thick: { Rd: .9, hz: .6, f: .2 }, bar: null, bulge: null, arms: { n: 0, clumps: 14, w: .3, young: 2.2 }, halo: { f: .01 }, Md: 1e9, Mb: 0, halo2: { rs: 5, Mvir: 3e10 }, bh: null, gc: 6, dust: .4 },
    ring: { label: "A ring galaxy, its stars born in a spreading wave", Rd: 2.5, Rmax: 14, hz: .3, thick: { Rd: 2, hz: .8, f: .1 }, bar: null, bulge: { a: .8, f: .12 }, arms: { n: 0, ring: 9, w: .9, young: 6 }, halo: { f: .01 }, Md: 3e10, Mb: 1e10, halo2: { rs: 15, Mvir: 9e11 }, bh: { mass: 1e7, active: 0 }, gc: 120, dust: .6 }
  };
  const TYPE_LIST = Object.entries(TYPES).map(([k, t]) => [k, t.label]);

  /* ---- the galaxy of a campaign: its kind, its arms' names, where the Sun-like place stands, its black hole */
  const SYL = ["ka", "ve", "ra", "to", "mi", "sel", "dor", "an", "ix", "ul", "the", "cor", "ly", "zan", "or", "ae", "hal", "qui", "bre", "nos", "tar", "il", "ess", "yr", "om"];
  const word = r => { let s = ""; const n = 2 + (r() < .35 ? 1 : 0); for (let i = 0; i < n; i++) s += SYL[Math.floor(r() * SYL.length)]; return s.charAt(0).toUpperCase() + s.slice(1); };
  const MW_ARMS = ["The Scutum–Centaurus Arm", "The Norma Arm", "The Perseus Arm", "The Sagittarius–Carina Arm"];
  function galaxyOf(p) {
    p = p || {};
    const key = p.type && TYPES[p.type] ? p.type : "barred", T = TYPES[key], r = rng((p.seed || "atlas") + "|galaxy"), real = !!p.milkyWay;
    // (the arms laid as the Milky Way's are: at the Sun's angle a minor arm crosses about 1.2 kpc inward and a major arm
    // about 1.5 kpc outward, the two major arms leaving near the bar's ends; another kind turned at random)
    const arms = [], ph = T.bar ? (T.bar.angle + 29) * D2R : r() * TAU;
    if (T.arms && T.arms.n) for (let k = 0; k < T.arms.n; k++) arms.push({ k, th0: ph + k * TAU / T.arms.n + (T.arms.n > 4 ? (r() - .5) * .8 : 0), major: (T.arms.major || []).includes(k), name: real && key === "barred" ? MW_ARMS[k] : `The ${word(r)} Arm`, len: T.arms.len ? T.arms.len * (.6 + r() * .6) : 0 });
    // the local spur: a short arm between two arms, where a Sun-like place stands
    const spur = T.arms && T.arms.spur ? { name: real ? "The Orion Spur" : `The ${word(r)} Spur`, th0: 62.4 * D2R, r0: 7.4, len: .12 } : null;
    const clumps = T.arms && T.arms.clumps ? Array.from({ length: T.arms.clumps }, () => ({ x: gauss(r) * T.Rd * 1.2, y: gauss(r) * T.Rd * 1.2, w: T.arms.w * (.5 + r()), s: .5 + r() })) : [];
    // where a Sun-like place stands: 8.2 kpc from the centre, in the spur (or between arms), a little above the plane
    const sunR = key === "barred" ? 8.2 : key === "dwarf" ? 2 : key === "elliptical" ? 8 : T.Rd * 3.1;
    const sun = { x: 0, y: sunR * KPC, z: 66 };
    const bh = T.bh ? Object.assign({ name: real ? "Sagittarius A*" : `${word(r)}'s Heart` }, T.bh, p.bh || {}) : null;
    if (bh && p.active != null) bh.active = clamp(+p.active || 0, 0, 1);
    return { type: key, T, label: T.label, arms, spur, clumps, sun, bh, real, name: p.galaxyName || (real ? "The Milky Way" : p.name || "The galaxy"), Rmax: T.Rmax * KPC };
  }

  /* ---- where the stars are: the density of each part, in stars a cubic light year (relative: the shape is what matters) */
  // the distance, as an angle, from a point to the nearest arm; and how strongly that arm is there
  function armField(M, R, th) {
    const T = M.T, A0 = T.arms; if (!A0 || R < .3) return 0;
    const Rk = R / KPC;
    if (A0.ring) { const d = (Rk - A0.ring) / A0.w; return Math.exp(-d * d / 2); }
    if (A0.clumps) return 0;
    const tp = Math.tan(A0.pitch * D2R); let best = 0;
    const one = (th0, r0, len, major) => {
      if (Rk < r0 * .85) return 0;
      const u = Math.log(Rk / r0) / tp;                                   // the arm's angle at this radius
      if (len && u > len * TAU) return 0;
      let d = ((th - th0 - u) % TAU + TAU * 1.5) % TAU - Math.PI;      // how far round from the arm
      const w = A0.w / Math.max(.6, Rk) * (major ? 1 : .8);               // its width, as an angle here
      const fade = Math.exp(-Math.max(0, Rk - T.Rmax * .8) / 1.5) * (1 - Math.exp(-(Rk - r0 * .85) / .6));
      // (a core and a wider skirt, as young stars and gas lie about an arm; brighter and dimmer along it)
      const along = .55 + .45 * Math.sin(u * 2.3 + th0 * 3) * Math.sin(u * .9 + th0) + .15 * Math.sin(u * 7.1 + th0 * 5);
      return (Math.exp(-d * d / (2 * w * w)) * .75 + Math.exp(-d * d / (8 * w * w)) * .25) * fade * (major ? 1 : .7) * along;
    };
    for (const a of M.arms) best = Math.max(best, one(a.th0, A0.r0, a.len, a.major || !(A0.major || []).length));
    if (M.spur) best = Math.max(best, .8 * one(M.spur.th0, M.spur.r0, M.spur.len, false));
    return best;
  }
  // each part's shape (kpc; not yet scaled), and its share of all the galaxy's stars [by stellar mass: the Milky Way's
  // bulge and bar some 30%, most of it the boxy bar itself and only a little a classical bulge; its discs most of the
  // rest, its stellar halo about 1%: Bland-Hawthorn and Gerhard 2016]
  const SHARE = { barred: { thin: .58, thick: .08, bar: .26, bulge: .06, halo: .015 }, spiral: { thin: .64, thick: .08, bulge: .26, halo: .02 }, flocculent: { thin: .75, thick: .12, bulge: .1, halo: .03 }, lenticular: { thin: .34, thick: .2, bulge: .44, halo: .02 }, elliptical: { bulge: .96, halo: .04 }, dwarf: { thin: .8, thick: .18, halo: .02 }, ring: { thin: .7, thick: .1, bulge: .18, halo: .02 } };
  const SHAPE = {
    // (a barred galaxy's disc thins inside the bar's reach: few young stars are born there [the Milky Way's inner disc])
    thin: (T, u, v, Rk, zk) => T.Rd ? Math.exp(-Rk / T.Rd - zk / T.hz) * (Rk > T.Rmax ? Math.exp(-(Rk - T.Rmax) / .8) : 1) * (T.bar ? 1 - .8 * Math.exp(-Math.pow(Rk / (T.bar.a * .75), 3)) : 1) : 0,
    thick: (T, u, v, Rk, zk) => T.thick ? Math.exp(-Rk / T.thick.Rd - zk / T.thick.hz) * (Rk > T.Rmax ? Math.exp(-(Rk - T.Rmax) / 1.2) : 1) : 0,
    // a boxy bar: it falls by e^3 at its half-length along, its half-width across, and its height; and it ends: beyond its
    // own length its stars fall away fast [a Gaussian cut-off past the bar's end, as Wegg, Gerhard and Portail 2015 fit it]
    bar: (T, u, v, Rk, zk) => { if (!T.bar) return 0; const m = Math.pow(Math.pow(Math.abs(u) / (T.bar.a / 3), 4) + Math.pow(Math.abs(v) / (T.bar.b / 3), 4), .25), e = Math.hypot(u / T.bar.a, v / (T.bar.b * 1.8)), cut = e > 1 ? Math.exp(-Math.pow((e - 1) / .25, 2)) : 1; return Math.exp(-m - zk / (T.bar.c / 3)) * cut; },
    // a bulge with de Vaucouleurs' fall [r^1/4], flattened
    bulge: (T, u, v, Rk, zk) => { if (!T.bulge) return 0; const m = Math.max(.02, Math.hypot(Rk, zk / (T.bulge.q || .8)) / T.bulge.a); return Math.exp(-7.67 * (Math.pow(m, .25) - 1)); },
    halo: (T, u, v, Rk, zk) => Math.pow(1 + Math.hypot(Rk, zk) / 1.5, -3.5) * (Math.hypot(Rk, zk) > 60 ? 0 : 1)
  };
  // each part scaled so its stars add up to its share (worked out once for each kind, on a grid over the galaxy)
  function norms(key) {
    const T = TYPES[key]; if (T._norm) return T._norm;
    const out = {}, L = Math.max(T.Rmax * 1.4, 25), n = 110, h = 2 * L / n, zs = [];
    for (let z = .005; z < 12; z *= 1.18) zs.push(z);
    for (const [k, f] of Object.entries(SHARE[key] || {})) {
      let sum = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x = -L + (i + .5) * h, y = -L + (j + .5) * h, Rk = Math.hypot(x, y), ca = T.bar ? Math.cos(-T.bar.angle * D2R) : 1, sa = T.bar ? Math.sin(-T.bar.angle * D2R) : 0, u = x * ca - y * sa, v = x * sa + y * ca;
        let col = 0, z0 = 0; for (const z of zs) { col += SHAPE[k](T, u, v, Rk, z) * (z - z0) * 2; z0 = z; }
        sum += col * h * h;
      }
      out[k] = sum > 0 ? f / sum : 0;
    }
    T._norm = out; return out;
  }
  // the stars of each part at a point (ly): the share of all the galaxy's stars in a cubic kiloparsec there
  function parts(M, x, y, z) {
    const T = M.T, N = norms(M.type), R = Math.hypot(x, y), Rk = R / KPC, zk = Math.abs(z || 0) / KPC, th = Math.atan2(y, x), out = { thin: 0, thick: 0, bulge: 0, halo: 0, arm: 0 };
    const ca = T.bar ? Math.cos(-T.bar.angle * D2R) : 1, sa = T.bar ? Math.sin(-T.bar.angle * D2R) : 0, u = (x * ca - y * sa) / KPC, v = (x * sa + y * ca) / KPC;
    out.thin = (N.thin || 0) * SHAPE.thin(T, u, v, Rk, zk);
    out.thick = (N.thick || 0) * SHAPE.thick(T, u, v, Rk, zk);
    out.bulge = (N.bar || 0) * SHAPE.bar(T, u, v, Rk, zk) + (N.bulge || 0) * SHAPE.bulge(T, u, v, Rk, zk);
    out.halo = (N.halo || 0) * SHAPE.halo(T, u, v, Rk, zk);
    out.arm = T.arms && (T.arms.n || T.arms.ring) ? armField(M, R, th) : 0;
    if (T.arms && T.arms.clumps) for (const c of M.clumps) { const d = Math.hypot(x / KPC - c.x, y / KPC - c.y); out.arm = Math.max(out.arm, c.s * Math.exp(-d * d / (2 * c.w * c.w))); }
    return out;
  }
  // all stars, old and young: an arm adds a little to the old (some 15%), much to the young
  function density(M, x, y, z) { const p = parts(M, x, y, z), A0 = M.T.arms; return p.thin * (1 + (A0 ? (A0.old || 0) : 0) * p.arm) + p.thick + p.bulge + p.halo; }
  function youngDensity(M, x, y, z) { const p = parts(M, x, y, z), A0 = M.T.arms; return p.thin * (A0 ? .05 + (A0.young || 0) * p.arm : .2); }
  // the column of stars through the galaxy at (x, y), seen from above, by part (for its picture): the discs exactly,
  // the bar, bulge and halo summed up through z
  function column(M, x, y) {
    const T = M.T, N = norms(M.type), Rk = Math.hypot(x, y) / KPC, out = { thin: 0, thick: 0, bulge: 0, halo: 0 };
    if (T.Rd) out.thin = (N.thin || 0) * Math.exp(-Rk / T.Rd) * (Rk > T.Rmax ? Math.exp(-(Rk - T.Rmax) / .8) : 1) * (T.bar ? 1 - .8 * Math.exp(-Math.pow(Rk / (T.bar.a * .75), 3)) : 1) * 2 * T.hz;
    if (T.thick) out.thick = (N.thick || 0) * Math.exp(-Rk / T.thick.Rd) * (Rk > T.Rmax ? Math.exp(-(Rk - T.Rmax) / 1.2) : 1) * 2 * T.thick.hz;
    if (T.bar || T.bulge || T.halo) {
      const ca = T.bar ? Math.cos(-T.bar.angle * D2R) : 1, sa = T.bar ? Math.sin(-T.bar.angle * D2R) : 0, u = (x * ca - y * sa) / KPC, v = (x * sa + y * ca) / KPC;
      let b = 0, hl = 0, z0 = 0; for (let z = .01; z < (T.Rd ? 24 : 90); z *= 1.3) { const dz = (z - z0) * 2; b += ((N.bar || 0) * SHAPE.bar(T, u, v, Rk, z) + (N.bulge || 0) * SHAPE.bulge(T, u, v, Rk, z)) * dz; hl += (N.halo || 0) * SHAPE.halo(T, u, v, Rk, z) * dz; z0 = z; }
      out.bulge = b; out.halo = hl;
    }
    return out;
  }

  /* ---- how fast it turns: the circular speed from the mass of each part */
  // modified Bessel functions (Abramowitz and Stegun 9.8), for the speed round an exponential disc (Freeman 1970)
  function bI0(x) { const t = x / 3.75; if (x < 3.75) { const y = t * t; return 1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (.2659732 + y * (.0360768 + y * .0045813))))); } const y = 1 / t; return Math.exp(x) / Math.sqrt(x) * (.39894228 + y * (.01328592 + y * (.00225319 + y * (-.00157565 + y * (.00916281 + y * (-.02057706 + y * (.02635537 + y * (-.01647633 + y * .00392377)))))))); }
  function bI1(x) { const t = x / 3.75; if (x < 3.75) { const y = t * t; return x * (.5 + y * (.87890594 + y * (.51498869 + y * (.15084934 + y * (.02658733 + y * (.00301532 + y * .00032411)))))); } const y = 1 / t; return Math.exp(x) / Math.sqrt(x) * (.39894228 + y * (-.03988024 + y * (-.00362018 + y * (.00163801 + y * (-.01031555 + y * (.02282967 + y * (-.02895312 + y * (.01787654 - y * .00420059)))))))); }
  function bK0(x) { if (x <= 2) { const y = x * x / 4; return -Math.log(x / 2) * bI0(x) + (-.57721566 + y * (.4227842 + y * (.23069756 + y * (.0348859 + y * (.00262698 + y * (.0001075 + y * .0000074)))))); } const y = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + y * (-.07832358 + y * (.02189568 + y * (-.01062446 + y * (.00587872 + y * (-.0025154 + y * .00053208)))))); }
  function bK1(x) { if (x <= 2) { const y = x * x / 4; return Math.log(x / 2) * bI1(x) + (1 / x) * (1 + y * (.15443144 + y * (-.67278579 + y * (-.18156897 + y * (-.01919402 + y * (-.00110404 - y * .00004686)))))); } const y = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + y * (.23498619 + y * (-.0365562 + y * (.01504268 + y * (-.00780353 + y * (.00325614 - y * .00068245)))))); }
  // the circular speed at R (kpc), and each part's share of it (km/s)
  function vparts(M, Rk) {
    const T = M.T, R = Math.max(1e-4, Rk), out = {};
    // the bulge and bar, as one round Hernquist sphere
    const Mb = T.Mb || 0, ab = T.bulge ? T.bulge.a * .8 : .6; out.bulge = Mb ? Math.sqrt(GRAV * Mb * R / Math.pow(R + ab, 2)) : 0;
    // the discs: the thin and the thick together as one exponential disc
    if (T.Md && T.Rd) { const y = R / (2 * T.Rd), S0 = T.Md / (TAU * T.Rd * T.Rd); out.disc = Math.sqrt(Math.max(0, 4 * Math.PI * GRAV * S0 * T.Rd * y * y * (bI0(y) * bK0(y) - bI1(y) * bK1(y)))); } else out.disc = 0;
    // the dark-matter halo (NFW), its concentration from its mass
    const H = T.halo2, c = 10 * Math.pow(H.Mvir / 1e12, -.1), rv = H.rs * c, mu = x => Math.log(1 + x) - x / (1 + x), Mh = H.Mvir * mu(R / H.rs) / mu(c); out.halo = Math.sqrt(GRAV * Mh / R); void rv;
    out.bh = T.bh ? Math.sqrt(GRAV * T.bh.mass / R) : 0;
    out.total = Math.sqrt(out.bulge * out.bulge + out.disc * out.disc + out.halo * out.halo + out.bh * out.bh);
    return out;
  }
  const vcirc = (M, Rk) => vparts(M, Rk).total;
  // the time once round at R, in millions of years; the angular speed in radians a million years
  const omega = (M, Rk) => vcirc(M, Rk) / Math.max(.05, Rk) * KMS_KPC_PER_MYR;
  const period = (M, Rk) => TAU / omega(M, Rk);
  // the epicyclic frequency: how fast a disc star weaves in and out about its guiding circle
  function kappa(M, Rk) { const h = .02, o = omega(M, Rk), d = (Math.pow(omega(M, Rk + h), 2) - Math.pow(omega(M, Math.max(.05, Rk - h)), 2)) / (2 * h); return Math.sqrt(Math.max(1e-9, Rk * d + 4 * o * o)); }
  // where the black hole's own pull is the stronger: the mass of the stars within r equals its own (about 2 pc for ours)
  // (where the stars within r weigh twice the black hole: the nuclear star cluster, some 2.5e7 Suns within 4 pc for ours
  // [Schödel and others 2014], scaled with the black hole; about 5 light years for Sagittarius A*)
  function influence(M) { if (!M.T.bh) return 0; const bh = M.T.bh.mass, Mc = 2.5e7 * Math.pow(bh / 4.3e6, .8); let r = .00002; while (r < .5) { const Mst = Mc * Math.pow(r / .004, 1.2); if (Mst > 2 * bh) break; r *= 1.03; } return r * KPC; }

  /* ---- the stars: masses by the initial mass function, ages and metals by where they are, what each has become */
  const KROUPA = [[.013, .08, .3], [.08, .5, 1.3], [.5, 150, 2.3]];
  function imfSample(r) {
    // the share of each piece, its number integrated (continuous at the joins)
    // (the brown dwarfs a population of their own, not the stars' law carried on down: about one for every four or five
    // stars [Thies and Kroupa 2007; Kirkpatrick and others 2021, the census within 20 parsecs], so their piece is scaled)
    if (!imfSample.w) { const k = [1, 0, 0]; k[1] = k[0] * Math.pow(.08, -.3) / Math.pow(.08, -1.3); k[2] = k[1] * Math.pow(.5, -1.3) / Math.pow(.5, -2.3); const n = KROUPA.map(([a, b, al], i) => k[i] * (Math.pow(b, 1 - al) - Math.pow(a, 1 - al)) / (1 - al)); n[0] *= .5; const t = n.reduce((s, v) => s + v, 0); imfSample.w = n.map(v => v / t); }
    let u = r(), i = 0; while (i < 2 && u > imfSample.w[i]) { u -= imfSample.w[i]; i++; }
    const [a, b, al] = KROUPA[i], e = 1 - al, v = r();
    return Math.pow(Math.pow(a, e) + v * (Math.pow(b, e) - Math.pow(a, e)), 1 / e);
  }
  const msLife = m => 10000 * Math.pow(m, -2.5);              // Myr on the main sequence
  // a star of mass m and age (Myr): what it is now
  function become(m, age) {
    // (a brown dwarf never stops cooling: its warmth by its mass and age [Burrows and others 2001: about 1,550 K times
    // (M / 0.05 Suns)^0.83 times (age / 1 Gyr)^-0.32]; warm L above about 1,300 K, cool T, the coldest Y below 500 K)
    if (m < .08) { const T = 1550 * Math.pow(m / .05, .83) * Math.pow(Math.max(.01, age / 1000), -.32); return { cls: T > 1300 ? "L" : T > 500 ? "T" : "Y", mass: m, teff: Math.round(T) }; }
    const life = msLife(m);
    if (age < life) return { cls: m >= 16 ? "O" : m >= 2.1 ? "B" : m >= 1.4 ? "A" : m >= 1.04 ? "F" : m >= .8 ? "G" : m >= .45 ? "K" : "M", mass: m };
    if (age < life * 1.12) return { cls: "R", mass: m * .9, giant: true };
    if (m < 8) return { cls: "D", mass: clamp(.5 + .1 * (m - 1), .5, 1.3) };
    if (m < 22) return { cls: "N", mass: 1.4 };
    return { cls: "X", mass: m * .3 };
  }
  // each part's stars: how old, how rich in metals
  function populationAt(M, x, y, z, r) {
    const p = parts(M, x, y, z), A0 = M.T.arms, young = p.thin * (A0 ? (A0.young || 0) * p.arm : 0) * .08;
    const tot = p.thin + p.thick + p.bulge + p.halo + young, u = r() * tot, Rk = Math.hypot(x, y) / KPC;
    let pop = "thin", age, feh;
    if (u < young) { pop = "young"; age = r() * 200; }
    else if (u < young + p.thin) { pop = "thin"; age = r() * 10000; }
    else if (u < young + p.thin + p.thick) { pop = "thick"; age = 8000 + r() * 3000; }
    else if (u < young + p.thin + p.thick + p.bulge) { pop = "bulge"; age = 7000 + r() * 5500; }
    else { pop = "halo"; age = 11000 + r() * 2000; }
    if (pop === "halo") feh = -1.6 + gauss(r) * .5;
    else if (pop === "bulge") feh = gauss(r) * .4;
    else if (pop === "thick") feh = -.5 + gauss(r) * .25;
    else feh = clamp(.0 - .06 * (Rk - 8.2) - age / 10000 * .25, -1, .5) + gauss(r) * .15;
    return { pop, age, feh: Math.round(clamp(feh, -3, .6) * 100) / 100 };
  }
  // a companion: how often, by the star's mass (Offner and others 2023), how far (log-normal, wider for Sun-like stars)
  function companionOf(m, r) {
    const f = m < .1 ? .2 : m < .5 ? .27 : m < 1.5 ? .46 : m < 5 ? .6 : m < 16 ? .8 : .92;
    if (r() >= f) return null;
    const q = .1 + r() * .9, mu = m < .5 ? 1.3 : m < 1.5 ? 1.7 : .7, a = Math.pow(10, mu + gauss(r) * (m < 1.5 ? 1.4 : 1)), e = a < .1 ? 0 : clamp(Math.sqrt(r()) * .8, 0, .95);
    return { mass: m * q, a: Math.round(clamp(a, .02, 20000) * 1000) / 1000, e: Math.round(e * 100) / 100 };
  }

  /* ---- the black hole's panel: what it is, what is round it, how active, the dangers */
  function blackHole(M) {
    const bh = M.bh; if (!bh) return null;
    const m = bh.mass, rs_km = 2.953 * m, rinf = influence(M), active = bh.active || 0;
    // S2: the best known star round ours, 16 years, 120 AU at its closest [GRAVITY]: its orbit scaled to this black hole
    const S2 = { a_AU: 1031 * Math.pow(m / 4.3e6, 1 / 3), e: .884, years: 16.05 }, peri = S2.a_AU * (1 - S2.e), vperi = Math.sqrt(GRAV * m * 2.06265e8 / 4.848e-9 * (1 + S2.e) / ((1 - S2.e) * S2.a_AU)) * 0;
    void vperi;
    const tidalSunAU = 6.96e5 * Math.pow(m, 1 / 3) / 1.496e8;
    return {
      name: bh.name, mass: m, horizon_km: rs_km, horizonSuns: rs_km * 2 / 1.392e6, influence_ly: rinf,
      active, state: active > .5 ? "An active nucleus: a bright disc of falling gas and jets out of the poles, outshining the stars round it" : active > .05 ? "Feeding now and then: a faint disc, flares" : "Quiet: it shines at about a billionth of what it could, and flares a little most days",
      around: [`The densest crowd of stars in the galaxy: millions of times denser than near the Sun`, `A few stars whip round it in years: the closest known comes within ${Math.round(peri)} times the Earth's distance from the Sun, at nearly 3% of the speed of light, and goes round in ${S2.years} years`, `Within about ${Math.round(rinf * 10) / 10} light years its pull is the stronger; beyond, the galaxy's own stars, gas and dark matter outweigh it`],
      dangers: [`Hard radiation and flares${active > .5 ? ", and the jets' beams" : ""}`, `Stars torn apart that come within about ${Math.round(tidalSunAU * 10) / 10} times the Earth's distance from the Sun`, "The wreckage of dead stars, and clouds of gas falling in", "Clocks running slow close in: time goes slower near it"],
      S2
    };
  }

  /* ---- the time-lapse: stars moving round the centre at the speed the galaxy's mass gives them (not a turning wheel),
          weaving in and out and bobbing through the plane; the arms a pattern they pass through, lit by the young stars
          born in it, who drift away from it as they age */
  function particles(M, n, seed) {
    const r = rng((seed || "tl") + "|particles"), out = [], T = M.T, A0 = T.arms;
    for (let i = 0; i < n; i++) {
      const young = A0 && (A0.n || A0.ring) && r() < .35;
      // the old: drawn from the discs and the bulge by their mass; the young: born on an arm
      let Rk, th;
      if (T.Rd) { Rk = -T.Rd * Math.log(1 - r() * .98) * (young ? 1.05 : 1); if (!young && r() < .18 && (T.bar || T.bulge)) Rk = Math.abs(gauss(r)) * (T.bar ? T.bar.a * .5 : T.bulge.a); }
      else Rk = Math.abs(gauss(r)) * (T.bulge ? T.bulge.a * 1.5 : 3);
      Rk = Math.min(Rk, T.Rmax * 1.05); th = r() * TAU;
      const age0 = young ? r() * 160 : 0, e = young ? .03 : clamp(.04 + Math.abs(gauss(r)) * .08, 0, .4), ph = r() * TAU, zph = r() * TAU, z0 = (young ? .05 : T.hz * (.5 + r())) * KPC * Math.abs(gauss(r)) * .7;
      out.push({ Rk, th, young, age0, e, ph, zph, z0, k: kappa(M, Math.max(.3, Rk)), o: omega(M, Math.max(.05, Rk)), bulge: !T.Rd || (T.bulge && Rk < (T.bulge.a || 1) * .8) });
    }
    return out;
  }
  // where a particle is at time t (Myr); a young one is re-born on its arm every 160 Myr
  function particleAt(M, p, t) {
    const A0 = M.T.arms;
    if (p.young && A0) {
      const age = ((p.age0 + t) % 160 + 160) % 160, tb = t - age, Op = (A0.omega || 22) * KMS_KPC_PER_MYR;
      // its birth: on an arm (the pattern then), at its radius
      const arm = M.arms.length ? M.arms[Math.floor(p.ph / TAU * M.arms.length) % M.arms.length] : null;
      let th0 = p.th;
      if (arm && A0.pitch) th0 = arm.th0 + Math.log(Math.max(A0.r0, p.Rk) / A0.r0) / Math.tan(A0.pitch * D2R) + Op * tb + (p.zph - Math.PI) * .03;
      const th = th0 + p.o * age, R = p.Rk * (1 + p.e * Math.cos(p.k * age + p.ph));
      return { x: R * KPC * Math.cos(th), y: R * KPC * Math.sin(th), z: p.z0 * Math.cos(p.zph + age * .06), age, young: true };
    }
    const th = p.th + p.o * t, R = p.Rk * (1 + p.e * Math.cos(p.k * t + p.ph));
    return { x: R * KPC * Math.cos(th), y: R * KPC * Math.sin(th), z: p.z0 * Math.cos(p.zph + t * .05), young: false };
  }
  // the bar and the arms' pattern turned by time t (radians), for the time-lapse's drawing
  const patternAngle = (M, t, which) => ((which === "bar" ? (M.T.bar ? M.T.bar.omega : 0) : (M.T.arms ? M.T.arms.omega || 0 : 0)) * KMS_KPC_PER_MYR) * t;

  /* ---- a campaign's chart set in its galaxy: where its middle stands, how many light years a chart unit is */
  // (model 1: the chart as grown, its middle at the Sun-like place; model 2: its own frame from its scope)
  function frameOf(G, M) {
    const p = (G && G.p) || {}, ly = (G && G.ly) || .1, at = p.at && Number.isFinite(+p.at.x) ? { x: +p.at.x, y: +p.at.y, z: +p.at.z || 0 } : null;
    if (p.scope === "galaxy") return { x: 0, y: 0, z: 0, k: ly, whole: true };
    const o = at || M.sun;
    return { x: o.x, y: o.y, z: o.z || 0, k: ly };
  }
  const toGalaxy = (F, s) => ({ x: F.x + (s.x - 500) * F.k, y: F.y + (s.y - 500) * F.k, z: F.z + (s.z || 0) });
  const toChart = (F, g) => ({ x: 500 + (g.x - F.x) / F.k, y: 500 + (g.y - F.y) / F.k });
  // which arm or part of the galaxy a point is in, in words (the regions' natural names)
  function whereIs(M, x, y, z) {
    const R = Math.hypot(x, y), Rk = R / KPC, th = Math.atan2(y, x), p = parts(M, x, y, z || 0);
    if (M.T.bh && R < 30) return { kind: "core", name: "the black hole's own reach" };
    if ((p.bulge > p.thin * 2 && Rk < 4) || (M.T.bar && Rk < M.T.bar.a * .9 && p.bulge > p.thin)) return { kind: "bulge", name: M.T.bar ? "the bar and the bulge" : "the bulge" };
    if (Rk > M.T.Rmax || Math.abs(z || 0) > 3 * KPC) return { kind: "halo", name: "the halo" };
    let best = null, bv = .3;
    if (M.T.arms && M.T.arms.n) { const tp = Math.tan(M.T.arms.pitch * D2R); for (const a of M.arms) { const u = Math.log(Math.max(.1, Rk) / M.T.arms.r0) / tp, d = Math.abs(((th - a.th0 - u) % TAU + TAU * 1.5) % TAU - Math.PI), w = M.T.arms.w / Math.max(.6, Rk), v = Math.exp(-d * d / (2 * w * w)); if (v > bv) { bv = v; best = a; } } }
    if (M.spur) { const tp = Math.tan(M.T.arms.pitch * D2R), u = Math.log(Math.max(.1, Rk) / M.spur.r0) / tp, d = Math.abs(((th - M.spur.th0 - u) % TAU + TAU * 1.5) % TAU - Math.PI); if (u >= 0 && u < M.spur.len * TAU && d < .25) return { kind: "spur", name: M.spur.name }; }
    return best ? { kind: "arm", name: best.name, arm: best.k } : { kind: "disc", name: Rk < 6 ? "the inner disc" : Rk < 11 ? "the disc between the arms" : "the outer disc" };
  }

  A.galaxyModel = { KPC, TYPES, TYPE_LIST, SHARE, galaxyOf, parts, density, youngDensity, column, norms, armField, vparts, vcirc, omega, period, kappa, influence, imfSample, msLife, become, populationAt, companionOf, blackHole, particles, particleAt, patternAngle, frameOf, toGalaxy, toChart, whereIs, rng, hash, gauss, KMS_KPC_PER_MYR };
})(typeof ATLAS !== "undefined" ? ATLAS : (typeof module !== "undefined" ? module.exports : this));
