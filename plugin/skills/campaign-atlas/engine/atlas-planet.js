/* Campaign Atlas: the planetary layer (the user's request of 3 Nov 2026, "scientifically grounded sci-fi planet
   generation"; the plan approved with their answers in the workspace's reviews/2026-11-03-planets.md: Balanced realism
   by default, every galaxy upgraded, the whole globe made when a planet is first opened). Plain code, as the galaxy's:
   the page and atlas.js both run it.
   Each planet is worked out in order, each step from the ones before, never chosen and then explained:
     the star -> the system (the frost line, the disc, the orbits) -> the body (mass, make-up, radius; gravity, escape
     velocity and density computed) -> its spin (day, tilt, tidal locking) -> its insides (heat, tectonic mode, field) ->
     its air (kept or lost by the cosmic shoreline; made of its history) -> its warmth (equilibrium, greenhouse, day and
     night, equator and pole) -> its liquids -> its winds -> radiation -> life -> what kind of world it is (read from all
     the rest) -> habitable and landable (two things) -> moons and rings -> colours -> a consistency check.
   [the research, with its sources, is in that plan, section 2: Kopparapu 2013 (the habitable zone by flux), Chen &
   Kipping 2017 (mass and radius), Zahnle & Catling 2017 (the cosmic shoreline), Leconte 2015 (thermal tides and spin),
   Showman et al. 2013 (circulation by rotation), Agol 2021 (one rocky make-up per system), Kiang 2007 and Lehmer 2021
   (pigments by starlight), the stagnant-lid reviews, NASA's fact sheets]
   Units: Earth masses and radii, AU, years, kelvin, bar; g in Earth gravities. */
(function (A) {
  "use strict";
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100, sig = (v, n) => v === 0 ? 0 : +v.toPrecision(n || 3);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---- the stars: [colour, luminosity, mass, temperature K, lifetime Gyr, flares 0..1] (main sequence; white dwarfs,
          neutron stars and black holes keep few planets, and those strange) */
  const STAR = { O: ["#9bb0ff", 30000, 16, 35000, .01, .1], B: ["#aabfff", 800, 6, 15000, .1, .1], A: ["#cad7ff", 20, 2, 8500, 1.2, .1], F: ["#f8f7ff", 3, 1.3, 6700, 4, .2], G: ["#fff4ea", 1, 1, 5770, 10, .25], K: ["#ffd2a1", .3, .75, 4500, 20, .45], M: ["#ffad74", .04, .35, 3200, 100, .9], D: ["#e8eaff", .01, .6, 10000, 50, 0], N: ["#c7d2ff", .001, 1.4, 600000, 50, 1], X: ["#401a5a", 0, 10, 0, 50, 1] };
  function star(cls, r) {
    const s = STAR[cls] || STAR.G, v = .75 + r() * .5;
    const mass = s[2] * (cls === "D" || cls === "N" || cls === "X" ? 1 : v), L = cls === "D" || cls === "N" || cls === "X" ? s[1] : s[1] * Math.pow(v, 4);
    const age = clamp(r() * Math.min(12, s[4] * .85), .3, 12);
    return { cls, color: s[0], lum: sig(L), mass: r2(mass), teff: Math.round(s[3] * Math.pow(v, .5)), age: r1(age), flares: s[5] * (cls === "M" ? clamp(1.6 - age / 5, .5, 1.6) : 1), metal: r2(-.5 + r() * .8) };
  }
  // light a star gives at a distance, Earth's at 1 AU from the Sun = 1
  const flux = (S, a) => S.lum / (a * a);
  // a world's brightness under its air: 0.3 as the Earth's, more under thick carbon dioxide, which scatters light away
  // [Rayleigh scattering: what sets the habitable zone's outer edge, Kasting 1993, Kopparapu 2013]
  const albCO2 = c => .3 + .3 * (1 - Math.exp(-c / 10));

  /* ---- the body: radius from mass and make-up [Chen & Kipping: rocky R ~ M^0.28 up to ~2 Earth masses; with a
          hydrogen envelope R ~ M^0.59; giants about Jupiter's size whatever their mass] */
  function radiusOf(M, fe, wf, env) {
    if (env === "gas") return M < 95 ? clamp(4 + 7.2 * Math.pow((M - 15) / 80, .5), 4, 11.5) : 11.2 * Math.pow(M / 318, -.04);
    if (env === "ice") return clamp(3.5 + (M - 10) * .05, 3.2, 5);
    if (env === "mini") return clamp(1.8 + Math.pow(M, .59) * .45, 1.9, 3.8);
    const rock = Math.pow(M, .27) * (1 + .3 * (.33 - fe));
    return rock * (1 + .9 * Math.min(.5, wf));
  }
  const G_SI = 6.674e-11, ME = 5.972e24, RE = 6.371e6, AU = 1.496e11, MSUN = 1.989e30, YR = 3.156e7;
  // the time a planet takes to turn one face to its star for good [Gladman et al. 1996: t ~ w a^6 I Q / (3 G M*^2 k2 R^5)]
  const lockYears = (a, M, R, Ms) => .4 * (2 * Math.PI / 43200) * Math.pow(a * AU, 6) * (M * ME) * 100 / (3 * G_SI * Math.pow(Ms * MSUN, 2) * .3 * Math.pow(R * RE, 3)) / YR;
  // water boils at a pressure [Clausius-Clapeyron, from 373 K at 1 bar]
  const boilK = P => P <= .006 ? 273 : 1 / (1 / 373.15 - 2.045e-4 * Math.log(P));

  /* ---- one body: a planet (or a moon: host given), from its star, orbit, mass and make-up */
  function body(S, o, r, opt) {
    opt = opt || {};
    const real = opt.realism || "balanced", a = o.a, M = o.mass, ecc = o.ecc || 0, host = o.host || null;
    const env = o.env || (M > 50 ? "gas" : M > 9 && o.cold ? "ice" : o.mini ? "mini" : "rock");
    const giant = env === "gas" || env === "ice" || env === "mini";
    const fe = o.fe != null ? o.fe : .3, wf = o.wf || 0, R = radiusOf(M, fe, wf, env);
    const g = M / (R * R), vesc = 11.19 * Math.sqrt(M / R), rho = 5.51 * M / Math.pow(R, 3);
    const P_yr = host ? o.period : Math.sqrt(Math.pow(a, 3) / S.mass), I = host ? flux(S, host.a) : flux(S, a);
    const out = { mass: sig(M), radius: r2(R), gravity: r2(g), vesc: r1(vesc), density: r2(rho), a: sig(a, 3), ecc: r2(ecc), year: host ? null : sig(P_yr, 3), insolation: sig(I, 3), env, why: {} };
    const why = out.why;
    why.gravity = `${r2(M)} Earth masses in a radius of ${r2(R)} Earth's: gravity ${r2(g)} g, ${giant ? "at the cloud tops" : "at the ground"}`;

    /* its spin: locked to its star (or its planet, for a moon), slowed, or turning freely; tilt; seasons */
    let lock = false, dayH, spin;
    if (host) { lock = true; dayH = o.period * 365.25 * 24; spin = `turns once each orbit, one face always to ${host.name || "its planet"} [tides]`; }
    else {
      const tl = lockYears(a, M, R, S.mass);
      if (giant) { dayH = env === "gas" ? 9 + r() * 8 : 14 + r() * 6; spin = "turns fast, as giants keep their spin"; }
      else if (tl < S.age * 1e9) {
        // [Leconte 2015: an atmosphere's thermal tides can hold a planet off locking around stars above ~0.6 suns]
        if (S.mass > .6 && o.thick) { dayH = (20 + r() * 200) * 24; spin = "slowed by its star's tides almost to locking, held off by its thick air's own tides: days last weeks or months"; }
        else { lock = true; dayH = P_yr * 365.25 * 24; spin = "tidally locked: one side always faces its star"; }
      } else if (tl < S.age * 1e9 * 30) { dayH = (2 + r() * 40) * 24; spin = "slowed by its star's tides to days lasting days"; }
      else { dayH = 10 + r() * 30; spin = "turns freely, as it formed"; }
    }
    const tilt = lock ? r() * 3 : giant && r() < .1 ? 60 + r() * 40 : clamp(Math.abs((r() + r() + r() - 1.5) * 30), 0, 70);
    Object.assign(out, { day: sig(dayH, 3), locked: lock, tilt: Math.round(tilt) }); why.spin = spin;

    /* the giants: air, warmth and look of their own; no surface */
    if (giant) {
      const teq = 278.6 * Math.pow(I, .25) * Math.pow(1 - .35, .25);
      const clouds = teq > 1400 ? "iron and silicate clouds, dark" : teq > 900 ? "silicate haze" : teq > 350 ? "water and alkali clouds" : teq > 150 ? "ammonia clouds over water clouds" : "methane haze over ammonia ice";
      Object.assign(out, { kind: env === "gas" ? (a < .1 && !host ? "hotjupiter" : "gas") : env === "ice" ? "icegiant" : "mini", air: env === "mini" ? "A deep envelope of hydrogen and helium over water and rock" : `Hydrogen and helium; ${clouds}`, pressure: null, temp: Math.round(teq), tempC: Math.round(teq - 273), surface: "none", water: "", field: env === "mini" ? "unknown" : "strong, with radiation belts", geo: "no surface: banded clouds and storms over deeper layers" });
      const jets = clamp(Math.round(6 * (24 / dayH) * Math.sqrt(R / 11)), 2, 20);
      out.winds = { regime: `${jets} jets each side of its equator, banded storms [fast rotation, great size]`, typical: Math.round(60 + r() * 100), extreme: Math.round(300 + r() * 1500), storms: env === "gas" && r() < .6 ? "a great long-lived storm, larger than whole planets" : "storms that come and go in its bands" };
      why.class = env === "gas" ? (a < .1 ? "a giant that moved in close to its star after it formed, its air puffed up by the heat" : "a gas giant: it grew beyond the frost line, where ice let a core grow fast enough to gather the disc's gas") : env === "ice" ? "an ice giant: a core of rock and ice with a thinner envelope, grown where the disc was thin" : "a mini-Neptune: too big to lose the hydrogen it caught [the radius gap between super-Earths and mini-Neptunes]";
      out.radiation = env === "gas" ? "lethal near it, in its radiation belts" : "high near it";
      out.landing = "none: no surface to land on";
      out.habitable = "Not landable"; out.landable = false; out.hab = "Uninhabitable"; out.land = "Impossible: no surface";
      out.life = ""; out.lifeWhy = "no surface, and no ocean known: life is not expected (speculation could place it in the clouds)";
      out.palette = gasPalette(teq, env, dayH, r);
      return finish(out, S, opt);
    }

    /* its insides: heat (size, age, tides), its tectonic mode, its magnetic field */
    const tidal = o.tidal || 0;
    const heat = Math.pow(M, .5) * Math.exp(-S.age / 4) * 1.6 + tidal;
    // (too much light and its oceans boiled away early [the runaway greenhouse, Kopparapu 2013: ~1.05 times Earth's flux]:
    // dry inside as well, so no plates)
    const vesc0 = vesc, shore0 = I / Math.pow(vesc0 / 11.19, 4);
    const runaway = I > 1.06 * (M < .5 ? .9 : 1) && wf > .00002 && shore0 < 25;
    const wet = wf > .00005 && !runaway;
    let mode, modeWhy;
    if (tidal > 1.5) { mode = "tidal"; modeWhy = "squeezed and stretched by its planet's tides each orbit, its insides kept molten [Io]"; }
    else if (wf > .05) { mode = heat > .3 ? "iceshell" : "frozen"; modeWhy = heat > .3 ? "a shell of ice over a hidden ocean, kept liquid by its inner warmth [Europa, Enceladus]" : "a frozen crust of ice and rock, long cold [Callisto]"; }
    else if (M < .2) { mode = "stagnant"; modeWhy = "too small to keep the heat that moves plates: one rigid shell, its volcanoes long cold [the Moon, Mercury, Mars]"; }
    else if (wet && M <= 6 && heat > .35) { mode = "plates"; modeWhy = "water weakens its rock, and enough heat moves it: plates that sink, mountain ranges where they meet [Earth]"; }
    else if (heat > .4) { mode = "squishy"; modeWhy = "hot inside but too dry for plates: a thick lid broken by vast volcanic plains and rifts [Venus]"; }
    else { mode = "stagnant"; modeWhy = "a single rigid lid, great shield volcanoes and old impact basins [Mars]"; }
    // (the game master's own choices, o.force, from the star chart's planet editor: what they set is taken as given, and
    // everything after it is worked out from it as before)
    const F = o.force || {};
    if (F.tect && F.tect !== mode) { mode = F.tect; modeWhy = `set by the game master: ${{ plates: "moving plates", squishy: "a thick, broken lid", stagnant: "one rigid lid", tidal: "heated by tides", iceshell: "an ice shell over an ocean", frozen: "frozen through" }[mode] || mode}`; }
    const field = M < .3 || (mode === "stagnant" && S.age > 2) ? (M > .03 && mode === "tidal" ? "weak, induced" : "none") : dayH > 24 * 50 ? "none or weak (it turns too slowly)" : mode === "plates" ? "strong (a convecting iron core)" : "weak";
    Object.assign(out, { tectonics: mode, heat: r2(heat), field }); why.tectonics = modeWhy;

    /* its air: kept or lost [the cosmic shoreline: insolation against escape velocity to the fourth power], then made */
    const shore = I / Math.pow(vesc / 11.19, 4) * (S.flares > .5 && I > .3 ? 1 + S.flares * 3 : 1);
    // (beyond the line, steeply less; a small world with no field near its star loses more to the stellar wind [Mars])
    let keep = shore < 6 ? 1 : shore < 40 ? Math.pow(6 / shore, 6) * (field === "none" && M < .3 && I > .1 ? .1 : 1) * (o.belts ? .05 : 1) : 0;
    let airWhy = shore < 6 ? "it is big enough and cool enough to keep an atmosphere" : shore < 40 ? "it keeps only a thin atmosphere: small or warm enough to lose most of it" : "too small or too hot to keep any atmosphere [the cosmic shoreline]";
    const teq0 = 278.6 * Math.pow(I, .25) * Math.pow(1 - .3, .25);
    // what its rock and water breathe out over its life: carbon dioxide and nitrogen, more for a bigger, more active world
    const out_co2 = (60 + r() * 80) * Math.pow(M, 1.2) * (mode === "stagnant" && M < .5 ? .5 : 1), out_n2 = (wf > .05 ? 40 + r() * 40 : .6 + r() * 1.6) * M;
    let co2 = out_co2 * keep, n2 = out_n2 * keep, o2 = 0, ch4 = 0, h2o = 0, so2 = 0, liquid = "none", oceanCover = 0, iceCover = 0;
    // the runaway greenhouse: too much light and its water boils away and its hydrogen is lost [Kopparapu 2013, ~1.05
    // Earth's flux for an Earth-sized world, a little less for a smaller one]
    let water = wf;
    if (runaway) { water = 0; airWhy += "; it was close enough to its star for its oceans to boil and their hydrogen to escape, leaving its carbon dioxide in the air [the runaway greenhouse: Venus]"; so2 = mode !== "stagnant" ? .01 * co2 : 0; }
    // where water stands liquid and plates move, rain draws carbon dioxide into rock until the world is mild [the
    // carbonate-silicate cycle]: the thermostat
    const mayHaveSeas = water > .00002 && teq0 > 180 && teq0 < 330 && keep > .3;
    // (the carbon dioxide that brings it to about 288 K, its own pressure's warming counted: found by halving, as the
    // greenhouse grows with both the gas and the pressure it adds [beyond about 1.7 AU from the Sun no amount suffices:
    // the outer edge of the habitable zone, Kopparapu 2013])
    // (thick carbon dioxide also scatters sunlight away, so past some amount more of it cools: the most it can warm is
    // the "maximum greenhouse", and a world beyond that is too far out for any amount to keep it mild)
    if (mayHaveSeas && mode === "plates") {
      const f = c => .9 * Math.pow(c, .45) + .035 * Math.pow(c + n2, 1.8) + .77 - (Math.pow(288 / (278.6 * Math.pow(I, .25) * Math.pow(1 - albCO2(c), .25)), 4) - 1) / .75;
      let best = .0002, bf = f(best); for (let k = 1; k <= 40; k++) { const c = .0002 * Math.pow(5e4, k / 40), v = f(c); if (v > bf) { bf = v; best = c; } }
      let c = best; if (f(.0002) >= 0) c = .0002; else if (bf >= 0) { let lo = .0002, hi = best; for (let k = 0; k < 40; k++) { const mid = Math.sqrt(lo * hi); if (f(mid) < 0) lo = mid; else hi = mid; } c = hi; }
      co2 = c * keep; airWhy += bf >= 0 ? "; rain draws its carbon dioxide into rock, holding it mild [the carbonate-silicate cycle]" : "; too far from its star for even a thick blanket of carbon dioxide to keep it mild [beyond the habitable zone's outer edge]";
    }
    else if (mayHaveSeas) co2 = Math.min(co2, 2 + r() * 4);
    if (teq0 < 140 && keep > .3) { ch4 = .03 + r() * .06; co2 = Math.min(co2, .001); airWhy += "; so cold its carbon dioxide froze out, leaving nitrogen and methane [Titan]"; }
    if (teq0 < 60) { co2 = 0; n2 = Math.min(n2, .00002); ch4 = 0; airWhy = "so cold its air froze onto the ground, but for a trace [Pluto]"; keep = Math.min(keep, .00002); }
    let P = co2 + n2 + ch4 + so2;
    // (the air the game master gave it: its pressure, and its main gas if they chose one; the rest follows from it)
    if (F.pressure != null && F.pressure >= 0) {
      const want = +F.pressure;
      if (F.gas) { const main = want * .95, rest = want * .05; co2 = F.gas === "co2" ? main : F.gas === "n2" ? rest * .5 : rest * .3; n2 = F.gas === "n2" ? main : F.gas === "co2" ? rest : rest * .7; ch4 = F.gas === "ch4" ? main : 0; so2 = 0; }
      else if (P > 1e-9) { const k = want / P; co2 *= k; n2 *= k; ch4 *= k; so2 *= k; }
      else { n2 = want * .8; co2 = want * .2; }
      P = co2 + n2 + ch4 + so2; keep = Math.max(keep, want > 0 ? .5 : 0);
      airWhy = `set by the game master: ${want} bar${F.gas ? ` of ${{ co2: "carbon dioxide", n2: "nitrogen", ch4: "methane" }[F.gas]}` : ""}${shore >= 6 ? " (more than its size and warmth would let it keep: something holds it, or it is young)" : ""}`;
    }
    Object.assign(out, { pressure: sig(P, 2) });

    /* its warmth: the equilibrium temperature, then the greenhouse of its air and its own vapour [a grey atmosphere,
       calibrated on Venus, Earth, Mars and Titan], then day and night, equator and pole */
    let albedo = P > 30 ? .75 : P < .001 ? (wf > .05 ? .55 : .12) : wf > .05 && teq0 < 230 && P < .1 ? .55 : albCO2(co2);
    let T = 0, tau = 0;
    const teq = 278.6 * Math.pow(I, .25) * Math.pow(1 - albedo, .25) + (tidal > 1.5 ? 20 : 0);
    let Tg = teq;
    for (let k = 0; k < 12; k++) {
      const vap = mayHaveSeas && !runaway ? Math.min(2.5, .77 * Math.exp((Tg - 288) / 30)) * Math.min(1, P) : 0;
      tau = .9 * Math.pow(co2, .45) + .035 * Math.pow(P, 1.8) + vap + 1.2 * Math.sqrt(ch4) + (Tg < 150 ? .3 * n2 : 0);
      Tg = teq * Math.pow(1 + .75 * tau, .25);
    }
    T = Tg; h2o = mayHaveSeas && !runaway ? clamp(.01 * Math.exp((T - 288) / 18), .0001, .1) : 0;
    const daynight = P > 5 ? 1 : (lock ? 1 : T * .8 / (1 + 3 * Math.pow(Math.max(P, 1e-6) / .01, .7)) * (mayHaveSeas ? 3 : 1) * Math.min(1, Math.sqrt(dayH / 24)));
    const latGrad = T * .5 / (1 + P) * (dayH > 24 * 10 ? .3 : 1);
    Object.assign(out, { albedo: r2(albedo), temp: Math.round(T), tempC: Math.round(T - 273), greenhouse: Math.round(T - teq), dayNight: Math.round(daynight), equatorPole: Math.round(latGrad) });
    why.temp = `${Math.round(teq)} K from its star's light alone (albedo ${r2(albedo)}), ${Math.round(T - teq) > 2 ? `${Math.round(T - teq)} K more from the greenhouse of its air` : "its air adds little"}${lock ? "; locked, so its warmth is by the side facing the star, not by latitude" : ""}`;
    if (lock && !host) { const night = T * (1 - .6 / (1 + 5 * P)), sub = T * (1 + .35 / (1 + 2 * P)); Object.assign(out, { tempDay: Math.round(sub), tempNight: Math.round(night) }); why.locked = P > .3 ? "its air carries enough heat to the night side to keep it from freezing out" : "its night side is cold enough for its air to freeze there over time"; }
    // seasons: tilt and an eccentric orbit, softened by thick air and seas
    out.seasons = lock ? "none" : tilt < 5 && ecc < .05 ? "almost none" : `${tilt > 35 ? "extreme" : tilt > 15 ? "marked" : "mild"}${ecc > .15 ? ", and its distance from its star changes them too" : ""}`;

    /* its liquids: water where warm and pressed enough, methane where Titan-cold, molten rock where hottest */
    const Tb = boilK(P);
    if (T > 1300) { liquid = "lava"; oceanCover = r2(.3 + r() * .6); why.liquid = "so close to its star its rock melts: seas of lava on the day side"; }
    else if (water > .00002 && T > 273 && T < Tb && P > .006) { liquid = "water"; oceanCover = water > .005 ? 1 : r2(clamp(.71 * Math.pow(water / .00023, .35), .02, 1)); why.liquid = oceanCover >= .98 ? "so much water that it covers the whole world [an ocean world]" : "warm enough and its air thick enough for seas, lakes and rivers"; }
    else if (water > .0001 && T <= 273 && T > 150 && P > .006) { liquid = mode === "iceshell" || tidal > .3 ? "subsurface" : "ice"; iceCover = 1; why.liquid = liquid === "subsurface" ? "frozen over, with an ocean beneath its ice" : "its water is frozen: ice sheets and frozen seas"; }
    else if (ch4 > 0 && T > 88 && T < 120 && P > .3) { liquid = "methane"; oceanCover = r2(.02 + r() * .1); why.liquid = "methane and ethane rain into rivers, lakes and seas [Titan]"; }
    else if (wf > .05) { liquid = mode === "iceshell" ? "subsurface" : "ice"; iceCover = 1; why.liquid = liquid === "subsurface" ? "an ocean hidden under a shell of ice, kept liquid from within" : "ice and rock, frozen through"; }
    else why.liquid = water < .00002 ? "it has almost no water" : T >= Tb ? "too hot for liquid water to stay" : "its air is too thin to hold liquid water";
    if (liquid === "water" && T < 285) iceCover = r2(clamp((285 - T) / 40, 0, .9));
    Object.assign(out, { liquid, ocean: oceanCover, ice: iceCover });

    /* its winds: the shape of its circulation by its rotation [Showman et al.: fast rotators narrow cells and several
       jets; slower than ~10 days, one cell to the poles, superrotation; locked, day to night]; their force by the air's
       density, not by speed alone */
    let regime, typical, extreme, storms;
    if (P < .001) { regime = "no air to carry weather"; typical = 0; extreme = 0; storms = "none"; }
    else {
      const cells = clamp(Math.round(3 * Math.pow(24 / dayH, .6) * Math.sqrt(R)), 1, 6);
      regime = lock ? "air rises over the point beneath its star and flows to the night side; an eastward jet along the equator" : dayH > 24 * 10 ? "one great cell each side reaching nearly to the poles; the upper air outruns the ground [superrotation: Venus, Titan]" : `${cells} cell${cells > 1 ? "s" : ""} each side of the equator${cells >= 3 ? ": trade winds, westerlies and polar winds" : ""}`;
      typical = Math.round(clamp(8 * Math.sqrt(Math.max(latGrad, daynight, 5) / 60) * Math.pow(P, -.25), .5, 80));
      extreme = Math.round(typical * (3 + r() * 3));
      storms = liquid === "water" && T > 290 && dayH < 48 ? "hurricanes over its warm seas" : P < .05 && (out.liquid === "none" || T > 250) ? "dust storms that can cover the world, fast but feeble in air so thin" : P > 30 ? "slow, crushing winds at the ground, storms high in its clouds" : liquid === "methane" ? "rare, violent methane storms" : "fronts and gales";
    }
    const rhoAir = P * 100000 * (co2 > n2 ? .044 : .028) / (8.314 * Math.max(T, 40));
    out.winds = { regime, typical, extreme, storms, push: typical ? r1(rhoAir * typical * typical / (1.2 * 100)) : 0 };
    if (typical) why.winds = `a ${typical} m/s wind there pushes like a ${r1(Math.sqrt(rhoAir / 1.2) * typical)} m/s wind on Earth`;

    /* radiation at the ground: the star's flares, the field and the air above */
    const shield = (field.startsWith("strong") ? 2 : field.startsWith("weak") ? 1 : 0) + clamp(Math.log10(Math.max(P, 1e-6) * 1000), 0, 4);
    const harsh = S.flares * 3 + (I > 2 ? 1 : 0) + (o.belts || 0) * 4;
    const rad = harsh - shield;
    out.radiation = rad > 3 ? "lethal without shielding" : rad > 1 ? "high: shielding and short stays" : rad > -1 ? "moderate" : "low, as on Earth";

    /* life, by the realism level [not every habitable world has life; few have complex life; fewer a people] */
    const chance = { hard: .25, balanced: .5, creative: .8 }[real] || .5, yearsWet = S.age;
    let life = "", lifeWhy = "";
    if (liquid === "water" && yearsWet > .8 && r() < chance) {
      const complex = yearsWet > 2.5 && r() < (real === "hard" ? .15 : real === "creative" ? .6 : .35);
      life = complex ? (r() < (real === "creative" ? .25 : .08) ? "a people of its own" : "complex life: forests and beasts") : "simple life: microbial mats and reefs";
      if (complex) { o2 = .1 + r() * .2; P += o2; }
      lifeWhy = complex ? "billions of years of seas let complex life arise; its plants filled its air with oxygen" : "life began in its seas but has not grown complex";
    } else if (liquid === "subsurface" && r() < chance * .4) { life = "microbes in its hidden ocean"; lifeWhy = "warmth from within and a hidden sea: life may live by the vents [speculative]"; }
    else if (liquid === "methane" && real !== "hard" && r() < chance * .15) { life = "strange life in its methane seas"; lifeWhy = "life of another chemistry, in liquid methane [highly speculative]"; }
    else lifeWhy = liquid === "water" ? "seas, but no life has begun there (or it is too young)" : "nowhere for life as we know it";
    // (life as the game master chose it: complex life and a people make oxygen, as on Earth; where nothing could live it
    // is said so, but allowed: it is their setting)
    if (F.life) {
      const was = life, LIFE = { none: "", simple: "simple life: microbial mats and reefs", complex: "complex life: forests and beasts", people: "a people of its own" };
      life = LIFE[F.life] != null ? LIFE[F.life] : life;
      if (/complex|people/.test(life) && !/complex|people/.test(was) && o2 === 0) { o2 = .1 + r() * .2; P += o2; }
      if (!/complex|people/.test(life) && o2 > 0) { P -= o2; o2 = 0; }
      lifeWhy = `set by the game master${life && liquid !== "water" && liquid !== "subsurface" ? " (with no liquid water, life as we know it would struggle here)" : ""}`;
    }
    out.life = life; out.lifeWhy = lifeWhy;
    // the air as it is now: composition, breathable or not
    out.pressure = sig(P, 2);
    const parts = [["carbon dioxide", co2], ["nitrogen", n2], ["oxygen", o2], ["methane", ch4], ["sulphur dioxide", so2], ["water vapour", h2o * P]].filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
    out.composition = P > 0 ? parts.map(([n, v]) => `${n} ${Math.max(.1, Math.round(v / P * 1000) / 10)}%`).join(", ") : "none";
    out.air = P < .001 ? "None to speak of" : `${P > 30 ? "Crushing" : P > 3 ? "Thick" : P < .1 ? "Thin" : ""} ${parts.slice(0, 2).map(x => x[0]).join(" and ")}`.trim();
    const breathable = o2 / P > .14 && o2 > .15 && o2 < .6 && co2 < .01 && so2 === 0 && P > .5 && P < 4;
    out.breathable = breathable; why.air = airWhy;

    /* the kind of world, read from all of it (never chosen first) */
    const kind = liquid === "lava" || mode === "tidal" ? "lava" : P > 20 && T > 500 ? "toxic" : life && breathable ? "garden" : oceanCover >= .95 ? "ocean" : liquid === "water" && oceanCover > .1 ? (breathable ? "garden" : "ocean") : liquid === "subsurface" || liquid === "ice" || (T < 180 && wf > .0001) ? (M < .005 ? "dwarf" : "ice") : P < .001 ? "barren" : so2 > 0 || (co2 > .05 && P > 2) ? "toxic" : liquid === "water" || liquid === "methane" ? "rocky" : "desert";
    out.kind = kind;
    why.class = { lava: "close enough to its star to melt", toxic: "a hothouse of thick, poisonous air", garden: "seas, mild air and life that made it breathable", ocean: "a world of water", ice: "frozen", dwarf: "small and frozen", barren: "airless rock", rocky: "rock and thin air", desert: "dry: its water lost or never there" }[kind];
    if (M > 2 && env === "rock") out.super = true;
    out.water = liquid === "water" ? (oceanCover >= .95 ? "A world ocean" : `Seas over ${Math.round(oceanCover * 100)}% of it`) : liquid === "subsurface" ? "An ocean under the ice" : liquid === "ice" ? "Frozen water" : liquid === "methane" ? "Seas and rivers of methane" : liquid === "lava" ? "Seas of molten rock" : water > .00002 ? "Water deep underground" : "";
    out.surface = mode === "iceshell" || mode === "frozen" ? "ice" : "rock";
    out.geo = { plates: "mountain ranges where plates meet, rift valleys, island arcs", squishy: "vast volcanic plains, rifts and broken highlands", stagnant: "great shield volcanoes, canyons and old impact basins", tidal: "volcanoes erupting all the time, lava lakes, sulphur plains", iceshell: "cracked ice plains, ridges and plumes", frozen: "old cratered ice" }[mode];
    out.palette = rockPalette(out, S, r);
    return finish(out, S, opt);
  }

  /* ---- habitable and landable, kept apart (the plan, 3.1.13): landable by the campaign's technology */
  const TECH = { suits: { P: 5, T: 420, g: 1.8, name: "suits and shuttles" }, armoured: { P: 100, T: 750, g: 3, name: "armoured landers" }, deep: { P: 500, T: 1100, g: 5, name: "deep-pressure craft" } };
  function finish(o, S, opt) {
    if (o.landable === false) return o;
    const t = TECH[opt.tech] || TECH.armoured, T = o.temp, P = o.pressure || 0, g = o.gravity;
    o.landable = P <= t.P && T <= t.T && g <= t.g && o.liquid !== "lava";
    o.landing = o.landable ? `possible with ${t.name}` : `beyond ${t.name}: ${[P > t.P && "the pressure", T > t.T && "the heat", g > t.g && "the gravity", o.liquid === "lava" && "its molten surface"].filter(Boolean).join(", ")}`;
    const tc = T - 273, rad = o.radiation;
    o.habitable = o.breathable && tc > -10 && tc < 35 && g > .4 && g < 1.6 && !/lethal|high/.test(rad) ? "Naturally habitable" : P > .2 && P < 5 && tc > -50 && tc < 55 && g < 2 && !/lethal/.test(rad) ? "Conditionally habitable" : o.landable ? "Hostile but landable" : "Not landable";
    // (the old names the star chart shows)
    o.hab = { "Naturally habitable": "Habitable", "Conditionally habitable": "Marginal: domes and suits", "Hostile but landable": "Hostile", "Not landable": "Uninhabitable" }[o.habitable];
    o.land = o.habitable === "Naturally habitable" ? "Open air" : o.habitable === "Conditionally habitable" ? "Suits needed" : o.landable ? "Only with specialised equipment" : "Impossible with ordinary equipment";
    return o;
  }

  /* ---- colours from what the surface is made of, the air's scattering and haze, life, and the star's light
          [iron oxide red; basalt dark; fresh ice white, old ice darkened by tholins; sulphur yellow; Rayleigh blue;
          dust butterscotch; haze orange; plants by starlight, Kiang 2007 (speculative)] */
  const PLANT = { F: ["#c79a2e", "gold and orange (speculative)"], G: ["#4f7a3a", "green"], K: ["#7a3a3a", "deep red and purple (speculative)"], M: ["#2a2230", "near-black and dark purple (speculative)"], A: ["#c9a85a", "pale gold (speculative)"] };
  function rockPalette(o, S, r) {
    // (old ice darkened: by the sun's light over ages far out, or coated by the organic matter that falls from a methane haze,
    // as Titan's is: tholins, orange-brown)
    const ice = o.ice > .5 || o.surface === "ice", oldIce = ice && (o.temp < 80 || (o.liquid === "methane" || /methane/.test(o.composition || ""))), iron = o.kind === "desert" || (o.tectonics === "stagnant" && o.pressure > .001), sulph = o.tectonics === "tidal";
    const ground = sulph ? "#c9a93a" : oldIce ? "#9b6a4a" : ice ? "#dfe8ee" : o.kind === "lava" ? "#1d1a18" : iron ? "#b0603e" : o.kind === "barren" ? "#7a746c" : o.kind === "toxic" ? "#b9a77c" : "#8a7a5a";
    const sea = o.liquid === "water" ? (o.life ? "#1f5d7a" : "#26546f") : o.liquid === "methane" ? "#2b2b2b" : o.liquid === "lava" ? "#ff5a1f" : null;
    const plant = o.life && /complex|people/.test(o.life) ? PLANT[S.cls] || PLANT.G : o.life ? ["#5f6f45", "mats of microbes (speculative tint)"] : null;
    const sky = o.pressure < .001 ? "#000000" : o.pressure > 20 ? "#d9c58a" : o.composition && /methane/.test(o.composition) && o.temp < 150 ? "#d99a4e" : o.kind === "desert" && o.pressure < .1 ? "#c8a27a" : S.cls === "M" ? "#9fa0b8" : "#7fa8d8";
    const clouds = o.pressure > 20 ? "#e8dcae" : o.pressure > .2 ? "#f2f2f2" : null;
    return { ground, sea, liquid: o.liquid, plant: plant && plant[0], plantSay: plant && plant[1], ice: ice ? (oldIce ? "#b07f62" : "#e8f0f5") : o.liquid === "water" ? "#e8f0f5" : null, sky, clouds, haze: o.pressure > 20 || (/methane/.test(o.composition || "") && o.temp < 150) };
  }
  function gasPalette(teq, env, dayH, r) {
    const bands = env === "ice" ? ["#7fc8d8", "#6ab4cc", "#8fd2e0"] : teq > 1400 ? ["#2b2522", "#3d302a", "#1e1a18"] : teq > 900 ? ["#3a5f9e", "#2f4f86", "#4a6fb0"] : teq > 150 ? ["#d9b48a", "#f0e0c8", "#b8865a", "#e8d2b0"] : ["#e8dcb8", "#d8c49a", "#f2ead4"];
    return { bands, storm: teq > 150 && teq < 900 ? "#c0522e" : "#ffffff", rings: null };
  }

  /* ---- a system: its star, its disc, its planets in order outward, their moons and rings */
  function system(cls, r, opt) {
    opt = opt || {};
    const S = star(cls, r), frost = 2.7 * Math.sqrt(Math.max(S.lum, .0005));
    const disc = clamp(S.mass * Math.pow(10, S.metal) * (.4 + r() * 1.6), .05, 4);  // the disc's mass against the Sun's
    const n = cls === "X" ? Math.floor(r() * 2) : cls === "N" || cls === "D" ? Math.floor(r() * 3) : 2 + Math.floor(r() * (cls === "M" ? 4 : 7));
    const fe = clamp(.2 + r() * .2, .15, .4);   // [one rocky make-up for the whole system: Agol 2021]
    const planets = [], belts = [];
    let a = (.02 + r() * .2) * Math.max(.3, Math.sqrt(Math.max(S.lum, .001)));
    // a hot Jupiter: about one Sun-like star in a hundred [surveys]
    const hotJ = (cls === "F" || cls === "G" || cls === "K") && r() < .012 * disc;
    for (let k = 0; k < n; k++) {
      a *= k ? 1.4 + r() * .7 : 1;
      if (hotJ && k === 0) a = .03 + r() * .04;
      const cold = a > frost;
      // the belt where a giant's pull kept a planet from forming
      if (k && r() < .1) { belts.push({ a: sig(a, 3), name: k ? "An asteroid belt" : "A dust belt", rich: r() < .4, icy: cold }); continue; }
      let M, env = "rock", wf;
      if (hotJ && k === 0) { M = 100 + r() * 900; env = "gas"; }
      else if (cold) {
        const giantP = clamp(disc * (S.mass > .6 ? .55 : .15), 0, .85);
        if (r() < giantP) { if (r() < .55) { M = 60 + Math.pow(r(), 2) * 1500 * disc; env = "gas"; } else { M = 10 + r() * 15; env = "ice"; } }
        else { M = Math.pow(10, -2.5 + r() * 2.8); wf = .1 + r() * .4; }
      } else {
        M = Math.pow(10, -1.6 + r() * 2.2) * clamp(disc, .4, 2);     // 0.025 to ~6 Earth masses
        if (M > 2 && r() < .55) env = "mini";                        // [most planets above ~2 Earth masses keep hydrogen]
        // a little water, more near the frost line [delivered late, or grown wetter further out]
        wf = Math.pow(10, -5 + r() * 2.5) * (a > frost * .5 ? 10 : 1);
      }
      const ecc = env === "gas" && r() < .3 ? r() * .4 : Math.abs((r() + r() - 1) * .08);
      const thick = env === "rock" && M > .5 && a < frost * .5;
      // (what it was made from, and the chances it drew, kept for the planet editor: worked out again with the game
      // master's changes, the chances fall the same way, so only what follows from their change changes)
      const inputs = { a, mass: M, env, wf: wf || 0, fe, ecc, cold, thick }, [rr, draws] = tape(r), p = body(S, inputs, rr, opt);
      p.inputs = inputs; p.draws = draws;
      p.n = planets.length; planets.push(p);
    }
    for (const p of planets) { const [rr, draws] = tape(r); moonsOf(p, S, rr, opt); p.moonDraws = draws; }
    return { star: S, frost: r2(frost), disc: r2(disc), planets, belts };
  }

  /* ---- moons: inside about half the Hill sphere, outside the Roche limit; giants a regular system [about 1/10,000 of
          their mass in moons], rocky worlds sometimes one great moon from an impact, or small captured ones; rings where
          something lies within the Roche limit, icy beyond the frost line */
  function moonsOf(p, S, r, opt) {
    p.moonList = []; p.rings = null;
    const hill = p.a * Math.pow(p.mass / (3 * S.mass * 332946), 1 / 3);       // AU
    const roche = 2.44 * p.radius / 23481;                                       // AU (Earth radius in AU: 1/23481)
    const giant = p.env === "gas" || p.env === "ice";
    const room = .5 * hill > roche * 4;
    if (!room) { p.moons = 0; p.moonsWhy = "too close to its star to hold a moon"; return; }
    let list = [];
    if (giant) {
      const big = p.env === "gas" ? 2 + Math.floor(r() * 4) : Math.floor(r() * 4), total = p.mass * 1e-4;
      for (let k = 0; k < big; k++) list.push({ mass: total / big * (.3 + r() * 1.4), a: roche * (3 + k * 2.2 + r()) * 1.2, regular: true, resonant: k < 3 && r() < .5 });
      const small = Math.floor(r() * 30);
      for (let k = 0; k < small; k++) list.push({ mass: 1e-7 + r() * 1e-6, a: roche * (4 + r() * 200), captured: r() < .7 });
      if (r() < (p.env === "ice" ? .9 : .5)) p.rings = { icy: p.a > S.frost * .8 || p.env === "ice", say: p.a > S.frost * .8 || p.env === "ice" ? "bright rings of ice" : "faint rings of dust" };
    } else if (p.mass > .05) {
      if (r() < .18) list.push({ mass: p.mass * (.005 + r() * .03), a: roche * (10 + r() * 40), impact: true });
      if (r() < .2) { const k = 1 + Math.floor(r() * 2); for (let i = 0; i < k; i++) list.push({ mass: 1e-9 + r() * 1e-8, a: roche * (2 + r() * 5), captured: true }); }
    }
    list = list.filter(m => m.a < .5 * hill && m.a > roche).sort((x, y) => x.a - y.a);
    p.moons = list.length;
    p.moonsWhy = giant ? "a regular system grown in its own disc, and strays it captured" : list.some(m => m.impact) ? "one great moon thrown up by a giant impact" : list.length ? "small moons it captured" : "no moons";
    p.moonList = list.slice(0, 12).map((m, i) => {
      const per = Math.sqrt(Math.pow(m.a, 3) / (p.mass / 332946)) ;  // years
      const tidal = m.resonant ? 1.5 + r() * 2 * (i === 0 ? 1 : .4) : 0;
      if (m.mass < .0005) return { n: i, small: true, mass: sig(m.mass, 2), a: sig(m.a * 149.6e6, 3), period: r1(per * 365.25), say: m.captured ? "a small captured moon" : "a small moon" };
      const wf = p.a > S.frost * .7 ? .2 + r() * .3 : .00005;
      const mb = body(S, { a: p.a, mass: m.mass, wf, env: "rock", host: { a: p.a, name: p.name }, period: per, tidal: m.resonant ? tidal : 0, belts: giant && i < 2 ? 1 : 0 }, r, opt);
      return Object.assign(mb, { n: i, distance: sig(m.a * 149.6e6, 3), period: r1(per * 365.25) });
    });
  }

  /* ---- the consistency check: rules every body must pass (the plan, 3.1.16) */
  function check(p, S) {
    const bad = [];
    const g = p.mass / (p.radius * p.radius); if (Math.abs(g - p.gravity) > .02 + .01 * g) bad.push("gravity does not match mass and radius");
    if (p.vesc && Math.abs(11.19 * Math.sqrt(p.mass / p.radius) - p.vesc) > .2 + .006 * p.vesc) bad.push("escape velocity does not match");
    if (p.year && S && Math.abs(Math.sqrt(Math.pow(p.a, 3) / S.mass) - p.year) / p.year > .02) bad.push("the year does not match the orbit (Kepler's third law)");
    if (p.liquid === "water" && (p.temp < 260 || p.temp > boilK(p.pressure || 0) + 5 || (p.pressure || 0) < .006)) bad.push("liquid water where it cannot stand");
    if (p.breathable && (p.pressure < .5 || p.temp < 230 || p.temp > 330)) bad.push("breathable air where no one could breathe");
    if (p.locked && p.dayNight == null) bad.push("locked without a day-night contrast");
    if (p.habitable === "Naturally habitable" && !p.breathable) bad.push("habitable without breathable air");
    if (p.env === "rock" && p.density > 13) bad.push("denser than any rock and iron");
    for (const m of p.moonList || []) if (!m.small) bad.push(...check(m, null).map(x => "a moon: " + x));
    return bad;
  }

  /* ---- a world worked out again with the game master's changes (the planet editor in the star chart): its own inputs
          (p.inputs: orbit, mass, water, iron) with theirs laid over them, and what they force (o.force: its crust, its
          air, its life), from the same star; its moons with it. The same changes always give the same world */
  function rework(S, p, ch, r, opt) {
    ch = ch || {};
    const i0 = p.inputs || { a: p.a, mass: p.mass, env: p.env || "rock", wf: 0, fe: .3, ecc: p.ecc || 0 };
    const inp = Object.assign({}, i0, { a: ch.a != null ? +ch.a : i0.a, mass: ch.mass != null ? +ch.mass : i0.mass, wf: ch.wf != null ? +ch.wf : i0.wf, fe: ch.fe != null ? +ch.fe : i0.fe });
    inp.cold = inp.a > (S.frost || 2.7 * Math.sqrt(Math.max(S.lum, .0005)));
    inp.thick = inp.env === "rock" && inp.mass > .5 && inp.a < (S.frost || 2.7) * .5;
    inp.force = { tect: ch.tect || null, pressure: ch.pressure != null && ch.pressure !== "" ? +ch.pressure : null, gas: ch.gas || null, life: ch.life || null };
    const q = body(S, inp, replay(ch.seed != null ? null : p.draws, r), opt);
    q.inputs = Object.assign({}, inp); delete q.inputs.force; q.draws = p.draws;
    moonsOf(q, S, replay(ch.seed != null ? null : p.moonDraws, r), opt); q.moonDraws = p.moonDraws;
    return q;
  }

  /* ---- its surface's environment (the user's request of 4 Nov 2026: "the planet's scientific properties determine its
          geography"; the plan approved that day, the workspace's reviews/2026-11-04-environments.md): which processes
          shaped its surface and how strongly, each worked out from its profile, never chosen and never a preset. The world
          generator follows it (scripts/world-invent.js, world-geology.js, world-ecology.js) and the map is drawn by it.
          [the Moon and Mercury: no air or water, so impacts are never worn away, and their great basins were flooded by
          lava (Head et al. 2011); Mars: a rigid lid, swells, shields and a rift, old channels, dust and dunes moved by its
          thin air in gales; Venus: lava plains, coronae, folded highlands, few craters after its resurfacing (Grindrod
          et al. 2010); Titan: methane lakes near the poles, rivers of methane, long dunes of organic sand near the equator
          moved by gentle winds in thick air (Lorenz et al. 2006); Io: volcanoes everywhere, no craters; Europa: an ice
          shell over an ocean, ridges and chaos, few craters] */
  const ENV_V = 2;
  function environment(p, S) {
    const P = p.pressure || 0, T = p.temp || 200, liq = p.liquid || "none", mode = p.tectonics || "stagnant", age = (S && S.age) || 4.6, W = p.winds || {}, why = {};
    const giant = p.env === "gas" || p.env === "ice" || p.env === "mini";
    if (giant) return { v: ENV_V, frame: "none", why: { frame: "a giant has no surface to stand on: its clouds and storms are its face" } };
    // (life on the surface only: microbes in an ocean under the ice leave its surface bare)
    const life0 = /complex|people/.test(p.life || "") ? "complex" : p.life ? "microbial" : "none", life = ["water", "methane"].includes(liq) ? life0 : "none";
    const surface = ["water", "methane", "lava"].includes(liq), share = surface ? clamp(p.ocean || 0, 0, 1) : 0;
    why.liquid = surface ? `seas of ${liq === "water" ? "water" : liq} over ${Math.round(share * 100)}% of it` : liq === "subsurface" ? "its ocean lies under the ice, never on the surface" : liq === "ice" ? "its water is frozen: no liquid on the surface" : "no liquid on its surface: no seas, lakes or rivers";
    // what wears it down: running liquid where it rains; old channels on a world that once had water and lost it (Mars);
    // the wind where the air can move grains, by its density and force (Mars's thin air in its gales, Titan's thick air
    // gently); ice where it flows
    const once = !surface && !!(p.inputs && p.inputs.wf > .0001) && P > .001 && T < 320;
    const fluvial = liq === "water" || liq === "methane" ? clamp(.4 + share * .6, 0, 1) : once ? .2 : 0;
    // (under crushing air the ground winds are slow and loose sand scarce: Venus has only two dune fields)
    const aeolian = P < .001 ? 0 : clamp(.25 + .25 * Math.log10(Math.max(W.push || 0, 1e-4) * 100) + (W.extreme > 40 && P < .05 ? .1 : 0), .05, 1) * (P > 20 ? .35 : 1);
    const glacial = liq === "water" && T < 285 ? clamp((p.ice || 0) * 1.4 + (T < 265 ? .3 : 0), 0, 1) : liq === "ice" && P > .006 ? .4 : 0;
    why.erosion = fluvial > .3 ? `its ${liq} rains and runs, cutting valleys` : fluvial > 0 ? "old dry channels from when water ran on it" : "nothing runs on it to cut valleys";
    why.erosion += aeolian > .15 ? `; its wind moves sand${P < .05 ? ", in gales, the air too thin for anything gentler" : ""}` : P < .001 ? "; no air, so no wind" : "; its wind is too weak to move much";
    // what survives of its impacts: nothing renews an airless, dead surface, so its craters stay; air burns up the small
    // ones; water and wind wear them; lava, moving plates and fresh ice bury them; the older the surface, the more
    const RENEW = { plates: .7, squishy: .85, tidal: 1, iceshell: .8, frozen: 0, stagnant: .15 }, renew = RENEW[mode] != null ? RENEW[mode] : .3;
    const impacts = +clamp((1 - renew) * (P < .01 ? 1 : P < .1 ? .7 : P < 1 ? .35 : P < 10 ? .15 : .05) * clamp(age / 3, .3, 1) * (fluvial > .5 ? .4 : 1), 0, 1).toFixed(2);
    const basins = impacts > .5 ? Math.round(2 + impacts * 5) : impacts > .2 ? 1 : 0;
    why.impacts = impacts > .5 ? "craters everywhere: nothing has worn them away" + (basins ? ", and great old basins" : "") : impacts > .15 ? "some craters, the rest worn away or buried" : mode === "tidal" ? "no craters: its lava buries them as fast as they come" : "few craters: its surface is renewed";
    // its volcanism, by how its insides lose their heat
    const style = { plates: "arcs", squishy: "plains", stagnant: "shields", tidal: "paterae", iceshell: "cryo", frozen: "none" }[mode] || "shields";
    const volcanism = +clamp(style === "paterae" ? 1 : style === "plains" ? .8 : style === "arcs" ? .5 : style === "cryo" ? .35 : style === "shields" ? clamp((p.heat || .3) * 1.4, .1, .6) : 0, 0, 1).toFixed(2);
    why.volcanism = { arcs: "volcanoes along the plates' edges and over hotspots", plains: "lava flooded most of it: plains, coronae, folded highlands", shields: "a rigid shell: a few great shield volcanoes on swells, and rifts", paterae: "volcanoes everywhere, lava flows and sulphur", cryo: "an ice shell cracked into ridges and chaos", none: "long dead inside" }[style];
    // its climate: belts by its turning (Earth's three each side, fewer on a slow world), evened out by thick air; a
    // locked world by its star; an airless world has none, only sunlight and shadow
    const day = p.day || 24, cells = clamp(Math.round(3 * Math.pow(24 / Math.min(day, 24 * 30), .6) * Math.sqrt(p.radius || 1)), 1, 6);
    const climate = P < .001 ? { model: "none" } : p.locked && !p.host ? { model: "locked" } : { model: "cells", cells, even: +clamp((P - 1) / (P + 4), 0, .95).toFixed(2) };
    why.climate = climate.model === "none" ? "no air: no weather, only the sun's heat and the cold of shadow" : climate.model === "locked" ? "locked to its star: warm under it, frozen on the night side" : `${cells} wind belt${cells > 1 ? "s" : ""} each side of its equator${climate.even > .3 ? ", its thick air evening out the warmth" : ""}`;
    const fall = P < .001 ? "none" : liq === "water" ? (T < 273 ? "snow" : "rain") : liq === "methane" ? "methane" : liq === "ice" ? "frost" : "none";
    // its ground where nothing grows, by what it is made of: rust-red dust, grey rock, dark basalt, sulphur, ice, organic sand
    const dry = mode === "tidal" ? "brimstone" : liq === "lava" || p.kind === "lava" ? "volcanic" : liq === "ice" || liq === "subsurface" || p.surface === "ice" ? "icesheet" : liq === "methane" ? "dunes" : p.kind === "toxic" ? "volcanic" : p.kind === "desert" ? "aliendesert" : "rock";
    const cold = liq === "water" || liq === "ice" || liq === "subsurface" ? "icesheet" : dry, high = mode === "tidal" ? "volcanic" : dry === "icesheet" ? "glacier" : dry === "rock" || dry === "volcanic" ? "rock" : dry;
    const cover = life === "none" ? { dry, forest: dry, wet: liq === "methane" ? "drylake" : dry, cold, high, liquid: liq === "methane" ? "methane" : liq === "lava" ? "lava" : "water" }
      : life === "microbial" ? { dry, forest: "bog", wet: "marsh", cold, high, liquid: liq === "methane" ? "methane" : "water" } : null;
    why.life = life === "complex" ? "life covers its land: forests and grassland in its plants' colour" : life === "microbial" ? "only microbial mats, dark stains on wet ground" : life0 !== "none" ? "its life is hidden beneath the surface: the surface is bare" : "nothing lives on it: bare ground of its own rock";
    const shores = liq === "water" ? (life === "none" ? "plain" : "beach") : liq === "methane" ? "smooth" : liq === "lava" ? "lava" : "none";
    return { v: ENV_V, frame: "globe", crust: mode, impacts, basins, volcanism, volcStyle: style, liquid: { kind: liq, share, surface }, erosion: { fluvial: +fluvial.toFixed(2), aeolian: +aeolian.toFixed(2), glacial: +glacial.toFixed(2) }, climate, fall, life, cover, shores, names: life === "complex" && liq === "water" ? "earth" : "planetary", why };
  }
  // the world generator's recipe for its surface (scripts/world-invent.js's flags): its environment, its size, gravity,
  // air, warmth and colours. The star chart's Open its surface and the workspace's dev/planet-environments.js use it alike
  function surfaceFlags(p, S, seed, opt) {
    const env = environment(p, S), tc = p.tempC, liq = env.liquid || {}, P = p.pressure || 0;
    const climate = !liq.surface && P > .001 ? "arid" : tc > 26 ? "tropical" : tc > 16 ? "warm" : tc > 4 ? "temperate" : tc > -15 ? "cold" : "polar";
    const f = { size: (opt && opt.size) || "planet", land: "masses", landmasses: p.tectonics === "plates" ? 4 : p.tectonics === "squishy" ? 5 : p.tectonics === "tidal" ? 9 : 2, climate, realism: "alien", setting: "scifi", planet: "barren", gravity: p.gravity, air: Math.max(.02, Math.min(3, P)), warmth: 0, temp: tc,
      look: "planet", seed, replace: true, regions: true, "climate-model": env.climate && env.climate.model === "locked" ? "classic" : "earth", env, envv: ENV_V, palette: p.palette || null };
    // (a world locked to its star: its air evens out day and night by its thickness)
    if (p.locked && !p.host && P > 0) f.locked = +(Math.min(.95, P / (P + 1))).toFixed(2);
    // (the globe as large as the world is: a moon or a small planet is smaller than the Earth)
    if (p.radius && Math.abs(p.radius - 1) > .03) f.km = Math.round(40030 * p.radius);
    return f;
  }
  // a random source that remembers what it gave, and one that gives the same again (then fresh ones, past its end)
  function tape(r) { const t = []; return [() => { const v = r(); t.push(v); return v; }, t]; }
  function replay(t, r) { let k = 0; return () => t && k < t.length ? t[k++] : r(); }
  // what a change does, in words: each thing that came out differently, before and after, with why where it is known
  // (the plan, 3.3: "each change shows its consequences before it is kept")
  function consequences(b, a) {
    const L = [], W = a.why || {}, same = (x, y) => x === y || (x == null && y == null) || (typeof x === "number" && typeof y === "number" && Math.abs(x - y) < 1e-9);
    const add = (lbl, x, y, why) => { if (same(x, y)) return; L.push({ what: lbl, was: x == null || x === "" ? "none" : String(x), now: y == null || y === "" ? "none" : String(y), why: why || "" }); };
    const KIND = { lava: "a lava world", rocky: "a rocky world", desert: "a desert world", ocean: "an ocean world", garden: "a living world", ice: "an ice world", barren: "a barren world", toxic: "a hothouse world", dwarf: "a dwarf planet", gas: "a gas giant", icegiant: "an ice giant", hotjupiter: "a hot Jupiter", mini: "a mini-Neptune" };
    const TECT = { plates: "moving plates", squishy: "a thick, broken lid", stagnant: "one rigid lid", tidal: "heated by tides", iceshell: "an ice shell over an ocean", frozen: "frozen through" };
    add("What kind of world", KIND[b.kind] || b.kind, KIND[a.kind] || a.kind, W.class);
    add("Gravity", b.gravity + " g", a.gravity + " g", W.gravity);
    add("Its day", b.locked ? "locked to its star" : b.day + " hours", a.locked ? "locked to its star" : a.day + " hours", W.spin);
    add("Its insides", TECT[b.tectonics] || b.tectonics, TECT[a.tectonics] || a.tectonics, W.tectonics);
    add("Magnetic field", b.field, a.field);
    add("Air", (b.pressure || 0) + " bar: " + (b.composition || "none"), (a.pressure || 0) + " bar: " + (a.composition || "none"), W.air);
    add("Warmth", b.tempC + " °C", a.tempC + " °C", W.temp);
    if (a.tempDay != null || b.tempDay != null) add("Day and night sides", b.tempDay != null ? `${b.tempDay - 273} °C and ${b.tempNight - 273} °C` : "", a.tempDay != null ? `${a.tempDay - 273} °C and ${a.tempNight - 273} °C` : "", W.locked);
    add("Liquids", b.water || "none", a.water || "none", W.liquid);
    add("Winds", b.winds && b.winds.typical ? `typically ${b.winds.typical} m/s` : "still", a.winds && a.winds.typical ? `typically ${a.winds.typical} m/s` : "still", W.winds);
    add("Radiation at the ground", b.radiation, a.radiation);
    add("Life", b.life || "none", a.life || "none", a.lifeWhy);
    add("Breathable", b.breathable ? "yes" : "no", a.breathable ? "yes" : "no");
    add("For people", b.habitable, a.habitable);
    add("Landing", b.landing, a.landing);
    add("Moons", b.moons || 0, a.moons || 0, a.moonsWhy);
    return L;
  }

  A.planets = { STAR, TECH, star, body, system, moonsOf, check, flux, lockYears, boilK, radiusOf, rework, consequences, environment, surfaceFlags, ENV_V };
  if (typeof module === "object" && module.exports) module.exports = A.planets;
})(typeof ATLAS !== "undefined" ? ATLAS : typeof window !== "undefined" ? (window.ATLAS = window.ATLAS || {}) : {});
